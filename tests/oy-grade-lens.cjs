'use strict';
/* 학년(발달단계) 해석 보조(oy-grade-lens-v1)를 가상 100사례(실제 사례 아님)로 확인한다.
   1) 학년은 점수·CORE 판정·5단계·개입 수준·주관·판정 6칸을 바꾸지 않는다(해석 보조).
   2) 학년을 고르면 ① 척도 해석·③ 통합 사정의견·03 사례사정·05 최종 보고서에 학년 해석이 들어가고, 고르지 않으면 아무것도 붙지 않는다.
   3) 12개 학년 모두 발달과업·근거 문헌이 있고, 본문의 [S번호]는 모두 문헌 목록에 있다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
new Function('window',fs.readFileSync(path.join(SRC,'../assets/data.js'),'utf8'))(globalThis);
const rows=require(path.join(SRC,'resource-adapter.js')).rows(globalThis.WELFARE_DATA);
const GL=require(path.join(SRC,'oy-grade-lens-v1.js'));
const D=require(path.join(SRC,'oy-deep-interpretation-v1.js'));
const N=require(path.join(SRC,'oy-narrative-interpretation-v1.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const FR=require(path.join(SRC,'oy-final-report-v1.js'));
const YM=require(path.join(SRC,'support-model.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=(c,i,grade)=>({type:'youth-support-data-v1',student:{gender:'미확인',dong:'',...(grade?{grade}:{})},answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:rows,
  explicit:c.explicit.map(i=>EXP[i]||EXP[0]),followups:{...c.followups},caseContext:c.narrative||'',flowRevision:i+1});

// 3) every grade has a band, tasks and the sources it cites
assert.equal(GL.GRADES.length,12);
const ids=new Set(GL.SOURCES.map(s=>s.id));
const all=Array(25).fill(2);
for(const g of GL.GRADES){
  const L=GL.read(g,D.build({answers:all}));
  assert.ok(L&&L.tasks.length>=3&&L.sources.length>=2,g);
  const cited=GL.text(L).join('\n').match(/S\d+/g)||[];
  cited.forEach(s=>{assert.ok(ids.has(s),g+' cites unknown '+s);assert.ok(L.sources.some(x=>x.id===s),g+' lists '+s)});
  assert.ok(!/진단|확정|위험군입니다|예측됩니다/.test(L.summary),g+' summary stays descriptive');
}
for(const bad of ['','초7','중4','고0','대1',null,'<b>'])assert.equal(GL.read(bad),null,'rejects '+bad);
assert.equal(GL.normalize('중 2학년'),'중2');
// the welfare map keeps a valid grade and drops anything else
assert.equal(YM.student({student:{grade:'고1'}}).grade,'고1');
assert.equal(YM.student({student:{grade:'중9'}}).grade,'');

// 1) and 2) on 100 synthetic cases, rotating through the grades
let shown=0,handoff=0;
cases.forEach((c,i)=>{
  const g=GL.GRADES[i%12],p0=payload(c,i,''),p1=payload(c,i,g);
  const d0=D.build(p0),d1=D.build(p1);
  assert.deepEqual(d1.core,d0.core,c.id+' core');
  // Grade may only reword an elementary pupil's school-dropout first step (no 학업중단 숙려 at 초); every judgement stays the same.
  const {first:fa,...s1}=d1.summary,{first:fb,...s0}=d0.summary;
  assert.deepEqual(s1,s0,c.id+' summary');
  if(/^초/.test(g)&&fa!==fb)assert.ok(/학업중단/.test(fb)&&!/학업중단/.test(fa),c.id+' only the dropout wording changes at elementary grades');
  else assert.equal(fa,fb,c.id+' first action');
  assert.equal(d1.casework.level.name,d0.casework.level.name,c.id+' casework level');
  assert.equal(d0.grade,null);assert.equal(d1.grade.grade,g);
  const t0=D.text(d0),t1=D.text(d1);
  assert.ok(!t0.includes('학년(발달단계)'),c.id+' no grade, no block');
  assert.ok(t1.includes('[2. 사례개념화]')||t1.includes('사례개념화'),c.id);
  assert.ok(t1.includes('학년(발달단계)으로 읽기')&&t1.includes('학년: '+GL.label(g)),c.id+' deep text');
  assert.ok(D.html(d1).includes('class="ogl-lens"'),c.id+' deep html');
  const I0=N.integrate(p0),I1=N.integrate(p1);
  assert.equal(I1.level.name,I0.level.name,c.id+' integrated level');
  assert.equal(I1.lead,I0.lead,c.id+' lead');
  assert.ok(N.integratedText(I1).includes('[학년(발달단계)으로 읽기]'),c.id+' integrated text');
  assert.ok(N.integratedHtml(I1).includes('ogl-lens')&&N.caseHtml(I1,'사례사정').includes('ogl-lens'),c.id+' integrated html');
  if(I1.grade.handoff){handoff++;assert.ok(I1.plan[2].rows.some(r=>r.what===I1.grade.handoff),c.id+' hand-over in plan')}
  const R0=OD.resolve(p0),R1=OD.resolve(p1);
  assert.deepEqual(R1.cells.map(x=>x.value),R0.cells.map(x=>x.value),c.id+' six cells');
  assert.equal(R1.tier,R0.tier,c.id+' tier');
  const f1=FR.text(p1,{date:'2026-10-28'});
  assert.ok(f1.includes('[학년으로 읽기 · 판정 불변] '+GL.label(g)),c.id+' final report');
  assert.ok(!FR.text(p0,{date:'2026-10-28'}).includes('학년으로 읽기'),c.id+' final report without grade');
  shown++;
});
assert.equal(shown,100);assert.ok(handoff>=20,'transition grades add a hand-over');
console.log('PASS grade lens: 12 grades with sources, 100 synthetic cases, decisions unchanged, grade shown in ①·③·03·05 only when chosen');
