/* Shared case formulation expansion: no UI, scoring, persistence or network. */
(function(root){'use strict';
const VERSION='1.1.0-once-20261027';
const LENSES=["보호·안전의 어려움은 학생이 도움을 요청하거나 집과 학교 사이를 이동하는 방식에도 영향을 줄 수 있습니다. 실제 위해와 현재 보호상태를 먼저 확인하고, 신고·접수의 언급만으로 안전이 확보되었다고 해석하지 않습니다.","또래 피해, 협박·강요, 상호 갈등은 필요한 대응이 다릅니다. 학생이 피하려는 장소·사람·온라인 접촉이 있는지 살피고, 갈등 해결을 이유로 안전하지 않은 대면이나 화해를 먼저 요구하지 않습니다.","정서의 어려움은 수면·집중·활동·도움 요청의 변화와 함께 이해할 필요가 있습니다. 겉으로 수업에 참여하거나 성적을 유지한다는 이유만으로 고통이 작다고 해석하지 않으며, 자해 관련 응답은 정서 총합과 별개로 현재 안전을 확인합니다.","출결과 학습의 어려움은 수업 난도·설명 방식·등교 준비·또래 환경 등 여러 조건에서 나타날 수 있습니다. 결석이나 과제 미완료를 의지 부족으로 곧바로 설명하지 않고, 학생이 참여할 수 있었던 날과 어려웠던 날의 차이를 비교합니다.","위험행동과 건강 위기는 각각 행동 전후의 장면과 현재 몸 상태를 확인해야 합니다. 반복 행동을 진단명으로 대체하지 않고, 의료적 판단과 교실·생활에서 제공할 조정을 구분합니다.","교육환경 조정과 발달지원 접근성은 학생 개인의 능력만이 아니라 실제 설명·보조지원·환경의 적합성을 함께 살펴야 합니다. 필요한 조정이 제공되었는지, 제공되어도 이용하기 어려운 장벽이 있는지를 구분하며 진단을 추정하지 않습니다.","기본 돌봄의 공백, 가족 환경의 어려움, 학생의 가족돌봄 부담은 서로 다른 문항입니다. 가족이 함께 산다는 사실과 실제 돌봄 가능성은 다르고, 가사·돌봄 참여가 있다는 사실만으로 과도한 책임을 단정할 수도 없습니다. 하루 시간표와 대체 가능한 성인 지원을 확인합니다.","필수생활 결핍·주거 환경·서비스 비용 장벽은 필요한 지원 경로가 다릅니다. 식사·물품 부족, 안전하게 머물 공간, 필요한 서비스의 미이용을 나누어 확인하고, 한 문항의 응답으로 체납·퇴거·방임 등 보고되지 않은 사건을 덧붙이지 않습니다.","사회참여의 제약과 지지관계 부족은 원하는 관계의 형태와 도움 접근성에서 구분해 살펴봅니다. 혼자 있는 선택을 고립으로 단정하지 않고, 학생이 원할 때 연결될 사람·장소·활동이 실제로 있는지 확인합니다.","디지털 생활 조절의 어려움과 온라인 피해는 구별해야 합니다. 피해·협박이 보고된 경우 이용시간 조절보다 접촉 안전과 보호를 우선하며, 기기 사용 자체가 학생의 지지관계나 도움 요청 경로일 가능성도 함께 확인합니다."];
function enrich(p,a){
 if(a.interpretationArchitecture?.version===VERSION)return a;
 const s=a.semantic?.base?.items||[],probe=n=>s.find(x=>x.id===n)?.verify||[];
 const rows=a.domains.map(d=>{
 const positive=d.numbers.filter(n=>Number.isInteger(p.answers[n-1])&&p.answers[n-1]>0),unknown=d.numbers.filter(n=>p.answers[n-1]==='unknown');
 const basis=d.numbers.map(n=>n+'번 '+(p.answers[n-1]==='unknown'?'미상':p.answers[n-1]+'점')).join(' · ');
 const evidenceIds=d.numbers.map(n=>'Q'+String(n).padStart(2,'0'));
 const paragraphs=['【'+d.name+' · 응답 근거】'+basis+'입니다. '+(unknown.length?'미상 '+unknown.join('·')+'번은 어려움이 없다는 뜻이 아니므로 영역 전체의 정도는 보류합니다.':'이번 응답에서 확인된 합계는 '+d.sum+'/'+d.numbers.length*4+'점입니다.')];
 if(positive.length){
 paragraphs.push('【이 영역을 이해하는 관점】'+LENSES[d.i]);
 const ranked=positive.slice().sort((x,y)=>p.answers[y-1]-p.answers[x-1]||x-y);
 paragraphs.push('【응답의 의미】'+ranked.map(n=>{const item=s.find(x=>x.id===n);return n+'번 '+p.answers[n-1]+'점은 '+(item?.topic||d.name)+'에서 어려움이 보고되었다는 근거입니다.'}).join(' ')+'');
 const questions=[...new Set(ranked.flatMap(probe))].slice(0,4);
 paragraphs.push('【추가 사정】'+(questions.length?questions.join(' / '):'어려움이 있었던 최근 장면, 시작 시점, 학생이 느낀 부담')+'을 확인합니다.');
 const plans=a.plans.filter(g=>g.domain===d.i);
 paragraphs.push('【지원과 변화 확인】'+(plans.length?plans.map(g=>g.action+' 변화 확인은 '+g.outcome+'을 중심으로 검토합니다.').join(' '):'원하는 도움과 현재 이용 중인 지원을 확인한 뒤 추가 계획의 필요성을 협의합니다.')+'');
 }else if(unknown.length){
 paragraphs.push('【해석을 유보할 부분】이 영역은 1점 이상으로 확인된 응답 없이 미상 문항이 남아 있습니다. 낮은 위험으로 분류하거나 자동 의뢰의 근거로 삼지 않습니다. 학생이 질문을 이해하기 어려웠는지, 답변하기 부담스러웠는지, 평가자가 아직 정보를 얻지 못했는지 안전한 방식으로 확인합니다. 확인된 다른 영역의 지원은 그동안 지연하지 않습니다.');
 }else return {domain:d.i,name:d.name,evidenceIds,positive,unknown,quiet:true,paragraphs:['【'+d.name+'】이번 응답에서 어려움이 보고되지 않았습니다.']};
 return {domain:d.i,name:d.name,evidenceIds,positive,unknown,paragraphs};
 });
 const patterns=(a.cieActions||[]).filter(x=>!['unknown','mismatch','narrative-safety'].includes(x.kind)).map(x=>({id:x.id,items:x.items,paragraphs:[
 '【함께 살펴볼 맥락】'+x.hypothesis,
 '【연결을 검토하는 이유】'+x.items.map(n=>n+'번 '+(p.answers[n-1]==='unknown'?'미상':p.answers[n-1]+'점')).join(' · ')+'이 같은 평가 시점에 보고되었습니다.',
 '【확인과 개입의 연결】'+x.verification+'을 검토합니다.'
 ]}));
 // Domains with nothing reported share one line, so the report does not repeat the same caveat per domain.
 const group=ids=>{const rs=rows.filter(r=>ids.includes(r.domain)),quiet=rs.filter(r=>r.quiet);
  return [...rs.filter(r=>!r.quiet).flatMap(r=>r.paragraphs),...(quiet.length?['【어려움이 보고되지 않은 영역】'+quiet.map(r=>r.name).join(' · ')+'. 보고되지 않았다는 것이 지원이 필요 없다는 결론은 아니므로, 학생이 유지하고 싶은 일상과 이미 도움이 되는 환경을 확인하고 이후 변화가 있으면 재사정합니다.']:[])];};
 const blocks={
 '현재 안전과 즉시 필요한 확인':[rows[0].paragraphs.join('\n\n'),'【점수와 안전의 구분】안전문항·추가 안전확인·명시적 위해 표시와 서술 단서는 별도로 확인합니다. 낮은 합계나 보호요인으로 안전 신호를 상쇄하지 않습니다. 현재 위치·위해·안전한 연락 경로·보호조치의 실제 이행을 확인하며, 보호자 연락의 안전성도 사안에 따라 검토합니다.'],
 '가족·돌봄·생활환경':group([6,7]),
 '학습·출결·교우·정서·건강':group([1,2,3,4,5,8,9]),
 '상황을 함께 이해하기 · 잠정 해석과 지도 방향':patterns.length?patterns.flatMap(x=>x.paragraphs):['【통합 해석의 범위】현재 정의된 교차 가설에 해당하는 근거가 충분하지 않습니다. 해석 분량을 채우기 위해 복합문제나 인과관계를 만들지 않습니다. 학생의 실제 생활 영향과 희망을 확인해 필요할 때 가설을 보완합니다.'],
 '학생의 말·희망·동기':['【학생 관점의 해석】지원자의 우선순위와 학생이 가장 부담스러워하는 일은 다를 수 있습니다. 먼저 바꾸고 싶은 하루의 장면, 받기 편한 도움, 원하지 않는 접촉·지원 방식을 직접 확인합니다. 표현을 망설이거나 지원을 거절하는 경우도 동기 부족으로 단정하지 않고 이전 경험·정보공유 부담·실행 여건을 살펴봅니다.'],
 '강점·보호요인·기존 지원':['【보호요인의 작동 확인】관심 활동이나 지지자가 언급되었다면 그것이 언제 실제 도움이 되었는지, 필요할 때 연락하거나 이용할 수 있는지 확인합니다. 단순한 관계의 존재와 실제 도움의 접근성은 다릅니다. 이용기관 언급도 문의·접수·실제 이용·성과로 구분하며, 확인되지 않은 강점은 질문으로 남깁니다.'],
 '종합사정 및 우선순위':['【우선순위의 논리】현재 안전 확인, 당장 충족되지 않은 필수생활, 학생이 바라는 변화와 실행 가능한 환경 조정을 함께 고려합니다. 여러 과제를 동시에 나열하기보다 학생과 합의할 초기 과제와 협력 담당을 구체화합니다. 점수에 따른 지원 방향은 실제 사례회의 결정·기관 수락·서비스 시작을 뜻하지 않습니다.'],
 '근거·미확인·확인 계획':['【해석할 때 지킬 원칙】점수의 높낮이는 확인할 주제를 정하는 단서이며 실제 사건·빈도·지속기간·기능 저하를 독립적으로 증명하지 않습니다. 학교와 가정에서 같은 어려움이 나타나는지, 특정 시간·관계·과제에서만 커지는지 대조하고, 환경의 요구가 맞지 않거나 도움을 요청하기 어려운 상황도 가능한 설명으로 둡니다. 원인을 학생의 성격·의지나 가족형태로 단정하지 않습니다. 함께 보고된 어려움이 서로 원인인지, 공통 환경 때문인지, 우연히 겹쳤는지는 면담으로 구분합니다. 학생의 설명과 학교 관찰 등 정보원을 구분하고, 기준선·목표·담당·기간은 사례회의에서 합의한 뒤 기록합니다. 개선되지 않으면 학생의 노력 부족으로 해석하기 전에 접근 장벽·지원 적합성·환경 변화를 재검토합니다.','【근거 추적과 재검토】25문항 응답, 서술 단서, 잠정 가설, 합의 전 제안을 구분합니다. 같은 입력을 해석하는 여러 모듈의 일치는 독립된 사실 확인이 아닙니다. 추가 정보로 해석이 바뀌어도 원응답을 자동 수정하지 않으며, 새 평가일의 근거와 수정 사유를 별도로 남깁니다.']};
 return {...a,sections:a.sections.map(section=>({...section,text:[section.text,...(blocks[section.title]||[])].join('\n\n')})),interpretationArchitecture:{version:VERSION,source:'CORE→ICSI→NCB/OY-CIE→기존 사례사정·계획·출력',domains:rows,patterns,limits:'규칙 기반 사정 가설 · 실증 타당도 미검증'}};
}
const api=Object.freeze({VERSION,enrich});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYCaseInterpretation=api;
})(typeof window!=='undefined'?window:globalThis);
