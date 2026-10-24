/* OY-RALS v5.0 local Korean narrative grounded composition. */
(function(root,factory){'use strict';const C=typeof module!=='undefined'&&module.exports?require('./oy-context-v5.js'):root.OYContextV5;const api=factory(C);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYResponseV5=api;})(typeof window!=='undefined'?window:globalThis,function(C){'use strict';const VERSION='5.0.0',ROLE={teacher:'교사','education-welfare':'교육복지사','social-worker':'사회복지사'};
function compose(p,topics,role='teacher'){if(!ROLE[role])role='teacher';const n=C.analyze(p.caseContext||'',topics),r=C.align(n,p.answers),lines=['[추가 사례정보 기반 사정 · '+ROLE[role]+' 검토안]'];if(!n.hasContext)return {version:VERSION,text:'추가 서술정보 없음. 기존 척도 및 한국어 응답을 그대로 사용합니다.',trace:[],abstain:true};
 if(n.safetyMentions.length)lines.push('안전 우선 검토: 보호·자해·성착취 등 안전 관련 표현의 발생 사실·현재 상황·학생의 안전을 직접 확인합니다. 신고·보호·응급 절차를 점수와 무관하게 검토합니다.');
 lines.push('사실과 자료상태: 입력한 글은 아직 검증되지 않은 참고정보입니다. 진술주체·발생시점·자료 출처를 확인한 뒤 기록을 확정합니다.');
 const chosen=[],seen=new Set();for(const c of n.links){if(c.status==='hypothetical')continue;if(seen.has(c.number))continue;seen.add(c.number);chosen.push(c);if(chosen.length===4)break;}
 for(const c of chosen){const s=p.answers[c.number-1];lines.push('문항 '+c.number+' ('+(s==='unknown'?'미상':s+'점')+'): '+c.topic+' / 서술상태 '+c.status+' / 인용: '+c.excerpt+' / 확인: '+c.verification+'.'+(c.status==='negative'?' 부정된 사실 자체를 긍정으로 확정하지 않습니다.':''));}
 if(r.conflicts.length)lines.push('대조 필요: '+[...new Set(r.conflicts.map(x=>x.item))].join('·')+'번. 문항 점수를 임의 변경하지 않고 서로 다른 시점·대상·정보원을 확인합니다.');
 if(r.needReview.length)lines.push('미상 문항 관련 진술: '+[...new Set(r.needReview.map(x=>x.item))].join('·')+'번. 서술만으로 대입하지 않습니다.');
 if(n.flags.some(f=>f.wish))lines.push('희망: 입력에 희망 표현이 있습니다. 실제 학생의 희망과 동의인지 직접 확인하고 목표로 조정합니다.');
 if(n.flags.some(f=>f.strength))lines.push('강점: 기록된 지지관계·능력·활동이 실제로 이용 가능한 보호요인인지 확인합니다.');
 if(n.flags.some(f=>f.service))lines.push('지원상태: 문의→의뢰→접수→서비스 제공→생활 변화의 다섯 단계를 구분합니다.');
 const actions={teacher:'학생과 안전하게 면담하고 출결·교실·관계·보호 담당자의 확인사항을 기록합니다.','education-welfare':'학교 내 지원과 지역기관 지원을 구분하고 동의·의뢰·접수·조정 주관자를 확인합니다.','social-worker':'사례사정·사례판정 검토 후 학생·가정의 욕구와 기존 자원, 단기·중기 목표 및 재사정 일정을 협의합니다.'};lines.push('첫 조치('+ROLE[role]+'): '+actions[role]);lines.push('유의: 척도 원점수·위기지원단계·신고의무 판단을 변경하지 않는 검토 초안입니다.');
 return {version:VERSION,text:lines.join('\n\n'),trace:chosen.map(x=>({item:x.number,claimId:x.claimId})),abstain:!chosen.length,source:'verbatim redacted and score-aligned; unverified'};}
return Object.freeze({VERSION,compose});});
