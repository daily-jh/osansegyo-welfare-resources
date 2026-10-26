'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const events={},controls={},roots=new Map(),classes=new Set();let builds=0,prints=0;
function element(){return {hidden:false,disabled:false,children:[],append(...x){this.children.push(...x);for(const n of x)if(n.id)roots.set(n.id,n)},replaceChildren(){this.children=[];this.firstElementChild=null},querySelector(s){return controls[s]},querySelectorAll(){return [{open:false}]},cloneNode(){return element()},remove(){roots.delete(this.id)},set innerHTML(v){this.html=v;if(v.includes('deep-controls'))for(const id of ['deep-report-output','deep-status','deep-print','deep-narrative','deep-generate'])controls['#'+id]=element();else this.firstElementChild=element()},get innerHTML(){return this.html}}}
const main=element(),body=element();body.classList={add:x=>classes.add(x),remove:x=>classes.delete(x)};
const document={body,createElement:element,querySelector:()=>main,getElementById:id=>roots.get(id)};
const window={addEventListener:(n,f)=>events[n]=f,print:()=>{prints++},OYDeepReport:{build:(p,o)=>{builds++;return {includeNarrative:o.includeNarrative,completeness:{known:p.answers.length}}},render:()=>'<article>시험 보고서</article>'}};
vm.runInNewContext(fs.readFileSync('docs/youth-risk/deep-report-pilot-ui.js','utf8'),{window,document});
const emit=p=>events['oy-journey-view']({detail:{ready:!!p,payload:p}}),p={answers:Array(25).fill(0)};
emit(p);controls['#deep-generate'].onclick();assert.equal(builds,1);assert.equal(controls['#deep-print'].disabled,false);
emit(p);assert.equal(controls['#deep-print'].disabled,false,'navigation with identical payload retains report');
controls['#deep-print'].onclick();assert.equal(prints,1);assert.ok(roots.has('deep-print-root'));assert.ok(classes.has('deep-report-printing'));
events.afterprint();assert.ok(!roots.has('deep-print-root'));assert.ok(!classes.has('deep-report-printing'));
controls['#deep-narrative'].onchange();assert.equal(controls['#deep-print'].disabled,true);
controls['#deep-generate'].onclick();emit({answers:Array(25).fill('unknown')});assert.equal(controls['#deep-print'].disabled,true);
emit(null);assert.equal(main.children[0].hidden,true);
console.log('PASS UI state: same-data navigation, input/option invalidation, detached print root, afterprint cleanup, unready hiding (DOM stub; not browser rendering)');
