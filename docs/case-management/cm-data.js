/* © 2026 오산세교종합사회복지관 김지훈 팀장.
   세교 사례관리 시스템 시연판 데이터 v0.2 (2026-11-26).
   - 전부 새로 지어낸 합성 자료다. 실존 인물·실제 사례·기관 내부 시트·노션 기록을 복사하거나 가명화한 것이 아니다.
   - 위기도 문항 문구는 원문 확인 전이라 싣지 않는다. 사업명·기관명은 시연용 예시다.
   - 실제 실적·사업계획 수치는 싣지 않는다. */
(function () {
  'use strict';
  const asOf = '2026-11-26';

  const staff = [
    { id: 'S1', name: '사례관리자 가', role: '사례관리자' },
    { id: 'S2', name: '사례관리자 나', role: '사례관리자' },
    { id: 'S3', name: '인테이크 다', role: '인테이크' },
    { id: 'S4', name: '전직원 라', role: '전직원 발굴' }
  ];

  const roles = [
    { id: 'manager', label: '사례관리자', note: '배정된 사례만 열람·기록' },
    { id: 'lead', label: '팀장', note: '팀 범위 검토·판정 확정' },
    { id: 'intake', label: '인테이크', note: '접수·초기상담 범위' },
    { id: 'accounting', label: '회계 담당', note: '상담 내용 기본 비노출' }
  ];

  const hotlines = [
    { num: '119', label: '화재·구급', tel: '119' },
    { num: '112', label: '범죄·실종·학대', tel: '112' },
    { num: '109', label: '자살예방 상담', tel: '109' },
    { num: '129', label: '보건복지상담센터', tel: '129' }
  ];

  const N = null;
  // 사례 회차. 이름 대신 시연 코드와 가명 이니셜만 쓴다.
  const cases = [
    { id: 'DEMO-0001', who: '가상 A', age: '70대', hh: '독거', type: '단순', state: 'simple_active', staff: 'S4', dong: '세교 권역(가상)', received: '2026-09-29', scenario: 'A', next: '안부 전화', nextDue: '2026-11-28', problem: '건강', risk: null, safety: null, docs: { report: '해당 없음', plan: '해당 없음' } },
    { id: 'DEMO-0002', who: '가상 B', age: '40대', hh: '한부모', type: '일반', state: 'plan_pending', staff: 'S1', dong: '세교 권역(가상)', received: '2026-08-18', scenario: 'B', prevType: '단순', converted: { on: '2026-11-12', by: '판정회의 MTG-DEMO-11', from: '단순', to: '일반' }, next: '서비스계획 합의', nextDue: '2026-11-27', problem: '경제', risk: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 2, 1, 1, 1], safety: null, docs: { report: '확정', plan: '초안' } },
    { id: 'DEMO-0003', who: '가상 C', age: '60대', hh: '독거', type: '집중', state: 'active', staff: 'S1', dong: '세교 권역(가상)', received: '2026-09-02', scenario: 'E', next: '11월 점검 회의 결과 반영', nextDue: '2026-12-02', problem: '건강', risk: [1, 1, 2, 1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 1], safety: null, docs: { report: '확정', plan: '확정' }, detail: true },
    { id: 'DEMO-0004', who: '가상 D', age: '50대', hh: '부부중심', type: '일반', state: 'assessment_pending', staff: 'S2', dong: '세교 권역(가상)', received: '2026-11-03', scenario: 'C', next: '경제·건강 미확인 문항 확인', nextDue: '2026-11-27', problem: '부채', risk: [1, 0, N, 1, 2, N, 1, 0, 0, 0, N, 1, 2, 2, N, 2], safety: null, docs: { report: '초안', plan: '없음' } },
    { id: 'DEMO-0005', who: '가상 E', age: '30대', hh: '기타', type: '일반', state: 'decision_pending', staff: 'S2', dong: '세교 권역(가상)', received: '2026-11-10', scenario: 'D', next: '안전 확인 후 판정회의 상정', nextDue: '2026-11-26', problem: '정신건강', risk: [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0], safety: { state: '확인 필요', text: '상담 중 안전 관련 진술(가상). 점수와 별개로 기관 안전 대응 절차 진행.', by: '사례관리자 나', at: '2026-11-24' }, docs: { report: '초안', plan: '없음' } },
    { id: 'DEMO-0006', who: '가상 F', age: '80대', hh: '노인부부', type: '단순', state: 'simple_active', staff: 'S1', dong: '세교 권역(가상)', received: '2026-10-21', scenario: 'F', next: '에너지 지원 결과 안내', nextDue: '2026-12-05', problem: '주거', risk: null, safety: null, docs: { report: '해당 없음', plan: '해당 없음' } },
    { id: 'DEMO-0007', who: '가상 G', age: '60대', hh: '독거', type: '일반', state: 'closed', staff: 'S2', dong: '세교 권역(가상)', received: '2025-11-04', closedOn: '2026-06-30', scenario: 'G', next: '—', nextDue: null, problem: '경제', risk: null, safety: null, docs: { report: '확정', plan: '확정' } },
    { id: 'DEMO-0008', who: '가상 G', age: '60대', hh: '독거', type: '미정', state: 'intake_done', staff: 'S3', dong: '세교 권역(가상)', received: '2026-11-20', scenario: 'G', prior: 'DEMO-0007', next: '재접수 초기상담 결과 보고', nextDue: '2026-11-27', problem: '주거', risk: null, safety: null, docs: { report: '없음', plan: '없음' } }
  ];

  const intakes = [
    { id: 'INT-DEMO-001', caseId: 'DEMO-0001', received: '2026-09-29', route: '전직원 발굴', problem: '건강', staff: 'S4', state: '단순관리 전환' },
    { id: 'INT-DEMO-002', caseId: 'DEMO-0002', received: '2026-08-18', route: '본인/가족', problem: '경제', staff: 'S3', state: '사례관리 전환' },
    { id: 'INT-DEMO-003', caseId: 'DEMO-0003', received: '2026-09-02', route: '좋은이웃들', problem: '건강', staff: 'S3', state: '사례관리 전환' },
    { id: 'INT-DEMO-004', caseId: 'DEMO-0004', received: '2026-11-03', route: '타기관', problem: '부채', staff: 'S3', state: '사례관리 전환' },
    { id: 'INT-DEMO-005', caseId: 'DEMO-0005', received: '2026-11-10', route: '읍면동', problem: '정신건강', staff: 'S3', state: '사례관리 전환' },
    { id: 'INT-DEMO-006', caseId: 'DEMO-0006', received: '2026-10-21', route: '전직원 발굴', problem: '주거', staff: 'S1', state: '단순관리 전환' },
    { id: 'INT-DEMO-008', caseId: 'DEMO-0008', received: '2026-11-20', route: '본인/가족', problem: '주거', staff: 'S3', state: '초기상담 완료', note: '종결 사례 DEMO-0007 재접수(새 회차)' },
    { id: 'INT-DEMO-011', caseId: null, received: '2026-11-24', route: '좋은이웃들', problem: '돌봄', staff: null, state: '배정 대기' },
    { id: 'INT-DEMO-012', caseId: null, received: '2026-11-25', route: '타기관', problem: '경제', staff: null, state: '배정 대기' }
  ];

  // 접촉(상담) 기록. result: completed / failed(연락 실패) / cancelled / planned
  const contacts = [
    { id: 'C-01', caseId: 'DEMO-0001', date: '2026-10-02', mode: '전화', result: 'completed', staff: 'S4', text: '병원 이용 어려움 진술. 방문건강 안내.' },
    { id: 'C-02', caseId: 'DEMO-0001', date: '2026-11-20', mode: '전화', result: 'failed', staff: 'S4', text: '연락 안 됨.' },
    { id: 'C-03', caseId: 'DEMO-0002', date: '2026-10-15', mode: '내방', result: 'completed', staff: 'S1', text: '생활비 부담과 자녀 돌봄 어려움 진술.' },
    { id: 'C-04', caseId: 'DEMO-0002', date: '2026-11-18', mode: '방문', result: 'completed', staff: 'S1', text: '판정 결과 안내, 계획 초안 의견 들음.' },
    { id: 'C-05', caseId: 'DEMO-0003', date: '2026-09-12', mode: '전화', result: 'completed', staff: 'S1', text: '밑반찬 첫 배달 받았다고 함. 맛이 짜다고 말함.' },
    { id: 'C-06', caseId: 'DEMO-0003', date: '2026-10-07', mode: '방문', result: 'completed', staff: 'S1', text: '약 봉투 정리표를 함께 만듦. 하루 두 끼 먹는 날이 늘었다고 말함.' },
    { id: 'C-07', caseId: 'DEMO-0003', date: '2026-11-04', mode: '방문', result: 'completed', staff: 'S1', text: '점검 상담. 같은 방문에서 밑반찬 전달.' },
    { id: 'C-08', caseId: 'DEMO-0003', date: '2026-11-19', mode: '전화', result: 'cancelled', staff: 'S1', text: '당사자 병원 일정으로 취소.' },
    { id: 'C-09', caseId: 'DEMO-0004', date: '2026-11-06', mode: '내방', result: 'completed', staff: 'S2', text: '부채 상환 부담 진술. 금액은 서류 확인 전.' },
    { id: 'C-10', caseId: 'DEMO-0005', date: '2026-11-24', mode: '방문', result: 'completed', staff: 'S2', text: '안전 관련 진술(가상). 기관 절차에 따라 팀장 보고.' },
    { id: 'C-11', caseId: 'DEMO-0006', date: '2026-10-23', mode: '방문', result: 'completed', staff: 'S1', text: '난방 어려움 진술. 에너지 지원 시연사업 신청 안내.' },
    { id: 'C-12', caseId: 'DEMO-0008', date: '2026-11-21', mode: '내방', result: 'completed', staff: 'S3', text: '재접수 초기상담. 이전 종결 이후 주거 문제 새로 생김.' }
  ];

  // 서비스 제공(상담과 별도 집계). 같은 방문(C-07)에서 상담과 전달이 함께 있어도 각각 한 번씩만 센다.
  const services = [
    { id: 'V-01', caseId: 'DEMO-0003', contactId: null, date: '2026-09-12', kind: '밑반찬 전달', qty: 1, unit: '회', status: 'provided', staff: 'S1' },
    { id: 'V-02', caseId: 'DEMO-0003', contactId: 'C-07', date: '2026-11-04', kind: '밑반찬 전달', qty: 1, unit: '회', status: 'provided', staff: 'S1' },
    { id: 'V-03', caseId: 'DEMO-0003', contactId: null, date: '2026-10-21', kind: '병원 동행', qty: 1, unit: '회', status: 'provided', staff: 'S1' },
    { id: 'V-04', caseId: 'DEMO-0006', contactId: null, date: '2026-11-25', kind: '난방 물품 전달', qty: 1, unit: '가구', status: 'planned', staff: 'S1' }
  ];

  // 기관 연계. 단계: 후보 → 당사자 검토 → 동의 확인 → 의뢰 → 접수 확인 → 수락 → 이용 → 결과 점검
  const referralStages = ['후보', '당사자 검토', '동의 확인', '의뢰', '접수 확인', '수락', '이용', '결과 점검'];
  const referrals = [
    { id: 'R-01', caseId: 'DEMO-0001', date: '2026-10-02', need: '병원 이용', org: '보건소 방문건강관리(예시)', stage: '의뢰', staff: 'S4', checked: '2026-10-02' },
    { id: 'R-02', caseId: 'DEMO-0003', date: '2026-09-10', need: '식사 지원', org: '밑반찬 지원 사업(예시)', stage: '이용', staff: 'S1', checked: '2026-11-04' },
    { id: 'R-03', caseId: 'DEMO-0003', date: '2026-09-16', need: '건강관리', org: '보건소 방문건강관리(예시)', stage: '이용', staff: 'S1', checked: '2026-10-07' },
    { id: 'R-04', caseId: 'DEMO-0003', date: '2026-11-04', need: '의료비 부담', org: '의료비 지원 제도(예시)', stage: '당사자 검토', staff: 'S1', checked: '2026-11-04' },
    { id: 'R-05', caseId: 'DEMO-0004', date: '2026-11-06', need: '부채 상담', org: '금융복지 상담 창구(예시)', stage: '후보', staff: 'S2', checked: '2026-11-06' },
    { id: 'R-06', caseId: 'DEMO-0002', date: '2026-11-18', need: '아동 돌봄', org: '지역아동센터(예시)', stage: '동의 확인', staff: 'S1', checked: '2026-11-18' }
  ];

  const meetings = [
    {
      id: 'MTG-DEMO-11', type: '판정회의', date: '2026-11-12', status: '완료', attendees: '팀장, 사례관리자 가, 사례관리자 나, 외부 자문 1(역할로만 표기)',
      agendas: [
        { caseId: 'DEMO-0002', item: '단순 → 일반 전환 판정', draft: '일반 사례로 전환 검토 요청', decision: '일반 사례로 전환. 서비스계획 2주 안에 수립.', owner: '사례관리자 가', due: '2026-11-26', state: '결정' },
        { caseId: 'DEMO-0003', item: '집중 사례 점검', draft: '목표 1·2 유지, 의료비 연계 검토', decision: '목표 유지. 의료비 지원은 경제사정 뒤 결정.', owner: '사례관리자 가', due: '2026-12-02', state: '결정' }
      ]
    },
    {
      id: 'MTG-DEMO-12', type: '판정회의', date: '2026-12-03', status: '예정', attendees: '예정',
      agendas: [
        { caseId: 'DEMO-0004', item: '신규 판정', draft: '일반 사례 선정(안). 위기도 미확인 문항 확인 후 상정.', decision: null, owner: '사례관리자 나', due: null, state: '안건 초안' },
        { caseId: 'DEMO-0005', item: '신규 판정', draft: '안전 확인 결과와 함께 상정(안).', decision: null, owner: '사례관리자 나', due: null, state: '안건 초안' },
        { caseId: 'DEMO-0008', item: '재접수 사례 검토', draft: '이전 종결 회차와 비교한 새 욕구 보고(안).', decision: null, owner: '인테이크 다', due: null, state: '안건 초안' }
      ]
    }
  ];

  // 지원사업 트랙(시연용 가상 사업). 신청·기관 판정·주관기관 선정·지급 요청·지급 확인을 나눈다.
  const programStages = ['신청 접수', '기관 판정', '주관기관 결과', '지급 요청', '지급 확인'];
  const programs = [
    { id: 'PT-DEMO-01', caseId: 'DEMO-0006', program: '겨울 에너지 지원(시연 사업)', applicant: '세대주(가상)', beneficiary: '가구', stage: '주관기관 결과', result: '선정', amount: '시연 금액', evidence: '동의서 확인', staff: 'S1' },
    { id: 'PT-DEMO-02', caseId: 'DEMO-0002', program: '긴급 생계 지원(시연 사업)', applicant: '당사자(가상)', beneficiary: '당사자', stage: '기관 판정', result: '검토 중', amount: '—', evidence: '증빙 확인 필요', staff: 'S1' }
  ];

  // 대표 사례 DEMO-0003 상세(사례파일)
  const detail = {
    intake: {
      date: '2026-09-02', route: '좋은이웃들(가상)',
      sections: [
        ['가정환경', '1인 가구. 자녀와 연락이 뜸하다고 말함(자녀 쪽 설명은 듣지 못함).'],
        ['건강사항', '무릎 통증으로 외출이 어렵다고 말함. 약 봉투가 여러 병원 것으로 섞여 있음(관찰).'],
        ['경제사항', '수입 → 지출 → 부채 → 재산 → 기타 순서로 확인. 의료비 지출 부담 진술, 금액은 미확인.'],
        ['주거환경', '임대 주택(가상). 계단이 많아 이동 어려움.'],
        ['사회심리 및 관계', '이웃과 안부를 주고받음. 고립감 호소는 없음.'],
        ['주요 문제 및 욕구', '“병원 다니는 게 힘들고, 혼자 밥 챙기기가 어려워요.”(진술)'],
        ['강점 및 자원', '이웃 지지, 복지관 프로그램 참여 경험.'],
        ['상담자 종합의견', '건강 관리와 식사 지원 욕구가 뚜렷함. 경제 상황은 추가 확인 필요함.'],
        ['결과 및 향후계획', '사례관리 진행 의견. 사정 후 판정회의 상정.']
      ]
    },
    economy: [
      { item: '수입', value: null, period: '월', note: '미확인(0원 아님)' },
      { item: '지출', value: null, period: '월', note: '의료비 부담 진술' },
      { item: '부채', value: null, period: '원금', note: '없다고 진술, 서류 확인 전' },
      { item: '재산', value: null, period: '—', note: '미확인' },
      { item: '기타', value: null, period: '—', note: '—' }
    ],
    domains: [
      { area: '안전', text: '현재 안전 위험 진술 없음.', kind: '관찰', state: '확인' },
      { area: '건강', text: '무릎 통증, 여러 병원 약 복용.', kind: '진술·관찰', state: '확인' },
      { area: '일상', text: '하루 한 끼만 먹는 날이 많다고 말함.', kind: '진술', state: '확인' },
      { area: '가족', text: '자녀와 연락이 뜸함. 자녀 쪽 설명은 없음.', kind: '진술', state: '상충' },
      { area: '사회', text: '이웃 지지 있음.', kind: '진술', state: '확인' },
      { area: '경제', text: '의료비 부담. 금액 미확인.', kind: '사정', state: '미확인' },
      { area: '교육', text: '해당 없음.', kind: '—', state: '해당 없음' },
      { area: '고용', text: '해당 없음.', kind: '—', state: '해당 없음' },
      { area: '환경', text: '계단 많은 주거.', kind: '관찰', state: '확인' },
      { area: '권익', text: '의료비 지원 제도 이용 여부 미확인.', kind: '사정', state: '미확인' }
    ],
    eco: [
      { label: '이웃 주민', kind: 'current', note: '안부' },
      { label: '밑반찬 지원', kind: 'current', note: '주 2회' },
      { label: '방문건강관리', kind: 'current', note: '월 1회' },
      { label: '자녀', kind: 'weak', note: '연락 뜸함(미확인)' },
      { label: '의료비 지원', kind: 'candidate', note: '연계 후보' },
      { label: '복지관 프로그램', kind: 'past', note: '과거 이용' }
    ],
    plan: [
      { goal: 1, outcome: '하루 두 끼 이상 먹는 날이 늘어난다', action: '주 2회 밑반찬 지원 연결, 격주 식사 확인 전화', basis: '식사 지원 먼저 연결', measure: '주간 식사 횟수(당사자 진술)', owner: '사례관리자 가', due: '2026-12' },
      { goal: 2, outcome: '병원 진료와 약 복용을 스스로 정리한다', action: '방문건강관리 연결, 약 봉투 정리표 함께 만들기', basis: '병원 동행은 방문건강관리 문의 결과를 보고 결정', measure: '정리표 사용 여부', owner: '사례관리자 가', due: '2026-11' },
      { goal: 3, outcome: '자녀와 연락이 이어진다', action: '자녀에게 연락해 상황을 알림', basis: '', measure: '', owner: '사례관리자 가', due: '2026-12' }
    ],
    meetingDecided: ['사례관리 대상으로 진행', '식사 지원 먼저 연결', '병원 동행은 방문건강관리 문의 결과를 보고 결정'],
    meetingPending: ['의료비 지원 신청 여부(경제사정 뒤 결정)', '자녀 연락 시도 여부(당사자 의사 재확인)'],
    review: { date: '2026-11-04', progress: ['밑반찬 지원 주 2회 이용', '방문건강관리 10월 첫 방문', '병원 동행 3회 진행'], result: '식사 횟수 늘었다는 진술. 약 정리표 사용 중.', next: '경제사정 마무리 후 의료비 지원 결정' },
    closure: { residual: ['무릎 통증으로 외출 어려움 지속', '의료비 부담 미해결'], follow: '사후 연락 동의 여부 미확인' },
    documents: [
      { name: '초기상담지', ver: '공통 예시(미승인)', state: '확정', at: '2026-09-02' },
      { name: '사례보고서(판정용)', ver: '공통 예시(미승인)', state: '확정', at: '2026-09-08' },
      { name: '위기도 평가표(별첨)', ver: '척도 v-시연', state: '확정', at: '2026-09-08' },
      { name: '사례회의록', ver: '공통 예시(미승인)', state: '확정', at: '2026-09-09' },
      { name: '서비스계획서', ver: '공통 예시(미승인)', state: '확정', at: '2026-09-10' },
      { name: '점검보고서', ver: '공통 예시(미승인)', state: '검토 요청', at: '2026-11-04' }
    ],
    history: [
      { at: '2026-11-04 16:20', who: '사례관리자 가', what: '점검보고서 초안 작성 → 검토 요청' },
      { at: '2026-10-08 09:10', who: '사례관리자 가', what: '과정기록 정정(사유: 방문 시각 오기). 원 기록 보존' },
      { at: '2026-09-10 17:00', who: '사례관리자 가', what: '서비스계획서 v1 확정(당사자 합의일 2026-09-10)' },
      { at: '2026-09-09 16:00', who: '팀장', what: '사례회의록 확정' },
      { at: '2026-09-08 11:30', who: '사례관리자 가', what: '위기도 16문항 확정(미확인 0)' }
    ]
  };

  const features = [
    ['F01', '업무 홈·내 할 일', 'P0', '시연'], ['F02', '발굴·접수', 'P0', '시연'], ['F03', '초기상담', 'P0', '시연'],
    ['F04', '당사자·가구·사례 원장', 'P0', '시연'], ['F05', '단순사례 관리', 'P0', '시연'], ['F06', '욕구·강점·위기도', 'P0', '시연(문항 원문 필요)'],
    ['F07', '사례보고서·가계도·생태도', 'P0', '일부 시연'], ['F08', '회의·판정·슈퍼비전', 'P0', '시연'], ['F09', '서비스계획·합의', 'P0', '시연'],
    ['F10', '상담·과정기록·녹취', 'P0~P1', '기록 시연, 녹취·AI 비활성'], ['F11', '자원 검색·의뢰·기관 협업', 'P1', '시연'], ['F12', '공모·긴급지원·후원금품', 'P1', '시연'],
    ['F13', '서비스 점검·재사정', 'P0', '시연'], ['F14', '종결·이관·사후관리', 'P0', '시연'], ['F15', '문서·증빙·내보내기', 'P0~P1', '목록만, 출력 비활성'],
    ['F16', '실적·팀 운영', 'P0', '가상 집계'], ['F17', 'AI·Notion·Google·외부 연동', 'P1~P2', '전부 비활성'], ['F18', '관리자·권한·감사·검수', 'P0', '표시만']
  ];

  const integrations = [
    ['Google Sheets', '비활성', '읽기 전용 → 스테이징 → 승인된 제한 쓰기. 시연판에서는 연결하지 않음'],
    ['Notion·TASK', '비활성', '업무 ID·비식별 제목·기한만 검토. 시연판에서는 연결하지 않음'],
    ['AI 초안(녹취 → 양식)', '비활성', '기관 승인 공급자·비식별화·사람 확정 후에만'],
    ['복지자원 찾기 DB', '링크만', '같은 저장소의 공개 자원 화면으로 이동'],
    ['OY-RALS 청소년 평가', '링크만', '척도 분리. 점수를 가져오거나 환산하지 않음'],
    ['OW-DMS 후원관리', '비활성', '서비스 제공 참조 ID·수량만 공유하는 계약 설계 단계'],
    ['희망이음·엔컴', '비활성', '공식 인터페이스 확인 전 직접 제출·자동 로그인 금지']
  ];

  window.CM = { asOf, staff, roles, hotlines, cases, intakes, contacts, services, referralStages, referrals, meetings, programStages, programs, detail, features, integrations };
})();
