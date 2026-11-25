// 지역 범주 5단계(2026-11-25 4차 고도화): 오산시 → 인근 시 → 경기도 → 전국 공공 → 전국 민간.
// 원본 범주(level)는 바뀌지 않고, 모든 추천·검색 정렬이 오산 우선을 지키는지 본다.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),ctx);const D=ctx.window.WELFARE_DATA;
const ORDER=['osan','near','gyeonggi','national-public','national-private'];
const W=require('../docs/assets/welfare-tools-model.js'),S=require('../docs/assets/service-guide-model.js'),O=require('../docs/assets/resource-overview-model.js');
const A=require('../docs/youth-risk/resource-adapter.js'),M=require('../docs/youth-risk/support-model.js'),C=require('../docs/care/care-model.js');

// 1. 자료: 모든 기관에 범주가 있고, 인근 시는 원본 '경기도'에서만 나오며 시 이름이 붙는다.
for(const o of D.organizations){
 assert.ok(ORDER.includes(o.tier),o.name);
 assert.equal(o.scope,D.tiers[ORDER.indexOf(o.tier)].label,o.name);
 if(o.tier==='near')assert.ok(o.level==='경기도'&&['수원시','화성시','평택시'].includes(o.tierCity),o.name);
 else assert.equal(o.tierCity,'',o.name);
 if(o.tier==='osan')assert.equal(o.level,'오산시');
}
const near=D.organizations.filter(o=>o.tier==='near').map(o=>o.name);
assert.ok(near.includes('아주대학교병원')&&near.includes('수원가정법원 소년부'),near.join(','));
assert.ok(D.organizations.find(o=>o.name==='경기도청').tier==='gyeonggi','광역 기관은 수원에 있어도 경기도');

// 2. 복지혜택 자가점검: 같은 대상 일치 안에서는 범주 순서가 거꾸로 가지 않는다.
const rank=o=>ORDER.indexOf(W.tierOf(o));
for(const t of ['',...W.targets(D)]){
 for(const g of W.selfCheck(D,{target:t,situations:W.SITUATIONS.map(s=>s.id),perGroup:50}).groups)
  for(let i=1;i<g.items.length;i++)if(g.items[i-1].fit===g.items[i].fit)assert.ok(rank(g.items[i-1].o)<=rank(g.items[i].o),g.need+' '+g.items[i].o.name);
}
assert.equal(W.tierLabel({o:D.organizations.find(o=>o.name==='아주대학교병원')}),'인근 시·수원');

// 3. 서비스 안내: 범위 선택과 예전 주소(scope=민간) 호환
const entries=D.organizations.flatMap(o=>o.services.map(s=>({o,s})));
assert.ok(entries.filter(e=>S.matches(e,{scope:'인근 시'})).every(e=>e.o.tier==='near'));
assert.ok(entries.filter(e=>S.matches(e,{scope:'경기도'})).every(e=>e.o.tier==='gyeonggi'));
assert.equal(entries.filter(e=>S.matches(e,{scope:'민간'})).length,entries.filter(e=>e.o.level==='민간'&&!['중단','폐지'].includes(e.o.status)).length);

// 4. 영역별 연결도: 인근 시 단추
const nearMap=O.build(D,'인근 시');assert.ok(nearMap.count>=1&&nearMap.count===D.organizations.filter(o=>o.tier==='near'&&o.services.length&&!['중단','폐지'].includes(o.status)).length);

// 5. OY-RALS 03 연계 후보: 같은 연계 순위(order) 안에서는 오산 → 인근 시 → 경기 순.
const rows=A.rows(D);assert.ok(rows.every(r=>r['지역범주']&&('regionTier' in r)));
assert.equal(M.regionRank({regionTier:'osan'}),0);assert.equal(M.regionRank({regionTier:'near'}),1);assert.equal(M.regionRank({'범주':'경기도'}),2);
const app=fs.readFileSync('docs/youth-risk/app.js','utf8');const routes=JSON.parse(app.slice(app.indexOf('var routes=')+11,app.indexOf('];',app.indexOf('var routes='))+1));
const sizes=[2,3,3,3,2,2,3,3,2,2];let checked=0,pairs=0;
for(let k=0;k<60;k++){
 const answers=Array.from({length:25},(_,i)=>((i*7+k*3)%5===0)?3:((i+k)%4===0?2:((i*k)%6===1?1:0)));
 const p={answers,domains:sizes.map((n,i)=>({name:'영역'+i,items:Array(n).fill('문항')})),routes,resources:rows,explicit:[]};
 for(const d of M.domains(p)){const list=M.candidates(p,d);
  for(let i=1;i<list.length;i++){pairs++;const x=M.describe(p,d,list[i-1]),y=M.describe(p,d,list[i]);
   if(x.order===y.order){assert.ok(M.regionRank(list[i-1])<=M.regionRank(list[i]),'region order '+list[i-1]['기관명']+' > '+list[i]['기관명']);checked++}}}
}
assert.ok(checked>20,'checked '+checked);

// 6. 통합돌봄 길잡이 연결 기관: 범주 순서
const CD=require('../docs/care/care-data.js');const RANK={osan:0,near:1,gyeonggi:2,'national-public':3,'national-private':4};let careN=0;
for(const svc of (CD.services||[])){const m=C.matchResources(svc,D,{});for(let i=1;i<m.length;i++){assert.ok(RANK[m[i-1].tier]<=RANK[m[i].tier],svc.name);careN++}}
assert.ok(careN>0);

// 7. 공공데이터 기관 목록 표지: 인근 시 주소는 '인근 시', 오산은 '오산'
const P=require('../docs/assets/public-facilities.js');
assert.equal(P.place({region:'gyeonggi',address:'경기도 수원시 팔달구 1'}),'near');
assert.equal(P.place({region:'osan',address:'경기도 오산시 1'}),'osan');
assert.equal(P.place({region:'gyeonggi',address:'경기도 부천시 1'}),'gyeonggi');
const ordered=P.nearFirst([{region:'gyeonggi',address:'경기도 부천시'},{region:'near',address:'경기도 평택시',city:'평택시'},{region:'osan',address:'경기도 오산시'}]).map(i=>P.place(i));
assert.deepEqual(ordered,['osan','near','gyeonggi']);
console.log('PASS region tiers: '+D.organizations.length+' orgs ('+ORDER.map(t=>t+' '+D.organizations.filter(o=>o.tier===t).length).join(', ')+'), OY-RALS same-order pairs checked '+checked);
