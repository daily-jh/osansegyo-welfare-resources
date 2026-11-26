/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
   오산 통합돌봄 길잡이 — 계산 규칙(화면 없이 Node에서도 시험 가능).
   원칙: ① 자격·판정을 내리지 않는다(종합판정은 시·군·구, 법 제12조). ② 입력은 화면 메모리에만 둔다.
   ③ 위급 응답은 다른 결과보다 먼저 보인다. ④ 복합욕구는 '2개 이상 영역'으로 본다
      (복지부 이용안내: 필요한 서비스가 1개만 남으면 종결; 법 제13조 ① 제2호: 2개 이상 기관 연계 방법). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CareModel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const questions = [
    { id: 'h1', domain: 'health', text: '병원에 혼자 가기 어렵거나, 의사·간호사가 집으로 와야 할 만큼 거동이 불편합니다.' },
    { id: 'h2', domain: 'health', text: '최근 3개월 안에 입원했거나 곧 퇴원할 예정입니다.', flag: 'discharge' },
    { id: 'h3', domain: 'health', text: '만성질환이 여러 개이거나 약을 제때 챙기기 어렵습니다.' },
    { id: 'p1', domain: 'prevent', text: '기억력이 눈에 띄게 떨어졌거나 치매 진단을 받았습니다.' },
    { id: 'p2', domain: 'prevent', text: '우울·외로움·정신건강 문제로 생활이 어렵습니다.' },
    { id: 'p3', domain: 'prevent', text: '최근 넘어진 적이 있거나 걷기·근력이 크게 약해졌습니다.' },
    { id: 'l2', domain: 'ltc', text: '씻기·옷 입기·화장실·방 안 이동 중 남의 도움 없이는 어려운 것이 있습니다.' },
    { id: 'd1', domain: 'daily', text: '식사 준비·장보기·청소 같은 집안일을 혼자 하기 어렵습니다.' },
    { id: 'd2', domain: 'daily', text: '끼니를 자주 거르거나 최근 몸무게가 많이 줄었습니다.' },
    { id: 'd3', domain: 'daily', text: '혼자 살거나 낮에 혼자 있어 위급할 때 알릴 사람이 없습니다.', flag: 'alone' },
    { id: 'd4', domain: 'daily', text: '휠체어·보행기 같은 보조기기가 필요합니다.' },
    { id: 'd5', domain: 'daily', text: '누군가의 도움 없이는 집 밖을 걸어 다니기 어렵습니다.', flag: 'outdoor' },
    { id: 'o1', domain: 'housing', text: '문턱·계단·미끄러운 욕실 때문에 집 안에서 넘어질 위험이 있습니다.' },
    { id: 'o2', domain: 'housing', text: '냉난방·위생 등 집 상태가 건강을 해치거나, 살 곳이 불안정합니다.' },
    { id: 'f1', domain: 'family', text: '돌보는 가족이 지쳤거나, 돌봐 줄 가족이 없거나 돌보기 어렵습니다.', flag: 'carerGap' }
  ];

  const ltcOptions = [
    { id: 'grade', label: '등급 있음(1~5등급·인지지원등급)' },
    { id: 'outside', label: '등급외 판정을 받음(A·B)' },
    { id: 'rejected', label: '신청했으나 기각·각하됨' },
    { id: 'pending', label: '등급판정 신청 중' },
    { id: 'none', label: '신청한 적 없음·모름' }
  ];
  /* 개인별지원계획서(별지 제2호서식) 대상자 유형의 노인맞춤돌봄서비스 칸 */
  const oacOptions = [
    { id: 'none', label: '이용 안 함·모름' },
    { id: 'general', label: '일반돌봄군' },
    { id: 'intensive', label: '중점돌봄군' }
  ];

  /* 질문·장기요양 상태별로 먼저 볼 서비스 id(care-data.js services) */
  const suggest = {
    h1: ['H1', 'H2', 'D4'], h2: ['H5', 'D7', 'O3'], h3: ['H4', 'H3', 'H8'],
    p1: ['P2', 'H6', 'F1'], p2: ['P3', 'D9'], p3: ['P5', 'P1', 'O1'],
    l2: ['L1', 'L2', 'D6'], d1: ['D1', 'D7'], d2: ['D3', 'P1'], d3: ['D2', 'D9', 'D1'], d4: ['D5'], d5: ['D4', 'D5', 'H1'],
    o1: ['O1'], o2: ['O2', 'D10'], f1: ['F3', 'D7', 'L2'],
    ltc_grade: ['L2', 'H2'], ltc_outside: ['D1', 'P1'], ltc_rejected: ['D1', 'D7'], ltc_pending: ['D7'], ltc_none: []
  };

  function evaluate(input) {
    const a = input || {};
    const yes = new Set((a.yes || []).filter(id => questions.some(q => q.id === id)));
    const ltc = ltcOptions.some(o => o.id === a.ltc) ? a.ltc : 'none';
    const age65 = a.age === '65+';
    const oac = oacOptions.some(o => o.id === a.oac) ? a.oac : 'none';
    const severe = a.disability === 'severe';
    const anyDisability = severe || a.disability === 'mild';

    const domainSet = new Set();
    questions.forEach(q => { if (yes.has(q.id)) domainSet.add(q.domain); });
    if (ltc === 'grade') domainSet.add('ltc');
    const domainsHit = ['health', 'prevent', 'ltc', 'daily', 'housing', 'family'].filter(d => domainSet.has(d));

    /* 대상 범위(시행령 제2조, 2025.12.9 공포): 판정이 아니라 '상담 시 해당 가능성' 표시 */
    let scope;
    if (age65) scope = { id: 'in', label: '65세 이상: 법의 대상 범위에 들어갈 수 있습니다.' };
    else if (severe) scope = { id: 'in', label: '심한 장애 등록: 복지부장관이 정하는 경우 대상이 됩니다. 2026년에는 의료 필요도가 높은 65세 미만 장애인부터 시작했고, 장애인 신청을 받는 지자체가 차례로 늘고 있습니다.' };
    else if (anyDisability) scope = { id: 'maybe', label: '심하지 않은 장애: 시장·군수·구청장이 복지부와 협의해 인정하는 경우에만 대상이 됩니다. 행정복지센터에 먼저 물어보세요.' };
    else scope = { id: 'maybe', label: '65세 미만·비장애: 취약계층 등으로서 시장·군수·구청장이 복지부와 협의해 인정하는 경우에만 대상이 됩니다. 다른 돌봄 자원도 함께 보세요.' };

    const flags = {
      discharge: yes.has('h2'),
      alone: yes.has('d3'),
      carerGap: yes.has('f1'),
      ltcRejected: ltc === 'rejected',
      ltcOutside: ltc === 'outside',
      ltcGrade: ltc === 'grade'
    };

    /* 1단계 우선지원 대상(복지부 누리집) 단서 */
    const priority = [];
    if (age65 && flags.ltcGrade) priority.push('장기요양 재가급여자(1~5등급·인지지원등급)');
    if (age65 && flags.ltcOutside) priority.push('장기요양 등급외자');
    if (age65 && flags.discharge) priority.push('퇴원환자 등 입원·입소 경계에 있는 어르신');
    if (age65 && oac === 'intensive') priority.push('노인맞춤돌봄서비스 중점돌봄군');
    if (severe && (yes.has('h1') || yes.has('h3') || yes.has('l2'))) priority.push('의료 필요도가 높은 중증장애인(시범)');

    /* 직권 신청 경로(법 제10조 ②, 시행령 제4조: 장기요양 신청 기각, 긴급복지지원법 위기상황 등) — 본인 동의 필요 */
    const exOfficio = [];
    if (flags.ltcRejected) exOfficio.push('장기요양 등급 신청이 기각된 사람');
    if (flags.carerGap && (flags.alone || yes.has('l2'))) exOfficio.push('돌봐 줄 사람이 없는 위기상황 등으로 스스로 신청하기 어려운 사람(긴급복지지원법 위기상황 포함)');
    /* 기관 담당자 신청(시행규칙 제7조): 퇴원하는 의료기관 등 복지부장관이 인정한 기관 담당자가 동의를 받아 신청 */
    const agencyApply = [];
    if (flags.discharge) agencyApply.push('퇴원하는 병원의 담당자(의료사회복지팀 등)가 본인·가족 동의를 받아 신청하거나, 협약병원이면 「퇴원환자 지역사회 연계 서식」으로 시·군·구에 바로 알립니다.');
    if (a.who === 'agency') agencyApply.push('재가노인복지시설·장애인복지관 등 복지부장관이 인정한 기관의 담당자는 본인이나 가족의 동의를 받아 신청할 수 있습니다.');

    const preExamWaived = flags.discharge && a.who === 'agency';

    let level;
    if (a.emergency) level = 'emergency';
    else if (domainsHit.length >= 2) level = 'apply';
    else if (domainsHit.length === 1) level = 'single';
    else level = 'none';

    const headline = {
      emergency: '지금 생명·안전이 위험하면 119·112가 먼저입니다.',
      apply: `어려움이 ${domainsHit.length}개 영역에 걸쳐 있습니다. 통합돌봄 신청 상담을 권합니다.`,
      single: '어려움이 한 영역에 모여 있습니다. 그 영역 서비스부터 바로 연결해 보세요.',
      none: '지금 표시한 어려움은 없습니다. 상태가 바뀌면 다시 확인하세요.'
    }[level];

    const note = {
      emergency: '응급 상황이 정리되면 아래 결과로 통합돌봄 신청을 이어가세요.',
      apply: scope.id === 'in'
        ? '사전조사에서 복합욕구 여부를 가립니다. 실제 대상 여부와 서비스는 시·군·구 종합판정으로 정해집니다.'
        : '대상 범위 밖일 수 있으므로 행정복지센터에서 인정 여부를 먼저 물어보고, 아래 자원도 함께 연결하세요.',
      single: '필요한 서비스가 1개뿐이면 통합돌봄 비해당이나 종결 사유가 될 수 있습니다. 상태가 나빠지면 언제든 다시 신청할 수 있습니다.',
      none: ''
    }[level];

    /* 서비스 후보: 질문 순서 → 장기요양 상태 순, 중복 제거 */
    const ids = [];
    const push = id => { if (!ids.includes(id)) ids.push(id); };
    if (level === 'apply' || level === 'emergency') push('D8');
    questions.forEach(q => { if (yes.has(q.id)) (suggest[q.id] || []).forEach(push); });
    (suggest['ltc_' + ltc] || []).forEach(push);
    if (ltc === 'none' && yes.has('l2') && age65) push('L1');
    if (oac === 'none' && age65 && (yes.has('d1') || yes.has('d3'))) push('D1');

    const applicant = {
      self: '본인이 주소지 행정복지센터나 건보공단 지사에 신청합니다(방문·우편·팩스).',
      family: '배우자·부모·자녀 등 친족이나 후견인이 대신 신청할 수 있습니다. 신청하는 사람의 신분증과 본인의 상황을 알 수 있는 자료를 준비하세요.',
      agency: '복지부장관이 인정한 기관의 담당자는 본인이나 가족의 동의를 받은 뒤 신청합니다. 동의를 받기 어렵고 위기상황이면 행정복지센터에 직권 신청을 요청하세요.'
    }[a.who] || '';

    return { level, headline, note, scope, flags, priority, exOfficio, agencyApply, oac, yesIds: [...yes], preExamWaived, domains: domainsHit, serviceIds: ids, applicant };
  }

  /* 개인별지원계획 초안: 모니터링 날짜(첫 회의 + 1개월, 이후 3개월마다 1년), 연계 점검 */
  function addMonths(iso, n) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const y = +m[1], mo = +m[2] - 1 + n, d = +m[3];
    const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const dt = new Date(Date.UTC(y, mo, Math.min(d, last)));
    return dt.toISOString().slice(0, 10);
  }

  function planReview(plan, services) {
    const p = plan || {};
    const rows = (p.rows || []).filter(r => r && (r.service || r.custom));
    const byId = Object.fromEntries((services || []).map(s => [s.id, s]));
    const domains = new Set(), providers = new Set();
    rows.forEach(r => {
      const s = byId[r.service];
      domains.add(r.domain || (s && s.domain) || '');
      const who = String(r.provider || '').trim();
      if (who) providers.add(who.replace(/\s+/g, ''));
    });
    domains.delete('');
    const warnings = [];
    if (!rows.length) warnings.push('서비스를 한 줄 이상 넣어 주세요.');
    if (rows.length && domains.size < 2) warnings.push('필요한 서비스가 한 영역뿐입니다. 복합욕구가 아니면 통합돌봄 비해당·종결 사유가 될 수 있습니다.');
    if (providers.size >= 2 && !String(p.linkage || '').trim()) warnings.push('2개 이상 기관이 제공하므로 기관 사이 연계 방법(누가 무엇을 언제 알리는지)을 적어야 합니다(법 제13조 ① 제2호).');
    const noProvider = [], noAmount = [];
    rows.forEach((r, i) => {
      if (!String(r.provider || '').trim()) noProvider.push(i + 1);
      if (!String(r.amount || '').trim() || !String(r.period || '').trim()) noAmount.push(i + 1);
    });
    if (noProvider.length) warnings.push(`제공 주체가 빈 줄: ${noProvider.join(', ')}번`);
    if (noAmount.length) warnings.push(`수량·주기나 제공 기간이 빈 줄: ${noAmount.join(', ')}번(법 제13조 ① 제1호)`);
    if (!p.consent) warnings.push('본인 동의 및 보호자 설명을 실시했는지 표시해 주세요(별지 제2호서식, 법 제13조 ②, 제23조).');
    if (!String(p.goal1 || '').trim()) warnings.push('서비스 제공목표 1순위를 적어 주세요(별지 제2호서식).');
    const monitor = [];
    if (p.meeting) {
      monitor.push({ label: '첫 모니터링(1개월 안)', date: addMonths(p.meeting, 1) });
      [4, 7, 10, 13].forEach((n, i) => monitor.push({ label: `정기 모니터링 ${i + 1}회`, date: addMonths(p.meeting, n) }));
    }
    return { count: rows.length, domains: [...domains], providers: providers.size, warnings, monitor, nextReview: monitor.length ? monitor[0].date : '' };
  }

  const CHILD_ONLY = ['영유아', '아동', '청소년'];
  function residence() {
    try { return typeof module === 'object' && module.exports ? require('../assets/residence-v1.js') : (typeof self !== 'undefined' && self.Residence) || null; } catch (_) { return null; }
  }

  /* 복지자원 DB(WELFARE_DATA)에서 서비스별 연결 후보 찾기. 중단·폐지 기관은 뺀다. */
  function matchResources(service, data, opts) {
    const o = opts || {};
    if (!service || !service.match || !data || !Array.isArray(data.organizations)) return [];
    const re = new RegExp(service.match);
    const ex = service.exclude ? new RegExp(service.exclude) : null;
    const out = [];
    data.organizations.forEach(org => {
      if (/중단|폐지/.test(org.status || '')) return;
      (org.services || []).forEach(s => {
        if (/중단|폐지/.test((s.verification && s.verification.status) || '')) return;
        const t = (s.tags && s.tags.target) || [];
        if (t.length && t.every(v => CHILD_ONLY.includes(v))) return;   // 아동·청소년만 대상인 사업은 돌봄통합 후보에서 뺀다
        const text = `${org.name} ${s.name}`;                            // 설명문까지 보면 엉뚱한 사업이 섞여 이름만 본다
        if (ex && ex.test(text)) return;
        if (re.test(text)) out.push({ orgId: org.id, org: org.name, level: org.level, scope: org.scope || org.level, tier: org.tier || '', tierCity: org.tierCity || '', phone: org.phone || '', service: s.name, serviceId: s.id, status: (s.verification && s.verification.status) || '' });
      });
    });
    // 지역 범주 5단계: 오산시 → 인근 시 → 경기도 → 전국 공공 → 전국 민간(tier가 없으면 원본 범주로)
    const rank = { osan: 0, near: 1, gyeonggi: 2, 'national-public': 3, 'national-private': 4 };
    const lv = { '오산시': 0, '경기도': 2, '민간': 3 };
    const r = x => rank[x.tier] ?? lv[x.level] ?? 9;
    out.sort((x, y) => r(x) - r(y) || x.org.localeCompare(y.org, 'ko'));
    /* 사는 동(2026-11-26): OY-RALS와 같은 거주 지역 규칙(residence-v1.js). 다른 동 행정복지센터·다른 권역 복지관은 빼고,
       내 동 창구·그 시 기관을 앞에, 타지역 거주면 오산 기관을 맨 뒤 '오산 기관(참고)'로 둔다. 동을 고르지 않으면 지금과 같다. */
    const RES = residence(), dong = RES ? RES.valid(o.dong) : '';
    let list = out;
    if (dong) list = RES.apply(out, dong).map(x => Object.assign({}, x, { role: RES.role(x, dong), tag: RES.tag(x, dong) }));
    if (o.dedupeOrg) {
      const seen = new Set();
      return list.filter(r => (seen.has(r.orgId) ? false : seen.add(r.orgId)));
    }
    return list;
  }

  /* 자원 지도: 영역 × 범주별 연결 후보 수, 오산 공백 */
  function coverage(careData, data) {
    return careData.domains.map(d => {
      const items = careData.services.filter(s => s.domain === d.id).map(s => {
        const m = matchResources(s, data, { dedupeOrg: true });
        const osan = m.filter(r => r.level === '오산시').length;
        return { id: s.id, name: s.name, channel: s.channel, total: m.length, osan, gap: osan === 0, wider: osan === 0 && m.length > 0, osanNote: s.osan || '' };
      });
      return { domain: d.id, label: d.label, items, gaps: items.filter(i => i.gap).length };
    });
  }

  function careCandidates(payload) {
    const items = (payload && payload.items) || [];
    return items.filter(r => String(r.area || '').split('|').includes('care') && r.change !== '기존과 일치');
  }

  return { questions, ltcOptions, oacOptions, suggest, evaluate, planReview, addMonths, matchResources, coverage, careCandidates };
});
