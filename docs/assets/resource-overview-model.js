/* © 2026 김지훈. 영역별 연결도는 공개 기관·서비스 검색용 분류만 사용합니다. */
(function (root) {
  'use strict';
  const SCOPES = ['오산시', '경기도', '민간', '전체'];
  const norm = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase('ko');
  const eligible = org => org && !['중단', '폐지'].includes(org.status)
    && Array.isArray(org.services) && org.services.length > 0;
  function build(data, scope = '오산시', keyword = '') {
    if (!data || !Array.isArray(data.organizations) || !Array.isArray(data.taxonomy?.need)) {
      throw new Error('기관·서비스 분류 데이터를 읽을 수 없습니다.');
    }
    if (!SCOPES.includes(scope)) throw new Error('허용되지 않은 지역 범주입니다.');
    const words = norm(keyword);
    const needs = data.taxonomy.need;
    const groups = new Map(needs.map(name => [name, new Map()]));
    const other = new Map();
    let count = 0;
    for (const org of data.organizations) {
      if (!eligible(org) || (scope !== '전체' && org.level !== scope)) continue;
      if (words && !norm(org.name).includes(words)) continue;
      count += 1;
      const membership = new Set();
      for (const service of org.services) {
        for (const need of (Array.isArray(service.tags?.need) ? service.tags.need : [])) {
          if (groups.has(need)) membership.add(need);
        }
      }
      const brief = {id: org.id, name: org.name, level: org.level};
      if (!membership.size) other.set(org.id, brief);
      else for (const name of membership) groups.get(name).set(org.id, brief);
    }
    const sort = items => [...items.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.id.localeCompare(b.id));
    const sections = needs.map((name, i) => ({name, id: 'need-' + (i + 1), organizations: sort(groups.get(name))}));
    if (other.size) sections.push({name: '분류 확인 필요', id: 'need-unclassified', organizations: sort(other)});
    return {count, scope, sections, totalAppearances: sections.reduce((sum, section) => sum + section.organizations.length, 0)};
  }
  function institutionLink(id) {
    return /^[A-Za-z0-9_-]+$/.test(String(id || '')) ? './index.html#org=' + encodeURIComponent(id) : './index.html#searchArea';
  }
  const api = {build, institutionLink, SCOPES};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ResourceOverview = api;
})(typeof window !== 'undefined' ? window : globalThis);
