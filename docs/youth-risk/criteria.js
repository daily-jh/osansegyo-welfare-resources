(function(root){
'use strict';
var safety=[1,2,7,25],priority=[4,5,8,12,13,16,19,20];
var reasons=['학대가 의심되면 학생의 안전을 먼저 살피고 신고·보호 절차를 따릅니다','가정 형편만으로 판단하지 않고 실제 돌봄과 보호 상황을 살핍니다. 방임이 의심되면 신고·보호 절차를 따릅니다','또래와의 관계에서 겪은 피해와 학교생활의 어려움을 들어봅니다','거절하기 어려운 요구나 협박이 있었는지, 지금 필요한 보호가 무엇인지 살핍니다','어떤 행동과 피해가 있었는지 살피고 학생들의 안전을 챙깁니다','마음의 어려움이 얼마나 이어졌고 일상에 어떤 영향을 주는지 들어봅니다','한 번의 표현이나 흔적도 가볍게 넘기지 않고 현재 안전을 직접 확인합니다','평소와 달라진 생활과 몸 상태를 살피고 필요한 전문평가를 의논합니다','학교에 오거나 수업에 참여하기 어려운 이유를 학생 입장에서 들어봅니다','성적보다 배울 때 막히는 부분과 지금까지 받은 도움을 살핍니다','학교생활을 어떻게 느끼고 앞으로 무엇을 바라는지 들어봅니다','행동 전후의 상황과 다칠 위험을 살피고 필요한 도움을 찾습니다','몸의 상태와 위험을 살피고 응급상황이면 긴급조치를 먼저 진행합니다','학생에게 맞는 설명·환경·수업 방식이 마련되어 있는지 살핍니다','필요한 보조기기·발달지원·돌봄을 이용하고 있는지 살핍니다','하루에 필요한 식사와 돌봄을 어떻게 챙기는지 들어봅니다','가족의 어려움이 학생의 마음과 학교생활에 미치는 영향을 살핍니다','학생이 맡은 돌봄과 쉴 시간, 함께 나눌 어른과 도움을 찾습니다','끼니·옷·위생용품·준비물을 마련할 때의 어려움을 살핍니다','편히 쉬고 공부할 곳이 있는지, 현재 머무는 곳은 안전한지 살핍니다','비용 때문에 필요한 치료나 지원을 미루고 있는지 들어봅니다','함께하고 싶지만 참여하기 어려운 이유와 편한 참여 방식을 들어봅니다','힘들 때 믿고 연락할 사람과 실제 도움받을 방법을 찾습니다','이용 시간보다 잠·수업·만남에서 겪는 어려움을 살핍니다','학생의 잘못을 탓하지 않고 안전을 챙기며 신고·피해 보호 절차를 따릅니다'];
var items=reasons.map(function(reason,i){var n=i+1;return {number:n,type:safety.includes(n)?'safety':priority.includes(n)?'priority':'function',reason:reason}});
function evaluate(values,groups,explicit,followups){
 if(!Array.isArray(groups)||groups.length!==10||groups.some(v=>!Number.isInteger(v)||v<1)||groups.reduce((x,y)=>x+y,0)!==25)throw Error('10개 영역의 문항 수 합계는 25개 필요');
 if(!Array.isArray(values)||values.length!==25||Array.from(values).some(function(v){return v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)}))throw Error('25개 문항 각각 0~4점 필요');
 var unknownItems=values.map((v,i)=>v==='unknown'?i+1:null).filter(Boolean),known=values.filter(v=>typeof v==='number');
 var safetyUnknown=safety.filter(n=>values[n-1]==='unknown');
 followups=followups||{};
 if(typeof followups!=='object'||Array.isArray(followups)||Object.keys(followups).some(k=>!['4','5','12','13'].includes(k)||!['yes','no','unknown'].includes(followups[k])))throw Error('안전 추가확인 형식 오류');
 var checkItems=[4,5,12,13].filter(n=>values[n-1]>=(n===4?1:3));
 var pendingChecks=checkItems.filter(n=>!followups[n]||followups[n]==='unknown');
 var additionalUrgent=checkItems.some(n=>followups[n]==='yes');
 var offset=0,substantial=[],severe=[],critical=[];
 groups.forEach(function(size,di){var part=values.slice(offset,offset+size);if(part.some(v=>v>=3)||part.filter(v=>v>=2).length>=2)substantial.push(di);part.forEach(function(v,k){var num=offset+k+1;if(v>=3)severe.push(num);if(v>=3&&items[num-1].type==='priority')critical.push(num)});offset+=size});
 var safetyItems=safety.filter(n=>values[n-1]>0),urgent=!!explicit||safetyItems.length>0||additionalUrgent;
 var level=substantial.length>=3&&severe.length>=3?3:substantial.length>=2?2:values.some(v=>v>=2)?1:0;
 var names=['관찰·예방 및 경과 확인','해당 영역 개별지원 검토','복합욕구 공동사정 · 학맞통 협의 검토','다기관 집중지원 필요성 검토'];
 var descriptions=['이번 응답에서는 가볍거나 일시적인 어려움이 주로 나타났습니다. 학생이 느끼는 불편과 원하는 도움을 듣고, 관계를 이어가며 변화를 살펴주세요.','반복해서 힘들어하거나 생활에 지장이 있는 부분을 담당자가 학생과 함께 살펴볼 때입니다. 한 가지 어려움이라도 심하다면 총점이 낮더라도 필요한 전문지원을 찾아주세요.','여러 생활 영역의 어려움이 함께 나타났습니다. 담임·상담·복지 담당자가 학생의 이야기를 함께 듣고, 이미 받고 있는 도움과 더 필요한 지원을 살펴 학생맞춤통합지원(학맞통) 협의를 검토해 주세요.','여러 생활 영역에서 뚜렷한 어려움이 함께 나타났습니다. 학교와 관련 기관이 학생·가정의 상황을 함께 살펴보고, 어떤 도움부터 누가 맡을지 구체적으로 의논해 주세요.'];
 var incomplete=unknownItems.length>0,provisional=incomplete||pendingChecks.length>0;
 var description=incomplete?'아직 살펴보지 못한 내용이 있어 전체 지원 수준의 판단을 보류합니다. 미상은 어려움이 없다는 뜻이 아닙니다. 확인된 어려움은 먼저 돕고, 남은 내용을 학생과 관련 담당자가 안전한 방법으로 살펴주세요.':pendingChecks.length?'현재의 안전을 더 살펴볼 내용이 남아 있습니다. 추가 확인을 마치기 전에는 안전하다고 결론 내리지 않으며, 확인된 어려움에 필요한 지원은 먼저 진행합니다.':descriptions[level];
 var title=urgent?'즉시 안전확인 및 사안별 보호절차 검토':safetyUnknown.length||pendingChecks.length?'안전확인 미완료 · 전체 판단 보류':incomplete?'정보확인 중 · 전체 판단 보류':names[level];
 return {level:incomplete?null:level,observedLevel:level,urgent:urgent,safetyItems:safetyItems,critical:critical,severe:severe,substantial:substantial,integrated:level>=2,title:title,description:description,
 incomplete:incomplete,provisional:provisional,unknownItems:unknownItems,safetyUnknown:safetyUnknown,pendingChecks:pendingChecks,checkItems:checkItems,knownCount:known.length,knownTotal:known.reduce((a,b)=>a+b,0),knownMaximum:known.length*4,
 confirmedSupport:level>0?names[level]:'확인된 응답만으로 지원이 불필요하다고 판단하지 않습니다',
 reason:(incomplete?'점수 확인 '+known.length+'/25문항 · 미상 '+unknownItems.length+'문항 / ':'')+'안전을 먼저 살펴볼 문항 '+safetyItems.length+'개 / 생활의 어려움이 큰 문항(3~4점) '+severe.length+'개 / 도움을 함께 살펴볼 영역 '+substantial.length+'개 / 보호·건강·기본생활을 먼저 살펴볼 문항 '+critical.length+'개'+(pendingChecks.length?' / 현재 안전 추가확인 '+pendingChecks.length+'개 남음':'')};
}
var api={items:items,evaluate:evaluate};if(typeof module!=='undefined')module.exports=api;else root.YouthCriteria=api;
})(typeof window!=='undefined'?window:globalThis);
