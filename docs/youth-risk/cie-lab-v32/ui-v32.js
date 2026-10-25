/* V3.2 read-only conversational extension to V3.1 demo. No persistent case storage. */
(()=>{'use strict';
 const E=window.OYCIE32,B=window.OYCIE30,$=id=>document.getElementById(id);
 let kb=null,playbook=null,route=null,pair=null,thread=null,latest=null,seq=0;
 function info(msg){$('v32-status').textContent=msg;}
 function invalidate(){seq++;latest=null;thread=null;$('v32-answer').textContent='평가·서술·질문이 변경됐습니다. 근거를 다시 분석해 주세요.';$('v32-evidence').textContent='';$('v32-print').disabled=$('v32-copy').disabled=$('v32-export').disabled=true;info('재분석 필요 · 대화 맥락 초기화');}
 const selectors=['items','followups','role','explicit','narrative','question','intent'];
 for(const id of selectors){const n=$(id);if(n){n.addEventListener('change',invalidate);if(['role','explicit','narrative','question'].includes(id))n.addEventListener('input',invalidate);}}
 // The legacy demo/reset actions set values programmatically without dispatching change events.
 // Explicitly revoke v3.2 results so an old report cannot be exported under a new synthetic case.
 for(const id of ['demo','reset'])$(id)?.addEventListener('click',invalidate);
 const ids=[4,5,12,13];
 function read(){const followups={};for(const i of ids){const el=$('follow-'+i);if(el&&el.value!=='unknown')followups[String(i)]=el.value;}
  return {answers:Array.from({length:25},(_,i)=>{const v=$('q'+(i+1)).value;return v==='unknown'?'unknown':Number(v)}),caseContext:$('narrative').value,explicit:$('explicit').value?[$('explicit').value]:[],followups};}
 const redactFormat=/(?:\b\d{6}[- ]?[1-8]\d{6}\b|(?:01[016789])[- ]?\d{3,4}[- ]?\d{4}|[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,})/;
 function bubble(kind,value){const el=document.createElement('div');el.className='v32-message '+kind;el.textContent=value;$('v32-chat').append(el);el.scrollIntoView({block:'nearest'});}
 function resetChat(){const chat=$('v32-chat');chat.replaceChildren();bubble('assistant','새 연구 회차입니다. 질문을 입력하면 현재 평가의 근거를 확인합니다.');}
 function execute(){const runId=++seq;try{const question=$('v32-question').value.trim();const input=read();if(redactFormat.test(question+' '+input.caseContext))throw Error('식별정보 형식 발견: 공개 시연 입력 불가');
  const result=E.run(input,question,{engine:B,criteria:window.YouthCriteria,kb,playbook,pairModel:pair,role:$('role').value,state:thread,route});if(runId!==seq)return;
  thread=result.dialogueState;latest=result;bubble('user',question||'현재 사례의 근거를 분석해줘');bubble('assistant',result.answer);$('v32-answer').textContent=result.answer;$('v32-evidence').textContent=JSON.stringify({review:result.review,source:result.sourceStatus,gates:result.gates,issues:result.issues,actions:result.actions.map(a=>({id:a.id,evidenceIds:a.evidenceIds,status:a.status,confirmedOwner:a.confirmedOwner,goalAgreed:a.goalAgreed})),playbookIds:result.usedPlaybookIds},null,2);
  $('v32-print').disabled=$('v32-copy').disabled=$('v32-export').disabled=false;info('분석 완료 · 임상·실무 승인 전 초안 · 대화 맥락은 현재 평가 회차에만 유지');
 }catch(e){latest=null;thread=null;$('v32-export').disabled=$('v32-copy').disabled=$('v32-print').disabled=true;$('v32-evidence').textContent='';$('v32-answer').textContent='분석 중단: '+e.message;bubble('assistant','분석을 완료하지 못했습니다. '+e.message+'\n평가 입력을 확인한 뒤 다시 질문해 주세요.');info('자료 확인 필요');}}
 $('v32-run').onclick=execute;
 $('v32-reset').onclick=()=>{$('v32-question').value='';invalidate();resetChat();};
 $('v32-question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();execute();}});
 $('v32-question').addEventListener('input',()=>{seq++;latest=null;$('v32-export').disabled=$('v32-copy').disabled=$('v32-print').disabled=true;info('새 질문 입력 · 분석 실행 필요');});
 $('v32-copy').onclick=async()=>{if(!latest)return;try{await navigator.clipboard.writeText(latest.answer);info('분석 결과 복사 · 외부 공유 전 개인정보 확인');}catch{info('클립보드 사용 불가');}};
 $('v32-print').onclick=()=>{if(!latest)return;document.body.classList.add('printing-v32');window.print();};
 window.addEventListener('afterprint',()=>document.body.classList.remove('printing-v32'));
 $('v32-export').onclick=()=>{if(!latest)return;const sanitized={version:latest.version,caseRevision:latest.caseRevision,official:latest.official,intent:latest.intent,role:latest.role,answer:latest.answer,sourceStatus:latest.sourceStatus,playbookIds:latest.usedPlaybookIds,citations:latest.citations,review:latest.review,note:'원문 서술 미포함. 실무자 승인 전 초안.'};const blob=new Blob([JSON.stringify(sanitized,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download='OY-CIE-V3.2_비식별_연구형초안.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 for(const b of document.querySelectorAll('[data-v32-prompt]'))b.onclick=()=>{$('v32-question').value=b.dataset.v32Prompt;seq++;latest=null;$('v32-export').disabled=$('v32-copy').disabled=$('v32-print').disabled=true;execute();info('추천 질문 분석을 실행했습니다 · 결과를 확인하세요 주세요');};
 async function hydrate(){pair=window.YouthResearchKB?.match?window.YouthResearchKB:null;
  const requests=[['../data/response-knowledge-600-v1.json','corpus'],['practice-playbook-v32.json','playbook'],['compiled-routing-index.json','route']];
  await Promise.all(requests.map(async([url,key])=>{try{const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error(String(response.status));const obj=await response.json();if(key==='corpus'){B.corpusCheck(obj);kb=obj;}if(key==='playbook'){E.validatePlaybook(obj);playbook=obj;}if(key==='route'){if(obj.count!==5550||obj.rows?.length!==5550)throw Error('route index invalid');route=obj;}}catch{/* strict fail-closed fallback: do not infer confirmed facts */}}));
  $('v32-db').textContent='연구형 DB '+(kb?'600건 구조 검증':'미연결')+' · 실무 템플릿 '+(playbook?'80개 초안':'미연결')+' · 라우팅 '+(route?'5550':'미연결');
 }
 // Receive CORE assessment from the same-origin evaluation window. No narrative or identifiers are transferred.
 if(window.opener&&new URLSearchParams(location.search).get('from')==='assessment'){
  window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==window.opener||event.data?.type!=='oy-cie-assessment-handoff')return;
   const data=event.data;
   if(!Array.isArray(data.answers)||data.answers.length!==25||!data.answers.every(v=>v==='unknown'||Number.isInteger(v)&&v>=0&&v<=4))return;
   for(let i=0;i<25;i++)$('q'+(i+1)).value=String(data.answers[i]);
   for(const i of [4,5,12,13])$('follow-'+i).value=['yes','no'].includes(data.followups?.[String(i)])?data.followups[String(i)]:'unknown';
   $('explicit').value=Array.isArray(data.explicit)&&data.explicit.length?'명시적 안전확인 필요':'';
   $('narrative').value='';
   $('v32-question').value='이 평가의 근거를 검토하고 안전 확인, 추가 면담 질문, 지원계획 우선순위를 제안해줘';
   $('intent').value='plan';
   invalidate();resetChat();
   info('평가 25문항을 가져왔습니다. 서술과 개인정보는 가져오지 않았습니다. 아래에서 「근거 확인·응답 생성」을 눌러주세요.');
   $('v32-run').scrollIntoView({behavior:'smooth',block:'center'});
  });
  window.opener.postMessage({type:'oy-cie-lab-ready'},location.origin);
 }
 hydrate();
})();
