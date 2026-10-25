/* Contradiction and uncertainty ledger; no alteration of official CORE input */
(function(root,factory){const a=factory();if(typeof module!=='undefined'&&module.exports)module.exports=a;else root.OYReconcileV86=a;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const links={1:['family_harm'],2:['family_harm','meal_gap'],3:['peer_harm'],4:['peer_harm','online_coercion'],6:['mood'],7:['self_harm'],8:['mood'],9:['attendance'],10:['learning'],14:['school_access'],16:['meal_gap'],18:['care_burden'],19:['economic','meal_gap'],20:['housing_arrears','housing_concern'],21:['economic'],22:['peer_conflict'],25:['online_coercion']};
const severe=new Set([1,2,7,25]);
function reconcile(answers,evidence){const log=[];const pos=kind=>evidence.filter(e=>e.kind===kind&&e.polarity==='affirmed'),neg=kind=>evidence.filter(e=>e.kind===kind&&e.polarity==='negated');
 for(let i=1;i<=25;i++){const value=answers[i-1],keys=links[i]||[];const pp=keys.flatMap(pos),nn=keys.flatMap(neg);if(value==='unknown')log.push({id:'U'+i,item:i,type:'unknown',priority:severe.has(i)?0:5,question:i+'번 응답이 미상이므로 직접 안전·기능 근거를 확인하되 0점으로 간주하지 않음',evidenceIds:[]});
 if(value===0&&pp.length&&[1,3,7,9,10,14,18,20,25].includes(i))log.push({id:'C'+i,item:i,type:'narrative_score_conflict',priority:severe.has(i)?0:2,question:i+'번 0점과 서술된 사건·생활 장면의 시점·출처·문항 이해를 대조. 실제 피해나 진단을 자동 확정하지 않음',evidenceIds:[...new Set(pp.map(e=>e.id))]});
 if(Number.isInteger(value)&&value>=3&&!pp.length)log.push({id:'B'+i,item:i,type:'high_without_text',priority:severe.has(i)?0:3,question:i+'번 '+value+'점의 실제 장면·빈도·기간·정보원은 무엇인가요? 상세 서술 없이 위해·경제·주거 사건을 단정하지 않음',evidenceIds:[]});
 if(Number.isInteger(value)&&value>0&&nn.length&&!pp.length)log.push({id:'N'+i,item:i,type:'positive_score_negative_text',priority:severe.has(i)?0:1,question:i+'번은 양성 응답이나 대응하는 서술에는 명시적 부정이 있음. 평가 시점과 출처를 구분해 확인',evidenceIds:nn.map(e=>e.id)});
 }
 const special=[
  [3,4,25,'괴롭힘 피해·강요 협박·온라인 성착취를 같은 사건으로 단정하지 않고 요구·위협·매체를 분리'],
  [9,10,14,'출결·학습수행·교실 내 조정 부족의 독립 근거를 분리'],
  [16,19,20,'돌봄 시간 공백·식량/물품 부족·주거 문제를 같은 기본생활 문제로 병합하지 않음'],
  [16,18,17,'돌봄 제공 부족·학생의 돌봄 책임·가족갈등의 차이를 확인'],
  [24,25,4,'과도한 이용·온라인 성착취·일반 협박의 보호경로를 구별']
 ];for(const group of special){const items=group.slice(0,3);if(items.filter(n=>answers[n-1]>0).length>=2)log.push({id:'PAIR'+items.join('_'),items,type:'overlap_review',priority:4,question:group[3],evidenceIds:[]});}
 log.sort((a,b)=>a.priority-b.priority||((a.item||100)-(b.item||100)));
 return {version:'8.6.0',issues:log,byType:Object.fromEntries([...new Set(log.map(x=>x.type))].map(k=>[k,log.filter(z=>z.type===k).length])),autoScoreChange:false,requiresHumanReview:true};}
return Object.freeze({VERSION:'8.6.0',reconcile});});