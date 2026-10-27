'use strict';
/* Real clicks in Chromium, synthetic answers and sentences only. Follows the 2026-10-26 external review
   fixes through the whole screen: narrative safety cue, safety check owed today, casework level label,
   folded service plan, light responses starting in school, and the export status line. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8765/youth-risk/';
async function open(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
 await page.route('https://osan-youth-usage.daily-89.workers.dev/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'}));
 page.on('dialog',d=>d.dismiss());
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 const frame=page.frameLocator('#assessmentFrame');
 await frame.locator('#qi0 input[type=radio]').first().waitFor({timeout:18000});
 await page.waitForFunction(()=>document.readyState==='complete',null,{timeout:20000});
 await page.frame({url:/assessment\.html/})?.waitForFunction(()=>document.readyState==='complete',null,{timeout:20000});
 await page.waitForFunction(()=>new Promise(r=>{const y=scrollY;setTimeout(()=>r(scrollY===y),250)}),null,{timeout:10000});
 return {page,frame,errors};
}
async function answer(frame,set){for(let i=0;i<25;i++)await frame.locator('#qi'+i+' input[type="radio"][value="'+(set[i+1]??0)+'"]').check({force:true,timeout:12000});}
async function complete(page,frame){await frame.locator('#complete').click();await page.waitForFunction(()=>document.querySelector('#resultTools')?.hidden===false,{timeout:25000});}
async function servicePlan(page){
 await page.locator('[data-oy-step="2"]').click();
 await page.waitForFunction(()=>document.querySelector('#mapArea')?.hidden===false,{timeout:20000});
 await page.locator('#confirmLinkageReview').click();
 await page.locator('#journey88 [data-j88-tab="서비스계획"]').click();
 return page.locator('#journey88');
}
async function heavy(browser,width){
 const {page,frame,errors}=await open(browser,width);
 await frame.locator('#qi0 input[type="radio"][value="0"]').check({force:true});
 assert.doesNotMatch(await page.locator('#bundleStatus').innerText(),/입력이 바뀌었습니다/,'first answer is not a re-evaluation (P3-08)');
 const set={7:'unknown'};for(const n of [3,4,9,10,11,12,13,16,17,18,19,20,22,23])set[n]=2;
 await answer(frame,set);
 await frame.locator('#oyCaseContextText').fill('학생이 오늘 촬영물을 퍼뜨리겠다는 협박을 받았다고 말했다.');
 await complete(page,frame);
 // ① scale reading leaves the casework level to ③ and says so.
 const score=await page.locator('#journey88').innerText();
 assert.doesNotMatch(score,/사례관리 수준\n/,'no casework glance on the scale tab');
 assert.match(score,/③ 통합 사정의견에서 정합니다/,'scale tab points to ③');
 assert.doesNotMatch(score,/신호 신호/);
 // ② narrative: the threat is a safety cue.
 await page.locator('[data-j88-result-tab="narrative"]').click();
 assert.match(await page.locator('#journey88').innerText(),/촬영물|협박/,'narrative shows the image threat');
 // Service plan: the owed safety check leads, three rows show, the rest is folded.
 const plan=await servicePlan(page);
 const firstRow=await plan.locator('.j88-plan-lead + .j88-scroll').locator('tbody tr').first().innerText();
 assert.match(firstRow,/안전 확인 미완료/,'safety check owed today leads the plan');
 assert.equal(await plan.locator('.j88-plan-lead + .j88-scroll').locator('tbody tr').count(),3);
 assert.equal(await plan.locator('details.j88-plan-rest').count(),1,'remaining tasks folded');
 const names=(await plan.locator('.j88-plan-lead + .j88-scroll tbody tr td:last-child, .j88-plan-rest tbody tr td:last-child').allTextContents()).map(t=>t.replace(/^선택 후보 · /,'').split(' / ')[0]).filter(t=>t&&!/^(교내 조정|앞 과제와 같은 기관)/.test(t)).flatMap(t=>t.split(' · ').map(s=>s.trim()));
 assert.ok(names.length>0,'agencies listed');
 assert.equal(new Set(names).size,names.length,'an agency is named once: '+names.join(','));
 assert.deepEqual(errors,[],'JS exceptions');
 await page.close();
}
async function light(browser,width){
 const {page,frame,errors}=await open(browser,width);
 await answer(frame,{10:1});
 await complete(page,frame);
 const plan=await servicePlan(page);
 const text=await plan.innerText();
 assert.match(text,/먼저 담임·상담교사가 학생과 짧게 이야기하고/,'light responses start in school');
 assert.doesNotMatch(text,/안전 확인 미완료/);
 assert.deepEqual(errors,[],'JS exceptions');
 await page.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){await heavy(browser,width);await light(browser,width);console.log('PASS review fixes '+width+'px: P3-08 status, narrative threat, casework label, safety check first, 3 tasks + folded, one agency mention, light case in school');}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
