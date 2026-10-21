// Formato do arquivo cifrado: [2 bytes: tamanho da chave embrulhada][chave AES embrulhada com RSA-OAEP-SHA256][IV 12][tag 16][conteúdo AES-256-GCM]
const crypto = require('crypto');
function abrir(buf, priv) {
  const n = buf.readUInt16BE(0);
  const chave = crypto.privateDecrypt({ key: priv, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, buf.subarray(2, 2 + n));
  const iv = buf.subarray(2 + n, 14 + n), tag = buf.subarray(14 + n, 30 + n);
  const d = crypto.createDecipheriv('aes-256-gcm', chave, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(buf.subarray(30 + n)), d.final()]);
}
function fechar(pdf, pub) {
  const chave = crypto.randomBytes(32), iv = crypto.randomBytes(12);
  const emb = crypto.publicEncrypt({ key: pub, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, chave);
  const c = crypto.createCipheriv('aes-256-gcm', chave, iv);
  const corpo = Buffer.concat([c.update(pdf), c.final()]);
  const h = Buffer.alloc(2); h.writeUInt16BE(emb.length);
  return Buffer.concat([h, emb, iv, c.getAuthTag(), corpo]);
}
module.exports = { abrir, fechar };
