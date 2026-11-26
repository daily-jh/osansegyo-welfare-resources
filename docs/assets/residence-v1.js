/* © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.
   사는 동(행정동) 공통 규칙 v1 (2026-11-26).
   메인 복지자원 찾기 · 오산 통합돌봄 길잡이 · 복지혜택 자가점검이 함께 쓰고, 규칙은 OY-RALS(청소년 위기징후) 거주 지역 로직과 같다.
   - 오산 8개 동을 고르면: 그 동 행정복지센터와 그 권역 종합사회복지관을 먼저 보이고, 다른 동 행정복지센터·다른 권역 복지관은 뺀다.
     (OY-RALS support-model.js routingResources·welfareResources와 같음. 권역은 2026-10-23 지훈 제공.)
   - 수원·화성·평택을 고르면: 그 시 기관을 먼저, 경기·전국 기관 다음, 오산 기관은 맨 뒤에 회색 '오산 기관(참고)'로 둔다.
     오산 동 행정복지센터와 복지관 권역은 그 시 주민이 쓰지 않으므로 뺀다(OY-RALS regionRank·regionRole·orderForRegion과 같음).
   - 기타 지역은 오산 밖 기관 목록이 없어 오산 기관을 예시(참고)로만 둔다.
   - 행정동은 사용자가 고른 값만 쓰고 도로명·법정동에서 추측하지 않는다. 저장하거나 밖으로 보내지 않는다.
   - tests/residence-parity.cjs가 동 목록·권역·인근 시 값이 OY-RALS(support-model.js)와 같은지 확인한다. */
