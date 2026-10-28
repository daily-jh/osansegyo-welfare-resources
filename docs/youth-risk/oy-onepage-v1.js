/* OY-RALS 핵심 결과 1장 v1 — 평가를 마치면 질문 4개(지금 안전한가·얼마나 급한가·무엇이 어려운가·누가 무엇을 하나)로 한 장만 먼저 보여 주고,
   척도 해석·서술기록 분석·통합 사정의견은 「자세히 보기」 아래로 접는다(문시중 교사 의견 2026-10-28: 결과가 너무 많다, 이걸 다 해야 하나).
   판정은 05 최종 보고서와 같은 값(OYFinalReport.model → OYDecision.forPayload)만 읽고 다시 계산하지 않는다. 서술 원문은 쓰지 않는다.
   역할(oy-prefs OYRole)에 따라 '다음 할 일'과 '이 역할은 여기까지'만 바뀐다. 다른 역할 메뉴는 숨기지 않고 연하게 보인다. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261028';
const need=(n,g)=>node?require('./'+n):root[g];
const FR=()=>need('oy-final-report-v1.js','OYFinalReport');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
const dots=v=>'<span class="oy1-dots" aria-label="가장 높은 문항 '+v+'점">'+[1,2,3,4].map(k=>'<i class="'+(k<=v?'f':'')+'"></i>').join('')+'</span>';

/* 역할별 범위. steps는 상단 메뉴 data-oy-step 값(1=01, 2=02, 6=03, 3=04, 7=05). */
const SCOPE={
  teacher:{name:'담임교사',steps:['1','2'],end:'담임교사는 여기까지입니다. 이 한 장을 교육복지사(또는 Wee클래스)에게 전달하고, 필요하면 02 지역자원 지도에서 가까운 기관을 함께 봅니다. 03 학교 지원은 궁금할 때만 보세요.'},
  edu:{name:'교육복지사',steps:['1','6','2'],end:'교육복지사는 01 결과와 03 학교 지원(교육복지사 절차)까지 봅니다. 학교 밖 자원이 필요하면 02 지역자원을 엽니다.'},
  team:{name:'학맞통 지원팀',steps:['1','7'],end:'학맞통 지원팀은 이 한 장과 05 최종 보고서(사례회의 자료)를 봅니다. 근거가 더 필요하면 「자세히 보기」를 엽니다.'},
  cwc:{name:'사회복지관',steps:['1','2','3','7'],end:'기관 실무자는 01부터 05까지 전체 흐름을 씁니다. 이 한 장은 사례회의 첫 장으로 쓰면 됩니다.'},
  child:{name:'아동·가족기관',steps:['1','2','3','7'],end:'기관 실무자는 01부터 05까지 전체 흐름을 씁니다. 이 한 장은 사례회의 첫 장으로 쓰면 됩니다.'},
  admin:{name:'행정복지센터',steps:['1','2','3','7'],end:'행정복지센터는 01 결과와 02 지역자원, 04 기관 사례관리(행정복지센터 역할)를 봅니다.'}
};
const roleNow=()=>{try{return (root.OYRole&&root.OYRole.current())||''}catch(_){return ''}};

