'use strict';
/* 무작위 가상 400사례(시드 202610281100, 실제 사례 아님)로 판정 사슬의 논리를 확인한다. 2026-10-28 평가에서 나온 규칙:
   - 한 장·05·판정 사슬의 단계는 같다.
   - ④ 개입 수준은 ③ 지원 우선순위보다 낮지 않다(3→일반 사례관리, 4→집중, 5→위기개입).
   - 문항 점수를 올려도 단계·개입 수준·통합사례관리 선정이 내려가지 않는다(척도가 서술 단서를 확인해도 마찬가지).
   - 부정·과거·제3자 서술은 단계나 안전 단서를 만들지 않는다.
   - 4단계 이상이거나 오늘 확인할 안전 사유가 있으면 담임 한 장의 할 일에 시점(오늘·지금)이 있다.
   - 척도 안전 응답이 있으면 첫 개입이 시점으로 시작한다. ④가 미확정이면 ⑤ 선정은 잠정이다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
global.window=globalThis;
const SRC=path.join(__dirname,'../docs/youth-risk');
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains'),routes=grab('routes');
const OD=require(path.join(SRC,'oy-decision-v1.js'));
const ONE=require(path.join(SRC,'oy-onepage-v1.js'));
const FR=require(path.join(SRC,'oy-final-report-v1.js'));
const EXP=['현재 자해·자살 시도 또는 구체적인 실행 계획·수단이 확인됨','아동학대·성폭력이 의심됨 (즉각적 위해 여부와 무관하게 신고의무 확인)'];
const payload=c=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],
  explicit:(c.explicit||[]).map(i=>EXP[i]||EXP[0]),followups:{...(c.followups||{})},caseContext:c.narrative||'',grade:c.grade||''});
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const GRADES=['초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];
// 서술 조각: [문장, 종류]
const NARR={
 pos:['최근 팔에 그은 상처가 보여 보건실에서 확인함.','학생이 "죽고 싶다"고 말했고 약을 모아 두었다고 함.','아버지가 때려서 멍이 들었다고 학생이 직접 말함.','저녁을 거의 굶고 혼자 지낸다고 함.','모르는 성인이 사진을 보내라고 협박한다고 함.','2주째 학교에 나오지 않음.','친구들이 단톡방에서 계속 놀린다고 함.','밤새 게임을 해서 수업 중 잠을 잠.','어머니가 우울증으로 누워 지내 동생을 돌본다고 함.','집에 전기가 끊겼다고 함.'],
 neg:['자해 흔적은 확인되지 않음.','죽고 싶다는 말은 한 적 없다고 함.','맞은 적은 없다고 함.','특별한 안전 문제는 보이지 않음.'],
 hist:['초등학교 때 학교폭력 피해가 있었으나 지금은 해결됨.','작년에 자해한 적이 있으나 최근에는 없다고 함.'],
 third:['친구가 자해를 한다며 걱정함.','사촌이 가출했다는 이야기를 함.'],
 str:['그림 그리기를 좋아하고 담임과 관계가 좋음.','축구부 활동을 꾸준히 함.','할머니가 잘 챙겨 줌.']
};
// 유형: 문항 묶음
const TYPES={
 calm:[], learning:[10,14,9,11], peer:[3,6,11,22], neglect:[2,16,19,15,10], abuse:[1,17,6,23], selfharm:[7,6,8,17,22],
 digital:[24,25,6,9], family:[17,18,16,6], poverty:[19,20,21,15], conduct:[5,12,13,9,17], multi:[6,9,10,17,19,22,3,16], isolate:[22,11,6,23]
};
function gen(n,seed){const r=rng(seed),pick=a=>a[Math.floor(r()*a.length)],out=[];const keys=Object.keys(TYPES);
 for(let i=0;i<n;i++){
  const type=pick(keys),a=Array(25).fill(0);
  // 배경 잡음
  for(let k=0;k<25;k++){const x=r();a[k]=x<0.72?0:x<0.9?1:x<0.97?2:3;}
  // 안전 문항은 배경 잡음을 줄임
  for(const s of [1,2,7,25])if(r()<0.85)a[s-1]=0;
  const hi=r()<0.5?3:r()<0.5?2:4;
  for(const it of TYPES[type]){const x=r();a[it-1]=Math.max(a[it-1],x<0.25?hi:x<0.6?Math.max(1,hi-1):x<0.85?Math.max(1,hi-2):0);}
  // 미상
  const unkMode=r();if(unkMode<0.25){const m=1+Math.floor(r()*4);for(let j=0;j<m;j++)a[Math.floor(r()*25)]='unknown';}
  const explicit=r()<0.06?[Math.floor(r()*2)]:[];
  const followups={};for(const f of [4,5,12,13]){const v=a[f-1];if(typeof v==='number'&&v>=(f===4?1:3)){const x=r();if(x<0.4)followups[f]='no';else if(x<0.55)followups[f]='yes';else if(x<0.7)followups[f]='unknown';}}
  let narrative='';const nm=r();if(nm>0.35){const parts=[];const cnt=1+Math.floor(r()*4);for(let j=0;j<cnt;j++){const kind=pick(['pos','pos','neg','neg','hist','third','str','str']);parts.push(pick(NARR[kind]));}narrative='담임 관찰 기록. '+[...new Set(parts)].join(' ');}
  out.push({id:'R'+String(i+1).padStart(3,'0'),type,grade:pick(GRADES),gender:r()<0.5?'남':'여',answers:a,explicit,followups,narrative});
 }return out;}
const quiet=f=>{const l=console.log,w=console.warn;console.log=console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
const run=c=>quiet(()=>OD.resolve(payload(c)));
const LV=['monitor','brief','general','intensive','crisis'],SELO=['not','check','review','met'],FLOOR={3:2,4:3,5:4};
const cases=gen(400,202610281100),bad=[];
const fail=(k,id,x)=>bad.push(k+' '+id+(x?' '+x:''));
for(const c of cases){
  const p=payload(c),R=run(c),k=quiet(()=>FR.model(p,{})),m=quiet(()=>ONE.model(p,'teacher'));
  if(k.tier!==R.tier||m.tier!==R.tier)fail('단계 불일치',c.id);
  if(R.tier>=3&&LV.indexOf(R.level.id)<FLOOR[R.tier])fail('④<③',c.id,R.tier+' '+R.level.id);
  const steps=m.steps.join(' '),today=R.tier>=4||R.pending.length||R.narrSafety.length||R.safetyOpen.length;
  if((R.urgent||today)&&!/오늘|지금|바로/.test(steps))fail('담임 시점 없음',c.id);
  if(R.urgent&&!/^(?:지금 바로|오늘)/.test(k.first))fail('첫 개입 시점 없음',c.id,k.first.slice(0,30));
  if(R.levelOpen&&R.selection.status==='met'&&!R.selection.provisional)fail('④ 미확정인데 ⑤ 확정',c.id);
  if(R.urgent&&!/안전/.test(R.pathway))fail('안전인데 진행체계',c.id);
}
for(const c of cases.slice(0,200)){
  const b=run(c);
  for(let i=0;i<25;i++){const v=c.answers[i];if(typeof v!=='number'||v>=4)continue;
    const a=c.answers.slice();a[i]=v+1;const R=run({...c,answers:a}),at='Q'+(i+1)+' '+v+'→'+(v+1);
    if(b.tier!=null&&R.tier!=null&&R.tier<b.tier)fail('단계 하락',c.id,at);
    if(b.tier!=null&&R.tier==null)fail('단계 미확정으로',c.id,at);
    if(LV.indexOf(R.level.id)<LV.indexOf(b.level.id))fail('개입 수준 하락',c.id,at+' '+b.level.id+'→'+R.level.id);
    if(SELO.indexOf(R.selection.status)<SELO.indexOf(b.selection.status)&&!(b.selection.status==='review'&&R.selection.status==='check'))fail('선정 약해짐',c.id,at);
  }
}
const harmless=['자해 흔적은 확인되지 않음.','죽고 싶다는 말은 한 적 없다고 함.','작년에 자해한 적이 있으나 최근에는 없다고 함.','친구가 자해를 한다며 걱정함.','맞은 적은 없다고 함.',
  '친구가 집에서 맞는다고 걱정함.','사촌이 가출했다는 이야기를 함.','옆 반 학생이 따돌림을 당한다고 이야기함.'];
for(const c of cases.slice(0,150)){const b=run({...c,narrative:''});
  for(const h of harmless){const R=run({...c,narrative:'담임 관찰 기록. '+h});
    if((R.tier||0)>(b.tier||0)||R.narrSafety.length||LV.indexOf(R.level.id)>LV.indexOf(b.level.id))fail('무해 서술로 상향',c.id,h);}}
for(const c of cases){const ks=[4,5,12,13].filter(f=>{const v=c.answers[f-1];return typeof v==='number'&&v>=(f===4?1:3)});if(!ks.length)continue;
  const y=run({...c,followups:Object.fromEntries(ks.map(f=>[f,'yes']))}),n=run({...c,followups:Object.fromEntries(ks.map(f=>[f,'no']))}),u=run({...c,followups:{}});
  if(y.tier!==5)fail('추가확인 예≠5',c.id);
  if(n.tier!=null&&u.tier!=null&&n.tier>u.tier)fail('추가확인 아니오>미확인',c.id);}
assert.deepEqual(bad.slice(0,20),[],bad.length+' 건');
console.log('oy-random400-regression ok',cases.length);
