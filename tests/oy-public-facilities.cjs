/* 공공데이터 기관 목록(facilities.json) 연결 시험: OY-RALS 03 연결 규칙·판정 불변·개인정보·공통 모듈. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require('../docs/assets/public-facilities.js');
const F = require('../docs/youth-risk/oy-public-facilities-v1.js');
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/public-api/facilities.json'), 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/public-api-sources.json'), 'utf8'));

// 1. 파일 모양: 모든 묶음은 수집 설정에 있는 기관형 데이터이고, 지역은 오산·경기만, 대표자 이름 같은 칸은 없다.
const facilityIds = new Set(cfg.sources.filter(s => s.kind === 'facility').map(s => s.id));
assert.ok(D.groups.length >= 8, '기관 목록 묶음 8종 이상');
for (const g of D.groups) {
  assert.ok(facilityIds.has(g.id), '설정에 없는 묶음: ' + g.id);
  for (const i of g.items) {
    assert.ok(['osan', 'near', 'gyeonggi'].includes(i.region), g.id + ' 지역');
    if (i.region === 'near') assert.ok(/수원시|화성시|평택시/.test(i.address) && /^(수원시|화성시|평택시)$/.test(i.city), g.id + ' 인근 시 주소: ' + i.address);
    if (i.region === 'gyeonggi') assert.ok(!/수원시|화성시|평택시/.test(i.address), g.id + ' 인근 시 기관이 경기로 남음: ' + i.name);
    assert.ok(i.name, g.id + ' 이름 없음');
    assert.ok(!('rprsvNm' in i) && !JSON.stringify(i).includes('rprsvNm'), '대표자 이름을 싣지 않음');
    if (i.region === 'osan') assert.ok(/오산시/.test(i.address), g.id + ' 오산 주소: ' + i.address);
    else assert.ok(!/오산시/.test(i.address), g.id + ' 경기 묶음에 오산 기관 중복: ' + i.name);
  }
}
const ids = new Set(D.groups.map(g => g.id));
for (const id of F.RULES.map(r => r.src).filter(id => !id.startsWith('_'))) assert.ok(facilityIds.has(id), '규칙의 데이터 id가 설정에 있음: ' + id);

// 2. 연결 규칙: 점수 0이면 아무것도 잇지 않음, 미상(null)은 0으로 보지 않고 무시
const zero = F.build({ answers: Array(25).fill(0) }, { data: D });
assert.strictEqual(zero.links.length, 0, '모두 0점이면 연결 없음');
const unknown = F.build({ answers: Array(25).fill(null) }, { data: D });
assert.strictEqual(unknown.links.length, 0, '모두 미상이면 연결 없음');

const a = Array(25).fill(0); a[19] = 2; a[24] = 1; a[5] = 3;
const m = F.build({ answers: a, caseContext: '' }, { data: D });
const labels = m.links.map(l => l.id);
if (ids.has('mogef-sunflower-center')) assert.strictEqual(labels[0], 'mogef-sunflower-center', '25번 응답이면 해바라기센터가 맨 앞(안전 먼저)');
if (ids.has('mogef-youth-shelter')) {
  const sh = m.links.find(l => l.id === 'mogef-youth-shelter');
  assert.ok(sh && sh.why.some(w => w.startsWith('20번')), '20번 2점 → 청소년쉼터');
  assert.ok(/화성|평택|수원|용인|안성/.test(sh.items[0].address), '쉼터는 오산에서 가까운 시부터: ' + sh.items[0].address);
}
for (const l of m.links) {
  assert.ok(l.why.length >= 1 && l.why.length <= 3, '연결 고리 1~3개');
  if (l.osan) assert.ok(l.items.every(i => i.region === 'osan'), '오산 기관이 있으면 오산 것만 보임');
}
// 정신건강 의원 규칙은 소아청소년과 일반 의원을 섞지 않음
const mh = m.links.find(l => l.id === 'nmc-hospital-osan');
if (mh) assert.ok(mh.items.every(i => /정신|마음|심리/.test(i.name)), '정신건강 의원만');

// 3. 판정 불변: build는 입력을 바꾸지 않음
const before = JSON.stringify(a);
F.build({ answers: a }, { data: D });
assert.strictEqual(JSON.stringify(a), before, '응답 배열 불변');

// 4. 화면·글: 3종 넘으면 접고, 출처와 '연계 전 확인'을 밝힘, 글 출력에 학생 정보 없음
const html = F.html(m);
assert.ok(/연계 전 전화로 확인/.test(html) && /출처: 공공데이터포털/.test(html));
if (m.links.length > 3) assert.ok(/<details class="oypb-more">/.test(html), '3종 넘으면 접기');
const t = F.text(m);
assert.ok(t.startsWith('[공공데이터 기관 · 연계 전 확인]'));

// 4-1. 소년보호 통고(고정 안내): 지원 우선순위 3단계 이상 + 12·13번 3점 이상일 때만, 서술 '가출'만으로는 띄우지 않음.
//      청소년자립지원관: 시설보호·가정위탁 서술 + 고등학생일 때만(데이터가 수집되어 있으면).
{
  global.window = globalThis;
  const SRC = path.join(ROOT, 'docs/youth-risk');
  const app = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
  const grab = name => { const s = app.indexOf('var ' + name + '=['); let i = app.indexOf('[', s), d = 0, j = i; for (; j < app.length; j++) { const c = app[j]; if (c === '[') d++; else if (c === ']') { d--; if (!d) break } } return JSON.parse(app.slice(i, j + 1)) };
  const domains = grab('domains'), routes = grab('routes');
  const pay = (answers, ctx, grade) => ({ type: 'youth-support-data-v1', answers, domains: domains.map(d => ({ name: d.name, items: d.items.slice(), hints: d.hints.slice() })), routes, resources: [], explicit: [], followups: {}, caseContext: ctx, student: { gender: '미확인', grade, dong: '' } });
  const hi = Array(25).fill(1); hi[11] = 3; hi[12] = 3; hi[19] = 3; hi[2] = 3; hi[3] = 3;
  const lo = Array(25).fill(0); lo[11] = 1;
  const ctx = '고2 학생, 아동양육시설에서 생활함. 최근 가출 반복';
  const withIndep = Object.assign({}, D, { groups: D.groups.filter(g => g.id !== 'mogef-youth-indep-center').concat([{ id: 'mogef-youth-indep-center', label: '청소년자립지원관', uses: ['independence'], items: [{ name: '가상 자립지원관', address: '경기도 화성시 가상로 1', region: 'gyeonggi' }] }]) });
  const H = F.build(pay(hi, ctx, '고2'), { data: withIndep });
  const notice = H.links.find(l => l.id === '_juvenile-notice');
  assert.ok(notice && notice.why.some(w => w.startsWith('12번')), '3단계 이상 + 12번 3점 → 통고제도 안내');
  assert.ok(notice.items[0].match_id === 'ORG-N25-SWFCOURT' && /보호 절차/.test(notice.note), '통고는 복지자원 DB 기관과 잇고 보호 절차임을 밝힘');
  assert.ok(H.links.some(l => l.id === 'mogef-youth-indep-center'), '시설보호 서술 + 고2 → 청소년자립지원관');
  const L = F.build(pay(lo, ctx, '고2'), { data: withIndep });
  assert.ok(!L.links.some(l => l.id === '_juvenile-notice'), '서술 가출만으로는 통고 안내 없음');
  const M1 = F.build(pay(hi, ctx, '중1'), { data: withIndep });
  assert.ok(!M1.links.some(l => l.id === 'mogef-youth-indep-center'), '중학생에게는 자립지원관 안내 없음');
}

// 5. 공통 모듈: 성인 대상 칸에는 청소년 전용 목록을 넣지 않음, 근처 순 정렬
for (const g of P.forNeed(D, '정신건강', '노인')) assert.ok(!P.YOUTH_ONLY.has(g.id), '노인 칸에 청소년 전용 목록: ' + g.id);
assert.ok(P.forNeed(D, '안전·권리보호', '청소년').length >= 1);
const near = P.nearFirst([{ region: 'gyeonggi', address: '경기도 고양시' }, { region: 'gyeonggi', address: '경기도 화성시' }, { region: 'osan', address: '경기도 오산시' }]);
assert.deepStrictEqual(near.map(i => i.address), ['경기도 오산시', '경기도 화성시', '경기도 고양시']);
assert.strictEqual(P.phoneText('0312161117'), '031-216-1117');
assert.ok(!/javascript:/i.test(P.item({ name: 'x', site: 'javascript:alert(1)', region: 'osan', address: '경기도 오산시' })), '누리집 주소 안전');

// 6. 화면 연결: (OY-RALS 03·05 제외)·자원 공백 지도·통합돌봄·전체 목록 화면
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// 2026-11-26: 03 자원연계 지도 아래 공공 API 블록은 지도와 겹쳐 뺐다(지훈). 다시 붙지 않게 확인한다.
assert.ok(!/OYPublicFacilities|OYPublicBenefits/.test(read('docs/youth-risk/journey-v88.js')), '03 지도 아래 공공 API 블록 제거');
// 2026-11-26: OY-RALS(03·05)는 공공 API 블록을 쓰지 않는다. 모듈 파일은 시험·다른 화면 재사용을 위해 남기되 OY-RALS 화면은 읽지 않는다.
assert.ok(!/oy-public-(facilities|benefits)-v1\.js|assets\/public-facilities\.js/.test(read('docs/youth-risk/index.html')), 'OY-RALS에서 공공 API 블록 스크립트 제거');
assert.ok(!/OYPublicFacilities|OYPublicBenefits/.test(read('docs/youth-risk/oy-final-report-v1.js')), '05 공공 API 블록 제거');
assert.ok(/public-facilities\.js/.test(read('docs/resource-gaps.html')) && /PublicFacilities/.test(read('docs/assets/resource-gaps.js')));
assert.ok(/public-facilities\.js/.test(read('docs/care/index.html')) && /publicFacilities/.test(read('docs/care/index.html')));
assert.ok(/public-facilities\.html/.test(read('docs/index.html')));
console.log(`PASS: public facilities ${D.groups.length} groups / ${D.groups.reduce((n, g) => n + g.items.length, 0)} items, OY-RALS links ${m.links.length}`);
