// Search the journal: every word typed has to appear in the post.
(function(){var box=document.getElementById('find'),out=document.getElementById('results'),list=document.getElementById('listing'),data=null,nav=document.querySelector('.pagination');
function esc(t){return t.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function run(){var q=box.value.trim().toLowerCase();if(q.length<2){out.innerHTML='';list.hidden=false;if(nav)nav.hidden=false;return}
  if(!data){fetch('/journal-search.json').then(function(r){return r.json()}).then(function(d){data=d;run()});return}
  var words=q.split(/\s+/),hits=data.filter(function(p){return words.every(function(w){return p.x.indexOf(w)>=0})});
  list.hidden=true;if(nav)nav.hidden=true;
  out.innerHTML='<p class="count">'+(hits.length?hits.length+' post'+(hits.length===1?'':'s')+' found':'Nothing found. Try fewer or different words.')+'</p>'+hits.slice(0,40).map(function(p){return '<div class="hit"><a href="'+p.u+'">'+esc(p.t)+'</a><small>'+esc(p.c)+' · '+esc(p.d)+'</small><p>'+esc(p.s)+'</p></div>'}).join('')}
var timer;box.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(run,120)});})();
