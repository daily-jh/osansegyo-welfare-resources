'use strict';
/* 판정 사슬(oy-decision-v1) 규칙을 가상 100사례(2026-10-27 평가 세트, 실제 사례 아님)로 확인한다.
   R-1 진행체계의 '통합사례관리'는 선정일 때만, R-2 관찰·단기 수준과 2개 이상 개입체계는 '선정 검토',
   R-3 잠정·추가확인은 '미충족'으로 닫지 않음, R-5 CORE 판정은 그대로. 학교 안 지원은 한 개입체계(지훈 결정 2026-10-27). */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const C=require(path.join(SRC,'criteria.js'));
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const OC=require(path.join(SRC,'oy-constants-v1.js'));
const P=require(path.join(SRC,'oy-perspective-v1.js'));
const NI=require(path.join(SRC,'oy-narrative-interpretation-v1.js'));
const cases=require('./fixtures/synthetic-cases100-20261027.json');
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=c=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],
  explicit:c.explicit.map(i=>EXP[i]||EXP[0]),followups:{...c.followups},caseContext:c.narrative||''});
assert.equal(cases.length,100);
const counts={};
for(const c of cases){
  const p=payload(c),R=OD.resolve(p),sel=R.selection;
  counts[sel.status]=(counts[sel.status]||0)+1;
  // R-1
  if(/통합사례관리 병행|통합사례관리 중심/.test(R.pathway))assert.equal(sel.status,'met',c.id+' R-1 '+R.pathway);
  if(/복지관 통합사례관리/.test(R.lead))assert.equal(sel.status,'met',c.id+' R-1 lead '+R.lead);
  // R-2
  if(['monitor','brief'].includes(R.level.id)&&!R.urgent)assert.notEqual(sel.status,'met',c.id+' R-2');
  if(sel.systems.length>=2&&['monitor','brief'].includes(R.level.id)&&!R.urgent)assert.equal(sel.status,'review',c.id+' R-2 review');
  // R-3
  if(R.provisional)assert.notEqual(sel.status,'not',c.id+' R-3');
  // 위기 영역 응답은 공동 개입
  if(R.safetyPos.length)assert.equal(sel.status,'met',c.id+' safety joint');
  // 학교 안 지원은 한 개입체계
  assert.equal(new Set(sel.systems).size,sel.systems.length);
  assert.ok(!sel.systems.includes('상담'),c.id+' 상담 is school');
  // R-5 CORE untouched
  const core=C.evaluate(p.answers,domains.map(d=>d.items.length),p.explicit.length>0,p.followups);
  assert.equal(R.five.official.title,core.title,c.id+' CORE title');
  // 서술 통합의 주관 문장도 같은 선정 결과를 따른다
  const I=NI.integrate(p);if(/복지관 통합사례관리/.test(I.lead))assert.equal(sel.status,'met',c.id+' NI lead');
  // 04 A-0 준거표와 띠가 같은 선정 결과를 보여 준다
  const h=P.render('agency',p);const row=(h.match(/2개 이상 기관 전문 개입<\/th>[\s\S]*?<\/tr>/)||[''])[0];
  assert.ok(row.includes(sel.label),c.id+' A-0 label '+sel.label);
  // 띠: 여섯 칸, 학교용은 단계 숫자 없음
  const strip=OD.strip(R),school=OD.strip(R,{audience:'school'});
  assert.equal((strip.match(/class="oyd-cell/g)||[]).length,6);
  const cellsText=(school.match(/<ol class="oyd-strip">[\s\S]*?<\/ol>/)||[''])[0].replace(/<[^>]+>/g,' ');
  assert.ok(!/\d단계/.test(cellsText),c.id+' school strip shows tier number');
  assert.ok(R.versions.length>=5);
}
// 추가확인 미리보기: 예/아니오 두 갈래가 나온다
const pend=cases.find(c=>c.answers[3]===1&&!Object.keys(c.followups).length);
if(pend){const W=OD.whatIf(payload(pend));assert.ok(W.rows.length>=2);assert.ok(W.rows.some(r=>/아니오/.test(r.label))&&W.rows.some(r=>/「예」/.test(r.label)));}
assert.ok(counts.review>0&&counts.met>0&&counts.not>0,'selection spread '+JSON.stringify(counts));
console.log('oy-decision-chain ok',JSON.stringify(counts));
