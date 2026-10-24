/* V8.1 presentation bridge. CORE and resource routing are immutable. */
(function(root){'use strict';const node=typeof module!=='undefined'&&module.exports,I=node?require('./oy-rals-v8-integration.js'):root.OYRALSCaseResponseV8;
const stages={'현재 안전·보호':['protect',[0,2,1,9]],'안전한 소통·연락':['contact',[0]],'학교환경 조정':['learning',[3,5]],'진료·건강 연계':['health',[4]],'생활·돌봄 지원':['daily',[6,7]],'기본생활·주거 지원':['basic',[7]],'정서·또래·온라인 지원':['emotional',[1,2,9]],'공동사정':['intake',[]]};
function apply(base,p,opts={}){
 if(root.YouthKCARRV8Enabled===false)return base;
 const role=opts.role||'social-worker',v=I.build(p,{role,core:base.decision});
 if(!v.active||v.model.abstain)return base;
 const m=v.model,teachers=I.build(p,{role:'teacher',core:base.decision}).model.executionPlan,workers=role==='social-worker'?m.executionPlan:I.build(p,{role:'social-worker',core:base.decision}).model.executionPlan;
 const requested=opts.forPlan&&Array.isArray(p.includedDomains)?p.includedDomains:null;
 const rows=m.executionPlan.filter(t=>{const ds=stages[t.stage]?.[1]||[];return !requested||/현재 안전|안전한 소통/.test(t.stage)||!ds.length||ds.some(i=>requested.includes(i));}).map(t=>{const [id,domains]=stages[t.stage]||['context',[]];return {id:'v8-'+id,title:t.goal,domains,sourceGoals:[],positive:[],unknown:[],narrative:true,peak:0,safety:/현재 안전|안전한 소통/.test(t.stage),selected:true,goal:t.goal,meaning:m.summary.priorityReason,action:t.action,teacher:teachers.find(a=>a.stage===t.stage)?.action+' / 담당(안): '+teachers.find(a=>a.stage===t.stage)?.owner,worker:workers.find(a=>a.stage===t.stage)?.action+' / 담당(안): '+workers.find(a=>a.stage===t.stage)?.owner,when:t.when,measure:t.completion,status:t.status};});
 const covered=new Set(rows.flatMap(t=>t.domains));
 // Keep score-derived safety and any assessed need absent from the narrative model.
 const preserved=base.rows.filter(g=>{const scored=Array.isArray(g.positive)&&g.positive.length>0;if(g.id==='current-safety')return base.decision.urgent&&!rows.some(r=>r.safety);return (scored||(base.decision.urgent&&g.safety))&&g.domains?.every(i=>!covered.has(i));});
 const combined=[...preserved.filter(g=>g.safety),...rows,...preserved.filter(g=>!g.safety)];
 if(base.decision.lowSafetyOnly&&!m.hasSafetySignal)combined.sort((a,b)=>Number(a.safety)-Number(b.safety)||b.peak-a.peak);
 for(const row of combined){const prior=base.rows.find(g=>g.domains?.some(i=>row.domains?.includes(i)));if(prior&&!row.id.startsWith('v8-')){row.teacher=prior.teacher;row.worker=prior.worker;}else if(row.safety){row.teacher='교내 보호 담당·안전한 공간과 수업·등하교 보호조치를 확인하고 학생에게 안전한 연락 경로를 정함.';row.worker='보호 담당기관의 실제 조치와 생활·돌봄 공백을 확인하고 기관별 후속 담당·회신·점검을 조정함.';}}
 const first=base.decision.urgent&&!base.decision.lowSafetyOnly&&!m.hasSafetySignal?base.first:(combined[0]?.action||base.first);
 return {...base,version:'8.1-site-integration',source:'K-CARR V8.1 / CORE unchanged / ICSI·ICMS V7.0',paragraphs:[m.situationOverview],judgement:m.integratedJudgment,first,rows:combined,lead:combined.slice(0,3),others:combined.slice(3),relationship:m.causalLinks.map(x=>x.meaning).join(' '),context:m.causalLinks.map(x=>x.meaning+' '+x.action),safety:base.decision.urgent||m.hasSafetySignal,v8:{version:m.version,priority:m.summary.centralJudgment,narrativeSafety:m.hasSafetySignal,questions:m.nextQuestions,role,contactHazard:m.caregiverContactHazard,execution:m.executionPlan,coreUnchanged:true}};
}
const api={apply};if(node)module.exports=api;else root.YouthKCARRV8=api;
})(typeof window!=='undefined'?window:globalThis);
