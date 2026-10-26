'use strict';
/* Narrative + integrated interpretation contract. Virtual cases only (no real case data). */
const assert=require('node:assert/strict');
const C=require('../docs/youth-risk/criteria.js');
const K=require('../docs/youth-risk/oy-item-knowledge-v1.js');
const N=require('../docs/youth-risk/oy-narrative-interpretation-v1.js');

const BODY_NUM=/\d+번|\d점/;
const HEDGE=/가설|확인 바랍|확인바랍|단정하지|확정하지|추정하지|검증 전|미검증/;
const FORBID=/우울증|ADHD|학대가 확인|학대로 확인|자살위험 (등급|높음)|안전합니다|문제가 없습니다|문제없음/;
const strip=h=>h.replace(/<[^>]+>/g,' ');
function body(text,mark){return text.split(mark)[0]}
function checkBody(b,label){
 const noQuotes=b.replace(/“[^”]*”/g,'');
 assert.ok(!BODY_NUM.test(noQuotes),label+' item number/score in body: '+(noQuotes.match(BODY_NUM)||[])[0]);
 assert.ok(!HEDGE.test(noQuotes),label+' hedge: '+(noQuotes.match(HEDGE)||[])[0]);
 assert.ok(!FORBID.test(noQuotes),label+' forbidden: '+(noQuotes.match(FORBID)||[])[0]);
 assert.ok(!/은\(는\)|이\(가\)|undefined|NaN|null|\[object/.test(b),label+' template residue');
}
function run(answers,caseContext,label){
 const p={answers,caseContext};
 const nv=N.narrative(p),I=N.integrate(p);
 assert.deepEqual(I.deep.core,C.evaluate(answers,K.DOMAIN_SIZES,false,{}),label+' CORE changed');
 const nh=N.narrativeHtml(nv),nt=N.narrativeText(nv),ih=N.integratedHtml(I),it=N.integratedText(I);
 checkBody(strip(body(nh,'<section class="odi-appendix"')),label+' narrative html');
 checkBody(body(nt,'[근거 자료'),label+' narrative text');
 checkBody(strip(body(ih,'<section class="odi-appendix"')),label+' integrated html');
 checkBody(body(it,'[근거 자료'),label+' integrated text');
 for(const pg of ['사례사정','서비스계획','사례협의']){checkBody(strip(N.caseHtml(I,pg)),label+' case '+pg);checkBody(N.caseText(I,pg),label+' caseText '+pg)}
 if(nv.present){assert.equal(nt.split(N.NOTICE).length-1,1,label+' notice once');assert.equal(nh.split('해석 안내').length-1,1,label+' notice once html')}
 assert.equal(it.split(N.NOTICE).length-1,1,label+' integrated notice once');
 assert.equal(ih.split('해석 안내').length-1,1,label+' integrated notice once html');
 return {nv,I};
}
const STORY='학생은 최근 한 달 동안 주 2~3회 지각했고, 아침에 할머니 약을 챙기고 동생을 등원시킨 뒤 등교한다고 말했다.\n\n담임에 따르면 수업 중 자주 엎드려 있고 친구들과 거의 어울리지 않는다. 학생은 "그냥 사라지고 싶을 때가 있다"고 말한 적이 있다.\n\n아버지와 어머니는 별거 중이며 어머니는 야간 근무를 한다. 친구 갈등은 없다고 한다. 학생은 그림 그리기를 좋아하고 미술 동아리에 들어가고 싶다고 했다.';
const low=[0,0,0,0,0,2,0,1,3,1,1,0,0,0,0,'unknown',1,1,0,0,0,1,1,0,0];
const a=run(low,STORY,'돌봄 서술');
const st=n=>(a.nv.read.items[n]||[]).map(f=>f.status);
for(const n of [6,7,9,16,17,18,22])assert.ok(st(n).includes('보고'),'cue missed for item '+n);
assert.deepEqual(st(3),['부인'],'peer conflict denial must be read as denial');
assert.ok(a.nv.read.safety.some(f=>f.n===7),'"사라지고 싶다" must be a safety cue');
assert.equal(a.nv.read.sentences.find(s=>/사라지고/.test(s.text)).source,'학생 진술');
assert.equal(a.nv.read.sentences.find(s=>/담임에 따르면/.test(s.text)).source,'교사 관찰');
assert.ok(a.nv.compare.narrative.some(x=>x.n===7)&&a.nv.compare.fill.some(x=>x.n===16)&&a.nv.compare.agree.some(x=>x.n===9));
assert.equal(a.I.level.id,'intensive','narrative safety cue raises the practice level');
assert.ok(a.I.adjust&&/위기개입으로 전환/.test(a.I.adjust));
assert.ok(/안전 면담/.test(a.I.plan[0].rows[0].what),'safety interview first');
assert.ok(a.I.newPatterns.some(p=>p.id),'narrative reveals an additional pattern');
assert.ok(a.I.goals.some(g=>g.baseline),'goal baseline from narrative');
assert.ok(a.I.strengths.some(s=>s.label==='서술에 기록된 강점'));
assert.ok(!/가장 먼저 할 일:/.test(a.I.understanding),'scale first-step replaced by safety first');
// Denied self-harm is not a safety cue; hypothetical carer harm is.
const b=run(Array(25).fill(0),'학생은 자해 생각은 없다고 말했다. 아버지에게 맞은 것 같다는 이야기를 들었다.','부인·추정');
assert.deepEqual(b.nv.read.items[7].map(f=>f.status),['부인']);
assert.ok(!b.nv.read.safety.some(f=>f.n===7));
assert.ok(b.nv.read.safety.some(f=>f.n===1&&f.status==='추정'));
assert.ok(/먼저 연락하지 않고/.test(b.I.family),'carer-harm cue changes family engagement');
// Scale high, narrative denies → conflict row.
const hi=Array(25).fill(0);hi[2]=3;
const c=run(hi,'친구 괴롭힘은 없다고 담임이 말했다.','엇갈림');
assert.ok(c.nv.compare.conflict.some(x=>x.n===3));
assert.ok(c.I.agenda.some(x=>x.includes('엇갈리는')));
// No narrative: integrated report still works from the scale only and carries no quotes.
const d=run(low,'','서술 없음');
assert.equal(d.nv.present,false);assert.equal(d.I.present,false);
assert.ok(!/“/.test(N.integratedText(d.I).split('[근거 자료')[0].replace(/"[^"]*"/g,'')),'no quotes without narrative');
for(const phrase of ['할머니','사라지고','별거'])assert.ok(!N.integratedText(d.I).includes(phrase),'narrative leaked: '+phrase);
assert.deepEqual(d.I.deep.core,a.I.deep.core,'narrative never changes CORE');
// Random answers × virtual narratives.
const STORIES=[STORY,'','학생은 요즘 잠을 못 잔다고 했다. 게임을 새벽까지 한다.','보호자에 따르면 월세가 밀려 이사를 자주 했다. 학생은 성실하고 친구를 잘 도와준다.','온라인에서 모르는 사람이 사진을 보내 달라고 했다고 학생이 말했다.'];
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<600;i++)run(Array.from({length:25},()=>{const r=rnd();return r<0.06?'unknown':r<0.5?0:Math.floor(rnd()*5)}),STORIES[i%STORIES.length],'random#'+i);
console.log('oy-narrative-interpretation: ok');
