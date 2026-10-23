/* Run: node scripts/test_youth_continuity.cjs
   Synthetic test data only. NO student case file imported. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../docs/youth-risk/case-continuity-model.js');
const rules=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/youth-risk/data/case-continuity-rules.json'),'utf8'));
assert.equal(M.setRulesDb(rules),M.version);
const base={initialType:'unrecorded',reviewType:'unrecorded',reviewDecision:'unrecorded'};
const row=(i,patch={})=>({id:'G'+i,title:'합성 지원영역 '+i,meeting:'unrecorded',plan:'draft',execution:'unknown',review:'unrecorded',evidence:'unverified',priority:i,preExisting:false,changedReason:'',...patch});
function check(name,input,test){const result=M.analyze(input);test(result);console.log('PASS',name)}
check('unknown meeting never becomes agreed',{...base,goals:[row(1)]},x=>{assert.equal(x.agreement.count,null);assert.equal(x.tally.executionConfirmed,0)});
check('approved does not mean delivered',{...base,reviewDecision:'approved',goals:[row(1,{meeting:'approved',plan:'confirmed',execution:'scheduled',review:'maintain'})]},x=>{assert.equal(x.tally.meetingApproved,1);assert.equal(x.tally.executionConfirmed,0);assert.equal(x.tally.executionCompletedVerified,0)});
check('unverified completion remains provisional',{...base,goals:[row(1,{meeting:'approved',plan:'confirmed',execution:'completed',evidence:'self-report'})]},x=>{assert.equal(x.tally.executionCompletedVerified,0);assert(x.alerts.some(y=>/증빙 미확인/.test(y.issue)))});
check('verified completion is documented, not outcome',{...base,goals:[row(1,{meeting:'approved',plan:'confirmed',execution:'completed',evidence:'document-verified'})]},x=>{assert.equal(x.tally.executionCompletedVerified,1);assert(x.notes.some(v=>/실제 서비스 효과/.test(v))||x.notes.some(v=>/서비스 이행/.test(v)))});
check('priority collision and case type drift',{...base,initialType:'intensive',reviewType:'general',reviewDecision:'approved',goals:[row(1,{meeting:'approved',plan:'confirmed',review:'maintain'}),row(2,{priority:1,meeting:'approved',plan:'confirmed',review:'maintain'})]},x=>{assert(x.alerts.some(y=>/우선순위/.test(y.issue)));assert(x.alerts.some(y=>/사례유형/.test(y.issue)))});
check('duplicate service referral warning',{...base,goals:[row(1,{meeting:'approved',plan:'confirmed',execution:'referred',preExisting:true})]},x=>assert(x.alerts.some(y=>/중복/.test(y.issue))));
check('no false meeting decision',{...base,goals:[row(1,{plan:'confirmed'})]},x=>assert(x.alerts.some(y=>/회의결정 미기재/.test(y.issue))));
let seed=20261023;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const pick=a=>a[Math.floor(rnd()*a.length)];
let checked=0;
for(let n=0;n<10000;n++){
 const items=Array.from({length:5},(_,i)=>row(i+1,{meeting:pick(M.MEETING),plan:pick(M.PLANS),execution:pick(M.EXEC),review:pick(M.REVIEW),evidence:pick(M.EVIDENCE),preExisting:rnd()<.5,priority:i+1}));
 const v=M.analyze({...base,goals:items});
 assert.equal(v.tally.assessment,5);
 assert(v.tally.executionCompletedVerified<=v.tally.executionConfirmed);
 assert(v.tally.meetingApproved<=v.tally.meetingResolved);
 assert(v.agreement.count===null||v.agreement.count<=v.agreement.denominator);
 checked++;
}
console.log('PASS synthetic scenario invariants',checked);
