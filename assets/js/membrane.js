(function(){
  "use strict";

  var root=document.documentElement;
  var KEY="membrane-theme";

  function lockDarkMode(){
    root.removeAttribute("data-theme");
    root.style.colorScheme="dark";
    try{localStorage.setItem(KEY,"dark");}catch(e){}
    document.querySelectorAll("[data-theme-toggle]").forEach(function(el){el.remove();});
  }

  var themeStyle=document.createElement("style");
  themeStyle.textContent=".theme-toggle,[data-theme-toggle]{display:none!important}";
  document.head.appendChild(themeStyle);
  lockDarkMode();

  function initReveal(){
    var els=document.querySelectorAll(".reveal");
    var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduce||!("IntersectionObserver" in window)){
      els.forEach(function(el){el.classList.add("is-in");});
      return;
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){entry.target.classList.add("is-in");io.unobserve(entry.target);}
      });
    },{threshold:.12,rootMargin:"0px 0px -8% 0px"});
    els.forEach(function(el){io.observe(el);});
  }

  function initLightbox(){
    var lb=document.getElementById("lightbox");
    if(!lb)return;
    var lbImg=lb.querySelector("img"),lastFocus=null;
    function visibleImg(frame){
      var imgs=frame.querySelectorAll("img");
      for(var i=0;i<imgs.length;i++)if(imgs[i].offsetParent!==null)return imgs[i];
      return imgs[0]||null;
    }
    function open(img){
      lbImg.src=img.currentSrc||img.src;
      lbImg.alt=img.alt||"";
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden","false");
      document.body.style.overflow="hidden";
      lastFocus=document.activeElement;
      var btn=lb.querySelector(".lightbox__close");
      if(btn)btn.focus();
    }
    function close(){
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
      lbImg.removeAttribute("src");
      if(lastFocus&&lastFocus.focus)lastFocus.focus();
    }
    document.addEventListener("click",function(e){
      if(!e.target||!e.target.closest)return;
      var frame=e.target.closest(".device__frame");
      if(frame&&!lb.contains(frame)){
        var img=visibleImg(frame);
        if(img){e.preventDefault();open(img);}
        return;
      }
      if(e.target.closest(".lightbox"))close();
    });
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&lb.classList.contains("is-open"))close();});
  }

  function initWaitlist(){
    var form=document.getElementById("waitlist");
    if(!form)return;
    var done=document.getElementById("waitlist-done"),hint=form.querySelector(".waitlist__hint"),sent=false;
    if(done)done.hidden=true;
    function showDone(){
      if(hint)hint.hidden=true;
      form.hidden=true;
      if(done){done.hidden=false;if(done.focus)done.focus();}
    }
    function showHint(msg){
      if(done)done.hidden=true;
      if(!hint)return;
      hint.textContent=msg;
      hint.hidden=false;
    }
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var hp=form.querySelector(".waitlist__hp");
      if(hp&&hp.value){showDone();return;}
      if(sent)return;
      sent=true;
      if(hint)hint.hidden=true;
      var btn=form.querySelector('button[type="submit"]');
      if(btn){btn.disabled=true;btn.textContent="Adding you…";}
      function reset(){sent=false;if(btn){btn.disabled=false;btn.textContent="Notify me at launch";}}
      var email=(form.querySelector("#wl-email")||{}).value||"";
      var body=new URLSearchParams({email:email});
      fetch(form.action,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body})
        .then(function(r){return r.json().catch(function(){return{};});})
        .then(function(data){
          if(data&&data.ok)showDone();
          else{
            if(data&&(data.detail||data.status))console.warn("waitlist: upstream",data.status||"",data.detail||"");
            reset();showHint("Hmm — that didn't go through. Try again, or a different email.");
          }
        })
        .catch(function(){reset();showHint("Couldn't reach the server — check your connection and try again.");});
    });
  }

  function initAttest(){
    var nodes=document.querySelectorAll("[data-attest]");
    if(!nodes.length)return;
    fetch("attestation.json",{cache:"no-store"})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(a){
        if(!a||!a.corpus||!a.invariants)return;
        var c=a.corpus,inv=a.invariants;
        function fmt(k){
          if(k==="lines")return Math.floor(c.lines/10000)*10+"K+";
          if(k==="theorems")return(Math.floor(c.theorems_plus_lemmas/1000)*1000).toLocaleString("en-US")+"+";
          if(k==="theorems-plain")return(Math.floor(c.theorems_plus_lemmas/1000)*1000).toLocaleString("en-US");
          if(k==="files")return c.files.toLocaleString("en-US");
          if(k==="axioms")return String(inv.project_axioms);
          if(k==="digest")return(a.digest&&a.digest.root)||"";
          return null;
        }
        nodes.forEach(function(el){var v=fmt(el.getAttribute("data-attest"));if(v!=null)el.textContent=v;});
      })
      .catch(function(){});
  }

  function loadScript(src,key){
    if(document.querySelector('script['+key+']'))return;
    var s=document.createElement("script");
    s.src=src;
    s.defer=true;
    s.setAttribute(key,"true");
    document.head.appendChild(s);
  }

  function initHomeWorld(){
    if(!document.getElementById("top")||!document.getElementById("wedge"))return;
    loadScript("assets/js/home-world.js?v=2","data-home-world");
    loadScript("assets/js/home-depth.js?v=2","data-home-depth");
  }

  function initHomeLayers(){
    if(!document.getElementById("wedge")||!document.getElementById("modes"))return;
    loadScript("assets/js/home-anchors.js?v=1","data-home-anchors");
    if(!document.querySelector('link[data-home-vitality-style]')){
      var l=document.createElement("link");
      l.rel="stylesheet";
      l.href="assets/css/home-vitality.css?v=1";
      l.dataset.homeVitalityStyle="true";
      document.head.appendChild(l);
    }
    loadScript("assets/js/home-vitality.js?v=1","data-home-vitality");
    if(document.getElementById("different")&&document.getElementById("idea")&&document.getElementById("science"))loadScript("assets/js/home-signature.js?v=1","data-home-signature");
    if(document.getElementById("different")){
      loadScript("assets/js/home-measure-presence.js?v=1","data-measure-presence");
      loadScript("assets/js/what-it-measures-dwell.js?v=3","data-wm-dwell");
    }
    loadScript("assets/js/home-copy-polish.js?v=3","data-home-copy-polish");
  }

  document.addEventListener("DOMContentLoaded",function(){
    lockDarkMode();
    initReveal();
    initLightbox();
    initWaitlist();
    initAttest();
    initHomeWorld();
    initHomeLayers();
  });
})();