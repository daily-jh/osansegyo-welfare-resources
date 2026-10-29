(function(root){'use strict';
const M=typeof module!=='undefined'?require('./support-model.js'):root.YouthMap;
const itemObjectives=[
['학생이 폭력·위협으로부터 안전하게 보호받을 경로를 마련한다','현재 안전과 필요한 보호를 먼저 확인하고 사안별 보호·신고 담당과 후속 역할을 나눈다','안전한 보호·연락 경로와 후속 확인'],
['학생에게 필요한 보호·의료·위생이 이어지도록 돕는다','실제로 제공되지 않는 보호와 가정의 지원 필요를 구분하고 필요한 보호·생활지원 역할을 의논한다','필요한 보호가 실제 제공되는지'],
['학생이 또래 괴롭힘으로부터 안전하게 학교생활을 이어가도록 돕는다','학생이 안전하게 이야기할 자리와 접촉·피해를 줄일 학교 지원을 의논한다','추가 피해 여부와 학생이 느끼는 안전'],
['학생이 강요·착취 피해로부터 보호받을 경로를 마련한다','현재 위협·피해와 안전한 연락·보호 방법을 확인하고 전문 담당과 역할을 나눈다','위협·접촉 상황과 보호 경로의 작동'],
['다른 학생과 본인의 안전을 지키며 행동을 조절할 도움을 마련한다','구체적인 위협·폭력 행동과 현재 안전을 확인하고 피해 학생 보호와 해당 학생 지원을 구분한다','위험 행동의 발생·상황 변화와 피해 학생 보호'],
['학생이 정서적 어려움을 나누고 일상에 필요한 도움을 받는다','학생이 느끼는 어려움과 도움 선호를 듣고 상담 접근을 의논한다','학생이 말하는 정서·일상 변화'],
['학생이 안전하게 도움을 요청하고 필요한 전문지원에 접근한다','현재 안전을 우선 확인하고 필요한 보호·전문 대응과 후속 연락 담당을 정한다','안전 확인과 후속 도움의 실제 연결'],
['급격한 생활·정서 변화를 전문적으로 살필 경로를 마련한다','현재 상태와 생활 영향을 확인하고 필요한 전문평가·상담 경로를 문의한다','전문 도움 접근과 생활 변화'],
['학생이 수업 참여를 이어갈 수 있는 조건을 마련한다','지각·결석·등교 어려움의 구체적 상황과 학교에서 조정할 지원을 의논한다','합의한 기간의 수업 참여·출결과 학생 경험'],
['학생에게 맞는 학습 지원에 접근한다','수업 이해·과제 수행에서 어려운 부분과 적합한 교육 지원을 함께 찾는다','필요한 학습 지원 접근과 참여 경험'],
['학생이 원하는 배움·진로를 이어갈 방법을 함께 찾는다','학업을 이어가기 어려운 이유와 학생이 선택할 수 있는 경로를 의논한다','학생의 학업 지속 희망과 실행 가능한 경로'],
['충동적 위험 행동으로 인한 위해를 줄일 도움을 마련한다','현재 위험과 행동이 나타나는 상황을 확인하고 안전·상담·전문지원 역할을 의논한다','위험 행동의 발생 상황과 안전 변화'],
['건강·안전을 해치는 행동을 다룰 도움을 마련한다','구체적 행동·현재 급성 상태와 접근 가능한 상담·전문지원을 확인한다','건강·안전 행동과 지원 접근 변화'],
['학생의 특성에 맞는 교육환경 조정을 마련한다','학생에게 맞는 설명·감각·학습 환경과 학교의 조정 가능 범위를 확인한다','합의한 환경 조정의 시행과 학생 참여'],
['필요한 편의·발달·돌봄 지원에 접근한다','어떤 지원을 받지 못하는지와 실제 이용 조건·대기·대체 경로를 확인한다','미충족 지원에 대한 접근과 활동 제약 변화'],
['학생의 식사·생활관리·돌봄 공백을 줄인다','실제 돌봄 공백과 도움 가능한 사람·기관을 확인하고 제공 역할을 나눈다','돌봄이 필요한 시간과 실제 지원의 연결'],
['가족의 어려움이 학생 생활에 미치는 부담을 줄일 도움을 찾는다','학생에게 안전한 가족 참여 여부와 관계 상담·별도 지원 필요를 의논한다','학생이 느끼는 가족관계·생활의 변화'],
['학생이 맡은 가족돌봄 부담을 나눌 방법을 마련한다','학생이 실제 맡는 돌봄·가사와 학습·휴식에 미치는 영향을 확인하고 대체 도움을 의논한다','돌봄 부담·휴식·학습 시간과 학생 경험'],
['학생에게 부족한 필수 생활자원을 연결한다','실제 부족한 식사·의복·위생·준비물과 시급성을 확인하고 공공·민간 지원을 문의한다','확인된 필수 생활 필요의 충족과 유지'],
['안전하게 지낼 주거 여건을 마련할 도움을 찾는다','실제 주거 위험·기한과 임시 보호·주거 상담 등 가능한 지원을 확인한다','거주 안전·지속 가능성과 남은 위험'],
['비용 때문에 이용하지 못한 필요한 지원에 접근한다','학생에게 필요한 의료·교육·생활 지원과 비용·이용 장벽을 구분해 상담한다','미충족 서비스의 실제 이용과 비용 장벽 변화'],
['학생이 원하는 관계·활동에 참여할 방법을 찾는다','학생이 편안하게 느끼는 사람·활동과 참여 방식·접근 장벽을 의논한다','관계·활동에 대한 학생의 경험과 고립감 변화'],
['도움이 필요할 때 연락할 수 있는 신뢰 관계를 마련한다','학생이 선택한 어른·기관의 도움 가능 범위와 안전한 연락 경로를 확인한다','실제로 연락·도움 요청이 가능한 관계'],
['디지털 이용을 일상과 함께 조절할 도움을 마련한다','이용 상황과 수면·학습·활동 영향을 살피고 학생이 시도할 조정 방법을 의논한다','합의한 이용 조정과 일상 기능의 변화'],
['온라인 위협·성착취로부터 안전하게 도움받을 경로를 마련한다','현재 피해·위협과 안전한 연락방법을 확인하고 보호·전문지원 역할을 의논한다','추가 피해·접촉 여부와 안전한 보호 경로']
];
function objective(numbers){return [0,1,2].map(k=>numbers.map(n=>itemObjectives[n-1][k]).join('. ')+(k<2?'.':''))}
function positive(p,d){return d.numbers.filter(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0)}
function referral(p,d,row){const m=M.describe(p,d,row),name=row['기관명']||'',service=row['서비스명']||'';let role='해당 사업의 이용 조건과 학생에게 가능한 지원을 확인하는 협력기관';
 if(/아동보호/.test(name))role='아동보호 전문 사정·후속 사례관리의 협력 역할 · 신고 접수·보호 결정 권한과 구분';
 else if(/정신건강/.test(name))role='정신건강 전문상담·평가 경로 조정 · 학교의 일상 지원과 역할 분담';
 else if(/Wee/.test(name))role='학교 내 상담과 교육적 지원 조정 · 학교 담당자와 이용 경로 확인';
 else if(/청소년상담/.test(name))role='청소년 상담과 지역 지원 조정 · 기존 상담과 중복 여부 확인';
 else if(/행정복지|시청/.test(name))role='공공급여·긴급지원 상담 및 자격 확인 · 지원 결정은 담당 행정기관 심사';
 else if(/가족센터/.test(name))role='안전한 가족 참여를 전제로 가족관계 상담 지원';
 else if(/복지관/.test(name))role='생활·돌봄 지원과 지역자원 조정 · 주관 사례관리기관은 별도 협의';
 else if(/장학|후원|공모/.test(service))role='교육비 등 민간지원 가능성 검토 · 신청과 선정·지급은 별도 단계';
 return {contact:{contactDept:row.contactDept||'',phone:row['대표전화']||'',address:row.address||'',addressStatus:row.addressStatus||'미확인',addressCheckedOn:row.addressCheckedOn||'',addressNote:row.addressNote||'',contacts:row.contacts||[]},routingReason:row.routingReason||'',evidence:m.evidence,reason:m.reason,condition:m.condition+' · 성별: '+M.student(p).gender+' · 거주 행정동: '+(M.student(p).dong||'미확인')+' (실제 서비스 대상·관할 확인)',role,firstStep:m.safety?'일반 상담 접수를 기다리지 않고 안전·보호 절차를 우선하며, 이후 담당·접수·회신 경로를 확인합니다.':'학생의 희망과 기존 이용기관을 먼저 확인하고, 필요한 도움·실제 대상 조건·접수 가능 여부를 문의합니다.',outcome:objective(m.evidence)[2],handoff:'문의 후보 → 의뢰 → 접수 확인 → 서비스 시작 → 변화 점검. 각 단계의 담당·회신일을 따로 확인합니다.'};
}
function analyze(p){if(!M.validate(p))throw Error('평가 자료의 형식을 확인해 주세요.');const decision=M.context(p),domains=M.domains(p),active=M.rank(domains).filter(d=>d.sum>0),pending=[...new Set([...decision.unknownItems,...decision.pendingChecks])].sort((a,b)=>a-b),safetyPending=decision.safetyUnknown.length>0||decision.pendingChecks.length>0;
 const axes=[
 {name:'안전과 보호',text:decision.urgent?'안전·보호를 먼저 살펴야 하는 응답이 있습니다. 현재 상황 확인과 필요한 보호·신고·전문 대응을 우선합니다.':safetyPending?'안전 확인이 끝나지 않았습니다. 미확인을 안전한 상태로 해석하지 않고, 확인 담당과 시점을 정합니다.':'이번 응답에서 우선 안전 신호는 표시되지 않았습니다. 실제 면담과 현재 상황을 함께 확인합니다.'},
 {name:'함께 조정할 지원',text:active.length+'개 영역에서 어려움 응답이 있습니다. '+(decision.substantial.length>=2?'여러 영역의 생활 영향을 함께 살피고 기관 간 역할 조정을 검토합니다.':'지속성·생활 영향·이미 받고 있는 도움을 살펴 단기 연계와 지속 지원의 필요를 의논합니다.')+' 영역 수만으로 집중 사례관리를 확정하지 않습니다.'},
 {name:'학생의 희망과 실행 여건',text:'응답 점수로는 알 수 없습니다. 학생이 원하는 도움, 강점, 유보·거절 이유와 이동·시간·의사소통 여건을 면담에서 확인합니다.'},
 {name:'판단에 필요한 정보',text:'문항 응답 확인 '+decision.knownCount+'/25 ('+(decision.knownCount*4)+'%) · 미상 '+decision.unknownItems.length+'개. 이는 문항 확인율이며 사정 전체의 완료를 뜻하지 않습니다. '+(pending.length?'확인된 지원과 남은 정보 확인을 병행합니다.':'출처·시점·당사자 의견은 별도로 확인해야 합니다.')},
 {name:'사안의 지속성과 복합성',text:'동시에 보고된 영역 '+active.length+'개 / 상대적으로 높은 응답이 나타난 영역 '+decision.substantial.length+'개. 반복기간·최근 변화·가정과 학교 환경을 확인하기 전에는 만성복합 사례로 확정하지 않습니다.'},
 {name:'지원 참여·정보공유의 적법성',text:'학생·보호자에게 안전한 설명 방식, 동의와 유보, 기관별 공유 목적·법적 근거·필요 최소정보를 확인해야 합니다. 학교와 복지관의 권한 및 주관기관은 별도로 정합니다.'},
 {name:'서비스 접근 장벽과 기존 지원',text:'실제 접수 가능여부, 기존 서비스 중복, 비용·이동·시간·의사소통 어려움과 기관의 공급가능성을 확인합니다. 본 시스템의 기관 추천은 접수·선정 완료를 의미하지 않습니다.'},
 {name:'강점·보호요인과 당사자 선호',text:'응답 점수로 강점의 부재·보호자의 협력·학생의 희망을 추정하지 않습니다. 안전한 사람과 공간, 도움을 받은 경험, 학생이 원하는 변화를 면담으로 확인합니다.'}
 ];
 const options=[];
 if(decision.urgent)options.push({title:'안전·전문지원 우선 협의',reason:'안전 관련 응답 또는 별도 현재 위험·보호 필요 표시가 있어 안전 대응이 먼저입니다. 지속 사례관리 수준은 후속 사정에서 따로 정합니다.'});
 if(pending.length)options.push({title:'추가사정 병행',reason:'미상 또는 현재 안전 추가확인이 남아 있습니다. 선정·종결을 서두르지 않고, 확인된 필요에 대한 지원은 함께 진행합니다.'});
 if(decision.substantial.length>=2)options.push({title:'통합 사례관리·공동개입 필요성 검토',reason:'복수 영역에서 두드러진 어려움이 함께 나타났습니다. 지속성·기존 주관기관·학생 의사·조정 필요를 확인해 일반/집중 수준을 회의에서 정합니다.'});
 else options.push({title:active.some(d=>d.safety||d.peak>=2)?'단기 연계 또는 지속 사례관리 비교 검토':'면담·관찰에서 필요한 도움 재확인',reason:active.some(d=>d.safety||d.peak>=2)?'확인된 어려움에 대한 자원연계 이후에도 지원이 필요한지 살펴봅니다. 단기 연계만으로 충분하다는 결론은 아직 내리지 않습니다.':'학생이 느끼는 불편과 원하는 도움을 듣고 경과를 확인합니다. 경미한 응답만으로 장기계획을 확대하거나, 0점만으로 지원 불필요·종결을 확정하지 않습니다.'});
 const eligible=active.filter(d=>d.safety||d.peak>=2), observation=active.filter(d=>!eligible.includes(d));
 const defaultDomains=eligible.filter((d,i)=>i<3||d.safety).map(d=>d.i);
 const safetyPlan=decision.urgent?{title:"긴급 안전개입 계획(참고안)",evidence:[...p.explicit,...decision.safetyItems.map(n=>n+"번 "+p.answers[n-1]+"점"),...decision.checkItems.filter(n=>p.followups?.[n]==="yes").map(n=>n+"번 현재 위험 추가확인")],action:"학생이 지금 안전하게 지낼 수 있는지 확인하고, 급박한 위해가 있으면 현장 응급·보호 대응을 먼저 진행합니다. 일반 상담 예약이나 사례회의를 기다리지 않습니다.",firstContact:"급박한 위해·상해는 경찰·응급구조, 의심되는 학대·성적 침해는 신고·보호 담당 경로를 우선 확인합니다. 학교 또는 기관의 현장 담당자가 조정을 맡되 담당 지정이 대응을 늦추지 않도록 합니다.",protection:"학생에게 같은 진술이나 증거를 반복 요구하지 않습니다. 위험을 줄일 보호·연락 방법과 적용할 신고 절차를 사안에 맞게 확인합니다.",specialist:"안전 대응 이후 사안에 맞는 아동보호·정신건강·피해지원 전문기관과 후속 평가·지원을 협의합니다. 일반 상담기관을 긴급 출동기관으로 안내하지 않습니다.",followup:"인계받은 담당과 실제 접수·보호 조치 여부를 확인하고, 안전 상태가 달라지면 즉시 재확인합니다. 후속 연락 담당·시점·안전한 연락방법은 실제 협의 후 정합니다.",unknown:"현재 위치·상해·급박한 위험·곁에서 도울 사람·이미 취한 조치와 안전한 연락방법은 추가 확인이 필요합니다. 조치 완료나 안전 확보를 자동으로 단정하지 않습니다."}:null;
 const plans=eligible.map(d=>({id:'G-'+String(d.i+1).padStart(2,'0'),domain:d,baseline:positive(p,d).map(n=>n+'번 '+p.answers[n-1]+'점').join(' · ')+(d.unknown?' · 미상 '+d.unknown+'개':'' )+' · 구체적 생활상황·출처·시점은 추가 확인',goal:objective(positive(p,d))[0],task:objective(positive(p,d))[1],measure:objective(positive(p,d))[2],groups:M.groupedCandidates(p,d)}));
 options.unshift({title:decision.title,reason:decision.description});
 return {decision,domains,active,pending,axes,options,plans,observation,defaultDomains,safetyPlan,safetyPending,model:decision.urgent||safetyPending?'안전·보호 절차를 우선하면서 확인된 생활 문제를 함께 해결합니다. 구체적인 실천모델은 학생의 희망과 안전·실행 여건을 확인한 뒤 선택합니다.':decision.substantial.length>=2?'강점·생태체계 관점으로 학교·가족·지역의 역할을 함께 살피고, 먼저 해결할 생활 문제와 작은 실행과제를 의논합니다. 관점·기법·기관 서비스를 구분해 최종 모델을 선택합니다.':'학생이 바라는 변화를 먼저 듣고 문제해결·과제중심·해결중심 질문 중 적합한 접근을 검토합니다. 점수만으로 모델을 지정하지 않습니다.'};
}
const api={VERSION:'1.0.0-20261029',analyze,referral};if(typeof module!=='undefined')module.exports=api;else root.YouthPlanning=api;
})(typeof window!=='undefined'?window:globalThis);
