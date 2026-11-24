/* 오산 통합돌봄 길잡이(docs/care) 시험: 규칙·자료·연결·개인정보 원칙 */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
global.window = {};
require('../docs/assets/data.js');
const W = window.WELFARE_DATA;
const C = require('../docs/care/care-data.js'), M = require('../docs/care/care-model.js');

// 1) 자료 무결성: 영역 6개, 서비스 id 유일, 영역·제공 방법·출처 유효
assert.deepEqual(C.domains.map(d => d.id), ['health', 'prevent', 'ltc', 'daily', 'housing', 'family']);
const ids = C.services.map(s => s.id);
assert.equal(new Set(ids).size, ids.length, 'service id unique');
for (const s of C.services) {
  assert.ok(C.domains.some(d => d.id === s.domain), s.id + ' domain');
  assert.ok(C.channels[s.channel], s.id + ' channel');
  assert.match(s.source, /^https:\/\//, s.id + ' source');
  assert.match(s.law, /제\d+조/, s.id + ' law article');
  new RegExp(s.match);
}
for (const list of Object.values(M.suggest)) for (const id of list) assert.ok(ids.includes(id), 'suggest ' + id);
assert.equal(C.steps.length, 8);
for (const q of M.questions) assert.ok(C.domains.some(d => d.id === q.domain), q.id);

// 2) 판정하지 않는 확인 규칙
let r = M.evaluate({ age: '65+', yes: ['h1', 'd1'], who: 'self' });
assert.equal(r.level, 'apply'); assert.equal(r.scope.id, 'in'); assert.deepEqual(r.domains, ['health', 'daily']);
assert.equal(r.serviceIds[0], 'D8', '복합욕구면 통합사례관리 먼저');
r = M.evaluate({ age: 'under65', disability: 'none', yes: ['o1'] });
assert.equal(r.level, 'single'); assert.equal(r.scope.id, 'maybe');
assert.ok(!r.serviceIds.includes('D8'));
r = M.evaluate({ age: '65+', yes: [] });
assert.equal(r.level, 'none'); assert.equal(r.serviceIds.length, 0);
r = M.evaluate({ age: '65+', emergency: true, yes: ['h1'] });
assert.equal(r.level, 'emergency', '위급 응답이 먼저');
r = M.evaluate({ age: '65+', ltc: 'grade', yes: ['d1'] });
assert.deepEqual(r.domains, ['ltc', 'daily'], '등급이 있으면 장기요양 영역');
assert.ok(r.priority.some(p => p.includes('재가급여자')));
r = M.evaluate({ age: '65+', ltc: 'rejected', who: 'agency', yes: ['h2', 'f1', 'd3'] });
assert.equal(r.exOfficio.length, 3, '기각·퇴원·보호자 곤란 직권 경로');
assert.equal(r.preExamWaived, true, '퇴원 연계는 사전조사 면제');
r = M.evaluate({ age: 'under65', disability: 'severe', yes: ['l2', 'h3'] });
assert.equal(r.scope.id, 'in'); assert.ok(r.priority.some(p => p.includes('중증장애인')));
r = M.evaluate({ age: '65+', ltc: 'none', yes: ['l2', 'd1'] });
assert.ok(r.serviceIds.includes('L1'), '등급 없으면 장기요양 신청 안내');
assert.equal(M.evaluate({ yes: ['<script>'] }).domains.length, 0, '모르는 값은 버림');

// 3) 지원계획 초안 점검
assert.equal(M.addMonths('2026-01-31', 1), '2026-02-28');
assert.equal(M.addMonths('2026-11-24', 13), '2027-12-24');
let v = M.planReview({ rows: [{ service: 'D1', provider: '오산노인종합복지관', amount: '주 1회', period: '6개월' }, { service: 'P1', provider: '오산시보건소', amount: '월 1회', period: '6개월' }], consent: true, meeting: '2026-12-01' }, C.services);
assert.equal(v.providers, 2); assert.deepEqual(v.domains.sort(), ['daily', 'prevent']);
assert.ok(v.warnings.some(w => w.includes('연계 방법')), '2개 기관이면 연계 방법 필요');
assert.equal(v.monitor[0].date, '2027-01-01'); assert.equal(v.monitor.length, 5);
v = M.planReview({ rows: [{ service: 'D1', provider: 'A', amount: '1', period: '1' }, { service: 'P1', provider: 'B', amount: '1', period: '1' }], linkage: '월 1회 공유', consent: true }, C.services);
assert.equal(v.warnings.length, 0);
v = M.planReview({ rows: [{ service: 'D1', provider: 'A', amount: '1', period: '1' }], consent: true }, C.services);
assert.ok(v.warnings.some(w => w.includes('한 영역')));

// 4) 복지자원 DB 연결: 신청 창구와 핵심 자원이 이어져야 함
const windows = M.matchResources({ match: '통합돌봄 신청|통합판정조사' }, W, { dedupeOrg: true });
assert.ok(windows.filter(x => x.level === '오산시').length >= 8, '오산 행정복지센터 8곳 신청 창구');
assert.ok(windows.some(x => x.org.includes('국민건강보험공단')));
const must = { P2: '치매안심', P1: '오산시보건소', L1: '국민건강보험공단', D1: '오산노인종합복지관', F2: '오산시장애인종합복지관' };
for (const [id, org] of Object.entries(must)) assert.ok(M.matchResources(C.services.find(s => s.id === id), W).some(x => x.org.includes(org)), id + ' → ' + org);
for (const s of C.services) for (const m of M.matchResources(s, W)) assert.doesNotMatch(m.service, /초등학생|위안부/, s.id + ' 엉뚱한 매칭 ' + m.service);
const cov = M.coverage(C, W);
assert.equal(cov.length, 6); assert.ok(cov.flatMap(d => d.items).some(i => i.gap) && cov.flatMap(d => d.items).some(i => !i.gap));
assert.deepEqual(M.careCandidates({ items: [{ area: 'care', change: '신규 후보' }, { area: 'mental|care', change: '기존과 일치' }, { area: 'mental', change: '신규 후보' }] }).length, 1);

// 5) 화면 파일: 저장·전송 없음, 홈페이지 연결
const html = fs.readFileSync('docs/care/index.html', 'utf8'), app = fs.readFileSync('docs/care/care-app.js', 'utf8');
for (const id of ['law', 'check', 'plan', 'map']) assert.match(html, new RegExp(`id="${id}"`));
assert.doesNotMatch(app, /localStorage|sessionStorage|indexedDB|method:\s*'POST'|sendBeacon|XMLHttpRequest/, '입력값 저장·전송 금지');
assert.doesNotMatch(html, /name="(?:name|rrn|phone|address)"/, '개인정보 입력칸 없음');
const home = fs.readFileSync('docs/index.html', 'utf8');
assert.ok((home.match(/href="care\/"/g) || []).length >= 3, '메인 메뉴·첫 화면·자료 링크');
assert.ok(fs.existsSync(path.join('docs', 'care', 'care.css')));
console.log(`PASS: care guide ${C.services.length} services / 6 domains; rules, plan review, ${windows.length} application windows, home links, no storage`);
