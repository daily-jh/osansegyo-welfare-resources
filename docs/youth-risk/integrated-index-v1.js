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
const VERSION='1.0.0-operational-20261026';
const NAMES=Object.freeze(['안정관찰','초기주의','집중지원','고위기개입','최우선 안전대응']);
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
 const safetyText=positives.some(x=>x.safety);
 const narrativeAvailable=Boolean(context.hasContext);
 const narrative=narrativeAvailable?ROUND(clamp(distinct.size*17+(safetyText?15:0))):null;
 // Redistribute unavailable narrative's 5% share, never synthesize a zero.
 const coefficients={raw:0.40,weighted:0.25,cross:0.20,critical:0.10,narrative:narrativeAvailable?0.05:0};
 const denom=Object.values(coefficients).reduce((a,b)=>a+b,0);
 const composite=complete?ROUND(clamp((raw*coefficients.raw+weighted*coefficients.weighted+
  crossScore*coefficients.cross+criticalScore*coefficients.critical+
  (narrative||0)*coefficients.narrative)/denom)):null;
 let base=composite===null?null:Math.min(5,Math.floor(composite/20)+1),tier=base;
 let safetyFloor=null,safetyReason='';
 const highCritical=critical.filter(c=>c.score!==null&&c.score>=3);
 if(official.urgent){
  if((p.explicit||[]).length>0||[4,5,12,13].some(id=>p.followups?.[id]==='yes')||highCritical.length){
   safetyFloor=5;safetyReason='명시된 긴급 신호·고강도 보호문항에 따라 안전 최우선';
  }else if(official.lowSafetyOnly){safetyFloor=2;safetyReason='안전 관련 1점 응답에 따른 초기 보호 우선';}
  else {safetyFloor=4;safetyReason='핵심 안전문항 양성에 따른 우선 보호경로';}
 }
 if(tier!==null&&safetyFloor!==null)tier=Math.max(tier,safetyFloor);
 if(JSON.stringify(answers)!==before)throw Error('CORE_INPUT_MUTATED');
 if(raw!==audit.rawKnownTotal)throw Error('CORE_SCORE_MISMATCH');
 return Object.freeze({
  version:VERSION,measure:'개발형 지원우선순위 분류',validated:false,
  raw,complete,known,unknown:25-known,official,weightsVersion:audit.version,
  weighted,domainStrengths:strengths.map(v=>v===null?null:ROUND(v*100)),
  cross,crossScore,critical,criticalScore,narrative,narrativeAvailable,
  coefficients,composite,baseTier:base,tier,
  label:tier===null?'응답자료 미완료':NAMES[tier-1],action:tier===null?'현재 확인된 문항의 안전·지원 과제 먼저 처리':ACTIONS[tier-1],
  safetyFloor,safetyReason,
  domainRows:ds.map((d,i)=>{const offset=W.GROUPS.slice(0,i).reduce((a,b)=>a+b,0);
   const knownIdx=d.values.map((v,k)=>typeof v==='number'?offset+k:-1).filter(k=>k>=0);
   const wNum=knownIdx.reduce((sum,k)=>sum+answers[k]*audit.weights[k],0);
   const wMax=knownIdx.reduce((sum,k)=>sum+4*audit.weights[k],0);
   return {id:i,name:d.name,raw:d.sum,max:d.known*4,unknown:d.unknown,
    normalized:d.known?ROUND(100*d.sum/(d.known*4)):null,weighted:wMax?ROUND(100*wNum/wMax):null};}),
  activePairs:cross.filter(x=>x.active).sort((a,b)=>b.strength-a.strength||b.weight-a.weight),
  observations:positives.length,
  note:'자체 개발 지표로 5단계 지원우선순위를 분류합니다. 검증된 진단·발생확률·신고 판단 기준이 아니며 CORE 원점수·공식 안전판정은 변경하지 않습니다.'
 });
}
return Object.freeze({VERSION,NAMES,ACTIONS,PAIRS,CRITICAL,analyze});
});
