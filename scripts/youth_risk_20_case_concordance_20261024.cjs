#!/usr/bin/env node
'use strict';
/**
 * Retrospective published-case narrative stress audit, NOT empirical predictive validation.
 * The candidate items and primary-domain comparator are developer-coded from a SINGLE
 * published award collection, not blinded or independent expert scoring. All unsupported
 * items are 'unknown', never zero. The 1/2/3 severity values are counterfactual ASSUMPTIONS.
 * No real or identifiable student data are stored.
 *
 * Run: node scripts/youth_risk_20_case_concordance_20261024.cjs
 */
const fs=require('node:fs'),path=require('node:path');
const GROUPS=[2,3,3,3,2,2,3,3,2,2];
const criteria=require('../docs/youth-risk/criteria.js');
const planning=require('../docs/youth-risk/planning-model.js');
const register=fs.readFileSync(path.resolve(__dirname,'../docs/youth-risk/public-case-20-evidence-register-20261024.md'),'utf8');
const records=register.split('\n').filter(x=>/^\| R\d{2}\s*\|/.test(x)).map(s=>{
 const f=s.split('|').slice(1,-1).map(x=>x.trim());
 return {id:f[0],title:f[3],items:f[5].split('·').map(Number)};
});
if(records.length!==20)throw Error('Expected exactly 20 published cases');
const primary={
 R01:2,R02:2,R03:2,R04:1,R05:0,R06:2,R07:0,R08:2,R09:2,R10:2,
 R11:1,R12:5,R13:2,R14:2,R15:4,R16:2,R17:5,R18:0,R19:0,R20:1
};
const uncertain={
 R03:[1],R04:[9],R08:[13],R10:[13],R11:[3],R12:[15],R13:[24],
 R15:[5],R17:[3],R19:[16]
};
const safetySet=new Set(['R01','R02','R03','R05','R06','R07','R08','R12','R13','R16','R18','R19']);
const names=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강',
 '교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const base={domains:GROUPS.map((size,i)=>({name:names[i],items:Array(size).fill('검토 문항')})),
 explicit:[],followups:{},routes:GROUPS.map(()=>[]),resources:[]};
function evaluate(row,mode,randomScore){
 const active=row.items.filter(n=>mode==='high'||!(uncertain[row.id]||[]).includes(n));
 const answers=Array(25).fill('unknown');
 for(const n of active)answers[n-1]=randomScore?randomScore():mode==='low'?1:mode==='central'?2:3;
 const p={...base,answers},a=planning.analyze(p),decision=criteria.evaluate(answers,GROUPS,false,{});
 const target=primary[row.id];
 return {id:row.id,known:active.length,unknown:25-active.length,raw:decision.knownTotal,
 urgent:decision.urgent,expectedSafety:safetySet.has(row.id),pending:decision.pendingChecks.length,
 provisional:decision.incomplete,observedLevel:decision.observedLevel,
 primaryTop3:a.active.slice(0,3).some(x=>x.i===target),
 primaryPlan:a.plans.some(x=>x.domain.i===target),
 primaryDomain:names[target],ranked:a.active.slice(0,3).map(x=>x.i),
 planCount:a.plans.length};
}
function stats(cases){
 let safety={tp:0,tn:0,fp:0,fn:0};
 for(const c of cases){
  if(c.urgent&&c.expectedSafety)safety.tp++;
  else if(!c.urgent&&!c.expectedSafety)safety.tn++;
  else if(c.urgent)safety.fp++;
  else safety.fn++;
 }
 return {n:cases.length,safety,top3:cases.filter(x=>x.primaryTop3).length,
 plans:cases.filter(x=>x.primaryPlan).length,
 provisional:cases.filter(x=>x.provisional).length,
 meanPlans:cases.reduce((s,x)=>s+x.planCount,0)/cases.length,
 knownMean:cases.reduce((s,x)=>s+x.known,0)/cases.length,
 observedLevels:Array.from({length:4},(_,i)=>cases.filter(x=>x.observedLevel===i).length)};
}
const modes={};
for(const mode of ['low','central','high']){
 const all=records.map(x=>evaluate(x,mode));
 modes[mode]={summary:stats(all),cases:all};
}
let seed=20261024;
function rand(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const stress=[],byCase={};
for(const row of records){
 const x={n:1000,top3:0,plan:0,unconfirmed:0};
 for(let j=0;j<1000;j++){
  const c=evaluate(row,'central',()=>1+Math.floor(rand()*3));
  x.top3+=Number(c.primaryTop3);x.plan+=Number(c.primaryPlan);
  x.unconfirmed+=Number(c.provisional);stress.push(c);
 }
 byCase[row.id]=x;
}
const output={basis:'Published narratives, developer-coded candidates. Not independent criterion or predictive validity.',revision:'2026-10-24',seed:20261024,modes,
 stress:{summary:stats(stress),byCase}};
console.log(JSON.stringify(output,null,2));
if(modes.central.summary.n!==20||stress.length!==20000)process.exitCode=1;
