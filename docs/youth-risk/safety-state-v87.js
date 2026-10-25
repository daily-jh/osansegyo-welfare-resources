/* V8.7 consistent safety status; official CORE remains authoritative. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYSafetyStateV87=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
function build(answers,core,reported=[],uncertain=[]){
 if(!Array.isArray(answers)||answers.length!==25)throw Error('25-item answers required');
 const missing=[1,2,7,25].filter(n=>answers[n-1]==='unknown');
 const pending=Array.isArray(core?.pendingChecks)?core.pendingChecks.slice():[];
 const urgent=!!core?.urgent,observed=reported.length>0,unresolved=uncertain.length>0;
 const reviewRequired=urgent||observed||unresolved||missing.length>0||pending.length>0;
 return {version:'8.7.0',officialCORE:urgent,narrativeReported:observed,reportedEvidenceIds:reported.slice(),uncertainNarrativeIds:uncertain.slice(),unknownSafetyItems:missing,pendingFollowupItems:pending,reviewRequired,reviewPending:reviewRequired&&!urgent&&!observed,officialDecisionUnchanged:true,status:urgent||observed?'우선 안전확인 및 보호절차 검토':reviewRequired?'안전확인 미완료 · 판단 보류':'이번 응답에서 확인된 긴급신호 없음 · 현재 안전 별도 확인'};
}
return Object.freeze({VERSION:'8.7.0',build});
});