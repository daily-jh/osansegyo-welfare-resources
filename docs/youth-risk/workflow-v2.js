(function(){'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view='plan';
function nav(items,select){const bar=document.createElement('nav');bar.className='workspace-tabs';bar.setAttribute('aria-label','작업 선택');for(const [key,label]of items){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.workView=key;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(key));bar.append(b);}return bar;}
function reportView(key){view=key;document.body.dataset.reportView=key;document.querySelectorAll('.workspace-tabs [data-work-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workView===key)));if(key!=='ai')window.dispatchEvent(new CustomEvent('youth-document-select-v4',{detail:{type:key==='plan'?'plan':'assessment'}}));}
function setupReport(){
 const content=$('examplesContent'),report=$('referenceReport');if(!content||!report)return;
 document.body.classList.add('workspace-v4','report-workspace');
 content.querySelector('.document-switch')?.remove();
 content.querySelector('[aria-label="실무자 관점"]')?.remove();$('roleFocusMessage')?.remove();
 const tabs=nav([['plan','1. 실행계획서'],['conference','2. 사례협의안'],['ai','3. 질문·AI 보완']],reportView);content.prepend(tabs);
 const next=document.createElement('button');next.type='button';next.className='workspace-next';next.textContent='합의·실행 내용 기록하기 →';next.onclick=()=>$('openOptionalRecords')?.click();tabs.after(next);
 const oldNext=$('openOptionalRecords');if(oldNext?.closest('section'))oldNext.closest('section').hidden=true;
 $('copyExamples')?.addEventListener('click',()=>report.querySelectorAll('details').forEach(n=>n.open=true),true);
 window.addEventListener('youth-case-rendered-v2',()=>{window.YouthPresentation?.emphasize(report);});
 reportView('plan');
}
function setupRecords(){const content=$('toolContent');if(!content)return;document.body.classList.add('workspace-v2','record-workspace');const parts=['report','continuitySection','notes','compare','guidance'];function select(key){if(key==='caseForms')window.YouthCaseFormUI?.render();parts.forEach(id=>{if($(id))$(id).hidden=id!==key});document.querySelectorAll('.workspace-tabs [data-work-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workView===key)));$('recordTaskHint').textContent={caseForms:'지원계획의 공통 기록을 활용해 초기상담지와 10대 욕구사정표를 작성합니다.',report:'학생의 바람과 합의할 목표·담당·확인일을 기록하세요.',continuitySection:'실제 문의·의뢰·접수·시작 상태와 생활변화를 구분해 기록하세요.',notes:'관찰·학생 진술·전언의 출처와 시점을 남기세요.',compare:'같은 학생·같은 평가 기준인지 확인하고 생활변화와 함께 비교하세요.',guidance:'필요한 안내만 펼쳐 확인하세요.'}[key];}
 const intro=document.createElement('section');intro.className='workspace-heading';intro.innerHTML='<span>실행 기록 · 변화 점검</span><h2>지금 하려는 작업을 선택하세요</h2><p id="recordTaskHint" role="status"></p><p>새로고침 전 필요한 기록은 복사·인쇄로 보관하세요.</p>';const bar=nav([['report','지원계획'],['continuitySection','실행·회의'],['notes','관찰 기록'],['compare','변화 점검'],['guidance','도움말']],select);content.prepend(intro,bar);const old=content.querySelector('.tool-nav');if(old)old.hidden=true;select('report');content.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1),section=parts.find(key=>$(key)?.contains($(id)));if(section)select(section)});
 const fields=$('planningFields');if(fields){const headings=[...fields.children].filter(n=>n.tagName==='H3');for(const h of headings){const d=document.createElement('details'),summary=document.createElement('summary');d.className='record-fold';summary.textContent=h.textContent;h.before(d);d.append(summary);let next=h.nextSibling;while(next&&!(next.nodeType===1&&next.tagName==='H3')){const following=next.nextSibling;d.append(next);next=following;}h.remove();if(summary.textContent.startsWith('2.')||summary.textContent.startsWith('4.'))d.open=true;}}
 const validation=$('planValidation');if(validation){const d=document.createElement('details'),s=document.createElement('summary');s.textContent='작성 중인 계획의 확인할 항목';d.className='record-fold';validation.before(d);d.append(s,validation);}
 const preview=$('reportPreview');if(preview){const d=document.createElement('details'),s=document.createElement('summary');s.textContent='보고서 미리보기 · 작성 내용 확인';d.className='record-fold';preview.before(d);d.append(s,preview);}
}
document.addEventListener('DOMContentLoaded',()=>{setupReport();setupRecords()});
})();
