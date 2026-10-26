/* Progressive, evidence-linked, accessible diagrams for five OY-RALS views.
 * Charted values are derived only from current response / case model.
 */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Math.max(0,Math.min(100,Number(v)||0));
const round=v=>Math.round(Number(v)*10)/10;
const id='oy-viz-stage-v1';
const host=document.createElement('section');host.id=id;host.className='oy-viz';host.hidden=true;
$('journey88')?.before(host);
let current=null,last=null;
const cells=(head,rows)=>'<div class="oy-viz-scroll"><table><thead><tr>'+head.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function bar(label,score,sub=''){
 return '<div class="oy-viz-bar"><div class="oy-viz-bar-meta"><strong>'+esc(label)+'</strong><span>'+esc(score===null?'미상':round(score)+'%')+'</span></div>'+
 '<div class="oy-viz-track" role="img" aria-label="'+esc(label)+' '+esc(score===null?'미상':round(score)+'퍼센트')+'"><span style="width:'+pct(score)+'%"></span></div>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
}
function radar(scores,labels){
 const w=330,c=165,r=117,center=165;
 const polar=(v,i)=>{const angle=(i/10)*Math.PI*2-Math.PI/2;return [round(c+Math.sin(angle)*0+Math.cos(angle)*0+Math.cos(angle)*r*v),round(center+Math.sin(angle)*r*v)];};
 const polygon=arr=>arr.map(([x,y])=>x+','+y).join(' ');
 const axes=labels.map((l,i)=>{const p=polar(1,i);return '<line x1="165" y1="165" x2="'+p[0]+'" y2="'+p[1]+'" stroke="#d2deea"/>';}).join('');
 const rings=[.25,.5,.75,1].map(z=>'<polygon points="'+polygon(labels.map((_,i)=>polar(z,i)))+'" fill="none" stroke="#d6e3ee" stroke-width="1"/>').join('');
 const points=scores.map((x,i)=>polar(pct(x)/100,i));
 const dots=points.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="#175da0"/>').join('');
 return '<div class="oy-viz-radar"><svg viewBox="0 0 330 330" role="img" aria-label="10개 영역의 응답 상대 강도 방사형 차트. 영역별 정확한 값은 아래 막대그래프와 표에 표시됩니다.">'+rings+axes+'<polygon points="'+polygon(points)+'" fill="#2b78c544" stroke="#1867ab" stroke-width="3"/>'+dots+'</svg><div class="oy-viz-radar-legend">'+labels.map((l,i)=>'<span><i>'+String(i+1).padStart(2,'0')+'</i>'+esc(l)+'</span>').join('')+'</div></div>';
}
function grade(x){
 const active=x.tier,items=['안정관찰','초기주의','집중지원','고위기개입','최우선 안전대응'];
 return '<section class="oy-viz-grade" aria-label="개발형 5단계 지원우선순위"><div class="oy-viz-grade-head"><span>OY-RALS · 통합지원 단계</span><strong>'+esc(x.tier===null?'응답 미완료':'제'+active+'단계 · '+x.label)+'</strong></div>'+
 '<div class="oy-viz-scale">'+items.map((n,i)=>'<div class="'+(active===i+1?'current':'')+'"><b>'+ (i+1)+'</b><span>'+n+'</span></div>').join('')+'</div>'+
 '<p class="oy-viz-grade-action"><b>시스템 적용 경로</b> '+esc(x.action)+'</p>'+
 (x.tier!==null&&x.baseTier!==null&&x.tier>x.baseTier?'<p class="oy-viz-pattern"><b>단계 상향 근거</b> '+esc(x.baseTier+'단계 → '+x.tier+'단계 · '+x.patternReason)+'</p>':'')+
 (x.safetyReason?'<p class="oy-viz-safety">안전 우선 상향: '+esc(x.safetyReason)+'</p>':'')+
 '<small>원점수와 분리된 개발형 지원우선순위 분류입니다. 진단, 신고 판단 또는 검증된 위험확률을 뜻하지 않습니다.</small></section>';
}
function topStats(x){
 const stats=[
 ['CORE 원점수',x.complete?x.raw+' / 100':'확인 '+x.raw+'점'],
 ['통합지표',x.composite===null?'응답 미완료':x.composite+' / 100'],
 ['가중위험',x.weighted===null?'—':x.weighted+' / 100'],
 ['교차위험',x.crossScore+' / 100'],
 ['핵심문항 영향',x.criticalScore===null?'—':x.criticalScore+' / 100'],
 ['서술 맥락',x.narrative===null?'미입력':x.narrative+' / 100']
 ];
 return '<div class="oy-viz-kpis">'+stats.map(([name,value])=>'<article><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong></article>').join('')+'</div>';
}
function scoreDashboard(x,p){
 const domains=x.domainRows,top=x.activePairs.slice(0,7);
 return '<div class="oy-viz-dashboard" aria-label="통합지원지표 정량 근거 및 시각화"><h3>통합지원 5단계 판정 대시보드</h3>'+grade(x)+topStats(x)+
 '<div class="oy-viz-split"><article><h4>10영역 분포 · 응답 강도</h4>'+radar(x.domainStrengths,domains.map(d=>d.name))+
 '</article><article><h4>영역별 강도 · 100점 환산</h4>'+domains.map(d=>bar(d.name,d.normalized,'응답 '+d.raw+'/'+d.max+'점 · 미상 '+d.unknown+'개')).join('')+'</article></div>'+
 '<section><h4>교차영역 연계 · '+top.length+'개 동시응답 표시</h4>'+
 (top.length?cells(['교차 축','공동응답 강도','분석 방향'],top.map(pair=>[pair.label,pair.strength+' / 100','동시응답 패턴 · 영역별 서비스 조정'])):
 '<p>설정된 교차영역 조합에서 동시 양성 응답이 없습니다.</p>')+
 '<div class="oy-viz-matrix">'+x.cross.map(c=>'<div class="'+(c.active?'on':'')+'" title="'+esc(c.label)+'"><strong>'+esc(c.label)+'</strong><span>'+esc(c.active?c.strength+'점':'—')+'</span></div>').join('')+'</div></section>'+
 '<section><h4>25문항 응답 히트맵 · 0~4점</h4><div class="oy-viz-heatmap" role="group" aria-label="25개 문항 점수 분포">'+p.answers.map((v,i)=>'<div class="v'+(v==='unknown'?'u':v)+'" title="'+(i+1)+'번 '+(v==='unknown'?'미상':v+'점')+'" aria-label="'+(i+1)+'번 '+(v==='unknown'?'미상':v+'점')+'"><b>'+(i+1)+'</b><span>'+(v==='unknown'?'?':v)+'</span></div>').join('')+'</div></section>'+
 '<details class="oy-viz-method"><summary>5단계 지표 산식과 근거 보기</summary>'+
 '<p>CORE 40% + 가중위험 25% + 교차영역 20% + 핵심문항 영향 10% + 서술 맥락 5% (서술 미입력 시 5% 재정규화). 0–19.9 1단계, 20–39.9 2단계, 40–59.9 3단계, 60–79.9 4단계, 80–100 5단계. 안전 게이트가 우선하는 경우 해당 최소 단계로 상향됩니다.</p>'+
 cells(['모델 구성','결과','적용'],[['CORE 원점수',x.raw+' / 100','변경 없음'],['문항 가중',x.weighted+'/100',x.weightsVersion],['교차영역',x.crossScore+'/100','동시응답 강도'],['핵심문항',x.criticalScore+'/100','Q1·Q2·Q7·Q25'],['서술 맥락',x.narrative===null?'미입력':x.narrative+'/100','현재성·부정·가정 제외'],['안전판정',x.official.urgent?'안전 게이트 적용':'일반 게이트','CORE 기존 로직']])+
 '</details></div>';
}
function mapViz(a,x){
 const top=x.domainRows.filter(d=>d.raw>0).sort((b,c)=>b.normalized-c.normalized).slice(0,3);
 const candidates=a.plans.flatMap(y=>(y.candidates||[]).map(c=>({n:c.name||'기관',service:c.service||'지원서비스',domain:y.title}))).filter((v,i,arr)=>arr.findIndex(y=>y.n===v.n&&y.service===v.service)===i).slice(0,8);
 return '<div class="oy-viz-panel"><h2>연계 구조 · 우선 지원축</h2>'+grade(x)+
 '<div class="oy-viz-path"><div>평가 근거<br><strong>'+top.map(d=>esc(d.name)).join(' · ')+'</strong></div><span>→</span><div>학교·학맞통<br><strong>안전·학습·정서 지원</strong></div><span>→</span><div>오산 지역자원<br><strong>복지·상담·생활지원</strong></div><span>→</span><div>추적 점검<br><strong>의뢰상태·재사정</strong></div></div>'+
 (candidates.length?cells(['기관 후보','지원 기능','선정 근거'],candidates.map(c=>[c.n,c.service,c.domain])):'<p>현재 응답에서 자동 추천된 기관 후보가 없습니다. 기존 지도에서 지원 영역을 직접 선택할 수 있습니다.</p>')+
 '<p class="oy-viz-note">기관명은 등록된 후보이며 실제 접수·서비스 제공 완료를 뜻하지 않습니다. 기존 자원연계 지도는 아래에 그대로 유지됩니다.</p></div>';
}
function caseViz(a,x){
 const top=x.domainRows.filter(d=>d.raw>0).sort((b,c)=>b.normalized-c.normalized).slice(0,4);
 const rows=a.plans.slice(0,5).map((p,i)=>[String(i+1),p.title,(p.evidence||[]).slice(0,3).join(' · ')||'기록 문맥',p.when||'초기 개입',p.outcome||'생활 변화 추적']);
 return '<div class="oy-viz-panel"><h2>사례 톺아보기 · 실행 구조</h2><div class="oy-viz-path"><div>01 안전·사정</div><span>→</span><div>02 학교·학맞통 협의</div><span>→</span><div>03 복지관·전문기관 개입</div><span>→</span><div>04 재사정·종결</div></div>'+
 '<div class="oy-viz-split"><article><h3>사정 우선영역</h3>'+top.map(d=>bar(d.name,d.normalized)).join('')+'</article><article><h3>담당 체계 · 역할 분담</h3>'+
 cells(['실행주체','핵심 업무'],[['담임·학교','안전·출결·학습·교내 조정'],['교육복지','학생맞춤통합지원 및 교내외 의뢰 조정'],['사회복지관','가구·돌봄·생활환경 사정, 서비스 계획·점검'],['전문기관','해당 영역 전문지원 및 후속 개입']])+'</article></div>'+
 '<h3>추천 실행계획 · 근거 연동</h3>'+(rows.length?cells(['우선순위','개입 과제','근거','시점','성과지표'],rows):'<p>현재 점수에서 자동으로 생성된 실행과제는 없습니다.</p>')+'</div>';
}
function researchViz(x){
 const contracts=window.OYModelGateway?.status?.()||[];
 const stages=[['CORE','원점수·안전'],['ICSI','문항 의미'],['NCB','서술 대조'],['OY-CIE','복합 해석'],['K-CARR','사례 추론'],['ICMS','서비스 계획']];
 return '<div class="oy-viz-panel"><h2>AI 연구 작업실 · 모델 연결도</h2><div class="oy-viz-path"><div>척도·서술 원자료</div><span>→</span><div>검증 게이트</div><span>→</span><div>OY-CIE 응답 엔진</div><span>→</span><div>개입 근거·요청문</div></div>'+
 '<div class="oy-viz-matrix">'+stages.map(([id,role])=>{const item=contracts.find(c=>c.id===id);return '<div class="'+(item?.loaded?'on':'')+'"><strong>'+id+'</strong><span>'+role+' · '+(item?.loaded?'연결':'별도·미연결')+'</span></div>';}).join('')+'</div>'+
 '<p class="oy-viz-note">현재 학생·사례 정보는 연구 작업실의 선택자료 범위에 따라 연결되며, 선택된 서술과 기록은 기본적으로 외부 AI로 전송되지 않습니다.</p></div>';
}
function recordsViz(a,x){
 const plans=a.plans.slice(0,5);
 return '<div class="oy-viz-panel"><h2>기록·점검 · 회차별 실행흐름</h2><div class="oy-viz-path"><div>초기 평가<br><strong>'+esc(x.label)+'</strong></div><span>→</span><div>서비스 실행<br><strong>'+plans.length+'개 추천 과제</strong></div><span>→</span><div>점검·재사정<br><strong>변화 기록</strong></div><span>→</span><div>종결·사후관리<br><strong>목표와 경과 비교</strong></div></div>'+
 cells(['우선 과제','기준선','목표','이행','재사정'],plans.map(p=>[p.title,'현재 척도 기반','학생·실무자 목표 입력','진행기록 입력','전후 비교 입력']))+
 '<p class="oy-viz-note">입력되지 않은 제공 횟수·목표 달성률·종결 상태를 임의 생성하지 않습니다. 아래 기록 양식에서 입력한 실제 이행 자료를 사용합니다.</p></div>';
}
function render(s){
 current=s;host.hidden=true;host.innerHTML='';
 const slot=$('oy-index-visual-slot');if(slot)slot.replaceChildren();
 const all=$('oy-integrated-visual-slot');if(all)all.replaceChildren();
 if(!s?.ready||!s.payload||!window.OYFiveLevelIndex)return;
 try{
  const a=window.OYModelGateway?.analyze?.(s.payload);
  const x=a?.supportPriority||window.OYFiveLevelIndex.analyze(s.payload);
  if(s.stage===2&&s.view==='result'){
   const objective=window.OYFiveLevelIndex.analyze({...s.payload,caseContext:''});
   if(slot){slot.innerHTML=scoreDashboard(objective,s.payload);}
   if(all){all.innerHTML=grade(x)+topStats(x);}
   return;
  }
  let html='';
  if(s.stage===2&&s.view==='map')html=mapViz(a,x);
  else if(s.stage===3)html=caseViz(a,x);
  else if(s.stage===5)html=researchViz(x);
  else if(s.stage===4)html=recordsViz(a,x);
  host.hidden=!html;host.innerHTML=html;
  last=x;
 }catch(err){host.hidden=false;host.innerHTML='<p role="alert">시각화 모듈 오류: '+esc(err.message||'data error')+'. CORE 결과와 원점수는 유지됩니다.</p>';}
}
window.OYStageInsights=Object.freeze({render,version:'1.0.0'});
window.addEventListener('oy-journey-view',event=>render(event.detail));
})();
