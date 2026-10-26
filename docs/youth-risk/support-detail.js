(function(root){'use strict';
// Detail layer for the support map. It explains recommendations and data status only;
// it never changes which institutions YouthMap recommends or in what order.
var Map_=typeof module!=='undefined'?require('./support-model.js'):root.YouthMap;
var SAFETY=[1,2,7,25];
function today(now){var d=now instanceof Date?now:new Date(now||Date.now());try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}catch{return d.toISOString().slice(0,10)}}
function isDate(t){return /^\d{4}-\d{2}-\d{2}$/.test(String(t||''))}
function days(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5)}
function short(t,n){var c=Array.from(String(t||'').replace(/\s+/g,' ').trim());return c.length>n?c.slice(0,n-1).join('')+'…':c.join('')}

// Existence of a service in the DB is not the same as being able to apply today.
function availability(row,now){
 var t=today(now),rounds=(row.rounds||[]).filter(r=>isDate(r.opens_on)||isDate(r.closes_on)),local=row.localAvailable||'',type=row.operationType||'',out;
 if(rounds.length){
  var open=rounds.find(r=>(!isDate(r.opens_on)||r.opens_on<=t)&&(!isDate(r.closes_on)||t<=r.closes_on)),next=rounds.filter(r=>isDate(r.opens_on)&&r.opens_on>t).sort((a,b)=>a.opens_on<b.opens_on?-1:1)[0];
  if(open){var left=isDate(open.closes_on)?days(t,open.closes_on):null;out={code:'open',tone:'ok',label:'접수기간 중'+(isDate(open.closes_on)?' · '+open.closes_on+' 마감'+(left<=7?' (D-'+left+')':''):''),round:open}}
  else if(next)out={code:'upcoming',tone:'info',label:'접수 예정 · '+next.opens_on+' 시작',round:next};
  else{var last=rounds.slice().sort((a,b)=>(a.closes_on||'')<(b.closes_on||'')?1:-1)[0];out={code:'closed',tone:'warn',label:'등록된 접수기간 마감'+(isDate(last.closes_on)?' · '+last.closes_on:'')+' · 다음 공고 확인',round:last}}
 }else if(type==='상시'||/상시/.test(row['운영확인']||''))out={code:'ongoing',tone:'info',label:'상시 운영 사업 · 접수 가능 여부는 문의'};
 else if(type==='공모형'||/모집|공고|공모/.test(row['운영확인']||''))out={code:'call',tone:'warn',label:'공모·모집형 · 현재 모집 여부 확인'};
 else if(type==='시즌')out={code:'season',tone:'warn',label:'시기별 운영 · 운영 시기 확인'};
 else out={code:'unknown',tone:'warn',label:'운영·접수 상태 미확인'};
 out.local=local==='가능'?'오산 거주 학생 이용 대상으로 등록':local==='불가'?'오산 거주 학생 이용 불가로 등록':'오산 거주 학생 이용 여부 확인 필요';
 // Only an open round that is registered as locally available counts as "applicable now".
 out.applicableNow=out.code==='open'&&local==='가능'?true:out.code==='closed'?false:null;
 out.exists=true;
 return out;
}
function verification(row,now){
 var t=today(now),v=row.verification||{},status=v.status||'',date=isDate(v.date)?v.date:'',out;
 if(!row.directorySource)return {level:'unverified',tone:'warn',label:'미검증 · 기존 목록 자료',date:'',detail:'공용 자원 DB가 아닌 이전 목록 자료입니다. 기관 공식 안내로 사업과 연락처를 먼저 대조해 주세요.'};
 if(status==='확인완료'&&date)out={level:'verified',tone:'ok',label:'공식 안내 확인 '+date};
 else if(date)out={level:'partial',tone:'info',label:'기관 안내 확인 '+date+' · 사업별 접수 미확인'};
 else out={level:'unverified',tone:'warn',label:'미검증 · 등록정보만 있음'};
 out.date=date;out.method=v.method||'';out.next=isDate(v.next)?v.next:'';
 var age=date?days(date,t):null,flags=[];
 if(out.next&&out.next<t)flags.push('재확인 예정일('+out.next+') 지남');
 else if(age!==null&&age>90)flags.push('확인 후 '+age+'일 경과 · 재확인 권장');
 out.flags=flags;
 out.detail=[out.method||(date?'':'공식 안내 대조 기록 없음'),row['최종검토일']?'DB 검토 '+row['최종검토일']:'',out.next&&!flags.length?'다음 확인 예정 '+out.next:''].concat(flags).filter(Boolean).join(' · ');
 return out;
}
function intake(row){
 var x=root.YouthLinks?root.YouthLinks.resolve(row):{phone:row['대표전화']||'',contactDept:row.contactDept||'',contacts:row.contacts||[]},lines=[];
 lines.push(['신청·연계 방법',row['신청·연계방법']||'기관 문의']);
 var desks=(x.contacts||[]).filter(c=>c.phone).map(c=>(c.dept||'사업 접수창구')+' '+c.phone+(c.hours?' ('+c.hours+')':'')+(c.verified_on?' · 확인 '+c.verified_on:''));
 if(desks.length)lines.push(['사업 접수창구',desks.join(' / ')]);
 var hours=row.orgContact&&row.orgContact.hours;
 lines.push(['기관 문의',(x.phone||'직통전화 확인 필요')+(x.contactDept?' · '+x.contactDept:'')+(hours?' · '+hours:'')+(row.orgContact&&row.orgContact.verifiedOn?' · 확인 '+row.orgContact.verifiedOn:'')]);
 if(row['운영확인'])lines.push(['운영 확인',row['운영확인']]);
 if(row.jurisdiction)lines.push(['관할',row.jurisdiction]);
 if(row.routingReason)lines.push(['권역·관할 연결',row.routingReason]);
 return lines;
}
function itemText(p,n){var off=0;for(var i=0;i<p.domains.length;i++){var size=p.domains[i].items.length;if(n<=off+size)return p.domains[i].items[n-off-1]||'';off+=size}return ''}
// Why this service appears: which match rule found it, which answers support it, why it ranks here.
function basis(p,d,row){
 var meta=Map_.describe(p,d,row),prof=Map_.profileFor(row),extra=Map_.additional(p,d,row),kind,kindText;
 if(prof){kind='profile';kindText='역할 지정 사업 · 이 사업이 맡는 문항('+prof.items.filter(n=>d.numbers.includes(n)).join('·')+'번)에 응답이 있어 연결'}
 else if(extra){kind='additional';kindText='추가 문의 후보 · 해당 문항 점수가 기준 이상일 때만 표시'}
 else{kind='keyword';kindText='사업 설명 낱말 일치로 찾은 후보 · 이 학생에게 맞는 역할인지 먼저 확인'}
 var items=meta.evidence.map(n=>({n,score:p.answers[n-1],text:short(itemText(p,n),46),safety:SAFETY.includes(n)}));
 var why=meta.safety?'안전 관련 응답('+items.filter(x=>x.safety).map(x=>x.n+'번').join('·')+')과 직접 이어지는 기관이라 먼저 놓았습니다':meta.critical?'3~4점인 보호·건강·필수생활 문항과 이어져 앞에 놓았습니다':meta.max>=3?'3점 이상 응답이 있는 어려움과 이어집니다':meta.max>=2?'반복되는 어려움(2점)과 이어집니다':'1점 응답과 이어지는 관찰·상담 문의 후보입니다';
 return {kind,kindText,items,why,strength:kind==='keyword'?'약함':meta.safety||meta.critical||meta.max>=3?'강함':'보통',zone:row.routingReason||''};
}
function key(row){return String(row.serviceId||((row['기관명']||'')+'|'+(row['서비스명']||'')))}
// Other institutions that answer the same reported items, ranked by overlap.
function alternatives(p,d,group,groups,now){
 var own=new Set(Map_.describe(p,d,group.primary).evidence);
 return (groups||Map_.groupedCandidates(p,d)).filter(g=>g.name!==group.name).map(g=>{
  var best=g.services.map(r=>({r,ev:Map_.describe(p,d,r).evidence.filter(n=>own.has(n))})).sort((a,b)=>b.ev.length-a.ev.length)[0];
  return {name:g.name,service:best.r['서비스명']||'기관 상담',overlap:best.ev,availability:availability(best.r,now).label,verification:verification(best.r,now).label};
 }).filter(x=>x.overlap.length).sort((a,b)=>b.overlap.length-a.overlap.length).slice(0,3);
}
function bundle(p,d,group,now){return group.services.map(r=>({key:key(r),name:r['서비스명'],category:r['지원분야']||'',evidence:Map_.describe(p,d,r).evidence,availability:availability(r,now),verification:verification(r,now)}))}

var api={today,availability,verification,intake,basis,alternatives,bundle,key};
if(typeof module!=='undefined')module.exports=api;else root.YouthSupportDetail=api;
})(typeof window!=='undefined'?window:globalThis);
