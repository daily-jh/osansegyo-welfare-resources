/* OY-RALS 보기 설정 v1 — F5 역할로 시작하기, F8 큰 글씨·고대비.
   역할과 보기 설정만 이 브라우저에 기억한다(localStorage). 학생 응답·서술은 저장하지 않는다. */
(function(root){'use strict';
const doc=root.document;if(!doc)return;
const KEY='oy-rals-prefs-v1';
const ROLES=[['teacher','담임교사','school'],['edu','교육복지사','school'],['team','학맞통 지원팀','school'],['cwc','사회복지관','agency'],['child','아동·가족기관','agency'],['admin','행정복지센터','agency']];
const read=()=>{try{return JSON.parse(root.localStorage.getItem(KEY)||'{}')||{}}catch(_){return {}}};
const write=v=>{try{root.localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}};
let prefs=read();
const role=()=>ROLES.find(r=>r[0]===prefs.role)||null;
function applyView(){
  const h=doc.documentElement;h.classList.toggle('oy-text-lg',prefs.text==='lg');h.classList.toggle('oy-text-xl',prefs.text==='xl');h.classList.toggle('oy-contrast',!!prefs.contrast);
  doc.querySelectorAll('[data-oy-text]').forEach(b=>b.setAttribute('aria-pressed',String((prefs.text||'base')===b.dataset.oyText)));
  doc.querySelectorAll('[data-oy-contrast]').forEach(b=>b.setAttribute('aria-pressed',String(!!prefs.contrast)));
  doc.querySelectorAll('[data-oy-role]').forEach(b=>b.setAttribute('aria-pressed',String(prefs.role===b.dataset.oyRole)));
  const now=doc.getElementById('oyRoleNow');if(now){const r=role();const sc=root.OYOnePage&&root.OYOnePage.SCOPE[r&&r[0]];now.textContent=r?(sc?sc.end:r[1]+' 기준으로 03·04 자료와 다음 단계 버튼을 맞춥니다.'):'선택하지 않으면 모든 역할 자료를 같은 순서로 보여 줍니다.';}
  emphasise();
}
/* 02 지도 아래 두 갈래 버튼 중 역할에 맞는 쪽을 주 버튼으로 */
function emphasise(){
  const r=role(),s=doc.getElementById('toSchoolSupport'),a=doc.getElementById('confirmLinkageReview');if(!s||!a||!a.parentNode)return;
  const school=!r||r[2]==='school';s.classList.toggle('flow-primary',school);a.classList.toggle('flow-primary',!r||!school);
  if(school){if(s.nextElementSibling!==a)a.before(s);}else if(a.nextElementSibling!==s)a.after(s);
}
function mount(){
  const welcome=doc.getElementById('welcome'),grid=welcome&&welcome.querySelector('.home-role-grid');
  if(grid&&!doc.getElementById('oyRoleStart')){
    const sec=doc.createElement('section');sec.id='oyRoleStart';sec.className='flow-wrap oy-role';sec.setAttribute('aria-labelledby','oyRoleTitle');
    sec.innerHTML='<h2 id="oyRoleTitle">어떤 역할로 쓰시나요?</h2><p>모든 학생에게 쓰는 도구가 아닙니다. 걱정되는 학생이 있을 때 씁니다. 역할을 고르면 평가 뒤 <b>핵심 결과 한 장</b>에 그 역할의 다음 할 일과 <b>어디까지 하면 되는지</b>가 나옵니다. 고르지 않아도 됩니다.</p><div class="oy-role-list" role="group" aria-label="역할 선택">'+ROLES.map(r=>'<button type="button" data-oy-role="'+r[0]+'" aria-pressed="false">'+r[1]+'</button>').join('')+'</div><span class="oy-role-now" id="oyRoleNow" role="status"></span>';
    grid.after(sec);
  }
  const head=doc.querySelector('.flow-header');
  if(head&&!doc.getElementById('oyPrefs')){
    const bar=doc.createElement('div');bar.id='oyPrefs';bar.className='flow-wrap oy-prefs';bar.setAttribute('aria-label','보기 설정');
    bar.innerHTML='<span>글자</span><span role="group" aria-label="글자 크기"><button type="button" data-oy-text="base" aria-pressed="true">보통</button><button type="button" data-oy-text="lg" aria-pressed="false">크게</button><button type="button" data-oy-text="xl" aria-pressed="false">더 크게</button></span><span role="group" aria-label="고대비"><button type="button" data-oy-contrast aria-pressed="false">고대비</button></span>';
    head.append(bar);
  }
  applyView();
}
doc.addEventListener('click',e=>{
  const t=e.target&&e.target.closest?e.target:null;if(!t)return;
  const r=t.closest('[data-oy-role]');if(r){prefs.role=prefs.role===r.dataset.oyRole?'':r.dataset.oyRole;write(prefs);applyView();return;}
  const x=t.closest('[data-oy-text]');if(x){prefs.text=x.dataset.oyText;write(prefs);applyView();return;}
  const c=t.closest('[data-oy-contrast]');if(c){prefs.contrast=!prefs.contrast;write(prefs);applyView();return;}
});
root.addEventListener('oy-journey-view',()=>setTimeout(emphasise,0));
root.OYRole=Object.freeze({roles:ROLES,current:()=>prefs.role||'',pack:kind=>{const r=role();return r&&r[2]===kind?r[0]:''}});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof window!=='undefined'?window:globalThis);
/* F7 오프라인 열기: https 배포에서만 등록한다(로컬 테스트 서버는 제외). */
(function(root){'use strict';
const nav=root.navigator;if(!nav||!('serviceWorker' in nav)||root.location.protocol!=='https:')return;
root.addEventListener('load',()=>{nav.serviceWorker.register('../oy-sw.js',{scope:'../'}).then(()=>{const bar=root.document.getElementById('oyPrefs');if(bar&&!root.document.getElementById('oyOffline')){const s=root.document.createElement('span');s.id='oyOffline';s.textContent='한 번 연 뒤에는 인터넷 없이도 열립니다';bar.prepend(s);}}).catch(()=>{});});
})(typeof window!=='undefined'?window:globalThis);
