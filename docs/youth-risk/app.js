(function(){
"use strict";
var domains=[
  {
    "name": "아동학대·보호",
    "color": "#e84b7a",
    "items": [
      "보호자의 신체적 폭력·정서적 위협 또는 성적 침해를 의심할 구체적 진술·상처·행동 변화가 있습니다.",
      "필요한 보호·의료·위생을 지속적으로 제공하지 않는 방임이 의심됩니다."
    ],
    "hints": [
      "의심만으로도 안전확인·신고의무를 우선합니다. 진술을 반복 요구하거나 증명을 기다리지 않습니다.",
      "가난이나 보호자 질병만으로 학대로 채점하지 않습니다. 제공되지 않는 보호와 구체적 정황을 확인합니다."
    ]
  },
  {
    "name": "학교폭력·또래 안전",
    "color": "#9976d6",
    "items": [
      "따돌림·욕설·폭행·사이버 괴롭힘 등 또래의 괴롭힘 피해 정황이 있습니다.",
      "금품 요구·협박·성적 괴롭힘 등 강요·착취 피해 정황이 있습니다.",
      "다른 학생에게 위협·폭력·괴롭힘을 가하여 타인의 안전을 해친 구체적 행동이 있습니다."
    ],
    "hints": [
      "등교 회피 자체는 출결 문항에서 평가합니다. 피해 사실·안전 침해를 이 문항에서 확인합니다.",
      "단순 의견 차이와 구분합니다. 3번과 같은 괴롭힘 사건만 있으면 중복 가산하지 않습니다. 온라인 성착취는 25번에 우선 기록합니다.",
      "학생을 가해자로 단정하지 말고 확인된 행동과 피해 보호 필요를 평가합니다."
    ]
  },
  {
    "name": "자해·정서·정신건강",
    "color": "#ec577d",
    "items": [
      "우울·불안·무기력 등 정서적 고통 때문에 일상 활동에 어려움이 있습니다.",
      "자해 흔적·자해 진술·죽고 싶다는 표현 등 안전확인이 필요한 신호가 있습니다.",
      "공황 유사 반응·현저한 수면 변화·현실 판단의 어려움 등으로 일상 기능이 저하됩니다."
    ],
    "hints": [
      "최근 2주를 중심으로 평소 상태와 비교합니다. 단순한 내향성은 점수 근거가 아닙니다.",
      "단 한 번의 신호도 즉시 직접 안전확인합니다. 이 점수로 자살 가능성을 예측하지 않습니다.",
      "6번의 정서적 고통만을 다시 채점하지 않습니다. 증상과 기능 변화를 별도로 확인합니다."
    ]
  },
  {
    "name": "학습·출결",
    "color": "#2f83c3",
    "items": [
      "지각·조퇴·결석 또는 등교 회피로 수업 참여가 줄었습니다.",
      "수업 이해·기초학습·과제 수행의 어려움이 적절한 지원 후에도 남아 있습니다.",
      "학업을 지속하기 어렵다는 표현이나 학교 소속감의 저하가 확인됩니다."
    ],
    "hints": [
      "질병·장애·피해 보호·이동 장벽 등 사유를 확인하며 비행으로 해석하지 않습니다.",
      "성적 순위만으로 채점하지 않습니다. 언어·접근성·학습 기회와 제공된 지원을 확인합니다.",
      "결석 횟수나 과제 미제출만을 다시 세지 말고 학생의 의사와 학교 경험을 확인합니다."
    ]
  },
  {
    "name": "행동·건강 안전",
    "color": "#dc9438",
    "items": [
      "물건 파손·충동적인 위험 행동으로 자신 또는 주변의 안전을 해치는 일이 있습니다.",
      "음주·흡연·약물 오용·위험한 외출 등 건강과 안전을 해치는 행동이 있습니다."
    ],
    "hints": [
      "또래를 향한 폭력은 5번에 우선 기록합니다. 규칙 불순응만으로 채점하지 않습니다.",
      "소문이나 외모 대신 구체적 관찰·진술을 사용합니다. 의료 응급상황은 즉시 대응합니다."
    ]
  },
  {
    "name": "장애·발달 및 접근성",
    "color": "#518cdb",
    "items": [
      "의사소통·감각·주의·인지 특성에 맞는 교육환경 조정이 부족하여 참여가 제한됩니다.",
      "필요한 편의·보조공학·발달 또는 돌봄 서비스를 받지 못해 활동이 제한됩니다."
    ],
    "hints": [
      "진단명 자체는 0~4점의 근거가 아닙니다. 쉬운 설명·감각환경·수업 방식 등 환경 장벽을 평가합니다.",
      "14번의 교실 조정과 구분해 미충족 서비스·자원 접근을 확인합니다. 비용 장벽만 있으면 21번에 우선 기록합니다."
    ]
  },
  {
    "name": "가족·돌봄",
    "color": "#e57b3c",
    "items": [
      "보호자 부재·질병·여력 부족으로 식사·생활관리·돌봄 공백이 생깁니다.",
      "가족 갈등·양육 스트레스로 학생의 정서·학교생활이 영향을 받습니다.",
      "학생의 간병·가사·가족 돌봄 책임이 학습·휴식·건강을 제한합니다."
    ],
    "hints": [
      "가족 형태를 평가하지 않습니다. 방임 의심은 2번과 별도 안전확인으로 다룹니다.",
      "학대 의심은 1번을 우선 확인합니다. 가족 갈등의 존재만으로 높게 채점하지 않습니다.",
      "학생의 선택·부담·지원 욕구를 묻고 돌봄 역할 자체를 문제로 보지 않습니다."
    ]
  },
  {
    "name": "경제·주거",
    "color": "#b881c1",
    "items": [
      "식사·의복·위생용품·학습준비물 등 필수 생활자원이 부족합니다.",
      "주거의 불안정·안전하지 않은 환경이 건강·학습을 방해합니다.",
      "비용 부담으로 필요한 의료·치료·교육·생활 지원을 받지 못합니다."
    ],
    "hints": [
      "소득·수급 여부가 아니라 실제 미충족 욕구를 평가합니다.",
      "주소·주거 형태는 수집하지 않습니다. 안전한 거처의 확보 필요를 확인합니다.",
      "19번 물품 부족과 다른 서비스 접근 장벽이 확인될 때 평가합니다."
    ]
  },
  {
    "name": "관계·지지체계",
    "color": "#4e9fd0",
    "items": [
      "원하는 또래·교내외 활동에 참여하기 어렵고 고립으로 인한 불편을 호소합니다.",
      "도움이 필요할 때 실제로 연락하고 도움받을 신뢰할 어른·지원체계가 부족합니다."
    ],
    "hints": [
      "혼자 있는 취향이나 장애 자체는 채점하지 않습니다. 6번의 정서 증상만으로 추정하지 않습니다.",
      "학생이 신뢰하는 사람과 이용 가능한 지원을 확인합니다. 가족 수로 평가하지 않습니다."
    ]
  },
  {
    "name": "디지털·온라인 안전",
    "color": "#29aa9b",
    "items": [
      "게임·SNS·영상 등의 이용 조절 어려움 때문에 수면·학습·대면 활동에 기능 저하가 있습니다.",
      "온라인 그루밍·성적 요구·디지털 성착취·협박에 노출된 징후가 있습니다."
    ],
    "hints": [
      "사용 시간만으로 채점하지 않습니다. 사이버 괴롭힘은 3번, 강요·협박 피해는 4번, 성착취는 25번에 우선 기록합니다.",
      "이미지를 요구·복제하지 않습니다. 단 한 번의 의심도 안전확인·전문기관 협력이 우선입니다."
    ]
  }
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
var answers=new Array(25).fill(null), ready=false, csv=[], fallback=[];
function domainAnswers(i){var offset=domains.slice(0,i).reduce(function(n,d){return n+d.items.length},0);return answers.slice(offset,offset+domains[i].items.length)}
var $=function(id){return document.getElementById(id)};
var clean=function(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
function makeQuestions(){
var section=$("questions"), html="", idx=0;
domains.forEach(function(d,di){
html+='<section class="domain-card" aria-labelledby="dt'+di+'"><div class="domain-header"><span class="domain-index">'+(di+1)+'</span><span class="domain-title" id="dt'+di+'">'+clean(d.name)+'</span><span class="domain-count" id="dc'+di+'">0/'+d.items.length+'문항 · 0/'+(d.items.length*4)+'점</span></div>';
d.items.forEach(function(q, itemIndex){
html+='<div class="question" id="qi'+idx+'"><div class="question-text" id="qt'+idx+'"><span class="question-number">'+String(idx+1).padStart(2,"0")+'</span>'+clean(q)+'<small class="item-hint" id="qh'+idx+'">'+clean(d.hints[itemIndex])+'</small></div><div class="options" role="radiogroup" aria-labelledby="qt'+idx+'" aria-describedby="qh'+idx+'">';
for(var v=0;v<=4;v++)html+='<label class="score-choice" title="'+v+'점"><input type="radio" name="q'+idx+'" value="'+v+'" aria-label="'+v+'점"><span>'+v+'</span></label>';
html+='<label class="score-choice unknown"><input type="radio" name="q'+idx+'" value="unknown"><span>미상</span></label></div></div>';idx++;
});html+='</section>';
});section.innerHTML=html;
section.addEventListener("change",function(e){
if(!e.target.matches('input[type="radio"]'))return;
var index=Number(e.target.name.slice(1));if(!Number.isInteger(index)||index<0||index>=25)return;
var value=e.target.value; if(value!=="unknown"&&!/^[0-4]$/.test(value))return; answers[index]=value==="unknown"?null:Number(value);
$("qi"+index).classList.add("has-value");ready=false;updateProgress();updateUrgent();clearResult();
});
}
function updateProgress(){
var filled=answers.filter(function(v){return v!==null}).length;
var total=answers.reduce(function(a,b){return a+(b===null?0:b)},0);
$("filled").textContent=filled;$("liveTotal").innerHTML=total+'<small> / 100점 (임시)</small>';
$("progressBar").style.width=(filled/25*100)+"%";
$("progressHint").textContent=filled===25?"25문항 응답 완료. 검토 버튼으로 결과를 확인하세요.":(25-filled)+"개 문항이 남았습니다. 미응답 문항에 0점을 자동 부여하지 않습니다.";
var s="";
domains.forEach(function(d,i){var arr=domainAnswers(i),count=arr.filter(function(v){return v!==null}).length,score=arr.reduce(function(a,b){return a+(b===null?0:b)},0);
$("dc"+i).textContent=count+"/"+d.items.length+"문항 · "+score+"/"+(d.items.length*4)+"점";
s+='<div class="domain-progress-item"><span>'+clean(d.name)+'</span><span class="bar"><i style="width:'+(score/(d.items.length*4)*100)+'%;background:'+d.color+'"></i></span><strong>'+score+'/'+(d.items.length*4)+'</strong></div>';
});$("domainProgress").innerHTML=s;
}
function getUrgent(){return Array.from(document.querySelectorAll("[data-urgent]:checked")).map(function(n){return n.getAttribute("data-urgent")})}
function inferredSignals(){var found=[];if(answers[0]>0||answers[1]>0)found.push("아동학대·방임 의심: 즉시 안전확인, 신고의무자는 의심 시 지체 없이 신고. 확정이나 총점 산출을 기다리지 않습니다.");if(answers[6]>0)found.push("자해·죽음 관련 신호: 현재 안전을 즉시 직접 확인하고 전문평가에 연결합니다. 임박한 위험·시도·상해 시 112/119 긴급조치.");if(answers[24]>0)found.push("온라인 성착취·협박 신호: 안전확인과 피해 보호, 신고·전문기관 협력 검토.");return found}
function updateUrgent(){var signals=getUrgent().concat(inferredSignals());$("urgentNow").hidden=signals.length===0;$("urgentNow").textContent=signals.join(" / ")+" 안전조치는 평가 완료와 무관하게 진행하세요.";ready=false;clearResult()}
function clearResult(){clearSummary();$("resultBody").innerHTML='<div class="empty-result"><strong>평가 결과를 기다리고 있습니다.</strong><p>25개 문항의 점수를 모두 선택하고 ‘평가 완료’ 버튼을 눌러 주세요.</p></div>';$("resourceList").innerHTML='<div class="empty-result"><p>평가 완료 후 위험영역에 따라 추천기관이 표시됩니다.</p></div>'}
function clearSummary(){
$("summaryText").value="25개 문항의 점수를 모두 선택하고 평가를 완료하면, 응답에 근거한 종합사항이 표시됩니다. 미상·미응답이 있으면 작성을 보류합니다.";
$("selectSummary").disabled=true;
}
function renderSummary(total,domainScores,signals){
var subject=$("studentName").value.trim();
var paragraphs=[(subject?subject+" 학생":"해당 학생")+"에 대한 25문항 응답 합계는 "+total+"/100점입니다. 아래 내용은 평가자의 입력을 요약한 TEST 검토 초안이며, 학생의 실제 상황이나 진단을 확정하지 않습니다."];
if(signals.length)paragraphs.push("[우선 안전확인] "+signals.join(" / ")+" 총점과 관계없이 현재 안전과 보호 필요를 먼저 확인하고, 해당 신고의무 및 긴급 대응 절차를 적용해야 합니다.");
var ranked=domainScores.map(function(score,i){return {i:i,s:score,mean:score/domains[i].items.length}}).filter(function(x){return x.s>0}).sort(function(a,b){return b.mean-a.mean||a.i-b.i});
if(ranked.length){
var areas=ranked.slice(0,3).map(function(x){return domains[x.i].name+"("+x.s+"/"+(domains[x.i].items.length*4)+"점)"});
paragraphs.push("[상황 요약] 입력 응답에서 "+ranked.length+"개 영역에 지원 필요 신호가 표시되었습니다. 문항 평균을 기준으로 우선 살펴볼 영역은 "+areas.join(", ")+"입니다. 이는 영역 간 상대적 확인 순서이며 위험 등급은 아닙니다.");
var labels=["보호자의 폭력·위협·성적 침해 의심","방임 의심","또래·사이버 괴롭힘 피해","강요·협박·착취 피해","또래에게 안전을 해치는 행동","정서적 고통과 일상 어려움","자해·죽음 관련 신호","수면·공황 유사 반응 등 별도 증상과 기능 저하","출결·수업 참여 감소","지원 후에도 남은 학습 어려움","학업 지속·학교 소속감 어려움","파손·충동적 위험 행동","건강·안전을 해치는 행동","교육환경 조정 부족","편의·서비스 접근 제한","돌봄 공백","가족 갈등의 영향","가족돌봄 책임의 부담","필수 생활자원 부족","주거의 불안정·안전 문제","비용에 따른 서비스 이용 제한","원하지 않는 고립·참여 어려움","도움받을 어른·지지체계 부족","디지털 이용 조절에 따른 기능 저하","온라인 성착취·협박 노출 징후"];
var items=answers.map(function(value,i){return {i:i,v:value}}).filter(function(x){return x.v>0}).sort(function(a,b){return b.v-a.v||a.i-b.i});
paragraphs.push("[주요 응답 근거] "+items.slice(0,4).map(function(x){return (x.i+1)+"번 "+labels[x.i]+"("+x.v+"점)"}).join("; ")+". 각 응답의 관찰·진술 근거와 중복 채점 여부를 확인해야 합니다.");
var actions=["안전한 보호와 학대·방임 의심에 대한 신고·보호 절차","피해 보호와 학교의 학교폭력 사안처리 절차","학생의 정서·기능 상태 확인 및 상담·정신건강 전문평가 연결","결석 사유·학습 접근 장벽 확인과 학업 지속 지원","행동이 발생한 맥락과 건강·안전 지원","학생의 특성에 맞는 환경 조정·편의·서비스 접근 지원","돌봄 공백·가족돌봄 부담과 가족지원 욕구 확인","필수 생활·주거·의료 등 미충족 욕구와 공적·민간 지원 확인","학생이 신뢰하는 어른·또래와 실제 도움받을 경로 마련","디지털 피해 보호·이용 조절 지원과 성착취 의심 시 전문기관 협력"];
paragraphs.push("[지원 방향] "+ranked.slice(0,3).map(function(x){return actions[x.i]}).join("; ")+"을 우선 검토합니다. 학교 학생맞춤통합지원 담당자와 함께 학생의 의견·기존 지원·연계기관의 적합성을 확인하여 계획을 정하는 것이 필요합니다.");
}else{
paragraphs.push("[상황 요약] 입력된 25문항은 모두 0점으로, 이번 응답에서는 점수화된 어려움이 보고되지 않았습니다. 이 결과만으로 위험이 없거나 지원이 불필요하다고 판단할 수 없습니다.");
paragraphs.push("[지원 방향] 관찰·면담 근거와 놓친 어려움이 없는지 확인하고, 학생이 도움을 요청할 수 있는 경로를 안내한 뒤 경과를 살펴보는 것이 필요합니다.");
}
paragraphs.push("[추가 확인] 학생이 원하는 도움, 신뢰할 사람, 강점·대처방법, 기존 서비스 효과는 이 점수로 확인되지 않습니다. 학생과 면담하여 보완하고 담당자·점검일을 정하세요. 점수로 어려움의 원인이나 가족 상황을 추정하지 않습니다.");
paragraphs.push("[참고 근거] 학교기반 사회적 건강결정요인 검토(Koslouski 외, 2023/2024; DOI: 10.1007/s12310-023-09622-w), 청소년 자해 보호요인 연구(양모현 외, 2024; DOI: 10.16983/KJSP.2024.21.2.203), NICE NG225(2022), WHO 청소년 정신건강·디지털환경 자료(2025), 교육부 학생맞춤통합지원 자료(2026)의 관점을 참고했습니다. 25문항·0~4점·결과 구간·리뷰 문장은 자체 구성한 미검증 TEST입니다. 전체 자료: https://daily-jh.github.io/osansegyo-welfare-resources/youth-risk/#references");
$("summaryText").value=paragraphs.join("\n\n");$("selectSummary").disabled=false;
}
function calculate(){
var missing=answers.findIndex(function(v){return v===null});if(missing!==-1){alert((missing+1)+"번 문항부터 미응답 또는 미상 항목이 있습니다. 25개 각각 점수를 선택해 주세요.");$("qi"+missing).scrollIntoView({behavior:"smooth",block:"center"});var radio=$("qi"+missing).querySelector("input");radio.focus();return}
ready=true;
var total=answers.reduce(function(a,b){return a+b},0);
var domainScores=domains.map(function(d,i){return domainAnswers(i).reduce(function(a,b){return a+b},0)});
var explicit=getUrgent(),inferred=inferredSignals();
var urgent=explicit.length>0||inferred.length>0;
var rank=total<=19?0:total<=39?1:total<=59?2:3;
var names=["관찰·예방 및 경과점검","학교 내 학맞통 검토","학맞통·외부기관 연계 권고","다기관 집중 개입 검토"];
var description=["전반적인 응답 점수는 낮지만 개별 위험신호와 보호요인을 확인하고 관찰을 지속합니다.","담임·상담교사 등 학교 지원체계를 통해 추가 사정과 학생맞춤통합지원 협의를 검토합니다.","위기영역이 복합적일 가능성이 있어 학교와 복지·상담 전문기관의 공동 사정 및 서비스 연계를 권고합니다.","학교·상담·복지·보건 등 다기관 협력과 집중적인 안전·지원계획 수립을 우선 검토합니다."];
var who=$("studentName").value.trim(),heading=urgent?"즉시 안전확인 및 보호·신고 검토":names[rank];
var html='<div class="result-main'+(urgent?' urgent':'')+'"><span class="eyebrow">TEST 평가결과'+(who?' · '+clean(who):'')+'</span><div class="sum">'+total+'<small> / 100점</small></div><h3>'+clean(heading)+'</h3><p>'+clean(urgent?"선택된 안전신호가 우선입니다. 점수 산출을 기다리지 말고 필요한 긴급조치를 실시하세요.":description[rank])+'</p><p class="sub">임의로 설정한 업무 검토 구간(진단·위험 예측·서비스 자격 기준 아님): 0~19 / 20~39 / 40~59 / 60~100점. 절단점의 타당도는 검증되지 않았습니다.</p></div>';
html+='<div class="routes">';
if(urgent)html+='<div class="route urgent-route"><strong>🚨 즉시개입 검토</strong><small>현재 안전확보, 112·119, 신고의무 및 보호체계</small></div>';
html+='<div class="route"><strong>🏫 학맞통 연계</strong><small>담임·상담교사·학교 학생맞춤통합지원 담당 협의</small></div>';
if(total>19||urgent)html+='<div class="route"><strong>🏥 외부 전문기관 연계</strong><small>청소년상담·정신건강·아동보호 등 위험영역별 연계</small></div>';
html+='<div class="route"><strong>🤝 사례관리 검토</strong><small>욕구사정·보호요인·지원계획 및 재점검</small></div></div>';
var highs=domainScores.map(function(v,i){return {i:i,s:v}}).sort(function(a,b){return b.s/domains[b.i].items.length-a.s/domains[a.i].items.length}).filter(function(x){return x.s>0}).slice(0,3);
html+='<div class="result-todo"><b>우선 확인 영역</b><ul>';
if(highs.length===0)html+='<li>모든 영역 0점 — 응답 근거와 누락된 위험이 없는지 확인하세요.</li>';
highs.forEach(function(x){html+='<li>'+clean(domains[x.i].name)+' '+x.s+'/'+(domains[x.i].items.length*4)+'점 (응답 평균 '+(x.s/domains[x.i].items.length).toFixed(1)+')</li>'});
if(explicit.length)explicit.forEach(function(x){html+='<li><strong>긴급 체크:</strong> '+clean(x)+'</li>'});
if(inferred.length)inferred.forEach(function(x){html+='<li><strong>특별 확인:</strong> '+clean(x)+'</li>'});
html+='</ul><p style="font-size:16px;margin:9px 0 0">총점은 상황 판단을 보조하는 시범 지표입니다. 아동학대 의심은 점수와 무관하게 관련 법령과 기관 신고 절차를 적용합니다.</p></div><div class="print"><button id="printResult" type="button" class="btn btn-muted">결과 인쇄 (현재 기기에서만 처리)</button></div>';
$("resultBody").innerHTML=html;$("printResult").onclick=function(){window.print()};
renderResources(domainScores);
renderSummary(total,domainScores,explicit.concat(inferred));
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
var ranked=domainScores.map(function(s,i){return {s:s,i:i}}).sort(function(a,b){return b.s/domains[b.i].items.length-a.s/domains[a.i].items.length}).filter(function(x){return x.s>0});
var selected=ranked,names=[];
if(getUrgent().length)names.push("오산시청소년상담복지센터","오산시아동보호전문기관","오산시정신건강복지센터");
if(answers[0]>0||answers[1]>0){names.push("오산시아동보호전문기관")}
if(answers[6]>0||ranked.some(function(x){return x.i===2})){names.push("오산시정신건강복지센터")}
selected.forEach(function(x){(routes[x.i]||[]).forEach(function(n){if(names.indexOf(n)===-1)names.push(n)})});
if(!selected.length&&!names.length)names=["오산시청소년상담복지센터","경기도교육청 Wee 프로젝트","오산세교종합사회복지관"];
names=Array.from(new Set(names));
var grouped=new Map();
(csv.length?csv:fallback).forEach(function(row){var key=row["기관명"];if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row)});
var content="";
names.forEach(function(name){var entry=grouped.get(name)||fallback.filter(function(r){return r.기관명===name});if(!entry.length)return;
var reasons=ranked.filter(function(x){return (routes[x.i]||[]).indexOf(name)!==-1}).map(function(x){return domains[x.i].name}).join(" · ")||"안전확인 또는 일반 상담";
var item=entry[0],services=entry.map(function(r){return r["서비스명"]}).filter(Boolean).slice(0,3).join(" · "),url=getLink(item["홈페이지"]||item["근거URL"]);
content+='<article class="resource-item"><span class="category">'+clean(item["범주"])+' · 기관별 문의 필요</span><h3>'+clean(name)+'</h3><p>후보 제시 이유: '+clean(reasons)+'</p><p>DB에 등록된 서비스 예시(적합성 확인 필요): </p><p>'+clean(services)+'</p><p>대상: '+clean(entry.map(function(r){return r.지원대상}).filter(Boolean).slice(0,3).join(' · '))+'</p><p>DB 검토일: '+clean(item.최종검토일||'미기재')+' · 운영: '+clean(item.운영확인||'직접 확인 필요')+'</p><p>신청·연계: '+clean(item['신청·연계방법']||'기관 문의')+'</p>';
if(item["대표전화"])content+='<p>대표전화: '+clean(item["대표전화"])+'</p>';
if(url)content+='<a href="'+clean(url)+'" target="_blank" rel="noopener noreferrer">기관 안내 보기 ↗</a>';content+='</article>';
});
$("resourceList").innerHTML=content||'<div class="empty-result"><p>일치 기관이 없습니다. 전체 복지자원 검색 페이지에서 직접 확인해 주세요.</p></div>';
}
function init(){
document.querySelectorAll("input").forEach(function(n){n.value=n.type==="checkbox"?n.value:"";n.checked=false});makeQuestions();updateProgress();
clearSummary();
$("selectSummary").addEventListener("click",function(){$("summaryText").focus();$("summaryText").select()});
$("studentName").addEventListener("input",function(){ready=false;clearResult()});
$("complete").addEventListener("click",calculate);
$("asideComplete").addEventListener("click",calculate);
$("safetyChecks").addEventListener("change",updateUrgent);
$("reset").addEventListener("click",function(){if(!confirm("이름과 평가 점수 및 긴급 체크 항목을 모두 초기화하시겠습니까?"))return;answers.fill(null);ready=false;$("studentName").value="";document.querySelectorAll('input[type="radio"],input[data-urgent]').forEach(function(x){x.checked=false});document.querySelectorAll(".question.has-value").forEach(function(x){x.classList.remove("has-value")});updateProgress();updateUrgent();$("assessment").scrollIntoView({behavior:"smooth"})});
fetch("../resources.csv",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("자원 불러오기 실패");return r.text()}).then(function(t){csv=parseCsv(t);$("resourceStatus").textContent="연결된 「함께찾는 복지자원」 목록: "+csv.length+"개 서비스 항목 참조 · 연계 전 최신 운영 확인";if(ready)renderResources(domains.map(function(d,i){return domainAnswers(i).reduce(function(a,b){return a+b},0)}))}).catch(function(){$("resourceStatus").textContent="복지자원 원본 연결이 일시적으로 불가해 추천기관을 표시하지 않습니다. 전체 검색에서 직접 확인하세요."});
}
window.addEventListener("beforeprint",function(){var p=document.createElement("div");p.className="summary-print";p.textContent=$("summaryText").value;$("summaryText").after(p)});
window.addEventListener("afterprint",function(){document.querySelectorAll(".summary-print").forEach(function(n){n.remove()})});
window.addEventListener("pageshow",function(e){if(e.persisted)location.reload()});
document.addEventListener("DOMContentLoaded",init);
})();
