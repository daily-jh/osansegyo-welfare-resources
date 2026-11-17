'use strict';
/* 마침표 없이 이어 쓴 기록(개조식)에서 한 문장의 부정·가정·과거·제3자 표현이 옆 문장으로 번지지 않는지 본다.
   2026-11-17 무작위 가상 2,000사례 점검: 마침표를 뺀 1,450건 중 71건이 원문과 다르게 읽혔고 47건은 안전 단서를 놓쳤다. 모두 가상 문장이다. */
const assert=require('node:assert/strict');
const N=require('../docs/youth-risk/case-context-core.js');
const A=Array(25).fill(0);
const cur=t=>N.reconcile(A,t).signals.filter(x=>x.safety&&['reported','unverified'].includes(x.polarity)&&x.timeHint!=='historical-mention'&&x.subject!=='third-party').map(x=>x.items.join(',')).sort().join('|');
const same=(withDots,msg)=>{const noDots=withDots.replace(/\.(\s|$)/g,'$1');assert.notEqual(noDots,withDots);assert.equal(cur(noDots),cur(withDots),msg+' :: '+noDots)};
// 가정 질문 뒤에 온 실제 진술
same('혹시 가출하게 되면 쉼터가 있냐고 물어봄. 수면제를 모아 두고 있다고 친구에게 말함.','가정 질문(물어봄) 뒤 자해 단서');
same('만약 집에서 맞으면 어디에 말해야 하냐고 물음. 아파도 병원에 데려가 주지 않는다고 함.','가정 질문(물음) 뒤 방임 단서');
// 부정·과거 뒤에 온 현재 진술
same('집에 가기 무섭다고 하교를 미룸. 작년 여름 한 번 가출했다가 바로 돌아왔고 이후 없음.','하교를 미룸 뒤 과거 가출');
same('같은 학원 친구가 몸캠협박을 당했다고알려줌. 지난주부터 사흘째 집에 안 들어가고 PC방에서 잔다고 했음.','제3자 전언(알려줌) 뒤 본인 가출');
same('어제 살기싫다고 일기장에씀. 뉴스에서 본 자살 사건 이야기를 함.','일기장에 씀 뒤 뉴스 이야기');
// 기록 중간의 출처 표시는 새 문장
assert.equal(cur('교복을 살 돈이 없어 사복을 입고 옴 학생 진술: 가출할 생각은 전혀 없다고 함.'),'','출처 표시 뒤 부정은 그대로 부정');
assert.match(cur('집에 가기 무섭다고 하교를 미룸 어머니 전화 상담: 작년에 한 번 가출했으나 이후 없음.'),/1,2/,'출처 표시 앞 문장은 과거로 묻히지 않음');
// 명사는 나누지 않는다
assert.equal(N.reconcile(A,'선생님 말씀 잘 듣고 친구와 싸움 없이 지냄.').signals.filter(x=>x.safety).length,0,'말씀·싸움 같은 명사에서 나누지 않음');
console.log('PASS run-on clause splitting (no-period records read the same as punctuated ones)');
