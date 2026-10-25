'use strict';
/* Independent developer-expected adversarial Korean clauses; not human expert truth. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../docs/youth-risk'),B=require(path.join(root,'cie-lab-v32/engine.js')),D=require(path.join(root,'cie-lab-v32/dialogue-v32.js')),C=require(path.join(root,'criteria.js'));
const P=JSON.parse(fs.readFileSync(path.join(root,'cie-lab-v32/practice-playbook-v32.json'),'utf8'));
const cases=[
['자해 예방교육을 진행했다.','selfharm','hypothetical'],
['학교폭력 예방교육을 수강했다.','peers','hypothetical'],
['학대 예방교육을 실시했다.','protection','hypothetical'],
['온라인 협박 예방교육을 진행했다.','threat','hypothetical'],
['아동학대 교육자료에 보호 사례가 있었다.','protection','hypothetical'],
['학생은 자해하지 않았다고 말했다.','selfharm','negated'],
['학생이 학대당한 적은 없다고 말했다.','protection','negated'],
['최근 폭행 피해는 없다고 말했다.','protection','negated'],
['학생은 협박을 받지 않았다고 말했다.','threat','negated'],
['학생의 결식은 없다고 보고되었다.','basic','negated'],
['학생은 최근 불안하지 않다고 말했다.','mental','negated'],
['지난해 학생이 자해한 적이 있다고 말했다.','selfharm','historical'],
['지난해 친구에게 괴롭힘을 당했다고 말했다.','peers','historical'],
['작년에 생활비 부족으로 결식했다고 말했다.','basic','historical'],
['예전에는 불안이 심했다고 말했다.','mental','historical'],
['작년에 보호자 부재로 돌봄 공백을 겪었다.','care','historical'],
['학생이 자해를 멈추지 않았다고 말했다.','selfharm','ambiguous_negation_review'],
['실제로 학생이 자해했다고 말했다.','selfharm','reported_unverified'],
['학생이 학교폭력을 당했다고 말했다.','peers','reported_unverified'],
['학생이 온라인 협박을 당했다고 말했다.','digital','reported_unverified'],
['학생이 동생을 돌보느라 힘들었다고 말했다.','care','reported_unverified'],
['학생이 수업 조정이 필요하다고 말했다.','access','reported_unverified'],
['학생이 통증으로 진료받기 어렵다고 말했다.','health','reported_unverified'],
['학생은 사회적 고립으로 어려움을 겪는다고 말했다.','relation','reported_unverified'],
['학생이 결식했다고 말했다.','basic','reported_unverified'],
['자해 예방교육을 받은 후 실제로 학생이 자해했다고 말했다.','selfharm','ambiguous_context_review'],
['학대 예방교육 이후 실제로 학생이 폭행 피해를 말했다.','protection','ambiguous_context_review'],
['온라인 협박 예방교육 후 실제로 학생이 협박을 받았다고 말했다.','threat','ambiguous_context_review'],
['결식 예방교육을 받은 후 실제로 학생이 결식했다고 말했다.','basic','ambiguous_context_review']
];
let passed=0;
for(const [note,type,status] of cases){
 const s=B.parseNarrative(note).signals.find(x=>x.type===type);
 assert.ok(s,note+' missing '+type);
 assert.equal(s.status,status,note+' expected '+status+' actual '+s.status);
 passed++;
}
const split=B.parseNarrative('친구는 자해하지 않았고 학생은 자해했다고 말했다.').signals.filter(x=>x.type==='selfharm');
assert.equal(split.length,2,'joined unlike subjects must have distinct evidence nodes');
assert.equal(split[0].status,'negated');assert.equal(split[0].subject,'third_party_mentioned');
assert.equal(split[1].status,'reported_unverified');
passed+=3;
const safe=(note)=>D.run({answers:Array(25).fill(0),caseContext:note,followups:{},explicit:[]},'안전 확인',{engine:B,criteria:C,playbook:P});
for(const note of [
 '자해 예방교육을 받은 후 실제로 학생이 자해했다고 말했다.',
 '학교폭력 예방교육 이후 실제로 학생이 따돌림을 당했다고 말했다.',
 '친구는 자해하지 않았고 학생은 자해했다고 말했다.'
]){
 const r=safe(note);assert.equal(r.official.urgent,false);
 assert.ok(r.gates.some(x=>x.id==='TEXT-SAFETY'),'mixed real risk cannot be silently dismissed: '+note);
 passed++;
}
for(const note of ['자해 예방교육을 진행했다.','학생은 자해하지 않았다고 말했다.']){
 assert.ok(!safe(note).gates.some(x=>x.id==='TEXT-SAFETY'),'do not automatically promote education or denial: '+note);passed++;
}
for(let i=0;i<200;i++){
 const a=Array(25).fill(0),j=i%25;a[j]=i%5;const r=D.run({answers:a,caseContext:cases[i%cases.length][0],followups:{},explicit:[]},'사례사정',{engine:B,criteria:C,playbook:P});
 const c=C.evaluate(a,B.GROUPS,false,{});
 assert.equal(r.official.knownTotal,c.knownTotal);assert.equal(r.official.urgent,c.urgent);
 assert.ok(r.review.allActionRefsExist);passed++;
}
console.log('PASS OY-CIE V3.3.1 '+passed+' adversity and official CORE read-only assertions; developer-expectations, not expert labels');
