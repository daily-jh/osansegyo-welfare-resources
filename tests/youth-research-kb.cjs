const assert=require('node:assert/strict');
const K=require('../docs/youth-risk/research-knowledge-base.js');
const L=require('../docs/youth-risk/language-response-model.js');
const M=require('../docs/youth-risk/support-model.js');
const E=require('../docs/youth-risk/evidence-matrix.js');
assert.equal(K.version,'1.0.0');assert.equal(K.entries.length,300);
assert.equal(new Set(K.entries.map(x=>x.id)).size,300);
assert.ok(K.entries.every(x=>x.status==='developer_hypothesis_unvalidated'&&x.refs.length&&x.items.length===2));
const zeros=Array(25).fill(0);assert.equal(K.match(zeros).length,0);
const unknown=Array(25).fill('unknown');assert.equal(K.match(unknown).length,0);
const a=Array(25).fill(0);a[2]=3;a[8]=3;
let got=K.match(a,{limit:5});assert.equal(got.length,1);assert.equal(got[0].id,'PAIR-03-09');
let p={answers:a.slice(),student:{gender:'미확인',dong:'세마동'},explicit:[],followups:{},domains:[],routes:[],resources:[]};
let before=JSON.stringify(p);
let resp=L.buildResponse(p,'교차 문항 해석 근거 설명','', 'teacher',{Map:M,Matrix:E,Research:K});
// The readable answer explains the case; research identifiers remain in detailed evidence.
assert.match(resp.technicalText,/PAIR-03-09/);assert.match(resp.technicalText,/개발가설/);
assert.match(resp.text,/또래 괴롭힘/);assert.match(resp.text,/수업 참여/);assert.doesNotMatch(resp.text,/PAIR-03-09/);assert.equal(JSON.stringify(p),before);
const urgent=Array(25).fill(0);urgent[6]=1;urgent[8]=4;urgent[10]=3;
p.answers=urgent;resp=L.buildResponse(p,'사정 근거','', 'teacher',{Map:M,Matrix:E,Research:K});
assert.match(resp.text,/보호 관련 신호/);
for(let seed of [20261023,23102026]){
 let z=seed;const rnd=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/2**32);
 for(let i=0;i<1500;i++){
   const a=Array.from({length:25},()=>{const n=Math.floor(rnd()*6);return n===5?'unknown':n});
   const frozen=a.slice(), match=K.match(a,{limit:4});
   assert.ok(match.length<=4&&match.every(x=>x.items.every(n=>typeof a[n-1]==='number'&&a[n-1]>=2)));
   assert.deepEqual(a,frozen);
   p.answers=a;
   const r=L.buildResponse(p,'사정 근거 설명','','social-worker',{Map:M,Matrix:E,Research:K});
   assert.ok(r.text.length<20000 && !r.text.includes('위험 확률:'));
   assert.equal(r.audit.raw===null,a.includes('unknown'));
 }
 console.log('PASS research KB with 1500 synthetic cases, seed '+seed);
}
console.log('PASS 300 unique pairs, no-prediction, no mutation, score/unknown/safety stability');
