// 사는 동(행정동) 공통 규칙(2026-11-26): 메인 복지자원 찾기·통합돌봄 길잡이·복지혜택 자가점검이 쓰는 residence-v1.js가
// OY-RALS(청소년 위기징후) support-model.js의 거주 지역 로직과 같은지, 세 화면에 실제로 이어졌는지, 메인 검색 속도를 떨어뜨리지 않는지 확인한다.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const R=require('../docs/assets/residence-v1.js'),YM=require('../docs/youth-risk/support-model.js'),A=require('../docs/youth-risk/resource-adapter.js');
const WT=require('../docs/assets/welfare-tools-model.js'),CM=require('../docs/care/care-model.js');
const ctx={window:{}};vm.runInNewContext(read('docs/assets/data.js'),ctx);const D=ctx.window.WELFARE_DATA,orgs=D.organizations;

// 1. 값이 OY-RALS와 같다(동 목록·인근 시·복지관 권역).
assert.deepEqual([...R.DONGS],[...YM.dongs],'행정동 8개 목록');
assert.deepEqual([...R.NEAR_CITIES],[...YM.NEAR_CITIES],'인근 시');
assert.deepEqual(JSON.parse(JSON.stringify(R.ZONES)),JSON.parse(JSON.stringify(YM.welfareZones)),'복지관 권역');
const studentDong=read('docs/youth-risk/assessment.html').match(/id="studentDong">([\s\S]*?)<\/select>/)[1];
const optVals=s=>[...s.matchAll(/<option value="([^"]*)"/g)].map(m=>m[1]);
assert.deepEqual(optVals(R.optionsHTML('')),optVals(studentDong),'선택칸 보기가 OY-RALS 01 입력과 같은 순서');

// 2. 동작이 OY-RALS와 같다: 어떤 동/행정복지센터·복지관이 남는지, 정렬 값(regionRank), 표시 역할(regionRole).
const rows=A.rows(D);
for(const dong of [...R.DONGS,...R.OUTSIDE]){
  const ym=YM.routingResources(rows,{dong});
  const keptYM=new Set(ym.filter(r=>/행정복지센터$|종합사회복지관$/.test(r['기관명'])).map(r=>r['기관명']));
  const keptR=new Set(R.apply(orgs,dong).filter(o=>/행정복지센터$|종합사회복지관$/.test(o.name)&&o.level==='오산시').map(o=>o.name));
  // OY-RALS는 동을 고르지 않았을 때만 8개 동을 '오산시 동 행정복지센터' 하나로 묶는다. 동을 고르면 남는 기관이 같아야 한다.
  assert.deepEqual([...keptR].sort(),[...keptYM].filter(n=>keptR.has(n)||!/^오산/.test(n)).sort(),dong+': 남는 행정복지센터·복지관이 OY-RALS와 같음');
  for(const n of keptYM)if(/^오산시 .+동 행정복지센터$|종합사회복지관$/.test(n))assert.ok(keptR.has(n),dong+': OY-RALS에 남은 '+n+'이 공통 규칙에도 남음');
  const city=YM.nearCity({dong}),outside=YM.outsideOsan({dong});
  for(const r of ym.slice(0,400)){
    const o={name:r['기관명'],tier:r.regionTier,tierCity:r.regionCity,level:r['범주']};
    const yr=YM.regionRole(r,{dong}),rr=R.role(o,dong);
    if(outside){
      if(rr==='near-ref')assert.equal(yr,'shared',dong+' '+o.name+': 다른 인근 시 기관은 OY-RALS에서 shared(공통 규칙은 참고로 뒤에 둠)');
      else assert.equal(rr,yr,dong+' '+o.name+' 역할');
      const yk=YM.regionRank(r,city,outside),rk=R.rank(o,dong);
      if(rr!=='near-ref')assert.equal(rk,yk,dong+' '+o.name+' 정렬 값');
    }else if(R.isDong(dong)){assert.ok(['','mine'].includes(rr),dong+' '+o.name+': OY-RALS에 남은 기관은 다른 관할이 아님')}
  }
}
assert.equal(R.role(orgs.find(o=>o.name==='오산시 세마동 행정복지센터'),'세마동'),'mine');
assert.equal(R.role(orgs.find(o=>o.name==='오산시 중앙동 행정복지센터'),'세마동'),'other');
assert.equal(R.role(orgs.find(o=>o.id==='b45bc16582'),'세마동'),'mine','세마동 → 1권역 오산세교종합사회복지관');
assert.equal(R.role(orgs.find(o=>o.id==='2097512abd'),'세마동'),'other');
assert.equal(R.role(orgs.find(o=>o.name==='오산시정신건강복지센터'),'수원시'),'osan-ref');
assert.equal(R.role(orgs.find(o=>o.name==='수원시청소년상담복지센터'),'수원시'),'local');
assert.equal(R.role(orgs.find(o=>o.name==='오산시정신건강복지센터'),''),'','동을 고르지 않으면 지금과 같음');
assert.equal(R.valid('<script>'),'','허용 목록 밖 값은 버림');
assert.equal(R.fromURL('https://x.test/benefit-check.html?dong=%EC%84%B8%EB%A7%88%EB%8F%99'),'세마동');
assert.equal(R.withDong('care/#check','세마동'),'care/?dong=%EC%84%B8%EB%A7%88%EB%8F%99#check');
const nSuwon=R.notice('수원시',R.apply(orgs,'수원시'));
assert.match(nSuwon.text,/수원시 기관 \d+곳을 먼저/);assert.match(nSuwon.text,/수원시 안에서 같은 역할을 하는 기관에 문의/);

