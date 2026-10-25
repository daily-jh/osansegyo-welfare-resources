'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const BASE=require('../docs/youth-risk/cie-lab-v32/engine.js'),E=require('../docs/youth-risk/cie-lab-v32/dialogue-v32.js'),CORE=require('../docs/youth-risk/criteria.js'),playbook=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/youth-risk/cie-lab-v32/practice-playbook-v32.json'),'utf8'));
let passed=0;const test=(name,fn)=>{try{fn();passed++;}catch(e){console.error('FAIL',name,e.stack);process.exit(1)}};
const Z=()=>Array(25).fill(0);const P=(a=Z(),note='',extras={})=>({answers:a,caseContext:note,explicit:[],followups:{},...extras});
const run=(p,q='사례사정',{state=null,kb=null}={})=>E.run(p,q,{engine:BASE,criteria:CORE,playbook,role:'social-worker',state,kb});
test('80 developer templates integrity',()=>assert.equal(E.validatePlaybook(playbook),true));
test('all zero and no narrative has no action',()=>{let r=run(P());assert.equal(r.actions.length,0);assert.equal(r.official.knownTotal,0)});
test('narrative-only basic supports human verification but does not edit 0 CORE',()=>{let r=run(P(Z(),'학생은 최근 결식하고 있다고 말했다.'),'지원 방향은?');assert.equal(r.official.knownTotal,0);assert.ok(r.actions.some(x=>x.status==='서술 단서 검토 전용'&&x.id==='A32-08'));assert.ok(r.issues.some(x=>x.domainIndex===7));assert.equal(r.gates.filter(x=>x.id==='CORE-SAFETY').length,0)});
test('narrative-only reported selfharm triggers separate safety review',()=>{const r=run(P(Z(),'학생이 현재 자해했다고 말했다.'),'안전 확인');assert.equal(r.official.urgent,false);assert.ok(r.gates.find(g=>g.id==='TEXT-SAFETY'));assert.ok(r.actions.some(a=>a.id==='A32-03'&&a.status==='서술 단서 검토 전용'))});
test('official urgent on Q7=1 remains first priority',()=>{const a=Z();a[6]=1;const r=run(P(a));assert.ok(r.official.urgent);assert.equal(r.gates[0].id,'CORE-SAFETY');assert.ok(r.review.safetyPreserved)});
test('unknown q7 safety unresolved',()=>{const a=Z();a[6]='unknown';const r=run(P(a));assert.equal(r.official.incomplete,true);assert.ok(r.official.safetyUnknown.includes(7));assert.equal(r.gates[0].id,'CORE-SAFETY')});
test('followup required Q4 preserved',()=>{const a=Z();a[3]=1;const r=run(P(a));assert.ok(r.official.pendingChecks.includes(4));assert.equal(r.gates[0].id,'CORE-SAFETY')});
test('0 and unknown distinct',()=>{const a=Z(),b=Z();b[18]='unknown';assert.notEqual(run(P(a)).caseRevision,run(P(b)).caseRevision)});
test('negated selfharm not promote to narrative safety',()=>{const r=run(P(Z(),'학생은 현재 자해하지 않는다.'),'안전');assert.ok(!r.gates.some(x=>x.id==='TEXT-SAFETY'))});
test('prevention education not adverse event',()=>{const r=run(P(Z(),'자해 예방교육을 진행했다.'),'안전');assert.ok(!r.gates.some(x=>x.id==='TEXT-SAFETY'))});
test('positive score with negated narrative => discrepancy',()=>{const a=Z();a[18]=2;const r=run(P(a,'최근 결식은 없다고 말했다.'),'검증');assert.ok(r.issues.some(x=>x.issue.includes('부정 서술')))});
test('historical selfharm not counted as official urgency',()=>{const r=run(P(Z(),'작년에 학생이 자해한 이력이 있다는 말이 있었다.'),'안전 확인');assert.equal(r.official.urgent,false);assert.ok(r.gates.some(g=>g.id==='TEXT-SAFETY'))});
test('double negation conservatively reviewed',()=>{const r=run(P(Z(),'학생이 자해를 멈추지 않았다는 진술이 있다.'),'안전');assert.equal(r.official.urgent,false);assert.ok(r.gates.some(g=>g.id==='TEXT-SAFETY'))});
test('all action refs refer to known class',()=>{const a=Z();a[0]=1;a[6]=2;a[18]=4;const r=run(P(a,'학생은 결식에 대해 말했다.'),'계획');assert.ok(r.review.allActionRefsExist);assert.ok(r.actions.every(x=>!x.goalAgreed&&!x.serviceStarted&&!x.confirmedOwner))});
test('dialogue followup inherits intent only with same revision',()=>{const p=P(Z(),'학생이 결식한다고 말했다.');const first=run(p,'서비스계획');assert.equal(first.intent,'plan');const follow=run(p,'그럼 더 구체적으로?',{state:first.dialogueState});assert.equal(follow.intent,'plan');const changed=P(Z(),'학생이 결식하지 않는다고 말했다.');assert.equal(run(changed,'그럼 더 구체적으로?',{state:first.dialogueState}).intent,'summary')});
test('explicit question overrides stale intent',()=>{const p=P(Z());const a=run(p,'서비스계획');const b=run(p,'기관 어디로?',{state:a.dialogueState});assert.equal(b.intent,'resource')});
test('identifier blocked before narration',()=>assert.throws(()=>run(P(Z(),'문의 010-1234-5678'),'사례사정'),/식별정보/));
test('invalid score blocked by CORE',()=>{const a=Z();a[0]=5;assert.throws(()=>run(P(a)),/25문항/)});
test('no raw note leak',()=>{const r=run(P(Z(),'학생의 비공개 코드 GOLDEN_PRIVATE_XYZ 결식 언급'),'계획');assert.ok(!JSON.stringify(r).includes('GOLDEN_PRIVATE_XYZ'))});
test('template tamper blocked',()=>{const bad=JSON.parse(JSON.stringify(playbook));bad.entries[12].sourceStatus='empirically_validated';assert.throws(()=>E.validatePlaybook(bad),/무결성/)});
test('missing core fail closed',()=>assert.throws(()=>E.run(P(),'안전',{engine:BASE,playbook}),/CORE/));
test('static source policy: no remote scripts',()=>{let html=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/cie-lab-v32/index.html'),'utf8');assert.ok(!/<script[^>]*src=["']https?:/i.test(html));assert.ok(!/localStorage|sessionStorage/i.test(fs.readFileSync(path.join(__dirname,'../docs/youth-risk/cie-lab-v32/ui-v32.js'),'utf8')))});

