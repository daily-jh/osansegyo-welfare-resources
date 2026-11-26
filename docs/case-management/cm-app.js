/* © 2026 오산세교종합사회복지관 김지훈 팀장.
   세교 사례관리 시스템 시연판 화면 (2026-11-26).
   저장·전송 없음: localStorage·네트워크 요청을 쓰지 않는다. */
(function () {
  'use strict';
  const C = window.CM;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const chip = (state) => {
    const cls = { '확인': 'ok', '확정': 'ok', '이용': 'ok', '성과 확인': 'ok', '미확인': 'warn', '문의': 'info', '접수': 'info', '추천': 'muted', '상충': 'bad', '초안': 'muted', '진행 중': 'info', '통과': 'ok', '확인 필요': 'bad' }[state] || 'muted';
    return `<span class="chip ${cls}">${esc(state)}</span>`;
  };
  const list = arr => `<ul class="dots">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;

  // 시연용 사본. "고친 버전" 보기를 켜면 이 사본만 바뀐다.
  const base = C.sample;
  let fixed = false;
  function caseData() {
    const s = JSON.parse(JSON.stringify(base));
    if (fixed) {
      s.plan[2].basis = '자녀 연락 시도 여부(당사자 의사 재확인)';
      s.meeting.decided.push('자녀 연락 시도 여부(당사자 의사 재확인)');
      s.meeting.pending = s.meeting.pending.filter(p => !p.startsWith('자녀'));
      s.plan[2].measure = '월 연락 횟수(당사자 진술)';
      s.plan[2].action = '당사자 동의를 받은 뒤 자녀에게 연락해 상황을 알림';
      s.records.push({ date: '2026년 10월 21일(수) 13:00 ~ 15:30', who: 'Ct(가상 대상자 A)', how: '병원 동행', text: '정형외과 진료 동행(1~3회차를 한 줄로 요약한 가상 기록).', next: '다음 진료 일정 확인' });
    }
    return s;
  }

  // ---- 문서 일관성 검사 ----
  function runChecks(s) {
    const out = [];
    s.plan.forEach(p => {
      const ok = p.basis && s.meeting.decided.includes(p.basis);
      out.push({ ok, from: '사례회의록', to: '서비스계획서', text: `목표 ${p.goal}「${p.outcome}」의 근거가 회의 결정 사항에 있는가`, why: ok ? `회의 결정: ${p.basis}` : (p.basis ? '근거로 적은 내용이 회의 결정이 아니라 미결 사항입니다.' : '근거로 연결된 회의 결정이 없습니다. 회의에서 정하지 않은 목표입니다.') });
      out.push({ ok: !!p.measure, from: '서비스계획서', to: '서비스계획서', text: `목표 ${p.goal}에 측정·평가 방법이 있는가`, why: p.measure ? `측정: ${p.measure}` : '측정 방법이 비어 있어 점검 때 달성 정도를 볼 수 없습니다.' });
    });
    const recText = s.records.map(r => r.how + ' ' + r.text).join(' ');
    s.review.progress.forEach(p => {
      const key = p.includes('밑반찬') ? '밑반찬' : p.includes('방문건강') ? '방문' : p.includes('병원 동행') ? '병원 동행' : p;
      const ok = recText.includes(key);
      out.push({ ok, from: '과정기록지', to: '점검보고서', text: `점검보고서의 제공 경과「${p}」가 과정기록에 있는가`, why: ok ? '과정기록에서 같은 개입을 찾았습니다.' : '과정기록에 없는 개입입니다. 기록 없는 개입은 보고서에 쓰지 않습니다.' });
    });
    s.links.filter(l => l.state === '이용').forEach(l => {
      const ok = recText.includes(l.candidate.split(/[ (]/)[0]) || recText.includes(l.need.split(' ')[0]);
      out.push({ ok, from: '지원연계 맵', to: '과정기록지', text: `「${l.need}」를 '이용'으로 표시한 근거 기록이 있는가`, why: ok ? '이용을 확인한 과정기록이 있습니다.' : '이용을 확인한 기록이 없습니다.' });
    });
    s.assess.domains.filter(d => d.state !== '확인').forEach(d => {
      out.push({ ok: false, soft: true, from: '사례보고서', to: '사례보고서', text: `사정 「${d.area}: ${d.text}」`, why: `${d.state} 상태입니다. 보고서에 사실로 쓰기 전에 다시 확인합니다.` });
    });
    return out;
  }

  // ---- 화면 ----
  const tabs = [{ id: 'overview', n: '00', label: '한눈에' }]
    .concat(C.steps.map(s => ({ id: 'step-' + s.id, n: '0' + s.id, label: s.short })))
    .concat([{ id: 'check', n: '08', label: '문서 일관성' }, { id: 'build', n: '09', label: '개발 현황' }]);

  function stepHead(st) {
    return `<div class="panel-head"><p class="kicker">${String(st.id).padStart(2, '0')} 단계 · 연결 문서: ${esc(st.doc)}</p><h2>${esc(st.title)}</h2><p>${esc(st.purpose)}</p></div>
      <div class="grid2"><div class="card"><h3>기록하는 것</h3>${list(st.fields)}</div><div class="card soft"><h3>사람이 확인할 것</h3>${list(st.human)}</div></div>
      <h3 class="sample-h">가상 사례 <span class="code">${esc(caseData().code)}</span></h3>`;
  }
  function nextBtn(id) {
    const i = tabs.findIndex(t => t.id === id);
    const n = tabs[i + 1];
    return n ? `<div class="cta"><a class="btn primary" href="#${n.id}" data-go="${n.id}">다음: ${esc(n.label)} →</a></div>` : '';
  }

  const render = {
    overview(s) {
      return `<div class="panel-head"><h2>일곱 단계와 연결 서식</h2><p>단계마다 기록이 다음 서식의 근거가 됩니다. 앞 문서와 뒤 문서가 맞지 않으면 <b>08 문서 일관성</b>에서 알려 줍니다.</p></div>
      <ol class="flow">${C.steps.map(st => `<li><a href="#step-${st.id}" data-go="step-${st.id}"><b>${String(st.id).padStart(2, '0')}</b><span>${esc(st.title)}</span><small>${esc(st.doc)}</small></a></li>`).join('')}</ol>
      <div class="panel-head"><h2>사례파일 문서 순서</h2><p>세교 사례파일은 아래 순서로 쌓이고, 서로 내용이 맞아야 합니다.</p></div>
      <p class="docchain">${['사례보고서', '사례회의록', '점검보고서', '점검 회의결과', '과정기록지', '서비스계획서'].map(esc).join(' <span aria-hidden="true">→</span> ')}</p>
      <div class="panel-head"><h2>설계 원칙</h2></div>
      <div class="grid3">
        <div class="card"><h3>점수로 끝내지 않음</h3><p>척도 총점은 출발점입니다. 높은 문항과 긴급 신호를 총점과 따로 보여 주고, 바로 지원연계로 이어 갑니다.</p></div>
        <div class="card"><h3>사람이 확인한 기록만</h3><p>담당·동의·회의·승인·이용·성과는 사람이 확인해 적은 것만 반영합니다. AI는 초안과 요청문 미리보기까지만 씁니다.</p></div>
        <div class="card"><h3>상태를 글자로</h3><p>확인 / 미확인 / 상충, 초안 / 확정, 추천 / 문의 / 접수 / 이용 / 성과 확인을 색과 글자로 함께 표시합니다.</p></div>
        <div class="card"><h3>확정 기록은 정정으로</h3><p>확정한 과정기록·회의록·척도 결과는 고치지 않고, 사유를 남긴 정정 기록을 덧붙입니다.</p></div>
        <div class="card"><h3>척도를 섞지 않음</h3><p>청소년 25문항(OY-RALS)과 기관 위기도척도 16문항을 합치거나 환산하지 않습니다.</p></div>
        <div class="card"><h3>열람도 기록</h3><p>사례 열람·출력·내보내기를 모두 감사기록으로 남깁니다(내부 서버판).</p></div>
      </div>${nextBtn('overview')}`;
    },
    'step-1'(s, st) {
      const i = s.intake;
      return stepHead(st) + `<div class="case"><p class="who">${esc(s.who)} <small>${esc(s.note)}</small></p>
        <dl class="kv"><dt>발굴 경로</dt><dd>${esc(i.route)}</dd><dt>초기상담</dt><dd>${esc(i.date)}</dd>
        <dt>첫 안전 확인</dt><dd>${chip(i.safety.state)} ${esc(i.safety.text)}</dd>
        <dt>동의 범위</dt><dd>${chip(i.consent.state)} ${esc(i.consent.text)}</dd>
        <dt>바라는 것</dt><dd>${esc(i.want)}</dd><dt>진행 의견</dt><dd>${esc(i.opinion)}</dd></dl></div>` + nextBtn('step-1');
    },
    'step-2'(s, st) {
      const sc = s.assess.scale;
      const cells = Array.from({ length: sc.items }, (_, k) => `<li><b>${k + 1}</b><span>문항 원문 필요</span></li>`).join('');
      return stepHead(st) + `<div class="case">
        <h4>위기도척도 <small>${esc(sc.id)} · ${sc.items}문항 · 최대 ${sc.max}점</small></h4>
        <p class="warnline">문항 내용, 긴급개입 키포인트 기준, 위기수준 구간은 기관 양식 원문을 받은 뒤 넣습니다. 지금은 추정으로 만들지 않아 점수를 계산하지 않습니다. 미상 문항은 0점으로 처리하지 않습니다.</p>
        <ol class="scale">${cells}</ol>
        <p class="total">총점 <b>계산 안 함</b> <small>(원문 필요)</small> · 위기수준 <b>판정 안 함</b></p>
        <h4>영역별 사정</h4>
        <table class="tbl"><thead><tr><th scope="col">영역</th><th scope="col">구분</th><th scope="col">내용</th><th scope="col">상태</th></tr></thead>
        <tbody>${s.assess.domains.map(d => `<tr><td>${esc(d.area)}</td><td>${esc(d.kind)}</td><td>${esc(d.text)}</td><td>${chip(d.state)}</td></tr>`).join('')}</tbody></table>
        <h4>강점과 자원</h4>${list(s.assess.strengths)}</div>` + nextBtn('step-2');
    },
    'step-3'(s, st) {
      return stepHead(st) + `<div class="case"><p class="legend">상태는 서로 다른 단계입니다: ${C.linkStates.map(chip).join(' → ')}</p>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">욕구</th><th scope="col">근거</th><th scope="col">기존 지원</th><th scope="col">기관 후보</th><th scope="col">문의 내용</th><th scope="col">담당·다음 확인</th><th scope="col">상태</th></tr></thead>
        <tbody>${s.links.map(l => `<tr><td><b>${esc(l.need)}</b></td><td>${esc(l.basis)}</td><td>${esc(l.existing)}</td><td>${esc(l.candidate)}</td><td>${esc(l.ask)}</td><td>${esc(l.owner)} · ${esc(l.next)}</td><td>${chip(l.state)}</td></tr>`).join('')}</tbody></table></div>
        <p class="hint">기관 후보는 <a href="../">오산 복지자원 찾기</a> DB에서 고르는 방식으로 이을 예정입니다. 위 기관명은 시연용 예시입니다.</p></div>` + nextBtn('step-3');
    },
    'step-4'(s, st) {
      const m = s.meeting;
      return stepHead(st) + `<div class="case"><dl class="kv"><dt>회의 일시</dt><dd>${esc(m.date)}</dd><dt>참석(역할)</dt><dd>${esc(m.who)}</dd><dt>회의록 상태</dt><dd>${chip(m.state)}</dd></dl>
        <div class="grid2"><div class="card"><h3>결정 사항</h3>${list(m.decided)}</div><div class="card soft"><h3>미결 사항</h3>${list(m.pending)}</div></div></div>` + nextBtn('step-4');
    },
    'step-5'(s, st) {
      return stepHead(st) + `<div class="case"><div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">목표</th><th scope="col">기대 변화(Outcome)</th><th scope="col">개입(Action)</th><th scope="col">회의 근거</th><th scope="col">측정</th><th scope="col">담당·기한</th></tr></thead>
        <tbody>${s.plan.map(p => `<tr><td>${p.goal}</td><td><b>${esc(p.outcome)}</b></td><td>${esc(p.action)}</td><td>${p.basis ? esc(p.basis) : chip('확인 필요')}</td><td>${p.measure ? esc(p.measure) : chip('확인 필요')}</td><td>${esc(p.owner)} · ${esc(p.due)}</td></tr>`).join('')}</tbody></table></div></div>` + nextBtn('step-5');
    },
    'step-6'(s, st) {
      const r = s.review;
      return stepHead(st) + `<div class="case"><h4>과정기록</h4><ol class="records">${s.records.map(x => `<li><p class="when">${esc(x.date)} · ${esc(x.how)}</p><p><b>${esc(x.who)}</b> ${esc(x.text)}</p><p class="next">다음: ${esc(x.next)}</p></li>`).join('')}</ol>
        <h4>점검보고서 <small>${esc(r.date)}</small></h4><dl class="kv"><dt>서비스 제공 경과</dt><dd>${list(r.progress)}</dd><dt>점검 결과 사정</dt><dd>${esc(r.result)}</dd><dt>향후 계획</dt><dd>${esc(r.next)}</dd></dl></div>` + nextBtn('step-6');
    },
    'step-7'(s, st) {
      const c = s.closure;
      return stepHead(st) + `<div class="case"><dl class="kv"><dt>상태</dt><dd>${chip(c.state)} ${esc(c.reason)}</dd><dt>잔여 위험요인</dt><dd>${list(c.residual)}</dd><dt>이관</dt><dd>${chip('미확인')} ${esc(c.transfer)}</dd><dt>사후관리</dt><dd>${esc(c.follow)}</dd></dl></div>` + nextBtn('step-7');
    },
    check(s) {
      const rs = runChecks(s);
      const bad = rs.filter(r => !r.ok && !r.soft).length, soft = rs.filter(r => r.soft).length;
      return `<div class="panel-head"><p class="kicker">08 · 시스템의 핵심 기능</p><h2>문서 일관성 검사</h2><p>앞 문서에 없는 내용이 뒤 문서에 나오거나, 목표에 근거·측정이 빠졌는지 찾습니다. 판정을 대신하지 않고, 사람이 다시 볼 곳만 알려 줍니다.</p></div>
        <label class="switch"><input type="checkbox" id="fixToggle" ${fixed ? 'checked' : ''}> 담당자가 고친 뒤의 가상 사례로 보기</label>
        <p class="summary" aria-live="polite">${chip(bad ? '확인 필요' : '통과')} 문서끼리 맞지 않는 곳 <b>${bad}</b>건 · 다시 확인할 사정 <b>${soft}</b>건 · 검사 ${rs.length}건</p>
        <ul class="checks">${rs.map(r => `<li class="${r.ok ? 'ok' : r.soft ? 'soft' : 'bad'}"><span class="path">${esc(r.from)} → ${esc(r.to)}</span>${chip(r.ok ? '통과' : r.soft ? '미확인' : '확인 필요')}<p><b>${esc(r.text)}</b></p><p class="why">${esc(r.why)}</p></li>`).join('')}</ul>` + nextBtn('check');
    },
    build() {
      return `<div class="panel-head"><p class="kicker">09</p><h2>개발 현황</h2><p>지금 보는 것은 화면 구성을 확인하는 공개 시연판입니다. 실제 운영판은 기관 내부 서버로 따로 만듭니다.</p></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">구분</th><th scope="col">시연판(이 화면)</th><th scope="col">운영판(계획)</th></tr></thead><tbody>
        <tr><td>자료</td><td>가상 사례 1건</td><td>실제 사례(동의 범위 안)</td></tr>
        <tr><td>저장</td><td>없음, 새로고침하면 처음으로</td><td>기관 내부 서버 DB, 기관·담당 범위 격리</td></tr>
        <tr><td>확정·정정</td><td>표시만</td><td>확정 후 수정 불가, 사유 있는 정정 기록</td></tr>
        <tr><td>감사기록</td><td>없음</td><td>열람·출력·내보내기까지 기록</td></tr>
        <tr><td>위기도척도</td><td>문항 원문 필요</td><td>기관 양식 원문 대조 후 조회 전용 계산</td></tr>
        <tr><td>출력</td><td>없음</td><td>확정 당시 내용으로 재출력, HWP 붙여넣기 기준</td></tr></tbody></table></div>
        <div class="panel-head"><h2>권한표 초안</h2><p>확정 전 제안입니다. 회의록 확정과 종결·이관 결정을 팀장 권한으로 두었습니다.</p></div>
        <div class="tbl-wrap"><table class="tbl roles"><thead><tr><th scope="col">동작</th><th scope="col">사례담당</th><th scope="col">팀장</th><th scope="col">타 팀 직원</th><th scope="col">기관관리자</th><th scope="col">감사</th></tr></thead>
        <tbody>${C.roles.map(r => `<tr><td>${esc(r[0])}</td>${r.slice(1).map(v => `<td>${v ? '<span aria-label="허용">●</span>' : '<span class="sr">없음</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="panel-head"><h2>아직 정하지 않은 것</h2></div>
        ${list(['위기도척도 문항·긴급개입 기준·위기수준 구간(양식 원문 필요)', '양식에 미상 표기가 없을 때 미상 문항 처리 방법', '이관 기록을 종결 앞에 둘지 뒤에 둘지', '권한표 확정'])}`;
    }
  };

  function show(id, focus) {
    if (!tabs.some(t => t.id === id)) id = 'overview';
    const s = caseData();
    const st = C.steps.find(x => 'step-' + x.id === id);
    const p = $('#panels');
    p.innerHTML = `<section id="${id}" class="panel" role="tabpanel" aria-labelledby="tab-${id}" tabindex="-1">${render[id](s, st)}</section>`;
    document.querySelectorAll('#tabs [role=tab]').forEach(a => {
      const on = a.dataset.go === id;
      a.setAttribute('aria-selected', on ? 'true' : 'false');
      a.tabIndex = on ? 0 : -1;
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    const t = $('#fixToggle');
    if (t) t.addEventListener('change', () => { fixed = t.checked; show('check'); $('#fixToggle').focus(); });
    if (focus) { $('#tabs').scrollIntoView({ block: 'start' }); $('#' + id).focus({ preventScroll: true }); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#hotlines').innerHTML = C.hotlines.map(h => `<li><a href="tel:${esc(h.tel)}"><b>${esc(h.num)}</b> ${esc(h.label)}</a></li>`).join('');
    $('#tabs').innerHTML = tabs.map(t => `<a role="tab" id="tab-${t.id}" href="#${t.id}" data-go="${t.id}" aria-controls="${t.id}"><b>${t.n}</b>${esc(t.label)}</a>`).join('');
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-go]');
      if (!a) return;
      e.preventDefault();
      let go = a.dataset.go;
      if (go === '1') go = 'step-1';
      show(go, true);
    });
    $('#tabs').addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const all = [...document.querySelectorAll('#tabs [role=tab]')];
      const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      show(n.dataset.go); n.focus();
    });
    show(location.hash.slice(1) || 'overview', false);
  });
})();
