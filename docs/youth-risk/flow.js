(function(){'use strict';const $=id=>document.getElementById(id),origin=location.origin;let stage=1,revision=0,ready=false,payload=null,view='result',report=null,map=null,selection=[],recordFrames=new Map(),registrations=new Map();const assessment=$('assessmentFrame');registrations.set(assessment,{kind:'assessment'});
function send(f,m){f.contentWindow?.postMessage(m,origin)}
function frame(kind,path,p){const f=document.createElement('iframe');f.title=kind==='report'?'사례검토 보고서·서비스계획서':kind==='map'?'지원 연결지도':'직접 기록·점검';f.src=new URL(path,document.baseURI).href+'?v=20261023-security1';f.className='flow-frame';registrations.set(f,{kind,payload:p,revision});
 if(kind==='report'){
  f.addEventListener('load',()=>{
   const doc=f.contentDocument;
   if(!doc||!doc.getElementById('exampleMain')){
    f.hidden=true;
    $('reportLoading').hidden=false;
    $('reportLoading').textContent='보고서 대신 다른 페이지가 표시되어 중첩 화면을 차단했습니다. 아래 버튼으로 다시 불러오세요.';$('retryReport').hidden=false;
    return;
   }
   send(f,{type:'youth-support-data-v1',...p});
  });
 }
 return f}
function recordKey(){return revision+'|'+selection.slice().sort((a,b)=>a-b).join(',')}
function currentPayload(){return {...payload,includedDomains:selection.slice(),flowRevision:revision}}
function clearDerived(){if(report){registrations.delete(report);report.remove();report=null}if(map){registrations.delete(map);map.remove();map=null}}
function focusChoices(){const ds=YouthPlanning.analyze(payload).plans.map(g=>g.domain);$('focusChoices').replaceChildren();ds.filter(d=>d.sum>0).forEach(d=>{let l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=selection.includes(d.i);c.disabled=d.safety;c.setAttribute('aria-label',d.name+' 계획에 포함');c.onchange=()=>{selection=c.checked?[...new Set([...selection,d.i])]:selection.filter(i=>i!==d.i);if(report){registrations.delete(report);report.remove();report=null}$('flowStatus').textContent='계획에 포함할 영역을 반영했습니다. 척도 점수·안전 판정은 바뀌지 않습니다.'};l.append(c,document.createTextNode(d.name+(d.safety?' · 안전 우선':'')));$('focusChoices').append(l)});$('focusPanel').hidden=!ds.some(d=>d.sum>0)}
function show(n){if(![1,2,3,4].includes(n))return;if(n!==1&&!ready){$('flowStatus').textContent='응답을 수정한 뒤 평가를 완료하면 다음 내용을 확인할 수 있습니다.';return}stage=n;if(n>1)$('welcome').hidden=true;document.querySelectorAll('[data-result-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.resultView===view)));$('assessmentArea').hidden=!(stage===1||stage===2&&view==='result');$('mapArea').hidden=!(stage===2&&view==='map');$('reportArea').hidden=stage!==3;$('recordsArea').hidden=stage!==4;$('resultTools').hidden=stage!==2;$('focusPanel').hidden=stage!==2||!payload||YouthPlanning.analyze(payload).plans.length===0;
 document.querySelectorAll('[data-stage]').forEach(b=>{b.disabled=+b.dataset.stage!==1&&!ready;b.setAttribute('aria-current',+b.dataset.stage===stage?'step':'false')});$('stepTitle').textContent=['','학생의 생활과 어려움 살펴보기','평가결과·우선개입·지원연계','청소년 통합지원 사례검토 보고서 · 선택','실제 기록·조정·점검 · 선택'][stage];$('previousStep').hidden=stage===1;$('nextStep').hidden=stage>=2;$('nextStep').textContent=['','평가 완료 · 결과 확인 →','',''][stage];send(assessment,{type:'youth-flow-mode-v1',mode:stage===1?'response':'result'});
 if(stage===2&&view==='map'&&!map){map=frame('map','support.html',currentPayload());$('mapArea').append(map)}if(stage===3&&!report){$('retryReport').hidden=true;$('reportLoading').hidden=false;$('reportLoading').textContent='사례검토 보고서를 불러오는 중입니다. 평가결과를 전달하고 있습니다.';report=frame('report','case-examples.html',currentPayload());$('reportArea').append(report)}
 if(stage===4){const key=recordKey();if(!recordFrames.has(key)){let f=frame('records','workbench.html',currentPayload());recordFrames.set(key,f);$('recordFrames').append(f);const o=document.createElement('option');o.value=key;o.textContent='평가 '+revision+'차 · 기록안 '+recordFrames.size;$('recordVersion').append(o)}$('recordVersion').value=key;selectRecord();}
 window.scrollTo({top:0,behavior:'smooth'});
}
function selectRecord(){const selected=$('recordVersion').value;recordFrames.forEach((f,r)=>f.hidden=r!==selected);$('recordHistoryNotice').textContent=selected===recordKey()?'현재 완료한 평가 응답을 바탕으로 기록합니다.':'이전 평가 응답의 기록입니다. 현재 평가와 혼합하지 않고 보존합니다.'}
function validBackup(v){return !!v&&v.format==='osan-youth-risk-backup-v1'&&Array.isArray(v.answers)&&v.answers.length===25&&v.answers.every(a=>a==='unknown'||Number.isInteger(a)&&a>=0&&a<=4)&&Array.isArray(v.explicit)&&v.explicit.length<=10&&v.explicit.every(a=>typeof a==='string'&&a.length<200)&&!!v.followups&&typeof v.followups==='object'&&!Array.isArray(v.followups)&&Object.entries(v.followups).every(([k,value])=>['4','5','12','13'].includes(k)&&['yes','no','unknown'].includes(value))}
function exportBackup(){if(!ready||!payload)return;const data={format:'osan-youth-risk-backup-v1',answers:payload.answers.slice(),explicit:payload.explicit.slice(),followups:{...payload.followups}};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='osan-youth-risk-anonymous-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);$('fileTransferStatus').textContent='비식별 25문항 점수와 안전확인 응답을 파일로 저장했습니다. 자유서술·이름·성별·행정동은 포함하지 않았습니다. 불러온 뒤 연계용 성별·행정동을 다시 선택해 주세요.'}
async function importBackup(f){if(!f)return;try{if(f.size>16000)throw Error('파일 용량이 너무 큽니다. 16KB 이하의 평가 JSON만 허용합니다.');const raw=JSON.parse(await f.text());if(!validBackup(raw))throw Error('형식이 올바르지 않습니다. 이 시스템의 비식별 평가 JSON을 선택하세요.');$('fileTransferStatus').textContent='저장된 문항과 안전확인을 복원하고 평가결과를 다시 계산합니다.';show(1);send(assessment,{type:'youth-flow-import-v1',backup:raw})}catch(e){$('fileTransferStatus').textContent=e.message||'파일을 불러오지 못했습니다.'}finally{$('importAssessment').value=''}}
$('exportAssessment').onclick=exportBackup;$('importAssessment').onchange=()=>importBackup($('importAssessment').files?.[0]);
window.addEventListener('message',e=>{if(e.origin!==origin)return;const entry=[...registrations].find(([f])=>f.contentWindow===e.source);if(!entry)return;const [f,meta]=entry,t=e.data?.type;
 if(t==='youth-flow-size-v1'){const h=e.data.height;if(Number.isFinite(h)&&h>100&&h<200000&&Math.abs(Number(f.height)-h)>2){f.height=String(h);f.style.height=h+'px'}return}
 if(t==='youth-flow-child-ready-v1'){if(f===assessment)send(f,{type:'youth-flow-mode-v1',mode:stage===1?'response':'result'});return}
 if(t==='youth-flow-report-ready-v1'&&meta.kind==='report'&&f===report){$('retryReport').hidden=true;$('reportLoading').hidden=true;f.hidden=false;return}
 if(t==='youth-flow-report-error-v1'&&meta.kind==='report'&&f===report){$('reportLoading').hidden=false;$('reportLoading').textContent='보고서 자동 생성 중 오류가 발생했습니다. 기존 평가 응답은 유지됩니다. 아래 버튼으로 다시 불러오세요.';$('retryReport').hidden=false;return}
 if(t==='youth-flow-invalid-v1'&&f===assessment){ready=false;clearDerived();$('exportAssessment').disabled=true;if(stage!==1)show(1);else document.querySelectorAll('[data-stage]').forEach(b=>b.disabled=+b.dataset.stage!==1);$('flowStatus').textContent=revision?'응답이 바뀌었습니다. 평가를 다시 완료하면 결과와 보고서에 반영됩니다. 이전 기록은 보존합니다.':'응답을 선택한 뒤 평가를 완료해 주세요.';return}
 if(t==='youth-flow-complete-v1'&&f===assessment&&YouthMap.validate(e.data.payload)){payload=e.data.payload;revision++;ready=true;selection=YouthPlanning.analyze(payload).defaultDomains;clearDerived();focusChoices();view='result';$('exportAssessment').disabled=false;$('flowStatus').textContent='평가 '+revision+'차 결과를 반영했습니다. 결과와 연계를 확인한 뒤 보고서·계획안을 살펴보세요.';show(2);return}
 if(t==='youth-flow-go-v1'){if(e.data.stage===2&&e.data.view==='map')view='map';show(e.data.stage);return}
 if(['youth-support-request-v1','youth-workbench-request-v1'].includes(t)&&meta.payload){
  if(!ready||meta.revision!==revision){send(f,{type:'youth-support-unavailable-v1'});return;}
  if(meta.kind==='report'&&!f.contentDocument?.getElementById('exampleMain'))return;
  send(f,{type:'youth-support-data-v1',...meta.payload});
 }
});
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>show(+b.dataset.stage));$('previousStep').onclick=()=>show(stage>=3?2:1);$('nextStep').onclick=()=>{if(stage===1)send(assessment,{type:'youth-flow-calculate-v1'});else show(stage+1)};document.querySelectorAll('[data-result-view]').forEach(b=>b.onclick=()=>{view=b.dataset.resultView;document.querySelectorAll('[data-result-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));show(2)});$('retryReport').onclick=()=>{if(!ready)return;if(report){registrations.delete(report);report.remove();report=null}show(3)};$('recordVersion').onchange=selectRecord;$('startAssessment').onclick=()=>{$('welcome').hidden=true;$('stepTitle').setAttribute('tabindex','-1');$('stepTitle').focus();$('assessmentFlow').scrollIntoView({behavior:'smooth',block:'start'})};$('resourceBridgeStart').onclick=()=>$('startAssessment').click();show(1);
})();
