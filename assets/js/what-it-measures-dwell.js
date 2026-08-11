/* What It Measures — restore cinematic dwell pacing and robust viewport pinning.
   The base engine owns all drawing/captions. This layer owns only the physical
   scroll corridor, sticky containment, and dwell-to-transition timing. */
(function(){
  "use strict";
  if(window.__wmDwellPacing)return;
  window.__wmDwellPacing=true;

  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var attempts=0;
  var HOLD=.68;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}

  function bind(){
    var cinema=document.getElementById("wm3-cinema");
    var sticky=cinema&&cinema.querySelector(".wm3__sticky");
    var stage=cinema&&cinema.querySelector(".wm3__stage");
    if(!cinema||!sticky||!stage)return false;
    if(cinema.dataset.dwellBound==="true")return true;
    cinema.dataset.dwellBound="true";

    /*
      The original visual used position:sticky on the stage inside an absolutely
      positioned 100%-height wrapper. That can degrade into ordinary scrolling
      when surrounding homepage layers alter overflow/containment.

      Make the wrapper itself the sticky viewport in normal document flow.
      Its negative bottom margin lets the beat corridor occupy the same physical
      scroll space beneath it. The stage is then simply positioned inside the
      pinned viewport. This is the standard cinematic-scroll structure and is
      substantially more reliable across Safari, Chrome and mobile WebKit.
    */
    var style=document.createElement("style");
    style.dataset.wmDwellStyle="true";
    style.textContent=[
      "#different.wm3,body.mh-world-active>#different.wm3{overflow:visible!important}",
      ".wm3__cinema{position:relative!important;min-height:1160vh!important}",
      ".wm3__sticky{position:sticky!important;top:0!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;height:100vh!important;margin-bottom:-100vh!important;z-index:20!important;pointer-events:none!important}",
      ".wm3__stage{position:absolute!important;top:7vh!important;left:0!important;right:0!important;bottom:auto!important;width:100%!important;height:86vh!important;pointer-events:auto!important}",
      ".wm3__beats{position:relative!important;z-index:0!important}",
      "@media(max-width:820px){.wm3__cinema{min-height:1040vh!important}.wm3__stage{top:4vh!important;height:90vh!important}}",
      "@media(max-width:560px){.wm3__cinema{min-height:960vh!important}.wm3__stage{top:3vh!important;height:91vh!important}}"
    ].join("");
    document.head.appendChild(style);

    var nativeRect=cinema.getBoundingClientRect.bind(cinema);

    /* Each equal scroll segment becomes:
         0% ───────── 68%   dwell on the current scene
        68% ──────── 100%   eased transition to the next scene

       The base What-It-Measures engine still reads a linear progress value.
       Present it with a remapped top value while leaving its animation engine
       and time-based evolution entirely authoritative. */
    cinema.getBoundingClientRect=function(){
      var raw=nativeRect();
      if(reduce)return raw;

      var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
      var travel=Math.max(1,cinema.offsetHeight-vh);
      var rawProgress=clamp(-raw.top/travel,0,1);
      var scaled=rawProgress*11;
      var index=Math.min(10,Math.floor(scaled));
      var local=scaled-index;
      var transition=local<=HOLD?0:smooth((local-HOLD)/(1-HOLD));
      var mappedBeat=index+transition;

      if(rawProgress>=1)mappedBeat=11;
      var mappedProgress=mappedBeat/11;
      var mappedTop=-mappedProgress*travel;
      var delta=mappedTop-raw.top;

      return {
        x:raw.x,
        y:raw.y+delta,
        top:mappedTop,
        right:raw.right,
        bottom:raw.bottom+delta,
        left:raw.left,
        width:raw.width,
        height:raw.height,
        toJSON:raw.toJSON?raw.toJSON.bind(raw):function(){return{};}
      };
    };

    /* Family buttons should land in the middle of the intended dwell, not at
       the legacy spacer position. */
    var families=document.getElementById("wm3-families");
    if(families){
      families.querySelectorAll("button[data-beat]").forEach(function(button){
        button.addEventListener("click",function(event){
          if(reduce)return;
          event.preventDefault();
          event.stopImmediatePropagation();
          var index=clamp(+button.dataset.beat||0,0,11);
          var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
          var travel=Math.max(1,cinema.offsetHeight-vh);
          var raw=nativeRect();
          var documentTop=(window.scrollY||window.pageYOffset||0)+raw.top;
          var local=index>=11?0:HOLD*.48;
          var progress=clamp((index+local)/11,0,1);
          window.scrollTo({top:documentTop+progress*travel,behavior:"smooth"});
        },true);
      });
    }

    requestAnimationFrame(function(){
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));
    });
    return true;
  }

  if(bind())return;
  var timer=setInterval(function(){
    attempts++;
    if(bind()||attempts>80)clearInterval(timer);
  },50);
})();