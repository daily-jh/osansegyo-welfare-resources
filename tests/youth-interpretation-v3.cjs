'use strict';
const assert=require('node:assert/strict');
const V3=require('../docs/youth-risk/interpretation-v3.js');
const C=require('../docs/youth-risk/criteria.js');
const sample=(mods={},more={})=>{
 const data={type:'youth-support-data-v1',answers:Array(25).fill(0),domains:[],explicit:[],followups:{},student:{gender:'미확인',dong:'세마동'}};
 for(const [i,v] of Object.entries(mods))data.answers[Number(i)-1]=v;
 return Object.assign(data,more);
};
let p=sample({7:1});let prior=JSON.stringify(p);let o=V3.build(p,'teacher','최근 위험 행동을 확인할 필요가 있습니다.','종합 검토');
assert.match(o.text,/현재 안전/);
assert.match(o.text,/7번/);
assert.equal(JSON.stringify(p),prior);
p=sample({7:'unknown'});o=V3.build(p,'social-worker','자해 여부 미확인');
assert.match(o.text,/전체 원점수·지원단계 판단 보류/);
assert.equal(o.facts.unknown,1);
assert.match(o.text,/미확인/);
p=sample({9:2,18:3});o=V3.build(p,'teacher','돌봄 부담 때문에 결석을 했다고 들었습니다.');
assert.match(o.text,/학교 참여|학습·출결/);
assert.match(o.text,/인과·확률이 아닙니다/);
assert.match(o.text,/역할\(교사\)/);
o=V3.build(p,'social-worker','');
assert.match(o.text,/역할\(사회복지사\)/);
assert.doesNotMatch(o.text,/자살 위험.*[0-9]+%/);
p=sample({4:3},{followups:{'4':'unknown'}});
o=V3.build(p);
assert.match(o.text,/추가확인 4/);
const lines=V3.cues('학생은 자해 생각이 없다고 말했다. 그러나 결석이 이어진다고 보고됐다. 가족돌봄은 미확인.');
assert.ok(lines.some(x=>x.topic==='protection'&&x.status==='denied_or_absent'));
assert.ok(lines.some(x=>x.topic==='school'&&x.status==='mentioned_unverified'));
assert.ok(lines.some(x=>x.topic==='care'&&x.status==='unconfirmed'));
let z=20261024;const rand=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/2**32);
for(let k=0;k<3000;k++){
 let a=Array.from({length:25},()=>{let x=Math.floor(rand()*6);return x===5?'unknown':x;});
 let caseData=sample({}, {answers:a}),before=JSON.stringify(caseData),role=k%2?'teacher':'social-worker';
 let parsed=V3.build(caseData,role,k%7?'':'우울 또는 학대는 미확인');
 assert.equal(JSON.stringify(caseData),before);
 assert.equal(parsed.facts.known+parsed.facts.unknown,25);
 assert.equal(parsed.facts.unknown,a.filter(x=>x==='unknown').length);
 assert.ok(parsed.text.length>=350&&parsed.text.length<6000);
 if(a.includes('unknown'))assert.match(parsed.text,/전체 원점수·지원단계 판단 보류/);
 for(const n of [1,2,7,25])if(a[n-1]>0)assert.ok(parsed.facts.safetyItems.includes(n));
}
console.log('PASS v3 additive interpretation: 3000 synthetic cases, safety, unknown, roles, factual separation, no score mutation, conditional check.');


// v3.0.1: per-clause polarity must not suppress a distinct positive school-absence cue.
const additionalFixtures=[
 ['자해는 없고 결석이 반복되고 있습니다.','protection','denied_or_absent'],
 ['자해는 없고 결석이 반복되고 있습니다.','school','mentioned_unverified'],
 ['우울감은 없지만 지각은 늘었습니다.','mental','denied_or_absent'],
 ['우울감은 없지만 지각은 늘었습니다.','school','mentioned_unverified'],
 ['친구가 자해한다는 말을 들었습니다.','protection','unconfirmed'],
 ['자해 위험이 있는지 아직 미확인입니다.','protection','unconfirmed'],
 ['자해 예방 교육의 방법을 논의했습니다.','protection','context_only'],
 ['학생이 죽고 싶다는 표현을 했습니다.','protection','mentioned_unverified'],
 ['학생은 결석이 없다고 말했습니다.','school','denied_or_absent'],
 ['주거불안이 의심된다는 제보를 받았습니다.','housing','unconfirmed']
];
for(const [note,topic,expected] of additionalFixtures){
 const matches=V3.cues(note).filter(x=>x.topic===topic);
 assert.ok(matches.some(x=>x.status===expected),'clause status '+topic+' '+expected);
}
console.log('PASS v3.0.1 contextual safety polarity: 10 synthetic fixtures');
