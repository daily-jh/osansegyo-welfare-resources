(function(){
"use strict";
var domains=[
{name:"아동학대·보호",color:"#e84b7a",items:[
"보호자로부터 신체적·정서적 위협을 받거나 보호가 부족하다고 의심할 만한 구체적인 징후가 관찰됩니다.",
"학생의 진술·행동·신체 상태에서 학대 또는 성적 피해를 의심할 정황이 발견됩니다.",
"가정 내 심각한 갈등·방임으로 안전한 거처나 도움을 받을 보호자가 부족해 보입니다."]},
{name:"학교폭력·또래갈등",color:"#9976d6",items:[
"반복적인 따돌림·욕설·폭행 등으로 등교 또는 학교생활을 어려워합니다.",
"금품 요구·협박·성적 괴롭힘 등 또래에게 피해를 당한 정황이 확인됩니다.",
"다른 학생에게 반복적으로 위협·폭력·괴롭힘 행동을 보이거나 갈등이 심화됩니다."]},
{name:"자해·자살·정신건강",color:"#ec577d",items:[
"우울감·불안·무기력·심한 위축이 계속되며 평소 활동과 관계에 변화가 뚜렷합니다.",
"자해 흔적·죽음에 관한 반복적 언급·자살을 암시하는 표현 등 안전확인이 필요한 신호가 있습니다.",
"심한 감정 기복·공황 유사 반응·현저한 수면 변화로 일상 기능이 저하됩니다."]},
{name:"학습·출결",color:"#2f83c3",items:[
"지각·조퇴·결석이 증가하거나 등교를 지속적으로 피합니다.",
"기초학습·수업 집중·과제 수행에 어려움이 누적되고 기존 지원만으로 호전되지 않습니다.",
"학습 의욕과 학교 소속감이 크게 떨어지거나 학업 지속에 대한 포기를 표현합니다."]},
{name:"행동·품행",color:"#dc9438",items:[
"분노 조절의 어려움·물건 파손·공격적인 반응이 반복적으로 관찰됩니다.",
"규칙 위반·무단이탈·타인의 권리 침해가 반복되어 학교생활에 영향을 줍니다.",
"음주·흡연·위험한 외출 등 건강과 안전을 해칠 가능성이 있는 행동이 발견됩니다."]},
{name:"장애·발달 및 지원환경",color:"#518cdb",items:[
"의사소통·주의집중·대인관계의 어려움 때문에 수업이나 생활에 지속적인 지원이 필요합니다.",
"감각·인지·발달적 특성에 비해 교육환경의 조정이 부족하여 참여나 적응에 어려움이 발생합니다.",
"필요한 정당한 편의·보조공학·교육·돌봄 지원을 받지 못해 활동 기회가 제한됩니다."]},
{name:"가족·돌봄",color:"#e57b3c",items:[
"보호자의 부재·질병·돌봄 여력 부족으로 식사·생활관리·안전확인에 공백이 생깁니다.",
"가족 갈등·양육 스트레스·보호자 정서 문제로 학생의 학교생활과 정서가 영향을 받습니다.",
"학생이 가족의 간병·돌봄·가사 책임을 과도하게 떠맡아 학습·휴식에 지장을 받습니다."]},
{name:"경제·주거",color:"#b881c1",items:[
"급식 외 식사·의복·위생용품·학습준비물 등 기본생활에 필요한 물품이 부족합니다.",
"주거 불안정·잦은 이사·비위생적 환경 때문에 건강·안전·학습이 방해받습니다.",
"경제적 사정으로 의료·치료·교육·생활에 필요한 지원이 연기되거나 중단됩니다."]},
{name:"관계·사회적 고립",color:"#4e9fd0",items:[
"친구·교사·가족과의 관계가 급격히 축소되고 혼자 지내는 시간이 늘었습니다.",
"어려움이 생겼을 때 신뢰하고 도움을 요청할 수 있는 어른이나 지지망이 부족합니다.",
"대인관계 갈등 또는 사회적 불안으로 교내외 활동 참여를 지속적으로 회피합니다."]},
{name:"디지털·온라인 위험",color:"#29aa9b",items:[
"온라인에서 개인정보 유포·협박·사이버 따돌림 등 피해가 의심됩니다.",
"게임·SNS·영상 이용 때문에 수면·학습·대면관계의 기능 저하가 지속됩니다.",
"온라인 유해접촉·성적 요구·그루밍·디지털 성착취 등 위험에 노출된 징후가 있습니다."]}
];
var routes=[
["오산시아동보호전문기관","오산세교종합사회복지관","오산시청"],
["경기도교육청 Wee 프로젝트","오산시청소년상담복지센터"],
["오산시정신건강복지센터","오산시청소년상담복지센터","경기도교육청 Wee 프로젝트"],
["경기도교육청 Wee 프로젝트","오산시청소년상담복지센터","초록우산","삼성꿈장학재단"],
["오산시청소년상담복지센터","경기도교육청 Wee 프로젝트"],
["오산시장애인종합복지관","경기도발달장애인지원센터","오산시하나울복지센터"],
["오산시가족센터","오산세교종합사회복지관","오산시청소년상담복지센터"],
["오산시 동 행정복지센터","오산세교종합사회복지관","초록우산"],
["오산시청소년상담복지센터","경기도교육청 Wee 프로젝트"],
["오산시청소년상담복지센터","경기도교육청 Wee 프로젝트","오산시아동보호전문기관"]
];
var answers=new Array(30).fill(null), ready=false, csv=[], fallback=[
{기관명:"오산세교종합사회복지관",범주:"오산시",대표전화:"031-290-8501",홈페이지:"https://www.osgwc.or.kr/",서비스명:"통합사례관리 및 서비스 연계"},
{기관명:"오산시아동보호전문기관",범주:"오산시",대표전화:"",홈페이지:"https://www.osan.go.kr/",서비스명:"피해아동·가족 사례관리(신고는 112)"},
{기관명:"오산시청소년상담복지센터",범주:"오산시",대표전화:"",홈페이지:"https://www.cyber1388.kr/",서비스명:"청소년 상담·청소년안전망"},
{기관명:"오산시정신건강복지센터",범주:"오산시",대표전화:"",홈페이지:"https://www.osan.go.kr/",서비스명:"정신건강 상담·사례관리"},
{기관명:"경기도교육청 Wee 프로젝트",범주:"경기도",대표전화:"",홈페이지:"https://www.goe.go.kr/",서비스명:"Wee클래스·Wee센터"},
{기관명:"오산시가족센터",범주:"오산시",대표전화:"",홈페이지:"https://www.familynet.or.kr/",서비스명:"가족 상담·돌봄"},
{기관명:"오산시장애인종합복지관",범주:"오산시",대표전화:"",홈페이지:"https://www.osan.go.kr/",서비스명:"장애인 상담·가족지원"},
{기관명:"오산시 동 행정복지센터",범주:"오산시",대표전화:"",홈페이지:"https://www.osan.go.kr/",서비스명:"공적급여·위기가구 발굴"}
];
var $=function(id){return document.getElementById(id)};
var clean=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
function makeQuestions(){
var section=$("questions"), html="", idx=0;
domains.forEach(function(d,di){
html+='<section class="domain-card" aria-labelledby="dt'+di+'"><div class="domain-header"><span class="domain-index">'+(di+1)+'</span><span class="domain-title" id="dt'+di+'">'+clean(d.name)+'</span><span class="domain-count" id="dc'+di+'">0/3문항 · 0/12점</span></div>';
d.items.forEach(function(q){
html+='<div class="question" id="qi'+idx+'"><div class="question-text"><span class="question-number">'+String(idx+1).padStart(2,"0")+'</span>'+clean(q)+'</div><div class="options" role="radiogroup" aria-label="'+(idx+1)+'번 문항 점수">';
for(var v=0;v<=4;v++)html+='<label class="score-choice" title="'+v+'점"><input type="radio" name="q'+idx+'" value="'+v+'" aria-label="'+v+'점"><span>'+v+'</span></label>';
html+='</div></div>';idx++;
});html+='</section>';
});section.innerHTML=html;
section.addEventListener("change",function(e){
if(!e.target.matches('input[type="radio"]'))return;
var index=Number(e.target.name.slice(1));answers[index]=Number(e.target.value);
$("qi"+index).classList.add("has-value");ready=false;updateProgress();clearResult();
});
}
function updateProgress(){
var filled=answers.filter(function(v){return v!==null}).length;
var total=answers.reduce(function(a,b){return a+(b===null?0:b)},0);
$("filled").textContent=filled;$("liveTotal").innerHTML=total+'<small> / 120점 (임시)</small>';
$("progressBar").style.width=(filled/30*100)+"%";
$("progressHint").textContent=filled===30?"30문항 응답 완료. 판정 버튼으로 결과를 확인하세요.":(30-filled)+"개 문항이 남았습니다. 미응답 문항에 0점을 자동 부여하지 않습니다.";
var s="";
domains.forEach(function(d,i){var arr=answers.slice(i*3,i*3+3),count=arr.filter(function(v){return v!==null}).length,score=arr.reduce(function(a,b){return a+(b===null?0:b)},0);
$("dc"+i).textContent=count+"/3문항 · "+score+"/12점";
s+='<div class="domain-progress-item"><span>'+clean(d.name)+'</span><span class="bar"><i style="width:'+(score/12*100)+'%;background:'+d.color+'"></i></span><strong>'+score+'/12</strong></div>';
});$("domainProgress").innerHTML=s;
}
function getUrgent(){return Array.from(document.querySelectorAll("[data-urgent]:checked")).map(function(n){return n.getAttribute("data-urgent")})}
function updateUrgent(){$("urgentNow").hidden=getUrgent().length===0;ready=false;clearResult()}
function clearResult(){$("resultBody").innerHTML='<div class="empty-result"><strong>평가 결과를 기다리고 있습니다.</strong><p>30개 문항의 점수를 모두 선택하고 ‘평가 완료’ 버튼을 눌러 주세요.</p></div>';$("resourceList").innerHTML='<div class="empty-result"><p>평가 완료 후 위험영역에 따라 추천기관이 표시됩니다.</p></div>'}
function calculate(){
var missing=answers.findIndex(function(v){return v===null});if(missing!==-1){alert((missing+1)+"번 문항부터 미응답 항목이 있습니다. 30개 각각 점수를 선택해 주세요.");$("qi"+missing).scrollIntoView({behavior:"smooth",block:"center"});var radio=$("qi"+missing).querySelector("input");radio.focus();return}
ready=true;
var total=answers.reduce(function(a,b){return a+b},0);
var domainScores=domains.map(function(d,i){return answers.slice(i*3,i*3+3).reduce(function(a,b){return a+b},0)});
var explicit=getUrgent(),inferred=[];
if(answers[7]>=3)inferred.push("자해·자살 관련 문항(8번) 고위험 응답: 현시점 안전 여부를 즉시 대면 확인");
if(answers[1]>=2)inferred.push("학대 의심 관련 문항(2번) 응답: 신고의무·보호조치 검토");
if(answers[29]>=3)inferred.push("디지털 성착취 위험 관련 문항(30번) 고위험 응답: 안전확인 및 신고·전문기관 협력");
var urgent=explicit.length>0||inferred.length>0;
var rank=total<=24?0:total<=49?1:total<=79?2:3;
var names=["관찰·예방 및 경과점검","학교 내 학맞통 검토","학맞통·외부기관 연계 권고","다기관 집중 개입 검토"];
var description=["전반적인 응답 점수는 낮지만 개별 위험신호와 보호요인을 확인하고 관찰을 지속합니다.","담임·상담교사 등 학교 지원체계를 통해 추가 사정과 학생맞춤통합지원 협의를 검토합니다.","위기영역이 복합적일 가능성이 있어 학교와 복지·상담 전문기관의 공동 사정 및 서비스 연계를 권고합니다.","학교·상담·복지·보건 등 다기관 협력과 집중적인 안전·지원계획 수립을 우선 검토합니다."];
var who=$("studentName").value.trim(),heading=urgent?"즉시 안전확인 및 보호·신고 검토":names[rank];
var html='<div class="result-main'+(urgent?' urgent':'')+'"><span class="eyebrow">TEST 평가결과'+(who?' · '+clean(who):'')+'</span><div class="sum">'+total+'<small> / 120점</small></div><h3>'+clean(heading)+'</h3><p>'+clean(urgent?"선택된 안전신호가 우선입니다. 점수판정을 기다리지 말고 필요한 긴급조치를 실시하세요.":description[rank])+'</p><p class="sub">시범 구간: 0~24 / 25~49 / 50~79 / 80~120점. 절단점의 타당도는 검증되지 않았습니다.</p></div>';
html+='<div class="routes">';
if(urgent)html+='<div class="route urgent-route"><strong>🚨 즉시개입 검토</strong><small>현재 안전확보, 112·119, 신고의무 및 보호체계</small></div>';
html+='<div class="route"><strong>🏫 학맞통 연계</strong><small>담임·상담교사·학교 학생맞춤통합지원 담당 협의</small></div>';
if(total>24||urgent)html+='<div class="route"><strong>🏥 외부 전문기관 연계</strong><small>청소년상담·정신건강·아동보호 등 위험영역별 연계</small></div>';
html+='<div class="route"><strong>🤝 사례관리 검토</strong><small>욕구사정·보호요인·지원계획 및 재점검</small></div></div>';
var highs=domainScores.map(function(v,i){return {i:i,s:v}}).sort(function(a,b){return b.s-a.s}).filter(function(x){return x.s>0}).slice(0,3);
html+='<div class="result-todo"><b>우선 확인 영역</b><ul>';
if(highs.length===0)html+='<li>모든 영역 0점 — 응답 근거와 누락된 위험이 없는지 확인하세요.</li>';
highs.forEach(function(x){html+='<li>'+clean(domains[x.i].name)+' '+x.s+'/12점</li>'});
if(explicit.length)explicit.forEach(function(x){html+='<li><strong>긴급 체크:</strong> '+clean(x)+'</li>'});
if(inferred.length)inferred.forEach(function(x){html+='<li><strong>특별 확인:</strong> '+clean(x)+'</li>'});
html+='</ul><p style="font-size:12px;margin:9px 0 0">총점은 상황 판단을 보조하는 시범 지표입니다. 아동학대 의심은 점수와 무관하게 관련 법령과 기관 신고 절차를 적용합니다.</p></div><div class="print"><button id="printResult" type="button" class="btn btn-muted">결과 인쇄 (현재 기기에서만 처리)</button></div>';
$("resultBody").innerHTML=html;$("printResult").onclick=function(){window.print()};
renderResources(domainScores);
$("result").scrollIntoView({behavior:"smooth",block:"start"});
}
function parseCsv(text){
var rows=[],row=[],value="",quoted=false;
text=String(text).replace(/^\uFEFF/,"");
for(var i=0;i<text.length;i++){
var c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}
else if(c===","&&!quoted){row.push(value);value=""}
else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(value);if(row.some(function(x){return x!==""}))rows.push(row);row=[];value=""}
else value+=c;
}if(value||row.length){row.push(value);rows.push(row)}
var keys=rows.shift()||[];return rows.map(function(r){var o={};keys.forEach(function(k,i){o[k]=r[i]||""});return o});
}
function getLink(u){try{var url=new URL(u,location.href);return /^https?:$/.test(url.protocol)?url.href:""}catch(e){return ""}}
function renderResources(domainScores){
if(!ready)return;
var ranked=domainScores.map(function(s,i){return {s:s,i:i}}).sort(function(a,b){return b.s-a.s}).filter(function(x){return x.s>0});
var selected=ranked.slice(0,4),names=[];
if(getUrgent().length||answers[1]>=2){names.push("오산시아동보호전문기관")}
if(answers[7]>=2||ranked.some(function(x){return x.i===2})){names.push("오산시정신건강복지센터")}
selected.forEach(function(x){(routes[x.i]||[]).forEach(function(n){if(names.indexOf(n)===-1)names.push(n)})});
if(!selected.length)names=["오산시청소년상담복지센터","경기도교육청 Wee 프로젝트","오산세교종합사회복지관"];
names=names.slice(0,9);
var grouped=new Map();
(csv.length?csv:fallback).forEach(function(row){var key=row["기관명"];if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row)});
var content="";
names.forEach(function(name){var entry=grouped.get(name)||fallback.filter(function(r){return r.기관명===name});if(!entry.length)return;
var item=entry[0],services=entry.map(function(r){return r["서비스명"]}).filter(Boolean).slice(0,3).join(" · "),url=getLink(item["홈페이지"]||item["근거URL"]);
content+='<article class="resource-item"><span class="category">'+clean(item["범주"])+' · 기관별 문의 필요</span><h3>'+clean(name)+'</h3><p>'+clean(services)+'</p>';
if(item["대표전화"])content+='<p>대표전화: '+clean(item["대표전화"])+'</p>';
if(url)content+='<a href="'+clean(url)+'" target="_blank" rel="noopener noreferrer">기관 안내 보기 ↗</a>';content+='</article>';
});
$("resourceList").innerHTML=content||'<div class="empty-result"><p>일치 기관이 없습니다. 전체 복지자원 검색 페이지에서 직접 확인해 주세요.</p></div>';
}
function init(){
makeQuestions();updateProgress();
$("complete").addEventListener("click",calculate);
$("asideComplete").addEventListener("click",calculate);
$("safetyChecks").addEventListener("change",updateUrgent);
$("reset").addEventListener("click",function(){if(!confirm("이름과 평가 점수 및 긴급 체크 항목을 모두 초기화하시겠습니까?"))return;answers.fill(null);ready=false;$("studentName").value="";document.querySelectorAll('input[type="radio"],input[data-urgent]').forEach(function(x){x.checked=false});document.querySelectorAll(".question.has-value").forEach(function(x){x.classList.remove("has-value")});updateProgress();updateUrgent();$("assessment").scrollIntoView({behavior:"smooth"})});
fetch("../resources.csv",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("자원 불러오기 실패");return r.text()}).then(function(t){csv=parseCsv(t);$("resourceStatus").textContent="연결된 「함께찾는 복지자원」 목록: "+csv.length+"개 서비스 항목 참조 · 연계 전 최신 운영 확인";if(ready)renderResources(domains.map(function(d,i){return answers.slice(i*3,i*3+3).reduce(function(a,b){return a+b},0)}))}).catch(function(){$("resourceStatus").textContent="복지자원 원본 연결이 일시적으로 불가해 예시기관으로 표시합니다. 정확한 서비스는 전체 검색에서 확인하세요."});
}
document.addEventListener("DOMContentLoaded",init);
})();