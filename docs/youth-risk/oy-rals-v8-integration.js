/* K-CARR V8.0 additive adapter for OY-RALS case review, not automatic deployment.
 * Keep original CORE scoring, route and service-map unmodified.
 */
(function(root,factory){'use strict';const node=typeof module!=='undefined'&&module.exports;const K=node?require('./k-carr-narrative-v8.js'):root.KCarrNarrativeV8;const api=factory(K);if(node)module.exports=api;else root.OYRALSCaseResponseV8=api;})(typeof window!=='undefined'?window:globalThis,function(K){'use strict';
const SIZES=[2,3,3,3,2,2,3,3,2,2];
function context(p){return typeof p?.caseContext==='string'?p.caseContext:typeof p?.caseContext?.text==='string'?p.caseContext.text:'';}
function officialTotal(core){return core?.incomplete?null:Number.isFinite(core?.knownTotal)?core.knownTotal:Number.isFinite(core?.rawScore)?core.rawScore:null;}
function build(payload,opts={}){
 if(!payload||!Array.isArray(payload.answers)||payload.answers.length!==25)throw Error('원본 25문항 응답 자료 필요');
 const role=opts.role||'social-worker',written=context(payload);
 if(!written.trim())return {active:false,code:'K-CARR',version:'8.0.0',message:'서술 미입력: 기존 CORE/ICSI/ICMS 결과 유지'};
 const official=opts.core||null; // supplied by official criteria.js; NEVER recompute/override.
 const model=K.assess({caseContext:written,role,officialScore:officialTotal(official)});
 return {active:true,model,coreReference:official,panels:{
  evaluation:{title:'핵심 상황·우선 판단',situation:model.summary.studentSituation,judgment:model.summary.centralJudgment,firstAction:model.summary.firstAction,relationships:model.causalLinks},
  integratedReview:{title:'종합 사정과 개입 방향',caseFormulation:model.caseFormulation,firstAction:model.executionPlan?.[0],questions:model.nextQuestions},
  caseConference:{title:'사례협의 실행계획(안)',tasks:model.executionPlan,serviceStatus:'제안·미실행',notMeetingDecision:true},
  optionalRecord:{title:'근거·점수 대조',collapsed:true,record:model.evidence}
 },safeContactReview:model.needsCaregiverContactSafetyReview,viewContract:{
  keepExistingDomainGraph:true, itemScoresCollapsed:true,showNarrativeFactsByDefault:false,
  focusOnHumanReview:true, supportMapHandledByExistingModule:true,
  separateTeacherAndWorkerTasks:true, neverAutoConfirmServices:true,
  outputUsedForReporting:'draft-only', retainExistingDocumentDownload:true
 },meta:{source:'local-rule-based',dataCount:54000,recordsType:'synthetic',empiricallyValidated:false}};
}
function renderSections(doc, result){ // optional minimal safe renderer for a detached sandbox node
 const d=doc||document;const r=result;const frag=d.createDocumentFragment();
 const block=(tag,text,className)=>{const n=d.createElement(tag);n.textContent=text;if(className)n.className=className;frag.append(n);return n;};
 if(!r.active){block('p',r.message);return frag;}
 block('h3','학생 상황 한눈에 보기');block('p',r.model.situationOverview);
 block('h3','이 사례의 핵심 판단');block('p',r.model.integratedJudgment);
 block('h3','우선 실행(실무자 검토 전)');
 for(const t of r.model.executionPlan){const sec=d.createElement('section');const h=d.createElement('h4');h.textContent=t.order+'. '+t.goal;const desc=d.createElement('p');desc.textContent=t.action;const meta=d.createElement('p');meta.textContent='담당(안): '+t.owner+' / 시점: '+t.when+' / 확인: '+t.completion+' / 실제 이행: 미확인';sec.append(h,desc,meta);frag.append(sec);}
 const details=d.createElement('details');const sum=d.createElement('summary');sum.textContent='근거 문장·추가 질문 (접기/펼치기)';details.append(sum);for(const e of r.model.evidence){const p=d.createElement('p');p.textContent=e.id+' ['+e.status+'] '+e.text;details.append(p)}for(const q of r.model.nextQuestions){const p=d.createElement('p');p.textContent='추가 확인: '+q;details.append(p)}frag.append(details);
 block('p','이 결과는 사례회의 결정·신고처리·진단·지원 승인·서비스 실제 제공을 증명하지 않습니다.');return frag;
}
return Object.freeze({version:'8.0.0',context,officialTotal,build,renderSections,SIZES});
});
