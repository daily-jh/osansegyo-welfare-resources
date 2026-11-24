// 복지혜택 자가점검·자원 공백 지도 모델: 자격 판정 없이 후보만, 실무자용·중단 서비스 제외, 칸 합계 일관성.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const W=require('../docs/assets/welfare-tools-model.js'),M=require('../docs/youth-risk/support-model.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('docs/assets/data.js','utf8'),ctx);const D=ctx.window.WELFARE_DATA;
assert.ok(!W.targets(D).includes('기관·실무자'));
for(const t of ['',...W.targets(D)]){
 const r=W.selfCheck(D,{target:t,situations:W.SITUATIONS.map(s=>s.id)});
 assert.equal(r.groups.length,W.SITUATIONS.length);assert.equal(r.urgent,true);
 for(const g of r.groups){
  assert.ok(g.items.length<=5);assert.equal(new Set(g.items.map(e=>e.o.id)).size,g.items.length,'한 기관은 한 번만');
  assert.equal(W.LEVELS.reduce((n,l)=>n+g.byLevel[l],0),g.total);
  for(const e of g.items){assert.ok(e.s.tags.need.includes(g.need));assert.ok(!['중단','폐지'].includes(e.o.status));assert.ok(e.fit==='exact'||e.fit==='open');if(t&&e.fit==='exact')assert.ok(e.s.tags.target.includes(t));}
  for(let i=1;i<g.items.length;i++)if(g.items[i-1].fit===g.items[i].fit)assert.ok(['오산시','경기도','민간'].indexOf(g.items[i-1].level)<=['오산시','경기도','민간'].indexOf(g.items[i].level)||g.items[i-1].fit!==g.items[i].fit);
 }
}
assert.equal(W.selfCheck(D,{situations:['money']}).urgent,false);
assert.ok(W.selfCheck(D,{situations:[]}).groups.length===0);
const G=W.gapMatrix(D);assert.equal(G.summary.cells,G.needs.length*G.targets.length);
assert.equal(G.summary.none+G.summary.osanNone+G.summary.thin+G.summary.ok,G.summary.cells);
for(const r of G.rows)for(const c of r.cells){assert.equal(W.cellServices(D,c.need,c.target).length,c.total);if(c.type==='osan-none')assert.ok(c.by['오산시']===0&&c.total>0);}
assert.ok(G.gaps.every(c=>c.type==='osan-none'||c.type==='none'));
// 정신건강의학과 후보 묶음 안내는 점수와 무관한 문구만 돌려준다.
assert.match(M.companion({'기관유형':'정신건강의학과 의원','서비스명':'정신건강의학과 외래 진료'}),/마인드케어/);
assert.equal(M.companion({'기관유형':'종합사회복지관','서비스명':'사례관리'}),'');
console.log('PASS welfare tools: self-check '+W.SITUATIONS.length+' situations × '+(W.targets(D).length+1)+' targets, gap matrix '+G.summary.cells+' cells (오산 없음 '+G.summary.osanNone+'), companion note');
