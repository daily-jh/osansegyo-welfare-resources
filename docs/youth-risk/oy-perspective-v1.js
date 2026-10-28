/* OY-RALS perspective packs v1: after the assessment, turns the scale, the narrative analysis, the deep
   interpretation and the regional map into printable working sheets for each reader.
   03 school support (homeroom teacher, education welfare worker) and 04 agency case management
   (community welfare centre, child·family agencies, administrative welfare centre).
   Reads model outputs only. It never changes CORE scores, the official safety decision or SUPPORT-5. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261027';
const need=(n,g)=>node?require('./'+n):root[g];
const C=()=>need('criteria.js','YouthCriteria');
const D=()=>need('oy-deep-interpretation-v1.js','OYDeepInterpretation');
const NI=()=>need('oy-narrative-interpretation-v1.js','OYNarrativeInterpretation');
const FIVE=()=>need('integrated-index-v1.js','OYFiveLevelIndex');
const M=()=>need('support-model.js','YouthMap');
const OD=()=>need('oy-decision-v1.js','OYDecision');
const OC=()=>need('oy-constants-v1.js','OYConstants');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isInteger(v)?v:null;
const SAFETY=OC().SAFETY_ITEMS;

/* 교실에서 보이는 모습(관찰 기록지용). 안전문항은 2주 관찰 대상이 아니라 바로 확인 대상이라 넣지 않는다. */
const OBS={3:'괴롭힘·놀림을 당하는 장면',4:'금품·심부름 강요 정황',5:'친구에게 위협·폭력',6:'표정이 가라앉거나 말수가 줆',8:'수업 중 멍함·긴장·졸음',9:'지각 (교시를 적기)',10:'과제 미제출·수업 중 멈춤',11:'학교가 싫다·그만두고 싶다는 말',12:'물건 파손·충동 행동',13:'음주·흡연 등 위험 행동 이야기',14:'학습 편의가 없어 수업을 놓침',15:'필요한 지원을 못 받는 장면',16:'아침 결식·피로',17:'보호자 연락이 닿지 않음',18:'집안일·형제 돌봄으로 빠짐',19:'체육복·준비물 미지참',20:'잘 곳·씻을 곳 문제 이야기',21:'비용 때문에 신청을 미룸',22:'혼자 있는 시간·말할 사람 없음',23:'원하는 활동에서 빠짐',24:'1교시 졸음·늦은 시간 기기 이용 이야기'};
const LAWCAT=[['기초학력',[10],'기초학력 진단 결과'],['경제적 어려움',[19,20,21],'교육급여·급식 지원 이력'],['심리·정서',[6,8,24],'담임 관찰, 상담 기록'],['학교폭력',[3,4,5],'학교폭력 사안 처리 여부'],['아동학대',[1,2],'교육복지사·상담교사 면담'],['경계선 지능',[],'필요 시 학습 관찰']];
/* 통합사례관리 선정 기준(오산세교종합사회복지관, 2026-10-27): 2개 이상 기관의 전문적 개입이 필요한 경우.
   2점 이상 생활영역을 맡을 전문 분야로 묶어 센다. 안전 문항(위기 영역)에 응답이 있으면 공동 개입으로 본다. 분야 묶음은 시스템 제안.
   학교 안 지원(담임·교육복지사·Wee)은 하나의 기관이자 개입체계로 센다(지훈 결정 2026-10-27). 계산은 oy-decision-v1.js의 판정 사슬이 맡는다. */
const FIELD=OC().SYSTEM_OF_DOMAIN;
const LEVEL2PICK={crisis:'위기',intensive:'집중',general:'일반',brief:'단순 연계',monitor:'비해당'};

function analyze(payload){
  const p=payload;const out={p,errors:[]};
  const t=(k,f)=>{try{out[k]=f()}catch(e){out[k]=null;out.errors.push(k+': '+(e&&e.message||e))}};
  t('core',()=>C().evaluate(p.answers,(p.domains||[]).map(x=>x.items.length),false,p.followups||{}));
  t('d',()=>D().build(p));
  t('n',()=>NI().narrative(p));
  t('five',()=>FIVE().analyze(p));
  t('map',()=>{const m=M();const ctx=m.context(p);const ranked=m.rank(ctx.domains||m.domains(p)).filter(x=>x.peak>=2);const res=[],seen=new Set();
    for(const dm of ranked)for(const g of (m.groupedCandidates(p,dm)||[]).slice(0,3)){const r=g.primary;if(!r)continue;const k=r.기관명+'|'+r.서비스명;if(seen.has(k))continue;seen.add(k);
      res.push({domain:dm.label,org:r.기관명,type:r.기관유형||'',svc:r.서비스명||'',how:r['신청·연계방법']||'',ver:(r.verification&&r.verification.status)||'미확인',dept:r.contactDept||''});}
    return res;});
  const rows=Array.isArray(p.resources)?p.resources:[];
  out.find=re=>rows.filter(r=>re.test((r.기관명||'')+' '+(r.서비스명||''))).map(r=>({org:r.기관명,svc:r.서비스명||'',how:r['신청·연계방법']||'',ver:(r.verification&&r.verification.status)||'미확인'}));
  return out;
}

// ---------- 시트와 작은 부품 ----------
function kit(A){
  const d=A.d,n=A.n||{present:false,read:{sentences:[],findings:[]},compare:{rows:[]}},core=A.core||{},five=A.five;
  const items=d.items;const val=k=>num((items.find(x=>x.n===k)||{}).value);const topic=k=>(items.find(x=>x.n===k)||{}).topic||('문항 '+k);
  const unknown=items.filter(x=>x.value==='unknown');
  const high=items.filter(x=>num(x.value)>=2).sort((a,b)=>b.value-a.value);
  const rowsN=(n.compare&&n.compare.rows)||[];
  const narrOnly=rowsN.filter(r=>r.kind==='narrative');
  const narrSafety=narrOnly.filter(r=>SAFETY.includes(r.n));
  const agreeN=new Set(rowsN.filter(r=>r.kind==='agree').map(r=>r.n));
  const sentences=(n.read&&n.read.sentences)||[];
  const strengthN=sentences.filter(s=>(s.kind||[]).includes('강점')).map(s=>s.text);
  const factN=sentences.filter(s=>(s.links||[]).length&&!(s.kind||[]).includes('강점')).map(s=>s.text.replace(/^[^:]{1,12}:\s*/,''));
  const cw=d.casework||{};const pats=((d.patterns&&d.patterns.active)||[]);
  const lvDomains=(d.profile||[]).filter(x=>x.peak>=2);
  const urgent=!!core.urgent||SAFETY.some(k=>val(k)>=1);
  const safetyOpen=SAFETY.some(k=>items.find(x=>x.n===k)?.value==='unknown');
  const mapRes=A.map||[];
  const src=(...k)=>k.map(x=>'<span class="oyp-src oyp-src-'+({척도:'s',서술:'n',해석:'i',지도:'m'}[x])+'">'+x+'</span>').join('');
  const verTag=v=>'<span class="oyp-ver oyp-ver-'+(v==='확인완료'?'ok':v==='미확인'?'no':'part')+'">'+esc(v)+'</span>';
  return {d,n,core,five,items,val,topic,unknown,high,rowsN,narrOnly,narrSafety,agreeN,sentences,strengthN,factN,cw,pats,lvDomains,urgent,safetyOpen,mapRes,src,verTag,find:A.find};
}
const box=(on,label)=>`<button type="button" class="oyp-ck${on?' oyp-sug':''}" aria-pressed="false"${label?'':' aria-label="'+(on?'시스템 제안 항목 선택':'선택')+'"'}><span class="oyp-cb" aria-hidden="true"></span>${label||''}</button>`;
const line=(w,lab)=>`<input class="oyp-fld" type="text" style="width:${w||8}em" aria-label="${esc(lab||'입력')}">`;
const wr=(rows,lab,ph)=>`<textarea class="oyp-wr" rows="${rows||2}" aria-label="${esc(lab||'메모')}" placeholder="${ph===undefined?'여기에 적거나, 출력해서 손으로 씁니다':esc(ph)}"></textarea>`;
const H=(t,s)=>`<h4>${t}${s?' '+s:''}</h4>`;
const tbl=(head,body,cls)=>`<div class="oyp-tw"><table class="oyp-t ${cls||''}">${head?'<thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead>':''}<tbody>${body}</tbody></table></div>`;
const draft=(html)=>`<div class="oyp-draft" contenteditable="true" spellcheck="false" aria-label="초안, 직접 고칠 수 있음">${html}</div>`;
const bl=t=>`<p class="oyp-bl">${esc(t)}</p>`;
const fh=t=>`<p class="oyp-fh">${esc(t)}</p>`;
const fig=(svg,cap,cls)=>`<figure class="oyp-fig ${cls||''}"><div class="oyp-figbox">${svg}</div><figcaption>${cap}</figcaption></figure>`;
function sheet(code,title,who,body,o){o=o||{};
  return `<section class="oyp-sheet${o.land?' oyp-land':''}" data-code="${code}" aria-label="${esc(code+' '+title)}">
<header class="oyp-head"><span class="oyp-code ${o.tone||''}">${code}</span><h3>${esc(title)}</h3><p class="oyp-who">${esc(who)}</p>
<div class="oyp-meta"><label class="oyp-mf"><span>학생</span>${line(7,'학생')}</label><label class="oyp-mf"><span>작성일</span>${line(6,'작성일')}</label><label class="oyp-mf"><span>작성자</span>${line(6,'작성자')}</label></div></header>
${o.banner||''}${body}
<footer class="oyp-foot"><span>OY-RALS 선별평가·서술 분석·자원 지도 결과로 만든 초안 · 진단·판정을 대신하지 않음</span><span>${code}</span></footer></section>`;
}

