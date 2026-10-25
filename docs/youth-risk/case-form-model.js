(function(root){'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./criteria.js'):root.YouthCriteria;
const needs=['안전','건강','일상생활 유지','가족관계','사회적 관계','경제','교육','고용','생활환경','법률 및 권익보장'];
// Links are prompts for further assessment, never scored conversions or confirmed needs.
const crosswalk=[[0,1,2,4,9],[2,4,5],[6,7,8],[0,6],[1,8],[7],[3,6,7,8],[7],[7],[0,1,9]];
function legacyBuild(p,f={}){if(!Array.isArray(p?.answers)||p.answers.length!==25||Array.from(p.answers).some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))throw Error('25문항 응답을 확인해 주세요.');const value=k=>String(f[k]||'').trim()||'미확인 · 면담에서 확인 필요';let off=0;const youth=[2,3,3,3,2,2,3,3,2,2].map((count,i)=>{const numbers=Array.from({length:count},(_,k)=>off+k+1);off+=count;return {i,name:p.domains?.[i]?.name||'영역 '+(i+1),numbers};});const rows=needs.map((name,i)=>{const areas=crosswalk[i].map(k=>youth[k]),evidence=areas.flatMap(g=>g.numbers.filter(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0)),unknown=areas.flatMap(g=>g.numbers.filter(n=>p.answers[n-1]==='unknown'));return {name,evidence,unknown,reported:evidence.length?'평가자 응답: '+evidence.map(n=>n+'번 '+p.answers[n-1]+'점').join(' · '):'응답에서 확인된 어려움 없음 · 욕구 부재를 확정하지 않음',wish:value('needWish'+i),strength:value('needStrength'+i),assessment:value('needView'+i),priority:value('needPriority'+i)};});const intake=[['상담일',value('date')],['의뢰·접수 경위',value('referral')],['현재 안전·이미 취한 조치',value('safety')],['가정·가족 및 돌봄',value('family')],['건강',value('health')],['주거',value('housing')],['경제 · 수입',value('income')],['경제 · 지출',value('expense')],['경제 · 부채',value('debt')],['경제 · 재산',value('asset')],['경제 · 기타',value('economicOther')],['사회심리·관계',value('relationships')],['Ct가 바라는 도움',value('wish')],['강점·활용 자원',value('strengths')],['기존 지원',value('support')],['접근의 어려움·필요한 조정',value('access')],['실무자 사정 · 사실과 구분',value('view')],['첫 행동·담당·다음 확인일',value('next')]];return {screening:youth.map(g=>({name:g.name,evidence:g.numbers.filter(n=>typeof p.answers[n-1]==='number'&&p.answers[n-1]>0).map(n=>n+'번 '+p.answers[n-1]+'점'),unknown:g.numbers.filter(n=>p.answers[n-1]==='unknown')})),decision:C.evaluate(p.answers,[2,3,3,3,2,2,3,3,2,2],!!p.explicit?.length,p.followups||{}),version:'1.1.0-20261024',source:'통합사례관리 보호형 TEST v0.5 · NEED_DOMAINS / TEMPLATE_FORMS 구조 참조',intake,needs:rows,scaleNotice:'청소년 25문항 응답에 근거한 면담 준비자료입니다. 기관 16문항 위기도를 채점하거나 환산하지 않습니다. 욕구·가족상황·자격·서비스 승인은 면담과 실제 근거로 확인합니다.'};}
function build(p,f={}){const x=legacyBuild(p,f),F=typeof module!=='undefined'&&module.exports?require('./case-formulation-v72.js'):root.YouthFormulation;if(!F)return x;const v=F.build(p);
 if(v.canonical86){
   const cs=v.canonical86,ev=cs['K-CARR'],auto={},note=typeof p.caseContext==='string'?p.caseContext:p.caseContext?.text||'';
   const group=(rx)=>ev.evidence.filter(e=>e.polarity==='affirmed'&&rx.test(e.kind)).map(e=>e.text||e.excerpt||'');
   const uniq=a=>[...new Set(a.map(String))].filter(Boolean).join(' ');
   auto['가정·가족 및 돌봄']=uniq([...(ev.family||[]).map(f=>typeof f==='string'?f:f.relation||''),...group(/care|family|meal/)].slice(0,5));
   auto['건강']=uniq(group(/mood|self_harm|health/).slice(0,4));
   auto['주거']=uniq(group(/housing/).slice(0,4));
   auto['경제 · 기타']=uniq(group(/economic|meal/).slice(0,4));
   auto['사회심리·관계']=uniq(group(/peer|conflict|mood/).slice(0,5));
   auto['강점·활용 자원']=uniq((ev.strengths||[]).map(s=>(typeof s==='string'?s:s.name||s.label||'')+'에 관심이 보고됨')).slice(0,900);
   const namedSupport=Array.isArray(ev.existingSupport)?ev.existingSupport:(ev.existingServices||[]).map(s=>[s.agency,s.program].filter(Boolean).join(' · '));auto['기존 지원']=uniq(namedSupport.slice(0,4))+(namedSupport.length?' (참여 보고 · 제공 여부 확인 전)':'');
   if(!namedSupport.length)auto['기존 지원']='';
   auto['접근의 어려움·필요한 조정']=uniq(group(/access|learning/).slice(0,4));
   auto['실무자 사정 · 사실과 구분']=v.judgement;
   auto['첫 행동·담당·다음 확인일']=v.first+' / 실제 담당·일정 협의 전';
   if(/학생.{0,30}(?:원하|희망|바라|요청)/.test(note))auto['Ct가 바라는 도움']='학생 희망이 서술되어 있음 · 실제 표현과 우선순위 면담 확인';
   const byItem={1:0,2:0,3:4,4:9,5:4,6:1,7:0,8:1,9:6,10:6,11:6,12:1,13:1,14:6,15:6,16:2,17:3,18:2,19:5,20:8,21:5,22:4,23:4,24:4,25:0};
   for(let i=0;i<x.needs.length;i++){
     const goals=cs.ICMS.goals.filter(g=>byItem[Number((g.id.match(/Q(\d+)/)||[])[1])]===i);
     x.needs[i].draft=goals.length?{assessment:goals.map(g=>g.goal).join(' '),priority:goals.map(g=>g.id+' · '+g.concept+' / '+g.action).join(' '),strength:auto['강점·활용 자원']||''}:{};
   }
   return {...x,version:'8.6-shared-case-state',autoDraft:auto,canonicalPriority:cs.ICMS.goals.map(g=>g.id),sourceEvidence:ev.evidence.map(e=>e.id),draftNotice:'V8.6 공동 사정은 입력 서술과 척도 응답 기반의 검토 초안입니다. 실제 면담·동의·제공·회의 결정을 자동으로 확정하지 않습니다.'};
 }
 const a=v.evidence82;if(!a)return x;const join=xs=>[...new Set(xs.map(z=>z.text))].join(' '),auto={};
 auto['가정·가족 및 돌봄']=join(a.facts.filter(z=>a.family.some(k=>k.evidenceId===z.id)||z.topics.includes('care')));
 auto['건강']=join(a.topics.health);auto['주거']=join(a.topics.housing);auto['경제 · 기타']=join(a.topics.basic);auto['사회심리·관계']=join([...a.topics.peer,...a.topics.relation]);auto['강점·활용 자원']=a.interests.map(i=>i.label+'에 대한 관심이 입력 서술에 보고됨.').filter((v,i,z)=>z.indexOf(v)===i).join(' ');auto['기존 지원']=a.services.map(i=>i.text+' ('+i.status+')').join(' ');auto['접근의 어려움·필요한 조정']=join(a.topics.access);auto['실무자 사정 · 사실과 구분']=v.judgement;auto['첫 행동·담당·다음 확인일']=v.first+' / '+(v.rows[0]?.when||'담당·일정 협의 전');const wish=a.facts.filter(z=>/(?:학생|본인).{0,25}(?:원하|희망|바라|요청)/.test(z.text));if(wish.length)auto['Ct가 바라는 도움']=join(wish);
 const primary={daily:2,school:6,relationship:4,coordination:4,health:1,housing:8,basic:5,care:3,mental:1,access:6,digital:9,safety:0};
 for(let i=0;i<x.needs.length;i++){const goals=a.allRows.filter(r=>primary[r.id.replace('e82-','')]===i);x.needs[i].draft=goals.length?{assessment:goals.map(r=>r.goal).join(' '),priority:goals.map(r=>(a.allRows.indexOf(r)+1)+'. '+r.title+' / '+r.action).join(' '),strength:i===4||i===6?auto['강점·활용 자원']||'':''}:{};}
 return {...x,version:'8.2-shared-forms',autoDraft:auto,canonicalPriority:a.canonicalPriority,sourceEvidence:a.facts.map(z=>z.id),draftNotice:'서술 기반 자동 초안은 입력 내용의 보고·해석이며 실제 면담·동의·합의가 아닙니다. 직접 작성한 값이 우선합니다.'};}
