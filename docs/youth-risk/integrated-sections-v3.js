(function(){'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.integratedSections=function(a){
 const plans=(a.plans||[]).slice(0,3),ctx=a.context||{},domains=(a.domains||[]).filter(x=>x.sum>0).sort((x,y)=>y.sum-x.sum).slice(0,3);
 const tasks=[
 ['01 핵심 상황','주요 영역: '+(domains.map(x=>x.name+' '+x.sum+'점').join(' · ')||'양성 응답 보고 없음')+'. 확인한 문항 합계 '+a.decision.knownTotal+'점.'],
 ['02 안전·보호',a.decision.safetyReview+(ctx.needsSafetyAttention?' 서술에 현재 안전 관련 표현이 있어, 점수와 별도로 학생의 현재 안전을 직접 확인합니다.':'')+((ctx.signals||[]).some(x=>x&&x.safety&&(x.polarity==='negated'||x.timeHint==='historical-mention'||x.subject==='third-party'))?' 일부 안전 관련 표현은 부정·과거·다른 사람 이야기로 분류되어 자동 판정에 반영하지 않았으니 원문을 직접 확인합니다.':'')],
 ['03 학교·일상 기능','학교 참여·가정 돌봄·기본생활의 영역별 어려움을 구분하고 학교와 복지관이 실행할 일을 연결합니다.'],
 ['04 강점과 학생 희망',ctx.fields?.strengths||ctx.fields?.studentWishes||'강점·희망 서술이 추가되지 않았습니다.'],
 ['05 첫 1~2주 실행',plans.length?'아래 표의 순서대로 시작합니다: '+plans.map((x,i)=>(i+1)+'순위 '+x.title).join(', ')+'.':'보편지원·학교생활 점검']
 ];
 // A sentence every task repeats is said once above the table instead of in each row.
 const split=t=>String(t||'').split(/(?<=\.)\s+/).filter(Boolean);
 const shared=plans.length>1?split(plans[0].action).filter(x=>plans.every(p=>split(p.action).includes(x))):[];
 const own=x=>split(x.action).filter(y=>!shared.includes(y)).join(' ');
 const cards=tasks.map(x=>'<section class="j88-assessment-card"><h4>'+esc(x[0])+'</h4><p>'+esc(x[1])+'</p></section>').join('');
 const rows=plans.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(own(x))+'</td><td>'+esc(x.outcome)+'</td></tr>').join('');
 return '<div class="j88-assessment-grid">'+cards+'</div>'+(rows?'<h3>우선 실행과 변화지표</h3>'+(shared.length?'<p class="j88-plan-shared">'+esc(shared.join(' '))+'</p>':'')+'<div class="j88-scroll"><table><thead><tr><th>지원 과제</th><th>첫 행동</th><th>성과 목표</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'');
};
})();