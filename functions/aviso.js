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
  const ap = !!(p && p.apostila);
  if (p && p.formacao) return enviarAvisoCurso(t, pedido, cod, nome, nomePac.replace('Formação Continuada · ', ''));
  const linhas = [
    'Olá' + (nome ? ', ' + nome : '') + '!',
    ap ? 'Seu pagamento foi confirmado e a sua apostila em PDF já está liberada.' : 'Seu pagamento foi confirmado e o acesso ao Plano de Estudo já está liberado.',
    (ap ? 'Apostila: ' : 'Pacote: ') + nomePac.replace('Apostila em PDF · ', '') + (cod ? ' (pedido ' + cod + ')' : ''),
    'Como acessar, em qualquer aparelho: entre em https://planodeestudo.net.br, clique em "Entrar" no alto da página e use a conta Google ' + pedido.email + '. ' + (ap ? 'Em "Minha área", toque em "Baixar apostila" para salvar o PDF.' : 'Em "Minha área" aparecem os seus pacotes e o botão "Continuar estudando".'),
    'Bons estudos!',
    'Mundo Encantado · ' + EMAIL_EDITORA
  ];
  await t.sendMail({
    from: '"Plano de Estudo · Mundo Encantado" <' + EMAIL_EDITORA + '>',
    to: pedido.email, bcc: EMAIL_EDITORA, replyTo: EMAIL_EDITORA,
    subject: ap ? 'Plano de Estudo: sua apostila foi liberada' : 'Plano de Estudo: seu acesso foi liberado',
    text: linhas.join('\n\n'),
    html: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13285E">' + linhas.map((l, i) =>
      i === 3 ? '<p>Como acessar, em qualquer aparelho: entre em <a href="https://planodeestudo.net.br">planodeestudo.net.br</a>, clique em <b>Entrar</b> no alto da página e use a conta Google <b>' + esc(pedido.email) + '</b>. ' + (ap ? 'Em <b>Minha área</b>, toque em <b>Baixar apostila</b> para salvar o PDF.' : 'Em <b>Minha área</b> aparecem os seus pacotes e o botão <b>Continuar estudando</b>.') + '</p>'
      : '<p>' + esc(l) + '</p>').join('') + '</div>'
  });
  return { ok: true };
}
/* Curso de Formação Continuada: o acesso fica em planodeestudo.net.br/formacao. */
async function enviarAvisoCurso(t, pedido, cod, nome, curso) {
  const linhas = [
    'Olá' + (nome ? ', ' + nome : '') + '!',
    'Seu pagamento foi confirmado e a sua matrícula no curso de Formação Continuada já está liberada.',
    'Curso: ' + curso + (cod ? ' (pedido ' + cod + ')' : ''),
    'Como acessar, em qualquer aparelho: entre em https://planodeestudo.net.br/formacao, toque em "Entrar" e use a conta Google ' + pedido.email + '. O seu progresso fica guardado nessa conta.',
    'O certificado é emitido no próprio site, depois que você concluir todos os módulos e a avaliação final, a partir do prazo mínimo do curso contado da matrícula.',
    'Bons estudos!',
    'Mundo Encantado · ' + EMAIL_EDITORA
  ];
  await t.sendMail({
    from: '"Plano de Estudo · Mundo Encantado" <' + EMAIL_EDITORA + '>',
    to: pedido.email, bcc: EMAIL_EDITORA, replyTo: EMAIL_EDITORA,
    subject: 'Plano de Estudo: sua matrícula na Formação Continuada foi liberada',
    text: linhas.join('\n\n'),
    html: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13285E">' + linhas.map((l, i) =>
      i === 3 ? '<p>Como acessar, em qualquer aparelho: entre em <a href="https://planodeestudo.net.br/formacao">planodeestudo.net.br/formacao</a>, toque em <b>Entrar</b> e use a conta Google <b>' + esc(pedido.email) + '</b>. O seu progresso fica guardado nessa conta.</p>'
      : '<p>' + esc(l) + '</p>').join('') + '</div>'
  });
  return { ok: true };
}
/* E-mail do reembolso (direito de arrependimento): o aluno recebe a confirmação; a Editora recebe cópia oculta.
   Quando o Mercado Pago não devolveu sozinho (Pix direto ou erro), o assunto avisa a Editora para devolver pelo painel. */
async function enviarReembolso(pedido, cod, automatico, motivo) {
  const t = correio();
  if (!t) return null;
  const p = pacote(pedido.itens && pedido.itens[0]);
  const nomePac = p ? p.titulo.replace('Plano de Estudo · ', '').replace('Apostila em PDF · ', 'Apostila: ') : String(pedido.itens || '');
  const nome = String(pedido.nome || '').split(' ')[0];
  const valor = 'R$ ' + Number(pedido.total || 0).toFixed(2).replace('.', ',');
  const linhas = [
    'Olá' + (nome ? ', ' + nome : '') + '!',
    'Recebemos o seu pedido de reembolso (direito de arrependimento, art. 49 do Código de Defesa do Consumidor).',
    'Pacote: ' + nomePac + ' (pedido ' + cod + ') · valor ' + valor + '.',
    automatico
      ? 'O Mercado Pago já está devolvendo todo o valor, no mesmo meio de pagamento. No Pix e no saldo do Mercado Pago, o valor volta normalmente no mesmo dia; no cartão de crédito, o estorno aparece na fatura atual ou na seguinte, conforme o banco.'
      : 'A equipe Mundo Encantado vai devolver todo o valor em até 5 dias úteis e avisa você por e-mail quando terminar.',
    'O acesso a este pacote foi encerrado. Se quiser voltar a estudar, é só comprar de novo em https://planodeestudo.net.br.',
    'Mundo Encantado · ' + EMAIL_EDITORA
  ];
  await t.sendMail({
    from: '"Plano de Estudo · Mundo Encantado" <' + EMAIL_EDITORA + '>',
    to: pedido.email, bcc: EMAIL_EDITORA, replyTo: EMAIL_EDITORA,
    subject: automatico ? 'Plano de Estudo: reembolso do pedido ' + cod : 'Plano de Estudo: pedido de reembolso ' + cod + ' recebido',
    text: linhas.join('\n\n') + (motivo ? '\n\nMotivo informado: ' + motivo : ''),
    html: '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13285E">' + linhas.map(l => '<p>' + esc(l) + '</p>').join('') + '</div>'
  });
  if (!automatico) {
    await t.sendMail({
      from: '"Plano de Estudo" <' + EMAIL_EDITORA + '>', to: EMAIL_EDITORA,
      subject: 'DEVOLVER: reembolso do pedido ' + cod + ' (' + valor + ')',
      text: 'Reembolso pedido pelo aluno e NÃO feito automaticamente pelo Mercado Pago. Devolva ' + valor + ' para ' + (pedido.nome || '') + ' (' + pedido.email + ', ' + (pedido.tel || 'sem celular') + '), pedido ' + cod + ', forma ' + (pedido.forma || '') + '. Depois, no painel, marque o pedido como Reembolsado. O acesso já foi retirado.' + (motivo ? '\nMotivo: ' + motivo : '')
    });
  }
  return { ok: true };
}
module.exports = { enviarAviso, enviarReembolso };
