const assert=require('node:assert/strict');const M=require('../docs/youth-risk/support-model.js');const C=require('../docs/youth-risk/criteria.js');
const zero=Array(25).fill(0),sizes=[2,3,3,3,2,2,3,3,2,2];
const normal=C.evaluate(zero,sizes,false,{});
assert.equal(normal.urgent,false);assert.equal(normal.provisional,false);assert.equal(normal.knownTotal,0);
const missing=zero.slice();missing[0]='unknown';const uncertain=C.evaluate(missing,sizes,false,{});
assert.equal(uncertain.provisional,true);assert.deepEqual(uncertain.safetyUnknown,[1]);assert.equal(uncertain.knownMaximum,96);
const danger=zero.slice();danger[6]=1;assert.equal(C.evaluate(danger,sizes,false,{}).urgent,true);
const rows=M.welfareZones.map(z=>({orgId:z.orgId,'기관명':z.name,'서비스명':'사례관리','지원대상':'청소년'}));
for(const zone of M.welfareZones){const dong=zone.dongs[0],result=M.routingResources(rows,{gender:'미확인',dong});assert.equal(result.length,1,dong);assert.equal(result[0]['기관명'],zone.name);assert.equal(result[0].profileName,'오산세교종합사회복지관');assert.equal(result[0].welfareZone,zone.number);}
assert.equal(M.routingResources(rows,{gender:'미확인',dong:'오산시 외'}).length,0);
console.log('PASS: CORE zero/unknown/safety invariants and three territory-specific referral names');
