/* Korean evidence and polarity guard V8.6; local-only, no model network calls */
(function(root,factory){const node=typeof module!=='undefined'&&module.exports;const E=node?require('./case-evidence-base-v86.js'):root.OYEvidenceBaseV86;const api=factory(E);if(node)module.exports=api;else root.OYEvidenceV86=api;})(typeof window!=='undefined'?window:globalThis,function(E){'use strict';
const VERSION='8.6.0';
const R={
 family_harm:/(?:가정폭력|아동학대|학대|폭력|폭행|방임|때렸|맞았|구타|손찌검)/,
 self_harm:/(?:자해|자살|죽고\s*싶|살고\s*싶지|손목에\s*자해)/,
 peer_harm:/(?:학교폭력|왕따|따돌림|괴롭힘|친구가.{0,12}밀었|금품.{0,9}(?:빼앗|갈취)|같은\s*반\s*친구.{0,15}밀침|단톡방.{0,30}(?:조롱|괴롭힘|협박)|복도에서\s*밀쳤)/,
 online_coercion:/(?:성착취|온라인.{0,24}협박|성적\s*(?:사진|영상|자료).{0,25}(?:유포|협박)|사진.{0,18}유포)/,
 housing_arrears:/(?:퇴거\s*(?:위기|통보|위험)|체납|월세가\s*밀|머물\s*곳.{0,20}(?:없|구하)|보증금\s*문제)/,
 meal_gap:/(?:결식|굶|끼니.{0,15}(?:거르|못)|식사.{0,25}(?:못\s*(?:챙|먹)|부족|공백)|저녁.{0,15}먹지\s*못)/,
 care_burden:/(?:동생.{0,30}(?:돌보|챙기|책임)|가족.{0,20}(?:간병|돌봄\s*부담)|돌봄을\s*도맡|간병)/,
 school_access:/(?:교실\s*소음|소리\s*때문에|수업\s*환경|개별\s*설명|조용한\s*자리|시청각\s*접근|청각|장애\s*접근)/,
 economic:/(?:생활비.{0,12}(?:부족|어렵)|경제적\s*어려움|소득\s*불안정|안경.{0,22}비용|비용\s*때문에.{0,35}(?:못|미루|포기))/,
 family_conflict:/(?:보호자|부모|어머니|아버지|엄마|가족).{0,35}(?:진로\s*문제|갈등|다투|언쟁)|(?:가족\s*갈등|양육\s*스트레스)/,
 peer_conflict:/(?:친구.{0,25}(?:갈등|다투|위축|멀어|소외)|관계.{0,18}(?:위축|갈등|어렵))/,
 learning:/(?:교과|학습|수학|영어|과제|숙제|수업).{0,32}(?:어려|힘들|못|이해|부진|부담)|(?:과제|수업)\s*(?:수행|이해)\s*어려움/,
 attendance:/(?:결석|지각|조퇴|등교\s*(?:회피|거부|곤란|어려)|학교에\s*못\s*가)/,
 family_form:/(?:한부모|한\s*부모|조손|다문화\s*가족)/,
 mood:/(?:우울|불안|무기력|불면|잠을\s*못|마음이\s*힘들)/,
 medication:/(?:약물\s*복용|복약|처방약|약을\s*먹)/,
 adhd_report:/(?:ADHD|주의력\s*결핍)/i
};
const negative=/(?:없었|없다|없음|없다고|없어|아니|부인|받은\s*적\s*없|하지\s*않|않았|않는다|발생하지\s*않|당한\s*적\s*없|경험하지\s*않|보고되지\s*않)/;
const preventive=/(?:학교폭력\s*예방\s*교육|성착취\s*예방\s*교육|예방\s*교육|예방교육|사례\s*교육|사례교육|연습\s*문제|모의\s*(?:훈련|면담)|가상의|가정하면|만약|관련\s*연수|사례를\s*배우는\s*연수|학대를\s*예방|자살\s*예방\s*캠페인)/;
const disputed=/(?:소문|전언|누군가\s*의심|피해\s*여부\s*미확인|진술\s*미확인)/;
const delim=/(?<=[.!?。])\s*|[\n;]+|\s+(?:그러나|하지만|반면|다만|그런데)\s+/g;
function windowAround(raw,start,kind){
 const left=raw.slice(Math.max(0,start-65),start);let right=raw.slice(start,start+94);right=right.split(/(?<=[.!?。])|(?:그러나|하지만|다만|한편|그런데)/)[0];
 if(right.length>64)right=right.slice(0,64);
 return {before:left,after:right};
}
function classify(raw,e){
 const {before,after}=windowAround(raw,e.start,e.kind);
 const lastP=Math.max(raw.lastIndexOf('.',e.end-1),raw.lastIndexOf('。',e.end-1),raw.lastIndexOf('!',e.end-1),raw.lastIndexOf('?',e.end-1));const future=raw.slice(e.end).search(/[.!?。]/);const targeted=raw.slice(lastP+1,future>=0?e.end+future:Math.min(raw.length,e.end+60));
 const term=R[e.kind];if(!term)return e.polarity;
 const relevant=after.match(term);const rest=relevant?after.slice(relevant.index):after;
 if(preventive.test(before.slice(-30)+after.slice(0,90))&&/예방|모의|가정|연습|사례교육|연수|교육자료|캠페인/.test(before.slice(-30)+after.slice(0,90)))return 'hypothetical';
 if(/(?:교육\s*시간|교직원\s*연수|강의|지침|매뉴얼|훈련|교육\s*자료|사례를\s*설명|교육용).{0,32}(?:성착취|학교폭력|학대|자해|자살|폭력|협박)|(?:학교폭력|성착취|자해|자살|학대).{0,24}(?:지침|매뉴얼|예방교육|예방\s*교육|교육\s*자료|사례\s*설명)/.test(targeted)
 && !/(?:학생이|학생은|당사자가).{0,45}(?:맞았|맞았다|당했|피해를\s*입|협박을\s*받|자해했|자해를\s*했)/.test(targeted))return 'hypothetical';
 if(e.kind==='self_harm'&&/(?:자해를?\s*생각|자살\s*생각)/.test(targeted)&&/(?:행동으로\s*옮기지|실행하지|실제로\s*하지)/.test(targeted))return 'affirmed';
 // Evidence of an uncertainty, not evidence that victimization happened.
 if(['family_harm','peer_harm','self_harm','online_coercion'].includes(e.kind)&&
   /(?:피해|가해|사건|발생|접촉|학대|자해|폭력)\s*(?:사실|유무|여부|정황).{0,22}(?:미확인|모름|확인되지|알려지지|불분명)|(?:피해|사건)\s*여부는?\s*미확인/.test(after.slice(0,65)))return 'uncertain';
 if(e.kind==='family_harm'&&/학교\s*폭력|학폭|또래\s*폭력/.test(after.slice(0,50))&&
   !/(?:보호자|양육자|아버지|어머니|부모|엄마|아빠|가정폭력|아동학대|방임|집에서\s*맞)/.test(targeted))return 'hypothetical';

 if(['family_harm','peer_harm','self_harm','online_coercion'].includes(e.kind)&&/(?:받은\s*것\s*같|의심\s*신고|전해졌|사실관계.{0,12}미확인|확인\s*전)/.test(targeted)&&!/(?:학생이\s*(?:직접)?\s*말|학생이\s*진술|맞았다고\s*학생)/.test(targeted))return 'uncertain';
 if(e.kind==='family_harm'){
   if(/학교폭력\s*(?:대응|예방)|디지털\s*성폭력|교직원\s*연수/.test(targeted)&&!/보호자|아동학대|가정폭력|집에서\s*맞/.test(targeted))return 'hypothetical';
   if(/(?:가정폭력|학대|폭력|방임).{0,24}(?:발생하지\s*않|없|아니|부인|보고되지\s*않)/.test(targeted))return 'negated';
   if(/(?:폭력|학대|방임).{0,12}(?:없|받은\s*적\s*없)/.test(targeted))return 'negated';
 }
 if(e.kind==='self_harm'){
   if(/(?:자해|자살|죽고\s*싶).{0,25}(?:한\s*적\s*없|없|아니|않)/.test(after))return 'negated';
   if(/(?:죽고\s*싶은\s*생각|자해\s*생각).{0,19}(?:없|않)/.test(after))return 'negated';
   // Future/current safety unverified MUST NOT erase reported past self-harm words or injury.
   if(/(?:죽고\s*싶|자해\s*흔적|자해\s*진술|자해를\s*했다고)/.test(after))return 'affirmed';
 }
 if(e.kind==='peer_harm'||e.kind==='online_coercion'){
  if(/(?:피해|괴롭힘|학교폭력|협박|유포|성착취|따돌림).{0,27}(?:없|안\s*당|않|부인)/.test(after))return 'negated';
 }
 if(['adhd_report','medication'].includes(e.kind)&&/(?:진단|ADHD|복용|약물|처방).{0,30}(?:없|않|안\s*함|미복용)/i.test(after))return 'negated';
 if(e.kind==='housing_arrears'&&/(?:퇴거|체납).{0,20}(?:없|받지\s*않)/.test(after))return 'negated';
 if(disputed.test(after.slice(0,45)))return 'uncertain';
 // Do not suppress an event merely because "현재 안전 여부 미확인" appears later.
 return e.polarity==='hypothetical'?'hypothetical':e.polarity==='negated'&&negative.test(rest)?'negated':'affirmed';
}
function extract(input){const raw=typeof input==='string'?input:typeof input?.caseContext==='string'?input.caseContext:input?.caseContext?.text||'';
 const z=E.extract(raw);let evidence=z.evidence.map(e=>({...e,polarity:classify(raw,e),modelVersion:VERSION}));
 // add explicitly observed high-priority events the older regex misses; never assert legal / clinical findings.
 for(const kind of ['family_harm','self_harm','peer_harm','online_coercion','housing_arrears','meal_gap','care_burden','school_access','economic','learning','peer_conflict','family_conflict','attendance']){
  const rx=R[kind];rx.lastIndex=0;const m=rx.exec(raw);if(!m||evidence.some(e=>e.kind===kind))continue;
  if(kind==='family_harm'&&!/보호자|아동학대|가정폭력|방임|집에서\s*맞|손찌검|어머니|엄마|아버지|부모/.test(raw.slice(Math.max(0,m.index-40),m.index+55)))continue;
  const map={family_conflict:[17],housing_arrears:[20],meal_gap:[16,19],care_burden:[18],school_access:[14],economic:[19,21],peer_conflict:[22],peer_harm:[3],self_harm:[7],family_harm:[1],online_coercion:[25],learning:[10],attendance:[9]};
  const e={id:'',kind,label:kind,start:m.index,end:m.index+m[0].length,excerpt:E.redact(m[0]),context:E.redact(raw.slice(Math.max(0,m.index-32),m.index+52)),source:'user-entered-unverified',speaker:'unspecified',time:'unspecified',linked_items:map[kind]||[],polarity:'affirmed',modelVersion:VERSION};e.polarity=classify(raw,e);evidence.push(e);
 }
 // The earlier historical event remains reported even when the current situation is denied later.
 const historic=/(?:과거|작년|지난\s*(?:해|학기|달|주)|예전에).{0,55}(?:보호자|부모|아버지|어머니|엄마|아빠|집에서).{0,36}(?:맞았|맞은\s*적\s*(?:이\s*)?있|폭행을\s*당|학대를\s*당)/g;
 let hm;while((hm=historic.exec(raw))){const t=hm[0],at=hm.index;
  if(/(?:맞은\s*적|폭행|학대).{0,12}(?:없|않|아니|부인)/.test(t))continue;
  if(!evidence.some(e=>e.kind==='family_harm'&&e.polarity==='affirmed'&&Math.abs(e.start-at)<28))
    evidence.push({id:'',kind:'family_harm',label:'과거 보호자 위해 진술',start:at,end:at+t.length,excerpt:E.redact(t),context:E.redact(t),source:'user-entered-unverified',speaker:'unspecified',time:'historical',linked_items:[1],polarity:'affirmed',modelVersion:VERSION});
 }
 evidence.sort((a,b)=>a.start-b.start||a.kind.localeCompare(b.kind));evidence=evidence.map((e,i)=>({...e,id:'E'+String(i+1).padStart(3,'0')}));
 const lacksKinds=evidence.filter(e=>['family_harm','self_harm','peer_harm','online_coercion'].includes(e.kind));const safety={reported:lacksKinds.filter(e=>e.polarity==='affirmed').map(e=>e.id),uncertain:lacksKinds.filter(e=>e.polarity==='uncertain').map(e=>e.id),negated:lacksKinds.filter(e=>e.polarity==='negated').map(e=>e.id),hypothetical:lacksKinds.filter(e=>e.polarity==='hypothetical').map(e=>e.id)};
 return {...z,version:VERSION,evidence,safety,quality:{sourceFragments:raw.split(delim).filter(Boolean).length,polarityModel:'targeted per-clause evidence',pendingHumanReview:true}};
}
return Object.freeze({VERSION,extract,R,classify});});