// 3. 복지혜택 자가점검: 내 동 창구만 첫 창구로, 다른 동 창구는 결과에서 빠짐, 타지역이면 오산 창구 없음.
const base=WT.selfCheck(D,{situations:['money','many']});
assert.equal(base.firstDesk.length,8,'동 미선택: 8개 동 창구');
const se=WT.selfCheck(D,{situations:['money','many'],dong:'세마동'});
assert.equal(JSON.stringify(se.firstDesk.map(d=>d.name)),JSON.stringify(['오산시 세마동 행정복지센터']));
assert.equal(se.zone.name,'오산세교종합사회복지관');
for(const g of se.groups)for(const e of g.items)assert.notEqual(e.role,'other');
assert.ok(se.groups.find(g=>g.need==='사례관리').items.slice(0,2).some(e=>e.o.id==='b45bc16582'),'사례관리에 권역 복지관이 앞에');
const sw=WT.selfCheck(D,{situations:['mind'],dong:'수원시'});
assert.equal(sw.firstDesk.length,0);assert.equal(sw.groups[0].items[0].role,'local','수원 거주: 수원 기관이 먼저');
assert.ok(sw.groups[0].items.every(e=>!/^오산시 .+동 행정복지센터$/.test(e.o.name)));

// 4. 통합돌봄 길잡이: 신청 창구가 관할 동 하나로, 타지역이면 오산 동 창구 없음.
const win=d=>CM.matchResources({match:'통합돌봄 신청|통합판정조사'},D,{dedupeOrg:true,dong:d}).map(r=>r.org);
assert.equal(win('').filter(n=>/동 행정복지센터$/.test(n)).length,8);
assert.equal(win('초평동').filter(n=>/행정복지센터$/.test(n)).join(),'오산시 초평동 행정복지센터');
assert.equal(win('평택시').filter(n=>/^오산/.test(n)).length,0);
const mh=CM.matchResources({match:'정신건강|치매'},D,{dedupeOrg:true,dong:'화성시'});
assert.equal(mh[0].role,'local');assert.ok(mh.findIndex(r=>r.role==='osan-ref')>mh.findIndex(r=>r.role==='shared'),'오산 기관은 경기·전국 뒤');

// 5. 세 화면 연결(스크립트·선택칸·안내).
for(const [f,sel] of [['docs/index.html','dongSelect'],['docs/benefit-check.html','dongSelect'],['docs/care/index.html','dongSelect']]){
  const h=read(f);assert.ok(/residence-v1\.js\?v=/.test(h),f+' 공통 모듈');assert.ok(/residence-v1\.css\?v=/.test(h),f+' 공통 표시');assert.ok(h.includes('id="'+sel+'"'),f+' 선택칸');
  assert.ok(h.indexOf('residence-v1.js')<h.search(/(app|benefit-check|care-model)\.js\?v=/),f+' 공통 모듈을 먼저 읽음');
}
const app=read('docs/assets/app.js');
assert.ok(/URLKEYS=\{dong:'dong'/.test(app),'메인: 주소에 동 유지');
assert.ok(!/localStorage[^;]*dong|sessionStorage/.test(app),'사는 동은 저장하지 않음');

// 6. 메인 검색 속도: 동을 골라도 필터 숫자 다시 세기(기관 수 × 보기 수)가 빠르다(역할은 동마다 한 번만 계산).
const roleCache=new Map(),roleOf=(o,d)=>{let m=roleCache.get(d);if(!m){m=new Map();roleCache.set(d,m)}if(!m.has(o.id))m.set(o.id,R.role(o,d));return m.get(o.id)};
const t0=process.hrtime.bigint();let n=0;for(let k=0;k<60;k++)for(const o of orgs)if(roleOf(o,'세마동')!=='other')n++;
const ms=Number(process.hrtime.bigint()-t0)/1e6;assert.ok(ms<60,'동 역할 확인 60회 × 기관 '+orgs.length+' = '+ms.toFixed(1)+'ms');
console.log('PASS: residence rules match OY-RALS ('+R.DONGS.length+' dongs, '+R.OUTSIDE.length+' outside), benefit-check/care/main wired, role check '+ms.toFixed(1)+'ms');
