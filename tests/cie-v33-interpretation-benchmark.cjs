'use strict';
/* OY-CIE v3.3: design-labeled synthetic interpretation sampling, not a clinical benchmark. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),dir=path.join(ROOT,'docs/youth-risk');
const C=require(path.join(dir,'criteria.js')),B=require(path.join(dir,'cie-lab-v32/engine.js')),D=require(path.join(dir,'cie-lab-v32/dialogue-v32.js'));
const S=require(path.join(dir,'cie-semantic-layer-v2.js')),K=require(path.join(dir,'k-carr-narrative-v81.js'));
const kb=JSON.parse(fs.readFileSync(path.join(dir,'data/response-knowledge-600-v1.json'),'utf8'));
const playbook=JSON.parse(fs.readFileSync(path.join(dir,'cie-lab-v32/practice-playbook-v32.json'),'utf8'));
const samples=JSON.parse(fs.readFileSync(path.join(dir,'data/cie-v33-interpretation-seeds.json'),'utf8'));
B.corpusCheck(kb);D.validatePlaybook(playbook);
assert.equal(samples.schema,'OY-CIE-interpretation-samples-v3.3');
const targets=samples.categories.flatMap(x=>x.variants.map(v=>({...v,cue:x.cue,domainIndex:x.domainIndex,sourceId:x.id})));
assert.equal(targets.length,36);
let seed=0x33C1E2026;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296};
const choice=a=>a[Math.floor(rand()*a.length)];
const SCORE_LEVELS=[0,1,2,3,4,'unknown'],ROLES=['teacher','education-welfare','social-worker'];
const QUESTIONS=['사례사정과 학생 상황은?','현재 안전을 확인하려면?','개입계획 초안을 만들어줘','사례협의 회의 준비 질문은?','면담 질문을 정리해줘','지원연계 기관과 접수 조건은?','척도-서술 불일치 근거 검증','학생 희망과 강점을 확인하려면?'];
const profiles=['zero','single','multi','all_unknown','safety_known','safety_unknown','followup','narrative_only','negated','historical','pair','random_sparse','mixed_sources','long_context','highest_item','role_switch'];
const safeText=x=>x.replace(/\s+/g,' ').normalize('NFKC').trim();
const inputKey=p=>crypto.createHash('sha256').update(JSON.stringify([p.answers,p.explicit,p.followups,p.caseContext])).digest('hex').slice(0,24);
function fixture(i){
 const profile=profiles[i%profiles.length],a=Array(25).fill(0),seedItem=1+(i%25),typ=targets[(Math.floor(i/profiles.length)+i%31)%targets.length];let note=typ.text,explicit=[],followups={};
 if(profile==='single')a[seedItem-1]=1+(i%4);
 if(profile==='multi'){a[8]=2;a[15]=3;a[18]=1;}
 if(profile==='all_unknown')a.fill('unknown');
 if(profile==='safety_known')a[[0,1,6,24][i%4]]=1+i%4;
 if(profile==='safety_unknown')a[[0,1,6,24][i%4]]='unknown';
 if(profile==='followup')a[[3,4,11,12][i%4]]=1+(i%4);
 if(profile==='narrative_only')a.fill(0);
 if(profile==='negated')note=choice(samples.categories).variants[1].text;
 if(profile==='historical')note=choice(samples.categories).variants[2].text;
 if(profile==='pair'){a[2]=2;a[8]=2;a[18]=2;}
 if(profile==='random_sparse')for(let j=0;j<3;j++){const n=Math.floor(rand()*25);a[n]=choice(SCORE_LEVELS);}
 if(profile==='mixed_sources')note=typ.text+' 학생의 강점과 희망은 직접 확인되지 않았다고 말했다.';
 if(profile==='long_context')note=('학생은 학교에서 도움이 필요하다고 말했다. ').repeat(32)+typ.text;
 if(profile==='highest_item')a[seedItem-1]=4;
 if(profile==='role_switch')a[seedItem-1]='unknown';
 if(i%97===0)explicit=['현재 안전에 대한 실무자 확인 필요'];
 if(i%191===0)followups={'4':'unknown'};
 if(i%17===0)a[18]='unknown';
 return {p:{answers:a,caseContext:note,explicit,followups},typ,profile};
}
const counts={requested:120000,executed:0,exceptions:0,coreScoreMismatch:0,coreSafetyMismatch:0,unknownMismatch:0,missingCoreSafetyGate:0,missingNarrativeEvidenceRefs:0,unconfirmedServiceClaim:0,unexpectedIdentifiableText:0,discordantKCarr:0,patterns:profiles.length,categories:samples.categories.length,roles:ROLES.length,questionTypes:QUESTIONS.length,semanticContrasts:{positive:0,negated:0,historical:0},positivesWithEvidence:0,negativesPromotedAsPresent:0,qualitativeReviewerJudgments:0,neuralModelExecution:0,groundTruthAccuracy:null};
const archive=[],unknownCases=[],faults=[],responseDedup=new Set(),shapeDedup=new Set(),negativeExamples=[],seedContrasts=[];
let uniqueSeen=0;
for(const cat of samples.categories)for(const v of cat.variants){
 const matched=B.parseNarrative(v.text).signals.find(x=>x.type===cat.cue);
 if(!matched||matched.status!==v.status)seedContrasts.push({sourceId:cat.id,expected:v.status,observed:matched?.status||'not_matched',text:v.text});
}
counts.seedContrastTests=targets.length;counts.seedContrastFailures=seedContrasts.length;
function check(caseId,i,runner){
 const {p,typ,profile}=fixture(i),q=QUESTIONS[Math.floor(i/profiles.length)%QUESTIONS.length],role=ROLES[Math.floor(i/QUESTIONS.length)%ROLES.length];
 const before=JSON.stringify(p.answers),base=C.evaluate(p.answers,B.GROUPS,p.explicit.length>0,p.followups);
 const result=D.run(p,q,{engine:B,criteria:C,kb,playbook,role});
 if(before!==JSON.stringify(p.answers))throw Error('CORE_INPUT_MUTATED');
 if(base.knownTotal!==result.official.knownTotal)counts.coreScoreMismatch++;
 if(base.urgent!==result.official.urgent||base.safetyUnknown.length!==result.official.safetyUnknown.length)counts.coreSafetyMismatch++;
 if(base.unknownItems.length!==result.official.unknownItems.length)counts.unknownMismatch++;
 if((base.urgent||base.pendingChecks.length||base.safetyUnknown.length)&&!result.gates.some(g=>g.id==='CORE-SAFETY'))counts.missingCoreSafetyGate++;
 if(!result.review.allActionRefsExist)counts.missingNarrativeEvidenceRefs++;
 if(result.actions.some(x=>x.goalAgreed||x.serviceStarted||x.confirmedOwner))counts.unconfirmedServiceClaim++;
 if(result.answer.includes(p.caseContext))counts.unexpectedIdentifiableText++;
 if(typ.status==='negated'){counts.semanticContrasts.negated++;
  if(p.caseContext===typ.text&&/^(selfharm|protection|threat)$/.test(typ.cue)&&result.gates.some(x=>x.id==='TEXT-SAFETY')){
    counts.negativesPromotedAsPresent++;if(negativeExamples.length<30)negativeExamples.push({caseId,sourceId:typ.sourceId,profile,kind:typ.cue,note:p.caseContext,signals:B.parseNarrative(p.caseContext).signals.filter(x=>['selfharm','protection','threat'].includes(x.type)).map(x=>({type:x.type,status:x.status}))});
  }
}
 if(typ.status==='historical')counts.semanticContrasts.historical++;
 if(typ.status==='reported_unverified')counts.semanticContrasts.positive++;
 if(result.actions.some(x=>x.evidenceIds.some(id=>id.includes(typ.cue))))counts.positivesWithEvidence++;
 const signature=crypto.createHash('sha256').update(JSON.stringify([role,result.intent,result.actions.map(x=>x.id),result.issues.map(x=>x.issue),result.gates.map(x=>x.id)])).digest('hex').slice(0,20);
 shapeDedup.add(signature);
 const key=JSON.stringify([role,result.intent,safeText(result.answer)]),newUnique=!responseDedup.has(key);
 if(newUnique){responseDedup.add(key);uniqueSeen++;
 const sample={caseId,sourceId:typ.sourceId,profile,kind:typ.status,role,intent:result.intent,official:{knownTotal:base.knownTotal,unknownCount:base.unknownItems.length,urgent:base.urgent},evidence:result.actions.map(x=>({domainId:x.id,evidenceIds:x.evidenceIds,status:x.status})),gates:result.gates.map(g=>g.id),answer:result.answer,modelStatus:"synthetic_unvalidated",notExpertRated:true};
 if(archive.length<1600)archive.push(sample);
 else {const j=Math.floor(rand()*uniqueSeen);if(j<1600)archive[j]=sample;}
}
 if(runner&&i%67===0){const k=K.assess({caseContext:p.caseContext,role});const kcarrSafety=!!k.hasSafetySignal,cieTextSafety=result.gates.some(g=>g.id==='TEXT-SAFETY');
 if(kcarrSafety!==cieTextSafety)counts.discordantKCarr++;
 unknownCases.push({caseId,sourceId:typ.sourceId,kind:typ.status,role,profile,kCarrSafetyFlag:kcarrSafety,cieTextSafetyReview:cieTextSafety,disagreement:kcarrSafety!==cieTextSafety,officialCOREUrgent:base.urgent,corpusSafetyItems:S.interpret(p.answers).safety.length,agreementNotGroundTruth:true,expertReviewStatus:'not_reviewed'});
}
 counts.executed++;
}
const START=Date.now();
for(let i=0;i<counts.requested;i++)try{check('SYN-'+String(i+1).padStart(6,'0'),i,true);}catch(e){counts.exceptions++;if(faults.length<100)faults.push({caseId:'SYN-'+String(i+1).padStart(6,'0'),error:String(e.message).slice(0,230),profile:profiles[i%profiles.length]});}
counts.uniqueResponsePatterns=responseDedup.size;counts.uniqueEvidenceShapes=shapeDedup.size;counts.representativeStored=archive.length;counts.deepCrossModelCompared=unknownCases.length;counts.elapsedMs=Date.now()-START;
const release=path.join(ROOT,'artifacts/oy-cie-v33-interpretation');fs.mkdirSync(release,{recursive:true});
fs.writeFileSync(path.join(release,'metrics.json'),JSON.stringify(counts,null,2));
fs.writeFileSync(path.join(release,'representative-interpretations.jsonl'),archive.map(x=>JSON.stringify(x)).join('\n')+'\n');
fs.writeFileSync(path.join(release,'cross-model-observations.json'),JSON.stringify(unknownCases,null,2));
fs.writeFileSync(path.join(release,'exceptions.json'),JSON.stringify(faults,null,2));
fs.writeFileSync(path.join(release,'seed-contrast-audit.json'),JSON.stringify({seedFailures:seedContrasts,negatedSafetyReviewCases:negativeExamples},null,2));
const serious=['exceptions','coreScoreMismatch','coreSafetyMismatch','unknownMismatch','missingCoreSafetyGate','missingNarrativeEvidenceRefs','unconfirmedServiceClaim','unexpectedIdentifiableText','seedContrastFailures'];
console.log('OY-CIE V3.3 SYNTHETIC BENCHMARK '+JSON.stringify(counts));
console.log('SAMPLES '+archive.length+', cross-model snapshots '+unknownCases.length);
if(serious.some(x=>counts[x]>0)){console.error('FAIL CRITICAL: '+serious.filter(x=>counts[x]>0).map(x=>x+' '+counts[x]).join('; '));process.exitCode=1;}
else console.log('PASS all synthetic integrity gates. Semantic contrast counts are exploratory, not expert accuracy.');
