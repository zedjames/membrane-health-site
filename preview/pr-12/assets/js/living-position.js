(function(){
  "use strict";
  var section=document.getElementById("wedge");
  if(!section||window.__lpNextGen)return;
  window.__lpNextGen=true;
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function addStyle(href,key){
    if(document.querySelector('link['+key+']'))return;
    var l=document.createElement("link");l.rel="stylesheet";l.href=href;l.setAttribute(key,"true");document.head.appendChild(l);
  }
  addStyle("assets/css/living-position-next.css?v=1","data-lp-next-style");
  addStyle("assets/css/home-polish.css?v=1","data-home-polish-style");

  section.className="lp2";
  section.innerHTML=`
    <div class="lp2__shell">
      <header class="lp2__copy">
        <p class="eyebrow">A living position</p>
        <h2 class="h-section" id="lp-heading">Your baseline is yours.<br>The definition of health is fixed.</h2>
        <p class="lp2__lede">Your 28-day history calibrates the measurement to you, giving the reading the scale, context, and physiological history that make the position your own. The definition of health supplies the fixed structure within which that position can be located and followed.</p>
        <p class="lp2__incantation">As the days accumulate, your history deepens and your position moves while the definition continues to hold.</p>
      </header>

      <div class="lp2__instrument">
        <div class="lp2__stage">
          <canvas id="lp-field" class="lp2__canvas" aria-label="A 28-day physiological state-space volume in which a fixed reference structure persists while personal scale, membrane state, and current position change through time."></canvas>
          <div class="lp2__hud lp2__hud--left">
            <p class="lp2__hud-kicker">Accumulated history</p>
            <p class="lp2__hud-value" id="lp2-history">28 days</p>
            <p class="lp2__hud-copy">The present keeps what came before it.</p>
          </div>
          <div class="lp2__hud lp2__hud--right">
            <span><i class="lp2-key lp2-key--fixed"></i>fixed definition</span>
            <span><i class="lp2-key lp2-key--personal"></i>personal scale</span>
            <span><i class="lp2-key lp2-key--position"></i>position</span>
          </div>
          <div class="lp2__moment" aria-live="polite">
            <span class="lp2__moment-index" id="lp2-index">28</span>
            <strong id="lp-moment">Today</strong>
          </div>
        </div>

        <div class="lp2__controls">
          <div class="lp2__controls-top"><span>move through the month</span><span id="lp2-depth-copy">28 days of context</span></div>
          <input id="lp-range" class="lp2__range" type="range" min="1" max="28" step="1" value="28" aria-label="Move through an illustrative 28-day physiological history">
          <div class="lp2__scale" aria-hidden="true"><span>28 days ago</span><span>today</span></div>
          <div class="lp2__actions"><button id="lp-replay" type="button">Replay the month →</button><button id="lp2-today" type="button" hidden>Return to today</button></div>
        </div>
      </div>

      <p class="lp2__depth">The present is seen through what came before it.</p>
    </div>`;

  var canvas=document.getElementById("lp-field"),ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  var stage=section.querySelector(".lp2__stage"),range=document.getElementById("lp-range"),moment=document.getElementById("lp-moment"),index=document.getElementById("lp2-index"),historyLabel=document.getElementById("lp2-history"),depthCopy=document.getElementById("lp2-depth-copy"),replay=document.getElementById("lp-replay"),today=document.getElementById("lp2-today");
  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,themeDirty=true,day=27,dayTarget=27,playing=false;
  var pointer={x:0,y:0,tx:0,ty:0},pal={};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.night=cs.getPropertyValue("--night").trim()||"#0A0A0F";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.34,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}

  var days=Array.from({length:28},function(_,i){
    var u=i/27;
    return{scale:.94+hash(i*3.7)*.10+Math.sin(i*.54)*.018,a1:.018+hash(i*7.1)*.022,a2:.010+hash(i*9.7)*.018,p1:hash(i*13.2)*Math.PI*2,p2:hash(i*17.8)*Math.PI*2,x:-.30+u*.46+Math.sin(i*.61)*.105,y:.18-Math.sin(i*.43)*.18-u*.08,reserve:.58+hash(i*19.3)*.28};
  });
  var motes=Array.from({length:92},function(_,i){var a=hash(i*4.1)*Math.PI*2,r=Math.sqrt(hash(i*8.4))*.80;return{x:Math.cos(a)*r,y:Math.sin(a)*r,p:hash(i*11.9)*Math.PI*2,s:.55+hash(i*14.7)*.8,f:i%6};});

  function sliceGeom(i,active,cx,cy,R){var rel=active-i,depth=clamp(rel/27,0,1),persp=1/(1+rel*.080),vanish={x:cx+pointer.x*R*.19,y:cy-H*.105+pointer.y*R*.09},blend=smooth(depth*.92);return{x:lerp(cx,vanish.x,blend),y:lerp(cy,vanish.y,blend),r:R*persp,s:persp,depth:depth};}
  function membranePoint(g,d,a,live){var breathe=live&&!reduce?1+Math.sin(clock*.00068+d.p1)*.010:1,warp=1+d.a1*Math.sin(a*3+d.p1+clock*(live?.00007:0))+d.a2*Math.sin(a*7+d.p2-clock*(live?.000045:0)),rr=g.r*d.scale*warp*breathe;return{x:g.x+Math.cos(a)*rr,y:g.y+Math.sin(a)*rr*.73};}
  function positionPoint(g,d){return{x:g.x+d.x*g.r*d.scale*.78,y:g.y+d.y*g.r*d.scale*.56};}
  function drawMembraneSlice(i,active,cx,cy,R,isActive){var g=sliceGeom(i,active,cx,cy,R),d=days[i],fade=isActive?1:Math.max(.035,.23*(1-g.depth));ctx.beginPath();for(var k=0;k<=120;k++){var a=k/120*Math.PI*2,p=membranePoint(g,d,a,isActive);if(k)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.strokeStyle=rgba(isActive?pal.glow:pal.soft,(isActive?.55:fade));ctx.lineWidth=isActive?1.6:.7;ctx.stroke();ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*.73,0,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,isActive?.16:fade*.28);ctx.lineWidth=isActive?1.0:.55;ctx.setLineDash(isActive?[4,11]:[2,14]);ctx.stroke();ctx.setLineDash([]);var pp=positionPoint(g,d);glow(pp.x,pp.y,isActive?30:10,isActive?pal.glow:pal.aqua,isActive?.10:fade*.08);dot(pp.x,pp.y,isActive?4:1.5,isActive?pal.glow:pal.aqua,isActive?.95:fade*1.8);return{g:g,p:pp,d:d};}
  function drawRails(active,cx,cy,R){var angles=[-.15,.62,1.38,2.17,2.95,3.74,4.55,5.42];angles.forEach(function(a,j){ctx.beginPath();for(var i=0;i<=active;i++){var g=sliceGeom(i,active,cx,cy,R),p={x:g.x+Math.cos(a)*g.r,y:g.y+Math.sin(a)*g.r*.73};if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.strokeStyle=rgba(j%3===0?pal.aqua:pal.glow,.045);ctx.lineWidth=.7;ctx.stroke();});}
  function drawTrajectory(active,cx,cy,R){ctx.beginPath();var pts=[];for(var i=0;i<=active;i++){var g=sliceGeom(i,active,cx,cy,R),p=positionPoint(g,days[i]);pts.push(p);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.strokeStyle=rgba(pal.glow,.28);ctx.lineWidth=1.25;ctx.stroke();pts.forEach(function(p,i){if(i===active)return;dot(p.x,p.y,1.1+i/Math.max(1,active)*.6,i%5===0?pal.aqua:pal.glow,.10+.16*i/Math.max(1,active));});if(pts.length>1){for(var q=0;q<3;q++){var u=(clock*.000055+q*.31)%1,seg=u*(pts.length-1),si=Math.min(pts.length-2,Math.floor(seg)),f=seg-si,p={x:lerp(pts[si].x,pts[si+1].x,f),y:lerp(pts[si].y,pts[si+1].y,f)};glow(p.x,p.y,10,pal.glow,.035);dot(p.x,p.y,1.6,pal.glow,.62);}}}
  function drawActiveInterior(active,cx,cy,R){var g=sliceGeom(active,active,cx,cy,R),d=days[active],rr=g.r*d.scale;ctx.save();ctx.beginPath();ctx.ellipse(g.x,g.y,rr*.97,rr*.70,0,0,Math.PI*2);ctx.clip();glow(g.x,g.y,rr*.92,pal.aquaDeep,.045);motes.forEach(function(m,i){var a=m.p+clock*.00010*m.s,r=.13+.67*Math.sqrt((i*37%97)/97),x=g.x+Math.cos(a)*rr*r+Math.sin(clock*.00045+m.p)*rr*.025,y=g.y+Math.sin(a)*rr*r*.69+Math.cos(clock*.00039+m.p)*rr*.018;dot(x,y,m.f===0?1.7:.85,m.f===0?pal.aqua:pal.glow,.12+.16*(1-r));});ctx.restore();for(var gate=0;gate<12;gate++){var a=gate/12*Math.PI*2+.18,open=.5+.5*Math.sin(clock*.00078+gate*1.39+d.p1),edge=membranePoint(g,d,a,true),nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,len=3+7*open;line({x:edge.x-tx*len,y:edge.y-ty*len},{x:edge.x+tx*len,y:edge.y+ty*len},gate%4===0?pal.aqua:pal.glow,.13+.26*open,.8+open*.7);if(open>.58){var out={x:edge.x+nx*rr*.16,y:edge.y+ny*rr*.12},inn={x:edge.x-nx*rr*.15,y:edge.y-ny*rr*.11},u=(clock*.00013+gate*.083)%1,p={x:lerp(out.x,inn.x,u),y:lerp(out.y,inn.y,u)};line(out,inn,gate%4===0?pal.aqua:pal.glow,.06+.06*open,.7);dot(p.x,p.y,1.35,gate%4===0?pal.aqua:pal.glow,.62);}}}
  function updateLabels(active){var n=active+1;moment.textContent=active===27?"Today":(27-active)+" days ago";index.textContent=String(n).padStart(2,"0");historyLabel.textContent=n+" day"+(n===1?"":"s");depthCopy.textContent=n+" day"+(n===1?"":"s")+" of context";today.hidden=active===27;}
  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);day=lerp(day,dayTarget,.10);if(themeDirty)palette();if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);var active=clamp(Math.round(day),0,27),cx=W*.55,cy=H*.54,R=Math.min(W*.36,H*.37);glow(cx,cy,R*1.55,pal.glow,.025);drawRails(active,cx,cy,R);for(var i=0;i<=active;i++)drawMembraneSlice(i,active,cx,cy,R,i===active);drawTrajectory(active,cx,cy,R);drawActiveInterior(active,cx,cy,R);updateLabels(active);requestAnimationFrame(render);}

  range.addEventListener("input",function(){playing=false;dayTarget=clamp((+range.value||1)-1,0,27);});
  replay.addEventListener("click",function(){playing=true;dayTarget=0;range.value="1";var started=performance.now();function step(now){if(!playing)return;var u=clamp((now-started)/7600,0,1),v=1+Math.round(smooth(u)*27);range.value=String(v);dayTarget=v-1;if(u<1)requestAnimationFrame(step);else playing=false;}requestAnimationFrame(step);});
  today.addEventListener("click",function(){playing=false;range.value="28";dayTarget=27;});
  stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);},{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"25% 0px 25% 0px",threshold:.01}).observe(section);
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();requestAnimationFrame(render);
})();
