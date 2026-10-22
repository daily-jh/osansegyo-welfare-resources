(function(root){'use strict';
const P=typeof module!=='undefined'?require('./planning-model.js'):root.YouthPlanning;
const M=typeof module!=='undefined'?require('./support-model.js'):root.YouthMap;
const I=typeof module!=='undefined'?require('./insights.js'):root.YouthInsights;
function create(p,role='teacher'){
 if(!['teacher','social-worker'].includes(role))throw Error('관점을 확인해 주세요.');const a=P.analyze(p),d=a.decision,teacher=role==='teacher',known=n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0;
 const evidence=a.active.flatMap(area=>area.numbers.filter(known).map(n=>({number:n,score:p.answers[n-1],question:p.domains.flatMap(x=>x.items)[n-1],domain:area.name}))),signals=I.analyze(p.answers),top=a.active.slice(0,3).map(x=>x.name);
 const first=d.urgent?'학생의 현재 안전과 보호 여건을 먼저 확인하고, 필요한 긴급·보호·신고 절차를 진행합니다. 서비스 예약이나 사례회의까지 기다리지 않습니다.':a.safetyPending?'안전 관련 미상·추가확인부터 학생에게 안전한 방법으로 살핍니다. 확인된 생활의 어려움에 대한 지원도 함께 시작합니다.':a.active.length?'학생이 가장 먼저 도움받고 싶은 일을 듣고, 두드러진 응답의 생활 영향과 기존 도움을 함께 확인합니다.':'이번 응답에서 드러나지 않은 어려움이나 학생이 바라는 도움이 있는지 열린 질문으로 살펴봅니다.';
 let management,reason;
 if(d.urgent){management='긴급안전개입 우선'+(a.pending.length?' · 추가사정 병행':'')+' · 참고 판정';reason='안전 관련 응답 또는 별도 보호 필요 표시가 있어 현재 안전 확인과 필요한 보호·전문 대응을 우선하는 예시입니다. '+(a.pending.length?'남은 미상·안전 추가확인은 추가사정으로 병행합니다. ':'')+'안전 대응 이후 일반·집중 사례관리와 공동개입 필요성은 생활 영향·지속성·보호요인을 확인해 별도로 논의합니다.';}
 else if(a.pending.length){management='추가사정 병행형 · 참고 판정';reason='미상 '+d.unknownItems.length+'문항과 현재 안전 추가확인 '+d.pendingChecks.length+'문항이 남아 전체 지원 수준의 확정 판단을 보류합니다. 확인된 어려움의 지원은 병행합니다.';}
 else if(d.observedLevel>=3){management='집중 통합사례관리 논의 · 참고 판정';reason='여러 영역의 두드러진 어려움과 높은 개별 응답이 함께 나타나 지속적인 조정 필요성을 우선 논의하는 예시입니다. 일반·집중의 최종 선정은 지속성·실제 생활 영향·기존 개입을 확인한 사례판정회의에서 정합니다.';}
 else if(d.integrated){management='일반 통합사례관리·공동지원 논의 · 참고 판정';reason='복수 영역의 지원을 함께 살펴볼 신호가 있어 학교와 지역기관의 역할 조정을 논의하는 예시입니다. 전문기관 주관 또는 집중관리 필요성은 별도로 확인합니다.';}
 else if(a.active.length){management='단기 조정·자원연계 우선 검토 · 참고 판정';reason='먼저 드러난 필요에 맞는 상담·자원연계를 시작하고, 반복성·지속성·생활 영향에 따라 일반 사례관리로 이어갈지 검토하는 예시입니다.';}
 else{management='관찰·면담으로 욕구 재확인 · 참고 판정';reason='0점은 이번 응답에서 어려움이 보고되지 않았다는 뜻입니다. 사례관리 미선정이나 종결을 자동으로 결정하지 않습니다.';}
 let approach=[];if(d.urgent||a.safetyPending)approach.push({name:'안전·보호 절차 우선',why:'안전 신호나 미확인을 일반 상담기법으로 대신하지 않습니다.',action:first});
 if(a.active.length){approach.push({name:'강점·생태체계 관점',why:'학생 개인의 문제로만 보지 않고 학교·가족·생활환경·지역 지원을 함께 살피는 기본 관점입니다. 실제 강점과 관계는 아직 확인되지 않았습니다.',action:'힘든 상황에서도 해온 일, 편안한 관계, 도움받은 경험을 묻고 학생이 원하는 변화부터 정합니다.'});
 if([16,18,19,20,21].some(known))approach.push({name:'문제해결 중심 접근',why:'돌봄·필수생활·지원 접근에 관한 응답이 있어 구체적 필요와 이용 장벽을 나누고 대안을 비교하는 접근이 적합한지 검토합니다.',action:'가장 시급한 생활 필요 → 가능한 지원 → 이용 조건·학생 선호 → 담당 역할 → 실제 제공 여부 순서로 확인합니다.'});
 if([9,10,11,14,15,22,23,24].some(known))approach.push({name:'과제중심·해결중심 질문 병행',why:'생활·교육 참여를 위한 작은 실행을 의논할 수 있습니다. 학생의 동기나 실행 여건은 점수로 판단하지 않습니다.',action:'“조금 덜 힘들었던 때는 무엇이 달랐나요?”를 묻고, 학생이 선택한 작은 과제와 학교·기관의 지원 과제를 구분합니다.'});}
 const plans=a.plans.map((g,index)=>{const numbers=g.domain.numbers.filter(known),groups=g.groups.slice(0,3),agencies=groups.map(group=>{const r=P.referral(p,g.domain,group.primary);return {name:group.name,service:group.primary['서비스명'],...r,reason:'응답 근거 '+r.evidence.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · ')+'에 따라 필요한 지원을 문의합니다. 함께 살펴볼 변화: '+r.outcome+'.'}});const safety=g.domain.safety,major=g.domain.critical||g.domain.peak>=3;
 return {id:g.id,domain:g.domain.name,numbers,evidence:numbers.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · '),priority:safety?'안전 우선':major?'생활 영향 우선 확인':'학생 희망과 함께 순서 협의',baseline:'척도 응답: '+numbers.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · ')+(g.domain.unknown?' / 이 영역 미상 '+g.domain.unknown+'개':'')+'. 실제 발생 횟수·기간·현재 상황과 보호요인은 미확인입니다.',shortGoal:g.goal,longGoal:'학생이 선택한 지원과 일상을 안정적으로 이어갈 수 있도록 돕습니다. 장기적으로 살펴볼 변화: '+g.measure+'.',service:g.task,owner:teacher?'학교 담당자는 학생 면담·교육 지원을 조정하고, 지역기관은 해당 전문·생활지원 가능 범위를 확인합니다.':'복지관 사례관리자는 생활 욕구·기존 지원을 살피고 자원 조정을 제안하며, 학교는 교육·학교생활 지원을 맡습니다.',timing:safety?'현재 안전 확인·보호 우선 / 후속 목표 기간은 안전 확보 후 협의':major?'첫 접촉에서 시급성 확인 / 단기 약 1개월·중기 약 3개월 검토':'학생이 바라는 순서부터 협의 / 단기 약 1개월·장기 약 3~6개월 검토',frequency:'초기 확인 후 필요에 맞춰 연락 주기 협의 · 정해진 횟수로 확정하지 않음',measure:g.measure,measurement:'첫 면담에서 현재 상태를 기준선으로 확인 → 학생과 원하는 변화·확인 시점을 합의 → 같은 기간·자료로 다시 살펴봄. 서비스 접수·시작과 생활 변화는 구분함.',agencies,studentTask:'학생이 원하고 감당할 수 있는 부분만 함께 정함. 신청·기관 연락·지원 책임을 학생 혼자 맡기지 않음.',review:safety?'안전이 달라지면 즉시 재확인. 이후 학교·전문기관의 조치·후속 연락이 실제 이어지는지 점검.':'첫 연계 문의·회신 시 접근 장벽을 살피고, 목표 기간에 학생의 경험과 실제 생활 변화로 재사정.'};});
 const summary=top.length?'이번 척도에서는 '+top.join(' · ')+' 영역의 응답을 중심으로 필요한 도움을 살펴볼 수 있습니다. '+(d.urgent?'총점과 별도로 안전·보호 절차가 먼저입니다. ':a.safetyPending?'아직 안전을 확인하지 못한 내용이 있어 안전한 확인과 지원을 함께 진행해야 합니다. ':'')+(d.integrated?'여러 영역의 어려움이 함께 나타나므로 한 기관의 서비스만으로 정리하기보다 학교와 지역기관의 역할을 함께 의논하는 방향을 제안합니다. ':'학생이 실제 겪는 생활 영향과 원하는 도움을 먼저 듣고 연계 범위를 정하는 방향을 제안합니다. '):'이번 응답만으로 구체적인 지원 필요를 정하기 어렵습니다. '+(d.incomplete?'미상은 어려움이 없다는 뜻이 아니므로 안전 관련 내용부터 확인하는 사정 예시를 제시합니다.':'학생이 바라는 도움과 생활을 면담에서 살피고 필요한 지원을 함께 찾습니다.');
 const combined=signals.map(s=>({title:s.title,text:s.text,evidence:s.evidence}));
 const roleSteps=teacher?[
 ['학교에서 먼저','학생이 안전하게 이야기할 자리와 연락 창구를 마련하고, 출결·수업·또래관계에서 조정 가능한 도움을 살핍니다.'],
 ['복지관·지역기관과 함께','생활·돌봄·가족 지원이나 전문상담이 필요하면 목적과 역할을 구분해 협의를 제안합니다.'],
 ['협의할 범위','학생의 희망·기존 지원·공유 근거와 최소 정보 범위를 확인합니다. 학교의 지원 결정과 복지관 사례선정은 각각의 절차로 진행합니다.']
 ]:[['초기상담·사정','학교 응답을 출발점으로 학생·보호자의 실제 생활 필요와 강점·기존 도움을 구분해 확인합니다.'],['사례판정 논의','안전·정보 공백·지속성·복합성·기관 기능을 종합해 일반·집중·타기관 주관·공동개입 방향을 검토합니다.'],['사례조정·계획','선정 후 학생과 단·장기목표, 기관별 역할·제공주기·점검방법을 협의합니다. 이 화면의 예시는 실제 결정과 합의 이전입니다.']];
 return {role,analysis:a,evidence,combined,summary,first,management,reason,approach,plans,roleSteps,missing:['학생이 직접 말한 우선욕구·동의·선호','실제 강점·보호요인과 현재 이용기관','발생시점·기간·생활 영향 및 현재 안전','가구구성·진단·보장자격·소득·부채·재산 등 척도로 확인되지 않는 사실']};
}
const api={create};if(typeof module!=='undefined')module.exports=api;else root.YouthCaseExamples=api;
})(typeof window!=='undefined'?window:globalThis);
