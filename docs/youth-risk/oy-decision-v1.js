/* OY-RALS 판정 사슬 v1 — ① 안전 ② CORE ③ 지원 우선순위 5단계 ④ 개입 수준 ⑤ 통합사례관리 선정 ⑥ 진행체계·주관을
   한 번에 계산하고, 01 통합 사정의견·03 학교 지원·04 기관 사례관리·출력물이 같은 결과를 읽게 한다.
   CORE 원점수와 공식 안전판정(criteria.js)은 읽기만 하며 바꾸지 않는다. 미상은 0으로 보지 않는다.
   판정 사이 규칙(tests/oy-decision-chain.cjs가 가상 100사례로 확인):
   R-1 진행체계가 '통합사례관리'를 말하려면 ⑤가 선정이어야 한다.
   R-2 ④가 관찰·예방/단기 개별지원인데 개입체계가 2곳 이상이면 ⑤는 '선정 검토'(사례회의에서 결정)로 둔다. 반대로 ④가 다기관인데 개입체계가 1곳이면 역시 '선정 검토'.
   R-3 ③이 잠정이거나 추가확인이 남으면 ⑤도 잠정 또는 '확인 필요'로 둔다.
   R-4 ①에 안전 신호가 있으면 띠 맨 앞에 붉은 칸으로 먼저 보인다.
   R-5 어느 고리도 CORE 원점수와 공식 안전판정을 바꾸지 않는다. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.1.0-20261028';
const need=(n,g)=>node?require('./'+n):root[g];
const K=()=>need('oy-constants-v1.js','OYConstants');
const FIVE=()=>need('integrated-index-v1.js','OYFiveLevelIndex');
const D=()=>need('oy-deep-interpretation-v1.js','OYDeepInterpretation');
const NI=()=>{try{return need('oy-narrative-interpretation-v1.js','OYNarrativeInterpretation')}catch(_){return null}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isNum=v=>Number.isInteger(v);
const NAMES=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
const LOW=['monitor','brief'],HIGH=['intensive','crisis'];
const SEL={met:'선정 기준 충족',review:'선정 검토 · 사례회의에서 결정',check:'확인 필요 · 확인 뒤 재판정',not:'미충족 · 단순 연계 검토'};
const WELFARE=['가족·돌봄','공공급여'];

/* ⑤ 통합사례관리 선정. 지훈 기준(2026-10-27): 2개 이상 기관(개입체계)의 전문적 개입이 필요한 경우,
   위기 영역(안전 문항) 응답이 있으면 공동 개입 대상. 학교 안 지원은 하나의 개입체계로 센다. */
function selection(o){
  const SYS=K().SYSTEM_OF_DOMAIN;
  const lv=(o.profile||[]).filter(x=>x.peak>=2);
  const systems=[...new Set(lv.map(x=>SYS[x.id]).filter(Boolean))];
  const levelId=o.levelId||'';
  let status,why;
  if(o.urgent){status='met';why=systems.length>=2?'개입체계 '+systems.length+'곳 · 위기 영역 응답 있음':'위기 영역(안전 문항) 응답이 있어 공동 개입 대상';}
  else if(o.immediate){status='met';why='서술에 당일 안전 단서가 있어 공동 개입 대상 · 면담 확인 뒤 재판정';}
  else if(systems.length>=2&&LOW.includes(levelId)){status='review';why='개입체계 '+systems.length+'곳이지만 개입 수준은 '+(o.levelName||'단기 지원');}
  else if(systems.length>=2){status='met';why='개입체계 '+systems.length+'곳: '+systems.join(', ');}
  else if(o.provisional||o.safetyOpen||o.narrSafety){status='check';why=o.provisional?'추가확인이 남아 잠정':o.safetyOpen?'안전 문항 미상':'서술에서만 나온 안전 단서';}
  else if(HIGH.includes(levelId)){status='review';why='개입 수준은 다기관이지만 개입체계 '+(systems.length||0)+'곳';}
  else{status='not';why=systems.length?'개입체계 1곳: '+systems[0]:'2점 이상 영역 없음';}
  /* R-3: 미상 때문에 단계·개입 수준이 미확정이거나 서술 단서로만 선정되면 선정도 잠정이다. */
  const prov=status!=='not'&&(!!o.provisional||!!o.open||(!!o.immediate&&!o.urgent));
  if(status==='met'&&o.open&&!o.urgent)why+=' · 미상 확인 뒤 확정';
  return {status,label:SEL[status],why,systems,domains:lv.map(x=>x.name),provisional:prov};
}

