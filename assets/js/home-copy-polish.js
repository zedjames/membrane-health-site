(function(){
  "use strict";

  function setText(selector,text){
    var el=document.querySelector(selector);
    if(el)el.textContent=text;
  }

  function applyMeasureCopy(){
    var section=document.getElementById("different");
    if(!section)return;
    var note=document.getElementById("wm2-note");
    var active=section.querySelector('.wm2-mode[aria-pressed="true"][data-aspect]');
    if(note&&active){
      var notes={
        boundary:"What's important is how much room is left between our awareness and our edge.",
        stability:"A disturbance arrives. Stability describes how the organization holds its shape and how quickly it settles again.",
        coherence:"Coherence is the relationship through which separate processes move together.",
        recovery:"Load becomes capacity again through a direction in time, with the edge reopening behind it."
      };
      if(notes[active.dataset.aspect])note.textContent=notes[active.dataset.aspect];
    }
    if(!section.dataset.copyPolishBound){
      section.dataset.copyPolishBound="true";
      section.addEventListener("click",function(e){
        if(e.target&&e.target.closest&&e.target.closest(".wm2-mode"))requestAnimationFrame(applyMeasureCopy);
      });
    }
  }

  function applyPlanPrices(){
    var prices={Free:"$0",Basic:"$3.99",Pro:"$12.99"};
    document.querySelectorAll("#plans .plan").forEach(function(plan){
      var tier=plan.querySelector(".plan__tier");
      if(!tier)return;
      var amount=prices[tier.textContent.trim()];
      if(!amount)return;
      var price=plan.querySelector(".plan__price");
      if(!price){
        price=document.createElement("p");
        price.className="plan__price";
        tier.insertAdjacentElement("afterend",price);
      }
      price.innerHTML='<span class="plan__price-amount">'+amount+'</span><span class="plan__price-period"> / month</span>';
    });
  }

  function loadScrollDrivenRanges(){
    if(document.querySelector('script[data-scroll-driven-ranges]'))return;
    var script=document.createElement("script");
    script.src="assets/js/scroll-driven-ranges.js?v=1";
    script.defer=true;
    script.dataset.scrollDrivenRanges="true";
    document.body.appendChild(script);
  }

  function applyStaticCopy(){
    setText("#modes .fm__head .lede","Each reading resolves the whole system into one of five modes, giving the position a location and a recognizable physiological posture.");
    setText("#basic .sec-head .lede","Free gives you today’s reading at a glance. Basic opens that same measurement into the baselines, systems, signals, timing, and relationships that formed it, making the position more legible.");
    setText("#pro .dash__note.serif-italic","Pro opens the same daily measurement into greater depth.");
    setText("#science .uh2__trace-head span:last-child","each layer remains visible as the next forms");
    applyPlanPrices();
  }

  function run(){
    applyMeasureCopy();
    applyStaticCopy();
    loadScrollDrivenRanges();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();

  requestAnimationFrame(run);
  setTimeout(run,120);
})();