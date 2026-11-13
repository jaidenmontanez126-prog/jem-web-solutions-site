(() => {
  'use strict';
  const es = document.documentElement.lang === 'es';
  const t = (en, sp) => es ? sp : en;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedQuery.matches;
  reducedQuery.addEventListener('change', (e) => { reduced = e.matches; });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  if (document.body.dataset.experience === 'orbit') {
    const canvas = $('#sculpture');
    const gl = canvas.getContext('webgl', { alpha:true, antialias:false, premultipliedAlpha:false });
    let scene = 0, paused = reduced, separated = false, light = false;
    let time = 0, angle = 0, velocity = 0, spread = 0, lightMix = 0, dragging = false, previousX = 0;
    let forceFrame = true, sculptureVisible = true;
    new IntersectionObserver(entries => {sculptureVisible=entries[0].isIntersecting;forceFrame=true;}).observe(canvas);
    const labels = [
      [t('Exhibit 01 / The infinite loop','Sala 01 / El bucle infinito'),t('Nothing here.<br>Stands still.','Nada aquí.<br>Se queda quieto.'),t('An impossible form. A space without walls. Turn the sculpture, change the light, and follow your curiosity.','Una forma imposible. Un espacio sin paredes. Gira la escultura, cambia la luz y sigue tu curiosidad.'),'CHROME / ORGANIC'],
      [t('Exhibit 02 / Order & disorder','Sala 02 / Orden y desorden'),t('Perfect order.<br>Until you touch it.','Orden perfecto.<br>Hasta que lo tocas.'),t('A structure made of little rebellions. Separate the form and watch a rigid system become an open constellation.','Una estructura de pequeñas rebeliones. Separa la forma y convierte un sistema rígido en una constelación abierta.'),'PORCELAIN / MODULAR'],
      [t('Exhibit 03 / A living matter','Sala 03 / Materia viva'),t('Some things.<br>Refuse a shape.','Hay cosas.<br>Que no tienen forma.'),t('Neither solid nor liquid. A digital organism that changes with time. Pause it to discover a form that will never happen twice.','Ni sólido ni líquido. Un organismo digital que cambia con el tiempo. Páusalo para descubrir una forma que nunca se repetirá.'),'IRIDESCENT / FLUID']
    ];
    function setScene(i) {
      if (scene === i && !forceFrame) return;
      scene = i;
      $('#orbit-label').textContent = labels[i][0];
      // These strings are fixed, local editorial copy; never user input.
      $('#orbit-heading').innerHTML = labels[i][1];
      $('#orbit-description').textContent = labels[i][2];
      $('#orbit-material').textContent = labels[i][3];
      $('#orbit-index').textContent = `0${i+1} / 03`;
      $$('.orbit-tab').forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      $('#orbit-status').textContent = labels[i][0];
      forceFrame = true;
    }
    $$('.orbit-tab').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.exhibit);
      setScene(i);
      const story = $('.orbit-story');
      const top = story.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({top:top+i*(story.offsetHeight-innerHeight)/2, behavior:'instant'});
    }));
    let scrollTick = false;
    addEventListener('scroll', () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        const r = $('.orbit-story').getBoundingClientRect();
        const progress = clamp(-r.top / Math.max(1, r.height-innerHeight), 0, 1);
        const next = Math.min(2, Math.floor(progress*2+.5));
        if (next !== scene) setScene(next);
        scrollTick = false;
      });
    }, {passive:true});
    const pauseBtn = $('#orbit-pause');
    function updatePause() {
      pauseBtn.setAttribute('aria-pressed',String(paused));
      pauseBtn.textContent = paused?t('Resume motion','Reanudar movimiento'):t('Pause motion','Pausar movimiento');
    }
    updatePause();
    pauseBtn.addEventListener('click', () => {paused=!paused;updatePause();forceFrame=true;});
    reducedQuery.addEventListener('change', (e) => {if(e.matches){paused=true;updatePause();forceFrame=true;}});
    $('#orbit-explode').addEventListener('click',(e)=>{
      separated=!separated;e.currentTarget.setAttribute('aria-pressed',String(separated));
      e.currentTarget.textContent=separated?t('Reassemble the form ↙','Recomponer la forma ↙'):t('Separate the form ↗','Separar la forma ↗');forceFrame=true;
    });
    $('#orbit-light').addEventListener('click',(e)=>{
      light=!light;document.body.classList.toggle('orbit-light',light);e.currentTarget.setAttribute('aria-pressed',String(light));forceFrame=true;
    });
    canvas.addEventListener('pointerdown',(e)=>{dragging=true;previousX=e.clientX;velocity=0;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',(e)=>{if(!dragging)return;velocity=(e.clientX-previousX)*.009;angle+=velocity;previousX=e.clientX;forceFrame=true;});
    const release=()=>{dragging=false;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    const vertex = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fragment = `precision highp float;
      uniform vec2 res; uniform float time; uniform float angle; uniform float spread; uniform float lightMode; uniform int scene;
      mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
      float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
      float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
      float map(vec3 p){
        p.xz=rot(angle+time*.15)*p.xz;p.yz=rot(.53+sin(time*.16)*.15)*p.yz;
        if(scene==0){
          p.xy=rot(.35)*p.xy;
          float sector=6.2831853/8.;float a=atan(p.y,p.x);float id=floor((a+sector*.5)/sector);
          vec3 q=p;q.xy=rot(id*sector)*q.xy;q.x-=spread*.36;
          float tor=length(vec2(length(q.xy)-.98,q.z))-.30;
          float gap=abs(atan(q.y,q.x))-.352;
          return max(tor,gap*(.4+spread*.7));
        }
        if(scene==1){
          p.xy=rot(.3)*p.xy;vec3 q=p;float cell=.62+spread*.26;
          q=mod(q+cell*.5,cell)-cell*.5;
          float blocks=box(q,vec3(.245))-.028;
          float outer=box(p,vec3(1.02+spread*.24));
          float hole=-box(p,vec3(.43+spread*.1,.43+spread*.1,2.));
          return max(max(blocks,outer),hole);
        }
        float d=length(p)-.76;
        for(int i=0;i<5;i++){
          float fi=float(i);vec3 c=vec3(sin(fi*2.3+time*.5),cos(fi*1.7+time*.4),sin(fi*1.9+time*.3))*(.72+spread*.55);
          d=smin(d,length(p-c)-(.44+sin(time*.6+fi)*.09),.42-spread*.18);
        }
        return d;
      }
      vec3 normal(vec3 p){vec2 e=vec2(.001,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
      vec3 env(vec3 r){
        float stripe=pow(max(0.,sin(r.x*3.+r.y*2.4)),10.);
        float strip2=pow(max(0.,sin(r.z*4.-r.y*2.)),22.);
        vec3 base=mix(vec3(.055,.075,.08),vec3(.75,.85,.80),smoothstep(-.2,.8,r.y));
        return base+stripe*vec3(1.5,1.65,1.4)+strip2*vec3(.55,.7,.85);
      }
      void main(){
        vec2 uv=(gl_FragCoord.xy*2.-res)/res.y;
        vec3 ro=vec3(0.,0.,5.2);vec3 rd=normalize(vec3(uv*1.5,-3.4));
        float travel=0.;vec3 p=ro;bool hit=false;
        for(int i=0;i<82;i++){p=ro+rd*travel;float d=map(p);if(d<.0015){hit=true;break;}travel+=d*.8;if(travel>9.)break;}
        if(!hit){gl_FragColor=vec4(0.);return;}
        vec3 n=normal(p);vec3 r=reflect(rd,n);vec3 l=normalize(vec3(-3.,4.,4.));
        float diff=max(0.,dot(n,l));float fres=pow(1.-max(0.,dot(n,-rd)),4.);
        vec3 tint=scene==2?(.65+.35*cos(vec3(0.,2.,4.)+p.y*1.6+time*.1)):vec3(.77,.84,.73);
        vec3 col=env(r)*tint*(scene==1?.55:.8)+diff*.15;
        col+=pow(max(0.,dot(reflect(-l,n),-rd)),65.)*1.2;
        col+=fres*vec3(.3,.45,.3);
        float ao=clamp(map(p+n*.15)/.15,.25,1.);col*=.6+.4*ao;
        col=mix(col,col*.72+vec3(.10,.15,.07),lightMode*.4);
        col=pow(col/(col+vec3(.55)),vec3(.75));
        gl_FragColor=vec4(col,1.);
      }`;
    let program;
    if(gl){
      try{
        const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
        program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader linking failed');
        gl.useProgram(program);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
      }catch(err){program=null;console.warn('ORBIT uses its fallback rendering:',err.message);}
    }
    const fallback=$('.sculpture-fallback');
    if(!program){canvas.hidden=true;fallback.classList.add('visible');$('#orbit-status').textContent=t('A simplified sculpture is shown on this device.','Este dispositivo muestra una escultura simplificada.');}
    const uniforms={};if(program)['res','time','angle','spread','lightMode','scene'].forEach(k=>uniforms[k]=gl.getUniformLocation(program,k));
    function resize(){if(!program)return;const r=canvas.getBoundingClientRect();const scale=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(r.width*scale);canvas.height=Math.round(r.height*scale);gl.viewport(0,0,canvas.width,canvas.height);forceFrame=true;}
    addEventListener('resize',resize);resize();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.hidden=true;fallback.classList.add('visible');});
    let previous=0;
    function render(now){
      requestAnimationFrame(render);
      if(document.hidden||!sculptureVisible)return;
      const dt=Math.min((now-previous)/1000,.05)||.016;previous=now;
      const active=!paused&&!reduced;
      if(active)time+=dt;
      if(!dragging&&!reduced){angle+=velocity;velocity*=.94;}
      const target=separated?1:0;
      const changing=Math.abs(spread-target)>.002||Math.abs(lightMix-(light?1:0))>.002;
      spread=reduced?target:spread+(target-spread)*.075;lightMix=reduced?(light?1:0):lightMix+((light?1:0)-lightMix)*.08;
      if(!active&&!changing&&!forceFrame&&Math.abs(velocity)<.001)return;
      if(program&&!canvas.hidden){gl.uniform2f(uniforms.res,canvas.width,canvas.height);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.angle,angle);gl.uniform1f(uniforms.spread,spread);gl.uniform1f(uniforms.lightMode,lightMix);gl.uniform1i(uniforms.scene,scene);gl.drawArrays(gl.TRIANGLES,0,6);}
      else{fallback.style.transform=`rotateX(30deg) rotateY(${angle*30+time*12}deg) scale(${1+spread*.3})`;fallback.style.borderRadius=scene===1?'15%':'50%';fallback.style.borderColor=scene===2?'#b9a1d5':'#bcceba';}
      forceFrame=false;
    }
    requestAnimationFrame(render);
  }

  if(document.body.dataset.experience==='form'){
    const board=$('#physics-board'),tiles=$$('.physics-tile');
    let gravity=false,w=0,h=0,drag=null,last=0;
    const pieces=tiles.map((el,i)=>({el,x:0,y:0,vx:0,vy:0,angle:(i-2)*7,spin:0,homeX:0,homeY:0}));
    function layout(){
      w=board.clientWidth;h=board.clientHeight;
      pieces.forEach((p,i)=>{const tw=p.el.offsetWidth,th=p.el.offsetHeight;
        p.homeX=clamp(w*(.08+i*.17)-tw*.1,8,w-tw-8);
        p.homeY=h*(i%2?.48:.17)-th*.1;
        if(w<600){p.homeX=(w-tw)*(i%2?.95:.05);p.homeY=25+Math.floor(i/2)*(h-th-50)/2;}
        p.x=p.homeX;p.y=p.homeY;p.vx=p.vy=p.spin=0;p.angle=(i-2)*7;draw(p);
      });
    }
    function draw(p){p.el.style.transform=`translate(${p.x}px,${p.y}px) rotate(${p.angle}deg)`;}
    const reset=()=>{gravity=false;$('#gravity').setAttribute('aria-pressed','false');$('#gravity').textContent=t('Turn gravity on ↓','Activar gravedad ↓');layout();$('#board-status').textContent=t('BACK IN FORM.','TODO EN SU SITIO.');};
    $('#reset-board').addEventListener('click',reset);
    $('#gravity').addEventListener('click',e=>{gravity=!gravity;e.currentTarget.setAttribute('aria-pressed',String(gravity));e.currentTarget.textContent=gravity?t('Turn gravity off ↑','Desactivar gravedad ↑'):t('Turn gravity on ↓','Activar gravedad ↓');pieces.forEach((p,i)=>{p.vx+=(i-2)*.5;});$('#board-status').textContent=gravity?t('GRAVITY IS IN CHARGE.','LA GRAVEDAD MANDA.'):t('FLOAT A LITTLE.','FLOTA UN POCO.');});
    pieces.forEach(p=>{
      p.el.addEventListener('pointerdown',e=>{
        const r=board.getBoundingClientRect();drag={p,dx:e.clientX-r.left-p.x,dy:e.clientY-r.top-p.y,lastX:e.clientX,lastY:e.clientY,lastTime:performance.now()};
        p.vx=p.vy=p.spin=0;p.el.setPointerCapture(e.pointerId);p.el.style.zIndex='6';
      });
      p.el.addEventListener('pointermove',e=>{
        if(!drag||drag.p!==p)return;
        const r=board.getBoundingClientRect(),now=performance.now(),dt=Math.max(8,now-drag.lastTime)/16.67;
        p.vx=clamp((e.clientX-drag.lastX)/dt,-25,25);p.vy=clamp((e.clientY-drag.lastY)/dt,-25,25);
        p.x=clamp(e.clientX-r.left-drag.dx,0,w-p.el.offsetWidth);p.y=clamp(e.clientY-r.top-drag.dy,0,h-p.el.offsetHeight);
        p.angle=clamp(p.vx*.8,-20,20);drag.lastX=e.clientX;drag.lastY=e.clientY;drag.lastTime=now;draw(p);
      });
      const release=(e)=>{if(!drag||drag.p!==p)return;if(performance.now()-drag.lastTime>100||reduced)p.vx=p.vy=0;p.spin=p.vx*.04;p.el.style.zIndex='';drag=null;};
      p.el.addEventListener('pointerup',release);p.el.addEventListener('pointercancel',release);
      p.el.addEventListener('keydown',e=>{const d={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!d)return;e.preventDefault();p.x=clamp(p.x+d[0],0,w-p.el.offsetWidth);p.y=clamp(p.y+d[1],0,h-p.el.offsetHeight);p.vx=p.vy=0;draw(p);});
    });
    const observer=new ResizeObserver(layout);observer.observe(board);
    function tick(now){requestAnimationFrame(tick);if(document.hidden)return;const dt=Math.min((now-last)/16.67,2)||1;last=now;
      pieces.forEach(p=>{if(drag&&drag.p===p)return;
        if(gravity)p.vy+=.24*dt;
        p.vx*=Math.pow(.99,dt);p.vy*=Math.pow(gravity?.998:.99,dt);
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle=clamp(p.angle+p.spin*dt,-35,35);p.spin*=.99;
        const maxX=w-p.el.offsetWidth,maxY=h-p.el.offsetHeight;
        if(p.x<5){p.x=5;p.vx=Math.abs(p.vx)*.65;}if(p.x>maxX-5){p.x=maxX-5;p.vx=-Math.abs(p.vx)*.65;}
        if(p.y<5){p.y=5;p.vy=Math.abs(p.vy)*.65;}if(p.y>maxY-5){p.y=maxY-5;p.vy=-Math.abs(p.vy)*.55;p.vx*=.95;p.spin*=.8;if(Math.abs(p.vy)<.6)p.vy=0;}
      });
      // Axis-aligned contacts keep independently thrown pieces from passing through one another.
      for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){
        const a=pieces[i],b=pieces[j];if(drag&&(drag.p===a||drag.p===b))continue;
        if(Math.abs(a.vx)+Math.abs(a.vy)+Math.abs(b.vx)+Math.abs(b.vy)<.4)continue;
        const dx=(a.x+a.el.offsetWidth/2)-(b.x+b.el.offsetWidth/2),dy=(a.y+a.el.offsetHeight/2)-(b.y+b.el.offsetHeight/2);
        const ox=(a.el.offsetWidth+b.el.offsetWidth)/2-Math.abs(dx),oy=(a.el.offsetHeight+b.el.offsetHeight)/2-Math.abs(dy);
        if(ox>0&&oy>0){if(ox<oy){const s=dx<0?-1:1;a.x+=s*ox*.5;b.x-=s*ox*.5;[a.vx,b.vx]=[b.vx*.65,a.vx*.65];}else{const s=dy<0?-1:1;a.y+=s*oy*.5;b.y-=s*oy*.5;[a.vy,b.vy]=[b.vy*.55,a.vy*.55];}}
      }
      pieces.forEach(p=>{p.x=clamp(p.x,5,w-p.el.offsetWidth-5);p.y=clamp(p.y,5,h-p.el.offsetHeight-5);draw(p);});
    }
    requestAnimationFrame(tick);
    $$('.work-toggle').forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));b.textContent=open?'−':'+';b.closest('.form-work').classList.toggle('is-open',open);}));
  }

  if(document.body.dataset.experience==='signal'){
    const canvas=$('#signal-canvas'),ctx=canvas.getContext('2d');
    let width=0,height=0,frequency=220,movement=.5,wave='sine',playing=false;
    let ac,osc,gain,analyser,buffer,phase=0,last=0,mouse={x:.5,y:.5},visible=true,scopeVisible=false;
    const scope=$('#signal-scope'),scopeCtx=scope.getContext('2d');
    const sound=$('#sound-toggle');
    const waveFunction=(x)=>wave==='triangle'?2/Math.PI*Math.asin(Math.sin(x)):wave==='sawtooth'?(2*((x/(Math.PI*2))%1+1)%2)-1:Math.sin(x);
    function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);scope.width=Math.round(scope.clientWidth*dpr);scope.height=Math.round(scope.clientHeight*dpr);draw();}
    addEventListener('resize',resize);
    canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width;mouse.y=(e.clientY-r.top)/r.height;draw();});
    function draw(){if(!ctx)return;ctx.clearRect(0,0,width,height);
      let energy=1;
      if(playing&&analyser){analyser.getByteTimeDomainData(buffer);let sum=0;for(let i=0;i<buffer.length;i++)sum+=Math.abs(buffer[i]-128);energy=.75+sum/buffer.length/70;}
      const cycles=1.6+frequency/100;
      for(let row=0;row<42;row++){
        const depth=row/41,centerY=height*.5+(depth-.5)*height*.48;
        ctx.beginPath();
        for(let i=0;i<=230;i++){
          const x=i/230*width,normal=i/230;
          const envelope=Math.pow(Math.sin(normal*Math.PI),1.3);
          const shape=waveFunction(normal*Math.PI*cycles-phase+depth*1.7);
          const amp=height*.31*(.55+movement*.55)*envelope*energy;
          const pointer=Math.exp(-Math.pow((normal-mouse.x)*5,2))*(mouse.y-.5)*height*.45;
          const y=centerY+shape*amp*Math.sin(depth*Math.PI)+pointer*envelope;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`rgba(${215+depth*30},${240+depth*10},${120+depth*90},${.18+Math.sin(depth*Math.PI)*.6})`;
        ctx.lineWidth=depth>.35&&depth<.65?1.2:.7;ctx.stroke();
      }
      if(scopeCtx){scopeCtx.clearRect(0,0,scope.width,scope.height);scopeCtx.drawImage(canvas,0,0,scope.width,scope.height);}
    }
    function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05)||.016;last=now;if(document.hidden||(!visible&&!scopeVisible))return;if(!reduced){phase+=dt*(.5+movement*2.5);draw();}}
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(canvas);
    new IntersectionObserver(entries=>{scopeVisible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(scope);
    function update(){frequency=Number($('#frequency').value);movement=Number($('#movement').value)/100;$('#frequency-value').textContent=frequency;$('#movement-value').textContent=Math.round(movement*100)+'%';if(osc)osc.frequency.setTargetAtTime(frequency,ac.currentTime,.08);draw();}
    ['frequency','movement'].forEach(id=>$('#'+id).addEventListener('input',()=>{update();$$('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));}));
    $$('[data-wave]').forEach(b=>b.addEventListener('click',()=>{wave=b.dataset.wave;$$('[data-wave]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));if(osc)osc.type=wave;draw();}));
    $$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const presets=[[110,22,'sine'],[330,85,'triangle'],[174,40,'sine']];const p=presets[Number(b.dataset.preset)];$('#frequency').value=p[0];$('#movement').value=p[1];wave=p[2];if(osc)osc.type=wave;$$('[data-wave]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.wave===wave)));$$('[data-preset]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));update();}));
    function volume(){const v=Number($('#volume').value);$('#volume-value').textContent=v+'%';if(gain)gain.gain.setTargetAtTime(playing?v/100*.25:0,ac.currentTime,.12);}
    $('#volume').addEventListener('input',volume);
    function state(){sound.setAttribute('aria-pressed',String(playing));sound.setAttribute('aria-label',playing?t('Mute sound','Silenciar sonido'):t('Enable sound','Activar sonido'));sound.textContent=playing?'Ⅱ':'▶';$('#synth-state').textContent=playing?t('SOUND ON','SONIDO ACTIVADO'):t('SOUND OFF','SONIDO APAGADO');$('#sound-status').textContent=playing?t('YOU’RE ON THE AIR.','ESTÁS AL AIRE.'):t('READY WHEN YOU ARE.','CUANDO TÚ QUIERAS.');volume();}
    sound.addEventListener('click',async()=>{
      sound.disabled=true;
      try{
        if(!ac){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('No audio support');ac=new Audio();osc=ac.createOscillator();gain=ac.createGain();gain.gain.value=0;analyser=ac.createAnalyser();analyser.fftSize=256;buffer=new Uint8Array(analyser.fftSize);osc.type=wave;osc.frequency.value=frequency;osc.connect(gain);gain.connect(analyser);analyser.connect(ac.destination);osc.start();}
        if(ac.state==='suspended')await ac.resume();playing=!playing;state();
      }catch(e){playing=false;state();$('#sound-status').textContent=t('Audio unavailable. The visual instrument still works.','Audio no disponible. El instrumento visual sigue funcionando.');}
      finally{sound.disabled=false;}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;state();if(ac)ac.suspend();}});
    addEventListener('pagehide',()=>{if(ac)ac.close();});
    resize();requestAnimationFrame(tick);
  }
})();
