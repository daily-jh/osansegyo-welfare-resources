const assert=require('node:assert/strict');
const R=require('../docs/youth-risk/common-scale-report-v1.js');
const C=require('../docs/youth-risk/criteria.js');
const S=require('../docs/youth-risk/scale-interpretation-v821.js');
const p=a=>({answers:a,explicit:[],followups:{}}),zeros=()=>Array(25).fill(0);
let a=zeros();assert.equal(R.build(p(a)).type.id,'observe');
a[9]=2;assert.equal(R.build(p(a)).type.id,'focused');
a[5]=3;a[9]=3;assert.equal(R.build(p(a)).type.id,'combined');
a[18]=3;assert.equal(R.build(p(a)).type.id,'intensive');
a=zeros();a[6]=1;assert.match(R.build(p(a)).title,/安全|안전확인 우선/);
a=zeros();a[3]=1;assert.match(R.build(p(a)).title,/확정 보류/);
assert.equal(R.build(p(Array(25).fill('unknown'))).type.id,'unknown');
a=zeros();a[2]=2;a[8]=3;assert.deepEqual(R.build(p(a)).cross[0].items,[3,9]);
let seed=26026;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
for(let k=0;k<1000;k++){
 const payload=p(Array.from({length:25},()=>{const n=Math.floor(rand()*6);return n===5?'unknown':n;}));
 payload.explicit=k%19===0?['현재 위해']:[];payload.followups={4:k%3===0?'yes':'no'};
 const before=JSON.stringify(payload),r=R.build(payload),core=C.evaluate(payload.answers,S.DOMAIN_SIZES,!!payload.explicit.length,payload.followups);
 assert.equal(JSON.stringify(payload),before);assert.deepEqual(r.core,core);
 assert.equal(r.rows.length,10);assert.equal(r.core.knownTotal,payload.answers.reduce((n,v)=>n+(typeof v==='number'?v:0),0));
 if(core.provisional)assert.match(r.title,/보류/);
 for(const x of r.cross)assert(x.items.every(n=>payload.answers[n-1]>0));
 assert(!/undefined|NaN/.test(R.html(r)+R.text(r)));
 const withText=R.build({...payload,caseContext:'PRIVATE_NARRATIVE_SENTINEL'});assert.deepEqual(withText,r);
}
assert.throws(()=>R.build(p(Array(25).fill(null))));assert.throws(()=>R.build(p(Array(25).fill(5))));
console.log('PASS: 4 types, safety/pending/unknown/cross fixtures, 1000 seeded CORE equality/immutability/privacy/output checks');
