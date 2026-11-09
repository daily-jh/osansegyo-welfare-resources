const assert=require('node:assert/strict');
const P=require('../docs/assets/program-feed.js');globalThis.ProgramFeed=P;
const M=require('../docs/assets/search-model.js');
const data={taxonomy:{target:['청소년'],need:['교육'],form:[],intake:[]},organizations:[{id:'1',name:'오산시가족센터',services:[]},{id:'2',name:'다른기관',services:[]}]};
const p={id:'test',title:'테스트 사업',organization:'오산시 가족센터',target:'청소년',method:'원문 접수',sourceUrl:'https://example.org/notice/1',verifiedOn:'2026-10-22',opensOn:'2026-10-01',closesOn:'2026-10-31',status:'모집중',tags:{target:['청소년'],need:['교육']}};
assert.equal(P.merge(data,{programs:[p,p,{...p,organization:'미등록기관'},{...p,title:'미확인',sourceUrl:''}]}),1);
assert.equal(data.organizations[0].services.length,1);assert.equal(data.organizations[1].services.length,0);
const s=data.organizations[0].services[0];
assert.equal(M.matchesService(data.organizations[0],s,{keyword:'테스트',need:'교육',audience:'청소년',application:'모집중'},'2026-10-22'),true);
assert.equal(M.matchesService(data.organizations[0],s,{application:'모집중'},'2026-11-01'),false);
assert.equal(P.status({...p,status:'마감'},'2026-10-22'),'마감');
assert.equal(P.status({...p,verifiedOn:''},'2026-10-22'),'확인 필요');
assert.equal(P.merge(data,{programs:[p]}),0);
console.log('PASS: institution matching, deduplication, integrated search, deadlines, missing evidence');
// A failed refresh (2026-11-03 random audit P2): keep the last good list but never show it as open, and say when it was last checked.
{
 const d={taxonomy:{target:['청소년'],need:['교육'],form:[],intake:[]},organizations:[{id:'1',name:'오산시가족센터',services:[]}]};
 const feed={lastAttemptAt:'2026-11-02T09:05:32+09:00',lastSuccessAt:'2026-10-22T22:28:56+09:00',lastError:'HTTP 403',programs:[p]};
 const f=P.freshness(feed);assert.equal(f.failed,true);assert.equal(f.lastSuccessOn,'2026-10-22');
 assert.equal(P.merge(d,feed),1);const s2=d.organizations[0].services[0];
 assert.equal(P.status(s2.externalProgram,'2026-10-22'),'확인 필요');
 assert.equal(P.status({...s2.externalProgram,status:'마감'},'2026-10-22'),'마감');
 assert.match(s2.operation,/갱신 실패.*마지막 확인 2026-10-22/);
 assert.equal(P.freshness({lastAttemptAt:'2026-11-02T09:00:00+09:00',lastSuccessAt:'2026-11-02T09:00:00+09:00',lastError:''}).failed,false);
 const real=require('../docs/programs.json');assert.ok(real.programs.every(x=>P.status({...x,feed:P.freshness(real)},'2026-11-03')!=='모집중'));
 console.log('PASS: failed refresh shows last checked date and never reads as open');
}
// Separate official sources retain their own freshness and do not duplicate base services.
{
 const feed={lastError:'Welinfo blocked',programs:[],sources:{official:{lastAttemptAt:'2026-11-09T09:00:00+09:00',lastSuccessAt:'2026-11-09T09:00:00+09:00',lastError:''}}};
 const official={...p,sourceId:'official',organizationId:'1'};
 assert.equal(P.sourceState(feed,official).failed,false);
 assert.equal(P.sourceState(feed,{...official,sourceId:'missing'}).failed,true);
 assert.equal(P.sourceState({...feed,sources:{empty:{}}},{...official,sourceId:'empty'}).failed,true);
 assert.equal(P.sourceState(feed,p).failed,true);
 assert.equal(P.sourceState(feed,{...p,sourceId:'welinfo'}).failed,true);
 const d={taxonomy:data.taxonomy,organizations:[{id:'1',name:'오산시가족센터',services:[]}]};
 assert.equal(P.merge(d,{...feed,programs:[official]}),1);
 assert.equal(P.status(d.organizations[0].services[0].externalProgram,'2026-10-22'),'모집중');
 assert.equal(P.status({...official,status:'확인 필요'},'2026-10-22'),'확인 필요');
 assert.equal(P.merge(d,{...feed,programs:[{...official,title:'기관명 불일치',organization:'다른기관'}]}),0);
 const base={taxonomy:data.taxonomy,organizations:[{id:'1',name:'오산시가족센터',services:[{name:p.title,source:p.sourceUrl}]}]};
 assert.equal(P.merge(base,{...feed,programs:[official]}),0);
 feed.sources.official.lastError='상세 공고 실패';
 assert.equal(P.sourceState(feed,official).failed,true); // equal timestamps still fail closed
 console.log('PASS: source isolation, unknown source, ID/name mismatch, base-service deduplication');
}
