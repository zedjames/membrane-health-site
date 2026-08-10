/* Membrane Health — persistent homepage world. */
(function () {
  "use strict";

  if (window.__membraneHomeWorld || !document.getElementById("top") || !document.getElementById("wedge")) return;
  window.__membraneHomeWorld = true;

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.id = "mh-home-world-style";
  style.textContent = [
    ".mh-world{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;contain:strict}",
    ".mh-world canvas{position:absolute;inset:0;width:100%;height:100%;display:block}",
    ".mh-world__veil{position:absolute;inset:0;background:radial-gradient(circle at var(--mh-world-x,70%) var(--mh-world-y,47%),color-mix(in srgb,var(--glow) 4%,transparent),transparent 46%),linear-gradient(to bottom,color-mix(in srgb,var(--night) 3%,transparent),color-mix(in srgb,var(--night) 18%,transparent));opacity:.92}",
    "body.mh-world-active{isolation:isolate}",
    "body.mh-world-active>.nav,body.mh-world-active>section,body.mh-world-active>footer,body.mh-world-active>.lightbox{position:relative;z-index:2}",
    "body.mh-world-active #top,body.mh-world-active #home,body.mh-world-active #how,body.mh-world-active #basic,body.mh-world-active #plans,body.mh-world-active #pro,body.mh-world-active #ahead,body.mh-world-active #data,body.mh-world-active #get{background-color:transparent}",
    "body.mh-world-active #top:after,body.mh-world-active #home:after,body.mh-world-active #how:after,body.mh-world-active #basic:after,body.mh-world-active #plans:after,body.mh-world-active #pro:after,body.mh-world-active #ahead:after,body.mh-world-active #data:after,body.mh-world-active #get:after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,color-mix(in srgb,var(--night) 88%,transparent),color-mix(in srgb,var(--night) 55%,transparent) 48%,color-mix(in srgb,var(--night) 16%,transparent));opacity:.48}",
    "body.mh-world-active #home:after,body.mh-world-active #how:after,body.mh-world-active #plans:after,body.mh-world-active #data:after,body.mh-world-active #get:after{background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--night) 38%,transparent),color-mix(in srgb,var(--night) 82%,transparent) 78%)}",
    "body.mh-world-active #home .device{position:relative}",
    "body.mh-world-active #home .device:before{content:'';position:absolute;width:min(50vw,540px);aspect-ratio:1;left:50%;top:45%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--glow) 13%,transparent),color-mix(in srgb,var(--aqua) 4%,transparent) 38%,transparent 72%);filter:blur(18px);opacity:var(--mh-home-aura,.32);z-index:-1;transition:opacity .7s ease}",
    "body.mh-world-active .lp-world,body.mh-world-active .wm,body.mh-world-active .idea-exp,body.mh-world-active .uh,body.mh-world-active .fm{isolation:isolate}",
    "@media(max-width:760px){.mh-world__veil{opacity:.72}body.mh-world-active #top:after,body.mh-world-active #home:after,body.mh-world-active #how:after,body.mh-world-active #basic:after,body.mh-world-active #plans:after,body.mh-world-active #pro:after,body.mh-world-active #ahead:after,body.mh-world-active #data:after,body.mh-world-active #get:after{opacity:.66}}",
    "@media(prefers-reduced-motion:reduce){body.mh-world-active #home .device:before{transition:none}}"
  ].join("");
  document.head.appendChild(style);

  var host = document.createElement("div");
  host.className = "mh-world";
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = '<canvas></canvas><div class="mh-world__veil"></div>';
  body.insertBefore(host, body.firstChild);
  body.classList.add("mh-world-active");

  var canvas = host.querySelector("canvas");
  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  var W = 1, H = 1, DPR = 1, last = performance.now(), phase = 0, dirty = true;
  var pointer = { x:0, y:0, tx:0, ty:0 };
  var active = "hero", mode = "recovery", aspect = "boundary";
  var day = 28, crossing = 0, trace = 100;
  var palette = {};

  var sections = [
    ["#top","hero"],["#home","home"],["#wedge","history"],["#different","measure"],
    ["#idea","membrane"],["#science","trace"],["#modes","modes"],["#how","simple"],
    ["#basic","basic"],["#plans","plans"],["#pro","pro"],["#ahead","ahead"],
    ["#data","trust"],["#get","resolve"]
  ].map(function (s) { return { el:document.querySelector(s[0]), key:s[1] }; }).filter(function (s) { return s.el; });

  var states = {
    hero:{x:.70,y:.47,r:.23,a:.88,n:76,s:.28,c:.48,j:.11,routes:.34,h:.08,rings:1,space:.12},
    home:{x:.50,y:.43,r:.14,a:.78,n:58,s:.22,c:.78,j:.05,routes:.62,h:.08,rings:2,space:.08},
    history:{x:.66,y:.48,r:.19,a:.18,n:46,s:.14,c:.74,j:.06,routes:.24,h:.95,rings:2,space:.08},
    measure:{x:.66,y:.48,r:.20,a:.14,n:50,s:.19,c:.64,j:.08,routes:.28,h:.16,rings:2,space:.08},
    membrane:{x:.52,y:.50,r:.29,a:.12,n:62,s:.24,c:.72,j:.04,routes:.58,h:.04,rings:1,space:.14},
    trace:{x:.55,y:.48,r:.20,a:.15,n:50,s:.20,c:.84,j:.025,routes:.92,h:.10,rings:3,space:.14},
    modes:{x:.50,y:.47,r:.23,a:.15,n:70,s:.24,c:.76,j:.06,routes:.72,h:.10,rings:2,space:.18},
    simple:{x:.50,y:.45,r:.12,a:.56,n:30,s:.14,c:.90,j:.02,routes:.34,h:.44,rings:1,space:.04},
    basic:{x:.73,y:.44,r:.18,a:.46,n:52,s:.18,c:.86,j:.03,routes:.66,h:.38,rings:4,space:.08},
    plans:{x:.50,y:.46,r:.16,a:.42,n:36,s:.13,c:.92,j:.018,routes:.30,h:.12,rings:3,space:.04},
    pro:{x:.72,y:.46,r:.18,a:.50,n:56,s:.22,c:.86,j:.03,routes:.76,h:.90,rings:3,space:.12},
    ahead:{x:.67,y:.48,r:.27,a:.54,n:82,s:.25,c:.80,j:.04,routes:.96,h:.26,rings:2,space:1},
    trust:{x:.50,y:.46,r:.16,a:.50,n:34,s:.10,c:.97,j:.01,routes:.10,h:.10,rings:2,space:.03},
    resolve:{x:.50,y:.43,r:.10,a:.68,n:22,s:.08,c:.99,j:.006,routes:.08,h:.08,rings:1,space:.01}
  };

  var cur = copy(states.hero), target = copy(states.hero);

  function copy(o) { var r={}; Object.keys(o).forEach(function(k){r[k]=o[k];}); return r; }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function rgba(hex,a){
    var h=String(hex||"").trim();
    if(/^#[0-9a-f]{3}$/i.test(h)) h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
    return h;
  }

  function readPalette(){
    var cs=getComputedStyle(root);
    palette.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";
    palette.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";
    palette.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";
    palette.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";
    palette.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";
    palette.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";
  }

  function resize(){
    W=Math.max(1,innerWidth);H=Math.max(1,innerHeight);DPR=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
    canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0);dirty=true;
  }

  function setMode(t,m){
    if(m==="sleep"){t.s=.07;t.c=.92;t.j=.014;t.routes=.20;t.h=.50;t.r=.16;}
    else if(m==="stress"){t.s=.46;t.c=.46;t.j=.17;t.routes=.86;t.h=.05;t.r=.21;}
    else if(m==="recovery"){t.s=.15;t.c=.80;t.j=.05;t.routes=.56;t.h=.84;t.r=.19;}
    else if(m==="flow"){t.s=.30;t.c=.98;t.j=.014;t.routes=.98;t.h=.22;t.r=.22;}
    else if(m==="nova"){t.s=.34;t.c=.95;t.j=.018;t.routes=1;t.h=.30;t.r=.28;t.rings=4;}
  }

  function color(){
    if(active!=="modes") return palette.glow;
    if(mode==="sleep") return palette.soft;
    if(mode==="stress") return palette.ease;
    if(mode==="recovery") return palette.go;
    if(mode==="flow") return palette.aqua;
    return palette.glow;
  }

  function focus(){
    var mid=H*.50,best=null,dist=1e9;
    sections.forEach(function(s){var r=s.el.getBoundingClientRect();if(r.bottom<-H*.35||r.top>H*1.35)return;var d=Math.abs((r.top+r.bottom)*.5-mid);if(d<dist){dist=d;best=s;}});
    if(best) active=best.key;
    target=copy(states[active]||states.hero);

    if(active==="history"){var hd=clamp(day/28,0,1);target.h=lerp(.18,1,hd);target.r=lerp(.15,.20,hd);}
    if(active==="measure"){
      if(aspect==="boundary"){target.j=.03;target.routes=.15;target.rings=1;}
      if(aspect==="stability"){target.j=.15;target.routes=.30;target.s=.29;}
      if(aspect==="coherence"){target.c=.98;target.routes=.76;target.s=.17;}
      if(aspect==="recovery"){target.h=.78;target.routes=.64;target.r=.18;}
    }
    if(active==="membrane"){var cr=clamp(crossing/100,0,1);target.x=lerp(.74,.34,cr);target.routes=lerp(.34,.94,1-Math.abs(.5-cr)*2);}
    if(active==="trace"){var tr=clamp(trace/100,0,1);target.routes=lerp(.98,.40,tr);target.rings=tr<.33?1:tr<.68?3:4;target.c=lerp(.58,.96,tr);}
    if(active==="modes") setMode(target,mode);
    if(active==="home"){
      var dev=document.querySelector("#home .device__frame");
      if(dev){var dr=dev.getBoundingClientRect();target.x=clamp((dr.left+dr.width*.5)/W,.18,.82);target.y=clamp((dr.top+dr.height*.40)/H,.20,.76);target.r=clamp(Math.min(dr.width,dr.height)*.44/Math.min(W,H),.09,.20);}
    }
    root.style.setProperty("--mh-world-x",(target.x*100).toFixed(1)+"%");
    root.style.setProperty("--mh-world-y",(target.y*100).toFixed(1)+"%");
    root.style.setProperty("--mh-home-aura",active==="home"?".84":".32");
    body.setAttribute("data-mh-world-state",active);dirty=false;
  }

  function smooth(dt){var k=1-Math.exp(-dt*2.15);Object.keys(cur).forEach(function(p){cur[p]=lerp(cur[p],target[p],k);});}
  function glow(x,y,r,c,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.35,rgba(c,a*.32));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}

  function boundary(cx,cy,r,c){
    ctx.beginPath();var pts=96;
    for(var i=0;i<=pts;i++){var a=i/pts*Math.PI*2;var wob=Math.sin(a*3+phase*.012)*cur.j+Math.sin(a*5-phase*.009)*cur.j*.45;var rr=r*(1+wob);var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.88;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
    ctx.closePath();ctx.fillStyle=rgba(c,.018*cur.a);ctx.fill();ctx.strokeStyle=rgba(c,.19*cur.a);ctx.lineWidth=1.2;ctx.stroke();
    for(var j=1;j<=Math.round(cur.rings);j++){ctx.beginPath();ctx.ellipse(cx,cy,r*(.48+j*.18),r*(.40+j*.15),0,0,Math.PI*2);ctx.strokeStyle=rgba(j%2?c:palette.aqua,.035*cur.a);ctx.lineWidth=.7;ctx.stroke();}
  }

  function particles(cx,cy,r,c){
    var n=Math.round(cur.n);for(var i=0;i<n;i++){var a=i/n*Math.PI*2+phase*cur.s*(.016+(i%5)*.0015)+Math.sin(i*12.7)*(1-cur.c)*1.7;var band=.16+((i*37)%97)/97*.86;var rr=r*band;var drift=Math.sin(phase*.018+i*3.1)*r*.13*(1-cur.c);var x=cx+Math.cos(a)*rr+Math.cos(a*2.5)*drift;var y=cy+Math.sin(a)*rr*.86+Math.sin(a*2.1)*drift*.6;ctx.beginPath();ctx.arc(x,y,.7+((i*29)%13)/13*1.5,0,Math.PI*2);ctx.fillStyle=rgba(i%7===0?palette.aqua:c,(.035+.13*cur.c)*cur.a);ctx.fill();}
  }

  function bezier(a,b,c,d,t){var u=1-t,tt=t*t,uu=u*u;return{x:uu*u*a.x+3*uu*t*b.x+3*u*tt*c.x+tt*t*d.x,y:uu*u*a.y+3*uu*t*b.y+3*u*tt*c.y+tt*t*d.y};}
  function routes(cx,cy,r,c){
    var count=Math.round(lerp(2,10,cur.routes));for(var i=0;i<count;i++){var a=i/count*Math.PI*2+phase*.025;var s={x:cx+Math.cos(a)*r*1.45,y:cy+Math.sin(a)*r*1.05};var ia=a+Math.sin(i*1.9)*.42;var e={x:cx+Math.cos(ia)*r*(.20+.12*(i%3)),y:cy+Math.sin(ia)*r*(.18+.10*(i%2))};var b={x:s.x-Math.cos(a)*r*.42+Math.sin(a)*r*.14,y:s.y-Math.sin(a)*r*.30};var d={x:e.x+Math.cos(ia)*r*.18,y:e.y+Math.sin(ia)*r*.12};ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.bezierCurveTo(b.x,b.y,d.x,d.y,e.x,e.y);ctx.strokeStyle=rgba(i%3===0?palette.aqua:c,(.025+.10*cur.routes)*cur.a);ctx.lineWidth=i%4===0?1.1:.7;ctx.stroke();var q=bezier(s,b,d,e,(phase*cur.s*.09+i*.17)%1);ctx.beginPath();ctx.arc(q.x,q.y,1.2+cur.routes*1.5,0,Math.PI*2);ctx.fillStyle=rgba(i%3===0?palette.aqua:c,(.12+.22*cur.routes)*cur.a);ctx.fill();}
  }

  function history(cx,cy,r,c){
    if(cur.h<.08)return;var prev=null;for(var i=0;i<20;i++){var t=i/19,a=-2.2+t*4.8+Math.sin(i*1.4)*.10,rr=r*(.28+.62*t);var x=cx+Math.cos(a)*rr+Math.sin(i*1.7)*3,y=cy+Math.sin(a*.88)*rr*.68;if(prev){ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(x,y);ctx.strokeStyle=rgba(c,(.018+.052*t)*cur.a*cur.h);ctx.stroke();}ctx.beginPath();ctx.arc(x,y,1.1+t*1.6,0,Math.PI*2);ctx.fillStyle=rgba(c,(.04+.11*t)*cur.a*cur.h);ctx.fill();prev={x:x,y:y};}
  }

  function spatial(cx,cy,r,c){
    if(cur.space<.08)return;var pts=[];for(var row=0;row<4;row++)for(var col=0;col<4;col++)pts.push({x:cx-r*.82+col*r*.55+Math.sin(row*1.4+col*.7)*6,y:cy-r*.56+row*r*.38+Math.cos(col*1.2+row*.8)*5});for(var i=0;i<pts.length;i++){var p=pts[i];if(i%4<3){var q=pts[i+1];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=rgba(c,.05*cur.space*cur.a);ctx.stroke();}if(i+4<pts.length){var q2=pts[i+4];ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q2.x,q2.y);ctx.strokeStyle=rgba(palette.aqua,.045*cur.space*cur.a);ctx.stroke();}ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fillStyle=rgba(c,.14*cur.space*cur.a);ctx.fill();}
  }

  function position(cx,cy,r,c){var orbit=active==="resolve"?0:r*.12,x=cx+Math.cos(phase*.013)*orbit,y=cy+Math.sin(phase*.010)*orbit*.55;if(active==="modes"&&mode==="stress")x+=r*.18;glow(x,y,active==="resolve"?68:44,c,.14*cur.a);ctx.beginPath();ctx.arc(x,y,active==="resolve"?4.3:3.2,0,Math.PI*2);ctx.fillStyle=rgba(c,.72*cur.a);ctx.fill();ctx.beginPath();ctx.arc(x,y,active==="resolve"?9.5:7.2,0,Math.PI*2);ctx.strokeStyle=rgba(c,.18*cur.a);ctx.stroke();}

  function heroAnswer(cx,cy,r){if(active!=="hero")return;[palette.go,palette.ease,palette.recover].forEach(function(c,i){var a=-Math.PI*.68+i*Math.PI*.68,x=cx+Math.cos(a)*r*1.16,y=cy+Math.sin(a)*r*.70;glow(x,y,24,c,.07*cur.a);ctx.beginPath();ctx.arc(x,y,2.1,0,Math.PI*2);ctx.fillStyle=rgba(c,.34*cur.a);ctx.fill();});}

  function draw(now){
    var dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;if(!reduce)phase+=dt*60;if(dirty)focus();if(reduce)cur=copy(target);else smooth(dt);pointer.x=lerp(pointer.x,pointer.tx,1-Math.exp(-dt*3.2));pointer.y=lerp(pointer.y,pointer.ty,1-Math.exp(-dt*3.2));ctx.clearRect(0,0,W,H);var min=Math.min(W,H),cx=cur.x*W+pointer.x*min*.012,cy=cur.y*H+pointer.y*min*.009,r=cur.r*min,c=color();glow(cx,cy,r*2.15,c,.06*cur.a);spatial(cx,cy,r,c);history(cx,cy,r,c);routes(cx,cy,r,c);particles(cx,cy,r,c);boundary(cx,cy,r,c);heroAnswer(cx,cy,r);position(cx,cy,r,c);if(!reduce)requestAnimationFrame(draw);
  }

  function seed(){var m=document.querySelector('.fm-mode[aria-pressed="true"][data-mode]');if(m)mode=m.getAttribute("data-mode")||mode;var a=document.querySelector('.wm-aspect[aria-pressed="true"][data-aspect]');if(a)aspect=a.getAttribute("data-aspect")||aspect;var l=document.getElementById("lp-range");if(l)day=+l.value||day;var w=document.getElementById("we-range");if(w)crossing=+w.value||crossing;var u=document.getElementById("uh-range");if(u)trace=+u.value||trace;}

  document.addEventListener("pointermove",function(e){if(e.pointerType==="touch")return;pointer.tx=clamp((e.clientX/Math.max(1,W)-.5)*2,-1,1);pointer.ty=clamp((e.clientY/Math.max(1,H)-.5)*2,-1,1);},{passive:true});
  document.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  addEventListener("scroll",function(){dirty=true;if(reduce){focus();draw(performance.now());}},{passive:true});
  addEventListener("resize",function(){resize();if(reduce){focus();draw(performance.now());}},{passive:true});
  document.addEventListener("input",function(e){if(e.target.id==="lp-range")day=+e.target.value||1;if(e.target.id==="we-range")crossing=+e.target.value||0;if(e.target.id==="uh-range")trace=+e.target.value||0;dirty=true;});
  document.addEventListener("click",function(e){var m=e.target.closest&&e.target.closest(".fm-mode[data-mode]");if(m)mode=m.getAttribute("data-mode")||mode;var a=e.target.closest&&e.target.closest(".wm-aspect[data-aspect]");if(a)aspect=a.getAttribute("data-aspect")||aspect;dirty=true;});
  new MutationObserver(function(){readPalette();dirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});

  resize();readPalette();seed();focus();
  if(reduce)draw(performance.now());else requestAnimationFrame(draw);
})();
