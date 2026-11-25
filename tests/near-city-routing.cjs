// 거주 지역(인근 시) 선택이 연계 후보 순서에만 쓰이고, 점수·판정은 그대로인지 확인한다(2026-11-25).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../docs/youth-risk/support-model.js'),A=require('../docs/youth-risk/resource-adapter.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),ctx);const db=A.rows(ctx.window.WELFARE_DATA),app=fs.readFileSync('docs/youth-risk/app.js','utf8'),routes=vm.runInNewContext(app.match(/var routes=(\[[\s\S]*?\]);/)[1]);
function make(dong,items){return {student:{gender:'미확인',dong},answers:Array.from({length:25},(_,i)=>items.includes(i+1)?3:0),domains:[2,3,3,3,2,2,3,3,2,2].map((n,i)=>({name:'영역'+i,items:Array(n).fill('문항')})),explicit:[],followups:{},routes,resources:db}}
const names=p=>M.referrals(p).map(g=>g.name);
const expect={'수원시':{mh:/^수원시아동청소년정신건강복지센터$/,yc:'수원시청소년상담복지센터'},'화성시':{mh:/^화성시아동청소년정신건강복지센터$/,yc:'화성시청소년상담복지센터'},'평택시':{mh:/^평택시정신건강복지센터$/,yc:'평택시청소년상담복지센터'}};
for(const [city,e] of Object.entries(expect)){
  for(const items of [[6,8],[3,4],[17]]){
    const base=make('',items),p=make(city,items);
    assert.deepEqual(JSON.stringify(M.context(p)),JSON.stringify(M.context(base)),'판정은 거주 지역과 무관 '+city);
  }
  const mh=names(make(city,[6,8]));
  const iMh=mh.findIndex(n=>e.mh.test(n)),iOs=mh.indexOf('오산시정신건강복지센터');
  assert.ok(iMh>=0,city+' 정신건강 기관 후보 없음: '+mh.join(','));
  assert.ok(iOs<0||iMh<iOs,city+' 기관이 오산 기관보다 앞서야 함');
  assert.ok(!mh.some(n=>/노인정신건강/.test(n)),'노인 센터는 청소년 연계 후보 아님');
  const yc=names(make(city,[3,4]));
  assert.ok(yc.includes(e.yc),city+' 청소년상담복지센터 후보 없음: '+yc.join(','));
  // 다른 시 기관은 섞이지 않는다.
  const other=Object.keys(expect).filter(c=>c!==city);
  assert.ok(!yc.some(n=>other.some(c=>n.startsWith(c))),city+'에 다른 시 기관이 섞임');
  assert.match(M.welfareZoneText({dong:city}),new RegExp(city+' 거주'));
}
// 학대 문항은 그 시 아동보호전문기관이 오산 기관보다 앞선다.
for(const [city,name] of [['수원시','수원아동보호전문기관'],['화성시','화성시아동보호전문기관'],['평택시','경기평택아동보호전문기관']]){const n=names(make(city,[1,2]));assert.ok(n.indexOf(name)>=0&&n.indexOf(name)<n.indexOf('오산시아동보호전문기관'),city+' 아동보호: '+n.join(','))}
// 오산 행정동·기타 지역은 인근 시 기관을 끼워 넣지 않는다.
for(const dong of ['','신장1동','오산시 외'])assert.ok(!names(make(dong,[6,8,3,4])).some(n=>/^(수원시|화성시|평택시)/.test(n)),dong+'에 인근 시 기관이 끼어듦');
assert.equal(M.student({student:{dong:'수원시'}}).dong,'수원시');assert.equal(M.student({student:{dong:'서울시'}}).dong,'');
assert.ok(M.validate(make('평택시',[6])));
console.log('PASS: 수원·화성·평택 거주 선택 시 같은 역할 기관 우선, 판정 불변, 오산·기타 지역은 기존 그대로');
// 타권역 표시(2026-11-25): 그 시 기관 → 경기·전국 → 오산 기관(참고) 순, 오산 기관은 osan-ref 표지, 안내 문구에 예시 기관 이름.
{const p=make('수원시',[1,6,8,17,19]),g=M.referrals(p),roles=g.map(x=>x.regionRole),s=M.student(p);
 const w={local:0,shared:1,'osan-ref':2};for(let i=1;i<roles.length;i++)assert.ok(w[roles[i-1]]<=w[roles[i]],'순서: '+roles.join(','));
 assert.ok(g.filter(x=>/^오산/.test(x.name)).every(x=>x.regionRole==='osan-ref'&&x.regionTag==='오산 기관(참고)'));
 assert.ok(g.some(x=>x.regionRole==='local'&&x.regionTag==='수원시 기관'));
 const n=M.outsideNotice(s,g);assert.match(n.text,/수원시 안에서 같은 역할을 하는 기관에 문의/);assert.ok(n.examples.length&&!n.examples.includes('오산시정신건강복지센터'),'같은 역할 기관이 있는 오산 기관은 예시에서 뺌');
 const o=make('오산시 외',[6,8]),go=M.referrals(o);assert.ok(go.every(x=>x.regionRole!=='local'));assert.match(M.outsideNotice(M.student(o),go).text,/거주 지역 안에서/);
 const q=make('신장1동',[6,8]);assert.ok(M.referrals(q).every(x=>!x.regionRole));assert.equal(M.outsideNotice(M.student(q),M.referrals(q)),null);}
console.log('PASS: 타권역 표시 역할·순서·안내 문구');
