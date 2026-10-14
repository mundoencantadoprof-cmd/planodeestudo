# Plano de Estudo

Plataforma de estudo para concursos, processos seletivos e vestibulinhos (Editora Mundo Encantado).

- `index.html`: o site (questões, plano diário, teste grátis e compra).
- `admin.html`: painel da administradora para conferir pagamentos e liberar acessos.
- Banco de dados: o mesmo projeto Firebase do site Mundo Encantado (coleções `pedidos` e `acessos`).
- Publicação: GitHub Pages, branch `main`, pasta raiz.
- Pagamento automático: `functions/` (Firebase Functions, região southamerica-east1). `pePagamento` cria o pedido e o checkout do Mercado Pago; `peWebhook` recebe o aviso do Mercado Pago e libera o acesso. O workflow "Publicar funções de pagamento" publica sozinho quando existem os segredos `FIREBASE_SERVICE_ACCOUNT` e `MP_ACCESS_TOKEN`. Sem as funções no ar, o site usa Pix e o link do Mercado Pago, conferidos no painel.
