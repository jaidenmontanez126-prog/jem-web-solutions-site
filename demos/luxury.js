const es = document.documentElement.lang === 'es';
const copy = (en, sp) => es ? sp : en;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  document.body.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), {threshold:0.08});
  document.querySelectorAll('.reveal').forEach(section => observer.observe(section));
}
function select(group, selected) {
  document.querySelectorAll(group).forEach(button => button.setAttribute('aria-pressed',String(button === selected)));
}
// ASTRA: exterior finishes and driving character are local concept controls.
const carStage = document.getElementById('car-stage');
if (carStage) {
  let finish = 'silver', drive = 'touring';
  const names = {silver:copy('Lunar silver','Plata lunar'),green:copy('Forest green','Verde bosque'),wine:copy('Oxblood','Borgoña'),black:copy('Obsidian','Obsidiana')};
  function commission() {
    document.getElementById('commission-summary').textContent = names[finish] + ' / ' + (drive === 'sport' ? 'Sport' : 'Touring');
    document.getElementById('drive-description').textContent = drive === 'sport' ? copy('A sharper response. A more immediate connection.','Una respuesta más precisa. Una conexión más inmediata.') : copy('An unhurried grand tour. Composed and effortless.','Un gran viaje sin prisa. Sereno y natural.');
    document.getElementById('power-readout').textContent = drive === 'sport' ? '640' : '580';
    document.getElementById('response-readout').textContent = drive === 'sport' ? '3.2' : '3.8';
  }
  document.querySelectorAll('button[data-finish]').forEach(button => button.addEventListener('click',()=> { finish = button.dataset.finish; carStage.dataset.finish = finish; select('button[data-finish]',button); commission(); }));
  document.querySelectorAll('button[data-drive]').forEach(button => button.addEventListener('click',()=> { drive = button.dataset.drive; select('button[data-drive]',button); commission(); }));
}
// ATELIER: native modal provides focus management and Escape-to-close support.
const editorialDialog = document.getElementById('editorial-dialog');
if (editorialDialog) {
  const frames = [...document.querySelectorAll('[data-lightbox]')];
  let frameIndex = 0;
  function showFrame() {
    const frame = frames[frameIndex];
    editorialDialog.dataset.frame = String(frameIndex);
    const image = document.getElementById('editorial-image');
    image.alt = frame.dataset.caption;
    image.style.objectPosition = ['65% center','75% 25%','80% 80%'][frameIndex];
    document.getElementById('editorial-caption').textContent = '0'+(frameIndex+1)+' / '+frame.dataset.caption;
  }
  frames.forEach((frame,index)=>frame.addEventListener('click',()=> { frameIndex=index; showFrame(); editorialDialog.showModal(); }));
  editorialDialog.querySelector('[data-close]').addEventListener('click',()=>editorialDialog.close());
  editorialDialog.querySelector('[data-gallery-prev]').addEventListener('click',()=> { frameIndex=(frameIndex+frames.length-1)%frames.length;showFrame(); });
  editorialDialog.querySelector('[data-gallery-next]').addEventListener('click',()=> { frameIndex=(frameIndex+1)%frames.length;showFrame(); });
  editorialDialog.addEventListener('click',event=> { if(event.target===editorialDialog) editorialDialog.close(); });
  editorialDialog.addEventListener('keydown',event=> {
    if(event.key==='ArrowRight') {event.preventDefault();frameIndex=(frameIndex+1)%frames.length;showFrame();}
    if(event.key==='ArrowLeft') {event.preventDefault();frameIndex=(frameIndex+frames.length-1)%frames.length;showFrame();}
  });
  const materials={
    silk:[copy('Silk. In motion.','Seda. En movimiento.'),copy('Fluid, luminous, quietly expressive. A study in the way light follows a fold.','Fluida, luminosa, discretamente expresiva. Un estudio de cómo la luz sigue un pliegue.')],
    wool:[copy('Wool. With intention.','Lana. Con intención.'),copy('Soft structure and tactile depth. A surface that makes a silhouette feel grounded.','Estructura suave y profundidad táctil. Una superficie que da presencia a la silueta.')],
    organza:[copy('Organza. Almost air.','Organza. Casi aire.'),copy('Translucent layers and a lightness that holds its shape. Volume, without weight.','Capas translúcidas y una ligereza que conserva su forma. Volumen, sin peso.')]
  };
  document.querySelectorAll('button[data-material]').forEach(button=>button.addEventListener('click',()=> {
    const material=button.dataset.material;select('button[data-material]',button);
    document.getElementById('material-preview').dataset.material=material;
    document.getElementById('material-title').textContent=materials[material][0];
    document.getElementById('material-description').textContent=materials[material][1];
  }));
}
// AUREL: atmosphere and room selection do not send data or create bookings.
const residenceHero = document.getElementById('residence-hero');
if (residenceHero) {
  document.querySelectorAll('button[data-light]').forEach(button=>button.addEventListener('click',()=> {residenceHero.dataset.light=button.dataset.light;select('button[data-light]',button);}));
  const rooms={
    living:['01',copy('The living salon.','El salón.'),'78',copy('An open space framed by floor-to-ceiling glass. The horizon becomes part of the room, and the room becomes part of the landscape.','Un espacio abierto enmarcado por ventanales de suelo a techo. El horizonte forma parte de la habitación, y la habitación forma parte del paisaje.')],
    kitchen:['02',copy('Room to gather.','Un lugar para reunirse.'),'46',copy('A sculptural island, a generous table, and an easy connection to the terrace. Made for long lunches that become evenings.','Una isla escultórica, una mesa generosa y una conexión natural con la terraza. Para almuerzos que se convierten en noches.')],
    suite:['03',copy('A private retreat.','Un refugio privado.'),'52',copy('A quiet suite with its own view of the coast. Natural materials, soft morning light, and space to simply be.','Una suite tranquila con su propia vista de la costa. Materiales naturales, luz suave por la mañana y espacio para simplemente estar.')],
    terrace:['04',copy('Life, outside.','La vida, al aire libre.'),'96',copy('A sheltered outdoor room that follows the rhythm of the sun. An extension of the home, open to the sea.','Un espacio exterior protegido que sigue el ritmo del sol. Una extensión de la casa, abierta al mar.')],
    pool:['05',copy('The edge of stillness.','El límite de la calma.'),'38',copy('Water meets horizon. An infinity-edge pool that reflects the sky and lets the architecture recede into the landscape.','El agua se encuentra con el horizonte. Una piscina infinita que refleja el cielo y deja que la arquitectura se funda con el paisaje.')]
  };
  document.querySelectorAll('button[data-room]').forEach(button=>button.addEventListener('click',()=> {
    const room=rooms[button.dataset.room];select('button[data-room]',button);
    document.getElementById('room-index').textContent=room[0]+' / '+copy('GROUND FLOOR','PLANTA BAJA');
    document.getElementById('room-title').textContent=room[1];document.getElementById('room-area').textContent=room[2];document.getElementById('room-description').textContent=room[3];
  }));
}
// MAISON ÉCLAT: use textContent so engraving remains plain text.
const ring = document.getElementById('ring-illustration');
if (ring) {
  let metal='gold';
  const metalNames={gold:copy('Yellow gold','Oro amarillo'),white:copy('White gold','Oro blanco'),rose:copy('Rose gold','Oro rosa')};
  const engraving=document.getElementById('engraving');
  const summary=document.getElementById('piece-summary');
  function hideSummary(){summary.hidden=true;}
  document.querySelectorAll('button[data-metal]').forEach(button=>button.addEventListener('click',()=>{metal=button.dataset.metal;ring.dataset.metal=metal;select('button[data-metal]',button);hideSummary();}));
  engraving.addEventListener('input',()=>{
    document.getElementById('engraving-preview').textContent=engraving.value.trim()||copy('Your story, in a few words.','Tu historia, en pocas palabras.');
    document.querySelector('label[for="engraving"] span').textContent=engraving.value.length+' / 18';hideSummary();
  });
  document.getElementById('ring-size').addEventListener('change',hideSummary);
  document.getElementById('save-piece').addEventListener('click',()=>{
    const words=engraving.value.trim();
    summary.textContent='Solène / '+metalNames[metal]+' / '+copy('US size ','Talla US ')+document.getElementById('ring-size').value+' / '+(words?copy('Engraving: “','Grabado: «')+words+copy('”','»'):copy('No engraving','Sin grabado'))+'. '+copy('Your design preview. Nothing has been ordered.','Tu vista previa. No se ha realizado ningún pedido.');
    summary.hidden=false;
  });
}

// A native, keyboard-accessible macro viewer for the jewelry campaign.
const jewelDialog=document.getElementById('jewel-dialog');
if(jewelDialog){
  const zoom=document.getElementById('jewel-zoom');
  document.getElementById('inspect-piece').addEventListener('click',()=>jewelDialog.showModal());
  document.getElementById('close-jewel').addEventListener('click',()=>jewelDialog.close());
  zoom.addEventListener('input',()=>{
    document.getElementById('jewel-macro').style.transform='scale('+(Number(zoom.value)/100)+')';
    document.getElementById('jewel-zoom-value').textContent=(Number(zoom.value)/100).toFixed(1)+'×';
  });
}
