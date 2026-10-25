/* Item-specific action routing: CORE values unchanged, recommendations are non-binding proposals. */
(function(root,factory){const a=factory();if(typeof module!=='undefined'&&module.exports)module.exports=a;else root.OYActionRouterV86=a;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const D=[
 ['보호자 위해·학대 의심','지금 안전한 위치·접촉·보호 필요를 학생에게 직접 확인','교내 보호책임자와 신고의무·안전한 귀가 경로를 검토','학생에게 안전한 접촉경로와 보호전문기관 후속 담당을 확인','안전확인 시점·담당·실제 후속조치','safety'],
 ['방임 의심·필요 보호 미제공','식사·치료·위생·돌봄의 실제 미제공과 현재 안전을 분리 확인','담임·학교보호 담당과 실제 공백·위해 의심에 따른 보호절차 검토','돌봄·보호 공백을 사정하고 필요한 보호절차·생활지원 분리 조정','미제공된 보호의 내용·지속기간·확인담당','safety'],
 ['또래 괴롭힘 피해','가해로 보고된 행동·시점·접촉 여부와 피해 학생의 안전한 수업 환경을 확인','학교 사안 담당과 교실·등하교 보호 및 학생 의사 확인','학교 밖 상담·피해 지원과 중복 없는 보호 경로 확인','추가 접촉·피해 여부와 안전한 수업 참여','peer'],
 ['강요·협박·착취 피해','금품·성적 요구·협박의 구체적 유형과 현재 접촉을 확인','사안담당과 학생 보호, 강요·보복 방지 및 증거 보전 절차 안내','피해 보호기관 의뢰 필요와 안전한 연락·생활지원 확인','강요·접촉 중단 여부 및 실제 보호조치','peer'],
 ['타인 위해행동','학생의 실제 행동과 상대 학생에게 발생한 위해를 구분해 듣기','피해 학생의 보호와 행동 학생의 교육·행동지원을 각각 담당 지정','가정·지역의 행동 전후 조건과 협력 가능한 지원 확인','피해 보호상태·행동 전후 사건 기록','peer'],
 ['정서적 고통·기능 저하','최근 정서적 부담과 수업·식사·수면에 미친 영향을 구체화','학생이 신뢰하는 교내 담당과 상담·생활 조정 여부 협의','일상 기능 및 상담·전문기관 이용 접근을 학생 희망에 맞춰 검토','학생 체감 부담과 실제 일상 기능 변화','mental'],
 ['자해·죽음 관련 진술','학생의 현재 상태와 생각·최근 행동·안전한 지원자·긴급 필요를 직접 확인','학교 위기대응·상담 담당과 응급·보호 절차 즉시 검토','보호·상담·진료 지원 연결 및 안전한 연락·이행 담당 확인','현재 안전 확인·후속 평가·담당 인계 여부','safety'],
 ['현저한 수면·불안·혼란 변화','평소 대비 변화 발생 시점과 급성 건강 위험·기능 저하를 확인','수업 시간 조정과 급성 증상 시 적절한 의료 대응 연결','일상 돌봄·상담·전문 평가 접근 장벽 확인','수면·생활변화의 기준선과 의료 평가 여부','health'],
 ['지각·결석·등교 회피','최근 지각·결석·조퇴 기록과 실제 등교 방해요인을 확인','출결기록을 비교하고 학교 내 출결·등교 지원 한 가지 실행','이동·돌봄·건강 등 교외 출결 장벽을 사정해 학교와 조정','주간 결석·지각 기록과 학생 체감 부담','attendance'],
 ['교과 학습·과제 수행 어려움','어느 교과·과제에서 무엇을 이해하기 어려운지 확인','설명 방식·과제량·피드백 중 하나를 학생과 정해 시범 적용','학습공간·가정 지원·지역 학습자원 접근을 학교와 조정','선택 교과 과제 시작·수행과 학생 이해 체감','learning'],
 ['학교 소속감·학업 지속 부담','학교와의 소속감·지속 희망 및 회피 원인을 학생 관점에서 확인','관계·교실 소속감과 안전한 참여 선택지를 학생과 협의','학생이 원하는 참여·진로 경로와 지역 지지 지원 연결','학교 참여 희망과 편안한 소속감 변화','schoolbelong'],
 ['위험 충동·파손 행동','위험 행동 전후의 요구·상황과 다칠 가능성을 구체적으로 확인','실제 자타 안전조치와 비처벌적 행동지원 계획 구분','가정·지역 자극·휴식·전문가 지원 가능성과 접근 확인','위해 발생·행동 유발 장면·조정 실행 여부','behavior'],
 ['물질 사용·건강 위해','흡연·음주·약물·급성중독을 구분하고 현재 의식·신체상태 확인','급성 이상 시 응급 대응, 기타 상황은 상담·건강 담당 연계','의료·상담 이용과 보호환경을 학생 의사·안전 고려해 확인','현재 건강 위험·지원 이용·기능 변화','health'],
 ['감각·주의·의사소통 학습환경','진단 여부와 별개로 학생이 어려워하는 교실 환경·정보 접근을 확인','좌석·설명·시각자료·소음 조정 한 가지 시험','교실 밖 접근 장벽과 조정 자원·학생 희망 확인','교육환경 조정의 실제 제공·참여 변화','access'],
 ['보조기기·지원서비스 접근','필요한 기기·발달지원·서비스 및 이용하지 못한 사유 확인','학교 내 조정·보조기기 가능성과 담당부서 확인','필요 서비스의 접수·대기·제공 여부와 이동·비용 장벽 사정','보조기기·서비스 실제 이용 및 활동 접근','access'],
 ['돌봄·식사·생활관리 공백','실제 돌봄·식사가 비는 요일·시간과 담당자·대체 경로 확인','교내 급식·방과후·안전한 성인 연결의 제공 가능성 점검','가구의 생활일과·돌봄 제공과 지역 식사·돌봄 서비스 조정','식사·돌봄 공백 빈도와 실제 제공 여부','care'],
 ['가족 갈등·양육 스트레스 영향','갈등의 장면·학생 영향과 폭력 의심 여부를 구분해 확인','학생의 편안한 대화·상담 공간을 마련하고 안전한 보호자 협의 여부 확인','가족상담·양육 부담 및 학생 의견을 바탕으로 지원 방법 협의','학생의 정서·학교생활 부담과 조정 경험','family'],
 ['과중한 가족돌봄·가사 책임','누구를 돌보고 하루 몇 시간 사용하며 학습·휴식에 어떤 영향이 있는지 확인','학습·출결 조정과 학생 휴식시간 확보 방법 협의','대체 돌봄 가능 성인·아이돌봄·지역지원 서비스 연계 검토','학생 돌봄시간·휴식·과제 수행 변화','youngcarer'],
 ['식품·의복·학습준비물 부족','실제로 부족한 물품과 결핍 발생 빈도·기존 제공 확인','급식·학습준비물 제공 및 낙인 최소화 지원 경로 검토','필수자원의 실제 제공·중복 지원·이용 장벽 확인','필요 품목 제공일·미충족 수·학생 생활 변화','basic'],
 ['주거 불안정·환경 안전','주거문제 유형(거처 이동·환경·안전)을 확인하고 체납·퇴거는 실제 보고 때만 검토','수업·휴식·등교에 미친 영향을 확인하고 학교 내 임시 조정 논의','주거환경·행정복지센터 상담·지원 자격과 실제 제공상태 확인','주거의 실제 위험유형·거처 안전·연계 진행상태','housing'],
 ['비용으로 인한 지원 이용 제한','어떤 치료·교육·생활 서비스를 비용 때문에 받지 못했는지 확인','학습·건강 관련 서비스의 실제 이용 필요와 학교지원 검토','비용 장벽·신청 요건·실제 지원 범위의 확인 및 연계','지연된 서비스의 이용·제공 여부와 비용 부담','cost'],
 ['원하는 관계·활동 참여 장벽','학생이 원하는 관계·활동과 참여에 방해되는 구체적 조건 확인','학생 선택에 따른 부담 적은 또래활동·안전 공간 협의','지역 활동 접근·참여 지지 관계를 학생 의사에 따라 연결','학생이 원하는 활동의 실제 참여·체감 변화','relation'],
 ['신뢰할 어른·지원체계 부족','학생이 실제 도움 청할 수 있는 사람과 연락 방법 확인','신뢰할 수 있는 교사 한 명·연락 가능한 교내 경로 지정','지역의 지속적 지원자·기관 접촉과 회신체계 조정','연락 대상·방법 이해 및 실제 도움 접근','support'],
 ['디지털 이용조절·생활기능 저하','화면 이용과 수면·학습·관계 영향의 실제 정도 확인','학생 동의 하에 이용 상황·수업·수면 조정 목표 한 가지 합의','가정의 디지털 환경·보호자 지원과 회복 가능한 일과 협의','수면·활동의 학생 체감과 기능 변화','digitalhabit'],
 ['온라인 성적 강요·디지털 착취','온라인 성적 요구·유포 위협의 현재 접촉과 학생의 안전 직접 확인','피해학생 보호와 신고·증거 취급·학교 보복방지 경로를 담당자와 검토','전문 피해보호기관 연계·안전한 연락·사후 생활지원 확인','현재 피해·접촉·보호조치 및 안전한 인계','safety']
].map(([concept,action,teacher,worker,measure,domain],i)=>Object.freeze({item:i+1,concept,action,teacher,worker,measure,domain}));
const SAFETY=new Set([1,2,7,25]);const score=v=>Number.isInteger(v)&&v>=0&&v<=4;const priority=q=>SAFETY.has(q.item)?q.value>0?0:9:q.value===4?2:q.value===3?3:q.value===2?4:q.value===1?5:9;
function route(answers,options={}){
 if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&!score(v)))throw Error('CORE 25개 응답 0~4 또는 unknown 필요');
 const evidence=options.evidence||[],hasEvidence=(n)=>evidence.some(e=>e.polarity==='affirmed'&&((e.linked_items||[]).includes(n)||options.extraMap?.[e.kind]?.includes(n)));
 let candidates=D.filter(x=>score(answers[x.item-1])&&answers[x.item-1]>0).map(x=>({...x,value:answers[x.item-1],evidenceIds:evidence.filter(e=>(e.linked_items||[]).includes(x.item)&&e.polarity==='affirmed').map(e=>e.id),evidencePresent:hasEvidence(x.item),priority:priority({...x,value:answers[x.item-1]})}));
 candidates.sort((a,b)=>a.priority-b.priority||b.value-a.value||a.item-b.item);
 const goals=candidates.map(x=>({id:'Q'+String(x.item).padStart(2,'0'),item:x.item,domain:x.domain,concept:x.concept,priority:x.priority,score:x.value,scope:x.evidencePresent?'reported-context-review':'score-only-verification',goal:x.evidencePresent?'보고된 어려움의 현재 영향과 학생이 바라는 조정 구체화':'척도 응답의 직접 근거 확인 후 필요 지원 여부 협의',action:x.action,teacher:x.teacher,worker:x.worker,verification:x.measure,evidenceIds:x.evidenceIds,owner:'실무자 협의 전',target:'기준선 확인 후 학생과 합의',completed:false,reviewPending:true}));
 // Single-gateway safety query from credible narrative even where CORE contains all zeros.
 const narrativeSafety=evidence.filter(e=>e.polarity==='affirmed'&&['family_harm','self_harm','peer_harm','online_coercion'].includes(e.kind));
 // Narrative/CORE disagreement must generate the corresponding *item-specific* safe review,
 // even when some other safety item already has a positive score.
 const inferred={family_harm:1,self_harm:7,peer_harm:3,online_coercion:25};
 const groups=new Map();for(const ev of narrativeSafety){const n=inferred[ev.kind];if(!groups.has(n))groups.set(n,[]);groups.get(n).push(ev.id);}
 for(const [n,ids]of groups){if(goals.some(g=>g.item===n))continue;
  const a=D[n-1],urgent=SAFETY.has(n);
  goals.push({id:'NARRATIVE-Q'+String(n).padStart(2,'0'),item:n,domain:a.domain,concept:a.concept+' · 서술·척도 차이 확인',priority:urgent?0:1,score:null,scope:'narrative-requires-review-not-scored',goal:'원문에 보고된 사건과 '+n+'번 문항의 0점·미상 응답을 대조하고 현재 안전을 직접 확인',action:a.action,teacher:a.teacher,worker:a.worker,verification:a.measure,evidenceIds:ids,owner:'실무자 협의 전',target:'실제 면담 후 합의',reviewPending:true,completed:false});
 }
 goals.sort((a,b)=>a.priority-b.priority||(b.score||0)-(a.score||0)||String(a.id).localeCompare(String(b.id)));
 const cap=options.visibleLimit||6;const shown=goals.slice(0,cap),deferred=goals.slice(cap);const high=goals.filter(g=>g.score>=3||g.priority===0);
 return {version:'8.6.0',goals,shown,deferred,highGoalIds:high.map(g=>g.id),uncoveredHigh:high.filter(g=>!goals.some(x=>x.id===g.id)).length,safetyNarrativeIds:narrativeSafety.map(x=>x.id),scoreOnly:!options.hasNarrative,allZero:answers.every(v=>v===0),unknownSafety:[1,2,7,25].filter(n=>answers[n-1]==='unknown'),needsAdditionalMeeting:goals.length>6};
}
return Object.freeze({VERSION:'8.6.0',D,SAFETY,route});});