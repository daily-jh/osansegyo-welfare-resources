// 세교 사례관리 시스템 시연판 검사 (2026-11-26)
// T04~T06 위기도 16문항, T08 상태 전이, T12 상담·제공 분리 집계, T13 미관리 30일, T24 공개 배포 금지 검사.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const D = require('../docs/case-management/cm-domain.js');

let n = 0;
const t = (name, fn) => { fn(); n++; };
const arr = (fill) => Array(16).fill(fill);

// T04 경계값
t('boundaries', () => {
  const at = (sum) => { const a = arr(0); let s = sum; for (let i = 0; i < 16 && s > 0; i++) { const v = Math.min(2, s); a[i] = v; s -= v; } return a; };
  // 핵심문항이 아닌 자리부터 채우면 핵심 판정과 분리해 경계를 본다
  const nonCoreFirst = (sum) => { const order = [2, 4, 7, 8, 10, 13, 14, 1, 3, 5, 6, 9, 11, 12, 15, 16]; const a = arr(0); let s = sum; for (const q of order) { if (s <= 0) break; const v = Math.min(2, s); a[q - 1] = v; s -= v; } return a; };
  [[0, 'low'], [10, 'low'], [11, 'medium'], [20, 'medium'], [21, 'high'], [32, 'high']].forEach(([s, lv]) => {
    const r = D.evaluateRisk16(nonCoreFirst(s));
    assert.strictEqual(r.confirmedTotal, s); assert.strictEqual(r.level, lv);
    assert.strictEqual(D.evaluateRisk16(at(s)).confirmedTotal, s);
  });
  assert.throws(() => D.evaluateRisk16(Array(15).fill(0)), /invalid_scale/);
  assert.throws(() => D.evaluateRisk16([...arr(0).slice(0, 15), 3]), /invalid_scale/);
  assert.throws(() => D.evaluateRisk16([...arr(0).slice(0, 15), undefined]), /invalid_scale/);
  assert.throws(() => D.evaluateRisk16([...arr(0).slice(0, 15), '1']), /invalid_scale/);
});

// T05 미확인은 0점이 아니다
t('unknown', () => {
  const r = D.evaluateRisk16(arr(null));
  assert.deepStrictEqual([r.min, r.max, r.confirmedTotal, r.level, r.allUnknown], [0, 32, null, 'pending', true]);
  const zero = D.evaluateRisk16(arr(0));
  assert.strictEqual(zero.confirmedTotal, 0); assert.strictEqual(zero.allUnknown, false);
  const part = arr(1); part[1] = null; part[3] = null;
  const p = D.evaluateRisk16(part);
  assert.deepStrictEqual([p.min, p.max, p.unknown, p.confirmedTotal], [14, 18, 2, null]);
});

// T06 핵심문항
t('core', () => {
  const one = arr(0); one[5] = 2; // 6번(핵심)
  let r = D.evaluateRisk16(one);
  assert.ok(r.urgentReview && !r.immediateAction); assert.strictEqual(r.level, 'low');
  const four = arr(0); [1, 3, 5, 6].forEach(q => { four[q - 1] = 2; });
  r = D.evaluateRisk16(four); assert.ok(r.immediateAction); assert.strictEqual(r.keySevere, 4);
  const nonCore = arr(0); [2, 4, 7, 8].forEach(q => { nonCore[q - 1] = 2; });
  r = D.evaluateRisk16(nonCore); assert.ok(!r.urgentReview); assert.strictEqual(r.confirmedTotal, 8);
  const ku = arr(0); ku[0] = null;
  r = D.evaluateRisk16(ku); assert.strictEqual(r.keyUnknown, 1); assert.ok(!r.urgentReview);
  assert.deepStrictEqual(D.CORE, [1, 3, 5, 6, 9, 11, 12, 15, 16]);
});

// T08 상태 전이
t('states', () => {
  assert.ok(D.canTransition('simple_active', 'assessment_pending'));
  assert.ok(D.canTransition('decision_pending', 'deferred'));
  assert.ok(!D.canTransition('received', 'closed'));
  assert.ok(!D.canTransition('closed', 'active'));
  assert.ok(D.canTransition('closed', 'followup_active'));
  Object.values(D.TRANSITIONS).flat().forEach(s => assert.ok(D.STATES[s], s));
});

// 시연 자료 불러오기
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/case-management/cm-data.js'), 'utf8'), { window: win });
const C = win.CM;

