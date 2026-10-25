'use strict';
/* OY-CIE daily 1024 synthetic QA: read-only CORE and public KB. No live student data. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/youth-risk');
const C=require(path.join(dir,'criteria.js')),B=require(path.join(dir,'cie-lab-v32/engine.js')),D=require(path.join(dir,'cie-lab-v32/dialogue-v32.js')),P=require(path.join(dir,'research-knowledge-base.js'));
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const kb=read('data/response-knowledge-600-v1.json'),pb=read('cie-lab-v32/practice-playbook-v32.json'),idx=read('cie-lab-v32/compiled-routing-index.json');
const args=process.argv.slice(2),arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];},out=path.resolve(arg('--out')||'audit/oy-cie-daily');
const today=arg('--date')||new Date().toISOString().slice(0,10),prevPath=arg('--previous');
if(!/^20\d{2}-\d{2}-\d{2}$/.test(today))throw Error('Invalid date');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0,20);
let seed=parseInt(hash('OY-CIE:'+today).slice(0,8),16),rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296},pick=n=>Math.floor(rand()*n);
const labels=['zero','safety_unknown','core_safety','followup_pending','score_positive','text_selfharm','negated_selfharm','historical_selfharm','third_person','narrative_food','contradictory_food','peer_attendance','care_basic','long_tail_safety','followup_question','random_domains'];
const notes=['','학생이 최근 자해를 생각한다고 말했다.','학생은 자해하지 않는다고 말했다.','지난해 학생이 자해했으나 지금은 그런 생각이 없다고 말했다.','보호자가 자해했고 학생은 자해하지 않았다고 말했다.','학생은 최근 결식하고 있다고 말했다.','최근 결식은 없다고 말했다.','학생이 친구들에게 괴롭힘을 당해 결석이 늘었다고 말했다.','동생을 돌보느라 식사를 거른다고 말했다.','학교에서 자해 예방교육을 실시했다.','학생은 불안하고 등교가 어렵다고 말했다.','생활비 문제로 필요한 치료를 받기 어렵다는 말이 있었다.'];
const questions=['사례사정','안전 확인','서비스계획','지원연계 기관','면담 질문','근거 검증','강점 희망','그럼 더 구체적으로?'];
function fixture(g,i){
 const a=Array.from({length:25},()=>rand()<.12?'unknown':rand()<.8?0:1+pick(4));
 let n='',followups={},explicit=[];
 if(g!=='random_domains')a.fill(0);
 if(g==='safety_unknown')a[[0,1,6,24][i%4]]='unknown';
 if(g==='core_safety')a[[0,1,6,24][i%4]]=1+pick(4);
 if(g==='followup_pending')a[[3,4,11,12][i%4]]=4;
 if(g==='score_positive')a[[2,5,8,9,14,16,18,21][i%8]]=1+pick(4);
 if(g==='text_selfharm')n=notes[1];
 if(g==='negated_selfharm')n=i%2?notes[2]:notes[9];
 if(g==='historical_selfharm')n=notes[3];
 if(g==='third_person')n=notes[4];
 if(g==='narrative_food')n=notes[5];
 if(g==='contradictory_food'){a[18]=2+pick(3);n=notes[6];}
 if(g==='peer_attendance'){a[2]=2;a[8]=2;n=notes[7];}
 if(g==='care_basic'){a[15]=1;a[17]=2;a[18]=3;n=notes[8];}
 if(g==='long_tail_safety')n=(notes[10]+' ').repeat(110)+notes[1];
 if(g==='followup_question'){a[9]=2;n=notes[10];}
 if(g==='random_domains')n=notes[i%notes.length];
 if(g==='random_domains'&&i%19===0)explicit=['현장 별도 안전확인 필요'];
 if(g==='followup_pending'&&i%13===0)followups[4]='unknown';
 return {answers:a,caseContext:n,followups,explicit};
}
const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
function canonical(rows,shape){
 const first=new Map(),aliases=[];
 for(const row of rows){const key=hash(shape(row)),seen=first.get(key);if(!seen){first.set(key,row.id||key);}else aliases.push({canonicalId:seen,aliasId:row.id||key,reason:'same_scope_and_exact_normalized_meaning'});}
 return {records:rows.length,unique:first.size,duplicates:aliases.length,aliases,canonicalIds:[...first.values()]};
}
const itemDedupe=canonical(kb.entries,r=>({kind:r.kind,item:r.item,score:r.score,vantage:r.vantage,rule:r.rule,state:r.state,sources:r.sources,interpretation:normalize(r.interpretation),reviewQuestion:normalize(r.reviewQuestion),teacherAnswer:normalize(r.teacherAnswer),caseManagerAnswer:normalize(r.caseManagerAnswer),avoid:normalize(r.avoid)}));
const templateDedupe=canonical(pb.entries,r=>({domainIndex:r.domainIndex,intent:r.intent,status:r.sourceStatus,guidance:normalize(r.guidance),question:normalize(r.question),action:normalize(r.action)}));
const pairDedupe=canonical(P.entries,r=>({items:(r.items||[]).slice().sort((a,b)=>a-b),interpretation:normalize(r.interpretation),counter:normalize(r.counter),question:normalize(r.question),status:r.status}));
const routeKeys=new Set((idx.rows||[]).map(r=>JSON.stringify(r)));
const corpus=B.corpusCheck(kb);D.validatePlaybook(pb);
if(idx.count!==5550||routeKeys.size>5550)throw Error('Routing catalog invalid');
const stats={date:today,timezone:'Asia/Seoul',categoryCount:Object.fromEntries(labels.map(l=>[l,0])),requested:1024,executed:0,exceptions:0,coreMismatch:0,safetyMismatch:0,unknownMismatch:0,mandatorySafetyMissing:0,brokenEvidenceRefs:0,unwantedServiceApproval:0,privacyLeak:0,technicalOnly:true,expertRatings:0,corpusCount:corpus.loaded,pairCount:P.entries.length,templateCount:pb.recordCount,routeCount:idx.count};
const faults=[];
for(let k=0;k<1024;k++){
 const type=labels[Math.floor(k/64)],p=fixture(type,k);stats.categoryCount[type]++;
 try{
  const official=C.evaluate(p.answers,B.GROUPS,p.explicit.length>0,p.followups);
  const res=D.run(p,questions[(k+pick(questions.length))%questions.length],{engine:B,criteria:C,kb,playbook:pb,route:idx,pairModel:P,role:['teacher','social-worker','education-welfare'][k%3]});
  stats.executed++;
  const issues=[];
  if(official.knownTotal!==res.official.knownTotal)issues.push('coreMismatch');
  if(official.urgent!==res.official.urgent)issues.push('safetyMismatch');
  if(official.unknownItems.length!==res.official.unknownItems.length)issues.push('unknownMismatch');
  if((official.urgent||official.safetyUnknown.length||official.pendingChecks.length)&&!res.gates.some(g=>g.id==='CORE-SAFETY'))issues.push('mandatorySafetyMissing');
  if(!res.review.allActionRefsExist)issues.push('brokenEvidenceRefs');
  if(res.actions.some(a=>a.serviceStarted||a.goalAgreed||a.confirmedOwner))issues.push('unwantedServiceApproval');
  if(p.caseContext&&p.caseContext.length>15&&JSON.stringify(res).includes(p.caseContext))issues.push('privacyLeak');
  for(const code of issues){stats[code]++;faults.push({key:hash([type,code]),category:type,code,severity:['coreMismatch','safetyMismatch','mandatorySafetyMissing','privacyLeak'].includes(code)?'critical':'major'});}
 }catch(e){stats.exceptions++;faults.push({key:hash([type,'exception',String(e.message).slice(0,100)]),category:type,code:'exception',severity:'critical',message:String(e.message).slice(0,140)});}
}
const previous=prevPath&&fs.existsSync(prevPath)?JSON.parse(fs.readFileSync(prevPath,'utf8')):{findings:[]};
const cumulative=new Map((previous.findings||[]).map(x=>[x.key,x]));
for(const f of faults){const old=cumulative.get(f.key);if(old){old.lastSeen=today;old.observations++;}else cumulative.set(f.key,{...f,firstSeen:today,lastSeen:today,observations:1,status:'review_required'});}
const unique=[...cumulative.values()].sort((a,b)=>a.key.localeCompare(b.key)),uniqueToday=new Set(faults.map(x=>x.key)).size;
stats.uniqueFailuresToday=uniqueToday;stats.cumulativeUniqueFindings=unique.length;stats.duplicateFailureObservations=faults.length-uniqueToday;
stats.dedup={researchKB:{total:itemDedupe.records,unique:itemDedupe.unique,duplicates:itemDedupe.duplicates},templates:{total:templateDedupe.records,unique:templateDedupe.unique,duplicates:templateDedupe.duplicates},pairs:{total:pairDedupe.records,unique:pairDedupe.unique,duplicates:pairDedupe.duplicates},route:{total:idx.rows.length,unique:routeKeys.size,duplicates:idx.rows.length-routeKeys.size}};
const blocker=['exceptions','coreMismatch','safetyMismatch','unknownMismatch','mandatorySafetyMissing','brokenEvidenceRefs','unwantedServiceApproval','privacyLeak'].some(k=>stats[k]>0);
stats.verdict=blocker?'REVIEW_BLOCKED':'SYNTHETIC_TECHNICAL_PASS';stats.operationalCoreModified=false;stats.autopatchedMain=false;
fs.mkdirSync(path.join(out,'runs'),{recursive:true});
const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2));
write('latest.json',stats);write('cumulative.json',{schema:'OY-CIE-cumulative-unique-finding-v1',findings:unique});
write('dedupe-review.json',{status:'review_only_do_not_modify_origins',publicResearchKB:itemDedupe,templates:templateDedupe,crossPairs:pairDedupe,route:stats.dedup.route});
write('canonical-index.json',{schema:'oy-cie.public-canonical-index.v1',reviewOnly:true,originalSourcesUnmodified:true,responseEntryIds:itemDedupe.canonicalIds,playbookEntryIds:templateDedupe.canonicalIds,crossHypothesisEntryIds:pairDedupe.canonicalIds,uniqueRoutingKeys:[...routeKeys]});
write('patch-proposals.json',{status:'requires_human_approval',proposals:[...new Set(faults.map(x=>x.code))].map(code=>({code,fixTarget:code.includes('core')?'CORE_IMMUTABLE':'CIE_NONCORE_REVIEW',steps:['reproduce','propose_draft_patch','independent_tests','expert_review','reviewed_PR'],autoDeploy:false}))});
write('runs/'+today+'.json',{stats,uniqueFailureKeysToday:[...new Set(faults.map(x=>x.key))]});
const md='# OY-CIE daily audit · '+today+'\n\n- UTC 00:00 / Asia/Seoul 09:00 (GitHub scheduler may delay)\n- Synthetic cases: '+stats.executed+'/1024 in 16 categories\n- Exceptions / CORE / safety / unknown / mandatory safety / evidence / privacy: '+['exceptions','coreMismatch','safetyMismatch','unknownMismatch','mandatorySafetyMissing','brokenEvidenceRefs','privacyLeak'].map(x=>stats[x]).join(' / ')+'\n- Identical-source-scope DB duplicate candidates: '+[itemDedupe.duplicates,templateDedupe.duplicates,pairDedupe.duplicates,idx.rows.length-routeKeys.size].join(' / ')+'\n- Cumulative unique incident classes: '+unique.length+'\n- Verdict: '+stats.verdict+'\n- Fixed official CORE, no identifiable student records; no automatic main-branch patch. Duplicate source candidates require human review.\n';
fs.writeFileSync(path.join(out,'summary.md'),md);console.log(md);
if(blocker)process.exitCode=1;