/* 서술 통합(oy-narrative-interpretation)이 주관기관 문장을 만들 때 같은 선정 결과를 쓰도록 한다. */
function selectionFor(p,level,narrCount){
  const S=K().SAFETY_ITEMS,five=FIVE().analyze(p),deep=D().build(p),off=five.official||{},ans=p.answers||[];
  return selection({profile:deep.profile,urgent:!!off.urgent||S.some(n=>isNum(ans[n-1])&&ans[n-1]>=1),levelId:level&&level.id,levelName:level&&level.name,
    provisional:!!five.provisional||(off.pendingChecks||[]).length>0,safetyOpen:S.some(n=>ans[n-1]==='unknown'||ans[n-1]==null),narrSafety:narrCount>0,
    immediate:(five.immediate||[]).length>0,open:five.tier==null&&!(off.urgent||(off.pendingChecks||[]).length||narrCount||(level&&level.id==='crisis'))});
}
/* ⑥ 진행체계 문장. R-1: 통합사례관리는 ⑤가 선정일 때만 말한다. */
function pathway(o,sel){
  const SYS=K().SYSTEM_OF_DOMAIN,lv=(o.profile||[]).filter(x=>x.peak>=2);
  const school=lv.some(x=>SYS[x.id]==='학교'),welfare=lv.some(x=>WELFARE.includes(SYS[x.id]));
  if(o.urgent||o.safetyFloor>=4)return '현재 안전 확인 우선 → 학교·기관 보호체계 병행';
  if(sel.status==='met')return (school?'학교 내 학맞통 + 복지관 통합사례관리 병행':'복지관 통합사례관리 중심 · 학교 협력')+(sel.provisional?' (잠정)':'');
  if(sel.status==='review')return school?'학교 내 학맞통 중심 · 통합사례관리는 사례회의에서 검토':'복지관 서비스 연계 · 통합사례관리는 사례회의에서 검토';
  if(sel.status==='check')return HIGH.includes(o.levelId)?'추가 확인 뒤 결정 · 그동안 학교·관련 기관이 함께 확인':'추가 확인 뒤 결정 · 그동안 학교 내 지원으로 시작';
  return school?'학교 내 학생맞춤통합지원 중심':welfare?'복지관·공공지원 서비스 연계':lv.length?'해당 영역 전문기관 연계와 변화 점검':'응답 영역별 개별지원과 변화 점검';
}
function leadText(base,sel){
  base=String(base||'학교 담임');
  if(sel.status==='met'||!/복지관 통합사례관리/.test(base))return base;
  return base.replace('복지관 통합사례관리',sel.status==='review'?'복지관 (통합사례관리 선정 검토)':'복지관 (서비스 연계)');
}

function scriptVersion(file){
  try{const s=root.document&&[...root.document.scripts].find(x=>new RegExp('(^|/)'+file.replace('.','\\.')+'(\\?|$)').test(x.getAttribute('src')||''));const m=s&&/[?&]v=([^&]+)/.exec(s.getAttribute('src'));return m?m[1]:'';}catch(_){return ''}
}
/* F4 규칙 버전: 출력물을 나중에 다시 설명할 수 있도록 각 판정의 규칙 판본을 남긴다. */
function versions(){
  const v=(g,f,file)=>{try{const m=f();if(m&&m.VERSION)return m.VERSION}catch(_){}return scriptVersion(file)||'판본 표기 없음'};
  return [['CORE 공식 판정',v('YouthCriteria',()=>need('criteria.js','YouthCriteria'),'criteria.js')],['지원 우선순위 5단계',v('',FIVE,'integrated-index-v1.js')],['개입 수준',v('',D,'oy-deep-interpretation-v1.js')],['서술 통합',v('',NI,'oy-narrative-interpretation-v1.js')],['판정 사슬',VERSION],['공통 정의',K().VERSION]];
}

