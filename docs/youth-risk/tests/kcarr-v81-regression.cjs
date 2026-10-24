'use strict';
const assert=require('node:assert/strict');
const K=require('../k-carr-narrative-v81.js');
const C=require('../criteria.js');
const G=[2,3,3,3,2,2,3,3,2,2];
const tests=[
 ['학대 부정','보호자의 폭력이나 방임은 보고되지 않았다.',false,false],
 ['학대 긍정','보호자가 학생을 때렸다고 학생이 진술했다.',true,true],
 ['연락 이후 폭력','담임이 보호자에게 연락한 뒤 학생이 집에서 맞았다고 말했다.',true,true],
 ['학대 예방교육','학교폭력 예방교육을 진행했다. 실제 피해 경험은 없었다.',false,false],
 ['또래피해','반 친구들이 단톡방에서 조롱하고 복도에서 밀쳤다. 피해 이후 결석이 늘었다.',true,false],
 ['진단 부정','ADHD 진단 받은 적 없고 약물도 복용하지 않는다. 교실 소음으로 과제 수행이 어렵다.',false,false],
 ['진단 긍정','ADHD 진단을 받고 약물을 복용 중이라고 설명했다.',false,false],
 ['자해 부정','자해한 적은 없고 죽고 싶은 생각도 없다고 말했다.',false,false],
 ['자해 긍정','지난주 죽고 싶다는 말을 했고 현재 상태는 미확인이다.',true,false],
 ['예시','만약 학생이 자해를 했다고 말했다면 어떻게 대응할지 연습했다.',false,false]
];
for(const [name,narrative,safety,family] of tests){
 const r=K.assess({caseContext:narrative,role:'social-worker'});
 assert.equal(r.hasSafetySignal,safety,name+': safety');
 assert.equal(r.needsCaregiverContactSafetyReview,family,name+': family');
 assert.equal(r.scoredByCORE,false,name+': score ownership');
}
const peer=K.assess('반 친구들이 단톡방에서 조롱하고 복도에서 밀쳤다. 피해 이후 결석했다.');
assert.ok(peer.domains.some(d=>d.id==='peer'),'school victimization');
const med=K.assess('ADHD 진단은 받은 적 없고 약물도 복용하지 않는다.');
assert.equal(med.medicalReportPresent,false,'negated medical');
const housing=K.assess('월세가 체납되었지만 퇴거 통보는 받지 않았다. 생활비 지원을 희망한다.');
assert.ok(housing.executionPlan.some(p=>p.stage==='기본생활·주거 지원'),'housing plan separate');
const answers=Array(25).fill(0);answers[0]=3;answers[8]=2;
const before=C.evaluate(answers,G,false,{}),review=K.assess({caseContext:'월세가 체납됐다.',officialScore:before.knownTotal});
assert.equal(review.officialScoreUntouched,before.knownTotal);
assert.equal(C.evaluate(answers,G,false,{}).urgent,before.urgent);
console.log('K-CARR V8.1: '+tests.length+' core semantics + peer/medical/housing and CORE invariance passed');
