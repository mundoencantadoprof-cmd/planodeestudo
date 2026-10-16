/* Diagnóstico do cadastro do teste grátis: chama a função peTeste como o site faz, lista os
   cadastros mais recentes da coleção "testes" (e-mail mascarado) e apaga o cadastro de diagnóstico. */
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const db = admin.firestore();
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const mascara = e => String(e || '').replace(/^(.{3}).*(@.*)$/, '$1***$2');
(async () => {
  const B = 'https://southamerica-east1-mundo-encantado-77c43.cloudfunctions.net/peTeste';
  if (process.env.ESCREVER === '1') { const r = await fetch(B, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://planodeestudo.net.br' },
    body: JSON.stringify({ conc: 'diag', cargo: 'x', nome: 'Diagnostico Sistema', email: 'diag.sistema@example.com', tel: '14900000000' }) });
  nota('peTeste', r.status + ' ' + (await r.text()) + ' | CORS=' + r.headers.get('access-control-allow-origin')); }
  const s = await db.collection('testes').get();
  const l = s.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => ((b.criadoEm && b.criadoEm.toMillis()) || 0) - ((a.criadoEm && a.criadoEm.toMillis()) || 0));
  nota('Coleção testes', l.length + ' documentos\n' + l.slice(0, 12).map(v => [v.criadoEm ? v.criadoEm.toDate().toISOString() : '-', v.tipo, v.conc, v.cargo, mascara(v.email)].join(' | ')).join('\n'));
  for (const v of l.filter(v => v.conc === 'diag')) await db.doc('testes/' + v.id).delete();
  nota('Limpeza', 'apagados ' + l.filter(v => v.conc === 'diag').length + ' documentos de diagnóstico');
})().catch(e => { console.log('::error title=Diagnóstico::' + e.message); process.exit(1); });
