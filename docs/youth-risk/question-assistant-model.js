/* Question-led local guidance. No LLM, network, persistence or score mutation. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,S=node?require('./case-synthesis-v71.js'):root.YouthSynthesis;
const roles={teacher:'교사','education-welfare':'교육복지사','social-worker':'사회복지사'};
const names=['아동학대·보호','학교폭력·또래 안전','자해·정서·정신건강','학습·출결','행동·건강 안전','장애·발달 및 접근성','가족·돌봄','경제·주거','관계·지지체계','디지털·온라인 안전'];
const intents={
 cooperation:{title:'보호자가 협력을 거부할 때',query:'보호자가 개입을 거부할 때 어떻게 협력하나요?',areas:[0,6],answer:'거부 이유와 학생에게 필요한 지원을 나누어 확인합니다. 보호자의 비협조만으로 학대나 방임을 확정하지 않습니다. 학생의 현재 안전을 먼저 확인하고, 가능한 학교 지원과 협의 경로를 구체화합니다.',steps:['연락의 안전성과 학생의 희망을 확인한 뒤, 보호자가 거절한 대상이 상담·가정방문·정보공유 중 무엇인지와 부담·불신·시간 제약을 구분해 기록합니다.','안전한 연락이 가능한 경우 짧은 통화·학교 면담 등 선택지를 제시하고, 학생에게 필요한 지원 한 가지부터 설명합니다. 반복 연락이나 설득으로 학생의 위해가 커지지 않도록 합니다.','협력 가능한 범위·보류한 내용·대체 지원·다음 확인일을 남깁니다. 현재 위해나 보호 공백이 있으면 일반적인 동의 요청과 필요한 보호절차를 구분해 담당자와 검토합니다.'],ask:['어떤 지원이 부담스럽거나 동의하기 어려우신가요?','학생이 원하는 도움 중 지금 함께 할 수 있는 한 가지는 무엇인가요?'],check:'협력 가능한 지원 한 가지, 안전한 연락 담당·방법, 다음 확인일이 정해졌는지 확인합니다.',talk:'“걱정되시거나 부담스러운 부분을 먼저 듣고 싶습니다. 학생이 학교에서 덜 힘들도록 도울 방법 한 가지만 함께 정해 볼 수 있을까요?”'},
 safety:{title:'안전과 연락 경로 확인',query:'현재 안전과 보호자 연락 전 확인할 것은 무엇인가요?',areas:[0,1,2,9],answer:'점수보다 현재의 위해·접촉·보호 상황을 먼저 확인합니다. 이미 신고했다는 사실만으로 안전이 확보되었다고 보지 않습니다.',steps:['학생이 지금 있는 장소·함께 있는 사람·최근 위해와 안전하게 연락할 상대를 직접 확인합니다.','보호자 연락으로 추가 위해가 생길 가능성을 확인하고 학교 보호 담당 및 사안별 담당기관과 연락·인계 방식을 조정합니다.','필요한 보호·응급·신고 절차를 일반 상담 일정과 구분하고, 실제 조치 여부와 후속 안전 확인 담당을 기록합니다.'],ask:['지금 안심하고 있을 수 있는 곳과 연락할 사람이 있나요?','누구에게 어떤 방식으로 연락하면 안전할까요?'],check:'현재 보호 장소·안전한 연락망·인계 여부·다음 안전 확인 담당을 확인합니다.'},
 treatment:{title:'치료와 학교생활 지원 구분',query:'치료 중에도 수업에서 어려움이 지속될 때 무엇을 하나요?',areas:[3,4,5],answer:'진단·복약에 관한 보고와 실제 수업 참여를 구분해 확인합니다. 현재 정보만으로 약물 효과 부족이나 행동의 원인을 확정할 수 없습니다.',steps:['진료·복약의 확인 출처와 학교에서 어려운 장면을 나누어 기록합니다. 약물 변경·중단을 권고하지 않습니다.','과제량·설명 방식·좌석·자극·휴식·피드백 중 조정할 조건을 정하고 전후 수업 참여를 관찰합니다.','학생·보호자와 안전한 정보공유 범위를 확인한 뒤 학교 관찰자료를 담당 진료·교육지원 담당과 검토합니다.'],ask:['어떤 수업·과제에서 가장 어렵고 어떤 설명이 도움이 되나요?','이미 제공한 조정과 실제로 도움이 된 방식은 무엇인가요?'],check:'조정 제공 여부·행동 발생 장면·수업 참여 변화와 진료 담당의 검토 경과를 나누어 확인합니다.'},
 interview:{title:'첫 면담에서 확인할 질문',query:'학생 면담에서 먼저 무엇을 질문하나요?',areas:[],answer:'학생이 바라는 변화부터 듣고, 현재 안전·하루 일과·도움이 된 경험을 확인합니다. 미상 문항은 점수를 대신 정하지 않고 확인 과제로 남깁니다.',steps:['안전하게 말할 수 있는 공간과 설명 범위를 안내하고 학생이 원하는 도움을 먼저 듣습니다.','아래 근거에 나타난 어려움이 언제·어떤 장면에서 생기는지, 이미 도움이 된 방법과 신뢰할 사람을 확인합니다.','학생이 동의한 다음 행동 한 가지와 담당·확인일을 협의합니다.'],ask:['요즘 하루 중 가장 힘든 때와 조금 편안한 때는 언제인가요?','지금 가장 먼저 달라졌으면 하는 것은 무엇인가요?','이미 도움이 되었던 사람이나 방법은 무엇인가요?'],check:'학생의 우선욕구·강점·안전한 지지인·합의한 다음 행동을 기록합니다.'},
 plan:{title:'지금 실행할 지원 정하기',query:'단기목표와 역할별 실행·점검을 어떻게 정하나요?',areas:[],answer:'우선욕구 한 가지를 골라 누가 무엇을 언제까지 하고 어떤 변화를 확인할지 정합니다. 전체 서비스계획은 사례협의·실행계획 문서에서 한 번에 확인합니다.',steps:['현재 안전과 시급한 생활 공백을 먼저 확인하고 학생이 원하는 변화를 한 가지로 좁힙니다.','현재 상태를 기록한 뒤 단기목표·실행 담당·첫 확인일을 실제 협의로 정합니다.','문의·의뢰·접수·서비스 시작과 생활 변화를 구분하여 점검합니다. 합의되지 않은 담당·일정을 확정값으로 쓰지 않습니다.'],ask:['이번 주에 가장 먼저 달라지면 좋을 일은 무엇인가요?','누가 어떤 도움을 주면 실행할 수 있을까요?'],check:'실제 담당자·첫 점검일·변화 확인 방법의 합의 여부를 확인합니다.'},
 resource:{title:'자원 연계 전 확인',query:'행정동과 복지관 권역에 맞는 자원을 어떻게 연결하나요?',areas:[],answer:'학생의 필요·희망과 실제 이용 조건을 확인한 뒤 기관에 문의할 내용을 정합니다. 기관 추천은 서비스 수락이나 제공 확정이 아닙니다.',steps:['학생이 원하는 도움과 이미 이용 중인 지원을 확인하여 중복·공백을 나눕니다.','선택한 행정동의 복지관 권역과 기관별 대상·관할·비용·대기·접수 조건은 지원 연결지도에서 확인합니다.','안전한 정보공유 범위와 의뢰 담당을 협의하고, 문의 이후 실제 접수·지원 개시까지 후속 확인합니다.'],ask:['이미 받고 있는 도움과 아직 연결되지 않은 도움은 무엇인가요?','비용·이동·시간·대기 중 이용을 막는 조건이 있나요?'],check:'문의·의뢰·접수·지원 시작 단계와 후속 확인 담당을 기록합니다.'},
 evidence:{title:'판단 근거와 남은 정보',query:'문항·점수와 서술을 어떻게 대조하나요?',areas:[],answer:'문항 응답과 입력한 서술은 서로 다른 정보원으로 대조합니다. 동시 응답만으로 인과관계를 확정하거나 서술을 점수에 가산하지 않습니다.',steps:['아래 문항의 내용·선택 점수와 실제 관찰·진술의 출처·시점을 대조합니다.','같은 사건이 여러 문항에 반영되었는지와 점수·서술의 차이가 있는지 확인합니다.','미상은 0점으로 추정하지 않습니다. 확인 담당·방법·날짜를 정한 뒤 평가를 다시 검토합니다.'],ask:['누구에게 언제 확인한 내용인가요?','같은 사건을 여러 문항에 표시했나요, 서로 다른 어려움인가요?'],check:'새로 확인한 정보의 출처·시점과 재평가 여부를 남깁니다.'},
 overview:{title:'현재 상황을 함께 이해하기',query:'현재 학생의 종합 사정과 우선 도움은 무엇인가요?',areas:[],answer:'현재 보고된 생활상의 어려움과 학생의 우선욕구를 함께 살펴봅니다. 입력 정보에 따른 사정 초안이며 진단·원인·실제 서비스 이행은 별도 확인이 필요합니다.',steps:['현재 안전과 학생이 먼저 원하는 도움을 확인합니다.','아래 응답 근거와 입력 서술을 대조하여 가장 큰 생활상의 어려움과 환경 조정 가능성을 살핍니다.','우선 지원 한 가지와 담당·다음 확인일을 학생과 협의합니다.'],ask:['지금 가장 도움이 필요한 일은 무엇인가요?','어떤 환경이나 사람이 있으면 조금 편안해지나요?'],check:'학생의 우선욕구와 먼저 할 일·담당·다음 확인일을 정합니다.'}
};
const topicRules=[[/학습|출결|수업|등교|결석|학업/,[3,5]],[/돌봄|가족|양육/,[6,7]],[/경제|주거|생활비|급식|끼니|체납/,[7]],[/또래|학교폭력|괴롭힘|따돌림/,[1,8]],[/장애|발달|접근성|편의/,[5]],[/정서|불안|수면|우울|상담/,[2,8]],[/디지털|온라인|게임|SNS/,[9]],[/관계|지지|친구/,[8]],[/행동|충동|건강/,[4]]];
function route(question){const q=String(question||'').trim();if(!q)return {id:'empty'};
 if(/(?:부모|보호자|가족).{0,20}(?:거부|거절|비협조|동의하지|협력하지)|(?:거부|비협조).{0,15}(?:부모|보호자)|개입\s*거부/.test(q))return {id:'cooperation'};
 if(/안전|보호(?!자)|신고|학대|자해|자살|폭력|응급|위해|보복/.test(q))return {id:'safety'};
 if(/ADHD|복약|복용|약물|투약|치료|진단/i.test(q))return {id:'treatment'};
 if(/기관|연계|자원|권역|행정동|지역/.test(q))return {id:'resource'};
 if(/근거|점수|교차|한계|가중|미상|문항/.test(q))return {id:'evidence'};
 if(/면담|질문|묻|물어/.test(q))return {id:'interview'};
 const areas=[...new Set(topicRules.filter(([re])=>re.test(q)).flatMap(([,ids])=>ids))];
 if(/계획|개입|목표|담당|실행|점검/.test(q))return {id:'plan',areas};
 if(areas.length)return {id:'topic',areas};
 if(/종합|사정|요약|상황|도움|이해/.test(q))return {id:'overview'};
 return {id:'unsupported'};
}
function roleTask(id,role){const cooperative=id==='cooperation';return ({teacher:cooperative?'학교에서 가능한 수업·생활 지원을 먼저 정리하고, 안전한 연락 담당을 한 명으로 조정합니다. 관찰한 장면과 보호자에게 제안·보류된 지원을 구분해 기록합니다.':'교실·출결·관계의 구체적 장면을 관찰하고 학교에서 실행할 조정과 교내 협의 담당을 정합니다.','education-welfare':cooperative?'학생 의사와 안전한 연락 범위를 확인해 학교·가정·지역기관의 협의 창구를 정합니다. 보호자가 수용 가능한 지원과 지역 연계의 접수·개시를 이어서 확인합니다.':'학교·가정·지역기관 사이의 지원 공백과 중복을 확인하고, 학생 동의·안전한 정보공유 범위 및 접수 후 지원 개시를 조정합니다.','social-worker':cooperative?'보호자의 거부 이유·양육 여건과 실제 돌봄 공백을 사정하고 대체 지원을 검토합니다. 학교·보호 담당기관과 책임 범위·후속 점검을 나누되 동의·서비스 수락을 임의로 확정하지 않습니다.':'생활 욕구·강점·기존 서비스와 이용 장벽을 사정하고 공동사례관리의 역할·의뢰·서비스 이행 및 재사정을 조정합니다.'})[role];}
function build(payload,question,role='teacher',opts={}){
 if(!roles[role])throw Error('사용할 역할을 다시 선택해 주세요.');
 const formulation=(node?require('./case-formulation-v72.js'):root.YouthFormulation)?.build(payload,{role});
 const x=S.build(payload),intent=opts.intent||route(question),base=intents[intent.id]||intents.overview;
 if(['empty','unsupported'].includes(intent.id))return {version:'7.2-question',intent:intent.id,role,title:intent.id==='empty'?'질문을 입력해 주세요':'질문의 범위를 좁혀 주세요',answer:'이 기능은 학생 지원에 관한 정해진 주제의 근거·행동을 정리하는 로컬 규칙 기반 도구입니다. 아래 질문 유형을 선택하거나 학생 지원에서 궁금한 내용을 구체적으로 적어 주세요.',steps:[],questions:[],evidence:[],context:[],limits:[],canonical:''};
 const ids=intent.areas?.length?intent.areas:base.areas,areas=ids.length?x.areas.filter(g=>ids.includes(g.i)):x.active.slice(0,3);
 const evidence=areas.flatMap(g=>g.ids.filter(k=>payload.answers[k-1]>0||payload.answers[k-1]==='unknown').map(k=>({number:k,label:S.labels[k-1],value:payload.answers[k-1]})));
 let answer=base.answer,title=base.title,steps=base.steps.slice(),questions=base.ask.slice();
 if(intent.id==='topic') {title=ids.map(i=>names[i]).join(' · ')+' 지원';answer=areas.filter(g=>g.positive.length).map(g=>g.meaning).join(' ')||'질문에 해당하는 영역에서 보고된 어려움이 없거나 미상입니다. 질문 자체를 사례의 사실로 처리하지 않고 실제 장면·출처·현재 필요를 먼저 확인합니다.';steps=['학생이 어려워하는 구체적 장면과 원하는 변화를 확인합니다.','환경·설명·돌봄·자원 중 조정할 조건 한 가지와 담당을 정합니다.','제공한 지원과 실제 생활 변화, 다음 확인일을 구분해 기록합니다.'];questions=['언제·어떤 상황에서 가장 어렵고 이미 도움이 된 방법은 무엇인가요?','학생이 먼저 원하는 변화와 지원을 맡을 사람은 누구인가요?'];}
 if(intent.id==='overview'&&formulation)answer=formulation.paragraphs.join(' ')+' '+formulation.judgement;
 if(intent.id==='plan'&&formulation?.lead.length)steps=formulation.lead.map(g=>g.title+': '+g.action);
 const f=x.note.flags,safety=formulation?.safety||x.decision.urgent||f.violence||f.currentDanger;
 const priority=safety?(formulation?.first||x.first):null;
 if(intent.id==='cooperation'&&(f.violence||f.contactViolence||formulation?.v8?.contactHazard)){answer='입력 서술에 폭력 또는 연락에 따른 위해 우려가 있어 보호자 설득보다 학생 보호와 안전한 연락 경로 확인이 우선입니다. 거부 이유의 사정과 보호절차의 이행 여부는 구분하여 검토합니다.';steps[0]='통상적인 보호자 재연락을 먼저 하지 않고 학생의 현재 위치·최근 위해·안전한 연락 상대와 담당기관의 실제 보호조치를 확인합니다.';}
 if(formulation?.v8&&intent.id==='interview')questions=formulation.v8.questions.slice(0,4);
 if(formulation?.v8&&intent.id==='safety'){steps=formulation.lead.filter(g=>g.safety).map(g=>g.action);if(!steps.length)steps=base.steps.slice();}
 const context=opts.includeContext===false?[]:(formulation?.v8?formulation.context:x.note.findings.concat(x.contextAnalysis)).slice(0,7);
 const limits=['질문은 확인된 사례 사실로 추가하지 않습니다. 입력 진술·척도 응답·해석을 구분합니다.',x.decision.incomplete?'미상 '+x.decision.unknownItems.length+'문항 · 전체 점수와 지원 수준 확정은 보류합니다.':'척도 점수·기존 안전판정은 이 답변으로 변경하지 않습니다.'];
 return {version:formulation?.v8?'8.0-question':'7.2-question',intent:intent.id,role,title,answer,priority,steps,questions,talk:base.talk||'',roleTask:roleTask(intent.id,role),check:base.check,evidence,context,limits,canonical:base.query,areas:ids};
}
const esc=S.esc;
function html(r){const list=a=>'<ol>'+a.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>';return '<header><span class="question-result-tag">'+esc(roles[r.role])+' · 검토 초안</span><h3>'+esc(r.title)+'</h3><p class="question-direct"><strong>'+esc(r.answer)+'</strong></p></header>'+(r.priority?'<aside class="question-priority"><strong>안전 우선</strong><p>'+esc(r.priority)+'</p></aside>':'')+(r.steps.length?'<section><h4>먼저 할 일</h4>'+list(r.steps)+'</section><section class="question-role"><h4>'+esc(roles[r.role])+'가 할 일</h4><p>'+esc(r.roleTask)+'</p></section><section><h4>면담·협의에서 물어볼 것</h4>'+list(r.questions)+(r.talk?'<blockquote>'+esc(r.talk)+'</blockquote>':'')+'</section><section><h4>다음 점검</h4><p>'+esc(r.check)+'</p></section>':'')+(r.context.length?'<details data-local-context="true"><summary>입력 서술을 반영한 사정 · '+r.context.length+'개 단서</summary>'+r.context.map(t=>'<p>'+esc(t)+'</p>').join('')+'</details>':'')+(r.steps.length?'<details><summary>이번 답변의 문항 근거·확인할 정보</summary>'+(r.evidence.length?'<ul>'+r.evidence.map(e=>'<li><b>'+e.number+'번 · '+esc(e.label)+'</b> — '+(e.value==='unknown'?'미상':e.value+'점')+'</li>').join('')+'</ul>':'<p>해당 주제의 양성 응답·미상 근거가 없습니다. 질문만으로 어려움이 있다고 단정하지 않습니다.</p>')+r.limits.map(t=>'<p>'+esc(t)+'</p>').join('')+'</details>':'');}
function text(r){return ['['+r.title+' · '+roles[r.role]+' 검토 초안]',r.answer,r.priority?'안전 우선: '+r.priority:'',r.steps.length?'[먼저 할 일]\n'+r.steps.map((t,i)=>(i+1)+') '+t).join('\n'):'',r.roleTask?'['+roles[r.role]+'가 할 일]\n'+r.roleTask:'',r.questions.length?'[확인 질문]\n'+r.questions.join('\n'):'',r.talk,r.check?'[다음 점검]\n'+r.check:'',r.context.length?'[입력 서술 반영 · 미확인 진술]\n'+r.context.join('\n'):'',r.evidence.length?'[문항 근거]\n'+r.evidence.map(e=>e.number+'번 '+e.label+' · '+(e.value==='unknown'?'미상':e.value+'점')).join('\n'):'',...r.limits].filter(Boolean).join('\n\n');}
const api={roles,route,build,html,text};if(node)module.exports=api;else root.YouthQuestionAssistant=api;
})(typeof window!=='undefined'?window:globalThis);
