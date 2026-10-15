/* Reenvia o e-mail de acesso liberado de um pedido pago (uso: node tools/reenviar-aviso.js PEXXXXXX). Roda no GitHub Actions. */
const admin = require('../functions/node_modules/firebase-admin');
const { enviarAviso } = require('../functions/aviso');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const NOMES = { 'pe-lencois-dir': 'Lençóis Paulista (SP) CP 03/2026 · Diretor de Escola' };
(async () => {
  const cod = process.argv[2], ref = admin.firestore().doc('pedidos/' + cod), s = await ref.get();
  if (!s.exists) throw new Error('pedido não existe');
  const p = s.data();
  if (p.situacao !== 'pago') throw new Error('pedido não está pago');
  const r = await enviarAviso({ nome: p.nome, email: p.email, total: p.total, cod, nomePac: NOMES[p.itens[0]] || p.itens[0] });
  await ref.update({ avisoEmail: r.ok ? 'enviado' : 'falhou: ' + r.motivo });
  console.log('::notice title=Reenvio do aviso::' + cod + ' ok=' + r.ok + ' ' + r.motivo);
  if (!r.ok) process.exit(1);
})().catch(e => { console.log('::error title=Reenvio do aviso::' + e.message); process.exit(1); });