// ---------- 도식 ----------
let UID=0;
const defs=u=>`<defs><filter id="oyp-sh${u}" x="-15%" y="-20%" width="130%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="#12263f" flood-opacity=".11"/></filter>${['','warn','red','blue'].map(t=>`<marker id="oyp-ch${t}${u}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path class="qmk ${t}" d="M2,1.5 L8,5 L2,8.5"/></marker>`).join('')}<radialGradient id="oyp-me${u}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#3d8be0"/><stop offset="1" stop-color="#1765bd"/></radialGradient></defs>`;
function card(u,x,y,w,h,o){const cut=(s,m)=>{s=String(s==null?'':s);return s.length>m?s.slice(0,m-1)+'…':s};const mx=Math.floor((w-30)/12.5);
  let s=`<g class="qcd ${o.tone||''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" filter="url(#oyp-sh${u})"/>`;if(o.dash)s+=`<rect class="qring" x="${x+.5}" y="${y+.5}" width="${w-1}" height="${h-1}" rx="13.5"/>`;
  let ty=y+22;if(o.eb){s+=`<text class="qeb" x="${x+16}" y="${ty}">${esc(cut(o.eb,mx+4))}</text>`;ty+=20;}
  if(o.big!=null){s+=`<text class="qbig" x="${x+16}" y="${ty+12}">${esc(o.big)}</text>`;const tx=x+16+String(o.big).length*19+10,m2=Math.floor((x+w-tx-10)/12.5);s+=`<text class="qct" x="${tx}" y="${ty-1}">${esc(cut(o.t,m2))}</text>`+(o.s?`<text class="qcs" x="${tx}" y="${ty+16}">${esc(cut(o.s,m2+3))}</text>`:'');}
  else s+=`<text class="qct" x="${x+16}" y="${ty}">${esc(cut(o.t,mx))}</text>`+(o.s?`<text class="qcs" x="${x+16}" y="${ty+18}">${esc(cut(o.s,mx+3))}</text>`:'');
  return s+'</g>';}
const curve=(u,x1,y1,x2,y2,cls)=>{const dx=Math.max(24,(x2-x1)*.5);return `<path class="qlk ${cls||''}" d="M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}" marker-end="url(#oyp-ch${cls||''}${u})"/>`;};
const pill=(x,y,t,cls)=>{const w=String(t).length*11.2+20;return `<g class="qpl ${cls||''}"><rect x="${(x-w/2).toFixed(1)}" y="${y-11}" width="${w.toFixed(1)}" height="22" rx="11"/><text x="${x}" y="${y+4}" text-anchor="middle">${esc(t)}</text></g>`;};
const badge=(x,y,k)=>`<g class="qbd"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+4.5}" text-anchor="middle">${k}</text></g>`;

function profileSvg(K){
  const u=++UID,P=K.d.profile||[],rowH=30,top=40,W=700,x0=196,seg=86,gap=4,Hh=top+P.length*rowH+6;
  const ofItem=k=>(P.find(pp=>pp.items.includes(k))||{}).id;
  const nd=new Set(K.narrOnly.map(r=>ofItem(r.n)));const ag=new Set([...K.agreeN].map(ofItem));
  let s=`<svg class="oyp-dg" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc('영역 프로파일: '+P.map(x=>x.name+' '+(x.peak==null?'미상':x.peak)).join(', '))}">${defs(u)}`;
  ['1 경미','2 주의','3 상승','4 높음'].forEach((h,i)=>{s+=`<text class="qtick" x="${x0+i*(seg+gap)+seg/2}" y="${top-16}" text-anchor="middle">${h}</text>`});
  P.forEach((pp,i)=>{const y=top+i*rowH,pk=num(pp.peak)||0;if(i)s+=`<line class="qhair" x1="0" y1="${y-3}" x2="${W}" y2="${y-3}"/>`;
    s+=`<text class="qlab${pk>=2?' on':''}" x="${x0-14}" y="${y+16}" text-anchor="end">${esc(pp.name)}</text>`;
    for(let k=1;k<=4;k++)s+=`<rect class="qsg ${pk>=k?'g'+k:'off'}" x="${x0+(k-1)*(seg+gap)}" y="${y+5}" width="${seg}" height="13" rx="6.5"/>`;
    const vx=x0+4*(seg+gap)+10;
    if(pp.unknown&&pp.unknown.length)s+=pill(vx+44,y+11.5,'미상 '+pp.unknown.length+'문항','orange');
    else if(nd.has(pp.id)&&pk<1)s+=`<rect class="qnring" x="${x0-3}" y="${y+2}" width="${4*(seg+gap)+2}" height="19" rx="9.5"/>`+pill(vx+70,y+11.5,'서술에서 추정 · 척도 0','orange');
    else if(pk>0)s+=`<text class="qval" x="${vx}" y="${y+16}">${pk} ${esc(pp.label)}</text>`+(ag.has(pp.id)?pill(vx+96,y+11.5,'기록 일치','blue'):'');
    else s+=`<text class="qval mute" x="${vx}" y="${y+16}">보고 없음</text>`;});
  return s+'</svg>';
}

function tierWithout(K){const f=K.five;if(!f)return null;return Math.max(num(f.baseTier)||1,num(f.patternFloor)||0);}
function forkSvg(K){
  const u=++UID,f=K.five,core=K.core,cw=K.cw;const narrDriven=f&&num(f.safetyFloor)&&f.safetyFloor>=f.tier&&K.narrSafety.length&&!K.urgent;
  const cue=K.narrSafety.map(r=>r.topic).join('·');
  let s=`<svg class="oyp-dg" viewBox="0 0 960 350" role="img" aria-label="${esc('판정 경로: CORE '+(core.level==null?'잠정':core.level)+', 개입 수준 '+(cw.level&&cw.level.name)+', 지원 우선순위 '+(f?f.tier+'단계':'계산 안 됨')+(narrDriven?'. 서술의 '+cue+' 추정이 우선순위를 올렸고, 면담 확인 결과에 따라 판정이 갈립니다':''))}">${defs(u)}`;
  s+=curve(u,172,78,236,44)+curve(u,172,78,236,160)+curve(u,172,78,236,278);
  let pW='';
  if(narrDriven){s+=curve(u,172,266,236,300,'warn');pW=pill(132,330,cue+' 추정 · 서술에서만','orange');s+=curve(u,490,284,556,284,'warn')+curve(u,732,284,786,192,'red')+curve(u,732,284,786,302,'blue');}
  else if(K.n.present)s+=curve(u,172,266,236,300);
  s+=card(u,0,40,172,76,{eb:'입력',t:'25문항 응답',s:'미상 '+K.unknown.length+' · 안전문항 '+(K.urgent?'응답 있음':'0점')});
  s+=card(u,0,228,172,76,{eb:'입력',t:'담임 서술기록',s:K.n.present?'문장 '+K.sentences.length+'개':'입력 없음'});
  s+=card(u,240,0,250,88,{eb:'CORE 공식 판정',big:core.level==null?'?':core.level,t:(core.title||'').split('·')[0].trim()||'공식 판정',s:core.level==null?'미상 확인 뒤 확정':'공식 점수 원본 기준'});
  s+=card(u,240,116,250,88,{eb:'해석지 개입 수준',t:(cw.level&&cw.level.name||'').replace(/\s*\(.*\)/,''),s:cw.lead?cw.lead+' 주관 제안':''});
  s+=card(u,240,240,250,88,{eb:'지원 우선순위 (개발지표)',big:f?f.tier:'-',t:f?f.label:'계산 안 됨',s:f?(narrDriven?'서술 보호 단서 → 바닥값 '+f.safetyFloor:f.patternFloor>=f.tier&&f.patternReason?'생활지원 패턴 바닥값':'점수 기준'):'',tone:narrDriven?'warn':''});
  if(narrDriven){const t2=tierWithout(K);
    s+=card(u,560,246,172,76,{eb:'다음 단계',t:'면담으로 확인',s:cue+' 실태',dash:1});
    s+=card(u,790,154,170,76,{eb:'단서 확인됨',t:'집중 · 보호경로',s:'재판정',tone:'red'});
    s+=card(u,790,266,170,76,{eb:'근거 없음',t:(cw.level&&cw.level.name||'').replace(/\s*\(.*\)/,''),s:'우선순위 '+t2+'단계',tone:'blue'});}
  else s+=card(u,560,116,250,88,{eb:'판정 회의 기준(제안)',t:(cw.level&&cw.level.name||'').replace(/\s*\(.*\)/,''),s:K.urgent?'안전 확인이 먼저':'개입 수준을 기준으로',tone:K.urgent?'red':'blue'})+curve(u,490,160,556,160,'blue');
  return s+pW+'</svg>';
}

