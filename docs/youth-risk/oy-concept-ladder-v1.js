/* OY-RALS concept ladder v1: groups the ten CORE domains into five everyday life themes and pairs each cross pattern
   with the professional concept practitioners use for it. Plain wording first, the term after, so one report can be
   read by a homeroom teacher and by a supervisor. Carries no scores and never changes a judgement. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261026';

// Five life themes over the ten CORE domains (domain index order follows K.DOMAIN_NAMES).
const THEMES=[
 {key:'safe',title:'다치지 않고 지내기',term:'보호·안전',domains:[0,1,9],
  deck:'집, 학교, 온라인에서 누군가에게 다치거나 위협받지 않는지 보는 주제입니다.'},
 {key:'mind',title:'마음과 행동',term:'정서·행동 (내재화·외현화)',domains:[2,4],
  deck:'마음이 얼마나 힘든지, 그 힘듦이 어떤 행동으로 나타나는지 보는 주제입니다.'},
 {key:'school',title:'학교와 배움',term:'학교 적응·학습 접근성',domains:[3,5],
  deck:'학교에 오고, 배우고, 학교에 마음을 두고 있는지 보는 주제입니다.'},
 {key:'home',title:'집과 생활',term:'가족 기능·생활 기반',domains:[6,7],
  deck:'돌봄과 가족 관계, 그리고 먹고 머무는 생활의 바탕을 보는 주제입니다.'},
 {key:'ties',title:'기댈 사람과 자리',term:'사회적 지지체계',domains:[8],
  deck:'믿고 도움을 청할 어른과 마음 붙일 활동이 있는지 보는 주제입니다.'}
];
const THEME_OF_DOMAIN=[];THEMES.forEach((t,i)=>t.domains.forEach(d=>{THEME_OF_DOMAIN[d]=i}));

// One rung per cross pattern: plain wording → professional concept → why the concept matters in practice.
// Drafted for practitioner review; the pattern itself and its wording come from oy-cross-patterns-v1.
const CONCEPTS={
 'emotion-safety':{plain:'너무 힘들어서 스스로를 해칠 생각까지 이어진 상태',term:'정서적 고통–자해 사고의 동반',
  why:'고통의 크기와 안전 신호가 함께 움직입니다. 정서 지원과 안전계획을 한 묶음으로 다루는 근거가 됩니다.'},
 'isolated-distress':{plain:'힘든데 기댈 어른이 없는 상태',term:'지지 결핍 속 고통 (보호요인 결손)',
  why:'믿을 어른은 고통의 영향을 줄이는 완충 장치입니다. 그 완충이 비어 있어 같은 고통이 더 크게 작용합니다.'},
 'care-burnout':{plain:'가족을 돌보느라 마음이 지친 상태',term:'가족돌봄 청소년의 돌봄 소진',
  why:'돌봄 책임이 또래·학업 같은 발달 과업을 밀어내면서 정서 소진으로 이어지는 경로입니다.'},
 'night-cycle':{plain:'밤에 온라인으로 버티다 잠이 무너진 상태',term:'수면–디지털 이용의 악순환',
  why:'디지털 이용이 불안을 달래는 대처로 쓰이면서 수면을 깎고, 줄어든 수면이 다시 불안을 키웁니다.'},
 'peer-withdrawal':{plain:'괴롭힘을 당한 뒤 움츠러든 상태',term:'또래 피해 후 내재화 반응',
  why:'피해 경험이 위축·자기비난처럼 안으로 향하는 어려움으로 이어져, 겉으로는 조용해 보일 수 있습니다.'},
 'peer-avoidance':{plain:'괴롭힘 때문에 학교 가기를 피하는 상태',term:'피해 회피로서의 결석 (회피의 강화)',
  why:'결석이 불안을 잠시 줄여 주기 때문에 회피가 굳어집니다. 학교 안 안전이 먼저 확보되어야 등교 회복이 가능합니다.'},
 'coercion-avoidance':{plain:'누군가의 강요가 무서워 학교를 피하는 상태',term:'강압·착취 노출과 회피 결석',
  why:'결석이 위협을 피하는 방법이 된 경우로, 등교 독려보다 위협 차단이 먼저입니다.'},
 'online-offline-harm':{plain:'온라인과 학교에서 피해가 이어지는 상태',term:'다중 맥락 피해 (중복 피해)',
  why:'피해가 한 장소에 머물지 않아, 한 기관의 조치만으로는 피해가 멈추지 않습니다.'},
 'victim-actor':{plain:'당하기도 하고 하기도 하는 상태',term:'피해–가해 중첩',
  why:'가해 행동만 다루면 피해 경험이 가려집니다. 두 측면을 한 계획 안에서 다룹니다.'},
 'care-disengage':{plain:'가족을 돌보느라 학교를 놓치는 상태',term:'역할 과부하에 따른 학교 이탈',
  why:'가정에서 맡은 역할이 학생 역할과 시간을 다투는 구조여서, 출결 지도만으로는 바뀌지 않습니다.'},
 'family-disengage':{plain:'집안의 긴장이 등교를 흔드는 상태',term:'가족 긴장의 학교 적응 파급',
  why:'가정의 긴장이 가정–학교 연결을 거쳐 출결로 나타납니다. 보호자 면담이 출결 대책의 일부가 됩니다.'},
 'basic-disengage':{plain:'먹고 입을 것이 부족해 학교가 부담인 상태',term:'기본욕구 결핍과 낙인 회피',
  why:'기본욕구가 채워지지 않으면 학습과 소속으로 나아가기 어렵고, 결핍이 드러날까 하는 부담이 회피를 키웁니다.'},
 'housing-instability':{plain:'집이 불안정해 생활 리듬이 무너진 상태',term:'주거 불안정의 생태체계 파급',
  why:'주거라는 바깥 조건이 수면·이동·공부 공간을 거쳐 학교생활에 닿습니다. 학교 안 대책만으로는 멈추지 않습니다.'},
 'care-gap':{plain:'챙겨 주는 어른이 비어 있는 상태',term:'돌봄 공백 (보호요인 결손)',
  why:'일상 돌봄의 빈자리는 다른 어려움이 커지는 바탕이 됩니다. 방임 해당 여부는 면담과 기관 판단으로 확인합니다.'},
 'parentified':{plain:'아이가 부모 역할을 대신하는 상태',term:'부모화 (역할 전도)',
  why:'학생이 정서적·실질적으로 보호자 역할을 맡아 자신의 발달 욕구가 뒤로 밀리는 상태입니다.'},
 'cost-barrier':{plain:'돈 때문에 필요한 지원을 못 쓰는 상태',term:'경제적 접근 장벽',
  why:'지원이 있어도 비용 때문에 쓰지 못하는 구조로, 서비스 연결과 비용 지원을 함께 설계해야 합니다.'},
 'learning-access':{plain:'배울 환경이 학생에게 맞지 않는 상태',term:'학습 접근성 장벽 (편의 제공 부족)',
  why:'학생의 능력보다 환경이 맞지 않아 생긴 어려움이므로, 환경 조정이 첫 개입입니다.'},
 'learning-belonging':{plain:'공부가 어려워 학교에 마음을 못 붙이는 상태',term:'학업 좌절–학교 유대 약화',
  why:'반복된 학업 실패가 학교 소속감을 깎아 이탈 위험을 키웁니다.'},
 'disengagement':{plain:'학교에서 점점 멀어지는 상태',term:'학교 이탈 진행 (학업중단 위기 경로)',
  why:'출결 감소와 소속감 저하가 함께 나타나는 단계로, 연결 회복이 등교 회복보다 먼저입니다.'},
 'family-acting-out':{plain:'집의 긴장이 행동으로 터지는 상태',term:'가족 스트레스의 외현화',
  why:'가정의 긴장이 밖으로 드러나는 행동으로 나타나, 행동 지도만으로는 반복됩니다.'},
 'risk-cluster':{plain:'위험한 행동이 여러 개 겹친 상태',term:'위험행동 군집',
  why:'위험행동은 함께 나타나는 경향이 있어 하나씩이 아니라 묶어서 다룹니다.'},
 'disconnection':{plain:'참여할 곳도 기댈 사람도 없는 상태',term:'사회적 고립 (관계망 단절)',
  why:'지지망이 비어 있어, 다른 지원이 학생에게 닿을 통로부터 만들어야 합니다.'},
 'protection-school':{plain:'집에서의 안전 문제가 학교생활을 흔드는 상태',term:'보호 위기의 학교 적응 파급',
  why:'학교에서 보이는 변화가 가정 내 안전 문제의 신호일 수 있습니다.'},
 'protection-family':{plain:'집의 긴장이 학생을 다치게 하는 상태',term:'가정 내 위해와 가족 기능 저하',
  why:'가족 갈등이 위해로 이어지고 있어, 가족 지원보다 학생 보호가 먼저입니다.'},
 'protection-distress':{plain:'다친 경험이 마음의 고통으로 이어진 상태',term:'위해 경험의 외상 반응',
  why:'지금의 정서 문제가 위해 경험에 대한 반응일 수 있어, 보호 확인과 외상 기반 정서 지원을 함께 합니다.'},
 'neglect-care-gap':{plain:'돌봄을 받지 못해 생활이 비어 있는 상태',term:'방임에 의한 돌봄 결핍',
  why:'생활의 빈자리가 지속된 돌봄 결핍의 신호일 수 있어, 생활 지원과 보호 판단을 함께 합니다.'},
 'selfharm-alone':{plain:'위험한 순간에 기댈 사람이 없는 상태',term:'자살·자해 위험과 지지체계 부재',
  why:'위기 순간에 연락할 사람이 없으면 안전 계획이 작동하지 않아, 연락할 어른을 먼저 정합니다.'},
 'exploitation-distress':{plain:'온라인 피해가 마음의 고통이 된 상태',term:'디지털 성범죄 피해의 정서적 영향',
  why:'피해 확산에 대한 두려움과 수치심이 고통을 키워, 확산 차단과 정서 지원을 함께 합니다.'}
};
// Same content, two names: what the report calls things in plain words and in professional terms.
const GLOSSARY=[
 {plain:'이 아이 이야기',term:'사례개념화',text:'흩어진 응답을 하나의 이야기로 묶어 왜 지금 이런 모습인지 설명한 부분입니다.'},
 {plain:'함께 움직이는 어려움',term:'교차 패턴 · 문제 유지 순환',text:'두 어려움이 서로를 붙잡아 함께 커지는 고리입니다.'},
 {plain:'생활 주제',term:'영역 묶음 (생태체계 관점)',text:'열 개 평가 영역을 학생의 생활 장면 다섯 가지로 묶은 것입니다.'},
 {plain:'잘 버티고 있는 부분',term:'강점 · 보호요인',text:'어려움을 줄이거나 회복을 돕는 학생과 환경의 자원입니다.'},
 {plain:'얼마나 자주, 누가',term:'개입 수준 · 주관기관',text:'접촉 빈도, 사례회의 주기, 책임 기관을 정한 부분입니다.'},
 {plain:'응답의 모양',term:'응답 프로파일 유형',text:'가장 높게 올라온 영역의 조합으로 사례의 큰 모양을 부르는 이름입니다.'},
 {plain:'다시 볼 기준',term:'재사정 지표',text:'다음 평가에서 좋아졌는지 판단할 문항별 목표입니다.'},
 {plain:'응답을 믿고 읽어도 되나',term:'응답 타당도',text:'미상이나 같은 점수 반복처럼 응답 특성이 해석에 주는 영향입니다.'}
];
function concept(id){return CONCEPTS[id]||null}
function themeOfItem(domainIndex){const i=THEME_OF_DOMAIN[domainIndex];return i===undefined?null:THEMES[i]}
const api=Object.freeze({VERSION,THEMES,THEME_OF_DOMAIN,CONCEPTS,GLOSSARY,concept,themeOfItem});
if(node)module.exports=api;else root.OYConceptLadder=api;
})(typeof self!=='undefined'?self:this);
