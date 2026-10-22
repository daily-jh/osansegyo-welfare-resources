const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('../docs/youth-risk/support-model.js');
// Reuse the actual CSV fixture and routes already used by routing regressions.
const fixture=fs.readFileSync(require.resolve('./youth-map-routing.cjs'),'utf8').split('\n')[0];
const scope={require,console,__dirname};vm.createContext(scope);vm.runInContext(fixture+';this.make=p;this.db=db;this.sizes=sizes;',scope);
let count=0;
for(let n=1;n<=25;n++)for(let score=1;score<=4;score++){
 const p=scope.make({[n]:score}),before=JSON.stringify(p);
 for(const d of S.domains(p)){
  const groups=S.groupedCandidates(p,d);
  assert.equal(new Set(groups.map(g=>g.name)).size,groups.length,'institution repeated');
  assert.deepEqual(S.candidates(p,d),groups.map(g=>g.primary));
  for(const g of groups){
   assert.equal(g.primary,g.services[0]);
   assert.equal(new Set(g.services.map(r=>r.서비스명)).size,g.services.length);
   for(const r of g.services){assert.ok(scope.db.includes(r));assert.equal(r.기관명,g.name);assert.ok(S.describe(p,d,r).evidence.every(n=>p.answers[n-1]>0));}
  }
  count++;
 }
 assert.equal(JSON.stringify(p),before,'source payload mutated');
}
for(const [values,domain,first] of [[{7:1},2,'오산시정신건강복지센터'],[{19:3,20:3,21:2},7,'오산시 동 행정복지센터'],[{16:3,17:2,18:3},6,'오산세교종합사회복지관']]){
 const p=scope.make(values),groups=S.groupedCandidates(p,S.domains(p)[domain]);
 assert.equal(groups[0].name,first);
 assert.ok(groups[0].services.length>1,'related services lost');
 const again=S.groupedCandidates({...p,resources:[...p.resources,...p.resources]},S.domains(p)[domain]);
 assert.deepEqual(again,groups,'duplicate CSV rows changed output');
}
const p=scope.make({16:3,17:3,18:3});p.resources=p.resources.concat([{...p.resources.find(r=>r.기관명==='오산세교종합사회복지관'&&r.서비스명==='지역사회 돌봄 및 주민지원'),기관명:' 오산세교종합사회복지관 ',서비스명:'지역사회 돌봄 및 주민지원 '}]);
const groups=S.groupedCandidates(p,S.domains(p)[6]);assert.equal(groups.filter(g=>g.name==='오산세교종합사회복지관').length,1);
console.log('PASS: '+count+' domain checks; unique institutions; eligible services retained; safe priority; duplicate rows normalized; immutable original data.');
