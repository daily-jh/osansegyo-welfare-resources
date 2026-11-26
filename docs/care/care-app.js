/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
   오산 통합돌봄 길잡이 화면. 입력값은 메모리에만 두고 저장·전송하지 않는다(브라우저 저장소·전송 없음). */
(function () {
  'use strict';
  const C = window.CARE_DATA, M = window.CareModel, W = window.WELFARE_DATA;
  const UI = window.ToolsUI || { open() {}, enter() {}, done() {}, bump(el, n) { if (el) el.textContent = n; }, sos() {} };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https:\/\/[^\s"'<>@]+$/.test(u || '') ? u : '');
  const OTHER = { id: 'other', label: '기타(타사업)' };
  const domainOf = id => C.domains.find(d => d.id === id) || (id === 'other' ? OTHER : { label: id });
  const FORM_FILE = { apply: 'forms/form1-apply-20260320.hwp', plan: 'forms/form2-plan-20260320.hwp' };
  const svcOf = id => C.services.find(s => s.id === id);
  const telHref = n => 'tel:' + String(n).replace(/[^0-9]/g, '');
  let lastCheck = null;
  /* 사는 동(2026-11-26): OY-RALS와 같은 거주 지역 규칙(../assets/residence-v1.js). 주소의 ?dong= 로만 넘겨받고 저장하지 않는다. */
  const RES = window.Residence || null;
  const dongNow = () => (RES && $('#dongSelect') ? RES.valid($('#dongSelect').value) : '');
  const rowTag = r => (r.role && RES ? `<span class="res-tag res-${r.role}">${esc(r.tag)}</span>` : '');
  const rowCls = r => (r.role === 'osan-ref' || r.role === 'near-ref' ? ' class="res-ref"' : r.role === 'mine' || r.role === 'local' ? ' class="res-mine"' : '');

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
      if (t === tab) UI.enter(panel);
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
    const ap = C.apply;
    if (ap) $('#applyBox').innerHTML = `<article class="apply-card"><p class="ap-k">어디에</p><h3>${esc(ap.where)}</h3><p class="muted">방문해서 신청합니다. 사전조사는 접수 뒤 5일 안에 대면이나 전화로 합니다(복지부 이용안내).</p></article>
      <article class="apply-card"><p class="ap-k">누가</p><ul>${ap.who.map(w => `<li>${esc(w)}</li>`).join('')}</ul><small>시행규칙 제7조 · 시행령 제4조</small></article>
      <article class="apply-card"><p class="ap-k">무엇으로</p><p>${esc(ap.form)}</p><p class="ap-links"><a href="${FORM_FILE.apply}" download="별지1호_통합지원신청서.hwp">신청서 내려받기(HWP)</a><button type="button" class="link-btn" data-open="apply">낼 서류 보기</button></p></article>`;
    const fm = C.forms;
    if (fm) $('#formsBox').innerHTML = ['apply', 'plan', 'expert'].map(k => { const f = fm[k]; return `<article class="form-card tu-lift"><p class="fc-no">${esc(f.no)}</p><h3>${esc(f.name)}</h3><p class="muted">${esc(f.rev)} · ${esc(f.basis)}</p><p>${esc(k === 'apply' ? '본인·친족·후견인·기관 담당자가 신청할 때 씁니다. 처리기간 5일, 수수료 없음.' : k === 'plan' ? '시·군·구가 통합지원회의를 거쳐 대상자별 계획을 세울 때 씁니다. 03 지원계획 초안 탭이 이 서식 뒤쪽을 따릅니다.' : '복지부장관이 전문기관을 지정할 때만 씁니다. 주민이나 동 담당자가 쓰는 서식이 아닙니다.')}</p><p class="ap-links"><button type="button" class="link-btn" data-form="${k}">항목 보기</button>${FORM_FILE[k] ? `<a href="${FORM_FILE[k]}" download="${k === 'apply' ? '별지1호_통합지원신청서.hwp' : '별지2호_개인별지원계획서.hwp'}">HWP 내려받기</a>` : ''}</p></article>`; }).join('');
    if (C.news) $('#newsList').innerHTML = C.news.map(n => `<li class="tu-lift"><time datetime="${esc(n.date)}">${esc(n.date.replace(/-/g, '.'))}</time><div><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p><small><a href="${esc(safeUrl(n.source))}" target="_blank" rel="noopener noreferrer">${esc(n.by)} ↗</a></small></div></li>`).join('');
    const s = C.sources;
    $('#lawSources').innerHTML = `원문 확인: <a href="${esc(s.law)}" target="_blank" rel="noopener noreferrer">국가법령정보센터 ↗</a> · <a href="${esc(s.decree)}" target="_blank" rel="noopener noreferrer">시행령 입법 정보 ↗</a> · <a href="${esc(s.rule)}" target="_blank" rel="noopener noreferrer">시행규칙 공포 정보 ↗</a> · <a href="${esc(s.promulgation)}" target="_blank" rel="noopener noreferrer">공포 보도자료 ↗</a> · <a href="${esc(s.guide)}" target="_blank" rel="noopener noreferrer">복지부 통합돌봄 이용안내 ↗</a>`;
  }

  /* ---------- 02 미리 살펴보기(옛 이름: 신청 전 확인) ---------- */
  function renderCheckForm() {
    $('#oacSelect').innerHTML = M.oacOptions.map(o => `<option value="${o.id}">${esc(o.label)}</option>`).join('');
    $('#ltcSelect').innerHTML = M.ltcOptions.map(o => `<option value="${o.id}"${o.id === 'none' ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    const groups = C.domains.map(d => {
      const qs = M.questions.filter(q => q.domain === d.id);
      if (!qs.length) return '';
      return `<div class="q-group d-${d.id}"><h3>${esc(d.label)}</h3>${qs.map(q => `<label class="q"><input type="checkbox" name="yes" value="${q.id}"><span>${esc(q.text)}</span></label>`).join('')}</div>`;
    });
    $('#questionList').innerHTML = groups.join('');
    const ds = $('#dongSelect');
    if (ds) { if (RES) ds.innerHTML = RES.optionsHTML(RES.fromURL(), '고르지 않음 · 오산 전체'); else ds.closest('.dong-line').hidden = true; }
  }

  function updatePick() {
    const yes = $$('input[name="yes"]:checked');
    const doms = new Set(yes.map(i => (M.questions.find(q => q.id === i.value) || {}).domain).filter(Boolean));
    if ($('#ltcSelect').value === 'grade') doms.add('ltc');
    UI.bump($('#pickCount'), yes.length);
    $('#pickDomains').textContent = doms.size;
    $('#pickHint').textContent = doms.size >= 2 ? '여러 영역에 걸쳐 있습니다. 결과에서 신청 창구를 함께 보여 드립니다.' : doms.size === 1 ? '한 영역입니다. 그 영역 서비스부터 연결할 수 있습니다.' : '두 영역 이상이면 통합돌봄 상담을 권합니다.';
  }

  function readWho() { return (($('#checkForm').querySelector('input[name="who"]:checked')) || {}).value || 'self'; }

  function readCheck() {
    const f = $('#checkForm');
    const val = n => (f.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
    return { who: val('who'), age: val('age'), disability: val('disability'), ltc: $('#ltcSelect').value, oac: $('#oacSelect').value, emergency: f.emergency.checked, yes: $$('input[name="yes"]:checked', f).map(i => i.value) };
  }

  function resourceList(service, limit) {
    if (!W) return '<p class="muted">복지자원 DB를 불러오지 못했습니다.</p>';
    const rows = M.matchResources(service, W, { dedupeOrg: true, dong: dongNow() });
    if (!rows.length) return `<p class="muted">DB에 등록된 연결 기관이 아직 없습니다. <a href="${esc(safeUrl(service.source))}" target="_blank" rel="noopener noreferrer">공식 안내 ↗</a>로 확인하세요.</p>`;
    const shown = rows.slice(0, limit || 4);
    return `<ul class="res">${shown.map(r => `<li${rowCls(r)}>${rowTag(r)}<span class="lv lv-${r.level === '오산시' ? 'osan' : 'other'}">${esc(r.scope && r.scope !== r.level ? r.scope : (r.level === '민간' ? '전국' : r.level))}</span><a href="../#org=${encodeURIComponent(r.orgId)}">${esc(r.org)}</a><small>${esc(r.service)}</small>${r.phone ? `<a class="tel" href="${telHref(r.phone)}">${esc(r.phone)}</a>` : ''}</li>`).join('')}</ul>${rows.length > shown.length ? `<p class="muted">외 ${rows.length - shown.length}곳은 돌봄 자원 지도에서 볼 수 있습니다.</p>` : ''}`;
  }

  function windowsList() {
    if (!W) return '';
    const rows = M.matchResources({ match: '통합돌봄 신청|통합판정조사' }, W, { dedupeOrg: true, dong: dongNow() });
    return `<ul class="res windows">${rows.map(r => `<li${rowCls(r)}>${rowTag(r)}<span class="lv lv-${r.level === '오산시' ? 'osan' : 'other'}">${esc(r.scope && r.scope !== r.level ? r.scope : (r.level === '민간' ? '전국' : r.level))}</span><a href="../#org=${encodeURIComponent(r.orgId)}">${esc(r.org)}</a>${r.phone ? `<a class="tel" href="${telHref(r.phone)}">${esc(r.phone)}</a>` : ''}</li>`).join('')}</ul>`;
  }

  function noticeBox() {
    const dong = dongNow(); if (!dong || !RES) return '';
    const shown = (lastCheck ? lastCheck.serviceIds : []).map(svcOf).filter(Boolean).flatMap(s => M.matchResources(s, W, { dedupeOrg: true, dong }).slice(0, 4));
    return RES.noticeHTML(RES.notice(dong, shown));
  }
  function windowsTitle() { const d = dongNow(); return d && RES && RES.isDong(d) ? `${d} 신청 창구` : d && RES ? `${esc(RES.nearCity(d) || '사는 지역')} 신청 창구` : '오산 신청 창구'; }
  function windowsNote() {
    const d = dongNow();
    if (d && RES && RES.isOutside(d)) return `통합돌봄은 주소지 시·군·구가 맡습니다. ${esc(RES.nearCity(d) || '사는 지역')}의 동 행정복지센터(주민센터) 또는 국민건강보험공단 지사(1577-1000)에 신청하세요. 오산 행정복지센터는 오산 주민 창구라 뺐습니다.`;
    return `${d ? esc(d) + ' 행정복지센터(관할)' : '주소지 행정복지센터'} 또는 국민건강보험공단 지사(1577-1000). 사전조사는 접수 5일 이내에 합니다.`;
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
      <div class="facts tu-stagger">
        <div><h4>대상 범위</h4><p>${esc(r.scope.label)}</p></div>
        ${r.priority.length ? `<div><h4>1단계 우선지원 대상 단서</h4><ul>${r.priority.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
        ${r.exOfficio.length ? `<div><h4>직권 신청을 요청할 수 있는 경우</h4><ul>${r.exOfficio.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="muted">담당 공무원이 내용을 설명하고 본인 동의를 받아 대신 신청합니다(법 제10조 ②, 시행령 제4조).</p></div>` : ''}
        ${r.agencyApply && r.agencyApply.length ? `<div><h4>기관 담당자가 신청할 수 있습니다</h4><ul>${r.agencyApply.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="muted">시행규칙 제7조</p></div>` : ''}
        ${r.preExamWaived ? '<div><h4>사전조사 면제</h4><p>의료기관 퇴원 연계로 신청하면 사전조사 없이 통합판정조사로 넘어갑니다(복지부 이용안내).</p></div>' : ''}
        ${r.applicant ? `<div><h4>신청 방법</h4><p>${esc(r.applicant)}</p><p class="muted">별지 제1호서식 「통합지원 신청서」 · 처리기간 5일 · 수수료 없음</p></div>` : ''}
        ${C.forms && C.forms.apply.docs[readWho()] ? `<div><h4>신청할 때 낼 서류</h4><ul>${C.forms.apply.docs[readWho()].map(d => `<li>${esc(d)}</li>`).join('')}</ul><p class="muted">신청서 뒤쪽 「신청인 제출서류」 기준. <button type="button" class="link-btn" data-open="apply">신청서 항목 보기</button></p></div>` : ''}
      </div>
      ${noticeBox()}
      ${(r.level === 'apply' || r.level === 'emergency' || r.level === 'single') ? `<div class="windows-box"><h4>${windowsTitle()}</h4><p class="muted">${windowsNote()}</p>${windowsList()}${C.osan ? `<p class="muted">기관 연계·사업 문의: ${esc(C.osan.dept)} <a href="${telHref(C.osan.phone)}">${esc(C.osan.phone)}</a> (팀장, 업무 총괄)</p>` : ''}</div>` : ''}
      ${services.length ? `<h4 class="svc-title">먼저 살펴볼 서비스 ${Math.min(services.length, 6)}가지</h4><p class="muted">카드의 버튼을 누르면 오산·경기·전국 연결 기관이 창으로 열립니다.</p><div class="svc-grid tu-stagger">${services.slice(0, 6).map(svcCard).join('')}</div>${services.length > 6 ? `<details class="more-svc"><summary>함께 검토할 서비스 ${services.length - 6}가지 더 보기</summary><div class="svc-grid">${services.slice(6).map(svcCard).join('')}</div></details>` : ''}` : ''}
      <div class="form-actions"><a class="btn primary" href="#plan" id="toPlan">이 결과로 지원계획 초안 쓰기 (실무자)</a><button type="button" class="btn ghost" id="printCheck">결과 인쇄</button></div>`;
    function svcCard(s) {
      const n = W ? M.matchResources(s, W, { dedupeOrg: true, dong: dongNow() }) : [];
      const osanN = n.filter(r => r.level === '오산시').length;
      return `<article class="svc d-${s.domain} tu-lift"><p class="svc-meta"><span>${esc(domainOf(s.domain).label)}</span><span class="ch ch-${s.channel}">${esc(C.channels[s.channel].short)}</span></p><h5>${esc(s.name)}</h5><p>${esc(s.what)}</p><button type="button" class="svc-open tu-press" data-svc="${esc(s.id)}" aria-haspopup="dialog">${n.length ? `연결 기관 ${n.length}곳${osanN ? ` · 오산 ${osanN}` : ''}` : '공식 안내 확인'} <span aria-hidden="true">→</span></button></article>`;
    }
    box.hidden = false;
    UI.enter(box);
    $('#printCheck').addEventListener('click', () => printHtml(checkPrintHtml(r, services)));
    $('#toPlan').addEventListener('click', () => { fillPlanFromCheck(); });
    box.onclick = e => { const b = e.target.closest('[data-svc]'); if (b) openService(b.dataset.svc); if (e.target.closest('[data-open="apply"]')) openApply(); }; // 다시 그릴 때(사는 동 변경) 클릭이 겹쳐 붙지 않게 한 번만 건다
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* 서비스 창: 하는 일·근거·오산 사정·연결 기관 전체 */
  function openService(id) {
    const s = svcOf(id); if (!s) return;
    const src = safeUrl(s.source);
    UI.open({
      kicker: `${domainOf(s.domain).label} · ${C.channels[s.channel].label}`,
      title: s.name,
      html: `<p>${esc(s.what)}</p>${s.osan ? `<p class="osan-note">${esc(s.osan)}</p>` : ''}<h3>연결할 수 있는 기관</h3>${resourceList(s, 12)}<p class="muted">근거 ${esc(s.law)} · 자격과 이용 가능 여부는 기관에 확인해 주세요.</p>`,
      foot: (src ? `<a href="${esc(src)}" target="_blank" rel="noopener noreferrer">공식 안내 ↗</a>` : '') + '<button type="button" class="tu-primary" data-close>닫기</button>'
    });
  }

  function openHow() {
    UI.open({
      kicker: '오산 통합돌봄 길잡이', title: '이 화면 쓰는 법',
      html: `<ol class="how-list"><li><b>01 법 한눈에</b> 통합돌봄이 무엇이고 어떤 순서로 진행되는지, 오산시 담당 창구와 신청 방법을 봅니다.</li><li><b>02 미리 살펴보기</b> 요즘 어려운 일을 고르면 몇 개 영역에 걸쳐 있는지, 어디에 신청하고 어떤 서비스를 먼저 볼지 알려 줍니다.</li><li><b>03 지원계획 초안</b> 실무자가 통합지원회의 전에 법이 정한 계획 항목을 빠짐없이 적도록 돕습니다.</li><li><b>04 돌봄 자원 지도</b> 법의 서비스 영역마다 오산에서 연결할 수 있는 기관과 아직 자료가 없는 곳을 보여 줍니다.</li></ol><p class="muted">이 화면은 대상 여부를 판정하지 않습니다. 고른 내용은 화면에만 있고 저장하거나 보내지 않으며, 창을 닫거나 새로고침하면 사라집니다.</p>`,
      foot: '<a class="tu-primary" href="#check" data-close>미리 살펴보기 시작</a>'
    });
  }
  function openApply() {
    const ap = C.apply, f = C.forms.apply;
    UI.open({
      kicker: '시행규칙 제7조 · 별지 제1호서식(개정 2026. 3. 20.)', title: '신청할 때 챙길 것',
      html: `<h3>어디에</h3><p>${esc(ap.where)}</p><h3>누가</h3><ul>${ap.who.map(w => `<li>${esc(w)}</li>`).join('')}</ul><h3>신청서</h3><p>${esc(ap.form)}</p><ol class="flow">${f.flow.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <h3>신청서에 적는 것</h3><ul>${f.fields.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>신청인별로 낼 서류</h3><p class="doc-k">본인이 신청할 때</p><ul>${f.docs.self.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="doc-k">친족·후견인이 신청할 때</p><ul>${f.docs.family.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="doc-k">기관 담당자가 신청할 때</p><ul>${f.docs.agency.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3>함께 받는 동의</h3><ul>${f.consents.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="muted">${esc(f.consentNote)}</p>
        <h3>있으면 상담이 빨라지는 메모</h3><ul class="bring">${ap.bring.map(w => `<li>${esc(w)}</li>`).join('')}</ul><p class="muted">${esc(ap.bringNote)}</p>`,
      foot: `<a href="${FORM_FILE.apply}" download="별지1호_통합지원신청서.hwp">신청서 내려받기(HWP)</a><button type="button" class="tu-primary" data-close>닫기</button>`
    });
  }

  function openForm(k) {
    if (k === 'apply') return openApply();
    const f = C.forms[k];
    UI.open({ kicker: `${f.no} · ${f.rev} · ${f.basis}`, title: f.name,
      html: k === 'plan' ? `<p>시·군·구가 통합지원회의를 거쳐 세우는 계획서입니다. 아래 항목을 적습니다.</p><ul>${f.sections.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="muted">이 길잡이의 03 지원계획 초안은 뒤쪽(주요 욕구, 제공목표, 필요서비스, 종합의견, 동의, 차기 검토일)을 따릅니다. 이름·주민등록번호 같은 앞쪽 항목은 화면에 적지 말고 서식에 종이로 적어 주세요.</p>` : `<p>${esc(f.text)}</p>`,
      foot: (FORM_FILE[k] ? `<a href="${FORM_FILE[k]}" download="${k === 'apply' ? '별지1호_통합지원신청서.hwp' : '별지2호_개인별지원계획서.hwp'}">HWP 내려받기</a>` : '') + (k === 'plan' ? '<a href="#plan" data-close>지원계획 초안 쓰기</a>' : '') + '<button type="button" class="tu-primary" data-close>닫기</button>' });
  }

  function checkPrintHtml(r, services) {
    return `<h1>통합돌봄 미리 살펴보기 결과</h1><p class="p-note">판정이 아닌 상담 준비 자료입니다. 대상 여부는 시·군·구 종합판정으로 정해집니다. 출력일 ${today()}</p>
      <h2>${esc(r.headline)}</h2><p>${esc(r.note)}</p>
      <p><b>어려운 영역</b> ${r.domains.map(d => esc(domainOf(d).label)).join(', ') || '없음'}</p>
      <p><b>대상 범위</b> ${esc(r.scope.label)}</p>
      ${r.priority.length ? `<p><b>우선지원 단서</b> ${r.priority.map(esc).join(', ')}</p>` : ''}
      ${r.exOfficio.length ? `<p><b>직권 신청 요청 가능</b> ${r.exOfficio.map(esc).join(', ')}</p>` : ''}
      <p><b>신청</b> ${windowsNote().replace(/ 사전조사는.*$/, '')} ${esc(r.applicant)}</p>${dongNow() ? `<p><b>사는 곳</b> ${esc(RES.zoneText(dongNow()))}</p>` : ''}
      <h2>먼저 살펴볼 서비스</h2><ol>${services.map(s => `<li><b>${esc(s.name)}</b> (${esc(domainOf(s.domain).label)} · ${esc(C.channels[s.channel].short)}) ${esc(s.what)}</li>`).join('')}</ol>`;
  }

  /* ---------- 03 지원계획 초안 ---------- */
  const plan = { rows: [] };
  function svcOptions(selected) {
    return '<option value="">서비스 고르기</option>' + C.domains.map(d => `<optgroup label="${esc(d.label)}">${C.services.filter(s => s.domain === d.id).map(s => `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`).join('') + `<option value="custom"${selected === 'custom' ? ' selected' : ''}>직접 입력(지역 특화 등)</option>`;
  }
  function domainOptions(selected) {
    return C.domains.concat([OTHER]).map(d => `<option value="${d.id}"${d.id === selected ? ' selected' : ''}>${esc(d.label)}</option>`).join('');
  }
  function suggestProvider(serviceId) {
    const s = svcOf(serviceId);
    if (!s || !W) return '';
    const dong = dongNow(), m = M.matchResources(s, W, { dedupeOrg: true, dong });
    // 사는 동을 골랐으면 내 동 창구·그 시 기관을 먼저, 타지역 거주면 오산 기관은 제공 주체로 미리 채우지 않는다.
    const first = dong ? m.find(r => r.role === 'mine' || r.role === 'local') || (RES && RES.isOutside(dong) ? m.find(r => r.role === 'shared') : null) : null;
    const osan = m.find(r => r.level === '오산시');
    return (first || (dong && RES && RES.isOutside(dong) ? null : osan) || m[0] || {}).org || '';
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
      <td data-label="수량·주기"><input data-k="amount" value="${esc(r.amount)}" maxlength="30" placeholder="예: 주 2회 · 월 1회 · 분기 1회 · 비정기" aria-label="${i + 1}번째 줄 제공주기"></td>
      <td data-label="기간"><input data-k="period" value="${esc(r.period)}" maxlength="30" placeholder="예: 3개월" aria-label="${i + 1}번째 줄 기간"></td>
      <td data-label="의뢰 길"><select data-k="channel" aria-label="${i + 1}번째 줄 의뢰 길">${Object.entries(C.channels).map(([k, c]) => `<option value="${k}"${k === r.channel ? ' selected' : ''}>${esc(c.short)}</option>`).join('')}</select></td>
      <td><button type="button" class="row-del" data-del="${i}" aria-label="${i + 1}번째 줄 지우기">×</button></td></tr>`).join('');
    reviewPlan();
  }
  function reviewPlan() {
    const v = M.planReview({ rows: plan.rows, linkage: $('#linkage').value, consent: $('#consent').checked, meeting: $('#meetingDate').value, goal1: $('#goal1').value }, C.services);
    $('#planReview').innerHTML = `<div class="pr-stats"><span><b>${v.count}</b>개 서비스</span><span><b>${v.domains.length}</b>개 영역</span><span><b>${v.providers}</b>개 제공 주체</span></div>
      ${v.warnings.length ? `<ul class="warn">${v.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '<p class="ok">법이 정한 계획 항목이 모두 채워졌습니다. 통합지원회의에서 본인·가족 의견과 함께 확정하세요.</p>'}
      ${v.monitor.length ? `<div class="monitor"><h4>모니터링 일정(복지부 이용안내 권고 · 시행규칙 제10조는 처음 3개월 이내, 그 뒤 6개월 이내 범위)</h4><ol>${v.monitor.map(m => `<li>${esc(m.label)} <b>${esc(m.date)}</b>까지</li>`).join('')}</ol></div>` : '<p class="muted">통합지원회의일을 넣으면 모니터링 날짜(1개월 안, 이후 3개월마다)를 계산합니다.</p>'}`;
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
    $('#goal1').addEventListener('input', reviewPlan);
    $('#fromCheck').addEventListener('click', fillPlanFromCheck);
    $('#clearPlan').addEventListener('click', () => { plan.rows = []; $('#linkage').value = ''; ['needs', 'goal1', 'goal2', 'goal3', 'opinion'].forEach(id => { $('#' + id).value = ''; }); $('#consent').checked = false; $('#meetingDate').value = ''; $('#caseLabel').value = ''; renderPlan(); });
    $('#printPlan').addEventListener('click', () => printHtml(planPrintHtml()));
  }
  function fillPlanFromCheck() {
    if (!lastCheck) { $('#planReview').insertAdjacentHTML('afterbegin', '<p class="warn-one">먼저 「미리 살펴보기」에서 결과를 본 뒤 눌러 주세요.</p>'); return; }
    plan.rows = [];
    lastCheck.serviceIds.slice(0, 6).forEach(addRow);
    const picked = M.questions.filter(q => lastCheck.yesIds && lastCheck.yesIds.includes(q.id)).map(q => q.text.replace(/\.$/, ''));
    if (picked.length && !$('#needs').value.trim()) $('#needs').value = picked.join('\n');
    renderPlan();
  }
  function planPrintHtml() {
    const v = reviewPlan();
    const label = $('#caseLabel').value.trim();
    const rows = plan.rows.filter(r => r.service);
    return `<h1>개인별지원계획 초안${label ? ` · ${esc(label)}` : ''}</h1>
      <p class="p-note">시행규칙 별지 제2호서식(개정 2026. 3. 20.) 뒤쪽 항목과 법 제13조 기준 초안. 공식 서식을 대신하지 않으며 통합지원회의에서 확정합니다. 출력일 ${today()}</p>
      <h2>■ 대상자 기본사항 <small>(공식 서식 앞쪽에 종이로 적기)</small></h2>
      <p class="p-check">가구형태 ☐독거 ☐비독거(☐부부 ☐노부모 ☐성인자녀 ☐조손 ☐형제자매 ☐장애인 가구 ☐한부모 ☐다문화 ☐친척·지인) · 가구원 수 (   )명 · 가구 내 등록장애인 (   )명<br>사회보장수급권 ☐생계 ☐의료 ☐주거급여 ☐차상위 ☐기초연금 ☐장애인연금 ☐장애수당 ☐일반 ☐기타<br>주수발자 ☐없음 ☐배우자 ☐자녀 ☐친인척 ☐친구·이웃 ☐사적간병인 ☐공적서비스 돌봄제공자 ☐기타 · 주수발자 장애 ☐예 ☐아니오 · 사회활동 ☐예 ☐아니오<br>대상자 유형 ☐65세 이상(장기요양 ☐1~5등급 ☐인지지원 ☐등급외 ☐기각·각하 ☐신청 중 / 노인맞춤돌봄 ☐일반 ☐중점 / ☐퇴원(예정) / 실외 보행 자립 ☐예 ☐아니오 / 2주 이내 퇴원 ☐예 ☐아니오) ☐65세 미만 장애인(☐심한 ☐심하지 않은 / 활동지원 ☐수급 ☐등급외 ☐미신청 / 시설퇴소 예정 ☐예 ☐아니오)</p>
      <h2>■ 주요 욕구(문제)</h2><p class="p-box">${esc($('#needs').value).replace(/\n/g, '<br>') || '&nbsp;'}</p>
      <h2>■ 서비스 제공목표</h2><ol class="p-goals">${['goal1', 'goal2', 'goal3'].map(id => `<li>${esc($('#' + id).value) || '&nbsp;'}</li>`).join('')}</ol>
      <h2>■ 필요서비스 내용</h2>
      <table class="p-table"><thead><tr><th>구분</th><th>서비스 내용</th><th>제공기관</th><th>제공주기</th><th>기간</th><th>의뢰 길</th></tr></thead><tbody>
      ${rows.map(r => { const s = svcOf(r.service); return `<tr><td>${esc(domainOf(r.domain).label)}</td><td>${esc(r.service === 'custom' ? r.custom : (s ? s.name : ''))}</td><td>${esc(r.provider)}</td><td>${esc(r.amount)}</td><td>${esc(r.period)}</td><td>${esc(C.channels[r.channel] ? C.channels[r.channel].short : '')}</td></tr>`; }).join('')}
      </tbody></table>
      <h2>기관 사이 연계 방법 <small>(법 제13조 ① 제2호)</small></h2><p class="p-box">${esc($('#linkage').value) || '&nbsp;'}</p>
      <h2>■ 종합의견</h2><p class="p-box">${esc($('#opinion').value).replace(/\n/g, '<br>') || '&nbsp;'}</p>
      <h2>본인·가족 의견</h2><p class="p-box tall">&nbsp;</p>
      <p>본인 동의 및 보호자 설명: ${$('#consent').checked ? '☑ 실시 ☐ 미실시' : '☐ 실시 ☐ 미실시'} · 차기 계획 검토일: ${esc(v.nextReview) || '____년 __월 __일'}</p>
      ${v.monitor.length ? `<h2>모니터링 일정</h2><p>${v.monitor.map(m => `${esc(m.label)} ${esc(m.date)}`).join(' · ')}</p>` : ''}
      ${v.warnings.length ? `<h2>보완할 점</h2><ul>${v.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      <p class="p-sign">계획수립일 ____________ &nbsp; 담당자 ____________________ &nbsp; 회의일 ____________</p>`;
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
    const PF = window.PublicFacilities;
    if (PF) PF.load('../public-api/facilities.json').then(d => {
      const box = $('#publicFacilities');
      const gs = d ? PF.byUses(d, ['care', 'mental'], { adult: true }) : [];
      box.innerHTML = gs.length ? PF.html(gs, d, { limit: 4, base: '../', dbLink: id => '../#org=' + encodeURIComponent(id) }) : '<p class="muted">아직 수집된 기관 목록이 없습니다.</p>';
    });
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
    $('#checkForm').addEventListener('submit', e => { e.preventDefault(); lastCheck = M.evaluate(readCheck()); UI.done($('#runCheck')); renderCheckResult(lastCheck); });
    $('#checkForm').addEventListener('reset', () => { lastCheck = null; $('#checkResult').hidden = true; $('#checkResult').innerHTML = ''; $('#runCheck').classList.remove('tu-done'); setTimeout(updatePick, 0); });
    $('#checkForm').addEventListener('change', updatePick);
    $('#dongSelect')?.addEventListener('change', () => { if (lastCheck && !$('#checkResult').hidden) renderCheckResult(lastCheck); });
    updatePick();
    $('#heroStart').addEventListener('click', () => UI.done($('#heroStart')));
    $('#openHow').addEventListener('click', openHow);
    $('#openApply').addEventListener('click', openApply);
    $('#applyBox').addEventListener('click', e => { if (e.target.closest('[data-open="apply"]')) openApply(); });
    $('#formsBox').addEventListener('click', e => { const b = e.target.closest('[data-form]'); if (b) openForm(b.dataset.form); });
    UI.sos(C.hotlines.map(h => [h.num, h.label]), '생명·신체가 위험하면 <b>119·112가 먼저</b>입니다. 통합돌봄 신청은 응급 대응이 끝난 뒤에 이어 갈 수 있습니다.');
    bindPlan();
    renderPlan();
    show(location.hash.slice(1));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
