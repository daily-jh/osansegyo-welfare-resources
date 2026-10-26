(function(root){'use strict';
var Criteria=typeof module!=='undefined'?require('./criteria.js'):root.YouthCriteria;
var Weight=typeof module!=='undefined'?require('./weight-model.js'):root.YouthWeightModel;
var sizes=[2,3,3,3,2,2,3,3,2,2],labels=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
var tokens=[['학대','보호','사례'],['청소년','상담','학교','Wee'],['정신','상담','청소년','Wee'],['학습','교육','장학','청소년'],['건강','상담','청소년'],['장애','발달','교육','돌봄'],['가족','상담','돌봄','생활','사례'],['생활','복지','주거','사례','지원'],['청소년','상담','관계','활동'],['청소년','상담','보호','온라인']];
function validate(p){return !!p&&Array.isArray(p.answers)&&p.answers.length===25&&Array.from(p.answers).every(v=>(v==='unknown'||Number.isInteger(v)&&v>=0&&v<=4))&&Array.isArray(p.domains)&&p.domains.length===10&&p.domains.every((d,i)=>d&&typeof d.name==='string'&&Array.isArray(d.items)&&d.items.length===sizes[i]&&d.items.every(q=>typeof q==='string'))&&Array.isArray(p.routes)&&p.routes.length===10&&p.routes.every(r=>Array.isArray(r)&&r.every(x=>typeof x==='string'))&&Array.isArray(p.resources)&&p.resources.every(r=>r&&typeof r==='object')&&(!p.student||(typeof p.student==='object'&&!Array.isArray(p.student)&&['남','여','미확인','응답하지 않음'].includes(p.student.gender)&&['',...dongs,'오산시 외'].includes(p.student.dong)))&&(!p.followups||(typeof p.followups==='object'&&!Array.isArray(p.followups)&&Object.keys(p.followups).every(k=>['4','5','12','13'].includes(k)&&['yes','no','unknown'].includes(p.followups[k]))))&&Array.isArray(p.explicit)&&p.explicit.every(x=>typeof x==='string')}
var dongs=['중앙동','대원1동','대원2동','남촌동','신장1동','신장2동','세마동','초평동'];
function student(p){var v=p&&p.student||{};return {gender:['남','여','미확인','응답하지 않음'].includes(v.gender)?v.gender:'미확인',dong:dongs.includes(v.dong)||v.dong==='오산시 외'?v.dong:''}}
// Service territories supplied by the project owner on 2026-10-23.
var welfareZones=[{number:1,name:'오산세교종합사회복지관',orgId:'b45bc16582',dongs:['신장1동','신장2동','세마동']},{number:2,name:'오산종합사회복지관',orgId:'36cf6918f3',dongs:['남촌동','중앙동']},{number:3,name:'오산남부종합사회복지관',orgId:'2097512abd',dongs:['대원1동','대원2동','초평동']}];
function welfareZone(profile){return welfareZones.find(z=>z.dongs.includes(profile&&profile.dong))||null}
function welfareZoneText(profile){var z=welfareZone(profile);return z?z.number+'권역 · '+z.name+' ('+z.dongs.join('·')+')':profile&&profile.dong==='오산시 외'?'오산시 외 · 거주지 종합사회복지관 별도 확인':'복지관 권역 미확인 · 행정동 선택 후 연결'}
function welfareResources(resources,profile){if(!profile)return resources;var selected=welfareZone(profile),outside=profile&&profile.dong==='오산시 외';return resources.filter(r=>{var z=welfareZones.find(z=>z.orgId===r.orgId||z.name===r['기관명']);return !z||!outside&&(!selected||z.number===selected.number)}).map(r=>{var z=welfareZones.find(z=>z.orgId===r.orgId||z.name===r['기관명']);if(!z)return r;var aliases={'통합사례관리':'사례관리 및 서비스 연계','사례관리':'사례관리 및 서비스 연계','가족·아동청소년 프로그램':'가족기능 강화','아동·가족서비스':'가족기능 강화','지역사회보호·나눔':'지역사회 돌봄 및 주민지원'};return Object.assign({},r,{profileName:'오산세교종합사회복지관',profileService:aliases[r['서비스명']]||r['서비스명'],welfareZone:z.number,routingReason:(selected?profile.dong+' → ':'거주 행정동 확인 필요 · ')+z.number+'권역 '+z.name+' · 담당 동: '+z.dongs.join('·')+' · 개별 사업 대상·접수 및 기존 담당기관은 별도 협의'})})}
function context(p){return Criteria.evaluate(p.answers,sizes,p.explicit.length>0,p.followups)}
function domains(p){var decision=context(p),off=0;return p.domains.map((d,i)=>{var values=p.answers.slice(off,off+sizes[i]),numbers=values.map((v,k)=>off+k+1);off+=sizes[i];var known=values.filter(v=>typeof v==='number'),unknown=values.length-known.length;var sum=known.reduce((a,b)=>a+b,0);return {i,name:d.name,label:labels[i],values,numbers,sum,unknown,known:known.length,mean:unknown?null:sum/sizes[i],peak:Math.max(0,...known),critical:numbers.some(n=>decision.critical.includes(n)),concentrated:decision.substantial.includes(i),safetyUnknown:numbers.some(n=>decision.safetyUnknown.includes(n)),safetyCheckPending:numbers.some(n=>decision.pendingChecks.includes(n)),weightedStrength:Weight.domainStrength(p.answers,i).mean,safety:numbers.some(n=>[1,2,7,25].includes(n)&&p.answers[n-1]>0)}})}
function rank(ds){return ds.slice().sort((a,b)=>Number(b.safety)-Number(a.safety)||Number(b.safetyUnknown)-Number(a.safetyUnknown)||Number(b.safetyCheckPending)-Number(a.safetyCheckPending)||Number(b.critical)-Number(a.critical)||b.peak-a.peak||Number(b.concentrated)-Number(a.concentrated)||(b.weightedStrength||0)-(a.weightedStrength||0)||(b.mean||0)-(a.mean||0)||a.i-b.i)}
var profiles=[
['오산시아동보호전문기관','피해아동·가족 사례관리',[1,2,25],0,'학생의 안전과 보호를 위해 전문기관과 어떻게 함께 도울지 의논합니다','신고·보호 절차 우선, 접수·역할 확인'],
['오산시정신건강복지센터','아동청소년 정신건강 연계',[6,7,8],0,'학생의 마음과 생활 변화를 살펴보고, 필요한 전문평가와 상담을 문의합니다','현재 응급상황은 일반 상담예약보다 긴급 대응 우선'],
['오산시정신건강복지센터','자살예방 상담 연계',[7],0,'7번에서 나타난 어려움에 대해 현재 안전을 먼저 살핀 뒤 전문상담을 문의합니다','실제 표현·행동·현재 상태 확인 필요'],
['오산시정신건강복지센터','정신건강 상담·사례관리',[6,7,8,13],1,'마음과 건강의 어려움에 필요한 전문상담을 의논합니다','아동청소년 담당·접수 절차 문의'],
['오산시청소년상담복지센터','청소년안전망·청소년동반자 연계',[3,4,5,6,7,8,9,10,11,12,13,16,18,22,23,24,25],1,'학교생활과 관계에서 겪는 어려움을 함께 나누고 필요한 청소년 지원을 문의합니다','학생 욕구·기존 지원과 실제 접수 조건 확인'],
['오산시청소년상담복지센터','청소년 심리상담',[3,4,5,6,8,9,10,11,12,13,17,22,23,24],1,'마음과 관계, 학교생활에서 겪는 어려움을 상담으로 도울 수 있는지 문의합니다','현재 안전신호의 직접 확인·보호를 대신하지 않음'],
['경기도교육청 Wee 프로젝트','Wee클래스·Wee센터 상담',[3,4,5,6,7,8,9,10,11,12,13,14,15,22,23,24,25],1,'학교 안에서 받을 수 있는 상담과 학습·또래관계·교육환경 조정 지원을 의논합니다','학교 담당자를 통한 이용 절차 확인 · Wee가 편의 제공·특수교육 대상 선정을 직접 결정하는 것은 아님'],
['경기도교육청 Wee 프로젝트','위기학생 지역전문기관 연계',[3,4,5,6,7,8,9,10,11,12,13,22,23,25],1,'학교의 도움과 함께 필요한 지역 전문기관 지원을 의논합니다','학교 담당자와 필요한 전문기관 역할 확인'],
['오산시가족센터','가족상담·관계증진',[17],0,'가족 간의 어려움이 학생 생활에 미치는 영향을 나누고 가족상담을 문의합니다','학생에게 안전한 가족 참여·연락 방식 확인'],
['오산세교종합사회복지관','가족기능 강화',[16,17,18],1,'가족관계와 돌봄의 부담을 덜기 위해 어떤 도움을 받을 수 있는지 문의합니다','구체적 사업·대상·접수 확인'],
['오산세교종합사회복지관','지역사회 돌봄 및 주민지원',[16,18,19,20],0,'식사·생활·돌봄에 필요한 도움과 학생이 맡은 돌봄을 나눌 방법을 문의합니다','학생에게 제공 가능한 돌봄·식사·생활지원 확인'],
['오산세교종합사회복지관','사례관리 및 서비스 연계',[16,17,18,19,20,21,22,23],1,'생활·돌봄·관계의 어려움을 함께 살펴보고 필요한 지원을 연결할 수 있는지 문의합니다','기존 학교 지원과 복지기관 역할 확인'],
['오산시 동 행정복지센터','긴급복지지원 상담',[19,20,21],0,'당장 필요한 생활비·주거·의료 지원을 받을 수 있는지 상담합니다','점수 외 실제 위기사유·소득·재산 등 사업 기준 별도 확인'],
['오산시 동 행정복지센터','맞춤형복지·통합사례관리 연계',[16,18,19,20,21],1,'생활과 돌봄의 어려움에 맞는 공공 지원을 함께 찾아봅니다','관할 동·학생과 가구의 실제 지원 조건 확인'],
['오산시 동 행정복지센터','기초생활보장·차상위 상담',[19,20,21],2,'기본생활에 필요한 도움과 기초생활보장·차상위 지원 가능성을 상담합니다','소득·재산·가구 등 자격은 별도 심사']
];
// Supplementary directory services require a concrete positive item and stay below core public routes.
function additional(p,d,row){if(!row.directorySource)return null;
 var name=row['기관명']||'',service=row['서비스명']||'',items=[],condition='';
 if(service==='심리상담·발달지원 연계'&&[2,5].includes(d.i)){
  items=(d.i===2?[6,8]:[15]).filter(n=>p.answers[n-1]>=2);
  condition='민간 심리·발달지원 추가 문의 후보 · 중학생 이용 연령·제공분야·비용·바우처·보호자 동의 확인. 의료기관·응급대응으로 해석하지 않음';
 }else if(/^(평안한사랑병원|오산신경정신병원)$/.test(name)&&d.i===2){
  items=[6,7,8].filter(n=>p.answers[n-1]>=(n===7?1:3));
  condition='정신건강 진료 추가 문의 후보 · 소아청소년 진료·예약·의뢰·비용 확인. 입원·응급수용 가능 여부는 확정하지 않음';
 }else if(name==='스마트쉼센터'&&d.i===9){
  items=[24].filter(n=>p.answers[n-1]>=2);
  condition='스마트폰·인터넷 과의존 전문 상담 추가 문의 후보 · 운영 지역과 찾아가는 상담 신청 조건 확인. 이용 시간보다 수면·학습·대면 활동에 미치는 영향으로 판단';
 }else if(/마약상담 1342/.test(name)&&d.i===4){
  items=[13].filter(n=>p.answers[n-1]>=2);
  condition='약물 사용이 언급된 경우의 24시간 익명 상담 후보 · 음주·흡연만이면 학교·청소년상담복지센터를 먼저 연결. 상담이 처벌로 이어지지 않는지 학생에게 먼저 설명';
 }else if(/해바라기센터/.test(name)&&[1,9].includes(d.i)){
  items=(d.i===1?[4]:[25]).filter(n=>p.answers[n-1]>0);
  condition='현재 피해·신고·보호 절차 우선. 복합 문항만으로 성폭력 피해를 확정하지 않으며 실제 피해유형·연령·운영시간에 맞는 전문지원인지 확인';
 }
 return items.length?{items,condition}:null;
}
// Public cases inform safeguards, not fitted scores, diagnoses, or eligibility decisions.
function caseChecks(p,numbers){var a=p.answers,ns=numbers||a.map((v,i)=>v>0?i+1:0),has=xs=>xs.some(n=>ns.includes(n)&&a[n-1]>0),out=[];
 if(has([1,2,4,25]))out.push('피해 내용의 반복 진술·이미지 전송을 요구하지 않으며 안전한 연락·정보공유 범위를 먼저 확인');
 if(has([7]))out.push('총점과 무관하게 현재 안전을 직접 확인하고 전문지원 이후 학교생활·재접촉 담당과 다음 확인일을 정함');
 if(has([9,10,11]))out.push('결석·진학 거부만으로 학업중단을 확정하지 않음 · 학적·학생 희망과 학교 복귀·학습 조정부터 확인');
 if(has([14,15]))out.push('교육환경 조정 필요를 장애·진단으로 단정하지 않음 · 학교 내 조정과 미충족 서비스를 구분하고 실제 대상·자격 확인');
 if(has([16,18,19,20,21]))out.push('빈곤·가족 형태만으로 방임을 추정하지 않음 · 실제 돌봄 공백·학생의 부담과 공공·민간 지원을 함께 확인');
 if([1,2,4,25].some(n=>a[n-1]>0)&&has([6,7,8,16,17,18]))out.push('보호자가 가해 의심 대상이면 공동상담·보호자 연락을 자동 진행하지 않고 안전한 별도 지지자를 확인');
 return out;
}
function describe(p,d,row){var a=p.answers,decision=context(p),profile=profiles.find(x=>x[0]===(row.profileName||row['기관명'])&&x[1]===(row.profileService||row['서비스명'])),extra=additional(p,d,row),evidence=extra?extra.items:d.numbers.filter(n=>a[n-1]>0);if(profile)evidence=evidence.filter(n=>profile[2].includes(n));var max=Math.max(0,...evidence.map(n=>a[n-1])),safety=evidence.some(n=>[1,2,7,25].includes(n)),critical=evidence.some(n=>decision.critical.includes(n));var t=[row['서비스명'],row['지원분야'],row['주요내용']].join(' '),fit=tokens[d.i].filter(k=>t.includes(k)).length;
var order=profile?profile[3]:extra?(/병원/.test(row['기관명'])?4:5):3;if(row['기관명']==='오산시정신건강복지센터'&&!safety&&max<3)order=2;if(extra&&(row['기관명']==='스마트쉼센터'||/마약상담 1342/.test(row['기관명']))&&max>=3)order=2;if(row['서비스명']==='긴급복지지원 상담'&&!critical)order=3;if(row['서비스명']==='청소년안전망·청소년동반자 연계'&&((decision.integrated&&!d.critical&&!d.safety)||(d.i===9&&d.safety)))order=0;if(row['서비스명']==='위기학생 지역전문기관 연계'&&(decision.integrated&&!d.critical&&!d.safety))order=0;
var label=safety?'안전과 전문지원 먼저':critical?'생활·건강부터 살피기':max>=3?'생활의 어려움부터 돕기':max>=2?'반복되는 어려움 돕기':'관찰·상담 문의';var reason=profile?profile[4]:'학생에게 필요한 도움을 이 사업에서 받을 수 있는지 상담해 보세요';if(decision.integrated&&/사례관리|청소년안전망|지역전문기관/.test(row['서비스명']))reason+=' · 여러 어려움을 함께 도울 방법을 문의해 보세요';var condition=extra?extra.condition:profile?profile[5]:/장애|발달/.test(t)?'연령·진단·등록·서비스 필요 등 실제 대상 조건 문의':'실제 대상·관할·비용·운영·접수 조건 문의';return {evidence,max,safety,critical,order,fit,label,reason,condition:[condition,...caseChecks(p,evidence)].join(' · ')}}
function identity(value){return String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase()}
// Administrative dong is explicitly selected, never inferred from a street or legal dong.
function routingResources(resources,profile){
 resources=welfareResources(resources,profile);
 var dongs=resources.filter(r=>/^오산시 (중앙동|대원[12]동|남촌동|신장[12]동|세마동|초평동) 행정복지센터$/.test(r['기관명']||''));
 if(!dongs.length)return resources;
 var selected=student({student:profile}).dong;
 if(selected&&selected!=='오산시 외')return resources.filter(r=>!dongs.includes(r)||r['기관명']==='오산시 '+selected+' 행정복지센터').map(r=>dongs.includes(r)?Object.assign({},r,{profileName:'오산시 동 행정복지센터',routingReason:selected+' 행정동 선택에 따른 관할 상담창구 · 실제 주민등록·거주 관할은 접수 시 확인'}):r);
 if(selected==='오산시 외')return resources.filter(r=>!dongs.includes(r)&&r['기관명']!=='오산시 동 행정복지센터');
 var options=Array.from(new Set(dongs.map(r=>r['기관명']))).sort(),services=new Map();
 dongs.forEach(r=>{if(!services.has(r['서비스명']))services.set(r['서비스명'],Object.assign({},r,{
  '기관명':'오산시 동 행정복지센터','대표전화':'',contactDept:'',address:'',addressNote:'',addressStatus:'미확인',addressSource:'',addressCheckedOn:'',contacts:[],orgId:'',serviceId:'','기관소개':'거주지 관할 동을 먼저 확인해 8개 동 중 해당 창구로 연결합니다.',
  '홈페이지':'https://daily-jh.github.io/osansegyo-welfare-resources/#org=438b636f15',
  '지원대상':'오산시 주민 중 해당 제도 상담이 필요한 가구 · 거주지 관할 확인',
  '신청·연계방법':'거주지 관할 동을 먼저 확인하세요. 자원 안내에서 8개 동을 각각 확인할 수 있습니다. 031-8036-8036은 시청 대표전화이며 동 직통전화가 아닙니다.',
  dongOptions:options
 }))});
 return resources.filter(r=>!dongs.includes(r)).concat(Array.from(services.values()));
}
function groupedCandidates(p,d){
 if(!d.sum)return [];
 var economic=[19,20,21].some(n=>p.answers[n-1]>0),blocked=/주민조직화|자원개발|아이리더|인재양성|예방 및 유관기관 협력|배움터 교육지원|발달장애인 평생교육|직업지원|노인·장애인 공적돌봄|한부모·다문화|아이돌봄서비스/;
 var allowed=new Set(p.routes[d.i].map(identity));
 var rows=routingResources(p.resources,p.student?student(p):undefined).filter(r=>(allowed.has(identity(r['기관명']))||allowed.has(identity(r.profileName))||additional(p,d,r))&&typeof r['서비스명']==='string'&&r['서비스명'].trim()&&!blocked.test(r['서비스명'])&&(!/장학|교육지원 공모/.test(r['서비스명'])||economic));
 var seen=new Set();
 rows=rows.filter(r=>{
  var key=identity(r['기관명'])+'|'+identity(r['서비스명']);if(seen.has(key))return false;seen.add(key);
  var prof=profiles.find(x=>x[0]===(r.profileName||r['기관명'])&&x[1]===(r.profileService||r['서비스명']));
  if(/성인|노인|청년/.test(r['지원대상']||'')&&!/아동|청소년|중고생/.test(r['지원대상']||''))return false;
  // Item 14 measures an education-environment barrier, not disability eligibility.
  if(d.i===5&&!(p.answers[14]>0)&&(/장애|발달/.test(r['기관명']||'')||r['기관명']==='오산시하나울복지센터'))return false;
  if(additional(p,d,r))return true;
  return prof?prof[2].some(n=>d.numbers.includes(n)&&p.answers[n-1]>0):describe(p,d,r).fit>0;
 });
 rows.sort((a,b)=>{var x=describe(p,d,a),y=describe(p,d,b);return x.order-y.order||Number(y.safety)-Number(x.safety)||Number(y.critical)-Number(x.critical)||y.max-x.max||y.evidence.length-x.evidence.length||y.fit-x.fit});
 // Group AFTER ranking, BEFORE any display limit. The best matching role stays first;
 // other eligible services remain attached to that institution, never separate cards.
 var groups=new Map();
 rows.forEach(row=>{var key=identity(row['기관명']);if(!groups.has(key))groups.set(key,{name:row['기관명'].trim(),primary:row,services:[]});groups.get(key).services.push(row)});
 return Array.from(groups.values()).slice(0,10);
}
function candidates(p,d){return groupedCandidates(p,d).map(group=>group.primary)}
function referrals(p){var groups=new Map();rank(domains(p)).filter(d=>d.sum>0).forEach(d=>groupedCandidates(p,d).forEach(g=>{var key=g.primary.orgId||identity(g.name);if(!groups.has(key))groups.set(key,{name:g.name,primary:g.primary,services:[],domainIds:[]});var v=groups.get(key);v.domainIds.push(d.i);g.services.forEach(r=>{if(!v.services.some(s=>(s.serviceId||s['서비스명'])===(r.serviceId||r['서비스명'])))v.services.push(r)})}));return Array.from(groups.values())}
// Read-only view of the role profile a row was matched by; used to explain recommendations.
function profileFor(row){var x=profiles.find(x=>x[0]===(row.profileName||row['기관명'])&&x[1]===(row.profileService||row['서비스명']));return x?{name:x[0],service:x[1],items:x[2].slice(),rank:x[3],reason:x[4],condition:x[5]}:null}
var api={profileFor,additional,caseChecks,welfareZones,welfareZone,welfareZoneText,dongs,student,referrals,routingResources,labels,validate,domains,rank,candidates,groupedCandidates,context,describe};if(typeof module!=='undefined')module.exports=api;else root.YouthMap=api;
})(typeof window!=='undefined'?window:globalThis);
