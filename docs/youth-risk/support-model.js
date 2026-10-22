(function(root){'use strict';
var Criteria=typeof module!=='undefined'?require('./criteria.js'):root.YouthCriteria;
var sizes=[2,3,3,3,2,2,3,3,2,2],labels=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
var tokens=[['학대','보호','사례'],['청소년','상담','학교','Wee'],['정신','상담','청소년','Wee'],['학습','교육','장학','청소년'],['건강','상담','청소년'],['장애','발달','교육','돌봄'],['가족','상담','돌봄','생활','사례'],['생활','복지','주거','사례','지원'],['청소년','상담','관계','활동'],['청소년','상담','보호','온라인']];
function validate(p){return !!p&&Array.isArray(p.answers)&&p.answers.length===25&&Array.from(p.answers).every(v=>Number.isInteger(v)&&v>=0&&v<=4)&&Array.isArray(p.domains)&&p.domains.length===10&&p.domains.every((d,i)=>d&&typeof d.name==='string'&&Array.isArray(d.items)&&d.items.length===sizes[i]&&d.items.every(q=>typeof q==='string'))&&Array.isArray(p.routes)&&p.routes.length===10&&p.routes.every(r=>Array.isArray(r)&&r.every(x=>typeof x==='string'))&&Array.isArray(p.resources)&&p.resources.every(r=>r&&typeof r==='object')&&Array.isArray(p.explicit)&&p.explicit.every(x=>typeof x==='string')}
function context(p){return Criteria.evaluate(p.answers,sizes,p.explicit.length>0)}
function domains(p){var decision=context(p),off=0;return p.domains.map((d,i)=>{var values=p.answers.slice(off,off+sizes[i]),numbers=values.map((v,k)=>off+k+1);off+=sizes[i];var sum=values.reduce((a,b)=>a+b,0);return {i,name:d.name,label:labels[i],values,numbers,sum,mean:sum/sizes[i],peak:Math.max(...values),critical:numbers.some(n=>decision.critical.includes(n)),concentrated:decision.substantial.includes(i),safety:numbers.some(n=>[1,2,7,25].includes(n)&&p.answers[n-1]>0)}})}
function rank(ds){return ds.slice().sort((a,b)=>Number(b.safety)-Number(a.safety)||Number(b.critical)-Number(a.critical)||b.peak-a.peak||Number(b.concentrated)-Number(a.concentrated)||b.mean-a.mean||a.i-b.i)}
var profiles=[
['오산시아동보호전문기관','피해아동·가족 사례관리',[1,2,25],0,'보호 관련 안전신호에 따른 전문기관 협력','신고·보호 절차 우선, 접수·역할 확인'],
['오산시정신건강복지센터','아동청소년 정신건강 연계',[6,7,8],0,'아동청소년의 정서·자해·일상 기능 변화에 대한 전문평가 문의','현재 응급상황은 일반 상담예약보다 긴급 대응 우선'],
['오산시정신건강복지센터','자살예방 상담 연계',[7],0,'7번 자해·죽음 관련 신호의 직접 안전확인 후 전문상담 문의','실제 표현·행동·현재 상태 확인 필요'],
['오산시정신건강복지센터','정신건강 상담·사례관리',[6,7,8,13],1,'정서·건강 관련 전문상담 필요 확인','아동청소년 담당·접수 절차 문의'],
['오산시청소년상담복지센터','청소년안전망·청소년동반자 연계',[3,4,5,6,7,8,9,10,11,12,13,16,18,22,23,24,25],1,'학교생활·관계·복합 어려움의 청소년 전문지원 문의','학생 욕구·기존 지원과 실제 접수 조건 확인'],
['오산시청소년상담복지센터','청소년 심리상담',[3,4,5,6,8,9,10,11,12,13,17,22,23,24],1,'보고된 정서·관계·학교생활 어려움의 상담 문의','현재 안전신호의 직접 확인·보호를 대신하지 않음'],
['경기도교육청 Wee 프로젝트','Wee클래스·Wee센터 상담',[3,4,5,6,7,8,9,10,11,12,13,22,23,24,25],1,'학교 상담·학습참여·또래 안전의 학교 연계 문의','학교 담당자를 통한 이용 절차 확인'],
['경기도교육청 Wee 프로젝트','위기학생 지역전문기관 연계',[3,4,5,6,7,8,9,10,11,12,13,22,23,25],1,'안전·학교생활 어려움에 필요한 지역 전문지원 문의','학교 담당자와 필요한 전문기관 역할 확인'],
['오산시가족센터','가족상담·관계증진',[17],0,'17번 가족갈등의 학생 생활 영향에 대한 가족상담 문의','학생에게 안전한 가족 참여·연락 방식 확인'],
['오산세교종합사회복지관','가족기능 강화',[16,17,18],1,'가족관계·돌봄 부담의 실제 지원 가능 범위 문의','구체적 사업·대상·접수 확인'],
['오산세교종합사회복지관','지역사회 돌봄 및 주민지원',[16,18,19,20],0,'실제 생활·돌봄 공백 또는 학생의 돌봄 부담 경감 자원 문의','학생에게 제공 가능한 돌봄·식사·생활지원 확인'],
['오산세교종합사회복지관','사례관리 및 서비스 연계',[16,17,18,19,20,21,22,23],1,'생활·돌봄·관계의 복합 지원 자원 문의','기존 학교 지원과 복지기관 역할 확인'],
['오산시 동 행정복지센터','긴급복지지원 상담',[19,20,21],0,'필수생활·주거·의료 접근의 시급한 공백 상담','점수 외 실제 위기사유·소득·재산 등 사업 기준 별도 확인'],
['오산시 동 행정복지센터','맞춤형복지·통합사례관리 연계',[16,18,19,20,21],1,'생활·돌봄의 복합 욕구에 맞는 공적 자원 문의','관할 동·학생과 가구의 실제 지원 조건 확인'],
['오산시 동 행정복지센터','기초생활보장·차상위 상담',[19,20,21],2,'필수생활 자원 부족과 공적지원 가능성 상담','소득·재산·가구 등 자격은 별도 심사']
];
function describe(p,d,row){var a=p.answers,decision=context(p),profile=profiles.find(x=>x[0]===row['기관명']&&x[1]===row['서비스명']),evidence=d.numbers.filter(n=>a[n-1]>0);if(profile)evidence=evidence.filter(n=>profile[2].includes(n));var max=Math.max(0,...evidence.map(n=>a[n-1])),safety=evidence.some(n=>[1,2,7,25].includes(n)),critical=evidence.some(n=>decision.critical.includes(n));var t=[row['서비스명'],row['지원분야'],row['주요내용']].join(' '),fit=tokens[d.i].filter(k=>t.includes(k)).length;
var order=profile?profile[3]:3;if(row['기관명']==='오산시정신건강복지센터'&&!safety&&max<3)order=2;if(row['서비스명']==='긴급복지지원 상담'&&!critical)order=3;if(row['서비스명']==='청소년안전망·청소년동반자 연계'&&((decision.integrated&&!d.critical&&!d.safety)||(d.i===9&&d.safety)))order=0;if(row['서비스명']==='위기학생 지역전문기관 연계'&&(decision.integrated&&!d.critical&&!d.safety))order=0;
var label=safety?'안전·전문확인 우선':critical?'시급한 생활·건강 확인':max>=3?'기능 제한 지원 우선':max>=2?'반복 어려움 지원':'관찰·상담 문의';var reason=profile?profile[4]:'선택 영역의 등록 서비스와 실제 적합성 확인';if(decision.integrated&&/사례관리|청소년안전망|지역전문기관/.test(row['서비스명']))reason+=' · 1차의 복합 지원 신호 반영';return {evidence,max,safety,critical,order,fit,label,reason,condition:profile?profile[5]:/장애|발달/.test(t)?'연령·진단·등록·서비스 필요 등 실제 대상 조건 문의':'실제 대상·관할·비용·운영·접수 조건 문의'}}
function identity(value){return String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase()}
function groupedCandidates(p,d){
 if(!d.sum)return [];
 var economic=[19,20,21].some(n=>p.answers[n-1]>0),blocked=/예방 및 유관기관 협력|배움터 교육지원|발달장애인 평생교육|직업지원|노인·장애인 공적돌봄|한부모·다문화|아이돌봄서비스/;
 var allowed=new Set(p.routes[d.i].map(identity));
 var rows=p.resources.filter(r=>allowed.has(identity(r['기관명']))&&typeof r['서비스명']==='string'&&r['서비스명'].trim()&&!blocked.test(r['서비스명'])&&(!/장학|교육지원 공모/.test(r['서비스명'])||economic));
 var seen=new Set();
 rows=rows.filter(r=>{
  var key=identity(r['기관명'])+'|'+identity(r['서비스명']);if(seen.has(key))return false;seen.add(key);
  var prof=profiles.find(x=>x[0]===r['기관명']&&x[1]===r['서비스명']);
  if(/성인|노인|청년/.test(r['지원대상']||'')&&!/아동|청소년|중고생/.test(r['지원대상']||''))return false;
  return prof?prof[2].some(n=>d.numbers.includes(n)&&p.answers[n-1]>0):describe(p,d,r).fit>0;
 });
 rows.sort((a,b)=>{var x=describe(p,d,a),y=describe(p,d,b);return x.order-y.order||Number(y.safety)-Number(x.safety)||Number(y.critical)-Number(x.critical)||y.max-x.max||y.evidence.length-x.evidence.length||y.fit-x.fit});
 // Group AFTER ranking, BEFORE any display limit. The best matching role stays first;
 // other eligible services remain attached to that institution, never separate cards.
 var groups=new Map();
 rows.forEach(row=>{var key=identity(row['기관명']);if(!groups.has(key))groups.set(key,{name:row['기관명'].trim(),primary:row,services:[]});groups.get(key).services.push(row)});
 return Array.from(groups.values()).slice(0,6);
}
function candidates(p,d){return groupedCandidates(p,d).map(group=>group.primary)}
var api={labels,validate,domains,rank,candidates,groupedCandidates,context,describe};if(typeof module!=='undefined')module.exports=api;else root.YouthMap=api;
})(typeof window!=='undefined'?window:globalThis);
