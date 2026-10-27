/* OY-RALS 오프라인 열기(F7) — 한 번 연 화면과 파일을 이 브라우저에 보관해 인터넷이 끊겨도 평가·출력이 되게 한다.
   항상 네트워크를 먼저 쓰고(최신 배포 우선), 실패할 때만 보관본을 쓴다. 같은 사이트의 GET 파일만 보관하며
   학생 응답·서술은 화면 메모리에만 있으므로 여기에 들어오지 않는다. */
const CACHE='oy-rals-offline-v2';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('oy-rals-offline-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    /* 화면(HTML)은 브라우저 HTTP 캐시도 건너뛰고 서버에 다시 확인한다. 새 배포(예: 05 최종 보고서 메뉴)가 휴대폰에 바로 보이도록. */
    const live=req.mode==='navigate'?new Request(req.url,{cache:'no-cache',credentials:'same-origin'}):req;
    try{const res=await fetch(live);if(res&&res.ok&&res.type==='basic')cache.put(req,res.clone());return res;}
    catch(err){const hit=await cache.match(req)||await cache.match(req,{ignoreSearch:true});if(hit)return hit;throw err;}
  })());
});
