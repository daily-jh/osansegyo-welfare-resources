'use strict';
/* Fully synthetic sentences only — narrative safety-cue regression for both parsers.
   Covers the 2026-10-26 external review (NARR-01~05) and the follow-up probe:
   missed cues (wrist cutting verbs, image-spreading threats, hidden wounds) and
   false cues (wish negation, third party). CORE scores never change. */
const assert=require('node:assert/strict');
const Core=require('../docs/youth-risk/case-context-core.js');
const Index=require('../docs/youth-risk/integrated-index-v1.js');
const Journey=require('../docs/youth-risk/journey-model-v88.js');
const Narrative=require('../docs/youth-risk/oy-narrative-interpretation-v1.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
const zero=Array(25).fill(0);
const payload=(caseContext,answers=zero)=>({
 answers:answers.slice(),domains:sizes.map((n,i)=>({name:'시험 영역 '+i,items:Array.from({length:n},(_,j)=>'합성 문항 '+i+'-'+j)})),
 routes:sizes.map(()=>[]),resources:[],explicit:[],followups:{},caseContext,
 student:{gender:'미확인',dong:''}
});
const tier=text=>Index.analyze(payload(text)).tier;
const tags=text=>Core.infer(text).signals.map(s=>s.tag+':'+s.polarity+(s.subject==='third-party'?':third':''));
const readSafety=text=>Narrative.read({caseContext:text,answers:zero}).safety.map(f=>'Q'+f.n+':'+f.status);

// Current self-harm, including the plain past-tense cutting verbs.
for(const text of ['오늘 자해하려 한다.','팔목을 베었다고 말했다.','손목에 그은 상처가 있다.']){
 assert.equal(tier(text),4,'current self-harm cue must keep the safety floor: '+text);
 assert.ok(Core.reconcile(zero,text).needsSafetyAttention,text);
}
// A cut made today or yesterday, or a wound not yet healed, is a current injury: same-day protection (2026-10-28 clinical review).
for(const text of ['오늘 손목을 그었다.','학생이 어제 손목을 그었다고 말했다.','손목에 아물지 않은 칼자국이 여러 개 있다.','어젯밤 아버지와 다툰 뒤에도 그었다고 함.']){
 assert.equal(tier(text),5,'recent cut is a current injury: '+text);
 assert.ok(Core.reconcile(zero,text).needsSafetyAttention,text);
}
assert.ok(readSafety('오늘 손목을 그었다.').includes('Q7:보고'));

// Wish negation is a denial, not a current cue (NARR-02).
for(const text of ['학생은 현재 자해한 적도 없고 자해하고 싶지 않다고 말하였다.','학생은 자해하고 싶지 않다고 말했다.','죽고 싶지 않다고 말했다.','학생은 자해하지 않겠다고 약속했다.']){
 assert.equal(tier(text),1,'denial must not raise the level: '+text);
 assert.equal(Core.reconcile(zero,text).needsSafetyAttention,false,text);
 assert.deepEqual(readSafety(text),[],'narrative reading must mark it as denied: '+text);
}
// ...but not wanting to stop stays a current cue.
for(const text of ['자해를 멈추고 싶지 않다고 말했다.','자해를 그만하지 않는다.']){
 assert.equal(tier(text),4,text);
 assert.ok(readSafety(text).includes('Q7:보고'),text);
}

// Third party stays with that person (NARR-04); the student named as actor stays with the student.
for(const text of ['친구가 손목을 그었다.','친구가 손목을 그은 상처를 보여주었다.','친구가 과거 자해했다.','학생은 친구가 손목을 그었다고 말했다.']){
 assert.equal(tier(text),1,'third-party cue must not raise the student level: '+text);
 const c=Core.reconcile(zero,text);
 assert.equal(c.needsSafetyAttention,false,text);
 assert.equal(Journey.analyze(payload(text)).plans.length,0,'third-party cue must not create a student plan: '+text);
}
assert.ok(Core.infer('친구가 손목을 그었다.').issues.some(x=>x.type==='third-party-safety'));
assert.equal(tier('친구가 알려주길 학생이 손목을 그었다고 한다.'),4,'student as actor stays a student cue');
// The narrative reading keeps the same line: a friend's story is shown apart, never as the student's cue.
for(const text of ['친구가 손목을 그었다.','학생은 친구가 손목을 그었다고 말했다.','친구가 아버지에게 맞았다고 학생이 전했다.']){
 const r=Narrative.read({caseContext:text,answers:zero});
 assert.deepEqual(r.safety,[],'second parser must not give the student a safety cue: '+text);
 assert.equal(r.others.length,1,text);
}
assert.ok(readSafety('친구가 알려주길 학생이 손목을 그었다고 한다.').includes('Q7:보고'));
assert.match(Narrative.narrativeText(Narrative.narrative({caseContext:'친구가 손목을 그었다.',answers:zero})),/다른 사람에 관한 안전 이야기/);
// A peer hurt by someone is the peer's story; the student hurt, or harm inside the student's home, stays with the student.
assert.equal(tier('친구가 아버지에게 맞았다고 학생이 전했다.'),1);
for(const text of ['학생이 친구에게 맞았다.','친구가 때렸다.','동생이 학대를 당한다고 말했다.','어머니가 아버지에게 맞았다.'])assert.equal(Core.aboutOthers(text),false,text);

// Image-spreading threat is a safety cue without assuming sexual content (NARR-03).
const threat='학생이 오늘 촬영물을 퍼뜨리겠다는 협박을 받았다고 말했다.';
assert.equal(tier(threat),4);
assert.ok(tags(threat).includes('imageThreat:reported'));
assert.ok(!tags(threat).some(t=>t.startsWith('onlineSexual')),'must not assume sexual exploitation');
assert.ok(readSafety(threat).includes('Q4:보고'),'narrative reading keeps it under coercion, flagged as safety');
assert.ok(!readSafety(threat).some(x=>x.startsWith('Q25')));
assert.equal(tier('SNS에 영상을 올리겠다고 협박했다.'),4);
for(const text of ['학교 예방교육에서 촬영물 유포 협박 사례를 소개함.','매뉴얼에 사진 유포 협박 대응이 있다.']){
 assert.equal(tier(text),1,'teaching material is not an event: '+text);
 assert.deepEqual(readSafety(text),[],text);
}

// Hidden wound is a neutral question: a cue to check, never a safety floor (NARR-05).
for(const text of ['학생은 상처를 숨기고 말하지 않으려 한다고 교사가 관찰했다.','팔에 멍이 있는데 가리고 말하지 않는다.']){
 const x=Index.analyze(payload(text));
 assert.equal(x.tier,1,'hidden wound must not be promoted to abuse or self-harm: '+text);
 assert.equal(x.safetyFloor,null,text);
 assert.ok(tags(text).includes('woundContext:unverified'),text);
 assert.equal(Core.reconcile(zero,text).needsSafetyAttention,false,text);
 assert.ok(Journey.analyze(payload(text)).plans.length>0,'a check task must appear: '+text);
}
assert.equal(tags('학생이 멍하게 앉아 있었다.').length,0,'"멍하게" is not a bruise');

// A cue worded as an absence is a finding, not a denial: "친구가 없다" is isolation reported.
for(const text of ['친구가 없다.','친한 친구가 없어 혼자 다닌다.','의지할 사람이 없다.'])assert.ok(tags(text).includes('support:reported'),text);
assert.ok(!tags('친구 갈등은 없다고 한다.').some(t=>t.startsWith('support')),'no conflict is not "no friends"');
assert.ok(tags('고립되지 않았다.').includes('support:negated'));

// Earlier behaviour kept.
assert.equal(tier('오늘 아버지에게 맞았고 귀가가 두렵다.'),4);
assert.equal(tier('초등학교 때 자해했으나 최근에는 없다.'),1);
assert.equal(tier('학대를 당한 적 없고 오늘 안전하다.'),1);

// CORE raw scores are never touched by narrative.
for(const text of [threat,'오늘 손목을 그었다.','학생은 상처를 숨긴다.','친구가 손목을 그었다.']){
 const a=zero.slice();a[6]=1;a[24]=2;
 const x=Index.analyze(payload(text,a));
 assert.equal(x.raw,3);assert.equal(x.official.knownTotal,3);
}
console.log('youth narrative safety regression passed');
