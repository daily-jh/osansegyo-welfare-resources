(function(){'use strict';
const main=document.querySelector('main');if(!main)return;
const panel=document.createElement('section');panel.hidden=true;panel.className='deep-pilot-panel';
panel.innerHTML='<h2>심층 해석보고서</h2><p>문항 근거와 다음 행동을 연결한 실무자 검토 초안입니다. 이 기능은 자료를 외부로 전송하지 않습니다.</p><div class="deep-controls"><label><input type="checkbox" id="deep-narrative"> 서술 분석 포함 · 출력 전 식별정보 검토</label><button type="button" id="deep-generate">보고서 생성·갱신</button><button type="button" id="deep-print" disabled>인쇄·PDF 저장</button></div><p id="deep-status" role="status" aria-live="polite">현재 응답으로 보고서를 생성하세요.</p><div id="deep-report-output"></div>';
main.append(panel);const out=panel.querySelector('#deep-report-output'),status=panel.querySelector('#deep-status'),print=panel.querySelector('#deep-print'),narrative=panel.querySelector('#deep-narrative');let payload,key;
function clear(){out.replaceChildren();print.disabled=true;cleanup();status.textContent='자료 또는 출력 옵션이 변경되었습니다. 보고서를 다시 생성하세요.';}
function cleanup(){document.body.classList.remove('deep-report-printing');document.getElementById('deep-print-root')?.remove();}
window.addEventListener('oy-journey-view',e=>{const next=e.detail?.ready?e.detail.payload:null;const nextKey=JSON.stringify(next);panel.hidden=!next;payload=next;if(nextKey!==key){clear();key=nextKey;}});
narrative.onchange=clear;
panel.querySelector('#deep-generate').onclick=()=>{try{const report=window.OYDeepReport.build(payload,{includeNarrative:narrative.checked});out.innerHTML=window.OYDeepReport.render(report);print.disabled=false;status.textContent='보고서를 생성했습니다. 서술 분석 '+(report.includeNarrative?'포함':'미포함')+' · 응답 확인 '+report.completeness.known+'/25문항';}catch{clear();status.textContent='보고서 생성 보류 · 입력 및 모듈 상태를 확인하세요.';}};
print.onclick=()=>{if(print.disabled||!out.firstElementChild)return;cleanup();const printable=document.createElement('div');printable.id='deep-print-root';printable.append(out.firstElementChild.cloneNode(true));printable.querySelectorAll('details').forEach(d=>d.open=true);document.body.append(printable);document.body.classList.add('deep-report-printing');try{window.print();}catch{cleanup();status.textContent='인쇄창을 열지 못했습니다. 다시 시도하세요.';}};
window.addEventListener('afterprint',cleanup);
})();
