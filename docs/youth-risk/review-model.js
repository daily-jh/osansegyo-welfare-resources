(function(root){'use strict';
/** OY-RALS qualitative review v2. No clinical standardization. Distinguish observed, inferred, unverified.
 * Weights are assumptions for internal display order only, NOT risk probability, prediction or statutory scoring.
 */
const WEIGHTS=[1.3,1.2,1.12,1.18,1.1,1.02,1.35,1.05,1,0.98,0.96,1.12,1.18,1,1.03,1.12,1.01,1.09,1.14,1.11,1.06,0.98,1.06,0.97,1.32];
const TEXT_BANK=[["현재의 보호·의사결정에 누가 참여하는지, 학생이 안심할 수 있는 연락 상대가 있는지","현재 함께 있는 사람·안전한 장소·즉시 보호 필요를 확인","보호·신고 담당을 선확인하고 피해 확인과 사례관리 업무를 분리","학생이 느끼는 안전감·보호조치 실행·담당자 인계","학생이 말한 내용을 반복 입증하도록 요구하지 않고 아동보호 의심의 법정 절차를 확인"],["실제 식사·의료·돌봄 제공상태를 가정 형편과 분리하여 확인","필수적인 돌봄이 빠지는 시간과 안전한 어른을 파악","돌봄 공백과 공적급여·가구지원 자격을 구분해 확인","돌봄 공백 시간·필수서비스 이용 여부","경제적 어려움만으로 방임을 확정하지 않음"],["괴롭힘 사실과 현재 피해 노출, 수업 참여에 미치는 영향을 확인","학교 보호조치와 안전한 교실·통학 동선을 학생과 협의","학교폭력 대응과 상담·생활지원의 역할 및 정보공유 최소 범위를 조정","추가 피해 여부·안전한 학교생활·출결","학생의 표현과 확인된 사실을 구분해 기록"],["계속되는 강요·협박·접촉과 보호받을 경로를 확인","학생에게 피해의 반복 설명을 강요하지 않고 안전 담당과 협의","신고·전문피해지원·후속 상담의 담당 구분","접촉 지속 여부·피해보호 연결 확인","다른 또래 피해 문항과 같은 사건인지 구별"],["다른 학생의 안전과 사건 전후 맥락을 학생별로 확인","피해학생 보호와 행동학생에 대한 비낙인적 지원을 분리","학교 안전조치·행동지원·가정 상담 의뢰의 순서 협의","사고 재발·안전한 관계·지원참여","가해자·진단 등 정체성을 척도값으로 확정하지 않음"],["감정의 표현·지속기간·하루 기능 영향과 원하는 도움을 확인","학생이 불편을 표현할 방법과 학교에서 가능한 조정을 묻기","정서상담의 접수 조건과 필요시 전문평가를 구분","정서적 어려움의 주관적 변화·수업 참여","임상진단을 점수로 추정하지 않음"],["최근 자해·죽음 관련 생각·행동·계획·수단과 현재 위험 확인","현장 위기대응 및 안전한 지지인·전문평가를 먼저 협의","필요한 응급·보호 경로와 의료·심리 후속 지원을 구분","현재 안전확인·인계 여부·다음 안전확인","점수와 무관하게 현재 위해 여부를 우선 확인, 척도로 자살 위험 예측 금지"],["수면·불안·혼란의 시간적 변화와 식사·수업의 실제 영향 확인","조용한 면담과 수업 환경 조정, 보건·상담 역할 검토","전문평가 필요성과 생활 기능 회복 지원을 분리","수면/생활 규칙성·학생이 말하는 기능 변화","정서곤란과 다른 동일 증상의 중복을 조심"],["지각·결석·등교 회피의 맥락과 학생이 원하는 지원을 확인","시간표·교실·관계·통학의 조정 가능성을 탐색","학교 교육지원과 가정생활 장벽·복지자원의 연계 역할 조정","출결·수업참여와 학생이 느낀 부담 변화","출결 문제의 원인을 가난·가족·정서로 미리 정하지 않음"],["이해에 어려운 학습 상황과 제공받았던 학습 도움 확인","수준별 자료·학습 설명법·보충수업을 학생과 조정","교육지원 접수와 자원 이용·비용장벽의 차이를 확인","개별 학습목표와 과제완수·학생의 학습 경험","학습부진만으로 장애나 지적 기능을 진단하지 않음"],["학교와 연결감을 느끼는 장면·중단하고 싶은 이유 확인","관계·진로·수업 경험에서 학생이 중요하게 여기는 목표 탐색","학교 지지체계와 대안적 교육참여 지원의 필요 확인","학교 소속감·지속 참여·학생 희망","학교에 대한 불만을 단순 불성실로 판단하지 않음"],["행동 발생 맥락·즉각적 위해·도움 받을 방법을 확인","자극·대응 방식과 피해자 보호의 우선순위를 구분","행동지원과 위기·전문평가 기관의 업무 조정","안전사고·대처전략 실천·지원 참여","단발 행동과 지속 행동특성을 구분"],["현재 중독·의식 변화 등 응급 위해 여부와 실제 상황 확인","안전·보건 담당을 통해 신체적 위험을 우선 확인","필요한 응급·의료·상담 경로를 구분하고 기존 치료 중복 확인","응급 조치 여부·의료 접근·생활안전","음주·흡연과 약물 과량복용의 위험수준을 동일시하지 않음"],["환경·의사소통·감각 조정의 부족과 적절한 조정 방식 확인","학생이 선택한 교실·평가·자료 접근 조정을 적용","학교·발달지원·장애인지원기관의 평가·서비스 역할 협의","환경조정 시행·참여 정도·학생의 편의","진단명 없이도 환경조정을 먼저 검토 가능"],["보조기기·돌봄·발달지원의 실제 미이용 이유 확인","학교 내 지원과 필요한 도구·이동 조건을 점검","공급부족·비용·신청절차·자격 확인을 구분","필요서비스 접수/이용과 접근 장벽 변화","미이용을 보호자 비협조로 해석하지 않음"],["식사·보호·돌봄의 공백 시간과 학생 안전을 확인","학교 급식·돌봄·보건 도움과 안전한 연락 경로를 검토","가구지원·돌봄대체·행정 지원 적합성을 검토","일상 돌봄 제공·빈 시간·학생 안전감","보호자 건강문제로만 학대·방임을 단정하지 않음"],["가정의 갈등과 학생의 정서·학교생활 영향 및 안전한 보호자 연락 확인","학생 안전을 우선 검토하고 적절한 보호자 면담을 계획","가족 상담·가족서비스와 학생 개별지원의 목적 분리","안전한 의사소통·학생 희망·상담 접근","갈등이 있다는 것만으로 특정 보호자에게 책임 전가하지 않음"],["돌봄 대상·실제 돌봄 시간·학교·휴식에 미치는 부담 확인","학생의 공부·휴식 시간을 보호하기 위한 학교 조정 협의","대체돌봄·가사지원·가족관계서비스를 역할별로 조사","주당 돌봄시간·휴식·학교참여","가족을 돌본 사실 자체보다 부담과 교육권 제약 여부를 평가"],["식사·위생·준비물의 실제 공백과 필요한 지원을 확인","급식·교육복지·기초물품 지원 가능한 경로 확인","행정복지·민간 생계지원과 수급자격·공급 상태 확인","필수 물품 충족·지원 이용 여부","소득정보 없이 빈곤상태나 학대의 원인을 확정하지 않음"],["거주 안정성·안전·퇴거 기한·학습 공간을 구체적으로 확인","통학·공부공간·교실 지원과 즉각적인 안전조정 협의","주거복지·긴급지원·사례관리의 신청·접수조건 확인","거주유지·통학·학습 공간 변화","주거문제와 출결의 원인관계 확인 전 단정 금지"],["비용 때문에 중단하거나 받지 못한 필수서비스를 구분","학교 재료비·이동·학습접근 등 교육비 장벽 확인","공적 의료·치료비·민간후원 신청 자격 및 선후지원 확인","실제 필요서비스의 이용 시작·비용 장벽 변화","미이용 서비스의 필요성과 자격을 별도로 확인"],["교내외 활동 참여 희망·안전감·실제 참여 장애를 확인","강요 없는 또래·활동 참여 기회를 학생과 선택","동아리·지역 청소년활동·관계상담의 적합성 검토","원하는 활동 참여·안전한 관계 경험","혼자 있는 선택과 원치 않는 고립을 구별"],["위기 때 도움받을 실제 어른·연락 가능 여부·신뢰도를 확인","교내 안전 담당 1인과 지원 요청 방법 협의","학교·지역기관 한 명 이상의 안정적 담당 역할 조정","학생이 선택한 지지인·실제 연락·후속 응답","연락처 존재만으로 실질적 지원을 보장하지 않음"],["디지털 활동이 수면·수업·관계를 방해하는 실제 장면 확인","학습과 휴식의 균형을 학생과 협의해 작은 변화 설계","상담·생활지원의 필요 및 기존 과도한 낙인 점검","수면·수업참여·당사자 기록한 변화","사용시간만으로 중독·문제행동 진단 불가"],["지속되는 성적 요구·온라인 협박·노출·접촉 위험을 즉시 확인","피해보호·신고 경로와 안전한 연락·보관 안내를 우선","전문 피해지원기관 인계, 학교와 복지 지원 역할을 구분","추가 접촉 차단·보호조치·학생 안전감","학생에게 증거수집·반복진술을 강요하지 않고 신고·보호 절차 우선"]];
const PAIR_FACTORS={"PEER_ATTEND":1,"LEARN_BASIC":1.04,"FAMILY_SCHOOL":1.02,"MOOD_SCHOOL":1,"SELFHARM_MOOD":1.12,"PROTECT_BASIC":1.1,"ONLINE_PEER":1.09,"ONLINE_MOOD":1.08,"HOUSING_ATTEND":1.03,"CARE_SCHOOL":1.04,"ACCESS_LEARN":0.99,"ISOL_MOOD":1,"DIGITAL_DAILY":0.96,"HOUSING_MOOD":1.02,"FAMILY_EMOTION":1,"COST_ACCESS":1.02,"BEHAV_PEER":1.05,"HEALTH_BEHAV":1.08,"BASIC_CARE":1.02,"BASIC_REL":1.04,"THREE_WAY":1.05,"MIX_PROTECT":1.12,"MED_SCHOOL":1.02,"HOPE_SUPPORT":0.98};
const SAFETY=[1,2,7,25];
const SAFETY_NAMES={1:'학대 의심·보호 필요',2:'필수 보호 누락·방임 의심',7:'자해·죽음 관련 현재 안전',25:'온라인 착취·협박 관련 안전'};
const round=n=>Math.round(n*100)/100;
function valid(p){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25||p.answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25개 응답(0~4 또는 미상)이 필요합니다');
 if(!Array.isArray(p.domains)||p.domains.reduce((s,d)=>s+(d.items?.length||0),0)!==25)throw Error('10개 영역·25문항 정의가 필요합니다');
 return p;
}
function itemEvidence(p){
 const flattened=p.domains.flatMap(d=>d.items),names=p.domains.flatMap(d=>d.items.map(()=>d.name));
 return p.answers.map((score,i)=>({
 number:i+1,score,weight:WEIGHTS[i],contribution:typeof score==='number'?round(score/4*WEIGHTS[i]):null,
 domain:names[i],question:flattened[i],prompt:TEXT_BANK[i][0],teacher:TEXT_BANK[i][1],
 worker:TEXT_BANK[i][2],measure:TEXT_BANK[i][3],caution:TEXT_BANK[i][4],
 safety:SAFETY.includes(i+1)
 }));
}
function links(p,cross,items){
 return cross.patterns.map(g=>{
  const matched=g.items.map(n=>items[n-1]),weightSum=matched.reduce((s,x)=>s+x.weight,0),
   evidenceMean=matched.reduce((s,x)=>s+x.score*x.weight,0)/weightSum,
   minimum=Math.min(...matched.map(x=>x.score)),
   f=PAIR_FACTORS[g.id]||1,
   auxiliary=round(Math.min(4,0.85*evidenceMean+0.15*f*minimum));
  return {...g,auxiliary,factor:f,weightedMean:round(evidenceMean),minimum,
   formula:'0.85×'+round(evidenceMean).toFixed(2)+' + 0.15×'+f.toFixed(2)+'×'+minimum,
   matchCount:matched.length};
 }).sort((a,b)=>Number(b.safety)-Number(a.safety)||b.auxiliary-a.auxiliary||b.matchCount-a.matchCount||a.id.localeCompare(b.id));
}
function uniquePatterns(related,max=4){
 const result=[];
 for(const c of related){
  if(result.some(x=>{
   const overlap=c.items.filter(v=>x.items.includes(v)).length;
   return overlap/Math.min(c.items.length,x.items.length)>=.75&&c.safety===x.safety;
  }))continue;
  result.push(c);if(result.length>=max)break;
 }
 return result;
}
function build(p,role='teacher'){
 valid(p);if(!['teacher','social-worker'].includes(role))throw Error('교사 또는 사회복지사 관점이 필요합니다');
 const D=typeof module!=='undefined'?require('./criteria.js'):root.YouthCriteria;
 const E=typeof module!=='undefined'?require('./evidence-matrix.js'):root.YouthEvidenceMatrix;
 const I=typeof module!=='undefined'?require('./insights.js'):root.YouthInsights;
 const x=itemEvidence(p),counts=p.domains.map(d=>d.items.length),followups=p.followups||{},
 decision=D.evaluate(p.answers,counts,Boolean(p.explicit?.length),followups),
 cross=E.evaluate(p,role),related=links(p,cross,x),selected=uniquePatterns(related,4),
 known=x.filter(v=>typeof v.score==='number'),unknown=x.filter(v=>v.score==='unknown'),
 raised=x.filter(v=>typeof v.score==='number'&&v.score>=2).sort((a,b)=>Number(b.safety&&b.score>0)-Number(a.safety&&a.score>0)||b.contribution-a.contribution||a.number-b.number),
 mild=x.filter(v=>typeof v.score==='number'&&v.score===1),
 domains=p.domains.map((d,i)=>{const from=counts.slice(0,i).reduce((s,v)=>s+v,0);
 const vals=x.slice(from,from+d.items.length),present=vals.filter(y=>typeof y.score==='number');
 return {name:d.name,known:present.length,unknown:vals.length-present.length,sum:present.reduce((s,z)=>s+z.score,0),
 mean:present.length?round(present.reduce((s,z)=>s+z.score*z.weight,0)/present.reduce((s,z)=>s+z.weight,0)):null,
 high:present.filter(y=>y.score>=2).map(y=>y.number)}
 }).sort((a,b)=>b.high.length-a.high.length||(b.mean??-1)-(a.mean??-1));
 const sum=known.reduce((s,v)=>s+v.score,0),roleTeacher=role==='teacher';
 const text=[];
 text.push('[1. 종합 사정 및 판단 근거]\n'+(unknown.length?'전체 점수와 지원수준은 미상 '+unknown.length+'문항으로 잠정 판단을 유지합니다. 현재 확인된 응답 합계 '+sum+'점 / 응답 '+known.length+'/25문항입니다.':
 '25개 문항의 합계 '+sum+'/100점이 확인되었습니다.')+' 지원 방향은 "'+decision.title+'"입니다. 이는 임상진단이나 법정 사례선정이 아닌 실무 검토를 위한 기준입니다. '+(raised.length?'2점 이상 응답 '+raised.length+'개와 해당 영역의 생활 영향을 우선 사정합니다.':'2점 이상 응답은 없지만 실제 생활상의 지원 필요와 학생이 원하는 변화를 별도로 확인합니다.'));
 if(decision.urgent||decision.safetyUnknown.length||decision.pendingChecks.length){
  text.push('[2. 독립된 현재 안전 판단]\n'+(decision.urgent?'점수 합계와 무관하게 안전·보호 관련 신호가 확인되어 현재 안전확인과 사안에 맞는 보호·신고·긴급대응을 선행합니다. ':'현재의 즉각적인 위해 여부가 충분히 확인되지 않았으므로 안전하다고 단정하지 않습니다. ')+
  (decision.safetyItems.length?'안전핵심문항: '+decision.safetyItems.map(n=>n+'번 ('+SAFETY_NAMES[n]+')').join(' · ')+'. ':'')+
  (p.explicit?.length?'별도로 체크한 긴급 안전신호가 있습니다. ':'')+
  (decision.safetyUnknown.length?'안전핵심 미상: '+decision.safetyUnknown.map(n=>n+'번').join('·')+'. ':'')+
  (decision.pendingChecks.length?'현재 위험 추가확인이 남은 문항: '+decision.pendingChecks.map(n=>n+'번').join('·')+'. ':'')+
  '필요 시 112·119 또는 담당기관의 법정 신고·보호 절차를 우선 검토하며 학생에게 반복 진술이나 자체 증거수집을 요구하지 않습니다. 응급조치를 일반 서비스 예약으로 대체하지 않습니다.');
 }else text.push('[2. 현재 안전 판단]\n선택된 별도 긴급신호는 없으나 이번 응답만으로 안전이 입증되지는 않습니다. 학생의 현재 상황, 안전한 연락·보호자 접근의 적절성, 변화 시 긴급 연락경로를 첫 면담에서 확인합니다.');
 text.push('[3. 주요 어려움과 영향경로 · 사실/해석 구분]\n'+(raised.length?raised.slice(0,8).map((v,i)=>
 (i+1)+') '+v.domain+' · '+v.number+'번 '+v.score+'점\n'+
 '보고된 사실: '+v.question+'\n'+
 '해석할 쟁점: '+v.prompt+'. 이는 사실 또는 진단의 확정이 아니라 추가 확인을 위한 가설입니다.\n'+
 '미확인 사항: '+v.caution+'. 발생시점·빈도·지속기간·학생의 표현·이미 받고 있는 지원·최근 변화는 확인되지 않았습니다.\n'+
 '실무 질문: '+(roleTeacher?v.teacher:v.worker)+'\n변화 관찰지표: '+v.measure
 ).join('\n\n'):(mild.length?'현재 1점으로 보고된 문항 '+mild.map(v=>v.number+'번').join(' · ')+'이 있으며 학생이 느낀 부담, 도움 요청, 반복 여부를 확인합니다.':'현재 점수가 확인된 문항은 모두 0점입니다. 이번 응답에서 어려움 보고가 없다는 뜻이며 지원이 불필요하다는 확정은 아닙니다.')));
 if(selected.length){
 text.push('[4. 문항 간 상호작용 및 중첩욕구 사정]\n'+selected.map((v,i)=>
 (i+1)+') '+v.title+' ('+v.evidence+')\n'+
 '연결 가설: '+v.interpretation+'\n근거 강도 설명: 문항별 가중검토 평균 '+v.weightedMean.toFixed(2)+'점, 교차조합 내부 정렬값 '+v.auxiliary.toFixed(2)+' (공식 위험점수 아님).\n'+
 '확인 질문: '+v.question+'\n검토 개입: '+v.action+'\n기관의 역할 후보: '+v.resources+'\n합의할 목표: '+v.goal+'\n결과 점검: '+v.measures
 ).join('\n\n')+'\n※ 문항 간 동시응답으로 인과관계·진단·사례선정 자격을 확정하지 않습니다. 같은 사건이 여러 문항에 중복반영됐는지 검토하세요.');
 }else text.push('[4. 문항 간 상호작용]\n현재 2점 이상 응답에서 교차규칙의 조건을 충족한 조합은 없습니다. 미상·상세 진술·생활 영향을 확인한 뒤 다시 사정합니다.');
 text.push('[5. 학생·가족·환경에 대한 추가 사정]\n'+
 '학생의 말: 가장 힘든 일, 가장 먼저 바꾸고 싶은 일, 지금 받고 있는 도움과 충분한 도움의 차이를 직접 확인합니다.\n'+
 '보호요인·강점: 편안한 사람·공간, 지금까지의 대처, 학생이 선택한 지원, 학교·가정의 유효한 지원을 확인합니다. 점수가 높다고 강점이 없다고 보지 않습니다.\n'+
 '보호자·가족 접근: 연락이 학생의 안전을 해치는지 먼저 판단합니다. 보호·학대 의심 시 가해 의심 보호자와 임의로 먼저 협의하지 않습니다.\n'+
 '기관·자원: 이전 의뢰·접수·실제 이용을 구분하고 관할·접수·비용·시간·이동·정보공유 동의의 장벽을 확인합니다.');
 const top=selected[0],active=raised.find(v=>!v.safety)||raised[0];
 text.push('[6. 개입 목표 및 단계별 역할 · 제안]\n'+
 '즉시/초기: '+(decision.urgent?'현재 안전과 신고·보호 경로를 먼저 확인하고 담당자·재확인 시점을 지정합니다.':decision.safetyUnknown.length||decision.pendingChecks.length?'보류된 안전확인 항목을 우선 검토하면서 확인된 어려움에 필요한 지원을 시작합니다.':'학생의 표현·생활 영향과 원하는 도움을 첫 면담에서 확인합니다.')+'\n'+
 '단기목표(안): '+(top?top.goal:active?active.measure+'을 학생과 협의해 확인':'학생이 선택한 한 가지 일상 목표를 면담으로 합의')+'\n'+
 '실행방법: '+(top?top.action:active?(roleTeacher?active.teacher:active.worker):'학교에서 가능한 조정과 지역 기관의 실제 서비스 가능성을 구분하여 확인')+'\n'+
 '협력역할: '+(roleTeacher?'교사·학교는 학생 면담, 출결·수업·또래 안전 및 적절한 보호자 접촉을 주관하고, 외부기관은 수용·전문서비스 제공 여부를 회신합니다.':'사회복지사는 사정·사례판정 이후 계획의 주관과 기관별 의뢰·회신을 조정하고, 학교는 교육참여와 학생의 경험을 확인합니다.')+'\n'+
 '점검: 상담 시작·기관 문의·접수·서비스 이용·학생이 체감하는 변화를 서로 다른 항목으로 기록합니다. 실행 여부는 아직 확인되지 않았습니다.');
 text.push('[7. 재사정 및 계획수정 기준]\n'+
 '안전: 현재 위해·노출·지원자 변동이 확인되면 계획 기간과 관계없이 즉시 재확인합니다.\n'+
 '목표: 첫 면담에서 관찰할 기준선과 학생이 바라는 1~2개 변화를 합의하고, 이후 같은 기준으로 비교합니다.\n'+
 '기관연계: 문의→의뢰→접수→실제 서비스 시작→생활변화를 단계별로 확인하고 미이용·대기 시 대안을 조정합니다.\n'+
 '회의: 사안의 시급성·복합성·기존 주관기관·학생 의견에 따라 학맞통/사례회의 검토를 제안하되 법정 선정·서비스 제공 확정으로 표현하지 않습니다.');
 text.push('[8. 계산 근거·정보의 한계]\n'+
 '공식 총점 = 확인된 25개 점수의 합계(모두 확인될 때 최대 100점). 미상은 0점으로 대체하지 않고 최종 판정을 보류합니다.\n'+
 '탐색용 문항 보조값 Bᵢ = (문항 점수÷4)×문항별 가정계수 wᵢ. 교차 검토값 R = min(4, 0.85×해당 문항의 가중평균 + 0.15×교차계수×해당 문항의 최소점수). 계수는 문헌에서 검증된 확률이나 효과크기가 아닌 개발용 가정입니다.\n'+
 '개별 문항의 2점 이상 표시·현재 긴급 안전·문항 간 교차는 서로 다른 차원이며, 소수점 값으로 보호·신고 결정을 바꾸지 않습니다.\n'+
 '본 리뷰는 척도와 규칙 기반의 "초안"이며 실제 면담·학습·가정·보호상황을 증명하거나 대체하지 않습니다.');
 const V=typeof module!=='undefined'&&module.exports?require('./interpretation-v2.js'):root.YouthInterpretation;
 const interpretation=V?V.analyze(p,role):null;if(V)text.splice(4,0,V.text(p,role));
 const N=typeof module!=='undefined'&&module.exports?require('./professional-response.js'):root.YouthNarrative;
 return {interpretation,technicalText:text.join('\n\n'),text:N?N.build(p,role).text:text.join('\n\n'),items:x,domains,links:related,selected,decision,weights:WEIGHTS,unknown:unknown.map(v=>v.number),notes:{weightModel:'development-assumption-20261023',notValidated:true}};
}
const api={WEIGHTS,TEXT_BANK,PAIR_FACTORS,build,itemEvidence,links,uniquePatterns};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthReviewModel=api;
})(typeof window!=='undefined'?window:globalThis);
