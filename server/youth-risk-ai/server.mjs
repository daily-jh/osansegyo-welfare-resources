import http from 'node:http';
import {readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const questionnaire=JSON.parse(readFileSync(new URL('./questionnaire.json',import.meta.url),'utf8'));
const items=questionnaire.flatMap(d=>d.items.map(text=>({domain:d.domain,text})));
const flagLabels=['현재 자해·자살 시도 또는 구체적 실행 계획·수단','학대·성폭력 의심','흉기·중대한 폭력·심각한 상해 위험','성착취·협박·실종으로 안전 확보 어려움'];
export const instructions=`청소년 지원을 위한 사례관리 사정 초안을 한국어 4~6문장, 약 250~450자로 작성한다. 2026 오산세교 사례관리의 당사자 중심·강점관점·해결중심, 사실/해석/확인사항 구분 원칙만 참고한다. 기관의 별도 16문항 위기도 점수나 사례유형을 적용하지 않는다.
문항 원문과 0~4점 응답을 해석하여 현재 어떤 어려움이 함께 나타나는지 1~2문장, 생활·학습·관계에 미칠 수 있는 영향 1~2문장, 우선 지원과 추가 확인 1~2문장으로 연결한다. 영역 이름·총점·문항 번호를 나열하는 보고서를 쓰지 않는다. 점수는 평가자의 응답이며 객관적으로 사실 확정된 상태가 아니다. 관계는 가능성으로 표현하고 원인·시간적 순서·진단·실제 가족 구성·경제 자격·합의 목표를 창작하지 않는다. 0점은 이번 응답에 어려움이 보고되지 않았다는 뜻이며 위험 부재의 증거가 아니다. 보호요인과 당사자가 원하는 변화는 미확인으로 구분하고 확인을 제안한다.
학대·방임·자해·성착취 신호는 점수가 낮아도 안전확인과 관련 신고·보호 절차가 우선임을 서술한다. 구체적인 자해 방법은 제시하지 않는다. 자동 신고·진단·기관 판정을 했다고 주장하지 않는다. 서비스 자격을 확정하지 않는다. 참고문헌·장황한 면책 문구·인사·마크다운 표 없이 짧고 읽기 쉬운 문단만 반환한다.`;

export function validatePayload(value){
  if(!value||Array.isArray(value)||typeof value!=='object')throw Error('invalid');
  const allowed=['version','answers','safetyFlags'];
  if(Object.keys(value).some(k=>!allowed.includes(k))||value.version!=='youth-risk-25-v1')throw Error('invalid');
  if(!Array.isArray(value.answers)||value.answers.length!==25||value.answers.some(v=>!Number.isInteger(v)||v<0||v>4))throw Error('invalid');
  if(!Array.isArray(value.safetyFlags)||value.safetyFlags.length!==4||value.safetyFlags.some(v=>typeof v!=='boolean'))throw Error('invalid');
  return {version:value.version,answers:[...value.answers],safetyFlags:[...value.safetyFlags]};
}

export function buildInput(payload){
  const data=validatePayload(payload);
  const safety=data.safetyFlags.flatMap((v,i)=>v?[flagLabels[i]]:[]);
  if(data.answers[0]>0||data.answers[1]>0)safety.push('아동학대·방임 의심 신호');
  if(data.answers[6]>0)safety.push('자해·죽음 관련 신호');
  if(data.answers[24]>0)safety.push('온라인 성착취·협박 노출 신호');
  return JSON.stringify({tool:'비표준화 25문항 TEST',scoreMeaning:'0 확인된 어려움 없음 / 1 경미·일시 / 2 반복·지원 필요 / 3 빈번·기능 저하 / 4 심한 기능 제한. 미검증 자체 기준.',total:data.answers.reduce((a,b)=>a+b,0),safetySignals:safety,items:items.map((q,i)=>({number:i+1,...q,score:data.answers[i]})),unknowns:['학생이 원하는 도움','강점·보호요인','응답의 관찰·진술 근거와 시간적 순서','현재 제공 중인 서비스·효과']});
}

export function providerRequest(provider,model,apiKey,input){
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(model))throw Error('configuration');
  if(provider==='openai')return {url:'https://api.openai.com/v1/responses',options:{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,instructions,input,max_output_tokens:1200,store:false})}};
  if(provider==='gemini')return {url:`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,options:{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{maxOutputTokens:1200}})}};
  throw Error('configuration');
}

export function extractAnalysis(provider,data){
  if(provider==='openai'&&(data.status==='incomplete'||data.error))throw Error('incomplete');
  if(provider==='gemini'&&data.candidates?.[0]?.finishReason!=='STOP')throw Error('incomplete');
  const text=provider==='openai'?(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n'):(data.candidates?.[0]?.content?.parts||[]).filter(x=>!x.thought).map(x=>x.text||'').join('\n');
  if(typeof text!=='string'||text.trim().length<10||text.length>5000)throw Error('invalid output');
  return text.trim();
}

export function createAnalysisServer(config,fetchImpl=fetch){
  const {provider,model,apiKey,accessToken,allowedOrigin}=config;
  if(!['openai','gemini'].includes(provider)||!model||!apiKey||!accessToken||accessToken.length<24||!allowedOrigin||new URL(allowedOrigin).origin!==allowedOrigin)throw Error('Missing or invalid server configuration');
  providerRequest(provider,model,apiKey,'');
  const recent=[];let inFlight=0;
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const origin=req.headers.origin;
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
    if(origin!==allowedOrigin)return send(403,{error:'origin_not_allowed'});
    res.setHeader('Access-Control-Allow-Origin',allowedOrigin);res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    if(req.url!=='/analyze')return send(404,{error:'not_found'});
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
    if(req.method!=='POST')return send(405,{error:'method_not_allowed'});
    const candidate=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,'')),expected=Buffer.from(accessToken);
    if(candidate.length!==expected.length||!timingSafeEqual(candidate,expected))return send(401,{error:'unauthorized'});
    if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'json_required'});
    const now=Date.now();while(recent.length&&recent[0]<now-60000)recent.shift();
    if(recent.length>=10||inFlight>=2)return send(429,{error:'rate_limited'});
    let raw='';
    try{
      for await(const part of req){raw+=part.toString('utf8');if(Buffer.byteLength(raw)>4096){send(413,{error:'too_large'});return}}
      let payload;try{payload=validatePayload(JSON.parse(raw))}catch{return send(400,{error:'invalid_assessment'})}
      recent.push(now);inFlight++;
      try{
        const request=providerRequest(provider,model,apiKey,buildInput(payload));
        const response=await fetchImpl(request.url,{...request.options,signal:AbortSignal.timeout(35000)});
        if(!response.ok)return send(502,{error:'provider_unavailable'});
        const result=await response.json();
        const draft=extractAnalysis(provider,result);
        send(200,{draft,analysis:draft,provider:provider==='openai'?'OpenAI GPT':'Google Gemini',model});
      }catch{return send(502,{error:'analysis_unavailable'})}finally{inFlight--}
    }catch{if(!res.headersSent)send(400,{error:'invalid_request'})}
    // Request bodies, credentials and provider output are deliberately not logged or persisted.
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createAnalysisServer({provider:process.env.AI_PROVIDER,model:process.env.AI_MODEL,apiKey:process.env.AI_API_KEY,accessToken:process.env.AI_ACCESS_TOKEN,allowedOrigin:process.env.ALLOWED_ORIGIN});
  server.requestTimeout=10000;server.headersTimeout=10000;
  server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('Youth risk AI backend listening. Configure HTTPS reverse proxy before public use.'));
}
