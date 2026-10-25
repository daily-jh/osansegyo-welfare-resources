/* OY-RALS V8.6 · presentation-only adapter.
 * All evidence, goals, CORE decisions originate in original site-bridge-v86.js → unified-v86.js.
 * This file NEVER evaluates risk, rewrites score or creates additional case facts.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYUnifiedSiteV86=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='8.6.0-display';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const paragraph=s=>'<p>'+esc(s)+'</p>';
function html(x){
 if(!x?.canonical86)return '';
 const state=x.canonical86,evidence=state['K-CARR']?.evidence||[],goals=state.ICMS?.goals||[];
 const sources=state['K-CARR']?.facts||[];
 const section=(heading,body)=>'<section class="formulation-section"><h3>'+esc(heading)+'</h3>'+body+'</section>';
 const parts=[];
 parts.push(section('종합 사정 · 학생의 상황',(x.sections82||[]).map(s=>'<h4>'+esc(s.title)+'</h4>'+paragraph(s.text)).join('')+
  '<p class="formulation-judgement"><strong>'+esc(x.judgement||'학생의 희망과 직접 근거 확인 필요')+'</strong></p>'));
 const item=(r,i)=>'<article class="formulation-priority" data-case-goal="'+esc(r.canonicalId||r.id)+'"><h4>'+(i+1)+'. '+esc(r.title)+'</h4><dl>'+
  '<div><dt>학생에게 필요한 변화</dt><dd>'+esc(r.goal)+'</dd></div>'+
  '<div><dt>지금 실행할 일</dt><dd><strong>'+esc(r.action)+'</strong></dd></div>'+
  '<div><dt>교사·학교의 역할</dt><dd>'+esc(r.teacher)+'</dd></div>'+
  '<div><dt>사회복지사·지역의 역할</dt><dd>'+esc(r.worker)+'</dd></div>'+
  '<div><dt>개입 후 확인할 것</dt><dd>'+esc(r.measure)+'</dd></div></dl></article>';
 const lead=x.lead||[],others=x.others||[];
 parts.push(section('판정에 따른 우선 개입계획',lead.length?lead.map(item).join(''):'<p>확정할 지원과제가 없습니다. 학생의 생활과 원하는 도움을 먼저 확인합니다.</p>'+
  (others.length?'<details><summary>함께 확인할 나머지 과제 '+others.length+'개</summary>'+others.map((r,i)=>item(r,i+lead.length)).join('')+'</details>':'')));
 parts.push('<details class="formulation-section"><summary>판정 근거·서술 인식·문항 불일치 확인 ('+evidence.length+'개)</summary>'+
   '<p>입력한 문장의 긍정·부정·가정·미확인 인식은 자동 판별입니다. 실제 사실확정과 안전조치는 담당자가 직접 수행합니다.</p>'+
   (sources.length?'<h4>보고된 생활정보·강점·자원</h4><ul>'+sources.slice(0,20).map(v=>'<li>'+esc(v.text)+'</li>').join('')+'</ul>':'')+
   (evidence.length?'<h4>원문별 근거</h4><ol>'+evidence.slice(0,30).map(v=>'<li>'+esc(v.id+' ['+v.polarity+'] '+(v.excerpt||v.text||''))+'</li>').join('')+'</ol>':'<p>구체적인 서술형 자료 없음</p>')+
   (x.pending?.length?'<h4>실무자에게 남길 확인 질문</h4><ul>'+x.pending.slice(0,20).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul>':'')+
   '<p><strong>공식 CORE 점수·안전판정은 변경하지 않았습니다.</strong> 보고된 안전 징후는 별도 직접 확인이 필요합니다.</p></details>');
 parts.push('<p class="formulation-section">V8.6 통합사정 초안 · 모든 목표·회의·지원 이행은 담당자의 확인과 학생 의견을 거쳐야 합니다. 실증 타당도가 확립된 진단도구가 아닙니다.</p>');
 return parts.join('');
}
function text(x){
 if(!x?.canonical86)return '';
 return ['[V8.6 통합사정 · 협의 전]',...(x.sections82||[]).map(s=>s.title+'\n'+s.text),'종합 판단\n'+(x.judgement||'면담에서 확인 필요'),
  '[우선 개입목표]',...(x.rows||[]).map((r,i)=>(i+1)+'. '+r.title+'\n목표: '+r.goal+'\n첫 행동: '+r.action+'\n교사: '+r.teacher+'\n사회복지사: '+r.worker+'\n점검: '+r.measure),
  '[추가 확인]',...(x.pending||[]),'[주의] 실제 면담·안전·동의·서비스 제공 여부는 담당자가 확인합니다.'].join('\n\n');
}
return Object.freeze({VERSION,html,text});});
