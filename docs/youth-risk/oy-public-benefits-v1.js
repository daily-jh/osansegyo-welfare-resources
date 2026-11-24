/* OY-RALS 공공 지원사업 연결 v1 — 공공 API(한국사회보장정보원 지자체·중앙부처 복지서비스)로 받은 SVC-SSIS 사업을
   위기징후 응답과 이어 준다.
   · 원자료: 복지자원 DB(window.WELFARE_DATA)의 오산시청·경기도청·복지로 등록 사업(148개, 2026-11-24 수집).
     API 자료는 '사업 등록정보'이며 개인 사례가 아니다. 학생 정보는 이 모듈 밖으로 나가지 않는다.
   · 연결 고리: 25문항 점수, 입력 서술에서 읽은 가구 특성(YouthContextV81: 수급·차상위·한부모·조손·다문화·가정위탁·시설보호),
     학년(신입생·초등)만 쓴다. 각 사업에는 '왜 이 사업인지'(문항·서술 근거)와 '오산에서 어디로 묻는지'(DB의 수행·접수 기관)를 붙인다.
   · 판정을 하지 않는다. CORE 점수·안전판정·5단계·통합사례관리 선정은 읽기만 하며, 사업 자격(소득·연령·접수 시기)은 확정하지 않는다.
   · 연락처는 DB에 있는 기관 번호만 쓴다. DB에 없는 번호는 만들지 않는다. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261125';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SIZES=[2,3,3,3,2,2,3,3,2,2];
const ITEM=['','학대 의심','방임·돌봄 결핍','또래 피해','강요·협박','폭력 피해·가해','지속되는 정서 어려움','자해·자살 표현','생활·몸 상태 변화','등교·수업 참여','배움의 어려움','학교생활 지속','위험 행동','물질·건강 위험','학습 접근성','발달지원·보조기기','식사·돌봄','가족 어려움의 영향','학생이 맡은 돌봄','끼니·생필품','쉴 곳·머물 곳','비용 때문에 미룬 치료','참여의 어려움','믿고 연락할 어른','디지털 사용','온라인 성적 위해'];
const SAFETY=[1,2,7,25];
const GROUPS=['안전·보호','마음건강','학업·학교 밖','가족·돌봄','생활비·교육비','장애·발달','통합지원'];

/* 오산 안에서 묻는 곳: 복지자원 DB의 기관 id. 'dong'은 학생 행정동의 행정복지센터(없으면 오산시 동 행정복지센터). */
const DESK={
 youth:'6dff4fa866', dream:'d0f9a938bd', mind:'b89fdc14c6', child:'953caa9fe6', sun:'677cdd6ef9', w1366:'eac1ed57a3',
 didim:'ORG-Y22-DIDIM', devc:'073a6c4498', dis:'718d662023', family:'6b509a4355', danuri:'ORG-Z26-DANURI', hope:'ORG-Z26-HOPE',
 health:'72c103f3f5', d4u:'ORG-Z26-D4U', l109:'ORG-Z26-109', crisis:'22ca867996', dong:'dong'
};

/* 규칙: re = 사업명, g = 묶음, desk = 오산 창구, why(x) = 연결 고리 문장 배열(없으면 연결하지 않음), note = 확인할 점.
   점수 기준은 결과 화면과 같은 말로: 2점 이상 = 반복·뚜렷한 영향, 3점 이상 = 학교 지원만으로 부족. 안전문항은 1점 이상. */
