/* LEVERAGE hero: shards land on load (CSS), the mark follows the pointer, and scrolling gently pushes the
   camera into the mark while a few gold shards drift past. Writes styles directly (no CSS-variable
   recalculation) and only runs while the hero is on screen. Honors reduced motion.
   Tweak TUNING: zoom = extra scale at the end (.6 means 1.6x), bits = flying shards, glow = light strength. */
(function(){
'use strict';
const hero=document.querySelector('.hero'), track=document.getElementById('heroTrack'),
      mark=document.getElementById('assembly'), art=document.querySelector('.hero-art'),
      layer=document.getElementById('diveBits'), copy=document.querySelector('.hero-copy'),
      glow=document.querySelector('.dive-glow');
if(!hero||!mark||!track||!art||!layer||!copy||!glow) return;

const TUNING={ zoom:.6, bits:0, bitsMobile:0, glow:0 };

const rm=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(pointer: fine)');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), rnd=(a,b)=>a+Math.random()*(b-a);
let tx=0,ty=0,x=0,y=0,tp=0,p=0,raf=null,W=1,H=1,onScreen=true,diving=false,last={};
const put=(el,k,prop,v)=>{ if(last[k]!==v){ last[k]=v; el.style[prop]=v } };

const polys=['50% 0,100% 85%,0 100%','0 20%,80% 0,100% 100%,15% 80%','30% 0,100% 40%,60% 100%,0 70%','50% 0,100% 50%,50% 100%,0 50%'];
const bits=[];
if(!rm.matches){
  const n=innerWidth<700?TUNING.bitsMobile:TUNING.bits;
  for(let i=0;i<n;i++){
    const el=document.createElement('i'); el.className='bit';
    el.style.setProperty('--s',Math.round(rnd(22,90))+'px');
    el.style.setProperty('--c',polys[i%polys.length]);
    layer.appendChild(el);
    bits.push({el,a:rnd(0,Math.PI*2),s:rnd(.3,.55),r:rnd(0,360),spin:rnd(-200,200),k:rnd(.7,1.2)});
  }
}

function measure(){
  const h=hero.getBoundingClientRect(), a=art.getBoundingClientRect();
  W=h.width; H=h.height;
  hero.style.setProperty('--cx',Math.round(a.left+a.width/2-h.left)+'px');
  hero.style.setProperty('--cy',Math.round(a.top+a.height/2-h.top)+'px');
}
function target(){
  const pinned=getComputedStyle(hero).position==='sticky';
  const range=pinned?Math.max(1,track.offsetHeight-innerHeight):Math.max(1,hero.offsetHeight*.9);
  tp=clamp((scrollY-track.offsetTop)/range,0,1);
}
function frame(){
  x+=(tx-x)*.08; y+=(ty-y)*.08; p+=(tp-p)*.16;
  const pr=Math.round(p*1000)/1000;
  const zz=clamp((pr-.05)/.75,0,1), ez=zz*zz*(3-2*zz);          // smoothstep: gentle start and end
  const mx=Math.round(x*100)/100, my=Math.round(y*100)/100;
  const sc=(1+TUNING.zoom*ez).toFixed(3), lift=(-ez*28).toFixed(1);
  put(mark,'mt','transform','rotateY('+(mx*7).toFixed(2)+'deg) rotateX('+(my*-5).toFixed(2)+'deg) translate3d(0,'+lift+'px,0) scale('+sc+')');
  put(mark,'mo','opacity',String(Math.round((1-clamp((zz-.6)/.4,0,1))*100)/100));
  put(copy,'co','opacity',String(Math.round(Math.max(0,1-pr*3.2)*100)/100));
  put(copy,'ct','transform','translate3d('+(-pr*60).toFixed(1)+'px,0,0)');
  const g=clamp((pr-.3)/.35,0,1)*(1-clamp((pr-.75)/.25,0,1))*TUNING.glow;
  put(glow,'g','opacity',String(Math.round(g*100)/100));
  const d=pr>.2; if(d!==diving){ diving=d; hero.classList.toggle('diving',d) }
  if(pr!==last.p){
    last.p=pr;
    const R=Math.hypot(W,H)*.55;
    for(const b of bits){
      const t=clamp((pr-b.s)/(.98-b.s),0,1);
      if(t<=0||t>=1){ b.el.style.opacity=0; continue }
      const r=Math.pow(t,1.6)*R*b.k, op=(t<.15?t/.15:(t>.75?(1-t)/.25:1))*.9;
      b.el.style.opacity=op.toFixed(2);
      b.el.style.transform='translate3d(calc(-50% + '+(Math.cos(b.a)*r).toFixed(1)+'px),calc(-50% + '+(Math.sin(b.a)*r).toFixed(1)+'px),0) rotate('+(b.r+t*b.spin).toFixed(0)+'deg) scale('+(.4+t*1.4).toFixed(2)+')';
    }
  }
  raf=(onScreen&&Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(tp-p)>.002)?requestAnimationFrame(frame):null;
}
const wake=()=>{ if(raf===null&&onScreen&&!rm.matches) raf=requestAnimationFrame(frame) };

/* stop all work once the hero track has scrolled out of view */
new IntersectionObserver(es=>{ onScreen=es[0].isIntersecting; if(onScreen) wake() },{rootMargin:'100px'}).observe(track);

addEventListener('scroll',()=>{ if(rm.matches) return; target(); wake() },{passive:true});
addEventListener('resize',()=>{ measure(); target(); wake() });
addEventListener('load',()=>{ measure(); target(); wake() });
hero.addEventListener('pointermove',e=>{
  if(!fine.matches||rm.matches||diving) return;
  tx=(e.clientX/innerWidth-.5)*2; ty=(e.clientY/innerHeight-.5)*2; wake();
});
hero.addEventListener('pointerleave',()=>{ tx=0; ty=0; wake() });
rm.addEventListener('change',()=>{ if(rm.matches){ tx=ty=tp=x=y=p=0; bits.forEach(b=>b.el.style.opacity=0); [mark,copy,glow].forEach(el=>{el.style.transform='';el.style.opacity=''}); hero.classList.remove('diving'); last={} } });
measure(); target(); wake();
})();
