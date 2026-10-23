'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const {spawnSync}=require('node:child_process');
const file=resolve(__dirname,'../server/youth-risk-local/local-bridge.mjs');
const site='https://daily-jh.github.io';
const token='a'.repeat(48);
const body=(patch={})=>({
  version:'youth-risk-25-v1',
  role:'teacher',provider:'codex',
  answers:Array(25).fill(0),
  safety:{explicit:false,followups:{}},
  includedDomains:[2,6],
  ...patch
});
function call(port,method,path,info,headers={}){
  return new Promise((accept,reject)=>{
    const v=info===undefined?undefined:JSON.stringify(info);
    const req=http.request({
      hostname:'127.0.0.1',port,path,method,
      headers:{Origin:site,Host:'127.0.0.1:8765','Content-Type':'application/json',Authorization:'Bearer '+token,...headers}
    },res=>{
      let content='';res.setEncoding('utf8');res.on('data',d=>content+=d);
      res.on('end',()=>accept({status:res.statusCode,headers:res.headers,data:content?JSON.parse(content):null}));
    });
    req.on('error',reject);req.end(v);
  });
}
test('local bridge input validation and prompt do not include identity or falsify unknown score',async()=>{
  const m=await import(pathToFileURL(file).href);
  assert.equal(m.validateAssessment(body()),true);
  for(const v of ['unknown',0,1,2,3,4]){
    const p=body();p.answers[7]=v;assert.equal(m.validateAssessment(p),true);
  }
  for(const x of [
    body({name:'가상학생'}),body({notes:'상담메모'}),
    body({answers:Array(25).fill(5)}),body({answers:Array(24).fill(1)}),
    body({provider:'shell'}),body({role:'admin'}),body({includedDomains:[10]}),
    body({safety:{explicit:false,followups:{4:'no',25:'yes'}}})
  ])assert.equal(m.validateAssessment(x),false);
  const p=body();
  p.answers[0]=1;p.answers[6]='unknown';p.answers[24]=1;
  const prompt=m.makePrompt(p);
  assert.match(prompt,/전체 판정/);
  assert.match(prompt,/아동학대/);
  assert.match(prompt,/"response":"unknown"/);
  assert.match(prompt,/"safetySignals":\[1,25\]/);
  assert.doesNotMatch(prompt,/가상학생|민감한 상담 메모/);
  const cli=m.cliSpec('codex','linux');assert.deepEqual(cli.args.slice(0,2),['exec','--ephemeral']);
  assert.ok(cli.args.includes('read-only'));
  const win=m.cliSpec('claude','win32');assert.match(win.bin.toLowerCase(),/cmd.exe/);
  assert.ok(win.args.includes('/c'));
  assert.throws(()=>m.cliSpec('powershell'));
});
test('local bridge localhost/origin/token/schema/busy and safety of results',async()=>{
  const m=await import(pathToFileURL(file).href);
  let n=0, prompts=[];
  const {server}=m.createLocalServer({
    port:8765,token,origin:site,available:()=>true,
    runner:async(provider,prompt)=>{
      n++;prompts.push({provider,prompt});
      return '## 임시 가상분석\n이 보고서는 가상의 학생 평가 응답을 이용한 보조 예시이며, 최종 판정이 아닙니다. 학생의 의견과 기관의 안전확인이 필요합니다.';
    }
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const port=server.address().port;
  try{
    let r=await call(port,'POST','/status',{});
    assert.equal(r.status,200);assert.equal(r.data.connected,true);
    assert.equal(r.data.providers.codex,true);
    assert.equal(r.headers['access-control-allow-origin'],site);
    assert.equal(r.headers['cache-control'],'no-store');
    r=await call(port,'POST','/analyze',body());
    assert.equal(r.status,200);assert.equal(r.data.provider,'codex');
    assert.equal(r.data.transport,'localhost');
    assert.equal(r.data.verified,false);
    assert.equal(n,1);assert.ok(prompts[0].prompt.includes('참고'));
    r=await call(port,'POST','/analyze',body({name:'student'}));
    assert.equal(r.status,400);
    assert.equal(n,1);
    r=await call(port,'POST','/analyze',body(),{Authorization:'Bearer invalid'});
    assert.equal(r.status,401);
    r=await call(port,'POST','/analyze',body(),{Origin:'https://another.invalid'});
    assert.equal(r.status,403);
    r=await call(port,'POST','/analyze',body(),{Host:'attacker.example'});
    assert.equal(r.status,403);
    r=await call(port,'GET','/analyze');
    assert.equal(r.status,405);
    r=await call(port,'OPTIONS','/analyze',undefined,{Authorization:''});
    assert.equal(r.status,204);
    r=await call(port,'POST','/analyze',body(),{'Content-Type':'text/plain'});
    assert.equal(r.status,415);
    r=await call(port,'POST','/analyze',body({provider:'bad'}));
    assert.equal(r.status,400);
    assert.equal(n,1);
  }finally{await new Promise(ok=>server.close(ok))}
});
test('JS client and integration files parse',()=>{
  for(const path of [
    'docs/youth-risk/local-ai.js',
    'docs/youth-risk/case-examples.js',
    'docs/youth-risk/direct-ai.js',
    'server/youth-risk-local/local-bridge.mjs'
  ]){
    const result=spawnSync(process.execPath,['--check',resolve(__dirname,'..',path)],{encoding:'utf8'});
    assert.equal(result.status,0,path+': '+result.stderr);
  }
});
