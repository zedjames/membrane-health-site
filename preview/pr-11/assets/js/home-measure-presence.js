(function(){
  "use strict";
  if(window.__membraneMeasurePresence||!document.getElementById("different"))return;
  window.__membraneMeasurePresence=true;

  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var host=document.querySelector("#different .wm__visual");
  if(!host)return;

  if(!document.querySelector('link[data-measure-presence-style]')){
    var css=document.createElement("link");css.rel="stylesheet";css.href="assets/css/home-measure-presence.css?v=1";css.dataset.measurePresenceStyle="true";document.head.appendChild(css);
  }

  var canvas=document.createElement("canvas");canvas.className="mh-measure-presence";canvas.setAttribute("aria-hidden","true");host.insertBefore(canvas,host.firstChild);
  var ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return;
  var W=1,H=1,D=1,last=performance.now(),clock=0,themeDirty=true,mode="boundary",modeT=0;
  var pointer={x:0,y:0,tx:0,ty:0};
  var pal={};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";themeDirty=false;}
  function resize(){var r=host.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function glow(x,y,r,c,a){if(r<=0)return;var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.33,rgba(c,a*.30));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function line(a,b,c,alpha,w){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();}
  function pulse(a,b,u,c,alpha,r){var p={x:lerp(a.x,b.x,u),y:lerp(a.y,b.y,u)};glow(p.x,p.y,(r||2)*7,c,alpha*.12);dot(p.x,p.y,r||1.6,c,alpha);}

  function activeMode(){var b=document.querySelector('#different .wm-aspect[aria-pressed="true"][data-aspect]');return b?b.dataset.aspect:"boundary";}

  var agents=Array.from({length:148},function(_,i){
    var a=hash(i*3.11)*Math.PI*2,rr=Math.sqrt(hash(i*7.19))*.86;
    return{x:Math.cos(a)*rr,y:Math.sin(a)*rr,z:hash(i*11.7),vx:0,vy:0,vz:0,p:hash(i*17.3)*Math.PI*2,f:i%7,grp:i%4};
  });
  var sectors=Array.from({length:18},function(_,i){return{a:i/18*Math.PI*2,p:hash(31+i*5.7)*Math.PI*2,load:.15+hash(i*13.2)*.32};});
  var rhythmPhase=[0,1.25,2.62,4.08];

  function project(p,cx,cy,R){
    var rx=pointer.y*.16,ry=pointer.x*.24,x=p.x,y=p.y,z=p.z-.5;
    var cyy=Math.cos(ry),sy=Math.sin(ry),cxx=Math.cos(rx),sx=Math.sin(rx);
    var x1=x*cyy+z*sy,z1=-x*sy+z*cyy,y1=y*cxx-z1*sx,z2=y*sx+z1*cxx;
    var d=.48+.70*clamp(z2+.5,0,1);
    return{x:cx+x1*R*d,y:cy+y1*R*.72*d,z:clamp(z2+.5,0,1),s:d};
  }

  function chamber(cx,cy,R,c,alpha){
    glow(cx,cy,R*1.30,c,.035*alpha);
    for(var i=0;i<7;i++){
      var z=.10+i*.13,d=.48+.70*z;
      ctx.beginPath();ctx.ellipse(cx+pointer.x*R*(z-.5)*.09,cy+pointer.y*R*(z-.5)*.06,R*d,R*.72*d,0,0,Math.PI*2);
      ctx.strokeStyle=rgba(i%2?pal.aqua:c,(.018+.018*z)*alpha);ctx.lineWidth=.7;ctx.stroke();
    }
  }

  function outerBoundary(cx,cy,R,deform,c,alpha){
    ctx.beginPath();
    for(var i=0;i<=160;i++){
      var a=i/160*Math.PI*2,local=0;
      for(var s=0;s<sectors.length;s++){var d=Math.atan2(Math.sin(a-sectors[s].a),Math.cos(a-sectors[s].a));local+=Math.exp(-(d*d)/.18)*sectors[s].load;}
      var rr=R*(1+deform*local*.04+Math.sin(a*3+clock*.00035)*.004);
      var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.79;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.strokeStyle=rgba(c,.24*alpha);ctx.lineWidth=1.35;ctx.shadowColor=rgba(c,.20*alpha);ctx.shadowBlur=16;ctx.stroke();ctx.shadowBlur=0;
  }

  function advance(dt,m){
    var k=dt*60,cycle=(clock%12000)/12000;
    for(var i=0;i<agents.length;i++){
      var p=agents[i],r=Math.hypot(p.x,p.y)||.001,a=Math.atan2(p.y,p.x),vx=0,vy=0,vz=0;
      if(m==="boundary"){
        var sector=sectors[Math.floor(((a+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*sectors.length)%sectors.length];
        var gate=.5+.5*Math.sin(clock*.00085+sector.p),rad=(.72-r)*.010+(gate-.5)*.006;
        vx=-p.y*.010+Math.cos(a)*rad;vy=p.x*.010+Math.sin(a)*rad;vz=Math.sin(clock*.00043+p.p)*.0012;
      }else if(m==="stability"){
        var attack=cycle<.24?smooth(cycle/.24):cycle<.58?smooth(1-(cycle-.24)/.34):0;
        var recover=cycle>.42?smooth((cycle-.42)/.36):0;
        vx=-p.y*.006-p.x*(.008+.020*recover)-attack*(.020+.020*p.z);
        vy=p.x*.006+Math.sin(p.p+clock*.0014)*.004*attack+(p.grp-1.5)*.0025*recover;
        vz=(.50-p.z)*.003+attack*Math.sin(p.p)*.005;
      }else if(m==="coherence"){
        var target=rhythmPhase[p.grp]+clock*.00072,pa=Math.atan2(p.y,p.x),phaseErr=Math.atan2(Math.sin(target-pa),Math.cos(target-pa));
        var lock=.38+.62*(.5+.5*Math.sin(clock*.00019));
        vx=-p.y*(.009+.011*lock)+Math.cos(pa+phaseErr)*.004*lock;
        vy=p.x*(.009+.011*lock)+Math.sin(pa+phaseErr)*.004*lock;
        vz=Math.sin(target+p.p*.3)*.0012;
      }else{
        var rec=.5-.5*Math.cos(cycle*Math.PI*2),targetR=.28+.35*(1-rec);
        var pull=(targetR-r)*(.010+.020*rec);
        vx=-p.y*.005+Math.cos(a)*pull;vy=p.x*.005+Math.sin(a)*pull;vz=(.62-p.z)*.004*rec;
      }
      p.vx=lerp(p.vx,vx,.06);p.vy=lerp(p.vy,vy,.06);p.vz=lerp(p.vz,vz,.06);
      p.x+=p.vx*k;p.y+=p.vy*k;p.z=clamp(p.z+p.vz*k,.02,.98);
      if(Math.hypot(p.x,p.y)>1.03){p.x*=.985;p.y*=.985;}
    }
    if(m==="boundary")for(var s=0;s<sectors.length;s++){sectors[s].load=.16+.48*(.5+.5*Math.sin(clock*.00037+sectors[s].p));}
  }

  function drawParticles(cx,cy,R,m){
    var projected=agents.map(function(p){return{p:p,q:project(p,cx,cy,R)};}).sort(function(a,b){return a.q.z-b.q.z;});
    for(var i=0;i<projected.length;i++){
      var it=projected[i],q=it.q,p=it.p,c=p.f===0?pal.aqua:(m==="stability"&&p.grp===0?pal.ease:m==="recovery"&&p.grp===3?pal.go:pal.glow);
      if(i%11===0)glow(q.x,q.y,8+8*q.z,c,.015+.016*q.z);
      dot(q.x,q.y,.6+1.8*q.z,c,.09+.30*q.z);
    }
    return projected;
  }

  function boundaryPresence(cx,cy,R,pts){
    outerBoundary(cx,cy,R,.9,pal.glow,1);
    for(var s=0;s<sectors.length;s++){
      var S=sectors[s],a=S.a,rr=R*(.82+.10*S.load),p0={x:cx+Math.cos(a)*R*.36,y:cy+Math.sin(a)*R*.36*.79},p1={x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*.79};
      line(p0,p1,s%4===0?pal.aqua:pal.glow,.035+.10*S.load,.7+S.load*.8);
      if(S.load>.52){var u=(clock*.00012+S.p) % 1,out={x:cx+Math.cos(a)*R*1.12,y:cy+Math.sin(a)*R*.89},inn={x:cx+Math.cos(a)*R*.73,y:cy+Math.sin(a)*R*.58};curve(out,inn,s%2?10:-10,s%4===0?pal.aqua:pal.glow,.11,1);pulse(out,inn,u,s%4===0?pal.aqua:pal.glow,.72,1.9);}
    }
    var pos={x:cx+R*.18,y:cy-R*.08},ang=-.22,edge={x:cx+Math.cos(ang)*R*.97,y:cy+Math.sin(ang)*R*.79*.97};
    curve(pos,edge,-R*.08,pal.glow,.34,1.35);glow(pos.x,pos.y,42,pal.glow,.09);dot(pos.x,pos.y,4,pal.glow,.9);dot(edge.x,edge.y,2.5,pal.glow,.72);
    ctx.beginPath();ctx.arc(cx,cy,R*.64,-.55,.12);ctx.strokeStyle=rgba(pal.glow,.15);ctx.lineWidth=7;ctx.stroke();
  }

  function stabilityPresence(cx,cy,R){
    var cycle=(clock%12000)/12000,attack=cycle<.24?smooth(cycle/.24):cycle<.58?smooth(1-(cycle-.24)/.34):0,recover=cycle>.42?smooth((cycle-.42)/.36):0;
    outerBoundary(cx,cy,R,.25+1.25*attack,pal.glow,1);
    var source={x:W+80,y:cy-R*.22},hit={x:cx+R*.82,y:cy-R*.08};
    for(var i=0;i<7;i++){curve(source,hit,-54+i*18,pal.ease,.05+.12*attack,1.0);var u=(clock*.00018+i*.13)%1;pulse(source,hit,u,pal.ease,.68*attack,2);}
    for(var j=0;j<9;j++){var a=Math.PI*.55+j/8*Math.PI*.9,src={x:cx+Math.cos(a)*R*.62,y:cy+Math.sin(a)*R*.49},dst={x:cx+R*.34,y:cy-R*.03};curve(src,dst,j%2?15:-15,j%3===0?pal.aqua:pal.glow,.04+.13*recover,1);pulse(src,dst,(clock*.00011+j*.08)%1,j%3===0?pal.aqua:pal.glow,.56*recover,1.6);}
    for(var w=0;w<6;w++){ctx.beginPath();ctx.ellipse(hit.x-R*.10*w,hit.y,R*(.10+w*.07+attack*.10),R*(.05+w*.035+attack*.055),-.08,0,Math.PI*2);ctx.strokeStyle=rgba(w<2?pal.ease:pal.glow,.08*(1-w*.11)*attack);ctx.lineWidth=1;ctx.stroke();}
    if(recover>.2){glow(cx-R*.06,cy,R*.24,pal.aqua,.03*recover);}
  }

  function coherencePresence(cx,cy,R,pts){
    outerBoundary(cx,cy,R,.18,pal.aqua,1);
    var centers=[];
    for(var g=0;g<4;g++){var a=-2.2+g*1.38,rr=R*(g%2?.35:.48);centers.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*.72});}
    var lock=.38+.62*(.5+.5*Math.sin(clock*.00019));
    centers.forEach(function(c,g){
      var phase=rhythmPhase[g]+clock*.00072;
      for(var k=0;k<3;k++){ctx.beginPath();ctx.arc(c.x,c.y,18+k*14,phase+k*.6,phase+k*.6+Math.PI*(.65+.22*lock));ctx.strokeStyle=rgba(g%2?pal.aqua:pal.glow,.05+.07*lock);ctx.lineWidth=1.2;ctx.stroke();}
      glow(c.x,c.y,26,g%2?pal.aqua:pal.glow,.035);dot(c.x,c.y,2.5,g%2?pal.aqua:pal.glow,.65);
    });
    for(var i=0;i<centers.length;i++)for(var j=i+1;j<centers.length;j++){var d=Math.hypot(centers[i].x-centers[j].x,centers[i].y-centers[j].y);if(d<R*.95)curve(centers[i],centers[j],(i+j)%2?20:-20,(i+j)%2?pal.aqua:pal.glow,.025+.12*lock,1+lock*.5);}
    for(var q=0;q<5;q++){var x=cx-R*.72+((clock*.035+q*R*.42)%(R*1.44));ctx.beginPath();ctx.ellipse(x,cy,R*.12,R*.52,0,0,Math.PI*2);ctx.strokeStyle=rgba(q%2?pal.aqua:pal.glow,.018+.035*lock);ctx.stroke();}
  }

  function recoveryPresence(cx,cy,R){
    var cycle=(clock%12000)/12000,rec=.5-.5*Math.cos(cycle*Math.PI*2),history=[];
    outerBoundary(cx,cy,R,.15,pal.go,1);
    for(var h=0;h<8;h++){var u=h/7,a=-.55+u*1.35,rr=R*(.72-.40*u),p={x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr*.68};history.push(p);if(h){curve(history[h-1],p,-12,pal.go,.07+.09*u,1.15);}dot(p.x,p.y,1.6+u*2,pal.go,.24+.48*u);}
    glow(cx+R*.55,cy-R*.20,R*.24,pal.recover,.045*(1-rec)+.012);
    for(var i=0;i<5;i++){ctx.beginPath();ctx.arc(cx,cy,R*(.46+i*.09)*(.86+.14*rec),0,Math.PI*2);ctx.strokeStyle=rgba(i<2?pal.recover:pal.go,.025+.028*i*rec);ctx.lineWidth=.8;ctx.stroke();}
    for(var j=0;j<10;j++){var a=j/10*Math.PI*2,outer={x:cx+Math.cos(a)*R*.72,y:cy+Math.sin(a)*R*.57},inner={x:cx+Math.cos(a)*R*.28,y:cy+Math.sin(a)*R*.22};curve(outer,inner,j%2?10:-10,j%3===0?pal.aqua:pal.go,.04+.10*rec,1);pulse(outer,inner,(clock*.00011+j*.091)%1,j%3===0?pal.aqua:pal.go,.60*rec,1.7);}
    var now=history[history.length-1];glow(now.x,now.y,46,pal.go,.10);dot(now.x,now.y,4,pal.go,.9);
  }

  function render(now){
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;clock+=reduce?0:dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);if(themeDirty)palette();
    var next=activeMode();if(next!==mode){mode=next;modeT=clock;agents.forEach(function(p){p.vx*=.35;p.vy*=.35;p.vz*=.35;});}
    ctx.clearRect(0,0,W,H);advance(dt,mode);
    var cx=W*.53,cy=H*.49,R=Math.min(W*.48,H*.56);chamber(cx,cy,R,mode==="recovery"?pal.go:mode==="stability"?pal.ease:pal.glow,1);
    var pts=drawParticles(cx,cy,R,mode);
    if(mode==="boundary")boundaryPresence(cx,cy,R,pts);else if(mode==="stability")stabilityPresence(cx,cy,R);else if(mode==="coherence")coherencePresence(cx,cy,R,pts);else recoveryPresence(cx,cy,R);
    requestAnimationFrame(render);
  }

  host.addEventListener("pointermove",function(e){var r=host.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1);},{passive:true});
  host.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  new ResizeObserver(resize).observe(host);
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();requestAnimationFrame(render);
})();
