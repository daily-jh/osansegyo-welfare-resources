(function(){'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.integratedSections=function(a){
 const plans=(a.plans||[]).slice(0,3),ctx=a.context||{},domains=(a.domains||[]).filter(x=>x.sum>0).sort((x,y)=>y.sum-x.sum).slice(0,3);
 const tasks=[
 ['01 핵심 상황','주요 영역: '+(domains.map(x=>x.name+' '+x.sum+'점').join(' · ')||'양성 응답 보고 없음')+'. 확인한 문항 합계 '+a.decision.knownTotal+'점.'],
 ['02 안전·보호',a.decision.safetyReview],
 ['03 학교·일상 기능','학교 참여·가정 돌봄·기본생활의 영역별 어려움을 구분하고 학교와 복지관이 실행할 일을 연결합니다.'],
 ['04 강점과 학생 희망',ctx.fields?.strengths||ctx.fields?.studentWishes||'강점·희망 서술이 추가되지 않았습니다.'],
 ['05 첫 1~2주 실행',plans.map((x,i)=>(i+1)+'순위 '+x.title+' — '+x.action).join('\n')||'보편지원·학교생활 점검'],
 ['06 중기 변화 목표',plans.map(x=>x.title+' → '+x.outcome).join('\n')||'기존 보호자원과 학생의 생활기능 유지']
 ];
 const cards=tasks.map(x=>'<section class="j88-assessment-card"><h4>'+esc(x[0])+'</h4><p>'+esc(x[1])+'</p></section>').join('');
 const rows=plans.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.outcome)+'</td></tr>').join('');
 return '<div class="j88-assessment-grid">'+cards+'</div>'+(rows?'<h3>우선 실행과 변화지표</h3><div class="j88-scroll"><table><thead><tr><th>지원 과제</th><th>첫 행동</th><th>성과 목표</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'');
};
})();