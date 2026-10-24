(function(){'use strict';
let context=null,version=0,result=null,cleanResult=null;
const el=id=>document.getElementById(id),status=s=>{el('languageStatus').textContent=s;};
function clear(message='질문을 선택하거나 직접 적어 주세요.') {version++;result=cleanResult=null;el('languageAnswer').textContent=message;el('languageCopy').disabled=true;el('languageRun').disabled=!context;el('languageAnswer').removeAttribute('data-local-context');}
function copyLabel(){el('languageCopy').textContent=el('languageIncludeContext').checked?'현재 답변 복사 · 서술 반영 포함':'척도 근거 답변 복사';}
function render(){
 clear();if(!context){status('평가를 완료하면 질문할 수 있습니다.');return;}
 const q=el('languageQuestion').value.trim(),role=el('languageRole').value;
 if(!q){status('질문을 입력하거나 아래 질문을 선택해 주세요.');el('languageQuestion').focus();return;}
 try{
 const Q=window.YouthQuestionAssistant;if(!Q)throw Error('module');
 result=Q.build(context,q,role);cleanResult=Q.build({...context,caseContext:''},'',role,{intent:{id:result.intent,areas:result.areas},includeContext:false});
 el('languageAnswer').innerHTML=Q.html(result);el('languageCopy').disabled=['empty','unsupported'].includes(result.intent);copyLabel();
 el('languageAnswer').toggleAttribute('data-local-context',!!context.caseContext);
 status(result.intent==='unsupported'?'지원 가능한 질문 유형을 선택해 주세요.':'답변 준비 완료 · '+(result.version==='8.0-question'?'K-CARR V8.0 · ':'')+Q.roles[role]+' · '+(result.context.length?'사례 서술 반영 · ':'')+'질문·사례정보 외부 전송 없음');
 document.querySelectorAll('[data-language-query]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.languageQuery===q)));
 }catch(e){clear('응답 도구를 불러오지 못했습니다. 평가 응답은 유지됩니다.');status('다시 시도해 주세요. 계속되면 현재 평가를 저장한 뒤 페이지를 다시 여세요.');}
}
document.addEventListener('DOMContentLoaded',()=>{if(!el('languageAssistant'))return;
 el('languageRun').onclick=render;
 el('languageCopy').onclick=async()=>{if(!result||!cleanResult)return;const token=version,include=el('languageIncludeContext').checked,content=YouthQuestionAssistant.text(include?result:cleanResult);try{await navigator.clipboard.writeText(content);if(token===version)status(include?'현재 답변을 복사했습니다. 입력 서술에서 도출한 사정이 포함됩니다.':'같은 질문 유형의 척도 근거 답변을 복사했습니다. 질문 원문·사례 서술과 서술에서 도출한 사정은 제외했습니다.');}catch{if(token===version)status('복사 권한을 사용할 수 없습니다. 화면에서 필요한 내용을 직접 선택해 복사해 주세요.');}};
 document.querySelectorAll('[data-language-query]').forEach(b=>{b.disabled=true;b.onclick=()=>{el('languageQuestion').value=b.dataset.languageQuery;render();};});
 ['languageQuestion','languageRole'].forEach(id=>el(id).addEventListener('input',()=>{clear();status(context?'내용이 바뀌었습니다. 답변 보기를 눌러 주세요.':'평가를 먼저 완료해 주세요.');document.querySelectorAll('[data-language-query]').forEach(b=>b.setAttribute('aria-pressed','false'));}));
 el('languageRole').addEventListener('change',()=>{clear();status('역할이 바뀌었습니다. 답변 보기를 눌러 주세요.');});
 el('languageIncludeContext').onchange=()=>{version++;copyLabel();status(el('languageIncludeContext').checked?'현재 답변의 서술 반영 내용을 함께 복사합니다. 공유 전 민감정보를 확인해 주세요.':'복사 시 질문 원문·사례 서술의 반영 내용을 제외합니다.');};
 window.addEventListener('youth-ai-context-v1',e=>{context=e.detail?.payload||null;el('languageRole').value=YouthQuestionAssistant.roles[e.detail?.role]?e.detail.role:'teacher';el('languageIncludeContext').checked=false;copyLabel();clear(context?'질문을 선택하거나 직접 적어 주세요.':'평가를 완료하면 질문할 수 있습니다.');document.querySelectorAll('[data-language-query]').forEach(b=>{b.disabled=!context;b.setAttribute('aria-pressed','false');});el('languageContextState').textContent=context?'25문항 연결됨 · '+(context.caseContext?'1페이지 사례 서술 포함':'추가 서술 없음'):'평가 연결 전';status(context?'현재 평가를 연결했습니다. 질문은 사례 사실로 자동 추가하지 않습니다.':'평가 자료가 없습니다.');});
});
})();
