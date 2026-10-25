/* OY-CIE V3.0 public static inference bridge. No neural weights, no private KB.
 * Authoritative YouthCriteria.evaluate only; never recompute or override CORE.
 * Published OY-RALS response knowledge is a research corpus, not verified clinical evidence.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYCIE30=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='3.1.0-predeploy-candidate',GROUPS=[2,3,3,3,2,2,3,3,2,2],NAMES=['학대·보호','또래·학교폭력','정서·자해','학습·출결','행동·건강','장애·발달·접근성','가족·돌봄','경제·주거·기본생활','관계·지지','온라인·디지털'];
const ROLES={'teacher':'교사','education-welfare':'교육복지사','social-worker':'사회복지사'};
const INTENTS=[['safety',/안전|학대|자해|자살|죽고|긴급|신고|보호|현재 위험/],['resource',/기관|자원|연계|의뢰|접수|지원처|어디서|복지관|센터/],['plan',/계획|목표|개입|장기|단기|중기|지표|실행/],['meeting',/회의|협의|판정|안건|조정/],['interview',/면담|상담|질문|물어|확인할/],['strength',/강점|희망|잘하는|원하는|보호요인|자기결정/],['evidence',/근거|왜|불일치|점수|미상|증거|출처|검증/],['summary',/요약|사정|분석|종합|해석|보고서/]];
const DOMAIN_CUES=[/학대|방임|폭행|보호/,/학교폭력|왕따|따돌림|괴롭힘|또래|교우/,/자해|자살|죽고|우울|불안|정서|공황/,/학습|결석|지각|등교|수업|학업/,/건강|행동|충동|응급|병원/,/장애|발달|감각|접근성|보조기/,/가족|양육|돌봄|보호자|간병/,/생계|경제|주거|월세|체납|결식|끼니|식사/,/관계|친구|지지|고립|신뢰/,/온라인|채팅|게임|디지털|SNS|유포/];
const QUESTIONS=['학생의 현재 안전·연락 안전성과 보호절차를 누구와 어떻게 확인할까요?','피해·갈등의 구체적 상황과 학생이 안전하게 머물 공간을 확인했나요?','현재의 위해·정서 변화·일상 영향과 전문평가 필요를 확인했나요?','학생이 어렵게 느끼는 수업 장면과 가능한 조정은 무엇인가요?','실제 건강·행동의 생활 영향과 필요한 보건·전문평가를 구분했나요?','교육환경에서 조정할 수 있는 접근장벽은 무엇인가요?','실제 돌봄 분담과 학생의 휴식·의사를 확인했나요?','식사·주거·의료·학습비의 실제 미충족 필요는 무엇인가요?','학생이 선택한 안전한 지지인·연락 수단이 있나요?','일반 기기 사용과 위해·협박·착취 피해를 구별해 확인했나요?'];
const ACTIONS=['실제 안전·연락 조건과 사안별 보호절차를 우선 검토','피해 보호와 관계·학교생활 지원을 분리해 협의','현재 안전을 우선 확인한 뒤 일상과 상담 이용 장애를 파악','학생 선호에 맞는 학습·출결 조정안을 협의','진단을 추정하지 않고 건강·행동 지원을 검토','교육환경 조정과 필요한 전문서비스 문의를 구분','돌봄 부담과 휴식·가족의 지원 여건을 함께 사정','기존 서비스를 확인하고 실제 미충족 필요를 별도 조사','학생이 선택한 신뢰관계와 도움 요청 경로를 확인','피해 위험이 확인되면 디지털 보호절차 검토'];
const NARRATIVE_CUES=[
 {id:'selfharm',rx:/자해|자살|죽고\s*싶|살기\s*싫|삶을\s*끝내|목숨/,label:'자해·자살 관련 표현'},
 {id:'protection',rx:/학대|방임|폭행|맞았|맞았다|성착취|성폭력/,label:'보호·학대 관련 표현'},
 {id:'threat',rx:/협박|강요|위협|보복/,label:'협박·안전 관련 표현'},
 {id:'basic',rx:/결식|끼니|식사|체납|월세|퇴거|주거|생계/,label:'기본생활 관련 표현'},
 {id:'peers',rx:/학교폭력|왕따|따돌림|괴롭힘|친구.{0,8}갈등/,label:'또래관계 관련 표현'},
 {id:'school',rx:/결석|지각|수업|학습|과제/,label:'학교생활 관련 표현'},
 {id:'mental',rx:/불안|우울|공황|무기력|불면|심한\s*스트레스/,label:'정서·생활기능 관련 표현'},
 {id:'health',rx:/통증|건강\s*악화|진료를?\s*못|복용\s*중단|충동적\s*행동|위험\s*행동/,label:'건강·행동 관련 표현'},
 {id:'access',rx:/보조기기|수업\s*조정|교육환경\s*조정|통역\s*지원|이동이?\s*불편|수업\s*접근이?\s*어렵/,label:'교육 접근성 관련 표현'},
 {id:'care',rx:/돌봄\s*공백|동생을?\s*돌보|가족을?\s*간병|보호자\s*부재|간병\s*부담|혼자\s*지낸/,label:'가족·돌봄 관련 표현'},
 {id:'relation',rx:/사회적\s*고립|외로|친구가?\s*없|믿을\s*사람\s*없|지지인\s*없|도움\s*요청이?\s*어렵/,label:'관계·지지 관련 표현'},
 {id:'digital',rx:/사진\s*유포|온라인\s*협박|SNS\s*괴롭힘|사이버\s*폭력|디지털\s*성착취|단톡방\s*따돌림/,label:'온라인·디지털 피해 관련 표현'},
 {id:'strength',rx:/희망|원해요|원한다고|하고\s*싶|도움이\s*되|잘하|좋아하/,label:'희망·강점 관련 표현'}];
const NARRATIVE_NEGATIVE=/(?:없(?:다|음|다고|어요|었다|었음)?|아니(?:다|고|라|었다)?|않(?:다|음|았다|는다고)?|부인|한\s*적\s*없|하지\s*않|하지\s*못|하고\s*싶지\s*않|안\s*했|안\s*한다|안\s*하)/;
const HISTORICAL=/(?:지난해|작년|과거|예전|이전에는|종결된|당시|몇\s*년\s*전)/;
const HYPOTHETICAL=/(?:예방교육|예시|가상의|가정하면|만약|교육자료|설명했다)/;
const HEARSAY=/(?:소문|전언|들었다|전해졌다|라고\s*한다|것\s*같다)/;
// Double-negated persistence is not evidence of absence; review rather than silently dismiss.
const NEGATION_AMBIGUITY=/(?:멈추지|그만두지|중단하지|끊지|없지\s*않|부인.*사실이\s*아니|하지\s*않겠다고\s*말하지)/;
const THIRD_PARTY=/(?:보호자|아버지|어머니|엄마|아빠|친구|교사).{0,16}(?:자해|자살|죽고\s*싶)/;
const MIN_LENGTH=2;
function checkPayload(p){if(!p||!Array.isArray(p.answers)||p.answers.length!==25||p.answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 각각 0~4 또는 unknown이 필요합니다.');const note=String(p.caseContext||'');if(note.length>7000)throw Error('서술형 7000자 제한');if(note.includes('\0'))throw Error('잘못된 텍스트');const ex=p.explicit===undefined?[]:p.explicit;if(!Array.isArray(ex)||ex.some(v=>typeof v!=='string'||v.length>240)||ex.length>10)throw Error('별도 안전확인 형식 오류');const follow=p.followups||{};if(!follow||typeof follow!=='object'||Array.isArray(follow)||Object.entries(follow).some(([k,v])=>!['4','5','12','13'].includes(k)||!['yes','no','unknown'].includes(v)))throw Error('후속확인 형식 오류');return {answers:p.answers.slice(),caseContext:note,explicit:ex.slice(),followups:{...follow}};}
function official(p,criteria){if(!criteria||typeof criteria.evaluate!=='function')throw Error('공식 CORE 미설치');return criteria.evaluate(p.answers,GROUPS,p.explicit.length>0,p.followups);}
function itemDomain(n){let start=0;for(let i=0;i<GROUPS.length;i++){start+=GROUPS[i];if(n<=start)return i;}return -1;}
function parseNarrative(input){
 const normalized=String(input||'').replace(/(않았고|없었고|아니었고)\s*(?=(?:학생|친구|보호자|부모|아버지|어머니|교사)(?:은|는|이|가)\s*)/gu,'$1. ');
 const all=normalized.split(/(?<=[.!?。])\s+|[.!?。\n]+|(?:하지만|그러나|그런데|다만|반면|으나|지만)[,\s]*/u).map(x=>x.trim()).filter(t=>t.length>=2);
 // Keep first 120 and last 40; promote safety-bearing clauses anywhere in the note.
 // This does NOT verify semantics. Excluded clauses must be reported explicitly.
 const positions=new Set();if(all.length<=180){all.forEach((_,i)=>positions.add(i));}else{
  for(let i=0;i<120;i++)positions.add(i);
  for(let i=Math.max(120,all.length-40);i<all.length;i++)positions.add(i);
  const safety=/자해|자살|죽고\s*싶|삶을\s*끝|학대|방임|성착취|폭행|성폭력|협박|강요|보복|흉기/;
  for(let i=0;i<all.length;i++)if(safety.test(all[i]))positions.add(i);
 }
 const selected=[...positions].sort((a,b)=>a-b).map(i=>({clause:all[i],originalIndex:i}));
 const chunks=selected;
 const out=[];
 for(let j=0;j<chunks.length;j++){
  const clause=chunks[j].clause,originalIndex=chunks[j].originalIndex,third=THIRD_PARTY.test(clause);
  for(const c of NARRATIVE_CUES){const m=clause.match(c.rx);if(!m)continue;
   const prefix=clause.slice(Math.max(0,m.index-8),m.index),suffix=clause.slice(m.index+m[0].length,m.index+m[0].length+17);
   const context=prefix+m[0]+suffix;
   const educationalMixed=HYPOTHETICAL.test(clause)&&/(?:예방교육|교육자료|가정|예시).{0,48}(?:\s후|\s이후|\s뒤).{0,24}실제로/.test(clause);
   const status=educationalMixed?'ambiguous_context_review':HYPOTHETICAL.test(clause)?'hypothetical':NEGATION_AMBIGUITY.test(clause)?'ambiguous_negation_review':NARRATIVE_NEGATIVE.test(context)?'negated':HISTORICAL.test(clause)?'historical':HEARSAY.test(clause)?'secondhand':'reported_unverified';
   const subject=third&&c.id==='selfharm'?'third_party_mentioned':'not_confirmed';
   out.push({id:`N${String(originalIndex+1).padStart(4,'0')}-${c.id}`,type:c.id,sourceSentenceIndex:originalIndex+1,label:c.label,status,subject,textIncluded:false,requiresHumanCheck:true});
  }
 }
 return {signals:out,hasNarrative:chunks.length>0,excludedTail:all.length>selected.length,clauseCount:all.length,inspectedCount:selected.length,disclaimer:'표현 탐지이며 학생의 사실·현재위해·안전성을 확정하지 않습니다.'};
}
function corpusCheck(db){
 if(!db||db.schema!=='OY-RALS-research-response-KB-v1'||db.version!=='2026-10-23-v1.0'||db.recordCount!==600||!Array.isArray(db.entries)||db.entries.length!==600||!Array.isArray(db.items)||db.items.length!==25||!Array.isArray(db.rules)||db.rules.length!==24||!Array.isArray(db.sources)||db.sources.length!==23)throw Error('600건 원본 버전·구성 불일치: 데이터 확인 전 연구응답 사용 차단');
 const indexed=new Map(),kinds={item:0,cross:0,method:0};
 for(const x of db.entries){
  if(!x||typeof x.id!=='string'||indexed.has(x.id)||!Object.hasOwn(kinds,x.kind)||typeof x.evidenceStatus!=='string')throw Error('응답 DB 레코드 중복·검증상태 오류');
  indexed.set(x.id,x);kinds[x.kind]++;
 }
 if(kinds.item!==450||kinds.cross!==120||kinds.method!==30)throw Error('600건 연구 응답 유형별 구성 불일치');
 for(let n=1;n<=25;n++)for(const score of ['0','1','2','3','4','unknown'])for(const v of ['S','T','A']){
   const id='I'+String(n).padStart(2,'0')+'-'+score+'-'+v,row=indexed.get(id);
   if(!row||row.kind!=='item'||row.item!==n||row.score!==score||row.vantage!==v||!['untested_hypothesis','practice_design'].includes(row.evidenceStatus)||typeof row.reviewQuestion!=='string'||typeof row.interpretation!=='string')throw Error('600건 응답 문항 ID·상태 오류: '+id);
 }
 for(let n=1;n<=24;n++)for(const state of ['0','1','2','3','unknown']){
  const id='P'+String(n).padStart(2,'0')+'-'+state,row=indexed.get(id);
  if(!row||row.kind!=='cross'||row.state!==state)throw Error('교차 가설 ID·상태 오류: '+id);
 }
 for(let n=1;n<=30;n++){
  const id='M'+String(n).padStart(2,'0'),row=indexed.get(id);
  if(!row||row.kind!=='method')throw Error('실천 원칙 ID 오류: '+id);
 }
 return {loaded:600,itemCount:kinds.item,crossCount:kinds.cross,otherCount:kinds.method,sourceCount:db.sources.length,version:db.version,allExpectedIdsPresent:true,empiricalValidation:false};
}
function intentOf(q){return INTENTS.find(x=>x[1].test(q))?.[0]||'summary';}
function domainFocus(q,p){let seen=[],st=0;const requested=new Set([...String(q).matchAll(/(?:^|[^0-9])([12]?[0-9])번/g)].map(m=>Number(m[1])).filter(x=>x>=1&&x<=25));for(let i=0;i<10;i++){const nums=Array.from({length:GROUPS[i]},(_,k)=>st+k+1);st+=GROUPS[i];const positive=nums.filter(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0),unknown=nums.filter(n=>p.answers[n-1]==='unknown'),requestedZeros=nums.filter(n=>requested.has(n)&&p.answers[n-1]===0);if(positive.length||unknown.length||requestedZeros.length)seen.push({i,name:NAMES[i],items:nums,positive,unknown,requestedZeros,score:positive.reduce((s,n)=>s+p.answers[n-1],0),matched:DOMAIN_CUES[i].test(q)||nums.some(n=>requested.has(n))});}
 const any=seen.some(x=>x.matched);const selected=any?seen.filter(x=>x.matched):seen;selected.sort((a,b)=>Number(b.positive.some(n=>[1,2,7,25].includes(n)))-Number(a.positive.some(n=>[1,2,7,25].includes(n)))||b.score-a.score||b.unknown.length-a.unknown.length||a.i-b.i);return selected.slice(0,4);}
