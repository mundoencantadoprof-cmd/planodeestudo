/* Cursinho preparatório (tipo 'curso'): cronograma de semanas, aulas com teoria + questões,
   discursivas guiadas da 2ª fase ("Corrija como a banca") e oficinas de redação em etapas.
   Uso: CursoApp.mount(el,{cur,aulas,red,store,hoje,limite}) — cur = curriculo.json, aulas/red = mapas id → objeto. */
var CursoApp=(function(){
var D,S={v:'home'},EL,ST;
var MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],SEMANA=['dom','seg','ter','qua','qui','sex','sáb'];
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)}
function svgLimpo(x){x=String(x||'');if(!/^\s*<svg[\s>]/i.test(x))return '';return x.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi,'').replace(/(href)\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi,'')}
function memo(q){return String(q.mem||'').replace(/^\s*para memorizar\s*:\s*/i,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function inl(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
/* texto com tabelas ("a | b"), listas ("• ") e parágrafos */
function rich(t){var ls=String(t||'').split('\n'),out=[],tb=[],ul=[];
  function fl(){if(tb.length){out.push('<table class="tb">'+tb.map(function(r){return '<tr>'+r.split('|').map(function(c){return '<td>'+inl(c.trim())+'</td>'}).join('')+'</tr>'}).join('')+'</table>');tb=[]}
    if(ul.length){out.push('<ul class="lst">'+ul.map(function(x){return '<li>'+inl(x)+'</li>'}).join('')+'</ul>');ul=[]}}
  ls.forEach(function(l){if(/\s\|\s/.test(l)){if(ul.length)fl();tb.push(l)}else if(/^\s*[•\-–]\s+/.test(l)){if(tb.length)fl();ul.push(l.replace(/^\s*[•\-–]\s+/,''))}else{fl();if(l.trim())out.push('<p>'+inl(l)+'</p>')}});fl();return out.join('')}
function pre(t){return '<div class="txt">'+inl(t)+'</div>'}
function dt(iso){var d=new Date(iso+'T12:00:00');return SEMANA[d.getDay()]+', '+d.getDate()+' '+MESES[d.getMonth()]}
function get(k,d){try{var v=ST.get(k);return v==null?d:v}catch(e){return d}}
function set(k,v){try{ST.set(k,v)}catch(e){}}
function L(i){return 'ABCDE'[i]}
function areaDe(m){return {ling:'Linguagens',hum:'Humanas',nat:'Natureza e Matemática',rev:'todas as áreas'}[m]||''}
function sigla(a){return a.id.replace(/\d+$/,'')}
function aulaFeita(id){var p=get('cu-a-'+id,{});return !!p.fim}
function discFeita(id){var p=get('cu-d-'+id,{});return !!p.fim}
function redFeita(id){var p=get('cu-r-'+id,{});return !!p.fim}
function semanaDe(iso){var w=D.cur.semanas;for(var i=0;i<w.length;i++){var ds=w[i].dias;if(iso>=ds[0].data&&iso<=ds[ds.length-1].data)return w[i]}return iso<w[0].inicio?w[0]:w[w.length-1]}
function aulasDaSemana(w){var l=[];w.dias.forEach(function(d){(d.aulas||[]).forEach(function(id){l.push(id)})});return l}
function redDaSemana(w){return 'RED'+(w.n<10?'0':'')+w.n}
/* leitura em voz alta: usa a voz do site (D.falar) ou o leitor do próprio navegador */
var OUV=[];
function ouvir(t){var n=OUV.length;OUV.push(String(t||'').replace(/\*\*/g,''));return '<button type="button" class="btn ghost small ouvir" data-ouvir="'+n+'" aria-label="Ouvir em voz alta">🔊 Ouvir</button>'}
function falando(){try{return speechSynthesis.speaking}catch(e){return false}}
function calar(){if(D.calar)try{D.calar();return}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function falar(t){if(D.falar)try{D.falar(t);return}catch(e){}
  try{speechSynthesis.cancel();var vs=speechSynthesis.getVoices().filter(function(v){return /^pt[-_]?BR/i.test(v.lang)}),v=vs.filter(function(v){return /natural|online|google|luciana|felipe/i.test(v.name)})[0]||vs[0];
    (String(t).match(/[^.!?;:]+[.!?;:]*/g)||[t]).forEach(function(x){x=x.trim();if(!x)return;var u=new SpeechSynthesisUtterance(x);u.lang='pt-BR';if(v)u.voice=v;speechSynthesis.speak(u)})}catch(e){}}
function falaQ(q){return q.s.replace(/\n/g,' ')+(q.fig?' Observe a figura.':'')+' '+q.o.map(function(o,k){return 'Letra '+L(k)+': '+o+'.'}).join(' ')}
function falaR(q,r){var t=(r===q.a?'Você acertou! ':'Resposta certa: letra '+L(q.a)+'. ')+q.e;
  if(r!==q.a&&q.w[r])t+=' Sua escolha, letra '+L(r)+': '+q.w[r];
  if(q.res&&q.res.length)t+=' Resolução comentada. '+q.res.map(function(x,k){return 'Passo '+(k+1)+': '+x}).join(' ');
  if(q.peg)t+=' Pegadinha: '+q.peg;if(q.mem)t+=' Para memorizar: '+memo(q);return t}
function simDe(iso){var n=0,id=null;D.cur.semanas.forEach(function(w){w.dias.forEach(function(d){if(d.sabado==='simulado'||d.simulado){n++;if(d.data===iso)id='SIM'+n}})});return id}
function temSim(id){return !!(D.sims&&D.sims[id])}
/* carregamento sob demanda: o site passa D.carregar(ids,cb), que preenche D.aulas/D.sims e chama cb */
var TENTOU={};
/* teste grátis: D.limite={semanas:n,comprar:fn} trava tudo o que é de semanas depois de n */
function semanaDoId(id){if(!id)return 0;var m;
  if(/^REV-/.test(id))return semanaDe(id.slice(4)).n;
  if((m=/^SIM(\d+)$/.exec(id))){var k=0,n=0;D.cur.semanas.forEach(function(w){w.dias.forEach(function(d){if(d.sabado==='simulado'||d.simulado){k++;if(k===+m[1])n=w.n}})});return n}
  if((m=/^RED(\d+)$/.exec(id)))return +m[1];
  var a=D.cur.aulas.filter(function(y){return y.id===id})[0];return a?a.semana:0}
function travado(id){return !!(D.limite&&semanaDoId(id)>D.limite.semanas)}
function semTravada(n){return !!(D.limite&&n>D.limite.semanas)}
function vTrava(){return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">🔒 Curso completo</span><h2>Disponível no curso completo</h2><p>No teste grátis você tem a semana '+(D.limite.semanas>1?'1 a '+D.limite.semanas:'1')+' e o método. As 28 semanas, os simulados, as discursivas e as oficinas de redação ficam liberados com a compra.</p><div class="row"><button type="button" class="btn gold" data-comprar>Quero o curso completo</button></div></div>'}
/* compra por fase: D.fases={f1:bool,f2:bool,comprar:fn(fase)}; sem D.fases tudo liberado */
function temFase(f){return !D.fases||!!D.fases[f]}
function faseDaView(){return S.v==='aula'||S.v==='sim'||S.v==='rev'||S.v==='cart'?'f1':S.v==='f2'||S.v==='disc'||S.v==='red'?'f2':null}
function nomeFase(f){return f==='f1'?'1ª fase':'2ª fase'}
function vTravaFase(f){return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">🔒 '+nomeFase(f)+'</span><h2>Disponível no curso da '+nomeFase(f)+'</h2><p>'+(f==='f1'?'O curso da 1ª fase traz os 230 blocos de questões comentadas no estilo da Vunesp, os dias de revisão, os 8 simulados com cronômetro e a revisão dos erros.':'O curso da 2ª fase traz as 230 discursivas guiadas, com correção como a banca, e as 28 oficinas de redação.')+'</p><div class="row"><button type="button" class="btn gold" data-comprarfase="'+f+'">Quero o curso da '+nomeFase(f)+'</button></div></div>'}
function trFase(h,f){return temFase(f)?h:h.replace(/<span class="ck">[^<]*<\/span>/,'<span class="ck">🔒</span>')}
function viewTravada(){if(!D.limite)return false;
  if((S.v==='aula'||S.v==='disc'||S.v==='sim'||S.v==='red')&&travado(S.id))return true;
  if(S.v==='f2'&&semTravada(S.sem2))return true;return false}
function precisa(){var l=[];
  if((S.v==='aula'||S.v==='disc')&&S.id)l.push(S.id);
  if(S.v==='sim'&&S.id)l.push(S.id);
  if(S.v==='f2'&&S.sem2)l=l.concat(aulasDaSemana(D.cur.semanas[S.sem2-1]));
  if(S.v==='rev'||S.v==='cart'||S.v==='home'){D.cur.aulas.forEach(function(m){if(get('cu-a-'+m.id,null))l.push(m.id)});
    D.cur.semanas.forEach(function(w){w.dias.forEach(function(d){if(get('cu-a-REV-'+d.data,null))l.push('REV-'+d.data);var si=simDe(d.data);if(si&&get('cu-s-'+si,null))l.push(si)})})}
  return l.filter(function(id){return !(D.aulas[id]||temSim(id))&&!TENTOU[id]&&!travado(id)})}
function go(v){for(var k in v)S[k]=v[k];render();try{EL.scrollIntoView({block:'start'})}catch(e){}}

/* ---------- início: hoje + cronograma ---------- */
function vHome(){
  var hoje=D.hoje(),w=semanaDe(hoje),tot=D.cur.aulas.length,feitas=D.cur.aulas.filter(function(a){return aulaFeita(a.id)}).length;
  var fim=new Date(D.cur.fim+'T12:00:00'),dias=Math.max(0,Math.ceil((fim-new Date(hoje+'T12:00:00'))/864e5));
  var nd=D.cur.aulas.filter(function(a){return D.aulas[a.id]}).length;
  var so2=!temFase('f1')&&temFase('f2'),so1=temFase('f1')&&!temFase('f2');
  if(so2){feitas=D.cur.aulas.filter(function(a){return discFeita(a.id+'-d1')}).length}
  var h='<div class="card hero"><span class="eyebrow">Cursinho Preparatório Unesp 2027'+(so1?' · 1ª fase':so2?' · 2ª fase':'')+'</span><h2>Semana '+w.n+' de '+D.cur.semanas.length+'</h2>'+
    '<p class="small">Do dia 02/11/2026 a 15/05/2027: '+(so1?'todo o conteúdo da 1ª fase, em ordem, com questões inéditas no estilo da Vunesp, resolução comentada de cada uma, dias de revisão e simulados.':so2?'discursivas guiadas de todas as matérias, com correção como a banca, e uma oficina de redação por semana.':'todo o conteúdo da 1ª e da 2ª fase, em ordem, com questões inéditas no estilo da Vunesp e resolução comentada de cada uma, discursivas guiadas e oficinas de redação.')+'</p>'+
    '<div class="bar"><i style="width:'+Math.round(100*feitas/tot)+'%"></i></div><p class="small">'+feitas+' de '+tot+(so2?' discursivas concluídas':' blocos de questões concluídos')+'</p>'+
    '<div class="stats"><div><b>'+dias+'</b><span>dias até 15/05</span></div><div><b>'+tot+'</b><span>'+(so2?'discursivas':'blocos de questões')+'</span></div><div><b>'+D.cur.semanas.length+'</b><span>semanas</span></div></div></div>';
  if(D.metodo)h+='<button type="button" class="item card" data-met="" style="padding:14px 16px;margin:14px 0"><span class="mt sim">MÉTODO</span><span class="tt"><b>Comece aqui: o método</b><br><span class="small">Como estudar, como resolver as objetivas, o que cada verbo de comando pede e o método RJC das discursivas</span></span></button>';
  var ne=errosPendentes().length;
  if(temFase('f1'))h+='<div class="duo"><button type="button" class="btn ghost" data-rev>Revisão dos erros'+(ne?' ('+ne+')':'')+'</button><button type="button" class="btn ghost" data-cart>Cartões para memorizar</button></div>';
  var d=null;w.dias.forEach(function(x){if(x.data===hoje)d=x});d=d||w.dias[0];
  h+='<div class="card"><span class="eyebrow">Hoje · '+dt(d.data)+'</span>'+itensDia(d,w)+'</div>';
  h+='<h3 style="margin-top:22px">Cronograma</h3><p class="small">Toque numa semana para ver os dias. De segunda a sexta são dois blocos de questões, um de cada área; sábado é dia da 2ª fase (ou do simulado do mês); domingo é a oficina de redação.</p>';
  D.cur.semanas.forEach(function(s){var at=s===w,ab=S.sem!=null?S.sem===s.n:at;
    var ids=aulasDaSemana(s),ok=ids.filter(aulaFeita).length;
    var nome=s.tipo==='revisao'?'Semana de revisão (Natal)':s.tipo==='retafinal'?'Reta final: revisão e simulados':ids.length+' blocos';
    h+='<div class="sem'+(at?' atual':'')+'"><button type="button" data-sem="'+s.n+'" aria-expanded="'+ab+'"><b>Semana '+s.n+'</b><span>'+nome+'</span><span class="small">'+dt(s.dias[0].data).replace(/^\w+, /,'')+(ids.length?' · '+ok+'/'+ids.length:'')+'</span></button>'+
      (ab?s.dias.map(function(x){return '<div class="dia'+(x.data===hoje?' hoje':'')+'"><div class="dt">'+dt(x.data)+(x.data===hoje?' · hoje':'')+'</div>'+itensDia(x,s)+'</div>'}).join(''):'')+'</div>'});
  if(D.previa&&nd<tot)h+='<p class="small">Prévia: nesta versão está pronta a semana 1. As demais aparecem no cronograma e entram no curso completo.</p>';
  return h}
function itensDia(x,w){var h='',f1=function(t){h+=trFase(t,'f1')},f2=function(t){h+=trFase(t,'f2')},hh;
  (x.aulas||[]).forEach(function(id){var a=D.cur.aulas.filter(function(y){return y.id===id})[0];
    f1('<button type="button" class="item'+(aulaFeita(id)?' ok':'')+'" data-aula="'+id+'"><span class="ck">'+(aulaFeita(id)?'✓':'')+'</span><span class="mt '+a.area+'">'+sigla(a)+'</span><span class="tt">'+esc(a.titulo)+'</span></button>')});
  if(x.sabado==='fase2'){var ids=aulasDaSemana(w),n=ids.filter(function(id){return discFeita(id+'-d1')}).length;
    f2('<button type="button" class="item'+(ids.length&&n===ids.length?' ok':'')+'" data-f2="'+w.n+'"><span class="ck">'+(ids.length&&n===ids.length?'✓':'')+'</span><span class="mt f2">2ª FASE</span><span class="tt">Discursivas guiadas da semana'+(ids.length?' ('+n+'/'+ids.length+')':'')+' + revisão</span></button>')}
  if(x.sabado==='simulado'||x.simulado){var sid=simDe(x.data),sp=get('cu-s-'+sid,{}),st=D.sims&&D.sims[sid];
    f1('<button type="button" class="item'+(sp.fim?' ok':'')+'" data-sim="'+sid+'"><span class="ck">'+(sp.fim?'✓':'')+'</span><span class="mt sim">SIMULADO</span><span class="tt">'+(st?esc(st.titulo):'Simulado da 1ª fase')+': 90 questões, 5 horas'+(sp.fim?' · '+sp.nota+'/90':'')+'</span></button>')}
  if(x.domingo){var r=redDaSemana(w);f2('<button type="button" class="item'+(redFeita(r)?' ok':'')+'" data-red="'+r+'"><span class="ck">'+(redFeita(r)?'✓':'')+'</span><span class="mt red">REDAÇÃO</span><span class="tt">Oficina de redação'+(D.red[r]?': '+esc(D.red[r].tema):'')+'</span></button>')}
  if(x.revisao||(!(x.aulas&&x.aulas.length)&&!x.sabado&&!x.domingo)){var rid='REV-'+x.data,ra=D.aulas[rid];
    f1('<button type="button" class="item'+(aulaFeita(rid)?' ok':'')+'" data-aula="'+rid+'"><span class="ck">'+(aulaFeita(rid)?'✓':'')+'</span><span class="mt sim">REVISÃO</span><span class="tt">'+(ra?esc(ra.titulo):'Revisão do dia')+': 15 questões das aulas anteriores</span></button>')}
  if(semTravada(w.n))h=h.replace(/<span class="ck"><\/span>/g,'<span class="ck">🔒</span>');
  return h}

/* ---------- aula = bloco de questões comentadas → resultado com cartões para memorizar ---------- */
function vAula(){var a=D.aulas[S.id],meta=D.cur.aulas.filter(function(y){return y.id===S.id})[0];
  if(!a&&!meta)return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Revisão</span><h2>Revisão do dia</h2><p>Este bloco de revisão abre no dia marcado no cronograma.</p></div>';
  if(!a)return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">'+esc(meta.materia)+'</span><h2>'+esc(meta.titulo)+'</h2><p>Este bloco de questões faz parte do curso completo e abre na semana '+meta.semana+' ('+dt(meta.data)+').</p></div>';
  var p=get('cu-a-'+a.id,{q:{}});p.q=p.q||{};
  var h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">'+esc(a.materia)+' · '+areaDe(a.area)+'</span><h2>'+esc(a.titulo)+'</h2>';
  if(S.step===1)return h+vResultado(a,p)+'</div>';
  var n=a.questoes.length,f=a.questoes.filter(function(q){return p.q[q.id]!=null}).length;
  h+='<div class="bar lt"><i style="width:'+Math.round(100*f/n)+'%"></i></div><p class="small">'+f+' de '+n+' questões · da mais fácil para a mais difícil. Depois de responder, leia a resolução e guarde o "Para memorizar".</p>';
  return h+vQuestao(a.questoes,S.qi||0,p.q,'aula')+'</div>'}
function vQuestao(lista,i,resp,modo){var q=lista[i],r=resp[q.id],h='';
  h+='<div class="row between" style="margin-top:12px"><span class="tag">Questão '+(i+1)+' de '+lista.length+' · '+esc(q.as)+'</span><span class="row" style="gap:6px">'+ouvir(falaQ(q))+(q.nivel?'<span class="nivel">'+esc({facil:'fácil',medio:'média',dificil:'difícil'}[q.nivel]||q.nivel)+'</span>':'')+'</span></div><div class="stem">'+inl(q.s)+'</div>'+(q.fig?'<div class="fig">'+svgLimpo(q.fig)+'</div>':'');
  var prova=modo==='sim';
  q.o.forEach(function(o,k){var cl=prova?(k===r?' sel':''):r==null?'':k===q.a?' cert':k===r?' err':'';
    h+='<button type="button" class="op'+cl+'" data-op="'+k+'"'+(r!=null&&!prova?' disabled':'')+'><b>'+L(k)+')</b><span>'+inl(o)+'</span></button>'});
  if(r!=null&&!prova){h+='<div class="row end">'+ouvir(falaR(q,r)).replace('🔊 Ouvir','🔊 Ouvir a explicação')+'</div><div class="box '+(r===q.a?'ok':'bad')+'"><b>'+(r===q.a?'Você acertou!':'Resposta certa: '+L(q.a)+'.')+'</b> '+inl(q.e)+(r!==q.a&&q.w[r]?'<p class="small"><b>Sua escolha ('+L(r)+'):</b> '+inl(q.w[r])+'</p>':'')+'</div>';
    if(q.res&&q.res.length)h+='<h4>Resolução comentada</h4><ol class="lst res">'+q.res.map(function(x){return '<li>'+inl(x)+'</li>'}).join('')+'</ol>';
    if(q.peg)h+='<div class="box blue"><b>Pegadinha:</b> '+inl(q.peg)+'</div>';
    if(q.mem)h+='<div class="mem"><span class="eyebrow">Para memorizar</span><p>'+inl(memo(q))+'</p></div>';
    h+='<details><summary class="small">Por que as outras alternativas estão erradas</summary>'+q.w.map(function(w,k){return w?'<p class="small"><b>'+L(k)+')</b> '+inl(w)+'</p>':''}).join('')+'</details>'}
  var ult=i>=lista.length-1;
  h+='<div class="row between" style="margin-top:12px"><button type="button" class="btn ghost small" data-qi="'+(i-1)+'"'+(i?'':' disabled')+'>Anterior</button>'+
    (!ult?'<button type="button" class="btn small" data-qi="'+(i+1)+'">Próxima</button>':prova?'<button type="button" class="btn small gold" data-simfim>Entregar o simulado</button>':modo==='aula'?'<button type="button" class="btn small" data-st="1">Ver resultado</button>':'<button type="button" class="btn small" data-home>Terminar</button>')+'</div>';
  return h}
function vResultado(a,p){var n=a.questoes.length,c=0,f=0;a.questoes.forEach(function(q){if(p.q[q.id]!=null){f++;if(p.q[q.id]===q.a)c++}});
  var erradas=a.questoes.filter(function(q){return p.q[q.id]!=null&&p.q[q.id]!==q.a});
  return '<p class="score">'+c+' / '+n+'</p><p>'+(f<n?'Você respondeu '+f+' de '+n+' questões.':c>=n*0.8?'Excelente! Este assunto está dominado.':c>=n*0.6?'Bom resultado. As que você errou voltam na revisão dos próximos dias.':'Refaça este bloco amanhã: as que você errou também voltam na revisão.')+'</p>'+
    '<div class="bar lt"><i style="width:'+Math.round(100*c/n)+'%"></i></div>'+
    (erradas.length?'<p class="small">'+erradas.length+' questão(ões) foram para a sua <b>revisão dos erros</b>.</p>':'')+
    '<h4>Cartões para memorizar</h4><p class="small">Releia antes de dormir e de novo amanhã cedo. É assim que fixa.</p><div class="flash">'+a.questoes.map(function(q){return q.mem?'<div>'+inl(memo(q))+'</div>':''}).join('')+'</div>'+
    '<div class="row" style="margin-top:14px"><button type="button" class="btn" data-fimaula>'+(p.fim?'Bloco concluído ✓':'Concluir o bloco')+'</button><button type="button" class="btn ghost" data-refaz>Refazer as questões</button></div>'}
/* revisão: questões erradas em blocos anteriores voltam até você acertar */
function errosPendentes(){var l=[],vis={},ok=get('cu-rev',{});
  function add(q,r){if(r!=null&&r!==q.a&&!ok[q.id]&&!vis[q.id]){vis[q.id]=1;l.push(q)}}
  D.cur.aulas.forEach(function(m){var a=D.aulas[m.id];if(!a)return;var p=get('cu-a-'+m.id,{});p.q=p.q||{};a.questoes.forEach(function(q){add(q,p.q[q.id])})});
  Object.keys(D.aulas).forEach(function(id){if(id.indexOf('REV-')!==0)return;var p=get('cu-a-'+id,{});p.q=p.q||{};D.aulas[id].questoes.forEach(function(q){add(q,p.q[q.id])})});
  if(D.sims)Object.keys(D.sims).forEach(function(id){var p=get('cu-s-'+id,{});if(!p.fim)return;D.sims[id].questoes.forEach(function(q){add(q,(p.r||{})[q.id])})});
  return l}
function vRev(){var h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Revisão dos erros</span><h2>Questões que você errou</h2>';
  var l=S.revLista||[];if(!l.length)return h+'<p>Nenhuma questão pendente. Cada questão que você errar volta aqui até você acertar.</p></div>';
  return h+'<p class="small">Acertou agora? Ela sai da revisão. Errou de novo? Continua aqui para outro dia.</p>'+vQuestao(l,S.qi||0,S.revResp||{},'rev')+'</div>'}
function vCartoes(){var h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Cartões para memorizar</span><h2>Tudo o que você já estudou</h2><p class="small">Os pontos-chave de cada bloco que você concluiu, por matéria.</p>',por={};
  D.cur.aulas.forEach(function(m){var a=D.aulas[m.id];if(!a||!aulaFeita(m.id))return;(por[a.materia]=por[a.materia]||[]).push(a)});
  var ks=Object.keys(por);if(!ks.length)return h+'<p>Conclua um bloco de questões para os cartões aparecerem aqui.</p></div>';
  ks.forEach(function(k){h+='<h4>'+esc(k)+'</h4>'+por[k].map(function(a){return '<details class="box blue"><summary><b>'+esc(a.titulo)+'</b></summary><div class="flash" style="margin-top:8px">'+a.questoes.map(function(q){return q.mem?'<div>'+inl(memo(q))+'</div>':''}).join('')+'</div></details>'}).join('')});
  return h+'</div>'}
/* ---------- 2ª fase: lista da semana e discursiva guiada ---------- */
function vF2(){var w=D.cur.semanas[S.sem2-1],ids=aulasDaSemana(w).filter(function(id){return D.aulas[id]});
  var h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Sábado da 2ª fase · semana '+w.n+'</span><h2>Discursivas guiadas</h2>'+
    '<p>Na 2ª fase da Unesp são 36 questões discursivas, cada uma vale 2 pontos (geralmente 1 ponto no item a e 1 no item b). Aqui você treina do jeito que a banca corrige: entende o comando, pede pistas se travar, escreve, corrige respostas de outros candidatos e só então compara com a resposta modelo.</p></div>';
  if(!ids.length)return h+'<div class="card"><p>As discursivas desta semana fazem parte do curso completo.</p></div>';
  ids.forEach(function(id){var d=D.aulas[id].discursiva,p=get('cu-d-'+d.id,{});
    h+='<button type="button" class="item card'+(p.fim?' ok':'')+'" data-disc="'+id+'" style="margin:8px 0;padding:14px"><span class="ck">'+(p.fim?'✓':'')+'</span><span class="mt '+D.aulas[id].area+'">'+sigla(D.aulas[id])+'</span><span class="tt"><b>'+esc(cap(d.tema))+'</b><br><span class="small">'+esc(d.materia)+(p.fim?' · sua nota: '+String(p.nota).replace('.',',')+' / 2':'')+'</span></span></button>'});
  return h}
var PASSOS_D=['Entenda','Pistas','Escreva','Corrija como a banca','Gabarito e nota'];
function vDisc(){var a=D.aulas[S.id],d=a.discursiva,p=get('cu-d-'+d.id,{r:{},b:{},c:[]}),st=S.step||0;
  p.r=p.r||{};p.b=p.b||{};p.c=p.c||[];
  var h='<button class="back" data-f2="'+S.sem2+'">‹ Discursivas da semana</button><div class="card"><span class="eyebrow">2ª fase · '+esc(d.materia)+' · vale 2 pontos</span><h2>'+esc(cap(d.tema))+'</h2>'+
    '<div class="steps">'+PASSOS_D.map(function(n,i){return '<button type="button" data-st="'+i+'" class="'+(i===st?'on':'')+'">'+(i+1)+'. '+n+'</button>'}).join('')+'</div>'+
    '<div class="row end">'+ouvir(d.s)+'</div><div class="stem">'+inl(d.s)+'</div>';
  if(st===0){h+='<h4>O que cada item pede</h4><p class="small">Na 2ª fase, muita gente perde ponto por responder outra coisa. Antes de escrever, veja o verbo de comando.</p>'+
      d.comando.map(function(c){return '<div class="box blue"><b>Item '+esc(c.item)+') · '+esc(c.verbo)+'</b><p>'+inl(c.pede)+'</p></div>'}).join('')+
      (metParte('verbos')!=null?'<button type="button" class="btn ghost small" data-met="'+metParte('verbos')+'">O que cada verbo de comando pede</button>':'')+'<h4>Erros que mais tiram ponto aqui</h4><ul class="lst">'+d.erros.map(function(x){return '<li>'+inl(x)+'</li>'}).join('')+'</ul>'}
  if(st===1){var np=p.pistas||0;h+='<p class="small">Travou? Revele uma pista de cada vez. Tente escrever depois de cada uma.</p>'+
      d.pistas.slice(0,np).map(function(x,i){return '<div class="pista"><b>Pista '+(i+1)+'.</b> '+inl(x)+'</div>'}).join('')+
      (np<d.pistas.length?'<button type="button" class="btn ghost" data-pista>Mostrar a pista '+(np+1)+'</button>':'<div class="box blue"><b>Esqueleto da resposta</b><p>'+inl(d.estrutura)+'</p></div>')}
  if(st===2){h+='<div class="box gold"><b>Use o método RJC em cada item:</b> <b>R</b>esponda direto ao comando, <b>J</b>ustifique com o conteúdo e <b>C</b>omprove com o dado do texto ou com a conta.</div><details class="box blue"><summary><b>Ver o esqueleto da resposta</b></summary><p>'+inl(d.estrutura)+'</p></details><label class="lab" for="ra">Sua resposta do item a)</label><textarea id="ra" rows="5" data-resp="a">'+esc(p.r.a||'')+'</textarea>'+
      '<label class="lab" for="rb">Sua resposta do item b)</label><textarea id="rb" rows="5" data-resp="b">'+esc(p.r.b||'')+'</textarea>'+
      '<p class="small">Escreva como na prova: frases completas, direto ao ponto, com a conta mostrada quando houver cálculo. Fica guardado neste aparelho.</p>'+
      (D.ia?'<div class="ia"><b>Correção automática</b><p class="small">Envie sua resposta e receba a nota por critério com comentários.</p><button type="button" class="btn" data-ia>Corrigir minha resposta</button><div id="iares"></div></div>':'')}
  if(st===3){h+='<p>Agora você é o corretor. Leia a resposta de cada candidato, dê a nota (de 0 a 2) e confira a nota da banca. Isso treina o seu olho para o que vale ponto.</p>'+
      '<details class="box blue"><summary><b>Ver os critérios de correção</b></summary><ul class="lst">'+d.c.map(function(c){return '<li>'+inl(c.t)+' <b>('+String(c.pts).replace('.',',')+')</b></li>'}).join('')+'</ul></details>';
    d.respostas.forEach(function(r,i){var dada=p.b[i];
      h+='<div class="resp"><div class="row between"><span class="quem">Candidato '+'XYZ'[i]+'</span>'+ouvir(r.txt)+'</div><div class="txt">'+inl(r.txt)+'</div><div class="notas">'+[0,0.5,1,1.5,2].map(function(n){return '<button type="button" data-banca="'+i+'" data-n="'+n+'" class="'+(dada===n?'on':'')+'"'+(dada!=null?' disabled':'')+'>'+String(n).replace('.',',')+'</button>'}).join('')+'</div>'+
        (dada!=null?'<div class="box '+(Math.abs(dada-r.nota)<=0.5?'ok':'bad')+'"><b>Nota da banca: '+String(r.nota).replace('.',',')+'</b>'+(dada===r.nota?' · você acertou em cheio!':Math.abs(dada-r.nota)<=0.5?' · você chegou perto.':' · bem diferente da sua.')+'<p>'+inl(r.porque)+'</p></div>':'')+'</div>'})}
  if(st===4){h+='<div class="row between"><h4>Resposta modelo</h4>'+ouvir(d.r)+'</div><div class="box ok">'+pre(d.r)+'</div>'+
      ((p.r.a||p.r.b)?'<h4>A sua resposta</h4><div class="resp"><div class="txt">a) '+esc(p.r.a||'')+'\nb) '+esc(p.r.b||'')+'</div></div>':'')+
      '<h4>Dê a sua nota</h4><p class="small">Marque cada critério que a sua resposta cumpre. Seja tão rigoroso quanto a banca.</p><div class="crit">'+
      d.c.map(function(c,k){return '<label><input type="checkbox" data-crit="'+k+'"'+(p.c.indexOf(k)>=0?' checked':'')+'><span>'+inl(c.t)+'</span><span class="pts">'+String(c.pts).replace('.',',')+'</span></label>'}).join('')+'</div>'+
      '<p class="score" id="nota">'+notaD(d,p).toFixed(1).replace('.',',')+' / 2</p><div class="box gold"><b>Dica:</b> '+inl(d.g)+'</div>'+
      '<div class="row"><button type="button" class="btn" data-fimd>'+(p.fim?'Concluída ✓ (salvar de novo)':'Concluir esta discursiva')+'</button></div>'}
  if(st<4)h+='<div class="row end" style="margin-top:14px"><button type="button" class="btn" data-st="'+(st+1)+'">Continuar: '+PASSOS_D[st+1]+'</button></div>';
  return h+'</div>'}
function notaD(d,p){return p.c.reduce(function(s,k){return s+(d.c[k]?d.c[k].pts:0)},0)}

/* ---------- oficina de redação ---------- */
var PASSOS_R=['Como é corrigida','Coletânea','Recorte','Tese','Plano','Escreva','Autoavaliação','Corrija como a banca','Nota máxima'];
function vRed(){var r=D.red[S.id];
  if(!r)return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Oficina de redação</span><h2>Em breve</h2><p>Esta oficina faz parte do curso completo.</p></div>';
  var p=get('cu-r-'+r.id,{q:{},plano:{},ck:{},prob:0}),st=S.step||0;p.q=p.q||{};p.plano=p.plano||{};p.ck=p.ck||{};
  var h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Oficina de redação · semana '+r.semana+'</span><h2>'+esc(r.tema)+'</h2>'+
    '<div class="steps">'+PASSOS_R.map(function(n,i){return '<button type="button" data-st="'+i+'" class="'+(i===st?'on':'')+'">'+(i+1)+'. '+n+'</button>'}).join('')+'</div>';
  if(st===0)h+='<div class="box gold"><b>Habilidade da semana: '+esc(r.foco.t)+'</b></div><details class="box blue"><summary><b>Ver a dica completa</b></summary>'+rich(r.foco.x)+'<div class="row end">'+ouvir(r.foco.x)+'</div></details>'+
    '<div class="box blue"><b>Como a Unesp corrige</b><p>A redação vale 28 dos 100 pontos da 2ª fase e é avaliada em três critérios: <b>Tema</b> (ficar no recorte proposto, usar a coletânea sem copiar), <b>Estrutura</b> (texto dissertativo-argumentativo com introdução, desenvolvimento e conclusão, ideias coerentes) e <b>Expressão</b> (coesão, vocabulário e norma-padrão). Diferente do Enem, não se pede proposta de intervenção. Textos que reproduzem modelos prontos são anulados.</p></div>';
  if(st===1){h+='<div class="row end">'+ouvir(r.proposta+' '+r.coletanea.join(' '))+'</div><div class="box blue">'+inl(r.proposta)+'</div>'+r.coletanea.map(function(t){return '<div class="colet">'+inl(t)+'</div>'}).join('')+'<h4>Leia com atenção: 3 perguntas sobre a coletânea</h4>';
    r.leitura.forEach(function(q,i){h+=mc('l'+i,q,p.q['l'+i])})}
  if(st===2)h+='<p>Achar o recorte é o que separa a nota alta da média: quem fala do assunto geral, e não da questão proposta, tangencia o tema.</p>'+mc('rec',r.recorte,p.q.rec);
  if(st===3){h+='<p>Qual destas teses funcionaria bem? Toque em cada uma para ver a análise.</p>'+r.teses.map(function(t,i){var v=p.q['t'+i]!=null;
      return '<button type="button" class="tese'+(v?(t.ok?' okk':' nok'):'')+'" data-tese="'+i+'">'+inl(t.t)+(v?'<span class="small" style="display:block;margin-top:6px"><b>'+(t.ok?'Funciona.':'Não funciona.')+'</b> '+inl(t.porque)+'</span>':'')+'</button>'}).join('')+
      '<label class="lab" for="tese">Agora escreva a SUA tese (uma frase)</label><textarea id="tese" rows="2" data-pl="tese">'+esc(p.plano.tese||'')+'</textarea>'}
  if(st===4){h+='<p>Planeje antes de escrever. Quem planeja não perde o fio e não fica sem argumento no meio do texto.</p>'+r.plano.map(function(x,i){
      return '<label class="lab" for="pl'+i+'">'+esc(x.parte)+'</label><p class="small">'+inl(x.guia)+'</p><details><summary class="small">Ver um exemplo</summary><p class="small"><i>'+inl(x.exemplo)+'</i></p></details><textarea id="pl'+i+'" rows="3" data-pl="p'+i+'">'+esc(p.plano['p'+i]||'')+'</textarea>'}).join('')+
      '<h4>Repertório que pode ajudar</h4><ul class="lst">'+r.repertorio.map(function(x){return '<li>'+inl(x)+'</li>'}).join('')+'</ul>'}
  if(st===5){var tx=p.texto||'';h+='<p class="small">Escreva a redação completa (de 25 a 30 linhas, mais ou menos 250 a 330 palavras). Seu plano está logo abaixo para consulta.</p>'+
      '<details class="box blue"><summary><b>Meu plano</b></summary><p class="small">Tese: '+esc(p.plano.tese||'(não escrita)')+'</p>'+r.plano.map(function(x,i){return '<p class="small"><b>'+esc(x.parte)+':</b> '+esc(p.plano['p'+i]||'')+'</p>'}).join('')+'</details>'+
      '<textarea id="red" rows="18" data-texto>'+esc(tx)+'</textarea><p class="contador" id="cont">'+contar(tx)+'</p>'+
      (D.ia?'<div class="ia"><b>Correção automática</b><p class="small">Envie a redação e receba a nota em Tema, Estrutura e Expressão, com comentários por parágrafo.</p><button type="button" class="btn" data-ia>Corrigir minha redação</button><div id="iares"></div></div>':'')}
  if(st===6){h+='<p>Releia sua redação e responda com sinceridade. Cada "não" mostra o que reescrever.</p>';
    ['Tema','Estrutura','Expressão'].forEach(function(c){h+='<h4>'+c+'</h4><div class="crit">'+r.checklist[c].map(function(x,k){var id=c+k;return '<label><input type="checkbox" data-ck="'+id+'"'+(p.ck[id]?' checked':'')+'><span>'+inl(x)+'</span></label>'}).join('')+'</div>'});
    h+='<div id="ckres">'+ckRes(r,p)+'</div>'}
  if(st===7){var np=p.prob||0,cr=r.corrija;h+='<p>Esta redação foi escrita por um candidato sobre o mesmo tema. Leia, encontre os problemas e depois revele, um por um, o que a banca apontaria.</p>'+
      cr.texto.map(function(x){return '<div class="par">'+inl(x)+'</div>'}).join('')+
      cr.problemas.slice(0,np).map(function(x){return '<div class="prob"><span class="crt">'+esc(x.criterio)+'</span><p><i>"'+inl(x.trecho)+'"</i></p><p><b>Problema:</b> '+inl(x.problema)+'</p><p><b>Como melhorar:</b> '+inl(x.como_melhorar)+'</p></div>'}).join('')+
      (np<cr.problemas.length?'<button type="button" class="btn ghost" data-prob>Revelar o problema '+(np+1)+' de '+cr.problemas.length+'</button>':
       '<div class="box blue"><b>Avaliação da banca</b><p>Tema: '+esc(cr.notas.Tema)+' · Estrutura: '+esc(cr.notas.Estrutura)+' · Expressão: '+esc(cr.notas['Expressão'])+'</p></div>')}
  if(st===8){var e=r.exemplo;h+='<p>Uma redação nota máxima sobre o tema, comentada parágrafo por parágrafo. Não decore: observe as escolhas, porque a Unesp anula textos com modelo pronto.</p><div class="row end">'+ouvir((e.titulo?e.titulo+'. ':'')+e.paragrafos.join(' '))+'</div>'+(e.titulo?'<h3 style="text-align:center">'+esc(e.titulo)+'</h3>':'')+
      e.paragrafos.map(function(x,i){return '<div class="par">'+inl(x)+'<div class="com">✓ '+inl(e.comentarios[i]||'')+'</div></div>'}).join('')+
      '<div class="row"><button type="button" class="btn" data-fimr>'+(p.fim?'Oficina concluída ✓':'Concluir a oficina')+'</button></div>'}
  if(st<8)h+='<div class="row end" style="margin-top:14px"><button type="button" class="btn" data-st="'+(st+1)+'">Continuar: '+PASSOS_R[st+1]+'</button></div>';
  return h+'</div>'}
function mc(key,q,resp){var h='<div class="resp"><p><b>'+inl(q.p)+'</b></p>';
  q.o.forEach(function(o,k){var cl=resp==null?'':k===q.a?' cert':k===resp?' err':'';h+='<button type="button" class="op'+cl+'" data-mc="'+key+'" data-k="'+k+'"'+(resp!=null?' disabled':'')+'><b>'+'ABCD'[k]+')</b><span>'+inl(o)+'</span></button>'});
  if(resp!=null)h+='<div class="box '+(resp===q.a?'ok':'bad')+'"><b>'+(resp===q.a?'Isso mesmo!':'Não é essa.')+'</b> '+inl(q.e)+'</div>';
  return h+'</div>'}
function contar(t){var w=(t.trim().match(/\S+/g)||[]).length;return w+' palavras · cerca de '+Math.round(w/11)+' linhas'}
function ckRes(r,p){var s=['Tema','Estrutura','Expressão'].map(function(c){var n=r.checklist[c].length,k=r.checklist[c].filter(function(x,i){return p.ck[c+i]}).length;return '<div style="margin:6px 0"><b>'+c+'</b> · '+k+' de '+n+'<div class="bar lt"><i style="width:'+Math.round(100*k/n)+'%"></i></div></div>'}).join('');return '<div class="box blue">'+s+'</div>'}

/* ---------- render e eventos ---------- */
function render(){OUV=[];clearInterval(RELOGIO);
  var fv=faseDaView();if(fv&&!temFase(fv)){EL.innerHTML='<div class="cu">'+vTravaFase(fv)+'</div>';bind();setTimeout(function(){try{EL.scrollIntoView({block:'start'})}catch(e){}},0);return}
  if(viewTravada()){EL.innerHTML='<div class="cu">'+vTrava()+'</div>';bind();setTimeout(function(){try{EL.scrollIntoView({block:'start'});if(EL.getBoundingClientRect().top<0||EL.getBoundingClientRect().top>innerHeight)scrollTo(0,EL.getBoundingClientRect().top+scrollY-8)}catch(e){}},0);return}
  var falta=D.carregar?precisa():[];if(falta.length){falta.forEach(function(id){TENTOU[id]=1});EL.innerHTML='<div class="cu"><div class="card"><p>Carregando...</p></div></div>';D.carregar(falta,function(){render()});return}
  EL.innerHTML='<div class="cu">'+(S.v==='aula'?vAula():S.v==='f2'?vF2():S.v==='disc'?vDisc():S.v==='red'?vRed():S.v==='sim'?vSim():S.v==='met'?vMet():S.v==='rev'?vRev():S.v==='cart'?vCartoes():vHome())+'</div>';
  bind()}
function vMet(){var m=D.metodo,i=S.mi;
  if(i==null)return '<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Comece aqui</span><h2>'+esc(m.titulo)+'</h2>'+m.partes.map(function(x,k){return '<button type="button" class="item" data-met="'+k+'"><span class="ck">'+(k+1)+'</span><span class="tt">'+esc(x.t)+'</span></button>'}).join('')+'</div>';
  var x=m.partes[i];return '<button class="back" data-met="">‹ O método</button><div class="card"><span class="eyebrow">O método · '+(i+1)+' de '+m.partes.length+'</span><h2>'+esc(x.t)+'</h2>'+rich(x.x)+
   '<div class="row end" style="margin-top:14px">'+(i<m.partes.length-1?'<button type="button" class="btn" data-met="'+(i+1)+'">Próximo: '+esc(m.partes[i+1].t)+'</button>':'<button type="button" class="btn" data-home>Ir para o cronograma</button>')+'</div></div>'}
function metParte(id){var m=D.metodo;if(!m)return null;for(var i=0;i<m.partes.length;i++)if(m.partes[i].id===id)return i;return null}
var RELOGIO=null,DUR=5*3600e3;
function hm(ms){ms=Math.max(0,ms);var m=Math.floor(ms/6e4);return Math.floor(m/60)+'h'+('0'+m%60).slice(-2)}
function simRes(sim,p){var t={ling:[0,0],hum:[0,0],nat:[0,0]},mt={},c=0;sim.questoes.forEach(function(q){var ok=p.r[q.id]===q.a;t[q.area][1]++;if(ok){t[q.area][0]++;c++}var m=mt[q.materia]=mt[q.materia]||[0,0];m[1]++;if(ok)m[0]++});return {c:c,t:t,mt:mt}}
function vSim(){var sim=D.sims&&D.sims[S.id],h='<button class="back" data-home>‹ Cronograma</button><div class="card"><span class="eyebrow">Simulado do mês</span>';
  if(!sim)return h+'<h2>Simulado completo da 1ª fase</h2><p>90 questões de 5 alternativas (30 de cada área), com cronômetro de 5 horas, nota por área e lista do que revisar. Ele abre no dia marcado no cronograma.</p></div>';
  var p=get('cu-s-'+sim.id,{r:{}});p.r=p.r||{};h+='<h2>'+esc(sim.titulo)+'</h2>';
  if(!p.ini)return h+'<p>Faça como no dia da prova: 90 questões de 5 alternativas, 30 de Linguagens, 30 de Humanas e 30 de Natureza e Matemática, em até 5 horas.</p><ul class="lst"><li>Você só vê a correção depois de entregar.</li><li>Pode pular e voltar quando quiser; as respostas ficam salvas neste aparelho.</li><li>No fim, sai a nota por área e por matéria, e as questões que você errar entram na sua revisão dos erros.</li></ul>'+
    (sim.n<=2?'<p class="small">Ainda é cedo no curso, então algumas questões cobram assuntos que você vai estudar nas próximas semanas. Use este simulado como diagnóstico: ele mostra de onde você parte.</p>':'')+
    '<div class="row"><button type="button" class="btn" data-simini>Começar o simulado</button></div></div>';
  var L_=sim.questoes,i=S.qi||0;
  if(!p.fim){var resp=L_.filter(function(q){return p.r[q.id]!=null}).length,rest=DUR-(Date.now()-p.ini);
    h+='<div class="row between"><span class="tag">'+resp+' de 90 respondidas</span><span class="nivel" id="relogio">'+(rest>0?'Restam '+hm(rest):'Tempo esgotado')+'</span></div><div class="bar lt"><i style="width:'+Math.round(100*resp/90)+'%"></i></div>'+
      '<div class="row" style="gap:6px;margin:8px 0">'+[['ling',0],['hum',30],['nat',60]].map(function(x){return '<button type="button" class="btn ghost small" data-qi="'+x[1]+'">'+areaDe(x[0])+'</button>'}).join('')+'</div>';
    return h+vQuestao(L_,i,p.r,'sim')+'<div class="row end" style="margin-top:10px"><button type="button" class="btn ghost small" data-simfim>Entregar agora</button></div></div>'}
  var R=simRes(sim,p);
  h+='<p class="score">'+R.c+' / 90</p><div class="tres">'+['ling','hum','nat'].map(function(a){return '<div class="box blue"><b>'+R.t[a][0]+'/30</b><span class="small">'+areaDe(a)+'</span></div>'}).join('')+'</div>'+
    '<h4>Por matéria</h4><table class="tb"><tr><td>Matéria</td><td>Acertos</td></tr>'+Object.keys(R.mt).map(function(m){return '<tr><td>'+esc(m)+'</td><td>'+R.mt[m][0]+' de '+R.mt[m][1]+'</td></tr>'}).join('')+'</table>'+
    '<p class="small">As matérias com menos acertos são as primeiras a revisar. As questões que você errou já estão na sua revisão dos erros.</p><h4>Correção questão por questão</h4>';
  return h+vQuestao(L_,i,p.r,'simrev')+'</div>'}
function on(sel,fn){EL.querySelectorAll(sel).forEach(function(b){b.addEventListener('click',function(ev){fn(b,ev)})})}
function bind(){
  on('[data-ouvir]',function(b){if(falando()&&b.classList.contains('tocando')){calar();b.classList.remove('tocando');return}
    EL.querySelectorAll('.ouvir.tocando').forEach(function(x){x.classList.remove('tocando')});b.classList.add('tocando');falar(OUV[+b.dataset.ouvir])});
  on('[data-home]',function(){go({v:'home',step:0})});
  on('[data-comprar]',function(){if(D.limite&&D.limite.comprar)D.limite.comprar()});
  on('[data-comprarfase]',function(b){if(D.fases&&D.fases.comprar)D.fases.comprar(b.dataset.comprarfase)});
  on('[data-sem]',function(b){var n=+b.dataset.sem,ab=b.getAttribute('aria-expanded')==='true';S.sem=ab?-1:n;render()});
  on('[data-aula]',function(b){go({v:'aula',id:b.dataset.aula,step:0,qi:0})});
  on('[data-f2]',function(b){go({v:'f2',sem2:+b.dataset.f2})});
  on('[data-disc]',function(b){go({v:'disc',id:b.dataset.disc,step:0})});
  on('[data-red]',function(b){go({v:'red',id:b.dataset.red,step:0})});
  on('[data-met]',function(b){go({v:'met',mi:b.dataset.met===''?null:+b.dataset.met})});
  on('[data-sim]',function(b){go({v:'sim',id:b.dataset.sim,qi:0})});
  on('[data-simini]',function(){var p=get('cu-s-'+S.id,{r:{}});p.ini=Date.now();set('cu-s-'+S.id,p);go({qi:0})});
  on('[data-simfim]',function(){var sim=D.sims[S.id],p=get('cu-s-'+S.id,{r:{}}),n=sim.questoes.filter(function(q){return p.r[q.id]==null}).length;
    if(n&&!confirm('Faltam '+n+' questões sem resposta. Entregar mesmo assim?'))return;p.fim=Date.now();p.nota=simRes(sim,p).c;set('cu-s-'+S.id,p);go({qi:0})});
  if(S.v==='sim'){var sp=get('cu-s-'+S.id,{});if(sp.ini&&!sp.fim)RELOGIO=setInterval(function(){var e=EL.querySelector('#relogio');if(!e)return clearInterval(RELOGIO);var r=DUR-(Date.now()-sp.ini);e.textContent=r>0?'Restam '+hm(r):'Tempo esgotado'},30000)}
  on('[data-st]',function(b){go({step:+b.dataset.st})});
  on('[data-refaz]',function(){var p=get('cu-a-'+S.id,{});p.q={};set('cu-a-'+S.id,p);go({step:0,qi:0})});
  on('[data-qi]',function(b){S.qi=+b.dataset.qi;render();var c=EL.querySelector('.stem');if(c)try{c.scrollIntoView({block:'center'})}catch(e){}});
  on('[data-op]',function(b){var k=+b.dataset.op;
    if(S.v==='sim'){var sq=D.sims[S.id].questoes[S.qi||0],sp=get('cu-s-'+S.id,{r:{}});if(sp.fim)return;sp.r=sp.r||{};sp.r[sq.id]=k;set('cu-s-'+S.id,sp);render();return}
    if(S.v==='rev'){var q=S.revLista[S.qi||0];S.revResp=S.revResp||{};S.revResp[q.id]=k;if(k===q.a){var ok=get('cu-rev',{});ok[q.id]=1;set('cu-rev',ok)}render();return}
    var a=D.aulas[S.id],p=get('cu-a-'+S.id,{q:{}});p.q=p.q||{};p.q[a.questoes[S.qi||0].id]=k;set('cu-a-'+S.id,p);render()});
  on('[data-rev]',function(){go({v:'rev',qi:0,revLista:errosPendentes(),revResp:{}})});
  on('[data-cart]',function(){go({v:'cart'})});
  on('[data-fimaula]',function(){var p=get('cu-a-'+S.id,{q:{}});p.fim=1;set('cu-a-'+S.id,p);go({v:'home'})});
  /* discursiva */
  var did=S.v==='disc'?D.aulas[S.id].discursiva.id:null;
  function pd(){var p=get('cu-d-'+did,{});p.r=p.r||{};p.b=p.b||{};p.c=p.c||[];return p}
  on('[data-pista]',function(){var p=pd();p.pistas=(p.pistas||0)+1;set('cu-d-'+did,p);render()});
  EL.querySelectorAll('[data-resp]').forEach(function(t){t.addEventListener('input',function(){var p=pd();p.r[t.dataset.resp]=t.value;set('cu-d-'+did,p)})});
  on('[data-banca]',function(b){var p=pd();p.b[b.dataset.banca]=+b.dataset.n;set('cu-d-'+did,p);render()});
  EL.querySelectorAll('[data-crit]').forEach(function(c){c.addEventListener('change',function(){var p=pd(),k=+c.dataset.crit;p.c=p.c.filter(function(x){return x!==k});if(c.checked)p.c.push(k);set('cu-d-'+did,p);
    var n=EL.querySelector('#nota');if(n)n.textContent=notaD(D.aulas[S.id].discursiva,p).toFixed(1).replace('.',',')+' / 2'})});
  on('[data-fimd]',function(){var p=pd();p.fim=1;p.nota=notaD(D.aulas[S.id].discursiva,p);set('cu-d-'+did,p);go({v:'f2'})});
  /* redação */
  var rid=S.v==='red'?S.id:null;
  function pr(){var p=get('cu-r-'+rid,{});p.q=p.q||{};p.plano=p.plano||{};p.ck=p.ck||{};return p}
  on('[data-mc]',function(b){var p=pr();p.q[b.dataset.mc]=+b.dataset.k;set('cu-r-'+rid,p);render()});
  on('[data-tese]',function(b){var p=pr();p.q['t'+b.dataset.tese]=1;set('cu-r-'+rid,p);render()});
  EL.querySelectorAll('[data-pl]').forEach(function(t){t.addEventListener('input',function(){var p=pr();p.plano[t.dataset.pl]=t.value;set('cu-r-'+rid,p)})});
  EL.querySelectorAll('[data-texto]').forEach(function(t){t.addEventListener('input',function(){var p=pr();p.texto=t.value;set('cu-r-'+rid,p);EL.querySelector('#cont').textContent=contar(t.value)})});
  EL.querySelectorAll('[data-ck]').forEach(function(c){c.addEventListener('change',function(){var p=pr();p.ck[c.dataset.ck]=c.checked;set('cu-r-'+rid,p);EL.querySelector('#ckres').innerHTML=ckRes(D.red[rid],p)})});
  on('[data-prob]',function(){var p=pr();p.prob=(p.prob||0)+1;set('cu-r-'+rid,p);render()});
  on('[data-fimr]',function(){var p=pr();p.fim=1;set('cu-r-'+rid,p);go({v:'home'})});
  on('[data-ia]',function(b){if(D.ia)D.ia(S.v,S.id,EL.querySelector('#iares'))});
}
function mount(el,data){EL=el;D=data;ST=data.store;D.hoje=D.hoje||function(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};S={v:'home'};render()}
return {mount:mount,go:go}})();
