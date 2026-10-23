/* © 2026 김지훈. 청소년 사이트 복지자원 연결 팝업 */
(function(){
'use strict';
const dialog=document.getElementById('welfareResourceDialog');
const trigger=document.getElementById('openResourcePopup');
const closeButton=document.getElementById('closeResourcePopup');
const dismiss=document.getElementById('dismissResourcePopup');
const hideToday=document.getElementById('hideResourcePopupToday');
const visit=document.getElementById('resourcePopupVisit');
const KEY='oy-rals-welfare-popup-hide-date-v1';
if(!dialog||!trigger||!closeButton||!dismiss||!hideToday||!visit)return;
let previousFocus=null;
const today=()=>{const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')};
function isHiddenToday(){try{return window.localStorage.getItem(KEY)===today()}catch{return false}}
function open(fromTrigger=false){
 if(dialog.open)return;
 previousFocus=fromTrigger?document.activeElement:null;
 if(typeof dialog.showModal==='function')dialog.showModal();
 else dialog.setAttribute('open','');
 visit.focus({preventScroll:true});
}
function close(){
 if(dialog.open&&typeof dialog.close==='function')dialog.close();
 else dialog.removeAttribute('open');
}
trigger.addEventListener('click',()=>open(true));
closeButton.addEventListener('click',close);
dismiss.addEventListener('click',close);
hideToday.addEventListener('click',()=>{
 try{window.localStorage.setItem(KEY,today())}catch{/* 저장 차단 시 이번 닫기만 적용 */}
 close();
});
visit.addEventListener('click',()=>close());
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const bounds=dialog.getBoundingClientRect();
 if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)close();
});
dialog.addEventListener('close',()=>{
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
 previousFocus=null;
});
if(!isHiddenToday())open(false);
})();