/* ③ 이유: 점수·응답 패턴·안전 기준 가운데 단계를 올린 것을 모두 적는다. 미상으로 점수를 못 낸 때는 '—단계' 대신 그렇다고 쓴다(xmod 1,200사례 2026-10-29). */
function tierWhy(five,tier){
  const base=five.baseTier,lift=[];
  if((five.patternFloor||0)>(base||0)&&five.patternFloor>1)lift.push('응답 패턴 '+five.patternFloor+'단계');
  if((five.safetyFloor||0)>(base||0))lift.push('안전 기준 '+five.safetyFloor+'단계');
  const head=base?'점수 '+base+'단계':'점수 계산 보류(미상 '+(five.unknown||0)+'문항)';
  return lift.length?head+' → '+lift.join(' · ')+' 중 높은 '+tier+'단계':head;
}
function resolve(p){
  const S=K().SAFETY_ITEMS;
  const five=FIVE().analyze(p),deep=D().build(p);let I=null;try{const ni=NI();I=ni&&ni.integrate?ni.integrate(p):null}catch(_){I=null}
  const off=five.official||{},ans=p.answers||[];
  const safetyPos=S.filter(n=>isNum(ans[n-1])&&ans[n-1]>=1);
  const safetyOpen=S.filter(n=>ans[n-1]==='unknown'||ans[n-1]==null);
  const pending=(off.pendingChecks||[]).slice();
  const narrRows=I&&I.compare&&I.compare.rows?I.compare.rows.filter(x=>x.safety&&(x.kind==='narrative'||x.kind==='fill')):[];
  const narrSafety=[...new Set(narrRows.map(x=>x.topic))];
  const urgent=!!off.urgent||safetyPos.length>0;
  const level=(I&&I.level)||deep.casework.level||{id:'',name:'확인 필요'};
  const profile=deep.profile||[];
  const lvCount=profile.filter(x=>x.peak>=2).length,highCount=ans.filter(v=>isNum(v)&&v>=3).length;
  const provisional=!!five.provisional||pending.length>0;
  const tier=five.tier,immediate=five.immediate||[];
  const levelOpen=tier==null&&!(urgent||pending.length||narrSafety.length||level.id==='crisis');
  const sel=selection({profile,urgent,levelId:level.id,levelName:level.name,provisional,safetyOpen:safetyOpen.length>0,narrSafety:narrSafety.length>0,immediate:immediate.length>0,open:levelOpen});
  const path=pathway({profile,urgent:!!off.urgent,safetyFloor:five.safetyFloor,levelId:level.id},sel);
  const lead=leadText((I&&I.lead)||deep.casework.lead,sel);
  const cells=[
    {k:'safety',n:'①',name:'안전',
     tone:urgent||immediate.length?'risk':(pending.length||safetyOpen.length||narrSafety.length)?'check':'ok',
     value:urgent?'안전 신호 있음 · '+(/^지금 바로/.test(String((I&&I.first)||(deep.summary&&deep.summary.first)||''))?'지금 바로 확인':'오늘 확인'):immediate.length?'서술에 당일 안전 단서 · 지금 바로 확인':narrSafety.length?'서술에 안전 단서 · 오늘 확인':pending.length?'추가확인 남음':safetyOpen.length?'안전 문항 미상':'이번 응답 안전 신호 없음',
     why:urgent?(safetyPos.length?safetyPos.map(n=>n+'번').join('·')+' 응답':'명시 긴급·추가확인'):immediate.length?immediate.join('·')+(pending.length?' · '+pending.map(n=>n+'번').join('·')+' 추가확인도 남음':''):narrSafety.length?narrSafety.slice(0,2).join('·')+(pending.length?' · '+pending.map(n=>n+'번').join('·')+' 추가확인도 남음':''):pending.length?pending.map(n=>n+'번').join('·')+' 추가확인':safetyOpen.length?safetyOpen.map(n=>n+'번').join('·')+' 미상':'1·2·7·25번 모두 0'},
    {k:'core',n:'②',name:'CORE 공식 판정',tone:'core',value:off.title||'—',why:'3~4점 문항 '+highCount+'개 · 2점 이상 영역 '+lvCount+'개'},
    {k:'tier',n:'③',name:'지원 우선순위',tone:tier>=5?'risk':'data',
     value:tier==null?'단계 미확정':tier+'단계 '+NAMES[tier-1]+(five.provisional?' (잠정)':''),
     plain:tier==null?'단계 미확정':NAMES[tier-1]+(five.provisional?' (잠정)':''),
     why:tier==null?'미상 확인 전 판단 보류':tierWhy(five,tier),
     plainWhy:tier==null?'미상 확인 전 판단 보류':'점수·응답 패턴·안전 기준 중 가장 높은 것'},
    /* 단계 미확정이고 위기 사유(안전 응답·추가확인·서술 안전 단서·위기 수준)가 없으면 개입 수준도 미확정으로 보인다. 위기 사유가 의심되면 집중 수준을 그대로 둔다. */
    {k:'level',n:'④',name:'개입 수준',tone:level.id==='crisis'?'risk':levelOpen?'check':'data',value:levelOpen?'미확정 · 확인 후 결정':level.name,why:levelOpen?'잠정 '+level.name+' · 미상 확인 후 확정':(level.id==='crisis'&&tier&&tier<5&&safetyPos.some(n=>ans[n-1]>=2)?'안전 문항 '+safetyPos.filter(n=>ans[n-1]>=2).map(n=>n+'번').join('·')+' 2점 이상이라 보호 조치를 먼저 함 · ':'')+(level.meeting||level.contact||'')},
    {k:'select',n:'⑤',name:'통합사례관리',tone:sel.status==='met'?'data':sel.status==='not'?'muted':'check',value:sel.label+(sel.provisional&&sel.status==='met'?' (잠정)':''),why:sel.why},
    {k:'path',n:'⑥',name:'진행체계·주관',tone:'data',value:path,why:'주관 '+lead}
  ];
  /* F2 사례회의에서 정할 것: 판정끼리 어긋나거나 사람이 확인해야 풀리는 항목을 숨기지 않고 안건으로 넘긴다. */
  const agenda=[];
  if(urgent)agenda.push({k:'safety',t:'안전 응답('+(safetyPos.map(n=>n+'번').join('·')||'명시 긴급')+')은 회의를 기다리지 않고 오늘 소속기관 보호 절차로 확인합니다.'});
  if(pending.length)agenda.push({k:'tier',t:'추가확인 '+pending.map(n=>n+'번').join('·')+' 답을 받은 뒤 단계와 통합사례관리 선정을 다시 판정합니다.'});
  if(safetyOpen.length)agenda.push({k:'safety',t:'안전 문항 '+safetyOpen.map(n=>n+'번').join('·')+'이 미상입니다. 직접 확인하기 전에는 안전하다고 보지 않습니다.'});
  if(tier==null)agenda.push({k:'tier',t:'미상 문항을 확인하기 전에는 지원 우선순위 단계를 정하지 않습니다.'});
  if(narrSafety.length&&!urgent)agenda.push({k:'level',t:'서술에서만 나온 '+narrSafety.join('·')+' 단서를 면담으로 확인합니다. 확인되면 보호 경로로 다시 판정합니다.'});
  if(sel.status==='review')agenda.push({k:'select',t:sel.why+'. 통합사례관리로 선정할지 사례회의에서 정합니다.'});
  return {version:VERSION,payloadRevision:p.flowRevision,urgent,provisional,tier,level,selection:sel,pathway:path,lead,cells,agenda,five,deep,integrated:I,
    pending,safetyOpen,safetyPos,narrSafety,levelOpen,versions:versions()};
}