const ICON={home:'<path d="M-7,1 L0,-6 L7,1 M-5,-0.5 V7 H5 V-0.5"/>',school:'<path d="M-8,-3 L0,-7 L8,-3 L0,1 Z M-5,-1.5 V4 C-2,7 2,7 5,4 V-1.5"/>',peers:'<circle cx="-3.5" cy="-3" r="2.8"/><circle cx="4" cy="-3" r="2.8"/><path d="M-8,6 C-7,1 0,1 0,6 M-1,6 C0,1 8,1 8,6"/>',center:'<path d="M-7,7 V-4 L0,-8 L7,-4 V7 Z M-3,7 V2 H3 V7"/>',gov:'<path d="M-8,-2 L0,-7 L8,-2 Z M-6,-1 V5 M-2,-1 V5 M2,-1 V5 M6,-1 V5 M-8,7 H8"/>',heart:'<path d="M0,6 C-9,0 -6,-7 0,-3 C6,-7 9,0 0,6 Z"/>'};
function ecoNodes(K){
  const eco=K.cw.ecology||[];const g=id=>eco.find(x=>x.id===id)||{hard:[],ok:[],res:[]};
  const fam=g('family'),sch=g('school'),com=g('community');
  const peerOk=K.d.strengths&&K.d.strengths.find(s=>/또래|활동/.test(s.label));
  const N=[{t:'가족 · 보호자',s:fam.hard.length?'어려움 '+fam.hard.length+'개':'어려움 보고 없음',type:fam.hard.length?'stress':'strong',lab:fam.hard[0]||'버팀목',ic:'home'},
    {t:'학교 · 담임',s:sch.hard.length?'어려움 '+sch.hard.length+'개':'어려움 보고 없음',type:sch.hard.length?'stress':'strong',lab:sch.hard[0]||'버팀목',ic:'school'},
    {t:'또래 · 활동',s:peerOk?peerOk.label+' 유지':'확인 필요',type:peerOk?'strong':'pot',lab:peerOk?'지지':'확인',ic:'peers'}];
  const icFor=r=>/행정복지|주민센터/.test(r.org)?'gov':/아동|드림|지역아동/.test(r.org)?'heart':'center';
  const seen=new Set();for(const r of K.mapRes){if(N.length>=6)break;if(seen.has(r.org))continue;seen.add(r.org);N.push({t:r.org.replace(/^오산시\s*/,''),s:r.svc,type:'pot',lab:r.domain.split('·')[0],ic:icFor(r)});}
  if(com.hard.length&&N.length<6)N.push({t:'지역사회',s:'자원 미연결',type:'pot',lab:com.hard[0],ic:'gov'});
  return N;
}
function ecoSvg(K){
  const u=++UID,cx=360,cy=220,R=58,rx=88,ry=29;const N=ecoNodes(K);
  const pos=[[150,68],[570,68],[620,220],[540,378],[180,378],[100,220]];
  let lines='',nodes='',labs='';
  N.forEach((o,i)=>{const [x,y]=pos[i];const dx=x-cx,dy=y-cy,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;const re=rx*ry/Math.sqrt((ry*ux)**2+(rx*uy)**2);
    const x1=cx+ux*(R+6),y1=cy+uy*(R+6),x2=x-ux*(re+6),y2=y-uy*(re+6),seg=Math.hypot(x2-x1,y2-y1);
    if(o.type==='stress'){const k=Math.max(2,Math.round(seg/14));let dd=`M${x1.toFixed(1)},${y1.toFixed(1)}`;for(let j=1;j<=k;j++){const t=j/k,tm=(j-.5)/k,off=(j%2?7:-7);dd+=` Q${(x1+(x2-x1)*tm-uy*off).toFixed(1)},${(y1+(y2-y1)*tm+ux*off).toFixed(1)} ${(x1+(x2-x1)*t).toFixed(1)},${(y1+(y2-y1)*t).toFixed(1)}`;}lines+=`<path class="qe-stress" d="${dd}"/>`;}
    else lines+=`<line class="qe-${o.type}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    const lab=String(o.lab).length>11?String(o.lab).slice(0,10)+'…':o.lab;
    labs+=pill(+((x1+x2)/2).toFixed(1),+((y1+y2)/2+(o.type==='strong'?-20:0)).toFixed(1),lab,o.type==='stress'?'red':o.type==='strong'?'blue':'grey');
    const tt=o.t.length>10?o.t.slice(0,9)+'…':o.t,ss=String(o.s).length>12?String(o.s).slice(0,11)+'…':o.s;
    nodes+=`<g class="qcd${o.type==='pot'?' pot':''}"><rect x="${x-rx}" y="${y-ry}" width="${rx*2}" height="${ry*2}" rx="${ry}" filter="url(#oyp-sh${u})"/>${o.type==='pot'?`<rect class="qring" x="${x-rx+.5}" y="${y-ry+.5}" width="${rx*2-1}" height="${ry*2-1}" rx="${ry-.5}"/>`:''}<circle class="qib" cx="${x-rx+28}" cy="${y}" r="17"/><g class="qic" transform="translate(${x-rx+28},${y})">${ICON[o.ic]}</g><text class="qct" x="${x-rx+54}" y="${y-3}">${esc(tt)}</text><text class="qcs" x="${x-rx+54}" y="${y+14}">${esc(ss)}</text></g>`;});
  const me=`<circle cx="${cx}" cy="${cy}" r="${R+10}" class="qhalo"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#oyp-me${u})" filter="url(#oyp-sh${u})"/><text class="qmeT" x="${cx}" y="${cy+1}" text-anchor="middle">Ct</text><text class="qmeS" x="${cx}" y="${cy+20}" text-anchor="middle">학생</text>`;
  return `<svg class="oyp-dg" viewBox="0 0 720 430" role="img" aria-label="${esc('생태도: '+N.map(o=>o.t+' '+({stress:'긴장',strong:'지지',pot:'미연결'}[o.type])).join(', '))}">${defs(u)}${lines}${nodes}${me}${labs}</svg>`;
}
const ecoLegend=`<span class="oyp-lg"><svg viewBox="0 0 40 12" aria-hidden="true"><line class="qe-strong" x1="2" y1="6" x2="38" y2="6"/></svg>지지</span><span class="oyp-lg"><svg viewBox="0 0 40 12" aria-hidden="true"><path class="qe-stress" d="M2,6 Q6,0 10,6 Q14,12 18,6 Q22,0 26,6 Q30,12 34,6 Q36,3 38,6"/></svg>긴장·어려움</span><span class="oyp-lg"><svg viewBox="0 0 40 12" aria-hidden="true"><line class="qe-pot" x1="3" y1="6" x2="38" y2="6"/></svg>아직 연결 안 됨</span>`;

function loopSvg(K){
  const pt=K.pats[0];if(!pt)return '';
  const u=++UID,cx=570,cy=176,R=112,P=a=>[cx+R*Math.cos(a*Math.PI/180),cy+R*Math.sin(a*Math.PI/180)];
  const arc=(a1,a2)=>{const p1=P(a1),p2=P(a2);return `<path class="qlk loop" d="M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${R},${R} 0 0 1 ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" marker-end="url(#oyp-chred${u})"/>`;};
  const it=k=>({t:K.topic(k),s:(K.val(k)==null?'미상':'척도 '+k+' · '+K.val(k)+'점')+(K.agreeN.has(k)?' · 서술 일치':'')});
  const loopItems=pt.items.slice(0,2);const extra=(pt.extra||[]).filter(k=>!loopItems.includes(k)&&(K.val(k)||0)>=1).slice(0,2);
  const sign=String(pt.sign||'').split(',')[0].trim()||'반복 신호';
  let s=`<svg class="oyp-dg" viewBox="0 0 820 320" role="img" aria-label="${esc('반복 고리: '+pt.name+'. '+(pt.loop||''))}">${defs(u)}`;
  s+=`<circle class="qloopring" cx="${cx}" cy="${cy}" r="${R}"/>`+arc(-42,16)+arc(74,106)+arc(164,222);
  s+=`<text class="qloopT" x="${cx}" y="${cy-2}" text-anchor="middle">반복 고리</text><text class="qcs" x="${cx}" y="${cy+18}" text-anchor="middle">${esc(pt.name.replace(/\s*패턴$/,''))}</text>`;
  const tp=P(-90),br=P(30),bl=P(150);
  const a=it(loopItems[0]),b=it(loopItems[1]||loopItems[0]);
  if(extra.length){s+=curve(u,196,52,254,118);if(extra[1])s+=curve(u,196,252,254,142);}
  const hub=extra.length?{t:a.t,s:a.s}:null;
  if(hub){s+=curve(u,446,130,tp[0]-100,tp[1]);s+=card(u,256,96,190,68,{eb:hub.s,t:hub.t,tone:'red'});}
  extra.forEach((k,i)=>{const e=it(k);s+=card(u,0,i?220:20,196,66,{eb:e.s,t:e.t});});
  s+=card(u,tp[0]-98,tp[1]-30,196,62,{eb:hub?'학교에서 보이는 신호':a.s,t:hub?sign:a.t});
  s+=card(u,br[0]-60,br[1]-14,196,62,{eb:b.s,t:b.t,tone:'warn'});
  s+=card(u,bl[0]-136,bl[1]-14,196,62,{eb:'관찰 신호',t:hub?'참여가 더 줄어듦':sign,tone:'warn'});
  const m4=P(-14);s+=(extra.length?badge(225,84,'①'):'')+(extra[1]?badge(225,198,'②'):'')+(hub?badge(452,104,'③'):'')+badge(m4[0],m4[1],'④');
  return s+'</svg>';
}
function lawSvg(stepNow){
  const st=[['발견·관찰','담임'],['지원 요청','제10조② · 학교장'],['학생·보호자 동의','제11조③'],['학교장 선정','제10조③ · 협의회 활용'],['계획·지원','제12조'],['점검·의뢰','교육지원청 센터']];
  const X=i=>70+i*152,y=52;let s=`<svg class="oyp-dg" viewBox="0 0 900 128" role="img" aria-label="학생맞춤통합지원 절차 6단계 중 지금은 ${stepNow+1}단계 ${st[stepNow][0]}">`;
  s+=`<line class="qtrk" x1="${X(0)}" y1="${y}" x2="${X(5)}" y2="${y}"/><line class="qtrk on" x1="${X(0)}" y1="${y}" x2="${X(stepNow)}" y2="${y}"/>`;
  st.forEach((x,i)=>{const c=X(i);
    if(i<stepNow)s+=`<circle class="qst done" cx="${c}" cy="${y}" r="13"/><path class="qtick2" d="M${c-5},${y} L${c-1.5},${y+4} L${c+5.5},${y-4}"/>`;
    else if(i===stepNow)s+=`<circle class="qst halo" cx="${c}" cy="${y}" r="21"/><circle class="qst now" cx="${c}" cy="${y}" r="13"/><text class="qstn on" x="${c}" y="${y+4.5}" text-anchor="middle">${i+1}</text>`+pill(c,14,'지금 여기','blue');
    else s+=`<circle class="qst" cx="${c}" cy="${y}" r="13"/><text class="qstn" x="${c}" y="${y+4.5}" text-anchor="middle">${i+1}</text>`;
    s+=`<text class="qct${i===stepNow?' on':''}" x="${c}" y="${y+40}" text-anchor="middle">${x[0]}</text><text class="qcs" x="${c}" y="${y+58}" text-anchor="middle">${x[1]}</text>`;});
  return s+'</svg>';
}

// ---------- 03 학교 지원 ----------
function safetyBanner(K){
  if(K.urgent)return `<div class="oyp-alert" role="note"><b>안전 확인이 먼저입니다</b><span>안전 문항(1·2·7·25)에 응답이 있습니다. 이 자료를 채우기 전에 오늘 안에 학생 안전을 확인하고, 학대가 의심되면 신고(112) 절차를 따릅니다.</span></div>`;
  if(K.safetyOpen)return `<div class="oyp-alert" role="note"><b>안전 문항이 미상입니다</b><span>미상은 0점이 아닙니다. 안전 문항을 먼저 확인해 판정을 확정합니다.</span></div>`;
  return '';
}
function school(K){
  const d=K.d,cw=K.cw;const banner=safetyBanner(K);
  const recRows=K.rowsN.filter(r=>num(r.value)>=2||r.kind==='narrative');
  const recTable=recRows.length?tbl(['어려움','척도','담임 기록과의 관계'],recRows.map(r=>`<tr><th>${esc(r.topic)}</th><td>${num(r.value)==null?'미상':r.value>=3?r.value+' 상승':r.value>=2?r.value+' 주의':r.value}</td><td>${r.kind==='agree'?'기록과 일치':r.kind==='narrative'?'<b class="oyp-warn">기록에만 있음</b> · 척도에 없는 내용. 교육복지사와 확인':'척도에만 있음 · 교실에서 보이는 모습을 기록에 보태기'}</td></tr>`).join('')):'<p class="oyp-hint">2점 이상 응답이 없어 대조할 항목이 없습니다.</p>';
  const strengths=[...K.strengthN,...(d.strengths||[]).slice(0,2).map(s=>s.text)];
  const notes=(cw.notes||[]).slice(0,1).map(x=>x.text.split('. ')[0]+'.');
  const T1=sheet('T-1','학생 이해 한 장','담임교사용 · 교실에서 무엇을 보고 무엇을 하지 않을지',`
<div class="oyp-sum school"><b>${esc(d.title||'')}</b><span>${esc(d.summary&&d.summary.safety||'')} · 두드러진 어려움 ${esc((d.summary&&d.summary.keys||[]).join(', ')||'없음')}${K.narrSafety.length?' · 판정 상태 <b class="oyp-warn">잠정</b>(기록에서만 추정된 '+esc(K.narrSafety.map(r=>r.topic).join('·'))+' 확인 전)':''} ${K.src('척도','해석')}</span></div>
${fig(profileSvg(K),'영역마다 가장 높은 문항 점수를 캡슐 네 칸으로 보여 줍니다.'+(K.narrOnly.length?' 척도에는 없고 담임 기록에서만 추정된 영역은 주황 점선으로 표시했습니다.':''))}
${H('척도와 담임 기록 대조',K.src('척도','서술'))}${recTable}
<div class="oyp-cols"><div>${H('지원의 발판',K.src('서술','해석'))}<ul>${strengths.length?strengths.map(t=>'<li>'+esc(t)+'</li>').join(''):'<li>면담에서 학생이 잘하는 것과 좋아하는 것을 먼저 묻습니다.</li>'}</ul></div>
<div class="oyp-caution">${H('주의할 점')}<ul><li>어려움을 반 친구들 앞에서 지적하지 않습니다.</li>${K.narrSafety.length?'<li>보호자에게 먼저 \''+esc(K.narrSafety.map(r=>r.topic).join('·'))+'\'을 묻는 연락은 하지 않고, 교육복지사와 먼저 확인합니다.</li>':''}${notes.map(t=>'<li>'+esc(t)+'</li>').join('')}</ul></div></div>`,{tone:'school',banner});
  const obsItems=K.high.filter(x=>OBS[x.n]).slice(0,6);const days=['월','화','수','목','금'];
  const cells=lab=>[1,2].map(w=>days.map(dd=>`<td><button type="button" class="oyp-ob" aria-label="${esc(lab)} ${w}주 ${dd}"></button></td>`).join('')).join('');
  const T2=sheet('T-2','2주 관찰 기록지','담임교사용 · 칸을 누를 때마다 ○ 있음 → − 없음 → 결 결석 → 빈칸',`
<p class="oyp-hint">척도에서 2점 이상 나온 문항만 교실에서 보이는 행동으로 바꿨습니다. 해석은 하지 않고 본 것만 적습니다. 매주 금요일 교육복지사와 나눕니다. ${K.src('척도','해석')}</p>
<div class="oyp-obslegend"><span><i class="o">○</i>있음</span><span><i>−</i>없음</span><span><i class="a">결</i>결석</span><span class="oyp-screen">한 번 더 누르면 지워집니다</span></div>
${tbl(null,`<tr class="oyp-th"><th rowspan="2">관찰 항목</th><th rowspan="2">관련 어려움</th><th colspan="5">1주 차</th><th colspan="5">2주 차</th></tr><tr class="oyp-th">${days.map(x=>'<th>'+x+'</th>').join('')}${days.map(x=>'<th>'+x+'</th>').join('')}</tr>`+
  (obsItems.length?obsItems:[]).map(x=>`<tr><th>${esc(OBS[x.n])}</th><td>${esc(x.topic)}</td>${cells(OBS[x.n])}</tr>`).join('')+`<tr><th>그 밖에 눈에 띈 일</th><td>${line(7,'그 밖에 눈에 띈 일')}</td>${cells('그 밖에')}</tr>`,'oyp-grid10')}
${H('주간 메모')}${wr(3,'주간 메모')}
${H('2주 뒤 확인')}<ul class="oyp-checks"><li>${box(0)}어려움이 특정 요일·교시에 몰린다 (요일: ${line(5,'요일')})</li><li>${box(0)}두 가지 이상이 같은 날 함께 나타난다</li><li>${box(0)}학생이 먼저 도움을 청한 적이 있다</li><li>${box(0)}2주 동안 눈에 띄게 줄었다</li></ul>`,{tone:'school',banner});
  const facts=K.factN.length?K.factN.map(bl).join(''):'<p class="oyp-bl">(관찰한 사실을 기간·빈도와 함께 적습니다)</p>';
  const T3=sheet('T-3','학생맞춤통합지원 요청 교사 의견서','담임교사용 · 학교장에게 지원 요청(제10조)할 때 붙이는 의견',`
${tbl(null,`<tr><th>학교 · 학년 반</th><td>${line(10,'학교 학년 반')}</td><th>요청일</th><td>${line(6,'요청일')}</td></tr>`,'oyp-form')}
${draft(fh('1. 관찰된 사실 (기간·빈도)')+facts+fh('2. 학습·학교생활에 미치는 영향')+K.high.filter(x=>[9,10,11,3,6,8].includes(x.n)).slice(0,3).map(x=>bl(x.topic+': '+(x.anchor||''))).join('')+(K.high.some(x=>[9,10,11,3,6,8].includes(x.n))?'':bl('(학습·출결에 미치는 영향을 적습니다)'))
 +fh('3. 선별평가 결과 요약')+bl((K.lvDomains.length?K.lvDomains.map(x=>x.name+'('+x.label+')').join(', ')+' 영역이 두드러짐. ':'2점 이상 영역 없음. ')+(K.urgent?'안전 관련 응답 있음.':'안전 관련 응답 없음.'))+(K.pats[0]?bl(K.pats[0].name+'으로 해석됨.'):'')
 +fh('4. 학교에서 이미 한 조치')+`<p class="oyp-inline" contenteditable="false">${box(0,'학습물품 지원')} ${box(0,'급식 지원 확인')} ${box(0,'방과후 연결')} ${box(0,'보호자 상담')} ${box(0,'없음')}</p>`
 +fh('5. 요청 사항')+bl('학교 안 지원과 함께 '+(cw.lead&&/복지관|지역/.test(cw.lead)?'가정 단위 지원':'전문 지원')+'이 필요하여 학생맞춤통합지원 대상 선정 검토를 요청함.')
 +(strengths.length?fh('6. 강점')+bl(strengths[0]):''))}
<p class="oyp-hint">원인 추정(예: 학대·방임)은 쓰지 않습니다. 관찰 사실과 학습 영향만 담는 것이 요청서의 기준입니다. ${K.src('척도','서술','해석')}</p>
<div class="oyp-sign"><span>학생 의견 확인 ${box(0)}</span><span>보호자 상담 ${box(0)}</span><span>작성 교사 ${line(6,'작성 교사')} (서명)</span></div>`,{tone:'school'});

  const st={yes:'해당',check:'확인 필요',no:'해당 없음',out:'척도 밖'};
  const lawRows=LAWCAT.map(([name,ks,doc])=>{if(!ks.length)return [name,'—','척도 범위 밖',doc,'out'];
    const vals=ks.map(K.val);const mx=Math.max(...vals.map(v=>v==null?-1:v));const unk=ks.filter(k=>K.val(k)==null);const nar=K.narrOnly.some(r=>ks.includes(r.n));
    const ev=ks.filter(k=>(K.val(k)||0)>=1).map(k=>K.topic(k)+' '+K.val(k)+'점').join(', ')||(nar?'척도 0점, 기록에서 추정':unk.length?'미상 '+unk.length+'문항':'응답 없음');
    return [name,ks.join('·'),ev,doc,mx>=2?'yes':(mx===1||nar||unk.length)?'check':'no'];});
  const lawHit=lawRows.filter(r=>r[4]==='yes').map(r=>r[0]);
  const E1=sheet('E-1','학생맞춤통합지원 선정 검토서','교육복지사용 · 협의회 전에 어려움과 근거를 정리',`
${fig(lawSvg(1),'담임 관찰과 선별평가가 끝났고, 지금은 학교장에게 지원을 요청하는 단계입니다. 선정은 학교장이 하고 기초학력진단 결과, 담임·교과교사 의견, 보호자 상담 결과를 씁니다(제10조⑥). 세부 기준은 시행령과 경기도교육청 지침을 따릅니다.')}
${H('법이 예로 든 어려움과 이 학생의 근거',K.src('척도','서술'))}
${tbl(['어려움(제2조 제1호 예시)','관련 문항','이 학생의 근거','확인할 자료','시스템 제안'],lawRows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><span class="oyp-pill ${r[4]}">${st[r[4]]}</span></td></tr>`).join(''))}
${H('선정 준거 점검','<span class="oyp-note">● 표시는 시스템 제안, 빈칸은 협의회가 채움</span>')}
<ul class="oyp-checks"><li>${box(lawHit.length>0)}법이 예로 든 어려움 1개 이상 해당${lawHit.length?' — '+esc(lawHit.join(', ')):''}</li><li>${box(K.lvDomains.length>=2)}2개 이상 생활영역이 함께 흔들림 — ${K.lvDomains.length}개 영역 2점 이상</li><li>${box(['general','intensive','crisis'].includes(cw.level&&cw.level.id))}학교 안 지원만으로 어려움 — ${esc(cw.level&&cw.level.name||'')}</li><li>${box(K.urgent)}즉시 안전 조치 필요${K.urgent?' — 안전 문항 응답 있음':K.narrSafety.length?' — 척도 해당 없음, 기록의 추정은 면담으로 확인':''}</li><li>${box(0)}학생·보호자 동의 (제11조③)</li></ul>
<div class="oyp-decide" data-radio><b>협의회 의견 · 학교장 선정</b>${box(0,'선정')} ${box(0,'추가 확인 후 선정')} ${box(0,'비선정')}<span class="oyp-note">${lawHit.length&&K.lvDomains.length>=2?'제안: 선정 검토':'제안: 학교 안 지원으로 시작하고 2주 관찰 뒤 다시 검토'}${K.narrSafety.length?', 기록의 추정 확인을 첫 과제로':''}</span></div>`,{tone:'school',banner});
  const roleT=(d.roles||[]).find(r=>r.role==='교사')||{items:[]},roleE=(d.roles||[]).find(r=>r.role==='교육복지사')||{items:[]};
  const E2=sheet('E-2','학교 협의회 안건·회의록','교육복지사용 · 시스템 제안 옆에 결정만 적으면 회의록이 됨',`
${tbl(null,`<tr><th>일시</th><td>${line(8,'일시')}</td><th>장소</th><td>${line(6,'장소')}</td></tr><tr><th>참석</th><td colspan="3">${box(0,'담임')} ${box(0,'교육복지사')} ${box(0,'Wee 상담')} ${box(0,'보건')} ${box(0,'관리자')} ${line(6,'그 밖의 참석자')}</td></tr>`,'oyp-form')}
${tbl(['안건','시스템 제안','결정'],[['1. 선정 여부와 학교 주담당',lawHit.length?'선정 검토, 주담당 교육복지사':'학교 안 지원으로 시작'],['2. 우선 목표',(cw.goals||[]).map(g=>g.topic).join(' · ')||'면담 뒤 정함'],...(K.narrSafety.length?[['3. 기록의 추정 확인',K.narrSafety.map(r=>r.topic).join('·')+' — 교육복지사가 학생 면담으로 사실 확인. 보호자에게 추정으로 묻지 않음']]:[]),['동의와 공유 범위','학생·보호자 동의 후 교육지원청·지역 기관에 요지만 공유, 기록 원문 제외'],['교육지원청 의뢰',cw.lead&&!/학교/.test(cw.lead)?'가정 단위 지원 필요 → 학생맞춤통합지원센터 의뢰 검토':'학교 안 지원 후 필요 시 검토']].map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td><td>${wr(1,r[0]+' 결정','')}</td></tr>`).join(''))}
${H('역할 분담',K.src('해석'))}
${tbl(['담당','할 일','기한','확인'],[...roleT.items.slice(0,1).map(t=>['담임',t]),['담임','2주 관찰 기록지(T-2) 작성'],...roleE.items.slice(0,2).map(t=>['교육복지사',t]),...(K.narrSafety.length?[['교육복지사','학생 면담: '+K.narrSafety.map(r=>r.topic).join('·')+' 관련 사실 확인']]:[])].map(r=>`<tr><th>${r[0]}</th><td>${esc(r[1])}</td><td>${line(4,'기한')}</td><td>${box(0)}</td></tr>`).join(''))}
<p class="oyp-next">다음 점검일 ${line(8,'다음 점검일')} <span class="oyp-note">제안: ${esc(cw.level&&cw.level.meeting||'4주 안 협의')}</span></p>`,{tone:'school'});
  const edu=K.find(/교육청/).filter(r=>/학생맞춤/.test(r.svc)).slice(0,1);
  const E3=sheet('E-3','교육지원청 의뢰 요지','교육복지사용 · 학생맞춤통합지원센터에 지원을 요청할 때',`
${draft(fh('1. 의뢰 사유')+bl((K.high.slice(0,3).map(x=>x.topic).join(', ')||'여러 영역의 어려움')+'이 함께 나타남'+(K.pats.length?'. '+K.pats.map(x=>x.name).join(', ')+'으로 해석됨.':'.'))+fh('2. 학교 조치')+bl('(학교에서 한 지원을 적습니다)')+fh('3. 요청')+bl('주관 제안: '+(cw.lead||'협의')+'. 협의 시점: '+(cw.level&&cw.level.meeting||''))+fh('4. 동의와 첨부')+bl('학생·보호자 동의서, 교사 의견서(T-3). 서술기록 원문과 문항별 응답은 첨부하지 않음.'))}
${fig(ecoSvg(K),'학교 안팎 지원 지도: Ct를 가운데 두고 지금의 관계와 02 지도가 고른 후보를 그렸습니다. '+ecoLegend)}
${H('02 지도가 고른 지역 후보',K.src('지도'))}<ul class="oyp-res">${[...edu,...K.mapRes.slice(0,4)].map(r=>`<li><b>${esc(r.org)}</b> · ${esc(r.svc)} ${K.verTag(r.ver)}</li>`).join('')||'<li>지도에서 후보를 고르지 못했습니다. 02 지역자원 연계에서 직접 찾아 주세요.</li>'}</ul>`,{tone:'school'});
  return {packs:[{id:'teacher',label:'담임교사',sheets:[['T-1','학생 이해 한 장',T1],['T-2','2주 관찰 기록지',T2],['T-3','지원 요청 교사 의견서',T3]]},{id:'edu',label:'교육복지사',sheets:[['E-1','선정 검토서',E1],['E-2','협의회 안건·회의록',E2],['E-3','교육지원청 의뢰 요지',E3]]}]};
}

// ---------- 04 기관 사례관리 ----------
function agency(K){
  const d=K.d,cw=K.cw,core=K.core,five=K.five;const banner=safetyBanner(K);
  const ch=K.chain,lvl=(ch&&ch.level)||cw.level||{};
  const pick=LEVEL2PICK[lvl.id]||'';
  const narrCue=K.narrSafety.map(r=>r.topic).join('·');
  const sel=ch?ch.selection:null;
  const fields=sel?sel.systems:[...new Set(K.lvDomains.map(x=>FIELD[x.id]).filter(Boolean))],multi=sel?sel.status==='met':K.urgent||fields.length>=2;
  const selLabel=sel?sel.label:(multi?'선정 기준 충족':K.safetyOpen||narrCue?'확인 필요':'미충족');
  const A0=sheet('A-0','판정 근거와 판정 준거 점검','사회복지관 · 판정 사례회의 첫 장',`
${fig(forkSvg(K),(K.narrSafety.length&&five&&five.safetyFloor>=five.tier&&!K.urgent)?`응답만 보면 ${esc(cw.level&&cw.level.name||'')}(우선순위 ${tierWithout(K)}단계)이고, 담임 기록에서만 추정된 ${esc(narrCue)} 단서가 우선순위를 ${five.tier}단계로 올렸습니다. 이 단서를 면담으로 확인하기 전까지 판정은 잠정입니다.`:'세 지표(CORE 공식 판정, 해석지 개입 수준, 지원 우선순위)가 어디서 나왔는지 보여 줍니다. 판정 회의는 개입 수준을 기준으로 정하는 것을 제안합니다.','oyp-big')}
${H('통합사례관리 선정 준거','<span class="oyp-note">● 시스템 제안 · 선정 기준: 2개 이상 기관의 전문적 개입이 필요한 경우. 위기 영역이 있으면 해당</span>')}
${tbl(['준거','이 사례','근거','판단'],`
<tr class="oyp-key"><th>2개 이상 기관 전문 개입</th><td>${fields.length?'개입체계 '+fields.length+'곳 ('+esc(fields.join(', '))+')':'2점 이상 영역 없음'}${K.urgent?'. 위기 영역(안전 문항) 응답 있음':''}${sel&&sel.status==='review'?'. '+esc(sel.why):''}</td><td>${K.src('척도')}</td><td>${box(multi,selLabel)}</td></tr>
<tr><th>복합 욕구</th><td>2점 이상 영역 ${K.lvDomains.length}개${K.lvDomains.length?' ('+esc(K.lvDomains.map(x=>x.name).join(', '))+')':''}</td><td>${K.src('척도')}</td><td>${box(K.lvDomains.length>=2,K.lvDomains.length>=2?'충족':'미충족')}</td></tr>
<tr><th>안전 위기</th><td>${K.urgent?'안전 문항 응답 있음':'안전 문항 1·2·7·25 응답 없음'}${K.safetyOpen?', 안전 문항 미상 있음':''}${narrCue?'. 기록에서 '+esc(narrCue)+' 추정':''}</td><td>${K.src('척도',...(narrCue?['서술']:[]))}</td><td>${box(K.urgent,K.urgent?'해당':narrCue||K.safetyOpen?'확인 필요':'해당 없음')}</td></tr>
<tr><th>단순 연계로 해결</th><td>${K.pats.length?'어려움이 맞물린 흐름('+esc(K.pats[0].name)+')이 있어 한 기관 연결로 풀리기 어려움':'맞물린 흐름이 뚜렷하지 않음'}</td><td>${K.src('해석')}</td><td>${box(!!K.pats.length,K.pats.length?'불가':'가능')}</td></tr>
<tr><th>가구 단위 개입</th><td>${esc((cw.ecology||[]).find(x=>x.id==='family')?.hard.join(', ')||'가족 영역 어려움 없음')}</td><td>${K.src('척도')}</td><td>${box(!!((cw.ecology||[]).find(x=>x.id==='family')?.hard.length),'필요')}</td></tr>
<tr><th>동의</th><td>학생·보호자 동의. 만 14세 미만은 법정대리인 동의(개인정보 보호법 제22조의2)</td><td></td><td>${box(0,'확인')}</td></tr>
<tr><th>중복 사례관리</th><td>드림스타트·희망복지지원단 등 이용 이력</td><td></td><td>${box(0,'확인')}</td></tr>`)}
<div class="oyp-decide" data-radio><b>판정</b>${['위기','집중','일반','단순 연계','비해당'].map(x=>box(x===pick,x)).join(' ')}<span class="oyp-note">제안: ${esc(lvl.name||'')}${multi?'':sel&&sel.status==='review'?' · 통합사례관리 선정 여부는 사례회의에서 결정':' · 선정 기준(2개 이상 기관) 미충족이면 단순 연계로 검토'}${narrCue?' · 조건: '+esc(narrCue)+' 단서가 확인되면 집중·보호경로로 재판정':''}</span></div>`,{tone:'agency',banner});
  const okText={self:'위험행동·물질 사용 없음',family:'보호자 위해 보고 없음',school:'또래 안전 유지',community:'강요·착취 없음'};
  const A1=sheet('A-1','욕구 사정 요약','사회복지관 · 생태체계로 본 위험과 보호',`
${fig(ecoSvg(K),'생태도: Ct를 가운데 두고 가족·학교·또래와의 관계, 02 지도가 고른 연결 후보를 그렸습니다. '+ecoLegend)}
${H('위험요인과 보호요인',K.src('척도','서술','지도'))}
${tbl(['체계','위험요인','보호요인','연결할 자원'],(cw.ecology||[]).map(x=>`<tr><th>${esc(x.name)}</th><td>${esc(x.hard.join(', ')||'—')}</td><td>${esc(x.ok.length?okText[x.id]||x.ok.slice(0,2).join(', ')+' 보고 없음':'—')}${x.unk&&x.unk.length?' · 미상 '+x.unk.length:''}</td><td>${esc(x.res.slice(0,3).join(', '))}</td></tr>`).join(''))}
${fig(profileSvg(K),'영역 프로파일. 높이는 영역 안 가장 높은 문항 점수입니다.')}`,{tone:'agency',banner});
  const PRE=[14,15,17,19,20,21],high=K.high;
  const pre=high.filter(x=>PRE.includes(x.n)),trig=high.filter(x=>!PRE.includes(x.n)&&x.value>=3);
  const A2=sheet('A-2','사례개념화','사회복지관 · 왜 이런 상황이 이어지는가 (4P 틀)',`
${tbl(['틀','이 사례','근거'],`
<tr><th>소인<small>바탕이 되는 취약성</small></th><td>${pre.length?esc(pre.map(x=>x.topic).join(', '))+'이 지속됨':'생활 기반의 뚜렷한 취약성은 응답되지 않음'}</td><td>${K.src('척도')}</td></tr>
<tr><th>촉발<small>최근 악화시킨 일</small></th><td>${esc([...trig.map(x=>x.topic+'이 크게 응답됨'),...K.factN.slice(0,2)].join(' / ')||'면담에서 최근 달라진 일을 확인')}</td><td>${K.src(...(K.factN.length?['서술']:[]),'척도')}</td></tr>
<tr><th>지속<small>어려움을 붙잡아 두는 것</small></th><td>${K.pats.length?esc(K.pats.slice(0,2).map(x=>x.name+': '+x.loop).join(' ')):'맞물린 흐름이 뚜렷하지 않음'}</td><td>${K.src('해석')}</td></tr>
<tr><th>보호<small>버팀목</small></th><td>${esc([...K.strengthN,...(d.strengths||[]).slice(0,3).map(s=>s.label)].join(', ')||'면담에서 확인')}</td><td>${K.src(...(K.strengthN.length?['서술']:[]),'해석')}</td></tr>`,'oyp-p4')}
${K.pats.length?fig(loopSvg(K),'어려움이 이어지는 고리와 개입 지점: '+esc(K.pats[0].first||'')+' 붉은 카드는 생활 기반의 결핍, 주황 카드는 학교에서 보이는 결과입니다.','oyp-mid'):''}
${H('개입 가설')}<p class="oyp-hyp">${esc(d.understanding||'')} ${K.src('해석')}</p>
${H('합의할 목표(안)')}${tbl(['영역','지금','3개월 뒤 목표','점검 지표'],(cw.goals||[]).map(g=>{const it=d.items.find(x=>x.topic===g.topic)||{};const ra=(d.reassess||[]).find(r=>r.n===it.n)||{};return `<tr><th>${esc(g.topic)}</th><td>${esc(ra.nowText||it.anchor||'')}</td><td>${esc(String(g.goal||'').replace(/^다음 재평가까지 "|" 수준으로 낮아지는 것$/g,''))}</td><td>${esc(String(g.measure||'').replace(' 일상 지표를 학생과 함께 정해 2주마다 기록',' (2주마다)'))}</td></tr>`}).join('')||'<tr><td colspan="4">2점 이상 영역이 없어 목표는 면담에서 정합니다.</td></tr>')}`,{tone:'agency'});
  const A3=sheet('A-3','판정용 사례보고서(초안)','사회복지관 · 판정 사례회의 제출용',`
${tbl(null,`<tr><th>회의 구분</th><td>${box(0,'내부 사례회의')} ${box(0,'통합 사례회의')}</td><th>사례번호</th><td>${line(6,'사례번호')}</td></tr><tr><th>의뢰 경로</th><td colspan="3">${line(20,'의뢰 경로')}</td></tr>`,'oyp-form')}
${draft(fh('1. 사례요약')+bl('인구통계: (가구 구성·보장 구분은 초기상담에서 확인)')+fh('제시된 욕구')+bl('(학생) 초기상담에서 "'+((cw.voice||[])[0]||'지금 가장 바뀌었으면 하는 일')+'"로 묻고 학생 말로 기록')+(K.factN.length?bl('(의뢰처) '+K.factN.slice(0,2).join(' / ')):'')
 +fh('합의할 목표(안)')+((cw.goals||[]).map(g=>bl(g.topic+' 완화')).join('')||bl('면담에서 정함'))
 +fh('워커 사정')+(K.pats.slice(0,2).map(x=>bl(x.name+': '+x.loop)).join('')||bl(d.understanding||''))+(narrCue?bl('기록에서 '+narrCue+'이 추정되었으나 척도 응답은 없음. 초기상담에서 사실을 확인해 판단함.'):'')
 +fh('활용 가능 자원')+(([...K.strengthN,...(d.strengths||[]).slice(0,2).map(s=>s.label+': '+s.text)]).map(bl).join('')||bl('면담에서 확인'))
 +fh('주요 장애요인')+(K.high.slice(0,4).map(x=>bl(x.topic+': '+((d.reassess||[]).find(r=>r.n===x.n)?.nowText||x.anchor||''))).join('')||bl('2점 이상 응답 없음'))
 +fh('사정의 근거')+bl('OY-RALS 선별평가(25문항, 미상 '+K.unknown.length+')'+(K.n.present?' · 서술기록(문장 '+K.sentences.length+'개'+(K.n.glance&&K.n.glance.fit?', '+K.n.glance.fit:'')+')':''))
 +fh('2. 개입내용 (접수 전 조치)')+bl('(학교·의뢰처에서 한 지원을 적습니다)')
 +fh('3. 사례계획')+bl('서비스제공계획(A-4) 참고. '+(cw.level?cw.level.contact+', '+cw.level.review:''))
 +fh('4. 논의요청 내용')+(cw.agenda||[]).slice(0,4).map(bl).join('')+(narrCue?bl(narrCue+' 추정 단서의 확인 방법과 재판정 조건'):''))}
${H('5. 회의 권고')}${wr(2,'회의 권고')}`,{tone:'agency'});
  const byDomain=dm=>K.mapRes.find(r=>dm&&r.domain&&dm.includes(r.domain.split('·')[0]))||K.mapRes[0];
  const planRows=(cw.goals||[]).map((g,i)=>{const it=d.items.find(x=>x.topic===g.topic)||{};const prof=(d.profile||[]).find(pp=>pp.items.includes(it.n))||{};const r=byDomain(prof.name)||{};const rowP=(cw.plan||[]).flatMap(ph=>ph.rows.map(x=>({...x,phase:ph.phase})))[i]||{};
    return `<tr><td>${esc(g.topic)}</td><td>${esc(r.svc||rowP.what||'')}</td><td>Ct</td><td>${i+1}</td><td>${esc((rowP.phase||'').replace(/\s*\(.*\)/,''))}</td><td>${line(5,'시작일')}</td><td>${line(5,'종료일')}</td><td>${line(3,'횟수')}</td><td>${esc(r.org||rowP.who||'')}</td><td>${line(4,'담당자')}</td><td>${esc(String(g.measure||'').replace(' 일상 지표를 학생과 함께 정해 2주마다 기록',', 2주마다'))}</td><td>${box(0)}</td></tr>`;}).join('');
  const A4=sheet('A-4','서비스제공계획 및 점검표(초안)','사회복지관 · 목표와 기관은 시스템이 채우고 날짜·담당은 회의에서',`
<p class="oyp-goal"><b>장기목표(6개월)</b> ${line(24,'장기목표')} <b>단기목표(3개월)</b> ${esc((cw.goals||[]).map(g=>g.topic).slice(0,2).join(', ')||'면담 뒤 정함')} 완화 ${K.src('해석')}</p>
${tbl(['개입목표','서비스명','대상','우선','시기','시작일','종료일','횟수','제공기관','담당자','점검방법','이행'],planRows+`<tr><td colspan="12">${wr(1,'추가 서비스','추가할 서비스를 적습니다')}</td></tr>`,'oyp-plan12')}
<p class="oyp-hint">제공기관은 02 지도의 후보이며 대부분 확인 전입니다. 이용 가능 여부와 빈자리를 문의한 뒤 확정합니다. ${K.src('지도')}</p>
${H('변경 내역·사유')}${wr(1,'변경 내역·사유','')}
<div class="oyp-sign"><span>위 계획에 동의합니다.</span><span>Ct ${line(5,'학생 서명')} (서명)</span><span>보호자 ${line(5,'보호자 서명')} (서명)</span><span>담당자 ${line(5,'담당자 서명')} (서명)</span></div>`,{tone:'agency',land:true});

  // 아동·가족 기관
  const v=K.val;const care=Math.max(v(16)||0,v(17)||0,v(18)||0),abuse=Math.max(v(1)||0,v(2)||0),fam=(cw.ecology||[]).find(x=>x.id==='family')||{hard:[]};
  const abuseNarr=K.narrOnly.filter(r=>[1,2].includes(r.n));
  const FIT=[
    ['지역아동센터','방과 후 보호·급식·학습',care>=2||(v(19)||0)>=2?'돌봄·식사 관련 응답이 높아 저녁 시간 보호와 급식이 맞음':'돌봄·식사 응답이 낮아 우선순위는 낮음',care>=2||(v(19)||0)>=2?'yes':'no',care>=2||(v(19)||0)>=2?'연계 권장':'필요 시','C-1'],
    ['드림스타트','취약계층 아동 통합사례관리','대상은 0세(임산부)~만 12세(초등학생 이하). 학생 나이와 형제·자매를 확인','check','연령 확인','C-2'],
    ['아동보호전문기관','학대피해아동·가족 사례관리',abuse>=1?'학대 관련 문항에 응답이 있어 신고 절차와 함께 협력':abuseNarr.length?'척도 0점, 기록에서만 추정. 면담으로 사실을 확인한 뒤 의심이 남으면 신고':'학대 관련 응답 없음',abuse>=1?'red':abuseNarr.length?'check':'no',abuse>=1?'신고 절차 우선':abuseNarr.length?'확인 결과에 따라':'해당 없음(현재)','C-3'],
    ['가족센터','가족상담, 한부모·다양한 가족 지원',fam.hard.length?'가족 영역 어려움('+fam.hard.slice(0,2).join(', ')+'). 보호자를 돕는 쪽으로 첫 연락':'가족 영역 응답이 낮음',fam.hard.length?'yes':'no',fam.hard.length?'보호자 지원':'필요 시','C-4']];
  const st={yes:'yes',check:'check',no:'no',red:'red'};
  const firstStep=abuse>=1?'오늘 안 안전 확인, 학대 의심 시 신고(112)':FIT[0][3]==='yes'?'지역아동센터 이용 문의(빈자리·연령), 담당자 면담으로 저녁 실태 확인':'담당자 면담으로 생활 실태 확인';
  const C0=sheet('C-0','아동·가족 기관 중 어디에 연결할까','아동·가족 기관 공통 · 이 사례에 맞는 기관과 순서',`
${tbl(['기관','하는 일','이 사례에서','판단','시트'],FIT.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${esc(r[2])}</td><td><span class="oyp-pill ${st[r[3]]}">${r[4]}</span></td><td><span class="oyp-code sm">${r[5]}</span></td></tr>`).join(''))}
${H('연결 순서(제안)')}<ol class="oyp-steps3"><li><b>이번 주</b>${esc(firstStep)}</li><li><b>2주 안</b>${fam.hard.length?'가족센터를 통해 보호자 상담 제안, 가구 상황 확인':'학생과 보호자에게 원하는 도움 확인'}</li><li><b>확인 결과에 따라</b>${abuseNarr.length||abuse>=1?'학대 의심이 남으면 신고, 이후 아동보호전문기관과 사례관리 역할 조정':'4주 뒤 관찰 결과로 연계 범위 조정'}</li></ol>
<p class="oyp-hint">대상 연령·선정 기준은 기관과 해마다 다르므로 문의로 확인합니다. 기관 목록은 02 지도와 자원 DB에서 가져왔고 대부분 확인 전입니다. ${K.src('지도')}</p>`,{tone:'agency',banner});
  const resLi=list=>`<ul class="oyp-res">${list.map(r=>`<li><b>${esc(r.org)}</b> · ${esc(r.svc)} ${K.verTag(r.ver)}${r.how?'<br><span class="oyp-muted">'+esc(r.how)+'</span>':''}</li>`).join('')||'<li>자원 DB에서 찾지 못했습니다.</li>'}</ul>`;
  const wk=[1,2,3,4];
  const obsC=[...(care>=1?[['석식 이용 일수','식사·돌봄']]:[]),...(care>=1?[['귀가 뒤 혼자 있는 시간','돌봄 공백']]:[]),...K.high.filter(x=>OBS[x.n]&&![16,17,18].includes(x.n)).slice(0,3).map(x=>[OBS[x.n],x.topic]),['활동 중 기분과 참여','강점 유지']];
  const C1=sheet('C-1','이용 연계·관찰 기록지','지역아동센터 · 받는 정보와 매주 볼 것',`