const RULES=[
 // 안전·보호
 {re:/^학대피해아동 쉼터/,g:0,desk:'child',why:x=>x.at(1,2),note:'아동보호전문기관이 보호 필요를 판단해 연결합니다. 학교가 직접 신청하는 사업이 아닙니다.'},
 {re:/^여성긴급전화 1366/,g:0,desk:'w1366',why:x=>x.any([[1,2],[25,1]]),note:'24시간 상담·긴급 보호 연결.'},
 {re:/^성폭력피해자 지원사업/,g:0,desk:'sun',why:x=>x.at(25,1),note:'의료·상담·법률 지원은 해바라기센터(아동)에서 함께 안내합니다.'},
 {re:/^성매매 피해아동청소년 통합지원/,g:0,desk:'d4u',why:x=>x.at(25,2),note:'온라인 성적 착취는 삭제 지원·신고가 먼저입니다.'},
 {re:/^가정폭력·성폭력 등 폭력 피해자 무료법률지원/,g:0,desk:'w1366',why:x=>x.any([[1,2],[25,2]]),note:'보호 절차가 시작된 뒤 법률 지원이 필요할 때.'},
 {re:/^범죄피해자에 대한 경제적 지원/,g:0,desk:null,why:x=>x.any([[4,3],[5,3],[25,3]]),note:'피해로 생긴 치료비·생계 부담. 신청은 관할 검찰청 범죄피해자 지원 창구(복지로 안내).'},
 // 마음건강
 {re:/^자살예방센터 운영/,g:1,desk:'l109',why:x=>x.at(7,1),note:'현재 위험이 확인되면 일반 예약보다 긴급 대응이 먼저입니다.'},
 {re:/^정신건강복지센터 운영/,fam:'정신건강 상담·평가',g:1,desk:'mind',why:x=>x.any([[6,2],[7,1],[8,2]]),note:'아동·청소년 상담과 전문평가 연결.'},
 {re:/^정신건강 심리상담 바우처/,fam:'정신건강 상담·평가',g:1,desk:'mind',why:x=>x.any([[6,2],[8,2]]),note:'의뢰서·본인부담 기준은 정신건강복지센터·행정복지센터에서 확인.'},
 {re:/^중독관리통합지원센터/,g:1,desk:'mind',why:x=>x.at(13,2),note:'오산 중독관리센터는 DB에 없어 정신건강복지센터로 먼저 묻습니다.'},
 {re:/^청소년치료재활센터/,g:1,desk:'didim',why:x=>x.peakIn([2,4],3)&&x.tier>=4?x.at(6,3).concat(x.at(12,3),x.at(13,3)).slice(0,2):null,note:'장기 치료·재활형 기숙 과정. 지역 상담·치료를 먼저 검토한 뒤 의뢰합니다.'},
 {re:/^정신질환자 치료지원사업/,g:1,desk:'mind',why:x=>x.at(21,2).length&&x.any([[6,2],[8,2]]).length?x.at(21,2).concat(x.any([[6,2],[8,2]])):null,note:'치료비 부담 때문에 진료를 미루고 있을 때.'},
 {re:/^입양·가정위탁아동 심리치료/,g:1,desk:null,why:x=>x.hh('가정위탁')&&x.peakIn([2],2)?x.hhWhy('가정위탁').concat(x.any([[6,2],[7,1],[8,2]])):null,note:'가정위탁지원센터를 통해 신청합니다.'},
 // 학업·학교 밖
 {re:/^학교 밖 청소년 지원/,g:2,desk:'dream',why:x=>x.any([[9,3],[11,3]]).concat(x.say('학교밖')),note:'학업중단 숙려 단계부터 꿈드림과 함께 볼 수 있습니다.'},
 {re:/^청소년 학습코칭 및 온라인서비스/,g:2,desk:null,why:x=>x.at(10,2),note:'경기도 온라인 학습코칭. 학교 기초학력 지원과 함께 씁니다.'},
 {re:/^청소년방과후아카데미/,g:2,desk:null,why:x=>x.gradeIn(/^(초[4-6]|중[1-3])$/,true)?x.any([[16,2],[18,2],[22,2]]):null,note:'초4~중3 대상. 오산 운영 기관은 복지로 상세 안내에서 확인합니다.'},
 {re:/^청소년특별지원/,g:2,desk:'youth',why:x=>x.peakIn([7],2)&&x.peakIn([2,3,6],2)?x.any([[19,2],[20,2],[21,2]]).concat(x.any([[6,2],[9,2],[10,2],[17,2]]).slice(0,1)):null,note:'만 9~24세 위기청소년 생활·학업·의료 지원(소득 기준). 신청은 행정복지센터, 상담은 청소년상담복지센터.'},
 // 가족·돌봄
 {re:/^한부모가족 아동양육비 지원/,fam:'한부모가족 지원',g:3,desk:'dong',why:x=>x.hhWhy('한부모가구'),note:'소득 기준과 현재 수급 여부를 확인합니다.'},
 {re:/^저소득 한부모가정 초·중·고등학생\s+체험학습비/,fam:'한부모가족 지원',g:3,desk:'dong',why:x=>x.hhWhy('한부모가구'),note:'오산시 사업 · 복지교육국 가족보육과.'},
 {re:/^저소득 한부모가정 지원 \(연료비\)/,fam:'한부모가족 지원',g:3,desk:'dong',why:x=>x.hh('한부모가구')&&x.at(20,1).length?x.hhWhy('한부모가구').concat(x.at(20,1)):null,note:'오산시 사업 · 연 1회.'},
 {re:/^가정위탁 양육지원/,fam:'가정위탁 지원',g:3,desk:'dong',why:x=>x.hhWhy('가정위탁'),note:''},
 {re:/^가정위탁 학습활동 지원/,fam:'가정위탁 지원',g:3,desk:'dong',why:x=>x.hh('가정위탁')&&x.at(10,1).length?x.hhWhy('가정위탁').concat(x.at(10,1)):null,note:''},
 {re:/^청소년부모 아동양육비 지원사업/,fam:'청소년부모 지원',g:3,desk:'dong',why:x=>x.say('청소년부모'),note:''},
 {re:/^청소년한부모 아동양육 및 자립지원/,fam:'청소년부모 지원',g:3,desk:'dong',why:x=>x.say('청소년부모'),note:''},
 {re:/^이주배경 청소년 지원/,g:3,desk:'danuri',why:x=>x.hhWhy('다문화가구').concat(x.say('이주배경')),note:'통역·정보 접근 필요를 먼저 묻습니다. 배경을 어려움의 원인으로 단정하지 않습니다.'},
 {re:/^다문화가족 도비지원사업/,g:3,desk:'family',why:x=>x.hh('다문화가구')&&x.peakIn([3,6,7],1)?x.hhWhy('다문화가구'):null,note:'오산시가족센터에서 함께 안내합니다.'},
 {re:/^\(북한이탈주민\) 탈북청소년 교육지원/,g:3,desk:null,why:x=>x.say('탈북'),note:''},
 {re:/^일상돌봄 서비스 사업/,g:3,desk:'dong',why:x=>x.at(18,2),note:'가족을 돌보는 청소년·청년(만 13세 이상) 돌봄·가사 지원.'},
 {re:/^위기청년\(가족돌봄, 고립은둔\)/,g:3,desk:'dong',why:x=>x.gradeIn(/^고[1-3]$/)?x.at(18,3):null,note:'가족돌봄 청소년·청년 전담 지원.'},
 {re:/^자립준비청년\(보호종료아동\) 자립정착금|^시설 퇴소청소년 자립지원수당/,g:3,desk:'hope',why:x=>(x.hh('시설보호')||x.hh('가정위탁'))&&x.gradeIn(/^고[2-3]$/)?x.hhWhy('시설보호').concat(x.hhWhy('가정위탁')):null,note:'보호 종료 전 자립 준비를 미리 연결합니다.'},
 // 생활비·교육비
 {re:/^교육급여\(맞춤형 급여\)/,g:4,desk:'dong',why:x=>x.any([[19,2],[21,2]]).concat(x.hhWhy('기초생활보장'),x.hhWhy('차상위'),x.hhWhy('한부모가구')),note:'교육급여·교육비 지원은 주소지 행정복지센터나 학교 행정실에서 함께 신청할 수 있습니다.'},
 {re:/^결식아동 급식지원/,g:4,desk:'dong',why:x=>x.any([[16,2],[19,2]]),note:'방학 중 급식 공백을 함께 확인합니다.'},
 {re:/^긴급복지 생계지원/,fam:'긴급복지지원',g:4,desk:'crisis',why:x=>x.any([[19,3],[20,3]]),note:'갑작스러운 소득 상실·위기 사유가 있을 때. 경기도 긴급복지 위기상담 콜센터에서도 접수합니다.'},
 {re:/^긴급복지 교육지원/,fam:'긴급복지지원',g:4,desk:'crisis',why:x=>x.at(19,3).length||x.at(20,3).length?x.any([[19,3],[20,3]]).concat(x.at(9,2)):null,note:'긴급지원 대상 가구 학생의 수업료·학교운영지원비.'},
 {re:/^긴급복지 주거지원/,fam:'긴급복지지원',g:4,desk:'crisis',why:x=>x.at(20,3),note:''},
 {re:/^긴급복지 의료지원/,fam:'긴급복지지원',g:4,desk:'crisis',why:x=>x.at(21,3),note:''},
 {re:/^재난적의료비 지원 사업/,g:4,desk:null,why:x=>x.at(21,3),note:'큰 의료비가 생긴 뒤 신청(국민건강보험공단).'},
 {re:/^중, 고등학교 신입생 교복구입비/,g:4,desk:null,why:x=>x.gradeIn(/^(중1|고1)$/)&&x.peakIn([7],1)?x.gradeWhy().concat(x.any([[19,1]])):null,note:'경기도 보편 지원. 학교 행정실 안내를 확인합니다.'},
 {re:/^오산시 초등학교 입학축하금/,g:4,desk:null,why:x=>x.gradeIn(/^초1$/)&&x.peakIn([7],1)?x.gradeWhy():null,note:'오산시 보편 지원 · 복지교육국 평생교육과.'},
 {re:/^경기도 초등학생 치과주치의/,g:4,desk:'health',why:x=>x.gradeIn(/^초[1-6]$/)?x.at(21,1):null,note:'대상 학년은 해마다 공고를 확인합니다.'},
 {re:/^스포츠강좌이용권/,g:4,desk:'dong',why:x=>x.at(22,2).length&&(x.peakIn([7],2)||x.hh('기초생활보장')||x.hh('차상위')||x.hh('한부모가구'))?x.at(22,2).concat(x.any([[19,2],[21,2]]),x.hhWhy('기초생활보장'),x.hhWhy('차상위'),x.hhWhy('한부모가구')).slice(0,2):null,note:''},
 {re:/^경기도 어린이·청소년 교통비/,g:4,desk:null,why:x=>x.at(22,2).length&&x.peakIn([7],2)?x.at(22,2).concat(x.any([[19,2],[21,2]])).slice(0,2):null,note:'경기도 보편 지원(앱 신청).'},
 // 장애·발달
 {re:/^청소년 발달장애인 방과후활동/,g:5,desk:'dis',why:x=>x.peakIn([5],2)&&(x.at(16,2).length||x.at(18,2).length)?x.any([[14,2],[15,2]]).concat(x.any([[16,2],[18,2]])):null,note:'장애 등록(발달장애) 여부를 먼저 확인합니다.'},
 {re:/^발달장애인 부모상담지원/,g:5,desk:'devc',why:x=>x.any([[14,3],[15,2]]),note:'보호자 상담 지원. 장애 등록·진단 여부를 확인합니다.'},
 {re:/^발달장애인 긴급돌봄/,g:5,desk:'devc',why:x=>x.peakIn([5],2)&&x.any([[16,3],[18,3]]).length?x.any([[15,2]]).concat(x.any([[16,3],[18,3]])):null,note:'보호자 입원·사고 등으로 돌봄 공백이 생겼을 때.'},
 {re:/^공공치료기관 이용 아동 재활치료비|^청각장애아동재활치료비/,g:5,desk:'dong',why:x=>x.peakIn([5],2)&&x.at(21,2).length?x.any([[15,2]]).concat(x.at(21,2)):null,note:'오산시 사업 · 노인장애인과.'},
 // 통합지원
 {re:/^지역사회 청소년통합지원체계\(청소년안전망\)/,g:6,desk:'youth',why:x=>x.tier>=3&&x.peakIn([1,2,3,6,8],2)?['지원 우선순위 '+x.tier+'단계 · 여러 기관이 함께 볼 필요']:null,note:'청소년상담복지센터가 학교·경찰·복지기관과 함께 사례를 맡는 체계.'},
 {re:/^청소년동반자프로그램 운영/,g:6,desk:'youth',why:x=>x.tier>=3?x.any([[3,2],[6,2],[11,2],[17,2],[22,2],[23,2]]).slice(0,2):null,note:'상담자가 학생을 찾아가는 방식.'},
 {re:/^청소년상담1388 전화상담/,g:6,desk:'youth',why:x=>x.any([[23,2],[6,2],[3,2]]).slice(0,2),note:'전화 1388 · 문자·온라인(1388 온라인상담)도 같은 창구. 24시간.'},
 {re:/^청소년복지시설 운영 지원/,g:6,desk:'youth',why:x=>x.at(20,3).concat(x.say('가출')).slice(0,2),note:'청소년쉼터 등 머물 곳 연결은 청소년상담복지센터·1388로 먼저 묻습니다.'}
];

