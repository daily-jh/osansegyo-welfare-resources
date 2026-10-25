/* © 2026 김지훈. 전 생애주기 복지서비스 탐색·의뢰 지원. 개인정보 전송·보관 없음. */
(()=>{'use strict';
const D=window.WELFARE_DATA,M=window.ResourceServiceGuideModel,E=window.OWR_SERVICE_EVIDENCE?.items||{};
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=x=>{try{const u=new URL(x);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}};
const tel=x=>String(x||'').replace(/[^0-9+]/g,'');
if(!D||!M||!Array.isArray(D.organizations)){$('status').textContent='서비스 데이터를 불러오지 못했습니다. 전체 기관 검색을 이용해 주세요.';return}
const entries=D.organizations.flatMap(o=>(o.services||[]).map(s=>({o,s})));
const byId=new Map(entries.map(e=>[e.s.id,e])),selected=new Set(),limit=5;
let matches=[],page=0;
for(const [field,values] of [['need',D.taxonomy.need],['target',D.taxonomy.target],['form',D.taxonomy.form]]){
 const select=$(field);for(const v of values){const opt=document.createElement('option');opt.value=v;opt.textContent=v;select.appendChild(opt)}
}
const filters=()=>({need:$('need').value,target:$('target').value,form:$('form').value,scope:$('scope').value,keyword:$('keyword').value});
function details(entry){
 const {o,s}=entry,ev=E[s.id],v=s.verification||{},route=M.route(o,s,ev),source=safe(ev?.sourceUrl)||safe(s.source);
 const telLink=route.phone?'<a href="tel:'+esc(tel(route.phone))+'">'+esc(route.phone)+'</a>':'전화번호 확인 필요';
 const requirements=ev?.eligibility||{}, verifyText=ev?.evidenceLabel||M.sourceState(s,ev);
 const fields=[['연령',requirements.age],['거주지',requirements.residence],['추가조건',requirements.other],['비용',requirements.fee],['증빙서류',requirements.documents]].filter(x=>x[1]);
 const extra=fields.length?fields.map(x=>'<p><b>'+esc(x[0])+'</b> '+esc(x[1])+'</p>').join(''):'<p><b>이용조건</b> 개별 모집·등록 기준 미대조 — 연령·거주지·소득·비용·서류 확인 필요</p>';
 const alts=M.alternatives(entry,entries,filters(),2);
 const altsHtml=alts.length?alts.map(a=>'<li><strong>'+esc(a.entry.o.name)+'</strong> — '+esc(a.entry.s.name)+'<br/><small>'+esc(a.reason)+' · 적합성·접수 여부 직접 확인</small></li>').join(''):'<li>현재 동일 지원영역·대상 기준 대체 후보 없음 — 해당 기관에 대기·타기관 의뢰 경로 문의</li>';
 return '<div class="detail-panel"><p><b>기관</b> '+esc(o.name)+' / '+esc(o.level)+'</p>'+
 '<p><b>지원내용</b> '+esc(s.description||'서비스 내용 미등록')+'</p>'+
 '<p><b>공식 확인 범위</b> '+esc(verifyText)+'</p>'+
 '<p><b>공개 안내 확인일</b> '+esc(ev?.checkedOn||v.date||'미확인')+' <small>※ 과거 자료의 확인일은 이번 재검증 일자가 아닙니다.</small></p>'+
 '<p><b>현재 접수 상태</b> '+esc(M.intakeState(s,ev))+'</p>'+extra+
 '<p><b>신청·의뢰</b> '+esc(s.method||'접수절차 확인 필요')+'</p>'+
 '<p><b>연락 창구</b> '+esc(route.dept||'담당부서 확인 필요')+' '+telLink+(route.extension?' · 내선 '+esc(route.extension):'')+'<br/><small>'+esc(route.level)+'</small></p>'+
 '<p><b>첫 문의</b> '+esc(ev?.ask||'서비스 대상·소득·거주지·접수방식·준비서류·현재 접수 및 대기기간')+'</p>'+
 (ev?.caution?'<p class="caution">'+esc(ev.caution)+'</p>':'')+
 '<div class="actions">'+(source?'<a href="'+esc(source)+'" rel="noopener noreferrer" target="_blank">관련 공식·등록 근거 ↗</a>':'')+
 (safe(o.site)?'<a href="'+esc(safe(o.site))+'" rel="noopener noreferrer" target="_blank">기관 사이트 ↗</a>':'')+'</div>'+
 '<details class="alt"><summary>접수 불가·대기 시 대체 문의 후보</summary><ul>'+altsHtml+'</ul></details></div>';
}
function item(entry){
 const {o,s}=entry,ev=E[s.id],route=M.route(o,s,ev),chosen=selected.has(s.id);
 return '<article class="card" id="service-'+esc(s.id)+'"><div class="badges"><span class="pill">'+esc(o.level||'지역 미분류')+'</span><span class="pill">'+esc(M.sourceState(s,ev))+'</span><span class="pill unknown">접수 가능 미확인</span></div>'+
 '<h3>'+esc(s.name)+'</h3><p><b>기관</b> '+esc(o.name)+'</p>'+
 '<p><b>대상 안내</b> '+esc(s.target||'미기록')+'</p>'+
 '<p><b>담당 창구</b> '+esc(route.dept||route.level)+(route.phone?' · '+esc(route.phone):'')+(route.extension?' (내선 '+esc(route.extension)+')':'')+'</p>'+
 '<div class="card-buttons"><button type="button" class="secondary" data-detail="'+esc(s.id)+'" aria-expanded="false" aria-controls="detail-'+esc(s.id)+'">이용조건·의뢰절차 확인</button>'+
 '<button type="button" class="choose" data-select="'+esc(s.id)+'" aria-pressed="'+chosen+'">'+(chosen?'✓ 연계 시트에서 제외':'＋ 연계 시트에 담기')+'</button></div>'+
 '<div id="detail-'+esc(s.id)+'" hidden></div></article>';
}
function status(){ $('sheetCount').textContent=selected.size;$('printSelected').disabled=selected.size===0;$('clearSelected').disabled=selected.size===0 }
function draw(){const items=matches.slice(0,(page+1)*24);
 $('status').textContent='등록된 서비스 '+entries.length+'개 중 조건 일치 '+matches.length+'개 · 현재 접수 확인 건수로 해석하지 마세요. 자료 정리일 '+D.date;
 $('results').innerHTML=items.map(item).join('');
 $('paging').innerHTML=items.length<matches.length?'<button type="button" id="more" aria-label="서비스 목록 더 보기">서비스 더 보기 ('+items.length+' / '+matches.length+')</button>':'';
 const more=$('more');if(more)more.addEventListener('click',()=>{page++;draw()});
 status();
}
function search(){page=0;matches=entries.filter(e=>M.matches(e,filters()));draw()}
$('results').addEventListener('click',ev=>{
 const b=ev.target.closest('[data-select],[data-detail]');if(!b)return;
 if(b.dataset.select){const id=b.dataset.select;if(selected.has(id))selected.delete(id);else if(selected.size>=limit){$('sheetMessage').textContent='인쇄용 연계 시트는 최대 '+limit+'개 서비스까지 선택할 수 있습니다.';return}else selected.add(id);$('sheetMessage').textContent='개인정보는 저장하지 않습니다.';draw();return}
 const id=b.dataset.detail;if(!id||!byId.has(id))return;
 const box=$('detail-'+id);box.hidden=!box.hidden;b.setAttribute('aria-expanded',String(!box.hidden));if(!box.hidden){box.innerHTML=details(byId.get(id));b.textContent='상세정보 접기'}else{box.replaceChildren();b.textContent='이용조건·의뢰절차 확인'}
});
for(const id of ['need','target','form','scope','keyword'])$(id).addEventListener(id==='keyword'?'input':'change',search);
$('clearSelected').addEventListener('click',()=>{selected.clear();$('sheetMessage').textContent='선택을 모두 지웠습니다.';draw()});
$('printSelected').addEventListener('click',()=>{
 if(!selected.size)return;
 const ordered=[...selected].map(id=>byId.get(id)).filter(Boolean);
 const rows=ordered.map(({o,s})=>{const e=E[s.id],c=M.route(o,s,e),alts=M.alternatives({o,s},entries,{target:$('target').value},2);
 const reason=[...M.tags(s,'need'),...M.tags(s,'target')].join(' · ')||'선택한 서비스';
 return '<article class="print-card"><h3>'+esc(o.name)+' — '+esc(s.name)+'</h3>'+
 '<dl><dt>선정 근거(검색용 분류)</dt><dd>'+esc(reason)+'</dd>'+
 '<dt>지원대상·이용조건</dt><dd>'+esc(e?.eligibility?.age||s.target||'확인 필요')+' / '+esc(e?.eligibility?.residence||'거주·소득·비용 등 확인 필요')+'</dd>'+
 '<dt>담당 창구</dt><dd>'+esc(c.dept||c.level)+' '+esc(c.phone)+(c.extension?' 내선 '+esc(c.extension):'')+'</dd>'+
 '<dt>초기 문의사항</dt><dd>'+esc(e?.ask||'대상·서류·비용·접수방식·대기·예산 확인')+'</dd>'+
 '<dt>서비스 안내 근거</dt><dd>'+esc(M.sourceState(s,e))+' / '+esc(e?.sourceUrl||s.source||'미기록')+'</dd>'+
 '<dt>현재 접수 가능성</dt><dd>미확인 — 공식 기관의 개별 확인 필요</dd>'+
 '<dt>부적합·대기 시 대안</dt><dd>'+esc(alts.map(x=>x.entry.o.name+' '+x.entry.s.name).join(' / ')||'담당기관에 타기관·대기경로 문의')+'</dd>'+
 '<dt>실무자 확인·다음 조치</dt><dd>□ 조건 확인　□ 담당자 통화　□ 의뢰 가능 확인　□ 대체 경로 확인</dd></dl></article>';
 }).join('');
 $('sheet').innerHTML='<h1>복지서비스 의뢰 준비·비교 시트</h1><p>오산 복지자원 찾기 · 공개기관 정보만 포함 · 출력일 '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'</p><p>서비스 안내와 실제 접수 가능 여부는 다릅니다. 기관에 확인 후 의뢰합니다. 사례대상자 개인정보를 기입하지 마세요.</p>'+rows+'<small>© 2026 김지훈 · 담당자 확인 및 사례별 동의·법정 절차는 별도로 진행하십시오.</small>';
 document.body.classList.add('printing');try{window.print()}finally{setTimeout(()=>document.body.classList.remove('printing'),300)}
});
search();
})();