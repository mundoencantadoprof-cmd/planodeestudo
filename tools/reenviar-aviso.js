/* Reenvia o e-mail de acesso liberado de um pedido pago, pelo Gmail da Editora (uso: node tools/reenviar-aviso.js PEXXXXXX). Roda no GitHub Actions. */
const admin = require('../functions/node_modules/firebase-admin');
const { enviarAviso } = require('../functions/aviso');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
(async () => {
  const cod = process.argv[2], ref = admin.firestore().doc('pedidos/' + cod), s = await ref.get();
  if (!s.exists) throw new Error('pedido não existe');
  if (s.data().situacao !== 'pago') throw new Error('pedido não está pago');
  const r = await enviarAviso(s.data(), cod);
  if (!r) throw new Error('falta o segredo GMAIL_APP_PASSWORD');
  await ref.update({ avisoEmail: 'enviado' });
  console.log('::notice title=Reenvio do aviso::' + cod + ' enviado');
})().catch(e => { console.log('::error title=Reenvio do aviso::' + String(e.message).slice(0, 300)); process.exit(1); });
