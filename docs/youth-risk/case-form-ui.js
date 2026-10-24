(function(){'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let payload=null,mode='intake';const linked=new Map();
const extra=[['referral','의뢰·접수 경위'],['family','가정·가족·돌봄'],['health','건강'],['housing','주거'],['income','경제 · 수입'],['expense','경제 · 지출'],['debt','경제 · 부채'],['asset','경제 · 재산'],['economicOther','경제 · 기타'],['relationships','사회심리·관계']];
function field(key,label){return '<label for="form-'+key+'">'+label+'</label><textarea id="form-'+key+'" rows="2" maxlength="1200" placeholder="출처·확인일과 확인된 사실을 기록하세요. 모르면 비워 두셔도 됩니다."></textarea>';}
function collect(){const f={};for(const [k]of extra)f[k]=$('form-'+k)?.value||'';for(let i=0;i<10;i++)for(const k of ['needWish','needStrength','needView','needPriority'])f[k+i]=$('form-'+k+i)?.value||'';for(const [k,id]of Object.entries({date:'reviewDate',safety:'safetyAction',wish:'studentWish',strengths:'strengths',support:'currentSupport',access:'accessNeeds',view:'assessmentView',next:'actionPlan'}))f[k]=$(id)?.value||'';return f;}
function current(){return YouthCaseForms.build(payload,collect());}
function display(v){return YouthCaseForms.missing(v)?'<span class="form-unwritten" aria-label="미확인">—</span>':esc(v);}
function render(){
 if(!payload||!$('caseFormPreview'))return;
 const x=current(),progress=YouthCaseForms.progress(x);
 $('caseFormProgress').textContent='작성 현황 · 초기상담 '+progress.intakeWritten+'/'+progress.intakeTotal+'항목 · 욕구사정 '+progress.needsWritten+'/10영역. 작성 여부이며 사실 확인·합의 완료를 뜻하지 않습니다.';
 const screening=x.screening.filter(g=>g.evidence.length||g.unknown.length);
 const body=mode==='intake'?'<dl class="form-intake-grid">'+x.intake.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd class="preserve">'+display(value)+'</dd></div>').join('')+'</dl>':
 x.needs.map((n,i)=>{const written=[n.wish,n.strength,n.assessment,n.priority].some(v=>!YouthCaseForms.missing(v)),canLink=!YouthCaseForms.missing(n.wish)||!YouthCaseForms.missing(n.priority);
 return '<section class="form-need-card"><details '+(written?'open':'')+'><summary><span>'+esc(n.name)+'</span><small>'+(written?'작성 내용 있음':n.evidence.length?'면담 단서 있음':n.unknown.length?'미상 확인 필요':'추가 면담 전')+'</small></summary><p>'+esc(n.reported)+(n.unknown.length?' / 관련 미상 '+n.unknown.join('·')+'번':'')+'</p><dl class="form-need-values">'+[['제시된 욕구',n.wish],['강점·활용 자원',n.strength],['실무자 사정',n.assessment],['목표·우선순위 검토안',n.priority]].map(([k,v])=>'<div><dt>'+k+'</dt><dd class="preserve">'+display(v)+'</dd></div>').join('')+'</dl><button type="button" class="btn form-plan-transfer" data-transfer-need="'+i+'" '+(canLink?'':'disabled')+'>이 욕구를 지원계획에 가져오기</button></details></section>';}).join('');
 $('caseFormPreview').innerHTML='<h2>'+(mode==='intake'?'초기상담지':'욕구조사(사정)표')+' · 작성 초안</h2><p class="draft-label">기관 양식 구조를 활용한 청소년용 초안 · 원양식과 최종 대조 필요</p><p>'+esc(x.scaleNotice)+'</p><p class="form-legend"><strong>— = 미확인</strong> · 면담에서 확인할 항목입니다. 빈칸을 어려움 없음으로 해석하지 않습니다.</p><p class="response-priority '+(x.decision.urgent?'form-priority-safety':x.decision.incomplete||x.decision.pendingChecks.length||x.decision.safetyUnknown.length?'form-priority-pending':'')+'"><strong>평가 기준의 검토 방향: '+esc(x.decision.title)+'</strong></p><details class="form-screening"><summary>면담 준비 · 평가 응답의 단서와 미상</summary>'+(screening.length?screening.map(g=>'<p><b>'+esc(g.name)+'</b> · '+esc(g.evidence.join(' · ')||'확인된 점수 없음')+(g.unknown.length?' / 미상 '+g.unknown.join('·')+'번':'')+'</p>').join(''):'<p>이번 응답에서 점수화된 어려움·미상은 없습니다. 학생이 바라는 도움은 면담에서 확인합니다.</p>')+'</details>'+body;
 window.YouthPresentation?.emphasize($('caseFormPreview'));
}
function transfer(index){
 try{
  const x=current(),block=YouthCaseForms.proposal(x,index),target=$('additionalPlan'),old=linked.get(index),marker='[욕구사정 연결 · '+x.needs[index].name+']';
  if(!target)throw Error('지원계획 입력란을 찾을 수 없습니다.');
  let next;
  if(old&&target.value.includes(old))next=target.value.replace(old,block);
  else if(target.value.includes(marker))throw Error('이 영역의 지원계획에 직접 수정한 내용이 있습니다. 기존 문구를 확인해 조정해 주세요. 덮어쓰지 않았습니다.');
  else next=(target.value.trim()?target.value.trimEnd()+'\n\n':'')+block;
  if(next.length>target.maxLength)throw Error('추가·통합 목표의 입력 한도를 넘습니다. 기존 계획을 정리한 뒤 다시 가져와 주세요.');
  target.value=next;linked.set(index,block);target.dispatchEvent(new Event('input',{bubbles:true}));
  $('caseFormStatus').textContent=x.needs[index].name+' 욕구를 지원계획의 추가·통합 목표에 반영했습니다. 합의·담당·기한은 학생과 확인해 주세요.';
 }catch(e){$('caseFormStatus').textContent=e.message;}
}
function init(p){
 payload=p;if($('caseForms')){render();return;}
 const section=document.createElement('section');section.id='caseForms';section.className='panel tool-section';section.hidden=true;
 section.innerHTML='<h2>초기상담·욕구사정 작성</h2><p>학생 희망·강점·안전조치·기존 지원은 지원계획의 기록을 함께 사용합니다. <strong>실명·연락처·상세주소 없이 작성하며 현재 탭에만 유지됩니다.</strong></p><div class="tool-actions" role="group" aria-label="출력 양식"><button type="button" class="btn" data-case-form="intake" aria-pressed="true">초기상담지</button><button type="button" class="btn" data-case-form="needs" aria-pressed="false">욕구사정표</button><button type="button" class="btn" id="copyCaseForm">현재 양식 복사</button><button type="button" class="btn" id="printCaseForm">현재 양식 인쇄·PDF</button></div><div class="tool-actions"><button type="button" class="btn" id="editSharedCase">공통 기록 입력·수정</button><button type="button" class="btn" id="openLinkedPlan">연결한 지원계획 보기</button></div><p id="caseFormStatus" role="status"></p><details class="record-fold"><summary>초기상담의 추가 확인 내용 입력</summary>'+extra.map(([k,l])=>field(k,l)).join('')+'</details><details class="record-fold"><summary>10대 욕구영역별 사정 입력</summary>'+YouthCaseForms.needs.map((name,i)=>'<details><summary>'+name+'</summary>'+[['needWish','학생·가족이 제시한 욕구'],['needStrength','강점·활용 자원'],['needView','실무자 사정 · 근거·확인사항'],['needPriority','학생과 합의할 목표·우선순위']].map(([k,l])=>field(k+i,l)).join('')+'</details>').join('')+'</details><p id="caseFormProgress" role="status"></p><article id="caseFormPreview" class="report-preview"></article>';
 $('toolContent').append(section);
 section.addEventListener('input',render);
 section.addEventListener('click',e=>{const b=e.target.closest('[data-transfer-need]');if(b)transfer(Number(b.dataset.transferNeed));});
 section.querySelectorAll('[data-case-form]').forEach(b=>b.onclick=()=>{mode=b.dataset.caseForm;section.querySelectorAll('[data-case-form]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
 $('copyCaseForm').onclick=async()=>{render();try{await navigator.clipboard.writeText(YouthCaseForms.text(current(),mode));$('caseFormStatus').textContent='접힌 영역을 포함한 현재 양식 전체를 복사했습니다.';}catch{$('caseFormPreview').querySelectorAll('details').forEach(d=>d.open=true);const r=document.createRange();r.selectNodeContents($('caseFormPreview'));const s=window.getSelection();s.removeAllRanges();s.addRange(r);$('caseFormStatus').textContent='전체 내용을 펼쳐 선택했습니다. 복사 메뉴를 이용하세요.';}};
 $('printCaseForm').onclick=()=>{render();document.body.dataset.printCaseForm='true';try{window.print();}finally{delete document.body.dataset.printCaseForm;}};
 function showShared(id){document.querySelector('[data-work-view="report"]')?.click();const target=$(id);if(target){let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.focus();target.scrollIntoView({block:'center',behavior:'smooth'});}}
 $('editSharedCase').onclick=()=>showShared('studentWish');$('openLinkedPlan').onclick=()=>showShared('additionalPlan');
 render();
}
window.YouthCaseFormUI={init,render};
})();
