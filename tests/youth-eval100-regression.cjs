'use strict';
/* Findings from the synthetic 100-case evaluation (2026-10-27): narrative-only cues must reach the five-level
   index the same way in both narrative parsers, and the written outputs must not carry particle errors,
   internal plan codes or one caveat repeated per domain. All sentences here are invented. */
const assert=require('assert');
const N=require('../docs/youth-risk/case-context-core.js');
const NI=require('../docs/youth-risk/oy-narrative-interpretation-v1.js');
const D=require('../docs/youth-risk/oy-deep-interpretation-v1.js');
const zero=Array(25).fill(0);
const core=t=>N.reconcile(zero,t).signals.filter(Boolean).filter(x=>x.safety&&['reported','unverified'].includes(x.polarity)&&x.subject!=='third-party');
const ni=t=>NI.safetySummary({answers:zero,caseContext:t});
let run=0;const check=(name,fn)=>{fn();run++;};

check('a student telling that a parent hit them is a current protection cue in both parsers',()=>{
 for(const t of ['팔에 멍이 있어 물어보니 엄마가 옷걸이로 때렸다고 함.','어제 집에서 아빠가 목을 졸랐다고 말함.','아버지가 술을 마시면 때린다고 말함.']){
  assert.ok(core(t).some(x=>x.tag==='protection'||x.id==='protection'),'case-context-core missed: '+t);
  assert.ok(ni(t).safety.some(x=>x.n===1),'narrative interpretation missed: '+t);
 }
 assert.strictEqual(core('친구가 때렸다고 함.').filter(x=>x.tag==='protection').length,0,'a peer hitting is not a carer cue');
});

check('"죽고 싶지는 않고" is a denial in both parsers, "살고 싶지 않다" is not',()=>{
 for(const t of ['죽고 싶지는 않고 그냥 피곤하다고 함.','죽고 싶지 않다고 함.']){
  assert.strictEqual(core(t).length,0,'case-context-core flagged a denial: '+t);
  assert.strictEqual(ni(t).stage,false,'narrative summary flagged a denial: '+t);
 }
 assert.ok(core('살고 싶지 않다고 함.').length>0,'not wanting to live was read as a denial');
 assert.ok(ni('살고 싶지 않다고 함.').stage);
});

check('indirect self-harm cues are picked up',()=>{
 for(const t of ['SNS에 "이제 그만하고 싶다"는 글과 약 봉투 사진을 올렸다고 친구가 알려 옴.','약을 모아 두었다고 말함.','사라지고 싶다고 함.'])
  assert.ok(core(t).length>0&&ni(t).stage,'missed: '+t);
 assert.strictEqual(core('공부를 그만하고 싶지 않다고 함.').length,0);
});

check('"…다고 함" with no other speaker is the student speaking',()=>{
 const r=NI.read({answers:zero,caseContext:'최근 잠을 거의 못 잔다고 함. 보호자는 상담 일정을 잡기 어렵다고 함. 친구가 요즘 많이 운다고 말했다고 함.'});
 assert.deepStrictEqual(r.sentences.map(s=>s.source),['학생 진술','보호자 진술','전해 들은 내용']);
});

check('a narrative-only abuse cue lifts the five-level index to the protection path',()=>{
 const FIVE=require('../docs/youth-risk/integrated-index-v1.js');
 const fs=require('fs'),path=require('path');
 const app=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/app.js'),'utf8');
 const grab=n=>{const s=app.indexOf('var '+n+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break;}}return JSON.parse(app.slice(i,j+1));};
 const domains=grab('domains');
 const p={answers:zero.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes:grab('routes'),resources:[],explicit:[],followups:{},caseContext:'팔에 멍이 있어 물어보니 엄마가 옷걸이로 때렸다고 함.'};
 assert.ok(FIVE.analyze(p).tier>=4,'narrative abuse statement left the index below the protection path');
});

check('lead agency sentences use the right particle and no internal plan codes reach the text',()=>{
 const a=zero.slice();a[6]=3;a[5]=3;
 const r=D.build({answers:a});
 assert.ok(!/센터이 |기관가 |112이 /.test(r.casework.leadText),r.casework.leadText);
 const I=NI.integrate?NI.integrate({answers:zero.slice(),caseContext:'팔에 멍이 있어 물어보니 엄마가 옷걸이로 때렸다고 함.'}):null;
 if(I){
  assert.ok(!/센터이 |기관가 |112이 /.test(I.leadText||''),I.leadText);
  assert.ok(/신고와 보호 조치/.test(I.adjust||''),'abuse escalation should talk about reporting, not a suicide plan: '+I.adjust);
 }
});

check('everyday strengths in a record are recognised',()=>{
 for(const t of ['요리를 좋아해 나중에 조리사가 되고 싶다고 함.','축구부 친구들과는 잘 지낸다고 함.','동생을 아끼고 잘 챙긴다고 스스로 이야기함.','음악을 들으면 마음이 편해진다고 함.']){
  assert.ok(N.reconcile(zero,t).fields.strengths,'case-context-core missed a strength: '+t);
 }
});

