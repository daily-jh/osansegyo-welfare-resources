'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.join(__dirname,'../artifacts/field-notes');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=require('node:http').createServer((req,res)=>{let f=path.join(__dirname,'../docs',decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(f.endsWith(path.sep))f+='index.html';fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(data);});});
 if(!process.env.TEST_BASE)await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.PW_CHANNEL||(process.platform==='win32'?'msedge':undefined),headless:true});
 try{for(const width of [1280,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.route('**/usage-config.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(process.env.TEST_BASE||'http://127.0.0.1:8766/youth-risk/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.getElementById('assessmentFrame').contentDocument?.readyState==='complete');
  assert.equal(await page.locator('#oyStartNotes,#oyStartNotesCheck,#oyNotesReminder').count(),0,'no pre-assessment note or required checkbox');
  assert.equal(await page.locator('#assessmentFrame').evaluate(x=>x.inert),false);
  assert.match(await page.locator('#oyRoleStart').evaluate(x=>getComputedStyle(x).animationName),/oy-role-glow/,'original glow restored');
  await page.locator('#oyRoleStart [data-oy-role="teacher"]').click();
  const boxes=await page.locator('#welcome .home-role-grid,#oyRoleStart,#welcome .youth-resource-bridge').evaluateAll(xs=>xs.map(x=>({x:x.getBoundingClientRect().x,w:x.getBoundingClientRect().width})));
  assert.ok(boxes.every(b=>Math.abs(b.x-boxes[0].x)<2&&Math.abs(b.w-boxes[0].w)<2),'aligned entry edges');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
  await page.locator('#oyRoleStart').screenshot({path:path.join(out,'entry-'+width+'.png')});
  await page.locator('#startAssessment').click();assert.equal(await page.locator('#welcome').isVisible(),false);
  assert.equal(await page.locator('#assessmentFrame').evaluate(x=>x.inert),false);
  const frame=page.frameLocator('#assessmentFrame');
  for(let i=0;i<25;i++)await frame.locator('#qi'+i+' input[type="radio"][value="'+(i===6?3:0)+'"]').check({force:true});
  await frame.locator('#complete').click();
  await page.locator('#oyOnePage').waitFor({state:'visible'});
  assert.equal(await page.locator('#oyOnePage .oy1-notes').evaluate(x=>x.open),true,'first result notes open');
  const original=await page.locator('#oyOnePage .oy1-q').nth(1).innerText();
  await page.locator('#oy1Memo').fill('가상 검수 메모');
  await page.locator('#oyOnePage .oy1-notes summary').click();
  for(const role of ['edu','team','cwc','child','admin','teacher']){
   await page.locator('#oyOnePage [data-oy-role="'+role+'"]').click();
   await page.waitForFunction(r=>document.querySelector('#oyOnePage').__model?.role===r&&document.querySelector('#oyOnePage .oy1-notes')?.open,role);
   assert.ok(await page.locator('#oyOnePage [data-oy1-scale]').count()>0,'scale suggestions for '+role);
   assert.equal(await page.locator('#oyOnePage .oy1-q').nth(1).innerText(),original,'role never changes priority');
  }
  assert.equal(await page.locator('#oy1Memo').inputValue(),'가상 검수 메모','memo survives role switches');
  await page.evaluate(()=>{window.print=()=>{}});
  await page.locator('#oyOnePage [data-oy1-print]').first().click();
  assert.equal(await page.locator('#oy1-print-root .oy1-notes').evaluate(x=>x.open),true,'print includes notes');
  assert.match(await page.locator('#oy1-print-root').innerText(),/가상 검수 메모/);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.locator('#oyOnePage').screenshot({path:path.join(out,'result-'+width+'.png')});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'result has no overflow');
  const scaleId=await page.locator('#oyOnePage [data-oy1-scale]').first().getAttribute('data-oy1-scale');
  await page.locator('#oyOnePage [data-oy1-scale]').first().click();
  assert.equal(await page.locator('#osl-'+scaleId).evaluate(x=>x.open),true,'suggestion opens its scale');
  await page.locator('[data-oy-step="1"]').click();
  await page.locator('#oyOnePage [data-oy1-library]').click();
  assert.equal(await page.locator('#scaleLibraryArea').isVisible(),true,'full library opens');
  assert.deepEqual(errors,[]);console.log('PASS field notes '+width);await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
