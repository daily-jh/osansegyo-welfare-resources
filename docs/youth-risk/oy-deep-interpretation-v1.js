/* OY-RALS deep interpretation model v1: MMPI-style full report from the 25 CORE responses.
   Order: summary → response validity → domain profile → elevated-domain pattern → domain detail →
   critical items → linked patterns → strengths → understanding → role actions → interview → reassessment → one notice.
   Reads CORE (criteria.js), item knowledge and cross patterns. Never changes scores or safety decisions. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const C=node?require('./criteria.js'):root.YouthCriteria;
const K=node?require('./oy-item-knowledge-v1.js'):root.OYItemKnowledge;
const X=node?require('./oy-cross-patterns-v1.js'):root.OYCrossPatterns;
const VERSION='1.0.0-20261026';
const LEVELS=['보고 없음','경미','주의','상승','현저'];
const SAFETY=[1,2,7,25],PRIORITY=[4,5,8,12,13,16,19,20];
const NOTICE='이 해석지는 25문항 응답을 OY-RALS 규칙에 따라 풀어 쓴 실무 참고자료입니다. 문장은 응답이 가리키는 상태를 읽기 쉽게 서술한 것이며, 진단·학대 판정·위험 예측이나 서비스 자격 결정이 아닙니다. 면담과 관찰로 확인한 사실이 응답보다 우선하고, 안전 신호가 있으면 이 해석지와 관계없이 소속기관의 보호·신고 절차를 먼저 따릅니다. 0~4점 기준과 교차 패턴은 전문가 내용타당도 검토 전 개발판입니다. 공식 점수와 안전판정은 CORE(criteria.js)가 정합니다.';
const DOMAIN_TEXT=[
 ['보호자와의 관계에서 학생이 안전하게 지내는지가 이 영역의 핵심입니다.','보호자와의 관계에서 위해·방임이 보고되지 않아, 보호자를 지원의 협력자로 함께할 가능성이 열려 있습니다.'],
 ['또래 관계 안에서의 피해·강요·가해가 이 영역의 핵심입니다.','또래 괴롭힘·강요·가해 행동이 보고되지 않아 학교 안 또래 관계는 지원의 발판이 됩니다.'],
 ['마음의 고통과 안전 신호, 생활 리듬의 변화가 이 영역의 핵심입니다.','정서 상태가 비교적 안정적으로 응답되어, 다른 영역의 지원을 받아들일 마음의 여력이 있습니다.'],
 ['학교에 오고, 배우고, 학교에 마음을 두는 세 가지가 이 영역의 핵심입니다.','출결·학습·학교 소속감이 유지되고 있어 학교는 지원을 시작하기 좋은 장소입니다.'],
 ['자신과 타인을 다치게 할 수 있는 행동이 이 영역의 핵심입니다.','위험행동이나 물질 사용 없이 생활하고 있어, 어려움을 행동보다 대화로 다룰 여지가 큽니다.'],
 ['학생 특성에 맞는 환경과 서비스가 제공되는지가 이 영역의 핵심입니다.','학습 편의와 서비스 접근이 갖춰져 있어 필요한 학습 지원을 바로 더할 수 있습니다.'],
 ['돌봄을 받는 일, 가족 관계, 학생이 맡은 돌봄 책임이 이 영역의 핵심입니다.','일상 돌봄과 가족 관계가 학생 생활을 받쳐 주고 있는 것으로 응답되었습니다.'],
 ['먹고, 입고, 머물고, 필요한 지원을 이용하는 생활 기반이 이 영역의 핵심입니다.','기본생활과 주거가 유지되고 있어, 지원을 생계보다 관계와 학교생활에 집중할 수 있습니다.'],
 ['원하는 활동에 참여하고 믿을 어른에게 도움을 받는 연결이 이 영역의 핵심입니다.','원하는 활동 참여와 믿을 어른의 도움이 유지되고 있어 지지망을 넓히는 발판이 됩니다.'],
 ['디지털 이용 조절과 온라인 안전이 이 영역의 핵심입니다.','디지털 생활이 일상을 해치지 않고 있어 온라인 소통을 연결 수단으로 활용할 수 있습니다.']
];
const isNum=v=>typeof v==='number';
// Korean particle by final consonant of the last Hangul syllable: josa('정서','은','는').
function josa(word,a,b){const m=String(word).match(/[가-힣](?=[^가-힣]*$)/);if(!m)return word+a;return word+((m[0].charCodeAt(0)-0xAC00)%28?a:b)}
const STRENGTH_LABEL=['보호자와의 관계','또래 관계','정서 상태','학교생활','행동 조절','학습 환경','가정의 돌봄','생활 기반','지지 관계','디지털 생활'];
const STRENGTH_ORDER=[3,1,8,6,2,4,7,9,5,0];
const topic=n=>K.item(n).topic;
const topics=ns=>ns.map(topic).join(', ');
function validity(values,c){
 const known=values.filter(isNum),rows=[];
 rows.push({label:'응답 완성도',state:c.unknownItems.length?(c.safetyUnknown.length?'보류':'주의'):'양호',
  text:c.unknownItems.length?'25문항 중 '+c.knownCount+'문항이 확인되었고, '+josa(topics(c.unknownItems),'은','는')+' 아직 확인되지 않았습니다(미상). 미상은 어려움이 없다는 뜻으로 읽지 않으며, 해당 영역은 확인된 내용만으로 읽습니다.'+(c.safetyUnknown.length?' 안전과 직결된 '+josa(topics(c.safetyUnknown),'이','가')+' 미상이어서 현재 안전 판단을 마치지 못한 상태입니다.':''):'25문항이 모두 확인되어 전체 프로파일을 그대로 읽을 수 있습니다.'});
 if(known.length>=20){
  const counts=[0,1,2,3,4].map(s=>known.filter(v=>v===s).length),mode=counts.indexOf(Math.max(...counts));
  if(known.every(v=>v===0))rows.push({label:'어려움 보고 없음',state:'주의',text:'모든 문항에서 어려움이 보고되지 않았습니다. 실제로 어려움이 적은 학생일 수도 있고, 평가자가 학생의 생활을 볼 기회가 적었거나 학생이 어려움을 드러내지 않은 경우에도 이렇게 나타납니다. 정보원(학생·보호자·교사)을 넓혀 한 번 더 살펴봅니다.'});
  else if(mode>0&&counts[mode]/known.length>=0.9)rows.push({label:'변별 낮음',state:'주의',text:'확인된 문항의 90% 이상이 같은 점수로 응답되어 문항별 차이가 거의 없습니다. 영역별 해석보다 전체적인 어려움의 크기를 보여 주는 응답으로 읽고, 가장 시급한 문항을 면담으로 가려냅니다.'});
  if(counts[4]>=8)rows.push({label:'극단 응답',state:'주의',text:'가장 심한 수준의 응답이 '+counts[4]+'문항으로 많습니다. 실제 위기가 겹친 상황이거나 평가 당시의 긴박함이 점수 전반에 반영된 경우입니다. 이 문항들 중 현재 진행 중인 것과 과거 사건을 구분해 우선순위를 정합니다.'});
 }
 const pairs=[[2,3,[16,19],'방임 의심은 높게 응답되었는데 일상 돌봄 공백과 생활물품 부족은 보고되지 않았습니다. 방임 판단의 근거가 된 구체적 장면을 기록해 두면 이후 협의가 분명해집니다.'],
  [7,3,[6],'자해·죽음 관련 신호는 높게 응답되었는데 정서적 고통은 보고되지 않았습니다. 학생이 고통을 드러내지 않거나 평가자가 정서 상태를 볼 기회가 적었던 경우에 나타나는 조합이므로, 안전 신호의 근거를 중심으로 정서 상태를 직접 살펴봅니다.'],
  [8,3,[6],'급격한 수면·불안 변화는 높게 응답되었는데 정서적 고통은 보고되지 않았습니다. 신체 건강, 생활환경 변화, 약물 영향처럼 정서 외 원인을 함께 살펴봅니다.'],
  [1,3,[17],'보호자 위해 의심은 높게 응답되었는데 가족관계의 영향은 보고되지 않았습니다. 위해가 가족 갈등으로 축소되거나 반대로 분리되어 기록되지 않았는지 두 내용의 근거를 맞춰 봅니다.']];
 pairs.forEach(([a,min,others,text])=>{if(isNum(values[a-1])&&values[a-1]>=min&&others.every(o=>values[o-1]===0))rows.push({label:'문항 간 대조',state:'주의',text})});
 const level=c.safetyUnknown.length||c.knownCount<13?'보류':rows.some(r=>r.state!=='양호')?'주의':'양호';
 const summary=level==='양호'?'응답이 고르게 확인되어 이 해석지를 그대로 사례 이해에 사용할 수 있습니다.':level==='주의'?'이 해석지를 사용할 수 있으며, 표시된 점을 면담에서 함께 확인하면 해석의 정확도가 높아집니다.':'확인된 정보가 부족해 전체 프로파일보다 확인된 문항 중심으로 읽어야 하는 결과입니다.';
 return {level,summary,rows};
}
function profile(values){
 let off=0;
 return K.DOMAIN_SIZES.map((size,d)=>{
  const nums=Array.from({length:size},(_,k)=>off+k+1);off+=size;
  const vals=nums.map(n=>values[n-1]),known=vals.filter(isNum),unknown=nums.filter(n=>values[n-1]==='unknown');
  const peak=known.length?Math.max(...known):null,sum=known.reduce((a,b)=>a+b,0),mean=known.length?sum/known.length:null;
  const positive=nums.filter(n=>isNum(values[n-1])&&values[n-1]>0);
  return {id:d,name:K.DOMAIN_NAMES[d],items:nums,known:known.length,unknown,peak,sum,max:size*4,mean,positive,
   level:peak===null?null:peak,label:peak===null?'판단 보류':LEVELS[peak]+(unknown.length?' · 일부 미상':''),clear:!unknown.length&&known.length===size&&peak===0};
 });
}
function axes(values){
 return K.AXES.map(a=>{
  const known=a.items.filter(n=>isNum(values[n-1])),peak=known.length?Math.max(...known.map(n=>values[n-1])):null;
  const high=known.filter(n=>values[n-1]>=2).sort((x,y)=>values[y-1]-values[x-1]);
  return {id:a.id,name:a.name,peak,high,unknown:a.items.filter(n=>values[n-1]==='unknown'),
   text:peak===null?'확인된 응답이 없어 판단을 보류합니다.':peak===0?'어려움이 보고되지 않았습니다.':high.length?high.slice(0,3).map(topic).join(', ')+'에서 어려움이 두드러집니다.':'가벼운 어려움만 보고되었습니다.'};
 });
}
function rankDomains(prof){return prof.filter(d=>d.peak!==null&&d.peak>=2).sort((a,b)=>b.peak-a.peak||b.mean-a.mean||b.sum-a.sum||a.id-b.id)}
function code(values,prof,patterns,valid){
 const ranked=rankDomains(prof);
 if(!prof.some(d=>d.known))return {kind:'none',domains:[],name:'정보 확인 전 프로파일',text:'확인된 응답이 없어 프로파일을 그릴 수 없습니다. 안전문항부터 확인하고 학생과 가까운 어른에게서 정보를 모읍니다.'};
 if(valid.rows.some(r=>r.label==='변별 낮음')&&ranked.length>=5)return {kind:'flat',domains:ranked.map(d=>d.id),name:'전 영역 고른 상승 프로파일',text:'대부분의 영역이 비슷한 높이로 올라와 있어 특정 영역보다 생활 전반이 함께 흔들리고 있는 프로파일입니다. 이런 응답에서는 영역별 순서보다 안전 문항과 기본생활 문항을 먼저 가려내고, 나머지는 면담으로 우선순위를 다시 세웁니다.'};
 if(!ranked.length){
  const light=prof.filter(d=>d.peak===1);
  return {kind:'low',domains:[],name:light.length?'가벼운 신호 분산 프로파일':'낮은 프로파일',
   text:light.length?'2점 이상 문항 없이 '+light.map(d=>d.name).join('·')+' 영역에서 가벼운 어려움만 보고되었습니다. 지금은 집중 개입보다 학생이 느끼는 불편을 듣고 변화를 지켜보는 단계입니다.':'확인된 모든 문항에서 어려움이 보고되지 않았습니다. 응답 타당성 항목을 함께 보고, 학생이 편하게 도움을 청할 경로를 확인해 두는 것으로 충분한 단계입니다.'};
 }
 const top=ranked.slice(0,2);
 const lead=top.map(d=>d.positive.filter(n=>values[n-1]>=2).sort((a,b)=>values[b-1]-values[a-1])[0]);
 const leadText=lead.map(n=>K.reading(n,values[n-1])).join(' ');
 if(top.length===1){
  const d=top[0],p=patterns.find(x=>x.items.every(n=>K.DOMAIN_OF[n-1]===d.id));
  return {kind:'single',domains:[d.id],name:p?p.name:d.name+' 집중 프로파일',
   text:d.name+' 영역 한 곳에 어려움이 모여 있는 프로파일입니다. '+(p?p.loop+' 구체적으로 보면, '+leadText:leadText+' 다른 영역은 상대적으로 유지되고 있어, 이 영역에 지원을 집중하면 변화가 빠르게 나타나는 유형입니다.')};
 }
 const ids=top.map(d=>d.id);
 const p=patterns.find(x=>{const ds=x.items.map(n=>K.DOMAIN_OF[n-1]);return ids.every(id=>ds.includes(id))})||patterns.find(x=>x.items.some(n=>ids.includes(K.DOMAIN_OF[n-1])));
 const third=ranked[2];
 return {kind:'pair',domains:ids,name:p?p.name:top.map(d=>d.name).join('–')+' 동반 상승 프로파일',
  text:top.map(d=>d.name).join(' × ')+' 영역이 가장 높게 올라온 프로파일입니다. '+(p?p.loop+' 구체적으로 보면, '+leadText:leadText+' 두 영역의 어려움이 같은 시기에 나타나고 있어, 한쪽만 지원하면 다른 쪽이 회복을 붙잡는 구조가 되기 쉽습니다.')+(third?' 그다음으로 '+third.name+' 영역('+LEVELS[third.peak]+')이 뒤따릅니다.':'')};
}
function domainDetail(values,d){
 const items=d.items.map(n=>{const v=values[n-1],k=K.item(n);return {n,topic:k.topic,value:v,anchor:isNum(v)?k.a[v]:null,reading:isNum(v)&&v>0?K.reading(n,v):null,sign:k.d,question:k.q}});
 const readings=items.filter(x=>x.reading).sort((a,b)=>b.value-a.value).map(x=>({topic:x.topic,text:x.reading}));
 const zero=items.filter(x=>x.value===0).map(x=>x.topic),unk=items.filter(x=>x.value==='unknown').map(x=>x.topic);
 const notes=[zero.length&&readings.length?josa(zero.join(', '),'은','는')+' 어려움이 보고되지 않아, 이 영역의 어려움은 특정 부분에 모여 있습니다.':'',unk.length?josa(unk.join(', '),'은','는')+' 아직 확인되지 않아(미상) 이 부분은 판단을 보류합니다.':''].filter(Boolean);
 const lead=DOMAIN_TEXT[d.id][0],text=[lead,...readings.map(x=>x.text),...notes].join(' ');
 const signs=items.filter(x=>isNum(x.value)&&x.value>=2).map(x=>x.sign);
 return {id:d.id,name:d.name,label:d.label,peak:d.peak,mean:d.mean,sum:d.sum,max:d.max,unknown:d.unknown,lead,readings,notes,text,signs,items};
}
function critical(values,c){
 const list=[];
 SAFETY.forEach(n=>{const v=values[n-1];if(isNum(v)&&v>0)list.push({n,kind:'안전',value:v,topic:topic(n),reading:K.reading(n,v),action:K.item(n).e});else if(v==='unknown')list.push({n,kind:'안전 미상',value:v,topic:topic(n),reading:josa(topic(n),'이','가')+' 아직 확인되지 않아(미상) 현재 안전 판단을 마치지 못했습니다.',action:'이 내용부터 직접 확인합니다.'})});
 PRIORITY.forEach(n=>{const v=values[n-1];if(isNum(v)&&v>=3)list.push({n,kind:'우선',value:v,topic:topic(n),reading:K.reading(n,v),action:K.item(n).e})});
 const pending=c.pendingChecks.map(topic);
 return {list,pending,procedure:c.urgent||c.safetyUnknown.length||c.pendingChecks.length?'안전 신호가 있는 문항은 총점이나 다른 지원보다 먼저 다룹니다. 학대·위해가 의심되면 사실 확정을 기다리지 않고 신고의무와 소속기관 보호 절차를 따르며, 즉각적인 위험은 112·119로 연락합니다.':''};
}
function strengths(values,prof){
 const out=STRENGTH_ORDER.filter(id=>prof[id].clear).map(id=>({domain:prof[id].name,label:STRENGTH_LABEL[id],text:DOMAIN_TEXT[id][1]}));
 [[23,'믿고 도움을 청할 어른이 있다고 응답되어, 그 어른을 지원 계획의 첫 연결 고리로 세울 수 있습니다.'],[11,'학교에 소속감을 유지하고 있어 학교 안 지원이 잘 받아들여질 조건입니다.'],[22,'원하는 활동에 참여하고 있어 그 활동 자리를 회복과 지지의 장으로 활용할 수 있습니다.']].forEach(([n,t])=>{if(values[n-1]===0&&!prof[K.DOMAIN_OF[n-1]].clear)out.push({domain:topic(n),label:{23:'믿을 어른',11:'학교 소속감',22:'활동 참여'}[n],text:t})});
 return out;
}
function rankItems(values){return values.map((v,i)=>({n:i+1,v})).filter(x=>isNum(x.v)&&x.v>0).sort((a,b)=>Number(SAFETY.includes(b.n))-Number(SAFETY.includes(a.n))||b.v-a.v||a.n-b.n)}
function understanding(values,c,cd,patterns,str,crit){
 const top=rankItems(values).filter(x=>x.v>=2).sort((a,b)=>b.v-a.v||a.n-b.n).slice(0,3);
 if(!c.knownCount)return '확인된 응답이 없어 학생의 모습을 그릴 수 있는 정보가 아직 없습니다. 안전문항부터 확인하고 학생과 가장 가까운 어른에게 정보를 모으는 것이 첫 단계입니다.';
 if(!top.length)return '이번 응답에서 이 학생의 어려움은 가볍거나 드러나지 않은 상태입니다. 지금은 학생이 일상에서 느끼는 불편과 바라는 변화를 듣고, 힘들 때 연락할 수 있는 어른을 분명히 해 두는 것이 가장 좋은 지원입니다.'+(crit.list.length?' 다만 '+crit.list.map(x=>x.topic).join('·')+' 신호가 있어 이 부분의 현재 상황은 먼저 직접 살펴봅니다.':'');
 const s=['이 학생은 '+josa(top.map(x=>topic(x.n)).join(', '),'이','가')+' 가장 두드러지는 학생입니다.'];
 if(patterns[0])s.push(patterns[0].loop.split(/(?<=다\.)\s/)[0]);
 if(patterns[1])s.push('동시에 '+patterns[1].name.replace(/ 패턴$/,'')+' 흐름도 함께 나타납니다. '+patterns[1].loop.split(/(?<=다\.)\s/)[0]);
 const safety=crit.list.filter(x=>x.kind==='안전');
 if(safety.length)s.push(josa(safety.map(x=>x.topic).join(', '),'이','가')+' 응답되어 모든 지원에 앞서 현재 안전을 먼저 확인합니다.');
 if(str.length)s.push(josa(str.length>1?josa(str[0].label,'과','와')+' '+str[1].label:str[0].label,'은','는')+' 유지되고 있어 지원을 시작할 발판이 됩니다.');
 const firsts=[...new Set(patterns.slice(0,2).map(p=>p.first))];
 s.push(firsts.length>1?'먼저, '+firsts[0]+' 이어서, '+firsts[1]:'가장 먼저 할 일: '+(firsts[0]||K.item(top[0].n).e));
 return s.join(' ');
}
function roles(values,patterns){
 const items=rankItems(values).filter(x=>x.v>=2||SAFETY.includes(x.n)).slice(0,5);
 const pick=key=>[...new Set(items.map(x=>K.item(x.n)[key]))].slice(0,4);
 return [{role:'교사',items:pick('t')},{role:'교육복지사',items:pick('e')},{role:'사례관리자',items:pick('c')}].filter(r=>r.items.length);
}
function questions(values,patterns){
 const out=[],seen=new Set();
 patterns.slice(0,3).forEach(p=>{out.push({about:p.name,q:p.q});p.items.forEach(n=>seen.add(n))});
 rankItems(values).filter(x=>x.v>=2||SAFETY.includes(x.n)).forEach(x=>{if(out.length<7&&!seen.has(x.n)){out.push({about:topic(x.n),q:K.item(x.n).q});seen.add(x.n)}});
 values.forEach((v,i)=>{if(v==='unknown'&&out.length<8&&SAFETY.includes(i+1))out.push({about:topic(i+1)+' (미상)',q:K.item(i+1).q})});
 return out;
}
function reassess(values){
 return rankItems(values).filter(x=>x.v>=2).slice(0,6).map(x=>({n:x.n,topic:topic(x.n),now:x.v,nowText:K.item(x.n).a[x.v],target:K.item(x.n).a[x.v-1]}));
}
function build(p){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25)throw Error('DEEP_INPUT_INVALID');
 const values=p.answers.slice(),c=C.evaluate(values,K.DOMAIN_SIZES,!!(p.explicit||[]).length,p.followups||{});
 const prof=profile(values),ax=axes(values),cross=X.match(values),patterns=cross.active;
 const valid=validity(values,c),cd=code(values,prof,patterns,valid),crit=critical(values,c),str=strengths(values,prof);
 const detail=prof.filter(d=>d.positive.length||d.unknown.length).map(d=>domainDetail(values,d)).sort((a,b)=>(b.peak??-1)-(a.peak??-1)||(b.mean??0)-(a.mean??0)||a.id-b.id);
 const keys=rankItems(values).filter(x=>x.v>=2||SAFETY.includes(x.n)).slice(0,3).map(x=>topic(x.n));
 const first=crit.list.some(x=>x.kind==='안전'||x.kind==='안전 미상')?'이번 주 안에 '+crit.list.filter(x=>x.kind.startsWith('안전')).map(x=>x.topic).join(', ')+'의 현재 상황을 직접 안전 면담으로 확인합니다.':patterns[0]?patterns[0].first:keys.length?K.item(rankItems(values)[0].n).e:'학생이 편하게 도움을 청할 사람과 다음 만남 날짜를 정합니다.';
 const level=c.provisional?(c.incomplete?'확인된 응답 기준 '+['관찰·예방','개별영역 지원','복합욕구 조정','다기관 집중검토'][c.observedLevel]+' 수준 · 전체 판정 보류':'안전 추가확인 대기 · '+['관찰·예방','개별영역 지원','복합욕구 조정','다기관 집중검토'][c.observedLevel]+' 수준'):['관찰·예방','개별영역 지원','복합욕구 조정','다기관 집중검토'][c.level]+' 수준';
 return {version:VERSION,core:c,title:c.title,summary:{level,safety:c.urgent?'안전 확인 우선':c.safetyUnknown.length||c.pendingChecks.length?'안전 확인 미완료':'이번 응답의 안전 신호 없음',keys,first,total:c.incomplete?'확인 '+c.knownCount+'문항 합계 '+c.knownTotal+'점 (미상 '+c.unknownItems.length+'문항)':c.knownTotal+' / 100점'},
  validity:valid,profile:prof,axes:ax,code:cd,detail,critical:crit,patterns:{active:patterns,pending:cross.pending},strengths:str,
  understanding:understanding(values,c,cd,patterns,str,crit),items:values.map((v,i)=>({n:i+1,topic:topic(i+1),value:v,anchor:isNum(v)?K.anchor(i+1,v):null})),roles:roles(values,patterns),questions:questions(values,patterns),reassess:reassess(values),notice:NOTICE};
}
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// Body uses plain-language topics only; item numbers and scores live in the appendix.
function sections(r){
 const out=[];
 if(r.critical.list.length||r.critical.pending.length)out.push('critical');
 out.push('understanding','code','profile','detail','patterns','strengths','roles','questions','reassess','validity');
 return out;
}
const TITLES={critical:'먼저 확인할 안전 신호',understanding:'이 학생을 이해하기',code:'응답 패턴',profile:'영역 프로파일',detail:'영역별 상세 해석',patterns:'어려움이 이어지는 고리',strengths:'강점과 지원의 발판',roles:'역할별 실천',questions:'면담에서 물어볼 질문',reassess:'다음 평가에서 볼 변화',validity:'응답 타당성'};
function html(r){
 const s=r.summary,ul=a=>'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 const body={
  critical:()=>(r.critical.list.length?'<ul class="odi-list">'+r.critical.list.map(x=>'<li><strong>'+esc(x.topic)+'</strong><p>'+esc(x.reading)+'</p><p class="odi-act">'+esc(x.action)+'</p></li>').join('')+'</ul>':'')+(r.critical.pending.length?'<p><strong>안전 추가확인 남음</strong> '+esc(r.critical.pending.join(', '))+'</p>':'')+(r.critical.procedure?'<p class="odi-procedure">'+esc(r.critical.procedure)+'</p>':''),
  understanding:()=>'<p class="odi-lead">'+esc(r.understanding)+'</p>',
  code:()=>'<p class="odi-pattern-name">'+esc(r.code.name)+'</p><p>'+esc(r.code.text)+'</p>',
  profile:()=>'<ul class="odi-bars">'+r.profile.map(d=>'<li class="odi-l'+(d.peak??'u')+'"><span class="odi-bar-name">'+esc(d.name)+'</span><span class="odi-track" aria-hidden="true"><i style="width:'+(d.mean===null?0:Math.max(4,d.mean/4*100))+'%"></i></span><span class="odi-bar-val">'+esc(d.label)+'</span></li>').join('')+'</ul><dl class="odi-axes">'+r.axes.map(a=>'<div><dt>'+esc(a.name)+'</dt><dd>'+esc(a.text)+'</dd></div>').join('')+'</dl>',
  detail:()=>r.detail.length?r.detail.map(d=>'<div class="odi-domain odi-l'+(d.peak??'u')+'"><h4>'+esc(d.name)+'<span class="odi-tag">'+esc(d.label)+'</span></h4><p>'+esc(d.lead)+'</p>'+(d.readings.length?ul(d.readings.map(x=>'<strong>'+esc(x.topic)+'</strong> '+esc(x.text))):'')+d.notes.map(t=>'<p class="odi-muted">'+esc(t)+'</p>').join('')+(d.signs.length?'<p class="odi-signs"><strong>일상에서 보이는 모습</strong> '+esc(d.signs.join(' · '))+'</p>':'')+'</div>').join(''):'<p>어려움이 보고된 영역이 없습니다.</p>',
  patterns:()=>{const a=r.patterns.active;return (a.length?a.slice(0,3).map(p=>'<div class="odi-card"><h4>'+esc(p.name)+'</h4><p>'+esc(p.loop)+'</p><p><strong>일상에서</strong> '+esc(p.sign)+'</p><p class="odi-act"><strong>첫 개입</strong> '+esc(p.first)+'</p></div>').join('')+(a.length>3?'<p><strong>함께 나타난 다른 패턴</strong> '+esc(a.slice(3).map(p=>p.name).join(' · '))+'</p>':''):'<p>두 가지 이상의 어려움이 맞물린 패턴은 나타나지 않았습니다.</p>')+(r.patterns.pending.length?'<p class="odi-muted"><strong>미상 때문에 판단을 보류한 패턴</strong> '+esc(r.patterns.pending.map(p=>p.name).join(' · '))+'</p>':'')},
  strengths:()=>r.strengths.length?ul(r.strengths.map(x=>'<strong>'+esc(x.label)+'</strong> '+esc(x.text))):'<p>모든 영역에서 일부 어려움이 보고되어, 강점은 면담에서 학생이 잘하는 것과 좋아하는 것을 직접 물어 찾습니다.</p>',
  roles:()=>r.roles.length?'<div class="odi-roles">'+r.roles.map(x=>'<div><h4>'+esc(x.role)+'</h4>'+ul(x.items.map(esc))+'</div>').join('')+'</div>':'<p>학생과 정기적으로 안부를 나누고 다음 확인 시점을 정합니다.</p>',
  questions:()=>r.questions.length?'<ol class="odi-q">'+r.questions.map(x=>'<li><span>'+esc(x.about)+'</span>“'+esc(x.q)+'”</li>').join('')+'</ol>':'<p>“요즘 학교나 집에서 바뀌었으면 하는 게 있나요?”로 시작합니다.</p>',
  reassess:()=>r.reassess.length?ul(r.reassess.map(x=>'<strong>'+esc(x.topic)+'</strong> 지금: '+esc(x.nowText)+'<br>다음 목표: '+esc(x.target))):'<p>다음 평가에서 지금의 응답이 유지되는지와 새로운 어려움이 생겼는지 봅니다.</p>',
  validity:()=>'<p><strong>'+esc(r.validity.level)+'</strong> · '+esc(r.validity.summary)+'</p>'+ul(r.validity.rows.map(x=>'<strong>'+esc(x.label)+'</strong> '+esc(x.text)))
 };
 let h='<article class="oy-deep-report" data-report-version="'+VERSION+'"><header class="odi-head"><span class="odi-kicker">OY-RALS 심층해석지</span><h2>'+esc(r.code.name)+'</h2><p>'+esc(r.title)+'</p></header>';
 h+='<section class="odi-sec odi-glance"><h3>한눈에 보기</h3><dl><div><dt>지원 수준</dt><dd>'+esc(s.level)+'</dd></div><div class="'+(s.safety==='이번 응답의 안전 신호 없음'?'':'odi-alert')+'"><dt>현재 안전</dt><dd>'+esc(s.safety)+'</dd></div><div><dt>핵심 어려움</dt><dd>'+(s.keys.length?s.keys.map(k=>'<span class="odi-chip">'+esc(k)+'</span>').join(''):'두드러진 어려움 없음')+'</dd></div><div><dt>이번 주 첫 행동</dt><dd>'+esc(s.first)+'</dd></div><div><dt>해석 신뢰도</dt><dd>'+esc(r.validity.level)+' · '+esc(r.validity.summary)+'</dd></div></dl></section>';
 sections(r).forEach((k,i)=>{h+='<section class="odi-sec odi-s-'+k+'"><h3><span class="odi-num">'+(i+1)+'</span>'+esc(TITLES[k])+'</h3>'+body[k]()+'</section>'});
 h+=appendixHtml(r)+'<footer class="odi-notice"><h3>해석 안내</h3><p>'+esc(r.notice)+'</p></footer></article>';
 return h;
}
function appendixRows(r){
 const v=r.core;
 return {
  domains:r.profile.map(d=>[d.name,d.known?d.sum+' / '+(d.known*4):'—',d.mean===null?'—':d.mean.toFixed(1),d.label,d.unknown.length?d.unknown.join('·')+'번':'없음']),
  items:r.items.map(x=>[x.n+'번',x.topic,x.value==='unknown'?'미상':x.value+'점',x.value==='unknown'?'미상은 0점으로 계산하지 않음':x.anchor]),
  patterns:r.patterns.active.map(p=>[p.name,p.items.map(n=>n+'번').join('·'),p.extra.length?p.extra.map(n=>n+'번').join('·'):'—']).concat(r.patterns.pending.map(p=>[p.name+' (보류)',p.items.map(n=>n+'번').join('·'),'미상 '+p.unknown.join('·')+'번'])),
  critical:r.critical.list.map(x=>[x.n+'번',x.topic,x.value==='unknown'?'미상':x.value+'점',x.kind]),
  reassess:r.reassess.map(x=>[x.n+'번',x.topic,x.now+'점',(x.now-1)+'점 이하'])
 };
}
function appendixHtml(r){
 const t=(head,rows)=>rows.length?'<div class="odi-table"><table><thead><tr>'+head.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p>해당 없음</p>';
 const a=appendixRows(r);
 return '<section class="odi-appendix"><h3>근거 자료 · 문항과 점수</h3><p>본문 해석의 바탕이 된 원자료입니다. 원점수 '+esc(r.summary.total)+' · CORE 판단: '+esc(r.title)+'</p><p class="odi-muted">'+esc(r.core.reason)+'</p>'
  +'<details open><summary>영역별 점수</summary>'+t(['영역','확인 합계 / 최대','평균(0~4)','수준','미상'],a.domains)+'</details>'
  +'<details><summary>25문항 응답과 점수 기준</summary>'+t(['문항','내용','응답','이 점수의 기준'],a.items)+'</details>'
  +'<details><summary>결정적 문항</summary>'+t(['문항','내용','응답','구분'],a.critical)+'</details>'
  +'<details><summary>패턴별 근거 문항</summary>'+t(['패턴','핵심 문항','함께 본 문항'],a.patterns)+'</details>'
  +'<details><summary>재평가 기준</summary>'+t(['문항','내용','현재','다음 목표'],a.reassess)+'</details></section>';
}
function text(r){
 const s=r.summary,L=[];
 const B={
  critical:()=>[...r.critical.list.map(x=>'- '+x.topic+': '+x.reading+'\n  → '+x.action),...(r.critical.pending.length?['- 안전 추가확인 남음: '+r.critical.pending.join(', ')]:[]),...(r.critical.procedure?[r.critical.procedure]:[])],
  understanding:()=>[r.understanding],
  code:()=>[r.code.name,r.code.text],
  profile:()=>[...r.profile.map(d=>'- '+d.name+': '+d.label),...r.axes.map(a=>'· '+a.name+': '+a.text)],
  detail:()=>r.detail.length?r.detail.flatMap(d=>['▸ '+d.name+' ('+d.label+')','  '+d.lead,...d.readings.map(x=>'  - '+x.topic+': '+x.text),...d.notes.map(t=>'  '+t),...(d.signs.length?['  일상에서: '+d.signs.join(' · ')]:[])]):['어려움이 보고된 영역이 없습니다.'],
  patterns:()=>r.patterns.active.length?[...r.patterns.active.slice(0,3).flatMap(p=>['▸ '+p.name,'  '+p.loop,'  일상에서: '+p.sign,'  첫 개입: '+p.first]),...(r.patterns.active.length>3?['함께 나타난 다른 패턴: '+r.patterns.active.slice(3).map(p=>p.name).join(' · ')]:[]),...(r.patterns.pending.length?['미상으로 판단 보류: '+r.patterns.pending.map(p=>p.name).join(' · ')]:[])]:['두 가지 이상의 어려움이 맞물린 패턴은 나타나지 않았습니다.'],
  strengths:()=>r.strengths.length?r.strengths.map(x=>'- '+x.label+': '+x.text):['- 면담에서 학생이 잘하는 것과 좋아하는 것을 직접 묻습니다.'],
  roles:()=>r.roles.flatMap(x=>['▸ '+x.role,...x.items.map(t=>'  - '+t)]),
  questions:()=>r.questions.map((x,i)=>(i+1)+'. ['+x.about+'] "'+x.q+'"'),
  reassess:()=>r.reassess.map(x=>'- '+x.topic+'\n  지금: '+x.nowText+'\n  다음 목표: '+x.target),
  validity:()=>[r.validity.level+' · '+r.validity.summary,...r.validity.rows.map(x=>'- '+x.label+': '+x.text)]
 };
 L.push('■ OY-RALS 심층해석지 · '+r.code.name,r.title,'','[한눈에 보기]','지원 수준: '+s.level,'현재 안전: '+s.safety,'핵심 어려움: '+(s.keys.join(', ')||'두드러진 어려움 없음'),'이번 주 첫 행동: '+s.first,'해석 신뢰도: '+r.validity.level);
 sections(r).forEach((k,i)=>L.push('','['+(i+1)+'. '+TITLES[k]+']',...B[k]()));
 const a=appendixRows(r);
 L.push('','[근거 자료 · 문항과 점수]','원점수: '+s.total,'CORE 판단: '+r.title,r.core.reason,'영역별 점수',...a.domains.map(x=>'- '+x[0]+': '+x[1]+' · 평균 '+x[2]+' · '+x[3]+(x[4]!=='없음'?' · 미상 '+x[4]:'')),'25문항 응답',...a.items.map(x=>'- '+x[0]+' '+x[1]+': '+x[2]),...(a.critical.length?['결정적 문항: '+a.critical.map(x=>x[0]+' '+x[2]).join(', ')]:[]),...(a.patterns.length?['패턴별 근거: '+a.patterns.map(x=>x[0]+' '+x[1]).join(' / ')]:[]),...(a.reassess.length?['재평가 기준: '+a.reassess.map(x=>x[0]+' '+x[2]+'→'+x[3]).join(', ')]:[]));
 L.push('','[해석 안내]',r.notice);
 return L.join('\n');
}
const api=Object.freeze({VERSION,NOTICE,LEVELS,build,html,text});
if(node)module.exports=api;else root.OYDeepInterpretation=api;
})(typeof window!=='undefined'?window:globalThis);
