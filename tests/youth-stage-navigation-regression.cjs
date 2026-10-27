/* No real student data. Regression for navigation from a completed synthetic assessment. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/flow.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../docs/youth-risk/index.html'),'utf8');
const props=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
class Element{
 constructor(name='div'){this.name=name;this.id=name;this.hidden=false;this.disabled=false;this.style={};this.value='';this.attrs={};this.children=[];this.classList={add(){},remove(){}};this.files=[];this.contentWindow={postMessage(){}};}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]}
 append(x){this.children.push(x)}
 appendChild(x){this.append(x)}
 replaceChildren(...items){this.children=items}
 remove(){this.hidden=true}
 focus(){}
 scrollIntoView(){}
 addEventListener(name,fn){this['on'+name]=fn}
 querySelector(){return null}
 querySelectorAll(){return []}
}
const nodes=new Map(props.map(id=>[id,new Element(id)]));nodes.get('recordVersion').value='';
// The five visible steps (01 result, 02 map, 03 school, 04 agency, 05 final report) carry data-oy-step 1·2·6·3·7.
const steps=new Map([1,2,6,3,7].map(v=>{const a=new Element('step'+v);a.dataset={oyStep:String(v)};return [v,a];}));
const extra=new Element('flow-data-tools');
const document={
 baseURI:'https://example.test/youth-risk/',
 createElement:tag=>new Element(tag),
 createTextNode:value=>({textContent:value}),
 getElementById:id=>nodes.get(id)||null,
 querySelector:query=>query==='.flow-data-tools'?extra:null,
 querySelectorAll:query=>query==='[data-oy-step]'?[...steps.values()]:[]
};
const callbacks={};const events=[];
const window={addEventListener:(type,fn)=>{callbacks[type]=fn},dispatchEvent:e=>{events.push(e);return true},confirm:()=>true};
const payload={
 answers:Array(25).fill(0),explicit:[],followups:{},
 domains:Array.from({length:10},(_,i)=>({name:'합성'+i,items:['가상']})),
 routes:Array.from({length:10},()=>[]),resources:[],
 caseContext:'',student:{gender:'미확인',dong:''}
};
const analysis={defaultDomains:[],plans:[]};
const ctx={window,document,CustomEvent:class{constructor(type,detail){this.type=type;this.detail=detail.detail}},URL,location:{origin:'https://example.test'},YouthMap:{validate:()=>true},YouthPlanning:{analyze:()=>analysis},requestAnimationFrame:fn=>fn(),console};
vm.runInNewContext(source,ctx,{filename:'flow.js'});
const assessment=nodes.get('assessmentFrame');
assert.ok(!html.includes('id="resultTools"'),'post-score feature box removed: the result tabs carry the result page');
assert.ok(!/data-oy-step="[45]"/.test(html),'AI workshop and records steps removed from navigation');
assert.equal(nodes.get('bundlePanel').hidden,true,'Storage strip waits for a completed assessment');
callbacks.message({origin:'https://example.test',source:assessment.contentWindow,data:{type:'youth-flow-complete-v1',payload}});
assert.equal(events.at(-1).detail.stage,2);
assert.equal(events.at(-1).detail.view,'result');
assert.equal(nodes.get('bundlePanel').hidden,false,'ZIP storage available after evaluation');
const result=nodes.get('flowStatus');
steps.get(3).onclick();
assert.equal(events.at(-1).detail.stage,3,'Agency case management must open directly without mandatory map-confirmation click');
assert.match(result.textContent,/지원연계 지도 검토는 미완료/);
assert.equal(events.at(-1).detail.payload.linkageReviewStatus,'연계 후보 검토 전');
steps.get(6).onclick();
assert.equal(events.at(-1).detail.stage,6,'School support opens without navigation lock');
steps.get(7).onclick();
assert.equal(events.at(-1).detail.stage,7,'Final report opens as its own step');
assert.equal(nodes.get('stepTitle').textContent,'최종 보고서 · A4 2쪽');
assert.match(nodes.get('previousStep').textContent,/04 기관 사례관리/);
nodes.get('previousStep').onclick();
assert.equal(events.at(-1).detail.stage,3,'Back from 05 goes to 04 agency case management');
assert.ok(/data-oy-step="7"[^>]*>05 · 최종 보고서/.test(html),'05 final report step in navigation');
steps.get(1).onclick();
assert.equal(events.at(-1).detail.stage,2);
assert.equal(events.at(-1).detail.view,'result','step 01 returns to the result tabs');
steps.get(2).onclick();
assert.equal(events.at(-1).detail.view,'map');
assert.equal(nodes.get('linkageReviewPanel').hidden,false,'Map review buttons shown when explicitly opening linkage map');
nodes.get('confirmLinkageReview').onclick();
assert.equal(events.at(-1).detail.stage,3);
assert.match(events.at(-1).detail.payload.linkageReviewStatus,/검토/);
assert.equal(payload.answers.every(v=>v===0),true,'Navigation never modifies source CORE answers');
console.log('PASS five-step navigation; storage after evaluation; map review optional; CORE immutable');
