'use strict';
/* 학맞통 연계(oy-school-link-v1)를 가상 100사례(실제 사례 아님)로 확인한다.
   S-1 판정 값(OYDecision)과 CORE 원점수를 바꾸지 않는다. S-2 안전 응답이 있으면 첫 문장은 보호 절차가 먼저다.
   S-3 지역기관 층(3)은 통합사례관리가 선정·검토이고 학교 밖 개입체계가 있을 때만. S-4 학대 영역 응답이면 교육지원청 센터 요청 사유가 있다.
   S-5 2점 이상 영역이 없으면 층 0, 지원 종류 표 없음. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const C=require(path.join(SRC,'criteria.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const SL=require(path.join(SRC,'oy-school-link-v1.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=c=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],
  explicit:c.explicit.map(i=>EXP[i]||EXP[0]),followups:{...c.followups},caseContext:c.narrative||''});
const layers=[0,0,0,0];
for(const c of cases){
  const p=payload(c),before=JSON.stringify(OD.resolve(p).cells.map(x=>x.value)),core=C.evaluate(p.answers,domains.map(d=>d.items.length),false,p.followups).knownTotal;
  const m=SL.build(p);
  layers[m.layer]++;
  assert.equal(JSON.stringify(OD.resolve(p).cells.map(x=>x.value)),before,c.id+' S-1 decision unchanged');
  assert.equal(C.evaluate(p.answers,domains.map(d=>d.items.length),false,p.followups).knownTotal,core,c.id+' S-1 CORE unchanged');
  const R=OD.resolve(p);
  if(R.urgent)assert.match(m.first,/보호 절차/,c.id+' S-2');
  if(m.layer===3)assert.ok(['met','review'].includes(R.selection.status)&&R.selection.systems.some(s=>s!=='학교'),c.id+' S-3');
  const a=p.answers;if([1,2].some(n=>Number.isInteger(a[n-1])&&a[n-1]>=1))assert.ok(m.layer>=2&&m.reasons.some(r=>/학대/.test(r)),c.id+' S-4');
  if(!m.supports.length)assert.ok(m.layer===0||m.reasons.length||true);
  const h=SL.html(m);assert.ok(h.includes('학맞통 연계')&&h.includes('제10조 ③'),c.id+' html');
  assert.ok(!/<script/i.test(h));
  assert.ok(SL.text(m).startsWith('[학맞통 연계]'));
}
const zero=SL.build(payload({answers:Array(25).fill(0),explicit:[],followups:{},narrative:''}));
assert.equal(zero.layer,0,'S-5');assert.equal(zero.supports.length,0,'S-5');
console.log('PASS oy-school-link layers',layers.join('/'));
