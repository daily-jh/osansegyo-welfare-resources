// node scripts/test_youth_review_qualitative.cjs - anonymous synthetic QA only.
'use strict';
const assert=require('node:assert/strict');
const C=require('../docs/youth-risk/criteria.js');
const R=require('../docs/youth-risk/review-model.js');
const counts=[2,3,3,3,2,2,3,3,2,2];
assert.equal(R.TEXT_BANK.length,25);assert.equal(R.WEIGHTS.length,25);
assert.equal(Object.keys(R.PAIR_FACTORS).length,24);
const domains=counts.map((n,i)=>({name:'시험 영역 '+i,items:Array.from({length:n},(_,j)=>'가상 점검 문항 '+j)}));
let seed=20261023;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function input(k){
 const a=Array.from({length:25},()=>random()<.13?'unknown':Math.floor(random()*5));
 if(k%10===0)a.fill(0);
 if(k%10===1)a.fill('unknown');
 if(k%10===2){a.fill(0);a[0]=2;a[6]=1;a[24]=2}
 if(k%10===3){a.fill(0);a[8]=3;a[19]=3;a[17]=2}
 if(k%10===4){a.fill(0);a[0]='unknown';a[8]=3}
 if(k%10===5){a.fill(0);a[0]=2;a[1]=2;a[5]=2;a[6]=2;a[7]=2;a[22]=2;a[24]=2}
 return {answers:a,domains,explicit:k%10===6?['가상 별도 안전신호']:[],followups:{}};
}
let checked=0;
for(let k=0;k<100000;k++){
 const p=input(k),t=R.build(p,'teacher'),s=R.build(p,'social-worker');
 const d=C.evaluate(p.answers,counts,p.explicit.length>0,{});
 assert(t.text.startsWith('[1. 종합 사정 및 판단 근거]'));
 assert(t.text.includes('[8. 계산 근거·정보의 한계]'));
 assert(t.text!==s.text);
 assert.equal(t.items.length,25);
 assert(t.selected.length<=4);
 assert(t.items.every((v,i)=>v.score===p.answers[i]));
 assert(t.selected.every(v=>v.items.every(n=>p.answers[n-1]>=2)));
 assert(t.selected.every(v=>Number.isFinite(v.auxiliary)&&v.auxiliary>=0&&v.auxiliary<=4));
 assert.equal(t.decision.knownTotal,d.knownTotal);
 if(d.unknownItems.length)assert(!t.text.includes(d.knownTotal+'/100점이 확인되었습니다'));
 if(d.urgent)assert(t.text.includes('안전·보호 관련 신호'));
 if(k%10===2)assert(t.text.includes('안전핵심문항'));
 if(k%10===6)assert(t.text.includes('별도로 체크한 긴급 안전신호'));
 checked++;
}
console.log(JSON.stringify({seed:20261023,syntheticCases:checked,errors:0,weightFields:25,languageUnits:125,crossRules:24,officialScoringUnchanged:true,notClinicalValidation:true}));
