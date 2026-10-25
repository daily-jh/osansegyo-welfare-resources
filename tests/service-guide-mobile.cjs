/* Chromium DevTools Protocol mobile smoke test. No third-party packages. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
let chrome=candidates.find(p=>fs.existsSync(p));
if(!chrome){for(const n of ['google-chrome','chromium','chromium-browser']){try{chrome=execFileSync('which',[n],{encoding:'utf8'}).trim();break}catch{}}}
if(!chrome)throw Error('Chromium/Chrome required for mobile functional smoke test');
const root=path.resolve('docs');
const mime=p=>p.endsWith('.js')?'application/javascript; charset=utf-8':p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.json')?'application/json; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream';
const srv=http.createServer((req,res)=>{const name=decodeURIComponent((req.url||'/').split('?')[0]),file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.stat(file,(err,s)=>{if(err||!s.isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime(file));fs.createReadStream(file).pipe(res)})});
let browser,ws,temp;
(async()=>{
 try{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port;
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'resource-smoke-'));
  let chromeError='';browser=spawn(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+temp,'about:blank'],{stdio:['ignore','ignore','pipe']});browser.stderr.on('data',data=>{chromeError+=(data+'').slice(0,1000)});browser.on('error',err=>{chromeError+=' spawn: '+err.message});
  let debugPort;for(let i=0;i<100;i++){try{const a=fs.readFileSync(path.join(temp,'DevToolsActivePort'),'utf8').split('\n');debugPort=+a[0];if(debugPort)break}catch{}await delay(100)}
  assert.ok(debugPort,'Chrome CDP listening port; bin='+chrome+'; exit='+browser.exitCode+'; '+chromeError.slice(-2000));
  const targets=await (await fetch('http://127.0.0.1:'+debugPort+'/json')).json();
  const page=targets.find(x=>x.type==='page');assert.ok(page?.webSocketDebuggerUrl,'CDP page target');
  ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
  let seq=0;const pending=new Map;
  ws.addEventListener('message',ev=>{const msg=JSON.parse(ev.data);if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result)}});
  function cmd(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout '+method))}},15000)})}
  async function evaluate(code){const r=await cmd('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('JS exception '+r.exceptionDetails.text);return r.result.value}
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await cmd('Page.navigate',{url:'http://127.0.0.1:'+port+'/service-guide.html'});
  let loaded=false;for(let i=0;i<80;i++){const v=await evaluate("Boolean(document.querySelector('#status')?.textContent?.includes('조건 일치'))");if(v){loaded=true;break}await delay(100)}
  assert.ok(loaded,'service list rendered via scripts');
  const baseline=await evaluate("({total:document.querySelectorAll('.card').length,status:document.querySelector('#status').textContent,bodyScroll:document.documentElement.scrollWidth,viewport:innerWidth})");
  assert.ok(baseline.total>0,'rendered service cards');assert.match(baseline.status,/220개/);assert.ok(baseline.bodyScroll<=baseline.viewport+2,'390px viewport no horizontal overflow '+JSON.stringify(baseline));
  const behavior=await evaluate("(()=>{const target=document.getElementById('target');target.value='노인';target.dispatchEvent(new Event('change',{bubbles:true}));const d=document.querySelector('[data-detail]');d?.click();const expanded=!!document.querySelector('.detail-panel');const btn=document.querySelector('[data-select]');btn?.click();return {filtered:document.querySelector('#status').textContent,expanded,selected:document.getElementById('sheetCount').textContent,buttons:[...document.querySelectorAll('.card-buttons button')].slice(0,2).map(x=>Math.round(x.getBoundingClientRect().height))}})()");
  assert.match(behavior.filtered,/조건 일치/);assert.equal(behavior.expanded,true);assert.equal(behavior.selected,'1');assert.ok(behavior.buttons.every(x=>x>=44),JSON.stringify(behavior));
  const print=await evaluate("(()=>{window.__printCalled=false;window.print=()=>{window.__printCalled=true};document.getElementById('printSelected').click();const x={called:window.__printCalled,cards:document.querySelectorAll('#sheet .print-card').length,prepared:document.body.classList.contains('printing')};window.dispatchEvent(new Event('afterprint'));x.cleaned=!document.body.classList.contains('printing');return x})()");
  assert.deepEqual(print,{called:true,cards:1,prepared:true,cleaned:true},'print/PDF HTML sheet generated and cleanup');
  for(const width of [375,390,768,1280]){
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
    const val=await evaluate("({viewport:innerWidth,scroll:document.documentElement.scrollWidth,buttons:document.querySelectorAll('.card-buttons button').length})");
    assert.ok(val.scroll<=val.viewport+2,'no horizontal page overflow at '+width+': '+JSON.stringify(val));
  }
  console.log('PASS: mobile Chromium, JavaScript service search, details, selection, button sizes and overflow at 375/390/768/1280');
 }catch(e){console.error(e);process.exitCode=1}
 finally{if(ws)ws.close();if(browser)browser.kill('SIGKILL');srv.close();if(temp)fs.rmSync(temp,{recursive:true,force:true})}
})();