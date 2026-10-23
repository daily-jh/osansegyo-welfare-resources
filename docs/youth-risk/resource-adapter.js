(function(root){'use strict';
// One authoritative directory for the main resource site and youth referrals.
function rows(data){if(!data||!Array.isArray(data.organizations))return [];
 return data.organizations.filter(o=>!['중단','폐지'].includes(o.status)).flatMap(o=>(o.services||[]).filter(s=>s.localAvailable!=='불가').map(s=>({
 '범주':o.level,'기관명':o.name,'기관유형':o.kind,'기관소개':o.summary,'홈페이지':o.site,'대표전화':o.phone||'',
 '근거URL':s.source||o.source,'서비스명':s.name,'지원분야':s.category,'지원대상':s.target,'주요내용':s.description,
 '신청·연계방법':s.method,'운영확인':s.operation,'최종검토일':s.editedOn||o.reviewed,
 contactDept:o.contact?.dept||'',orgId:o.id,serviceId:s.id,address:o.address||'',addressStatus:o.addressStatus||'미확인',addressSource:o.addressSource||'',
 addressCheckedOn:o.addressCheckedOn||'',addressNote:o.addressNote||'',contacts:(s.contacts||[]).map(c=>({...c})),
 directoryDate:data.date||'',directorySource:true
 })));}
const api={rows};if(typeof module!=='undefined')module.exports=api;else root.YouthResourceAdapter=api;
})(typeof window!=='undefined'?window:globalThis);
