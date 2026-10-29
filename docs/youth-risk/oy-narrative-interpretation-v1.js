/* OY-RALS narrative interpretation v1: reads the optional free-text record next to the 25-item scale.
   The narrative never changes CORE scores or the official safety decision. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const K=node?require('./oy-item-knowledge-v1.js'):root.OYItemKnowledge;
const X=node?require('./oy-cross-patterns-v1.js'):root.OYCrossPatterns;
const D=node?require('./oy-deep-interpretation-v1.js'):root.OYDeepInterpretation;
const GL=(()=>{try{return node?require('./oy-grade-lens-v1.js'):root.OYGradeLens}catch(_){return null}})();
const C=node?require('./case-context-core.js'):root.YouthCaseContextCore;
const OD=()=>{try{return node?require('./oy-decision-v1.js'):root.OYDecision}catch(_){return null}};
const FV=()=>{try{return node?require('./integrated-index-v1.js'):root.OYFiveLevelIndex}catch(_){return null}};
const VERSION='1.4.0-random500-20261029';
const SAFETY=[1,2,7,25];
const NOTICE='이 해석은 25문항 응답과 선택 서술기록을 OY-RALS 규칙으로 함께 읽어 풀어 쓴 실무 참고자료입니다. 서술 문장은 표현 단서로 분류한 것이므로 인용·부정·추정·과거 언급은 면담에서 사실 여부를 확인하며, 진단·학대 판정·위험 예측이나 서비스 자격 결정이 아닙니다. 서술은 공식 점수와 CORE 안전판정을 바꾸지 않고, 서술에 안전 관련 표현이 있으면 이 해석과 관계없이 소속기관의 보호·신고 절차를 먼저 따릅니다. 단서 사전과 대조 규칙은 전문가 내용타당도 검토 전 개발판입니다.';

/* Cue lexicon: n = linked item, neg = wording is already negative (no negation check). */
const CARER='(?:부모|아버지|어머니|아빠|엄마|보호자|계부|계모|양부|양모|삼촌|이모|고모)';
const CUES=[
 {n:1,re:new RegExp(CARER+'[^.,]{0,14}(?:때리|때렸|때린|때려|때림|폭행|폭력|맞|위협|던지|던졌|목을|체벌|욕설)')},
 {n:1,re:/(?:얼굴|팔|팔뚝|다리|등|목|눈)[^.,]{0,6}멍|멍을 (?:발견|확인)|(?:벨트|허리띠|몽둥이|효자손|옷걸이|회초리)(?:로|를)?[^.,]{0,6}(?:때|맞)/},
 {n:1,re:/(?:집에서|가정에서)[^.,]{0,10}(?:맞|폭력|폭행)|멍(?:이|자국)|설명(?:이|과) (?:다른|엇갈리는) 상처/},
 {n:2,re:/방임|방치|씻지 (?:못|않)|며칠(?:째)? ?(?:굶|못 먹)|계절에 맞지 않는 옷|겨울(?:인데|에)?[^.,]{0,8}얇은 (?:옷|점퍼|외투|겉옷)|치료를? (?:받지 못|못 받)|위생 상태가 (?:나쁘|좋지)/},
 {n:3,re:/괴롭힘|괴롭히|따돌림|따돌리|왕따|놀림|놀리|학교폭력|단톡|단체 ?채팅방?[^.,]{0,8}(?:욕|퇴장|저격)|(?:친구|또래|반 아이)[^.,]{0,10}(?:맞았|맞는|무시|갈등|다툼)/},
 // A threat to spread images is a safety cue whatever the images are; kept under coercion, never assumed sexual.
 {n:4,safety:true,re:/(?:촬영물|사진|영상|동영상|몸캠|나체|알몸)[^.]{0,15}(?:유포|퍼뜨|퍼트|뿌리|뿌린|올리겠|올린다고|게시|공개하)|(?:유포|퍼뜨리|퍼트리|뿌리|게시|공개)\S{0,4} ?(?:하겠|겠다|한다고)[^.]{0,10}(?:촬영물|사진|영상)/},
 {n:4,re:/돈을 (?:뺏|빼앗|요구)|갈취|셔틀|협박|강요(?:를|당)/},
 {n:5,re:/(?:친구|또래|교사|선생님|후배)(?:를|을|에게)[^.,]{0,8}(?:때리|때렸|때려|밀치|밀쳤|밀쳐|밀었|위협|협박)|물건을 던|싸움을|폭언/},
 {n:6,re:/우울|무기력|의욕이 없|의욕(?:이)? ?(?:떨어|없)|엎드려|눈물|울었|울먹|울기도|울면서|표정이 (?:없|어둡)|웃지 않|외롭|슬퍼|슬프다|짜증이 늘|힘들다고/},
 {n:7,re:/(?:손목|팔목|팔뚝|허벅지)[^.,]{0,6}(?:상처|흉터|베인|그은|긋)|죽고 ?싶|사라지고 ?싶|없어지고 ?싶|살기 싫|자해|손목을|자살|극단적 (?:선택|생각)|태어나지 말|유서|살고 ?싶지 ?(?:는 ?)?않|이제 ?그만 ?하고 ?싶|(?:약|수면제|진통제)(?:을|를)? ?[^.,]{0,6}(?:모아|모았|모으)|약 ?봉투|(?:손목|팔목|팔뚝|허벅지)[^.]{0,14}칼자국|칼자국|(?:칼|커터|면도날?)(?:로|을|를)?[^.,]{0,10}(?:그어|그었|긋|베었|베어)|(?:그어야|그으면)[^.,]{0,8}(?:진정|풀리|편해)|(?:어젯밤|어제|그저께|또|다시|자주|계속|매일)[^.,]{0,20}(?:그었|그어|긋는)|(?:사라지|없어지|죽으)면 ?(?:편할|좋겠|나을)|살 ?이유(?:가)? ?없|죽는 ?게 ?(?:낫|편)|죽어 ?버리|뛰어내리/},
 {n:8,re:/잠을 (?:거의 |잘 )?못|잠들기 (?:어렵|힘들)|잠이 안|불면|악몽|불안해|불안이|겁이 많|공황|멍하게|혼란스러|졸고|졸음|조는/},
 {n:9,re:/지각|결석|조퇴|등교(?:를)? ?(?:거부|하지 않|못)|학교에 (?:오지|가지|나오지) (?:않|못)/},
 {n:10,re:/성적(?:이)? ?(?:떨어|낮)|학습(?:이)? ?(?:부진|어려|뒤처)|과제(?:를)? ?(?:내지|미제출|못 해|안 해)|수업을 (?:따라가지|못 따라)|기초학력|백지/},
 {n:11,re:/자퇴|학교를 그만|학교 다녀서|학교가 싫|학교에 가기 싫|진로(?:에)? ?관심(?:이)? ?없/},
 {n:12,re:/벽을 (?:치|쳤)|물건을 (?:부수|부쉈)|파손|과속|위험한 (?:장난|행동)|무면허|오토바이|절도|훔치|훔쳤|도둑|보호관찰|소년 ?(?:재판|보호|부)|경찰에 (?:단속|입건|적발)/},
 {n:13,re:/담배|흡연|음주|술을|전자담배|베이프|약물|본드|(?:먹은|먹고)[^.,]{0,6}토하|토한다|구토|폭식|식사를 거르|굶어|체중(?:이)?[^.,]{0,10}(?:줄|빠|감소)|살을 빼려/},
 {n:14,re:/지시를 (?:놓치|잘 못 알아)|청력|시력|보청기|난독|한국어가 (?:서툴|어려)|의사소통(?:이)? ?어려/},
 {n:15,re:/보조기기|병원에 (?:간 적이 없|가지 못)|(?:병원|치과)에? ?데려가지 않|충치|휠체어|치료(?:가|를)? ?(?:중단|대기)|서비스 (?:신청 방법|대기)|바우처/},
 {n:16,re:/결식|끼니|아침(?:을|은)? ?(?:거르|굶|못 먹|안 먹)|야간 ?근무|밤늦게까지 (?:혼자|일)|(?:방과 ?후|저녁|밤)(?:에|에는)? ?혼자|돌봐 ?줄 (?:어른|사람)(?:이)? ?없|편의점(?:에서)? ?(?:끼니|식사|도시락)/},
 {n:17,re:/별거|이혼|가정 ?불화|부부 ?(?:싸움|갈등)|재혼|양육 스트레스|가출/},
 {n:17,re:new RegExp(CARER+'[^.,]{0,10}(?:갈등|다툼|다투|싸우|싸움|불화)')},
 {n:18,re:/(?:동생|조카)[^.,]{0,10}(?:등원|등하원|하원|등하교|등교|식사|돌보|돌봄|챙기|데려|맡)|(?:할머니|할아버지|부모|어머니|아버지|엄마|아빠|가족)[^.,]{0,8}(?:약을 챙기|간병|병간호|돌보|돌봄|챙기)|집안일|가사(?:를)? ?(?:도맡|전담|맡)|간병/},
 {n:19,re:/생활비(?:를)? ?(?:보태|보탬|벌)|준비물(?:을|이)? ?(?:없|못|안 가져)|같은 옷|얇은 옷|생필품|생리대|위생용품|먹을 ?것이 없|식료품/},
 // A parent who left home is the carer's absence, not the student running away.
 {n:20,not:new RegExp(CARER+'(?:는|은|가|이|께서)[^.,]{0,6}(?:집을 나|가출)'),re:/집을 나(?:가|갔|와|왔)|가출|외박|(?:남성|남자|어른|성인|아저씨)의 집에서|이사(?:를)? ?(?:자주|잦)|잦은 이사|월세|퇴거|쫓겨|친척 집|쉼터|난방|곰팡이|공부할 (?:공간|곳)이 없|주거(?:가)? ?불안/},
 {n:21,re:/비용(?:이|을)? ?(?:부담|없|못)|돈이 없어|형편(?:이)? ?(?:어려|안 좋)|수학여행[^.,]{0,6}(?:못|불참)|체험학습[^.,]{0,6}(?:못|불참)|학원(?:을)? ?(?:못|그만)/},
 {n:22,re:/혼자 (?:지내|있)는 (?:시간|때)(?:이|가)? 많|어울리지 (?:않|못)|친구가 (?:없|거의 없)|친구(?:와|들과)?[^.,]{0,6}거의 없|고립|(?:쉬는 시간|점심시간)(?:에|에는)? ?혼자|집에만 있|참여하지 (?:않|못)/,neg:true},
 {n:23,re:/믿을 (?:만한 )?(?:어른|사람)이 없|말할 (?:사람|곳)이 없|도움을 (?:거절|원하지 않)|괜찮다고만|혼자 해결/,neg:true},
 // A phone named as where a note was written, or SNS as where a person was met, is not a usage problem.
 {n:24,re:/게임|스마트폰|휴대폰|핸드폰|유튜브|SNS|새벽까지[^.,]{0,8}(?:폰|온라인|영상)/i,not:/메모장|메시지|문자|연락처|만난|알게 된/},
 {n:25,re:/(?:사진|영상)(?:을)? ?(?:요구|보내 달|보내라|유포)|(?:SNS|온라인|채팅|게임)(?:에서|으로)? ?(?:만난|알게 된)[^.,]{0,12}(?:남성|남자|어른|성인|아저씨)|성적인? (?:요구|대화|사진)|몸캠|그루밍|랜덤 ?채팅|조건 ?만남|모르는 (?:사람|어른)[^.,]{0,8}(?:연락|만나)/}
];
const STRENGTH=/좋아한다|좋아하고|좋아함|좋아하는|좋아해|잘한다|잘하고|잘하는|잘 지낸|잘 챙기|잘 챙긴|아끼고|편해진|먼저 말을 거|즐겁게|표정이 밝|성실|열심히|꾸준히|신뢰한다|믿고 따르|친한 친구|도와준다|도와주는|책임감|밝은 편|웃으며/;
const WISH=/원한다|원함|원하고|희망한다|희망함|싶다고|바란다|받고 싶|되고 싶/;
const SUPPORT=/이용 ?중|지원을 받|상담을 받|연계되어|연계됨|드림스타트|지역아동센터|위클래스|Wee|사례관리(?:를)? ?(?:받|중)|방과후(?:에)? ?참여/;
const NEGATION=/^[^.,]{0,16}?(?:없다|없음|없었|없고|없는|없으|아니|않았|않는다|않고|않음|하지 ?않|싶지 ?않|부인)|^지 ?않/;
// "Not wanting to stop" is the opposite of a denial.
const CONTINUE=/(?:멈추|멈출|그만두|그만하|그만 ?하|끊)\S{0,4} ?(?:싶지 ?않|않)|살 ?이유(?:가)? ?없/;
// Hiding or refusing to talk about a sign is a reason to check, never a denial.
const CONCEAL=/숨기|숨겨|감추|감춰|가리고|가린다|말하지 ?않|말을 ?안|이야기하지 ?않|밝히지 ?않|보여주지 ?않/;
const HYPO=/것 같|듯하|듯 하|가능성|우려|추정|의심/;
// Teaching material and examples describe no event about this student.
const EXAMPLE=/예방 ?교육|사례 ?교육|교육 ?자료|사례를? ?소개|예시로|매뉴얼|척도 ?문항|실습 ?문제/;
const PAST=/작년|예전|과거|어릴 때|어렸을 때|초등학교 때|전에는|이전에는|(?:초|중|고) ?[1-6] ?(?:학년 ?)?때|[1-6]학년 ?때|(?:지금|현재)은 ?(?:안정|괜찮|없|잘 지내)/;
// "예전 사진을 퍼뜨리겠다" is a threat made now about an old photo.
// "지금은 안정적" closes a past event; it is not a current cue.
const NOW=/겠다|하겠|협박|최근|요즘|어제|어젯밤|오늘|이번 ?주|지난주|지금(?!은 ?(?:안정|괜찮|없|잘 지내))/;

