/* V8.7 non-scoring GoalComposer. Preserve all item goals in ICMS.goals. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYGoalComposerV87=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const groups=[
['PROTECT','현재 보호·돌봄 안전 확인',[1,2]],
['SELF','자해 관련 현재 안전·전문지원 확인',[7]],
['ONLINE','온라인 성적 위협의 피해보호 확인',[25]],
['PEER','또래 피해·위해와 학교 안 안전 조정',[3,4,5]],
['HEALTH','정서·행동·건강 어려움에 대한 지원',[6,8,12,13]],
['EDUCATION','출결·교과학습·교육접근성 조정',[9,10,11,14,15]],
['CARE','가족관계·돌봄 책임과 일상 공백 조정',[16,17,18]],
['BASIC','필수 물품 및 비용 장벽 해소 검토',[19,21]],
['HOUSING','거주 안정성 및 주거 안전 확인',[20]],
['SUPPORT','신뢰 관계·활동 참여의 기반 마련',[22,23]],
['DIGITAL','디지털 이용조절과 생활기능 회복',[24]]
];
const map=new Map(groups.flatMap(([group,title,items],order)=>items.map(item=>[item,{group,title,order}])));
function build(goals,opts={}){
 const limit=Math.max(3,Math.min(5,Number.isInteger(opts.limit)?opts.limit:5));
 const byGroup=new Map();
 for(const g of goals||[]){const item=g.item,meta=map.get(item)||{group:g.id.startsWith('NARRATIVE')?'SAFETY-OTHER':'OTHER-'+g.id,title:g.concept||'서술 안전 추가확인',order:0};
  const key=(g.priority===0&&meta.group!=='PROTECT'&&meta.group!=='SELF'&&meta.group!=='ONLINE')?'SAFETY-'+meta.group:meta.group;
  if(!byGroup.has(key))byGroup.set(key,{key,title:meta.title,order:meta.order,items:[],priority:99});
  const row=byGroup.get(key);row.items.push(g);row.priority=Math.min(row.priority,g.priority??5);
 }
 const composed=[...byGroup.values()].map(g=>{
  g.items.sort((a,b)=>(a.priority??5)-(b.priority??5)||(b.score||0)-(a.score||0));
  const unique=a=>[...new Set(a.filter(Boolean))];
  const itemIds=unique(g.items.map(x=>x.id));const sourceNumbers=unique(g.items.map(x=>x.item).filter(n=>Number.isInteger(n)));
  const actions=unique(g.items.map(x=>x.action));
  const teachers=unique(g.items.map(x=>x.teacher)),workers=unique(g.items.map(x=>x.worker)),checks=unique(g.items.map(x=>x.verification));
  const evidenceIds=unique(g.items.flatMap(x=>x.evidenceIds||[]));
  return {id:'C87-'+g.key,concept:g.title,priority:g.priority,sourceGoalIds:itemIds,sourceNumbers,sourceEvidence:evidenceIds,score:Math.max(...g.items.map(x=>x.score||0),0),item:g.items[0]?.item||null,scope:'casework-cluster-not-new-score',goal:'해당 문항별 근거와 학생 희망을 확인하여 우선 조정 사항을 협의함',action:actions[0]||'직접 면담으로 확인',teacher:teachers[0]||'',worker:workers[0]||'',verification:checks[0]||'점검일 협의',actionDetails:g.items.map(x=>({id:x.id,item:x.item,concept:x.concept,action:x.action,teacher:x.teacher,worker:x.worker,verification:x.verification,priority:x.priority})),evidenceIds,reviewPending:true,completed:false};
 }).sort((a,b)=>a.priority-b.priority||b.score-a.score||a.id.localeCompare(b.id));
 const shown=composed.slice(0,limit),deferred=composed.slice(limit);
 const coverage=[...new Set(composed.flatMap(g=>g.sourceGoalIds))];
 return {version:'8.7.0',goals:composed,shown,deferred,primaryGoalIds:shown.map(x=>x.id),allGoalIds:composed.map(x=>x.id),sourceGoalIds:coverage,sourceCount:(goals||[]).length,sourceFullyCovered:(goals||[]).every(g=>coverage.includes(g.id)),policy:'25개 문항별 확인은 유지하되 회의·실행목표는 최대 5개 주요 묶음으로 제시. 각 문항의 독립 행동은 세부 과제로 보존'};
}
return Object.freeze({VERSION:'8.7.0',build});
});