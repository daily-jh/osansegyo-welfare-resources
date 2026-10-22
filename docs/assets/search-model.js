/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
(function(root){'use strict';
  const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ko').replace(/[\s\u200b\u00a0]+/g,'');
  const aliases=[['어르신','노인','고령'],['위기가정','위기가구'],['정신건강','마음건강'],['주거지원','주거'],['의료비','치료비']];
  function queryMatch(text,keyword){const hay=norm(text),q=String(keyword||'').trim();if(!q)return true;
    if(hay.includes(norm(q)))return true;
    return q.split(/\s+/).every(token=>{const group=aliases.find(g=>g.includes(token));return (group||[token]).some(x=>hay.includes(norm(x)))});
  }
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function roundState(r,day=today()){
    if(r.closes_on&&day>r.closes_on)return '마감';
    if(r.opens_on&&day<r.opens_on)return '예정';
    if(r.opens_on&&r.closes_on&&r.verified_on&&r.source_url&&r.local_available==='가능')return '모집중';
    return '확인 필요';
  }
  function applicationState(s,day=today()){
    if(s.operationType!=='공모형')return '확인 필요';
    const states=(s.rounds||[]).map(r=>roundState(r,day));
    for(const label of ['모집중','예정','확인 필요'])if(states.includes(label))return label;
    return states.length?'마감':'확인 필요';
  }
  function matchesService(o,s,state,day){
    const tags=s.tags||{};
    if(state.need&&!(tags.need||[]).includes(state.need))return false;
    if(state.audience&&!(tags.target||[]).includes(state.audience))return false;
    if(state.form&&!(tags.form||[]).includes(state.form))return false;
    if(state.intake&&!(tags.intake||[]).includes(state.intake))return false;
    if(state.local&&s.localAvailable!==state.local)return false;
    if(state.operation&&s.operationType!==state.operation)return false;
    if(state.verified&&s.verification.status!==state.verified)return false;
    if(state.application&&applicationState(s,day)!==state.application)return false;
    // Institution identity is shared; eligibility filters always apply to this service.
    return queryMatch([o.name,o.kind,s.name,s.category,s.target,s.description,s.method,...Object.values(tags).flat()].join(' '),state.keyword);
  }
  const api={norm,queryMatch,matchesService,applicationState,roundState,today};
  if(typeof module!=='undefined')module.exports=api;else root.ResourceSearch=api;
})(typeof window!=='undefined'?window:globalThis);
