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
const { pacote } = require('./catalogo');
const { enviarAviso } = require('./aviso');
const { abrir } = require('./cofre');
const SITES = ['https://mundoencantadoprof-cmd.github.io', 'https://planodeestudo.net.br', 'https://www.planodeestudo.net.br'];
const SITE_PADRAO = process.env.SITE_URL || 'https://planodeestudo.net.br/';
const MP = 'https://api.mercadopago.com';

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
    const volta = s => origem.split('?')[0].split('#')[0] + '?pagamento=' + s + '&pedido=' + cod + '&conc=' + p.conc + '&cargo=' + p.cargo + (p.apostila ? '&tipo=apostila' : '');
    await db.doc('pedidos/' + cod).set({
      situacao: 'aguardando', forma: 'mercadopago', criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      total: p.preco || PRECO, itens: [p.item], nome: limpa(d.nome, 120), email, tel,
      perfil: 'plano-de-estudo'
    });
    const pref = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify({
      items: [{ id: p.item, title: p.titulo, quantity: 1, unit_price: p.preco || PRECO, currency_id: 'BRL' }],
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
    let liberado = null;
    await db.runTransaction(async t => {
      const s = await t.get(ref);
      if (!s.exists) return;
      const pedido = s.data();
      if (pg.status === 'approved' && Number(pg.transaction_amount) >= Number(pedido.total)) {
        if (pedido.situacao === 'pago') return;
        t.update(ref, { situacao: 'pago', pagoEm: admin.firestore.FieldValue.serverTimestamp(), mpPagamento: String(pg.id), mpMeio: pg.payment_type_id || '' });
        t.set(db.doc('acessos/' + String(pedido.email).toLowerCase()),
          { planos: admin.firestore.FieldValue.arrayUnion(...pedido.itens), atualizadoEm: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        liberado = pedido;
      } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pg.status) && pedido.situacao === 'aguardando') {
        t.update(ref, { situacao: 'cancelado', mpPagamento: String(pg.id), mpStatus: pg.status });
      } else {
        t.update(ref, { mpPagamento: String(pg.id), mpStatus: pg.status });
      }
    });
    if (liberado) {
      const r = await enviarAviso(liberado, cod).catch(e => ({ ok: false, motivo: e.message }));
      if (r) await ref.update({ avisoEmail: r.ok ? 'enviado' : 'falhou: ' + String(r.motivo).slice(0, 200) });
    }
    res.status(200).send('ok');
  } catch (e) {
    console.error('peWebhook', e);
    res.status(500).send('erro');
  }
});

/* peTeste: grava o cadastro do teste grátis de 1 dia na coleção "testes" pelo servidor,
   sem depender das regras do Firestore. Um documento por e-mail e outro por celular, em cada
   concurso e cargo; se já existir, fica o primeiro. Só dá a lista para o painel. */
exports.peTeste = onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  try {
    const b = req.body || {};
    const conc = limpa(b.conc, 30), cargo = limpa(b.cargo, 30), nome = limpa(b.nome, 120);
    const email = limpa(b.email, 160).toLowerCase(), tel = limpa(b.tel, 15).replace(/\D/g, '');
    if (!/^[a-z0-9]+$/.test(conc) || !/^[a-z0-9-]+$/.test(cargo) || !nome
      || !/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email) || !/^[0-9]{10,11}$/.test(tel))
      return res.status(400).json({ erro: 'Confira o cadastro.' });
    const d = { conc, cargo, nome, email, tel, criadoEm: admin.firestore.FieldValue.serverTimestamp() };
    const c = conc + '_' + cargo;
    const grava = (id, tipo) => db.doc('testes/' + id).create(Object.assign({ tipo }, d)).then(() => true, e => {
      if (e.code === 6) return false; /* já existe */
      throw e;
    });
    const [e, t] = await Promise.all([grava(c + '_e_' + email, 'e'), grava(c + '_t_' + tel, 't')]);
    res.json({ ok: true, novo: e || t });
  } catch (e) {
    console.error('peTeste', e);
    res.status(500).json({ erro: 'Não foi possível gravar agora.' });
  }
});

/* peApostila: entrega o PDF da apostila a quem comprou (ou à Editora). O arquivo fica cifrado no
   repositório público; a chave privada fica só no Firestore (segredos/apostilas). */
