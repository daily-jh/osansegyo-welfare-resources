/* OY-RALS five-stage visual narrative — evidence-bound, static, accessible.
   Charts are derived only from existing OYModelGateway and OYSupportIndexV1.
   No hidden data collection and no mutation of official scores or case records. */
(function(){'use strict';
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:1});
const panel=document.createElement('section');
panel.id='oy-stage-visuals';panel.className='oy-stage-visuals';panel.hidden=true;
panel.setAttribute('aria-label','OY-RALS 단계별 통합 지원정보 시각화');
const after=$('journey88');
if(!after)return;
after.before(panel);
let current=null,revision=null,latest=null,history=[];
function data(p){
 const gateway=window.OYModelGateway;
 const analysis=gateway?.analyze(p);
 if(!analysis)throw Error('사례분석 모델 연결 없음');
 const priority=window.OYSupportIndexV1?.score(p,{official:analysis.decision,context:analysis.context});
 if(!priority)throw Error('5단계 지표 연결 없음');
 return {analysis,priority};
}
function pill(label,v){return '<div class="oyv-stat"><small>'+esc(label)+'</small><strong>'+esc(v)+'</strong></div>';}
function header(k,title,caption){
 return '<header class="oyv-head"><span class="oyv-kicker">STEP '+esc(k)+' · OY-RALS VISUAL EVIDENCE</span><h2>'+esc(title)+'</h2><p>'+esc(caption)+'</p></header>';
}
function priorityBar(p){
 return '<div class="oyv-priority"><div class="oyv-priority-head"><div><small>5단계 통합지원 지표 · 시스템 분류</small><h3>'+p.grade+'단계 · '+esc(p.label)+'</h3><p>'+esc(p.action)+'</p></div><div class="oyv-index">'+fmt(p.finalIndex)+'<small> / 100</small></div></div>'+
 '<div class="oyv-steps" role="img" aria-label="지원우선순위 5단계 중 '+p.grade+'단계 '+esc(p.label)+'">'+window.OYSupportIndexV1.STEPS.map((s,i)=>'<div class="oyv-step'+(p.grade===i+1?' selected':'')+'"><b>'+(i+1)+'</b><span>'+esc(s.name)+'</span></div>').join('')+'</div>'+
 '<p class="oyv-indicator-note">'+esc(p.evidenceNote)+' · 단계 결정요인: '+esc(p.explanation)+(p.safetyFloor>1?' · 안전 우선규칙 '+p.safetyFloor+'단계 적용':'')+'</p></div>';
}
function radar(domains){
 const cx=200,cy=178,r=120;
 const vertex=(i,strength)=>{const t=-Math.PI/2+i*Math.PI/5;return [Math.round((cx+Math.cos(t)*r*strength)*10)/10,Math.round((cy+Math.sin(t)*r*strength)*10)/10];};
 const short=['보호','또래','정서','학습','건강','접근','돌봄','생활','지지','온라인'];
 const webs=[.25,.5,.75,1].map(t=>'<polygon points="'+Array.from({length:10},(_,i)=>vertex(i,t).join(',')).join(' ')+'" fill="none" stroke="#c9d8e7" stroke-width="1"/>').join('');
 const spokes=domains.map((_,i)=>'<line x1="'+cx+'" y1="'+cy+'" x2="'+vertex(i,1)[0]+'" y2="'+vertex(i,1)[1]+'" stroke="#d6e2ed"/>').join('');
 const labels=domains.map((d,i)=>{const v=vertex(i,1.2);return '<text x="'+v[0]+'" y="'+v[1]+'" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#33526d">'+short[i]+'</text>';}).join('');
 const polygon=domains.map((d,i)=>vertex(i,d.strength/100).join(',')).join(' ');
 return '<svg class="oyv-radar" viewBox="0 0 400 360" role="img" aria-label="10개 영역의 원점수 비율 레이더 그래프"><title>영역별 응답 점수 레이더 차트</title>'+webs+spokes+'<polygon points="'+polygon+'" fill="rgba(35,105,188,.20)" stroke="#2369bc" stroke-width="3"/>'+labels+'</svg>';
}
function domainBars(p){
 return '<div class="oyv-domain-bars">'+p.domains.map(d=>'<div class="oyv-domain-row"><div class="oyv-domain-title"><strong>'+esc(d.name)+'</strong><span>'+d.raw+'/'+d.maximum+'점 · 가중치 ×'+d.weight.toFixed(2)+'</span></div><div class="oyv-track"><i style="width:'+d.strength+'%"></i></div>'+(d.unknown?'<small>미상 '+d.unknown+'개</small>':'')+'</div>').join('')+'</div>';
}
function crossMatrix(p){
 let names=['보호','또래','정서','학습','건강','접근','돌봄','생활','지지','디지털'];
 let indexed=new Map();
 p.crossPairs.forEach(x=>{indexed.set(x.a+','+x.b,x);indexed.set(x.b+','+x.a,x)});
 return '<div class="oyv-scroll"><table class="oyv-matrix"><caption>영역별 교차 지원위기 매트릭스 · 지정된 교차규칙 6개에 한해 표시</caption><thead><tr><th scope="col">영역</th>'+names.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+names.map((x,i)=>'<tr><th scope="row">'+x+'</th>'+names.map((_,j)=>{const v=indexed.get(i+','+j);return '<td>'+(v?'<span class="oyv-heat heat-'+Math.min(4,Math.ceil(v.strength/25))+'" title="'+esc(v.label)+'" aria-label="'+esc(v.label)+' 동시보고 강도 '+fmt(v.strength)+'">'+fmt(v.strength)+'</span>':'<span class="oyv-dash" aria-label="교차규칙 없음">—</span>')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
}
function heatmap(p){
 let k=0;
 return '<div class="oyv-item-grid" role="group" aria-label="25개 문항의 0~4점 분포">'+p.domains.flatMap(d=>d.items.map(v=>{const i=++k;return '<div class="oyv-item heat-'+(v==='unknown'?'unknown':v)+'" title="'+esc(d.name)+' / '+i+'번 / '+(v==='unknown'?'미상':v+'점')+'"><b>Q'+i+'</b><span>'+(v==='unknown'?'미상':v+'점')+'</span></div>';})).join('')+'</div>';
}
function scoreView(a,p){
 return header('01','청소년 통합지원 단계','원점수·영역 가중치·복합영역·핵심문항을 한 화면에 분리해 보여줍니다.')+
 priorityBar(p)+
 '<div class="oyv-stats">'+pill('CORE 원점수',p.official.rawKnown+' / 100')+pill('가중점수',fmt(p.parts.weighted))+
 pill('교차영역 지수',fmt(p.parts.cross))+pill('핵심문항 지수',fmt(p.parts.critical))+
 pill('긍정 교차패턴',p.crossPairs.filter(x=>x.active).length+' / '+p.crossPairs.length)+'</div>'+
 '<div class="oyv-two"><article class="oyv-card"><h3>영역별 분포</h3>'+radar(p.domains)+'</article>'+
 '<article class="oyv-card"><h3>10개 영역 점수와 가중치</h3>'+domainBars(p)+'</article></div>'+
 '<article class="oyv-card"><h3>영역별 교차 결과</h3>'+crossMatrix(p)+'</article>'+
 '<article class="oyv-card"><h3>25문항 위험 신호 히트맵</h3>'+heatmap(p)+'</article>'+
 '<details class="oyv-spec"><summary>지표 구성 · 계산 근거</summary><table><tbody>'+
 [['CORE 원점수',fmt(p.parts.raw)+' × 40%'],['가중점수',fmt(p.parts.weighted)+' × 25%'],['교차지수',fmt(p.parts.cross)+' × 20%'],['핵심문항',fmt(p.parts.critical)+' × 10%'],['서술 맥락',p.parts.narrative===null?'미입력 · 비중 재정규화':fmt(p.parts.narrative)+' × 5%']].map(x=>'<tr><th>'+x[0]+'</th><td>'+x[1]+'</td></tr>').join('')+
 '</tbody></table><p>'+esc(p.assumptions)+'</p></details>';
}
function narrativeView(a,p){
 const fields=Object.entries(a.context.fields||{}).filter(x=>typeof x[1]==='string'&&x[1].trim());
 const cues=a.context.signals||[];
 return header('01','서술 맥락 해석 · 근거 구조','점수 계산과 별도로 NCB·K-CARR의 서술 단서를 분류합니다.')+
 '<div class="oyv-stats">'+pill('서술 단서',cues.length+'건')+pill('점수-서술 대조',a.context.mismatches?.length||0)+pill('분석 연계','NCB → K-CARR')+'</div>'+
 '<div class="oyv-path"><div>기록 입력</div><span>→</span><div>NCB 문맥·시점 분석</div><span>→</span><div>K-CARR 사례해석</div><span>→</span><div>종합의견</div></div>'+
 '<article class="oyv-card"><h3>서술기록의 구조화 결과</h3>'+
 (fields.length?'<div class="oyv-scroll"><table><thead><tr><th>구분</th><th>기록된 내용</th></tr></thead><tbody>'+fields.map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+esc(v.slice(0,280))+'</td></tr>').join('')+'</tbody></table></div>':'<p>서술 입력 없음 · 척도 결과는 독립적으로 제공</p>')+'</article>'+
 '<p class="oyv-footer-note">보조 분석은 원점수를 변경하지 않습니다. '+esc(p.grade+'단계 '+p.label)+'은 입력된 평가정보에 대한 내부 지원우선순위 분류입니다.</p>';
}
function integratedView(a,p){
 return header('01','종합의견 · 지원방향','CORE와 서술 맥락, 교차영역의 근거를 모아 한 가지 실행 방향으로 제시합니다.')+
 priorityBar(p)+
 '<div class="oyv-two"><article class="oyv-card"><h3>핵심 지원영역 TOP 3</h3>'+
 (p.topDomains.length?domainBars({...p,domains:p.topDomains}):'<p>높게 응답한 영역 없음</p>')+'</article>'+
 '<article class="oyv-card"><h3>영역 간 연쇄 구조</h3><div class="oyv-path"><div>주요 위기징후</div><span>→</span><div>'+esc(p.topDomains[0]?.name||'일상 관찰')+'</div><span>→</span><div>'+esc(p.label)+'</div><span>→</span><div>'+esc(p.action)+'</div></div></article></div>'+
 '<article class="oyv-card"><h3>동시 보고된 교차영역</h3><div class="oyv-chips">'+(p.crossPairs.filter(x=>x.active).map(x=>'<span>'+esc(x.label)+' · '+fmt(x.strength)+'</span>').join('')||'<p>등록된 교차규칙과 일치한 응답 없음</p>')+'</div></article>';
}
function mapView(a,p){
 const rows=a.plans.slice(0,5).flatMap(x=>(x.candidates||[]).slice(0,2).map(c=>[x.title,c.name,c.service||'지원 항목',x.evidence.join('·')||'서술 근거']));
 const clean=rows.filter((r,i)=>rows.findIndex(y=>y[1]===r[1]&&y[2]===r[2])===i);
 return header('02','지역자원 · 지원연계 전략','기존 지원연계 지도의 기관·서비스 데이터를 그대로 활용하면서 추천 우선순위를 시각화합니다.')+
 priorityBar(p)+
 '<div class="oyv-path"><div>학교 내 지원</div><span>→</span><div>행정·복지자원</div><span>→</span><div>전문상담·의료</div><span>→</span><div>사례관리 조정</div></div>'+
 '<article class="oyv-card"><h3>개입과제별 연계 후보</h3><div class="oyv-scroll"><table><thead><tr><th>지원과제</th><th>연계기관</th><th>서비스</th><th>근거</th></tr></thead><tbody>'+
 (clean.length?clean.map(x=>'<tr>'+x.map(z=>'<td>'+esc(z)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="4">이 응답에서 자동 매칭된 기관은 없습니다. 아래 지원연계 지도에서 전체 자원을 조회할 수 있습니다.</td></tr>')+
 '</tbody></table></div><p>기관 정보는 등록된 자원 DB 기준입니다. 실제 접수·이용 상태와는 구분됩니다.</p></article>';
}
function caseView(a,p){
 const rows=a.plans.slice(0,6);
 return header('03','사례 톺아보기 · 개입 구조','우선순위 → 지원목표 → 담당 협의 → 점검·재사정으로 이어지는 진행 모델입니다.')+
 '<div class="oyv-path"><div>척도·서술 종합</div><span>→</span><div>사정·판정</div><span>→</span><div>지원목표 합의</div><span>→</span><div>개입·연계</div><span>→</span><div>재사정·점검</div></div>'+
 '<div class="oyv-stats">'+pill('지원단계',p.grade+'단계 · '+p.label)+pill('추천 계획과제',a.plans.length+'건')+pill('우선 사정영역',p.topDomains.length+'개')+'</div>'+
 '<article class="oyv-card"><h3>사례개입 실행 매트릭스</h3><div class="oyv-scroll"><table><thead><tr><th>과제</th><th>근거</th><th>추천 실행</th><th>변화 기준</th></tr></thead><tbody>'+
 (rows.length?rows.map(x=>'<tr>'+[x.title,x.evidence.join('·')||'서술 사정',x.action,x.outcome].map(z=>'<td>'+esc(z)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="4">이번 응답에서 개별 서비스계획 자동추천에 해당하는 문항이 없습니다.</td></tr>')+
 '</tbody></table></div></article>'+
 '<article class="oyv-card"><h3>운영 주기</h3><div class="oyv-steps is-flow"><div class="oyv-step">즉시<br>안전·초기대응</div><div class="oyv-step">1~2주<br>단기 목표</div><div class="oyv-step">1~3개월<br>개입 조정</div><div class="oyv-step">점검<br>재사정</div><div class="oyv-step">종결<br>사후관리</div></div></article>';
}
function aiView(a,p){
 const statuses=window.OYModelGateway?.status?.()||[];
 return header('04','AI 연구 작업실 · 근거연결','척도·서술·사례사정·실행계획을 질문 의도에 따라 OY-CIE와 연결합니다.')+
 '<div class="oyv-path"><div>CORE · 점수</div><span>+</span><div>NCB · 서술</div><span>+</span><div>K-CARR · 사정</div><span>→</span><div>OY-CIE 질문</div><span>→</span><div>근거·실행안</div></div>'+
 '<article class="oyv-card"><h3>모델 기능 연결상태</h3><div class="oyv-models">'+statuses.map(x=>'<span><b>'+esc(x.id)+'</b><small>'+(x.loaded?'연결':'미연결')+'</small></span>').join('')+'</div></article>'+
 '<p class="oyv-footer-note">이 단계의 OY-CIE는 규칙·지식검색 기반 한국어 연구응답 모델입니다. 입력자료에서 확인 가능한 근거와 서비스 추천안을 결합합니다.</p>';
}
function recordsView(a,p){
 const snapshot=window.OYJourneyUI?.exportSnapshot?.()||{};
 const draft=Object.values(snapshot.drafts||{}).filter(x=>typeof x==='string'&&x.trim()).length;
 const trend=history.slice(-4);
 return header('05','기록 및 점검 · 진행현황','회차별 평가 비교와 실제 작성된 기록을 중심으로 사례 진행을 정리합니다.')+
 '<div class="oyv-stats">'+pill('현재 평가회차',String(current.payload.flowRevision||1)+'차')+pill('실무자 작성 항목',draft+'건')+pill('기록된 평가 시점',history.length+'회')+'</div>'+
 '<div class="oyv-path"><div>초기 상담</div><span>→</span><div>개입·연계 기록</div><span>→</span><div>점검회의</div><span>→</span><div>재사정</div><span>→</span><div>종결·사후관리</div></div>'+
 '<article class="oyv-card"><h3>회차별 통합지원 지표 변화</h3><div class="oyv-scroll"><table><thead><tr><th>평가회차</th><th>CORE 원점수</th><th>지원우선순위 지수</th><th>단계</th></tr></thead><tbody>'+trend.map(x=>'<tr><td>'+x.revision+'차</td><td>'+x.raw+'/100</td><td>'+fmt(x.value)+'</td><td>'+x.grade+'단계 · '+esc(x.label)+'</td></tr>').join('')+'</tbody></table></div>'+
 '<p>이 브라우저에서 완료한 평가 회차만 비교합니다. 계획의 실적·목표 달성률은 작성한 기록에 따라 판단하며 임의로 채우지 않습니다.</p></article>';
}
function render(){
 const s=current;
 if(!s?.ready||!s.payload){panel.hidden=true;return;}
 try{
  const d=data(s.payload);latest=d;
  if(s.payload.flowRevision!==revision){
   revision=s.payload.flowRevision;
   if(!history.some(x=>x.revision===revision))history.push({revision,raw:d.priority.official.rawKnown,value:d.priority.finalIndex,grade:d.priority.grade,label:d.priority.label});
  }
  const selected=$('journey88')?.querySelector('[data-j88-result-tab][aria-pressed="true"]')?.dataset?.j88ResultTab||'score';
  panel.hidden=false;
  panel.innerHTML=s.stage===2?(s.view==='map'?mapView(d.analysis,d.priority):selected==='narrative'?narrativeView(d.analysis,d.priority):selected==='integrated'?integratedView(d.analysis,d.priority):scoreView(d.analysis,d.priority)):s.stage===3?caseView(d.analysis,d.priority):s.stage===5?aiView(d.analysis,d.priority):s.stage===4?recordsView(d.analysis,d.priority):'';
  panel.hidden=!panel.innerHTML;
 }catch(e){
  panel.hidden=false;
  panel.innerHTML='<p role="alert" class="oyv-error">시각화 데이터 연결 오류 · 기존 척도와 안전판정은 유지됩니다. '+esc(e?.message||'모델 연결 오류')+'</p>';
 }
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-j88-result-tab]'))setTimeout(render,0);
 if(e.target.closest('[data-j88-tab]'))setTimeout(render,0);
});
window.addEventListener('oy-journey-view',e=>{current=e.detail;render();});
window.OYStageVisualsV1=Object.freeze({
 snapshot:()=>latest?{...latest.priority}:null,
 printSnapshot:()=>{if(!latest||panel.hidden)return null;const n=panel.cloneNode(true);n.id='oy-print-visuals';n.querySelectorAll('.oyv-spec').forEach(d=>d.open=true);return n;}
});
})();