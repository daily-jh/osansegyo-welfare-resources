const assert=require('node:assert/strict'),M=require('../docs/assets/search-model.js');
const org={name:'테스트 기관',kind:'복지관'};
const service=(name,target,need)=>({name,category:'',target,description:'',method:'',tags:{target:[target],need:[need],form:[],intake:[]},localAvailable:'확인 필요',operationType:'확인 필요',verification:{status:'미확인'},rounds:[]});
const housing=service('청소년 주거','청소년','주거'),elder=service('노인 돌봄','노인','돌봄');
assert.equal([housing,elder].some(s=>M.matchesService(org,s,{audience:'노인',need:'주거'})),false);
assert.equal(M.matchesService(org,housing,{audience:'청소년',need:'주거'}),true);
assert.equal(M.matchesService(org,housing,{local:'가능'}),false);
assert.equal(M.matchesService(org,housing,{keyword:'청소년 주거'}),true);
assert.equal(M.queryMatch('노인 돌봄','어르신'),true);
assert.equal(M.queryMatch('위기가구 지원','위기가정'),true);
assert.equal(M.queryMatch('긴급복지 지원','위기가정'),false);
const round={opens_on:'2026-10-01',closes_on:'2026-10-31',verified_on:'2026-10-01',source_url:'https://example.org',local_available:'가능'};
assert.equal(M.roundState(round,'2026-10-22'),'모집중');
assert.equal(M.roundState(round,'2026-10-31'),'모집중');
assert.equal(M.roundState(round,'2026-11-01'),'마감');
assert.equal(M.roundState(round,'2026-09-30'),'예정');
assert.equal(M.roundState({...round,verified_on:''},'2026-10-22'),'확인 필요');
assert.equal(M.roundState({...round,opens_on:''},'2026-10-22'),'확인 필요');
assert.equal(M.roundState({...round,local_available:'확인 필요'},'2026-10-22'),'확인 필요');
assert.equal(M.applicationState({...housing,operationType:'공모형',rounds:[round]},'2026-11-01'),'마감');
assert.equal(M.applicationState(housing,'2026-10-22'),'확인 필요');
// 현장 말 검색(2026-11-11): 일상어가 자료에 쓰인 말로 넓혀지고, 넓힘은 한쪽 방향만.
assert.equal(M.queryMatch('자살예방상담전화 109 정신건강위기상담','자해'),true);
assert.equal(M.queryMatch('스마트쉼센터 스마트폰 과의존 상담','게임중독'),true);
assert.equal(M.queryMatch('다누리콜센터 다국어 상담','통역'),true);
assert.equal(M.queryMatch('신용회복위원회 채무조정','빚'),true);
assert.equal(M.queryMatch('지역아동센터 급식 제공','죽고 싶어요'),false);
assert.equal(M.queryMatch('자살예방상담전화 109','죽고 싶어요'),true);
assert.equal(M.queryMatch('스마트쉼센터 과의존','자해'),false);
assert.deepEqual(M.suggestWords('우주여행'),[]);
assert.ok(M.suggestWords('가출').includes('쉼터'));
{global.window=global;require('../docs/assets/data.js');const zero=[];
 for(const q of ['자해','무료급식','결식','가출','게임중독','빚','통역','은둔','전기요금','조손','안경','학원비','아르바이트','임신']){
  const n=WELFARE_DATA.organizations.reduce((a,o)=>a+(o.services||[]).filter(s=>M.matchesService(o,s,{keyword:q})).length,0);if(!n)zero.push(q)}
 assert.deepEqual(zero,[],'field words with no result: '+zero.join(','));}
console.log('PASS: field words, same-service AND filters, unknown eligibility, synonyms, KST date-based application boundaries');
