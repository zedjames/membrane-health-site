/* Membrane Health — persistent world memory.
   The base homepage world still changes state section by section. This layer
   preserves accumulated activity after the conceptual middle so the bounded
   state never collapses into an empty final ring. */
(function(){
  "use strict";
  if(window.__mhWorldMemory)return;
  window.__mhWorldMemory=true;

  var root=document.documentElement,body=document.body;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var host=null,canvas=null,ctx=null,W=1,H=1,D=1,last=performance.now(),clock=0;
  var pal={},state="",alpha=0,targetAlpha=0;
  var lower={simple:.34,basic:.48,plans:.44,pro:.62,ahead:.76,trust:.58,resolve:.72};
  var radius={simple:.13,basic:.18,plans:.17,pro:.19,ahead:.27,trust:.17,resolve:.17};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function rgba(hex,a){
    var h=String(hex||"").trim();
    if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
    return h;
  }
  function palette(){
    var cs=getComputedStyle(root);
    pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";
    pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";
    pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";
  }
  function resize(){
    W=Math.max(1,innerWidth);H=Math.max(1,innerHeight);D=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
    canvas.style.width=W+"px";canvas.style.height=H+"px";
    ctx.setTransform(D,0,0,D,0,0);
  }
  function center(){
    var cs=getComputedStyle(root),xs=parseFloat(cs.getPropertyValue("--mh-world-x")),ys=parseFloat(cs.getPropertyValue("--mh-world-y"));
    if(!isFinite(xs))xs=50;if(!isFinite(ys))ys=46;
    return{x:W*xs/100,y:H*ys/100};
  }
  function glow(x,y,r,c,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.34,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function curve(a,b,bend,c,op,w){
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    var c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend};
    var c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,op);ctx.lineWidth=w||1;ctx.stroke();
    return[c1,c2];
  }
  function bez(a,c1,c2,b,u){var v=1-u,uu=u*u,vv=v*v;return{x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};}

  function drawMemory(now){
    var c=center(),m=Math.min(W,H),R=m*(radius[state]||.17),A=alpha;
    if(A<.004)return;

    /* accumulated bounded structure */
    glow(c.x,c.y,R*1.75,pal.glow,.028*A);
    for(var ring=0;ring<4;ring++){
      var rr=R*(.34+ring*.17),rot=clock*.000025*(ring%2?1:-1);
      ctx.beginPath();ctx.ellipse(c.x,c.y,rr,rr*.78,rot,0,Math.PI*2);
      ctx.strokeStyle=rgba(ring%2?pal.aqua:pal.glow,(.035+.018*ring)*A);ctx.lineWidth=.7;ctx.setLineDash(ring===3?[3,10]:[]);ctx.stroke();ctx.setLineDash([]);
    }

    /* retained relational routes — these never disappear at the bottom */
    for(var i=0;i<9;i++){
      var ang=i/9*Math.PI*2+clock*.000018,o=R*(1.45+.15*Math.sin(i*1.7+clock*.00008));
      var src={x:c.x+Math.cos(ang)*o,y:c.y+Math.sin(ang)*o*.76};
      var ia=ang+.38*Math.sin(i*1.3),dst={x:c.x+Math.cos(ia)*R*(.20+.10*(i%3)),y:c.y+Math.sin(ia)*R*(.17+.08*(i%2))};
      var bend=(i%2?1:-1)*R*.22,cc=i%3===0?pal.aqua:pal.glow,cs=curve(src,dst,bend,cc,.065*A,.8);
      var u=(clock*.000075+i*.103)%1,p=bez(src,cs[0],cs[1],dst,u);
      glow(p.x,p.y,10,cc,.030*A);dot(p.x,p.y,1.3,cc,.48*A);
    }

    /* accumulated internal activity */
    var n=58;
    for(var j=0;j<n;j++){
      var seed=j*12.9898,a=j/n*Math.PI*2+clock*.000055*(.55+(j%5)*.08),band=.17+((j*37)%97)/97*.76;
      var rr2=R*band,x=c.x+Math.cos(a)*rr2,y=c.y+Math.sin(a)*rr2*.80;
      var cc2=j%7===0?pal.aqua:pal.glow;
      dot(x,y,.65+((j*29)%11)/11*1.25,cc2,(.055+.11*((j%9)/9))*A);
    }

    /* history remains attached to the current bounded state */
    var prev=null;
    for(var k=0;k<15;k++){
      var u2=k/14,a2=-2.72+u2*2.28+clock*.000015,rr3=R*(.18+.39*u2);
      var p2={x:c.x+Math.cos(a2)*rr3,y:c.y+Math.sin(a2*.90)*rr3*.66};
      if(prev){ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p2.x,p2.y);ctx.strokeStyle=rgba(pal.glow,(.025+.045*u2)*A);ctx.lineWidth=.7;ctx.stroke();}
      dot(p2.x,p2.y,1+u2*1.5,pal.glow,(.06+.13*u2)*A);prev=p2;
    }
  }

  function frame(now){
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;
    state=body.dataset.mhWorldState||"";targetAlpha=lower[state]||0;
    alpha=reduce?targetAlpha:lerp(alpha,targetAlpha,1-Math.exp(-dt*2.4));
    ctx.clearRect(0,0,W,H);drawMemory(now);
    if(!reduce)requestAnimationFrame(frame);
  }

  function mount(){
    host=document.querySelector(".mh-world");if(!host)return false;
    if(host.querySelector(".mh-world__memory"))return true;
    canvas=document.createElement("canvas");canvas.className="mh-world__memory";canvas.setAttribute("aria-hidden","true");
    canvas.style.position="absolute";canvas.style.inset="0";canvas.style.width="100%";canvas.style.height="100%";canvas.style.pointerEvents="none";canvas.style.zIndex="1";
    var veil=host.querySelector(".mh-world__veil");host.insertBefore(canvas,veil||null);
    ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return false;
    palette();resize();addEventListener("resize",resize,{passive:true});
    new MutationObserver(palette).observe(root,{attributes:true,attributeFilter:["data-theme"]});
    if(reduce){frame(performance.now());addEventListener("scroll",function(){frame(performance.now());},{passive:true});}else requestAnimationFrame(frame);
    return true;
  }

  if(mount())return;
  var attempts=0,timer=setInterval(function(){attempts++;if(mount()||attempts>80)clearInterval(timer);},50);
})();
