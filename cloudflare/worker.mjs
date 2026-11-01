const json = (body, status, headers) => Response.json(body, {status, headers});
export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
  const headers = {'Cache-Control':'no-store','Vary':'Origin'};
  if(origin && !allowed.includes(origin)) return json({error:'This website is not allowed.'},403,headers);
  if(origin) headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Methods']='GET, POST, PATCH, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers']='Content-Type, Authorization';
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  const url=new URL(request.url), path=url.pathname.replace(/\/$/,'');
  const admin=path.startsWith('/admin/');
  if(admin && (!env.ADMIN_TOKEN || request.headers.get('Authorization')!=='Bearer '+env.ADMIN_TOKEN)) return json({error:'Incorrect studio access key.'},401,headers);
  try {
   if(request.method==='GET' && (path==='/wishes'||path==='/admin/wishes')) {
    const {results}=await env.DB.prepare(admin ? 'SELECT id,name,message,approved,created_at FROM wishes ORDER BY created_at DESC LIMIT 10000' : 'SELECT name,message,created_at FROM wishes WHERE approved=1 ORDER BY created_at DESC LIMIT 100').all();
    return json(results,200,headers);
   }
   if(request.method==='POST' && path==='/wishes') {
    if(!request.headers.get('Content-Type')?.includes('application/json')) return json({error:'Expected JSON.'},415,headers);
    if(Number(request.headers.get('Content-Length')||0)>12000) return json({error:'Message too large.'},413,headers);
    // Read a bounded body, including requests without a Content-Length header.
    const reader=request.body?.getReader(); let size=0; const chunks=[];
    if(!reader) return json({error:'Please include a wish.'},400,headers);
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();return json({error:'Message too large.'},413,headers);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid JSON.'},400,headers);}
    if(!data || typeof data!=='object')return json({error:'Invalid wish.'},400,headers);
    if(data.website)return json({ok:true},201,headers);
    const name=typeof data.name==='string'?data.name.trim():'';
    const message=typeof data.message==='string'?data.message.trim():'';
    if(!name||name.length>80||!message||message.length>1500) return json({error:'Enter a name (1–80 characters) and wish (1–1,500 characters).'},400,headers);
    if(env.WISH_LIMITER){const {success}=await env.WISH_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!success)return json({error:'Please wait a minute before sending another wish.'},429,headers);}
    await env.DB.prepare('INSERT INTO wishes (id,name,message) VALUES (?,?,?)').bind(crypto.randomUUID(),name,message).run();
    return json({ok:true},201,headers);
   }
   const match=path.match(/^\/admin\/wishes\/([a-f0-9-]{36})$/);
   if(match && ['PATCH','DELETE'].includes(request.method)) {
    const result=await env.DB.prepare(request.method==='DELETE'?'DELETE FROM wishes WHERE id=?':'UPDATE wishes SET approved=1 WHERE id=?').bind(match[1]).run();
    return json({ok:true,changes:result.meta.changes},200,headers);
   }
   return json({error:'Not found.'},404,headers);
  } catch { return json({error:'The guestbook is temporarily unavailable. Please try again.'},503,headers); }
 }
};
