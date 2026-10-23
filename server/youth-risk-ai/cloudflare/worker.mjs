const ORIGIN='https://daily-jh.github.io';
const GROUPS=[
 ['아동학대·보호',2],['학교폭력·또래 안전',3],['자해·정서·정신건강',3],
 ['학습·출결',3],['행동·건강 안전',2],['장애·발달 및 접근성',2],
 ['가족·돌봄',3],['경제·주거',3],['관계·지지체계',2],['디지털·온라인 안전',2]
];
const ITEMS=[
 '학대·침해 의심 정황','필요한 보호·의료·위생 제공 부족',
 '또래 괴롭힘 피해','협박·강요·착취 피해','타인 안전을 해치는 행동',
 '정서적 고통으로 생활 어려움','자해·죽음 관련 안전확인 신호','수면·공황 유사 반응 등 기능 저하',
 '지각·결석·등교 회피','기초학습·과제의 어려움','학교 소속감 저하',
 '충동적 위험 행동','건강·안전을 해치는 행동',
 '교육환경 접근성 제한','보조기기·지원서비스 이용 제한',
 '보호자 돌봄 공백','가족 갈등이 학교생활에 미치는 영향','학생의 가족 돌봄 부담',
 '필수 생활자원 부족','불안정하거나 안전하지 않은 주거','비용 부담으로 서비스 미이용',
 '또래·교내외 활동 참여 어려움','신뢰할 도움 제공자 부족',
 '디지털 이용 조절로 기능 저하','온라인 성착취·협박 노출 신호'
];
function reply(data,status=200){
 return new Response(JSON.stringify(data),{
  status,headers:{
   'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'no-store','Access-Control-Allow-Origin':ORIGIN,
   'Vary':'Origin','X-Content-Type-Options':'nosniff'
  }
 });
}
function valid(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['version','answers','role','safety'].includes(k)))return false;
 if(x.version!=='youth-risk-25-v1'||!['teacher','social-worker'].includes(x.role))return false;
 if(!Array.isArray(x.answers)||x.answers.length!==25||x.answers.some(v=>v!=='unknown'&&(!Number.isInteger(v)||v<0||v>4)))return false;
 const f=x.safety;
 if(!f||Array.isArray(f)||typeof f!=='object'||Object.keys(f).some(k=>!['explicit','followups'].includes(k))||typeof f.explicit!=='boolean')return false;
 if(!f.followups||Array.isArray(f.followups)||typeof f.followups!=='object')return false;
 return Object.entries(f.followups).every(([k,v])=>['4','5','12','13'].includes(k)&&['yes','no','unknown'].includes(v));
}
function packageForModel(x){
 let offset=0;const areas=GROUPS.map(([domain,size])=>{const entries=x.answers.slice(offset,offset+size).map((score,i)=>({number:offset+i+1,item:ITEMS[offset+i],score}));offset+=size;return {domain,items:entries}});
 const known=x.answers.filter(v=>typeof v==='number'),unknown=x.answers.map((v,i)=>v==='unknown'?i+1:null).filter(Boolean);
 const safety=[1,2,7,25].filter(n=>x.answers[n-1]>0);
 const followupPending=[4,5,12,13].filter(n=>x.answers[n-1]>=(n===4?1:3)&&(!x.safety.followups[n]||x.safety.followups[n]==='unknown'));
 const urgent=x.safety.explicit||safety.length>0||Object.values(x.safety.followups).includes('yes');
 return {role:x.role==='teacher'?'교사':'사회복지사',knownTotal:known.reduce((a,b)=>a+b,0),totalStatus:unknown.length?'미상 포함: 최종 100점 총점·지원단계 보류':'25문항 전체 확인',unknownItems:unknown,safetySignalNumbers:safety,urgent,followupPending,followups:x.safety.followups,areas};
}
const SYSTEM=`한국의 학교/종합사회복지관 실무자를 위한 청소년 통합지원 사례검토·서비스계획서 참고 초안을 한국어로 작성한다.
평가점수는 실무자의 응답이며 확정 사실·진단·학대 인정·위기도 등급으로 취급하지 않는다. 보호·안전은 점수와 무관하게 우선한다.
제공되는 안전 신호를 완화하거나 자체 점수·판정을 수정하지 않는다. 미상은 0점으로 처리하거나 100점으로 환산하지 않으며, 미상 포함 시 전체 판정 보류를 명시한다.
문항 점수만으로 가족구성, 질병, 수급자격, 기관 접수·서비스 제공, 보호요인·강점·합의 목표를 창작하지 않는다. 0점은 이번 응답에서 어려움이 보고되지 않음을 뜻한다.
아래 형식으로 작성하되 본문에 전체 문항표는 나열하지 않는다.
# 청소년 통합지원 사례검토·서비스계획서(안)
## 우선 확인: 안전확인·핵심 어려움 3가지·첫 행동·우선 담당
## 1. 종합사정: 보고된 응답 / 영향에 관한 해석 / 아직 미확인 사항
## 2. 사례판정 및 접근모델: 강점관점/해결중심 중 적용 이유, 필요한 협의
## 3. 단기·중기·장기 계획: 목표, 행동, 담당 역할, 확인 시점, 5점 척도 또는 이행률 점검방법
## 4. 우선 자원연계: 오산 청소년상담복지센터, Wee클래스·센터, 동 행정복지센터, 오산세교종합사회복지관 등에서 관련 후보 3곳 이내. 현재 서비스·접수 여부는 별도 확인.
## 5. 첫 면담·회의 결정사항
반드시 실제 학생·보호자·기관과의 확인·합의를 거치는 검토용 초안임을 끝에 표시한다.
원자료를 기반으로 개입 초안을 제안할 뿐 신고·보호 절차는 지연하지 않는다.`;
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/analyze')return reply({error:'not_found'},404);
  if(request.headers.get('Origin')!==ORIGIN)return reply({error:'origin_forbidden'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Authorization, Content-Type',
   'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'300','Vary':'Origin'}});
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  if(!env.AI||!env.AI_ACCESS_TOKEN||env.AI_ACCESS_TOKEN.length<32||!env.AI_RATE_LIMIT)return reply({error:'not_configured'},503);
  const token=request.headers.get('Authorization')||'';
  if(!token.startsWith('Bearer ')||token.slice(7)!==env.AI_ACCESS_TOKEN)return reply({error:'unauthorized'},401);
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return reply({error:'json_required'},415);
  const limit=await env.AI_RATE_LIMIT.limit({key:'institution-ai'});
  if(!limit.success)return reply({error:'rate_limited'},429);
  if(Number(request.headers.get('content-length')||0)>2400)return reply({error:'too_large'},413);
  let source;try{const body=await request.text();if(body.length>2400)return reply({error:'too_large'},413);source=JSON.parse(body)}catch{return reply({error:'invalid_json'},400)}
  if(!valid(source))return reply({error:'invalid_assessment'},400);
  try{
   const input=packageForModel(source);
   const result=await env.AI.run(env.AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fast',{
     messages:[{role:'system',content:SYSTEM},{role:'user',content:JSON.stringify(input)}],
     max_tokens:1600,temperature:0.2
   });
   const output=typeof result?.response==='string'?result.response:'';
   if(output.length<40||output.length>9000)return reply({error:'invalid_ai_output'},502);
   return reply({draft:output,provider:'Cloudflare Workers AI',verified:false});
  }catch{return reply({error:'ai_unavailable'},502)}
 }
};
// 주의: 전송 내용·결과를 코드에서 기록하지 않습니다. Cloudflare/모델 공급자의 로그·보관정책은 별도 확인해야 합니다.
