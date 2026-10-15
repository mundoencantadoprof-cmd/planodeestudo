/* E-mail de "acesso liberado", enviado pelo Gmail da Editora (senha de app no segredo GMAIL_APP_PASSWORD do GitHub).
   Sem a senha, não envia nada (devolve null). Quem comprou recebe; a Editora recebe cópia oculta. */
const nodemailer = require('nodemailer');
const { pacote } = require('./catalogo');
const EMAIL_EDITORA = 'mundo.encantado.prof@gmail.com';
let transporte = null;
function correio() {
  if (!process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporte) transporte = nodemailer.createTransport({ service: 'gmail',
    auth: { user: EMAIL_EDITORA, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') } });
  return transporte;
}
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function enviarAviso(pedido, cod) {
  const t = correio();
  if (!t) return null;
  const p = pacote(pedido.itens && pedido.itens[0]);
  const nomePac = p ? p.titulo.replace('Plano de Estudo · ', '') : String(pedido.itens || '');
  const nome = String(pedido.nome || '').split(' ')[0];
  const linhas = [
    'Olá' + (nome ? ', ' + nome : '') + '!',
    'Seu pagamento foi confirmado e o acesso ao Plano de Estudo já está liberado.',
    'Pacote: ' + nomePac + (cod ? ' (pedido ' + cod + ')' : ''),
    'Como acessar, em qualquer aparelho: entre em https://planodeestudo.net.br, clique em "Entrar" no alto da página e use a conta Google ' + pedido.email + '. Em "Minha área" aparecem os seus pacotes e o botão "Continuar estudando".',
    'Bons estudos!',
    'Editora Mundo Encantado · ' + EMAIL_EDITORA
  ];
  await t.sendMail({
    from: '"Plano de Estudo · Editora Mundo Encantado" <' + EMAIL_EDITORA + '>',
    to: pedido.email, bcc: EMAIL_EDITORA, replyTo: EMAIL_EDITORA,
    subject: 'Plano de Estudo: seu acesso foi liberado',
    text: linhas.join('\n\n'),
    html: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13285E">' + linhas.map((l, i) =>
      i === 3 ? '<p>Como acessar, em qualquer aparelho: entre em <a href="https://planodeestudo.net.br">planodeestudo.net.br</a>, clique em <b>Entrar</b> no alto da página e use a conta Google <b>' + esc(pedido.email) + '</b>. Em <b>Minha área</b> aparecem os seus pacotes e o botão <b>Continuar estudando</b>.</p>'
      : '<p>' + esc(l) + '</p>').join('') + '</div>'
  });
  return { ok: true };
}
module.exports = { enviarAviso };
