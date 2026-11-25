/* 공공데이터 기관 목록 v1 — docs/public-api/facilities.json(매주 공공 API 수집 결과)을 여러 화면이 함께 쓰는 공통 층.
   · 원문 그대로의 기관 목록이며 운영 여부·연락처는 이용 전 기관에 확인한다. 복지자원 DB와 같은 기관이면 match_id로 잇는다.
   · 쓰는 곳: 공공데이터 기관 목록(public-facilities.html), 자원 공백 지도, 오산 통합돌봄 길잡이, OY-RALS 03 지역자원연계.
   · 개인정보를 받지도 보내지도 않는다. 같은 누리집의 JSON 파일 하나만 읽는다. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261125';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* 복지자원 DB 욕구영역(taxonomy.need) → 수집 설정의 uses(대표 영역) */
const NEED_USES={
 '정신건강':['mental'],'의료·건강':['mental'],'안전·권리보호':['abuse','shelter'],'주거':['shelter'],'교육':['school'],
 '고용·자립':['independence'],'사례관리':['youth'],'돌봄':['care'],'가족지원':['youth'],'소득·생계':['crisis']
};
/* 청소년·아동만 대상으로 하는 데이터(성인 대상 칸에는 보이지 않게) */
const YOUTH_ONLY=new Set(['kyci-safetynet-center','mogef-youth-shelter','knise-special-ed-center','std-local-child-center',
 'std-teen-training-fclt','goe-school-link-partners','moj-probation-office']);
const YOUTH_TARGETS=/아동|청소년|영유아|가족|위기가구|장애인/;
const USE_LABEL={mental:'정신건강',youth:'위기청소년·상담',shelter:'쉼터·보호',abuse:'폭력·성폭력 피해',school:'학업·학교',
 independence:'자립·배움터',addiction:'중독',crisis:'긴급·안전',care:'돌봄통합'};

/* 오산에서 가까운 경기 시·군 순서(대중교통·생활권 기준의 대략적 순서). 오산 기관은 늘 맨 앞. */
const NEAR=['화성','평택','수원','용인','안성','의왕','군포','안산','안양','성남','광명','부천','시흥','이천','광주','하남','과천'];
function nearRank(i){if(i.region==='osan')return -1;const a=String(i.address||'')+' '+String(i.name||'');const k=NEAR.findIndex(c=>a.includes(c));return k<0?99:k}
function nearFirst(items){return items.map((x,n)=>[x,n]).sort((a,b)=>nearRank(a[0])-nearRank(b[0])||a[1]-b[1]).map(z=>z[0])}

