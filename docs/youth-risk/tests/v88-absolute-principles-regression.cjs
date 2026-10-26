'use strict';
// OY-RALS V8.8.1: synthetic-only deterministic regression. Never commit identifiable youth data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const C=require('../criteria.js');
const M=require('../support-model.js');
const J=require('../journey-model-v88.js');
const E=require('../case-context-v81.js');
const R=require('../relations-v88.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
function sample(answers,caseContext=''){return {answers,caseContext,domains:sizes.map((s,i)=>({name:'가상영역 '+(i+1),items:Array.from({length:s},(_,j)=>'가상 질문 '+j)})),routes:Array.from({length:10},()=>[]),resources:[],student:{gender:'미확인',dong:''},followups:{},explicit:[]};}
const answers=Array(25).fill(0);answers[0]=3;answers[18]=3;answers[19]='unknown';
const p=sample(answers,'친부와 따로 거주하는 상황. 현재 외할머니 집에서 친모와 함께 지낸다고 입력됨.');
const frozen=JSON.stringify(p);
const a=J.analyze(p);
assert.match(J.VERSION,/^\d+\.\d+\.\d+/,'model version must follow semantic version prefix');
assert.equal(JSON.stringify(p),frozen,'analysis must not mutate input');
assert.deepEqual(a.decision,C.evaluate(answers,sizes,false,{}),'CORE truth source');
assert.ok(a.plans.some(x=>x.id==='P-Q19'&&x.evidence[0].includes('3점')));
assert.ok(!a.plans.some(x=>x.id==='P-Q20'),'Unknown-only need must not create a service plan');
assert.ok(a.decision.unknownItems.includes(20),'Unknown remains on separate verification list');
assert.ok(!a.plans.some(x=>x.domain===3),'Zero-score domain must not become an unsupported task');
assert.ok(['어머니','아버지','할머니'].every(name=>a.ecosystem.family.some(f=>f.label===name)));
assert.ok(!a.ecosystem.family.find(f=>f.label==='아버지').status.startsWith('동거'));
assert.ok(R.seed(a).every(x=>x.cohabit===false),'Cohabitation cannot be automatically confirmed');
assert.ok(J.text({...p,linkageReviewStatus:'연계 후보 검토 전'},'사례사정',false).includes('연계 후보 검토 전'));
assert.ok(!J.text(p,'사례사정',false).includes('외할머니 집'),'Narrative must be excluded by default');
let seed=87331;
for(let i=0;i<1200;i++){
 const scores=Array.from({length:25},()=>{seed=(seed*1664525+1013904223)>>>0;const n=seed%13;return n>=11?'unknown':n%5;});
 const testcase=sample(scores);
 assert.deepEqual(J.analyze(testcase).decision,C.evaluate(scores,sizes,false,{}),'CORE must remain unchanged');
}
const globals={OYJourney:J,OYRelations:R,YouthMap:M,
 YouthContextV81:{scoreHTML:()=>'<section>score</section>'},
 YouthSynthesis:{build:()=>({areas:[],decision:{incomplete:false}}),graph:()=>'<svg></svg>',note:()=>({present:true})},
 YouthCaseForms:{build:()=>({}),text:()=>''},
 YouthFormulation:{text:()=> '[LEGACY RESULT]'},
 YouthCaseDocuments:{render:()=> '[LEGACY RESULT]'}};
const context={window:globals,module:{exports:{}},TextEncoder,Uint8Array,DataView,URL,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../bundle-export.js'),'utf8'),context,{filename:'bundle-export.js'});
const exportFiles=context.module.exports.files;
const redacted=exportFiles(p,{includeContext:false,journeySnapshot:{drafts:{secret:'NOT EXPORTED'},relations:[{kind:'family',label:'가상 관계'}]}});
assert.ok(!redacted.some(f=>['case-context.txt','11-v88-authored-fields.json','12-v88-family-support-diagram.html'].includes(f.name)));
const included=exportFiles(p,{includeContext:true,journeySnapshot:{drafts:{note:'가상 실무 의견'},draftLabels:{note:'지원 확인'},relations:R.seed(a)}});
for(const name of ['01-summary.html','02-review.txt','03-service-plan.html','04-case-conference.html','11-v88-authored-fields.json','12-v88-family-support-diagram.html'])assert.ok(included.some(f=>f.name===name),name);
assert.ok(included.find(f=>f.name==='02-review.txt').content.startsWith('OY-RALS V'+J.VERSION));
assert.ok(included.find(f=>f.name==='03-service-plan.html').content.includes('서비스계획'));
assert.ok(included.find(f=>f.name==='04-case-conference.html').content.includes('사례협의'));
assert.ok(included.filter(f=>/^0[1234]-/.test(f.name)).every(f=>!f.content.includes('[LEGACY RESULT]')));
const main=fs.readFileSync(path.join(__dirname,'../flow.js'),'utf8');
assert.ok(main.includes("n>=3&&ready&&!linkageReviewed&&!linkageDeferred"),'Must explicitly review or defer linkage');
assert.ok(main.includes('confirmLinkageReview')&&main.includes('deferLinkageReview'),'Safety deferral supported');
const map=fs.readFileSync(path.join(__dirname,'../support.js'),'utf8');
assert.ok(map.includes("shown=ds.filter(a=>!only||a.sum||a.unknown||a.i===selected)"),'Zero-only nodes filtered');
const markup=fs.readFileSync(path.join(__dirname,'../support.html'),'utf8');
assert.match(markup,/id="signalsOnly"[^>]*checked>/,'Signal filter defaults to on');
console.log('V8.8.1 synthetic regression PASSED: 1200 CORE comparisons, family, unknown, source, gated linkage, ZIP privacy and version consistency.');
