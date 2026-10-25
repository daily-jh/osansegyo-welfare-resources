/* OY-CIE V3.2 | local Korean conversational casework reasoning overlay.
 * Not a trained language model, not expert-validated. No network/storage.
 * Safety and scoring are read-only from YouthCriteria through OYCIE30.
 */
(function(root,factory){'use strict';const a=factory();if(typeof module!=='undefined'&&module.exports)module.exports=a;else root.OYCIE32=a;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='3.2.0-candidate';
const typeToDomain={protection:0,selfharm:2,peers:1,school:3,basic:7,mental:2,health:4,access:5,care:6,relation:8,digital:9};
const safetyTypes=new Set(['protection','selfharm','threat']);
const recognizedStatuses=new Set(['reported_unverified','secondhand','historical','ambiguous_negation_review']);
const softFollowup=/^(?:그럼|그러면|그렇다면|그것|그쪽|여기서|다음|계속|좀 더|자세히|그 외|이어서|위 내용|이 내용|그 부분)/;
const microIntents={plan:/계획|목표|개입|실행|단기|중기|장기/,interview:/질문|면담|상담/,meeting:/회의|협의|안건|결정/,resource:/자원|기관|서비스|연계|의뢰|지원처/,safety:/안전|신고|학대|자해/,evidence:/근거|이유|왜|모순|불일치|검증|확인된/,strength:/강점|희망|의사|거부|잘하는/};
const ROLES={'teacher':'교사','education-welfare':'교육복지사','social-worker':'사회복지사'};
const privacyFormat=/(?:\b\d{6}[- ]?[1-8]\d{6}\b|(?:01[016789])[- ]?\d{3,4}[- ]?\d{4}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\b\d{2,4}-\d{3,4}-\d{4}\b)/;
function intentFor(question,old){let q=String(question||'').trim();for(const [key,rx] of Object.entries(microIntents))if(rx.test(q))return key;if(softFollowup.test(q)&&old)return old;return 'summary';}
function validatePlaybook(db){if(!db||db.schema!=='oy-cie.playbook.v3.2'||db.recordCount!==80||!Array.isArray(db.entries)||db.entries.length!==80)throw Error('V3.2 실무 템플릿 80개 누락 또는 구조 변경');let ids=new Set();for(const x of db.entries){if(!x||!Number.isInteger(x.domainIndex)||x.domainIndex<0||x.domainIndex>9||ids.has(x.id)||typeof x.guidance!=='string'||x.sourceStatus!=='developer_proposed_unvalidated')throw Error('V3.2 실무 템플릿 무결성 확인 필요');ids.add(x.id);}return true;}
function evidenceRoute(input,base){const state=Array.from({length:10},()=>({score:[],unknown:[],textPositive:[],textNegated:[],textHistorical:[],textSecondhand:[],textAmbiguous:[],issues:[]}));const positiveDomainIndices=new Set();for(let i=0;i<25;i++){const domain=baseEngine.itemDomain(i+1),s=input.answers[i];if(s==='unknown')state[domain].unknown.push('Q'+String(i+1).padStart(2,'0'));else if(s>0){state[domain].score.push({id:'Q'+String(i+1).padStart(2,'0'),value:s});positiveDomainIndices.add(domain);}}
const safetyNarrative=[];
for(const x of base.narrativeSignals||[]){const domain=typeToDomain[x.type];if(safetyTypes.has(x.type)&&recognizedStatuses.has(x.status))safetyNarrative.push(x);
 if(domain===undefined)continue;const d=state[domain];if(x.status==='reported_unverified')d.textPositive.push(x.id);
 else if(x.status==='historical')d.textHistorical.push(x.id);
 else if(x.status==='secondhand')d.textSecondhand.push(x.id);
 else if(x.status==='ambiguous_negation_review')d.textAmbiguous.push(x.id);
 else if(x.status==='negated')d.textNegated.push(x.id);
}
for(const d of state){const textActive=d.textPositive.length||d.textHistorical.length||d.textSecondhand.length||d.textAmbiguous.length;
 if(textActive&&!d.score.length&&!d.unknown.length)d.issues.push('관련 문항이 모두 0점이지만 서술 근거가 있음: 발생시점·주체·평가기간 확인');
 if(d.textNegated.length&&d.score.length)d.issues.push('척도 양성과 부정 서술이 공존: 시점·주체·상황 차이 확인');
 if(d.unknown.length&&textActive)d.issues.push('미상 문항과 서술 단서 공존: 추가사정으로 정합성 확인');
}
return {domains:state,originalPositiveDomains:[...positiveDomainIndices],safetyNarrative};}
let baseEngine=null;
function asRef(id){return /^Q\d{2}$/.test(id)||/^N\d{4}-(?:selfharm|protection|threat|basic|peers|school|mental|health|access|care|relation|digital|strength)$/.test(id);}
function makeAction({domainIndex,domain,intent,playbook,role}){const refs=[...domain.score.map(x=>x.id),...domain.unknown,...domain.textPositive,...domain.textHistorical,...domain.textSecondhand,...domain.textAmbiguous].filter(asRef);const scalePositive=domain.score.length>0;const onlyText=!scalePositive&&(domain.textPositive.length+domain.textHistorical.length+domain.textSecondhand.length+domain.textAmbiguous.length)>0;
let state=onlyText?'서술 단서 검토 전용':scalePositive?'척도 기반 검토 초안':domain.unknown.length?'미상 확인 전용':'자료 없음';
let step=onlyText?`서술 근거만 있는 ${playbook.title.split(' · ')[0]} 영역입니다. 확정된 개입이 아니라 실제 상황의 확인을 먼저 제안합니다. ${playbook.reviewQuestion}`:playbook.guidance;
return {id:`A32-${String(domainIndex+1).padStart(2,'0')}`,title:playbook.title,proposedAction:step,evidenceIds:refs,status:state,requiresHumanReview:true,proposedOwner:ROLES[role]||ROLES['social-worker'],confirmedOwner:false,serviceStarted:false,goalAgreed:false,outcomeCheck:playbook.outcomeCheck,requiresCurrentEligibilityCheck:intent==='resource'};}
function dedupIds(arr){return [...new Set(arr)];}
function run(raw,question,options={}){
 baseEngine=options.engine||(typeof window!=='undefined'?window.OYCIE30:null);if(!baseEngine||typeof baseEngine.analyze!=='function')throw Error('V3.1 기본 추론엔진 연결 필요');
 const q=String(question||'').trim();if(q.length<2||q.length>500)throw Error('질문은 2~500자로 입력하세요');
 const p=baseEngine.checkPayload(raw);
 // Public demo safety guard; never treat this as comprehensive de-identification.
 if(privacyFormat.test(p.caseContext)||privacyFormat.test(q))throw Error('식별정보 형식 감지: 공개 시연에서 사용할 수 없습니다');
 const stateBefore=options.state||null,rev=baseEngine.revision(p),sameRevision=stateBefore&&stateBefore.revision===rev,role=options.role||'social-worker';
 const intent=intentFor(q,sameRevision?stateBefore.intent:null);
 if(options.playbook)validatePlaybook(options.playbook);
 const base=baseEngine.analyze(p,q,{criteria:options.criteria,role,kb:options.kb,pairModel:options.pairModel,kcarr:options.kcarr,route:options.route});
 const route=evidenceRoute(p,base);
 let selected=route.domains.map((d,i)=>({domainIndex:i,domain:d,score:d.score.reduce((s,x)=>s+x.value,0),text:d.textPositive.length+d.textHistorical.length+d.textSecondhand.length+d.textAmbiguous.length})).filter(z=>z.score>0||z.domain.unknown.length||z.text>0);
 const userSpecified=[...q.matchAll(/(?:^|[^0-9])([12]?\d)번/g)].map(m=>Number(m[1])).filter(n=>n>=1&&n<=25);
 if(userSpecified.length){const wanted=new Set(userSpecified.map(n=>baseEngine.itemDomain(n)));selected=selected.filter(x=>wanted.has(x.domainIndex));}
 if(sameRevision&&softFollowup.test(q)&&!userSpecified.length&&selected.length&&Array.isArray(stateBefore.domains)&&stateBefore.domains.length){const focus=new Set(stateBefore.domains);selected.sort((a,b)=>Number(focus.has(b.domainIndex))-Number(focus.has(a.domainIndex))||b.score-a.score||b.text-a.text);}
 else selected.sort((a,b)=>Number(b.domain.score.some(x=>[1,2,7,25].includes(Number(x.id.slice(1)))))-Number(a.domain.score.some(x=>[1,2,7,25].includes(Number(x.id.slice(1)))))||b.score-a.score||b.text-a.text||a.domainIndex-b.domainIndex);
 selected=selected.slice(0,6);
 const actions=options.playbook?selected.map(x=>{const pb=options.playbook.entries.find(k=>k.domainIndex===x.domainIndex&&k.intent===intent);return pb?makeAction({...x,intent,playbook:pb,role}):null}).filter(Boolean):[];
 const officialNeed=base.official.urgent||base.official.safetyUnknown.length>0||base.official.pendingChecks.length>0;
 const gates=[];
 if(officialNeed)gates.push({id:'CORE-SAFETY',type:'mandatory',summary:'공식 CORE 안전·후속확인 미완료를 우선 처리',ref:['CORE']});
 if(route.safetyNarrative.length)gates.push({id:'TEXT-SAFETY',type:'review_only',summary:'서술형의 위해 단서·진술주체·시점·부정을 직접 확인',ref:dedupIds(route.safetyNarrative.map(x=>x.id))});
 if(base.narrativeCoverage.incomplete)gates.push({id:'COVERAGE',type:'review_only',summary:'서술 입력의 일부 문장이 검사되지 않아 원문 검토 필요',ref:[]});
 const issues=selected.flatMap(x=>x.domain.issues.map(issue=>({domainIndex:x.domainIndex,issue,refs:[...x.domain.textPositive,...x.domain.textNegated,...x.domain.score.map(s=>s.id)]})));
 const citations=dedupIds(actions.flatMap(x=>x.evidenceIds).concat(gates.flatMap(x=>x.ref))).filter(x=>x==='CORE'||asRef(x));
 const bullets=[`[공식 CORE — 변경 불가]\n${base.segments.find(x=>x.kind==='official')?.text||base.official.title}`];
 for(const g of gates)bullets.push(`[${g.id}] ${g.summary}${g.ref.length?' / '+g.ref.join('·'):''}`);
 if(issues.length)bullets.push('[척도–서술 불일치 및 확인점]\n'+issues.slice(0,8).map(x=>'- '+x.issue+' ('+x.refs.join(', ')+')').join('\n'));
 if(actions.length)bullets.push(`[${intent} · 실행 전 확인안]\n`+actions.map(a=>`• ${a.title} (${a.status})\n${a.proposedAction}\n근거: ${a.evidenceIds.join(', ')||'없음'} / 담당 미확정 / 학생과 협의 전`).join('\n\n'));
 else bullets.push('[추가 확인] 이용 가능한 문항·서술 근거가 부족하여 사례별 실행과제를 확정할 수 없습니다.');
 if(base.knowledgeIds.length)bullets.push('[기존 한국어 응답 DB · 미검증 참고]\n'+base.segments.filter(x=>x.kind==='research_response').slice(0,3).map(x=>x.text).join('\n'));
 bullets.push('[근거 추적·한계] '+(citations.join(', ')||'추적할 사례 근거 없음')+' / 자료원·기간·반대 설명·학생의 희망을 직접 확인하십시오. 본 답변은 규칙·검색 기반 연구형 초안이며 진단·위험확률·의뢰 접수 또는 서비스를 확정하지 않습니다.');
 const review={safetyPreserved:!officialNeed||gates.some(x=>x.id==='CORE-SAFETY'),unverifiedTextNotUpgradedToScale:actions.every(a=>a.status!=='서술 단서 검토 전용'||!a.goalAgreed),allActionRefsExist:actions.every(a=>a.evidenceIds.every(asRef)),caseRevision:rev,expertsMeasured:false,privateDataPrechecked:!privacyFormat.test(q+p.caseContext),status:'technical_gate_only_not_semantic_validity'};
 if(!review.safetyPreserved||!review.allActionRefsExist||!review.unverifiedTextNotUpgradedToScale)throw Error('V3.2 안전·근거 검증 실패');
 // No raw narrative, no prior question, no arbitrary identifiers in state.
 return {version:VERSION,mode:'rule_retrieval_and_dialogue_no_neural_weights',intent,role,official:base.official,caseRevision:rev,baseKnowledgeIds:base.knowledgeIds,pairIds:base.pairIds,dialogueState:{revision:rev,intent,domains:selected.map(x=>x.domainIndex)},answer:bullets.join('\n\n'),actions,gates,issues,usedPlaybookIds:actions.map(a=>'PB32-D'+String(a.id.slice(4))+'-'+intent),citations,review,sourceStatus:{corpus:base.corpusStatus,playbook:options.playbook?'80_developer_templates_unvalidated':'not_loaded',empiricalValidation:false,actualLLM:false},baseTechnicalTrace:base.trace,narrativeCoverage:base.narrativeCoverage};
}
return Object.freeze({VERSION,intentFor,validatePlaybook,run});
});
