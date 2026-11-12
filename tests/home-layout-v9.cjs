// 메인 v9(2026-11-12): 검색 로직 보완과 배치·창(팝업) 연결을 고정한다. 가상 문구만 쓴다.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const M=require('../docs/assets/search-model.js');
const root=path.join(__dirname,'..','docs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'assets/app.js'),'utf8'),css=fs.readFileSync(path.join(root,'assets/home-layout-v9.css'),'utf8');

// 1) 한 글자 현장어(술·빚·밥)는 낱말 첫머리에서만: '수술비·미술·기술'이 중독 기관으로 넓어지지 않는다.
for(const q of ['미술','기술','예술치료'])assert.deepEqual(M.suggestWords(q),[],q);
assert.ok(!M.suggestWords('수술비').includes('중독'),'수술비 ≠ 술');
assert.ok(M.suggestWords('술').includes('중독')&&M.suggestWords('술 문제').includes('중독'));
assert.ok(M.suggestWords('빚이 많아요').includes('채무'));
// 2) 검색창 예시 '중학생'과 생활 물품 말이 0건이 되지 않는다.
assert.ok(M.suggestWords('중학생').includes('청소년'));
assert.ok(M.suggestWords('기저귀').includes('푸드뱅크'));
assert.equal(M.queryMatch('청소년 상담 지원','중학생'),true);

// 3) 화면 배치: 검색창은 히어로 안, 조건은 사이드바, 기관 상세·긴급전화·연계 시트·조건은 창으로.
const hero=html.slice(html.indexOf('<section class="hero hero-v9">'),html.indexOf('</section>',html.indexOf('<section class="hero hero-v9">')));
assert.ok(hero.includes('id="searchForm"')&&hero.includes('id="keyword"'),'search lives in the hero');
assert.ok(hero.includes('class="hero-bento"')&&hero.includes('id="statOrgs"')&&hero.includes('id="needBento"'),'bento holds stats and need shortcuts');
assert.ok(!html.includes('class="hero-art"'),'decorative cards that looked clickable are gone');
assert.ok(html.includes('<aside class="finder-side" id="filterSide"'));
for(const id of ['orgDialog','helpDialog','printDialog','filterDialog'])assert.ok(html.includes(`<dialog id="${id}"`),id);
assert.ok(html.includes('id="sosOpen"')&&html.includes('class="help-band"'),'floating call button + full-bleed band');
assert.ok(html.includes('id="dataDash"')&&html.includes('id="activeChips"'));
assert.ok(html.includes('assets/home-layout-v9.css'));
// resource-correction.js가 찾는 .org-details가 기관 창 안에 있다.
assert.ok(html.includes('class="dlg-body org-details" id="orgDialogBody"'));

// 4) 로직: 기관 수는 검색에 나올 수 있는 기관만, 필터 숫자·0곳 막기, 주소에 조건 저장, 상세는 창으로.
assert.ok(app.includes("all.filter(o=>live(o)&&o.services.length).length"),'stat counts searchable orgs');
assert.ok(app.includes('const list=all.filter(o=>matched(o))'),'filter callback index must not become the state');
assert.ok(app.includes('function facets(')&&app.includes('op.disabled=!!op.value&&!k&&state[key]!==op.value'));
assert.ok(app.includes("op.setAttribute('value',op.value)"),'option value is kept when the count is added to its label');
assert.ok(app.includes('function syncURL(')&&app.includes('function readURL('));
assert.ok(app.includes('function openOrg(')&&!/state\.opened\.add/.test(app),'details open in a dialog, not inline');
assert.ok(css.includes('.v9-dialog[open]{display:flex')&&!/\.v9-dialog\{[^}]*display:flex/.test(css),'closed dialogs stay hidden');
console.log('home-layout-v9 ok');
