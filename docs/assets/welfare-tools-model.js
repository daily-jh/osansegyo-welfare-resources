/* © 2026 오산세교종합사회복지관 김지훈 팀장. 복지혜택 자가점검·자원 공백 지도 공용 모델(결정적, 비AI).
 * - 자가점검은 '문의할 후보'를 고르는 보조 기능이며 수급 자격·지원 가능 여부를 판정하지 않습니다.
 * - 공백 지도는 이 사이트에 등록된 자료 기준의 빈칸이며, 지역에 자원이 실제로 없다는 뜻이 아닙니다.
 * - 입력값(대상·상황)은 저장하거나 외부로 보내지 않습니다. */
(function(root){'use strict';
const LEVELS=['오산시','경기도','민간'];
// 사는 동(2026-11-26): OY-RALS와 같은 거주 지역 규칙(residence-v1.js). 없으면(자원 공백 지도 등) 동 없이 지금처럼 동작한다.
const R=(()=>{try{return typeof module!=='undefined'&&module.exports?require('./residence-v1.js'):root.Residence||null}catch(_){return null}})();
const LEVEL_LABEL={'오산시':'오산','경기도':'경기','민간':'전국'};
// 지역 범주 5단계(2026-11-25). level(원본 3범주)은 칸 집계 호환용, 정렬·표시는 tier를 쓴다.
const TIERS=['osan','near','gyeonggi','national-public','national-private'];
const TIER_LABEL={osan:'오산',near:'인근 시',gyeonggi:'경기','national-public':'전국 공공','national-private':'전국 민간'};
function tierOf(o){return TIERS.includes(o&&o.tier)?o.tier:o&&o.level==='오산시'?'osan':o&&o.level==='경기도'?'gyeonggi':'national-private'}
function tierLabel(e){const o=e&&e.o||e,t=tierOf(o);return TIER_LABEL[t]+(t==='near'&&o.tierCity?'·'+o.tierCity.replace(/시$/,''):'')}
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
const rankTier=e=>TIERS.indexOf(tierOf(e.o));
const rankStatus=x=>x==='확인완료'?0:x==='사업별 확인 필요'?1:2;
function sortEntries(a,b){
 // 내 동 관할 창구(그 동 행정복지센터·권역 복지관)는 대상 분류와 상관없이 맨 앞(관할 창구가 먼저 받는 구조).
 return (a.role==='mine'?0:1)-(b.role==='mine'?0:1)||(a.fit==='exact'?0:1)-(b.fit==='exact'?0:1)||(a.rk??rankTier(a))-(b.rk??rankTier(b))||rankStatus(a.checked.status)-rankStatus(b.checked.status)||(b.checked.date||b.checked.reviewed).localeCompare(a.checked.date||a.checked.reviewed)||a.s.name.localeCompare(b.s.name,'ko');
}
function selfCheck(data,input){
 const target=input&&input.target||'',ids=(input&&input.situations)||[],perGroup=(input&&input.perGroup)||5,dong=R?R.valid(input&&input.dong):'';
 const chosen=SITUATIONS.filter(x=>ids.includes(x.id)),all=entries(data);
 // 사는 동을 고르면 다른 동 행정복지센터·다른 권역 복지관은 빼고, 내 동 창구·그 시 기관을 앞에, 타지역이면 오산 기관을 뒤(참고)에 둔다.
 const roleOf=e=>dong?R.role(e.o,dong):'';
 const groups=chosen.map(sit=>{
  const list=all.filter(e=>tags(e.s,'need').includes(sit.need)).map(e=>{const role=roleOf(e);return {...e,fit:targetFit(e.s,target),level:level(e.o),checked:checked(e.o,e.s),role,rk:dong?R.rank(e.o,dong):undefined}}).filter(e=>e.fit&&e.role!=='other').sort(sortEntries);
  const byLevel=Object.fromEntries(LEVELS.map(l=>[l,list.filter(e=>e.level===l).length]));
  const seen=new Set(),top=[];
  for(const e of list){if(seen.has(e.o.id))continue;seen.add(e.o.id);top.push(e);if(top.length>=perGroup)break}
  return {id:sit.id,need:sit.need,q:sit.q,urgent:!!sit.urgent,total:list.length,byLevel,items:top,osanGap:byLevel['오산시']===0,local:dong?list.filter(e=>e.role==='mine'||e.role==='local').length:0};
 });
 const orgs=(data&&data.organizations||[]).filter(o=>!['중단','폐지'].includes(o.status));
 let firstDesk=orgs.filter(o=>/행정복지센터$/.test(o.name)&&o.phone&&o.level==='오산시').map(o=>({name:o.name,phone:o.phone,site:o.site||'',id:o.id}));
 if(dong)firstDesk=R.isDong(dong)?firstDesk.filter(d=>R.centerDong(d)===dong):[];
 const zone=dong&&R.isDong(dong)?R.zone(dong):null,zoneOrg=zone?orgs.find(o=>o.id===zone.orgId)||null:null;
 const shown=groups.flatMap(g=>g.items.map(e=>e.o));
 return {target,dong,urgent:groups.some(g=>g.urgent),groups,firstDesk,zone:zone?{number:zone.number,name:zone.name,id:zoneOrg?zoneOrg.id:zone.orgId,phone:zoneOrg?zoneOrg.phone||'':''}:null,notice:dong?R.notice(dong,shown):null};
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
const api=Object.freeze({LEVELS,LEVEL_LABEL,TIERS,TIER_LABEL,tierOf,tierLabel,SITUATIONS,entries,checked,targetFit,selfCheck,targets,needs,gapMatrix,cellServices});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WelfareTools=api;
})(typeof window!=='undefined'?window:globalThis);
