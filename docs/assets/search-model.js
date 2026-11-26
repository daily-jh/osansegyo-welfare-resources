/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved. */
(function(root){'use strict';
  const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ko').replace(/[\s\u200b\u00a0]+/g,'');
  const aliases=[['어르신','노인','고령'],['위기가정','위기가구'],['정신건강','마음건강'],['주거지원','주거'],['의료비','치료비']];
  /* 현장 말 → 자료에 쓰인 말(한쪽 방향). 실무자가 쓰는 일상어로 찾아도 기관 소개·서비스 설명에 있는 말로 넓혀 찾는다.
     왼쪽 말이 검색어 안에 들어 있으면(예: '게임중독', '죽고 싶어요') 오른쪽 말 중 하나만 있어도 결과에 넣는다. */
  const fieldWords=[
    [['자해','자살','죽고싶','죽고 싶','극단적','극단선택','손목'],['자살','생명','정신건강위기','정신건강복지','청소년상담']],
    [['우울','불안','공황','트라우마','스트레스','마음이힘','마음이 힘'],['정신건강복지','심리','청소년상담']],
    [['무료급식','급식','결식','끼니','도시락','반찬','밥','굶'],['급식','식사','푸드뱅크','식품']],
    [['가출','갈곳','갈 곳','노숙','잘곳','잘 곳'],['쉼터','위기청소년','청소년상담']],
    [['게임','과몰입','폰중독','핸드폰','휴대폰'],['과의존','스마트폰','인터넷']],
    [['빚','부채','대출','신용불량','개인회생','사채'],['채무','신용','파산','서민금융']],
    [['통역','외국인','이주','결혼이민','한국어','다문화'],['다문화','외국인','다국어','다누리']],
    [['은둔','고립','외톨이','외로','방에만'],['정신건강복지','위기청소년','청소년상담']],
    [['전기요금','가스요금','공과금','난방','단전','단수','연료비'],['긴급복지','위기상담']],
    [['조손','조부모','할머니','할아버지'],['가족센터','드림스타트','조손']],
    [['안경','보청기'],['의료비']],
    [['병원비','수술비','치료비','약값'],['의료비','치료비']],
    [['학원비','공부','기초학력','과외','학습'],['학습','교육비','장학']],
    [['알바','아르바이트','구직','취직'],['취업','일자리','근로','노동']],
    [['임신','출산','산모','위기임신','미혼모'],['임산부','미혼모','출산','임신']],
    [['학교폭력','학폭','왕따','따돌림','괴롭힘'],['학교폭력','117','폭력']],
    [['성폭력','성추행','성희롱','불법촬영','몰카','디지털성범죄','그루밍','성착취'],['성폭력','성범죄','해바라기','1366']],
    [['가정폭력','부부폭력','데이트폭력','스토킹'],['폭력','1366','젠더폭력']],
    [['학대','방임','아동학대','노인학대'],['학대','아동보호']],
    [['이혼','양육비'],['법률','한부모']],
    [['월세','전세','보증금','집수리','쫓겨','퇴거'],['주거','월세','집수리']],
    [['치과','틀니'],['치과','의료비']],
    [['술','알코올','약물','담배'],['중독','정신건강복지']],
    [['도박','토토','불법도박'],['도박','중독']],
    [['생리대'],['생리','위생']],
    [['교복','장학금'],['교복','장학']],
    [['자퇴','학업중단','학교밖'],['학교밖','꿈드림']],
    [['초등학생','중학생','고등학생','초등학교','중학교','고등학교','초중고','재학생'],['청소년','아동','학생']],
    [['쌀','라면','식료품','기저귀','분유','생필품','생활용품'],['푸드뱅크','식품','현물']]
  ];
  /* 한 글자 말(술·빚·밥·굶·쌀)은 낱말 첫머리에서만 찾는다. '수술비·미술·기술'이 '술'로 잡혀 중독 기관이 섞이던 문제(2026-11-12). */
  const keyHit=(q,k)=>{const key=norm(k);if(key.length>1)return q.includes(key);return q.split(/[^가-힣a-z0-9]+/).some(t=>t.startsWith(key))};
  // 검색어(전체 또는 낱말)에 해당하는 자료 쪽 말 목록. 0건일 때 '이런 말로 찾아보세요'에도 쓴다.
  /* 입력 속도(2026-11-26): 글자 하나 칠 때마다 '필터 옆 숫자'까지 다시 세느라 기관·서비스 설명을 수만 번 다시 정규화해
     PC 약 0.9초, 휴대폰 4초씩 멈췄다. 같은 검색어의 해석과 서비스별 검색 대상 글은 한 번만 만들어 두고 다시 쓴다(결과는 같음). */
  const swCache=new Map(),qCache=new Map(),hayCache=new Map();
  const remember=(map,key,make)=>{if(map.has(key))return map.get(key);const v=make();if(map.size>400)map.clear();map.set(key,v);return v};
  function suggestWords(keyword){const q=norm(keyword);if(!q)return [];return remember(swCache,q,()=>{const out=[];
    fieldWords.forEach(([keys,targets])=>{if(keys.some(k=>keyHit(q,k)))targets.forEach(t=>{if(!out.includes(t))out.push(t)})});
    return out}).slice();
  }
  // 검색어를 한 번만 풀어 둔다: 전체 말, 넓혀 찾을 말, 낱말별(동의어·넓힌 말 포함) 후보.
  function compile(keyword){const q=String(keyword||'').trim();return remember(qCache,q,()=>({
    whole:norm(q),wide:suggestWords(q).map(norm),
    tokens:q.split(/\s+/).map(token=>{const group=aliases.find(g=>g.includes(token));return (group||[token]).concat(suggestWords(token)).map(norm)})}))}
  function hit(hay,c){if(hay.includes(c.whole))return true;if(c.wide.some(x=>hay.includes(x)))return true;return c.tokens.every(alts=>alts.some(x=>hay.includes(x)))}
  function queryMatch(text,keyword){if(!String(keyword||'').trim())return true;return hit(remember(hayCache,String(text??''),()=>norm(text)),compile(keyword))}
  // 서비스마다 검색 대상 글(기관 이름·유형·서비스 설명·꼬리표)을 한 번만 정규화해 둔다.
  const svcHay=new WeakMap(),svcHit=new WeakMap();
  function serviceKeywordMatch(o,s,keyword){const q=String(keyword||'').trim();if(!q)return true;if(!s||typeof s!=='object')return queryMatch('',q);
    const last=svcHit.get(s);if(last&&last.o===o&&last.q===q)return last.ok;
    let h=svcHay.get(s);if(!h||h.o!==o){const tags=s.tags||{};h={o,text:norm([o.name,o.kind,s.name,s.category,s.target,s.description,s.method,...Object.values(tags).flat()].join(' '))};svcHay.set(s,h)}
    const ok=hit(h.text,compile(q));svcHit.set(s,{o,q,ok});return ok}
  // 서비스마다 오늘 날짜를 새로 만들던 것이 입력 지연의 가장 큰 원인이었다(날짜 서식기 생성이 무거움). 서식기는 한 번만, 날짜는 1분마다만 다시 계산한다.
  let dayFmt=null,dayAt=0,dayVal='';
  const today=()=>{const now=Date.now();if(dayVal&&now-dayAt<60000)return dayVal;dayFmt=dayFmt||new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});dayAt=now;dayVal=dayFmt.format(new Date(now));return dayVal};
  function roundState(r,day=today()){
    if(r.closes_on&&day>r.closes_on)return '마감';
    if(r.opens_on&&day<r.opens_on)return '예정';
    if(r.opens_on&&r.closes_on&&r.verified_on&&r.source_url&&r.local_available==='가능')return '모집중';
    return '확인 필요';
  }
  function applicationState(s,day=today()){
    if(s.externalProgram&&typeof root.ProgramFeed!=='undefined')return root.ProgramFeed.status(s.externalProgram,day);
    if(s.operationType==='상시')return '상시';
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
    return serviceKeywordMatch(o,s,state.keyword);
  }
  // 다음 확인 예정일(next_check_on)이 지났는지. 예정일이 없으면 판단하지 않는다.
  function recheckDue(s,day=today()){const next=s&&s.verification&&s.verification.next;return !!next&&day>next}
  const api={norm,queryMatch,suggestWords,recheckDue,matchesService,applicationState,roundState,today};
  if(typeof module!=='undefined')module.exports=api;else root.ResourceSearch=api;
})(typeof window!=='undefined'?window:globalThis);
