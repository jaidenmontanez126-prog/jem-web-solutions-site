(async () => {
'use strict';
const es = document.documentElement.lang === 'es';
const t = (en, sp) => es ? sp : en;
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = 'jem-design-studio-v1';
const presets = {
 cinematic: {name:t('Cinematic / Luxury','Cinemático / Lujo'),accent:'#e5b978',background:'#151817',image:'assets/luxury/residence.jpg'},
 editorial: {name:t('Editorial / Elegant','Editorial / Elegante'),accent:'#a34932',background:'#f5eee2',image:'assets/luxury/fashion.jpg'},
 bold: {name:t('Bold / Playful','Audaz / Divertido'),accent:'#ccff00',background:'#22184b',image:'assets/luxury/automotive.jpg'},
 minimal: {name:t('Minimal / Clean','Minimalista / Limpio'),accent:'#315eaa',background:'#f5f7fa',image:'assets/workspace.jpg'}
};
const sectionNames = {services:t('Services','Servicios'),gallery:t('Gallery','Galería'),testimonials:t('Testimonials','Testimonios'),contact:t('Contact','Contacto')};
const defaults = {version:1,layout:'cinematic',brand:t('Your extraordinary brand','Tu marca extraordinaria'),heading:t('Anything but ordinary.','Algo extraordinario.'),description:t('A different perspective. An experience worth remembering. This is your next chapter.','Una perspectiva diferente. Una experiencia inolvidable. Este es tu próximo capítulo.'),cta:t('Explore the possibilities','Explora las posibilidades'),font:'serif',accent:'#e5b978',background:'#151817',image:'assets/luxury/residence.jpg',logo:'',sections:['services','gallery','contact'],order:Object.keys(sectionNames),serviceText:t('Thoughtful design\nPersonal service\nExceptional details','Diseño con intención\nServicio personalizado\nDetalles excepcionales'),testimonial:t('“An experience we will always remember.” — Sample client','“Una experiencia que siempre recordaremos.” — Cliente de ejemplo')};
let design = structuredClone(defaults), saveFailed = false, reviewMode = false;
function validate(raw) {
 if (!raw || raw.version !== 1 || !Object.prototype.hasOwnProperty.call(presets,raw.layout)) throw Error('Invalid design');
 const next = structuredClone(defaults);
 for (const field of ['brand','heading','description','cta','serviceText','testimonial']) if(typeof raw[field]==='string') next[field]=raw[field].slice(0,2000);
 for (const field of ['accent','background']) if(/^#[0-9a-f]{6}$/i.test(raw[field])) next[field]=raw[field];
 if(['serif','sans-serif','monospace'].includes(raw.font)) next.font=raw.font;
 for(const field of ['image','logo']) if(typeof raw[field]==='string' && raw[field].length<360000 && (raw[field]==='' || Object.values(presets).some(p=>p.image===raw[field]) || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(raw[field]))) next[field]=raw[field];
 if(!next.image) next.image=presets[raw.layout].image;
 next.layout=raw.layout;
 if(Array.isArray(raw.sections)) next.sections=[...new Set(raw.sections.filter(s=>Object.prototype.hasOwnProperty.call(sectionNames,s)))];
 if(Array.isArray(raw.order) && raw.order.length===4 && new Set(raw.order).size===4 && raw.order.every(s=>Object.prototype.hasOwnProperty.call(sectionNames,s))) next.order=raw.order;
 return next;
}
try { const saved=localStorage.getItem(key); if(saved) design=validate(JSON.parse(saved)); } catch {}
// Keep reading older design links as well as complete stored submissions.
function decodeDesign(value) {
 if(value.length>40000) throw Error('Design link too long');
 const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
 return validate(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)))));
}
let linkError=false;
if(location.hash.startsWith('#design=')) {
 try { design=decodeDesign(location.hash.slice(8)); reviewMode=true; } catch { linkError=true; }
}
const main=$('main');
if(location.hash.startsWith('#submission=')) {
 const id=location.hash.slice(12);
 main.innerHTML='<p class="studio-status" role="status">'+t('Opening your complete design…','Abriendo tu diseño completo…')+'</p>';
 try {
  if(!/^[a-f0-9]{64}$/.test(id))throw Error('Invalid link');
  const response=await fetch('/.netlify/functions/load-design?id='+id,{cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Design unavailable');
  const result=await response.json();
  design=validate(result.design);reviewMode=true;
 } catch {
  main.innerHTML=`<h1>${t('Design unavailable.','Diseño no disponible.')}</h1><p class="studio-status" role="alert">${t('We could not open this design. Check the link or try again in a moment.','No pudimos abrir este diseño. Revisa el enlace o intenta de nuevo en un momento.')}</p><button type="button" id="retry-design" class="btn">${t('Try again','Intentar de nuevo')}</button>`;
  $('retry-design').addEventListener('click',()=>location.reload());
  return;
 }
}
let cachedHandoff, pendingUploads=0;
async function handoff(snapshot, honeypot) {
 const signature=JSON.stringify(snapshot);
 if(cachedHandoff?.signature===signature)return cachedHandoff;
 const response=await fetch('/.netlify/functions/save-design',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({design:snapshot,website:honeypot}),signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw Error(response.status===429?'RATE_LIMIT':'STORAGE_UNAVAILABLE');
 const result=await response.json();
 if(!/^[a-f0-9]{64}$/.test(result.id || ''))throw Error('STORAGE_UNAVAILABLE');
 const url=new URL(es?'spanish-studio.html':'design-studio.html',location.href);
 url.hash='submission='+result.id;
 cachedHandoff={signature,url:url.href};
 return cachedHandoff;
}
main.innerHTML=`<div class="studio-heading"><div><p class="section-label">JEM / ${t('THE DESIGN STUDIO','ESTUDIO DE DISEÑO')}</p><h1>${t('Make it yours.','Hazlo tuyo.')}</h1><p>${t('Turn “I have an idea” into something you can see. Choose a direction, change the details, and send me your vision.','Convierte tu idea en algo que puedes ver. Elige un estilo, cambia los detalles y envíame tu visión.')}</p></div><span class="studio-tag">✦ ${t('Your idea starts here','Tu idea empieza aquí')}</span></div><div class="studio-layout"><aside class="studio-controls" aria-label="${t('Design controls','Controles de diseño')}"><details open><summary>01 / ${t('Choose your direction','Elige tu estilo')}</summary><label>${t('Layout','Diseño')}<select id="layout">${Object.entries(presets).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('')}</select></label><label>${t('Accent color','Color de acento')}<input id="accent" type="color"></label><label>${t('Background','Fondo')}<input id="background" type="color"></label><label>${t('Typography','Tipografía')}<select id="font"><option value="serif">${t('Classic serif','Serif clásica')}</option><option value="sans-serif">${t('Modern sans','Sans moderna')}</option><option value="monospace">${t('Creative mono','Mono creativa')}</option></select></label></details><details open><summary>02 / ${t('Tell your story','Cuenta tu historia')}</summary>${[['brand',t('Business name','Nombre del negocio')],['heading',t('Main headline','Título principal')],['description',t('Introduction','Introducción')],['cta',t('Button text','Texto del botón')]].map(([id,label])=>`<label>${label}${id==='description'?`<textarea id="${id}" maxlength="2000"></textarea>`:`<input id="${id}" maxlength="160">`}</label>`).join('')}<label>${t('Hero photo','Foto principal')}<input id="photo-upload" type="file" accept="image/*,.heic,.heif,.hif" aria-describedby="photo-upload-status"></label><p class="upload-status" id="photo-upload-status" role="status" aria-live="polite"></p><label>${t('Your logo','Tu logo')}<input id="logo-upload" type="file" accept="image/*,.heic,.heif,.hif" aria-describedby="logo-upload-status"></label><p class="upload-status" id="logo-upload-status" role="status" aria-live="polite"></p><p class="studio-caption">${t('Photos, screenshots, and logos up to 20 MB. Supports JPG, PNG, WebP, GIF, SVG, AVIF, BMP, and iPhone HEIC/HEIF photos. Images are converted and resized automatically; animated images use a still frame.','Fotos, capturas y logos de hasta 20 MB. Admite JPG, PNG, WebP, GIF, SVG, AVIF, BMP y fotos HEIC/HEIF de iPhone. Conversión y tamaño automáticos; las imágenes animadas usan un fotograma.')}</p><button id="clear-images" type="button">${t('Restore sample images','Restaurar imágenes de muestra')}</button></details><details><summary>03 / ${t('Build your page','Construye tu página')}</summary><p class="studio-caption">${t('Select sections. Use arrows to change their order.','Selecciona secciones. Usa las flechas para cambiar su orden.')}</p><div id="section-options"></div><label>${t('Services (one per line)','Servicios (uno por línea)')}<textarea id="serviceText" maxlength="2000"></textarea></label><label>${t('Testimonial / sample text','Testimonio / texto de muestra')}<textarea id="testimonial" maxlength="2000"></textarea></label></details><div class="studio-save"><button id="download" type="button">${t('↓ Save file','↓ Guardar archivo')}</button><button id="import" type="button">${t('Open file','Abrir archivo')}</button><input id="import-file" type="file" accept=".json,application/json" hidden><button id="reset" type="button">${t('Start over','Empezar de nuevo')}</button><p class="save-status" id="save-status" role="status"></p></div></aside><div class="studio-preview"><div class="studio-toolbar"><span>${t('LIVE PREVIEW','VISTA EN VIVO')}</span><div><button id="desktop" type="button" aria-pressed="true">${t('Desktop','Escritorio')}</button> <button id="phone" type="button" aria-pressed="false">${t('Phone','Teléfono')}</button></div></div><div class="studio-canvas" id="canvas"><iframe id="preview" title="${t('Your website concept','Tu concepto de sitio web')}" sandbox=""></iframe></div><p class="studio-caption">${t('Concept preview only. Buttons and sample content illustrate your idea; this is not a published website or a booking system.','Vista conceptual. Los botones y el contenido de muestra ilustran tu idea; no es un sitio publicado ni un sistema de reservas.')}</p><form id="studio-send" class="studio-send" action="https://formspree.io/f/mrerznbo" method="POST"><p class="section-label">${t('LOVE THE DIRECTION?','¿TE GUSTA LA IDEA?')}</p><h2>${t('Let’s bring it to life.','Démosle vida.')}</h2><p>${t('Send your complete design, including your preview photos and logo, in one step. JEM receives your project brief and a review link. Anyone with that link can view the design. We’ll discuss scope and a quote before work begins.','Envía tu diseño completo, incluidas tus fotos de vista previa y logo, en un solo paso. JEM recibe tu resumen y un enlace de revisión. Cualquier persona con ese enlace puede ver el diseño. Hablaremos del alcance y presupuesto antes de comenzar.')}</p><label class="studio-trap" aria-hidden="true">Leave this field empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label><div class="send-grid"><label>${t('Your name','Tu nombre')}<input name="name" autocomplete="name" required maxlength="160"></label><label>${t('Your email','Tu correo')}<input name="email" type="email" autocomplete="email" required maxlength="254"></label></div><label>${t('Anything else? Timeline, budget, or ideas.','¿Algo más? Plazo, presupuesto o ideas.')}<textarea name="project" maxlength="5000"></textarea></label><button type="submit" class="btn">${t('Send my design to JEM ↗','Enviar mi diseño a JEM ↗')}</button><p class="studio-status" id="send-status" role="status" aria-live="polite"></p></form></div></div>`;
function sectionsUI(){
 $('section-options').innerHTML=design.order.map((s,i)=>`<div class="section-choice"><label><input type="checkbox" data-section="${s}" ${design.sections.includes(s)?'checked':''}>${sectionNames[s]}</label><button type="button" data-move="${s}" data-delta="-1" aria-label="${t('Move up','Subir')} ${sectionNames[s]}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="${s}" data-delta="1" aria-label="${t('Move down','Bajar')} ${sectionNames[s]}" ${i===3?'disabled':''}>↓</button></div>`).join('');
}
function sync(){for(const field of ['layout','accent','background','font','brand','heading','description','cta','serviceText','testimonial']) $(field).value=design[field];sectionsUI();render();}
function contrast(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#151719':'#ffffff';}
function render(){
 const d=design, fg=contrast(d.background), ac=contrast(d.accent), img=escape(d.image), brand=escape(d.brand);
 const blocks={services:`<section id="services"><small>01 / ${sectionNames.services}</small><h2>${t('Made around you.','Hecho para ti.')}</h2><div class="cards">${d.serviceText.split('\n').filter(Boolean).map((s,i)=>`<article><span>0${i+1}</span><h3>${escape(s)}</h3></article>`).join('')}</div></section>`,gallery:`<section id="gallery"><small>02 / ${sectionNames.gallery}</small><h2>${t('A closer look.','Una mirada más cercana.')}</h2><div class="gallery">${[d.image,presets.editorial.image,presets.minimal.image].map(src=>`<img src="${escape(src)}" alt="${t('Concept gallery image','Imagen conceptual de galería')}" loading="lazy">`).join('')}</div></section>`,testimonials:`<section id="testimonials"><small>${t('SAMPLE TESTIMONIAL','TESTIMONIO DE MUESTRA')}</small><blockquote>${escape(d.testimonial)}</blockquote></section>`,contact:`<section id="contact" class="end"><small>${sectionNames.contact}</small><h2>${t('Something great starts here.','Algo increíble empieza aquí.')}</h2><p>${t('Contact details will go here on your finished website.','Aquí irán los datos de contacto en tu sitio final.')}</p><span class="button">${escape(d.cta)}</span></section>`};
 $('preview').srcdoc=`<!DOCTYPE html><html lang="${es?'es':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:${d.background};color:${fg};font:15px/1.6 ${d.font};overflow-wrap:anywhere}nav{padding:24px 5%;display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid ${fg}33;font:12px sans-serif}nav a{color:inherit}nav img{max-width:100px;max-height:42px;object-fit:contain}a{text-decoration:none}small{font:10px sans-serif;letter-spacing:.16em;text-transform:uppercase}h1{font-size:clamp(45px,7vw,100px);line-height:1;letter-spacing:-.055em;margin:24px 0}h2{font-size:clamp(30px,4vw,54px);line-height:1.1}h3{font-size:22px;font-weight:400}.hero{padding:70px 6%;min-height:570px;display:grid;grid-template-columns:1.1fr 1fr;gap:35px;align-items:center}.hero img{width:100%;height:420px;object-fit:cover}.hero p{max-width:430px;opacity:.8}.button{display:inline-block;background:${d.accent};color:${ac};padding:15px 24px;margin-top:18px;border-radius:3px;font:12px sans-serif}.cinematic .hero{position:relative;display:block;isolation:isolate;background:#111;color:white}.cinematic .hero img{position:absolute;inset:0;height:100%;z-index:-2;opacity:.48}.cinematic .hero:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#000a,transparent);z-index:-1}.cinematic h1{max-width:650px}.editorial .hero img{border-radius:50% 50% 0 0}.editorial h1{font-weight:400}.bold h1{text-transform:uppercase;font-weight:900}.bold .hero img{transform:rotate(4deg);border:8px solid ${d.accent};box-shadow:14px 14px 0 ${fg}}.bold .button{border-radius:50px}.minimal .hero{padding-top:90px;padding-bottom:90px}.minimal .hero img{height:330px;border-radius:18px}.minimal h1{font-size:clamp(40px,6vw,78px)}section:not(.hero){padding:55px 6%;border-top:1px solid ${fg}33}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.cards article{border-top:2px solid ${d.accent};padding-top:18px}.cards span{font:12px sans-serif}.gallery{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px}.gallery img{width:100%;height:220px;object-fit:cover}blockquote{font-size:clamp(28px,4vw,48px);margin:25px 0;max-width:800px}.end{text-align:center}footer{padding:25px 6%;font:11px sans-serif;border-top:1px solid ${fg}33}@media(max-width:550px){.hero{grid-template-columns:1fr;padding:40px 6%;min-height:580px}.hero img{height:250px}.hero h1{font-size:52px}.cards{grid-template-columns:1fr}.gallery{grid-template-columns:1fr 1fr}.gallery img:first-child{grid-column:1/-1}.gallery img{height:180px}nav .nav-items{display:none}.bold .hero img{transform:none}.cinematic .hero{display:flex;align-items:center}}</style></head><body class="${d.layout}"><nav><strong>${d.logo?`<img src="${escape(d.logo)}" alt="${brand}">`:brand}</strong><span class="nav-items">${d.order.filter(s=>d.sections.includes(s)).map(s=>`<a href="#${s}">${sectionNames[s]}</a>`).join(' · ')}</span><span>↗</span></nav><section class="hero"><div><small>${brand} / ${t('A NEW PERSPECTIVE','UNA NUEVA PERSPECTIVA')}</small><h1>${escape(d.heading)}</h1><p>${escape(d.description)}</p><a class="button" href="#${d.order.find(s=>d.sections.includes(s))||'top'}">${escape(d.cta)} ↗</a></div><img src="${img}" alt="${t('Your selected hero photo','Tu foto principal seleccionada')}"></section>${d.order.filter(s=>d.sections.includes(s)).map(s=>blocks[s]).join('')}<footer>${brand} · ${t('Design concept / Created with JEM','Concepto de diseño / Creado con JEM')}</footer></body></html>`;
 if(!reviewMode) { try{localStorage.setItem(key,JSON.stringify(d));saveFailed=false;}catch{saveFailed=true;} }
 $('save-status').textContent=saveFailed?t('Browser saving unavailable. Download a file to keep your design.','No se puede guardar en este navegador. Descarga el archivo.'):t('Saved in this browser. Download a file to keep a separate copy.','Guardado en este navegador. Descarga un archivo para conservar otra copia.');
}
for(const field of ['accent','background','font','brand','heading','description','cta','serviceText','testimonial']) $(field).addEventListener('input',()=>{design[field]=$(field).value;render();});
$('layout').addEventListener('change',()=>{design.layout=$('layout').value;Object.assign(design,{accent:presets[design.layout].accent,background:presets[design.layout].background,image:presets[design.layout].image});sync();});
$('section-options').addEventListener('change',e=>{const s=e.target.dataset.section;if(!s)return;design.sections=e.target.checked?[...design.sections,s]:design.sections.filter(v=>v!==s);render();});
$('section-options').addEventListener('click',e=>{const s=e.target.dataset.move;if(!s)return;const i=design.order.indexOf(s),j=i+Number(e.target.dataset.delta);if(j<0||j>=4)return;[design.order[i],design.order[j]]=[design.order[j],design.order[i]];sectionsUI();render();$('section-options').querySelector(`[data-move="${s}"][data-delta="${e.target.dataset.delta}"]`)?.focus();});
for(const mode of ['desktop','phone']) $(mode).addEventListener('click',()=>{$('canvas').classList.toggle('phone',mode==='phone');$('phone').setAttribute('aria-pressed',String(mode==='phone'));$('desktop').setAttribute('aria-pressed',String(mode==='desktop'));});
// Download the pinned decoder only when native decoding cannot open an iPhone photo.
// Conversion runs locally in the browser; no photo is sent to the CDN.
let heicDecoderPromise;
async function loadHeicDecoder() {
 if(typeof window.HeicTo==='function') return window.HeicTo;
 if(!heicDecoderPromise) heicDecoderPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>fail(),30000);
  function fail(){clearTimeout(timer);script.remove();heicDecoderPromise=undefined;reject(Error('HEIC_DECODER_UNAVAILABLE'));}
  script.src='https://cdn.jsdelivr.net/npm/heic-to@1.6.7/dist/iife/heic-to.js';
  script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
  script.onload=()=>{clearTimeout(timer);if(typeof window.HeicTo==='function')resolve(window.HeicTo);else fail();};
  script.onerror=fail;document.head.append(script);
 });
 return heicDecoderPromise;
}
async function isIPhonePhoto(file) {
 if(/image\/hei[cf]|\.(hei[cf]|hif)$/i.test(file.type+' '+file.name)) return true;
 const bytes=new Uint8Array(await file.slice(0,40).arrayBuffer());
 const header=Array.from(bytes,c=>String.fromCharCode(c)).join('');
 return header.slice(4,8)==='ftyp' && /heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(header.slice(8));
}
// Normalize large uploads to bounded images so browser saving and design-file imports keep working.
async function prepareImage(file, logo, status) {
 let source=URL.createObjectURL(file);
 const image=new Image();
 try {
  image.src=source;
  try {await image.decode();} catch(nativeError) {
   if(!await isIPhonePhoto(file))throw nativeError;
   if(status) status.textContent=t('Converting your iPhone photo…','Convirtiendo tu foto de iPhone…');
   const convert=await loadHeicDecoder();
   const converted=await convert({blob:file,type:logo?'image/png':'image/jpeg',quality:.85});
   URL.revokeObjectURL(source);source=URL.createObjectURL(converted);
   image.src=source;await image.decode();
  }
  if(!image.naturalWidth || !image.naturalHeight) throw Error('Invalid image');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx) throw Error('Canvas unavailable');
  let scale=Math.min(1,(logo?900:1600)/Math.max(image.naturalWidth,image.naturalHeight));
  for(let attempt=0;attempt<12;attempt++) {
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   ctx.clearRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL(logo?'image/png':'image/jpeg',.82);
   if(data.length<350000 && data.startsWith('data:image/')) return data;
   scale*=.75;
  }
  throw Error('Image could not be resized');
 } finally {URL.revokeObjectURL(source);}
}
for(const [id,field] of [['photo-upload','image'],['logo-upload','logo']]) $(id).addEventListener('change',async()=>{
 const input=$(id),file=input.files[0],status=$(id+'-status');
 if(!file)return;
 status.dataset.state='';
 const supported=file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico|hei[cf]|hif|tiff?)$/i.test(file.name);
 if(!supported || file.size>20*1024*1024) {
  status.textContent=t('Choose an image up to 20 MB. Documents such as PDFs cannot be used as a website photo.','Elige una imagen de hasta 20 MB. Los documentos como PDF no se pueden usar como foto del sitio.');
  status.dataset.state='error';input.value='';return;
 }
 input.disabled=true;pendingUploads++;
 status.textContent=t('Preparing your image…','Preparando tu imagen…');
 try {
  const data=await prepareImage(file,field==='logo',status);
  design[field]=data;render();
  status.textContent=t('Added: ','Añadido: ')+file.name;
  status.dataset.state='success';
 } catch(error) {
  status.textContent=error.message==='HEIC_DECODER_UNAVAILABLE'
   ?t('The iPhone photo converter could not load. Check your internet connection and choose the photo again. Your previous image is unchanged.','No se pudo cargar el convertidor de iPhone. Revisa tu conexión y selecciona la foto de nuevo. Tu imagen anterior se conserva.')
   :t('This file could not be decoded as an image. It may be damaged or use an unsupported format. Your previous image is unchanged.','No se pudo leer este archivo como imagen. Puede estar dañado o usar un formato no compatible. Tu imagen anterior se conserva.');
  status.dataset.state='error';
 } finally {input.disabled=false;input.value='';pendingUploads--;}
});
$('clear-images').addEventListener('click',()=>{design.image=presets[design.layout].image;design.logo='';for(const id of ['photo-upload','logo-upload']) {$(id+'-status').textContent='';$(id+'-status').dataset.state='';}render();});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(design,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jem-website-design.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>800000)throw Error();design=validate(JSON.parse(await file.text()));sync();}catch{$('save-status').textContent=t('Could not open this design. Choose a JEM design JSON file.','No se pudo abrir. Elige un archivo JSON de diseño JEM.');}$('import-file').value='';});
$('reset').addEventListener('click',()=>{if(!confirm(t('Start over? Download your current design first if you want to keep it.','¿Empezar de nuevo? Descarga tu diseño actual primero si deseas conservarlo.')))return;design=structuredClone(defaults);sync();});
$('studio-send').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget,button=form.querySelector('[type=submit]'),status=$('send-status'),label=button.textContent;
 if(button.disabled)return;
 if(pendingUploads) {status.textContent=t('Please wait for your images to finish preparing, then send your design.','Espera a que las imágenes terminen de prepararse y envía tu diseño.');return;}
 const snapshot=structuredClone(design),data=new FormData(form);
 button.disabled=true;button.textContent=t('Sending your complete design…','Enviando tu diseño completo…');status.textContent='';
 try {
  const shared=await handoff(snapshot,data.get('_gotcha') || '');
  data.set('_subject','JEM Design Studio — '+snapshot.brand);
  data.set(t('Open the complete design','Abrir el diseño completo'),shared.url);
  data.set(t('Business','Negocio'),snapshot.brand);
  data.set(t('Design direction','Estilo'),presets[snapshot.layout].name);
  data.set(t('Colors','Colores'),`${t('Accent','Acento')}: ${snapshot.accent} / ${t('Background','Fondo')}: ${snapshot.background}`);
  data.set(t('Typography','Tipografía'),snapshot.font);
  data.set(t('Page sections, in order','Secciones, en orden'),snapshot.order.filter(s=>snapshot.sections.includes(s)).map(s=>sectionNames[s]).join(' → '));
  data.set(t('Headline','Título'),snapshot.heading);
  data.set(t('Introduction','Introducción'),snapshot.description);
  data.set(t('Button text','Texto del botón'),snapshot.cta);
  if(snapshot.sections.includes('services')) data.set(t('Services','Servicios'),snapshot.serviceText);
  if(snapshot.sections.includes('testimonials')) data.set(t('Testimonial text','Texto del testimonio'),snapshot.testimonial);
  data.set(t('Images','Imágenes'),t('Preview photos and logo are included in the design link.','Las fotos de vista previa y el logo están incluidos en el enlace del diseño.'));
  const response=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('NOTIFICATION_FAILED');
  status.textContent=t('Sent! JEM receives your complete design, including your preview photos and logo. Nothing else needs to be sent separately.','¡Enviado! JEM recibe tu diseño completo, incluidas tus fotos de vista previa y logo. No necesitas enviar nada por separado.');
 } catch(error) {
  status.textContent=error.message==='RATE_LIMIT'
   ?t('Please wait a minute before trying again. Your design and images are still saved here.','Espera un minuto antes de intentar de nuevo. Tu diseño e imágenes siguen guardados aquí.')
   :t('Your complete design could not be delivered. Your design and images are still here. Please try again in a moment.','No se pudo entregar tu diseño completo. Tu diseño e imágenes siguen aquí. Intenta de nuevo en un momento.');
 } finally {button.disabled=false;button.textContent=label;}
});
if(reviewMode) {
 main.classList.add('studio-review');
 const title=main.querySelector('h1'),intro=main.querySelector('.studio-heading p:not(.section-label)');
 title.textContent=design.brand;
 intro.textContent=t('Submitted design concept. Explore the page below or open an editable copy.','Concepto de diseño enviado. Explora la página o abre una copia editable.');
 const edit=document.createElement('button');edit.className='btn';edit.type='button';edit.textContent=t('Edit a copy','Editar una copia');
 edit.addEventListener('click',()=>{reviewMode=false;main.classList.remove('studio-review');edit.remove();history.replaceState(null,'',location.pathname);sync();});
 main.querySelector('.studio-heading').append(edit);
 const download=document.createElement('button');download.className='btn btn-secondary';download.type='button';download.textContent=t('Download design','Descargar diseño');
 download.addEventListener('click',()=>$('download').click());main.querySelector('.studio-heading').append(download);
}
sync();
if(linkError) $('save-status').textContent=t('This design link could not be opened. Ask for the saved design file.','No se pudo abrir este enlace. Solicita el archivo de diseño guardado.');
})();
