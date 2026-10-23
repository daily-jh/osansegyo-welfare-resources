/* Synthetic-only stress test. Do not use real student data or infer validity, sensitivity, specificity or risk cutoffs. */
(function(root){'use strict';
const GROUPS=[2,3,3,3,2,2,3,3,2,2];
const NAMES=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const ROUTES=['오산시아동보호전문기관','오산시청소년상담복지센터','경기도교육청 Wee 프로젝트','오산세교종합사회복지관','오산시 동 행정복지센터'];
const MOCK_RESOURCES=[
 ['오산시아동보호전문기관','피해아동·가족 사례관리','아동'],
 ['오산시청소년상담복지센터','청소년 상담','청소년'],
 ['경기도교육청 Wee 프로젝트','학교 상담','청소년'],
 ['오산세교종합사회복지관','사례관리','주민'],
 ['오산시 동 행정복지센터','긴급복지 상담','주민']
].map(([n,s,t])=>({'기관명':n,'서비스명':s,'지원대상':t,'주요내용':s,'지원분야':s}));
function random(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}}
function createFixture(rand,index){
 const stratum=index%10,answers=Array(25).fill(0),integer=(lo,hi)=>lo+Math.floor(rand()*(hi-lo+1)),choose=ns=>ns[integer(0,ns.length-1)];
 const domains=GROUPS.map((n,i)=>({name:NAMES[i],items:Array.from({length:n},(_,j)=>NAMES[i]+' 확인문항 '+(j+1))}));
 const p={answers,domains,explicit:[],followups:{},routes:GROUPS.map(()=>ROUTES.slice()),resources:MOCK_RESOURCES,includedDomains:Array.from({length:10},(_,i)=>i)};
 if(stratum===1){for(let z=0;z<integer(1,3);z++)answers[integer(0,24)]=1;}
 if(stratum===2){let i=choose([0,1,2,3,4,5,6,7,8,9]);let offset=GROUPS.slice(0,i).reduce((a,b)=>a+b,0);for(let n=offset;n<offset+GROUPS[i];n++)answers[n]=integer(0,4);}
 if(stratum===3){for(let d=0;d<4;d++){let i=integer(0,9),offset=GROUPS.slice(0,i).reduce((a,b)=>a+b,0);answers[offset+integer(0,GROUPS[i]-1)]=integer(2,4);}}
 if(stratum===4){for(let z=0;z<integer(1,12);z++)answers[integer(0,24)]='unknown';for(let z=0;z<5;z++){let i=integer(0,24);if(answers[i]!=='unknown')answers[i]=integer(1,3);}}
 if(stratum===5){answers[choose([0,1,6,24])]='unknown';for(let z=0;z<5;z++){let i=integer(0,24);if(answers[i]!== 'unknown' && ![0,1,6,24].includes(i))answers[i]=integer(0,2);}}
 if(stratum===6){answers[choose([0,1,6,24])]=integer(1,4);for(let z=0;z<3;z++){let i=integer(0,24);if(![0,1,6,24].includes(i))answers[i]=integer(0,4);}}
 if(stratum===7){p.explicit=['별도 긴급 안전신호(합성 입력)'];}
 if(stratum===8){let n=choose([4,5,12,13]);answers[n-1]=n===4?integer(1,4):integer(3,4);p.followups[n]='yes';}
 if(stratum===9){for(let i=0;i<25;i++)answers[i]=rand()<.12?'unknown':integer(0,4);for(let n of [4,5,12,13])if(answers[n-1]>=(n===4?1:3))p.followups[n]=choose(['yes','no','unknown']);if(rand()<.10)p.explicit=['별도 위험'];}
 return {p,stratum};
}
function run(apis,{cases=100000,seed=20261023,documentEvery=250}={}){
 if(!apis?.criteria?.evaluate||!apis?.planning?.analyze||!apis?.matrix?.evaluate||!apis?.guidance?.firstQuestions)throw Error('Missing real model APIs');
 const rng=random(seed),metrics={seed,cases,scenarioCounts:Array(10).fill(0),zero:0,urgent:0,incomplete:0,safetyUnknown:0,pending:0,provisional:0,level:[0,0,0,0],crossCases:0,crossMatches:0,crossRuleCoverage:{},planSum:0,planMax:0,reportSamples:0,reportCharacters:0,failures:0,byInvariant:{},firstErrors:[],timings:{},invalidInputChecks:0},start=Date.now();
 const fail=(name,index,detail)=>{metrics.failures++;metrics.byInvariant[name]=(metrics.byInvariant[name]||0)+1;if(metrics.firstErrors.length<25)metrics.firstErrors.push({i:index,name,detail:String(detail).slice(0,220)})};
 for(let i=0;i<cases;i++){
  const {p,stratum}=createFixture(rng,i);metrics.scenarioCounts[stratum]++;
  try{
   const d=apis.criteria.evaluate(p.answers,GROUPS,p.explicit.length>0,p.followups),a=apis.planning.analyze(p),cross=apis.matrix.evaluate(p,'social-worker');
   const presentSafety=[1,2,7,25].some(n=>p.answers[n-1]>0);
   const safetyFollowup=[4,5,12,13].some(n=>p.followups[n]==='yes'&&p.answers[n-1]>=(n===4?1:3));
   const expectedUrgent=p.explicit.length>0||presentSafety||safetyFollowup;
   const known=p.answers.filter(v=>typeof v==='number'),unknown=p.answers.filter(v=>v==='unknown').length;
   if(d.urgent!==expectedUrgent)fail('urgent_mismatch',i,p.answers.join(','));
   if(Boolean(a.safetyPlan)!==expectedUrgent)fail('safety_plan_mismatch',i,d.title);
   if(d.knownCount!==known.length||d.knownTotal!==known.reduce((x,y)=>x+y,0))fail('score_math',i,d.knownTotal);
   if(d.incomplete!==(unknown>0)||Boolean(d.level===null)!==(unknown>0))fail('unknown_is_zero_or_final',i,d.level);
   if(d.knownMaximum!==known.length*4)fail('known_denominator',i,d.knownMaximum);
   if(unknown&&/\/100점/.test(d.description))fail('false_100_conversion',i,d.description);
   if(a.plans.length>10||stratum===0&&a.plans.length>0||stratum===7&&a.plans.length>0)fail('unnecessary_plans',i,a.plans.length);
   if(a.defaultDomains.length>10)fail('default_overflow',i,a.defaultDomains.length);
   if(a.defaultDomains.filter(id=>!a.domains[id]?.safety).length>3)fail('default_non_safety_gt3',i,a.defaultDomains);
   if(cross.shown.length>5)fail('cross_display_overflow',i,cross.shown.length);
   if(cross.patterns.some(x=>x.items.some(n=>!(p.answers[n-1]>=2))))fail('cross_without_evidence',i,'rule fired without 2+');
   if(cross.count>apis.matrix.RULES.length)fail('cross_count_overflow',i,cross.count);
   const questions=apis.guidance.firstQuestions(p,'teacher');
   if(questions.some(q=>!(p.answers[q.number-1]>0)))fail('question_without_evidence',i,questions);
   if(stratum===7&&!d.urgent)fail('zero_plus_explicit_safety',i,d.title);
   if(stratum===5&&d.safetyUnknown.length===0 && ![0,1,6,24].every(n=>p.answers[n]!=='unknown'))fail('unknown_safety_missing',i,'');
   if(stratum===9&&unknown===0&&d.knownTotal>100)fail('score_over100',i,d.knownTotal);
   if(stratum===0||stratum===7)metrics.zero++;
   if(d.urgent)metrics.urgent++;if(d.incomplete)metrics.incomplete++;if(d.safetyUnknown.length)metrics.safetyUnknown++;if(d.pendingChecks.length)metrics.pending++;
   if(d.provisional)metrics.provisional++;if(d.level!==null)metrics.level[d.level]++;
   if(cross.count){metrics.crossCases++;metrics.crossMatches+=cross.count;for(const x of cross.patterns)metrics.crossRuleCoverage[x.id]=(metrics.crossRuleCoverage[x.id]||0)+1;}
   metrics.planSum+=a.plans.length;metrics.planMax=Math.max(metrics.planMax,a.plans.length);
   if(apis.docs&&apis.examples&&i%documentEvery===0){
     const t=apis.docs.render(p,'teacher','assessment'),w=apis.docs.render(p,'social-worker','assessment'),plan=apis.docs.render(p,'social-worker','plan');
     if(!t||!w||!plan||t===w)fail('role_or_plan_render',i,'missing/different');
     if(expectedUrgent&&!w.includes('긴급 안전개입 계획'))fail('report_lost_safety',i,'');
     if(unknown&&!w.includes('잠정 보고서'))fail('report_lost_unknown',i,'');
     if(cross.count&&!w.includes('교차사정'))fail('report_lost_cross',i,'');
     metrics.reportSamples++;metrics.reportCharacters+=t.length+w.length+plan.length;
   }
  }catch(e){fail('exception',i,e.stack||e.message)}
 }
 const invalids=[[Array(24).fill(0),false],[Array(25).fill(-1),false],[Array(25).fill(5),false],[Array(25).fill('unknown'),true]];
 for(const [data,good] of invalids){try{apis.criteria.evaluate(data,GROUPS,false,{});if(!good)fail('bad_input_accepted',-1,'invalid answers accepted')}catch(e){if(good)fail('valid_unknown_rejected',-1,e.message)}metrics.invalidInputChecks++}
 metrics.timings.wallMs=Date.now()-start;metrics.averagePlans=metrics.planSum/cases;metrics.avgCrossMatches=metrics.crossMatches/cases;
 return metrics;
}
const api={run,createFixture,GROUPS,NAMES};if(typeof module!=='undefined')module.exports=api;else root.YouthAudit100k=api;
})(typeof window!=='undefined'?window:globalThis);
