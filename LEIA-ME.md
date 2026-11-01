# Plano de Estudo

Plataforma de estudo para concursos, processos seletivos e vestibulinhos (Editora Mundo Encantado).

- `index.html`: o site (questões, plano diário, teste grátis e compra).
- `admin.html`: painel da administradora para conferir pagamentos e liberar acessos.
- Banco de dados: o mesmo projeto Firebase do site Mundo Encantado (coleções `pedidos` e `acessos`).
- Publicação: GitHub Pages, branch `main`, pasta raiz.
- Pagamento automático: `functions/` (Firebase Functions, região southamerica-east1). `pePagamento` cria o pedido e o checkout do Mercado Pago; `peWebhook` recebe o aviso do Mercado Pago e libera o acesso. O workflow "Publicar funções de pagamento" publica sozinho quando existem os segredos `FIREBASE_SERVICE_ACCOUNT` e `MP_ACCESS_TOKEN`. Sem as funções no ar, o site usa Pix e o link do Mercado Pago, conferidos no painel.
- Site leve (2026-11-01): as questões não ficam mais dentro do `index.html`; ficam em `dados/q/<pool>.<hash>.json` e cada prova baixa só as suas quando é aberta. Depois de copiar um `index.html` novo (feito pelo build.py, com as questões dentro), rode na raiz `python3 tools/leve.py` e publique junto a pasta `dados/` e `img/b/`. O workflow "Site leve" confere isso em cada PR.
