#!/usr/bin/env node
'use strict';
// v2.2 synthetic technical audit. No real student records or personal data.
// node scripts/youth_risk_v22_500k_audit.cjs 500000 [output.json]
const fs=require('node:fs'),path=require('node:path');
const criteria=require('../docs/youth-risk/criteria.js');
const weights=require('../docs/youth-risk/weight-model.js');
const support=require('../docs/youth-risk/support-model.js');
const {createFixture,GROUPS}=require('./youth_risk_100k_audit.js');
const N=Number(process.argv[2]||500000),seed=20261024;
if(!Number.isInteger(N)||N<1||N>1000000)throw Error('expected 1..1000000 synthetic inputs');
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
// Exact pre-v2.2 comparator: same domain evidence, without new pending-check or context-weight tie-break.
function oldRank(ds){return ds.slice().sort((a,b)=>Number(b.safety)-Number(a.safety)||Number(b.safetyUnknown)-Number(a.safetyUnknown)||Number(b.critical)-Number(a.critical)||b.peak-a.peak||Number(b.concentrated)-Number(a.concentrated)||(b.mean||0)-(a.mean||0)||a.i-b.i);}
const random=rng(seed),start=Date.now(),failures={},firstErrors=[];
const strata=Array.from({length:10},()=>({n:0,priorityChanged:0,urgent:0,unknown:0,pending:0}));
const m={version:weights.VERSION,seed,n:N,failures,firstErrors,strata,urgent:0,unknown:0,pending:0,levels:[0,0,0,0],scoreMin:100,scoreMax:0,priorityChanged:0,top3SetChanged:0,pendingPromoted:0,contextWeightActivations:0,weightRange:[Infinity,0]};
function fail(kind,index,message){failures[kind]=(failures[kind]||0)+1;if(firstErrors.length<15)firstErrors.push({index,kind,detail:String(message).slice(0,160)});}
for(let i=0;i<N;i++){
 const {p,stratum}=createFixture(random,i);strata[stratum].n++;
 try{
  const d=criteria.evaluate(p.answers,GROUPS,Boolean(p.explicit.length),p.followups);
  const known=p.answers.filter(v=>typeof v==='number'),total=known.reduce((s,v)=>s+v,0);
  if(d.knownTotal!==total||d.knownCount!==known.length||d.knownMaximum!==known.length*4||total>100)fail('raw_score',i,total);
  if(d.incomplete!==p.answers.includes('unknown')||(d.level===null)!==d.incomplete)fail('unknown',i,d.title);
  const expectedUrgent=Boolean(p.explicit.length)||[1,2,7,25].some(n=>p.answers[n-1]>0)||[4,5,12,13].some(n=>p.answers[n-1]>=(n===4?1:3)&&p.followups[n]==='yes');
  if(d.urgent!==expectedUrgent)fail('safety',i,d.title);
  const domains=support.domains(p),old=oldRank(domains).filter(x=>x.sum>0),now=support.rank(domains).filter(x=>x.sum>0);
  if(old.map(x=>x.i).join(',')!==now.map(x=>x.i).join(',')){m.priorityChanged++;strata[stratum].priorityChanged++;}
  const a=new Set(old.slice(0,3).map(x=>x.i)),b=new Set(now.slice(0,3).map(x=>x.i));
  if([...a].some(x=>!b.has(x))||[...b].some(x=>!a.has(x)))m.top3SetChanged++;
  if(d.pendingChecks.length&&now.length&&now[0].safetyCheckPending&&!old.slice(0,1).some(x=>d.pendingChecks.some(n=>x.numbers.includes(n))))m.pendingPromoted++;
  const w=weights.audit(p.answers);
  if(w.rawKnownTotal!==total||w.knownCount!==known.length||w.incomplete!==d.incomplete)fail('weight_consistency',i,total);
  if(w.weights.length!==25||w.weights.some((v,k)=>v<weights.BASE_WEIGHTS[k]-1e-9||v>weights.BASE_WEIGHTS[k]*1.12+1e-9))fail('weight_bounds',i,w.weights.join(','));
  if(w.domains.some(x=>x.mean!==null&&(!Number.isFinite(x.mean)||x.mean<0||x.mean>4)))fail('domain_strength',i,i);
  w.weights.forEach((v,k)=>{if(p.answers[k]>0&&v>weights.BASE_WEIGHTS[k]+1e-8)m.contextWeightActivations++;m.weightRange[0]=Math.min(m.weightRange[0],v);m.weightRange[1]=Math.max(m.weightRange[1],v);});
  if(d.urgent){m.urgent++;strata[stratum].urgent++;}
  if(d.incomplete){m.unknown++;strata[stratum].unknown++;}
  if(d.pendingChecks.length){m.pending++;strata[stratum].pending++;}
  m.levels[d.observedLevel]++;m.scoreMin=Math.min(m.scoreMin,total);m.scoreMax=Math.max(m.scoreMax,total);
 }catch(e){fail('exception',i,e.stack||String(e));}
}
m.wallMs=Date.now()-start;m.totalFailures=Object.values(failures).reduce((s,v)=>s+v,0);
m.disclaimer='Developer-generated synthetic data. Passing invariants does not establish psychometric or predictive validity.';
const output=JSON.stringify(m,null,2);
console.log(output);
if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),output+'\n','utf8');
if(m.totalFailures)process.exitCode=1;
