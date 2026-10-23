#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const criteria=require('../docs/youth-risk/criteria.js');
const model=require('../docs/youth-risk/support-model.js');
const planning=require('../docs/youth-risk/planning-model.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
function form(numbers){
 const answers=Array(25).fill('unknown');
 numbers.forEach(([n,v])=>answers[n-1]=v);
 return {answers,domains:sizes.map((size,i)=>({name:'영역 '+i,items:Array(size).fill('문항')})),
 routes:sizes.map(()=>[]),resources:[],followups:{},explicit:[]};
}
// R11 synthetic input: documented ordinary online threat (item 4), NOT assumed sexual exploitation (item 25).
const p=form([[4,2],[6,2],[9,2],[10,2],[16,2],[17,2],[24,2]]);
const dec=criteria.evaluate(p.answers,sizes,false,{});
assert.equal(dec.urgent,false,'unconfirmed nonsexual threat must not imply an emergency');
assert.deepEqual(dec.pendingChecks,[4],'unresolved current safety verification must remain pending');
const sorted=planning.analyze(p).active.slice(0,3).map(d=>d.i);
assert.ok(sorted.includes(1),'pending safety inquiry domain must appear among top three');
// An actual safety indicator must remain higher priority than an unresolved supplemental check.
const q=form([[1,1],[4,2],[6,2],[9,2]]);
const dq=criteria.evaluate(q.answers,sizes,false,{});
assert.equal(dq.urgent,true);
assert.equal(planning.analyze(q).active[0].i,0,'actual safety danger takes precedence');
// No extra severity or definitive category when data remain unknown.
assert.equal(dec.level,null);
assert.equal(dec.incomplete,true);
console.log(JSON.stringify({passed:7,pendingDomainTop3:sorted,currentSafetyUrgent:dec.urgent,actualSafetyUrgent:dq.urgent}));
