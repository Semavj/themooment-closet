const $=s=>document.querySelector(s),fmt=n=>'$'+n.toFixed(2),P=window.PRODUCTS;
const MODEL=['the-essential-mooment-sets-gray','the-essential-mooment-sets-blue'];
const sets={clothes:P.filter(p=>!p.bag),bags:P.filter(p=>p.bag)};
const HANGER=`<svg class="hanger" viewBox="0 0 300 120" aria-hidden="true"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79a63"/><stop offset=".5" stop-color="#9a6a3a"/><stop offset="1" stop-color="#6e4624"/></linearGradient><linearGradient id="c" x1="0" x2="1"><stop offset="0" stop-color="#8d8d94"/><stop offset=".5" stop-color="#f7f7f9"/><stop offset="1" stop-color="#7a7a82"/></linearGradient></defs><path d="M150 58 C150 40 150 34 150 30 C150 14 168 10 168 24" fill="none" stroke="url(#c)" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="60" r="7" fill="url(#c)"/><path d="M150 60 Q100 74 18 104 Q8 108 12 114 L288 114 Q292 108 282 104 Q200 74 150 60Z" fill="url(#w)"/><path d="M20 112 L280 112" stroke="#5a381b" stroke-width="3"/></svg>`;
const haptic=(el)=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}if(el){el.classList.remove('tap');void el.offsetWidth;el.classList.add('tap')}};
let mode='clothes',items=[],els=[],x=0,v=0,target=0,th=[],om=[],drag=null,dragV=0,lastAcc=0;
const stage=$('#stage'),track=$('#track');
function build(){items=sets[mode];document.body.classList.toggle('bags',mode=='bags');
 track.innerHTML=items.map((p,i)=>mode=='bags'?`<div class="item bag" data-i="${i}"><img src="${p.cut}" alt="${p.name}" draggable="false"><div class="ped"></div></div>`
 :`<div class="item ${MODEL.includes(p.id)?'model':''}" data-i="${i}">${HANGER}<img src="${p.cut}" alt="${p.name}" draggable="false"></div>`).join('');
 els=[...track.children];th=items.map(()=>0);om=items.map(()=>0);x=target=0;v=0;th[0]=mode=='bags'?.5:.35;info();}
function info(){const i=idx(),p=items[i];$('#name').textContent=p.name;$('#price').textContent=fmt(p.price);$('#idx').textContent=(mode=='bags'?'Bags':'Closet')+' · '+(i+1)+' of '+items.length;
 els.forEach((e,j)=>{e.setAttribute('aria-hidden',j!=i)})}
const idx=()=>Math.max(0,Math.min(items.length-1,Math.round(target)));
function go(i,kick=1){const n=Math.max(0,Math.min(items.length-1,i));if(n!=target){const dir=Math.sign(n-target);target=n;th[n]+=-dir*.55*kick;haptic();info()}else if(i!=n){th[n]+=(i>n?-1:1)*.12}}
// physics loop (semi-implicit Euler, fixed dt)
let last=performance.now();function tick(t){let dt=Math.min(.033,(t-last)/1000);last=t;const W=width();
 if(!drag){const a=-170*(x-target)-24*v;v+=a*dt;x+=v*dt;lastAcc=a}else{lastAcc=dragV*30;}
 els.forEach((e,i)=>{const d=i-x;// pendulum: θ'' = -g/L θ - c θ' - track accel coupling
  const acc=-60*th[i]-3.2*om[i]+lastAcc*.012*(Math.abs(d)<1.5?1:0)-(drag&&Math.abs(d)<.6?dragV*.9:0);om[i]+=acc*dt;th[i]+=om[i]*dt;th[i]=Math.max(-.6,Math.min(.6,th[i]));
  const a=Math.abs(d);if(a>2.2){e.style.visibility='hidden';return}e.style.visibility='visible';
  const s=1-Math.min(a,1)*.22,deg=th[i]*57.3;
  e.style.transform=mode=='bags'?`translateX(${d*W}px) scale(${s}) rotateY(${deg*1.6}deg) rotate(${deg*.25}deg)`:`translateX(${d*W}px) scale(${s}) rotate(${deg}deg)`;
  e.style.opacity=1-Math.min(a,1)*.45;e.style.zIndex=10-Math.round(a*3)});
 requestAnimationFrame(tick)}
const width=()=>innerWidth>900?Math.min(innerWidth*.42,520)+80:Math.min(innerWidth*.84,460)*.9;requestAnimationFrame(tick);
let sx,lx,lt,moved;
stage.addEventListener('pointerdown',e=>{if(e.target.closest('.nav'))return;drag=1;sx=lx=e.clientX;lt=performance.now();moved=0;dragV=0;stage.setPointerCapture(e.pointerId)});
stage.addEventListener('pointermove',e=>{if(!drag)return;const now=performance.now(),dx=e.clientX-lx;lx=e.clientX;moved+=Math.abs(dx);let nx=x-dx/width();
 if(nx<0||nx>items.length-1)nx=x-dx/width()*.35;const vv=(nx-x)/Math.max(.008,(now-lt)/1000);v=vv;dragV=dragV*.6+vv*.4;x=nx;lt=now});
const up=e=>{if(!drag)return;drag=null;const vv=dragV;dragV=0;if(moved<8){if(e.target.closest('.item'))openPDP();return}
 let n=Math.round(x+Math.max(-.6,Math.min(.6,vv*.18)));n=Math.max(0,Math.min(items.length-1,n));if(n!=target){const dir=Math.sign(n-target);target=n;th[n]+=-dir*.4;haptic();info()}};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
