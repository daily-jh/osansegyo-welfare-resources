(function(root){'use strict';
// Optional interpretation layer; the authoritative scoring and safety logic remain the existing OY-RALS models.
let knowledgePromise=null;
const KB_URL='./data/response-knowledge-600-v1.json';
function load(){
 if(!knowledgePromise)knowledgePromise=fetch(KB_URL,{credentials:'same-origin',cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('근거 DB 불러오기 실패 ('+r.status+')');return r.json();})
 .then(kb=>{
  if(kb.schema!=='OY-RALS-research-response-KB-v1'||kb.recordCount!==600||
   !Array.isArray(kb.entries)||kb.entries.length!==600||!Array.isArray(kb.items)||kb.items.length!==25||
   !Array.isArray(kb.rules)||kb.rules.length!==24)throw Error('응답 근거 DB 구조가 현재 버전과 맞지 않습니다.');
  return kb;
 }).catch(e=>{knowledgePromise=null;throw e;});
 return knowledgePromise;
}
function refList(refs,kb){
 const map=new Map(kb.sources.map(x=>[x.id,x]));
 return [...new Set(refs)].map(id=>{
  const source=map.get(id);
  return source?source.id+' ('+source.title+')':'설계근거 '+id;
 }).join(' / ');
}
async function enrich(existing,p,role='teacher'){
 if(!existing||typeof existing.text!=='string'||!Array.isArray(p?.answers)||p.answers.length!==25)
  return {...existing,knowledgeWarning:'원 평가 응답 또는 기본 모델 자료가 올바르지 않습니다.'};
 let kb;
 try{kb=await load();}catch(e){return {...existing,knowledgeWarning:e.message+' · 기존 기본 모델 답변만 제공합니다.'};}
 const map=new Map(kb.entries.map(x=>[x.id,x]));
 const ids=p.answers.map((s,i)=>({n:i+1,s}))
  .filter(x=>x.s==='unknown'||typeof x.s==='number'&&x.s>0)
  .sort((a,b)=>Number([1,2,7,25].includes(b.n)&&b.s!==0)-Number([1,2,7,25].includes(a.n)&&a.s!==0)
    ||Number(b.s===4?4:b.s===3?3:b.s===2?2:b.s===1?1:0)-Number(a.s===4?4:a.s===3?3:a.s===2?2:a.s===1?1:0)||a.n-b.n);
 const selected=ids.slice(0,existing.intent==='resource'?2:5);
 const vantage=role==='teacher'?'T':'A';
 const parts=['\n[심층 연구형 해석 · 가설/검증 미완료 · '+kb.version+']'];
 parts.push('이 내용은 기존 통합사례관리 모델과 병행되는 근거 설명입니다. 점수·지원단계·현재 안전·의뢰 자격을 수정하지 않습니다.');
 if(selected.length)for(const it of selected){
  const rec=map.get('I'+String(it.n).padStart(2,'0')+'-'+it.s+'-'+vantage);
  if(!rec)continue;
  const message=role==='teacher'?rec.teacherAnswer:rec.caseManagerAnswer;
  parts.push('\n• '+rec.id+' / '+(it.s==='unknown'?'미상':it.s+'점')+' · '+kb.items[it.n-1].domain+
   '\n  해석: '+rec.interpretation+
   '\n  우선 질문: '+rec.reviewQuestion+
   '\n  실무 응답: '+message+
   '\n  관찰/성과 확인: '+rec.outcome+
   '\n  단정 금지: '+rec.avoid+
   '\n  출처 범위: '+refList(rec.sources,kb));
 }else parts.push('이번 평가에서 문제 점수가 기록된 문항이 없습니다. 다만 이번 평가가 학생의 생활 어려움 부재를 증명하는 것은 아닙니다.');
 let patterns=[];
 if(root.YouthEvidenceMatrix?.evaluate)try{patterns=root.YouthEvidenceMatrix.evaluate(p,role).shown||[];}catch(e){}
 for(const matched of patterns.slice(0,existing.intent==='resource'?1:3)){
  const ix=kb.rules.findIndex(x=>x.id===matched.id);
  if(ix<0)continue;
  const mode=matched.peak>=3?'3':'2';
  const rec=map.get('P'+String(ix+1).padStart(2,'0')+'-'+mode);
  if(!rec)continue;
  parts.push('\n• '+rec.id+' / 교차사정 가설: '+matched.title+
   '\n  실제 충족 응답: '+matched.evidence+
   '\n  해석: '+rec.interpretation+
   '\n  확인: '+(role==='teacher'?rec.teacherAnswer:rec.caseManagerAnswer)+
   '\n  성과지표 제안: '+rec.outcome+
   '\n  검증상태: 개발가설. 중복사건/대립가설/정보원 확인이 필요합니다.');
 }
 parts.push('\n[갱신 정책] 근거 DB의 문항·교차 가설은 연구형 원고와 별도로 버전관리합니다. 수정 시 승인전 상태, 사용근거, 반례, 회귀검사 결과를 기록해야 합니다. 이 모델은 임상·통계적으로 검증된 예측기나 자동 판정기가 아닙니다.');
 return {...existing,text:existing.text+parts.join('\n'),knowledgeLoaded:true,knowledgeRecords:kb.recordCount,knowledgeVersion:kb.version,knowledgeItemCount:selected.length,knowledgeCrossCount:patterns.length};
}
const api={load,enrich,version:'2026-10-23-v1.0'};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.YouthResponseKnowledge=api;
})(typeof window!=='undefined'?window:globalThis);
