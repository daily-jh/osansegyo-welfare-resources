/* OY-RALS V8.2 | privacy-first Korean evidence extractor (no network). */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYEvidenceBaseV86=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='8.2.0';
const safe=x=>String(x==null?'':x).slice(0,20000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' ');
const redact=x=>safe(x).replace(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g,'[전화번호]').replace(/\b\d{6}[-\s]?[1-8]\d{6}\b/g,'[식별번호]').replace(/[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[이메일]').replace(/https?:\/\/\S+/gi,'[링크]');
const RULES=[
 ['family_form','가구 유형',/한\s*부모\s*(?:가정|가족|가구)?|조손\s*(?:가정|가구)|다문화\s*(?:가정|가구)|가정위탁|시설보호/g,[16,17]],
 ['learning','학습 어려움',/(?:교과|국어|수학|영어|과목|공부|학습|과제|숙제|수업\s*이해).{0,22}(?:어려|어렵|힘들|부진|못\s*따라|부담|제출\s*못|늦게\s*제출)|(?:학습|공부|과제).{0,12}(?:뒤처지|어려움|어렵)/g,[10]],
 ['attendance','출결·참여 어려움',/(?:결석|지각|조퇴|등교\s*(?:거부|회피)|등교가\s*어려|수업을\s*빠지|학교에\s*못\s*가)/g,[9]],
 ['peer_conflict','친구 갈등',/(?:친구|또래|반\s*친구|동급생|관계).{0,28}(?:갈등|다툼|서먹|어색|멀어|위축|잘\s*어울리지\s*못|소외)|(?:친구|또래).{0,14}(?:관계가\s*어렵|관계\s*어려움)/g,[3,22]],
 ['peer_harm','또래 피해 단서',/(?:왕따|따돌림|학교폭력|학폭)|(?:반\s*친구|친구들|또래|단톡방|같은\s*반\s*학생들?).{0,45}(?:욕설|조롱|밀치|때리|괴롭|협박|갈취|강요)|(?:복도에서|학교에서).{0,18}(?:밀쳤|때렸|괴롭혔)|(?:같은\s*반\s*학생들?).{0,50}(?:금품|협박|괴롭|갈취)/g,[3,4]],
 ['meal_gap','식사 공백',/(?:식사|끼니|밥|저녁|아침).{0,26}(?:못\s*챙|거르|거른|부족|제대로\s*못|혼자\s*먹|불규칙|먹지\s*못)|(?:먹지\s*못|제대로\s*못\s*먹|식사를\s*거른|결식|끼니를\s*거)/g,[16,19]],
 ['care_burden','가족돌봄 부담',/(?:동생|형제|가족|부모|할머|할아).{0,26}(?:돌보|챙기|간병|부양|보살피)|(?:간병|돌봄).{0,14}(?:부담|책임|시간\s*부족)/g,[18]],
 ['parent_work','보호자 근로·양육 부담',/(?:어머니|어머님|엄마|아버지|아버님|아빠|보호자).{0,24}(?:야간\s*근로|일과\s*양육|근로|일을\s*하|직장|생계|양육을\s*병행|교대\s*근무)|(?:근로|일).{0,18}(?:양육|돌봄)\s*(?:병행|부담)/g,[16,17]],
 ['economic','경제적 어려움',/(?:경제적?\s*(?:어려움|부담|곤란)|생활비\s*(?:부족|부담)|생계\s*(?:곤란|어려움)|소득\s*불안정|경제적인\s*어려움)/g,[19,21]],
 ['housing_arrears','주거 체납',/(?:월세|임대료|관리비|주거비).{0,16}(?:체납|밀렸|연체)|(?:퇴거\s*(?:통보|위기|위험)|거주지\s*상실)/g,[20]],
 ['housing_concern','주거 어려움',/(?:주거|집|거주지).{0,18}(?:불안정|열악|걱정|위험|안전\s*문제)/g,[20]],
 ['mood','정서적 어려움',/(?:우울|불안|무기력|불면|잠을\s*못\s*자|정서적\s*어려움|마음이\s*힘들)/g,[6,8]],
 ['self_harm','자해·자살 표현',/(?:자해|자살|죽고\s*싶|살고\s*싶지|스스로\s*다치|자신을\s*해치)/g,[7]],
 ['family_harm','보호자 위해',/(?:보호자|어머니|엄마|아버지|아빠|부모|가정|집에서).{0,26}(?:학대|폭력|폭행|구타|때렸|때린|때리|맞았)|(?:집에서|귀가\s*후).{0,15}(?:맞|폭행)|방임\s*(?:의심|정황|신호)/g,[1,2]],
 ['online_coercion','온라인 강요·협박',/(?:온라인|채팅|단톡방|SNS|메신저).{0,34}(?:협박|강요|유포|갈취|성적\s*요구)|(?:사진|영상).{0,22}(?:유포|협박)/g,[3,4,25]],
 ['adhd_report','ADHD 관련 보고',/(?:ADHD|주의력\s*결핍).{0,30}(?:진단|복용|약)|(?:ADHD|주의력\s*결핍)\s*(?:있음|임|보고)/gi,[14]],
 ['medication','진료·복약 관련 보고',/(?:진료|치료|처방|약물|복약|약\s*복용).{0,22}(?:받|중|다니|복용|하고|있음)|(?:약을|약물).{0,12}(?:먹고|복용)/g,[12,14]],
 ['school_access','교육환경 조정',/(?:소음|교실\s*환경|자리|좌석|과제\s*분할|짧게\s*설명).{0,22}(?:어렵|불편|조정|개선|수월|도움)|(?:조용한\s*자리|쉬는\s*시간|설명\s*방식)/g,[14]],
 ['support_person','지지관계',/(?:믿을\s*(?:수\s*있는\s*)?어른|신뢰하는\s*(?:교사|사람|친구)|도움\s*(?:요청|청할)|의지할\s*(?:사람|친구))/g,[23]]
];
const NEG_HARM=/(?:없|아니|부인|보고되지|확인되지|받은\s*적\s*없|한\s*적\s*없)/;
const NEG_MED=/(?:없|아니|부인|받은\s*적\s*없|하지\s*않|않는다|미복용|중단|없다)/;
const HYPOTHETICAL=/(?:만약|가정하면|가상의|예시|예방\s*교육|예방교육|모의\s*연습|매뉴얼|연수용)/;
const TIMEPAST=/(?:과거|작년|지난\s*(?:학기|주|달)|예전|이전에)/;
const UNCERTAIN=/(?:미확인|확인되지\s*않|가능성|의심|전언|소문|추정|확인\s*필요|~인\s*것\s*같)/;
function fragments(s){
 const spans=[],sep=/[.!?。\n;]+|(?:하지만|그러나|그렇지만|반면|그런데|다만|한편)(?=\s)/g;
 let st=0,m;while((m=sep.exec(s))){if(m.index>st)spans.push([st,m.index]);st=sep.lastIndex;}if(st<s.length)spans.push([st,s.length]);
 return spans.map(([start,end])=>({start,end,text:s.slice(start,end).trim()})).filter(x=>x.text);
}
function within(s,at,n=75){const left=Math.max(0,at-n),right=Math.min(s.length,at+n);return s.slice(left,right);}
function sentenceAt(raw,start,end){
 const b=Math.max(raw.lastIndexOf('.',start-1),raw.lastIndexOf('。',start-1),raw.lastIndexOf('!',start-1),raw.lastIndexOf('?',start-1),raw.lastIndexOf('\n',start-1));
 let n=raw.slice(end).search(/[.!?。\n;]/);if(n<0)n=raw.length-end;
 return {sentence:raw.slice(b+1,end+n),prefix:raw.slice(b+1,start),suffix:raw.slice(end,end+n)};
}
function polarityFor(raw,match,type,end){
 const {sentence,prefix,suffix}=sentenceAt(raw,match.index,end||match.index+10);
 if(HYPOTHETICAL.test(prefix)||HYPOTHETICAL.test(sentence.slice(0,50)))return 'hypothetical';
 const block=raw.slice(match.index,(end||match.index+10))+suffix;
 // Per-claim negation; an unrelated "protective action was not confirmed" must not negate the actual reported event.
 if(type==='family_harm'||type==='peer_harm'||type==='self_harm'||type==='online_coercion'){
  if(/(?:보호조치|신고|상태|현재|안전|위험|접촉).{0,18}(?:확인되지|미확인)/.test(block)&&!/(?:피해|폭력|학대|맞았|자해|유포|협박).{0,12}(?:없|안\s*했|않았|부인)/.test(block))return 'affirmed';
  if(/(?:폭력|폭행|방임|학대|자해|자살|죽고\s*싶|왕따|학교폭력|괴롭힘|협박|성착취|유포|맞은|때린).{0,32}(?:없었|없다|없음|없다고|없어|아니|부인|보고되지|받은\s*적\s*없|한\s*적\s*없|않았)/.test(sentence))return 'negated';
  if(/(?:실제\s*피해|피해\s*경험).{0,15}(?:없|않)/.test(sentence))return 'negated';
 }
 if((type==='adhd_report'||type==='medication')&&/(?:진단|ADHD|약물|복용).{0,30}(?:없|않|아니|받은\s*적\s*없|미복용)/.test(sentence))return 'negated';
 if(type==='housing_arrears'&&/(?:체납|퇴거).{0,25}(?:없|받지\s*않|아니)/.test(sentence))return 'negated';
 const local=raw.slice(match.index,(end||match.index+10))+suffix.slice(0,18);
 if(UNCERTAIN.test(local)&&!/(?:자해|죽고\s*싶|맞았|때렸|폭행).{0,20}(?:말|진술|확인)/.test(local))return 'uncertain';
 return 'affirmed';
}
function speaker(text){if(/(?:교사|담임|학교).{0,22}(?:관찰|확인|기록)/.test(text))return 'teacher';if(/(?:어머님|어머니|보호자).{0,18}(?:말|설명|보고)/.test(text))return 'caregiver';if(/(?:학생|당사자|본인).{0,18}(?:말|보고|진술|설명)/.test(text))return 'student';return 'unspecified';}
function pushEvidence(entries,raw,kind,label,start,end,items=[],options={}){
 if(!Number.isInteger(start)||start<0)return;
 const matchText=raw.slice(start,end),ctx=within(raw,start,55),polarity=options.polarity||polarityFor(raw,{index:start},kind,end);
 const key=kind+':'+start+':'+end;if(entries.some(x=>x.dedupeKey===key))return;
 entries.push({id:'',kind,label,start,end,excerpt:redact(matchText).slice(0,200),context:redact(ctx).slice(0,200),polarity,time:TIMEPAST.test(ctx)?'historical':/현재|최근|요즘|지금|오늘/.test(ctx)?'recent_or_current':'unspecified',speaker:speaker(ctx),source:'user-entered-unverified',linked_items:items,dedupeKey:key});
}
function findAll(re,raw,fn){let m;re.lastIndex=0;while((m=re.exec(raw))){fn(m);if(m[0].length===0)re.lastIndex++;}}
function extract(input){const raw=safe(typeof input==='string'?input:input?.caseContext??input?.narrative??'');const evidence=[];
 for(const [kind,label,re,items] of RULES)findAll(re,raw,m=>pushEvidence(evidence,raw,kind,label,m.index,m.index+m[0].length,items));
 const info={grade:null,gender:null,household:null,people:[],strengths:[],services:[]};
 const grade=raw.match(/(?:중\s*학교|중학생|중등)\s*(?:(?:제)?\s*)?(1|2|3|일|이|삼|한|두|세)\s*학년|중\s*(1|2|3)\b/);if(grade){const n=grade[1]||grade[2];info.grade=({'일':1,'한':1,'이':2,'두':2,'삼':3,'세':3})[n]||Number(n);pushEvidence(evidence,raw,'grade','학년',grade.index,grade.index+grade[0].length);}
 const sex=raw.match(/여학생|남학생|여자\s*(?:아이|학생)|남자\s*(?:아이|학생)/);if(sex){info.gender=/^여/.test(sex[0])?'여학생':'남학생';pushEvidence(evidence,raw,'gender','학생 성별',sex.index,sex.index+sex[0].length);}
 const family=raw.match(/한\s*부모\s*(?:가정|가족|가구)?|조손\s*(?:가정|가구)|다문화\s*(?:가정|가구)|가정위탁|시설보호/);if(family){info.household=family[0].replace(/\s+/g,'');}
 const kin=[['어머니',/(?:어머님|어머니|엄마|모친)/g],['아버지',/(?:아버님|아버지|아빠|부친)/g],['오빠',/(?:성인\s*)?오빠/g],['언니',/(?:성인\s*)?언니/g],['형',/(?:성인\s*)?형\b/g],['누나',/(?:성인\s*)?누나/g],['동생',/(?:남동생|여동생|동생)/g],['할머니',/(?:할머님|할머니|조모)/g],['할아버지',/(?:할아버님|할아버지|조부)/g]];
 for(const [relation,re]of kin)findAll(re,raw,m=>{const ctx=within(raw,m.index,30);if(/(?:없|사망|만약|예시)/.test(raw.slice(m.index,m.index+18)))return;const id='P'+(info.people.length+1);if(info.people.some(x=>x.relation===relation))return;info.people.push({id,relation,adult:/성인/.test(m[0]),cohabitation:/함께\s*(?:살|생활|거주)|동거/.test(ctx)?'reported':'unknown',evidence_span:[m.index,m.index+m[0].length]});pushEvidence(evidence,raw,'kin','가족관계',m.index,m.index+m[0].length);});
 const strong=[['미술',/(?:미술|그림\s*그리기|드로잉|만화).{0,22}(?:관심|좋아|잘하|희망|재미|즐기)|(?:관심|좋아|잘하).{0,14}(?:미술|그림)/g],['음악',/(?:음악|노래|악기).{0,18}(?:관심|좋아|잘하|희망)/g],['운동',/(?:축구|농구|운동|수영).{0,18}(?:관심|좋아|잘하|희망)/g],['조립·로봇',/(?:로봇|만들기|조립|코딩).{0,18}(?:관심|좋아|잘하|희망)/g],['도움 요청',/(?:도움|상담|지지).{0,18}(?:받고\s*싶|요청|원하|희망)/g]];
 for(const [name,re]of strong)findAll(re,raw,m=>{if(!info.strengths.some(x=>x.name===name))info.strengths.push({id:'ST'+(info.strengths.length+1),name,evidence_span:[m.index,m.index+m[0].length],status:'reported_unverified'});pushEvidence(evidence,raw,'strength','강점·희망',m.index,m.index+m[0].length);});
 // Support both spaced and unspaced institution names and participation phrasing.
 // Institution and programme states are extracted together. Never treat the funder as a separate provider.
 const inst=/(?:[가-힣A-Za-z0-9·]{1,20}\s*){0,4}(?:종합\s*사회\s*복지관|사회\s*복지관|청소년\s*상담\s*복지센터|지역\s*아동센터|드림스타트|Wee\s*센터|상담센터|복지관|월드비전)/g;
 const serviceHits=[];findAll(inst,raw,m=>{
  let full=m[0].trim().replace(/^(?:현재|지금|학생은|당사자는|에서\s*)/,'');
  // Extra leading prose can be swallowed in unpunctuated transcriptions; truncate at discourse boundaries.
  full=full.split(/(?:현재|지금|그동안|다니고|먹음|먹고|아이는|학생은|에서는|받고)/).slice(-1)[0].trim();
  full=full.replace(/^(?:에\s*|에서\s*|의\s*)/,'').trim();
  const m0=full.match(/([가-힣A-Za-z0-9·]{2,15}\s*)?(?:종합\s*사회\s*복지관|사회\s*복지관|청소년\s*상담\s*복지센터|지역\s*아동센터|드림스타트|Wee\s*센터|상담센터|복지관)$/);
  if(m0)full=m0[0].trim();
  else if(/월드비전/.test(full))full='월드비전';
  const near=raw.slice(m.index,Math.min(raw.length,m.index+145));
  const mstatus=near.match(/(?:참여\s*중|이용\s*중|다니고|지원\s*받|참여하고|프로그램에\s*참여|개입\s*중|신청|대기|종결|종료|중단)/);
  if(!mstatus)return;
  const status=/종결|종료|중단/.test(mstatus[0])?'reported_ended_unverified':/신청|대기/.test(mstatus[0])?'reported_requested_or_waiting':'reported_active_unverified';
  serviceHits.push({agency:full,status,span:[m.index,m.index+m[0].length]});
 });
 const program=raw.match(/(?:월드비전\s*)?(?:꿈꾸는\s*아이들|꿈꾸는\s*어린이|희망\s*디딤돌|드림스타트\s*사업|성장\s*지원\s*프로그램|청소년\s*지원\s*프로그램)/);
 const social=serviceHits.filter(t=>/복지관|센터|드림스타트/.test(t.agency));
 const chosen=social.length?social:serviceHits.filter(t=>t.agency==='월드비전');
 const unique=new Set();for(const item of chosen){const signature=item.agency+'|'+(program?.[0]||'');if(unique.has(signature))continue;unique.add(signature);info.services.push({id:'SV'+(info.services.length+1),agency:item.agency,program:program?.[0]?.replace(/^월드비전\s*/, '')||null,status:item.status,evidence_span:item.span});pushEvidence(evidence,raw,'existing_service','기존 지원',item.span[0],item.span[1]);}
 if(program&&!info.services.length&&/(?:참여\s*중|이용\s*중|참여하고|지원\s*받)/.test(raw.slice(program.index,program.index+100))){info.services.push({id:'SV1',agency:null,program:program[0],status:'reported_active_unverified',evidence_span:[program.index,program.index+program[0].length]});pushEvidence(evidence,raw,'existing_service','기존 지원',program.index,program.index+program[0].length);}
 // The claim-scoped polarity above is authoritative. Do not reclassify based on unrelated later sentences.
 evidence.sort((a,b)=>a.start-b.start||a.kind.localeCompare(b.kind));evidence.forEach((e,i)=>{e.id='E'+String(i+1).padStart(3,'0');delete e.dedupeKey});
 for(const p of info.people)p.evidence_ids=evidence.filter(e=>e.kind==='kin'&&e.start===p.evidence_span[0]).map(e=>e.id);
 for(const s of info.strengths)s.evidence_ids=evidence.filter(e=>e.kind==='strength'&&e.start===s.evidence_span[0]).map(e=>e.id);
 for(const s of info.services)s.evidence_ids=evidence.filter(e=>e.kind==='existing_service'&&e.start===s.evidence_span[0]).map(e=>e.id);
 return {version:VERSION,sourceLength:raw.length,fragments:fragments(raw).length,evidence,profile:{grade:info.grade,gender:info.gender,household:info.household},people:info.people,strengths:info.strengths,existingServices:info.services,limitations:['근거 위치는 최초 입력된 문자열 기준이며, 추출 결과는 사실확정이 아님','형태소 분석 모델이 아니므로 구어체·방언·중의문에는 검토가 필요함']};
}
return Object.freeze({VERSION,extract,redact,fragments,RULES: RULES.map(([id,label,,items])=>({id,label,items}))});
});