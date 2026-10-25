'use strict';
/* Run: node docs/youth-risk/tests/v87-integration-regression.cjs; synthetic cases only. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../criteria.js');
const U=require('../unified-v86.js');
const B=require('../site-bridge-v86.js');
const P=require('../privacy-guard-v87.js');
const SIZES=[2,3,3,3,2,2,3,3,2,2];
const cases=['','중학생이 미술에 관심이 있고 교과 학습이 어렵다고 말했다.','학교폭력 피해 여부가 미확인이다.','학생은 자해한 적 없다고 말했다.','학생은 보호자에게 맞았다고 말했다. 현재 안전 여부 미확인이다.','할머니와 동거하고 있다. 식사 제공이 어려운 때가 있다.','학생이 어제 죽고 싶다고 말했으며 현재 안전 확인이 필요하다.'];
let seed=87025;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
let total=0;
for(let i=0;i<5000;i++){
 let answers=Array.from({length:25},()=>rand()<.08?'unknown':rand()<.38?0:Math.floor(rand()*5));
 if(i%11===0)answers=Array(25).fill(4);
 if(i%11===1)answers=Array(25).fill('unknown');
 if(i%11===2)answers=Array(25).fill(0);
 const payload={answers,caseContext:cases[i%cases.length],followups:{},explicit:[]};
 const core=C.evaluate(answers,SIZES,false,{});
 const state=U.build(payload,{officialDecision:core}),site=B.apply({decision:core},payload,{});
 assert.equal(site.decision.knownTotal,core.knownTotal);
 assert.equal(site.decision.urgent,core.urgent);
 assert.equal(state.core.officialDecision,core);
 if([1,2,7,25].some(n=>answers[n-1]==='unknown'))assert.equal(state.safety.reviewRequired,true);
 assert.equal(state.ICMS.composed.sourceFullyCovered,true);
 assert.ok(site.rows.length<=5);
 assert.equal(new Set(state.ICMS.goalIds).size,state.ICMS.goalIds.length);
 assert.ok(state.ICMS.goals.every(g=>state.ICMS.composed.sourceGoalIds.includes(g.id)));
 assert.ok(Object.values(state.documents).every(d=>JSON.stringify(d.goalIds)===JSON.stringify(state.ICMS.goalIds)));
 for(let j=0;j<25;j++)if(answers[j]>=3)assert.ok(state.ICMS.goals.some(g=>g.id==='Q'+String(j+1).padStart(2,'0')));
 assert.ok(site.rows.every(g=>g.teacher!==g.worker));
 total++;
}
const allUnknown=Array(25).fill('unknown'),p={answers:allUnknown,caseContext:'',followups:{},explicit:[]};
const res=U.build(p,{officialDecision:C.evaluate(allUnknown,SIZES,false,{})});
assert.equal(res.safety.reviewRequired,true);assert.equal(res.safety.officialCORE,false);
assert.deepEqual(res.safety.unknownSafetyItems,[1,2,7,25]);
const sample=P.inspect('학생명: 홍길동 전화번호 010-1234-5678 학교는 세교중학교');
assert.equal(sample.requiresManualReview,true);
assert.ok(!sample.redacted.includes('010-1234-5678'));
assert.ok(!sample.redacted.includes('세교중학교'));
const root=path.join(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
for(let page of ['assessment.html','case-examples.html','workbench.html']){
 const source=read(page),s=n=>source.indexOf(n+'.js?v=');
 assert.ok(s('safety-state-v87')>=0&&s('goal-composer-v87')>=0);
 assert.ok(s('safety-state-v87')<s('unified-v86'));
 assert.ok(s('goal-composer-v87')<s('unified-v86'));
 assert.ok(s('unified-v86')<s('site-bridge-v86')&&s('site-bridge-v86')<s('case-formulation-v72'));
}
assert.match(read('case-form-model.js'),/byItem\[g\.item\]===i/);
assert.match(read('flow.js'),/window\.confirm\(message\)/);
assert.match(read('personal-ai.js'),/OYPrivacyGuardV87/);
assert.match(read('local-ai.js'),/OYPrivacyGuardV87/);
assert.match(read('app.js'),/OYPrivacyGuardV87/);
assert.match(read('index.html'),/지원연계·사례관리 통합 · CORE 25문항 유지/);
console.log('PASS V8.7: '+total+' synthetic regression cases; CORE unchanged, safe unknown, ≤5 primary goals, all original goals preserved, privacy and page wiring');
