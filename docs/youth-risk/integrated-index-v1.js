/* OY-RALS five-level support-priority index V1, independent of protected CORE.
 * Operational routing classification, NOT empirically validated risk probability,
 * diagnosis, statutory reporting determination, or confirmation of narrative facts.
 */
(function(root,factory){'use strict';const api=factory(typeof module!=='undefined'&&module.exports);
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYFiveLevelIndex=api;
})(typeof window!=='undefined'?window:globalThis,function(node){'use strict';
const M=node?require('./support-model.js'):window.YouthMap;
const W=node?require('./weight-model.js'):window.YouthWeightModel;
const N=node?require('./case-context-core.js'):window.YouthCaseContextCore;
const VERSION='1.0.1-operational-20261028';
const NAMES=Object.freeze(['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응']);
const ACTIONS=Object.freeze([
 '보편 예방·강점 확인 및 변화 관찰',
 '해당 영역 개별지원과 2주 내 경과 점검',
 '학교 내 학맞통 협의 및 복합욕구별 집중지원',
 '학교·복지관·전문기관 공동사정과 집중 사례개입',
 '현재 안전확보·보호절차 우선, 학교·지역기관 동시 개입'
]);
const PAIRS=Object.freeze([
 {id:'emotion-care',a:2,b:6,label:'정서 × 가족돌봄',weight:1.3},
 {id:'school-emotion',a:3,b:2,label:'출결 × 정서',weight:1.15},
 {id:'basic-care',a:7,b:6,label:'기본생활 × 가족돌봄',weight:1.25},
 {id:'peers-emotion',a:1,b:2,label:'또래안전 × 정서',weight:1.15},
 {id:'digital-emotion',a:9,b:2,label:'디지털 × 정서',weight:1},
 {id:'health-attend',a:4,b:3,label:'건강행동 × 출결',weight:1},
 {id:'peer-attend',a:1,b:3,label:'또래안전 × 출결',weight:1},
 {id:'housing-attend',a:7,b:3,label:'기본생활 × 출결',weight:1},
 {id:'access-learning',a:5,b:3,label:'교육접근 × 출결',weight:0.9}
]);
const CRITICAL=Object.freeze([1,2,7,25]);
const ROUND=n=>Math.round(n*10)/10,clamp=n=>Math.max(0,Math.min(100,n));
function analyze(p){
 if(!M?.validate?.(p))throw Error('FIVE_LEVEL_PAYLOAD_INVALID');
 const answers=p.answers.slice(),before=JSON.stringify(answers);
 const official=M.context(p),ds=M.domains(p),audit=W.audit(answers);
 const known=audit.knownCount,complete=known===25;
 // Same authoritative answers and internal model-proposed item weights, normalized
 // against their maximum possible weighted response for the current weight vector.
 const raw=official.knownTotal;
 const weightedNumerator=answers.reduce((sum,x,i)=>sum+(typeof x==='number'?x*audit.weights[i]:0),0);
 const weightedMax=audit.weights.reduce((sum,w,i)=>sum+(typeof answers[i]==='number'?4*w:0),0);
 const weighted=weightedMax?ROUND(clamp(100*weightedNumerator/weightedMax)):null;
 const strengths=ds.map(d=>d.known?d.sum/(4*d.known):null);
 const cross=PAIRS.map(pat=>{
  const l=strengths[pat.a],r=strengths[pat.b],evidence=l!==null&&r!==null&&l>0&&r>0;
  const strength=evidence?ROUND(Math.min(l,r)*100):0;
  return {...pat,strength,active:evidence,display:evidence?'동시 응답':'해당 교차 미발생'};
 });
 const crossDenom=PAIRS.reduce((sum,x)=>sum+x.weight,0);
 const crossScore=ROUND(clamp(cross.reduce((sum,pair)=>sum+pair.strength*pair.weight,0)/crossDenom));
 const critical=CRITICAL.map(id=>({item:id,score:answers[id-1]==='unknown'?null:answers[id-1],strength:answers[id-1]==='unknown'?null:answers[id-1]*25}));
 const ordered=critical.filter(x=>x.strength!==null).sort((a,b)=>b.strength-a.strength||a.item-b.item);
 const criticalScore=ordered.length?ROUND((ordered[0].strength+(ordered[1]?.strength||0))/2):null;
 const context=N.reconcile(answers,String(p.caseContext||''));
 // Explicitly reported positive, current student-context cues only.
 // Historical, hypothetical, negated and third-party mention must never be
 // promoted automatically to confirmed current risk.
 const positives=context.signals.filter(x=>x&&['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party');
 const distinct=new Set(positives.map(x=>x.tag));
 // An export that withholds the narrative still carries whether it held a current safety cue.
 const safetyText=positives.some(x=>x.safety)||!!(p.narrativeRedacted&&p.narrativeRedacted.stage);
 const narrativeAvailable=positives.length>0;
 const narrative=narrativeAvailable?ROUND(clamp(distinct.size*17+(safetyText?15:0))):null;
 // Redistribute unavailable narrative's 5% share, never synthesize a zero.
 const coefficients={raw:0.40,weighted:0.25,cross:0.20,critical:0.10,narrative:narrativeAvailable?0.05:0};
 const baseScore=(raw*.40+weighted*.25+crossScore*.20+criticalScore*.10)/.95;
 // Positive current-context cues can only retain or raise the core evidence priority.
 const composite=complete?ROUND(clamp(narrativeAvailable?baseScore*.95+Math.max(baseScore,narrative)*.05:baseScore)):null;
 let base=composite===null?null:Math.min(5,Math.floor(composite/20)+1),tier=base;
 // Source CORE already records the number and severity of affected domains.
 // A sparse 25-item total may hide concentrated, multi-domain difficulty:
 // preserve raw FI but route confirmed domain concentration to a higher
 // *operational support-priority* floor (not an estimated clinical probability).
 const observedLevel=official.observedLevel;
 // Multiple domains with >=2 point evidence, including one 3+ peak,
 // warrant multidisciplinary work even if the 100-point sum is diluted.
 const intersectingDomains=ds.filter(d=>d.peak>=2);
 const concentrated=intersectingDomains.length>=2&&intersectingDomains.some(d=>d.peak>=3);
 // Two separate basic-needs items already at 2+ merit concrete shared-service
 // prioritization, even if their shared three-item domain contributes little
 // to the 100-point total. This is a work-order heuristic, not a poverty diagnosis.
 const multipleBasicNeeds=[19,20,21].filter(n=>typeof answers[n-1]==='number'&&answers[n-1]>=2).length>=2;
 const patternFloor=observedLevel>=3?4:observedLevel>=2||concentrated||multipleBasicNeeds?3:observedLevel>=1?2:1;
 const patternReason=observedLevel>=3?'3개 이상 중요 영역·고점 문항 동시 보고':
  multipleBasicNeeds?'식사·주거·서비스 비용 중 2가지 이상 2점 이상 응답으로 생활지원 통합 조정 우선':
  concentrated?'서로 다른 2개 이상 영역에 2점 이상 응답이 있고 3~4점 집중영역 포함':
  observedLevel>=2?'복수 생활영역에 집중지원 필요 응답':
  observedLevel>=1?'2점 이상 응답에 따른 개별지원 우선':'보편 예방·관찰 응답';
 if(tier!==null)tier=Math.max(tier,patternFloor);
 let safetyFloor=null,safetyReason='';
 const highCritical=critical.filter(c=>c.score!==null&&c.score>=3);
 if(official.urgent){
  if((p.explicit||[]).length>0||[4,5,12,13].some(id=>p.followups?.[id]==='yes')||highCritical.length){
   safetyFloor=5;safetyReason='명시된 긴급 신호·고강도 보호문항에 따라 안전 최우선';
  }else if(official.lowSafetyOnly){safetyFloor=2;safetyReason='안전 관련 1점 응답에 따른 초기 보호 우선';}
  else {safetyFloor=4;safetyReason='안전문항(1·2·7·25번) 응답이 있어 보호 절차를 먼저 적용';}
 }
 // Current-risk follow-up left as "not yet confirmed": run as provisional level 4 until it is answered.
 const pendingChecks=official.pendingChecks||[];
 let pendingOnly=false;
 if(pendingChecks.length&&(safetyFloor===null||safetyFloor<4)){safetyFloor=4;pendingOnly=true;safetyReason='현재 안전 추가확인 미확인('+pendingChecks.join('·')+'번) — 확인 전까지 잠정 제4단계로 운영';}
 if(safetyText)safetyFloor=Math.max(safetyFloor||1,4);
 // A first-hand narrative cue that already carries injury, strangulation or a self-harm means/plan is same-day work.
 const immediate=(context.immediate||[]).length?context.immediate:(p.narrativeRedacted&&p.narrativeRedacted.immediate||[]);
 if(safetyText)pendingOnly=false;
 if(immediate.length){pendingOnly=false;safetyFloor=5;safetyReason='서술에 '+immediate.map(x=>x.reason).join(', ')+'이 있어 당일 안전 확보 우선';}
 // Safety-based support paths stay available even when unrelated items are unknown.
 // With unknowns left, a safety answer never lowers the level below what the answered pattern already shows.
 if(safetyFloor!==null)tier=tier===null?Math.max(safetyFloor,patternFloor||0):Math.max(tier,safetyFloor);
 // The level stands only until the follow-up is answered; say so in the name itself, not only in the reason.
 const provisional=pendingOnly&&tier===4&&Math.max(base||0,patternFloor)<4;
 if(JSON.stringify(answers)!==before)throw Error('CORE_INPUT_MUTATED');
 if(raw!==audit.rawKnownTotal)throw Error('CORE_SCORE_MISMATCH');
 return Object.freeze({
  version:VERSION,measure:'개발형 지원우선순위 분류',validated:false,
  raw,complete,known,unknown:25-known,official,weightsVersion:audit.version,
  weighted,domainStrengths:strengths.map(v=>v===null?null:ROUND(v*100)),
  cross,crossScore,critical,criticalScore,narrative,narrativeAvailable,
  coefficients,composite,baseTier:base,tier,
  label:tier===null?'관측영역 지원단계 미분류':NAMES[tier-1]+(provisional?' (잠정)':''),provisional,action:tier===null?'관측된 영역별 지원 우선 실행':ACTIONS[tier-1],
  observedLevel,patternFloor,patternReason,
  safetyFloor,safetyReason:immediate.length?safetyReason:safetyText?(safetyReason?safetyReason+' · 서술 안전단서 포함':'서술에 현재 보호 관련 단서가 나타나 보호경로 우선 배치'):safetyReason,
  domainRows:ds.map((d,i)=>{const offset=W.GROUPS.slice(0,i).reduce((a,b)=>a+b,0);
   const knownIdx=d.values.map((v,k)=>typeof v==='number'?offset+k:-1).filter(k=>k>=0);
   const wNum=knownIdx.reduce((sum,k)=>sum+answers[k]*audit.weights[k],0);
   const wMax=knownIdx.reduce((sum,k)=>sum+4*audit.weights[k],0);
   return {id:i,name:d.name,raw:d.sum,max:d.known*4,unknown:d.unknown,
    normalized:d.known?ROUND(100*d.sum/(d.known*4)):null,weighted:wMax?ROUND(100*wNum/wMax):null};}),
  activePairs:cross.filter(x=>x.active).sort((a,b)=>b.strength-a.strength||b.weight-a.weight),
  observations:positives.length,immediate:immediate.map(x=>x.reason),
  note:'자체 개발 지표로 5단계 지원우선순위를 분류합니다. 검증된 진단·발생확률·신고 판단 기준이 아니며 CORE 원점수·공식 안전판정은 변경하지 않습니다.'
 });
}
return Object.freeze({VERSION,NAMES,ACTIONS,PAIRS,CRITICAL,analyze});
});
