/* © 2026 오산세교종합사회복지관 김지훈 팀장. 자원 공백 지도 화면(등록 자료 기준). */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=window.WELFARE_DATA,W=window.WelfareTools;
if(!D||!W){$('tiles').textContent='자료를 불러오지 못했습니다. 새로고침해 주세요.';return}
const G=W.gapMatrix(D),S=G.summary;
$('tiles').innerHTML=[
 ['','등록 서비스',S.services+'개','기준일 '+(D.date||'')],
 ['osan','오산 없음 칸',S.osanNone+'칸','경기·전국에만 있음'],
 ['','오산 1개뿐인 칸',S.thin+'칸','대체 기관이 없는 곳'],
 ['none','등록 서비스 없음',S.none+'칸','전체 '+S.cells+'칸 중']
].map(t=>'<div class="tile '+t[0]+'"><span>'+t[1]+'</span><b>'+t[2]+'</b><small>'+esc(t[3])+'</small></div>').join('');
const cls=c=>c.type==='ok'?(c.by['오산시']>=6?'c-ok3':c.by['오산시']>=3?'c-ok2':'c-ok1'):'c-'+c.type;
const label=c=>c.need+' × '+c.target+': 오산 '+c.by['오산시']+'개, 경기 '+c.by['경기도']+'개, 전국 '+c.by['민간']+'개';
$('matrix').innerHTML='<thead><tr><th scope="col">욕구영역 \\ 대상</th>'+G.targets.map(t=>'<th scope="col">'+esc(t)+'</th>').join('')+'</tr></thead><tbody>'+
 G.rows.map(r=>'<tr><th scope="row">'+esc(r.need)+(r.open?' <small title="대상 미분류">+'+r.open+'</small>':'')+'</th>'+r.cells.map(c=>'<td class="'+cls(c)+'"><button type="button" data-need="'+esc(c.need)+'" data-target="'+esc(c.target)+'" aria-pressed="false" aria-label="'+esc(label(c))+'"><b>'+(c.total?c.by['오산시']:'–')+'</b><small>'+(c.total?'경기 '+c.by['경기도']+' · 전국 '+c.by['민간']:'없음')+'</small></button></td>').join('')+'</tr>').join('')+'</tbody>';
const osanGaps=G.gaps.filter(c=>c.type==='osan-none');
$('gaps').innerHTML=osanGaps.length?osanGaps.map(c=>'<li><button type="button" data-need="'+esc(c.need)+'" data-target="'+esc(c.target)+'"><b>'+esc(c.need)+' × '+esc(c.target)+'</b><small>경기 '+c.by['경기도']+'개 · 전국 '+c.by['민간']+'개 · 오산 0개</small></button></li>').join(''):'<li>오산에 비어 있는 칸이 없습니다.</li>';
function card(e){
 const c=e.checked,phone=e.o.phone||(e.o.contact&&e.o.contact.phone)||'';
 const when=c.status==='확인완료'&&c.date?'<span class="tag ok">공식 안내 확인 '+esc(c.date)+'</span>':c.date?'<span class="tag">기관 안내 확인 '+esc(c.date)+'</span>':'<span class="tag warn">확인일 없음</span>';
 return '<article class="card"><span class="tag">'+esc(W.LEVEL_LABEL[e.level])+'</span>'+when+'<h3>'+esc(e.s.name)+'</h3><p><b>'+esc(e.o.name)+'</b>'+(phone?' · '+esc(phone):'')+'</p>'+(e.s.target?'<p>대상: '+esc(e.s.target)+'</p>':'')+'<p><a href="./#org='+encodeURIComponent(e.o.id)+'">상세정보 ↗</a></p></article>';
}
function open(need,target){
 const list=W.cellServices(D,need,target),box=$('detail'),confirmed=list.filter(e=>e.checked.status==='확인완료').length;
 document.querySelectorAll('#matrix button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.need===need&&b.dataset.target===target)));
 const osan=list.filter(e=>e.level==='오산시').length;
 box.hidden=false;
 box.innerHTML='<h2>'+esc(need)+' × '+esc(target)+'</h2><p class="legend">등록 서비스 '+list.length+'개 · 오산 '+osan+'개 · 공식 안내 확인 '+confirmed+'개'+(osan?'':' · 오산 서비스가 없어 경기·전국 서비스를 대신 안내하거나 지역 자원 발굴이 필요합니다.')+'</p>'+
  (list.length?'<div class="cards">'+list.map(card).join('')+'</div>':'<p>등록된 서비스가 없습니다. 실제 자원을 알고 계시면 메인 화면의 「자료 갱신·오류 제보」로 알려 주세요.</p>')+
  '<div id="pfBox"></div>'+
  '<p class="no-print"><a href="service-guide.html?need='+encodeURIComponent(need)+'&amp;target='+encodeURIComponent(target)+'">필요한 도움으로 찾기에서 이어 보기 →</a> · <button class="text" type="button" id="closeDetail">닫기</button></p>';
 const P=window.PublicFacilities;
 if(P)P.load('public-api/facilities.json').then(d=>{const box2=$('pfBox');if(!box2||!d)return;const gs=P.forNeed(d,need,target);
  box2.innerHTML=P.html(gs,d,{title:'공공데이터 기관 목록에서 함께 볼 곳',intro:osan?'등록 서비스 밖에서 공공데이터로 확인되는 기관입니다.':'오산에 등록 서비스가 없는 칸입니다. 공공데이터로 확인되는 오산·가까운 경기 기관을 대신 안내할 수 있습니다.',limit:4})});
 $('closeDetail').addEventListener('click',()=>{box.hidden=true;document.querySelectorAll('#matrix button').forEach(b=>b.setAttribute('aria-pressed','false'))});
 box.scrollIntoView({behavior:'smooth',block:'start'});
}
document.addEventListener('click',e=>{const b=e.target.closest('#matrix button,#gaps button');if(b)open(b.dataset.need,b.dataset.target)});
})();
