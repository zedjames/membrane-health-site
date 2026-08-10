(function(){
  "use strict";

  if(window.__mhEntranceDrivenRanges)return;
  window.__mhEntranceDrivenRanges=true;

  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var configs=[
    {section:"#wedge",range:"#lp-range",duration:8200,trigger:0.72},
    {section:"#idea",range:"#we-range",duration:8600,trigger:0.72},
    {section:"#science",range:"#uh2-range, #uh-range",duration:10400,trigger:0.70}
  ];

  var items=[];
  var initialized=false;
  var checkRaf=0;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function ease(t){
    t=clamp(t,0,1);
    return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  }

  function nativeValue(range,p){
    var min=Number(range.min||0);
    var max=Number(range.max||100);
    var step=Number(range.step||1);
    if(!isFinite(min))min=0;
    if(!isFinite(max)||max<=min)max=min+1;
    if(!isFinite(step)||step<=0)step=1;

    var raw=min+(max-min)*clamp(p,0,1);
    var value=Math.round((raw-min)/step)*step+min;
    value=clamp(value,min,max);
    var decimals=(String(step).split(".")[1]||"").length;
    return decimals?value.toFixed(decimals):String(Math.round(value));
  }

  function setProgress(item,p,force){
    var next=nativeValue(item.range,p);
    if(!force&&item.range.value===next)return;
    item.range.value=next;
    item.range.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function bind(cfg){
    var section=document.querySelector(cfg.section);
    if(!section)return null;
    var range=section.querySelector(cfg.range);
    if(!range)return null;

    var item={
      section:section,
      range:range,
      duration:cfg.duration,
      trigger:cfg.trigger,
      state:"waiting",
      startedAt:0
    };

    // The first encounter always begins from the native left edge.
    setProgress(item,0,true);
    return item;
  }

  function shouldStart(item){
    if(item.state!=="waiting")return false;
    var rect=item.section.getBoundingClientRect();
    var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
    return rect.top<=vh*item.trigger && rect.bottom>=vh*.22;
  }

  function finish(item){
    setProgress(item,1,true);
    item.state="resolved";
    item.section.dataset.rangePlayback="resolved";
  }

  function play(item,now){
    if(item.state!=="playing")return;
    var u=clamp((now-item.startedAt)/item.duration,0,1);
    setProgress(item,ease(u),false);
    if(u>=1)finish(item);
    else requestAnimationFrame(function(t){play(item,t);});
  }

  function start(item){
    if(item.state!=="waiting")return;
    item.state="playing";
    item.section.dataset.rangePlayback="playing";

    // Reassert frame zero at the moment the visitor arrives. This also cancels
    // any feature-local autoplay that may have tried to advance offscreen.
    setProgress(item,0,true);

    if(reduce){
      finish(item);
      return;
    }

    item.startedAt=performance.now();
    requestAnimationFrame(function(t){play(item,t);});
  }

  function holdWaitingAtStart(){
    // Some legacy feature engines have their own autoplay. While a section has
    // not yet been encountered, keep its live range at frame zero. Once started,
    // this controller releases it into one uninterrupted forward playback.
    items.forEach(function(item){
      if(item.state==="waiting")setProgress(item,0,false);
    });
  }

  function check(){
    checkRaf=0;
    holdWaitingAtStart();
    items.forEach(function(item){
      if(shouldStart(item))start(item);
    });
  }

  function scheduleCheck(){
    if(!checkRaf)checkRaf=requestAnimationFrame(check);
  }

  function init(){
    if(initialized)return;
    initialized=true;

    items=configs.map(bind).filter(Boolean);

    // If a dynamically replaced feature has not landed yet, retry briefly before
    // giving up. This keeps binding pointed at the live slider, not placeholder HTML.
    if(items.length<configs.length){
      initialized=false;
      setTimeout(init,120);
      return;
    }

    check();

    window.addEventListener("scroll",scheduleCheck,{passive:true});
    window.addEventListener("resize",scheduleCheck,{passive:true});
    window.addEventListener("pageshow",scheduleCheck,{passive:true});

    // Before encounter, suppress legacy offscreen autoplay without tying playback
    // to scroll position. After encounter/resolution this loop becomes inert.
    (function waitingGuard(){
      holdWaitingAtStart();
      requestAnimationFrame(waitingGuard);
    })();
  }

  if(document.readyState==="complete")init();
  else window.addEventListener("load",init,{once:true});
})();