// T12 같은 방문의 상담·물품 전달은 각각 한 번
t('metrics', () => {
  const m = D.metrics(C, { month: '2026-11' });
  const nov = C.contacts.filter(c => c.date.startsWith('2026-11'));
  assert.strictEqual(m.contactsCompleted, nov.filter(c => c.result === 'completed').length);
  assert.strictEqual(m.contactsNotCompleted, nov.filter(c => c.result !== 'completed').length);
  assert.strictEqual(m.servicesProvided, 1); // V-02만(V-04는 예정)
  const all = D.metrics(C, {});
  assert.strictEqual(all.contactsCompleted, new Set(C.contacts.filter(c => c.result === 'completed').map(c => c.id)).size);
  const s2 = D.metrics(C, { month: '2026-11', staff: 'S2' });
  assert.ok(s2.contactsCompleted >= 1 && s2.servicesProvided === 0);
});

// T13 미관리 30일(제안 기준)
t('unmanaged', () => {
  const mk = (received) => ({ id: 'X', state: 'simple_active', received });
  assert.strictEqual(D.unmanaged(mk('2026-10-28'), [], '2026-11-26').flag, false); // 29일
  assert.strictEqual(D.unmanaged(mk('2026-10-27'), [], '2026-11-26').flag, true); // 30일
  assert.strictEqual(D.unmanaged(mk('2026-10-26'), [], '2026-11-26').days, 31);
  assert.strictEqual(D.unmanaged({ id: 'X', state: 'closed', received: '2026-01-01' }, [], '2026-11-26').flag, false);
  const cs = [{ caseId: 'X', date: '2026-11-20', result: 'failed' }, { caseId: 'X', date: '2026-11-01', result: 'completed' }];
  const u = D.unmanaged(mk('2026-09-01'), cs, '2026-11-26');
  assert.strictEqual(u.base, '2026-11-01'); assert.strictEqual(u.flag, false); // 연락 실패는 관리로 치지 않음
  assert.strictEqual(D.unmanaged(C.cases.find(c => c.id === 'DEMO-0001'), C.contacts, C.asOf).flag, true);
});

// 시연판 입력 보호
t('looksReal', () => {
  ['010-1234-5678', '900101-1234567', '031-123-4567', '123-456-789012', '세교로 12', 'a@b.kr'].forEach(s => assert.ok(D.looksReal(s), s));
  ['가상 H', '겨울 난방비가 걱정된다고 말함(가상)', ''].forEach(s => assert.strictEqual(D.looksReal(s), null, s));
});

// 합성 자료 무결성
t('data', () => {
  const ids = new Set(C.cases.map(c => c.id));
  C.cases.forEach(c => { assert.ok(/^DEMO-\d{4}$/.test(c.id)); assert.ok(D.STATES[c.state], c.state); if (c.risk) D.evaluateRisk16(c.risk); });
  [...C.contacts, ...C.services, ...C.referrals, ...C.programs].forEach(x => assert.ok(ids.has(x.caseId), x.id));
  C.meetings.forEach(m => m.agendas.forEach(a => { assert.ok(ids.has(a.caseId)); if (m.status === '예정') assert.strictEqual(a.decision, null); }));
});

// T24 공개 배포 금지 검사: 시연판 폴더에 내부 링크·비밀값·실제 개인정보 형식이 없어야 한다
t('public-privacy', () => {
  const dir = path.join(__dirname, '../docs/case-management');
  const banned = [
    [/docs\.google\.com|spreadsheets\/d\//, '구글 시트 링크'], [/notion\.so|notion\.site/, '노션 링크'],
    [/e-ncom\.co\.kr/, '그룹웨어 주소'], [/sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|ghp_[A-Za-z0-9]{20,}/, '비밀값'],
    [/\b\d{6}-[1-8]\d{6}\b/, '주민번호 형식'], [/\b01[016789]-\d{3,4}-\d{4}\b/, '휴대전화 번호'],
    [/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon/, '저장·전송 코드']
  ];
  fs.readdirSync(dir).forEach(f => {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    banned.forEach(([re, why]) => {
      const hits = s.split('\n').filter(l => re.test(l) && !/REAL_PATTERNS|re:|banned/.test(l));
      assert.strictEqual(hits.length, 0, `${f}: ${why}\n${hits.join('\n')}`);
    });
  });
});

console.log(`case-management: ${n} checks passed`);
