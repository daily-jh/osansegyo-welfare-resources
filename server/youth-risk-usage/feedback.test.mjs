import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import assert from 'node:assert/strict';import worker from './worker.mjs';
// 이용자 의견 API: 비공개 제보·승인 후 공개 후기·개인정보 차단·하루 한도·관리자 토큰. 모든 문장은 가상 예시.
const sqlite=new DatabaseSync(':memory:');for(const f of ['./schema.sql','./feedback-schema.sql'])sqlite.exec(fs.readFileSync(new URL(f,import.meta.url),'utf8'));
const stmt=(sql,args)=>sqlite.prepare(sql);
const env={FEEDBACK_ADMIN_TOKEN:'test-token-1234567890',FEEDBACK_SALT:'s',DB:{prepare(sql){return {bind(...args){return {async run(){return stmt(sql).run(...args)},async first(){return stmt(sql).get(...args)},async all(){return {results:stmt(sql).all(...args)}}}}}}}};
const origin='https://daily-jh.github.io';
const call=(path,{method='GET',body,token,ip='1.1.1.1',from=origin}={})=>worker.fetch(new Request('https://w.example'+path,{method,headers:{Origin:from,'Content-Type':'application/json','CF-Connecting-IP':ip,...(token?{Authorization:'Bearer '+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}),env);
const report={kind:'report',area:'05 최종 보고서',role:'사회복지사',body:'05 보고서 2쪽 목표 표에서 점수 칸이 비어 보입니다.'};
const review={kind:'review',area:'전체·기타',role:'교사',rating:5,body:'사례회의 전에 판정 근거를 한 장으로 볼 수 있어 좋았습니다.'};
let r=await call('/feedback',{method:'POST',body:report});assert.equal(r.status,201);
r=await call('/feedback',{method:'POST',body:review});assert.equal(r.status,201);
// 공개 목록에는 승인 전 후기도, 제보도 보이지 않는다.
let pub=await (await call('/feedback/reviews')).json();assert.deepEqual(pub.reviews,[]);
// 개인정보·형식 오류
for(const body of ['담당 학생 이름은 김가상입니다. 연락 바랍니다.','연락처 010-1234-5678로 연락 주세요','메일 test@example.com','오산가상중학교 2학년 3반 학생 사례입니다']){
 r=await call('/feedback',{method:'POST',body:{...report,body}});assert.equal(r.status,422,body);assert.ok((await r.json()).found.length)}
assert.equal((await call('/feedback',{method:'POST',body:{...report,name:'x'}})).status,400);
assert.equal((await call('/feedback',{method:'POST',body:{...report,rating:3}})).status,400,'report has no rating');
assert.equal((await call('/feedback',{method:'POST',body:{...review,rating:9}})).status,400);
assert.equal((await call('/feedback',{method:'POST',body:{...report,area:'없는 영역'}})).status,400);
assert.equal((await call('/feedback',{method:'POST',body:{...report,body:'짧음'}})).status,400);
assert.equal((await call('/feedback',{method:'POST',body:report,from:'https://other.example'})).status,403);
// 관리자: 토큰 없으면 거절, 있으면 전체 목록, 승인하면 공개
assert.equal((await call('/feedback/admin')).status,401);
assert.equal((await call('/feedback/admin',{token:'wrong-token-123456789'})).status,401);
const items=(await (await call('/feedback/admin',{token:env.FEEDBACK_ADMIN_TOKEN})).json()).items;assert.equal(items.length,2);
const rv=items.find(x=>x.kind==='review'),rp=items.find(x=>x.kind==='report');assert.equal(rv.status,'pending');assert.equal(rp.status,'new');
assert.equal((await call('/feedback/admin',{method:'POST',token:env.FEEDBACK_ADMIN_TOKEN,body:{id:rp.id,action:'approve'}})).status,400,'a private report can never be published');
assert.equal((await call('/feedback/admin',{method:'POST',token:env.FEEDBACK_ADMIN_TOKEN,body:{id:rv.id,action:'approve'}})).status,200);
pub=await (await call('/feedback/reviews')).json();assert.equal(pub.reviews.length,1);assert.equal(pub.reviews[0].body,review.body);assert.ok(!('id' in pub.reviews[0]));
assert.equal((await call('/feedback/admin/delete',{method:'POST',token:env.FEEDBACK_ADMIN_TOKEN,body:{id:rv.id}})).status,200);
pub=await (await call('/feedback/reviews')).json();assert.equal(pub.reviews.length,0);
// 하루 한도: 같은 익명 키 5건(위에서 2건 + 3건) 뒤에는 429, 다른 키는 가능
for(let i=0;i<3;i++)assert.equal((await call('/feedback',{method:'POST',body:report})).status,201);
assert.equal((await call('/feedback',{method:'POST',body:report})).status,429);
assert.equal((await call('/feedback',{method:'POST',body:report,ip:'2.2.2.2'})).status,201);
assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM feedback_rate').get().n,2);assert.ok(!JSON.stringify(sqlite.prepare('SELECT * FROM feedback_rate').all()).includes('1.1.1.1'),'IP is not stored');
// 기존 집계는 그대로
assert.equal((await call('/',{method:'POST',body:{event:'visit',id:crypto.randomUUID()}})).status,200);
delete env.FEEDBACK_ADMIN_TOKEN;assert.equal((await call('/feedback/admin',{token:'x'})).status,503);
console.log('PASS: feedback private reports, approved-only public reviews, personal-info block, daily limit without IP, admin token');sqlite.close();
