const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let pages=0,links=0;
for(const file of walk('docs').filter(p=>p.endsWith('.html'))){
 pages++;const html=fs.readFileSync(file,'utf8');
 assert.match(html,/<html[^>]+lang="ko"/,file);assert.match(html,/<meta name="viewport"/,file);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+' duplicate element ID');
 for(const hit of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=hit[1].replace(/&amp;/g,'&'),local=url.split(/[?#]/)[0];
  if(!local||/^(?:[a-z]+:|\/\/)/i.test(local))continue;
  const target=path.resolve(local.startsWith('/')?'docs':path.dirname(file),local.replace(/^\//,''));
  assert.ok(target===path.resolve('docs')||target.startsWith(path.resolve('docs')+path.sep),file+' path outside site');assert.ok(fs.existsSync(target),file+' missing '+local);links++;
 }
}
console.log('PASS: '+pages+' HTML pages; '+links+' local links/assets; Korean language, viewport, unique IDs');
