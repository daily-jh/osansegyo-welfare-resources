'use strict';
/* Fully synthetic data only. Practitioner readout must explain, never change, CORE and five-level results. */
const assert=require('node:assert/strict');
const Index=require('../docs/youth-risk/integrated-index-v1.js');
const R=require('../docs/youth-risk/result-readout-v1.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
const payload=(set={},caseContext='',explicit=[],followups={})=>{const answers=Array(25).fill(0);for(const [k,v] of Object.entries(set))answers[k-1]=v;
 return {answers,domains:sizes.map((n,i)=>({name:'시험 영역 '+i,items:Array(n).fill('합성 문항')})),routes:sizes.map(()=>[]),resources:[],explicit,followups,caseContext,student:{gender:'미확인',dong:''}};};
const run=p=>{const before=JSON.stringify(p),x=Index.analyze(p),tier=x.tier,r=R.analyze(x,p),h=R.html(x,p,{});
 assert.equal(JSON.stringify(p),before,'readout must not mutate payload');assert.equal(x.tier,tier,'readout must not change tier');return {x,r,h};};

// High self-harm item: the decisive reason is the safety floor, not the pattern floor.
let t=run(payload({7:3,6:3}));
assert.equal(t.x.tier,5);
assert.ok(R.decisiveText(t.x).includes(t.x.safetyReason));
assert.ok(!R.decisiveText(t.x).includes(t.x.patternReason),'pattern floor must not be shown as the reason for a safety-driven tier');
assert.ok(t.r.checks[0].urgent&&/오늘 바로/.test(t.r.checks[0].text));

// Only a 1-point safety answer: tier 2 comes from the safety rule.
t=run(payload({7:1}));
assert.equal(t.x.tier,2);assert.equal(t.r.drivers.find(d=>d.decisive).kind,'safety');

// Unknown items: no tier, honest lower bound shown as reference only.
t=run(payload({6:3,17:3,16:2,9:'unknown',10:'unknown'}));
if(t.x.provisional){assert.equal(t.x.tier,3,'optional decision patch: provisional tier equals confirmed lower bound');assert.ok(/잠정 단계/.test(t.h));}
else {assert.equal(t.x.tier,null);assert.equal(R.provisionalFloor(t.x),3);assert.ok(/공식 단계가 아닙니다/.test(t.h));}
assert.ok(t.r.checks.some(c=>/미상 9번·10번/.test(c.text)));

// Unknown safety item is listed as the first thing to check.
t=run(payload({1:'unknown'}));
assert.ok(t.r.checks.some(c=>c.urgent&&/^1번\(안전문항\)이 미상/.test(c.text)));

// Pending follow-up safety check is surfaced even though the five-level tier is set.
t=run(payload({4:2,3:2},'',[],{4:'unknown'}));
assert.ok(t.x.tier>=2);assert.ok(/안전확인 미완료/.test(t.h));
assert.ok(t.r.checks.some(c=>/4번 현재 안전 추가확인/.test(c.text)));

// Hiding a sign is not a denial: the concealed self-harm cue is promoted (2026-10-26 decision).
t=run(payload({6:2},'담임 관찰: 손목에 자해 흔적이 있는데 학생이 숨기고 말하지 않음.'));
assert.ok(!t.r.cues.held.some(c=>c.tag==='selfharm'&&/부정 표현/.test(c.why)));
assert.ok(t.x.tier>=4,'concealed self-harm keeps the narrative safety floor');
// Negated wording is still held, not promoted.
t=run(payload({6:2},'담임 관찰: 학생은 자해 생각은 없다고 함.'));
assert.ok(t.r.cues.held.some(c=>c.tag==='selfharm'));
assert.ok(t.r.checks.some(c=>/자동 판정에는 반영하지 않았습니다/.test(c.text)));
const third=payload({},'학생이 친구가 자해한다고 걱정하며 이야기함.');
assert.ok(/다른 사람/.test(R.mismatchText({tag:'selfharm',items:[7],issue:'자유서술과 해당 문항의 0점이 일치하는지 확인하십시오.'},third)));

// Current narrative safety cue: objective tab tells the reader the integrated tab differs.
const cur=payload({6:1},'어제 상담에서 학생이 요즘 죽고 싶다는 생각이 자주 든다고 말했다.');
const full=Index.analyze(cur),objective=Index.analyze({...cur,caseContext:''});
assert.ok(full.tier>objective.tier);
assert.ok(/③ 통합 사정의견/.test(R.html(objective,cur,{objective:true,fullTier:full.tier})));
assert.equal(R.narrativeLabel(objective,cur,true),'①에서 제외 · ③에서 확인');
assert.equal(R.narrativeLabel(Index.analyze(payload()),payload(),true),'미입력');

// Escaping: narrative-derived text never injects markup.
assert.ok(!/<img/.test(R.html(Index.analyze(payload({},'<img src=x onerror=alert(1)> 자해')),payload({},'<img src=x onerror=alert(1)> 자해'),{})));
// Domain note never shows unknowns as zero.
assert.match(R.domainNote({raw:0,max:4,unknown:2},3),/미상 2개는 계산에서 제외\(0점 아님\)/);
assert.match(R.domainNote({raw:0,max:0,unknown:2},0),/확인자료 없음/);
console.log('youth result readout: ok');
