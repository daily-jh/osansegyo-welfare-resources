const assert=require('assert/strict'),D=require('../docs/youth-risk/support-detail.js'),M=require('../docs/youth-risk/support-model.js');
const now='2026-10-26T03:00:00Z',base={directorySource:true,'기관명':'기관A','서비스명':'사업A','최종검토일':'2026-10-20'};
// A service listed in the DB is not "applicable now" unless an open round is locally available.
assert.equal(D.availability({...base,operationType:'확인 필요'},now).applicableNow,null);
assert.equal(D.availability({...base,operationType:'상시'},now).code,'ongoing');
assert.equal(D.availability({...base,localAvailable:'가능',rounds:[{opens_on:'2026-10-01',closes_on:'2026-10-30'}]},now).applicableNow,true);
assert.match(D.availability({...base,localAvailable:'가능',rounds:[{opens_on:'2026-10-01',closes_on:'2026-10-30'}]},now).label,/D-4/);
assert.equal(D.availability({...base,localAvailable:'확인 필요',rounds:[{opens_on:'2026-10-01',closes_on:'2026-10-30'}]},now).applicableNow,null);
assert.equal(D.availability({...base,rounds:[{opens_on:'2026-03-01',closes_on:'2026-04-30'}]},now).applicableNow,false);
assert.equal(D.availability({...base,rounds:[{opens_on:'2026-11-10',closes_on:'2026-11-30'}]},now).code,'upcoming');
// Verification levels and stale checks.
assert.equal(D.verification({...base,verification:{status:'미확인',date:''}},now).level,'unverified');
assert.equal(D.verification({...base,verification:{status:'확인완료',date:'2026-10-24',next:'2026-11-01'}},now).level,'verified');
assert.match(D.verification({...base,verification:{status:'확인완료',date:'2026-10-01',next:'2026-10-10'}},now).flags[0],/지남/);
assert.equal(D.verification({'기관명':'x'},now).level,'unverified');
// Link records: unknown stages fall back, identifiers are masked, summary separates linked from in-progress.
assert.equal(D.cleanRecord({stage:'bogus'}).stage,'candidate');
assert.doesNotMatch(D.cleanRecord({memo:'보호자 010-1234-5678 a@b.kr'}).memo,/010|@/);
const c=D.summarize({a:{stage:'linked'},b:{stage:'contacted'},c:{stage:'unavailable'},d:{}});
assert.deepEqual(c,{candidate:1,progress:1,linked:1,closed:1});
assert.match(D.recordText([{institution:'기관A',service:'사업A',record:{stage:'applied',memo:'010-1111-2222'}}]),/신청·의뢰 보냄.*\[식별정보 제외\]/);
// Basis explains, and does not change, YouthMap ranking.
const p={answers:Array(25).fill(0),domains:[2,3,3,3,2,2,3,3,2,2].map((n,i)=>({name:'영역'+i,items:Array.from({length:n},(_,k)=>'문항'+i+k)})),routes:Array.from({length:10},()=>['오산시정신건강복지센터','기관B']),resources:[{'기관명':'오산시정신건강복지센터','서비스명':'아동청소년 정신건강 연계'},{'기관명':'기관B','서비스명':'청소년 정신 상담','주요내용':'상담'}],explicit:[]};
p.answers[5]=3;const d=M.domains(p)[2],gs=M.groupedCandidates(p,d);
assert.equal(gs[0].name,'오산시정신건강복지센터');
const b=D.basis(p,d,gs[0].primary);assert.equal(b.kind,'profile');assert.deepEqual(b.items.map(x=>x.n),[6]);assert.equal(b.items[0].text,'문항20');
assert.equal(D.basis(p,d,gs[1].primary).kind,'keyword');assert.equal(D.basis(p,d,gs[1].primary).strength,'약함');
assert.deepEqual(D.alternatives(p,d,gs[0],gs,now).map(x=>x.name),['기관B']);
console.log('PASS: availability vs existence, verification levels, record masking/summary, recommendation basis and alternatives');
