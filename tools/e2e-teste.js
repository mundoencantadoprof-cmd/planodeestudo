/* Teste de ponta a ponta no site publicado: faz o teste grátis num cargo com um e-mail de diagnóstico,
   mostra o que o navegador mandou para a função peTeste e confere a coleção "testes". Depois apaga o diagnóstico. */
const { chromium } = require('playwright');
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const db = admin.firestore();
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A').slice(0, 3000));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const log = [];
  p.on('console', m => log.push('console ' + m.type() + ': ' + m.text().slice(0, 160)));
  p.on('request', q => { if (q.url().includes('cloudfunctions') || q.url().includes('firestore')) log.push('REQ ' + q.method() + ' ' + q.url().slice(0, 120)); });
  p.on('response', r => { if (r.url().includes('cloudfunctions')) log.push('RESP ' + r.status() + ' ' + r.url().slice(0, 100)); });
  p.on('requestfailed', q => log.push('FAIL ' + q.url().slice(0, 100) + ' ' + (q.failure() || {}).errorText));
  await p.goto('https://planodeestudo.net.br/?diag=' + Date.now(), { timeout: 120000 }); await p.waitForTimeout(4000);
  log.push('tem peTeste no código: ' + (await p.content()).includes('peTeste'));
  await p.click('[data-c="lins"]'); await p.waitForTimeout(1000);
  await p.click('[data-j="mt"]'); await p.waitForTimeout(1000);
  await p.fill('#cNome', 'Diagnostico Sistema'); await p.fill('#cEmail', 'diag.e2e@example.com'); await p.fill('#cTel', '14900000001'); await p.check('#cOk');
  await p.click('#trial'); await p.waitForTimeout(8000);
  log.push('teste liberado: ' + !!(await p.$('.trialbar')));
  nota('Navegador', log.join('\n'));
  await b.close();
  const s = await db.collection('testes').get();
  nota('Coleção testes', s.size + ' documentos: ' + s.docs.map(d => d.data().conc + '/' + d.data().cargo + '/' + d.data().tipo + '/' + String(d.data().email).slice(0, 4)).join(', '));
  let n = 0; for (const d of s.docs) if (String(d.data().email).startsWith('diag.')) { await d.ref.delete(); n++; }
  nota('Limpeza', 'apagados ' + n);
})().catch(e => { console.log('::error title=E2E::' + e.message.replace(/\n/g, ' ')); process.exit(1); });
