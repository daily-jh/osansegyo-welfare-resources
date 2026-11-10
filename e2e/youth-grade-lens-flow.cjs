'use strict';
/* Real clicks in Chromium with a synthetic case (not a real student). The grade select sits next to the name on
   01, the chosen grade reaches ① 척도 해석 and 05 최종 보고서 as an interpretation aid, the decisions stay the same
   as without a grade, and both A4 sheets still fit. On a phone the fields stack without horizontal scroll. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
const out=path.join(__dirname,'../artifacts/oy-grade-lens');fs.mkdirSync(out,{recursive:true});
const c=require('../tests/fixtures/synthetic-cases100-20261027.json').find(x=>x.id==='V054');
async function run(browser,width,grade){
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
 const sel=frame.locator('#studentGrade');
 assert.equal(await sel.locator('option').count(),13,'미확인 + 12 grades');
 const nb=await frame.locator('#studentName').boundingBox(),gb=await sel.boundingBox();
 if(width>=1000){assert.ok(Math.abs(nb.y-gb.y)<4&&gb.x>nb.x,'grade sits beside the name')}
 else{assert.ok(gb.y>nb.y,'grade stacks under the name on a phone');
  const wide=await frame.locator('body').evaluate(b=>b.scrollWidth-b.clientWidth);assert.ok(wide<=1,'no horizontal scroll '+wide)}
 if(grade)await sel.selectOption(grade);
 await frame.locator('.privacy').screenshot({path:path.join(out,'input-'+width+'.png')});
 // A click that lands while the frame is still starting up can be undone; check again once before failing.
 const pick=async loc=>{try{await loc.check({force:true,timeout:12000})}catch(e){if(!/did not change its state/.test(String(e)))throw e;await loc.page().waitForTimeout(400);await loc.check({force:true,timeout:12000})}};
 for(let i=0;i<25;i++)await pick(frame.locator('#qi'+i+' input[type="radio"][value="'+c.answers[i]+'"]'));
 if(c.narrative)await frame.locator('#oyCaseContextText').fill(c.narrative);
 await frame.locator('#complete').click();
 await page.waitForFunction(()=>document.querySelector('[data-oy-step="7"]')?.disabled===false,{timeout:25000});
 await page.waitForFunction(()=>document.querySelector('#journey88 .oy-deep-report'),{timeout:20000});
 const scale=await page.evaluate(()=>document.querySelector('#journey88').innerText);
 await page.locator('[data-oy-step="3"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#journey88 [data-oyd] .oyd-v').length===6,{timeout:20000});
 const chain=await page.$$eval('#journey88 [data-oyd] .oyd-v',v=>v.map(x=>x.textContent.trim()));
 await page.locator('[data-oy-step="7"]').click();
 await page.waitForFunction(()=>document.getElementById('finalReportArea')?.hidden===false&&document.querySelector('#finalReportArea .ofr-rep'),{timeout:20000});
 const rep=await page.evaluate(()=>{const reps=[...document.querySelectorAll('#finalReportArea .ofr-sheet .ofr-rep')];
  return {over:reps.map(r=>r.scrollHeight-r.clientHeight),text:(reps.length?reps:[...document.querySelectorAll('#finalReportArea .ofr-rep')]).map(r=>r.innerText).join('\n')}});
 await page.screenshot({path:path.join(out,'final-'+width+'-'+(grade||'none')+'.png'),fullPage:true});
 assert.deepEqual(errors,[],'no page errors');
 await page.close();
 return {scale,chain,rep};
}
(async()=>{
 const browser=await chromium.launch();
 try{
  const none=await run(browser,1280,'');
  const g=await run(browser,1280,'중1');
  assert.ok(!none.scale.includes('학년으로 읽기'),'no grade, no grade block');
  assert.ok(g.scale.includes('학년으로 읽기')&&g.scale.includes('중학교 전환기'),'① shows the grade reading');
  assert.deepEqual(g.chain,none.chain,'decision chain unchanged by the grade');
  assert.ok(g.rep.text.includes('중학교 1학년'),'05 names the grade');
  g.rep.over.forEach((o,i)=>assert.ok(o<=1,'sheet '+(i+1)+' overflows by '+o+'px'));
  console.log('PASS grade lens 1280px: beside the name, ① reading, same decisions, 05 fits');
  const m=await run(browser,390,'고3');
  assert.ok(m.scale.includes('학년으로 읽기'),'phone ① shows the grade reading');
  console.log('PASS grade lens 390px: stacked fields, no horizontal scroll, ① reading');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
