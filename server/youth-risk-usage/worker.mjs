const origin='https://daily-jh.github.io';
export default {async fetch(request,env){
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
if(request.headers.get('Origin')!==origin)return reply({error:'Forbidden'},403);
if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
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
