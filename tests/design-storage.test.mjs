import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveHandler, createLoadHandler, validateDesign } from '../netlify/lib/design-storage.mjs';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6WQAAAABJRU5ErkJggg==';
const fixture = () => ({version:1,layout:'minimal',brand:'Montañez Diseño',heading:'A complete idea',description:'With the actual images.',cta:'Explore',font:'serif',accent:'#e32400',background:'#ffaa00',image:png,logo:png,sections:['gallery','contact'],order:['services','gallery','testimonials','contact'],serviceText:'Personal service',testimonial:'Sample text'});
const request = body => new Request('https://jemwebsolutions.com/.netlify/functions/save-design', {method:'POST',headers:{origin:'https://jemwebsolutions.com','content-type':'application/json'},body:JSON.stringify(body)});

function memoryStore() {
  const entries = new Map();
  return {entries, setJSON:async(key,value) => entries.set(key, structuredClone(value)),get:async key => entries.get(key) || null};
}

test('one submission preserves both uploaded images and restores the exact design', async () => {
  const store=memoryStore(),save=createSaveHandler(()=>store),load=createLoadHandler(()=>store),design=fixture();
  const response=await save(request({design,website:''}));
  assert.equal(response.status,201);
  const {id}=await response.json();
  assert.match(id,/^[a-f0-9]{64}$/);
  const reopened=await load(new Request(`https://jemwebsolutions.com/.netlify/functions/load-design?id=${id}`));
  assert.equal(reopened.status,200);
  assert.deepEqual((await reopened.json()).design,design);
  assert.equal(reopened.headers.get('cache-control'),'private, no-store');
  assert.equal(reopened.headers.get('x-robots-tag'),'noindex, nofollow');
});

test('contact details and unexpected fields do not appear in the stored design', async () => {
  const store=memoryStore(),save=createSaveHandler(()=>store);
  await save(request({design:{...fixture(),email:'private@example.com',name:'Private name',unexpected:'drop me'},email:'private@example.com'}));
  const stored=[...store.entries.values()][0];
  assert.deepEqual(Object.keys(stored).sort(),['createdAt','design']);
  assert(!JSON.stringify(stored).includes('private@example.com'));
  assert(!Object.hasOwn(stored.design,'unexpected'));
});

test('rejects invalid image payloads, hostile URLs and malformed design fields', () => {
  for (const changes of [{image:'https://evil.example/image.jpg'},{logo:'data:image/svg+xml;base64,PHN2Zy8+'},{image:'data:image/png;base64,YQ=='},{image:'data:image/png;base64,'+'A'.repeat(360000)},{layout:'__proto__'},{accent:'red;display:none'},{sections:['contact','contact']},{order:['contact','contact','contact','contact']},{heading:'x'.repeat(2001)}]) {
    assert.throws(()=>validateDesign({...fixture(),...changes}));
  }
});

test('only permits same-origin JSON saves and rejects honeypot submissions', async () => {
  const store=memoryStore(),save=createSaveHandler(()=>store);
  assert.equal((await save(new Request('https://jemwebsolutions.com/api',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'}))).status,403);
  assert.equal((await save(new Request('https://jemwebsolutions.com/api',{method:'POST',headers:{origin:'https://jemwebsolutions.com','content-type':'text/plain'},body:'{}'}))).status,415);
  assert.equal((await save(request({design:fixture(),website:'spam'}))).status,400);
  assert.equal((await save(new Request('https://jemwebsolutions.com/api'))).status,405);
  assert.equal(store.entries.size,0);
});

test('bounds streamed body size even when content-length is missing', async () => {
  const save=createSaveHandler(()=>memoryStore());
  const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('x'.repeat(800001)));controller.close();}});
  const oversized=new Request('https://jemwebsolutions.com/api',{method:'POST',headers:{origin:'https://jemwebsolutions.com','content-type':'application/json'},body,duplex:'half'});
  assert.equal((await save(oversized)).status,413);
  const malformed=new Request('https://jemwebsolutions.com/api',{method:'POST',headers:{origin:'https://jemwebsolutions.com','content-type':'application/json'},body:'{broken'});
  assert.equal((await save(malformed)).status,400);
});

test('read endpoints cannot enumerate storage or accept arbitrary paths', async () => {
  let reads=0;
  const load=createLoadHandler(()=>({get:async()=>{reads++;return null;}}));
  for(const id of ['', '../private','designs/test','a'.repeat(63),'G'.repeat(64)]) {
    assert.equal((await load(new Request('https://jemwebsolutions.com/api?id='+encodeURIComponent(id)))).status,404);
  }
  assert.equal(reads,0);
  assert.equal((await load(new Request('https://jemwebsolutions.com/api?id='+'a'.repeat(64)))).status,404);
});

test('storage failure returns an error rather than a success or incomplete design', async t => {
  t.mock.method(console,'error',()=>{});
  const broken=()=>{throw Error('Unavailable');};
  assert.equal((await createSaveHandler(broken)(request({design:fixture()}))).status,503);
  assert.equal((await createLoadHandler(broken)(new Request('https://jemwebsolutions.com/api?id='+'a'.repeat(64)))).status,503);
});
