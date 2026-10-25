
/* V3: explicit user-triggered address geocoding; no background bulk geocoding */
(function(){
const panel=document.createElement('section');
panel.innerHTML='<h2>주소 기반 지도 마커 (시범)</h2><p class="muted">주소 검색은 사용자가 선택한 기관 1건만 OpenStreetMap Nominatim에 요청합니다. 좌표는 검색 결과이며 공식 위치 인증이 아닙니다. 검색 실패 시 마커를 생성하지 않습니다.</p><label for="geo-address">기관 주소</label><input id="geo-address" placeholder="검증된 주소 목록에서 주소를 복사해 입력"><button id="geo-search">선택 주소 지도 표시</button><p id="geo-status" aria-live="polite"></p>';
document.querySelector('main').append(panel);
const btn=document.getElementById('geo-search'),status=document.getElementById('geo-status');
btn.addEventListener('click',async()=>{
const address=document.getElementById('geo-address').value.trim();if(address.length<8){status.textContent='정확한 도로명 주소를 입력해 주세요.';return}
btn.disabled=true;status.textContent='주소 검색 중입니다.';
try{const u=new URL('https://nominatim.openstreetmap.org/search');u.searchParams.set('q',address);u.searchParams.set('format','jsonv2');u.searchParams.set('limit','1');u.searchParams.set('countrycodes','kr');
const res=await fetch(u.toString(),{headers:{Accept:'application/json'}});if(!res.ok)throw Error('지오코딩 서비스 응답 오류');const data=await res.json();if(!data.length)throw Error('주소 검색 결과 없음');const p=data[0],lat=Number(p.lat),lon=Number(p.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error('좌표 오류');
if(typeof map==='undefined'||typeof pins==='undefined')throw Error('지도 준비 중');
pins.clearLayers();L.marker([lat,lon]).addTo(pins).bindPopup(document.createTextNode(address)).openPopup();map.setView([lat,lon],16);status.textContent='검색 좌표를 표시했습니다. 실제 기관 위치와 일치하는지 확인해 주세요.';
}catch(e){status.textContent='마커를 표시하지 않았습니다: '+e.message}finally{btn.disabled=false}
});
document.addEventListener('click',e=>{const a=e.target.closest('#verified-addresses a');if(!a)return;const item=a.closest('.item');const p=item?.querySelector('p');if(p)document.getElementById('geo-address').value=p.textContent.trim();});
})();