/* 근거 사다리: 판정마다 기준 → 이 사례 → 결과 */
function ladders(R,school){
  const f=R.five,off=f.official||{},sel=R.selection;
  const rows={
    safety:[['안전문항 1·2·7·25번 1점 이상, 명시 긴급, 추가확인 예',R.safetyPos.length?R.safetyPos.map(n=>n+'번').join('·')+' 응답':'안전문항 응답 없음'+(R.pending.length?' · 추가확인 '+R.pending.join('·')+'번 남음':'')+(R.safetyOpen.length?' · 미상 '+R.safetyOpen.join('·')+'번':''),R.cells[0].value],
            ['서술기록의 안전 표현 (점수는 바꾸지 않음)',R.narrSafety.length?R.narrSafety.join('·'):'없음',R.narrSafety.length?'면담 확인':'—']],
    core:[['영역집중(3점 이상 1개 또는 2점 이상 2개)·고점 문항 수 · criteria.js 원본',off.reason||'—',off.title||'—']],
    tier:school?[['점수·응답 패턴·안전 기준 중 가장 높은 것',R.cells[2].plainWhy,R.cells[2].plain]]:
      [['점수 기준 · 통합지표 20점마다 1단계',(f.composite!=null?f.composite.toFixed(1)+'/100':'—'),(f.baseTier||'—')+'단계'],
       ['응답 패턴 기준',f.patternReason||'상향 없음',(f.patternFloor||'—')+'단계'],
       ['안전 기준',f.safetyReason||'상향 없음',(f.safetyFloor||'—')+'단계'],
       ['최종 · 세 기준 중 가장 높은 단계','',R.cells[2].value]],
    level:[['CORE 수준 + 안전 응답 + 서술 단서 · 지원 우선순위보다 낮게 두지 않음',(R.level.reason||'—'),R.levelOpen?'미확정 · 잠정 '+R.level.name:R.level.name],['만남과 회의',R.level.contact||'—',R.level.meeting||'—']],
    select:[['2개 이상 기관(개입체계)의 전문 개입 · 학교 안 지원(담임·교육복지사·Wee)은 한 체계',sel.systems.length?sel.systems.join(', '):'2점 이상 영역 없음',sel.label],
            ['위기 영역(안전 문항) 응답',R.urgent?'있음':(R.safetyOpen||[]).length?R.safetyOpen.map(n=>n+'번').join('·')+' 미상 · 확인 필요':'없음',R.urgent?'공동 개입 대상':(R.safetyOpen||[]).length?'확인 후 결정':'—'],
            ['개입 수준과의 관계 (R-2)',R.level.name,sel.status==='review'?'사례회의에서 결정':'일치']],
    path:[['⑤ 결과와 맡을 개입체계 (R-1)',sel.label,R.pathway],['주관',R.lead,'회의에서 확정']]
  };
  return rows;
}
const GLOSSARY=[
  ['CORE 공식 판정','25문항 점수와 안전문항으로 정하는 공식 판정입니다. criteria.js가 원본이며 다른 판정이 이 값을 바꾸지 않습니다.'],
  ['지원 우선순위 5단계','얼마나 서둘러 어느 범위의 기관과 움직일지 정하는 개발형 보조지표입니다. 점수·응답 패턴·안전 기준 중 가장 높은 단계를 씁니다. 위험확률이 아닙니다.'],
  ['개입 수준','얼마나 자주 만나고 언제 사례회의를 할지 정합니다. 관찰·예방, 단기 개별지원, 일반 사례관리, 집중 사례관리, 위기개입 후 집중 사례관리 다섯 가지입니다.'],
  ['개입체계','통합사례관리 선정에서 세는 단위입니다. 학교 안 지원(담임·교육복지사·Wee클래스·상담교사)은 하나의 기관이자 개입체계로 셉니다.'],
  ['통합사례관리','2개 이상 기관의 전문적 개입이 필요한 사례를 함께 관리하는 방식입니다. 위기 영역 응답이 있으면 공동 개입 대상으로 봅니다(오산세교종합사회복지관 기준).'],
  ['학맞통','학생맞춤통합지원. 학교장이 선정하고 학교·교육지원청이 학생 지원을 조정하는 절차입니다(학생맞춤통합지원법, 2026-03-01 시행).'],
  ['잠정','추가확인이나 미상 문항이 남아 있어 확인 뒤 다시 정할 판정입니다.'],
  ['미상','모르는 응답입니다. 0점으로 계산하지 않습니다.'],
  ['추가확인','4번 1점 이상, 5·12·13번 3점 이상일 때 현재 위험을 한 번 더 묻는 질문입니다.'],
  ['영역집중','한 영역에 3점 이상 문항이 하나 있거나 2점 이상 문항이 두 개 있는 상태입니다.'],
  ['4P 사례개념화','문제를 만든 요인(소인), 촉발 요인, 유지 요인, 보호 요인으로 사례를 정리하는 틀입니다.']
];
function glossaryHtml(){return '<dl class="oyd-gloss-list">'+GLOSSARY.map(([t,d])=>'<div><dt>'+esc(t)+'</dt><dd>'+esc(d)+'</dd></div>').join('')+'</dl>';}

