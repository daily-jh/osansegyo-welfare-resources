(function(root){'use strict';
const Action=typeof module!=='undefined'?require('./case-action-model.js'):root.YouthCaseAction;
const P=typeof module!=='undefined'?require('./planning-model.js'):root.YouthPlanning;
const M=typeof module!=='undefined'?require('./support-model.js'):root.YouthMap;
const I=typeof module!=='undefined'?require('./insights.js'):root.YouthInsights;
const E=typeof module!=='undefined'?require('./evidence-matrix.js'):root.YouthEvidenceMatrix;
const R=typeof module!=='undefined'?require('./review-model.js'):root.YouthReviewModel;
function create(p,role='teacher'){
 if(!['teacher','social-worker'].includes(role))throw Error('관점을 확인해 주세요.');const a=P.analyze(p),d=a.decision,teacher=role==='teacher',known=n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0;
 const evidence=a.active.flatMap(area=>area.numbers.filter(known).map(n=>({number:n,score:p.answers[n-1],question:p.domains.flatMap(x=>x.items)[n-1],domain:area.name}))),signals=I.analyze(p.answers),top=a.active.slice(0,3).map(x=>x.name),cross=E.evaluate(p,role),selectedCross=cross.shown.slice(0,2);
 const first=d.urgent?'학생의 현재 안전과 보호 여건을 먼저 확인하고, 필요한 긴급·보호·신고 절차를 진행합니다. 서비스 예약이나 사례회의까지 기다리지 않습니다.':a.safetyPending?'안전 관련 미상·추가확인부터 학생에게 안전한 방법으로 살핍니다. 확인된 생활의 어려움에 대한 지원도 함께 시작합니다.':a.active.length?(teacher?'학생에게 안전하게 말할 기회를 마련하고 생활 영향과 보호자 접촉의 안전성을 먼저 확인합니다. 학교 지원도 함께 검토합니다.':'현재 사례판정은 미확정으로 두고 우선욕구·시급성·기존 서비스를 사정한 뒤 개입과 기관별 의뢰 역할을 협의합니다.'):(teacher?'학생의 생활·관계·도움 희망을 열린 질문으로 확인합니다. 보호자 연락은 학생 안전과 적절성을 먼저 판단합니다.':'학생의 미확인 욕구와 기존 이용자원을 추가 사정하고 단기 연계·지속관리 여부를 검토합니다.');
 const management=d.title+' · 참고 판정'+(a.pending.length?' · 추가사정 병행':''),reason=(d.urgent?'현재 안전확인과 필요한 보호·전문 대응을 우선하며, 이후 지원 수준은 학생의 생활 영향·지속성·기존 지원을 확인해 논의합니다.':d.description)+' '+d.reason;
 let approach=[];if(d.urgent||a.safetyPending)approach.push({name:'안전·보호 절차 우선',why:'안전 신호나 미확인을 일반 상담기법으로 대신하지 않습니다.',action:first});
 if(a.active.length){approach.push({name:'강점·생태체계 관점',why:'학생 개인의 문제로만 보지 않고 학교·가족·생활환경·지역 지원을 함께 살피는 기본 관점입니다. 실제 강점과 관계는 아직 확인되지 않았습니다.',action:'힘든 상황에서도 해온 일, 편안한 관계, 도움받은 경험을 묻고 학생이 원하는 변화부터 정합니다.'});
 if([16,18,19,20,21].some(known))approach.push({name:'문제해결 중심 접근',why:'돌봄·필수생활·지원 접근에 관한 응답이 있어 구체적 필요와 이용 장벽을 나누고 대안을 비교하는 접근이 적합한지 검토합니다.',action:'가장 시급한 생활 필요 → 가능한 지원 → 이용 조건·학생 선호 → 담당 역할 → 실제 제공 여부 순서로 확인합니다.'});
 if([9,10,11,14,15,22,23,24].some(known))approach.push({name:'과제중심·해결중심 질문 병행',why:'생활·교육 참여를 위한 작은 실행을 의논할 수 있습니다. 학생의 동기나 실행 여건은 점수로 판단하지 않습니다.',action:'“조금 덜 힘들었던 때는 무엇이 달랐나요?”를 묻고, 학생이 선택한 작은 과제와 학교·기관의 지원 과제를 구분합니다.'});}
 const plans=a.plans.map((g,index)=>{const numbers=g.domain.numbers.filter(known),groups=g.groups.slice(0,3),agencies=groups.map(group=>{const r=P.referral(p,g.domain,group.primary);return {name:group.name,service:group.primary['서비스명'],...r,reason:'응답 근거 '+r.evidence.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · ')+'에 따라 필요한 지원을 문의합니다. 함께 살펴볼 변화: '+r.outcome+'.'}});const safety=g.domain.safety,major=g.domain.critical||g.domain.peak>=3,related=cross.patterns.filter(x=>x.items.some(n=>g.domain.numbers.includes(n))).slice(0,2);
 return {id:g.id,domain:g.domain.name,numbers,evidence:numbers.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · '),priority:safety?'안전 우선':major?'생활 영향 우선 확인':'학생 희망과 함께 순서 협의',baseline:'척도 응답: '+numbers.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · ')+(g.domain.unknown?' / 이 영역 미상 '+g.domain.unknown+'개':'')+'. 실제 발생 횟수·기간·현재 상황과 보호요인은 미확인입니다.',shortGoal:g.goal,longGoal:'학생이 선택한 지원과 일상을 안정적으로 이어갈 수 있도록 돕습니다. 장기적으로 살펴볼 변화: '+g.measure+'.',service:g.task,owner:teacher?'교사: 학생의 진술과 출결·관계 변화를 살피고 안전한 보호자 소통·학내 지원을 조정. 외부기관: 실제 이용 조건을 확인.':'사례관리자: 사례판정 이후 우선개입·의뢰 주관과 회신 확인·재사정 담당을 협의. 학교: 학교생활과 교육지원. 외부기관: 서비스 접수·제공 가능 여부 확인.',timing:safety?'현재 안전 확인·보호 우선 / 후속 목표 기간은 안전 확보 후 협의':major?'첫 접촉에서 시급성 확인 / 단기 약 1개월·중기 약 3개월 검토':'학생이 바라는 순서부터 협의 / 단기 약 1개월·장기 약 3~6개월 검토',frequency:'초기 확인 후 필요에 맞춰 연락 주기 협의 · 정해진 횟수로 확정하지 않음',crossContext:related.map(x=>({title:x.title,evidence:x.evidence,question:x.question,interpretation:x.interpretation,goal:x.goal,action:x.action,measures:x.measures,resources:x.resources,source:x.source})),measure:g.measure,measurement:'첫 면담에서 현재 상태를 기준선으로 확인 → 학생과 원하는 변화·확인 시점을 합의 → 같은 기간·자료로 다시 살펴봄. 서비스 접수·시작과 생활 변화는 구분함.',agencies,studentTask:'학생이 원하고 감당할 수 있는 부분만 함께 정함. 신청·기관 연락·지원 책임을 학생 혼자 맡기지 않음.',review:safety?'안전이 달라지면 즉시 재확인. 이후 학교·전문기관의 조치·후속 연락이 실제 이어지는지 점검.':'첫 연계 문의·회신 시 접근 장벽을 살피고, 목표 기간에 학생의 경험과 실제 생활 변화로 재사정.'};});
 let summary=top.length?'이번 척도에서는 '+top.join(' · ')+' 영역의 응답을 중심으로 필요한 도움을 살펴볼 수 있습니다. '+(d.urgent?'총점과 별도로 안전·보호 절차가 먼저입니다. ':a.safetyPending?'아직 안전을 확인하지 못한 내용이 있어 안전한 확인과 지원을 함께 진행해야 합니다. ':'')+(d.integrated?'여러 영역의 어려움이 함께 나타나므로 한 기관의 서비스만으로 정리하기보다 학교와 지역기관의 역할을 함께 의논하는 방향을 제안합니다. ':'학생이 실제 겪는 생활 영향과 원하는 도움을 먼저 듣고 연계 범위를 정하는 방향을 제안합니다. '):'이번 응답만으로 구체적인 지원 필요를 정하기 어렵습니다. '+(d.incomplete?'미상은 어려움이 없다는 뜻이 아니므로 안전 관련 내용부터 확인하는 사정 예시를 제시합니다.':'학생이 바라는 도움과 생활을 면담에서 살피고 필요한 지원을 함께 찾습니다.');
 if(selectedCross.length)summary+=' 추가 사정할 연관 주제는 '+selectedCross.map(v=>v.title+' ('+v.evidence+')').join(' · ')+'입니다. 관련 응답이 함께 나타났다는 의미이며 원인이 입증되었다는 뜻은 아닙니다.';
 if(d.urgent&&!top.length)summary="문항 점수와 별도로 현재 위험·보호 필요가 표시되었습니다. 일반 욕구계획이 없더라도 독립 안전계획에 따라 현재 안전과 필요한 보호·전문 대응부터 살핍니다. 후속 서비스는 학생의 생활 상황과 희망을 확인해 협의합니다.";
 const detailedReview=R.build(p,role),N=typeof module!=='undefined'&&module.exports?require('./professional-response.js'):root.YouthNarrative,narrative=N?N.build(p,role):null;
 if(narrative)for(const g of plans){const area=narrative.areas[+g.id.slice(2)-1];g.baseline=area.text+' 응답 근거: '+area.evidence;g.service=area.action;g.measure=area.measure;g.measurement=narrative.followup;g.review=area.safety?narrative.safety:narrative.followup;}

 summary=narrative?[narrative.overview,narrative.safety,...narrative.connections.slice(0,2).map(x=>x.text),narrative.uncertainty].join('\n\n'):detailedReview.text.split('\n\n').slice(0,4).join('\n\n');
 const combined=signals.map(s=>({title:s.title,text:s.text,evidence:s.evidence}));
 const roleSteps=teacher?[
 ['① 학생 첫 면담','따로 안전하게 이야기할 시간을 마련하고 학생이 보고한 일·원하는 변화·안전한 연락 방법을 구분하여 확인합니다. 반복 진술이나 자체 증거수집을 요구하지 않습니다.'],
 ['② 학부모 접근 판단','보호자에게 연락하는 것이 학생의 안전을 해치지 않는지 먼저 확인합니다. 학대·성착취 의심 시 보호자 확인보다 관련 신고·보호 절차를 우선합니다.'],
 ['③ 학교 안의 도움','담임·상담교사·Wee클래스·교육복지 담당의 출결·수업·또래 보호·상담 지원을 학생과 함께 검토합니다.'],
 ['④ 가정과 지원 협의','안전한 경우 보호자에게 생활 여건과 이용 장벽을 비난 없이 묻고, 학교–가정 간 역할과 필요시 학맞통 협의 범위를 정합니다.'],
 ['⑤ 학생의 변화 확인','학생이 체감하는 학교생활 변화와 안전 상태를 같은 담당자가 다시 묻고 학교 조정의 실행 여부를 확인합니다.']
 ]:[
 ['① 사례판정 검토','안전대응은 즉시 이행하고, 지속 사례관리 수준은 욕구 복합성·시급성·지원 지속성·기존 주관기관을 추가사정·회의에서 결정합니다.'],
 ['② 우선 개입과 목표','확인된 문제를 우선순위로 정리하고 학생·가족 동의, 단기 목표, 실제 제공 가능한 첫 서비스와 담당을 구분합니다.'],
 ['③ 지역자원 의뢰','기관별 지원 대상·접수 가능·서류·연락 담당을 문의하고 정보제공 근거·안전한 인계 범위를 확인합니다.'],
 ['④ 역할분담과 서비스계획','학교·복지관·공공기관의 제공 역할과 의뢰·접수·서비스 시작 단계, 단기·중장기 목표·점검 기준을 협의합니다.'],
 ['⑤ 이행·성과 점검','회신·실제 이용·대기·중복·거절 사유와 학생의 생활 변화를 구분하고 재사정·계획 조정 여부를 기록합니다.']
 ];
 summary=(teacher?'[학생·보호자 접근 중심] ':'[사례판정 이후 개입·연계 중심] ')+summary;
 return {action:Action.build(p,{analysis:a,narrative}),narrative,role,analysis:a,evidence,combined,cross,summary,reviewFull:detailedReview.text,first,management,reason,approach,plans,roleSteps,missing:['학생이 직접 말한 우선욕구·동의·선호','실제 강점·보호요인과 현재 이용기관','발생시점·기간·생활 영향 및 현재 안전','가구구성·진단·보장자격·소득·부채·재산 등 척도로 확인되지 않는 사실']};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else root.YouthCaseExamples=api;
})(typeof window!=='undefined'?window:globalThis);
