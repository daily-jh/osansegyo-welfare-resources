(function(root){'use strict';
/**
 * OY-RALS case management planning v3.0 — draft actions, never determination.
 * Keep case-management operational criteria v2.2 unchanged.
 */
const moduleMode=typeof module!=='undefined'&&!!module.exports;
const VERSION='3.0.0-casework-20261024';
const GROUPS=[2,3,3,3,2,2,3,3,2,2],AREAS=[
 ['현재 보호·안전','안전을 확인하고 안전한 보호 담당자를 지정할 수 있는지 검토','학생이 체감하는 안전과 조치·인계 확인'],
 ['또래 안전','피해·행동 사실과 학교 안전조정을 학생과 구분해 논의','추가 피해 여부·학교 대응 진행'],
 ['정서·정신건강','학생이 말하는 불편을 확인하고 상담·전문평가 접근을 검토','학생의 불편 체감과 서비스 접근'],
 ['학습·출결','결석 원인을 추정하지 않고 수업·출결 장벽을 조정','학생 합의 참여지표·수업환경 변화'],
 ['행동·건강','즉시 위해를 분리한 뒤 건강·행동 지원방안 협의','현재 안전·건강 지원 이용'],
 ['교육 접근성','개인의 특성에 맞는 교육환경 조정과 필요한 편의를 검토','합의된 편의 제공·참여 변화'],
 ['가족·돌봄','학생의 일과·돌봄 부담과 성인 책임·대체자원 확인','돌봄 부담·학생의 휴식·교육시간'],
 ['경제·주거','실제 기본생활·거주 안정과 지원 가능기관 확인','필수생활·거주 안전·지원 개시'],
 ['관계·지지','원하는 관계와 안전한 도움 요청경로 확인','학생이 신뢰하는 담당자의 실제 응답'],
 ['디지털 안전','피해보호와 일상 이용 문제를 나눠 확인','피해의 추가 발생 및 일상기능']
];
function plan(p,role='teacher'){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25||p.answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25개 문항 응답을 확인해 주세요.');
 if(!['teacher','social-worker'].includes(role))throw Error('지원자 역할은 교사 또는 사회복지사입니다.');
 let off=0;const all=GROUPS.map((size,i)=>{const ids=Array.from({length:size},(_,j)=>off+j+1);off+=size;const pos=ids.filter(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0);
 const unknown=ids.filter(n=>p.answers[n-1]==='unknown');
 return {domain:i+1,domainName:AREAS[i][0],positiveItems:pos,unknownItems:unknown,peak:Math.max(0,...pos.map(n=>p.answers[n-1])),goalHint:AREAS[i][1],outcomeHint:AREAS[i][2]};});
 const visible=all.filter(x=>x.positiveItems.length).sort((a,b)=>Number(b.positiveItems.some(n=>[1,2,7,25].includes(n)))-Number(a.positiveItems.some(n=>[1,2,7,25].includes(n)))||b.peak-a.peak||a.domain-b.domain).slice(0,3);
 const candidates=visible.map((x,i)=>({
 id:'DRAFT-GOAL-'+String(x.domain).padStart(2,'0'),
 domain:x.domainName,derivedItems:x.positiveItems.map(n=>({number:n,value:p.answers[n-1]})),
 evidenceStatus:'assessment_response_only',confirmedOutcome:false,
 target:'학생의 희망과 기존 강점·지원 현황을 면담 후 협의. '+x.goalHint,
 assignedTo:role==='teacher'?'학교 담당자와 지원 협력자를 협의':'사례관리자·학교·자원기관의 역할을 회의에서 협의',
 shortTerm:'관련 사실·시급성·기존 지원을 확인하고 실행 담당을 정한다(안)',
 longTerm:'학생이 원하는 일상 변화와 지지체계 유지 목표를 함께 정한다(안)',
 outcome:x.outcomeHint,baseline:null,targetScale:null,dueDate:null,actionStatus:'not_started_or_unverified',
 checkpoints:['학생의 목표 동의·기준선','문의 여부','의뢰·접수 여부','실제 서비스 제공 시작','생활상 변화와 목표 수정'],
 caveat:'자동으로 승인된 서비스계획이 아님. 안전조치·법정 절차는 개별 확인'
 }));
 return {version:VERSION,stage:'initial_assessment_draft',role,readyForFormalPlan:false,proposals:candidates,pendingDomains:all.filter(x=>x.unknownItems.length).map(x=>x.domainName),reviewRequired:['현재 안전 확인','학생의 동의·강점·의견','중복 사건·기존 서비스 확인','담당자·기관 역량·접수조건','기준선·목표값·기한 직접 합의'],noIdentifiers:true};
}
const api=Object.freeze({VERSION,plan});
if(moduleMode)module.exports=api;else root.YouthCaseworkV3=api;
})(typeof window!=='undefined'?window:globalThis);
