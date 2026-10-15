/* Diagnóstico de pagamentos: últimos pedidos e últimos pagamentos no Mercado Pago, e confere se o
   código Pix (copia e cola) gerado pelo Mercado Pago é válido. Não mostra nomes nem e-mails. */
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const out = (t, m) => console.log('::' + t + '::' + m.replace(/\n/g, '%0A'));
function crc16(s) { let c = 0xFFFF; for (const ch of Buffer.from(s, 'utf8')) { c ^= ch << 8; for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function campos(s) { const r = {}; let i = 0; while (i + 4 <= s.length) { const id = s.substr(i, 2), n = +s.substr(i + 2, 2); r[id] = s.substr(i + 4, n); i += 4 + n; } return r; }
async function mp(p) { const r = await fetch('https://api.mercadopago.com' + p, { headers: { Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN } }); return { status: r.status, j: await r.json().catch(() => ({})) }; }
(async () => {
  const ped = await db.collection('pedidos').orderBy('criadoEm', 'desc').limit(8).get();
  out('notice', 'Pedidos recentes:\n' + ped.docs.map(d => { const x = d.data(); return [d.id, x.situacao, x.forma, x.mpStatus || '', x.mpMeio || '', (x.itens || []).join(','), x.criadoEm && x.criadoEm.toDate().toISOString()].join(' | '); }).join('\n'));
  const me = await mp('/users/me');
  out('notice', 'Conta MP: status ' + me.status + ' site ' + me.j.site_id + ' tipo ' + (me.j.user_type || '') + ' tags ' + (me.j.tags || []).join(','));
  const pm = await mp('/v1/payment_methods');
  out('notice', 'Meios disponíveis: ' + (Array.isArray(pm.j) ? pm.j.filter(x => x.status === 'active').map(x => x.id).join(',') : JSON.stringify(pm.j).slice(0, 200)));
  const s = await mp('/v1/payments/search?sort=date_created&criteria=desc&limit=10');
  const res = (s.j.results || []);
  out('notice', 'Pagamentos recentes (' + s.status + '):\n' + res.map(p => [p.id, p.status, p.status_detail, p.payment_method_id, p.external_reference, p.transaction_amount, p.date_created].join(' | ')).join('\n'));
  for (const p of res.filter(p => p.payment_method_id === 'pix').slice(0, 3)) {
    const q = (p.point_of_interaction && p.point_of_interaction.transaction_data && p.point_of_interaction.transaction_data.qr_code) || '';
    if (!q) { out('warning', 'Pix ' + p.id + ' sem código'); continue; }
    const ok = crc16(q.slice(0, -4)) === q.slice(-4).toUpperCase();
    const f = campos(q), conta = campos(f['26'] || '');
    out(ok ? 'notice' : 'error', 'Pix ' + p.id + ' (' + p.external_reference + '): CRC ' + (ok ? 'ok' : 'INVÁLIDO') + ', tamanho ' + q.length + ', GUI ' + conta['00'] + ', tem chave/url: ' + (conta['01'] ? 'chave' : conta['25'] ? 'url' : 'nada') + ', valor ' + (f['54'] || '-') + ', expira ' + p.date_of_expiration);
  }
  process.exit(0);
})().catch(e => { out('error', 'Falhou: ' + e.message); process.exit(1); });
