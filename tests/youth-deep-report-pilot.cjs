'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../docs/youth-risk/deep-report-pilot.js'),C=require('../docs/youth-risk/criteria.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
function payload(answers){return {answers,domains:sizes.map((n,i)=>({name:'合成領域 '+i,items:Array(n).fill('합성 문항')})),routes:sizes.map(()=>[]),resources:[],explicit:[],followups:{},caseContext:'',student:{gender:'미확인',dong:''}}}
let seed=20261026;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<240;i++){
 const p=payload(i===0?Array(25).fill('unknown'):i===1?Array(25).fill(4):Array.from({length:25},()=>rnd()<.2?'unknown':Math.floor(rnd()*5)));
 if(i%7===0)p.explicit=['합성 현재위해'];
 if(i%9===0)p.caseContext='가상의 학생이 결석을 보고하나 현재 안전은 미확인입니다.';
 const before=JSON.stringify(p),expected=C.evaluate(p.answers,sizes,!!p.explicit.length,p.followups),r=R.build(p);
 assert.deepEqual(r.decision,expected);assert.equal(JSON.stringify(p),before);assert.equal(r.rows.length,10);
 assert.equal(r.rows.reduce((n,x)=>n+x.unknown,0),expected.unknownItems.length);
 assert.equal(r.trace.length,5);assert.ok(r.trace.every(x=>x.loaded));
 assert.match(R.render(r),/미확인/);
}
const p=payload(Array(25).fill(0));p.domains[0].name='<img src=x onerror=alert(1)>';
const html=R.render(R.build(p));assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));
assert.throws(()=>R.build(payload(Array(24).fill(0))));
for(const path of ['deep-report-pilot.js','deep-report-pilot-ui.js'])assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|clipboard|https?:\/\//.test(fs.readFileSync('docs/youth-risk/'+path,'utf8')));
console.log('PASS: 240 synthetic CORE equality + immutability + unknown + module trace; HTML escape; invalid input; no network/storage/export APIs');

// V0.2 disclosure and evidence contracts.
const narrative=payload(Array(25).fill(0));narrative.caseContext='가상 예시: 집에서 맞았다고 보고했습니다.';
const hidden=R.build(narrative),included=R.build(narrative,{includeNarrative:true});
assert.equal(hidden.includeNarrative,false);assert.equal(hidden.context.hasContext,false);assert.equal(hidden.kCarr,null);
assert.equal(included.includeNarrative,true);assert.equal(included.context.hasContext,true);
assert.deepEqual(hidden.decision,included.decision);
assert.equal(hidden.plans.length,0,'zero answers without opted-in narrative must not fabricate plans');
const pending=R.build(payload(Array(25).fill('unknown')));
// Unknown safety items owe one check task, never a service plan.
assert.equal(pending.plans.filter(x=>!x.safetyCheck).length,0);assert.equal(pending.plans.filter(x=>x.safetyCheck).length,1);assert.equal(pending.completeness.upper,100);assert.equal(pending.completeness.lower,0);
assert.equal(pending.rows.flatMap(d=>d.items).length,25);
assert.ok(pending.priorities.some(t=>t.type==='미상 확인'));
const safe=payload(Array(25).fill(0));safe.answers[0]=1;
assert.ok(R.build(safe).priorities.some(t=>t.type==='안전 확인'&&t.items.includes(1)));
assert.match(R.render(hidden),/서술 분석 미포함/);
assert.ok(pending.rows.every(d=>d.questions.length>0));
assert.throws(()=>R.build(payload(Array(25).fill(NaN))));
console.log('PASS V0.2: narrative opt-in, 25 item evidence, all-unknown range and no automatic referral, low-total safety priority');
