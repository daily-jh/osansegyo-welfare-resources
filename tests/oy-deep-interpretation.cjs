'use strict';
/* Deep interpretation contract: CORE unchanged, unknown≠0, plain body without item numbers or scores, one notice. */
const assert=require('node:assert/strict');
const C=require('../docs/youth-risk/criteria.js');
const K=require('../docs/youth-risk/oy-item-knowledge-v1.js');
const X=require('../docs/youth-risk/oy-cross-patterns-v1.js');
const D=require('../docs/youth-risk/oy-deep-interpretation-v1.js');

assert.equal(K.ITEMS.length,25);
K.ITEMS.forEach((k,i)=>{assert.equal(k.n,i+1);assert.equal(k.a.length,5);assert.equal(k.r.length,4);for(const f of ['topic','d','q','t','e','c'])assert.ok(k[f],k.n+' '+f)});
assert.deepEqual(K.ITEMS.filter(k=>k.safety).map(k=>k.n),C.items.filter(i=>i.type==='safety').map(i=>i.number));
assert.deepEqual(K.AXES.flatMap(a=>a.items).sort((a,b)=>a-b),Array.from({length:25},(_,i)=>i+1));
assert.equal(new Set(X.PATTERNS.map(p=>p.id)).size,X.PATTERNS.length);
X.PATTERNS.forEach(p=>assert.ok(p.core.length>=2&&p.name.endsWith('패턴')&&p.loop&&p.q&&p.first,p.id));

const BODY_NUM=/\d+번|\d점/;
const HEDGE=/가설|확인 바랍|확인바랍|단정하지|확정하지|추정하지|검증 전|미검증/;
const FORBID=/우울증|ADHD|학대가 확인|학대로 확인|자살위험 (등급|높음)|안전합니다|문제가 없습니다|문제없음/;
const split=(t,mark)=>t.split(mark)[0];
function check(answers,label){
 const r=D.build({answers});
 assert.deepEqual(r.core,C.evaluate(answers,K.DOMAIN_SIZES,false,{}),label+' CORE changed');
 const text=D.text(r),html=D.html(r);
 for(const [body,name] of [[split(text,'[근거 자료'),'text'],[split(html,'<section class="odi-appendix"'),'html']]){
  const b=name==='html'?body.replace(/<[^>]+>/g,' '):body;
  assert.ok(!BODY_NUM.test(b.replace(/1교시/g,'')),label+' '+name+' body has item number/score: '+(b.match(BODY_NUM)||[])[0]);
  assert.ok(!HEDGE.test(b),label+' '+name+' hedge: '+(b.match(HEDGE)||[])[0]);
  assert.ok(!FORBID.test(b),label+' '+name+' forbidden: '+(b.match(FORBID)||[])[0]);
  assert.ok(!/은\(는\)|이\(가\)|undefined|NaN|null/.test(b),label+' '+name+' template residue');
 }
 assert.equal(text.split(D.NOTICE).length-1,1,label+' notice once (text)');
 assert.equal(html.split('해석 안내').length-1,1,label+' notice once (html)');
 // unknown is never read as zero
 r.profile.forEach(d=>{if(d.unknown.length)assert.ok(!d.clear&&/미상|보류/.test(d.label),label+' unknown domain read as clear')});
 r.strengths.forEach(s=>{const d=r.profile.find(p=>p.name===s.domain);if(d)assert.equal(d.unknown.length,0)});
 r.patterns.active.forEach(p=>p.items.forEach(n=>assert.notEqual(answers[n-1],'unknown',label+' active pattern on unknown')));
 return r;
}
// Virtual cases only (no real case data).
const V={
 '돌봄-학교이탈':[0,0,1,0,0,3,1,2,3,2,3,0,0,0,0,2,3,3,1,0,0,2,3,2,0],
 '전부 0':Array(25).fill(0),
 '전부 미상':Array(25).fill('unknown'),
 '전부 4':Array(25).fill(4),
 '또래피해-등교회피':[0,0,3,1,0,2,0,1,3,1,2,0,0,0,0,0,0,0,0,0,0,2,1,1,0],
 '온라인 성착취':[0,0,2,2,0,2,0,2,1,0,1,0,0,0,0,0,0,0,0,0,0,1,2,3,3],
 '기본생활 결핍':[0,1,0,0,0,1,0,0,2,1,1,0,0,0,0,3,1,0,3,2,3,1,1,0,0],
 '학습 접근성':[0,0,0,0,0,1,0,0,1,3,2,0,0,3,2,0,0,0,0,0,1,0,0,0,0],
 '위험행동 군집':[0,0,0,0,2,1,0,1,2,1,2,3,3,0,0,0,2,0,0,0,0,0,1,2,0],
 '안전 미상':['unknown',0,0,0,0,2,'unknown',0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0],
 '방임 대조':[0,3,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]
};
const seen={};
for(const [k,a] of Object.entries(V)){const r=check(a,k);seen[k]=r}
assert.equal(seen['돌봄-학교이탈'].code.name,'돌봄 부담–학교 이탈 패턴');
assert.ok(seen['돌봄-학교이탈'].critical.list.some(x=>x.n===7));
assert.equal(seen['전부 미상'].code.name,'정보 확인 전 프로파일');
assert.equal(seen['전부 4'].code.name,'전 영역 고른 상승 프로파일');
assert.ok(seen['전부 0'].validity.rows.some(r=>r.label==='어려움 보고 없음'));
assert.equal(seen['안전 미상'].validity.level,'보류');
assert.ok(seen['방임 대조'].validity.rows.some(r=>r.label==='문항 간 대조'));
assert.ok(seen['또래피해-등교회피'].patterns.active.some(p=>p.id==='peer-avoidance'));
// Integrated case management view
const cw=k=>seen[k].casework;
assert.equal(cw('돌봄-학교이탈').level.id,'intensive');
assert.equal(cw('돌봄-학교이탈').lead,'복지관 통합사례관리');
assert.equal(cw('온라인 성착취').level.id,'crisis');
assert.ok(/아동학대전담공무원/.test(cw('방임 대조').leadText)&&/아동학대 신고/.test(cw('방임 대조').immediate),'abuse: immediate report and statutory lead are named separately');
assert.ok(/먼저 연락하지 않고/.test(cw('방임 대조').family)&&/먼저 연락하지 않고/.test(cw('안전 미상').family));
assert.ok(cw('안전 미상').agenda.some(a=>a.includes('확인되지 않은 내용')));
assert.equal(cw('전부 0').level.id,'monitor');
for(const k of Object.keys(V)){const w=cw(k);assert.equal(w.plan.length,3);assert.ok(w.plan[0].rows.length>=1);assert.equal(w.ecology.length,4);assert.ok(w.notes.length>=1)}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<3000;i++)check(Array.from({length:25},()=>{const r=rnd();return r<0.06?'unknown':r<0.5?0:Math.floor(rnd()*5)}),'random#'+i);
console.log('oy-deep-interpretation: ok',Object.keys(V).length,'virtual cases + 3000 random');

