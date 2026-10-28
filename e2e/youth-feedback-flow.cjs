'use strict';
/* 이용자 의견(oy-feedback-v1) 화면 흐름. 실제 Worker 코드(server/youth-risk-usage/worker.mjs)를 메모리 SQLite로 띄워 요청을 그대로 넘긴다.
   ① 배포 전(옛 Worker 응답)은 준비 중 ② 비공개 제보 전송 ③ 개인정보는 화면에서 막힘 ④ 후기는 승인 전 비공개, 승인 후 공개 ⑤ 휴대폰 너비 넘침 없음. 가상 문장만 쓴다. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const {DatabaseSync}=require('node:sqlite');
const root=path.join(__dirname,'../docs'),PORT=8792,ENDPOINT='https://osan-youth-usage.daily-89.workers.dev';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8'};
const server=http.createServer((q,s)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)){s.writeHead(404);return s.end()}s.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
(async()=>{
 const worker=(await import(path.join(__dirname,'../server/youth-risk-usage/worker.mjs'))).default;
 const db=new DatabaseSync(':memory:');for(const f of ['schema.sql','feedback-schema.sql'])db.exec(fs.readFileSync(path.join(__dirname,'../server/youth-risk-usage',f),'utf8'));
 const env={FEEDBACK_ADMIN_TOKEN:'e2e-admin-token-123456',DB:{prepare(sql){return {bind(...a){return {async run(){return db.prepare(sql).run(...a)},async first(){return db.prepare(sql).get(...a)},async all(){return {results:db.prepare(sql).all(...a)}}}}}}}};
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));const b=await chromium.launch();let deployed=false;
 const route=async(page)=>page.route(ENDPOINT+'/**',async r=>{const q=r.request();
  if(!deployed&&q.url().includes('/feedback'))return r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"visitsTotal":1}'});
  const res=await worker.fetch(new Request(q.url(),{method:q.method(),headers:Object.assign(Object.fromEntries(Object.entries(q.headers()).filter(([k])=>k!=='origin')),{Origin:'https://daily-jh.github.io'}),body:['GET','HEAD'].includes(q.method())?undefined:q.postData()}),env);
  r.fulfill({status:res.status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:await res.text()})});
 const open=async(w)=>{const ctx=await b.newContext({viewport:{width:w,height:900},serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));await route(p);await p.goto('http://127.0.0.1:'+PORT+'/youth-risk/');await p.locator('#oyFeedback .oyfb-form').waitFor();await p.waitForTimeout(400);return {ctx,p,errs}};
 // ① 배포 전
 let {ctx,p,errs}=await open(1280);
 assert.match(await p.locator('#oyfbList').innerText(),/준비/);await p.locator('#oyfbBody').fill('가상 문장으로 버튼 시험을 합니다.');await p.locator('#oyfbOk').check();await p.locator('#oyfbSend').click();
 assert.match(await p.locator('#oyfbStatus').innerText(),/준비/);assert.equal(db.prepare('SELECT COUNT(*) n FROM feedback').get().n,0);await ctx.close();
 // ② 배포 후 비공개 제보
 deployed=true;({ctx,p,errs}=await open(1280));
 assert.match(await p.locator('#oyfbList').innerText(),/아직 공개된 후기가 없습니다/);
 assert.equal(await p.locator('.oy-pilot-notice a[href="#oyFeedback"]').count(),1,'pilot notice links to the form');
 await p.locator('#oyfbArea').selectOption('05 최종 보고서');await p.locator('#oyfbBody').fill('05 보고서 2쪽 목표 표의 점수 칸이 비어 보입니다.');
 await p.locator('#oyfbSend').click();assert.match(await p.locator('#oyfbStatus').innerText(),/개인정보 확인/);
 await p.locator('#oyfbOk').check();await p.locator('#oyfbSend').click();await p.waitForFunction(()=>/보냈습니다/.test(document.getElementById('oyfbStatus').textContent));
 // ③ 개인정보는 화면에서 막힘
 await p.locator('#oyfbBody').fill('학생 이름 김가상, 연락처 010-0000-0000');await p.locator('#oyfbOk').check();await p.locator('#oyfbSend').click();
 assert.match(await p.locator('#oyfbStatus').innerText(),/휴대전화 번호|학생 이름/);
 // ④ 후기
 await p.locator('[data-oyfb-kind="review"]').click();assert.equal(await p.locator('#oyfbRating').isVisible(),true);assert.equal(await p.locator('#oyfbArea').isVisible(),false,'후기는 화면 구분 없이 전체 의견으로 받음');
 await p.locator('input[name="oyfbRate"][value="5"]').check({force:true});await p.locator('#oyfbBody').fill('사례회의 전에 판정 근거를 한 장으로 볼 수 있어 좋았습니다.');await p.locator('#oyfbOk').check();await p.locator('#oyfbSend').click();
 await p.waitForFunction(()=>/공개됩니다/.test(document.getElementById('oyfbStatus').textContent));
 const rows=db.prepare('SELECT kind,status,rating,area FROM feedback ORDER BY created').all();assert.deepEqual(rows.map(r=>r.kind+':'+r.status),['report:new','review:pending']);assert.equal(rows[1].rating,5);assert.equal(rows[1].area,'전체·기타');
 await p.evaluate(()=>OYFeedback.reload());await p.waitForTimeout(300);assert.match(await p.locator('#oyfbList').innerText(),/아직 공개된 후기가 없습니다/,'pending review not public');
 const id=db.prepare("SELECT id FROM feedback WHERE kind='review'").get().id;db.prepare("UPDATE feedback SET status='approved' WHERE id=?").run(id);
 await p.evaluate(()=>OYFeedback.reload());await p.waitForTimeout(300);const pub=await p.locator('#oyfbList').innerText();assert.match(pub,/판정 근거를 한 장으로/);assert.doesNotMatch(pub,/점수 칸이 비어/,'private report never public');
 await p.locator('#oyFeedback').screenshot({path:path.join(require('os').tmpdir(),'oy-feedback-pc.png')}).catch(()=>{});
 assert.deepEqual(errs,[]);await ctx.close();
 // ⑤ 휴대폰
 ({ctx,p,errs}=await open(390));const over=await p.evaluate(()=>{const r=document.getElementById('oyFeedback').getBoundingClientRect();return Math.max(document.documentElement.scrollWidth-innerWidth,r.right-innerWidth)});assert.ok(over<=1,'no horizontal overflow on phone: '+over);
 await p.locator('#oyFeedback').screenshot({path:path.join(require('os').tmpdir(),'oy-feedback-phone.png')}).catch(()=>{});assert.deepEqual(errs,[]);await ctx.close();
 await b.close();server.close();console.log('PASS feedback flow: not-ready state, private report, personal-info block, review approval, phone width');
})().catch(e=>{console.error(e);process.exit(1)});
