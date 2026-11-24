/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
   오산 통합돌봄 길잡이 — 법 조문 요약과 서비스 목록(2026-11-24 정리).
   근거: 「의료·요양 등 지역 돌봄의 통합지원에 관한 법률」(법률 제20415호, 2026.3.27 시행),
   같은 법 시행령(대통령령 제35897호, 2025.12.9 공포; 이 파일은 입법예고안 주요내용 기준으로 적은 부분이 있음),
   보건복지부 지역사회 통합돌봄 누리집 '이용안내'.
   서비스 자격·운영기관은 지역마다 다르므로 화면은 '연결 후보'만 보여 주며 자격을 판정하지 않는다. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.CARE_DATA = data;
})(typeof self !== 'undefined' ? self : this, function () {
  const SRC = {
    law: 'https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%9D%98%EB%A3%8C%E3%86%8D%EC%9A%94%EC%96%91%EB%93%B1%EC%A7%80%EC%97%AD%EB%8F%8C%EB%B4%84%EC%9D%98%ED%86%B5%ED%95%A9%EC%A7%80%EC%9B%90%EC%97%90%EA%B4%80%ED%95%9C%EB%B2%95%EB%A5%A0',
    decree: 'https://community.lawmaking.go.kr/lmSts/govLm/2000000316570/detailRP',
    guide: 'https://www.mohw.go.kr/menu.es?mid=a60200000000',
    overview: 'https://www.mohw.go.kr/menu.es?mid=a60100000000',
    ltc: 'https://www.longtermcare.or.kr/',
    osanDischarge: 'https://kgnews.co.kr/mobile/article.html?no=903460',
    osanHousing: 'https://www.vision21.kr/news/article.html?no=585424',
    osanTraining: 'https://www.kbcs.kr/news/article.html?no=430295',
    osanStaff: 'https://www.osan.go.kr/search/search.jsp'
  };


  /* 법의 서비스 영역(제2조 제1호, 제15~19조). 화면 순서와 색은 이 순서를 따른다. */
  const domains = [
    { id: 'health', label: '보건의료', article: '제15조', short: '진료·간호·재활·복약',
      text: '의사·한의사·치과의사의 진료(가정·시설 방문 포함), 간호사의 간호, 재활, 회복기 의료, 호스피스, 방문 구강관리, 약사의 복약지도.' },
    { id: 'prevent', label: '건강관리·예방', article: '제16조', short: '방문건강·치매·정신건강',
      text: '노쇠·노인성 질병·만성질환·장애·정신질환의 예방과 완화, 건강관리. 지자체는 의료·간호·복지 다학제 방문 기반을 만든다.' },
    { id: 'ltc', label: '장기요양', article: '제17조', short: '등급·재가·시설급여',
      text: '노인장기요양보험법의 노인성질환예방사업, 재가급여(방문요양·방문목욕·방문간호·주야간보호·단기보호 등), 시설급여.' },
    { id: 'daily', label: '일상생활돌봄', article: '제18조', short: '가사·식사·이동·안전 확인',
      text: '식사 등 가사 지원, 병원 이동 지원, 보조기기, 주간·야간 통원 편의, ICT 안전·건강 확인, 퇴원·퇴소 후 지역 복귀, 맞춤형 급여 안내.' },
    { id: 'housing', label: '주거', article: '제18조 제6호', short: '주거환경 개선·살 곳',
      text: '주거공간 확보·제공 또는 주거환경 개선(문턱·손잡이·욕실 등).' },
    { id: 'family', label: '가족 등 지원', article: '제19조', short: '돌보는 가족의 건강',
      text: '대상자를 돌보는 가족·보호자의 신체적·정신적 건강 유지와 상담·정보 제공.' }
  ];

  /* 제공 방법 3구분(복지부 이용안내 '서비스 제공' 표) */
  const channels = {
    gov: { label: '시·군·구 또는 건보공단 지사로 의뢰', short: '행정 의뢰',
      text: '대부분의 연계 서비스. 시·군·구 사업부서나 국민건강보험공단 지사가 받는다(예: 노인맞춤돌봄, 응급안전안심, 통합사례관리).' },
    provider: { label: '제공기관으로 바로 의뢰', short: '기관 의뢰',
      text: '제공기관이 정해져 있는 서비스(예: 치매안심센터, 정신건강복지센터, 보건소 방문건강관리).' },
    inform: { label: '대상자에게 안내(본인이 기관 선택)', short: '본인 선택 안내',
      text: '기관을 하나로 정하기 어렵거나 본인의 선택권이 필요한 서비스(예: 방문진료, 재택의료센터, 장기요양 재가서비스).' }
  };

  /* match: 복지자원 DB(기관명+서비스명+내용)에서 찾을 낱말(정규식). 없으면 DB 연결 없음(공식 안내로 확인). */
  const services = [
    // 보건의료
    { id: 'H1', domain: 'health', channel: 'inform', name: '일차의료 방문진료', law: '제15조 제1호',
      what: '거동이 불편해 병원에 가기 어려운 사람에게 동네 의원 의사가 집으로 찾아가 진료합니다.', match: '방문진료', source: SRC.guide },
    { id: 'H2', domain: 'health', channel: 'inform', name: '장기요양 재택의료센터', law: '제15조 제1·2호',
      what: '장기요양 수급자 집으로 의사·간호사·사회복지사가 팀으로 방문해 진료와 돌봄 연계를 합니다.', match: '재택의료', source: SRC.guide },
    { id: 'H3', domain: 'health', channel: 'inform', name: '가정간호·방문간호', law: '제15조 제2호',
      what: '의료기관 가정간호나 장기요양 방문간호로 간호사가 집에서 처치·투약 관리를 합니다.', match: '가정간호|방문간호', source: SRC.guide },
    { id: 'H4', domain: 'health', channel: 'inform', name: '만성질환 관리(동네 의원·보건소)', law: '제15조 제1호·제16조',
      what: '고혈압·당뇨 같은 만성질환을 꾸준히 관리하고 약 복용을 돕습니다.', match: '만성질환', source: SRC.guide },
    { id: 'H5', domain: 'health', channel: 'provider', name: '퇴원환자 지역사회 연계', law: '제11조·제18조 제7호',
      what: '퇴원을 앞둔 환자의 의료·돌봄 욕구를 병원이 파악해 동의를 받아 시·군·구에 알리고 통합돌봄 신청을 안내합니다.',
      osan: '오산시는 「5313(오산일상) 퇴원환자 연계」로 관내 병원 6곳(송호욱·버팀·오산세종·이안한방·오산한국·조은오산병원)과 연계한다고 보도되었습니다(2026.7). 병원 의료사회복지팀에 먼저 문의하세요.',
      match: '퇴원|의료사회복지', source: SRC.osanDischarge },
    { id: 'H6', domain: 'health', channel: 'inform', name: '치매관리주치의', law: '제15조 제1호',
      what: '치매가 있는 사람의 진료와 관리를 한 의사가 계속 맡는 시범사업입니다.', match: '치매관리주치의', source: SRC.guide },
    { id: 'H7', domain: 'health', channel: 'inform', name: '가정형 호스피스', law: '제15조 제5호',
      what: '생애 말기 환자가 집에서 통증 관리와 돌봄을 받도록 호스피스 팀이 방문합니다.', match: '호스피스', source: SRC.law },
    { id: 'H8', domain: 'health', channel: 'inform', name: '방문 구강관리·복약지도', law: '제15조 제6·7호',
      what: '치과 인력의 방문 구강관리, 약사의 가정 방문 복약지도(지역별 운영 여부 확인).', match: '구강|복약', source: SRC.law },

    // 건강관리·예방
    { id: 'P1', domain: 'prevent', channel: 'provider', name: '보건소 방문건강관리', law: '제16조',
      what: '보건소 간호사 등이 집으로 찾아가 건강 상태를 살피고 만성질환·노쇠 예방을 돕습니다.', match: '방문건강관리', source: SRC.guide },
    { id: 'P2', domain: 'prevent', channel: 'provider', name: '치매안심센터', law: '제16조',
      what: '인지 선별검사, 치매 상담·등록, 쉼터, 가족 지원을 합니다.', match: '치매안심|인지저하', source: SRC.guide },
    { id: 'P3', domain: 'prevent', channel: 'provider', name: '정신건강복지센터', law: '제16조',
      what: '우울·고립·정신질환이 있는 사람의 상담, 사례관리, 위기 대응을 합니다.', match: '정신건강 상담|정신건강복지센터 운영|자살 시도자', source: SRC.guide },
    { id: 'P4', domain: 'prevent', channel: 'provider', name: 'AI·IoT 어르신 건강관리', law: '제16조·제18조 제5호',
      what: '스마트 기기로 걸음·혈압 등을 확인하고 보건소가 원격으로 건강관리를 돕습니다.', match: 'AI·IoT|IoT|인공지능', source: SRC.guide },
    { id: 'P5', domain: 'prevent', channel: 'gov', name: '건강백세운동교실 등 노쇠 예방', law: '제16조',
      what: '근력·낙상 예방 운동교실 같은 지역 예방 프로그램입니다.', match: '운동교실|건강백세|낙상', source: SRC.guide },

    // 장기요양
    { id: 'L1', domain: 'ltc', channel: 'inform', name: '장기요양 등급 신청(국민건강보험공단)', law: '제17조',
      what: '혼자 일상생활이 어려운 65세 이상(또는 노인성 질병이 있는 65세 미만)은 건보공단에 등급을 신청합니다. 대표전화 1577-1000.',
      match: '장기요양', source: SRC.ltc },
    { id: 'L2', domain: 'ltc', channel: 'inform', name: '장기요양 재가급여', law: '제17조 제2호',
      what: '방문요양·방문목욕·방문간호·주야간보호·단기보호·복지용구. 등급이 있으면 본인이 기관을 골라 계약합니다.', match: '재가급여|주야간보호|방문요양|복지용구|장기요양 인정', source: SRC.ltc },
    { id: 'L3', domain: 'ltc', channel: 'inform', name: '장기요양 시설급여', law: '제17조 제2호',
      what: '집에서 지내기 어려울 때 노인요양시설 등에 입소합니다(통합돌봄은 살던 곳 생활을 먼저 검토).', match: '요양원|시설급여|노인요양시설', source: SRC.ltc },

    // 일상생활돌봄
    { id: 'D1', domain: 'daily', channel: 'gov', name: '노인맞춤돌봄서비스', law: '제18조',
      what: '혼자 생활이 어려운 어르신에게 안부 확인, 생활지원, 사회참여, 특화 서비스를 제공합니다. 장기요양 등급외 어르신이 주로 이용합니다.',
      match: '노인맞춤돌봄|노인돌봄', source: SRC.guide },
    { id: 'D2', domain: 'daily', channel: 'gov', name: '응급안전안심서비스', law: '제18조 제5호',
      what: '혼자 사는 어르신·장애인 집에 화재·활동 감지기를 달아 위급할 때 119와 연결합니다.', match: '응급안전', source: SRC.guide },
    { id: 'D3', domain: 'daily', channel: 'gov', name: '식사·영양 지원', law: '제18조 제1호',
      what: '도시락·밑반찬 배달, 경로식당 등으로 끼니를 챙깁니다.', match: '식사배달|도시락|밑반찬|경로식당', source: SRC.law },
    { id: 'D4', domain: 'daily', channel: 'gov', name: '병원 동행·이동 지원', law: '제18조 제2호',
      what: '병원·보건소 방문을 위한 동행이나 교통약자 이동 수단을 연결합니다.', match: '동행|이동지원|특별교통|교통약자', source: SRC.law },
    { id: 'D5', domain: 'daily', channel: 'provider', name: '보조기기 상담·지원', law: '제18조 제3호',
      what: '휠체어·보행기·생활 보조기기의 상담, 대여, 적합성 확인을 합니다.', match: '보조기기|보조기구', source: SRC.law },
    { id: 'D6', domain: 'daily', channel: 'gov', name: '장애인 활동지원', law: '제18조',
      what: '등록 장애인의 신변처리·가사·이동을 활동지원사가 돕습니다(국민연금공단 조사).', match: '활동지원', source: SRC.guide },
    { id: 'D7', domain: 'daily', channel: 'gov', name: '일상돌봄·긴급돌봄', law: '제18조',
      what: '갑자기 돌볼 사람이 없어졌거나 가족돌봄이 어려울 때 단기간 재가 돌봄을 제공합니다.', match: '일상돌봄|긴급돌봄|누구나돌봄|공적돌봄', source: SRC.guide },
    { id: 'D8', domain: 'daily', channel: 'gov', name: '통합사례관리', law: '제18조·제21조',
      what: '여러 어려움이 겹친 가구를 행정복지센터·복지관이 함께 사정하고 자원을 묶어 관리합니다.', match: '통합사례관리|사례관리 및 서비스 연계', exclude: '아동', source: SRC.guide },
    { id: 'D9', domain: 'daily', channel: 'gov', name: '고독사 예방·안부 확인', law: '제18조',
      what: '혼자 사는 사람의 안부를 정기적으로 확인하고 사회관계를 잇습니다.', match: '고독사|안부 확인|안부살핌', source: SRC.guide },
    { id: 'D10', domain: 'daily', channel: 'gov', name: '맞춤형 급여 안내·긴급복지', law: '제18조 제8호',
      what: '받을 수 있는 복지급여를 찾아 안내하고, 갑작스러운 위기에는 긴급복지(생계·의료·주거)를 검토합니다.', match: '맞춤형복지|긴급복지지원 상담|긴급복지 의료', source: SRC.law },

    // 주거
    { id: 'O1', domain: 'housing', channel: 'gov', name: '주거환경 개선(안전 손잡이·문턱·욕실)', law: '제18조 제6호',
      what: '낙상 위험을 줄이도록 문턱 제거, 안전 손잡이, 미끄럼 방지 같은 집 고치기를 지원합니다.',
      osan: '오산시 대원1동은 통합돌봄으로 독거 어르신 집 화장실 문턱에 맞춤 안전 발판을 설치한 사례가 보도되었습니다(2026.5).',
      match: '하우징|집수리|주거환경|주택개조', source: SRC.osanHousing },
    { id: 'O2', domain: 'housing', channel: 'inform', name: '공공임대·주거복지 상담', law: '제18조 제6호',
      what: '살 곳이 불안정할 때 공공임대주택, 주거급여, 주거상향 지원을 안내합니다.', match: '공공임대|주거복지|주거급여', source: SRC.law },
    { id: 'O3', domain: 'housing', channel: 'gov', name: '돌봄 연계 주택(지역 운영 여부 확인)', law: '제18조 제6호',
      what: '퇴원 직후 잠시 머물며 회복하는 주거나 돌봄이 붙은 임대주택. 지역마다 운영 여부가 다릅니다.', match: '케어안심|돌봄주택|일상복귀', source: SRC.law },

    // 가족 등 지원
    { id: 'F1', domain: 'family', channel: 'provider', name: '치매 가족 지원', law: '제19조',
      what: '치매 가족 교실, 자조모임, 돌봄 부담 상담.', match: '치매 가족', source: SRC.law },
    { id: 'F2', domain: 'family', channel: 'provider', name: '장애인 가족 지원', law: '제19조',
      what: '장애인 가족의 상담, 휴식, 역량 강화 프로그램.', match: '장애인가족|발달장애인 부모', source: SRC.law },
    { id: 'F3', domain: 'family', channel: 'provider', name: '가족 상담·돌봄 부담 완화', law: '제19조',
      what: '돌보는 가족의 우울·소진을 상담하고 휴식 서비스(단기보호 등)를 함께 검토합니다.', match: '가족상담|가족기능 강화|단기보호', source: SRC.law }
  ];

  /* 법 절차(제10~14조 + 복지부 이용안내) */
  const steps = [
    { id: 'apply', label: '신청', law: '제10조 ①', text: '본인, 가족(8촌 이내), 후견인, 기관 담당자(본인 동의 필요)가 주소지 읍·면·동 행정복지센터나 국민건강보험공단 지사에 방문·우편·팩스로 신청합니다.' },
    { id: 'find', label: '발굴·직권 신청', law: '제10조 ②·⑤, 제11조', text: '장기요양·활동지원 기각자, 의료기관 퇴원 직후인 사람 등은 시·군·구가 설명하고 동의를 받아 직권으로 신청할 수 있습니다. 병원·요양시설은 퇴원·퇴소 때 동의를 받아 시·군·구에 알리도록 노력합니다. 시·군·구는 해마다 1회 이상 대상자를 찾는 조사를 합니다.' },
    { id: 'pre', label: '사전조사', law: '복지부 이용안내', text: '신청서 접수일부터 5일 이내 대면·전화로 복합욕구가 있는지 가립니다(통합판정조사군·지자체 자체조사군·비해당군). 직권 신청과 의료기관 퇴원 연계는 사전조사를 면제합니다. 비해당이면 3개월 뒤 다시 신청할 수 있습니다(상태가 분명히 바뀌면 예외).' },
    { id: 'judge', label: '조사·종합판정', law: '제10조 ③, 제12조', text: '건강보험공단 지사 등이 대면조사를 하고, 시·군·구가 신체기능·일상생활 수행능력, 의료 필요성, 영양상태, 주거환경을 고려해 의료 필요도와 요양·돌봄 필요도를 종합판정합니다(시행령안 기준).' },
    { id: 'plan', label: '개인별지원계획·통합지원회의', law: '제13조', text: '서비스의 내용·방법·수량·기간·제공 주체와, 2개 이상 기관이 제공할 때의 연계 방법을 계획에 담습니다. 본인과 가족에게 의견을 말할 기회를 충분히 줍니다.' },
    { id: 'provide', label: '서비스 제공·연계', law: '제14조 ①~③', text: '시·군·구가 서비스를 제공하거나 기관에 의뢰합니다. 의뢰받은 기관은 제공 여부와 내용을 정해 알립니다.' },
    { id: 'monitor', label: '모니터링·변경', law: '제14조 ④, 제12조 ②', text: '첫 통합지원회의 뒤 1개월 안에 한 번, 그 뒤 3개월마다 제공 상황과 상태 변화를 점검하고 계획을 바꿉니다.' },
    { id: 'close', label: '종결', law: '복지부 이용안내', text: '본인이 그만두기를 원하거나, 병원·시설에 들어가거나, 전출·사망하거나, 복합욕구가 풀려 필요한 서비스가 1개만 남으면 종결합니다.' }
  ];

  /* 법 핵심 카드(조문 요약). 문구는 요약이며 원문은 국가법령정보센터에서 확인. */
  const lawCards = [
    { title: '누가 대상인가요', law: '제2조, 시행령', body: '노쇠·장애·질병·사고 등으로 일상생활 유지가 어려워 복합적인 지원이 필요한 사람입니다. 시행령(입법예고안 기준)은 65세 이상, 장애 정도가 심한 등록 장애인 중 복지부장관이 인정하는 사람, 지자체장이 복지부장관과 협의해 인정하는 사람으로 정합니다. 1단계 우선 대상은 장기요양 재가급여자·등급외자·노인맞춤돌봄 중점군·퇴원환자 등 65세 이상과, 의료 필요도가 높은 중증장애인(시범)입니다.' },
    { title: '무엇을 지원하나요', law: '제2조 제1호, 제15~19조', body: '보건의료, 건강관리, 장기요양, 일상생활돌봄, 주거, 가족 지원을 직접 제공하거나 연계해 한 사람에게 묶어서 제공합니다.' },
    { title: '누가 책임지나요', law: '제4·6·20·21조', body: '시장·군수·구청장이 해마다 지역계획을 세우고, 전담조직(보건소·읍면동 지원조직 포함)과 통합지원협의체(지역사회보장협의체와 통합 운영 가능)를 둘 수 있습니다. 시·도는 인프라와 재원을 지원합니다.' },
    { title: '정보는 어떻게 다루나요', law: '제10조 ②, 제23·27·30조', body: '직권 신청과 정보 제공은 본인 동의가 원칙입니다. 관련기관끼리는 개인별지원계획에 필요한 범위에서만 정보를 주고받고, 직무상 알게 된 비밀을 누설하면 5년 이하 징역 또는 5천만원 이하 벌금입니다.' }
  ];

  const hotlines = [
    { num: '119', label: '응급·화재', tel: '119' },
    { num: '112', label: '범죄·실종·학대 긴급', tel: '112' },
    { num: '129', label: '보건복지상담센터(통합돌봄 안내)', tel: '129' },
    { num: '1577-1000', label: '국민건강보험공단(장기요양)', tel: '15771000' },
    { num: '1577-1389', label: '노인학대 신고', tel: '15771389' },
    { num: '109', label: '자살예방 상담', tel: '109' }
  ];

  /* 오산시 현황(2026-11-25 보완). 담당 전화는 오산시청 누리집 직원/업무 검색 화면(지훈 제공)에서 부서·전화·업무만 옮기고 개인 이름은 넣지 않는다. */
  const osan = {
    dept: '오산시청 희망복지과 통합돌봄팀',
    phone: '031-8036-7392',
    phoneNote: '팀장(업무 총괄). 오산시청 누리집 직원/업무 검색 「통합돌봄」 결과 기준(2026-11-25 확인).',
    staff: [
      { phone: '031-8036-7392', role: '팀장 · 통합돌봄 업무 총괄, 협의체·통합지원회의, 오산형 특화사업' },
      { phone: '031-8036-7395', role: '통합돌봄 시스템 운영 총괄, 오산형 특화사업, 5313(오산일상) 돌봄·퇴원환자 연계 · 동 담당 대원1동·대원2동·남촌동' },
      { phone: '031-8036-7393', role: '지역계획·협의체·담당자 교육, 5313 중간집, 평가 · 동 담당 중앙동·세마동' },
      { phone: '031-8036-7394', role: '장애인 의료·요양 통합돌봄, 홍보 · 동 담당 신장1동·신장2동·초평동·세마동' },
      { phone: '031-8036-6328', role: '세마동 찾아가는 보건복지팀 · 세마동 대상자 발굴·조사·서비스 연계' },
      { phone: '031-8036-6081', role: '보건소 건강증진과 지역보건팀 · AI·IoT 어르신 건강관리, 통합돌봄(보건·의료) 협력' }
    ],
    staffNote: '시청 동 담당은 중앙동·세마동 7393, 신장1동·신장2동·초평동·세마동 7394, 대원1동·대원2동·남촌동 7395입니다. 동 행정복지센터로 먼저 연락해도 됩니다.',
    staffSource: SRC.osanStaff,
    facts: [
      { text: '주민 신청은 주소지 동 행정복지센터 통합돌봄 담당(팀장·담당자)이 받고, 시청 희망복지과 통합돌봄팀이 총괄합니다.', source: SRC.osanTraining, date: '2026-10-15 보도' },
      { text: '2026년 10월 14일 동 행정복지센터 통합돌봄 담당자 교육: 사업 지침, 「행복이음」 사용법, 오산시 통합돌봄 특화사업 안내. 업무 흐름은 대상자 발굴 → 신청·접수 → 종합판정조사 → 개인별지원계획 → 서비스 연계입니다.', source: SRC.osanTraining, date: '2026-10-15 보도' },
      { text: '「5313(오산일상)」 돌봄: 송호욱·버팀·오산세종·이안한방·오산한국·조은오산병원 6곳이 퇴원환자의 의료·돌봄 욕구를 파악해 시에 연계하고, 시청 업무분장에는 「5313(오산일상) 중간집」 사업 추진도 올라 있습니다.', source: SRC.osanDischarge, date: '2026-07 보도 · 시청 업무분장' },
      { text: '보건소 건강증진과 지역보건팀이 방문건강관리(지역별 담당)와 AI·IoT 어르신 건강관리로 통합돌봄 보건·의료 분야를 맡습니다.', source: SRC.osanStaff, date: '2026-11-25 시청 업무분장' },
      { text: '대원1동 통합돌봄: 독거 어르신 집 화장실 문턱에 맞춤 안전 발판을 설치(지역 목공업체 재능기부).', source: SRC.osanHousing, date: '2026-05 보도' }
    ]
  };

  return { version: '1.1.0', checkedOn: '2026-11-25', osan, sources: SRC, domains, channels, services, steps, lawCards, hotlines };
});