${H('정보 공유 범위')}${tbl(['센터가 받는 것','센터에 보내지 않는 것'],`<tr><td><ul><li>이용 목적(돌봄·급식·학습)</li><li>강점과 좋아하는 활동</li><li>사례관리 담당자 연락 창구</li></ul></td><td><ul><li>척도 점수와 문항별 응답</li><li>기록 원문과 추정 단서</li><li>가구 소득·급여 정보</li></ul></td></tr>`)}
${H('주간 관찰 기록','<span class="oyp-note">매주 1회, 월말에 사례관리자와 나눔</span>')}
${tbl(['볼 것','왜',...wk.map(w=>w+'주')],obsC.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td>${wk.map(w=>'<td>'+wr(1,r[0]+' '+w+'주','')+'</td>').join('')}</tr>`).join(''),'oyp-grid4')}
${H('강점을 살린 활동',K.src('서술','해석'))}<ul>${([...K.strengthN,...(d.strengths||[]).slice(0,2).map(s=>s.text)].slice(0,2).map(t=>'<li>'+esc(t)+'</li>').join(''))||'<li>좋아하는 활동을 첫 참여 고리로 씁니다.</li>'}</ul>
${H('자원 DB의 창구',K.src('지도'))}${resLi(K.find(/지역아동센터/))}`,{tone:'agency'});
  const C2=sheet('C-2','드림스타트 의뢰 전 확인','드림스타트 · 대상이 맞는지 먼저 확인',`
<div class="oyp-sum agency"><b>대상 연령부터 확인합니다</b><span>드림스타트는 0세(임산부)부터 만 12세(초등학생 이하)까지의 취약계층 아동과 가족을 대상으로 합니다. 중·고등학생이면 본인은 대상 밖일 수 있고, 같은 가구의 동생이 있다면 가구 단위 지원 통로가 될 수 있습니다.</span></div>
${H('의뢰 전 확인')}<ul class="oyp-checks"><li>${box(0)}학생 나이와 오산시 드림스타트 대상 기준 ${line(8,'학생 나이')}</li><li>${box(0)}같은 가구 형제·자매 유무와 나이 ${line(10,'형제·자매')}</li><li>${box(0)}이미 드림스타트를 이용 중인지 (중복 사례관리 확인, A-0)</li><li>${box(0)}보호자 동의</li></ul>
${H('의뢰할 때 보낼 요지')}${draft(bl((fam.hard.length?fam.hard.join(', ')+'이 확인되는 가구임.':'(가구 상황을 적습니다)'))+bl('학생은 '+(cw.lead||'담당 기관')+' 사례관리로 지원 예정이며, 대상 아동의 건강·학습·돌봄 지원과 역할 조정을 요청함.')+bl('척도 응답과 기록 원문은 보내지 않고, 사례회의에서 필요한 범위만 공유함.'))}
${H('자원 DB의 창구',K.src('지도'))}${resLi(K.find(/드림스타트/))}`,{tone:'agency'});
  const NEG=[['식사',[16,19]],['의복·위생',[19]],['보호·감독',[16,17,2]],['교육',[9,10]],['의료',[15]]];
  const known=ks=>{const a=ks.filter(k=>(K.val(k)||0)>=1).map(k=>K.topic(k)+' '+K.val(k)+'점');const q=K.rowsN.filter(r=>ks.includes(r.n)&&r.kind!=='scale'&&r.quotes&&r.quotes[0]).map(r=>'기록: '+r.quotes[0].quote.replace(/^[^:]{1,12}:\s*/,''));return [...new Set([...a,...q])].join(' / ')||'정보 없음';};
  const C3=sheet('C-3','아동보호 확인과 신고 판단 정리','아동보호전문기관과 협력 · 판단은 신고의무자, 시스템은 확인할 사실만 정리',`
<div class="oyp-sum agency"><b>${abuse>=1?'학대 관련 응답이 있습니다':abuseNarr.length?'지금은 \'확인 전\' 단계입니다':'현재 학대 관련 응답은 없습니다'}</b><span>${abuse>=1?'안전 확인을 먼저 하고, 학대가 의심되면 신고(112)합니다. 교사와 사회복지 종사자는 신고의무자입니다.':abuseNarr.length?'척도의 학대 문항은 0점이고 담임 기록에서 '+esc(abuseNarr.map(r=>r.topic).join('·'))+'이 추정되었습니다. 생활 여건 때문에 생긴 공백인지, 필요한 보호를 계속 주지 않는 것인지에 따라 경로가 달라집니다. 확인 결과 의심이 남으면 망설이지 않고 신고합니다.':'새로운 단서가 생기면 이 장으로 사실을 정리합니다. 의심이 들면 신고(112)합니다.'} ${K.src('척도',...(abuseNarr.length?['서술']:[]))}</span></div>
${H('영역별로 지금 아는 것과 확인할 것')}
${tbl(['영역','지금 아는 것','확인 결과'],NEG.map(([a,ks])=>`<tr><th>${a}</th><td>${esc(known(ks))}</td><td>${line(9,a+' 확인 결과')}</td></tr>`).join(''))}
<div class="oyp-decide" data-radio><b>확인 뒤 판단</b>${box(0,'신고 (112)')} ${box(0,'복지 지원하며 관찰 지속')} ${box(0,'해당 없음')}<span class="oyp-note">신고 뒤 조사는 시·군·구 아동학대전담공무원이 하고, 아동보호전문기관은 피해아동·가족 사례관리를 맡습니다. 신고했다면 사례관리 역할을 다시 정합니다.</span></div>
${H('자원 DB의 창구',K.src('지도'))}${resLi(K.find(/아동보호전문/))}`,{tone:'agency',banner});
  const C4=sheet('C-4','보호자 지원 연결지','가족센터 · 보호자를 탓하지 않고 돕는 쪽으로',`
<div class="oyp-sum agency"><b>보호자를 협력자로 초대합니다</b><span>${esc(cw.family||'보호자가 받을 수 있는 도움부터 이야기합니다.')} ${K.src('해석')}</span></div>
${H('이 가구에서 볼 것')}${tbl(['살필 것','왜','확인'],[['보호자 근로 시간과 쉬는 날','돌봄 여력과 연락 가능 시간'],['가족 구성','한부모·조손 등이면 맞는 지원 사업이 달라짐'],['보호자의 피로·건강','돌봄 여력과 직결'],['보호자가 원하는 도움','계획은 보호자가 동의한 것에서 출발']].map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${line(8,r[0])}</td></tr>`).join(''))}
${H('연결할 수 있는 지원')}<ul class="oyp-checks"><li>${box(fam.hard.length>0)}가족상담·관계증진</li><li>${box(0)}한부모·다양한 가족 지원 (해당 시)</li><li>${box(0)}아이돌봄서비스: 생후 3개월~만 12세 이하라 동생이 있을 때 검토</li></ul>
${H('보호자 첫 연락 예시')}${draft('<p>"안녕하세요, ○○ 학교와 함께 학생을 돕고 있는 △△입니다. 바쁘신 가운데 아이가 받을 수 있는 도움을 안내드리고 싶어 연락드렸어요. 편하신 시간에 10분 정도 통화 가능하실까요?"</p>')}
<p class="oyp-hint">첫 연락에서는 학생의 어려움이나 추정 단서를 말하지 않고, 가족이 받을 수 있는 도움부터 이야기합니다.</p>
${H('자원 DB의 창구',K.src('지도'))}${resLi(K.find(/가족센터/))}`,{tone:'agency'});

  const BEN=[[19,'필수 생활물품·식량 부족','긴급복지지원(생계) 상담, 맞춤형 급여, 푸드뱅크','가구 소득·재산, 위기 사유'],[21,'비용으로 인한 지원 이용 제한','교육급여·교육비 지원, 바우처','소득인정액, 학교 경유 신청 여부'],[16,'생활관리·식사·돌봄 공백','아동급식 지원, 지역아동센터 이용','결식 우려 기준, 보호자 근무 시간'],[20,'주거 불안정·환경','주거급여','주거비 부담, 주거 상태'],[15,'보조공학·서비스 접근 제한','장애 관련 서비스·바우처','등록 여부, 서비스 이력']].filter(b=>(v(b[0])||0)>=1);
  const adminRes=K.mapRes.filter(r=>/행정복지센터/.test(r.org+r.type)).slice(0,1);
  const G1=sheet('G-1','급여·지원 검토표','행정복지센터 · 맞춤형 복지팀',`