function sourceOf(raw){
 // Who spoke is read outside the quotation, so a full stop inside the quote does not hide "…라고 말함".
 const s=String(raw).replace(/["“][^"”]*["”]/g,'"…"');
 if(/전해 ?(?:들|받|왔)|전달받/.test(s))return '전해 들은 내용';
 if(/(?:학생|본인|아동|청소년)(?:은|이|는)?[^.]*(?:말했|말함|말한|이야기했|이야기함|진술|호소|라고 했|고 했|고 함|다고 말)/.test(s)||/^["“]/.test(s))return '학생 진술';
 if(/(?:담임|교사|선생님|상담교사|교육복지사)(?:에 따르면|의 관찰|이 관찰|은 |는 |이 |가 |께서 )/.test(s))return '교사 관찰';
 if(new RegExp('(?:'+CARER.slice(3,-1)+'|할머니|할아버지)(?:에 따르면|의 말|가 말|이 말|는 말|은 말|께서 말|와의 통화|와 통화)').test(s))return '보호자 진술';
 if(/관찰(?:했|됨|되었|함)|보였다|확인(?:했|됨|되었)/.test(s))return '기록자 관찰';
 if(new RegExp('^(?:'+CARER.slice(3,-1)+'|할머니|할아버지)(?:는|은|가|이|께서) ').test(s))return '보호자 진술';
 if(/다고 들|들었다|알려 ?(?:옴|왔)/.test(s))return '전해 들은 내용';
 // In a case record "…다고 함" is how the writer notes what the student said, unless someone else is named as the one who said it.
 if(/다고 한다|다고 함|라고 한다|라고 함|다고 말함|다고 이야기함/.test(s))return /(?:친구|선배|후배|동생|이웃|다른 학생)(?:가|이|들이|는) [^.]{0,24}(?:말했|전했|알려|이야기했)/.test(s)?'전해 들은 내용':'학생 진술';
 return '기록 내용';
}
// A quoted remark with its own full stop ("화나면 그어야 진정돼요. 죽으려는 건 아니에요"라고 말함) stays one sentence.
function sentences(text){
 return String(text||'').replace(/\r/g,'').split(/\n+/).flatMap(par=>{
  const out=[];let cur='',open=false;
  for(let i=0;i<par.length;i++){const ch=par[i];cur+=ch;
   if(ch==='“')open=true;else if(ch==='”')open=false;else if(ch==='"')open=!open;
   if(!open&&/[.!?。]/.test(ch)&&/\s/.test(par[i+1]||' ')&&!/["”'’]/.test(par[i+1]||'')){out.push(cur);cur='';}}
  if(cur.trim())out.push(cur);return out;
 }).map(s=>s.trim()).filter(s=>s.length>1);
}
const clauses=s=>s.split(/,\s*|지만\s|는데\s|으나\s|;\s*/).map(c=>c.trim()).filter(Boolean);
const LEAD=new RegExp('^(?:(?:학생|본인|아동|청소년|담임|교사|선생님|상담교사|교육복지사|할머니|할아버지|'+CARER.slice(3,-1)+')(?:에 따르면|의 말로는|의 말에 따르면|은|는|이|가|께서)|기록에 따르면)\\s*');
function clean(s){
 let t=String(s).replace(/\s+/g,' ').trim();
 const q=t.match(/["“]([^"”]{4,})["”]/);if(q)return q[1].trim();
 t=t.replace(LEAD,'').replace(/(?:다|라)?고 (?:말했다|말함|말한 적이 있다|이야기했다|이야기함|했다|진술했다|호소했다)\.?$/,'다').replace(/[.。]+$/,'').replace(/(?:했고|하고|이며|있고|으며)$/,m=>({'했고':'했다','하고':'한다','이며':'이다','있고':'있다','으며':'다'})[m]);
 return t;
}
const short=s=>{const t=clean(s);return t.length>90?t.slice(0,88)+'…':t};

function read(p){
 const text=String(p&&p.caseContext||'').trim();
 const values=Array.isArray(p&&p.answers)?p.answers.slice():Array(25).fill('unknown');
 const out={version:VERSION,present:!!text,sentences:[],findings:[],items:{},strengths:[],wishes:[],supports:[],sources:{},safety:[],others:[],compare:null};
 if(!text){
  const red=p&&p.narrativeRedacted;
  if(red&&Array.isArray(red.safety)&&red.safety.length){
   out.redacted={sentences:red.sentences||0,topics:red.safety.map(x=>K.item(x.n).topic)};
   red.safety.forEach(x=>{const f={n:x.n,topic:K.item(x.n).topic,status:'보고',source:'서술기록',sentence:'',quote:'원문은 이 출력에서 제외',safety:true};out.findings.push(f);(out.items[x.n]=out.items[x.n]||[]).push(f);out.safety.push(f);});
  }else if(red)out.redacted={sentences:red.sentences||0,topics:[]};
  out.compare=compare(values,out.items);return out}
 sentences(text).forEach((s,i)=>{
  const id='S'+String(i+1).padStart(2,'0'),src=sourceOf(s),row={id,text:s,source:src,links:[],kind:[]};
  out.sources[src]=(out.sources[src]||0)+1;
  clauses(s).forEach(cl=>{
   // A friend's self-harm or a peer hurt by someone is that person's story: kept apart, never the student's
   // cue or score. Same rule as the case-context parser.
   const other=!!C?.aboutOthers?.(cl);
   CUES.forEach(cue=>{
    const m=cl.match(cue.re);if(!m||EXAMPLE.test(cl)||(cue.not&&cue.not.test(cl)))return;
    if(row.links.some(l=>l.n===cue.n))return;
    // "학교폭력" alone in a clause where the student is the one pushing or hitting is item 5, not item 3.
    if(cue.n===3&&/^(?:학교폭력|사안)$/.test(m[0])&&CUES.some(c=>c.n===5&&c.re.test(cl)))return;
    // Negation is read in the cue's own predicate: "잠을 잘 못 자고 급식을 거의 먹지 않음" does not deny the sleep cue.
    const rest=cl.slice(m.index+m[0].length),cm=[...rest.matchAll(/(?<=(?:고|며|면서|서))\s(?=(\S+))/g)].find(x=>!/^(?:싶|있|않|말|나|보|해|한|했|하)/.test(x[1])),after=cm?rest.slice(0,cm.index):rest;
    // The student's own words in quotes ("사라지면 편할 것 같다") are a report, not the writer's guess.
    const unq=cl.replace(/["“][^"”]*["”]/g,'');
    const status=CONCEAL.test(cl)?'보고':!cue.neg&&NEGATION.test(after)&&!CONTINUE.test(cl)?'부인':HYPO.test(unq)?'추정':PAST.test(cl)&&!NOW.test(cl)?'과거':'보고';
    const f={n:cue.n,topic:K.item(cue.n).topic,status,source:src,sentence:id,quote:short(cl),safety:SAFETY.includes(cue.n)||!!cue.safety};
    if(other){if(f.safety&&status!=='부인'&&!out.others.some(o=>o.sentence===id))out.others.push(f);return;}
    row.links.push(f);out.findings.push(f);
    (out.items[cue.n]=out.items[cue.n]||[]).push(f);
    if(f.safety&&status!=='부인')out.safety.push(f);
   });
  });
  if(STRENGTH.test(s)){out.strengths.push({sentence:id,source:src,quote:short(s)});row.kind.push('강점')}
  if(WISH.test(s)){out.wishes.push({sentence:id,source:src,quote:short(s)});row.kind.push('바람')}
  if(SUPPORT.test(s)){out.supports.push({sentence:id,source:src,quote:short(s)});row.kind.push('기존 지원')}
  out.sentences.push(row);
 });
 // Several physical-neglect signs together (clothing, meals, hygiene, untreated illness, carer away) are read
 // as one neglect question, the same rule as the case-context parser. One sign alone stays a basic-needs cue.
 try{const pat=C&&C.infer?C.infer(text).signals.find(x=>x.tag==='neglectPattern'):null;
  if(pat&&!(out.items[2]||[]).some(f=>f.status!=='부인')){
   const f={n:2,topic:K.item(2).topic,status:'추정',source:'여러 문장',sentence:'',quote:pat.clause,safety:true,pattern:true};
   out.findings.push(f);(out.items[2]=out.items[2]||[]).push(f);out.safety.push(f);
  }}catch(_){}
 try{const inf=C&&C.infer?C.infer(text):null,ITEM={protection:1,selfharm:7,onlineSexual:25,imageThreat:4,sexualHarm:1,selfharmCover:7,fallRisk:7,runaway:20};
  (inf?inf.signals:[]).forEach(sg=>{const n=ITEM[sg.tag];
   if(!n||!sg.safety||sg.subject==='third-party'||sg.timeHint==='historical-mention'||!['reported','unverified'].includes(sg.polarity))return;
   const had=(out.items[n]||[]).filter(f=>f.status==='보고'||f.status==='추정');
   if(had.some(f=>f.safety))return;
   // The same sentence already read as an ordinary cue (가출 → 주거) becomes the safety cue it also is.
   if(had.length){const f=had[0];f.safety=true;f.label=sg.label;out.safety.push(f);return;}
   const row=out.sentences.find(r=>r.text.includes(sg.clause.slice(0,20)))||null;
   const f={n,topic:K.item(n).topic,label:SAFETY.includes(n)&&n!==1?'':sg.label,status:sg.polarity==='reported'?'보고':'추정',source:row?row.source:'서술기록',sentence:row?row.id:'',quote:short(sg.clause),safety:true};
   if(row&&!row.links.some(l=>l.n===n))row.links.push(f);
   out.findings.push(f);(out.items[n]=out.items[n]||[]).push(f);out.safety.push(f);
  });}catch(_){}
 out.compare=compare(values,out.items);
 return out;
}
const isNum=v=>typeof v==='number';
const cueName=t=>t.replace(/ 관련 안전 신호$| 안전 신호$/,'')+' 관련 표현';
const stateOf=list=>list.some(f=>f.status==='보고')?'보고':list.some(f=>f.status==='추정')?'추정':list.some(f=>f.status==='과거')?'과거':'부인';
/* Scale vs narrative per item. Scores stay as they are; this only names the relation. */
function compare(values,items){
 const rows=[];
 for(let n=1;n<=25;n++){
  const v=values[n-1],list=items[n]||[],has=list.length>0,st=has?stateOf(list):null;
  const high=isNum(v)&&(v>=2||(SAFETY.includes(n)&&v>=1));
  let kind=null;
  if(has&&(st==='보고'||st==='추정')){kind=v==='unknown'?'fill':high?'agree':'narrative'}
  else if(has&&st==='부인'){kind=high?'conflict':'agreeLow'}
  else if(has&&st==='과거'){kind='past'}
  else if(high){kind='scale'}
  // A safety cue read outside the item's own topic (성적 위해 under item 1, 가출 under item 20) keeps its own name.
  const lab=(list.find(f=>f.safety&&f.label&&f.status!=='부인')||{}).label;
  // A high housing score does not already say the student ran away: the narrative cue stays its own safety row.
  if(lab&&kind==='agree'&&!SAFETY.includes(n))kind='narrative';
  if(kind)rows.push({n,topic:lab||K.item(n).topic,value:v,kind,status:st,quotes:list.map(f=>({quote:f.quote,source:f.source,status:f.status})),safety:SAFETY.includes(n)||list.some(f=>f.safety)});
 }
 const by=k=>rows.filter(r=>r.kind===k);
 return {rows,agree:by('agree'),narrative:by('narrative'),fill:by('fill'),conflict:by('conflict'),scale:by('scale'),low:by('agreeLow'),past:by('past')};
}

/* Narrative themes in practice language. */
const THEMES=[
 {id:'safety',name:'안전과 보호',items:[1,2,4,7,25]},
 {id:'school',name:'등교와 학교생활',items:[9,10,11,14]},
 {id:'mind',name:'마음과 정서',items:[6,8]},
 {id:'relation',name:'또래와 지지 관계',items:[3,5,22,23]},
 {id:'family',name:'가족과 돌봄',items:[16,17,18]},
 {id:'base',name:'생활 기반',items:[15,19,20,21]},
 {id:'behavior',name:'행동과 생활 습관',items:[12,13,24]}
];
const josa=(w,a,b)=>{const m=String(w).match(/[가-힣](?=[^가-힣]*$)/);if(!m)return w+a;return w+((m[0].charCodeAt(0)-0xAC00)%28?a:b)};
const quoteLine=f=>'“'+f.quote+'” ('+f.source+')';
const uniq=list=>{const seen=new Set();return list.filter(f=>!seen.has(f.quote)&&seen.add(f.quote))};
function themes(n){
 return THEMES.map(t=>{
  const its=t.items.filter(i=>n.items[i]);if(!its.length)return null;
  const reported=its.filter(i=>stateOf(n.items[i])!=='부인');
  const denied=its.filter(i=>stateOf(n.items[i])==='부인');
  const meaning=reported.map(i=>({topic:K.item(i).topic,text:K.item(i).r[1],safety:SAFETY.includes(i)||n.items[i].some(f=>f.safety)}));
  return {id:t.id,name:t.name,items:its,reported,denied,quotes:uniq(its.flatMap(i=>n.items[i])),meaning};
 }).filter(Boolean);
}
function storyline(n,th){
 if(!n.present)return '';
 const parts=[];
 const rep=th.filter(t=>t.reported.length);
 if(rep.length){
  parts.push('서술기록은 '+rep.map(t=>t.name).slice(0,3).join(', ')+' 영역에서 학생의 생활을 구체적으로 보여줍니다.');
  const used=new Set();rep.slice(0,4).forEach(t=>{const f=t.quotes.find(q=>q.status!=='부인'&&!used.has(q.quote));if(f){used.add(f.quote);parts.push(t.name+': '+quoteLine(f)+'.')}});
 }else parts.push('서술기록에서 25문항의 어려움과 바로 연결되는 표현은 두드러지지 않습니다. 기록은 학생의 상황을 이해하는 맥락 자료로 활용합니다.');
 if(n.safety.length)parts.push('특히 '+[...new Set(n.safety.map(f=>cueName(f.topic)))].join(', ')+'이 있어, 서술의 다른 내용보다 현재 안전 확인이 먼저입니다.');
 const fam=th.find(t=>t.id==='family'&&t.reported.length),school=th.find(t=>t.id==='school'&&t.reported.length);
 if(fam&&school)parts.push('가족 안에서 맡은 역할과 등교·학교생활의 어려움이 같은 기록 안에 함께 나타나, 두 영역을 하나의 흐름으로 다루는 것이 적절합니다.');
 const den=th.flatMap(t=>t.denied);if(den.length)parts.push(den.map(i=>K.item(i).topic).join(', ')+'에 대해서는 어려움이 없다는 언급이 있습니다.');
 if(n.wishes.length)parts.push('학생의 바람이 기록되어 있어 계획의 출발점으로 삼을 수 있습니다.');
 return parts.join(' ');
}
function gaps(n,cmp){
 const g=[];
 cmp.scale.slice(0,4).forEach(r=>g.push({topic:r.topic,text:'척도에서 어려움이 응답되었지만 서술에는 구체적인 모습이 없습니다. 언제, 어떤 장면에서 나타나는지 한두 문장으로 기록합니다.'}));
 if(n.present&&!n.wishes.length)g.push({topic:'학생의 바람',text:'학생이 바라는 변화나 받고 싶은 도움을 학생의 말로 적어 둡니다.'});
 if(n.present&&!n.strengths.length)g.push({topic:'강점',text:'학생이 잘하는 일, 좋아하는 사람·활동을 적어 계획의 발판으로 씁니다.'});
 if(n.present&&!n.supports.length)g.push({topic:'기존 지원',text:'이미 받고 있는 지원과 담당 기관을 적어 중복 연계를 막습니다.'});
 if(n.present&&!n.sources['학생 진술'])g.push({topic:'학생의 목소리',text:'학생이 직접 한 말이 기록에 없습니다. 면담에서 들은 표현을 따옴표로 남깁니다.'});
 return g;
}
function questions(n,cmp){
 const q=[],seen=new Set();
 const add=(r,why)=>{if(seen.has(r.n)||q.length>=6)return;seen.add(r.n);q.push({about:r.topic,why,q:K.item(r.n).q})};
 cmp.rows.filter(r=>r.safety&&(r.kind==='narrative'||r.kind==='fill'||r.kind==='agree')).forEach(r=>add(r,'안전 확인'));
 cmp.conflict.forEach(r=>add(r,'척도와 서술이 엇갈림'));
 cmp.narrative.forEach(r=>add(r,'서술에서 더 크게 드러남'));
 cmp.fill.forEach(r=>add(r,'미상 문항을 서술이 보완'));
 cmp.scale.forEach(r=>add(r,'서술 근거 보완'));
 return q;
}
function narrative(p){
 const n=read(p),th=themes(n),cmp=n.compare;
 return {version:VERSION,present:n.present,read:n,themes:th,story:storyline(n,th),compare:cmp,gaps:gaps(n,cmp),questions:questions(n,cmp),notice:NOTICE,
  glance:{sentences:n.sentences.length,sources:Object.entries(n.sources).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v),themes:th.filter(t=>t.reported.length).map(t=>t.name),safety:n.safety.length?'안전 관련 표현 있음':'안전 관련 표현 없음',fit:cmp.agree.length+cmp.low.length+'건 일치 · '+(cmp.narrative.length+cmp.conflict.length)+'건 차이'}};
}

/* Integrated view: deep scale report + narrative, used by ③ and the 03 case conceptualisation pages. */
const OWNER={protect:'아동보호·수사기관',crisis:'정신건강 위기대응',school:'학교(담임·교육복지사·Wee)',welfare:'복지관 통합사례관리',specialist:'전문 상담·치료기관'};
const LEVEL_ORDER=['monitor','brief','general','intensive','crisis'];
const LEVELS={
 general:{id:'general',name:'일반 사례관리 (학교·복지 협력)',contact:'주 담당자가 1~2주에 1회 학생 접촉',meeting:'4주 안에 학교·복지 담당 협의(학맞통 협의 검토)',review:'3개월마다 재사정'},
 intensive:{id:'intensive',name:'집중 사례관리 (다기관)',contact:'주 담당자가 주 1회 이상 학생 접촉, 가족 접촉 병행',meeting:'2주 안에 다기관 사례회의',review:'1개월마다 진행 점검, 3개월 재사정'},
 crisis:{id:'crisis',name:'위기개입 후 집중 사례관리',contact:'당일 안전 확인, 이후 안정될 때까지 매일~주 2회 확인',meeting:'보호 조치 직후 긴급 사례회의',review:'안전 확보 후 2주 안에 전체 재사정'}};
/* A safety answer on the scale (1·2·7·25, explicit urgent, follow-up 'yes') puts the time first, the same word as the chain's safety cell. */
function timed(p,first){
 const a=p.answers||[],now=(p.explicit||[]).length>0||Object.values(p.followups||{}).includes('yes');
 const urgent=now||SAFETY.some(n=>isNum(a[n-1])&&a[n-1]>=1);
 first=String(first||'');
 if(!urgent||/^(?:지금 바로|오늘)/.test(first))return first;
 return (now?'지금 바로':'오늘 안에')+' 현재 안전을 직접 확인하고 소속기관 보호 절차를 따릅니다.'+(first?' 그다음 '+first:'');
}
function integrate(p){
 const r=D.build(p),nv=narrative(p),cmp=nv.compare,w=r.casework;
 // Patterns that appear only when narrative evidence is added (scores themselves are unchanged).
 const aug=p.answers.map((v,i)=>{const c=cmp.rows.find(x=>x.n===i+1);return c&&(c.kind==='narrative'||c.kind==='fill')?Math.max(isNum(v)?v:0,2):v});
 const before=new Set(r.patterns.active.map(x=>x.id));
 const newPatterns=nv.present?X.match(aug).active.filter(x=>!before.has(x.id)):[];
 const nSafety=cmp.rows.filter(x=>x.safety&&(x.kind==='narrative'||x.kind==='fill'));
 let level=w.level,adjust='';
 const escalate=list=>{const ns=list.map(x=>x.n);
  if(ns.some(n=>n===1||n===2))return '안전 면담에서 현재 위해나 귀가 후의 위험이 확인되면 신고와 보호 조치를 바로 진행하는 위기개입으로 전환합니다.';
  if(ns.includes(25))return '협박이나 접촉이 지금도 이어지고 있으면 수사기관 신고와 피해 보호를 바로 진행하는 위기개입으로 전환합니다.';
  return '안전 면담에서 현재 생각·계획·수단이 확인되면 위기개입으로 전환합니다.';};
 const route=!w.immediate&&nSafety.length&&D.safetyRoute?D.safetyRoute(n=>nSafety.some(x=>x.n===n),false):null;
 let lead=route&&route.lead?route.lead:w.lead;const immediate=w.immediate||(route?route.immediate:'');
 const imm=(()=>{try{const t=String(p.caseContext||'');return t?(C.reconcile(p.answers,t).immediate||[]):((p.narrativeRedacted&&p.narrativeRedacted.immediate)||[])}catch(_){return []}})();
 if(imm.length&&level.id!=='crisis'){
  level={...{id:'crisis',name:'위기개입 후 집중 사례관리',contact:'당일 안전 확인, 이후 안정될 때까지 매일~주 2회 확인',meeting:'보호 조치 직후 긴급 사례회의',review:'안전 확보 후 2주 안에 전체 재사정'},reason:'서술에 '+imm.map(x=>x.reason).join(', ')+'이 있어 당일 보호를 우선합니다.'};
  adjust='서술에 '+imm.map(x=>x.reason).join(', ')+'이 있어 위기개입 수준으로 운영합니다. '+(imm.some(x=>x.tag==='protection')?'오늘 안에 아동학대 신고와 보호 조치를 진행하고, 보호자에게는 먼저 연락하지 않습니다.':'오늘 안에 학생 곁에 어른이 함께 있도록 하고 수단을 치운 뒤 정신건강 위기대응과 연결합니다.');
 }else if(nSafety.length&&LEVEL_ORDER.indexOf(level.id)<3){
  level={id:'intensive',name:'집중 사례관리 (다기관) · 안전 확인 우선',contact:'오늘 안에 안전 면담, 이후 주 1회 이상 학생 접촉',meeting:'2주 안에 다기관 사례회의, 안전 확인 결과에 따라 앞당김',review:'1개월마다 진행 점검, 3개월 재사정',reason:'척도 응답보다 서술에서 안전 관련 표현이 더 분명하게 나타나 집중 수준으로 운영합니다.'};
  adjust='서술에 '+nSafety.map(x=>cueName(x.topic)).join(', ')+'이 있어 척도 기준보다 한 단계 높은 수준으로 운영합니다. '+escalate(nSafety)+'';
 }else if(nv.present&&cmp.narrative.length>=2&&LEVEL_ORDER.indexOf(level.id)<2){
  level={...level,id:'general',name:'일반 사례관리 (학교·복지 협력)',contact:'주 담당자가 1~2주에 1회 학생 접촉',meeting:'4주 안에 학교·복지 담당 협의(학맞통 협의 검토)',review:'3개월마다 재사정',reason:'척도 응답은 낮지만 서술에서 여러 생활영역의 어려움이 구체적으로 드러나 학교와 복지가 함께 확인합니다.'};
  adjust='척도보다 서술에서 '+cmp.narrative.map(x=>x.topic).join(', ')+'의 어려움이 더 크게 드러나 협력 수준을 한 단계 올렸습니다.';
 }
 // The intervention level never sits below the five-level support priority (3 → general, 4 → intensive, 5 → crisis).
 // Without this a score that confirms a narrative cue could lower the level the narrative alone had raised (random 400-case check 2026-10-28).
 let five=null;try{const fv=FV();five=fv&&fv.analyze?fv.analyze(p):null}catch(_){five=null}
 const FLOOR={3:'general',4:'intensive',5:'crisis'},want=five&&five.tier?FLOOR[five.tier]:null;
 if(want&&LEVEL_ORDER.indexOf(level.id)<LEVEL_ORDER.indexOf(want)){
  const L=LEVELS[want];
  level={...L,id:want,reason:'지원 우선순위 '+five.tier+'단계('+five.label.replace(/ \(잠정\)$/,'')+')에 맞춰 '+L.name+' 수준으로 운영합니다. 개입 수준은 지원 우선순위보다 낮게 두지 않습니다.'};
 }
 // R-1: '복지관 통합사례관리' 주관은 통합사례관리 선정일 때만 쓴다(oy-decision-v1).
 try{const od=OD();if(od&&od.selectionFor)lead=od.leadText(lead,od.selectionFor(p,level,nSafety.length));}catch(_){}
 const keys=[...cmp.agree.filter(x=>x.safety),...cmp.rows.filter(x=>x.safety&&(x.kind==='narrative'||x.kind==='fill')),...cmp.agree.filter(x=>!x.safety),...cmp.narrative.filter(x=>!x.safety)].map(x=>x.topic);
 const keyList=[...new Set([...keys,...r.summary.keys])].slice(0,4);
 // understanding paragraph
 const u=[nSafety.length?r.understanding.replace(/\s*(?:가장 먼저 할 일:|먼저,)[^.]*\.(?:\s*이어서,[^.]*\.)?/,''):r.understanding];
 if(nv.present){
  if(cmp.agree.length)u.push('서술기록도 '+josa(cmp.agree.slice(0,3).map(x=>x.topic).join(', '),'을','를')+' 같은 방향으로 보여주어, 이 어려움은 응답과 실제 생활 모두에서 확인되는 핵심 과제입니다.');
  if(cmp.narrative.length||cmp.fill.length)u.push('척도에서는 낮거나 확인되지 않았던 '+josa([...cmp.narrative,...cmp.fill].slice(0,3).map(x=>x.topic).join(', '),'이','가')+' 서술에서는 구체적으로 드러납니다. '+quoteLine([...cmp.narrative,...cmp.fill][0].quotes.find(q=>q.status!=='부인')||[...cmp.narrative,...cmp.fill][0].quotes[0])+'.');
  if(newPatterns.length)u.push('서술을 함께 보면 '+newPatterns.slice(0,2).map(x=>x.name).join(', ')+'의 고리가 새로 드러납니다. '+newPatterns[0].loop);
  if(nSafety.length)u.push('서술의 안전 관련 표현 때문에, 위의 모든 지원에 앞서 오늘 안에 안전 면담을 먼저 합니다.');
  if(cmp.conflict.length)u.push(josa(cmp.conflict.map(x=>x.topic).join(', '),'은','는')+' 척도에서는 어려움으로 응답되었으나 서술에서는 부인되어, 누구의 관점에서 어떤 장면을 본 것인지 사례회의에서 맞춰 봅니다.');
 }else if(nv.read.redacted){
  u.push('서술기록은 개인정보 보호를 위해 이 출력에서 원문을 제외했습니다(화면에서 확인, 내보낼 때 ‘서술 포함’을 선택하면 반영).');
  if(nSafety.length)u.push('서술에 '+nSafety.map(x=>cueName(x.topic)).join(', ')+'이 있어, 위의 모든 지원에 앞서 오늘 안에 안전 면담을 먼저 합니다.');
 }else u.push('서술기록이 입력되지 않아 25문항 응답만으로 종합했습니다. 면담·관찰 내용을 서술기록에 더하면 이 사정의견이 보강됩니다.');
 // integrated plan
 const plan=w.plan.map(ph=>({phase:ph.phase,rows:ph.rows.slice()}));
 nSafety.forEach(x=>plan[0].rows.unshift({what:'서술에 나온 '+cueName(x.topic)+'을 근거로 오늘 안에 직접 안전 면담을 합니다. '+K.item(x.n).e,who:'교육복지사·상담교사'}));
 [...cmp.narrative,...cmp.fill].filter(x=>!x.safety).slice(0,3).forEach(x=>{const k=K.item(x.n);if(!plan[1].rows.some(r=>r.what===k.e))plan[1].rows.push({what:k.e,who:k.owner==='school'?'담임·교육복지사':'교육복지사'})});
 newPatterns.filter(pt=>!pt.safety&&!pt.items.some(n=>SAFETY.includes(n))).slice(0,1).forEach(pt=>{if(!plan[1].rows.some(r=>r.what===pt.first))plan[1].rows.unshift({what:pt.first,who:'주관 담당자'})});
 plan[1].rows=plan[1].rows.slice(0,5);
 if(level!==w.level){const last=plan[2].rows[plan[2].rows.length-1];if(last&&/재평가|재사정|점검/.test(last.what))last.what='합의한 목표의 변화를 점검하고 지원을 조정합니다. '+level.review+'.'}
 // School-level transition (초6·중3·고3): the hand-over joins the mid-term plan; levels are unchanged.
 if(r.grade&&r.grade.handoff&&plan[2]&&!plan[2].rows.some(x=>x.what===r.grade.handoff))plan[2].rows.splice(Math.max(0,plan[2].rows.length-1),0,{what:r.grade.handoff,who:'주관 담당자'});
 // goals with narrative baseline
 const goals=w.goals.map(g=>({...g}));
 cmp.agree.forEach(x=>{const g=goals.find(y=>y.topic===x.topic);const q=x.quotes.find(q=>q.status==='보고');if(g&&q)g.baseline=q.quote});
 [...cmp.narrative,...cmp.fill].filter(x=>!x.safety).slice(0,2).forEach(x=>{if(goals.length<4&&!goals.some(g=>g.topic===x.topic))goals.push({topic:x.topic,goal:'서술에 기록된 모습이 줄어들고 학생이 스스로 변화를 말할 수 있는 것',measure:K.item(x.n).d.split(', ')[0]+' 등 일상 지표를 학생과 함께 정해 2주마다 기록',baseline:(x.quotes.find(q=>q.status!=='부인')||{}).quote})});
 // agenda
 const agenda=w.agenda.slice();
 if(nSafety.length)agenda.unshift('서술에 나타난 안전 관련 표현의 확인 결과와 보호 절차');
 if(r.grade&&r.grade.handoff)agenda.splice(Math.max(0,agenda.length-1),0,(r.grade.grade==='고3'?'졸업 뒤 지원을 이어 갈 기관과 인계 계획':r.grade.label+' 진학 전환에 맞춘 인계 계획'));
 if(cmp.conflict.length)agenda.splice(agenda.length-1,0,'척도와 서술이 엇갈리는 부분('+cmp.conflict.map(x=>x.topic).join(', ')+')의 관점 차이 정리');
 if(cmp.narrative.length||cmp.fill.length)agenda.splice(agenda.length-1,0,'서술로만 드러난 어려움('+[...cmp.narrative,...cmp.fill].map(x=>x.topic).slice(0,4).join(', ')+')을 계획에 넣을지 결정');
 // family engagement: narrative mention of carer harm overrides a mild scale picture
 const family=cmp.rows.some(x=>[1,2].includes(x.n)&&(x.kind==='narrative'||x.kind==='fill'||x.kind==='agree'))?'서술에 보호자 관련 안전 표현이 있습니다. 보호자에게 먼저 연락하지 않고, 연락이 학생에게 안전한지 보호 담당과 판단한 뒤 접촉 방식을 정합니다.':w.family&&(r.critical.list.some(x=>x.kind==='안전'||x.kind==='긴급')||nSafety.length)&&/(?:연락(?:이)? ?(?:닿지|되지) ?않|연락이 끊|다툰 ?뒤|다툼 ?뒤)/.test(String(p.caseContext||''))?w.family+' 다만 서술에 보호자 연락이 어렵거나 보호자와의 다툼이 계기로 적혀 있어, 연락이 학생에게 안전한지 먼저 판단한 뒤 접촉 방식을 정합니다.':w.family;
 // Strengths written in the record come first; score-based lines only say a difficulty was not reported.
 const strengths=[...nv.read.strengths.slice(0,3).map(s=>({label:'서술에 기록된 강점',text:'“'+s.quote+'”'})),...r.strengths.slice(0,4).map(s=>({label:s.label,text:s.text}))];
 const wishes=nv.read.wishes.map(s=>s.quote);
 const partners=[...w.partners];[...cmp.narrative,...cmp.fill].forEach(x=>{const o=OWNER[K.item(x.n).owner];if(o!==w.lead&&!partners.includes(o))partners.push(o)});
 return {version:VERSION,deep:r,grade:r.grade||null,narrative:nv,present:nv.present,redacted:!!nv.read.redacted,level,adjust,lead,immediate,partners,leadText:route&&route.lead?'서술의 안전 신호 때문에 오늘의 즉시 대응과 이후 사례관리 주관을 나눕니다. 오늘의 즉시 대응: '+route.immediate+'. 이후 사례관리: '+josa(route.lead.replace(/ \(.*\)$/,''),'이','가')+' 주관합니다.':w.leadText,family,keys:keyList,
  first:nSafety.length&&!/^지금 바로/.test(r.summary.first)?(imm.length?'지금 바로':'오늘 안에')+' 서술에 나온 '+nSafety.map(x=>cueName(x.topic)).join(', ')+'을 학생과 직접 안전 면담으로 확인합니다.':timed(p,r.summary.first),
  safety:r.summary.safety==='이번 응답의 안전 신호 없음'&&nSafety.length?'서술에 안전 관련 표현 · 확인 우선':r.summary.safety,
  understanding:u.join(' '),compare:cmp,newPatterns,plan,goals,agenda,strengths,wishes,questions:[...nv.questions,...r.questions.filter(q=>!nv.questions.some(x=>x.about===q.about))].slice(0,7),notice:NOTICE};
}

/* ---------- Rendering (body has no item numbers or scores; they live in the appendix) ---------- */
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ul=a=>'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
const sec=(k,i,title,body)=>'<section class="odi-sec odi-s-'+k+'"><h3><span class="odi-num">'+i+'</span>'+esc(title)+'</h3>'+body+'</section>';
const STATUS_TEXT={'보고':'기록됨','부인':'부인','추정':'추정 표현','과거':'과거 일'};
const CMP=[['agree','척도와 서술이 함께 가리키는 어려움','두 자료가 같은 방향을 보여 계획의 중심에 둡니다.'],['narrative','서술에서 더 크게 드러난 어려움','척도 응답보다 실제 기록이 더 무거운 부분입니다. 응답 시점과 장면을 확인합니다.'],['fill','척도에서 확인되지 않았던 내용을 서술이 보완한 부분','미상으로 남은 문항의 실제 모습을 서술이 보여줍니다.'],['conflict','척도와 서술이 엇갈리는 부분','응답자와 기록자의 관점 차이일 수 있어 사례회의에서 맞춰 봅니다.'],['scale','척도에만 나타난 어려움','서술에 구체적인 모습을 더하면 계획과 점검이 쉬워집니다.'],['past','과거 일로 기록된 내용','현재도 이어지는지 확인합니다.']];
function cmpHtml(cmp){
 const blocks=CMP.filter(([k])=>cmp[k==='past'?'past':k].length).map(([k,t,d])=>'<div class="odi-card onr-cmp-'+k+'"><h4>'+esc(t)+'</h4><p class="odi-muted">'+esc(d)+'</p>'+ul(cmp[k].map(x=>{const qs=['conflict','low'].includes(k)?x.quotes:x.quotes.filter(q=>q.status!=='부인');return '<strong>'+esc(x.topic)+'</strong>'+(qs.length?' '+esc(uniq(qs).slice(0,2).map(q=>'“'+q.quote+'” ('+q.source+')').join(' · ')):'')}))+'</div>');
 return blocks.length?blocks.join(''):'<p>척도와 서술 사이에서 비교할 만한 어려움이 추출되지 않았습니다.</p>';
}
function sentenceAppendix(n,head){
 const rows=n.read.sentences.map(s=>[s.id,s.text,s.source,s.links.map(l=>l.n+'번 '+l.topic+' ('+STATUS_TEXT[l.status]+')').join(' · ')||(s.kind.join('·')||'—')]);
 const t=(h,rs)=>rs.length?'<div class="odi-table"><table><thead><tr>'+h.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rs.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p>해당 없음</p>';
 const KIND={agree:'일치',narrative:'서술이 더 큼',fill:'서술로 보완',conflict:'엇갈림',scale:'척도에만',agreeLow:'함께 낮음',past:'과거'};
 const crs=n.compare.rows.map(r=>[r.n+'번',r.topic,r.value==='unknown'?'미상':r.value+'점',r.status?STATUS_TEXT[r.status]:'언급 없음',KIND[r.kind]]);
 return '<section class="odi-appendix"><h3>'+esc(head||'근거 자료 · 문장과 문항')+'</h3><p>본문 해석의 바탕이 된 문장 분해와 문항 대조표입니다.</p>'
  +'<details open><summary>문장별 근거</summary>'+t(['문장','서술','출처','연결 문항·상태'],rows)+'</details>'
  +'<details><summary>척도·서술 대조표</summary>'+t(['문항','내용','척도 응답','서술','관계'],crs)+'</details></section>';
}
function narrativeHtml(nv){
 if(!nv.present)return '<article class="oy-deep-report onr-report"><header class="odi-head"><span class="odi-kicker">OY-RALS 서술기록 분석</span><h2>서술기록 미입력</h2><p>서술기록이 입력되지 않았습니다. 25문항 응답만으로 척도 해석과 통합 사정의견을 확인할 수 있습니다.</p></header>'
  +sec('guide',1,'서술기록에 담으면 좋은 내용',ul(['학생이 직접 한 말 (따옴표로)','교사·보호자가 본 구체적인 장면과 빈도','학생이 바라는 변화와 받고 싶은 도움','학생의 강점, 좋아하는 사람과 활동','이미 받고 있는 지원과 담당 기관','안전과 관련해 들은 말이나 본 모습']))
  +(nv.gaps.length?sec('gaps',2,'척도 응답에 맞춰 기록할 내용',ul(nv.gaps.map(g=>'<strong>'+esc(g.topic)+'</strong> '+esc(g.text)))):'')+'</article>';
 const g=nv.glance;let i=0;
 let h='<article class="oy-deep-report onr-report" data-report-version="'+VERSION+'"><header class="odi-head"><span class="odi-kicker">OY-RALS 서술기록 분석</span><h2>'+esc(g.themes.length?g.themes.slice(0,2).join(' · ')+' 중심 기록':'맥락 중심 기록')+'</h2><p>서술기록 '+esc(g.sentences)+'문장을 출처·주제·척도 대조로 나누어 읽었습니다.</p></header>';
 h+='<section class="odi-sec odi-glance"><h3>한눈에 보기</h3><dl><div><dt>기록 출처</dt><dd>'+esc(g.sources.join(' · '))+'</dd></div><div class="'+(nv.read.safety.length?'odi-alert':'')+'"><dt>안전 관련 표현</dt><dd>'+esc(g.safety)+'</dd></div><div><dt>드러난 생활영역</dt><dd>'+(g.themes.length?g.themes.map(t=>'<span class="odi-chip">'+esc(t)+'</span>').join(''):'문항과 직접 연결되는 표현 없음')+'</dd></div><div><dt>척도와의 관계</dt><dd>'+esc(g.fit)+'</dd></div><div><dt>다음 기록에 더할 것</dt><dd>'+esc(nv.gaps.slice(0,3).map(x=>x.topic).join(', ')||'현재 기록으로 충분합니다')+'</dd></div></dl></section>';
 if(nv.read.safety.length)h+=sec('critical',++i,'서술상 안전 신호','<ul class="odi-list">'+nv.read.safety.map(f=>'<li><strong>'+esc(f.topic)+'</strong><p>'+esc(quoteLine(f))+'.</p><p class="odi-act">'+esc(K.item(f.n).e)+' '+esc(K.item(f.n).t)+'</p></li>').join('')+'</ul><p class="odi-procedure">척도 응답과 관계없이 소속기관의 안전·보호 절차를 먼저 따릅니다.</p>');
 if(nv.read.others.length)h+=sec('others',++i,'다른 사람에 관한 안전 이야기','<ul class="odi-list">'+nv.read.others.map(f=>'<li><p>“'+esc(f.quote)+'”</p></li>').join('')+'</ul><p class="odi-muted">다른 사람의 안전에 관한 이야기입니다. 학생의 점수·단계에는 반영하지 않습니다. 해당 인물의 안전은 담당자가 확인하고, 학생이 이 일로 받은 영향은 면담에서 살펴봅니다.</p>');
 h+=sec('understanding',++i,'서술 기반 생활 사정','<p class="odi-lead">'+esc(nv.story)+'</p>');
 h+=sec('themes',++i,'생활영역별 분석',nv.themes.length?nv.themes.map(t=>'<div class="odi-domain'+(t.reported.some(n=>SAFETY.includes(n))?' odi-l4':t.reported.length?' odi-l2':'')+'"><h4>'+esc(t.name)+'<span class="odi-tag">'+esc(t.reported.length?'어려움 기록':'부인·확인 필요')+'</span></h4>'+ul(t.quotes.map(f=>esc(quoteLine(f))+(f.status!=='보고'?' <span class="odi-who">'+esc(STATUS_TEXT[f.status])+'</span>':'')))+(t.meaning.length?'<p><strong>의미</strong> '+esc(t.meaning.map(m=>m.text).join(' '))+'</p>':'')+'</div>').join(''):'<p>25문항 영역과 직접 연결되는 표현은 추출되지 않았습니다.</p>');
 const persp=Object.keys(nv.read.sources);
 h+=sec('voices',++i,'정보 출처별 관점',ul(persp.map(src=>'<strong>'+esc(src)+'</strong> '+esc(nv.read.sentences.filter(s=>s.source===src).map(s=>s.links.map(l=>l.topic+(l.status==='부인'?'(부인)':'')).join(', ')).filter(Boolean).join(', ')||'맥락 정보'))) +(persp.length===1?'<p class="odi-muted">한 가지 관점의 기록입니다. 다른 관점(학생·교사·보호자)의 기록을 더하면 해석이 균형을 갖습니다.</p>':''));
 if(nv.read.strengths.length||nv.read.wishes.length||nv.read.supports.length)h+=sec('strengths',++i,'강점·욕구·기존 지원',(nv.read.strengths.length?'<h4 class="odi-sub">강점</h4>'+ul(nv.read.strengths.map(s=>esc('“'+s.quote+'”'))):'')+(nv.read.wishes.length?'<h4 class="odi-sub">학생의 바람</h4>'+ul(nv.read.wishes.map(s=>esc('“'+s.quote+'”'))):'')+(nv.read.supports.length?'<h4 class="odi-sub">기존 지원</h4>'+ul(nv.read.supports.map(s=>esc('“'+s.quote+'”'))):''));
 h+=sec('compare',++i,'척도–서술 교차검토',cmpHtml(nv.compare)+'<p class="odi-muted">두 자료를 합친 사례개념화와 개입계획은 통합 사정의견에서 이어집니다.</p>');
 if(nv.gaps.length)h+=sec('gaps',++i,'기록 보완 사항',ul(nv.gaps.map(g=>'<strong>'+esc(g.topic)+'</strong> '+esc(g.text))));
 if(nv.questions.length)h+=sec('questions',++i,'면담 확인 질문','<ol class="odi-q">'+nv.questions.map(x=>'<li><span>'+esc(x.about)+' · '+esc(x.why)+'</span>“'+esc(x.q)+'”</li>').join('')+'</ol>');
 h+=sentenceAppendix(nv)+'<footer class="odi-notice"><h3>해석 안내</h3><p>'+esc(nv.notice)+'</p></footer></article>';
 return h;
}
function integratedBody(I,keys){
 const r=I.deep,cmp=I.compare,B={
  critical:()=>{const n=I.narrative.read.safety;return (r.critical.list.length?'<ul class="odi-list">'+r.critical.list.map(x=>'<li><strong>'+esc(x.topic)+'</strong> <span class="odi-who">척도</span><p>'+esc(x.reading)+'</p><p class="odi-act">'+esc(x.action)+'</p></li>').join('')+'</ul>':'')+(n.length?'<ul class="odi-list">'+byTopic(n).map(g=>'<li><strong>'+esc(g.topic)+'</strong> <span class="odi-who">서술</span>'+g.quotes.map(q=>'<p>'+esc(q)+'.</p>').join('')+(r.critical.list.some(x=>x.n===g.n)?'':'<p class="odi-act">'+esc(K.item(g.n).e)+'</p>')+'</li>').join('')+'</ul>':'')+(r.critical.procedure?'<p class="odi-procedure">'+esc(r.critical.procedure)+'</p>':'<p class="odi-procedure">안전 관련 내용은 이 보고서와 관계없이 소속기관의 보호·신고 절차를 먼저 따릅니다.</p>')},
  understanding:()=>'<p class="odi-lead">'+esc(I.understanding)+'</p>',
  grade:()=>GL&&I.grade?GL.html(I.grade,{compact:!!(keys&&keys.compact)}):'',
  compare:()=>I.present?cmpHtml(cmp):'<p>서술기록이 없어 대조를 생략했습니다. 면담·관찰 내용을 서술기록에 더하면 이 부분이 채워집니다.</p>',
  patterns:()=>{const a=r.patterns.active.slice(0,2),b=I.newPatterns.slice(0,2);return (a.length?a.map(p=>'<div class="odi-card"><h4>'+esc(p.name)+' <span class="odi-who">척도</span></h4><p>'+esc(p.loop)+'</p><p class="odi-advice"><strong>자문 포인트</strong> '+esc(p.advice)+'</p></div>').join(''):'')+(b.length?b.map(p=>'<div class="odi-card"><h4>'+esc(p.name)+' <span class="odi-who">서술을 더해 드러남</span></h4><p>'+esc(p.loop)+'</p><p class="odi-advice"><strong>자문 포인트</strong> '+esc(p.advice)+'</p></div>').join(''):'')||'<p>두 가지 이상의 어려움이 맞물린 고리는 나타나지 않았습니다.</p>'},
  case:()=>{const l=I.level;return '<p class="odi-pattern-name">'+esc(l.name)+'</p><p>'+esc(l.reason)+'</p>'+(I.adjust?'<p class="odi-advice"><strong>서술 반영</strong> '+esc(I.adjust)+'</p>':'')+'<dl class="odi-axes"><div><dt>접촉 빈도</dt><dd>'+esc(l.contact)+'</dd></div><div><dt>사례회의</dt><dd>'+esc(l.meeting)+'</dd></div><div><dt>점검·재사정</dt><dd>'+esc(l.review)+'</dd></div>'+(I.immediate?'<div><dt>즉시 대응</dt><dd>'+esc(I.immediate)+'</dd></div>':'')+'<div><dt>주관</dt><dd>'+esc(I.lead)+'</dd></div>'+(I.partners.length?'<div><dt>협력</dt><dd>'+esc(I.partners.join(', '))+'</dd></div>':'')+'</dl><p>'+esc(I.leadText)+'</p><p><strong>보호자 참여</strong> '+esc(I.family)+'</p>'},
  plan:()=>I.plan.map(ph=>'<div class="odi-card"><h4>'+esc(ph.phase)+'</h4><ul>'+ph.rows.map(x=>'<li>'+esc(x.what)+' <span class="odi-who">'+esc(x.who)+'</span></li>').join('')+'</ul></div>').join('')+(I.goals.length?'<h4 class="odi-sub">목표와 기준선</h4>'+ul(I.goals.map(g=>'<strong>'+esc(g.topic)+'</strong> '+esc(g.goal)+(g.baseline?'<br><span class="odi-muted">기준선(서술): “'+esc(g.baseline)+'”</span>':'')+'<br><span class="odi-muted">확인 방법: '+esc(g.measure)+'</span>')):''),
  agenda:()=>'<ol>'+I.agenda.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ol>',
  strengths:()=>(I.strengths.length?ul(I.strengths.map(s=>'<strong>'+esc(s.label)+'</strong> '+esc(s.text))):'<p>첫 면담에서 학생이 잘하는 것과 좋아하는 것을 직접 물어 찾습니다.</p>')+(I.wishes.length?'<h4 class="odi-sub">학생의 바람</h4>'+ul(I.wishes.map(q=>esc('“'+q+'”'))):''),
  ecology:()=>'<div class="odi-table odi-eco"><table><thead><tr><th scope="col">수준</th><th scope="col">척도에서 드러난 어려움</th><th scope="col">서술에 기록된 모습</th><th scope="col">연계 자원 유형</th></tr></thead><tbody>'+ecoRows(I).map(e=>'<tr><th scope="row">'+esc(e.name)+'</th><td>'+esc(e.hard)+'</td><td>'+esc(e.quotes)+'</td><td>'+esc(e.res)+'</td></tr>').join('')+'</tbody></table></div>',
  questions:()=>'<ol class="odi-q">'+I.questions.map(x=>'<li><span>'+esc(x.about)+(x.why?' · '+esc(x.why):'')+'</span>“'+esc(x.q)+'”</li>').join('')+'</ol>'
 };
 return B;
}
function ecoRows(I){
 return I.deep.casework.ecology.map(e=>{
  const rows=I.compare.rows.filter(x=>K.item(x.n).eco===e.id);
  const quotes=[...new Set(rows.flatMap(x=>x.quotes.filter(q=>q.status!=='부인').map(q=>'“'+q.quote+'”')))];
  const res=[...new Set([...e.res,...rows.filter(x=>x.kind==='narrative'||x.kind==='fill').flatMap(x=>K.item(x.n).res.split(', '))])];
  return {id:e.id,name:e.name,hard:e.hard.join(', ')||'두드러진 어려움 없음',quotes:quotes.join(' · ')||'—',res:res.join(', ')||'—'};
 });
}
// One entry per safety topic: several quotes about the same cue share one action line,
// and a cue the scale already raised keeps the scale's action instead of repeating it.
const byTopic=list=>{const m=new Map();list.forEach(f=>{if(!m.has(f.n))m.set(f.n,{n:f.n,topic:f.topic,quotes:[]});m.get(f.n).quotes.push(quoteLine(f));});return [...m.values()];};
// Three ladders answer three questions; say so once where they meet, instead of renaming any of them.
const LADDERS='CORE 공식 판정은 안전 절차를 바로 밟을지, 5단계 지원 우선순위는 얼마나 서둘러 어느 범위의 기관과 움직일지, 개입 수준은 얼마나 자주 만나고 언제 사례회의를 할지를 정합니다.';
const ITITLES={critical:'우선 안전 확인',understanding:'통합 사례개념화',grade:'학년(발달단계)으로 읽기',compare:'척도–서술 교차검토',patterns:'문제 유지 고리 (교차 패턴)',case:'개입 수준과 주관기관',ecology:'생태체계 사정',plan:'단계별 개입계획',agenda:'사례회의 안건',strengths:'강점·보호요인과 학생의 욕구',questions:'면담 확인 질문'};
function hasCritical(I){return I.deep.critical.list.length||I.narrative.read.safety.length}
function integratedHtml(I){
 const B=integratedBody(I),keys=(hasCritical(I)?['critical']:[]).concat(['understanding'],I.grade?['grade']:[],['compare','patterns','case','ecology','plan','agenda','strengths','questions']);
 let h='<article class="oy-deep-report onr-report onr-integrated" data-report-version="'+VERSION+'"><header class="odi-head"><span class="odi-kicker">OY-RALS 통합 사정의견서 · 척도'+(I.present?'와 서술기록':'')+' 통합</span><h2>'+esc(I.level.name)+'</h2><p>CORE 공식 판정: '+esc(I.deep.title)+'</p></header>';
 h+='<section class="odi-sec odi-glance"><h3>한눈에 보기</h3><dl><div><dt>개입 수준</dt><dd>'+esc(I.level.name)+'</dd></div><div class="'+(I.safety==='이번 응답의 안전 신호 없음'?'':'odi-alert')+'"><dt>현재 안전</dt><dd>'+esc(I.safety)+'</dd></div><div><dt>핵심 과제</dt><dd>'+(I.keys.length?I.keys.map(k=>'<span class="odi-chip">'+esc(k)+'</span>').join(''):'두드러진 어려움 없음')+'</dd></div><div><dt>첫 행동</dt><dd>'+esc(I.first)+'</dd></div><div class="odi-ladders"><dt>단계 이름이 셋인 이유</dt><dd>'+esc(LADDERS)+'</dd></div><div><dt>종합 근거</dt><dd>'+esc('25문항 응답'+(I.present?' · 서술기록 '+I.narrative.glance.sentences+'문장 ('+I.narrative.glance.sources.join(', ')+')':' · 서술기록 없음'))+'</dd></div></dl></section>';
 keys.forEach((k,i)=>{h+=sec(k,i+1,ITITLES[k],B[k]())});
 h+=(I.present?sentenceAppendix(I.narrative,'근거 자료 · 문항·점수와 서술 문장'):'<section class="odi-appendix"><h3>근거 자료 · 문항·점수와 서술 문장</h3><p>원점수 '+esc(I.deep.summary.total)+' · CORE 판단: '+esc(I.deep.title)+'</p><p class="odi-muted">문항별 점수는 척도 해석의 근거 자료에서 확인합니다.</p></section>')+'<footer class="odi-notice"><h3>해석 안내</h3><p>'+esc(I.notice)+'</p></footer></article>';
 return h;
}
/* Compact blocks for the 03 case conceptualisation pages. */
function caseHtml(I,page){
 const B=integratedBody(I,{compact:true});
 const pick=page==='서비스계획'?['plan','ecology']:page==='사례협의'?['agenda','compare','questions']:['understanding'].concat(I.grade?['grade']:[],['compare','case','strengths']);
 const head={사례사정:'통합사정 요약 · 척도와 서술기록',서비스계획:'통합 개입계획 · 척도와 서술기록',사례협의:'사례회의 준비 · 척도와 서술기록'}[page]||'통합 요약';
 if(page!=='서비스계획'&&hasCritical(I))pick.unshift('critical');
 return '<article class="oy-deep-report onr-report onr-case"><header class="odi-head"><span class="odi-kicker">OY-RALS 통합 해석 연계</span><h2>'+esc(head)+'</h2><p>'+esc(I.level.name+' · 주관 '+I.lead+(I.present?'':' · 서술기록 없음'))+'</p></header>'+pick.map((k,i)=>sec(k,i+1,ITITLES[k],B[k]())).join('')+'</article>';
}
/* Plain-text versions for TXT / AI prompt exports. */
function narrativeText(nv){
 if(!nv.present&&nv.read.redacted)return '■ OY-RALS 서술기록 분석\n서술 원문은 개인정보 보호를 위해 이 출력에서 제외했습니다(내보낼 때 ‘서술 포함’을 선택하면 반영).'+(nv.read.safety.length?'\n안전 관련 표현: '+nv.read.redacted.topics.join(', ')+' — 원문은 화면에서 확인하고 오늘 안에 직접 안전 면담을 합니다.':'\n안전 관련 표현: 없음');
 if(!nv.present)return '■ OY-RALS 서술기록 분석\n서술기록 미입력 · 25문항 응답만으로 해석합니다.';
 const L=['■ OY-RALS 서술기록 분석','기록 출처: '+nv.glance.sources.join(' · '),'안전 관련 표현: '+nv.glance.safety,'드러난 생활영역: '+(nv.glance.themes.join(', ')||'없음'),'척도와의 관계: '+nv.glance.fit];
 if(nv.read.safety.length)L.push('','[서술상 안전 신호]',...nv.read.safety.map(f=>'- '+f.topic+': '+quoteLine(f)+'.\n  → '+K.item(f.n).e));
 if(nv.read.others.length)L.push('','[다른 사람에 관한 안전 이야기]',...nv.read.others.map(f=>'- “'+f.quote+'”'),'  → 다른 사람의 안전에 관한 이야기입니다. 학생의 점수·단계에는 반영하지 않습니다. 해당 인물의 안전은 담당자가 확인하고, 학생이 이 일로 받은 영향은 면담에서 살펴봅니다.');
 L.push('','[서술 기반 생활 사정]',nv.story,'','[생활영역별 분석]',...nv.themes.flatMap(t=>['▸ '+t.name,...t.quotes.map(f=>'  - '+quoteLine(f)+(f.status!=='보고'?' ('+STATUS_TEXT[f.status]+')':'')),...(t.meaning.length?['  의미: '+t.meaning.map(m=>m.text).join(' ')]:[])]));
 L.push('','[척도–서술 교차검토]',...CMP.filter(([k])=>nv.compare[k].length).flatMap(([k,t])=>['▸ '+t,...nv.compare[k].map(x=>'  - '+x.topic)]));
 if(nv.gaps.length)L.push('','[기록 보완 사항]',...nv.gaps.map(g=>'- '+g.topic+': '+g.text));
 if(nv.questions.length)L.push('','[면담 확인 질문]',...nv.questions.map((x,i)=>(i+1)+'. ['+x.about+'] "'+x.q+'"'));
 L.push('','[근거 자료 · 문장과 문항]',...nv.read.sentences.map(s=>s.id+' ('+s.source+') '+s.text+(s.links.length?' → '+s.links.map(l=>l.n+'번 '+STATUS_TEXT[l.status]).join(', '):'')),'','[해석 안내]',nv.notice);
 return L.join('\n');
}
function integratedText(I){
 const L=['■ OY-RALS 통합 사정의견서 · 척도'+(I.present||I.redacted?'와 서술기록':'')+' 통합','CORE 공식 판정: '+I.deep.title,'','[한눈에 보기]','개입 수준: '+I.level.name,'현재 안전: '+I.safety,'핵심 과제: '+(I.keys.join(', ')||'두드러진 어려움 없음'),'첫 행동: '+I.first,'단계 이름이 셋인 이유: '+LADDERS];
 if(hasCritical(I))L.push('','[우선 안전 확인]',...I.deep.critical.list.map(x=>'- (척도) '+x.topic+': '+x.action),...I.narrative.read.safety.map(f=>'- (서술) '+f.topic+': '+quoteLine(f)+'.'));
 L.push('','[통합 사례개념화]',I.understanding);
 if(I.grade&&GL)L.push('','[학년(발달단계)으로 읽기]',...GL.text(I.grade));
 if(I.present)L.push('','[척도–서술 교차검토]',...CMP.filter(([k])=>I.compare[k].length).flatMap(([k,t])=>['▸ '+t,...I.compare[k].map(x=>'  - '+x.topic)]));
 if(I.newPatterns.length)L.push('','[서술을 더해 드러난 문제 유지 고리]',...I.newPatterns.slice(0,2).map(p=>'- '+p.name+': '+p.loop));
 L.push('','[개입 수준과 주관기관]',I.level.name,I.level.reason,...(I.adjust?['서술 반영: '+I.adjust]:[]),'- 접촉 빈도: '+I.level.contact,'- 사례회의: '+I.level.meeting,'- 점검·재사정: '+I.level.review,...(I.immediate?['- 즉시 대응: '+I.immediate]:[]),'- 주관: '+I.lead,'보호자 참여: '+I.family);
 L.push('','[단계별 개입계획]',...I.plan.flatMap(ph=>['▸ '+ph.phase,...ph.rows.map(x=>'  - '+x.what+' ['+x.who+']')]),...I.goals.map(g=>'  목표 · '+g.topic+': '+g.goal+(g.baseline?' / 기준선: '+g.baseline:'')));
 L.push('','[사례회의 안건]',...I.agenda.map((a,i)=>(i+1)+'. '+a),'','[강점·보호요인과 학생의 욕구]',...I.strengths.map(s=>'- '+s.label+': '+s.text),...I.wishes.map(q=>'- 바람: '+q),'','[면담 확인 질문]',...I.questions.map((x,i)=>(i+1)+'. ['+x.about+'] "'+x.q+'"'));
 L.push('','[근거 자료 · 문항·점수와 서술 문장]','원점수: '+I.deep.summary.total,...(I.present?I.narrative.read.sentences.map(s=>s.id+' ('+s.source+') '+s.text+(s.links.length?' → '+s.links.map(l=>l.n+'번 '+STATUS_TEXT[l.status]).join(', '):'')):[]),...I.compare.rows.map(r=>'- '+r.n+'번 '+r.topic+': 척도 '+(r.value==='unknown'?'미상':r.value+'점')+' / 서술 '+(r.status?STATUS_TEXT[r.status]:'언급 없음')));
 L.push('','[해석 안내]',I.notice);
 return L.join('\n');
}
function caseText(I,page){
 if(page==='서비스계획')return ['[통합 개입계획 · 척도와 서술기록] '+I.level.name+' · 주관 '+I.lead,...I.plan.flatMap(ph=>['▸ '+ph.phase,...ph.rows.map(x=>'  - '+x.what+' ['+x.who+']')])].join('\n');
 if(page==='사례협의')return ['[사례회의 준비 · 척도와 서술기록]',...I.agenda.map((a,i)=>(i+1)+'. '+a)].join('\n');
 return ['[통합사정 요약 · 척도와 서술기록]',I.understanding,'개입 수준: '+I.level.name+(I.adjust?' ('+I.adjust+')':'')].join('\n');
}
/* What may leave the screen when the narrative itself is withheld: signal types only, no wording.
   stage mirrors the five-level index rule (current, non-negated, first-party safety cue). */
function safetySummary(p){
 const text=String(p&&p.caseContext||'').trim();if(!text)return null;
 const n=read(p),items=[...new Set(n.safety.filter(f=>f.status==='보고'||f.status==='추정').map(f=>f.n))];
 let stage=items.length>0;
 const C=node?require('./case-context-core.js'):root.YouthCaseContextCore;
 let immediate=[];
 try{if(C&&C.reconcile){const x=C.reconcile(p.answers,text);stage=stage||x.signals.some(s=>s&&s.safety&&['reported','unverified'].includes(s.polarity)&&s.timeHint!=='historical-mention'&&s.subject!=='third-party');immediate=(x.immediate||[]).map(i=>({tag:i.tag,reason:i.reason}));}}catch(_){}
 return {sentences:n.sentences.length,safety:items.map(i=>({n:i,topic:K.item(i).topic})),stage,immediate};
}
function redact(p){return {...p,caseContext:'',narrativeRedacted:safetySummary(p)}}
const api=Object.freeze({VERSION,NOTICE,read,narrative,integrate,narrativeHtml,narrativeText,integratedHtml,integratedText,caseHtml,caseText,safetySummary,redact});
if(node)module.exports=api;else root.OYNarrativeInterpretation=api;
})(typeof window!=='undefined'?window:globalThis);
