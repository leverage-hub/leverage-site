/* LEVERAGE shared behavior: navigation, reveals, process line, contact form, configurable details. */
(function(){
'use strict';

/* ------------------------------------------------------------------
   CONFIG: the only place to edit when real details are available.
   Empty values show a muted "to be added" placeholder on the page.
   ------------------------------------------------------------------ */
const CONFIG = {
  formEndpoint: 'https://formsubmit.co/ajax/leverage82@gmail.com',
  contactEmail: 'leverage823@gmail.com',
  phone: ['01001247388', '01557918925'],
  location: '',
  socials: {
    linkedin: 'https://www.linkedin.com/in/leverage-ai-87096a448/',
    github: '',
    instagram: 'https://www.instagram.com/leverage.global',
    x: ''
  },
  showUnconfirmedTech: false
};

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* nav */
const nav=$('.nav'), btn=$('.menu-btn'), links=$('.nav-links');
function navState(){ nav.classList.toggle('scrolled', scrollY>24) }
addEventListener('scroll',navState,{passive:true}); navState();
if(btn){
  btn.addEventListener('click',()=>{
    const open=btn.getAttribute('aria-expanded')!=='true';
    btn.setAttribute('aria-expanded',open); links.classList.toggle('open',open);
  });
  links.addEventListener('click',e=>{ if(e.target.closest('a')){btn.setAttribute('aria-expanded','false');links.classList.remove('open')} });
  addEventListener('keydown',e=>{ if(e.key==='Escape'){btn.setAttribute('aria-expanded','false');links.classList.remove('open')} });
}

/* active link on the homepage: sections without a nav link clear the highlight */
const navLinks=$$('.nav-links a');
const hashOf=a=>{const h=a.getAttribute('href')||'';return h.includes('#')?h.split('#')[1]:''};
const sectionEls=$$('main > section[id], header.hero[id]');
if(sectionEls.length && navLinks.some(a=>hashOf(a))){
  const spy=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    navLinks.forEach(a=>a.removeAttribute('aria-current'));
    if(e.target.id==='top') return;
    const match=navLinks.find(a=>hashOf(a)===e.target.id);
    if(match) match.setAttribute('aria-current','page');
  }),{rootMargin:'-45% 0px -50% 0px'});
  sectionEls.forEach(t=>spy.observe(t));
}

/* reveals */
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)} }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.reveal').forEach(el=>io.observe(el));

/* process line, driven by scroll, delta-gated */
const track=$('.proc-track');
if(track){
  const steps=$$('.step',track); let lastPP=-1, lastOn=-1;
  const upd=()=>{
    if(reduce.matches){ track.style.setProperty('--pp',1); steps.forEach(s=>s.classList.add('on')); return }
    const r=track.getBoundingClientRect();
    const pp=Math.round(clamp((innerHeight*0.68 - r.top)/Math.max(r.height,innerHeight*0.42),0,1)*200)/200;
    if(pp!==lastPP){ lastPP=pp; track.style.setProperty('--pp',pp) }
    const on=Math.round(pp*steps.length*1.05+0.05);
    if(on!==lastOn){ lastOn=on; steps.forEach((s,i)=>s.classList.toggle('on',i<on)) }
  };
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); reduce.addEventListener('change',upd); upd();
}

/* configurable contact details */
function fillConfig(){
  $$('[data-contact]').forEach(el=>{
    const key=el.dataset.contact; let val='';
    if(key.startsWith('social-')) val=CONFIG.socials[key.slice(7)]||''; else val=CONFIG[key]||'';
    if(Array.isArray(val)) val=val.filter(Boolean);
    const hasVal=Array.isArray(val)?val.length>0:!!val;
    if(hasVal){
      if(key==='contactEmail'||key==='email'){ const a=document.createElement('a'); a.href='mailto:'+val; a.textContent=val; el.replaceChildren(a) }
      else if(key==='phone'){
        const nums=Array.isArray(val)?val:[val];
        el.replaceChildren();
        nums.forEach((n,i)=>{
          if(i) el.append(document.createTextNode(' / '));
          const a=document.createElement('a');
          a.href='tel:'+n.replace(/\s+/g,'');
          a.textContent=n;
          el.appendChild(a);
        });
      }
      else if(key.startsWith('social-')){ const a=document.createElement('a'); a.href=val; a.rel='noopener'; a.target='_blank'; a.textContent=el.dataset.name||key; el.replaceChildren(a) }
      else el.textContent=val;
    }else{
      (el.closest('li')||el).remove();
    }
  });
  if(CONFIG.showUnconfirmedTech) $$('.tile.dim').forEach(t=>t.classList.add('show'));
}
/* the email key is stored as contactEmail; data-contact="email" maps to it */
CONFIG.email=CONFIG.contactEmail;
fillConfig();

