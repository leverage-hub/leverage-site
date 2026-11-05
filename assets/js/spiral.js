/* LEVERAGE spiral gallery: 10 cards ride a helix while you scroll through a pinned stage.
   Only transform + opacity are animated, and the loop stops when the section is off screen.
   Images: set data-src on each figure.sp-card in index.html (empty = numbered placeholder).
   Tweak TUNING: turns = how many spiral rotations, depth = how far the back cards sit. */
(function(){
'use strict';
const track=document.querySelector('.sp-track');
if(!track) return;
const stage=track.querySelector('.sp-stage'), cards=[...track.querySelectorAll('.sp-card')], count=track.querySelector('.sp-count b');
const N=cards.length, rm=matchMedia('(prefers-reduced-motion: reduce)');
if(!N) return;
const TUNING={ turns:1.25, depth:700, tilt:32 };

/* optional images */
cards.forEach(card=>{
  const src=(card.dataset.src||'').trim(); if(!src) return;
  const img=document.createElement('img');
  img.alt=card.dataset.alt||''; img.decoding='async'; img.loading='lazy';
  img.onload=()=>card.classList.add('has-img');
  img.onerror=()=>img.remove();
  img.src=src; card.querySelector('.sp-img').appendChild(img);
});
if(rm.matches) return;

const rz=cards.map((_,i)=>((i*37)%11-5)*1.4), sc=[1,.82,1.08,.9,1.15,.85,1,.92,1.1,.88];
let W=1,H=1,tp=0,p=0,raf=null,onScreen=true,lastP=-1,lastFront=-1;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function size(){ W=stage.clientWidth; H=stage.clientHeight }
function target(){
  const range=Math.max(1,track.offsetHeight-innerHeight);
  tp=clamp(-track.getBoundingClientRect().top/range,0,1);
}
function draw(){
  const pr=Math.round(p*2000)/2000;
  if(pr===lastP) return; lastP=pr;
  const Rx=Math.min(W*.34,460), Hs=H*1.02;
  let best=-9,bi=0;
  for(let i=0;i<N;i++){
    const u=(i/N+pr)%1, a=(u-.5)*TUNING.turns*Math.PI*2, s=Math.sin(a), c=Math.cos(a);
    const e=Math.min(1,u/.1,(1-u)/.1), op=e*(.3+.7*(c+1)/2);
    const el=cards[i].style;
    el.opacity=op.toFixed(2);
    el.zIndex=Math.round((c+1)*50);
    el.transform='perspective(1400px) translate3d('+(s*Rx).toFixed(1)+'px,'+((.5-u)*Hs).toFixed(1)+'px,'+((c-1)*TUNING.depth/2).toFixed(1)+'px) rotateX(10deg) rotateY('+(-s*TUNING.tilt).toFixed(1)+'deg) rotateZ('+rz[i].toFixed(1)+'deg) scale('+sc[i%sc.length]+') translate(-50%,-50%)';
    if(c*e>best){ best=c*e; bi=i }
  }
  if(count&&bi!==lastFront){ lastFront=bi; count.textContent=String(bi+1).padStart(2,'0') }
}
function frame(){
  p+=(tp-p)*.14;
  if(Math.abs(tp-p)<.0004) p=tp;
  draw();
  raf=(onScreen&&p!==tp)?requestAnimationFrame(frame):null;
}
const wake=()=>{ if(raf===null&&onScreen) raf=requestAnimationFrame(frame) };

new IntersectionObserver(es=>{ onScreen=es[0].isIntersecting; if(onScreen){ target(); wake() } },{rootMargin:'200px'}).observe(track);
addEventListener('scroll',()=>{ target(); wake() },{passive:true});
addEventListener('resize',()=>{ size(); lastP=-1; target(); wake() });
size(); target(); p=tp; draw(); wake();
})();
