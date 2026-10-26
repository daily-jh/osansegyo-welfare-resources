'use strict';
/* Fully synthetic answers only. Readable service plans (2026-10-26 external review P2-04/05):
   safety and basic-life tasks lead, three tasks to start with and the rest folded, an agency proposed
   once, and light responses start in school with agencies as optional candidates. CORE never changes. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('docs/youth-risk/app.js','utf8');
const grab=name=>{const start=app.indexOf('var '+name+'=[');let i=app.indexOf('[',start),depth=0,j=i;for(;j<app.length;j++){if(app[j]==='[')depth++;else if(app[j]===']'&&!--depth)break;}return JSON.parse(app.slice(i,j+1));};
const domains=grab('domains'),routes=grab('routes');
const context={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),context);
const resources=require('../docs/youth-risk/resource-adapter.js').rows(context.window.WELFARE_DATA);
const G=require('../docs/youth-risk/model-gateway-v90.js');
const answers=set=>{const a=Array(25).fill(0);for(const [k,v] of Object.entries(set))a[k-1]=v;return a;};
const run=(set,caseContext='')=>G.analyze({answers:answers(set),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources,explicit:[],followups:{},caseContext});

// Basic life leads non-safety tasks; three are marked to start with.
const mixed=run({9:3,10:3,16:2,18:2,19:2,22:2});
assert.equal(mixed.plans[0].id,'P-Q19','basic-life task comes first');
assert.deepEqual(mixed.plans.map(x=>x.primary),mixed.plans.map((x,i)=>i<3));
assert.equal(mixed.primaryPlans.length,3);
// An agency is proposed under one task only; later tasks point back to it.
for(const a of [mixed,run({7:3,9:3,12:3,16:3,19:3}),run(Object.fromEntries(Array.from({length:25},(_,i)=>[i+1,3])))]){
 const names=a.plans.flatMap(x=>x.candidates.map(c=>c.name));
 assert.equal(new Set(names).size,names.length,'no agency repeated across tasks');
 for(const [i,x] of a.plans.entries())for(const n of x.sharedCandidates||[])assert.ok(a.plans.slice(0,i).some(y=>y.candidates.some(c=>c.name===n)),n+' points back to an earlier task');
 assert.equal(a.modelTrace.audit.ok,true);
}
// Safety tasks stay above everything else.
const safe=run({1:2,9:3,19:3});
assert.equal(safe.plans[0].domain,0);
// Light responses only: school first, agencies optional.
for(const set of [{10:1},{9:1,16:1,19:1}]){
 const a=run(set);
 assert.equal(a.decision.observedLevel,0);
 for(const x of a.plans){
  assert.equal(x.candidateMode,'optional',JSON.stringify(set));
  assert.match(x.action,/^먼저 담임·상담교사가 학생과 짧게 이야기하고/);
 }
}
// Not light: a scored safety item, a level-1 response, or a narrative safety cue.
for(const [set,text] of [[{7:1},''],[{9:2},''],[{10:1},'오늘 손목을 그었다.']])assert.ok(run(set,text).plans.every(x=>x.candidateMode!=='optional'),JSON.stringify(set)+text);
// CORE stays as scored.
assert.equal(run({9:1,16:1,19:1}).decision.knownTotal,3);

console.log('youth readable plans passed');
