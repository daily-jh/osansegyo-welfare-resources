/* OY-RALS practitioner readout V1.
 * Display-only explanation of results already computed by CORE (YouthCriteria)
 * and the five-level index (OYFiveLevelIndex). It never changes scores, tiers,
 * official safety decisions or narrative polarity; it only says, in plain words,
 * why the result came out this way and what to check first.
 */
(function(root,factory){'use strict';const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYResultReadout=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const G=typeof window!=='undefined'?window:globalThis;
const NAMES=['안정관찰','초기주의','집중지원','다기관 집중개입','최우선 안전대응'];
const SIZES=[2,3,3,3,2,2,3,3,2,2];
const SAFETY_ITEMS=[1,2,7,25];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stage=n=>n?'제'+n+'단계('+NAMES[n-1]+')':'';
const list=a=>a.map(n=>n+'번').join('·');
function itemReason(n){
 const C=G.YouthCriteria||(typeof require==='function'?(()=>{try{return require('./criteria.js')}catch(e){return null}})():null);
 return C?.items?.[n-1]?.reason||'';
}
function contextCore(){
 return G.YouthCaseContextCore||(typeof require==='function'?(()=>{try{return require('./case-context-core.js')}catch(e){return null}})():null);
}
/* Narrative cues the five-level index deliberately does NOT promote automatically
 * (negated, historical or about someone else). Shown so a person reads the original. */
function narrativeCues(payload){
 const text=String(payload?.caseContext||'').trim();
 if(!text)return {entered:false,reflected:[],held:[]};
 const N=contextCore();
 if(!N?.reconcile)return {entered:true,reflected:[],held:[]};
 const r=N.reconcile(payload.answers,text);
 const reflected=[],held=[],seen=new Set();
 (r.signals||[]).forEach(s=>{
  if(!s)return;
  const auto=['reported','unverified'].includes(s.polarity)&&s.timeHint!=='historical-mention'&&s.subject!=='third-party';
  const why=s.subject==='third-party'?'다른 사람(친구·가족 등)에 대한 이야기로':s.timeHint==='historical-mention'?'과거의 일로':s.polarity==='negated'?'부정 표현(“하지 않음”, “말하지 않음” 등)으로':s.polarity==='hypothetical'?'가정·예시 표현으로':'확인되지 않은 표현으로';
  const key=s.tag+'|'+(auto?'a':why);if(seen.has(key))return;seen.add(key);
  (auto?reflected:held).push({tag:s.tag,label:s.label,items:s.items||[],safety:!!s.safety,why,ask:s.action||''});
 });
 return {entered:true,reflected,held};
}
/* Which rule actually decided the final tier. */
function drivers(x){
 const rows=[];
 rows.push(x.complete
  ?{kind:'score',level:x.baseTier,title:'점수 기준',text:'통합지표 '+x.composite+'/100 → 점수만으로는 '+stage(x.baseTier)+' (20점 구간마다 1단계)'}
  :{kind:'score',level:null,title:'점수 기준',text:'미상 '+x.unknown+'문항이 있어 통합지표를 계산하지 않았습니다. 미상은 0점으로 채우지 않습니다.'});
 const pf=x.patternFloor||1;
 rows.push({kind:'pattern',level:x.complete?pf:null,floor:pf,title:'응답 패턴 기준',
  text:pf>1?x.patternReason+' → 최소 '+stage(pf):'2점 이상 응답이 없어 패턴 기준 상향은 없습니다.',
  pending:!x.complete&&pf>1});
 rows.push({kind:'safety',level:x.safetyFloor,title:'안전 기준',
  text:x.safetyFloor?x.safetyReason+' → 최소 '+stage(x.safetyFloor):'안전 관련 응답·긴급 신호에 따른 상향은 없습니다.'});
 // A floor decides only when it lifted the tier above the score-based tier.
 const lifted=x.tier!==null&&(x.baseTier===null||x.tier>x.baseTier);
 rows.forEach(r=>{r.decisive=x.tier!==null&&r.level===x.tier&&(lifted?r.kind!=='score':r.kind==='score');});
 return rows;
}
function decisiveText(x){
 const d=drivers(x).filter(r=>r.decisive&&r.kind!=='score');
 return d.map(r=>r.kind==='safety'?x.safetyReason:x.patternReason).join(' · ');
}
/* Lower bound implied by answers already confirmed. Reference only: the
 * five-level index keeps tier null until every item is confirmed. */
function provisionalFloor(x){
 if(x.tier!==null||x.complete)return null;
 const f=Math.max(x.patternFloor||1,x.safetyFloor||1);
 return f>1?f:null;
}
function firstChecks(x,payload,cues){
 const o=x.official,out=[];
 if(o.urgent&&!o.lowSafetyOnly)out.push({urgent:true,text:'오늘 바로: 학생의 현재 안전을 직접 확인하고 사안별 보호·신고 절차를 검토합니다. 점수 합계와 관계없습니다.'});
 (o.safetyItems||[]).forEach(n=>out.push({urgent:payload.answers[n-1]>=2,text:n+'번 '+payload.answers[n-1]+'점(안전문항) — '+itemReason(n)}));
 (o.pendingChecks||[]).forEach(n=>out.push({urgent:true,text:n+'번 현재 안전 추가확인이 “아직 확인하지 못함”입니다 — 현재 위험이 있는지 확인해 ‘있음/없음’으로 기록해야 공식 판단 보류가 풀립니다.'}));
 (o.safetyUnknown||[]).forEach(n=>out.push({urgent:true,text:n+'번(안전문항)이 미상입니다 — 가장 먼저 확인할 문항입니다. '+itemReason(n)}));
 const other=(o.unknownItems||[]).filter(n=>!SAFETY_ITEMS.includes(n));
 if(other.length)out.push({text:'미상 '+list(other)+' — 확인 전까지 전체 단계를 확정하지 않습니다. 미상은 0점(어려움 없음)이 아닙니다.'});
 (cues?.reflected||[]).filter(c=>c.safety).forEach(c=>out.push({urgent:true,text:'서술에 ‘'+c.label+'’ 내용이 학생의 현재 일로 적혀 있습니다'+(c.items.every(n=>payload.answers[n-1]===0)?'('+list(c.items)+' 점수는 0점)':'')+' — '+c.ask+' 서술만으로 점수를 바꾸지 않습니다.'}));
 (cues?.held||[]).filter(c=>c.safety).forEach(c=>out.push({urgent:true,text:'서술의 ‘'+c.label+'’ 내용은 '+c.why+' 분류되어 자동 판정에는 반영하지 않았습니다. 원문을 직접 읽고 '+list(c.items)+' 응답과 현재 안전을 확인하세요.'}));
 (o.critical||[]).filter(n=>!SAFETY_ITEMS.includes(n)).slice(0,3).forEach(n=>out.push({text:n+'번 '+payload.answers[n-1]+'점 — '+itemReason(n)}));
 return out;
}
function mismatchText(m,payload){
 const cues=narrativeCues(payload),cue=[...cues.reflected,...cues.held].find(c=>c.tag===m.tag);
 const safety=(m.items||[]).some(n=>SAFETY_ITEMS.includes(n))||cue?.safety;
 const zero=/0점/.test(m.issue||'');
 const label=cue?.label||'관련 내용';
 const who=cue&&cue.why.startsWith('다른 사람')?' 다만 학생 본인이 아닌 다른 사람의 이야기일 수 있습니다.':'';
 if(zero&&safety)return '서술에 ‘'+label+'’ 내용이 있으나 '+list(m.items)+' 점수는 0점입니다.'+who+' 점수를 고치기 전에 먼저 학생의 현재 안전을 직접 확인하고, 확인한 사실로 '+list(m.items)+' 점수를 다시 매기세요. 서술만으로 점수를 자동으로 바꾸지 않습니다.';
 if(zero)return '서술에 ‘'+label+'’ 내용이 있으나 '+list(m.items)+' 점수는 0점입니다.'+who+' 같은 일인지, 최근 1개월의 일인지 확인한 뒤 점수를 다시 볼지 정하세요. 점수 오류라는 뜻은 아닙니다.';
 return m.issue+' (예: 과거에는 있었지만 지금은 없다는 뜻인지, 서로 다른 일인지)';
}
function analyze(x,payload){
 const cues=narrativeCues(payload);
 return {drivers:drivers(x),decisive:decisiveText(x),floor:provisionalFloor(x),checks:firstChecks(x,payload,cues),cues};
}
/* opts.objective: this x was computed without narrative (tab ①).
 * opts.fullTier: tier computed with narrative, to flag differences between tabs. */
function html(x,payload,opts={}){
 const r=analyze(x,payload),o=x.official;
 const coreState=o.urgent&&!o.lowSafetyOnly?'urgent':o.provisional?'hold':'ok';
 const head='<div class="oy-readout-core oy-readout-'+coreState+'"><small>CORE 공식 판정 (점수·안전 원본)</small><strong>'+esc(o.title)+'</strong><p>'+esc(o.reason)+'</p></div>';
 const why='<div class="oy-readout-why"><h5>이 단계가 나온 이유</h5><ol>'+r.drivers.map(d=>'<li class="'+(d.decisive?'decisive':'')+'"><b>'+esc(d.title)+(d.decisive?' · 결정 요인':'')+'</b> '+esc(d.text)+(d.pending?' <em>(미상 확인 전에는 적용하지 않음)</em>':'')+'</li>').join('')+'</ol>'
  +(x.tier!==null?'<p>최종 단계는 위 세 기준 중 <b>가장 높은 단계</b>입니다 → <b>'+esc(stage(x.tier))+'</b>. 통합지표 숫자가 낮아도 안전·응답 패턴 기준으로 단계가 올라갈 수 있습니다.</p>'
   :'<p><b>단계 미확정</b> · 미상 '+x.unknown+'문항이 확인되면 단계가 정해집니다.'+(r.floor?' 지금 확인된 응답만으로도 <b>최소 '+esc(stage(r.floor))+'</b> 기준에 해당합니다(참고 하한이며 공식 단계가 아닙니다).':'')+' 확인된 어려움에 대한 지원은 기다리지 않고 먼저 진행합니다.</p>')+'</div>';
 const checks=r.checks.length?'<div class="oy-readout-checks"><h5>먼저 확인할 것</h5><ul>'+r.checks.slice(0,8).map(c=>'<li class="'+(c.urgent?'urgent':'')+'">'+esc(c.text)+'</li>').join('')+'</ul></div>':'';
 let tab='';
 if(opts.objective&&r.cues.entered&&opts.fullTier!==undefined&&opts.fullTier!==x.tier){
  tab='<p class="oy-readout-tab">이 화면은 점수만 반영합니다. 서술기록까지 반영한 <b>통합 사정의견</b>의 단계는 <b>'+esc(opts.fullTier?stage(opts.fullTier):'단계 미확정')+'</b>입니다'+(r.cues.reflected.some(c=>c.safety)?' — 서술에 현재 안전 관련 표현이 있어 올라갔습니다':'')+'.</p>';
 }else if(!opts.objective&&r.cues.entered&&opts.scoreTier!==undefined&&opts.scoreTier!==x.tier){
  tab='<p class="oy-readout-tab">점수만 반영한 척도 해석은 '+esc(opts.scoreTier?stage(opts.scoreTier):'단계 미확정')+'이며, 서술기록을 함께 반영해 '+esc(stage(x.tier))+'(으)로 정리했습니다.</p>';
 }
 return '<section class="oy-readout" aria-label="결과 읽는 법">'+head+tab+why+checks+'</section>';
}
function narrativeLabel(x,payload,objective){
 const entered=!!String(payload?.caseContext||'').trim();
 if(!entered)return '미입력';
 if(objective)return '척도 해석에서 제외 · 통합 사정의견에서 확인';
 return x.narrative===null?'입력됨 · 자동 반영 단서 없음':x.narrative+' / 100';
}
function domainNote(d,i){
 const size=SIZES[i]||0,known=d.max/4;
 if(!known)return '확인자료 없음 · 미상 '+d.unknown+'개 (0점 아님)';
 return '확인 '+known+'/'+size+'문항 · '+d.raw+'/'+d.max+'점'+(d.unknown?' · 미상 '+d.unknown+'개는 계산에서 제외(0점 아님)':'');
}
function tierLine(x){
 if(x.tier!==null)return '제'+x.tier+'단계 '+x.label;
 const f=provisionalFloor(x);
 return '단계 미확정(미상 '+x.unknown+'문항)'+(f?' · 확인된 응답 기준 최소 제'+f+'단계 참고':'');
}
return Object.freeze({version:'1.0.0',NAMES,analyze,html,drivers,decisiveText,provisionalFloor,firstChecks,narrativeCues,mismatchText,narrativeLabel,domainNote,tierLine});
});
