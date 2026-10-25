/* OY-RALS V8.6 web adapter. CORE score and urgent result are read-only.
 * Case goals remain human-reviewed proposals, not diagnoses or service approvals.
 * Implements portable ICSI / K-CARR / ICMS / CaseState for existing site.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYUnifiedSiteV86=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='8.6.0-site';
const A=[
['보호자 위해·학대 의심','현재 안전한 위치·접촉·실제 보호 상태를 직접 확인','교내 보호책임자와 신고의무·안전한 귀가 및 연락 경로 검토','안전한 연락경로와 보호전문기관 후속 담당을 확인','현재 안전확인 일자·담당·실제 조치','safety'],
['방임 의심·보호 미제공','식사·치료·위생·보호 미제공의 실제 장면과 지속기간 확인','실제 돌봄·보호 공백과 학대 의심 시 법정 보호절차 구분','가정 생활 공백과 긴급 보호·생활지원 각각 검토','보호 미제공 내용·기간·후속 담당','safety'],
['또래 괴롭힘 피해','상대의 구체적 행동·시점·최근 접촉과 학교 안전 확인','학교 사안담당과 교실·등하교 보호 및 학생 의사 확인','학교 밖 피해지원·상담의 중복 없는 이용 조정','추가 접촉·피해 여부와 안전한 수업 참여','peer'],
['강요·협박·착취 피해','금품·성적 강요·협박의 유형과 현재 위협 확인','학생 보호·보복 방지와 적절한 신고절차 사안담당 협의','전문 피해보호 및 생활지원 필요·안전한 연락 확인','접촉 중단·보호조치 이행','peer'],
['타인 위해행동','학생의 실제 행동과 상대 학생의 피해 구분','피해학생 보호와 행동학생 교육·행동지원 각각 지정','행동 전후 가정·지역 조건 및 지원 자원 사정','학생 간 안전조치·행동 전후 기록','peer'],
['정서적 고통·기능 저하','최근 마음의 어려움과 수면·식사·수업 영향을 구체화','신뢰할 교내 담당과 상담·수업 조정 협의','일상 기능 및 상담·전문기관 접근 장벽 확인','학생 체감 부담과 일상 기능 변화','mental'],
['자해·죽음 관련 진술','학생의 현재 생각·계획·최근 행동·안전한 지원자와 긴급 필요 직접 확인','학교 위기대응·상담 담당과 긴급 보호·평가 절차 시행','안전한 연락·상담·의료 이용 및 실제 인계 담당 확인','현재 안전·전문평가·후속 인계 확인','safety'],
['현저한 수면·불안·혼란','평소와 다른 변화 시점·급성 건강위험·생활 저하 확인','수업 부담 조정과 급성 증상 시 의료 연계','수면·돌봄·전문평가 접근 장벽 확인','변화 기준선·진료 이용 여부','health'],
['지각·결석·등교 회피','지각·결석·조퇴 기록과 등교를 방해한 장면 확인','출결기록 대조 후 학교 안 등교지원 한 가지 시행','이동·돌봄·건강 등 교외 출결 장벽과 지원 조정','주간 출결기록과 학생의 등교 부담','attendance'],
['교과 학습·과제 어려움','어려운 교과·과제·설명 방식을 학생과 확인','설명·과제량·피드백 조정 한 가지를 시범 적용','학습공간·가정·지역 학습지원 접근을 조정','해당 과제의 수행과 이해 변화','learning'],
['학교 소속감·학업 지속','학생이 느끼는 학교 소속감과 지속 희망 확인','관계·교실 참여 선택지를 학생 의사에 따라 협의','진로·학교 밖 지지 및 활동 참여 조건 조정','학교생활 소속감·참여 희망 변화','school'],
['위험 충동·파손 행동','행동 전후 장면과 실제 다칠 위험 확인','안전조치와 비처벌적 행동지원 계획 구분','가정·지역 자극요인과 휴식·지원 가능성 확인','실제 위해·행동 전후 기록·조정 여부','behavior'],
['물질 사용·건강 위해','음주·흡연·약물 오용을 나누고 급성 신체증상 확인','응급상황 우선 대응과 이후 상담·건강지원 연결','의료·상담 이용 및 안전한 보호환경 확인','급성 위험·실제 이용·일상 기능','health'],
['감각·주의·의사소통 환경','진단명 아닌 교실 환경과 설명의 접근성 확인','좌석·소음·설명·자료 중 조정 한 가지 시험','교실 밖 접근 장벽과 필요한 자원 조정','실제 환경조정과 수업 참여 변화','access'],
['보조기기·지원서비스','필요한 기기·발달지원과 이용하지 못한 사유 확인','학교 내 편의·기기·담당부서 협의','접수·대기·제공·비용·이동을 각각 사정','필요 서비스의 실제 이용 여부','access'],
['돌봄·식사·생활관리 공백','돌봄·식사가 비는 요일·시간과 대체 제공 확인','급식·방과후·안전한 성인 연결 가능성 점검','가구 생활일과와 지역 돌봄·식사 제공 조정','공백 발생 빈도와 실제 제공 여부','care'],
['가족 갈등·양육 부담','갈등의 구체 장면·생활 영향·학대 의심 구분','학생의 안전한 대화 공간과 보호자 협의 적절성 검토','가족 상담과 양육 부담 조정에 학생 의견 반영','정서·학교생활 부담과 조정 경험','family'],
['과중한 가족돌봄 책임','돌보는 대상·시간과 휴식·학습 영향 확인','학생의 학습·출결 조정 및 휴식시간 보호','대체 돌봄·가족지원과 역할분담 협의','돌봄시간·휴식·과제 참여 변화','care'],
['식품·의복·준비물 부족','부족한 품목·빈도와 이미 받는 지원 확인','급식·준비물 지원의 접근성과 낙인 방지 조정','필수자원 제공 상태·중복·이용 장벽 확인','필요 품목 제공일·남은 공백','basic'],
['주거 불안정·환경 안전','거처·안전·환경 중 실제 문제를 구분하고, 체납·퇴거는 보고된 경우에만 확인','학교 내 수업·휴식·등교 영향과 임시 조정 검토','주거안전·행정복지센터 상담·지원 요건 및 실제 제공 확인','주거문제 유형·현재 안전·연계 단계','housing'],
['비용으로 인한 서비스 이용 제한','비용으로 받지 못한 치료·교육·생활 서비스를 특정','교내 지원 가능성과 서비스 필요·학생 희망 확인','이용자격·비용 장벽·실제 지원 범위 확인','지연된 서비스 이용 및 부담 변화','basic'],
['원하는 관계·활동 참여 장벽','학생이 원하는 활동과 참여가 어려운 조건 확인','부담 적은 안전 공간·또래활동 학생과 협의','학생 희망을 반영한 지역활동 참여 지원','실제 활동 참여·학생 체감 변화','relation'],
['신뢰할 어른·도움 부족','학생이 도움 요청할 사람·연락 방법 확인','교내 신뢰할 담당 1명과 접근 경로 지정','지속적 지역 지원자·기관 회신체계 확인','연락 대상과 실제 도움 접근','support'],
['디지털 이용조절·일상저하','디지털 이용으로 인한 수면·학습·관계 영향 확인','학생 동의 아래 수면·수업 조정 목표 한 가지 협의','일상 환경과 보호자 협력·지원 가능성 확인','수면·활동·기능 변화','digital'],
['온라인 성적 강요·착취','온라인 성적 요구·유포 위협의 현재 접촉과 학생의 안전 확인','피해 보호·신고·증거 취급과 교내 보복 방지 검토','전문 피해보호기관과 안전한 인계·생활지원 확인','피해 접촉·보호조치·안전 인계','safety']
];
const SIZES=[2,3,3,3,2,2,3,3,2,2],SAFE=new Set([1,2,7,25]);
const RULES=[
{kind:'family_harm',rx:/(?:보호자.{0,24}(?:때렸|때린|폭력|폭행|구타)|(?:어머니|아버지|엄마|아빠|부모|집에서).{0,22}(?:맞았|폭행|학대)|가정폭력|아동학대|학대|방임)/,item:1,safe:true},
{kind:'self_harm',rx:/(?:자해|자살|죽고\s*싶|살고\s*싶지|손목.{0,8}흔적)/,item:7,safe:true},
{kind:'peer_harm',rx:/(?:학교폭력|왕따|따돌림|괴롭힘|단톡방.{0,25}(?:조롱|협박)|복도에서\s*밀쳤|친구.{0,14}(?:밀쳤|때렸|폭행))/,item:3,safe:false},
{kind:'online_coercion',rx:/(?:성착취|온라인.{0,20}협박|성적\s*(?:사진|영상|자료).{0,30}(?:유포|협박)|사진.{0,18}유포\s*협박)/,item:25,safe:true},
{kind:'housing',rx:/(?:퇴거|체납|월세.{0,10}밀|보증금.{0,8}문제|주거.{0,12}(?:불안|위험|환경))/,item:20},
{kind:'meal_gap',rx:/(?:결식|끼니.{0,10}(?:거르|못)|식사.{0,16}(?:못\s*(?:챙|먹)|공백|부족)|밥.{0,12}못\s*먹)/,item:16},
{kind:'care_burden',rx:/(?:동생.{0,18}(?:돌보|책임|챙기)|가족.{0,16}간병|돌봄을\s*도맡|학생이.{0,20}돌봄)/,item:18},
{kind:'learning',rx:/(?:수학|영어|교과|학습|공부|과제|숙제|수업).{0,25}(?:어려|못|이해|힘들|부담|부진)/,item:10},
{kind:'attendance',rx:/(?:결석|지각|조퇴|등교.{0,6}(?:회피|거부|어려|못))/,item:9},
{kind:'peer_conflict',rx:/(?:친구.{0,23}(?:갈등|위축|다툼|소외)|관계.{0,18}(?:갈등|위축|어려))/,item:22},
{kind:'family_conflict',rx:/(?:보호자|가족|부모|어머니|아버지).{0,28}(?:갈등|다투|진로\s*문제)|가족갈등/,item:17},
{kind:'mood',rx:/(?:우울|불안|무기력|불면|수면.{0,10}어려)/,item:6},
{kind:'access',rx:/(?:교실\s*소음|개별\s*설명|시청각\s*접근|교육환경\s*조정)/,item:14},
{kind:'economic',rx:/(?:경제적\s*어려움|생활비.{0,12}(?:부족|어려)|비용.{0,12}(?:못|포기|부담))/,item:21}
];
const clean=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textOf=p=>typeof p.caseContext==='string'?p.caseContext:p.caseContext?.text||'';
function status(part,rx){
 const pos=part.search(rx);if(pos<0)return null;const after=part.slice(pos).slice(0,105),before=part.slice(Math.max(0,pos-38),pos);
 if(/(?:예방교육|예방\s*교육|훈련용|가상사례|가정한\s*사례|가상의|만약|교직원\s*연수)/.test(part))return 'hypothetical';
 if(/(?:피해|학대|폭력|자해|사건|발생|진술|신고|현재\s*안전)\s*(?:사실|유무|여부)?.{0,9}(?:미확인|알\s*수\s*없|불분명)|(?:피해|발생)\s*여부.{0,8}(?:모름|미확인)/.test(after.slice(0,60))&&!/(?:때렸다고|맞았다고|죽고\s*싶다고|흔적이\s*있|당했다고)/.test(part))return 'uncertain';
 if(/(?:없었|없다|없음|없다고|없어|않았|않는다|발생하지\s*않|받은\s*적\s*없|당한\s*적\s*없|아니라고|부인)/.test(after.slice(0,60))&& !/(?:없어서|없어\s*어렵|미제공|없으므로\s*부족)/.test(after.slice(0,60)))return 'negated';
 if(/(?:당한\s*적\s*없|발생하지\s*않|없다고)/.test(before.slice(-24)+after.slice(0,65)))return 'negated';
 return 'affirmed';
}
function evidence(p){
 const raw=textOf(p),segments=raw.split(/(?<=[.!?。])\s*|[\n;]+|\s+(?:하지만|그러나|반면|다만|그런데)\s+/).map(x=>x.trim()).filter(Boolean).slice(0,160);
 const out=[];
 for(let i=0;i<segments.length;i++)for(const r of RULES){const st=status(segments[i],r.rx);if(!st)continue;out.push({id:'E'+(out.length+1),kind:r.kind,item:r.item,polarity:st,text:segments[i],source:'입력 서술 · 사실 확인 전'});}
 const strengths=[...new Set(segments.filter(x=>/관심|좋아|강점|희망|잘하/.test(x)).flatMap(x=>x.match(/미술|음악|그림|운동|축구|과학|코딩|사진|독서|춤|요리|농구/g)||[]))];
 const services=segments.filter(x=>/(?:복지관|센터|사업|프로그램)/.test(x)&&/(?:참여\s*중|이용\s*중|지원받|지원\s*받|참여하고|이용하고)/.test(x)&&!/(?:미이용|참여하지|이용하지|않|없)/.test(x));
 const family=[...new Set(segments.flatMap(x=>(x.match(/어머님|어머니|아버지|아빠|엄마|성인\s*오빠|오빠|동생|할머니|할아버지/g)||[])))];
 const grade=raw.match(/중학교\s*([1-3])\s*학년|중\s*([1-3])/);
 const facts=out.filter(x=>x.polarity==='affirmed'&&!['family_harm','self_harm','peer_harm','online_coercion'].includes(x.kind)).map(x=>x.text);
 return {sourceSegments:segments,evidence:out,strengths,services,family,grade:grade?(grade[1]||grade[2]):null,facts:[...new Set(facts)].slice(0,12),narrativePresent:!!raw.trim()};
}
function build(base,p,options={}){
 if(!base||!p||!Array.isArray(p.answers)||p.answers.length!==25)return base;
 const ans=p.answers,raw=textOf(p),E=evidence(p);
 const official=base.decision;
 const credible=E.evidence.filter(x=>x.polarity==='affirmed'),uncertain=E.evidence.filter(x=>x.polarity==='uncertain');
 const disputes=[],byItem=n=>credible.filter(x=>x.item===n);
 for(let i=1;i<=25;i++){const value=ans[i-1],has=byItem(i).length;
  if(value==='unknown')disputes.push({id:'U'+i,item:i,question:i+'번은 미상이므로 직접 안전·생활 장면을 확인합니다. 0점으로 처리하지 않습니다.'});
  if(value===0&&has)disputes.push({id:'C'+i,item:i,question:i+'번 0점과 입력 서술의 상황이 다릅니다. 실제 장면·시점·정보원을 대조합니다.'});
  if(typeof value==='number'&&value>=3&&!has)disputes.push({id:'B'+i,item:i,question:i+'번 '+value+'점의 구체적 장면·빈도·기간과 근거는 무엇인가요?'});
  if(value>0&&E.evidence.some(x=>x.item===i&&x.polarity==='negated')&&!has)disputes.push({id:'N'+i,item:i,question:i+'번 양성 응답과 부정 서술의 시점과 출처를 확인합니다.'});
 }
 const scored=ans.map((v,i)=>({i:i+1,v})).filter(o=>typeof o.v==='number'&&o.v>0).map(o=>({id:'Q'+String(o.i).padStart(2,'0'),item:o.i,score:o.v,scope:byItem(o.i).length?'reported-context-review':'score-only-verification'}));
 const narrativeSafety=credible.filter(x=>['family_harm','self_harm','peer_harm','online_coercion'].includes(x.kind));
 const links={family_harm:1,self_harm:7,peer_harm:3,online_coercion:25};
 for(const ev of narrativeSafety){const i=links[ev.kind];if(!scored.some(g=>g.item===i))scored.push({id:'NARRATIVE-Q'+String(i).padStart(2,'0'),item:i,score:null,scope:'reported-event-score-conflict'});}
 if(uncertain.some(x=>['family_harm','self_harm','peer_harm','online_coercion'].includes(x.kind))&&!scored.some(g=>g.id==='NARRATIVE-SAFETY-UNCERTAIN'))scored.push({id:'NARRATIVE-SAFETY-UNCERTAIN',item:null,score:null,scope:'uncertain-review-not-affirmed'});
 const priority=g=>g.item===null?0:SAFE.has(g.item)?0:g.id.startsWith('NARRATIVE-')?1:g.score===4?2:g.score===3?3:g.score===2?4:5;
 scored.sort((a,b)=>priority(a)-priority(b)||(b.score||0)-(a.score||0)||String(a.id).localeCompare(String(b.id)));
 const rows=scored.map((g,i)=>{
  const n=g.item,s=n?A[n-1]:null,sp=s||['안전 관련 정보 미확인','안전 관련 전언·신고·직접 피해 진술을 구별하고 현재 안전과 실제 보호를 확인','학교 보호담당과 현재 안전·신고의무 절차 확인','정보 출처·연락 안전성과 보호기관 연계를 확인','정보 출처·현재 안전·실제 조치 확인','safety'];
  const ids=n?byItem(n).map(x=>x.id):uncertain.map(x=>x.id);
  return {id:'v86-'+g.id,canonicalId:g.id,title:sp[0]+(g.scope==='score-only-verification'?' · 척도 근거 확인':g.scope==='reported-event-score-conflict'?' · 서술·척도 불일치 확인':''),domains:n?[Math.max(0,SIZES.findIndex((_,di)=>{let k=0;for(let j=0;j<di;j++)k+=SIZES[j];return n>k&&n<=k+SIZES[di]}))]:[],goal:g.scope==='score-only-verification'?'직접 근거 확인 후 필요한 지원을 협의':'보고된 사건·생활상의 영향과 학생이 바라는 변화를 확인',action:sp[1],teacher:sp[2],worker:sp[3],measure:sp[4],when:priority(g)===0?'현재 안전 우선 확인':'첫 면담에서 기준선 확인 후 담당·일정 협의',meaning:'기존 CORE를 유지한 문항별·서술별 실무 검토안',sourceGoals:n?['G-'+String(n).padStart(2,'0')]:[],sourceEvidence:ids,positive:n&&g.score>0?[n]:[],unknown:n&&g.score==='unknown'?[n]:[],peak:g.score||0,narrative:g.scope!=='score-only-verification',safety:priority(g)===0,selected:true,rank:scored.length-i,status:'실무자 협의 전 · 실행 미확인',baseline:'횟수·기간·학생 희망 미확인',references:[]};
 });
 const safety=!!official.urgent||narrativeSafety.some(x=>[1,7,25].includes(links[x.kind]))||uncertain.some(x=>[1,7,25].includes(links[x.kind]));
 const findings=E.grade?'중학교 '+E.grade+'학년 학생으로 서술됨. ':'';
 const facts=E.facts.slice(0,8).map(x=>x.replace(/[.!?。]$/,'')).join('. ');
 const summary=(findings+(facts?facts+'. ':'')+(E.family.length?'가족관계로 '+E.family.join('·')+'가 언급됨. ':'')+(E.services.length?'기존 지원·참여가 보고되며 실제 제공 여부는 별도 확인 필요. ':'')).trim();
 const strengths=E.strengths.map(x=>x+'에 대한 관심이 보고됨. 학생이 원하면 개입 과정의 강점으로 활용할 수 있음.');
 const section=[{title:'학생의 상황과 보고 내용',text:summary||'서술형 자료가 입력되지 않아 25문항 근거와 학생 희망을 면담으로 확인해야 함.'},
 {title:'척도와 서술의 대조',text:disputes.length?disputes.slice(0,5).map(x=>x.question).join(' '):'구조화된 범위에서 직접 상충하는 문항은 발견되지 않았으나 실제 사실 확인은 필요함.'},
 {title:'강점과 기존 지원',text:[...strengths,...E.services.map(x=>x+' (참여 보고·제공 확인 전)')].join(' ')||'아직 구체적인 강점 또는 이용서비스가 확인되지 않아 학생에게 직접 확인이 필요함.'}];
 const judgement=rows.length?'우선 검토할 사항은 '+rows.slice(0,3).map(r=>r.title).join(' / ')+'임. 개입순서는 안전·실제 위해를 우선하며, 문항별 근거와 학생 희망을 확인한 뒤 담당·목표·점검시점을 협의함.':'현재 입력에서는 개입 수준을 자동 확정할 수 없음. 학생의 희망·강점과 생활상의 변화를 면담에서 확인함.';
 const role=options.role||'social-worker';
 const goals=rows.map(r=>({id:r.canonicalId,concept:r.title,goal:r.goal,action:r.action,teacher:r.teacher,worker:r.worker,verification:r.measure,sourceEvidence:r.sourceEvidence}));
 const documents=Object.fromEntries(['assessment','plan','conference','intake','needs'].map(k=>[k,{kind:k,goalIds:goals.map(g=>g.id),reviewStatus:'검토·협의 전 초안'}]));
 const canonical={schema:'OY-RALS.CaseState.V8.6',version:VERSION,core:{officialDecision:official,unchanged:true,answers:ans.slice()},ICSI:{discrepancies:disputes,scoreModification:false},'K-CARR':{evidence:E.evidence,family:E.family,strengths:E.strengths,existingSupport:E.services},ICMS:{goals},documents,safety:{officialCORE:!!official.urgent,narrativeReported:narrativeSafety.length>0,uncertain:uncertain.length>0,reviewRequired:safety},reviewPending:true};
 const filtered=(options.forPlan&&Array.isArray(p.includedDomains))?rows.filter(r=>r.safety||!r.domains.length||r.domains.some(di=>p.includedDomains.includes(di))):rows;
 return {...base,version:'8.6-integrated',source:'Official CORE unchanged / ICSI·K-CARR·ICMS V8.6 web adapter',canonical86:canonical,sections82:section,paragraphs:section.map(x=>x.text),judgement,understanding:judgement,first:filtered[0]?.action||'학생이 원하는 변화와 일상에서 겪는 어려움을 확인함.',rows:filtered,lead:filtered.slice(0,3),others:filtered.slice(3),strengths,pending:disputes.slice(0,8).map(x=>x.question),safety,safetyReviewRequired:safety,v8:{...(base.v8||{}),version:'8.6',narrativeSafety:narrativeSafety.length>0,questions:disputes.map(x=>x.question)}};
}
function html(x){const section=(t,body)=>'<section class="formulation-section"><h3>'+clean(t)+'</h3>'+body+'</section>';return section('종합 사정 · 학생의 상황',x.sections82.map(s=>'<h4>'+clean(s.title)+'</h4><p>'+clean(s.text)+'</p>').join('')+'<p class="formulation-judgement"><strong>'+clean(x.judgement)+'</strong></p>')+section('우선 검토할 개입과제',x.lead.map((r,i)=>'<article class="formulation-priority"><h4>'+(i+1)+'. '+clean(r.title)+'</h4><dl><div><dt>학생에게 필요한 변화</dt><dd>'+clean(r.goal)+'</dd></div><div><dt>첫 행동</dt><dd>'+clean(r.action)+'</dd></div><div><dt>교사·학교</dt><dd>'+clean(r.teacher)+'</dd></div><div><dt>사회복지사·지역</dt><dd>'+clean(r.worker)+'</dd></div><div><dt>점검</dt><dd>'+clean(r.measure)+'</dd></div></dl></article>').join('')+(x.others.length?'<details><summary>나머지 과제 '+x.others.length+'개 확인</summary><ul>'+x.others.map(r=>'<li><strong>'+clean(r.title)+'</strong> · '+clean(r.action)+'</li>').join('')+'</ul></details>':''))+ '<details class="formulation-section"><summary>원문 근거·문항별 대조 상세</summary><ol>'+x.canonical86['K-CARR'].evidence.map(v=>'<li>'+clean(v.id+' ['+v.polarity+'] '+v.text)+'</li>').join('')+'</ol><h4>추가 확인</h4><ul>'+x.pending.map(q=>'<li>'+clean(q)+'</li>').join('')+'</ul></details><p class="formulation-section">본 결과는 실무자 검토 전 초안입니다. 사건·신고·진단·서비스 제공이나 학생의 동의를 확정하지 않습니다.</p>';}
function text(x){return '[V8.6 통합사정 초안]\n'+x.sections82.map(s=>s.title+'\n'+s.text).join('\n\n')+'\n\n종합판단\n'+x.judgement+'\n\n'+x.rows.map((r,i)=>(i+1)+'. '+r.title+'\n목표: '+r.goal+'\n첫 행동: '+r.action+'\n교사: '+r.teacher+'\n사회복지사: '+r.worker+'\n점검: '+r.measure).join('\n\n')+'\n\n※ 실제 면담·안전조치·서비스 제공 여부는 담당자가 확인해야 함.';}
return Object.freeze({VERSION,A,RULES,evidence,build,html,text});
});