/* 한 장에 들어갈 값. p는 평가 결과(payload), role은 역할 id. */
function model(p,role){
  const k=FR().model(p,{includeNarrative:false});
  const ans=p.answers||[];
  const unknown=ans.filter(v=>v==='unknown'||v==null).length;
  const prof=(k.profile||[]).filter(d=>(d.peak||0)>=2).sort((a,b)=>(b.peak||0)-(a.peak||0)).slice(0,3).map(d=>({t:d.name,v:d.peak||0,label:d.label||''}));
  const hard=prof.length?prof:k.keys.filter(x=>x.v>0).map(x=>({t:x.t,v:x.v,label:''}));
  const safetyTone=k.urgent?'r':k.safety.tone==='check'?'c':'ok';
  const sel=k.R.selection||{};
  const steps=nextSteps(k,role,unknown,sel);
  return {k,role,scope:SCOPE[role]||null,unknown,hard,safetyTone,steps,tier:k.tier,tierName:k.tierName,tierWhy:k.tierWhy,provisional:!!k.R.provisional};
}
const m_hard=k=>(k.profile||[]).some(d=>(d.peak||0)>=2);
function nextSteps(k,role,unknown,sel){
  const S=[],multi=sel.status==='met'||sel.status==='review';
  const safetyFirst=k.urgent?'오늘 안에 '+(k.immediate||'학교 안전 절차')+'로 확인합니다. 기다리거나 혼자 판단하지 않습니다.':'';
  if(role==='teacher'){
    if(k.urgent)S.push('지금 교육복지사·상담교사·관리자에게 바로 알립니다. 학교 위기대응 절차를 따릅니다.');
    S.push('이 한 장을 교육복지사(또는 Wee클래스)에게 전달합니다.');
    if(unknown)S.push('모르는 문항 '+unknown+'개는 미상으로 둔 채 넘겨도 됩니다. 교육복지사가 보완합니다.');
    if(!k.urgent&&m_hard(k))S.push('궁금하면 02 지역자원 지도에서 어려운 영역에 맞는 가까운 기관을 봅니다.');
    if(S.length<3)S.push('평소처럼 지켜보고, 달라진 점이 있으면 날짜와 함께 짧게 적어 둡니다.');
  }else if(role==='edu'){
    if(safetyFirst)S.push(safetyFirst);
    if(unknown)S.push('미상 '+unknown+'개를 학생·담임과 확인해 01에서 고친 뒤 다시 봅니다.');
    S.push('03 학교 지원의 교육복지사 절차로 학교 안 지원을 정합니다.');
    if(multi)S.push('학교 밖 기관이 함께 필요합니다('+sel.label+'). 학맞통 지원팀·'+k.lead+'과 사례회의 안건으로 올립니다.');
  }else if(role==='team'){
    if(safetyFirst)S.push(safetyFirst);
    S.push('05 최종 보고서를 사례회의 자료로 씁니다.');
    S.push('통합사례관리: '+sel.label+'. 주관은 '+k.lead+'으로 잠정 제안합니다.');
  }else{
    if(safetyFirst)S.push(safetyFirst);
    if(k.first&&!k.urgent)S.push(k.first);
    S.push('진행: '+k.path+' (주관 '+k.lead+')');
    if(k.agenda.length)S.push('사례회의에서 정할 것 '+k.agenda.length+'가지가 있습니다.');
  }
  return S.slice(0,3);
}

