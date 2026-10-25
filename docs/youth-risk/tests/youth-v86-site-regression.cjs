'use strict';
const assert=require('node:assert/strict');
const Criteria=require('../criteria.js'),Form=require('../case-formulation-v72.js'),Needs=require('../case-form-model.js'),Scale=require('../scale-interpretation-v821.js');
const sizes=Scale.DOMAIN_SIZES,domains=Scale.DOMAIN_NAMES.map((name,i)=>({name,items:Array(sizes[i]).fill('평가 문항')}));
let seed=860;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const narratives=[
 '중학교 3학년 학생은 미술에 관심이 있으나 수학 수업이 어렵다. 보호자 근로 때문에 저녁 식사를 못 챙긴다.',
 '학교폭력 예방교육을 받았다. 학생에게 실제 피해는 없었다고 하였다.',
 '학생은 보호자와 진로 문제로 다투었다. 그러나 가정폭력이나 학대는 발생하지 않았다.',
 '학생은 어제 죽고 싶다고 말했고 자해 흔적이 발견됐다. 현재 안전 여부는 미확인이다.',
 '학생은 보호자에게 집에서 맞았다고 말했다. 귀가가 걱정된다고 하였다.',
 '퇴거 위기 때문에 가족은 현재 머물 곳이 없다. 학생은 지역 복지관 프로그램에 참여 중이다.',
 '온라인 성적 사진을 유포하겠다는 협박을 받고 있다.',
 '친구 갈등으로 관계가 위축되었고 방과후 활동이 부담스럽다.',
 '학생은 가족과 안정적으로 생활하고 식사를 규칙적으로 한다.',
 ''
];
let n=0;
for(let i=0;i<5000;i++){
 let answers=Array.from({length:25},()=>rnd()<.09?'unknown':rnd()<.42?0:Math.ceil(rnd()*4));
 if(i%5===0){answers=Array(25).fill(0);answers[19]=4;answers[15]=3;}
 if(i%5===1)answers=Array(25).fill(0);
 const p={answers,caseContext:narratives[i%narratives.length],domains,explicit:[],followups:{}};
 const core=Criteria.evaluate(answers,sizes,false,{}),r=Form.build(p),form=Needs.build(p);
 assert.equal(r.decision.knownTotal,core.knownTotal,'official score remains unchanged');
 assert.equal(r.decision.urgent,core.urgent,'official urgent gate remains unchanged');
 assert.equal(r.version,'8.6-integrated');
 assert.equal(form.version,'8.6-shared-case-state');
 const ids=r.rows.map(x=>x.canonicalId);
 assert.equal(new Set(ids).size,ids.length);
 if(answers[19]>=3)assert.ok(ids.includes('Q20'),'high housing item retained');
 for(const doc of Object.values(r.canonical86.documents))assert.deepEqual(doc.goalIds,r.canonical86.documents.assessment.goalIds);
 if(i%10===2&&!core.urgent)assert.equal(r.safety,false,'family conflict with violence denied is not confirmed violence');
 if(i%10===3)assert.equal(r.safety,true,'affirmed self harm is separately reviewed');
 n++;
}
console.log('PASS V8.6 site integration: '+n+' synthetic permutations, CORE unchanged and CaseState consistent');
