/* Teste do progresso na conta Google (função peProgresso), com uma conta de teste que é apagada no fim:
   aparelho A grava o dia 3 pela metade, aparelho B grava o dia 3 completo e o dia 1 pela metade;
   a leitura tem que trazer o dia 3 concluído e o dia 1; "zerar" apaga tudo. */
const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'mundo-encantado-77c43' });
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const KEY = 'AIzaSyDKL3tGVBxuKPxE-JZEInW_KZYi2bf_Iqo';
const F = 'https://southamerica-east1-mundo-encantado-77c43.cloudfunctions.net/peProgresso';
async function idToken(uid) {
  const ct = await admin.auth().createCustomToken(uid);
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + KEY, { method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://planodeestudo.net.br/' }, body: JSON.stringify({ token: ct, returnSecureToken: true }) });
  const j = await r.json(); if (!j.idToken) throw new Error('token: ' + JSON.stringify(j).slice(0, 200)); return j.idToken;
}
const chama = (tk, corpo) => fetch(F, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://planodeestudo.net.br', Authorization: 'Bearer ' + tk }, body: JSON.stringify(corpo) }).then(async r => ({ st: r.status, cors: r.headers.get('access-control-allow-origin'), j: await r.json().catch(() => ({})) }));
(async () => {
  const sem = await fetch(F, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"acao":"todos"}' });
  nota('Sem login', sem.status);
  const uid = 'diag-progresso';
  await admin.auth().createUser({ uid, email: 'diag.progresso@example.com', emailVerified: true }).catch(() => {});
  let ok = false;
  try {
    const tk = await idToken(uid), base = { conc: 'matao', cargo: 'ei' };
    const a = await chama(tk, Object.assign({ acao: 'gravar', dias: { 2: { i: 8, res: Array(8).fill(true), fim: false, t: 1 } }, h: { mtEI001: true } }, base));
    const b = await chama(tk, Object.assign({ acao: 'gravar', dias: { 2: { i: 20, res: Array(20).fill(false), fim: true, t: 2 }, 0: { i: 3, res: [true, false, true], fim: false, t: 3 } }, h: { mtEI002: false } }, base));
    const c = await chama(tk, { acao: 'todos' });
    const d = (c.j.itens || {})['matao-ei'] || {};
    ok = a.st === 200 && b.st === 200 && d.dias && d.dias[2] && d.dias[2].fim && d.dias[0] && d.dias[0].res.length === 3 && Object.keys(d.h || {}).length === 2;
    nota('Gravar e ler', 'A=' + a.st + ' B=' + b.st + ' todos=' + c.st + ' CORS=' + c.cors + ' | dia3 fim=' + (d.dias && d.dias[2] && d.dias[2].fim) + ' dia1 resp=' + (d.dias && d.dias[0] && d.dias[0].res.length) + ' acertos guardados=' + Object.keys(d.h || {}).length + (ok ? ' | OK' : ' | FALHOU'));
    const naoAdm = await chama(tk, { acao: 'admin' });
    const ed = await admin.auth().getUserByEmail('mundo.encantado.prof@gmail.com');
    const adm = await chama(await idToken(ed.uid), { acao: 'admin' });
    const meu = (adm.j.alunos || []).find(x => x.email === 'diag.progresso@example.com');
    nota('Painel da Editora', 'aluno comum=' + naoAdm.st + ' | Editora=' + adm.st + ' alunos=' + (adm.j.alunos || []).length + ' teste aparece=' + !!meu + (meu ? ' dias=' + JSON.stringify(meu.dias) : ''));
    ok = ok && naoAdm.st === 403 && adm.st === 200 && !!meu;
    const z = await chama(tk, Object.assign({ acao: 'zerar' }, base));
    const e = await chama(tk, { acao: 'todos' });
    nota('Zerar', z.st + ' | itens depois=' + Object.keys(e.j.itens || {}).length);
  } finally { await admin.auth().deleteUser(uid); }
  if (!ok) process.exit(1);
})().catch(e => { console.log('::error title=Teste progresso::' + e.message); process.exit(1); });
// rodada 2
