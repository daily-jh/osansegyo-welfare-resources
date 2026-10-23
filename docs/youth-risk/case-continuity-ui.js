(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M=window.YouthContinuity;
let current=null,rows=[];
const options=(id,items,selected)=>'<select id="'+esc(id)+'">'+items.map(([key,label])=>'<option value="'+esc(key)+'"'+(selected===key?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
const menu=(list)=>list.map(key=>[key,M.LABELS[key]||key]);
function render(){
 if(!current)return null;
 const inp={initialType:$('contInitialType').value,reviewType:$('contReviewType').value,reviewDecision:$('contReviewDecision').value,
  goals:rows.map(g=>({id:g.id,title:$('title-'+g.id)?.value.trim()||g.title,
   meeting:$('meeting-'+g.id).value,plan:$('plan-'+g.id).value,
   execution:$('exec-'+g.id).value,review:$('review-'+g.id).value,
   evidence:$('evidence-'+g.id).value,
   priority:Number($('priority-'+g.id).value)||null,
   preExisting:$('existing-'+g.id).checked,
   changedReason:$('reason-'+g.id).value
  }))};
 let result;
 try{result=M.analyze(inp)}catch(e){$('continuityResult').textContent=e.message;return null}
 const body='<h3>1차 사정–회의–계획–점검 연속성 검토</h3><p>'+esc(result.agreement.text)+'. 이 수치는 문서에 기록된 목표·회의의 채택 수준만 나타내며, 청소년 척도 정확도·실제 서비스 효과가 아닙니다.</p>'+
 '<div class="continuity-metrics"><span>회의결정 확인 <b>'+result.tally.meetingResolved+'/'+result.tally.assessment+'</b></span><span>계획 확정 <b>'+result.tally.planEstablished+'</b></span><span>실제 진행·접수 근거 <b>'+result.tally.executionConfirmed+'</b></span><span>완료 증빙 확인 <b>'+result.tally.executionCompletedVerified+'</b></span></div>'+
 '<div class="table-scroll"><table class="score-table"><thead><tr><th>과제</th><th>회의</th><th>서비스계획</th><th>이행</th><th>검토·공백</th></tr></thead><tbody>'+
 result.goals.map(g=>'<tr><th>'+esc(g.title)+'</th><td>'+esc(g.meetingStatus)+'</td><td>'+esc(g.planStatus)+'</td><td>'+esc(g.implementationStatus)+'</td><td>'+esc(g.issues.length?g.issues.join(' / '):g.alignment)+'</td></tr>').join('')+'</tbody></table></div>'+
 (result.alerts.length?'<h4>검토할 정합성 문제 '+result.alerts.length+'건</h4><ul>'+result.alerts.map(x=>'<li>'+esc(x.goal+': '+x.issue)+'</li>').join('')+'</ul>':'<p>입력된 구조의 정합성 경고는 없습니다. 기재하지 않은 실제 사실의 정확성을 보증하지는 않습니다.</p>')+
 '<p><b>다음 확인:</b> 단계별 결정 근거·목표 시점·회신 기록·학생과의 합의·기존 기관 중복을 확인합니다. 이행 전후의 생활변화와 점수는 별도로 검토해야 합니다.</p>'+
 result.notes.map(s=>'<p class="continuity-note">'+esc(s)+'</p>').join('');
 $('continuityResult').innerHTML=body;
 const preview=$('reportPreview');if(preview){
   let block=$('continuityInReport');if(!block){block=document.createElement('section');block.id='continuityInReport';block.className='continuity-in-report';preview.append(block)}block.innerHTML=body;
 }
 return result;
}
function add(goal){
 if(rows.length>=20){$('continuityNotice').textContent='검토 과제는 최대 20개입니다.';return;}
 if(rows.some(g=>g.id===goal.id))throw Error('중복 목표 ID입니다.');
 rows.push(goal);
 const id=goal.id;
 const card=document.createElement('section');card.className='continuity-goal';card.dataset.goal=id;
 card.innerHTML='<h4>'+esc(goal.title)+'</h4>'+(goal.isCustom?'<label for="title-'+id+'">실무자가 확인한 추가 목표(식별정보 제외)<input id="title-'+id+'" type="text" maxlength="100" value="'+esc(goal.title)+'"></label>':'')+'<p class="continuity-basis">'+esc(goal.basis||'직접 사정으로 확인한 목표 · 척도 항목과 별도로 기록')+'</p>'+
 '<div class="continuity-fields"><label for="meeting-'+id+'">1차 회의 결정'+options('meeting-'+id,menu(M.MEETING),'unrecorded')+'</label>'+
 '<label for="plan-'+id+'">서비스계획 상태'+options('plan-'+id,menu(M.PLANS),'draft')+'</label>'+
 '<label for="exec-'+id+'">제공·이행 상태'+options('exec-'+id,menu(M.EXEC),'unknown')+'</label>'+
 '<label for="review-'+id+'">점검회의 과제별 의견'+options('review-'+id,menu(M.REVIEW),'unrecorded')+'</label>'+
 '<label for="evidence-'+id+'">이행 확인 근거'+options('evidence-'+id,menu(M.EVIDENCE),'unverified')+'</label>'+
 '<label for="priority-'+id+'">문서상 우선순위<input id="priority-'+id+'" type="number" min="1" max="20" value="'+rows.length+'"></label></div>'+
 '<label class="continuity-check"><input id="existing-'+id+'" type="checkbox"> 이미 지원받던 서비스를 연계·조정하는 과제</label>'+
 '<label for="reason-'+id+'">회의에서 수정한 사유·다시 확인할 내용(비식별)<input id="reason-'+id+'" type="text" maxlength="120" placeholder="미기재·수정·인계 조건 등을 간단히"></label>';
 $('continuityGoals').append(card);
}
function init(p){
 if(!p||!window.YouthPlanning)return;
 current=p;rows=[];$('continuityGoals').replaceChildren();
 const plans=YouthPlanning.analyze(p).plans;
 const eligible=plans.filter(g=>g.domain.sum>0||g.domain.safety).slice(0,10);
 for(const g of eligible)add({id:g.id,title:g.domain.name,basis:g.baseline});
 if(!eligible.length){$('continuityNotice').textContent='점수에 근거한 과제가 없습니다. 회의·실무 확인 사항이 있으면 아래에서 비식별 목표를 추가하세요.'}
 else $('continuityNotice').textContent='평가의 관련 영역으로 만든 검토 틀입니다. 실제 1차 회의 결과와 이용 현황은 직접 확인해 선택해야 합니다.';
 render();
}
function custom(){
 const n=rows.filter(g=>/^C\d+$/.test(g.id)).length+1,id='C'+n;
 add({id,title:'추가 사례목표 '+n,isCustom:true,basis:'척도에서 확인되지 않는 강점·당사자 진로목표·가족지원 등 별도 실무사정'});
 render();
}
document.addEventListener('DOMContentLoaded',()=>{
 if(!$('continuityGoals'))return;
 $('continuityAddGoal').addEventListener('click',custom);
 fetch('data/case-continuity-rules.json',{cache:'no-store',credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('규칙 파일 읽기 실패');return r.json()}).then(db=>{$('continuityDbStatus').textContent='연속성 규칙 DB '+M.setRulesDb(db)+' · 개인정보 전송 없이 로드됨';render()}).catch(()=>{$('continuityDbStatus').textContent='규칙 DB를 읽지 못해 검증된 기본 내장 규칙을 사용합니다. 개인정보 전송은 없습니다.'});
 $('continuitySection').addEventListener('change',render);
 $('continuitySection').addEventListener('input',e=>{if(e.target.matches('input[type=text],input[type=number]'))render()});
});
window.YouthContinuityUI={init,render};
})();