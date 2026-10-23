'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const model=require('../docs/youth-risk/personal-ai-model.js');
const criteria=require('../docs/youth-risk/criteria.js');
const sizes=[2,3,3,3,2,2,3,3,2,2];
const sample=()=>({
 answers:Array(25).fill(0),explicit:[],followups:{},
 includedDomains:[3,7],
 domains:sizes.map((n,i)=>({name:'영역 '+(i+1),items:Array.from({length:n},(_,j)=>'실무 평가지표 '+i+'-'+j)}))
});
test('Narrative and all 25 scores are passed into a single review packet',()=>{
 const p=sample();p.answers[8]=2;p.answers[18]=3;
 const t=model.create(p,'teacher','학생이 도움을 요청했다고 실무자가 기록함.',criteria);
 assert.match(t,/학생이 도움을 요청했다고 실무자가 기록함/);
 assert.match(t,/25문항 원자료/);
 assert.match(t,/9번/);
 assert.match(t,/2점/);
 assert.match(t,/19번/);
 assert.match(t,/서비스계획 우선 검토/);
 assert.match(t,/중학교 교사/);
 const second=model.create(p,'social-worker','지원 희망 확인 필요',criteria);
 assert.match(second,/종합사회복지관 사회복지사/);
 assert.match(second,/지원 희망 확인 필요/);
});
test('Unknown and safety flags keep a provisional, urgent safety-first assessment',()=>{
 const p=sample();
 p.answers[0]=1;p.answers[6]='unknown';p.answers[24]=2;
 const t=model.create(p,'teacher','',criteria);
 assert.match(t,/총점.*보류/);
 assert.match(t,/100점 환산 금지/);
 assert.match(t,/안전신호 확인됨/);
 assert.match(t,/미상 문항: 7번/);
 assert.match(t,/안전 신호 문항: 1, 25번/);
 assert.match(t,/7번 .*미상/);
});
test('Common direct identifiers are masked in prompt, but user still must review',()=>{
 const raw='연락처 010-1234-5678, 담당 031-123-4567, 이메일 test@example.com, 주민번호 010101-3123456. 이름은 별도 검토.';
 const safe=model.minimizeIdentifiers(raw);
 assert.doesNotMatch(safe,/010-1234-5678|031-123-4567|test@example.com|010101-3123456/);
 assert.match(safe,/이름은 별도 검토/);
 assert.match(safe,/전화번호 제외/);
 assert.match(safe,/이메일 제외/);
 assert.match(safe,/주민등록번호 제외/);
});
test('Unexpected fields and score distortion rejected',()=>{
 const p=sample();
 assert.equal(model.validate(p),true);
 assert.equal(model.validate({...p,answers:Array(25).fill(5)}),false);
 assert.equal(model.validate({...p,answers:Array(24).fill(0)}),false);
 assert.equal(model.validate({...p,answers:[null,...Array(24).fill(0)]}),false);
 assert.equal(model.validate({...p,domains:[]}),false);
 assert.deepEqual(Object.keys(model.routes).sort(),['chatgpt','claude','gemini']);
});
test('Current site keeps original AI copy and replaces technical pairing with narrative flow',()=>{
 const root=path.join(__dirname,'../docs/youth-risk');
 const main=fs.readFileSync(path.join(root,'assessment.html'),'utf8');
 const panel=fs.readFileSync(path.join(root,'case-examples.html'),'utf8');
 const logic=fs.readFileSync(path.join(root,'personal-ai.js'),'utf8');
 assert.match(main,/id="copyAll"/);
 assert.match(main,/id="copyPacket"/);
 assert.match(panel,/id="studentNarrative"/);
 assert.match(panel,/id="personalAiShare"/);
 assert.match(panel,/id="personalAiResponse"/);
 assert.doesNotMatch(panel,/id="localAiPair"/);
 assert.doesNotMatch(panel,/Start-Osan-AI\.cmd/);
 assert.match(panel,/personal-ai-model\.js/);
 assert.match(logic,/navigator\.share/);
 assert.doesNotMatch(logic,/fetch\(/);
 for(const file of ['personal-ai.js','personal-ai-model.js','case-examples.js']){
  const r=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  assert.equal(r.status,0,file+' syntax: '+r.stderr);
 }
});
