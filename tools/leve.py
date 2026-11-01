#!/usr/bin/env python3
"""Deixa o index.html do Plano de Estudo leve (rodar na raiz do repositório depois de copiar um index.html novo).

- Tira o banco de questões (<script id="qdata">) de dentro da página e grava um arquivo por pool em dados/q/<pool>.<hash>.json.
  A página passa a ter só a lista Q_ARQ e baixa as questões de cada prova quando ela é aberta.
- Tira as imagens grandes embutidas no CSS e no rodapé (data:image) para img/b/<hash>.<ext> (ficam guardadas no navegador).
- Apaga de dados/q/ os arquivos que a página não usa mais.
Pode rodar quantas vezes quiser: se a página já estiver leve, só confere se todos os arquivos existem.
Uso: python3 tools/leve.py [pasta-do-site]
"""
import base64, hashlib, json, os, re, sys

raiz = sys.argv[1] if len(sys.argv) > 1 else '.'
pag = os.path.join(raiz, 'index.html')
s = open(pag, encoding='utf-8').read()
antes = len(s.encode())
mudou = False

def h8(b): return hashlib.sha1(b).hexdigest()[:10]

# 1) banco de questões
m = re.search(r'<script type="application/json" id="qdata">(.*?)</script>\n?', s, re.S)
if m:
    if 'function qFaltam' not in s:
        sys.exit('ERRO: o código da página não sabe baixar as questões (falta qFaltam). Use o tpl_app.js novo.')
    Q = json.loads(m.group(1).replace('<\\/', '</'))
    pools = {}
    for i, q in enumerate(Q):
        d = pools.setdefault(q['pool'], {'n': [], 'q': []})
        d['n'].append(i); d['q'].append(q)
    os.makedirs(os.path.join(raiz, 'dados/q'), exist_ok=True)
    arq = {}
    for p, d in sorted(pools.items()):
        b = json.dumps(d, ensure_ascii=False, separators=(',', ':')).encode()
        nome = 'dados/q/%s.%s.json' % (re.sub(r'[^a-z0-9_-]', '_', p.lower()), h8(b))
        caminho = os.path.join(raiz, nome)
        if not os.path.exists(caminho): open(caminho, 'wb').write(b)
        arq[p] = nome
    s = s[:m.start()] + '<script>var Q_ARQ=' + json.dumps(arq, separators=(',', ':')) + ';</script>\n' + s[m.end():]
    print('questões:', len(Q), 'em', len(arq), 'arquivos')
    mudou = True

# 2) imagens embutidas grandes fora do bloco de concursos (CSS do topo e logo do rodapé)
fim_css = s.find('var CONCURSOS=')
def troca(mm):
    global mudou
    if fim_css >= 0 and mm.start() > fim_css: return mm.group(0)
    tipo, dados = mm.group(1), mm.group(2)
    if len(dados) < 20000: return mm.group(0)
    b = base64.b64decode(dados)
    ext = {'jpeg': 'jpg', 'svg+xml': 'svg'}.get(tipo, tipo)
    nome = 'img/b/%s.%s' % (h8(b), ext)
    os.makedirs(os.path.join(raiz, 'img/b'), exist_ok=True)
    c = os.path.join(raiz, nome)
    if not os.path.exists(c): open(c, 'wb').write(b)
    mudou = True
    return nome
s = re.sub(r'data:image/([a-z+]+);base64,([A-Za-z0-9+/=]+)', troca, s)

if mudou: open(pag, 'w', encoding='utf-8').write(s)

# 3) conferência e limpeza
mq = re.search(r'var Q_ARQ=(\{.*?\});', s)
if not mq: sys.exit('ERRO: página sem Q_ARQ')
usados = set(json.loads(mq.group(1)).values())
for n in usados:
    if not os.path.exists(os.path.join(raiz, n)): sys.exit('ERRO: falta o arquivo ' + n)
pasta = os.path.join(raiz, 'dados/q')
apagados = 0
for f in os.listdir(pasta):
    if 'dados/q/' + f not in usados and f.endswith('.json'):
        os.remove(os.path.join(pasta, f)); apagados += 1
for n in re.findall(r'img/b/[0-9a-f]{10}\.[a-z]+', s):
    if not os.path.exists(os.path.join(raiz, n)): sys.exit('ERRO: falta a imagem ' + n)
print('index.html: %.1f MB -> %.1f MB; arquivos antigos apagados: %d' % (antes / 1e6, len(s.encode()) / 1e6, apagados))