const REPO_APOSTILAS = 'https://raw.githubusercontent.com/mundoencantadoprof-cmd/planodeestudo/main/apostilas/';
const ADMINS = ['mundo.encantado.prof@gmail.com'];
let chaveApostilas = null;
exports.peApostila = onRequest({ memory: '1GiB', timeoutSeconds: 120 }, async (req, res) => {
  cors(req, res);
  res.set('Access-Control-Expose-Headers', 'Content-Disposition');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  try {
    const token = String(req.get('authorization') || '').replace(/^Bearer /, '');
    const quem = await admin.auth().verifyIdToken(token).catch(() => null);
    if (!quem || !quem.email) return res.status(401).json({ erro: 'Entre com a conta Google de novo.' });
    const email = quem.email.toLowerCase();
    const p = pacote((req.body || {}).item);
    if (!p || !p.apostila) return res.status(400).json({ erro: 'Apostila desconhecida.' });
    if (!ADMINS.includes(email)) {
      const ac = await db.doc('acessos/' + email).get();
      if (!((ac.exists && ac.data().planos) || []).includes(p.item)) return res.status(403).json({ erro: 'Esta apostila ainda não foi liberada para ' + email + '.' });
    }
    if (!chaveApostilas) chaveApostilas = (await db.doc('segredos/apostilas').get()).get('priv');
    const r = await fetch(REPO_APOSTILAS + p.item + '.bin');
    if (!r.ok) throw new Error('arquivo ' + r.status);
    const pdf = abrir(Buffer.from(await r.arrayBuffer()), chaveApostilas);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="apostila-' + p.conc + '-' + p.cargo + '.pdf"');
    res.status(200).send(pdf);
  } catch (e) {
    console.error('peApostila', e);
    res.status(500).json({ erro: 'Não foi possível baixar agora.' });
  }
});

/* peProgresso: guarda o progresso de estudo (dias do plano e histórico de acertos) na conta Google
   do aluno, para aparecer em qualquer aparelho ou navegador. Documento progresso/{email}__{conc}__{cargo}.
   Gravado pelo servidor (admin SDK), sem depender das regras do Firestore. */
function juntaDias(a, b) {
  const out = Object.assign({}, a || {});
  Object.entries(b || {}).forEach(([k, v]) => {
    if (!/^[0-9]{1,3}$/.test(k) || !v || !Array.isArray(v.res)) return;
    const d = { i: Math.min(+v.i || 0, 200), res: v.res.slice(0, 200).map(Boolean), fim: !!v.fim, t: +v.t || 0 };
    const o = out[k];
    if (!o || (d.fim && !o.fim) || (d.fim === !!o.fim && (d.res.length > o.res.length || (d.res.length === o.res.length && d.t > (o.t || 0))))) out[k] = d;
  });
  return out;
}
exports.peProgresso = onRequest(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  try {
    const token = String(req.get('authorization') || '').replace(/^Bearer /, '');
    const quem = await admin.auth().verifyIdToken(token).catch(() => null);
    if (!quem || !quem.email) return res.status(401).json({ erro: 'Entre com a conta Google de novo.' });
    const email = quem.email.toLowerCase(), b = req.body || {};
    if (b.acao === 'todos') {
      const q = await db.collection('progresso').where('email', '==', email).get();
      const itens = {};
      q.forEach(d => { const x = d.data(); itens[x.conc + '-' + x.cargo] = { dias: x.dias || {}, h: x.h || {} }; });
      return res.json({ ok: true, itens });
    }
    const conc = limpa(b.conc, 30), cargo = limpa(b.cargo, 30);
    if (!/^[a-z0-9]+$/.test(conc) || !/^[a-z0-9-]+$/.test(cargo)) return res.status(400).json({ erro: 'Cargo inválido.' });
    const ref = db.doc('progresso/' + email + '__' + conc + '__' + cargo);
    if (b.acao === 'zerar') { await ref.delete(); return res.json({ ok: true }); }
    if (b.acao !== 'gravar') return res.status(400).json({ erro: 'Ação inválida.' });
    const h = {};
    Object.entries(b.h || {}).slice(0, 5000).forEach(([k, v]) => { if (/^[A-Za-z0-9_-]{1,24}$/.test(k)) h[k] = !!v; });
    const r = await db.runTransaction(async tx => {
      const s = await tx.get(ref), x = s.exists ? s.data() : {};
      const dias = juntaDias(x.dias, b.dias), hh = Object.assign({}, x.h || {}, h);
      const feitos = Object.values(dias).filter(d => d.fim).length;
      tx.set(ref, { email, conc, cargo, dias, h: hh, feitos, atualizadoEm: admin.firestore.FieldValue.serverTimestamp() });
      return { dias, h: hh };
    });
    res.json(Object.assign({ ok: true }, r));
  } catch (e) {
    console.error('peProgresso', e);
    res.status(500).json({ erro: 'Não foi possível guardar o progresso agora.' });
  }
});
