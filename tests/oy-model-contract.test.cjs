/* Synthetic model-contract smoke tests. Never use real student data. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=path.join(__dirname,'..','docs','youth-risk');
const load=name=>require(path.join(base,name+'.js'));
const M=load('support-model');
const J=load('journey-model-v88');
const S=load('cie-semantic-layer-v2');
const G=load('model-gateway-v90');
const labels=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const sizes=[2,3,3,3,2,2,3,3,2,2];
const payload=(answers,caseContext='')=>({
 answers:answers.slice(),
 domains:labels.map((name,i)=>({name,items:Array.from({length:sizes[i]},(_,j)=>name+' 문항 '+(j+1))})),
 routes:Array.from({length:10},()=>[]),resources:[],
 explicit:[],followups:{},student:{gender:'미확인',dong:''},caseContext
});
test('loaded executable modules are not mislabeled as independent language models',()=>{
 const statuses=G.status();assert.equal(statuses.length,8);
 for(const m of statuses)assert.equal(m.loaded,true,m.id+' load');
 assert.equal(statuses.find(x=>x.id==='K-CARR').implementation,'native');
 assert.equal(statuses.find(x=>x.id==='K-CARR-output').implementation,'embedded');
 assert.equal(statuses.find(x=>x.id==='ICMS').implementation,'embedded');
 assert.equal(statuses.find(x=>x.id==='CORE').method,'evaluate');
});
test('all-zero case: no automatic service plan',()=>{
 const a=G.analyze(payload(Array(25).fill(0)));
 assert.equal(a.decision.knownTotal,0);
 assert.equal(a.plans.length,0);
 assert.equal(a.pendingDomains.length,0);
 assert.equal(a.modelTrace.audit.ok,true);
});
test('unknown-only cases are verification queues, not service referrals',()=>{
 const answers=Array(25).fill(0);answers[19]='unknown';answers[6]='unknown';
 const a=G.analyze(payload(answers));
 assert.equal(a.decision.incomplete,true);
 assert.equal(a.plans.length,0);
 assert.equal(a.pendingDomains.length,2);
 assert.equal(a.modelTrace.audit.unknownCount,2);
});
test('high-score safety item keeps CORE source score unchanged',()=>{
 const answers=Array(25).fill(0);answers[6]=4;
 const p=payload(answers),a=G.analyze(p);
 assert.equal(a.decision.knownTotal,4);
 assert.equal(p.answers[6],4);
 assert.ok(a.high.some(x=>x.item===7&&x.score===4));
 assert.ok(a.sections.length>=8);
});
test('care-school co-report yields provisional cross-domain hypothesis',()=>{
 const answers=Array(25).fill(0);answers[8]=3;answers[15]=3;
 const a=G.analyze(payload(answers,'요즘 등교와 돌봄이 힘들다고 말함'));
 assert.ok(a.cieActions.some(x=>x.kind==='care-school'));
 assert.equal(a.modelTrace.audit.rawKnownTotal,6);
});
test('item-specific need categories do not invent housing debt or diagnoses',()=>{
 const answers=Array(25).fill(0);answers[18]=3;answers[19]=4;answers[20]=2;
 const a=G.analyze(payload(answers));
 assert.ok(a.plans.some(x=>x.item===19));
 assert.ok(a.plans.some(x=>x.item===20));
 assert.ok(a.plans.some(x=>x.item===21));
 assert.ok(a.plans.every(x=>x.narrativeOnly||x.sourceItemIds.length>0));
});
test('economic unknown sibling is a check, not a proposed service',()=>{
 const answers=Array(25).fill(0);answers[18]=3;answers[20]='unknown';
 const a=G.analyze(payload(answers));
 assert.ok(a.plans.some(x=>x.item===19));
 assert.ok(!a.plans.some(x=>x.item===21));
 assert.ok(a.decision.unknownItems.includes(21));
});
test('independent K-CARR enhances only opted-in narrative reports',()=>{
 const p=payload(Array(25).fill(0),'최근 등교가 어렵고 가족 돌봄 때문에 피곤하다고 말함.');
 const a=G.analyze(p);
 assert.equal(a.kCarr?.abstain,false);
 assert.ok(!G.text(p,'사례사정',false).includes('K-CARR 서술형 분석'));
 assert.ok(G.text(p,'사례사정',true).includes('K-CARR 서술형 분석'));
 assert.equal(a.decision.knownTotal,0);
});
test('unknown remains unknown in semantic interpreter',()=>{
 const answers=Array(25).fill(0);answers[0]='unknown';
 const interpreted=S.interpret(answers);
 assert.ok(interpreted.unknown.some(x=>x.id===1));
});
test('malformed responses do not reach an assessment',()=>{
 assert.throws(()=>G.analyze(payload(Array(24).fill(0))));
});
test('deterministic synthetic 1200-case invariant sweep',()=>{
 let seed=20261026;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let caseId=0;caseId<1200;caseId++){
  const answers=Array.from({length:25},()=>{const x=random();return x<.08?'unknown':Math.floor(random()*5)});
  const p=payload(answers);
  const a=G.analyze(p);
  assert.equal(a.modelTrace.audit.ok,true,'case '+caseId);
  assert.equal(a.decision.knownTotal,answers.filter(Number.isInteger).reduce((s,x)=>s+x,0),'case '+caseId);
  assert.equal(a.plans.some(x=>!x.narrativeOnly&&x.sourceItemIds.length===0),false,'case '+caseId);
  assert.equal(p.answers.every((x,i)=>x===answers[i]),true,'case '+caseId);
  assert.ok(a.sections.length>=8,'case '+caseId);
 }
});
test('K-CARR exports match the selected casework document and explicit privacy scope',()=>{
 const p=payload(Array(25).fill(0),'학생은 최근 결식하고 학교에 지각하며 상담을 원합니다.');
 assert.match(G.text(p,'사례협의',true),/서술형 분석에서 추가 확인할 질문/);
 assert.match(G.text(p,'서비스계획',true),/서술형 분석에 따른 실행 검토안/);
 assert.doesNotMatch(G.text(p,'서비스계획',true),/K-CARR 서술형 분석 · 실무자 검토 초안/);
 assert.match(G.text(p,'사례사정',false),/서술에 따른 심화 해석은 제외됨/);
});
