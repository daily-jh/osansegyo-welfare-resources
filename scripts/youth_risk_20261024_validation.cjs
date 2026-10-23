#!/usr/bin/env node
'use strict';
// Reproducible, synthetic-only OY-RALS evaluation. NO identifiable student data.
// node scripts/youth_risk_20261024_validation.cjs [caseCount] [seed]
const {evaluate}=require('../docs/youth-risk/criteria.js');
const {WEIGHTS}=require('../docs/youth-risk/review-model.js');
const {createFixture,GROUPS}=require('./youth_risk_100k_audit.js');
const {analyze}=require('../docs/youth-risk/planning-model.js');
const N=Number(process.argv[2]||500000),SEED=Number(process.argv[3]||20261024);
if(!Number.isInteger(N)||N<1||N>1000000||!Number.isInteger(SEED))throw Error('Invalid n/seed');
function random(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const rand=random(SEED),m={n:N,seed:SEED,scenarios:Array(10).fill(0),failures:{},samples:[],urgent:0,incomplete:0,pending:0,safetyUnknown:0,levels:[0,0,0,0],weightPositive:0,weightDiffersFromRaw:0,monotonicChecks:0};
function fail(kind,i,msg){m.failures[kind]=(m.failures[kind]||0)+1;if(m.samples.length<12)m.samples.push({case:i,kind,detail:String(msg).slice(0,90)});}
const sumW=WEIGHTS.reduce((a,b)=>a+b,0), t=Date.now();
for(let i=0;i<N;i++){
 const {p,stratum}=createFixture(rand,i);m.scenarios[stratum]++;
 const a=p.answers;let d;try{d=evaluate(a,GROUPS,p.explicit.length>0,p.followups)}catch(e){fail('exception',i,e);continue;}
 const known=a.filter(x=>typeof x==='number'),total=known.reduce((x,y)=>x+y,0),unknown=25-known.length;
 const safety=[1,2,7,25].some(n=>a[n-1]>0);
 const followup=[4,5,12,13].some(n=>a[n-1]>=(n===4?1:3)&&p.followups[n]==='yes');
 const expectedUrgent=safety||p.explicit.length>0||followup;
 if(d.urgent!==expectedUrgent)fail('urgent',i,d.title);
 if(d.knownCount!==known.length||d.knownTotal!==total||d.knownMaximum!==known.length*4||total>100||total<0)fail('score',i,total);
 if(d.incomplete!==Boolean(unknown)||(unknown>0?d.level!==null:d.level!==d.observedLevel))fail('unknown',i,d.level);
 if(d.provisional!==Boolean(unknown||d.pendingChecks.length))fail('provisional',i,d.provisional);
 if(d.observedLevel<0||d.observedLevel>3)fail('level',i,d.observedLevel);
 const weighted=a.reduce((s,v,k)=>s+(typeof v==='number'?v/4*WEIGHTS[k]:0),0);
 if(weighted<0||weighted>sumW+1e-8)fail('weight',i,weighted);
 if(weighted>0)m.weightPositive++;
 if(total>0&&Math.abs(weighted/sumW*100-total)>0.01)m.weightDiffersFromRaw++;
 if(i%10===0){
  const k=Math.floor(rand()*25);
  if(typeof a[k]==='number'&&a[k]<4){
   const b=a.slice();b[k]++;
   const next=evaluate(b,GROUPS,p.explicit.length>0,p.followups);
   m.monotonicChecks++;
   if(next.observedLevel<d.observedLevel||(d.urgent&&!next.urgent))fail('monotonic',i,k+1);
  }
 }
 if(d.urgent)m.urgent++;
 if(d.incomplete)m.incomplete++;
 if(d.pendingChecks.length)m.pending++;
 if(d.safetyUnknown.length)m.safetyUnknown++;
 m.levels[d.observedLevel]++;
}
// 80 designed synthetic situations. Intentionally not an external expert gold standard.
const labels=['학대·방임','또래피해·갈등','우울·불안','출결·학습','행동·건강','발달·교육접근','돌봄·가족','생계·주거','고립·지지','디지털 이용'];
const variants=['초기 불편','반복적 어려움','높은 단일위기','생활영역 복합위기','가족돌봄·교육권 중첩','주거·고립 연관','새로 확인된 자해 신호','안전 정보 미상'];
const anchors=[1,3,6,9,12,14,16,19,22,24];
const domains=GROUPS.map((n,i)=>({name:labels[i],items:Array.from({length:n},(_,k)=>labels[i]+' 확인문항 '+(k+1))}));
const scenarios=[];const set=(a,n,v)=>{if(a[n-1]!=='unknown')a[n-1]=Math.max(a[n-1],v);};
for(let di=0;di<10;di++)for(let vi=0;vi<8;vi++){
 const a=Array(25).fill(0),q=anchors[di];set(a,q,[1,2,4,3,3,2,2,2][vi]);
 if(vi===1)set(a,Math.min(q+1,25),1);
 if(vi===2)set(a,Math.min(q+1,25),2);
 if(vi===3){set(a,6,2);set(a,9,3);set(a,19,3);}
 if(vi===4){set(a,9,3);set(a,18,3);}
 if(vi===5){set(a,20,2);set(a,23,3);}
 if(vi===6)set(a,7,1);
 if(vi===7){a[[1,2,7,25][di%4]-1]='unknown';set(a,23,1);}
 const p={answers:a,domains,explicit:[],followups:{},routes:GROUPS.map(()=>[]),resources:[],includedDomains:[0,1,2,3,4,5,6,7,8,9]};
 const result=evaluate(a,GROUPS,false,{}),plan=analyze(p);
 const expectedSafety=[1,2,7,25].some(n=>a[n-1]>0), expectedHold=a.includes('unknown');
 const primaryPlan=plan.active.some(x=>x.name===labels[di]);
 scenarios.push({id:di*8+vi+1,area:labels[di],variant:variants[vi],answers:a,expectedSafety,systemSafety:result.urgent,expectedHold,systemHold:result.incomplete,observedLevel:result.observedLevel,primaryPlan,planCount:plan.plans.length});
}
m.synthetic80={n:scenarios.length,safetyMatch:scenarios.filter(x=>x.expectedSafety===x.systemSafety).length,missingMatch:scenarios.filter(x=>x.expectedHold===x.systemHold).length,primaryPlan:scenarios.filter(x=>x.primaryPlan).length,primaryNotPlanned:scenarios.filter(x=>!x.primaryPlan).map(x=>x.id)};
m.wallMs=Date.now()-t;m.totalFailures=Object.values(m.failures).reduce((a,b)=>a+b,0);
console.log(JSON.stringify({metrics:m,syntheticCases:scenarios},null,2));
if(m.totalFailures||m.synthetic80.safetyMatch!==80||m.synthetic80.missingMatch!==80)process.exitCode=1;
