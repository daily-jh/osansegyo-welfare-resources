const assert=require('node:assert/strict'),I=require('../docs/youth-risk/oy-rals-v8-integration.js');
for(const role of ['teacher','education-welfare','social-worker']){
 for(const note of ['학생이 상담을 원하고 최근 결석이 반복됨.','가정의 경제적 형편이 어렵지만 안정적으로 양육됨.','보호자가 때린 적 없다고 함.']){
 const p={answers:Array(25).fill(0),caseContext:note},before=JSON.stringify(p),core={incomplete:true,knownTotal:12};
 const r=I.build(p,{role,core});assert.ok(!r.model.situationOverview.includes('보호자 연락 이후 위해'));assert.equal(r.model.officialScoreUntouched,null);assert.equal(r.coreReference,core);assert.equal(JSON.stringify(p),before);
 }
 const r=I.build({answers:Array(25).fill(0),caseContext:'학교가 보호자에게 연락한 뒤 학생이 맞았다고 말했습니다.'},{role});assert.equal(r.safeContactReview,true);assert.match(r.model.situationOverview,/연락 이후 위해/);
}
assert.equal(I.build({answers:Array(25).fill(0),caseContext:''}).active,false);
console.log('PASS V8 added regression: no invented contact violence, 3 roles, unknown total withheld, same core reference, immutable input, genuine contact hazard retained');
const F=require('../docs/youth-risk/case-formulation-v72.js'),C=require('../docs/youth-risk/criteria.js');
for(let i=0;i<100;i++){const p={answers:Array.from({length:25},(_,j)=>(i+j)%6===5?'unknown':(i+j)%5),explicit:[],followups:{},caseContext:i%2?'최근 결석이 반복됨.':'보호자에게 전화한 뒤 학생이 맞았다고 진술함.'};const before=JSON.stringify(p),core=C.evaluate(p.answers,[2,3,3,3,2,2,3,3,2,2],false,{});for(const role of ['teacher','education-welfare','social-worker']){const f=F.build(p,{role});assert.equal(f.version,'8.2-evidence-casework');assert.deepEqual(f.decision,core);assert.ok(f.rows.every(g=>g.teacher!==g.worker));assert.equal(F.text(p,false),F.text({...p,caseContext:''},false));}assert.equal(JSON.stringify(p),before);}
console.log('PASS V8 site integration: 100 × 3 roles, unchanged CORE, distinct paired duties and default narrative-free exports');
