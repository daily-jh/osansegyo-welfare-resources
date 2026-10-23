(function(){
'use strict';
const $=id=>document.getElementById(id);
const urls=YouthPersonalAI.routes;
let assessment=null,role='teacher',dirty=true,packet='',lastPrepared='',printed=false;
const area=$('studentNarrative'),preview=$('personalAiPacket'),status=$('personalAiStatus'),confirm=$('personalAiPermission');
const providers=[...document.querySelectorAll('[data-open-ai]')];
function ready(){return !!assessment&&!!confirm.checked&&!!packet&&packet===lastPrepared&&!dirty}
function refresh(){
  const active=ready();
  $('personalAiCopy').disabled=!active;
  $('personalAiShare').disabled=!active;
  providers.forEach(b=>b.disabled=!active);
  $('narrativeLength').textContent=area.value.length.toLocaleString('ko-KR')+' / 6,000자';
  const responseReady=!!$('personalAiResponse').value.trim();
  $('personalAiResponseCopy').disabled=!responseReady;
  $('personalAiResponsePrint').disabled=!responseReady;
}
function clearContext(message){
  assessment=null;packet='';lastPrepared='';dirty=true;
  area.value='';preview.value='';confirm.checked=false;
  $('personalAiDetails').open=false;
  $('personalAiResponse').value='';
  $('personalAiReturn').open=false;
  status.textContent=message;
  refresh();
}
window.addEventListener('youth-ai-context-v1',event=>{
  const next=event.detail?.payload||null;
  const r=event.detail?.role==='social-worker'?'social-worker':'teacher';
  if(assessment===next&&role===r)return;
  // Changing professional perspective preserves drafted field, but requires a new review.
  const newAssessment=assessment!==next;
  assessment=next;role=r;
  if(newAssessment){area.value='';$('personalAiResponse').value='';$('personalAiReturn').open=false}
  dirty=true;packet='';lastPrepared='';preview.value='';
  confirm.checked=false;$('personalAiDetails').open=false;
  status.textContent='현재 평가와 '+(role==='teacher'?'교사':'사회복지사')+' 관점을 가져왔습니다. 학생 상황을 추가한 뒤 분석자료를 확인해 주세요.';
  refresh();
});
function invalidate(){
  dirty=true;packet='';lastPrepared='';
  preview.value='';confirm.checked=false;
  status.textContent='입력 내용이 바뀌었습니다. 합쳐진 분석자료를 다시 확인하고 선택해 주세요.';
  refresh();
}
area.addEventListener('input',invalidate);
confirm.addEventListener('change',refresh);
$('personalAiResponse').addEventListener('input',refresh);
$('personalAiPreview').addEventListener('click',()=>{
  if(!assessment){status.textContent='25문항 평가 완료 후 3단계에서 분석자료를 확인할 수 있습니다.';return}
  try{
    packet=YouthPersonalAI.create(assessment,role,area.value,YouthCriteria);
    preview.value=packet;lastPrepared=packet;dirty=false;
    $('personalAiDetails').open=true;
    status.textContent='25문항 평가 결과와 학생 추가 기록을 합쳤습니다. 내용을 확인하고 식별정보를 제외한 뒤 아래 항목을 체크해 주세요.';
    refresh();preview.focus();
  }catch(err){status.textContent=err.message;packet='';lastPrepared='';refresh()}
});
function fallbackSelect(){
  $('personalAiDetails').open=true;
  preview.focus();preview.select();
  status.textContent='자동 복사가 제한되었습니다. 분석자료를 선택했으므로 복사한 뒤 사용 중인 AI에 붙여넣어 주세요.';
}
function copyPacket(){
  if(!ready())return Promise.resolve(false);
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(packet).then(()=>true).catch(()=>{fallbackSelect();return false});
  fallbackSelect();return Promise.resolve(false);
}
$('personalAiCopy').addEventListener('click',async()=>{
  if(!ready())return;
  const ok=await copyPacket();
  if(ok)status.textContent='분석 요청문을 복사했습니다. 사용 중인 AI 채팅창에 붙여넣고 실행해 주세요.';
});
providers.forEach(button=>{
  button.addEventListener('click',async()=>{
    if(!ready())return;
    const target=urls[button.dataset.openAi];
    if(!target)return;
    // Clipboard write and window.open are both started directly from the click event.
    const copyOperation=copyPacket();
    const opened=window.open(target,'_blank');
    if(opened)opened.opener=null;
    const copied=await copyOperation;
    if(copied)status.textContent='분석자료를 복사하고 '+button.textContent.trim()+' 화면을 열었습니다. 채팅창에 붙여넣고 보내 주세요. 응답은 이 페이지에서 자동으로 읽을 수 없습니다.';
    else status.textContent='AI 화면을 열었습니다. 미리보기의 분석자료를 직접 복사해 채팅창에 붙여넣어 주세요.';
    $('personalAiReturn').open=true;
  });
});
$('personalAiShare').addEventListener('click',async()=>{
  if(!ready())return;
  if(!navigator.share){
    const ok=await copyPacket();
    status.textContent=ok?'이 기기에서는 공유 메뉴를 사용할 수 없어 분석자료를 복사했습니다. AI 앱을 열어 붙여넣어 주세요.':'공유가 지원되지 않습니다. 미리보기에서 전체 내용을 선택해 복사해 주세요.';
    return;
  }
  try{
    await navigator.share({title:'청소년 통합지원 사례검토·서비스계획서 작성 요청',text:packet});
    status.textContent='기기 공유 기능으로 분석자료를 전달했습니다. 공유할 앱에서 실제 전송 내용을 확인해 주세요.';
    $('personalAiReturn').open=true;
  }catch(e){
    if(e.name!=='AbortError')status.textContent='공유 기능이 제한되어 있습니다. 분석 요청문 복사를 사용해 주세요.';
  }
});
$('personalAiResponseCopy').addEventListener('click',async()=>{
  const body=$('personalAiResponse').value;
  if(!body.trim())return;
  try{await navigator.clipboard.writeText(body);status.textContent='검토·수정한 AI 답변을 복사했습니다.'}
  catch{$('personalAiResponse').focus();$('personalAiResponse').select();status.textContent='수정한 AI 답변을 선택했습니다. 기기 복사 기능을 이용해 주세요.'}
});
$('personalAiResponsePrint').addEventListener('click',()=>{
  if(!$('personalAiResponse').value.trim())return;
  window.__youthPersonalAiPrint=true;
  try{window.print()}finally{window.__youthPersonalAiPrint=false}
});
refresh();
})();