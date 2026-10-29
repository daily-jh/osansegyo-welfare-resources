'use strict';
/* 기능 간 연결성 점검(가상 1,200사례 + 새 서술 101문장, 2026-10-29, 실제 사례 아님)에서 나온 규칙.
   - 서술 안전 판단은 하나다: ①(서술 안전 단서)과 ③(단계)이 같은 해석기(case-context-core)를 따른다.
   - 부인·과거·제3자·뉴스·가정 질문은 안전 단서도 단계 상향도 만들지 않는다. 같은 집 다른 가족 피해는 '같은 집 가족 피해(학생 안전 확인)'.
   - 마침표 없이 이어 쓴 문장(…들지 않는다고 함 자해 흔적이…)에서 앞 문장의 부인이 뒤로 번지지 않는다.
   - ⑤ 선정 충족이면 ④는 일반 사례관리 이상, ④ 다기관·위기면 ⑥은 '학교 내 지원으로 시작'이 아니다. ③ 이유에 '점수 —단계'가 없다.
   - 03 학교 지원 자료는 명시 긴급 체크를 반영한다. AI 패널 요약·바로 답은 판정 사슬의 안전·개입 수준을 따른다.
   - 서술에만 안전 단서가 있어도 한 장 요약에 오늘 연락처가 있다. 05 '이 학생은'이 점수상 어려움 없음으로 단계와 어긋나지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const N=require(path.join(SRC,'case-context-core.js'));
const NI=require(path.join(SRC,'oy-narrative-interpretation-v1.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const ONE=require(path.join(SRC,'oy-onepage-v1.js'));
const FR=require(path.join(SRC,'oy-final-report-v1.js'));
const PV=require(path.join(SRC,'oy-perspective-v1.js'));
const DI=require(path.join(SRC,'oy-deep-interpretation-v1.js'));
const AK=require(path.join(SRC,'oy-ask-model-v1.js'));
const SC=require(path.join(SRC,'oy-safety-contacts-v1.js'));
const {BANK}=require('./fixtures/xmod1200-phrases.cjs');
const {gen}=require('./fixtures/xmod1200-gen.cjs');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=c=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],student:{gender:'미확인',dong:'',...(c.grade?{grade:c.grade}:{})},
  explicit:(c.explicit||[]).map(i=>EXP[i]||EXP[0]),followups:{...(c.followups||{})},caseContext:c.narrative||''});
const quiet=f=>{const l=console.log,w=console.warn;console.log=console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
const current=ctx=>ctx.signals.filter(x=>x.safety&&['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party');

// 1. 문장 하나씩: 기대 태그·안전·당일 여부, 부인·과거·제3자·가정 질문은 오판 없음.
for(const b of BANK){const narr='담임 관찰 기록. '+b.t,ans=Array(25).fill(0);
 const ctx=N.reconcile(ans,narr),cur=ctx.signals.filter(x=>['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party');
 const R=quiet(()=>OD.resolve(payload({answers:ans,narrative:narr}))),safe=cur.some(x=>x.safety);
 if(b.kind==='pos'){
  if(b.exp.length)assert.ok(cur.some(x=>b.exp.includes(x.tag)),'놓침: '+b.t);
  assert.strictEqual(safe,b.safe,'안전 단서 기대와 다름: '+b.t);
  if(b.safe)assert.ok(R.narrSafety.length,'① 서술 안전 단서 없음: '+b.t);
  if(b.imm)assert.ok((ctx.immediate||[]).length,'당일 단서 놓침: '+b.t);
 }else if(['neg','past','third'].includes(b.kind)){assert.ok(!safe&&R.tier===1&&!R.narrSafety.length,'오판: '+b.t);}
 else if(b.kind==='hypo'){if(!b.exp.length)assert.ok(!safe&&!R.narrSafety.length,'가정 질문 오판: '+b.t);}
 else if(b.kind==='str'){assert.ok(!cur.length,'강점 문장에서 어려움 탐지: '+b.t);}
 else if(b.kind==='home'){assert.ok(safe&&R.narrSafety.every(t=>/같은 집 가족 피해/.test(t))&&R.narrSafety.length,'같은 집 가족 피해 이름: '+b.t+' → '+R.narrSafety.join(','));}
}
// 2. 이어 쓴 문장: 앞 문장의 부인이 뒤 문장으로 번지지 않는다.
for(const t of ['죽고 싶은 생각은 들지 않는다고 함 자 해 한 흔적이 팔에 있음.','가출할 생각은 전혀 없다고 함 자 해 한 흔적이 팔에 있음.','위험한 생각은 없었다고 함ㅠㅠ 딥페이크 사진이 단톡방에 돌았다고 함.'])
 assert.ok(current(N.reconcile(Array(25).fill(0),t)).length,'이어 쓴 문장 놓침: '+t);
assert.strictEqual(current(N.reconcile(Array(25).fill(0),'마음 상태가 안 좋다고 함')).length,0);

// 3. 가상 1,200사례: 모듈 사이 불변식.
const cases=gen(1200,202610291400);let narrCases=0,phrPos=0,phrMiss=0;
for(const c of cases){const p=payload(c),R=quiet(()=>OD.resolve(p)),cells=R.cells,id=c.id;
 const ctx=N.reconcile(p.answers,p.caseContext),cur=current(ctx),ss=NI.safetySummary(p),niS=((ss&&ss.safety)||[]);
 assert.strictEqual(Boolean(niS.length),Boolean(cur.length),id+' ①과 ③의 서술 안전 판단이 다름');
 if(R.selection.status==='met')assert.ok(!['monitor','brief'].includes(R.level.id),id+' ⑤ 충족인데 ④ '+R.level.name);
 if(['intensive','crisis'].includes(R.level.id))assert.ok(!/학교 내 지원으로 시작/.test(R.pathway),id+' ④ 다기관인데 ⑥ 학교 내 시작');
 assert.ok(!/—단계/.test(cells[2].why),id+' ③ 이유 '+cells[2].why);
 if(p.explicit.length){const pv=quiet(()=>PV.analyze(p));assert.ok(pv.core.urgent,id+' 03 자료가 명시 긴급을 놓침');}
 // AI 패널: 사슬을 붙인 요약과 바로 답
 const d=quiet(()=>DI.build({...p,caseContext:''}));d.chain=R;
 const g=AK.glance(d);if(cells[0].tone!=='ok')assert.ok(!/안전 신호 없음/.test(g.split('\n')[1]),id+' AI 요약 안전 '+g.split('\n')[1]);
 assert.ok(g.includes('사례관리 수준: '+cells[3].value),id+' AI 요약 개입 수준');
 for(const f of AK.FAQ)assert.ok(!/해당하는 내용이 없습니다/.test(AK.answer(d,f.id).text),id+' AI 바로 답 비어 있음 '+f.id);
 const pr=AK.prompt({mode:'section',r:d,sectionTitle:'척도 해석 · 요약',sectionText:'x'});
 assert.ok(/\[판정 사슬/.test(pr),id+' AI 요청문에 판정 사슬 없음');
 if(c.narrative)assert.ok(!pr.includes(c.narrative.slice(0,24)),id+' AI 요청문에 서술 원문');
 // 한 장 요약·05
 if(R.narrSafety.length){narrCases++;const m=quiet(()=>ONE.model(p,'teacher'));assert.ok(m.contacts.length&&/오늘 연락처/.test(ONE.html(m)),id+' 한 장 오늘 연락처 없음');}
 const k=quiet(()=>FR.model(p,{}));if((R.tier||0)>=2||cells[0].tone!=='ok')assert.ok(!/^이번 응답에서 이 학생의 어려움은 가볍거나/.test(k.und),id+' 05 이 학생은 문장이 단계와 어긋남');
 // 혼합 서술 속 안전 문장 탐지율
 for(const bi of c.phr){const b=BANK[bi];if(b.kind!=='pos'||!b.safe)continue;phrPos++;const key=b.t.slice(2,10).replace(/ /g,'');
  if(!cur.some(x=>x.clause.replace(/ /g,'').includes(key)||x.clause.includes(b.t.slice(2,10))))phrMiss++;}
}
assert.ok(narrCases>100,'서술 안전 사례 표본 '+narrCases);
assert.ok(phrMiss/phrPos<0.01,'혼합 서술 안전 문장 놓침 '+phrMiss+'/'+phrPos);
// 4. 연락처는 안전 유형 이름만으로 고른다.
assert.deepStrictEqual(SC.forSignals({topics:['가출·외박(오늘 거처 확인)']}).map(x=>x.id),['runaway']);
assert.deepStrictEqual(SC.forSignals({items:[7]}).map(x=>x.id),['selfharm']);
assert.deepStrictEqual(SC.forSignals({topics:[]}),[]);
console.log('PASS oy-xmod1200-regression: 101 phrases, 1,200 synthetic cases, narrative-safety cases '+narrCases+', mixed-text misses '+phrMiss+'/'+phrPos);
