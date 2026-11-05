/* LEVERAGE: marquee pauses when off screen; the Solutions card rail glides sideways as you scroll past it.
   Transform only, runs only while the section is on screen. Tweak RANGE to change where the glide starts/ends. */
(function(){
'use strict';
const mq=document.querySelector('.mq');
if(mq) new IntersectionObserver(es=>mq.classList.toggle('off',!es[0].isIntersecting)).observe(mq);

const sec=document.querySelector('.solutions'), row=document.getElementById('solRow');
if(!sec||!row||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const RANGE=[.2,.8];            // share of the section's pass through the screen used for the glide
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
let max=0,tp=0,p=0,raf=null,on=false,lastX=null;
function measure(){ max=Math.max(0,row.scrollWidth-row.parentElement.clientWidth) }
function target(){
  const r=sec.getBoundingClientRect(), pr=(innerHeight-r.top)/(innerHeight+r.height);
  tp=clamp((pr-RANGE[0])/(RANGE[1]-RANGE[0]),0,1);
}
function frame(){
  p+=(tp-p)*.12; if(Math.abs(tp-p)<.0008) p=tp;
  const x=Math.round(-max*p*2)/2;
  if(x!==lastX){ lastX=x; row.style.transform='translate3d('+x+'px,0,0)' }
  raf=(on&&p!==tp)?requestAnimationFrame(frame):null;
}
const wake=()=>{ if(raf===null&&on) raf=requestAnimationFrame(frame) };
new IntersectionObserver(es=>{ on=es[0].isIntersecting; if(on){ measure(); target(); wake() } },{rootMargin:'150px'}).observe(sec);
addEventListener('scroll',()=>{ if(on){ target(); wake() } },{passive:true});
addEventListener('resize',()=>{ measure(); target(); wake() });
addEventListener('load',()=>{ measure(); target(); p=tp; wake() });
measure(); target(); p=tp;
})();
