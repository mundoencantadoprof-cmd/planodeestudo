/* Diagnóstico (só leitura): como o Mercado Pago parcela cada valor de curso nesta conta. installment_rate 0 = sem juros. */
const nota = (t, m) => console.log('::notice title=' + t + '::' + String(m).replace(/%/g, '%25').replace(/\n/g, '%0A'));
const TK = process.env.MP_ACCESS_TOKEN;
(async () => {
  for (const [nome, v, max] of [['Formação 30 h', 39.8, 2], ['Cursinho Unesp', 149.5, 5], ['Cursinho FUVEST', 239.2, 8], ['Apostila', 39.9, 1]]) {
    for (const pm of ['visa', 'master']) {
      const r = await fetch('https://api.mercadopago.com/v1/payment_methods/installments?amount=' + v + '&payment_method_id=' + pm, { headers: { Authorization: 'Bearer ' + TK } });
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) { nota(nome + ' ' + pm, r.status + ' ' + JSON.stringify(j).slice(0, 300)); continue; }
      const pc = (j[0].payer_costs || []).filter(c => c.installments <= Math.max(max, 3));
      nota(nome + ' R$ ' + v + ' ' + pm + ' (' + (j[0].issuer && j[0].issuer.name) + ')', pc.map(c => c.installments + 'x R$ ' + c.installment_amount + ' taxa ' + c.installment_rate + '% total R$ ' + c.total_amount + (c.labels && c.labels.length ? ' [' + c.labels.join(',') + ']' : '')).join(' | '));
    }
  }
})().catch(e => { console.log('::error title=Diagnóstico parcelas::' + e.message); process.exit(1); });
