/* © 2026 김지훈. Public program facts remain attributed to their sources. */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const safe=s=>typeof s==='string'&&/^https?:\/\//i.test(s);
function status(p,day=today()){
 if(!p.verifiedOn||!safe(p.sourceUrl))return '확인 필요';
 if(p.status==='마감')return '마감';
 if(p.closesOn&&day>p.closesOn)return '마감';
 if(p.opensOn&&day<p.opensOn)return '예정';
 if(p.status==='상시')return '상시';
 if(p.opensOn&&p.closesOn)return '모집중';
 return ['모집중','예정'].includes(p.status)?p.status:'확인 필요';
}
function merge(data,feed){
 if(!Array.isArray(feed?.programs))throw Error('Invalid program data');
 let count=0;const seen=new Set();
 for(const p of feed.programs){
  if(!p||!p.title||!p.organization||!p.verifiedOn||!safe(p.sourceUrl))continue;
  // Use a reviewed institution ID, or an unambiguous exact institution name; never fuzzy-match.
  const matches=data.organizations.filter(o=>p.organizationId?o.id===p.organizationId:norm(o.name)===norm(p.organization));
  if(matches.length!==1)continue;
  const o=matches[0],key=o.id+'|'+p.sourceUrl+'|'+p.title;
  if(seen.has(key)||o.services.some(s=>s.externalProgram&&s.source===p.sourceUrl&&s.name===p.title))continue;
  seen.add(key);
  const tags=Object.fromEntries(['target','need','form','intake'].map(axis=>[axis,Array.isArray(p.tags?.[axis])?p.tags[axis].filter(t=>data.taxonomy[axis]?.includes(t)):[]]));
  o.services.unshift({id:'PROGRAM-'+String(p.id||count),name:p.title,category:p.category||'기관별 모집사업',target:p.target||'원문 확인 필요',description:p.summary||'',method:p.method||'공고 원문에서 신청방법 확인',operation:p.periodText||'접수기간 원문 확인',editedOn:p.verifiedOn,tags,operationType:p.status==='상시'?'상시':'공모형',localAvailable:p.localAvailable||'확인 필요',source:p.sourceUrl,verification:{status:'확인완료',date:p.verifiedOn,method:'공고 원문 확인',by:'자료 관리자',next:''},contacts:[],rounds:[],externalProgram:p});
  count++;
 }
 return count;
}
async function load(data){try{const r=await fetch('programs.json',{cache:'no-cache'});if(!r.ok)throw Error('Program data unavailable');return merge(data,await r.json());}catch{return 0;}}
const api={load,merge,status};if(typeof module!=='undefined')module.exports=api;else root.ProgramFeed=api;
})(typeof window!=='undefined'?window:globalThis);
