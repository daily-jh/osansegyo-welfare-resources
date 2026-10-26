/* OY-RALS ask model v1: quick answers from the deep interpretation and short prompts for an external AI.
   Pure functions. No network, no storage. The practitioner copies the prompt and pastes it into the AI they use.
   The model itself never reads caseContext; the caller decides what text is passed in. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const D=node?require('./oy-deep-interpretation-v1.js'):root.OYDeepInterpretation;
const VERSION='1.0.0-20261026';

// Frequent questions answered directly from deep-interpretation sections (no new sentences are generated).
const FAQ=[
 {id:'first',label:'이번 주에 먼저 할 일은?',keys:['critical','plan']},
 {id:'questions',label:'면담 첫 질문은?',keys:['questions']},
 {id:'roles',label:'학교·복지관은 각각 무엇을?',keys:['case','roles']},
 {id:'family',label:'보호자와는 어떻게 협력할까?',keys:['case']},
 {id:'agenda',label:'사례회의에서 다룰 안건은?',keys:['agenda']},
 {id:'resources',label:'어떤 자원에 연결할까?',keys:['ecology']},
 {id:'patterns',label:'어려움이 왜 맞물려 있을까?',keys:['patterns']},
 {id:'consult',label:'슈퍼바이저는 무엇을 볼까?',keys:['consult']},
 {id:'reassess',label:'다음 재평가에서 볼 것은?',keys:['reassess']}
];
// Which questions to show first for a section; three general ones follow.
const NEAR={critical:['first','family'],understanding:['patterns','first'],compare:['questions','patterns'],case:['roles','family'],code:['patterns'],detail:['questions','patterns'],
 patterns:['patterns','consult'],ecology:['resources','roles'],strengths:['questions'],plan:['first','agenda'],roles:['roles'],agenda:['agenda','consult'],questions:['questions'],
 consult:['consult'],reassess:['reassess'],guide:['questions'],gaps:['questions'],report:['first','agenda','resources']};
const GENERAL=['first','questions','roles'];

function faqFor(section){const ids=[...(NEAR[section]||[]),...GENERAL];return [...new Set(ids)].slice(0,4).map(id=>FAQ.find(f=>f.id===id));}

function answer(r,id){
 const f=FAQ.find(x=>x.id===id);if(!f)throw Error('ASK_FAQ_UNKNOWN');
 const parts=[];
 if(id==='first')parts.push('이번 주 첫 행동: '+r.summary.first);
 f.keys.forEach(k=>{const t=D.sectionText(r,k);if(!t)return;
  if(id==='family'){const line=t.split('\n').find(x=>/^보호자 참여/.test(x));if(line)parts.push(line);return;}
  if(id==='first'&&k==='plan'){const lines=t.split('\n'),i=lines.findIndex(x=>/^▸/.test(x)),j=lines.findIndex((x,n)=>n>i&&/^▸/.test(x));parts.push(lines.slice(Math.max(i,0),j>0?j:undefined).join('\n'));return;}
  parts.push('['+(D.TITLES[k]||k)+']\n'+t);});
 return {title:f.label,text:parts.filter(Boolean).join('\n\n')||'해석지에 이 질문에 해당하는 내용이 없습니다. 아래에서 외부 AI에 질문해 보세요.'};
}

const RULES=[
 '당신은 학교사회복지·통합사례관리 자문가입니다. 아래는 OY-RALS(25문항 0~4점 척도) 해석지에서 실무자가 고른 부분이며, 실무자 검토용 참고자료입니다.',
 '지켜야 할 것:',
 '- CORE 점수와 안전 판단은 바꾸지 마세요. 미상은 0점이 아닙니다.',
 '- 진단명, 학대 확정, 자살위험 등급 같은 표현을 쓰지 마세요.',
 '- 제공되지 않은 사실(가족 구성, 면담 내용, 회의 결정, 서비스 이용, 성과)을 만들지 마세요. 모르는 것은 확인 질문으로 남기세요.',
 '- 법·제도·기관 정보를 들 때는 공식 출처와 발행일을 밝히고, 확인하지 못했으면 \'미확인\'이라고 쓰세요.',
 '- 현재 안전과 관련된 내용이 있으면 다른 제안보다 먼저 다루세요.',
 '- 조건·유보 문구는 답변 끝에 한 번만 쓰세요.',
 '- 한국어로, 실무자가 바로 쓸 수 있게 짧은 단락과 표로 답하세요.'
].join('\n');

// Output templates for whole-document requests.
const TASKS={
 integrated:{label:'통합사례보고서',form:'① 사례 개요와 현재 안전 ② 영역별 사정(근거·생활 영향·강점·확인 질문) ③ 사례개념화 ④ 개입 수준과 주관·협력 ⑤ 단계별 개입계획 ⑥ 점검·재사정 기준 ⑦ 실무자가 확인할 사항'},
 assessment:{label:'사례사정지·판정 보고서',form:'① 의뢰 사유와 현재 안전 ② 영역별 사정표[영역/근거/욕구/생활 영향/강점/확인 질문] ③ 사례개념화 ④ 판정안[지원 방향/근거/대안/학생 의견란/회의 결정란]'},
 plan:{label:'서비스계획서',form:'표[목표/관련 영역/실행 내용/주관·협력/시작·종료/주기/측정 방법/점검일]. 기준선·담당·일정처럼 주어지지 않은 값은 빈칸으로 두세요.'},
 meeting:{label:'사례회의 안건지',form:'① 회의 목적 ② 사례 요약(5줄 이내) ③ 논의 안건과 각 안건의 결정 필요 사항 ④ 기관별 확인 요청 ⑤ 결정 기록란'},
 map:{label:'기관 연계·의뢰 계획',form:'표[필요 영역/자원 유형/의뢰 전 확인 조건/역할 분담/학생·보호자 동의 확인]. 구체적 기관명은 실무자가 지역자원 지도에서 고른다는 전제로 쓰세요.'},
 record:{label:'통합사례관리 진행·점검 기록',form:'표[과정/현재 확인 상태/다음 행동/담당/기한/완료 근거]와 유지·조정·재사정·종결 검토 조건'},
 result:{label:'평가결과 해석 요약',form:'① 핵심 어려움 3가지 ② 현재 안전 ③ 강점 ④ 면담 확인 질문 5개 (A4 한 장 분량)'}
};

function glance(r){const s=r.summary;return ['사례관리 수준: '+s.level,'현재 안전: '+s.safety,'핵심 어려움: '+(s.keys.join(', ')||'두드러진 어려움 없음'),'응답 유형: '+r.code.name,'CORE 판단: '+r.title].join('\n');}
function evidence(r){return r.items.map(x=>x.n+'번 '+x.topic+': '+(x.value==='unknown'?'미상':x.value+'점')).join('\n');}

/* opts: {mode:'section'|'document', r, section, sectionTitle, sectionText, question, task, includeEvidence, redact}
   sectionText may carry narrative-based text only when the practitioner opted in on the panel. */
