/* 참고문헌·근거 통합 페이지: oy-evidence-v1(새 근거), oy-grade-lens-v1(S1~S12), research-v1/SOURCES_19.json(L01~L19)을 그린다.
   기존 [1]~[18]은 references.html 안의 정적 목록을 그대로 둔다. */
(function(){'use strict';
const EV=window.OYEvidence,GL=window.OYGradeLens,$=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const link=(ref,url)=>url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref)+'</a>':esc(ref);
const tag=id=>'<a class="ref-cite" href="#'+esc(id)+'">'+esc(id)+'</a>';
const old=n=>'<a class="ref-cite" href="#source-'+esc(n)+'">['+esc(n)+']</a>';
const cites=(ev,o)=>(ev||[]).map(tag).concat((o||[]).map(old)).join(' ');
function render(){
 if(!EV){$('evidenceRules').innerHTML='<li>근거 목록을 불러오지 못했습니다. 새로고침해 주세요.</li>';return}
 $('evidenceRules').innerHTML=EV.RULES.map(r=>'<li><strong>'+esc(r.rule)+'</strong> <span class="ref-cites">'+cites(r.ev,r.old)+'</span></li>').join('');
 const lv=EV.LEVEL,names={monitor:'관찰·예방',brief:'단기 개별지원',general:'일반 사례관리',intensive:'집중 사례관리',crisis:'위기개입 후 집중 사례관리'};
 $('evidenceDomains').innerHTML=EV.DOMAIN.map(d=>'<details class="ref-domain"><summary>'+esc(d.name)+'</summary><p>'+esc(d.why)+'</p><p class="ref-cites">'+cites(d.ev,d.old)+'</p></details>').join('')
  +'<details class="ref-domain"><summary>개입 수준 5단계</summary><ul>'+Object.keys(names).map(k=>'<li><strong>'+esc(names[k])+'</strong> '+esc(lv[k].why)+' <span class="ref-cites">'+cites(lv[k].ev)+'</span></li>').join('')+'</ul><p class="ref-scope">'+esc(lv.note)+'</p></details>';
 const sel=$('evidenceFilter');Object.keys(EV.FIELDS).forEach(k=>{if(EV.SOURCES.some(s=>s.field===k)){const o=document.createElement('option');o.value=k;o.textContent=EV.FIELDS[k];sel.append(o)}});
 const draw=()=>{const f=sel.value,list=EV.SOURCES.filter(s=>!f||s.field===f);
  $('evidenceList').innerHTML=list.map(s=>'<li id="'+esc(s.id)+'"><p><strong>['+esc(s.id)+']</strong> <span class="ref-kind">'+esc(EV.KINDS[s.kind])+' · '+esc(EV.FIELDS[s.field])+'</span></p><p>'+link(s.ref,s.url)+'</p><p class="source-use">반영 내용: '+esc(s.use)+'</p></li>').join('');
  $('evidenceCount').textContent=list.length+'건';};
 sel.addEventListener('change',draw);draw();
 $('gradeList').innerHTML=GL?GL.SOURCES.map(s=>'<li id="'+esc(s.id)+'"><p><strong>['+esc(s.id)+']</strong> '+esc(s.ref)+'</p><p class="source-use">반영 내용: '+esc(s.use)+'</p></li>').join(''):'<li>학년 해석 근거를 불러오지 못했습니다.</li>';
 fetch('research-v1/SOURCES_19.json').then(r=>r.ok?r.json():Promise.reject()).then(d=>{
  $('researchList').innerHTML=(d.sources||[]).map(s=>'<li id="'+esc(s.id)+'"><p><strong>['+esc(s.id)+']</strong> '+link(s.title,s.url)+'</p><p class="source-meta">'+esc(s.scope)+'</p></li>').join('');
 }).catch(()=>{$('researchList').innerHTML='<li><a href="research-v1/SOURCES_19.json">출처 원장(JSON) 열기</a></li>'});
 if(location.hash){const t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
