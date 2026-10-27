/* OY-RALS ask panel v1: "AI에 묻기" buttons on interpretation sections and reports, and one side panel.
   Quick answers come from the deep interpretation already on screen. Anything beyond that is copied as a short prompt
   and opened in the practitioner's own AI service; nothing is sent automatically and answers stay in this tab only. */
(function(){'use strict';
const M=window.OYAskModel,D=window.OYDeepInterpretation,N=window.OYNarrativeInterpretation;
const host=document.getElementById('journey88');
if(!M||!D||!host||document.getElementById('oy-ask-panel'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const redact=s=>{try{return window.OYPrivacyGuardV87?.inspect(String(s)).redacted||String(s)}catch(_){return String(s)}};
const AI={chatgpt:['ChatGPT','https://chatgpt.com/'],claude:['Claude','https://claude.ai/new'],gemini:['Gemini','https://gemini.google.com/app']};
const SKIP=new Set(['glance','profile','code','validity']);
let current=null,revision=null,ctx=null,lastFocus=null;

const panel=document.createElement('aside');panel.id='oy-ask-panel';panel.className='oy-ask';panel.hidden=true;
panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','oy-ask-title');
panel.innerHTML='<header class="oy-ask-head"><div><small id="oy-ask-where"></small><h2 id="oy-ask-title">AI에 묻기</h2></div><button type="button" class="oy-ask-close" aria-label="닫기">×</button></header>'+
'<div class="oy-ask-body"><p class="oy-ask-safety" id="oy-ask-safety" hidden>안전 확인이 필요한 응답이 있습니다. 외부 AI에 묻기 전에 학생의 현재 안전부터 직접 확인하세요.</p>'+
'<section class="oy-ask-step"><h3>해석지에서 바로 찾기</h3><div class="oy-ask-chips" id="oy-ask-chips"></div><div class="oy-ask-found" id="oy-ask-found" hidden><h4></h4><div class="oy-ask-text"></div></div></section>'+
'<section class="oy-ask-step"><h3>외부 AI에 묻기</h3>'+
'<label class="oy-ask-field" id="oy-ask-task-row">작성할 문서<select id="oy-ask-task">'+Object.entries(M.TASKS).map(([k,v])=>'<option value="'+k+'">'+esc(v.label)+'</option>').join('')+'</select></label>'+
'<label class="oy-ask-field"><span id="oy-ask-q-label">질문</span><textarea id="oy-ask-q" rows="3" maxlength="800"></textarea></label>'+
'<div class="oy-ask-opts"><label id="oy-ask-ev-row"><input type="checkbox" id="oy-ask-evidence"> 25문항 응답도 함께 보내기</label><label id="oy-ask-narr-row" hidden><input type="checkbox" id="oy-ask-narr"> 서술기록 내용 포함</label></div>'+
'<details class="oy-ask-preview"><summary>보낼 요청문 보기 <span id="oy-ask-len"></span></summary><textarea id="oy-ask-prompt" rows="10" readonly aria-label="외부 AI 요청문"></textarea></details>'+
'<label class="oy-ask-confirm"><input type="checkbox" id="oy-ask-ok"> 요청문에 학생을 알아볼 수 있는 정보가 없고, 소속기관의 외부 AI 이용 기준을 확인했습니다.</label>'+
'<div class="oy-ask-open">'+Object.entries(AI).map(([k,v])=>'<button type="button" data-ask-open="'+k+'">'+v[0]+' ↗</button>').join('')+'<button type="button" data-ask-open="copy">복사만</button></div>'+
'<p class="oy-ask-hint">누르면 요청문이 복사되고 새 탭이 열립니다. 입력창에 붙여 넣어 질문하세요. 이 사이트는 자료를 자동으로 보내지 않습니다.</p></section>'+
'<section class="oy-ask-step"><h3>받은 답변 정리</h3><textarea id="oy-ask-answer" rows="6" maxlength="60000" aria-label="외부 AI 답변" placeholder="외부 AI 답변을 붙여 넣고, 사실과 다르거나 확인되지 않은 부분을 고치세요."></textarea>'+
'<div class="oy-ask-row"><button type="button" class="flow-btn" id="oy-ask-copy-answer">답변 복사</button></div><p class="oy-ask-hint">답변은 이 창을 닫으면 사라집니다. 필요하면 복사해 기관 기록에 옮기세요.</p></section>'+
'<p class="oy-ask-status" id="oy-ask-status" role="status"></p></div>';
document.body.append(panel);

const $=id=>document.getElementById(id);
const status=t=>{$('oy-ask-status').textContent=t;};
const payload=()=>current?.payload||null;
const narrativePresent=()=>Boolean(String(payload()?.caseContext||'').trim());
// Scale-only report: the narrative never reaches quick answers or prompts unless the practitioner opts in.
const scaleReport=()=>D.build({...payload(),caseContext:''});

function reportKind(article){
 if(article.classList.contains('onr-integrated'))return '통합 사정의견';
 if(article.classList.contains('onr-case'))return '03 통합사정 요약';
 if(article.classList.contains('onr-report'))return '서술기록 분석';
 return '척도 해석';
}
function sectionKey(sec){const m=[...sec.classList].find(c=>c.startsWith('odi-s-'));return m?m.slice(6):'';}
function sectionTitle(sec){const h=sec.querySelector('h3');if(!h)return '';const c=h.cloneNode(true);c.querySelectorAll('.odi-num,.oy-ask-btn').forEach(n=>n.remove());return c.textContent.trim();}
function sectionDomText(sec){const c=sec.cloneNode(true);c.querySelectorAll('.oy-ask-btn,.odi-num').forEach(n=>n.remove());return c.innerText||c.textContent||'';}

function defaultTask(){
 if(!current)return 'integrated';
 if(current.stage===2)return current.view==='map'?'map':'integrated';
 if(current.stage===3){const t=host.querySelector('[data-j88-tab][aria-pressed="true"],[data-j88-tab].active');return t?.dataset.j88Tab==='서비스계획'?'plan':'assessment';}
 if(current.stage===4)return 'record';
 return 'integrated';
}

function decorate(){
 host.querySelectorAll('.oy-deep-report .odi-sec').forEach(sec=>{
  const key=sectionKey(sec),h=sec.querySelector('h3');
  if(!key||SKIP.has(key)||!h||h.querySelector('.oy-ask-btn'))return;
  const b=document.createElement('button');b.type='button';b.className='oy-ask-btn';b.dataset.askSection=key;b.textContent='AI에 묻기';
  b.setAttribute('aria-label',sectionTitle(sec)+' · AI에 묻기');h.append(b);
 });
 if(current?.ready&&current.stage>=2&&current.stage<=4&&!host.querySelector('.oy-ask-doc')){
  let row=host.querySelector('.j88-top-actions');
  if(!row){row=document.createElement('div');row.className='j88-top-actions';(host.querySelector('.j88-heading')||host.firstElementChild)?.after(row);}
  const b=document.createElement('button');b.type='button';b.className='flow-btn oy-ask-doc';b.textContent='AI로 보고서 작성·보완 ↗';row.append(b);
 }
 const tools=host.querySelector('.j88-tools > summary');
 if(tools&&!tools.dataset.oyAsk){tools.dataset.oyAsk='1';tools.textContent='결과 저장 · 내보내기';}
}
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer.disconnect();try{decorate()}finally{observer.observe(host,{childList:true,subtree:true})}});});
observer.observe(host,{childList:true,subtree:true});

