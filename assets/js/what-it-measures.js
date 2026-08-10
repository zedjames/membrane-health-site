(function () {
  "use strict";

  var section = document.getElementById("different");
  if (!section || window.__wmNextGen) return;
  window.__wmNextGen = true;

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.querySelector('link[data-wm-next-style]')) {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "assets/css/what-it-measures-next.css?v=3";
    css.dataset.wmNextStyle = "true";
    document.head.appendChild(css);
  }

  var COPY = {
    boundary: {
      name: "Boundary",
      title: "Your remaining capacity",
      desc: "The living edge within which today's load can still be organized and recovered from — and the distance still available to you.",
      note: "The edge is the measurement. What matters is not where you are, but how much room is left between you and it."
    },
    stability: {
      name: "Stability",
      title: "Membrane integrity",
      desc: "How well the system preserves its organization as conditions change and load moves through it.",
      note: "A disturbance arrives. Stability is whether the organization holds its shape — and how quickly it settles again."
    },
    coherence: {
      name: "Coherence",
      title: "Whole-system alignment",
      desc: "How well physiological processes remain coordinated with one another through time and across the relationships that connect them.",
      note: "Separate processes, moving together. Coherence is the relationship between them, not the level of any one."
    },
    recovery: {
      name: "Recovery",
      title: "Recovery direction & ETA",
      desc: "The movement by which load becomes restored capacity — both the direction of change and the timing of return.",
      note: "Load becoming capacity again. Recovery is a direction through time, with the edge reopening behind it."
    }
  };

  section.className = "wm2";
  section.innerHTML = `
    <div class="wm2__shell">
      <header class="wm2__head">
        <p class="eyebrow">What it measures</p>
        <h2 class="h-section" id="wm-heading">Health is a system remaining itself through change.</h2>
        <p class="lede">
          Our bodies remain alive by preserving organization while conditions continually change.
          Boundary, stability, coherence, and recovery describe different aspects of that
          organization, and Membrane Health brings them together into a reading of where the
          system is today.
        </p>
      </header>

      <div class="wm2__instrument">
        <div class="wm2__modebar" role="group" aria-label="Choose an aspect to see in the field">
          ${["boundary","stability","coherence","recovery"].map(function(key, i){
            return `<button class="wm2-mode wm-aspect" type="button" data-aspect="${key}" aria-pressed="${i===0}">
              <span class="wm2-mode__index">0${i+1}</span>
              <span class="wm2-mode__copy">
                <span class="wm2-mode__kicker">${COPY[key].name}</span>
                <strong>${COPY[key].title}</strong>
              </span>
            </button>`;
          }).join("")}
        </div>

        <div class="wm2__stage">
          <canvas class="wm2__canvas" aria-hidden="true"></canvas>

          <div class="wm2__stage-hud">
            <div class="wm2__readout">
              <p class="wm2__readout-kicker" id="wm2-kicker">Boundary</p>
              <h3 class="wm2__readout-title" id="wm2-title">Your remaining capacity</h3>
              <p class="wm2__readout-copy" id="wm2-copy">${COPY.boundary.desc}</p>
            </div>

            <div class="wm2__phase" aria-live="polite">
              <span class="wm2__phase-dot" aria-hidden="true"></span>
              <span id="wm2-phase">regulated exchange ongoing</span>
            </div>
          </div>

          <div class="wm2__depth" aria-label="Explore the field across scale">
            <div class="wm2__depth-title">Scale</div>
            <div class="wm2__depth-control">
              <input id="wm2-depth" class="wm2__depth-range" type="range" min="0" max="4" step="0.01" value="0"
                aria-label="Zoom through the field from whole system to local exchange">
              <div class="wm2__depth-labels" aria-hidden="true">
                <span>Whole</span><span>System</span><span>Boundary</span><span>Local</span><span>Exchange</span>
              </div>
            </div>
            <button class="wm2__return" id="wm2-return" type="button" hidden>Return to whole</button>
          </div>

          <div class="wm2__scale-readout" aria-live="polite">
            <span class="wm2__scale-index">01</span>
            <span id="wm2-scale-name">Whole system</span>
          </div>
        </div>

        <p class="wm2__note" id="wm2-note">${COPY.boundary.note}</p>
      </div>
    </div>
  `;

  var stage = section.querySelector(".wm2__stage");
  var canvas = section.querySelector(".wm2__canvas");
  var ctx = canvas.getContext("2d", {alpha:true});
  if (!ctx) return;

  var depthInput = document.getElementById("wm2-depth");
  var returnButton = document.getElementById("wm2-return");
  var scaleName = document.getElementById("wm2-scale-name");
  var kicker = document.getElementById("wm2-kicker");
  var title = document.getElementById("wm2-title");
  var copy = document.getElementById("wm2-copy");
  var phaseLabel = document.getElementById("wm2-phase");
  var note = document.getElementById("wm2-note");

  var W=1,H=1,D=1,visible=true,last=performance.now(),clock=0,mode="boundary",modeStart=0;
  var pointer={x:0,y:0,tx:0,ty:0};
  var pal={},themeDirty=true;
  var depth=0,depthTarget=0,focusSystem=4;
  var DEPTH_NAMES=["Whole system","Physiological system","Living boundary","Local relation","Exchange"];

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
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
    pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";
    pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";
    pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";
    pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";
    themeDirty=false;
  }
  function resize(){
    var r=stage.getBoundingClientRect();
    W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
    canvas.style.width=W+"px";canvas.style.height=H+"px";
    ctx.setTransform(D,0,0,D,0,0);
  }
  function glow(x,y,r,c,a){
    if(r<=0)return;
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,rgba(c,a));g.addColorStop(.34,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function line(a,b,c,alpha,w,dash){
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;
    if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
  }
  function curve(a,b,bend,c,alpha,w){
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    var c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend};
    var c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);
    ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();
  }
  function pulse(a,b,bend,u,c,alpha,r){
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    var c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend};
    var c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};
    var v=1-u,uu=u*u,vv=v*v;
    var p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};
    glow(p.x,p.y,(r||2)*8,c,alpha*.14);dot(p.x,p.y,r||1.8,c,alpha);
  }

  var tracers=Array.from({length:180},function(_,i){
    var a=hash(i*4.21)*Math.PI*2,r=Math.sqrt(hash(i*7.73))*.82;
    return{x:Math.cos(a)*r,y:Math.sin(a)*r,z:hash(i*12.13),vx:0,vy:0,vz:0,p:hash(i*17.9)*Math.PI*2,g:i%4,f:i%9};
  });

  var systems=[
    {x:-.42,y:-.20,r:.16,p:.2},
    {x:.28,y:-.30,r:.18,p:1.7},
    {x:.42,y:.17,r:.145,p:3.3},
    {x:-.18,y:.30,r:.17,p:4.6},
    {x:.02,y:.02,r:.12,p:5.4}
  ];

  var sectors=Array.from({length:24},function(_,i){
    return{a:i/24*Math.PI*2,p:hash(40+i*7.1)*Math.PI*2,load:.18+hash(i*11.2)*.3};
  });

  function phaseOf(){
    var t=clock-modeStart;
    if(mode==="stability"){
      var c=(t%14500)/14500;
      if(c<.14)return["baseline organization",c/.14];
      if(c<.32)return["disturbance entering",(c-.14)/.18];
      if(c<.58)return["compensation spreading",(c-.32)/.26];
      if(c<.82)return["load redistributing",(c-.58)/.24];
      return["settling toward baseline",(c-.82)/.18];
    }
    if(mode==="coherence"){
      var cc=(t%18000)/18000;
      if(cc<.24)return["independent rhythms",cc/.24];
      if(cc<.56)return["coupling increasing",(cc-.24)/.32];
      if(cc<.78)return["phase lock emerging",(cc-.56)/.22];
      return["coherence relaxing",(cc-.78)/.22];
    }
    if(mode==="recovery"){
      var cr=(t%17000)/17000;
      if(cr<.22)return["load still organized at the edge",cr/.22];
      if(cr<.52)return["return trajectory forming",(cr-.22)/.30];
      if(cr<.80)return["reserve rebuilding",(cr-.52)/.28];
      return["capacity reopening",(cr-.80)/.20];
    }
    return["regulated exchange ongoing",(t%9000)/9000];
  }

  function depthFocus(cx,cy,R){
    var d=depth,sys=systems[focusSystem]||systems[4];
    var whole={x:cx,y:cy};
    var system={x:cx+sys.x*R,y:cy+sys.y*R*.76};
    var angle=mode==="stability"?-.08:mode==="recovery"?-.36:mode==="coherence"?Math.atan2(sys.y*.76,sys.x):-.27;
    var boundary={x:cx+Math.cos(angle)*R*.82,y:cy+Math.sin(angle)*R*.82*.78};
    var local={x:cx+Math.cos(angle)*R*.93,y:cy+Math.sin(angle)*R*.93*.78};
    var exchange={x:cx+Math.cos(angle)*R*1.01,y:cy+Math.sin(angle)*R*1.01*.78};
    var stops=[whole,system,boundary,local,exchange];
    var i=Math.min(3,Math.floor(d)),f=d-i;
    return {x:lerp(stops[i].x,stops[i+1].x,f),y:lerp(stops[i].y,stops[i+1].y,f)};
  }
  function cameraScale(){
    var stops=[1,1.34,1.72,2.28,3.05],i=Math.min(3,Math.floor(depth)),f=depth-i;
    return lerp(stops[i],stops[i+1],smooth(f));
  }
  function applyCamera(cx,cy,R){
    var focus=depthFocus(cx,cy,R),s=cameraScale(),screen={x:W*.53,y:H*.50};
    ctx.translate(screen.x,screen.y);ctx.scale(s,s);ctx.translate(-focus.x,-focus.y);
    return {focus:focus,scale:s,screen:screen};
  }
  function cameraPoint(p,cam){
    return{x:(p.x-cam.focus.x)*cam.scale+cam.screen.x,y:(p.y-cam.focus.y)*cam.scale+cam.screen.y};
  }

  function project(p,cx,cy,R){
    var rx=pointer.y*.10,ry=pointer.x*.16,x=p.x,y=p.y,z=p.z-.5;
    var cyy=Math.cos(ry),sy=Math.sin(ry),cxx=Math.cos(rx),sx=Math.sin(rx);
    var x1=x*cyy+z*sy,z1=-x*sy+z*cyy,y1=y*cxx-z1*sx,z2=y*sx+z1*cxx;
    var zc=clamp(z2+.5,0,1),dep=.54+.64*zc;
    return{x:cx+x1*R*dep,y:cy+y1*R*.72*dep,z:zc,s:dep};
  }

  function membranePath(cx,cy,R,opt){
    opt=opt||{};
    var deform=opt.deform||0,impact=opt.impact||0,impactAngle=opt.impactAngle||-.1,recover=opt.recover||0;
    ctx.beginPath();
    for(var i=0;i<=180;i++){
      var a=i/180*Math.PI*2,sector=sectors[Math.floor(i/180*sectors.length)%sectors.length];
      var dd=Math.atan2(Math.sin(a-impactAngle),Math.cos(a-impactAngle));
      var localImpact=Math.exp(-(dd*dd)/.12)*impact;
      var rr=R*(1+deform*(sector.load-.38)*.07-localImpact*.16+recover*.035+Math.sin(a*3+clock*.00018)*.0035);
      var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.78;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();return ctx;
  }
  function drawReferenceMembrane(cx,cy,R){
    ctx.save();membranePath(cx,cy,R,{});ctx.strokeStyle=rgba(pal.soft,.045);ctx.lineWidth=.8;ctx.setLineDash([3,11]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function drawMembrane(cx,cy,R,c,opt){
    ctx.save();membranePath(cx,cy,R,opt);ctx.strokeStyle=rgba(c,.31);ctx.lineWidth=1.45;ctx.shadowColor=rgba(c,.22);ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;ctx.restore();
  }
  function drawVolume(cx,cy,R,alpha){
    var detail=1-clamp((depth-2.1)/1.9,0,1)*.72;
    for(var i=0;i<7;i++){
      var z=.12+i*.125,d=.53+.63*z;
      ctx.beginPath();ctx.ellipse(cx+pointer.x*R*(z-.5)*.05,cy+pointer.y*R*(z-.5)*.035,R*d,R*.72*d,0,0,Math.PI*2);
      ctx.strokeStyle=rgba(i%2?pal.aqua:pal.glow,(.012+.018*z)*alpha*detail);ctx.lineWidth=.65;ctx.stroke();
    }
  }
  function drawSystems(cx,cy,R,strength,coherence){
    systems.forEach(function(s,i){
      var wob=reduce?0:Math.sin(clock*.00055+s.p)*R*.012*(1-coherence);
      var x=cx+s.x*R+wob,y=cy+s.y*R*.76+Math.cos(clock*.00047+s.p)*wob*.7;
      var rr=s.r*R*(1+.05*Math.sin(clock*.00062+s.p));
      var emphasis=i===focusSystem?1+.35*clamp(depth-.5,0,1):1;
      glow(x,y,rr*1.5,i%2?pal.aqua:pal.glow,.018*strength*emphasis);
      ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.strokeStyle=rgba(i%2?pal.aqua:pal.glow,.08*strength*emphasis);ctx.lineWidth=.9;ctx.stroke();
      var inner=clamp(depth-.55,0,1);
      for(var k=0;k<4+Math.round(inner*4);k++){
        var a=clock*.00022*(.7+i*.06)+s.p+k*Math.PI/(2+inner);
        var px=x+Math.cos(a)*rr*(.24+.075*k),py=y+Math.sin(a)*rr*(.24+.075*k);
        dot(px,py,k===0?1.8:1,i%2?pal.aqua:pal.glow,(.18+.16*inner)*strength);
      }
      if(inner>.15){
        for(var q=0;q<3;q++){
          var ar=clock*.0001+s.p+q*2.1;
          ctx.beginPath();ctx.arc(x,y,rr*(.28+q*.17),ar,ar+Math.PI*(.7+.2*inner));
          ctx.strokeStyle=rgba(q%2?pal.aqua:pal.glow,.04+.05*inner);ctx.lineWidth=.7;ctx.stroke();
        }
      }
    });
  }

  function advanceTracers(dt){
    var ph=phaseOf(),state=ph[0],pstate=ph[1],k=dt*60;
    for(var i=0;i<tracers.length;i++){
      var p=tracers[i],r=Math.hypot(p.x,p.y)||.001,a=Math.atan2(p.y,p.x),vx=0,vy=0,vz=0;
      if(mode==="boundary"){
        var sector=sectors[Math.floor(((a+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*sectors.length)%sectors.length];
        var gate=.5+.5*Math.sin(clock*.00062+sector.p);
        vx=-p.y*.008+Math.cos(a)*(.74-r)*.006+Math.cos(p.p+clock*.00021)*.0015+(gate-.5)*Math.cos(a)*.001;
        vy=p.x*.008+Math.sin(a)*(.74-r)*.006+Math.sin(p.p+clock*.00019)*.0015+(gate-.5)*Math.sin(a)*.001;
        vz=Math.sin(clock*.00031+p.p)*.001;
      }else if(mode==="stability"){
        var attack=state==="disturbance entering"?smooth(pstate):state==="compensation spreading"?1-smooth(pstate):0;
        var comp=state==="compensation spreading"?smooth(pstate):state==="load redistributing"?1:state==="settling toward baseline"?1-smooth(pstate):0;
        vx=-p.y*.006-attack*(.024+.018*p.z)-p.x*.008*comp;
        vy=p.x*.006+Math.sin(p.p+clock*.0012)*.004*attack+(p.g-1.5)*.0026*comp;
        vz=(.52-p.z)*.0025+attack*Math.sin(p.p)*.0045;
      }else if(mode==="coherence"){
        var coupling=state==="independent rhythms"?.08:state==="coupling increasing"?lerp(.08,.78,smooth(pstate)):state==="phase lock emerging"?lerp(.78,1,smooth(pstate)):lerp(1,.45,smooth(pstate));
        var target=clock*.00042+p.g*Math.PI/2,err=Math.atan2(Math.sin(target-a),Math.cos(target-a));
        vx=-p.y*(.006+.010*coupling)+Math.cos(a+err)*.0038*coupling;
        vy=p.x*(.006+.010*coupling)+Math.sin(a+err)*.0038*coupling;
        vz=Math.sin(target+p.p*.2)*.0009;
      }else{
        var rec=state==="load still organized at the edge"?0:state==="return trajectory forming"?smooth(pstate)*.45:state==="reserve rebuilding"?.45+.45*smooth(pstate):.90+.10*smooth(pstate);
        var targetR=.62-.31*rec,pull=(targetR-r)*(.006+.016*rec);
        vx=-p.y*.004+Math.cos(a)*pull;vy=p.x*.004+Math.sin(a)*pull;vz=(.60-p.z)*.0035*rec;
      }
      p.vx=lerp(p.vx,vx,.055);p.vy=lerp(p.vy,vy,.055);p.vz=lerp(p.vz,vz,.055);
      p.x+=p.vx*k;p.y+=p.vy*k;p.z=clamp(p.z+p.vz*k,.02,.98);
      if(Math.hypot(p.x,p.y)>1.02){p.x*=.986;p.y*=.986;}
    }
    if(mode==="boundary")sectors.forEach(function(s){s.load=.18+.52*(.5+.5*Math.sin(clock*.00029+s.p));});
  }
  function drawTracers(cx,cy,R,colorMode){
    var projected=tracers.map(function(p){return{p:p,q:project(p,cx,cy,R)};}).sort(function(a,b){return a.q.z-b.q.z;});
    projected.forEach(function(it,i){
      var p=it.p,q=it.q,c=p.f===0?pal.aqua:(colorMode==="stability"&&p.g===0?pal.ease:colorMode==="recovery"&&p.g===3?pal.go:pal.glow);
      if(i%13===0)glow(q.x,q.y,7+9*q.z,c,.012+.018*q.z);
      dot(q.x,q.y,.55+1.65*q.z,c,.07+.27*q.z);
    });
  }

  function drawBoundary(cx,cy,R){
    drawReferenceMembrane(cx,cy,R);drawMembrane(cx,cy,R,pal.glow,{deform:1});drawSystems(cx,cy,R,.9,.66);
    sectors.forEach(function(s,i){
      var a=s.a,load=s.load,inner={x:cx+Math.cos(a)*R*.63,y:cy+Math.sin(a)*R*.63*.78},edge={x:cx+Math.cos(a)*R*(.93+.035*(load-.4)),y:cy+Math.sin(a)*R*(.93+.035*(load-.4))*.78};
      line(inner,edge,i%5===0?pal.aqua:pal.glow,.025+.12*load,.7+load*.8);
      if(load>.50){
        var out={x:cx+Math.cos(a)*R*1.12,y:cy+Math.sin(a)*R*.88},inn={x:cx+Math.cos(a)*R*.76,y:cy+Math.sin(a)*R*.59};
        curve(out,inn,i%2?12:-12,i%5===0?pal.aqua:pal.glow,.09+.08*load,1);pulse(out,inn,i%2?12:-12,(clock*.00010+s.p)%1,i%5===0?pal.aqua:pal.glow,.68,1.7);
      }
    });
    var pos={x:cx+R*.13,y:cy-R*.08},ang=-.27,edge={x:cx+Math.cos(ang)*R*.965,y:cy+Math.sin(ang)*R*.965*.78};
    curve(pos,edge,-R*.10,pal.glow,.36,1.45);glow(pos.x,pos.y,44,pal.glow,.09);dot(pos.x,pos.y,4.2,pal.glow,.92);dot(edge.x,edge.y,2.4,pal.glow,.68);
  }
  function drawStability(cx,cy,R){
    var ph=phaseOf(),state=ph[0],p=ph[1];
    var attack=state==="disturbance entering"?smooth(p):state==="compensation spreading"?1-smooth(p):0;
    var comp=state==="compensation spreading"?smooth(p):state==="load redistributing"?1:state==="settling toward baseline"?1-smooth(p):0;
    drawReferenceMembrane(cx,cy,R);drawMembrane(cx,cy,R,pal.glow,{impact:attack,impactAngle:-.08,recover:comp*.35});drawSystems(cx-attack*R*.055,cy,R,.92,.42+.5*comp);
    if(attack>.02){
      var source={x:W+80,y:cy-R*.18},hit={x:cx+R*.84,y:cy-R*.06};
      for(var i=0;i<8;i++){var bend=-70+i*20;curve(source,hit,bend,pal.ease,.04+.13*attack,1);pulse(source,hit,bend,(clock*.00019+i*.103)%1,pal.ease,.72*attack,2);}
      for(var w=0;w<7;w++){ctx.beginPath();ctx.ellipse(hit.x-R*.025*w,hit.y,R*(.07+w*.055+attack*.11),R*(.035+w*.032+attack*.05),-.08,0,Math.PI*2);ctx.strokeStyle=rgba(w<2?pal.ease:pal.glow,.095*(1-w*.11)*attack);ctx.lineWidth=1;ctx.stroke();}
    }
    if(comp>.03){
      [-2.55,-2.0,2.45,1.95].forEach(function(a,i){var src={x:cx+Math.cos(a)*R*.70,y:cy+Math.sin(a)*R*.55},dst={x:cx+R*.30,y:cy-R*.02};curve(src,dst,i%2?24:-24,i%2?pal.aqua:pal.glow,.055+.12*comp,1.05);pulse(src,dst,i%2?24:-24,(clock*.00011+i*.19)%1,i%2?pal.aqua:pal.glow,.58*comp,1.6);});
    }
  }
  function drawCoherence(cx,cy,R){
    var ph=phaseOf(),state=ph[0],p=ph[1];
    var coupling=state==="independent rhythms"?.08:state==="coupling increasing"?lerp(.08,.78,smooth(p)):state==="phase lock emerging"?lerp(.78,1,smooth(p)):lerp(1,.45,smooth(p));
    drawMembrane(cx,cy,R,pal.aqua,{deform:.12});drawSystems(cx,cy,R,.9,coupling);
    var centers=systems.slice(0,4).map(function(s){return{x:cx+s.x*R,y:cy+s.y*R*.76};});
    centers.forEach(function(c,i){
      var phase=clock*.00042+i*Math.PI/2;
      for(var k=0;k<4;k++){ctx.beginPath();ctx.arc(c.x,c.y,18+k*13,phase+k*.47,phase+k*.47+Math.PI*(.42+.38*coupling));ctx.strokeStyle=rgba(i%2?pal.aqua:pal.glow,.035+.075*coupling);ctx.lineWidth=1.1;ctx.stroke();}
      glow(c.x,c.y,28,i%2?pal.aqua:pal.glow,.025+.035*coupling);
    });
    for(var i=0;i<centers.length;i++)for(var j=i+1;j<centers.length;j++)if((i+j)%2===0||coupling>.62){
      curve(centers[i],centers[j],(i-j)*11,(i+j)%3===0?pal.aqua:pal.glow,.025+.11*coupling,.75+coupling*.35);
      if(coupling>.45)pulse(centers[i],centers[j],(i-j)*11,(clock*.00008+i*.17+j*.11)%1,(i+j)%3===0?pal.aqua:pal.glow,.50*coupling,1.5);
    }
  }
  function drawRecovery(cx,cy,R){
    var ph=phaseOf(),state=ph[0],p=ph[1];
    var rec=state==="load still organized at the edge"?0:state==="return trajectory forming"?smooth(p)*.45:state==="reserve rebuilding"?.45+.45*smooth(p):.90+.10*smooth(p);
    for(var g=0;g<5;g++){ctx.save();ctx.globalAlpha=.10*(1-g/5)*(1-rec*.78);drawMembrane(cx-R*.015*g,cy+R*.009*g,R*(.79+.035*g),g<2?pal.recover:pal.glow,{deform:.28});ctx.restore();}
    drawMembrane(cx,cy,R,pal.go,{recover:rec});drawSystems(cx,cy,R,.82,.55+.4*rec);
    var load={x:cx+R*.58,y:cy-R*.22};glow(load.x,load.y,R*(.13-.06*rec),pal.recover,.11*(1-rec*.66));
    var p0={x:cx+R*.58,y:cy-R*.22},p1={x:cx+R*.25,y:cy+R*.03},p2={x:cx-R*.02,y:cy+R*.02};
    curve(p0,p1,R*.10,pal.go,.18+.14*rec,1.4);curve(p1,p2,-R*.06,pal.go,.22+.14*rec,1.4);
    pulse(p0,p1,R*.10,(clock*.00007)%1,pal.go,.68,1.9);if(rec>.4)pulse(p1,p2,-R*.06,(clock*.00008+.35)%1,pal.go,.72*rec,1.9);
    var now={x:lerp(p0.x,p2.x,rec),y:lerp(p0.y,p2.y,rec)+Math.sin(rec*Math.PI)*R*.08};glow(now.x,now.y,42,pal.go,.08+.05*rec);dot(now.x,now.y,4,pal.go,.9);
  }

  function drawDeepDetails(cx,cy,R){
    var d=depth;
    if(d<.75)return;
    var focus=depthFocus(cx,cy,R),local=clamp((d-1.4)/2.6,0,1),exchange=clamp((d-3.15)/.85,0,1);
    var c=mode==="stability"?pal.ease:mode==="recovery"?pal.go:mode==="coherence"?pal.aqua:pal.glow;

    if(d>1.45){
      for(var b=0;b<6;b++){
        var rr=R*(.045+b*.024)*(1+.18*Math.sin(clock*.0003+b));
        ctx.beginPath();ctx.arc(focus.x,focus.y,rr,clock*.00005*b,Math.PI*2+clock*.00005*b);
        ctx.strokeStyle=rgba(b%2?pal.aqua:c,.035+.05*local);ctx.lineWidth=.65;ctx.stroke();
      }
    }

    if(d>2.0){
      var angle=mode==="stability"?-.08:mode==="recovery"?-.36:mode==="coherence"?Math.atan2((systems[focusSystem]||systems[4]).y*.76,(systems[focusSystem]||systems[4]).x):-.27;
      var bx=cx+Math.cos(angle)*R*.96,by=cy+Math.sin(angle)*R*.96*.78,nx=Math.cos(angle),ny=Math.sin(angle),tx=-ny,ty=nx;
      for(var g=0;g<9;g++){
        var spread=(g-4)*R*.018,open=.25+.75*(.5+.5*Math.sin(clock*.0007+g*.83));
        var gx=bx+tx*spread,gy=by+ty*spread;
        ctx.beginPath();ctx.moveTo(gx-tx*R*.012*(.5+open),gy-ty*R*.012*(.5+open));ctx.lineTo(gx+tx*R*.012*(.5+open),gy+ty*R*.012*(.5+open));
        ctx.strokeStyle=rgba(g%3===0?pal.aqua:c,.08+.18*open*local);ctx.lineWidth=.7+open*.7;ctx.stroke();
        if(exchange>.05&&open>.45){
          var a={x:gx+nx*R*.09,y:gy+ny*R*.09},b={x:gx-nx*R*.09,y:gy-ny*R*.09};
          pulse(a,b,0,(clock*.00016+g*.11)%1,g%3===0?pal.aqua:c,.5+.35*exchange,1.3+exchange);
        }
      }
    }

    if(d>3.1){
      for(var q=0;q<18;q++){
        var aa=q/18*Math.PI*2+clock*.00008,rr=R*(.03+.055*hash(q*3.7)),x=focus.x+Math.cos(aa)*rr,y=focus.y+Math.sin(aa)*rr*.68;
        glow(x,y,5,c,.015+.025*exchange);dot(x,y,.8+exchange,c,.18+.28*exchange);
      }
      for(var k=0;k<5;k++){
        var yoff=(k-2)*R*.026;
        ctx.beginPath();ctx.moveTo(focus.x-R*.13,focus.y+yoff);ctx.bezierCurveTo(focus.x-R*.04,focus.y+yoff-R*.025,focus.x+R*.04,focus.y+yoff+R*.025,focus.x+R*.13,focus.y+yoff);
        ctx.strokeStyle=rgba(k%2?pal.aqua:c,.04+.09*exchange);ctx.lineWidth=.7;ctx.stroke();
      }
    }
  }

  function updateScaleReadout(){
    var idx=Math.round(depthTarget);
    scaleName.textContent=DEPTH_NAMES[idx];
    returnButton.hidden=depthTarget<.35;
    section.dataset.wmDepth=String(idx);
  }

  function render(now){
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;
    pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);
    depth=lerp(depth,depthTarget,.07);
    if(themeDirty)palette();if(!visible){requestAnimationFrame(render);return;}
    phaseLabel.textContent=phaseOf()[0];advanceTracers(dt);ctx.clearRect(0,0,W,H);

    var cx=W*.53,cy=H*.50,R=Math.min(W*.42,H*.51),base=mode==="stability"?pal.ease:mode==="recovery"?pal.go:mode==="coherence"?pal.aqua:pal.glow;
    ctx.save();
    applyCamera(cx,cy,R);
    glow(cx,cy,R*1.35,base,.022);
    drawVolume(cx,cy,R,.95);
    drawTracers(cx,cy,R,mode);
    if(mode==="boundary")drawBoundary(cx,cy,R);else if(mode==="stability")drawStability(cx,cy,R);else if(mode==="coherence")drawCoherence(cx,cy,R);else drawRecovery(cx,cy,R);
    drawDeepDetails(cx,cy,R);
    ctx.restore();

    requestAnimationFrame(render);
  }

  function setMode(next){
    if(!COPY[next])return;mode=next;modeStart=clock;section.dataset.wmMode=mode;
    focusSystem=next==="coherence"?1:next==="recovery"?2:4;
    section.querySelectorAll(".wm2-mode").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.aspect===mode?"true":"false");});
    kicker.textContent=COPY[mode].name;title.textContent=COPY[mode].title;copy.textContent=COPY[mode].desc;note.textContent=COPY[mode].note;
  }

  section.querySelectorAll(".wm2-mode").forEach(function(b){b.addEventListener("click",function(){setMode(b.dataset.aspect);});});
  depthInput.addEventListener("input",function(){depthTarget=clamp(+depthInput.value||0,0,4);updateScaleReadout();});
  returnButton.addEventListener("click",function(){depthTarget=0;depthInput.value="0";updateScaleReadout();});

  stage.addEventListener("pointermove",function(e){
    var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);
  },{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  stage.addEventListener("click",function(e){
    if(depthTarget<.55||depthTarget>2.15)return;
    var r=stage.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
    var cx=W*.53,cy=H*.50,R=Math.min(W*.42,H*.51),cam={focus:depthFocus(cx,cy,R),scale:cameraScale(),screen:{x:W*.53,y:H*.50}};
    var best=focusSystem,bd=Infinity;
    systems.forEach(function(s,i){
      var p=cameraPoint({x:cx+s.x*R,y:cy+s.y*R*.76},cam),dd=(p.x-mx)*(p.x-mx)+(p.y-my)*(p.y-my);
      if(dd<bd){bd=dd;best=i;}
    });
    if(bd<Math.pow(Math.min(W,H)*.16,2))focusSystem=best;
  });

  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"25% 0px 25% 0px",threshold:.01}).observe(section);
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});

  palette();resize();setMode("boundary");updateScaleReadout();requestAnimationFrame(render);
})();