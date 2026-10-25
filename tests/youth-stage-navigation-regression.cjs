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
const navs=Array.from({length:4},(_,i)=>{let a=new Element('stage'+(i+1));a.dataset={stage:String(i+1)};return a;});
const viewButtons=['result','map'].map(view=>{const a=new Element('view'+view);a.dataset={resultView:view};return a});
const extra=new Element('flow-data-tools');
const document={
 baseURI:'https://example.test/youth-risk/',
 createElement:tag=>new Element(tag),
 createTextNode:value=>({textContent:value}),
 getElementById:id=>nodes.get(id)||null,
 querySelector:query=>query==='.flow-data-tools'?extra:null,
 querySelectorAll:query=>query==='[data-stage]'?navs:query==='[data-result-view]'?viewButtons:[]
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
assert.equal(nodes.get('resultTools').hidden,true,'No post-score buttons before completing assessment');
callbacks.message({origin:'https://example.test',source:assessment.contentWindow,data:{type:'youth-flow-complete-v1',payload}});
assert.equal(nodes.get('resultTools').hidden,false,'Result action cards must appear after evaluation');
assert.equal(events.at(-1).detail.stage,2);
assert.equal(events.at(-1).detail.view,'result');
const result=nodes.get('flowStatus');
navs[2].onclick();
assert.equal(events.at(-1).detail.stage,3,'Case assessment must open directly without mandatory map-confirmation click');
assert.equal(nodes.get('resultTools').hidden,true,'Result cards hidden outside stage 2');
assert.match(result.textContent,/지원연계 지도 검토는 미완료/);
assert.equal(events.at(-1).detail.payload.linkageReviewStatus,'연계 후보 검토 전');
navs[3].onclick();
assert.equal(events.at(-1).detail.stage,4,'Optional notes/followup stage must open without navigation lock');
assert.equal(nodes.get('recordsArea').hidden,false);
navs[1].onclick();
assert.equal(nodes.get('resultTools').hidden,false);
viewButtons[1].onclick();
assert.equal(nodes.get('linkageReviewPanel').hidden,false,'Map review buttons shown when explicitly opening linkage map');
nodes.get('confirmLinkageReview').onclick();
assert.equal(events.at(-1).detail.stage,3);
assert.match(events.at(-1).detail.payload.linkageReviewStatus,/검토/);
assert.equal(payload.answers.every(v=>v===0),true,'Navigation never modifies source CORE answers');
console.log('PASS direct stage 3/4 navigation; result action buttons visible; map review optional; CORE immutable');