const missing=v=>!String(v??'').trim()||['미확인','미확인 · 면담에서 확인 필요','확인 필요'].includes(String(v).trim());
function progress(x){return {intakeWritten:x.intake.filter(([,v])=>!missing(v)).length,intakeTotal:x.intake.length,needsWritten:x.needs.filter(n=>[n.wish,n.strength,n.assessment,n.priority].some(v=>!missing(v))).length,needsTotal:x.needs.length};}
function proposal(x,i){const n=x.needs[i];if(!n)throw Error('욕구영역을 확인해 주세요.');if(missing(n.wish)&&missing(n.priority))throw Error('학생이 제시한 욕구 또는 함께 검토할 목표를 먼저 기록해 주세요.');const rows=[['제시된 욕구',n.wish],['강점·활용 자원',n.strength],['실무자 사정',n.assessment],['목표·우선순위 검토안',n.priority]].filter(([,v])=>!missing(v));return '[욕구사정 연결 · '+n.name+']\n'+rows.map(([k,v])=>k+': '+v).join('\n')+'\n척도 단서: '+n.reported+'\n합의·실행은 별도 확인\n[/욕구사정 연결]';}
function text(x,mode){const shown=(v,auto)=>missing(v)?auto?'[서술 기반 검토 초안] '+auto:'—':v;return [(mode==='needs'?'욕구조사(사정)표':'초기상담지')+' · 작성 초안',x.scaleNotice,'— = 미확인 · 면담에서 확인 필요','평가 기준 검토 방향: '+x.decision.title,...(mode==='needs'?x.needs.map(n=>'['+n.name+']\n'+n.reported+(n.unknown.length?' / 관련 미상 '+n.unknown.join('·')+'번':'')+'\n'+[['제시된 욕구',n.wish],['강점·활용 자원',n.strength],['실무자 사정',n.assessment],['목표·우선순위 검토안',n.priority]].map(([k,v])=>k+': '+shown(v,n.draft?.[k==='강점·활용 자원'?'strength':k==='실무자 사정'?'assessment':k==='목표·우선순위 검토안'?'priority':''])).join('\n')):x.intake.map(([k,v])=>k+': '+shown(v,x.autoDraft?.[k])))].join('\n\n');}
const api={build,needs,missing,progress,proposal,text};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.YouthCaseForms=api;
})(typeof window!=='undefined'?window:globalThis);
