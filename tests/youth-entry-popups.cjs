// OY-RALS 첫 화면 창(팝업)·한 줄 단계 띠(2026-11-12). 판정 로직과 무관한 화면 연결만 고정한다.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','docs','youth-risk');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),css=fs.readFileSync(path.join(dir,'oy-entry-popups-v1.css'),'utf8');
const P=require(path.join(dir,'oy-entry-popups-v1.js'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'oy-css-manifest.json'),'utf8'));

assert.equal(manifest.sources.at(-1),'oy-entry-popups-v1.css','new layer is read last');
assert.ok(html.includes('oy-entry-popups-v1.js'));
// 스크립트가 없어도 안내로 갈 수 있게 원래 링크(#howItWorks)는 남긴다. 페이지 안 이동인데 새 창 화살표(↗)를 달지 않는다.
assert.match(html,/<a href="#howItWorks" data-oy-how aria-haspopup="dialog">활용 방법 보기<\/a>/);
assert.ok(html.includes('data-oy-calls'));
for(const n of ['01','02','03','04','05'])assert.ok(html.includes('<span class="step-number">'+n+'</span>'),'step '+n+' text stays in the page');
// 긴급 전화: 112·119가 먼저, 번호는 숫자만.
assert.deepEqual(P.CALLS.slice(0,2).map(c=>c[0]),['112','119']);
assert.ok(P.CALLS.every(c=>/^\d{3,4}$/.test(c[0])));
assert.ok(P.callsHTML().includes('href="tel:1388"')&&P.callsHTML().includes('href="tel:117"'));
// 닫힌 창은 보이지 않아야 한다. 세 묶음의 좌우 맞춤(oy-entry-layout-v1)은 건드리지 않는다.
assert.ok(css.includes('.oy-pop[open]{display:flex')&&!/\.oy-pop\{[^}]*display:flex/.test(css));
assert.ok(!/#welcome \.home-role-grid\{[^}]*(width|margin)/.test(css)&&!/#oyRoleStart\{/.test(css),'entry edges untouched');
// 설명 글은 문서에서 그대로 옮긴다(가짜 문서로 확인).
const art=(n,h,p)=>({querySelector:s=>({textContent:s==='.step-number'?n:s==='h2'?h:p})});
const doc={getElementById:id=>id==='howItWorks'?{querySelectorAll:()=>[art('01','가상 단계','가상 설명 <b>')]}:null};
const out=P.stepsHTML(doc);assert.ok(out.includes('가상 단계')&&out.includes('&lt;b&gt;')&&!out.includes('<b>가상 설명'),'text is escaped');
console.log('youth-entry-popups ok');