/* ③ 화면용 띠. audience 'school'은 단계 숫자 없이 이름만(지훈 결정 2026-10-27). */
function strip(R,opt){
  opt=opt||{};const school=opt.audience==='school',print=!!opt.print;
  const L=ladders(R,school);
  const cell=c=>{const v=school&&c.plain?c.plain:c.value,w=school&&c.plainWhy?c.plainWhy:c.why;const inner='<span class="oyd-k">'+esc(c.n+' '+c.name)+'</span><span class="oyd-v">'+esc(v)+'</span><span class="oyd-why">'+esc(w)+'</span>';
    return '<li class="oyd-cell oyd-'+c.tone+(R.agenda.some(a=>a.k===c.k&&c.k!=='safety')?' oyd-flag':'')+'">'+(print?inner:'<button type="button" class="oyd-btn" data-oyd-open="'+c.k+'" aria-expanded="false">'+inner+'</button>')+'</li>';};
  const ladder=c=>'<div class="oyd-ladder" data-oyd-ladder="'+c.k+'"'+(print?'':' hidden')+'><h4>'+esc(c.n+' '+c.name)+' · 이렇게 나왔습니다</h4><div class="oyd-tw"><table><thead><tr><th>기준</th><th>이 사례</th><th>결과</th></tr></thead><tbody>'+L[c.k].map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>').join('')+'</tbody></table></div></div>';
  const agenda=R.agenda.length?'<div class="oyd-agenda"><b>사례회의에서 정할 것</b><ul>'+R.agenda.map(a=>'<li>'+esc(a.t)+'</li>').join('')+'</ul></div>':'';
  const canWhatIf=!print&&(R.pending.length||R.safetyOpen.length||(R.five.unknown||0)>0);
  const whatif=canWhatIf?'<details class="oyd-whatif"><summary>확인하면 결과가 어떻게 바뀌나</summary><div data-oyd-whatif><p class="oyd-muted">열면 계산합니다.</p></div></details>':'';
  const ver='<p class="oyd-ver">규칙 판본 · '+R.versions.map(([k,v])=>esc(k)+' '+esc(v)).join(' · ')+'</p>';
  return '<section class="oyd'+(school?' oyd-school':'')+(print?' oyd-print':'')+'" data-oyd aria-label="판정 경로"><header class="oyd-head"><span class="oyd-kicker">판정 경로 · 모든 화면이 같은 판정을 씁니다</span>'+(print?'':'<button type="button" class="oyd-gloss-btn" data-oyd-gloss aria-expanded="false">용어 풀이</button>')+'</header>'+
    '<ol class="oyd-strip">'+R.cells.map(cell).join('')+'</ol>'+agenda+(print?R.cells.filter(c=>c.k!=='core').map(ladder).join(''):R.cells.map(ladder).join(''))+whatif+(print?'':'<div class="oyd-gloss" hidden>'+glossaryHtml()+'</div>')+ver+'</section>';
}
function text(R,opt){
  const school=opt&&opt.audience==='school';
  return ['[판정 경로]'].concat(R.cells.map(c=>c.n+' '+c.name+': '+(school&&c.plain?c.plain:c.value)+' ('+(school&&c.plainWhy?c.plainWhy:c.why)+')'),R.agenda.length?['사례회의에서 정할 것:'].concat(R.agenda.map(a=>'- '+a.t)):[],['규칙 판본: '+R.versions.map(([k,v])=>k+' '+v).join(' · ')]).join('\n');
}

