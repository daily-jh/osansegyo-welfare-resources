/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
(() => {
  'use strict';
  const data = window.WELFARE_DATA;
  if (!data || !Array.isArray(data.organizations)) { document.getElementById('resultGrid').textContent = '데이터 파일을 읽지 못했습니다. 관리자에게 문의해 주세요.'; return; }
  const all = data.organizations;
  const state = { level:'전체', category:'전체', keyword:'', audience:'', onlyFavorites:false, sort:'relevance', limit:8, opened:new Set() };
  const $ = sel => document.querySelector(sel);
  const resultGrid=$('#resultGrid'), empty=$('#emptyState'), more=$('#loadMore');
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanText = s => String(s || '').toLocaleLowerCase('ko').normalize('NFKC').replace(/[\s\u200b\u00a0]+/g,'');
  const url = value => /^https?:\/\//i.test(value || '') ? value : '';
  const norm = s => cleanText(s);
  const textSearch = o => [o.name,o.level,o.kind,o.summary,...o.services.flatMap(s=>[s.name,s.category,s.target,s.description,s.method])].join(' ');
  const searchCache = new Map(all.map(o=>[o.id,norm(textSearch(o))]));
  const STORE = 'osansegyo_resource_favorites_v1';
  let favorites = new Set();
  try { const stored=JSON.parse(localStorage.getItem(STORE)||'[]'); if(Array.isArray(stored)) favorites=new Set(stored); } catch(e) { /* private mode: favorites remain in session */ }
  const categories=['전체','경제·긴급','사례관리','가족·아동','교육·청소년','보건·의료','정신건강','주거','돌봄·생활','장애인','노인','취업·자립','법률·금융','지역협력'];
  const quicks=['의료비','위기가정','중학생','장애아동','주거지원','자립','한부모'];
  const audienceMatch = (o, a) => {
    if(!a) return true;
    const variants={ '어르신':['어르신','노인','고령'], '기관':['기관','종사자','실무자','시설'], '청소년':['청소년','학생','중고생','학교'], '가족':['가족','한부모','양육'], '아동':['아동','어린이','영유아'], '장애':['장애','발달'], '위기':['위기','취약','저소득'] }[a] || [a];
    return o.services.some(s=>variants.some(v=>norm(s.target).includes(norm(v)))) || variants.some(v=>norm(o.summary).includes(norm(v)));
  };
  const matchOrg = o => {
    if(state.level!=='전체'&&o.level!==state.level) return false;
    if(state.category!=='전체'&&!o.services.some(s=>s.category===state.category)) return false;
    if(state.keyword && !searchCache.get(o.id).includes(norm(state.keyword))) return false;
    if(!audienceMatch(o,state.audience))return false;
    if(state.onlyFavorites&&!favorites.has(o.id))return false;
    return true;
  };
  function rank(o){const q=norm(state.keyword);if(!q)return 0;const name=norm(o.name);if(name===q)return 8;if(name.includes(q))return 5;return o.services.filter(s=>norm(s.name).includes(q)).length*3;}
  function visibleOrgs(){const filtered=all.filter(matchOrg);if(state.sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'ko'));else if(state.sort==='services')filtered.sort((a,b)=>b.services.length-a.services.length||a.name.localeCompare(b.name,'ko'));else if(state.keyword)filtered.sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name,'ko'));return filtered;}
  const serviceScore=s=>{
    let score=0;
    if(state.category!=='전체'&&s.category===state.category)score+=3;
    if(state.keyword&&norm([s.name,s.category,s.target,s.description].join(' ')).includes(norm(state.keyword)))score+=6;
    if(state.audience&&norm(s.target).includes(norm(state.audience)))score+=2;
    return score;
  };
  function getOrgCard(o){const isOpen=state.opened.has(o.id), isFav=favorites.has(o.id);
    const svc=[...o.services].sort((a,b)=>serviceScore(b)-serviceScore(a));
    const tagHTML=svc.slice(0,4).map(s=>`<span class="service-tag ${serviceScore(s)>0?'highlight':''}">${escapeHtml(s.name)}</span>`).join('')+(svc.length>4?`<span class="service-tag">+${svc.length-4}개</span>`:'');
    const detailHTML=isOpen? `<div class="org-details" id="details-${o.id}"><div class="detail-heading">제공 서비스 · ${svc.length}개</div>${svc.map(s=>`<div class="service-detail"><div class="detail-top"><span class="detail-title">${escapeHtml(s.name)}</span><span class="detail-cat">${escapeHtml(s.category)}</span></div><p class="detail-desc">${escapeHtml(s.description)}</p><div class="detail-meta"><span><b>지원대상</b>${escapeHtml(s.target)}</span></div><div class="detail-meta"><span><b>신청·연계</b>${escapeHtml(s.method)}</span><span class="status-note">${escapeHtml(s.operation)}</span></div></div>`).join('')}<div class="detail-warning">※ 지원자격·접수기간·예산·운영여부는 연계 전에 해당 기관의 최신 공고 또는 담당자에게 확인해 주세요.</div><div class="detail-links">${url(o.site)?`<a href="${escapeHtml(url(o.site))}" target="_blank" rel="noopener noreferrer">공식 홈페이지 ↗</a>`:''}${url(o.source)&&o.source!==o.site?`<a href="${escapeHtml(url(o.source))}" target="_blank" rel="noopener noreferrer">참고 출처 ↗</a>`:''}<button type="button" class="share-link" data-action="share" data-id="${o.id}">기관 링크 복사 ↗</button></div>${o.phone?`<div class="detail-meta" style="margin-top:12px"><b>대표전화</b> ${escapeHtml(o.phone)}</div>`:''}</div>` : '';
    const cls={오산시:'osan',경기도:'gyeonggi',민간:'private'}[o.level];
    return `<article class="org-card ${isOpen?'expanded':''}" id="org-${o.id}"><div class="org-upper"><div class="org-type"><span class="region-label ${cls}">${escapeHtml(o.level==='민간'?'전국 민간':o.level)}</span><span class="type-label">${escapeHtml(o.kind)}</span></div><button class="star-button ${isFav?'active':''}" aria-label="${escapeHtml(o.name)} 즐겨찾기 ${isFav?'해제':'추가'}" aria-pressed="${isFav}" title="즐겨찾기" type="button" data-action="favorite" data-id="${o.id}">${isFav?'★':'☆'}</button></div><h3 class="org-name">${escapeHtml(o.name)}</h3><p class="org-summary">${escapeHtml(o.summary)}</p><div class="service-label"><strong>지원서비스</strong><span>주요 서비스</span></div><div class="tag-cloud">${tagHTML}</div><div class="card-footer"><span class="service-total">등록 서비스 <strong>${o.services.length}</strong>개</span><button class="expand-button" type="button" data-action="open" data-id="${o.id}" aria-expanded="${isOpen}" aria-controls="details-${o.id}">${isOpen?'접기':'상세 보기'} <span class="chevron">⌄</span></button></div>${detailHTML}</article>`;
  }
  function drawCategories(){const available =new Set(all.filter(o=>state.level==='전체'||o.level===state.level).flatMap(o=>o.services.map(s=>s.category)));$('#categoryFilters').innerHTML=categories.filter(c=>c==='전체'||available.has(c)).map(c=>`<button type="button" data-category="${escapeHtml(c)}" class="${state.category===c?'active':''}" aria-pressed="${state.category===c}">${escapeHtml(c)}</button>`).join('');}
  function render(){const orgs=visibleOrgs();$('#resultCount').textContent=orgs.length;$('#serviceResultCount').textContent=`· 등록 서비스 ${orgs.reduce((n,o)=>n+o.services.length,0)}개`;
    resultGrid.innerHTML=orgs.slice(0,state.limit).map(getOrgCard).join('');empty.hidden=orgs.length!==0;more.hidden=orgs.length<=state.limit;
    $('#favoritesOnly').checked=state.onlyFavorites;$('#sortSelect').value=state.sort;$('#audienceFilter').value=state.audience;
    document.querySelectorAll('#regionTabs [data-level]').forEach(btn=>{btn.classList.toggle('selected',btn.dataset.level===state.level);btn.setAttribute('aria-pressed',String(btn.dataset.level===state.level));});
    drawCategories();
  }
  const refresh=()=>{state.limit=8;render();};
  let toastTimer;
  function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);}
  $('#statOrgs').textContent=all.length;$('#statServices').textContent=all.reduce((n,o)=>n+o.services.length,0);
  $('#quickTags').innerHTML=quicks.map(q=>`<button type="button" class="quick-tag" data-query="${escapeHtml(q)}"># ${escapeHtml(q)}</button>`).join('');
  $('#quickTags').addEventListener('click',e=>{const b=e.target.closest('[data-query]');if(!b)return;state.keyword=b.dataset.query;$('#keyword').value=state.keyword;refresh();});
  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.keyword=$('#keyword').value.trim();refresh();});
  $('#keyword').addEventListener('input',e=>{state.keyword=e.target.value.trim();refresh();});
  $('#regionTabs').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(!b)return;state.level=b.dataset.level;state.category='전체';refresh();});
  $('#categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;state.category=b.dataset.category;refresh();});
  $('#audienceFilter').addEventListener('change',e=>{state.audience=e.target.value;refresh();});
  $('#favoritesOnly').addEventListener('change',e=>{state.onlyFavorites=e.target.checked;refresh();});
  $('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;refresh();});
  function reset(){Object.assign(state,{level:'전체',category:'전체',keyword:'',audience:'',onlyFavorites:false,sort:'relevance',limit:8});$('#keyword').value='';render();}
  $('#resetFilters').addEventListener('click',reset);$('#emptyReset').addEventListener('click',reset);
  $('#loadMore').addEventListener('click',()=>{state.limit+=8;render();});
  resultGrid.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id;const org=all.find(o=>o.id===id);if(!org)return;
    if(b.dataset.action==='favorite'){if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem(STORE,JSON.stringify([...favorites]));}catch(_e){}render();toast(favorites.has(id)?'즐겨찾기에 추가했습니다.':'즐겨찾기에서 제외했습니다.');}
    if(b.dataset.action==='open'){if(state.opened.has(id))state.opened.delete(id);else state.opened.add(id);render();if(state.opened.has(id))document.getElementById('org-'+id)?.scrollIntoView({behavior:'smooth',block:'nearest'});}
    if(b.dataset.action==='share'){const deepLink=new URL(window.location.href);deepLink.hash='org='+id;try{await navigator.clipboard.writeText(deepLink.toString());toast('기관 링크를 복사했습니다.');}catch(_e){toast('복사할 수 없습니다. 브라우저 주소를 복사해 주세요.');}}
  });
  function openDeepLink(){const id=location.hash.replace(/^#org=/,'');if(!id||!all.some(o=>o.id===id))return;
    state.level='전체';state.category='전체';state.keyword='';state.audience='';state.onlyFavorites=false;state.sort='relevance';
    $('#keyword').value='';state.opened.add(id);const idx=all.findIndex(o=>o.id===id);
    state.limit=Math.max(8,idx+1);render();requestAnimationFrame(()=>document.getElementById('org-'+id)?.scrollIntoView({block:'center'}));}
  render();if(location.hash.startsWith('#org='))openDeepLink();window.addEventListener('hashchange',openDeepLink);
})();
