/* E-mail de "acesso liberado" pelo FormSubmit (o mesmo serviço do painel):
   vai para a Editora e, como resposta automática, para quem comprou. */
const EMAIL_EDITORA = 'mundo.encantado.prof@gmail.com';
async function enviarAviso({ nome, email, total, cod, nomePac }) {
  const primeiro = String(nome || '').split(' ')[0];
  const msg = 'Olá' + (primeiro ? ', ' + primeiro : '') + '! Seu pagamento foi confirmado e o acesso ao Plano de Estudo (' + nomePac + ') já está liberado. Entre em https://planodeestudo.net.br, abra a sua área e clique em "Entrar com Google" usando a conta ' + email + '. Bons estudos! Editora Mundo Encantado';
  const r = await fetch('https://formsubmit.co/ajax/' + EMAIL_EDITORA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://planodeestudo.net.br', Referer: 'https://planodeestudo.net.br/' },
    body: JSON.stringify({ _subject: 'Plano de Estudo: pagamento aprovado e acesso liberado (pedido ' + cod + ')', _template: 'table', _captcha: 'false',
      Mensagem: msg, Pedido: cod, Pacote: nomePac, Valor: 'R$ ' + Number(total || 0).toFixed(2).replace('.', ','),
      name: nome || email, email, _autoresponse: msg })
  });
  const d = await r.json().catch(() => ({}));
  return { ok: String(d.success) === 'true', motivo: String(d.message || r.status) };
}
module.exports = { enviarAviso };
