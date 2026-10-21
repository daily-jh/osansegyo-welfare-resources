(function(root){
'use strict';
var safety=[1,2,7,25],priority=[4,5,8,12,13,16,19,20];
var reasons=['학대 의심은 점수와 별도로 안전·신고 절차 우선','방임 의심은 빈곤 자체와 구분하고 안전·신고 절차 우선','또래 피해와 실제 학교생활 영향 확인','강요·착취는 현재 피해와 보호 필요를 우선 확인','타인에 대한 구체적 위해와 현재 안전 확인','정서적 고통의 지속과 일상 기능 영향 확인','한 번의 자해·죽음 관련 신호도 직접 안전확인','현저한 기능 변화와 의료적 확인 필요 검토','출결 사유와 실제 참여 장벽 확인','성적순위가 아닌 지원 후 남은 학습 장벽 확인','학생의 학업 지속 의사와 소속감 확인','충동·위험 행동의 위해와 안전 확인','건강 위해·급성 증상과 의료 필요 확인','장애 진단이 아닌 환경 조정 부족 평가','필요한 편의·서비스의 미충족 평가','실제 돌봄 공백과 당장 필요한 보호 확인','가족 형태가 아닌 갈등의 실제 영향 확인','가족돌봄의 시간·책임과 생활 영향 확인','식사·의복 등 당장 부족한 필수자원 확인','거주 안전·불안정과 현재 보호 필요 확인','소득 자체가 아닌 서비스 접근 장벽 평가','원하지 않는 고립과 참여 장벽 확인','실제로 도움받을 어른·체계의 부족 확인','사용시간이 아닌 실제 생활 기능 저하 확인','성착취·협박 신호는 점수와 별도로 피해 보호 우선'];
var items=reasons.map(function(reason,i){var n=i+1;return {number:n,type:safety.includes(n)?'safety':priority.includes(n)?'priority':'function',reason:reason}});
function evaluate(values,groups,explicit){
 if(values.length!==25||values.some(function(v){return !Number.isInteger(v)||v<0||v>4}))throw Error('25개 문항 각각 0~4점 필요');
 var offset=0,substantial=[],severe=[],critical=[];
 groups.forEach(function(size,di){var part=values.slice(offset,offset+size);if(part.some(v=>v>=3)||part.filter(v=>v>=2).length>=2)substantial.push(di);part.forEach(function(v,k){var num=offset+k+1;if(v>=3)severe.push(num);if(v>=3&&items[num-1].type==='priority')critical.push(num)});offset+=size});
 var safetyItems=safety.filter(n=>values[n-1]>0),urgent=!!explicit||safetyItems.length>0;
 var level=substantial.length>=3&&severe.length>=3?3:substantial.length>=2?2:values.some(v=>v>=2)?1:0;
 var names=['관찰·예방 및 경과 확인','해당 영역 개별지원 검토','복합욕구 공동사정 · 학맞통 협의 검토','다기관 집중지원 필요성 검토'];
 var descriptions=['현재 응답에서는 경미·일시적 신호 중심입니다. 학생 의견과 관찰 근거를 확인하며 경과를 살펴보세요.','반복되는 어려움 또는 개별 기능 제한을 해당 영역 담당자가 먼저 확인합니다. 한 문항의 심한 어려움도 총점과 무관하게 적절한 전문지원을 검토하세요.','여러 영역에서 기능 저하 또는 반복된 지원 필요 신호가 겹칩니다. 학교에서 기존 지원·실제 복합성·조정 필요를 확인한 뒤 학맞통 협의 여부를 검토하세요.','여러 영역의 뚜렷한 기능 저하가 함께 보고됐습니다. 학교·관련 전문기관의 공동사정으로 집중지원 필요성과 역할분담을 검토하세요.'];
 return {level:level,urgent:urgent,safetyItems:safetyItems,critical:critical,severe:severe,substantial:substantial,integrated:level>=2,title:urgent?'즉시 안전확인 및 사안별 보호절차 검토':names[level],description:descriptions[level],reason:'안전우선 문항 '+safetyItems.length+'개 / 기능저하(3~4점) '+severe.length+'개 / 지원집중 영역 '+substantial.length+'개 / 현재 보호·건강·필수생활 우선확인 '+critical.length+'개'};
}
var api={items:items,evaluate:evaluate};if(typeof module!=='undefined')module.exports=api;else root.YouthCriteria=api;
})(typeof window!=='undefined'?window:globalThis);
