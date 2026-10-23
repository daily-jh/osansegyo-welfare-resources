(function(root){'use strict';
/* Case continuity audit: decisions/actions vs documentation. Never recalculate youth risk scores. */
const VER='2026.10.case-continuity-v1';
const MEETING=['unrecorded','approved','modified','deferred','rejected'];
const PLANS=['unrecorded','draft','confirmed','adjusted'];
const EXEC=['unknown','scheduled','inquiry','referred','received','started','completed','paused'];
const REVIEW=['unrecorded','maintain','adjust','replan','close'];
const EVIDENCE=['unverified','self-report','document-verified'];
const TYPES=['unrecorded','general','intensive','joint','other'];
const LABELS={
 unrecorded:'미기재·회의결정 미확인',approved:'원안 채택',modified:'수정 채택',
 deferred:'보류',rejected:'미채택',draft:'계획 초안',confirmed:'계획 확정',
 adjusted:'계획 수정',unknown:'미확인',scheduled:'예정',inquiry:'문의 단계',
 referred:'의뢰 단계',received:'접수 확인',started:'제공 시작 확인',
 completed:'제공·수행 완료 보고',paused:'중단·보류',
 maintain:'원안 유지',adjust:'일부 조정',replan:'재수립',close:'종결 검토',
 'self-report':'진술에 의한 확인','document-verified':'문서 등 증빙 확인',unverified:'증빙 미확인',
 general:'일반 사례관리',intensive:'집중 사례관리',joint:'공동사례관리',other:'그 외'};
const limit=(s)=>typeof s==='string'&&s.length<=120;
const valid=(record)=>{
 if(!record||!Array.isArray(record.goals)||record.goals.length>20)throw Error('검토 목표는 최대 20개입니다.');
 if(!TYPES.includes(record.initialType??'unrecorded')||!TYPES.includes(record.reviewType??'unrecorded'))throw Error('사례 유형을 확인해 주세요.');
 if(!['unrecorded','approved','modified','replan'].includes(record.reviewDecision??'unrecorded'))throw Error('점검회의 결정상태를 확인해 주세요.');
 const ids=new Set();
 for(const g of record.goals){
   if(!g||!limit(g.id)||!g.id||ids.has(g.id))throw Error('고유한 계획 ID가 필요합니다.');
   ids.add(g.id);
   if(!limit(g.title)||!MEETING.includes(g.meeting)||!PLANS.includes(g.plan)||!EXEC.includes(g.execution)||!REVIEW.includes(g.review)||!EVIDENCE.includes(g.evidence))throw Error('계획 단계 입력값이 올바르지 않습니다.');
   if(g.priority!==null&&g.priority!==undefined&&(!Number.isInteger(g.priority)||g.priority<1||g.priority>20))throw Error('우선순위는 1~20 사이입니다.');
   if(typeof g.preExisting!=='boolean')throw Error('기존 서비스 사용 여부를 확인해 주세요.');
   if(!limit(g.changedReason??''))throw Error('변경 사유가 너무 깁니다.');
 }
 return true;
};
function analyze(record){
 valid(record);const goals=[],alerts=[],priorityMap=new Map();
 const tally={assessment:record.goals.length,meetingResolved:0,meetingApproved:0,planEstablished:0,executionConfirmed:0,executionCompletedVerified:0,reviewDecisions:0};
 for(const g of record.goals){
   const issues=[];
   const meetingResolved=g.meeting!=='unrecorded';
   const meetingKept=['approved','modified'].includes(g.meeting);
   const hasPlan=['confirmed','adjusted'].includes(g.plan);
   const hasActivity=['received','started','completed'].includes(g.execution);
   const isComplete=g.execution==='completed'&&g.evidence==='document-verified';
   const reviewed=g.review!=='unrecorded';
   if(meetingResolved)tally.meetingResolved++;
   if(meetingKept)tally.meetingApproved++;
   if(hasPlan)tally.planEstablished++;
   if(hasActivity)tally.executionConfirmed++;
   if(isComplete)tally.executionCompletedVerified++;
   if(reviewed)tally.reviewDecisions++;
   if(g.meeting==='unrecorded'&&g.plan==='confirmed')issues.push('회의결정 미기재: 확정 계획의 승인 근거 확인');
   if(meetingKept&&!hasPlan)issues.push('회의 채택 내용에 대응하는 확정 서비스계획 확인');
   if(g.meeting==='rejected'&&hasPlan)issues.push('미채택 과제가 서비스계획에 포함된 사유 확인');
   if(g.execution==='completed'&&g.evidence!=='document-verified')issues.push('완료 표기는 증빙 미확인: 실제 이행 완료로 인정 보류');
   if(g.review==='maintain'&&g.execution==='unknown')issues.push('계획 유지 결정과 실제 이용 상태는 별도 확인');
   if(g.preExisting&&['inquiry','referred','received','started'].includes(g.execution))issues.push('기존 서비스와 신규 연계의 중복·역할 분담 확인');
   if(g.review==='close'&&!isComplete)issues.push('종결 검토는 목표 달성·안전·당사자 의견 재사정 필요');
   if(g.meeting==='modified'&&!(g.changedReason||'').trim())issues.push('회의에서 수정한 내용과 사유의 기록 필요');
   if(g.priority!=null){const other=priorityMap.get(g.priority);if(other)issues.push('같은 우선순위 '+g.priority+' 중복: '+other+'와 구분·공동순위 여부 확인');else priorityMap.set(g.priority,g.id);}
   goals.push({id:g.id,title:g.title,meetingStatus:LABELS[g.meeting],planStatus:LABELS[g.plan],implementationStatus:LABELS[g.execution],reviewStatus:LABELS[g.review],evidenceStatus:LABELS[g.evidence]||g.evidence,
      alignment:meetingKept&&hasPlan?'회의–계획 연결 확인':g.meeting==='unrecorded'?'회의결정 확인 전':'추가 비교 필요',
      outcomes:isComplete?'문서상 이행 근거 확인 · 생활 변화는 별도 평가':'성과 판정 보류',
      issues});
   for(const issue of issues)alerts.push({goal:g.id,issue});
 }
 if(record.initialType!=='unrecorded'&&record.reviewType!=='unrecorded'&&record.initialType!==record.reviewType)
   alerts.push({goal:'CASE',issue:'1차와 후속 문서의 사례유형 불일치: 실제 변경 결정과 사유 확인'});
 if(record.reviewDecision==='unrecorded')
   alerts.push({goal:'MEETING',issue:'점검회의 최종 확정 결과 미기재: 논의안·회의결정 혼동 금지'});
 if(record.reviewDecision==='approved'&&record.goals.some(g=>g.review==='adjust'||g.review==='replan'))
   alerts.push({goal:'MEETING',issue:'회의 원안 유지 결정과 목표별 조정 표시가 다름: 조정 사항 확인'});
 const resolved=tally.meetingResolved;
 const agreement=resolved>0?{count:tally.meetingApproved,denominator:resolved,
   text:tally.meetingApproved+'/'+resolved+'건 채택·수정채택 (기재된 회의결정만 분모)'}:
   {count:null,denominator:0,text:'회의결정 미기재로 일치율 산출 보류'};
 return {version:VER,agreement,tally,goals,alerts,
   notes:['동일 목표의 문서상 채택 비율은 임상적 판정정확도나 실제 성과가 아닙니다.',
   '예정·문의·의뢰·접수·제공 시작·완료는 서로 다른 이행상태입니다.',
   '다른 척도에서 산출한 점수는 본 청소년 25문항/100점 척도로 환산할 수 없습니다.',
   '현재 안전과 신고·보호 대응은 계획일치율·회의결정에 선행합니다.']};
}
const api={version:VER,analyze,valid,MEETING,PLANS,EXEC,REVIEW,EVIDENCE,TYPES,LABELS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.YouthContinuity=api;
})(typeof window!=='undefined'?window:globalThis);
