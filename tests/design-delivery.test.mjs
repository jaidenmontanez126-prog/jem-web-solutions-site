import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../design-studio.js',import.meta.url),'utf8');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WQAAAABJRU5ErkJggg==';

async function harness(lang='en', options={}) {
  const elements=new Map(),storage=options.storage || new Map(),calls=[],saved=new Map(),images=new Map(),downloads=[];
  const state={saveOK:true,mailOK:true,imageOK:true};
  const el=id=>{
    if(!elements.has(id)) elements.set(id,{value:'',textContent:'',innerHTML:'',files:[],dataset:{},listeners:{},disabled:false,
      classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){this.listeners[type]=fn;},
      setAttribute(){},querySelector(selector){return el(id+selector);},append(){},remove(){},click(){this.listeners.click?.();},focus(){}});
    return elements.get(id);
  };
  class FormData {
    constructor(){this.data={name:'Alex',email:'alex@example.com',project:'A new website'};}
    get(key){return this.data[key] ?? null;} set(key,value){this.data[key]=value;}
  }
  const context={document:{documentElement:{lang},getElementById:el,createElement:tag=>tag==='canvas'?{width:0,height:0,getContext:()=>({clearRect(){},drawImage(){}}),toDataURL:()=>png}:el('new-button')},
    indexedDB:options.indexedDB,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    location:{href:'https://jemwebsolutions.com/design-studio',hash:options.hash || '',pathname:'/design-studio',reload(){}},history:{replaceState(){}},
    Image:class{naturalWidth=2400;naturalHeight=1600;async decode(){}},structuredClone,Blob,URL:class extends URL{static createObjectURL(blob){downloads.push(blob);return 'blob:photo'}static revokeObjectURL(){}},TextEncoder,TextDecoder,Uint8Array,btoa,atob,FormData,AbortSignal,setTimeout,clearTimeout,confirm:()=>true,console,
    fetch:async(url,config={})=>{
      calls.push({url,config});
      if(url==='/.netlify/functions/save-design-image') {
        const {src}=JSON.parse(config.body),id=(images.size+1).toString(16).padStart(64,'0');images.set(id,src);
        return {ok:state.imageOK,status:state.imageOK?201:503,json:async()=>({id})};
      }
      if(url==='/.netlify/functions/save-design') {
        const payload=JSON.parse(config.body);saved.set('a'.repeat(64),payload.design);
        return {ok:state.saveOK,status:state.saveOK?201:503,json:async()=>({id:'a'.repeat(64)})};
      }
      if(url.startsWith('/.netlify/functions/load-design')) return {ok:!options.loadFails,json:async()=>({design:options.sharedDesign})};
      return {ok:state.mailOK,status:state.mailOK?200:500};
    }};
  el('studio-send').action='https://formspree.io/f/mrerznbo';
  await vm.runInNewContext(source,context);
  return {el,storage,calls,saved,images,downloads,state,context,submit:()=>el('studio-send').listeners.submit({preventDefault(){},currentTarget:el('studio-send')})};
}
async function addImages(h) {
  const design=JSON.parse(h.storage.get('jem-design-studio-v1'));
  Object.assign(design,{brand:'Montañez — Diseño',image:png,logo:png});
  h.el('import-file').files=[{size:1000,text:async()=>JSON.stringify(design)}];
  await h.el('import-file').listeners.change();
  return design;
}

for (const lang of ['en','es']) {
  test(`${lang}: one click stores both images and emails a short complete-design link`,async()=>{
    const h=await harness(lang),design=await addImages(h);
    await h.submit();
    assert.equal(h.calls.filter(c=>c.url==='/.netlify/functions/save-design').length,1);
    const manifest=structuredClone(h.saved.get('a'.repeat(64)));
    manifest.image=h.images.get(new URL(manifest.image,'https://jemwebsolutions.com').searchParams.get('id'));
    manifest.logo=h.images.get(new URL(manifest.logo,'https://jemwebsolutions.com').searchParams.get('id'));
    assert.deepEqual(manifest,design);
    const sent=h.calls.find(c=>c.url.includes('formspree')).config.body.data;
    const link=sent[lang==='es'?'Abrir el diseño completo':'Open the complete design'];
    assert.equal(new URL(link).hash,'#submission='+'a'.repeat(64));
    assert(link.length<150);
    assert(!('design_json' in sent));
    assert(!('Images to collect separately' in sent));
    assert.match(h.el('send-status').textContent,lang==='es'?/¡Enviado!/:/Sent!/);
    assert.equal(h.el('studio-send').querySelector('[type=submit]').disabled,false);
  });
}

