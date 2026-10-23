const assert=require('node:assert/strict'),P=require('../docs/youth-risk/response-presentation.js');
const x=P.sections('[안전]\n안전이 확인된 것은 아닙니다.\n\n[계획]\n안전이 확인된 것은 아닙니다.\n담당자와 다음 확인일을 정합니다.\n');
assert.equal(x.length,2);assert.equal(x[0].lines[0],'안전이 확인된 것은 아닙니다.');assert.deepEqual(x[1].lines,['담당자와 다음 확인일을 정합니다.']);
assert.match(P.textHTML('[검토]\n<img src=x onerror=alert(1)>'),/&lt;img/);assert.doesNotMatch(P.textHTML('[검토]\n<img src=x onerror=alert(1)>'),/<img/);
assert.match(P.textHTML('[근거]\n보정계수 1.12배. 안전 판정 보류.'),/1\.12배/);
assert.equal(P.sections('[첫 행동]\n학생과 확인합니다.\n[다음 행동]\n학생과   확인합니다.').length,1);
console.log('PASS response presentation: repeated complete lines merge; negation/decimal preserved; untrusted text escaped');
