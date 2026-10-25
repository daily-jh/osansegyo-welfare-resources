/* V8.7 external-AI disclosure review. Not a proof of anonymisation. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYPrivacyGuardV87=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const rules=[['email',/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],['telephone',/0(?:1[016789]|2|[3-6]\d)[-.\s]?\d{3,4}[-.\s]?\d{4}/g],['government-id',/\b\d{6}\s*[- ]?\s*[1-8]\d{6}\b/g],['school',/[가-힣]{2,12}(?:초등학교|중학교|고등학교|특수학교)/g],['street-address',/[가-힣\w-]{2,28}(?:로|길)\s*\d+(?:-\d+)?/g]];
function inspect(source){let text=String(source||'').slice(0,30000),types=[];
 for(const [label,rx]of rules){rx.lastIndex=0;let m=text.match(rx);if(m?.length){types.push({type:label,count:m.length});text=text.replace(rx,'[직접식별정보 제외]');}}
 text=text.replace(/((?:이름|성명|학생명|실명)\s*[:：]\s*)[가-힣]{2,4}/g,'$1[이름 제외]');
 return {version:'8.7',redacted:text,identifierTypes:types,requiresManualReview:true,warnings:['인명·기관·가족관계·장소·특이 사건의 조합은 재식별 가능성이 있습니다.','자동 가림은 비식별 처리를 보장하지 않습니다. 외부 전달 전에 실무자가 직접 검토해야 합니다.']};
}
return Object.freeze({VERSION:'8.7.0',inspect});
});