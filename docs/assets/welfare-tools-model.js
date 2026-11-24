/* © 2026 오산세교종합사회복지관 김지훈 팀장. 복지혜택 자가점검·자원 공백 지도 공용 모델(결정적, 비AI).
 * - 자가점검은 '문의할 후보'를 고르는 보조 기능이며 수급 자격·지원 가능 여부를 판정하지 않습니다.
 * - 공백 지도는 이 사이트에 등록된 자료 기준의 빈칸이며, 지역에 자원이 실제로 없다는 뜻이 아닙니다.
 * - 입력값(대상·상황)은 저장하거나 외부로 보내지 않습니다. */
(function(root){'use strict';
const LEVELS=['오산시','경기도','민간'];
const LEVEL_LABEL={'오산시':'오산','경기도':'경기','민간':'전국'};
// 쉬운 말 상황 → 분류표 욕구영역. 안전 상황은 결과 맨 위에 긴급 연락처를 먼저 보여준다.
const SITUATIONS=[
 {id:'safety',need:'안전·권리보호',q:'폭력·학대·위협 때문에 안전이 걱정돼요',urgent:true},
 {id:'mind',need:'정신건강',q:'마음이 많이 힘들거나 잠·식사가 무너졌어요'},
 {id:'money',need:'소득·생계',q:'생활비·식비·공과금이 부족해요'},
 {id:'house',need:'주거',q:'집세·주거환경·살 곳이 걱정돼요'},
 {id:'health',need:'의료·건강',q:'병원비나 건강 관리가 어려워요'},
 {id:'care',need:'돌봄',q:'아이·어르신·장애가 있는 가족을 돌보기 어려워요'},
 {id:'family',need:'가족지원',q:'가족 관계나 양육이 힘들어요'},
 {id:'study',need:'교육',q:'학교·공부·진로 지원이 필요해요'},
 {id:'job',need:'고용·자립',q:'일자리·자립 준비가 필요해요'},
 {id:'debt',need:'법률·금융',q:'빚·법률 문제·금융 사기가 걱정돼요'},
 {id:'many',need:'사례관리',q:'여러 어려움이 한꺼번에 겹쳐 있어요'},
 {id:'join',need:'지역참여·자원봉사',q:'이웃과 어울리거나 봉사하고 싶어요'}
];
const PRACTITIONER='기관·실무자';
const tags=(s,k)=>Array.isArray(s&&s.tags&&s.tags[k])?s.tags[k]:[];
function entries(data){
 if(!data||!Array.isArray(data.organizations))return [];
 return data.organizations.filter(o=>!['중단','폐지'].includes(o.status)).flatMap(o=>(o.services||[]).filter(s=>s.localAvailable!=='불가').map(s=>({o,s})));
}
function level(o){return LEVELS.includes(o.level)?o.level:'민간'}
function checked(o,s){
 const v=s.verification||{};
 return {status:v.status||'미확인',date:/^\d{4}-\d{2}-\d{2}$/.test(v.date||'')?v.date:'',reviewed:s.editedOn||o.reviewed||'',next:v.next||''};
}
// 대상 일치: exact(대상 분류에 포함) / open(대상 미분류, 확인 필요) / null(다른 대상 전용 또는 실무자용).
function targetFit(s,target){
 const t=tags(s,'target');
 if(t.length&&t.every(x=>x===PRACTITIONER))return null;
 if(!target)return t.length?'exact':'open';
 if(t.includes(target))return 'exact';
 return t.length?null:'open';
}
const rankLevel=l=>l==='오산시'?0:l==='경기도'?1:2;
const rankStatus=x=>x==='확인완료'?0:x==='사업별 확인 필요'?1:2;
function sortEntries(a,b){
 return (a.fit==='exact'?0:1)-(b.fit==='exact'?0:1)||rankLevel(a.level)-rankLevel(b.level)||rankStatus(a.checked.status)-rankStatus(b.checked.status)||(b.checked.date||b.checked.reviewed).localeCompare(a.checked.date||a.checked.reviewed)||a.s.name.localeCompare(b.s.name,'ko');
}
function selfCheck(data,input){
 const target=input&&input.target||'',ids=(input&&input.situations)||[],perGroup=(input&&input.perGroup)||5;
 const chosen=SITUATIONS.filter(x=>ids.includes(x.id)),all=entries(data);
 const groups=chosen.map(sit=>{
  const list=all.filter(e=>tags(e.s,'need').includes(sit.need)).map(e=>({...e,fit:targetFit(e.s,target),level:level(e.o),checked:checked(e.o,e.s)})).filter(e=>e.fit).sort(sortEntries);
  const byLevel=Object.fromEntries(LEVELS.map(l=>[l,list.filter(e=>e.level===l).length]));
  const seen=new Set(),top=[];
  for(const e of list){if(seen.has(e.o.id))continue;seen.add(e.o.id);top.push(e);if(top.length>=perGroup)break}
  return {id:sit.id,need:sit.need,q:sit.q,urgent:!!sit.urgent,total:list.length,byLevel,items:top,osanGap:byLevel['오산시']===0};
 });
 const firstDesk=(data&&data.organizations||[]).filter(o=>/행정복지센터$/.test(o.name)&&o.phone&&o.level==='오산시').map(o=>({name:o.name,phone:o.phone,site:o.site||''}));
 return {target,urgent:groups.some(g=>g.urgent),groups,firstDesk};
}
function targets(data){return ((data&&data.taxonomy&&data.taxonomy.target)||[]).filter(t=>t!==PRACTITIONER)}
function needs(data){return (data&&data.taxonomy&&data.taxonomy.need)||[]}
// 욕구영역 × 대상 칸마다 오산·경기·전국 수록 서비스 수. 대상 미분류 서비스는 칸에 넣지 않고 영역별로 따로 센다.
function gapMatrix(data){
 const all=entries(data).map(e=>({...e,level:level(e.o)})),T=targets(data),N=needs(data);
 const rows=N.map(need=>{
  const inNeed=all.filter(e=>tags(e.s,'need').includes(need));
  const cells=T.map(target=>{
   const hit=inNeed.filter(e=>tags(e.s,'target').includes(target));
   const by=Object.fromEntries(LEVELS.map(l=>[l,hit.filter(e=>e.level===l).length]));
   const confirmed=hit.filter(e=>(e.s.verification||{}).status==='확인완료').length;
   const type=!hit.length?'none':by['오산시']===0?'osan-none':by['오산시']===1?'thin':'ok';
   return {need,target,by,total:hit.length,confirmed,type,ids:hit.map(e=>e.s.id)};
  });
  return {need,cells,open:inNeed.filter(e=>!tags(e.s,'target').length).length,total:inNeed.length};
 });
 const gaps=rows.flatMap(r=>r.cells).filter(c=>c.type==='osan-none'||c.type==='none')
  .sort((a,b)=>(a.type==='osan-none'?0:1)-(b.type==='osan-none'?0:1)||b.total-a.total||a.need.localeCompare(b.need,'ko'));
 const count=t=>rows.reduce((n,r)=>n+r.cells.filter(c=>c.type===t).length,0);
 return {targets:T,needs:N,rows,gaps,summary:{cells:T.length*N.length,none:count('none'),osanNone:count('osan-none'),thin:count('thin'),ok:count('ok'),services:all.length}};
}
function cellServices(data,need,target){
 return entries(data).filter(e=>tags(e.s,'need').includes(need)&&tags(e.s,'target').includes(target)).map(e=>({...e,level:level(e.o),checked:checked(e.o,e.s),fit:'exact'})).sort(sortEntries);
}
const api=Object.freeze({LEVELS,LEVEL_LABEL,SITUATIONS,entries,checked,targetFit,selfCheck,targets,needs,gapMatrix,cellServices});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WelfareTools=api;
})(typeof window!=='undefined'?window:globalThis);
