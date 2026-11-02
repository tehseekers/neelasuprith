'use strict';
const $ = s => document.querySelector(s);
const config = window.WEDDING_CONFIG || {};
const connected = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') && !!config.supabaseAnonKey;
const wishesUrl = (config.wishesApiUrl || '').replace(/\/$/, '');
const d1Connected = /^https:\/\//.test(wishesUrl);
const wishesConnected = d1Connected || connected;
let studioKey = null;
async function wishesApi(path, options={}) {
 const response=await fetch(wishesUrl+path,{...options,headers:{'Content-Type':'application/json',...(studioKey?{Authorization:'Bearer '+studioKey}:{}),...options.headers}});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||'Unable to reach the guestbook. Please try again.');
 return data;
}
let token = null, currentPhoto = null;
let toastTimer;
function say(message) { $('#status').textContent = message; $('#status').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#status').classList.remove('visible'),6000); }
function element(tag,text,className) { const el=document.createElement(tag); if(text!==undefined)el.textContent=text; if(className)el.className=className;return el; }
async function api(path,options={}) {
 const response = await fetch(config.supabaseUrl+path,{...options,headers:{apikey:config.supabaseAnonKey,Authorization:'Bearer '+(token||config.supabaseAnonKey),'Content-Type':'application/json',...options.headers}});
 if(!response.ok) throw new Error('The request could not be completed. Please try again or check the site connection.');
 return response.status===204||response.headers.get('content-length')==='0'?null:await response.json();
}
function tick(){const remaining=new Date('2026-11-22T09:30:00+05:30')-Date.now();const box=$('#countdown');box.replaceChildren();if(remaining<=0){box.append(element('p','Our forever has begun. ♡'));return;}let seconds=Math.floor(remaining/1000);const values=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60];['Days','Hours','Minutes','Seconds'].forEach((label,i)=>{const d=element('div');d.append(element('strong',String(values[i]).padStart(2,'0')),element('span',label));box.append(d);});}tick();setInterval(tick,1000);
document.querySelectorAll('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#owner-open').onclick=()=>{$('#studio').showModal();};
$('#share').onclick=async e=>{e.preventDefault();const url=location.href.split('#')[0];try{if(navigator.share)await navigator.share({title:'Neela & Suprith',text:'Celebrate our beautiful beginning with us.',url});else{await navigator.clipboard.writeText(url);say('Invitation link copied.');}}catch(error){if(error.name!=='AbortError')say('Share this invitation by copying the address from your browser.');}};
function renderNote(note,target){const block=element('blockquote',note.message);block.append(element('cite','With love, '+note.name));target.append(block);}
async function loadWishes(){const notes=d1Connected ? await wishesApi('/wishes') : await api('/rest/v1/notes?photo_id=is.null&approved=eq.true&select=name,message&order=created_at.desc&limit=100');$('#wish-list').replaceChildren();notes.forEach(n=>renderNote(n,$('#wish-list')));$('#wish-state').textContent=notes.length ? 'Blessings from our favourite people. Showing the latest '+notes.length+'.' : 'Be the first to leave a blessing for our new beginning.';}
async function loadPhotos(){const photos=await api('/rest/v1/photos?select=id,path,caption&order=created_at.desc&limit=300');$('.new-memories-head').hidden=!photos.length;if(!photos.length)return;$('#gallery').replaceChildren();photos.forEach(photo=>{const card=element('button',undefined,'photo-card');const img=element('img');img.src=config.supabaseUrl+'/storage/v1/object/public/wedding-photos/'+photo.path;img.alt=photo.caption;img.loading='lazy';card.append(img,element('p',photo.caption+' ↗'));card.onclick=()=>openPhoto(photo,img.src);$('#gallery').append(card);});}
async function openPhoto(photo,url){$('#comment-form').hidden=false;currentPhoto=photo.id;$('#large-photo').src=url;$('#large-photo').alt=photo.caption;$('#photo-caption').textContent=photo.caption;$('#photo-comments').replaceChildren();$('#photo-dialog').showModal();try{const notes=await api('/rest/v1/notes?approved=eq.true&photo_id=eq.'+encodeURIComponent(photo.id)+'&select=name,message&order=created_at.asc&limit=100');notes.forEach(n=>renderNote(n,$('#photo-comments')));}catch(e){say(e.message);}}
async function submitNote(event,photoId){event.preventDefault();if(!(photoId ? connected : wishesConnected)){say('The guestbook is getting ready. Please come back to leave your blessing.');return;}const form=event.target,button=form.querySelector('button');button.disabled=true;const data=new FormData(form);if(data.get('website')){button.disabled=false;return;}if(!String(data.get('name')).trim()||!String(data.get('message')).trim()){say('Please add your name and a wish before sending.');button.disabled=false;return;}try{if(d1Connected && !photoId){await wishesApi('/wishes',{method:'POST',body:JSON.stringify({name:data.get('name'),message:data.get('message'),website:data.get('website')})});}else await api('/rest/v1/notes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({name:String(data.get('name')).trim(),message:String(data.get('message')).trim(),photo_id:photoId,approved:false})});form.reset();$('#message-count').textContent='0 / 1,500';say('Thank you! Your wish has been saved and is awaiting the couple’s review.');}catch(e){say(e.message);}finally{button.disabled=false;}}
$('#wish-form').onsubmit=e=>submitNote(e,null);$('#comment-form').onsubmit=e=>submitNote(e,currentPhoto);
$('#login').onsubmit=async e=>{e.preventDefault();if(d1Connected){const form=e.target;studioKey=new FormData(form).get('password');try{await loadModeration();form.reset();form.hidden=true;$('#owner-panel').hidden=false;$('#studio-note').textContent='Review wishes and save your keepsakes.';}catch(error){studioKey=null;say(error.message);}return;}if(!connected){say('The photo studio will open when the site’s storage is connected.');return;}const form=e.target,b=form.querySelector('button'),d=new FormData(form);b.disabled=true;try{const session=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:d.get('email'),password:d.get('password')})});token=session.access_token;const owner=await api('/rest/v1/owners?select=id&limit=1');if(!owner.length){token=null;throw new Error('This account does not have access to the couple’s studio.');}form.reset();form.hidden=true;$('#owner-panel').hidden=false;$('#studio-note').textContent='Add memories and review messages before they appear.';await loadModeration();}catch(e){say(e.message);}finally{b.disabled=false;}};
async function loadModeration(){const notes=d1Connected ? (await wishesApi('/admin/wishes')).filter(n=>!n.approved) : await api('/rest/v1/notes?approved=eq.false&select=id,name,message,photo_id&order=created_at.desc&limit=100');$('#moderation').replaceChildren();if(!notes.length)$('#moderation').append(element('p','All caught up. No messages awaiting review.'));notes.forEach(note=>{const article=element('article');article.append(element('small',note.photo_id?'Photo comment':'Wedding wish'),element('p',note.message),element('p','From '+note.name));for(const action of ['Approve','Delete']){const b=element('button',action,'text-button');b.onclick=async()=>{b.disabled=true;try{if(d1Connected){await wishesApi('/admin/wishes/'+note.id,{method:action==='Delete'?'DELETE':'PATCH'});}else await api('/rest/v1/notes?id=eq.'+note.id,{method:action==='Delete'?'DELETE':'PATCH',headers:{Prefer:'return=minimal'},...(action==='Approve'?{body:JSON.stringify({approved:true})}:{})});await loadModeration();await loadWishes();}catch(e){say(e.message);}finally{b.disabled=false;}};article.append(b);}$('#moderation').append(article);});}
$('#export-wishes').onclick=async e=>{const button=e.currentTarget;button.disabled=true;try{const notes=d1Connected ? (await wishesApi('/admin/wishes')).filter(n=>n.approved).reverse() : await api('/rest/v1/notes?photo_id=is.null&approved=eq.true&select=name,message,created_at&order=created_at.asc&limit=10000');const text=notes.length?notes.map(note=>`${note.name}\n${note.message}\n`).join('\n'):'No approved wishes yet.\n';const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=element('a');link.href=url;link.download='wishes.txt';link.click();URL.revokeObjectURL(url);say(`Downloaded ${notes.length} approved ${notes.length===1?'wish':'wishes'} as wishes.txt.`);}catch(error){say(error.message);}finally{button.disabled=false;}};
$('#upload').onsubmit=async e=>{e.preventDefault();const form=e.target,d=new FormData(form),file=d.get('photo'),b=form.querySelector('button');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){say('Choose a JPG, PNG or WebP photograph smaller than 10 MB.');return;}b.disabled=true;const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type],path=crypto.randomUUID()+'.'+ext;try{await api('/storage/v1/object/wedding-photos/'+path,{method:'POST',headers:{'Content-Type':file.type},body:file});try{await api('/rest/v1/photos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({path,caption:String(d.get('caption')).trim()})});}catch(error){await api('/storage/v1/object/wedding-photos',{method:'DELETE',body:JSON.stringify({prefixes:[path]})});throw error;}form.reset();await loadPhotos();say('Your photograph is now in the album.');}catch(error){say(error.message);}finally{b.disabled=false;}};
$('#logout').onclick=async()=>{studioKey=null;try{if(connected)await api('/auth/v1/logout',{method:'POST'});}catch{}token=null;$('#login').hidden=false;$('#owner-panel').hidden=true;$('#studio-note').textContent='Sign in to add photographs and review wishes.';};
if(wishesConnected){Promise.all([...(connected?[loadPhotos()]:[]),loadWishes()]).catch(()=>say('The album and guestbook are temporarily unavailable. Please visit again soon.'));}else{$('#wish-note').textContent='Our guestbook is getting ready. Come back soon to leave your blessing.';$('#wish-form button').disabled=true;$('#wish-form button').textContent='Guestbook opening soon';$('#studio-note').textContent='The photo studio is awaiting its storage connection. Setup instructions are included with the website.';$('#login button').disabled=true;}

// Supplied photographs remain available even before the shared album is connected.
document.querySelectorAll('[data-local-photo]').forEach(button=>{
 button.addEventListener('click',()=>{
  currentPhoto=null;
  $('#large-photo').src=button.dataset.localPhoto;
  $('#large-photo').alt=button.querySelector('img').alt;
  $('#photo-caption').textContent=button.dataset.caption;
  $('#photo-comments').replaceChildren(element('p','Leave a blessing for the couple in the guestbook below.','static-photo-note'));
  $('#comment-form').hidden=true;
  $('#photo-dialog').showModal();
 });
});

// Clear guestbook states, without pretending a local draft is a shared submission.
$('.new-memories-head').hidden = !$('#gallery').children.length;
$('#guest-message').addEventListener('input', event => {
 $('#message-count').textContent = event.target.value.length.toLocaleString() + ' / 1,500';
});
$('#refresh-wishes').disabled = !wishesConnected;
if (!wishesConnected) $('#wish-state').textContent = 'The guestbook will open once its database is connected.';
$('#refresh-wishes').onclick = async event => {
 const button=event.currentTarget; button.disabled=true;
 try { await loadWishes(); } catch { $('#wish-state').textContent='We could not load the wishes. Please try refreshing again.'; }
 finally { button.disabled=false; }
};

if(d1Connected){
 $('#owner-open').textContent='Couple’s guestbook studio ↗';
 $('#studio h2').textContent='Your guestbook studio';
 $('#studio-note').textContent='Enter your private studio access key to review wishes.';
 const email=$('#login input[name="email"]');email.required=false;email.closest('label').hidden=true;
 const password=$('#login input[name="password"]');password.parentElement.firstChild.textContent='Studio access key';password.autocomplete='off';
 $('#upload').hidden=true;
}
