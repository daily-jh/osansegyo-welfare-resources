'use strict';
/* Findings from the clinical-style synthetic 13-case review (2026-10-28): every narrative safety cue must reach
   ② narrative analysis the same way ③ finds it, a 0 score is never written as a strength when a safety signal is present,
   the first action and the decision chain agree on timing, and grade-specific wording fits the school level.
   All cases and sentences here are invented; no real case material is used. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../docs/youth-risk');
const C=require(path.join(dir,'case-context-core.js'));
const NI=require(path.join(dir,'oy-narrative-interpretation-v1.js'));
const D=require(path.join(dir,'oy-deep-interpretation-v1.js'));
const FIVE=require(path.join(dir,'integrated-index-v1.js'));
const DEC=require(path.join(dir,'oy-decision-v1.js'));
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const grab=n=>{const s=app.indexOf('var '+n+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break;}}return JSON.parse(app.slice(i,j+1));};
const domains=grab('domains'),routes=grab('routes');
const at=(m)=>{const a=Array(25).fill(0);for(const k in m)a[k-1]=m[k];return a;};
const payload=(o)=>({answers:o.answers,domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],explicit:[],followups:o.followups||{},caseContext:o.text||'',student:{gender:'미확인',dong:'',grade:o.grade||''}});
const rd=(o)=>NI.read(payload(o));const safe=(o)=>rd(o).safety;
let run=0;const check=(name,fn)=>{fn();run++;};

const CUT={grade:'중2',answers:at({6:3,7:4,8:2,12:2,13:1,17:3,23:2}),
 text:'보건교사가 체육 시간 뒤 왼쪽 손목에 아물지 않은 칼자국 여러 개를 확인함. 필통에 커터칼을 넣고 다님. 학생은 "화나면 그어야 진정돼요. 죽으려는 건 아니에요"라고 말함. 어젯밤 아버지와 크게 다툰 뒤에도 그었다고 함. 보호자와는 아직 연락이 닿지 않음.'};
const ABUSE={grade:'중2',answers:at({1:3,6:2,9:2,12:1,17:3,23:1}),
 text:'담임이 얼굴과 팔뚝의 멍을 발견함. 학생은 "아빠가 술 마시면 벨트로 때려요"라고 말하고 집에 가기 싫다고 함. 어머니는 집을 나가 연락이 되지 않는다고 함.'};
const PASSIVE={grade:'중1',answers:at({3:3,6:3,7:2,9:1,11:3,22:2,23:1,24:2}),
 text:'반 단체대화방에서 외모를 비하하는 말과 합성 사진이 돌았다고 함. 최근 2주 동안 잠을 잘 못 자고 급식을 거의 먹지 않음. 학생은 "그냥 사라지면 편할 것 같다"고 말했으나 구체적인 방법이나 계획은 없다고 함.'};
const SEXT={grade:'고1',answers:at({4:3,9:3,12:2,13:2,16:2,17:3,20:3,25:3}),followups:{4:'yes'},
 text:'최근 한 달 동안 세 번 집을 나갔고 SNS에서 만난 20대 남성의 집에서 지냈다고 함. 그 남성이 "용돈 줄 테니 사진을 보내라"고 했고, 거절하자 예전 사진을 퍼뜨리겠다고 협박하는 메시지를 받음.'};
const MIXED={grade:'중1',answers:['unknown',0,'unknown',0,0,0,0,0,0,3,3,0,0,0,3,'unknown','unknown',0,2,0,2,2,0,0,0],
 text:'어머니는 한국어 소통이 어려워 가정통신문을 이해하지 못함. 아버지가 최근 실직함. 급식 외 끼니가 불규칙하다고 함. 반에서는 혼자 지내는 시간이 많음. 축구부 친구들과는 잘 지낸다고 함.'};
const REFUSAL={grade:'초6',answers:at({6:3,8:2,9:3,10:1,11:2,17:1,22:2,23:1}),
 text:'이번 달에만 6일 결석함. 어머니와 떨어지는 것을 힘들어하고 교문 앞에서 울기도 함. 죽고 싶다는 말은 한 적이 없고 자해 흔적도 확인되지 않음.'};

check('fresh cuts, a carried blade and last night\'s cutting are current self-harm in ② and the 5-level index',()=>{
 const s=safe(CUT);assert.ok(s.some(x=>x.n===7),'② missed self-harm');
 assert.ok(!s.some(x=>x.status==='과거'),'a cut made last night is not past');
 assert.equal(FIVE.analyze(payload(CUT)).tier,5,'current injury goes to 5단계');
});

check('a quoted sentence with its own full stop stays one sentence and keeps the student as speaker',()=>{
 const r=rd(CUT);const q=r.sentences.find(x=>/그어야 진정/.test(x.text));
 assert.ok(q&&/죽으려는 건 아니에요/.test(q.text),'quote split at its inner full stop');
 assert.equal(q.source,'학생 진술');
});

check('a belt beating told by the student is a protection cue in ② as well as ③',()=>{
 assert.ok(safe(ABUSE).some(x=>x.n===1),'② missed the carer hitting with a belt');
 assert.ok(!rd(ABUSE).sentences.some(x=>/어머니는 집을 나가/.test(x.text)&&x.links.some(l=>l.n===20)),'a carer leaving home is not the student running away');
});

check('passive death wishes are a self-harm cue, and a stated lack of plan is not read as denial of the wish',()=>{
 assert.ok(safe(PASSIVE).some(x=>x.n===7));
 const r=rd(PASSIVE);assert.ok(!r.sentences.some(x=>/잠을 잘 못 자고/.test(x.text)&&x.links.some(l=>l.status==='부인')),'"못 자고" is not a denial');
 assert.equal(NI.read({answers:at({}),caseContext:'학생은 자해하고 싶지 않다고 말했다.'}).sentences[0].links.find(l=>l.n===7).status,'부인');
});

check('a present threat over old photos is current, not past, and both the threat and the online adult are flagged',()=>{
 const s=safe(SEXT);assert.ok(s.some(x=>x.n===25)&&s.some(x=>x.n===4));
 assert.ok(!s.some(x=>x.status==='과거'),'"예전 사진을 퍼뜨리겠다고 협박" is a present threat');
});

check('no 0-point domain is written up as a strength when a safety signal is present',()=>{
 for(const c of [CUT,ABUSE,SEXT,PASSIVE]){
  const r=D.build(payload(c));
  assert.equal(r.strengths.length,0,'strengths from 0 scores in a safety case: '+r.strengths.map(x=>x.label).join(','));
 }
 const calm=D.build(payload({grade:'고1',answers:at({6:1,10:1})}));
 assert.ok(calm.strengths.length>0&&calm.strengths.every(x=>/보고되지 않|면담에서 확인/.test(x.text)),'0 points are hedged as "not reported", not asserted');
});

check('the decision chain ① and the first action agree on timing',()=>{
 for(const c of [CUT,ABUSE,SEXT,PASSIVE]){
  const R=DEC.resolve(payload(c));const first=String((R.integrated&&R.integrated.first)||R.deep.summary.first||'');const v=R.cells[0].value;
  if(/^지금 바로/.test(first))assert.ok(/지금 바로/.test(v),'chain says '+v+' while first action is '+first);
  else if(R.urgent)assert.ok(/오늘 확인/.test(v),v);
 }
});

check('unknown answers plus irregular meals and being alone at school are not read as neglect',()=>{
 const r=C.reconcile(MIXED.answers,MIXED.text);
 assert.ok(!r.signals.filter(Boolean).some(x=>x.tag==='protection'||x.id==='protection'),'false neglect/protection signal');
 assert.ok((FIVE.analyze(payload(MIXED)).tier||0)<4,'the mixed case was escalated by a false neglect cue');
});

check('elementary school refusal is not framed as 학업중단 숙려',()=>{
 const r=D.build(payload(REFUSAL));
 assert.ok(!/학업중단/.test(JSON.stringify(r.patterns)),'학업중단 wording reached an elementary case');
});

console.log('PASS clinical 13 regression: '+run+' checks (narrative cues, ②/③ agreement, strengths, timing, grade wording)');
