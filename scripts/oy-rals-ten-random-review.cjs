'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../docs/youth-risk');
const Core=require(path.join(root,'criteria.js'));
const Index=require(path.join(root,'integrated-index-v1.js'));
const Gateway=require(path.join(root,'model-gateway-v90.js'));
const CIE=require(path.join(root,'cie-lab-v32/dialogue-v32.js'));
const Engine=require(path.join(root,'cie-lab-v32/engine.js'));
const Adapter=require(path.join(root,'resource-adapter.js'));
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const domains=JSON.parse(app.match(/var domains=(\[[\s\S]*?\]);\s*var routes=/)[1]);
const routes=JSON.parse(app.match(/var routes=(\[[\s\S]*?\]);\s*var answers=/)[1]);
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'../assets/data.js'),'utf8'),context,{timeout:5000});
const directory=Adapter.rows(context.window.WELFARE_DATA);
assert.ok(directory.length>100,'real welfare directory loaded');
let seed=202610261034;
function rng(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function draw(items){return items[Math.floor(rng()*items.length)]}
const modes=['low','school','care','basic','peer','emotion','digital','complex','unknown','quiet'];
for(let i=modes.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[modes[i],modes[j]]=[modes[j],modes[i]];}
const definitions={
 low:{label:'단일 경미',q:{10:[1,2],22:[1]},note:'학생이 미술 활동을 좋아하며 한 과목의 과제 제출에 약간 어려움이 있다고 말했다.'},
 school:{label:'출결 학습 정서',q:{9:[2,3],10:[2,3],11:[1,2],6:[1,2],23:[1]},note:'학생이 최근 지각이 잦아졌고 과제 제출에 어려움을 느낀다고 말했다. 학생은 체육활동을 좋아한다.'},
 care:{label:'돌봄 출결',q:{16:[2,3],18:[2,3],17:[1,2],9:[2],10:[1]},note:'학생이 동생을 돌보느라 늦게 자고 등교에 어려움이 있다고 말했다. 가족지원과 학습 조정을 받고 싶어 한다.'},
 basic:{label:'필수생활 주거',q:{19:[2,3],20:[2,3],21:[1,2],9:[1,2],17:[1]},note:'보호자가 월세가 밀렸다고 말했고 학생은 필요한 물품을 준비하지 못했다고 말했다. 구체적 지원을 원한다.'},
 peer:{label:'또래피해 출결',q:{3:[2,3],4:[1,2],9:[2,3],6:[2],22:[1]},note:'학생이 최근 친구들에게 괴롭힘을 받았고 교실에 들어가기 어렵다고 말했다. 학생은 안전한 이동 동선을 원한다.'},
 emotion:{label:'정서 자해',q:{6:[3,4],7:[2,3],8:[2,3],9:[1,2],23:[1]},note:'학생이 최근 매우 우울하고 자해 생각이 있었다고 말했다. 교사가 학생의 말을 기록했다.'},
 digital:{label:'온라인협박',q:{25:[2,3],24:[2],3:[2],6:[2],9:[1]},note:'학생이 최근 온라인 협박 메시지를 받아 불안하다고 말했다. 또래와의 연락을 피하고 싶어 한다.'},
 complex:{label:'다영역 집중',q:{9:[3,4],10:[3],16:[3],18:[3],19:[3],20:[3],6:[3],3:[2],21:[2],23:[2]},note:'학생은 출결과 학습이 어렵고 가족을 돌보는 시간이 길다고 말했다. 복지관 지원과 학교 학습 조정을 원한다.'},
 unknown:{label:'미상 부분응답',q:{9:[2,3],19:[2],16:[1],10:[1]},unknown:[1,7,20,25],note:'학생의 결석과 준비물 부족은 관찰됐으나 보호 상황에 대한 정보는 아직 없다.'},
 quiet:{label:'저위기 강점',q:{},note:'학생은 운동을 좋아하고 학교생활에 참여하며 담임과 주기적으로 상담을 받고 있다고 말했다.'}
};
const cases=[],flags=[];
for(let i=0;i<modes.length;i++){
 const mode=modes[i],def=definitions[mode],answers=Array(25).fill(0);
 for(const [k,v] of Object.entries(def.q))answers[Number(k)-1]=draw(v);
 for(let j=0;j<25;j++)if(mode!=='quiet'&&answers[j]===0&&![0,1,6,24].includes(j)&&rng()<.10)answers[j]=rng()<.8?1:2;
 for(const n of def.unknown||[])answers[n-1]='unknown';
 const followups={};
 if(answers[3]>=1)followups[4]=draw(['no','unknown']);
 for(const n of [5,12,13])if(answers[n-1]>=3)followups[n]=draw(['no','unknown']);
 const payload={type:'youth-support-data-v1',answers,domains,routes,resources:directory,explicit:[],followups,student:{gender:draw(['남','여','미확인']),dong:draw(['신장1동','신장2동','세마동','중앙동','대원1동'])},caseContext:def.note};
 const before=JSON.stringify(payload.answers);
 try{
 const official=Core.evaluate(answers,[2,3,3,3,2,2,3,3,2,2],false,followups);
 const idx=Index.analyze(payload),a=Gateway.analyze(payload);
 const report=Gateway.text(payload,'사례사정',true);
 const cie=CIE.run(payload,'현재 상황의 핵심 개입 우선순위와 서비스계획 근거를 설명해줘',{engine:Engine,criteria:Core,role:'social-worker'});
 assert.equal(JSON.stringify(payload.answers),before);
 assert.equal(idx.raw,official.knownTotal);
 assert.equal(idx.official.urgent,official.urgent);
 assert.equal(a.decision.knownTotal,official.knownTotal);
 assert.ok(report.includes('사례사정')&&cie.answer.length>20);
 const issues=[],defensives=(report.match(/확인이 필요|확인해야|확인 전|검토가 필요|미확정|가설/g)||[]).length;
 if(idx.unknown&&!idx.safetyFloor&&idx.tier!==null)issues.push('미상인데 5단계 확정');
 if(idx.safetyFloor!==null&&idx.tier<idx.safetyFloor)issues.push('안전 우선단계 역전');
 if(mode==='quiet'&&a.plans.length>0)issues.push('전반적 0점·강점 서술에서 계획 생성');
 if(a.plans.length>8)issues.push('계획이 8개 초과');
 if(idx.complete&&idx.tier!==null&&idx.tier<idx.patternFloor)issues.push('영역 집중도에 비해 지원단계 낮음');
 if(defensives>24)issues.push('방어 문구 과다');
 const result={case:i+1,mode,profile:def.label,dong:payload.student.dong,raw:idx.raw,weighted:idx.weighted,cross:idx.crossScore,narrative:idx.narrative,composite:idx.composite,tier:idx.tier,unknown:idx.unknown,safety:official.urgent,urgentQuestions:official.safetyItems,safetyPending:official.pendingChecks,
 answers:answers.map((v,j)=>({q:j+1,v})).filter(x=>x.v!==0),text:def.note,summary:a.sections[0].text.slice(0,650),opinion:a.sections.find(x=>x.title==='종합사정 및 우선순위').text.slice(0,800),
 cie:cie.answer.slice(0,440),plans:a.plans.slice(0,7).map(p=>({name:p.title,evidence:p.evidence.slice(0,3),action:p.action.slice(0,130),candidates:p.candidates.slice(0,3).map(c=>c.name)})),
 plansTotal:a.plans.length,referrals:a.plans.reduce((n,p)=>n+p.candidates.length,0),defensives,issues};
 cases.push(result);if(issues.length)flags.push({case:i+1,issues});
 }catch(e){flags.push({case:i+1,error:e.stack||String(e)})}
}
const out={seed:202610261034,method:'random draws within ten representative profiles, shuffled order',sourceRows:directory.length,cases,flags};
const dir=path.join(process.cwd(),'artifacts','oy-rals-ten-random-review');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(out,null,2));
const lines=['# OY-RALS synthetic random ten-case review','','Seed: '+out.seed,'Actual welfare directory service rows: '+directory.length,'','|No|Profile|CORE|Tier|Composite|Unknown|Plans|Referral suggestions|Flags|','|--|--|--:|--:|--:|--:|--:|--:|--|'];
for(const c of cases)lines.push('|'+[c.case,c.profile,c.raw,c.tier===null?'—':c.tier,c.composite===null?'—':c.composite,c.unknown,c.plansTotal,c.referrals,c.issues.join(',')||'—'].join('|')+'|');
for(const c of cases){lines.push('','## Case '+c.case+' / '+c.profile,'','Synthetic narrative: '+c.text,'','Observed answers: '+c.answers.map(x=>'Q'+x.q+'='+x.v).join(' '),'','Student summary: '+c.summary,'','Integrated opinion: '+c.opinion,'','CIE response: '+c.cie,'','Proposed plan: '+c.plans.map(x=>x.name+' / '+x.action+' / '+x.candidates.join(', ')).join('; '),'','Flags: '+(c.issues.join(', ')||'No automated flags'));}
fs.writeFileSync(path.join(dir,'report.md'),lines.join('\n'));
console.log('OY10_REPORT_BEGIN');
console.log(JSON.stringify({seed:out.seed,sourceRows:out.sourceRows,count:cases.length,cases:cases.map(c=>({id:c.case,profile:c.profile,raw:c.raw,tier:c.tier,composite:c.composite,unknown:c.unknown,safety:c.safety,planCount:c.plansTotal,referrals:c.referrals,defensives:c.defensives,issues:c.issues,summary:c.summary.slice(0,235),opinion:c.opinion.slice(0,350),plans:c.plans.slice(0,3)})),flags}));
console.log('OY10_REPORT_END');
if(cases.length!==10)process.exitCode=1;
