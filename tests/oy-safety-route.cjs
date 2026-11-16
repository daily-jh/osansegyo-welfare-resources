'use strict';
/* 오늘의 즉시 대응·주관 규칙(2026-11-16 지훈 결정). 가상 응답만 쓴다.
   - 해당하는 안전 신호마다 대응을 모두 싣는다. 학대·방임 의심이 맨 앞, 그다음은 점수 높은 신호부터.
   - 해바라기센터·마주봄센터는 25번일 때만. 4번은 현재 위험 추가확인이 「예」일 때만 오늘의 대응에 싣고 경찰·학교폭력 절차로 간다.
   - 핵심 결과 한 장의 오늘 연락처와 같은 신호를 가리킨다. 단계·개입 수준·선정은 바꾸지 않는다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const OD=require(path.join(SRC,'oy-decision-v1.js')),OP=require(path.join(SRC,'oy-onepage-v1.js')),D=require(path.join(SRC,'oy-deep-interpretation-v1.js'));
const mk=(set,followups)=>{const a=Array(25).fill(0);Object.entries(set).forEach(([n,v])=>{a[n-1]=v});return {type:'youth-support-data-v1',answers:a,domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],explicit:[],followups:followups||{},caseContext:'',flowRevision:1}};
const view=p=>{const R=OD.resolve(p),m=OP.model(p,'teacher');return {R,imm:R.deep.casework.immediate||'',lead:R.lead,kinds:m.contacts.map(c=>c.id)}};
{const v=view(mk({7:3,4:2}));
 assert.match(v.imm,/당일 안전 면담/,'self-harm leads the immediate response');assert.doesNotMatch(v.imm+v.lead,/해바라기|마주봄/,'no sexual-violence centre without item 25');
 assert.match(v.lead,/정신건강복지센터/);assert.deepEqual(v.kinds,['selfharm']);}
{const v=view(mk({4:2},{4:'no'}));
 assert.equal(v.imm,'','item 4 without confirmed current risk has no immediate response');assert.match(v.R.cells[0].value,/안전 신호 없음/);assert.match(v.lead,/학교/);assert.deepEqual(v.kinds,[]);}
{const v=view(mk({4:2},{4:'yes'}));
 assert.match(v.imm,/학교폭력 사안 절차/);assert.doesNotMatch(v.imm,/해바라기/);assert.ok(v.R.urgent);assert.deepEqual(v.kinds,['coercion'],'summary page shows the police contact too');}
{const v=view(mk({7:2,25:1}));
 assert.ok(v.imm.indexOf('당일 안전 면담')<v.imm.indexOf('해바라기센터')&&v.imm.indexOf('해바라기센터')>0,'both signals listed, higher score first');assert.deepEqual(v.kinds.sort(),['selfharm','sexual']);}
{const v=view(mk({25:3,7:1}));
 assert.ok(v.imm.indexOf('해바라기센터')<v.imm.indexOf('당일 안전 면담'),'higher score first');assert.match(v.lead,/해바라기센터/);}
{const v=view(mk({7:4,1:1}));
 assert.ok(v.imm.indexOf('아동학대 신고')===0||v.imm.indexOf('아동학대 신고')<v.imm.indexOf('당일 안전 면담'),'suspected abuse always first');assert.match(v.lead,/아동학대전담공무원/);assert.match(v.imm,/당일 안전 면담/);}
assert.equal(D.safetyRoute(()=>false,false),null);
console.log('oy-safety-route: ok');