/* contact form: real validation, real states, and no pretending */
const form=$('#contact-form');
if(form){
  const status=$('#form-status'), submit=$('button[type=submit]',form);
  const rules={
    name:v=>v.trim().length>=2||'Please enter your name.',
    email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Please enter a valid email address.',
    message:v=>v.trim().length>=10||'Tell us a little about your challenge.'
  };
  function show(kind,title,text){
    status.className='status on '+kind; status.innerHTML='';
    const s=document.createElement('strong'); s.textContent=title; status.append(s,document.createTextNode(text));
    status.setAttribute('tabindex','-1'); status.focus();
  }
  /* validate one field. Error rows have a reserved height, so messages never shift the layout. */
  function validateOne(k){
    const f=form.elements[k], wrap=f.closest('.field'), msg=$('.err',wrap);
    const r=rules[k](f.value), ok=r===true;
    wrap.classList.toggle('bad',!ok); msg.textContent=ok?'':r; f.setAttribute('aria-invalid',String(!ok));
    return ok?null:f;
  }
  function validate(){
    let first=null;
    Object.keys(rules).forEach(k=>{ const bad=validateOne(k); if(bad&&!first) first=bad });
    return first;
  }
  /* each field validates only after you have been in it and left it, and clears as soon as it is fixed */
  Object.keys(rules).forEach(k=>{
    const f=form.elements[k]; let touched=false;
    f.addEventListener('blur',()=>{ touched=true; validateOne(k) });
    f.addEventListener('input',()=>{ if(touched||f.closest('.field').classList.contains('bad')) validateOne(k) });
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    status.className='status';
    if(form.elements.website.value) return;           // honeypot: silently drop bots
    const bad=validate(); if(bad){ bad.focus(); return }
    const data=new FormData(form); data.delete('website');
    data.append('_subject','New enquiry from '+data.get('name')+' (LEVERAGE website)');
    data.append('_template','table');
    data.append('_captcha','false');
    if(CONFIG.formEndpoint){
      submit.disabled=true; const old=submit.firstChild.textContent; submit.firstChild.textContent='Sending';
      try{
        const res=await fetch(CONFIG.formEndpoint,{method:'POST',body:data,headers:{Accept:'application/json'}});
        if(!res.ok) throw new Error('HTTP '+res.status);
        form.reset(); show('ok','Message sent.','Thank you. We will reply by email as soon as we can.');
      }catch(err){
        show('bad','Your message did not send.', CONFIG.contactEmail?' Please try again, or email us directly at '+CONFIG.contactEmail+'.':' Please check your connection and try again in a moment.');
      }finally{ submit.disabled=false; submit.firstChild.textContent=old }
    }else if(CONFIG.contactEmail){
      const body=['Name: '+data.get('name'),'Email: '+data.get('email'),'Company: '+(data.get('company')||'-'),'Interested in: '+(data.get('service')||'-'),'','Message:',data.get('message')].join('\n');
      location.href='mailto:'+CONFIG.contactEmail+'?subject='+encodeURIComponent('Project enquiry from '+data.get('name'))+'&body='+encodeURIComponent(body);
      show('warn','Your email app should now be open.','The message is not sent until you press send there.');
    }else{
      show('bad','This form is not connected yet.','No message was sent. The site owner still needs to add a form service or an email address. Until then, please reach out through the contact details on this page once they are added.');
    }
  });
}

/* hover preview: show the full image outside the circle */
(function(){
  const anchors=$$('svg.mini a');
  if(!anchors.length) return;
  const box=document.createElement('div');
  box.className='img-preview'; box.setAttribute('aria-hidden','true');
  const big=document.createElement('img'); big.alt='';
  box.appendChild(big); document.body.appendChild(box);
  let current=null;

  function place(){
    if(!current) return;
    const r=current.getBoundingClientRect();
    const w=box.offsetWidth, h=box.offsetHeight, gap=14, pad=12;
    let x=r.left+r.width/2-w/2;
    x=clamp(x,pad,innerWidth-w-pad);
    let y=r.top-h-gap;                       // above by default
    if(y<pad) y=r.bottom+gap;                // not enough room: below
    y=clamp(y,pad,Math.max(pad,innerHeight-h-pad));
    box.style.left=x+'px'; box.style.top=y+'px';
  }
  function show(a){
    const img=a.querySelector('image'); if(!img) return;
    current=a;
    big.onload=place;
    big.src=img.getAttribute('href')||img.getAttribute('xlink:href');
    box.classList.add('on'); place();
  }
  function hide(){ current=null; box.classList.remove('on') }

  anchors.forEach(a=>{
    a.addEventListener('mouseenter',()=>show(a));
    a.addEventListener('mouseleave',hide);
    a.addEventListener('focus',()=>show(a));
    a.addEventListener('blur',hide);
  });
  addEventListener('scroll',hide,{passive:true});
  addEventListener('keydown',e=>{ if(e.key==='Escape') hide() });
})();

/* ready, plus pause loops on hidden tabs */
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('paused',document.hidden));
requestAnimationFrame(()=>document.body.classList.add('ready'));
})();
