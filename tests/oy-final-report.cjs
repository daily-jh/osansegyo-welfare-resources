'use strict';
/* 05 최종 보고서(oy-final-report-v1)를 가상 100사례(2026-10-27 평가 세트, 실제 사례 아님)로 확인한다.
   1) 판정 6칸은 서술 포함·미포함과 상관없이 화면 값(OYDecision.resolve(원래 입력))과 같다(지훈 결정 2026-10-27).
   2) 서술 미포함 출력에는 서술 원문 조각·인용부호가 없다. 3) 실무자 의견은 들어가되 400자까지. 4) 입력은 바꾸지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
new Function('window',fs.readFileSync(path.join(SRC,'../assets/data.js'),'utf8'))(globalThis);
const rows=require(path.join(SRC,'resource-adapter.js')).rows(globalThis.WELFARE_DATA);
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const FR=require(path.join(SRC,'oy-final-report-v1.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=(c,i)=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:rows,
  explicit:c.explicit.map(i=>EXP[i]||EXP[0]),followups:{...c.followups},caseContext:c.narrative||'',flowRevision:i+1});
/* 서술 원문의 조각(문장을 쉼표·마침표로 나눈 12자 이상 구절)이 출력에 그대로 있으면 원문이 샌 것으로 본다. */
const fragments=t=>String(t||'').split(/[.,!?\n“”"'()·]+/).map(s=>s.trim()).filter(s=>s.length>=12);
assert.equal(cases.length,100);
let narr=0,withRes=0;
cases.forEach((c,i)=>{
  const p=payload(c,i),before=JSON.stringify(p);
  const screen=OD.resolve(p);
  for(const inc of [false,true]){
    const k=FR.model(p,{includeNarrative:inc,date:'2026-10-27'});
    assert.deepEqual(k.cells.map(x=>x.value),screen.cells.map(x=>x.value),c.id+' cells '+inc);
    assert.equal(k.path,screen.pathway,c.id+' path');
    assert.equal(k.tier,screen.tier,c.id+' tier');
    const t=FR.text(p,{includeNarrative:inc,date:'2026-10-27'});
    assert.ok(t.includes(OD.text(screen)),c.id+' TXT carries the screen decision block');
    const html=FR.sheetsHtml(k);
    assert.equal((html.match(/class="ofr-sheet"/g)||[]).length,2,c.id+' two A4 sheets');
    if(!inc&&c.narrative){
      fragments(c.narrative).forEach(f=>{assert.ok(!t.includes(f),c.id+' narrative fragment in TXT: '+f);assert.ok(!html.includes(f),c.id+' narrative fragment in sheets: '+f)});
      assert.ok(!/[“”]/.test(t),c.id+' no quotes when narrative excluded');
      assert.ok(/판정은 화면과 같습니다/.test(t),c.id+' notice');
    }
    if(!c.narrative)assert.equal(k.inc,false,c.id+' nothing to include');
  }
  if(c.narrative)narr++;
  if(FR.model(p).resources.length)withRes++;
  assert.equal(JSON.stringify(p),before,c.id+' input untouched');
});
assert.ok(narr>=60,'narrative cases covered '+narr);
assert.ok(withRes>=50,'resource candidates found '+withRes);
/* 실무자 의견: 그대로 들어가고 400자에서 자른다. 판정은 바뀌지 않는다. */
const p0=payload(cases[0],0),op='보호자와 통화했고 다음 주 가정방문에 동의했습니다.';
const k0=FR.model(p0,{opinion:op}),k1=FR.model(p0,{opinion:'가'.repeat(900)});
assert.equal(k0.opinion,op);assert.equal(k1.opinion.length,FR.OP_MAX);
assert.ok(FR.sheetsHtml(k0).includes('실무자 의견')&&FR.text(p0,{opinion:op}).includes(op));
assert.ok(!FR.sheetsHtml(FR.model(p0)).includes('class="xop'),'no opinion block when empty');
assert.deepEqual(k0.cells,FR.model(p0).cells,'opinion never changes the decision');
assert.ok(FR.readHtml(k0).includes('ofr-mob'),'mobile reading layout');
console.log('PASS final report: 100 synthetic cases, decision equals screen with and without narrative, narrative excluded from output,',narr,'narrative cases,',withRes,'with resources');