let cache=null;
function load(url){
 if(cache)return cache;
 if(!root.fetch)return Promise.resolve(null);
 cache=root.fetch(url||'public-api/facilities.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
  .then(d=>{api.data=d&&Array.isArray(d.groups)?d:null;return api.data});
 return cache}

function groups(d){return d&&Array.isArray(d.groups)?d.groups.filter(g=>Array.isArray(g.items)&&g.items.length):[]}
function byUses(d,uses,opt){opt=opt||{};const want=new Set(uses||[]);
 return groups(d).filter(g=>(g.uses||[]).some(u=>want.has(u))&&!(opt.adult&&YOUTH_ONLY.has(g.id)))}
function forNeed(d,need,target){const uses=NEED_USES[need]||[];if(!uses.length)return [];
 return byUses(d,uses,{adult:target&&!YOUTH_TARGETS.test(target)})}
function counts(d){const gs=groups(d);let osan=0,gg=0;for(const g of gs)for(const i of g.items)(i.region==='osan'?osan++:gg++);
 return {groups:gs.length,osan,gyeonggi:gg,total:osan+gg,date:d&&d.generatedAt?String(d.generatedAt).slice(0,10):''}}

function tel(p){const t=String(p||'').replace(/[^\d-]/g,'');return t.length>=7?t:''}
function phoneText(p){const raw=String(p||'').trim();if(/^\d{9,11}$/.test(raw)){return raw.replace(/^(02)(\d{3,4})(\d{4})$/,'$1-$2-$3').replace(/^(0\d{2})(\d{3,4})(\d{4})$/,'$1-$2-$3')}return raw}
function site(u){const s=String(u||'').trim();if(!s)return '';const full=/^https?:\/\//.test(s)?s:'https://'+s;return /^https:\/\/[\w.-]+\.[a-z]{2,}(\/[^\s"<>]*)?$/i.test(full.replace(/^http:/,'https:'))?full:''}
function item(i,opt){opt=opt||{};const ph=phoneText(i.phone);const t=tel(ph);const w=site(i.site);
 const db=i.match_id?'<a class="pf-db" href="'+esc(opt.dbLink?opt.dbLink(i.match_id):'./#org='+encodeURIComponent(i.match_id))+'">복지자원 DB에 있음</a>':'';
 return '<li class="pf-item'+(i.region==='osan'?' pf-osan':'')+'"><div class="pf-top"><strong>'+esc(i.name)+'</strong>'
  +(i.kind&&!/^\d/.test(i.kind)?'<span class="pf-kind">'+esc(i.kind)+'</span>':'')+(i.region==='osan'?'<span class="pf-here">오산</span>':'<span class="pf-near">경기</span>')+db+'</div>'
  +(i.address?'<p class="pf-addr">'+esc(i.address)+'</p>':'')
  +'<p class="pf-meta">'+(ph?(t?'<a href="tel:'+esc(t)+'">'+esc(ph)+'</a>':esc(ph)):'')+(i.hours?(ph?' · ':'')+'평일 '+esc(i.hours):'')
  +(w?((ph||i.hours)?' · ':'')+'<a href="'+esc(w)+'" target="_blank" rel="noopener noreferrer">누리집 ↗</a>':'')+'</p>'
  +(opt.summary&&i.summary?'<p class="pf-sum">'+esc(String(i.summary).slice(0,140))+'</p>':'')+'</li>'}
function group(g,opt){opt=opt||{};const osan=g.items.filter(i=>i.region==='osan'),near=nearFirst(g.items.filter(i=>i.region!=='osan'));
 const limit=opt.limit||6;const list=(osan.length?osan.concat(opt.all?near:[]):near).slice(0,limit);const more=g.items.length-list.length;
 return '<section class="pf-group" data-pf="'+esc(g.id)+'"><h4>'+esc(g.label||g.name)+' <small>오산 '+osan.length+(near.length?' · 경기 '+near.length:'')+'</small></h4>'
  +(osan.length?'':'<p class="pf-none">오산 안에는 없습니다. 가까운 경기 기관을 함께 봅니다.</p>')
  +'<ul>'+list.map(i=>item(i,opt)).join('')+'</ul>'
  +(more>0&&opt.moreLink!==false?'<p class="pf-more"><a href="'+esc((opt.base||'')+'public-facilities.html#'+g.id)+'">'+more+'곳 더 보기 →</a></p>':'')+'</section>'}
function foot(d){const c=counts(d);return '<p class="pf-foot">출처: 공공데이터포털 기관 목록(원문 그대로, '+esc(c.date||'수집일 확인 중')+' 수집). 운영 여부·연락처는 이용 전 기관에 확인하세요.</p>'}
function html(gs,d,opt){opt=opt||{};if(!gs||!gs.length)return '';
 return '<div class="pf">'+(opt.title?'<h3 class="pf-title">'+esc(opt.title)+'</h3>':'')+(opt.intro?'<p class="pf-intro">'+esc(opt.intro)+'</p>':'')
  +gs.map(g=>group(g,opt)).join('')+foot(d)+'</div>'}

const api={version:VERSION,NEED_USES,USE_LABEL,YOUTH_ONLY,data:null,load,groups,byUses,forNeed,counts,html,group,item,phoneText,nearFirst};
if(node)module.exports=api;else root.PublicFacilities=api;
})(typeof window!=='undefined'?window:globalThis);
