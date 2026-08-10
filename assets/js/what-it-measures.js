(function(){
  "use strict";
  var section=document.getElementById("different");
  if(!section||window.__wmBoundaryGrand)return;
  window.__wmBoundaryGrand=true;

  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!document.querySelector('link[data-wm-next-style]')){
    var css=document.createElement("link");css.rel="stylesheet";css.href="assets/css/what-it-measures-next.css?v=5";css.dataset.wmNextStyle="true";document.head.appendChild(css);
  }

  var FAMILY={
    integrity:{name:"Integrity",title:"Boundary remaining",desc:"The living margin between today's state and the stability edge.",note:"Integrity makes the remaining boundary visible as a spatial margin around the current state."},
    capacity:{name:"Capacity",title:"Pattern runway",desc:"The runway remaining in the rolling physiological pattern as coordinate and volatility loading approach their canonical thresholds.",note:"Capacity gives recent history depth, so the direction of the rolling pattern can be seen alongside today's boundary."},
    tolerance:{name:"Tolerance",title:"Adaptive bandwidth",desc:"The width of the adaptive band the system is currently working within — the ε available to absorb variation.",note:"Tolerance shows the living bandwidth between the personal floor, the current membrane, and the protective guard."},
    laminarity:{name:"Laminarity",title:"Order through exchange",desc:"The degree to which movement preserves ordered routes as load and information travel through the field and across the boundary.",note:"Laminarity becomes visible as the difference between organized transport and flow that spends energy continually correcting itself."},
    efficiency:{name:"Efficiency",title:"Budget organization",desc:"How closely coordinate and volatility loading organize around the optimal allocation of the available boundary budget.",note:"Efficiency shows whether the two kinds of loading arrive in a proportion the boundary can use cleanly."},
    potential:{name:"Potential",title:"Reserve over demand",desc:"The effective difference between reserve and demand — the usable potential available to the system now.",note:"Potential opens as reserve exceeds demand and contracts as demand consumes the available reserve."}
  };
  var ORDER=["integrity","capacity","tolerance","laminarity","efficiency","potential"];
  var DEPTH_NAMES=["Whole boundary","State volume","Adaptive edge","Local exchange","Exchange detail"];

  section.className="wm2 wm2--boundary wm2--grand";
  section.innerHTML=`
    <div class="wm2__shell">
      <header class="wm2__head">
        <p class="eyebrow">What it measures</p>
        <h2 class="h-section" id="wm-heading">One living boundary. Six ways to read it.</h2>
        <p class="lede">Integrity, capacity, tolerance, laminarity, efficiency, and potential reveal different properties of the same bounded physiological state. Move through the field and watch the boundary change meaning without changing identity.</p>
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
            <div class="wm2__phase" aria-live="polite"><span class="wm2__phase-dot"></span><span id="wm2-phase">boundary breathing around the current state</span></div>
          </div>
          <div class="wm2__depth" aria-label="Move through the boundary across scale">
            <div class="wm2__depth-title">Depth</div>
            <div class="wm2__depth-control">
              <input id="wm2-depth" class="wm2__depth-range" type="range" min="0" max="4" step="0.01" value="0" aria-label="Move from the whole boundary into local exchange">
              <div class="wm2__depth-labels" aria-hidden="true"><span>Whole</span><span>State</span><span>Edge</span><span>Local</span><span>Exchange</span></div>
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
  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,mode="integrity",modeStart=0,depth=0,depthTarget=0,themeDirty=true,pal={},pointer={x:0,y:0,tx:0,ty:0};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){if(r<=0)return;var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.28,rgba(c,a*.36));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();return[c1,c2];}
  function pulseCurve(a,b,bend,u,c,alpha,r){var cs=curve(a,b,bend,c,alpha*.14,.55),c1=cs[0],c2=cs[1],v=1-u,uu=u*u,vv=v*v,p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};glow(p.x,p.y,(r||1.5)*7,c,alpha*.11);dot(p.x,p.y,r||1.5,c,alpha);}

  var motes=Array.from({length:280},function(_,i){var a=hash(i*3.91)*Math.PI*2,r=Math.sqrt(hash(i*7.31))*.91;return{x:Math.cos(a)*r,y:Math.sin(a)*r,z:hash(i*11.27),p:hash(i*17.4)*Math.PI*2,s:.45+hash(i*23.8)*.9,g:i%7};});
  var history=Array.from({length:28},function(_,i){var u=i/27;return{x:-.34+u*.55+Math.sin(i*.61)*.09,y:.17-Math.sin(i*.43)*.18-u*.06,z:u};});
  var streamSeeds=Array.from({length:34},function(_,i){return{y:(i-16.5)/17,p:hash(i*8.9)*Math.PI*2,s:.65+hash(i*13.4)*.6};});

  function membranePoint(cx,cy,R,a,scale,z){var warp=1+.018*Math.sin(a*3+clock*.00023+(z||0)*2.1)+.009*Math.sin(a*7-clock*.00013);var rr=R*(scale||1)*warp;return{x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*.75};}
  function drawMembrane(cx,cy,R,c,alpha,scale,dash,blur){ctx.beginPath();for(var i=0;i<=180;i++){var p=membranePoint(cx,cy,R,i/180*Math.PI*2,scale||1,0);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=1.25;if(dash)ctx.setLineDash(dash);if(blur){ctx.shadowColor=rgba(c,alpha*.45);ctx.shadowBlur=blur;}ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);}
  function drawVolume(cx,cy,R,alpha){var deep=clamp(depth/4,0,1);for(var i=0;i<12;i++){var z=i/11,shift=(z-.5)*R*.22*(.25+deep),scale=.46+.54*z;ctx.beginPath();ctx.ellipse(cx+pointer.x*R*.08*(z-.5)+shift*.18,cy-R*.08*(1-z)+pointer.y*R*.04*(z-.5),R*scale,R*.75*scale,0,0,Math.PI*2);ctx.strokeStyle=rgba(i%3===0?pal.aqua:pal.glow,(.008+.020*z)*alpha*(1-.42*deep));ctx.lineWidth=.55;ctx.stroke();}}
  function projectMote(m,cx,cy,R){var spin=clock*.000055*(.55+m.s),a=Math.atan2(m.y,m.x)+spin,r=Math.hypot(m.x,m.y),z=m.z;var perspective=.53+.63*z;return{x:cx+Math.cos(a)*r*R*perspective+pointer.x*R*(z-.5)*.08,y:cy+Math.sin(a)*r*R*.75*perspective+pointer.y*R*(z-.5)*.05,z:z};}
  function drawMotes(cx,cy,R,field){motes.forEach(function(m,i){var q=projectMote(m,cx,cy,R),c=m.g===0?pal.aqua:(m.g===5?pal.soft:pal.glow),a=.045+.20*q.z;if(field==="potential"&&m.g%3===0)c=pal.go;if(field==="laminarity"&&m.g%4===0)c=pal.aqua;dot(q.x,q.y,.45+1.25*q.z,c,a);if(i%31===0)glow(q.x,q.y,10+10*q.z,c,.012+.014*q.z);});}
  function camera(cx,cy,R){var angle=-.27,stops=[{x:cx,y:cy},{x:cx+R*.12,y:cy-R*.05},{x:cx+Math.cos(angle)*R*.72,y:cy+Math.sin(angle)*R*.54},{x:cx+Math.cos(angle)*R*.94,y:cy+Math.sin(angle)*R*.70},{x:cx+Math.cos(angle)*R*1.04,y:cy+Math.sin(angle)*R*.78}],scales=[1,1.22,1.65,2.28,3.05],i=Math.min(3,Math.floor(depth)),f=smooth(depth-i),focus={x:lerp(stops[i].x,stops[i+1].x,f),y:lerp(stops[i].y,stops[i+1].y,f)},s=lerp(scales[i],scales[i+1],f),screen={x:W*.55,y:H*.52};ctx.translate(screen.x,screen.y);ctx.scale(s,s);ctx.translate(-focus.x,-focus.y);}

  function drawLocalExchange(cx,cy,R){if(depth<1.9)return;var a=-.27,edge=membranePoint(cx,cy,R,a,1),nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,k=clamp((depth-1.9)/2.1,0,1);for(var i=0;i<15;i++){var spread=(i-7)*R*.014,open=.25+.75*(.5+.5*Math.sin(clock*.00074+i*.73)),x=edge.x+tx*spread,y=edge.y+ty*spread;line({x:x-tx*R*.010*(.5+open),y:y-ty*R*.010*(.5+open)},{x:x+tx*R*.010*(.5+open),y:y+ty*R*.010*(.5+open)},i%4===0?pal.aqua:pal.glow,.06+.15*open*k,.65+open*.55);if(depth>2.9&&open>.42){var out={x:x+nx*R*.13,y:y+ny*R*.10},inn={x:x-nx*R*.15,y:y-ny*R*.11};pulseCurve(out,inn,(i%2?1:-1)*3,(clock*.00014+i*.067)%1,i%4===0?pal.aqua:pal.glow,.48+.28*k,1.25+k*.5);}}}

  function drawIntegrity(cx,cy,R){var t=(clock-modeStart)*.00026,occup=.43+.20*(.5+.5*Math.sin(t)),pos={x:cx+R*occup*.66,y:cy-R*.10+Math.sin(t*.7)*R*.025};drawMembrane(cx,cy,R,pal.glow,.42,1,null,18);drawMembrane(cx,cy,R,pal.soft,.055,.79,[3,11]);for(var j=0;j<6;j++){ctx.beginPath();ctx.arc(pos.x,pos.y,R*(.045+j*.032),t+j*.4,t+j*.4+Math.PI*(.7+j*.04));ctx.strokeStyle=rgba(j%2?pal.aqua:pal.glow,.045+.025*j);ctx.lineWidth=.8;ctx.stroke();}var edge=membranePoint(cx,cy,R,-.08,.98);curve(pos,edge,-R*.11,pal.glow,.36,1.45);for(var q=0;q<3;q++)pulseCurve(pos,edge,-R*.11,(clock*.00008+q*.29)%1,q===1?pal.aqua:pal.glow,.62,1.45);glow(pos.x,pos.y,R*.16,pal.glow,.07);dot(pos.x,pos.y,4.5,pal.glow,.95);for(var w=0;w<5;w++){ctx.beginPath();ctx.ellipse(cx,cy,R*(.42+w*.10),R*(.31+w*.075),0,t*.05+w*.5,t*.05+w*.5+Math.PI*1.15);ctx.strokeStyle=rgba(w%2?pal.aqua:pal.glow,.018+.012*w);ctx.lineWidth=.7;ctx.stroke();}phaseLabel.textContent="boundary breathing around the current state";}

  function drawCapacity(cx,cy,R){drawMembrane(cx,cy,R,pal.glow,.30,1,null,12);for(var r=0;r<2;r++){ctx.beginPath();ctx.ellipse(cx,cy,R*(.70+r*.14),R*(.525+r*.105),0,0,Math.PI*2);ctx.strokeStyle=rgba(r?pal.glow:pal.aqua,.09);ctx.lineWidth=.75;ctx.setLineDash([4,10]);ctx.stroke();ctx.setLineDash([]);}var pts=[];history.forEach(function(h,i){var perspective=.52+.48*h.z,x=cx+h.x*R*perspective,y=cy+h.y*R*.75*perspective-R*(1-h.z)*.10,p={x:x,y:y};pts.push(p);if(i){curve(pts[i-1],p,Math.sin(i*.7)*R*.012,i%5===0?pal.aqua:pal.glow,.05+.08*i/27,.7+i/27*.4);}dot(x,y,i===27?4:1.25,i%5===0?pal.aqua:pal.glow,.08+.28*i/27);if(i%4===0)glow(x,y,R*.04,i%5===0?pal.aqua:pal.glow,.018);} );for(var s=0;s<7;s++){var u=(clock*.000035+s*.14)%1,seg=u*27,k=Math.min(26,Math.floor(seg)),f=seg-k,p={x:lerp(pts[k].x,pts[k+1].x,f),y:lerp(pts[k].y,pts[k+1].y,f)};dot(p.x,p.y,1.5,s%2?pal.aqua:pal.glow,.58);}var now=pts[27],edge=membranePoint(cx,cy,R,-.18,.90);curve(now,edge,-R*.08,pal.glow,.30,1.25);glow(edge.x,edge.y,R*.12,pal.glow,.04);phaseLabel.textContent="28-day pattern moving through canonical runway";}

  function drawTolerance(cx,cy,R){var t=(clock-modeStart)*.00023,current=.77+.055*Math.sin(t),sens=.59,guard=.96;drawMembrane(cx,cy,R,pal.aqua,.11,sens,[3,10]);drawMembrane(cx,cy,R,pal.glow,.42,current,null,18);drawMembrane(cx,cy,R,pal.soft,.10,guard,[4,12]);for(var z=0;z<9;z++){var s=lerp(sens,current,z/8);drawMembrane(cx,cy,R,z%3===0?pal.aqua:pal.glow,.010+.010*z/8,s,null,0);}for(var g=0;g<16;g++){var a=g/16*Math.PI*2+.1,open=.28+.72*(.5+.5*Math.sin(clock*.00066+g*.79)),p0=membranePoint(cx,cy,R,a,current-.035*open),p1=membranePoint(cx,cy,R,a,current+.035*open);line(p0,p1,g%4===0?pal.aqua:pal.glow,.05+.13*open,.65+open*.45);if(g%4===0&&open>.5)pulseCurve(p1,p0,0,(clock*.00013+g*.071)%1,pal.aqua,.52,1.2);}phaseLabel.textContent="adaptive ε breathing between floor and guard";}

  function drawLaminarity(cx,cy,R){drawMembrane(cx,cy,R,pal.aqua,.28,1,null,12);var order=.70+.22*(.5+.5*Math.sin(clock*.00011));streamSeeds.forEach(function(s,i){var y0=s.y*R*.74,start={x:cx-R*1.34,y:cy+y0},end={x:cx+R*1.34,y:cy+y0*.90},bend=Math.sin(i*.78+s.p)*R*.035*(1-order);curve(start,end,bend,i%6===0?pal.glow:pal.aqua,.028+.075*order,.65+(i%5)*.06);if(i%2===0)pulseCurve(start,end,bend,(clock*.000045*s.s+i*.061)%1,i%6===0?pal.glow:pal.aqua,.42+.22*order,1.1+(i%3)*.15);});for(var v=0;v<8;v++){var a=clock*.00013+v*.78,rr=R*(.18+.035*v),x=cx+Math.cos(a)*rr*.55,y=cy+Math.sin(a)*rr*.32;ctx.beginPath();ctx.arc(x,y,R*(.025+.007*v),a,a+Math.PI*1.4);ctx.strokeStyle=rgba(pal.glow,.018*(1-order));ctx.lineWidth=.75;ctx.stroke();}phaseLabel.textContent="ordered routes carrying exchange through the field";}

  function drawEfficiency(cx,cy,R){drawMembrane(cx,cy,R,pal.glow,.24,1,null,10);var t=(clock-modeStart)*.00020,coord=.50+.16*Math.sin(t),vol=.38+.13*Math.sin(t+1.35),left={x:cx-R*.73,y:cy+R*.25},right={x:cx+R*.73,y:cy+R*.25},target={x:cx,y:cy-R*.10};for(var i=0;i<18;i++){var u=i/17,src={x:left.x+(i-8.5)*R*.008,y:left.y+Math.sin(i)*R*.035},bend=-R*(.17-.06*u);curve(src,target,bend,pal.aqua,.025+.075*coord,.65);pulseCurve(src,target,bend,(clock*.000055+i*.049)%1,pal.aqua,.36+.16*coord,1.05);}for(var j=0;j<18;j++){var src2={x:right.x+(j-8.5)*R*.008,y:right.y+Math.cos(j)*R*.035},bend2=R*(.17-.06*j/17);curve(src2,target,bend2,pal.glow,.025+.075*vol,.65);pulseCurve(src2,target,bend2,(clock*.000061+j*.047)%1,pal.glow,.36+.16*vol,1.05);}for(var r=0;r<7;r++){ctx.beginPath();ctx.ellipse(target.x,target.y,R*(.07+r*.025),R*(.045+r*.016),t*.08+r*.2,0,Math.PI*2);ctx.strokeStyle=rgba(r%2?pal.aqua:pal.glow,.025+.014*r);ctx.lineWidth=.65;ctx.stroke();}glow(target.x,target.y,R*.19,pal.soft,.045);dot(target.x,target.y,3.8,pal.soft,.82);ctx.font="500 10px ui-sans-serif,system-ui";ctx.textAlign="center";ctx.fillStyle=rgba(pal.aqua,.58);ctx.fillText("coordinate load",left.x,left.y+R*.18);ctx.fillStyle=rgba(pal.glow,.58);ctx.fillText("volatility",right.x,right.y+R*.18);phaseLabel.textContent="coordinate and volatility load self-organizing toward optimum";}

  function drawPotential(cx,cy,R){var t=(clock-modeStart)*.00022,reserve=.67+.14*Math.sin(t),demand=.43+.17*Math.sin(t+1.22),pot=reserve-demand,C={x:cx-R*.48,y:cy-R*.03},V={x:cx+R*.48,y:cy+R*.03};drawMembrane(cx,cy,R,pot>=0?pal.go:pal.ease,.28+.20*Math.abs(pot),1+pot*.10,null,16);glow(C.x,C.y,R*(.42+.18*reserve),pal.aqua,.035+.05*reserve);glow(V.x,V.y,R*(.38+.20*demand),pal.ease,.03+.055*demand);for(var i=0;i<26;i++){var y=(i-12.5)*R*.025,a={x:C.x-R*.25,y:C.y+y},b={x:V.x+R*.25,y:V.y+y*.82},bend=(i-12.5)*R*.004;curve(a,b,bend,i%5===0?pal.glow:pal.aqua,.022+.045*Math.max(reserve,demand),.55);pulseCurve(a,b,bend,(clock*.000045+i*.039)%1,i%5===0?pal.glow:pal.aqua,.34+.22*reserve,1.05);}var mid={x:cx+pot*R*.16,y:cy};glow(mid.x,mid.y,R*(.18+.08*Math.abs(pot)),pot>=0?pal.go:pal.ease,.07);dot(mid.x,mid.y,4,pot>=0?pal.go:pal.ease,.9);for(var q=0;q<5;q++){ctx.beginPath();ctx.arc(mid.x,mid.y,R*(.055+q*.03),t*.2+q*.6,t*.2+q*.6+Math.PI*1.25);ctx.strokeStyle=rgba(pot>=0?pal.go:pal.ease,.035+.018*q);ctx.lineWidth=.7;ctx.stroke();}ctx.font="500 10px ui-sans-serif,system-ui";ctx.textAlign="center";ctx.fillStyle=rgba(pal.aqua,.66);ctx.fillText("reserve",C.x,C.y+R*.31);ctx.fillStyle=rgba(pal.ease,.66);ctx.fillText("demand",V.x,V.y+R*.31);phaseLabel.textContent=pot>=0?"reserve exceeds demand · potential open":"demand consuming available reserve";}

  function setMode(next){if(!FAMILY[next])return;mode=next;modeStart=clock;section.dataset.wmMode=mode;section.querySelectorAll(".wm2-mode").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.aspect===mode?"true":"false");});var f=FAMILY[mode];kicker.textContent=f.name;title.textContent=f.title;copy.textContent=f.desc;note.textContent=f.note;}
  function updateScale(){var i=Math.round(depthTarget);scaleName.textContent=DEPTH_NAMES[i];returnButton.hidden=depthTarget<.35;section.dataset.wmDepth=String(i);}
  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.05);pointer.y=lerp(pointer.y,pointer.ty,.05);depth=lerp(depth,depthTarget,.065);if(themeDirty)palette();if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);var cx=W*.55,cy=H*.52,R=Math.min(W*.39,H*.48);ctx.save();camera(cx,cy,R);glow(cx,cy,R*1.55,pal.aquaDeep,.026);drawVolume(cx,cy,R,.95);drawMotes(cx,cy,R,mode);if(mode==="integrity")drawIntegrity(cx,cy,R);else if(mode==="capacity")drawCapacity(cx,cy,R);else if(mode==="tolerance")drawTolerance(cx,cy,R);else if(mode==="laminarity")drawLaminarity(cx,cy,R);else if(mode==="efficiency")drawEfficiency(cx,cy,R);else drawPotential(cx,cy,R);drawLocalExchange(cx,cy,R);ctx.restore();requestAnimationFrame(render);}

  section.querySelectorAll(".wm2-mode").forEach(function(b){b.addEventListener("click",function(){setMode(b.dataset.aspect);});});
  depthInput.addEventListener("input",function(){depthTarget=clamp(+depthInput.value||0,0,4);updateScale();});
  returnButton.addEventListener("click",function(){depthTarget=0;depthInput.value="0";updateScale();});
  stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);},{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  new ResizeObserver(resize).observe(stage);new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"30% 0px 30% 0px",threshold:.01}).observe(section);new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();setMode("integrity");updateScale();requestAnimationFrame(render);
})();