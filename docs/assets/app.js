/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), model=window.ResourceSearch, data=window.WELFARE_DATA;
  if(!model||!data||!Array.isArray(data.organizations))return;
  const all=data.organizations, selected=new Set(), STORE='osansegyo_resource_favorites_v1';
  const defaults={level:'전체',need:'',audience:'',keyword:'',kind:'',form:'',intake:'',local:'',operation:'',verified:'',application:'',onlyFavorites:false,sort:'relevance'};
  const state={...defaults,limit:8,opened:new Set()};
  let favorites=new Set();
  try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(a))favorites=new Set(a)}catch{}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=s=>/^https?:\/\//i.test(s||'')?s:'';
  const options=(values,first)=>`<option value="">${first}</option>`+values.map(v=>`<option>${esc(v)}</option>`).join('');
  const filters={audience:'audienceFilter',kind:'kindFilter',form:'formFilter',intake:'intakeFilter',local:'localFilter',operation:'operationFilter',application:'applicationFilter'};
  $('#audienceFilter').innerHTML=options(data.taxonomy.target,'전체 대상');
  $('#kindFilter').innerHTML=options([...new Set(all.map(o=>o.kind))].sort((a,b)=>a.localeCompare(b,'ko')),'전체 기관유형');
  $('#formFilter').innerHTML=options(data.taxonomy.form,'전체 지원형태');
  $('#intakeFilter').innerHTML=options(data.taxonomy.intake,'전체 접수경로');
  const services=o=>o.services.filter(s=>model.matchesService(o,s,state));
  const matched=o=>!['중단','폐지'].includes(o.status)&&(state.level==='전체'||o.level===state.level)&&(!state.kind||o.kind===state.kind)&&(!state.onlyFavorites||favorites.has(o.id))&&services(o).length;
  function rank(o){const q=model.norm(state.keyword);if(!q)return 0;const name=model.norm(o.name);return name===q?8:name.includes(q)?5:services(o).filter(s=>model.queryMatch(s.name,state.keyword)).length*3}
  function visible(){const list=all.filter(matched);if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ko'));else if(state.sort==='services')list.sort((a,b)=>services(b).length-services(a).length||a.name.localeCompare(b.name,'ko'));else if(state.keyword)list.sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name,'ko'));return list}
  const filtered=()=>Object.keys(defaults).some(k=>!['sort','onlyFavorites','level','kind'].includes(k)&&state[k]!==defaults[k]);
  function contactHTML(o){
    const c=o.contact||{}, phone=o.phone||'', fax=c.fax||'', email=c.email||'';
    const number=phone.split(/[~\/,]/)[0].replace(/[^0-9+]/g,'');
    const mail=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
    const address=String(o.address||'').trim();
    const addressStatus=o.addressStatus||'미확인';
    const addressSource=safe(o.addressSource);
    const addressDate=o.addressCheckedOn||'';
    let addressHTML='<div><dt>주소</dt><dd><span class="address-unverified">주소 확인 필요 · 방문 전 기관 문의</span></dd></div>';
    if(address){
      const mapTerm=encodeURIComponent(address+' '+o.name);
      const quality=addressStatus==='공식'?'공식 공개자료 기준':addressStatus==='공공·지도'?'공공·지도자료 대조': '기존 등록주소 · 현행 위치 재확인 필요';
      const dateLabel=addressDate?' ('+esc(addressDate)+')':'';
      const mapLinks='<div class="address-map-links"><a href="https://www.google.com/maps/search/?api=1&amp;query='+esc(mapTerm)+'" target="_blank" rel="noopener noreferrer">구글 지도 ↗</a><a href="https://map.naver.com/p/search/'+esc(mapTerm)+'" target="_blank" rel="noopener noreferrer">네이버 지도 ↗</a>'+(addressSource?'<a href="'+esc(addressSource)+'" target="_blank" rel="noopener noreferrer">주소 근거 ↗</a>':'')+'</div>';
      addressHTML='<div><dt>주소</dt><dd><div class="contact-address">'+esc(address)+'</div><small class="address-source-status">'+esc(quality)+dateLabel+'</small>'+mapLinks+'</dd></div>';
    }
    return `<div class="institution-contact"><div class="contact-heading">기관 연락처</div>${c.dept?`<p class="contact-purpose">${esc(c.dept)}</p>`:''}<dl><div><dt>${c.dept?'문의전화':'대표전화'}</dt><dd>${number?`<a href="tel:${esc(number.replace(/[^0-9+]/g,''))}">${esc(phone)}</a>`:esc(phone||'—')}</dd></div>${addressHTML}<div><dt>팩스</dt><dd>${esc(fax||'—')}</dd></div><div><dt>이메일</dt><dd>${mail?`<a href="mailto:${esc(email)}">${esc(email)}</a>`:esc(email||'—')}</dd></div></dl>${safe(o.site)?`<a class="official-homepage" href="${esc(o.site)}" target="_blank" rel="noopener noreferrer">${['오산시 동 행정복지센터','오산시 지역아동센터'].includes(o.name)?'개별 기관 안내':'대표 홈페이지'} 바로가기 ↗</a>`:''}</div>`;
  }
  function serviceHTML(s){
    const status=s.externalProgram?window.ProgramFeed.status(s.externalProgram):s.operationType==='상시'?'상시':model.applicationState(s);
    const source=safe(s.source);

    return `<section class="service-detail"><div class="detail-top"><h4 class="detail-title">${esc(s.name)}</h4><span class="detail-cat">${esc(s.category)}</span></div><p><span class="program-status">${esc(status)}${s.externalProgram?.evidenceType==='user_screenshot'?' · 캡처 기준':''}</span> <small>운영형태: ${esc(s.operationType||'확인 필요')} · 자료 확인일: ${esc(s.verification?.date||'미확인')}</small></p><p class="detail-desc">${esc(s.description)}</p><p><b>지원대상</b> ${esc(s.target)}</p><p><b>신청·연계</b> ${esc(s.method)}</p>${s.externalProgram?`<p><b>접수·안내기간</b> ${esc(s.externalProgram.periodText||[s.externalProgram.opensOn,s.externalProgram.closesOn].filter(Boolean).join(' ~ ')||'원문 확인 필요')}</p><p><small>자료 확인일 ${esc(s.externalProgram.verifiedOn)} · 출처 ${esc(s.externalProgram.sourceName||'공고 원문')}</small></p>`:''}${(s.contacts||[]).filter(c=>c.dept||c.phone).map(c=>`<p><b>접수창구</b> ${esc(c.dept)} ${esc(c.phone)}</p>`).join('')}${(s.rounds||[]).map(r=>`<p><b>${esc(r.name)}</b> ${esc(r.opens_on||'')} ~ ${esc(r.closes_on||'')} · ${esc(model.roundState(r))} ${safe(r.source_url)?`<a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">모집공고 원문 ↗</a>`:''}</p>`).join('')}${s.externalProgram&&safe(s.externalProgram.additionalUrl)?`<a class="program-link" href="${esc(s.externalProgram.additionalUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.externalProgram.additionalSourceName||'추가 공식 안내')} ↗</a>`:''}${source?`<a class="program-link" href="${esc(source)}" target="_blank" rel="noopener noreferrer">사업 안내·접수 확인 ↗</a>`:''}</section>`;
  }
  function card(o){const open=state.opened.has(o.id), svcs=services(o), fav=favorites.has(o.id), cls={오산시:'osan',경기도:'gyeonggi',민간:'private'}[o.level];
    return `<article class="org-card ${open?'expanded':''}" id="org-${esc(o.id)}"><div class="org-upper"><div class="org-type"><span class="region-label ${cls}">${esc(o.level==='민간'?'전국 공공·민간':o.level)}</span><span class="type-label">${esc(o.kind)}</span></div><button class="star-button ${fav?'active':''}" data-action="favorite" data-id="${o.id}" type="button" aria-label="${esc(o.name)} 즐겨찾기 ${fav?'해제':'추가'}" aria-pressed="${fav}">${fav?'★':'☆'}</button></div><h3 class="org-name">${safe(o.site)?`<a href="${esc(o.site)}" target="_blank" rel="noopener noreferrer">${esc(o.name)} ↗</a>`:esc(o.name)}</h3><p class="org-summary">${esc(o.summary)}</p><div class="tag-cloud">${svcs.slice(0,4).map(s=>`<span class="service-tag">${esc(s.name)}</span>`).join('')}${svcs.length>4?`<span class="service-tag">+${svcs.length-4}개</span>`:''}</div><div class="card-footer"><span class="service-total">${filtered()?'조건 일치':'등록'} 서비스 <strong>${svcs.length}</strong>개 / 전체 ${o.services.length}개</span><button class="expand-button" data-action="open" data-id="${o.id}" type="button" aria-expanded="${open}"${open?` aria-controls="details-${o.id}"`:''}>${open?'접기':'사업·모집 확인'} ⌄</button></div><label class="print-choice"><input type="checkbox" data-action="select" data-id="${o.id}" ${selected.has(o.id)?'checked':''}/> 연계 시트 선택</label>${open?`<div class="org-details" id="details-${o.id}">${contactHTML(o)}<div class="detail-heading">${filtered()?'조건에 일치한':'제공'} 서비스 · ${svcs.length}개</div>${svcs.map(serviceHTML).join('')}<div class="detail-links"><button type="button" class="share-link" data-action="share" data-id="${o.id}">기관 링크 복사 ↗</button></div></div>`:''}</article>`;
  }
  function render(){const list=visible();$('#statOrgs').textContent=all.filter(o=>!['중단','폐지'].includes(o.status)).length;$('#statServices').textContent=all.reduce((n,o)=>n+o.services.length,0);$('#resultCount').textContent=list.length;$('#serviceResultCount').textContent=`· ${filtered()?'조건 일치':'등록'} 서비스 ${list.reduce((n,o)=>n+services(o).length,0)}개`;
    $('#resultGrid').innerHTML=list.slice(0,state.limit).map(card).join('');$('#emptyState').hidden=!!list.length;$('#loadMore').hidden=list.length<=state.limit;
    $('#favoritesOnly').checked=state.onlyFavorites;$('#sortSelect').value=state.sort;
    for(const [key,id] of Object.entries(filters))$('#'+id).value=state[key];
    document.querySelectorAll('#regionTabs [data-level]').forEach(b=>{const on=b.dataset.level===state.level;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});
    $('#categoryFilters').innerHTML=['',...data.taxonomy.need].map(t=>`<button type="button" data-need="${esc(t)}" class="${state.need===t?'active':''}" aria-pressed="${state.need===t}">${esc(t||'전체')}</button>`).join('');
    $('#printCount').textContent=selected.size;$('#printSheet').disabled=!selected.size;
    $('#loadStatus').hidden=true;
  }
  const refresh=()=>{state.limit=8;render()};
  let toastTimer;function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
  $('#quickTags').innerHTML=['의료비','위기가정','청소년','장애아동','주거지원','자립','한부모'].map(q=>`<button type="button" class="quick-tag" data-query="${q}"># ${q}</button>`).join('');
  $('#quickTags').addEventListener('click',e=>{const b=e.target.closest('[data-query]');if(b){state.keyword=b.dataset.query;$('#keyword').value=state.keyword;refresh()}});
  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.keyword=$('#keyword').value.trim();refresh()});
  $('#keyword').addEventListener('input',e=>{state.keyword=e.target.value.trim();refresh()});
  $('#regionTabs').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(b){state.level=b.dataset.level;refresh()}});
  $('#categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-need]');if(b){state.need=b.dataset.need;refresh()}});
  for(const [key,id] of Object.entries(filters))$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;refresh()});
  $('#favoritesOnly').addEventListener('change',e=>{state.onlyFavorites=e.target.checked;refresh()});
  $('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;refresh()});
  function reset(){Object.assign(state,defaults);$('#keyword').value='';refresh()}
  $('#resetFilters').addEventListener('click',reset);$('#emptyReset').addEventListener('click',reset);
  $('#loadMore').addEventListener('click',()=>{state.limit+=8;render()});
  $('#resultGrid').addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id,o=all.find(o=>o.id===id);if(!o)return;
    if(b.dataset.action==='favorite'){if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem(STORE,JSON.stringify([...favorites]))}catch{}render();toast(favorites.has(id)?'즐겨찾기에 추가했습니다.':'즐겨찾기에서 제외했습니다.')}
    if(b.dataset.action==='open'){if(state.opened.has(id))state.opened.delete(id);else state.opened.add(id);render();const next=$(`#org-${id} .expand-button`);next?.focus({preventScroll:true})}
    if(b.dataset.action==='share'){const u=new URL(location.href);u.hash='org='+id;try{await navigator.clipboard.writeText(u.toString());toast('기관 링크를 복사했습니다.')}catch{toast('브라우저 주소를 복사해 주세요.')}}
    if(b.dataset.action==='select'){if(selected.has(id))selected.delete(id);else if(selected.size<5)selected.add(id);else{b.checked=false;toast('최대 5개 기관까지 선택할 수 있습니다.')}$('#printCount').textContent=selected.size;$('#printSheet').disabled=!selected.size}
  });
  $('#clearPrint').addEventListener('click',()=>{selected.clear();render()});
  $('#printSheet').addEventListener('click',()=>{
    $('#printArea').innerHTML=`<h1>복지자원 연계 확인 시트</h1><p>출력일 ${esc(model.today())} · 기관 ${selected.size}곳 · 신청 가능 여부는 직접 확인해 주세요.</p>`+all.filter(o=>selected.has(o.id)).map(o=>`<section><h2>${esc(o.name)}</h2><p>대표전화: ${esc(o.phone||'—')}<br/>주소: ${esc(o.address||'주소 확인 필요')}<br/>팩스: ${esc(o.contact?.fax||'—')}<br/>이메일: ${esc(o.contact?.email||'—')}<br/>대표 홈페이지: ${esc(o.site||'—')}</p>${o.services.map(s=>`<p><b>${esc(s.name)}</b> · ${esc(s.target)}<br/>신청·연계: ${esc(s.method)}</p>${s.externalProgram?`<p><b>접수·안내기간</b> ${esc(s.externalProgram.periodText||[s.externalProgram.opensOn,s.externalProgram.closesOn].filter(Boolean).join(' ~ ')||'원문 확인 필요')}</p><p><small>자료 확인일 ${esc(s.externalProgram.verifiedOn)} · 출처 ${esc(s.externalProgram.sourceName||'공고 원문')}</small></p>`:''}`).join('')}<p>□ 관할·대상 확인　□ 접수기간 확인　□ 담당창구 확인　□ 이용 의사 확인</p></section>`).join('');window.print();
  });
  function openDeepLink(){const id=location.hash.replace(/^#org=/,'');if(id==='438b636f15'){Object.assign(state,defaults);state.keyword='행정복지센터';$('#keyword').value=state.keyword;refresh();requestAnimationFrame(()=>$('#searchArea')?.scrollIntoView({block:'start'}));return;}if(!all.some(o=>o.id===id))return;Object.assign(state,defaults);$('#keyword').value='';state.opened.add(id);state.limit=Math.max(8,all.findIndex(o=>o.id===id)+1);render();requestAnimationFrame(()=>$('#org-'+id)?.scrollIntoView({block:'center'}))}
  window.ProgramFeed?.load(data).then(()=>render());
  render();if(location.hash.startsWith('#org='))openDeepLink();window.addEventListener('hashchange',openDeepLink);
})();
