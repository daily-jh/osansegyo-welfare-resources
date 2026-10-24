const A=require('node:assert/strict'),C=require('../docs/youth-risk/criteria.js'),M=require('../docs/youth-risk/case-context-v81.js'),F=require('../docs/youth-risk/case-formulation-v72.js');
const groups=[2,3,3,3,2,2,3,3,2,2],p={answers:Array(25).fill(0),explicit:[],followups:{},caseContext:''};
p.answers[0]=1;p.answers[9]=4;let d=C.evaluate(p.answers,groups,false,{});A.equal(d.urgent,true);A.equal(d.lowSafetyOnly,true);A.doesNotMatch(d.title,/즉시/);A.match(d.title,/개별지원/);A.equal(F.build(p).rows[0].id,'learning');
p.answers[0]=2;d=C.evaluate(p.answers,groups,false,{});A.equal(d.lowSafetyOnly,false);A.match(d.title,/즉시/);p.answers[0]=1;A.equal(C.evaluate(p.answers,groups,true,{}).lowSafetyOnly,false);
for(let score=0;score<=100;score++){const a=Array.from({length:25},(_,i)=>Math.max(0,Math.min(4,score-i*4)));A.equal(M.position({answers:a}).band,Math.min(4,Math.floor(score/25)+1));}
A.deepEqual(M.position({answers:Array(25).fill('unknown')}),{sum:0,missing:25,lower:0,upper:100,band:null});
const c=M.parse({caseContext:'조손가구이며 할머니와 함께 살고 있음. 기초생활수급 신청 중. 세교복지관에서 서비스를 받고 있음. 한부모가구는 아님.'});A.equal(c.profiles.length,2);A.equal(c.family[0].label,'할머니');A.equal(c.institutions[0].status,'이용·개입 언급');A.match(M.html(c),/가계도/);A.match(M.html(c),/생태도/);
A.equal(M.parse({caseContext:'학교폭력 예방교육. 아동보호전문기관 이용하지 않음.'}).institutions.length,0); // prevention and denied use are not ecosystem connections
A.equal(M.parse({caseContext:'ADHD로 약물 복용. 수업에 어려움.'}).family.length,0);
A.doesNotMatch(M.html({profiles:[],family:[{label:'<script>',status:'<img>',evidence:'<svg>'}],institutions:[]}),/<script>|<img>|<svg>/);
const before=JSON.stringify(p);F.build({...p,caseContext:'다문화 한부모가구이며 차상위라고 보고함.'});A.equal(JSON.stringify(p),before);
A.doesNotMatch(F.text({...p,caseContext:'조손가구. 할머니와 동거.'},false),/조손|할머니/);
const linked=F.build({...p,caseContext:'조손가구이며 할머니와 함께 살고 있음. 세교복지관에서 서비스를 받고 있음.'});A.match(linked.paragraphs.join(' '),/척도에서 크게 보고된 어려움/);A.ok(!linked.rows.some(g=>g.id==='v8-intake'));A.equal(linked.rows[0].id,'learning');
console.log('PASS V8.1 context: safety review retained, primary needs ordered, 101 score boundaries, unknown range, family/benefit distinction, source limited diagrams, XSS and narrative-free export');
