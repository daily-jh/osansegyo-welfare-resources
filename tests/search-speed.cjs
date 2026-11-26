// 메인 검색 입력 지연(2026-11-26): 글자마다 필터 숫자까지 다시 세며 PC 약 0.9초·휴대폰 약 4초 멈추던 문제.
// 검색어 해석·서비스 검색 글·오늘 날짜를 다시 쓰도록 바꾼 뒤에도 결과가 예전 방식과 똑같은지, 그리고 충분히 빠른지 고정한다.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const M=require('../docs/assets/search-model.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','docs/assets/data.js'),'utf8'),ctx);
const D=ctx.window.WELFARE_DATA;assert.ok(D&&D.organizations.length>100,'data.js');
// 예전 queryMatch(캐시 없음)를 그대로 옮겨 비교 기준으로 쓴다.
const aliases=[['어르신','노인','고령'],['위기가정','위기가구'],['정신건강','마음건강'],['주거지원','주거'],['의료비','치료비']];
function oldQueryMatch(text,keyword){const hay=M.norm(text),q=String(keyword||'').trim();if(!q)return true;
  if(hay.includes(M.norm(q)))return true;
  if(M.suggestWords(q).some(x=>hay.includes(M.norm(x))))return true;
  return q.split(/\s+/).every(token=>{const group=aliases.find(g=>g.includes(token));return (group||[token]).concat(M.suggestWords(token)).some(x=>hay.includes(M.norm(x)))})}
const words=['','정','정신','정신건강','정신건강 상담','우울','죽고 싶어요','어르신 주거','중학생','술','미술','수술비','기저귀','빚이 많아요','게임중독','학폭','오산','24시간','쉼터','노인 돌봄','다문화 통역','없는말ㅋㅋ','  상담  ','의료비','치료비 지원'];
let compared=0;
for(const q of words)for(const o of D.organizations)for(const s of o.services){
  const tags=s.tags||{},text=[o.name,o.kind,s.name,s.category,s.target,s.description,s.method,...Object.values(tags).flat()].join(' ');
  const want=oldQueryMatch(text,q);
  assert.equal(M.queryMatch(text,q),want,'queryMatch '+q+' / '+s.name);
  assert.equal(M.matchesService(o,s,{keyword:q}),want,'matchesService '+q+' / '+s.name);
  compared++;
}
// 같은 서비스를 다른 검색어로 바꿔 불러도 앞 결과가 남지 않는다.
const o0=D.organizations[0],s0=o0.services[0];
assert.equal(M.matchesService(o0,s0,{keyword:o0.name}),true);
assert.equal(M.matchesService(o0,s0,{keyword:'없는말ㅋㅋ'}),false);
assert.equal(M.matchesService(o0,s0,{keyword:o0.name}),true);
// suggestWords가 돌려준 목록을 고쳐도 다음 결과가 오염되지 않는다.
M.suggestWords('술').push('오염');assert.ok(!M.suggestWords('술').includes('오염'));
// 속도: 화면이 글자 하나에 하는 일(필터 선택지 약 90개 × 전체 기관 수)을 흉내 내 1.5초 안에 끝나야 한다(예전엔 수십 초, 지금은 수십 ms).
const t=Date.now();let n=0;
for(const q of ['정','정신','정신건','정신건강'])for(let i=0;i<90;i++)for(const o of D.organizations)if(o.services.some(s=>M.matchesService(o,s,{keyword:q,need:i%7?'':'정신건강'})))n++;
const ms=Date.now()-t;assert.ok(ms<1500,'글자 4개 처리 '+ms+'ms');
console.log('search-speed: '+compared+'건 비교 일치, 글자 4개 × 필터 90개 '+ms+'ms');
