(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const C=node?require('./criteria.js'):root.YouthCriteria,S=node?require('./oy-score-v7.js'):root.OYScoreV7,R=node?require('./oy-response-v7.js'):root.OYResponseV7,CM=node?require('./casework-v7.js'):root.OYCaseManagementV7;
const roles=['teacher','education-welfare','social-worker'];let dataPromise;
const text=p=>String(typeof p?.caseContext==='string'?p.caseContext:p?.caseContext?.text||'').slice(0,5000);
function load(){if(!dataPromise)dataPromise=Promise.all(['topics-v45','spec-v4','knowledge-v6'].map(n=>node?Promise.resolve(require('./data/oy-upgrade/'+n+'.json')):fetch('./data/oy-upgrade/'+n+'.json',{credentials:'same-origin',cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('모델 자료 '+r.status);return r.json()}))).catch(e=>{dataPromise=null;throw e});return dataPromise;}
function build(p,data,role='teacher',query=''){
 if(!roles.includes(role))throw Error('지원하지 않는 역할입니다.');
 const input={...p,caseContext:text(p)},core=C.evaluate(p.answers,[2,3,3,3,2,2,3,3,2,2],!!p.explicit?.length,p.followups||{}),score=S.evaluate(input,data[0],data[1]),response=R.run(input,data[0],data[1],data[2],role,query),management=CM.suggest(input,{role,stage:'assessment',maxGoals:5});
 if(management.decision.source!=='existing-criteria-v2.2'||management.decision.title!==core.title||management.decision.urgent!==core.urgent||management.decision.knownTotal!==(core.incomplete?null:core.knownTotal))throw Error('CORE 판정 연결 불일치');
 const Synth=node?require('./case-synthesis-v71.js'):root.YouthSynthesis;
 return {synthesis:Synth?Synth.build(input):null,version:'7.1-integration-20261024',core,score,response,management,hasContext:!!input.caseContext.trim(),role,sourceRefs:[...new Set(response.trace.flatMap(t=>[t.id]))],safeSummary:'ICSI / K-CARR / ICMS V7.0 · 점수·안전판정은 CORE 유지 · 서술 결과는 화면 전용'};
}
async function analyze(p,role='teacher',query=''){return build(p,await load(),role,query);}
function answer(x,question){
 const m=x.management,r=x.response.structured,q=String(question||''),lines=[];if(x.synthesis&&/안전|보호|신고/.test(q))return '[안전·연락 경로 사정]\n\n'+x.synthesis.first+'\n\n'+x.synthesis.note.findings.filter(t=>/폭력|신고|연락/.test(t)).join('\n\n');
 if(/안전|보호|신고/.test(q))lines.push('[안전 확인]',...m.firstActions.slice(0,2));
 else if(/면담|질문/.test(q))lines.push('[첫 면담에서 확인할 것]',...(m.itemPlans.length?m.itemPlans.slice(0,4).map(a=>a.number+'번: '+a.verificationQuestion):m.draftGoals.filter(g=>g.reviewContext.length).slice(0,4).map(g=>g.domainName+': '+g.question)));
 else if(/근거|점수|교차|한계/.test(q))lines.push('[점수·서술 대조]',...x.score.notices.map(n=>notice(n)), 'ICSI 보조 가중값은 공식 점수·지원단계에 가산하지 않습니다.');
 else if(/계획|개입|목표|담당/.test(q))lines.push('[목표·역할·점검 제안]',...m.draftGoals.filter(g=>g.referenceItems.length).slice(0,3).map(g=>g.domainName+'\n단기: '+g.shortTerm+'\n장기: '+g.longTerm+'\n실행: '+g.firstAction+'\n점검: '+g.completionCriterion));
 else if(/자원|기관|권역/.test(q))lines.push('[연계 전 할 일]',...m.draftGoals.filter(g=>g.referenceItems.length).slice(0,3).map(g=>g.domainName+': '+g.coordination),'기관별 실제 주소·연락처와 거주 행정동 권역은 지원 연결지도에서 확인하세요.');
 else if(r)lines.push('[학생 상황 요약 · 사실확인 전]',r.summary.sentences,'[첫 행동]',m.firstActions[0],'[확인할 필요]',...m.draftGoals.slice(0,3).map(g=>g.domainName+': '+g.question));
 else lines.push('[첫 면담·협의]',...m.firstActions,'[검토할 영역]',...m.draftGoals.filter(g=>g.referenceItems.length).map(g=>g.domainName+': '+g.question));
 lines.push('학생 희망·동의·담당자·기한·서비스 개시는 아직 합의 또는 확인되지 않았습니다.');
 return lines.join('\n\n');
}
function notice(n){const names={SCORE_SAFETY_SIGNAL:'척도 안전 신호: 현재 안전·보호 절차 우선',NARRATIVE_SAFETY_MENTION:'서술의 안전 관련 언급: 시점·출처·현재 안전 직접 확인',SAFETY_UNRESOLVED:'안전 관련 미상·추가확인 남음',INCOMPLETE_ASSESSMENT:'미상 응답: 전체 판단 보류',NOTE_SCORE_CONFLICT:'서술·점수 차이: 같은 시점·사건인지 확인',NOTE_UNKNOWN:'서술 언급 문항의 점수는 미상 유지',CONTACT_SAFETY_REQUEST:'보호자 연락 전 학생 의사와 안전성 확인',POTENTIAL_OVERLAP:'같은 문장에 복수 주제: 독립 증거·인과로 확정하지 않음'};return (names[n.code]||n.code)+(n.items?.length?' ('+n.items.join('·')+'번)':'');}
const api={load,build,analyze,answer,notice,text,roles};if(node)module.exports=api;else root.YouthModelsV7=api;
})(typeof window!=='undefined'?window:globalThis);
