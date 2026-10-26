(function(root){'use strict';
const TOPICS=['학대·보호','방임·보호','또래 피해','강요·협박','또래 갈등·가해','정서적 어려움','자해 신호','정서·생활 변화','출결·수업참여','학습 어려움','학교생활 동기','위험행동','건강 위기','교육환경 조정','발달지원 접근성','기본 돌봄','가족 환경','가족돌봄 부담','필수생활 결핍','주거 환경','서비스 비용 장벽','사회참여 제약','지지 관계 부족','디지털 생활','온라인 피해'];
const PAIRS=[[3,9,'또래 피해와 학교 참여가 함께 보고됨','피해 시점과 출결 변화가 실제로 연결되는지'],[4,9,'협박·강요와 학교 참여가 함께 보고됨','현재 접촉과 안전한 등교 가능성'],[6,7,'정서 어려움과 자해 신호가 함께 보고됨','현재 안전과 자해 관련 상황'],[9,16,'출결 어려움과 돌봄 공백이 함께 보고됨','등교 준비와 돌봄 공백 시간대'],[9,17,'출결과 가족 어려움이 함께 보고됨','가족 상황과 결석 시점의 관계'],[9,18,'출결과 가족돌봄 부담이 함께 보고됨','학생의 돌봄 시간과 등교 시간의 중첩'],[9,19,'출결과 필수생활 부족이 함께 보고됨','식사·준비물 부족이 실제 참여를 막았는지'],[9,20,'출결과 주거 어려움이 함께 보고됨','수면·이동·거주 환경의 실제 영향'],[10,14,'학습 어려움과 교육환경 조정 필요가 함께 보고됨','기존 조정 지원과 그 효과'],[10,15,'학습 어려움과 발달지원 접근 문제가 함께 보고됨','진단 추정 없이 지원 경험과 미충족 필요'],[16,17,'기본 돌봄과 가족 어려움이 함께 보고됨','일상 돌봄 제공자와 공백 시간'],[17,18,'가족 어려움과 학생의 돌봄 부담이 함께 보고됨','학생 책임과 성인 대체지원'],[19,21,'필수생활 부족과 서비스 비용 장벽이 함께 보고됨','실제 부족한 서비스와 비용·자격 장벽'],[6,23,'정서 어려움과 지지 관계 부족이 함께 보고됨','안전하게 도움을 요청할 수 있는 사람'],[3,25,'또래 피해와 온라인 피해가 함께 보고됨','같은 사건인지와 현재 접촉 위험']];
const ITEM_LEVELS=[["직접적인 학대·위해 정황","불편하거나 위협적인 접촉·언행의 단서","학대·위해가 의심되는 구체적 상황","현재 또는 반복되는 위해 가능성을 확인해야 할 상황","심각하거나 지속되는 위해 정황이 보고된 상황"],["보호자 돌봄의 결핍","일부 돌봄이나 보호가 충분하지 않을 가능성","일상에서 필요한 보호가 빠지는 상황","돌봄 공백이 생활·안전에 뚜렷한 영향을 주는 상황","즉각적인 보호 공백이 의심되는 상황"],["또래로부터의 피해","또래관계에서 불편한 피해 경험","또래 피해가 학교생활에 영향을 줄 가능성","반복 또는 심화된 피해 경험이 보고된 상황","학교생활과 안전을 크게 위협하는 피해 경험"],["강요·협박·통제","거절하기 어려운 요구를 경험했을 가능성","강요·협박이 일상 선택을 제한할 가능성","강요·협박으로 안전·학교생활에 영향이 있는 상황","현재 보호가 시급할 수 있는 강요·협박 상황"],["또래 갈등과 타인 피해","갈등 또는 상대방이 불편해한 행동의 단서","갈등·피해 행동이 반복될 가능성","다른 학생의 안전이나 관계에 뚜렷한 영향","심각한 피해 또는 위해가 보고된 상황"],["정서적 고통","불안·우울 등 마음의 불편이 일부 보고됨","마음의 어려움이 일상에 영향을 줄 가능성","정서적 고통으로 학교·생활 기능이 저하된 상황","심한 정서적 고통과 일상 유지 어려움"],["자해 관련 신호","자해 관련 표현·행동의 단서","자해 관련 상황을 구체적으로 확인해야 하는 응답","현재 안전과 자해 행동의 맥락 확인이 중요한 상황","즉시 안전평가가 필요할 수 있는 심각한 신호"],["정서·생활 변화","평소와 다른 기분·수면·활동 변화","생활 변화가 일상에 영향을 주기 시작함","생활 변화가 여러 활동을 방해하는 상황","일상 유지가 크게 어려워진 변화"],["학교 출결·참여","일부 수업·등교 참여의 어려움","출결이나 참여의 어려움이 반복될 가능성","학교 참여에 뚜렷한 제약이 보고됨","학교 참여가 매우 크게 제한된 상황"],["학습 이해와 수행","일부 학습 장면에서 어려움","학습 어려움으로 지원이 필요할 가능성","여러 학습 활동의 수행에 뚜렷한 어려움","기본적인 학습 참여가 크게 어려운 상황"],["학교생활 소속감·동기","학교생활에서 일부 소외감·의욕 저하","학교생활에 대한 거리감이 커지는 상황","학교생활 참여 의지가 뚜렷하게 낮아진 상황","학교생활을 유지하기 매우 어렵게 느끼는 상황"],["행동 조절·위험행동","일부 충동적이거나 위험한 행동 단서","행동의 반복과 생활 영향 확인이 필요함","행동으로 본인·타인의 생활과 안전에 영향","즉각적인 위해 가능성 확인이 필요한 행동"],["신체 건강 문제","몸 상태와 건강관리의 일부 어려움","건강 문제로 일상 활동에 영향 가능성","건강 문제로 학교·생활 유지가 어려움","건강상 긴급성이나 심한 기능 제약 가능성"],["교육환경·조정 필요","수업 설명·환경이 일부 맞지 않음","적절한 학습 조정이 부족할 가능성","교육환경 미조정으로 학습 참여가 제약됨","교육 접근성이 크게 제한된 상황"],["발달지원·보조서비스","필요한 지원을 일부 이용하기 어려움","지원 공백으로 생활·학습에 영향 가능성","필요한 지원의 부족이 참여를 크게 제한","필수적인 조정·지원의 상당한 공백"],["식사·일상 돌봄","식사나 기본 돌봄에서 일부 어려움","돌봄 부족이 일상에 영향을 줄 가능성","기본 돌봄 공백이 생활 유지에 뚜렷한 영향","필수 돌봄의 중대한 공백 가능성"],["가족의 어려움","가족상황으로 일부 걱정·불편","가족상황이 학생 생활에 영향을 줄 가능성","가족 문제로 정서·학교생활에 뚜렷한 영향","가족상황으로 일상 유지가 크게 어려움"],["학생의 가족돌봄 부담","가족을 돕느라 일부 시간 부담","돌봄 역할이 휴식·학습에 영향 가능성","가족돌봄 책임이 학교·생활을 뚜렷이 제한","학생에게 과도한 돌봄 책임이 집중된 상황"],["필수생활 물품·식사","일부 필수물품을 마련하기 어려움","식사·위생·준비물 부족이 생활에 영향","필수생활 결핍이 학교·건강에 뚜렷한 영향","당장 필수생활 지원이 필요할 수 있는 결핍"],["주거 안정과 환경","거주공간에서 일부 불편·제약","주거환경이 수면·학습에 영향을 줄 가능성","주거 불안·환경문제가 생활을 뚜렷이 제한","안전한 거처·기본생활 유지가 크게 어려움"],["필요 서비스의 비용","비용 때문에 일부 이용을 망설임","비용이 필요한 서비스 접근을 제한","비용 장벽으로 중요한 서비스를 이용하지 못함","필수 서비스의 심각한 미이용·중단 가능성"],["사회활동 참여","원하는 활동에 일부 참여 제약","참여 기회 부족으로 관계·경험에 영향","활동 참여가 지속적으로 크게 제한됨","사회참여 기회가 거의 확보되지 않는 상황"],["도움을 청할 지지 관계","도움을 청할 사람·방법이 일부 불확실","어려울 때 도움받기 어려운 상황","실제 위기 시 연락할 지지망이 매우 부족","현재 안전·생활에 필요한 도움 연결이 거의 없음"],["디지털 생활 조절","디지털 사용으로 일부 생활 불편","수면·학습·관계에 영향이 나타날 가능성","디지털 생활 문제가 일상 기능을 뚜렷이 방해","일상 유지가 크게 어려운 디지털 관련 문제"],["온라인 피해·착취","온라인에서 불편하거나 위험한 접촉 단서","온라인 피해의 구체적 상황 확인이 필요","협박·유포 등 안전 영향이 큰 피해 가능성","현재 보호가 시급할 수 있는 심각한 온라인 피해"]];
const RESEARCH=Object.freeze({version:'OY-CIE-content-validity-v2.1',status:'연구 근거 반영·개별 문항의 실증 타당도 미확보',sources:[{title:'청소년 위기스크리닝 척도 개정 (2024)',url:'https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE12583193',application:'위기 선별 문항 및 현장 활용 목적 비교',limit:'절단점·문항 모수 전용 불가'},{title:'청소년 위기 극복 역량 검사 개발 및 타당화 (2022)',url:'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002874766',application:'도움추구·관계유지·갈등해결 등 보호요인과 IRT 검토',limit:'654명 표본의 결과는 OY-CIE에 대한 검증 아님'},{title:'은둔청소년 판별을 위한 스크리닝 척도 개발 (2024)',url:'https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003138943',application:'사회적 고립·회피·생활리듬을 구분하는 다차원 접근',limit:'해당 연구 절단점 OY-CIE에 전용 불가'},{title:'COSMIN content validity methodology',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5891557/',application:'문항 관련성·포괄성·이해가능성·응답범주 적절성',limit:'문항 의미 정의만으로 내용타당도 확립 불가'},{title:'SDQ psychometric properties',url:'https://pubmed.ncbi.nlm.nih.gov/11699809/',application:'정서·행동·또래관계 및 정보원별 검토',limit:'SDQ 점수와 OY-CIE 점수 직접 대응 불가'},{title:'C-SSRS initial validity',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3893686/',application:'자해 신호 현재성·강도·행동 별도 확인',limit:'OY-CIE 자해 문항만으로 자살위험도 산출 금지'}],principles:['0점=이번 응답에서 미보고, 안전 보장 아님','1~4점=해당 문항의 응답 수준, 사건의 사실·지속성·빈도 자동 확정 불가','미상=결측·확인 보류, 0점 대체 금지','복합문항 공동 보고=가설, 인과관계·예측확률 아님','실제 위험은 현재성·생활 영향·보호요인·정보원별 근거와 함께 판단','가중치와 유사도는 별도 검증 전 연구 지표']});
const PROBES=[["현재 안전한 장소","보호 가능한 성인","행동의 시점"],["돌봄 제공자","실제 돌봄 공백 시간","안전한 보호 대안"],["피해 발생 시점","반복 여부","학교 내 보호 조치"],["강요·협박의 현재성","접촉 경로","안전한 도움 요청"],["구체적인 행동과 영향","피해 여부","갈등의 맥락"],["정서 고통 지속기간","수면·학습 영향","학생이 원하는 도움"],["현재 안전과 생각·행동","안전한 보호자","즉각 전문평가 필요성"],["변화 시작 시점","일상 영향","신체·정서 요인"],["결석·지각의 실제 이유","발생 시간","학교 내 조정 가능성"],["막히는 학습 활동","기존 지원","학습환경 조정"],["학교 소속감","원하는 변화","관계 자원"],["행동 발생 맥락","안전 영향","대체 행동 지원"],["증상의 현재성","진료·지원 여부","응급 신호"],["수업 조정 필요","실제 지원 여부","조정 효과"],["필요 지원과 실제 접근","기존 서비스","학생 선호"],["식사·위생·보호 상황","공백 시간","대체 돌봄"],["가족 변화의 시점","학생 생활 영향","보호적 관계"],["학생의 돌봄 시간","등교·휴식 영향","성인 대체 가능성"],["실제 부족한 필수품","생활 영향","당일 지원"],["거주 안정","수면·이동 영향","현재 안전"],["이용하지 못한 서비스","비용·자격 장벽","대체 지원"],["참여 희망 활동","제약 원인","접근 가능한 활동"],["연락 가능한 지지자","도움 요청 경험","연락 안전성"],["디지털 이용의 기능 영향","수면·학습 변화","온라인 관계"],["피해 현재성","협박·유포 위험","안전한 신고·보호"]];
const LABELS={0:'이번 응답에서 보고되지 않음',1:'낮은 수준의 징후 보고',2:'주의가 필요한 어려움 보고',3:'높은 수준의 어려움 보고',4:'매우 높은 수준의 어려움 보고',unknown:'정보 미확인'};
function interpret(answers){if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 0~4점·미상 필요');
const items=answers.map((value,i)=>({id:i+1,topic:TOPICS[i],value,meaning:interpretItemScore(i+1,value).meaning,scoreInterpretation:interpretItemScore(i+1,value).interpretation,scoreAction:interpretItemScore(i+1,value).action,safety:[1,2,7,25].includes(i+1),verify:PROBES[i],evidenceStatus:'개발 가설·문항별 실증 검증 전',interpretationLimit:'원문 문항별 응답 앵커 검증 전: 점수만으로 발생 사실·빈도·지속기간·생활 영향·진단·인과관계·긴급도 확정 불가',anchorVerified:false}));
const links=PAIRS.filter(([a,b])=>typeof answers[a-1]==='number'&&answers[a-1]>0&&typeof answers[b-1]==='number'&&answers[b-1]>0).map(([a,b,meaning,question])=>({a,b,meaning,question,score:Math.min(answers[a-1],answers[b-1]),sum:answers[a-1]+answers[b-1]})).sort((x,y)=>y.score-x.score||y.sum-x.sum||x.a-y.a);
const ranked=items.filter(x=>typeof x.value==='number'&&x.value>0).sort((a,b)=>Number(b.safety)-Number(a.safety)||b.value-a.value||a.id-b.id);
return {version:'OY-CIE-V2-research',items,links,ranked,unknown:items.filter(x=>x.value==='unknown'),safety:ranked.filter(x=>x.safety),knownTotal:answers.reduce((n,x)=>n+(typeof x==='number'?x:0),0),caveat:'연관 가설은 인과관계·검증된 위험확률이 아니며 원점수·공식 안전판정과 분리됨'};}

const EVIDENCE_LIBRARY=Object.freeze([
 {id:'KYCI-2024',title:'청소년 위기스크리닝 척도 개정',year:2024,url:'https://kyci.or.kr/userSite/lib/public_read.asp?Gubun=T&Page=1&idx=R361',appliesTo:['screening','referral','practice'],transfer:'청소년 위기 선별 및 개입 연계의 절차 설계',limitation:'OY-CIE 개별 문항의 타당도·절단점·가중치를 입증하지 않음'},
 {id:'COSMIN-2018',title:'COSMIN content validity Delphi study',year:2018,url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5891557/',appliesTo:['anchors','content-validity','comprehension'],transfer:'문항·응답범주·회상기간의 관련성·포괄성·이해가능성 점검',limitation:'외부 연구의 내용타당도를 본 척도로 이전할 수 없음'},
 {id:'COSMIN-2025',title:'Content validity: COSMIN perspective',year:2025,url:'https://pubmed.ncbi.nlm.nih.gov/40562250/',appliesTo:['validation','content-validity'],transfer:'대상자와 전문가의 질적 검토 및 반복 수정',limitation:'개발 가설을 임상적 판단으로 확정할 수 없음'},
 {id:'SDQ-2001',title:'Psychometric properties of the SDQ',year:2001,url:'https://pubmed.ncbi.nlm.nih.gov/11699809/',appliesTo:['multi-informant','strengths','function'],transfer:'학생·교사·보호자 등 정보원 간 차이와 강점 영역 검토',limitation:'SDQ의 절단점·진단 예측치를 OY-CIE에 적용 금지'}
]);
const REASONING_RULES=Object.freeze({
 input:['CORE 25개 응답','현재 안전 관련 정보','학생 서술','정보원별 진술','기존 지원 및 보호요인'],
 invariants:['CORE 원점수 변경 금지','미상은 0점으로 대체 금지','안전판정은 가중합과 분리','문항 점수는 사건의 사실·인과·진단 증거가 아님'],
 priority:'안전 신호 우선 → 문항별 응답 수준 → 복합 보고 → 실제 생활 영향 확인 → 학생 희망 및 강점 → 실무자 결정',
 evidenceGrades:{observed:'직접 보고된 응답',hypothesis:'문항 동시 보고로 제기한 가설',unknown:'면담·추가 정보 필요',validated:'본 시스템에서 아직 없음'},
 uncertainty:'점수 의미의 세부 앵커·가중치·교차 가설은 전문가 및 사례 기반 검증 전',
 outputs:['학생 상황 요약','안전 확인','우선 면담 질문','대안 가설','지원계획 근거']
});
const MULTI_DOMAIN_PATTERNS=Object.freeze([
 {id:'protect-school',items:[1,2,11],label:'보호환경과 학교생활 참여',question:'현재 보호환경·돌봄 제공자와 학교생활 변화의 시점이 연결되는지 확인',alternatives:['학교 내 관계','건강 및 정서','학습환경']},
 {id:'care-attendance',items:[9,17,18],label:'가족 상황·돌봄 부담과 출결',question:'학생이 실제 맡는 돌봄 시간과 등교·수업 시간이 겹치는지 확인',alternatives:['또래 피해','신체 건강','통학 및 수업환경']},
 {id:'housing-attendance',items:[9,19,20],label:'기본생활·주거와 학교 참여',question:'주거·필수생활 어려움이 수면·등교·수업에 미치는 실제 영향 확인',alternatives:['학습 접근성','또래 관계','가족의 일상 일정']},
 {id:'emotion-support',items:[6,7,23],label:'정서적 어려움·안전 신호·지지 관계',question:'현재 안전과 학생이 신뢰하는 성인·지원망을 별도로 확인',alternatives:['일시적 갈등','다른 정보원의 관찰','이미 이용 중인 지원']},
 {id:'learning-access',items:[10,14,15],label:'학습 수행과 교육 접근성',question:'학생에게 맞는 교육 조정·보조 지원의 실제 제공 여부와 효과 확인',alternatives:['교수 방식','결석에 따른 학습 공백','언어·건강 요인']}
]);
function crossDomainAssessment(answers){
 if(!Array.isArray(answers)||answers.length!==25)throw Error('25개 응답 필요');
 return MULTI_DOMAIN_PATTERNS.filter(p=>p.items.every(i=>typeof answers[i-1]==='number'&&answers[i-1]>=2)).map(p=>({
  id:p.id,items:p.items,scores:p.items.map(i=>answers[i-1]),label:p.label,
  hypothesis:p.label+' 영역의 어려움이 함께 보고되었습니다. 서로 영향을 주는지는 확인되지 않았습니다.',
  verification:p.question,alternatives:p.alternatives,certainty:'미검증 교차 가설',
  safetyFirst:p.items.some(i=>[1,2,7,25].includes(i)),
  scoreEvidence:p.items.map(i=>interpretItemScore(i,answers[i-1]))
 }));
}
const COMBINATION_SPACE=Object.freeze({items:25,scoredLevels:5,unknownIncluded:true,totalScored:'298023223876953125',totalWithUnknown:'28430288029929701376',method:'실시간 조합 생성; 전체 경우의 수를 저장하거나 실증 검증했다는 뜻이 아님'});
function scoreCombination(answers){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 0~4점·미상 필요');
 const items=answers.map((v,i)=>interpretItemScore(i+1,v));
 const pairs=[];
 for(let a=0;a<25;a++)for(let b=a+1;b<25;b++){
  const va=answers[a],vb=answers[b];
  if(typeof va!=='number'||typeof vb!=='number'||va===0||vb===0)continue;
  const known=PAIRS.find(p=>p[0]===a+1&&p[1]===b+1);
  const safety=[1,2,7,25].includes(a+1)||[1,2,7,25].includes(b+1);
  const strength=Math.min(va,vb);
  const mode=known?'사전 정의된 공동 보고 가설':safety?'안전 문항을 포함한 공동 보고':'두 영역의 동시 응답';
  pairs.push({a:a+1,b:b+1,scores:[va,vb],mode,priority:safety?'안전 우선 확인':strength>=3?'생활 영향 우선 확인':'맥락 확인',meaning:known?known[2]:TOPICS[a]+' 및 '+TOPICS[b]+' 어려움이 함께 보고됨',verify:known?known[3]:'두 응답의 시점·실제 생활 영향·학생이 원하는 지원을 각각 확인',causal:false,validated:false,strength});
 }
 pairs.sort((x,y)=>Number(y.priority==='안전 우선 확인')-Number(x.priority==='안전 우선 확인')||y.strength-x.strength||x.a-y.a||x.b-y.b);
 return {version:'OY-CIE-combinatorial-v3.3',items,pairs,pairCount:pairs.length,triples:crossDomainAssessment(answers),safety:items.filter(x=>[1,2,7,25].includes(x.item)&&typeof x.score==='number'&&x.score>0),unknown:items.filter(x=>x.score==='unknown'),knownTotal:answers.reduce((t,v)=>t+(typeof v==='number'?v:0),0),complete:answers.every(v=>v!=='unknown'),combinationSpace:COMBINATION_SPACE,interpretationStatus:'규칙 기반 가설·실증 검증 전'};
}
const DEVELOPMENT_KNOWLEDGE=Object.freeze([
 {id:'protection-daily',label:'보호환경과 일상생활',groups:[[1,2],[16,19,20]],threshold:1,development:'청소년기의 예측 가능한 돌봄과 생활리듬은 학습·정서·사회적 참여를 지탱하는 환경입니다.',hypothesis:'보호 관련 어려움과 기본생활의 불편이 함께 보고되어 현재 안전과 일상 유지 여건을 함께 살펴볼 필요가 있습니다.',check:'현재 안전, 식사·수면·위생, 돌봄 제공자, 실제 공백 시간',alternative:'경제적 어려움 자체를 학대·방임으로 판단하지 않으며 필요한 지원의 접근성을 확인',support:'안전 확인을 선행하고 돌봄·생활지원 필요를 학생 및 보호 가능한 성인과 구체화',sources:['WHO-ADOLESCENT','CDC-CONNECTEDNESS']},
 {id:'protection-school',label:'보호환경과 학교 참여',groups:[[1,2],[9,11]],threshold:1,development:'학교는 청소년의 소속감과 일상 구조를 제공할 수 있으며, 보호환경과 학교 경험을 함께 살펴야 합니다.',hypothesis:'보호환경과 학교생활 참여의 어려움이 동시에 보고되어 두 상황의 시점과 생활 영향을 확인할 필요가 있습니다.',check:'현재 안전, 학교 참여 변화 시점, 또래·교사 관계, 학생이 원하는 지원',alternative:'학습 부담, 또래관계, 건강, 학교환경 등 다른 설명도 검토',support:'안전 확인 이후 학교 내 신뢰할 담당자와 개별 지원계획 협의',sources:['WHO-ADOLESCENT','CDC-CONNECTEDNESS']},
 {id:'care-attendance',label:'돌봄·가족환경과 출결',groups:[[16,17,18],[9]],threshold:1,development:'청소년은 자율성을 확장하는 시기지만 과도한 돌봄 책임이나 생활지원 공백은 학습 참여와 병행하기 어려울 수 있습니다.',hypothesis:'돌봄·가족환경의 어려움과 학교 참여의 어려움이 함께 보고되었습니다.',check:'등교 준비, 가족돌봄 시간, 통학·수면·건강 상황',alternative:'가족 형태나 소득만으로 출결의 원인을 추정하지 않음',support:'실제 시간대별 공백을 확인하고 학교·가족·지역 돌봄지원 조정',sources:['WHO-ADOLESCENT']},
 {id:'emotion-support',label:'정서적 어려움과 지지관계',groups:[[6,8],[23]],threshold:1,development:'청소년기의 또래·성인 지지 관계와 학교 소속감은 어려움에 대처하는 보호요인이 될 수 있습니다.',hypothesis:'정서적 어려움과 지지자원 부족이 함께 보고되어 도움 요청 가능성을 살펴볼 필요가 있습니다.',check:'신뢰하는 성인, 친구, 기존 상담, 도움 요청의 안전성',alternative:'지지관계 응답만으로 고립이나 정신질환을 확정하지 않음',support:'학생이 선택한 안전한 지지자 연결 및 필요시 상담 접근성 확인',sources:['CDC-CONNECTEDNESS','WHO-ADOLESCENT']},
 {id:'peer-school',label:'또래 안전과 학교 참여',groups:[[3,4,5],[9,11]],threshold:1,development:'청소년기의 또래 소속감과 학교 안전 경험은 학교 참여를 이해하는 중요한 맥락입니다.',hypothesis:'또래관계 어려움과 학교 참여의 어려움이 함께 보고되어 안전과 학교 경험을 구분해 확인할 필요가 있습니다.',check:'현재 접촉·위협, 출결 변화, 안전한 학교 공간, 신뢰 교직원',alternative:'피해·가해 사실이나 인과관계는 면담 및 별도 절차로 확인',support:'학생 안전 확보 및 학교 내 사안별 보호·지원 절차 검토',sources:['CDC-CONNECTEDNESS']},
 {id:'housing-learning',label:'주거·기본생활과 학습환경',groups:[[19,20,21],[9,10,14]],threshold:1,development:'안정적인 휴식·학습 공간과 기본생활 자원은 학습 참여를 뒷받침할 수 있습니다.',hypothesis:'생활여건과 학습 관련 어려움이 함께 보고되어 실제 이용·접근 장벽을 확인할 필요가 있습니다.',check:'수면·학습 공간, 식사, 이동, 필요한 서비스 비용·이용조건',alternative:'경제적 어려움을 학습능력이나 보호자 책임으로 환원하지 않음',support:'필수생활과 교육 접근성 지원을 병행 검토',sources:['WHO-ADOLESCENT']},
 {id:'family-behavior',label:'가족환경과 행동·정서조절',groups:[[17,18],[5,12]],threshold:1,development:'청소년기의 자율성 발달과 관계 갈등은 환경·기능·안전 맥락에서 구분하여 살펴야 합니다.',hypothesis:'가족환경과 행동 관련 어려움이 함께 보고되어 행동이 발생하는 상황과 기능을 확인할 필요가 있습니다.',check:'갈등 전후 상황, 안전, 행동의 결과, 학생의 관점과 강점',alternative:'행동을 의지 부족·품행장애로 단정하지 않음',support:'비난 없는 기능적 사정과 가족·학교 협력적 문제해결',sources:['WHO-ADOLESCENT']}
]);
const DEVELOPMENT_SOURCES=Object.freeze([
 {id:'WHO-ADOLESCENT',title:'WHO Adolescent mental health',url:'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health',scope:'청소년 발달·사회환경·보호요인에 대한 일반 원칙',limit:'OY-CIE 개별 조합의 인과·위험확률을 검증하지 않음'},
 {id:'CDC-CONNECTEDNESS',title:'CDC School Connectedness',url:'https://www.cdc.gov/youth-behavior/school-connectedness/index.html',scope:'학교 소속감·지지적 관계의 보호요인',limit:'개별 사례의 학교생활 원인을 증명하지 않음'}
]);
function developmentalAssessment(answers){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 0~4점·미상 필요');
 const matches=DEVELOPMENT_KNOWLEDGE.map(k=>{
  const groups=k.groups.map(g=>g.filter(i=>typeof answers[i-1]==='number'&&answers[i-1]>=k.threshold));
  if(groups.some(g=>!g.length))return null;
  const itemIds=[...new Set(groups.flat())];
  const safety=itemIds.some(i=>[1,2,7,25].includes(i));
  const prominence=itemIds.reduce((n,i)=>n+answers[i-1],0);
  return {id:k.id,label:k.label,itemIds,development:k.development,interpretation:k.hypothesis,verify:k.check,alternative:k.alternative,support:k.support,sources:k.sources,safetyFirst:safety,priorityScore:prominence,certainty:'발달·환경 지식 기반 사정 가설; 개별 인과관계 미확인'};
 }).filter(Boolean);
 matches.sort((a,b)=>Number(b.safetyFirst)-Number(a.safetyFirst)||b.priorityScore-a.priorityScore||a.id.localeCompare(b.id));
 return {version:'OY-CIE-development-v3.4',cases:matches,summary:matches.length?matches.slice(0,3).map(x=>x.interpretation).join(' '):'현재 응답만으로 발달·환경 복합 가설을 특정하기 어렵습니다. 학생의 일상과 강점, 미확인 정보를 면담으로 확인합니다.',knowledgeCount:DEVELOPMENT_KNOWLEDGE.length,sourceCount:DEVELOPMENT_SOURCES.length,caveat:'관련성이 관찰되더라도 학대·진단·인과관계·지원 자격을 자동 확정하지 않습니다.'};
}
function evidenceAssessment(answers){
 const f=formulate(answers);
 const observed=f.scored.map(x=>({item:x.id,score:x.value,topic:x.topic,meaning:x.meaning,provenance:'CORE 응답',certainty:'observed',impact:x.impact,weight:x.weight}));
 const multiDomain=crossDomainAssessment(answers);
 const combinations=scoreCombination(answers);
 const developmental=developmentalAssessment(answers);
 const hypotheses=f.intersections.map(x=>({items:[x.a,x.b],statement:x.meaning,verification:x.next,certainty:'hypothesis',notCausal:true}));
 const alternatives=[];
 if(f.scored.some(x=>x.id===9)&&f.scored.some(x=>[17,18,19,20].includes(x.id)))alternatives.push('출결 어려움은 돌봄·주거 상황과 관련될 수 있으나, 또래관계·건강·학교환경 등 다른 설명도 확인해야 합니다.');
 if(f.scored.some(x=>x.id===11)&&f.scored.some(x=>[1,2,3,6,7].includes(x.id)))alternatives.push('학교생활 동기 응답을 개인의 의지 부족으로 해석하지 말고 안전·관계·정서 및 학교환경을 함께 확인해야 합니다.');
 if(f.scored.some(x=>[1,2,7,25].includes(x.id)))alternatives.push('안전 관련 응답은 점수 수준이나 총점과 무관하게 현재 상황과 보호 필요성을 별도로 확인합니다.');
 const priorities=observed.slice(0,4).map(x=>({topic:x.topic,score:x.score,why:'해당 문항의 응답 수준과 사전 설정된 검토 우선순위',next:f.base.items[x.item-1].verify[0],notDiagnosis:true}));
 return {version:'OY-CIE-evidence-v3.2',observed,hypotheses,multiDomain,combinations,developmental,alternatives,priorities,missing:f.unknown,coreTotal:f.rawScore,coreComplete:!f.rawIncomplete,safetySignals:f.base.safety.map(x=>x.id),evidenceLibrary:EVIDENCE_LIBRARY,reasoningRules:REASONING_RULES,modelStatus:'연구 기반 설계 가설·실증 검증 전'};
}
const SCORE_MEANING_RULES=Object.freeze({
 0:{status:'미보고',interpretation:'이번 응답에서 해당 문항의 어려움이 보고되지 않았습니다.',action:'다른 자료와 불일치하면 확인',certainty:'응답 사실만 확인'},
 1:{status:'초기 확인',interpretation:'낮은 응답 수준입니다. 상황의 종류·시점과 실제 영향을 확인합니다.',action:'학생의 언어로 구체적인 경험 질문',certainty:'사건·빈도·영향 확정 불가'},
 2:{status:'구체적 사정',interpretation:'중간 응답 수준입니다. 상황의 맥락과 생활 영향을 구체적으로 확인합니다.',action:'시점·빈도·학교·가정 기능 영향 확인',certainty:'사건·빈도·영향 확정 불가'},
 3:{status:'우선 사정',interpretation:'높은 응답 수준입니다. 안전과 실제 생활 영향의 우선 확인이 필요합니다.',action:'안전·기능·학생 희망을 구분해 우선 면담',certainty:'위해 사실·중증도 자동 확정 불가'},
 4:{status:'신속 사정',interpretation:'가장 높은 응답 수준입니다. 상황의 현재성과 안전·생활 영향 확인을 서둘러야 합니다.',action:'현재 안전·보호 및 지원 공백 우선 확인',certainty:'진단·응급도 자동 확정 불가'},
 unknown:{status:'미상',interpretation:'확인되지 않은 응답입니다. 0점으로 대체하지 않습니다.',action:'학생에게 안전한 방식으로 확인',certainty:'판단 보류'}
});
function interpretItemScore(item,score){
 if(!Number.isInteger(item)||item<1||item>25||!(score==='unknown'||Number.isInteger(score)&&score>=0&&score<=4))throw Error('문항 번호 또는 응답 범위 오류');
 const topic=TOPICS[item-1],rule=SCORE_MEANING_RULES[score],probe=PROBES[item-1],context=score===0?topic+' 영역의 어려움이 이번 응답에서 보고되지 않았습니다.':score==='unknown'?topic+' 관련 정보가 확인되지 않았습니다.':topic+' 영역에서 '+score+'점이 보고되었습니다. 검토할 상황은 '+String(ITEM_LEVELS[item-1][score]).replace(/[.。]\s*$/,'')+'입니다.';
 return {item,score,topic,status:rule.status,meaning:context,interpretation:rule.interpretation,action:rule.action,questions:probe,certainty:rule.certainty,anchorVerified:false,source:'학생·평가자 입력 CORE 문항 응답',evidenceLevel:'개발 가설',caution:'원문 응답 앵커와 실제 상황을 확인하기 전 사건·지속기간·인과관계를 확정하지 않습니다.'};
}
const PRIORITY_WEIGHTS=Object.freeze([1.30,1.20,1.12,1.18,1.10,1.02,1.35,1.05,1.00,0.98,0.96,1.12,1.18,1.00,1.03,1.12,1.01,1.09,1.14,1.11,1.06,0.98,1.06,0.97,1.32]);
const RESPONSE_IMPACT=Object.freeze([0,0.18,0.42,0.72,1]);
function formulate(answers){
 const base=interpret(answers);
 const scored=base.items.filter(x=>typeof x.value==='number'&&x.value>0).map(x=>{
   const raw=RESPONSE_IMPACT[x.value],weight=PRIORITY_WEIGHTS[x.id-1],impact=raw*weight;
   return {...x,weight,impact,priority:impact>=0.9?'먼저 확인':impact>=0.5?'구체적 사정':'경과·맥락 확인'};
 }).sort((a,b)=>Number(b.safety)-Number(a.safety)||b.impact-a.impact||a.id-b.id);
 const intersections=base.links.map(link=>{
   const a=base.items[link.a-1],b=base.items[link.b-1];
   const combined=Math.min(RESPONSE_IMPACT[a.value],RESPONSE_IMPACT[b.value]);
   return {...link,combined,reason:a.topic+'('+a.value+'점: '+a.meaning+')과 '+b.topic+'('+b.value+'점: '+b.meaning+')이 함께 보고되었습니다.',next:'두 어려움의 발생 시점과 실제 생활 영향이 연결되는지 확인: '+link.question};
 }).sort((a,b)=>b.combined-a.combined||a.a-b.a);
 const unknown=base.unknown.map(x=>({id:x.id,topic:x.topic,meaning:'미상은 0점이 아니므로 해당 영역 판단을 보류합니다.'}));
 const top=scored.slice(0,4);
 const headline=top.length?top.slice(0,3).map(x=>x.topic+'에서 '+x.meaning).join('; '):'현재 응답에서 뚜렷하게 보고된 어려움은 없지만 실제 생활의 불편과 미확인 사항을 살펴봐야 합니다.';
 const narratives=[headline+(top.length?'.':''),
   intersections.length?'함께 보고된 어려움: '+intersections.slice(0,2).map(x=>x.reason+' '+x.next).join(' '):'현재 정의된 교차 가설에 해당하는 동시 보고는 확인되지 않았습니다.',
   unknown.length?'정보가 확인되지 않은 문항 '+unknown.map(x=>x.id+'번').join('·')+'은 낮은 위험으로 간주하지 않습니다.':'',
   '현재 안전과 학생의 희망·강점·기존 지원을 확인한 뒤 실제 지원 우선순위를 결정합니다.'].filter(Boolean);
 return {version:'OY-CIE-meaning-priority-v2.3-anchor-caution',base,scored,intersections,unknown,top,headline,narratives,assumptions:'응답 영향 곡선과 문항별 우선검토 가중치는 연구·개발 가정이며 검증된 확률·위험 절단점이 아닙니다.',rawScore:base.knownTotal,rawIncomplete:unknown.length>0};
}
const api=Object.freeze({TOPICS,PAIRS,LABELS,ITEM_LEVELS,RESEARCH,PROBES,PRIORITY_WEIGHTS,RESPONSE_IMPACT,interpret,formulate,interpretItemScore,SCORE_MEANING_RULES,EVIDENCE_LIBRARY,REASONING_RULES,evidenceAssessment,MULTI_DOMAIN_PATTERNS,crossDomainAssessment,COMBINATION_SPACE,scoreCombination,DEVELOPMENT_KNOWLEDGE,DEVELOPMENT_SOURCES,developmentalAssessment});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYCIESemanticV2=api;
})(typeof window!=='undefined'?window:globalThis);
