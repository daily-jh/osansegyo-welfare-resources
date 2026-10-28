/* OY-RALS 05 최종 보고서 v1: 한 사례의 판정·해석·연계·계획을 A4 2쪽으로 압축한다.
   판정(①안전 ~ ⑥진행체계)은 OYDecision.forPayload가 낸 화면 값만 읽고 다시 계산하지 않는다.
   서술기록을 빼고 출력해도 판정은 화면과 같고, 서술 원문·인용·서술 분석 문장만 뺀다(지훈 결정 2026-10-27).
   화면: PC는 인쇄 미리보기처럼 A4 쪽, 휴대폰(640px 이하)은 읽기 화면. 인쇄·PDF는 언제나 A4 2쪽.
   실무자 의견은 작성자가 직접 쓴 글이라 보고서에 늘 들어가고, ZIP 자료 보관에는 '서술 포함'을 고른 경우에만 넣는다. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const VERSION='1.0.0-20261027';
const need=(n,g)=>node?require('./'+n):root[g];
const OD=()=>need('oy-decision-v1.js','OYDecision');
const YM=()=>{try{return need('support-model.js','YouthMap')}catch(_){return null}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
const OP_MAX=400;
const stripQuotes=t=>String(t||'').split(/(?<=[.다요])\s+/).filter(s=>!/[“”"]/.test(s)).join(' ');
const orgShort=s=>String(s||'').replace(/\s*\(.*\)\s*/,'').replace(/^오산시\s?/,'').replace(/^경기도교육청\s/,'').replace('오산세교종합사회복지관','세교종합사회복지관').replace('동 행정복지센터','행정복지센터').replace('복지관 통합사례관리','복지관').replace('전문 상담·치료기관','상담·치료기관');
const dots=v=>'<span class="dots" aria-label="'+v+'점">'+[1,2,3,4].map(k=>'<i class="'+(k<=v?'f':'')+'"></i>').join('')+'</span>';
const today=()=>{try{return new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}catch(_){return new Date().toISOString().slice(0,10)}};

/* 복지자원 찾기의 영역별 상위 후보(지역자원 연계 지도와 같은 순위). */
function resources(p){
  const M=YM();if(!M||!Array.isArray(p.resources)||!p.resources.length||!Array.isArray(p.domains))return [];
  const out=[],seen=new Set();
  try{M.rank(M.domains(p)).filter(x=>x.sum>0).forEach(dm=>(M.groupedCandidates(p,dm)||[]).slice(0,2).forEach(g=>{const r=g.primary;if(!r)return;const key=g.name+'|'+r['서비스명'];if(seen.has(key))return;seen.add(key);
    let cond='';try{cond=String(M.describe(p,dm,r).condition||'').split(' · ')[0]}catch(_){}
    out.push({domain:dm.name,name:g.name,service:r['서비스명']||'',cond});}));}catch(_){}
  return out.slice(0,6);
}

/* 보고서 내용 한 벌. inc=false면 서술 원문·인용·서술 분석 문장(조정 이유·기록 보완·이야기)을 넣지 않는다. */
function model(p,opt){
  opt=opt||{};
  const hasNarr=!!String(p.caseContext||'').trim(),inc=!!opt.includeNarrative&&hasNarr;
  const R=OD().forPayload(p),I=R.integrated||{},d=R.deep,cell=k=>R.cells.find(x=>x.k===k);
  const topics=(d.items||[]).map(x=>x.topic),ans=p.answers||[];
  const scoreOf=t=>{const v=ans[topics.indexOf(t)];return Number.isInteger(v)?v:0};
  const urgent=cell('safety').tone==='risk';
  const und=(inc?(I.understanding||d.understanding):d.understanding||'').split(/(?<=다\.)\s+/).filter(s=>!/[“”]/.test(s)).slice(0,2).join(' ');
  const story=inc&&I.narrative&&I.narrative.story||'';const qm=story?story.match(/“([^”]+)”\s*\(([^)]+)\)/):null;
  const lead=orgShort(R.lead),seen=new Set([lead]),parts=[],cands=[],res=resources(p);
  (I.partners||d.casework.partners||[]).forEach(x=>{const s=orgShort(x);if(!seen.has(s)){seen.add(s);parts.push(s)}});
  res.forEach(r=>{const s=orgShort(r.name);if(lead==='복지관'&&/복지관$/.test(s))return;if(!seen.has(s)&&cands.length<3){seen.add(s);cands.push({s,svc:r.service})}});
  const pats=[...((d.patterns&&d.patterns.active)||[]).map(x=>({name:x.name})),...(inc?(I.newPatterns||[]).map(x=>({name:x.name})):[])];
  const tgt=g=>{const m=String(g.goal||'').match(/"([^"]+)"/);return m?m[1]:String(g.goal||'')};
  const strengths=(I.strengths||d.strengths||[]).filter(s=>!/서술/.test(s.label));
  const tier=R.tier;
  return {R,inc,hasNarr,urgent,tone:urgent?'r':R.agenda.length?'q':'',tier,tierName:tier?NAMES[tier-1]+(R.five&&R.five.provisional?' (잠정)':''):'단계 미확정',tierWhy:cell('tier').why,
    path:R.pathway,safety:cell('safety'),sel:cell('select'),cells:R.cells,level:R.level||{},lead,parts,cands,resources:res,
    keys:(I.keys||d.summary.keys||[]).slice(0,3).map(t=>({t,v:scoreOf(t)})),
    und,quote:qm?{t:qm[1],src:qm[2]}:null,strengths,wishes:inc?(I.wishes||[]):[],
    pat:pats[0]||null,code:d.code,first:I.first||d.summary.first||'',total:d.summary.total,
    stops:(I.plan||[]).slice(0,3).map(ph=>({h:ph.phase,rows:ph.rows||[]})).concat([{h:'재평가',rows:[{what:(R.level&&R.level.review)||'3개월마다 재사정',who:''}]}]),
    goals:(I.goals||[]).slice(0,3).map(g=>({topic:g.topic,now:scoreOf(g.topic),target:tgt(g),measure:String(g.measure||'').replace(' 등 일상 지표를 학생과 함께 정해','')})),
    agenda:R.agenda.filter(a=>!(urgent&&a.k==='safety')),meet:(I.agenda||[]).filter(a=>!/다음 점검일/.test(a)).slice(0,4),questions:(I.questions||[]).slice(0,3),
    ladder:OD().ladders(R,false).select,profile:d.profile||[],immediate:I.immediate||'',critical:((d.critical&&d.critical.list)||[]).filter(x=>x.kind==='안전'),
    leadText:I.leadText||d.casework.leadText||'',adjust:inc?(I.adjust||''):'',family:I.family||'',gaps:inc&&I.narrative&&I.narrative.gaps||[],
    grade:d.grade||null,revision:p.flowRevision||'',date:opt.date||today(),opinion:String(opt.opinion||'').trim().slice(0,OP_MAX),
    ver:((R.versions||[]).find(v=>v[0]==='판정 사슬')||[])[1]||OD().VERSION};
}