test('review link restores photos without overwriting the owner’s current draft',async()=>{
  const first=await harness(),sharedDesign=await addImages(first);
  const storage=new Map([['jem-design-studio-v1',JSON.stringify({...sharedDesign,brand:'My unfinished draft'})]]);
  const before=storage.get('jem-design-studio-v1');
  const review=await harness('en',{storage,hash:'#submission='+'a'.repeat(64),sharedDesign});
  assert(review.el('preview').srcdoc.includes(png));
  assert(review.el('preview').srcdoc.includes('Montañez'));
  assert.equal(storage.get('jem-design-studio-v1'),before);
});

test('storage failures never send an incomplete email or erase the draft',async()=>{
  const h=await harness();await addImages(h);const draft=h.storage.get('jem-design-studio-v1');h.state.saveOK=false;
  await h.submit();
  assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,0);
  assert.match(h.el('send-status').textContent,/could not be delivered/);
  assert.equal(h.storage.get('jem-design-studio-v1'),draft);
  assert.equal(h.el('studio-send').querySelector('[type=submit]').disabled,false);
});

test('email retries reuse the stored design and preserve both images',async()=>{
  const h=await harness();await addImages(h);h.state.mailOK=false;
  await h.submit();assert.match(h.el('send-status').textContent,/could not be delivered/);
  h.state.mailOK=true;await h.submit();
  assert.equal(h.calls.filter(c=>c.url==='/.netlify/functions/save-design').length,1);
  assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,2);
  assert.match(h.el('send-status').textContent,/Sent!/);
});

test('unavailable review links display an error instead of an unrelated default design',async()=>{
  const h=await harness('en',{hash:'#submission='+'a'.repeat(64),loadFails:true});
  assert.match(h.el('main').innerHTML,/Design unavailable/);
  assert.equal(h.el('preview').srcdoc,undefined);
  assert.equal(h.calls.length,1);
});


test('selecting multiple photos adds a visible gallery and preserves it in a review link',async()=>{
  const h=await harness();
  h.el('gallery-upload').files=[{name:'First.png',type:'image/png',size:4000000},{name:'Second.jpg',type:'image/jpeg',size:5000000}];
  await h.el('gallery-upload').listeners.change();
  let draft=JSON.parse(h.storage.get('jem-design-studio-v1'));
  assert.deepEqual(draft.gallery.map(photo=>photo.name),['First.png','Second.jpg']);
  assert(h.el('gallery-manager').innerHTML.includes('First.png'));
  assert.match(h.el('gallery-count').textContent,/2 website photos/);
  assert(h.el('preview').srcdoc.includes(png));
  h.el('gallery-manager').listeners.click({target:{closest:()=>({dataset:{galleryIndex:'1',galleryAction:'up'}})}});
  draft=JSON.parse(h.storage.get('jem-design-studio-v1'));
  assert.deepEqual(draft.gallery.map(photo=>photo.name),['Second.jpg','First.png']);
  await h.el('save-review').listeners.click();
  assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,0);
  assert.equal(h.saved.get('a'.repeat(64)).gallery.length,2);
  assert.equal(h.el('saved-review-link').hidden,false);
  assert.match(h.el('saved-review-link').href,/#submission=/);
  h.el('gallery-manager').listeners.click({target:{closest:()=>({dataset:{galleryIndex:'0',galleryAction:'remove'}})}});
  assert.equal(JSON.parse(h.storage.get('jem-design-studio-v1')).gallery.length,1);
});

test('customers can keep adding photos past eight while invalid files receive feedback',async()=>{
  const h=await harness();
  for(const batch of [12,15]){
   h.el('gallery-upload').files=Array.from({length:batch},(_,i)=>({name:`Photo${i}.png`,type:'image/png',size:2000}));
   await h.el('gallery-upload').listeners.change();
   assert.equal(h.el('gallery-upload-status').dataset.state,'success');
  }
  assert.equal(JSON.parse(h.storage.get('jem-design-studio-v1')).gallery.length,27);
  h.el('gallery-upload').files=[{name:'Good.png',type:'image/png',size:2000},{name:'TooLarge.jpg',type:'image/jpeg',size:21*1024*1024}];
  await h.el('gallery-upload').listeners.change();
  assert.equal(JSON.parse(h.storage.get('jem-design-studio-v1')).gallery.length,28);
  assert.match(h.el('gallery-upload-status').textContent,/TooLarge.jpg/);
});

