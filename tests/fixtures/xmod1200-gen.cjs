'use strict';
// 무작위 가상 사례 생성기(실제 사례 아님). 가상 1,200사례 연결성 점검(2026-10-29, 시드 202610291400)과 같은 규칙.
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const {BANK}=require('./xmod1200-phrases.cjs');
const GRADES=['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];
const TYPES={calm:[],learning:[10,14,9,11],peer:[3,4,6,11,22],neglect:[2,16,19,15,10],abuse:[1,17,6,23],selfharm:[7,6,8,17,22],digital:[24,25,6,9],family:[17,18,16,6],poverty:[19,20,21,15],conduct:[5,12,13,9,17],multi:[6,9,10,17,19,22,3,16],isolate:[22,11,6,23],
 lowall:'L',unkheavy:'U',single4:'S4',safetyOnly:'SO',allUnknown:'AU',edge:'E',narrOnly:'N0',safetyUnk:'SU'};
const SRC=['','학생 진술: ','어머니 전화 상담: ','친구 전언: ','보건교사 기록: ','상담교사 메모: '];
const TIME=['','','어제 ','오늘 아침 ','요즘 ','지난주부터 '];
function vary(t,r){let s=t;const x=r();
 if(x<0.08)s=s.replace(/ /g,(m)=>r()<0.35?'':m);           // 띄어쓰기 생략
 else if(x<0.14)s=s.replace(/\.$/,'');                       // 마침표 없음
 else if(x<0.19)s=s.replace(/함\.$/,'함ㅠㅠ').replace(/음\.$/,'음..');
 else if(x<0.24)s=s.replace(/고 함\.$/,'고 했음.');
 return s;}
function gen(n,seed){const r=rng(seed),pick=a=>a[Math.floor(r()*a.length)],out=[];const keys=Object.keys(TYPES);
 for(let i=0;i<n;i++){
  const type=pick(keys),a=Array(25).fill(0);const T=TYPES[type];
  for(let k=0;k<25;k++){const x=r();a[k]=x<0.74?0:x<0.9?1:x<0.97?2:3;}
  for(const s of [1,2,7,25])if(r()<0.85)a[s-1]=0;
  if(T==='L'){for(let k=0;k<25;k++)a[k]=r()<0.6?1:0;for(const s of [1,2,7,25])a[s-1]=0;}
  else if(T==='U'){for(let k=0;k<25;k++)if(r()<0.4)a[k]='unknown';}
  else if(T==='S4'){a.fill(0);a[Math.floor(r()*25)]=4;}
  else if(T==='SO'){a.fill(0);a[pick([1,2,7,25])-1]=1+Math.floor(r()*4);}
  else if(T==='AU'){a.fill('unknown');if(r()<0.5)a[Math.floor(r()*25)]=0;}
  else if(T==='E'){a.fill(0);const tgt=pick([19,20,21,39,40,41,59,60,61,79,80]);let s=0;while(s<tgt){const k=Math.floor(r()*25);if([1,2,7,25].includes(k+1))continue;if(a[k]<4){a[k]++;s++;}}}
  else if(T==='N0'){a.fill(0);}
  else if(T==='SU'){a.fill(0);for(const s of [1,2,7,25])if(r()<0.5)a[s-1]='unknown';for(const it of [6,8,22])a[it-1]=1+Math.floor(r()*2);}
  else {const hi=r()<0.5?3:r()<0.5?2:4;
   for(const it of T){const x=r();a[it-1]=Math.max(a[it-1],x<0.25?hi:x<0.6?Math.max(1,hi-1):x<0.85?Math.max(1,hi-2):0);}
   if(r()<0.25){const m=1+Math.floor(r()*4);for(let j=0;j<m;j++)a[Math.floor(r()*25)]='unknown';}}
  const explicit=r()<0.05?[Math.floor(r()*2)]:[];
  const followups={};for(const f of [4,5,12,13]){const v=a[f-1];if(typeof v==='number'&&v>=(f===4?1:3)){const x=r();if(x<0.4)followups[f]='no';else if(x<0.55)followups[f]='yes';else if(x<0.7)followups[f]='unknown';}}
  let narrative='',phr=[];const nm=r();
  if(T==='N0'||nm>0.25){const cnt=1+Math.floor(r()*4);for(let j=0;j<cnt;j++){const b=pick(BANK);if(phr.includes(b))continue;phr.push(b);}
   const parts=phr.map(b=>{let t=vary(b.t,r);if(b.kind==='pos'&&r()<0.3&&!/^(어제|오늘)/.test(t))t=pick(TIME)+t;return t;});
   narrative=pick(SRC)+parts.join(' ');}
  out.push({id:'T'+String(i+1).padStart(4,'0'),type,grade:pick(GRADES),gender:r()<0.5?'남':'여',answers:a,explicit,followups,narrative,phr:phr.map(b=>BANK.indexOf(b))});
 }return out;}
module.exports={gen,rng};
