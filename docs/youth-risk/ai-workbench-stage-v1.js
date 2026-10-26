/* OY-RALS research workspace v1: evidence selection and AI handoff.
   Works with existing OY-CIE V3.2 rules/retrieval. Not a trained language model.
   No network calls beyond the separately loaded same-origin research corpus.
   Neither rewrites CORE responses nor commits case decisions. */
(function(){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const anchor=document.getElementById('cie-flow-v32');
const host=document.getElementById('journey88');
if(!anchor||!host||document.getElementById('oy-ai-workbench-stage'))return;
const root=document.createElement('section');root.id='oy-ai-workbench-stage';root.className='oy-ai-workbench';root.hidden=true;
root.setAttribute('aria-label','현재 사례의 AI 연구 작업실');
root.innerHTML='<header><span class="oy-ai-eyebrow">STEP 04 · OY-CIE RESEARCH</span><h2>AI 연구 작업실</h2><p>현재 사례의 척도·서술·종합의견·사정·계획·연계 자료를 선택해 연구하고, 기존 OY-CIE 엔진으로 질문할 수 있습니다.</p></header>'+
'<div class="oy-ai-scope"><h3>분석에 포함할 자료</h3><p>CORE 원응답·안전판정은 해석의 기초이므로 제외하지 않습니다. 서술기록은 동의 없이 분석이나 외부 요청문에 포함하지 않습니다.</p>'+
'<div class="oy-ai-scope-grid">'+[
['score','CORE 척도·정량 결과',true,true],
['narrative','서술기록·맥락',false,false],
['opinion','통합 종합의견',true,false],
['assessment','사례사정·판정',true,false],
['plan','서비스계획 추천',true,false],
['resources','자원연계 후보',true,false]
].map(([id,label,checked,required])=>'<label><input type="checkbox" data-ai-scope="'+id+'" '+(checked?'checked ':'')+(required?'disabled ':'')+'/>'+label+'</label>').join('')+'</div></div>'+
'<label for="oy-ai-work-role">연구 해석 관점</label><select id="oy-ai-work-role"><option value="teacher">교사</option><option value="education-welfare">교육복지사</option><option value="social-worker" selected>사회복지사</option></select><div class="oy-ai-suggestions" role="group" aria-label="분석 질문 예시"><button type="button" data-oy-ai-example="핵심 위기와 1~2주 우선 개입을 학교·복지관으로 구분해줘">우선 개입 3가지</button><button type="button" data-oy-ai-example="학생맞춤통합지원과 복지관 사례관리의 역할을 근거별로 구분해줘">학맞통·복지관 역할</button><button type="button" data-oy-ai-example="문항 교차영역을 해석하고 목표와 성과지표를 제안해줘">교차영역·목표</button></div><label for="oy-ai-question">무엇을 더 검토하고 싶으신가요?</label>'+
'<textarea id="oy-ai-question" rows="4" maxlength="500" placeholder="학생의 출결 어려움과 돌봄상황이 함께 보고된 이유를 확인하려면 어떤 질문과 협의가 필요한가요?"></textarea>'+
'<div class="oy-ai-actions"><button type="button" id="oy-ai-ask" class="flow-btn flow-primary">OY-CIE에 질문하기</button><button type="button" id="oy-ai-copy" class="flow-btn">선택자료·질문 복사</button><button type="button" id="oy-ai-print" class="flow-btn">연구자료 PDF 인쇄</button></div>'+
'<label class="oy-ai-privacy-gate"><input type="checkbox" id="oy-ai-privacy-confirm"> 외부 AI 복사·파일 인쇄 전 척도 응답·서술·기관정보의 민감성 및 재식별 가능성을 직접 확인했습니다. 자동 가림은 완전한 비식별화를 보장하지 않습니다.</label><p role="status" id="oy-ai-workbench-status">평가 완료 후 현재 사례의 근거 자료를 불러옵니다.</p><section class="oy-ai-answer-panel" id="oy-ai-answer-panel" aria-label="OY-CIE 연구 분석결과"><h3>현재 사례 연구 결과</h3><p id="oy-ai-answer-guide">질문을 입력하고 「OY-CIE에 질문하기」를 누르면 이곳에 해석이 표시됩니다.</p><div id="oy-ai-answer" role="region" aria-live="polite"></div><div class="oy-ai-actions"><button type="button" class="flow-btn" id="oy-ai-copy-answer" disabled>분석결과 복사</button></div></section>'+
'<details id="oy-ai-material-details"><summary>연결된 근거 자료·모델 확인</summary><pre id="oy-ai-material"></pre></details>'+
'<p class="oy-ai-note">규칙·검색 기반 한국어 연구형 응답으로, 실제 대규모 언어모델을 사이트 내부에 탑재한 것은 아닙니다. 자동 제안은 상담·신고·연계 확정이 아니며 실무자 검토가 필요합니다.</p>';
anchor.before(root);
const $=id=>root.querySelector('#'+id);
let current=null,revision=null,modelError='';
function selection(){return new Set([...root.querySelectorAll('[data-ai-scope]:checked')].map(x=>x.dataset.aiScope));}
function redacted(s){try{return window.OYPrivacyGuardV87?.inspect(String(s)).redacted||String(s)}catch(_){return String(s)}}
function createContext(){
 if(!current?.ready||!current.payload)return {materials:[],plain:'평가를 완료한 뒤 이용할 수 있습니다.',revision:null};
 const p=current.payload,scopes=selection(),includeNarrative=scopes.has('narrative');
 const safe={...p,answers:p.answers.slice(),caseContext:includeNarrative?String(p.caseContext||''):''};
 const engine=window.OYModelGateway;
 if(!engine?.analyze)throw Error('모델 게이트웨이가 로드되지 않았습니다.');
 const a=engine.analyze(safe);
 const materials=[];
 const add=(key,label,value)=>{const v=String(value||'').trim();if(v)materials.push({key,label,text:redacted(v).slice(0,5500)});};
 add('score','CORE 척도 및 안전',a.decision.incomplete?'전체 판단 보류 · 확인 합계 '+a.decision.knownTotal+'/'+a.decision.knownMaximum:'원점수 '+a.decision.knownTotal+'/100');
 add('safety','안전판정',a.decision.safetyReview);
 if(scopes.has('narrative'))add('narrative','선택 서술기록(미확인)',safe.caseContext);
 if(scopes.has('opinion'))add('opinion','정량·서술 종합의견',a.sections.find(x=>/종합사정 및 우선순위/.test(x.title))?.text);
 if(scopes.has('assessment'))add('assessment','사례사정·판정',a.sections.filter(x=>/학생 상황 요약|현재 안전|가족·돌봄|학습·출결|강점/.test(x.title)).map(x=>x.title+': '+x.text).join('\n'));
 if(scopes.has('plan'))add('plan','서비스계획 추천(실무자 승인 전)',a.plans.slice(0,8).map(x=>x.title+' / 근거 '+(x.evidence||[]).join('·')+' / 실행 검토 '+x.action+' / 변화 지표 '+x.outcome).join('\n'));
 if(scopes.has('resources'))add('resources','지역자원·의뢰 후보(접수 미확인)',a.plans.slice(0,6).flatMap(x=>(x.candidates||[]).map(y=>y.name+' / '+y.service)).filter((x,i,arr)=>arr.indexOf(x)===i).join('\n')||'적합 기관·서비스의 이용조건·접수 가능 여부는 별도 확인 필요');
 const status=engine.status?engine.status().map(x=>x.id+': '+(x.loaded?'연결':'미연결')).join(' / '):'모델 상태 확인 필요';
 const plain='OY-RALS 연구자료 · 실무자 검토 전\n원점수 및 안전판정 불변 · 미상은 0점 아님\n\n'+materials.map(x=>'['+x.label+']\n'+x.text).join('\n\n')+'\n\n[모델 상태]\n'+status;
 return {revision:p.flowRevision,materials,plain,source:a};
}
function renderContext(){
 try{const ctx=createContext();$('oy-ai-material').textContent=ctx.plain;modelError='';}
 catch(e){modelError=e?.message||'분석 모듈 미연결';$('oy-ai-material').textContent='자료 분석이 완료되지 않았습니다. '+modelError;}
}
const contextFor=r=>{if(!current?.ready||!current.payload||current.payload.flowRevision!==r)return null;try{const c=createContext();return {revision:c.revision,materials:c.materials.map(x=>({key:x.key,label:x.label,text:x.text.slice(0,2100)}))};}catch(_){return null;}};
window.OYAIWorkbench=Object.freeze({contextFor});
let lastAnswer='',asking=false;
async function ask(){
 if(asking)return;
 const status=$('oy-ai-workbench-status'),output=$('oy-ai-answer'),guide=$('oy-ai-answer-guide');
 if(modelError){status.textContent='자료 연결 오류: '+modelError;return;}
 const q=$('oy-ai-question').value.trim();
 if(q.length<2){status.textContent='분석할 질문을 두 글자 이상 작성해 주세요.';return;}
 if(!window.OYCIEFlowV32?.ask){status.textContent='OY-CIE 분석 인터페이스가 없습니다.';return;}
 asking=true;$('oy-ai-ask').disabled=true;
 guide.textContent='원점수·사정·서비스계획의 근거를 대조하고 있습니다.';
 output.textContent='해석 중…';status.textContent='OY-CIE 한국어 연구 응답을 생성 중입니다.';
 try{
  const result=await window.OYCIEFlowV32.ask(q,{role:$('oy-ai-work-role').value,includeNarrative:selection().has('narrative')});
  if(!result?.answer)throw Error('응답 엔진에서 결과를 반환하지 않았습니다.');
  lastAnswer=result.answer;output.textContent=lastAnswer;
  $('oy-ai-copy-answer').disabled=false;
  guide.textContent='사례 분석 · '+String(result.role||'social-worker')+' 관점 / 근거와 실행 방향';
  status.textContent='분석 완료 · '+lastAnswer.length+'자. 결과를 아래에서 바로 확인하고 복사·인쇄할 수 있습니다.';
 }catch(e){
  lastAnswer='';$('oy-ai-copy-answer').disabled=true;
  output.textContent='분석 실패: '+String(e?.message||'모델 입력·자료 로드 오류');
  guide.textContent='원인과 연결상태를 표시합니다.';
  status.textContent='분석 오류가 발생했습니다. 아래 메시지와 모델 근거를 확인하세요.';
 }finally{asking=false;$('oy-ai-ask').disabled=false;}
}
async function copy(){
 if(!$('oy-ai-privacy-confirm').checked){$('oy-ai-workbench-status').textContent='외부 AI로 복사하기 전에 개인정보 확인 항목을 선택해 주세요.';$('oy-ai-privacy-confirm').focus();return;}
 const q=$('oy-ai-question').value.trim();
 if(!q)return $('oy-ai-workbench-status').textContent='복사할 질문을 입력해 주세요.';
 let ctx;try{ctx=createContext()}catch(e){return $('oy-ai-workbench-status').textContent='자료 분석을 완료할 수 없습니다.';}
 const packet=ctx.plain+'\n\n[분석 요청]\n'+redacted(q)+'\n\n원자료·가설·미확인 사항을 구분하고 근거·반대 설명·추가 확인과제를 제시하세요. 기존 CORE 점수 및 안전판정은 수정하지 마세요.';
 try{await navigator.clipboard.writeText(packet);$('oy-ai-workbench-status').textContent='비식별 검토용 자료·질문을 복사했습니다. 외부 AI에 전달하기 전 개인정보와 기관 지침을 다시 확인하세요.'}
 catch(_){$('oy-ai-material').textContent=packet;document.getElementById('oy-ai-material-details').open=true;$('oy-ai-workbench-status').textContent='클립보드 접근이 제한되었습니다. 아래 펼쳐진 요청문을 직접 복사하세요.';}
}
function print(){
 if(!$('oy-ai-privacy-confirm').checked){$('oy-ai-workbench-status').textContent='PDF로 저장하기 전에 민감정보 포함 여부를 확인해 주세요.';$('oy-ai-privacy-confirm').focus();return;}
 let c;try{c=createContext()}catch(_){return $('oy-ai-workbench-status').textContent='연구자료를 먼저 불러와 주세요.';}
 document.getElementById('oy-ai-print-root')?.remove();
 const section=document.createElement('section');section.id='oy-ai-print-root';
 const h=document.createElement('h1');h.textContent='OY-RALS AI 연구자료';
 const meta=document.createElement('p');meta.textContent='실무자 검토 전 초안 · '+new Date().toLocaleDateString('ko-KR');
 const pre=document.createElement('pre');pre.textContent=c.plain+'\n\n[추가 질문]\n'+redacted($('oy-ai-question').value)+'\n\n[OY-CIE 분석 응답]\n'+(lastAnswer||'아직 생성된 답변 없음');
 section.append(h,meta,pre);document.body.append(section);
 document.body.classList.add('oy-ai-print');window.print();
}
root.querySelectorAll('[data-ai-scope]').forEach(c=>c.addEventListener('change',()=>{renderContext();$('oy-ai-workbench-status').textContent='선택한 자료 범위를 갱신했습니다. 분석을 다시 실행하면 반영됩니다.';}));
$('oy-ai-ask').addEventListener('click',()=>ask());
root.querySelectorAll('[data-oy-ai-example]').forEach(b=>b.addEventListener('click',()=>{$('oy-ai-question').value=b.dataset.oyAiExample;ask();}));
$('oy-ai-copy-answer').addEventListener('click',async()=>{if(!lastAnswer)return;if(!$('oy-ai-privacy-confirm').checked){$('oy-ai-workbench-status').textContent='복사 전에 개인정보를 확인하고 동의 항목을 선택해 주세요.';$('oy-ai-privacy-confirm').focus();return;}try{await navigator.clipboard.writeText(redacted(lastAnswer));$('oy-ai-workbench-status').textContent='OY-CIE 분석 결과를 복사했습니다.';}catch(_){const result=$('oy-ai-answer');const range=document.createRange();range.selectNodeContents(result);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);$('oy-ai-workbench-status').textContent='본문을 선택했습니다. Ctrl+C로 복사하세요.';}});
$('oy-ai-copy').addEventListener('click',copy);
$('oy-ai-print').addEventListener('click',print);
window.addEventListener('afterprint',()=>{document.body.classList.remove('oy-ai-print');document.getElementById('oy-ai-print-root')?.remove();});
window.addEventListener('oy-journey-view',e=>{
 current=e.detail;root.hidden=!current?.ready||current.stage!==5;
 if(current?.payload?.flowRevision!==revision){revision=current?.payload?.flowRevision;$('oy-ai-question').value='';lastAnswer='';$('oy-ai-answer').textContent='';$('oy-ai-copy-answer').disabled=true;$('oy-ai-answer-guide').textContent='질문을 작성하면 기존 사례자료를 연결해 분석합니다.';}
 if(!root.hidden){renderContext();$('oy-ai-workbench-status').textContent='해당 사례의 검토 자료를 불러왔습니다. 질문을 작성해 주세요.';}
});
})();