test('gallery photos survive design-file export and import',async()=>{
  const h=await harness(),design=await addImages(h);
  design.gallery=[{src:png,name:'Restored gallery.png'}];
  h.el('import-file').files=[{size:1000,text:async()=>JSON.stringify(design)}];
  await h.el('import-file').listeners.change();
  assert.deepEqual(JSON.parse(h.storage.get('jem-design-studio-v1')).gallery,design.gallery);
  await h.submit();
  assert.equal(h.saved.get('a'.repeat(64)).gallery[0].name,design.gallery[0].name);assert.match(h.saved.get('a'.repeat(64)).gallery[0].src,/load-design-image/);
});


test('large collections upload as individual photos, then one small design manifest',async()=>{
 const h=await harness(),design=await addImages(h);
 design.gallery=Array.from({length:150},(_,i)=>({src:'data:image/png;base64,'+Buffer.concat([Buffer.from(png.split(',')[1],'base64'),Buffer.from(String(i))]).toString('base64'),name:`Photo ${i}.png`}));
 h.el('import-file').files=[{size:20000000,text:async()=>JSON.stringify(design)}];
 await h.el('import-file').listeners.change();await h.submit();
 const manifest=h.saved.get('a'.repeat(64));
 assert.equal(manifest.gallery.length,150);
 assert(h.calls.filter(c=>c.url==='/.netlify/functions/save-design-image').length>=150);
 assert(manifest.gallery.every(photo=>photo.src.startsWith('/.netlify/functions/load-design-image?id=')));
 assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,1);
 const write=h.calls.find(c=>c.url==='/.netlify/functions/save-design');
 assert(write.config.body.length<50000);
});

test('an image upload failure never sends a manifest or an incomplete email',async()=>{
 const h=await harness();await addImages(h);h.state.imageOK=false;
 const before=h.storage.get('jem-design-studio-v1');await h.submit();
 assert.equal(h.calls.filter(c=>c.url==='/.netlify/functions/save-design').length,0);
 assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,0);
 assert.equal(h.storage.get('jem-design-studio-v1'),before);
 assert.match(h.el('send-status').textContent,/could not be delivered/);
});


test('photo collections migrate to IndexedDB and reopen without the localStorage ceiling',async()=>{
 const first=await harness(),design=await addImages(first);
 design.gallery=Array.from({length:150},(_,i)=>({src:png,name:`My photo ${i}.png`}));
 const records=new Map();
 const database={transaction(){
  const transaction={objectStore(){return {
   get(key){const request={};queueMicrotask(()=>{request.result=structuredClone(records.get(key));request.onsuccess();});return request;},
   put(value,key){records.set(key,structuredClone(value));queueMicrotask(()=>transaction.oncomplete());}
  };}};return transaction;
 }};
 const indexedDB={open(){const request={};queueMicrotask(()=>{request.result=database;request.onsuccess();});return request;}};
 const legacy=new Map([['jem-design-studio-v1',JSON.stringify(design)]]);
 const h=await harness('en',{storage:legacy,indexedDB});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(records.get('current').gallery.length,150);
 assert.equal(legacy.has('jem-design-studio-v1'),false);
 assert.match(h.el('save-status').textContent,/photos saved/);
 const reopened=await harness('en',{storage:legacy,indexedDB});
 assert(reopened.el('gallery-manager').innerHTML.includes('My photo 149.png'));
 assert.equal(reopened.el('gallery-count').textContent,'150 website photos');
});


for(const lang of ['en','es']) test(`${lang}: downloads a visual HTML preview and reopens it as an editable design`,async()=>{
 const h=await harness(lang),design=await addImages(h);
 design.heading='My design </script><script>alert(1)</script>';
 design.gallery=[{src:png,name:'A website photo.png'},{src:'/.netlify/functions/load-design-image?id='+'a'.repeat(64),name:'Saved photo.png'}];
 h.el('import-file').files=[{text:async()=>JSON.stringify(design)}];await h.el('import-file').listeners.change();
 h.el('download').listeners.click();
 const blob=h.downloads.at(-1),html=await blob.text();
 assert.match(blob.type,/text\/html/);
 assert.equal(h.el('new-button').download,'jem-website-preview.html');
 assert(html.startsWith('<!DOCTYPE html>'));
 assert(html.includes('<h1>My design &lt;/script&gt;'));
 assert(!html.includes('<script>alert(1)</script>'));
 assert(html.includes('src="https://jemwebsolutions.com/'));
 assert.equal((html.match(/<script/g)||[]).length,1);
 assert(html.includes('id="jem-design-data"'));
 h.el('import-file').files=[{text:async()=>html}];await h.el('import-file').listeners.change();
 assert.deepEqual(JSON.parse(h.storage.get('jem-design-studio-v1')),design);
});
