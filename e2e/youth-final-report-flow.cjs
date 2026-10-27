'use strict';
/* Real clicks in Chromium with synthetic cases from tests/fixtures (not real students). Opens 05 final report,
   checks that the six decisions equal the 01–04 decision chain with and without the narrative, that both A4 sheets
   fit, that the practitioner opinion lands on the page, that print gives exactly two A4 pages, and that a phone
   shows the reading layout without horizontal scroll. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
const out=path.join(__dirname,'../artifacts/oy-final-report');fs.mkdirSync(out,{recursive:true});
const cases=require('../tests/fixtures/synthetic-cases100-20261027.json');
async function open(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
 await page.route('https://osan-youth-usage.daily-89.workers.dev/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'}));
 page.on('dialog',d=>d.dismiss());
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 const frame=page.frameLocator('#assessmentFrame');
 await frame.locator('#qi0 input[type=radio]').first().waitFor({timeout:18000});
 await page.waitForFunction(()=>document.readyState==='complete',null,{timeout:20000});
 // The assessment frame finishes its own scripts after the radios exist; answering earlier can be undone by its start-up.
 await page.waitForFunction(()=>{const d=document.getElementById('assessmentFrame')?.contentDocument;return !!d&&d.readyState==='complete'},null,{timeout:20000});
 return {page,frame,errors};
}
async function evaluate(page,frame,c){
 // A click that lands while the frame is still starting up can be undone; check again once before failing.
 const pick=async loc=>{try{await loc.check({force:true,timeout:12000})}catch(e){if(!/did not change its state/.test(String(e)))throw e;await loc.page().waitForTimeout(400);await loc.check({force:true,timeout:12000})}};
 for(let i=0;i<25;i++)await pick(frame.locator('#qi'+i+' input[type="radio"][value="'+c.answers[i]+'"]'));
 if(c.narrative)await frame.locator('#oyCaseContextText').fill(c.narrative);
 await frame.locator('#complete').click();
 await page.waitForFunction(()=>document.querySelector('[data-oy-step="7"]')?.disabled===false,{timeout:25000});
 // The decision chain as 04 agency case management shows it.
 await page.locator('[data-oy-step="3"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#journey88 [data-oyd] .oyd-v').length===6,{timeout:20000});
 const chain=await page.$$eval('#journey88 [data-oyd] .oyd-v',v=>v.map(x=>x.textContent.trim()));
 await page.locator('[data-oy-step="7"]').click();
 await page.waitForFunction(()=>document.getElementById('finalReportArea')?.hidden===false&&document.querySelector('#finalReportArea .ofr-rep'),{timeout:20000});
 return chain;
}
async function check(browser,id){
 const c=cases.find(x=>x.id===id);
 const {page,frame,errors}=await open(browser,1280);
 const chain=await evaluate(page,frame,c);
 assert.equal(await page.locator('#journey88').isHidden(),true,'04 tools do not show on 05');
 assert.equal(await page.locator('#stepTitle').innerText(),'최종 보고서 · A4 2쪽');
 const read=()=>page.evaluate(()=>{const reps=[...document.querySelectorAll('#finalReportArea .ofr-sheet .ofr-rep')];
   return {n:reps.length,over:reps.map(r=>r.scrollHeight-r.clientHeight),text:reps.map(r=>r.innerText).join('\n'),cells:[...document.querySelectorAll('#finalReportArea .ofr-pg1 .nb.jd text.b')].map(t=>t.textContent)}});
 let r=await read();
 assert.equal(r.n,2,id+' two A4 sheets');
 r.over.forEach((o,i)=>assert.ok(o<=1,id+' sheet '+(i+1)+' overflows by '+o+'px'));
 // Same decisions as the chain on 04 (cells ①–⑤; ⑥ is drawn as '주관 · 진행체계' and may be cut with …).
 r.cells.slice(0,5).forEach((v,i)=>assert.ok(chain[i].startsWith(v.replace(/…$/,'')),id+' cell '+(i+1)+': '+v+' vs '+chain[i]));
 assert.ok(r.cells[5].replace(/…$/,'').split(' · ').slice(1).join(' · ').length===0||chain[5].startsWith(r.cells[5].replace(/…$/,'').split(' · ').slice(1).join(' · ')),id+' cell 6: '+r.cells[5]+' vs '+chain[5]);
 const excluded=r.text;
 if(c.narrative){
  await page.locator('[data-ofr-inc]').check();
  await page.waitForTimeout(150);
  const inc=await read();
  assert.deepEqual(inc.cells,r.cells,id+' decisions equal with and without narrative');
  inc.over.forEach((o,i)=>assert.ok(o<=1,id+' narrative sheet '+(i+1)+' overflows by '+o+'px'));
  await page.locator('[data-ofr-inc]').uncheck();
  const frag=c.narrative.split(/[.,“”"]+/).map(s=>s.trim()).filter(s=>s.length>=12);
  frag.forEach(f=>assert.ok(!excluded.includes(f),id+' narrative fragment shown while excluded: '+f));
 }
 // Practitioner opinion goes straight onto the sheet.
 const op='가상 사례 시험 문장입니다. 보호자와 다음 주에 다시 만나기로 했습니다.';
 await page.locator('#ofrOpinion').fill(op);
 await page.waitForFunction(t=>[...document.querySelectorAll('#finalReportArea .ofr-sheet .xop')].some(x=>x.innerText.includes(t)),'보호자와 다음 주에',{timeout:5000});
 r=await read();r.over.forEach((o,i)=>assert.ok(o<=1,id+' sheet with opinion '+(i+1)+' overflows by '+o+'px'));
 await page.screenshot({path:path.join(out,id+'-1280.png'),fullPage:true});
 // Print: two A4 pages.
 await page.evaluate(()=>{window.print=()=>{}});
 await page.locator('[data-ofr-print]').click();
 await page.emulateMedia({media:'print'});
 const pdf=path.join(out,id+'-final-report.pdf');
 await page.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});
 const raw=fs.readFileSync(pdf,'latin1');const pages=(raw.match(/\/Type\s*\/Page[^s]/g)||[]).length;
 assert.equal(pages,2,id+' print gives two pages, got '+pages);
 // TXT copy carries the decision block and the opinion.
 await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://127.0.0.1:8765'});
 await page.locator('[data-ofr-copy]').click();
 await page.waitForFunction(()=>/복사/.test(document.querySelector('[data-ofr-status]')?.textContent||''),{timeout:5000});
 const txt=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(txt,/\[판정 경로\]/);assert.ok(txt.includes(op),id+' opinion in TXT');
 assert.deepEqual(errors,[],id+' page errors');
 await page.close();
 return pages;
}
async function phone(browser){
 const c=cases.find(x=>x.id==='V054');
 const {page,frame,errors}=await open(browser,390);
 await evaluate(page,frame,c);
 assert.ok(await page.locator('#finalReportArea .ofr-mob').count(),'phone shows the reading layout');
 assert.equal(await page.locator('#finalReportArea .ofr-sheet').count(),0,'no shrunken A4 sheets on a phone');
 const w=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert.ok(w<=392,'no horizontal scroll on 390px, scrollWidth '+w);
 await page.screenshot({path:path.join(out,'V054-390.png'),fullPage:true});
 assert.deepEqual(errors,[],'phone page errors');
 await page.close();
}
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const id of ['V054','V021','V080']){await check(browser,id);console.log('PASS final report '+id+': same decisions with/without narrative, two A4 sheets fit, opinion, print 2 pages, TXT');}
  await phone(browser);console.log('PASS final report 390px reading layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
