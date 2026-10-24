/* OY-RALS optional case information: ONE free-text field. In-memory, no external transmission. */
(function(root){'use strict';
 const Core=root.YouthCaseContextCore, ID='oyCaseContextText';
 function mount(){
  if(document.getElementById('oyCaseContext'))return;
  const anchor=document.querySelector('.privacy')||document.getElementById('assessment');if(!anchor)return;
  const card=document.createElement('details');card.id='oyCaseContext';card.className='oy-context-card';
  const title=document.createElement('summary');title.textContent='알고 있는 학생·사례정보 적기 (선택)';card.append(title);
  const explain=document.createElement('p');explain.className='oy-context-description';explain.textContent='별도 항목을 작성할 필요 없이 알고 계신 상황을 편하게 적으시면 됩니다. 예: 최근 결석이 잦아지고 학생이 불안하다고 말함. 상담을 원하며, 담임과는 편하게 이야기함. 복지관 지원은 아직 문의 전.';card.append(explain);
  const label=document.createElement('label');label.htmlFor=ID;label.textContent='사례정보 자유기록 (선택 · 최대 5,000자)';card.append(label);
  const input=document.createElement('textarea');input.id=ID;input.rows=6;input.maxLength=Core.LIMITS.text;input.placeholder='알고 있는 내용을 자유롭게 입력하세요. 특정 양식을 지킬 필요는 없습니다.\n\n예) 최근 결석이 늘고 학생이 친구들과의 갈등으로 학교에 오기 힘들다고 함. 학교 상담을 희망함. 보호자 연락의 안전성은 확인 전. 담임 선생님을 신뢰한다고 이야기함.';input.autocomplete='off';input.spellcheck=false;card.append(input);
  const note=document.createElement('p');note.className='oy-context-description';note.textContent='입력하신 글에서 필요한 사정·확인사항을 추출합니다. 점수는 자동 변경되지 않습니다. 실명·연락처·주소·주민등록번호 등 개인정보와 불필요한 민감정보는 적지 마세요. 현재 화면의 메모리에서만 처리하고 외부 AI·서버·평가 백업파일로 전송하지 않습니다.';card.append(note);
  const status=document.createElement('p');status.id='oyContextStatus';status.setAttribute('role','status');status.className='oy-context-description';status.textContent='비워 두셔도 기존 척도를 그대로 이용할 수 있습니다.';card.append(status);
  const actions=document.createElement('div');actions.className='oy-context-actions';const clear=document.createElement('button');clear.type='button';clear.className='btn btn-muted';clear.textContent='입력내용 지우기';clear.addEventListener('click',()=>{if(root.confirm('선택 사례정보의 내용을 지우시겠습니까?'))reset()});actions.append(clear);card.append(actions);
  if(anchor.classList?.contains('privacy'))anchor.after(card);else anchor.prepend(card);
  input.addEventListener('input',()=>{
   const state=Core.infer(getValue());status.textContent=state.issues.some(x=>x.type==='safety-mention')?'안전 관련 표현이 있습니다. 점수 결과와 관계없이 현재 안전·신고·보호절차를 담당자가 직접 확인해 주세요.':'내용이 변경되었습니다. 평가 결과를 다시 생성하면 새 내용이 반영됩니다.';
   root.dispatchEvent(new CustomEvent('youth-case-context-updated-v1',{detail:{present:state.hasContext}}));
  });
 }
 function getValue(){return Core.normalize(document.getElementById(ID)?.value||'')?.text||'';}
 function reset(){const box=document.getElementById(ID);if(box){box.value='';box.dispatchEvent(new Event('input',{bubbles:true}));}}
 root.YouthCaseContextForm=Object.freeze({mount,getValue,reset,VERSION:Core.VERSION});document.addEventListener('DOMContentLoaded',mount);
})(typeof window!=='undefined'?window:globalThis);