/* 서술에서 쓰는 추가 단서. case-context-v81과 같은 방식으로 부정·예시 문장을 뺀다. */
const SAY={
 '학교밖':[/학교\s*밖|자퇴|학업\s*중단|그만두(?:고|겠)/,'서술: 학업 중단 언급'],
 '청소년부모':[/임신|출산|청소년\s*(?:부모|엄마|아빠)|아기를\s*(?:키우|돌보)/,'서술: 임신·청소년 부모 언급'],
 '이주배경':[/이주배경|중도입국|외국\s*출신|한국어가\s*서툴/,'서술: 이주배경 언급'],
 '탈북':[/탈북|북한이탈/,'서술: 북한이탈 배경 언급'],
 '가출':[/가출|집을\s*나와|머물\s*곳이\s*없|거리에서/,'서술: 머물 곳 불안 언급']
};
const NEG=/없|아니|아님|해당하지|부인|가정한|가정하면|예시로|만약/;

function data(){let D=root.WELFARE_DATA;try{D=D||root.document.getElementById('assessmentFrame').contentWindow.WELFARE_DATA}catch(_){}
 if(!D&&node){try{const g=globalThis.window||{};if(!g.WELFARE_DATA){globalThis.window=g;require('../assets/data.js')}D=g.WELFARE_DATA}catch(_){}}
 return D&&Array.isArray(D.organizations)?D:null}
