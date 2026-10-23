const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const kb=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/youth-risk/data/response-knowledge-600-v1.json'),'utf8'));
assert.equal(kb.schema,'OY-RALS-research-response-KB-v1');
assert.equal(kb.version,'2026-10-23-v1.0');
assert.equal(kb.recordCount,600);
assert.equal(kb.items.length,25);
assert.equal(kb.rules.length,24);
assert.equal(kb.entries.length,600);
assert.equal(kb.sources.length,23);
const ids=new Set(kb.entries.map(x=>x.id));
assert.equal(ids.size,600);
const I=kb.entries.filter(x=>x.kind==='item'),P=kb.entries.filter(x=>x.kind==='cross'),M=kb.entries.filter(x=>x.kind==='method');
assert.equal(I.length,450);assert.equal(P.length,120);assert.equal(M.length,30);
for(let i=1;i<=25;i++)for(const score of ['0','1','2','3','4','unknown'])for(const perspective of ['S','T','A']){
 const key='I'+String(i).padStart(2,'0')+'-'+score+'-'+perspective;
 const r=I.find(x=>x.id===key);
 assert.ok(r,key);assert.equal(r.item,i);assert.equal(r.score,score);
 assert.equal(r.evidenceStatus,'untested_hypothesis');
 assert.ok(r.reviewQuestion&&r.teacherAnswer&&r.caseManagerAnswer&&r.avoid);
 if([1,2,7,25].includes(i))assert.equal(r.safetyIndependent,true);
 if(score==='unknown')assert.match(r.interpretation,/미확인|보류/);
}
for(let i=1;i<=24;i++)for(const state of ['0','1','2','3','unknown']){
 const k='P'+String(i).padStart(2,'0')+'-'+state;
 assert.ok(ids.has(k),k);
}
for(const rec of kb.entries){
 assert.ok(rec.interpretation&&!rec.interpretation.includes('NaN'),'missing interpretation '+rec.id);
 if(rec.sources)for(const key of rec.sources)assert.ok(kb.sources.some(s=>s.id===key),'source not found '+key);
}
global.fetch=async()=>({ok:true,json:async()=>kb});
global.YouthEvidenceMatrix=require('../docs/youth-risk/evidence-matrix.js');
const api=require('../docs/youth-risk/response-knowledge-integration.js');
async function run(){
 const p={answers:Array(25).fill(0),explicit:[],followups:{}};
 p.answers[2]=2;p.answers[8]=2;p.answers[6]='unknown';
 const prior=JSON.stringify(p);
 const out=await api.enrich({text:'기본 모델 판단',intent:'evidence',audit:{cross:1}},p,'teacher');
 assert.equal(JSON.stringify(p),prior,'official assessment changed');
 assert.ok(out.text.startsWith('기본 모델 판단'),'base explanation modified');
 assert.match(out.text,/심층 연구형 해석/);assert.match(out.text,/I03-2-T/);assert.match(out.text,/I07-unknown-T/);
 assert.match(out.text,/교차사정 가설/);
 assert.equal(out.knowledgeRecords,600);
 const social=await api.enrich({text:'원 사정',intent:'plan'},p,'social-worker');
 assert.match(social.text,/I03-2-A/);assert.ok(social.text.startsWith('원 사정'));
 let z=20261023;const next=()=>((z=Math.imul(z,1664525)+1013904223>>>0)/2**32);
 for(let t=0;t<250;t++){
  const a=Array.from({length:25},()=>{const q=Math.floor(next()*6);return q===5?'unknown':q});
  const input={answers:a,explicit:[],followups:{}};
  const before=JSON.stringify(input),y=await api.enrich({text:'기존 판정',intent:t%3?'overview':'resource'},input,t%2?'teacher':'social-worker');
  assert.equal(JSON.stringify(input),before,'mutation in case '+t);
  assert.ok(y.text.startsWith('기존 판정'));
  assert.ok(y.text.length<18000,'overly verbose in case '+t);
  assert.ok(y.text.includes('기존 통합사례관리 모델'));
 }
 console.log('PASS 600 KB records, score-vantage coverage, 24 cross patterns, 23 sources, immutability, 250 synthetic inputs');
}
run().catch(e=>{console.error(e);process.exit(1)});
