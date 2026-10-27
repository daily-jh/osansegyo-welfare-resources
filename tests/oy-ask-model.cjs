'use strict';
/* Ask panel contract: quick answers come from the deep interpretation, prompts stay short and scale-only by default,
   and the panel never sends data on its own. Virtual responses only. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'..','docs','youth-risk');
const D=require(path.join(dir,'oy-deep-interpretation-v1.js')),M=require(path.join(dir,'oy-ask-model-v1.js'));
const panel=fs.readFileSync(path.join(dir,'oy-ask-panel-v1.js'),'utf8'),page=fs.readFileSync(path.join(dir,'index.html'),'utf8');

const base=[0,0,1,2,0,3,2,0,1,3,3,2,0,1,2,1,0,3,2,3,1,0,1,2,0];
const r=D.build({answers:base});

// Every FAQ answers from the report, and every section offers at most four questions.
for(const f of M.FAQ){const a=M.answer(r,f.id);assert.ok(a.text.length>20,f.id+' empty');assert.ok(!/\d+번 \d점/.test(a.text),f.id+' leaks item scores into the body');}
for(const k of ['critical','understanding','compare','patterns','plan','questions','report','unknown'])assert.ok(M.faqFor(k).length>=3&&M.faqFor(k).length<=4,k);
assert.throws(()=>M.answer(r,'nope'),/ASK_FAQ_UNKNOWN/);
assert.match(D.sectionText(r,'questions'),/학생의 목소리/);
assert.equal(D.sectionText(r,'nope'),'');

// Section prompt: short, rules present, no item scores unless evidence is chosen.
const sec=M.prompt({mode:'section',r,section:'patterns',sectionTitle:'척도 해석 · 문제 유지 고리',sectionText:D.sectionText(r,'patterns'),question:'담임에게 어떻게 설명할까요?'});
assert.ok(sec.length<4000,'section prompt too long: '+sec.length);
for(const must of ['CORE 점수와 안전 판단은 바꾸지 마세요','미상은 0점이 아닙니다','진단명','[질문]','담임에게 어떻게 설명할까요?'])assert.ok(sec.includes(must),must);
assert.ok(!/\d+번 [^\n]*: \d점/.test(sec),'no 25-item scores by default');
const ev=M.prompt({mode:'section',r,section:'patterns',sectionText:'x',includeEvidence:true});
assert.match(ev,/6번 [^\n]+: 3점/);
assert.match(M.prompt({mode:'section',r,section:'compare',sectionText:''}),/제외했습니다/);

// Document prompt: task template and the full report text.
const doc=M.prompt({mode:'document',r,task:'plan'});
assert.ok(doc.includes('서비스계획서를 작성해 주세요')&&doc.includes('[해석지 본문]')&&doc.includes('25문항 응답'));
assert.ok(doc.includes('전체이며'));

// The model never reads caseContext: a narrative on the payload does not change the prompt.
const secret='비밀서술문장XYZ';
const withNarr=D.build({answers:base,caseContext:secret});
assert.ok(!M.prompt({mode:'document',r:withNarr}).includes(secret),'narrative must not enter a scale-only prompt');

// Redaction hook is applied last.
assert.equal(M.prompt({mode:'section',r,sectionText:'a',redact:()=>'R'}),'R');

// Random responses: answers and prompts build for any valid input, including unknowns.
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<500;i++){
 const ans=base.map(()=>rnd()<0.08?'unknown':Math.floor(rnd()*5));
 const rr=D.build({answers:ans});
 M.FAQ.forEach(f=>M.answer(rr,f.id));
 assert.ok(M.prompt({mode:'section',r:rr,section:'plan',sectionText:D.sectionText(rr,'plan')}).length<6000);
}

// Panel source: no automatic sending or storage, AI links carry no case data, opt-in gates present.
assert.ok(!/\b(?:localStorage|sessionStorage|sendBeacon|XMLHttpRequest|WebSocket)\b|fetch\(/.test(panel),'panel must not send or store data');
for(const u of panel.match(/https:\/\/[^'"]+/g))assert.ok(!/[?#]/.test(u),'AI link must not carry data: '+u);
for(const part of ["caseContext:''",'oy-ask-ok','oy-ask-narr','narrativePresent()','redact'])assert.ok(panel.includes(part),'panel missing '+part);
assert.ok(panel.includes("querySelector('.oy-ask-text').textContent=a.text")&&!panel.includes('innerHTML=saved'),'quick answers are rendered as text and pasted answers are never written back into the page');
assert.ok(!panel.includes('oy-ask-collection'),'the 05 AI workshop collection is retired');
new vm.Script(panel,{filename:'oy-ask-panel-v1.js'});

// Page wiring: the panel replaces the in-flow OY-CIE dialogue and the bottom handoff panel.
const scripts=[...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1].split('?')[0]);
const at=n=>scripts.indexOf(n);
for(const n of ['oy-ask-model-v1.js','oy-ask-panel-v1.js'])assert.ok(at(n)>=0,n+' not loaded');
assert.ok(at('oy-deep-interpretation-v1.js')<at('oy-ask-model-v1.js')&&at('oy-ask-model-v1.js')<at('oy-ask-panel-v1.js')&&at('journey-v88.js')<at('oy-ask-panel-v1.js'));
for(const n of ['cie-flow-v32.js','ai-workbench-stage-v1.js','practice-handoff-ui-v1.js','cie-lab-v32/dialogue-v32.js'])assert.ok(at(n)<0,n+' should no longer load on the main page');
assert.ok(page.includes('oy-ask-panel-v1.css?'));
console.log('oy-ask-model: ok '+M.FAQ.length+' quick answers, section/document prompts, 500 random cases, panel privacy contract');
