/* Carrossel de banners da página inicial (5 frentes do Plano de Estudo). Aprovado pela Editora em 31/10/2026.
   Fica no lugar do topo antigo (.hero) sempre que a página inicial é desenhada. Fotos em img/carrossel/. */
(function () {
  var CSS = ".car{position:relative;margin-top:18px;border-radius:22px;overflow:hidden;box-shadow:var(--shadow);background:#0D2050}\n.car .sl{position:absolute;inset:0;opacity:0;transition:opacity .9s ease;display:flex;align-items:center;padding:clamp(24px,4vw,46px);padding-bottom:64px;background-size:cover;background-position:center;pointer-events:none}\n.car .sl.on{opacity:1;position:relative;pointer-events:auto}\n@media (min-width:761px){.car .sl{min-height:480px}}\n.car .tx{max-width:560px;color:#fff;position:relative;z-index:2}\n.car .ey{font:600 .74rem/1.3 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:#F2BE45}\n.car h2{font:700 clamp(1.7rem,3.4vw,2.6rem)/1.08 var(--f-display);margin:12px 0 12px;color:#fff}\n.car h2 span{color:#F2BE45}\n.car p{color:#E2E8F7;line-height:1.55;margin:0 0 16px;font-size:1.04rem}\n.car .ch{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}\n.car .ch b{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:7px 12px;font:700 .82rem/1 var(--f-display);color:#fff;backdrop-filter:blur(4px)}\n.car .ch b.g{background:#F2BE45;color:#13285E;border-color:#F2BE45}\n.car .bt{display:inline-flex;align-items:center;gap:8px;background:#F2BE45;color:#13285E;border:0;border-radius:999px;padding:13px 22px;font:700 1rem/1 var(--f-display);cursor:pointer;margin-right:8px}\n.car .bt.o{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45)}\n.car .nav{position:absolute;left:clamp(24px,4vw,46px);bottom:22px;display:flex;gap:8px;z-index:3}\n.car .nav i{width:9px;height:9px;border-radius:999px;background:rgba(255,255,255,.4);transition:all .3s;cursor:pointer}\n.car .nav i.on{width:30px;background:#F2BE45}\n.car .ar{position:absolute;bottom:14px;right:18px;display:flex;gap:8px;z-index:3}\n.car .ar span{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);color:#fff;display:flex;align-items:center;justify-content:center;font:700 1.1rem/1 var(--f-display);cursor:pointer}\n.car .caps{position:absolute;right:4%;top:50%;transform:translateY(-50%);width:280px;height:270px;z-index:1}\n.car .sl.cp .tx{max-width:500px}\n.car .caps img{position:absolute;width:140px;border-radius:8px;box-shadow:0 20px 34px -14px rgba(0,0,0,.65);border:3px solid #fff}\n.car .caps img:nth-child(1){left:0;top:40px;transform:rotate(-9deg)}\n.car .caps img:nth-child(2){left:130px;top:30px;transform:rotate(8deg)}\n.car .caps img:nth-child(3){left:64px;top:0;z-index:2}\n@media (max-width:760px){.car .sl{align-items:flex-end;min-height:560px;padding-top:180px}.car .caps{top:22px;right:50%;transform:translateX(50%) scale(.55);transform-origin:top center}.car .bt{margin-bottom:8px}.car .ar{display:none}}";
  var st = document.createElement('style'); st.textContent = CSS + '\n.car + .hero{display:none}'; document.head.appendChild(st);
  var B = 'img/carrossel/', TM = null;
  function slides(bg1) {
    var em = document.querySelector('[data-sec="ap"] em'), nAp = em ? parseInt(em.textContent, 10) || 0 : 0;
    /* o banner da FUVEST só aparece quando o cursinho FUVEST estiver publicado (2 ou mais cursos na seção) */
    var ec = document.querySelector('[data-sec="curso"] em'), fuvest = ec ? (parseInt(ec.textContent, 10) || 0) >= 2 : false;
    return [
      { bg: bg1, ey: 'Concursos públicos e processos seletivos', h: 'Seu plano de estudo <span>pelo edital do seu cargo</span>', p: 'Concurso (efetivação) ou processo seletivo (contratação): o método é o mesmo. Questões inéditas no formato da banca, só com o conteúdo que o edital pede para o seu cargo, em um plano diário até a véspera da prova, com correção na hora e explicação de cada resposta.', ch: ['Questões no formato da banca', 'Plano diário até a prova', '<g>1 dia grátis'], bt: [['Ver concursos', 'cp'], ['o:Ver seletivos', 'ps']] },
      { img: B + 'vest.jpg', ey: 'Vestibulares · Intensivão', h: 'Reta final com questões <span>no estilo da prova</span>', p: 'Intensivão Vestibular Unesp: questões com 5 alternativas no estilo Vunesp, organizadas por fase e por área do conhecimento, com resolução comentada e plano até o dia da prova.', ch: ['5 alternativas, estilo Vunesp', '1ª e 2ª fase', 'Resolução comentada'], bt: [['Ver vestibulares', 'vest']] },
      { img: B + 'curso.jpg', ey: 'Cursos preparatórios', h: 'Cursinho Preparatório <span>Unesp 2027</span>', p: 'Preparação organizada semana a semana até a prova: questões comentadas no estilo Vunesp, um “Para memorizar” em cada resolução e figuras explicativas. 1ª e 2ª fase em um só pacote.', ch: ['<g>5x de R$ 29,90 sem juros', 'Semana a semana', '1ª + 2ª fase'], bt: [['Conhecer o cursinho', 'curso']] },
      fuvest ? { img: B + 'fuvest.jpg', ey: 'Cursos preparatórios · Novo', h: 'Cursinho Preparatório <span>FUVEST 2028</span>', p: 'Um ano de preparação para a USP, de novembro até a prova: aulas com questões comentadas no estilo FUVEST, redação toda semana, simulados completos de 80 questões e revisão final. 1ª e 2ª fase em um só pacote.', ch: ['<g>8x de R$ 29,90 sem juros', 'Redação toda semana', '16 simulados', '1ª + 2ª fase'], bt: [['Conhecer o cursinho', 'curso']] } : null,
      { img: B + 'form.jpg', ey: 'Novo · Formação Continuada de Professores', h: 'Cursos para quem ensina, <span>com certificado</span>', p: 'Cursos livres no seu ritmo: apostila fundamentada em autores da área, atividades interativas e avaliação com correção automática. Certificado com QR Code para validação. Primeiro curso: Neurodiversidade e Aprendizagem, 30 horas.', ch: ['30 horas', 'Certificado com QR Code', '<g>2x de R$ 19,90'], bt: [['Conhecer o curso', 'fc']] },
      { img: B + 'ap.jpg', caps: 1, ey: 'Apostilas em PDF', h: 'Questões comentadas, <span>organizadas pelo edital</span>', p: 'Apostilas para imprimir ou estudar no celular, com questões no formato da prova e resolução comentada, separadas por concurso, seletivo, vestibular e cursinho. Todas têm amostra grátis.', ch: [(nAp ? nAp + ' apostilas' : 'Apostilas por edital'), 'Amostra grátis', '<g>R$ 39,90'], bt: [['Ver apostilas', 'ap']] }
    ];
  }
  function abrir(d) {
    if (d === 'fc') { location.href = '/formacao/'; return; }
    var b = document.querySelector('[data-sec="' + d + '"]'); /* usa os botões da barra de seções */
    if (b) { b.click(); window.scrollTo(0, 0); }
  }
  function montar(h) {
    var bg1 = getComputedStyle(h).backgroundImage;
    var G = innerWidth < 760 ? 'linear-gradient(180deg,rgba(9,22,58,.25) 0%,rgba(9,22,58,.85) 42%,rgba(9,22,58,.97) 100%)' : 'linear-gradient(90deg,rgba(9,22,58,.95) 0%,rgba(13,32,80,.86) 38%,rgba(19,48,110,.35) 70%,rgba(19,48,110,.1) 100%)';
    var S = slides(bg1).filter(Boolean);
    var html = '<div class="car" role="region" aria-label="Destaques do Plano de Estudo">' + S.map(function (x, i) {
      var b = x.img ? G + ',url(' + x.img + ')' : x.bg;
      return '<div class="sl' + (x.caps ? ' cp' : '') + (i ? '' : ' on') + '" style="background-image:' + b.replace(/"/g, "'") + '">' +
        (x.caps ? '<div class="caps"><img src="' + B + 'cap1.jpg" alt=""><img src="' + B + 'cap2.jpg" alt=""><img src="' + B + 'cap3.jpg" alt=""></div>' : '') +
        '<div class="tx"><span class="ey">' + x.ey + '</span><h2>' + x.h + '</h2><p>' + x.p + '</p><div class="ch">' +
        x.ch.map(function (c) { return c.indexOf('<g>') === 0 ? '<b class="g">' + c.slice(3) + '</b>' : '<b>' + c + '</b>'; }).join('') + '</div>' +
        x.bt.map(function (t) { var o = t[0].indexOf('o:') === 0; return '<button type="button" class="bt' + (o ? ' o' : '') + '" data-car="' + t[1] + '">' + (o ? t[0].slice(2) : t[0] + ' →') + '</button>'; }).join('') + '</div></div>';
    }).join('') + '<div class="nav">' + S.map(function (_, i) { return '<i' + (i ? '' : ' class="on"') + ' data-i="' + i + '"></i>'; }).join('') + '</div><div class="ar"><span data-d="-1" aria-label="Anterior">‹</span><span data-d="1" aria-label="Próximo">›</span></div></div>';
    h.insertAdjacentHTML('beforebegin', html);
    var c = h.previousElementSibling, k = 0;
    function ir(n) { var sl = c.querySelectorAll('.sl'), d = c.querySelectorAll('.nav i'); sl[k].classList.remove('on'); d[k].classList.remove('on'); k = (n + sl.length) % sl.length; sl[k].classList.add('on'); d[k].classList.add('on'); }
    function tempo() { clearInterval(TM); TM = setInterval(function () { if (!document.body.contains(c)) return clearInterval(TM); if (!document.hidden) ir(k + 1); }, 7000); }
    c.addEventListener('click', function (e) {
      var t = e.target.closest('[data-car],[data-i],[data-d]'); if (!t) return;
      if (t.dataset.car) return abrir(t.dataset.car);
      ir(t.dataset.i != null ? +t.dataset.i : k + +t.dataset.d); tempo();
    });
    var x0 = null; c.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    c.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { ir(k + (dx < 0 ? 1 : -1)); tempo(); } x0 = null; }, { passive: true });
    if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) tempo();
  }
  function checar() { var h = document.querySelector('.hero'); if (h && !(h.previousElementSibling && h.previousElementSibling.classList.contains('car'))) montar(h); }
  new MutationObserver(checar).observe(document.documentElement, { childList: true, subtree: true });
  checar();
})();
