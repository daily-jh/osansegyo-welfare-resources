/* Research report download menu (top right of the header).
   Fills every [data-report-download] element. data-base is the path to docs/reports/ from the page. */
(function(){'use strict';
const VERSION='20261027-rev5';
const EDITION='개정판 · 2026.10.27';
const FILES=[
 {title:'연구·기술검토 보고서',note:'척도·모델·자원연계·타당화 계획',stem:'oy-rals-research-report-rev-20261027',name:'OY-RALS_연구기술검토보고서_개정판_20261027'},
 {title:'해설 및 실무판정지침',note:'문항별 해석카드·결과 화면 읽는 법',stem:'oy-rals-practice-guide-rev-20261027',name:'OY-RALS_해설및실무판정지침_개정판_20261027'},
 {title:'모델·자원·AI 구조도',note:'A4 가로 · 화면과 모듈 대응',stem:'oy-rals-architecture-diagram-rev-20261027',name:'OY-RALS_모델자원AI구조도_개정판_20261027'},
 {title:'후속 시스템화 운영설계',note:'데이터 표준·연계 상태·검증 로드맵',stem:'oy-rals-operations-design-rev-20261026',name:'OY-RALS_후속시스템화운영설계_개정판_20261026'},
 {title:'현장평가 양식',note:'종이 25문항·수기 판정·자원연계 서식(인쇄용)',stem:'oy-rals-field-form-rev-20261026',name:'OY-RALS_현장평가양식_개정판_20261026',pdfOnly:true}
];
const ICON='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let seq=0;
function build(host){
 if(host.dataset.reportReady)return;host.dataset.reportReady='1';
 const base=host.dataset.base||'reports/';const id='report-dl-panel-'+(++seq);
 const rows=FILES.map(f=>'<li><div class="report-dl-copy"><b>'+esc(f.title)+'</b><span>'+esc(f.note)+'</span></div><div class="report-dl-links">'+
  '<a href="'+esc(base+f.stem+'.pdf?v='+VERSION)+'" download="'+esc(f.name+'.pdf')+'" aria-label="'+esc(f.title+' PDF 다운로드')+'">PDF</a>'+
  (f.pdfOnly?'':'<a href="'+esc(base+f.stem+'.docx?v='+VERSION)+'" download="'+esc(f.name+'.docx')+'" aria-label="'+esc(f.title+' Word 다운로드')+'">Word</a>')+'</div></li>').join('');
 host.classList.add('report-dl');
 host.innerHTML='<details><summary aria-controls="'+id+'">'+ICON+'<span>'+esc(host.dataset.label||'연구보고서 다운로드')+'</span></summary>'+
  '<div class="report-dl-panel" id="'+id+'"><p class="report-dl-head"><b>OY-RALS 연구자료</b><span>'+EDITION+'</span></p><ul>'+rows+'</ul>'+
  (host.dataset.extra==='resources'?'<p class="report-dl-head report-dl-sub"><b>복지자원 데이터</b><span>기관·서비스 목록</span></p><ul><li><div class="report-dl-copy"><b>전체 자원 목록</b><span>오산시·경기도·전국 기관과 서비스</span></div><div class="report-dl-links"><a href="resources.csv" download aria-label="전체 자원 목록 CSV 다운로드">CSV</a></div></li></ul>':'')+
  '<p class="report-dl-foot">PDF가 기준본입니다. Word는 기관 양식에 맞춰 고쳐 쓸 수 있습니다. 실제 학생 사례는 담겨 있지 않으며, 수록 사례는 모두 가상 응답입니다.</p></div></details>';
 const det=host.querySelector('details');
 document.addEventListener('click',e=>{if(det.open&&!host.contains(e.target))det.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&det.open){det.open=false;det.querySelector('summary').focus();}});
}
function init(){
 if(!document.querySelector('link[data-report-download-css]')){
  const s=document.currentScript||document.querySelector('script[src*="report-download.js"]');
  const link=document.createElement('link');link.rel='stylesheet';link.dataset.reportDownloadCss='1';
  link.href=(s?s.src.replace(/report-download\.js.*$/,''):'assets/')+'report-download.css?v='+VERSION;
  document.head.append(link);
 }
 document.querySelectorAll('[data-report-download]').forEach(build);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