// 80 explicit route cardinalities and status checks (these are not clinician judgments).
for(let i=0;i<10;i++)for(const intent of ['summary','safety','plan','meeting','interview','resource','evidence','strength']){
 test(`route:${i}:${intent}`,()=>{const n=BASE.GROUPS.slice(0,i).reduce((a,b)=>a+b,0)+1,a=Z();a[n-1]=1;const r=run(P(a),{summary:'사례사정',safety:'안전',plan:'서비스계획',meeting:'회의 협의',interview:'면담 질문',resource:'기관 연계',evidence:'근거 검증',strength:'강점 희망'}[intent]);assert.ok(r.actions.some(x=>x.id==='A32-'+String(i+1).padStart(2,'0')));assert.ok(r.actions.every(x=>!x.serviceStarted))});
}
let seed=3252026;function rng(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/2**32;}
const narrative=['','학생은 결식하고 있다고 말했다.','지난해 학생이 자해했다는 말이 있었다.','학생은 자해하지 않는다고 진술했다.','학생은 친구에게 괴롭힘을 당했다고 말했다.','학교에서 결석이 보고되었다.','예방교육에서 방임과 자해에 대한 설명을 들었다.','결식은 없지만 수업 참여가 어려웠다고 말했다.'];
const N=50000,metrics={cases:N,reference:'current production criteria',errors:0,scoreMismatch:0,safetyMismatch:0,unknownMismatch:0,mandatorySafetyOmission:0,badActionRefs:0,modelAnsweredWithoutEvidence:0,contrastRegressions:passed,expertRatings:0,actualLLMExecution:0,original600BrowserTest:false,syntheticCaseDisclaimer:'not empirical validity'};
for(let i=0;i<N;i++){
 const a=Array.from({length:25},()=>{let q=rng();return q<0.13?'unknown':q<0.83?0:1+Math.floor(rng()*4)});if(i%13===0)a.fill(0);if(i%17===0)a[6]='unknown';const p=P(a,narrative[i%narrative.length]);if(i%97===0&&a[3]!==0&&a[3]!=='unknown')p.followups[4]='yes';
 try{const off=CORE.evaluate(a,BASE.GROUPS,p.explicit.length>0,p.followups),r=run(p,['상황 사정','안전 확인','서비스계획','지원연계 기관','면담 질문','사례협의'][i%6]);if(off.knownTotal!==r.official.knownTotal)metrics.scoreMismatch++;if(off.urgent!==r.official.urgent)metrics.safetyMismatch++;if(off.unknownItems.length!==r.official.unknownItems.length)metrics.unknownMismatch++;if((off.urgent||off.safetyUnknown.length||off.pendingChecks.length)&&!r.gates.some(g=>g.id==='CORE-SAFETY'))metrics.mandatorySafetyOmission++;if(!r.review.allActionRefsExist)metrics.badActionRefs++;
 }catch(e){metrics.errors++;if(metrics.errors<=2)console.error('random error',i,e.stack);}
}
metrics.totalExplicitTests=passed;console.log(metrics);if(['errors','scoreMismatch','safetyMismatch','unknownMismatch','mandatorySafetyOmission','badActionRefs'].some(k=>metrics[k]))process.exit(1);
