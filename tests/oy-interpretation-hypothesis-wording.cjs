'use strict';
/* Fully synthetic data only. Scores alone cannot tell cause, timing, a carer's state or the future
   (2026-10-26 external review). Linked patterns read as responses seen together; readings keep the
   anchor and leave inferred mechanism as something to check. */
const assert=require('node:assert/strict');
const X=require('../docs/youth-risk/oy-cross-patterns-v1.js');
const K=require('../docs/youth-risk/oy-item-knowledge-v1.js');
const D=require('../docs/youth-risk/oy-deep-interpretation-v1.js');
const answers=(set={})=>{const a=Array(25).fill(0);for(const [k,v] of Object.entries(set))a[k-1]=v;return a;};

// Every linked pattern names co-occurrence, never a settled cause, stage or course.
const COURSE=/흔히|경우가 많습니다|회복 속도|직전 단계|단계입니다|구조입니다|빠르게 나타나/;
for(const p of X.PATTERNS){
 assert.match(p.loop,/함께 응답되어/,p.id+' must read as responses seen together');
 assert.ok(!COURSE.test(p.loop),p.id+' states a course or prognosis: '+(p.loop.match(COURSE)||[])[0]);
}
// Readings do not add an inferred mechanism to the anchor.
const OVERREACH=/일상 전체가|악순환에 들어서|가해자의 통제 아래에서 일상을|쓰고 있습니다|거의 남아 있지 않습니다|일상을 대신하면서|착취가 확인된/;
for(let n=1;n<=25;n++)K.item(n).r.forEach((t,i)=>assert.ok(!OVERREACH.test(t),n+'번 '+(i+1)+'점 reading overreaches: '+t));

// The review's own cases.
const text=set=>{const r=D.build({answers:answers(set)});return D.text(r).split('[근거 자료')[0];};
const care=text({9:3,10:3,16:2,18:2});
assert.ok(!care.includes('차지하면서 출결이 무너지고'),'care–attendance cause is not settled');
assert.ok(care.includes('차지하고 있을 수 있어'));
const harm=text({1:3});
assert.ok(!harm.includes('일상 전체가 귀가와 보호자 반응을 중심으로 긴장된'));
for(const set of [{9:4,10:4,11:4},{6:3},{19:3}])assert.ok(!text(set).includes('변화가 빠르게 나타나는'),'no prognosis: '+JSON.stringify(set));
console.log('interpretation hypothesis wording regression passed');
