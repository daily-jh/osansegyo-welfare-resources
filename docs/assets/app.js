/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), model=window.ResourceSearch, data=window.WELFARE_DATA;
  if(!model||!data||!Array.isArray(data.organizations)){const status=$('#loadStatus');if(status){status.hidden=false;status.textContent='복지자원 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'}return;}
  const all=data.organizations, selected=new Set(), STORE='osansegyo_resource_favorites_v1';
  const defaults={level:'전체',need:'',audience:'',keyword:'',kind:'',form:'',intake:'',local:'',operation:'',verified:'',application:'',onlyFavorites:false,allDay:false,sort:'relevance'};
  const state={...defaults,limit:8,opened:new Set()};
  let favorites=new Set();
  try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(a))favorites=new Set(a.filter(id=>typeof id==='string'&&all.some(o=>o.id===id)).slice(0,all.length))}catch{}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=s=>{try{if(typeof s!=='string'||/[\u0000-\u001f\u007f]/.test(s))return '';const u=new URL(s);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}};
  const options=(values,first)=>`<option value="">${first}</option>`+values.map(v=>`<option>${esc(v)}</option>`).join('');
  const filters={audience:'audienceFilter',kind:'kindFilter',form:'formFilter',intake:'intakeFilter',local:'localFilter',operation:'operationFilter',application:'applicationFilter'};
  $('#audienceFilter').innerHTML=options(data.taxonomy.target,'전체 대상');
  $('#kindFilter').innerHTML=options([...new Set(all.map(o=>o.kind))].sort((a,b)=>a.localeCompare(b,'ko')),'전체 기관유형');
  $('#formFilter').innerHTML=options(data.taxonomy.form,'전체 지원형태');
  $('#intakeFilter').innerHTML=options(data.taxonomy.intake,'전체 접수경로');
  const services=(o,st=state)=>o.services.filter(s=>model.matchesService(o,s,st));
  const hoursOf=o=>[o.contact?.hours,...o.services.flatMap(s=>(s.contacts||[]).map(c=>c.hours))].filter(Boolean).join(' · ');
  const allDay=o=>/24\s*시간/.test(hoursOf(o));
  const live=o=>!['중단','폐지'].includes(o.status);
  const matched=(o,st=state)=>live(o)&&(st.level==='전체'||(o.scope||o.level)===st.level)&&(!st.allDay||allDay(o))&&(!st.kind||o.kind===st.kind)&&(!st.onlyFavorites||favorites.has(o.id))&&o.services.some(x=>model.matchesService(o,x,st));
  // 조건 하나를 바꿨을 때 몇 곳이 남는지(필터 옆 숫자·0곳 조건 막기, 2026-11-12)
  const countWith=patch=>{const st={...state,...patch};return all.reduce((n,o)=>n+(matched(o,st)?1:0),0)};
  function rank(o){const q=model.norm(state.keyword);if(!q)return 0;const name=model.norm(o.name);return name===q?8:name.includes(q)?5:services(o).filter(s=>model.queryMatch(s.name,state.keyword)).length*3}
  function visible(){const list=all.filter(o=>matched(o));if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ko'));else if(state.sort==='services')list.sort((a,b)=>services(b).length-services(a).length||a.name.localeCompare(b.name,'ko'));else if(state.keyword)list.sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name,'ko'));return list}
  const filtered=()=>Object.keys(defaults).some(k=>!['sort','onlyFavorites','allDay','level','kind'].includes(k)&&state[k]!==defaults[k]);
  function contactHTML(o){
    const c=o.contact||{}, phone=o.phone||'', fax=c.fax||'', email=c.email||'';
    const number=phone.split(/[~\/,]/)[0].replace(/[^0-9+]/g,'');
    const mail=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
    const address=String(o.address||'').trim();
    const addressStatus=o.addressStatus||'미확인';
    const addressSource=(o.addressStatus==='공식'||o.addressStatus==='공공·지도')?safe(o.addressSource):'';
    const addressDate=o.addressCheckedOn||'';
    let addressHTML='<div><dt>주소</dt><dd><span class="address-unverified">주소 확인 필요 · 방문 전 기관 문의</span></dd></div>';
    if(address){
      const mapTerm=encodeURIComponent(address+' '+o.name);
      const quality=addressStatus==='공식'?'공식 공개자료 기준':addressStatus==='공공·지도'?'공공·지도자료 대조':addressStatus==='사용자 제공·구글'?'제공 엑셀의 구글 지도 기준 · 기관 공식 미교차확인': '기존 등록주소 · 현행 위치 재확인 필요';
      const dateLabel=addressDate?' ('+esc(addressDate)+')':'';
      const mapLinks='<div class="address-map-links"><a href="https://www.google.com/maps/search/?api=1&amp;query='+esc(mapTerm)+'" target="_blank" rel="noopener noreferrer">구글 지도 ↗</a><a href="https://map.naver.com/p/search/'+esc(mapTerm)+'" target="_blank" rel="noopener noreferrer">네이버 지도 ↗</a>'+(addressSource?'<a href="'+esc(addressSource)+'" target="_blank" rel="noopener noreferrer">'+(addressStatus==='사용자 제공·구글'?'구글 지도 검색 ↗':'주소 근거 ↗')+'</a>':'')+'</div>';
      addressHTML='<div><dt>주소</dt><dd><div class="contact-address">'+esc(address)+'</div><small class="address-source-status">'+esc(quality)+dateLabel+'</small>'+(o.addressNote?'<small class="address-location-note">'+esc(o.addressNote)+'</small>':'')+mapLinks+'</dd></div>';
    }
    return `<div class="institution-contact"><div class="contact-heading">기관 연락처</div>${c.dept?`<p class="contact-purpose">${esc(c.dept)}</p>`:''}<dl><div><dt>${c.dept?'문의전화':'대표전화'}</dt><dd>${number?`<a href="tel:${esc(number.replace(/[^0-9+]/g,''))}">${esc(phone)}</a>`:esc(phone||'—')}</dd></div>${c.hours?`<div><dt>운영시간</dt><dd>${esc(c.hours)}</dd></div>`:''}${addressHTML}${o.jurisdiction?`<div><dt>담당 권역</dt><dd>${esc(o.jurisdiction)}</dd></div>`:''}<div><dt>팩스</dt><dd>${esc(fax||'—')}</dd></div><div><dt>이메일</dt><dd>${mail?`<a href="mailto:${esc(email)}">${esc(email)}</a>`:esc(email||'—')}</dd></div></dl>${safe(o.site)?`<a class="official-homepage" href="${esc(o.site)}" target="_blank" rel="noopener noreferrer">${['오산시 동 행정복지센터','오산시 지역아동센터'].includes(o.name)?'개별 기관 안내':'대표 홈페이지'} 바로가기 ↗</a>`:''}</div>`;
  }
  function serviceHTML(s){
    const status=s.externalProgram?window.ProgramFeed.status(s.externalProgram):s.operationType==='상시'?'상시 운영(접수 별도 확인)':model.applicationState(s);
    const source=safe(s.source);

    return `<section class="service-detail"><div class="detail-top"><h4 class="detail-title">${esc(s.name)}</h4><span class="detail-cat">${esc(s.category)}</span></div><p><span class="program-status" data-tone="${/^모집중/.test(status)?'open':/^상시/.test(status)?'steady':/^예정/.test(status)?'soon':/^마감/.test(status)?'closed':'check'}">${esc(status)}${s.externalProgram?.evidenceType==='user_screenshot'?' · 당시 캡처 기준 / 현재 접수 재확인':''}</span> <small>운영형태: ${esc(s.operationType||'확인 필요')} · 자료 확인일: ${esc(s.verification?.date||'미확인')}${model.recheckDue&&model.recheckDue(s)?` · <span class="recheck-due">다시 확인할 때가 지났습니다(예정 ${esc(s.verification.next)}) · 이용 전 기관에 확인</span>`:''}</small></p><p class="detail-desc">${esc(s.description)}</p><p><b>지원대상</b> ${esc(s.target)}</p><p><b>신청·연계</b> ${esc(s.method)}</p><p><b>현재 접수·대기·예산</b> 담당기관 별도 확인 필요 (상시 운영 및 기존 공고는 신청 가능 보증이 아닙니다)</p>${s.externalProgram?`<p><b>접수·안내기간</b> ${esc(s.externalProgram.periodText||[s.externalProgram.opensOn,s.externalProgram.closesOn].filter(Boolean).join(' ~ ')||'원문 확인 필요')}</p><p><small>자료 확인일 ${esc(s.externalProgram.verifiedOn)} · 출처 ${esc(s.externalProgram.sourceName||'공고 원문')}</small></p>`:''}${(s.contacts||[]).filter(c=>c.dept||c.phone).map(c=>`<p><b>접수창구</b> ${esc(c.dept)} ${esc(c.phone)}${c.hours?` · ${esc(c.hours)}`:''}</p>`).join('')}${(s.rounds||[]).map(r=>`<p><b>${esc(r.name)}</b> ${esc(r.opens_on||'')} ~ ${esc(r.closes_on||'')} · ${esc(model.roundState(r))} ${safe(r.source_url)?`<a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">모집공고 원문 ↗</a>`:''}</p>`).join('')}${s.externalProgram&&safe(s.externalProgram.additionalUrl)?`<a class="program-link" href="${esc(s.externalProgram.additionalUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.externalProgram.additionalSourceName||'추가 공식 안내')} ↗</a>`:''}${source?`<a class="program-link" href="${esc(source)}" target="_blank" rel="noopener noreferrer">사업 안내·접수 확인 ↗</a>`:''}</section>`;
  }
  function card(o){const svcs=services(o), fav=favorites.has(o.id), cls={오산시:'osan',경기도:'gyeonggi','전국 공공':'national',민간:'private','전국 민간':'private'}[o.scope||o.level];
    const tel=(o.phone||'').split(/[~\/,]/)[0].replace(/[^0-9+]/g,'');
    return `<article class="org-card" id="org-${esc(o.id)}"><div class="org-upper"><div class="org-type"><span class="region-label ${cls}">${esc(o.scope||(o.level==='민간'?'전국 공공·민간':o.level))}</span><span class="type-label">${esc(o.kind)}</span>${allDay(o)?'<span class="allday-label">24시간</span>':''}</div><button class="star-button ${fav?'active':''}" data-action="favorite" data-id="${o.id}" type="button" aria-label="${esc(o.name)} 즐겨찾기 ${fav?'해제':'추가'}" aria-pressed="${fav}"><svg class="ads-icon" viewBox="0 0 24 24" width="20" height="20" fill="${fav?'currentColor':'none'}" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></button></div><h3 class="org-name"><button type="button" class="org-name-open" data-action="open" data-id="${o.id}" aria-haspopup="dialog">${esc(o.name)}</button></h3><p class="org-summary">${esc(o.summary)}</p><div class="tag-cloud">${svcs.slice(0,4).map(s=>`<span class="service-tag">${esc(s.name)}</span>`).join('')}${svcs.length>4?`<span class="service-tag">+${svcs.length-4}개</span>`:''}</div><div class="card-footer"><span class="service-total">${filtered()?'조건 일치':'등록'} 서비스 <strong>${svcs.length}</strong>개 / 전체 ${o.services.length}개</span><span class="card-actions">${tel?`<a class="card-call" href="tel:${esc(tel)}" aria-label="${esc(o.name)} 전화 ${esc(o.phone)}">전화</a>`:''}<button class="expand-button" data-action="open" data-id="${o.id}" type="button" aria-haspopup="dialog">사업·모집 확인 <span aria-hidden="true">→</span></button></span></div><label class="print-choice pick-chip"><input type="checkbox" data-action="select" data-id="${o.id}" ${selected.has(o.id)?'checked':''}/> <span>연계 시트에 담기</span></label></article>`;
  }
  // 기관 상세는 카드 안에서 펼치지 않고 창(dialog)으로 연다: 목록 자리를 지키고, 휴대폰에서는 화면 전체로 본다.
  function detailHTML(o){const svcs=services(o);return `${contactHTML(o)}<div class="detail-heading">${filtered()?'조건에 일치한':'제공'} 서비스 · ${svcs.length}개${filtered()&&svcs.length<o.services.length?` <small>(전체 ${o.services.length}개 중)</small>`:''}</div>${svcs.map(serviceHTML).join('')}<div class="detail-links"><button type="button" class="share-link" data-action="share" data-id="${o.id}">기관 링크 복사 ↗</button><button type="button" class="share-link rc-open" data-action="correct" data-id="${o.id}" aria-expanded="false">정보 정정 알리기</button></div>`}
  // 창 아래 고정 단추: 전화 걸기 · 연계 시트에 담기(휴대폰에서 긴 서비스 목록을 내려도 늘 보인다)
  function footHTML(o){const tel=(o.phone||'').split(/[~\/,]/)[0].replace(/[^0-9+]/g,'');return `${tel?`<a class="dlg-primary dlg-call" href="tel:${esc(tel)}">전화 걸기 <small>${esc(o.phone)}</small></a>`:''}<label class="print-choice pick-chip dlg-select"><input type="checkbox" data-action="select" data-id="${o.id}" ${selected.has(o.id)?'checked':''}/> <span>연계 시트에 담기</span></label>`}
  let lastOpener=null;
  function openOrg(id,opener){const o=all.find(x=>x.id===id),dlg=$('#orgDialog');if(!o||!dlg)return;lastOpener=opener||null;
    $('#orgDialogKicker').textContent=[o.scope||o.level,o.kind].filter(Boolean).join(' · ');
    $('#orgDialogTitle').innerHTML=safe(o.site)?`<a href="${esc(o.site)}" target="_blank" rel="noopener noreferrer">${esc(o.name)} ↗</a>`:esc(o.name);
    $('#orgDialogBody').innerHTML=detailHTML(o);if($('#orgDialogFoot'))$('#orgDialogFoot').innerHTML=footHTML(o);$('#orgDialogBody').dataset.id=o.id;
    showDialog(dlg);$('#orgDialogBody').scrollTop=0;}
  function showDialog(dlg){if(typeof dlg.showModal==='function'){if(!dlg.open)dlg.showModal()}else dlg.setAttribute('open','');document.documentElement.classList.add('dlg-lock')}
  function closeDialog(dlg){if(dlg.open){if(typeof dlg.close==='function')dlg.close();else dlg.removeAttribute('open')}}
  function render(){const list=visible();$('#statOrgs').textContent=all.filter(o=>live(o)&&o.services.length).length;$('#statServices').textContent=all.reduce((n,o)=>n+o.services.length,0);const tabLevels=[...document.querySelectorAll('#regionTabs [data-level]')].map(b=>b.dataset.level).filter(l=>l!=='전체'&&all.some(o=>!['중단','폐지'].includes(o.status)&&(o.scope||o.level)===l));if($('#statLevels')){$('#statLevels').textContent=String(tabLevels.length).padStart(2,'0');$('#statLevelNames').textContent=tabLevels.map(l=>l.replace(' ','\u00a0')).join(' · ')}$('#resultCount').textContent=list.length;$('#serviceResultCount').textContent=`· ${filtered()?'조건 일치':'등록'} 서비스 ${list.reduce((n,o)=>n+services(o).length,0)}개`;
    $('#resultGrid').innerHTML=list.slice(0,state.limit).map(card).join('');$('#emptyState').hidden=!!list.length;if(!list.length)emptySuggest();$('#loadMore').hidden=list.length<=state.limit;
    $('#favoritesOnly').checked=state.onlyFavorites;$('#allDayOnly').checked=state.allDay;$('#sortSelect').value=state.sort;
    for(const [key,id] of Object.entries(filters))$('#'+id).value=state[key];
    document.querySelectorAll('#regionTabs [data-level]').forEach(b=>{const on=b.dataset.level===state.level;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});
    $('#categoryFilters').innerHTML=['',...data.taxonomy.need].map(t=>`<button type="button" data-need="${esc(t)}" class="${state.need===t?'active':''}" aria-pressed="${state.need===t}">${esc(t||'전체')}</button>`).join('');
    $('#printCount').textContent=selected.size;$('#printSheet').disabled=!selected.size;
    $('#loadStatus').hidden=true;
    facets(list.length);syncURL();
  }
  // 필터마다 남는 기관 수를 보여 주고, 0곳이 되는 선택지는 고를 수 없게 한다(지금 고른 값은 그대로 둔다).
  function facets(n){
    document.querySelectorAll('#regionTabs [data-level]').forEach(b=>{let c=b.querySelector('.facet-n');if(!c){c=document.createElement('span');c.className='facet-n';b.append(c)}c.textContent=countWith({level:b.dataset.level})});
    document.querySelectorAll('#categoryFilters [data-need]').forEach(b=>{const k=countWith({need:b.dataset.need});b.insertAdjacentHTML('beforeend',` <span class="facet-n">${k}</span>`);if(!k&&state.need!==b.dataset.need){b.disabled=true;b.title='지금 조건에서는 0곳'}});
    for(const [key,id] of Object.entries(filters)){const sel=$('#'+id);[...sel.options].forEach(op=>{if(!op.dataset.label){op.dataset.label=op.textContent;op.setAttribute('value',op.value)}const k=countWith({[key]:op.value});op.textContent=op.dataset.label+(op.value?` (${k})`:'');op.disabled=!!op.value&&!k&&state[key]!==op.value})}
    const active=activeList();$('#activeChips').innerHTML=active.length?active.map(a=>`<button type="button" class="active-chip" data-clear="${a.key}" aria-label="${esc(a.label)} 조건 지우기">${esc(a.label)} <span aria-hidden="true">×</span></button>`).join('')+'<button type="button" class="active-chip clear-all" data-clear="*">모두 지우기</button>':'';
    const fc=$('#filterCount');if(fc){fc.hidden=!active.length;fc.textContent=active.length}
    if($('#sheetCount'))$('#sheetCount').textContent=n;
    const nb=$('#needBento');if(nb&&!nb.dataset.ready){nb.dataset.ready='1';nb.innerHTML=['소득·생계','의료·건강','정신건강','교육','주거','돌봄'].filter(t=>data.taxonomy.need.includes(t)).map(t=>`<button type="button" data-bento-need="${esc(t)}"><b>${esc(t)}</b><small>${all.filter(o=>live(o)&&o.services.some(s=>(s.tags?.need||[]).includes(t))).length}곳</small></button>`).join('')}
    const bar=$('#printBar');if(bar)bar.classList.toggle('has-pick',selected.size>0);
  }
  const LABEL={level:'범주',need:'욕구',audience:'대상',kind:'기관유형',form:'지원형태',intake:'접수경로',operation:'운영형태',local:'오산 접수',application:'모집 상태'};
  function activeList(){const out=[];if(state.keyword)out.push({key:'keyword',label:`검색어 "${state.keyword}"`});
    for(const k of Object.keys(LABEL))if(state[k]&&state[k]!==defaults[k])out.push({key:k,label:`${LABEL[k]}: ${state[k]}`});
    if(state.allDay)out.push({key:'allDay',label:'24시간 창구만'});if(state.onlyFavorites)out.push({key:'onlyFavorites',label:'즐겨찾기만'});return out}
  // 검색 조건을 주소에 남겨, 새로고침·뒤로가기·링크 공유 때 같은 결과가 보이게 한다(#org= 바로가기와는 따로).
  const URLKEYS={keyword:'q',level:'level',need:'need',audience:'aud',kind:'kind',form:'form',intake:'intake',operation:'op',local:'local',application:'app',allDay:'24h',sort:'sort'};
  function syncURL(){try{const u=new URL(location.href);for(const [k,q] of Object.entries(URLKEYS)){const v=state[k];if(v&&v!==defaults[k])u.searchParams.set(q,v===true?'1':v);else u.searchParams.delete(q)}if(u.href!==location.href)history.replaceState(null,'',u)}catch{}}
  function readURL(){try{const u=new URL(location.href);for(const [k,q] of Object.entries(URLKEYS)){const v=u.searchParams.get(q);if(v==null)continue;if(k==='allDay')state.allDay=v==='1';else state[k]=String(v).slice(0,60)}
    if(state.level!=='전체'&&![...document.querySelectorAll('#regionTabs [data-level]')].some(b=>b.dataset.level===state.level))state.level='전체';$('#keyword').value=state.keyword}catch{}}
  const refresh=()=>{state.limit=8;render()};
  let toastTimer;function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
  $('#quickTags').innerHTML=['의료비','위기가정','청소년','장애아동','주거지원','자립','한부모'].map(q=>`<button type="button" class="quick-tag" data-query="${q}"># ${q}</button>`).join('');
  // 0건일 때: 검색어를 자료에 쓰인 말로 바꿔 볼 수 있게 바로 누를 말을 보여 준다(필터는 그대로).
  function emptySuggest(){const box=$('#emptySuggest');if(!box)return;const own=model.suggestWords?model.suggestWords(state.keyword):[];
    // 두 낱말 이상이면 모두 들어간 서비스만 찾으므로, 낱말 하나씩 찾아볼 수 있게 먼저 보여 준다.
    const parts=state.keyword.split(/\s+/).filter(Boolean);const solo=parts.length>1?parts.filter(w=>countWith({keyword:w})>0):[];
    const words=[...new Set([...solo,...(own.length?own:['상담','긴급복지','정신건강','주거','의료비','취업'])])].filter(w=>model.norm(w)!==model.norm(state.keyword)).slice(0,6);
    box.innerHTML='<span>이런 말로 찾아보세요</span>'+words.map(w=>`<button type="button" class="quick-tag" data-query="${w}"># ${w}</button>`).join('');}
  document.addEventListener('click',e=>{const b=e.target.closest('#emptySuggest [data-query]');if(b){state.keyword=b.dataset.query;$('#keyword').value=state.keyword;refresh()}});
  $('#quickTags').addEventListener('click',e=>{const b=e.target.closest('[data-query]');if(b){state.keyword=b.dataset.query;$('#keyword').value=state.keyword;refresh()}});
  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();state.keyword=$('#keyword').value.trim();refresh()});
  $('#keyword').addEventListener('input',e=>{state.keyword=e.target.value.trim();refresh()});
  $('#regionTabs').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(b){state.level=b.dataset.level;refresh()}});
  $('#categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-need]');if(b){state.need=b.dataset.need;refresh()}});
  for(const [key,id] of Object.entries(filters))$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;refresh()});
  $('#favoritesOnly').addEventListener('change',e=>{state.onlyFavorites=e.target.checked;refresh()});
  $('#allDayOnly').addEventListener('change',e=>{state.allDay=e.target.checked;refresh()});
  $('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;refresh()});
  function reset(){Object.assign(state,defaults);$('#keyword').value='';refresh()}
  $('#resetFilters').addEventListener('click',reset);$('#emptyReset').addEventListener('click',reset);
  $('#loadMore').addEventListener('click',()=>{state.limit+=8;render()});
  $('#resultGrid').addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id,o=all.find(o=>o.id===id);if(!o)return;
    if(b.dataset.action==='favorite'){if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem(STORE,JSON.stringify([...favorites]))}catch{}render();toast(favorites.has(id)?'즐겨찾기에 추가했습니다.':'즐겨찾기에서 제외했습니다.')}
    if(b.dataset.action==='open'){openOrg(id,b)}
    if(b.dataset.action==='share'){const u=new URL(location.href);u.hash='org='+id;try{await navigator.clipboard.writeText(u.toString());toast('기관 링크를 복사했습니다.')}catch{toast('브라우저 주소를 복사해 주세요.')}}
    if(b.dataset.action==='select')toggleSelect(id,b);
  });
  function toggleSelect(id,box){if(selected.has(id))selected.delete(id);else if(selected.size<5)selected.add(id);else{box.checked=false;toast('최대 5개 기관까지 선택할 수 있습니다.');return}
    document.querySelectorAll(`[data-action="select"][data-id="${id}"]`).forEach(x=>{x.checked=selected.has(id)});$('#printCount').textContent=selected.size;$('#printSheet').disabled=!selected.size;$('#printBar')?.classList.toggle('has-pick',selected.size>0)}
  // 창 안의 버튼(즐겨찾기 제외)도 같은 동작을 쓴다. 정보 정정 알리기는 resource-correction.js가 .org-details 안에서 처리한다.
  $('#orgDialog').addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.dataset.id;
    if(b.dataset.action==='select')toggleSelect(id,b);
    if(b.dataset.action==='share'){const u=new URL(location.href);u.search='';u.hash='org='+id;try{await navigator.clipboard.writeText(u.toString());toast('기관 링크를 복사했습니다.')}catch{toast('브라우저 주소를 복사해 주세요.')}}});
  // 모든 창: 닫기 버튼·바깥(어두운 면) 누르기·Esc로 닫고, 연 버튼으로 초점을 돌려준다.
  document.querySelectorAll('dialog.v9-dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target===d)closeDialog(d)});
    d.addEventListener('close',()=>{if(![...document.querySelectorAll('dialog.v9-dialog')].some(x=>x.open))document.documentElement.classList.remove('dlg-lock');if(d.id==='filterDialog')dockFilters();const back=d.id==='orgDialog'?lastOpener:d._opener;if(back&&document.contains(back))back.focus({preventScroll:true});else if(d.id==='orgDialog'){const id=$('#orgDialogBody').dataset.id;$(`#org-${id} .expand-button`)?.focus({preventScroll:true})}})});
  // 긴급 전화: 맨 아래 띠의 번호 목록을 그대로 창에 옮겨 보여 준다(번호를 두 곳에서 따로 관리하지 않음).
  $('#sosOpen')?.addEventListener('click',e=>{const d=$('#helpDialog'),list=document.querySelector('.help-now-list');if(list&&!$('#helpDialogList').firstChild)$('#helpDialogList').append(list.cloneNode(true));d._opener=e.currentTarget;showDialog(d)});
  // 휴대폰·좁은 화면: 조건 칸을 아래에서 올라오는 창으로 연다. 넓은 화면에서는 왼쪽 사이드바에 그대로 둔다.
  const side=$('#filterSide'),sideHome=side?.parentNode,sideNext=side?.nextSibling;
  function dockFilters(){if(side&&side.parentNode!==sideHome)sideHome.insertBefore(side,sideNext)}
  $('#openFilters')?.addEventListener('click',e=>{const d=$('#filterDialog');d.append(side);d._opener=e.currentTarget;showDialog(d);side.querySelector('button,select,input')?.focus()});
  $('#closeFilters')?.addEventListener('click',()=>closeDialog($('#filterDialog')));
  $('#applyFilters')?.addEventListener('click',()=>{closeDialog($('#filterDialog'));$('#searchArea .finder-main')?.scrollIntoView({block:'start'})});
  $('#activeChips').addEventListener('click',e=>{const b=e.target.closest('[data-clear]');if(!b)return;const k=b.dataset.clear;if(k==='*'){reset();return}state[k]=defaults[k];if(k==='keyword')$('#keyword').value='';refresh()});
  $('#needBento')?.addEventListener('click',e=>{const b=e.target.closest('[data-bento-need]');if(!b)return;state.need=b.dataset.bentoNeed;refresh();$('#searchArea')?.scrollIntoView({block:'start'})});
  $('#clearPrint').addEventListener('click',()=>{selected.clear();render()});
  $('#printSheet').addEventListener('click',e=>{const d=$('#printDialog');$('#printDialogList').innerHTML=all.filter(o=>selected.has(o.id)).map(o=>`<li><div><b>${esc(o.name)}</b><small>${esc(o.phone||'전화 확인 필요')} · 서비스 ${o.services.length}개</small></div><button type="button" data-unpick="${o.id}" aria-label="${esc(o.name)} 빼기">빼기</button></li>`).join('');d._opener=e.currentTarget;showDialog(d)});
  $('#printDialogList').addEventListener('click',e=>{const b=e.target.closest('[data-unpick]');if(!b)return;selected.delete(b.dataset.unpick);b.closest('li').remove();render();if(!selected.size)closeDialog($('#printDialog'))});
  $('#printNow').addEventListener('click',()=>{closeDialog($('#printDialog'));
    $('#printArea').innerHTML=`<h1>복지자원 연계 확인 시트</h1><p>출력일 ${esc(model.today())} · 기관 ${selected.size}곳 · 신청 가능 여부는 직접 확인해 주세요.</p>`+all.filter(o=>selected.has(o.id)).map(o=>`<section><h2>${esc(o.name)}</h2><p>대표전화: ${esc(o.phone||'—')}<br/>주소: ${esc(o.address||'주소 확인 필요')}<br/>팩스: ${esc(o.contact?.fax||'—')}<br/>이메일: ${esc(o.contact?.email||'—')}<br/>대표 홈페이지: ${esc(o.site||'—')}</p>${o.services.map(s=>`<p><b>${esc(s.name)}</b> · ${esc(s.target)}<br/>신청·연계: ${esc(s.method)}</p>${s.externalProgram?`<p><b>접수·안내기간</b> ${esc(s.externalProgram.periodText||[s.externalProgram.opensOn,s.externalProgram.closesOn].filter(Boolean).join(' ~ ')||'원문 확인 필요')}</p><p><small>자료 확인일 ${esc(s.externalProgram.verifiedOn)} · 출처 ${esc(s.externalProgram.sourceName||'공고 원문')}</small></p>`:''}`).join('')}<p>□ 관할·대상 확인　□ 접수기간 확인　□ 담당창구 확인　□ 이용 의사 확인</p></section>`).join('');window.print();
  });
  // 자료 상태 한눈에(대시보드): 서비스 확인 상태와 다시 확인할 때가 지난 수. 숫자는 data.js·programs.json에서 바로 센다.
  function dashboard(){const box=$('#dataDash');if(!box)return;const svc=all.filter(live).flatMap(o=>o.services);const n=svc.length||1;
    const st=[['확인완료','공식 근거 확인','ok'],['사업별 확인 필요','사업마다 확인','check'],['미확인','아직 확인 전','none']].map(([k,label,tone])=>({k,label,tone,v:svc.filter(s=>(s.verification?.status||'미확인')===k).length}));
    const due=svc.filter(s=>model.recheckDue&&model.recheckDue(s)).length,open=svc.filter(s=>model.applicationState(s)==='모집중').length;
    box.innerHTML=`<div class="dash-head"><h3>자료 상태 한눈에</h3><p>서비스 ${svc.length}개 기준 · 자료 정리일 ${esc(data.date||'')}</p></div><div class="dash-tiles"><div><b>${st[0].v}</b><span>공식 근거로 확인</span></div><div><b>${st[1].v+st[2].v}</b><span>이용 전 기관 확인 필요</span></div><div><b>${due}</b><span>다시 확인할 때 지남</span></div><div><b>${open}</b><span>지금 모집중 표시</span></div></div><div class="dash-bar" role="img" aria-label="${st.map(x=>`${x.k} ${x.v}개`).join(', ')}">${st.map(x=>`<span class="seg ${x.tone}" style="flex:${x.v}" title="${esc(x.k)} ${x.v}개 (${Math.round(x.v/n*100)}%)"></span>`).join('')}</div><ul class="dash-legend">${st.map(x=>`<li><i class="${x.tone}" aria-hidden="true"></i>${esc(x.k)} <b>${x.v}</b> <small>${Math.round(x.v/n*100)}%</small></li>`).join('')}</ul>`}
  function openDeepLink(){const id=location.hash.replace(/^#org=/,'');if(id==='438b636f15'){Object.assign(state,defaults);state.keyword='행정복지센터';$('#keyword').value=state.keyword;refresh();requestAnimationFrame(()=>$('#searchArea')?.scrollIntoView({block:'start'}));return;}if(!all.some(o=>o.id===id))return;Object.assign(state,defaults);$('#keyword').value='';state.limit=Math.max(8,all.findIndex(o=>o.id===id)+1);render();const el=$('#org-'+id);if(el){el.style.scrollMarginTop='96px';el.scrollIntoView({block:'start'})}openOrg(id,el?.querySelector('.expand-button'))}
  readURL();
  window.ProgramFeed?.load(data).then(()=>{render();dashboard()});
  render();dashboard();if(location.hash.startsWith('#org='))openDeepLink();window.addEventListener('hashchange',openDeepLink);
})();
