// 복지자원 찾기 · 정보 정정 알리기: Worker가 받는 모양 그대로 보내고, 대상자 정보는 화면에서 먼저 막는다.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../docs/assets/resource-correction.js');
const worker=fs.readFileSync(path.join(__dirname,'../server/youth-risk-usage/worker.mjs'),'utf8');
const areas=JSON.parse(worker.match(/const AREAS=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
assert.ok(areas.includes(R.AREA),'Worker accepts the area');
assert.ok(/const ROLES=\[''/.test(worker),'Worker accepts an empty role');
const body=R.compose({id:'x1',name:'가상 기관'},['전화번호'],'대표전화가 031-000-0000으로 바뀜');
assert.ok(body.startsWith(R.HEAD+' 가상 기관 (x1)'));assert.ok(body.length<=1000);
assert.deepEqual(R.piiFound('대표전화 031-372-0000'),[]);
assert.deepEqual(R.piiFound('010-1234-5678'),['휴대전화 번호']);
assert.ok(R.piiFound('학생 이름은 가상').includes('대상자 이름'));
const html=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
assert.ok(html.includes("connect-src 'self' "+R.ENDPOINT),'CSP allows the feedback endpoint only');
assert.ok(html.includes('assets/resource-correction.js'));
const admin=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/feedback-admin.js'),'utf8');
assert.ok(admin.includes('[복지자원 정정]'.replace(/[[\]]/g,'\\$&')),'admin filters resource corrections');
console.log('PASS: resource correction payload, privacy guard, CSP and admin filter');
