/* OY-RALS 06 척도 자료실 v1: 청소년 심리·학업 관련 공개 척도의 개요와 공식 배포처 내려받기.
   - 양식 파일은 공식 배포처에서 받는다. 대부분의 척도는 저작권자 허가 없이 다른 곳에 올려 재배포할 수 없기 때문이다.
     이 사이트가 직접 올려 두는 파일은 OY-RALS 자체 양식뿐이다.
   - 5단계 흐름과 별개인 참고 화면이라 평가 완료 전에도 열 수 있고, 점수·판정·흐름 상태를 건드리지 않는다.
   - 라이선스·주소는 CHECKED 날짜 기준이며 바뀔 수 있으므로 사용 전 배포처에서 다시 확인한다. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.1.0-20261028';
const CHECKED='2026-10-28';
/* 내려받기 방식: own = 이 사이트의 자체 양식, official = 공식 배포처에서 무료로 받음, request = 무료지만 요청·가입·허가 필요, restricted = 공개 배포 안 됨(안내만). */
const ACCESS={own:'이 사이트 양식',official:'공식 배포처 무료',request:'요청·가입 후 이용',restricted:'공개 배포 안 됨'};
const LEVELS=[['e','초'],['m','중'],['h','고']];
const GROUPS=[
 ['mood','정서·정신건강','우울·불안·전반적 어려움과 안녕감'],
 ['safety','자살·안전','자살 관련 생각과 행동의 선별'],
 ['behavior','물질·디지털','음주·약물 사용과 스마트폰 과의존'],
 ['trauma','외상·섭식','큰 사건 뒤의 반응과 섭식 문제의 선별'],
 ['care','가족돌봄','학생이 맡은 돌봄의 양과 그 영향'],
 ['strength','자아·강점','자아존중감과 보호요인'],
 ['learning','학습·학업성취','기초학력 진단과 교과 성취'],
 ['panel','조사·연구용 척도','국가 패널조사 설문지의 척도 문항'],
 ['limited','공개되지 않는 검사','학교·전문기관에서만 쓰는 검사(안내만)']
];
/* 척도 목록. 문항 수·채점·기준점은 배포처 설명서 기준 요약이며, 실제 사용 때는 원 설명서를 따른다. */
const SCALES=[
 {id:'oyrals',group:'mood',name:'OY-RALS 25문항 평가양식',short:'이 시스템의 빈 평가양식',levels:['e','m','h'],access:'own',
  purpose:'10개 생활영역 25문항을 0~4점과 미상으로 기록하는 OY-RALS 자체 양식입니다. 면담 전 출력해 손으로 적은 뒤 01 화면에 옮겨 입력합니다.',
  who:'교사·교육복지사·사회복지사가 학생을 관찰·면담한 뒤 작성',items:'25문항 · 0~4점 · 미상',time:'10~15분',
  scoring:'문항별 0~4점, 미상은 0점이 아닙니다. 판정은 01 화면의 CORE 규칙으로만 냅니다.',
  link:'25문항 전체(10개 영역)',caution:'비표준화 현장 검토 도구입니다. 진단·법적 판정·서비스 선정의 근거가 아닙니다.',
  license:'오산세교종합사회복지관 OY-RALS 자체 양식(사이트 저작권 안내를 따름).',
  files:[{label:'빈 평가양식 내려받기 (HTML · 인쇄·PDF 저장)',url:'oy-rals-blank-form.html',download:'OY-RALS_25문항_평가양식.html'}],
  origin:{from:'국내',kr:'OY-RALS 자체 양식입니다.',read:'비표준화 도구라 기준점이 없고, 판정은 01 화면 CORE 규칙만 따릅니다.'},
  source:'OY-RALS 통합개발(2026).'},
 {id:'phq',group:'mood',name:'PHQ-9 / PHQ-A (환자건강질문지 우울)',short:'지난 2주 우울 증상 선별',levels:['m','h'],access:'official',
  purpose:'지난 2주 동안의 우울 증상 9가지를 학생이 직접 답합니다. PHQ-A는 만 11~17세에 맞춰 문구를 고친 판입니다.',
  who:'학생 자기보고(중·고등학생)',items:'9문항 · 0~3점(전혀 아님~거의 매일)',time:'약 3분',
  scoring:'총점 0~27점. 5·10·15·20점을 경미·중간·중간 이상·심함의 기준으로 씁니다. 9번(죽음·자해 생각)에 1점 이상이면 총점과 관계없이 당일 안전 면담을 합니다.',
  link:'영역 3 자해·정서·정신건강(6·7·8번)',caution:'선별 도구이며 진단이 아닙니다. 한국어판 기준점은 연구마다 다르므로 해석은 면담과 함께 합니다.',
  license:'Pfizer 제공. 배포처 안내: 복제·번역·게시·배포에 별도 허가가 필요 없음.',
  files:[{label:'공식 배포처(PHQ Screeners)에서 언어 Korean 선택',url:'https://www.phqscreeners.com/'}],
  origin:{from:'미국',kr:'한국어판 타당화 연구가 있으나 청소년 기준점은 연구마다 다릅니다.',read:'원판 기준(5·10·15·20점)은 미국 성인 표본에서 나왔습니다. 한국 청소년에게는 기준점을 참고로만 쓰고, 9번 응답과 재평가 때의 변화를 함께 봅니다.'},
  source:'Kroenke, Spitzer & Williams (2001); Johnson et al. (2002) PHQ-A.'},
 {id:'gad7',group:'mood',name:'GAD-7 (범불안장애 척도)',short:'지난 2주 불안 증상 선별',levels:['m','h'],access:'official',
  purpose:'지난 2주 동안의 걱정·긴장·안절부절못함 등 불안 증상 7가지를 묻습니다.',
  who:'학생 자기보고(중·고등학생)',items:'7문항 · 0~3점',time:'약 2분',
  scoring:'총점 0~21점. 5·10·15점을 경미·중간·심함의 기준으로 씁니다.',
  link:'영역 3 정서(6·8번)',caution:'청소년 기준점은 연구마다 다릅니다. 수면·학업 스트레스와 함께 봅니다.',
  license:'Pfizer 제공. 배포처 안내: 복제·번역·게시·배포에 별도 허가가 필요 없음.',
  files:[{label:'공식 배포처(PHQ Screeners)에서 GAD-7 · Korean 선택',url:'https://www.phqscreeners.com/'}],
  origin:{from:'미국',kr:'한국어판 타당화 연구가 있으나 청소년 기준점은 연구마다 다릅니다.',read:'원판 기준(5·10·15점)은 미국 성인 표본에서 나왔습니다. 한국 청소년에게는 참고 기준으로만 쓰고 면담으로 확인합니다.'},
  source:'Spitzer et al. (2006).'},
 {id:'rcads',group:'mood',name:'RCADS / RCADS-25 (아동·청소년 불안우울 척도)',short:'불안 하위유형과 우울을 함께 보는 척도',levels:['e','m','h'],access:'official',
  purpose:'분리불안·사회불안·범불안·공황·강박과 우울을 하위척도로 나눠 봅니다. 25문항 단축판(불안 15·우울 10)도 있습니다.',
  who:'학생 자기보고와 보호자 보고판(만 8~18세, 3~12학년)',items:'47문항(단축판 25문항) · 0~3점(전혀~항상)',time:'10~15분(단축판 5분)',
  scoring:'하위척도별 원점수와 영어판 규준 T점수. 비영어판은 규준이 없어 원점수로 봅니다.',
  link:'영역 3 정서, 영역 9 관계(사회불안)',caution:'한국어 번역본 여부와 규준은 배포처 언어 목록에서 확인합니다.',
  license:'UCLA Child FIRST가 유일한 공식 배포처. 무료 이용 가능하나 영구 무료를 보장하지 않으며, 수정·번역·재배포는 RCADS 팀 허가가 필요.',
  files:[{label:'공식 배포처(UCLA RCADS)',url:'https://rcads.ucla.edu/'}],
  origin:{from:'미국',kr:'한국 규준이 없습니다.',read:'T점수는 미국 규준이라 한국 학생에게 그대로 쓰지 않습니다. 원점수와 하위척도 간 차이, 재평가 때의 변화로 읽습니다.'},
  source:'Chorpita et al. (2000); Spence (1997).'},
 {id:'sdq',group:'mood',name:'SDQ 한국어판 (강점·난점 설문지)',short:'정서·행동·또래·과잉행동과 친사회성',levels:['e','m','h'],access:'official',
  purpose:'정서 증상, 행동 문제, 과잉행동·부주의, 또래 문제의 네 가지 어려움과 친사회적 행동(강점)을 함께 봅니다.',
  who:'보호자·교사 보고(만 4~17세), 학생 자기보고(만 11~17세)',items:'25문항 · 0~2점(아니다·다소 그렇다·확실히 그렇다)',time:'약 5분',
  scoring:'어려움 총점 0~40점(친사회성 제외). 하위척도별 점수와 영향 설문(추가판)으로 생활 지장 정도를 봅니다.',
  link:'영역 3 정서, 영역 5 행동, 영역 9 관계',caution:'보호자·교사·학생 응답이 다를 수 있어 정보원을 나눠 기록합니다.',
  license:'Youthinmind 저작권. 비상업적 용도로 배포처에서 무료로 받아 종이로 복사해 쓸 수 있으나, 수정본·전자판을 만들거나 다른 곳에서 배포할 수 없음.',
  files:[{label:'공식 배포처(sdqinfo.org) 내려받기 목록에서 Korean 선택',url:'https://www.sdqinfo.org/py/sdqinfo/b0.py'}],
  origin:{from:'영국',kr:'한국판 타당화 연구(보호자판·자기보고판)가 있습니다.',read:'영국 기준 구간은 한국 연구의 기준과 다를 수 있습니다. 한국판 연구의 기준을 참고하고, 보호자·교사·학생 응답을 나눠 읽습니다.'},
  source:'Goodman (1997).'},
 {id:'who5',group:'mood',name:'WHO-5 안녕감 지수',short:'지난 2주 마음의 안녕',levels:['m','h'],access:'official',
  purpose:'즐거움·편안함·활력·개운함·흥미의 다섯 가지 긍정적 상태를 묻습니다. 어려움보다 안녕을 묻는 짧은 척도라 첫 면담에서 부담이 적습니다.',
  who:'학생 자기보고',items:'5문항 · 0~5점',time:'약 1분',
  scoring:'원점수 0~25점 × 4 = 0~100점. 50점 미만(원점수 13점 미만)이면 우울 등 정신건강 상태를 더 확인하라는 신호로 씁니다.',
  link:'강점 읽기, 영역 3 정서',caution:'청소년 기준점은 연구마다 다릅니다. 한국어판은 배포처 번역 목록에서 확인합니다.',
  license:'WHO, CC BY-NC-SA 3.0 IGO(비영리 복사·배포·변경 가능, 출처 표시, 같은 조건으로 공유).',
  files:[{label:'WHO 원문 양식(PDF)',url:'https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf'}],
  origin:{from:'덴마크(WHO 국제판)',kr:'한국어판 연구는 주로 성인 표본입니다.',read:'50점 기준은 국제 성인 기준입니다. 청소년에게는 첫 면담의 대화 출발점과 변화 추적용으로 씁니다.'},
  source:'World Health Organization (2024). The WHO-Five Well-Being Index (WHO-5).'},
 {id:'mhportal',group:'mood',name:'국가정신건강정보포털 자가검진',short:'공공 온라인 자가검진 모음',levels:['m','h'],access:'official',
  purpose:'우울·불안·스트레스 등 공공기관이 제공하는 온라인 자가검진입니다. 학생이 스스로 해 보고 결과를 면담에서 함께 이야기하는 용도로 씁니다.',
  who:'학생 본인(온라인)',items:'검사별로 다름',time:'검사별 3~10분',
  scoring:'검사 화면의 안내 기준을 따릅니다.',link:'영역 3 정서',caution:'결과는 학생 기기에만 표시됩니다. 학생이 원할 때만 공유받습니다.',
  license:'국립정신건강센터 운영 공공 서비스(온라인 이용).',
  files:[{label:'국가정신건강정보포털',url:'https://www.mentalhealth.go.kr/'}],
  origin:{from:'국내',kr:'국내 공공 자가검진입니다.',read:'검사 화면의 국내 기준을 따릅니다.'},
  source:'국립정신건강센터.'},
 {id:'asq',group:'safety',name:'ASQ (자살위험 선별 질문)',short:'20초 자살위험 선별 4문항',levels:['e','m','h'],access:'official',
  purpose:'최근 죽고 싶었던 생각, 가족에게 짐이 된다는 생각, 자살 생각, 과거 시도를 예/아니오로 묻습니다.',
  who:'담당자가 학생에게 직접 질문(만 8세 이상)',items:'4문항 예/아니오 + 현재 생각 1문항',time:'약 20초',
  scoring:'하나라도 “예”면 선별 양성으로 보고 같은 날 짧은 안전 평가로 이어 갑니다. 5번(지금 생각)에 “예”면 즉시 안전 조치를 합니다.',
  link:'영역 3 안전(7번), CORE 안전 문항',caution:'만 8세 미만은 검증되지 않았습니다. 양성 결과는 진단이 아니라 바로 안전 면담을 하라는 뜻입니다.',
  license:'미국 국립정신건강연구소(NIMH) 제공 무료 도구(한국어판 포함 23개 언어).',
  files:[{label:'NIMH ASQ 도구 모음(언어 Korean)',url:'https://www.nimh.nih.gov/ASQ'}],
  origin:{from:'미국',kr:'NIMH가 한국어 번역본을 제공합니다. 한국 청소년 표본 검증은 확인하지 못했습니다.',read:'예/아니오 선별이라 기준점 차이는 없지만, 번역 문구가 학생에게 자연스러운지 확인하며 묻습니다. 양성이면 같은 날 안전 면담을 합니다.'},
  source:'Horowitz et al. (2012); NIMH ASQ Toolkit.'},
 {id:'cssrs',group:'safety',name:'C-SSRS 선별판 (컬럼비아 자살 심각도 평정척도)',short:'자살 생각·행동의 심각도 단계',levels:['m','h'],access:'request',
  purpose:'죽고 싶은 바람, 구체적 생각, 방법·의도·계획, 최근 행동을 단계별로 묻습니다. 응답 단계에 따라 대응 수준을 나눕니다.',
  who:'담당자 면담(학교판·소아판 있음)',items:'선별판 6문항 내외 예/아니오',time:'약 5분',
  scoring:'단계가 올라갈수록(계획·의도·최근 행동) 즉시 대응 수준이 높아집니다. 기관 대응 절차와 연결해 씁니다.',
  link:'영역 3 안전(7번)',caution:'짧은 교육 영상 시청 후 쓰는 것을 권합니다. 한국어판은 배포처 번역 목록과 요청 절차를 따릅니다.',
  license:'Columbia Lighthouse Project. 한국어판 있음. 전체판은 배포처에 요청, 선별판 번역본은 배포처 안내 경로에서 받음.',
  files:[{label:'공식 배포처 번역본 안내',url:'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/translations/'}],
  origin:{from:'미국',kr:'한국어판이 있습니다(배포처 번역 목록).',read:'단계 판단은 원판 기준을 따르되, 대응 수준은 학교·기관의 위기 대응 절차에 맞춥니다.'},
  source:'Posner et al. (2011).'},
 {id:'crafft',group:'behavior',name:'CRAFFT 2.1 한국어판 (청소년 물질사용 선별)',short:'음주·약물 사용 위험 선별',levels:['m','h'],access:'official',
  purpose:'지난 12개월의 음주·대마·기타 물질 사용 일수(A)와, 차량·혼자 사용·잊어버림·가족 걱정·문제 상황 등 6가지(B)를 묻습니다.',
  who:'학생 자기기입 또는 담당자 면담(만 12~21세)',items:'A 3문항 + B 6문항 예/아니오',time:'약 2분',
  scoring:'B에서 “예”가 2개 이상이면 고위험으로 보고 면담과 전문기관 연계를 검토합니다. 차량(Car) 문항은 사용 여부와 관계없이 모두에게 묻습니다.',
  link:'영역 5 행동·건강(13번)',caution:'비밀보장 범위를 먼저 설명하고 학생이 혼자 답하게 합니다.',
  license:'© John R. Knight, MD, Boston Children\'s Hospital. 배포처에서 무료로 받아 원문 그대로 사용. 다른 곳에 재배포하려면 배포처 허가 필요.',
  files:[{label:'자기기입식 2.1 한국어 (PDF)',url:'https://crafft.org/wp-content/uploads/2021/07/KOREAN_2.1_SELF_2021-07.pdf'},
   {label:'면담용 2.1 한국어 (PDF)',url:'https://crafft.org/wp-content/uploads/2021/07/KOREAN_2.1_CLINICIAN_2021-07.pdf'},
   {label:'자기기입식 2.1+N(니코틴 포함) 한국어 (PDF)',url:'https://crafft.org/wp-content/uploads/2021/07/KOREAN_2.1N_SELF_2021-07.pdf'},
   {label:'면담용 2.1+N 한국어 (PDF)',url:'https://crafft.org/wp-content/uploads/2021/07/KOREAN_2.1N_CLINICIAN_2021-07.pdf'}],
  origin:{from:'미국',kr:'배포처가 한국어 번역본을 제공합니다. 한국 청소년 기준점 연구는 확인하지 못했습니다.',read:'2점 이상 고위험 기준은 미국 청소년 기준입니다. 한국의 음주·흡연 연령 제한과 학교 규정이 다르므로 점수보다 실제 사용 빈도와 생활 영향을 면담으로 확인합니다.'},
  source:'Knight et al. (1999); CRAFFT 2.1 (2021).'},
 {id:'smart',group:'behavior',name:'스마트폰 과의존 척도 (청소년 자기보고)',short:'조절 실패·현저성·문제적 결과',levels:['e','m','h'],access:'official',
  purpose:'스마트폰 이용을 스스로 조절하기 어려운지, 생활의 중심이 되었는지, 그 때문에 문제가 생겼는지를 봅니다.',
  who:'학생 자기보고(청소년판), 유아동판은 보호자 관찰',items:'10문항 · 1~4점',time:'약 3분',
  scoring:'총점 10~40점. 청소년은 31점 이상 고위험, 23~30점 잠재적 위험으로 안내됩니다.',
  link:'영역 10 디지털·온라인 안전(24번)',caution:'기준점은 배포처의 최신 안내를 확인합니다. 사용 시간보다 생활 지장과 함께 봅니다.',
  license:'과학기술정보통신부·한국지능정보사회진흥원(스마트쉼센터) 공공 척도.',
  files:[{label:'스마트쉼센터(자가진단·상담)',url:'https://www.iapc.or.kr/'}],
  origin:{from:'국내',kr:'국내 개발·표준화 척도입니다.',read:'배포처의 국내 기준점(고위험·잠재적 위험)을 그대로 씁니다.'},
  source:'한국정보화진흥원 (2016). 스마트폰 과의존 척도.'},
 {id:'rses',group:'strength',name:'Rosenberg 자아존중감 척도 (RSES)',short:'자기 가치에 대한 전반적 느낌',levels:['m','h'],access:'official',
  purpose:'자신을 가치 있게 여기는 정도를 10문항으로 봅니다. 강점·보호요인을 찾는 면담의 출발점으로 씁니다.',
  who:'학생 자기보고',items:'10문항 · 4점(매우 그렇다~전혀 아니다), 역문항 5개',time:'약 3분',
  scoring:'0~30점(또는 10~40점). 점수가 높을수록 자아존중감이 높습니다. 공식 기준점은 없습니다.',
  link:'강점 읽기, 영역 9 관계',caution:'한국어 번역본은 연구마다 문구가 조금씩 다릅니다. 같은 번역본으로 재평가합니다.',
  license:'메릴랜드대 사회학과 안내: 비용·통보 없이 사용 가능, 번역·각색 허용(학술적 출처 표기).',
  files:[{label:'메릴랜드대 원문 안내',url:'https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale'}],
  origin:{from:'미국',kr:'한국어 번역본이 여럿 있습니다.',read:'공식 기준점이 없어 국가 차이보다 번역본 차이가 중요합니다. 같은 번역본으로 사전·사후를 비교합니다.'},
  source:'Rosenberg (1965). Society and the Adolescent Self-Image.'},
 {id:'scared',group:'mood',name:'SCARED (아동·청소년 불안 관련 장애 선별척도)',short:'분리불안·사회불안·학교회피 등 불안 선별',levels:['e','m','h'],access:'official',
  purpose:'공황·신체증상, 범불안, 분리불안, 사회불안, 학교회피의 다섯 가지 불안을 하위척도로 봅니다. 아침 복통·두통을 동반한 등교 거부처럼 불안이 몸과 출결로 드러날 때 쓰기 좋습니다.',
  who:'학생 자기보고와 보호자 보고판(만 8~18세)',items:'41문항 · 0~2점(거의 그렇지 않다~자주 그렇다)',time:'약 10분',
  scoring:'원판 기준: 총점 25점 이상이면 불안장애 가능성(30점 초과는 더 특이적), 하위척도 공황·신체 7·범불안 9·분리불안 5·사회불안 8·학교회피 3점 이상.',
  link:'영역 3 정서(6·8번), 영역 4 출결(9번)',caution:'선별 도구이며 진단이 아닙니다. 학생과 보호자 응답을 나눠 기록합니다.',
  license:'피츠버그대 배포처 안내: 비용 없이 이용 가능.',
  files:[{label:'아동용 원판 (피츠버그대 PDF)',url:'https://pediatricbipolar.pitt.edu/sites/default/files/assets/SCAREDChildVersion_1.19.18.pdf'},{label:'보호자용 원판 (피츠버그대 PDF)',url:'https://pre.pediatricbipolar.pitt.edu/sites/default/files/assets/SCAREDParentVersion_1.19.18_0.pdf'},{label:'한국판 타당화 논문 (BMC Psychiatry 2020)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7049176'}],
  origin:{from:'미국',kr:'한국판 타당화 연구 있음(Shin 등, 2020, 만 12~17세 임상·일반 표본). 이 연구는 한국 기준점을 따로 내지 않았습니다.',read:'원판 기준점은 미국 표본에서 나왔습니다. 한국 학생에게는 기준점을 넘었는지보다 하위척도 중 어느 쪽이 높은지와 재평가 때의 변화로 읽고, 면담으로 확인합니다.'},
  source:'Birmaher et al. (1997, 1999); Shin et al. (2020) BMC Psychiatry 20:89.'},
 {id:'cries',group:'trauma',name:'CRIES-8 (아동용 사건 충격 척도 개정판)',short:'큰 사건 뒤 침습·회피 반응 선별',levels:['e','m','h'],access:'request',
  purpose:'학대·폭력·사고·학교폭력 피해 같은 큰 사건 뒤에 그 일이 떠오르는 침습 반응과, 떠올리지 않으려는 회피 반응을 봅니다.',
  who:'학생 자기보고(만 8세 이상)',items:'8문항(침습 4·회피 4), 13문항판도 있음',time:'약 3분',
  scoring:'배포처 설명서의 기준점을 따릅니다. 점수가 높으면 외상 전문 평가로 연계합니다.',
  link:'영역 1 아동학대·보호, 영역 2 또래 안전, 영역 3 정서',caution:'안전이 확보된 뒤에 씁니다. 사건을 자세히 캐묻는 도구가 아니며, 사건 조사 면담과 섞지 않습니다.',
  license:'Children and War Foundation 배포. 비영리 교육·실무 목적 무료, 내려받으려면 배포처 회원 가입 필요.',
  files:[{label:'배포처(Children and War Foundation · ForChildren)',url:'https://www.forchildren.com/discover/child-protection/trauma-screening-tool-ages-8-and-older'},{label:'한국판 타당화 논문 (2014)',url:'https://scholar.kyobobook.co.kr/article/detail/4010025855770'}],
  origin:{from:'영국·노르웨이(Children and War Foundation)',kr:'한국판 타당화 연구 있음(2014, 임상·학교 표본).',read:'원판 기준점과 한국판 연구의 기준점이 다를 수 있습니다. 어느 판(8문항·13문항)을 썼는지 기록하고, 한국판 연구의 기준을 우선 참고합니다.'},
  source:'Perrin, Meiser-Stedman & Smith (2005); Children and War Foundation.'},
 {id:'scoff',group:'trauma',name:'SCOFF (섭식 문제 선별 5문항)',short:'구토·통제 상실·체중 변화 등 섭식 문제 선별',levels:['m','h'],access:'official',
  purpose:'일부러 토하는지, 먹는 양을 조절하지 못한다고 느끼는지, 석 달 안에 체중이 많이 줄었는지, 남이 말라 보인다는데 스스로는 뚱뚱하다고 느끼는지, 음식이 생활을 지배하는지를 예/아니오로 묻습니다.',
  who:'학생 자기보고 또는 담당자 질문',items:'5문항 · 예/아니오',time:'약 1분',
  scoring:'“예” 1개에 1점, 2점 이상이면 섭식 문제 가능성으로 보고 의료 평가(체중·활력징후)를 연결합니다.',
  link:'영역 3 정서, 영역 5 행동·건강(13번)',caution:'원판 문항의 체중 기준(영국 단위)은 한국판 문구를 씁니다. 구토·급격한 체중 감소는 점수와 관계없이 의료 확인을 먼저 합니다.',
  license:'원 논문(BMJ 1999)에 공개된 짧은 선별 문항으로 임상에서 널리 쓰임. 한국판 문구는 한국판 논문을 따름.',
  files:[{label:'원 논문 (BMJ 1999, PMC 전문)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC28290'},{label:'한국판 타당화 논문 (한국심리학회지 2025)',url:'https://www.accesson.kr/kpageneral/v.44/3/199/57303'}],
  origin:{from:'영국',kr:'한국판 타당화 연구 있음(박은서 등, 2025). 다만 표본이 20대 초반 여자 대학생이라 청소년 표본으로는 검증되지 않았습니다.',read:'한국판 연구도 원판과 같은 2점 기준이 맞다고 보고했으나 청소년 표본이 아닙니다. 중·고등학생에게는 선별 양성 여부보다 구토·체중 변화 같은 실제 행동을 면담·의료 평가로 확인합니다.'},
  source:'Morgan, Reid & Lacey (1999) BMJ 319:1467; 박은서·전준하·조영일 (2025) 한국심리학회지: 일반 44(3).'},
 {id:'maca',group:'care',name:'MACA-YC18 · PANOC-YC20 (가족돌봄 아동·청소년 척도)',short:'학생이 맡은 돌봄의 양과 그 영향',levels:['e','m','h'],access:'official',
  purpose:'MACA-YC18은 집안일·개인 돌봄·정서 돌봄·동생 돌봄 등 학생이 맡은 돌봄 활동의 양을, PANOC-YC20은 돌봄이 학생에게 준 긍정적·부정적 영향을 봅니다.',
  who:'학생 자기보고(원 연구 만 7~22세)',items:'MACA 18문항 · 0~2점 / PANOC 20문항',time:'각 약 5분',
  scoring:'MACA 총점 0~36점으로 돌봄 양을 낮음~매우 높음으로 나눕니다(설명서 기준). PANOC는 긍정·부정 하위점수를 따로 봅니다.',
  link:'영역 7 가족·돌봄(18번), 영역 4 출결·학습',caution:'돌봄을 그만두라고 설득하는 도구가 아니라, 성인 대체 돌봄과 학생 부담을 나눌 서비스를 찾는 출발점으로 씁니다.',
  license:'설명서 안내: 배포처에서 무료로 내려받아 소속기관 안에서 개별 사정·임상용으로 복사해 쓸 수 있음. 다른 기관 배포와 연구·조사용 복제는 저자 서면 허가 필요.',
  files:[{label:'설명서·척도 (서식스대 PDF)',url:'https://www.sussex.ac.uk/about/documents/young-carers-outcomes-manual-april.pdf'},{label:'배포처 안내 (Carers Trust)',url:'https://carers.org/resources/all-resources/101-manual-for-measures-of-caring-activities-and-outcomes-for-children-and-young-people'}],
  origin:{from:'영국',kr:'공식 한국어판과 한국 표본 연구를 확인하지 못했습니다. 번역해 쓰려면 저자 허가가 필요합니다.',read:'영국 돌봄 제도를 전제로 만든 문항이 있습니다. 한국에서는 점수 구간보다 학생이 실제로 맡은 일과 주당 시간을 확인하는 면담 길잡이로 씁니다.'},
  source:'Joseph, Becker & Becker (2012). Manual for Measures of Caring Activities and Outcomes for Children and Young People (2nd ed.).'},
 {id:'cyrm',group:'strength',name:'CYRM-R (아동·청소년 회복탄력성 척도)',short:'개인·관계·지역의 회복 자원',levels:['e','m','h'],access:'request',
  purpose:'학생 개인의 힘과, 보호자·또래·학교·지역에서 받는 지지를 함께 봅니다. 점수가 0점인 영역을 강점으로 짐작하지 않고, 실제 보호요인을 학생에게 직접 묻는 도구입니다.',
  who:'학생 자기보고(아동판 만 5~9세, 청소년판 만 10~23세)',items:'17문항 · 3점 또는 5점',time:'약 5분',
  scoring:'개인·관계 하위점수와 총점. 점수가 높을수록 회복 자원이 많습니다. 공식 기준점은 없습니다.',
  link:'강점 읽기, 영역 9 관계·지지(22·23번)',caution:'강점 확인용이며 위험을 낮추는 근거로 쓰지 않습니다. 안전 신호가 있으면 안전 확인을 먼저 합니다.',
  license:'Resilience Research Centre: 실무자·연구자 무료, 짧은 이용 설문 뒤 내려받기.',
  files:[{label:'공식 배포처(Resilience Research Centre)',url:'https://resilienceresearch.org/home-cyrm/'}],
  origin:{from:'캐나다',kr:'배포처 번역 목록에서 한국어판을 확인하지 못했습니다. 번역해 쓰려면 배포처에 문의합니다.',read:'기준점이 없는 척도라 국가 차이에 따른 오해는 적지만, 문항의 지역·문화 표현이 한국 학교와 맞는지 확인합니다. 같은 번역본으로 사전·사후를 비교합니다.'},
  source:'Jefferies, McGarrigle & Ungar (2019); Resilience Research Centre, Dalhousie University.'},
 {id:'basic',group:'learning',name:'기초학력 진단검사 (국가기초학력지원포털)',short:'읽기·쓰기·셈과 교과 기초학력 진단',levels:['e','m','h'],access:'request',
  purpose:'초1~2 읽기·쓰기·셈(3R)과 초3 이상 교과(국어·수학·영어 등) 기초학력을 진단하고, 결과에 맞는 보정학습 자료를 연결합니다. 2026년 3월 국가기초학력지원포털로 통합되었습니다.',
  who:'교사가 실시(온라인 또는 검사지 내려받아 지필)',items:'학년·교과별로 다름',time:'교과별 1교시 내외',
  scoring:'포털의 성취 기준에 따라 도달·미도달과 보정 영역을 안내합니다.',
  link:'영역 4 학습·출결(10번)',caution:'교사 계정으로 이용합니다. 복지기관은 학교를 통해 결과를 공유받습니다(보호자·학생 동의).',
  license:'교육부 운영 공공 서비스(교사·학생 가입 이용).',
  files:[{label:'교육부 누리집 (포털은 학교 교사 계정 안내에 따라 접속)',url:'https://www.moe.go.kr/'}],
  origin:{from:'국내',kr:'국내 공공 진단검사입니다.',read:'포털의 국내 성취 기준을 따릅니다.'},
  source:'교육부 (2026). 국가기초학력지원포털 개통.'},
 {id:'kice',group:'learning',name:'맞춤형 학업성취도 자율평가',short:'교과 성취 수준과 학습 정서',levels:['e','m','h'],access:'request',
  purpose:'희망 학교가 참여해 교과 성취 수준과 학습 관련 정서(학습 의욕·자신감 등) 설문을 함께 받습니다.',
  who:'학교 단위 참여(교사 계정)',items:'교과·학년별로 다름',time:'교과별 1교시 내외',
  scoring:'성취 수준과 정의적 특성 결과표를 학교에 제공합니다.',
  link:'영역 4 학습·출결(10·11번)',caution:'시행 학년·교과는 해마다 시행계획을 확인합니다.',
  license:'교육부·한국교육과정평가원 공공 서비스(학교 참여).',
  files:[{label:'한국교육과정평가원 (학교 참여 안내)',url:'https://www.kice.re.kr/'}],
  origin:{from:'국내',kr:'국내 공공 평가입니다.',read:'결과표의 국내 성취 기준을 따릅니다.'},
  source:'교육부·한국교육과정평가원.'},
 {id:'kcyps',group:'panel',name:'한국아동·청소년패널조사(KCYPS) 설문지',short:'자아존중감·학업열의·우울 등 척도 모음',levels:['e','m','h'],access:'request',
  purpose:'국가 패널조사에 쓰인 아동·청소년 척도(자아존중감, 학업열의, 우울, 공격성, 또래관계, 진로 등)의 문항과 출처를 확인할 수 있습니다.',
  who:'연구·사업 평가용 참고',items:'척도별로 다름',time:'—',
  scoring:'설문지와 코드북에 척도별 채점 방법이 있습니다.',link:'사업 사전·사후 평가 지표 선택',caution:'각 척도의 원저작권은 원 개발자에게 있습니다. 사업 평가에 쓸 때 원 출처를 함께 표기합니다.',
  license:'한국청소년정책연구원 공개 자료(이용 약관에 따라 가입 후 내려받기).',
  files:[{label:'한국청소년정책연구원',url:'https://www.nypi.re.kr/'},{label:'한국사회과학자료원(KOSSDA) KCYPS 자료 (회원 이용)',url:'https://kossda.snu.ac.kr/handle/20.500.12236/23701'}],
  origin:{from:'국내',kr:'국내 패널조사 설문입니다(개별 척도는 외국 원척도의 번역본이 섞여 있음).',read:'척도마다 원 개발국이 다르므로 원 출처를 확인하고, 패널조사의 국내 평균과 비교해 읽습니다.'},
  source:'한국청소년정책연구원. 한국아동·청소년패널조사.'},
 {id:'cpsq',group:'limited',name:'학생정서·행동특성검사 (CPSQ-II · AMPQ-III)',short:'학교에서 실시하는 정서·행동 선별',levels:['e','m','h'],access:'restricted',
  purpose:'초1·초4·중1·고1 학생을 대상으로 학교에서 실시하는 정서·행동 선별검사입니다.',
  who:'학교(보호자·학생 응답)',items:'학교급별로 다름',time:'—',
  scoring:'학교가 결과에 따라 관심군 관리와 전문기관 연계를 진행합니다.',link:'영역 3 정서, 영역 4 학교생활',
  caution:'검사지는 공개 배포되지 않습니다. 결과는 학교를 통해 보호자 동의 범위에서만 확인합니다.',
  license:'교육부 학교 실시 전용. 공개 배포 안 됨.',files:[],origin:{from:'국내',kr:'국내 학교 선별검사입니다.',read:'학교가 받은 국내 기준 결과를 따릅니다.'},
  source:'교육부 학생정서·행동특성검사.'},
 {id:'aseba',group:'limited',name:'K-CBCL · K-YSR · CDI 등 표준화 검사',short:'유료·자격이 필요한 임상 검사',levels:['e','m','h'],access:'restricted',
  purpose:'아동·청소년 행동평가척도(K-CBCL/K-YSR), 아동우울척도(CDI) 등은 표준화 규준이 있는 임상 검사입니다.',
  who:'자격을 갖춘 전문가',items:'검사별로 다름',time:'—',
  scoring:'판매처의 채점 프로그램과 규준으로 해석합니다.',link:'전문기관 의뢰 시 결과 공유',
  caution:'구매·자격이 필요해 이 자료실에서 양식을 제공하지 않습니다. 필요하면 정신건강복지센터·청소년상담복지센터에 의뢰합니다.',
  license:'판매처 저작권(유료).',files:[],origin:{from:'미국 원판 · 한국 표준화',kr:'K-CBCL·K-YSR 등은 한국 규준으로 표준화된 판입니다.',read:'한국판 규준으로 해석하며, 전문가 해석 결과를 공유받습니다.'},
  source:'각 검사 판매처.'}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// Scales built abroad are marked so the reader knows the cut-offs come from another population (지훈 2026-10-28).
const foreign=s=>!!s.origin&&!/^국내/.test(s.origin.from);
const levelOf=g=>{const s=String(g||'');return s[0]==='초'?'e':s[0]==='중'?'m':s[0]==='고'?'h':''};
function card(s){
 const lv=LEVELS.filter(([k])=>s.levels.includes(k)).map(([,n])=>n).join('·');
 const files=s.files.length?'<div class="osl-files">'+s.files.map(f=>{const ext=/^https?:/.test(f.url);
   return '<a class="osl-dl'+(ext?'':' osl-own')+'" href="'+esc(f.url)+'"'+(ext?' target="_blank" rel="noopener noreferrer"':'')+(f.download?' download="'+esc(f.download)+'"':'')+'>'+esc(f.label)+(ext?' <span aria-hidden="true">↗</span>':'')+'</a>'}).join('')+'</div>'
  :'<p class="osl-none">공개 배포되지 않아 양식 링크를 두지 않습니다.</p>';
 return '<details class="osl-card" data-group="'+s.group+'" data-levels="'+s.levels.join(' ')+'" id="osl-'+s.id+'">'
  +'<summary><span class="osl-name">'+esc(s.name)+'</span><span class="osl-short">'+esc(s.short)+'</span>'
  +'<span class="osl-tags"><span class="osl-org'+(foreign(s)?' osl-foreign':'')+'">'+esc(foreign(s)?'외국 척도 · '+s.origin.from:'국내 척도')+'</span><span class="osl-lv">'+esc(lv)+'</span><span class="osl-acc osl-'+s.access+'">'+esc(ACCESS[s.access])+'</span></span></summary>'
  +'<div class="osl-body"><p class="osl-purpose">'+esc(s.purpose)+'</p>'
  +'<dl class="osl-facts"><div><dt>대상·응답자</dt><dd>'+esc(s.who)+'</dd></div><div><dt>문항·응답</dt><dd>'+esc(s.items)+'</dd></div><div><dt>소요 시간</dt><dd>'+esc(s.time)+'</dd></div>'
  +'<div><dt>채점·기준</dt><dd>'+esc(s.scoring)+'</dd></div><div><dt>OY-RALS와 함께 볼 곳</dt><dd>'+esc(s.link)+'</dd></div><div><dt>주의</dt><dd>'+esc(s.caution)+'</dd></div>'
  +(s.origin?'<div class="osl-origin'+(foreign(s)?' osl-foreign':'')+'"><dt>'+(foreign(s)?'외국 척도 · 한국판':'개발')+'</dt><dd>'+esc((foreign(s)?s.origin.from+'에서 개발. ':'')+s.origin.kr)+'</dd></div><div class="osl-origin'+(foreign(s)?' osl-foreign':'')+'"><dt>해석할 때</dt><dd>'+esc(s.origin.read)+'</dd></div>':'')
  +'<div><dt>저작권·이용 조건</dt><dd>'+esc(s.license)+'</dd></div><div><dt>출처</dt><dd>'+esc(s.source)+'</dd></div></dl>'+files+'</div></details>';
}
function html(opt){
 opt=opt||{};const lv=opt.level||'';
 const filt='<div class="osl-filter" role="group" aria-label="학교급으로 보기">'+[['','전체'],['e','초등'],['m','중학교'],['h','고등학교']].map(([k,n])=>'<button type="button" data-osl-level="'+k+'" aria-pressed="'+(k===lv)+'">'+n+'</button>').join('')+'</div>';
 return '<header class="osl-head"><p class="osl-kicker">추가 자료</p><h2>척도 자료실</h2>'
  +'<p>청소년 정서·안전·물질·디지털·자아·학업과 관련해 무료로 공개된 척도를 모았습니다. 이름을 누르면 개요·채점·이용 조건이 펼쳐지고, 양식은 각 척도의 <strong>공식 배포처</strong>에서 내려받습니다.</p>'
  +'<p class="osl-note">대부분의 척도는 저작권자 허가 없이 다른 사이트에 올려 다시 배포할 수 없어, 이 사이트에는 OY-RALS 자체 양식만 올려 두었습니다. 척도 점수는 OY-RALS의 점수·판정에 더해지지 않으며 진단이 아닙니다. 이용 조건과 주소는 '+CHECKED+' 확인 기준입니다.</p></header>'
  +'<p class="osl-note osl-foreign-note"><strong>외국 척도</strong> 표시는 다른 나라에서 개발한 척도입니다. 기준점과 규준이 그 나라 표본에서 나왔으므로, 한국 학생에게는 한국판 타당화 연구의 기준을 우선 참고하고, 한국 기준이 없으면 기준점 통과 여부보다 하위척도의 상대적 높낮이와 재평가 때의 변화로 읽은 뒤 면담으로 확인합니다. 카드마다 한국판 여부와 해석 주의를 적었습니다.</p>'
  +filt+'<p class="osl-legend"><span class="osl-acc osl-own">이 사이트 양식</span><span class="osl-acc osl-official">공식 배포처 무료</span><span class="osl-acc osl-request">요청·가입 후 이용</span><span class="osl-acc osl-restricted">공개 배포 안 됨</span></p>'
  +GROUPS.map(([g,name,desc])=>{const list=SCALES.filter(s=>s.group===g);return list.length?'<section class="osl-group" data-osl-group="'+g+'"><h3>'+esc(name)+' <span>'+esc(desc)+'</span></h3>'+list.map(card).join('')+'</section>':''}).join('')
  +'<div class="osl-tools"><button type="button" data-osl-csv>척도 목록 내려받기 (CSV)</button><button type="button" data-osl-open>모두 펼치기</button><button type="button" data-osl-print>인쇄</button></div>';
}
function csv(){
 const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const head=['구분','척도','요약','개발 국가','한국판','해석할 때','학교급','대상·응답자','문항·응답','소요 시간','채점·기준','OY-RALS와 함께 볼 곳','주의','이용 방식','저작권·이용 조건','양식 주소','출처','확인일'];
 const rows=SCALES.map(s=>[GROUPS.find(g=>g[0]===s.group)[1],s.name,s.short,s.origin?s.origin.from:'',s.origin?s.origin.kr:'',s.origin?s.origin.read:'',LEVELS.filter(([k])=>s.levels.includes(k)).map(([,n])=>n).join('·'),s.who,s.items,s.time,s.scoring,s.link,s.caution,ACCESS[s.access],s.license,s.files.map(f=>f.url).join(' '),s.source,CHECKED]);
 return '﻿'+[head,...rows].map(r=>r.map(q).join(',')).join('\r\n');
}
function applyLevel(box,lv){
 box.querySelectorAll('[data-osl-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.oslLevel===lv)));
 box.querySelectorAll('.osl-card').forEach(c=>{c.hidden=!!lv&&!c.dataset.levels.split(' ').includes(lv)});
 box.querySelectorAll('.osl-group').forEach(g=>{g.hidden=![...g.querySelectorAll('.osl-card')].some(c=>!c.hidden)});
}
/* 01 화면에서 고른 학년이 있으면 그 학교급으로 먼저 보여 준다(학년 해석 보조와 같은 값). */
function currentGrade(doc){try{const f=doc.getElementById('assessmentFrame');const s=f&&f.contentDocument&&f.contentDocument.getElementById('studentGrade');return s?s.value:''}catch(_){return ''}}
function mount(doc){
 const box=doc.getElementById('scaleLibraryArea');if(!box)return;
 if(!box.dataset.ready){box.innerHTML=html();box.dataset.ready='1';
  box.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
   if(t.hasAttribute('data-osl-level'))applyLevel(box,t.dataset.oslLevel);
   else if(t.hasAttribute('data-osl-open')){const open=t.textContent.includes('펼치기');box.querySelectorAll('.osl-card').forEach(d=>{if(!d.hidden)d.open=open});t.textContent=open?'모두 접기':'모두 펼치기';}
   else if(t.hasAttribute('data-osl-print')){box.querySelectorAll('.osl-card').forEach(d=>{if(!d.hidden)d.open=true});root.print&&root.print();}
   else if(t.hasAttribute('data-osl-csv')){const a=doc.createElement('a');a.href=URL.createObjectURL(new Blob([csv()],{type:'text/csv;charset=utf-8'}));a.download='OY-RALS-scale-library-'+CHECKED+'.csv';doc.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);}
  });}
 applyLevel(box,levelOf(currentGrade(doc)));
}
function open(doc){
 const box=doc.getElementById('scaleLibraryArea'),btn=doc.querySelector('[data-oy-lib]');if(!box)return;
 mount(doc);doc.body.classList.add('oy-lib-open');box.hidden=false;
 doc.querySelectorAll('.flow-nav>button').forEach(b=>{const me=b===btn;b.setAttribute('aria-current',me?'step':'false');b.setAttribute('aria-pressed',String(me))});
 requestAnimationFrame(()=>{const f=doc.getElementById('assessmentFlow');f&&f.scrollIntoView({behavior:'smooth',block:'start'})});
}
function close(doc){const box=doc.getElementById('scaleLibraryArea');doc.body.classList.remove('oy-lib-open');if(box)box.hidden=true;const btn=doc.querySelector('[data-oy-lib]');if(btn){btn.setAttribute('aria-current','false');btn.setAttribute('aria-pressed','false')}}
function bind(doc){
 const btn=doc.querySelector('[data-oy-lib]');if(!btn)return;
 btn.addEventListener('click',()=>open(doc));
 // 다른 단계 버튼은 자료실을 닫은 뒤 원래 흐름(flow.js)이 그대로 처리한다.
 doc.addEventListener('click',e=>{if(doc.body.classList.contains('oy-lib-open')&&e.target.closest('[data-oy-step],#previousStep,#nextStep'))close(doc)},true);
 if(/[#&]scales\b/.test(root.location&&root.location.hash||''))open(doc);
}
const api=Object.freeze({VERSION,CHECKED,ACCESS,GROUPS,SCALES,html,csv,levelOf,foreign,open,close,bind});
if(node)module.exports=api;else{root.OYScaleLibrary=api;if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>bind(root.document));else bind(root.document);}}
})(typeof window!=='undefined'?window:globalThis);