addEventListener('keydown',e=>{if(document.querySelector('.sheet.on'))return;if(e.key=='ArrowRight')go(target+1);if(e.key=='ArrowLeft')go(target-1);if(e.key=='Enter')openPDP()});
$('#prev').onclick=e=>{haptic(e.currentTarget);go(target-1)};$('#next').onclick=e=>{haptic(e.currentTarget);go(target+1)};
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{if(b.dataset.mode==mode)return;mode=b.dataset.mode;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-selected',x==b));haptic();build()});
// sheets
const scrim=$('#scrim');let open=null,lastFocus;
function sheet(id){if(open)open.classList.remove('on');lastFocus=lastFocus||document.activeElement;open=$(id);open.classList.add('on');scrim.classList.add('on');setTimeout(()=>(open.querySelector('.cta,button')||open).focus(),300)}
function closeSheet(){if(!open)return;open.classList.remove('on');scrim.classList.remove('on');open=null;$('#tBag').classList.remove('on');$('#tCloset').classList.add('on');lastFocus&&lastFocus.focus();lastFocus=null}
scrim.onclick=closeSheet;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeSheet);addEventListener('keydown',e=>{if(e.key=='Escape')closeSheet()});
document.querySelectorAll('.sheet').forEach(s=>{let y0=null;s.addEventListener('touchstart',e=>{if(s.scrollTop<=0)y0=e.touches[0].clientY},{passive:true});s.addEventListener('touchmove',e=>{if(y0==null)return;const dy=e.touches[0].clientY-y0;if(dy>0)s.style.transform=`translateY(${dy}px)`},{passive:true});s.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0;s.style.transform='';y0=null;if(dy>110)closeSheet()})});
// PDP
let cur,size;
function openPDP(){cur=items[idx()];$('#pName').textContent=cur.name;$('#pPrice').textContent=fmt(cur.price);$('#pDesc').textContent=cur.desc||'';
 $('#pGal').innerHTML=[cur.cut,...cur.imgs].map(s=>`<img src="${s}" alt="${cur.name}" loading="lazy">`).join('');
 const vs=cur.variants;size=(vs.find(v=>v.ok)||vs[0]);
 $('#pSizes').innerHTML=vs.map(v=>`<button role="radio" aria-checked="${v===size}" ${v.ok?'':'disabled'} data-id="${v.id}">${v.t=='Default Title'?'One Size':v.t}</button>`).join('');
 $('#pAdd').disabled=!vs.some(v=>v.ok);$('#pAdd').textContent=vs.some(v=>v.ok)?'Add to Bag':'Sold Out';sheet('#pdp')}
$('#pSizes').onclick=e=>{const b=e.target.closest('button');if(!b)return;size=cur.variants.find(v=>v.id==b.dataset.id);$('#pSizes').querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',x==b));haptic(b)};
$('#shop').onclick=e=>{haptic(e.currentTarget);openPDP()};
// cart
let cart=JSON.parse(localStorage.getItem('tm_bag')||'[]');const find=id=>{for(const p of P)for(const v of p.variants)if(v.id==id)return[p,v]};
cart=cart.filter(l=>find(l.v));
const save=()=>{localStorage.setItem('tm_bag',JSON.stringify(cart));draw()};
$('#pAdd').onclick=e=>{const l=cart.find(l=>l.v==size.id);l?l.q++:cart.push({v:size.id,q:1});save();haptic(e.currentTarget);const b=$('#count');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');setTimeout(()=>{closeSheet()},250)};
const rows=(ed)=>cart.map((l,i)=>{const[p,v]=find(l.v);return`<li><img src="${p.cut}" alt=""><div class="t"><b>${p.name}</b><br><small>${v.t=='Default Title'?'One Size':v.t} · ${fmt(p.price)}</small></div>${ed?`<div class="step"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button>${l.q}<button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>`:`<small>×${l.q}</small>`}</li>`}).join('');
const total=()=>cart.reduce((s,l)=>s+find(l.v)[0].price*l.q,0);
function draw(){const c=cart.reduce((s,l)=>s+l.q,0);$('#count').textContent=c;$('#count').hidden=!c;$('#lines').innerHTML=rows(1)||'<li class="empty">Your bag is empty.</li>';$('#sub').textContent=fmt(total());$('#toCheckout').disabled=!c}
$('#lines').onclick=e=>{const b=e.target.closest('button');if(!b)return;const l=cart[b.dataset.i];l.q+=+b.dataset.d;if(l.q<1)cart.splice(b.dataset.i,1);haptic(b);save()};
$('#tBag').onclick=e=>{haptic(e.currentTarget);$('#tBag').classList.add('on');$('#tCloset').classList.remove('on');sheet('#cart')};$('#tCloset').onclick=e=>{haptic(e.currentTarget);closeSheet()};
$('#toCheckout').onclick=()=>{$('#oLines').innerHTML=rows(0);$('#oSub').textContent=fmt(total());sheet('#co')};
const permalink=()=>'https://www.themooment.com/cart/'+cart.map(l=>l.v+':'+l.q).join(',');
$('#pay').onclick=e=>{haptic(e.currentTarget);const u=permalink();$('#dLink').href=u;sheet('#done');cart=[];save();setTimeout(()=>{if(open&&open.id=='done')location.href=u},2500)};
build();draw();
