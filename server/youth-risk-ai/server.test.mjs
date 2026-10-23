import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalysisServer,validatePayload,buildInput,providerRequest,extractAnalysis} from './server.mjs';
const payload=()=>({version:'youth-risk-25-v1',answers:Array(25).fill(0),safetyFlags:[false,false,false,false]});
test('accepts complete scores only and refuses identifying fields',()=>{
 assert.equal(validatePayload(payload()).answers.length,25);
 for(const value of [null,-1,5,1.5,'2']){const p=payload();p.answers[0]=value;assert.throws(()=>validatePayload(p))}
 for(const p of [{...payload(),name:'synthetic'},{...payload(),notes:'synthetic'},{...payload(),answers:[0]},{...payload(),safetyFlags:[false]}])assert.throws(()=>validatePayload(p));
 const p=payload();p.answers[6]=1;const input=JSON.parse(buildInput(p));assert.match(input.safetySignals.join(),/자해/);assert.equal(input.items.length,25);assert.equal(input.total,1);assert.match(input.items[6].text,/자해/);
});
test('provider request schema and response validation',()=>{
 const req=providerRequest('openai','test-model','test-secret','test-input');assert.equal(req.url,'https://api.openai.com/v1/responses');assert.equal(JSON.parse(req.options.body).store,false);
 const gemini=providerRequest('gemini','test-model','test-secret','test-input');assert.equal(gemini.options.headers['x-goog-api-key'],'test-secret');assert.ok(!gemini.url.includes('test-secret'));
 assert.equal(extractAnalysis('openai',{output:[{content:[{type:'output_text',text:'테스트용 분석 응답입니다.'}]}]}),'테스트용 분석 응답입니다.');
 assert.throws(()=>extractAnalysis('gemini',{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'short'}]}}]}));
 assert.throws(()=>extractAnalysis('openai',{status:'incomplete'}));assert.throws(()=>providerRequest('openai','../../model','secret','input'));
});
test('HTTP authentication, origin, minimized payload, provider error and rate limit',async()=>{
 let upstream=[];let fail=false;
 const server=createAnalysisServer({provider:'openai',model:'test-model',apiKey:'server-secret',accessToken:'synthetic-access-token-24-chars',allowedOrigin:'https://daily-jh.github.io'},async(url,options)=>{upstream.push({url,options});return fail?new Response('{}',{status:503}):new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'연결 검사에 사용하는 가상의 응답입니다.'}]}]}),{status:200})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/analyze';
 const request=(data=payload(),patch={})=>fetch(url,{method:'POST',headers:{Origin:'https://daily-jh.github.io',Authorization:'Bearer synthetic-access-token-24-chars','Content-Type':'application/json',...patch},body:JSON.stringify(data)});
 try{
  assert.equal((await request(payload(),{Origin:'https://wrong.invalid'})).status,403);
  assert.equal((await request(payload(),{Authorization:'Bearer wrong'})).status,401);
  assert.equal((await request({...payload(),name:'not-allowed'})).status,400);assert.equal(upstream.length,0);
  const r=await request();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const result=await r.json();assert.equal(result.provider,'OpenAI GPT');assert.equal(result.model,'test-model');assert.ok(!('apiKey' in result));
  assert.equal(result.draft,result.analysis);assert.equal(result.draft,'연결 검사에 사용하는 가상의 응답입니다.');
  assert.equal(JSON.parse(upstream[0].options.body).model,'test-model');assert.equal(JSON.parse(JSON.parse(upstream[0].options.body).input).items.length,25);
  fail=true;assert.equal((await request()).status,502);fail=false;
  for(let i=0;i<8;i++)assert.equal((await request()).status,200);
  assert.equal((await request()).status,429);
 }finally{await new Promise(r=>server.close(r))}
});
