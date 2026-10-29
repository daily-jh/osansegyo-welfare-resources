/* OY-RALS v4.0/v4.2 single free-text case-context interpreter.
   All extracted cues are unverified review prompts; NEVER diagnosis, risk scoring, or auto-reporting. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthCaseContextCore=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='1.7.0-xmod1200-20261029',LIMITS=Object.freeze({text:5000}),MAX_CLAUSES=65;
const TYPES=Object.freeze([
 {id:'protection',items:[1,2],label:'학대·보호 관련 언급',re:/학대|방임|체벌|맞았|폭행|가정폭력|보호자.{0,12}(?:위협|폭력)|보호.{0,4}부재|(?:아버지|아빠|어머니|엄마|보호자|부모|계부|계모|새아빠|새엄마|양부|양모|할아버지|할머니|삼촌|이모|고모)(?:가|께서|이|는|은|한테|에게)?[^.,]{0,14}(?:때리|때렸|때린|때려|때림|목을\s?졸|졸랐|발로\s?차|걷어차|던졌|던지|던진|던짐|던져|가둬|가뒀|밥을?\s?(?:안|못)\s?(?:주|준|줌)|낳지\s?말았|쫓아내|내쫓)|(?:벨트|허리띠|몽둥이|효자손|옷걸이|회초리)(?:로|를)?[^.,]{0,6}(?:때|맞)|(?:아버지|아빠|어머니|엄마|보호자|부모|계부|계모|새아빠|새엄마|양부|양모|할아버지|할머니|삼촌)(?:에게|한테|께)\s?[^.,]{0,6}맞(?:아|았|는|고|음|다|을|은)|(?:부모|보호자|엄마|아빠|어머니|아버지)[^.,]{0,6}며칠(?:씩|째)\s?(?:집에\s?)?(?:안|못)\s?들어|병원에\s?(?:안|못)?\s?데려가\s?(?:주지\s?)?않|병원에\s?(?:안|못)\s?데려|집에\s?(?:가기|들어가기)\s?(?:무섭|두렵)|(?:얼굴|눈가?|뺨|목|이마)[^.,]{0,6}멍(?!하)/,safety:true,ask:'현재 안전·발생시기·당사자 진술과 법정 신고·보호절차를 담당자가 확인합니다.'},
 {id:'peer',items:[3,4,5],label:'또래관계·학교폭력',re:/따돌림|왕따|학교폭력|괴롭힘|놀림|또래.{0,6}(?:위협|폭행)|금품.{0,6}요구|협박|저격|카톡\s?감옥|단톡(?:방)?[^.,]{0,10}(?:욕|저격|초대)|(?:빵|와이파이|게임)\s?셔틀|돈을?\s?(?:뺏|빼앗)|선배들?(?:이|가)[^.,]{0,14}(?:때렸|때린|때려|불러)/,ask:'피해인지 행동인지와 학교의 안전조치, 동일 사건 여부를 구분합니다.'},
 {id:'selfharm',items:[7],label:'자해·죽음 관련 언급',re:/자해|자살|죽고\s?싶|살기\s?싫|살고\s?싶지(?:는)?\s?않|사라지고\s?싶|없어지고\s?싶|이제\s?그만\s?하고\s?싶|유서|(?:약|수면제|진통제)(?:을|를)?\s?[^.,]{0,6}(?:모아|모았|모으)|약\s?봉투|극단적\s?선택|(?:손목|팔목|팔뚝|허벅지).{0,14}(?:상처|흉터|칼자국|베인|베었|베어|그은|그었|그어|긋)|칼자국|(?:칼|커터|면도날?)(?:로|을|를)?[^.,]{0,10}(?:그어|그었|긋|베었|베어)|(?:그어야|그으면)[^.,]{0,8}(?:진정|풀리|편해)|(?:어젯밤|어제|그저께|또|다시|자주|계속|매일)[^.,]{0,20}(?:그었|그어|긋는)|(?:사라지|없어지|죽으)면\s?(?:편할|좋겠|나을)|살\s?이유(?:가)?\s?없|죽는\s?게\s?(?:낫|편)|죽어\s?버리|뛰어내리|다\s?끝내고\s?싶|(?:나쁜|몹쓸)\s?생각|(?<![가-힣])자\s해\s?(?:한|를|했|흔적|자국)|자살각|(?:내가|제가)\s?(?:없어지|사라지|죽으)면|태어나지\s?말|약을?\s?(?:한꺼번에|한\s?번에|많이)\s?먹/,safety:true,ask:'현재 생각·행동·계획·수단 및 안전한 보호체계를 직접 확인합니다.'},
 {id:'emotion',items:[6,8],label:'정서적 어려움',re:/우울|불안|무기력|불면|수면장애|잠을\s?(?:거의\s?|잘\s?)?못\s?자|잠들기.{0,3}(?:어렵|힘들)|공황|정서.{0,5}곤란|심리적.{0,5}고통|과호흡|현타|아무것도\s?하기\s?싫|말수가[^.,]{0,4}줄|목소리가\s?들린|환청/,ask:'지속기간·생활영향·학생이 원하는 도움을 확인합니다.'},
 {id:'attendance',items:[9,11],label:'출결·소속감',re:/결석|지각|조퇴|등교.{0,9}(?:거부|어려|회피)|학교.{0,5}가기\s?싫|수업.{0,6}불참|학업중단|학교 소속감/,ask:'출결 변화의 시점과 학교 참여를 어렵게 하는 여건을 확인합니다.'},
 {id:'learning',items:[10,14,15],label:'학습·접근성',re:/기초학습|학습곤란|학습부진|과제.{0,7}(?:어려|미제출)|수업.{0,6}이해|접근성|보조공학|교육환경.{0,7}조정|받아쓰기|글\s?읽기|따라가지\s?못|한국어[^.,]{0,10}(?:어려|서툴|못)|보청기|입국한\s?지/,ask:'학습지원 필요와 교육환경·서비스 접근 장벽을 구분합니다.'},
 {id:'behavior',items:[5,12,13],label:'행동·건강',re:/충동.{0,3}행동|물건.{0,4}파손|위험.{0,4}행동|음주|흡연|약물.{0,5}(?:오용|과량)|폭력.{0,3}행동|친구들?과\s?술|술을?\s?마시고\s?(?:등교|학교)|전자\s?담배|담배|토토|도박|대리\s?입금|(?:일부러|먹고)\s?토|물건을?\s?(?:부수|부쉈|부순)/,ask:'행동의 발생상황, 타인 안전 및 현재 건강·의료 상황을 확인합니다.'},
 {id:'care',items:[16,18],label:'가족돌봄',re:/돌봄.{0,3}공백|보호자.{0,8}부재|간병|가족돌봄|동생.{0,6}돌봄|양육.{0,5}공백|돌보느라|병간호|집안일을?\s?도맡|(?:우울증|병)으로\s?누워/,ask:'돌봄 책임의 실제 시간과 성인 대체지원 가능성을 확인합니다.'},
 {id:'family',items:[17],label:'가족관계',re:/가족.{0,3}갈등|부모.{0,6}갈등|양육스트레스|가정.{0,6}불화|이혼|별거|소송\s?중|돌아가신\s?(?:뒤|후)|사별/,ask:'가족관계와 학생의 생활영향, 연락의 안전성을 구분합니다.'},
 {id:'basic',items:[19,20,21],label:'경제·주거·필수생활',re:/결식|끼니|식비|주거.{0,5}(?:불안|위험)|월세.{0,5}체납|퇴거|의료비|치료비.{0,6}부담|생필품.{0,6}부족|생활비.{0,6}부족|식사.{0,4}못|반지하|곰팡이|물이\s?샌|전기가\s?끊|단전|단수|고시원|살\s?돈이\s?없|돈이\s?없어/,ask:'실제 부족한 필수생활과 신청·접수·지원 제공 여부를 구분합니다.'},
 {id:'peerConflict',items:[22],label:'교우 갈등·관계 부담',re:/(?:교우|친구|또래).{0,8}갈등/,ask:'상호 갈등인지 피해·위협인지, 학생이 원하는 거리와 지원을 확인합니다.'},
 {id:'support',items:[22,23],label:'관계·지지',re:/고립|(?:친한\s?)?친구(?:가|들이|는|도)?\s?(?:한\s?명도\s?|별로\s?)?없|지지.{0,6}부족|의지할.{0,5}사람.{0,3}없|도움.{0,6}받을.{0,5}(?:어른|사람).{0,4}없/,negWording:true,ask:'학생이 선택한 신뢰 인물과 실제 도움 요청 가능성을 확인합니다.'},
 {id:'digital',items:[24],label:'디지털 이용 조절',re:/SNS.{0,6}과몰입|게임.{0,6}과몰입|스마트폰.{0,6}(?:과다|과의존|과몰입)|디지털.{0,6}이용.{0,6}조절|새벽까지\s?게임|게임하느라|휴대폰을?\s?뺏으면/,ask:'이용시간 자체보다 실제 수면·학습·관계의 영향을 확인합니다.'},
 {id:'onlineSexual',items:[25],label:'온라인 성착취·디지털 피해',re:/온라인.{0,9}성착취|그루밍|성적.{0,6}사진.{0,9}협박|성적.{0,6}영상.{0,9}유포|디지털.{0,6}성범죄|딥페이크.{0,6}(?:협박|성적)|(?:사진|영상)(?:을|를)?\s?(?:보내라|보내\s?달|요구)|(?:SNS|온라인|채팅|랜덤\s?채팅|게임|앱|인스타|DM|디엠)(?:에서|으로)?\s?(?:만난|알게\s?된)[^.,]{0,12}(?:남성|남자|어른|성인|아저씨|오빠|형|언니|누나|사람)|조건\s?만남|성적인?\s?(?:요구|대화)|몸캠|기프티콘[^.,]{0,12}(?:사진|영상)|랜덤\s?채팅[^.,]{0,12}(?:만나|만난|사진|성인)|모르는\s?(?:사람|어른|성인)[^.,]{0,8}만나/,safety:true,ask:'현재 접촉·협박·유포 가능성과 피해보호 절차를 직접 확인합니다.'},
 // Sexual touching or assault told by the student is a protection matter on its own (random 500-case check 2026-10-29).
 {id:'sexualHarm',items:[1],label:'성적 위해 진술',re:/성추행|성폭력|성폭행|성학대|강간|(?:몸|가슴|엉덩이|속옷|신체|성기|허벅지|다리)(?:을|를|에)?\s?[^.,]{0,6}(?:만지|만졌|만진|만져|만짐|더듬)|(?:만지|더듬)[^.,]{0,8}(?:싫|무섭|못\s?하게)|(?:같이|함께)\s?(?:자자|씻자)고|옷을\s?벗(?:으라|기라)|이상한\s?(?:데|곳)(?:를|을)?\s?(?:만지|만졌|만진|만져)|(?:단둘이|둘만)[^.,]{0,14}(?:껴안|안는|뽀뽀|만지)|(?:억지로|자꾸)\s?(?:껴안|뽀뽀)/,safety:true,ask:'캐묻지 않고 들은 말을 그대로 적은 뒤 오늘 학교 관리자·아동보호 절차로 알리고, 보호자 연락은 보호 담당과 먼저 판단합니다.'},
 // Covering the wrists in heat or with bands is a reason to ask, never proof of self-harm.
 {id:'selfharmCover',items:[7],label:'자해 흔적을 가리는 모습',re:/(?:손목|팔목)[^.,]{0,8}(?:밴드|붕대|반창고|보호대|아대|토시)|(?:더운|여름|체육)[^.,]{0,12}긴팔|긴팔만\s?(?:입|고집)/,safety:true,ask:'자해로 단정하지 않고 학생이 편한 자리에서 상처 여부와 현재 마음을 직접 묻습니다.'},
 // A rooftop, railing or jumping talk is a lethal-means cue to ask about today.
 {id:'fallRisk',items:[7],label:'투신 위험 장소·말',re:/옥상|난간[^.,]{0,6}(?:서|앉|매달|넘)|뛰어내리|투신|떨어지고\s?싶|(?:다리|육교|철교|아파트)\s?(?:위|난간)에서[^.,]{0,10}(?:내려다|서\s?있|뛰어)/,safety:true,ask:'그 장소에 왜 갔는지, 죽음에 대한 생각이 있는지 오늘 직접 묻고 혼자 두지 않습니다.'},
 // Running away or staying out overnight: where the student sleeps tonight is a safety question.
 {id:'runaway',items:[20],label:'가출·외박(오늘 거처 확인)',re:/가출|외박|집을\s?나(?:가|갔|와|왔)|(?:친구|아는)\s?집을?\s?전전|집에\s?(?:안|못)\s?들어가|(?:남성|남자|어른|성인|아저씨)의\s?집에서|(?:잘|지낼|머물)\s?(?:곳|데)(?:이|가)?\s?없|가출팸/,safety:true,ask:'오늘 밤 어디서 자는지, 함께 있는 사람이 누구인지 확인하고 필요하면 청소년쉼터·1388과 연결합니다.'},
 // A threat to spread images is a current safety issue whatever the images are; never assume they are sexual.
 {id:'imageThreat',items:[4,25],label:'촬영물·사진 유포 위협',re:/딥페이크|합성\s?(?:사진|영상)|(?:촬영물|사진|영상|동영상|몸캠|나체|알몸).{0,15}(?:유포|퍼뜨|퍼트|뿌리|뿌린|올리겠|올린다고|게시|공개하)|(?:유포|퍼뜨리|퍼트리|뿌리|게시|공개)\S{0,4}\s?(?:하겠|겠다|한다고).{0,10}(?:촬영물|사진|영상)/,safety:true,ask:'어떤 촬영물인지 단정하지 않고, 현재 협박·유포 여부와 요구 내용, 피해 보호절차를 직접 확인합니다.'},
 // A hidden wound or bruise is a reason to ask about its context, not evidence of abuse or self-harm.
 // Harm to another family member at home (a sibling hit by a parent, a parent hit in front of the student) is a protection question for the student too:
 // the student lives with the same adult. Named apart so it is not read as the student's own disclosure (지훈 결정 2026-10-29).
 {id:'householdHarm',items:[1],label:'같은 집 가족 피해(학생 안전 확인)',re:/(?:동생|형|오빠|언니|누나|엄마|어머니)(?:가|이|는)\s?[^.,]{0,6}(?:아빠|아버지|엄마|어머니|새아빠|새엄마|계부|계모|삼촌|할아버지|할머니)(?:에게|한테|가|께)\s?[^.,]{0,8}(?:맞|때리|때린|성추행|성폭|만지|만졌)|(?:아빠|아버지|새아빠|계부)(?:가|이)\s?(?:엄마|어머니)(?:를|에게|한테)\s?[^.,]{0,6}(?:때리|때린|때렸|폭행)/,safety:true,ask:'학생 본인도 같은 어른과 지내는지, 학생이 겪은 일과 오늘 귀가가 안전한지 직접 확인하고 아동보호 담당과 상의합니다.'},
 // A threat to hurt someone, or a weapon carried to school, is a same-day safety question for others and the student.
 {id:'harmThreat',items:[5],label:'타인 위해 위협·흉기',re:/(?:칼|흉기|가위|송곳)(?:로|을|를)?[^.,]{0,10}(?:찌르|죽이|해치)|죽여\s?버리|죽이겠|찔러\s?버리|찌르겠|(?:칼|흉기|접이식\s?칼|잭나이프|커터\s?칼)(?:을|를)?\s?[^.,]{0,10}(?:가지고|넣고|소지|들고)\s?(?:다니|다님|다닌|옴|왔)/,safety:true,ask:'누구를 향한 말인지, 수단을 실제로 가졌는지 오늘 확인하고 수단은 학교 관리자와 함께 안전하게 치웁니다. 해를 입을 수 있는 학생의 안전도 함께 챙깁니다.'},
 // Hitting or controlling by a dating partner is violence, not a quarrel.
 {id:'datingViolence',items:[3,4],label:'교제 폭력(통제·폭행)',re:/(?:남자\s?친구|여자\s?친구|남친|여친|사귀는\s?(?:사람|선배|오빠|형))(?:가|이)?[^.,]{0,14}(?:때리|때린|때려|때렸|폭행|목을|휴대폰을?\s?검사|감시)/,safety:true,ask:'교제 상대의 폭력·통제가 지금도 이어지는지, 학생이 안전하게 지낼 방법과 학교폭력·신고 절차를 학생과 함께 확인합니다.'},
 {id:'woundContext',items:[1,7],label:'상처·멍의 맥락 확인',re:/(?:상처|멍(?!하)|흉터|화상).{0,12}(?:숨기|숨겨|감추|감춰|가리|가린|말하지\s?않|말을\s?안|설명하지\s?않|보여주지\s?않)|(?:숨기|숨겨|감추|감춰|가리|가린).{0,8}(?:상처|멍(?!하)|흉터)/,ask:'자해나 학대로 단정하지 않고 상처의 원인·위치·시점과 학생이 편하게 말할 수 있는 상황인지 확인합니다.'}
]);
const NEG=/(?:없다|없음|없어|없었|없고|없으며|아니다|아님|아니며|하지\s?않|하지는\s?않|싶지\s?않|싶지는\s?않|않았|않음|부인|해당\s?없|안\s?한다|안\s?함|아니라고|(?:생각|마음)(?:은|이|도)?\s?(?:들지|나지)\s?않)/;
// "Not wanting to stop" is the opposite of a denial.
// "Not wanting to live" is itself the cue, never a denial of one.
const CONTINUE=/(?:멈추|멈출|그만두|그만하|그만\s?하|끊)\S{0,4}\s?(?:싶지\s?않|않)|살고\s?싶지(?:는)?\s?않|살\s?이유가?\s?없|(?:없어지|사라지)면|(?:잘|지낼|머물)\s?(?:곳|데)(?:이|가)?\s?없|돈이\s?없/;
// Someone else is the one who self-harms, or a peer is the one hurt ("친구가 아버지에게 맞았다").
// "친구가 때렸다" stays with the student. Harm to a sibling or parent at home also stays with the student:
// it is the student's household, and a missed cue costs more than a check.
const OTHERS='(?:친구|동생|형|오빠|언니|누나|선배|후배|다른 학생|옆 ?반 학생|사촌|친척|보호자|부모|어머니|아버지|엄마|아빠)',PEERS='(?:친구|선배|후배|다른 학생|옆 ?반 학생|사촌|친척)';
// Another young person's story ("친구가 집에서 맞는다고 걱정함", "사촌이 가출했다") is that person's, not the student's (random 400-case check 2026-10-28).
// A sibling or parent who ran away or left home is that person's leaving, not the student's runaway (2026-10-29).
const THIRD_PARTY=new RegExp('(?:^|[\\s,])'+OTHERS+'(?:가|는|의|이)\\s?.{0,20}(?:자해|자살|죽고|손목|팔목|팔뚝|허벅지|옥상|뛰어내리|투신)|(?:^|[\\s,])'+PEERS+'(?:가|는|이)\\s?[^.,]{0,16}(?:맞았|맞는|맞고|맞아|학대(?:를)? ?(?:당|받)|폭행(?:을)? ?당|가출|따돌림(?:을)? ?당|괴롭힘(?:을)? ?당|협박(?:을)? ?당|몸캠|성착취|피해(?:를)? ?당)|(?:^|[\\s,])'+OTHERS+'(?:가|는|이|께서)\\s?[^.,]{0,10}(?:가출|외박|집을\\s?나)');
// The student named as the one who acts or is hurt keeps the cue with the student, even when someone else reported it.
// "옆 반 학생이 …" or "다른 학생이 …" is another student, not this one.
const STUDENT_SELF=new RegExp('(?<!(?:반|다른)\\s?)(?:학생|본인)(?:이|은|도|의)?\\s?(?:(?!'+OTHERS+'(?:가|는|이|의)).){0,14}(?:자해|자살|죽고|손목|팔목|팔뚝|허벅지|맞았|학대(?:를)? ?(?:당|받)|폭행(?:을)? ?당)');
const aboutOthers=clause=>THIRD_PARTY.test(clause)&&!STUDENT_SELF.test(clause);
// Hiding or refusing to talk about a sign is not a denial; it stays an unverified cue to check.
const CONCEAL=/(?:숨기|숨겨|감추|감춰|가리고|가린다|말하지\s?않|말을\s?안|이야기하지\s?않|밝히지\s?않|보여주지\s?않)/;
const UNCERTAIN=/(?:의심|추정|가능성|모르|미확인|확인\s?필요|전해\s?들|소문|들은\s?바|인지\s?확인|같다고\s?함)/;
const HYPOTHETICAL=/(?:만약|혹시|(?:하게|되게)\s?되면|(?:뉴스|기사|드라마|영화|웹툰|소설)(?:에서|에|를)?\s?(?:본|나온|읽은)|예시|가정하면|가상의|예를\s?들|척도\s?문항|예방\s?교육|매뉴얼|사례\s?교육|실습\s?문제)/;
// "중1 때 …적이 있고 지금은 안정적": a grade or childhood named as the time, or settled now, is a history to note.
// A threat made now about old photos ("예전 사진을 퍼뜨리겠다") is current, not a past event.
const PRESENT_THREAT=/(?:퍼뜨리|유포하|뿌리|올리|보내)겠|협박하는\s?(?:메시지|문자|DM|연락)/;
const HISTORICAL=/(?:과거|작년|지난해|지난\s?학기|예전|이전에는|몇\s?년\s?전|\d+\s?년\s?전|(?:사례가|사건이|사안이|개입이)\s?(?:종결|종료)|초등학교\s?때|과거에|어릴\s?때|어렸을\s?때|(?:초|중|고)\s?[1-6]\s?(?:학년\s?)?때|[1-6]학년\s?때|(?:지금|현재)은\s?(?:안정|괜찮|없|잘\s?지내))/;
const WISH=/(?:원한다고|원한다|원해|원함|원했|바란다|바라|바람|희망|하고\s?싶|도움\s?요청|요청함|해줬으면|받고\s?싶)/;
const STRENGTH=/(?:잘한다|잘하고|잘함|좋아하|좋아함|좋아해|잘\s?지낸|잘\s?챙기|잘\s?챙긴|아끼고|편해진|먼저\s?말을\s?거|즐겁게|즐겨|강점|장점|믿고\s?의지|신뢰하|신뢰함|스스로|극복|노력|도움\s?청|친한\s?친구|격려|격려해)/;
const SUPPORT=/(?:상담\s?중|치료\s?중|이용\s?중|이용중|연계중|지원\s?받|이미\s?연계|접수\s?완료|접수\s?전|신청\s?중|진료\s?중|문의\s?전|Wee센터|위센터|복지관|가족센터|교육복지)/i;
const URGENT=/(?:당장|즉시|오늘\s?중|시급|급히|긴급|이번\s?주\s?내|조속히)/;
// A current, first-hand cue that already carries injury or a means/plan needs same-day protection, not a later check.
// Strangulation is a lethality marker on its own; a visible bruise or wound is current by being visible.
const INJURY_NOW=/(?:목을\s?졸|졸랐|(?:멍|상처|피멍|혹)(?:이|가)?\s?(?:있|보|생겼|났|들어)|피가\s?(?:나|났)|부었|부어\s?있|다쳤|골절|화상)/;
const RECENT=/(?:어제|오늘|그저께|방금|어젯밤|지난밤|이번\s?주|주말에|며칠\s?전|아침에)/;
const MEANS_PLAN=/(?:유서|커터\s?칼|면도칼|칼을?\s?(?:가지고|넣고|소지)|(?:약|수면제|진통제)(?:을|를)?\s?[^.,]{0,6}(?:모아|모았|모으)|약\s?봉투|방법을?\s?(?:찾|검색|알아)|날짜를?\s?정|구체적.{0,4}계획|약을?\s?(?:한꺼번에|한\s?번에))/;
const HOUSEHOLD=/(?:아버지|아빠|어머니|엄마|보호자|부모|계부|계모|새아빠|새엄마|양부|양모|할아버지|할머니|삼촌|이모부|고모부|외삼촌|큰아버지|작은아버지|친척|오빠|형|사촌|(?:엄마|아빠|어머니|아버지)(?:의)?\s?(?:남자|여자)\s?친구|동거인|집에\s?(?:같이|함께)\s?사는)/;
function immediateOf(s){
 if(!s||!s.safety||s.subject==='third-party'||s.timeHint==='historical-mention'||!['reported','unverified'].includes(s.polarity))return null;
 if(s.tag==='protection'&&s.polarity==='reported'&&(/목을\s?졸|졸랐/.test(s.clause)||INJURY_NOW.test(s.clause)||(RECENT.test(s.clause)&&/(?:멍|상처|피|다쳤|부었)/.test(s.clause))))return {tag:s.tag,reason:'최근 보호자에 의한 신체 피해 진술과 상처 기록',clause:s.clause};
 // Sexual harm told about an adult at home (carer, a parent's partner, a relative) is same-day protection work.
 if(s.tag==='sexualHarm'&&s.polarity==='reported'&&HOUSEHOLD.test(s.clause))return {tag:s.tag,reason:'가정 안 성인에 의한 성적 위해 진술',clause:s.clause};
 // Standing at a rooftop railing today, or saying where they would jump, is a lethal-means cue for today.
 if(s.tag==='fallRisk'&&s.polarity==='reported'&&(RECENT.test(s.clause)||/난간|뛰어내리려|뛰어내릴\s?(?:곳|데)/.test(s.clause)))return {tag:s.tag,reason:'투신 위험 장소에서의 최근 행동·말',clause:s.clause};
 // Nowhere to sleep tonight, or meeting an adult met online today, is today's whereabouts question.
 if(s.tag==='runaway'&&s.polarity==='reported'&&/오늘\s?(?:밤|저녁)|오늘\s?(?:잘|지낼)|(?:잘|지낼)\s?(?:곳|데)(?:이|가)?\s?없/.test(s.clause))return {tag:s.tag,reason:'오늘 밤 지낼 곳이 없다는 진술',clause:s.clause};
 if(s.tag==='onlineSexual'&&/(?:오늘|이따|지금|이번\s?주말)[^.,]{0,10}만나/.test(s.clause))return {tag:s.tag,reason:'온라인에서 알게 된 상대와 오늘 만나기로 한 기록',clause:s.clause};
 if(s.tag==='harmThreat'&&s.polarity==='reported')return {tag:s.tag,reason:'타인을 해치겠다는 말·흉기 소지 기록',clause:s.clause};
 if(s.tag==='selfharm'&&MEANS_PLAN.test(s.clause))return {tag:s.tag,reason:'자해·죽음 관련 표현과 준비 행동·수단·계획 기록',clause:s.clause};
 // A fresh cut or one made in the last days is a current injury, not a history to note.
 if(s.tag==='selfharm'&&s.polarity==='reported'&&(/아물지\s?않|피가\s?(?:나|났)|새로\s?생긴/.test(s.clause)||(RECENT.test(s.clause)&&/(?:그었|그어|긋|베었|베어|자해(?:를|했)|칼자국|상처)/.test(s.clause))))return {tag:s.tag,reason:'최근 자해 행동·현재 상처 기록',clause:s.clause};
 return null;
}
// Physical-neglect signs. One alone is a basic-needs question; two or more together are a protection question.
// The wording is itself negative ("먹지 않음", "집에 없음"), so only an explicit reassurance cancels a sign.
const NEGLECT=[/같은\s?옷|얇은\s?(?:옷|점퍼|외투|겉옷)|계절에\s?맞지\s?않|(?:겨울|추운).{0,10}(?:여름\s?옷|반팔)/,/씻지\s?(?:못|않)|위생\s?상태|냄새가\s?(?:나|심)/,/끼니|굶|배고프|라면으로|아침을?\s?(?:거의\s?)?(?:먹지|거르|안\s?먹|못\s?먹)|허겁지겁|남은\s?(?:빵|음식)을?\s?챙/,/병원에\s?(?:간\s?적이\s?없|가지\s?못)|데려가지\s?않|치료를?\s?(?:받지\s?못|못\s?받)|충치/,/(?:보호자|부모|엄마|아빠|어머니|아버지).{0,12}(?:집에\s?(?:거의\s?)?없|들어오지\s?않|며칠씩)|(?:집에서|집에|방과\s?후(?:에|에는)?|밤에|저녁(?:에|에는)?|주말(?:에|에는)?)\s?혼자\s?(?:지내|있|잔다|잠)|돌봐\s?줄.{0,6}없/];
const REASSURE=/(?:거르지\s?않|굶지\s?않|잘\s?(?:먹|챙겨|씻)|문제\s?없|해당\s?없|걱정\s?없)/;
function cleanString(v){return String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,' ').trim().slice(0,LIMITS.text)}
function redact(s){return String(s||'').replace(/\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/g,'[연락처 생략]').replace(/\b\d{6}[- ]?[1-8]\d{6}\b/g,'[고유식별번호 생략]').replace(/[a-z\d._%+-]+@[a-z\d.-]+\.[a-z]{2,}/gi,'[이메일 생략]').replace(/\b\d{2,4}[- ]\d{3,4}[- ]\d{4}\b/g,'[전화번호 생략]');}
function normalize(input){
 if(input==null||input==='')return null;
 const text=typeof input==='string'?input:typeof input==='object'&&!Array.isArray(input)?(input.text??input.narrative??(input.fields&&Object.entries(input.fields).map(([k,v])=>k+': '+v).join('\n'))??''):'';
 if(typeof text!=='string')throw Error('선택 사례정보는 자유서술 텍스트여야 합니다.');
 const v=cleanString(text);return v?{schema:'OY-RALS-case-context-v2-free-text',version:VERSION,text:v,includeInPrint:false,includeInAICopy:false}:null;
}
// Records often run sentences together without a full stop ("…들지 않는다고 함 자해 흔적이 있음"). A word ending in
// 함·됨 or a past/existence form + 음 (했음·있음·없음·않음…) followed by another word starts a new clause, so a denial or
// time word in one sentence does not carry into the next. Nouns such as 마음·처음·다음 are not split.
const RUN_ON=/((?:[가-힣]함|\s함|\s줌|됨|[했였있없었았않겠]음|[가-힣]임)(?:ㅠ+|ㅜ+|ㅋ+|~+)?)[ \t]+(?!때문|이후|뒤\b|후\b|등\b|으로|에서|이라|정도|상태|중\b)(?=[가-힣"“'‘A-Za-z0-9])/g;
function splitClauses(text){
 return String(text||'').replace(RUN_ON,'$1\n').replace(/(없다지만|없다는데|없다고 하지만|않았다지만|없고|않고|없지만|않지만|없으나|않으나|했으나|였으나|하지만|그러나|반면|다만|그런데|그리고|또한)/g,'$1\n')
 .split(/(?<=[.!?。])\s*|[\n;]+|,(?=\s*(?:학생|보호자|교사|친구|가족|본인|그러나|다만|반면))/)
 .map(s=>s.trim()).filter(Boolean).slice(0,MAX_CLAUSES);
}
function who(clause){if(/학생이\s?(?:말|진술|호소|알려|표현)|학생은\s?.{0,30}(?:말|진술|호소)/.test(clause))return '학생 진술로 기록';if(/(?:교사|담임|교육복지사|사회복지사).{0,14}(?:관찰|확인|기록|보고)/.test(clause))return '담당자 관찰·기록';if(/보호자.{0,14}(?:말|진술|보고)|친구.{0,14}(?:말|전언)|소문|전해/.test(clause))return '타인 진술·전언';return '정보 출처 미기재';}
function infer(input){
 const c=normalize(input);if(!c)return {version:VERSION,hasContext:false,signals:[],issues:[],fields:{},source:'없음',clauses:[],privacyWarnings:[]};
 const clauses=splitClauses(c.text),signals=[],seen=new Set(),issues=[];
 for(const clause of clauses){const hypo=HYPOTHETICAL.test(clause),neg=NEG.test(clause)&&!CONCEAL.test(clause)&&!CONTINUE.test(clause),uncertain=UNCERTAIN.test(clause)||CONCEAL.test(clause),old=HISTORICAL.test(clause)&&!PRESENT_THREAT.test(clause),third=aboutOthers(clause);
  for(const def of TYPES){if(!def.re.test(clause))continue;
   const key=def.id+'|'+clause;if(seen.has(key))continue;seen.add(key);
   // A cue worded as an absence ("친구가 없다") is not denied by its own "없"; look for a denial elsewhere.
   const denied=def.negWording?NEG.test(clause.replace(def.re,' '))&&!CONCEAL.test(clause)&&!CONTINUE.test(clause):neg;
   const polarity=hypo?'hypothetical':denied?'negated':uncertain?'unverified':'reported';
   signals.push({tag:def.id,items:def.items.slice(),label:def.label,polarity,subject:third?'third-party':'unconfirmed',source:who(clause),timeHint:old?'historical-mention':/(?:현재|지금|요즘|최근|오늘)/.test(clause)?'current-or-recent':'unconfirmed',safety:!!def.safety,clause:redact(clause).slice(0,180),action:def.ask,evidenceClass:'unverified_optional_free_text',humanConfirmationRequired:true});
  }
 }
 // A clause about another family member's harm stays that household cue; it is not also the student's own disclosure.
 const house=new Set(signals.filter(x=>x.tag==='householdHarm').map(x=>x.clause));
 for(let i=signals.length-1;i>=0;i--){const g=signals[i];if(['protection','sexualHarm'].includes(g.tag)&&house.has(g.clause)&&!STUDENT_SELF.test(g.clause))signals.splice(i,1);}
 const neglect=clauses.filter(cl=>!HYPOTHETICAL.test(cl)&&!HISTORICAL.test(cl)&&!REASSURE.test(cl)&&!aboutOthers(cl));
 const kinds=NEGLECT.map(rx=>neglect.find(cl=>rx.test(cl))).filter(Boolean);
 if(kinds.length>=2)signals.push({tag:'neglectPattern',items:[2,16,19],label:'방임 의심 생활 단서가 함께 나타남',polarity:'unverified',subject:'unconfirmed',source:'여러 문장',timeHint:'current-or-recent',safety:true,clause:kinds.map(x=>redact(x).slice(0,80)).join(' / ').slice(0,180),action:'의복·식사·위생·의료·보호자 부재가 겹치는지 단정하지 않고 확인하고, 방임이 의심되면 아동보호전문기관과 상의합니다.',evidenceClass:'unverified_optional_free_text',humanConfirmationRequired:true});
 const section=(rx,n=3)=>clauses.filter(x=>rx.test(x)&&!HYPOTHETICAL.test(x)&&!NEG.test(x)).slice(0,n).map(x=>redact(x).slice(0,230)).join(' / ');
 const fields={situation:redact(c.text).slice(0,400),observations:section(/(?:관찰|보았|기록|변화|확인|호소)/),studentWishes:section(WISH),strengths:section(STRENGTH),existingSupport:section(SUPPORT),urgentNeeds:section(URGENT)};
 const privacyWarnings=[];if(redact(c.text)!==c.text)privacyWarnings.push('연락처·식별번호·이메일과 같은 형식이 감지되어 표시할 때 일부 가렸습니다. 자동 익명화가 완전하다는 뜻은 아닙니다.');
 if(signals.some(s=>s.safety&&['reported','unverified'].includes(s.polarity)&&s.timeHint!=='historical-mention'&&s.subject!=='third-party'))issues.push({type:'safety-mention',message:'안전 관련 표현이 있습니다. 사실·현재 위험 여부를 담당자가 직접 확인하고 필요한 보호절차를 진행해야 합니다.'});
 if(signals.some(s=>s.safety&&s.timeHint==='historical-mention'))issues.push({type:'historical-safety',message:'과거 안전 사건은 현재 위험과 구분하되 현시점 안전 여부를 확인합니다.'});
 if(signals.some(s=>s.safety&&s.subject==='third-party'&&['reported','unverified'].includes(s.polarity)))issues.push({type:'third-party-safety',message:'다른 사람의 안전 관련 언급입니다. 학생 본인의 위험으로 옮기지 않되, 해당 인물의 안전은 별도 절차로 알리고 학생이 받은 영향도 확인합니다.'});
 if(signals.some(s=>s.polarity==='unverified'))issues.push({type:'uncertainty',message:'의심·추정·전언을 확인된 사실로 단정하지 않습니다.'});
 return {version:VERSION,hasContext:true,context:c,signals,issues,fields,clauses:clauses.map(x=>redact(x).slice(0,280)),privacyWarnings,source:'혼합·자유서술(출처는 문장별 추정)'};
}
function reconcile(answers,input){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('기존 25문항 0~4점 또는 미상이 필요합니다.');
 const x=infer(input),out={version:VERSION,hasContext:x.hasContext,signals:x.signals,issues:x.issues,fields:x.fields,privacyWarnings:x.privacyWarnings,alignment:[],mismatches:[],unknownCandidates:[],immediate:[],needsSafetyAttention:false,manualReviewRequired:false};
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
   if(positive.length)out.mismatches.push({tag:signal.tag,items:positive.map(z=>z.item),issue:'서술에는 부정 표현이 있지만 점수는 1점 이상입니다. 시점·사건·출처 차이를 확인하십시오.'});
  }
 }
 out.immediate=x.signals.map(immediateOf).filter(Boolean);
 out.needsSafetyAttention=x.signals.some(s=>s.safety&&(s.polarity==='reported'||s.polarity==='unverified')&&s.timeHint!=='historical-mention'&&s.subject!=='third-party');
 out.manualReviewRequired=out.needsSafetyAttention||out.mismatches.length>0||out.unknownCandidates.length>0;
 return out;
}
return Object.freeze({VERSION,LIMITS,TYPES,normalize,splitClauses,redact,infer,reconcile,aboutOthers,immediateOf});
});
