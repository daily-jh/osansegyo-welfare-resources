/* OY-RALS 통합사례관리지원모델 v7.0 (additive; V2.2 untouched).
 * Offline deterministic case support: no network, no background processing, no personal-data storage.
 * All actions are REVIEW DRAFTS, not actual interventions, approvals or professional judgments.
 */
(function(root,factory){'use strict';const DB=typeof module!=='undefined'&&module.exports?require('./casework-knowledge-v7.js'):root.OYCaseworkKnowledgeV7;
 const C=typeof module!=='undefined'&&module.exports?(()=>{try{return require('./criteria.js')}catch{return null}})():root.YouthCriteria;
 const api=factory(DB,C);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYCaseManagementV7=api;
})(typeof window!=='undefined'?window:globalThis,function(DB,Criteria){'use strict';
const VERSION='7.0.0-case-management-20261024';
const SIZES=[2,3,3,3,2,2,3,3,2,2],KEY_SAFETY=[1,2,7,25],FOLLOWUPS=['4','5','12','13'];
const RX={
 themes:[/학대|방임|폭력.{0,8}가정|가정.{0,8}폭력|보호.{0,5}위험|학대.{0,5}의심/,/따돌림|왕따|또래|괴롭|협박|갈취|피해학생|학교폭력/,/우울|불안|공황|무기력|자해|자살|죽고.?싶|수면.{0,5}장애|심리상담/,/결석|지각|등교|학습|수업|과제|학업|학교.{0,5}회피/,/충동|음주|흡연|위험행동|약물|건강|의료|진료|병원/,/발달|장애|접근성|편의|보조공학|특수교육|감각.{0,5}불편|의사소통/,/부모|보호자|가족|돌봄|간병|동생|육아|양육|가사/,/월세|퇴거|체납|결식|식사|경제|생활비|주거|빈곤|의료비|급식/,/믿을.{0,5}사람|도움.{0,5}청|고립|친구.{0,5}없|지지|신뢰|멘토|관계/,/SNS|온라인|인터넷|디지털|유포|영상|스마트폰|채팅|성착취|사이버/],
 neg:/없(?:었|음|다|어|고|지만|다고)|않(?:았|음|는다|다고)|아니(?:라|다)|부인|확인되지\s*않|한\s*적\s*없|하지\s*않|못\s*했|안\s*(?:했|하는|함)/,
 past:/과거|예전|지난(?:해|달|학기|주)|작년|당시|이전에|초등학교\s*때|\d+년\s*전/,
 current:/현재|지금|최근|이번|오늘|계속|여전히|요즘|반복/,
 hearsay:/(?:친구|보호자|담임|교사|이웃|가족).{0,32}(?:전했|말했|알려|전해|들었다)|전언|제보|소문/,
 hypothetical:/만약|가정(?:한|하|의)|가상(?:사례)?|예를\s*들|연습|예시/,
 uncertain:/미확인|불확실|모르|확인\s*필요|의심|추정|가능성|정황|여부/,
 strength:/강점|장점|잘하|신뢰|믿을|스스로|즐겨|희망|원해|원함|원한다고|받고\s*싶|돕고\s*싶|하고\s*싶/,
 service:/서비스|지원(?:받|중|예정|했)|상담(?:받|중|신청|예약)|기관|의뢰|접수|연계|문의|복지관|Wee|위클래스/,
 contact:/보호자.{0,18}(?:연락|알리지)|집에\s*연락|부모.{0,18}(?:연락|알리)|알리지\s*말|연락하지\s*말/
};
const sanitize=s=>String(s??'').slice(0,5000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' ');
function redact(s){return sanitize(s).replace(/\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/g,'[전화번호]').replace(/\b\d{6}[- ]?[1-8]\d{6}\b/g,'[식별번호]').replace(/[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[이메일]').replace(/https?:\/\/\S+/gi,'[링크]')}
function validateAnswers(a){if(!Array.isArray(a)||a.length!==25||a.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 각 0~4점 또는 미상을 입력해야 합니다.');return true;}
function validate(input,opts){validateAnswers(input?.answers);const role=opts?.role??'teacher',stage=opts?.stage??'assessment';if(!DB.roles[role]||!DB.caseStages.some(s=>s.id===stage))throw Error('역할 또는 사례관리 단계를 확인해 주세요.');if(typeof(opts?.caseContext??input?.caseContext??'')!=='string')throw Error('자유서술은 문자열이어야 합니다.');if(opts?.serviceTimeline!==undefined&&!Array.isArray(opts.serviceTimeline))throw Error('서비스 이행상태는 배열이어야 합니다.');return true;}
function split(text){return sanitize(text).replace(/(없지만|않지만|그러나|하지만|반면|그런데|다만|그리고|또한)/g,'$1\n').split(/\n+|[.!?。]+\s*|[;；]+/).map(v=>v.trim()).filter(Boolean).slice(0,60)}
function parseNarrative(text){const units=[],mentions=[],flags=[];split(text).forEach((s,i)=>{
 const status=RX.hypothetical.test(s)?'hypothetical':RX.uncertain.test(s)?'uncertain':RX.neg.test(s)?'negative':RX.past.test(s)&&!RX.current.test(s)?'historical':RX.hearsay.test(s)?'third-party':'reported-unverified';
 const marked=DB.domains.filter((_,j)=>RX.themes[j].test(s)).map(d=>d.id),id='U'+String(i+1).padStart(3,'0');
 const row={id,excerpt:redact(s).slice(0,200),status,domains:marked,source:RX.hearsay.test(s)?'third-party':'not-verified',time:RX.past.test(s)&&!RX.current.test(s)?'past':RX.current.test(s)?'current-reported':'unknown',studentWish:RX.strength.test(s),existingSupport:RX.service.test(s),contactSafetyReview:RX.contact.test(s),verified:false};units.push(row);
 for(const d of marked)mentions.push({unitId:id,domain:d,status,independentEvidence:false});
 if(row.studentWish||row.existingSupport||row.contactSafetyReview)flags.push({unitId:id,studentWish:row.studentWish,existingSupport:row.existingSupport,contactSafetyReview:row.contactSafetyReview,excerpt:row.excerpt,status});
});return {units,mentions,flags,sanitized:!!text&&redact(text)!==text,interpretationLimit:'주제 언급을 탐지한 것이며 실제 발생·원인·진단의 확인이 아닙니다.'};}
function scoreByDomain(answers){let index=0;return DB.domains.map(d=>{const ids=d.items,values=ids.map(n=>answers[n-1]),positive=ids.filter(n=>typeof answers[n-1]==='number'&&answers[n-1]>0),unknown=ids.filter(n=>answers[n-1]==='unknown'),known=values.filter(v=>typeof v==='number');return {id:d.id,name:d.name,positiveItems:positive,unknownItems:unknown,knownSum:known.reduce((s,v)=>s+v,0),peak:Math.max(0,...known),complete:unknown.length===0}})}
function intensity(domain){return domain.unknownItems.length&&!domain.positiveItems.length?'unknown':domain.peak>=3?'high':domain.peak===2?'moderate':domain.peak===1?'low':'unknown'}
function decision(input){if(Criteria&&typeof Criteria.evaluate==='function'){const x=Criteria.evaluate(input.answers,SIZES,!!input.explicit?.length,input.followups||{});return {source:'existing-criteria-v2.2',title:x.title,urgent:!!x.urgent,provisional:!!x.provisional,pendingChecks:[...(x.pendingChecks||[])],unknownItems:[...(x.unknownItems||[])],safetyUnknown:[...(x.safetyUnknown||[])],knownTotal:x.incomplete?null:x.knownTotal};}
 const a=input.answers,follow=input.followups||{};
 const gates=[4,5,12,13].filter(n=>(n===4?a[n-1]>=1:a[n-1]>=3)&&!['yes','no'].includes(follow[n]));
 const pending=[...new Set([...gates,...Object.entries(follow).filter(([n,v])=>FOLLOWUPS.includes(n)&&v==='unknown').map(([n])=>+n)])];
 const urgent=KEY_SAFETY.some(n=>typeof a[n-1]==='number'&&a[n-1]>0)||!!input.explicit?.length||[4,5,12,13].some(n=>follow[n]==='yes');
 return {source:'conservative-fallback-not-valid-operational-criteria',title:urgent?'현재 안전확인 및 보호절차 검토':'공식 판정모듈 연결 필요',urgent,provisional:true,pendingChecks:pending,unknownItems:a.flatMap((x,i)=>x==='unknown'?[i+1]:[]),safetyUnknown:KEY_SAFETY.filter(n=>a[n-1]==='unknown'),knownTotal:null};}
const ensureRecord=(r,i)=>{if(!r||typeof r!=='object'||typeof r.id!=='string'||r.id.length>70||!DB.operationalStages[r.status])throw Error('서비스기록 '+(i+1)+'번의 ID·상태 확인 필요');return r};
function auditServices(records){const allowed=DB.operationalStages;const by=new Map(),errors=[],normal=[];
 (records||[]).slice(0,150).forEach((a,i)=>{const r=ensureRecord(a,i);if(by.has(r.id))errors.push({id:r.id,reason:'같은 서비스 ID가 중복 입력되었습니다. 시점별 이력인지 확인 필요'});by.set(r.id,r);
 const issues=[];if(['received','started','completed'].includes(r.status)&&!r.verified)issues.push('기관 회신·기록 등 확인근거 미기재: 상태 확정 보류');
 if(r.status==='completed'&&!r.outcomeEvidence)issues.push('서비스 완료와 생활 변화는 다릅니다. 결과기준선·이용자 확인 필요');
 if(r.status==='referred'&&!r.agency)issues.push('의뢰기관·접수 경로 미확인');
 if(r.status==='inquiry'&&r.startedDate)issues.push('문의 상태에 제공 시작일이 함께 기록되어 있어 상태 확인 필요');
 const row={id:r.id,status:r.status,label:allowed[r.status],verified:!!r.verified,verifiedOutcome:!!r.outcomeEvidence,issues};normal.push(row);issues.forEach(reason=>errors.push({id:r.id,reason}));});
 const tally=Object.fromEntries(Object.keys(allowed).map(k=>[k,normal.filter(r=>r.status===k).length]));return {tally,rows:normal,alerts:errors,meaning:'문의·의뢰·접수·시작·완료·성과의 자동 승격 금지'};}
function commonStage(stage){if(['discovery','intake','first_contact'].includes(stage))return 'intake';if(['assessment','screening_review','case_conference','short_plan','long_plan'].includes(stage))return'planning';if(['referral','implementation','monitoring'].includes(stage))return 'implementation';return 'review'}
function suggest(input,opts={}){validate(input,opts);
 const role=opts.role||'teacher',stage=opts.stage||'assessment',note=sanitize(opts.caseContext??input.caseContext??'');const n=parseNarrative(note),ds=scoreByDomain(input.answers),d=decision(input),r=DB.roles[role],step=DB.caseStages.find(s=>s.id===stage);const sev=ds.map(intensity);
 const active=ds.filter(x=>x.positiveItems.length>0||x.unknownItems.length>0||n.mentions.some(m=>m.domain===x.id&&!['negative','hypothetical'].includes(m.status)));
 active.sort((a,b)=>Number(b.positiveItems.some(i=>KEY_SAFETY.includes(i)))-Number(a.positiveItems.some(i=>KEY_SAFETY.includes(i)))||Number(b.unknownItems.some(i=>KEY_SAFETY.includes(i)))-Number(a.unknownItems.some(i=>KEY_SAFETY.includes(i)))||b.peak-a.peak||a.id-b.id);
 const sampled=active.slice(0,Math.max(1,Math.min(5,opts.maxGoals||4)));
 const draftGoals=sampled.map((x,i)=>{const def=DB.domains[x.id-1],related=n.mentions.filter(m=>m.domain===x.id);const strongest=x.positiveItems.slice().sort((a,b)=>input.answers[b-1]-input.answers[a-1]).slice(0,3);
 return {id:'CM7-'+String(x.id).padStart(2,'0'),domain:x.id,domainName:x.name,stage,role,priorityDraft:i+1,referenceItems:strongest.map(number=>({number,score:input.answers[number-1]})),unknownItems:x.unknownItems,reviewContext:related.map(m=>({unitId:m.unitId,status:m.status})),actionIndex:'CM-D'+String(x.id).padStart(2,'0')+'-'+stage+'-'+role+'-'+(related[0]?.status==='historical'?'historical':related[0]?.status==='third-party'?'third_party':related[0]?.status==='uncertain'?'uncertain':n.flags.some(f=>f.existingSupport)?'service_barrier':'current')+'-'+sev[x.id-1],
 evidenceLevel:'screening_or_narrative_unverified',goal:def.goal,shortTerm:def.short,longTerm:def.long,firstAction:(d.urgent&&i===0?'현재 안전 확인 및 필요한 긴급·보호 절차는 사례회의·계획 수립을 기다리지 않고 우선 진행(안). ':'')+r.action+' · '+def.action,question:def.question,assignedTo:r.owner,coordination:def.resources,baseline:null,target:null,agreedWithStudent:false,verifiedServiceStart:false,nextReviewDate:null,completionCriterion:def.measure,stageTask:step.policy,recordField:step.record,roleLimit:r.limit,sourceIds:strongest.map(n=>'I'+String(n).padStart(2,'0')).concat(related.map(m=>m.unitId)),warning:def.do_not};});
 const contradictions=n.mentions.flatMap(m=>{const x=ds[m.domain-1];if(m.status==='negative'&&x.positiveItems.length)return[{unitId:m.unitId,domain:m.domain,reason:'부정된 서술과 양성 점수를 시점·사건별로 대조'}];if(!['negative','hypothetical'].includes(m.status)&&x.knownSum===0&&x.unknownItems.length===0)return[{unitId:m.unitId,domain:m.domain,reason:'서술 언급과 영역 0점 대조: 점수는 자동 변경하지 않음'}];return[];});
 const safetyMention=n.units.filter(u=>u.domains.includes(1)||u.domains.includes(3)||u.domains.includes(10)).filter(u=>!['hypothetical','negative'].includes(u.status));
 const firstActions=[];
 if(d.urgent)firstActions.push('기존 안전판정에 따라 학생의 현재 안전을 직접 확인하고 사안에 맞는 보호·신고·응급 절차를 우선 검토');
 else if(d.provisional||d.safetyUnknown?.length||d.pendingChecks?.length)firstActions.push('안전 확인 미완료·미상 문항의 확인 담당과 경로를 정하되 이미 확인된 어려움의 지원은 지연하지 않음');
 if(safetyMention.length&&!d.urgent)firstActions.push('서술에 안전 관련 주제가 언급되어 시점·실제 사건·현재 안전을 별도 확인; 자동 위험판정 금지');
 if(n.flags.some(x=>x.contactSafetyReview))firstActions.push('보호자에게 연락하는 것이 학생에게 안전하고 적절한지 사전 검토');
 if(draftGoals.length)firstActions.push(draftGoals[0].firstAction);
 if(!firstActions.length)firstActions.push('학생의 희망과 생활상의 어려움·강점을 열린 질문으로 확인');
 const serviceAudit=auditServices(opts.serviceTimeline||[]);
 const needs=DB.tenNeeds.map(name=>({name,linkedDomains:DB.domains.filter(o=>o.needs.includes(name)&&sampled.some(g=>g.domain===o.id)).map(o=>o.name),status:'needs_assessment_prompt_not_confirmed'})).filter(x=>x.linkedDomains.length);
 const itemPlans=ds.flatMap(x=>[...x.positiveItems,...x.unknownItems].map(number=>{const item=DB.items[number-1],score=input.answers[number-1];return {number,score,domain:item.domainId,stageGroup:commonStage(stage),retrievalId:'CM-I'+String(number).padStart(2,'0')+'-S'+score+'-'+role+'-'+commonStage(stage),topic:item.shortLabel,verificationQuestion:item.followup,avoid:item.avoid,status:score==='unknown'?'verification_pending':'assessment_response_not_independent_verification'}}));
 const pairHypotheses=[];const known=ds.flatMap(x=>x.positiveItems),byDomain=new Map(known.map(i=>[i,DB.items[i-1].domainId]));for(let i=0;i<known.length;i++)for(let j=i+1;j<known.length;j++)if(pairHypotheses.length<12){const a=known[i],b=known[j];const context='current';pairHypotheses.push({id:'CM-P'+String(a).padStart(2,'0')+'-'+String(b).padStart(2,'0'),retrievalId:'CM-P'+String(a).padStart(2,'0')+'-'+String(b).padStart(2,'0')+'-'+role+'-'+context+'-'+commonStage(stage),items:[a,b],domains:[byDomain.get(a),byDomain.get(b)],interpretation:'같은 사건이 서로 다른 생활영역에 영향을 미쳤거나 독립된 어려움이 함께 보고됐을 가능성을 구분',question:'두 어려움이 언제부터, 누구의 어떤 자료로 확인됐고 동일 사건에 속하나요?',scoreBonus:0});}
 return {version:VERSION,source:'addon_to_existing_case_management_v2_2',officialScoringUnchanged:true,role,stage,decision:d,caseNarrative:{units:n.units,flags:n.flags,contradictions,privacyWarning:n.sanitized?'형식 기반 연락처 등 일부 마스킹. 자유서술의 모든 개인정보가 비식별되었다는 뜻은 아님.':null},domainReview:active,serviceAudit,needs,draftGoals,itemPlans,pairHypotheses,firstActions,reviewChecklist:['학생의 희망·참여·안전한 연락 방식 확인','현재 정보·과거 정보·전언·미상을 분리','기존 서비스 중복·신청·접수·개시 확인','사례회의 채택·보류·수정 결과를 문서상 별도 기록','단기·중장기 목표 기준선·담당·완료기준 합의','서비스 이행과 생활변화·재사정은 독립 관찰','실제 기관 대상·관할·접수 상황과 법적·윤리적 권한 확인'],limits:['본 결과는 합성 규칙 기반 사례관리 참고안','실제 서비스 제공·종결·사례유형 및 급여자격 자동 확정 금지','위기점수로 자해·자살 미래 위험예측 금지','서술만으로 판정·척도점수를 변경하지 않음']};}
function writeReport(x){if(!x||x.version!==VERSION)throw Error('v7 계획 결과가 필요합니다.');const lines=['[통합사례관리 지원모델 v7.0 · 담당자 검토 초안]','기존 판정: '+x.decision.title+(x.decision.provisional?' · 현재 판정 검토 보류':''),'단계: '+x.stage+' / 역할: '+DB.roles[x.role].name,'','[먼저 할 일]',...x.firstActions.map((v,i)=>(i+1)+'. '+v),'','[욕구사정·실행계획 초안]'];for(const g of x.draftGoals){lines.push('· '+g.domainName+' / 문항: '+g.referenceItems.map(e=>e.number+'('+e.score+')').join('·'),'  단기목표: '+g.shortTerm,'  장기목표: '+g.longTerm,'  수행할 일: '+g.firstAction,'  담당(안): '+g.assignedTo,'  확인 질문: '+g.question,'  점검지표: '+g.completionCriterion,'  기준선·목표치·기한: 학생과 협의 전 미확정','');}
 if(x.itemPlans?.length)lines.push('[문항별 직접 확인 질문]',...x.itemPlans.slice(0,5).map(i=>'· '+i.number+'번 '+i.topic+' → '+i.verificationQuestion));
 if(x.caseNarrative.contradictions.length)lines.push('[서술·점수 대조 필요]',...x.caseNarrative.contradictions.map(c=>'· '+c.unitId+': '+c.reason));
 lines.push('[서비스 진행상태 검수]',...x.serviceAudit.rows.map(r=>'· '+r.id+': '+r.label+' · 확인='+r.verified+' · 생활변화 확인='+r.verifiedOutcome),...x.serviceAudit.alerts.map(a=>'! '+a.id+' '+a.reason),'','[회의에서 결정할 것]','학생 희망·동의 / 실제 보호·정보공유 근거 / 우선 목표 / 기관 역할 / 다음 확인일 / 실제 서비스 제공 및 변화의 확인 방법','','검토 초안이며 실제 학생 면담, 의료·보호·신고 의무, 기관 판정 및 승인 절차를 대체하지 않음.');return lines.join('\n');}
const api=Object.freeze({VERSION,validateAnswers,parseNarrative,scoreByDomain,auditServices,suggest,writeReport,knowledgeMetrics:{domains:10,stages:15,roles:3,contexts:6,intensities:4,conditionRecords:34200,actionCards:450}});return api;
});
