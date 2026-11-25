(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const G=node?require('./model-gateway-v90.js'):root.OYModelGateway;
const S=node?require('./cie-semantic-layer-v2.js'):root.OYCIESemanticV2;
const M=node?require('./support-model.js'):root.YouthMap;
const VERSION='0.2.0-evidence-review-20261026';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function build(payload,options={}){
 if(!M.validate(payload))throw Error('REPORT_INPUT_INVALID');
 const p=JSON.parse(JSON.stringify(payload)),includeNarrative=options.includeNarrative===true;
 if(!includeNarrative)p.caseContext='';
 const a=G.analyze(p),semantic=S.formulate(p.answers);
 const rows=a.domains.map(d=>{
 const items=d.numbers.map((n,i)=>({number:n,value:d.values[i],label:p.domains[d.i].items[i],...S.interpretItemScore(n,d.values[i])}));
 const focus=items.filter(x=>x.score==='unknown'||x.score>0);
 return {id:d.i,name:d.name,known:d.known,unknown:d.unknown,sum:d.sum,max:d.numbers.length*4,
 evidence:items.map(x=>x.number+'번 '+(x.score==='unknown'?'미상':x.score+'점')).join(' · '),items,
 interpretation:d.unknown?'확인된 응답은 지원에 활용하되 영역 전체의 정도는 보류합니다.':d.peak>=3?'큰 어려움으로 응답한 문항의 실제 생활 영향을 먼저 확인할 필요가 있습니다.':d.sum?'보고된 어려움의 맥락과 학생이 원하는 도움을 함께 확인합니다.':'이번 응답에서 어려움은 보고되지 않았습니다. 지원 불필요나 안전확보의 증거는 아닙니다.',
 alternative:'발생 시점·응답 맥락·환경·접근 장벽 차이일 수 있습니다. 점수만으로 원인·진단·발생 사실은 확정하지 않습니다.',
 questions:[...new Set(focus.flatMap(x=>Array.isArray(x.questions)?x.questions:[x.questions]).filter(Boolean))].slice(0,3)};
 });
 const safety=[...new Set([...a.decision.safetyItems,...a.decision.safetyUnknown,...a.decision.pendingChecks])].sort((x,y)=>x-y);
 const priorities=[
 ...(a.decision.urgent||safety.length?[{type:'안전 확인',items:safety,action:a.decision.title+' · '+a.decision.safetyReview}]:[]),
 ...(a.decision.unknownItems.length?[{type:'미상 확인',items:a.decision.unknownItems,action:'안전한 방식으로 확인합니다. 미상을 0점으로 바꾸거나 미상만으로 서비스 의뢰를 확정하지 않습니다.'}]:[]),
 ...a.plans.map(g=>({type:g.narrativeOnly?'서술 근거 검토':'생활지원 검토',items:rows[g.domain]?.items.filter(x=>typeof x.score==='number'&&x.score>0).map(x=>x.number)||[],action:g.title+' · '+g.action}))];
 return {version:VERSION,includeNarrative,decision:a.decision,rows,semantic,context:a.context,kCarr:a.kCarr,plans:a.plans,priorities,
 completeness:{known:a.decision.knownCount,unknown:a.decision.unknownItems.length,lower:a.decision.knownTotal,upper:a.decision.knownTotal+a.decision.unknownItems.length*4},
 trace:a.modelTrace.contracts.filter(x=>['CORE','ICSI','NCB','OY-CIE','K-CARR'].includes(x.id)),
 limits:'규칙 기반 검토 초안 · 실증 타당도·발생확률·진단·인과관계·실제 서비스 이용을 의미하지 않습니다.'};
}
function render(r){
 const list=(title,items)=>'<section><h2>'+esc(title)+'</h2>'+items.map(x=>'<p>'+esc(x)+'</p>').join('')+'</section>';
 const c=r.completeness;
 return '<article class="deep-report"><header class="deep-report-header"><p class="deep-eyebrow">OY-RALS / 심층 해석보고서 '+esc(r.version)+'</p><h1>응답의 근거에서<br>지원의 다음 단계까지</h1><p>'+esc(r.limits)+'</p></header>'+
 '<div class="deep-summary"><div><b>'+c.known+'<small>/25문항</small></b><span>확인된 응답</span></div><div><b>'+c.unknown+'<small>문항</small></b><span>미상 · 확인 필요</span></div><div><b>'+c.lower+(c.unknown?'–'+c.upper:'')+'<small>/100점</small></b><span>'+(c.unknown?'가능한 원점수 범위':'CORE 원점수')+'</span></div></div>'+
 list('1. 안전과 우선 확인',[r.decision.title,r.decision.safetyReview,c.unknown?'전체 수준 보류 · 가능한 점수 범위는 확률이나 예상점수가 아닙니다.':'추가 안전확인·보류 여부는 위 CORE 판정을 따릅니다.'])+
 '<section><h2>2. 다음 행동 · 협의 전 제안</h2>'+(r.priorities.length?r.priorities.map(t=>'<div class="deep-task"><strong>'+esc(t.type)+'</strong><p>'+esc(t.action)+'</p><small>근거 문항: '+esc(t.items.join(' · ')||'명시적 현재 안전정보 또는 별도 서술 · 확인 필요')+'</small></div>').join(''):'<p>자동 의뢰 과제 없음 · 학생이 원하는 변화와 이미 도움이 되는 사람·활동을 확인하세요.</p>')+'</section>'+
 '<section><h2>3. 10개 영역의 근거와 해석</h2><p>파랑은 확인 합계, 빗금은 미상으로 추가 가능한 점수입니다. 영역별 만점이 다르며 백분위·발생확률이 아닙니다.</p>'+r.rows.map(d=>'<section class="deep-domain"><h3>'+esc(d.name)+'</h3><div class="deep-bar" role="img" aria-label="'+esc(d.name+' 확인 '+d.sum+'점, 미상 '+d.unknown+'개, 만점 '+d.max)+'"><span style="width:'+100*d.sum/d.max+'%"></span><i style="width:'+100*d.unknown*4/d.max+'%"></i></div><p class="deep-meta">'+esc(d.evidence)+' · 만점 '+d.max+'점</p><p><strong>잠정 해석</strong> '+esc(d.interpretation)+'</p><p><strong>다른 가능성</strong> '+esc(d.alternative)+'</p>'+d.questions.map(q=>'<p class="deep-question">확인 질문 · '+esc(q)+'</p>').join('')+'<details><summary>문항별 응답·해석·행동 확인</summary>'+d.items.map(x=>'<div class="deep-item"><h4>'+x.number+'번 · '+esc(x.label)+'</h4><p>'+esc(x.score==='unknown'?'미상':x.score+'점')+' / '+esc(x.topic)+'</p><p>'+esc(x.interpretation)+'</p><p>다음 행동: '+esc(x.action)+'</p><small>'+esc(x.caution)+'</small></div>').join('')+'</details></section>').join('')+'</section>'+
 list('4. OY-CIE·ICSI 교차 가설',r.semantic.narratives)+
 list('5. NCB·K-CARR 맥락 검토',r.includeNarrative?[r.context?.needsSafetyAttention?'서술 안전단서 있음 · 점수와 별도로 현재 안전 직접 확인':'서술 단서 부재를 안전확보로 해석하지 않습니다.',...(r.context?.mismatches||[]).map(x=>x.issue),r.kCarr?.situationOverview||'서술형 자료 없음 또는 분석 보류',r.kCarr?.integratedJudgment||'학생 희망·강점·실제 지원은 별도 확인']:['서술 분석 미포함 · 이번 보고서는 문항 응답만 사용했습니다. 서술 분석을 포함하려면 생성 옵션을 선택하세요.'])+
 '<section><h2>6. 지역자원·개입·점검 검토안</h2>'+(r.plans.length?r.plans.map((g,i)=>'<section class="deep-plan"><h3>G'+(i+1)+' '+esc(g.title)+'</h3><p>문항 근거: '+esc((g.evidence||[]).join(' · ')||'서술 단서 · 사실 확인 필요')+'</p><p>'+esc(g.action)+'</p><p>점검 지표 제안: '+esc(g.outcome)+'</p><ul>'+(g.candidates||[]).map(x=>'<li><strong>'+esc(x.name)+'</strong> · '+esc(x.service)+'<br><small>'+esc(x.condition||'관할·자격·접수 확인 필요')+' / 최신 운영 미확인 · 연계 후보</small></li>').join('')+'</ul>'+(!(g.candidates||[]).length?'<p>연결된 후보 없음 · 관할 기관과 지원 경로 추가 확인</p>':'')+'<p>학생 합의 · 기준선 · 목표값 · 담당 · 기한 · 실제 이용: 미확인</p></section>').join(''):'<p>자동 생성된 서비스계획 없음 · 미상 확인 및 학생 욕구 면담을 우선합니다.</p>')+'</section>'+
 list('7. 출처와 검증 한계',r.trace.map(t=>t.id+' / '+t.module+'.'+t.method+' / '+(t.loaded?'모듈 연결됨':'미연결')+' / '+(t.version||'버전 미표시')).concat(['모듈 연결은 해당 사례의 분석 성공 또는 모델 타당도 검증을 뜻하지 않습니다.','ICSI와 OY-CIE는 동일 구현을 공유하므로 독립된 검증 근거가 아닙니다.','IPC 최종 결과지 미열람 · 구성 복제나 검사 타당도 이전을 주장하지 않습니다.','Gurtman (2009), DOI 10.1111/j.1751-9004.2009.00172.x: 대인관계 구조 개념 참고, OY-RALS 검증 근거 아님.','NICE NG225 §1.6: 미래 자살·자해 예측 또는 치료·종결 결정을 척도로 하지 않음.']))+'<footer>실무자 검토 초안 · 사실·학생 의견·출처·시점·실제 이행은 별도 확인</footer></article>';
}
const api=Object.freeze({VERSION,build,render});if(node)module.exports=api;else root.OYDeepReport=api;
})(typeof window!=='undefined'?window:globalThis);
