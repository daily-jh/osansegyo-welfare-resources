'use strict';
/* Production-like user interaction: NO forged postMessage, NO real student data. */
const assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:8765/youth-risk/';
const dir=path.join(process.cwd(),'artifacts','oy-user-route');
fs.mkdirSync(dir,{recursive:true});
async function run(browserType,name,width,full){
 const browser=await browserType.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
 const exceptions=[];page.on('pageerror',err=>exceptions.push(String(err)));
 // Browser tests must not send synthetic visits or assessments to the production analytics worker.
 await page.route('https://osan-youth-usage.daily-89.workers.dev/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS'},body:JSON.stringify({day:'2026-10-26',since:'2026-10-20',visitsToday:0,visitsTotal:0,assessmentsToday:0,assessmentsTotal:0})}));
 page.on('dialog',d=>d.dismiss());
 try {
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  const frame=page.frameLocator('#assessmentFrame');
  await frame.locator('#qi0 input[type=radio]').first().waitFor({timeout:18000});
  assert.equal(await frame.locator('.question').count(),25,name+' form must have 25 questions');
  // Wait until both documents finished loading and the page stopped auto-scrolling, so the first click is not lost mid-layout.
  await page.waitForFunction(()=>document.readyState==='complete',null,{timeout:20000});
  await page.frame({url:/assessment\.html/})?.waitForFunction(()=>document.readyState==='complete',null,{timeout:20000});
  await page.waitForFunction(()=>new Promise(r=>{const y=scrollY;setTimeout(()=>r(scrollY===y),250)}),null,{timeout:10000});
  for(let i=0;i<25;i++){
   await frame.locator('#qi'+i+' input[type="radio"][value="0"]').check({force:true,timeout:12000});
   if(i===0)assert.match(await page.locator('#flowStatus').innerText(),/응답|완료|변경/);
  }
  assert.equal(await frame.locator('input[type="radio"]:checked').count(),25,name+' all score choices checked');
  await frame.locator('#complete').click();
  await page.waitForFunction(()=>(document.querySelector('[data-oy-step="2"]')?.disabled===false&&document.getElementById('journey88')?.hidden===false&&Boolean(document.querySelector('#journey88 [data-j88-result-tab]'))),{timeout:25000});
  assert.equal(await page.locator('[data-j88-result-tab="score"]').getAttribute('aria-pressed'),'true',name+' real click navigated to score');
  assert.equal(await page.locator('.oy-viz-radar svg').count(),1,name+' radar visible');
  assert.equal(await page.locator('.oy-viz-radar [data-radar-index]').count(),10);
  const score=await page.locator('#journey88').innerText();
  assert.match(score,/CORE|원점수|응답|5단계/);
  await page.locator('[data-j88-result-tab="narrative"]').click();
  assert.match(await page.locator('#journey88').innerText(),/서술기록/);
  await page.locator('[data-j88-result-tab="integrated"]').click();
  assert.match(await page.locator('#journey88').innerText(),/종합사정/);
  await page.locator('[data-oy-step="2"]').click();
  await page.waitForFunction(()=>document.querySelector('#mapArea')?.hidden===false,null,{timeout:20000});
  assert.equal(await page.locator('#linkageReviewPanel').isVisible(),true,name+' map CTA');
  // The map iframe resizes itself once it loads; click the CTA only after that, or the button moves under the pointer.
  await page.waitForFunction(()=>{const f=document.querySelector('#mapArea iframe');const h=f?Math.round(f.getBoundingClientRect().height):0;const same=h>200&&window.__oyMapH===h;window.__oyMapH=h;return same;},null,{polling:400,timeout:20000});
  await page.locator('#confirmLinkageReview').click();
  await page.waitForFunction(()=>document.querySelector('#journey88 .j88-heading h2')?.textContent?.includes('사례개념화·개입계획'),null,{timeout:15000});
  assert.match(await page.locator('#journey88').innerText(),/사례개념화·개입계획/);
  assert.equal(await page.locator('#oy-ai-ask').count(),0,'retired in-flow OY-CIE dialogue');
  assert.equal(await page.locator('[data-oy-step="4"], [data-oy-step="5"], #oy-ask-collection').count(),0,'AI workshop and records steps retired');
  if(full){
   await page.locator('#journey88 .oy-ask-doc').first().click();
   assert.equal(await page.locator('#oy-ask-panel').isVisible(),true,'ask panel opens from the report button');
   await page.locator('#oy-ask-chips button').first().click();
   assert.ok((await page.locator('#oy-ask-found').innerText()).length>60,'quick answer from the report');
   assert.match(await page.locator('#oy-ask-prompt').inputValue(),/CORE 점수와 안전 판단은 바꾸지 마세요/,'external AI prompt prepared');
   await page.locator('#oy-ask-answer').fill('가상 외부 AI 답변 · 실무자 검토 전');
   await page.locator('.oy-ask-close').click();
   await page.locator('[data-oy-step="1"]').click();
   await page.locator('[data-j88-result-tab="score"]').click();
   await page.evaluate(()=>{window.print=()=>{};});
   await page.locator('#j88-print-quick').click();
   await page.waitForFunction(()=>Boolean(document.querySelector('#j88-print-root')),{timeout:10000});
   const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
   assert.ok(pdf.length>7000,'PDF actual binary too small');
   assert.equal(pdf.subarray(0,5).toString(),'%PDF-','PDF binary signature');
   fs.writeFileSync(path.join(dir,name+'-'+width+'-score.pdf'),pdf);
   await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
   await page.locator('[data-oy-step="1"]').click();
   const downloadPromise=page.waitForEvent('download',{timeout:15000});
   await page.locator('#exportAssessment').click();
   const download=await downloadPromise;
   assert.match(download.suggestedFilename(),/\.json$/);
   const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk.toString();
   const parsed=JSON.parse(raw);
   assert.equal(parsed.answers.length,25);
   assert.equal(parsed.answers.every(v=>v===0),true);
   assert.equal(parsed.caseContext,undefined,'backup must omit freeform notes');
   await page.reload({waitUntil:'domcontentloaded',timeout:30000});
   await page.frameLocator('#assessmentFrame').locator('#qi0').waitFor({timeout:15000});
   assert.equal(await page.locator('[data-j88-result-tab]').count(),0,'new page cannot retain old case in browser storage');
   await page.locator('#importAssessment').setInputFiles({name:'synthetic-anonymous.json',mimeType:'application/json',buffer:Buffer.from(raw)});
   await page.waitForFunction(()=>(document.querySelector('[data-oy-step="2"]')?.disabled===false&&document.getElementById('journey88')?.hidden===false&&Boolean(document.querySelector('#journey88 [data-j88-result-tab]'))),{timeout:20000});
   assert.equal(await page.locator('.oy-viz-radar svg').count(),1,'imported anonymous scores recompute the case');
   assert.equal(await page.frameLocator('#assessmentFrame').locator('input[type="radio"]:checked').count(),25,'all 25 answers restored');

   await page.screenshot({path:path.join(dir,name+'-'+width+'.png'),fullPage:true});
  }
  assert.deepEqual(exceptions,[],name+' JS exceptions');
  const guide=await browser.newPage({viewport:{width,height:900}}); // independent tab, preserve unsaved assessment
  try{
   await guide.goto(base+'system-method.html',{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(await guide.locator('#architecture .arch-node').count(),4,'guide shows 4 connected stage nodes');
   assert.equal(await guide.locator('#architecture .arch-model').count()>=9,true,'all shared model roles visible on architecture map');
   assert.equal(await guide.locator('#how .step').count(),4,'guide matches four-step UI');
   assert.equal(await guide.locator('#architecture').isVisible(),true,'architecture diagram rendered to page');
   assert.match(await guide.locator('#technology').innerText(),/CORE|OY-CIE/,'model guarantee explained');
  }finally{await guide.close();}

  console.log('PASS '+name+' '+width+'px true clicks: score→narrative→integrated→map→case→AI report'+(full?' plus AI quick answer, real A4 PDF and privacy backup':''));
 }finally{await page.close();await browser.close();}
}
(async()=>{
 await run(chromium,'chromium',1280,true);
 await run(chromium,'chromium',390,false);
 await run(firefox,'firefox',1280,false);
 await run(webkit,'webkit',390,false);
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});