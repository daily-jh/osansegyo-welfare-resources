const origin='https://daily-jh.github.io';
// 이용자 의견: report=오류·수정 요청(비공개, 관리자만 열람), review=사용 후기(승인한 글만 공개). 이름·연락처·IP는 저장하지 않는다.
const AREAS=['01 선별평가','02 지역자원 연계','03 학교 지원','04 기관 사례관리','05 최종 보고서','06 척도 자료실','전체·기타'];
const ROLES=['','교사','교육복지사·상담교사','사회복지사','행정복지센터','기타'];
// 학생을 알아볼 수 있는 정보는 받지 않는다(화면에서도 같은 규칙으로 먼저 막는다).
const PII=[[/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/,'휴대전화 번호'],[/[\w.+-]+@[\w-]+\.[\w.-]+/,'이메일 주소'],[/\d{6}[\s-]?[1-4]\d{6}/,'주민등록번호'],
 [/(학생|아동|아이|내담자|대상자)\s*(이름|성명)/,'학생 이름'],[/[가-힣]{2,12}(초등학교|중학교|고등학교)\s*[1-6]\s*학년\s*\d{1,2}\s*반/,'학교·학년·반']];
const DAY_LIMIT=5,TOTAL_DAY_LIMIT=300;
const piiFound=t=>PII.filter(([re])=>re.test(t)).map(([,n])=>n);
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function sameToken(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length||!b)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function feedback(request,env,url,reply,day){
 const path=url.pathname.replace(/\/+$/,'');
 if(path==='/feedback/reviews'&&request.method==='GET'){
  const rows=await env.DB.prepare("SELECT area,rating,role,body,day FROM feedback WHERE kind='review' AND status='approved' ORDER BY created DESC LIMIT 50").bind().all();
  return reply({reviews:rows.results||[]});
 }
 if(path==='/feedback'&&request.method==='POST'){
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
  const raw=await request.text();if(raw.length>4000)return reply({error:'Too large'},413);
  let b;try{b=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
  const keys=b&&typeof b==='object'?Object.keys(b).sort().join(','):'';
  if(!['area,body,kind,role','area,body,kind,rating,role'].includes(keys)||!['report','review'].includes(b.kind)||!AREAS.includes(b.area)||!ROLES.includes(b.role)||typeof b.body!=='string')return reply({error:'Invalid message'},400);
  const body=b.body.replace(/\r\n?/g,'\n').trim();if(body.length<5||body.length>1000)return reply({error:'Length'},400);
  let rating=null;if(b.kind==='review'){if(!Number.isInteger(b.rating)||b.rating<1||b.rating>5)return reply({error:'Rating'},400);rating=b.rating}else if('rating' in b)return reply({error:'Invalid message'},400);
  const found=piiFound(body);if(found.length)return reply({error:'Personal information',found},422);
  // 남용 방지: 하루 익명 키(IP+날짜+비밀값 해시)당 5건, 전체 하루 300건. 키는 이틀 뒤 지운다.
  const key=await sha((request.headers.get('CF-Connecting-IP')||'none')+'|'+day+'|'+(env.FEEDBACK_SALT||'oy'));
  await env.DB.prepare('DELETE FROM feedback_rate WHERE day<?').bind(day).run();
  const mine=await env.DB.prepare('SELECT count FROM feedback_rate WHERE key=?').bind(key).first();
  const total=await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE day=?').bind(day).first();
  if((mine?.count||0)>=DAY_LIMIT||(total?.n||0)>=TOTAL_DAY_LIMIT)return reply({error:'Too many'},429);
  await env.DB.prepare('INSERT INTO feedback_rate(key,day,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key,day).run();
  const id=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO feedback(id,kind,area,rating,role,body,status,day,created) VALUES(?,?,?,?,?,?,?,?,?)')
   .bind(id,b.kind,b.area,rating,b.role,body,b.kind==='review'?'pending':'new',day,new Date().toISOString()).run();
  return reply({ok:true,kind:b.kind},201);
 }
 if(path==='/feedback/admin'){
  if(!env.FEEDBACK_ADMIN_TOKEN)return reply({error:'Admin disabled'},503);
  const auth=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!sameToken(auth,env.FEEDBACK_ADMIN_TOKEN))return reply({error:'Unauthorized'},401);
  if(request.method==='GET'){
   const rows=await env.DB.prepare('SELECT id,kind,area,rating,role,body,status,day,created FROM feedback ORDER BY created DESC LIMIT 200').bind().all();
   return reply({items:rows.results||[]});
  }
  const raw=await request.text();let b;try{b=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
  const next={approve:'approved',hide:'hidden',done:'done',reopen:'new',pending:'pending'}[b?.action];
  if(!next||typeof b.id!=='string')return reply({error:'Invalid action'},400);
  const row=await env.DB.prepare('SELECT kind FROM feedback WHERE id=?').bind(b.id).first();if(!row)return reply({error:'Not found'},404);
  const allowed=row.kind==='review'?['approved','hidden','pending']:['done','new','hidden'];if(!allowed.includes(next))return reply({error:'Invalid action'},400);
  await env.DB.prepare('UPDATE feedback SET status=? WHERE id=?').bind(next,b.id).run();return reply({ok:true,status:next});
 }
 if(path==='/feedback/admin/delete'&&request.method==='POST'){
  if(!env.FEEDBACK_ADMIN_TOKEN)return reply({error:'Admin disabled'},503);
  if(!sameToken((request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,''),env.FEEDBACK_ADMIN_TOKEN))return reply({error:'Unauthorized'},401);
  let b;try{b=JSON.parse(await request.text())}catch{return reply({error:'Invalid JSON'},400)}
  if(typeof b?.id!=='string')return reply({error:'Invalid'},400);await env.DB.prepare('DELETE FROM feedback WHERE id=?').bind(b.id).run();return reply({ok:true});
 }
 return reply({error:'Not found'},404);
}
export default {async fetch(request,env){
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
if(request.headers.get('Origin')!==origin)return reply({error:'Forbidden'},403);
if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const url=new URL(request.url);
if(url.pathname.startsWith('/feedback')){try{return await feedback(request,env,url,reply,day)}catch{return reply({error:'Feedback unavailable'},503)}}
try {
if(request.method==='POST'){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
 const raw=await request.text();if(raw.length>200)return reply({error:'Too large'},413);
 let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid JSON'},400)}
 if(!body||Object.keys(body).sort().join(',')!=='event,id'||!['visit','assessment'].includes(body.event)||typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id))return reply({error:'Invalid event'},400);
 await env.DB.prepare('INSERT OR IGNORE INTO events(id,event,day) VALUES(?,?,?)').bind(body.id,body.event,day).run();
}
const row=await env.DB.prepare('SELECT COALESCE(SUM(visits),0) AS visitsTotal, COALESCE(SUM(assessments),0) AS assessmentsTotal, COALESCE(SUM(CASE WHEN day=? THEN visits ELSE 0 END),0) AS visitsToday, COALESCE(SUM(CASE WHEN day=? THEN assessments ELSE 0 END),0) AS assessmentsToday, MIN(day) AS since FROM daily').bind(day,day).first();
return reply({...row,day,since:row.since||day});
}catch{return reply({error:'Statistics unavailable'},503)}
}};
