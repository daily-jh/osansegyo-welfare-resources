/* OY-RALS v4.0/v4.2 single free-text case-context interpreter.
   All extracted cues are unverified review prompts; NEVER diagnosis, risk scoring, or auto-reporting. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthCaseContextCore=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='1.1.0-free-text-20261024',LIMITS=Object.freeze({text:5000}),MAX_CLAUSES=65;
const TYPES=Object.freeze([
 {id:'protection',items:[1,2],label:'학대·보호 관련 언급',re:/학대|방임|체벌|맞았|폭행|가정폭력|보호자.{0,12}(?:위협|폭력)|보호.{0,4}부재/,safety:true,ask:'현재 안전·발생시기·당사자 진술과 법정 신고·보호절차를 담당자가 확인합니다.'},
 {id:'peer',items:[3,4,5],label:'또래관계·학교폭력',re:/따돌림|왕따|학교폭력|괴롭힘|놀림|또래.{0,6}(?:위협|폭행)|금품.{0,6}요구|협박/,ask:'피해인지 행동인지와 학교의 안전조치, 동일 사건 여부를 구분합니다.'},
 {id:'selfharm',items:[7],label:'자해·죽음 관련 언급',re:/자해|자살|죽고\s?싶|살기\s?싫|극단적\s?선택/,safety:true,ask:'현재 생각·행동·계획·수단 및 안전한 보호체계를 직접 확인합니다.'},
 {id:'emotion',items:[6,8],label:'정서적 어려움',re:/우울|불안|무기력|불면|수면장애|공황|정서.{0,5}곤란|심리적.{0,5}고통/,ask:'지속기간·생활영향·학생이 원하는 도움을 확인합니다.'},
 {id:'attendance',items:[9,11],label:'출결·소속감',re:/결석|지각|등교.{0,9}(?:거부|어려|회피)|학교.{0,5}가기\s?싫|수업.{0,6}불참|학업중단|학교 소속감/,ask:'출결 변화의 시점과 학교 참여를 어렵게 하는 여건을 확인합니다.'},
 {id:'learning',items:[10,14,15],label:'학습·접근성',re:/기초학습|학습곤란|학습부진|과제.{0,7}(?:어려|미제출)|수업.{0,6}이해|접근성|보조공학|교육환경.{0,7}조정/,ask:'학습지원 필요와 교육환경·서비스 접근 장벽을 구분합니다.'},
 {id:'behavior',items:[5,12,13],label:'행동·건강',re:/충동.{0,3}행동|물건.{0,4}파손|위험.{0,4}행동|음주|흡연|약물.{0,5}(?:오용|과량)|폭력.{0,3}행동/,ask:'행동의 발생상황, 타인 안전 및 현재 건강·의료 상황을 확인합니다.'},
 {id:'care',items:[16,18],label:'가족돌봄',re:/돌봄.{0,3}공백|보호자.{0,8}부재|간병|가족돌봄|동생.{0,6}돌봄|양육.{0,5}공백|돌보느라/,ask:'돌봄 책임의 실제 시간과 성인 대체지원 가능성을 확인합니다.'},
 {id:'family',items:[17],label:'가족관계',re:/가족.{0,3}갈등|부모.{0,6}갈등|양육스트레스|가정.{0,6}불화/,ask:'가족관계와 학생의 생활영향, 연락의 안전성을 구분합니다.'},
 {id:'basic',items:[19,20,21],label:'경제·주거·필수생활',re:/결식|끼니|식비|주거.{0,5}(?:불안|위험)|월세.{0,5}체납|퇴거|의료비|치료비.{0,6}부담|생필품.{0,6}부족|생활비.{0,6}부족|식사.{0,4}못/,ask:'실제 부족한 필수생활과 신청·접수·지원 제공 여부를 구분합니다.'},
 {id:'support',items:[22,23],label:'관계·지지',re:/고립|친구.{0,5}없|지지.{0,6}부족|의지할.{0,5}사람.{0,3}없|도움.{0,6}받을.{0,5}(?:어른|사람).{0,4}없/,ask:'학생이 선택한 신뢰 인물과 실제 도움 요청 가능성을 확인합니다.'},
 {id:'digital',items:[24],label:'디지털 이용 조절',re:/SNS.{0,6}과몰입|게임.{0,6}과몰입|스마트폰.{0,6}(?:과다|과의존|과몰입)|디지털.{0,6}이용.{0,6}조절/,ask:'이용시간 자체보다 실제 수면·학습·관계의 영향을 확인합니다.'},
 {id:'onlineSexual',items:[25],label:'온라인 성착취·디지털 피해',re:/온라인.{0,9}성착취|그루밍|성적.{0,6}사진.{0,9}협박|성적.{0,6}영상.{0,9}유포|디지털.{0,6}성범죄|딥페이크.{0,6}(?:협박|성적)/,safety:true,ask:'현재 접촉·협박·유포 가능성과 피해보호 절차를 직접 확인합니다.'}
]);
const NEG=/(?:없다|없음|없어|없었|없고|없으며|아니다|아님|아니며|하지\s?않|않았|않음|부인|해당\s?없|안\s?한다|안\s?함|아니라고)/;
const UNCERTAIN=/(?:의심|추정|가능성|모르|미확인|확인\s?필요|전해\s?들|소문|들은\s?바|인지\s?확인|같다고\s?함)/;
const HYPOTHETICAL=/(?:만약|예시|가정하면|가상의|예를\s?들|척도\s?문항|예방\s?교육|매뉴얼|사례\s?교육|실습\s?문제)/;
const HISTORICAL=/(?:과거|작년|지난해|지난\s?학기|예전|이전에는|몇\s?년\s?전|초등학교\s?때|과거에)/;
const WISH=/(?:원한다고|원한다|원해|원함|원했|바란다|바라|바람|희망|하고\s?싶|도움\s?요청|요청함|해줬으면|받고\s?싶)/;
const STRENGTH=/(?:잘한다|잘하고|잘함|좋아하|좋아함|즐겨|강점|장점|믿고\s?의지|신뢰하|신뢰함|스스로|극복|노력|도움\s?청|친한\s?친구|격려|격려해)/;
const SUPPORT=/(?:상담\s?중|치료\s?중|이용\s?중|이용중|연계중|지원\s?받|이미\s?연계|접수\s?완료|접수\s?전|신청\s?중|진료\s?중|문의\s?전|Wee센터|위센터|복지관|가족센터|교육복지)/i;
const URGENT=/(?:당장|즉시|오늘\s?중|시급|급히|긴급|이번\s?주\s?내|조속히)/;
function cleanString(v){return String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,' ').trim().slice(0,LIMITS.text)}
function redact(s){return String(s||'').replace(/\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/g,'[연락처 생략]').replace(/\b\d{6}[- ]?[1-8]\d{6}\b/g,'[고유식별번호 생략]').replace(/[a-z\d._%+-]+@[a-z\d.-]+\.[a-z]{2,}/gi,'[이메일 생략]').replace(/\b\d{2,4}[- ]\d{3,4}[- ]\d{4}\b/g,'[전화번호 생략]');}
function normalize(input){
 if(input==null||input==='')return null;
 const text=typeof input==='string'?input:typeof input==='object'&&!Array.isArray(input)?(input.text??input.narrative??(input.fields&&Object.entries(input.fields).map(([k,v])=>k+': '+v).join('\n'))??''):'';
 if(typeof text!=='string')throw Error('선택 사례정보는 자유서술 텍스트여야 합니다.');
 const v=cleanString(text);return v?{schema:'OY-RALS-case-context-v2-free-text',version:VERSION,text:v,includeInPrint:false,includeInAICopy:false}:null;
}
function splitClauses(text){
 return String(text||'').replace(/(없고|않고|없지만|않지만|없으나|않으나|하지만|그러나|반면|다만|그런데|그리고|또한)/g,'$1\n')
 .split(/(?<=[.!?。])\s*|[\n;]+|,(?=\s*(?:학생|보호자|교사|친구|가족|본인|그러나|다만|반면))/)
 .map(s=>s.trim()).filter(Boolean).slice(0,MAX_CLAUSES);
}
function who(clause){if(/학생이\s?(?:말|진술|호소|알려|표현)|학생은\s?.{0,30}(?:말|진술|호소)/.test(clause))return '학생 진술로 기록';if(/(?:교사|담임|교육복지사|사회복지사).{0,14}(?:관찰|확인|기록|보고)/.test(clause))return '담당자 관찰·기록';if(/보호자.{0,14}(?:말|진술|보고)|친구.{0,14}(?:말|전언)|소문|전해/.test(clause))return '타인 진술·전언';return '정보 출처 미기재';}
function infer(input){
 const c=normalize(input);if(!c)return {version:VERSION,hasContext:false,signals:[],issues:[],fields:{},source:'없음',clauses:[],privacyWarnings:[]};
 const clauses=splitClauses(c.text),signals=[],seen=new Set(),issues=[];
 for(const clause of clauses){const hypo=HYPOTHETICAL.test(clause),neg=NEG.test(clause),uncertain=UNCERTAIN.test(clause),old=HISTORICAL.test(clause);
  for(const def of TYPES){if(!def.re.test(clause))continue;
   const key=def.id+'|'+clause;if(seen.has(key))continue;seen.add(key);
   const polarity=hypo?'hypothetical':neg?'negated':uncertain?'unverified':'reported';
   signals.push({tag:def.id,items:def.items.slice(),label:def.label,polarity,source:who(clause),timeHint:old?'historical-mention':/(?:현재|지금|요즘|최근|오늘)/.test(clause)?'current-or-recent':'unconfirmed',safety:!!def.safety,clause:redact(clause).slice(0,180),action:def.ask,evidenceClass:'unverified_optional_free_text',humanConfirmationRequired:true});
  }
 }
 const section=(rx,n=3)=>clauses.filter(x=>rx.test(x)&&!HYPOTHETICAL.test(x)&&!NEG.test(x)).slice(0,n).map(x=>redact(x).slice(0,230)).join(' / ');
 const fields={situation:redact(c.text).slice(0,400),observations:section(/(?:관찰|보았|기록|변화|확인|호소)/),studentWishes:section(WISH),strengths:section(STRENGTH),existingSupport:section(SUPPORT),urgentNeeds:section(URGENT)};
 const privacyWarnings=[];if(redact(c.text)!==c.text)privacyWarnings.push('연락처·식별번호·이메일과 같은 형식이 감지되어 표시할 때 일부 가렸습니다. 자동 익명화가 완전하다는 뜻은 아닙니다.');
 if(signals.some(s=>s.safety&&['reported','unverified'].includes(s.polarity)&&s.timeHint!=='historical-mention'))issues.push({type:'safety-mention',message:'안전 관련 표현이 있습니다. 사실·현재 위험 여부를 담당자가 직접 확인하고 필요한 보호절차를 진행해야 합니다.'});
 if(signals.some(s=>s.safety&&s.timeHint==='historical-mention'))issues.push({type:'historical-safety',message:'과거 안전 사건은 현재 위험과 구분하되 현시점 안전 여부를 확인합니다.'});
 if(signals.some(s=>s.polarity==='unverified'))issues.push({type:'uncertainty',message:'의심·추정·전언을 확인된 사실로 단정하지 않습니다.'});
 return {version:VERSION,hasContext:true,context:c,signals,issues,fields,clauses:clauses.map(x=>redact(x).slice(0,280)),privacyWarnings,source:'혼합·자유서술(출처는 문장별 추정)'};
}
function reconcile(answers,input){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('기존 25문항 0~4점 또는 미상이 필요합니다.');
 const x=infer(input),out={version:VERSION,hasContext:x.hasContext,signals:x.signals,issues:x.issues,fields:x.fields,privacyWarnings:x.privacyWarnings,alignment:[],mismatches:[],unknownCandidates:[],needsSafetyAttention:false,manualReviewRequired:false};
 const dedup=new Set();
 for(const signal of x.signals){if(signal.polarity==='hypothetical')continue;
  const candidates=signal.items.map(n=>({item:n,score:answers[n-1]}));
  if(signal.polarity==='reported'||signal.polarity==='unverified'){
   const positive=candidates.filter(z=>typeof z.score==='number'&&z.score>0);
   if(positive.length)out.alignment.push({tag:signal.tag,items:positive.map(z=>z.item),state:'same-topic-not-independent-evidence'});
   const zero=candidates.filter(z=>z.score===0);
   if(zero.length&&!positive.length){const key=signal.tag+'|zero';if(!dedup.has(key)){dedup.add(key);out.mismatches.push({tag:signal.tag,items:zero.map(z=>z.item),issue:'자유서술과 해당 문항의 0점이 일치하는지 확인하십시오. 이는 반드시 점수오류를 의미하지 않습니다.'});}}
   const missing=candidates.filter(z=>z.score==='unknown');if(missing.length&&!positive.length)out.unknownCandidates.push({tag:signal.tag,items:missing.map(z=>z.item)});
  }else if(signal.polarity==='negated'){
   const positive=candidates.filter(z=>typeof z.score==='number'&&z.score>0);
   if(positive.length)out.mismatches.push({tag:signal.tag,items:positive.map(z=>z.item),issue:'부정 표현과 양성 점수가 공존합니다. 시점·사건·출처 차이를 확인하십시오.'});
  }
 }
 out.needsSafetyAttention=x.signals.some(s=>s.safety&&(s.polarity==='reported'||s.polarity==='unverified')&&s.timeHint!=='historical-mention');
 out.manualReviewRequired=out.needsSafetyAttention||out.mismatches.length>0||out.unknownCandidates.length>0;
 return out;
}
return Object.freeze({VERSION,LIMITS,TYPES,normalize,splitClauses,redact,infer,reconcile});
});
