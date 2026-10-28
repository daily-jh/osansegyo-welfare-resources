'use strict';
/* 06 척도 자료실(oy-scale-library-v1): 모든 척도에 개요·채점·이용 조건·출처가 있고, 이 사이트가 직접 올린 파일은 자체 양식뿐이며,
   외부 양식은 https 공식 배포처로만 연결하고, 공개되지 않는 검사에는 양식 링크가 없는지 확인한다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../docs/youth-risk');
const L=require(path.join(dir,'oy-scale-library-v1.js'));
const ids=new Set();
for(const s of L.SCALES){
 assert.ok(!ids.has(s.id),'duplicate '+s.id);ids.add(s.id);
 for(const k of ['name','short','purpose','who','items','time','scoring','link','caution','license','source'])assert.ok(String(s[k]||'').trim(),s.id+' needs '+k);
 assert.ok(L.GROUPS.some(g=>g[0]===s.group),s.id+' group');
 assert.ok(L.ACCESS[s.access],s.id+' access');
 assert.ok(s.levels.length&&s.levels.every(l=>['e','m','h'].includes(l)),s.id+' levels');
 if(s.access==='restricted')assert.equal(s.files.length,0,s.id+' restricted tests carry no form link');
 else assert.ok(s.files.length,s.id+' has a download or official page');
 for(const f of s.files){
  if(s.access==='own'){assert.ok(!/^https?:/.test(f.url)&&fs.existsSync(path.join(dir,f.url)),s.id+' own form exists: '+f.url)}
  else assert.match(f.url,/^https:\/\//,s.id+' external forms come from the official source over https');
 }
}
assert.equal(L.SCALES.filter(s=>s.access==='own').length,1,'only the OY-RALS form is hosted here');
for(const s of L.SCALES){
 assert.ok(s.origin&&s.origin.from&&s.origin.kr&&s.origin.read,s.id+' says where it was developed, its Korean version and how to read it');
 assert.equal(L.foreign(s),s.origin.from!=='국내',s.id+' foreign flag follows origin');
}
['phq','gad7','sdq','scared','cries','scoff','maca','cyrm'].forEach(id=>assert.ok(L.foreign(L.SCALES.find(s=>s.id===id)),id+' is marked foreign'));
['scared','cries','scoff','maca','cyrm'].forEach(id=>assert.ok(L.SCALES.some(s=>s.id===id),'recommended scale '+id+' added'));
const h=L.html({level:'m'});
assert.equal((h.match(/<details class="osl-card"/g)||[]).length,L.SCALES.length,'every scale is a folded card');
assert.ok(!/<details class="osl-card"[^>]* open/.test(h),'cards start folded');
assert.ok(/data-osl-level="m" aria-pressed="true"/.test(h));
assert.ok(!/<script|javascript:/i.test(h),'no script in rendered cards');
(h.match(/href="https?:[^"]+"[^>]*>/g)||[]).forEach(a=>assert.ok(/target="_blank" rel="noopener noreferrer"/.test(a),'external link opens safely: '+a));
assert.equal((h.match(/class="osl-org osl-foreign"/g)||[]).length,L.SCALES.filter(L.foreign).length,'every foreign scale shows the 외국 척도 badge');
assert.ok(h.includes('osl-foreign-note'),'library explains how to read foreign scales');
const csv=L.csv();assert.equal(csv.split('\r\n').length,L.SCALES.length+1,'CSV one row per scale');
assert.ok(/개발 국가.*한국판.*해석할 때/.test(csv.split('\r\n')[0]),'CSV carries origin columns');
assert.equal(L.levelOf('중2'),'m');assert.equal(L.levelOf(''),'');
const page=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert.ok(/data-oy-lib[^>]*>06 · 척도 자료실<\/button><\/nav>/.test(page),'06 button closes the step nav');
assert.ok(page.includes('id="scaleLibraryArea"')&&page.includes('oy-scale-library-v1.js'),'library area and script wired');
console.log('PASS scale library: '+L.SCALES.length+' scales folded with overview, scoring, licence and official source; one hosted form');