/* F3 확인하면 결과가 어떻게 바뀌나: 추가확인 예/아니오, 미상 문항을 0점·확인 점수로 넣었을 때의 단계와 선정. */
function whatIf(p){
  const S=K().SAFETY_ITEMS,base=resolve(p),out=[];
  const brief=R=>({tier:R.tier==null?'단계 미확정':R.tier+'단계 '+NAMES[R.tier-1],level:R.levelOpen?'미확정 · 확인 후 결정':R.level.name,sel:R.selection.label});
  base.pending.forEach(n=>['no','yes'].forEach(v=>{try{const q={...p,followups:{...(p.followups||{}),[n]:v}};out.push({label:n+'번 추가확인이 「'+(v==='yes'?'예':'아니오')+'」이면',...brief(resolve(q))})}catch(_){}}));
  const unknown=(p.answers||[]).map((v,i)=>v==='unknown'?i+1:null).filter(Boolean).slice(0,6);
  unknown.forEach(n=>[0,S.includes(n)?1:2].forEach(v=>{try{const a=p.answers.slice();a[n-1]=v;out.push({label:n+'번 미상을 '+v+'점으로 확인하면',...brief(resolve({...p,answers:a}))})}catch(_){}}));
  return {base:brief(base),rows:out};
}
function whatIfHtml(p){
  const W=whatIf(p);if(!W.rows.length)return '<p class="oyd-muted">바뀔 수 있는 항목이 없습니다.</p>';
  return '<p class="oyd-muted">지금: '+esc(W.base.tier)+' · '+esc(W.base.level)+' · 통합사례관리 '+esc(W.base.sel)+'. 실제 점수는 확인한 뒤 입력 화면에서 고쳐야 바뀝니다.</p><div class="oyd-tw"><table><thead><tr><th>확인 결과</th><th>지원 우선순위</th><th>개입 수준</th><th>통합사례관리</th></tr></thead><tbody>'+W.rows.map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+esc(r.tier)+'</td><td>'+esc(r.level)+'</td><td>'+esc(r.sel)+'</td></tr>').join('')+'</tbody></table></div>';
}

