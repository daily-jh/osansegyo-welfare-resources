/* OY-RALS 이용자 의견 — ① 오류·수정 요청(비공개, 관리자만 열람) ② 사용 후기(관리자가 승인한 글만 아래에 공개)
   ③ 전문가 검토(비공개, 교육복지사·학맞통 지원팀 등 시험 운영 검토단이 가상사례로 써 본 뒤 남기는 구조화 검토지).
   ③은 Worker를 바꾸지 않으려고 kind 'report'로 보내고 본문 첫 줄을 '[전문가 검토]'로 시작한다(관리 화면이 이 머리로 따로 모아 본다).
   서버는 기존 이용현황 Worker의 /feedback 경로. 학생을 알아볼 수 있는 정보는 보내기 전에 화면에서 먼저 막고, 서버도 같은 규칙으로 거절한다.
   Worker에 의견 기능이 아직 배포되지 않았으면 '준비 중'으로 보이고 보내기를 막는다. */
(function(root){'use strict';
const AREAS=['01 선별평가','02 지역자원 연계','03 학교 지원','04 기관 사례관리','05 최종 보고서','추가 자료 · 척도 자료실','전체·기타'];
const ROLES=[['','선택 안 함'],['교사','교사'],['교육복지사·상담교사','교육복지사·상담교사'],['사회복지사','사회복지사'],['행정복지센터','행정복지센터'],['기타','기타']];
const FACES=[['😞','아쉬워요'],['🙁','조금 아쉬워요'],['😐','보통이에요'],['🙂','좋아요'],['😍','아주 좋아요']];
const EXPERT_ROLES=[['교육복지사','교육복지사·상담교사'],['학맞통 지원팀','기타'],['담임교사','교사'],['복지관·Wee 실무자','사회복지사'],['기타','기타']];
const EXPERT_HEAD='[전문가 검토]';
const PICKS=['학생을 이해하는 데 좋아요','실무에 바로 쓸 수 있을 것 같아요','위기 신호를 놓치지 않게 도와줘요','판정 근거가 분명해요','척도 결과를 쉽게 설명할 수 있어요','학교·기관과 함께 보기 좋아요','사례회의·보고서 준비가 쉬워져요','지역 자원을 찾기 편해요','시간이 줄어들어요','화면이 쉽고 보기 좋아요'];
const PII=[[/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/,'휴대전화 번호'],[/[\w.+-]+@[\w-]+\.[\w.-]+/,'이메일 주소'],[/\d{6}[\s-]?[1-4]\d{6}/,'주민등록번호'],
 [/(학생|아동|아이|내담자|대상자)\s*(이름|성명)/,'학생 이름'],[/[가-힣]{2,12}(초등학교|중학교|고등학교)\s*[1-6]\s*학년\s*\d{1,2}\s*반/,'학교·학년·반']];
const piiFound=t=>PII.filter(([re])=>re.test(t)).map(([,n])=>n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=()=>String(root.YOUTH_USAGE_ENDPOINT||'').replace(/\/+$/,'');
let ready=false;
const scale=(name,lo,hi)=>'<span class="oyfb-scale" role="radiogroup">'+[1,2,3,4,5].map(i=>'<label><input type="radio" name="'+name+'" value="'+i+'"><b>'+i+'</b></label>').join('')+'</span><small class="oyfb-ends">1 '+lo+' · 5 '+hi+'</small>';
const choice=(name,opts)=>'<span class="oyfb-choice" role="radiogroup">'+opts.map(o=>'<label><input type="radio" name="'+name+'" value="'+esc(o)+'">'+esc(o)+'</label>').join('')+'</span>';
function expertHtml(){return '<div class="oyfb-expert" id="oyfbExpert" hidden>'+
 '<p class="oyfb-guide">가상사례로 써 본 뒤 남겨 주세요. 실제 학생 정보는 쓰지 않습니다. 항목마다 고르고, 이유는 아래 칸에 짧게 적어 주세요.</p>'+
 '<div class="oyfb-row"><label>검토자 구분<select id="oyfbExRole">'+EXPERT_ROLES.map(([l])=>'<option>'+esc(l)+'</option>').join('')+'</select></label>'+
 '<label>써 본 가상사례<select id="oyfbExCase"><option>가상사례 A</option><option>가상사례 B</option><option>가상사례 C</option><option>여러 사례</option></select></label>'+
 '<label>입력에 걸린 시간<span class="oyfb-min"><input id="oyfbExMin" type="number" min="1" max="120" inputmode="numeric"> 분</span></label></div>'+
 '<ol class="oyfb-qs">'+
 '<li><b>결과 타당성</b> 시스템 판단(급한 정도·통합사례관리·주관기관)이 내 실무 판단과 맞나요?'+choice('oyfbExFit',['맞다','조금 다르다','다르다'])+'</li>'+
 '<li><b>분량</b> 핵심 결과 한 장의 양은 어떤가요?'+choice('oyfbExSize',['많다','알맞다','부족하다'])+'</li>'+
 '<li><b>역할 범위</b> 내 역할 안내(무엇을 하고 누구에게 넘기는지)가 현장과 맞나요?'+choice('oyfbExScope',['맞다','조금 다르다','다르다'])+'</li>'+
 '<li><b>쓰기 쉬움</b>'+scale('oyfbExEase','어렵다','쉽다')+'</li>'+
 '<li><b>정식 운영 때 쓸 생각</b>'+scale('oyfbExUse','없다','꼭 쓰겠다')+'</li>'+
 '</ol></div>';}
function html(){return '<div class="oyfb-head"><span class="oyfb-kicker">의견 보내기</span><h2 id="oyFeedbackTitle">시스템을 쓰며 느낀 점을 알려 주세요</h2>'+
 '<p>시험 운영 기간의 오류 제보와 사용 후기를 받아 정식 운영 전에 고칩니다. <strong>학생·가족·학교 이름, 연락처, 사례 내용은 쓰지 마세요.</strong></p></div>'+
 '<div class="oyfb-tabs" role="tablist" aria-label="의견 종류"><button type="button" role="tab" id="oyfbTabReport" aria-selected="true" data-oyfb-kind="report">오류·수정 요청 <small>비공개</small></button><button type="button" role="tab" id="oyfbTabReview" aria-selected="false" data-oyfb-kind="review">사용 후기 <small>승인 후 공개</small></button><button type="button" role="tab" id="oyfbTabExpert" aria-selected="false" data-oyfb-kind="expert">전문가 검토 <small>검토단 · 비공개</small></button></div>'+
 '<form class="oyfb-form" novalidate><p class="oyfb-mode" id="oyfbMode"></p>'+
 '<div class="oyfb-row"><label id="oyfbAreaWrap">어느 화면인가요<select id="oyfbArea">'+AREAS.map(a=>'<option>'+esc(a)+'</option>').join('')+'</select></label>'+
 '<label>쓰는 분<select id="oyfbRole">'+ROLES.map(([v,l])=>'<option value="'+esc(v)+'">'+esc(l)+'</option>').join('')+'</select></label>'+
 '<fieldset class="oyfb-rating" id="oyfbRating" hidden><legend>써 보니 어땠나요</legend>'+FACES.map(([f,t],i)=>'<label><input type="radio" name="oyfbRate" value="'+(i+1)+'"'+(i===3?' checked':'')+'><span class="oyfb-face" aria-hidden="true">'+f+'</span><b class="oyfb-score">'+(i+1)+'점</b>'+t+'</label>').join('')+'</fieldset></div>'+
 '<fieldset class="oyfb-picks" id="oyfbPicks" hidden><legend>좋았던 점을 눌러 주세요 <small>여러 개 가능</small></legend>'+PICKS.map(t=>'<button type="button" aria-pressed="false" data-oyfb-pick="'+esc(t)+'">'+esc(t)+'</button>').join('')+'</fieldset>'+
 expertHtml()+
 '<label class="oyfb-text"><span id="oyfbTextLabel">내용</span><textarea id="oyfbBody" rows="5" maxlength="1000"></textarea><small id="oyfbCount">0 / 1000자</small></label>'+
 '<label class="oyfb-check"><input type="checkbox" id="oyfbOk"> 학생·가족·학교 이름, 연락처, 사례 내용을 쓰지 않았습니다.</label>'+
 '<div class="oyfb-actions"><button type="submit" class="flow-btn flow-primary" id="oyfbSend">보내기</button><p class="oyfb-status" id="oyfbStatus" role="status" aria-live="polite"></p></div></form>'+
 '<section class="oyfb-public" aria-labelledby="oyfbPublicTitle"><h3 id="oyfbPublicTitle">사용 후기</h3><div id="oyfbList"><p class="oyfb-muted">불러오는 중입니다.</p></div></section>';}
function mount(){
 const box=document.getElementById('oyFeedback');if(!box||box.dataset.ready)return;box.dataset.ready='1';box.innerHTML=html();
 const $=id=>document.getElementById(id);let kind='report';
 const setKind=k=>{kind=k;box.querySelectorAll('[data-oyfb-kind]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.oyfbKind===k)));
  $('oyfbRating').hidden=k!=='review';$('oyfbPicks').hidden=k!=='review';$('oyfbAreaWrap').hidden=k!=='report';$('oyfbExpert').hidden=k!=='expert';$('oyfbRole').closest('label').hidden=k==='expert';
  $('oyfbMode').textContent=k==='report'?'관리자만 읽습니다. 틀린 해석·문구, 고장 난 버튼, 기관 정보 오류를 알려 주세요.':k==='expert'?'시험 운영 검토단(교육복지사·학맞통 지원팀·교사·기관 실무자)용 검토지입니다. 관리자만 읽고, 모은 의견은 정식 운영 전 반영 결과와 함께 돌려드립니다.':'관리자가 확인한 뒤 아래 목록에 공개됩니다. 실제 사례가 짐작되는 내용은 공개하지 않습니다.';
  $('oyfbTextLabel').textContent=k==='report'?'무엇이 어떻게 잘못되었나요':k==='expert'?'이유와 제안 (한 장에서 뺄 것·더할 것, 다르게 본 점, 낯선 용어)':'더 하고 싶은 말 (선택)';
  $('oyfbBody').placeholder=k==='report'?'예: 05 최종 보고서 2쪽 목표 표의 점수 칸이 비어 보입니다.':k==='expert'?'예: 가상사례 B는 학교 안에서 먼저 지원할 사례로 봤습니다. 한 장에 보호자 상담 여부가 있으면 좋겠습니다.':'예: 사례회의 전에 판정 근거를 한 장으로 볼 수 있어 좋았습니다.';$('oyfbStatus').textContent=ready?'':notReady;};
 const notReady='의견 창구를 준비하고 있습니다. 곧 열립니다.';
 box.querySelector('.oyfb-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-oyfb-kind]');if(b)setKind(b.dataset.oyfbKind)});
 box.querySelector('.oyfb-picks').addEventListener('click',e=>{const b=e.target.closest('[data-oyfb-pick]');if(b)b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'))});
 $('oyfbBody').addEventListener('input',()=>{$('oyfbCount').textContent=$('oyfbBody').value.length+' / 1000자'});
 box.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const st=$('oyfbStatus');
  if(!ready){st.textContent=notReady;return}
  const text=$('oyfbBody').value.trim(),picks=kind==='review'?[...box.querySelectorAll('[data-oyfb-pick][aria-pressed="true"]')].map(b=>b.dataset.oyfbPick):[];
  let body=[picks.join(' · '),text].filter(Boolean).join('\n');
  if(kind==='expert'){const v=n=>(box.querySelector('input[name="'+n+'"]:checked')||{}).value||'';
   const fit=v('oyfbExFit'),size=v('oyfbExSize'),scope=v('oyfbExScope'),ease=v('oyfbExEase'),use=v('oyfbExUse'),min=String($('oyfbExMin').value||'').replace(/\D/g,'');
   if(!fit||!size||!scope||!ease||!use){st.textContent='다섯 항목을 모두 골라 주세요.';return}
   body=[EXPERT_HEAD+' '+$('oyfbExRole').value+' · '+$('oyfbExCase').value+(min?' · 입력 '+min+'분':''),
    '판정 일치 '+fit+' · 분량 '+size+' · 역할 범위 '+scope+' · 쓰기 쉬움 '+ease+'/5 · 도입 의향 '+use+'/5',text].filter(Boolean).join('\n');}
  if(body.length<5){st.textContent=kind==='review'?'좋았던 점을 하나 이상 누르거나 5자 이상 써 주세요.':'내용을 5자 이상 써 주세요.';$('oyfbBody').focus();return}
  if(body.length>1000){st.textContent='1000자 안으로 줄여 주세요.';return}
  const found=piiFound(body);if(found.length){st.textContent=found.join('·')+'로 보이는 내용이 있습니다. 지우고 다시 보내 주세요.';$('oyfbBody').focus();return}
  if(!$('oyfbOk').checked){st.textContent='개인정보 확인 항목을 선택해 주세요.';$('oyfbOk').focus();return}
  const msg={kind:kind==='expert'?'report':kind,area:kind==='report'?$('oyfbArea').value:'전체·기타',role:kind==='expert'?(EXPERT_ROLES.find(r=>r[0]===$('oyfbExRole').value)||['','기타'])[1]:$('oyfbRole').value,body};if(kind==='review')msg.rating=+(box.querySelector('input[name="oyfbRate"]:checked')?.value||4);
  $('oyfbSend').disabled=true;st.textContent='보내는 중입니다.';
  try{const r=await fetch(base()+'/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(msg),credentials:'omit',referrerPolicy:'no-referrer'});
   if(r.status===201){$('oyfbBody').value='';box.querySelectorAll('[data-oyfb-pick]').forEach(b=>b.setAttribute('aria-pressed','false'));$('oyfbOk').checked=false;$('oyfbCount').textContent='0 / 1000자';if(kind==='expert')box.querySelectorAll('.oyfb-expert input[type=radio]').forEach(i=>{i.checked=false});st.textContent=kind==='report'?'보냈습니다. 확인 후 고치겠습니다.':kind==='expert'?'검토지를 받았습니다. 정식 운영 전 반영 결과와 함께 돌려드리겠습니다.':'보냈습니다. 확인 후 공개됩니다.'}
   else if(r.status===422){const j=await r.json().catch(()=>({}));st.textContent=((j.found||[]).join('·')||'개인정보')+'로 보이는 내용이 있어 받지 않았습니다. 지우고 다시 보내 주세요.'}
   else if(r.status===429)st.textContent='오늘 보낼 수 있는 의견 수를 넘었습니다. 내일 다시 보내 주세요.';
   else st.textContent='보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
  }catch(_){st.textContent='보내지 못했습니다. 인터넷 연결을 확인해 주세요.'}finally{$('oyfbSend').disabled=false}});
 /* 검토단에게는 주소 끝에 #expert-review를 붙여 보내면 검토지 탭이 바로 열린다. */
 setKind(/^#expert-review$/.test(root.location&&root.location.hash||'')?'expert':'report');load();
 if(kind==='expert')setTimeout(()=>box.scrollIntoView({block:'start'}),300);
}
async function load(){const list=document.getElementById('oyfbList');if(!list)return;
 if(!base()){ready=false;list.innerHTML='<p class="oyfb-muted">의견 창구를 준비하고 있습니다.</p>';return}
 try{const r=await fetch(base()+'/feedback/reviews',{credentials:'omit',referrerPolicy:'no-referrer'});const j=r.ok?await r.json():null;
  // 의견 기능이 없는 옛 Worker는 다른 모양(집계)을 돌려준다 → 준비 중으로 둔다.
  if(!j||!Array.isArray(j.reviews))throw Error('not ready');ready=true;const st=document.getElementById('oyfbStatus');if(st&&/준비/.test(st.textContent))st.textContent='';
  list.innerHTML=j.reviews.length?'<ul class="oyfb-reviews">'+j.reviews.map(v=>'<li><div class="oyfb-meta"><span class="oyfb-stars">'+esc((r=>FACES[r-1][0]+' '+r+'점 '+FACES[r-1][1])(Math.min(5,Math.max(1,+v.rating||4))))+'</span>'+(v.role?'<span>'+esc(v.role)+'</span>':'')+'<time>'+esc(v.day)+'</time></div><p>'+esc(v.body)+'</p></li>').join('')+'</ul>':'<p class="oyfb-muted">아직 공개된 후기가 없습니다. 첫 후기를 남겨 주세요.</p>';
 }catch(_){ready=false;list.innerHTML='<p class="oyfb-muted">의견 창구를 준비하고 있습니다. 곧 열립니다.</p>';const st=document.getElementById('oyfbStatus');if(st&&!st.textContent)st.textContent='의견 창구를 준비하고 있습니다. 곧 열립니다.'}}
root.OYFeedback={piiFound,AREAS,EXPERT_HEAD,reload:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
