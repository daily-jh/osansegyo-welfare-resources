(function(root){'use strict';
const TOPICS=[{"id":"safety","label":"현재 안전·보호","re":"자해|자살|죽고 싶|죽고싶|살기 싫|살기싫|학대|맞았|때렸|폭행|방임|성착취|성폭력|협박|강요|보호 필요","items":[1,2,4,7,25],"ask":"현재 안전한 장소에 있나요? 이어지는 피해·위해 가능성과 안전한 연락 담당자는 누구인가요?","act":"현재 안전을 직접 확인하고, 필요한 신고·보호·응급·전문평가 절차를 우선 검토합니다."},{"id":"peer","label":"또래 관계·학교폭력","re":"왕따|따돌림|괴롭힘|학교폭력|학폭|친구.*괴롭|놀림|집단.*배제","items":[3,4,5,22],"ask":"피해가 언제·어디서 발생했고 학교에서 피할 수 있는 안전한 장소가 있나요?","act":"사실 확인과 학생별 보호조치를 우선하고, 상담·학교생활 조정의 담당자를 구분합니다."},{"id":"emotion","label":"정서·심리","re":"우울|불안|공황|슬픔|무기력|스트레스|잠을 못|불면|불안정","items":[6,8,23],"ask":"언제부터 얼마나 자주 힘들었고 학생이 원하는 도움은 무엇인가요?","act":"정서적 어려움의 생활 영향을 살펴 학교 내 상담·전문평가 필요성을 검토합니다."},{"id":"school","label":"학습·출결","re":"결석|지각|등교|수업|성적|학습|공부|학업|학교 가기 싫|숙제","items":[9,10,11,14],"ask":"출결·수업참여에 영향을 준 실제 장면과 조정 가능한 환경은 무엇인가요?","act":"학습지원·시간표·학교 환경조정을 학생의 희망과 함께 협의합니다."},{"id":"behaviour","label":"행동·건강","re":"충동|폭력|흡연|음주|약물|중독|의식|건강|병원|통증","items":[5,12,13],"ask":"행동이나 신체상태의 구체적 상황, 즉각적인 위해 가능성을 확인했나요?","act":"응급 안전과 일반 행동지원·건강상담을 분리하여 검토합니다."},{"id":"family","label":"가족·돌봄","re":"부모|보호자|가족|가정|양육|돌봄|동생|간병|방치","items":[1,2,16,17,18],"ask":"학생이 맡는 돌봄의 양과 휴식시간, 연락해도 안전한 보호자는 누구인가요?","act":"학생의 교육·휴식 권리와 가족돌봄 대체자원 및 안전한 보호자 접근을 검토합니다."},{"id":"basic","label":"경제·주거·기본생활","re":"월세|체납|퇴거|이사|주거|밥|끼니|식사|생활비|돈이 없|가난|빈곤|경제|의료비|지원금","items":[16,19,20,21],"ask":"실제로 부족한 물품·식사·주거의 시급성과 서비스 신청 여건은 무엇인가요?","act":"학교 교육복지와 동 행정복지센터·권역 복지관의 실제 지원 가능성을 각각 확인합니다."},{"id":"access","label":"장애·발달·접근성","re":"장애|발달|특수교육|보조기|이동.*불편|감각|지적","items":[14,15,21],"ask":"진단 여부와 별개로 학교와 일상에서 어떤 환경 조정이 필요한가요?","act":"진단을 추정하지 않고 교육환경 조정·전문평가·접근성 지원을 구분합니다."},{"id":"relation","label":"관계·보호요인","re":"믿을 사람|믿는 어른|도움.*사람|외롭|고립|소외|친구가 없|지지|선생님.*믿","items":[22,23],"ask":"학생이 실제로 신뢰하고 안전하게 연락할 수 있는 사람이 있나요?","act":"당사자가 선택한 지지인을 중심으로 일상적 도움 요청 경로를 확인합니다."},{"id":"digital","label":"온라인·디지털","re":"휴대폰|스마트폰|게임|SNS|온라인|디지털|인터넷|카톡|채팅|사진 유포|사진.*유포","items":[24,25],"ask":"온라인 접촉이나 공개·협박 피해가 이어지는지, 피해보호가 필요한지 확인했나요?","act":"일상적 기기 사용과 피해·착취 신호를 분리하고 필요시 안전·신고 절차를 우선합니다."}];
function sentenceEvidence(note){
 const raw=String(note||"").slice(0,6000).replace(/\r/g,"");
 const lines=raw.split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean).slice(0,80);
 return lines.map((line,i)=>{
  const found=[];
  for(const t of TOPICS){
   const match=line.match(new RegExp(t.re));
   if(!match)continue;
   const around=line.slice(Math.max(0,match.index-5),Math.min(line.length,match.index+match[0].length+15));
   const denied=/(없(?:다|음|어요|다고|었)|아니(?:다|에요|라고)|않(?:다|음|아요|았)|부인|해당하지|없다고|하지 않았)/.test(around);
   found.push({id:t.id,negative:denied,topic:t.label});
  }
  return {line:i+1,found};
 }).filter(x=>x.found.length);
}

function pickIntent(q){
 const t=String(q||"").trim();
 if(/자해|자살|학대|방임|성착취|위험|안전|긴급|신고/.test(t))return "safety";
 if(/기관|복지관|연계|자원|의뢰|권역|지역/.test(t))return "resource";
 if(/계획|목표|담당|개입|실행|우선순위|단기|장기/.test(t))return "plan";
 if(/면담|질문|상담|확인할|묻|보호자/.test(t))return "question";
 if(/근거|왜|점수|문항|가중|판정|평가|분석/.test(t))return "evidence";
 return "overview";
}

function buildResponse(payload,query,narrative,role="teacher",deps={}){
 if(!payload||!Array.isArray(payload.answers)||payload.answers.length!==25||payload.answers.some(v=>v!=="unknown"&&(!Number.isInteger(v)||v<0||v>4)))throw Error("25개 문항 응답 자료가 필요합니다.");
 if(!["teacher","social-worker"].includes(role))throw Error("교사 또는 사회복지사 관점을 선택해 주세요.");
 const a=payload.answers, known=a.filter(x=>typeof x==="number"), unknown=a.flatMap((v,i)=>v==="unknown"?[i+1]:[]);
 const sum=known.reduce((x,y)=>x+y,0), full=known.length===25;
 const profile=payload.student||{}, ctx=deps.Map&&typeof deps.Map.context==="function"?deps.Map.context(payload):null;
 const zone=deps.Map&&typeof deps.Map.welfareZoneText==="function"?deps.Map.welfareZoneText(profile):"주소지에 따른 관할 기관을 별도로 확인";
 const evidence=sentenceEvidence(narrative), hits=new Map(), discrepancies=[];
 for(const row of evidence)for(const entry of row.found){
  if(!hits.has(entry.id))hits.set(entry.id,{topic:entry.topic,lines:[],negative:[]});
  const item=hits.get(entry.id);(entry.negative?item.negative:item.lines).push(row.line);
 }
 const actual=TOPICS.map(t=>{
  const relevant=t.items.filter(n=>typeof a[n-1]==="number"&&a[n-1]>0);
  const scores=relevant.map(n=>n+"번 "+a[n-1]+"점");
  const narrativeHit=hits.get(t.id);
  const positiveNarr=!!narrativeHit&&narrativeHit.lines.length>0;
  if(positiveNarr && t.items.every(n=>a[n-1]===0))discrepancies.push(t.label);
  const peak=Math.max(0,...relevant.map(n=>a[n-1]));
  return {...t,relevant,scoreText:scores.join(" · "),peak,lines:narrativeHit?.lines||[],negative:narrativeHit?.negative||[],positiveNarr};
 }).filter(t=>t.relevant.length||t.positiveNarr).sort((x,y)=>Number(y.id==="safety")-Number(x.id==="safety")||y.peak-x.peak||y.relevant.length-x.relevant.length||TOPICS.findIndex(t=>t.id===x.id)-TOPICS.findIndex(t=>t.id===y.id));
 let patterns=[];
 if(deps.Matrix&&typeof deps.Matrix.evaluate==="function") {
  try{patterns=deps.Matrix.evaluate(payload,role).shown||[];}catch(e){patterns=[];}
 }
 let agencies=[];
 if(deps.Map&&typeof deps.Map.referrals==="function") {
  try{agencies=(deps.Map.referrals(payload)||[]).slice(0,5).map(x=>({name:String(x.name||x.primary?.["기관명"]||""),services:(x.services||[]).slice(0,2).map(s=>s["서비스명"]).filter(Boolean)})).filter(x=>x.name);}catch(e){agencies=[];}
 }
 const sections=[],intent=pickIntent(query),r=(s)=>sections.push(s);
 const isUrgent=!!ctx?.urgent||[1,2,7,25].some(n=>typeof a[n-1]==="number"&&a[n-1]>0)||(payload.explicit||[]).length>0;
 const pending=!!ctx?.safetyUnknown?.length||!!ctx?.pendingChecks?.length;
 const narrativeSafety=actual.find(t=>t.id==="safety"&&t.positiveNarr);
 r("질문: "+String(query||"학생에게 필요한 도움을 종합적으로 알려주세요.").trim().slice(0,250));
 r("분석 기준: OY-RALS 25문항 + 기존 교차검토 규칙 + 비식별 서술 단서 · "+(role==="teacher"?"교사":"사회복지사")+" 관점");
 r("평가 상태: "+(full?sum+"/100점 (원점수)":"전체 판단 보류 · 확인 "+known.length+"/25문항 · 미상 "+unknown.length+"문항 · 확인값 합계 "+sum+"점")+" · 자동 진단·위험확률 아님");
 r("현재 안전: "+(isUrgent?"기존 평가·안전확인에 보호 관련 신호가 있습니다. 학생의 현재 안전을 직접 확인하고, 필요한 보호·신고·응급 절차를 우선 진행하세요.":pending?"현재 안전 관련 미상·추가확인이 남았습니다. 안전하다고 결론 내리지 마세요.":narrativeSafety?"서술문에 안전 관련 내용이 언급되었습니다. 평가점수와 독립적으로 지금의 위험·보호 필요를 직접 확인하세요.":"이번 입력에서 긴급 신호가 확인되지 않았으나, 안전이 보장되었다는 의미는 아닙니다."));
 if(intent==="safety") {
  r("\n[우선 확인할 내용]");
  r("학생이 현재 안전한 장소에 있는지, 즉각적인 위해·접촉 지속·응급증상이 있는지, 학생에게 안전한 담당자가 누구인지 확인합니다.");
  r("자해·죽음 관련 언급은 전문 인력의 추가 안전사정으로 연결합니다. 학대·성착취 의심은 신고의무와 피해보호 절차를 확인하고 학생에게 반복 진술·증거 수집을 강요하지 않습니다.");
  r("긴급한 위해·상해 등 응급상황에서는 학교·기관의 위기대응 절차 및 112/119를 우선합니다.");
 } else if(intent==="resource"){
  r("\n[관할·지역자원 연결]");
  r("행정동: "+(profile.dong||"미확인")+" / 종합사회복지관 권역: "+zone);
  r(agencies.length?"현재 평가 자료의 기관·서비스 후보:\n"+agencies.map((x,i)=>(i+1)+". "+x.name+(x.services.length?" — "+x.services.join(", "):"")).join("\n"):"현재 평가와 직접 연결된 기관 후보를 확인하지 못했습니다. 학교 내 담당자와 복지자원 원본 DB를 확인해 주세요.");
  r("기관 후보는 실제 접수 가능·지원대상·관할·연락처·운영 여부를 보증하지 않습니다. 문의 → 의뢰 → 접수 → 제공 시작을 구분해 기록하세요.");
 } else if(intent==="question"){
  r("\n[첫 면담 질문 · 제안]");
  r("먼저 학생의 바람과 말해도 안전한 상황을 확인합니다. 보호자 연락은 학생 안전을 검토한 후 결정합니다.");
  (actual.length?actual.slice(0,4):TOPICS.filter(t=>["school","family"].includes(t.id))).forEach((t,i)=>r((i+1)+". ["+t.label+"] "+t.ask));
  r("확인되지 않은 사실을 유도질문으로 전제하지 않고 학생의 속도와 선택권을 존중합니다.");
 } else if(intent==="plan"){
  r("\n[사정 → 단기목표 → 역할 → 점검의 순서]");
  (actual.length?actual.slice(0,3):TOPICS.filter(t=>["school"].includes(t.id))).forEach((t,i)=>r((i+1)+". "+t.label+"\n  근거: "+(t.scoreText||"서술형 기록 중 언급, 추가확인 필요")+"\n  목표(안): 학생이 실제 불편·바라는 변화를 확인하여 지원 목표와 기간을 합의\n  행동: "+t.act+"\n  역할: "+(role==="teacher"?"학교는 학생 면담과 학교 내 조정을, 외부기관은 접수·서비스 가능성을 확인":"사례관리자는 담당·연계·회신을 조정하고 학교와 기관은 실제 수행 범위를 협의")+"\n  점검: 지원 신청·접수·제공 여부와 학생의 생활 변화를 별도로 기록"));
  r("기본 5점 척도/GAS 등 결과지표는 첫 면담의 기준선과 학생이 원하는 변화가 확인된 경우에만 설정하세요.");
 }else {
  r("\n[보고된 어려움과 추가 사정 가설]");
  if(actual.length)actual.slice(0,5).forEach((t,i)=>r((i+1)+". "+t.label+" — "+(t.scoreText||"척도 근거 없음")+(t.lines.length?" / 서술 "+[...new Set(t.lines)].map(n=>n+"문장").join(", ")+"에 언급":"")+"\n  확인할 질문: "+t.ask+"\n  가능한 첫 조치: "+t.act));
  else r("이번 척도와 서술 기록에서 특정 어려움이 보고되지 않았습니다. 학생이 원하는 도움과 관찰되지 않은 상황을 열린 질문으로 확인하세요.");
  if(intent==="evidence")r("이 내용은 문항 점수·주제어 출현을 설명하는 보조해석이며 원인·임상진단·지원자격을 입증하지 않습니다.");
 }
 if(patterns.length && intent!=="safety" && intent!=="resource"){
  r("\n[연결해서 살펴볼 교차 가설 · 인과확정 아님]");
  patterns.slice(0,3).forEach(x=>r("• "+x.title+" ("+x.evidence+") — "+x.question));
 }
 const V=typeof module!=='undefined'&&module.exports?require('./interpretation-v2.js'):root.YouthInterpretation;
 if(V&& !['resource','safety'].includes(intent))r('\n'+V.text(payload,role));
 const research=deps.Research&&typeof deps.Research.match==='function'?deps.Research.match(a,{limit:4,threshold:2}):[];
 if(research.length && intent!=='safety'){
  r("\n[추가 문항쌍 교차검토 · 연구형 가설 v1.0]");
  research.forEach(x=>r("• "+x.id+" ["+x.labels.join(" × ")+"] · 실제 문항 응답 "+x.items.map(n=>n+"번 "+a[n-1]+"점").join(" / ")+"\n  해석: "+x.interpretation+"\n  확인 질문: "+x.question+"\n  실무조치: "+(role==='teacher'?x.teacher:x.socialWorker)+"\n  반례 점검: "+x.counter+"\n  근거 수준: 검증되지 않은 개발가설 · 배경자료 "+x.refs.join(", ")));
  r("문항쌍 300개를 검색할 수 있지만, 표시되는 조합만으로 통계적 상관·인과·위험예측을 확정하지 않습니다.");
 }
 if(discrepancies.length)r("\n[기록 대조 필요]\n서술에는 '"+[...new Set(discrepancies)].join("·")+"' 관련 단서가 있으나 해당 평가문항이 모두 0점입니다. 점수를 임의 수정하지 말고 동일 사건·시점·출처 및 부정 표현 여부를 확인하세요.");
 if(unknown.length)r("\n[미확인 문항]\n"+unknown.slice(0,12).join(", ")+(unknown.length>12?" 외 "+(unknown.length-12)+"개":"")+"번은 미상입니다. 0점으로 환산하거나 전체 단계로 확정하지 않습니다.");
 if(intent!=="resource")r("\n[지역연계 점검]\n"+(profile.dong||"행정동 미확인")+" / "+zone+" · 실제 기관 이용·접수 여부 별도 확인");
 r("\n[한계]\n이 응답은 외부 전송 없이 브라우저에서 생성되는 규칙·키워드 기반 한국어 분석입니다. 서술 단서는 사실 확정이 아니며 부정문·맥락을 잘못 해석할 수 있습니다. 전문가의 면담, 안전사정, 사례회의·법정 절차를 대체하지 않습니다.");
 return {intent,text:sections.join("\n"),audit:{known:known.length,unknown:unknown.length,raw:full?sum:null,topics:actual.map(x=>x.label),cross:patterns.length,notes:evidence.length,narrativeSafety:!!narrativeSafety,discrepancies}};
}
const api={version:'2.0.0',buildResponse,sentenceEvidence,pickIntent};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthLanguageResponse=api;
})(typeof window!=='undefined'?window:globalThis);
