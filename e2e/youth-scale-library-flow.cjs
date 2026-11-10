'use strict';
/* Real clicks in Chromium (synthetic answers only). 06 척도 자료실 opens before any evaluation, shows folded scale cards,
   filters by school level (starting from the grade chosen on 01), and leaving it returns to the same step with the
   answers still there. Phone width has no horizontal scroll. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
const out=path.join(__dirname,'../artifacts/oy-scale-library');fs.mkdirSync(out,{recursive:true});
async function run(browser,width){
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
 await frame.locator('#studentGrade').selectOption('고2');
 // Start-up can still clear a very early answer on a slow runner: click until the answer stays.
 const q0=frame.locator('#qi0 input[type="radio"][value="1"]');
 for(let i=0;i<8&&!(await q0.isChecked());i++){await q0.click({force:true});await page.waitForTimeout(250);}
 assert.ok(await q0.isChecked(),'first answer stays selected');
 const lib=page.locator('[data-oy-lib]');
 assert.equal(await lib.isEnabled(),true,'06 opens before evaluation');
 await lib.click();
 await page.waitForSelector('#scaleLibraryArea .osl-card');
 assert.equal(await page.locator('#assessmentArea').isVisible(),false,'01 hidden while the library is open');
 assert.equal(await lib.getAttribute('aria-current'),'step');
 assert.equal(await page.locator('[data-osl-level="h"]').getAttribute('aria-pressed'),'true','starts at the grade chosen on 01');
 const shown=await page.locator('#scaleLibraryArea .osl-card:visible').count();
 assert.ok(shown>=8,'high-school scales shown: '+shown);
 const first=page.locator('#scaleLibraryArea .osl-card:visible').first();
 assert.equal(await first.getAttribute('open'),null,'cards start folded');
 await first.locator('summary').click();
 assert.ok(await first.locator('.osl-facts').isVisible(),'card unfolds to the overview');
 await page.locator('[data-osl-level=""]').click();
 assert.equal(await page.locator('#scaleLibraryArea .osl-card:visible').count(),await page.locator('#scaleLibraryArea .osl-card').count());
 const wide=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(wide<=1,'no horizontal scroll '+wide);
 await page.screenshot({path:path.join(out,'library-'+width+'.png'),fullPage:true});
 const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-osl-csv]').click()]);
 assert.match(dl.suggestedFilename(),/\.csv$/);
 await page.locator('[data-oy-step="1"]').click();
 await page.waitForFunction(()=>!document.body.classList.contains('oy-lib-open')&&!document.getElementById('assessmentArea').hidden);
 assert.equal(await page.locator('#scaleLibraryArea').isVisible(),false);
 assert.equal(await frame.locator('#qi0 input[type="radio"][value="1"]').isChecked(),true,'answers kept after visiting 06');
 assert.equal(await frame.locator('#studentGrade').inputValue(),'고2');
 assert.deepEqual(errors,[],'no page errors');
 await page.close();
}
(async()=>{
 const browser=await chromium.launch();
 try{await run(browser,1280);console.log('PASS scale library 1280px: opens before evaluation, folded cards, grade filter, CSV, returns with answers kept');
  await run(browser,390);console.log('PASS scale library 390px: same, no horizontal scroll');}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
