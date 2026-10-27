/* OY-RALS 공통 정의 v1 — 안전문항·추가확인 문항·10개 생활영역을 한 곳에 둔다.
   공식 점수 규칙의 원본은 criteria.js(YouthCriteria)이며, 이 파일은 그 값을 다른 화면 모듈이 같은 값으로 읽게 하는 사본이다.
   tests/oy-constants-drift.cjs가 criteria.js·app.js와 이 값이 같은지 매번 확인한다. */
(function(root){'use strict';
const VERSION='1.0.0-20261027';
const SAFETY_ITEMS=Object.freeze([1,2,7,25]);
const FOLLOWUP_ITEMS=Object.freeze([4,5,12,13]);
const DOMAINS=Object.freeze([
 ['아동학대·보호',[1,2]],['학교폭력·또래 안전',[3,4,5]],['자해·정서·정신건강',[6,7,8]],['학습·출결',[9,10,11]],
 ['행동·건강 안전',[12,13]],['장애·발달 및 접근성',[14,15]],['가족·돌봄',[16,17,18]],['경제·주거',[19,20,21]],
 ['관계·지지체계',[22,23]],['디지털·온라인 안전',[24,25]]
].map(([name,items],id)=>Object.freeze({id,name,items:Object.freeze(items)})));
/* 통합사례관리 선정에서 영역을 맡을 개입체계. 학교 안 지원(담임·교육복지사·Wee클래스·상담교사)은
   하나의 기관이자 개입체계로 센다(지훈 결정 2026-10-27). 그래서 관계·디지털 상담은 '학교'로 묶는다. */
const SYSTEM_OF_DOMAIN=Object.freeze(['아동보호','학교','정신건강','학교','보건·의료','학교','가족·돌봄','공공급여','학교','학교']);
const api=Object.freeze({VERSION,SAFETY_ITEMS,FOLLOWUP_ITEMS,DOMAINS,SYSTEM_OF_DOMAIN});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYConstants=api;
})(typeof window!=='undefined'?window:globalThis);
