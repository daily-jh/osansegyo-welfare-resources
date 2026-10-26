/* V3 paragraph → sentence → item → domain structured interpretation, no CORE mutation. */
(function(root,factory){'use strict';const api=factory(typeof module!=='undefined'&&module.exports);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OYNarrativeStructure=api;})(typeof window!=='undefined'?window:globalThis,function(node){'use strict';
const C=node?require('./case-context-core.js'):window.YouthCaseContextCore;
const GROUPS=[2,3,3,3,2,2,3,3,2,2],LABELS=['학대·보호','학교폭력·또래안전','정서·정신건강','학습·출결','행동·건강','교육접근','가족·돌봄','경제·주거','관계·지지','디지털 안전'];
const area=n=>{let total=0;for(let i=0;i<GROUPS.length;i++){total+=GROUPS[i];if(n<=total)return i;}return 9};
const clean=s=>C.redact(String(s||'')).slice(0,300);
function interpret(p){
 const txt=String(p.caseContext||'').trim().slice(0,5000);if(!txt)return {present:false,paragraphs:[],sentences:[],themes:[]};
 const paragraphs=txt.split(/\n\s*\n+/).map(z=>z.trim()).filter(Boolean).slice(0,15),all=[];
 const analyzed=paragraphs.map((paragraph,i)=>{
  const rows=C.splitClauses(paragraph).slice(0,30).map((sentence,j)=>{
   const signals=(C.infer(sentence).signals||[]).filter(x=>x.polarity!=='hypothetical');
   const ids=[...new Set(signals.flatMap(x=>x.items))].sort((a,b)=>a-b);
   const areas=[...new Set(ids.map(n=>LABELS[area(n)]))];
   const statuses=[...new Set(signals.map(x=>x.polarity==='negated'?'부정진술':x.timeHint==='historical-mention'?'과거언급':x.polarity==='unverified'?'추정·전언':'현재 보고'))];
   const source=signals[0]?.source||'입력 기록의 정보원 미분류';
   const row={id:'P'+(i+1)+'-S'+(j+1),text:clean(sentence),source,items:ids,areas,status:statuses.join('·')||'강점·희망·상황 서술',scores:ids.map(n=>'Q'+n+' '+(p.answers[n-1]==='unknown'?'미상':p.answers[n-1]+'점')),notes:signals.map(x=>x.label)};
   all.push(row);return row;
  });
  const areas=[...new Set(rows.flatMap(r=>r.areas))];
  return {number:i+1,topic:areas.length?areas.slice(0,2).join('·'):'생활·강점·희망',source:clean(paragraph).slice(0,500),rows,areas,items:[...new Set(rows.flatMap(r=>r.items))]};
 });
 const topics=new Map();for(const row of all)for(const name of row.areas){if(!topics.has(name))topics.set(name,{name,sentences:[],scores:[]});const t=topics.get(name);t.sentences.push(row.id);t.scores.push(...row.scores);}
 return {present:true,paragraphs:analyzed,sentences:all,themes:[...topics.values()].map(t=>({...t,scores:[...new Set(t.scores)].slice(0,8)})).sort((a,b)=>b.sentences.length-a.sentences.length)};
}
return Object.freeze({VERSION:'1.0.0-paragraphs-20261026',interpret});
});