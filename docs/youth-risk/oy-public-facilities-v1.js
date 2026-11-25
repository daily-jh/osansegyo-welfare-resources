/* OY-RALS 공공데이터 기관 연결 v1 — 공공 API로 매주 받는 기관 목록(docs/public-api/facilities.json)을
   위기징후 응답과 이어 03 지역자원연계에 보여 준다.
   · 원자료: 청소년안전망 센터 정보·청소년쉼터·마음투자 바우처 제공기관·특수교육지원센터·지역아동센터·청소년수련시설·
     해바라기센터·경찰서·공공도서관·병의원 목록(공공데이터포털, 원문). 기관 등록정보이며 개인 사례가 아니다.
   · 연결 고리는 25문항 점수와 서술 단서(학교 밖·가출)만 쓴다. 판정·점수·5단계는 읽기만 하고 바꾸지 않는다.
   · 운영 여부·연락처는 원문 그대로이므로 '이용 전 확인'으로 표시한다. 학생 정보는 이 모듈 밖으로 나가지 않는다. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261125';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PF=()=>node?require('../assets/public-facilities.js'):root.PublicFacilities;
const PB=()=>node?require('./oy-public-benefits-v1.js'):root.OYPublicBenefits;

/* 규칙(안전 → 머물 곳 → 상담·마음 → 학습·참여 순): src = 수집 데이터 id, name = 기관 이름에 들어 있어야 하는 말, kind = 기관분류에 들어 있어야 하는 말(없으면 전체), why(x) = 연결 고리(없으면 보이지 않음) */
const RULES=[
 {src:'mogef-sunflower-center',label:'해바라기센터(경기)',why:x=>x.at(25,1).concat(x.at(1,2)),note:'성폭력·가정폭력 피해 의료·상담·수사 지원(24시간). 신고 의무 절차를 먼저 따릅니다.'},
 {src:'knpa-police-station',label:'관할 경찰서',why:x=>x.any([[4,3],[5,3],[25,2]]),note:'긴급하면 112. 학교폭력은 117.'},
 {src:'kyci-safetynet-center',kind:/상담복지센터/,label:'청소년상담복지센터(청소년안전망)',why:x=>x.tier>=2?['지원 우선순위 '+x.tier+'단계'].concat(x.any([[3,2],[6,2],[17,2],[23,2]])).slice(0,3):x.any([[3,2],[6,2],[17,2],[23,2]]),note:'운영시간은 원문 기준. 1388은 24시간입니다.'},
 {src:'kyci-safetynet-center',kind:/학교밖/,label:'학교밖청소년지원센터(꿈드림)',why:x=>x.any([[9,3],[11,3]]).concat(x.say('학교밖')),note:'학업중단 숙려 단계부터 함께 볼 수 있습니다.'},
 {src:'mogef-youth-shelter',label:'청소년쉼터(경기, 가까운 순)',why:x=>x.at(20,2).concat(x.say('가출')),note:'오산에는 쉼터가 없습니다. 입소는 1388·오산시청소년상담복지센터를 거쳐 묻고, 일시·단기·중장기 유형을 확인합니다.'},
 {src:'mohw-mind-voucher',label:'전국민 마음투자 바우처 제공기관(오산)',why:x=>x.any([[6,2],[8,2]]),note:'바우처 대상·의뢰서는 정신건강복지센터·행정복지센터에서 확인합니다.'},
 {src:'nmc-hospital-osan',name:/정신|마음|심리/,label:'정신건강의학과 의원(오산)',why:x=>x.any([[6,3],[7,2],[8,3]]),note:'현재 자해·자살 위험이 있으면 예약보다 응급 대응이 먼저입니다.'},
 {src:'knise-special-ed-center',label:'특수교육지원센터',why:x=>x.any([[14,2],[15,2]]),note:'진단·평가 의뢰와 순회교육 문의. 학교 특수교육 담당과 함께 연결합니다.'},
 {src:'std-local-child-center',label:'지역아동센터(오산)',why:x=>x.gradeIn(/^(초[1-6]|중[1-3])$/,true)?x.any([[16,2],[19,2],[22,2]]):[],note:'정원·현원(원문)을 보고 빈자리를 먼저 묻습니다.'},
 {src:'std-teen-training-fclt',label:'청소년수련시설(오산)',why:x=>x.any([[22,2],[23,2]]),note:'방과후아카데미·동아리 등 참여 활동.'},
 {src:'mcst-public-library',label:'공공도서관(오산)',why:x=>x.any([[10,2],[22,2]]).slice(0,1),note:'공부할 곳·학습 프로그램.'},
 {src:'goe-school-link-partners',label:'학생맞춤통합지원 지역유관기관(경기도교육청)',why:x=>x.tier>=2?['지원 우선순위 '+x.tier+'단계']:[],note:'경기도교육청이 학맞통용으로 정리한 지역 기관.'}
];

