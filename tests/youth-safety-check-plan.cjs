'use strict';
/* Fully synthetic data only — an unknown safety item must leave a check task in the plan
   (2026-10-26 external review MISS-01), without inventing a score, level or service. */
const assert=require('node:assert/strict');
const Journey=require('../docs/youth-risk/journey-model-v88.js');
const Gateway=require('../docs/youth-risk/model-gateway-v90.js');
const Index=require('../docs/youth-risk/integrated-index-v1.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
const payload=(answers,followups={})=>({
 answers:answers.slice(),domains:sizes.map((n,i)=>({name:'시험 영역 '+i,items:Array.from({length:n},(_,j)=>'합성 문항 '+i+'-'+j)})),
 routes:sizes.map(()=>[]),resources:[],explicit:[],followups,caseContext:'',
 student:{gender:'미확인',dong:''}
});
const answers=(set={})=>{const a=Array(25).fill(0);for(const [k,v] of Object.entries(set))a[k-1]=v;return a;};
const check=a=>a.plans.find(x=>x.safetyCheck);

// Each safety item left unknown, alone and together.
for(const set of [{1:'unknown'},{2:'unknown'},{7:'unknown'},{25:'unknown'},{1:'unknown',7:'unknown',25:'unknown'}]){
 const p=payload(answers(set)),a=Journey.analyze(p),c=check(a),items=Object.keys(set).map(Number);
 assert.ok(c,'unknown safety item must leave a check task: '+JSON.stringify(set));
 assert.equal(a.plans[0],c,'the check task leads the plan');
 assert.equal(c.when,'오늘 안에 직접 확인');
 assert.deepEqual(c.sourceItemIds,items.map(n=>'Q'+String(n).padStart(2,'0')));
 assert.deepEqual(c.candidates,[],'a check task recommends no agency');
 items.forEach(n=>assert.ok(c.action.includes(n+'번'),'action names item '+n));
 assert.ok(!/0점으로|안전합니다/.test(c.action));
 // Score and level stay unset; the gateway contract still holds.
 const g=Gateway.analyze(p);
 assert.equal(g.modelTrace.audit.ok,true);
 assert.equal(g.modelTrace.audit.rawKnownTotal,0);
 assert.equal(Index.analyze(p).tier,null,'level stays unclassified while a safety item is unknown');
}

// A non-safety unknown stays out of the action plan.
assert.equal(check(Journey.analyze(payload(answers({10:'unknown'})))),undefined);
// Nothing unknown, nothing owed.
assert.equal(check(Journey.analyze(payload(answers()))),undefined);
assert.equal(Journey.analyze(payload(answers())).plans.length,0);
// An unanswered current-risk follow-up is owed too, beside the domain plan.
const followup=Journey.analyze(payload(answers({4:2})));
assert.ok(check(followup)?.sourceItemIds.includes('Q04'));
assert.ok(followup.plans.some(x=>x.id==='P-D1'),'the domain plan stays');
const answered=Journey.analyze(payload(answers({4:2}),{4:'no'}));
assert.equal(check(answered),undefined,'an answered follow-up is no longer owed');
// The safety item's own plan stays when another safety item is unknown.
const mixed=Journey.analyze(payload(answers({1:'unknown',2:2})));
assert.deepEqual(check(mixed).sourceItemIds,['Q01']);
assert.ok(mixed.plans.some(x=>x.id==='P-D0'));
console.log('youth safety check plan regression passed');
