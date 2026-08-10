(function(){
  "use strict";
  var section=document.getElementById("science");
  if(!section||window.__uhNextGen)return;
  window.__uhNextGen=true;
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!document.querySelector('link[data-uh-next-style]')){
    var css=document.createElement("link");css.rel="stylesheet";css.href="assets/css/whats-under-the-hood-next.css?v=1";css.dataset.uhNextStyle="true";document.head.appendChild(css);
  }

  var SIGNALS=[
    {name:"HRV",family:0},{name:"resting HR",family:0},{name:"recovery",family:0},{name:"breathing",family:0},{name:"heart rate",family:0},
    {name:"sleep",family:1},{name:"sleep stages",family:1},{name:"wrist temperature",family:1},{name:"sleep timing",family:1},{name:"daily timing",family:1},
    {name:"VO₂ max",family:2},{name:"blood oxygen",family:2},{name:"temperature",family:2},{name:"recovery load",family:2},{name:"energy",family:2},
    {name:"movement",family:3},{name:"active load",family:3},{name:"resting load",family:3},{name:"activity",family:3},{name:"motion",family:3}
  ];
  var FAMILIES=["Autonomic","Circadian","Metabolic","Mechanical"];
  var OPERATORS=["timing","reserve","capacity","recovery","tolerance","distance"];
  var REPRESENTATIVE=[0,1,5,3,7,11,10,15];
  var OP_BY_FAMILY=[[0,1,3],[0,2,5],[1,2,4],[2,4,5]];
  var PHASE_NAMES=["Measurements","Relationships","Structure","Position"];
  var PHASE_COPY=[
    "The reading begins with measured signals. Each remains identifiable before interpretation begins.",
    "Signals keep their own meaning while the mathematics reads how they move together through time.",
    "Those relationships are constrained into a bounded formal structure rather than collapsed into an arbitrary score.",
    "The structure resolves into one current position — with the path back to the measurements still attached."
  ];

  section.className="uh2";
  section.innerHTML=`
    <div class="uh2__shell">
      <header class="uh2__head">
        <p class="eyebrow">What's under the hood</p>
        <h2 class="h-section" id="uh-heading">A state grounded in measurement.</h2>
        <p class="lede">Membrane Health begins with authorized measurements and carries them through explicit mathematics that has been machine-checked for the properties it claims<sup class="fn">*</sup>. Those measurements enter defined relationships, those relationships form structure, and that structure resolves into a physiological state whose position can be followed through time.</p>
        <p class="lede serif-italic">The definition gives that position its structure, your physiology gives it scale, and your history gives it context.</p>
        <p class="subtle uh2__validation"><em>Formal verification</em> establishes the integrity of the mathematics, while <em>physiological validation</em> establishes how the resulting measurements behave in people. Human testing continues as the measurement develops and its empirical history grows.</p>
      </header>

      <div class="uh2__instrument">
        <div class="uh2__phasebar" role="group" aria-label="Trace the reading through its four stages">
          ${PHASE_NAMES.map(function(n,i){return `<button class="uh2-phase" type="button" data-phase="${i}" aria-pressed="${i===3}"><span>0${i+1}</span><strong>${n}</strong></button>`;}).join("")}
        </div>

        <div class="uh2__stage">
          <canvas class="uh2__canvas" aria-hidden="true"></canvas>
          <div class="uh2__stage-copy">
            <p class="uh2__stage-kicker">Traceable reading</p>
            <h3 id="uh2-phase-name">Position</h3>
            <p id="uh2-phase-copy">${PHASE_COPY[3]}</p>
          </div>
          <div class="uh2__lineage" aria-live="polite"><span>Tracing</span><strong id="uh2-lineage">HRV → Autonomic → timing / reserve / recovery → current position</strong></div>
          <div class="uh2__motion" aria-live="polite"><span class="uh2__motion-dot"></span><span id="uh2-motion">position resolved · provenance retained</span></div>
        </div>

        <div class="uh2__trace">
          <div class="uh2__trace-head"><span>Open the reading</span><span>follow it in either direction</span></div>
          <input id="uh2-range" class="uh2__range" type="range" min="0" max="3" step="0.01" value="3" aria-label="Trace the reading from measurements through relationships and structure into the final position">
          <div class="uh2__trace-labels" aria-hidden="true"><span>measurements</span><span>relationships</span><span>structure</span><span>position</span></div>
          <div class="uh2__actions"><button id="uh2-play" type="button">Trace from measurements →</button><button id="uh2-unfold" type="button">Unfold the position ←</button></div>
        </div>
      </div>

      <div class="uh2__sources">
        <p class="uh2__sources-label">Trace one input through the entire reading</p>
        <div class="uh2__source-buttons" role="group" aria-label="Choose a measurement to trace">
          ${REPRESENTATIVE.map(function(idx,j){return `<button class="uh2-source" type="button" data-signal="${idx}" aria-pressed="${j===0}">${SIGNALS[idx].name}</button>`;}).join("")}
        </div>
      </div>

      <div class="uh2__evidence">
        <article class="uh2-evidence" data-evidence="signals">
          <p class="feature__kicker">Real signals</p><h3 class="h-card">Measured directly</h3>
          <p class="subtle">Membrane Health brings together measurements your Apple&nbsp;Watch already records through Apple&nbsp;Health, including heart-rate variability, resting heart rate, recovery, VO₂ max, sleep stages, breathing rate, wrist temperature, blood oxygen, and movement.</p>
          <p class="subtle">Each signal keeps its own meaning while entering relationship with the others across autonomic, circadian, metabolic, and mechanical physiology. Your 28-day history gives those relationships a personal scale, allowing them to contribute to today's position within a formal definition of health.</p>
          <div class="sci__chips"><span class="chip">Autonomic</span><span class="chip">Circadian</span><span class="chip">Metabolic</span><span class="chip">Mechanical</span></div>
        </article>
        <article class="uh2-evidence" data-evidence="math">
          <p class="feature__kicker">Explicit math</p><h3 class="h-card">A reading you can trace</h3>
          <p class="subtle">Named and inspectable formulas carry your measurements into relationships such as recovery energy, tolerance bands, timing, reserve, capacity, and distance to boundary.</p>
          <p class="subtle">Because the path remains attached to the reading, the position can always be followed back through the relationships and measurements that formed it.</p>
        </article>
        <article class="uh2-evidence" data-evidence="proof">
          <p class="feature__kicker">Formally proven</p><h3 class="h-card">Machine-checked in Lean</h3>
          <p class="subtle">The formal core is carried end to end in proof. More than <span data-attest="theorems-plain">15,000</span> theorems and lemmas establish the properties the mathematics claims, with the proof corpus open to inspection and independent verification.</p>
          <p class="subtle">Within that formal system, one of those results states that as strain is transformed into recovery, the health state rises. The proof belongs to the mathematics, and the physiological measurement gives that mathematics a place to meet the living body.</p>
        </article>
      </div>

      <div class="sci-stats uh2__stats">
        <div class="sci-stat"><span class="sci-stat__n" data-attest="lines">560K+</span><span class="sci-stat__l">lines of machine-checked proof</span></div>
        <div class="sci-stat"><span class="sci-stat__n" data-attest="theorems">15,000+</span><span class="sci-stat__l">theorems &amp; lemmas</span></div>
        <div class="sci-stat"><span class="sci-stat__n">20</span><span class="sci-stat__l">signals read</span></div>
        <div class="sci-stat"><span class="sci-stat__n">100%</span><span class="sci-stat__l">traceable readings</span></div>
      </div>
      <p class="sci-more uh2__more">Want to go deeper? The whole picture — from the human idea to the mathematics to the proof — <a href="science.html">The science of Membrane&nbsp;Health&nbsp;→</a></p>
      <p class="sci-footnote"><span class="fn">*</span> <em>Formally proven</em> is not a statement of physiological truth or a disease diagnosis. What it does mean: our formal mathematical ontology of health stays stable, structured, auditable, and fully transparent — which is exactly what makes it reliable.</p>
    </div>`;

  var stage=section.querySelector(".uh2__stage"),canvas=section.querySelector(".uh2__canvas"),ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  var range=document.getElementById("uh2-range"),phaseName=document.getElementById("uh2-phase-name"),phaseCopy=document.getElementById("uh2-phase-copy"),lineage=document.getElementById("uh2-lineage"),motion=document.getElementById("uh2-motion"),play=document.getElementById("uh2-play"),unfold=document.getElementById("uh2-unfold");
  var W=1,H=1,D=1,last=performance.now(),clock=0,visible=true,themeDirty=true,phase=3,phaseTarget=3,selected=0,playing=0;
  var pal={},pointer={x:0,y:0,tx:0,ty:0};
  var sources=SIGNALS.map(function(s,i){return{phase:((i*47)%97)/97*Math.PI*2,amp:.35+((i*37)%97)/97*.65,speed:.6+((i*29)%83)/83*.8};});

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function rgba(hex,a){var h=String(hex||"").trim();if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];if(/^#[0-9a-f]{6}$/i.test(h)){var n=parseInt(h.slice(1),16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}return h;}
  function palette(){var cs=getComputedStyle(root);pal.glow=cs.getPropertyValue("--glow").trim()||"#ECC77E";pal.soft=cs.getPropertyValue("--glow-soft").trim()||"#F2DCAB";pal.aqua=cs.getPropertyValue("--aqua").trim()||"#66E0ED";pal.go=cs.getPropertyValue("--status-go").trim()||"#8FB06A";pal.ease=cs.getPropertyValue("--status-ease").trim()||"#E3A63F";pal.recover=cs.getPropertyValue("--status-recover").trim()||"#CB6149";themeDirty=false;}
  function resize(){var r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);D=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(D,0,0,D,0,0);}
  function dot(x,y,r,c,a){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=rgba(c,a);ctx.fill();}
  function glow(x,y,r,c,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.35,rgba(c,a*.28));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function line(a,b,c,alpha,w,dash){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function curve(a,b,bend,c,alpha,w){var dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,c1={x:lerp(a.x,b.x,.33)+nx*bend,y:lerp(a.y,b.y,.33)+ny*bend},c2={x:lerp(a.x,b.x,.67)+nx*bend,y:lerp(a.y,b.y,.67)+ny*bend};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,b.x,b.y);ctx.strokeStyle=rgba(c,alpha);ctx.lineWidth=w||1;ctx.stroke();return[c1,c2];}
  function pulseCurve(a,b,bend,u,c,alpha,r){var cs=curve(a,b,bend,c,alpha*.18,.6),c1=cs[0],c2=cs[1],v=1-u,uu=u*u,vv=v*v,p={x:vv*v*a.x+3*vv*u*c1.x+3*v*uu*c2.x+uu*u*b.x,y:vv*v*a.y+3*vv*u*c1.y+3*v*uu*c2.y+uu*u*b.y};glow(p.x,p.y,(r||1.5)*6,c,alpha*.12);dot(p.x,p.y,r||1.5,c,alpha);}

  function geom(){var famX=W*.31,relX=W*.50,structX=W*.70,stateX=W*.84,centerY=H*.50,R=Math.min(W,H)*.19;var famYs=[H*.22,H*.405,H*.595,H*.78];var ops=OPERATORS.map(function(_,i){var a=-Math.PI/2+i/6*Math.PI*2;return{x:structX+Math.cos(a)*R*.78,y:centerY+Math.sin(a)*R*.60};});return{famX:famX,relX:relX,structX:structX,stateX:stateX,centerY:centerY,R:R,famYs:famYs,ops:ops};}
  function sourcePoint(i){var col=i<10?0:1,row=i%10;return{x:W*(.055+col*.075),y:H*(.12+row/9*.76)};}
  function familyPoint(i){var g=geom();return{x:g.famX,y:g.famYs[i]};}
  function selectedPath(){var sig=SIGNALS[selected],fam=sig.family,ops=OP_BY_FAMILY[fam];return{fam:fam,ops:ops};}

  function drawBackground(){var focus=smooth(phase/3);for(var i=0;i<9;i++){var x=W*(.08+i*.11);line({x:x,y:H*.10},{x:x,y:H*.90},i%2?pal.aqua:pal.glow,.012*(1-focus*.5),.5,[2,16]);}line({x:W*.04,y:H*.50},{x:W*.94,y:H*.50},pal.glow,.025,.6,[3,13]);}
  function drawSources(){var show=1-.18*smooth((phase-.4)/1.2);SIGNALS.forEach(function(s,i){var p=sourcePoint(i),f=familyPoint(s.family),isSel=i===selected,c=isSel?pal.glow:(i%5===0?pal.aqua:pal.soft),alpha=(isSel?.92:.16)*show;var wob=Math.sin(clock*.0012*sources[i].speed+sources[i].phase)*6*sources[i].amp;dot(p.x,p.y+wob,isSel?3.4:1.5,c,alpha);if(isSel)glow(p.x,p.y+wob,25,c,.08);curve({x:p.x+5,y:p.y+wob},f,(s.family-1.5)*11+(i%3-1)*6,c,isSel?.38:.035,isSel?1.3:.65);var u=(clock*.00012*sources[i].speed+i*.071)%1;pulseCurve({x:p.x+5,y:p.y+wob},f,(s.family-1.5)*11+(i%3-1)*6,u,c,isSel?.75:.16,isSel?2:1);if(i<8||isSel){ctx.font=(isSel?"500 ":"400 ")+"10px ui-sans-serif,system-ui";ctx.fillStyle=rgba(c,isSel?.88:.28);ctx.textAlign="left";ctx.fillText(s.name,p.x+9,p.y+wob-7);}});}
  function drawFamilies(){var sel=selectedPath(),relStrength=smooth((phase-.45)/.8);FAMILIES.forEach(function(name,i){var p=familyPoint(i),isSel=i===sel.fam,c=i%2?pal.aqua:pal.glow,r=16+(isSel?6:0)+Math.sin(clock*.0007+i)*2;glow(p.x,p.y,r*2,c,.025+.04*relStrength*(isSel?1.5:1));ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(c,(isSel?.48:.12)*(.45+.55*relStrength));ctx.lineWidth=isSel?1.5:.9;ctx.stroke();dot(p.x,p.y,2.3,c,isSel?.9:.4);ctx.font=(isSel?"500 ":"400 ")+"11px ui-sans-serif,system-ui";ctx.fillStyle=rgba(c,isSel?.88:.42);ctx.textAlign="center";ctx.fillText(name,p.x,p.y+r+18);for(var q=0;q<5;q++){var a=clock*.00025+i*.7+q*1.256,rr=r*(.35+.12*q);dot(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,q===0?1.6:.85,c,.18+.18*relStrength);}});}
  function drawRelations(){var strength=smooth((phase-.65)/.85),sel=selectedPath(),pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];pairs.forEach(function(pr,i){var a=familyPoint(pr[0]),b=familyPoint(pr[1]),selectedRel=pr.indexOf(sel.fam)>=0,c=i%3===0?pal.aqua:pal.glow,bend=(i%2?1:-1)*(22+i*3);curve(a,b,bend,c,(selectedRel?.15:.035)*strength,selectedRel?1.1:.7);if(strength>.25)pulseCurve(a,b,bend,(clock*.00008+i*.14)%1,c,(selectedRel?.65:.20)*strength,selectedRel?1.7:1);});var g=geom();OP_BY_FAMILY.forEach(function(ops,fam){ops.forEach(function(op,j){var a=familyPoint(fam),b=g.ops[op],isSel=fam===sel.fam&&sel.ops.indexOf(op)>=0,c=op%2?pal.aqua:pal.glow;curve(a,b,(fam-1.5)*10+(j-1)*8,c,(isSel?.22:.028)*strength,isSel?1.25:.6);if(isSel&&strength>.3)pulseCurve(a,b,(fam-1.5)*10+(j-1)*8,(clock*.00010+j*.19)%1,c,.72*strength,1.8);});});}
  function drawOperators(){var g=geom(),strength=smooth((phase-1.15)/.9),sel=selectedPath();g.ops.forEach(function(p,i){var isSel=sel.ops.indexOf(i)>=0,c=i%2?pal.aqua:pal.glow,r=8+(isSel?3:0);glow(p.x,p.y,r*2,c,.02*strength*(isSel?2:1));ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.strokeStyle=rgba(c,(isSel?.42:.10)*strength);ctx.lineWidth=isSel?1.35:.8;ctx.stroke();dot(p.x,p.y,1.7,c,(isSel?.8:.3)*strength);ctx.font=(isSel?"500 ":"400 ")+"9px ui-sans-serif,system-ui";ctx.fillStyle=rgba(c,(isSel?.84:.30)*strength);ctx.textAlign="center";ctx.fillText(OPERATORS[i],p.x,p.y+r+13);});}
  function drawStructure(){var g=geom(),strength=smooth((phase-1.55)/.85),sel=selectedPath(),cx=g.structX,cy=g.centerY,R=g.R;ctx.beginPath();for(var i=0;i<=120;i++){var a=i/120*Math.PI*2,rr=R*(1+.025*Math.sin(a*3+clock*.00025)+.014*Math.sin(a*7-clock*.00016));var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.78;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.strokeStyle=rgba(pal.glow,.26*strength);ctx.lineWidth=1.3;ctx.stroke();for(var r=1;r<=4;r++){ctx.beginPath();ctx.ellipse(cx,cy,R*(.34+r*.13),R*(.25+r*.10),0,0,Math.PI*2);ctx.strokeStyle=rgba(r%2?pal.aqua:pal.glow,(.018+.022*r)*strength);ctx.lineWidth=.7;ctx.stroke();}g.ops.forEach(function(p,i){var to={x:cx+Math.cos(-Math.PI/2+i/6*Math.PI*2)*R*.40,y:cy+Math.sin(-Math.PI/2+i/6*Math.PI*2)*R*.31},isSel=sel.ops.indexOf(i)>=0,c=i%2?pal.aqua:pal.glow;curve(p,to,(i%2?1:-1)*8,c,(isSel?.28:.045)*strength,isSel?1.15:.65);if(isSel)pulseCurve(p,to,(i%2?1:-1)*8,(clock*.00011+i*.12)%1,c,.72*strength,1.6);});if(strength>.35){for(var n=0;n<18;n++){var a=n/18*Math.PI*2+clock*.00004,rr=R*(.18+.26*((n*31)%97)/97),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.75;dot(x,y,n%5===0?1.8:.8,n%4===0?pal.aqua:pal.glow,.12*strength);}}}
  function drawPosition(){var g=geom(),strength=smooth((phase-2.25)/.75),cx=g.structX,cy=g.centerY,R=g.R,pos={x:cx+R*.18,y:cy-R*.08};glow(pos.x,pos.y,56,pal.glow,.11*strength);ctx.beginPath();ctx.arc(pos.x,pos.y,13,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,.42*strength);ctx.lineWidth=1.25;ctx.stroke();dot(pos.x,pos.y,4.2,pal.glow,.92*strength);if(strength>.02){var state={x:g.stateX,y:g.centerY};curve(pos,state,-22,pal.glow,.22*strength,1.2);pulseCurve(pos,state,-22,(clock*.00009)%1,pal.glow,.72*strength,1.8);glow(state.x,state.y,48,pal.glow,.08*strength);ctx.beginPath();ctx.arc(state.x,state.y,10,0,Math.PI*2);ctx.strokeStyle=rgba(pal.glow,.38*strength);ctx.lineWidth=1.2;ctx.stroke();dot(state.x,state.y,3.5,pal.glow,.9*strength);ctx.font="500 10px ui-sans-serif,system-ui";ctx.fillStyle=rgba(pal.glow,.72*strength);ctx.textAlign="center";ctx.fillText("current position",state.x,state.y+28);}}

  function updateText(){var idx=Math.round(phaseTarget);phaseName.textContent=PHASE_NAMES[idx];phaseCopy.textContent=PHASE_COPY[idx];section.querySelectorAll(".uh2-phase").forEach(function(b){b.setAttribute("aria-pressed",+b.dataset.phase===idx?"true":"false");});var sig=SIGNALS[selected],ops=OP_BY_FAMILY[sig.family].map(function(i){return OPERATORS[i];}).join(" / ");lineage.textContent=sig.name+" → "+FAMILIES[sig.family]+" → "+ops+" → current position";motion.textContent=idx===0?"measurements arriving · identity retained":idx===1?"relationships forming · signals remain distinct":idx===2?"formal structure assembling · provenance attached":"position resolved · provenance retained";}
  function setPhase(v){phaseTarget=clamp(v,0,3);range.value=phaseTarget.toFixed(2);updateText();}
  function setSignal(idx){selected=idx;section.querySelectorAll(".uh2-source").forEach(function(b){b.setAttribute("aria-pressed",+b.dataset.signal===selected?"true":"false");});updateText();}

  function render(now){var dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!reduce)clock+=dt*1000;pointer.x=lerp(pointer.x,pointer.tx,.055);pointer.y=lerp(pointer.y,pointer.ty,.055);if(themeDirty)palette();if(playing){if(playing>0){phaseTarget+=dt*.34;if(phaseTarget>=3){phaseTarget=3;playing=0;play.textContent="Trace from measurements →";}}else{phaseTarget-=dt*.34;if(phaseTarget<=0){phaseTarget=0;playing=0;unfold.textContent="Unfold the position ←";}}range.value=phaseTarget.toFixed(2);updateText();}phase=lerp(phase,phaseTarget,.065);if(!visible){requestAnimationFrame(render);return;}ctx.clearRect(0,0,W,H);drawBackground();drawSources();drawFamilies();drawRelations();drawOperators();drawStructure();drawPosition();requestAnimationFrame(render);}

  section.querySelectorAll(".uh2-phase").forEach(function(b){b.addEventListener("click",function(){playing=0;setPhase(+b.dataset.phase);});});
  section.querySelectorAll(".uh2-source").forEach(function(b){b.addEventListener("click",function(){setSignal(+b.dataset.signal);});});
  range.addEventListener("input",function(){playing=0;phaseTarget=+range.value;updateText();});
  play.addEventListener("click",function(){phaseTarget=0;range.value="0";phase=0;playing=1;play.textContent="Tracing…";updateText();});
  unfold.addEventListener("click",function(){phaseTarget=3;range.value="3";phase=3;playing=-1;unfold.textContent="Unfolding…";updateText();});
  stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();pointer.tx=(e.clientX-r.left)/r.width*2-1;pointer.ty=(e.clientY-r.top)/r.height*2-1;},{passive:true});
  stage.addEventListener("pointerleave",function(){pointer.tx=0;pointer.ty=0;},{passive:true});
  new ResizeObserver(resize).observe(stage);new IntersectionObserver(function(es){es.forEach(function(e){visible=e.isIntersecting;});},{rootMargin:"30% 0px 30% 0px",threshold:.01}).observe(section);new MutationObserver(function(){themeDirty=true;}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  palette();resize();setSignal(0);setPhase(3);requestAnimationFrame(render);
})();