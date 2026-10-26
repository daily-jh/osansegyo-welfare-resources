'use strict';
/* Fully synthetic data only — internal algorithm regression, not validation of predictive validity. */
const assert=require('node:assert/strict');
const Index=require('../docs/youth-risk/integrated-index-v1.js');
const Core=require('../docs/youth-risk/criteria.js');
const MapModel=require('../docs/youth-risk/support-model.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
const payload=(answers,caseContext='',explicit=[],followups={})=>({
 answers:answers.slice(),domains:sizes.map((n,i)=>({name:'시험 영역 '+i,items:Array.from({length:n},(_,j)=>'합성 문항 '+i+'-'+j)})),
 routes:sizes.map(()=>[]),resources:[],explicit,followups,caseContext,
 student:{gender:'미확인',dong:''}
});
const original=Array(25).fill(0);
const zero=Index.analyze(payload(original));
assert.equal(zero.tier,1);assert.equal(zero.raw,0);assert.equal(zero.unknown,0);assert.equal(zero.official.knownTotal,0);
assert.equal(Index.analyze(payload(Array(25).fill(4))).tier,5);
const mild=original.slice();mild[0]=1;
const mildAnalysis=Index.analyze(payload(mild));
assert.equal(mildAnalysis.tier,2,'1-point safety must not automatically become grade 5');
assert.equal(mildAnalysis.safetyFloor,2);
const severe=original.slice();severe[6]=4;
assert.equal(Index.analyze(payload(severe)).tier,5,'high selfharm flag must prioritize protection');
assert.equal(Index.analyze(payload(original,'',['긴급 위해 확인'])).tier,5,'explicit urgent flag must be decisive');
const pending=original.slice();pending[6]='unknown';
const partial=Index.analyze(payload(pending));
assert.equal(partial.tier,null);assert.equal(partial.unknown,1);assert.equal(partial.complete,false);
assert.ok(partial.raw===0,'unknown must not silently add to raw score');
const cross=original.slice();cross[5]=3;cross[15]=3; // emotional and family care
const crossIndex=Index.analyze(payload(cross));
assert.ok(crossIndex.activePairs.some(x=>x.id==='emotion-care'));
const isolated=original.slice();isolated[5]=3;
assert.ok(crossIndex.crossScore>Index.analyze(payload(isolated)).crossScore);

const careAttend=Array(25).fill(0);careAttend[15]=3;careAttend[17]=3;careAttend[8]=2;
assert.ok(Index.analyze(payload(careAttend)).tier>=3,'care + attendance with 3-point concentration must trigger coordinated support');
const schoolEmotion=Array(25).fill(0);schoolEmotion[8]=3;schoolEmotion[5]=2;
assert.ok(Index.analyze(payload(schoolEmotion)).tier>=3,'school 3 and emotional 2 must avoid dilution by 25-question total');

assert.equal(Index.analyze(payload(original,'그 학생이 자해했다는 가정 예시입니다')).raw,0);
const textSafety=Index.analyze(payload(original,'학생 본인이 지금 자해를 시도했다고 말했다.'));
assert.ok(textSafety.tier>=4,'current student safety cue triggers support priority without CORE mutation');
assert.equal(textSafety.raw,0,'narrative must never become a scored CORE response');
const incompleteProtect=original.slice();incompleteProtect[5]='unknown';incompleteProtect[6]=4;
const inc=Index.analyze(payload(incompleteProtect));
assert.equal(inc.composite,null,'missing answers never receive invented complete index');
assert.ok(inc.tier>=5,'observed serious CORE safety item still opens protective support path');
const positive=Index.analyze(payload(cross,'학생이 등교 어려움과 돌봄 부담을 느낀다고 말했다.'));
assert.ok(positive.composite>=crossIndex.composite,'positive narrative cannot suppress already recorded priority');

assert.throws(()=>Index.analyze(payload([0])),/PAYLOAD_INVALID/);
let seed=20261026;
function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
let completed=0,partialCases=0;
for(let i=0;i<20000;i++){
 const ans=Array.from({length:25},()=>rnd()<.13?'unknown':Math.floor(rnd()*5));
 const p=payload(ans);
 const pre=JSON.stringify(p.answers);
 const x=Index.analyze(p);
 const official=MapModel.context(p);
 assert.equal(JSON.stringify(p.answers),pre,'must never change official response vector');
 assert.equal(x.raw,official.knownTotal);
 assert.equal(x.official.knownTotal,official.knownTotal);
 assert.equal(x.official.urgent,official.urgent);
 assert.equal(x.unknown,official.unknownItems.length);
 assert.equal(x.domainRows.length,10);
 for(const v of [x.crossScore,x.weighted,x.criticalScore,x.narrative].filter(x=>x!==null)){
  assert.ok(Number.isFinite(v)&&v>=0&&v<=100,'indicator must be normalized and finite');
 }
 if(x.complete){completed++;assert.ok(x.tier>=1&&x.tier<=5);assert.ok(x.composite>=0&&x.composite<=100)}
 else {partialCases++;assert.equal(x.composite,null);if(x.safetyFloor!==null){assert.ok(x.tier>=x.safetyFloor&&x.tier<=5,'observed safety path remains actionable')}else assert.equal(x.tier,null);}
}
assert.ok(partialCases>0&&completed>=0);
console.log('PASS OY-RALS 5-level index: 20,000 synthetic cases; CORE invariant, red-flag gates, unknown treatment, normalized axes and domain crosses.');
