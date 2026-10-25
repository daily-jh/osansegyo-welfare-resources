/* OY-RALS | Scale Interpretation V8.2.1: 25 questions, 10 domains, official CORE unchanged.
 * Non-diagnostic practice hypotheses only; never recalculate validated risk probabilities.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthScaleV821=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='8.2.1-scale-context-20261025';
const DOMAIN_NAMES=['아동학대·보호','학교폭력·또래 안전','자해·정서·정신건강','학습·출결','행동·건강 안전','장애·발달 및 접근성','가족·돌봄','경제·주거','관계·지지체계','디지털·온라인 안전'];
const DOMAIN_SIZES=[2,3,3,3,2,2,3,3,2,2];
const META=[
[1,0,'보호자에 의한 위해·학대 의심','위해의 장면·행위·현재 접촉','보호자와 관련된 실제 위해·의심 신호인가요?','경제적 곤란 또는 일상적 갈등만으로 학대로 단정하지 않음'],
[2,0,'필요한 보호의 미제공·방임 의심','보호·의료·위생의 지속적 미제공','필요한 보호가 실제로 제공되지 않은 장면과 기간이 있나요?','돌봄 공백(16번)·자원 부족(19번)과 별개로 방임 의심 근거 확인'],
[3,1,'또래 괴롭힘 피해','괴롭힘·피해 경험','또래의 어떤 행동이 반복되거나 현재 피해를 유발했나요?','친구 갈등만으로 학교폭력 확정하지 않음'],
[4,1,'강요·협박·착취 피해','금품 요구·성적 괴롭힘·강요','3번의 괴롭힘과 별개로 강요·협박 또는 착취가 실제 보고됐나요?','온라인 성착취는 25번에서 별도 안전확인'],
[5,1,'타인 안전 침해 행동','학생이 타인을 해친 구체적 행동','실제 행동과 상대의 안전에 어떤 영향이 있었나요?','피해 학생의 보호와 행동 학생에 대한 지원을 분리'],
[6,2,'정서적 고통·일상 영향','우울·불안·무기력으로 인한 기능 저하','마음의 어려움이 일상의 어떤 활동을 얼마나 어렵게 하나요?','8번 급격한 수면·불안 변화와 구별'],
[7,2,'자해·죽음 관련 안전 신호','자해·자살 관련 말·흔적·행동','지금의 생각·계획·수단·최근 행동과 곁에 있는 도움은 무엇인가요?','발생 여부와 관계없이 현재 안전 직접 확인'],
[8,2,'현저한 수면·불안·혼란 변화','평소 대비 급격한 변화와 기능 저하','평소와 다른 변화가 언제 시작해 어떤 생활 영향이 생겼나요?','6번의 일반적인 정서 고통과 중복 확인'],
[9,3,'등교·출결·참여 감소','지각·조퇴·결석·등교 회피','실제 출결기록과 학생이 경험한 회피 상황은 무엇인가요?','교과 이해의 어려움(10번)이나 소속감(11번)과 별개'],
[10,3,'교과 학습·과제 수행 어려움','수업 이해·기초학습·과제','어느 과목·과제에서 막히고 어떤 조정이 도움이 되나요?','출결(9번)이나 진단명만으로 점수를 올리지 않음'],
[11,3,'학교 소속감·학업 지속 부담','학교의 소속감과 지속 희망','학교에서 관계·소속감을 어떻게 느끼고 지속 의사는 무엇인가요?','결석 횟수(9번)와 다른 개념'],
[12,4,'위험 충동·파손·자타 안전','물건 파손·위험 행동','행동 직전·직후의 맥락과 실제 다칠 위험은 무엇인가요?','타인 괴롭힘(5번)과 구분'],
[13,4,'물질 사용·건강 위해 행동','음주·흡연·약물 오용·위험한 외출','행동·급성 증상·반복 여부와 현재 의료 위험이 있나요?','흡연 경험과 약물 과량복용을 같은 긴급도로 다루지 않음'],
[14,5,'학습환경·의사소통 편의 부족','감각·주의·인지 특성에 맞는 조정','제공되지 않은 수업·소음·설명 방식의 조정은 무엇인가요?','ADHD 진단 여부를 묻는 문항이 아님'],
[15,5,'보조공학·서비스 접근 제한','필요한 편의·발달·돌봄 서비스','필요한 보조도구·서비스가 무엇이고 이용 장벽은 무엇인가요?','비용 장벽만의 문제라면 21번과 구분'],
[16,6,'생활관리·식사·돌봄 공백','보호자 부재·질병·여력과 실질적 공백','언제 어떤 돌봄·식사가 실제 제공되지 않았나요?','음식 자체 부족(19번), 학대 의심(2번)과 구분'],
[17,6,'가족관계·양육 스트레스 영향','갈등으로 인한 정서·학교생활 변화','갈등 장면과 학생에게 나타난 변화는 무엇인가요?','가정 내 폭력(1번)을 가족 갈등으로 축소하지 않음'],
[18,6,'학생의 과중한 가족돌봄 책임','간병·가사 부담이 휴식·학습 제한','누구를 얼마나 돌보고 쉬거나 배울 시간에 영향이 있나요?','가벼운 일상적 가사분담과 구분'],
[19,7,'필수 생활물품·식량 부족','식사·의복·위생·준비물 등 자원 부족','무엇이 실제로 부족하고 현재 제공은 어떻게 이뤄지나요?','식사 준비자의 부재(16번)와 구분'],
[20,7,'주거의 불안정·위험·환경','거처 불안·물리적 안전·학습 환경','20번 응답은 거처 이동, 구조적 위험, 생활환경 중 무엇인가요?','체납이나 퇴거가 실제로 보고되지 않았다면 생성하지 않음'],
[21,7,'비용 때문에 이용하지 못한 지원','의료·교육·생활 지원의 비용 장벽','필요하지만 비용 때문에 포기·지연한 서비스는 무엇인가요?','물품 부족(19번)·주거 문제(20번)와 구분'],
[22,8,'원하는 참여의 어려움·고립','학생이 원하는 활동 참여의 장벽','학생은 원하는 활동이 있는데 어떤 이유로 참여가 어렵나요?','혼자 있기를 선호하는 성향을 고립으로 단정하지 않음'],
[23,8,'신뢰할 어른·실제 도움 부족','지원 요청 대상과 실제 이용 가능성','학생이 도움을 청할 어른과 실제 연결 방법이 있나요?','가족 형태나 관계 인원수만으로 판정하지 않음'],
[24,9,'디지털 이용 조절로 인한 기능 저하','수면·학습·대면 활동 지장','실제 이용으로 잠·수업·관계가 어떻게 달라졌나요?','이용 시간만으로 기능 저하 추정하지 않음'],
[25,9,'온라인 성적 요구·성착취 징후','온라인 성적 강요·유포 위협','성적 요구·유포 위협의 현재 상태와 안전한 피해 보호 경로는 무엇인가요?','일반 사이버 괴롭힘(3번)·비성적 협박(4번)과 구분']
].map(([number,domain,concept,indicator,question,boundary])=>Object.freeze({number,domain,concept,indicator,question,boundary}));
const RELATED=[
{items:[1,2,16,19],label:'보호·돌봄·생계의 차이',ask:'방임 의심(2), 실제 돌봄 공백(16), 자원 부족(19), 보호자 위해(1)의 서로 다른 직접 근거가 있나요?'},
{items:[3,4,25],label:'또래피해·강요·온라인 성착취 구분',ask:'같은 사건이라면 피해, 협박·강요, 온라인 성착취 신호를 분리해 확인했나요?'},
{items:[3,22],label:'또래피해와 활동 참여',ask:'관계 위축이 피해와 같은 사건인지, 원하는 활동 참여 자체의 어려움인지 확인했나요?'},
{items:[6,7,8],label:'정서·수면·현재 자해 위험 구분',ask:'정서적 고통, 급격한 기능 변화, 자해·자살 안전 신호의 각각의 근거는 무엇인가요?'},
{items:[9,10,11,14],label:'출결·학습·소속감·교육환경 구분',ask:'결석 기록, 학습 이해, 소속감, 제공되지 않은 편의의 근거를 각각 기록했나요?'},
{items:[5,12,13],label:'타인 피해·위험행동·물질 사용 구분',ask:'해당 행동의 대상·안전 위험·물질 사용 여부가 서로 다른 근거인가요?'},
{items:[14,15,21],label:'교실 조정·지원서비스·비용 장벽 구분',ask:'학교 안의 조정 부족인지, 서비스 미이용인지, 비용 때문에 이용하지 못했는지 확인했나요?'},
{items:[16,18],label:'학생 돌봄 공백과 학생의 돌봄 책임',ask:'학생이 돌봄을 받지 못하는 상황과 가족을 돌보느라 과중한 역할을 맡는 상황을 구분했나요?'},
{items:[19,20,21],label:'생활자원·주거·지원 이용 장벽',ask:'물품 부족, 주거 불안정, 비용 때문에 이용하지 못한 서비스의 독립적 근거가 있나요?'}
];
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function scoreState(v){return v==='unknown'?'미상 · 확인 전':v===0?'이번 응답에서 해당 어려움 보고 없음':v===1?'1점 · 구체적 근거 확인':v===2?'2점 · 생활 영향 확인':v>=3?v+'점 · 우선 근거 확인':'미응답';}
function assess(p,evidence){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25)throw Error('25개 공식 척도 응답이 필요합니다');
 const ans=p.answers,sizes=p.domains?.map(g=>g.items?.length??0);
 if(ans.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('문항 값은 0~4 또는 unknown');
 const evidenceTopics=evidence?.topics||{},has=k=>Array.isArray(evidenceTopics[k])&&evidenceTopics[k].length>0;
 const units=META.map(meta=>({ ...meta,value:ans[meta.number-1],state:scoreState(ans[meta.number-1]),missing:ans[meta.number-1]==='unknown',priority:typeof ans[meta.number-1]==='number'&&ans[meta.number-1]>=3?'우선 확인':ans[meta.number-1]>0?'일반 확인':'점수 기반 지원 확정 없음'}));
 let i=0;const domains=DOMAIN_SIZES.map((n,d)=>{const slice=ans.slice(i,i+n);i+=n;const known=slice.filter(Number.isInteger),missing=slice.filter(x=>x==='unknown').length;return {id:d,name:DOMAIN_NAMES[d],answered:known.length,missing,knownSum:known.reduce((a,b)=>a+b,0),fullMax:n*4,range:[known.reduce((a,b)=>a+b,0),known.reduce((a,b)=>a+b,0)+missing*4],normalizedMean:missing?null:known.reduce((a,b)=>a+b,0)/n,topItems:units.filter(x=>x.domain===d&&typeof x.value==='number'&&x.value>=3).map(x=>x.number),hasHigh:known.some(v=>v>=3)}});
 const unknown=units.filter(x=>x.missing),safety=[1,2,7,25].filter(n=>ans[n-1]>0),safetyUnknown=[1,2,7,25].filter(n=>ans[n-1]==='unknown');
 const prompts=[];const add=(id,why,question,items,severity='확인')=>{if(!prompts.some(x=>x.id===id))prompts.push({id,why,question,items,severity})};
 for(const u of units.filter(x=>typeof x.value==='number'&&x.value>=3)) add('high-'+u.number,u.number+'번 '+u.value+'점 · '+u.concept,u.question,[u.number],safety.includes(u.number)?'안전 우선':'문항 고점');
 if(ans[8]>=3&&!has('attendance'))add('attendance-gap','9번 고점이나 출결 서술 미확인','실제 지각·조퇴·결석 횟수와 평가 근거·기간은 무엇인가요?',[9],'서술·척도 대조');
 if(has('learning')&&ans[9]===0)add('learning-zero','10번은 0점이나 학습 어려움 서술','학습 어려움과 10번의 0점이 각각 어떤 시점·장면을 의미하나요?',[10],'서술·척도 대조');
 if(ans[19]>=2&&!has('housing'))add('housing-only','20번 점수는 있지만 주거 사건 서술이 없음','거처 불안정, 주거 환경, 안전 우려 중 무엇을 답했나요? 체납·퇴거 사실은 별도로 확인했나요?',[20],'서술·척도 대조');
 if(has('housing')&&ans[19]===0)add('housing-zero','주거 어려움은 서술됐으나 20번 0점','주거 관련 서술이 현재 생활을 실제로 방해하는지, 20번 응답 기준이 무엇인지 확인합니다.',[20],'서술·척도 대조');
 if(has('meal')&&ans[15]===0&&ans[18]===0)add('meal-zero','식사 공백 서술과 16·19번 0점 차이','식사 공백이 준비·돌봄 문제(16번)인지 실제 식량·물품 부족(19번)인지 확인합니다.',[16,19],'서술·척도 대조');
 if(has('peer')&&ans[2]===0)add('peer-zero','친구 갈등과 3번 0점은 별도 개념','친구 갈등이 일반적인 관계 문제인지 실제 괴롭힘 피해인지 직접 확인합니다.',[3],'개념 구분');
 if(has('care')&&ans[15]===0)add('care-zero','가족 돌봄 관련 서술과 16번 0점','가족의 근로·양육이 실제 돌봄 공백으로 이어졌는지, 단순 상황 설명인지 확인합니다.',[16],'서술·척도 대조');
 for(const r of RELATED){const active=r.items.filter(n=>typeof ans[n-1]==='number'&&ans[n-1]>0);if(active.length>=2)add('pair-'+r.items.join('-'),r.label,r.ask,active,'서로 다른 개념 확인');}
 const cues=units.filter(x=>x.priority==='우선 확인'&&![...prompts.filter(a=>a.severity==='문항 고점'||a.severity==='안전 우선').flatMap(a=>a.items)].includes(x.number));
 const sorted=[...prompts].sort((a,b)=>({ '안전 우선':0,'서술·척도 대조':1,'문항 고점':2,'서로 다른 개념 확인':3,'개념 구분':4,'확인':5})[a.severity]-({ '안전 우선':0,'서술·척도 대조':1,'문항 고점':2,'서로 다른 개념 확인':3,'개념 구분':4,'확인':5})[b.severity]);
 return {version:VERSION,officialScoreOwner:'YouthCriteria.evaluate',officialScoreUnchanged:true,items:units,domains,safety,safetyUnknown,unknownItems:unknown.map(x=>x.number),highItems:units.filter(x=>typeof x.value==='number'&&x.value>=3).map(x=>x.number),prompts:sorted,crossChecks:RELATED.filter(r=>r.items.filter(n=>ans[n-1]>0).length>=2),interpretiveLimit:'문항 0점은 이번 응답에서 어려움이 보고되지 않았다는 뜻이지 실제 위험 부재를 증명하지 않습니다. 1~4점의 간격은 임상적으로 등간 검증되지 않았으며, 점수의 합계는 전문가 사정이나 진단을 대신하지 않습니다.'};
}
function enrich(x,p){
 if(!x)return x;
 const a=assess(p,x.evidence82||null);
 const highHousing=p.answers[19]>=3;
 const housingPresent=!!x.evidence82?.topics?.housing?.length;
 const housingRow=(x.rows||[]).find(r=>r.id==='e82-housing'||r.id==='e82-score-housing');
 let rows=x.rows||[],added=false;
 if(highHousing&&!housingPresent&&!housingRow){
   const task={id:'scale821-q20',title:'20번 주거 고점 · 실제 어려움의 내용과 안전 확인',domains:[7],sourceGoals:['G-08'],positive:[20],unknown:[],narrative:false,safety:false,peak:p.answers[19],selected:true,scoreOnly:true,status:'척도 근거 확인 전 · 실행 협의 전',goal:'20번에서 응답한 주거 어려움의 유형·실제 영향과 필요한 보호·지원을 확인함.',action:'20번 고점의 근거를 학생에게 확인하고 거처의 안정성·실제 환경·현재 안전을 구분해 기록함. 체납·퇴거는 보고된 경우에만 추가 검토함.',teacher:'교내에서 확인한 학생의 주거 관련 학습·휴식·출결 영향을 기록하고 안전한 상담 경로를 마련함.',worker:'주거 문제의 실제 유형·현재 지원·이용 장벽을 확인하고 필요한 지역자원 문의·의뢰 여부를 협의함.',when:'첫 면담 시점 · 실제 일정 합의 전',measure:'실제 주거 어려움의 유형·시점·학생 생활 영향과 추가 확인 담당을 기록함.',baseline:'주거 문제 유형 및 생활 영향 미확인',references:[],sourceEvidence:[],rank:85};
   rows=[...rows]; const afterSafety=rows.findIndex(r=>!r.safety);rows.splice(afterSafety<0?rows.length:afterSafety,0,task);added=true;
 }
 const lead=rows.slice(0,3),others=rows.slice(3);let first=added&&lead.length?lead[0].action:x.first;if(!rows.length&&!x.safety){if(a.safetyUnknown.length)first='미상으로 남은 '+a.safetyUnknown.join('·')+'번 안전문항의 현재 상황·직접 안전확인 필요를 먼저 검토하고, 확인된 지원은 병행함.';else if(p.answers[19]>0)first='20번 주거 관련 응답의 구체적인 문제 유형·시점·생활 영향을 학생과 확인함. 보고되지 않은 체납·퇴거를 전제로 지원을 계획하지 않음.';else if(a.highItems.length)first='고점 '+a.highItems.join('·')+'번 문항에 해당하는 실제 장면·기간·학생의 도움 희망을 확인한 뒤 첫 조정 과제를 정함.';else first='학생에게 어떤 어려움과 변화 희망이 있는지 확인하고, 실제 생활 장면과 이미 받은 지원을 기록한 뒤 목표를 협의함.';}
 return {...x,rows,lead,others,first,scale821:a,scale821AppendedHousingReview:added};
}
function html(r){
 if(!r)return '';
 const e=escapeHTML,high=r.items.filter(x=>typeof x.value==='number'&&x.value>=3);
 return '<section class="formulation-section scale821" data-scale-version="8.2.1"><h3>척도 세부 분류·확인 근거 (V8.2.1)</h3><p>공식 점수·안전판정은 기존 25문항 CORE를 그대로 사용합니다. 아래는 중복 개념을 구분하기 위한 비채점 해석입니다.</p>'+
 '<p><strong>우선 확인할 문항:</strong> '+(high.map(x=>x.number+'번 '+e(x.concept)+'('+x.value+'점)').join(' · ')||'3~4점 응답 없음')+'</p>'+
 (r.safetyUnknown.length?'<p><strong>안전문항 미상:</strong> '+r.safetyUnknown.join('·')+'번 · 안전하다고 판단하지 않습니다.</p>':'')+
 (r.prompts.length?'<details open><summary>문항별 근거·개념 차이 확인 '+r.prompts.length+'건</summary><ol>'+r.prompts.slice(0,12).map(x=>'<li><strong>'+e(x.why)+'</strong> '+e(x.question)+'</li>').join('')+'</ol></details>':'<p>현재 추가 교차확인 규칙에 해당하는 사항이 없습니다.</p>')+
 '<details><summary>10개 영역별 해석과 분모 확인</summary><ul>'+r.domains.map(d=>'<li>'+e(d.name)+' · '+d.answered+'/'+(d.answered+d.missing)+'문항 확인 · '+(d.missing?'미상 포함: 가능한 영역합계 '+d.range[0]+'~'+d.range[1]:'영역합계 '+d.knownSum)+'/'+d.fullMax+' · '+(d.normalizedMean===null?'평균 확정 보류':'문항평균 '+d.normalizedMean.toFixed(2))+'</li>').join('')+'</ul></details><p>'+e(r.interpretiveLimit)+'</p></section>';
}
function text(r){if(!r)return '';return ['[척도 세부 분류·교차해석 V8.2.1]', '3~4점 문항: '+(r.highItems.join(', ')||'없음'),'안전문항 미상: '+(r.safetyUnknown.join(', ')||'없음'),...r.prompts.slice(0,12).map((p,i)=>(i+1)+'. '+p.why+' — '+p.question),r.interpretiveLimit].join('\n');}
return Object.freeze({VERSION,META,RELATED,DOMAIN_NAMES,DOMAIN_SIZES,assess,enrich,html,text});
});