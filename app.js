const $=s=>document.querySelector(s),fmt=n=>'$'+n.toFixed(2),P=window.PRODUCTS;
const sets={clothes:P.filter(p=>!p.bag),bags:P.filter(p=>p.bag)};
const haptic=()=>{try{navigator.vibrate&&navigator.vibrate(6)}catch(e){}};
const stage=$('#stage'),track=$('#track'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// preload + decode every cutout up front
P.forEach(p=>{const i=new Image();i.decoding='async';i.src=p.cut;i.decode&&i.decode().catch(()=>{})});
// seeded random so the closet looks the same each visit
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
let mode='clothes',items=[],H=[],pos=0,vel=0,target=0,railA=0,prevVel=0,drag=null,S=260,railY=120,shown=-1;
function build(){items=sets[mode];document.body.classList.toggle('bags',mode=='bags');seed=7;
 track.innerHTML=items.map((p,i)=>mode=='bags'
  ?`<div class="item bag"><img src="${p.cut}" alt="${p.name}" draggable="false" decoding="async"><div class="ped"></div></div>`
  :`<div class="item"><div class="cloth"><img src="${p.cut}" alt="${p.name}" draggable="false" decoding="async"><div class="dim" style="-webkit-mask-image:url('${p.cut}');mask-image:url('${p.cut}')"></div></div></div>`).join('');
 H=[...track.children].map((el,i)=>({el,cloth:el.querySelector('.cloth'),dim:el.querySelector('.dim'),
  rest:(rnd()-.5)*0.09,/* ±2.6° */ th:0,om:0,w0:Math.sqrt(26)*(.86+rnd()*.28),c:2.2+rnd()*.9,depth:.93+rnd()*.05,jit:(rnd()-.5)*12,z:-1,vis:null}));
 H.forEach(h=>h.th=h.rest);pos=target=0;vel=0;shown=-1;layout();info()}
function layout(){const vw=innerWidth,top=stage.getBoundingClientRect().top;
 const hb=$('header.top').getBoundingClientRect().bottom,it=$('.info').getBoundingClientRect().top;
 railY=Math.round(hb+(vw<900?30:36));stage.style.setProperty('--railY',(railY-top)+'px');
 const desk=vw>=900;S=desk?Math.min(vw*.25,380):vw*.64;
 H.forEach((h,i)=>{const p=items[i],e=h.el;
  if(mode=='bags'){S=desk?Math.min(vw*.3,420):vw*.8;const w=Math.min(desk?340:vw*.66,(it-railY-120)/p.ar),hh=w*p.ar;
   Object.assign(e.style,{width:w+'px',height:hh+'px',marginLeft:-w/2+'px',top:(it-top-70-hh)+'px'});h.px=w/2;h.py=hh;e.style.transformOrigin='50% 100%';return}
  const avail=it-railY-20,[nx,ny]=p.hook,w=Math.min(desk?Math.min(vw*.3,440):vw*.8,avail/(p.ar*(1-ny))),hh=w*p.ar,px=nx*w,py=ny*hh;
  Object.assign(e.style,{width:w+'px',height:hh+'px',marginLeft:-px+'px',top:(railY-top-py)+'px',transformOrigin:`${px}px ${py}px`});
  h.cloth.style.transformOrigin=`${px}px ${py}px`;h.L=hh*.5})}
addEventListener('resize',layout);
const idx=()=>Math.max(0,Math.min(items.length-1,Math.round(pos)));
function info(){const i=idx();if(i===shown)return;shown=i;const p=items[i],n=items.length;
 $('#idx').textContent=String(i+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');$('#name').textContent=p.name.replace(/\s*\((.*)\)/,' — $1').toLowerCase().replace(/(^|\s|—\s)\S/g,c=>c.toUpperCase());
 $('#price').textContent=fmt(p.price);const ok=p.variants.some(v=>v.ok);$('#shop').textContent=ok?'Add':'Sold out';
 const box=$('.info');box.classList.remove('fade');void box.offsetWidth;box.classList.add('fade');
 H.forEach((h,j)=>h.el.setAttribute('aria-hidden',j!=i))}
function go(i){const n=Math.max(0,Math.min(items.length-1,i));if(n!=target){target=n;haptic()}}
// ---- physics: one continuous rail, every hanger is its own damped pendulum ----
let last=performance.now();
function tick(t){const dt=Math.min(.032,(t-last)/1000)||.016;last=t;const N=items.length;
 if(!drag){const a=-130*(pos-target)-22*vel;vel+=a*dt;pos+=vel*dt}
 // rail acceleration in px/s², low-passed
 const A=(vel-prevVel)/dt*S;prevVel=vel;railA+=(A-railA)*Math.min(1,dt*18);
 const hang=mode!='bags';
 for(let i=0;i<N;i++){const h=H[i],d=i-pos,ad=Math.abs(d);
  if(ad>3.2){if(h.vis!==false){h.el.style.visibility='hidden';h.vis=false}continue}
  if(h.vis!==true){h.el.style.visibility='visible';h.vis=true}
  if(hang){// θ'' = -ω²(θ-rest) - cθ' + a/L  (pivot accel → garment trails behind)
   let acc=-h.w0*h.w0*(h.th-h.rest)-h.c*h.om+railA/h.L*.16;
   if(i>0&&H[i-1].vis)acc+=3.5*(H[i-1].th-h.th);if(i<N-1&&H[i+1].vis)acc+=3.5*(H[i+1].th-h.th);// neighbours nudge
   h.om+=acc*dt;h.th+=h.om*dt;if(h.th>.19){h.th=.19;h.om*=-.3}if(h.th<-.19){h.th=-.19;h.om*=-.3}}
  const f=Math.min(ad,1),s=hang?(1-f*(1-h.depth)):1-f*.1,x=d*S+(hang?h.jit*f:0);
  h.el.style.transform=hang?`translate3d(${x.toFixed(1)}px,0,0) rotate(${(h.th*57.3).toFixed(2)}deg) scale(${s.toFixed(3)})`
   :`translate3d(${x.toFixed(1)}px,0,0) scale(${s.toFixed(3)}) rotateY(${Math.max(-18,Math.min(18,-vel*6)).toFixed(1)}deg)`;
  if(hang){h.cloth.style.transform=`skewX(${Math.max(-3,Math.min(3,h.om*1.6)).toFixed(2)}deg)`;h.dim.style.opacity=(Math.min(ad,1.6)*.38).toFixed(2)}
  else h.el.style.opacity=(1-Math.min(ad,1.4)*.45).toFixed(2);
  const z=20-Math.round(ad*4);if(z!==h.z){h.el.style.zIndex=z;h.z=z}}
 info();requestAnimationFrame(tick)}
requestAnimationFrame(tick);
// ---- input: rail follows the finger 1:1 ----
let sx,sp,lx,lt,moved,vs=[];
stage.addEventListener('pointerdown',e=>{if(e.target.closest('.nav'))return;drag=1;sx=lx=e.clientX;sp=pos;lt=performance.now();moved=0;vs=[];stage.setPointerCapture(e.pointerId)});
stage.addEventListener('pointermove',e=>{if(!drag)return;const now=performance.now();moved=Math.max(moved,Math.abs(e.clientX-sx));
 let np=sp-(e.clientX-sx)/S;const N=items.length-1;if(np<0)np=np*.3;if(np>N)np=N+(np-N)*.3;
 const dtm=Math.max(.004,(now-lt)/1000);vs.push([now,(np-pos)/dtm]);vs=vs.filter(v=>now-v[0]<90);vel=vs.reduce((s,v)=>s+v[1],0)/vs.length;pos=np;lx=e.clientX;lt=now});
const up=e=>{if(!drag)return;drag=null;if(performance.now()-lt>80)vel=0;
 if(moved<6){const el=e.target.closest&&document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains('item'));
  const j=H.findIndex(h=>h.el===el);if(j>-1&&j!=idx())go(j);else if(j==idx())openPDP();return}
 // momentum with friction, then snap to nearest hanger
 const proj=pos+vel*.28;target=Math.max(0,Math.min(items.length-1,Math.round(proj)));haptic()};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
addEventListener('keydown',e=>{if(document.querySelector('.sheet.on'))return;if(e.key=='ArrowRight')go(target+1);if(e.key=='ArrowLeft')go(target-1);if(e.key=='Enter')openPDP()});
$('#prev').onclick=()=>go(target-1);$('#next').onclick=()=>go(target+1);
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{if(b.dataset.mode==mode)return;mode=b.dataset.mode;document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x==b));build()});
// ---- sheets ----
const scrim=$('#scrim');let open=null,lastFocus;
function sheet(id){if(open)open.classList.remove('on');lastFocus=lastFocus||document.activeElement;open=$(id);open.classList.add('on');scrim.classList.add('on');setTimeout(()=>(open.querySelector('.cta,button')||open).focus({preventScroll:true}),350)}
function closeSheet(){if(!open)return;open.classList.remove('on');scrim.classList.remove('on');open=null;lastFocus&&lastFocus.focus({preventScroll:true});lastFocus=null}
scrim.onclick=closeSheet;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeSheet);addEventListener('keydown',e=>{if(e.key=='Escape')closeSheet()});
document.querySelectorAll('.sheet').forEach(s=>{let y0=null;s.addEventListener('touchstart',e=>{if(s.scrollTop<=0)y0=e.touches[0].clientY},{passive:true});s.addEventListener('touchmove',e=>{if(y0==null)return;const dy=e.touches[0].clientY-y0;if(dy>0)s.style.transform=`translateY(${dy}px)`},{passive:true});s.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0;s.style.transform='';y0=null;if(dy>110)closeSheet()})});
let cur,size;
function openPDP(){cur=items[idx()];$('#pName').textContent=$('#name').textContent;$('#pPrice').textContent=fmt(cur.price);$('#pDesc').textContent=cur.desc||'';
 $('#pNote').textContent=(cur.ai?'First image is a rendered hanging view. ':'')+'Swipe for photographs.';$('#pGal').innerHTML=[cur.cut,...cur.imgs].map(s=>`<img src="${s}" alt="${cur.name}" loading="lazy" decoding="async">`).join('');
 const vs=cur.variants;size=(vs.find(v=>v.ok)||vs[0]);
 $('#pSizes').innerHTML=vs.map(v=>`<button role="radio" aria-checked="${v===size}" ${v.ok?'':'disabled'} data-id="${v.id}">${v.t=='Default Title'?'One size':v.t}</button>`).join('');
 const ok=vs.some(v=>v.ok);$('#pAdd').disabled=!ok;$('#pAdd').textContent=ok?'Add to bag':'Sold out';sheet('#pdp')}
