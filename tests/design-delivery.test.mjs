import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../design-studio.js',import.meta.url),'utf8');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WQAAAABJRU5ErkJggg==';

async function harness(lang='en', options={}) {
  const elements=new Map(),storage=options.storage || new Map(),calls=[],saved=new Map();
  const state={saveOK:true,mailOK:true};
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
  const context={document:{documentElement:{lang},getElementById:el,createElement:()=>el('new-button')},
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    location:{href:'https://jemwebsolutions.com/design-studio',hash:options.hash || '',pathname:'/design-studio',reload(){}},history:{replaceState(){}},
    structuredClone,Blob,URL,TextEncoder,TextDecoder,Uint8Array,btoa,atob,FormData,AbortSignal,setTimeout,clearTimeout,confirm:()=>true,console,
    fetch:async(url,config={})=>{
      calls.push({url,config});
      if(url.startsWith('/.netlify/functions/save-design')) {
        const payload=JSON.parse(config.body);saved.set('a'.repeat(64),payload.design);
        return {ok:state.saveOK,status:state.saveOK?201:503,json:async()=>({id:'a'.repeat(64)})};
      }
      if(url.startsWith('/.netlify/functions/load-design')) return {ok:!options.loadFails,json:async()=>({design:options.sharedDesign})};
      return {ok:state.mailOK,status:state.mailOK?200:500};
    }};
  el('studio-send').action='https://formspree.io/f/mrerznbo';
  await vm.runInNewContext(source,context);
  return {el,storage,calls,saved,state,context,submit:()=>el('studio-send').listeners.submit({preventDefault(){},currentTarget:el('studio-send')})};
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
    assert.equal(h.calls.length,2);
    assert.deepEqual(h.saved.get('a'.repeat(64)),design);
    const sent=h.calls[1].config.body.data;
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
  assert.equal(h.calls.length,1);
  assert.match(h.el('send-status').textContent,/could not be delivered/);
  assert.equal(h.storage.get('jem-design-studio-v1'),draft);
  assert.equal(h.el('studio-send').querySelector('[type=submit]').disabled,false);
});

test('email retries reuse the stored design and preserve both images',async()=>{
  const h=await harness();await addImages(h);h.state.mailOK=false;
  await h.submit();assert.match(h.el('send-status').textContent,/could not be delivered/);
  h.state.mailOK=true;await h.submit();
  assert.equal(h.calls.filter(c=>c.url.includes('save-design')).length,1);
  assert.equal(h.calls.filter(c=>c.url.includes('formspree')).length,2);
  assert.match(h.el('send-status').textContent,/Sent!/);
});

test('unavailable review links display an error instead of an unrelated default design',async()=>{
  const h=await harness('en',{hash:'#submission='+'a'.repeat(64),loadFails:true});
  assert.match(h.el('main').innerHTML,/Design unavailable/);
  assert.equal(h.el('preview').srcdoc,undefined);
  assert.equal(h.calls.length,1);
});
