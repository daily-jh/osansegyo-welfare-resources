/* © 2026 오산세교종합사회복지관 김지훈 팀장. 복지혜택 자가점검 화면. 입력값은 저장·전송하지 않습니다. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=window.WELFARE_DATA,W=window.WelfareTools;
if(!D||!W){$('status').textContent='자료를 불러오지 못했습니다. 새로고침하거나 메인 검색을 이용해 주세요.';return}
const URGENT=[['112','경찰 · 폭력·학대·실종'],['119','구급 · 지금 다치거나 위험할 때'],['109','자살예방 상담 · 24시간'],['1388','청소년 상담 · 24시간'],['1366','여성긴급전화 · 가정·교제·성폭력'],['129','보건복지상담 · 긴급복지']];
$('targets').innerHTML='<label><input type="radio" name="target" value="" checked><span>고르지 않음</span></label>'+W.targets(D).map(t=>'<label><input type="radio" name="target" value="'+esc(t)+'"><span>'+esc(t)+'</span></label>').join('');
$('situations').innerHTML=W.SITUATIONS.map(s=>'<label'+(s.urgent?' class="safe"':'')+'><input type="checkbox" name="sit" value="'+esc(s.id)+'"><span>'+esc(s.q)+'</span></label>').join('');
$('status').textContent='대상과 어려운 일을 고른 뒤 「문의할 곳 보기」를 눌러 주세요. 자료 기준일 '+(D.date||'');
const picked=()=>({target:(document.querySelector('input[name="target"]:checked')||{}).value||'',situations:[...document.querySelectorAll('input[name="sit"]:checked')].map(x=>x.value)});
function bar(by,total){
 if(!total)return '';
 return '<div class="bar" aria-hidden="true">'+W.LEVELS.map((l,i)=>by[l]?'<i class="l'+i+'" style="width:'+(by[l]/total*100).toFixed(1)+'%"></i>':'').join('')+'</div><div class="legend">'+W.LEVELS.map((l,i)=>'<span><i class="l'+i+'" style="background:'+['#174d81','#5f8fbf','#b7c9dd'][i]+'"></i>'+W.LEVEL_LABEL[l]+' '+by[l]+'개</span>').join('')+'</div>';
}
function card(e){
 const c=e.checked,phone=e.o.phone||(e.o.contact&&e.o.contact.phone)||'';
 const when=c.status==='확인완료'&&c.date?'<span class="tag ok">공식 안내 확인 '+esc(c.date)+'</span>':c.date?'<span class="tag">기관 안내 확인 '+esc(c.date)+'</span>':'<span class="tag warn">확인일 없음 · 이용 전 문의</span>';
 return '<article class="card"><span class="tag">'+esc(W.LEVEL_LABEL[e.level])+'</span>'+(e.fit==='open'?'<span class="tag warn">대상 미분류</span>':'')+when+
  '<h3>'+esc(e.s.name)+'</h3><p><b>'+esc(e.o.name)+'</b>'+(phone?' · <a href="tel:'+esc(phone.replace(/[^0-9]/g,''))+'">'+esc(phone)+'</a>':'')+'</p>'+
  (e.s.target?'<p>대상: '+esc(e.s.target)+'</p>':'')+(e.s.method?'<p>신청: '+esc(e.s.method)+'</p>':'')+
  '<p class="no-print"><a href="./#org='+encodeURIComponent(e.o.id)+'">상세정보 ↗</a></p></article>';
}
function draw(){
 const q=picked();
 if(!q.situations.length){$('status').textContent='어려운 일을 하나 이상 골라 주세요.';$('result').innerHTML='';$('print').disabled=true;return}
 const r=W.selfCheck(D,q),html=[];
 if(r.urgent)html.push('<section class="urgent" aria-labelledby="urgentTitle"><h2 id="urgentTitle">지금 위험하면 먼저 전화하세요</h2><ul>'+URGENT.map(x=>'<li><a href="tel:'+x[0]+'"><b>'+x[0]+'</b>'+esc(x[1])+'</a></li>').join('')+'</ul></section>');
 const desks=r.firstDesk;
 html.push('<section class="first"><h2>어디에 물을지 모르겠다면</h2><p>사는 곳의 <b>동 행정복지센터</b>에서 기초생활보장·긴급복지·바우처 등 공공 지원을 한 번에 상담합니다'+(desks.length?' (오산시 대표 <a href="tel:'+esc(desks[0].phone.replace(/[^0-9]/g,''))+'">'+esc(desks[0].phone)+'</a>)':'')+'. 전화 상담은 <a href="tel:129">보건복지상담센터 129</a>, 온라인 모의계산은 <a href="https://www.bokjiro.go.kr/" target="_blank" rel="noopener noreferrer">복지로 ↗</a>에서 할 수 있습니다.</p>'+(q.situations.length>=3||q.situations.includes('many')?'<p>어려움이 여러 가지라면 <b>복지관 통합사례관리</b>에서 한꺼번에 상의할 수 있습니다. 여러 기관이 함께 돕는 방식입니다.</p>':'')+'</section>');
 for(const g of r.groups){
  const more='service-guide.html?need='+encodeURIComponent(g.need)+(r.target?'&amp;target='+encodeURIComponent(r.target):'');
  html.push('<section class="group" aria-labelledby="g-'+g.id+'"><span class="pill">'+esc(g.need)+'</span><h2 id="g-'+g.id+'">'+esc(g.q)+'</h2><p class="meta">관련 서비스 '+g.total+'개'+(r.target?' · '+esc(r.target)+' 대상과 대상 미분류 포함':'')+'</p>'+bar(g.byLevel,g.total)+
   (g.total&&g.osanGap?'<p class="gapnote">이 사이트에는 이 조건의 오산 서비스가 아직 등록되어 있지 않습니다. 동 행정복지센터에 먼저 물어보고, 경기·전국 서비스를 함께 확인해 주세요.</p>':'')+
   (g.items.length?'<div class="cards">'+g.items.map(card).join('')+'</div>':'<p class="gapnote">조건에 맞는 등록 서비스가 없습니다. 동 행정복지센터나 129에 문의해 주세요.</p>')+
   (g.total>g.items.length?'<a class="more" href="'+more+'">이 영역 서비스 '+g.total+'개 모두 보기 →</a>':'')+'</section>');
 }
 $('result').innerHTML=html.join('');
 $('status').textContent='문의할 곳 후보를 '+r.groups.length+'개 영역으로 정리했습니다. 자격 판정이 아니며 이용 전 기관에 확인해 주세요.';
 $('printMeta').textContent='대상: '+(r.target||'고르지 않음')+' · 어려운 일: '+r.groups.map(g=>g.need).join(', ')+' · 자료 기준일 '+(D.date||'')+' · 자격 판정 아님';
 $('print').disabled=false;
 $('status').scrollIntoView({behavior:'smooth',block:'start'});
}
$('checkForm').addEventListener('submit',e=>{e.preventDefault();draw()});
$('reset').addEventListener('click',()=>{$('checkForm').reset();$('result').innerHTML='';$('print').disabled=true;$('status').textContent='처음부터 다시 고를 수 있습니다.'});
$('print').addEventListener('click',()=>window.print());
})();
