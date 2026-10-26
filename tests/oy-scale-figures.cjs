'use strict';
/* Supplementary figures: range bands (not norms), unknown≠0, red family for difficulty. Virtual answers only. */
const assert=require('node:assert/strict');
const F=require('../docs/youth-risk/oy-scale-figures-v1.js');
assert.deepEqual([0,24.9,25,49.9,50,74.9,75,100].map(F.bandOf),[1,1,2,2,3,3,4,4]);
assert.equal(F.bandOf(null),null);
assert.match(F.NOTICE,/백분위나 4분위 규준이 아닙니다/);
const a=[0,0,1,0,0,3,1,2,3,2,3,0,0,0,0,2,3,3,1,0,0,2,3,'unknown',0];
const f=F.build({answers:a});
assert.equal(f.total.known,24);assert.equal(f.total.max,96);
const dig=f.domains[9];assert.equal(dig.unknown,1);assert.equal(dig.known,1,'unknown item is not counted as zero');
assert.deepEqual(f.dist,[11,3,4,6,0,1]);
const all=F.build({answers:Array(25).fill('unknown')});
assert.equal(all.total.pct,null);assert.equal(all.total.band,null);
all.domains.forEach(d=>assert.equal(d.band,null));
const h=F.html(f);
assert.equal(h.split('구간 기준').length-1,1,'band basis stated once');
assert.ok(!/백분위 \d|상위 \d+%|하위 \d+%/.test(h.replace(F.NOTICE,'')),'no norm-like wording');
assert.ok(h.includes('#a82e4a')||/osf-b4/.test(h));
assert.ok(!/undefined|NaN|null/.test(h));
assert.equal((h.match(/<tr><th scope="row">/g)||[]).length,15,'10 domains + 5 axes rows');
const t=F.text(f);assert.ok(t.includes('2구간')&&t.includes('미상 1문항'));
let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let i=0;i<1000;i++){const ans=Array.from({length:25},()=>{const r=rnd();return r<0.08?'unknown':Math.floor(rnd()*5)});const g=F.build({answers:ans});assert.ok(!/undefined|NaN/.test(F.html(g)));g.domains.forEach(d=>{if(d.pct!==null)assert.ok(d.pct>=0&&d.pct<=100)})}
console.log('oy-scale-figures: ok');
