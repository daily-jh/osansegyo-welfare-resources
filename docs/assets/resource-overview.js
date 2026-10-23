/* © 2026 김지훈. 기관명만 표시하고 각 기관의 기존 상세 카드로 연결합니다. */
(() => {
  'use strict';
  const data = window.WELFARE_DATA;
  const map = window.ResourceOverview;
  const $ = selector => document.querySelector(selector);
  const board = $('#overviewGrid'), jumps = $('#overviewJumps'), status = $('#overviewStatus');
  if (!board || !jumps || !status) return;
  if (!data || !map) {status.textContent = '복지자원 데이터를 불러오지 못했습니다. 메인 검색을 이용해 주세요.';return;}
  const state = {scope: '오산시', keyword: ''};
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function render() {
    let snapshot;
    try {snapshot = map.build(data, state.scope, state.keyword);} catch (error) {
      status.textContent = '영역별 기관 연결도를 표시할 수 없습니다.';
      return;
    }
    const gridFragment = document.createDocumentFragment();
    const jumpFragment = document.createDocumentFragment();
    snapshot.sections.forEach((section, i) => {
      const block = make('section', 'overview-card');
      block.id = section.id;
      block.setAttribute('aria-labelledby', section.id + '-title');
      const header = make('div', 'overview-card-head');
      const index = make('span', 'overview-card-index', String(i + 1).padStart(2, '0'));
      index.setAttribute('aria-hidden', 'true');
      const h2 = make('h2', '', section.name);
      h2.id = section.id + '-title';
      const count = make('span', 'overview-card-count', section.organizations.length + '곳');
      header.append(index, h2, count);
      block.append(header);
      const list = make('ul', 'overview-organizations');
      if (section.organizations.length) {
        for (const org of section.organizations) {
          const item = document.createElement('li');
          const anchor = make('a', 'overview-org-link', org.name);
          anchor.href = map.institutionLink(org.id);
          anchor.setAttribute('aria-label', org.name + ' 기관 상세정보로 이동');
          item.append(anchor);
          list.append(item);
        }
      } else {
        const none = make('li', 'overview-no-match', '해당 영역의 등록 기관이 없습니다.');
        list.append(none);
      }
      block.append(list);
      gridFragment.append(block);
      const jump = make('a', 'overview-jump', section.name);
      jump.href = '#' + section.id;
      jump.setAttribute('aria-label', section.name + ' 영역으로 이동');
      jumpFragment.append(jump);
    });
    board.replaceChildren(gridFragment);
    jumps.replaceChildren(jumpFragment);
    status.textContent = snapshot.count + '개 기관 · ' + snapshot.sections.length + '개 영역';
    $('#overviewNote').textContent = '한 기관이 여러 영역에 표시될 수 있습니다. 서비스 대상·접수 여부는 기관 상세에서 확인해 주세요.';
    document.querySelectorAll('[data-overview-scope]').forEach(button => {
      const active = button.dataset.overviewScope === state.scope;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('selected', active);
    });
  }
  $('#overviewScopes').addEventListener('click', event => {
    const button = event.target.closest('button[data-overview-scope]');
    if (!button) return;
    state.scope = button.dataset.overviewScope;
    render();
  });
  $('#overviewKeyword').addEventListener('input', event => {
    state.keyword = event.target.value.trim();
    render();
  });
  $('#overviewReset').addEventListener('click', () => {
    state.scope = '오산시';
    state.keyword = '';
    $('#overviewKeyword').value = '';
    render();
  });
  render();
  if (window.ProgramFeed?.load) window.ProgramFeed.load(data).then(render);
})();