function html(m){
  const k=m.k,sc=m.scope;
  const tierBar='<ol class="oy1-tier" aria-label="지원 우선순위 5단계">'+NAMES.map((n,i)=>'<li class="'+(m.tier===i+1?'on':'')+(i===4?' top':'')+'"><b>'+(i+1)+'</b><span>'+esc(n)+'</span></li>').join('')+'</ol>';
  const hard=m.hard.length?'<ul class="oy1-hard">'+m.hard.map(h=>'<li><span>'+esc(h.t)+'</span>'+dots(h.v)+'</li>').join('')+'</ul>':'<p class="oy1-muted">2점 이상인 영역이 없습니다. 평소처럼 지켜봅니다.</p>';
  const roles=Object.keys(SCOPE);
  return '<div class="oy1-head"><div><span class="oy1-kicker">핵심 결과 한 장</span><h3 id="oy1Title">이것만 먼저 보세요</h3></div>'+
   '<p class="oy1-role">'+(sc?'<b>'+esc(sc.name)+'</b> 기준':'역할을 고르면 다음 할 일이 맞춰집니다')+'</p></div>'+
   (sc?'':'<div class="oy1-pick" role="group" aria-label="역할 고르기">'+roles.map(r=>'<button type="button" data-oy-role="'+r+'">'+esc(SCOPE[r].name)+'</button>').join('')+'</div>')+
   '<div class="oy1-grid">'+
   '<section class="oy1-q oy1-'+m.safetyTone+'"><h4><i>1</i>지금 안전한가요?</h4><p class="oy1-v">'+esc(k.safety.value)+'</p><p class="oy1-why">'+esc(k.safety.why)+'</p>'+
    (m.safetyTone==='c'?'<p class="oy1-callc">모르는 안전 문항은 안전하다고 보지 않습니다. 오늘 직접 확인해 주세요.</p>':'')+(k.urgent?'<p class="oy1-call">급하면 <b>112</b> · 청소년상담 <b>1388</b> · 자살예방 <b>109</b></p>':'')+'</section>'+
   '<section class="oy1-q"><h4><i>2</i>얼마나 급한가요?</h4><p class="oy1-v">'+esc(m.tier?m.tier+'단계 '+m.tierName:m.tierName)+'</p>'+tierBar+'<p class="oy1-why">'+esc(m.tier?m.tierWhy:'모르는 문항을 확인하기 전에는 단계를 정하지 않습니다.')+'</p></section>'+
   '<section class="oy1-q"><h4><i>3</i>무엇이 어려운가요?</h4>'+hard+'</section>'+
   '<section class="oy1-q oy1-do"><h4><i>4</i>'+(sc?esc(sc.name)+'는 무엇을 하나요?':'누가 무엇을 하나요?')+'</h4><ol class="oy1-steps">'+m.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></section>'+
   '</div>'+
   (sc?'<p class="oy1-end"><b>여기까지</b> '+esc(sc.end)+'</p>':'')+
   '<div class="oy1-actions">'+(m.role==='teacher'?'<button type="button" class="flow-btn flow-primary" data-oy1-pass aria-expanded="false" aria-controls="oy1Pass">교육복지사에게 전달하기</button>':'')+
   '<button type="button" class="flow-btn'+(m.role==='teacher'?'':' flow-primary')+'" data-oy1-print>이 한 장 인쇄 · PDF</button>'+
   (m.scope&&m.scope.steps.includes('2')?'<button type="button" class="flow-btn" data-oy1-map>02 지역자원 지도 보기</button>':'')+
   '<button type="button" class="flow-btn oy1-more" data-oy1-more aria-expanded="false" aria-controls="journey88">자세히 보기 · 척도 해석·서술기록·통합 사정의견</button></div>'+
   (m.role==='teacher'?'<div class="oy1-pass" id="oy1Pass" hidden><p><b>전달 방법 두 가지</b> 어느 쪽이든 학생 이름과 서술기록은 들어가지 않습니다.</p><ol><li><button type="button" class="flow-btn" data-oy1-print>한 장 인쇄해서 건네기</button></li><li><button type="button" class="flow-btn" data-oy1-json>응답 파일(JSON) 저장해서 보내기</button> <small>교육복지사가 「JSON 불러오기」로 열면 이어서 보완할 수 있습니다.</small></li></ol></div>':'')+
   '<p class="oy1-foot">판정은 05 최종 보고서·04 판정 띠와 같은 값입니다. 이 한 장은 시스템이 낸 초안이며 실무자 판단을 대신하지 않습니다.</p>';
}
function text(m){
  const k=m.k,L=['OY-RALS 핵심 결과 한 장'+(m.scope?' · '+m.scope.name+' 기준':''),''];
  L.push('1. 지금 안전한가요? '+k.safety.value+' ('+k.safety.why+')');
  L.push('2. 얼마나 급한가요? '+(m.tier?m.tier+'단계 '+m.tierName:m.tierName));
  L.push('3. 무엇이 어려운가요? '+(m.hard.map(h=>h.t+' '+h.v+'점').join(', ')||'2점 이상 영역 없음'));
  L.push('4. 다음 할 일');m.steps.forEach((s,i)=>L.push('  '+(i+1)+') '+s));
  return L.join('\n');
}

