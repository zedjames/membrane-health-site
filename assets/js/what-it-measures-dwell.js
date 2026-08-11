/* What It Measures — restore cinematic dwell pacing.
   The base engine intentionally owns all drawing and captions. This layer only
   remaps its scroll geometry so each scene has time to live before transition. */
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
    if(!cinema)return false;
    if(cinema.dataset.dwellBound==="true")return true;
    cinema.dataset.dwellBound="true";

    /* Give the twelve scenes enough physical scroll distance to evolve.
       Desktop gets the full cinematic corridor; mobile is slightly shorter
       while still holding each state for a meaningful interval. */
    var style=document.createElement("style");
    style.dataset.wmDwellStyle="true";
    style.textContent=[
      ".wm3__cinema{min-height:1160vh!important}",
      "@media(max-width:820px){.wm3__cinema{min-height:1040vh!important}}",
      "@media(max-width:560px){.wm3__cinema{min-height:960vh!important}}"
    ].join("");
    document.head.appendChild(style);

    var nativeRect=cinema.getBoundingClientRect.bind(cinema);

    /* Each equal scroll segment becomes:
         0% ───────── 68%   dwell on the current scene
        68% ──────── 100%   eased transition to the next scene

       The base What-It-Measures engine still believes it is reading a normal
       linear scroll position. We simply present it with a remapped top value.
       Its drawing code, captions, and internal time-based motion remain
       authoritative. */
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

    /* The base family buttons scroll to legacy spacer nodes. With a longer
       corridor those positions no longer correspond to the intended scene.
       Capture the click first and land in the center of that scene's dwell. */
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

    /* Force the base scroll handler to re-read the newly remapped geometry. */
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
