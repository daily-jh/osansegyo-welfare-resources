(function(root){'use strict';
/**
 * OY-RALS v2.2.0 CONTEXTUAL EVIDENCE PRIORITY WEIGHTS — development assumptions.
 * NOT validated risk odds, screening cutoffs, probabilities, independent diagnoses,
 * statutory-reporting thresholds, or a replacement for criteria.evaluate().
 * Raw score remains 25 questions * 0..4 = 0..100. Unknown is never treated as 0.
 */
const VERSION='2.2.0-contextual-20261024';
const BASE_WEIGHTS=Object.freeze([1.30,1.20,1.12,1.18,1.10,1.02,1.35,1.05,1.00,0.98,0.96,1.12,1.18,1.00,1.03,1.12,1.01,1.09,1.14,1.11,1.06,0.98,1.06,0.97,1.32]);
const PAIRS=Object.freeze([
  {id:'peer_attend',item:3,other:9,factor:1.05,note:'또래 피해와 수업참여가 함께 보고됨'},
  {id:'coercion_attend',item:4,other:9,factor:1.08,note:'강요·협박과 수업참여가 함께 보고됨'},
  {id:'selfharm_emotion',item:7,other:6,factor:1.04,note:'자해 신호와 정서 어려움의 동시응답'},
  {id:'access_learning',item:14,other:10,factor:1.06,note:'교육환경 조정 필요와 학습 어려움'},
  {id:'carer_attend',item:18,other:9,factor:1.04,note:'가족돌봄 부담과 학교참여 문제'},
  {id:'housing_attend',item:20,other:9,factor:1.04,note:'주거 불안정과 학교참여 문제'},
  {id:'basic_attend',item:19,other:9,factor:1.04,note:'기본생활 결핍과 학교참여 문제'},
  {id:'online_peer',item:25,other:3,factor:1.04,note:'성착취 위험과 또래피해 동시응답'}
]);
const GROUPS=Object.freeze([2,3,3,3,2,2,3,3,2,2]);
const ROUND=x=>Math.round(x*10000)/10000;
function validate(answers){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25 responses required: integer 0..4 or unknown');
}
function itemWeight(answers,index){
 validate(answers);
 if(!Number.isInteger(index)||index<0||index>=25)throw Error('item index outside 0..24');
 let boost=1;
 for(const p of PAIRS)if(p.item===index+1&&answers[p.item-1]>0&&answers[p.other-1]>0)boost*=p.factor;
 return ROUND(Math.min(BASE_WEIGHTS[index]*1.12,BASE_WEIGHTS[index]*boost));
}
function domainStrength(answers,index){
 validate(answers);
 if(!Number.isInteger(index)||index<0||index>=GROUPS.length)throw Error('domain index outside 0..9');
 const from=GROUPS.slice(0,index).reduce((s,x)=>s+x,0);
 let weighted=0,denominator=0,known=0;
 for(let k=from;k<from+GROUPS[index];k++){
  const v=answers[k];
  if(typeof v!=='number')continue;
  const w=itemWeight(answers,k);
  weighted+=w*v;denominator+=w;known++;
 }
 return {mean:known?ROUND(weighted/denominator):null,known,unknown:GROUPS[index]-known};
}
function audit(answers){
 validate(answers);
 const weights=answers.map((_,i)=>itemWeight(answers,i));
 const known=answers.filter(v=>typeof v==='number');
 const contributions=answers.map((v,i)=>typeof v==='number'?ROUND(v/4*weights[i]):null);
 const sum=known.reduce((acc,v)=>acc+v,0);
 return {version:VERSION,rawKnownTotal:sum,knownCount:known.length,incomplete:known.length!==25,weights,contributions,domains:GROUPS.map((_,i)=>domainStrength(answers,i)),warning:'개발 가정 보조지표이며 진단·위험확률·최종 판정 기준이 아님'};
}
const api=Object.freeze({VERSION,BASE_WEIGHTS,PAIRS,GROUPS,validate,itemWeight,domainStrength,audit});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthWeightModel=api;
})(typeof window!=='undefined'?window:globalThis);
