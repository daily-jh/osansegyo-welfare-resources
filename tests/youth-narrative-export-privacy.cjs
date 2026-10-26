/* Narrative-derived text must not leave the result screen (TXT, print, AI prompt) unless the practitioner opts in. Synthetic data only. */
const fs=require('node:fs'),path=require('node:path'),A=require('node:assert/strict');
const G=require('../docs/youth-risk/model-gateway-v90.js'),F=require('../docs/youth-risk/integrated-index-v1.js');
const ui=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/journey-v88.js'),'utf8');

// UI contract: result export analyses a narrative-free payload unless the opt-in box is checked.
const exportFn=ui.slice(ui.indexOf('function resultExport'),ui.indexOf('function exportText'));
A.ok(exportFn.length>0,'resultExport must exist');
A.match(exportFn,/const p=includeRaw\?state\.payload:privatePayload\(state\.payload\)/,'export payload must drop narrative by default');
A.doesNotMatch(exportFn,/const p=state\.payload/,'export must not read the raw payload directly');
A.match(exportFn,/서술 기반 해석은 기본 출력에서 제외했습니다/,'narrative tab must say narrative was excluded');
// Print: a model failure must fall back to the text report instead of breaking the button.
const printFn=ui.slice(ui.indexOf('function print('),ui.indexOf("window.addEventListener('afterprint'"));
A.match(printFn,/try\{handoff=/,'structured print must be guarded');

// Model contract the export relies on: a narrative-free payload yields no narrative-derived content.
const sizes=[2,3,3,3,2,2,3,3,2,2];
const p={answers:Array(25).fill(0),domains:sizes.map((n,i)=>({name:'영역'+i,items:Array(n).fill('문항')})),routes:sizes.map(()=>[]),resources:[],explicit:[],followups:{},caseContext:''};
p.answers[18]=3;p.answers[20]=2;p.answers[5]=1;
const narrative='가상기관복지관 통합사례관리 서비스를 이용 중. 친구 간 갈등이 있음. 현재 자해 생각을 말함.';
const withText={...p,caseContext:narrative},safe={...withText,caseContext:''};
const full=G.analyze(withText),stripped=G.analyze(safe);
A.ok(full.context.hasContext,'fixture narrative must be recognised when included');
A.equal(stripped.context.hasContext,false,'stripped payload must carry no narrative');
A.equal((stripped.context.signals||[]).length,0,'stripped payload must yield no narrative signals');
A.equal(stripped.kCarr,null,'K-CARR must not run without narrative');
const dump=JSON.stringify({sections:stripped.sections,plans:stripped.plans,mismatches:stripped.context.mismatches});
for(const phrase of ['가상기관복지관','친구 간 갈등','자해 생각'])A.ok(!dump.includes(phrase),'narrative phrase leaked: '+phrase);
const ix=F.analyze(safe);
A.equal(ix.narrativeAvailable,false,'SUPPORT-5 must not use narrative in default export');
A.equal(ix.narrative,null);
// Official score is identical with or without narrative.
A.equal(stripped.decision.knownTotal,full.decision.knownTotal);
A.deepEqual(stripped.decision.safetyItems,full.decision.safetyItems);
// Redacted payload: no wording leaves, but a current safety cue still sets the safety floor.
const N=require('../docs/youth-risk/oy-narrative-interpretation-v1.js');
const red=N.redact(withText);
A.equal(red.caseContext,'');
const redDump=JSON.stringify(red.narrativeRedacted);
for(const phrase of ['가상기관복지관','친구 간 갈등','자해 생각','현재'])A.ok(!redDump.includes(phrase),'redacted summary leaked wording: '+phrase);
A.ok(red.narrativeRedacted.stage&&red.narrativeRedacted.safety.some(x=>x.n===7));
const rix=F.analyze(red);
A.ok(rix.tier>=4,'narrative safety cue must survive the default export');
A.equal(rix.narrativeAvailable,false,'redacted payload still adds no narrative score');
const I=N.integrate(red),txt=N.integratedText(I);
A.ok(!/서술기록이 입력되지 않아/.test(txt),'must not claim the narrative was absent');
A.ok(/원문을 제외/.test(txt)&&/자해·죽음 관련 안전 신호/.test(txt));
for(const phrase of ['가상기관복지관','친구 간 갈등','자해 생각'])A.ok(!txt.includes(phrase),'integrated text leaked: '+phrase);
console.log('narrative export privacy contract: ok');
