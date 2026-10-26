/* OY-RALS paged report v1 (UI): turns the paged deep interpretation into pages the practitioner swipes through.
   Progressive enhancement only — without this file the pages stack and everything stays readable.
   Printing and exports keep the full report: the print styles unfold every page. */
(function(){'use strict';
const host=document.getElementById('journey88');
if(!host)return;
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function pageTitle(p){const h=p.querySelector('.odi-open h2');return h?h.textContent.trim():(p.getAttribute('aria-label')||'')}

function setup(article){
 const track=article.querySelector(':scope > .odi-pagetrack');
 if(!track)return;
 const pages=Array.prototype.slice.call(track.children).filter(n=>n.classList.contains('odi-page'));
 if(pages.length<2)return;
 article.classList.add('odi-swipe');
 const total=pages.length;
 pages.forEach((p,i)=>{
  const idx=p.querySelector('.odi-page-index');
  if(idx)idx.textContent=String(i+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
 });

 const bar=document.createElement('nav');
 bar.className='odi-pager';bar.setAttribute('aria-label','해석지 페이지 이동');
 bar.innerHTML='<button type="button" class="odi-pager-btn" data-odi-prev aria-label="이전 장">‹</button>'
  +'<div class="odi-pager-where"><b aria-live="polite"></b><div class="odi-dots" role="tablist"></div></div>'
  +'<button type="button" class="odi-pager-btn" data-odi-next aria-label="다음 장">›</button>';
 article.insertBefore(bar,track);
 const prev=bar.querySelector('[data-odi-prev]'),next=bar.querySelector('[data-odi-next]');
 const where=bar.querySelector('b'),dots=bar.querySelector('.odi-dots');
 pages.forEach((p,i)=>{
  const d=document.createElement('button');d.type='button';d.setAttribute('role','tab');
  d.setAttribute('aria-label',(i+1)+'장 '+pageTitle(p));
  d.addEventListener('click',()=>go(i));dots.append(d);
 });
 // Contents on the cover, and a "next chapter" button at the end of every page.
 const toc=article.querySelector('.odi-toc');
 if(toc)pages.forEach((p,i)=>{
  if(!i)return;
  const b=document.createElement('button');b.type='button';
  b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>';
  b.append(pageTitle(p));b.addEventListener('click',()=>go(i));toc.append(b);
 });
 pages.forEach((p,i)=>{
  if(i===total-1)return;
  const b=document.createElement('button');b.type='button';b.className='odi-next';
  b.innerHTML='<span>다음 장 · '+String(i+2).padStart(2,'0')+'</span>';
  const strong=document.createElement('b');strong.textContent=pageTitle(pages[i+1]);
  b.firstChild.after(strong);
  const arrow=document.createElement('i');arrow.setAttribute('aria-hidden','true');arrow.textContent='›';b.append(arrow);
  b.addEventListener('click',()=>go(i+1));p.append(b);
 });

 let cur=0;
 const fit=()=>{const p=pages[cur];if(p)track.style.height=p.scrollHeight+'px';};
 function show(i){
  cur=i;
  where.textContent=(i+1)+' / '+total+' · '+pageTitle(pages[i]);
  prev.disabled=i===0;next.disabled=i===total-1;
  Array.prototype.forEach.call(dots.children,(d,j)=>{
   d.classList.toggle('is-on',j===i);d.classList.toggle('is-done',j<i);
   d.setAttribute('aria-selected',j===i?'true':'false');
  });
  pages.forEach((p,j)=>p.setAttribute('aria-hidden',j===i?'false':'true'));
  fit();
 }
 function go(i){
  i=Math.max(0,Math.min(total-1,i));
  track.scrollTo({left:pages[i].offsetLeft-track.offsetLeft,behavior:reduce?'auto':'smooth'});
  show(i);
  const top=bar.getBoundingClientRect().top+window.scrollY-12;
  if(window.scrollY>top)window.scrollTo({top,behavior:reduce?'auto':'smooth'});
 }
 prev.addEventListener('click',()=>go(cur-1));
 next.addEventListener('click',()=>go(cur+1));
 let t=null;
 track.addEventListener('scroll',()=>{
  if(t)clearTimeout(t);
  t=setTimeout(()=>{
   const x=track.scrollLeft;let best=0,bd=Infinity;
   pages.forEach((p,j)=>{const d=Math.abs(p.offsetLeft-track.offsetLeft-x);if(d<bd){bd=d;best=j}});
   if(best!==cur)show(best);
  },90);
 },{passive:true});
 article.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select,details'))return;
  if(e.key==='ArrowRight'){go(cur+1);e.preventDefault();}
  if(e.key==='ArrowLeft'){go(cur-1);e.preventDefault();}
 });
 if(window.ResizeObserver)new ResizeObserver(fit).observe(track);
 window.addEventListener('resize',fit);
 // Opening a details block (the appendix) or asking the AI changes the page height.
 article.addEventListener('toggle',fit,true);
 article.addEventListener('click',()=>setTimeout(fit,120));
 window.addEventListener('beforeprint',()=>{track.style.height='auto'});
 window.addEventListener('afterprint',fit);
 show(0);
}

function scan(){
 document.querySelectorAll('.oy-deep-report.odi-paged').forEach(a=>{
  if(a.dataset.odiPager)return;
  a.dataset.odiPager='1';
  try{setup(a)}catch(_){a.classList.remove('odi-swipe')}
 });
}
let queued=false;
const observer=new MutationObserver(()=>{
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{
  queued=false;observer.disconnect();
  try{scan()}finally{observer.observe(host,{childList:true,subtree:true})}
 });
});
scan();
observer.observe(host,{childList:true,subtree:true});
})();
