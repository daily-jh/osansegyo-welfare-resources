/* Shared report templates: CORE-owned routing, score-only, no new cutoffs.
   Superseded on the result screen by oy-deep-interpretation-v1.js; kept as fallback and for its contract test. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const C=node?require('./criteria.js'):root.YouthCriteria;
const S=node?require('./scale-interpretation-v821.js'):root.YouthScaleV821;
const E=node?require('./cie-semantic-layer-v2.js'):root.OYCIESemanticV2;
const VERSION='1.0.0-20261026';
const TYPES=[
 {id:'observe',name:'관찰·예방형',rule:'CORE observedLevel=0: 2점 이상 문항 없음',meaning:'이번 응답에서는 어려움이 없거나 가볍게 보고된 항목이 중심입니다. 현재 도움이 되는 관계와 활동을 유지하면서 학생이 느끼는 불편과 변화 희망을 확인하는 접근이 적절합니다. 낮은 합계가 안전이나 지원 불필요를 증명하지는 않습니다.',action:'학생이 편하게 도움을 요청할 사람과 방법을 확인하고, 학생과 다음 확인 시점을 정합니다.',check:'학생이 말한 불편의 변화, 도움 요청 경로의 실제 이용 가능성'},
 {id:'focused',name:'개별영역 지원형',rule:'CORE observedLevel=1: 2점 이상 응답이 있고 중요영역 2개 미만',meaning:'일부 문항에서 반복되는 어려움이나 도움이 필요한 수준으로 응답했습니다. 전체 합계보다 해당 문항의 상황·기간·생활 영향을 구체적으로 확인하는 것이 중요합니다. 한 영역 안에서도 서로 다른 어려움이 있을 수 있으므로 학생이 먼저 바꾸고 싶은 일을 중심으로 지원을 조정합니다.',action:'해당 문항의 구체적 장면과 기존 도움의 효과를 확인하고, 우선과제 1~2개를 학생과 협의합니다.',check:'해당 생활 장면의 어려움, 지원 전후 참여·휴식·생활 유지 변화'},
 {id:'combined',name:'복합욕구 조정형',rule:'CORE observedLevel=2: 중요영역 2개 이상이며 집중검토형 조건 미충족',meaning:'두 개 이상의 생활영역에서 함께 살펴볼 어려움이 확인된 응답입니다. 영역마다 별도 서비스를 늘리기 전에 무엇이 먼저 해결되어야 다른 지원을 이용할 수 있는지 확인해야 합니다. 함께 나타난 점수만으로 한 어려움이 다른 어려움의 원인이라고 결론 내리지는 않습니다.',action:'학교·복지 담당자가 기존 지원과 미충족 필요를 함께 정리하고, 학생의 우선순위에 맞춰 담당과 순서를 협의합니다.',check:'우선과제 간 연결, 중복·누락 지원, 의뢰 후 실제 이용 여부와 학생의 부담'},
 {id:'intensive',name:'다기관 집중검토형',rule:'CORE observedLevel=3: 중요영역 3개 이상 및 3~4점 문항 3개 이상',meaning:'여러 영역의 어려움과 높은 개별 응답이 동시에 나타났습니다. 한 담당자의 개별 지원만으로 충분한지 공동으로 살펴볼 필요가 있습니다. 학생의 부담을 줄이도록 연락 창구를 정리하고, 안전·기본생활·학교 참여 중 현재 가장 시급한 과제를 우선 협의합니다. 이 유형은 진단이나 서비스 선정 결과가 아닙니다.',action:'관련 담당자가 공동사정을 검토하고, 즉시 확인할 과제와 지속 지원할 과제를 구분해 주관·협력 담당을 정합니다.',check:'현재 안전, 기본생활 유지, 지원 공백, 담당 간 조정과 학생이 경험한 변화'}
];
const DOMAINS=[
 ['보호자의 위해 가능성과 필요한 보호의 제공 여부를 구분해 살펴봅니다. 가족 형편이나 갈등만으로 학대·방임을 확정하지 않습니다.','안전한 접촉·보호 환경과 사실 확인 경로'],
 ['또래 피해, 강요·협박, 타인에게 피해를 준 행동을 각각 구분합니다. 같은 사건이라도 학생별 보호 필요와 행동 지원은 다를 수 있습니다.','현재 접촉 위험, 안전한 학교 참여와 도움 요청 경로'],
 ['마음의 고통, 자해 관련 안전신호, 평소와 달라진 수면·활동을 구분합니다. 정서 점수만으로 진단을 추정하지 않습니다.','현재 안전과 일상 유지, 편하게 도움을 구할 사람'],
 ['출결·수업 참여, 학습 이해, 학교 소속감은 서로 다른 지원과제입니다. 결석만으로 학습능력이나 의지를 판단하지 않습니다.','참여가 어려운 시간·과목·상황과 가능한 수업 조정'],
 ['위험행동의 전후 상황과 실제 다칠 위험, 물질 사용에 따른 건강 영향을 확인합니다. 행동의 이름만으로 긴급도를 정하지 않습니다.','현재 위해 여부와 행동이 발생한 맥락'],
 ['학생의 특성보다 필요한 설명 방식·환경 조정·서비스가 제공되는지 살펴봅니다. 응답으로 장애나 발달 진단을 만들지 않습니다.','제공된 편의의 적합성과 서비스를 막는 장벽'],
 ['돌봄을 받지 못하는 상황, 가족관계의 영향, 학생이 가족을 돌보는 부담을 구분합니다. 학생에게 성인의 역할을 일괄 맡기지 않도록 대체 도움을 살펴봅니다.','실제 돌봄 시간표, 공백과 학생의 휴식·학습 시간'],
 ['필수 물품·식량 부족, 주거환경, 지원 이용 비용을 따로 확인합니다. 주거 점수만으로 체납이나 퇴거를 사실로 쓰지 않습니다.','현재 부족한 자원과 이용을 막는 비용·환경'],
 ['원하는 활동에 참여하기 어려운지, 믿고 도움을 청할 사람이 실제로 있는지 확인합니다. 혼자 있기를 선호하는 성향과 고립을 구분합니다.','학생이 원하는 참여 방식과 실제 연결 가능한 지지자'],
 ['디지털 이용에 따른 일상 영향과 온라인 성적 요구·유포 위협을 구분합니다. 이용 시간만으로 문제를 확정하거나 피해 책임을 학생에게 돌리지 않습니다.','수면·수업 영향 및 현재 접촉·피해 보호 필요']
];
const SOURCES=['criteria.js · CORE 원점수·안전판정·observedLevel','scale-interpretation-v821.js · 25문항 개념·경계·10영역','cie-semantic-layer-v2.js · 문항 점수 의미·동시응답 가설'];
function build(p){
 if(!p||!Array.isArray(p.answers))throw Error('REPORT_INPUT_INVALID');
 const values=p.answers.slice();
 const c=C.evaluate(values,S.DOMAIN_SIZES,!!(p.explicit||[]).length,p.followups||{}),s=S.assess({answers:values}),e=E.interpret(values);
 const baseType=TYPES[c.observedLevel];
 const type=c.knownCount===0?{id:'unknown',name:'정보확인형',rule:'25문항 모두 미상',meaning:'현재 척도에서 확인된 점수가 없어 학생의 어려움 정도나 지원 유형을 해석할 수 없습니다. 안전문항의 현재 상황부터 확인하고 나머지 정보를 학생의 부담을 줄이는 방식으로 보완합니다.',action:'현재 안전과 확인 가능한 정보원·담당·시점을 정합니다.',check:'안전 확인 상태와 미상 문항의 확인 경과'}:baseType;
 const status=c.urgent?'안전확인 우선':c.safetyUnknown.length||c.pendingChecks.length?'안전확인 미완료':c.incomplete?'정보확인 중':'응답 기반 유형';
 const title=c.provisional?status+' · 전체 유형 확정 보류':c.urgent?status+' · '+type.name:type.name;
 const summary=c.incomplete?'확인된 '+c.knownCount+'문항의 합계는 '+c.knownTotal+'점입니다. 미상 '+c.unknownItems.length+'문항이 있어 전체 합계와 유형을 확정하지 않습니다. 확인된 응답에서 '+type.name+'에 해당하는 지원 단서를 검토하되, 이를 전체 결과로 일반화하지 않습니다.':'25문항 원점수는 '+c.knownTotal+'/100점이며, 문항 강도와 영역 분포를 함께 읽으면 '+type.name+'에 해당합니다.'+(c.pendingChecks.length?' 현재 안전 추가확인이 남아 있어 전체 유형 확정은 보류합니다.':'');
 const rows=s.domains.map((d,i)=>{
  const items=s.items.filter(x=>x.domain===i),active=items.filter(x=>typeof x.value==='number'&&x.value>0),peak=Math.max(0,...active.map(x=>x.value));
  const band=d.missing?'영역 판단 보류':peak>=3?'생활 영향 우선 확인':peak===2?'개별 도움 필요 확인':peak===1?'가벼운 응답의 맥락 확인':'보고된 어려움 없음';
  return {id:i,name:d.name,band,sum:d.knownSum,max:d.fullMax,unknown:d.missing,evidence:items.map(x=>x.number+'번 '+(x.missing?'미상':x.value+'점')).join(' · '),meaning:(d.missing?'미상 문항은 어려움 없음으로 해석하지 않습니다. 확인된 문항만 다음 사정에 활용합니다. ':active.length?'해당 영역에 어려움을 보고한 응답이 있습니다. ':'이번 응답에서 해당 어려움은 보고되지 않았습니다. 실제 지원 필요는 면담으로 확인합니다. ')+DOMAINS[i][0],focus:DOMAINS[i][1],items:active.map(x=>({number:x.number,score:x.value,concept:x.concept,meaning:E.interpretItemScore(x.number,x.value).meaning,question:x.question,boundary:x.boundary}))};
 });
 const priority=rows.filter(d=>d.items.length).sort((a,b)=>Number(b.items.some(x=>c.safetyItems.includes(x.number)))-Number(a.items.some(x=>c.safetyItems.includes(x.number)))||Math.max(...b.items.map(x=>x.score))-Math.max(...a.items.map(x=>x.score))||a.id-b.id).slice(0,3);
 return {version:VERSION,title,status,type,summary,core:c,rows,priority,cross:e.links.map(x=>({items:[x.a,x.b],meaning:x.meaning,question:x.question})),sources:SOURCES,limits:'규칙 기반 공통 해석·실무자 검토 전 초안입니다. 유형은 검증된 위험등급·진단·발생확률이 아니며, 동시응답은 인과관계를 입증하지 않습니다. 학생의 강점·희망·기존 지원과 실제 사실은 별도로 확인합니다.'};
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(r){
 const para=(label,value)=>'<p><strong>'+esc(label)+'</strong> '+esc(value)+'</p>';
 const domain=d=>'<section class="csr-domain"><h4>'+esc(d.name)+' · '+esc(d.band)+'</h4><p class="csr-evidence">응답 근거: '+esc(d.evidence)+' / '+(d.unknown?'확인 합계 ':'영역 합계 ')+d.sum+'/'+d.max+'점</p><p>'+esc(d.meaning)+'</p>'+para('추가 사정',d.focus)+(d.items.length?'<details><summary>문항별 점수 의미와 확인 질문</summary>'+d.items.map(x=>para(x.number+'번 '+x.score+'점 · '+x.concept,x.meaning)+para('확인 질문',x.question)+para('구분할 점',x.boundary)).join('')+'</details>':'')+'</section>';
 return '<article class="common-scale-report" data-report-version="'+VERSION+'"><header><span>OY-RALS · 척도 유형별 해석보고서</span><h2>'+esc(r.title)+'</h2><p>응답 근거 → 공통 해석 → 추가 사정 → 지원·점검 제안</p></header><section><h3>1. 결과 요약과 현재 안전</h3><p>'+esc(r.summary)+'</p>'+para('CORE 판단',r.core.title)+para('현재 안전',r.core.safetyReview)+(r.core.unknownItems.length?para('미상 문항',r.core.unknownItems.join('·')+'번'): '')+(r.core.pendingChecks.length?para('안전 추가확인',r.core.pendingChecks.join('·')+'번 · 확인 전 안전하다고 판단하지 않습니다.'): '')+'</section><section><h3>2. 유형별 공통 해석</h3>'+((r.core.urgent||r.core.safetyUnknown.length||r.core.pendingChecks.length)?'<p><strong>우선 적용:</strong> 현재 안전과 보호 필요의 직접 확인이 먼저입니다. 아래 생활지원 유형은 안전 판단을 낮추거나 보호절차를 보류하는 근거로 사용하지 않습니다.</p>':'')+'<p>'+esc(r.type.meaning)+'</p>'+para('적용 근거',r.type.rule)+(r.core.provisional?'<p>위 문단은 확인된 응답에 한정한 잠정 지원 방향입니다. 전체 유형의 확정 설명으로 사용하지 않습니다.</p>':'')+'</section><section><h3>3. 먼저 살펴볼 영역</h3>'+(r.priority.length?r.priority.map(domain).join(''):'<p>양성 응답으로 특정된 우선영역은 없습니다. 미상 항목과 학생이 원하는 도움을 먼저 확인합니다.</p>')+'<details><summary>10개 영역 전체 해석</summary>'+r.rows.map(domain).join('')+'</details></section><section><h3>4. 함께 나타난 응답의 의미</h3><p>아래 내용은 추가 사정을 위한 가설입니다. 서로 영향을 주었는지, 같은 사건인지, 별개 상황인지 확인해야 합니다.</p>'+(r.cross.length?r.cross.map(x=>para(x.items.map(n=>n+'번').join('·'),x.meaning)+para('확인 질문',x.question)).join(''):'<p>기존 OY-CIE의 동시응답 규칙에 해당하는 조합은 없습니다. 이것이 어려움 사이의 관계가 없다는 뜻은 아닙니다.</p>')+'</section><section><h3>5. 지원 방향과 점검 제안</h3>'+para('공통 지원',r.type.action)+para('점검할 변화',r.type.check)+para('교사', '학생의 안전한 면담과 수업·출결 조정을 검토하고, 교내 상담·복지 담당자와 확인할 내용을 협의합니다.')+para('사회복지사','학생·가족의 욕구, 강점, 기존 지원과 이용 장벽을 사정하고 자원 문의·의뢰·실제 이용을 구분해 조정합니다.')+'<p>위 제안은 합의 전입니다. 학생 의견, 목표 기준선·목표값·담당자·점검일과 실제 서비스 제공은 확인 후 기록합니다. 안전신호가 있으면 위 일반 지원보다 현재 안전확인을 우선합니다.</p></section><footer><h3>6. 근거와 해석 한계</h3><p>'+esc(r.sources.join(' / '))+'</p><p>'+esc(r.limits)+'</p><a href="common-scale-report-guide.md" download>유형별 해석 기준 문서 내려받기</a></footer></article>';
}
function text(r){return ['척도 유형별 해석보고서 · '+r.title,r.summary,'CORE: '+r.core.title,r.core.safetyReview,'공통 해석: '+r.type.meaning,'적용 규칙: '+r.type.rule,...r.rows.map(d=>d.name+' ['+d.band+']\n'+d.evidence+'\n'+d.meaning+'\n추가 사정: '+d.focus),...r.cross.map(x=>x.items.join('·')+'번: '+x.meaning+' / 확인: '+x.question),'지원 제안: '+r.type.action,'점검: '+r.type.check,'학생 합의·기준선·담당·점검일·서비스 제공: 미확인',r.sources.join('\n'),r.limits].join('\n\n');}
const api=Object.freeze({VERSION,TYPES,DOMAINS,SOURCES,build,html,text});if(node)module.exports=api;else root.OYCommonScaleReport=api;
})(typeof window!=='undefined'?window:globalThis);
