(function(){
  "use strict";

  if(window.__mhNativeEntrancePlayback)return;
  window.__mhNativeEntrancePlayback=true;

  /* Load last-mile mobile layout hardening after the experiential CSS layers. */
  if(!document.querySelector('link[data-mobile-stability]')){
    var stability=document.createElement("link");
    stability.rel="stylesheet";
    stability.href="assets/css/mobile-stability.css?v=1";
    stability.dataset.mobileStability="true";
    document.head.appendChild(stability);
  }

  var configs=[
    {section:"#wedge",range:"#lp-range",play:"#lp-replay",trigger:".lp-stage"},
    /* Why Membrane's legacy engine has its own autoplay, so keep guarding its
       first frame until the visitor actually reaches the visual. */
    {section:"#idea",range:"#we-range",play:"#we-replay",trigger:".idea-exp__stage",guard:true},
    /* Under the Hood is very tall on phones. Observe the instrument stage,
       never the full section, or an intersection-ratio threshold may never fire. */
    {section:"#science",range:"#uh2-range",play:"#uh2-play",trigger:".uh2__stage"}
  ];

  var bound=[];
  var observer=null;
  var fallbackQueued=false;

  function setToStart(item){
    if(item.started)return;
    var min=item.range.min!=="" ? item.range.min : "0";
    if(item.range.value!==String(min)){
      item.range.value=String(min);
      item.range.dispatchEvent(new Event("input",{bubbles:true}));
    }
  }

  function release(item,mode){
    if(item.started)return;
    item.started=true;
    item.section.dataset.rangePlayback=mode||"manual";
    if(observer&&item.trigger)observer.unobserve(item.trigger);
  }

  function begin(item){
    if(item.started)return;
    release(item,"playing");

    /* Put the native engine at its own first frame, then let that engine run
       uninterrupted. The native click handler remains authoritative. */
    var min=item.range.min!=="" ? item.range.min : "0";
    item.range.value=String(min);
    item.range.dispatchEvent(new Event("input",{bubbles:true}));

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(item.play&&typeof item.play.click==="function")item.play.click();
      });
    });
  }

  function bind(cfg){
    var section=document.querySelector(cfg.section);
    if(!section)return false;
    if(section.dataset.nativePlaybackBound==="true")return true;

    var range=section.querySelector(cfg.range);
    var play=section.querySelector(cfg.play);
    var trigger=cfg.trigger ? section.querySelector(cfg.trigger) : section;
    if(!range||!play||!trigger)return false;

    var item={section:section,range:range,play:play,trigger:trigger,guard:!!cfg.guard,started:false};
    section.dataset.nativePlaybackBound="true";
    bound.push(item);
    setToStart(item);

    /* A human touching the native control owns it immediately. This prevents
       the entrance guard from cancelling a manual tap on mobile Safari. */
    function manual(){release(item,"manual");}
    play.addEventListener("pointerdown",manual,{passive:true});
    play.addEventListener("touchstart",manual,{passive:true});
    play.addEventListener("click",function(){
      if(!item.started)release(item,"manual");
    });
    range.addEventListener("pointerdown",manual,{passive:true});
    range.addEventListener("touchstart",manual,{passive:true});
    range.addEventListener("keydown",manual);

    observer.observe(trigger);
    return true;
  }

  function scan(){
    var complete=true;
    configs.forEach(function(cfg){
      if(!bind(cfg))complete=false;
    });
    checkFallback();
    return complete;
  }

  observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var item=bound.find(function(x){return x.trigger===entry.target;});
      if(item)begin(item);
    });
  },{
    /* The trigger is the compact visual stage, not the long content section.
       A tiny threshold makes this reliable on short mobile viewports. */
    root:null,
    rootMargin:"-8% 0px -22% 0px",
    threshold:.02
  });

  /* Safari fallback: if IntersectionObserver timing is delayed during a heavy
     canvas frame, entering the central viewport band still starts the native
     engine exactly once. */
  function checkFallback(){
    fallbackQueued=false;
    var vh=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
    if(!vh)return;
    bound.forEach(function(item){
      if(item.started||!item.trigger)return;
      var r=item.trigger.getBoundingClientRect();
      if(r.top<vh*.78&&r.bottom>vh*.18)begin(item);
    });
  }
  function queueFallback(){
    if(fallbackQueued)return;
    fallbackQueued=true;
    requestAnimationFrame(checkFallback);
  }
  window.addEventListener("scroll",queueFallback,{passive:true});
  window.addEventListener("resize",queueFallback,{passive:true});
  window.addEventListener("orientationchange",queueFallback,{passive:true});

  /* Only Why Membrane needs a persistent offscreen guard because its legacy
     visual engine can autoplay itself. Other native controls are initialized
     once and then left completely alone until entrance or manual interaction. */
  (function waitingGuard(){
    bound.forEach(function(item){if(item.guard)setToStart(item);});
    requestAnimationFrame(waitingGuard);
  })();

  scan();
  var attempts=0;
  var timer=setInterval(function(){
    attempts++;
    if(scan()||attempts>80)clearInterval(timer);
  },100);
})();