function build(p,opt){opt=opt||{};const P=PF(),B=PB();const d=opt.data||(P&&P.data);
 const empty={version:VERSION,ready:false,links:[],date:''};
 if(!P||!B||!d||!p||!Array.isArray(p.answers))return empty;
 const x=B.context(p);const byId={};for(const g of P.groups(d))byId[g.id]=g;
 const links=[];
 for(const r of RULES){const g=byId[r.src];if(!g)continue;const why=r.why(x);if(!why||!why.length)continue;
  const items=P.nearFirst(g.items.filter(i=>(!r.kind||r.kind.test(i.kind||''))&&(!r.name||r.name.test(i.name||''))));if(!items.length)continue;
  const osan=items.filter(i=>i.region==='osan');
  links.push({id:r.src,label:r.label,why:[...new Set(why)].slice(0,3),note:r.note||'',items:(osan.length?osan:items).slice(0,4),osan:osan.length,total:items.length})}
 return {version:VERSION,ready:true,links,date:d.generatedAt?String(d.generatedAt).slice(0,10):''}}

const SHOW=3;
function html(m){if(!m||!m.ready||!m.links.length)return '';const P=PF();
 return '<section class="oypf" aria-label="공공데이터 기관 연결"><header><span class="oypb-k">공공데이터 기관 목록 · '+esc(m.date)+' 수집</span>'
  +'<h3>응답과 이어지는 오산·경기 기관 '+m.links.length+'종</h3><p>공공데이터포털의 기관 목록 원문입니다. 운영 여부와 연락처는 <b>연계 전 전화로 확인</b>합니다.</p></header>'
  +m.links.map((l,k)=>(k===SHOW?'<details class="oypb-more"><summary>나머지 '+(m.links.length-SHOW)+'종 더 보기</summary>':'')+'<div class="oypf-link"><h4>'+esc(l.label)+' <small>'+(l.osan?'오산 '+l.osan+'곳':'오산 없음 · 경기 '+l.total+'곳')+'</small></h4>'
   +'<p class="oypb-chain"><span>연결 고리</span>'+l.why.map(w=>'<em>'+esc(w)+'</em>').join('')+'</p>'
   +'<ul class="pf">'+l.items.map(i=>P.item(i,{dbLink:id=>'../#org='+encodeURIComponent(id)})).join('')+'</ul>'
   +(l.total>l.items.length?'<p class="pf-more"><a href="../public-facilities.html#'+esc(l.id)+'" target="_blank" rel="noopener">경기 포함 전체 '+l.total+'곳 보기 ↗</a></p>':'')
   +(l.note?'<p class="oypb-note">'+esc(l.note)+'</p>':'')+'</div>').join('')+(m.links.length>SHOW?'</details>':'')
  +'<p class="oypb-foot">출처: 공공데이터포털 기관 목록(청소년안전망·성평등가족부·보건복지부·국립특수교육원·경찰청·문화체육관광부·국립중앙의료원 등). 기관 등록정보이며 개인 사례 자료가 아님.</p></section>'}

function text(m){if(!m||!m.ready||!m.links.length)return '';
 return ['[공공데이터 기관 · 연계 전 확인]'].concat(m.links.map(l=>'- '+l.label+': '+l.items.slice(0,2).map(i=>i.name+(i.phone?' '+PF().phoneText(i.phone):'')).join(', ')+' ← '+l.why.join(', '))).join('\n')}

if(!node&&root.PublicFacilities)root.PublicFacilities.load('../public-api/facilities.json');
const api={version:VERSION,RULES,build,html,text};
if(node)module.exports=api;else root.OYPublicFacilities=api;
})(typeof window!=='undefined'?window:globalThis);
