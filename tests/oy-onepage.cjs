'use strict';
/* 핵심 결과 한 장(oy-onepage-v1)을 가상 100사례(실제 사례 아님)로 확인한다.
   1) 안전·단계 값은 판정 사슬(OYDecision.resolve)과 같다. 2) 서술 원문 조각이 들어가지 않는다.
   3) 다음 할 일은 역할마다 1~3개, 담임교사는 '전달'로 끝나고 안전 신호가 있으면 첫 줄이 알리기다. 4) 입력을 바꾸지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
new Function('window',fs.readFileSync(path.join(SRC,'../assets/data.js'),'utf8'))(globalThis);
const rows=require(path.join(SRC,'resource-adapter.js')).rows(globalThis.WELFARE_DATA);
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const OP=require(path.join(SRC,'oy-onepage-v1.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=(c,i)=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:rows,
  explicit:c.explicit.map(i=>EXP[i]||EXP[0]),followups:{...c.followups},caseContext:c.narrative||'',flowRevision:i+1});
const fragments=t=>String(t||'').split(/[.,!?\n“”"'()·]+/).map(s=>s.trim()).filter(s=>s.length>=12);
const ROLES=['',...Object.keys(OP.SCOPE)];
cases.forEach((c,i)=>{
  const p=payload(c,i),before=JSON.stringify(p),R=OD.resolve(p);
  ROLES.forEach(role=>{
    const m=OP.model(p,role),h=OP.html(m),t=OP.text(m);
    assert.equal(m.tier,R.tier,c.id+' tier');
    assert.equal(m.k.safety.value,R.cells[0].value,c.id+' safety');
    assert.ok(m.steps.length>=1&&m.steps.length<=3,c.id+' '+role+' steps 1~3');
    assert.ok(m.hard.length<=3,c.id+' at most three hard areas');
    if(role==='teacher'){assert.ok(m.steps.some(s=>/전달/.test(s)),c.id+' teacher hands over');if(R.urgent)assert.match(m.steps[0],/알립니다/,c.id+' teacher tells first when unsafe');}
    fragments(c.narrative).forEach(f=>{assert.ok(!h.includes(f)&&!t.includes(f),c.id+' narrative fragment leaked: '+f)});
  });
  assert.equal(JSON.stringify(p),before,c.id+' input unchanged');
});
console.log('PASS oy-onepage: 100 synthetic cases × '+ROLES.length+' roles — same safety/tier as the decision chain, 1~3 next steps, teacher hands over, no narrative text');
