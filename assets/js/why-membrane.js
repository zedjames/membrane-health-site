(function(){
  "use strict";
  var section=document.getElementById("idea");
  if(!section||window.__whyMembraneNext)return;
  window.__whyMembraneNext=true;
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(!document.querySelector('link[data-we-next-style]')){
    var css=document.createElement("link");
    css.rel="stylesheet";
    css.href="assets/css/why-membrane-next.css?v=1";
    css.dataset.weNextStyle="true";
    document.head.appendChild(css);
  }

  section.className="we2";
  section.innerHTML=`
    <div class="we2__shell">
      <header class="we2__copy">
        <p class="eyebrow">Why "membrane"?</p>
        <h2 class="h-section" id="idea-exp-heading">Everything alive has an edge.</h2>
        <p class="lede">A membrane gives a living system shape by holding an interior, meeting its surroundings, and regulating the exchange between them. Through that boundary, relationships can remain stable enough for the system to continue being itself while the world around it changes.</p>
        <p class="subtle">Our bodies carry this principle at every scale. Load moves through us, conditions change around us, recovery restores room, and living organization continually adjusts while preserving its continuity.</p>
        <p class="subtle">Membrane Health reads today's state within that living boundary and follows how your position changes through time. The distance to the edge becomes a measure of capacity: the room available to move, adapt, recover, and continue being yourself under changing load.</p>
        <p class="we2__sign serif-italic">— the light you find by going in.</p>
      </header>

      <div class="we2__experience">
        <div class="we2__stage">
          <canvas id="we-field" class="we2__canvas" role="img" aria-label="An interactive passage from a system's surroundings through its living membrane into a nested interior where the same boundary and exchange principle repeats across scales."></canvas>
          <div class="we2__state" aria-live="polite">
            <span class="we2__state-index" id="we2-index">01</span>
            <div><span class="we2__state-kicker" id="we2-kicker">Surroundings</span><strong id="we-moment">The surroundings</strong></div>
          </div>
          <div class="we2__principle" aria-hidden="true">
            <span><i></i>difference</span><span><i></i>boundary</span><span><i></i>exchange</span><span><i></i>continuity</span>
          </div>
          <div class="we2__depth" id="we2-depth" hidden>
            <span>scale</span><strong id="we2-scale">parent system</strong>
          </div>
          <div class="we2__hint" id="we2-hint">move toward the edge</div>
        </div>

        <div class="we2__crossing">
          <div class="we2__crossing-top"><span>cross the edge</span><span id="we2-progress">surroundings</span></div>
          <input class="we2__range" id="we-range" type="range" min="0" max="100" step="0.1" value="0" aria-label="Move from the surroundings, through the membrane, into the interior, and toward a nested living system">
          <div class="we2__scale" aria-hidden="true"><span>surroundings</span><span>threshold</span><span>interior</span><span>within</span></div>
          <div class="we2__actions"><button id="we-replay" type="button">Cross the edge →</button><button id="we2-outside" type="button" hidden>Return outside</button></div>
        </div>
      </div>
    </div>`;

  var stage=section.querySelector(".we2__stage"),canvas=document.getElementById("we-field"),ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  var range=document.getElementById("we-range"),moment=document.getElementById("we-moment"),index=document.getElementById("we2-index"),kicker=document.getElementById("we2-kicker"),progressLabel=document.getElementById("we2-progress"),replay=document.getElementById("we-replay"),outside=document.getElementById("we2-outside"),hint=document.getElementById("we2-hint"),depthHud=document.getElementById("we2-depth"),scaleLabel=document.getElementById("we2-scale");

  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,themeDirty=true,p=0,target=0,playing=false,focalChild=2;
  var pointer={x:0,y:0,tx:0,ty:0},pal={};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function smoother(t){t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.night=cs.getPropertyValue("--night").trim()||"#0A0A0F";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){if(r<=0)return;var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.34,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();return[c1,c2];}
  function pulseCurve(a,b,bend,u,c,alpha,r){var cs=curve(a,b,bend,c,alpha*.18,.65),c1=cs[0],c2=cs[1],v=1-u,uu=u*u,vv=v*v,pt={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};glow(pt.x,pt.y,(r||1.7)*7,c,alpha*.12);dot(pt.x,pt.y,r||1.7,c,alpha);}

  var outsideMotes=Array.from({length:86},function(_,i){return{a:hash(i*3.7)*Math.PI*2,r:.55+hash(i*7.1)*.75,p:hash(i*11.7)*Math.PI*2,s:.5+hash(i*13.9)*.8,f:i%6};});
  var interiorMotes=Array.from({length:110},function(_,i){return{a:hash(i*4.3)*Math.PI*2,r:.08+Math.sqrt(hash(i*8.1))*.78,p:hash(i*12.5)*Math.PI*2,s:.55+hash(i*16.9)*.9,f:i%7};});
  var children=[
    {x:-.36,y:-.18,r:.17,p:.4},{x:.24,y:-.29,r:.145,p:1.6},{x:.34,y:.13,r:.19,p:2.7},{x:-.19,y:.30,r:.15,p:4.1},{x:.02,y:.02,r:.115,p:5.2}
  ];

  function phase(){if(p<.22)return 0;if(p<.56)return 1;if(p<.82)return 2;return 3;}
  function updateLabels(){var ph=phase();var names=["Surroundings","Living threshold","Interior","Scale within scale"],moments=["The surroundings","The edge becomes a passage","Inside the living system","The same principle, one scale down"],prog=["surroundings","crossing the edge","interior","nested scale"],hints=["move toward the edge","the boundary has depth","move through the interior","choose a living system and keep going"];index.textContent="0"+(ph+1);kicker.textContent=names[ph];moment.textContent=moments[ph];progressLabel.textContent=prog[ph];hint.textContent=hints[ph];outside.hidden=target<.02;depthHud.hidden=ph<3;scaleLabel.textContent=ph<3?"parent system":(p>.94?"system within system":"nested system");section.dataset.wePhase=String(ph);}

  function parentGeometry(){var approach=smooth(clamp(p/.56,0,1)),inside=smooth(clamp((p-.54)/.28,0,1));var cx=lerp(W*.61,W*.50,approach)+pointer.x*lerp(8,18,inside),cy=H*.51+pointer.y*lerp(6,14,inside);var R=lerp(Math.min(W,H)*.21,Math.min(W,H)*.82,approach);return{cx:cx,cy:cy,R:R,inside:inside,approach:approach};}

  function drawOutside(g){var fade=1-smooth(clamp((p-.36)/.26,0,1));if(fade<=.01)return;outsideMotes.forEach(function(m,i){var a=m.a+clock*.000045*m.s,r=g.R*m.r*(1+.035*Math.sin(clock*.00035+m.p)),x=g.cx+Math.cos(a)*r,y=g.cy+Math.sin(a)*r*.72;dot(x,y,m.f===0?1.7:.8,m.f===0?pal.aqua:pal.soft,(.06+.12*(1-m.r/1.3))*fade);});for(var q=0;q<14;q++){var a=-2.65+q/13*2.4,outer={x:g.cx+Math.cos(a)*g.R*2.35,y:g.cy+Math.sin(a)*g.R*1.45},edge={x:g.cx+Math.cos(a)*g.R*.98,y:g.cy+Math.sin(a)*g.R*.70};curve(outer,edge,(q%2?1:-1)*22,q%4===0?pal.aqua:pal.glow,.035+.06*fade,.8);pulseCurve(outer,edge,(q%2?1:-1)*22,(clock*.00008+q*.071)%1,q%4===0?pal.aqua:pal.glow,.45*fade,1.4);}}

  function drawOuterBoundary(g){var boundaryAlpha=.16+.28*smooth(clamp((p-.08)/.50,0,1));ctx.beginPath();for(var i=0;i<=180;i++){var a=i/180*Math.PI*2,warp=1+.014*Math.sin(a*3+clock*.00018)+.008*Math.sin(a*7-clock*.00011),x=g.cx+Math.cos(a)*g.R*warp,y=g.cy+Math.sin(a)*g.R*.72*warp;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.strokeStyle=rgba(pal.glow,boundaryAlpha);ctx.lineWidth=1.2+g.approach*.8;ctx.shadowColor=rgba(pal.glow,.18);ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;for(var k=0;k<16;k++){var a=k/16*Math.PI*2+.12,open=.5+.5*Math.sin(clock*.00072+k*1.27),ex=g.cx+Math.cos(a)*g.R,ey=g.cy+Math.sin(a)*g.R*.72,nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,len=(3+8*open)*(1+g.approach*.7);line({x:ex-tx*len,y:ey-ty*len},{x:ex+tx*len,y:ey+ty*len},k%4===0?pal.aqua:pal.glow,.10+.25*open,1+open*.7);if(open>.60){var out={x:ex+nx*g.R*.12,y:ey+ny*g.R*.09},inn={x:ex-nx*g.R*.11,y:ey-ny*g.R*.08};pulseCurve(out,inn,0,(clock*.00012+k*.083)%1,k%4===0?pal.aqua:pal.glow,.58,1.35);}}}

  function drawThresholdTunnel(g){var cross=smooth(clamp((p-.18)/.47,0,1)),peak=1-Math.abs(p-.47)/.31;peak=clamp(peak,0,1);if(cross<=.01)return;var cx=W*.50+pointer.x*12,cy=H*.51+pointer.y*8;for(var i=0;i<34;i++){var z=i/33,phaseShift=clock*.00004*(i%5+1),base=Math.min(W,H)*lerp(.05,1.02,z),travel=lerp(1.22,.30,cross),rr=base*travel*(1+.022*Math.sin(i*.72+clock*.00018)),alpha=(.018+.095*(1-z))*peak*(.45+.55*cross);ctx.beginPath();for(var j=0;j<=96;j++){var a=j/96*Math.PI*2,warp=1+.035*Math.sin(a*3+i*.31+phaseShift)+.016*Math.sin(a*8-i*.19),x=cx+Math.cos(a)*rr*warp,y=cy+Math.sin(a)*rr*.70*warp;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.strokeStyle=rgba(i%5===0?pal.aqua:pal.glow,alpha);ctx.lineWidth=i%5===0?1.1:.65;ctx.stroke();if(i%4===0){var a=clock*.00025+i*.83,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.70;glow(x,y,10,i%8===0?pal.aqua:pal.glow,.022*peak);dot(x,y,1.4,i%8===0?pal.aqua:pal.glow,.32*peak);}}for(var s=0;s<18;s++){var a=s/18*Math.PI*2+clock*.00012,from={x:cx+Math.cos(a)*Math.min(W,H)*.62,y:cy+Math.sin(a)*Math.min(W,H)*.43},to={x:cx+Math.cos(a+.25)*Math.min(W,H)*.08,y:cy+Math.sin(a+.25)*Math.min(W,H)*.055};curve(from,to,(s%2?1:-1)*36,s%4===0?pal.aqua:pal.glow,.018+.065*peak,.75);pulseCurve(from,to,(s%2?1:-1)*36,(clock*.00010+s*.063)%1,s%4===0?pal.aqua:pal.glow,.40*peak,1.35);}glow(cx,cy,Math.min(W,H)*.24,pal.glow,.04*peak);}

  function childGeom(ch,g,deep){var innerR=Math.min(W,H)*.34,spread=lerp(1,.80,smooth(clamp((deep-.05)/.75,0,1))),x=g.cx+ch.x*innerR*spread,y=g.cy+ch.y*innerR*.78*spread,r=ch.r*innerR*(1+.045*Math.sin(clock*.00055+ch.p));return{x:x,y:y,r:r};}
  function drawChild(ch,i,g,deep){var c=childGeom(ch,g,deep),em=i===focalChild?1+.7*smooth(clamp((deep-.15)/.65,0,1)):1,alpha=.10+.20*deep*(i===focalChild?1:.6);glow(c.x,c.y,c.r*1.8,i%2?pal.aqua:pal.glow,.018*em);ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.strokeStyle=rgba(i%2?pal.aqua:pal.glow,alpha*em);ctx.lineWidth=i===focalChild?1.5:.8;ctx.stroke();for(var gate=0;gate<7;gate++){var a=gate/7*Math.PI*2+ch.p,open=.5+.5*Math.sin(clock*.001+gate*.9+ch.p),ex=c.x+Math.cos(a)*c.r,ey=c.y+Math.sin(a)*c.r,nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,len=2+3.5*open;line({x:ex-tx*len,y:ey-ty*len},{x:ex+tx*len,y:ey+ty*len},gate%3===0?pal.aqua:pal.glow,.10+.18*open*deep,.7+open*.4);if(open>.64){var out={x:ex+nx*c.r*.24,y:ey+ny*c.r*.24},inn={x:ex-nx*c.r*.22,y:ey-ny*c.r*.22};pulseCurve(out,inn,0,(clock*.00013+gate*.12)%1,gate%3===0?pal.aqua:pal.glow,.45*deep,1.0);}}for(var n=0;n<5;n++){var a=clock*.0002*(.8+i*.08)+ch.p+n*1.24,rr=c.r*(.22+.12*n);dot(c.x+Math.cos(a)*rr,c.y+Math.sin(a)*rr,1.0,n%2?pal.aqua:pal.glow,.16+.12*deep);}return c;}

  function drawInterior(g){var deep=smooth(clamp((p-.55)/.45,0,1));if(deep<=.01)return;glow(g.cx,g.cy,Math.min(W,H)*.46,pal.aquaDeep,.035*deep);interiorMotes.forEach(function(m,i){var a=m.a+clock*.00008*m.s,r=Math.min(W,H)*.36*m.r,x=g.cx+Math.cos(a)*r+Math.sin(clock*.0003+m.p)*7,y=g.cy+Math.sin(a)*r*.76+Math.cos(clock*.00027+m.p)*5;dot(x,y,m.f===0?1.6:.8,m.f===0?pal.aqua:pal.glow,(.06+.16*(1-m.r))*deep);});var childGeoms=[];children.forEach(function(ch,i){childGeoms.push(drawChild(ch,i,g,deep));});for(var i=0;i<childGeoms.length;i++)for(var j=i+1;j<childGeoms.length;j++)if((i+j)%2===0){curve(childGeoms[i],childGeoms[j],(i-j)*8,(i+j)%3===0?pal.aqua:pal.glow,.02+.045*deep,.65);if(deep>.38)pulseCurve(childGeoms[i],childGeoms[j],(i-j)*8,(clock*.00006+i*.11+j*.17)%1,(i+j)%3===0?pal.aqua:pal.glow,.34*deep,1.0);}
    if(deep>.60){var c=childGeoms[focalChild];var focus=smooth((deep-.60)/.40),scale=lerp(1,3.3,focus),screen={x:W*.54,y:H*.52};ctx.save();ctx.globalAlpha=.28*focus;for(var ring=0;ring<12;ring++){var rr=c.r*(1.25+ring*.34)*scale;ctx.beginPath();ctx.ellipse(screen.x,screen.y,rr,rr*.72,0,0,Math.PI*2);ctx.strokeStyle=rgba(ring%3===0?pal.aqua:pal.glow,.045*(1-ring/14));ctx.lineWidth=.7;ctx.stroke();}ctx.restore();if(deep>.82){var sub=smooth((deep-.82)/.18);for(var q=0;q<5;q++){var a=q/5*Math.PI*2+clock*.00012,rr=c.r*scale*(.20+.15*q),x=screen.x+Math.cos(a)*rr,y=screen.y+Math.sin(a)*rr*.72;ctx.beginPath();ctx.arc(x,y,c.r*scale*(.08+.02*(q%2)),0,Math.PI*2);ctx.strokeStyle=rgba(q%2?pal.aqua:pal.glow,.08+.12*sub);ctx.lineWidth=.8;ctx.stroke();for(var n=0;n<3;n++){var aa=clock*.00024+n*2.1+q,pr=c.r*scale*.035;dot(x+Math.cos(aa)*pr,y+Math.sin(aa)*pr,1.1,q%2?pal.aqua:pal.glow,.28*sub);}}}}
  }

  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);p=lerp(p,target,.075);if(themeDirty)palette();if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);var g=parentGeometry();drawOutside(g);drawOuterBoundary(g);drawThresholdTunnel(g);drawInterior(g);updateLabels();requestAnimationFrame(render);}

  range.addEventListener("input",function(){playing=false;target=clamp((+range.value||0)/100,0,1);});
  replay.addEventListener("click",function(){playing=true;target=0;range.value="0";var start=performance.now();function step(now){if(!playing)return;var u=clamp((now-start)/9000,0,1),v=smoother(u)*100;range.value=v.toFixed(1);target=v/100;if(u<1)requestAnimationFrame(step);else playing=false;}requestAnimationFrame(step);});
  outside.addEventListener("click",function(){playing=false;target=0;range.value="0";});
  stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);},{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  stage.addEventListener("click",function(e){if(target<.72)return;var r=stage.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,g=parentGeometry(),deep=smooth(clamp((p-.55)/.45,0,1)),best=focalChild,bd=Infinity;children.forEach(function(ch,i){var c=childGeom(ch,g,deep),d=(c.x-mx)*(c.x-mx)+(c.y-my)*(c.y-my);if(d<bd){bd=d;best=i;}});if(bd<Math.pow(Math.min(W,H)*.13,2))focalChild=best;});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"30% 0px 30% 0px",threshold:.01}).observe(section);
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();updateLabels();requestAnimationFrame(render);
})();
