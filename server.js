// Small static server and optional key-safe OpenAI-compatible feedback proxy.
// Uses Node built-ins only: no dependency installation is required.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
function loadEnv() { try { for (const line of fs.readFileSync(path.join(__dirname,'.env'),'utf8').split(/\r?\n/)) { const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(m&&!process.env[m[1]]) process.env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2'); } } catch {} }
loadEnv();
const root=__dirname, mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const send=(res,status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff'});res.end(body)};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/status') return send(res,200,JSON.stringify({llmEnabled:Boolean(process.env.LLM_API_KEY)}));
 if(url.pathname==='/api/feedback'&&req.method==='POST'){
  if(!process.env.LLM_API_KEY)return send(res,503,JSON.stringify({error:'LLM is not configured. Rule-based suggestions are available.'}));
  let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>300000)req.destroy()});
  req.on('end',async()=>{try{
   const input=JSON.parse(raw);if(typeof input.resume!=='string'||typeof input.job!=='string'||input.resume.length>100000||input.job.length>100000)return send(res,400,JSON.stringify({error:'Invalid input.'}));
   const response=await fetch(process.env.LLM_API_URL||'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.LLM_API_KEY}`},body:JSON.stringify({model:process.env.LLM_MODEL||'gpt-4o-mini',temperature:.2,messages:[{role:'system',content:'You are a careful resume editor. Give concise, specific feedback grounded only in the provided resume and job description. Never add skills, experience, metrics, credentials, or achievements not explicitly supported by the resume. For rewrites, preserve factual meaning and use placeholders like [add a verified metric] rather than inventing details. Return JSON with keys overview (string), suggestions (array of strings), rewrites (array of objects with original and revised strings).'}, {role:'user',content:`RESUME:\n${input.resume}\n\nJOB DESCRIPTION:\n${input.job}\n\nMATCHED SKILLS: ${(input.matchedSkills||[]).join(', ')}\nMISSING SKILLS: ${(input.missingSkills||[]).join(', ')}`}],response_format:{type:'json_object'}})});
   const data=await response.json();if(!response.ok)return send(res,502,JSON.stringify({error:data.error?.message||'The AI provider returned an error.'}));const content=data.choices?.[0]?.message?.content;if(!content)return send(res,502,JSON.stringify({error:'The AI provider returned no feedback.'}));return send(res,200,JSON.stringify({feedback:JSON.parse(content)}));
  }catch(error){return send(res,502,JSON.stringify({error:error.message||'Could not reach the AI provider.'}))}});return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,JSON.stringify({error:'Method not allowed.'}));
 let target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 const publicFiles=new Set(['index.html','styles.css','resume-builder.css','app.js']);
 if(!target.startsWith(root+path.sep)||!publicFiles.has(path.basename(target)))return send(res,404,'Not found','text/plain; charset=utf-8');
 fs.readFile(target,(err,data)=>err?send(res,404,'Not found','text/plain; charset=utf-8'):send(res,200,data,mime[path.extname(target)]||'application/octet-stream'));
}).listen(Number(process.env.PORT||3000),()=>console.log(`SkillSync AI running at http://localhost:${process.env.PORT||3000}`));
