
(function(){
const base='../contacts.csv';
function parseCSV(s){let out=[],r=[],v='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){v+='"';i++}else quoted=!quoted;}else if(c===','&&!quoted){r.push(v);v='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;r.push(v);if(r.length>1)out.push(r);r=[];v='';}else v+=c;}if(r.length||v){r.push(v);out.push(r);}const h=(out.shift()||[]).map(x=>x.replace(/^\uFEFF/,''));return out.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]||''])));}
function norm(s){return (s||'').replace(/[^0-9]/g,'');}
function safe(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));}
fetch(base).then(r=>r.ok?r.text():Promise.reject('연락처 파일 오류')).then(s=>{
 const contacts=parseCSV(s), byPhone=new Map();
 contacts.forEach(c=>{let k=norm(c.phone);if(k.length>=9&&c.address&&c.address_status!=='미확인'){if(!byPhone.has(k))byPhone.set(k,[]);byPhone.get(k).push(c);}});
 const panel=document.createElement('section');panel.innerHTML='<h2>검증 주소 연계</h2><p class="muted">기존 연락처 데이터의 전화번호가 정확히 일치하는 기관만 주소를 표시합니다. 좌표는 별도로 검증되지 않았으며, 지도 검색 결과를 확인해야 합니다.</p><div id="verified-addresses"></div>';
 document.querySelector('main').append(panel);
 function refresh(){if(typeof all==='undefined'||!Array.isArray(all))return;let q=document.getElementById('q')?.value?.toLowerCase()||'',cat=document.getElementById('category')?.value||'';let items=all.filter(x=>(!q||(x.name+' '+(x.services||[]).join(' ')).toLowerCase().includes(q))&&(!cat||x.fields?.has(cat)));let verified=items.map(x=>({x,match:byPhone.get(norm(x.phone))||[]})).filter(z=>z.match.length===1);document.getElementById('verified-addresses').innerHTML='<p>'+verified.length+'개 기관의 주소가 전화번호 기준으로 연결되었습니다.</p>'+verified.slice(0,80).map(({x,match})=>{let c=match[0];return '<div class="item"><b>'+safe(x.name)+'</b><p>'+safe(c.address)+'</p><small>주소 상태: '+safe(c.address_status)+' · 검토일: '+safe(c.address_checked_on)+'</small><p><a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/search?query='+encodeURIComponent(c.address)+'">주소로 지도 검색</a></p></div>'}).join('');}
document.getElementById('q').addEventListener('input',refresh);document.getElementById('category').addEventListener('change',refresh);setTimeout(refresh,900);window.addEventListener('load',refresh);
}).catch(e=>{let p=document.createElement('p');p.textContent='주소 데이터 연결 실패: '+e;document.querySelector('main').append(p)});
})();
