/* OY-RALS v4.5 narrative understanding assistant: deterministic lexical and evidential parsing.
   No classification is a confirmed event, diagnosis, quantitative risk, or statutory decision. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthNarrativeV45=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='4.5.0-narrative-20261024',SAFETY=new Set([1,2,7,25]);
const NEG=/(?:없다|없음|없어|없었|없고|없지만|없으나|아니라|아니다|아니라고|않(?:는|음|았|아|고|지만)|부인|해당\s?없|하지\s?않|하지\s?못|싶지\s?않|하지는\s?않|안\s?(?:했|함|한다|했음)|경험하지)/;
const HEARSAY=/(?:전언|소문|들었다|전해|했다고\s?함|다고\s?함|라더라|보호자가\s?말|친구가\s?말|담임이\s?(?:말|전했|전해))/;
const UNCERTAIN=/(?:의심|추정|가능성|모르|미확인|확인\s?필요|불확실|것\s?같|듯하|같다고\s?함|인듯|아마|불분명)/;
const HYPOTH=/(?:만약|가상의|가정하|예시|예를\s?들|수업자료|예방\s?교육|척도\s?문항|강의내용|연습문제|시뮬레이션)/;
const PAST=/(?:과거|작년|지난해|지난\s?학기|초등학교\s?때|예전|이전에|몇\s?년\s?전|당시|지난달)/;
const NOW=/(?:지금|현재|최근|요즘|오늘|이번\s?주|계속|아직|어제)/;
const WISH=/(?:희망|원한다|원함|원해|원했|원하는|바란다|바람|받고\s?싶|하고\s?싶|도움\s?요청|요청했다)/;
const STRENGTH=/(?:강점|장점|잘하|좋아하|즐겨|신뢰하|믿고|도움을\s?청|스스로|노력|잘\s?해낸|지지해)/;
const SERVICE=/(?:상담\s?중|치료\s?중|접수|문의\s?전|신청|서비스\s?이용|연계|지원\s?받|복지관|Wee|위클래스|가족센터|방문)/i;
const CLAUSE_SPLIT=/(없고|없지만|없으나|없었지만|아니지만|않지만|않고|않으나|않았으나|했지만|했으나|했고|그러나|하지만|반면|다만|그런데|그리고|또한|한편)/g;
const num=v=>Number.isInteger(v)&&v>=0&&v<=4;
const esc=s=>String(s==null?'':s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' ').slice(0,5000);
function redact(s){return esc(s).replace(/\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/g,'[연락처]')
 .replace(/\b\d{6}[- ]?[1-8]\d{6}\b/g,'[고유번호]').replace(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi,'[이메일]');}
function validateAnswers(a){if(!Array.isArray(a)||a.length!==25||a.some(v=>v!=='unknown'&&!num(v)))throw Error('25문항 0-4 또는 unknown 필수');return a;}
function inputText(p){const t=typeof p==='string'?p:typeof p?.caseContext==='string'?p.caseContext:p?.caseContext?.text||'';return esc(t).trim();}
function split(text){return text.replace(CLAUSE_SPLIT,'$1\n').split(/(?<=[.!?。])\s*|[\n;]+|,(?=\s*(?:학생|보호자|담임|교사|친구|본인))/).map(s=>s.trim()).filter(Boolean).slice(0,70);}
function sourceOf(c){if(/학생(?:이|은|에게서).{0,16}(?:말|진술|호소|표현|답변)/.test(c))return 'student-statement';
 if(/(?:담임|교사|교육복지사|사회복지사).{0,20}(?:관찰|확인|기록|보았|보고)/.test(c))return 'staff-observation';
 if(HEARSAY.test(c)||/(?:보호자|친구|담임|교사).{0,45}(?:전했|전해|알려|말했|말씀)/.test(c))return 'third-party';return 'source-unconfirmed';}
function extract(input,topics){const text=inputText(input);if(!text)return {version:VERSION,hasText:false,claims:[],flags:[],manualReview:false,safetyMentions:[],privacyNotice:[]};
 if(!Array.isArray(topics)||topics.length!==25)throw Error('문항별 주제 사전 25개 필요');
 const lines=split(text),claims=[],flags=[],privacyNotice=[];
 const sensitive=redact(text)!==text;if(sensitive)privacyNotice.push('전화번호·이메일·고유식별번호로 보이는 형식 일부를 가렸습니다. 자동 익명화는 보장되지 않습니다.');
 for(let ci=0;ci<lines.length;ci++){
  const c=lines[ci],hypo=HYPOTH.test(c),negative=NEG.test(c),hearsay=HEARSAY.test(c),uncertain=UNCERTAIN.test(c),history=PAST.test(c),current=NOW.test(c);
  const support=WISH.test(c)?'wish':STRENGTH.test(c)?'strength':SERVICE.test(c)?'service':null;
  const source=sourceOf(c),mode=hypo?'hypothetical':negative?'negated':history&&!current?'historical':(hearsay||source==='third-party')?'hearsay':uncertain?'unverified':'reported';
  const narrativeMode=mode==='reported'?'current':mode==='hypothetical'?'conflict':mode==='negated'?'conflict':mode==='unverified'?'conflict':mode;
  for(const t of topics){const rx=new RegExp(t.regex,'i');const match=c.match(rx);if(!match)continue;
   const claim={id:'N45-'+String(ci).padStart(2,'0')+'-'+String(t.id).padStart(2,'0'),item:t.id,topic:t.topic,
     source,polarity:mode,narrativeMode,temporal:history?'historical-mention':current?'current-or-recent':'time-unknown',
     excerpt:redact(c).slice(0,180),match:match[0],wordingOnly:true,confirmation:t.verification,action:t.intervention,
     safety:SAFETY.has(t.id),support,verified:false};claims.push(claim);
  }
  if(support)flags.push({type:support,excerpt:redact(c).slice(0,180),source,verified:false});
 }
 const unique=claims.filter((x,i,a)=>a.findIndex(y=>y.item===x.item&&y.excerpt===x.excerpt)===i);
 const safetyMentions=unique.filter(x=>x.safety&&x.polarity!=='hypothetical'&&x.polarity!=='negated');
 return {version:VERSION,hasText:true,claims:unique,flags,safetyMentions,privacyNotice,manualReview:safetyMentions.length>0,source:'optional free-text; unverified; no automatic scoring'};
}
function reconcile(p,topics){const a=validateAnswers(p.answers),r=extract(p,topics),mismatches=[],unknownCandidates=[],matched=[];
 for(const c of r.claims){const v=a[c.item-1];if(c.polarity==='hypothetical')continue;
  if(v==='unknown')unknownCandidates.push({item:c.item,polarity:c.polarity,why:'이 주제는 자유서술에 등장하지만 평가 응답은 미상입니다. 점수대체 금지.'});
  else if(c.polarity==='negated'&&v>0)mismatches.push({item:c.item,why:'부정 표현과 양성 점수의 대상·발생시점·출처 차이 확인'});
  else if(c.polarity!=='negated'&&v===0)mismatches.push({item:c.item,why:'0점과 해당 주제 언급이 함께 존재합니다. 서로 다른 사건/시점일 수 있으므로 자동수정 금지.'});
  else if(v>0&&c.polarity!=='negated')matched.push({item:c.item,score:v,kind:'topic-match-only; not independent confirmation'});
 }
 const dedup=a=>a.filter((x,i,z)=>z.findIndex(y=>y.item===x.item)===i);
 return {...r,matched:dedup(matched),mismatches:dedup(mismatches),unknownCandidates:dedup(unknownCandidates),
  originalAnswers:a.slice(),scoreChanged:false,safetyGateChanged:false,manualReview:r.manualReview||mismatches.length>0||unknownCandidates.length>0};
}
function modeFor(r){if(r.mismatches.length||r.unknownCandidates.length)return'conflict';if(r.claims.some(c=>c.polarity==='historical'))return'historical';if(r.claims.some(c=>c.polarity==='hearsay'))return'hearsay';if(r.flags.length&&r.claims.length<2)return'support';return'current';}
return Object.freeze({VERSION,inputText,redact,validateAnswers,split,extract,reconcile,modeFor});
});