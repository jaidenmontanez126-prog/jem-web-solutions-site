(() => {
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
 if (!raw || raw.version !== 1 || !presets[raw.layout]) throw Error('Invalid design');
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
// A URL fragment stays in the browser and is not sent to analytics or the server.
function encodeDesign(value) {
 return btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)), byte => String.fromCharCode(byte)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeDesign(value) {
 if(value.length>40000) throw Error('Design link too long');
 const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
 return validate(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)))));
}
let linkError=false;
if(location.hash.startsWith('#design=')) {
 try { design=decodeDesign(location.hash.slice(8)); reviewMode=true; } catch { linkError=true; }
}
function handoff() {
 const shared=structuredClone(design), uploads=[];
 if(shared.image.startsWith('data:')) { uploads.push(t('hero photo','foto principal')); shared.image=presets[shared.layout].image; }
 if(shared.logo.startsWith('data:')) { uploads.push(t('logo','logo')); shared.logo=''; }
 const url=new URL(es?'spanish-studio.html':'design-studio.html',location.href);
 url.hash='design='+encodeDesign(shared);
 return {url:url.href,uploads};
}
const main=$('main');
main.innerHTML=`<div class="studio-heading"><div><p class="section-label">JEM / ${t('THE DESIGN STUDIO','ESTUDIO DE DISEÑO')}</p><h1>${t('Make it yours.','Hazlo tuyo.')}</h1><p>${t('Turn “I have an idea” into something you can see. Choose a direction, change the details, and send me your vision.','Convierte tu idea en algo que puedes ver. Elige un estilo, cambia los detalles y envíame tu visión.')}</p></div><span class="studio-tag">✦ ${t('Your idea starts here','Tu idea empieza aquí')}</span></div><div class="studio-layout"><aside class="studio-controls" aria-label="${t('Design controls','Controles de diseño')}"><details open><summary>01 / ${t('Choose your direction','Elige tu estilo')}</summary><label>${t('Layout','Diseño')}<select id="layout">${Object.entries(presets).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('')}</select></label><label>${t('Accent color','Color de acento')}<input id="accent" type="color"></label><label>${t('Background','Fondo')}<input id="background" type="color"></label><label>${t('Typography','Tipografía')}<select id="font"><option value="serif">${t('Classic serif','Serif clásica')}</option><option value="sans-serif">${t('Modern sans','Sans moderna')}</option><option value="monospace">${t('Creative mono','Mono creativa')}</option></select></label></details><details open><summary>02 / ${t('Tell your story','Cuenta tu historia')}</summary>${[['brand',t('Business name','Nombre del negocio')],['heading',t('Main headline','Título principal')],['description',t('Introduction','Introducción')],['cta',t('Button text','Texto del botón')]].map(([id,label])=>`<label>${label}${id==='description'?`<textarea id="${id}" maxlength="2000"></textarea>`:`<input id="${id}" maxlength="160">`}</label>`).join('')}<label>${t('Hero photo','Foto principal')}<input id="photo-upload" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="photo-upload-status"></label><p class="upload-status" id="photo-upload-status" role="status" aria-live="polite"></p><label>${t('Your logo','Tu logo')}<input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="logo-upload-status"></label><p class="upload-status" id="logo-upload-status" role="status" aria-live="polite"></p><p class="studio-caption">${t('PNG, JPG or WebP, up to 20 MB each. Images are automatically resized for your preview. Use images you have permission to share.','PNG, JPG o WebP, hasta 20 MB cada uno. Las imágenes se ajustan automáticamente. Usa imágenes que tengas permiso para compartir.')}</p><button id="clear-images" type="button">${t('Restore sample images','Restaurar imágenes de muestra')}</button></details><details><summary>03 / ${t('Build your page','Construye tu página')}</summary><p class="studio-caption">${t('Select sections. Use arrows to change their order.','Selecciona secciones. Usa las flechas para cambiar su orden.')}</p><div id="section-options"></div><label>${t('Services (one per line)','Servicios (uno por línea)')}<textarea id="serviceText" maxlength="2000"></textarea></label><label>${t('Testimonial / sample text','Testimonio / texto de muestra')}<textarea id="testimonial" maxlength="2000"></textarea></label></details><div class="studio-save"><button id="download" type="button">${t('↓ Save file','↓ Guardar archivo')}</button><button id="import" type="button">${t('Open file','Abrir archivo')}</button><input id="import-file" type="file" accept=".json,application/json" hidden><button id="reset" type="button">${t('Start over','Empezar de nuevo')}</button><p class="save-status" id="save-status" role="status"></p></div></aside><div class="studio-preview"><div class="studio-toolbar"><span>${t('LIVE PREVIEW','VISTA EN VIVO')}</span><div><button id="desktop" type="button" aria-pressed="true">${t('Desktop','Escritorio')}</button> <button id="phone" type="button" aria-pressed="false">${t('Phone','Teléfono')}</button></div></div><div class="studio-canvas" id="canvas"><iframe id="preview" title="${t('Your website concept','Tu concepto de sitio web')}" sandbox=""></iframe></div><p class="studio-caption">${t('Concept preview only. Buttons and sample content illustrate your idea; this is not a published website or a booking system.','Vista conceptual. Los botones y el contenido de muestra ilustran tu idea; no es un sitio publicado ni un sistema de reservas.')}</p><form id="studio-send" class="studio-send" action="https://formspree.io/f/mrerznbo" method="POST"><p class="section-label">${t('LOVE THE DIRECTION?','¿TE GUSTA LA IDEA?')}</p><h2>${t('Let’s bring it to life.','Démosle vida.')}</h2><p>${t('JEM receives a readable brief and a link to your visual design. Uploaded photos and logos must be shared separately using your saved design file. We’ll discuss scope and a quote before work begins.','JEM recibe un resumen y un enlace a tu diseño visual. Las fotos y logos subidos deben compartirse aparte usando tu archivo de diseño guardado. Hablaremos del alcance y presupuesto antes de comenzar.')}</p><div class="send-grid"><label>${t('Your name','Tu nombre')}<input name="name" autocomplete="name" required maxlength="160"></label><label>${t('Your email','Tu correo')}<input name="email" type="email" autocomplete="email" required maxlength="254"></label></div><label>${t('Anything else? Timeline, budget, or ideas.','¿Algo más? Plazo, presupuesto o ideas.')}<textarea name="project" maxlength="5000"></textarea></label><button type="submit" class="btn">${t('Send my design to JEM ↗','Enviar mi diseño a JEM ↗')}</button><p class="studio-status" id="send-status" role="status" aria-live="polite"></p></form></div></div>`;
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
// Normalize large uploads to bounded images so browser saving and design-file imports keep working.
async function prepareImage(file, logo) {
 const source=URL.createObjectURL(file), image=new Image();
 try {
  image.src=source;
  await image.decode();
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
 const supported=['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type) || (!file.type && /\.(png|jpe?g|webp)$/i.test(file.name));
 if(!supported || file.size>20*1024*1024) {
  status.textContent=t('Choose a PNG, JPG or WebP image up to 20 MB. HEIC, PDF and SVG files need to be exported as PNG or JPG first.','Elige una imagen PNG, JPG o WebP de hasta 20 MB. Exporta archivos HEIC, PDF o SVG como PNG o JPG primero.');
  status.dataset.state='error';input.value='';return;
 }
 input.disabled=true;
 status.textContent=t('Preparing your image…','Preparando tu imagen…');
 try {
  const data=await prepareImage(file,field==='logo');
  design[field]=data;render();
  status.textContent=t('Added: ','Añadido: ')+file.name;
  status.dataset.state='success';
 } catch {
  status.textContent=t('This image could not be opened. Export it as PNG or JPG and try again. Your previous image is unchanged.','No se pudo abrir esta imagen. Expórtala como PNG o JPG e intenta de nuevo. Tu imagen anterior se conserva.');
  status.dataset.state='error';
 } finally {input.disabled=false;input.value='';}
});
$('clear-images').addEventListener('click',()=>{design.image=presets[design.layout].image;design.logo='';for(const id of ['photo-upload','logo-upload']) {$(id+'-status').textContent='';$(id+'-status').dataset.state='';}render();});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(design,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jem-website-design.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>800000)throw Error();design=validate(JSON.parse(await file.text()));sync();}catch{$('save-status').textContent=t('Could not open this design. Choose a JEM design JSON file.','No se pudo abrir. Elige un archivo JSON de diseño JEM.');}$('import-file').value='';});
$('reset').addEventListener('click',()=>{if(!confirm(t('Start over? Download your current design first if you want to keep it.','¿Empezar de nuevo? Descarga tu diseño actual primero si deseas conservarlo.')))return;design=structuredClone(defaults);sync();});
$('studio-send').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.currentTarget,button=form.querySelector('[type=submit]'),status=$('send-status'),label=button.textContent;
 button.disabled=true;button.textContent=t('Sending…','Enviando…');status.textContent='';
 const data=new FormData(form), shared=handoff();
 data.set('_subject','JEM Design Studio — '+design.brand);
 data.set(t('Open the visual design','Abrir el diseño visual'),shared.url);
 data.set(t('Business','Negocio'),design.brand);
 data.set(t('Design direction','Estilo'),presets[design.layout].name);
 data.set(t('Colors','Colores'),`${t('Accent','Acento')}: ${design.accent} / ${t('Background','Fondo')}: ${design.background}`);
 data.set(t('Typography','Tipografía'),design.font);
 data.set(t('Page sections, in order','Secciones, en orden'),design.order.filter(s=>design.sections.includes(s)).map(s=>sectionNames[s]).join(' → '));
 data.set(t('Headline','Título'),design.heading);
 data.set(t('Introduction','Introducción'),design.description);
 data.set(t('Button text','Texto del botón'),design.cta);
 if(design.sections.includes('services')) data.set(t('Services','Servicios'),design.serviceText);
 if(design.sections.includes('testimonials')) data.set(t('Testimonial text','Texto del testimonio'),design.testimonial);
 if(shared.uploads.length) data.set(t('Images to collect separately','Imágenes pendientes'),`${shared.uploads.join(', ')}. ${t('The visual link uses sample images instead. Ask the client for their saved JEM design file, then use Open file in the studio to restore the original images.','El enlace visual usa imágenes de muestra. Solicita el archivo de diseño JEM del cliente y ábrelo en el estudio para restaurar las imágenes originales.')}`);
 try {
  const response=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error();
  status.textContent=t('Sent! JEM receives a visual preview link and your project brief.','¡Enviado! JEM recibe un enlace visual y el resumen de tu proyecto.')+(shared.uploads.length?' '+t('Your uploaded images are not in that link. Use Save file and send that file to JEM separately to include them.','Tus imágenes subidas no están en ese enlace. Guarda el archivo y envíalo a JEM por separado para incluirlas.'):'');
 } catch {
  status.textContent=t('The design could not be sent. Your work is still here. Try again, or download the file and contact JEM through Let’s Talk.','No se pudo enviar. Tu trabajo sigue aquí. Intenta de nuevo o descarga el archivo y contacta a JEM desde Hablemos.');
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
}
sync();
if(linkError) $('save-status').textContent=t('This design link could not be opened. Ask for the saved design file.','No se pudo abrir este enlace. Solicita el archivo de diseño guardado.');
})();
