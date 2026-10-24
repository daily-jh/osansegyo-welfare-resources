(function(){'use strict';
let context=null,role='teacher',last='';
const el=id=>document.getElementById(id);
function status(s){el('languageStatus').textContent=s;}
function clear(){requestVersion++;if(el('languageContextDetails'))el('languageContextDetails').hidden=true;if(el('languageEvidenceDetails'))el('languageEvidenceDetails').hidden=true;last='';el('languageAnswer').textContent='평가 자료를 불러온 뒤 질문을 선택해 주세요.';el('languageCopy').disabled=true;}
let requestVersion=0;
async function render(){
 const currentVersion=++requestVersion;
 if(!context){status('평가를 완료하고 사례검토 화면을 열면 사용할 수 있습니다.');return;}
 const question=el('languageQuestion').value.trim();
 if(!question){status('질문을 입력하거나 제시된 질문을 선택해 주세요.');return;}
 if(!window.YouthLanguageResponse){status('응답 모델을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');return;}
 try{
 if(window.YouthModelsV7){
  const activeRole=el('languageRole')?.value||role;
  status('V7.0 모델에서 근거·역할을 검토하고 있습니다…');
  const x=await YouthModelsV7.analyze(context,activeRole,question);
  if(currentVersion!==requestVersion)return;
  const answer=YouthModelsV7.answer(x,question);
  // Narrative-derived text stays on screen; ordinary copy uses score-only material.
  last=window.YouthLanguageResponse.buildResponse({...context,caseContext:''},'현재 학생에게 필요한 도움과 종합 사정 근거를 알려주세요.','',activeRole,{Map:window.YouthMap,Matrix:window.YouthEvidenceMatrix,Research:window.YouthResearchKB}).text;
  el('languageAnswer').innerHTML=window.YouthPresentation?YouthPresentation.textHTML(answer):'';
  if(!window.YouthPresentation)el('languageAnswer').textContent=answer;
  el('languageAnswer').toggleAttribute('data-local-context',x.hasContext);
  window.YouthPresentation?.emphasize(el('languageAnswer'));
  el('languageCopy').disabled=false;
  status('ICSI / K-CARR / ICMS V7.0 · '+({teacher:'교사','education-welfare':'교육복지사','social-worker':'사회복지사'})[activeRole]+' · '+(x.hasContext?'선택 사례정보 연계 · 복사는 서술을 제외한 척도 기반 응답만 제공':'서술 없음 · 척도 기반 확인·실행안')+' · 외부 전송 없음');
  return;
 }
 const output=window.YouthLanguageResponse.buildResponse(context,question,el('languageNarrative').value,role,{Map:window.YouthMap,Matrix:window.YouthEvidenceMatrix,Research:window.YouthResearchKB});
 const enriched=window.YouthResponseKnowledge?await window.YouthResponseKnowledge.enrich(output,context,role):output;
 if(currentVersion!==requestVersion)return;
 const v3=window.YouthInterpretationV3?window.YouthInterpretationV3.build(context,role,el('languageNarrative').value,question):null;
 last=enriched.text+(v3?'\n\n'+v3.text:'');
 if(window.YouthPresentation){el('languageAnswer').innerHTML=YouthPresentation.textHTML(enriched.text);YouthPresentation.emphasize(el('languageAnswer'));}else el('languageAnswer').textContent=last;
 let contextDetails=el('languageContextDetails');if(!contextDetails){contextDetails=document.createElement('details');contextDetails.id='languageContextDetails';const summary=document.createElement('summary'),body=document.createElement('div');summary.textContent='추가 서술의 맥락·가설 검토';contextDetails.append(summary,body);el('languageAnswer').after(contextDetails);}contextDetails.hidden=!v3;if(v3){contextDetails.querySelector('div').innerHTML=window.YouthPresentation?YouthPresentation.textHTML(v3.text):'';if(!window.YouthPresentation)contextDetails.querySelector('div').textContent=v3.text;window.YouthPresentation?.emphasize(contextDetails);}let evidence=el('languageEvidenceDetails');if(!evidence){evidence=document.createElement('details');evidence.id='languageEvidenceDetails';const summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='해석에 참고한 세부 근거 보기';pre.className='language-evidence-text';evidence.append(summary,pre);el('languageAnswer').after(evidence)}evidence.hidden=!enriched.knowledgeEvidence;evidence.querySelector('pre').textContent=enriched.knowledgeEvidence||'';el('languageCopy').disabled=false;
 const meta=output.audit;
 status('로컬 분석 완료 · '+(v3?'v3 사례사정 보완 · ':'')+'주제 '+meta.topics.length+'개 · 서술 근거 '+meta.notes+'개 · 교차근거 '+meta.cross+'개 · '+(enriched.knowledgeLoaded?'심층 DB '+enriched.knowledgeRecords+'건 적용':'심층 DB 미연결, 기본 모델만 적용')+'. 담당자 검토 전 확정하지 마세요. '+(enriched.knowledgeWarning||''));
 }catch(e){clear();status('응답 생성 실패: '+e.message);}
}
document.addEventListener('DOMContentLoaded',()=>{
 const block=el('languageAssistant');if(!block)return;
 el('languageRun').addEventListener('click',render);
 el('languageCopy').addEventListener('click',async()=>{
  if(!last)return;
  try{await navigator.clipboard.writeText(last);status('선택 사례정보를 제외한 척도 기반 응답을 복사했습니다.');}
  catch(e){status('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요. 선택 사례정보는 자동 선택하지 않았습니다.');}
 });
 block.querySelectorAll('[data-language-query]').forEach(btn=>btn.addEventListener('click',()=>{el('languageQuestion').value=btn.dataset.languageQuery;render();}));
 ['languageNarrative','languageQuestion','languageRole'].filter(id=>el(id)).forEach(id=>el(id).addEventListener('input',()=>{clear();status('입력이 바뀌었습니다. 다시 응답을 생성해 주세요.');}));
 window.addEventListener('youth-ai-context-v1',e=>{
  const detail=e.detail||{};context=detail.payload||null;role=detail.role==='social-worker'?'social-worker':'teacher';clear();
  const label=role==='teacher'?'교사 관점':'사회복지사 관점';
  status(context?('현재 평가 자료를 연결했습니다 · '+label+' · 서버 전송 없음'):'평가 자료가 없습니다.');
  el('languageRun').disabled=!context;
 });
});
})();
