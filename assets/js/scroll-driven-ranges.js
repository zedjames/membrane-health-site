(function(){
  "use strict";

  if(window.__mhScrollDrivenRanges)return;
  window.__mhScrollDrivenRanges=true;

  var configs=[
    {section:"#wedge",range:"#lp-range",manual:["#lp-replay","#lp2-today"]},
    {section:"#idea",range:"#we-range",manual:["#we-replay"]},
    {section:"#science",range:"#uh2-range, #uh-range",manual:["#uh2-play","#uh2-unfold","#uh-play"]}
  ];

  var items=[];
  var raf=0;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}

  function resolve(){
    items=configs.map(function(cfg){
      var section=document.querySelector(cfg.section);
      if(!section)return null;
      var range=section.querySelector(cfg.range);
      if(!range)return null;
      var item={section:section,range:range,manual:false,last:null,buttons:[]};

      range.addEventListener("input",function(e){
        if(e.isTrusted)item.manual=true;
      });
      range.addEventListener("pointerdown",function(){item.manual=true;},{passive:true});
      range.addEventListener("keydown",function(){item.manual=true;});

      (cfg.manual||[]).forEach(function(selector){
        var button=section.querySelector(selector);
        if(!button)return;
        item.buttons.push(button);
        button.addEventListener("click",function(){item.manual=true;});
      });

      return item;
    }).filter(Boolean);

    // Every slider begins at the beginning of its native range. For Living Position
    // that is day 1 (the left edge / 0% of the journey); the other ranges begin at 0.
    items.forEach(function(item){setProgress(item,0,true);});
    schedule();
  }

  function progressFor(section){
    var rect=section.getBoundingClientRect();
    var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
    // Begin when the section reaches 80% of the viewport. Finish when its bottom
    // reaches 25%, so the range unfolds across the full act of scrolling through it.
    var travel=rect.height+vh*.55;
    var raw=(vh*.80-rect.top)/Math.max(1,travel);
    return smooth(clamp(raw,0,1));
  }

  function setProgress(item,p,force){
    var min=Number(item.range.min||0);
    var max=Number(item.range.max||100);
    var step=Number(item.range.step||1);
    if(!isFinite(min))min=0;
    if(!isFinite(max)||max<=min)max=min+1;
    if(!isFinite(step)||step<=0)step=1;

    var raw=min+(max-min)*clamp(p,0,1);
    var value=Math.round((raw-min)/step)*step+min;
    value=clamp(value,min,max);
    var decimals=(String(step).split(".")[1]||"").length;
    var next=decimals?value.toFixed(decimals):String(Math.round(value));

    if(!force&&item.range.value===next)return;
    item.range.value=next;
    item.last=next;
    item.range.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function sync(){
    raf=0;
    items.forEach(function(item){
      if(item.manual)return;
      setProgress(item,progressFor(item.section),false);
    });
  }

  function schedule(){
    if(!raf)raf=requestAnimationFrame(sync);
  }

  function resumeFromScroll(){
    items.forEach(function(item){item.manual=false;});
    schedule();
  }

  window.addEventListener("scroll",resumeFromScroll,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("pageshow",function(){items.forEach(function(item){item.manual=false;});schedule();},{passive:true});

  // A light watchdog keeps programmatic autoplay from advancing a feature before
  // the visitor reaches it. It does nothing while the visitor is manually exploring.
  function watchdog(){
    items.forEach(function(item){
      if(item.manual)return;
      var rect=item.section.getBoundingClientRect();
      var vh=Math.max(1,window.innerHeight||1);
      if(rect.bottom>-vh*.35&&rect.top<vh*1.35)setProgress(item,progressFor(item.section),false);
    });
    requestAnimationFrame(watchdog);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",resolve,{once:true});
  else resolve();
  requestAnimationFrame(watchdog);
})();
