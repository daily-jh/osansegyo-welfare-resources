/* OY-RALS safety contacts v1: today's contacts for each kind of safety signal (scale item or narrative safety type).
   Pure function. Only national hotlines and Osan agencies already in the resource DB (resource-links.js) are listed;
   the practitioner still follows the own agency's protection procedure. No record text is read, only type names. */
(function(root){'use strict';
const VERSION='1.0.0-xmod1200-20261029';
const KINDS=[
 {id:'selfharm',h:'자해·자살 위험',items:[7],re:/자해|자살|죽음|추락/,
  rows:[['자살예방상담전화 109','24시간 상담'],['오산시정신건강복지센터 031-374-8680','위기 상담·응급 연계'],['119·112','지금 위험하면 바로']]},
 {id:'abuse',h:'학대·방임·가족 안 위해',items:[1,2],re:/학대|보호자에 의한|가정 안|방임|가족 피해/,
  rows:[['아동학대 신고 112','신고의무자는 의심만으로도 신고'],['오산시아동보호전문기관 031-8077-9610','신고 뒤 피해아동·가족 사례관리']]},
 {id:'sexual',h:'성적 위해·온라인 성착취',items:[25],re:/성적|성착취|성폭력|촬영물|사진 유포/,
  rows:[['경찰 112 · 학교폭력 117','증거(대화·사진)는 지우지 않게 안내'],['디지털성범죄피해자지원센터 02-735-8994','삭제 지원·상담'],['해바라기센터','성폭력 피해 통합지원(112 신고 때 연계)']]},
 {id:'coercion',h:'강요·협박·착취',items:[],re:/강요|협박|착취/,
  rows:[['경찰 112 · 학교폭력 117','협박 내용은 캡처해 보관']]},
 {id:'dating',h:'교제 폭력',items:[],re:/교제 폭력/,
  rows:[['경찰 112','지금 위험하면 바로'],['여성긴급전화 1366','교제 폭력 상담(24시간)'],['청소년전화 1388','청소년 상담']]},
 {id:'runaway',h:'가출·오늘 잘 곳',items:[],re:/가출|외박|거처/,
  rows:[['청소년전화 1388','24시간 · 청소년쉼터 연결'],['오산시청소년상담복지센터 031-372-4004','상담·쉼터 연계']]},
 {id:'harm',h:'다른 사람을 해칠 위협·흉기',items:[],re:/타인 위해|흉기/,
  rows:[['경찰 112','흉기가 있거나 지금 위협하면 바로'],['학교 관리자·위기관리위원회','오늘 안전 계획을 함께 세움']]}
];
/* o: {items:[number] safety items answered ≥1, topics:[string] narrative safety type names or explicit urgent labels, explicit:boolean} */
function forSignals(o){
 const items=(o&&o.items)||[],topics=(o&&o.topics)||[];
 const out=KINDS.filter(k=>k.items.some(n=>items.indexOf(n)>=0)||topics.some(t=>k.re.test(String(t))));
 if(!out.length&&o&&o.explicit)out.push(KINDS[0],KINDS[1]);
 return out.map(k=>({id:k.id,h:k.h,rows:k.rows.map(r=>({b:r[0],t:r[1]}))}));
}
function fromChain(R,explicit){const ex=Array.isArray(explicit)?explicit:[];return forSignals({items:(R&&R.safetyPos)||[],topics:((R&&R.narrSafety)||[]).concat(ex),explicit:ex.length>0||explicit===true});}
const api=Object.freeze({VERSION,KINDS,forSignals,fromChain});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYSafetyContacts=api;
})(typeof window!=='undefined'?window:globalThis);
