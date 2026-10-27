'use strict';
/* Perspective packs (03 학교 지원 · 04 기관 사례관리): synthetic payloads only.
   The packs read model outputs and must never change CORE, show broken values, or invent a narrative-driven branch. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const SRC=path.join(__dirname,'..','docs','youth-risk');
const C=require(path.join(SRC,'criteria.js'));
const P=require(path.join(SRC,'oy-perspective-v1.js'));
const win={};global.window=win;
new Function('window',fs.readFileSync(path.join(SRC,'..','assets','data.js'),'utf8'))(win);
const rows=require(path.join(SRC,'resource-adapter.js')).rows(win.WELFARE_DATA);
delete global.window;

const sizes=[2,3,3,3,2,2,3,3,2,2],labels=['보호·안전','또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const mk=(answers,caseContext='')=>({answers,domains:sizes.map((n,i)=>({name:labels[i],items:Array.from({length:n},(_,j)=>'가상 문항 '+(j+1))})),routes:Array.from({length:10},()=>[]),resources:rows,explicit:[],followups:{},student:{gender:'미확인',dong:'세마동'},caseContext});
const narrative='가상 사례. 담임 관찰: 최근 한 달 지각이 잦고 아침을 거르고 온다고 함. 보호자가 야간 근무로 저녁에 혼자 있는 날이 많다고 학생이 말함. 체육복과 준비물을 자주 빠뜨림. 음악 시간과 방송부 활동은 즐겁게 참여함.';
const cases={
 neglectCue:mk([0,0,0,0,0,1,0,1,2,2,1,0,0,0,0,3,1,1,3,1,2,0,1,2,0],narrative),
 neglectCueNoText:mk([0,0,0,0,0,1,0,1,2,2,1,0,0,0,0,3,1,1,3,1,2,0,1,2,0]),
 urgent:mk([3,2,0,0,0,2,1,1,1,1,1,0,0,0,0,2,2,1,1,1,1,1,1,1,1]),
 zero:mk(Array(25).fill(0)),
 unknownSafety:mk(['unknown',0,0,0,0,2,0,1,2,2,1,0,0,0,0,2,1,1,2,1,2,0,1,2,0])
};
const SCHOOL=['T-1','T-2','T-3','E-1','E-2','E-3'],AGENCY=['A-0','A-1','A-2','A-3','A-4','C-0','C-1','C-2','C-3','C-4','G-1'];

for(const [name,p] of Object.entries(cases)){
 const before=JSON.stringify(C.evaluate(p.answers,sizes,false,{}));
 const A=P.analyze(p);
 assert.deepEqual(A.errors,[],name+' model errors');
 assert.deepEqual(P.sheetCodes('school',p),SCHOOL,name+' school sheets');
 assert.deepEqual(P.sheetCodes('agency',p),AGENCY,name+' agency sheets');
 for(const kind of ['school','agency']){
  const h=P.render(kind,p);
  assert.ok(!/undefined|NaN|\[object |null(?![\w-])/.test(h.replace(/<[^>]+>/g,' ')),name+' '+kind+' broken value: '+(h.replace(/<[^>]+>/g,' ').match(/.{30}(undefined|NaN|\[object |null).{10}/)||[''])[0]);
  assert.ok(h.includes('진단·판정을 대신하지 않음'),name+' '+kind+' footer disclaimer');
  assert.equal((h.match(/class="oyp-sheet/g)||[]).length,kind==='school'?6:11,name+' '+kind+' sheet count');
  const banner=/class="oyp-alert"/.test(h);
  assert.equal(banner,name==='urgent'||name==='unknownSafety',name+' '+kind+' safety banner');
 }
 assert.equal(JSON.stringify(C.evaluate(p.answers,sizes,false,{})),before,name+' CORE changed');
}

// The narrative-only neglect cue raises SUPPORT-5; the A-0 figure branches on interview confirmation only then.
const fork=p=>/추정 · 서술에서만/.test(P.render('agency',p));
assert.equal(fork(cases.neglectCue),true,'narrative cue drives the confirmation branch');
assert.equal(fork(cases.neglectCueNoText),false,'no narrative, no branch');
assert.equal(fork(cases.urgent),false,'urgent case is not a pending branch');

// 2주 관찰 기록지: only items scored 2+ become classroom rows; safety items are never observation rows.
const t2=P.render('school',cases.neglectCue).split('data-code="T-2"')[1].split('data-code="T-3"')[0];
assert.ok((t2.match(/class="oyp-ob"/g)||[]).length>=20,'clickable observation cells');
assert.ok(!/학대|자해|자살/.test(t2),'safety items stay out of the observation grid');
const zeroT2=P.render('school',cases.zero).split('data-code="T-2"')[1].split('data-code="T-3"')[0];
assert.equal((zeroT2.match(/<tr><th>/g)||[]).length,1,'all-zero case keeps only the free row');

// 아동·가족 기관 묶음 covers the agency types practitioners asked for.
const child=P.render('agency',cases.neglectCue).split('data-oyp-s="child"')[2]||'';
for(const k of ['지역아동센터','드림스타트','아동보호전문기관','가족센터'])assert.ok(child.includes(k),'child pack covers '+k);
assert.match(child,/112/,'reporting route named');

// No real case material: rendered packs carry only the synthetic text we passed in.
assert.ok(!/\d{6}-\d{7}|010-\d{4}-\d{4}/.test(P.render('agency',cases.neglectCue)),'no resident or phone numbers');
console.log('oy-perspective: ok');
