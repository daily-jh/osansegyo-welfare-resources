'use strict';
// OY-RALS V8.6 deployed-model smoke and invariant test: node tests/v86-site-integration.cjs
const assert=require('node:assert/strict');
const C=require('../criteria.js');
const F=require('../case-formulation-v72.js');
const Forms=require('../case-form-model.js');
const S=require('../scale-interpretation-v821.js');
const groups=S.DOMAIN_SIZES,domains=S.DOMAIN_NAMES.map((name,i)=>({name,items:Array(groups[i]).fill('문항')}));
let seed=86025;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const text=[
'','중학교 3학년 학생이 미술을 좋아한다. 수학 수업은 어렵고 복지관 프로그램에 참여 중이다.',
'보호자와 진로 문제로 다투었다. 그러나 가정폭력이나 학대는 발생하지 않았다고 말했다.',
'학생이 죽고 싶다고 말했다. 현재 안전 여부는 미확인이다.',
'집에서 보호자에게 맞았다고 학생이 말했다. 귀가가 두렵다고 진술했다.',
'학교폭력 피해 여부 미확인이다.',
'퇴거 위기로 공부할 공간이 없고 보호자 근로로 돌봄 공백이 있다.',
'온라인 성적 사진을 유포하겠다는 협박을 받고 있다.',
'학교폭력 예방교육을 받았고 실제 피해는 없다고 말했다.',
'학생의 보호자는 아침에 일하고 학생은 친구와 갈등이 있다.'
];
let n=0;for(let i=0;i<5000;i++){
 let answers=Array.from({length:25},()=>rand()<.08?'unknown':rand()<.36?0:Math.floor(rand()*5));
 if(i%11===0)answers=Array(25).fill(0);
 if(i%7===0){answers[19]=4;answers[15]=3}
 const p={answers,caseContext:text[i%text.length],domains,followups:{},explicit:[]};
 const core=C.evaluate(answers,groups,false,{}),x=F.build(p),f=Forms.build(p);
 assert.equal(x.version,'8.6-integrated');assert.equal(x.decision.knownTotal,core.knownTotal);assert.equal(x.decision.urgent,core.urgent);
 assert.equal(x.canonical86.core.officialDecision,x.decision);
 const ids=x.canonical86.ICMS.goals.map(g=>g.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(Object.values(x.canonical86.documents).every(doc=>JSON.stringify(doc.goalIds)===JSON.stringify(ids)));
 for(let j=0;j<25;j++)if(answers[j]>=3)assert.ok(ids.includes('Q'+String(j+1).padStart(2,'0')),'high item missing: '+(j+1));
 assert.equal(f.version,'8.6-shared-case-state');
 if(i%text.length===2&&!core.urgent)assert.equal(x.safety,false,'negative family abuse must not be inferred');
 if(i%text.length===3)assert.equal(x.safety,true,'direct selfharm statement not erased by uncertainty');
 n++;
}
const q=Array(25).fill(0),p=(v)=>({answers:q,caseContext:v,domains,followups:{},explicit:[]});
for(const [v,expected] of [['학교폭력 피해 여부 미확인이다.',false],['학교폭력 예방교육을 받았다. 실제 피해는 없었다.',false],['학생은 자해한 적이 없다고 말했다.',false],['학생이 자해했다고 말했다. 현재 안전 여부 미확인이다.',true]]){
 assert.equal(F.build(p(v)).safety,expected,v)
}
console.log('PASS OY-RALS V8.6: 5000 synthetic cases + safety contrast probes; CORE unchanged, goal linkage consistent');
