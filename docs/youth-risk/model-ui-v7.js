(function(){'use strict';let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function review(p,target){if(!target)return;const ticket=++serial;target.querySelector('#v7ContextReview')?.remove();
 if(!window.YouthModelsV7.text(p))return;
 const box=document.createElement('details');box.id='v7ContextReview';box.className='v7-local-review';box.dataset.localContext='true';box.innerHTML='<summary>선택 사례정보 · 점수와 대조할 내용</summary><p role="status">V7.0 모델 검토 중…</p>';target.append(box);
 try{const x=await YouthModelsV7.analyze(p);if(ticket!==serial||!box.isConnected)return;
 const notices=x.score.notices.filter(n=>n.code!=='SCORE_SAFETY_SIGNAL'&&n.code!=='INCOMPLETE_ASSESSMENT');
 const meaningful=notices.some(n=>n.priority==='must-review'||n.priority==='must-verify');
 box.innerHTML='<summary>선택 사례정보 · '+(meaningful?'우선 확인할 차이·안전 단서 있음':'문맥·근거 검토')+'</summary><p>입력한 글에서 찾은 미확인 단서입니다. 문항점수·기존 안전판정은 유지합니다. 이 묶음은 기본 복사·인쇄에서 제외됩니다.</p>'+(notices.length?'<ul>'+notices.map(n=>'<li>'+esc(YouthModelsV7.notice(n))+'</li>').join('')+'</ul>':'')+'<h4>시점·정보원별 문장</h4><ul>'+x.score.analysis.base.context.units.slice(0,8).map(u=>'<li><b>'+esc(({negative:'부정',historical:'과거',hearsay:'전언',hypothetical:'가정',uncertain:'미확인','reported-unverified':'보고됨·미확인'})[u.status]||u.status)+'</b> · '+esc(u.excerpt)+'</li>').join('')+'</ul><h4>계획 전 확인</h4><ul>'+x.management.draftGoals.filter(g=>g.reviewContext.length).slice(0,3).map(g=>'<li>'+esc(g.domainName)+': '+esc(g.question)+'</li>').join('')+'</ul><p>ICSI / K-CARR / ICMS V7.0 · 정규식·규칙 및 문장 검색 기반 · 임상적 타당도 미검증</p>';
 box.dataset.ready='true';box.open=false;
 }catch(e){if(ticket===serial&&box.isConnected)box.querySelector('p').textContent='추가 모델 검토를 불러오지 못했습니다. 기존 평가·계획은 유지됩니다. '+e.message;}
}
window.YouthV7UI={records:p=>review(p,document.getElementById('recordInterpretationV2')),assessment:p=>review(p,document.getElementById('summary')||document.getElementById('resultBody'))};
window.addEventListener('youth-case-rendered-v2',e=>review(e.detail.payload,document.getElementById('executionEvidence')));
window.addEventListener('youth-v7-invalid',()=>{serial++;document.getElementById('v7ContextReview')?.remove()});
})();
