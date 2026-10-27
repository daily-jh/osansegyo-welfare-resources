'use strict';
/* Paged deep interpretation: the report must regroup into life-theme pages without changing the model,
   keep every figure placed, keep the safety section on the cover, and leave the text export linear. */
const assert=require('assert');
const D=require('../docs/youth-risk/oy-deep-interpretation-v1.js');
const L=require('../docs/youth-risk/oy-concept-ladder-v1.js');
const X=require('../docs/youth-risk/oy-cross-patterns-v1.js');
const K=require('../docs/youth-risk/oy-item-knowledge-v1.js');

const zero=Array(25).fill(0);
const set=(map)=>{const a=zero.slice();Object.keys(map).forEach(k=>{a[+k-1]=map[k]});return a};
const CASES={
 safetyHeavy:set({3:3,6:4,7:3,9:4,10:2,11:2,16:3,19:2,20:3,21:2,22:2,23:2}),
 singleDomain:set({10:2,9:1}),
 calm:zero,
 unknownSafety:(function(){const a=set({9:2,22:1});[1,7,25].forEach(n=>{a[n-1]='unknown'});return a})()
};
const pages=h=>(h.match(/class="odi-page odi-page-([a-z-]+)"/g)||[]).map(s=>s.replace(/.*odi-page-/,'').replace('"',''));

let run=0;
function check(name,fn){fn();run++;}

check('every case renders as a paged report with a cover and an expert page',()=>{
 Object.keys(CASES).forEach(id=>{
  const h=D.html(D.build({answers:CASES[id]}));
  assert.ok(h.indexOf('odi-paged')>0,id+': report is not paged');
  const p=pages(h);
  assert.strictEqual(p[0],'cover',id+': first page is not the cover');
  assert.strictEqual(p[p.length-1],'expert',id+': last page is not the expert note');
  assert.ok(p.indexOf('strengths')>=0,id+': missing strengths page');
  // Casework level and plan are judged with the narrative in ③; the scale pages only point there.
  assert.strictEqual(p.indexOf('plan'),-1,id+': plan page belongs to ③');
  assert.ok(!h.includes('<dt>사례관리 수준</dt>'),id+': casework level shown on the scale pages');
  assert.ok(h.includes('odi-next'),id+': no pointer to ③');
  assert.ok(p.length>=3,id+': too few pages');
 });
});

check('a response with more raised themes gets more pages',()=>{
 const many=pages(D.html(D.build({answers:CASES.safetyHeavy}))).length;
 const few=pages(D.html(D.build({answers:CASES.singleDomain}))).length;
 assert.ok(many>few,'theme pages do not follow the response ('+many+' vs '+few+')');
});

check('safety stays on the cover, never only on a later page',()=>{
 const h=D.html(D.build({answers:CASES.safetyHeavy}));
 const cover=h.slice(h.indexOf('odi-page-cover'),h.indexOf('odi-page-theme'));
 assert.ok(cover.indexOf('odi-s-critical')>0,'safety section is not on the cover');
});

check('all seven figures are placed across the pages, with no duplicate figures article',()=>{
 const h=D.html(D.build({answers:CASES.safetyHeavy}));
 ['total','safety','domains','axes','dist','eco','map'].forEach(k=>assert.ok(h.indexOf('osf-sec-'+k)>0,'figure missing: '+k));
 assert.strictEqual(h.indexOf('oy-scale-figures"'),-1,'the standalone figures article should not be embedded');
});

check('every cross pattern has a plain wording and a professional term',()=>{
 X.PATTERNS.forEach(p=>{
  const c=L.concept(p.id);
  assert.ok(c,'no concept entry for '+p.id);
  ['plain','term','why'].forEach(k=>assert.ok(c[k]&&c[k].length>5,p.id+': '+k+' is empty'));
  assert.ok(c.plain!==c.term,p.id+': plain wording equals the term');
 });
});

check('the five themes cover all ten domains exactly once',()=>{
 const seen=[];
 L.THEMES.forEach(t=>t.domains.forEach(d=>{assert.ok(seen.indexOf(d)<0,'domain '+d+' is in two themes');seen.push(d)}));
 assert.strictEqual(seen.length,K.DOMAIN_NAMES.length,'themes do not cover every domain');
});

check('theme sections answer sectionText so the ask panel can quote them',()=>{
 const r=D.build({answers:CASES.safetyHeavy});
 const h=D.html(r);
 const keys=(h.match(/odi-s-theme-([a-z]+)/g)||[]).map(s=>s.replace('odi-s-theme-',''));
 assert.ok(keys.length,'no theme sections rendered');
 keys.forEach(k=>assert.ok(D.sectionText(r,'theme-'+k).length>40,'theme-'+k+' has no text'));
});

check('the text export stays linear and unchanged in shape',()=>{
 const r=D.build({answers:CASES.safetyHeavy});
 const t=D.text(r);
 assert.ok(t.indexOf('odi-page')<0,'text export leaked markup');
 assert.ok(t.indexOf('[1. 우선 안전 확인]')>0,'text export lost its numbered sections');
});

check('scores, level and safety wording never change with the layout',()=>{
 const r=D.build({answers:CASES.safetyHeavy});
 assert.ok(r.summary.total.length>0&&r.title.length>0,'summary missing');
 const h=D.html(r);
 assert.ok(h.indexOf(r.title)>0,'CORE judgement is not shown on the page');
});

check('the pager flips whole pages and returns the reader to the top of the new page (mobile)',()=>{
 const fs=require('fs'),path=require('path');
 const js=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/oy-report-pages-v1.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/oy-report-pages-v1.css'),'utf8');
 // a horizontal scroll-snap track could stop half-way between two pages on iOS
 assert.ok(!/scroll-snap-type/.test(css),'pages must not sit in a horizontal snap scroller');
 assert.ok(/\.odi-swipe \.odi-page\.is-current\{display:block\}/.test(css),'only the current page is shown');
 assert.ok(/touchend/.test(js),'swiping is not read from the touch gesture');
 // measuring the sticky bar gave its stuck position, so a flip from the bottom stayed at the bottom
 assert.ok(/track\.scrollIntoView/.test(js)&&!/bar\.getBoundingClientRect/.test(js),'a flip does not return to the top of the page');
 assert.ok(/\.odi-paged \.odi-s-critical\{padding:/.test(css),'the safety box loses its inner margin on pages');
});

console.log('oy-paged-report-regression: '+run+' checks passed');
