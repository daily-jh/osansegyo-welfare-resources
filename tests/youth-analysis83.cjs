const A=require('node:assert/strict'),F=require('../docs/youth-risk/case-formulation-v72.js'),M=require('../docs/youth-risk/case-analysis-v83.js'),C=require('../docs/youth-risk/criteria.js');
const make=answers=>({answers,explicit:[],followups:{},caseContext:''});
for(let seed=0;seed<1000;seed++){
 const p=make(Array.from({length:25},(_,i)=>(seed+i*7)%11===0?'unknown':(seed+i*3)%5)),before=JSON.stringify(p),x=F.build(p),m=M.analyze(p,x);
 A.equal(JSON.stringify(p),before);A.deepEqual(x.decision,C.evaluate(p.answers,[2,3,3,3,2,2,3,3,2,2],false,{}));
 A.equal(m.rows.length,10);A.ok(m.matrix.x<=m.matrix.xMax&&m.matrix.y<=m.matrix.yMax);A.ok(m.matrix.xMax<=100&&m.matrix.yMax<=100);A.ok(m.cross.length);
 if(m.unknown){A.equal(m.matrix.quadrant,null);A.doesNotMatch(M.matrixHTML(m),/<circle/);A.ok(m.rows.filter(r=>r.missing).every(r=>r.level==='판정 보류'));}
}
for(const [v,q]of [[0,'선별 지원·관찰'],[4,'복합 조정']]){const p=make(Array(25).fill(v)),a=M.analyze(p,F.build(p));A.equal(a.matrix.quadrant,q);A.match(M.matrixHTML(a),/<circle/);}
const p=make(Array(25).fill(0));p.answers[9]=4;let a=M.analyze(p,F.build(p));A.equal(a.rows[3].level,'상');A.equal(a.rows[0].level,'하');p.caseContext='<img src=x onerror=alert(1)> 수학 과제가 어려움.';A.doesNotMatch(F.html(p),/<img/);A.match(F.html(p),/영역별 해석과 지원 방향/);A.match(F.html(p),/종합의견 · 사례관리 보고서/);A.ok(F.html(p).lastIndexOf('종합의견')>F.html(p).indexOf('확인근거'));
console.log('PASS analysis 8.3: 1000 deterministic scenarios; CORE invariance, unknown ranges, quadrants, 10-domain levels, escaped report and canonical formulation');
