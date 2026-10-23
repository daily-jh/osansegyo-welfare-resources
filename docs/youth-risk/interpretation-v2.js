(function(root){'use strict';
const DATA=typeof module!=='undefined'&&module.exports?require('./interpretation-v2-data.js'):root.YouthInterpretationData;
const C=typeof module!=='undefined'&&module.exports?require('./criteria.js'):root.YouthCriteria;
const PRACTICE=typeof module!=='undefined'&&module.exports?require('./case-practice-v2-data.js'):root.YouthPracticeData;
const sizes=[2,3,3,3,2,2,3,3,2,2],safety=[1,2,7,25];
const care=['안전','건강','일상생활 유지','가족관계','사회적 관계','경제','교육','고용','생활환경','법률·권익보장'];
const crosswalk=[[0,3,9],[0,4,6,9],[1,0,4,6],[6,2,4,3],[1,0,3,9],[6,1,2,9],[3,2,5,1],[5,8,2,6],[4,3,6,9],[0,4,9,6]];
function analyze(p,role='teacher'){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25||Array.from(p.answers).some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항의 점수·미상을 확인해 주세요.');
 if(!['teacher','social-worker'].includes(role))throw Error('검토 관점을 확인해 주세요.');
 const a=p.answers,decision=C.evaluate(a,sizes,!!p.explicit?.length,p.followups||{}),questions=p.domains?.flatMap(x=>x.items)||[];
 const facts=a.flatMap((v,i)=>typeof v==='number'&&v>0?[{number:i+1,score:v,question:questions[i]||'문항 '+(i+1)}]:[]);
 const available=DATA.pairs.filter(row=>row.items.every(n=>typeof a[n-1]==='number'&&a[n-1]>0));
 available.sort((x,y)=>Number(y.items.some(n=>safety.includes(n)))-Number(x.items.some(n=>safety.includes(n)))||Math.min(...y.items.map(n=>a[n-1]))-Math.min(...x.items.map(n=>a[n-1]))||y.items.reduce((s,n)=>s+a[n-1],0)-x.items.reduce((s,n)=>s+a[n-1],0)||x.id.localeCompare(y.id));
 // Prefer distinct support themes so a broad profile does not repeat the same template.
 const seen=new Set(),selected=[];for(const row of available){if(seen.has(row.group))continue;seen.add(row.group);const g=DATA.groups[row.group];selected.push({id:row.id,items:row.items.slice(),domains:g.domains.slice(),evidence:row.items.map(n=>n+'번 '+a[n-1]+'점').join(' + '),hypothesis:g.hypothesis,questions:g.questions.slice(),status:DATA.status,sourceVersion:DATA.sourceVersion});if(selected.length===3)break;}
 const unknown=a.flatMap((v,i)=>v==='unknown'?[i+1]:[]);
 let offset=0;const careNeeds=sizes.flatMap((count,i)=>{const ns=Array.from({length:count},(_,k)=>offset+k+1);offset+=count;return ns.some(n=>a[n-1]>0)?[{domain:p.domains?.[i]?.name||'영역 '+(i+1),items:ns.filter(n=>a[n-1]>0),careDomains:crosswalk[i].map(n=>care[n])}]:[]});
 const practiceCards=PRACTICE.cards.filter(r=>PRACTICE.pool[r.group]==='25문항별 사례관리 심화'&&r.items.some(n=>a[n-1]>0)).sort((x,y)=>Number(y.items.some(n=>safety.includes(n)))-Number(x.items.some(n=>safety.includes(n)))||Math.max(...y.items.map(n=>a[n-1]))-Math.max(...x.items.map(n=>a[n-1]))).slice(0,3).map(r=>({id:r.id,items:r.items.slice(),title:PRACTICE.pool[r.title],core:PRACTICE.pool[r.core],questions:PRACTICE.pool[r.questions],action:PRACTICE.pool[r.action],model:PRACTICE.pool[r.model],measure:PRACTICE.pool[r.measure]}));
 const first=decision.urgent?'현재 안전과 보호 여건을 직접 확인하고 필요한 보호·신고·긴급 대응을 먼저 진행합니다.':decision.safetyUnknown.length||decision.pendingChecks.length?'현재 안전의 미확인 내용을 먼저 살피고, 확인된 생활 지원을 함께 진행합니다.':facts.length?'학생이 가장 먼저 바라는 변화와 실제 생활의 어려움을 확인하고, 담당자·첫 행동·다음 확인일을 정합니다.':'학생이 바라는 도움과 강점·지지관계를 열린 질문으로 확인합니다.';
 return {version:DATA.version,sourceVersion:DATA.sourceVersion,sourceSha256:DATA.sourceSha256,decision,facts,unknown,careNeeds,practiceCards,pairs:selected,matchedCount:available.length,first,roles:role==='teacher'?'학교: 학생 면담·교육환경 조정·안전한 보호자 소통 / 지역기관: 실제 접수·지원 가능 여부 회신':'사례관리 담당: 사정·계획·기관 간 역할 조정 / 학교·기관: 실제 수행과 회신 담당 협의',plan:DATA.plan,followup:DATA.followup,missing:'학생의 희망·합의 목표·기준선·기존 서비스·실제 접수·생활변화는 면담과 기록으로 확인합니다.'};
}
function practiceText(x){return x.practiceCards.length?'\n[문항별 사례관리 보완]\n'+x.practiceCards.map(c=>c.id+' · '+c.title+'\n사정: '+c.core+'\n실행: '+c.action+'\n모델 검토: '+c.model+'\n점검: '+c.measure).join('\n\n'):'';}
function text(p,role='teacher'){
 const x=analyze(p,role);return '[문항쌍 해석 · 한국어 사례해석모델 v2.0]\n'+(x.pairs.length?x.pairs.map(g=>g.id+' · '+g.evidence+'\n확인 가설: '+g.hypothesis+'\n면담 질문: '+g.questions.join(' / ')).join('\n\n'):'현재 확인된 응답에서 두 문항이 함께 양성인 조합은 없습니다.')+'\n첫 행동: '+x.first+'\n역할: '+x.roles+'\n미확인: '+(x.unknown.length?x.unknown.join('·')+'번 미상. ':'')+x.missing+'\n계획: '+x.plan+'\n변화 점검: '+x.followup+'\n근거: 사용자 제공 2차 연구원고 700쪽·문항쌍 300개 중 실제 응답 조합을 검색한 개발가설입니다.'+practiceText(x);
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function html(p,role='teacher'){
 const x=analyze(p,role);return '<section class="v2-interpretation"><div class="v2-section-label">한국어 사례해석모델 v2.0</div><h3>응답을 연결해서 살펴볼 내용</h3><p>'+esc(x.first)+'</p>'+(x.pairs.length?x.pairs.map(g=>'<details class="v2-pair"><summary>'+esc(g.evidence)+' · 함께 확인할 질문</summary><p><b>해석 가설</b> '+esc(g.hypothesis)+'</p><ul>'+g.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul><small>근거 '+esc(g.id)+' · '+esc(g.sourceVersion)+' · 현장 검증 전</small></details>').join(''):'<p>현재 응답에서 함께 해석할 문항쌍은 없습니다.</p>')+(x.practiceCards.length?'<details><summary>관련 문항의 사례관리 질문·역할</summary>'+x.practiceCards.map(c=>'<h4>'+esc(c.title)+'</h4><p>'+esc(c.action)+'</p><p>'+esc(c.measure)+'</p><small>'+esc(c.id)+'</small>').join('')+'</details>':'')+'<details><summary>계획·역할·점검에 반영할 내용</summary><p>'+esc(x.roles)+'</p><p>'+esc(x.plan)+'</p><p>'+esc(x.followup)+'</p><p>'+esc(x.missing)+'</p></details></section>';
}
const api={version:DATA.version,analyze,text,html,metadata:{sourceVersion:DATA.sourceVersion,sourceSha256:DATA.sourceSha256,pairCount:DATA.pairCount,sourcePages:DATA.sourcePages,uniqueTemplates:DATA.groups.length,practiceCards:PRACTICE.recordCount,manuscriptSha256:PRACTICE.manuscriptSha256,manuscriptPageMarkers:PRACTICE.manuscriptPageMarkers}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthInterpretation=api;
})(typeof window!=='undefined'?window:globalThis);
