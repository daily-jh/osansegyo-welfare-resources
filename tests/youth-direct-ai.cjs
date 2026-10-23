'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const jsFiles=['docs/youth-risk/direct-ai.js','docs/youth-risk/direct-ai-config.js','docs/youth-risk/case-examples.js','server/youth-risk-ai/cloudflare/worker.mjs'];
 for(const file of jsFiles){const r=spawnSync(process.execPath,['--check',resolve(file)],{encoding:'utf8'});assert.equal(r.status,0,file+' JS parsing error: '+r.stderr);}
 const {default:worker}=await import(pathToFileURL(resolve('server/youth-risk-ai/cloudflare/worker.mjs')).href);
 let requests=[];
 const env={
  AI_ACCESS_TOKEN:'t'.repeat(40),
  AI_MODEL:'@cf/example/mock',
  AI_RATE_LIMIT:{limit:async()=>({success:true})},
  AI:{run:async(model,opts)=>{requests.push({model,opts});return {response:'1. 현재 상황: 예시 평가 응답만 기반으로 검토합니다. 2. 확인할 점: 안전과 미상을 확인합니다. 3. 서비스 계획: 학생 의견을 확인합니다.'}}}
 };
 const payload={version:'youth-risk-25-v1',answers:Array(25).fill(0),role:'teacher',safety:{explicit:false,followups:{}}};
 const send=(p=payload,headers={},other={})=>worker.fetch(new Request('https://worker.example/analyze',{method:'POST',headers:{Origin:'https://daily-jh.github.io',Authorization:'Bearer '+'t'.repeat(40),'Content-Type':'application/json',...headers},body:JSON.stringify(p),...other}),env);
 let r=await send();assert.equal(r.status,200);let j=await r.json();assert.equal(j.verified,false);assert.match(j.draft,/예시/);assert.equal(requests.length,1);
 const p={...payload,answers:[...payload.answers]};p.answers[9]='unknown';r=await send(p);assert.equal(r.status,200);const upstream=JSON.parse(requests.at(-1).opts.messages[1].content);assert.equal(upstream.areas[3].items[1].score,'unknown');assert.match(upstream.totalStatus,/보류/);
 r=await send({...payload,name:'student'});assert.equal(r.status,400);
 r=await send({...payload,answers:[5,...Array(24).fill(0)]});assert.equal(r.status,400);
 r=await send(payload,{Authorization:'Bearer bad'});assert.equal(r.status,401);
 r=await send(payload,{Origin:'https://evil.invalid'});assert.equal(r.status,403);
 r=await send(payload,{Origin:'https://daily-jh.github.io',Authorization:'Bearer '+'t'.repeat(40),'Content-Type':'text/plain'});assert.equal(r.status,415);
 const blocked={...env,AI_RATE_LIMIT:{limit:async()=>({success:false})}};
 r=await worker.fetch(new Request('https://worker.example/analyze',{method:'POST',headers:{Origin:'https://daily-jh.github.io',Authorization:'Bearer '+'t'.repeat(40),'Content-Type':'application/json'},body:JSON.stringify(payload)}),blocked);
 assert.equal(r.status,429);
 const missing={...env,AI_RATE_LIMIT:undefined};
 r=await worker.fetch(new Request('https://worker.example/analyze',{method:'POST',headers:{Origin:'https://daily-jh.github.io',Authorization:'Bearer '+'t'.repeat(40),'Content-Type':'application/json'},body:JSON.stringify(payload)}),missing);
 assert.equal(r.status,503);
 console.log('Youth direct AI: syntax/auth/origin/schema/unknown/rate-limit smoke tests OK');
})().catch(err=>{console.error(err);process.exitCode=1});