/* ── 얇은 선 도식 한 벌: 폭 700 단위 SVG, 상자 테두리 1.1, 모서리 7, 글자 11, 연결선 1(곡선). 강조는 파랑, 안전은 빨강, 후보·추정은 점선. */
const wrapT=(s,n,max)=>{const out=[],parts=[];let cur='';String(s).split(/(\s+)/).forEach(w=>{while(w.length>n){parts.push(w.slice(0,n));parts.push(' ');w=w.slice(n)}parts.push(w)});for(const w of parts){if((cur+w).length>n&&cur.trim()){out.push(cur.trim());cur=w.trimStart();}else cur+=w;}if(cur.trim())out.push(cur.trim());if(out.length>max){out.length=max;out[max-1]=out[max-1].replace(/.{0,2}$/,'')+'…';}return out.length?out:[''];};
function sbox(x,y,w,h,lines,cls,opt){opt=opt||{};const fs=opt.fs||11,lh=fs*1.32,cx=x+w/2,y0=y+h/2-(lines.length-1)*lh/2+fs*.36;
  return '<g class="nb '+(cls||'')+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="7"/>'+lines.map((t,i)=>'<text x="'+cx+'" y="'+(y0+i*lh).toFixed(1)+'" text-anchor="middle" class="'+(i===0&&opt.bold?'b':'')+' '+(i>0&&opt.sub?'s':'')+'">'+esc(t)+'</text>').join('')+'</g>';}
const curve=(x1,y1,x2,y2,cls)=>{const mx=(x1+x2)/2;return '<path class="ln '+(cls||'')+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+', '+mx+' '+y2+', '+x2+' '+y2+'"/>';};
const svgWrap=(w,h,inner,label,top)=>'<div class="dgw"><svg class="dg" viewBox="0 '+(top||0)+' '+w+' '+(h-(top||0))+'" role="img" aria-label="'+esc(label)+'">'+inner+'</svg></div>';

/* 그림 1 근거 → 판정: 어떤 입력이 어느 판정에 쓰였는지(판정 사슬 규칙의 고정 연결). */
function chainDiagram(k){
  const W=700,bh=40,gap=8,inW=170,jX=300,jW=400;
  const ins=[['25문항 점수',/^확인 /.test(k.total)?String(k.total).replace(/^확인 (\d+)문항 합계 (\d+)점 \(미상 (\d+)문항\)$/,'확인 $1문항 $2점 · 미상 $3개'):'CORE 총점 '+k.total],['안전 문항 1·2·7·25',k.safety.why],[k.hasNarr?(k.inc?'서술기록 (출력에 포함)':'서술기록 (판정에만 반영)'):'서술기록 (입력 없음)',k.hasNarr?(k.inc?'인용 포함':'원문 제외'):'척도만으로 판정'],['2점 이상 영역의 개입체계',String(k.sel.why||'').replace(/\s*\(.*\)|:.*$/,'')]];
  const map={0:[1,2,3],1:[0,1,2,3],2:[0,3,4],3:[4,5]};
  const n=k.cells.length,H=n*(bh+gap)-gap,inGap=(H-ins.length*bh)/(ins.length-1),yIn=i=>i*(bh+inGap),yJ=j=>j*(bh+gap);
  let g='';
  Object.entries(map).forEach(([i,js])=>js.forEach(j=>{const c=k.cells[j];g+=curve(inW,yIn(+i)+bh/2,jX,yJ(j)+bh/2,c.tone==='risk'&&+i===1?'r':'')}));
  g+=curve(jX+jW-6,yJ(4)+bh/2,jX+jW-6,yJ(5)+bh/2,'self');
  ins.forEach(([a,b],i)=>{g+=sbox(0,yIn(i),inW,bh,[a].concat(wrapT(b,22,1)),'in',{bold:true,sub:true,fs:10.5})});
  k.cells.forEach((c,j)=>{const v=c.k==='path'?k.lead+' 주관 · '+k.path:c.value;const cls=c.tone==='risk'?'r':c.tone==='check'?'q':c.tone==='ok'?'ok':j===2?'hi':'';
    g+='<g class="nb jd '+cls+'"><rect x="'+jX+'" y="'+yJ(j)+'" width="'+jW+'" height="'+bh+'" rx="7"/><text x="'+(jX+12)+'" y="'+(yJ(j)+bh/2+4)+'" class="k">'+esc(c.n+' '+c.name)+'</text><text x="'+(jX+128)+'" y="'+(yJ(j)+bh/2+4)+'" class="b">'+esc(wrapT(v,30,1)[0])+'</text></g>'});
  return svgWrap(W,H,g,'근거에서 판정까지 연결도');
}
/* 그림 2 사례 개념도: 어려움 → 맞물린 고리 → 첫 개입 → 기대 변화 */
function conceptDiagram(k){
  const W=700,colW=150,xs=[0,183,366,550],bh=38,gap=10;
  const A=k.keys.length?k.keys.map(x=>[x.t,x.v?x.v+'점':'서술에서 확인']):[['두드러진 어려움 없음','']];
  const B=[[k.pat?k.pat.name:(k.code?String(k.code.name||'').replace(/\s*프로파일$/,''):'—'),k.pat?'맞물린 고리':'프로파일']];
  const Cc=[[k.first||'첫 만남에서 정함','첫 개입']];
  const D=k.goals.length?k.goals.slice(0,2).map(g=>[g.target,g.topic]):[['재평가에서 확인','기대 변화']];
  const cols=[A,B,Cc,D],hs=cols.map(c=>c.length===1?bh*1.9:bh+6);
  const H=Math.max(...cols.map((c,i)=>c.length*(hs[i]+gap)-gap));
  const ys=cols.map((c,i)=>{const tot=c.length*(hs[i]+gap)-gap,top=(H-tot)/2;return c.map((_,j)=>top+j*(hs[i]+gap))});
  let g='';
  for(let i=0;i<3;i++)ys[i].forEach(a=>ys[i+1].forEach(b=>{g+=curve(xs[i]+colW,a+hs[i]/2,xs[i+1],b+hs[i+1]/2)}));
  cols.forEach((c,i)=>c.forEach(([t,s],j)=>{const L=wrapT(t,13,c.length===1?3:2);g+=sbox(xs[i],ys[i][j],colW,hs[i],c.length===1?L.concat([s]):[L[0],s],['','hub','hi','ok'][i],{bold:true,sub:true,fs:10.5})}));
  g+=['어려움','맞물린 고리','개입','기대 변화'].map((l,i)=>'<text x="'+xs[i]+'" y="-8" class="cap">'+l+'</text>').join('');
  return svgWrap(W,H,g,'사례 개념도',-22);
}
/* 그림 3 역할별 흐름도: 가로 = 시기, 세로 = 맡는 곳. 칸마다 맡는 곳별 첫 할 일만. */
function laneDiagram(k){
  const school=/담임|교사|교육복지사|상담|Wee|학교/,leadIsSchool=/학교/.test(k.lead);
  const lanes=leadIsSchool?['학교 (주관)','복지관·공공','지역·전문기관']:[k.lead+' (주관)','학교','지역·전문기관'];
  const laneOf=w=>{const s=String(w||'');if(/주관 담당자/.test(s)||orgShort(s)===k.lead||s.includes(k.lead))return 0;if(school.test(s))return leadIsSchool?0:1;if(/복지관|행정복지|공공/.test(s))return leadIsSchool?1:0;return 2;};
  const W=700,lx=104,cw=(W-lx)/4,lh=66,top=26,bw=cw-16,bh=52,last=k.stops.length-1;
  const cols=k.stops.map(s=>({h:String(s.h).replace(/\s*\(.*\)/,''),sub:(/\((.*)\)/.exec(s.h)||[])[1]||'',rows:s.rows.slice(0,4)}));
  const nodes=[];cols.forEach((c,i)=>{const used={};c.rows.forEach(r=>{const L=i===last?0:laneOf(r.who);if(used[L])return;used[L]=1;nodes.push({i,L,t:r.what})})});
  const H=top+lanes.length*lh+6;let g='';
  lanes.forEach((l,j)=>{const y=top+j*lh,LL=wrapT(l.replace(' (주관)',' 주관'),9,2);g+='<line class="lane" x1="0" y1="'+(y+lh)+'" x2="'+W+'" y2="'+(y+lh)+'"/>'+LL.map((t,q)=>'<text x="0" y="'+(y+lh/2+4+(q-(LL.length-1)/2)*13)+'" class="k">'+esc(t)+'</text>').join('')});
  cols.forEach((c,i)=>{const x=lx+i*cw;g+='<text x="'+(x+bw/2)+'" y="12" text-anchor="middle" class="cap '+(i===0?'now':'')+'">'+esc(c.h)+(c.sub?' · '+esc(c.sub):'')+'</text>';if(i===0)g+='<rect class="nowband '+(k.urgent?'r':'')+'" x="'+(x-6)+'" y="'+(top-4)+'" width="'+(cw-6)+'" height="'+(lanes.length*lh+6)+'" rx="9"/>';});
  const pos=n=>({x:lx+n.i*cw,y:top+n.L*lh+(lh-bh)/2});
  for(let a=0;a<nodes.length-1;a++){const p=pos(nodes[a]),q=pos(nodes[a+1]);g+=nodes[a].i===nodes[a+1].i?'<path class="ln" d="M'+(p.x+bw/2)+' '+(p.y+bh)+' C'+(p.x+bw/2)+' '+(p.y+bh+8)+', '+(q.x+bw/2)+' '+(q.y-8)+', '+(q.x+bw/2)+' '+q.y+'"/>':curve(p.x+bw,p.y+bh/2,q.x,q.y+bh/2);}
  nodes.forEach(n=>{const p=pos(n);g+=sbox(p.x,p.y,bw,bh,wrapT(String(n.t).replace(/\.$/,''),12,3),n.i===0?(k.urgent?'r':'hi'):n.i===last?'ok':'',{fs:10})});
  return svgWrap(W,H,g,'역할별 흐름도');
}

/* 학년은 판정을 바꾸지 않는 해석 보조: 1쪽에는 한 줄, 자세한 내용은 쪽 채움 블록. */
const noCite=t=>String(t||'').replace(/\[S\d+\]/g,'');
const firstSent=t=>noCite(t).split(/(?<=다\.)\s+/)[0];
const gradeLine=k=>k.grade?'<p class="sm ofr-grade"><b>'+esc(k.grade.short+' · '+(k.grade.band.split(' · ').pop()))+'</b> '+esc(firstSent((k.grade.readings[0]||{}).text||('이 시기의 핵심 과업은 '+k.grade.tasks.slice(0,2).join(', ')+'입니다.')))+'</p>':'';
const keyLi=k=>'<li>'+dots(k.v)+'<span><b>'+esc(k.t)+'</b>'+(k.v?'':' <span class="xs mut">서술에서 확인</span>')+'</span></li>';
const alertHtml=k=>k.urgent?'<p class="alert"><b>오늘 할 일</b>'+esc(k.immediate||'')+k.critical.map(x=>' · '+esc(x.n+'번 '+x.topic+': '+x.action)).join('')+'</p>':'';
const agendaHtml=k=>k.agenda.length?'<p class="qnote">'+k.agenda.map(a=>esc(a.t)).join(' ')+'</p>':'';
const selMarks=k=>k.ladder.map(r=>{const m=/미충족/.test(r[2])?'–':/충족|공동|일치/.test(r[2])?'✓':/검토|확인|결정/.test(r[2])?'?':'–';return '<li><b>'+m+'</b>&nbsp;'+esc(String(r[0]).split(' · ')[0].replace(/\s*\(.*\)/,''))+': '+esc(r[1])+'</li>'}).join('');
const signHtml=k=>'<div class="sign"><div>작성자</div><div>검토자</div><div>사례회의일</div><div>다음 점검일</div></div><p class="fine">25문항 응답'+(k.inc?'과 서술기록':'')+'을 OY-RALS 규칙으로 정리한 실무 참고자료이며 진단·학대 판정·위험 예측·서비스 자격 결정이 아닙니다. 공식 판정은 CORE, 지원 우선순위 5단계는 검증 전 개발지표입니다.'+(k.hasNarr&&!k.inc?' 서술 원문은 넣지 않았고 판정은 화면과 같습니다.':'')+' 판정 사슬 '+esc(k.ver)+'. 시험 운영판(2026년 12월 중순 정식 운영 예정)으로 결과값·항목이 바뀔 수 있습니다.</p>';
const goalTable=k=>k.goals.length?'<div class="tw"><table><thead><tr><th>주제</th><th>지금</th><th>다음 재평가까지</th><th>점검</th></tr></thead><tbody>'+k.goals.map(g=>'<tr><td><b>'+esc(g.topic)+'</b></td><td class="nw">'+(g.now?dots(g.now)+g.now+'점':'서술')+'</td><td>'+esc(g.target)+'</td><td>'+esc(g.measure)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="sm mut">2점 이상 영역이 없어 목표는 첫 만남에서 학생과 정합니다.</p>';

function page1(k){
  const sub=['최종 보고서'+(k.grade?' · '+k.grade.label:'')+(k.revision?' · 평가 '+k.revision+'차':''),k.date+' · 서술 '+(k.inc?'포함':'미포함')+' · 실무자 확인 전 초안'];
  return '<header class="mast pad"><h1>OY-RALS <span>사례 저널</span></h1><p>'+esc(sub[0])+'<br>'+esc(sub[1])+'</p></header>'+
   '<div class="lead pad"><p class="t '+k.tone+'"><small>지원 우선순위</small>'+esc(k.tier?k.tier+'단계':'미확정')+'</p><div><h2>'+esc(k.path)+'</h2><p>'+esc(k.tierName)+' · '+esc(k.level.name||'')+' · 통합사례관리 '+esc(k.sel.value)+'</p></div></div>'+
   (k.urgent||k.agenda.length?'<div class="pad ofr-notes">'+alertHtml(k)+agendaHtml(k)+'</div>':'')+
   '<div class="four pad">'+
    '<section><h3><span>01 · URGENCY</span>얼마나 급한가</h3><div class="meter '+(k.tier===5?'r':'')+'">'+[1,2,3,4,5].map(i=>'<i class="'+(k.tier&&i<=k.tier?'on':'')+'"></i>').join('')+'</div><p class="big">'+esc(k.tierName)+'</p><p class="sm mut">'+esc(k.tierWhy)+'</p></section>'+
    '<section><h3><span>02 · NEEDS</span>무엇이 어려운가</h3><ul>'+(k.keys.length?k.keys.map(keyLi).join(''):'<li class="mut">두드러진 어려움 없음</li>')+'</ul></section>'+
    '<section><h3><span>03 · TEAM</span>누가 맡는가</h3><p class="big">'+esc(k.lead)+' 주관</p><ul>'+k.parts.map(x=>'<li>· '+esc(x)+' 협력</li>').join('')+k.cands.slice(0,2).map(x=>'<li class="mut">· '+esc(x.s)+' (후보)</li>').join('')+'</ul></section>'+
    '<section><h3><span>04 · VOICE</span>이 학생은</h3><p class="sm">'+esc(String(k.und).split(/(?<=다\.)\s+/)[0])+'</p>'+gradeLine(k)+(k.quote?'<p class="sm mut">“'+esc(k.quote.t)+'”</p>':'')+'<div class="chips">'+k.strengths.slice(0,2).map(s=>'<span class="chip">'+esc(s.label)+'</span>').join('')+k.wishes.map(w=>'<span class="chip w">바람 · '+esc(w)+'</span>').join('')+'</div></section></div>'+
   '<figure class="band pad"><h3>그림 1 · 근거에서 판정까지</h3>'+chainDiagram(k)+'<figcaption class="xs mut">왼쪽 근거가 오른쪽 여섯 판정으로 이어집니다. 판정은 01·03·04 화면과 같은 값이며, ⑤ 통합사례관리 결과가 ⑥ 진행체계를 정합니다.</figcaption></figure>'+
   '<figure class="band pad"><h3>그림 2 · 사례 개념도</h3>'+conceptDiagram(k)+'<figcaption class="xs mut">어려움이 어떤 고리로 맞물려 있고, 첫 개입이 어떤 변화를 노리는지 한 줄로 이었습니다.</figcaption></figure>';
}
function page2(k){
  return '<header class="mast pad mast2"><h1>근거와 점검</h1><p>회의·재평가용'+(k.revision?' · 평가 '+esc(k.revision)+'차':'')+'</p></header>'+
   '<figure class="band pad band0"><h3>그림 3 · 역할별 흐름도 · 지금 이 사례가 어디쯤인가</h3>'+laneDiagram(k)+'<figcaption class="xs mut">가로는 시기, 세로는 맡는 곳입니다. 강조한 칸이 지금 할 일이며, 얇은 선이 계획의 순서입니다. 한 칸에는 맡는 곳별 첫 할 일만 넣었고, 전체 계획은 04 기관 사례관리에 있습니다.</figcaption></figure>'+
   '<div class="p2 pad"><section><h3>통합사례관리 선정</h3><p class="big">'+esc(k.sel.value)+'</p><ul>'+selMarks(k)+'</ul></section>'+
    '<section><h3>사례회의에서 정할 것</h3><ul>'+k.agenda.map(a=>'<li><b>'+esc(a.t)+'</b></li>').join('')+k.meet.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul></section>'+
    '<section><h3>다음 면담에서 물을 것</h3><ul>'+k.questions.slice(0,2).map(q=>'<li>'+esc(q.q)+'</li>').join('')+'</ul></section></div>'+
   '<div class="pad ofr-goals"><h3>목표와 점검</h3>'+goalTable(k)+'</div>';
}
/* 쪽 채움 블록: 쪽 끝에 순서대로 넣어 보고 A4 한 장을 넘는 블록은 뺀다(fill). 1쪽에 들어간 블록은 2쪽에서 쓰지 않는다. */
function extras(k){
  const X=[];
  // 학년은 판정을 바꾸지 않는 해석 보조라 쪽 채움 블록 맨 앞에 둔다(자리가 없으면 다른 블록처럼 빠짐).
  if(k.grade)X.push(['grade','<h3 class="xh">학년으로 읽기 <span>'+esc(k.grade.label+' · '+k.grade.band)+' · 판정 불변</span></h3><ul class="xcols"><li><b>발달과업</b> '+esc(k.grade.tasks.slice(0,3).join(', '))+'</li>'+k.grade.readings.slice(0,2).map(x=>'<li><b>'+esc(x.domain)+'</b> '+esc(firstSent(x.text))+'</li>').join('')+(k.grade.handoff?'<li><b>전환기</b> '+esc(k.grade.handoff)+'</li>':'')+'</ul><p class="mut">근거: '+esc(k.grade.sources.map(s=>s.short).join(' · '))+'</p>']);
  X.push(['profile','<h3 class="xh">영역 프로파일 <span>10개 영역 · 가장 높은 문항 점수</span></h3><ul class="xprof">'+k.profile.map(d=>'<li class="'+(/^아동학대/.test(d.name)&&d.peak>0?'r':'')+'"><span class="nm">'+esc(d.name)+'</span>'+dots(d.peak||0)+'<em>'+esc(d.label)+((d.unknown||[]).length?' · 미상 '+d.unknown.length:'')+'</em></li>').join('')+'</ul>']);
  if(k.leadText)X.push(['opinion','<h3 class="xh">통합 사정의견</h3><p>'+esc(k.leadText)+(k.adjust?' '+esc(k.adjust):'')+'</p>'+(k.level.reason?'<p class="mut">'+esc(k.level.reason)+'</p>':'')]);
  if(k.strengths.length)X.push(['strength','<h3 class="xh">강점 · 지원의 발판</h3><ul class="xcols">'+k.strengths.slice(0,4).map(s=>'<li><b>'+esc(s.label)+'</b> '+esc(s.text)+'</li>').join('')+'</ul>']);
  if(k.family)X.push(['family','<h3 class="xh">보호자와 함께하기</h3><p>'+esc(k.family)+'</p>']);
  X.push(['rhythm','<h3 class="xh">접촉·회의·재사정 주기</h3><ul class="xrow"><li><b>접촉</b>'+esc(k.level.contact||'—')+'</li><li><b>회의</b>'+esc(k.level.meeting||'—')+'</li><li><b>재사정</b>'+esc(k.level.review||'—')+'</li></ul>']);
  if(k.resources.length)X.push(['res','<h3 class="xh">연계 자원 후보 <span>02 지역자원 연계와 같은 순위 · 접수 조건은 기관에 확인</span></h3><div class="tw"><table><thead><tr><th>영역</th><th>기관</th><th>서비스</th><th>확인할 것</th></tr></thead><tbody>'+k.resources.slice(0,5).map(r=>'<tr><td>'+esc(r.domain)+'</td><td><b>'+esc(orgShort(r.name))+'</b></td><td>'+esc(r.service)+'</td><td>'+esc(r.cond)+'</td></tr>').join('')+'</tbody></table></div>']);
  if(k.inc&&k.gaps.length)X.push(['gaps','<h3 class="xh">기록 보완할 것</h3><ul class="xcols">'+k.gaps.slice(0,4).map(g=>'<li><b>'+esc(g.topic)+'</b> '+esc(g.text)+'</li>').join('')+'</ul>']);
  if(k.questions.length>2)X.push(['moreq','<h3 class="xh">추가로 물어볼 것</h3><ul>'+k.questions.slice(2).map(q=>'<li>'+esc(q.q)+(q.about?' <span class="mut">('+esc(q.about)+')</span>':'')+'</li>').join('')+'</ul>']);
  return X.map(([id,h])=>'<section class="xtra pad" data-x="'+id+'">'+h+'</section>').join('');
}
const opHtml=k=>k.opinion?'<section class="xop pad"><h3 class="xh">실무자 의견 <span>작성자가 직접 쓴 서술 의견 · 판정은 위와 같음</span></h3><p>'+esc(k.opinion)+'</p></section>':'';
const memoHtml='<section class="xmemo pad"><h3 class="xh">사례회의 메모 <span>회의에서 정한 내용을 손으로 적습니다</span></h3><div class="lines"></div></section>';
const footHtml=k=>'<div class="foot pad xfoot">'+signHtml(k)+'</div>';

/* A4 두 쪽(인쇄·PC 미리보기). 채우기 전 원본이라 fill()을 거쳐야 쪽이 맞는다. */
function sheetsHtml(k){
  const X=extras(k),O=opHtml(k);
  return [page1(k)+O+X,page2(k)+O+X+memoHtml+footHtml(k)].map((h,n)=>'<div class="ofr-sheet-box"><div class="ofr-clip"><div class="ofr-scale"><div class="ofr-sheet"><article class="ofr-rep ofr-pg'+(n+1)+'">'+h+'</article><span class="ofr-pgno">OY-RALS 최종 보고서 · '+(n+1)+'/2쪽</span></div></div></div></div>').join('');
}
/* 휴대폰 읽기 화면: 같은 내용을 한 줄기로. 메모 칸은 종이에서만 쓴다. */
function readHtml(k){return '<article class="ofr-rep ofr-mob">'+page1(k)+'<div class="pbreak">회의·점검</div>'+opHtml(k)+page2(k)+extras(k)+footHtml(k)+'</article>';}

/* 쪽 채우기: 실무자 의견은 빼지 않는다(2쪽 우선, 안 맞으면 1쪽, 둘 다 넘치면 덜 넘치는 쪽에서 글자를 80%까지 줄임).
   그 다음 보조 블록을 하나씩 넣어 보고 넘치면 뺀다. 남는 높이는 1쪽은 단락 사이에 고르게, 2쪽은 메모 칸이 채운다. */
function fill(scope){
  const reps=[...scope.querySelectorAll('.ofr-sheet .ofr-rep')];if(reps.length!==2)return {over:false};
  const over=r=>r.scrollHeight-r.clientHeight,[r1,r2]=reps;
  reps.forEach(r=>r.querySelectorAll('.xtra,.xmemo').forEach(x=>x.hidden=true));
  const o1=r1.querySelector('.xop'),o2=r2.querySelector('.xop');
  if(o1&&o2){o1.hidden=true;const fits2=over(r2)<=1;o1.hidden=false;o2.hidden=true;const fits1=over(r1)<=1;
    let host;if(fits2)host=r2;else if(fits1)host=r1;else{const a=over(r1);o2.hidden=false;o1.hidden=true;host=over(r2)<a?r2:r1;}
    (host===r1?o2:o1).remove();const op=host.querySelector('.xop');op.hidden=false;
    for(let f=1;over(host)>1&&f>.8;f-=.04)op.style.fontSize=f.toFixed(2)+'em';}
  reps.forEach(r=>r.querySelectorAll('.xmemo').forEach(x=>x.hidden=false));
  const used=new Set();
  reps.forEach(rep=>{
    const memo=rep.querySelector('.xmemo');
    rep.querySelectorAll('.xtra').forEach(x=>{if(used.has(x.dataset.x)){x.remove();return;}x.hidden=false;if(over(rep)>1)x.remove();else used.add(x.dataset.x);});
    if(memo&&over(rep)>1){memo.remove();rep.classList.add('ofr-spread');}
    // The page's own content can still be a little over one A4 (long names, a narrative quote): shrink the type
    // a little rather than cut the last lines off the printed page.
    const base=parseFloat(getComputedStyle(rep).fontSize)||14;
    for(let f=.98;over(rep)>1&&f>=.84;f-=.02)rep.style.fontSize=(base*f).toFixed(2)+'px';
  });
  return {over:reps.some(r=>over(r)>1)};
}
function fitScale(scope){
  scope.querySelectorAll('.ofr-sheet-box').forEach(box=>{const s=Math.min(1,box.clientWidth/794);const sc=box.querySelector('.ofr-scale');if(sc)sc.style.transform='scale('+s+')';box.style.height=(1123*s)+'px';});
}

/* TXT: 화면과 같은 판정 + 핵심 내용. inc=false면 서술 분석 문장·원문을 넣지 않는다. */
function text(p,opt){
  const k=model(p,opt||{}),L=[];
  L.push('OY-RALS 최종 보고서'+(k.grade?' · '+k.grade.label:'')+(k.revision?' · 평가 '+k.revision+'차':'')+' · '+k.date+' · 서술 '+(k.inc?'포함':'미포함')+' · 실무자 확인 전 초안','');
  L.push(OD().text(k.R),'');
  L.push('[한눈에]','지원 우선순위: '+(k.tier?k.tier+'단계 ':'')+k.tierName+' ('+k.tierWhy+')','진행체계: '+k.lead+' 주관 · '+k.path,'무엇이 어려운가: '+(k.keys.map(x=>x.t+(x.v?' '+x.v+'점':' (서술에서 확인)')).join(', ')||'두드러진 어려움 없음'),'함께할 곳: '+[...k.parts,...k.cands.map(x=>x.s+'(후보)')].join(', '),'이 학생은: '+k.und,'첫 개입: '+k.first);
  if(k.urgent)L.push('오늘 할 일: '+k.immediate+k.critical.map(x=>' · '+x.n+'번 '+x.topic+': '+x.action).join(''));
  L.push('','[통합사례관리 선정] '+k.sel.value);k.ladder.forEach(r=>L.push('- '+r[0]+': '+r[1]+' → '+r[2]));
  L.push('','[계획]');k.stops.forEach(s=>L.push(s.h+': '+s.rows.map(r=>r.what+(r.who?' ('+r.who+')':'')).join(' / ')));
  if(k.goals.length){L.push('','[목표와 점검]');k.goals.forEach(g=>L.push('- '+g.topic+' (지금 '+(g.now?g.now+'점':'서술')+'): '+g.target+' · 점검 '+g.measure));}
  if(k.agenda.length||k.meet.length){L.push('','[사례회의에서 정할 것]');k.agenda.forEach(a=>L.push('- '+a.t));k.meet.forEach(a=>L.push('- '+a));}
  if(k.questions.length){L.push('','[다음 면담에서 물을 것]');k.questions.forEach(q=>L.push('- '+q.q));}
  if(k.leadText)L.push('','[통합 사정의견]',k.leadText+(k.adjust?' '+k.adjust:''));
  if(k.grade){L.push('','[학년으로 읽기 · 판정 불변] '+k.grade.label+' · '+k.grade.band,k.grade.summary);if(k.grade.transition)L.push(k.grade.transition);k.grade.readings.forEach(x=>L.push('- '+x.domain+': '+x.text));L.push('근거: '+k.grade.sources.map(s=>'['+s.id+'] '+s.short).join(' · '));}
  if(k.resources.length){L.push('','[연계 자원 후보 · 접수 조건은 기관에 확인]');k.resources.forEach(r=>L.push('- '+r.domain+' · '+r.name+' · '+r.service+(r.cond?' · '+r.cond:'')));}
  if(k.opinion)L.push('','[실무자 의견]',k.opinion);
  L.push('','25문항 응답'+(k.inc?'과 서술기록':'')+'을 OY-RALS 규칙으로 정리한 실무 참고자료이며 진단·학대 판정·위험 예측·서비스 자격 결정이 아닙니다. 공식 판정은 CORE, 지원 우선순위 5단계는 검증 전 개발지표입니다.'+(k.hasNarr&&!k.inc?' 서술 원문은 넣지 않았고 판정은 화면과 같습니다.':'')+' 시험 운영판(2026년 12월 중순 정식 운영 예정)으로 결과값·항목이 바뀔 수 있습니다.');
  return L.join('\n');
}

/* ── 화면 연결(05 = data-oy-step 7, flow stage 7) ── */
const ops={};let cur=null,incNarr=false,timer=0;
const mobile=()=>!!(root.matchMedia&&root.matchMedia('(max-width: 640px)').matches);
function currentOpinion(){return cur?(ops[cur.flowRevision]||''):''}
function renderPages(area){
  const host=area.querySelector('[data-ofr-pages]');if(!host||!cur)return;
  let k;try{k=model(cur,{includeNarrative:incNarr,opinion:currentOpinion()})}catch(e){host.innerHTML='<p class="ofr-err" role="status">보고서를 만들지 못했습니다. 평가를 다시 완료해 주세요.</p>';return;}
  const read=mobile();host.className='ofr-pages'+(read?' ofr-read':'');
  host.innerHTML=read?readHtml(k):sheetsHtml(k);
  let r={over:false};if(!read){r=fill(host);fitScale(host);}
  const n=currentOpinion().length,cnt=area.querySelector('[data-ofr-count]');
  if(cnt){cnt.textContent=n+' / '+OP_MAX+'자'+(r.over?' · A4 2쪽을 넘습니다. 조금 줄여 주세요':'');cnt.classList.toggle('warn',r.over);}
}
function mountStage(e){
  const st=e&&e.detail,doc=root.document,area=doc&&doc.getElementById('finalReportArea');if(!area)return;
  const on=!!(st&&st.ready&&st.payload&&st.stage===7);area.hidden=!on;if(!on)return;
  const key=st.payload.flowRevision+'|'+String(st.payload.caseContext||'').length+'|'+JSON.stringify(st.payload.answers);
  cur=st.payload;
  if(area.dataset.ofrKey===key){renderPages(area);return;}area.dataset.ofrKey=key;
  const hasNarr=!!String(cur.caseContext||'').trim();if(!hasNarr)incNarr=false;
  area.innerHTML='<div class="ofr-head"><span class="ofr-eyebrow">05 최종 보고서 · 한 사례를 A4 2쪽으로</span><p>판정·해석·연계·계획을 앞 화면과 같은 값으로 모았습니다. 화면에 보이는 쪽이 그대로 인쇄됩니다.</p></div>'+
   '<div class="ofr-bar"><span class="ofr-bt">A4 2쪽 · 인쇄 미리보기</span><label class="ofr-chk"><input type="checkbox" data-ofr-inc'+(incNarr?' checked':'')+(hasNarr?'':' disabled')+'>서술기록 포함 '+(hasNarr?'(기본 제외)':'(입력 없음)')+'</label><span class="ofr-bb"><button type="button" class="ofr-primary" data-ofr-print>인쇄 · PDF 저장</button><button type="button" data-ofr-copy>TXT 복사</button></span><span class="ofr-status" role="status" data-ofr-status></span></div>'+
   '<div class="ofr-op"><label for="ofrOpinion"><b>실무자 의견</b> <small>쓰면 보고서에 바로 들어갑니다 · 판정은 바뀌지 않습니다</small></label><textarea id="ofrOpinion" maxlength="'+OP_MAX+'" rows="4" placeholder="사례회의·면담에서 판단한 내용, 학생과 보호자의 반응, 담당자 간 약속 등을 씁니다. 이름·연락처 같은 식별정보는 쓰지 않습니다."></textarea><span class="ofr-count" data-ofr-count></span></div>'+
   '<div data-ofr-pages class="ofr-pages"></div>';
  area.querySelector('#ofrOpinion').value=currentOpinion();
  renderPages(area);
}
function printReport(doc){
  if(!cur)return;
  const old=doc.getElementById('ofr-print-root');if(old)old.remove();
  const k=model(cur,{includeNarrative:incNarr,opinion:currentOpinion()});
  const box=doc.createElement('section');box.id='ofr-print-root';box.className='ofr-print';box.innerHTML=sheetsHtml(k);
  doc.body.append(box);fill(box);
  doc.body.classList.add('ofr-printing');
  const w=doc.defaultView,done=()=>{box.remove();doc.body.classList.remove('ofr-printing');w&&w.removeEventListener('afterprint',done)};
  if(w){w.addEventListener('afterprint',done);try{w.print()}catch(_){done()}}
}
async function copyText(doc,status){
  if(!cur)return;const t=text(cur,{includeNarrative:incNarr,opinion:currentOpinion()});
  try{await root.navigator.clipboard.writeText(t);status.textContent='TXT를 복사했습니다.';}
  catch(_){const ta=doc.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';doc.body.append(ta);ta.select();let ok=false;try{ok=doc.execCommand('copy')}catch(__){}ta.remove();status.textContent=ok?'TXT를 복사했습니다.':'복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.';}
}
function bind(doc){
  if(!doc||doc.__ofrBound)return;doc.__ofrBound=true;
  doc.addEventListener('input',e=>{const t=e.target;if(!t||t.id!=='ofrOpinion'||!cur)return;ops[cur.flowRevision]=t.value.slice(0,OP_MAX);const area=t.closest('#finalReportArea');clearTimeout(timer);timer=setTimeout(()=>renderPages(area),200);});
  doc.addEventListener('change',e=>{const t=e.target;if(!t||!t.matches||!t.matches('[data-ofr-inc]'))return;incNarr=t.checked;renderPages(t.closest('#finalReportArea'));});
  doc.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('[data-ofr-print],[data-ofr-copy]');if(!t)return;const area=t.closest('#finalReportArea');
    if(t.hasAttribute('data-ofr-print'))printReport(doc);else copyText(doc,area.querySelector('[data-ofr-status]'));});
  let rt=0;root.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const area=doc.getElementById('finalReportArea');if(area&&!area.hidden)renderPages(area);},150);});
}
/* ZIP 자료 보관: 실무자 의견은 '서술 포함'을 고른 경우에만 들어간다(bundle-export.js). */
function exportSnapshot(){return cur?{revision:cur.flowRevision,opinion:currentOpinion(),includeNarrative:incNarr}:null;}

const api=Object.freeze({VERSION,OP_MAX,model,text,sheetsHtml,readHtml,fill,exportSnapshot});
if(node)module.exports=api;else{root.OYFinalReport=api;if(root.document){bind(root.document);root.addEventListener('oy-journey-view',mountStage);}}
})(typeof window!=='undefined'?window:globalThis);
