(function(){'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const methods=[...document.querySelectorAll('[data-ai-method]')];
 const panels={local:document.getElementById('localAiPanel'),web:document.getElementById('personalAiPanel')};
 const narrative=document.getElementById('sharedNarrative'),status=document.getElementById('aiMethodStatus');
 function choose(mode){
   if(!['none','local','web'].includes(mode))return;
   methods.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aiMethod===mode)));
   Object.entries(panels).forEach(([name,node])=>{if(node)node.hidden=name!==mode;});
   if(narrative)narrative.hidden=mode==='none';
   if(status)status.textContent=mode==='none'?'기본 보고서를 보고 있습니다. AI 전송은 없습니다.':mode==='local'?'내 PC의 Codex 또는 Claude Code 연결 도구입니다. PC의 연결 프로그램이 필요합니다.':'웹·휴대폰에서 사용 중인 AI를 열어 직접 요청문을 전달합니다. AI 답변은 직접 가져옵니다.';
 }
 methods.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.aiMethod)));
 choose('none');
});
})();