// Second round (practitioner and advisory review, 2026-10-27).
const FIVE=require('../docs/youth-risk/integrated-index-v1.js');
const fs=require('fs'),path=require('path');
const app=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/app.js'),'utf8');
const grab=n=>{const s=app.indexOf('var '+n+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break;}}return JSON.parse(app.slice(i,j+1));};
const DOM=grab('domains'),ROUTES=grab('routes');
const five=(answers,text,followups)=>FIVE.analyze({answers,domains:DOM.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes:ROUTES,resources:[],explicit:[],followups:followups||{},caseContext:text||''});

check('a carer injury or strangulation in the record, or a self-harm means or plan, is same-day work',()=>{
 for(const t of ['팔에 멍이 있어 물어보니 엄마가 옷걸이로 때렸다고 함.','어제 집에서 아빠가 목을 졸랐다고 말함.','약을 모아 두었다고 말함.']){
  const x=five(zero.slice(),t);assert.strictEqual(x.tier,5,t+' → '+x.tier);
  assert.strictEqual(NI.integrate({answers:zero.slice(),caseContext:t}).level.id,'crisis',t);
 }
 for(const t of ['아버지가 술을 마시면 때린다고 말함.','사라지고 싶다고 함.','작년에 아빠가 때려서 멍이 들었다고 함.']){
  const x=five(zero.slice(),t);assert.ok(x.tier<5,t+' should stay below 5, got '+x.tier);
 }
 // The withheld-narrative export keeps the same decision without carrying the wording.
 const red=NI.safetySummary({answers:zero,caseContext:'어제 아빠가 목을 졸랐다고 말함.'});
 assert.ok(red.immediate.length&&!JSON.stringify(red).includes('졸랐'));
 assert.strictEqual(FIVE.analyze({answers:zero.slice(),domains:DOM.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes:ROUTES,resources:[],explicit:[],followups:{},caseContext:'',narrativeRedacted:red}).tier,5);
});

check('two or more physical-neglect signs together become a protection question; one alone does not',()=>{
 const many='겨울인데 얇은 옷을 입고 등교함. 보호자는 야간 근무로 집에 거의 없다고 함. 동생과 둘이 라면으로 끼니를 해결한다고 함.';
 assert.ok(N.reconcile(zero,many).signals.some(x=>x.tag==='neglectPattern'));
 assert.ok(five(zero.slice(),many).tier>=4);
 assert.ok(ni(many).safety.some(x=>x.n===2));
 for(const one of ['같은 옷을 일주일째 입고 옴.','아침은 잘 먹고 온다고 함. 같은 옷을 입음.'])
  assert.ok(!N.reconcile(zero,one).signals.some(x=>x.tag==='neglectPattern'),one);
});

check('a level held only by an unanswered follow-up says "잠정" in its name',()=>{
 const a=zero.slice();a[3]=1;
 const x=five(a,'',{});assert.strictEqual(x.tier,4);assert.ok(x.provisional&&/잠정/.test(x.label),x.label);
 assert.ok(!/잠정/.test(five(a,'',{4:'no'}).label));
});

check('level four is not named as a crisis when no safety signal raised it',()=>{
 assert.ok(!FIVE.NAMES.some(n=>/고위기/.test(n)));
 assert.strictEqual(FIVE.NAMES[3],'다기관 집중개입');
});

check('the integrated page explains the three level names once',()=>{
 const t=NI.integratedText(NI.integrate({answers:zero.slice(),caseContext:''}));
 assert.strictEqual((t.match(/단계 이름이 셋인 이유/g)||[]).length,1);
});

check('the shared case formulation states its caveats once, not per domain',()=>{
 const CI=require('../docs/youth-risk/case-interpretation-core.js');
 const domains=[0,1,2,3,4,5,6,7,8,9].map(i=>({i,name:'영역'+i,numbers:[i*2+1,i*2+2].filter(n=>n<=25),sum:2}));
 const sections=['현재 안전과 즉시 필요한 확인','가족·돌봄·생활환경','학습·출결·교우·정서·건강','상황을 함께 이해하기 · 잠정 해석과 지도 방향','근거·미확인·확인 계획'].map(title=>({title,text:''}));
 const a=zero.slice();for(let i=0;i<25;i+=2)a[i]=2;
 const out=CI.enrich({answers:a},{domains,plans:[],sections,cieActions:[]});
 const all=out.sections.map(x=>x.text).join('\n');
 assert.strictEqual((all.match(/독립적으로 증명하지 않습니다/g)||[]).length,1);
 assert.strictEqual((all.match(/가족형태로 단정하지 않습니다/g)||[]).length,1);
});

check('digital over-use and drug use reach their specialist services in the directory',()=>{
 const M=require('../docs/youth-risk/support-model.js');
 const row=(name,service)=>({'기관명':name,'서비스명':service,directorySource:true,'지원대상':'청소년'});
 const a=zero.slice();a[23]=3;a[12]=3;
 const d9={i:9,numbers:[24,25],sum:3},d4={i:4,numbers:[12,13],sum:3};
 assert.ok(M.additional({answers:a},d9,row('스마트쉼센터','스마트폰 과의존 상담·찾아가는 상담')));
 assert.ok(M.additional({answers:a},d4,row('한국마약퇴치운동본부 마약상담 1342','마약류 24시간 익명 상담')));
 const b=zero.slice();b[23]=1;
 assert.strictEqual(M.additional({answers:b},d9,row('스마트쉼센터','스마트폰 과의존 상담·찾아가는 상담')),null);
});

console.log('youth-eval100-regression: '+run+' checks passed');
