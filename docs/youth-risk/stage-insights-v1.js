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
// Radar: vector-crisp SVG, range bands as rings, unknown axes kept off the polygon, red family for higher bands.
const BAND_COLOR=['#1765bd','#e07068','#c42b2b','#b02424'];
const bandIdx=v=>v===null?null:v<25?0:v<50?1:v<75?2:3;
function radar(scores,labels){
 const size=700,c=350,r=215;
 const point=(value,i)=>{const ang=(i/10)*2*Math.PI-Math.PI/2;return [+(c+Math.cos(ang)*r*value).toFixed(1),+(c+Math.sin(ang)*r*value).toFixed(1)];};
 const pts=arr=>arr.map(z=>z.join(',')).join(' ');
 const ringFill=['#ffffff','#ffffff','#ffffff','#fef6f5'];
 const rings=[1,.75,.5,.25].map((t,k)=>'<polygon fill="'+ringFill[3-k]+'" stroke="#e3e8ee" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke" points="'+pts(labels.map((_,i)=>point(t,i)))+'"/>').join('');
 const ringText=[.25,.5,.75,1].map(t=>{const p=point(t,0);return '<text class="oy-radar-ring" x="'+(p[0]+6)+'" y="'+(p[1]+14)+'" font-size="13" fill="#7a8ea4">'+Math.round(t*100)+'%</text>';}).join('');
 const axis=labels.map((_,i)=>{const p=point(1,i);return '<line x1="'+c+'" y1="'+c+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="'+(scores[i]===null?'#b8c4d1':'#e3e8ee')+'" stroke-width="1"'+(scores[i]===null?' stroke-dasharray="6 6"':'')+' vector-effect="non-scaling-stroke"/>';}).join('');
 const short=['학대·보호','학교폭력','정서·정신','학습·출결','행동·건강','발달·접근','가족·돌봄','경제·주거','관계·지지','디지털안전'];
 const axisLabels=labels.map((label,i)=>{const z=point(272/r,i),d=z[0]-c,anc=d>30?'start':d<-30?'end':'middle',v=scores[i],b=bandIdx(v);return '<text class="oy-radar-axis" x="'+z[0]+'" y="'+(z[1]-3)+'" text-anchor="'+anc+'" font-size="16" fill="#16273a" font-weight="600"><title>'+esc(label)+'</title>'+esc(short[i])+'<tspan x="'+z[0]+'" dy="21" font-size="15" font-weight="700" fill="'+(v===null?'#7a8ea4':BAND_COLOR[b])+'">'+(v===null?'미상':round(v)+'%')+'</tspan></text>';}).join('');
 const known=scores.map((v,i)=>({v,i})).filter(z=>z.v!==null);
 const poly=known.length>=3?'<polygon points="'+pts(known.map(z=>point(pct(z.v)/100,z.i)))+'" fill="url(#oyRadarFill)" stroke="#1f5f96" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>':known.length?'<polyline points="'+pts(known.map(z=>point(pct(z.v)/100,z.i)))+'" fill="none" stroke="#1f5f96" stroke-width="3.5" stroke-linejoin="round"/>':'';
 const dots=scores.map((v,i)=>{if(v===null){const p=point(1,i);return '<circle tabindex="0" role="button" data-radar-index="'+i+'" cx="'+p[0]+'" cy="'+p[1]+'" r="9" fill="#ffffff" stroke="#7a8ea4" stroke-width="2.5" stroke-dasharray="4 3"><title>'+esc(labels[i]+': 미상 · 0%로 그리지 않음')+'</title></circle>';}const p=point(pct(v)/100,i),b=bandIdx(v);return '<circle tabindex="0" role="button" data-radar-index="'+i+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(b>=2?9:7)+'" fill="'+BAND_COLOR[b]+'" stroke="#ffffff" stroke-width="3" filter="url(#oyRadarShadow)"><title>'+esc(labels[i]+': '+round(v)+'% · '+['1구간 낮음','2구간 주의','3구간 상승','4구간 현저'][b])+'</title></circle>';}).join('');
 const unknown=scores.some(v=>v===null);
 const desc=labels.map((l,i)=>l+' '+(scores[i]===null?'미상':round(scores[i])+'%')).join(', ');
 return '<div class="oy-viz-radar"><svg viewBox="0 0 '+size+' '+size+'" role="img" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" font-family="-apple-system, BlinkMacSystemFont, \'Apple SD Gothic Neo\', Pretendard, \'Noto Sans KR\', sans-serif" aria-label="영역별 응답강도: 중심 0, 바깥 100퍼센트. 바깥으로 갈수록 해당 영역의 문항 평균 응답수준이 높습니다."><desc>'+esc(desc)+'</desc><defs><radialGradient id="oyRadarFill" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#276daf" stop-opacity=".10"/><stop offset="100%" stop-color="#276daf" stop-opacity=".26"/></radialGradient><filter id="oyRadarShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity=".18"/></filter></defs>'+rings+axis+ringText+poly+dots+axisLabels+
 '</svg><p class="oy-radar-tip" role="status" data-radar-tooltip>각 점에 마우스를 올리거나 터치하면 영역별 응답강도가 표시됩니다.</p><div class="oy-viz-radar-legend">'+labels.map((t,i)=>{const b=bandIdx(scores[i]);return '<span class="'+(b!==null&&b>=1?'oy-radar-hot':'')+'"><i>'+String(i+1).padStart(2,'0')+'</i>'+esc(t)+' · '+esc(scores[i]===null?'미상':round(scores[i])+'%')+'</span>';}).join('')+'</div>'+
 '<div class="oy-radar-key"><span><i style="background:#1f5f96"></i>1구간 0~25%</span><span><i style="background:#e07068"></i>2구간 25~50%</span><span><i style="background:#c42b2b"></i>3구간 50~75%</span><span><i style="background:#b02424"></i>4구간 75~100%</span><span><i class="u"></i>미상</span><button type="button" class="flow-btn" data-radar-png>고해상도 이미지 저장</button></div></div>'+
 (unknown?'<p class="oy-viz-note">미상인 영역은 점선 축과 바깥 테두리의 빈 점으로 표시하며, 다각형은 확인된 영역만 잇습니다. 0점 영역으로 해석하지 않습니다.</p>':'');
}
// High-resolution PNG export: rasterises the vector radar at 3x (min 2100px) on a white background.
function radarPng(btn){
 const svg=btn.closest('.oy-viz-radar')?.querySelector('svg');if(!svg)return;
 const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const scale=Math.max(3,Math.ceil((window.devicePixelRatio||1)*2)),w=700*scale;
 clone.setAttribute('width',w);clone.setAttribute('height',w);
 const img=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}));
 img.onload=()=>{const cv=document.createElement('canvas');cv.width=w;cv.height=w;const g=cv.getContext('2d');g.fillStyle='#ffffff';g.fillRect(0,0,w,w);g.imageSmoothingQuality='high';g.drawImage(img,0,0,w,w);URL.revokeObjectURL(url);cv.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='OY-RALS-영역별-응답강도-레이더.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);},'image/png');};
 img.onerror=()=>URL.revokeObjectURL(url);
 img.src=url;
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-radar-png]');if(b)radarPng(b);});
function grade(x){
 const active=x.tier,items=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
 return '<section class="oy-viz-grade" aria-label="개발형 5단계 지원우선순위"><div class="oy-viz-grade-head"><span>OY-RALS · 통합지원 단계</span><strong>'+esc(x.tier===null?('단계 미확정 · 미상 '+x.unknown+'문항 확인 필요'):'제'+active+'단계 · '+x.label)+'</strong></div>'+
 '<div class="oy-viz-scale">'+items.map((n,i)=>'<div class="'+(active===i+1?'current':'')+'"><b>'+ (i+1)+'</b><span>'+n+'</span></div>').join('')+'</div>'+
 '<p class="oy-viz-grade-action"><b>시스템 적용 경로</b> '+esc(x.tier===null?'확인된 어려움부터 지원하면서 미상 문항을 확인합니다':x.action)+'</p>'+
 (x.tier!==null&&x.baseTier!==null&&x.tier>x.baseTier?'<p class="oy-viz-pattern"><b>단계 상향</b> '+esc('점수 기준 '+x.baseTier+'단계 → '+x.tier+'단계 · 결정 요인: '+(window.OYResultReadout?.decisiveText?.(x)||x.patternReason))+'</p>':'')+
 (x.safetyReason&&x.safetyFloor===x.tier&&!(x.baseTier!==null&&x.tier>x.baseTier)?'<p class="oy-viz-safety">안전 우선 상향: '+esc(x.safetyReason)+'</p>':'')+
 '<small>원점수와 분리된 개발형 지원우선순위 분류입니다. 진단, 신고 판단 또는 검증된 위험확률을 뜻하지 않습니다.</small></section>';
}
function topStats(x,p,objective){
 const R=window.OYResultReadout;
 const stats=[
 ['응답상태',x.known+' / 25문항',x.unknown?'미상 '+x.unknown+'문항 · 0점 아님':'모든 문항 확인'],
 ['통합지표(참고)',x.composite===null?'미상 확인 후 계산':x.composite+' / 100','점수 기반 · 20점마다 1단계'],
 ['가중 응답강도',x.weighted===null?'—':x.weighted+' / 100','문항 중요도를 반영한 응답 수준'],
 ['영역 동시응답',x.crossScore+' / 100','두 영역이 함께 어려울 때 커짐'],
 ['핵심 안전문항',x.criticalScore===null?'—':x.criticalScore+' / 100','1·2·7·25번 중 높은 2개 평균'],
 ['서술 맥락',R&&p?R.narrativeLabel(x,p,objective):(x.narrative===null?'미입력':x.narrative+' / 100'),'점수는 바꾸지 않음']
 ];
 return '<div class="oy-viz-kpis">'+stats.map(([name,value,hint])=>'<article><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong><span class="oy-kpi-hint">'+esc(hint)+'</span></article>').join('')+'</div>'
 +'<p class="oy-viz-explain">위 숫자는 위험확률이 아닙니다. 단계는 숫자 하나가 아니라 점수·응답 패턴·안전 기준 중 가장 높은 것으로 정해지며, 그 이유는 아래 ‘이 단계가 나온 이유’에 적었습니다.</p>';
}
function itemDomain(n){const ranges=[2,5,8,11,13,15,18,21,23,25];return ranges.findIndex(v=>n<=v);}
function patternEvidence(pair,p){
 const engine=window.OYCIESemanticV2;
 const combo=engine?.scoreCombination?.(p.answers);
 const pairs=(combo?.pairs||[]).filter(z=>(itemDomain(z.a)===pair.a&&itemDomain(z.b)===pair.b)||(itemDomain(z.a)===pair.b&&itemDomain(z.b)===pair.a));
 const ranked=pairs.sort((a,b)=>b.strength-a.strength).slice(0,3);
 const q=[...new Set(ranked.flatMap(z=>[z.a,z.b]))].sort((a,b)=>a-b).map(n=>n+'번 '+p.answers[n-1]+'점');
 return {questions:q.join(' · ')||'영역별 원문항 응답',cie:ranked.map(z=>z.meaning).filter(Boolean).slice(0,2).join(' / ')};
}
function patternSummary(x,p){
 const head=x.activePairs.slice(0,3),high=p.answers.map((v,i)=>({n:i+1,v,domain:itemDomain(i+1)})).filter(z=>typeof z.v==='number'&&z.v>=3);
 const dom=x.domainRows.filter(z=>z.raw>0).sort((a,b)=>(b.normalized||0)-(a.normalized||0)).slice(0,3);
 const focus=head.map(t=>CROSS_GUIDE[t.id]?.[0]||t.label);
 return '<section class="oy-pattern-summary"><h4>응답 패턴의 실무적 의미</h4><p><strong>주요 교차 유형:</strong> '+esc(focus.join(' → ')||'동시 양성 보고 없음')+'</p>'+
 '<p><strong>영역별 중심축:</strong> '+esc(dom.map(z=>z.name+' '+z.normalized+'%').join(' · ')||'양성 응답 없음')+'</p>'+
 '<p><strong>3~4점 집중 문항:</strong> '+esc(high.slice(0,10).map(z=>z.n+'번 '+z.v+'점').join(' · ')||'고점 문항 없음')+'</p>'+
 '<p class="oy-viz-explain">동시응답은 복합지원의 우선순위를 조정하는 신호입니다. 인과관계가 증명된 것은 아니며 각 영역에 실제로 보고된 문항을 근거로 개입과제를 연결합니다.</p></section>';
}
function scoreDashboard(x,p,full){
 const domains=x.domainRows, top=x.activePairs.slice(0,7);
 return '<div class="oy-viz-dashboard" aria-label="통합지원 단계·영역별 응답강도">'
 +'<h3>통합지원 5단계 · 응답 패턴</h3>'+grade(x)+topStats(x,p,true)+(window.OYResultReadout?window.OYResultReadout.html(x,p,{objective:true,fullTier:full?.tier}):'')
 // The deep interpretation below already places these figures in its pages, so here they stay folded:
 // on a phone the reading starts a screen sooner, and item numbers stay out of the first view.
 +'<details class="oy-viz-more"><summary>영역 그래프·교차 응답 자세히 보기 (문항 근거 포함)</summary>'
 +'<section class="oy-viz-main-radar"><h4>10개 영역의 응답강도 분포</h4><p class="oy-viz-explain"><strong>읽는 방법</strong> 중심은 0%, 바깥쪽은 100%입니다. 다각형이 특정 방향으로 커질수록 <strong>해당 영역의 평균 응답수준이 높습니다.</strong> 면적은 전체 위기점수나 발생확률이 아니며, 영역별 문항 수 차이를 보정한 형태입니다.</p>'+radar(x.domainStrengths,domains.map(z=>z.name))+'</section>'
 +'<section><h4>영역별 응답강도 · 100% 환산</h4><p class="oy-viz-explain">영역 내 응답합계 ÷ 응답한 문항의 최대 가능점수 × 100입니다. 실무에서는 <b>높은 영역부터 지원과제를 정하는 상대적 우선순위</b>로 읽습니다.</p><div class="oy-viz-bar-grid">'+domains.map((d,i)=>bar(d.name,d.normalized,window.OYResultReadout?window.OYResultReadout.domainNote(d,i):'응답 '+d.raw+'/'+d.max+'점 · 미상 '+d.unknown+'개')).join('')+'</div></section>'
 +patternSummary(x,p)+'<section><h4>영역 간 동시응답 · '+top.length+'개 교차</h4><p class="oy-viz-explain">두 영역이 함께 보고됐다는 뜻입니다. 강도는 두 영역 중 낮은 정규화 값으로 계산한 <b>내부 비교지표</b>이며, 통계적 상관관계나 한 영역이 다른 영역을 유발했다는 뜻이 아닙니다.</p>'
 +(top.length?cells(['동시보고·핵심패턴','강도·문항근거','CIE 문항해석','학교 우선 행동','복지관·지역기관 연계'],top.map(t=>{const e=patternEvidence(t,p);return [t.label+' · '+(CROSS_GUIDE[t.id]?.[0]||'동시응답형'),t.strength+'/100 · '+e.questions,e.cie||'해당 문항들의 생활영향을 함께 보는 내부 교차 가설',CROSS_GUIDE[t.id]?.[1]||'학교 내 영향 장면 정리',CROSS_GUIDE[t.id]?.[2]||'지원담당자 간 의뢰 조정'];})):'<p>설정된 교차조합에서 둘 다 양성인 영역은 없습니다.</p>')
 +'<details class="oy-viz-cross-details"><summary>전체 교차영역 패턴 보기</summary><div class="oy-viz-matrix">'+x.cross.map(t=>'<div class="'+(t.active?'on':'')+'"><strong>'+esc(t.label)+'</strong><span>'+esc(t.active?t.strength+'점':'해당 없음')+'</span></div>').join('')+'</div></details></section>'
 +'</details>'
 +'<details class="oy-viz-raw-details"><summary>25문항 개별응답 히트맵 · 0~4점</summary><div class="oy-viz-heatmap">'+p.answers.map((v,i)=>'<div class="v'+(v==='unknown'?'u':v)+'" aria-label="'+(i+1)+'번 '+(v==='unknown'?'미상':v+'점')+'"><b>'+(i+1)+'</b><span>'+(v==='unknown'?'?':v)+'</span></div>').join('')+'</div></details>'
 +'<div class="oy-viz-copy"><label class="oy-ai-privacy-gate"><input type="checkbox" id="oy-viz-copy-reviewed"> 학생 식별정보가 제외되었는지와 척도 응답이 민감정보임을 검토했습니다. 복사 후 외부 AI의 개인정보 처리 기준을 따릅니다.</label><button type="button" id="oy-viz-copy-assessment" class="flow-btn flow-primary">현재 척도·분석 요청문 복사 → 외부 AI 활용</button><p id="oy-viz-copy-status" role="status">학생 이름과 자유서술은 제외한 25문항·영역 결과·지원단계를 복사합니다.</p><textarea id="oy-viz-copy-text" readonly hidden rows="7" aria-label="복사용 요청문"></textarea></div>'
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
 const rows=a.plans.slice(0,3).map((p,i)=>[String(i+1),p.title,(p.evidence||[]).slice(0,3).join(' · ')||'기록 문맥',p.when||'초기 개입',p.outcome||'생활 변화 추적']);
 return '<div class="oy-viz-panel"><h2>사례개념화·개입계획 · 실행 구조</h2><div class="oy-viz-path"><div>01 안전·사정</div><span>→</span><div>02 학교·학맞통 협의</div><span>→</span><div>03 복지관·전문기관 개입</div><span>→</span><div>04 재사정·종결</div></div>'+
 '<div class="oy-viz-split"><article><h3>사정 우선영역</h3>'+top.map(d=>bar(d.name,d.normalized)).join('')+'</article><article><h3>담당 체계 · 역할 분담</h3>'+
 cells(['실행주체','핵심 업무'],[['담임·학교','안전·출결·학습·교내 조정'],['교육복지','학생맞춤통합지원 및 교내외 의뢰 조정'],['사회복지관','가구·돌봄·생활환경 사정, 서비스 계획·점검'],['전문기관','해당 영역 전문지원 및 후속 개입']])+'</article></div>'+
 '<h3>추천 실행계획 · 근거 연동</h3>'+(rows.length?cells(['우선순위','개입 과제','근거','시점','성과지표'],rows)+(a.plans.length>3?'<p class="oy-viz-note">먼저 시작할 3건만 보입니다. 나머지 '+(a.plans.length-3)+'건은 서비스계획에서 펼쳐 볼 수 있습니다.</p>':''):'<p>현재 점수에서 자동으로 생성된 실행과제는 없습니다.</p>')+'</div>';
}
function researchViz(){
 // 04 is the ask-panel collection: quick answers from the report first, then the practitioner's own AI by copy and paste.
 return '<div class="oy-viz-panel"><h2>AI 사례자문 작업실 · 이용 흐름</h2><div class="oy-viz-path"><div>해석지 읽기</div><span>→</span><div>해석지에서 바로 찾기</div><span>→</span><div>외부 AI에 묻기<br><strong>복사 후 직접 붙여넣기</strong></div><span>→</span><div>답변 검토·저장</div></div>'+
 '<p class="oy-viz-note">해석지 제목 옆 「AI에 묻기」나 보고서 버튼에서 시작합니다. 이 사이트는 자료를 외부 AI로 자동 전송하지 않으며, 서술기록은 실무자가 포함을 선택할 때만 요청문에 들어갑니다.</p></div>';
}
function recordsViz(a,x){
 const plans=a.plans.slice(0,3);
 return '<div class="oy-viz-panel"><h2>기록·점검 · 회차별 실행흐름</h2><div class="oy-viz-path"><div>초기 평가<br><strong>'+esc(x.label)+'</strong></div><span>→</span><div>서비스 실행<br><strong>'+a.plans.length+'개 중 먼저 '+plans.length+'개</strong></div><span>→</span><div>점검·재사정<br><strong>변화 기록</strong></div><span>→</span><div>종결·사후관리<br><strong>목표와 경과 비교</strong></div></div>'+
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
   if(slot){slot.innerHTML=scoreDashboard(objective,s.payload,x);}
   if(all){all.innerHTML=grade(x)+topStats(x,s.payload,false)+(window.OYResultReadout?window.OYResultReadout.html(x,s.payload,{objective:false,scoreTier:objective.tier}):'');}
   return;
  }
  let html='';
  if(s.stage===2&&s.view==='map')html=''; // existing support iframe is the sole map and resource presentation
  else if(s.stage===3)html=caseViz(a,x);
  else if(s.stage===5)html=researchViz();
  else if(s.stage===4)html=recordsViz(a,x);
  host.hidden=!html;host.innerHTML=html;
  last=x;
 }catch(err){host.hidden=false;host.innerHTML='<p role="alert">시각화 모듈 오류: '+esc(err.message||'data error')+'. CORE 결과와 원점수는 유지됩니다.</p>';}
}
window.OYStageInsights=Object.freeze({render,version:'1.0.0'});
function copyAssessment(){
 if(!current?.payload)return;
 if(!document.getElementById('oy-viz-copy-reviewed')?.checked){const status=document.getElementById('oy-viz-copy-status');if(status)status.textContent='민감한 척도 내용의 외부 복사 전에 개인정보 확인 항목을 선택해 주세요.';document.getElementById('oy-viz-copy-reviewed')?.focus();return;}
 const p=current.payload,x=window.OYFiveLevelIndex.analyze({...p,caseContext:''});
 const lines=['오산 청소년 위기징후 평가연계 시스템 · 비식별 AI 분석 요청','CORE 25문항은 변경하지 말고, 보고된 응답에 따라 교사·교육복지사·사회복지사 역할별 지원 방향을 작성해 주세요.','미상은 0점이 아니며 교차영역은 인과관계가 아닙니다. 실제 신고·서비스 제공 여부는 만들지 마세요.',
 '원점수: '+x.raw+'/100 · 미상 '+x.unknown+' · 안전판정: '+x.official.safetyReview,
 '시스템 지원단계: '+(window.OYResultReadout?window.OYResultReadout.tierLine(x):(x.tier?'제'+x.tier+'단계 '+x.label:'단계 미확정'))+' · 개발형 복합지표 '+(x.composite??'미상 확인 후 계산')+(x.tier!==null&&window.OYResultReadout?' · 결정 요인: '+(window.OYResultReadout.decisiveText(x)||'점수 기준'):''),
 'CORE 공식 판정: '+x.official.title,
 '25문항: '+p.answers.map((v,i)=>(i+1)+'번 '+(v==='unknown'?'미상':v+'점')).join(' / '),
 '영역별: '+x.domainRows.map(d=>d.name+' '+d.raw+'/'+d.max+'점').join(' / '),
 '동시응답: '+x.activePairs.slice(0,7).map(t=>t.label+' '+t.strength+'/100').join(' / '),
 '출력: 핵심 상황 3문장 / 학교에서 먼저 3개 / 복지관·공공기관 개입 3개 / 단기 목표 및 변화지표 / 근거·미확인 분리'];
 const text=lines.join('\n\n'),status=document.getElementById('oy-viz-copy-status'),fallback=document.getElementById('oy-viz-copy-text');
 const fail=()=>{if(fallback){fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();}if(status)status.textContent='클립보드가 차단되어 요청문을 표시했습니다. 직접 복사하세요.';};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{if(status)status.textContent='척도와 분석 요청문을 복사했습니다. 개인 AI에 붙여넣으세요.';}).catch(fail);else fail();
}
document.addEventListener('click',e=>{if(e.target.closest('#oy-viz-copy-assessment'))copyAssessment();});
function radarInfo(node){
 const i=Number(node.dataset.radarIndex);
 if(!current?.payload||!Number.isInteger(i))return;
 const x=window.OYFiveLevelIndex.analyze({...current.payload,caseContext:''}).domainRows[i];
 const t=node.closest('.oy-viz-radar')?.querySelector('[data-radar-tooltip]');
 if(t&&x)t.textContent=x.name+' · '+(x.normalized===null?'미상':round(x.normalized)+'%')+' · 응답 '+x.raw+'/'+x.max+'점 · 미상 '+x.unknown+'개';
}
document.addEventListener('pointerover',e=>{const n=e.target.closest?.('[data-radar-index]');if(n)radarInfo(n);});
document.addEventListener('focusin',e=>{const n=e.target.closest?.('[data-radar-index]');if(n)radarInfo(n);});
document.addEventListener('click',e=>{const n=e.target.closest?.('[data-radar-index]');if(n)radarInfo(n);});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const n=e.target.closest?.('[data-radar-index]');if(n){e.preventDefault();radarInfo(n);}}});
window.addEventListener('oy-journey-view',event=>render(event.detail));
})();