function sourceText(){
 const r=scaleReport(),narr=$('oy-ask-narr').checked&&narrativePresent();
 if(ctx.mode==='document')return narr&&N?N.integratedText(N.integrate(payload())):D.text(r);
 const live=ctx.sec&&ctx.sec.isConnected?ctx.sec:null;
 if(ctx.onr&&(narr||!narrativePresent())&&live)return sectionDomText(live);
 return D.sectionText(r,ctx.key);
}
function buildPrompt(){
 if(!ctx||!payload())return '';
 try{
  return M.prompt({mode:ctx.mode,r:scaleReport(),section:ctx.key,sectionTitle:ctx.where+' · '+ctx.title,sectionText:sourceText(),
   question:$('oy-ask-q').value,task:$('oy-ask-task').value,includeEvidence:$('oy-ask-evidence').checked,redact});
 }catch(e){status('요청문을 만들지 못했습니다: '+(e?.message||'자료 오류'));return '';}
}
function refresh(){
 const text=buildPrompt();$('oy-ask-prompt').value=text;$('oy-ask-len').textContent=text?'('+text.length.toLocaleString('ko-KR')+'자)':'';
 $('oy-ask-ok').checked=false;
}

function open(next){
 if(!current?.ready||!payload())return;
 ctx=next;lastFocus=document.activeElement;
 const r=scaleReport(),doc=ctx.mode==='document';
 $('oy-ask-where').textContent=ctx.where;$('oy-ask-title').textContent=doc?'AI로 보고서 작성·보완':ctx.title;
 $('oy-ask-safety').hidden=!(r.summary.safety!=='이번 응답의 안전 신호 없음');
 $('oy-ask-chips').innerHTML=M.faqFor(doc?'report':ctx.key).map(f=>'<button type="button" data-ask-faq="'+f.id+'">'+esc(f.label)+'</button>').join('');
 $('oy-ask-found').hidden=true;
 $('oy-ask-task-row').hidden=!doc;if(doc)$('oy-ask-task').value=ctx.task||defaultTask();
 $('oy-ask-ev-row').hidden=doc;$('oy-ask-evidence').checked=false;
 $('oy-ask-narr-row').hidden=!narrativePresent()||!(doc||ctx.onr);$('oy-ask-narr').checked=false;
 $('oy-ask-q-label').textContent=doc?'추가 요청 (선택)':'질문';
 $('oy-ask-q').value='';$('oy-ask-q').placeholder=doc?'예: 기관 양식 순서에 맞춰 A4 두 장 이내로':'예: 이 부분을 담임교사에게 어떻게 설명하면 좋을까요?';
 $('oy-ask-answer').value='';status('');
 refresh();panel.hidden=false;document.body.classList.add('oy-ask-open');
 $('oy-ask-q').focus();
}
function close(){panel.hidden=true;document.body.classList.remove('oy-ask-open');ctx=null;if(lastFocus?.isConnected)lastFocus.focus();}

