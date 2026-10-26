/* OY-RALS decision-support priority index v1.0 — independent from CORE.
 * Coefficients and thresholds are development policy assumptions, NOT
 * empirically validated probabilities, clinical cutoffs or legal findings.
 * A read-only ordinal SUPPORT PRIORITY output, never a CORE rescore.
 */
(function(root,factory){
 const api=factory(typeof module!=='undefined'&&module.exports?require('./weight-model.js'):root.YouthWeightModel);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYSupportIndexV1=api;
})(typeof window!=='undefined'?window:globalThis,function(Weight){'use strict';
const VERSION='1.0.0-priority-20261026';
const SIZES=Object.freeze([2,3,3,3,2,2,3,3,2,2]);
const NAMES=Object.freeze(['학대·보호','학교폭력·또래안전','정서·자해','학습·출결','행동·건강','장애·발달·접근성','가족·돌봄','경제·주거·기본생활','관계·지지','디지털·온라인']);
const WEIGHTS=Object.freeze([1.35,1.15,1.30,1.00,1.10,.95,1.15,1.10,.90,1.05]);
const PAIRS=Object.freeze([
 {a:2,b:6,boost:8,label:'정서·자해 × 가족·돌봄',meaning:'정서적 어려움과 돌봄 관련 어려움의 동시 보고'},
 {a:2,b:3,boost:6,label:'정서·자해 × 학습·출결',meaning:'정서적 어려움과 학교참여 저하의 동시 보고'},
 {a:7,b:6,boost:7,label:'경제·주거 × 가족·돌봄',meaning:'기본생활 어려움과 돌봄 부담의 중첩'},
 {a:1,b:2,boost:6,label:'학교폭력·또래안전 × 정서·자해',meaning:'또래 안전과 정서적 어려움의 동시 보고'},
 {a:9,b:2,boost:5,label:'디지털·온라인 × 정서·자해',meaning:'온라인 관련 어려움과 정서적 어려움의 동시 보고'},
 {a:4,b:3,boost:4,label:'행동·건강 × 학습·출결',meaning:'건강·행동과 학교참여 어려움의 중첩'}
]);
const SAFETY=Object.freeze([1,2,7,25]);
const CRITICAL=Object.freeze([1,2,4,5,7,12,13,16,19,20,25]);
const STEPS=Object.freeze([
 {name:'안정관찰',subtitle:'예방·관찰 중심',action:'일상적 지지와 정기적 경과 관찰'},
 {name:'초기주의',subtitle:'영역별 지원 시작',action:'핵심 영역의 직접지원과 단기 점검'},
 {name:'집중지원',subtitle:'학교 내부 통합지원',action:'학교·상담·교육복지 협력과 초기 사례조정'},
 {name:'고위기개입',subtitle:'학교·복지 병행',action:'안전 대응과 다기관 지원계획 병행'},
 {name:'최우선보호',subtitle:'보호 및 집중개입 우선',action:'안전·보호 절차를 우선 실행하고 집중 사례지원'}
]);
const clamp=x=>Math.max(0,Math.min(100,x));
const r1=x=>Math.round(clamp(x)*10)/10;
const valid=answers=>Array.isArray(answers)&&answers.length===25&&answers.every(v=>v==='unknown'||Number.isInteger(v)&&v>=0&&v<=4);
function score(raw,opts={}){
 const answers=raw?.answers||raw;
 if(!valid(answers))throw Error('SUPPORT_INDEX_INPUT_INVALID');
 const official=opts.official||null;
 const known=answers.filter(v=>typeof v==='number').length;
 const knownTotal=answers.reduce((s,x)=>s+(typeof x==='number'?x:0),0);
 if(official&&(official.knownTotal!==knownTotal||official.knownCount!==known))throw Error('SUPPORT_INDEX_CORE_MISMATCH');
 const complete=known===25;
 const domains=[];
 let k=0,weighted=0,weightedMax=0;const fullyReported=Array(25).fill(4);
 for(let i=0;i<10;i++){
  const values=answers.slice(k,k+SIZES[i]);k+=SIZES[i];
  const observed=values.reduce((s,v)=>s+(typeof v==='number'?v:0),0);
  const n=values.filter(v=>typeof v==='number').length;
  const weight=WEIGHTS[i];
  for(let j=k-SIZES[i];j<k;j++){
   const native=Weight?.itemWeight?Weight.itemWeight(answers,j):1;
   const maxNative=Weight?.itemWeight?Weight.itemWeight(fullyReported,j):1;
   if(typeof answers[j]==='number')weighted+=answers[j]*weight*native;
   weightedMax+=4*weight*maxNative;
  }
  domains.push({index:i,name:NAMES[i],raw:observed,maximum:SIZES[i]*4,unknown:SIZES[i]-n,known:n,weight,weighted:r1(observed*weight),strength:r1(observed/(SIZES[i]*4)*100),items:values.slice()});
 }
 const crossPairs=PAIRS.map(pair=>{
  const first=domains[pair.a].strength,second=domains[pair.b].strength;
  const strength=r1(Math.min(first,second));
  return {...pair,strength,contribution:r1(strength*pair.boost/100),active:first>0&&second>0};
 });
 const sumPairWeight=PAIRS.reduce((a,x)=>a+x.boost,0);
 const cross=r1(crossPairs.reduce((s,x)=>s+x.contribution,0)/sumPairWeight*100);
 const crit=CRITICAL.map(i=>({item:i,value:answers[i-1]})).filter(x=>typeof x.value==='number');
 const critical=r1((crit.length?Math.max(...crit.map(x=>x.value)):0)*25);
 const mainRaw=r1(knownTotal); // fixed 100-point maximum; no imputation of missing answers
 const weightedNormalized=r1(weighted/weightedMax*100);
 let narrative=null,narrativeTags=[];
 const ctx=opts.context;
 if(ctx&&ctx.hasContext){
  const signals=Array.isArray(ctx.signals)?ctx.signals:[];
  const active=signals.filter(x=>x&&['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party');
  narrativeTags=[...new Set(active.map(x=>x.tag).filter(Boolean))];
  if(narrativeTags.length)narrative=r1(Math.min(100,narrativeTags.length*18+Math.max(0,active.length-narrativeTags.length)*8));
 }
 const coeff={raw:.40,weighted:.25,cross:.20,critical:.10,narrative:narrative===null?0:.05};
 const base=(coeff.raw*mainRaw+coeff.weighted*weightedNormalized+coeff.cross*cross+coeff.critical*critical)/.95;
 const overall=r1(narrative===null?base:.95*base+.05*Math.max(base,narrative));
 let grade=Math.min(5,Math.floor(overall/20)+1);
 const safetyPositive=SAFETY.filter(i=>typeof answers[i-1]==='number'&&answers[i-1]>0);
 const maxSafety=safetyPositive.reduce((m,i)=>Math.max(m,answers[i-1]),0);
 const urgentBoolean=!!official?.urgent;
 const explicit=Array.isArray(raw?.explicit)&&raw.explicit.length>0;
 const directUrgent=explicit||SAFETY.some(i=>answers[i-1]>=3)||official?.pendingChecks?.length===0&&official?.checkItems?.some(i=>raw?.followups?.[String(i)]==='yes');
 let floor=1;
 if(maxSafety>0||urgentBoolean)floor=maxSafety>=3||directUrgent?5:maxSafety>=2?4:3;
 if(ctx?.needsSafetyAttention)floor=Math.max(floor,4);
 if(explicit)floor=5;
 grade=Math.max(grade,floor);
 const top=domains.filter(d=>d.raw>0).sort((a,b)=>b.strength-a.strength||b.raw-a.raw).slice(0,3);
 const step=STEPS[grade-1];
 const reasons=[...top.map(d=>d.name+' '+d.raw+'/'+d.maximum+'점'),...crossPairs.filter(x=>x.active&&x.strength>=25).sort((a,b)=>b.contribution-a.contribution).slice(0,2).map(x=>x.label)];
 const evidenceNote=complete?'완료된 25문항':'확인된 '+known+'/25문항 기반 최소 우선순위 · 미상 '+(25-known)+'문항 별도 표시';
 return Object.freeze({
  version:VERSION,coverage:{known,unknown:25-known,complete},official:{rawKnown:knownTotal,maximum:100,officialTitle:official?.title||'',urgent:urgentBoolean,safetyReview:official?.safetyReview||'',safetyUnknown:official?.safetyUnknown||[]},
  parts:{raw:mainRaw,weighted:weightedNormalized,cross,critical,narrative},coefficients:coeff,
  finalIndex:overall,grade,label:step.name,subtitle:step.subtitle,action:step.action,safetyFloor:floor,needsImmediateSafety:urgentBoolean||safetyPositive.length>0,
  explanation:reasons.length?reasons.join(' · '):'이번 응답에서 높게 보고된 영역 없음',
  evidenceNote,domains,crossPairs,criticalItems:crit.filter(x=>x.value>=2).sort((a,b)=>b.value-a.value),topDomains:top,
  assumptions:'기존 문항별 가중모델(v2.2)과 독립 영역 가중치를 결합한 개발용 지원순위이며, 예측확률·임상 절단점 또는 실증 타당도가 확보된 판정이 아님.'
 });
}
return Object.freeze({VERSION,SIZES,NAMES,WEIGHTS,PAIRS,SAFETY,CRITICAL,STEPS,score});
});
