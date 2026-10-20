(function(){
"use strict";
var endpoint=window.YOUTH_USAGE_ENDPOINT||"",evaluationId=null,completed=false,queue=Promise.resolve();
function id(){return crypto.randomUUID()}
function status(text){document.getElementById("usageStatus").textContent=text}
function display(data){var keys=["visitsToday","visitsTotal","assessmentsToday","assessmentsTotal"];if(!keys.every(function(k){return Number.isSafeInteger(data[k])&&data[k]>=0})||!/^\d{4}-\d{2}-\d{2}$/.test(data.day)||!/^\d{4}-\d{2}-\d{2}$/.test(data.since))throw Error("Invalid counts");keys.forEach(function(k){document.getElementById(k).textContent=data[k].toLocaleString("ko-KR")+"회"});status("한국시간 "+data.day+" 기준 · "+data.since+" 집계 시작")}
function send(event,eventId){if(!endpoint)return;queue=queue.then(async function(){try{var url=new URL(endpoint);if(url.protocol!=="https:")throw Error("HTTPS required");var r=await fetch(url.href,{method:"POST",credentials:"omit",referrerPolicy:"no-referrer",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:event,id:eventId}),signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error("Unavailable");display(await r.json())}catch(e){status("집계 연결을 확인할 수 없습니다. 표시된 값이 있으면 마지막 확인값입니다. 평가는 계속 이용할 수 있습니다.")}})}
window.siteUsage={complete:function(){if(completed||!endpoint)return;completed=true;try{evaluationId=evaluationId||id();send("assessment",evaluationId)}catch(e){status("집계 기능을 이용할 수 없습니다. 평가는 계속 이용할 수 있습니다.")}},reset:function(){completed=false;evaluationId=null}};
document.addEventListener("DOMContentLoaded",function(){if(!endpoint){status("공용 집계 연결 준비 중 · 연결 후 실제 이용 횟수가 표시됩니다.");return}send("visit",id())});
})();
