/* Traceable presentation and planning layer. Never writes CORE answers or safety decisions. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const M=node?require('./support-model.js'):root.YouthMap,C=node?require('./case-context-core.js'):root.YouthCaseContextCore,W=node?require('./weight-model.js'):root.YouthWeightModel,E=node?require('./case-context-v81.js'):root.YouthContextV81,S=node?require('./cie-semantic-layer-v2.js'):root.OYCIESemanticV2;
const VERSION='8.9.0-semantic-integrated';
const tasks=[
 ['현재 보호 상황 확인','현재 위치·위해·안전한 연락 상대를 확인하고 사안별 보호절차를 검토합니다.','추가 위해와 보호 공백 여부'],
 ['또래관계의 안전 확인','상호 갈등·피해·위협을 구분하고 학교 담당과 안전한 접촉·생활 조정을 정합니다.','학생이 느끼는 안전과 피해 반복 여부'],
 ['마음과 일상 지원','현재 안전을 먼저 확인하고 학생이 힘들어하는 시간·수면·일과 및 상담 이용 장벽을 확인합니다.','일상 유지와 도움 요청 가능 여부'],
 ['학습·학교 참여 조정','학생과 어려운 수업 장면을 정하고 과제·설명·휴식 중 필요한 조정을 협의합니다.','학생이 체감하는 참여 어려움의 변화'],
 ['건강·행동 지원','현재 위해·몸 상태와 행동 전후 장면을 확인하고 보건·상담 담당의 역할을 정합니다.','위험 장면의 반복과 건강지원 이용 여부'],
 ['교육 접근성 확보','진단명을 추정하지 않고 설명·환경·보조지원의 실제 제공과 이용 장벽을 확인합니다.','필요한 조정 제공 및 수업 참여 변화'],
 ['가족·돌봄 공백 조정','하루 일과와 학생이 맡은 돌봄, 성인 대체지원 및 안전한 가족 연락 범위를 확인합니다.','돌봄 공백 시간과 학생 부담의 변화'],
 ['필수생활·주거 지원','오늘 필요한 식사·물품·안전한 거주와 비용 장벽을 구분하고 실제 제공 가능한 지원을 문의합니다.','필수생활 공백과 미충족 필요의 변화'],
 ['학생이 원하는 관계 지원','학생이 원하는 관계·활동과 도움받을 어른을 확인하고 부담이 적은 접촉 방법을 협의합니다.','도움을 청할 사람과 실제 연락 가능 여부'],
 ['온라인 안전·생활 조정','피해·협박과 이용조절 어려움을 구분하고 피해가 보고되면 보호를 우선합니다.','피해 접촉 반복 여부와 일상 기능의 변화']];
function analyze(p){
 if(!M.validate(p))throw Error('완료된 25문항 평가자료가 필요합니다.');
 const decision=M.context(p),domains=M.domains(p),context=C.reconcile(p.answers,p.caseContext||''),ecosystem=E.parse(p),semantic=S&&S.formulate?S.formulate(p.answers):null;
 const active=ecosystem.institutions.filter(x=>x.status==='이용·개입 언급');
 const extra=new Set(context.signals.filter(s=>['reported','unverified'].includes(s.polarity)&&s.timeHint!=='historical-mention').flatMap(s=>domains.filter(d=>d.numbers.some(n=>s.items.includes(n))).map(d=>d.i)));
 const ordered=M.rank(domains).filter(d=>d.sum||d.unknown||extra.has(d.i));
 let plans=ordered.map(d=>({domain:d.i,title:tasks[d.i][0],evidence:d.numbers.filter(n=>p.answers[n-1]>0).map(n=>n+'번 '+p.answers[n-1]+'점'),narrativeOnly:!d.sum&&extra.has(d.i),action:tasks[d.i][1],outcome:tasks[d.i][2],when:d.safety||d.critical?'현재 안전·필수생활부터 확인':'첫 면담에서 확인 · 실행일 협의',candidates:M.groupedCandidates(p,d).slice(0,3).map(g=>({name:g.name,service:g.primary['서비스명'],condition:M.describe(p,d,g.primary).condition,url:g.primary['홈페이지']||''}))}));
 const specific={19:['食','필수생활 공백 확인','오늘 식사·옷·위생용품에서 실제로 부족한 것이 있는지 구체적으로 확인하고 실제 제공 가능한 지원을 연결합니다.','끼니·필수물품의 미충족 여부'],20:['住','주거 안정·환경 확인','거처의 안정성·환경·안전을 구분해 확인합니다. 보고되지 않은 체납·퇴거를 추정하지 않고 필요한 주거 지원을 문의합니다.','안전하게 머물 거처와 휴식·학습 환경의 변화'],21:['費','필요한 서비스의 비용 장벽 해소','어떤 의료·교육·생활 서비스를 비용 때문에 이용하지 못하는지 확인하고 이용 조건·지원 가능 범위를 문의합니다.','필요 서비스의 실제 접근·이용 여부']};
 plans=plans.flatMap(plan=>{if(plan.domain!==7)return [plan];const ns=[19,20,21].filter(n=>p.answers[n-1]>0||p.answers[n-1]==='unknown');return ns.length?ns.map(n=>({...plan,item:n,title:p.answers[n-1]==='unknown'?'추가 확인 · '+specific[n][1]:specific[n][1],evidence:[n+'번 '+(p.answers[n-1]==='unknown'?'미상 · 필요 여부 확인':p.answers[n-1]+'점')],action:specific[n][2],outcome:specific[n][3],candidates:(p.answers[n-1]==='unknown'?[]:M.groupedCandidates(p,domains[7]).filter(g=>M.describe(p,domains[7],g.primary).evidence.includes(n))).slice(0,3).map(g=>({name:g.name,service:g.primary['서비스명'],condition:M.describe(p,domains[7],g.primary).condition}))})):[plan];});
 const ledger=[...p.answers.map((value,i)=>({id:'Q'+String(i+1).padStart(2,'0'),kind:'scale-response',value,status:value==='unknown'?'unknown':'reported',source:'평가자 입력',time:'평가 시점',ruleVersion:VERSION})),...C.splitClauses(p.caseContext||'').map((text,i)=>({id:'E'+String(i+1).padStart(3,'0'),kind:'narrative',text:C.redact(text),status:'reported-unverified',source:'자유서술 · 정보원 직접 확인 필요',time:/(과거|작년|지난해|예전)/.test(text)?'과거 언급':/(현재|최근|오늘)/.test(text)?'현재·최근 언급':'시점 미확인',ruleVersion:VERSION}))];
 plans=plans.map(x=>({...x,id:x.item?'P-Q'+x.item:'P-D'+x.domain,sourceItemIds:(x.item?[x.item]:domains[x.domain].numbers.filter(n=>p.answers[n-1]>0||p.answers[n-1]==='unknown')).map(n=>'Q'+String(n).padStart(2,'0')),sourceTextIds:ledger.filter(e=>e.kind==='narrative'&&context.signals.some(z=>z.items.some(n=>domains[x.domain].numbers.includes(n))&&e.text.includes(z.clause))).map(e=>e.id),status:'draft'}));
 const references=ledger.filter(e=>e.kind==='narrative');
 const relevant=(ids)=>references.filter(e=>context.signals.some(z=>ids.includes(z.tag)&&e.text.includes(z.clause))).map(e=>'['+e.id+'] '+e.text).join(' / ');
 const familyEvidence=ecosystem.family.map(f=>f.label+'('+f.status+' · 서술 근거, 확인 전)').join(' / ');
 const priorityEvidence=semantic&&semantic.top.length?semantic.top.slice(0,3).map(x=>x.topic+' '+x.value+'점: '+x.meaning).join(' / '):plans.slice(0,3).map(x=>x.title+' ('+(x.evidence.join(', ')||'서술·미상 확인')+')').join(' / ');
 const summary=decision.incomplete?'아직 확인하지 않은 문항은 '+decision.unknownItems.join('·')+'번입니다. 확인된 응답 합계는 '+decision.knownTotal+'점이며, 아래는 현재 확인된 어려움에 대한 지원 방향입니다.':'25문항 응답 합계는 '+decision.knownTotal+'/100점입니다.';
 const note=String(p.caseContext||'');
 const clauses=ledger.filter(e=>e.kind==='narrative');
 const interest=clauses.filter(e=>/관심|좋아|즐기|잘하|하고 싶/.test(e.text)&&!/관심.{0,6}없|싫어|좋아하지 않|원하지 않|과거|예전|만약/.test(e.text));
 const service=clauses.filter(e=>/상담|서비스|지원/.test(e.text)&&/받고|이용 중|이용중|참여 중/.test(e.text)&&!/받고 싶|받지 않|과거|지난해|종결/.test(e.text));
 if(service.length&&!context.fields.existingSupport)context.fields.existingSupport=service.map(e=>e.text).join(' / ');
 if(interest.length&&!context.fields.strengths)context.fields.strengths=interest.map(e=>e.text).join(' / ');
 const formulation=[];
 if(domains[3].sum&&domains[8].sum)formulation.push('학습 참여와 관계·지지의 어려움이 함께 보고되었습니다. 수업에서의 실패 경험과 또래관계의 긴장이 서로 부담을 키우는지 살펴볼 필요가 있습니다. 최근 힘들었던 수업과 갈등 장면을 각각 한 가지씩 재구성해, 과제 난도·설명 방식·또래 반응 중 조정할 지점을 찾으세요.');
 if(clauses.some(e=>/ADHD|주의력\s*결핍/i.test(e.text)&&!/없|아니|아님|않|부인|만약|예시|친구|보호자|과거|예전/.test(e.text)))formulation.push('서술에는 ADHD가 보고되어 있습니다. 실제 진단·치료 상태를 확인하면서 과제 시작, 지시 기억, 기다리기, 감정이 올라오는 상황을 구분해 보세요. 학업·관계 문제 전체를 진단명 하나로 설명하기보다 짧은 지시, 과제 분할, 예고된 휴식이 참여에 도움이 되는지 학생과 시험해 보는 것이 좋습니다.');
 if(Number.isInteger(p.answers[18])&&p.answers[18]>0)formulation.push('필수생활의 공백이 보고되었습니다. 오늘 식사·의복·위생용품 중 무엇이 부족한지 확인하고, 제공할 물품과 전달 시점을 정하세요.');
 if(Number.isInteger(p.answers[19])&&p.answers[19]>0)formulation.push('주거의 어려움이 보고되었습니다. 안전한 거처와 수면·학습 공간 중 실제 어려움을 구분하고 환경 조정을 협의하세요.');
 if(Number.isInteger(p.answers[20])&&p.answers[20]>0)formulation.push('필요한 서비스의 비용 장벽이 보고되었습니다. 이용하지 못한 의료·교육·활동이 무엇인지, 비용·자격·이동 중 어떤 장벽인지 확인하고 담당 창구에 지원 가능 범위를 문의하세요.');
 if(service.length)formulation.push('이미 상담을 받고 있다는 보고가 있으므로 새로운 상담기관을 추가하기 전에 현재 상담에서 다루는 내용과 학교에서 필요한 도움을 확인하세요. 학생 동의와 공유 범위를 정한 뒤 기존 담당자와 학교의 역할을 조정하는 것이 우선입니다.');
 if(interest.length)formulation.push('관심 활동은 학생과 관계를 만들고 성공 경험을 쌓을 출발점입니다. '+(interest.some(e=>/태권도/.test(e.text))?'태권도는 학생이 원하는 활동 방식·비용·이동·지도자와의 관계를 확인한 뒤 작은 참여 목표로 연결해 볼 수 있습니다. 운동이 치료 효과를 보장한다고 설명하지 마세요.':'학생이 원하는 참여 방식과 비용·이동의 장벽을 확인해 실행 가능한 작은 목표로 연결하세요.'));
 // OY-CIE contextual co-interpretation: evidence-bound hypotheses, not diagnoses or changes to CORE.
 const cie=[];
 const observed=domains.filter(d=>d.sum>0);
 const co=(a,b)=>domains[a].sum>0&&domains[b].sum>0;
 const add=(kind,indices,hypothesis,verification,priority='우선순위 협의')=>{
  const items=indices.flatMap(i=>domains[i].numbers.filter(n=>Number.isInteger(p.answers[n-1])&&p.answers[n-1]>0));
  cie.push({kind,items:[...new Set(items)],hypothesis,verification,priority});
 };
 if(co(1,3))add('peer-school',[1,3],'또래 안전과 학교 참여의 어려움이 함께 보고되었습니다. 피해와 등교 어려움의 선후관계는 미확인입니다.','사건 전후 출결 변화, 교실·통학 안전, 학생이 원하는 보호 방식 확인','안전 우선');
 if(co(2,3))add('emotion-school',[2,3],'정서와 학습·출결의 어려움이 함께 보고되었습니다. 일방적 인과관계는 확정하지 않습니다.','수면·집중·등교 장면의 변화와 가능한 수업 조정 확인');
 if(co(6,3))add('care-school',[6,3],'가족·돌봄과 학교 참여의 어려움이 함께 보고되었습니다. 가족형태만으로 방임을 추정하지 않습니다.','돌봄 시간표·대체 돌봄·출결 시간대 확인');
 if(co(7,2))add('basic-emotion',[7,2],'필수생활·주거와 정서적 어려움이 함께 보고되었습니다. 각각의 시급성을 사정해야 합니다.','식사·거처·비용 장벽과 정서 지원을 분리 확인');
 if(co(8,2))add('support-emotion',[8,2],'관계·지지와 정서적 어려움이 함께 보고되었습니다. 안전한 지지자 연결을 검토합니다.','학생이 선택한 지지자와 연락 가능성 확인');
 if(context.needsSafetyAttention)cie.unshift({kind:'narrative-safety',items:[],hypothesis:'서술에 안전 관련 단서가 있습니다. 낮은 척도 점수만으로 현재 안전을 확정할 수 없습니다.',verification:'현재 위해·시점·안전한 연락·필요한 보호절차 확인',priority:'안전 우선'});
 if(decision.unknownItems.length)cie.push({kind:'unknown',items:decision.unknownItems.slice(),hypothesis:'미상 문항은 0점이 아니며 확인되지 않은 상태입니다.',verification:'문항별 정보원·확인일 지정, 확인된 지원은 지연하지 않음',priority:'확인 필요'});
 if(context.mismatches.length)cie.push({kind:'mismatch',items:[...new Set(context.mismatches.flatMap(x=>x.items||[]))],hypothesis:'척도와 서술 사이에 '+context.mismatches.length+'건의 대조사항이 있습니다.',verification:'학생·보호자·학교의 정보원과 시점을 분리해 확인',priority:'근거 대조'});
 if(observed.length>1&&!cie.length)add('general',observed.slice(0,3).map(d=>d.i),'여러 영역의 어려움이 동시에 보고되었습니다. 영역 간 인과관계는 확인되지 않았습니다.','생활 영향·발생 시점·학생 희망을 대조');
 const cieActions=cie.map((x,i)=>({id:'CIE-'+(i+1),...x,evidence:x.items.map(n=>n+'번 '+p.answers[n-1]+'점'),status:'미확인 가설'}));
 if(cieActions.length)formulation.push('OY-CIE 맥락 통합검토(가설·확인과제): '+cieActions.slice(0,4).map(x=>x.hypothesis+' [근거 '+(x.evidence.join('·')||'서술 확인')+'] '+x.verification).join(' '));
 const cieSummary=cieActions.length?'OY-CIE 검토가설 '+cieActions.length+'건: '+cieActions.slice(0,3).map(x=>x.hypothesis+' (근거 '+(x.evidence.join('·')||'서술·미상 확인')+')').join(' '):'확인된 척도와 서술을 토대로 생활 장면과 학생 희망을 확인합니다.';
 const integrated=[semantic?semantic.narratives.join(' '):'',formulation.join(' ')].filter(Boolean).join(' ')||'현재 보고된 어려움을 학생이 가장 불편한 생활 장면부터 구체화하세요. 빈도·지속기간·학교와 가정에서의 차이를 확인한 뒤, 우선 과제 한 가지를 학생과 합의하고 변화 여부를 점검합니다.';
 const sections=[
 {title:'학생 상황 요약',text:summary+' '+(priorityEvidence?'주요 검토 과제: '+priorityEvidence+'. ':'이번 응답에서 자동 계획할 어려움이 보고되지 않았습니다. ')+(context.fields.situation?'서술에 보고된 상황(독립 확인 전): '+context.fields.situation+' / ':'')+(familyEvidence?'가족·생활 관계 단서: '+familyEvidence+'. ':'')+'문항별 근거의 실제 발생시기·빈도·학생의 생활 영향과 정보원을 확인해야 합니다. 서술은 점수 또는 학대·진단 확정 근거가 아닙니다.'},
 {title:'현재 안전과 즉시 필요한 확인',text:decision.title+' · '+decision.safetyReview+(context.needsSafetyAttention?' 서술에 안전 관련 단서가 있어 현재 상태·접촉 안전성을 별도 확인해야 합니다.':'')},
 {title:'가족·돌봄·생활환경',text:[familyEvidence?'가족 단서: '+familyEvidence:'',relevant(['family','care','basic'])?'생활장면 근거: '+relevant(['family','care','basic']):''].filter(Boolean).join(' / ')||'가족·돌봄·생활환경의 구체적 장면은 추가 확인이 필요합니다. 가족형태·경제형편만으로 방임을 추정하지 않습니다.'},
 {title:'학습·출결·교우·정서·건강',text:relevant(['attendance','learning','peer','peerConflict','emotion','behavior','support'])||'관련 문항의 응답과 실제 생활 장면·빈도·기간을 대조해야 합니다. 진단·원인을 자동 추정하지 않습니다.'},
 {title:'학생의 말·희망·동기',text:references.filter(e=>/원함|원하|원치|원하지|희망|거부|동의|하고 싶/.test(e.text)).map(e=>'['+e.id+'] '+e.text).join(' / ')||context.fields.studentWishes||'학생이 바라는 변화와 원하지 않는 지원, 정보공유 의견은 직접 확인해야 합니다.'},
 {title:'강점·보호요인·기존 지원',text:[context.fields.strengths,context.fields.existingSupport].filter(Boolean).join(' / ')||'이번 입력에서 구체적 강점·이용 중 지원을 추출하지 못했습니다. 강점이나 지원이 없다는 뜻은 아닙니다.'},
 {title:'상황을 함께 이해하기 · 잠정 해석과 지도 방향',text:integrated},
 {title:'종합사정 및 우선순위',text:cieSummary+' 우선 실행과제: '+(plans.slice(0,5).map(x=>'['+x.id+'] '+x.title+' — '+x.action).join(' / ')||'학생 희망과 필요한 예방·경과 확인을 면담에서 협의합니다.')},
 {title:'근거·미확인·확인 계획',text:[decision.unknownItems.length?'미상: '+decision.unknownItems.join('·')+'번은 0점으로 취급하지 않고 확인 전으로 유지':'',context.mismatches.map(x=>x.items.join('·')+'번: '+x.issue).join(' / '),'문항 근거의 실제 장면·기간·정보원, 학생 희망, 담당·확인일·정보공유 근거를 면담에서 기록해야 합니다.'].filter(Boolean).join(' / ')}
 ];
 return {version:VERSION,decision,domains,context,ecosystem,active,semantic,cieActions,plans,primaryPlans:plans.slice(0,5),ledger,sections,high:p.answers.flatMap((v,i)=>Number.isInteger(v)&&v>=3?[{item:i+1,score:v}]:[]),pairs:W.PAIRS.filter(x=>p.answers[x.item-1]>0&&p.answers[x.other-1]>0),weights:W.audit(p.answers),questions:['지금 가장 먼저 도움받고 싶은 일은 무엇인가요?','그 일이 언제, 어떤 상황에서 가장 어렵게 느껴지나요?','이미 도움을 주는 사람이나 기관이 있나요? 어떤 도움이 더 필요할까요?']};
}
function text(p,page,includeContext=false){
 const full=analyze(p),a=includeContext?full:analyze({...p,caseContext:''});
 const lines=['OY-RALS V'+VERSION+' · '+page+' · 실무자 검토 전 초안',a.decision.title,a.decision.incomplete?'확인 합계 '+a.decision.knownTotal+'/'+a.decision.knownMaximum+' · 미상 '+a.decision.unknownItems.length+'개 · 전체 판단 보류':'원점수 '+a.decision.knownTotal+'/100','안전 관련 확인: '+a.decision.safetyReview,'정보 확인: '+a.decision.knownCount+'/25 · 미상 '+a.decision.unknownItems.length+'문항'];
 if(a.semantic)lines.push('문항별 의미·가중치 통합 해석: '+a.semantic.narratives.join(' '),'검토 우선순위(가설): '+a.semantic.top.map(x=>x.id+'번 '+x.value+'점 '+x.meaning+' / '+x.priority).join(' · '),'가중치는 연구 가정이며 검증된 위험확률이 아님.');
 const planLines=a.plans.map(x=>'['+x.id+'] '+x.title+' / 근거 '+[...x.sourceItemIds,...x.sourceTextIds].join(', ')+' / 실행 초안 '+x.action+' / 변화 지표 '+x.outcome+' / 연계 후보 '+(x.candidates.map(c=>c.name+'('+c.service+')').join(', ')||'추가 확인'));
 if(page==='사례사정')lines.push(...a.sections.map(x=>x.title+'\n'+x.text),'OY-CIE 잠정 해석은 사실 확인·학생 의견·정보원 대조 후 채택합니다.');
 else if(page==='사례협의')lines.push('협의 목적: 확인된 어려움의 우선순위, 현재 안전, 기존 지원과 신규 의뢰의 역할 조정','협의 전 검토 가설:',...(a.cieActions.map(x=>x.id+' / '+x.hypothesis+' / '+x.verification)),'협의 안건:',...a.plans.slice(0,5).map(x=>x.title+' / '+x.evidence.join('·')+' / 결정할 내용: 담당·지원 가능성·회신 기한'),'교사: 교내 안전·수업·출결 조정 / 교육복지사: 교내외 연계 조율 / 사회복지사: 가구 사정·자원 조정','주관기관·참석자·공유 근거·회의 결정: 미확정. 실제 회의 개최로 기록하지 않음.');
 else if(page==='서비스계획')lines.push('학생과 합의하기 전 서비스계획 초안','OY-CIE 검토사항:',...a.cieActions.map(x=>x.id+' / '+x.hypothesis+' / 확인 전 확정 금지'),'계획 과제:',...a.plans.map(x=>x.title+' / 근거 '+x.evidence.join('·')+' / 단기: '+x.action+' / 중장기: '+x.outcome+'의 변화 목표를 학생과 합의 / 담당·시작일·기준선·목표치·점검일: 미확정'));
 else lines.push('학생의 상황과 지원 방향: '+a.sections[6].text,'지원 과제:',...planLines);
 if(includeContext)lines.push('선택 서술(미확인): '+(p.caseContext||'없음'),'현재 이용기관 언급: '+(a.active.map(x=>x.label).join(', ')||'확인 필요'),'서술·척도 대조: '+a.context.mismatches.map(x=>x.issue).join(' / '));
 lines.push('연계 검토: '+(p.linkageReviewStatus||'검토 전')+' · 문의·접수·이용은 별도 확인','본 문서는 실제 상담·사례회의·서비스 제공을 증명하지 않습니다. 실증 타당도 미검증.','기획·개발·저작권: 김지훈 · 오산세교종합사회복지관');
 return lines.join('\n\n');
}
const api={VERSION,analyze,text};if(node)module.exports=api;else root.OYJourney=api;
})(typeof window!=='undefined'?window:globalThis);
