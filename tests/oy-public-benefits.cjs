'use strict';
/* 공공 지원사업 연결(oy-public-benefits-v1)을 가상 100사례(실제 사례 아님)와 손으로 만든 가상 서술로 확인한다.
   P-1 판정 값(OYDecision)과 CORE 원점수를 바꾸지 않는다. P-2 연결된 사업마다 연결 고리(문항·서술·학년 근거)가 있다.
   P-3 문의 창구는 복지자원 DB에 있는 기관만 쓴다(번호를 만들지 않음). P-4 모든 문항 0점·서술 없음이면 연결 0개.
   P-5 서술의 가구 특성(한부모·수급)과 학년(중1)이 해당 사업으로 이어진다. P-6 부정 서술('한부모 아님')은 잇지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
require(path.join(__dirname,'../docs/assets/data.js'));
const D=window.WELFARE_DATA,ids=new Set(D.organizations.map(o=>o.id));
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const C=require(path.join(SRC,'criteria.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const PB=require(path.join(SRC,'oy-public-benefits-v1.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=(c,extra)=>Object.assign({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],
  explicit:(c.explicit||[]).map(i=>EXP[i]||EXP[0]),followups:{...(c.followups||{})},caseContext:c.narrative||''},extra||{});
const sizes=domains.map(d=>d.items.length);
let linked=0,total=0;const hit={};
for(const c of cases){
  const p=payload(c,{student:{gender:'미확인',grade:'중2',dong:'세마동'}}),before=JSON.stringify(OD.resolve(p).cells.map(x=>x.value)),core=C.evaluate(p.answers,sizes,false,p.followups).knownTotal;
  const m=PB.build(p,{data:D});
  assert.ok(m.ready&&m.total===148,c.id+' 148 SSIS services read');
  assert.equal(JSON.stringify(OD.resolve(p).cells.map(x=>x.value)),before,c.id+' P-1 decision unchanged');
  assert.equal(C.evaluate(p.answers,sizes,false,p.followups).knownTotal,core,c.id+' P-1 CORE unchanged');
  for(const i of m.items){
    assert.ok(i.why.length>0,c.id+' P-2 '+i.name+' has a link reason');
    if(i.desk)assert.ok(ids.has(i.desk.id),c.id+' P-3 desk from DB '+i.desk.id);
    assert.ok(/^SVC-SSIS-/.test(i.id),c.id+' only SSIS rows');
    hit[i.name]=(hit[i.name]||0)+1;
  }
  if(m.items.length)linked++;total+=m.items.length;
  const h=PB.html(m);assert.ok(/공공 지원사업/.test(h),c.id+' html');
  if(m.safety&&m.items.length)assert.ok(/안전 확인·신고 절차가 먼저/.test(h),c.id+' safety first line');
}
const zero=PB.build(payload({answers:Array(25).fill(0)}),{data:D});
assert.equal(zero.items.length,0,'P-4 zero answers → no links');
const base=Array(25).fill(0);base[18]=3;base[19]=2;base[5]=2;
const rich=PB.build(payload({answers:base,narrative:'어머니와 둘이 사는 한부모 가구이며 기초생활수급 가정이다.'},{student:{gender:'미확인',grade:'중1',dong:'신장1동'}}),{data:D});
const names=rich.items.map(i=>i.name).join(' | ');
assert.ok(/한부모가족 지원/.test(names),'P-5 한부모 → 한부모가족 지원: '+names);
assert.ok(/교육급여/.test(names),'P-5 수급 → 교육급여');
assert.ok(/교복구입비/.test(names),'P-5 중1 → 교복');
assert.ok(rich.items.some(i=>i.desk&&i.desk.name==='오산시 신장1동 행정복지센터'),'P-3 dong desk');
assert.ok(/서술: 한부모가구/.test(PB.text(rich)),'P-5 text carries chain');
const neg=PB.build(payload({answers:base,narrative:'한부모 가구는 아님. 부모님 두 분과 함께 산다.'}),{data:D});
assert.ok(!neg.items.some(i=>/한부모가족 지원/.test(i.name)),'P-6 negation not linked');
console.log('PASS oy-public-benefits linked',linked+'/100','avg',(total/100).toFixed(1),'top',Object.entries(hit).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x.join(':')).join(', '));
