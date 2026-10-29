'use strict';
// 가상 서술 표현 은행 101문장(실제 사례 아님). 가상 1,200사례 연결성 점검(2026-10-29)에서 만든 기대값.
// kind: pos(학생 본인·현재) neg(부인) past(과거·종결) third(제3자) hypo(가정·조건·질문) str(강점) home(같은 집 다른 가족 피해: 판단 보류)
// exp: 기대 태그(하나라도 맞으면 탐지), safe: 안전 단서 기대, imm: 당일 즉시 기대
const P=(t,kind,exp=[],safe=false,imm=false)=>({t,kind,exp,safe,imm});
const BANK=[
// 자해·자살: 직접 인용·은어·완곡·띄어쓰기
P('"그냥 다 끝내고 싶어요"라고 함.','pos',['selfharm'],true),
P('사라지고 싶다는 말을 자주 함.','pos',['selfharm'],true),
P('극단적 선택을 생각해 봤다고 상담 중 말함.','pos',['selfharm'],true),
P('나쁜 생각이 자꾸 든다고 함.','pos',['selfharm','emotion'],true),
P('죽고싶다고 카톡 상태메시지에 적어 둠.','pos',['selfharm'],true),
P('자 해 한 흔적이 팔에 있음.','pos',['selfharm','selfharmCover','woundContext'],true),
P('커터칼로 허벅지를 긋는다고 말함.','pos',['selfharm'],true),
P('어제 밤에 손목을 그었다고 함.','pos',['selfharm'],true,true),
P('수면제를 모아 두고 있다고 친구에게 말함.','pos',['selfharm'],true,true),
P('엄마 약을 한꺼번에 먹으면 어떻게 되냐고 물음.','pos',['selfharm'],true),
P('다리 위에서 한참 내려다보고 있었다고 함.','pos',['fallRisk','selfharm'],true),
P('오늘 아침 학교 옥상 난간에 앉아 있었음.','pos',['fallRisk'],true,true),
P('내가 없어지면 다들 편할 거라고 함.','pos',['selfharm'],true),
P('유서를 써서 서랍에 넣어 뒀다고 함.','pos',['selfharm'],true,true),
P('자살각이라는 말을 장난처럼 반복함.','pos',['selfharm'],true),
P('체육복을 안 갈아입고 손목 보호대를 늘 차고 있음.','pos',['selfharmCover'],true),
P('살기 싫다고 일기장에 씀.','pos',['selfharm'],true),
// 학대·보호
P('아빠가 허리띠로 때린다고 함.','pos',['protection'],true),
P('어제 엄마에게 맞아 눈가에 멍이 있음.','pos',['protection','woundContext'],true,true),
P('새아빠가 밥을 안 준다고 함.','pos',['protection','basic'],true),
P('집에 가기 무섭다고 하교를 미룸.','pos',['protection','family'],true),
P('할머니가 목을 졸랐다고 함.','pos',['protection'],true,true),
P('부모가 며칠씩 집에 안 들어와 혼자 지낸다고 함.','pos',['protection','care','basic'],true),
P('아빠가 술 먹고 물건을 던진다고 함.','pos',['protection','family'],true),
P('엄마가 "너 같은 건 낳지 말았어야 했다"고 한다고 함.','pos',['protection','family'],true),
P('겨울인데 반팔 차림으로 등교하고 늘 배고프다고 함.','pos',['basic','protection','neglectPattern'],true),
P('아파도 병원에 데려가 주지 않는다고 함.','pos',['protection','basic'],true),
// 성적 위해·디지털
P('삼촌이 자꾸 이상한 데를 만진다고 함.','pos',['sexualHarm'],true,true),
P('학원 선생님이 단둘이 있을 때 껴안는다고 함.','pos',['sexualHarm'],true),
P('게임에서 만난 사람이 기프티콘을 주며 사진을 요구함.','pos',['onlineSexual','imageThreat'],true),
P('몸캠 영상을 퍼뜨리겠다는 협박 메시지를 받음.','pos',['imageThreat','onlineSexual'],true),
P('딥페이크 사진이 단톡방에 돌았다고 함.','pos',['imageThreat','onlineSexual','peer'],true),
P('랜덤채팅에서 만난 성인과 오늘 만나기로 했다고 함.','pos',['onlineSexual'],true,true),
P('남자친구가 휴대폰을 검사하고 때린다고 함.','pos',['peer','protection','datingViolence'],true),
// 가출·거처
P('사흘째 집에 안 들어가고 PC방에서 잔다고 함.','pos',['runaway'],true),
P('오늘 밤 잘 곳이 없다고 함.','pos',['runaway','basic'],true,true),
P('가출팸과 어울린다는 소문이 있음.','pos',['runaway'],true),
// 또래·학교폭력
P('단톡방에서 계속 저격당한다고 함.','pos',['peer'],false),
P('카톡 감옥에 갇혀 욕을 듣는다고 함.','pos',['peer'],false),
P('빵셔틀을 하고 돈을 뺏긴다고 함.','pos',['peer'],false),
P('선배들이 화장실로 불러 때렸다고 함.','pos',['peer'],false),
P('같은 반 친구를 칼로 찌르겠다고 말함.','pos',['behavior','harmThreat'],true,true),
P('가방에 접이식 칼을 넣고 다님.','pos',['behavior','harmThreat'],true,true),
// 정서·정신건강
P('밤에 잠을 거의 못 자고 수업 중 멍하게 있음.','pos',['emotion'],false),
P('누가 자기를 욕하는 목소리가 들린다고 함.','pos',['emotion','behavior'],false),
P('시험 기간마다 과호흡이 옴.','pos',['emotion'],false),
P('밥을 먹고 일부러 토한다고 함.','pos',['behavior','emotion'],false),
P('요즘 현타가 와서 아무것도 하기 싫다고 함.','pos',['emotion'],false),
P('엄마가 돌아가신 뒤로 말수가 크게 줄었음.','pos',['emotion','family'],false),
// 출결·학습
P('한 달 동안 지각 12번, 결석 5번.','pos',['attendance'],false),
P('아침에 배가 아프다며 자주 조퇴함.','pos',['attendance','behavior'],false),
P('학교에 오기 싫다며 등교를 거부함.','pos',['attendance'],false),
P('받아쓰기를 거의 못 하고 글 읽기를 피함.','pos',['learning'],false),
P('수업 내용을 따라가지 못해 포기했다고 함.','pos',['learning'],false),
// 행동·물질·도박
P('친구들과 술을 마시고 등교한 적이 있음.','pos',['behavior'],false),
P('전자담배를 피우다 적발됨.','pos',['behavior'],false),
P('불법 토토로 돈을 잃고 대리입금 빚이 있다고 함.','pos',['behavior','basic','digital'],false),
P('새벽까지 게임하느라 오전 수업을 못 들음.','pos',['digital'],false),
P('휴대폰을 뺏으면 물건을 부수고 소리를 지름.','pos',['digital','behavior'],false),
// 가족·돌봄
P('엄마가 우울증으로 누워 지내 집안일을 도맡음.','pos',['care','family'],false),
P('할머니 병간호 때문에 방과후에 바로 귀가함.','pos',['care'],false),
P('부모님 이혼 소송 중이라 집이 시끄럽다고 함.','pos',['family'],false),
P('아빠가 엄마를 때리는 걸 자주 본다고 함.','pos',['protection','family','householdHarm'],true),
// 경제·주거
P('반지하 집에 곰팡이가 심하고 비만 오면 물이 샌다고 함.','pos',['basic'],false),
P('전기가 끊겨 촛불을 켜고 지낸 적이 있다고 함.','pos',['basic'],false),
P('주말에는 끼니를 거른다고 함.','pos',['basic'],false),
P('고시원에서 엄마와 둘이 산다고 함.','pos',['basic'],false),
P('교복을 살 돈이 없어 사복을 입고 옴.','pos',['basic'],false),
// 접근성·이주배경
P('입국한 지 1년이라 한국어 수업을 따라가기 어려움.','pos',['learning'],false),
P('보청기가 고장 났는데 바꾸지 못하고 있음.','pos',['learning','basic'],false),
// 부정(부인)
P('자해한 적은 한 번도 없다고 함.','neg'),
P('죽고 싶은 생각은 들지 않는다고 함.','neg'),
P('집에서 맞은 적은 없다고 분명히 말함.','neg'),
P('누가 몸을 만진 적은 없다고 함.','neg'),
P('가출할 생각은 전혀 없다고 함.','neg'),
P('옥상에 간 건 바람 쐬러 간 것이고 위험한 생각은 없었다고 함.','neg'),
P('상처는 고양이에게 긁힌 것으로 확인됨.','neg'),
P('멍은 체육 시간에 넘어져 생긴 것으로 보건실 기록과 일치함.','neg'),
// 과거·종결
P('초등학교 때 자해를 했지만 지금은 하지 않음.','past'),
P('3년 전 아동학대 신고가 있었고 사례가 종결됨.','past'),
P('작년 여름 한 번 가출했다가 바로 돌아왔고 이후 없음.','past'),
P('예전에 죽고 싶다고 한 적이 있으나 요즘은 괜찮다고 함.','past'),
// 제3자
P('친구가 손목을 긋는다며 대신 걱정해 줌.','third'),
P('옆 반 학생이 아빠에게 맞는다는 이야기를 전해 줌.','third'),
P('사촌 언니가 가출했다고 함.','third'),
P('엄마가 자해를 해서 무섭다고 함.','third'),
P('같은 학원 친구가 몸캠 협박을 당했다고 알려 줌.','third'),
P('뉴스에서 본 자살 사건 이야기를 함.','third'),
// 가정·조건·질문
P('만약 집에서 맞으면 어디에 말해야 하냐고 물음.','hypo'),
P('자살하면 어떻게 되냐고 수업 시간에 질문함.','hypo',['selfharm'],false),
P('혹시 가출하게 되면 쉼터가 있냐고 물어봄.','hypo'),
// 같은 집 다른 가족 피해(판단 보류)
P('동생이 아빠에게 자주 맞는다고 함.','home'),
P('언니가 새아빠에게 성추행을 당했다고 함.','home'),
// 강점
P('그림 실력이 좋아 학급 게시판을 맡음.','str'),
P('축구부 코치와 사이가 좋고 믿고 의지함.','str'),
P('지역아동센터 선생님에게 고민을 잘 이야기함.','str'),
P('동생을 잘 챙기고 책임감이 강함.','str')
];
module.exports={BANK};