// Safety timing and level follow the safety answers (2026-10-26 random-10 review).
{
 const one=set=>{const a=Array(25).fill(0);Object.entries(set).forEach(([k,v])=>a[k-1]=v);return a;};
 const s1=D.build({answers:one({7:1}),explicit:[],followups:{}});
 assert.equal(s1.core.urgent,true);
 assert.equal(s1.casework.level.id,'brief','a 1-point safety item never stays at monitor while CORE is urgent');
 assert.ok(/^오늘 안에/.test(s1.summary.first),'positive safety item: today');
 const ex=D.build({answers:one({6:4,7:1}),explicit:['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨'],followups:{}});
 assert.ok(/^지금 바로/.test(ex.summary.first),'explicit urgent check: right now');
 assert.equal(ex.critical.list[0].kind,'긴급');assert.ok(ex.critical.list[0].reading.includes('구체적인 실행 계획'));
 assert.equal(ex.casework.plan[0].phase,'즉시 (지금 바로)');
 const pend=D.build({answers:one({5:3,12:3,13:4}),explicit:[],followups:{5:'no',12:'unknown',13:'unknown'}});
 assert.equal(pend.casework.level.id,'intensive','unconfirmed current-risk follow-up runs provisionally intensive');
 assert.ok(/^오늘 안에/.test(pend.summary.first));
 const sh=D.build({answers:one({6:3,7:2}),explicit:[],followups:{}});
 assert.ok(sh.casework.goals.every(g=>!/수준으로 낮아지는 것/.test(g.goal)||g.topic!=='자해·죽음 관련 안전 신호'),'safety items get a safety-plan goal');
}
console.log('safety timing/level: ok');