function services(D){const out=[];for(const o of D.organizations)for(const s of o.services||[])if(/^SVC-SSIS-/.test(s.id||''))out.push({org:o,s});return out}
function deskFor(key,D,dong){if(!key)return null;const orgs=D.organizations;let o=null;
 if(key==='dong'){o=dong&&dong!=='오산시 외'?orgs.find(x=>x.name==='오산시 '+dong+' 행정복지센터'):null;o=o||orgs.find(x=>x.id==='438b636f15');}
 else o=orgs.find(x=>x.id===DESK[key]);
 return o?{id:o.id,name:o.name,phone:o.phone||'',site:o.site||''}:null}
function office(m){const r=/담당:\s*([^.]+)\./.exec(m||'');return r?r[1].replace(/^경기도 오산시\s*/,'오산시 ').replace(/^경기도\s+(?!오산)/,'경기도 ').trim():''}

function context(p){const a=Array.isArray(p&&p.answers)?p.answers:[];const v=n=>Number.isInteger(a[n-1])?a[n-1]:null;
 const peaks=[];let off=0;SIZES.forEach(sz=>{let m=0;for(let k=0;k<sz;k++){const x=a[off+k];if(Number.isInteger(x)&&x>m)m=x}peaks.push(m);off+=sz});
 let hh=[];try{const V=node?require('./case-context-v81.js'):root.YouthContextV81;hh=V&&p&&p.caseContext?V.parse(p).profiles.map(x=>x.label):[]}catch(_){}
 const raw=typeof (p&&p.caseContext)==='string'?p.caseContext:'';const clauses=raw.split(/[。.!?\n;,]|지만|으나/).map(s=>s.trim()).filter(Boolean);
 const said={};for(const k in SAY)said[k]=clauses.some(c=>SAY[k][0].test(c)&&!NEG.test(c));
 let tier=0,decision=null;try{const OD=node?require('./oy-decision-v1.js'):root.OYDecision;decision=OD&&(OD.forPayload?OD.forPayload(p):OD.resolve(p));tier=decision&&decision.tier||0}catch(_){}
 const grade=p&&p.student&&/^(초[1-6]|중[1-3]|고[1-3])$/.test(p.student.grade)?p.student.grade:'';
 const line=n=>n+'번 '+ITEM[n]+' '+v(n)+'점';
 const x={v,peaks,hhList:hh,tier,grade,said,
  at:(n,min)=>v(n)!=null&&v(n)>=min?[line(n)]:[],
  any:list=>list.filter(([n,min])=>v(n)!=null&&v(n)>=min).map(([n])=>line(n)),
  peakIn:(ds,min)=>ds.some(d=>peaks[d]>=min),
  hh:label=>hh.includes(label),
  hhWhy:label=>hh.includes(label)?['서술: '+label]:[],
  say:k=>said[k]?[SAY[k][1]]:[],
  gradeIn:(re,unknownOk)=>grade?re.test(grade):Boolean(unknownOk),
  gradeWhy:()=>grade?['학년 '+grade]:[]};
 return x}

