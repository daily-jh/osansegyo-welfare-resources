(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,C=node?require('./criteria.js'):root.YouthCriteria;
const VERSION='1.0.0-temporal-review-20261024',STAGES=['T0','T1','T2','T3','T4'],SIZES=[2,3,3,3,2,2,3,3,2,2];
function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||(Number.isNaN(Date.parse(s+'T00:00:00Z'))?'':new Date(s+'T00:00:00Z').toISOString()).slice(0,10)!==s)throw Error('유효한 평가 기준일을 입력해 주세요.');return s;}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x;}
function snapshot(p,meta){
 if(!meta?.sameStudent||!meta?.timeLocked)throw Error('같은 학생 여부와 해당 시점까지의 자료만 사용했는지 확인해 주세요.');
 if(!STAGES.includes(meta.stage))throw Error('T0~T4 중 평가 시점을 선택해 주세요.');
 const cutoff=date(meta.date),answers=Array.from(p?.answers||[]),followups={};
 const evidence=(meta.evidence||[]).map(e=>{if(!Number.isInteger(e.number)||e.number<1||e.number>25||!['unconfirmed','observed','reported','third_party','documented','confirmed_absence','not_recorded','not_assessed'].includes(e.status))throw Error('문항별 근거의 성격을 확인해 주세요.');const recordedAt=e.recordedAt?date(e.recordedAt):null,occurredAt=e.occurredAt?date(e.occurredAt):null;if(recordedAt&&recordedAt>cutoff||occurredAt&&occurredAt>cutoff)throw Error(e.number+'번 근거 날짜가 평가 기준일 이후입니다. 이후 정보는 다음 시점에 기록해 주세요.');if(['not_recorded','not_assessed'].includes(e.status)&&answers[e.number-1]!=='unknown')throw Error(e.number+'번의 기록 없음·평가 미실시 표시와 문항 응답을 대조해 주세요.');if(e.status==='confirmed_absence'&&answers[e.number-1]!==0)throw Error(e.number+'번의 부재 확인 표시와 문항 응답을 대조해 주세요.');return {number:e.number,status:e.status,recordedAt,occurredAt};});
 if(new Set(evidence.map(e=>e.number)).size!==evidence.length)throw Error('중복 문항 근거입니다.');
 for(const n of [4,5,12,13])if(p?.followups?.[n]!==undefined){if(!['yes','no','unknown'].includes(p.followups[n]))throw Error('현재 안전 추가확인 값을 확인해 주세요.');followups[n]=p.followups[n];}
 const explicitSafety=!!p?.explicit?.length,decision=C.evaluate(answers,SIZES,explicitSafety,followups);
 return freeze({schema:'OY-RALS-timepoint-v1',stage:meta.stage,date:cutoff,answers,followups,evidence,explicitSafety,versions:{criteria:'25-item-existing-core',weights:'2.2.0-contextual-20261024',language:'3.0.1-explainable-context-20261024',casework:'3.0.0-casework-20261024',record:VERSION},decision:{level:decision.level,title:decision.title,urgent:decision.urgent,unknown:decision.unknownItems.length,total:decision.incomplete?null:decision.knownTotal,known:decision.knownCount},attestation:'same_subject_and_time_cutoff_confirmed'});
}
function append(history,item){if(!Array.isArray(history)||history.length>=20)throw Error('한 화면에서는 최대 20개 시점을 비교할 수 있습니다.');if(history.some(x=>x.stage===item.stage&&x.date===item.date))throw Error('같은 단계·기준일은 이미 고정했습니다. 기존 기록은 수정하지 않습니다.');const last=history.at(-1);if(last&&(item.date<last.date||STAGES.indexOf(item.stage)<STAGES.indexOf(last.stage)))throw Error('기준일과 T0~T4 순서에 맞춰 추가해 주세요.');return Object.freeze([...history,item]);}
function compare(before,after){
 if(before.date>after.date)throw Error('이전 평가일보다 이른 자료는 변화로 비교할 수 없습니다.');
 const unknownResolved=before.answers.flatMap((v,i)=>v==='unknown'&&typeof after.answers[i]==='number'?[i+1]:[]),newUnknown=after.answers.flatMap((v,i)=>v==='unknown'&&typeof before.answers[i]==='number'?[i+1]:[]);
 const common=before.answers.flatMap((v,i)=>typeof v==='number'&&typeof after.answers[i]==='number'?[{number:i+1,before:v,after:after.answers[i],delta:after.answers[i]-v}]:[]);
 return {unknownResolved,newUnknown,common,changed:common.filter(x=>x.delta!==0),totalDelta:before.decision.total===null||after.decision.total===null?null:after.decision.total-before.decision.total,meaning:'미상 해소·관찰기간·평가자·학생 생활변화를 따로 확인합니다. 점수 차이는 지원 효과나 인과관계의 증거가 아닙니다.'};
}
const api={VERSION,STAGES,snapshot,append,compare};if(node)module.exports=api;else root.YouthTimepoint=api;
})(typeof window!=='undefined'?window:globalThis);
