(function(){
  "use strict";
  var section=document.getElementById("different");
  if(!section||window.__wmBoundaryFamilies)return;
  window.__wmBoundaryFamilies=true;

  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!document.querySelector('link[data-wm-next-style]')){
    var css=document.createElement("link");css.rel="stylesheet";css.href="assets/css/what-it-measures-next.css?v=4";css.dataset.wmNextStyle="true";document.head.appendChild(css);
  }

  var FAMILY={
    integrity:{name:"Integrity",title:"Boundary remaining",desc:"How much of the stability boundary remains around today's state.",note:"Integrity is the living margin between today's radius and our edge."},
    capacity:{name:"Capacity",title:"Pattern runway",desc:"How much recent-pattern headroom remains before coordinate or volatility loading reaches the canonical boundary thresholds.",note:"Capacity follows the runway left in the rolling pattern as load approaches its entry thresholds."},
    tolerance:{name:"Tolerance",title:"Adaptive bandwidth",desc:"The width of the adaptive band the system is currently working within — the ε available to absorb variation.",note:"Tolerance is the breadth of variation the current membrane can absorb while preserving its organization."},
    laminarity:{name:"Laminarity",title:"Order through exchange",desc:"How cleanly movement remains organized as signals and load travel through the field and across the boundary.",note:"Laminarity is the preservation of ordered routes through exchange."},
    efficiency:{name:"Efficiency",title:"Budget organization",desc:"How closely coordinate and volatility loading follow the optimal allocation of the available boundary budget.",note:"Efficiency rises as the observed loading organizes around the optimal coordinate–volatility allocation."},
    potential:{name:"Potential",title:"Reserve over demand",desc:"The usable difference between reserve and demand — the effective potential available to the system now.",note:"Potential opens as reserve exceeds demand and tightens as demand consumes that reserve."}
  };
  var ORDER=["integrity","capacity","tolerance","laminarity","efficiency","potential"];
  var DEPTH_NAMES=["Whole boundary","Boundary state","Adaptive band","Local edge","Exchange"];

  section.className="wm2 wm2--boundary";
  section.innerHTML=`
    <div class="wm2__shell">
      <header class="wm2__head">
        <p class="eyebrow">What it measures</p>
        <h2 class="h-section" id="wm-heading">A boundary can be read in more than one dimension.</h2>
        <p class="lede">Membrane Health reads one living boundary through six related measurement families. Together they describe its present margin, recent runway, adaptive width, flow order, budget organization, and available potential.</p>
      </header>
      <div class="wm2__instrument">
        <div class="wm2__modebar" role="group" aria-label="Choose a boundary measurement family">
          ${ORDER.map(function(key,i){var f=FAMILY[key];return `<button class="wm2-mode wm-aspect" type="button" data-aspect="${key}" aria-pressed="${i===0}"><span class="wm2-mode__index">0${i+1}</span><span class="wm2-mode__copy"><span class="wm2-mode__kicker">${f.name}</span><strong>${f.title}</strong></span></button>`;}).join("")}
        </div>
        <div class="wm2__stage">
          <canvas class="wm2__canvas" aria-hidden="true"></canvas>
          <div class="wm2__stage-hud">
            <div class="wm2__readout">
              <p class="wm2__readout-kicker" id="wm2-kicker">Integrity</p>
              <h3 class="wm2__readout-title" id="wm2-title">Boundary remaining</h3>
              <p class="wm2__readout-copy" id="wm2-copy">${FAMILY.integrity.desc}</p>
            </div>
            <div class="wm2__phase" aria-live="polite"><span class="wm2__phase-dot"></span><span id="wm2-phase">current radius held within ε</span></div>
          </div>
          <div class="wm2__depth" aria-label="Explore the boundary across scale">
            <div class="wm2__depth-title">Scale</div>
            <div class="wm2__depth-control">
              <input id="wm2-depth" class="wm2__depth-range" type="range" min="0" max="4" step="0.01" value="0" aria-label="Zoom from the whole boundary to local exchange">
              <div class="wm2__depth-labels" aria-hidden="true"><span>Whole</span><span>State</span><span>Band</span><span>Local</span><span>Exchange</span></div>
            </div>
            <button class="wm2__return" id="wm2-return" type="button" hidden>Return to whole</button>
          </div>
          <div class="wm2__scale-readout" aria-live="polite"><span class="wm2__scale-index">01</span><span id="wm2-scale-name">Whole boundary</span></div>
        </div>
        <p class="wm2__note" id="wm2-note">${FAMILY.integrity.note}</p>
      </div>
    </div>`;

  var stage=section.querySelector(".wm2__stage"),canvas=section.querySelector(".wm2__canvas"),ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  var depthInput=document.getElementById("wm2-depth"),returnButton=document.getElementById("wm2-return"),scaleName=document.getElementById("wm2-scale-name"),kicker=document.getElementById("wm2-kicker"),title=document.getElementById("wm2-title"),copy=document.getElementById("wm2-copy"),phaseLabel=document.getElementById("wm2-phase"),note=document.getElementById("wm2-note");
  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,themeDirty=true,mode="integrity",modeStart=0,depth=0,depthTarget=0;
  var pointer={x:0,y:0,tx:0,ty:0},pal={};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){if(r<=0)return;var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.34,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();return[c1,c2];}
  function pulseCurve(a,b,bend,u,c,alpha,r){var cs=curve(a,b,bend,c,alpha*.14,.6),c1=cs[0],c2=cs[1],v=1-u,uu=u*u,vv=v*v,p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};glow(p.x,p.y,(r||1.6)*7,c,alpha*.11);dot(p.x,p.y,r||1.6,c,alpha);}

  var particles=Array.from({length:132},function(_,i){var a=hash(i*4.7)*Math.PI*2,r=.10+Math.sqrt(hash(i*8.3))*.78;return{a:a,r:r,p:hash(i*13.1)*Math.PI*2,s:.35+hash(i*17.9)*.75,f:i%7};});
  var history=Array.from({length:28},function(_,i){var u=i/27;return{x:-.25+u*.44+Math.sin(i*.7)*.07,y:.13-Math.sin(i*.41)*.14,coord:.18+.47*(.5+.5*Math.sin(i*.31+1.2)),vol:.12+.42*(.5+.5*Math.sin(i*.53+2.0))};});

  function boundaryPoint(cx,cy,R,a,scale){var live=1+.006*Math.sin(a*3+clock*.00025)+.004*Math.sin(a*7-clock*.00013);return{x:cx+Math.cos(a)*R*(scale||1)*live,y:cy+Math.sin(a)*R*.77*(scale||1)*live};}
  function drawBoundary(cx,cy,R,c,a,w,scale,dash){ctx.beginPath();for(var i=0;i<=180;i++){var p=boundaryPoint(cx,cy,R,i/180*Math.PI*2,scale||1);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.strokeStyle=rgba(c,a);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.shadowColor=rgba(c,a*.35);ctx.shadowBlur=w>1?15:0;ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);}
  function drawField(cx,cy,R,alpha){for(var i=0;i<7;i++){var z=.12+i*.125,d=.52+.62*z;ctx.beginPath();ctx.ellipse(cx+pointer.x*R*(z-.5)*.05,cy+pointer.y*R*(z-.5)*.035,R*d,R*.77*d,0,0,Math.PI*2);ctx.strokeStyle=rgba(i%2?pal.aqua:pal.glow,(.012+.018*z)*alpha);ctx.lineWidth=.65;ctx.stroke();}particles.forEach(function(p,i){var a=p.a+clock*.000025*p.s,r=R*p.r,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.77,c=i%6===0?pal.aqua:pal.glow;dot(x,y,.55+(i%9===0?1.0:0),c,.05+.09*(1-p.r));});}
  function camera(cx,cy,R){var angle=-.28,stops=[{x:cx,y:cy},{x:cx+R*.16,y:cy-R*.06},{x:cx+Math.cos(angle)*R*.65,y:cy+Math.sin(angle)*R*.50},{x:cx+Math.cos(angle)*R*.91,y:cy+Math.sin(angle)*R*.70},{x:cx+Math.cos(angle)*R*1.02,y:cy+Math.sin(angle)*R*.79}],scales=[1,1.28,1.66,2.18,2.88],i=Math.min(3,Math.floor(depth)),f=smooth(depth-i),focus={x:lerp(stops[i].x,stops[i+1].x,f),y:lerp(stops[i].y,stops[i+1].y,f)},s=lerp(scales[i],scales[i+1],f),screen={x:W*.54,y:H*.52};ctx.translate(screen.x,screen.y);ctx.scale(s,s);ctx.translate(-focus.x,-focus.y);return{focus:focus,s:s,screen:screen};}

  function integrity(cx,cy,R){var t=(clock-modeStart)%12000/12000,occup=.46+.24*(.5+.5*Math.sin(t*Math.PI*2)),eps=1,pos={x:cx+R*occup*.74,y:cy-R*.08};drawBoundary(cx,cy,R,pal.glow,.34,1.5,eps);drawBoundary(cx,cy,R,pal.soft,.07,.7,.78,[3,10]);var edge=boundaryPoint(cx,cy,R,-.08,.97);curve(pos,edge,-R*.09,pal.glow,.32,1.3);glow(pos.x,pos.y,38,pal.glow,.08);dot(pos.x,pos.y,4,pal.glow,.92);dot(edge.x,edge.y,2.4,pal.glow,.72);ctx.beginPath();ctx.arc(cx,cy,R*.71,-.47,.08);ctx.strokeStyle=rgba(pal.glow,.16);ctx.lineWidth=6;ctx.stroke();phaseLabel.textContent="current radius held within ε";}
  function capacity(cx,cy,R){drawBoundary(cx,cy,R,pal.glow,.25,1.25);var tauCoord=.72,tauVol=.83;ctx.save();ctx.translate(cx,cy);ctx.beginPath();ctx.arc(0,0,R*tauCoord,0,Math.PI*2);ctx.strokeStyle=rgba(pal.aqua,.09);ctx.lineWidth=.8;ctx.setLineDash([4,10]);ctx.stroke();ctx.beginPath();ctx.arc(0,0,R*tauVol,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,.08);ctx.stroke();ctx.setLineDash([]);ctx.restore();var pts=[];history.forEach(function(h,i){var fade=.06+.28*i/27,p={x:cx+h.x*R,y:cy+h.y*R*.78};pts.push(p);dot(p.x,p.y,i===27?3.8:1.2,i%4===0?pal.aqua:pal.glow,fade);if(i)line(pts[i-1],p,pal.glow,.035+.06*i/27,.7);});var now=pts[27],edge=boundaryPoint(cx,cy,R,-.17,.90);curve(now,edge,-R*.06,pal.glow,.27,1.2);for(var q=0;q<3;q++)pulseCurve(now,edge,-R*.06,(clock*.00007+q*.31)%1,q%2?pal.aqua:pal.glow,.48,1.4);phaseLabel.textContent="rolling coord / volatility runway";}
  function tolerance(cx,cy,R){var t=(clock-modeStart)%14000/14000,current=.76+.08*Math.sin(t*Math.PI*2),sens=.62,guard=.94;drawBoundary(cx,cy,R,pal.aqua,.13,.85,sens,[3,9]);drawBoundary(cx,cy,R,pal.glow,.34,1.55,current);drawBoundary(cx,cy,R,pal.soft,.10,.8,guard,[4,11]);var a=-.30,p0=boundaryPoint(cx,cy,R,a,sens),p1=boundaryPoint(cx,cy,R,a,current),p2=boundaryPoint(cx,cy,R,a,guard);line(p0,p2,pal.soft,.16,1);dot(p0.x,p0.y,2,pal.aqua,.65);dot(p1.x,p1.y,3,pal.glow,.9);dot(p2.x,p2.y,2,pal.soft,.5);for(var i=0;i<10;i++){var aa=i/10*Math.PI*2+.11,open=.3+.7*(.5+.5*Math.sin(clock*.0006+i));var inn=boundaryPoint(cx,cy,R,aa,current-.035*open),out=boundaryPoint(cx,cy,R,aa,current+.035*open);line(inn,out,i%3?pal.glow:pal.aqua,.06+.10*open,.7);}phaseLabel.textContent="adaptive ε between personal floor and guard";}
  function laminarity(cx,cy,R){drawBoundary(cx,cy,R,pal.aqua,.25,1.2);var order=.72+.20*Math.sin(clock*.00012);for(var i=0;i<20;i++){var off=(i-9.5)*R*.038,start={x:cx-R*1.15,y:cy+off*.75},end={x:cx+R*1.12,y:cy+off*.70},bend=Math.sin(i*.7)*R*.025*(1-order);curve(start,end,bend,i%5===0?pal.glow:pal.aqua,.035+.07*order,.7+i%4*.08);if(i%3===0)pulseCurve(start,end,bend,(clock*.000055+i*.071)%1,i%5===0?pal.glow:pal.aqua,.40+.20*order,1.3);}for(var j=0;j<5;j++){var aa=-.55+j*.25,edge=boundaryPoint(cx,cy,R,aa,.98);glow(edge.x,edge.y,R*.05,pal.aqua,.015+.02*order);}phaseLabel.textContent="exchange routes preserving flow order";}
  function efficiency(cx,cy,R){drawBoundary(cx,cy,R,pal.glow,.22,1.2);var t=(clock-modeStart)%16000/16000,coord=.52+.18*Math.sin(t*Math.PI*2),vol=.36+.14*Math.sin(t*Math.PI*2+1.4),theta=.72;var left={x:cx-R*.67,y:cy+R*.18},right={x:cx+R*.67,y:cy+R*.18},target={x:cx,y:cy-R*.12};for(var i=0;i<9;i++){var s={x:left.x+(i-4)*R*.018,y:left.y+(i%2?R*.025:-R*.025)},bend=-R*(.12+.01*i);curve(s,target,bend,pal.aqua,.035+.09*coord,.7);pulseCurve(s,target,bend,(clock*.000065+i*.082)%1,pal.aqua,.45*coord,1.2);}for(var j=0;j<9;j++){var v={x:right.x+(j-4)*R*.018,y:right.y+(j%2?R*.025:-R*.025)},bend=R*(.12+.01*j);curve(v,target,bend,pal.glow,.035+.09*vol,.7);pulseCurve(v,target,bend,(clock*.00007+j*.074)%1,pal.glow,.45*vol,1.2);}ctx.beginPath();ctx.arc(target.x,target.y,R*.12,0,Math.PI*2);ctx.strokeStyle=rgba(pal.soft,.16);ctx.lineWidth=1;ctx.stroke();dot(target.x,target.y,3,pal.soft,.72);ctx.font="500 9px ui-sans-serif,system-ui";ctx.fillStyle=rgba(pal.aqua,.55);ctx.textAlign="center";ctx.fillText("coord",left.x,left.y+R*.16);ctx.fillStyle=rgba(pal.glow,.55);ctx.fillText("vol",right.x,right.y+R*.16);phaseLabel.textContent="coord / volatility allocation approaching optimum";}
  function potential(cx,cy,R){var t=(clock-modeStart)%15000/15000,reserve=.68+.13*Math.sin(t*Math.PI*2),demand=.44+.18*Math.sin(t*Math.PI*2+1.25),pot=reserve-demand,scale=1+pot*.12;drawBoundary(cx,cy,R,pot>=0?pal.go:pal.ease,.24+.08*Math.abs(pot),1.4,scale);var C={x:cx-R*.55,y:cy},V={x:cx+R*.55,y:cy},mid={x:cx,y:cy};glow(C.x,C.y,R*.26,pal.aqua,.035+.06*reserve);glow(V.x,V.y,R*.26,pal.ease,.025+.07*demand);for(var i=0;i<12;i++){var a={x:C.x-R*.15,y:C.y+(i-5.5)*R*.025},b={x:V.x+R*.15,y:V.y+(i-5.5)*R*.025},bend=(i-5.5)*R*.008;curve(a,b,bend,i%3===0?pal.glow:pal.aqua,.028+.05*Math.max(reserve,demand),.65);pulseCurve(a,b,bend,(clock*.00005+i*.077)%1,i%3===0?pal.glow:pal.aqua,.35+.18*reserve,1.25);}ctx.font="500 10px ui-sans-serif,system-ui";ctx.textAlign="center";ctx.fillStyle=rgba(pal.aqua,.62);ctx.fillText("reserve",C.x,C.y+R*.32);ctx.fillStyle=rgba(pal.ease,.62);ctx.fillText("demand",V.x,V.y+R*.32);glow(mid.x,mid.y,R*.18,pot>=0?pal.go:pal.ease,.035+.08*Math.abs(pot));dot(mid.x,mid.y,3.5,pot>=0?pal.go:pal.ease,.82);phaseLabel.textContent=pot>=0?"reserve exceeds demand · potential open":"demand drawing down reserve";}
  function deepDetails(cx,cy,R){if(depth<2.0)return;var a=-.28,edge=boundaryPoint(cx,cy,R,a,.98),nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,local=clamp((depth-2)/2,0,1);for(var g=0;g<11;g++){var spread=(g-5)*R*.016,open=.28+.72*(.5+.5*Math.sin(clock*.0007+g*.91)),x=edge.x+tx*spread,y=edge.y+ty*spread;line({x:x-tx*R*.011*(.4+open),y:y-ty*R*.011*(.4+open)},{x:x+tx*R*.011*(.4+open),y:y+ty*R*.011*(.4+open)},g%3===0?pal.aqua:pal.glow,.06+.16*open*local,.7+open*.5);if(depth>3.1&&open>.48){var out={x:x+nx*R*.09,y:y+ny*R*.09},inn={x:x-nx*R*.09,y:y-ny*R*.09};pulseCurve(out,inn,0,(clock*.00015+g*.083)%1,g%3===0?pal.aqua:pal.glow,.45+.3*local,1.2+local);}}}
  function setMode(next){if(!FAMILY[next])return;mode=next;modeStart=clock;section.dataset.wmMode=mode;section.querySelectorAll(".wm2-mode").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.aspect===mode?"true":"false");});var f=FAMILY[mode];kicker.textContent=f.name;title.textContent=f.title;copy.textContent=f.desc;note.textContent=f.note;}
  function updateScale(){var i=Math.round(depthTarget);scaleName.textContent=DEPTH_NAMES[i];returnButton.hidden=depthTarget<.35;section.dataset.wmDepth=String(i);}
  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);depth=lerp(depth,depthTarget,.07);if(themeDirty)palette();if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);var cx=W*.54,cy=H*.52,R=Math.min(W*.40,H*.50);ctx.save();camera(cx,cy,R);glow(cx,cy,R*1.42,pal.glow,.018);drawField(cx,cy,R,.85);if(mode==="integrity")integrity(cx,cy,R);else if(mode==="capacity")capacity(cx,cy,R);else if(mode==="tolerance")tolerance(cx,cy,R);else if(mode==="laminarity")laminarity(cx,cy,R);else if(mode==="efficiency")efficiency(cx,cy,R);else potential(cx,cy,R);deepDetails(cx,cy,R);ctx.restore();requestAnimationFrame(render);}
  section.querySelectorAll(".wm2-mode").forEach(function(b){b.addEventListener("click",function(){setMode(b.dataset.aspect);});});
  depthInput.addEventListener("input",function(){depthTarget=clamp(+depthInput.value||0,0,4);updateScale();});returnButton.addEventListener("click",function(){depthTarget=0;depthInput.value="0";updateScale();});stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);},{passive:true});stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});new ResizeObserver(resize).observe(stage);new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"25% 0px 25% 0px",threshold:.01}).observe(section);new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});palette();resize();setMode("integrity");updateScale();requestAnimationFrame(render);
})();
