/* OY-RALS model gateway: independent capability contracts, no rescoring. */
(function(root){
'use strict';
const NODE=typeof module!=='undefined'&&module.exports;
const requireModule=name=>NODE?require('./'+name+'.js'):null;
const G=NODE?{
 YouthCriteria:requireModule('criteria'),
 YouthWeightModel:requireModule('weight-model'),
 YouthMap:requireModule('support-model'),
 YouthPlanning:requireModule('planning-model'),
 YouthCaseContextCore:requireModule('case-context-core'),
 YouthContextV81:requireModule('case-context-v81'),
 OYCIESemanticV2:requireModule('cie-semantic-layer-v2'),
 OYJourney:requireModule('journey-model-v88'),
 OYRelations:requireModule('relations-v88')
}:root;
const VERSION='9.0.0-contract-20261026';
const CONTRACTS=Object.freeze([
 {id:'CORE',module:'YouthCriteria',method:'evaluate',role:'평가·안전판정',implementation:'native'},
 {id:'ICSI',module:'OYCIESemanticV2',method:'interpretItemScore',role:'문항별·교차점수 해석',implementation:'shared'},
 {id:'NCB',module:'YouthCaseContextCore',method:'reconcile',role:'서술형 맥락 연결',implementation:'native'},
 {id:'OY-CIE',module:'OYCIESemanticV2',method:'formulate',role:'통합 근거·맥락 추론',implementation:'shared'},
 {id:'K-CARR',module:'OYJourney',method:'text',role:'한국어 사례응답',implementation:'embedded'},
 {id:'ICMS',module:'YouthPlanning',method:'analyze',role:'개입·서비스계획',implementation:'embedded'},
 {id:'Relations',module:'OYRelations',method:'svg',role:'가계도·생태도',implementation:'native'}
]);
function status(){
 return CONTRACTS.map(item=>{
  const target=G[item.module];
  const loaded=!!target&&typeof target[item.method]==='function';
  return Object.freeze({...item,loaded,version:target&&typeof target.VERSION==='string'?target.VERSION:null});
 });
}
function inspect(p,a){
 const errors=[];
 if(!G.YouthMap||!G.YouthMap.validate(p))errors.push('INPUT_INVALID');
 if(!a||!a.decision)errors.push('DECISION_MISSING');
 const answers=Array.isArray(p?.answers)?p.answers:[];
 const known=answers.filter(x=>Number.isInteger(x));
 const raw=known.reduce((acc,v)=>acc+v,0);
 const missing=answers.filter(x=>x==='unknown').length;
 if(a?.decision){
  if(a.decision.knownTotal!==raw)errors.push('RAW_SCORE_MISMATCH');
  if(a.decision.knownCount!==known.length)errors.push('KNOWN_COUNT_MISMATCH');
  if((a.decision.unknownItems||[]).length!==missing)errors.push('UNKNOWN_COUNT_MISMATCH');
  if(Boolean(a.decision.incomplete)!==(missing>0))errors.push('INCOMPLETE_FLAG_MISMATCH');
 }
 if(!Array.isArray(a?.sections)||a.sections.length<8)errors.push('ASSESSMENT_SECTIONS_MISSING');
 if(!Array.isArray(a?.plans))errors.push('PLAN_LIST_MISSING');
 if(Array.isArray(a?.plans)&&a.plans.some(x=>!x.narrativeOnly&&x.sourceItemIds?.length===0))errors.push('PLAN_WITHOUT_ITEM_EVIDENCE');
 return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),rawKnownTotal:raw,knownCount:known.length,unknownCount:missing});
}
function analyze(p){
 if(!G.YouthMap?.validate(p))throw Error('MODEL_INPUT_INVALID');
 if(!G.OYJourney?.analyze)throw Error('MODEL_ANALYSIS_UNAVAILABLE');
 const answers=p.answers.slice();
 const analyzed=G.OYJourney.analyze(p);
 if(answers.length!==p.answers.length||answers.some((v,i)=>v!==p.answers[i]))throw Error('CORE_INPUT_MUTATED');
 const audit=inspect(p,analyzed);
 if(!audit.ok)throw Error('MODEL_CONTRACT_FAILED:'+audit.errors.join(','));
 return {...analyzed,modelTrace:{gateway:VERSION,contracts:status(),audit}};
}
const api=Object.freeze({VERSION,CONTRACTS,status,inspect,analyze});
if(NODE)module.exports=api;else root.OYModelGateway=api;
})(typeof window!=='undefined'?window:globalThis);
