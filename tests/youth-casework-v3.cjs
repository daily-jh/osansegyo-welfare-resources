'use strict';
const assert=require('node:assert/strict');
const K=require('../docs/youth-risk/casework-v3.js');
const p=(mods={},more={})=>{const a=Array(25).fill(0);for(const [key,v]of Object.entries(mods))a[Number(key)-1]=v;return {answers:a,...more};};
let x=p({9:2,18:3,20:1}),copy=JSON.stringify(x);let v=K.plan(x,'teacher');
assert.equal(v.version,'3.0.0-casework-20261024');
assert.equal(v.readyForFormalPlan,false);
assert.equal(v.proposals.length,3);
assert.ok(v.proposals.every(g=>g.baseline===null&&g.dueDate===null&&g.targetScale===null&&g.confirmedOutcome===false));
assert.equal(JSON.stringify(x),copy);
v=K.plan(x,'social-worker');assert.ok(v.proposals.every(g=>g.assignedTo.includes('사례관리자')));
v=K.plan(p({7:1,20:4}),'teacher');assert.equal(v.proposals[0].derivedItems[0].number,7);
v=K.plan(p({7:'unknown'}));assert.ok(v.pendingDomains.includes('정서·정신건강'));assert.equal(v.proposals.length,0);
let z=3402026;const rand=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/2**32);
for(let k=0;k<2000;k++){
 const a=Array.from({length:25},()=>{const x=Math.floor(rand()*6);return x===5?'unknown':x;});const inp={answers:a},before=JSON.stringify(inp);
 const output=K.plan(inp,k%2?'teacher':'social-worker');
 assert.equal(JSON.stringify(inp),before);
 assert.ok(output.proposals.length<=3);
 assert.equal(output.readyForFormalPlan,false);
 for(const g of output.proposals){
  assert.equal(g.baseline,null);assert.equal(g.dueDate,null);assert.equal(g.targetScale,null);
  assert.ok(g.derivedItems.every(it=>Number.isInteger(it.value)&&it.value>=1&&it.value<=4));
 }
}
console.log('PASS v3 casework draft contract: 2000 synthetic inputs, no automatic agreements, safety prioritization, known/unknown separation.');
