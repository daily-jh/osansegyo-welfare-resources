'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../docs/youth-risk'),f=n=>fs.readFileSync(path.join(root,n),'utf8');
const html=f('index.html');
const tags=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
// 2026-10-26: the in-flow OY-CIE dialogue is retired from the main page (replaced by the ask panel).
// 2026-10-29: its UI file is removed; the engine stays for the standalone research page.
for(const t of ['cie-lab-v32/engine.js','cie-lab-v32/dialogue-v32.js','cie-flow-v32.js'])assert.ok(!tags.includes(t),'retired from main page: '+t);
for(const s of tags)assert.ok(fs.existsSync(path.join(root,s)),'missing JS '+s);
assert.ok(!html.includes('cie-flow-v32.css?'));
assert.ok(!fs.existsSync(path.join(root,'cie-flow-v32.js')),'retired UI file removed');
assert.ok(/window\.OYModelGateway\?\.analyze/.test(f('journey-v88.js')));
const gateway=require('../docs/youth-risk/model-gateway-v90.js');
const C=require('../docs/youth-risk/criteria.js'),P=require('../docs/youth-risk/cie-lab-v32/practice-playbook-v32.json'),B=require('../docs/youth-risk/cie-lab-v32/engine.js'),D=require('../docs/youth-risk/cie-lab-v32/dialogue-v32.js');
const answers=Array(25).fill(0);answers[6]=1;
const result=D.run({answers,caseContext:'',followups:{},explicit:[]},'안전 확인',{engine:B,criteria:C,playbook:P});
assert.ok(result.gates.some(g=>g.id==='CORE-SAFETY'));assert.equal(result.official.knownTotal,1);
assert.ok(gateway.status().find(x=>x.id==='CORE')?.loaded);
assert.ok(gateway.status().find(x=>x.id==='K-CARR')?.loaded);
console.log('PASS: OY-CIE V3.2 retired from main flow and its UI file removed, official CORE safety and gateway intact');
