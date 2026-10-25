'use strict';
const assert=require('node:assert/strict');
const Scale=require('../scale-interpretation-v821.js');
const Core=require('../criteria.js');
const Form=require('../case-formulation-v72.js');
const sizes=Scale.DOMAIN_SIZES;
const domains=Scale.DOMAIN_NAMES.map((name,i)=>({name,items:Array(sizes[i]).fill('실제 문항')})); 
const cases=['','최근 퇴거 위기를 겪고 있다.','친구들의 반복 괴롭힘 이후 결석했다.','보호자가 식사 준비를 하지 못해 돌봄 공백이 생겼다.','교실 소음으로 과제 수행이 어렵지만 ADHD 진단 받은 적은 없다.','온라인 성적 협박을 받고 있다고 보고했다.','학교폭력 예방교육을 받았으나 실제 피해는 없었다.','미술 활동을 좋아하지만 친구와 갈등 중이다.'];
let seed=821;function rand(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}
let n=0;for(let i=0;i<5000;i++){const answers=Array.from({length:25},()=>rand()<.05?'unknown':Math.floor(rand()*5));if(i%10===0){answers[19]=4;answers[15]=3}
 const p={answers,domains,followups:{},explicit:[],caseContext:cases[i%cases.length]};
 const a=Core.evaluate(answers,sizes,false,{}),b=Form.build(p),s=b.scale821;
 assert.equal(b.decision.knownTotal,a.knownTotal);
 assert.equal(b.decision.urgent,a.urgent);
 assert.equal(s.items.length,25);
 assert.equal(s.domains.length,10);
 assert.equal(new Set(b.rows.map(x=>x.id)).size,b.rows.length);
 if(answers[19]>=3&&!b.evidence82?.topics?.housing?.length)assert.ok(b.rows.some(x=>x.id==='scale821-q20'||x.id==='e82-housing'||x.id==='e82-score-housing'),'Q20 high never disappears behind care');
 if(answers[19]===0)assert.ok(!b.rows.some(x=>x.id==='scale821-q20'));
 if(answers.includes('unknown'))assert.ok(s.unknownItems.length>0);
 n++;
}
const v=Array(25).fill(0);v[8]=4;v[9]=0;
const check=Scale.assess({answers:v},{topics:{learning:[{id:'E1'}]}});
assert.ok(check.prompts.some(x=>x.id==='attendance-gap'));
assert.ok(check.prompts.some(x=>x.id==='learning-zero'));
console.log('PASS V8.2.1: '+n+' synthetic regressions; CORE unchanged, score-only housing preserved, dedup and discrepancies checked');
