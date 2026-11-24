/* © 2026 오산세교종합사회복지관 김지훈 팀장.
   공통 도구 UI v1 (2026-11-25): 창 열기·닫기, 긴급 전화 버튼, 떠오름, 반짝임 멈춤, 개수 튀기기.
   아무것도 저장하거나 보내지 않습니다(브라우저 저장소·전송 없음). */
(function (root) {
  'use strict';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let dlg = null, opener = null;

  function ensure() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'tu-dialog';
    dlg.setAttribute('aria-labelledby', 'tuDlgTitle');
    dlg.innerHTML = '<div class="tu-dlg-head"><div><span class="tu-dlg-kicker" id="tuDlgKicker"></span><h2 id="tuDlgTitle"></h2></div><button type="button" class="tu-dlg-close" data-close>닫기</button></div><div class="tu-dlg-body" id="tuDlgBody"></div><div class="tu-dlg-foot" id="tuDlgFoot" hidden></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) close(); });
    dlg.addEventListener('close', () => {
      document.documentElement.classList.remove('tu-lock');
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      opener = null;
    });
    return dlg;
  }

  /* open({kicker, title, html, foot, wide}) — html·foot는 이미 이스케이프한 문자열 */
  function open(o) {
    const d = ensure();
    opener = document.activeElement;
    d.querySelector('#tuDlgKicker').textContent = o.kicker || '';
    d.querySelector('#tuDlgTitle').textContent = o.title || '';
    d.querySelector('#tuDlgBody').innerHTML = o.html || '';
    const foot = d.querySelector('#tuDlgFoot');
    foot.innerHTML = o.foot || ''; foot.hidden = !o.foot;
    d.classList.toggle('tu-wide', !!o.wide);
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    document.documentElement.classList.add('tu-lock');
    d.querySelector('#tuDlgBody').scrollTop = 0;
    return d;
  }
  function close() { if (!dlg) return; if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); } }

  /* 긴급 전화 버튼: list = [[번호, 이름, 설명]] */
  function sos(list, lead) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tu-sos tu-press'; b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = '<span aria-hidden="true">☎</span> 긴급 전화';
    b.addEventListener('click', () => open({
      title: '지금 바로 전화',
      html: '<p>' + (lead || '생명·신체가 위험하면 <b>112·119가 먼저</b>입니다. 번호를 누르면 휴대전화에서 바로 전화가 걸립니다.') + '</p><ul class="tu-hot">' +
        list.map(x => '<li><a href="tel:' + esc(String(x[0]).replace(/[^0-9]/g, '')) + '"><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + (x[2] ? ' · ' + esc(x[2]) : '') + '</span></a></li>').join('') + '</ul>'
    }));
    document.body.appendChild(b);
    return b;
  }

  /* 새 내용만 짧게 떠오르게(움직임 줄이기면 CSS가 끔) */
  function enter(el, stagger) {
    if (!el) return;
    const cls = stagger ? 'tu-stagger' : 'tu-enter';
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }
  function done(el) { if (el) el.classList.add('tu-done'); }
  function bump(el, n) {
    if (!el) return;
    if (el.textContent !== String(n)) { el.textContent = n; el.classList.add('tu-bump'); setTimeout(() => el.classList.remove('tu-bump'), 160); }
  }

  root.ToolsUI = { open, close, sos, enter, done, bump, esc };
})(typeof window !== 'undefined' ? window : this);
