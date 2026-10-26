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

console.log('youth-eval100-regression: '+run+' checks passed');
