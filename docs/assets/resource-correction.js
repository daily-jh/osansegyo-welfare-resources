/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
/* 복지자원 찾기 · 정보 정정 알리기(2026-11-11)
   기관 카드를 펼치면 '정보 정정 알리기'가 있다. GitHub 로그인 없이 바로 보낼 수 있게, 청소년 시스템이 이미 쓰는 의견 창구
   (osan-youth-usage Worker의 /feedback, kind 'report', 영역 '02 지역자원 연계')로 보낸다. Worker는 바꾸지 않는다.
   본문 첫 줄을 '[복지자원 정정]'으로 시작해 관리 화면(youth-risk/feedback-admin.html)이 따로 모아 본다.
   대상자 정보가 섞이지 않도록 보내기 전에 화면에서 막고, 서버도 같은 규칙으로 한 번 더 거절한다. */
(function(root){'use strict';
const ENDPOINT='https://osan-youth-usage.daily-89.workers.dev';
const AREA='02 지역자원 연계',HEAD='[복지자원 정정]';
const WHAT=['전화번호','주소·위치','운영 시간','서비스 내용·대상','운영 중단·이전','기타'];
const PII=[[/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/,'휴대전화 번호'],[/[\w.+-]+@[\w-]+\.[\w.-]+/,'이메일 주소'],[/\d{6}[\s-]?[1-4]\d{6}/,'주민등록번호'],
 [/(학생|아동|아이|내담자|대상자|이용자)\s*(이름|성명)/,'대상자 이름'],[/[가-힣]{2,12}(초등학교|중학교|고등학교)\s*[1-6]\s*학년\s*\d{1,2}\s*반/,'학교·학년·반']];
const piiFound=t=>PII.filter(([re])=>re.test(t)).map(([,n])=>n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function compose(org,picked,text){return HEAD+' '+org.name+' ('+org.id+')\n항목: '+(picked.length?picked.join(', '):'선택 안 함')+'\n내용: '+String(text||'').trim()}
function form(org){const id='rc-'+org.id;
 return '<form class="rc-form" data-rc-org="'+esc(org.id)+'" novalidate><p class="rc-lead"><strong>'+esc(org.name)+'</strong> 정보 중 바뀐 것을 알려 주세요. 담당자가 공식 자료로 확인한 뒤 고칩니다.</p>'+
  '<fieldset class="rc-what"><legend>무엇이 다른가요?</legend>'+WHAT.map(w=>'<label><input type="checkbox" value="'+esc(w)+'"> '+esc(w)+'</label>').join('')+'</fieldset>'+
  '<label class="rc-label" for="'+id+'-t">바르게 고칠 내용과 근거(공식 홈페이지 주소 등)</label><textarea id="'+id+'-t" maxlength="600" rows="3" placeholder="예: 대표전화가 031-000-0000으로 바뀌었습니다. 근거: 기관 홈페이지 공지"></textarea>'+
  '<label class="rc-ok"><input type="checkbox" class="rc-okbox"> 대상자 이름·개인 연락처·상담 내용은 적지 않았습니다.</label>'+
  '<div class="rc-btns"><button type="submit" class="rc-send">보내기</button><button type="button" class="rc-cancel">닫기</button></div><p class="rc-status" role="status" aria-live="polite"></p></form>'}
async function send(f,org){const st=f.querySelector('.rc-status'),ta=f.querySelector('textarea');
 const picked=[...f.querySelectorAll('.rc-what input:checked')].map(x=>x.value),text=ta.value.trim();
 if(text.length<5){st.textContent='고칠 내용을 다섯 글자 이상 적어 주세요.';ta.focus();return}
 const found=piiFound(text);if(found.length){st.textContent='개인정보로 보이는 내용('+found.join('·')+')이 있습니다. 지우고 다시 보내 주세요. 기관 대표전화는 031-처럼 지역번호로 적어 주세요.';ta.focus();return}
 if(!f.querySelector('.rc-okbox').checked){st.textContent='개인정보 확인 항목을 선택해 주세요.';f.querySelector('.rc-okbox').focus();return}
 const btn=f.querySelector('.rc-send');btn.disabled=true;st.textContent='보내는 중입니다…';
 try{const r=await fetch(ENDPOINT+'/feedback',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',
   body:JSON.stringify({kind:'report',area:AREA,role:'',body:compose(org,picked,text)})});
  if(r.ok){f.innerHTML='<p class="rc-done" role="status">고맙습니다. 정정 내용을 받았습니다. 확인 전까지는 지금 정보가 그대로 보일 수 있습니다.</p>';return}
  if(r.status===422){const j=await r.json().catch(()=>({}));st.textContent='개인정보로 보이는 내용('+((j.found||[]).join('·')||'확인 필요')+')이 있어 받지 않았습니다.'}
  else if(r.status===429)st.textContent='오늘 보낼 수 있는 횟수를 넘었습니다. 내일 다시 보내 주세요.';
  else st.textContent='지금은 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
 }catch(_){st.textContent='인터넷 연결을 확인해 주세요. 계속 안 되면 아래 「자료 갱신·오류 제보」의 다른 방법을 써 주세요.'}
 btn.disabled=false;}
function find(id){const d=root.WELFARE_DATA;return d&&(d.organizations||[]).find(o=>o.id===id)}
if(typeof document!=='undefined'){
 document.addEventListener('click',e=>{
  const open=e.target.closest('[data-action="correct"]');
  if(open){const org=find(open.dataset.id),box=open.closest('.org-details');if(!org||!box)return;
   let f=box.querySelector('.rc-form');if(!f){box.insertAdjacentHTML('beforeend',form(org));f=box.querySelector('.rc-form');}
   open.setAttribute('aria-expanded','true');f.querySelector('input,textarea').focus();return}
  const cancel=e.target.closest('.rc-cancel');if(cancel){const f=cancel.closest('.rc-form'),b=f.closest('.org-details')?.querySelector('[data-action="correct"]');f.remove();if(b){b.setAttribute('aria-expanded','false');b.focus()}}
 });
 document.addEventListener('submit',e=>{const f=e.target.closest('.rc-form');if(!f)return;e.preventDefault();const org=find(f.dataset.rcOrg);if(org)send(f,org)});
}
const api={compose,piiFound,AREA,HEAD,ENDPOINT};
if(typeof module!=='undefined')module.exports=api;else root.ResourceCorrection=api;
})(typeof window!=='undefined'?window:globalThis);
