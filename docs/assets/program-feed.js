/* © 2026 김지훈. Public program facts remain attributed to their sources. */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const safe=s=>{try{if(typeof s!=='string'||/[\u0000-\u001f\u007f]/.test(s))return false;const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password}catch{return false}};
const dateOf=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):'';
// A failed refresh keeps the last good list (never overwritten as a success), so the list is only as fresh as lastSuccessAt.
// When the latest attempt failed, nothing on it may read as open for application until a person rechecks the source.
function freshness(feed){
 const ok=dateOf(feed?.lastSuccessAt),tried=dateOf(feed?.lastAttemptAt),failed=!!feed?.lastError;
 return {failed,lastSuccessOn:ok,lastAttemptOn:tried,note:failed?`목록 자동 갱신 실패(${tried||'날짜 미상'} 시도) · 마지막 확인 ${ok||'미상'} · 현재 모집·접수 가능 여부는 기관 공식 안내로 다시 확인하세요.`:''};
}
// Legacy entries belong to the top-level Welinfo feed. Unknown source IDs fail closed.
function sourceState(feed,p){
 if(!p.sourceId||p.sourceId==='welinfo')return freshness(feed);
 const state=feed.sources?.[p.sourceId];
 return freshness(state?.lastSuccessAt?state:{...state,lastError:state?.lastError||'Unverified source'});
}
function status(p,day=today()){
 if(!p.verifiedOn||!safe(p.sourceUrl))return '확인 필요';
 if(p.feed&&p.feed.failed&&p.status!=='마감'&&!(p.closesOn&&day>p.closesOn))return '확인 필요';
 if(p.status==='마감')return '마감';
 if(p.closesOn&&day>p.closesOn)return '마감';
 if(p.status==='확인 필요')return '확인 필요';
 if(p.opensOn&&day<p.opensOn)return '예정';
 if(p.status==='상시')return '상시';
 if(p.opensOn&&p.closesOn)return '모집중';
 return '확인 필요'; // 날짜가 없는 모집상태는 활성 모집으로 단정하지 않음
}
function merge(data,feed){
 if(!Array.isArray(feed?.programs))throw Error('Invalid program data');
 let count=0;const seen=new Set();
 for(const p of feed.programs){
  if(!p||!p.title||!p.organization||!p.verifiedOn||!safe(p.sourceUrl))continue;
  // Use a reviewed institution ID, or an unambiguous exact institution name; never fuzzy-match.
  const matches=data.organizations.filter(o=>p.organizationId?o.id===p.organizationId:norm(o.name)===norm(p.organization));
  if(matches.length!==1||norm(matches[0].name)!==norm(p.organization))continue;
  const feedState=sourceState(feed,p);
  const o=matches[0],key=o.id+'|'+p.sourceUrl+'|'+p.title;
  if(seen.has(key)||o.services.some(s=>s.source===p.sourceUrl&&norm(s.name)===norm(p.title)))continue;
  seen.add(key);
  const tags=Object.fromEntries(['target','need','form','intake'].map(axis=>[axis,Array.isArray(p.tags?.[axis])?p.tags[axis].filter(t=>data.taxonomy[axis]?.includes(t)):[]]));
  const period=p.periodText||'접수기간 원문 확인';
  o.services.unshift({id:'PROGRAM-'+String(p.id||count),name:p.title,category:p.category||'기관별 모집사업',target:p.target||'원문 확인 필요',description:p.summary||'',method:p.method||'공고 원문에서 신청방법 확인',operation:feedState.failed?period+' · '+feedState.note:period,editedOn:p.verifiedOn,tags,operationType:p.status==='상시'?'상시':'공모형',localAvailable:p.localAvailable||'확인 필요',source:p.sourceUrl,verification:{status:p.evidenceType==='user_screenshot'?'미확인':'확인완료',date:p.verifiedOn,method:p.evidenceType==='user_screenshot'?'이용자 제공 목록 캡처 확인':'공고 원문 확인',by:'자료 관리자',next:feedState.failed?'목록 갱신 실패 — 공식 안내 재확인 필요':''},contacts:[],rounds:[],externalProgram:{...p,feed:feedState}});
  count++;
 }
 return count;
}
async function load(data){try{const r=await fetch('programs.json',{cache:'no-cache',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Program data unavailable');return merge(data,await r.json());}catch{return 0;}}
const api={load,merge,status,freshness,sourceState};if(typeof module!=='undefined')module.exports=api;else root.ProgramFeed=api;
})(typeof window!=='undefined'?window:globalThis);
