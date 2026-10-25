/* © 2026 김지훈. 범용 서비스 탐색: 평가척도·추천 우선순위와 독립. */
(()=>{'use strict';const D=window.WELFARE_DATA;const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=x=>{try{const u=new URL(x);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}};
if(!D||!Array.isArray(D.organizations)){$('status').textContent='데이터 로드 실패: 전체 검색 화면을 이용해 주세요.';return}
for(const [field,values] of [['need',D.taxonomy.need],['target',D.taxonomy.target],['form',D.taxonomy.form]]){const sel=$(field);for(const v of values){const o=document.createElement('option');o.value=v;o.textContent=v;sel.append(o)}}
const entries=D.organizations.flatMap(o=>(o.services||[]).map(s=>({o,s})));
let page=0;const per=24;let matches=[];
function render(){const need=$('need').value,target=$('target').value,form=$('form').value,scope=$('scope').value,kw=$('keyword').value.trim().normalize('NFKC').toLowerCase();
matches=entries.filter(({o,s})=>{const t=s.tags||{};const text=[o.name,s.name,s.description,s.target,s.method,s.category].join(' ').normalize('NFKC').toLowerCase();
return !['중단','폐지'].includes(o.status)&&(!need||(t.need||[]).includes(need))&&(!target||(t.target||[]).includes(target))&&(!form||(t.form||[]).includes(form))&&(!scope||o.level===scope)&&(!kw||text.includes(kw))});
page=0;draw()}
function draw(){const items=matches.slice(0,(page+1)*per);$('status').textContent='검색된 서비스 '+matches.length+'개 · 등록 자료 '+(D.date||'확인 필요')+' 기준 (현재 접수 가능 수가 아닙니다)';
$('results').innerHTML=items.map(({o,s})=>{const source=url(s.source),site=url(o.site),v=s.verification||{};
const contact=(s.contacts||[]).map(c=>[c.name,c.phone,c.department].filter(Boolean).join(' · ')).join(' / ');
const check='대상·거주지·소득·비용·서류·현재 접수 및 대기 여부';
return '<article class="card"><span class="pill">'+esc(o.level||'지역 미분류')+'</span> <span class="pill unknown">접수 가능 여부 개별 확인</span><h3>'+esc(s.name)+'</h3><p><b>운영기관</b> '+esc(o.name)+'</p><p><b>도움 내용</b> '+esc(s.description||'서비스 상세 설명 확인 필요')+'</p><p><b>등록 대상</b> '+esc(s.target||'조건 확인 필요')+'</p><p><b>신청·의뢰 안내</b> '+esc(s.method||'기관 문의 필요')+'</p><p><b>연락 창구</b> '+esc(contact||o.phone||'대표 창구 확인 필요')+'</p><p><b>처음 문의할 사항</b> '+check+'</p><p><b>근거 확인일</b> '+esc(v.date||'미확인')+' · <b>검증상태</b> '+esc(v.status||'미확인')+'</p><div class="actions">'+(source?'<a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">서비스 근거 ↗</a>':'')+(site?'<a href="'+esc(site)+'" target="_blank" rel="noopener noreferrer">기관 홈페이지 ↗</a>':'')+'<a href="index.html#searchArea">기관 상세 검색 ↗</a></div></article>'}).join('');
$('paging').innerHTML=items.length<matches.length?'<button id="more" type="button">서비스 더 보기 ('+items.length+' / '+matches.length+')</button>':'';const b=$('more');if(b)b.addEventListener('click',()=>{page++;draw()})}
for(const id of ['need','target','form','scope','keyword'])$(id).addEventListener(id==='keyword'?'input':'change',render);render();
})();