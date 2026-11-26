'use strict';
/* Real clicks in Chromium with a synthetic case (not a real student): 03 지역자원연계 no longer carries the public-API
   blocks (공공 지원사업·공공데이터 기관; removed 2026-11-26 as they duplicated the map), the map itself still renders,
   05 final report (phone reading view) still carries the facility block, A4 sheets still fit, no side scroll. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
const out=path.join(__dirname,'../artifacts/oy-public-facilities');fs.mkdirSync(out,{recursive:true});
const answers=Array(25).fill(0);answers[5]=3;answers[19]=2;answers[13]=2;answers[21]=2;
(async()=>{const browser=await chromium.launch();
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
  await page.route('https://osan-youth-usage.daily-89.workers.dev/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'}));
  page.on('dialog',d=>d.dismiss());
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  const frame=page.frameLocator('#assessmentFrame');
  await frame.locator('#qi0 input[type=radio]').first().waitFor({timeout:18000});
  await page.waitForFunction(()=>{const d=document.getElementById('assessmentFrame')?.contentDocument;return document.readyState==='complete'&&!!d&&d.readyState==='complete'},null,{timeout:20000});
  const pick=async loc=>{try{await loc.check({force:true,timeout:12000})}catch(e){if(!/did not change its state/.test(String(e)))throw e;await page.waitForTimeout(400);await loc.check({force:true,timeout:12000})}};
  for(let i=0;i<25;i++)await pick(frame.locator('#qi'+i+' input[type="radio"][value="'+answers[i]+'"]'));
  await frame.locator('#oyCaseContextText').fill('가상 사례. 집을 나와 친구 집에 머물고 있다고 말함.');
  await frame.locator('#complete').click();
  await page.waitForFunction(()=>document.querySelector('[data-oy-step="2"]')?.disabled===false,{timeout:25000});
  await page.locator('[data-oy-step="2"]').click();
  await page.waitForSelector('#journey88 .j88-map-intro',{timeout:20000});
  await page.waitForTimeout(600);
  const block=await page.evaluate(()=>({pf:document.querySelectorAll('#journey88 .oypf').length,pb:document.querySelectorAll('#journey88 .oypb, #journey88 [class^="oy-pb"]').length,h:document.getElementById('journey88').getBoundingClientRect().height}));
  assert.equal(block.pf,0,'03 has no public-data facility block');assert.equal(block.pb,0,'03 has no public-benefit block');
  await page.screenshot({path:path.join(out,'stage03-'+width+'.png')});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no side scroll at '+width);
  await page.locator('[data-oy-step="7"]').click();
  await page.waitForFunction(()=>document.getElementById('finalReportArea')?.hidden===false&&document.querySelector('#finalReportArea .ofr-rep'),{timeout:20000});
  const rep=await page.evaluate(()=>{const reps=[...document.querySelectorAll('#finalReportArea .ofr-sheet .ofr-rep')];const mob=document.querySelector('#finalReportArea .ofr-mob');return {over:reps.map(r=>r.scrollHeight-r.clientHeight),text:mob?mob.innerText:''}});
  // A4 sheets keep extra blocks only while space is left; the phone reading view always carries them.
  if(width===390)assert.match(rep.text,/공공데이터 기관 \d+종/,'05 carries the same facility block');
  if(width===1280)rep.over.forEach((o,i)=>assert.ok(o<=1,'sheet '+(i+1)+' overflows by '+o+'px'));
  assert.deepEqual(errors,[]);
  console.log('PASS public facilities '+width+'px: 03 without API blocks ('+Math.round(block.h)+'px), 05 checked');
  await page.close()}
 await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
