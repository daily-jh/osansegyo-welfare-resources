/* © 2026 김지훈. 서비스 이용·의뢰 지원 판단의 결정적(비AI) 보조 모델.
 * 이 모듈은 별도 사정·위기평가 점수를 읽거나 변경하지 않습니다.
 * 서비스 적합/신청 가능 확정이 아닌 '후보 추천'만 수행합니다. */
(function(root){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,' ').trim();
 const tags=(s,kind)=>Array.isArray(s?.tags?.[kind])?s.tags[kind]:[];
 const shared=(a,b)=>a.some(x=>b.includes(x));
 const text=({o,s})=>[o.name,o.kind,s.name,s.category,s.description,s.target,s.method,...Object.values(s.tags||{}).flat()].join(' ');
 function matches(entry,f){
  const {o,s}=entry;
  if(['중단','폐지'].includes(o.status))return false;
  if(f.scope&&o.level!==f.scope)return false;
  for(const [field,k] of [['need','need'],['target','target'],['form','form']])if(f[field]&&!tags(s,k).includes(f[field]))return false;
  const q=norm(f.keyword);return !q||norm(text(entry)).includes(q);
 }
 function sourceState(s,e){
  if(e?.evidenceLevel==='service_official')return '공식 서비스 안내 대조';
  if(e?.evidenceLevel==='related_subservice_official')return '공식 하위사업 부분 대조';
  return s?.verification?.status==='확인완료'?'기존 근거 확인(재대조 전)':'현재 공식 서비스 세부 확인 필요';
 }
 function intakeState(s,e,day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
  // 접수 공고는 작성 시점의 게시 상태이며 신청 가능 확정이 아니다.
  const ie=e?.intakeEvidence;
  if(ie?.state==='published_accepting'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(ie.asOf||'')&&/^\\d{4}-\\d{2}-\\d{2}$/.test(ie.expiresOn||'')){
    if(day>=ie.asOf&&day<=ie.expiresOn)return '공식 공고상 접수중('+ie.asOf+' 확인) · 실제 신청·잔여석 재확인';
    return '이전 접수공고 기록 · 최신 접수 재확인';
  }
  // 운영 상시, 기관 현존, 과거 공고, 접수 시작일만으로 '현재 접수 가능'이라 추정하지 않는다.
  const d=Array.isArray(s?.rounds)?s.rounds:[];
  if(d.length)return '회차별 안내 존재 · 현재 접수 별도 문의';
  if(s?.operationType==='상시')return '상시 운영 안내 · 현재 접수 별도 문의';
  return '현재 접수·대기·예산 확인 필요';
 }
 function route(o,s,e){const c=e?.contact||{};
  const local=(s.contacts||[]).find(x=>x.phone||x.dept)||{};
  if(c.phone)return {phone:c.phone,dept:c.unit||'',extension:c.extension||'',level:'공식 세부담당 안내',checkedOn:e.checkedOn||''};
  if(local.phone||local.dept)return {phone:local.phone||o.phone||'',dept:local.dept||'',extension:'',level:'등록된 서비스 연락창구(최신 여부 확인)',checkedOn:''};
  return {phone:o.phone||o.contact?.phone||'',dept:o.contact?.dept||'',extension:'',level:'기관 대표번호·담당부서 연결 필요',checkedOn:''};
 }
 function alternatives(entry,entries,f={},limit=3){
  const sourceNeeds=tags(entry.s,'need'),sourceTarget=tags(entry.s,'target'),sourceForm=tags(entry.s,'form');
  if(!sourceNeeds.length)return [];
  return entries.filter(e=>{
    if(e.s.id===entry.s.id||e.o.id===entry.o.id||['중단','폐지'].includes(e.o.status))return false;
    const n=tags(e.s,'need');if(!shared(sourceNeeds,n))return false;
    const t=tags(e.s,'target');
    if(f.target&&t.length&&!t.includes(f.target))return false;
    if(!f.target&&sourceTarget.length&&t.length&&!shared(sourceTarget,t))return false;
    return true;
  }).map(e=>{
    const n=tags(e.s,'need'),t=tags(e.s,'target'),k=tags(e.s,'form');
    const score=(e.o.level==='오산시'?5:e.o.level==='경기도'?3:1)+
      (shared(sourceNeeds,n)?7:0)+(f.target&&t.includes(f.target)?4:0)+
      (sourceTarget.length&&shared(sourceTarget,t)?2:0)+(shared(sourceForm,k)?1:0)+
      (e.o.phone||e.o.contact?.phone?1:0);
    return {entry:e,score,targetUnspecified:!t.length,reason:'같은 지원영역('+sourceNeeds.filter(x=>n.includes(x)).join('·')+') 대체 문의 후보'};
  }).sort((a,b)=>b.score-a.score||a.entry.s.name.localeCompare(b.entry.s.name,'ko')).slice(0,limit);
 }
 const api={norm,tags,matches,sourceState,intakeState,route,alternatives};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.ResourceServiceGuideModel=api;
})(typeof window!=='undefined'?window:globalThis);