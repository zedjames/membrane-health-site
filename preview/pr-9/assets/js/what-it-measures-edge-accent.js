/* What It Measures — Stage 2 living-edge accent.
   Adds luminosity and fine membrane vibration without changing cinematic scroll geometry. */
(function(){
  "use strict";
  if(window.__wmLivingEdgeAccent)return;
  window.__wmLivingEdgeAccent=true;

  var section=document.getElementById("different");
  if(!section)return;

  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage=null,cinema=null,canvas=null,ctx=null,W=1,H=1,D=1,last=performance.now(),clock=0,beat=0;
  var pal={};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function rgba(hex,a){
    var h=String(hex||"").trim();
    if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if(/^#[0-9a-f]{6}$/i.test(h)){
      var n=parseInt(h.slice(1),16);
      return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+clamp(a,0,1)+")";
    }
    return h;
  }
  function palette(){
    var cs=getComputedStyle(root);
    pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";
    pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";
    pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";
  }
  function resize(){
    var r=stage.getBoundingClientRect();
    W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
    canvas.style.width=W+"px";canvas.style.height=H+"px";
    ctx.setTransform(D,0,0,D,0,0);
  }
  function targetBeat(){
    var r=cinema.getBoundingClientRect(),travel=Math.max(1,cinema.offsetHeight-window.innerHeight),p=clamp(-r.top/travel,0,1);
    return p*11;
  }
  function geom(){return{cx:W*.57,cy:H*.53,R:Math.min(W*.39,H*.48)};}
  function cameraForBeat(g,b){
    var states=[
      {fx:g.cx,fy:g.cy,s:.88},
      {fx:g.cx+g.R*.64,fy:g.cy-g.R*.08,s:1.48},
      {fx:g.cx,fy:g.cy,s:1.08},
      {fx:g.cx+g.R*.69,fy:g.cy+g.R*.05,s:1.42},
      {fx:g.cx,fy:g.cy,s:1.05},
      {fx:g.cx+g.R*.12,fy:g.cy-g.R*.04,s:1.10},
      {fx:g.cx,fy:g.cy,s:1.02},
      {fx:g.cx,fy:g.cy,s:1.04},
      {fx:g.cx,fy:g.cy,s:1.02},
      {fx:g.cx,fy:g.cy,s:1.03},
      {fx:g.cx,fy:g.cy,s:1.00},
      {fx:g.cx,fy:g.cy,s:.88}
    ];
    var i=Math.floor(clamp(b,0,11)),j=Math.min(11,i+1),f=smooth(b-i),a=states[i],z=states[j];
    var fx=lerp(a.fx,z.fx,f),fy=lerp(a.fy,z.fy,f),s=lerp(a.s,z.s,f),screen={x:W*.57,y:H*.53};
    ctx.translate(screen.x,screen.y);ctx.scale(s,s);ctx.translate(-fx,-fy);
  }
  function edgePoint(g,a,scale,phase){
    var slow=.017*Math.sin(a*3+clock*.00020+(phase||0))+.008*Math.sin(a*7-clock*.00013);
    var living=reduce?0:(.0075*Math.sin(a*19+clock*.0034+(phase||0)*1.7)+.0035*Math.sin(a*31-clock*.0048-(phase||0)));
    var breath=reduce?0:.0045*Math.sin(clock*.00115+a*.55);
    var rr=g.R*(scale||1)*(1+slow+living+breath);
    return{x:g.cx+Math.cos(a)*rr,y:g.cy+Math.sin(a)*rr*.75};
  }
  function edgePath(g,scale,phase){
    ctx.beginPath();
    for(var i=0;i<=240;i++){
      var a=i/240*Math.PI*2,p=edgePoint(g,a,scale,phase);
      if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);
    }
    ctx.closePath();
  }
  function strokeEdge(g,scale,phase,c,alpha,width,blur,dash){
    edgePath(g,scale,phase);
    ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=width;
    if(dash)ctx.setLineDash(dash);
    if(blur){ctx.shadowColor=rgba(c,Math.min(1,alpha*.9));ctx.shadowBlur=blur;}
    ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);
  }
  function glow(x,y,r,c,a){
    if(r<=0)return;
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,rgba(c,a));g.addColorStop(.30,rgba(c,a*.34));g.addColorStop(1,rgba(c,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}

  function render(now){
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;
    var target=targetBeat();beat=reduce?target:lerp(beat,target,.07);
    var w=clamp(1-Math.abs(beat-1),0,1);
    ctx.clearRect(0,0,W,H);
    if(w>.002){
      var g=geom(),pulse=.82+(reduce?0:.18*(.5+.5*Math.sin(clock*.0022)));
      ctx.save();cameraForBeat(g,beat);

      /* Broad living aura: many close contours create a charged gradient, not a single line. */
      for(var k=-7;k<=7;k++){
        var d=Math.abs(k)/7,scale=1+k*.0064,c=k<0?pal.aqua:pal.glow;
        strokeEdge(g,scale,k*.17,c,w*(.055+.075*(1-d))*pulse,1.0+d*.7,18+d*8,null);
      }

      /* Fine vibrating sheath around the active edge. */
      for(var q=0;q<4;q++){
        var off=(q-1.5)*.0045,c2=q%2?pal.aqua:pal.soft;
        strokeEdge(g,1+off,q*.62,c2,w*(.12+.045*q)*pulse,.75+q*.16,10+q*4,[1.2+q*.3,5.5+q]);
      }

      /* Hot core: deliberately brighter than any other contour in Stage 2. */
      strokeEdge(g,1,0,pal.glow,.90*w*pulse,2.15,28,null);
      strokeEdge(g,1,.22,pal.soft,.72*w*pulse,1.15,14,null);
      strokeEdge(g,.998,-.18,pal.aqua,.30*w*pulse,.80,10,null);

      /* Luminous traffic running around the boundary makes the edge visibly alive. */
      for(var i=0;i<28;i++){
        var a=i/28*Math.PI*2+(reduce?0:clock*.00010*(i%3===0?-1:1)),p=edgePoint(g,a,1,i*.23),hot=.45+.55*(.5+.5*Math.sin(clock*.0031+i*1.37)),c3=i%4===0?pal.aqua:pal.soft;
        glow(p.x,p.y,g.R*(.025+.018*hot),c3,.060*w*hot);
        dot(p.x,p.y,.85+1.05*hot,c3,(.30+.45*hot)*w);
      }

      ctx.restore();
    }
    requestAnimationFrame(render);
  }

  function mount(){
    stage=document.getElementById("wm3-stage");cinema=document.getElementById("wm3-cinema");
    if(!stage||!cinema)return false;
    if(stage.querySelector(".wm3__edge-accent"))return true;
    canvas=document.createElement("canvas");canvas.className="wm3__edge-accent";canvas.setAttribute("aria-hidden","true");
    canvas.style.position="absolute";canvas.style.inset="0";canvas.style.width="100%";canvas.style.height="100%";canvas.style.zIndex="3";canvas.style.pointerEvents="none";
    stage.appendChild(canvas);ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return false;
    palette();resize();beat=targetBeat();
    new ResizeObserver(resize).observe(stage);
    new MutationObserver(palette).observe(root,{attributes:true,attributeFilter:["data-theme"]});
    requestAnimationFrame(render);return true;
  }

  if(mount())return;
  var attempts=0,timer=setInterval(function(){attempts++;if(mount()||attempts>100)clearInterval(timer);},50);
})();
