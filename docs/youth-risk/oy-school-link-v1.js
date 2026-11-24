/* OY-RALS 학맞통 연계 v1 — 위기징후 판정(OYDecision)을 학생맞춤통합지원법 절차에 맞춰 다시 읽는다.
   근거(2026-11-24 확인):
   · 학생맞춤통합지원법(법률 제20671호, 2026. 3. 1. 시행) 제2조 제1호(기초학력 미달, 경제적·심리적·정서적 어려움, 학교폭력, 경계선 지능, 아동학대 등),
     제8조 ②(교육지원청 지역학생맞춤통합지원센터), 제10조(②요청 ③학교장 선정 ④교육장 등에 선정·지원 요청 ⑥선정 자료),
     제11조(①지원 종류 ②학교 내 위원회·협의회 활용 ③학생·보호자 동의), 제12조(계획·관찰관리), 제15조(지자체·아동보호전문기관·청소년상담복지센터 협력체계),
     제17·18조(정보시스템·정보 요청).
   · 교육부 「2026년 학생맞춤통합지원 체계 구축 계획」(2026-02-12 보도): 학교 내 논의 절차(학교장 총괄·교감 조정), 학교가 교육(지원)청에 요청하는 창구를
     학생맞춤통합지원센터로 일원화, 가정 내 학대·의료적 개입·지역사회 돌봄 연계처럼 학교만으로 어려운 사안은 교육(지원)청 심층 진단·지역자원 연계, 정보시스템은 2028년까지 구축.
   이 모듈은 판정을 하지 않는다. CORE 원점수·공식 안전판정·5단계·통합사례관리 선정은 OYDecision 값을 읽기만 한다.
   학맞통 대상 선정은 학교장이 하며, 여기 나오는 '연계 경로'는 학교 내 논의에 올릴 제안이다. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261124';
const OD=()=>node?require('./oy-decision-v1.js'):root.OYDecision;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isNum=v=>Number.isInteger(v);

/* 10개 영역 → 제11조 ①의 지원 종류와 학교 안 담당. 제2조 제1호의 예시 어려움과 맞닿는 곳은 law에 적는다. */
const SUPPORT=Object.freeze([
 {kind:'긴급지원 · 복지서비스 연계',school:'교육복지사 · 학교장(신고의무)',law:'아동학대',outside:'아동보호전문기관 · 시청 아동보호팀'},
 {kind:'상담 · 보건안전',school:'담임 · 상담교사(Wee클래스) · 학교폭력 담당',law:'학교폭력',outside:'청소년상담복지센터 · Wee센터'},
 {kind:'상담 · 의료지원 연계',school:'상담교사(Wee클래스) · 보건교사',law:'심리적·정서적 어려움',outside:'정신건강복지센터 · 정신건강의학과'},
 {kind:'학습지원 · 학업 지속',school:'담임 · 교과교사 · 기초학력 담당',law:'기초학력 미달',outside:'지역아동센터 · 청소년상담복지센터(학업중단 예방)'},
 {kind:'보건안전 · 상담',school:'보건교사 · 상담교사',law:'',outside:'청소년상담복지센터 · 보건소'},
 {kind:'특수교육 · 학습지원',school:'특수교사 · 담임',law:'경계선 지능',outside:'장애인복지관 · 발달장애인지원센터'},
 {kind:'복지서비스 연계',school:'교육복지사',law:'',outside:'복지관 · 행정복지센터 · 가족센터'},
 {kind:'교육비 지원 · 복지서비스 연계',school:'교육복지사 · 행정실(교육비)',law:'경제적 어려움',outside:'행정복지센터 · 복지관'},
 {kind:'상담',school:'담임 · 상담교사',law:'',outside:'청소년상담복지센터'},
 {kind:'상담 · 보건안전',school:'담임 · 정보 담당 · 상담교사',law:'',outside:'청소년상담복지센터 · 스마트쉼센터'}
]);
/* 학교만으로 어려워 교육지원청 센터에 요청할 사유(2026 계획의 예시를 영역으로 옮김). */
function centerReasons(R){
 const P=R.deep&&R.deep.profile||[],ans=R.five&&R.five.answers||[];
 const peak=i=>(P[i]&&isNum(P[i].peak))?P[i].peak:-1,a=n=>isNum(ans[n-1])?ans[n-1]:-1;
 const out=[];
 if(peak(0)>=1)out.push('가정 내 학대·보호 문제 의심(1·2번)');
 if(a(7)>=1||peak(2)>=3)out.push('정서·정신건강의 의료적 개입 검토');
 if(peak(6)>=2||peak(7)>=2)out.push('가족·경제 문제로 지역사회 돌봄·복지 연계 필요');
 if(peak(5)>=2)out.push('장애·발달 진단이나 특수교육 지원 검토');
 return out;
}
function build(p,given){
 const R=given||OD().forPayload(p);
 const P=R.deep&&R.deep.profile||[];
 const need=P.filter(d=>isNum(d.peak)&&(d.peak>=2||(d.id===0&&d.peak>=1))).sort((x,y)=>y.peak-x.peak||x.id-y.id);
 const sel=R.selection||{},nonSchool=(sel.systems||[]).filter(s=>s!=='학교');
 const reasons=centerReasons({deep:R.deep,five:{answers:p.answers}});
 /* 지원 우선순위 4단계 이상(다기관·최우선)은 학교만으로 어려운 사안으로 보고 센터 요청을 검토 목록에 올린다. */
 if(isNum(R.tier)&&R.tier>=4&&!reasons.length)reasons.push('지원 우선순위 '+R.tier+'단계 · 학교만으로 어려울 수 있어 심층 진단 검토');
 /* 연계 층: 학교 안 → 교육지원청 센터 요청 → 지역 전문기관 병행. 위로 올라갈수록 아래 층을 포함한다. */
 let layer=need.length?1:0;
 if(reasons.length||nonSchool.length)layer=2;
 if(nonSchool.length&&(sel.status==='met'||sel.status==='review'))layer=3;
 const LAYERS=[
  {n:1,name:'학교 안 논의',who:'학교장 총괄 · 교감 조정 · 담임·교육복지사·상담교사',law:'제10조 ②③ · 제11조 ②'},
  {n:2,name:'교육지원청 학생맞춤통합지원센터 요청',who:'화성오산교육지원청 센터(학교가 요청하는 창구) · 심층 진단과 자원 연계',law:'제8조 ② · 제10조 ④'},
  {n:3,name:'지역 전문기관과 함께 지원',who:'복지관 통합사례관리 · 아동보호전문기관 · 정신건강복지센터 등',law:'제15조 협력체계'}
 ];
 const prov=R.provisional||(R.pending&&R.pending.length)?' (잠정)':'';
 const head=(layer===0?'학맞통 대상 논의 전 · 관찰'
  :layer===1?'학교 안 학맞통 논의로 시작'
  :layer===2?'학교 안 논의 + 교육지원청 센터 요청 검토'
  :'학교 안 논의 + 교육지원청 센터 + 지역기관 함께')+prov;
 const supports=need.slice(0,5).map(d=>Object.assign({area:d.name,peak:d.peak},SUPPORT[d.id]));
 const lawHits=[...new Set(need.map(d=>SUPPORT[d.id].law).filter(Boolean))];
 const abuse=P[0]&&isNum(P[0].peak)&&P[0].peak>=1;
 const first=R.urgent?'안전 응답이 있어 학맞통 선정 절차를 기다리지 않습니다. 오늘 소속 학교의 보호 절차(신고의무 포함)를 먼저 밟고, 학맞통 논의는 그다음에 이어 갑니다.'
  :R.pending&&R.pending.length?'추가확인('+R.pending.map(n=>n+'번').join('·')+')을 먼저 받은 뒤 학교 안 논의에 올립니다.'
  :layer>=1?'담임 의견서(03 T-3)와 이 결과를 학교 안 논의에 올려 학교장 선정 검토를 요청합니다.'
  :'2점 이상 영역이 없어 지금은 관찰을 이어 가고, 변화가 보이면 다시 평가합니다.';
 const materials=[
  ['기초학력진단검사 결과','학교 보유 자료 · 이 시스템에는 없음'],
  ['담임·교과교사 의견','04 기관별 개입방안 · 학교 T-3 교사 의견서로 정리'],
  ['보호자 상담 결과',abuse?'보호자가 학대 의심 대상이면 상담·동의 요청 전에 아동보호 절차를 먼저 확인':'보호자 상담 뒤 적음'],
  ['OY-RALS 결과','참고 자료 · 선정 기준을 대신하지 않음']
 ];
 return {version:VERSION,layer,head,layers:LAYERS,reasons,supports,lawHits,first,materials,consent:'지원하려면 학생과 보호자의 동의가 필요합니다(제11조 ③).',
  share:'학생맞춤통합지원정보시스템은 2028년까지 구축 예정입니다. 그 전에는 기관에 넘길 때 동의 범위 안에서 꼭 필요한 정보만 전합니다.',
  decision:{tier:R.cells[2].value,select:R.cells[4].value,path:R.pathway,lead:R.lead}};
}
function html(m){
 if(!m)return '';
 const steps=m.layers.map(L=>'<li class="'+(L.n<=m.layer?'on':'')+(L.n===m.layer?' now':'')+'"><b>'+L.n+'</b><div><strong>'+esc(L.name)+'</strong><span>'+esc(L.who)+'</span><small>'+esc(L.law)+'</small></div></li>').join('');
 const sup=m.supports.length?'<table class="oysl-t"><thead><tr><th scope="col">어려운 영역</th><th scope="col">학맞통 지원 종류(제11조 ①)</th><th scope="col">학교 안 담당</th><th scope="col">학교 밖 연계</th></tr></thead><tbody>'
  +m.supports.map(s=>'<tr><td data-l="영역">'+esc(s.area)+'</td><td data-l="지원 종류">'+esc(s.kind)+'</td><td data-l="학교 안">'+esc(s.school)+'</td><td data-l="학교 밖">'+esc(s.outside)+'</td></tr>').join('')+'</tbody></table>':'<p class="oysl-muted">2점 이상 영역이 없어 지원 종류를 정하지 않았습니다.</p>';
 return '<section class="oysl" aria-label="학생맞춤통합지원 연계 경로">'
  +'<header><span class="oysl-k">학맞통 연계 · 학생맞춤통합지원법</span><h3>'+esc(m.head)+'</h3><p>'+esc(m.first)+'</p></header>'
  +'<ol class="oysl-steps">'+steps+'</ol>'
  +(m.reasons.length?'<p class="oysl-why"><b>교육지원청 센터에 요청할 사유</b> '+esc(m.reasons.join(' · '))+'</p>':'')
  +(m.lawHits.length?'<p class="oysl-why"><b>법 제2조의 어려움과 맞닿는 부분</b> '+esc(m.lawHits.join(' · '))+'</p>':'')
  +sup
  +'<details class="oysl-more"><summary>선정 자료·동의·정보 공유</summary><ul>'+m.materials.map(x=>'<li><b>'+esc(x[0])+'</b> '+esc(x[1])+'</li>').join('')+'</ul><p>'+esc(m.consent)+'</p><p>'+esc(m.share)+'</p></details>'
  +'<small class="oysl-muted">학맞통 대상 선정은 학교장이 합니다(제10조 ③). 위 경로는 위기징후 결과를 학교 안 논의에 올리기 위한 제안이며, 판정 값은 바꾸지 않습니다.</small></section>';
}
function text(m){
 if(!m)return '';
 return ['[학맞통 연계] '+m.head,m.first,...m.layers.filter(L=>L.n<=m.layer).map(L=>L.n+'. '+L.name+' — '+L.who+' ('+L.law+')'),
  ...(m.reasons.length?['교육지원청 센터 요청 사유: '+m.reasons.join(' · ')]:[]),
  ...m.supports.map(s=>'- '+s.area+': '+s.kind+' / 학교 안 '+s.school+' / 학교 밖 '+s.outside),m.consent].join('\n');
}
/* 04 기관별 개입방안 · 교육지원청(stage 8). 연락처는 복지자원 DB(window.WELFARE_DATA)에서 읽고, DB에 없는 센터 번호는 만들지 않는다. */
const EDU_ORGS=[['ORG-N24-HOWEE','위기상담·심리검사·치료 연계'],['ORG-Y22-SPEC','특수교육 진단·선정배치·치료지원'],['ORG-Y22-EDU','학업중단 예방·대안교육 위탁']];
function contacts(){let D=root.WELFARE_DATA;try{D=D||root.document.getElementById('assessmentFrame').contentWindow.WELFARE_DATA}catch(_){}const orgs=D&&Array.isArray(D.organizations)?D.organizations:[];
 return EDU_ORGS.map(([id,use])=>{const o=orgs.find(x=>x.id===id);return o?{name:o.name,use,phone:o.phone||'',site:o.site||''}:null}).filter(Boolean);}
