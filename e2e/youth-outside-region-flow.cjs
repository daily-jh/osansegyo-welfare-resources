'use strict';
/* 가상 사례(실제 학생 아님): 거주 지역을 수원시로 고르면 03 지역자원연계에서 수원 기관이 먼저, 오산 기관은 회색 '오산 기관(참고)',
   안내 문구가 보이는지 실제 브라우저로 확인한다. 판정 점수는 거주 지역과 무관. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
const out=process.env.SHOT_DIR||path.join(__dirname,'../artifacts/oy-outside-region');fs.mkdirSync(out,{recursive:true});
const answers=Array(25).fill(0);answers[0]=2;answers[5]=3;answers[7]=2;answers[16]=2;
(async()=>{const browser=await chromium.launch();
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:width===390?2:1});const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
  await page.route('https://osan-youth-usage.daily-89.workers.dev/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'}));
  page.on('dialog',d=>d.dismiss());
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  const frame=page.frameLocator('#assessmentFrame');
  await frame.locator('#qi0 input[type=radio]').first().waitFor({timeout:18000});
  await page.waitForFunction(()=>{const d=document.getElementById('assessmentFrame')?.contentDocument;return document.readyState==='complete'&&!!d&&d.readyState==='complete'},null,{timeout:20000});
  await frame.locator('#studentDong').selectOption('수원시');
  const pick=async loc=>{try{await loc.check({force:true,timeout:12000})}catch(e){if(!/did not change its state/.test(String(e)))throw e;await page.waitForTimeout(400);await loc.check({force:true,timeout:12000})}};
  for(let i=0;i<25;i++)await pick(frame.locator('#qi'+i+' input[type="radio"][value="'+answers[i]+'"]'));
  await frame.locator('#complete').click();
  await page.waitForFunction(()=>document.querySelector('[data-oy-step="2"]')?.disabled===false,{timeout:25000});
  await page.locator('[data-oy-step="2"]').click();
  const sf=page.frameLocator('#mapArea iframe');
  await sf.locator('#serviceCards .service-card').first().waitFor({timeout:25000});
  const info=await sf.locator('#serviceCards').evaluate(e=>({notice:(e.querySelector('.region-notice')||{}).innerText||'',cards:[...e.querySelectorAll('.service-card')].map(c=>({name:c.dataset.institution,ref:c.classList.contains('region-ref'),tag:(c.querySelector('.region-tag')||{}).textContent||''}))}));
  assert.match(info.notice,/수원시 거주/);assert.match(info.notice,/같은 역할을 하는 기관에 문의/);
  const firstRef=info.cards.findIndex(c=>c.ref),lastLocal=info.cards.map(c=>c.tag==='수원시 기관').lastIndexOf(true);
  assert.ok(lastLocal>=0,'수원 기관 카드 없음 '+JSON.stringify(info.cards));assert.ok(firstRef<0||lastLocal<firstRef,'수원 기관이 오산 참고보다 앞');
  assert.ok(info.cards.filter(c=>/^오산/.test(c.name)).every(c=>c.ref&&c.tag==='오산 기관(참고)'));
  await sf.locator('#serviceCards').screenshot({path:path.join(out,'stage03-cards-'+width+'.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS outside region '+width+'px: '+info.cards.map(c=>c.name+(c.ref?'(참고)':'')).join(' / '));
  await page.close()}
 await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