function selectKnowledge(kb,p,focus,role,limit=8){if(!kb)return [];const vant=role==='teacher'?'T':'A',found=[];for(const d of focus)for(const n of d.positive.concat(d.unknown,d.requestedZeros||[])){const score=p.answers[n-1]==='unknown'?'unknown':String(p.answers[n-1]);const k=kb.entries.find(e=>e.kind==='item'&&e.item===n&&e.score===score&&e.vantage===vant);if(k)found.push({id:k.id,kind:'item',sourceStatus:k.evidenceStatus||'untested_hypothesis',claim:String(k.interpretation||'').slice(0,390),question:String(k.reviewQuestion||'').slice(0,280),suggestion:String(role==='teacher'?k.teacherAnswer:k.caseManagerAnswer||'').slice(0,300),item:n});if(found.length>=limit)return found;}return found;}
function selectPair(pairModel,p,limit=3){if(!pairModel||typeof pairModel.match!=='function')return [];let v;try{v=pairModel.match(p.answers,{limit,threshold:2});}catch{return [];}if(!Array.isArray(v))return [];return v.slice(0,limit).filter(x=>x&&Array.isArray(x.items)&&x.items.length===2&&x.items.every(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>=2)).map(x=>({id:x.id,items:x.items,status:'developer_hypothesis_unvalidated',question:x.question,warning:'상관·원인·독립사건이 확인된 것이 아닙니다.'}));}
const ROUTE_CACHE=new WeakMap();function getRouteRefs(index,knowledge,pairs,focus,intent,role,p){if(!index||!Array.isArray(index.rows)||index.count!==5550)return [];let set=ROUTE_CACHE.get(index);if(!set){set=new Set(index.rows.map(r=>r[0]));ROUTE_CACHE.set(index,set);}const ids=[...knowledge.map(x=>x.id),...pairs.map(x=>x.id+':'+Math.max(...x.items.map(n=>p.answers[n-1]))+':'+(role==='teacher'?'T':'A')),...focus.map(x=>'D'+String(x.i).padStart(2,'0')+':'+intent+':'+role)];return ids.filter(x=>set.has(x));}
function roleGuide(intent,role){const base={teacher:'학교 안에서 관찰·안전·학습환경을 확인', 'education-welfare':'학교와 지역기관 간 역할·의뢰상태를 조정','social-worker':'가구 욕구·강점·서비스 공백을 공동 사정'}[role];return intent==='resource'?base+'하고 문의·접수·회신·서비스 개시를 별도 기록합니다.':intent==='meeting'?base+'하며 회의 전에는 안건 초안으로 유지합니다.':intent==='plan'?base+'하고 학생과 목표·기준선·담당·점검일을 합의합니다.':base+'합니다.';}
function analyze(raw,q,opts={}){const p=checkPayload(raw),question=String(q||'').trim().slice(0,500);if(question.length<MIN_LENGTH)throw Error('질문을 입력하세요');const role=ROLES[opts.role]?opts.role:'social-worker',decision=official(p,opts.criteria);const intent=intentOf(question),narrative=parseNarrative(p.caseContext),focus=domainFocus(question,p);const kb=opts.kb||null;const kcarr=opts.kcarr&&typeof opts.kcarr.assess==='function'&&p.caseContext.trim()?opts.kcarr:null;let kcarrUsed=false,kcarrReviewPrompts=0;if(kcarr){try{const k=kcarr.assess({caseContext:p.caseContext,role});kcarrUsed=!k.abstain;kcarrReviewPrompts=Array.isArray(k.nextQuestions)?k.nextQuestions.length:0;}catch{kcarrUsed=false;}}if(kb)corpusCheck(kb);const knowledge=selectKnowledge(kb,p,focus,role),pairs=selectPair(opts.pairModel,p),needsSafety=decision.urgent||decision.safetyUnknown.length||decision.pendingChecks.length,narrativeSafety=narrative.signals.filter(x=>['selfharm','protection','threat'].includes(x.type)&&!['negated','hypothetical'].includes(x.status));const parts=[],trace=[];
 function add(kind,txt,refs=[],status='review'){parts.push({kind,text:txt,refs,status});trace.push({node:'R'+String(parts.length).padStart(3,'0'),kind,refs,status});}
 const scoreStatus=decision.incomplete?`확인 합계 ${decision.knownTotal}/${decision.knownMaximum}점, 미상 ${decision.unknownItems.length}문항(전체 수준 판단 보류)`:`총 ${decision.knownTotal}/100점`;
 add('official',scoreStatus+' · '+decision.title,['CORE'],'official_readonly');
 if(needsSafety)add('mandatory_safety','공식 CORE에서 안전확인 또는 추가확인이 요구됩니다. 담당자가 현재 안전·안전한 연락방법·보호절차를 우선 확인합니다. 위기 개입 및 신고 필요성은 현행 절차와 실무자가 판단합니다.',['CORE'],'mandatory_review');
 if(narrative.excludedTail)add('narrative_coverage','긴 상담자료 중 일부 문장은 길이·처리 한도로 검토되지 않았습니다. 핵심 안전 단서는 우선 탐색했으나 원문 전체를 사람이 다시 확인해야 합니다.',[],'incomplete_narrative_scan');
 if(narrativeSafety.length)add('narrative_safety','서술형에 안전 관련 단서가 있으므로 시점·주체·부정·전언 여부를 확인합니다. 서술 표현만으로 현재 위해가 확정된 것은 아닙니다.',narrativeSafety.map(x=>x.id),'narrative_review_only');
 if(!focus.length)add('absence','질문과 관련하여 이번 응답에서 양성·미상 문항이 추출되지 않았습니다. 지원이 불필요하다는 뜻이 아니므로 필요하면 면담으로 확인합니다.',[],'insufficient_input');
 for(const d of focus){const refs=d.positive.concat(d.unknown).map(n=>'Q'+String(n).padStart(2,'0'));const phrase=d.positive.map(n=>n+'번 '+p.answers[n-1]+'점').join('·')||'양성 점수 없음';add('domain',`${d.name}: ${phrase}${d.unknown.length?` / 미상 ${d.unknown.join('·')}번`:''}${d.requestedZeros.length?` / 질문 지정 0점 ${d.requestedZeros.join('·')}번`:''}. ${d.positive.length||d.unknown.length?ACTIONS[d.i]:'이번 평가에서 어려움이 보고되지 않은 항목으로, 필요하면 경과를 직접 확인합니다'}.`,refs.concat(d.requestedZeros.map(n=>'Q'+String(n).padStart(2,'0'))),'hypothesis_draft');add('verification_question',QUESTIONS[d.i],refs,'question_not_fact');}
 if(intent==='resource')add('referral','지역자원 추천은 등록기관·지원대상·관할·현재 모집·접수 가능 여부를 직접 확인해야 합니다. 이 페이지에서는 서비스 제공을 확정하지 않습니다.',[],'not_verified');
 if(intent==='plan'||intent==='meeting')add('workplan',`${roleGuide(intent,role)} 실행일·담당자·학생 의사·결정권자 승인 전에는 초안입니다.`,[],'draft_unapproved');
 if(intent==='strength')add('strength','학생의 실제 희망·강점·기존에 도움되었던 방법을 직접 질문해 기록합니다. 입력되지 않은 강점을 만들어내지 않습니다.',[],'unknown_not_fact');
 for(const k of knowledge.slice(0,6))add('research_response',`연구형 응답 ${k.id}: ${k.suggestion} 확인 질문: ${k.question}`,[`K:${k.id}`,'Q'+String(k.item).padStart(2,'0')],'unvalidated_research');
 if(pairs.length)add('cross_hypothesis',pairs.map(x=>`${x.id}: ${x.items.join('·')}번을 함께 보고 사건·기간·정보원을 대조`).join(' / '),pairs.flatMap(x=>x.items.map(n=>'Q'+String(n).padStart(2,'0'))),'research_hypothesis');
 const routeRefs=getRouteRefs(opts.route,knowledge,pairs,focus,intent,role,p);const output=parts.map(x=>`[${({official:'공식 결과',mandatory_safety:'필수 안전확인',narrative_safety:'서술 안전 확인',absence:'자료 부족',domain:'영역별 검토',verification_question:'면담 확인 질문',referral:'지원연계 검토',workplan:'사례계획 초안',strength:'강점·희망 확인',research_response:'한국어 응답 DB',cross_hypothesis:'교차 검토'})[x.kind]||x.kind}]\n${x.text}${x.refs.length?'\n근거 ID: '+x.refs.join(', '):''}`).join('\n\n')+'\n\n[한계] 비표준화 TEST · 공식 CORE 판정 불변 · 실무자 검토 전 초안. 지식 DB는 연구·개발 가설이며 실제 진단·서비스 승인·효과 예측이 아닙니다.';
 return {version:VERSION,mode:'local_rule_retrieval_no_neural_weights',intent,role,official:{knownTotal:decision.knownTotal,knownMaximum:decision.knownMaximum,incomplete:decision.incomplete,urgent:decision.urgent,safetyUnknown:decision.safetyUnknown.slice(),pendingChecks:decision.pendingChecks.slice(),unknownItems:decision.unknownItems.slice(),title:decision.title},caseRevision:revision(p),narrativeCoverage:{totalClauses:narrative.clauseCount,inspectedClauses:narrative.inspectedCount,incomplete:narrative.excludedTail},answer:output,segments:parts,trace,selectedEvidence:focus.flatMap(x=>x.positive.concat(x.unknown).map(n=>'Q'+String(n).padStart(2,'0'))),knowledgeIds:knowledge.map(x=>x.id),pairIds:pairs.map(x=>x.id),kcarrCrossCheck:{used:kcarrUsed,reviewPromptCount:kcarrReviewPrompts,independentEvidence:false,sourceStatus:'development_model_not_validated'},corpusStatus:kb?'600_schema_verified_source_unvalidated':'not_loaded',corpusRecords:kb?600:0,routeRefs,routeStatus:opts.route?'index_lookup':'not_loaded',narrativeSignals:narrative.signals,humanReviewRequired:true,verifiedByExperts:false,clinicalValidation:false,externalCaseTransmission:false};}
function revision(p){const s=JSON.stringify({answers:p.answers,caseContext:p.caseContext,explicit:p.explicit,followups:p.followups});let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function publicAudit(out){return {version:VERSION,official:out.official,caseRevision:out.caseRevision,claimCount:out.trace.length,sourceRefs:out.selectedEvidence,knowledgeIds:out.knowledgeIds,pairIds:out.pairIds,provenanceUnverified:out.trace.filter(x=>x.status.includes('unvalidated')).length,expertReviewed:false};}
return Object.freeze({VERSION,GROUPS,NAMES,ROLES,checkPayload,official,itemDomain,parseNarrative,corpusCheck,intentOf,domainFocus,selectKnowledge,selectPair,analyze,publicAudit,revision});
});
