/* © 2026 오산세교종합사회복지관 김지훈 팀장. 공공데이터 기관 목록 화면(public-facilities.html). */
(function(){'use strict';
const $=id=>document.getElementById(id);
const P=window.PublicFacilities;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!P){$('list').textContent='화면 모듈을 불러오지 못했습니다. 새로고침해 주세요.';return}
let use='',D=null;
function render(){
 if(!D){$('list').innerHTML='<p>아직 수집된 기관 목록이 없습니다. 다음 주 월요일 수집부터 이곳에 나타납니다.</p>';return}
 const q=$('q').value.trim().toLowerCase(),osanOnly=$('osanOnly').checked;
 const gs=(use?P.byUses(D,[use]):P.groups(D)).map(g=>Object.assign({},g,{items:g.items.filter(i=>(!osanOnly||i.region==='osan')&&(!q||(i.name+' '+i.address+' '+(i.kind||'')).toLowerCase().includes(q)))})).filter(g=>g.items.length);
 $('list').innerHTML=gs.length?gs.map(g=>P.group(g,{limit:999,all:true,moreLink:false,summary:true})).join('')+'<p class="pf-foot">출처: 공공데이터포털 기관 목록 원문 · '+esc(P.counts(D).date)+' 수집. 운영 여부·연락처는 이용 전 확인.</p>':'<p>조건에 맞는 기관이 없습니다. 「오산만 보기」를 끄거나 다른 낱말로 찾아보세요.</p>';
 if(location.hash&&!render.jumped){const el=document.querySelector('[data-pf="'+CSS.escape(location.hash.slice(1))+'"]');if(el){render.jumped=true;el.scrollIntoView({block:'start'})}}
}
P.load('public-api/facilities.json').then(d=>{D=d;const c=P.counts(d);
 $('tiles').innerHTML=[['','데이터 종류',c.groups+'종','공공데이터포털'],['osan','오산 기관',c.osan+'곳','주소가 오산시'],['','가까운 경기 기관',c.gyeonggi+'곳','오산에 없는 유형 위주'],['','수집일',c.date||'-','매주 월요일']]
  .map(t=>'<div class="tile '+t[0]+'"><span>'+t[1]+'</span><b>'+esc(t[2])+'</b><small>'+esc(t[3])+'</small></div>').join('');
 const used=new Set();for(const g of P.groups(d))for(const u of g.uses||[])used.add(u);
 $('filters').innerHTML='<button type="button" data-use="" aria-pressed="true">전체</button>'+Object.keys(P.USE_LABEL).filter(u=>used.has(u)).map(u=>'<button type="button" data-use="'+u+'" aria-pressed="false">'+esc(P.USE_LABEL[u])+'</button>').join('');
 render()});
$('filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;use=b.dataset.use;document.querySelectorAll('#filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});
$('q').addEventListener('input',render);$('osanOnly').addEventListener('change',render);
})();
