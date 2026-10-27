'use strict';
/* OY-RALS 메인 화면 CSS 묶음 만들기. docs/youth-risk/oy-css-manifest.json의 순서대로 원본을 이어 붙여
   oy-bundle-v13.css 한 파일을 만든다. 캐스케이드 순서는 원래 <link> 순서와 같다. --check는 묶음이 원본과 같은지만 본다. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const DIR=path.join(__dirname,'../docs/youth-risk');
const M=JSON.parse(fs.readFileSync(path.join(DIR,'oy-css-manifest.json'),'utf8'));
function build(){
  const parts=M.sources.map(f=>{const t=fs.readFileSync(path.join(DIR,f),'utf8');if(/@import|@charset/.test(t))throw Error(f+': @import/@charset는 묶음 중간에 둘 수 없습니다');return '/* ==== '+f+' ==== */\n'+t.replace(/\s+$/,'')+'\n';});
  const body=parts.join('\n');
  const hash=crypto.createHash('sha256').update(body).digest('hex').slice(0,12);
  return '/* OY-RALS 메인 화면 CSS 묶음 v13 · 원본 '+M.sources.length+'개 · sha '+hash+' · 직접 고치지 말고 원본을 고친 뒤 node scripts/build-youth-css.cjs */\n'+body;
}
const out=path.join(DIR,M.output),next=build();
if(process.argv.includes('--check')){const cur=fs.existsSync(out)?fs.readFileSync(out,'utf8'):'';if(cur!==next){console.error('oy-bundle-v13.css가 원본과 다릅니다. node scripts/build-youth-css.cjs 를 실행하세요.');process.exit(1);}console.log('css bundle in sync',M.sources.length);}
else{fs.writeFileSync(out,next);console.log('wrote',M.output,next.length,'bytes from',M.sources.length,'files');}
