(function(){'use strict';
// Header link icons are chosen by link kind, so adding or removing a link does not shift them.
const DOC='M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',BAG='M4 7h16v13H4z M8 7V4h8v3 M4 11h16',CHAT='M4 5h16v12H9l-5 4z M8 9h8 M8 13h5',HELP='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.6 M12 16.8v.1';
const kind=link=>link.classList.contains('header-resource-link')?BAG:link.classList.contains('header-help')?HELP:/cie-lab/.test(link.getAttribute('href')||'')?CHAT:DOC;
const nav=document.querySelector('.youth-header-links');
document.querySelectorAll('.youth-header-links>a').forEach(link=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d',kind(link));svg.append(path);link.prepend(svg);});
// Research report downloads sit at the far right of the header, outside the scrolling link row.
if(nav&&!document.querySelector('[data-report-download]')){
 const host=document.createElement('div');host.dataset.reportDownload='';host.dataset.base='../reports/';host.dataset.label='연구보고서';nav.after(host);
 const s=document.createElement('script');s.src='../assets/report-download.js?v=20261027-rev4';s.defer=true;document.head.append(s);
}
})();
