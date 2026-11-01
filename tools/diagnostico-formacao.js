/* Diagnóstico (só leitura) da Formação Continuada: só CONTAGENS de pedidos, acessos e certificados,
   separando a conta da Editora das demais. Não mostra nomes nem e-mails. */
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const ED = 'mundo.encantado.prof@gmail.com';
const out = (t, m) => console.log('::' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
(async () => {
  const ped = await db.collection('pedidos').where('itens', 'array-contains', 'pe-formacao-neuro30').get();
  const pagos = ped.docs.filter(d => d.get('situacao') === 'pago');
  out('notice', 'Pedidos do curso: ' + ped.size + ' (pagos: ' + pagos.length + ', pagos por outras contas que não a Editora: ' + pagos.filter(d => String(d.get('email') || '').toLowerCase() !== ED).length + ')');
  const ac = await db.collection('acessos').where('planos', 'array-contains', 'pe-formacao-neuro30').get();
  out('notice', 'Contas com o curso liberado: ' + ac.size + ' (sem contar a Editora: ' + ac.docs.filter(d => d.id.toLowerCase() !== ED).length + ')');
  const ce = await db.collection('certificados').get();
  out('notice', 'Certificados emitidos: ' + ce.size + ' (sem contar a Editora: ' + ce.docs.filter(d => String(d.get('email') || '').toLowerCase() !== ED).length + ')');
})().catch(e => { out('error', e.message); process.exit(1); });
