/* Pagamento do Plano de Estudo pelo Mercado Pago, com liberação automática.
   - pePagamento: recebe o pedido do site (com o login Google), confere o preço aqui no servidor,
     grava o pedido em "pedidos" e devolve o link do checkout do Mercado Pago (Pix, cartão ou boleto).
   - peWebhook: o Mercado Pago avisa quando o pagamento muda; a função consulta o pagamento direto
     na API do Mercado Pago e, se estiver aprovado, marca o pedido como pago e libera o pacote em
     acessos/{email}.planos. Mesmo banco do site Mundo Encantado.
   A chave do Mercado Pago (MP_ACCESS_TOKEN) vem do cofre do GitHub, nunca do código. */
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 5 });
const db = admin.firestore();

const PRECO = 39.9;
const CONCURSOS = {
  arcoiris: { nome: 'Arco-Íris (SP) 01/2026', cargos: {
    ei: 'Professor de Educação Infantil', peb1: 'Professor de Educação Básica I', assist: 'Professor Assistente',
    esp: 'PEB II Educação Especial', ef: 'PEB II Educação Física', mus: 'PEB II Música' } },
  echapora: { nome: 'Echaporã (SP) PS 01/2026', cargos: {
    peb1: 'PEB I – Professor de Ensino Básico I', arte: 'PEB II – Artes', esp: 'PEB II – Educação Especial',
    ef: 'PEB II – Educação Física', ing: 'PEB II – Inglês' } },
  lencois: { nome: 'Lençóis Paulista (SP) CP 03/2026', cargos: {
    dir: 'Diretor de Escola', ei1: 'Professor de Educação Infantil I', ei2: 'Professor de Educação Infantil II',
    ef1: 'Professor de Ensino Fundamental I', ef2m: 'Professor de Ensino Fundamental II – Matemática' } }
};
const SITES = ['https://mundoencantadoprof-cmd.github.io', 'https://planodeestudo.net.br', 'https://www.planodeestudo.net.br'];
const SITE_PADRAO = process.env.SITE_URL || 'https://planodeestudo.net.br/';
const MP = 'https://api.mercadopago.com';

function pacote(item) {
  const m = /^pe-([a-z0-9]+)-([a-z0-9]+)$/.exec(String(item || ''));
  const c = m && CONCURSOS[m[1]];
  return c && c.cargos[m[2]] ? { item, conc: m[1], cargo: m[2], titulo: 'Plano de Estudo · ' + c.nome + ' · ' + c.cargos[m[2]] } : null;
}
function cors(req, res) {
  const o = req.get('origin');
  if (SITES.includes(o)) res.set('Access-Control-Allow-Origin', o);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function codigo() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'PE' + Array.from(require('crypto').randomBytes(6), x => c[x % c.length]).join('');
}
async function mp(caminho, opcoes) {
  const r = await fetch(MP + caminho, Object.assign({}, opcoes, {
    headers: Object.assign({ Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN, 'Content-Type': 'application/json' }, (opcoes || {}).headers)
  }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Mercado Pago ' + r.status + ': ' + (j.message || ''));
  return j;
}
const limpa = (v, n) => String(v || '').trim().slice(0, n);

exports.pePagamento = onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  try {
    const token = String(req.get('authorization') || '').replace(/^Bearer /, '');
    const quem = await admin.auth().verifyIdToken(token).catch(() => null);
    if (!quem || !quem.email) return res.status(401).json({ erro: 'Entre com a conta Google de novo.' });
    const email = quem.email.toLowerCase();
    const b = req.body || {}, p = pacote(b.item), d = b.cadastro || {};
    if (!p) return res.status(400).json({ erro: 'Pacote desconhecido.' });
    const tel = limpa(d.tel, 15).replace(/\D/g, '');
    if (limpa(d.nome, 120).split(' ').length < 2 || tel.length < 10)
      return res.status(400).json({ erro: 'Confira o cadastro.' });
    const ac = await db.doc('acessos/' + email).get();
    if (((ac.exists && ac.data().planos) || []).includes(p.item)) return res.json({ jaLiberado: true });

    const cod = codigo();
    const origem = SITES.includes(req.get('origin')) ? (b.voltar && String(b.voltar).startsWith(req.get('origin')) ? String(b.voltar) : req.get('origin') + '/') : SITE_PADRAO;
    const volta = s => origem.split('?')[0].split('#')[0] + '?pagamento=' + s + '&pedido=' + cod + '&conc=' + p.conc + '&cargo=' + p.cargo;
    await db.doc('pedidos/' + cod).set({
      situacao: 'aguardando', forma: 'mercadopago', criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      total: PRECO, itens: [p.item], nome: limpa(d.nome, 120), email, tel,
      perfil: 'plano-de-estudo'
    });
    const pref = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify({
      items: [{ id: p.item, title: p.titulo, quantity: 1, unit_price: PRECO, currency_id: 'BRL' }],
      payer: { email, name: limpa(d.nome, 120) },
      external_reference: cod,
      statement_descriptor: 'PLANODEESTUDO',
      notification_url: 'https://southamerica-east1-' + process.env.GCLOUD_PROJECT + '.cloudfunctions.net/peWebhook',
      back_urls: { success: volta('aprovado'), pending: volta('pendente'), failure: volta('falha') },
      auto_return: 'approved'
    }) });
    await db.doc('pedidos/' + cod).update({ mpPreferencia: pref.id });
    res.json({ url: pref.init_point, pedido: cod });
  } catch (e) {
    console.error('pePagamento', e);
    res.status(500).json({ erro: 'Não foi possível abrir o pagamento agora.' });
  }
});

exports.peWebhook = onRequest(async (req, res) => {
  try {
    const tipo = req.query.type || req.query.topic || (req.body && req.body.type);
    const id = (req.body && req.body.data && req.body.data.id) || req.query['data.id'] || req.query.id;
    if (tipo !== 'payment' || !id) return res.status(200).send('ok');
    // nunca confia no aviso: consulta o pagamento direto no Mercado Pago
    const pg = await mp('/v1/payments/' + encodeURIComponent(id));
    const cod = pg.external_reference;
    if (!cod || !/^PE[A-Z0-9]{6}$/.test(cod)) return res.status(200).send('ok');
    const ref = db.doc('pedidos/' + cod);
    await db.runTransaction(async t => {
      const s = await t.get(ref);
      if (!s.exists) return;
      const pedido = s.data();
      if (pg.status === 'approved' && Number(pg.transaction_amount) >= Number(pedido.total)) {
        if (pedido.situacao === 'pago') return;
        t.update(ref, { situacao: 'pago', pagoEm: admin.firestore.FieldValue.serverTimestamp(), mpPagamento: String(pg.id), mpMeio: pg.payment_type_id || '' });
        t.set(db.doc('acessos/' + String(pedido.email).toLowerCase()),
          { planos: admin.firestore.FieldValue.arrayUnion(...pedido.itens), atualizadoEm: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pg.status) && pedido.situacao === 'aguardando') {
        t.update(ref, { situacao: 'cancelado', mpPagamento: String(pg.id), mpStatus: pg.status });
      } else {
        t.update(ref, { mpPagamento: String(pg.id), mpStatus: pg.status });
      }
    });
    res.status(200).send('ok');
  } catch (e) {
    console.error('peWebhook', e);
    res.status(500).send('erro');
  }
});
