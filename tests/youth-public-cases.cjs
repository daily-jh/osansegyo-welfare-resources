// Independent synthetic regression inputs inspired by public support themes.
// These scores are NOT original case assessments, labels, or clinical ground truth.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../docs/youth-risk/support-model.js'),A=require('../docs/youth-risk/resource-adapter.js'),P=require('../docs/youth-risk/planning-model.js'),AI=require('../docs/youth-risk/personal-ai-model.js'),C=require('../docs/youth-risk/criteria.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),ctx);
const app=fs.readFileSync('docs/youth-risk/app.js','utf8'),routes=vm.runInNewContext(app.match(/var routes=(\[[\s\S]*?\]);/)[1]);
const sources={actual:'https://www.mogef.go.kr/nw/enw/nw_enw_s001d.do?bbtSn=713024&mid=mda703',guide:'https://www.ice.go.kr/upload/ice/na/bbs_2067/2023/12/a7e0b5dfbe1d91d70ea67337349e2448.pdf'};
const fixtures=[
 {id:'public-A-safety-and-school',source:sources.actual,points:{7:1,9:2,17:2},urgent:true,check:/학교생활/,must:['오산시정신건강복지센터','경기도교육청 Wee 프로젝트']},
 {id:'public-B-environment-not-diagnosis',source:sources.actual,points:{9:2,11:2,14:3},check:/장애·진단으로 단정하지/,schoolOnly:true},
 {id:'guide-p33-complex-basic-needs',source:sources.guide,points:{6:2,9:2,10:2,19:3},check:/빈곤/,zone:true},
 {id:'guide-p36-victim-safe-contact',source:sources.guide,points:{1:1,6:2,7:1,17:2,25:1},urgent:true,check:/공동상담·보호자 연락을 자동 진행하지/,must:['오산시아동보호전문기관']},
 {id:'guide-p60-care-with-school',source:sources.guide,points:{9:2,10:2,16:2,18:2,19:2},check:/학생의 부담/,zone:true},
 {id:'control-poverty-alone',points:{19:3},zone:true,notUrgent:true},
 {id:'control-unknown-environment',points:{14:2,15:'unknown'},schoolOnly:true,provisional:true}
];
let runs=0;
for(const f of fixtures)for(const dong of M.dongs)for(const gender of ['남','여','미확인','응답하지 않음']){
 const p={student:{gender,dong},answers:Array(25).fill(0),domains:[2,3,3,3,2,2,3,3,2,2].map((n,i)=>({name:'영역'+i,items:Array(n).fill('합성 검수문항')})),routes,resources:A.rows(ctx.window.WELFARE_DATA),followups:{},explicit:[]};
 for(const [n,value] of Object.entries(f.points))p.answers[n-1]=value;
 assert.ok(M.validate(p));const decision=M.context(p),groups=M.referrals(p),names=groups.map(g=>g.name),checks=M.caseChecks(p).join(' / ');
 if(f.urgent)assert.equal(decision.urgent,true,f.id);if(f.notUrgent)assert.equal(decision.urgent,false,f.id);if(f.provisional)assert.equal(decision.provisional,true);
 if(f.check)assert.match(checks,f.check,f.id);for(const name of f.must||[])assert.ok(names.includes(name),f.id+': '+name);
 if(f.schoolOnly){const gs=M.groupedCandidates(p,M.domains(p)[5]);assert.ok(gs.some(g=>/Wee/.test(g.name)));assert.ok(!gs.some(g=>/장애|발달|하나울/.test(g.name)||g.primary['서비스명']==='심리상담·발달지원 연계'));assert.deepEqual(gs.map(g=>g.name),['경기도교육청 Wee 프로젝트']);}
 if(f.zone){assert.ok(names.includes(M.welfareZone({dong}).name));assert.equal(names.filter(n=>M.welfareZones.some(z=>z.name===n)).length,1);}
 if(f.id==='control-poverty-alone')assert.ok(!names.includes('오산시아동보호전문기관'));
 for(const d of M.domains(p))for(const g of M.groupedCandidates(p,d))for(const row of g.services){const m=M.describe(p,d,row);assert.ok(m.evidence.length);assert.ok(m.evidence.every(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0));}
 const plan=P.analyze(p);assert.deepEqual(M.context(p),decision);assert.ok(plan.plans.every(x=>x.groups.every(g=>names.includes(g.name))));
 const packet=AI.create(p,'teacher','',C);if(f.zone)assert.ok(packet.includes(M.welfareZone({dong}).name));
 runs++;
}
// Source narratives omit many facts: never fill those omissions with zero in an actual assessment.
const unknown=Array(25).fill('unknown');unknown[6]=1;
const incomplete=C.evaluate(unknown,[2,3,3,3,2,2,3,3,2,2],false,{});
assert.equal(incomplete.urgent,true);assert.equal(incomplete.provisional,true);assert.equal(incomplete.level,null);
console.log('PASS: '+runs+' synthetic case × dong × gender checks; 5 public-case themes + 2 controls; no clinical validation or original case scoring claimed');