function build(p,opt){opt=opt||{};const D=opt.data||data();
 const empty={version:VERSION,ready:false,items:[],desks:[],groups:[],total:0,safety:false,checked:''};
 if(!D||!p||!Array.isArray(p.answers))return empty;
 const x=context(p),all=services(D),dong=p.student&&p.student.dong||'';
 const items=[];const seen=new Set();
 for(const r of RULES){const why=r.why(x);if(!why||!why.length)continue;
  for(const {org,s} of all){if(!r.re.test(s.name)||seen.has(s.id))continue;seen.add(s.id);
   if(items.some(i=>i.name===s.name.replace(/\s+/g,' ').trim()))continue;
   items.push({fam:r.fam||'',id:s.id,name:s.name.replace(/\s+/g,' ').trim(),group:GROUPS[r.g],g:r.g,why:[...new Set(why)].slice(0,3),note:r.note||'',
    desk:deskFor(r.desk,D,dong),office:office(s.method),registrar:org.name,source:s.source||'',
    checked:s.verification&&s.verification.date||s.editedOn||'',next:s.verification&&s.verification.next||'',
    form:(s.tags&&s.tags.form||[]).join('·')});}
 }
 for(let k=0;k<items.length;k++){const a=items[k];if(!a.fam)continue;const same=items.filter((b,j)=>j>k&&b.fam===a.fam);if(!same.length)continue;
  const parts=[a].concat(same);items[k]=Object.assign({},a,{name:a.fam+' ('+parts.map(b=>b.name.replace(/^(?:긴급복지|가정위탁|저소득 한부모가정 지원|저소득 한부모가정|한부모가족|정신건강)\s*/,'').replace(/[()]/g,'')).join(' · ')+')',parts:parts.map(b=>({id:b.id,name:b.name,source:b.source})),why:[...new Set(parts.flatMap(b=>b.why))].slice(0,3),note:[...new Set(parts.map(b=>b.note).filter(Boolean))].join(' '),office:[...new Set(parts.map(b=>b.office).filter(Boolean))].length>1?'':a.office});
  for(const b of same)items.splice(items.indexOf(b),1)}
 items.sort((a,b)=>a.g-b.g);
 const deskMap=new Map();for(const it of items){const k=it.desk?it.desk.id:'_';if(!deskMap.has(k))deskMap.set(k,{desk:it.desk,names:[]});deskMap.get(k).names.push(it.name)}
 const desks=[...deskMap.values()].sort((a,b)=>(b.desk?1:0)-(a.desk?1:0)||b.names.length-a.names.length);
 const groups=GROUPS.map((name,g)=>({name,items:items.filter(i=>i.g===g)})).filter(z=>z.items.length);
 const safety=SAFETY.some(n=>x.v(n)!=null&&x.v(n)>0);
 const checked=items.map(i=>i.checked).filter(Boolean).sort().pop()||'';
 return {version:VERSION,ready:true,items,desks,groups,total:all.length,safety,checked,household:x.hhList.slice(),grade:x.grade}}

