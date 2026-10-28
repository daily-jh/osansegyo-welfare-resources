const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),context);
const D=context.window.WELFARE_DATA,html=fs.readFileSync('docs/index.html','utf8'),app=fs.readFileSync('docs/assets/app.js','utf8');
// 7. 화면 범주: 원본 '민간'은 유지하고 전국 공공·전국 민간으로만 나눈다.
for(const o of D.organizations){
  if(o.level==='민간')assert.equal(o.scope,o.kind.includes('공공')?'전국 공공':'전국 민간',o.name);
  else assert.equal(o.scope,o.level,o.name);
}
for(const scope of new Set(D.organizations.map(o=>o.scope)))assert.ok(html.includes(`data-level="${scope}"`),'region tab for '+scope);
assert.ok(!html.includes('data-level="민간"'),'old combined tab removed');
// 1. 긴급전화 띠: 112·119·1366 외 번호는 자료의 연락처와 일치해야 한다.
const strip=html.match(/<ul class="help-now-list">([\s\S]*?)<\/ul>/)[1];
const numbers=[...strip.matchAll(/href="tel:(\d+)"/g)].map(m=>m[1]);
assert.ok(numbers.length>=8);
const phones=new Set(D.organizations.flatMap(o=>[o.phone,...o.services.flatMap(s=>(s.contacts||[]).map(c=>c.phone))]).filter(Boolean).map(p=>p.replace(/\D/g,'')));
for(const n of numbers.filter(n=>!['112','119','1366'].includes(n)))assert.ok(phones.has(n),'strip number in data: '+n);
// 4. 24시간 필터: 연락처 운영시간에 24시간이 적힌 기관만, 운영시간은 카드에 표시.
const allDay=D.organizations.filter(o=>/24\s*시간/.test([o.contact?.hours,...o.services.flatMap(s=>(s.contacts||[]).map(c=>c.hours))].filter(Boolean).join(' ')));
assert.ok(allDay.length>=4&&allDay.every(o=>o.contact?.source_url),'24h organizations carry a source');
assert.ok(html.includes('id="allDayOnly"')&&app.includes("state.allDay=e.target.checked")&&app.includes('<dt>운영시간</dt>'));
// 8. 다국어·쉬운 말 안내
for(const lang of ['en','zh','vi','ru'])assert.ok(html.includes(`lang="${lang}"`),lang);
assert.ok(html.includes('쉬운 말로 찾는 방법')&&html.includes('assets/home-tools-v8.css'));
// 2026-10-28 메인 정리: 연구보고서 메뉴는 메인에서 빼고(OY-RALS 화면 유지), 긴급전화 띠는 맨 아래, 범주 수는 실제 범주 탭과 같게.
assert.ok(!html.includes('data-report-download')&&!html.includes('report-download.js'),'research report menu removed from main page');
assert.ok(html.indexOf('class="help-now')>html.indexOf('id="maintenanceTitle"')&&html.indexOf('class="help-now')<html.indexOf('</main>'),'call strip sits at the bottom of main');
assert.ok(html.includes('id="statLevels"')&&app.includes("$('#statLevels')"),'category count follows region tabs');
assert.equal(new Set(D.organizations.map(o=>o.scope)).size,4);
console.log(JSON.stringify({scopes:[...new Set(D.organizations.map(o=>o.scope))],strip:numbers,allDay:allDay.map(o=>o.name)}));
