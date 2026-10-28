/* OY-RALS 의견 관리 화면. 관리 비밀번호는 sessionStorage에만 두며(탭을 닫으면 사라짐) 사이트 코드·저장소에는 없다. */
(function(){'use strict';
const $=id=>document.getElementById(id),base=()=>String(window.YOUTH_USAGE_ENDPOINT||'').replace(/\/+$/,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABEL={new:'새 제보',done:'처리 완료',pending:'승인 대기',approved:'공개 중',hidden:'숨김'};
let items=[],filter='all';
const token=()=>{try{return sessionStorage.getItem('oyfbAdmin')||''}catch(_){return $('faToken').value}};
const api=(path,opt={})=>fetch(base()+path,{...opt,credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()}});
function render(){const shown=items.filter(x=>filter==='all'||(filter==='report'?x.kind==='report':x.kind==='review'&&x.status===filter));
 $('faList').innerHTML=shown.length?shown.map(x=>'<article class="fa-item"><div class="oyfb-meta"><span class="fa-tag '+x.kind+'">'+(x.kind==='report'?'오류·수정 요청':'사용 후기 '+esc(x.rating)+'점')+'</span><span>'+esc(LABEL[x.status]||x.status)+'</span><span>'+esc(x.area)+'</span>'+(x.role?'<span>'+esc(x.role)+'</span>':'')+'<time>'+esc(x.day)+'</time></div><p>'+esc(x.body)+'</p><div class="fa-btns">'+
  (x.kind==='review'?(x.status!=='approved'?'<button data-a="approve" data-id="'+esc(x.id)+'">공개</button>':'')+(x.status!=='hidden'?'<button data-a="hide" data-id="'+esc(x.id)+'">숨김</button>':''):(x.status!=='done'?'<button data-a="done" data-id="'+esc(x.id)+'">처리 완료</button>':'<button data-a="reopen" data-id="'+esc(x.id)+'">다시 열기</button>'))+
  '<button data-a="delete" data-id="'+esc(x.id)+'">삭제</button></div></article>').join(''):'<p class="oyfb-muted">해당하는 의견이 없습니다.</p>';}
async function load(){const st=$('faStatus');if(!base()){st.textContent='서버 주소가 없습니다.';return}st.textContent='불러오는 중입니다.';
 try{const r=await api('/feedback/admin');if(r.status===401){st.textContent='관리 비밀번호가 맞지 않습니다.';return}if(!r.ok){st.textContent='불러오지 못했습니다('+r.status+'). 의견 기능 배포 여부를 확인하세요.';return}
  items=(await r.json()).items||[];st.textContent='의견 '+items.length+'건 · 새 제보 '+items.filter(x=>x.status==='new').length+'건 · 승인 대기 '+items.filter(x=>x.status==='pending').length+'건';render();}catch(_){st.textContent='불러오지 못했습니다. 인터넷 연결을 확인하세요.'}}
$('faLoad').addEventListener('click',()=>{try{sessionStorage.setItem('oyfbAdmin',$('faToken').value.trim())}catch(_){}$('faToken').value='';load()});
document.querySelector('.fa-filter').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;document.querySelectorAll('[data-f]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});
$('faList').addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
 if(a==='delete'&&!confirm('이 의견을 완전히 지울까요? 되돌릴 수 없습니다.'))return;b.disabled=true;
 const r=a==='delete'?await api('/feedback/admin/delete',{method:'POST',body:JSON.stringify({id})}):await api('/feedback/admin',{method:'POST',body:JSON.stringify({id,action:a})});
 if(!r.ok)$('faStatus').textContent='처리하지 못했습니다('+r.status+').';await load()});
if(token())load();
})();
