'use strict';
/* Real Chromium UI regression, exclusively synthetic responses. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const sizes=[2,3,3,3,2,2,3,3,2,2],labels=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const answers=Array(25).fill(0);answers[6]=3;answers[8]=2;answers[15]=2;
const payload={answers,domains:sizes.map((n,i)=>({name:labels[i],items:Array.from({length:n},(_,j)=>'가상 문항 '+(j+1))})),routes:Array.from({length:10},()=>[]),resources:[],explicit:[],followups:{},student:{gender:'미확인',dong:''},caseContext:''};
const dir=path.join(process.cwd(),'artifacts','youth-stage-browser');fs.mkdirSync(dir,{recursive:true});
async function scenario(browser,width){
 const page=await browser.newPage({viewport:{width,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
 await page.goto('http://127.0.0.1:8765/youth-risk/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.OYJourney&&!!window.OYModelGateway&&!!window.YouthMap,{timeout:15000});
 await page.frameLocator('#assessmentFrame').locator('body').waitFor({timeout:15000});
 const frame=page.frame({url:/assessment.html/});assert.ok(frame,'assessment iframe should exist');
 await frame.evaluate(p=>window.parent.postMessage({type:'youth-flow-complete-v1',payload:p},location.origin),payload);
 await page.waitForFunction(()=>document.querySelector('#resultTools')?.hidden===false,{timeout:15000});
 assert.equal(await page.locator('#resultTools .result-optional-feature').count(),2);
 assert.equal(await page.locator('#journey88').isVisible(),true,'stage 2 interpretation visible');
 await page.locator('.flow-nav [data-stage="3"]').click();
 await page.waitForFunction(()=>document.querySelector('#journey88')?.textContent?.includes('사정에서 실행계획까지'),{timeout:15000});
 const text=await page.locator('#journey88').innerText();
 assert.ok(text.includes('사례사정'),'stage3 default tab renders');
 assert.ok(!text.includes('이 단계의 결과를 표시하지 못했습니다.'),'no error fallback');
 await page.locator('#journey88 [data-j88-tab="사례협의"]').click();
 assert.ok((await page.locator('#journey88').innerText()).includes('회의에서 결정해야 할 사항'));
 await page.locator('#journey88 [data-j88-tab="서비스계획"]').click();
 assert.ok((await page.locator('#journey88').innerText()).includes('단기 목표'));
 await page.locator('#journey88 [data-j88-tab="사례사정"]').click();
 assert.ok(await page.locator('#j88-rel-svg svg').count(),'family ecosystem drawing exists');
 await page.screenshot({path:path.join(dir,'synthetic-stage3-'+width+'.png'),fullPage:false});
 await page.locator('#journey88 .j88-tools summary').click();
 await page.evaluate(()=>{window.print=()=>{}});
 await page.locator('#j88-integrated').click();
 const print=await page.locator('#j88-print-root').innerText();
 assert.ok(print.includes('사례사정')&&print.includes('서비스계획')&&print.includes('사례협의'),'integrated print sections preserved');
 await page.locator('.flow-nav [data-stage="4"]').click();
 await page.waitForFunction(()=>document.querySelector('#recordsArea')?.hidden===false,{timeout:10000});
 assert.equal(await page.locator('#journey88').isVisible(),true,'stage4 workbench section opens');
 await page.locator('.flow-nav [data-stage="2"]').click();
 await page.locator('[data-result-view="map"]').first().click();
 assert.equal(await page.locator('#linkageReviewPanel').isVisible(),true,'map review remains reachable');
 await page.locator('.flow-nav [data-stage="3"]').click();
 assert.ok((await page.locator('#journey88').innerText()).includes('사례사정'),'stage3 remains directly reachable after map visit');
 assert.deepEqual(errors,[], 'Browser JS exceptions: '+errors.join(' | '));
 await page.close();
 console.log('PASS real Chromium '+width+'px: assessment, map, case assessment, conference, plan, family map, report print, optional follow-up');
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{await scenario(browser,1280);await scenario(browser,390);}
 finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
