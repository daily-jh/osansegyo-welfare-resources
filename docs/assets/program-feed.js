/* © 2026 김지훈. External program facts belong to their respective sources. */
(function(root){'use strict';
const SOURCE='https://osan.welinfo.kr/?board=programList';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>/^https?:\/\//i.test(s||'')?s:'';
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let feed={programs:[]};
function status(p,day=today()){
 if(p.status==='마감')return '마감';
 if(p.closesOn&&day>p.closesOn)return '마감';
 if(p.opensOn&&day<p.opensOn)return '예정';
 // A source-stated status is retained only as checked information, never inferred from an incomplete period.
 if(p.status==='상시')return '상시';
 if(p.opensOn&&p.closesOn&&p.verifiedOn&&p.sourceUrl)return '모집중';
 return ['모집중','예정'].includes(p.status)?p.status:'확인 필요';
}
function entries(o){return feed.programs.filter(p=>norm(p.organization)===norm(o.name));}
function item(p){const url=safe(p.sourceUrl),label=status(p);return `<section class="service-detail external-program"><div class="detail-top"><h4>${esc(p.title)}</h4><span class="program-status">${esc(label)}</span></div><p>${esc(p.organization)}</p>${p.target?`<p><b>대상</b> ${esc(p.target)}</p>`:''}<p><b>접수기간</b> ${esc(p.periodText||[p.opensOn,p.closesOn].filter(Boolean).join(' ~ ')||'원문 확인 필요')}</p><p>${esc(p.summary||'')}</p>${url?`<a class="program-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">사업 공고 원문·신청 안내 ↗</a>`:''}<small>출처: 오산 복지정보 · 확인일 ${esc(p.verifiedOn||'미확인')} · 확인 당시 상태 ${esc(p.status||'확인 필요')}</small></section>`;}
function institutionHTML(o){const list=entries(o);return list.length?`<div class="detail-heading">오산 복지정보 수록 사업 · ${list.length}개</div>${list.map(item).join('')}`:'';}
function render(){const host=document.querySelector('#programFeed');if(!host)return;
 const input=document.querySelector('#programKeyword'),select=document.querySelector('#programStatus');
 const q=norm(input?.value),filter=select?.value;
 const rows=feed.programs.filter(p=>(!q||norm(p.title+' '+p.organization+' '+(p.target||'')).includes(q))&&(!filter||status(p)===filter));
 host.innerHTML=`<p>마지막 수집 성공: <b>${esc(feed.lastSuccessAt||'아직 없음')}</b> · 최근 시도: ${esc(feed.lastAttemptAt||'미확인')}</p>${feed.lastError?`<p class="load-status">${esc(feed.lastError)} 기존에 확인한 자료가 있다면 유지됩니다.</p>`:''}<p>등록 ${feed.programs.length}개 · 조건 일치 ${rows.length}개</p><div class="results-grid">${rows.map(item).join('')}</div>${rows.length?'':`<p>${feed.programs.length?'검색 조건에 맞는 사업이 없습니다.':'확인된 사업 목록이 아직 없습니다. 원문 접속에 성공한 후 사업 정보를 등록합니다.'}</p>`}`;
}
async function load(){try{const response=await fetch('programs.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const value=await response.json();if(!Array.isArray(value.programs))throw Error('Invalid feed');feed=value;}catch{feed={programs:[],lastError:'사업 자료를 불러오지 못했습니다. 원문 홈페이지에서 확인해 주세요.'};}render();document.querySelector('#programKeyword')?.addEventListener('input',render);document.querySelector('#programStatus')?.addEventListener('change',render);}
const api={load,status,entries,institutionHTML};if(typeof module!=='undefined')module.exports=api;else root.ProgramFeed=api;
})(typeof window!=='undefined'?window:globalThis);
