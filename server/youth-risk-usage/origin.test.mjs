// 쉬운 주소(사용자 지정 도메인) 대비(2026-11-26): 기존 github.io 주소는 그대로, SITE_ORIGINS에 적은 주소만 더 허용한다.
import assert from 'node:assert/strict';import usage from './worker.mjs';
const ai=(await import('../youth-risk-ai/cloudflare/worker.mjs')).default;
const env={SITE_ORIGINS:' https://example-welfare.kr , https://www.example-welfare.kr ,http://insecure.example,https://bad.example/path',DB:{prepare(){return {bind(){return {async run(){return {}},async first(){return {n:0}}}}}}}};
const pre=(w,url,from,e=env)=>w.fetch(new Request(url,{method:'OPTIONS',headers:{Origin:from}}),e);
for(const from of ['https://daily-jh.github.io','https://example-welfare.kr','https://www.example-welfare.kr']){
  const r=await pre(usage,'https://stats.example/',from);assert.equal(r.status,204,from);assert.equal(r.headers.get('Access-Control-Allow-Origin'),from);
}
for(const from of ['https://evil.example','http://insecure.example','https://bad.example','']){assert.equal((await pre(usage,'https://stats.example/',from)).status,403,from)}
// SITE_ORIGINS가 없으면 예전과 같이 github.io만
assert.equal((await pre(usage,'https://stats.example/','https://example-welfare.kr',{DB:env.DB})).status,403);
// AI Worker도 같은 규칙(설정 전이라 503이어도 허용 주소는 그대로 돌려준다)
const r1=await pre(ai,'https://ai.example/analyze','https://example-welfare.kr');assert.equal(r1.status,204);assert.equal(r1.headers.get('Access-Control-Allow-Origin'),'https://example-welfare.kr');
const r2=await ai.fetch(new Request('https://ai.example/analyze',{method:'POST',headers:{Origin:'https://example-welfare.kr','Content-Type':'application/json'},body:'{}'}),env);assert.equal(r2.headers.get('Access-Control-Allow-Origin'),'https://example-welfare.kr');
assert.equal((await pre(ai,'https://ai.example/analyze','https://evil.example')).status,403);
assert.equal((await pre(ai,'https://ai.example/analyze','https://daily-jh.github.io',{})).headers.get('Access-Control-Allow-Origin'),'https://daily-jh.github.io');
console.log('PASS: custom domain origins (SITE_ORIGINS) for usage/feedback and AI workers');
