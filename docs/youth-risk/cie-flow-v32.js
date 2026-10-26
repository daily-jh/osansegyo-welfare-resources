/* OY-CIE V3.2 read-only support inside the original OY-RALS journey.
   No override of CORE, map, plans or report; no persistence or cross-origin requests. */
(()=>{'use strict';
const anchor=document.getElementById('journey88');if(!anchor||document.getElementById('cie-flow-v32'))return;
const p=document.createElement('section');p.id='cie-flow-v32';p.className='cie-flow-v32';p.hidden=true;
p.setAttribute('aria-label','OY-CIE V3.3.1 연구형 심층해석');
p.innerHTML=[
'<header><div><small>OY-CIE V3.3.1 · 기존 평가 흐름 속 보조 해석</small><h3>근거 기반 추가 질문·확인과제</h3><p>V8.9.3 기존 해석을 보완하는 선택 기능 · 공식 CORE 결과는 그대로 유지합니다.</p></div><a href="cie-lab-v32/" target="_blank" rel="noopener noreferrer">연구작업실 ↗</a></header>',
'<div class="cie-settings"><label>실무 관점 <select id="cie-flow-role"><option value="teacher">교사</option><option value="education-welfare">교육복지사</option><option value="social-worker" selected>사회복지사</option></select></label><label><input type="checkbox" id="cie-flow-narrative"> 서술형 함께 분석 <small>(선택 · 기기 안에서 처리)</small></label></div>',
'<label for="cie-flow-question">이 단계에서 확인할 질문</label><div class="cie-query"><input id="cie-flow-question" maxlength="500"><button id="cie-flow-run" type="button">다시 분석</button></div>',
'<p class="cie-flow-status" id="cie-flow-status" role="status">평가 완료 후 분석합니다.</p><div class="cie-flow-result" id="cie-flow-result">분석 대기</div>',
'<details><summary>근거 ID·안전 게이트·지식자료 검수 상태</summary><pre id="cie-flow-audit"></pre></details>',
'<p class="cie-flow-caution">TEST · 규칙·검색 기반 응답(학습형 LLM 아님) · 실무자 검토 전 초안. 진단·신고·서비스 제공을 확정하지 않으며 학생 식별정보 입력을 금지합니다.</p>'
].join('');anchor.after(p);
const $=id=>p.querySelector('#'+id),role=$('cie-flow-role'),note=$('cie-flow-narrative'),question=$('cie-flow-question'),run=$('cie-flow-run'),status=$('cie-flow-status'),answer=$('cie-flow-result'),audit=$('cie-flow-audit');
const prompts={result:'학생의 핵심 어려움과 우선 확인 질문을 문항 근거로 정리해줘',map:'지원연계 기관의 대상과 접수 전에 확인할 조건을 정리해줘',assessment:'종합사정·사례협의·서비스계획의 확인 근거를 정리해줘',record:'계획 이행과 재사정 전에 확인할 사항을 정리해줘',research:'평가 근거와 사례사정·서비스계획을 함께 살펴보고 우선 질문과 개입대안을 정리해줘'};
let current=null,contextKey='',count=0,thread=null,loading=null,kb=null,playbook=null,route=null;
function clear(){count++;thread=null;run.disabled=false;answer.textContent='현재 평가 자료를 확인하고 있습니다.';audit.textContent='이전 회차 결과는 폐기했습니다.';status.textContent='평가 완료 후 해석합니다.';}
function mode(s){if(s.stage===5)return 'research';return s.stage===2?(s.view==='map'?'map':'result'):s.stage===3?'assessment':'record';}
async function load(){
 if(loading)return loading;
 loading=Promise.all([
  ['data/response-knowledge-600-v1.json','kb'],
  ['cie-lab-v32/practice-playbook-v32.json','playbook'],
  ['cie-lab-v32/compiled-routing-index.json','route']
 ].map(async ([url,key])=>{try{
  const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('자료 로드 실패');
  const data=await r.json();
  if(key==='kb'){window.OYCIE30.corpusCheck(data);kb=data;}
  if(key==='playbook'){window.OYCIE32.validatePlaybook(data);playbook=data;}
  if(key==='route'&&data.schema==='OY-CIE-compiled-response-routing.v3'&&data.count===5550&&data.rows?.length===5550)route=data;
 }catch{/* Failure is isolated from CORE and optional interpretation. */}}));
 return loading;
}
async function evaluate(){
 const token=++count,s=current;if(!s?.ready||!s.payload)return;
 const core=window.YouthCriteria,base=window.OYCIE30,model=window.OYCIE32;
 if(!core?.evaluate||!base?.analyze||!model?.run){status.textContent='심층해석 모듈 미연결 · 기본 결과는 그대로 사용할 수 있습니다.';return;}
 run.disabled=true;status.textContent='근거 자료 검색 및 해석 중…';
 try{
  await load();if(token!==count)return;
  const v=s.payload,raw={answers:v.answers,explicit:v.explicit||[],followups:v.followups||{},caseContext:note.checked?String(v.caseContext||''):''};
  const q=question.value.trim();if(q.length<2)throw Error('질문을 2자 이상 입력하세요.');if(q.length>500)throw Error('질문을 500자 이내로 작성해 주세요.');
  const result=model.run(raw,q,{engine:base,criteria:core,kb,playbook,route,pairModel:window.YouthResearchKB?.match?window.YouthResearchKB:null,role:role.value,state:thread,linkedDocuments:s.stage===5?(window.OYAIWorkbench?.contextFor?.(v.flowRevision)?.materials||[]):[]});
  if(token!==count)return;
  thread=result.dialogueState;answer.textContent=result.answer;
  audit.textContent=JSON.stringify({flowRevision:v.flowRevision,official:result.official,issues:result.issues,gates:result.gates,review:result.review,knowledge:result.baseKnowledgeIds,playbook:result.usedPlaybookIds,corpus:kb?'600개 개발원고 검수 전':'미연결',role:result.role},null,2);
  status.textContent='해석 완료 · 연구형 지식 '+(kb?'600건 구조확인':'미연결')+' · 80개 템플릿 '+(playbook?'로드':'미연결')+' · 실무자 검토 필요';
 }catch(e){if(token!==count)return;answer.textContent='OY-CIE 심층해석을 표시하지 못했습니다. 기존 결과 해석·지원연계는 계속 이용할 수 있습니다.';audit.textContent=String(e?.message||'분석 오류');status.textContent='심층해석 보류 · 자료·개인정보 형식 확인 필요';thread=null;}
 finally{if(token===count)run.disabled=false;}
}
window.addEventListener('oy-journey-view',e=>{
 const s=e.detail;if(!s?.ready||!s.payload||s.stage===1){current=null;contextKey='';clear();p.hidden=true;return;}
 const prev=current?.payload,changed=!prev||prev.flowRevision!==s.payload.flowRevision||prev.caseContext!==s.payload.caseContext||JSON.stringify(prev.answers)!==JSON.stringify(s.payload.answers)||JSON.stringify(prev.followups)!==JSON.stringify(s.payload.followups)||JSON.stringify(prev.explicit)!==JSON.stringify(s.payload.explicit);
 current=s;p.hidden=false;p.classList.toggle('cie-research-stage',s.stage===5);const next=mode(s);
 if(changed){clear();note.checked=false;}
 if(changed||next!==contextKey){contextKey=next;question.value=prompts[next];thread=null;evaluate();}
});
role.addEventListener('change',()=>{thread=null;evaluate();});
note.addEventListener('change',()=>{thread=null;evaluate();});
run.addEventListener('click',evaluate);
question.addEventListener('input',()=>{count++;thread=null;answer.textContent='이전 질문의 결과는 폐기했습니다.';status.textContent='다시 분석을 눌러주세요.';run.disabled=false;});
})();