function prompt(o){
 const r=o.r;if(!r||!r.summary)throw Error('ASK_REPORT_REQUIRED');
 const redact=typeof o.redact==='function'?o.redact:x=>x;
 const q=String(o.question||'').trim();
 const out=[RULES,'','[해석지 요약]',glance(r)];
 if(o.mode==='document'){
  const t=TASKS[o.task]||TASKS.integrated;
  out[0]=RULES.replace('실무자가 고른 부분이며','전체이며');
  out.push('','[작성 요청]',t.label+'를 작성해 주세요.','양식: '+t.form);
  if(q)out.push('추가 요청: '+q);
  out.push('','[해석지 본문]',String(o.sectionText||D.text(r)));
 }else{
  out.push('','[지금 보고 있는 부분: '+(o.sectionTitle||'해석지')+']',String(o.sectionText||'').trim()||'(해당 부분의 내용은 서술기록에 기반해 이번 요청에서 제외했습니다.)');
  if(o.includeEvidence)out.push('','[근거 · 25문항 응답]',evidence(r));
  out.push('','[질문]',q||'이 부분을 실무에 적용하려면 무엇을 더 확인하고 어떻게 개입하면 좋을지 구체적으로 알려 주세요.');
 }
 out.push('','이 요청문에는 학생 이름·연락처·주소가 들어 있지 않습니다. 답변에서도 개인을 특정하지 마세요.');
 return redact(out.join('\n'));
}

const api=Object.freeze({VERSION,FAQ,TASKS,faqFor,answer,prompt});
if(node)module.exports=api;else root.OYAskModel=api;
})(typeof window!=='undefined'?window:globalThis);
