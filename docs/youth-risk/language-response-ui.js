(function(){'use strict';
let context=null,role='teacher',last='';
const el=id=>document.getElementById(id);
function status(s){el('languageStatus').textContent=s;}
function clear(){last='';el('languageAnswer').textContent='평가 자료를 불러온 뒤 질문을 선택해 주세요.';el('languageCopy').disabled=true;}
function render(){
 if(!context){status('평가를 완료하고 사례검토 화면을 열면 사용할 수 있습니다.');return;}
 const question=el('languageQuestion').value.trim();
 if(!question){status('질문을 입력하거나 제시된 질문을 선택해 주세요.');return;}
 if(!window.YouthLanguageResponse){status('응답 모델을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');return;}
 try{
 const output=window.YouthLanguageResponse.buildResponse(context,question,el('languageNarrative').value,role,{Map:window.YouthMap,Matrix:window.YouthEvidenceMatrix});
 last=output.text;el('languageAnswer').textContent=last;el('languageCopy').disabled=false;
 const meta=output.audit;
 status('로컬 분석 완료 · 참고한 주제 '+meta.topics.length+'개 · 서술 근거 '+meta.notes+'개 · 교차근거 '+meta.cross+'개. 학생·사례관리자 검토 전 확정하지 마세요.');
 }catch(e){clear();status('응답 생성 실패: '+e.message);}
}
document.addEventListener('DOMContentLoaded',()=>{
 const block=el('languageAssistant');if(!block)return;
 el('languageRun').addEventListener('click',render);
 el('languageCopy').addEventListener('click',async()=>{
  if(!last)return;
  try{await navigator.clipboard.writeText(last);status('응답문이 복사되었습니다. 개인정보와 문항 근거를 재확인한 뒤 활용해 주세요.');}
  catch(e){const p=el('languageAnswer');const r=document.createRange();r.selectNodeContents(p);const s=window.getSelection();s.removeAllRanges();s.addRange(r);status('텍스트가 선택되었습니다. 복사 메뉴를 이용해 주세요.');}
 });
 block.querySelectorAll('[data-language-query]').forEach(btn=>btn.addEventListener('click',()=>{el('languageQuestion').value=btn.dataset.languageQuery;render();}));
 el('languageNarrative').addEventListener('input',()=>{if(last){last='';el('languageCopy').disabled=true;status('서술식 기록이 바뀌었습니다. 다시 분석을 실행해 주세요.');}});
 window.addEventListener('youth-ai-context-v1',e=>{
  const detail=e.detail||{};context=detail.payload||null;role=detail.role==='social-worker'?'social-worker':'teacher';clear();
  const label=role==='teacher'?'교사 관점':'사회복지사 관점';
  status(context?('현재 평가 자료를 연결했습니다 · '+label+' · 서버 전송 없음'):'평가 자료가 없습니다.');
  el('languageRun').disabled=!context;
 });
});
})();
