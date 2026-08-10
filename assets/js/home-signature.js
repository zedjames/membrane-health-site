(function(){
  "use strict";
  if (window.__membraneSignature || !document.getElementById("different") || !document.getElementById("idea") || !document.getElementById("science")) return;
  window.__membraneSignature = true;

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pal = {}, themeDirty = true, clock = 0, last = performance.now();
  var pointer = {x:0,y:0,tx:0,ty:0};

  if (!document.querySelector('link[data-home-signature-style]')) {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "assets/css/home-signature.css?v=1";
    css.dataset.homeSignatureStyle = "true";
    document.head.appendChild(css);
  }

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function ease(t){ t=clamp(t,0,1); return t*t*(3-2*t); }
  function hash(n){ var x=Math.sin(n*127.1)*43758.5453123; return x-Math.floor(x); }
  function rgba(hex,a){
    var h=String(hex||"").trim();
    if(/^#[0-9a-f]{3}$/i.test(h)) h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if(/^#[0-9a-f]{6}$/i.test(h)){ var n=parseInt(h.slice(1),16); return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"; }
    return h;
  }
  function palette(){
    var cs=getComputedStyle(root);
    pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";
    pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";
    pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";
    pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";
    pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";
    pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";
    pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";
    themeDirty=false;
  }
  function glow(ctx,x,y,r,c,a){
    if(r<=0)return;
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,rgba(c,a)); g.addColorStop(.34,rgba(c,a*.28)); g.addColorStop(1,rgba(c,0));
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  function dot(ctx,x,y,r,c,a){ ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill(); }
  function line(ctx,a,b,c,alpha,w,dash){
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;
    if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
  }
  function curve(ctx,a,b,bend,c,alpha,w){
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    var c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend};
    var c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);
    ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();
  }
  function pulseCurve(ctx,a,b,bend,u,c,alpha,r){
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    var c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend};
    var c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};
    var v=1-u,uu=u*u,vv=v*v;
    var p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};
    glow(ctx,p.x,p.y,(r||2)*7,c,alpha*.12);dot(ctx,p.x,p.y,r||1.8,c,alpha);
  }

  function Scene(selector,type){
    this.el=document.querySelector(selector);
    if(!this.el)return;
    this.type=type;this.visible=false;this.w=1;this.h=1;this.d=1;
    this.canvas=document.createElement("canvas");
    this.canvas.className="mh-signature-canvas mh-signature-canvas--"+type;
    this.canvas.setAttribute("aria-hidden","true");
    this.el.insertBefore(this.canvas,this.el.firstChild);
    this.ctx=this.canvas.getContext("2d",{alpha:true});
    var self=this;
    this.ro=new ResizeObserver(function(){ self.resize(); });
    this.ro.observe(this.el);
    this.io=new IntersectionObserver(function(es){ es.forEach(function(e){self.visible=e.isIntersecting;}); },{rootMargin:"35% 0px 35% 0px",threshold:.01});
    this.io.observe(this.el);
    this.el.addEventListener("pointermove",function(e){
      var r=self.el.getBoundingClientRect();
      pointer.tx=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);
      pointer.ty=clamp((e.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1);
    },{passive:true});
    this.el.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
    this.resize();
  }
  Scene.prototype.resize=function(){
    if(!this.el||!this.ctx)return;
    var r=this.el.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.d=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.w*this.d);this.canvas.height=Math.round(this.h*this.d);
    this.canvas.style.width=this.w+"px";this.canvas.style.height=this.h+"px";this.ctx.setTransform(this.d,0,0,this.d,0,0);
  };
  Scene.prototype.clear=function(){this.ctx.clearRect(0,0,this.w,this.h);};

  var measure=new Scene(".wm__visual","measure-v2");
  var membrane=new Scene(".idea-exp__stage","membrane-v2");
  var trace=new Scene(".uh__stage","trace-v2");

  /* -----------------------------------------------------------------------
     WHAT IT MEASURES — a volumetric chamber, not a flat diagram.
     ----------------------------------------------------------------------- */
  var fieldPoints=Array.from({length:104},function(_,i){
    return {x:hash(i*3.7)*2-1,y:hash(i*7.9)*2-1,z:hash(i*11.3),p:hash(i*17.1)*Math.PI*2,f:i%5,vx:0,vy:0,vz:0};
  });

  function rotatePoint(p,rx,ry){
    var x=p.x,y=p.y,z=p.z-.5;
    var cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx);
    var x1=x*cy+z*sy,z1=-x*sy+z*cy;
    var y1=y*cx-z1*sx,z2=y*sx+z1*cx;
    return {x:x1,y:y1,z:z2+.5};
  }
  function project3(p,cx,cy,R,rx,ry){
    var q=rotatePoint(p,rx,ry),depth=.42+.78*clamp(q.z,0,1);
    return {x:cx+q.x*R*depth,y:cy+q.y*R*.72*depth,z:clamp(q.z,0,1),s:depth};
  }
  function drawDepthShell(ctx,cx,cy,R,z,c,a,rx,ry){
    var depth=.42+.78*z, tilt=1-Math.abs(ry)*.16;
    ctx.beginPath();ctx.ellipse(cx+ry*R*(z-.5)*.18,cy+rx*R*(z-.5)*.13,R*depth,R*.72*depth*tilt,ry*.10,0,Math.PI*2);
    ctx.strokeStyle=rgba(c,a);ctx.lineWidth=.7+z*.6;ctx.stroke();
  }
  function measureMode(){var b=document.querySelector('.wm-aspect[aria-pressed="true"][data-aspect]');return b?b.dataset.aspect:"boundary";}

  function updateField(dt,mode){
    var k=dt*60;
    for(var i=0;i<fieldPoints.length;i++){
      var p=fieldPoints[i],r=Math.hypot(p.x,p.y)||.001,phase=clock*.00032+p.p;
      var vx=0,vy=0,vz=0;
      if(mode==="boundary"){
        vx=-p.y*.010+Math.cos(phase)*.002;vy=p.x*.010+Math.sin(phase*.9)*.002;vz=Math.sin(phase*.63)*.0012;
      }else if(mode==="stability"){
        var cyc=(clock%6800)/6800,impact=Math.max(0,Math.sin(Math.PI*clamp(cyc/.40,0,1)));
        vx=-p.y*.007-p.x*.008+impact*(-.022)*(1+p.z);vy=p.x*.007+Math.sin(phase)*.004*impact;vz=(.5-p.z)*.004+impact*.006*Math.sin(p.p);
      }else if(mode==="coherence"){
        var targetA=phase*.18+p.f*.34;
        vx=-p.y*.014+Math.cos(targetA)*.004;vy=p.x*.014+Math.sin(targetA)*.004;vz=Math.sin(clock*.00055+p.f*.7)*.0015;
      }else{
        var recover=.5-.5*Math.cos((clock%11000)/11000*Math.PI*2);
        vx=-p.x*(.006+.012*recover)-p.y*.006;vy=-p.y*(.006+.012*recover)+p.x*.006;vz=(.66-p.z)*.0045*recover;
      }
      p.vx=lerp(p.vx,vx,.055);p.vy=lerp(p.vy,vy,.055);p.vz=lerp(p.vz,vz,.055);
      p.x+=p.vx*k;p.y+=p.vy*k;p.z+=p.vz*k;
      if(r>1.02){p.x*=.985;p.y*=.985;}p.z=clamp(p.z,.02,.98);
    }
  }
  function drawMeasureV2(s,dt){
    if(!s||!s.ctx)return;
    var ctx=s.ctx,w=s.w,h=s.h,cx=w*.53,cy=h*.49,R=Math.min(w*.53,h*.60),mode=measureMode();
    var rx=pointer.y*.20,ry=pointer.x*.27;
    updateField(dt,mode);
    glow(ctx,cx,cy,R*1.28,mode==="recovery"?pal.go:mode==="stability"?pal.ease:pal.aqua,.035);
    for(var z=.08;z<=.92;z+=.14)drawDepthShell(ctx,cx,cy,R,z,z>.65?pal.glow:pal.aqua,.018+.035*z,rx,ry);

    var sorted=fieldPoints.slice().sort(function(a,b){return a.z-b.z;});
    var pts=[];
    for(var i=0;i<sorted.length;i++){
      var p=sorted[i],q=project3(p,cx,cy,R,rx,ry),c=p.f===0?pal.aqua:(mode==="recovery"?pal.go:mode==="stability"&&p.f===1?pal.ease:pal.glow);
      pts.push({p:p,q:q,c:c});
      if(i%9===0)glow(ctx,q.x,q.y,8+10*q.z,c,.018+.018*q.z);
      dot(ctx,q.x,q.y,.55+1.7*q.z,c,.08+.27*q.z);
    }
    if(mode==="coherence"){
      for(var j=0;j<pts.length;j+=5){
        var a=pts[j],best=null,bd=999;
        for(var k=0;k<pts.length;k+=7){if(j===k)continue;var b=pts[k],d=(a.q.x-b.q.x)*(a.q.x-b.q.x)+(a.q.y-b.q.y)*(a.q.y-b.q.y);if(d<bd){bd=d;best=b;}}
        if(best&&bd<R*R*.22)line(ctx,a.q,best.q,j%2?pal.aqua:pal.glow,.028+.035*a.q.z,.65);
      }
      for(var qn=0;qn<5;qn++){var zz=.18+qn*.16,ph=clock*.00055+qn*.8;ctx.beginPath();ctx.ellipse(cx+Math.sin(ph)*R*.06,cy+Math.cos(ph*.7)*R*.035,R*(.18+zz*.50),R*(.11+zz*.35),ph*.08,0,Math.PI*2);ctx.strokeStyle=rgba(qn%2?pal.aqua:pal.glow,.045);ctx.lineWidth=1;ctx.stroke();}
    }
    if(mode==="boundary"){
      var pos={x:cx+R*.12,y:cy-R*.08},edge={x:cx+R*.80,y:cy-R*.20};
      curve(ctx,pos,edge,-R*.06,pal.glow,.24,1.2);
      for(var e=0;e<7;e++){var aa=-.9+e*.32,src={x:cx+Math.cos(aa)*R*1.08,y:cy+Math.sin(aa)*R*.78},dst={x:cx+Math.cos(aa)*R*.78,y:cy+Math.sin(aa)*R*.56};curve(ctx,src,dst,e%2?8:-8,e%3===0?pal.aqua:pal.glow,.10,1);pulseCurve(ctx,src,dst,e%2?8:-8,(clock*.00016+e*.13)%1,e%3===0?pal.aqua:pal.glow,.64,1.6);}
      glow(ctx,pos.x,pos.y,34,pal.glow,.08);dot(ctx,pos.x,pos.y,3.5,pal.glow,.85);dot(ctx,edge.x,edge.y,2.2,pal.glow,.6);
    } else if(mode==="stability"){
      var cyc2=(clock%6800)/6800,impact2=Math.max(0,Math.sin(Math.PI*clamp(cyc2/.40,0,1))),hit={x:cx+R*.80,y:cy-R*.06},source={x:w+60,y:cy-R*.16};
      for(var n=0;n<4;n++){curve(ctx,source,hit,-30+n*18,pal.ease,.06+.10*impact2,1);pulseCurve(ctx,source,hit,-30+n*18,(clock*.00025+n*.21)%1,pal.ease,.68,2);}
      for(var rr=0;rr<5;rr++){ctx.beginPath();ctx.ellipse(hit.x,hit.y,R*(.08+rr*.07+impact2*.12),R*(.04+rr*.04+impact2*.07),-.1,0,Math.PI*2);ctx.strokeStyle=rgba(pal.ease,.10*(1-rr*.14)*impact2);ctx.stroke();}
    } else if(mode==="recovery"){
      var rec=.5-.5*Math.cos((clock%11000)/11000*Math.PI*2),start={x:cx+R*.62,y:cy-R*.25},end={x:cx-R*.10,y:cy+R*.03};
      curve(ctx,start,end,R*.14,pal.go,.24,1.4);pulseCurve(ctx,start,end,R*.14,(clock*.00010)%1,pal.go,.75,2);
      for(var s0=0;s0<6;s0++)drawDepthShell(ctx,cx,cy,R*(.72+.035*s0*rec),.35+s0*.08,s0<2?pal.recover:pal.go,.025+.018*s0*rec,rx,ry);
      glow(ctx,end.x,end.y,44+34*rec,pal.go,.08+.04*rec);dot(ctx,end.x,end.y,4,pal.go,.85);
    }
    ctx.beginPath();ctx.ellipse(cx,cy,R*1.02,R*.73,0,0,Math.PI*2);ctx.strokeStyle=rgba(mode==="stability"?pal.ease:mode==="recovery"?pal.go:pal.glow,.16);ctx.lineWidth=1.3;ctx.stroke();
  }

  /* -----------------------------------------------------------------------
     WHY MEMBRANE — scale-agnostic worlds inside worlds.
     ----------------------------------------------------------------------- */
  var systems=Array.from({length:11},function(_,i){
    var ringN=i===0?0:(i<5?.36:.63),idx=i===0?0:(i<5?i-1:i-5),count=i===0?1:(i<5?4:6),a=count===1?0:(idx/count*Math.PI*2+(i<5?.28:.62));
    return {x:Math.cos(a)*ringN,y:Math.sin(a)*ringN*.82,r:i===0?.15:(i<5?.12:.095),p:hash(i*7.2)*Math.PI*2,w:hash(i*9.1)>.48};
  });
  function actualMembraneGeom(s){
    var svg=document.getElementById("we-field"),edge=svg&&svg.querySelector(".we-shell-edge");
    var cx=s.w*.5,cy=s.h*.5,R=Math.min(s.w,s.h)*.36;
    if(svg&&edge){var vr=svg.getBoundingClientRect(),sr=s.el.getBoundingClientRect(),ex=parseFloat(edge.getAttribute("cx")),ey=parseFloat(edge.getAttribute("cy")),er=parseFloat(edge.getAttribute("r"));
      if(isFinite(ex)&&isFinite(ey)&&isFinite(er)&&vr.width>0&&vr.height>0){cx=(vr.left-sr.left)+(ex/700)*vr.width;cy=(vr.top-sr.top)+(ey/700)*vr.height;R=(er/700)*Math.min(vr.width,vr.height);}
    }
    return {cx:cx,cy:cy,R:Math.max(24,R)};
  }
  function drawGradientStream(ctx,a,b,index,alpha){
    var bend=Math.sin(clock*.00025+index*1.7)*12+(index%2?12:-12);
    curve(ctx,a,b,bend,index%4===0?pal.aqua:pal.glow,alpha,.8+((index%5)===0?.5:0));
    pulseCurve(ctx,a,b,bend,(clock*.00011+index*.087)%1,index%4===0?pal.aqua:pal.glow,alpha*5.2,1.45);
  }
  function drawMicroSystem(ctx,x,y,r,phase,level,focus){
    if(r<5)return;
    var breath=1+Math.sin(clock*.00072+phase)*(.018+.008*level),rr=r*breath;
    glow(ctx,x,y,rr*1.15,level===0?pal.glow:pal.aqua,.018+.018*focus);
    ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fillStyle=rgba(level===0?pal.aquaDeep:pal.aqua,.014+.018*focus);ctx.fill();
    ctx.strokeStyle=rgba(level===0?pal.glow:pal.aqua,.11+.15*focus);ctx.lineWidth=.75+focus*.55;ctx.stroke();
    var gateCount=level===0?5:4;
    for(var g=0;g<gateCount;g++){
      var a=g/gateCount*Math.PI*2+phase*.13,open=.5+.5*Math.sin(clock*.0012+phase+g*1.9),gx=x+Math.cos(a)*rr,gy=y+Math.sin(a)*rr,tx=-Math.sin(a),ty=Math.cos(a),len=2+4*open;
      line(ctx,{x:gx-tx*len,y:gy-ty*len},{x:gx+tx*len,y:gy+ty*len},open>.58?pal.glow:pal.aqua,.12+.22*open,.8+open*.45);
      if(open>.62){var out={x:gx+Math.cos(a)*rr*.34,y:gy+Math.sin(a)*rr*.34},inn={x:gx-Math.cos(a)*rr*.30,y:gy-Math.sin(a)*rr*.30};drawGradientStream(ctx,out,inn,g+level*9,.045+.055*open);}
    }
    for(var i=0;i<8;i++){var a2=i/8*Math.PI*2+clock*.00018*(i%3+1)+phase,rad=rr*(.15+.55*hash(i+phase*13)),px=x+Math.cos(a2)*rad,py=y+Math.sin(a2)*rad*.75;dot(ctx,px,py,i%4===0?1.4:.75,i%4===0?pal.glow:pal.aqua,.10+.13*focus);}
    if(level<2&&rr>28){
      var childCount=level===0?4:3;
      for(var c=0;c<childCount;c++){var a3=c/childCount*Math.PI*2+phase*.33+clock*.000025,cr=rr*(level===0?.19:.17),dist=rr*(level===0?.43:.40),cx=x+Math.cos(a3)*dist,cy=y+Math.sin(a3)*dist*.77;drawMicroSystem(ctx,cx,cy,cr,phase+c*.9,level+1,focus*.82);}
    }
  }
  function drawMembraneV2(s,dt){
    if(!s||!s.ctx)return;
    var ctx=s.ctx,g=actualMembraneGeom(s),cx=g.cx,cy=g.cy,R=g.R,range=document.getElementById("we-range"),u=range?(+range.value||0)/100:0;
    var interior=ease(clamp((u-.40)/.52,0,1)),edge=ease(1-Math.abs(u-.5)/.25),hoverX=cx+pointer.x*R*.72,hoverY=cy+pointer.y*R*.55;
    for(var e=0;e<18;e++){var aa=e/18*Math.PI*2+clock*.000022*(1+(e%3)),rr=R*(1.12+.40*hash(e*4.2)),x=cx+Math.cos(aa)*rr,y=cy+Math.sin(aa)*rr*.82;dot(ctx,x,y,e%5===0?1.5:.75,e%4===0?pal.aqua:pal.glow,.045+.06*(1-interior));}
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
    var bg=ctx.createRadialGradient(cx-R*.22,cy-R*.18,R*.05,cx,cy,R);bg.addColorStop(0,rgba(pal.aqua,.070*interior));bg.addColorStop(.48,rgba(pal.aquaDeep,.035*interior));bg.addColorStop(1,rgba(pal.glow,.014*interior));ctx.fillStyle=bg;ctx.fillRect(cx-R,cy-R,R*2,R*2);
    for(var lane=0;lane<12;lane++){var la=-1.4+lane/11*2.8,start={x:cx-R*.95,y:cy+Math.sin(la)*R*.72},end={x:cx+R*.92,y:cy+Math.sin(la+.7)*R*.56};drawGradientStream(ctx,start,end,lane,.022+.035*interior);}
    var live=[];
    for(var i=0;i<systems.length;i++){var S=systems[i],wob=.015*Math.sin(clock*.00048+S.p),sx=cx+(S.x+wob)*R,sy=cy+(S.y+Math.cos(clock*.00039+S.p)*.012)*R,sr=R*S.r*(.82+.30*interior),d=Math.hypot(sx-hoverX,sy-hoverY),focus=clamp(1-d/(R*.45),0,1)*interior;live.push({x:sx,y:sy,r:sr,focus:focus,p:S.p});}
    for(var a0=0;a0<live.length;a0++){for(var b0=a0+1;b0<live.length;b0++){var A=live[a0],B=live[b0],dd=Math.hypot(A.x-B.x,A.y-B.y);if(dd<R*.42){drawGradientStream(ctx,A,B,a0*13+b0,.022+.035*interior+Math.max(A.focus,B.focus)*.06);}}}
    live.forEach(function(S){drawMicroSystem(ctx,S.x,S.y,S.r,S.p,0,.35+.65*interior+S.focus*.55);});
    ctx.restore();
    var breath=R*(1+.006*Math.sin(clock*.0008));
    ctx.beginPath();ctx.arc(cx,cy,breath,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,.18+.20*edge);ctx.lineWidth=1.1+edge*.7;ctx.stroke();
    for(var g0=0;g0<14;g0++){var ga=g0/14*Math.PI*2,open=.5+.5*Math.sin(clock*.00105+g0*1.71),ex=cx+Math.cos(ga)*R,ey=cy+Math.sin(ga)*R,out={x:ex+Math.cos(ga)*R*.26,y:ey+Math.sin(ga)*R*.22},inn={x:ex-Math.cos(ga)*R*.25,y:ey-Math.sin(ga)*R*.21};if(open>.40)drawGradientStream(ctx,g0%4===0?inn:out,g0%4===0?out:inn,g0+70,.032+.075*open*(.4+.6*edge));}
    if(edge>.04)glow(ctx,cx,cy,R*.88,pal.glow,.018*edge);
  }

  /* -----------------------------------------------------------------------
     UNDER THE HOOD — many-to-one gathering with provenance still alive.
     ----------------------------------------------------------------------- */
  var families=[
    {x:.24,y:.28,c:"aqua",p:.2},{x:.76,y:.27,c:"glow",p:1.3},{x:.24,y:.72,c:"glow",p:2.4},{x:.76,y:.72,c:"aqua",p:3.7}
  ];
  var signalSeeds=Array.from({length:48},function(_,i){return {family:i%4,offset:hash(i*5.7),phase:hash(i*9.1),amp:.5+hash(i*13.3)*.5};});
  function traceValue(){var r=document.getElementById("uh-range");return r?(+r.value||0)/100:1;}
  function familyPoint(f,w,h,compress){return {x:lerp(w*f.x,w*.58,compress),y:lerp(h*f.y,h*.50,compress)};}
  function edgeSource(seed,w,h){
    var q=seed.offset,side=(seed.family+Math.floor(seed.phase*4))%4;
    if(side===0)return{x:-30,y:h*(.10+.80*q)};if(side===1)return{x:w+30,y:h*(.10+.80*q)};
    if(side===2)return{x:w*(.10+.80*q),y:-25};return{x:w*(.10+.80*q),y:h+25};
  }
  function drawTraceV2(s,dt){
    if(!s||!s.ctx)return;
    var ctx=s.ctx,w=s.w,h=s.h,u=traceValue(),relations=ease(clamp((u-.18)/.34,0,1)),structure=ease(clamp((u-.45)/.34,0,1)),resolved=ease(clamp((u-.73)/.27,0,1));
    var center={x:w*.58,y:h*.50},compress=ease(clamp((u-.42)/.46,0,1)),hubs=families.map(function(f){return familyPoint(f,w,h,compress*.72);});
    glow(ctx,center.x,center.y,Math.min(w,h)*(.12+.12*resolved),pal.glow,.025+.065*resolved);
    signalSeeds.forEach(function(S,i){
      var src=edgeSource(S,w,h),hub=hubs[S.family],bend=(i%2?1:-1)*(18+28*S.amp),alpha=.035+.10*(1-resolved*.45);
      curve(ctx,src,hub,bend,S.family%3===0?pal.aqua:pal.glow,alpha,.65+(i%8===0?.55:0));
      pulseCurve(ctx,src,hub,bend,(clock*.00018+S.phase+i*.017)%1,S.family%3===0?pal.aqua:pal.glow,.40+.25*(1-u),i%8===0?1.8:1.1);
    });
    hubs.forEach(function(H,fi){
      var rr=Math.min(w,h)*lerp(.085,.052,compress),f=families[fi],col=f.c==="aqua"?pal.aqua:pal.glow;
      glow(ctx,H.x,H.y,rr*1.5,col,.035+.025*relations);ctx.beginPath();ctx.arc(H.x,H.y,rr,0,Math.PI*2);ctx.strokeStyle=rgba(col,.16+.12*relations);ctx.stroke();
      for(var j=0;j<9;j++){var aa=j/9*Math.PI*2+clock*.00018*(fi%2?1:-1)+f.p,rad=rr*(.20+.62*hash(fi*20+j*3.1)),x=H.x+Math.cos(aa)*rad,y=H.y+Math.sin(aa)*rad*.72;dot(ctx,x,y,j%4===0?1.7:.9,j%4===0?pal.aqua:pal.glow,.14+.18*relations);}
    });
    if(relations>.02){for(var a=0;a<hubs.length;a++){for(var b=a+1;b<hubs.length;b++){var A=hubs[a],B=hubs[b],bend=(a+b)%2?22:-22;curve(ctx,A,B,bend,(a+b)%3===0?pal.aqua:pal.glow,.025+.11*relations,.75);pulseCurve(ctx,A,B,bend,(clock*.00013+a*.19+b*.11)%1,(a+b)%3===0?pal.aqua:pal.glow,.45*relations,1.3);}}}
    if(structure>.01){
      for(var ringN=0;ringN<6;ringN++){var rr2=Math.min(w,h)*(.045+ringN*.036)*structure;ctx.beginPath();ctx.ellipse(center.x,center.y,rr2,rr2*.72,clock*.000035*(ringN%2?1:-1),0,Math.PI*2);ctx.strokeStyle=rgba(ringN%2?pal.aqua:pal.glow,.018+.040*structure);ctx.lineWidth=.7;ctx.stroke();}
      for(var axis=0;axis<8;axis++){var ax=axis/8*Math.PI*2+clock*.00004,p1={x:center.x+Math.cos(ax)*Math.min(w,h)*.035,y:center.y+Math.sin(ax)*Math.min(w,h)*.026},p2={x:center.x+Math.cos(ax)*Math.min(w,h)*.19*structure,y:center.y+Math.sin(ax)*Math.min(w,h)*.14*structure};line(ctx,p1,p2,axis%3===0?pal.aqua:pal.glow,.024+.045*structure,.65);}
    }
    hubs.forEach(function(H,fi){
      var bend=(fi%2?1:-1)*18;curve(ctx,H,center,bend,fi%2?pal.aqua:pal.glow,.06+.13*resolved,1.1);
      for(var k=0;k<3;k++)pulseCurve(ctx,H,center,bend,(clock*.00012+fi*.22+k*.31)%1,fi%2?pal.aqua:pal.glow,.48+.18*resolved,1.35);
    });
    if(resolved>.02){for(var c=0;c<4;c++){var ca=clock*.00028+c*Math.PI*.5,rr3=Math.min(w,h)*(.022+.020*c),x=center.x+Math.cos(ca)*rr3,y=center.y+Math.sin(ca)*rr3*.72;dot(ctx,x,y,1.4+c*.3,c%2?pal.aqua:pal.glow,.25+.45*resolved);}glow(ctx,center.x,center.y,48+44*resolved,pal.glow,.07+.06*resolved);ctx.beginPath();ctx.arc(center.x,center.y,4+4*resolved,0,Math.PI*2);ctx.fillStyle=rgba(pal.glow,.82);ctx.fill();}
  }

  function render(now){
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;clock+=reduce?0:dt*1000;
    pointer.x=lerp(pointer.x,pointer.tx,.06);pointer.y=lerp(pointer.y,pointer.ty,.06);
    if(themeDirty)palette();
    if(measure&&measure.visible){measure.clear();drawMeasureV2(measure,dt);}
    if(membrane&&membrane.visible){membrane.clear();drawMembraneV2(membrane,dt);}
    if(trace&&trace.visible){trace.clear();drawTraceV2(trace,dt);}
    requestAnimationFrame(render);
  }
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();requestAnimationFrame(render);
})();