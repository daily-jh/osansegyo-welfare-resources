/* OY-RALS v5.0: Korean case context extraction, no generative AI, no storage or network. */
(function(root,factory){'use strict';const a=factory();if(typeof module!=='undefined'&&module.exports)module.exports=a;else root.OYContextV5=a;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='5.0.0';
const RX={
  hypothetical:/만약|가정(?:하|한|의)|가상(?:의|사례)|예를\s*들|예시로|교육자료|연습문제|사례를\s*가정|그럴\s*경우/,
  negative:/없(?:었|음|다|어|고|지만|으나|다고)|않(?:는|음|았|아|고|지만|으나|는다고)|아니(?:다|라고|었|지만)|부인|부정|한\s*적\s*없|해당\s*없|하지\s*않|하지는\s*않|못\s*했|안\s*(?:한다|함|했다|했음|하는|가|했)/,
  uncertain:/의심|추정|가능성|듯(?:하|함)|같(?:다|음|아|아서)|불확실|확인\s*필요|미확인|모르(?:겠|고)|~일\s*수|아마|여부|정황/,
  history:/과거|예전|지난(?:달|해|학기|주|주말)|작년|당시|어릴\s*때|이전에|\d+년\s*전|\d+개월\s*전|초등학교\s*때/,
  current:/현재|지금|오늘|요즘|최근|어제|이번\s*(?:주|달|학기)|계속|아직|금일|매일|반복(?:해서|됨|적)/,
  hearsay:/전해(?:들|줬|받)|전언|소문|라고\s*했|라고\s*함|다고\s*(?:했|함)|들었다|들었|말(?:했다|했음|한다고)|알려(?:줬|주었)|했다고\s*전해/,
  wish:/원(?:합니다|한다|함|해|했|하는|하고|하여|하였)|바(?:란다|람)|희망|하고\s*싶|받고\s*싶|돕(?:고|길)\s*싶|요청(?:하|했)/,
  strength:/강점|장점|잘(?:하|해낸)|좋아하|즐기|믿(?:는|고)|신뢰|도움을\s*청|스스로|함께\s*해|지지(?:해|자)|교사와\s*대화|담임과\s*대화/,
  service:/지원(?:받|중|했|예정)|상담(?:중|받|신청|예약)|치료(?:중|받|예정)|서비스|연계|신청|접수|문의|기관|복지관|위클래스|Wee|의뢰|가족센터/,
  rejectedContact:/집에\s*(?:연락|알리)|보호자(?:에게)?\s*연락|부모(?:에게)?\s*연락|알리지\s*말|말하지\s*말|연락하지\s*말/,
  directSource:/(?:학생|본인|당사자).{0,26}(?:말|진술|이야기|호소|표현|알려|답)/,
  observedSource:/(?:담임|교사|교육복지사|사회복지사|보건교사).{0,35}(?:관찰|확인|기록|보았|목격)/,
  thirdSource:/(?:친구|또래|보호자|가족|담임|교사|이웃).{0,35}(?:전했|전해|말했|알려|들었다|제보)/
};
function sanitize(s){return String(s??'').slice(0,5000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' ')}
function redact(s){return sanitize(s).replace(/\b01[016789][ -]?\d{3,4}[ -]?\d{4}\b/g,'[전화번호]')
 .replace(/\b\d{6}[- ]?[1-8]\d{6}\b/g,'[식별번호]')
 .replace(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi,'[이메일]')
 .replace(/https?:\/\/\S+/gi,'[주소링크]');}
function clauses(text){return sanitize(text).replace(/(없지만|없고|않지만|않고|았지만|었지만|있으나|했으나|하였으나|그러나|하지만|그런데|반면|다만|한편|반대로|그러면서|또한|그리고)/g,'$1\n')
 .split(/\n+|[.!?。]+\s*|[;；]+|,(?=\s*(?:학생|보호자|친구|교사|담임|저는|본인은))/)
 .map(x=>x.trim()).filter(Boolean).slice(0,80)}
function topicMatches(clause,topics){const out=[];for(const t of topics){let rx;try{rx=new RegExp(t.regex,'i')}catch(e){continue}const m=rx.exec(clause);if(m)out.push({item:t.id,topic:t.topic,term:m[0],start:m.index,verification:t.verification,intervention:t.intervention})}return out}
function source(c){if(RX.thirdSource.test(c)||RX.hearsay.test(c))return 'third-party';if(RX.directSource.test(c))return 'student';if(RX.observedSource.test(c))return 'staff-observation';return 'not-recorded'}
function classification(c){if(RX.hypothetical.test(c))return'hypothetical';if(/확인(?:하지\s*못|되지\s*않)|미확인|불확실/.test(c)&&!/(?:사건|상황|피해|어려움|자해|학대|폭행|성착취).{0,8}(?:없|않|부인)/.test(c))return'uncertain';if(RX.negative.test(c))return'negative';if(RX.history.test(c)&&!RX.current.test(c))return'historical';if(RX.thirdSource.test(c)||(RX.hearsay.test(c)&&!RX.directSource.test(c)))return'hearsay';if(RX.uncertain.test(c))return'uncertain';return'reported-unverified'}
function analyze(input,topics){if(!Array.isArray(topics)||topics.length!==25)throw Error('25개 주제 사전 필요');const s=typeof input==='string'?input:input?.caseContext?.text??input?.caseContext??input?.text??'';const text=sanitize(s);const blocks=clauses(text);let units=[],links=[],flags=[],safety=[];
 blocks.forEach((c,i)=>{const status=classification(c);const informationSource=source(c);const marks={wish:RX.wish.test(c),strength:RX.strength.test(c),service:RX.service.test(c),contactSafety:RX.rejectedContact.test(c)};
 const unit={id:'C'+String(i+1).padStart(3,'0'),excerpt:redact(c).slice(0,240),status,source:informationSource,time:RX.current.test(c)?'current-mentioned':RX.history.test(c)?'past-mentioned':'not-established',marks,verified:false};units.push(unit);
 for(const t of topicMatches(c,topics)){const link={claimId:unit.id+'-I'+String(t.item).padStart(2,'0'),unitId:unit.id,number:t.item,topic:t.topic,term:t.term,status,source:informationSource,excerpt:unit.excerpt,verification:t.verification,intervention:t.intervention,safety:[1,2,7,25].includes(t.item)};links.push(link);if(link.safety&&status!=='hypothetical'&&status!=='negative')safety.push(link)}
 if(Object.values(marks).some(Boolean))flags.push({unitId:unit.id,...marks,excerpt:unit.excerpt,status});});
 return {version:VERSION,hasContext:!!text.trim(),units,links,flags,safetyMentions:safety,rawExcluded:true,privacyWarning:redact(text)!==text?'형식기반 비식별 처리의 한계: 원문에서 신원 확인 가능성을 별도로 점검하세요.':null,notes:['평가 점수·의료/학대 사실·서비스 확정과 별개인 언어 단서','키워드 탐지는 의미 이해나 전문적 사정의 대체가 아님']};}
function align(analysis,answers){if(!Array.isArray(answers)||answers.length!==25||answers.some(v=>v!=='unknown'&&!(Number.isInteger(v)&&v>=0&&v<=4)))throw Error('25문항 0~4 또는 unknown 필수');const conflicts=[],aligned=[],needReview=[],dedup=new Set();for(const c of analysis.links){if(c.status==='hypothetical')continue;const value=answers[c.number-1];const key=c.number+'-'+c.unitId;if(dedup.has(key))continue;dedup.add(key);
 if(value==='unknown')needReview.push({item:c.number,unitId:c.unitId,reason:'서술에는 언급, 문항은 미상; 자동점수 대체 금지'});
 else if((c.status==='negative'&&value>0)||(c.status!=='negative'&&value===0))conflicts.push({item:c.number,unitId:c.unitId,reason:'문항점수와 표현의 시점·주체·사건 차이를 확인'});
 else if(value>0&&c.status!=='negative')aligned.push({item:c.number,unitId:c.unitId,score:value,level:'topic-corroboration-not-independent-evidence'});}
 return {conflicts,needReview,aligned,unchangedAnswers:answers.slice(),safetyMentions:analysis.safetyMentions.length,manualReview:!!(conflicts.length||needReview.length||analysis.safetyMentions.length)};}
return Object.freeze({VERSION,redact,clauses,classification,analyze,align});});
