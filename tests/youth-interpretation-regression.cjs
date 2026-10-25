const A=require('node:assert/strict'),J=require('../docs/youth-risk/journey-model-v88.js');const sizes=[2,3,3,3,2,2,3,3,2,2];function p(note=''){return {answers:Array(25).fill(0),domains:sizes.map((n,i)=>({name:'영역'+i,items:Array(n).fill('문항')})),routes:sizes.map(()=>[]),resources:[],explicit:[],followups:{},caseContext:note}}
for(const note of ['ADHD 진단을 받은 적이 없음.','학생은 ADHD가 아님.','친구가 ADHD 진단을 받음.','만약 ADHD라면.'])A.doesNotMatch(J.analyze(p(note)).sections[6].text,/서술에는 ADHD가 보고/);
A.match(J.analyze(p('학생은 ADHD 진단을 받음.')).sections[6].text,/서술에는 ADHD가 보고/);
for(const i of [18,20]){let x=p();x.answers[i]=3;A.doesNotMatch(J.analyze(x).sections[6].text,/주거의 어려움/)}
let x=p();x.answers[19]=2;A.match(J.analyze(x).sections[6].text,/주거의 어려움/);
x=p('학생은 현재 상담을 받고 있으며 태권도에 관심이 많음. 비공개 식별문자 PRIVATE_MARKER');let t=J.text(x,'사례사정',false);A.doesNotMatch(t,/태권도|PRIVATE_MARKER|이미 상담/,'Free text must be excluded by default');const opted=J.text(x,'사례사정',true);A.match(opted,/태권도/);A.match(opted,/이미 상담/);
A.doesNotMatch(J.analyze(p('태권도를 싫어하며 관심이 없음.')).sections[6].text,/태권도는 학생/);
A.ok(J.analyze(p('친구가 자해한다고 학생이 전해 들음.')).context.signals.some(s=>s.subject==='third-party'));
console.log('PASS negation, third-party diagnosis, housing specificity, interest, PDF consistency and raw-text exclusion');
