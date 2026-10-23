(function(root){'use strict';
/**
 * OY-RALS v3: explainable, additive case interpretation. Does not change scoring,
 * urgency rules, inferred diagnoses, statutory decisions or service eligibility.
 * Works locally with validated 25-item assessment; no network/file writes.
 */
const node=typeof module!=='undefined'&&!!module.exports;
const C=node?require('./criteria.js'):root.YouthCriteria;
const E=node?require('./evidence-matrix.js'):root.YouthEvidenceMatrix;
const VERSION='3.0.0-explainable-20261024';
const GROUPS=[2,3,3,3,2,2,3,3,2,2];
const LABELS=['보호·안전','학교폭력·또래 안전','정서·정신건강','학습·출결','행동·건강','교육 접근성','가족·돌봄','경제·주거','관계·지지','디지털·온라인 안전'];
const SAFETY=[1,2,7,25],FOLLOWUP=['4','5','12','13'];
const THEMES=[
 {id:'protection',label:'보호·현재 안전',terms:/학대|방임|자해|자살|자살생각|죽고.?싶|성착취|성적.?요구|성폭력|협박|위협|피해/},
 {id:'school',label:'학교 참여',terms:/결석|지각|등교|수업|과제|학습|학업|학맞통/},
 {id:'care',label:'가족 돌봄',terms:/돌봄|간병|가족|동생|보호자|양육/},
 {id:'housing',label:'생활·주거',terms:/주거|퇴거|월세|체납|결식|식사|식비|지원금/},
 {id:'mental',label:'정서·건강',terms:/불안|우울|무기력|불면|공황|자해|자살|의료/},
 {id:'relation',label:'관계·학교 소속',terms:/따돌림|왕따|괴롭힘|친구|외롭|고립|소속감|또래/},
 {id:'digital',label:'디지털 안전',terms:/온라인|SNS|성착취|유포|디지털|사진|영상|게임|채팅/}
];
const NEG=/(?:없다고|없었|없다|없음|없어|없어요|않았|않는다|않음|아니다|아님|아니라고|부인|해당하지|하지.?않|그런.?일.?없)/;
const UNKNOWN=/(미확인|불분명|알.?수.?없|확인.?필요|여부.?확인|들은.?바.?없|모른다고)/;
const HYPOTHETICAL=/(가정|예시|만약|예를.?들어|예방|지침|매뉴얼|상담.?방법|척도.?문항|점수.?해석)/;
function cues(note){
 const chunks=String(note||'').slice(0,6000).split(/(?<=[.!?])\s+|\n+/).flatMap(s=>s.split(/(?:하지만|그러나|그런데|반면|다만|했으나|였으나)/)).map(s=>s.trim()).filter(Boolean).slice(0,80);
 const out=[];
 chunks.forEach((s,i)=>{for(const t of THEMES){if(!t.terms.test(s))continue;
  const state=HYPOTHETICAL.test(s)?'context_only':UNKNOWN.test(s)?'unconfirmed':NEG.test(s)?'denied_or_absent':'mentioned_unverified';
  out.push({topic:t.id,label:t.label,segment:i+1,status:state});}});
 return out;
}
function extract(p,role='teacher',note=''){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25||p.answers.some(x=>x!=='unknown'&&(!Number.isInteger(x)||x<0||x>4)))throw Error('25문항 0~4점 또는 미상만 분석할 수 있습니다.');
 if(!['teacher','social-worker'].includes(role))throw Error('교사·사회복지사 관점만 허용합니다.');
 const a=p.answers,score=C.evaluate(a,GROUPS,!!(p.explicit||[]).length,p.followups||{});
 let idx=0,domains=GROUPS.map((size,i)=>{const slice=a.slice(idx,idx+size),ids=slice.map((_,j)=>idx+j+1);idx+=size;const numeric=slice.filter(x=>typeof x==='number'),flags=ids.filter(n=>typeof a[n-1]==='number'&&a[n-1]>0);
 return {id:i+1,label:p.domains?.[i]?.name||LABELS[i],itemIds:ids,positive:flags,known:numeric.length,unknown:size-numeric.length,max:Math.max(0,...numeric),knownSum:numeric.reduce((x,y)=>x+y,0)};});
 const safetyPos=SAFETY.filter(n=>typeof a[n-1]==='number'&&a[n-1]>0);
 const followupPending=FOLLOWUP.filter(n=>p.followups?.[n]==='unknown'||score.pendingChecks.includes(Number(n)));
 const followupYes=FOLLOWUP.filter(n=>p.followups?.[n]==='yes');
 const cross=E?.evaluate?E.evaluate(p,role).shown.slice(0,3):[];
 const noteCues=cues(note);
 const mismatch=noteCues.filter(x=>x.status==='mentioned_unverified');
 const hasUnknown=score.unknownItems.length>0;
 const priority=domains.filter(x=>x.positive.length).sort((x,y)=>Number(y.positive.some(n=>SAFETY.includes(n)))-Number(x.positive.some(n=>SAFETY.includes(n)))||y.max-x.max||y.positive.length-x.positive.length||x.id-y.id).slice(0,4);
 return {version:VERSION,score,domains,priority,safetyPos,followupPending,followupYes,hasUnknown,noteCues,mismatch,cross,role};
}
function build(p,role='teacher',note='',question=''){
 const m=extract(p,role,note);const a=p.answers;
 const lines=['[3차 사례해석·개입 검토 | '+VERSION+']'];
 const state=m.score;
 lines.push('평가자료: '+(m.hasUnknown?'전체 원점수·지원단계 판단 보류. 확인 '+state.knownCount+'/25문항, 미상 '+state.unknownItems.join('·')+'번.':state.knownTotal+'/100점(원점수).')+' 가중 해석은 설명·정렬 보조값이며 원점수를 대체하지 않습니다.');
 if(m.safetyPos.length||state.urgent||m.followupYes.length){
  lines.push('현재 안전: 별도 확인 우선. 관련 문항 '+m.safetyPos.join('·')+'번; 현재 위험 추가확인 '+(m.followupYes.length?m.followupYes.join('·')+'번 yes':'기록된 yes 없음')+'. 각 신호의 현재성·필요 보호·전문평가를 담당자가 직접 확인하며 응급 위해 시 112/119 등 해당 대응 절차를 즉시 적용합니다.');
 }else if(state.safetyUnknown.length||m.followupPending.length){
  lines.push('현재 안전: 미확인(핵심문항 '+state.safetyUnknown.join('·')+' / 추가확인 '+m.followupPending.join('·')+'). 안전하다는 결론을 내리지 않고 확인 담당·방법·시점을 정합니다.');
 }else lines.push('현재 안전: 입력에서 자동 안전 신호는 확인되지 않았습니다. 실제 안전이 입증되었다는 의미가 아니므로 학생의 현 상태를 직접 확인합니다.');
 lines.push('사정 원칙: 보고 사실 → 확인 필요 가설 → 학생이 원하는 변화 → 보호요인·기존 지원 → 활동별 담당/기한 → 실제 제공과 생활변화 점검을 분리합니다.');
 for(const d of m.priority){
  const matches=d.positive.map(n=>n+'번 '+a[n-1]+'점');
  lines.push('• '+d.label+': 관찰 응답 '+matches.join(', ')+'. 어느 상황·시점·정보원에서 보고되었는지, 실제 생활영향과 원인을 분리하여 확인합니다.');
 }
 if(m.cross.length){
  lines.push('교차해석은 추가사정 가설이며 인과·확률이 아닙니다.');
  m.cross.forEach(x=>lines.push('• '+x.id+' ('+x.evidence+') '+x.question));
 }
 const mentioned=m.noteCues.filter(x=>x.status==='mentioned_unverified');
 const denied=m.noteCues.filter(x=>x.status==='denied_or_absent');
 const unconfirmed=m.noteCues.filter(x=>x.status==='unconfirmed'||x.status==='context_only');
 if(mentioned.length)lines.push('서술 언급(사실 미확정): '+[...new Set(mentioned.map(x=>x.label))].join('·')+' — 면담·기록·척도에서 동일 사건과 시점을 대조하세요. 서술만으로 척도 점수나 신고 여부를 결정하지 않습니다.');
 if(denied.length)lines.push('서술에서 부정형으로 언급: '+[...new Set(denied.map(x=>x.label))].join('·')+' — 부재를 확정하지 않고 학생이 말한 의미와 관찰기간을 확인합니다.');
 if(unconfirmed.length)lines.push('서술에서 미확인·가정: '+[...new Set(unconfirmed.map(x=>x.label))].join('·')+' — 학생에게 확인된 위험/욕구로 단정하지 않습니다.');
 lines.push(role==='teacher'?
 '역할(교사): 학생 면담·현재 안전·수업/출결과 교내 조정, Wee·학맞통 협의 검토, 학생 의견과 보호자 연락의 안전성 확인. 공식 결정은 학교 절차를 따릅니다.':
 '역할(사회복지사): 당사자 동의·강점/가족·경제·돌봄의 욕구사정, 기존 지원·권역 자원 확인, 사례판정회의 제안, 연계 문의/접수/실제 제공을 구분하여 조정합니다.');
 lines.push('성과와 점검: 상담·의뢰 횟수는 활동량, 실제 지원 시작은 서비스 이행, 학생이 보고한 일상 변화는 성과로 각각 기록합니다. 목표의 기준선·기한·평가 방법은 학생과 합의한 후 설정합니다.');
 lines.push('버전·근거: '+VERSION+'; 임상·법적 판단 모델이 아닌 개발 가설 기반의 해석 보조 계층. OY-RALS 점수/안전게이트 및 원본 기록 불변. 실제 사례 정확도·민감도·특이도 미검증.');
 return {version:VERSION,text:lines.join('\n\n'),facts:{known:state.knownCount,unknown:state.unknownItems.length,safetyItems:m.safetyPos,followupPending:m.followupPending,crossIds:m.cross.map(x=>x.id)},noteStatus:m.noteCues.map(x=>({topic:x.topic,status:x.status}))};
}
const api=Object.freeze({VERSION,cues,extract,build});
if(node)module.exports=api;else root.YouthInterpretationV3=api;
})(typeof window!=='undefined'?window:globalThis);