function eduPage(p){
 const m=build(p),c=contacts();
 return '<div class="oyp-stagehead"><span class="oyp-eyebrow">04 기관별 개입방안 · 교육지원청</span><h2>교육지원청 학생맞춤통합지원센터 연계</h2><p>학교만으로 어려운 사안(가정 내 학대, 의료적 개입, 지역사회 돌봄 연계 등)은 학교가 교육지원청 학생맞춤통합지원센터에 심층 진단과 자원 연계를 요청합니다. 2026년부터 학교가 교육(지원)청에 요청하는 창구가 이 센터로 모였습니다.</p></div>'
  +html(m)
  +'<section class="oysl oysl-req" aria-label="센터 요청 요지"><header><span class="oysl-k">요청 준비</span><h3>센터에 보낼 요지(초안)</h3><p>학생 이름·서술 원문은 넣지 않았습니다. 학교 담당자가 고쳐서 학교 공문·내부 절차로 보냅니다.</p></header>'
  +'<pre class="oysl-pre" id="oyslReq">'+esc(text(m))+'</pre><button type="button" class="flow-btn" data-oysl-copy>요지 복사</button> <span class="oysl-muted" role="status" id="oyslCopyStatus"></span></section>'
  +'<section class="oysl oysl-contacts" aria-label="교육지원청 연락처"><header><span class="oysl-k">화성오산교육지원청 · 복지자원 DB</span><h3>함께 쓰는 교육지원청 창구</h3></header><ul>'
  +c.map(x=>'<li><b>'+esc(x.name)+'</b> · '+esc(x.use)+(x.phone?' · <a href="tel:'+esc(x.phone.replace(/[^0-9]/g,''))+'">'+esc(x.phone)+'</a>':'')+(x.site?' · <a href="'+esc(x.site)+'" target="_blank" rel="noopener">누리집</a>':'')+'</li>').join('')
  +'</ul><p class="oysl-muted">학생맞춤통합지원센터의 전용 전화번호는 아직 복지자원 DB에서 확인되지 않았습니다. 학교 학맞통 담당자를 거쳐 화성오산교육지원청에 요청합니다.</p></section>';
}
function mount(e){
 const st=e&&e.detail,area=root.document&&root.document.getElementById('eduArea');if(!area)return;
 const on=!!(st&&st.ready&&st.payload&&st.stage===8);area.hidden=!on;if(!on)return;
 const key=(st.payload.flowRevision||'')+'|'+JSON.stringify(st.payload.answers);if(area.dataset.key===key)return;area.dataset.key=key;
 try{area.innerHTML=eduPage(st.payload)}catch(err){area.innerHTML='<p role="alert">교육지원청 연계 화면을 만들지 못했습니다. 판정 값은 그대로입니다.</p>'}
}
const api=Object.freeze({VERSION,SUPPORT,build,html,text,eduPage});
if(node)module.exports=api;else{root.OYSchoolLink=api;if(root.document){root.addEventListener('oy-journey-view',mount);
 root.document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-oysl-copy]');if(!b)return;const t=root.document.getElementById('oyslReq'),s=root.document.getElementById('oyslCopyStatus');
  try{root.navigator.clipboard.writeText(t.textContent).then(()=>{if(s)s.textContent='복사했습니다.'},()=>{if(s)s.textContent='복사하지 못했습니다. 글을 직접 선택해 복사해 주세요.'})}catch(_){if(s)s.textContent='복사하지 못했습니다. 글을 직접 선택해 복사해 주세요.'}});}}
})(typeof window!=='undefined'?window:globalThis);
