/* Relatório de acompanhamento do aluno (no estilo do Rumo à Etec): meta de hoje, últimos 7 dias,
   acertos, ritmo em relação ao plano e acertos por matéria. Usado no site (aba do plano) e no painel
   da Editora (detalhe de cada aluno). Entrada:
   {nome, pd: questões por dia, nd: dias do plano, inicio: 'AAAA-MM-DD', hoje: 'AAAA-MM-DD' (opcional),
    dias: {índice: {res:[bool], fim, t}} ou [{d, n, ok, fim, t}], areas: [{a, n, ok}], ultimo: ms (opcional)} */
var RELATORIO=(function(){
  var WDS=['dom','seg','ter','qua','qui','sex','sáb'];
  var css='.rel{display:grid;gap:12px}.rel .rb{border:1px solid #DCE1EE;border-radius:16px;padding:16px;background:#F7F8FD;display:grid;gap:10px}'+
    '.rel .rk{font:600 .78rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#55607A;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}'+
    '.rel .rbig{font-size:2.2rem;font-weight:800;line-height:1;color:#0F1B3D}.rel .rbig small{display:inline;font-size:1rem;font-weight:700;color:#55607A;margin-left:6px}'+
    '.rel .rbar{height:14px;border-radius:999px;background:#DCE1EE;display:flex;overflow:hidden;position:relative}.rel .rbar i{background:#16A34A}.rel .rbar b{background:#DC2626}'+
    '.rel .rbar .rmark{position:absolute;top:-4px;bottom:-4px;width:3px;background:#0F1B3D;border-radius:2px}'+
    '.rel .rok{color:#15803D;font-weight:700}.rel .rer{color:#DC2626;font-weight:700}.rel p{margin:0;color:#334}'+
    '.rel .rtag{font:700 .85rem/1 system-ui,sans-serif;border-radius:999px;padding:6px 12px;letter-spacing:0;text-transform:none;white-space:nowrap}'+
    '.rel .rtag.ok{background:#DCFCE7;color:#15803D}.rel .rtag.meio{background:#FEF3C7;color:#92400E}.rel .rtag.no{background:#FEE2E2;color:#B91C1C}.rel .rtag.nd{background:#E5E7EB;color:#4B5563}'+
    '.rel .r7{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.rel .r7 div{border-radius:12px;padding:8px 2px;text-align:center;background:#EEF0F5;display:grid;gap:2px;min-width:0}'+
    '.rel .r7 span{font-size:.8rem;color:#55607A}.rel .r7 b{font-size:1.15rem;color:#0F1B3D}.rel .r7 em{font-style:normal;font-size:.8rem;color:#55607A;min-height:1.1em}'+
    '.rel .r7 .ok{background:#DCFCE7}.rel .r7 .ok em{color:#15803D;font-weight:800;font-size:1rem}.rel .r7 .meio{background:#FEF3C7}.rel .r7 .hoje{outline:3px solid #13285E;outline-offset:-3px}'+
    '.rel .rmat{display:grid;gap:4px}.rel .rmat .rn{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;color:#13285E}'+
    '.rel .rmat .rl{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.rel .rmat .rl b{font-size:1.1rem;color:#0F1B3D}.rel .rmat .rbar{height:12px}.rel .rmat small{display:block;color:#55607A}';
  function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  function dia(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
  function br(s){var p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0]}
  function norm(dias){var o={};if(Array.isArray(dias))dias.forEach(function(x){o[x.d]={n:x.n,ok:x.ok,fim:!!x.fim,t:x.t||0}});
    else Object.keys(dias||{}).forEach(function(k){var x=dias[k];if(x&&x.res)o[k]={n:x.res.length,ok:x.res.filter(Boolean).length,fim:!!x.fim,t:x.t||0}});return o}
  function rotulo(p){return p==null?['nd','sem dados']:p>=70?['ok','bom']:p>=50?['meio','regular']:['no','atenção']}
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function html(R){
    var D=norm(R.dias),pd=R.pd,nd=R.nd,hoje=R.hoje||iso(new Date());
    var ti=Math.round((dia(hoje)-dia(R.inicio))/86400000);var antes=ti<0;ti=Math.max(0,Math.min(nd-1,ti));
    var feitas=0,ok=0,ult=R.ultimo||0;Object.keys(D).forEach(function(k){feitas+=D[k].n;ok+=D[k].ok;ult=Math.max(ult,D[k].t||0)});
    var h='<div class="rel"><style>'+css+'</style>';
    if(R.nome||ult)h+='<div class="rk" style="font-size:.85rem;letter-spacing:.04em;text-transform:none"><span style="font:700 1.1rem system-ui,sans-serif;color:#0F1B3D">'+esc(R.nome||'')+'</span><span>'+(ult?'último estudo em '+br(iso(new Date(ult))):'')+'</span></div>';
    /* hoje */
    var t=antes?null:D[ti],tn=t?t.n:0,tok=t?t.ok:0,cump=t&&t.fim;
    h+='<div class="rb"><div class="rk"><span>'+(antes?'O plano começa em '+br(R.inicio):'Hoje · dia '+(ti+1)+' de '+nd)+'</span>'+(antes?'':'<span class="rtag '+(cump?'ok':tn?'meio':'nd')+'">'+(cump?'✓ Meta cumprida':tn?'Em andamento':'Ainda não começou')+'</span>')+'</div>'+
      '<div class="rbig">'+tn+'<small>de '+pd+' questões</small></div><div class="rbar">'+(tn?'<i style="width:'+(tok/pd*100)+'%"></i><b style="width:'+((tn-tok)/pd*100)+'%"></b>':'')+'</div>'+
      '<p>'+(tn?'<span class="rok">'+tok+(tok===1?' certa':' certas')+'</span> e <span class="rer">'+(tn-tok)+(tn-tok===1?' erro':' erros')+'</span>.':'Nenhuma questão respondida hoje.')+'</p></div>';
    /* últimos 7 dias */
    var c7='',met=0,cont=0;
    for(var i=ti-6;i<=ti;i++){if(i<0||antes){c7+='<div style="visibility:hidden"></div>';continue}cont++;
      var x=D[i],dt=new Date(dia(R.inicio).getTime()+i*86400000+43200000),cls=x&&x.fim?'ok':x&&x.n?'meio':'';if(x&&x.fim)met++;
      c7+='<div class="'+cls+(i===ti?' hoje':'')+'"><span>'+(i===ti?'hoje':WDS[dt.getDay()])+'</span><b>'+(x?x.n:0)+'</b><em>'+(x&&x.fim?'✓':x&&x.n?'parcial':'–')+'</em></div>'}
    h+='<div class="rb"><div class="rk"><span>Últimos 7 dias</span></div><div class="r7">'+c7+'</div><p>'+(cont?'Cumpriu a meta de '+pd+' em <b>'+met+' de '+cont+(cont===1?' dia':' dias')+'</b>.':'O acompanhamento começa no primeiro dia do plano.')+'</p></div>';
    /* acertos */
    var pc=feitas?Math.round(ok/feitas*100):null;
    h+='<div class="rb"><div class="rk"><span>Acertos</span></div><div class="rbig">'+(pc==null?'–':pc+'%')+'<small>das questões respondidas no plano</small></div>'+
      '<p>'+(feitas?'Nas '+pd+' questões do dia, acerta em média <b>'+Math.round(ok/feitas*pd)+'</b> e erra <b>'+(pd-Math.round(ok/feitas*pd))+'</b>. Total: '+feitas+' respondidas, '+ok+' certas.':'Ainda não há questões respondidas no plano.')+'</p></div>';
    /* ritmo */
    if(!antes){var total=nd*pd,esp=(ti+1)*pd,dif=feitas-esp,n7=0,d7=0;for(var j=Math.max(0,ti-6);j<=ti;j++){d7++;n7+=D[j]?D[j].n:0}
      h+='<div class="rb"><div class="rk"><span>Ritmo do plano</span><span class="rtag '+(dif>=0?'ok':dif>=-pd?'meio':'no')+'">'+(dif>=0?(dif?dif+' à frente':'em dia'):(-dif)+' atrás')+'</span></div>'+
        '<div class="rbig">'+feitas+'<small>de '+total+' questões do plano</small></div><div class="rbar"><i style="width:'+Math.min(100,feitas/total*100)+'%"></i><span class="rmark" style="left:calc('+Math.min(100,esp/total*100)+'% - 1px)"></span></div>'+
        '<p>'+(dif>=0?'Está em dia com o plano':'Está <b class="rer">'+(-dif)+' questões atrás</b> do plano')+'. O risco preto mostra onde deveria estar hoje ('+esp+'). Média recente: <b>'+Math.round(n7/d7)+'</b> por dia.</p></div>'}
    /* matérias */
    var ar=(R.areas||[]).filter(function(a){return a.n>0});
    h+='<div class="rb"><div class="rk"><span>Acertos por matéria</span></div>'+(ar.length?ar.map(function(a){var p=Math.round(a.ok/a.n*100),r=rotulo(p);
      return '<div class="rmat"><div class="rn"><span>'+esc(a.a)+'</span><span class="rtag '+r[0]+'">'+r[1]+'</span></div><div class="rl"><div class="rbar"><i style="width:'+p+'%"></i></div><b>'+p+'%</b></div><small>'+a.n+(a.n===1?' questão feita':' questões feitas')+'</small></div>'}).join(''):'<p>Aparece assim que o aluno responder as primeiras questões.</p>')+'</div>';
    return h+'</div>';
  }
  return {html:html,iso:iso};
})();
