const assert=require('node:assert/strict');
const Engine=require('../docs/youth-risk/language-response-model.js');
const Map=require('../docs/youth-risk/support-model.js');
const Matrix=require('../docs/youth-risk/evidence-matrix.js');
function sample(overrides={},extra={}){
 const p={answers:Array(25).fill(0),student:{gender:'미확인',dong:'신장1동'},explicit:[],followups:{},domains:[],routes:[],resources:[]};
 Object.entries(overrides).forEach(([n,v])=>p.answers[Number(n)-1]=v);
 return {...p,...extra};
}
function result(p,q='',note='',role='teacher'){return Engine.buildResponse(p,q,note,role,{Map,Matrix})}
function check(condition,label){assert.ok(condition,label)}
{
 const p=sample({7:1});const before=JSON.stringify(p);
 const out=result(p,'현재 안전은?');
 check(out.text.includes('보호 관련 신호'), 'self harm override');
 check(out.text.includes('112/119'), 'emergency path');
 assert.equal(JSON.stringify(p),before,'immutable input');
}
{
 const out=result(sample({7:'unknown'}),'판정 근거는?');
 check(out.text.includes('전체 판단 보류'),'unknown prohibits final total');
 check(!out.text.includes('0/100점'),'unknown not coerced to zero');
}
{
 const out=result(sample({}, {student:{gender:'미확인',dong:'세마동'}}),'관할 연계기관');
 check(out.text.includes('1권역 · 오산세교종합사회복지관'),'correct first zone');
}
{
 const out=result(sample({}, {student:{gender:'미확인',dong:'중앙동'}}),'어느 복지관?');
 check(out.text.includes('2권역 · 오산종합사회복지관'),'correct second zone');
}
{
 const out=result(sample({}, {student:{gender:'미확인',dong:'초평동'}}),'연계기관');
 check(out.text.includes('3권역 · 오산남부종합사회복지관'),'correct third zone');
}
{
 const out=result(sample(),'근거 분석','교사가 학생이 밥을 먹지 못했다고 들었습니다.');
 check(out.audit.discrepancies.includes('경제·주거·기본생활'),'narrative-zero discrepancy');
 check(out.text.includes('점수를 임의 수정하지 말고'),'do not change official score');
}
{
 const out=result(sample(),'현재 안전','학생은 자해 생각이 없다고 말했습니다.');
 assert.equal(out.audit.narrativeSafety,false,'negated safety words not escalated as confirmed');
}
{
 const out=result(sample({3:2,9:2}),'학생의 사정 근거');
 check(out.audit.cross>=1,'reuse cross matrix');
 check(out.text.includes('인과확정 아님'),'noncausal');
}
{
 const out=result(sample({18:3,9:2}),'서비스계획','학생이 동생을 돌보느라 결석했다고 말했습니다.','social-worker');
 check(out.text.includes('사례관리자는 담당·연계·회신을 조정'),'social worker orientation');
}
{
 const out=result(sample({25:1}),'안전확인','');
 check(out.text.includes('피해보호'),'online protection');
}
for(let seed of [20261023,23102026]){
 let z=seed;const rnd=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/2**32);
 for(let k=0;k<2000;k++){
  const p=sample();p.answers=Array.from({length:25},()=>{const v=Math.floor(rnd()*6);return v===5?'unknown':v});
  const prior=JSON.stringify(p),out=result(p,['현재 안전','지역 기관 연결','근거 분석','서비스계획','학생 면담'][k%5],k%2?'상담 중에 우울감을 이야기했습니다.':'');
  assert.equal(JSON.stringify(p),prior,'input mutated');
  assert.ok(out.text.length>120&&out.text.length<15000,'unexpected output length');
  assert.equal(out.audit.raw===null,p.answers.includes('unknown'),'unknown-total invariant');
  assert.ok(!out.text.includes('확률: ')&&!out.text.includes('진단 확정'),'unvalidated prediction prohibited');
 }
 console.log('PASS youth-language-response seed '+seed+' 2000 randomized deterministic simulations');
}
console.log('PASS youth language response safety, unknowns, territories, mismatch, cross patterns, role, immutability');
