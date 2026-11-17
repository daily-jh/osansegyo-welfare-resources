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
// 검색 낱말 모두 맞추기(2026-11-17): 두 낱말은 둘 다 담은 자료만, 한 글자 낱말은 낱말 첫머리에서만, 기관 줄임 이름.
{const D=WELFARE_DATA.organizations,find=(q,loose)=>{const r=[];for(const o of D)for(const s of o.services||[])if(M.matchesService(o,s,{keyword:q,loose:!!loose}))r.push(o.name+'|'+s.name);return r};
 const both=find('노인 급식'),one=find('급식');
 assert.ok(both.length<one.length&&!both.some(x=>x.startsWith('조은오산병원')),'노인 급식 should be narrower than 급식: '+both.length+'/'+one.length);
 assert.ok(both.every(x=>one.includes(x)),'노인 급식 must be a subset of 급식');
 assert.equal(M.queryMatch('공식 사이트에서 진료 안내','급식'),false);
 assert.ok(find('아빠 술').length>0,'아빠 술 should find alcohol support');
 assert.ok(find('엄마가 술을 마셔요').length>0,'sentence with 술 should find alcohol support');
 assert.equal(M.queryMatch('직업기술 교육 훈련','술'),false);
 assert.equal(M.queryMatch('알코올 중독 상담','술'),true);
 assert.ok(find('세교복지관').length>0&&find('세교복지관').every(x=>x.startsWith('오산세교종합사회복지관|')),'세교복지관 should mean the centre, not 교복');
 assert.equal(M.nameLike('오산세교종합사회복지관','세교복지관'),true);
 assert.equal(M.nameLike('오산세교종합사회복지관','교복'),false);
 assert.equal(M.nameLike('오산남부종합사회복지관','세교복지관'),false);
 assert.ok(find('교복').length>0,'교복 keeps its own results');
 assert.ok(!find('쌀').some(x=>x.includes('장난감')),'쌀 should not reach toy lending');
 assert.equal(M.queryMatch('가정폭력 상담','가정폭력 쉼터'),false);
 assert.equal(M.queryMatch('가정폭력 상담','가정폭력 쉼터',true),true);}
assert.equal(M.recheckDue({verification:{next:'2026-11-10'}},'2026-11-11'),true);
assert.equal(M.recheckDue({verification:{next:'2026-11-11'}},'2026-11-11'),false);
assert.equal(M.recheckDue({verification:{next:''}},'2026-11-11'),false);
console.log('PASS: recheck due, field words, same-service AND filters, unknown eligibility, synonyms, KST date-based application boundaries');