document.addEventListener('click',e=>{
 const sb=e.target.closest?.('.oy-ask-btn');
 if(sb){const sec=sb.closest('.odi-sec'),art=sb.closest('.oy-deep-report');
  open({mode:'section',key:sb.dataset.askSection,title:sectionTitle(sec),where:reportKind(art),onr:art.classList.contains('onr-report'),sec});return;}
 const db=e.target.closest?.('.oy-ask-doc');
 if(db){open({mode:'document',key:'report',title:'보고서',where:'보고서 출력물',task:db.dataset.askTask});}
});
panel.querySelector('.oy-ask-close').addEventListener('click',close);
panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
$('oy-ask-chips').addEventListener('click',e=>{
 const b=e.target.closest('[data-ask-faq]');if(!b)return;
 const a=M.answer(scaleReport(),b.dataset.askFaq),f=$('oy-ask-found');
 f.querySelector('h4').textContent=a.title;f.querySelector('.oy-ask-text').textContent=a.text;f.hidden=false;
 $('oy-ask-chips').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
});
['oy-ask-q','oy-ask-task','oy-ask-evidence','oy-ask-narr'].forEach(id=>$(id).addEventListener(id==='oy-ask-q'?'input':'change',refresh));

async function copyText(text,area){
 try{await navigator.clipboard.writeText(text);return true;}
 catch(_){if(area){area.closest('details')?.setAttribute('open','');area.focus();area.select();}return false;}
}
panel.querySelector('.oy-ask-open').addEventListener('click',e=>{
 const b=e.target.closest('[data-ask-open]');if(!b)return;
 if(!$('oy-ask-ok').checked){status('복사하기 전에 개인정보 확인 항목을 선택해 주세요.');$('oy-ask-ok').focus();return;}
 const text=$('oy-ask-prompt').value;if(!text)return;
 // Start the copy inside the click, then open the AI home page (no case data in the URL).
 const copied=copyText(text,$('oy-ask-prompt'));
 const target=AI[b.dataset.askOpen];if(target)window.open(target[1],'_blank','noopener,noreferrer');
 copied.then(ok=>status(ok?(target?target[0]+' 탭을 열었습니다. 입력창에 붙여 넣으세요(Ctrl+V).':'요청문을 복사했습니다.'):'자동 복사가 막혀 요청문을 선택해 두었습니다. 직접 복사해 주세요.'));
});
$('oy-ask-copy-answer').addEventListener('click',async()=>{const t=$('oy-ask-answer').value.trim();if(!t)return status('붙여 넣은 답변이 없습니다.');status(await copyText(t,$('oy-ask-answer'))?'답변을 복사했습니다.':'답변을 선택해 두었습니다. 직접 복사해 주세요.');});

window.addEventListener('oy-journey-view',e=>{
 current=e.detail;
 const rev=current?.payload?.flowRevision;
 if(rev!==revision){revision=rev;if(!panel.hidden)close();}
 if(!current?.ready&&!panel.hidden)close();
 requestAnimationFrame(decorate);
});
window.OYAskPanel=Object.freeze({open,close});
})();
