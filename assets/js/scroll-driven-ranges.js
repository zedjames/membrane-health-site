(function(){
  "use strict";

  if(window.__mhNativeEntrancePlayback)return;
  window.__mhNativeEntrancePlayback=true;

  var configs=[
    {section:"#wedge",range:"#lp-range",play:"#lp-replay"},
    {section:"#idea",range:"#we-range",play:"#we-replay"},
    {section:"#science",range:"#uh2-range",play:"#uh2-play"}
  ];

  var bound=[];
  var observer=null;

  function setToStart(item){
    if(item.started)return;
    var min=item.range.min!=="" ? item.range.min : "0";
    if(item.range.value!==String(min)){
      item.range.value=String(min);
      item.range.dispatchEvent(new Event("input",{bubbles:true}));
    }
  }

  function begin(item){
    if(item.started)return;
    item.started=true;
    item.section.dataset.rangePlayback="playing";
    if(observer)observer.unobserve(item.section);

    // Put the native engine at its own first frame, then let its own playback
    // control run uninterrupted to completion. No external range animation.
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
    if(!range||!play)return false;

    var item={section:section,range:range,play:play,started:false};
    section.dataset.nativePlaybackBound="true";
    bound.push(item);
    setToStart(item);

    observer.observe(section);
    return true;
  }

  function scan(){
    var complete=true;
    configs.forEach(function(cfg){
      if(!bind(cfg))complete=false;
    });
    return complete;
  }

  observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var item=bound.find(function(x){return x.section===entry.target;});
      if(item)begin(item);
    });
  },{
    // Wait until the visitor is genuinely inside the section before starting.
    // Once started, playback is independent of scroll direction or speed.
    root:null,
    rootMargin:"-10% 0px -18% 0px",
    threshold:.18
  });

  // Legacy Why Membrane contains its own offscreen autoplay. While a feature is
  // still waiting, repeatedly reassert its native first frame; dispatching input
  // also cancels that local autoplay through the feature's own listener.
  (function waitingGuard(){
    bound.forEach(setToStart);
    requestAnimationFrame(waitingGuard);
  })();

  scan();
  var attempts=0;
  var timer=setInterval(function(){
    attempts++;
    if(scan()||attempts>80)clearInterval(timer);
  },100);
})();
