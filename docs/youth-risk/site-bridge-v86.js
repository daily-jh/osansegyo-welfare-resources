/* OY-RALS V8.6 optional additive adapter for the existing YouthFormulation API.
 * Does NOT overwrite YouthCriteria, official score, alerts or originals.
 * Recommended to run only after site regression and UAT on a test branch.
 */
(function(root,factory){'use strict';const node=typeof module!=='undefined'&&module.exports;const U=node?require('./unified-v86.js'):root.OYUnifiedV86;const api=factory(U);if(node)module.exports=api;else root.OYSiteBridgeV86=api;})(typeof window!=='undefined'?window:globalThis,function(U){'use strict';
function apply(base,p,options={}){
 if(!U||!p||!Array.isArray(p.answers)||p.answers.length!==25)return base;
 const role=options.role||'social-worker';
 // The original CORE decision object remains the only official scoring result.
 const state=U.build(p,{role,officialDecision:base.decision,visibleLimit:Math.max(1,options.visibleLimit||6)});
 const cs=state['K-CARR'],goals=state.ICMS.composed?.goals||state.ICMS.goals;
 const domainSizes=[2,3,3,3,2,2,3,3,2,2];
 const domainOf=item=>{const n=Number(item);if(!Number.isInteger(n)||n<1||n>25)return [];let start=0;for(let i=0;i<domainSizes.length;i++){start+=domainSizes[i];if(n<=start)return [i];}return []};
 const rows=goals.map((g,index)=>({
  id:'v87-'+g.id,canonicalId:g.id,title:g.concept,domains:[...new Set((g.sourceNumbers||[g.item]).flatMap(domainOf))],goal:g.goal,action:g.action,teacher:g.teacher,worker:g.worker,
  measure:g.verification,when:g.priority===0?'현 안전확인 우선 · 시점 협의':'첫 면담 시점·첫 점검일 실무자 협의',meaning:'문항 '+(g.item??'서술')+'의 별도 개념과 원문 단서를 확인하여 담당별 실행 행동을 정함.',
  sourceGoals:g.sourceGoalIds|| (g.item?['Q'+String(g.item).padStart(2,'0')]:[]),sourceEvidence:g.evidenceIds||[],actionDetails:g.actionDetails||[],positive:(g.sourceNumbers|| (g.item&&g.score>0?[g.item]:[])),
  unknown:[],peak:g.score||0,safety:g.priority===0,selected:true,rank:goals.length-index,
  status:'협의 전 초안',baseline:'빈도·학생 희망·기존 지원 및 담당자 미확인',references:[]
 }));
 const info=cs.formulation;
 const extra=(base.evidence82?.interests||[]).map(x=>x.label).filter(Boolean);
 const strengths=[...new Set([...(info.strengths||[]),...extra.map(x=>x+'에 대한 관심이 보고됨')])];
 const services=[...new Set([...(info.existingSupport||[]),...(base.evidence82?.services||[]).map(x=>x.text).filter(Boolean)])];
 const sections=[
  {title:'보고된 사실과 학생의 상황',text:info.situation.length?info.situation.join('. '):'서술형 정보 없음. 문항별 응답 근거를 학생과 확인해야 합니다.'},
  ...(state.safety.reviewPending?[{title:'현재 안전확인 미완료',text:state.safety.status+' · 미상 안전문항 '+state.safety.unknownSafetyItems.join('·')+'번과 추가 확인 항목을 실무자가 직접 확인합니다.'}]:[]),
  {title:'척도와 서술의 차이·대체 설명',text:state.uncertainties.length?state.uncertainties.slice(0,5).map(x=>x.question).join(' '):'현재 입력 범위에서 점수·서술의 직접적인 상충을 자동 확인하지 못했습니다. 이는 사실 확인이 완료됐다는 의미가 아닙니다.'},
  {title:'강점과 기존 지원',text:[...strengths,...services].join(' ')||'아직 구체적으로 확인된 강점·이용 중 서비스가 없습니다. 학생의 선택과 실제 지원 이용을 면담에서 확인합니다.'},
  ...(info.causalHypotheses.length?[{title:'문제 간 관계 가설',text:info.causalHypotheses.join(' ')}]:[])
 ];
 const primaryRows=rows.slice(0,5),lead=primaryRows,others=rows.slice(5),actualSafety=state.safety.officialCORE||state.safety.narrativeReported;
 return {...base,version:'8.7-integrated',source:'CORE unchanged / V8.7 SafetyState GoalComposer + V8.6 ICSI K-CARR ICMS',
  sections82:sections,paragraphs:sections.map(x=>x.text),judgement:info.judgement,understanding:info.judgement,
  first:rows[0]?.action||(state.safety.reviewPending?'안전 관련 미상·추가확인 문항의 현재 상황과 안전한 연락 경로를 먼저 확인합니다.':'학생이 원하는 변화와 생활상의 실제 어려움을 첫 면담에서 확인합니다.'),
  rows:primaryRows,allRows:rows,lead,others,strengths,pending:state.uncertainties.map(x=>x.question),
  safety:actualSafety,safetyReviewRequired:state.safety.reviewRequired,safetyState87:state.safety,
  canonical86:state, v8:{...(base.v8||{}),version:'8.6',narrativeSafety:state.safety.narrativeReported,questions:state.uncertainties.map(x=>x.question)}
 };
}
return Object.freeze({VERSION:'8.6.0',apply});});