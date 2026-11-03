'use strict';
/* 2026-11-03 무작위 검수 보고서(외부 검수, main ddceb3b) 재현 회귀. 모든 문장은 가상이며 실제 사례가 아니다.
   P0 성적 위해 유사 표현: 신체 부위 없이 쓴 '성적 접촉', '원하지 않는 신체 접촉', '옷 속으로 손', '강제로 입맞춤' 등을
      현재 안전 확인 단서로 올린다. 단정(사실·가해자·신고 여부)은 하지 않는다. 부인·과거·제3자·교육 예시는 올리지 않는다.
   P1 서술 안전 단서와 같은 주제 문항 0점이 어긋나면 판정 사슬 안건·한 장 01·05에 같은 문장이 실린다.
   P2 '끼니를 거르지 않는다' 같은 안심 표현은 부인으로, '지원받아 해결됨'은 지금의 부족으로 읽지 않는다.
   불변: CORE 원점수·공식 판정(criteria.js)은 서술로 바뀌지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const N=require(path.join(SRC,'case-context-core.js'));
const CR=require(path.join(SRC,'criteria.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const ONE=require(path.join(SRC,'oy-onepage-v1.js'));
const FR=require(path.join(SRC,'oy-final-report-v1.js'));
const payload=(answers,narr)=>({type:'youth-support-data-v1',answers:answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],student:{gender:'미확인',dong:''},explicit:[],followups:{},caseContext:narr||''});
const quiet=f=>{const l=console.log,w=console.warn;console.log=console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
const strip=h=>String(h).replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const cur=ctx=>ctx.signals.filter(x=>['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party');
const Z=Array(25).fill(0);

// P0-a 현재 안전 확인이 필요한 성적 위해 서술(가정 안 성인이면 당일 단서).
const POS=[
 ['학생이 어머니의 남자친구에게 성적 접촉을 당한다고 말했다.',true],
 ['학생이 엄마 남자친구가 몸을 만진다고 말했다.',true],
 ['학생이 엄마 남자친구에게 성추행을 당하고 있다고 말했다.',true],
 ['원하지 않는 신체 접촉이 있었다고 함.',false],
 ['학원 선생님이 원치 않는 스킨십을 한다고 말함.',false],
 ['옷 속으로 손을 넣었다고 함.',false],
 ['삼촌이 치마 속으로 손을 넣었다고 학생이 말함.',true],
 ['강제로 입맞춤을 당했다고 함.',false],
 ['동네 아저씨가 억지로 키스하려고 했다고 함.',false],
 ['새아빠가 성적인 농담을 계속 한다고 함.',true],
 ['선배가 성관계를 요구했다고 학생이 말함.',false],
 ['아빠 친구가 자기 몸을 보여 주었다고 함.',false],
 ['계부가 씻는 모습을 엿본다고 학생이 말함.',true],
 ['친척 오빠가 야한 영상을 보여 주었다고 함.',true],
 ['싫다고 했는데도 사촌 오빠가 계속 껴안는다고 함.',true],
 ['밤에 방에 들어와 이불 속으로 들어온다고 학생이 말함.',false],
 ['학원 원장이 무릎에 앉히고 만진다고 함.',false],
 ['아르바이트 사장이 성희롱 발언을 한다고 학생이 말함.',false],
];
for(const [t,home] of POS){const ctx=N.reconcile(Z,t),c=cur(ctx).filter(x=>x.tag==='sexualHarm');
 assert.ok(c.length&&ctx.needsSafetyAttention,'성적 위해 단서 놓침: '+t);
 assert.ok(c.every(x=>x.humanConfirmationRequired&&x.evidenceClass==='unverified_optional_free_text'),'확인 전 단정: '+t);
 if(home)assert.ok(ctx.immediate.some(x=>x.tag==='sexualHarm'),'가정 안 성인 당일 단서 놓침: '+t);}

// P0-b 부인·과거·제3자·교육 예시·뉴스는 현재 본인 위해로 올리지 않는다.
const NOTNOW=[
 '원하지 않는 신체 접촉은 없었다고 함.',
 '성적 접촉은 없었다고 학생이 말함.',
 '만진 적은 없다고 함.',
 '초등학교 때 성추행 사건이 있었고 지금은 안정적임.',
 '예방 교육에서 원하지 않는 신체 접촉의 예시를 배웠다.',
 '뉴스에서 본 강제 입맞춤 사건 이야기를 함.',
 '친구가 선배에게 성추행을 당했다고 걱정함.',
 '만약 누가 옷 속으로 손을 넣으면 어떻게 하냐고 물어봄.',
];
for(const t of NOTNOW){const ctx=N.reconcile(Z,t);
 assert.ok(!ctx.needsSafetyAttention&&!ctx.immediate.length,'현재 본인 위해로 오판: '+t+' → '+ctx.signals.map(s=>s.tag+':'+s.polarity+':'+s.timeHint+':'+s.subject).join(','));}
// 제3자 피해는 그 사람의 안전 안내로 남는다.
assert.ok(N.infer('친구가 선배에게 성추행을 당했다고 걱정함.').issues.some(i=>i.type==='third-party-safety'));

// P2 필수생활 부정·해결 표현.
const BASIC=[
 ['학생은 최근 끼니를 거르지 않는다고 말했다.','negated'],
 ['끼니를 거르지는 않는다고 함.','negated'],
 ['끼니를 잘 챙김.','negated'],
 ['결식 없음.','negated'],
 ['요즘은 끼니를 굶지 않는다고 함.','negated'],
 ['학생이 최근 끼니를 거른다고 말했다.','reported'],
 ['최근 식비가 부족하다고 함.','reported'],
 ['끼니를 거르는지 확인 필요.','unverified'],
];
for(const [t,pol] of BASIC){const s=N.infer(t).signals.filter(x=>x.tag==='basic');
 assert.ok(s.length&&s.every(x=>x.polarity===pol),'필수생활 극성 '+pol+' 기대: '+t+' → '+s.map(x=>x.polarity).join(','));}
{const s=N.infer('식비가 부족했지만 지원받아 해결됨.').signals.filter(x=>x.tag==='basic');assert.ok(s.length&&s.every(x=>x.timeHint==='historical-mention'),'해결된 부족을 지금 부족으로 읽음');}
// 해결 표현은 안전 단서를 과거로 돌리지 않는다.
assert.ok(cur(N.reconcile(Z,'해결했다고 하지만 어제 손목을 그었다고 함.')).some(x=>x.tag==='selfharm'));
assert.strictEqual(N.reconcile(Z,'학생은 최근 끼니를 거르지 않는다고 말했다.').mismatches.length,0,'안심 문장이 0점과 불일치로 잡힘');

// 불변: 서술은 CORE 원점수·공식 판정을 바꾸지 않는다.
const ANS=[[...Z],Z.map((_,i)=>i%5),Z.map((_,i)=>i===6?'unknown':i%3)];
const G=domains.map(d=>d.items.length);
for(const a of ANS){const core=quiet(()=>CR.evaluate(a,G,false,{}));
 for(const [t] of POS.slice(0,6)){const R=quiet(()=>OD.resolve(payload(a,t)));assert.strictEqual(R.five.official.knownTotal,core.knownTotal,'서술이 원점수를 바꿈');assert.strictEqual(R.five.official.level,core.level,'서술이 공식 수준을 바꿈');}
 const f0=quiet(()=>OD.resolve(payload(a,''))).five,f1=quiet(()=>OD.resolve(payload(a,POS[0][0]))).five;
 assert.deepStrictEqual(f1.official,f0.official,'서술이 공식 판정을 바꿈');
 if(f0.tier!=null)assert.ok(f1.tier>=f0.tier,'서술 안전 단서가 단계를 낮춤');}

// P0·P1 전파: 판정 사슬 ① · 단계 · 안건 · 한 장 01(모든 역할) · 05가 같은 안전 상태와 문장을 쓴다.
const ROLES=['teacher','edu','team','welfare','child','admin'];
for(const [t] of POS){const p=payload(Z,t),R=quiet(()=>OD.resolve(p));
 assert.ok(R.narrSafety.length&&R.cells[0].tone!=='ok','① 서술 안전 단서 누락: '+t);
 assert.ok((R.tier||0)>=4,'③ 단계가 안전 단서를 반영하지 않음: '+t+' '+R.tier);
 const mm=R.agenda.find(a=>a.k==='mismatch');assert.ok(mm&&/1번 문항 0점이 어긋납니다/.test(mm.t),'점수-서술 불일치 안내 없음: '+t);
 for(const role of ROLES){const h=strip(ONE.html(quiet(()=>ONE.model(p,role))));assert.ok(h.includes(mm.t),'한 장('+role+')에 불일치 안내 없음: '+t);}
 const k=quiet(()=>FR.model(p,{}));assert.ok(k.agenda.some(a=>a.t===mm.t),'05에 불일치 안내 없음: '+t);
 assert.ok(quiet(()=>FR.text(p,{})).includes(mm.t),'05 글 내보내기에 불일치 안내 없음');}
// 같은 주제 문항이 1점 이상이면 불일치 안내를 만들지 않는다.
{const a=[...Z];a[0]=2;const R=quiet(()=>OD.resolve(payload(a,POS[3][0])));assert.ok(!R.agenda.some(x=>x.k==='mismatch'));}
// 부인 문장은 단계·안전 셀을 올리지 않는다.
for(const t of NOTNOW.slice(0,3)){const R=quiet(()=>OD.resolve(payload(Z,t)));assert.ok(!R.narrSafety.length&&R.tier===1,'부인 문장으로 단계 상향: '+t);}
console.log('PASS: 2026-11-03 audit — sexual-harm cues '+POS.length+', not-current '+NOTNOW.length+', basic-needs '+(BASIC.length+1)+', propagation to chain/one-page×'+ROLES.length+'/05, CORE unchanged');
