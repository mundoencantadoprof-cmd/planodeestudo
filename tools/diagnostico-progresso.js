/* Diagnóstico do progresso (somente leitura): lista os documentos mais recentes da coleção
   "progresso" (e-mail mascarado), com os dias feitos e as questões marcadas como erradas,
   para conferir o gabarito dessas questões. */
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const db = admin.firestore();
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const mascara = e => String(e || '').replace(/^(.{3}).*(@.*)$/, '$1***$2');
(async () => {
  const s = await db.collection('progresso').get();
  const l = s.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => ((b.atualizadoEm && b.atualizadoEm.toMillis()) || 0) - ((a.atualizadoEm && a.atualizadoEm.toMillis()) || 0));
  nota('Coleção progresso', l.length + ' documentos');
  for (const v of l.slice(0, 10)) {
    const dias = Object.entries(v.dias || {}).map(([k, d]) => 'dia ' + (+k + 1) + ': ' + d.res.filter(Boolean).length + '/' + d.res.length + (d.fim ? ' fim' : '') + ' ' + new Date(d.t || 0).toISOString().slice(0, 16)).join('\n');
    const h = v.h || {}, erradas = Object.keys(h).filter(q => h[q] === false), certas = Object.keys(h).filter(q => h[q] === true);
    nota(mascara(v.id.split('__')[0]) + ' ' + v.id.split('__').slice(1).join(' '), dias + '\ncertas: ' + certas.join(',') + '\nerradas: ' + erradas.join(','));
  }
})().catch(e => { console.log('::error title=Diagnóstico::' + e.message); process.exit(1); });
