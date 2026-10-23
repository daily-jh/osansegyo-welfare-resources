(function(){
'use strict';
const $=id=>document.getElementById(id);
const BASE='http://127.0.0.1:8765';
let context=null,viewRole='teacher',connected=false,providers={},currentAbort=null,revision=0;
const status=$('localAiStatus'),preview=$('localAiResult');
function token(){return $('localAiPair').value.trim()}
function provider(){return $('localAiProvider').value}
function eligible(){
  return !!context&&connected&&!!providers[provider()]&&
    $('localAiOrg').checked&&$('localAiDisclosure').checked;
}
function update(){
  $('localAiRun').disabled=!eligible()||!!currentAbort;
}
function reset(message){
  revision++;
  currentAbort?.abort();currentAbort=null;
  $('localAiOrg').checked=false;
  $('localAiDisclosure').checked=false;
  preview.hidden=true;preview.value='';
  $('localAiCopy').disabled=true;$('localAiPrint').disabled=true;
  status.textContent=message||'개인 PC의 로컬 AI를 연결하면 초안을 작성할 수 있습니다.';
  update();
}
async function request(path,data,controller,timeout=10000){
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
    const r=await fetch(BASE+path,{
      method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
      targetAddressSpace:'loopback',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},
      body:JSON.stringify(data),signal:controller.signal
    });
    const answer=await r.json().catch(()=>({}));
    if(!r.ok){
      const codes={
        unauthorized:'연결 코드가 올바르지 않습니다. PC 연결 프로그램 창에 표시된 코드를 확인하세요.',
        cli_not_available:'선택한 AI CLI가 설치되지 않았거나 PATH에 없습니다. PC에서 설치·로그인을 확인하세요.',
        busy:'현재 다른 AI 분석을 처리 중입니다. 완료된 다음 실행하세요.',
        invalid_assessment:'현재 평가자료를 확인할 수 없습니다. 평가를 다시 완료해 주세요.',
        timeout:'로컬 AI 응답 시간이 초과되었습니다.',
        cli_error:'PC의 AI 실행에 실패했습니다. PC 명령창에서 Codex/Claude 로그인·이용한도를 확인하세요.',
        invalid_ai_response:'AI가 완전한 보고서를 반환하지 않았습니다.'
      };
      throw Error(codes[answer.error]||'PC 연결 프로그램 응답 오류 ('+r.status+').');
    }
    return answer;
  }finally{clearTimeout(timer)}
}
async function check(){
  connected=false;providers={};update();
  if(!/^[a-f0-9]{48}$/.test(token())){
    status.textContent='PC 연결 프로그램에 표시된 48자리 연결 코드를 입력해 주세요.';return;
  }
  const controller=new AbortController();
  status.textContent='개인 PC의 연결 프로그램을 확인하고 있습니다…';
  try {
    const data=await request('/status',{},controller);
    if(data.service!=='osan-youth-local-ai')throw Error('다른 프로그램이 응답했습니다. 포트 8765를 확인하세요.');
    connected=true;providers=data.providers||{};
    const codes=['Codex '+(providers.codex?'설치 확인':'미설치/인식 안 됨'),'Claude Code '+(providers.claude?'설치 확인':'미설치/인식 안 됨')];
    status.textContent='PC 로컬 연결 성공 · '+codes.join(' · ')+'. 평가자료는 아직 전송하지 않았습니다.';
  }catch(e){
    status.textContent=e.name==='AbortError'?'PC 연결 시간이 초과되었습니다. 연결 프로그램을 실행했는지 확인하세요.':
      e.message==='Failed to fetch'||e instanceof TypeError?
      '연결할 수 없습니다. PC 연결 프로그램 실행, Chrome의 로컬 네트워크(루프백) 접근 허용, 브라우저 보안 설정을 확인하세요.':
      e.message;
  }
  update();
}
function assessment(){
  return {
    version:'youth-risk-25-v1',
    role:viewRole,
    provider:provider(),
    answers:context.answers.slice(),
    safety:{
      explicit:Array.isArray(context.explicit)&&context.explicit.length>0,
      followups:context.followups||{}
    },
    includedDomains:Array.isArray(context.includedDomains)?context.includedDomains.slice():undefined
  };
}
window.addEventListener('youth-ai-context-v1',event=>{
  context=event.detail?.payload||null;
  viewRole=event.detail?.role==='social-worker'?'social-worker':'teacher';
  reset('현재 평가('+ (viewRole==='teacher'?'교사':'사회복지사')+' 관점)를 가져왔습니다. PC 연결 및 전송 확인 후 AI 작성을 선택하세요.');
});
$('localAiPair').addEventListener('input',()=>{
  connected=false;providers={};update();
  status.textContent='연결 코드가 바뀌었습니다. 연결 확인을 다시 눌러 주세요.';
});
$('localAiProvider').addEventListener('change',()=>{
  if(currentAbort)currentAbort.abort();
  reset('AI 종류를 변경했습니다. 전송 확인 후 실행해 주세요.');
});
['localAiOrg','localAiDisclosure'].forEach(id=>$(id).addEventListener('change',update));
$('localAiCheck').addEventListener('click',check);
$('localAiRun').addEventListener('click',async()=>{
  if(!eligible()||currentAbort)return;
  const rev=revision;
  const controller=new AbortController();currentAbort=controller;update();
  status.textContent=(provider()==='codex'?'Codex':'Claude Code')+
    '를 내 PC에서 실행합니다. 기존 사례보고서와 점수는 유지됩니다. 긴급 보호·신고를 지연하지 마세요.';
  try{
    const data=await request('/analyze',assessment(),controller,175000);
    if(rev!==revision)return;
    if(typeof data.draft!=='string'||data.draft.length<40||data.draft.length>28000)
      throw Error('AI 초안을 확인할 수 없습니다.');
    preview.value=data.draft;
    preview.hidden=false;$('localAiCopy').disabled=false;$('localAiPrint').disabled=false;
    status.textContent=(data.provider==='claude'?'Claude Code':'Codex')+
      ' 초안을 받았습니다. 보고된 사실·해석·미확인을 검토하고, 실무자가 최종 결정하세요.';
  }catch(e){
    if(rev!==revision)return;
    status.textContent=e.name==='AbortError'?'로컬 AI 연결이 종료되거나 응답시간이 초과되었습니다. 기존 보고서는 유지됩니다.':
      e instanceof TypeError?'PC 로컬 연결이 차단되었습니다. Chrome의 루프백 접근 허용 및 연결 프로그램을 확인하세요.':e.message;
  }finally{if(rev===revision){currentAbort=null;update()}}
});
$('localAiCopy').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(preview.value);
    status.textContent='PC AI가 작성한 참고 초안을 복사했습니다. 기관 문서로 사용하기 전에 내용을 검토하세요.';
  }catch{
    preview.focus();preview.select();
    status.textContent='전체 선택했습니다. Ctrl+C로 복사해 주세요.';
  }
});
$('localAiPrint').addEventListener('click',()=>{
  if(!preview.value)return;
  window.__youthLocalAiPrint=true;
  try{window.print()}finally{window.__youthLocalAiPrint=false}
});
update();
})();
