/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
/* OY-RALS 첫 화면 창(팝업) — 2026-11-12
   첫 화면에서 평가 시작까지 길이를 줄이려고, 읽어 두면 되는 안내는 누를 때만 창으로 보여 준다.
   · 5단계 활용 방법: #howItWorks 카드의 글을 그대로 옮겨 보여 준다(문구를 두 곳에서 따로 관리하지 않음).
   · 긴급 전화: 평가를 기다리지 않고 바로 걸 수 있는 번호.
   판정·점수·단계 이동 로직은 건드리지 않는다. 대상자 정보는 다루지 않는다. */
(function(root){'use strict';
const CALLS=[['112','경찰','범죄·학대·실종 긴급',true],['119','소방','응급·화재',true],['109','자살 위기','24시간 상담'],['1388','청소년','24시간 상담'],['117','학교폭력','신고·상담'],['1366','여성폭력','가정·성폭력·스토킹'],['129','복지 위기','긴급복지 상담']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const callsHTML=()=>'<ul class="oy-pop-calls">'+CALLS.map(([n,l,d,red])=>'<li><a href="tel:'+n+'" aria-label="'+esc(l)+' '+n+' 전화 걸기"'+(red?' class="oy-pop-red"':'')+'><strong>'+n+'</strong><span>'+esc(l)+'</span><small>'+esc(d)+'</small></a></li>').join('')+'</ul>';
function stepsHTML(doc){const box=doc.getElementById('howItWorks');if(!box)return '';
 return '<ol class="oy-pop-steps">'+[...box.querySelectorAll('article')].map(a=>{const n=a.querySelector('.step-number'),h=a.querySelector('h2'),p=a.querySelector('p');
  return '<li><span class="oy-pop-num">'+esc(n?n.textContent:'')+'</span><div><b>'+esc(h?h.textContent:'')+'</b><p>'+esc(p?p.textContent:'')+'</p></div></li>'}).join('')+'</ol>'}
function dialog(doc,id,kicker,title,body){let d=doc.getElementById(id);
 if(!d){d=doc.createElement('dialog');d.id=id;d.className='oy-pop';d.setAttribute('aria-labelledby',id+'Title');
  d.innerHTML='<div class="oy-pop-head"><div><span class="oy-pop-kicker">'+esc(kicker)+'</span><h2 id="'+id+'Title">'+esc(title)+'</h2></div><button type="button" class="oy-pop-close" data-oy-pop-close>닫기</button></div><div class="oy-pop-body"></div>';
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-oy-pop-close]'))d.close()});
  d.addEventListener('close',()=>{if(d._opener&&doc.contains(d._opener))d._opener.focus({preventScroll:true})});
  doc.body.appendChild(d)}
 d.querySelector('.oy-pop-body').innerHTML=body;return d}
function open(d,opener){d._opener=opener||null;if(typeof d.showModal==='function'){if(!d.open)d.showModal()}else d.setAttribute('open','')}
function init(doc){
 const how=doc.querySelector('[data-oy-how]'),steps=doc.getElementById('howItWorks'),cap=doc.querySelector('#welcome .welcome-caption');
 const showHow=opener=>open(dialog(doc,'oyHowPop','HOW IT WORKS','5단계 활용 방법',stepsHTML(doc)+(cap?'<p class="oy-pop-note">'+esc(cap.textContent)+'</p>':'')),opener);
 if(how&&steps)how.addEventListener('click',e=>{e.preventDefault();showHow(how)});
 if(steps){steps.classList.add('oy-steps-strip');steps.querySelectorAll('article').forEach(a=>{a.setAttribute('role','button');a.setAttribute('tabindex','0');a.setAttribute('aria-haspopup','dialog');
   a.addEventListener('click',()=>showHow(a));a.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showHow(a)}})})}
 const call=doc.querySelector('[data-oy-calls]');
 if(call)call.addEventListener('click',()=>open(dialog(doc,'oyCallPop','CALL NOW','지금 바로 전화','<p class="oy-pop-lead">생명·신체가 위험하면 <strong>112·119가 먼저</strong>입니다. 평가를 마칠 때까지 기다리지 않습니다.</p>'+callsHTML()),call));
}
const api={CALLS,stepsHTML,callsHTML,init};
if(typeof module!=='undefined')module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(document));else init(document)}
})(typeof window!=='undefined'?window:globalThis);