/* 화면 연결 */
let cache={key:'',R:null};
function forPayload(p){const key=(p.flowRevision||'')+'|'+JSON.stringify(p.answers)+'|'+JSON.stringify(p.followups||{})+'|'+String(p.caseContext||'').length+'|'+(p.explicit||[]).length+'|'+((p.student&&p.student.grade)||'');if(cache.key!==key){cache={key,R:resolve(p),p}}return cache.R;}
function mount(container,payload,opt){
  if(!container||!payload)return null;
  const old=container.querySelector(':scope > [data-oyd], [data-oyd-host] > [data-oyd]');
  let R;try{R=forPayload(payload)}catch(e){return null}
  const wrap=root.document.createElement('div');wrap.innerHTML=strip(R,opt);const el=wrap.firstElementChild;el.__payload=payload;
  const anchor=opt&&opt.after?container.querySelector(opt.after):null;
  if(old)old.replaceWith(el);else if(anchor)anchor.after(el);else container.prepend(el);
  return el;
}
function bind(doc){
  if(!doc||doc.__oydBound)return;doc.__oydBound=true;
  doc.addEventListener('click',e=>{
    const t=e.target;if(!t||!t.closest)return;
    const b=t.closest('[data-oyd-open]');if(b){const box=b.closest('[data-oyd]');const k=b.dataset.oydOpen;const lad=box.querySelector('[data-oyd-ladder="'+k+'"]');const open=b.getAttribute('aria-expanded')!=='true';
      box.querySelectorAll('[data-oyd-open]').forEach(x=>x.setAttribute('aria-expanded','false'));box.querySelectorAll('[data-oyd-ladder]').forEach(x=>{x.hidden=true});
      if(open&&lad){b.setAttribute('aria-expanded','true');lad.hidden=false;}return;}
    const g=t.closest('[data-oyd-gloss]');if(g){const box=g.closest('[data-oyd]');const panel=box.querySelector('.oyd-gloss');const open=panel.hidden;panel.hidden=!open;g.setAttribute('aria-expanded',String(open));return;}
  });
  doc.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.classList||!d.classList.contains('oyd-whatif')||!d.open)return;const slot=d.querySelector('[data-oyd-whatif]');const box=d.closest('[data-oyd]');if(slot&&box&&box.__payload&&!slot.dataset.done){try{slot.innerHTML=whatIfHtml(box.__payload)}catch(_){slot.textContent='계산하지 못했습니다.'}slot.dataset.done='1';}},true);
}
const api=Object.freeze({VERSION,NAMES,GLOSSARY,selection,selectionFor,pathway,leadText,resolve,ladders,strip,text,whatIf,whatIfHtml,mount,bind,glossaryHtml,forPayload});
if(node)module.exports=api;else{root.OYDecision=api;if(root.document)bind(root.document);}
})(typeof window!=='undefined'?window:globalThis);
