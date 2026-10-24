/* OY-RALS | 한국어 사례분석·추론·응답모델 V8.0 | K-CARR
 * Additive/local and non-diagnostic. CORE (criteria.js) is the sole official scorer.
 * The output is a professional review DRAFT, not a confirmed case finding or completed intervention.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KCarrNarrativeV8=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const VERSION='8.0.0-case-formulation-20261024';
const MODEL_ID='oy-rals.korean-case-reasoning-response';
const ROLES={teacher:'교사', 'education-welfare':'교육복지사','social-worker':'사회복지사'};
const DOMAINS=[
 {id:'protection',label:'보호·안전',rx:/아동학대|학대|방임|보호자.{0,20}(?:폭행|폭력|때리|때렸)|집에서.{0,16}(?:맞|때리)|가정폭력|귀가.{0,8}(?:두렵|무섭)|안전.{0,5}우려|보호조치/},
 {id:'peer',label:'학교폭력·또래 안전',rx:/학교폭력|학폭|따돌림|왕따|괴롭힘|갈취|또래.{0,12}협박|집단.{0,8}배제/},
 {id:'mental',label:'정서·정신건강',rx:/우울|불안|자해|자살|죽고\s*싶|살고\s*싶지|공황|불면|무기력|정서상담/},
 {id:'school',label:'학습·출결',rx:/수업|수업방해|결석|지각|등교|학업|학습|과제|숙제|학교.{0,10}적응/},
 {id:'health',label:'행동·건강',rx:/ADHD|주의력결핍|진단|약물|복용|처방|충동|과잉행동|행동\s*조절|고성|진료|병원|건강|통증/},
 {id:'access',label:'교육 접근성',rx:/학습장애|발달|장애|감각|소음|교실환경|자리\s*배치|좌석|쉬는\s*시간|수업\s*조정|조정\s*제공|통역|언어/},
 {id:'care',label:'가족·돌봄',rx:/보호자|양육|돌봄|동생|간병|가족|가정|부모|양육자/},
 {id:'basic',label:'경제·주거',rx:/월세|임대료|체납|퇴거|주거|끼니|급식|식사|결식|생계|생활비|경제|진료비|의료비/},
 {id:'relation',label:'관계·지지',rx:/믿을\s*사람|신뢰|친구|고립|외롭|혼자|도움\s*요청|상담실|지지인/},
 {id:'digital',label:'온라인·디지털 안전',rx:/온라인|SNS|단톡|채팅|유포|성착취|사진.{0,8}협박|사이버|디지털|인터넷/}
];
const HIGH_RISK=/보복|추가\s*위해|자해|자살|죽고\s*싶|학대|폭행|폭력|구타|맞았|맞았다|맞은|때렸|때린|때릴|때리|방임|성착취|성폭력|협박|강요|귀가.{0,10}(?:두렵|무섭)|흉기|학폭|학교폭력|왕따|괴롭힘|조롱|갈취/;
const CONTEXT_SAFETY=/(?:연락처|금전\s*거래|개인\s*사진).{0,30}(?:제공|요구|협박)|(?:온라인|게임|채팅|계정).{0,75}(?:금전\s*거래|연락처\s*제공|사진\s*유포)|(?:보호자|부모).{0,20}(?:음주\s*후\s*고성|고성\s*반복|장기\s*입원)|돌봄\s*배치.{0,12}(?:없|미확인)|(?:하교\s*후|집에서).{0,24}(?:혼자\s*식사|혼자\s*잠)|귀가를\s*피|지인\s*집에서\s*잤|마주치지\s*않으려고|수업을\s*빠졌|물건을\s*빼앗으라는\s*압력|(?:거절\s*후|거절하면).{0,26}(?:메시지|괴롭)|\b가출\b|집에\s*돌아갈\s*시간을\s*늦추/;
const FAMILY_HARM=/(?:보호자|부모|아버지|어머니|엄마|아빠|가정|집).{0,26}(?:폭력|폭행|학대|때렸|때린|때리|맞았|맞았다)|(?:폭력|폭행|학대).{0,15}(?:보호자|부모|가정|엄마|아빠)|(?:집에서|귀가.{0,4}후).{0,15}(?:맞|폭력)/;
const CONTACT=/(?:보호자|부모|가정|집).{0,22}(?:연락|통보|전화)|(?:연락|통보|전화).{0,22}(?:보호자|부모|가정|집)/;
const LINK=/(?:연락|전화).{0,35}(?:후|뒤|하면|했더니|때문|이후|이어|연결|관련|시|할 때|으로 인하여|으로 인해).{0,48}(?:폭력|폭행|보복|맞았|맞았다|때리|때릴|구타)|(?:보호자|부모).{0,15}(?:전화|연락).{0,8}(?:해서|하자|한\s*뒤|한\s*후|했더니|하면서).{0,36}(?:맞|맞은|폭력|폭행|때리|때릴)|(?:연락.{0,20}(?:위해|보복)).{0,20}(?:위험|우려)/;
const REPORT=/(?:학대|폭력|폭행).{0,20}(?:신고|접수)|신고.{0,20}(?:학대|폭력|폭행)|보호조치|담당기관|아동보호전문기관/;
const MEDICAL=/ADHD|주의력결핍|진단|약물|복용|처방|투약|진료|의료진/;
const BEHAVIOR=/(?:수업).{0,16}(?:방해|참여|이탈|어려움)|방해\s*행동|행동.{0,10}(?:문제|조절)|충동/;
const NEG_RX=/(?:학대|폭력|폭행|학교폭력|왕따|자해|자살|협박|유포).{0,18}(?:없|아니|부인|하지\s*않|안\s*함)|(?:없었|없다고|없음|아니다|부인).{0,10}(?:폭력|학대|폭행)|(?:맞은\s*적|때린\s*적).{0,5}없/;
const HYP_RX=/(?:가정형\s*(?:예시|상황|사례)|가상\s*(?:사례|상황)|예시로만|이론적으로)|^(?:만약|가령|예를\s*들|가정해\s*보면)/;
const UNCERTAIN=/(?:미확인|불확실|가능성|의심|추정|소문|전언|전해|들었다고|모르겠|여부.{0,6}확인|확인되지\s*않)/;
const PAST=/(?:과거|지난\s*학기|작년|몇\s*달\s*전|이전(?:에)?|예전|초등학교\s*때)/;
const NOW=/(?:현재|지금|최근|오늘|반복|이어|지속|계속|이번|요즘)/;
const THIRD=/(?:학생|본인|보호자|부모|담임|교사|친구|이웃).{0,15}(?:말했|진술|전했|보고|설명)|(?:학교|교사).{0,14}(?:관찰|기록)/;
const STRENGTH=/(?:좋아하|잘하|희망|원하|도움\s*요청|신뢰|의지|지지|협조|스스로|참여\s*의사|강점)/;
const LENGTH_LIMIT=12000;
function clean(x){return String(x??'').slice(0,LENGTH_LIMIT).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' ')}
function redact(x){return clean(x).replace(/01[016789][- ]?\d{3,4}[- ]?\d{4}/g,'[전화번호]').replace(/\d{6}[- ]?[1-8]\d{6}/g,'[식별번호]').replace(/[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[이메일]').replace(/https?:\/\/\S+/gi,'[링크]')}
function splitNotes(text){return clean(text).replace(/(하지만|그러나|반면|다만|한편|그렇지만)/g,'\n$1 ').split(/(?<=[.!?。])\s+|[.!?。](?=\S)|[;；\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,120)}
function classifyLine(s,i){const domains=DOMAINS.filter(d=>d.rx.test(s)).map(d=>d.id);const status=HYP_RX.test(s)?'hypothetical':NEG_RX.test(s)?'denied_or_negative':PAST.test(s)&&!NOW.test(s)?'historical_unverified':UNCERTAIN.test(s)?'uncertain': 'reported_unverified';const risk=(HIGH_RISK.test(s)||CONTEXT_SAFETY.test(s))&&status!=='hypothetical'&&status!=='denied_or_negative';return {id:'E'+String(i+1).padStart(3,'0'),text:redact(s).slice(0,450),status,domains,risk,contact:CONTACT.test(s),familyHarm:FAMILY_HARM.test(s),reportMention:REPORT.test(s),medical:MEDICAL.test(s),source:THIRD.test(s)?'서술 속 보고/관찰 언급':'정보원 구체화 필요',time:PAST.test(s)?NOW.test(s)?'과거·현재 혼합':'과거':'시점 미확인'};}
function has(usable,rx){return usable.some(e=>rx.test(e.text));}
function clausesByDomain(evidence,domain){return evidence.filter(e=>e.domains.includes(domain)).map(e=>e.id)}
function contactLinked(evidence,raw){
 const pos=evidence.filter(e=>e.status!=='hypothetical'&&e.status!=='denied_or_negative');
 // Only explicit temporal/causal wording is a linked-contact hypothesis; co-occurrence alone is NOT causality.
 if(/보호자|부모|가정|집/.test(raw)&&pos.some(e=>LINK.test(e.text)&&HIGH_RISK.test(e.text)))return true;
 return /(?:보호자|부모).{0,10}연락.{0,40}(?:후|뒤|때문|이후|연결).{0,40}(?:폭력|폭행|때리|맞았|맞았다)/.test(raw)&&pos.some(e=>e.risk);
}
function buildLinks(flags){const x=[];
 if(flags.contactViolence)x.push({id:'contact-to-harm',label:'학교 연락과 학생 보호가 충돌할 가능성',meaning:'보호자 연락과 폭력의 시간적 연결이 서술되어 있습니다. 연락 때문에 폭력이 발생했다고 확정하지 않되, 통상적 연락의 안전성을 먼저 검토해야 합니다.',action:'학생이 안전하게 연락받을 대상과 경로를 보호 담당과 정하고, 필수 신고·보호 조치와 분리해 진행합니다.'});
 else if(flags.familyHarm)x.push({id:'family-safety',label:'가정 내 위해 의심과 학교의 협력 경로',meaning:'보호자에 의한 위해 단서가 있어 일반적인 가정 협력이 안전한지 먼저 확인해야 합니다. 학교 연락이 위해의 원인이라고 추정하지 않습니다.',action:'학생의 현재 안전, 연락 위험, 전문 보호기관의 실제 개입을 우선 확인합니다.'});
 if(flags.behavior&&flags.adhd)x.push({id:'medical-v-school',label:'ADHD 관련 보고와 수업의 실제 어려움은 별개',meaning:'진단·복약 보고만으로 수업 방해의 원인이나 약물 효과 부족을 단정할 수 없습니다. 치료 경과와 교실에서 관찰한 상황을 분리해 검토해야 합니다.',action:'교실의 선행 조건·빈도·환경조정 결과를 기록하고, 의료적 조정은 처방 의료진에게 맡깁니다.'});
 if(flags.harm&&flags.behavior)x.push({id:'safety-before-behavior',label:'행동지도보다 학생의 안전이 우선',meaning:'행동 지도와 보호자 접촉 과정이 학생에게 불리하게 작용할 우려가 있습니다. 보호체계와 교육적 지원을 순서와 책임에 따라 분리합니다.',action:'보호 담당의 안전 확인을 먼저 진행하면서 수업지원은 병행할 수 있는 범위에서 제공합니다.'});
 if(flags.reportMention)x.push({id:'report-not-protection',label:'신고 사실과 보호조치의 실제 이행은 다름',meaning:'신고가 언급되었다고 접수·조사·보호 상태가 확인된 것은 아닙니다.',action:'신고 접수 및 현재 보호조치의 담당기관·시점·안전한 후속 확인 경로를 확인합니다.'});
 if(flags.basic&&flags.care&&!flags.familyHarm)x.push({id:'basic-care',label:'기본생활의 부족과 돌봄 부담은 함께 사정',meaning:'경제적 어려움만으로 방임을 판단하지 않습니다. 학생의 실제 생활 공백과 가족의 지원 접근 장벽을 확인합니다.',action:'식사·주거·돌봄 중 당장 부족한 한 가지를 우선 파악해 지역 지원을 검토합니다.'});
 if(flags.peer&&flags.school)x.push({id:'peer-school',label:'피해 경험과 학교 참여의 관계',meaning:'학교생활의 어려움이 또래 피해와 연결되어 있을 가능성은 있지만 원인은 미확인입니다.',action:'피해 장면·접촉·보호 조치와 수업 참여의 변화를 같은 시점에 확인합니다.'});
 return x.slice(0,4);
}
function scoreDomains(evidence){const map=new Map();for(const e of evidence){if(['hypothetical','denied_or_negative'].includes(e.status))continue;for(const d of e.domains){const a=map.get(d)||{id:d,evidence:[],signals:0};a.evidence.push(e.id);a.signals++;map.set(d,a)}}return [...map.values()].sort((a,b)=>a.id==='protection'?-1:b.id==='protection'?1:b.signals-a.signals).map(x=>({id:x.id,label:DOMAINS.find(y=>y.id===x.id)?.label||x.id,evidence:x.evidence,source:'서술 신호 (공식 점수 아님)'}))}
function understanding(flags,domains,linked){const names=domains.filter(x=>x.id!=='protection').slice(0,3).map(x=>x.label).join('·')||'생활환경';let start='';
 if(flags.adhd&&flags.behavior)start='학생에게 ADHD 진단 또는 약물 관련 정보가 보고되어 있고, 학교에서는 수업 참여나 행동 조절의 어려움이 서술되어 있습니다.';
 else if(flags.school)start='학생의 수업·출결 등 학교 참여에서 어려움이 보고되어 있습니다.';
 else if(flags.basic&&flags.care)start='학생의 기본생활과 가족·돌봄 부담이 함께 언급되어 있습니다.';
 else start=`학생의 ${names} 영역에서 지원이 필요한 단서가 보고되어 있습니다.`;
 if(flags.familyHarm)start+=' 가정 내 보호자로부터의 위해가 언급되어 학생의 안전을 별도 사정해야 합니다.';
 else if(flags.harm)start+=' 안전·피해와 관련된 서술이 있어 현재 보호상태를 직접 확인해야 합니다.';
 if(flags.contactViolence)start+=' 특히 학교의 보호자 연락 이후 위해가 발생했다는 진술은 일반적인 보호자 연락을 반복할 경우 추가 위험이 있는지 검토하도록 요구합니다.';
 if(flags.reportMention)start+=' 신고가 언급되었으나 실제 보호조치의 유지 여부는 별도 확인이 필요합니다.';
 return start;}
function caseJudgment(flags,links){let lines=[];
 if(flags.harm){lines.push('본 사례는 단순한 행동 문제나 출결 문제로만 보기 어렵고, 학생의 현재 안전과 학교·가정의 접촉 환경을 함께 검토해야 하는 복합적 지원 사례로 잠정 사정됩니다.');if(flags.contactViolence)lines.push('특히 학교의 보호자 연락과 폭력이 연결되어 보고된 만큼, 학생의 안전한 연락 상대를 정하기 전에는 통상적인 보호자 연락을 기계적으로 반복하지 않는 방향이 적절합니다. 이는 신고의무 또는 긴급 보호조치를 미루자는 의미가 아닙니다.');}
 else lines.push('관찰된 어려움을 학생 개인의 문제로만 환원하지 않고, 실제 생활기능과 환경·돌봄·강점을 함께 고려하는 공동사정이 필요합니다.');
 if(flags.adhd||flags.medical)lines.push('진단·약물 관련 서술과 교실에서 확인된 생활 기능은 서로 다른 근거로 다뤄야 하며, 약물의 효과·조정이나 진단의 정확성은 담당 의료진의 영역입니다.');
 if(flags.behavior)lines.push('교사는 행동 발생 전후 상황과 제공된 수업환경 조정의 효과를 확인하고, 학생이 선택할 수 있는 부담 완화 방안을 함께 마련할 필요가 있습니다.');
 if(flags.reportMention)lines.push('신고 여부, 실제 접수, 보호조치와 서비스 제공의 상태는 각각 분리해 확인해야 합니다.');
 lines.push('현 단계의 해석은 입력된 서술에 근거한 잠정적 사정입니다. 미확인 사항은 추후 확인하고 학생의 의사·강점과 직접 관찰 자료로 보완해야 합니다.');
 return lines.join(' ');
}
function plans(flags,role){const rows=[];const actor=ROLES[role];function add(stage,goal,owner,action,completion,when){rows.push({order:rows.length+1,stage,goal,owner,action,completion,when,status:'제안 · 담당 확정/실행 여부 미확인',isDraft:true});}
 if(flags.harm){add('현재 안전·보호','학생의 현재 안전과 보호 경로 확인','학교 보호 담당자 · 사안별 보호·신고기관','학생이 안전하게 진술할 수 있는 환경에서 최근 위해·보복 우려·현재 위치·귀가 및 보호 상태를 직접 확인하고 필요한 신고·보호·긴급절차를 지체하지 않고 진행','현재 안전 확인내용, 보호 담당자, 실제 조치·후속 확인일 기록','현재 안전 확인부터');}
 if(flags.familyHarm||flags.contactViolence){add('안전한 소통·연락','추가 위해 가능성을 줄이는 연락 경로 확정','학교 보호 담당 · 교육복지사 · 필요한 경우 보호기관','보호자 연락을 진행하기 전에 학생의 안전과 법적 절차를 고려해 연락 범위·대체 경로·기관별 권한을 협의; 위험 가능성이 있다면 보호기관과 먼저 상의','안전한 연락 상대·보류 사유·대안·담당자·다음 점검일 기록','일반 가정연락 전 / 보호조치와 병행');}
 if(flags.school||flags.behavior||flags.adhd){add('학교환경 조정','행동 지도보다 실행 가능한 수업 참여 여건 마련',role==='social-worker'?'담임·학습지원 담당(학교 실행) / 사회복지사(지원장벽 확인)':role==='education-welfare'?'담임·학습지원 담당 / 교육복지사(조정)':'담임·학습지원 담당',flags.behavior?'수업 방해·이탈이 보고된 장면·빈도·선행 요구를 기록하고, 과제 분할·좌석·자극·짧은 휴식·긍정 피드백 중 학생과 선택한 조정을 제공':'학생이 어려워하는 출결·수업·과제 장면과 원하는 변화를 듣고, 확인된 장벽에 맞춰 설명·과제량·참여 방식의 조정을 협의','환경조정 제공 여부, 수업 참여/과제 시작의 기준선 대비 변화, 학생 체감 확인','초기 면담 및 안전조치와 병행');}
 if(flags.medical){add('진료·건강 연계','치료 정보와 관찰자료를 분리하여 적절히 연계',role==='teacher'?'보건·상담 담당 / 진료기관(의료 판단)':role==='education-welfare'?'교육복지사·학교 보건·상담 담당 / 진료기관':'사회복지사·학교 담당 / 처방 의료진','학생 의사와 안전·정보공유 범위를 고려해 현재 진료·복약 정보의 확인 가능성을 살피고, 학교 관찰 기록을 의료진과 공유할 필요성을 검토. 약물 조정은 의료진만 시행','진료 이용·정보공유 동의·학교 관찰자료 및 실제 후속 연락 확인','안전조치 이후 / 학생과 협의');}
 if(flags.basic||flags.care){add('생활·돌봄 지원','가정·생활 공백을 실제 서비스로 연결',role==='teacher'?'교육복지사 및 지역사례관리자(연계)':role==='education-welfare'?'교육복지사·지역사례관리자':'사회복지사·학교 교육복지 담당','식사·돌봄·주거 등 현재 부족한 서비스를 파악하고 담당 기관의 문의·의뢰·접수·실제 제공 상태를 단계별로 확인','학생의 필요 충족 여부, 제공 일자, 서비스 접근 장벽과 첫 점검일','우선 생활 필요 확인 후');}
 if(flags.peer||flags.mental||flags.digital){add('정서·또래·온라인 지원','학생의 안전한 참여와 도움요청 가능성 회복','학교 상담·사안 담당 / 필요시 전문기관','학생 진술을 존중해 피해·접촉·정서 및 온라인 안전을 직접 확인하고, 학교 내 지원 및 전문 상담·피해보호의 담당과 실제 접수 여부를 점검','재접촉·추가 피해 여부와 상담·지원 개시를 구분해 기록','현재 안전 확인과 병행');}
 if(!rows.length)add('공동사정','학생에게 중요한 우선 욕구와 강점 확인',actor+' 및 학생','학생이 가장 원하는 변화와 이미 도움이 된 경험을 듣고, 관찰과 미확인 사항을 구별해 한 가지 실행 가능한 목표를 합의','학생이 선택한 목표·기준선·담당·첫 점검일 기록','첫 면담에서');
 return rows.slice(0,4).map((r,i)=>({...r,order:i+1}));}
function questions(flags){const r=[];
 if(flags.harm)r.push('지금 학생이 안전한 곳에 있는지, 최근 위해·보복 우려·귀가 시 접촉 및 실제 보호 담당은 누구인지 확인했습니까?');
 if(flags.familyHarm||flags.contactViolence)r.push('일반적인 보호자 연락이 학생에게 위험하지 않은지, 연락 가능한 안전한 대상과 전문 보호체계의 담당은 누구입니까?');
 if(flags.reportMention)r.push('신고 접수·조치 단계·후속 담당기관과 실제 보호 상태를 각각 확인했습니까?');
 if(flags.behavior||flags.school)r.push('어떤 수업 장면에서 얼마나 자주 어려움이 있었고, 선행상황·환경조정·학생이 바라는 변화는 무엇입니까?');
 if(flags.medical)r.push('진단·복약 정보의 출처, 현재 진료 이용 상태, 의료진과 공유 가능한 학교 관찰자료는 구분되어 있습니까?');
 if(flags.basic||flags.care)r.push('돌봄·생활의 실제 공백, 이미 제공된 서비스와 아직 문의·신청 단계인 지원은 무엇입니까?');
 r.push('학생 스스로 중요하다고 생각하는 문제, 강점, 신뢰하는 사람 및 다음 면담에 대한 의사는 무엇입니까?');
 return r.slice(0,6);
}
function assess(input){if(typeof input==='string')input={caseContext:input};if(!input||typeof input!=='object')throw Error('서술 문자열 또는 입력 객체가 필요합니다.');const role=input.role||'social-worker';if(!ROLES[role])throw Error('role: teacher / education-welfare / social-worker');const raw=clean(input.caseContext??input.narrative??'');if(!raw.trim())return {version:VERSION,modelId:MODEL_ID,requiresProfessionalReview:true,abstain:true,reason:'서술 정보 없음 — 기존 25문항 공식 결과만 유지'};
 const evidence=splitNotes(raw).map(classifyLine),positive=evidence.filter(e=>!['hypothetical','denied_or_negative'].includes(e.status));
 const harm=positive.some(e=>e.risk),familyHarm=positive.some(e=>e.familyHarm),contactViolence=contactLinked(evidence,raw);
 const flags={harm,familyHarm,contactViolence,reportMention:has(positive,REPORT),medical:has(positive,MEDICAL),adhd:has(positive,/ADHD|주의력결핍/i),behavior:has(positive,BEHAVIOR),school:has(positive,DOMAINS[3].rx),basic:has(positive,DOMAINS[7].rx),care:has(positive,DOMAINS[6].rx),peer:has(positive,DOMAINS[1].rx),mental:has(positive,DOMAINS[2].rx),digital:has(positive,DOMAINS[9].rx),strength:has(positive,STRENGTH)};
 const ranked=scoreDomains(evidence),links=buildLinks(flags),overview=understanding(flags,ranked,links),judgment=caseJudgment(flags,links),actions=plans(flags,role),missing=questions(flags);
 const issues=ranked.slice(0,3).map(x=>x.label);
 const summary={studentSituation:overview,centralJudgment:flags.harm?'학생 보호·안전 우선 공동사정':flags.school?'학교 참여를 중심으로 환경·욕구 공동사정':'학생이 원하는 변화와 생활 맥락 공동사정',priorityReason:flags.contactViolence?'보호자 연락 이후 위해가 서술되어 연락 안전성을 먼저 확인해야 함':flags.harm?'학생의 현재 위해·보호상태를 먼저 확인해야 함':'학생의 우선 욕구와 지원 접근장벽을 먼저 확인해야 함',firstAction:actions[0].action,keyIssues:issues,officialResult:'CORE 점수·안전판정과 독립된 서술 기반 검토 초안'};
 const knownScore=(typeof input.officialScore==='number'&&Number.isFinite(input.officialScore))?input.officialScore:null;
 return {modelId:MODEL_ID,code:'K-CARR',version:VERSION,role,roleDisplay:ROLES[role],status:'실무자 확인 전 검토안',abstain:false,officialScoreUntouched:knownScore,scoredByCORE:false,officialSafetyChanged:false,priorityDraft:summary.centralJudgment,hasSafetySignal:flags.harm,caregiverContactHazard:flags.contactViolence,needsCaregiverContactSafetyReview:flags.familyHarm||flags.contactViolence,medicalReportPresent:flags.medical,reportDoesNotEstablishProtection:flags.reportMention,caseFormulation:judgment,situationOverview:overview,integratedJudgment:judgment,summary,causalLinks:links,domains:ranked,evidence,nextQuestions:missing,executionPlan:actions,roleActions:actions.map(a=>({stage:a.stage,owner:a.owner,action:a.action})),reviewState:{confirmedFacts:[],reportedClues:positive.map(e=>e.id),unknownOrUnverified:evidence.filter(e=>e.status==='uncertain'||e.status==='historical_unverified').map(e=>e.id),serviceConfirmed:false,conferenceApproved:false},outputPanels:{primary:['summary','integratedJudgment','executionPlan'],collapsed:['evidence','nextQuestions','causalLinks'],graphOwnedBy:'existing-site'},requiresProfessionalReview:true,caveat:['서술은 사실 확정·임상진단·위험예측 근거가 아닙니다.','미상은 0점이 아니며 기존 CORE 판정은 변경하지 않습니다.','신고 언급과 보호조치·서비스 실제 수행은 분리해 확인합니다.','사례회의 결정·연계 승인·서비스 제공을 자동 기록하지 않습니다.']};
}
return Object.freeze({VERSION,MODEL_ID,DOMAINS,ROLES,assess,splitNotes,redact});
});
