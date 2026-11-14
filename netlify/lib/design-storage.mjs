import { randomBytes } from 'node:crypto';

const layouts = ['cinematic', 'editorial', 'bold', 'minimal'];
const sections = ['services', 'gallery', 'testimonials', 'contact'];
const samples = ['assets/luxury/residence.jpg', 'assets/luxury/fashion.jpg', 'assets/luxury/automotive.jpg', 'assets/workspace.jpg'];
const maxBytes = 2300000;
const storedImagePattern = /^\/\.netlify\/functions\/load-design-image\?id=[a-f0-9]{64}$/;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow'
};
const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});

function validImage(value, optional, limit = 360000) {
  if (value === '') return optional;
  if (samples.includes(value) || (typeof value === 'string' && storedImagePattern.test(value))) return true;
  if (typeof value !== 'string' || value.length >= limit) return false;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (match[1] === 'jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
}

// Keep only design fields. Contact details never go into the shared preview store.
export function validateDesign(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 1 || !layouts.includes(raw.layout)) throw Error('Invalid design');
  const design = {version:1, layout:raw.layout};
  for (const field of ['brand','heading','description','cta','serviceText','testimonial']) {
    if (typeof raw[field] !== 'string' || raw[field].length > 2000) throw Error('Invalid text');
    design[field] = raw[field];
  }
  for (const field of ['accent','background']) {
    if (typeof raw[field] !== 'string' || !/^#[a-f\d]{6}$/i.test(raw[field])) throw Error('Invalid color');
    design[field] = raw[field];
  }
  if (!['serif','sans-serif','monospace'].includes(raw.font)) throw Error('Invalid font');
  design.font = raw.font;
  if (!Array.isArray(raw.sections) || raw.sections.length > 4 || !raw.sections.every(s => sections.includes(s)) || new Set(raw.sections).size !== raw.sections.length) throw Error('Invalid sections');
  if (!Array.isArray(raw.order) || raw.order.length !== 4 || new Set(raw.order).size !== 4 || !raw.order.every(s => sections.includes(s))) throw Error('Invalid order');
  design.sections = [...raw.sections];
  design.order = [...raw.order];
  for (const field of ['image','logo']) {
    if (!validImage(raw[field], field === 'logo')) throw Error('Invalid image');
    design[field] = raw[field];
  }
  if (raw.gallery !== undefined && !Array.isArray(raw.gallery)) throw Error('Invalid gallery');
  design.gallery = (raw.gallery || []).map(photo => {
    if (!photo || typeof photo.name !== 'string' || photo.name.length > 160 || !validImage(photo.src, false, 160000) || samples.includes(photo.src)) throw Error('Invalid gallery photo');
    return {src:photo.src, name:photo.name};
  });
  return design;
}

async function readLimited(request) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw Error('Too large');
  const reader = request.body?.getReader();
  if (!reader) throw Error('No body');
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {await reader.cancel(); throw Error('Too large');}
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {reader.releaseLock();}
}

export function createSaveHandler(getStore, makeId = () => randomBytes(32).toString('hex')) {
  return async request => {
    if (request.method !== 'POST') return reply(405, {error:'Method not allowed'});
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return reply(403, {error:'Invalid origin'});
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415, {error:'Expected JSON'});
    let design;
    try {
      const body = await readLimited(request);
      if (body.website) return reply(400, {error:'Invalid submission'});
      design = validateDesign(body.design);
    } catch(error) {return reply(error.message === 'Too large' ? 413 : 400, {error:'Invalid design submission'});}
    try {
      const id = makeId();
      await getStore().setJSON(`designs/${id}`, {design, createdAt:new Date().toISOString()});
      return reply(201, {id});
    } catch {
      // Never log the submitted photos or capability link.
      console.error('Design storage write failed');
      return reply(503, {error:'Design storage is temporarily unavailable'});
    }
  };
}

export function createLoadHandler(getStore) {
  return async request => {
    if (request.method !== 'GET') return reply(405, {error:'Method not allowed'});
    const id = new URL(request.url).searchParams.get('id');
    if (!/^[a-f0-9]{64}$/.test(id || '')) return reply(404, {error:'Design not found'});
    try {
      const entry = await getStore().get(`designs/${id}`, {type:'json', consistency:'strong'});
      if (!entry) return reply(404, {error:'Design not found'});
      return reply(200, {design:validateDesign(entry.design)});
    } catch {
      console.error('Design storage read failed');
      return reply(503, {error:'Design could not be opened right now'});
    }
  };
}


export function createSaveImageHandler(getStore, makeId = () => randomBytes(32).toString('hex')) {
  return async request => {
    if (request.method !== 'POST') return reply(405,{error:'Method not allowed'});
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply(403,{error:'Invalid origin'});
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415,{error:'Expected JSON'});
    let src;
    try {
      const body=await readLimited(request);src=body.src;
      if (typeof src !== 'string' || !src.startsWith('data:') || !validImage(src,false)) throw Error('Invalid photo');
    } catch {return reply(400,{error:'Invalid photo'});}
    try {
      const id=makeId();
      await getStore().setJSON(`images/${id}`,{src});
      return reply(201,{id});
    } catch {console.error('Design image storage write failed');return reply(503,{error:'Photo storage unavailable'});}
  };
}

export function createLoadImageHandler(getStore) {
  return async request => {
    if(request.method!=='GET')return reply(405,{error:'Method not allowed'});
    const id=new URL(request.url).searchParams.get('id');
    if(!/^[a-f0-9]{64}$/.test(id || ''))return reply(404,{error:'Photo not found'});
    try {
      const image=await getStore().get(`images/${id}`,{type:'json',consistency:'strong'});
      if(!image)return reply(404,{error:'Photo not found'});
      if(typeof image.src!=='string' || !image.src.startsWith('data:') || !validImage(image.src,false))throw Error('Invalid stored image');
      const [,type,base64]=/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(image.src);
      return new Response(Buffer.from(base64,'base64'),{headers:{...headers,'Content-Type':type,'Content-Security-Policy':"default-src 'none'; sandbox"}});
    }catch{console.error('Design image storage read failed');return reply(503,{error:'Photo unavailable'});}
  };
}
