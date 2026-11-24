/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
   오산 통합돌봄 길잡이 화면. 입력값은 메모리에만 두고 저장·전송하지 않는다(브라우저 저장소·전송 없음). */
(function () {
  'use strict';
  const C = window.CARE_DATA, M = window.CareModel, W = window.WELFARE_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https:\/\/[^\s"'<>@]+$/.test(u || '') ? u : '');
  const domainOf = id => C.domains.find(d => d.id === id) || { label: id };
  const svcOf = id => C.services.find(s => s.id === id);
  const telHref = n => 'tel:' + String(n).replace(/[^0-9]/g, '');
  let lastCheck = null;

  if (!C || !M) { document.body.insertAdjacentHTML('afterbegin', '<p class="load-error">화면 자료를 불러오지 못했습니다. 새로고침해 주세요.</p>'); return; }

  /* ---------- 탭 ---------- */
  const TABS = ['law', 'check', 'plan', 'map'];
  function show(tab) {
    if (!TABS.includes(tab)) tab = 'law';
    TABS.forEach(t => {
      const panel = document.getElementById(t), link = document.getElementById('tab-' + t);
      panel.hidden = t !== tab;
      link.setAttribute('aria-selected', String(t === tab));
      if (t === tab) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (tab === 'map') renderMap();
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  /* ---------- 01 법 한눈에 ---------- */
  function renderLaw() {
    $('#stepList').innerHTML = C.steps.map((s, i) => `<li><span class="step-no">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(s.label)} <small>${esc(s.law)}</small></h3><p>${esc(s.text)}</p></div></li>`).join('');
    $('#lawCards').innerHTML = C.lawCards.map(c => `<article class="law-card"><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p><small>${esc(c.law)}</small></article>`).join('');
    $('#domainGrid').innerHTML = C.domains.map(d => `<article class="domain d-${d.id}"><span class="domain-law">${esc(d.article)}</span><h3>${esc(d.label)}</h3><p class="domain-short">${esc(d.short)}</p><p>${esc(d.text)}</p></article>`).join('');
    $('#channelRow').innerHTML = Object.entries(C.channels).map(([k, c]) => `<div class="channel ch-${k}"><b>${esc(c.label)}</b><p>${esc(c.text)}</p></div>`).join('');
    const o = C.osan;
    if (o) $('#osanBox').innerHTML = `<div class="osan-contact"><p class="oc-kicker">총괄·기관 연계 문의</p><h3>${esc(o.dept)}</h3><a class="oc-tel" href="${telHref(o.phone)}">${esc(o.phone)}</a><p class="muted">${esc(o.phoneNote)}</p><p>주민 신청은 <b>주소지 동 행정복지센터</b>에서 합니다.</p>${o.staff ? `<ul class="oc-staff">${o.staff.slice(1).map(x => `<li><a href="${telHref(x.phone)}">${esc(x.phone)}</a><span>${esc(x.role)}</span></li>`).join('')}</ul><p class="muted">${esc(o.staffNote)} <a href="${esc(safeUrl(o.staffSource))}" target="_blank" rel="noopener noreferrer">시청 검색 ↗</a></p>` : ''}</div><ul class="osan-facts">${o.facts.map(f => `<li><p>${esc(f.text)}</p><small><a href="${esc(safeUrl(f.source))}" target="_blank" rel="noopener noreferrer">출처 ↗</a> · ${esc(f.date)}</small></li>`).join('')}</ul>`;
    const s = C.sources;
    $('#lawSources').innerHTML = `원문 확인: <a href="${esc(s.law)}" target="_blank" rel="noopener noreferrer">국가법령정보센터 ↗</a> · <a href="${esc(s.decree)}" target="_blank" rel="noopener noreferrer">시행령 입법 정보 ↗</a> · <a href="${esc(s.guide)}" target="_blank" rel="noopener noreferrer">복지부 통합돌봄 이용안내 ↗</a>`;
  }

  /* ---------- 02 신청 전 확인 ---------- */
  function renderCheckForm() {
    $('#ltcSelect').innerHTML = M.ltcOptions.map(o => `<option value="${o.id}"${o.id === 'none' ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    const groups = C.domains.map(d => {
      const qs = M.questions.filter(q => q.domain === d.id);
      if (!qs.length) return '';
      return `<div class="q-group d-${d.id}"><h3>${esc(d.label)}</h3>${qs.map(q => `<label class="q"><input type="checkbox" name="yes" value="${q.id}"><span>${esc(q.text)}</span></label>`).join('')}</div>`;
    });
    $('#questionList').innerHTML = groups.join('');
  }

  function readCheck() {
    const f = $('#checkForm');
    const val = n => (f.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
    return { who: val('who'), age: val('age'), disability: val('disability'), ltc: $('#ltcSelect').value, emergency: f.emergency.checked, yes: $$('input[name="yes"]:checked', f).map(i => i.value) };
  }

  function resourceList(service, limit) {
    if (!W) return '<p class="muted">복지자원 DB를 불러오지 못했습니다.</p>';
    const rows = M.matchResources(service, W, { dedupeOrg: true });
    if (!rows.length) return `<p class="muted">DB에 등록된 연결 기관이 아직 없습니다. <a href="${esc(safeUrl(service.source))}" target="_blank" rel="noopener noreferrer">공식 안내 ↗</a>로 확인하세요.</p>`;
    const shown = rows.slice(0, limit || 4);
    return `<ul class="res">${shown.map(r => `<li><span class="lv lv-${r.level === '오산시' ? 'osan' : 'other'}">${esc(r.level === '민간' ? '전국' : r.level)}</span><a href="../#org=${encodeURIComponent(r.orgId)}">${esc(r.org)}</a><small>${esc(r.service)}</small>${r.phone ? `<a class="tel" href="${telHref(r.phone)}">${esc(r.phone)}</a>` : ''}</li>`).join('')}</ul>${rows.length > shown.length ? `<p class="muted">외 ${rows.length - shown.length}곳은 돌봄 자원 지도에서 볼 수 있습니다.</p>` : ''}`;
  }

  function windowsList() {
    if (!W) return '';
    const rows = M.matchResources({ match: '통합돌봄 신청|통합판정조사' }, W, { dedupeOrg: true });
    return `<ul class="res windows">${rows.map(r => `<li><span class="lv lv-${r.level === '오산시' ? 'osan' : 'other'}">${esc(r.level === '민간' ? '전국' : r.level)}</span><a href="../#org=${encodeURIComponent(r.orgId)}">${esc(r.org)}</a>${r.phone ? `<a class="tel" href="${telHref(r.phone)}">${esc(r.phone)}</a>` : ''}</li>`).join('')}</ul>`;
  }

  function renderCheckResult(r) {
    const box = $('#checkResult');
    const hot = C.hotlines.slice(0, 3).map(h => `<a class="hot" href="tel:${esc(h.tel)}"><b>${esc(h.num)}</b> ${esc(h.label)}</a>`).join('');
    const services = r.serviceIds.map(svcOf).filter(Boolean);
    box.innerHTML = `
      ${r.level === 'emergency' ? `<div class="alert"><h3>${esc(r.headline)}</h3><div class="hot-row">${hot}</div><p>${esc(r.note)}</p></div>` : ''}
      <div class="verdict v-${r.level}">
        <p class="v-kicker">확인 결과 · 판정 아님</p>
        <h3>${esc(r.level === 'emergency' ? (r.domains.length >= 2 ? `어려움이 ${r.domains.length}개 영역에 걸쳐 있습니다.` : '응급 대응 뒤 아래를 확인하세요.') : r.headline)}</h3>
        ${r.level !== 'emergency' && r.note ? `<p>${esc(r.note)}</p>` : ''}
        ${r.domains.length ? `<div class="chips">${r.domains.map(d => `<span class="chip d-${d}">${esc(domainOf(d).label)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="facts">
        <div><h4>대상 범위</h4><p>${esc(r.scope.label)}</p></div>
        ${r.priority.length ? `<div><h4>1단계 우선지원 대상 단서</h4><ul>${r.priority.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
        ${r.exOfficio.length ? `<div><h4>직권 신청을 요청할 수 있는 경우</h4><ul>${r.exOfficio.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="muted">시·군·구가 내용을 설명하고 본인 동의를 받아 대신 신청합니다(법 제10조 ②).</p></div>` : ''}
        ${r.preExamWaived ? '<div><h4>사전조사 면제</h4><p>의료기관 퇴원 연계로 신청하면 사전조사 없이 통합판정조사로 넘어갑니다(복지부 이용안내).</p></div>' : ''}
        ${r.applicant ? `<div><h4>신청 방법</h4><p>${esc(r.applicant)}</p></div>` : ''}
      </div>
      ${(r.level === 'apply' || r.level === 'emergency' || r.level === 'single') ? `<div class="windows-box"><h4>오산 신청 창구</h4><p class="muted">주소지 행정복지센터 또는 국민건강보험공단 지사(1577-1000). 사전조사는 접수 5일 이내에 합니다.</p>${windowsList()}${C.osan ? `<p class="muted">기관 연계·사업 문의: ${esc(C.osan.dept)} <a href="${telHref(C.osan.phone)}">${esc(C.osan.phone)}</a> (팀장, 업무 총괄)</p>` : ''}</div>` : ''}
      ${services.length ? `<h4 class="svc-title">먼저 살펴볼 서비스 ${Math.min(services.length, 6)}가지</h4><div class="svc-grid">${services.slice(0, 6).map(svcCard).join('')}</div>${services.length > 6 ? `<details class="more-svc"><summary>함께 검토할 서비스 ${services.length - 6}가지 더 보기</summary><div class="svc-grid">${services.slice(6).map(svcCard).join('')}</div></details>` : ''}` : ''}
      <div class="form-actions"><a class="btn primary" href="#plan" id="toPlan">이 결과로 지원계획 초안 쓰기 (실무자)</a><button type="button" class="btn ghost" id="printCheck">결과 인쇄</button></div>`;
    function svcCard(s) { return `<article class="svc d-${s.domain}"><p class="svc-meta"><span>${esc(domainOf(s.domain).label)}</span><span class="ch ch-${s.channel}">${esc(C.channels[s.channel].short)}</span></p><h5>${esc(s.name)}</h5><p>${esc(s.what)}</p>${s.osan ? `<p class="osan-note">${esc(s.osan)}</p>` : ''}${resourceList(s, 3)}</article>`; }
    box.hidden = false;
    $('#printCheck').addEventListener('click', () => printHtml(checkPrintHtml(r, services)));
    $('#toPlan').addEventListener('click', () => { fillPlanFromCheck(); });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function checkPrintHtml(r, services) {
    return `<h1>통합돌봄 신청 전 확인 결과</h1><p class="p-note">판정이 아닌 상담 준비 자료입니다. 대상 여부는 시·군·구 종합판정으로 정해집니다. 출력일 ${today()}</p>
      <h2>${esc(r.headline)}</h2><p>${esc(r.note)}</p>
      <p><b>어려운 영역</b> ${r.domains.map(d => esc(domainOf(d).label)).join(', ') || '없음'}</p>
      <p><b>대상 범위</b> ${esc(r.scope.label)}</p>
      ${r.priority.length ? `<p><b>우선지원 단서</b> ${r.priority.map(esc).join(', ')}</p>` : ''}
      ${r.exOfficio.length ? `<p><b>직권 신청 요청 가능</b> ${r.exOfficio.map(esc).join(', ')}</p>` : ''}
      <p><b>신청</b> 주소지 행정복지센터 또는 국민건강보험공단 지사(1577-1000). ${esc(r.applicant)}</p>
      <h2>먼저 살펴볼 서비스</h2><ol>${services.map(s => `<li><b>${esc(s.name)}</b> (${esc(domainOf(s.domain).label)} · ${esc(C.channels[s.channel].short)}) ${esc(s.what)}</li>`).join('')}</ol>`;
  }

  /* ---------- 03 지원계획 초안 ---------- */
  const plan = { rows: [] };
  function svcOptions(selected) {
    return '<option value="">서비스 고르기</option>' + C.domains.map(d => `<optgroup label="${esc(d.label)}">${C.services.filter(s => s.domain === d.id).map(s => `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`).join('') + `<option value="custom"${selected === 'custom' ? ' selected' : ''}>직접 입력(지역 특화 등)</option>`;
  }
  function domainOptions(selected) {
    return C.domains.map(d => `<option value="${d.id}"${d.id === selected ? ' selected' : ''}>${esc(d.label)}</option>`).join('');
  }
  function suggestProvider(serviceId) {
    const s = svcOf(serviceId);
    if (!s || !W) return '';
    const m = M.matchResources(s, W, { dedupeOrg: true });
    const osan = m.find(r => r.level === '오산시');
    return (osan || m[0] || {}).org || '';
  }
  function addRow(serviceId) {
    const s = svcOf(serviceId);
    plan.rows.push({ service: serviceId || '', custom: '', domain: s ? s.domain : 'daily', provider: serviceId ? suggestProvider(serviceId) : '', amount: '', period: '', channel: s ? s.channel : 'gov' });
  }
  function renderPlan() {
    const body = $('#planRows');
    if (!plan.rows.length) addRow('');
    body.innerHTML = plan.rows.map((r, i) => `<tr data-i="${i}">
      <td data-label="영역"><select data-k="domain" aria-label="${i + 1}번째 줄 영역">${domainOptions(r.domain)}</select></td>
      <td data-label="서비스"><select data-k="service" aria-label="${i + 1}번째 줄 서비스">${svcOptions(r.service)}</select>${r.service === 'custom' ? `<input data-k="custom" value="${esc(r.custom)}" maxlength="40" placeholder="서비스 이름" aria-label="${i + 1}번째 줄 직접 입력 서비스">` : ''}</td>
      <td data-label="제공 주체"><input data-k="provider" value="${esc(r.provider)}" maxlength="40" placeholder="기관명" aria-label="${i + 1}번째 줄 제공 주체"></td>
      <td data-label="수량·주기"><input data-k="amount" value="${esc(r.amount)}" maxlength="30" placeholder="예: 주 2회 2시간" aria-label="${i + 1}번째 줄 수량·주기"></td>
      <td data-label="기간"><input data-k="period" value="${esc(r.period)}" maxlength="30" placeholder="예: 3개월" aria-label="${i + 1}번째 줄 기간"></td>
      <td data-label="의뢰 길"><select data-k="channel" aria-label="${i + 1}번째 줄 의뢰 길">${Object.entries(C.channels).map(([k, c]) => `<option value="${k}"${k === r.channel ? ' selected' : ''}>${esc(c.short)}</option>`).join('')}</select></td>
      <td><button type="button" class="row-del" data-del="${i}" aria-label="${i + 1}번째 줄 지우기">×</button></td></tr>`).join('');
    reviewPlan();
  }
  function reviewPlan() {
    const v = M.planReview({ rows: plan.rows, linkage: $('#linkage').value, consent: $('#consent').checked, meeting: $('#meetingDate').value }, C.services);
    $('#planReview').innerHTML = `<div class="pr-stats"><span><b>${v.count}</b>개 서비스</span><span><b>${v.domains.length}</b>개 영역</span><span><b>${v.providers}</b>개 제공 주체</span></div>
      ${v.warnings.length ? `<ul class="warn">${v.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '<p class="ok">법이 정한 계획 항목이 모두 채워졌습니다. 통합지원회의에서 본인·가족 의견과 함께 확정하세요.</p>'}
      ${v.monitor.length ? `<div class="monitor"><h4>모니터링 일정(법 제14조 ④, 복지부 권고)</h4><ol>${v.monitor.map(m => `<li>${esc(m.label)} <b>${esc(m.date)}</b>까지</li>`).join('')}</ol></div>` : '<p class="muted">통합지원회의일을 넣으면 모니터링 날짜(1개월 안, 이후 3개월마다)를 계산합니다.</p>'}`;
    return v;
  }
  function bindPlan() {
    const body = $('#planRows');
    body.addEventListener('change', e => {
      const tr = e.target.closest('tr'); if (!tr) return;
      const i = +tr.dataset.i, k = e.target.dataset.k; if (!k) return;
      plan.rows[i][k] = e.target.value;
      if (k === 'service') {
        const s = svcOf(e.target.value);
        if (s) { plan.rows[i].domain = s.domain; plan.rows[i].channel = s.channel; if (!plan.rows[i].provider) plan.rows[i].provider = suggestProvider(s.id); }
        renderPlan(); return;
      }
      reviewPlan();
    });
    body.addEventListener('input', e => { const tr = e.target.closest('tr'); if (!tr || !e.target.dataset.k || e.target.tagName !== 'INPUT') return; plan.rows[+tr.dataset.i][e.target.dataset.k] = e.target.value; reviewPlan(); });
    body.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; plan.rows.splice(+b.dataset.del, 1); renderPlan(); });
    $('#addRow').addEventListener('click', () => { addRow(''); renderPlan(); });
    ['linkage', 'consent', 'meetingDate'].forEach(id => $('#' + id).addEventListener(id === 'linkage' ? 'input' : 'change', reviewPlan));
    $('#fromCheck').addEventListener('click', fillPlanFromCheck);
    $('#clearPlan').addEventListener('click', () => { plan.rows = []; $('#linkage').value = ''; $('#consent').checked = false; $('#meetingDate').value = ''; $('#caseLabel').value = ''; renderPlan(); });
    $('#printPlan').addEventListener('click', () => printHtml(planPrintHtml()));
  }
  function fillPlanFromCheck() {
    if (!lastCheck) { $('#planReview').insertAdjacentHTML('afterbegin', '<p class="warn-one">먼저 「신청 전 확인」에서 결과를 본 뒤 눌러 주세요.</p>'); return; }
    plan.rows = [];
    lastCheck.serviceIds.slice(0, 6).forEach(addRow);
    renderPlan();
  }
  function planPrintHtml() {
    const v = reviewPlan();
    const label = $('#caseLabel').value.trim();
    const rows = plan.rows.filter(r => r.service);
    return `<h1>개인별지원계획 초안${label ? ` · ${esc(label)}` : ''}</h1>
      <p class="p-note">「의료·요양 등 지역 돌봄의 통합지원에 관한 법률」 제13조 항목 기준 초안. 공식 서식을 대신하지 않으며 통합지원회의에서 확정합니다. 출력일 ${today()}</p>
      <table class="p-table"><thead><tr><th>영역</th><th>서비스</th><th>제공 주체</th><th>수량·주기</th><th>기간</th><th>의뢰 길</th></tr></thead><tbody>
      ${rows.map(r => { const s = svcOf(r.service); return `<tr><td>${esc(domainOf(r.domain).label)}</td><td>${esc(r.service === 'custom' ? r.custom : (s ? s.name : ''))}</td><td>${esc(r.provider)}</td><td>${esc(r.amount)}</td><td>${esc(r.period)}</td><td>${esc(C.channels[r.channel] ? C.channels[r.channel].short : '')}</td></tr>`; }).join('')}
      </tbody></table>
      <h2>기관 사이 연계 방법</h2><p class="p-box">${esc($('#linkage').value) || '&nbsp;'}</p>
      <h2>본인·가족 의견</h2><p class="p-box tall">&nbsp;</p>
      <p>의견 진술·정보 제공 동의 확인: ${$('#consent').checked ? '예' : '아니오'}</p>
      ${v.monitor.length ? `<h2>모니터링 일정</h2><p>${v.monitor.map(m => `${esc(m.label)} ${esc(m.date)}`).join(' · ')}</p>` : ''}
      ${v.warnings.length ? `<h2>보완할 점</h2><ul>${v.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      <p class="p-sign">작성 기관·담당 ____________________ &nbsp; 회의일 ____________ &nbsp; 확인 ____________</p>`;
  }

  /* ---------- 04 돌봄 자원 지도 ---------- */
  let mapDone = false;
  function renderMap() {
    if (mapDone) return; mapDone = true;
    if (!W) { $('#mapDomains').innerHTML = '<p class="muted">복지자원 DB를 불러오지 못했습니다.</p>'; return; }
    const cov = M.coverage(C, W);
    const all = cov.flatMap(d => d.items), gaps = all.filter(i => i.gap && !i.wider).length, wider = all.filter(i => i.wider).length;
    $('#mapSummary').innerHTML = `<div><b>${all.length - gaps - wider}</b><span>오산 기관 연결됨</span></div><div><b>${wider}</b><span>경기·전국 창구만 있음</span></div><div class="gap"><b>${gaps}</b><span>DB 자료 없음(공식 안내 확인)</span></div>`;
    $('#mapDomains').innerHTML = cov.map(d => `<section class="map-domain d-${d.domain}"><h3>${esc(d.label)} <small>${d.items.length - d.gaps}/${d.items.length} 오산 연결</small></h3>
      ${d.items.map(i => { const s = svcOf(i.id); return `<details class="map-item${i.gap ? ' is-gap' : ''}"><summary><span class="mi-name">${esc(i.name)}</span><span class="ch ch-${i.channel}">${esc(C.channels[i.channel].short)}</span>${i.wider ? `<span class="wide-badge">경기·전국 창구 ${i.total}</span>` : i.gap ? '<span class="gap-badge">오산 자료 없음</span>' : `<span class="cnt">오산 ${i.osan} · 전체 ${i.total}</span>`}</summary><p>${esc(s.what)}</p>${i.osanNote ? `<p class="osan-note">${esc(i.osanNote)}</p>` : ''}${resourceList(s, 12)}</details>`; }).join('')}</section>`).join('');
    fetch('../public-api/candidates.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(p => {
      const list = M.careCandidates(p);
      $('#apiCandidates').innerHTML = list.length
        ? `<ul class="res">${list.slice(0, 30).map(r => `<li><span class="lv lv-other">${esc(r.change)}</span>${safeUrl(r.link) ? `<a href="${esc(safeUrl(r.link))}" target="_blank" rel="noopener noreferrer">${esc(r.name)} ↗</a>` : esc(r.name)}<small>${esc(r.org || '')}</small></li>`).join('')}</ul>`
        : '<p class="muted">아직 수집된 돌봄 후보가 없습니다. 다음 주 월요일 수집부터 이곳에 나타납니다.</p>';
    }).catch(() => { $('#apiCandidates').innerHTML = '<p class="muted">수집 결과를 불러오지 못했습니다.</p>'; });
  }

  /* ---------- 공통 ---------- */
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function printHtml(html) {
    const area = $('#printArea');
    area.innerHTML = html + '<p class="p-foot">오산 통합돌봄 길잡이 · 오산 복지자원 찾기 · 개인정보는 종이에만 적고 화면에 남기지 않습니다.</p>';
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }

  function init() {
    renderLaw();
    renderCheckForm();
    $('#hotlines').innerHTML = C.hotlines.map(h => `<li><a href="tel:${esc(h.tel)}"><b>${esc(h.num)}</b><span>${esc(h.label)}</span></a></li>`).join('');
    $('#checkedOn').textContent = C.checkedOn;
    $('#checkForm').addEventListener('submit', e => { e.preventDefault(); lastCheck = M.evaluate(readCheck()); renderCheckResult(lastCheck); });
    $('#checkForm').addEventListener('reset', () => { lastCheck = null; $('#checkResult').hidden = true; $('#checkResult').innerHTML = ''; });
    bindPlan();
    renderPlan();
    show(location.hash.slice(1));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
