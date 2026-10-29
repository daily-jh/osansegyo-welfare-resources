'use strict';
/* 무작위 가상 500사례(시드 202610290230, 실제 사례 아님)와 처음 보는 서술 말투 28문장으로 서술 읽기를 확인한다. 2026-10-29 평가에서 나온 규칙:
   - 학생 본인의 성적 위해·자해 흔적 가리기·투신 위험 장소·온라인에서 만난 사람 만나기·가출·외박은 서술에만 있어도 안전 단서가 된다.
   - 가정 안 성인의 성적 위해 진술과 오늘 옥상 난간에 선 행동은 5단계(당일 안전 확보)다(지훈 결정 2026-10-29).
   - 과거('중1 때 …, 지금은 안정적')·다른 학생('옆 반 학생이 …')·가족의 가출은 단계나 안전 단서를 만들지 않는다.
   - 한 장의 보호자 문장은 잘리지 않는다('보호자에게 먼저 연락하지 않고…'가 남는다).
   - 서술이 있는데 읽은 안전 단서가 없으면 한 장에 그렇다고 적는다.
   - 한 장·판정 사슬 단계가 같고, 5단계·안전 신호면 112 안내가 있다. */
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
const payload=c=>({type:'youth-support-data-v1',answers:c.answers.slice(),domains:domains.map(d=>({name:d.name,items:d.items.slice(),hints:d.hints.slice()})),routes,resources:[],student:{gender:'미확인',dong:'',...(c.grade?{grade:c.grade}:{})},
  explicit:(c.explicit||[]).map(i=>EXP[i]||EXP[0]),followups:{...(c.followups||{})},caseContext:c.narrative||''});
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const GRADES=['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];
// 새 표현(이전 400사례에 없던 말투) — 학생 본인 일
const NARR={
 pos:['손목에 밴드를 붙이고 다니고 긴팔만 입음.','옥상에 올라가 있는 것을 다른 선생님이 봄.','공책에 유서 같은 글을 써 둠.','엄마 남자친구가 몸을 만진다고 보건교사에게 말함.','삼촌이 술 마시면 때린다고 함.','며칠째 같은 옷을 입고 씻지 않은 채 등교함.','SNS에서 만난 오빠를 만나러 간다고 함.','밤에 집을 나가 친구 집을 전전한다고 함.','전학 온 뒤로 급식을 혼자 먹고 쉬는 시간마다 엎드려 있음.','수업 시간에 갑자기 울면서 숨쉬기 힘들다고 함.','휴대폰 소액결제로 수십만 원 빚이 생겼다고 함.','편의점에서 물건을 훔치다 걸린 적이 있음.','담배 냄새가 나고 쉬는 시간마다 사라짐.','아빠가 실직해서 급식비가 밀렸다고 함.','엄마가 한국어를 잘 못해 가정통신문을 못 읽는다고 함.','동생을 돌보느라 학원과 숙제를 못 한다고 함.'],
 neg:['자해는 하지 않는다고 분명히 말함.','집에서 맞거나 혼나는 일은 없다고 함.','지금은 죽고 싶은 마음이 없다고 함.','성적인 일은 없었다고 함.'],
 hist:['중1 때 자해로 상담받은 적이 있고 지금은 안정적임.','어릴 때 아동보호전문기관 개입이 있었으나 종결됨.'],
 third:['반 친구가 집에서 맞는 것 같다며 걱정함.','형이 가출해서 집 분위기가 안 좋다고 함.','옆 반 학생이 자해 사진을 올렸다고 알려 줌.'],
 str:['방송부 활동을 좋아하고 성실함.','이모가 주말마다 챙겨 줌.','수학을 잘해서 친구들에게 알려 줌.']
};
const TYPES={
 calm:[], learning:[10,14,9,11], peer:[3,6,11,22], neglect:[2,16,19,15,10], abuse:[1,17,6,23], selfharm:[7,6,8,17,22],
 digital:[24,25,6,9], family:[17,18,16,6], poverty:[19,20,21,15], conduct:[5,12,13,9,17], multi:[6,9,10,17,19,22,3,16], isolate:[22,11,6,23],
 lowall:'L', unkheavy:'U'
};
function gen(n,seed){const r=rng(seed),pick=a=>a[Math.floor(r()*a.length)],out=[];const keys=Object.keys(TYPES);
 for(let i=0;i<n;i++){
  const type=pick(keys),a=Array(25).fill(0);
  for(let k=0;k<25;k++){const x=r();a[k]=x<0.72?0:x<0.9?1:x<0.97?2:3;}
  for(const s of [1,2,7,25])if(r()<0.85)a[s-1]=0;
  if(TYPES[type]==='L'){for(let k=0;k<25;k++)a[k]=r()<0.6?1:0;for(const s of [1,2,7,25])a[s-1]=0;}
  else if(TYPES[type]==='U'){for(let k=0;k<25;k++)if(r()<0.4)a[k]='unknown';}
  else{const hi=r()<0.5?3:r()<0.5?2:4;
   for(const it of TYPES[type]){const x=r();a[it-1]=Math.max(a[it-1],x<0.25?hi:x<0.6?Math.max(1,hi-1):x<0.85?Math.max(1,hi-2):0);}
   const unkMode=r();if(unkMode<0.25){const m=1+Math.floor(r()*4);for(let j=0;j<m;j++)a[Math.floor(r()*25)]='unknown';}}
  const explicit=r()<0.06?[Math.floor(r()*2)]:[];
  const followups={};for(const f of [4,5,12,13]){const v=a[f-1];if(typeof v==='number'&&v>=(f===4?1:3)){const x=r();if(x<0.4)followups[f]='no';else if(x<0.55)followups[f]='yes';else if(x<0.7)followups[f]='unknown';}}
  let narrative='';const nm=r();if(nm>0.3){const parts=[];const cnt=1+Math.floor(r()*4);for(let j=0;j<cnt;j++){const kind=pick(['pos','pos','pos','neg','neg','hist','third','str','str']);parts.push(pick(NARR[kind]));}narrative='담임 관찰 기록. '+[...new Set(parts)].join(' ');}
  out.push({id:'S'+String(i+1).padStart(3,'0'),type,grade:pick(GRADES),gender:r()<0.5?'남':'여',answers:a,explicit,followups,narrative});
 }return out;}
const quiet=f=>{const l=console.log,w=console.warn;console.log=console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
const run=c=>quiet(()=>OD.resolve(payload(c)));
const zero=Array(25).fill(0);
// 1) 문장 하나씩: 0점 응답에 서술 한 문장만 넣는다.
const SAFE_CUE=[['엄마 남자친구가 몸을 만진다고 보건교사에게 말함.',5],['삼촌이 몸을 더듬는다고 말함.',5],['오늘 점심시간에 옥상 난간에 서 있는 모습이 발견됨.',5],
 ['손목에 밴드를 붙이고 다니고 긴팔만 입음.',4],['옥상에 올라가 있는 것을 다른 선생님이 봄.',4],['SNS에서 만난 오빠를 만나러 간다고 함.',4],['밤에 집을 나가 친구 집을 전전한다고 함.',4],
 ['친구가 몸을 만져서 싫다고 함.',4],['학생이 어제 가출했다고 함.',4],['손목에 붕대를 감고 옴.',4],['공책에 유서 같은 글을 써 둠.',5],['삼촌이 술 마시면 때린다고 함.',4]];
const NO_CUE=['중1 때 자해로 상담받은 적이 있고 지금은 안정적임.','옆 반 학생이 자해 사진을 올렸다고 알려 줌.','옆 반 학생이 옥상에 올라갔다고 알려 줌.','형이 가출해서 집 분위기가 안 좋다고 함.',
 '엄마가 집을 나가서 할머니와 지냄.','반 친구가 집에서 맞는 것 같다며 걱정함.','자해는 하지 않는다고 분명히 말함.','집에서 맞거나 혼나는 일은 없다고 함.','지금은 죽고 싶은 마음이 없다고 함.',
 '성적인 일은 없었다고 함.','몸을 만진 적은 없다고 함.','예전에 성추행 피해가 있었으나 지금은 괜찮음.','팔에 밴드를 붙이고 있음.','체육 시간에 다리를 다쳐 밴드를 붙임.','방송부 활동을 좋아하고 성실함.'];
for(const [t,tier] of SAFE_CUE){const R=run({answers:zero,narrative:'담임 관찰 기록. '+t});
 assert.ok(R.narrSafety.length,'안전 단서를 읽어야 함: '+t);assert.strictEqual(R.tier,tier,t+' 단계 '+R.tier+' (기대 '+tier+')');
 assert.notStrictEqual(R.cells[0].tone,'ok','① 안전 칸이 \'신호 없음\'이면 안 됨: '+t);}
for(const t of NO_CUE){const R=run({answers:zero,narrative:'담임 관찰 기록. '+t});
 assert.strictEqual(R.narrSafety.length,0,'안전 단서가 생기면 안 됨: '+t+' → '+R.narrSafety.join('·'));assert.strictEqual(R.tier,1,t+' 단계 '+R.tier);}
// 2) 무작위 500사례
const cases=gen(500,202610290230);
const RISK=NARR.pos.slice(0,8),HARMLESS=[...NARR.neg,...NARR.hist,...NARR.third];
let narr=0,note=0,fam=0;
for(const c of cases){const p=payload(c),R=run(c);
 if(RISK.some(s=>c.narrative.includes(s)))assert.ok(R.urgent||R.narrSafety.length||R.pending.length,c.id+' 서술 위험 문장을 놓침');
 for(const role of ['',...Object.keys(ONE.SCOPE)]){const m=quiet(()=>ONE.model(p,role)),h=ONE.html(m);
  assert.strictEqual(m.tier,R.tier,c.id+'/'+role+' 한 장 단계≠사슬');
  if(R.urgent||R.tier===5)assert.ok(/112/.test(h),c.id+'/'+role+' 112 안내 없음');
  if(m.teach){const b=m.teach.blocks.find(x=>/보호자/.test(x.h));if(b&&/안전 (?:신호가 있거나|표현이 있습니다)/.test(b.p||'')){fam++;assert.ok(/먼저 연락하지 않고/.test(b.p),c.id+'/'+role+' 보호자 문장이 잘림: '+b.p);}}
  if(!role&&c.narrative){narr++;if(m.narrNote)note++;assert.strictEqual(!!m.narrNote,!R.urgent&&!R.narrSafety.length&&!(R.five.immediate||[]).length,c.id+' 서술 단서 0개 안내');}
 }
}
// 3) 해가 없는 문장만 덧붙여도 단계·안전 단서가 생기지 않는다.
for(const c of cases.slice(0,150)){const b=run({...c,narrative:''});for(const h of HARMLESS){const R=run({...c,narrative:'담임 관찰 기록. '+h});
 assert.ok((R.tier||0)<=(b.tier||0)&&!(R.narrSafety.length&&!b.narrSafety.length),c.id+' "'+h+'" 로 단계/안전 단서가 생김 '+b.tier+'→'+R.tier+' '+R.narrSafety.join('·'));}}
// 4) 2차(2026-10-29): 기관 세 역할의 첫 블록이 다르고, 1단계·어려움 없음이면 기관 목록이 없고, 강점 칸에 '보고되지 않았습니다' 문장이 없다.
let calm=0;
for(const c of cases.slice(0,200)){const p=payload(c);const ms=['cwc','child','admin'].map(r=>quiet(()=>ONE.model(p,r)));
 const h=ms.map(m=>m.teach.blocks[0].h);assert.strictEqual(new Set(h).size,3,c.id+' 기관 세 역할 첫 블록이 같음 '+h.join('/'));
 const t=quiet(()=>ONE.model(p,'teacher'));
 if(t.tier===1&&!t.hard.some(x=>x.v>=2)&&!t.k.urgent&&t.k.safety.tone!=='check'){calm++;assert.ok(!t.teach.blocks.some(b=>b.h==='가까운 지역 기관'),c.id+' 1단계인데 기관 목록');}
 for(const b of t.teach.blocks)if(/버팀목|어려움이 없던/.test(b.h))assert.ok(!(b.li||[]).some(x=>/보고되지 않았/.test(x)),c.id+' 버팀목에 부재 문장');
 assert.ok(/<details class="oy1-notes"/.test(ONE.html(t)),c.id+' 현장 노트가 접혀 있지 않음');}
// 5) 단조성 P1-7: 서술 영역이 척도에 잡혀도(13번 1→2점) 개입 수준이 내려가지 않는다(S160 모양, 가상).
{const base={answers:[0,0,1,0,0,0,0,1,1,0,0,0,1,0,1,0,0,0,1,2,1,1,0,0,0],narrative:'담임 관찰 기록. 담배 냄새가 나고 쉬는 시간마다 사라짐. 동생을 돌보느라 학원과 숙제를 못 한다고 함.'};
 const ORD=['monitor','brief','general','intensive','crisis'];const lv=a=>ORD.indexOf(run({...base,answers:a}).level.id);
 const up=base.answers.slice();up[12]=2;assert.ok(lv(up)>=lv(base.answers),'13번 1→2점에 개입 수준이 내려감');}
console.log('oy-random500-regression ok',cases.length,'· 서술',narr,'· 단서 0개 안내',note,'· 보호자 문장',fam,'· 1단계 조용한 사례',calm);
