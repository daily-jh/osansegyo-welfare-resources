'use strict';
/* 공통 정의(oy-constants-v1)가 공식 원본(criteria.js·app.js)과 같은지, 다른 파일의 안전문항 사본이 어긋나지 않았는지 확인한다. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'../docs/youth-risk');
const OC=require(path.join(SRC,'oy-constants-v1.js'));
const app=fs.readFileSync(path.join(SRC,'app.js'),'utf8');
const grab=name=>{const s=app.indexOf('var '+name+'=[');let i=app.indexOf('[',s),d=0,j=i;for(;j<app.length;j++){const c=app[j];if(c==='[')d++;else if(c===']'){d--;if(!d)break}}return JSON.parse(app.slice(i,j+1))};
const domains=grab('domains');
assert.deepEqual(OC.DOMAINS.map(d=>d.name),domains.map(d=>d.name),'domain names');
let n=0;assert.deepEqual(OC.DOMAINS.map(d=>d.items),domains.map(d=>d.items.map(()=>++n)),'domain item numbers');
assert.equal(OC.SYSTEM_OF_DOMAIN.length,domains.length);
const criteria=fs.readFileSync(path.join(SRC,'criteria.js'),'utf8');
assert.ok(criteria.includes('['+OC.SAFETY_ITEMS.join(',')+']'),'criteria.js safety items');
assert.ok(/\['4','5','12','13'\]/.test(criteria),'criteria.js follow-up items');
assert.deepEqual([...OC.FOLLOWUP_ITEMS],[4,5,12,13]);
// 안전문항으로 보이는 배열 사본은 모두 [1,2,7,25]여야 한다
let copies=0;const bad=[];
for(const f of fs.readdirSync(SRC).filter(f=>f.endsWith('.js'))){
  const t=fs.readFileSync(path.join(SRC,f),'utf8');
  for(const m of t.matchAll(/\[\s*1\s*,\s*2\s*,\s*7\b[^\]]*\]/g)){copies++;if(m[0].replace(/\s/g,'')!=='[1,2,7,25]')bad.push(f+': '+m[0]);}
}
assert.deepEqual(bad,[],'safety item copies differ');
// 메인 화면에서만 쓰는 판정·해석 모듈은 사본을 두지 않고 공통 정의를 읽는다(2026-10-29 해석 모듈 6개 추가).
// support-model·scale-interpretation-v821 등은 공통 정의를 싣지 않는 다른 화면도 쓰므로 사본을 두고 위 검사로 지킨다.
for(const f of ['oy-decision-v1.js','oy-perspective-v1.js','oy-deep-interpretation-v1.js','oy-narrative-interpretation-v1.js','oy-scale-figures-v1.js','oy-cross-patterns-v1.js','integrated-index-v1.js','result-readout-v1.js'])assert.ok(!/\[1,2,7,25\]/.test(fs.readFileSync(path.join(SRC,f),'utf8')),f+' should read OYConstants');
// Any page that loads a module reading OYConstants must load oy-constants-v1.js before it.
for(const page of fs.readdirSync(SRC).filter(f=>f.endsWith('.html'))){
  const srcs=[...fs.readFileSync(path.join(SRC,page),'utf8').matchAll(/<script\b[^>]*src="([^"?]+)/g)].map(m=>m[1]);
  const at=srcs.indexOf('oy-constants-v1.js');
  for(const f of ['oy-decision-v1.js','oy-perspective-v1.js','oy-deep-interpretation-v1.js','oy-narrative-interpretation-v1.js','oy-scale-figures-v1.js','oy-cross-patterns-v1.js','integrated-index-v1.js','result-readout-v1.js']){
    const i=srcs.indexOf(f);if(i>=0)assert.ok(at>=0&&at<i,page+' loads '+f+' before oy-constants-v1.js');
  }
}
console.log('oy-constants-drift ok · safety-item copies elsewhere:',copies);
