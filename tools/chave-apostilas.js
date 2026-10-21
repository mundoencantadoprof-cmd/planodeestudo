/* Cofre das apostilas em PDF: cria (uma vez) o par de chaves RSA guardado no Firestore
   (segredos/apostilas, inacessível ao site), mostra a chave pública e confere se cada
   apostilas/*.bin do repositório abre com a chave privada. */
const admin = require('../functions/node_modules/firebase-admin');
const crypto = require('crypto'), fs = require('fs'), path = require('path');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const db = admin.firestore();
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const { abrir } = require('../functions/cofre');
(async () => {
  const ref = db.doc('segredos/apostilas');
  let s = await ref.get();
  if (!s.exists) {
    const k = crypto.generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    await ref.set({ pub: k.publicKey, priv: k.privateKey, criadoEm: admin.firestore.FieldValue.serverTimestamp() });
    s = await ref.get();
    nota('Cofre', 'par de chaves criado');
  }
  nota('Chave pública', s.get('pub'));
  const dir = path.join(__dirname, '..', 'apostilas');
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.bin')) : []) {
    const pdf = abrir(fs.readFileSync(path.join(dir, f)), s.get('priv'));
    nota('Conferência ' + f, pdf.length + ' bytes, início ' + pdf.slice(0, 5).toString());
  }
})().catch(e => { console.log('::error title=Cofre::' + e.message); process.exit(1); });
