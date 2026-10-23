(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.YOUTH_RISK_DIRECT_AI || {enabled:false,endpoint:"",providerLabel:""};
  let current = null, currentRole = 'teacher', controller = null, revision = 0;
  const run = $('directAiRun'), result = $('directAiResult'), status = $('directAiStatus');
  const selected = () => !!current && Array.isArray(current.answers) && current.answers.length === 25;
  const connected = !!config.enabled && /^https:\/\//.test(config.endpoint||'');
  const active = () => connected && selected() && $('directAiOrg').checked && $('directAiDisclosure').checked && $('directAiKey').value.length >= 24;
  function update() {
    run.disabled = !active();
    $('directAiConnection').textContent = connected
      ? '서버 연결 준비됨 · 사용자가 동의하고 직접 실행할 때만 전송'
      : '서버 미연결 · 기존 사례보고서·AI 요청문 복사는 그대로 이용할 수 있습니다.';
  }
  function reset(message) {
    $('directAiDisclosure').checked=false;
    revision++;
    if (controller) controller.abort();
    controller = null;
    result.value = '';
    result.hidden = true;
    $('directAiCopy').disabled = true;
    $('directAiPrint').disabled = true;
    status.textContent = message || 'AI 작성 결과는 생성 후 검토·수정할 수 있습니다.';
  }
  window.addEventListener('youth-ai-context-v1', event => {
    current = event.detail?.payload || null;
    currentRole = event.detail?.role === 'social-worker' ? 'social-worker' : 'teacher';
    reset('현재 평가와 ' + (currentRole==='teacher'?'교사':'사회복지사') + ' 관점으로 준비되었습니다. AI 이용은 별도 선택입니다.');
    update();
  });
  ['directAiOrg','directAiDisclosure','directAiKey'].forEach(id=>{
    $(id).addEventListener(id==='directAiKey'?'input':'change',update);
  });
  run.addEventListener('click',async()=>{
    if(!active()) return;
    const thisRevision=revision;
    const answers=current.answers.slice();
    if(answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4))) {
      status.textContent='평가 응답을 확인할 수 없습니다.';return;
    }
    controller=new AbortController();
    const timer=setTimeout(()=>controller?.abort(),40000);
    run.disabled=true;
    status.textContent='AI가 사정·판정·서비스계획을 작성하고 있습니다. 긴급 안전확인·신고조치를 기다리지 마세요.';
    const payload={
      version:'youth-risk-25-v1',
      answers,
      safety:{explicit:Array.isArray(current.explicit)&&current.explicit.length>0,followups:current.followups||{}},
      role:currentRole
    };
    try {
      const r=await fetch(config.endpoint,{
        method:'POST',cache:'no-store',mode:'cors',credentials:'omit',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+$('directAiKey').value},
        body:JSON.stringify(payload),signal:controller.signal
      });
      if(!r.ok) throw Error(r.status===401?'접속 코드를 확인해 주세요.':r.status===429?'AI 이용 요청이 많습니다. 잠시 후 재시도해 주세요.':'AI 서버 연결 또는 모델 응답을 확인할 수 없습니다.');
      const data=await r.json();
      if(thisRevision!==revision) return;
      if(typeof data.draft!=='string'||data.draft.length<40||data.draft.length>9000) throw Error('보고서 형식이 올바르지 않습니다.');
      result.value=data.draft;
      result.hidden=false;
      $('directAiCopy').disabled=false;
      $('directAiPrint').disabled=false;
      status.textContent=(data.provider||config.providerLabel||'AI')+' · 참고 초안 생성 완료. 평가 점수와 안전 판정은 변경하지 않았습니다. 담당자 검토 후 이용하세요.';
    }catch(error){
      if(thisRevision===revision) status.textContent=error.name==='AbortError'?'AI 응답 시간이 초과되었습니다. 기존 사례보고서를 이용할 수 있습니다.':error.message;
    }finally{
      clearTimeout(timer);controller=null;if(thisRevision===revision)update();
    }
  });
  $('directAiCopy').addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(result.value);
      status.textContent='검토용 AI 초안을 복사했습니다. 원 평가·사례보고서와 반드시 대조해 주세요.';
    }catch{
      result.focus();result.select();status.textContent='전체 선택했습니다. Ctrl+C로 복사해 주세요.';
    }
  });
  $('directAiPrint').addEventListener('click',()=>{
    if(!result.value)return;
    window.__youthDirectAiPrint = true;
    window.print();
    window.__youthDirectAiPrint = false;
  });
  update();
})();
