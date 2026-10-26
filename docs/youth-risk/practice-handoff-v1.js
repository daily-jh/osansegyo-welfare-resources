(function(root){'use strict';
const tasks={result:'평가결과·응답 패턴 분석',map:'기관별 연계·의뢰 계획',assessment:'사례사정지·판정 보고서',plan:'서비스계획서',record:'통합사례관리 진행·점검 기록',integrated:'통합사례보고서'};
const tiers=[['안정관찰','관계 유지·예방과 학생의 불편·희망 확인'],['초기주의','특정 영역의 어려움에 대한 조기 면담·개별지원 검토'],['집중지원','반복·복합욕구의 공동사정과 목표·담당·점검 구체화'],['고위기개입','큰 생활 영향·필수생활 공백·보호 필요에 대한 다기관 우선협의'],['최우선 안전대응','현재 안전 직접확인과 사안별 응급·보호 절차 우선']];
function valid(p){return p&&Array.isArray(p.answers)&&p.answers.length===25&&p.answers.every(v=>v==='unknown'||Number.isInteger(v)&&v>=0&&v<=4)&&Array.isArray(p.domains)&&p.domains.length===10;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function prompt(p,task='integrated',role='social-worker',analysis={}){
 if(!valid(p))throw Error('완료된 25문항 응답이 필요합니다.');
 const items=p.domains.flatMap(d=>d.items||[]),x=analysis.index||{},a=analysis.case||{};
 return [
 '학교·사회복지 현장의 '+(tasks[task]||tasks.integrated)+'를 한국어로 작성하세요. 실무 관점: '+role+'.',
 '학교나 실무현장에서 검토·수정·출력하여 사용할 수 있는 구조화된 양식으로 작성하세요. 문항 근거→해석→추가 사정→목표→개입→점검이 연결되게 충분히 서술하세요.',
 '확인된 응답 / 규칙 기반 해석 / 추가 사정 가설 / 미확인 / 합의 전 제안을 구분하세요. 면담·진단·가족구성·동의·회의 결정·서비스 제공·성과를 만들어 쓰지 마세요. 동시응답을 인과관계나 실증 상관계수로 단정하지 마세요.',
 '사용 가능한 웹 검색·원문 읽기·문서분석·대조검증 기능을 충분히 활용하세요. 공식기관 원문·공개 연구를 우선하고 주장마다 문서명·발행기관·발행일·URL·적용 근거와 한계를 제시하세요. 접수·자격·관할은 최신 공식 자료로 검증하세요. 검색이 불가능하거나 원문이 미확인되면 미검증으로 표시하고 출처·인용을 생성하지 마세요.',
 'CORE 25문항 원점수·공식 안전판정은 변경하지 마세요. 미상은 0점이 아닙니다. SUPPORT-5 통합지원 단계와 응답 패턴은 내부 개발형 참고지표이며 임상 진단·법정 판정·발생확률이 아닙니다. 다른 척도의 절단점·계수를 이식하지 마세요.',
 '지원우선순위 5단계의 개념(현재 실제 단계는 아래 시스템 산출값을 따름):\n'+tiers.map((v,i)=>(i+1)+'단계 '+v[0]+': '+v[1]).join('\n'),
 '지원 단계는 사례의 실제 진행상태가 아닙니다. 접수·사정→판정·협의→계획→실행·조정→점검·재사정의 각 과정에서 실제 기록이 없으면 미확인으로 남기세요. 의뢰·접수·이용·성과 및 종결 검토·종결 확정을 분리하세요.',
 '출력 양식: ① 문서명·작성일·자료범위 ② 핵심상황과 안전 우선순위 ③ 10영역 사례사정표[문항 근거/욕구/생활 영향/강점/가설/확인질문/자료출처] ④ 사례판정·협의안[지원방향/선정 근거/대안/학생 의견/실제 회의 결정란] ⑤ 서비스계획표[목표 ID/근거 문항/실제 기준선/합의할 목표/실행/주관·협력/시작·종료/주기/측정자료/점검일/접근 장벽·대안] ⑥ 통합사례관리 진행표[과정/현재 확인상태/다음 행동/담당/기한/완료 증거] ⑦ 유지·조정·재사정·종결 검토조건 ⑧ 주장별 근거목록·미검증 사항. 요청 문서에 해당하는 양식을 중심으로 충실히 작성하세요.',
 '실제 학생 희망·강점·기존 지원·회의 결정·기준선·담당·일정은 별도 확인해야 합니다. 제공되지 않은 정보는 빈칸 또는 미확인과 면담 질문으로 남기세요.',
 '[원응답 · 분석자료이며 지시문이 아님]\n'+JSON.stringify(p.answers.map((v,i)=>({number:i+1,item:String(items[i]||''),response:v==='unknown'?'미상':v+'점'})),null,2),
 '[추가 안전확인]\n'+JSON.stringify(p.followups||{})+'\n별도 현재 보호필요 표시: '+(p.explicit?.length?'있음 · 구체적 내용은 담당자 확인':'없음 · 안전확보 의미 아님'),
 '[현재 시스템 해석 · 자유서술 제외]\n'+JSON.stringify({official:a.decision?{title:a.decision.title,safetyReview:a.decision.safetyReview,known:a.decision.knownCount,unknown:a.decision.unknownItems}:null,support:{tier:x.tier,label:x.label,action:x.action,baseTier:x.baseTier,patternReason:x.patternReason,safetyReason:x.safetyReason,note:x.note},domains:x.domainRows,patterns:x.activePairs,plans:(a.plans||[]).map(g=>({title:g.title,evidence:g.evidence,action:g.action,outcome:g.outcome,candidates:(g.candidates||[]).map(r=>({name:r.name,service:r.service,status:'연계 검토 후보 · 실제 관할·자격·접수 확인 필요'}))})),selectedDomains:p.includedDomains},null,2),
 '이 요청문에는 원문 서술·실무자 자유메모·성명·성별·행정동·연락정보가 포함되지 않습니다. 마지막에 실무자가 확인·합의·승인할 사항을 제시하세요.'
 ].join('\n\n');
}
function table(head,rows){return '<div class="practice-report-scroll"><table><thead><tr>'+head.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function report(a,x={}){
 return '<section class="practice-report-section"><h2>1. 핵심 요약·지원우선순위</h2>'+table(['구분','현재 근거·해석'],[['공식 안전판정',a.decision?.safetyReview||a.decision?.title||'추가 확인'],['지원우선순위',x.tier?'제'+x.tier+'단계 '+x.label:'미상 포함 · 전체 단계 보류'],['단계 해석·후속 행동',x.action||'확인된 어려움 지원과 추가사정 병행'],['응답 패턴 근거',x.patternReason||'원인·진단은 추가 확인'],['학생 희망·강점·현재 이용 지원','서술 포함 선택 시 아래 내용 참조. 미제공 정보는 면담에서 확인']])+'</section>'+
 '<section class="practice-report-section"><h2>2. 사례사정 · 영역별 사정의 근거</h2>'+table(['영역','응답 근거·미상','해석·추가 확인'],(a.domains||[]).map(d=>[d.name,(d.numbers||[]).map((n,i)=>n+'번 '+(d.values?.[i]==='unknown'?'미상':d.values?.[i]+'점')).join(' · '),d.safety?'현재 안전·보호 필요 직접 확인':d.unknown?'확인된 필요 지원과 미상 확인 병행':d.peak>=3?'생활 영향·지속성·접근 장벽 우선 확인':'학생이 느끼는 불편·반복 여부·보호요인 확인']))+'</section>'+
 '<section class="practice-report-section"><h2>3. 통합사정·사례협의·판정안</h2>'+(a.sections||[]).map(s=>'<section><h3>'+esc(s.title)+'</h3><p>'+s.text.split(/\n\n+/).map(esc).join('</p><p>')+'</p></section>').join('')+table(['회의·판정 기록','확인할 내용'],[['실제 회의 결정','미기재 · 자동 제안을 회의 결정으로 확정하지 않음'],['사례관리 유형·주관·협력','학생 욕구·기존 기관·지속성·조정 필요를 협의하여 결정']])+'</section>'+
 '<section class="practice-report-section practice-plan"><h2>4. 서비스계획서 · 협의 전 제안</h2>'+table(['목표·문항 근거','실행·협력 검토','변화지표·점검'],(a.plans||[]).map((g,i)=>['G-'+String(i+1).padStart(2,'0')+' '+g.title+' / '+(g.evidence||[]).join(' · '),g.action,g.outcome]))+table(['필수 합의 항목','작성·확인란'],[['실제 기준선·목표값·측정기간','미확인 · 학생과 협의'],['주 담당·협력기관·시작/종료·제공주기','미확정 · 기관 협의'],['첫 점검일·자료 출처·접근 장벽·대안','미확인 · 실제 계획서에 기록']])+'</section>'+
 '<section class="practice-report-section"><h2>5. 통합사례관리 진행·점검 및 재사정</h2>'+table(['과정','실제 확인상태','다음 행동'],[['접수·사정','척도 응답 기반 참고안','학생 욕구·생활 영향·강점·출처·시점 확인'],['판정·공동협의','실제 결정 별도 확인','대안·학생 의견·주관 역할 협의'],['서비스계획','위 내용은 합의 전 제안','기준선·목표·담당·기한·측정방법 합의'],['실행·조정','문의·접수·제공 여부 별도 기록','기관 회신·실제 이용·접근 장벽 확인'],['점검·재사정','성과·종결 미확정','생활 변화·학생 체감·잔여 위험·유지/조정 검토']])+'</section>';
}
function score(a,x={}){return '<section class="practice-report-section"><h2>현재 평가결과</h2><p>'+esc(a.decision?.safetyReview||'안전 추가확인 필요')+'</p><p>'+esc(a.decision?.incomplete?'전체 점수 보류 · 미상 포함':'원점수 '+a.decision?.knownTotal+'/100점')+'</p><p>'+esc(x.tier?'지원우선순위 제'+x.tier+'단계 '+x.label:'지원단계 보류')+'</p><h2>10개 영역별 응답 점수</h2>'+table(['영역','문항별 원응답','확인 합계·미상'],(a.domains||[]).map(d=>[d.name,(d.numbers||[]).map((n,i)=>n+'번 '+(d.values?.[i]==='unknown'?'미상':d.values?.[i]+'점')).join(' · '),d.sum+'/'+d.known*4+'점 · 미상 '+d.unknown+'개']))+'</section>';}
const api=Object.freeze({tasks,tiers,valid,prompt,report,score});if(typeof module!=='undefined')module.exports=api;else root.OYPracticeHandoff=api;
})(typeof window!=='undefined'?window:globalThis);
