/* OY-RALS supplementary figures v1: range bands, horizontal tables and diagrams built from the 25 answers.
   Bands split the scale's possible range (0~4 per item) into four equal parts. They are not population
   norms or percentiles. CORE scores and the safety decision are read, never changed. */
(function(root){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const K=node?require('./oy-item-knowledge-v1.js'):root.OYItemKnowledge;
const VERSION='1.0.0-20261026';
const SAFETY=[1,2,7,25];
const BANDS=[
 {id:1,name:'1구간',range:'0~25%',label:'낮음',text:'어려움이 없거나 가끔 보이는 수준'},
 {id:2,name:'2구간',range:'25~50%',label:'주의',text:'어려움이 반복되어 살펴볼 수준'},
 {id:3,name:'3구간',range:'50~75%',label:'상승',text:'어려움이 생활 기능을 끌어내리는 수준'},
 {id:4,name:'4구간',range:'75~100%',label:'현저',text:'어려움이 일상 유지를 어렵게 하는 수준'}
];
const NOTICE='구간은 척도가 가질 수 있는 범위(문항당 0~4점)를 네 등분한 응답강도 구간이며, 학생 집단과 비교한 백분위나 4분위 규준이 아닙니다. 규준 표본이 확보되기 전까지는 이 학생의 응답이 척도 범위 안에서 어디쯤 있는지를 보여주는 보조지표로만 읽습니다. 미상 문항은 0점으로 계산하지 않고 확인한 문항만으로 비율을 냅니다.';
const isNum=v=>typeof v==='number';
const bandOf=pct=>pct===null?null:pct<25?1:pct<50?2:pct<75?3:4;
const round=v=>Math.round(v);
function rate(values,items){
 const known=items.filter(n=>isNum(values[n-1])),sum=known.reduce((s,n)=>s+values[n-1],0),max=known.length*4;
 const pct=max?sum/max*100:null;
 return {items,known:known.length,unknown:items.length-known.length,sum,max,pct,band:bandOf(pct),peak:known.length?Math.max(...known.map(n=>values[n-1])):null};
}
function build(p){
 if(!p||!Array.isArray(p.answers)||p.answers.length!==25)throw Error('FIGURES_INPUT_INVALID');
 const v=p.answers.slice();
 const all=Array.from({length:25},(_,i)=>i+1);
 let start=0;
 const domains=K.DOMAIN_NAMES.map((name,d)=>{const items=Array.from({length:K.DOMAIN_SIZES[d]},(_,j)=>start+j+1);start+=K.DOMAIN_SIZES[d];return {name,...rate(v,items)}});
 const axes=K.AXES.map(a=>({name:a.name,...rate(v,a.items)}));
 const dist=[0,1,2,3,4].map(s=>v.filter(x=>x===s).length).concat([v.filter(x=>x==='unknown').length]);
 const eco=[['self','개인'],['family','가족'],['school','학교'],['community','지역사회']].map(([id,name])=>{const items=K.ITEMS.filter(k=>k.eco===id).map(k=>k.n);return {id,name,...rate(v,items),hard:items.filter(n=>isNum(v[n-1])&&v[n-1]>=2).map(n=>K.item(n).topic)}});
 const safety=SAFETY.map(n=>({n,topic:K.item(n).topic,value:v[n-1]}));
 const items=all.map(n=>({n,topic:K.item(n).topic,value:v[n-1],domain:K.DOMAIN_OF[n-1],safety:SAFETY.includes(n)}));
 return {version:VERSION,total:rate(v,all),domains,axes,dist,eco,safety,items,notice:NOTICE};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pctText=r=>r.pct===null?'미상':round(r.pct)+'%';
const bandText=r=>r.band?BANDS[r.band-1].name+' · '+BANDS[r.band-1].label:'확인 전';
function bandStrip(r,label){
 const x=r.pct===null?null:Math.max(0,Math.min(100,r.pct));
 return '<div class="osf-strip" role="img" aria-label="'+esc(label+' 응답강도 '+pctText(r)+', '+bandText(r))+'">'
  +'<div class="osf-track">'+BANDS.map(b=>'<span class="osf-seg osf-g'+b.id+(r.band===b.id?' is-on':'')+'"></span>').join('')+(x===null?'':'<i class="osf-knob" style="left:'+x.toFixed(1)+'%"></i>')+'</div>'
  +'<div class="osf-scale">'+BANDS.map(b=>'<span class="'+(r.band===b.id?'is-on':'')+'"><b>'+b.name+' · '+b.label+'</b><small>'+b.range+'</small></span>').join('')+'</div>'
  +(x===null?'<p class="osf-muted">확인된 응답이 없어 위치를 표시하지 않습니다.</p>':'')+'</div>';
}
function bandTable(rows,head){
 return '<div class="osf-table"><table class="osf-bandtable"><caption class="osf-sr">'+esc(head)+'별 응답강도 4구간 위치</caption><thead><tr><th scope="col">'+esc(head)+'</th>'+BANDS.map(b=>'<th scope="col" class="osf-b'+b.id+'h">'+b.name+'<small>'+b.range+'</small></th>').join('')+'<th scope="col">미상</th></tr></thead><tbody>'
  +rows.map(r=>'<tr><th scope="row">'+esc(r.name)+'</th>'+BANDS.map(b=>'<td class="'+(r.band===b.id?'osf-hit osf-b'+b.id:'')+'">'+(r.band===b.id?'<span class="osf-dot" aria-hidden="true"></span><b>'+esc(pctText(r))+'</b>':'')+'</td>').join('')+'<td class="osf-unk">'+(r.unknown?r.unknown+'문항':'—')+'</td></tr>').join('')
  +'</tbody></table></div>';
}
function distBar(d){
 const total=d.reduce((a,b)=>a+b,0)||1,labels=['0점','1점','2점','3점','4점','미상'];
 return '<div class="osf-dist" role="img" aria-label="'+esc(labels.map((l,i)=>l+' '+d[i]+'문항').join(', '))+'">'+d.map((c,i)=>c?'<span class="osf-s'+(i===5?'u':i)+'" style="flex:'+c+'"><b>'+c+'</b></span>':'').join('')+'</div>'
  +'<ul class="osf-legend">'+labels.map((l,i)=>'<li><i class="osf-s'+(i===5?'u':i)+'"></i>'+l+' '+d[i]+'문항</li>').join('')+'</ul>';
}
function itemMap(f){
 let h='<div class="osf-itemmap">';
 f.domains.forEach((d,di)=>{h+='<div class="osf-group"><h5>'+esc(d.name)+'</h5><ul>'+f.items.filter(it=>it.domain===di).map(it=>'<li'+(it.safety?' class="osf-safe"':'')+' title="'+esc(it.n+'번 '+it.topic)+'"><span class="osf-num">'+it.n+'</span><span class="osf-topic">'+esc(it.topic)+(it.safety?' <small>안전</small>':'')+'</span><span class="osf-val osf-s'+(isNum(it.value)?it.value:'u')+'">'+(isNum(it.value)?it.value:'미상')+'</span></li>').join('')+'</ul></div>'});
 return h+'</div>';
}
// Ecological levels drawn as concentric progress rings (inner = individual, outer = community).
function ecoDiagram(f){
 const size=320,c=160,R=[52,78,104,130],W=20;
 const col=r=>r.band===null?'#c7cdd6':['#1765bd','#e07068','#c42b2b','#b02424'][r.band-1];
 const rings=f.eco.map((e,i)=>{const len=2*Math.PI*R[i],v=e.pct===null?0:Math.max(e.pct>0?2:0,e.pct)/100;
  return '<circle cx="'+c+'" cy="'+c+'" r="'+R[i]+'" fill="none" stroke="#eef1f5" stroke-width="'+W+'"/>'
   +(v?'<circle cx="'+c+'" cy="'+c+'" r="'+R[i]+'" fill="none" stroke="'+col(e)+'" stroke-width="'+W+'" stroke-linecap="round" stroke-dasharray="'+(len*v).toFixed(1)+' '+len.toFixed(1)+'" transform="rotate(-90 '+c+' '+c+')"/>':'')
   +(e.pct===null?'<circle cx="'+c+'" cy="'+c+'" r="'+R[i]+'" fill="none" stroke="#b8c4d1" stroke-width="2" stroke-dasharray="3 5"/>':'');}).join('');
 return '<div class="osf-eco"><svg viewBox="0 0 '+size+' '+size+'" role="img" aria-label="'+esc('생태체계 응답강도 링: '+f.eco.map(e=>e.name+' '+pctText(e)).join(', '))+'" shape-rendering="geometricPrecision">'+rings+'<text x="'+c+'" y="'+(c+6)+'" text-anchor="middle" font-size="15" font-weight="600" fill="#16273a" font-family="-apple-system, BlinkMacSystemFont, \'Apple SD Gothic Neo\', \'Pretendard\', sans-serif">생태체계</text></svg>'
  +'<ul>'+f.eco.map((e,i)=>'<li><i style="background:'+col(e)+'"></i><div><strong>'+esc(e.name)+'</strong><span class="osf-pct">'+esc(pctText(e))+'</span><small>'+esc(['안쪽 첫째 링','둘째 링','셋째 링','바깥 링'][i])+' · '+esc(bandText(e))+'</small>'+(e.hard.length?'<em class="osf-warn">'+esc(e.hard.join(', '))+'</em>':'')+(e.unknown?'<small>미상 '+e.unknown+'문항</small>':'')+'</div></li>').join('')+'</ul></div>';
}
function safetyStrip(f){
 return '<ul class="osf-safety">'+f.safety.map(s=>{const st=s.value==='unknown'?'u':s.value>0?'on':'off';return '<li class="osf-sf-'+st+'"><strong>'+esc(s.topic)+'</strong><span>'+(st==='u'?'미상 · 확인 필요':st==='on'?'응답 있음 · 우선 확인':'보고 없음')+'</span></li>'}).join('')+'</ul>';
}
const SEC_TITLE={total:'전체 응답강도 위치 (총점 구간)',safety:'안전 문항 확인 현황',domains:'10개 영역 × 4구간 가로형 표',axes:'5개 상위 축',dist:'25문항 응답 분포',eco:'생태체계 링',map:'25문항 지도'};
const SEC_DESC={total:'확인한 문항의 응답 합계가 척도 가능 범위에서 어디쯤인지 보여줍니다.',safety:'안전 문항은 구간과 관계없이 응답이 하나라도 있으면 먼저 확인합니다.',
 domains:'각 영역이 어느 구간에 놓이는지 한 줄씩 비교합니다. 붉은색이 진할수록 응답강도가 높습니다.',axes:'영역을 안전·정서·학교·생활 기반·관계 축으로 묶어 큰 흐름을 봅니다.',
 dist:'0점부터 4점, 미상까지 문항 수를 한 줄로 보여줍니다.',eco:'안쪽부터 개인·가족·학교·지역사회입니다. 링이 길수록 그 수준의 응답강도가 높습니다.',map:'영역별로 묶은 문항의 응답입니다. ‘안전’ 표시는 안전 문항입니다.'};
// Body of one figure. opts.only limits the domain table to the named domains, so a page can show just its own rows.
function body(f,key,opts){
 const o=opts||{};
 switch(key){
  // A low total next to a safety answer must not read as "few difficulties": the safety answer leads.
  case 'total':{const sp=f.safety.some(x=>typeof x.value==='number'&&x.value>0);
   return bandStrip(f.total,'전체')+'<p class="osf-band-note"><strong>'+esc(bandText(f.total))+'</strong> '+esc(f.total.band?(sp&&f.total.band<=2?'총점 위치는 '+BANDS[f.total.band-1].label+'이지만 안전 문항에 응답이 있어, 총점과 관계없이 안전 확인이 먼저입니다.':BANDS[f.total.band-1].text):'확인된 응답이 없습니다.')+'</p>';}
  case 'safety':return safetyStrip(f);
  case 'domains':{const rows=o.only?f.domains.filter(d=>o.only.indexOf(d.name)>=0):f.domains;return rows.length?bandTable(rows,'영역'):''}
  case 'axes':return bandTable(f.axes,'상위 축');
  case 'dist':return distBar(f.dist);
  case 'eco':return ecoDiagram(f);
  case 'map':return itemMap(f);
  default:return '';
 }
}
// One figure as a standalone section, for placing diagrams inside the paged report.
function part(f,key,opts){
 const o=opts||{},b=body(f,key,o);
 if(!b)return '';
 const title=o.title||SEC_TITLE[key],desc=o.desc===null?'':(o.desc||SEC_DESC[key]);
 return '<section class="osf-sec osf-sec-'+key+(o.className?' '+o.className:'')+'">'+(title?'<h4>'+esc(title)+'</h4>':'')+(desc?'<p class="osf-desc">'+esc(desc)+'</p>':'')+b+'</section>';
}
function noticeHtml(f){return '<footer class="osf-notice"><strong>구간 기준</strong> '+esc(f.notice)+'</footer>'}
function html(f){
 return '<article class="oy-scale-figures" data-figures-version="'+VERSION+'"><header><span>OY-RALS 보조지표 해석도구</span><h3>척도 범위 4구간과 응답 구조</h3></header>'
  +['total','safety','domains','axes','dist','eco','map'].map(k=>part(f,k)).join('')
  +noticeHtml(f)+'</article>';
}
function text(f){
 const L=['[보조지표 · 척도 범위 4구간]','전체: '+pctText(f.total)+' · '+bandText(f.total)];
 f.domains.forEach(d=>L.push('- '+d.name+': '+pctText(d)+' · '+bandText(d)+(d.unknown?' · 미상 '+d.unknown+'문항':'')));
 L.push('상위 축: '+f.axes.map(a=>a.name+' '+pctText(a)).join(', '),'응답 분포: '+['0점','1점','2점','3점','4점','미상'].map((l,i)=>l+' '+f.dist[i]).join(', '),'구간 기준: '+f.notice);
 return L.join('\n');
}
const api=Object.freeze({VERSION,BANDS,NOTICE,bandOf,build,html,text,part,noticeHtml});
if(node)module.exports=api;else root.OYScaleFigures=api;
})(typeof window!=='undefined'?window:globalThis);
