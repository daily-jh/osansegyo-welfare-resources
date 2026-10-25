
(function(){
const allowed=['정서·심리','학교폭력','가족·돌봄','경제·주거','학습·교육','장애·발달','사례관리'];
const q=new URLSearchParams(location.search);
const from=q.get('domains')||'';
const requested=from.split(',').filter(x=>allowed.includes(x));
function apply(){const boxes=[...document.querySelectorAll('#filters input')];if(!boxes.length)return;for(const el of boxes)el.checked=requested.includes(el.value);if(requested.length&&typeof render==='function')render();}
setTimeout(apply,700);
const note=document.createElement('section');
note.innerHTML='<h2>개인정보 없는 평가 연계</h2><p class="muted">지원영역 이름만 URL로 전달할 수 있습니다. 학생 이름, 점수, 서술자료, 상담기록은 전달하지 않습니다. 기존 평가 페이지의 자동 연동은 아직 연결되지 않았습니다.</p><button id="copy-link">현재 선택 영역 공유 링크 복사</button><p id="copy-status" aria-live="polite"></p>';
document.querySelector('main').append(note);
document.getElementById('copy-link').addEventListener('click',async()=>{const selected=[...document.querySelectorAll('#filters input:checked')].map(x=>x.value).filter(x=>allowed.includes(x));const url=new URL(location.href);url.search=selected.length?'?domains='+encodeURIComponent(selected.join(',')):'';try{await navigator.clipboard.writeText(url.href);document.getElementById('copy-status').textContent='영역만 포함한 링크를 복사했습니다.'}catch(e){document.getElementById('copy-status').textContent=url.href}});
})();
