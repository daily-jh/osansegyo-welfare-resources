/* © 2026 오산세교종합사회복지관 김지훈 팀장.
   세교 사례관리 시스템 시연판 v0.2 — 대시보드형 화면 (2026-11-26).
   - 저장·전송 없음: 브라우저 저장소와 네트워크 요청을 쓰지 않는다(tests/case-management.cjs가 검사). 새로고침하면 처음 상태로 돌아간다.
   - 권한 전환은 화면 시연일 뿐 보안 기능이 아니다(실제 권한 검사는 내부 서버판에서). */
(function () {
  'use strict';
  const C = window.CM, D = window.CMDomain;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const staffName = id => (C.staff.find(s => s.id === id) || { name: '미배정' }).name;
  const caseById = id => C.cases.find(c => c.id === id);
  const fmtDate = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); const w = '일월화수목금토'[new Date(Date.UTC(+y, m - 1, +d)).getUTCDay()]; return `${+m}.${+d}(${w})`; };

  const TONE = {
    '확인': 'ok', '확정': 'ok', '결정': 'ok', '이용': 'ok', '결과 점검': 'ok', '완료': 'ok', '선정': 'ok', '통과': 'ok', '지급 확인': 'ok',
    '미확인': 'warn', '초안': 'warn', '검토 요청': 'warn', '안건 초안': 'warn', '검토 중': 'warn', '예정': 'info', '해당 없음': 'muted', '없음': 'muted',
    '상충': 'bad', '확인 필요': 'bad', '보류(미확인 있음)': 'warn', '높음': 'bad', '중간': 'warn', '낮음': 'ok'
  };
  const chip = (t, tone) => `<span class="chip ${tone || TONE[t] || 'muted'}">${esc(t)}</span>`;
  const stateChip = s => chip(D.STATES[s] || s, s === 'closed' || s === 'followup_done' ? 'muted' : s === 'decision_pending' || s === 'assessment_pending' || s === 'plan_pending' ? 'warn' : 'info');
  const typeChip = t => chip(t, t === '집중' ? 'bad' : t === '일반' ? 'info' : 'muted');

  // ---- 메모리 상태(저장 안 함) ----
  const state = { role: 'lead', me: 'S1', risk: {}, newIntakes: 0, fixed: false };
  C.cases.forEach(c => { if (c.risk) state.risk[c.id] = c.risk.slice(); });

  const ROLE_CAN = {
    lead: { cases: 'all', detail: true, counsel: true, intake: true, programs: true, confirm: true, admin: true },
    manager: { cases: 'mine', detail: true, counsel: true, intake: false, programs: true, confirm: false, admin: false },
    intake: { cases: 'intake', detail: true, counsel: true, intake: true, programs: false, confirm: false, admin: false },
    accounting: { cases: 'none', detail: false, counsel: false, intake: false, programs: true, confirm: false, admin: false }
  };
  const can = k => ROLE_CAN[state.role][k];
  function visibleCases() {
    const r = ROLE_CAN[state.role].cases;
    if (r === 'all') return C.cases;
    if (r === 'mine') return C.cases.filter(c => c.staff === state.me);
    if (r === 'intake') return C.cases.filter(c => ['intake_done', 'intake_pending', 'received'].includes(c.state) || c.staff === 'S3');
    return [];
  }

  const NAV = [
    { id: 'home', label: '업무 홈', ico: '⌂' },
    { id: 'intake', label: '접수·인테이크', ico: '＋' },
    { id: 'cases', label: '사례관리', ico: '▤', sub: [['cases?type=단순', '단순'], ['cases?type=일반', '일반'], ['cases?type=집중', '집중'], ['cases?state=closed', '종결']] },
    { id: 'meetings', label: '회의·슈퍼비전', ico: '◎' },
    { id: 'resources', label: '서비스·자원 연계', ico: '⇄' },
    { id: 'programs', label: '지원사업', ico: '₩' },
    { id: 'reports', label: '실적·보고', ico: '▥' },
    { id: 'docs', label: '문서함', ico: '▧' },
    { id: 'admin', label: '관리자', ico: '⚙' },
    { id: 'guide', label: '시스템 안내', ico: 'ⓘ' }
  ];
  const TABBAR = [['home', '홈', '⌂'], ['cases', '사례', '▤'], ['intake/new', '접수', '＋'], ['meetings', '회의', '◎'], ['guide', '안내', 'ⓘ']];

  // ---- 계산 ----
  function riskOf(id) { const a = state.risk[id]; return a ? D.evaluateRisk16(a) : null; }
  function unmanagedOf(c) { return D.unmanaged(c, C.contacts, C.asOf, 30); }
  function kpis(list) {
    const active = list.filter(c => D.ACTIVE_STATES.has(c.state));
    const due = list.filter(c => c.nextDue && D.daysBetween(C.asOf, c.nextDue) >= 0 && D.daysBetween(C.asOf, c.nextDue) <= 3);
    const overdue = list.filter(c => c.nextDue && D.daysBetween(C.asOf, c.nextDue) < 0);
    const un = list.filter(c => unmanagedOf(c).flag);
    const waitMeeting = C.meetings.filter(m => m.status === '예정').reduce((n, m) => n + m.agendas.filter(a => list.some(c => c.id === a.caseId)).length, 0);
    const unassigned = C.intakes.filter(i => !i.staff).length + state.newIntakes;
    const newIn = C.intakes.filter(i => i.received.slice(0, 7) === C.asOf.slice(0, 7)).length + state.newIntakes;
    const byType = t => active.filter(c => c.type === t).length;
    return { active, due, overdue, un, waitMeeting, unassigned, newIn, byType };
  }

  // ---- 화면 ----
  const views = {};

  views.home = () => {
    const list = visibleCases();
    const k = kpis(list);
    const safety = list.filter(c => c.safety);
    const urgent = list.filter(c => { const r = riskOf(c.id); return r && (r.urgentReview || r.keyUnknown); });
    const todo = [];
    k.overdue.forEach(c => todo.push({ c, t: `기한 지남: ${c.next}`, tone: 'bad' }));
    k.due.forEach(c => todo.push({ c, t: c.next, tone: 'warn' }));
    k.un.forEach(c => todo.push({ c, t: `미관리 ${unmanagedOf(c).days}일: 연락·관리 기록 필요`, tone: 'warn' }));
    const week = ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'];
    const events = [
      { d: '2026-11-24', t: '가정방문 DEMO-0005', k: 'visit' }, { d: '2026-11-25', t: '난방 물품 전달 DEMO-0006', k: 'svc' },
      { d: '2026-11-26', t: '안전 확인 후속 DEMO-0005', k: 'safe' }, { d: '2026-11-26', t: '안부 전화 DEMO-0001', k: 'call' },
      { d: '2026-11-27', t: '계획 합의 DEMO-0002', k: 'visit' }, { d: '2026-11-27', t: '재접수 보고 DEMO-0008', k: 'meet' }, { d: '2026-11-23', t: '팀 주간회의', k: 'meet' }
    ];
    const cards = [
      ['신규 접수', k.newIn, '이번 달', 'intake', true],
      ['배정 대기', k.unassigned, '담당 지정 필요', 'intake?only=wait'],
      ['진행 중', k.active.length, `단순 ${k.byType('단순')} · 일반 ${k.byType('일반')} · 집중 ${k.byType('집중')}`, 'cases?active=1'],
      ['기한 도래', k.due.length + k.overdue.length, `3일 안 ${k.due.length} · 지남 ${k.overdue.length}`, 'cases?due=1'],
      ['미관리 30일', k.un.length, '제안 기준(확정 전)', 'cases?un=1'],
      ['회의 대기', k.waitMeeting, '다음 판정회의 안건', 'meetings']
    ];
    return `
      <div class="greet"><div><p class="eyebrow">오늘의 사례관리 · 기준일 ${esc(C.asOf)}(시연)</p><h1>${esc(roleLabel())} 화면입니다</h1><p class="sub">카드를 누르면 같은 조건의 목록으로 갑니다. 안전 위기는 기한·점수와 따로 맨 위에 보여 줍니다.</p></div></div>
      ${safety.length ? `<section class="alert-safe" aria-label="안전 확인 필요"><h2>⚠ 안전 확인 필요 <small>점수·기한·회의를 기다리지 않음</small></h2><ul>${safety.map(c => `<li><a href="#case/${c.id}">${esc(c.id)}</a> ${esc(c.safety.text)} <span class="meta">${esc(c.safety.by)} · ${esc(c.safety.at)}</span> ${chip(c.safety.state)}</li>`).join('')}</ul><p class="hot">${C.hotlines.map(h => `<a href="tel:${h.tel}"><b>${h.num}</b> ${esc(h.label)}</a>`).join('')}</p></section>` : ''}
      <section class="kpis">${cards.map(([t, n, s, href, hi]) => `<a class="kpi${hi ? ' hi' : ''}" href="#${href}"><b>${n}<small>건</small></b><span>${esc(t)}</span><em>${esc(s)}</em></a>`).join('')}</section>
      <div class="grid-home">
        <section class="box"><div class="box-h"><h2>내가 할 일 <span class="count">${todo.length}</span></h2><span class="hint">눌러서 사례로 이동</span></div>
          ${todo.length ? `<ul class="todo">${todo.map(x => `<li class="${x.tone}"><a href="#case/${x.c.id}"><b>${esc(x.c.id)}</b> ${esc(x.t)}</a><span>${x.c.nextDue ? fmtDate(x.c.nextDue) : ''}</span></li>`).join('')}</ul>` : '<p class="empty">지금 처리할 일이 없습니다.</p>'}
          ${urgent.length ? `<h3 class="mini">위기도 확인 필요</h3><ul class="todo">${urgent.map(c => { const r = riskOf(c.id); return `<li class="${r.urgentReview ? 'bad' : 'warn'}"><a href="#case/${c.id}/assess"><b>${esc(c.id)}</b> ${r.urgentReview ? `핵심문항 2점 ${r.keySevere}개 → 긴급개입 검토` : `핵심문항 미확인 ${r.keyUnknown}개`}</a><span>${r.confirmedTotal != null ? r.confirmedTotal + '점' : `${r.min}~${r.max}점`}</span></li>`; }).join('')}</ul>` : ''}
        </section>
        <section class="box"><div class="box-h"><h2>이번 주 일정</h2><span class="hint">11.23 ~ 11.27 · 상세 주소·실명 표시 안 함</span></div>
          <div class="week">${week.map(d => `<div class="day${d === C.asOf ? ' today' : ''}"><b>${fmtDate(d)}</b>${events.filter(e => e.d === d).map(e => `<span class="ev ${e.k}">${esc(e.t)}</span>`).join('') || '<span class="ev none">—</span>'}</div>`).join('')}</div>
        </section>
        <section class="box"><div class="box-h"><h2>공지</h2></div>
          <ul class="notice"><li>${chip('안내', 'info')} 공개 시연판입니다. 모든 사례는 합성 자료입니다.<span>11.26</span></li><li>${chip('확인', 'warn')} 위기도 16문항 문구는 원문 확인 전이라 번호와 영역만 표시합니다.<span>11.26</span></li><li>${chip('기준', 'muted')} 미관리 30일·실적 집계는 제안 기준이며 기관 승인 전입니다.<span>11.26</span></li></ul>
        </section>
        <section class="box"><div class="box-h"><h2>바로가기</h2></div>
          <div class="shortcuts">${[['intake/new', '＋', '신규 접수'], ['cases', '▤', '사례 목록'], ['meetings', '◎', '회의 안건'], ['resources', '⇄', '자원 연계'], ['reports', '▥', '월별 실적'], ['../', '⌕', '복지자원 찾기']].map(([h, i, t]) => `<a href="${h.startsWith('..') ? h : '#' + h}"><span aria-hidden="true">${i}</span>${esc(t)}</a>`).join('')}</div>
        </section>
      </div>`;
  };

  views.intake = (q) => {
    if (!can('intake') && !can('cases')) return denied('접수');
    const rows = C.intakes.filter(i => q.only !== 'wait' || !i.staff);
    const form = `<section class="box" id="newIntake"><div class="box-h"><h2>새 접수 (시연)</h2><span class="hint">이름·연락처·주소·주민번호는 받지 않습니다</span></div>
      <form class="form" id="intakeForm" autocomplete="off" novalidate>
        <label>가명 이니셜<input name="alias" maxlength="6" placeholder="예: 가상 H" required></label>
        <label>발굴·의뢰 경로<select name="route">${['본인/가족', '전직원 발굴', '좋은이웃들', '읍면동', '타기관', '기타'].map(o => `<option>${o}</option>`).join('')}</select></label>
        <label>주요 문제<select name="problem">${['경제', '주거', '건강', '정신건강', '부채', '돌봄', '교육', '기타'].map(o => `<option>${o}</option>`).join('')}</select></label>
        <label class="wide">주 호소(지어낸 내용만)<textarea name="ask" rows="2" maxlength="200" placeholder="예: 겨울 난방비가 걱정된다고 말함(가상)"></textarea></label>
        <label class="check wide"><input type="checkbox" name="safe"> 첫 안전 확인을 했습니다(위험이 보이면 접수보다 신고·응급 연결이 먼저)</label>
        <div class="wide actions"><button class="btn primary" type="submit">접수 등록(메모리)</button><span id="intakeMsg" class="form-msg" aria-live="polite"></span></div>
      </form></section>`;
    return `<div class="page-h"><h1>접수·인테이크</h1><p>전직원 발굴부터 초기상담·배정까지. 접수번호와 사례번호는 따로 둡니다.</p></div>
      ${can('intake') ? form : ''}
      <section class="box"><div class="box-h"><h2>접수대장 <span class="count">${rows.length + state.newIntakes}</span></h2><div class="filters"><a class="fbtn${q.only !== 'wait' ? ' on' : ''}" href="#intake">전체</a><a class="fbtn${q.only === 'wait' ? ' on' : ''}" href="#intake?only=wait">배정 대기</a></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>접수번호</th><th>접수일</th><th>경로</th><th>주요 문제</th><th>담당</th><th>진행</th><th>사례 회차</th></tr></thead><tbody id="intakeRows">
      ${rows.map(i => `<tr><td>${esc(i.id)}</td><td>${esc(i.received)}</td><td>${esc(i.route)}</td><td>${esc(i.problem)}</td><td>${i.staff ? esc(staffName(i.staff)) : chip('배정 대기', 'warn')}</td><td>${esc(i.state)}${i.note ? `<small class="note">${esc(i.note)}</small>` : ''}</td><td>${i.caseId ? `<a href="#case/${i.caseId}">${esc(i.caseId)}</a>` : '—'}</td></tr>`).join('')}
      </tbody></table></div></section>
      <section class="box"><div class="box-h"><h2>초기상담지 구성</h2><span class="hint">9개 상담내용 항목 · 기본정보·가족표는 원양식 그대로 둠</span></div>
      <ol class="nine">${['가정환경', '건강사항', '경제사항(수입→지출→부채→재산→기타)', '주거환경', '사회심리 및 관계', '주요 문제 및 욕구', '강점 및 자원', '상담자 종합의견', '결과 및 향후계획'].map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>`;
  };

  views.cases = (q) => {
    if (!can('detail')) return denied('사례 목록');
    let list = visibleCases();
    if (q.type) list = list.filter(c => c.type === q.type && c.state !== 'closed');
    if (q.state) list = list.filter(c => c.state === q.state);
    if (q.active) list = list.filter(c => D.ACTIVE_STATES.has(c.state));
    if (q.un) list = list.filter(c => unmanagedOf(c).flag);
    if (q.due) list = list.filter(c => c.nextDue && D.daysBetween(C.asOf, c.nextDue) <= 3);
    if (q.staff) list = list.filter(c => c.staff === q.staff);
    const label = q.type ? `${q.type} 사례` : q.state === 'closed' ? '종결 사례' : q.active ? '진행 중' : q.un ? '미관리 30일' : q.due ? '기한 도래' : '전체 사례';
    return `<div class="page-h"><h1>사례관리 <small>${esc(label)}</small></h1><p>${state.role === 'manager' ? '사례관리자 권한: 내게 배정된 사례만 보입니다.' : state.role === 'intake' ? '인테이크 권한: 초기상담 범위 사례만 보입니다.' : '팀장 권한: 팀 전체 사례가 보입니다.'} 유형(단순·일반·집중)·진행상태·위기도는 서로 다른 칸입니다.</p></div>
      <div class="filterbar">${[['', '전체'], ['type=단순', '단순'], ['type=일반', '일반'], ['type=집중', '집중'], ['active=1', '진행 중'], ['due=1', '기한 도래'], ['un=1', '미관리 30일'], ['state=closed', '종결']].map(([f, t]) => `<a class="fbtn${(new URLSearchParams(f).toString() === new URLSearchParams(q).toString()) ? ' on' : ''}" href="#cases${f ? '?' + f : ''}">${t}</a>`).join('')}</div>
      <section class="box flush"><div class="tbl-wrap"><table class="tbl dense"><thead><tr><th>사례번호</th><th>당사자</th><th>유형</th><th>진행상태</th><th>담당</th><th>위기도(16)</th><th>마지막 관리</th><th>다음 조치</th><th>문서</th></tr></thead><tbody>
      ${list.map(c => { const r = riskOf(c.id); const u = unmanagedOf(c); const lm = D.lastManaged(c, C.contacts); return `<tr><td><a href="#case/${c.id}"><b>${esc(c.id)}</b></a>${c.prior ? `<small class="note">이전 회차 ${esc(c.prior)}</small>` : ''}</td><td>${esc(c.who)} <small class="note">${esc(c.age)} · ${esc(c.hh)}</small></td><td>${typeChip(c.type)}</td><td>${stateChip(c.state)}${c.safety ? ' ' + chip('안전 확인', 'bad') : ''}</td><td>${esc(staffName(c.staff))}</td><td>${r ? riskCell(r) : '<span class="muted">—</span>'}</td><td>${lm ? fmtDate(lm) : '<span class="muted">기록 없음</span>'}${u.flag ? ' ' + chip(`미관리 ${u.days}일`, 'warn') : ''}</td><td>${esc(c.next)}${c.nextDue ? `<small class="note">${fmtDate(c.nextDue)}</small>` : ''}</td><td>보고서 ${chip(c.docs.report)} 계획 ${chip(c.docs.plan)}</td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">조건에 맞는 사례가 없습니다.</td></tr>'}
      </tbody></table></div></section>`;
  };

  function riskCell(r) {
    if (r.confirmedTotal != null) return `${r.confirmedTotal}점 ${chip(r.levelLabel)}${r.urgentReview ? ' ' + chip('핵심 2점 ' + r.keySevere, 'bad') : ''}`;
    return `${r.min}~${r.max}점 ${chip('보류(미확인 있음)')}${r.urgentReview ? ' ' + chip('핵심 2점 ' + r.keySevere, 'bad') : ''}`;
  }

  // ---- 사례 상세 ----
  const CASE_TABS = [['overview', '개요'], ['basic', '기본정보·가구'], ['assess', '사정·척도'], ['eco', '가계·생태도'], ['plan', '서비스계획'], ['contacts', '상담·지원·연계'], ['meeting', '회의'], ['review', '점검·종결'], ['docs', '문서·증빙'], ['history', '변경이력']];

  views.case = (q, id, tab) => {
    const c = caseById(id);
    if (!c) return `<div class="page-h"><h1>사례를 찾을 수 없습니다</h1></div>`;
    if (!can('detail')) return denied('사례 상세', '회계 담당은 상담·사정·가계도를 기본으로 보지 않습니다. 지원사업 화면에서 지급 요청에 필요한 최소 정보만 봅니다.');
    if (!visibleCases().includes(c)) return denied('이 사례', '배정되지 않은 사례입니다. 실제 운영판에서는 서버가 접근을 막고 사례 존재 여부도 드러내지 않습니다.');
    tab = tab || 'overview';
    const r = riskOf(c.id); const u = unmanagedOf(c); const lm = D.lastManaged(c, C.contacts);
    const head = `<div class="case-head">
        <div><p class="eyebrow"><a href="#cases">사례관리</a> › ${esc(c.id)}</p><h1>${esc(c.id)} <small>${esc(c.who)} · ${esc(c.age)} · ${esc(c.hh)}</small></h1>
        <p class="tags">${typeChip(c.type)} ${stateChip(c.state)} ${c.safety ? chip('안전 확인 필요', 'bad') : ''} ${c.prior ? chip('재접수 · 이전 ' + c.prior, 'info') : ''} ${c.converted ? chip(`${c.converted.from}→${c.converted.to} 전환 ${c.converted.on}`, 'info') : ''}</p></div>
        <dl class="facts"><div><dt>담당</dt><dd>${esc(staffName(c.staff))}</dd></div><div><dt>위기도</dt><dd>${r ? riskCell(r) : '—'}</dd></div><div><dt>마지막 관리</dt><dd>${lm ? fmtDate(lm) : '기록 없음'}${u.flag ? ' ' + chip('미관리 ' + u.days + '일', 'warn') : ''}</dd></div><div><dt>다음 조치</dt><dd>${esc(c.next)} ${c.nextDue ? fmtDate(c.nextDue) : ''}</dd></div><div><dt>저장</dt><dd>${chip('저장 안 됨(시연)', 'muted')}</dd></div></dl>
      </div>
      <nav class="ctabs" role="tablist" aria-label="사례 탭">${CASE_TABS.map(([t, l]) => `<a role="tab" href="#case/${c.id}/${t}" aria-selected="${t === tab}">${l}</a>`).join('')}</nav>`;
    const body = (caseTabs[tab] || caseTabs.overview)(c);
    const actions = `<div class="actionbar"><button class="btn" data-toast="임시저장은 시연판에서 저장하지 않습니다.">임시저장</button><button class="btn" data-toast="검토 요청을 보냈다고 가정합니다(시연).">검토 요청</button><button class="btn primary" ${can('confirm') ? '' : 'disabled title="확정은 권한자만"'} data-toast="확정하면 수정 대신 사유 있는 정정만 가능합니다(시연).">확정</button><button class="btn" data-toast="문서 출력은 원양식 대조 후 제공합니다.">문서 미리보기</button></div>`;
    return head + `<div class="case-body">${body}</div>` + actions;
  };

  const caseTabs = {
    overview(c) {
      const recent = C.contacts.filter(x => x.caseId === c.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      const refs = C.referrals.filter(x => x.caseId === c.id);
      const ag = C.meetings.flatMap(m => m.agendas.filter(a => a.caseId === c.id).map(a => ({ m, a })));
      return `<div class="grid2">
        <section class="box"><div class="box-h"><h2>최근 접촉 기록 3건</h2><a class="hint" href="#case/${c.id}/contacts">전체</a></div>${recent.length ? `<ul class="timeline">${recent.map(x => `<li><b>${fmtDate(x.date)} · ${esc(x.mode)}</b> ${contactChip(x.result)}<p>${can('counsel') ? esc(x.text) : '상담 내용 비노출'}</p></li>`).join('')}</ul>` : '<p class="empty">기록 없음</p>'}</section>
        <section class="box"><div class="box-h"><h2>미처리 행동</h2></div><ul class="todo">
          ${c.nextDue ? `<li class="${D.daysBetween(C.asOf, c.nextDue) < 0 ? 'bad' : 'warn'}"><span>${esc(c.next)}</span><span>${fmtDate(c.nextDue)}</span></li>` : ''}
          ${refs.filter(x => !['이용', '결과 점검'].includes(x.stage)).map(x => `<li class="info"><span>연계 ${esc(x.need)} · ${esc(x.stage)}</span><span>${fmtDate(x.checked)}</span></li>`).join('')}
          ${ag.filter(x => !x.a.decision).map(x => `<li class="info"><span>${esc(x.m.type)} 안건 상정 예정</span><span>${fmtDate(x.m.date)}</span></li>`).join('')}
          ${(c.safety ? `<li class="bad"><span>안전 확인: ${esc(c.safety.text)}</span><span>${esc(c.safety.at)}</span></li>` : '')}
        </ul></section></div>
        ${c.detail ? `<section class="box"><div class="box-h"><h2>문서 일관성 검사</h2><a class="hint" href="#case/${c.id}/docs">자세히</a></div>${consistencySummary()}</section>` : ''}`;
    },
    basic(c) {
      const d = c.detail ? C.detail : null;
      return `<div class="grid2"><section class="box"><div class="box-h"><h2>기본정보</h2><span class="hint">연락처·주소·생년월일은 마스킹(시연은 없음)</span></div>
        <dl class="kv"><dt>당사자</dt><dd>${esc(c.who)}</dd><dt>연령대</dt><dd>${esc(c.age)}</dd><dt>가구형태</dt><dd>${esc(c.hh)}</dd><dt>권역</dt><dd>${esc(c.dong)}</dd><dt>연락처</dt><dd>●●●-●●●●-●●●● <small class="note">열람 사유 기록 후 해제(운영판)</small></dd><dt>보장구분</dt><dd>${chip('미확인')} <small class="note">가구형태와 별도 관리</small></dd><dt>접수일</dt><dd>${esc(c.received)}</dd></dl></section>
        <section class="box"><div class="box-h"><h2>경제사항</h2><span class="hint">수입 → 지출 → 부채 → 재산 → 기타 순서 고정</span></div>
        ${d ? `<table class="tbl"><thead><tr><th>항목</th><th>금액</th><th>주기</th><th>비고</th></tr></thead><tbody>${d.economy.map(e => `<tr><td>${esc(e.item)}</td><td>${e.value == null ? chip('미확인') : esc(e.value)}</td><td>${esc(e.period)}</td><td>${esc(e.note)}</td></tr>`).join('')}</tbody></table><p class="hint">빈 금액은 0원이 아니라 미확인입니다.</p>` : '<p class="empty">이 사례는 경제사정 기록 전입니다.</p>'}</section></div>
        ${d ? `<section class="box"><div class="box-h"><h2>초기상담지 9개 항목</h2><span class="hint">${esc(d.intake.date)} · ${esc(d.intake.route)}</span></div><ol class="nine full">${d.intake.sections.map(([t, v]) => `<li><b>${esc(t)}</b><p>${esc(v)}</p></li>`).join('')}</ol></section>` : ''}`;
    },
    assess(c) {
      const a = state.risk[c.id];
      const d = c.detail ? C.detail : null;
      const scale = a ? riskEditor(c.id, a) : `<p class="empty">이 사례는 위기도 평가 전입니다. <button class="btn" data-start-risk="${c.id}">16문항 평가 시작(전부 미확인)</button></p>`;
      return `<section class="box"><div class="box-h"><h2>기관 위기도 16문항</h2><span class="hint">0 해당 없음 · 1 보통 · 2 심각 · ? 미확인 · 32점 만점</span></div>
        <p class="warnline">문항 문구는 기관 양식 원문 확인 전이라 번호와 영역만 표시합니다. 청소년 OY-RALS 25문항 점수와 합치거나 바꿔 계산하지 않습니다. 점수와 별개로 지금 안전 문제가 보이면 기관 안전 절차가 먼저입니다.</p>
        <div id="riskBox">${scale}</div></section>
        ${d ? `<section class="box"><div class="box-h"><h2>10대 욕구영역 사정</h2><span class="hint">영역 분류가 척도 점수를 정하지 않음</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>영역</th><th>내용</th><th>근거 구분</th><th>상태</th></tr></thead><tbody>${d.domains.map(x => `<tr><td>${esc(x.area)}</td><td>${esc(x.text)}</td><td>${esc(x.kind)}</td><td>${chip(x.state)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}`;
    },
    eco(c) {
      if (!c.detail) return '<section class="box"><p class="empty">가계도·생태도는 사정 단계에서 작성합니다. 대표 사례 <a href="#case/DEMO-0003/eco">DEMO-0003</a>을 보세요.</p></section>';
      return `<section class="box"><div class="box-h"><h2>생태도</h2><span class="hint">확인된 관계만 · 실선 현재 이용 · 점선 후보 · 회색 과거 · 물결 약함/미확인</span></div>${ecoSvg(C.detail.eco)}
        <ul class="legend">${C.detail.eco.map(e => `<li>${esc(e.label)}: ${esc(e.note)}</li>`).join('')}</ul></section>`;
    },
    plan(c) {
      if (!c.detail) return `<section class="box"><p class="empty">서비스계획 ${esc(c.docs.plan)} 상태입니다. 대표 사례 <a href="#case/DEMO-0003/plan">DEMO-0003</a>을 보세요.</p></section>`;
      const s = caseFile();
      return `<section class="box"><div class="box-h"><h2>서비스계획 v1</h2><span class="hint">당사자 합의 2026-09-10 · 목표 = 기대 변화 + 구체 개입</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>기대 변화(Outcome)</th><th>개입(Action)</th><th>회의 근거</th><th>측정</th><th>담당·기한</th></tr></thead><tbody>${s.plan.map(p => `<tr><td>${p.goal}</td><td><b>${esc(p.outcome)}</b></td><td>${esc(p.action)}</td><td>${p.basis ? esc(p.basis) : chip('확인 필요')}</td><td>${p.measure ? esc(p.measure) : chip('확인 필요')}</td><td>${esc(p.owner)} · ${esc(p.due)}</td></tr>`).join('')}</tbody></table></div></section>`;
    },
    contacts(c) {
      const cs = C.contacts.filter(x => x.caseId === c.id).sort((a, b) => b.date.localeCompare(a.date));
      const sv = C.services.filter(x => x.caseId === c.id);
      const rf = C.referrals.filter(x => x.caseId === c.id);
      return `<section class="box"><div class="box-h"><h2>상담·접촉 기록</h2><span class="hint">연락 실패·취소·예정은 상담 건수에 넣지 않음</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>일자</th><th>방식</th><th>결과</th><th>담당</th><th>내용</th></tr></thead><tbody>${cs.map(x => `<tr><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td>${contactChip(x.result)}</td><td>${esc(staffName(x.staff))}</td><td>${can('counsel') ? esc(x.text) : '비노출'}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">기록 없음</td></tr>'}</tbody></table></div></section>
        <div class="grid2"><section class="box"><div class="box-h"><h2>서비스 제공</h2><span class="hint">상담과 따로 집계</span></div>${sv.length ? `<ul class="timeline">${sv.map(x => `<li><b>${fmtDate(x.date)} · ${esc(x.kind)}</b> ${chip(x.status === 'provided' ? '제공' : '예정', x.status === 'provided' ? 'ok' : 'info')}<p>${x.contactId ? `같은 방문(${esc(x.contactId)})에서 상담과 함께. 상담 1건 + 제공 1건으로 각각 집계` : '단독 제공'}</p></li>`).join('')}</ul>` : '<p class="empty">없음</p>'}</section>
        <section class="box"><div class="box-h"><h2>기관 연계</h2><a class="hint" href="#resources">연계 보드</a></div>${rf.length ? `<ul class="timeline">${rf.map(x => `<li><b>${esc(x.need)} → ${esc(x.org)}</b> ${chip(x.stage, ['이용', '결과 점검'].includes(x.stage) ? 'ok' : 'info')}<p>확인일 ${esc(x.checked)}</p></li>`).join('')}</ul>` : '<p class="empty">없음</p>'}</section></div>`;
    },
    meeting(c) {
      const ag = C.meetings.flatMap(m => m.agendas.filter(a => a.caseId === c.id).map(a => ({ m, a })));
      return `<section class="box"><div class="box-h"><h2>회의·판정 이력</h2><span class="hint">회의 전 권고란은 비워 둠</span></div>${ag.length ? ag.map(({ m, a }) => `<div class="agenda"><p><b>${esc(m.type)} ${esc(m.date)}</b> ${chip(m.status, m.status === '완료' ? 'ok' : 'info')} · ${esc(a.item)}</p><dl class="kv"><dt>안건(초안)</dt><dd>${esc(a.draft)}</dd><dt>회의 결정</dt><dd>${a.decision ? esc(a.decision) : '<span class="muted">회의 전 · 비워 둠</span>'}</dd><dt>후속 담당·기한</dt><dd>${a.decision ? `${esc(a.owner)} · ${esc(a.due)}` : '—'}</dd></dl></div>`).join('') : '<p class="empty">상정 이력 없음</p>'}
        ${c.detail ? `<div class="grid2"><div class="card"><h3>결정 사항(9.9 회의)</h3><ul class="dots">${caseFile().meetingDecided.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="card soft"><h3>미결 사항</h3><ul class="dots">${caseFile().meetingPending.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : ''}</section>`;
    },
    review(c) {
      if (!c.detail) return `<section class="box"><p class="empty">${c.state === 'closed' ? `${esc(c.closedOn)} 종결된 회차입니다. 재접수는 새 회차로 기록합니다.` : '점검 전 단계입니다.'}</p></section>`;
      const r = C.detail.review;
      return `<div class="grid2"><section class="box"><div class="box-h"><h2>점검보고서</h2><span class="hint">${esc(r.date)} · ${chip('검토 요청')}</span></div><dl class="kv"><dt>서비스 제공 경과</dt><dd><ul class="dots">${r.progress.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd><dt>점검 결과 사정</dt><dd>${esc(r.result)}</dd><dt>향후 계획</dt><dd>${esc(r.next)}</dd></dl><p class="hint">서비스를 제공한 것만으로 목표 달성으로 처리하지 않습니다.</p></section>
        <section class="box"><div class="box-h"><h2>종결 검토</h2>${chip('진행 중', 'info')}</div><dl class="kv"><dt>잔여 위험요인</dt><dd><ul class="dots">${C.detail.closure.residual.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd><dt>이관</dt><dd>${chip('결정 필요', 'warn')} 이관 기록 위치 미정</dd><dt>사후관리</dt><dd>${esc(C.detail.closure.follow)}</dd></dl></section></div>`;
    },
    docs(c) {
      if (!c.detail) return `<section class="box"><p class="empty">사례보고서 ${esc(c.docs.report)} · 계획서 ${esc(c.docs.plan)}</p></section>`;
      return `<section class="box"><div class="box-h"><h2>사례파일 문서</h2><span class="hint">서식은 원본 확인 전 '공통 예시(미승인)'</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>문서</th><th>서식 버전</th><th>상태</th><th>일자</th></tr></thead><tbody>${C.detail.documents.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.ver)}</td><td>${chip(x.state)}</td><td>${esc(x.at)}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="box"><div class="box-h"><h2>문서 일관성 검사</h2><label class="switch"><input type="checkbox" id="fixToggle" ${state.fixed ? 'checked' : ''}> 담당자가 고친 뒤로 보기</label></div>${consistencyList()}</section>`;
    },
    history(c) {
      if (!c.detail) return `<section class="box"><p class="empty">변경 이력 없음(시연)</p></section>`;
      return `<section class="box"><div class="box-h"><h2>변경이력</h2><span class="hint">확정 기록은 덮어쓰지 않고 정정으로 남김</span></div><ul class="timeline">${C.detail.history.map(h => `<li><b>${esc(h.at)} · ${esc(h.who)}</b><p>${esc(h.what)}</p></li>`).join('')}</ul></section>`;
    }
  };

  function contactChip(r) { return chip({ completed: '완료', failed: '연락 실패', cancelled: '취소', planned: '예정' }[r] || r, r === 'completed' ? 'ok' : r === 'failed' ? 'bad' : 'muted'); }

  function riskEditor(id, a) {
    const r = D.evaluateRisk16(a);
    const doms = D.DOMAINS.map(dm => `<fieldset class="rdom"><legend>${esc(dm.label)} <small>${dm.items[0]}~${dm.items[3]}번</small></legend>${dm.items.map(n => {
      const v = a[n - 1]; const core = D.CORE.includes(n);
      return `<div class="ritem${core ? ' core' : ''}"><span class="rno">${n}${core ? '<em>핵심</em>' : ''}<small>문항 원문 필요</small></span><span class="rbtns" role="group" aria-label="${n}번 응답">${[[0, '0'], [1, '1'], [2, '2'], [null, '?']].map(([val, t]) => `<button type="button" data-r="${id}:${n}:${val}" aria-pressed="${v === val}">${t}</button>`).join('')}</span></div>`;
    }).join('')}</fieldset>`).join('');
    const total = r.confirmedTotal != null ? `<b>${r.confirmedTotal}</b>점 / 32 · 수준 ${chip(r.levelLabel)}` : `확정 총점 <b>보류</b> · 잠정 범위 <b>${r.min}~${r.max}</b>점 (미확인 ${r.unknown}개)`;
    const key = r.immediateAction ? chip(`핵심문항 2점 ${r.keySevere}개 · 양식상 즉각 개입 기준`, 'bad') : r.urgentReview ? chip(`핵심문항 2점 ${r.keySevere}개 · 긴급개입 검토`, 'bad') : r.keyUnknown ? chip(`핵심문항 미확인 ${r.keyUnknown}개 · 핵심 위험 없음으로 보지 않음`, 'warn') : chip('핵심문항 2점 없음', 'ok');
    return `<div class="rsum" aria-live="polite"><p>${total}</p><p>${key}</p>${r.allUnknown ? '<p class="hint">전부 미확인: 0점과 다릅니다.</p>' : ''}<p class="hint">구간(제안 반영): 0~10 낮음 · 11~20 중간 · 21~32 높음. 기관 사례유형과 따로 판단합니다.</p></div><div class="rgrid">${doms}</div>`;
  }

  function ecoSvg(items) {
    const W = 640, H = 340, cx = W / 2, cy = H / 2;
    const n = items.length;
    const nodes = items.map((e, i) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; return { e, x: cx + Math.cos(ang) * 220, y: cy + Math.sin(ang) * 120 }; });
    const line = (nd) => {
      const k = nd.e.kind;
      const st = k === 'current' ? 'stroke="#1769d2" stroke-width="3"' : k === 'candidate' ? 'stroke="#1769d2" stroke-width="2" stroke-dasharray="6 6"' : k === 'past' ? 'stroke="#9aa7b4" stroke-width="2"' : 'stroke="#b26b00" stroke-width="2" stroke-dasharray="2 5"';
      return `<line x1="${cx}" y1="${cy}" x2="${nd.x}" y2="${nd.y}" ${st}/>`;
    };
    return `<svg class="eco" viewBox="0 0 ${W} ${H}" role="img" aria-label="생태도: 가운데 당사자와 ${n}개 체계의 관계. ${esc(items.map(i => i.label + ' ' + i.note).join(', '))}">
      ${nodes.map(line).join('')}
      <circle cx="${cx}" cy="${cy}" r="38" fill="#173a63"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#fff" font-size="15" font-weight="700">Ct</text>
      ${nodes.map(nd => `<g><rect x="${nd.x - 64}" y="${nd.y - 18}" width="128" height="36" rx="18" fill="#fff" stroke="#c9d4e0"/><text x="${nd.x}" y="${nd.y + 5}" text-anchor="middle" font-size="13" fill="#16273a">${esc(nd.e.label)}</text></g>`).join('')}
    </svg>`;
  }

  // ---- 문서 일관성 ----
  function caseFile() {
    const s = JSON.parse(JSON.stringify(C.detail));
    s.records = C.contacts.filter(x => x.caseId === 'DEMO-0003' && x.result === 'completed');
    s.svc = C.services.filter(x => x.caseId === 'DEMO-0003' && x.status === 'provided');
    if (state.fixed) {
      s.plan[2].basis = '자녀 연락 시도 여부(당사자 의사 재확인)';
      s.meetingDecided.push(s.plan[2].basis);
      s.meetingPending = s.meetingPending.filter(p => !p.startsWith('자녀'));
      s.plan[2].measure = '월 연락 횟수(당사자 진술)';
      s.review.progress[2] = '병원 동행 1회 진행';
    }
    return s;
  }
  function runChecks() {
    const s = caseFile(); const out = [];
    s.plan.forEach(p => {
      const ok = !!p.basis && s.meetingDecided.includes(p.basis);
      out.push({ ok, path: '사례회의록 → 서비스계획서', text: `목표 ${p.goal}의 근거가 회의 결정에 있는가`, why: ok ? `회의 결정: ${p.basis}` : '회의에서 정하지 않은 목표입니다.' });
      out.push({ ok: !!p.measure, path: '서비스계획서', text: `목표 ${p.goal}에 측정 방법이 있는가`, why: p.measure ? `측정: ${p.measure}` : '측정 방법이 비어 있습니다.' });
    });
    const all = s.records.map(r => r.text).join(' ') + ' ' + s.svc.map(v => v.kind + (v.qty > 1 ? '' : '')).join(' ');
    s.review.progress.forEach(p => {
      const key = p.includes('밑반찬') ? '밑반찬' : p.includes('방문건강') ? '방문' : '병원 동행';
      let ok = all.includes(key);
      if (key === '병원 동행') { const n = s.svc.filter(v => v.kind === '병원 동행').length; const m = Number((p.match(/(\d+)회/) || [])[1] || 0); ok = n >= m && n > 0; }
      out.push({ ok, path: '과정기록·제공기록 → 점검보고서', text: `점검보고서의 「${p}」가 기록과 맞는가`, why: ok ? '기록에서 확인했습니다.' : '기록된 횟수보다 많이 적혀 있습니다. 기록 없는 개입은 보고서에 쓰지 않습니다.' });
    });
    s.domains.filter(d => d.state === '미확인' || d.state === '상충').forEach(d => out.push({ ok: false, soft: true, path: '사례보고서', text: `사정 「${d.area}」`, why: `${d.state}: 보고서에 사실로 쓰기 전에 다시 확인합니다.` }));
    return out;
  }
  function consistencySummary() {
    const rs = runChecks(); const bad = rs.filter(r => !r.ok && !r.soft).length; const soft = rs.filter(r => r.soft).length;
    return `<p>${chip(bad ? '확인 필요' : '통과')} 문서끼리 맞지 않는 곳 <b>${bad}</b>건 · 다시 확인할 사정 <b>${soft}</b>건 · 검사 ${rs.length}건</p>`;
  }
  function consistencyList() {
    return consistencySummary() + `<ul class="checks">${runChecks().map(r => `<li class="${r.ok ? 'ok' : r.soft ? 'soft' : 'bad'}"><span class="path">${esc(r.path)}</span> ${chip(r.ok ? '통과' : r.soft ? '미확인' : '확인 필요')}<p><b>${esc(r.text)}</b></p><p class="why">${esc(r.why)}</p></li>`).join('')}</ul>`;
  }

  views.meetings = () => {
    if (!can('detail')) return denied('회의');
    return `<div class="page-h"><h1>회의·슈퍼비전</h1><p>회의 하나에 여러 사례 안건을 둡니다. 회의 전에는 권고·결정란을 비우고, 결정은 회의 뒤 사람이 입력합니다. 시스템의 ‘검토 완료’는 전자결재 완료가 아닙니다.</p></div>
      ${C.meetings.map(m => `<section class="box"><div class="box-h"><h2>${esc(m.type)} · ${esc(m.date)} ${chip(m.status, m.status === '완료' ? 'ok' : 'info')}</h2><span class="hint">${esc(m.id)} · 참석 ${esc(m.attendees)}</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>사례</th><th>안건</th><th>안건 초안</th><th>회의 결정</th><th>후속 담당·기한</th><th>상태</th></tr></thead><tbody>${m.agendas.map(a => `<tr><td><a href="#case/${a.caseId}/meeting">${esc(a.caseId)}</a></td><td>${esc(a.item)}</td><td>${esc(a.draft)}</td><td>${a.decision ? esc(a.decision) : '<span class="muted">회의 전 · 비워 둠</span>'}</td><td>${a.decision ? `${esc(a.owner)} · ${esc(a.due)}` : '—'}</td><td>${chip(a.state)}</td></tr>`).join('')}</tbody></table></div>
        ${m.status === '예정' ? `<p class="hint">회의 준비 묶음: 사례보고서(안) + 위기도 평가표 + 가계도·생태도 + 문서 누락 점검을 자동으로 모읍니다(운영판).</p>` : ''}</section>`).join('')}`;
  };

  views.resources = () => {
    if (!can('detail')) return denied('자원 연계');
    const refs = C.referrals.filter(r => visibleCases().some(c => c.id === r.caseId));
    return `<div class="page-h"><h1>서비스·자원 연계</h1><p>의뢰를 보냈다고 기관이 받은 것이 아니고, 받았다고 이용한 것이 아닙니다. 단계를 따로 기록합니다. 기관 후보는 <a href="../">오산 복지자원 찾기</a> 공개 DB에서 고르고, 사례 내용은 검색어로 보내지 않습니다.</p></div>
      <section class="box flush"><div class="board">${C.referralStages.map(st => `<div class="col"><h3>${esc(st)} <span class="count">${refs.filter(r => r.stage === st).length}</span></h3>${refs.filter(r => r.stage === st).map(r => `<a class="card-mini" href="#case/${r.caseId}/contacts"><b>${esc(r.need)}</b><span>${esc(r.org)}</span><small>${esc(r.caseId)} · 확인 ${esc(r.checked)}</small></a>`).join('')}</div>`).join('')}</div></section>`;
  };

  views.programs = () => {
    if (!can('programs')) return denied('지원사업');
    const acct = state.role === 'accounting';
    return `<div class="page-h"><h1>지원사업</h1><p>일반 사례관리와 따로 사업별 원장을 둡니다. 신청·기관 판정·주관기관 결과·지급 요청·지급 확인을 나누고, 세대주와 수혜자를 구분합니다. 실제 송금은 회계 담당 업무로 남깁니다.</p></div>
      ${acct ? '<p class="warnline">회계 담당 권한: 상담 내용·사정·가계도는 보이지 않고 지급 요청에 필요한 최소 정보만 보입니다. 계좌 정보는 시연판에 없습니다.</p>' : ''}
      ${C.programs.map(p => `<section class="box"><div class="box-h"><h2>${esc(p.program)}</h2><span class="hint">${esc(p.id)} · ${acct ? '사례 연결 비노출' : `<a href="#case/${p.caseId}">${esc(p.caseId)}</a>`}</span></div>
        <ol class="steps">${C.programStages.map((st, i) => { const at = C.programStages.indexOf(p.stage); return `<li class="${i < at ? 'done' : i === at ? 'now' : ''}">${esc(st)}</li>`; }).join('')}</ol>
        <dl class="kv"><dt>신청자 / 수혜</dt><dd>${esc(p.applicant)} / ${esc(p.beneficiary)}</dd><dt>현재 결과</dt><dd>${chip(p.result)}</dd><dt>금액</dt><dd>${esc(p.amount)}</dd><dt>증빙</dt><dd>${esc(p.evidence)}</dd></dl></section>`).join('')}
      <p class="hint">시연 사업명·금액은 지어낸 것입니다. 실제 사업 기준은 최신 공고·매뉴얼을 등록하고 승인한 뒤 적용합니다.</p>`;
  };

  views.reports = (q) => {
    if (state.role === 'accounting') return denied('실적');
    const month = q.month || '2026-11';
    const staff = q.staff || '';
    const m = D.metrics({ contacts: C.contacts, services: C.services, intakes: C.intakes, referrals: C.referrals }, { month, staff });
    const months = ['2026-09', '2026-10', '2026-11'];
    const trend = months.map(mm => ({ mm, v: D.metrics({ contacts: C.contacts, services: C.services, intakes: C.intakes, referrals: C.referrals }, { month: mm, staff }) }));
    const max = Math.max(1, ...trend.map(t => Math.max(t.v.contactsCompleted, t.v.servicesProvided)));
    return `<div class="page-h"><h1>실적·보고</h1><p>합성 자료로 계산한 예시입니다. 실제 실적·사업계획 수치는 싣지 않습니다. 상담 건수와 서비스 제공은 섞지 않고, 같은 방문의 상담과 물품 전달은 각각 한 번씩 셉니다.</p></div>
      <div class="filterbar"><label>기준월 <select id="mSel">${months.map(x => `<option ${x === month ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>담당 <select id="sSel"><option value="">전체</option>${C.staff.map(s => `<option value="${s.id}" ${s.id === staff ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label></div>
      <section class="kpis">${[['신규 접수', m.intakes, '접수일 기준'], ['상담(완료)', m.contactsCompleted, `연락 실패·취소 ${m.contactsNotCompleted}건 제외`], ['서비스 제공', m.servicesProvided, Object.entries(m.svcByUnit).map(([u, n]) => `${n}${u}`).join(' · ') || '—'], ['상담 실사례', m.distinctCases, '사례 회차 기준'], ['연계 기록', Object.values(m.referralsByStage).reduce((a, b) => a + b, 0), Object.entries(m.referralsByStage).map(([k, v]) => `${k} ${v}`).join(' · ') || '—']].map(([t, n, s]) => `<div class="kpi"><b>${n}<small>건</small></b><span>${esc(t)}</span><em>${esc(s)}</em></div>`).join('')}</section>
      <div class="grid2"><section class="box"><div class="box-h"><h2>월별 추이</h2><span class="hint">상담(완료) · 서비스 제공</span></div>
        <div class="bars" role="img" aria-label="${trend.map(t => `${t.mm} 상담 ${t.v.contactsCompleted}건 제공 ${t.v.servicesProvided}건`).join(', ')}">${trend.map(t => `<div class="bar-g"><div class="bar-pair"><span class="bar a" style="height:${t.v.contactsCompleted / max * 100}%"><i>${t.v.contactsCompleted}</i></span><span class="bar b" style="height:${t.v.servicesProvided / max * 100}%"><i>${t.v.servicesProvided}</i></span></div><small>${t.mm.slice(5)}월</small></div>`).join('')}</div>
        <p class="legend-inline"><span class="sw a"></span>상담(완료) <span class="sw b"></span>서비스 제공</p></section>
        <section class="box"><div class="box-h"><h2>상담 방식별</h2></div><table class="tbl"><tbody>${Object.entries(m.byMode).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('') || '<tr><td class="empty">없음</td></tr>'}</tbody></table>
        <h3 class="mini">집계 정의(제안)</h3><ul class="dots small"><li>상담: 완료된 접촉을 기록 번호 단위로 한 번씩</li><li>서비스 제공: 실제 제공만, 단위(회·가구)별로 따로 합산</li><li>달성률: 같은 단위 실적 ÷ 승인된 목표. 목표가 없으면 계산하지 않음</li></ul></section></div>`;
  };

  views.docs = () => {
    if (!can('detail')) return denied('문서함');
    return `<div class="page-h"><h1>문서함</h1><p>초안 · 검토 요청 · 확정을 나눕니다. 확정 문서는 확정 당시 내용으로 다시 출력하고, 고칠 때는 정정본과 사유를 남깁니다.</p></div>
      <section class="box flush"><div class="tbl-wrap"><table class="tbl dense"><thead><tr><th>사례</th><th>문서</th><th>서식 버전</th><th>상태</th><th>일자</th></tr></thead><tbody>
      ${visibleCases().filter(c => c.detail).flatMap(c => C.detail.documents.map(d => `<tr><td><a href="#case/${c.id}/docs">${esc(c.id)}</a></td><td>${esc(d.name)}</td><td>${esc(d.ver)}</td><td>${chip(d.state)}</td><td>${esc(d.at)}</td></tr>`)).join('')}
      ${visibleCases().filter(c => !c.detail).map(c => `<tr><td><a href="#case/${c.id}">${esc(c.id)}</a></td><td>사례보고서</td><td>공통 예시(미승인)</td><td>${chip(c.docs.report)}</td><td>—</td></tr>`).join('')}
      </tbody></table></div></section><p class="hint">HWP·DOCX·PDF 출력은 기관 원양식 대조 뒤 제공합니다. 시연판에서는 내보내기를 막아 두었습니다.</p>`;
  };

  views.admin = () => {
    if (!can('admin')) return denied('관리자');
    const matrix = [
      ['전직원 발굴', '신규·자신 제출', '배정된 단순사례', '요청만', '없음'],
      ['인테이크', '접수·배정대기', '초기상담 범위', '배정 요청', '없음'],
      ['사례관리자', '배정·담당', '배정된 사례', '보고서·회의안 작성', '자기 지원요청 최소'],
      ['팀장', '팀 범위', '감독상 필요 범위', '위임 범위 검토·판정', '필요 범위 검토'],
      ['회계 담당', '필요한 신청 정보', '상담 내용 비노출', '지급 요청 검토만', '지급 정보 최소'],
      ['시스템 관리자', '관리 목적', '본문 기본 접근 없음', '결정 불가', '없음']
    ];
    const audit = [['2026-11-26 10:02', '팀장', '사례 열람', 'DEMO-0005', '성공'], ['2026-11-26 09:40', '사례관리자 나', '안전 확인 기록', 'DEMO-0005', '성공'], ['2026-11-25 17:11', '회계 담당', '사례 상세 열람 시도', 'DEMO-0006', '거부'], ['2026-11-25 15:30', '사례관리자 가', '점검보고서 내보내기 시도', 'DEMO-0003', '시연 차단']];
    return `<div class="page-h"><h1>관리자</h1><p>권한·연동·감사기록 화면 구성입니다. 시연판의 권한 전환은 보안 기능이 아니며, 실제 권한 검사는 내부 서버에서 합니다.</p></div>
      <section class="box"><div class="box-h"><h2>권한 매트릭스(초안)</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>역할</th><th>접수</th><th>사례기록</th><th>판정·승인</th><th>회계</th></tr></thead><tbody>${matrix.map(r => `<tr>${r.map((v, i) => i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></section>
      <section class="box"><div class="box-h"><h2>연동 등록부</h2><span class="hint">확인 전에는 비활성 · 비밀값은 화면·저장소에 두지 않음</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>연동</th><th>상태</th><th>방향</th></tr></thead><tbody>${C.integrations.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${chip(b, b === '링크만' ? 'info' : 'muted')}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="box"><div class="box-h"><h2>감사기록(예시)</h2><span class="hint">열람·내보내기·거부까지 기록, 본문은 남기지 않음</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>시각</th><th>행위자</th><th>행위</th><th>대상</th><th>결과</th></tr></thead><tbody>${audit.map(r => `<tr>${r.map((v, i) => `<td>${i === 4 ? chip(v, v === '성공' ? 'ok' : 'bad') : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  };

  views.guide = () => `<div class="page-h"><h1>시스템 안내</h1><p>오산 통합사례관리·자원연계시스템(가칭)의 공개 시연판입니다. 공개 시연 → 내부 검수 → 기관 운영 순서로 만듭니다.</p></div>
    <section class="box"><div class="box-h"><h2>이 화면이 하지 않는 일</h2></div><ul class="dots"><li>실제 대상자 정보를 받거나 저장하지 않습니다. 실제 정보처럼 보이는 입력(전화번호·주민번호·계좌·주소 형식)은 막습니다.</li><li>위기 수준이나 대상자 선정을 대신 정하지 않습니다. 회의 결정은 사람이 기록합니다.</li><li>구글 시트·노션·AI·희망이음·엔컴에 연결하지 않습니다.</li></ul></section>
    <section class="box"><div class="box-h"><h2>업무 흐름(상태)</h2><span class="hint">유형·진행상태·위기 수준은 서로 다른 칸</span></div>
      <ol class="flow">${['발굴·접수', '초기상담', '단순관리 또는 사정', '판정회의(선정·보류·미선정/이관)', '서비스계획 합의', '상담·지원·연계', '점검·재사정', '종결 검토 → 종결', '사후관리 → 새 위기 시 재접수(새 회차)'].map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
    <section class="box"><div class="box-h"><h2>기능 지도 F01~F18</h2><span class="hint">번호는 제안 매핑, 원본 기획안 확인 시 보정</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>기능</th><th>우선</th><th>시연판</th></tr></thead><tbody>${C.features.map(f => `<tr><td>${f[0]}</td><td>${esc(f[1])}</td><td>${f[2]}</td><td>${esc(f[3])}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="box"><div class="box-h"><h2>합성 시나리오</h2></div><div class="tbl-wrap"><table class="tbl"><tbody>
      ${[['A', 'DEMO-0001', '단순 정보제공·전화상담·연계, 미관리 30일 경고'], ['B', 'DEMO-0002', '단순 → 일반 전환, 판정 근거와 적용일'], ['C', 'DEMO-0004', '위기도 일부 미확인 → 확정 총점 보류, 잠정 범위'], ['D', 'DEMO-0005', '총점은 낮지만 핵심문항 2점·안전 확인 → 따로 경고'], ['E', 'DEMO-0003', '집중 사례 전체 사례파일·문서 일관성 검사'], ['F', 'DEMO-0006', '지원사업 신청·판정·결과, 회계 화면 상담 비노출'], ['G', 'DEMO-0007 → 0008', '종결 후 재접수, 새 회차로 연결']].map(r => `<tr><th>${r[0]}</th><td><a href="#case/${r[1].slice(0, 9)}">${esc(r[1])}</a></td><td>${esc(r[2])}</td></tr>`).join('')}
    </tbody></table></div></section>
    <p class="foot-note">기획·편집: 오산세교종합사회복지관 김지훈 팀장 · <a href="../usage-terms.html">이용조건</a> · 화면의 사례·사업·기관 연계는 모두 지어낸 예시입니다.</p>`;

  function denied(what, why) {
    return `<div class="page-h"><h1>${esc(what)} 접근 권한 없음</h1></div><section class="box"><p>${esc(why || `${roleLabel()} 권한으로는 볼 수 없는 화면입니다.`)}</p><p class="hint">오른쪽 위 '권한'을 바꿔 다른 역할의 화면을 볼 수 있습니다(시연).</p></section>`;
  }
  function roleLabel() { return (C.roles.find(r => r.id === state.role) || {}).label; }

  // ---- 라우터 ----
  function parse() {
    const h = decodeURIComponent(location.hash.slice(1) || 'home');
    const [path, qs] = h.split('?');
    const parts = path.split('/');
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    return { parts, q };
  }
  function render(focus) {
    const { parts, q } = parse();
    let name = parts[0];
    if (name === 'intake' && parts[1] === 'new') q.focusNew = 1;
    if (!views[name]) name = 'home';
    const html = name === 'case' ? views.case(q, parts[1], parts[2]) : views[name](q);
    const v = $('#view');
    v.innerHTML = html;
    v.className = 'view v-' + name;
    $$('#nav a').forEach(a => { const id = a.dataset.nav; const on = id === name || (name === 'case' && id === 'cases'); a.toggleAttribute('aria-current', false); if (on) a.setAttribute('aria-current', 'page'); });
    $$('#tabbar a').forEach(a => { a.toggleAttribute('aria-current', false); if (a.dataset.nav === name || (name === 'case' && a.dataset.nav === 'cases')) a.setAttribute('aria-current', 'page'); });
    const nav = NAV.find(n => n.id === name);
    $('#crumbs').textContent = name === 'case' ? `사례관리 › ${parts[1] || ''}` : (nav ? nav.label : '');
    document.title = `${name === 'case' ? parts[1] : nav ? nav.label : '업무 홈'} | 세교 사례관리 시스템 시연판`;
    bind();
    closeMenu();
    if (q.focusNew) { const f = $('#intakeForm input'); if (f) { f.closest('section').scrollIntoView({ block: 'start' }); f.focus({ preventScroll: true }); } }
    else if (focus) { window.scrollTo(0, 0); v.focus({ preventScroll: true }); }
  }

  function bind() {
    $$('[data-r]').forEach(b => b.addEventListener('click', () => {
      const [id, n, val] = b.dataset.r.split(':');
      state.risk[id][+n - 1] = val === 'null' ? null : +val;
      $('#riskBox').innerHTML = riskEditor(id, state.risk[id]);
      bind();
      const nb = $(`[data-r="${id}:${n}:${val}"]`); if (nb) nb.focus();
    }));
    $$('[data-start-risk]').forEach(b => b.addEventListener('click', () => { state.risk[b.dataset.startRisk] = Array(16).fill(null); render(false); }));
    const ft = $('#fixToggle'); if (ft) ft.addEventListener('change', () => { state.fixed = ft.checked; render(false); const t = $('#fixToggle'); if (t) t.focus(); });
    $$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));
    const ms = $('#mSel'), ss = $('#sSel');
    if (ms) { const go = () => { location.hash = `reports?month=${ms.value}${ss.value ? '&staff=' + ss.value : ''}`; }; ms.addEventListener('change', go); ss.addEventListener('change', go); }
    const f = $('#intakeForm');
    if (f) f.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(f); const msg = $('#intakeMsg');
      const alias = String(fd.get('alias') || '').trim(); const ask = String(fd.get('ask') || '');
      const real = D.looksReal(alias) || D.looksReal(ask);
      if (real) { msg.textContent = `시연판에서는 실제 정보처럼 보이는 값(${real})을 받지 않습니다. 지어낸 내용으로 적어 주세요.`; msg.className = 'form-msg bad'; return; }
      if (!alias) { msg.textContent = '가명 이니셜을 적어 주세요.'; msg.className = 'form-msg bad'; return; }
      state.newIntakes += 1;
      const no = `INT-DEMO-1${String(state.newIntakes).padStart(2, '0')}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${no}</td><td>${C.asOf}</td><td>${esc(fd.get('route'))}</td><td>${esc(fd.get('problem'))}</td><td>${chip('배정 대기', 'warn')}</td><td>접수${fd.get('safe') ? '' : ' ' + chip('안전 확인 안 함', 'bad')}</td><td>—</td>`;
      $('#intakeRows').prepend(tr);
      msg.textContent = `${no} 접수됨(메모리에만, 새로고침하면 사라짐).`; msg.className = 'form-msg ok';
      f.reset();
    });
  }

  let tt;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600); }
  function closeMenu() { document.body.classList.remove('menu-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }

  document.addEventListener('DOMContentLoaded', () => {
    $('#nav').innerHTML = NAV.map(n => `<a href="#${n.id}" data-nav="${n.id}"><span class="ico" aria-hidden="true">${n.ico}</span>${esc(n.label)}</a>${n.sub ? `<div class="subnav">${n.sub.map(([h, t]) => `<a href="#${h}">${esc(t)}</a>`).join('')}</div>` : ''}`).join('');
    $('#tabbar').innerHTML = TABBAR.map(([h, t, i]) => `<a href="#${h}" data-nav="${h.split('/')[0]}"><span aria-hidden="true">${i}</span>${esc(t)}</a>`).join('');
    const rs = $('#roleSel');
    rs.innerHTML = C.roles.map(r => `<option value="${r.id}">${esc(r.label)}</option>`).join('');
    rs.value = state.role;
    rs.addEventListener('change', () => { state.role = rs.value; toast(`${roleLabel()} 권한으로 보는 중: ${C.roles.find(r => r.id === state.role).note}`); render(false); });
    $('#menuBtn').addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); $('#menuBtn').setAttribute('aria-expanded', String(o)); });
    $('.skip').addEventListener('click', e => { e.preventDefault(); $('#view').focus(); });
    window.addEventListener('hashchange', () => render(true));
    render(false);
  });
})();
