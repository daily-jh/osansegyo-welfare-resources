'use strict';
/* 공유 썸네일(OG 1200×630)과 홈 화면 아이콘(PNG) 만들기 — 2026-11-16 디자인 고도화.
   기준: 「홈페이지 디자인·기능 고도화 통합 지침」 8장(OG 1200×630, 가장자리 안전 여백, 작은 크기 가독성).
   - 글꼴은 저장소의 SUIT Variable(OFL), 그림은 화면 머리말의 실제 표지(복지자원 찾기 세 잎, OY-RALS 연필 표지)만 씁니다.
   - 숫자(기관·서비스 수)는 넣지 않습니다. 자료가 바뀌면 썸네일이 낡기 때문입니다.
   실행: python3 -m http.server 8080 --directory docs 를 띄운 뒤 node scripts/build-share-images.cjs (Playwright 필요, 배포에는 PNG만 들어감). */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const DOCS=path.join(__dirname,'../docs');
const font=fs.readFileSync(path.join(DOCS,'youth-risk/fonts/SUIT-Variable.woff2')).toString('base64');
const pencil=fs.readFileSync(path.join(DOCS,'youth-risk/images/system-logo.svg'),'utf8');
const base=`<style>@font-face{font-family:SUIT;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}html,body{width:1200px;height:630px;overflow:hidden}body{font-family:SUIT,sans-serif;word-break:keep-all;-webkit-font-smoothing:antialiased}</style>`;
/* 복지자원 찾기 표지: 머리말 .brand-symbol(파랑 둥근 네모 + 세 잎)을 같은 비율로 그린 SVG */
const leaf=(s,pad)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${pad?'-6 -6 76 76':'0 0 64 64'}" width="${s}" height="${s}">${pad?'':'<clipPath id="c"><rect width="64" height="64" rx="20"/></clipPath>'}<g transform="rotate(-6 32 32)"><rect width="64" height="64" rx="20" fill="#3d70b0"/><g ${pad?'':'clip-path="url(#c)"'}><rect x="13.5" y="16" width="17" height="28" rx="8.5" fill="#f4ab8b" transform="rotate(-26 22 30)"/><rect x="39.5" y="23" width="17" height="28" rx="8.5" fill="#f5ce96" transform="rotate(40 48 37)"/><rect x="6.5" y="41" width="17" height="28" rx="8.5" fill="#b4ded1" transform="rotate(-88 15 55)"/></g></g></svg>`;
const homeOG=`${base}<body style="background:#f4f7fb"><div style="position:absolute;inset:0;background:radial-gradient(900px 520px at 100% 0%,#dfe9f6 0,transparent 60%)"></div>
<div style="position:absolute;left:84px;top:78px;display:flex;align-items:center;gap:20px">${leaf(84,true)}<div><b style="display:block;font-size:30px;font-weight:800;color:#12263f">오산 복지자원 찾기</b><span style="font-size:17px;letter-spacing:.14em;color:#5c6b7d;font-weight:600">OSAN WELFARE RESOURCE GUIDE</span></div></div>
<h1 style="position:absolute;left:84px;top:212px;font-size:76px;line-height:1.16;font-weight:800;color:#12263f;letter-spacing:-.02em">오산 복지자원,<br><span style="color:#1765bd">한곳에서</span> 찾으세요.</h1>
<p style="position:absolute;left:86px;top:418px;font-size:28px;color:#3b4a5c;font-weight:500">기관은 한 번만, 지원서비스는 빠짐없이 · 이용조건과 의뢰 절차까지</p>
<div style="position:absolute;left:84px;bottom:74px;display:flex;gap:12px">${['오산시','경기도','전국 공공','전국 민간'].map(t=>`<span style="padding:10px 20px;border-radius:999px;background:#fff;border:1.5px solid #cfdbe9;font-size:22px;font-weight:700;color:#1d3b5c">${t}</span>`).join('')}</div>
<span style="position:absolute;right:84px;bottom:84px;font-size:20px;color:#5c6b7d;font-weight:600">오산세교종합사회복지관</span></body>`;
const youthOG=`${base}<body style="background:#f3f6fc"><div style="position:absolute;inset:0;background:radial-gradient(820px 520px at 100% 100%,#e2e8fb 0,transparent 62%)"></div>
<div style="position:absolute;left:84px;top:78px;display:flex;align-items:center;gap:20px"><div style="width:76px;height:76px">${pencil.replace('<svg ','<svg width="76" height="76" ')}</div><div><b style="display:block;font-size:26px;font-weight:800;color:#12263f">OY-RALS</b><span style="font-size:17px;letter-spacing:.06em;color:#5c6b7d;font-weight:600">Osan Youth Risk Assessment &amp; Linkage System</span></div></div>
<h1 style="position:absolute;left:84px;top:208px;font-size:70px;line-height:1.18;font-weight:800;color:#12263f;letter-spacing:-.02em">오산 청소년<br><span style="color:#3b63d5">위기징후 평가연계 시스템</span></h1>
<p style="position:absolute;left:86px;top:412px;font-size:28px;color:#3b4a5c;font-weight:500">학생의 생활을 살피고, 필요한 지역자원을 찾아보세요.</p>
<div style="position:absolute;left:84px;bottom:74px;display:flex;gap:12px">${['선별평가·해석','지역자원 연계','학교 지원','기관 사례관리'].map(t=>`<span style="padding:10px 20px;border-radius:999px;background:#fff;border:1.5px solid #cfd8ee;font-size:22px;font-weight:700;color:#24366b">${t}</span>`).join('')}</div>
<span style="position:absolute;right:84px;bottom:84px;font-size:20px;color:#5c6b7d;font-weight:600">교사 · 사회복지사 · 교육복지사</span></body>`;
const icon=(svg,s)=>`<style>*{margin:0}html,body{width:${s}px;height:${s}px;background:transparent;overflow:hidden}svg{display:block;width:${s}px;height:${s}px}</style>${svg}`;
/* 홈 화면 아이콘은 iOS가 모서리를 직접 둥글리므로 꽉 찬 네모로 */
const fullLeaf=leaf(180,true).replace("viewBox=\"-6 -6 76 76\"","viewBox=\"-13 -9 90 90\"").replace('<g transform="rotate(-6 32 32)"><rect width="64" height="64" rx="20" fill="#3d70b0"/>','<rect x="-13" y="-9" width="90" height="90" fill="#3d70b0"/><g transform="rotate(-6 32 32)">');
const fullPencil=pencil.replace(/rx="31"/,'rx="0"');
(async()=>{const b=await chromium.launch();const page=await b.newPage();
 const shot=async(html,w,h,out,omit)=>{await page.setViewportSize({width:w,height:h});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(DOCS,out),omitBackground:!!omit});console.log('wrote',out);};
 await shot(homeOG,1200,630,'assets/og-home-20261116.png');
 await shot(youthOG,1200,630,'youth-risk/images/og-youth-20261116.png');
 fs.writeFileSync(path.join(DOCS,'assets/favicon.svg'),leaf(64)+'\n');
 await shot(icon(leaf(64),32),32,32,'assets/favicon-32.png',true);
 await shot(icon(fullLeaf,180),180,180,'assets/apple-touch-icon.png');
 await shot(icon(pencil,32),32,32,'youth-risk/images/favicon-32.png',true);
 await shot(icon(fullPencil,180),180,180,'youth-risk/images/apple-touch-icon.png');
 await b.close();})();
