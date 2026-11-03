/* LEVERAGE project demos: a video loads only when its play button is clicked (keeps the page fast).
   Files live in assets/video/ (see data-src on each .vid in index.html). Missing file -> "Video coming soon". */
(function(){
'use strict';
document.querySelectorAll('.vid').forEach(card=>{
  const frame=card.querySelector('.vid-frame'), btn=card.querySelector('.vid-play'), src=card.dataset.src, poster=card.dataset.poster;
  if(!frame||!btn||!src) return;
  if(poster) frame.style.backgroundImage='url("'+poster+'")';
  btn.addEventListener('click',()=>{
    const v=document.createElement('video');
    v.controls=true; v.playsInline=true; v.preload='metadata'; v.src=src;
    if(poster) v.poster=poster;
    v.addEventListener('error',()=>{ v.remove(); btn.hidden=false; card.classList.add('missing'); console.warn('LEVERAGE videos: file not found ->',src) },{once:true});
    card.classList.remove('missing'); btn.hidden=true; frame.appendChild(v);
    const pl=v.play(); if(pl&&pl.catch) pl.catch(()=>{});
  });
});
/* only one video plays at a time */
document.addEventListener('play',e=>{
  if(!e.target||e.target.tagName!=='VIDEO') return;
  document.querySelectorAll('.vid video').forEach(v=>{ if(v!==e.target) v.pause() });
},true);
})();
