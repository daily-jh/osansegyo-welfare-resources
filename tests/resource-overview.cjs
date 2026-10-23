const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Model = require('../docs/assets/resource-overview-model.js');
const ctx = {window: {}};
vm.runInNewContext(fs.readFileSync('docs/assets/data.js', 'utf8'), ctx);
const data = ctx.window.WELFARE_DATA;
const needs = data.taxonomy.need;
assert(needs.length >= 10, 'Existing needs taxonomy must be reused');
const osan = Model.build(data, '오산시');
assert.equal(osan.scope, '오산시');
const searchable = data.organizations.filter(o => o.level === '오산시' && !['폐지', '중단'].includes(o.status) && o.services.length);
assert.equal(osan.count, searchable.length);
assert(osan.sections.length >= needs.length);
for (const section of osan.sections) {
  assert(section.id.startsWith('need-'));
  assert.equal(new Set(section.organizations.map(o => o.id)).size, section.organizations.length,
    'Institution cannot duplicate inside one need group');
  for (const org of section.organizations) {
    assert.equal(org.level, '오산시');
    assert(searchable.some(o => o.id === org.id));
    assert.equal(Model.institutionLink(org.id), './index.html#org=' + org.id);
  }
}
const all = Model.build(data, '전체');
assert(all.count >= osan.count);
const matching = Model.build(data, '전체', '초록우산');
assert(matching.count >= 1);
assert(matching.sections.every(s => s.organizations.every(o => o.name.includes('초록우산'))));
assert.throws(() => Model.build(data, '없는 범주'), /허용되지 않은/);
const fixture = {
  taxonomy: {need: ['의료·건강', '정신건강']},
  organizations: [
    {id: 'safe', name: '오산마음센터', level: '오산시', status: '운영중',
      services: [{tags: {need: ['정신건강', '정신건강']}}, {tags: {need: ['정신건강', '의료·건강']}}]},
    {id: 'legacy', name: '과거 안내', level: '오산시', status: '미확인', services: []},
    {id: 'closed', name: '운영 중단', level: '오산시', status: '중단', services: [{tags: {need: ['의료·건강']}}]},
    {id: 'unclassified', name: '분류 미확인', level: '오산시', status: '미확인', services: [{tags: {need: []}}]},
    {id: 'private', name: '전국센터', level: '민간', status: '운영중', services: [{tags: {need: ['정신건강']}}]}
  ]
};
const result = Model.build(fixture, '오산시');
assert.equal(result.count, 2);
assert.deepEqual(result.sections[0].organizations.map(o => o.id), ['safe']);
assert.deepEqual(result.sections[1].organizations.map(o => o.id), ['safe']);
assert.equal(result.sections.at(-1).name, '분류 확인 필요');
assert.equal(result.sections.at(-1).organizations[0].id, 'unclassified');
assert.equal(Model.institutionLink('<script>'), './index.html#searchArea');
const html = fs.readFileSync('docs/resource-map.html', 'utf8');
const home = fs.readFileSync('docs/index.html', 'utf8');
const mapApp = fs.readFileSync('docs/assets/resource-overview.js', 'utf8');
assert.match(html, /오산 복지자원 한눈에 보기/);
assert.match(home, /오산 복지자원 찾기/);
assert.match(home, /href="resource-map.html"/);
assert.match(html, /resource-overview-model.js/);
assert.match(html, /resource-overview.js/);
assert.match(html, /assets\/data.js/);
assert.match(mapApp, /ProgramFeed.load\(data\)/);
console.log('PASS overview: current catalog, scope, de-duplication, legacy exclusion, deep links and page navigation');
