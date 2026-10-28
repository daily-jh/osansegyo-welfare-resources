/* OY-RALS 핵심 결과 1장 v1 — 평가를 마치면 질문 4개(지금 안전한가·얼마나 급한가·무엇이 어려운가·누가 무엇을 하나)로 한 장만 먼저 보여 주고,
   척도 해석·서술기록 분석·통합 사정의견은 「자세히 보기」 아래로 접는다(문시중 교사 의견 2026-10-28: 결과가 너무 많다, 이걸 다 해야 하나).
   판정은 05 최종 보고서와 같은 값(OYFinalReport.model → OYDecision.forPayload)만 읽고 다시 계산하지 않는다. 서술 원문은 쓰지 않는다.
   역할(oy-prefs OYRole)에 따라 '다음 할 일'과 '이 역할은 여기까지'만 바뀐다. 다른 역할 메뉴는 숨기지 않고 연하게 보인다. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.1.0-20261028';
const need=(n,g)=>node?require('./'+n):root[g];
const FR=()=>need('oy-final-report-v1.js','OYFinalReport');
const OBS=()=>{try{return need('oy-perspective-v1.js','OYPerspective').OBS||{}}catch(_){return {}}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
const dots=v=>'<span class="oy1-dots" aria-label="가장 높은 문항 '+v+'점">'+[1,2,3,4].map(k=>'<i class="'+(k<=v?'f':'')+'"></i>').join('')+'</span>';

/* 역할별 범위. steps는 상단 메뉴 data-oy-step 값(1=01, 2=02, 6=03, 3=04, 7=05). */
const SCOPE={
  teacher:{name:'담임교사',steps:['1','2'],end:'담임교사는 학생의 변화를 가장 먼저 알아차리고 연결하는 역할입니다. 이 한 장을 교육복지사(또는 Wee클래스)에게 전해 주시면 이후 지원은 학교와 기관이 함께 이어 갑니다. 가까운 기관이 궁금하면 02 지역자원 지도를 보세요.'},
  edu:{name:'교육복지사',steps:['1','6','2'],end:'교육복지사는 학교 안 지원을 정하고 학교 밖 기관과 잇는 역할입니다. 01 결과와 03 학교 지원(교육복지사 절차)을 중심으로 보고, 학교 밖 자원은 02 지역자원에서 찾습니다.'},
  team:{name:'학맞통 지원팀',steps:['1','7'],end:'학맞통 지원팀은 사례회의에서 지원 계획과 맡을 기관을 정하는 역할입니다. 이 한 장과 05 최종 보고서를 회의 자료로 쓰고, 근거가 더 필요하면 「자세히 보기」를 엽니다.'},
  cwc:{name:'사회복지관',steps:['1','2','3','7'],end:'사회복지관은 사정부터 계획·보고서까지 사례를 이끄는 역할입니다. 01부터 05까지 전체 흐름을 쓰고, 이 한 장은 사례회의 첫 장으로 씁니다.'},
  child:{name:'아동·가족기관',steps:['1','2','3','7'],end:'아동·가족기관은 가족과 돌봄 영역의 전문 지원을 맡는 역할입니다. 01부터 05까지 전체 흐름을 쓰고, 이 한 장은 사례회의 첫 장으로 씁니다.'},
  admin:{name:'행정복지센터',steps:['1','2','3','7'],end:'행정복지센터는 공공 급여·서비스를 확인하고 연결하는 역할입니다. 01 결과와 02 지역자원, 04 기관 사례관리(행정복지센터 역할)를 봅니다.'}
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
  const teach=extras(k,ans,role);
  return {k,role,scope:SCOPE[role]||null,unknown,hard,safetyTone,steps,teach,tier:k.tier,tierName:k.tierName,tierWhy:k.tierWhy,provisional:!!k.R.provisional};
}
/* 역할별로 한 장을 채우는 추천 항목. 모두 척도 응답·판정 사슬·해석에서 나오며 서술 원문은 쓰지 않는다.
   블록: {h 제목, li 목록 | p 문단, tip 작은 안내, cls}. 마지막은 그 역할이 손으로 적는 메모 칸. */
