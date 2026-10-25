/* OY-RALS V8.6 | local-only joint case formulation: CORE + ICSI + K-CARR + ICMS. */
(function(root,factory){const node=typeof module!=='undefined'&&module.exports,E=node?require('./evidence-v86.js'):root.OYEvidenceV86,A=node?require('./item-action-router-v86.js'):root.OYActionRouterV86,R=node?require('./reconciliation-v86.js'):root.OYReconcileV86,S=node?require('./safety-state-v87.js'):root.OYSafetyStateV87,G=node?require('./goal-composer-v87.js'):root.OYGoalComposerV87;const api=factory(E,A,R,S,G);if(node)module.exports=api;else root.OYUnifiedV86=api;})(typeof window!=='undefined'?window:globalThis,function(E,A,R,S,G){'use strict';
const VERSION='8.6.0'; const groupSizes=[2,3,3,3,2,2,3,3,2,2];
function validate(p){if(!p||!Array.isArray(p.answers)||p.answers.length!==25||p.answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('원본 CORE 25개 응답을 0~4/unknown으로 입력해야 합니다');}
function ownScore(p,opts){const fn=opts.officialCORE||opts.criteria?.evaluate||(typeof window!=='undefined'&&window.YouthCriteria?.evaluate);if(opts.officialDecision)return {value:opts.officialDecision,source:'caller-provided-official-decision'};if(fn)return {value:fn(p.answers,groupSizes,!!p.explicit?.length,p.followups||{}),source:'official-CORE-adapter'};return {value:null,source:'unattached: official CORE input or evaluate function required'};}
function getNote(p){return typeof p.caseContext==='string'?p.caseContext:typeof p.caseContext?.text==='string'?p.caseContext.text:'';}
// Standalone compatibility for older cached page loaders; separate V8.7 modules take precedence.
function fallbackCompose(goals){
 const buckets=[[1,2],[7],[25],[3,4,5],[6,8,12,13],[9,10,11,14,15],[16,17,18],[19,21],[20],[22,23],[24]];
 const indexed=n=>buckets.findIndex(a=>a.includes(n));
 const groups=new Map();for(const g of goals){let key=indexed(g.item);if(key<0)key='extra-'+g.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(g)}
 const out=[...groups].map(([group,items])=>{items.sort((a,b)=>a.priority-b.priority||(b.score||0)-(a.score||0));
 const k=items[0],uniq=a=>[...new Set(a.filter(Boolean))];return {
 id:'C87-'+String(group),concept:k.concept+(items.length>1?' 외 '+(items.length-1)+'개 문항 확인':''),priority:k.priority,score:k.score||0,item:k.item,sourceNumbers:uniq(items.map(x=>x.item)),sourceGoalIds:uniq(items.map(x=>x.id)),evidenceIds:uniq(items.flatMap(x=>x.evidenceIds||[])),goal:'문항별 근거·학생 의견을 확인하여 조정 사항을 협의함',action:k.action,teacher:k.teacher,worker:k.worker,verification:k.verification,actionDetails:items.map(x=>({id:x.id,item:x.item,concept:x.concept,action:x.action,teacher:x.teacher,worker:x.worker,verification:x.verification})),scope:'V8.7 grouped verification',reviewPending:true,completed:false};
 }).sort((a,b)=>a.priority-b.priority||b.score-a.score);
 const sourceGoalIds=[...new Set(out.flatMap(g=>g.sourceGoalIds))];
 return {goals:out,shown:out.slice(0,5),deferred:out.slice(5),primaryGoalIds:out.slice(0,5).map(x=>x.id),allGoalIds:out.map(x=>x.id),sourceGoalIds,sourceFullyCovered:goals.every(x=>sourceGoalIds.includes(x.id)),sourceCount:goals.length,version:'8.7.0-compatibility'};
}

function build(payload,opts={}){
 validate(payload);const role=opts.role||'social-worker';if(!['teacher','social-worker','education-welfare'].includes(role))throw Error('role must be teacher, education-welfare or social-worker');
 const raw=getNote(payload),ex=E.extract(raw),core=ownScore(payload,opts);const reconcile=R.reconcile(payload.answers,ex.evidence);const route=A.route(payload.answers,{evidence:ex.evidence,hasNarrative:!!raw.trim(),visibleLimit:opts.visibleLimit||6});
 const credible=ex.evidence.filter(e=>e.polarity==='affirmed'),uncertain=ex.evidence.filter(e=>e.polarity==='uncertain');
 const uncertaintySafety=uncertain.filter(e=>['family_harm','self_harm','peer_harm','online_coercion'].includes(e.kind));
 if(uncertaintySafety.length&&!route.goals.some(g=>g.priority===0)){const g={id:'NARRATIVE-SAFETY-UNCERTAIN',item:null,domain:'safety',concept:'안전 관련 제보·소문·신고 사실관계 미확인',priority:0,score:null,scope:'uncertain-review-not-affirmed',goal:'학생을 안전하게 면담하여 정보 출처·현재 위해와 관련 절차를 확인',action:'전언·신고와 직접 피해 진술을 구별하고 학생의 현재 안전·안전한 연락 경로·실제 보호조치 여부를 확인함. 불확실한 정보를 피해 사실로 확정하지 않음.',teacher:'교내 보호담당과 관련 안전 사실 확인 및 신고의무 대응 여부 검토',worker:'학생에게 안전한 정보 확인과 전문기관 후속 조치 필요 여부 협의',verification:'정보 출처·실제 안전 확인 여부·담당·일자 기록',evidenceIds:uncertaintySafety.map(e=>e.id),reviewPending:true,completed:false};route.goals.unshift(g);route.shown=route.goals.slice(0,opts.visibleLimit||6);route.deferred=route.goals.slice(opts.visibleLimit||6);route.highGoalIds.unshift(g.id);}
 const safetyOriginal=!!core.value?.urgent, narrativeSafety=route.safetyNarrativeIds.length>0;
 const known=payload.answers.filter(v=>typeof v==='number').length,knownSum=payload.answers.reduce((a,v)=>a+(Number.isInteger(v)?v:0),0);
 const items=payload.answers.map((v,i)=>({number:i+1,score:v,concept:A.D[i].concept,evidenceIds:credible.filter(e=>(e.linked_items||[]).includes(i+1)).map(e=>e.id),status:v==='unknown'?'unknown':v===0?'no_difficulty_reported_this_response':'reported_scored'}));
 const facts=[];if(ex.profile.grade)facts.push({id:'F-grade',type:'profile',text:'중학교 '+ex.profile.grade+'학년',confidence:'user_reported',evidenceIds:ex.evidence.filter(e=>e.kind==='grade').map(e=>e.id)});
 if(ex.profile.gender)facts.push({id:'F-gender',type:'profile',text:ex.profile.gender,confidence:'user_reported',evidenceIds:ex.evidence.filter(e=>e.kind==='gender').map(e=>e.id)});
 if(ex.profile.household)facts.push({id:'F-household',type:'family',text:ex.profile.household+'이라는 가족 형태 보고',confidence:'user_reported',evidenceIds:ex.evidence.filter(e=>e.kind==='family_form').map(e=>e.id)});
 for(const x of ex.people)facts.push({id:'F-'+x.id,type:'family',text:x.relation+(x.adult?'(성인 언급)':'')+' 관계 언급·동거 미확인',confidence:'user_reported',evidenceIds:x.evidence_ids});
 for(const x of ex.strengths)facts.push({id:'F-'+x.id,type:'strength',text:x.name+'에 관심·희망이 보고됨',confidence:'user_reported',evidenceIds:x.evidence_ids});
 for(const x of ex.existingServices)facts.push({id:'F-'+x.id,type:'service',text:(x.agency||'기관 미확인')+(x.program?' · '+x.program:'')+' ('+(x.status==='reported_active_unverified'?'참여 보고·실제 제공 미확인':x.status==='reported_ended_unverified'?'종료 보고':'신청/대기 보고')+')',confidence:'user_reported',evidenceIds:x.evidence_ids});
 const exposed=new Set(['housing_arrears','housing_concern','meal_gap','economic','learning','attendance','peer_harm','peer_conflict','family_conflict','care_burden','mood','family_harm','self_harm','online_coercion','school_access','parent_work']);for(const x of credible){if(!exposed.has(x.kind))continue;facts.push({id:'F-'+x.id,type:'life_event',text:x.label+': '+x.excerpt,confidence:'user_reported_unverified',evidenceIds:[x.id]});}
 const uniqueFacts=facts.filter((v,i,a)=>!a.slice(0,i).some(x=>x.text===v.text));
 const disclosed=credible.filter(e=>['family_harm','self_harm','peer_harm','online_coercion'].includes(e.kind));
 const evidenceIds=disclosed.map(e=>e.id),uncertainIds=uncertaintySafety.map(e=>e.id);
 const safetyState=S?.build?S.build(payload.answers,core.value,evidenceIds,uncertainIds):{
 version:'8.7.0-compatibility',officialCORE:safetyOriginal,narrativeReported:narrativeSafety,
 reportedEvidenceIds:evidenceIds,uncertainNarrativeIds:uncertainIds,
 unknownSafetyItems:[1,2,7,25].filter(n=>payload.answers[n-1]==='unknown'),
 pendingFollowupItems:core.value?.pendingChecks||[],
 reviewRequired:safetyOriginal||narrativeSafety||uncertainIds.length>0||[1,2,7,25].some(n=>payload.answers[n-1]==='unknown')||(core.value?.pendingChecks?.length||0)>0,
 officialDecisionUnchanged:true};
 const safety={...safetyState,reviewPending:safetyState.reviewRequired&&!safetyOriginal&&!narrativeSafety,method:'현재 안전을 실무자가 직접 확인하며 공식 CORE의 점수·판정은 변경하지 않음'};
 const grouped=G?.build?G.build(route.goals,{limit:5}):fallbackCompose(route.goals);
 const goalIds=route.goals.map(g=>g.id);const primary=route.shown.map(g=>g.concept);
 let assessment={situation:uniqueFacts.map(f=>f.text).slice(0,14),strengths:uniqueFacts.filter(x=>x.type==='strength').map(x=>x.text),existingSupport:uniqueFacts.filter(x=>x.type==='service').map(x=>x.text),observations:raw.trim()?reconcile.issues.slice(0,7).map(x=>x.question):['서술형 정보 없이 척도 응답의 직접 근거를 우선 확인합니다.'],judgement:route.goals.length?'우선 확인·협의할 사항은 '+primary.slice(0,3).join(' / ')+'입니다. 각 과제는 입력된 척도 또는 보고된 생활장면을 근거로 하는 검토안이며 학생이 바라는 변화와 실제 기준선을 면담에서 결정합니다.':'현재 점수와 입력 서술에서 개별 지원 필요를 확정하기 어렵습니다. 학생의 바람·강점·최근 생활을 확인하고 관찰을 이어갑니다.',causalHypotheses:[],disclaimer:'보고된 정보와 확인된 사실을 구분합니다. 인과관계·학대 판정·진단·자격·서비스 신청 및 제공을 임의 확정하지 않습니다.'};
 if(credible.some(x=>x.kind==='parent_work')&&credible.some(x=>x.kind==='meal_gap'))assessment.causalHypotheses.push('보호자 근로 여건과 식사 공백의 시간적 관계는 가설입니다. 요일·돌봄 경로와 실제 지원을 확인해야 합니다.');
 if(credible.some(x=>x.kind==='peer_conflict')&&credible.some(x=>x.kind==='learning'))assessment.causalHypotheses.push('관계 위축과 학습의 어려움이 함께 보고되더라도 원인·선후관계는 별도 확인이 필요합니다.');
 if(!raw.trim())assessment.situation=[];
 const state={schema:'OY-RALS.CaseState.V8.6',version:VERSION,core:{source:core.source,officialDecision:core.value,originalAnswers:payload.answers.slice(),unchanged:true,knownScore:knownSum,knownCount:known,maximum:100,hasUnknown:known!==25},ICSI:{domainSizes:groupSizes,items,overlaps:reconcile.issues,scoreModification:false},'K-CARR':{evidence:ex.evidence,profile:ex.profile,family:ex.people,strengths:ex.strengths,existingServices:ex.existingServices,facts:uniqueFacts,formulation:assessment,safety},ICMS:{goals:route.goals,shown:route.shown,deferred:route.deferred,goalIds,composed:grouped,primaryGoalIds:grouped.primaryGoalIds,role,reviewNeeded:true,approved:false,conferenceHeld:false,serviceProvided:false},safety,uncertainties:reconcile.issues,privacy:{localOnly:true,noNetwork:true,persisted:false,PIIInPublicRepository:false},limits:{syntheticNotRealValidation:true,requiresQualifiedReview:true,notForDiagnosis:true,notForSuicidePrediction:true,notForEligibilityDecision:true},source:{narrativePresent:!!raw.trim(),length:raw.length},meta:{architectures:['CORE','ICSI V8.6','K-CARR V8.6','ICMS V8.6'],role,patternCorpusUsedForTruth:false}};
 return {...state,models:state.meta.architectures,goalIds,documents:documents(state)};
}
function documents(state){const cs=state['K-CARR'],cm=state.ICMS,screen=cm.composed?.shown||cm.shown,goals=cm.goals,head='현장 실무자 검토용 초안 · 사실관계/동의/결정/제공 여부 별도 확인';
 const base={version:VERSION,sourceFacts:cs.facts.map(f=>f.id),goalIds:cm.goalIds};
 const primary=screen.map(g=>({id:g.id,score:g.score,concept:g.concept,goal:g.goal,firstAction:g.action,teacher:g.teacher,worker:g.worker,verification:g.verification,evidenceIds:g.evidenceIds,sourceGoalIds:g.sourceGoalIds||[g.id],actionDetails:g.actionDetails||[],scope:g.scope}));
 const common={title:'종합사정',note:head,assessment:cs.formulation,safety:state.safety,conflicts:state.uncertainties,proposedGoals:primary,deferredCount:cm.deferred.length,...base};
 const plan={title:'서비스계획서(협의 전)',note:head,goals:primary,deferredGoals:cm.deferred.map(g=>({id:g.id,concept:g.concept,scope:g.scope})),firstAction:screen[0]?.action||'학생 면담으로 실제 어려움·희망 확인',targetConfirmed:false,role:cm.role,...base};
 const conference={title:'사례회의 검토안',note:head,agenda:primary.map(g=>({id:g.id,issue:g.concept,decisionRequired:'채택·수정·보류와 담당·첫 점검일 협의',evidenceIds:g.evidenceIds})),decisions:[],meetingHeld:false,...base};
 const intake={title:'초기상담지(보고 사실 중심)',note:head,student:cs.profile,family:cs.family,strengths:cs.strengths,services:cs.existingServices,reportedFacts:cs.facts,unknown:state.uncertainties,clientConsent:'미확인',...base};
 const needs={title:'10영역 욕구사정표(초안)',note:head,domains:state.ICSI.domainSizes.map((size,di)=>({domain:di+1,itemNumbers:state.ICSI.items.filter(x=>[0,2,5,8,11,13,15,18,21,23][di]<x.number&&x.number<=[2,5,8,11,13,15,18,21,23,25][di]).map(x=>x.number),rawScore:state.ICSI.items.filter(x=>x.number>[0,2,5,8,11,13,15,18,21,23][di]&&x.number<=[2,5,8,11,13,15,18,21,23,25][di]).reduce((a,x)=>a+(Number.isInteger(x.score)?x.score:0),0),unknownCount:state.ICSI.items.filter(x=>x.number>[0,2,5,8,11,13,15,18,21,23][di]&&x.number<=[2,5,8,11,13,15,18,21,23,25][di]&&x.score==='unknown').length,goals:goals.filter(g=>xDomain(g.item)===di).map(g=>g.id),assessment:'척도 응답·서술 원문 근거 확인 전'})),scoreMeaning:'평가한 문항만 합계. 미상은 0으로 보지 않음',...base};
 return {review:common,plan,conference,intake,needs};
}
const starts=[1,3,6,9,12,14,16,19,22,24],ends=[2,5,8,11,13,15,18,21,23,25];function xDomain(n){if(!n)return -1;return starts.findIndex((a,i)=>n>=a&&n<=ends[i]);}
function html(state,type='review'){
 const e=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));const d=state.documents[type];if(!d)throw Error('review/plan/conference/intake/needs');let lines=[`<article class="OY-V86"><h1>${e(d.title)}</h1><p>${e(d.note)}</p>`];
 if(type==='review'){lines.push('<h2>사례 사실 및 강점</h2><ul>'+state['K-CARR'].facts.map(f=>'<li>'+e(f.text)+'</li>').join('')+'</ul><h2>잠정 사정</h2><p>'+e(d.assessment.judgement)+'</p>');}
 if(type==='review'||type==='plan')lines.push('<h2>근거 기반 개입 초안</h2>'+ (d.proposedGoals||d.goals).map(g=>`<section><h3>${e(g.id+' '+g.concept)}</h3><p>확인: ${e(g.firstAction)}</p><p>교사: ${e(g.teacher)}</p><p>복지사: ${e(g.worker)}</p><p>점검: ${e(g.verification)}</p><p>근거: ${e(g.evidenceIds.join(','))||'척도 응답만 있음 · 원문 미확인'}</p></section>`).join(''));
 if(type==='conference')lines.push('<h2>실제 결정이 필요한 안건</h2><ul>'+d.agenda.map(g=>'<li>'+e(g.id+' '+g.issue+' — '+g.decisionRequired)+'</li>').join('')+'</ul>');
 if(type==='intake')lines.push('<h2>입력 서술에서 추출한 가족·강점·지원</h2><ul>'+d.reportedFacts.map(f=>'<li>'+e(f.text)+'</li>').join('')+'</ul>');
 if(type==='needs')lines.push('<h2>영역별 사정 근거</h2><ul>'+d.domains.map(g=>'<li>'+e(g.domain+'영역 / 문항 '+g.itemNumbers.join(',')+' / 알려진 응답합계 '+g.rawScore+(g.unknownCount?' / 미상 '+g.unknownCount+'개 · 평균/판정 보류':'')+' / 목표 '+g.goals.join(','))+'</li>').join('')+'</ul>');
 return lines.join('')+'</article>';
}
return Object.freeze({VERSION,build,documents,html,validate});});