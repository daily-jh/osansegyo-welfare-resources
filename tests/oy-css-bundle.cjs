// The youth page loads one stylesheet built from oy-css-manifest.json; the bundle must match its sources.
const assert=require('assert'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=path.join(__dirname,'..'),dir=path.join(root,'docs/youth-risk');
execFileSync(process.execPath,[path.join(root,'scripts/build-youth-css.cjs'),'--check'],{stdio:'inherit'});
const m=JSON.parse(fs.readFileSync(path.join(dir,'oy-css-manifest.json'),'utf8'));
assert.strictEqual(new Set(m.sources).size,m.sources.length,'duplicate source in manifest');
for(const f of m.sources)assert.ok(fs.existsSync(path.join(dir,f)),f+' missing');
const page=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const links=[...page.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)].map(x=>x[1].split('?')[0]).filter(h=>!/^https?:/.test(h));
assert.deepStrictEqual(links,[m.output],'index.html should load only the bundle');
console.log('oy-css-bundle: ok '+m.sources.length+' sources → '+m.output);