function deskText(d){return d?d.name+(d.phone?' '+d.phone:''):'복지로 상세 안내에서 신청 창구 확인'}
function html(m){if(!m||!m.ready)return '';
 const head='<header><span class="oypb-k">공공 API · 복지로·오산시·경기도 등록 사업 '+m.total+'개 중</span><h3>'+(m.items.length?'응답과 이어지는 공공 지원사업 '+m.items.length+'개':'응답과 바로 이어지는 공공 지원사업 없음')+'</h3>'
  +'<p>'+(m.safety?'안전 확인·신고 절차가 먼저입니다. 아래 사업은 그 뒤 생활 지원을 함께 볼 때 씁니다. ':'')+'자격(소득·연령·가구)과 접수 시기는 사업마다 다르므로 <b>확인 후 신청</b> 목록입니다. 판정에는 쓰지 않습니다.</p></header>';
 if(!m.items.length)return '<section class="oypb" aria-label="공공 지원사업 연결">'+head+'<p class="oypb-empty">2점 이상 문항이나 서술의 가구 특성(수급·한부모·조손·다문화·가정위탁 등)이 있으면 해당 사업을 이어 드립니다.</p></section>';
 const desks='<div class="oypb-desks"><b>한 번에 묻기</b><ul>'+m.desks.filter(d=>d.desk).slice(0,4).map(d=>'<li><strong>'+esc(d.desk.name)+(d.desk.phone?' <i>'+esc(d.desk.phone)+'</i>':'')+'</strong><span>'+esc(d.names.join(' · '))+'</span></li>').join('')+'</ul></div>';
 const row=i=>'<li class="oypb-item"><div class="oypb-name"><strong>'+esc(i.name)+'</strong>'+(i.source?' <a href="'+esc(i.source)+'" target="_blank" rel="noopener">복지로 원문</a>':'')+'</div>'
  +'<p class="oypb-chain"><span>연결 고리</span>'+i.why.map(w=>'<em>'+esc(w)+'</em>').join('')+'</p>'
  +'<p class="oypb-meta">문의 '+esc(deskText(i.desk))+(i.office?' · 담당 '+esc(i.office):'')+(i.checked?' · 확인 '+esc(i.checked):'')+'</p>'
  +(i.note?'<p class="oypb-note">'+esc(i.note)+'</p>':'')+'</li>';
 const SHOW=4;let shown=0;const blocks=[],rest=[];
 for(const grp of m.groups){const a=[],b=[];for(const i of grp.items){(shown<SHOW?a:b).push(i);if(shown<SHOW)shown++}
  if(a.length)blocks.push('<div class="oypb-group"><h4>'+esc(grp.name)+'</h4><ul>'+a.map(row).join('')+'</ul></div>');
  if(b.length)rest.push('<div class="oypb-group"><h4>'+esc(grp.name)+'</h4><ul>'+b.map(row).join('')+'</ul></div>')}
 return '<section class="oypb" aria-label="공공 지원사업 연결">'+head+desks+blocks.join('')
  +(rest.length?'<details class="oypb-more"><summary>나머지 '+(m.items.length-SHOW)+'개 더 보기</summary>'+rest.join('')+'</details>':'')
  +'<p class="oypb-foot">출처: 공공데이터포털 한국사회보장정보원 지자체·중앙부처 복지서비스 API(사업 등록정보이며 개인 사례 자료가 아님). 실제 접수·예산·선정은 담당부서 확인.</p></section>'}
function text(m){if(!m||!m.ready||!m.items.length)return '';
 return ['[공공 지원사업 연결 · 확인 후 신청]'].concat(m.items.map(i=>'- '+i.name+' ← '+i.why.join(', ')+' / 문의 '+deskText(i.desk)+(i.checked?' / 확인 '+i.checked:''))).join('\n')}

const api={version:VERSION,RULES,build,html,text,context};
if(node)module.exports=api;else root.OYPublicBenefits=api;
})(typeof window!=='undefined'?window:globalThis);
