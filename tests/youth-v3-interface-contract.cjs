/* OY-RALS V3 presentation/print integration contracts; no private case data. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../docs');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('youth-risk/index.html'),assessment=read('youth-risk/assessment.html');
const directory=read('index.html');
for(const [file,html] of [['youth-risk/index.html',home],['youth-risk/assessment.html',assessment],['index.html',directory]]){
  for(const [,href] of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)){
    const rel=href.split('?')[0];if(/^(https?:|\/\/)/.test(rel))continue;
    assert.ok(fs.existsSync(path.join(root,path.dirname(file),rel)),file+' missing stylesheet '+rel);
  }
}
assert.match(home,/id="assessmentFrame"/,'embedded assessment must exist');
assert.match(home,/class="flow-skip-link"/,'keyboard skip navigation');
assert.match(home,/oy-bundle-v13\.css/,'youth design loaded');
assert.ok(JSON.parse(read('youth-risk/oy-css-manifest.json')).sources.includes('apple-hig-refinement.css'),'youth design ships in the CSS bundle');
assert.match(directory,/apple-hig-refinement\.css/,'directory design loaded');
assert.match(assessment,/assessment-design-v2\.css/,'iframe design loaded');
const flow=read('youth-risk/flow.js'),child=read('youth-risk/flow-child.js');
assert.match(child,/Preserve scroll position/,'editor mode must preserve scroll');
assert.doesNotMatch(child,/scrollTo\(/,'iframe must not scroll to top on editor input');
assert.match(flow,/linkageReviewed/,'mandatory linkage review state');
assert.match(flow,/linkageDeferred/,'safety deferral state');
assert.match(home,/id="bundleDownload"/,'bundle export control');
assert.match(home,/id="reportArea"/,'report area');
assert.match(assessment,/id="complete"/,'assessment completion control');
for(const p of ['youth-risk/apple-hig-refinement.css','assets/apple-hig-refinement.css','youth-risk/assessment-design-v2.css']){
 const css=read(p);assert.match(css,/focus-visible/,'keyboard focus '+p);assert.match(css,/max-width:700px/,'mobile layout '+p);
}
console.log('PASS: V3 stylesheet paths, assessment iframe, focus/mobile styles, scroll contract, linkage and report controls');
