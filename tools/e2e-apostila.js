/* Teste do download das apostilas (função peApostila): a conta da Editora recebe o PDF;
   uma conta de teste sem compra é recusada. A conta de teste é apagada no fim. */
   Testa a apostila padrão e a da variável ITEM.
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const KEY = 'AIzaSyDKL3tGVBxuKPxE-JZEInW_KZYi2bf_Iqo';
const F = 'https://southamerica-east1-mundo-encantado-77c43.cloudfunctions.net/peApostila';
async function idToken(uid) {
  const ct = await admin.auth().createCustomToken(uid);
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + KEY, { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://planodeestudo.net.br/' }, body: JSON.stringify({ token: ct, returnSecureToken: true }) });
  const j = await r.json(); if (!j.idToken) throw new Error('token: ' + JSON.stringify(j).slice(0, 200)); return j.idToken;
}
async function baixar(tk) {
  const r = await fetch(F, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://planodeestudo.net.br', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ item: process.env.ITEM || 'ap-arcoiris-ei' }) });
  const b = Buffer.from(await r.arrayBuffer());
  return r.status + ' ' + (r.headers.get('content-type') || '') + ' ' + b.length + ' bytes ' + (b.slice(0, 5).toString() === '%PDF-' ? 'PDF ok' : b.slice(0, 120).toString()) + ' | CORS=' + r.headers.get('access-control-allow-origin');
}
(async () => {
  const ed = await admin.auth().getUserByEmail('mundo.encantado.prof@gmail.com');
  const tk = await idToken(ed.uid);
  nota('Editora', await baixar(tk));
  const r = await fetch(F.replace('peApostila', 'pePagamento'), { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://planodeestudo.net.br', Authorization: 'Bearer ' + tk }, body: '{}' });
  nota('pePagamento com o mesmo token', r.status + ' ' + (await r.text()).slice(0, 200));
  const t2 = await fetch(F, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  nota('peApostila sem token', t2.status + ' ' + (await t2.text()).slice(0, 200));
  const uid = 'diag-apostila';
  await admin.auth().createUser({ uid, email: 'diag.apostila@example.com', emailVerified: true }).catch(() => {});
  try { nota('Sem compra', await baixar(await idToken(uid))); } finally { await admin.auth().deleteUser(uid); }
})().catch(e => { console.log('::error title=Teste apostila::' + e.message); process.exit(1); });