(function(root){'use strict';
const DONGS=['중앙동','대원1동','대원2동','남촌동','신장1동','신장2동','세마동','초평동'];
const NEAR_CITIES=['수원시','화성시','평택시'],OTHER='오산시 외',OUTSIDE=NEAR_CITIES.concat([OTHER]);
const ZONES=[{number:1,name:'오산세교종합사회복지관',orgId:'b45bc16582',dongs:['신장1동','신장2동','세마동']},{number:2,name:'오산종합사회복지관',orgId:'36cf6918f3',dongs:['남촌동','중앙동']},{number:3,name:'오산남부종합사회복지관',orgId:'2097512abd',dongs:['대원1동','대원2동','초평동']}];
const GENERIC_CENTER='오산시 동 행정복지센터';
const CENTER_RE=/^오산시 (중앙동|대원[12]동|남촌동|신장[12]동|세마동|초평동) 행정복지센터$/;
const TIERS=['osan','near','gyeonggi','national-public','national-private'];
const LABEL={'수원시':'수원시 (타권역)','화성시':'화성시','평택시':'평택시','오산시 외':'기타 지역'};

function valid(v){v=String(v==null?'':v).trim();return DONGS.includes(v)||OUTSIDE.includes(v)?v:''}
function isDong(v){return DONGS.includes(v)}
function isOutside(v){return OUTSIDE.includes(v)}
function nearCity(v){return NEAR_CITIES.includes(v)?v:''}
function zone(v){return ZONES.find(z=>z.dongs.includes(v))||null}
// 기관 표현이 화면마다 달라서({name,id} · {org,orgId} · {기관명}) 이름·id만 꺼내 쓴다.
const nameOf=o=>String(o&&(o.name||o.org||o['기관명'])||'').trim();
const idOf=o=>String(o&&(o.id||o.orgId)||'');
function centerDong(o){const m=CENTER_RE.exec(nameOf(o));return m?m[1]:''}
function zoneOf(o){const n=nameOf(o),id=idOf(o);return ZONES.find(z=>z.orgId===id||z.name===n)||null}
function isOsan(o){return !!o&&(o.tier==='osan'||!o.tier&&(o.level==='오산시'||o['범주']==='오산시')||/^오산/.test(nameOf(o)))}
function tierIndex(o){const k=TIERS.indexOf(o&&o.tier);if(k>=0)return k;const l=o&&(o.level||o['범주']);return l==='오산시'?0:l==='경기도'?2:3}

/* 기관의 역할: mine(내 동 관할 창구) · other(다른 동·다른 권역 → 뺀다) · local(그 시 기관) · shared(경기·전국) · near-ref(다른 인근 시 기관, 참고) · osan-ref(오산 기관, 참고) · ''(동 미선택 또는 관할과 무관) */
function role(o,v){
  v=valid(v);if(!v||!o)return '';
  const cd=centerDong(o),z=zoneOf(o),generic=nameOf(o)===GENERIC_CENTER;
  // 동을 고르면 8개 동을 묶어 안내하던 '오산시 동 행정복지센터'도 관할 창구 하나로 바뀌므로 뺀다(OY-RALS와 같음).
  if(isDong(v)){if(cd)return cd===v?'mine':'other';if(z)return z.dongs.includes(v)?'mine':'other';return generic?'other':''}
  if(cd||z||generic)return 'other';
  const city=nearCity(v);
  if(city&&o.tier==='near'&&o.tierCity===city)return 'local';
  // 다른 인근 시 기관(예: 수원 거주인데 화성 쉼터)은 그 시 주민 대상이 많아 경기·전국 기관 뒤, 오산 기관 앞에 참고로 둔다.
  if(o.tier==='near')return 'near-ref';
  return isOsan(o)?'osan-ref':'shared';
}
// 정렬 값: 내 동 창구·그 시 기관 -1 → 지역 범주(오산 0 … 전국 민간 4) → 오산 기관(참고) 8. OY-RALS regionRank와 같다.
const RANK={mine:-1,local:-1,'near-ref':7,'osan-ref':8,other:9};
function rank(o,v){const r=role(o,v);return r in RANK?RANK[r]:tierIndex(o)}
function tag(o,v){const r=role(o,v);v=valid(v);if(r==='mine'){const z=zoneOf(o);return z?z.number+'권역 복지관':v+' 관할'}return r==='local'?v+' 기관':r==='osan-ref'?'오산 기관(참고)':r==='near-ref'?(o.tierCity||'인근 시')+' 기관(참고)':r==='other'?'다른 관할':''}
function tagHTML(o,v){const r=role(o,v),t=tag(o,v);return t?'<span class="res-tag res-'+r+'">'+esc(t)+'</span>':''}
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* 목록에 적용: 다른 관할(other)은 빼고(keep(o)가 참이면 남김), 정렬 값이 같으면 원래 순서를 지킨다. get은 목록 항목에서 기관을 꺼내는 함수. */
function apply(list,v,opts){
  v=valid(v);if(!v||!Array.isArray(list))return list;
  const o=opts||{},get=o.get||(x=>x),keep=o.keep||(()=>false),useTier=o.tier!==false;
  return list.map((x,i)=>{const org=get(x),r=role(org,v);return {x,i,r,k:r in RANK?RANK[r]:useTier?tierIndex(org):0,org}})
    .filter(e=>e.r!=='other'||keep(e.x))
    .sort((a,b)=>(o.sort===false?0:a.k-b.k)||a.i-b.i).map(e=>e.x);
}

/* 결과 위 안내 한 줄(OY-RALS outsideNotice와 같은 말). list는 apply 뒤 기관 목록. */
function notice(v,list,get){
  v=valid(v);if(!v)return null;get=get||(x=>x);const orgs=(list||[]).map(get).filter(Boolean);
  if(isDong(v)){const z=zone(v);return {kind:'dong',title:v+' 기준으로 보는 중',text:'관할 '+v+' 행정복지센터'+(z?'와 '+z.number+'권역 '+z.name:'')+'을 먼저 보여 드립니다. 다른 동 행정복지센터와 다른 권역 복지관은 뺐습니다. 실제 주민등록·거주 관할은 접수 때 확인합니다.'}}
  const city=nearCity(v),place=city||'거주 지역';
  const local=orgs.filter(o=>role(o,v)==='local'),refs=Array.from(new Set(orgs.filter(o=>role(o,v)==='osan-ref').map(nameOf))).sort((x,y)=>Number(!/^오산시/.test(x))-Number(!/^오산시/.test(y)));
  const lead=city?(local.length?city+' 기관 '+local.length+'곳을 먼저 보여 드립니다.':city+'에서 같은 역할로 확인한 기관이 아직 없습니다.'):'오산 밖 지역은 기관 목록이 없어 오산 기관을 예시로만 보여 드립니다.';
  const ex=refs.length?'회색으로 표시한 '+refs.slice(0,4).join(', ')+(refs.length>4?' 등':'')+'은 오산의 예시입니다. '+place+' 안에서 같은 역할을 하는 기관에 문의해 주세요.':'';
  return {kind:city?'near':'other',title:(LABEL[v]||v)+' 거주 기준으로 보는 중',city,local:local.length,examples:refs,text:(lead+' '+ex).trim()};
}
function noticeHTML(n){return n?'<div class="res-notice res-notice-'+n.kind+'" role="status"><b>'+esc(n.title)+'</b>'+esc(n.text)+'</div>':''}

/* 선택칸 보기(OY-RALS 01 입력 studentDong과 같은 순서·이름) */
function optionsHTML(selected,first){selected=valid(selected);const op=v=>'<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(LABEL[v]||v)+'</option>';
  return '<option value="">'+esc(first||'고르지 않음 · 전체 보기')+'</option><optgroup label="오산시 행정동">'+DONGS.map(op).join('')+'</optgroup><optgroup label="오산시 밖">'+OUTSIDE.map(op).join('')+'</optgroup>'}
// 고른 동은 주소의 ?dong= 로만 넘긴다(저장하지 않음). 세 화면 사이를 오갈 때 같은 동이 이어진다.
function fromURL(href){try{return valid(new URL(href||root.location.href).searchParams.get('dong'))}catch(_){return ''}}
function withDong(href,v){v=valid(v);if(!v)return href;const [base,hash]=String(href).split('#');return base+(base.includes('?')?'&':'?')+'dong='+encodeURIComponent(v)+(hash!=null?'#'+hash:'')}
function zoneText(v){v=valid(v);const z=zone(v);return z?v+' · '+z.number+'권역 '+z.name:nearCity(v)?v+' · 그 시 기관 먼저, 오산 기관은 참고':v===OTHER?'기타 지역 · 오산 기관은 참고':'고르지 않음 · 8개 동 창구를 모두 보여 줍니다'}

const api=Object.freeze({VERSION:'1.0.0-20261126',DONGS,NEAR_CITIES,OTHER,OUTSIDE,ZONES,GENERIC_CENTER,valid,isDong,isOutside,nearCity,zone,zoneOf,centerDong,isOsan,role,rank,tag,tagHTML,apply,notice,noticeHTML,optionsHTML,fromURL,withDong,zoneText});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Residence=api;
})(typeof window!=='undefined'?window:globalThis);
