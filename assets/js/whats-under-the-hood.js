(function(){
  "use strict";
  var section=document.getElementById("science");
  if(!section||window.__uhRelationalGrandV2)return;
  window.__uhRelationalGrandV2=true;

  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!document.querySelector('link[data-uh-next-style]')){
    var css=document.createElement("link");
    css.rel="stylesheet";
    css.href="assets/css/whats-under-the-hood-next.css?v=3";
    css.dataset.uhNextStyle="true";
    document.head.appendChild(css);
  }

  var MANIFOLDS=[
    {name:"Autonomic",cohort:"morning",x:-.48,y:-.32},
    {name:"Circadian",cohort:"overnight",x:.48,y:-.32},
    {name:"Metabolic",cohort:"overnight",x:.46,y:.33},
    {name:"Mechanical",cohort:"daytime",x:-.46,y:.33}
  ];
  var BIOMARKERS=[
    {name:"HRV",m:0,type:"coord"},{name:"RHR",m:0,type:"coord"},{name:"VO₂",m:0,type:"coord"},{name:"Cardio recovery",m:0,type:"coord"},{name:"HR lability",m:0,type:"vol"},{name:"RHR volatility",m:0,type:"vol"},
    {name:"Sleep quality",m:1,type:"coord"},{name:"Sleep duration",m:1,type:"coord"},{name:"Deep / REM",m:1,type:"coord"},{name:"Circadian timing",m:1,type:"vol"},{name:"Activity level",m:1,type:"coord"},{name:"Sleep fragmentation",m:1,type:"vol"},
    {name:"Wrist temp",m:2,type:"coord"},{name:"RR",m:2,type:"coord"},{name:"SpO₂",m:2,type:"coord"},{name:"SpO₂ overnight",m:2,type:"coord"},{name:"Glucose",m:2,type:"coord",optional:true},{name:"CGM TIR",m:2,type:"coord",optional:true},
    {name:"Activity demand",m:3,type:"coord"},{name:"Effort intensity",m:3,type:"coord"},{name:"Walking speed",m:3,type:"coord"},{name:"Exercise",m:3,type:"coord"},{name:"Gait asymmetry",m:3,type:"vol"}
  ];
  var REPRESENTATIVE=[0,1,13,14,6,9,18,20];
  var FAMILIES=["Timing","Coherence","Laminarity","Recovery","Drift","Entrainment"];
  var STAGES=["Biomarkers","Manifolds","Phase field","Families","Membrane"];
  var STAGE_COPY=[
    "Named HealthKit biomarkers remain visible as moving evidence inside the living boundary.",
    "Related biomarkers gather into Autonomic, Circadian, Metabolic, and Mechanical manifolds while retaining their identity and observation status.",
    "The four manifolds become participants in a shared timing geometry. Relative lead, lag, sequence, and phase relationships appear between them.",
    "Timing, Coherence, Laminarity, Recovery, Drift, and Entrainment read different properties of that distributed relational field.",
    "The relational families and manifold states resolve into one bounded pre-diagnostic membrane state with the provenance still attached."
  ];
  var FAMILY_COPY={
    Timing:"sequence, lead, lag, and timing burden across the distributed field",
    Coherence:"how consistently the manifold relationships remain mutually organized",
    Laminarity:"whether transport through the relational field stays ordered and route-consistent",
    Recovery:"how the distributed state returns toward an organized reference after challenge",
    Drift:"how the manifold relationships migrate across retained history",
    Entrainment:"how selectively the distributed field aligns with repeated rhythmic forcing"
  };

  section.className="uh2 uh2--relational uh2--grand";
  section.innerHTML=`
    <div class="uh2__shell">
      <header class="uh2__head">
        <p class="eyebrow">What's under the hood</p>
        <h2 class="h-section" id="uh-heading">The biomarkers become relationships.</h2>
        <p class="lede">Membrane begins with the measurements already present in Apple&nbsp;Health. Those biomarkers organize into four physiological manifolds. The manifolds then become participants in a shared relational field whose timing, coherence, laminarity, recovery, drift, and entrainment can be followed through time.</p>
        <p class="lede serif-italic">Phase is the timing substrate beneath those relationships. The families describe what that substrate is doing.</p>
        <p class="subtle uh2__validation"><em>Formal verification</em> establishes the integrity of the mathematics. <em>Physiological validation</em> establishes how the resulting measurements behave in people. Human testing continues as the empirical history grows.</p>
      </header>
      <div class="uh2__instrument">
        <div class="uh2__phasebar" role="group" aria-label="Move through the hierarchy inside the membrane">
          ${STAGES.map(function(n,i){return `<button class="uh2-phase" type="button" data-phase="${i}" aria-pressed="${i===4}"><span>0${i+1}</span><strong>${n}</strong></button>`;}).join("")}
        </div>
        <div class="uh2__stage">
          <canvas class="uh2__canvas" aria-hidden="true"></canvas>
          <div class="uh2__stage-copy"><p class="uh2__stage-kicker">Inside the membrane</p><h3 id="uh2-phase-name">Membrane</h3><p id="uh2-phase-copy">${STAGE_COPY[4]}</p></div>
          <div class="uh2__motion" aria-live="polite"><span class="uh2__motion-dot"></span><span id="uh2-motion">relational field resolved · provenance retained</span></div>
          <div class="uh2__lineage" aria-live="polite"><span>Tracing</span><strong id="uh2-lineage">HRV → Autonomic manifold → phase substrate → Coherence → membrane</strong></div>
          <div class="uh2__phase-substrate" aria-hidden="true">PHASE · RELATIVE TIMING SUBSTRATE</div>
        </div>
        <div class="uh2__family-lenses" role="group" aria-label="Inspect a relational family">
          ${FAMILIES.map(function(n,i){return `<button class="uh2-family" type="button" data-family="${n}" aria-pressed="${i===1}"><span>${String(i+1).padStart(2,"0")}</span><strong>${n}</strong></button>`;}).join("")}
        </div>
        <div class="uh2__trace">
          <div class="uh2__trace-head"><span>Open the hierarchy</span><span>each layer remains visible as the next forms</span></div>
          <input id="uh2-range" class="uh2__range" type="range" min="0" max="4" step="0.01" value="4" aria-label="Move from biomarkers through manifolds and phase into relational families and the membrane state">
          <div class="uh2__trace-labels" aria-hidden="true"><span>biomarkers</span><span>manifolds</span><span>phase</span><span>families</span><span>membrane</span></div>
          <div class="uh2__actions"><button id="uh2-play" type="button">Follow the state →</button><button id="uh2-unfold" type="button">Unfold the membrane ←</button></div>
        </div>
      </div>
      <div class="uh2__sources"><p class="uh2__sources-label">Trace one biomarker through the hierarchy</p><div class="uh2__source-buttons" role="group" aria-label="Choose a biomarker to trace">${REPRESENTATIVE.map(function(idx,j){return `<button class="uh2-source" type="button" data-signal="${idx}" aria-pressed="${j===0}">${BIOMARKERS[idx].name}</button>`;}).join("")}</div></div>
      <div class="uh2__evidence">
        <article class="uh2-evidence"><p class="feature__kicker">Measured biomarkers</p><h3 class="h-card">The evidence stays named</h3><p class="subtle">HRV, resting heart rate, respiratory rate, blood oxygen, sleep, temperature, movement, recovery, and related measurements remain individually identifiable inside the field.</p><p class="subtle">The engine keeps slower baseline deviation and faster volatility distinct, and observation status remains attached to every contributing channel.</p></article>
        <article class="uh2-evidence"><p class="feature__kicker">Four manifolds</p><h3 class="h-card">Physiology becomes relational</h3><p class="subtle">Autonomic, Circadian, Metabolic, and Mechanical manifolds organize related biomarkers into living physiological states. Their histories, strengths, instabilities, and timing relationships can then be compared across the whole system.</p><div class="sci__chips"><span class="chip">Autonomic</span><span class="chip">Circadian</span><span class="chip">Metabolic</span><span class="chip">Mechanical</span></div></article>
        <article class="uh2-evidence"><p class="feature__kicker">Relational families</p><h3 class="h-card">One substrate, several readings</h3><p class="subtle">Phase supplies the underlying timing geometry. Timing, Coherence, Laminarity, Recovery, Drift, and Entrainment interrogate different properties of that shared distributed field before the aggregate membrane state resolves.</p><p class="subtle">The result remains traceable backward from state to family, manifold, and named biomarker.</p></article>
      </div>
      <div class="sci-stats uh2__stats"><div class="sci-stat"><span class="sci-stat__n" data-attest="lines">560K+</span><span class="sci-stat__l">lines of machine-checked proof</span></div><div class="sci-stat"><span class="sci-stat__n">4</span><span class="sci-stat__l">physiological manifolds</span></div><div class="sci-stat"><span class="sci-stat__n">6</span><span class="sci-stat__l">relational families</span></div><div class="sci-stat"><span class="sci-stat__n">100%</span><span class="sci-stat__l">traceable readings</span></div></div>
      <p class="sci-more uh2__more">Want to go deeper? The whole picture — from the human idea to the mathematics to the proof — <a href="science.html">The science of Membrane&nbsp;Health&nbsp;→</a></p>
      <p class="sci-footnote"><span class="fn">*</span> <em>Formally proven</em> describes the integrity of the formal mathematics: stable, structured, auditable, and fully transparent. Physiological validation establishes how the measurement behaves in living systems.</p>
    </div>`;

  var stage=section.querySelector(".uh2__stage"),canvas=section.querySelector(".uh2__canvas"),ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return;
  var range=document.getElementById("uh2-range"),phaseName=document.getElementById("uh2-phase-name"),phaseCopy=document.getElementById("uh2-phase-copy"),lineage=document.getElementById("uh2-lineage"),motion=document.getElementById("uh2-motion"),play=document.getElementById("uh2-play"),unfold=document.getElementById("uh2-unfold"),phaseSub=section.querySelector(".uh2__phase-substrate");
  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,themeDirty=true,phase=4,phaseTarget=4,selected=0,activeFamily="Coherence",playing=0,pal={},pointer={x:0,y:0,tx:0,ty:0};

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function hash(n){var x=Math.sin(n*127.1)*43758.5453123;return x-Math.floor(x);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.aquaDeep=cs.getPropertyValue("--aqua-deep").trim()||"#21A8C7";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){if(r<=0)return;var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.32,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();return[c1,c2];}
  function pulseCurve(a,b,bend,u,c,alpha,r){var cs=curve(a,b,bend,c,alpha*.12,.55),c1=cs[0],c2=cs[1],v=1-u,uu=u*u,vv=v*v,p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};glow(p.x,p.y,(r||1.4)*6,c,alpha*.10);dot(p.x,p.y,r||1.4,c,alpha);return p;}

  var slotCounts=[0,0,0,0];
  var manifoldTotals=MANIFOLDS.map(function(_,m){return BIOMARKERS.filter(function(b){return b.m===m;}).length;});
  var particles=BIOMARKERS.map(function(b,i){var a=hash(i*4.13)*Math.PI*2,r=.18+Math.sqrt(hash(i*8.7))*.69,slot=slotCounts[b.m]++;return{a:a,r:r,p:hash(i*13.1)*Math.PI*2,s:.45+hash(i*19.7)*.7,x:Math.cos(a)*r,y:Math.sin(a)*r,vx:0,vy:0,b:b,slot:slot,total:manifoldTotals[b.m]};});
  var phaseOffsets=[.10,1.43,3.18,4.72];
  var ghostHistory=Array.from({length:18},function(_,i){return{u:i/17,w:hash(i*7.4)*.7+.3};});

  function geom(){return{cx:W*.56,cy:H*.53,R:Math.min(W*.39,H*.47)};}
  function membranePoint(g,a,scale){var rr=g.R*(scale||1)*(1+.011*Math.sin(a*3+clock*.00022)+.006*Math.sin(a*7-clock*.00013));return{x:g.cx+Math.cos(a)*rr,y:g.cy+Math.sin(a)*rr*.76};}
  function drawMembrane(g,alpha,c,scale,dash,blur){ctx.beginPath();for(var i=0;i<=180;i++){var p=membranePoint(g,i/180*Math.PI*2,scale||1);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=1.35;if(dash)ctx.setLineDash(dash);if(blur){ctx.shadowColor=rgba(c,alpha*.4);ctx.shadowBlur=blur;}ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);}
  function manifoldPoint(g,m,t){var M=MANIFOLDS[m],w=reduce?0:Math.sin(clock*.00024+m*1.7)*g.R*.010*(1-(t||0)*.45);return{x:g.cx+M.x*g.R+w,y:g.cy+M.y*g.R*.76+Math.cos(clock*.00021+m)*w*.40};}
  function particleTarget(p){var M=MANIFOLDS[p.b.m],a=(p.slot/Math.max(1,p.total))*Math.PI*2+(p.b.m*.42),ring=p.b.type==="vol"?.115:.085;if(p.total>5&&p.slot%2)ring+=.030;var drift=reduce?0:Math.sin(clock*.00016+p.p)*.008;return{x:M.x+Math.cos(a)*(ring+drift),y:M.y+Math.sin(a)*(ring+drift)*1.12};}

  function advance(dt){var organize=smooth((phase-.42)/1.05),k=dt*60;particles.forEach(function(p){var target=particleTarget(p),r=Math.hypot(p.x,p.y)||.001,a=Math.atan2(p.y,p.x),swirl=.0062*(1-.72*organize),pull=.0016+.0125*organize,vx=-p.y*swirl+(target.x-p.x)*pull+Math.cos(a)*(.71-r)*.0025,vy=p.x*swirl+(target.y-p.y)*pull+Math.sin(a)*(.71-r)*.0025;if(p.b.type==="vol"){vx+=Math.sin(clock*.0012+p.p)*.0013;vy+=Math.cos(clock*.00135+p.p)*.0013;}p.vx=lerp(p.vx,vx,.06);p.vy=lerp(p.vy,vy,.06);p.x+=p.vx*k;p.y+=p.vy*k;if(Math.hypot(p.x,p.y)>.94){p.x*=.986;p.y*=.986;}});}

  function drawAtmosphere(g){for(var i=0;i<10;i++){var z=i/9,scale=.45+.56*z;ctx.beginPath();ctx.ellipse(g.cx+pointer.x*g.R*(z-.5)*.07,g.cy-g.R*.08*(1-z)+pointer.y*g.R*(z-.5)*.04,g.R*scale,g.R*.76*scale,0,0,Math.PI*2);ctx.strokeStyle=rgba(i%3===0?pal.aqua:pal.glow,.006+.015*z);ctx.lineWidth=.55;ctx.stroke();}glow(g.cx,g.cy,g.R*1.45,pal.aquaDeep,.028);}
  function drawExchange(g){var strength=.65+.35*(1-smooth((phase-.6)/1.2));for(var i=0;i<18;i++){var a=-1.15+i/17*2.30,edge=membranePoint(g,a,.995),nx=Math.cos(a),ny=Math.sin(a),out={x:edge.x+nx*g.R*.30,y:edge.y+ny*g.R*.23},inn={x:edge.x-nx*g.R*.20,y:edge.y-ny*g.R*.15},c=i%5===0?pal.aqua:pal.glow;curve(out,inn,(i%2?1:-1)*10,c,.028+.055*strength,.65);pulseCurve(out,inn,(i%2?1:-1)*10,(clock*.000075+i*.059)%1,c,.42+.25*strength,1.25);}for(var j=0;j<7;j++){var a2=Math.PI*.45+j/6*Math.PI*.9,e2=membranePoint(g,a2,1),nx2=Math.cos(a2),ny2=Math.sin(a2),from={x:e2.x-nx2*g.R*.17,y:e2.y-ny2*g.R*.13},to={x:e2.x+nx2*g.R*.25,y:e2.y+ny2*g.R*.19};pulseCurve(from,to,0,(clock*.000055+j*.13)%1,pal.glow,.42,1.2);}}
  function drawBiomarkers(g){var reveal=.45+.55*smooth((phase+.1)/.8),organize=smooth((phase-.45)/1.1);particles.forEach(function(p,i){var b=p.b,x=g.cx+p.x*g.R,y=g.cy+p.y*g.R*.76,isSel=i===selected,c=b.m%2?pal.aqua:pal.glow;if(b.type==="vol")c=b.m%2?pal.glow:pal.aqua;glow(x,y,isSel?25:8,c,isSel?.08:.011*reveal);dot(x,y,isSel?4:(b.type==="vol"?1.7:2.05),c,(isSel?.98:.34)*reveal);if(b.type==="vol"){ctx.beginPath();ctx.arc(x,y,isSel?8:5,clock*.00035+i,clock*.00035+i+Math.PI*1.15);ctx.strokeStyle=rgba(c,(isSel?.5:.15)*reveal);ctx.lineWidth=.75;ctx.stroke();}var showLabel=isSel||phase<.95&&i%3===0||organize>.84&&p.slot===0,labelAlpha=isSel?.98:(showLabel?.34:.035);if(labelAlpha>.075){ctx.font=(isSel?"500 11px":"400 9px")+" ui-sans-serif,system-ui";ctx.fillStyle=rgba(c,labelAlpha);ctx.textAlign="center";ctx.fillText(b.name,x,y-(isSel?13:8));}});}
  function drawManifolds(g){var strength=smooth((phase-.52)/.92);if(strength<.01)return;MANIFOLDS.forEach(function(m,i){var c=i%2?pal.aqua:pal.glow,p=manifoldPoint(g,i,strength),members=particles.filter(function(x){return x.b.m===i;}),rr=g.R*.19;glow(p.x,p.y,rr*1.20,c,.019*strength);ctx.beginPath();ctx.ellipse(p.x,p.y,rr,rr*.67,0,0,Math.PI*2);ctx.strokeStyle=rgba(c,.10*strength);ctx.lineWidth=.85;ctx.setLineDash([3,10]);ctx.stroke();ctx.setLineDash([]);ctx.font="500 11px ui-sans-serif,system-ui";ctx.textAlign="center";ctx.fillStyle=rgba(c,.80*strength);ctx.fillText(m.name,p.x,p.y+(i<2?-rr*.78:rr*.78)+(i<2?-10:18));ctx.font="400 8px ui-sans-serif,system-ui";ctx.fillStyle=rgba(pal.soft,.34*strength);ctx.fillText(m.cohort,p.x,p.y+(i<2?-rr*.78:rr*.78)+(i<2?2:30));members.forEach(function(x,j){var bx=g.cx+x.x*g.R,by=g.cy+x.y*g.R*.76,slotA=(x.slot/Math.max(1,x.total))*Math.PI*2,target={x:p.x+Math.cos(slotA+i*.42)*rr*.48,y:p.y+Math.sin(slotA+i*.42)*rr*.44};curve({x:bx,y:by},target,(j-members.length/2)*1.6,c,.012+.032*strength,.45);});});}

  function oscillator(g,m,strength){var p=manifoldPoint(g,m,strength),c=m%2?pal.aqua:pal.glow,phaseA=clock*.00027*(.88+m*.06)+phaseOffsets[m],r=g.R*.072;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(c,.15*strength);ctx.lineWidth=.8;ctx.stroke();var q={x:p.x+Math.cos(phaseA)*r,y:p.y+Math.sin(phaseA)*r};line(p,q,c,.44*strength,1.05);dot(q.x,q.y,2,c,.76*strength);return{p:p,q:q,a:phaseA,r:r,c:c};}
  function drawPhaseField(g){var strength=smooth((phase-1.42)/.9);if(strength<.01)return;var osc=MANIFOLDS.map(function(_,i){return oscillator(g,i,strength);}),pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];pairs.forEach(function(pr,i){var A=osc[pr[0]],B=osc[pr[1]],d=Math.atan2(Math.sin(B.a-A.a),Math.cos(B.a-A.a)),bend=(i%2?1:-1)*g.R*(.052+.008*i),c=i%3===0?pal.aqua:pal.glow;curve(A.p,B.p,bend,c,.035+.10*strength,.72);for(var k=0;k<2;k++)pulseCurve(A.p,B.p,bend,(clock*.000055+i*.11+k*.43)%1,c,.40*strength,1.2);var mid={x:(A.p.x+B.p.x)/2,y:(A.p.y+B.p.y)/2};ctx.font="400 8px ui-sans-serif,system-ui";ctx.fillStyle=rgba(pal.soft,.20*strength);ctx.textAlign="center";ctx.fillText((d>=0?"+":"")+(d*180/Math.PI).toFixed(0)+"°",mid.x,mid.y-5);});phaseSub.style.opacity=String(.08+.55*strength);}

  function drawTiming(g,s){var pts=MANIFOLDS.map(function(_,i){return manifoldPoint(g,i,s);}),order=[1,0,2,3,1];for(var i=0;i<order.length-1;i++){var A=pts[order[i]],B=pts[order[i+1]],bend=(i%2?1:-1)*g.R*.07;curve(A,B,bend,i%2?pal.aqua:pal.glow,.10*s,1);for(var q=0;q<3;q++)pulseCurve(A,B,bend,(clock*.00007+q*.27+i*.16)%1,i%2?pal.aqua:pal.glow,.60*s,1.4);}}
  function drawCoherence(g,s){var pts=MANIFOLDS.map(function(_,i){return manifoldPoint(g,i,s);});for(var i=0;i<pts.length;i++)for(var j=i+1;j<pts.length;j++){var c=(i+j)%2?pal.aqua:pal.glow,bend=(i-j)*g.R*.030;curve(pts[i],pts[j],bend,c,.08+.08*s,1.0+s*.3);if((i+j)%2===0)pulseCurve(pts[i],pts[j],bend,(clock*.000065+i*.19+j*.11)%1,c,.62*s,1.5);}for(var r=0;r<4;r++){ctx.beginPath();ctx.ellipse(g.cx,g.cy,g.R*(.20+r*.095),g.R*(.14+r*.070),clock*.000025+r*.28,0,Math.PI*2);ctx.strokeStyle=rgba(r%2?pal.aqua:pal.glow,.022+.015*r*s);ctx.lineWidth=.65;ctx.stroke();}}
  function drawLaminarity(g,s){for(var i=0;i<24;i++){var y=(i-11.5)*g.R*.035,start={x:g.cx-g.R*1.05,y:g.cy+y},end={x:g.cx+g.R*1.05,y:g.cy+y*.87},bend=Math.sin(i*.65)*g.R*.018*(1-.7*s);curve(start,end,bend,i%5===0?pal.glow:pal.aqua,.025+.06*s,.6);if(i%3===0)pulseCurve(start,end,bend,(clock*.00005+i*.061)%1,i%5===0?pal.glow:pal.aqua,.42+.18*s,1.1);}}
  function drawRecovery(g,s){MANIFOLDS.forEach(function(_,i){var p=manifoldPoint(g,i,s),dx=(i%2?1:-1)*g.R*.12,dy=(i<2?-1:1)*g.R*.08,ghost={x:p.x+dx,y:p.y+dy};ctx.beginPath();ctx.ellipse(ghost.x,ghost.y,g.R*.070,g.R*.043,0,0,Math.PI*2);ctx.strokeStyle=rgba(pal.recover,.09*s);ctx.setLineDash([3,8]);ctx.stroke();ctx.setLineDash([]);curve(ghost,p,(i%2?1:-1)*g.R*.038,pal.go,.14*s,1.05);pulseCurve(ghost,p,(i%2?1:-1)*g.R*.038,(clock*.000075+i*.17)%1,pal.go,.68*s,1.5);});}
  function drawDrift(g,s){MANIFOLDS.forEach(function(_,i){var p=manifoldPoint(g,i,s),c=i%2?pal.aqua:pal.glow;ctx.beginPath();ghostHistory.forEach(function(h,j){var dx=Math.sin(i*1.7+h.u*4.6)*g.R*.075*h.u,dy=Math.cos(i*.9+h.u*3.2)*g.R*.050*h.u,x=p.x-dx,y=p.y-dy;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);if(j%4===0)dot(x,y,1.1,c,.07+.08*h.u*s);});ctx.strokeStyle=rgba(c,.07+.08*s);ctx.lineWidth=.8;ctx.stroke();});}
  function drawEntrainment(g,s){var drive=(clock*.00011)%1;for(var r=0;r<8;r++){var u=(drive+r/8)%1,rad=g.R*(.24+u*.92);ctx.beginPath();ctx.ellipse(g.cx,g.cy,rad,rad*.76,0,0,Math.PI*2);ctx.strokeStyle=rgba(r%3===0?pal.aqua:pal.glow,(1-u)*.055*s);ctx.lineWidth=.8;ctx.stroke();}MANIFOLDS.forEach(function(_,i){var p=manifoldPoint(g,i,s),a=clock*.00011*Math.PI*2+phaseOffsets[i]*.15,q={x:p.x+Math.cos(a)*g.R*.065,y:p.y+Math.sin(a)*g.R*.065};line(p,q,i%2?pal.aqua:pal.glow,.38*s,1.0);dot(q.x,q.y,2,i%2?pal.aqua:pal.glow,.72*s);});}
  function drawFamilies(g){var strength=smooth((phase-2.45)/.85);if(strength<.01)return;var radius=g.R*.92;FAMILIES.forEach(function(n,i){var a=-Math.PI/2+i/FAMILIES.length*Math.PI*2,x=g.cx+Math.cos(a)*radius,y=g.cy+Math.sin(a)*radius*.76,active=n===activeFamily,c=i%2?pal.aqua:pal.glow;glow(x,y,g.R*(active?.10:.045),c,(active?.045:.010)*strength);ctx.beginPath();ctx.arc(x,y,active?7:4.5,0,Math.PI*2);ctx.strokeStyle=rgba(c,(active?.50:.14)*strength);ctx.lineWidth=active?1.3:.75;ctx.stroke();dot(x,y,active?2.5:1.3,c,(active?.9:.36)*strength);ctx.font=(active?"500 10px":"400 8.5px")+" ui-sans-serif,system-ui";ctx.fillStyle=rgba(c,(active?.92:.40)*strength);ctx.textAlign="center";ctx.fillText(n,x,y+(Math.sin(a)>=0?18:-12));});if(activeFamily==="Timing")drawTiming(g,strength);else if(activeFamily==="Coherence")drawCoherence(g,strength);else if(activeFamily==="Laminarity")drawLaminarity(g,strength);else if(activeFamily==="Recovery")drawRecovery(g,strength);else if(activeFamily==="Drift")drawDrift(g,strength);else drawEntrainment(g,strength);}
  function drawAggregate(g){var strength=smooth((phase-3.35)/.65);if(strength<.01)return;drawMembrane(g,.18+.26*strength,pal.glow,1,null,18);drawMembrane(g,.045+.07*strength,pal.aqua,.80,[3,10]);var center={x:g.cx,y:g.cy},state={x:g.cx+g.R*.08,y:g.cy-g.R*.045};MANIFOLDS.forEach(function(_,i){var p=manifoldPoint(g,i,strength),c=i%2?pal.aqua:pal.glow,bend=(i%2?1:-1)*g.R*.075;curve(p,center,bend,c,.05+.10*strength,.85);pulseCurve(p,center,bend,(clock*.000065+i*.19)%1,c,.45*strength,1.35);});FAMILIES.forEach(function(_,i){var a=-Math.PI/2+i/FAMILIES.length*Math.PI*2,p={x:g.cx+Math.cos(a)*g.R*.92,y:g.cy+Math.sin(a)*g.R*.92*.76};curve(p,state,(i%2?1:-1)*g.R*.04,i%2?pal.aqua:pal.glow,.025+.055*strength,.6);});glow(state.x,state.y,g.R*.16,pal.glow,.09*strength);dot(state.x,state.y,4.5,pal.glow,.95*strength);ctx.beginPath();ctx.arc(state.x,state.y,14,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,.38*strength);ctx.lineWidth=1.25;ctx.stroke();}

  function selectedLineage(){var b=BIOMARKERS[selected];return b.name+" → "+MANIFOLDS[b.m].name+" manifold → phase substrate → "+activeFamily+" → membrane state";}
  function updateText(){var idx=Math.round(phaseTarget);phaseName.textContent=STAGES[idx];phaseCopy.textContent=STAGE_COPY[idx];section.querySelectorAll(".uh2-phase").forEach(function(b){b.setAttribute("aria-pressed",+b.dataset.phase===idx?"true":"false");});lineage.textContent=selectedLineage();motion.textContent=idx===0?"named biomarkers moving through exchange":idx===1?"four distinct manifold territories forming":idx===2?"relative timing geometry spanning between manifolds":idx===3?activeFamily.toLowerCase()+" lens active · "+FAMILY_COPY[activeFamily]:"relational field resolved · provenance retained";phaseSub.style.display=phaseTarget>1.35?"block":"none";}
  function setPhase(v){phaseTarget=clamp(v,0,4);range.value=phaseTarget.toFixed(2);updateText();}
  function setSignal(i){selected=i;section.querySelectorAll(".uh2-source").forEach(function(b){b.setAttribute("aria-pressed",+b.dataset.signal===selected?"true":"false");});updateText();}
  function setFamily(n){if(FAMILIES.indexOf(n)<0)return;activeFamily=n;section.querySelectorAll(".uh2-family").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.family===n?"true":"false");});if(phaseTarget<3)phaseTarget=3;range.value=phaseTarget.toFixed(2);updateText();}

  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.05);pointer.y=lerp(pointer.y,pointer.ty,.05);if(themeDirty)palette();if(playing){phaseTarget+=dt*.38*playing;if(phaseTarget>=4){phaseTarget=4;playing=0;play.textContent="Follow the state →";}if(phaseTarget<=0){phaseTarget=0;playing=0;unfold.textContent="Unfold the membrane ←";}range.value=phaseTarget.toFixed(2);updateText();}phase=lerp(phase,phaseTarget,.06);advance(dt);if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);var g=geom();g.cx+=pointer.x*g.R*.025;g.cy+=pointer.y*g.R*.018;drawAtmosphere(g);drawMembrane(g,.13,pal.soft,1);drawMembrane(g,.035,pal.glow,.79,[3,12]);drawExchange(g);drawBiomarkers(g);drawManifolds(g);drawPhaseField(g);drawFamilies(g);drawAggregate(g);requestAnimationFrame(render);}

  section.querySelectorAll(".uh2-phase").forEach(function(b){b.addEventListener("click",function(){playing=0;setPhase(+b.dataset.phase);});});
  section.querySelectorAll(".uh2-source").forEach(function(b){b.addEventListener("click",function(){setSignal(+b.dataset.signal);});});
  section.querySelectorAll(".uh2-family").forEach(function(b){b.addEventListener("click",function(){setFamily(b.dataset.family);});});
  range.addEventListener("input",function(){playing=0;phaseTarget=+range.value;updateText();});
  play.addEventListener("click",function(){phase=0;phaseTarget=0;range.value="0";playing=1;play.textContent="Following…";updateText();});
  unfold.addEventListener("click",function(){phase=4;phaseTarget=4;range.value="4";playing=-1;unfold.textContent="Unfolding…";updateText();});
  stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointer.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);},{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"30% 0px 30% 0px",threshold:.01}).observe(section);
  new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();setSignal(0);setFamily("Coherence");setPhase(4);requestAnimationFrame(render);
})();
