'use strict';
/* Production wiring contract: tests only active modules and public page references. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'..','docs','youth-risk');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const page=read('index.html'),guide=read('system-method.html'),scripts=[...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1].split('?')[0]);
const has=(a,b)=>{const x=scripts.indexOf(a),y=scripts.indexOf(b);assert.ok(x>=0,a+' missing');assert.ok(y>=0,b+' missing');assert.ok(x<y,a+' must load before '+b);};
const dependencies=[
 ['criteria.js','support-model.js'],
 ['criteria.js','integrated-index-v1.js'],
 ['support-model.js','model-gateway-v90.js'],
 ['case-context-core.js','narrative-structure-v1.js'],
 ['case-context-core.js','model-gateway-v90.js'],
 ['cie-semantic-layer-v2.js','model-gateway-v90.js'],
 ['relations-v88.js','model-gateway-v90.js'],
 ['journey-model-v88.js','model-gateway-v90.js'],
 ['model-gateway-v90.js','journey-v88.js'],
 ['integrated-sections-v3.js','journey-v88.js'],
 ['narrative-structure-v1.js','journey-v88.js'],
 ['cie-lab-v32/engine.js','cie-flow-v32.js'],
 ['cie-lab-v32/dialogue-v32.js','cie-flow-v32.js'],
 ['cie-flow-v32.js','ai-workbench-stage-v1.js']
];
dependencies.forEach(([a,b])=>has(a,b));
const stages=page.match(/data-oy-step="[1-5]"/g)||[];
for(let i=1;i<=5;i++)assert.ok(stages.includes('data-oy-step="'+i+'"'),'UI stage '+i+' unavailable');
assert.ok(page.includes('assessmentFrame'),'assessment iframe required');
assert.ok(page.includes('mapArea'),'original regional resource map required');
assert.ok(page.includes('bundleIncludeContext'),'explicit contextual export selection');
for(const key of ['id="architecture"','STEP 01','STEP 02','STEP 03','STEP 04','STEP 05','OYModelGateway','CORE','SUPPORT-5','ICSI','NCB','OY-CIE','K-CARR','ICMS','Relations','자원연계'])assert.ok(guide.includes(key),'guide missing '+key);
const gateway=require(path.join(dir,'model-gateway-v90.js'));
const states=gateway.status();assert.equal(states.length,9);
states.forEach(s=>assert.equal(s.loaded,true,s.id+' disconnected'));
const main=read('flow.js'),ai=read('ai-workbench-stage-v1.js'),vis=read('stage-insights-v1.js'),map=read('support.js');
for(const part of ['youth-flow-complete-v1','youth-flow-invalid-v1','OYUnsavedGuard','beforeunload','exportBackup'])assert.ok(main.includes(part),'flow missing '+part);
assert.ok(ai.includes('oy-ai-privacy-confirm')&&vis.includes('oy-viz-copy-reviewed'),'PII review required for AI copy');
assert.ok(map.includes('alternativesFor')&&map.includes('최종검토일')&&map.includes('확인 출처'),'resource fallback and provenance');
console.log('PASS production architecture: '+states.length+' linked gateway contracts, '+dependencies.length+' script dependencies, five stages, safety, backup, privacy and referral fallback.');