const first=t=>String(t||'').split(/(?<=다\.)\s+/)[0];
const roleItems=(d,name)=>(((d.roles||[]).find(r=>r.role===name)||{}).items||[]).slice(0,3);
function extras(k,ans,role){
  if(!SCOPE[role])return null;
  const d=k.R.deep||{},I=k.R.integrated||{},O=OBS(),sel=k.R.selection||{};
  const watch=ans.map((v,i)=>({n:i+1,v})).filter(x=>Number.isInteger(x.v)&&x.v>=2&&O[x.n]).sort((a,b)=>b.v-a.v).slice(0,5).map(x=>O[x.n]);
  const strengths=(k.strengths||[]).slice(0,2).map(x=>x.label+' · '+first(x.text));
  const near=(k.resources||[]).slice(0,3).map(r=>({b:r.name,t:r.service,s:r.domain}));
  const qs=all=>(I.questions||[]).filter(q=>all||q.why!=='안전 확인').slice(0,all?3:2).map(q=>'“'+q.q+'”');
  const meet=[...k.agenda.map(a=>a.t),...(k.meet||[])].slice(0,4);
  const stops=(k.stops||[]).map(st=>st.h+' · '+(((st.rows||[])[0]||{}).what||'')).filter(t=>!/ · $/.test(t)).slice(0,4);
  const goals=(k.goals||[]).slice(0,3).map(g=>g.topic+' → '+g.target);
  const fam=first(k.family);
  const B=[];const add=(h,o)=>{if((o.li&&o.li.length)||o.p||o.near&&o.near.length)B.push({h,...o})};
  const nearTip='연결은 담당자와 함께 정합니다. 02 지역자원 지도에서 더 볼 수 있습니다.';
  if(role==='teacher'){
    const care=['어려움을 반 친구들 앞에서 지적하거나 묻지 않습니다.','원인(학대·방임 등)을 짐작해 학생이나 보호자에게 캐묻지 않습니다. 본 것만 적습니다.'];
    if(k.urgent)care.unshift('비밀로 해 달라는 부탁에는 "너를 지키려면 도와줄 선생님께 알려야 해"라고 말하고 약속하지 않습니다.');
    else if(needToday(k))care.unshift((checkWhat(k)||'현재 안전')+'은 담임이 캐묻지 말고 교육복지사·상담교사가 직접 확인하도록 오늘 넘깁니다.');
    B.push({h:'교실에서 살펴볼 모습',li:watch,tip:watch.length?'언제·어떤 수업에서 봤는지 날짜와 함께 사실만 짧게 적어 두면 교육복지사에게 큰 도움이 됩니다.':'',p:watch.length?'':'2점 이상 응답이 없어 따로 살필 모습은 없습니다. 평소처럼 지켜봅니다.'});
    add('수업·생활에서 도울 수 있는 것',{li:roleItems(d,'교사')});
    add('학생에게 이렇게 물어보세요',{li:k.urgent?[]:qs(false),tip:'대답을 재촉하지 않고, 말해 준 것에 고맙다고 해 주세요.'});
    B.push({h:'조심할 점',li:care.slice(0,3),cls:'oy1-care'});
    add('보호자와 이야기할 때',{p:fam});
    add('이 학생의 버팀목',{li:strengths});
    add('가까운 지역 기관',{near,tip:nearTip});
    return {title:'담임교사가 알아 두면 좋은 것',blocks:B,memo:['교육복지사에게 전할 메모','예: 3주째 월요일 1교시에 자주 졸고, 준비물을 자주 빠뜨림. 이름·서술기록은 쓰지 않습니다.']};
  }
  if(role==='edu'){
    add('학교 안에서 할 지원',{li:roleItems(d,'교육복지사')});
    add('담임교사에게 부탁할 관찰',{li:watch.slice(0,4),tip:'03 학교 지원의 「2주 관찰 기록지」로 함께 적습니다.'});
    add('학생 면담에서 물을 것',{li:qs(true)});
    B.push({h:'학맞통·통합사례관리 판단',li:[selName(sel)+' · '+(sel.why||''),sel.systems&&sel.systems.length?'함께 필요한 개입체계: '+sel.systems.join(', '):'학교 안 지원으로 시작합니다.','주관 제안: '+k.lead],cls:sel.status==='met'?'':'oy1-care'});
    add('보호자 연락',{p:fam,tip:'학생맞춤통합지원은 학생·보호자 동의가 필요합니다.'});
    add('이 학생의 버팀목',{li:strengths});
    add('가까운 지역 기관',{near,tip:nearTip});
    return {title:'교육복지사가 챙길 것',blocks:B,memo:['사례회의에 올릴 메모','예: 담임 2주 관찰 결과, 보호자 상담 일정, 학교 안에서 이미 한 지원.']};
  }
  if(role==='team'){
    B.push({h:'판정 한눈에',li:k.cells.map(c=>c.name+': '+c.value)});
    add('사례회의에서 정할 것',{li:meet,cls:'oy1-care'});
    B.push({h:'누가 맡나',li:['주관 제안: '+k.lead,...(k.parts.length?['함께: '+k.parts.join(', ')]:[]),...(k.cands.length?['문의할 곳: '+k.cands.map(c=>c.s).join(', ')]:[])]});
    add('시기별 계획',{li:stops});
    add('지원 목표',{li:goals});
    add('보호자 동의·연락',{p:fam,tip:'학생맞춤통합지원은 학생·보호자 동의가 필요합니다.'});
    add('이 학생의 버팀목',{li:strengths});
    return {title:'학맞통 지원팀 사례회의 준비',blocks:B,memo:['회의 메모','예: 선정 여부, 맡을 기관과 담당자, 다음 점검일.']};
  }
  /* 사회복지관·아동가족기관·행정복지센터 */
  add('기관이 할 일',{li:roleItems(d,'사례관리자')});
  B.push({h:'개입 수준',li:[k.level.name,...[k.level.contact,k.level.meeting].filter(Boolean)]});
  B.push({h:'통합사례관리 선정',li:[selName(sel),sel.why||''].filter(Boolean),cls:sel.status==='met'?'':'oy1-care'});
  add('사례회의에서 정할 것',{li:meet,cls:'oy1-care'});
  add('시기별 계획',{li:stops});
  add('지원 목표',{li:goals});
  add('가족과 함께하기',{p:fam});
  add('연계 후보 기관',{near,tip:nearTip});
  return {title:SCOPE[role].name+' 실무 정리',blocks:B,memo:['사례 메모','예: 초기상담 일정, 확인할 급여·서비스, 협력 기관 담당자.']};
}
/* 받침(ㄹ 제외)이 있으면 '으로'. 판정 문구를 문장 안에 넣을 때 쓴다. */
const ro=w=>{w=String(w);const c=w.slice(-1).charCodeAt(0)-0xAC00,f=c>=0&&c<11172?c%28:0;return w+(f&&f!==8?'으로':'로')};
const selName=sel=>(sel.label||'')+(sel.provisional&&sel.status==='met'?' (잠정)':'');
const m_hard=k=>(k.profile||[]).some(d=>(d.peak||0)>=2);
/* 척도 안전 응답은 없지만 오늘 확인할 것(서술 안전 단서·추가확인·안전 문항 미상). 4단계 이상이면 이유가 없어도 오늘 알린다. */
function checkWhat(k){
  const R=k.R||{},w=[];
  if((R.narrSafety||[]).length)w.push('서술에 나온 '+R.narrSafety.slice(0,2).join('·')+' 단서');
  if((R.pending||[]).length)w.push(R.pending.map(n=>n+'번').join('·')+' 추가확인');
  if((R.safetyOpen||[]).length)w.push('미상인 안전 문항('+R.safetyOpen.map(n=>n+'번').join('·')+')');
  return w.join(', ');
}
const needToday=k=>!k.urgent&&(k.safety.tone==='check'||(k.tier||0)>=4);
function nextSteps(k,role,unknown,sel){
  const S=[],multi=sel.status==='met'||sel.status==='review';
  const what=checkWhat(k),today=needToday(k);
  const safetyFirst=k.urgent?(/지금 바로/.test(k.safety.value)?'지금 바로 ':'오늘 안에 ')+ro(k.immediate||'학교 안전 절차')+' 확인합니다. 기다리거나 혼자 판단하지 않습니다.':today?'오늘 안에 '+(what||'현재 안전')+'을 학생과 직접 확인합니다. 확인 전에는 안전하다고 보지 않습니다.':'';
  if(role==='teacher'){
    if(k.urgent)S.push('지금 교육복지사·상담교사·관리자에게 바로 알립니다. 학교 위기대응 절차를 따릅니다.');
    else if(today)S.push('오늘 안에 교육복지사·상담교사에게 직접 알립니다'+(what?'('+what+')':'')+'. 확인할 때까지 기다리지 않습니다.');
    S.push('이 한 장을 교육복지사(또는 Wee클래스)에게 전달합니다.');
    if(unknown)S.push('모르는 문항 '+unknown+'개는 미상으로 둔 채 넘겨도 됩니다. 교육복지사가 보완합니다.');
    if(!k.urgent&&!today&&m_hard(k))S.push('궁금하면 02 지역자원 지도에서 어려운 영역에 맞는 가까운 기관을 봅니다.');
    if(S.length<3)S.push(k.urgent||today?'학생을 혼자 두지 않고, 들은 말과 시간을 그대로 적어 둡니다.':'평소처럼 지켜보고, 달라진 점이 있으면 날짜와 함께 짧게 적어 둡니다.');
  }else if(role==='edu'){
    if(safetyFirst)S.push(safetyFirst);
    if(unknown)S.push('미상 '+unknown+'개를 학생·담임과 확인해 01에서 고친 뒤 다시 봅니다.');
    S.push('03 학교 지원의 교육복지사 절차로 학교 안 지원을 정합니다.');
    if(multi)S.push('학교 밖 기관이 함께 필요합니다('+selName(sel)+'). 학맞통 지원팀·'+josa(k.lead,'과','와')+' 함께 사례회의 안건으로 올립니다.');
  }else if(role==='team'){
    if(safetyFirst)S.push(safetyFirst);
    S.push('05 최종 보고서를 사례회의 자료로 씁니다.');
    S.push('통합사례관리: '+selName(sel)+'. 주관은 '+ro(k.lead)+' 잠정 제안합니다.');
  }else{
    if(safetyFirst)S.push(safetyFirst);
    if(k.first&&!k.urgent&&!today)S.push(k.first);
    S.push('진행: '+k.path+' (주관 '+k.lead+')');
    if(k.agenda.length)S.push('사례회의에서 정할 것 '+k.agenda.length+'가지가 있습니다.');
  }
  return S.slice(0,3);
}

