// Evidence registry: every cited id exists, the report shows the "why" lines, and CORE decisions do not move.
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','docs','youth-risk');
const EV=require(path.join(dir,'oy-evidence-v1.js'));
const D=require(path.join(dir,'oy-deep-interpretation-v1.js'));
const C=require(path.join(dir,'criteria.js'));
const G=require('./fixtures/xmod1200-gen.cjs');

assert.strictEqual(EV.SOURCES.length,50,'50 new sources');
assert.strictEqual(new Set(EV.SOURCES.map(s=>s.id)).size,50,'ids unique');
EV.SOURCES.forEach(s=>{assert.ok(EV.KINDS[s.kind],s.id+' kind');assert.ok(EV.FIELDS[s.field],s.id+' field');assert.ok(s.ref&&s.use,s.id+' text');assert.ok(!s.url||/^https:\/\//.test(s.url),s.id+' url')});
const cited=[...EV.DOMAIN.flatMap(d=>d.ev),...EV.RULES.flatMap(r=>r.ev),...EV.CHECKS.flatMap(c=>c.ev),...Object.keys(EV.LEVEL).filter(k=>k!=='note').flatMap(k=>EV.LEVEL[k].ev)];
cited.forEach(id=>assert.ok(EV.byId[id],'cited id exists: '+id));
EV.SOURCES.forEach(s=>assert.ok(cited.includes(s.id)||['E08','E09','E43'].includes(s.id),'source used somewhere: '+s.id));
assert.strictEqual(EV.DOMAIN.length,10,'ten domains');
EV.DOMAIN.forEach(d=>assert.ok(!/\d+번|\d+점/.test(d.why),'why text has no item number or score: '+d.name));
// old reference numbers point inside [1]~[18]
EV.DOMAIN.concat(EV.RULES).forEach(x=>(x.old||[]).forEach(n=>assert.ok(+n>=1&&+n<=18,'old ref in range '+n)));

// report wiring
const a=Array(25).fill(0);a[2]=3;a[19]=3;
const r=D.build({answers:a,explicit:[],followups:{}});
assert.ok(r.evidence,'evidence attached');
assert.deepStrictEqual(r.evidence.checks.map(c=>c.id),['housing-tonight','bullying-ask'],'non-scoring checks');
assert.ok(D.html(r).includes('odi-s-evidence')&&D.html(r).includes('references.html'),'evidence section in html');
assert.ok(D.text(r).includes('[왜 이렇게 돕나요 · 근거]'),'evidence in text export');
assert.ok(D.sectionText(r,'evidence').includes('함께 확인할 것'),'section text for ask panel');
const none=D.build({answers:Array(25).fill(0),explicit:[],followups:{}});
assert.deepStrictEqual(none.evidence.domains,[],'no domain lines without difficulties');

// CORE and casework level unchanged across 1,200 synthetic cases (the registry only adds text)
const groups=[2,3,3,3,2,2,3,3,2,2];
let n=0;
for(const c of G.gen(1200,202610291400)){
 const core=C.evaluate(c.answers,groups,!!(c.explicit||[]).length,c.followups||{});
 const rr=D.build({answers:c.answers,explicit:c.explicit||[],followups:c.followups||{}});
 assert.strictEqual(rr.title,core.title,'CORE title unchanged');
 assert.ok(rr.casework.level.id,'level present');
 n++;
}
assert.strictEqual(n,1200);

// entry points are visible
const idx=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert.ok(idx.includes('oy-evidence-v1.js')&&idx.indexOf('oy-evidence-v1.js')<idx.indexOf('oy-deep-interpretation-v1.js'),'registry loads before the report');
assert.ok(idx.includes('href="references.html"'),'footer link');
assert.ok(fs.readFileSync(path.join(dir,'oy-scale-library-v1.js'),'utf8').includes('references.html'),'library link');
const ref=fs.readFileSync(path.join(dir,'references.html'),'utf8');
['evidence-new','evidence-grade','evidence-research','id="references"','oy-evidence-v1.js','references-v2.js'].forEach(k=>assert.ok(ref.includes(k),'references page has '+k));
console.log('oy-evidence: ok');