/* ── 화면 연결 ── */
let cur=null,open={};
function flow(){return root.document&&root.document.getElementById('assessmentFlow');}
function navMine(role){
  const doc=root.document,sc=SCOPE[role];
  doc.querySelectorAll('.flow-nav [data-oy-step]').forEach(b=>{const mine=!sc||sc.steps.includes(b.dataset.oyStep);b.classList.toggle('oy1-other',!mine);if(!mine)b.title='다른 역할 자료 · 필요할 때 열 수 있습니다';else b.removeAttribute('title');});
}
function setFold(on){const f=flow();if(f)f.classList.toggle('oy1-fold',on);const b=root.document.querySelector('[data-oy1-more]');if(b){b.setAttribute('aria-expanded',String(!on));b.textContent=on?'자세히 보기 · 척도 해석·서술기록·통합 사정의견':'자세히 보기 접기';}}
function render(){
  const doc=root.document;let box=doc.getElementById('oyOnePage');
  navMine(roleNow());
  const on=!!(cur&&cur.ready&&cur.payload&&cur.stage===2&&cur.view!=='map');
  if(!on){if(box)box.hidden=true;const f=flow();if(f)f.classList.remove('oy1-fold');return;}
  if(!box){box=doc.createElement('section');box.id='oyOnePage';box.className='oy1';box.setAttribute('aria-labelledby','oy1Title');const j=doc.getElementById('journey88');(j&&j.parentNode?j.parentNode.insertBefore(box,j):flow().prepend(box));}
  let m;try{m=model(cur.payload,roleNow())}catch(e){box.hidden=true;setFold(false);return;}
  box.hidden=false;box.innerHTML=html(m);box.__model=m;
  setFold(!open[cur.payload.flowRevision]);
}
function printOne(doc){
  const box=doc.getElementById('oyOnePage');if(!box||!box.__model)return;
  const old=doc.getElementById('oy1-print-root');if(old)old.remove();
  const el=doc.createElement('section');el.id='oy1-print-root';el.className='oy1 oy1-print';
  el.innerHTML='<p class="oy1-date">'+esc(new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'}))+' · 실무자 확인 전 초안 · 학생 이름·서술기록 미포함</p>'+html(box.__model);
  el.querySelectorAll('.oy1-actions,.oy1-pass,.oy1-pick').forEach(x=>x.remove());
  doc.body.append(el);doc.body.classList.add('oy1-printing');
  const w=doc.defaultView,done=()=>{el.remove();doc.body.classList.remove('oy1-printing');w&&w.removeEventListener('afterprint',done)};
  if(w){w.addEventListener('afterprint',done);try{w.print()}catch(_){done()}}
}
function bind(doc){
  if(!doc||doc.__oy1Bound)return;doc.__oy1Bound=true;
  doc.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target:null;if(!t)return;
    if(t.closest('[data-oy-role]')){setTimeout(render,0);return;}
    const more=t.closest('[data-oy1-more]');if(more&&cur){const rev=cur.payload.flowRevision;open[rev]=!open[rev];setFold(!open[rev]);if(open[rev]){const j=doc.getElementById('journey88');j&&j.scrollIntoView({behavior:'smooth',block:'start'});}return;}
    if(t.closest('[data-oy1-map]')){const n=doc.querySelector('.flow-nav [data-oy-step="2"]');if(n&&!n.disabled)n.click();return;}
    if(t.closest('[data-oy1-print]')){printOne(doc);return;}
    const pass=t.closest('[data-oy1-pass]');if(pass){const p=doc.getElementById('oy1Pass');if(p){p.hidden=!p.hidden;pass.setAttribute('aria-expanded',String(!p.hidden));}return;}
    if(t.closest('[data-oy1-json]')){const b=doc.getElementById('exportAssessment');if(b&&!b.disabled)b.click();return;}
  });
  root.addEventListener('oy-journey-view',e=>{cur=e.detail;setTimeout(render,0);});
}
const api=Object.freeze({VERSION,SCOPE,model,html,text});
if(node)module.exports=api;else{root.OYOnePage=api;if(root.document)bind(root.document);}
})(typeof window!=='undefined'?window:globalThis);