/* 제목 아래 한 줄 요약(잡지의 deck). 판정 값을 문장으로 옮길 뿐 새로 판단하지 않는다. */
const josa=(w,a,b)=>{const c=String(w).slice(-1).charCodeAt(0)-0xAC00;return w+(c>=0&&c<11172&&c%28?a:b)};
function deck(m){
  const k=m.k,names=m.hard.map(h=>h.t);
  if(k.urgent)return '안전 신호가 있어 오늘 바로 확인하고 연결해야 하는 학생입니다.';
  if(needToday(k)&&checkWhat(k))return '오늘 안전을 먼저 확인해야 하는 학생입니다('+checkWhat(k)+')'+(m.tier?'. '+m.tier+'단계 '+m.tierName+'.':'.');
  if(!m.tier)return '모르는 응답이 남아 있어 확인이 먼저인 학생입니다'+(names.length?'. '+names.join('·')+'의 어려움이 보입니다.':'.');
  return m.tier+'단계 '+m.tierName+(names.length?'. '+josa(names.join('·'),'을','를')+' 함께 살펴야 하는 학생입니다.':'. 두드러진 어려움 없이 지켜보는 학생입니다.');
}
function html(m){
  const k=m.k,sc=m.scope;
  const tierBar='<ol class="oy1-tier" aria-label="지원 우선순위 5단계">'+NAMES.map((n,i)=>'<li class="'+(m.tier===i+1?'on':'')+(i===4?' top':'')+'"><b>'+(i+1)+'</b><span>'+esc(n)+'</span></li>').join('')+'</ol>';
  const hard=m.hard.length?'<ul class="oy1-hard">'+m.hard.map(h=>'<li><span>'+esc(h.t)+'</span>'+dots(h.v)+'</li>').join('')+'</ul>':'<p class="oy1-muted">2점 이상인 영역이 없습니다. 평소처럼 지켜봅니다.</p>';
  const roles=Object.keys(SCOPE);
  const today=(()=>{try{return new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}catch(_){return ''}})();
  return '<header class="oy1-mast"><span class="oy1-kicker">OY-RALS 핵심 결과 한 장'+(sc?' · '+esc(sc.name)+'판':'')+'</span><span class="oy1-meta">'+esc(today)+' · 실무자 확인 전 초안 · 학생 이름·서술기록 미포함</span></header>'+
   '<div class="oy1-head"><h3 id="oy1Title">이것만 먼저 보세요</h3><p class="oy1-deck">'+esc(deck(m))+'</p>'+
   (sc?'':'<p class="oy1-role">역할을 고르면 다음 할 일이 맞춰집니다</p>')+'</div>'+
   (sc?'':'<div class="oy1-pick" role="group" aria-label="역할 고르기">'+roles.map(r=>'<button type="button" data-oy-role="'+r+'">'+esc(SCOPE[r].name)+'</button>').join('')+'</div>')+
   '<div class="oy1-grid">'+
   '<section class="oy1-q oy1-'+m.safetyTone+'"><h4><i>01</i>지금 안전한가요?</h4><p class="oy1-v">'+esc(k.safety.value)+'</p><p class="oy1-why">'+esc(k.safety.why)+'</p>'+
    (m.safetyTone==='c'?'<p class="oy1-callc">'+esc(((k.R.safetyOpen||[]).length&&!(k.R.narrSafety||[]).length&&!(k.R.pending||[]).length?'모르는 안전 문항은 안전하다고 보지 않습니다.':'확인하기 전에는 안전하다고 보지 않습니다.')+' 오늘 직접 확인해 주세요.')+'</p>':'')+(k.urgent||(m.tier||0)>=5?'<p class="oy1-call">급하면 <b>112</b> · 청소년상담 <b>1388</b> · 자살예방 <b>109</b></p>':'')+'</section>'+
   '<section class="oy1-q"><h4><i>02</i>얼마나 급한가요?</h4><p class="oy1-v">'+esc(m.tier?m.tier+'단계 '+m.tierName:m.tierName)+'</p>'+tierBar+'<p class="oy1-why">'+esc(m.tier?m.tierWhy:'모르는 문항을 확인하기 전에는 단계를 정하지 않습니다.')+'</p></section>'+
   '<section class="oy1-q"><h4><i>03</i>무엇이 어려운가요?</h4>'+hard+'</section>'+
   '<section class="oy1-q oy1-do"><h4><i>04</i>'+(sc?esc(sc.name)+'는 무엇을 하나요?':'누가 무엇을 하나요?')+'</h4><ol class="oy1-steps">'+m.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></section>'+
   '</div>'+
   (m.teach?teachHtml(m.teach):'')+
   (sc?'<blockquote class="oy1-end"><p>'+esc(sc.end)+'</p><cite>'+esc(sc.name)+'의 역할</cite></blockquote>':'')+
   '<div class="oy1-actions">'+(m.role==='teacher'?'<button type="button" class="flow-btn flow-primary" data-oy1-pass aria-expanded="false" aria-controls="oy1Pass">교육복지사에게 전달하기</button>':'')+
   '<button type="button" class="flow-btn'+(m.role==='teacher'?'':' flow-primary')+'" data-oy1-print>이 한 장 인쇄 · PDF</button>'+
   (m.scope&&m.scope.steps.includes('2')?'<button type="button" class="flow-btn" data-oy1-map>02 지역자원 지도 보기</button>':'')+
   '<button type="button" class="flow-btn oy1-more" data-oy1-more aria-expanded="false" aria-controls="journey88">자세히 보기 · 척도 해석·서술기록·통합 사정의견</button></div>'+
   (m.role==='teacher'?'<div class="oy1-pass" id="oy1Pass" hidden><p><b>전달 방법 두 가지</b> 어느 쪽이든 학생 이름과 서술기록은 들어가지 않습니다.</p><ol><li><button type="button" class="flow-btn" data-oy1-print>한 장 인쇄해서 건네기</button></li><li><button type="button" class="flow-btn" data-oy1-json>응답 파일(JSON) 저장해서 보내기</button> <small>교육복지사가 「JSON 불러오기」로 열면 이어서 보완할 수 있습니다.</small></li></ol></div>':'')+
   '<p class="oy1-foot">판정은 05 최종 보고서·04 판정 띠와 같은 값입니다. 이 한 장은 시스템이 낸 초안이며 실무자 판단을 대신하지 않습니다.</p>';
}
function teachHtml(t){
  const ul=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  const blk=b=>'<section class="oy1-t '+(b.cls||'')+'"><h4>'+esc(b.h)+'</h4>'+
    (b.li&&b.li.length?ul(b.li):'')+(b.p?'<p>'+esc(b.p)+'</p>':'')+
    (b.near&&b.near.length?'<ul>'+b.near.map(r=>'<li><b>'+esc(r.b)+'</b> '+esc(r.t)+' <small>'+esc(r.s)+'</small></li>').join('')+'</ul>':'')+
    (b.tip?'<p class="oy1-tip">'+esc(b.tip)+'</p>':'')+'</section>';
  const memo='<section class="oy1-t oy1-memo"><h4>'+esc(t.memo[0])+'</h4><label class="oy1-vh" for="oy1Memo">'+esc(t.memo[0])+'</label><textarea id="oy1Memo" rows="4" maxlength="300" placeholder="'+esc(t.memo[1])+'"></textarea><p class="oy1-tip">저장되지 않습니다. 인쇄하면 함께 나옵니다.</p></section>';
  return '<h3 class="oy1-sub"><span>현장 노트</span>'+esc(t.title)+'</h3><div class="oy1-tgrid">'+t.blocks.map(blk).join('')+memo+'</div>';
}
function text(m){
  const k=m.k,L=['OY-RALS 핵심 결과 한 장'+(m.scope?' · '+m.scope.name+' 기준':''),''];
  L.push('1. 지금 안전한가요? '+k.safety.value+' ('+k.safety.why+')');
  L.push('2. 얼마나 급한가요? '+(m.tier?m.tier+'단계 '+m.tierName:m.tierName));
  L.push('3. 무엇이 어려운가요? '+(m.hard.map(h=>h.t+' '+h.v+'점').join(', ')||'2점 이상 영역 없음'));
  L.push('4. 다음 할 일');m.steps.forEach((s,i)=>L.push('  '+(i+1)+') '+s));
  if(m.teach){L.push('',m.teach.title);m.teach.blocks.forEach(b=>{const a=(b.li||[]).concat(b.p?[b.p]:[],(b.near||[]).map(r=>r.b+' '+r.t));if(a.length){L.push(b.h);a.forEach(x=>L.push('  - '+x))}});}
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
/* A4 한 장(여백 14mm → 688×1017px)에 맞는 가장 큰 배율을 찾는다. 화면 규칙으로 재므로 인쇄 때는 조금 더 여유가 생긴다. */
function fitA4(el){
  const W=688,H=1017,st=el.style;st.cssText='display:block;position:absolute;left:-10000px;top:0;visibility:hidden';
  let z=.86;for(;z>.5;z-=.02){st.width=(W/z)+'px';if(el.scrollHeight*z<=H)break;}
  st.cssText='';st.zoom=String(Math.round(z*100)/100);el.dataset.zoom=st.zoom;
}
function printOne(doc){
  const box=doc.getElementById('oyOnePage');if(!box||!box.__model)return;
  const old=doc.getElementById('oy1-print-root');if(old)old.remove();
  const el=doc.createElement('section');el.id='oy1-print-root';el.className='oy1 oy1-print';
  el.innerHTML=html(box.__model);
  el.querySelectorAll('.oy1-actions,.oy1-pass,.oy1-pick').forEach(x=>x.remove());
  /* 메모는 화면에서 쓴 글을 줄 친 칸으로 옮겨 인쇄한다(저장하지 않음). */
  const memo=doc.getElementById('oy1Memo'),ta=el.querySelector('#oy1Memo');if(ta){const dv=doc.createElement('div');dv.className='oy1-lines';dv.textContent=memo?memo.value:'';ta.replaceWith(dv);el.querySelectorAll('.oy1-memo .oy1-tip,.oy1-memo .oy1-vh').forEach(x=>x.remove());}
  doc.body.append(el);fitA4(el);doc.body.classList.add('oy1-printing');
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