<p class="oyp-hint">척도에서 생활 기반 문항에 응답이 있으면 가구 단위 급여부터 확인합니다. 급여 이름과 선정 기준은 해마다 바뀌므로 신청 전 지침으로 확인합니다. ${K.src('척도','해석')}</p>
${tbl(['평가에서 드러난 욕구','검토할 급여·지원','확인할 자격·사유','결과'],BEN.map(b=>`<tr><th>${esc(b[1])} (${v(b[0])}점)</th><td>${esc(b[2])}</td><td>${esc(b[3])}</td><td class="oyp-nowrap">${box(0,'신청')}<br>${box(0,'비해당')}<br>${box(0,'보류')}</td></tr>`).join('')||'<tr><td colspan="4">생활 기반 문항 응답이 없어 지금 검토할 급여가 없습니다.</td></tr>')}
${H('공공 사례관리 판단')}<ul class="oyp-checks"><li>${box(0)}위기 사유 확인 (주소득자 근로 단절·질병 등)</li><li>${box(!K.urgent&&!!cw.lead&&/복지관/.test(cw.lead))}민간(${esc(cw.lead||'복지관')}) 주관, 센터는 급여로 협력</li><li>${box(K.urgent)}위기·학대 의심이 확인되면 희망복지지원단 공공 사례관리 협의</li></ul>
${H('관할 창구',K.src('지도'))}${resLi(adminRes)}
${H('사례회의에 가져갈 것')}<ul class="oyp-checks"><li>${box(0)}현재 받는 급여와 보장 이력</li><li>${box(0)}신청한 급여와 결정 예정일</li><li>${box(0)}보호자 근로 시간에 맞춘 상담 가능 시간대</li></ul>`,{tone:'agency'});
  return {packs:[{id:'cwc',label:'사회복지관',sheets:[['A-0','판정 근거',A0],['A-1','욕구 사정 요약',A1],['A-2','사례개념화',A2],['A-3','판정용 사례보고서',A3],['A-4','서비스제공계획 및 점검표',A4]]},{id:'child',label:'아동·가족 기관',sheets:[['C-0','어디에 연결할까',C0],['C-1','지역아동센터',C1],['C-2','드림스타트',C2],['C-3','아동보호전문기관',C3],['C-4','가족센터',C4]]},{id:'admin',label:'행정복지센터',sheets:[['G-1','급여·지원 검토표',G1]]}]};
}

function render(kind,payload){
  const A=analyze(payload);
  if(!A.d)return `<section class="oyp"><p class="oyp-hint">이 자료를 만들지 못했습니다. 평가를 다시 완료해 주세요.</p></section>`;
  const K=kit(A);try{K.chain=OD().forPayload(payload)}catch(_){K.chain=null}const R=kind==='school'?school(K):agency(K);const g='oyp-'+kind;
  const want=root.OYRole&&root.OYRole.pack?root.OYRole.pack(kind):'';const on=Math.max(0,R.packs.findIndex(pk=>pk.id===want));
  const nav=`<div class="oyp-sub" role="group" aria-label="${kind==='school'?'학교 역할 선택':'기관 선택'}">${R.packs.map((pk,i)=>`<button type="button" data-oyp-sub="${g}" data-oyp-s="${pk.id}" aria-pressed="${i===on}">${esc(pk.label)} ${pk.sheets.length}장</button>`).join('')}</div>`;
  const packs=R.packs.map((pk,i)=>`<div class="oyp-pack" data-oyp-group="${g}" data-oyp-s="${pk.id}"${i!==on?' hidden':''}><div class="oyp-packhead"><ol class="oyp-toc">${pk.sheets.map(s=>`<li><span class="oyp-code sm">${s[0]}</span>${esc(s[1])}</li>`).join('')}</ol><div class="oyp-tools"><button type="button" class="oyp-print" data-oyp-print>이 ${pk.sheets.length}장 출력</button><button type="button" class="oyp-clear" data-oyp-clear>적은 내용 지우기</button></div><p class="oyp-note">칸을 누르거나 바로 적을 수 있습니다. 적은 내용은 이 화면에만 있고 저장되지 않습니다. 출력하면 적은 내용은 그대로, 빈칸은 손으로 쓰는 줄로 나옵니다.</p></div>${pk.sheets.map(s=>s[2]).join('')}</div>`).join('');
  return `<section class="oyp oyp-${kind}" data-oyp-version="${VERSION}">${nav}${packs}</section>`;
}
function sheetCodes(kind,payload){const A=analyze(payload);if(!A.d)return [];const K=kit(A);const R=kind==='school'?school(K):agency(K);return R.packs.flatMap(pk=>pk.sheets.map(s=>s[0]));}

/* 화면 동작: 관찰 칸 순환, 체크, 단일 선택, 하위 묶음 전환, 출력, 지우기 */
function bind(doc){
  if(!doc||doc.__oypBound)return;doc.__oypBound=true;
  const cyc=['','o','x','a'],lab={'':'','o':'○','x':'−','a':'결'};
  doc.addEventListener('click',e=>{
    const t=e.target;if(!t||!t.closest)return;
    const ob=t.closest('.oyp-ob');if(ob){const v=cyc[(cyc.indexOf(ob.dataset.v||'')+1)%cyc.length];ob.dataset.v=v;ob.textContent=lab[v];return;}
    const ck=t.closest('.oyp-ck');if(ck){const on=ck.getAttribute('aria-pressed')!=='true';const g=ck.closest('[data-radio]');if(g&&on)g.querySelectorAll('.oyp-ck').forEach(x=>x.setAttribute('aria-pressed','false'));ck.setAttribute('aria-pressed',String(on));return;}
    const sb=t.closest('[data-oyp-sub]');if(sb){const g=sb.dataset.oypSub,root=sb.closest('.oyp');root.querySelectorAll('[data-oyp-sub="'+g+'"]').forEach(x=>x.setAttribute('aria-pressed',String(x===sb)));root.querySelectorAll('[data-oyp-group="'+g+'"]').forEach(x=>{x.hidden=x.dataset.oypS!==sb.dataset.oypS});return;}
    const cl=t.closest('[data-oyp-clear]');if(cl){const pk=cl.closest('.oyp-pack');pk.querySelectorAll('.oyp-ob').forEach(x=>{x.dataset.v='';x.textContent=''});pk.querySelectorAll('.oyp-ck').forEach(x=>x.setAttribute('aria-pressed','false'));pk.querySelectorAll('input.oyp-fld,textarea.oyp-wr').forEach(x=>{x.value=''});return;}
    const pr=t.closest('[data-oyp-print]');if(pr){printPack(doc,pr.closest('.oyp-pack'));}
  });
}
function printPack(doc,pack){
  const old=doc.getElementById('oyp-print-root');if(old)old.remove();
  pack.querySelectorAll('input.oyp-fld').forEach(x=>x.setAttribute('value',x.value));
  pack.querySelectorAll('textarea.oyp-wr').forEach(x=>{x.textContent=x.value});
  const root=doc.createElement('section');root.id='oyp-print-root';root.className='oyp';
  pack.querySelectorAll('.oyp-sheet').forEach(s=>{const c=s.cloneNode(true);c.querySelectorAll('textarea.oyp-wr').forEach(ta=>{const dv=doc.createElement('div');dv.className='oyp-wrp'+(ta.closest('.oyp-grid4')?' cell':'');dv.textContent=ta.value;dv.style.minHeight=(Math.max(1,+ta.rows||1)*24)+'px';ta.replaceWith(dv)});root.append(c)});
  doc.body.append(root);doc.body.classList.add('oyp-printing');
  const done=()=>{root.remove();doc.body.classList.remove('oyp-printing');doc.defaultView&&doc.defaultView.removeEventListener('afterprint',done)};
  const w=doc.defaultView;if(w){w.addEventListener('afterprint',done);try{w.print()}catch(_){done()}}
}

/* 03 학교 지원(stage 6)은 자체 영역에, 04 기관 자료는 journey-v88의 탭 안에 그린다. */
function mountStage(e){
  const st=e&&e.detail;const area=root.document&&root.document.getElementById('schoolArea');if(!area)return;
  const on=!!(st&&st.ready&&st.payload&&st.stage===6);area.hidden=!on;if(!on)return;
  const key=st.payload.flowRevision+'|'+(st.payload.caseContext||'').length;
  if(area.dataset.oypKey===key)return;area.dataset.oypKey=key;
  area.innerHTML='<div class="oyp-stagehead"><span class="oyp-eyebrow">03 학교 지원</span><h2>담임교사와 교육복지사가 바로 쓰는 자료</h2><p>척도 판정·해석지·서술 분석·지역자원 지도를 학생맞춤통합지원 절차에 맞춰 정리했습니다.</p></div>'+(()=>{try{return OD().strip(OD().forPayload(st.payload),{audience:'school'})}catch(_){return ''}})()+render('school',st.payload);
  area.querySelectorAll('[data-oyd]').forEach(el=>{el.__payload=st.payload});
}
const api=Object.freeze({VERSION,render,sheetCodes,analyze,bind,printPack});
if(node)module.exports=api;else{root.OYPerspective=api;if(root.document){bind(root.document);root.addEventListener('oy-journey-view',mountStage);}}
})(typeof window!=='undefined'?window:globalThis);
