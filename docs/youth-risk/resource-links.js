(function(root){'use strict';
var records={
'오산시정신건강복지센터':{home:'https://www.osmh.or.kr/',source:'https://www.gg.go.kr/contents/contents.do?ciIdx=987045&menuId=265962',note:'경기도 공식 기관목록 대조 · 자동 열람 제한',phone:'031-374-8680'},
'오산시청소년상담복지센터':{home:'https://www.osan1318.or.kr/',service:'https://www.osan1318.or.kr/1318/counseling/request.do?mId=0305000000',serviceLabel:'센터 상담신청 안내',fallback:'https://litt.ly/osan',source:'https://litt.ly/osan',note:'센터 안내 페이지의 홈페이지·상담 링크 대조 · 직접 열람 제한',phone:'031-372-4004'},
'오산시아동보호전문기관':{home:'https://osan.gcps.or.kr/',service:'https://osan.gcps.or.kr/gnosan/html/cd103101100/default',serviceLabel:'기관 사업 안내',source:'https://osan.gcps.or.kr/gnosan/html/cd103101100/default',note:'기관 홈페이지·사업 안내 확인',phone:'031-8077-9610'},
'오산시가족센터':{home:'https://osan.familynet.or.kr/center/index.do',service:'https://osan.familynet.or.kr/center/lay1/program/S295T322C451/recruitReceipt/list.do',serviceLabel:'센터 프로그램·신청 안내',source:'https://osan.familynet.or.kr/center/index.do',note:'센터 홈페이지·프로그램 목록 확인',phone:'031-372-1335'},
'오산시장애인종합복지관':{home:'https://www.osrc.or.kr/',service:'https://www.osrc.or.kr/business01',serviceLabel:'아동청소년 사업 안내',source:'https://www.osrc.or.kr/business01',note:'기관 아동청소년 사업 안내 확인',phone:'031-290-8560'},
'경기도교육청 Wee 프로젝트':{home:'https://www.goehs.kr/goehs/cm/cntnts/cntntsView.do?cntntsId=2147&mi=18023',service:'https://www.goehs.kr/goehs/cm/cntnts/cntntsView.do?cntntsId=2147&mi=18023',serviceLabel:'화성오산 Wee센터 이용 안내',source:'https://www.goehs.kr/goehs/cm/cntnts/cntntsView.do?cntntsId=2147&mi=18023',note:'교육지원청 Wee센터 안내 확인'}
};
function safe(t){try{var u=new URL(String(t||''));return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}}
function resolve(row){var r=records[row['기관명']],home=safe(r?r.home:row['홈페이지']||row['근거URL']);return {home,primary:safe(r&&r.service)||home,service:r&&r.service?safe(r.service):'',label:r&&r.serviceLabel||'등록 기관·공공 안내',fallback:safe(r&&r.fallback),source:safe(r&&r.source||row['근거URL']),date:r?'2026-10-22':row['최종검토일']||'미기재',note:r?r.note:'기존 자원 DB 주소 · 세부 사업·운영 확인 필요',phone:row.directorySource?row['대표전화']||'':row['대표전화']||r&&r.phone||'',address:row.address||'',addressStatus:row.addressStatus||'미확인',addressCheckedOn:row.addressCheckedOn||'',addressNote:row.addressNote||'',contacts:row.contacts||[]}}
function contactText(row){var x=resolve(row);return ['대표전화: '+(x.phone||'직통전화 확인 필요'),'주소: '+(x.address||'주소 확인 필요'),x.address?('주소 기준: '+x.addressStatus+(x.addressCheckedOn?' · '+x.addressCheckedOn:'')):'',x.addressNote,...x.contacts.filter(c=>c.phone).map(c=>(c.dept||'사업 문의')+': '+c.phone)].filter(Boolean).join(' / ')}
var api={resolve,safe,contactText};if(typeof module!=='undefined')module.exports=api;else root.YouthLinks=api;
})(typeof window!=='undefined'?window:globalThis);
