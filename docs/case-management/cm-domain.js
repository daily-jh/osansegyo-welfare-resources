/* © 2026 오산세교종합사회복지관 김지훈 팀장.
   세교 사례관리 시스템 시연판 — 순수 도메인 규칙 (브라우저·Node 시험 공용, 2026-11-26).
   - 기관 위기도 16문항: 4영역×4문항, 0/1/2/null(미확인), 32점. 문항 문구는 원문 확인 전이라 싣지 않는다.
   - 미확인은 0점이 아니다. 미확인이 있으면 확정 총점·수준을 보류하고 잠정 범위만 보인다.
   - 청소년 OY-RALS 25문항과 합산·환산하지 않는다(이 파일은 OY-RALS criteria.js를 읽지도 고치지도 않는다).
   - 미관리 30일·집계 정의는 '제안 기준'이며 기관 승인 전이다. */
(function (root) {
  'use strict';

  const CORE = [1, 3, 5, 6, 9, 11, 12, 15, 16];
  const CORE_SET = new Set(CORE);
  const DOMAINS = [
    { code: 'family', label: '가족', items: [1, 2, 3, 4] },
    { code: 'health', label: '건강', items: [5, 6, 7, 8] },
    { code: 'housing', label: '주거', items: [9, 10, 11, 12] },
    { code: 'economy', label: '경제', items: [13, 14, 15, 16] }
  ];
  const LEVEL_LABEL = { low: '낮음', medium: '중간', high: '높음', pending: '보류(미확인 있음)' };

  function evaluateRisk16(answers) {
    if (!Array.isArray(answers) || answers.length !== 16 || answers.some(v => !(v === 0 || v === 1 || v === 2 || v === null))) {
      throw new Error('invalid_scale');
    }
    const sum = answers.reduce((s, v) => s + (v === null ? 0 : v), 0);
    const unknown = answers.filter(v => v === null).length;
    const keySevere = answers.filter((v, i) => CORE_SET.has(i + 1) && v === 2).length;
    const keyUnknown = answers.filter((v, i) => CORE_SET.has(i + 1) && v === null).length;
    const level = unknown ? 'pending' : sum <= 10 ? 'low' : sum <= 20 ? 'medium' : 'high';
    return {
      knownSum: sum, min: sum, max: sum + 2 * unknown, unknown,
      confirmedTotal: unknown === 0 ? sum : null,
      level, levelLabel: LEVEL_LABEL[level],
      keySevere, keyUnknown,
      urgentReview: keySevere >= 1,
      immediateAction: keySevere >= 4,
      allUnknown: unknown === 16
    };
  }

  // ---- 사례 상태 (정규화 코드 ↔ 한글 라벨) ----
  const STATES = {
    received: '접수', intake_pending: '초기상담 대기', intake_done: '초기상담 완료',
    simple_active: '단순관리 중', assessment_pending: '사정 중', decision_pending: '판정 대기',
    deferred: '판정 보류', selected: '선정', plan_pending: '계획 수립 중', active: '개입 중',
    review_pending: '점검 대기', transfer_pending: '이관 검토', closure_pending: '종결 검토',
    closed: '종결', followup_active: '사후관리 중', followup_done: '사후관리 완료', withdrawn: '철회'
  };
  // 허용 전이(제안). 화면 시연과 시험에 같은 표를 쓴다.
  const TRANSITIONS = {
    received: ['intake_pending', 'withdrawn'],
    intake_pending: ['intake_done', 'withdrawn'],
    intake_done: ['simple_active', 'assessment_pending', 'closed'],
    simple_active: ['assessment_pending', 'closure_pending'],
    assessment_pending: ['decision_pending'],
    decision_pending: ['selected', 'deferred', 'transfer_pending', 'closed'],
    deferred: ['assessment_pending'],
    selected: ['plan_pending'],
    plan_pending: ['active'],
    active: ['review_pending'],
    review_pending: ['active', 'plan_pending', 'closure_pending', 'transfer_pending'],
    transfer_pending: ['closed'],
    closure_pending: ['closed', 'active'],
    closed: ['followup_active'],
    followup_active: ['followup_done'],
    followup_done: [],
    withdrawn: []
  };
  function canTransition(from, to) { return (TRANSITIONS[from] || []).includes(to); }

  const ACTIVE_STATES = new Set(['simple_active', 'assessment_pending', 'decision_pending', 'selected', 'plan_pending', 'active', 'review_pending']);

  // ---- 날짜 (KST 날짜 문자열 YYYY-MM-DD 기준) ----
  function dayNum(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; }
  function daysBetween(a, b) { return dayNum(b) - dayNum(a); }

  // 미관리 30일(제안 기준): 활성 사례 중 마지막 '완료된' 관리 활동(없으면 접수일)부터 기준일까지 30일 이상.
  function lastManaged(caseRow, contacts) {
    const done = contacts.filter(c => c.caseId === caseRow.id && c.result === 'completed').map(c => c.date).sort();
    return done.length ? done[done.length - 1] : null;
  }
  function unmanaged(caseRow, contacts, asOf, limit) {
    if (!ACTIVE_STATES.has(caseRow.state)) return { flag: false, days: null, base: null };
    const lm = lastManaged(caseRow, contacts);
    const base = lm || caseRow.received;
    const days = daysBetween(base, asOf);
    return { flag: days >= (limit || 30), days, base, fromReceived: !lm };
  }

  // ---- 실적 집계: 상담과 서비스 제공을 분리, contact_id 단위 중복 제거 ----
  function metrics(data, opt) {
    const month = opt && opt.month; const staff = opt && opt.staff;
    const inScope = (date, st) => (!month || date.slice(0, 7) === month) && (!staff || st === staff);
    const contacts = data.contacts.filter(c => inScope(c.date, c.staff));
    const completed = contacts.filter(c => c.result === 'completed');
    const ids = new Set(completed.map(c => c.id));
    const byMode = {};
    completed.forEach(c => { byMode[c.mode] = (byMode[c.mode] || 0) + 1; });
    const services = data.services.filter(s => inScope(s.date, s.staff) && s.status === 'provided');
    const svcByUnit = {};
    services.forEach(s => { const k = s.unit; svcByUnit[k] = (svcByUnit[k] || 0) + s.qty; });
    const intakes = data.intakes.filter(i => inScope(i.received, i.staff));
    const referrals = data.referrals.filter(r => inScope(r.date, r.staff));
    const refStage = {};
    referrals.forEach(r => { refStage[r.stage] = (refStage[r.stage] || 0) + 1; });
    const people = new Set(completed.map(c => c.caseId));
    return {
      intakes: intakes.length,
      contactsCompleted: ids.size,
      contactsNotCompleted: contacts.length - completed.length,
      byMode, servicesProvided: services.length, svcByUnit,
      referralsByStage: refStage,
      distinctCases: people.size
    };
  }

  // ---- 공개 시연판 입력 보호: 실제 정보처럼 보이는 값 차단 ----
  const REAL_PATTERNS = [
    { re: /\d{6}\s*[-–]\s*[1-8]\d{6}/, why: '주민등록번호 형식' },
    { re: /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/, why: '휴대전화 번호 형식' },
    { re: /0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}/, why: '전화번호 형식' },
    { re: /\d{2,6}-\d{2,6}-\d{2,8}/, why: '계좌번호 형식' },
    { re: /[가-힣]+(로|길)\s?\d+/, why: '도로명 주소 형식' },
    { re: /@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, why: '전자우편 주소' }
  ];
  function looksReal(text) {
    const s = String(text || '');
    const hit = REAL_PATTERNS.find(p => p.re.test(s));
    return hit ? hit.why : null;
  }

  const api = { CORE, DOMAINS, LEVEL_LABEL, evaluateRisk16, STATES, TRANSITIONS, canTransition, ACTIVE_STATES, daysBetween, lastManaged, unmanaged, metrics, looksReal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CMDomain = api;
})(typeof self !== 'undefined' ? self : this);