$('#pSizes').onclick=e=>{const b=e.target.closest('button');if(!b)return;size=cur.variants.find(v=>v.id==b.dataset.id);$('#pSizes').querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',x==b))};
$('#shop').onclick=()=>openPDP();
let cart=JSON.parse(localStorage.getItem('tm_bag')||'[]');const find=id=>{for(const p of P)for(const v of p.variants)if(v.id==id)return[p,v]};
cart=cart.filter(l=>find(l.v));const save=()=>{localStorage.setItem('tm_bag',JSON.stringify(cart));draw()};
$('#pAdd').onclick=()=>{const l=cart.find(l=>l.v==size.id);l?l.q++:cart.push({v:size.id,q:1});save();haptic();const b=$('#count');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');setTimeout(closeSheet,200)};
const rows=ed=>cart.map((l,i)=>{const[p,v]=find(l.v);return`<li><img src="${p.cut}" alt=""><div class="t"><b>${p.name}</b><br><small>${v.t=='Default Title'?'One size':v.t} — ${fmt(p.price)}</small></div>${ed?`<div class="step"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button>${l.q}<button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>`:`<small>× ${l.q}</small>`}</li>`}).join('');
const total=()=>cart.reduce((s,l)=>s+find(l.v)[0].price*l.q,0);
function draw(){const c=cart.reduce((s,l)=>s+l.q,0);$('#count').textContent=c;$('#lines').innerHTML=rows(1)||'<li class="empty">Your bag is empty.</li>';$('#sub').textContent=fmt(total());$('#toCheckout').disabled=!c}
$('#lines').onclick=e=>{const b=e.target.closest('button');if(!b)return;const l=cart[b.dataset.i];l.q+=+b.dataset.d;if(l.q<1)cart.splice(b.dataset.i,1);save()};
$('#tBag').onclick=()=>sheet('#cart');
$('#toCheckout').onclick=()=>{$('#oLines').innerHTML=rows(0);$('#oSub').textContent=fmt(total());sheet('#co')};
const permalink=()=>'https://www.themooment.com/cart/'+cart.map(l=>l.v+':'+l.q).join(',');
$('#pay').onclick=()=>{const u=permalink();$('#dLink').href=u;sheet('#done');cart=[];save();setTimeout(()=>{if(open&&open.id=='done')location.href=u},2500)};
build();draw();
const intro=$('#intro');
function enter(fast){if(intro.classList.contains('go'))return;sessionStorage.setItem('tm_intro','1');
 if(!fast&&!RM){pos=-1.2;vel=0}// the rail glides in as the doors part
 intro.classList.add('go');setTimeout(()=>{intro.remove();stage.focus({preventScroll:true})},fast||RM?350:1700)}
if(sessionStorage.getItem('tm_intro'))intro.remove();else{$('#enter').onclick=()=>enter(0);$('#skip').onclick=()=>enter(1)}
