/* © 2026 오산세교종합사회복지관 김지훈 팀장. 복지혜택 자가점검 화면(2026-11-25 개편). 입력값은 저장·전송하지 않습니다. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=window.WELFARE_DATA,W=window.WelfareTools,RES=window.Residence||null;
const UI=window.ToolsUI||{open(){},enter(){},done(){},bump(el,n){if(el)el.textContent=n},sos(){}};
const URGENT=[['112','경찰','폭력·학대·실종'],['119','구급','지금 다치거나 위험할 때'],['109','자살예방 상담','24시간'],['1388','청소년 상담','24시간'],['1366','여성긴급전화','가정·교제·성폭력'],['129','보건복지상담','긴급복지'],['1577-1389','노인학대','신고·상담'],['1644-8295','장애인학대','신고·상담']];
UI.sos(URGENT);
if(!D||!W){$('status').textContent='자료를 불러오지 못했습니다. 새로고침하거나 메인 검색을 이용해 주세요.';return}

/* 소득 기준표(보건복지부 고시). 2026년도: 복지로 홍보소식 2025-08-08, 2027년도: 2026-07-28 중앙생활보장위원회 의결 보도(1·4인만 공개). */
const INCOME={
 y2026:{label:'2026년',median:[2564238,4199292,5359036,6494738,7556719,8555952]},
 y2027:{label:'2027년(2026.7.28 의결)',median:{1:2736042,4:6929885}},
 rate:[['생계급여',32],['의료급여',40],['주거급여',48],['교육급여',50]],
 src2026:'https://www.bokjiro.go.kr/ssis-tbu/cms/pc/news/promotion/1308418_1118.html',
 src2027:'https://www.newsis.com/view/NISX20260728_0003726285'
};
const won=n=>Math.floor(n).toLocaleString('ko-KR');
function incomeHtml(){
 const m=INCOME.y2026.median;
 return '<p>공공 지원 대부분은 가구원 수별 <b>기준 중위소득</b>의 몇 % 이하인지로 대상을 정합니다. 아래 금액은 한 달 기준이며, 실제 비교하는 <b>소득인정액</b>에는 재산을 소득으로 바꾼 금액이 더해집니다. 표만 보고 받을 수 없다고 판단하지 말고 동 행정복지센터에 물어보세요.</p>'+
 '<h3>2026년 기준 중위소득과 기초생활보장 선정기준(월, 원)</h3><div class="inc-wrap"><table class="inc-table"><thead><tr><th scope="col">가구원</th><th scope="col">기준 중위소득</th>'+INCOME.rate.map(r=>'<th scope="col">'+r[0]+' '+r[1]+'%</th>').join('')+'</tr></thead><tbody>'+
 m.map((v,i)=>'<tr><td>'+(i+1)+'인</td><td>'+won(v)+'</td>'+INCOME.rate.map(r=>'<td>'+won(v*r[1]/100)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
 '<p class="muted">선정기준 금액은 기준 중위소득에 비율을 곱해 원 단위 아래를 버린 값입니다. 복지로가 밝힌 1인 생계급여 820,556원, 4인 생계급여 2,078,316원과 같습니다.</p>'+
 '<h3>2027년(내년 1월부터)</h3><p>4인 가구 기준 중위소득은 '+won(INCOME.y2027.median[4])+'원(6.7% 인상), 1인 가구는 '+won(INCOME.y2027.median[1])+'원으로 정해졌습니다. 1인 생계급여 선정기준은 '+won(INCOME.y2027.median[1]*.32)+'원, 4인은 '+won(INCOME.y2027.median[4]*.32)+'원입니다. 급여별 비율(32·40·48·50%)은 그대로입니다.</p>'+
 '<p class="muted">긴급복지, 바우처, 돌봄 서비스처럼 사업마다 다른 비율(예: 중위소득 75%, 120%, 150% 이하)을 쓰는 지원도 많습니다. 사업 안내의 기준을 따로 확인하세요.</p>';
}
function openIncome(){UI.open({kicker:'보건복지부 고시 · 참고용',title:'소득 기준표',wide:true,html:incomeHtml(),foot:'<a href="'+INCOME.src2026+'" target="_blank" rel="noopener noreferrer">2026년 기준 출처 ↗</a><a href="'+INCOME.src2027+'" target="_blank" rel="noopener noreferrer">2027년 기준 보도 ↗</a><button type="button" class="tu-primary" data-close>닫기</button>'})}
function openHow(){UI.open({kicker:'복지혜택 자가점검',title:'이 화면 쓰는 법',html:'<ol class="how-list"><li><b>01 누구를 위한 도움인지</b>아동·청소년·노인·장애인 같은 대상을 하나 고릅니다. 모르면 고르지 않아도 됩니다.</li><li><b>02 요즘 어려운 일</b>생활비, 집, 병원비, 돌봄처럼 어려운 일을 모두 고릅니다.</li><li><b>03 문의할 곳 보기</b>어려운 일마다 오산 서비스부터 먼저 문의할 곳을 보여 줍니다. 카드의 「자세히」를 누르면 연락처와 신청 방법이 창으로 열립니다.</li></ol><p class="muted">자격을 판정하지 않습니다. 고른 내용은 이 화면에만 있고 저장하거나 보내지 않으며, 새로고침하면 사라집니다. 상담하러 갈 때는 「상담 준비 메모 인쇄」를 쓰세요.</p>',foot:'<a class="tu-primary" href="#checkForm" data-close>자가점검 시작</a>'})}
$('openIncome').addEventListener('click',openIncome);
$('openHow').addEventListener('click',openHow);
$('heroStart').addEventListener('click',()=>UI.done($('heroStart')));
document.querySelector('.know').addEventListener('click',e=>{if(e.target.closest('[data-open="income"]'))openIncome()});

$('targets').innerHTML='<label><input type="radio" name="target" value="" checked><span>고르지 않음</span></label>'+W.targets(D).map(t=>'<label><input type="radio" name="target" value="'+esc(t)+'"><span>'+esc(t)+'</span></label>').join('');
$('situations').innerHTML=W.SITUATIONS.map(s=>'<label'+(s.urgent?' class="safe"':'')+'><input type="checkbox" name="sit" value="'+esc(s.id)+'"><span>'+esc(s.q)+'<small class="need">'+esc(s.need)+'</small></span></label>').join('');
$('status').textContent='대상과 어려운 일을 고른 뒤 「문의할 곳 보기」를 눌러 주세요. 자료 기준일 '+(D.date||'');
// 사는 동(2026-11-26): OY-RALS와 같은 거주 지역 규칙(residence-v1.js). 메인에서 ?dong= 으로 넘어오면 그대로 고른 상태로 시작한다(저장하지 않음).
const dongSel=$('dongSelect');
if(dongSel){if(RES)dongSel.innerHTML=RES.optionsHTML(RES.fromURL(),'고르지 않음 · 오산 전체');else dongSel.closest('fieldset').hidden=true}
const picked=()=>({target:(document.querySelector('input[name="target"]:checked')||{}).value||'',situations:[...document.querySelectorAll('input[name="sit"]:checked')].map(x=>x.value),dong:RES&&dongSel?RES.valid(dongSel.value):''});
function updatePick(){const q=picked();$('pickTarget').textContent=q.target||'고르지 않음';if($('pickDong'))$('pickDong').textContent=q.dong?(RES.zoneText(q.dong).split(' · ')[0]):'고르지 않음';UI.bump($('pickCount'),q.situations.length)}
updatePick();
$('checkForm').addEventListener('change',updatePick);

function bar(by,total){
 if(!total)return '';
 return '<div class="bar" aria-hidden="true">'+W.LEVELS.map((l,i)=>by[l]?'<i class="l'+i+'" style="width:'+(by[l]/total*100).toFixed(1)+'%"></i>':'').join('')+'</div><div class="legend">'+W.LEVELS.map((l,i)=>'<span><i class="l'+i+'"></i>'+W.LEVEL_LABEL[l]+' '+by[l]+'개</span>').join('')+'</div>';
}
const phoneOf=e=>e.o.phone||(e.o.contact&&e.o.contact.phone)||'';
const whenTag=c=>c.status==='확인완료'&&c.date?'<span class="tag ok">공식 안내 확인 '+esc(c.date)+'</span>':c.date?'<span class="tag">기관 안내 확인 '+esc(c.date)+'</span>':'<span class="tag warn">확인일 없음 · 이용 전 문의</span>';
let shown=[];
function card(e){
 const i=shown.push(e)-1,phone=phoneOf(e),ref=e.role==='osan-ref'||e.role==='near-ref';
 return '<article class="card tu-lift'+(ref?' res-ref':e.role==='mine'||e.role==='local'?' res-mine':'')+'"><p>'+(RES&&e.role?RES.tagHTML(e.o,picked().dong):'')+'<span class="tag">'+esc(W.tierLabel(e))+'</span>'+(e.fit==='open'?'<span class="tag warn">대상 미분류</span>':'')+whenTag(e.checked)+'</p>'+
  '<h3>'+esc(e.s.name)+'</h3><p><b>'+esc(e.o.name)+'</b>'+(phone?' · <a href="tel:'+esc(phone.replace(/[^0-9]/g,''))+'">'+esc(phone)+'</a>':'')+'</p>'+
  '<button type="button" class="card-open tu-press" data-card="'+i+'" aria-haspopup="dialog">자세히 <span aria-hidden="true">→</span></button></article>';
}
function openCard(e){
 const phone=phoneOf(e),s=e.s,cand=[s.source,e.o.site,e.o.source].find(u=>/^https:\/\/[^\s"'<>@]+$/.test(u||'')),url=cand||'';
 const rows=[['기관',esc(e.o.name)],['전화',phone?'<a href="tel:'+esc(phone.replace(/[^0-9]/g,''))+'">'+esc(phone)+'</a>':'기관 안내 확인'],['대상',esc(s.target||'자료에 적혀 있지 않음 · 기관에 문의')],['내용',esc(s.description||'')],['신청',esc(s.method||'기관에 문의')],['확인',whenTag(e.checked)]].filter(r=>r[1]);
 UI.open({kicker:W.tierLabel(e)+' · '+(e.fit==='open'?'대상 미분류':'대상 일치'),title:s.name,
  html:'<dl class="dl">'+rows.map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('')+'</dl><p class="muted">받을 수 있는지는 기관이 소득·재산·나이 같은 조건으로 확인합니다. 운영이나 접수 여부가 바뀌었을 수 있으니 이용 전 전화로 확인해 주세요.</p>',
  foot:(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">공식 안내 ↗</a>':'')+'<a href="./#org='+encodeURIComponent(e.o.id)+'">기관 전체 정보</a><button type="button" class="tu-primary" data-close>닫기</button>'});
}
$('result').addEventListener('click',ev=>{const b=ev.target.closest('[data-card]');if(b&&shown[+b.dataset.card])openCard(shown[+b.dataset.card])});

function draw(){
 const q=picked();
 if(!q.situations.length){$('status').textContent='어려운 일을 하나 이상 골라 주세요.';$('result').innerHTML='';$('print').disabled=true;return}
 const r=W.selfCheck(D,q),html=[];shown=[];
 const total=r.groups.reduce((a,g)=>a+g.total,0),osan=r.groups.reduce((a,g)=>a+(g.byLevel['오산시']||0),0),gaps=r.groups.filter(g=>g.total&&g.osanGap).length;
 if(r.urgent)html.push('<section class="urgent" aria-labelledby="urgentTitle"><h2 id="urgentTitle">지금 위험하면 먼저 전화하세요</h2><ul>'+URGENT.slice(0,6).map(x=>'<li><a href="tel:'+x[0].replace(/[^0-9]/g,'')+'"><b>'+x[0]+'</b>'+esc(x[1])+' · '+esc(x[2])+'</a></li>').join('')+'</ul></section>');
 html.push('<div class="summary"><div><b>'+r.groups.length+'</b><span>살펴본 어려움</span></div><div><b>'+osan+'</b><span>오산 서비스</span></div><div><b>'+total+'</b><span>관련 서비스 전체</span></div><div><b>'+gaps+'</b><span>오산 자료가 없는 영역</span></div></div>');
 const desks=r.firstDesk;
 if(r.notice&&RES)html.push(RES.noticeHTML(r.notice));
 const tel=p=>'<a href="tel:'+esc(String(p).replace(/[^0-9]/g,''))+'">'+esc(p)+'</a>';
 // 사는 동을 골랐으면 그 동 창구와 권역 복지관을 바로 적고, 오산 밖이면 그 지역 행정복지센터를 안내한다.
 const deskLine=r.dong&&RES&&RES.isDong(r.dong)?'<b>'+esc(r.dong)+' 행정복지센터</b>'+(desks[0]?' ('+tel(desks[0].phone)+', 시청 대표번호에서 동으로 연결)':'')+'에서 기초생활보장·긴급복지·바우처 등 공공 지원을 한 번에 상담합니다':
  r.dong&&RES?'<b>'+esc(RES.nearCity(r.dong)||'사는 지역')+'의 동 행정복지센터</b>(주민센터)에서 기초생활보장·긴급복지·바우처 등 공공 지원을 한 번에 상담합니다. 오산 행정복지센터는 오산 주민 창구라 뺐습니다':
  '사는 곳의 <b>동 행정복지센터</b>에서 기초생활보장·긴급복지·바우처 등 공공 지원을 한 번에 상담합니다'+(desks.length?' (오산시 대표 '+tel(desks[0].phone)+')':'');
 html.push('<section class="first"><h2>어디에 물을지 모르겠다면</h2><p>'+deskLine+'. 전화 상담은 <a href="tel:129">보건복지상담센터 129</a>, 온라인 신청과 모의계산은 <a href="https://www.bokjiro.go.kr/" target="_blank" rel="noopener noreferrer">복지로 ↗</a>에서 할 수 있습니다.</p>'+(q.situations.length>=3||q.situations.includes('many')?'<p>어려움이 여러 가지라면 '+(r.zone?'<b>'+r.zone.number+'권역 '+esc(r.zone.name)+'</b>'+(r.zone.phone?' ('+tel(r.zone.phone)+')':'')+'의 <b>통합사례관리</b>':'<b>복지관 통합사례관리</b>')+'에서 한꺼번에 상의할 수 있습니다. 여러 기관이 함께 돕는 방식입니다.</p>':'')+(q.situations.includes('care')||['노인','장애인'].includes(r.target)?'<p>어르신이나 장애가 있는 분의 병원·요양·돌봄이 함께 필요하면 <a href="'+esc(RES?RES.withDong('care/',r.dong):'care/')+'">통합돌봄 길잡이</a>에서 신청 방법을 확인하세요.</p>':'')+'</section>');
 for(const g of r.groups){
  const more='service-guide.html?need='+encodeURIComponent(g.need)+(r.target?'&amp;target='+encodeURIComponent(r.target):'');
  html.push('<section class="group" aria-labelledby="g-'+g.id+'"><span class="pill">'+esc(g.need)+'</span><h2 id="g-'+g.id+'">'+esc(g.q)+'</h2><p class="meta">관련 서비스 '+g.total+'개'+(r.target?' · '+esc(r.target)+' 대상과 대상 미분류 포함':'')+'</p>'+bar(g.byLevel,g.total)+
   (g.total&&g.osanGap?'<p class="gapnote">이 사이트에는 이 조건의 오산 서비스가 아직 등록되어 있지 않습니다. 동 행정복지센터에 먼저 물어보고, 경기·전국 서비스를 함께 확인해 주세요.</p>':'')+
   (g.items.length?'<div class="cards tu-stagger">'+g.items.map(card).join('')+'</div>':'<p class="gapnote">조건에 맞는 등록 서비스가 없습니다. 동 행정복지센터나 129에 문의해 주세요.</p>')+
   (g.total>g.items.length?'<a class="more" href="'+more+'">이 영역 서비스 '+g.total+'개 모두 보기 →</a>':'')+'</section>');
 }
 $('result').innerHTML=html.join('');
 UI.enter($('result'));UI.done($('run'));
 $('status').textContent='문의할 곳 후보를 '+r.groups.length+'개 영역으로 정리했습니다. 자격 판정이 아니며 이용 전 기관에 확인해 주세요.';
 $('printMeta').textContent='대상: '+(r.target||'고르지 않음')+(r.dong?' · 사는 곳: '+r.dong:'')+' · 어려운 일: '+r.groups.map(g=>g.need).join(', ')+' · 자료 기준일 '+(D.date||'')+' · 자격 판정 아님';
 $('print').disabled=false;
 $('status').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
$('checkForm').addEventListener('submit',e=>{e.preventDefault();draw()});
if(dongSel)dongSel.addEventListener('change',()=>{if($('result').innerHTML)draw()});
$('reset').addEventListener('click',()=>{$('checkForm').reset();$('result').innerHTML='';shown=[];$('print').disabled=true;$('run').classList.remove('tu-done');updatePick();$('status').textContent='처음부터 다시 고를 수 있습니다.'});
$('print').addEventListener('click',()=>window.print());
updatePick();
})();
