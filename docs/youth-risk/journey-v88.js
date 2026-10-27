(function(){'use strict';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,tab='사례사정',resultTab='score',drafts={},draftLabels={},revision=null,preparedSource='',relations=null,persp=null;
const box=document.createElement('section');box.id='journey88';box.className='journey88';box.hidden=true;$('stepTitle').after(box);
const reportText=(p,page,include)=>window.OYModelGateway?.text?window.OYModelGateway.text(p,page,include):OYJourney.text(p,page,include);
const stageName=()=>state.stage===1?'척도 입력':state.stage===2?(state.view==='map'?'지역자원 연계 지도':resultTab==='score'?'척도 해석':resultTab==='narrative'?'서술기록 분석':'통합 사정의견'):state.stage===3?tab:'사례기록·모니터링';
// Three tasks to start with; the rest stay in the plan, folded. An agency named under an earlier task is
// pointed back to, not repeated.
function planTables(a){const head=['지원과제','문항별 근거','단기 첫 1~2주','중장기 생활변화','연계기관 후보'],agencies=x=>[x.candidates.slice(0,2).map(z=>z.name).join(' · '),(x.sharedCandidates||[]).length?'앞 과제와 같은 기관: '+x.sharedCandidates.slice(0,2).join(' · '):''].filter(Boolean).join(' / ')||'교내 조정',row=x=>[x.title,x.evidence.slice(0,3).join(' · '),x.action,x.outcome,(x.candidateMode==='optional'&&x.candidates.length?'선택 후보 · ':'')+agencies(x)],first=a.plans.slice(0,3),rest=a.plans.slice(3);
 return (a.plans.length?'<p class="j88-plan-lead">먼저 시작할 과제 '+first.length+'건'+(rest.length?' · 나머지 '+rest.length+'건은 아래에 접어 두었습니다':'')+'</p>':'')+table(head,first.map(row))+(rest.length?'<details class="j88-plan-rest"><summary>나머지 과제 '+rest.length+'건 보기</summary>'+table(head,rest.map(row))+'</details>':'');}
function table(head,rows){return '<div class="j88-scroll"><table><thead><tr>'+head.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function field(id,label,value='',multiline=false){const key=stageName()+':'+id;draftLabels[key]=stageName()+' · '+label;return '<label>'+esc(label)+(multiline?'<textarea data-draft="'+esc(key)+'" rows="3">'+esc(drafts[key]??value)+'</textarea>':'<input data-draft="'+esc(key)+'" value="'+esc(drafts[key]??value)+'">')+'</label>';}
function statusField(id,label){const key=stageName()+':'+id;draftLabels[key]=stageName()+' · '+label;const options=['검토 전','기관 정보 확인 중','전화·문의 준비','문의 완료 (접수 전)','접수 요청·심사 중','이용 확인','이용 불가·대체자원 필요','연계 보류'];return '<label>'+esc(label)+'<select data-draft="'+esc(key)+'">'+options.map(v=>'<option'+((drafts[key]??'검토 전')===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';}
 function core(a){return '<div class="j88-alert"><strong>'+esc(a.decision.title)+'</strong><p>'+esc(a.decision.safetyReview)+(a.decision.unknownItems.length?' 미상 문항: '+esc(a.decision.unknownItems.join('·'))+'번.':'')+'</p>'+(a.context.needsSafetyAttention?'<p><strong>서술의 안전 단서도 확인해 주세요.</strong> '+(a.context.signals.some(s=>s.safety&&s.subject==='third-party')?'타인에 대한 언급이 포함되어 있습니다. 누구의 상황인지 구분해 확인하세요. ':'')+'현재 위험 여부는 별도 확인이 필요합니다.</p>':'')+'</div>'+(a.high.length?'<p class="j88-high"><strong>총점과 별개로 먼저 살필 문항</strong> '+a.high.map(x=>x.item+'번 '+x.score+'점').join(' · ')+' — 실제 생활 영향과 당장 필요한 지원을 확인하세요.</p>':'');}
function semanticPanel(a){const engine=window.OYCIESemanticV2;if(!engine||!state?.payload?.answers)return '';let x;try{x=engine.interpret(state.payload.answers)}catch(e){return '';}const positive=x.ranked.slice(0,5);const pairs=x.links.slice(0,4);const summary=positive.length?'이번 응답에서 우선 살펴볼 내용은 다음과 같습니다. '+positive.slice(0,3).map(z=>z.id+'번 '+z.topic+'('+z.value+'점): '+z.meaning).join(' / ')+'.':'이번 응답에서 양성으로 보고된 문항은 없습니다. 이것만으로 어려움이나 위험이 없다고 단정할 수 없습니다.';return '<section class="j88-formulation" aria-label="OY-CIE 학술근거 보강 해석"><h3>학생에게 어떤 어려움이 나타날 수 있나요?</h3><p>'+esc(summary)+'</p>'+(x.safety.length?'<p><strong>현재 안전 확인:</strong> '+esc(x.safety.map(z=>z.id+'번 '+z.topic).join(' · '))+' 관련 응답은 총점과 별도로 구체적 상황을 확인해야 합니다.</p>':'')+(pairs.length?'<h4>어려움이 함께 나타난 부분</h4><ul>'+pairs.map(z=>'<li><strong>'+esc(z.a+'번·'+z.b+'번')+'</strong> '+esc(z.meaning)+'. <strong>확인할 점:</strong> '+esc(z.question)+'.</li>').join('')+'</ul>':'<p>현재 설정된 문항 간 연결 가설에 해당하는 공동 보고는 없습니다.</p>')+(x.unknown.length?'<p>미상 '+x.unknown.length+'개는 0점이 아니며 추가 확인이 필요합니다.</p>':'')+'<details><summary>문항별 점수 의미와 기존 해석 비교</summary>'+table(['문항','응답','점수별 의미','실제 확인할 사항'],x.items.map(z=>[z.id+'번 '+z.topic,z.value==='unknown'?'미상':z.value+'점',z.meaning,z.verify.join(' / ')]))+'<p>기존 CORE 원점수·안전판정은 그대로 유지합니다. 이 분석은 국내 청소년 위기스크리닝 척도 개정(2024), 위기극복 역량 검사 타당화(2022), COSMIN 내용타당도, SDQ·C-SSRS의 측정 원리를 참고한 개발 가설입니다. 논문의 절단점·모수는 이 척도에 이식하지 않았습니다. 개별 문항 가중치와 연관 가설은 아직 실증 검증되지 않았습니다.</p></details></section>';}
function interpretation(a){return core(a)+caseBrief(a)+semanticPanel(a)+'<div class="j88-metrics"><article><small>척도 원점수</small><strong>'+esc(a.decision.incomplete?'전체 합계 보류':a.decision.knownTotal+' / 100')+'</strong><span>확인 합계 '+a.decision.knownTotal+' / '+a.decision.knownMaximum+'</span></article><article><small>응답 확인</small><strong>'+a.decision.knownCount+' / 25</strong><span>미상 '+a.decision.unknownItems.length+'개 · 0점과 구분</span></article><article><small>개별 높은 응답</small><strong>'+a.high.length+'개</strong><span>3~4점 문항 · 긴급도 자동 확정 아님</span></article></div><details><summary>영역별 결과 자세히 보기</summary>'+table(['영역','확인 합계 / 확인 최대','최고점','미상','읽는 방법'],a.domains.map(d=>[d.name,d.sum+' / '+d.known*4,d.known?d.peak:'미확인',d.unknown,d.safety?'현재 안전 우선 확인':d.peak>=3?'총점과 별개로 구체적 지원 검토':d.unknown?'전체 영역 판단 보류':d.sum?'생활 영향·지원 희망 확인':'이번 응답에서 보고 없음']))+'</details><details><summary>해석의 근거 자세히 보기</summary><p>동시 응답은 통계적 상관관계나 인과관계를 입증하지 않습니다. 기존 개발 가정 가중치는 지원 검토 순서의 보조정보이며 CORE 점수·안전판정은 바꾸지 않습니다.</p>'+table(['함께 읽을 문항','해석 단서','보조 배수'],a.pairs.map(x=>[x.item+'번 + '+x.other+'번',x.note,x.factor]))+'<p>가중치 모델 '+esc(a.weights.version)+' · 실증 효과 미검증</p></details><details><summary>서술 내용과 확인 근거</summary>'+(a.context.hasContext?'<p><b>기존 지원 언급:</b> '+esc(a.context.fields.existingSupport||'확인된 언급 없음 · 서비스 미이용으로 단정하지 않음')+'</p><p><b>학생 희망·강점:</b> '+esc([a.context.fields.studentWishes,a.context.fields.strengths].filter(Boolean).join(' / ')||'추가 면담 필요')+'</p>'+table(['서술 단서','상태','추가 확인'],a.context.signals.map(s=>[s.clause,s.polarity==='negated'?'부정 표현':s.polarity==='hypothetical'?'가정·예시':s.timeHint==='historical-mention'?'과거 언급':'보고·미확인',s.action]))+table(['대조할 문항','검토사항'],a.context.mismatches.map(x=>[x.items.join('·'),(window.OYResultReadout?window.OYResultReadout.mismatchText(x,state.payload):x.issue)])):'<p>서술이 없으므로 척도 근거로 해석합니다. 심화 분석을 원하시면 평가 입력 화면의 사례 서술을 작성한 뒤 다시 완료해 주세요.</p>')+'</details><h3>첫 면담 질문</h3><ol>'+a.questions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><button class="flow-btn flow-primary" data-j88-map>다음 · 지원연계 맵 확인 →</button>';}
// The map is read for this stage: name it, and what kind of linkage that stage asks for.
function mapSummary(a){let x=null;try{x=window.OYFiveLevelIndex?.analyze(state.payload)}catch(_){}
 const stage=x&&x.tier?'<p class="j88-map-stage"><span>지원 우선순위</span><strong>제'+x.tier+'단계 '+esc(x.label)+'</strong><em>'+esc(x.action)+'</em></p>':'';
 return stage+'<p class="j88-map-intro">지원영역과 기관을 지도에서 확인한 뒤 하단의 <strong>연계 검토 완료 → 종합사정 보기</strong> 버튼으로 04 기관 사례관리에 이동합니다. 학교 담당자는 위쪽의 03 학교 지원을 이용합니다.</p>';}
function caseBrief(a){const engine=window.OYCIESemanticV2;let f;try{f=engine.formulate(state.payload.answers)}catch(_){return '';}const evidence=engine.evidenceAssessment(state.payload.answers),primary=f.scored.filter(x=>x.value>=2).slice(0,4),safety=f.base.safety,co=f.intersections.filter(x=>x.combined>=0.42).slice(0,2);const summary=primary.length?'학생은 '+primary.slice(0,3).map(x=>x.topic+' '+x.value+'점').join(', ')+' 이는 우선 사정할 영역을 뜻하며, 사건의 발생 여부와 실제 생활 영향은 학생과 확인해야 합니다.':'이번 응답에서 뚜렷한 어려움은 보고되지 않았습니다. 실제 생활에서의 불편이나 미확인 사항이 없는지 확인해야 합니다.';const link=co.length?'함께 보고된 어려움으로 '+co.map(x=>x.meaning).join(', ')+'이 있습니다. 두 상황의 발생 시점과 생활 영향이 연결되는지는 아직 확인되지 않았습니다.':'';const urgent=safety.length?'안전 관련 '+safety.map(x=>x.id+'번 '+x.topic).join(', ')+' 응답이 있어 현재 안전한 환경과 보호 필요를 먼저 확인합니다.':'';const questions=primary.slice(0,3).map(x=>x.verify[0]).filter(Boolean);return '<section class="j88-formulation"><h3>학생의 상황과 지원 방향</h3><p>'+esc(summary)+'</p>'+(link?'<p>'+esc(link)+'</p>':'')+(urgent?'<p><strong>안전 확인:</strong> '+esc(urgent)+'</p>':'')+'<p><strong>우선 확인:</strong> '+esc([...new Set(questions)].join(' · ')||'학생이 실제 경험하는 어려움')+'과 학생이 원하는 도움, 이미 연결된 지지자를 면담으로 확인합니다.</p>'+(evidence.developmental.cases.length?'<section class="j88-development"><h3>청소년 발달·생활환경에 따른 사례 해석</h3><p>'+esc(evidence.developmental.summary)+'</p>'+table(['살펴볼 상황','학생의 생활 맥락','면담에서 확인','지원 방향'],evidence.developmental.cases.slice(0,4).map(x=>[x.label,x.development+' '+x.interpretation,x.verify,x.support]))+'<p>위 해석은 연구의 일반 원칙을 적용한 사정 가설이며, 학대·진단·인과관계가 확정된 것은 아닙니다.</p></section>':'')+(evidence.combinations.pairs.length?'<details><summary>문항 간 점수 조합 해석 ('+evidence.combinations.pairCount+'개)</summary>'+table(['함께 보고된 문항','해석','우선 확인'],evidence.combinations.pairs.slice(0,20).map(x=>[x.a+'번 '+x.scores[0]+'점 · '+x.b+'번 '+x.scores[1]+'점',x.meaning,x.verify]))+'<p>동시 응답은 인과관계나 검증된 위험확률을 의미하지 않습니다. 전체 조합은 입력 시 계산하며, 상위 20개를 표시합니다.</p></details>':'')+(evidence.multiDomain.length?'<p><strong>함께 확인할 상황:</strong> '+esc(evidence.multiDomain.slice(0,2).map(x=>x.label+' — '+x.verification).join(' / '))+'</p>':'')+(evidence.alternatives.length?'<p><strong>다른 설명 가능성:</strong> '+esc(evidence.alternatives.slice(0,2).join(' '))+'</p>':'')+(f.unknown.length?'<p><strong>미확인 문항:</strong> '+esc(f.unknown.map(x=>x.id+'번').join(', '))+'은 0점으로 처리하지 않습니다.</p>':'')+'<details><summary>문항별 해석·우선검토 근거</summary>'+table(['문항','응답','점수별 의미','확인 방향','보조 영향값'],f.scored.map(x=>[x.id+'번 '+x.topic,x.value+'점',x.meaning,x.scoreAction,x.impact.toFixed(2)]))+'<p>'+esc(f.assumptions)+'</p></details></section>';}
function kCarrMarkup(a){const k=a.kCarr;if(!k||k.abstain)return '';return '<details class="j88-formulation"><summary>서술형 사례분석 · 추가 확인</summary><p>'+esc(k.situationOverview||'')+'</p><p>'+esc(k.integratedJudgment||'')+'</p><h4>상담에서 확인할 질문</h4><ol>'+((k.nextQuestions||[]).slice(0,5).map(q=>'<li>'+esc(q)+'</li>').join(''))+'</ol><p>서술에 기반한 미확인 가설이며 공식 점수·안전판정과 별개입니다.</p></details>';}
function reviewGuide(a,kind){const e=window.OYCIESemanticV2;let v;try{v=e.interpret(state.payload.answers)}catch(_){return '';}const top=v.ranked.slice(0,4);if(kind==='사례사정')return '<section class="j88-formulation"><h3>사정에서 먼저 확인할 내용</h3>'+caseBrief(a)+'<ol>'+top.map(x=>'<li><strong>'+esc(x.topic)+'</strong>: '+esc(x.meaning)+'. '+esc(x.verify.join(' / '))+'</li>').join('')+'</ol><p>응답은 학생이 경험한 사실을 확정하지 않습니다. 면담으로 확인된 내용과 미확인 가설을 구분해 기록합니다.</p></section>';if(kind==='사례협의')return '<section class="j88-formulation"><h3>회의에서 결정해야 할 사항</h3><p>현재 안전을 먼저 확인하고, 학생의 희망과 실제 생활 영향을 근거로 우선과제 1~3개를 선정합니다. 아래 자동 제안은 회의 결정이 아닙니다.</p><ol>'+top.slice(0,3).map(x=>'<li>'+esc(x.topic)+' — '+esc(x.verify[0])+' 확인 후 담당자·확인일 지정</li>').join('')+'</ol></section>';if(kind==='서비스계획')return '<section class="j88-formulation"><h3>학생에게 필요한 변화를 목표로 설정하세요</h3><p>서비스 횟수보다 학생의 일상이 어떻게 달라질지를 목표로 삼습니다. 기준선·학생 동의·담당·점검일을 정하고, 안전 확인이 필요한 경우 즉시 보호를 우선합니다.</p><ol>'+top.slice(0,3).map(x=>'<li>'+esc(x.topic)+' — '+esc(x.verify[0])+' 확인 → 학생과 합의한 지원 → 변화 점검</li>').join('')+'</ol></section>';return '';}

/* Three independent result views: no CORE rescoring and no narrative leakage into the score-only view. */
// Deep interpretation (OYDeepInterpretation) replaces the common scale report; the older module stays as fallback.
// Narrative and integrated reports (③, 03). Exports pass a narrative-free payload unless the practitioner opts in.
// Exports without the narrative still carry its safety signal types (no wording).
function privatePayload(p){return window.OYNarrativeInterpretation?.redact?window.OYNarrativeInterpretation.redact(p):{...p,caseContext:''}}
function narrativeSafetyLine(){const s=window.OYNarrativeInterpretation?.safetySummary?.(state.payload);return s&&s.safety.length?'서술기록: 안전 관련 표현 있음('+s.safety.map(x=>x.topic).join(', ')+') — 이 결과지는 점수만 반영합니다. 원문은 화면에서, 서술을 함께 반영한 단계는 통합 사정의견에서 확인하고 오늘 안에 직접 안전 면담을 합니다.':''}
function narrReport(kind,p,page){const N=window.OYNarrativeInterpretation;if(!N||!p)return '';try{if(kind==='narrativeHtml'||kind==='narrativeText')return N[kind](N.narrative(p));return N[kind](N.integrate(p),page);}catch(_){return '';}}
// The paged report already places each figure next to the text it explains; print the separate set only without it.
function scorePrint(p){const d=deepReport('html',p);return (/odi-paged/.test(d)?'':figures('html',p))+d;}
function figures(kind,p){const F=window.OYScaleFigures;if(!F||!p)return '';try{return F[kind](F.build(p));}catch(_){return '';}}
// The paged deep report places each figure on the page it belongs to, so the standalone figures article
// is only rendered when the report falls back to its linear form.
function scalePages(p){const deep=deepReport('html',p);return (deep.indexOf('odi-paged')>=0?'':figures('html',p))+deep;}
function deepReport(kind,p){const M=window.OYDeepInterpretation||window.OYCommonScaleReport;if(!M||!p)return '';try{return M[kind](M.build(p));}catch(_){return '';}}
// Each result tab reads as one document: a short route at the top and the same part heading over every block,
// so the paged report, the numbers and the raw scores follow one another instead of standing apart.
const SCORE_PARTS=[['read','해석지 읽기','해석지'],['numbers','숫자로 보기 · 통합지원 5단계와 지표','숫자로 보기'],['raw','원점수 · 25문항 응답','원점수']];
const INTEGRATED_PARTS=[['stage','지원 단계와 판단 근거','지원 단계'],['opinion','통합 사정의견서','사정의견서'],['raw','기존 분석 근거','분석 근거']];
function partRoute(parts){return '<ol class="j88-route" aria-label="이 탭의 읽는 순서">'+parts.map((p,i)=>'<li><button type="button" data-j88-part="'+p[0]+'"><b>'+(i+1)+'</b><span>'+esc(p[2])+'</span></button></li>').join('')+'</ol>';}
function partHead(parts,id,deck,note){const i=parts.findIndex(p=>p[0]===id);return '<header class="j88-part" id="j88-part-'+id+'"><p class="j88-part-no">'+(i+1)+' / '+parts.length+'</p><h3>'+esc(parts[i][1])+(note?' <small>'+esc(note)+'</small>':'')+'</h3>'+(deck?'<p>'+esc(deck)+'</p>':'')+'</header>';}
function resultScorePage(a){
 const d=a.decision;
 return '<section class="j88-result-pane j88-flow" aria-label="척도 해석"><p class="j88-view-note">25문항 응답만으로 읽은 해석입니다. 사례관리 수준과 개입계획은 서술기록까지 합쳐 통합 사정의견에서 정합니다. CORE 원점수와 공식 안전판정은 바뀌지 않습니다.</p>'
 +partRoute(SCORE_PARTS)
 +partHead(SCORE_PARTS,'read','생활 주제별로 나눈 해석지입니다. 장을 넘기며 읽고, 마지막 장에서 숫자로 이어집니다.')
 +scalePages(state.payload)
 +partHead(SCORE_PARTS,'numbers','해석지의 단계와 영역을 숫자와 그래프로 다시 봅니다.','개발형 보조지표')+'<div id="oy-index-visual-slot"></div>'
 +partHead(SCORE_PARTS,'raw','CORE 원점수와 문항별 응답입니다. 필요할 때 펼쳐 확인합니다.')
 +'<details class="j88-raw-accordion"><summary>원점수 · 25문항 상세 결과 펼치기</summary><div class="j88-metrics"><article><small>CORE 원점수</small><strong>'+esc(d.incomplete?'판정 보류':d.knownTotal+' / 100')+'</strong><span>미상 '+d.unknownItems.length+'개는 0점 처리하지 않습니다.</span></article>'
 +'<article><small>확인한 문항</small><strong>'+d.knownCount+' / 25</strong><span>미상·응답별 확인 상태 구분</span></article>'
 +'<article><small>3~4점 응답</small><strong>'+a.high.length+'개</strong><span>높은 개별 응답만 집계</span></article></div>'
 +'<div class="j88-alert"><strong>CORE 안전판정</strong><p>'+esc(d.safetyReview)+'</p></div>'
 +'<h3>10개 평가 영역별 원점수</h3>'
 +table(['영역','확인 합계 / 확인 최대','미상','기록 상태'],a.domains.map(x=>[x.name,x.known?x.sum+' / '+(x.known*4):'확인자료 없음',x.unknown?x.unknown+'개':'없음',x.known?'문항별 응답 확인':'추가 확인 필요']))
 +'<h3>25문항 개별 응답</h3>'+table(['문항','점수','상태'],state.payload.answers.map((value,i)=>[(i+1)+'번',value==='unknown'?'미상':value+'점',value==='unknown'?'미확인':'응답 확인']))
 +'<p>CORE 응답은 5단계 보조지표와 별도로 보존합니다.</p></details></section>';
}
function resultNarrativePage(a){
 const v=window.OYNarrativeStructure?.interpret(state.payload);
 const report=narrReport('narrativeHtml',state.payload);
 if(!v?.present)return '<section class="j88-result-pane">'+(report||'<h3>서술기록 분석</h3><p>서술기록이 입력되지 않았습니다. 척도 응답만으로 위기단계와 학교·복지 개입 방향을 확인할 수 있습니다.</p>')+'</section>';
 const sections=v.paragraphs.map(p=>'<section class="j88-narrative-section"><h4>단락 '+p.number+' · '+esc(p.topic)+'</h4><p>'+esc(p.source)+'</p><div class="j88-narrative-tags"><span>연관 영역 · '+esc(p.areas.join('·')||'별도 영역 없음')+'</span><span>문항 · '+esc(p.items.map(n=>n+'번').join('·')||'별도 대응문항 없음')+'</span></div></section>').join('');
 return '<section class="j88-result-pane"><p class="j88-view-note">서술기록을 출처·생활영역·척도 교차검토로 분석합니다. 서술은 척도 원점수와 CORE 안전판정을 바꾸지 않습니다.</p>'+report
 +'<details class="j88-raw-accordion"><summary>문장 구조 분석 원자료 펼치기</summary>'
 +'<h3>단락별 생활상황</h3>'+sections
 +'<h3>문장별 근거 · 문항·영역 대응</h3>'
 +table(['문장','실제 서술','문항별 점수','해석 영역·상태'],v.sentences.slice(0,35).map(x=>[x.id,x.text,x.scores.join(' · ')||'직접 연결 문항 없음',x.areas.join(' · ')+' / '+x.status]))
 +'<h3>영역별 서술 보강</h3>'
 +(v.themes.length?table(['해석 주제','연결 문장','문항 점수'],v.themes.map(x=>[x.name,x.sentences.join('·'),x.scores.join(' · ')])):'<p>현재 서술에서 문항과 직접 연결되는 핵심 표현은 추출되지 않았습니다.</p>')
 +(a.context.mismatches?.length?'<h3>기존 대조 규칙 결과</h3>'+table(['관련 문항','원점수·서술 대조'],a.context.mismatches.map(x=>[x.items.join('·')+'번',(window.OYResultReadout?window.OYResultReadout.mismatchText(x,state.payload):x.issue)])):'')
 +(a.kCarr&&!a.kCarr.abstain?'<h3>K-CARR 서술형 통합 사정</h3><p>'+esc(a.kCarr.situationOverview||'')+'</p><p>'+esc(a.kCarr.integratedJudgment||'')+'</p>':'')
 +'</details></section>';
}
function systemOutcome(a){
 const x=window.OYFiveLevelIndex?.analyze(state.payload);
 if(!x)return '';
 const top=x.domainRows.filter(d=>d.raw>0).sort((u,v)=>v.normalized-u.normalized||v.raw-u.raw).slice(0,3);
 const school=[1,3,8].some(i=>x.domainRows[i].raw>0);
 const family=[6,7].some(i=>x.domainRows[i].raw>0);
 const pathway=x.official.urgent||x.safetyFloor>=4?'현재 안전 확인 우선 → 학교·기관 보호체계 병행':school&&family?'학교 내 학맞통 + 복지관 통합사례관리 병행':school?'학교 내 학생맞춤통합지원 중심':family?'복지관·공공지원 연계 중심':'응답 영역별 개별지원과 변화 점검';
 return '<section class="j88-operational-summary" aria-label="시스템 종합 판정">'
 +'<span>OY-RALS · 시스템 분석 결과</span><h3>'+esc(x.tier?'제'+x.tier+'단계 '+x.label:(window.OYResultReadout?window.OYResultReadout.tierLine(x):'단계 미확정 · 확인된 문항 우선'))+'</h3>'
 +'<dl><div><dt>핵심 지원축</dt><dd>'+esc(top.map(d=>d.name).join(' · ')||'이번 응답에서 양성 문항 보고 없음')+'</dd></div>'
 +'<div><dt>교차 특성</dt><dd>'+esc(x.activePairs.slice(0,3).map(z=>z.label).join(' · ')||'설정된 복합패턴 동시 양성 없음')+'</dd></div>'
 +'<div><dt>우선 실행</dt><dd>'+esc(x.tier===null?'확인된 어려움부터 지원하면서 미상 문항을 확인합니다':x.action)+'</dd></div>'
 +'<div><dt>CORE 공식 판정</dt><dd>'+esc(x.official.title)+'</dd></div>'
 +'<div><dt>권장 진행체계</dt><dd>'+esc(pathway)+'</dd></div></dl>'
 +'<small>기준: 현재 입력된 25문항 및 선택 서술로 산출한 지원우선순위. 실제 발생 사실·진단·행정적 서비스 이용 결정을 대신하지 않습니다.</small></section>';
}
function resultIntegratedPage(a){
 return '<section class="j88-result-pane j88-flow"><p class="j88-view-note">척도 응답과 서술기록을 함께 분석한 통합 사정의견입니다. 공식 점수와 CORE 안전판정은 바뀌지 않습니다.</p>'
 +partRoute(INTEGRATED_PARTS)
 +partHead(INTEGRATED_PARTS,'stage','이 사례가 몇 단계인지와 그 단계가 나온 이유입니다.')
 +systemOutcome(a)+'<div id="oy-integrated-visual-slot"></div>'
 +partHead(INTEGRATED_PARTS,'opinion','단계를 바탕으로 개입 수준, 주관기관, 개입계획을 정리한 의견서입니다.')
 +narrReport('integratedHtml',state.payload)
 +partHead(INTEGRATED_PARTS,'raw','이전 모델의 원자료와 대조 규칙입니다. 필요할 때 펼쳐 확인합니다.')
 +'<details class="j88-raw-accordion"><summary>기존 분석 근거 전체 보기 · 척도 원자료·대조 규칙·종합사정</summary>'+interpretation(a)
 +(a.context.mismatches?.length?'<h3>정량·서술 불일치 검토</h3>'+table(['관련 문항','해석 차이·확인 필요'],a.context.mismatches.map(x=>[x.items.join(' · '),(window.OYResultReadout?window.OYResultReadout.mismatchText(x,state.payload):x.issue)])):'')
 +'<h3>종합사정 및 지원 방향</h3>'+integratedSections(a)
 +(a.cieActions?.length?'<h3>OY-CIE 근거·추가 확인과제</h3>'+table(['가설','근거','확인 질문'],a.cieActions.slice(0,8).map(x=>[x.hypothesis,x.evidence.join(' · ')||'서술·미상 확인',x.verification])):'')
 +'</details></section>';
}
function resultViews(a){
 const menu=[['score','척도 해석','25문항 응답으로 읽은 해석'],['narrative','서술기록 분석','관찰·면담 기록을 문장별로'],['integrated','통합 사정의견','척도와 서술을 함께 본 종합']];
 return '<nav class="j88-tabs j88-result-tabs" aria-label="척도 평가 결과별 분석">'+menu.map(([id,label,sub])=>'<button type="button" data-j88-result-tab="'+id+'" aria-pressed="'+(id===resultTab)+'"><strong>'+label+'</strong><small>'+sub+'</small></button>').join('')+'</nav>'
 +(resultTab==='score'?resultScorePage(a):resultTab==='narrative'?resultNarrativePage(a):resultIntegratedPage(a));
}

function caseJudgment(a){
 const positive=i=>a.domains[i]&&a.domains[i].sum>0;
 const anySchool=[1,3,8].some(positive),anyFamily=[6,7].some(positive);
 const combined=anySchool&&anyFamily;
 const rows=[
  ['현재 안전·보호 절차',a.decision.safetyReview,'위험·신고의무·연락 안전성은 총점과 별도 확인'],
  ['학교 내부 지원',anySchool?'학습·출결·또래·지지 관련 응답을 중심으로 학교 안에서 지원 가능한 과제 검토':'학생의 일상과 학교 내 보호요인을 면담으로 확인','학생 희망, 기존 담임·상담 지원, 수업·출결 조정 가능성'],
  ['학생맞춤통합지원',combined?'학교생활과 가족·돌봄·경제 상황이 함께 보고되어 다기관 협의 적합성을 검토':'지원체계 간 조정 필요 여부를 사정 후 검토','교내 협의 절차, 동의·정보공유 범위, 중복서비스 여부'],
  ['복지관 통합사례관리',anyFamily?'돌봄·기본생활의 실제 미충족 욕구 및 지속지원 필요성 검토':'가구 사정과 지속적인 외부지원 필요 여부 추가 확인','학생·가구의 동의, 관할, 기존 사례관리 담당기관'],
  ['전문기관 지원',a.high.length?'3~4점 문항이 있어 영역별 전문평가·지원 필요성 검토':'실제 기능저하·안전상황 확인 후 검토','진단 단정 금지, 기관의 이용조건·접수 가능 여부 확인']
 ];
 return '<section class="j88-formulation j88-case-decision"><h3>사례판정 · 지원체계 검토</h3><p>아래는 학맞통과 복지관 사례관리 기준을 참고한 <strong>지원경로 검토안</strong>이며 공식 선정·사례관리 개시 판정이 아닙니다. 한 사례에 여러 경로가 병행될 수 있습니다.</p>'+
 table(['검토 경로','검토 이유','확인 및 결정 기준'],rows)+
 '<p>판정·담당자의 실제 기록은 기관 사례관리 기록에 옮겨 적습니다.</p>'+
 
 '<p>긴급 보호는 학맞통·복지관 의뢰 회의나 서식 작성을 기다리지 않고 사안별 보호 절차를 따릅니다.</p></section>';
}
function caseProcess(){
 return '<section class="j88-formulation"><h3>학맞통·복지관 통합사례관리 진행안</h3>'+
 table(['진행 단계','실행·검토 사항','완료 기준'],[
 ['1. 현재 안전 확인','담당 교사가 학생·보호자와 접촉 안전성을 확인하고 사안별 긴급조치·신고 절차 검토','안전확인·조치 결과를 담당자가 기록'],
 ['2. 학생 면담·욕구사정','학생의 우선순위·강점·동의와 학교·가정의 실제 어려움 및 기존 지원 확인','보고 사실과 미확인 가설 분리'],
 ['3. 학교 내 협의','담임·Wee·교육복지 담당의 학교 내 실행 가능한 지원과 학맞통 협의 검토','교내 주관 담당·회의 결정 기록'],
 ['4. 외부기관 연계·조정','복지관·행정복지센터·전문기관의 대상·관할·실제 접수 조건 확인','문의·신청·이용 상태 구분 기록'],
 ['5. 목표별 개입·점검','학생과 합의한 단기·중장기 변화 목표, 담당자, 시작일, 점검주기 관리','기준선·목표·진행실적·생활변화 기록'],
 ['6. 재사정·종결·사후관리','변화된 점수·생활상황·학생 의견을 비교하고 지원 조정 및 종결 여부 협의','재사정 날짜, 종결·사후 점검 계획 기록']
 ])+
 '<p>연계 결정·재사정 기록은 기관 사례관리 기록에 옮겨 적습니다.</p>'+
 '</section>';
}
function forms(a){const tabs='<div class="j88-tabs" role="group" aria-label="사정·협의·계획 화면">'+[['사례사정','통합사정·사례판정'],['서비스계획','개입계획 수립'],['사례협의','사례회의·진행관리'],['기관별 실무자료','기관별 실무자료 · 출력']].map(([t,label])=>'<button data-j88-tab="'+t+'" aria-pressed="'+(tab===t)+'">'+label+'</button>').join('')+'</div>';
 let body='';if(tab==='사례사정')body=core(a)+reviewGuide(a,'사례사정')+caseJudgment(a)+a.sections.map((s,i)=>'<details'+(i===0?' open':'')+'><summary>'+esc((i+1)+'. '+s.title)+'</summary><p>'+s.text.split(/\n\n+/).map(esc).join('</p><p>')+'</p></details>').join('')+table(['지원과제·현재 근거','교사·교육복지사 실행','사회복지사·지역지원 실행','변화 확인 기준'],a.plans.slice(0,6).map(x=>[
 x.title+' · '+x.evidence.slice(0,2).join(' / '),
 x.safetyCheck?'오늘 안에 학생과 직접 안전 면담 후 결과 기록':x.domain===3?'출결·수업을 조정하고 학맞통 협의':x.domain===1?'교내 피해 노출 차단과 안전 동선 마련':x.domain===2?'교내 지지교사·Wee 상담 연결':x.domain===6?'학교생활과 학생 돌봄부담 조정':x.domain===7?'기본생활 부족에 대응하는 학교지원 연결':'수업·일상 참여 조정과 교내 담당 지정',
 x.safetyCheck?'확인 결과에 따라 보호절차·연계 여부 결정':x.domain===7?'식사·주거·비용지원 기관을 하나의 계획으로 연결':x.domain===6?'가족 돌봄 공백 시간에 맞는 서비스 조정':x.domain===2?'정서지원 전문기관과 역할 분담':'가정·복지관·지역기관 지원을 협의',
 x.outcome||'실행 상태·생활변화 점검']))+'<details><summary>근거 원장 · 문항·서술·출처·시점</summary>'+table(['ID','종류','입력 근거','출처·시점','상태'],a.ledger.map(e=>[e.id,e.kind,e.text??e.value,e.source+' / '+e.time,e.status]))+'</details><section id="j88-relations"><h3>가계도·생태도 통합 초안</h3><div id="j88-rel-svg">'+OYRelations.svg(relations)+'</div><details><summary>관계·동거·이용 상태 편집</summary><div id="j88-rel-editor">'+OYRelations.editor(relations)+'</div></details></section>';
 if(tab==='사례협의')body=caseProcess()+reviewGuide(a,'사례협의')+'<div class="j88-case-next"><button type="button" class="flow-btn flow-primary" data-case-to-record>사례협의 결정·점검 작성 →</button></div>';
 if(tab==='서비스계획')body='<section class="j88-cie-handoff"><h3>서비스계획 · 실행 추천</h3><p>문항·서술 근거에 따라 단기 실행과 중장기 변화를 제시했습니다. 실제 이행·목표 수정은 기관 사례관리 기록에 남깁니다.</p></section>'+
 planTables(a)+
 '<div class="j88-case-next"><button type="button" class="flow-btn flow-primary" data-case-to-record>개입 기록·점검 단계로 이동 →</button></div>';
 if(tab==='AI 연구·지원설계')body=caseBrief(a)+'<section class="j88-cie-handoff"><h3>OY-CIE · 지원계획 연구 작업실</h3><p>현재 평가의 근거를 OY-CIE 자체 엔진으로 질문하고 후속 분석하는 선택 기능입니다. 생성형 GPT가 아니라 자체 규칙·검색 기반 추론이며 결과는 담당자 확인 전 가설입니다.</p><h4>1. 현재 근거와 우선 검토</h4>'+core(a)+table(['해석 가설','문항 근거','확인 질문'],a.cieActions.slice(0,5).map(x=>[x.hypothesis,x.evidence.join(' · ')||'서술·미상 확인',x.verification]))+'<h4>2. 지원계획 설계 요청</h4><p>학생 희망·지원 장벽·질문을 정리한 뒤 OY-CIE 대화형 연구실에서 추가 질문을 이어가세요.</p>'+field('researchWish','학생이 원하는 변화 · 직접 확인된 내용','',true)+field('researchBarrier','지원이 어려운 실제 장벽 · 확인된 사실','',true)+field('researchQuestion','AI에 심화 검토를 요청할 핵심 질문','',true)+'<h4>3. 계획을 결정하기 전에</h4><p>학생 동의·현재 안전·기존 지원·기관 접수조건을 확인하고, 목표의 기준선·담당·점검일을 합의합니다. AI의 답변은 시스템에 자동 반영되지 않습니다.</p><div class="j88-buttons"><button type="button" class="flow-btn flow-primary" data-j88-lab>OY-CIE 연구 분석 실행 ↗</button></div><p>연구 분석 실행은 현재 25문항과 안전 확인 정보만 별도 작업실로 전달합니다. 서술·이름·작성 메모는 자동 전송하지 않습니다. 연구 작업실은 질문과 답변을 대화 형태로 표시합니다. 입력된 질문은 외부 GPT로 전송되지 않습니다.</p><p><a href="cie-lab-v32/" target="_blank" rel="noopener noreferrer">OY-CIE 연구 작업실 자세히 보기 ↗</a></p></section>';
 if(tab==='기관별 실무자료')return tabs+'<p class="j88-map-intro">복지관·아동가족기관·행정복지센터가 이 사례를 받았을 때 바로 쓰는 자료입니다. 화면에서 누르거나 적고, 필요한 묶음만 출력합니다. 적은 내용은 저장되지 않습니다.</p><div id="j88-persp-slot"></div>';
 const unresolved=a.pendingDomains?.length?'<details><summary>미상 응답만 있는 영역 · 실행계획과 분리 ('+a.pendingDomains.length+'개)</summary>'+table(['영역','추가 확인할 문항','상태'],a.pendingDomains.map(d=>[d.name,d.unknownItems.map(n=>n+'번').join(' · '),'확인 전 · 지원 불필요로 단정하지 않음']))+'</details>':'';
  const integrated=['사례사정','서비스계획','사례협의'].includes(tab)?narrReport('caseHtml',state.payload,tab):'';
  return tabs+integrated+unresolved+body+'<p>이 화면은 실무자 검토용 초안입니다. 실제 면담·회의 결정·서비스 제공 여부를 확인하고, 새로고침 전 PDF로 저장하세요. 작성 메모와 선택 서술은 별도 동의 없이 기본 출력에 포함되지 않습니다.</p>';}
function renderContent(){if(!state?.ready||!state.payload||state.stage===1||state.stage===5||state.stage===6){box.hidden=true;return;}box.hidden=false;const a=window.OYModelGateway?.analyze?window.OYModelGateway.analyze(state.payload):OYJourney.analyze(state.payload);if(!relations)relations=OYRelations.seed(a);box.innerHTML=(state.stage===2?'':'<div class="j88-heading"><span>OY-RALS · '+esc(stageName())+'</span><h2>'+(state.stage===3?'기관 사례관리 · 사례개념화·개입계획':'사례기록·모니터링')+'</h2></div>')+'<div id="j88-content">'+(state.stage===2?(state.view==='map'?mapSummary(a):resultViews(a)):state.stage===3?forms(a):'<p>아래에서 실제 상담·계획 조정·변화 점검을 기록합니다. 기록을 수정하면 AI 요청문을 다시 생성해 주세요. 평가·결과 해석·지원연계는 기록 작성 없이 이용할 수 있습니다.</p>')+'</div>'+((state.stage===2&&state.view==='result'&&resultTab==='integrated'||state.stage===3)?kCarrMarkup(a):'')+(state.stage===2||state.stage===3?'<div class="j88-top-actions"><button type="button" class="flow-btn flow-primary" id="j88-print-quick">현재 결과 PDF · 인쇄</button><button type="button" class="flow-btn" id="j88-integrated-quick">통합 사례보고서 PDF</button></div>':'')+'<details class="j88-tools"><summary>결과 저장 · 개인 AI로 더 살펴보기</summary><label>원하는 결과 서식<select id="j88-format"><option>현재 페이지 결과지</option><option>기관 사례보고서</option><option>사례협의 회의안</option><option>서비스계획서</option><option>기관 의뢰서</option></select></label><label>추가 서식 요구사항<textarea id="j88-instructions" rows="2" maxlength="2000" placeholder="예: 기관 양식의 항목 순서, 표 구성, 분량"></textarea></label><label><input type="checkbox" id="j88-context"> 서술 기반 심화 해석·원문·작성 메모 포함 (기본 제외)</label><button class="flow-btn" id="j88-prepare">AI 요청문 미리보기</button><textarea id="j88-prompt" rows="9" readonly aria-label="AI 요청문 미리보기"></textarea><label><input type="checkbox" id="j88-permission"> 요청문의 개인정보와 소속기관의 외부 AI 이용 기준을 확인했습니다.</label><div class="j88-buttons"><button class="flow-btn" data-ai="copy" disabled>요청문 복사</button><button class="flow-btn" data-ai="chatgpt" disabled>복사 + ChatGPT 열기 ↗</button><button class="flow-btn" data-ai="claude" disabled>복사 + Claude 열기 ↗</button><button class="flow-btn" data-ai="gemini" disabled>복사 + Gemini 열기 ↗</button></div><p>AI 페이지를 연 뒤 직접 붙여넣어 주세요. 로그인된 대화나 AI 답변을 이 사이트가 자동으로 읽지는 않습니다.</p><div class="j88-buttons"><button class="flow-btn" id="j88-print">현재 화면 인쇄·PDF 저장</button><button class="flow-btn" id="j88-download">현재 결과 TXT 저장</button><button class="flow-btn flow-primary" id="j88-integrated">통합보고서 인쇄·PDF 저장</button></div><p>PDF는 브라우저 인쇄에서 ‘PDF로 저장’을 선택합니다. 요청하신 기관 서식으로 재작성하려면 AI에 실제 양식을 함께 제공해 주세요.</p><p id="j88-status" role="status"></p></details>';
 const ps=$('j88-persp-slot');if(ps){if(!persp||persp.dataset.rev!==String(revision)){persp=document.createElement('div');persp.className='j88-persp';persp.dataset.rev=String(revision);persp.innerHTML=window.OYPerspective?window.OYPerspective.render('agency',state.payload):'<p>기관별 실무자료를 불러오지 못했습니다. 새로고침 후 다시 열어 주세요.</p>';}ps.replaceWith(persp);}
 if($('j88-rel-editor')){const editor=$('j88-rel-editor');editor.oninput=()=>{relations=OYRelations.read(editor);$('j88-rel-svg').innerHTML=OYRelations.svg(relations);invalidate();};editor.onclick=e=>{const del=e.target.closest('[data-remove-relation]'),add=e.target.closest('[data-add-relation]');if(del||add){relations=OYRelations.read(editor);if(del)relations.splice(+del.dataset.removeRelation,1);else if(relations.length<40)relations.push({kind:'family',label:'',status:'관계 언급·미확인',cohabit:false,source:''});editor.innerHTML=OYRelations.editor(relations);$('j88-rel-svg').innerHTML=OYRelations.svg(relations);invalidate();}};}
 box.querySelectorAll('[data-draft]').forEach(el=>{const remember=()=>{drafts[el.dataset.draft]=el.value;invalidate();};el.addEventListener('input',remember);if(el.tagName==='SELECT')el.addEventListener('change',remember);});
 box.querySelectorAll('[data-j88-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.j88Tab;render();box.querySelector('[data-j88-tab][aria-pressed="true"]').focus({preventScroll:true});});
 box.querySelectorAll('[data-j88-result-tab]').forEach(b=>b.onclick=()=>{resultTab=b.dataset.j88ResultTab;render();window.OYStageInsights?.render(state);box.querySelector('[data-j88-result-tab][aria-pressed="true"]')?.focus({preventScroll:true});});
 box.querySelectorAll('[data-j88-part]').forEach(b=>b.onclick=()=>box.querySelector('#j88-part-'+b.dataset.j88Part)?.scrollIntoView({behavior:'smooth',block:'start'}));
 box.querySelector('[data-j88-lab]')?.addEventListener('click',()=>{const lab=window.open('cie-lab-v32/?from=assessment','_blank');if(!lab){alert('팝업이 차단되었습니다. 브라우저에서 새 창을 허용해 주세요.');return;}const answers=state.payload.answers.slice();const followups={...state.payload.followups};const explicit=Array.isArray(state.payload.explicit)?state.payload.explicit.slice():[];const handler=e=>{if(e.origin!==location.origin||e.source!==lab||e.data?.type!=='oy-cie-lab-ready')return;window.removeEventListener('message',handler);lab.postMessage({type:'oy-cie-assessment-handoff',answers,followups,explicit},location.origin);};window.addEventListener('message',handler);});
 box.querySelector('[data-j88-research]')?.addEventListener('click',()=>{const tools=box.querySelector('.j88-tools');tools.open=true;tools.scrollIntoView({behavior:'smooth',block:'nearest'});$('j88-format').value='서비스계획서';$('j88-instructions').value='OY-CIE 연구 작업실: 근거 문항별 가설과 반증 질문을 제시하고, 학생 희망·강점·기존 지원·접근 장벽을 대조한 뒤 우선순위 3개, 안전 조치, 단기 1~2주 및 중장기 1~3개월 목표, 담당·기준선·측정 지표·점검일을 제안하세요. 미확인 사실을 확정하지 말고 대안 가설과 추가 질문을 포함하세요.';invalidate();});
 box.querySelector('[data-j88-map]')?.addEventListener('click',()=>document.querySelector('[data-oy-step="2"]').click());
  box.querySelectorAll('[data-case-to-record]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-oy-step="5"]')?.click()));
 for(const id of ['j88-format','j88-context','j88-instructions'])$(id).addEventListener('input',invalidate);
 $('j88-prepare').onclick=()=>{const extra=$('j88-instructions').value;const packet='가능하면 작성 결과를 다운로드 가능한 PDF로 제공하고, 사용자가 요구한 서식도 지원하는 파일 형식으로 제공하세요. 아래 자료를 바탕으로 '+$('j88-format').value+' 초안을 한국어로 작성하세요. 현재 단계: '+stageName()+'. 사실·해석·미확인을 구분하고 점수·안전판정을 변경하지 마세요. 가중치를 검증된 상관·위험확률로 표현하지 마세요. 미상은 0점이 아닙니다. 신규 의뢰보다 기존 지원과 역할을 조정하되 안전 대응을 지연하지 마세요. 담당·동의·회의결정·서비스 이용·성과를 만들어내지 마세요.\n서식 요구: '+extra+'\n\n'+exportText();$('j88-prompt').value=OYPrivacyGuardV87.inspect(packet).redacted;preparedSource=exportText();$('j88-permission').checked=false;enable();$('j88-status').textContent='자동 가림은 완전하지 않습니다. 실제 전달할 내용을 검토해 주세요.';};
 $('j88-permission').onchange=enable;
 box.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{if(b.disabled)return;if(preparedSource!==exportText()){invalidate();$('j88-status').textContent='기록이 변경되었습니다. AI 요청문을 다시 생성해 주세요.';return;}const urls={chatgpt:'https://chatgpt.com/',claude:'https://claude.ai/',gemini:'https://gemini.google.com/'};if(urls[b.dataset.ai])window.open(urls[b.dataset.ai],'_blank','noopener,noreferrer');const fallback=()=>{$('j88-prompt').focus();$('j88-prompt').select();$('j88-status').textContent='자동 복사가 제한되었습니다. 선택된 요청문을 직접 복사해 붙여넣어 주세요.';};if(navigator.clipboard?.writeText)navigator.clipboard.writeText($('j88-prompt').value).then(()=>$('j88-status').textContent='요청문을 복사했습니다. AI 화면에 붙여넣어 실행해 주세요.').catch(fallback);else fallback();});
 $('j88-download').onclick=()=>{const url=URL.createObjectURL(new Blob([exportText()],{type:'text/plain;charset=utf-8'}));const l=document.createElement('a');l.href=url;l.download='OY-RALS-'+stageName()+'-V'+OYJourney.VERSION+'.txt';l.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
 $('j88-print').onclick=()=>print(false);$('j88-integrated').onclick=()=>print(true);box.querySelector('#j88-print-quick')?.addEventListener('click',()=>print(false));box.querySelector('#j88-integrated-quick')?.addEventListener('click',()=>print(true));
}
function render(){
 try{return renderContent()}catch(error){
  box.hidden=false;
  box.innerHTML='<div class="j88-alert" role="alert"><strong>이 단계의 결과를 표시하지 못했습니다.</strong><p>입력된 평가 점수와 안전판정은 수정되지 않았습니다. 평가 결과를 먼저 확인하거나 다시 시도해 주세요. 같은 문제가 반복되면 관리자가 연결된 분석 모듈을 점검해야 합니다.</p><button class="flow-btn" type="button" data-j88-retry>다시 표시</button> <button class="flow-btn" type="button" data-j88-return>평가 결과로 이동</button></div>';
  box.querySelector('[data-j88-retry]').onclick=()=>render();
  box.querySelector('[data-j88-return]').onclick=()=>document.querySelector('[data-stage="2"]')?.click();
  if(typeof console!=='undefined')console.error('OY-RALS model stage unavailable',error?.name||'Error');
 }
}
function invalidate(){preparedSource='';$('j88-prompt').value='';$('j88-permission').checked=false;enable();}
function enable(){box.querySelectorAll('[data-ai]').forEach(b=>b.disabled=!$('j88-permission').checked||!$('j88-prompt').value);}
function resultExport(){
 const g=window.OYModelGateway;
 const includeRaw=$('j88-context').checked;
 // Narrative-derived content leaves the screen only when the practitioner opts in.
 const p=includeRaw?state.payload:privatePayload(state.payload);
 const a=g?.analyze?g.analyze(p):OYJourney.analyze(p);
 const escapePrivate=t=>{try{return window.OYPrivacyGuardV87?.inspect(String(t??'')).redacted||String(t??'')}catch(_){return String(t??'')}};
 const base=['OY-RALS · '+stageName()+' · 실무자 검토 전 초안','분석 근거: CORE 25문항 · 공식 안전판정 원본 보호','모델: '+(g?.VERSION||OYJourney.VERSION),'미상은 0점으로 계산하지 않으며, 이 도구의 실증적 타당도는 검증되지 않았습니다.'];
 if(resultTab==='score'){
  if(narrativeSafetyLine())base.push(narrativeSafetyLine());
  if(deepReport('text',p))base.push(deepReport('text',p));
  if(figures('text',p))base.push(figures('text',p));
  base.push('원점수: '+(a.decision.incomplete?'전체판정 보류':' '+a.decision.knownTotal+' / 100'));
  base.push('응답: '+a.decision.knownCount+'/25 · 미상 '+a.decision.unknownItems.join('·'));
  base.push('공식 안전확인: '+a.decision.safetyReview);
  base.push('10개 영역별 응답 점수');
  a.domains.forEach(d=>base.push(d.name+': '+(d.known?d.sum+'/'+(d.known*4):'모두 미상')+' · 미상 '+d.unknown+'개'));
  base.push('25문항: '+p.answers.map((v,i)=>(i+1)+'번 '+(v==='unknown'?'미상':v+'점')).join(' / '));
  base.push('CORE와 독립된 개발형 통합지원 5단계 지표');
  const ix=window.OYFiveLevelIndex?.analyze({...p,caseContext:'',narrativeRedacted:null});const R=window.OYResultReadout,rr=ix&&R?R.analyze(ix,p):null;
  if(ix)base.push('CORE 공식 판정: '+ix.official.title,'통합지원 단계: '+(R?R.tierLine(ix):(ix.tier?'제'+ix.tier+'단계 '+ix.label:'단계 미확정'))+' / 지표 '+(ix.composite===null?'미상 확인 후 계산':ix.composite+'/100')+' / 실행: '+(ix.tier===null?'확인된 어려움부터 지원하면서 미상 문항 확인':ix.action),
   ...(rr?['이 단계가 나온 이유: '+rr.drivers.map(d=>d.title+(d.decisive?'(결정)':'')+' — '+d.text).join(' / ')]:[]),
   ...(rr&&rr.checks.length?['먼저 확인할 것: '+rr.checks.slice(0,8).map(c=>c.text).join(' / ')]:[]),
   '가중 응답강도 '+ix.weighted+' · 영역 동시응답 '+ix.crossScore+' · 핵심 안전문항 '+ix.criticalScore+' · 서술 '+(p.caseContext?.trim()?'척도 해석에서 제외 · 통합 사정의견에 반영':state.payload.caseContext?.trim()?'출력에서 제외':'미입력'),
   '안전 우선 상향: '+(ix.safetyReason||'해당 없음'),'개발형 분류 · 실증 타당도 미검증');
 }else if(resultTab==='narrative'){
  base.push('서술형 분석은 점수 및 안전판정을 수정하지 않습니다.');
  if(includeRaw&&narrReport('narrativeText',p))base.push(narrReport('narrativeText',p));
  if(!includeRaw&&state.payload.caseContext?.trim())base.push('서술 기반 해석은 기본 출력에서 제외했습니다. ‘서술 기반 심화 해석·원문·작성 메모 포함’을 선택한 경우에만 포함합니다.');
  else if(!a.context.hasContext)base.push('서술 입력 없음 · 해석 보류');
  else {
   Object.entries(a.context.fields||{}).filter(([k,v])=>typeof v==='string'&&v.trim()).forEach(([k,v])=>base.push('서술항목 '+(({situation:'학생 상황',observations:'관찰·상담기록',studentWishes:'학생 희망',strengths:'강점·보호요인',existingSupport:'기존 지원',urgentNeeds:'긴급 필요'})[k]||k)+': '+escapePrivate(v)));
   (a.context.signals||[]).slice(0,25).forEach(x=>base.push('맥락 단서: '+escapePrivate(x.clause)+' / '+x.polarity+' / 확인: '+escapePrivate(x.action)));
   if(a.kCarr&&!a.kCarr.abstain)base.push('K-CARR 가설: '+escapePrivate(a.kCarr.integratedJudgment||''));
   if(includeRaw)base.push('서술 원문(비식별 검사·실무자 확인 필수): '+escapePrivate(p.caseContext||''));
  }
 }else{
  if(narrReport('integratedText',p))base.push(narrReport('integratedText',p));
  const idx=window.OYFiveLevelIndex?.analyze(p);
  if(idx)base.push('시스템 지원우선순위: '+(idx.tier?'제'+idx.tier+'단계 '+idx.label:'응답자료 미완료')+' / '+idx.action,
    '교차 지원축: '+idx.activePairs.slice(0,4).map(pair=>pair.label).join(' · '));
  base.push('공식 점수: '+(a.decision.incomplete?'전체판정 보류':a.decision.knownTotal+'/100'),'안전확인: '+a.decision.safetyReview);
  a.sections.filter(x=>['학생 상황 요약','강점·보호요인·기존 지원','상황을 함께 이해하기 · 잠정 해석과 지도 방향','종합사정 및 우선순위','근거·미확인·확인 계획'].includes(x.title)).forEach(x=>base.push(x.title+'\n'+escapePrivate(x.text)));
  (a.context.mismatches||[]).forEach(x=>base.push('척도·서술 대조: '+x.items.join('·')+'번 / '+escapePrivate(x.issue)));
  if(includeRaw&&p.caseContext)base.push('선택 서술 원문: '+escapePrivate(p.caseContext));
  else if(!includeRaw&&state.payload.caseContext?.trim())base.push('출력 범위: 척도 중심 통합 사정의견 · 서술에 따른 해석은 제외됨');
  base.push('선택된 가설과 우선지원은 실무자·학생이 검토 후 결정합니다.');
 }
 base.push('기획·개발·저작권: 김지훈 · 오산세교종합사회복지관');
 return base.join('\n\n');
}
function exportText(){if(state.stage===2&&state.view==='result')return resultExport();let t=reportText($('j88-context').checked?state.payload:privatePayload(state.payload),stageName(),$('j88-context').checked);if(state.stage===3){const c=narrReport('caseText',$('j88-context').checked?state.payload:privatePayload(state.payload),tab);if(c)t=c+'\n\n'+t;}if($('j88-context').checked)t+='\n\n작성 메모(실무자 입력):\n'+Array.from(box.querySelectorAll('[data-draft]')).map(el=>el.closest('label').firstChild.textContent+' = '+el.value).join('\n');if($('j88-context').checked&&relations?.length)t+='\n\n관계·지지체계(실무자 검토 초안):\n'+relations.map(n=>n.label+' / '+n.status+(n.cohabit?' / 동거 확인':' / 동거 미확인')+' / 근거: '+n.source).join('\n');if($('j88-context').checked&&state.stage===4){const f=Array.from($('recordFrames').querySelectorAll('iframe')).find(f=>!f.hidden);const doc=f?.contentDocument;if(doc)t+='\n\n선택 기록 화면의 실무자 입력:\n'+Array.from(doc.querySelectorAll('textarea,input:not([type=password]):not([type=file]),select')).filter(el=>el.value&&el.id&&!el.hidden).map(el=>(doc.querySelector('label[for="'+el.id+'"]')?.textContent||el.getAttribute('aria-label')||el.id)+' = '+el.value).join('\n');}return t;}
function print(integrated=false){const old=$('j88-print-root');old?.remove();const el=document.createElement('section');el.id='j88-print-root';const include=$('j88-context').checked;let text=integrated?['사례사정','사례협의','서비스계획'].map(page=>'■ '+page+'\n'+reportText(include?state.payload:privatePayload(state.payload),page,include)).join('\n\n━━━━━━━━━━━━━━━━\n\n'):exportText();if(integrated&&include)text+='\n\n실무자 작성 메모\n'+Object.entries(drafts).map(([k,v])=>(draftLabels[k]||k)+' = '+v).join('\n');el.innerHTML='<h1>'+esc(integrated?'통합 사례관리 보고서':stageName())+'</h1><p>V'+esc(OYJourney.VERSION)+' · '+new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})+' · 실무자 확인 전 초안</p><pre>'+esc(text)+'</pre>';let handoff=null;if(window.OYPracticeHandoff){const safe=include?state.payload:privatePayload(state.payload),scoreOnly=!integrated&&state.stage===2&&state.view==='result'&&resultTab==='score';try{handoff={a:window.OYModelGateway.analyze(safe),x:window.OYFiveLevelIndex.analyze(scoreOnly?{...safe,caseContext:'',narrativeRedacted:null}:safe)};}catch(_){const note=document.createElement('p');note.textContent='구조화 보고서를 만들지 못해 텍스트 결과로 인쇄합니다. 공식 점수와 안전판정은 변경되지 않았습니다.';el.append(note);}}if(handoff){const {a,x}=handoff;if(integrated){el.querySelector('pre')?.remove();el.insertAdjacentHTML('beforeend',window.OYPracticeHandoff.report(a,x));if(include){const notes=document.createElement('section');const heading=document.createElement('h2');heading.textContent='6. 실무자 작성 메모';notes.append(heading);for(const [k,v] of Object.entries(drafts)){const p=document.createElement('p');p.textContent=(draftLabels[k]||k)+' : '+v;notes.append(p);}el.append(notes);}}else if(state.stage===2&&state.view==='result'&&resultTab==='score'){el.querySelector('pre')?.remove();el.insertAdjacentHTML('beforeend',window.OYPracticeHandoff.score(a,x));const line=narrativeSafetyLine();if(line){const note=document.createElement('p');note.className='j88-print-alert';note.textContent=line;el.querySelector('h1+p')?.after(note);}}}const safeP=include?state.payload:privatePayload(state.payload),onResult=state.stage===2&&state.view==='result';const extra=integrated||onResult&&resultTab==='integrated'?narrReport('integratedHtml',safeP):onResult&&resultTab==='narrative'&&include?narrReport('narrativeHtml',safeP):onResult&&resultTab==='score'?scorePrint(state.payload):'';if(extra){el.insertAdjacentHTML('beforeend',extra);el.querySelectorAll('.oy-deep-report details,.common-scale-report details').forEach(d=>d.open=true);}const vis=integrated?(document.querySelector('#oy-index-visual-slot .oy-viz-grade')||document.querySelector('#oy-integrated-visual-slot .oy-viz-grade')):(document.querySelector('#oy-index-visual-slot .oy-viz-dashboard')||document.querySelector('#oy-integrated-visual-slot .oy-viz-grade')||document.querySelector('#oy-viz-stage-v1 .oy-viz-panel'));if(vis&&include&&state.stage!==4){const wrap=document.createElement('section');wrap.className='oy-viz';wrap.append(vis.cloneNode(true));el.append(wrap);}if(include&&(integrated||tab==='사례사정'&&state.stage===3)){const d=document.createElement('section');d.innerHTML='<h2>가계도·생태도</h2>'+OYRelations.svg(relations||[]);el.append(d);}if(state.stage===2&&state.view==='map'){const svg=$('mapArea').querySelector('iframe')?.contentDocument?.querySelector('#diagram svg');if(svg)el.append(svg.cloneNode(true));}document.body.append(el);document.body.classList.add('j88-printing');window.print();}
window.addEventListener('afterprint',()=>{document.body.classList.remove('j88-printing');$('j88-print-root')?.remove();});
window.OYJourneyUI={exportSnapshot:()=>({revision,drafts:{...drafts},draftLabels:{...draftLabels},relations:relations?relations.map(n=>({...n})):[]})};
 window.addEventListener('oy-journey-view',e=>{state=e.detail;if(state.payload?.flowRevision!==revision){drafts={};draftLabels={};relations=null;resultTab='score';tab='사례사정';revision=state.payload?.flowRevision;}render();});
})();

