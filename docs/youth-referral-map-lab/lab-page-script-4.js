
(function(){
const el=document.getElementById('map');if(!el||typeof map==='undefined')return;
const controls=document.createElement('div');controls.className='map-floating-tools';controls.innerHTML='<button type="button" id="map-reset" aria-label="오산 전체 지도 보기">오산 전체</button><button type="button" id="map-locate" aria-label="현재 위치로 지도 이동">내 위치</button>';el.style.position='relative';el.appendChild(controls);
document.getElementById('map-reset').addEventListener('click',()=>map.flyTo([37.1498,127.0772],12,{duration:.7}));
document.getElementById('map-locate').addEventListener('click',()=>{if(!navigator.geolocation){alert('위치 기능을 지원하지 않는 브라우저입니다.');return}navigator.geolocation.getCurrentPosition(p=>{const lat=p.coords.latitude,lng=p.coords.longitude;map.flyTo([lat,lng],15,{duration:.8});L.circle([lat,lng],{radius:Math.min(p.coords.accuracy||100,1000),color:'#2581ae',weight:2,fillOpacity:.08}).addTo(map)},()=>alert('위치 권한이 없거나 위치를 확인할 수 없습니다.'),{enableHighAccuracy:false,timeout:10000})});
map.zoomControl.setPosition('bottomright');map.options.scrollWheelZoom=false;map.scrollWheelZoom.disable();
const msg=document.createElement('p');msg.className='muted';msg.textContent='지도를 손가락으로 이동하거나 확대할 수 있습니다. 데스크톱에서는 +/− 버튼으로 확대하세요. 내 위치는 허용한 경우에만 브라우저에서 사용합니다.';el.insertAdjacentElement('afterend',msg);
setTimeout(()=>map.invalidateSize(),300);
})();
