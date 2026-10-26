/* Progressive, evidence-linked, accessible diagrams for five OY-RALS views.
 * Charted values are derived only from current response / case model.
 */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Math.max(0,Math.min(100,Number(v)||0));
const round=v=>Math.round(Number(v)*10)/10;
const CROSS_GUIDE=Object.freeze({"emotion-care":["정서 부담과 돌봄공백이 동시에 보고된 유형","휴식·안전·등교 장면의 어려움을 같은 일정표에 배치","대체 돌봄·가족지원과 상담 자원의 역할을 나누어 연계"],"school-emotion":["학교 참여와 정서적 부담이 함께 보고된 유형","출결·과제·교실 안전 중 가장 큰 학교 장벽부터 조정","학교 지원과 Wee·청소년 상담을 하나의 점검 일정으로 연결"],"basic-care":["필수생활 부족과 가족돌봄의 중복 유형","식사·주거·물품 부족 및 학생 돌봄 부담을 함께 사정","행정복지센터·복지관의 생활지원과 학교 지원을 묶어 조정"],"peers-emotion":["또래안전과 마음의 어려움 동시 보고","피해 접촉 장소·안전한 등교 동선과 정서지원 계획 수립","학교 안전조치와 상담체계를 병렬로 연결"],"digital-emotion":["온라인위험과 정서적 부담 동시 보고","현재 협박·유포·접촉 차단의 순서를 학생의 안전에 맞게 배치","피해보호 기관과 전문상담의 역할 구분"],"health-attend":["건강·행동과 출결 동시 보고","건강·수면·행동 변화가 수업 참여에 주는 부담을 장면별 정리","보건·상담·학교 수업 조정의 담당 분담"],"peer-attend":["또래안전과 등교·수업 어려움 동시 보고","학교 안에서 안전한 동선·보호자원과 학습 조정 함께 배치","학교 조치와 청소년상담·지역지원 사이 역할 연결"],"housing-attend":["주거·생활기반과 출결 동시 보고","통학·식사·학습환경·거주 안정의 실제 장벽을 분리","생활기반 지원과 학습·출결지원 병행"],"access-learning":["교육접근과 학습참여 동시 보고","설명·보조수단·교실환경 조정의 우선순위 정리","학교 접근성 지원과 전문기관 지원 연계"]});
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
 const size=500,c=250,r=184;
 const point=(value,i)=>{const ang=(i/10)*2*Math.PI-Math.PI/2;return [Math.round(c+Math.cos(ang)*r*value),Math.round(c+Math.sin(ang)*r*value)];};
 const pts=arr=>arr.map(z=>z.join(',')).join(' ');
 const rings=[.25,.5,.75,1].map(t=>'<polygon fill="none" stroke="#dce6f1" points="'+pts(labels.map((_,i)=>point(t,i)))+'"/>').join('');
 const axis=labels.map((_,i)=>{const p=point(1,i);return '<line x1="'+c+'" y1="'+c+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="#d1dfea"/>';}).join('');
 const dots=scores.map((v,i)=>point(v===null?0:pct(v)/100,i));
 const unknown=scores.some(v=>v===null);
 return '<div class="oy-viz-radar"><svg viewBox="0 0 '+size+' '+size+'" role="img" aria-label="영역별 응답강도: 중심 0, 바깥 100퍼센트. 바깥으로 갈수록 해당 영역의 문항 평균 응답수준이 높습니다.">'+rings+axis+
 '<polygon points="'+pts(dots)+'" fill="#2b78c54b" stroke="#1768ac" stroke-width="4"/>'+dots.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="'+(scores[i]===null?'#9da8b3':'#175d9c')+'"/>').join('')+
 '</svg><div class="oy-viz-radar-legend">'+labels.map((t,i)=>'<span><i>'+String(i+1).padStart(2,'0')+'</i>'+esc(t)+' · '+esc(scores[i]===null?'미상':round(scores[i])+'%')+'</span>').join('')+'</div></div>'+
 (unknown?'<p class="oy-viz-note">미상만 있는 영역은 점으로 표시되며 0점 영역으로 해석하지 않습니다.</p>':'');
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
 const domains=x.domainRows, top=x.activePairs.slice(0,7);
 return '<div class="oy-viz-dashboard" aria-label="통합지원 단계·영역별 응답강도">'
 +'<h3>통합지원 5단계 · 응답 패턴</h3>'+grade(x)+topStats(x)
 +'<section class="oy-viz-main-radar"><h4>10개 영역의 응답강도 분포</h4><p class="oy-viz-explain"><strong>읽는 방법</strong> 중심은 0%, 바깥쪽은 100%입니다. 다각형이 특정 방향으로 커질수록 <strong>해당 영역의 평균 응답수준이 높습니다.</strong> 면적은 전체 위기점수나 발생확률이 아니며, 영역별 문항 수 차이를 보정한 형태입니다.</p>'+radar(x.domainStrengths,domains.map(z=>z.name))+'</section>'
 +'<section><h4>영역별 응답강도 · 100% 환산</h4><p class="oy-viz-explain">영역 내 응답합계 ÷ 응답한 문항의 최대 가능점수 × 100입니다. 실무에서는 <b>높은 영역부터 지원과제를 정하는 상대적 우선순위</b>로 읽습니다.</p><div class="oy-viz-bar-grid">'+domains.map(d=>bar(d.name,d.normalized,'응답 '+d.raw+'/'+d.max+'점 · 미상 '+d.unknown+'개')).join('')+'</div></section>'
 +'<section><h4>영역 간 동시응답 · '+top.length+'개 교차</h4><p class="oy-viz-explain">두 영역이 함께 보고됐다는 뜻입니다. 강도는 두 영역 중 낮은 정규화 값으로 계산한 <b>내부 비교지표</b>이며, 통계적 상관관계나 한 영역이 다른 영역을 유발했다는 뜻이 아닙니다.</p>'
 +(top.length?cells(['동시 보고 영역','동시응답 강도','학교 담당자의 첫 행동','복지관·지역기관의 연결'],top.map(t=>[t.label,t.strength+' / 100',CROSS_GUIDE[t.id]?.[1]||'학교 내 영향 장면을 정리',CROSS_GUIDE[t.id]?.[2]||'중복 의뢰를 조정'])):'<p>설정된 교차조합에서 둘 다 양성인 영역은 없습니다.</p>')
 +'<details class="oy-viz-cross-details"><summary>전체 교차영역 패턴 보기</summary><div class="oy-viz-matrix">'+x.cross.map(t=>'<div class="'+(t.active?'on':'')+'"><strong>'+esc(t.label)+'</strong><span>'+esc(t.active?t.strength+'점':'해당 없음')+'</span></div>').join('')+'</div></details></section>'
 +'<details class="oy-viz-raw-details"><summary>25문항 개별응답 히트맵 · 0~4점</summary><div class="oy-viz-heatmap">'+p.answers.map((v,i)=>'<div class="v'+(v==='unknown'?'u':v)+'" aria-label="'+(i+1)+'번 '+(v==='unknown'?'미상':v+'점')+'"><b>'+(i+1)+'</b><span>'+(v==='unknown'?'?':v)+'</span></div>').join('')+'</div></details>'
 +'<div class="oy-viz-copy"><button type="button" id="oy-viz-copy-assessment" class="flow-btn flow-primary">현재 척도·분석 요청문 복사 → 외부 AI 활용</button><p id="oy-viz-copy-status" role="status">학생 이름과 자유서술은 제외한 25문항·영역 결과·지원단계를 복사합니다.</p><textarea id="oy-viz-copy-text" readonly hidden rows="7" aria-label="복사용 요청문"></textarea></div>'
 +'<details class="oy-viz-method"><summary>5단계 보조지표의 산식·원점수 확인</summary><p>CORE 40%, 가중치 25%, 영역교차 20%, 핵심문항 10%, 유효 서술단서 5%. 다영역 집중과 안전 신호가 있는 경우 실행단계가 상향될 수 있습니다. 내부 업무 분류로서 실증 타당도는 검증되지 않았습니다.</p>'
 +cells(['구성','결과','근거'],[['CORE 확인 원점수',x.raw+'/100','기존 공식 점수 유지'],['문항별 가중치',x.weighted+'/100',x.weightsVersion],['교차영역',x.crossScore+'/100','동시응답 강도'],['핵심 안전문항',x.criticalScore+'/100','Q1·Q2·Q7·Q25'],['서술 맥락',x.narrative===null?'미입력':x.narrative+'/100','현재성·부정·가정 구분']])+'</details></div>';
}
function mapViz(a,x){
 const top=x.domainRows.filter(d=>d.raw>0).sort((b,c)=>b.normalized-c.normalized).slice(0,3);
 const candidates=a.plans.flatMap(y=>(y.candidates||[]).map(c=>({n:c.name||'기관',service:c.service||'지원서비스',domain:y.title}))).filter((v,i,arr)=>arr.findIndex(y=>y.n===v.n&&y.service===v.service)===i).slice(0,8);
 return '<div class="oy-viz-panel"><h2>연계 방향 · 기관별 지원축</h2>'+
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
function copyAssessment(){
 if(!current?.payload)return;
 const p=current.payload,x=window.OYFiveLevelIndex.analyze({...p,caseContext:''});
 const lines=['오산 청소년 위기징후 평가연계 시스템 · 비식별 AI 분석 요청','CORE 25문항은 변경하지 말고, 보고된 응답에 따라 교사·교육복지사·사회복지사 역할별 지원 방향을 작성해 주세요.','미상은 0점이 아니며 교차영역은 인과관계가 아닙니다. 실제 신고·서비스 제공 여부는 만들지 마세요.',
 '원점수: '+x.raw+'/100 · 미상 '+x.unknown+' · 안전판정: '+x.official.safetyReview,
 '시스템 지원단계: '+(x.tier?'제'+x.tier+'단계 '+x.label:'전체 미상 포함')+' · 개발형 복합지표 '+(x.composite??'미산출'),
 '25문항: '+p.answers.map((v,i)=>(i+1)+'번 '+(v==='unknown'?'미상':v+'점')).join(' / '),
 '영역별: '+x.domainRows.map(d=>d.name+' '+d.raw+'/'+d.max+'점').join(' / '),
 '동시응답: '+x.activePairs.slice(0,7).map(t=>t.label+' '+t.strength+'/100').join(' / '),
 '출력: 핵심 상황 3문장 / 학교에서 먼저 3개 / 복지관·공공기관 개입 3개 / 단기 목표 및 변화지표 / 근거·미확인 분리'];
 const text=lines.join('\n\n'),status=document.getElementById('oy-viz-copy-status'),fallback=document.getElementById('oy-viz-copy-text');
 const fail=()=>{if(fallback){fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();}if(status)status.textContent='클립보드가 차단되어 요청문을 표시했습니다. 직접 복사하세요.';};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{if(status)status.textContent='척도와 분석 요청문을 복사했습니다. 개인 AI에 붙여넣으세요.';}).catch(fail);else fail();
}
document.addEventListener('click',e=>{if(e.target.closest('#oy-viz-copy-assessment'))copyAssessment();});
window.addEventListener('oy-journey-view',event=>render(event.detail));
})();
