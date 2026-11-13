/* Why membrane — extracted from the standalone reference. */
(function () {
  "use strict";


  /* ==========================================================================
     WHY MEMBRANE?

     One continuous camera movement:

       0.00  surroundings
       0.50  membrane / exchange
       1.00  interior

     We never swap scenes.

     Instead, the system grows around the observer until the observer effectively
     crosses its edge.

     This is an experiential model, not a physical membrane simulation.
     ========================================================================== */


  /* ==========================================================================
     CONSTANTS
     ========================================================================== */

  var NS = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;

  var VIEW = 700;

  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* ==========================================================================
     DOM
     ========================================================================== */

  var host =
    document.querySelector(
      ".idea-exp"
    );


  var svg =
    document.getElementById(
      "we-field"
    );


  var slider =
    document.getElementById(
      "we-range"
    );


  var moment =
    document.getElementById(
      "we-moment"
    );


  var replay =
    document.getElementById(
      "we-replay"
    );


  var canvas =
    document.getElementById(
      "idea-exp-canvas"
    );


  var ctx =
    canvas &&
    canvas.getContext
      ? canvas.getContext("2d")
      : null;


  if (!svg || !slider) return;


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  function el(name, attrs) {

    var node =
      document.createElementNS(
        NS,
        name
      );


    Object.keys(attrs || {})
      .forEach(function (key) {

        node.setAttribute(
          key,
          attrs[key]
        );
      });


    return node;
  }


  function clamp(v, lo, hi) {

    return Math.max(
      lo,
      Math.min(hi, v)
    );
  }


  function lerp(a, b, t) {

    return a +
      (
        b -
        a
      ) *
      t;
  }


  function smoothstep(t) {

    t =
      clamp(
        t,
        0,
        1
      );


    return (
      t *
      t *
      (
        3 -
        2 *
        t
      )
    );
  }


  function smootherstep(t) {

    t =
      clamp(
        t,
        0,
        1
      );


    return (
      t *
      t *
      t *
      (
        t *
        (
          t *
          6 -
          15
        ) +
        10
      )
    );
  }


  function easeInOutCubic(t) {

    return t < .5
      ?
        4 *
        t *
        t *
        t
      :
        1 -
        Math.pow(
          -2 *
          t +
          2,
          3
        ) /
        2;
  }


  function polar(
    cx,
    cy,
    radius,
    angle
  ) {

    return {
      x:
        cx +
        Math.cos(angle) *
        radius,

      y:
        cy +
        Math.sin(angle) *
        radius
    };
  }


  function hash(n) {

    var x =
      Math.sin(
        n *
        127.1
      ) *
      43758.5453123;


    return (
      x -
      Math.floor(x)
    );
  }


  /* ==========================================================================
     CAMERA / GEOMETRY

     Rather than scaling an illustration, we change the apparent size and
     location of the living system itself.

     progress 0:
       complete system visible

     progress .5:
       boundary grows enormous and crosses the visual field

     progress 1:
       observer is inside; only a distant arc of the boundary remains
     ========================================================================== */

  function geometry(progress) {

    var p =
      smootherstep(
        progress
      );


    return {

      cx:
        lerp(
          350,
          -245,
          p
        ),

      cy:
        lerp(
          350,
          370,
          p
        ),

      radius:
        lerp(
          220,
          940,
          p
        )
    };
  }


  /* ==========================================================================
     DEFS
     ========================================================================== */

  var defs =
    el("defs");


  var edgeGradient =
    el(
      "linearGradient",
      {
        id: "we-edge-gradient",
        x1: "0%",
        y1: "100%",
        x2: "100%",
        y2: "0%"
      }
    );


  [
    ["0%",   "var(--glow)"],
    ["46%",  "var(--glow-soft)"],
    ["73%",  "var(--aqua)"],
    ["100%", "var(--aqua)"]
  ]
  .forEach(function (stop) {

    edgeGradient.appendChild(
      el(
        "stop",
        {
          offset:
            stop[0],

          "stop-color":
            stop[1]
        }
      )
    );
  });


  var interiorGradient =
    el(
      "radialGradient",
      {
        id: "we-interior-gradient",
        cx: "64%",
        cy: "42%",
        r: "78%"
      }
    );


  [
    ["0%",   "var(--aqua-deep)", ".19"],
    ["42%",  "var(--aqua-deep)", ".075"],
    ["76%",  "var(--glow)",      ".028"],
    ["100%", "var(--glow)",      ".004"]
  ]
  .forEach(function (stop) {

    interiorGradient.appendChild(
      el(
        "stop",
        {
          offset:
            stop[0],

          "stop-color":
            stop[1],

          "stop-opacity":
            stop[2]
        }
      )
    );
  });


  var clip =
    el(
      "clipPath",
      {
        id: "we-interior-clip"
      }
    );


  var clipCircle =
    el(
      "circle",
      {
        id: "we-clip-circle"
      }
    );


  clip.appendChild(
    clipCircle
  );


  defs.appendChild(
    edgeGradient
  );


  defs.appendChild(
    interiorGradient
  );


  defs.appendChild(
    clip
  );


  svg.appendChild(
    defs
  );


  /* ==========================================================================
     LAYERS
     ========================================================================== */

  var reference =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-reference"
        }
      )
    );


  var referenceGlow =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-reference-glow"
        }
      )
    );


  var interiorGroup =
    svg.appendChild(
      el(
        "g",
        {
          "clip-path":
            "url(#we-interior-clip)"
        }
      )
    );


  var interiorFill =
    interiorGroup.appendChild(
      el(
        "circle",
        {
          class:
            "we-membrane-fill",

          fill:
            "url(#we-interior-gradient)"
        }
      )
    );


  var threads =
    interiorGroup.appendChild(
      el("g")
    );


  var contours =
    interiorGroup.appendChild(
      el("g")
    );


  var interiorNodes =
    interiorGroup.appendChild(
      el("g")
    );


  var shellBloom =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-shell-bloom"
        }
      )
    );


  var shellDeep =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-shell-deep"
        }
      )
    );


  var shellMid =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-shell-mid"
        }
      )
    );


  var shellEdge =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-shell-edge"
        }
      )
    );


  var shellBeads =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-shell-beads"
        }
      )
    );


  var gateWaves =
    svg.appendChild(
      el("g")
    );


  var gateHalo =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-gate-halo"
        }
      )
    );


  var gateRing =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-gate-ring"
        }
      )
    );


  var gateCore =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "we-gate-core"
        }
      )
    );


  /* labels */
  var surroundingsLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "we-label",
          "text-anchor":
            "middle"
        }
      )
    );

  surroundingsLabel.textContent =
    "surroundings";


  var exchangeLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "we-label we-label--gold",
          "text-anchor":
            "middle"
        }
      )
    );

  exchangeLabel.textContent =
    "exchange";


  var interiorLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "we-label we-label--aqua",
          "text-anchor":
            "middle"
        }
      )
    );

  interiorLabel.textContent =
    "interior";


  /* ==========================================================================
     INTERIOR OBJECTS
     ========================================================================== */

  var THREAD_COUNT =
    34;


  var CONTOUR_COUNT =
    26;


  var NODE_COUNT =
    42;


  var GATE_WAVE_COUNT =
    7;


  for (
    var t = 0;
    t < THREAD_COUNT;
    t++
  ) {

    threads.appendChild(
      el(
        "path",
        {
          class:
            "we-thread"
        }
      )
    );
  }


  for (
    var c = 0;
    c < CONTOUR_COUNT;
    c++
  ) {

    contours.appendChild(
      el(
        "circle",
        {
          class:
            "we-contour",

          stroke:
            c > 18
              ?
                "var(--glow)"
              :
                "var(--aqua)"
        }
      )
    );
  }


  for (
    var n = 0;
    n < NODE_COUNT;
    n++
  ) {

    interiorNodes.appendChild(
      el(
        "circle",
        {
          class:
            "we-interior-node" +
            (
              n % 9 === 0
                ?
                  " we-interior-node--warm"
                :
                  ""
            ),

          r:
            (
              1.4 +
              hash(
                n *
                7 +
                3
              ) *
              2.2
            ).toFixed(2)
        }
      )
    );
  }


  for (
    var gw = 0;
    gw < GATE_WAVE_COUNT;
    gw++
  ) {

    gateWaves.appendChild(
      el(
        "circle",
        {
          class:
            "we-gate-wave"
        }
      )
    );
  }


  /* ==========================================================================
     CURRENT PROGRESS
     ========================================================================== */


  /* ==========================================================================
     INTERIOR SYSTEMS

     The interior is not empty space with drifting motes. It is populated by
     smaller systems, each with its own membrane, its own interior, and its own
     gradient of exchange across its own edge — the same principle, one scale
     down. They are held in relation by tension rather than by attachment: pull
     on one and the others answer. That is what keeps the whole thing a shape
     instead of a pile.
     ========================================================================== */

  var CELLS = (function () {

    var out = [], i, ring, idx, count, r, a;

    /* three shells so the interior has depth rather than one flat ring */
    var SHELLS = [
      { r: .00, n: 1  },
      { r: .34, n: 5  },
      { r: .62, n: 7  }
    ];

    for (ring = 0; ring < SHELLS.length; ring++) {

      count = SHELLS[ring].n;

      for (idx = 0; idx < count; idx++) {

        r = SHELLS[ring].r + (hash(ring * 31 + idx * 7) - .5) * .07;
        a = (idx / count) * TAU + ring * .7 + hash(ring * 13 + idx) * .3;

        out.push({
          rest: { x: Math.cos(a) * r, y: Math.sin(a) * r },
          size: .052 + hash(ring * 17 + idx * 3) * .034,
          /* each system keeps its own rhythm */
          rate: .00042 + hash(ring * 23 + idx * 5) * .00058,
          phase: hash(ring * 41 + idx * 11) * TAU,
          /* and its own direction of exchange at this moment */
          outward: hash(ring * 53 + idx * 19) > .5,
          warm: hash(ring * 61 + idx * 13) > .58
        });
      }
    }

    return out;
  })();

  /* Tension only between neighbours — a web, not a mesh. */
  var LINKS = (function () {

    var out = [], i, j, dx, dy, d;

    for (i = 0; i < CELLS.length; i++) {
      for (j = i + 1; j < CELLS.length; j++) {

        dx = CELLS[i].rest.x - CELLS[j].rest.x;
        dy = CELLS[i].rest.y - CELLS[j].rest.y;
        d = Math.sqrt(dx * dx + dy * dy);

        if (d < .62) out.push({ a: i, b: j, rest: d });
      }
    }

    return out;
  })();

  /* Activation travels the web: one system lights, its neighbours answer. */
  var activation = CELLS.map(function () { return 0; });
  var nextPulse = 0;
  var pulseIndex = 0;

  /* filled each frame by the interior pass, read by the exchange pass */
  var liveCells = null;

  var current =
    0;


  var target =
    0;


  /* ==========================================================================
     SVG DRAW
     ========================================================================== */

  function drawSVG(now) {

    var geom =
      geometry(
        current
      );


    var cx =
      geom.cx;


    var cy =
      geom.cy;


    var radius =
      geom.radius;


    var breath =
      reduce
        ?
          1
        :
          1 +
          Math.sin(
            now /
            11000 *
            TAU
          ) *
          .004;


    radius *=
      breath;


    /* ----------------------------------------------------------------------
       Core geometry
       ---------------------------------------------------------------------- */

    [
      reference,
      referenceGlow,
      interiorFill,
      shellBloom,
      shellDeep,
      shellMid,
      shellEdge,
      shellBeads,
      clipCircle
    ]
    .forEach(
      function (circle) {

        circle.setAttribute(
          "cx",
          cx.toFixed(1)
        );


        circle.setAttribute(
          "cy",
          cy.toFixed(1)
        );
      }
    );


    reference.setAttribute(
      "r",
      (
        radius *
        1.045
      ).toFixed(1)
    );


    referenceGlow.setAttribute(
      "r",
      (
        radius *
        1.045
      ).toFixed(1)
    );


    interiorFill.setAttribute(
      "r",
      radius.toFixed(1)
    );


    clipCircle.setAttribute(
      "r",
      radius.toFixed(1)
    );


    shellBloom.setAttribute(
      "r",
      radius.toFixed(1)
    );


    shellDeep.setAttribute(
      "r",
      (
        radius -
        Math.max(
          5,
          radius *
          .010
        )
      ).toFixed(1)
    );


    shellMid.setAttribute(
      "r",
      radius.toFixed(1)
    );


    shellEdge.setAttribute(
      "r",
      (
        radius +
        1.5
      ).toFixed(1)
    );


    shellBeads.setAttribute(
      "r",
      (
        radius +
        4
      ).toFixed(1)
    );


    /*
     * Boundary becomes more luminous as the observer approaches it.
     */
    var edgeProximity =
      1 -
      Math.abs(
        current -
        .5
      ) /
      .5;


    edgeProximity =
      clamp(
        edgeProximity,
        0,
        1
      );


    shellBloom.style.opacity =
      (
        .07 +
        edgeProximity *
        .20
      ).toFixed(3);


    shellDeep.style.opacity =
      (
        .13 +
        edgeProximity *
        .18
      ).toFixed(3);


    shellMid.style.opacity =
      (
        .40 +
        edgeProximity *
        .38
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       GATE

       One region becomes especially legible during the crossing.
       It is a visual expression of exchange, not a literal anatomical pore.
       ---------------------------------------------------------------------- */

    var gateAngle =
      -.16;


    var gate =
      polar(
        cx,
        cy,
        radius,
        gateAngle
      );


    gateHalo.setAttribute(
      "cx",
      gate.x.toFixed(1)
    );


    gateHalo.setAttribute(
      "cy",
      gate.y.toFixed(1)
    );


    gateHalo.setAttribute(
      "r",
      (
        18 +
        edgeProximity *
        38
      ).toFixed(1)
    );


    gateHalo.style.opacity =
      (
        .04 +
        edgeProximity *
        .23
      ).toFixed(3);


    gateRing.setAttribute(
      "cx",
      gate.x.toFixed(1)
    );


    gateRing.setAttribute(
      "cy",
      gate.y.toFixed(1)
    );


    gateRing.setAttribute(
      "r",
      (
        8 +
        edgeProximity *
        8
      ).toFixed(1)
    );


    gateRing.style.opacity =
      (
        .18 +
        edgeProximity *
        .66
      ).toFixed(3);


    gateCore.setAttribute(
      "cx",
      gate.x.toFixed(1)
    );


    gateCore.setAttribute(
      "cy",
      gate.y.toFixed(1)
    );


    gateCore.setAttribute(
      "r",
      (
        1.7 +
        edgeProximity *
        2.4
      ).toFixed(1)
    );


    gateCore.style.opacity =
      (
        .22 +
        edgeProximity *
        .78
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       Gate waves
       ---------------------------------------------------------------------- */

    var waveNodes =
      gateWaves.childNodes;


    for (
      var w = 0;
      w < waveNodes.length;
      w++
    ) {

      var wavePhase =
        reduce
          ?
            .5
          :
            (
              now /
              2300 +
              w /
              waveNodes.length
            ) %
            1;


      var waveRadius =
        9 +
        wavePhase *
        (
          44 +
          edgeProximity *
          24
        );


      waveNodes[w]
        .setAttribute(
          "cx",
          gate.x.toFixed(1)
        );


      waveNodes[w]
        .setAttribute(
          "cy",
          gate.y.toFixed(1)
        );


      waveNodes[w]
        .setAttribute(
          "r",
          waveRadius.toFixed(1)
        );


      waveNodes[w]
        .style.opacity =
        (
          edgeProximity *
          (
            1 -
            wavePhase
          ) *
          .23
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Interior contours

       As the observer crosses inside, these cease to look like nested rings
       and begin to feel like a landscape.
       ---------------------------------------------------------------------- */

    var contourNodes =
      contours.childNodes;


    for (
      var ci = 0;
      ci < contourNodes.length;
      ci++
    ) {

      var cf =
        (
          ci +
          1
        ) /
        contourNodes.length;


      var contourRadius =
        radius *
        (
          .10 +
          cf *
          .82
        );


      var lateral =
        Math.sin(
          ci *
          .74 +
          now *
          .00018
        ) *
        radius *
        .008 *
        (
          .3 +
          current *
          .7
        );


      var vertical =
        Math.cos(
          ci *
          .53 -
          now *
          .00015
        ) *
        radius *
        .006;


      contourNodes[ci]
        .setAttribute(
          "cx",
          (
            cx +
            lateral
          ).toFixed(1)
        );


      contourNodes[ci]
        .setAttribute(
          "cy",
          (
            cy +
            vertical
          ).toFixed(1)
        );


      contourNodes[ci]
        .setAttribute(
          "r",
          contourRadius.toFixed(1)
        );


      contourNodes[ci]
        .style.opacity =
        (
          .025 +
          current *
          .12 *
          (
            1 -
            cf *
            .55
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Interior threads

       The deeper we go, the more relationship becomes visible.
       ---------------------------------------------------------------------- */

    var threadNodes =
      threads.childNodes;


    for (
      var ti = 0;
      ti < threadNodes.length;
      ti++
    ) {

      var startAngle =
        (
          ti /
          threadNodes.length
        ) *
        TAU +
        .6;


      var endAngle =
        startAngle +
        1.35 +
        hash(
          ti *
          17 +
          4
        ) *
        1.35;


      var innerA =
        polar(
          cx,
          cy,
          radius *
          (
            .18 +
            hash(
              ti *
              11 +
              2
            ) *
            .22
          ),
          startAngle
        );


      var outerA =
        polar(
          cx,
          cy,
          radius *
          (
            .62 +
            hash(
              ti *
              13 +
              7
            ) *
            .25
          ),
          endAngle
        );


      var controlAngle =
        (
          startAngle +
          endAngle
        ) /
        2 +
        Math.sin(
          now *
          .00025 +
          ti
        ) *
        .13;


      var control =
        polar(
          cx,
          cy,
          radius *
          (
            .30 +
            hash(
              ti *
              23
            ) *
            .30
          ),
          controlAngle
        );


      threadNodes[ti]
        .setAttribute(
          "d",
          "M" +
          innerA.x.toFixed(1) +
          " " +
          innerA.y.toFixed(1) +
          "Q" +
          control.x.toFixed(1) +
          " " +
          control.y.toFixed(1) +
          "," +
          outerA.x.toFixed(1) +
          " " +
          outerA.y.toFixed(1)
        );


      threadNodes[ti]
        .style.opacity =
        (
          .025 +
          current *
          (
            .07 +
            hash(
              ti *
              5
            ) *
            .09
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Interior nodes
       ---------------------------------------------------------------------- */

    var nodeList =
      interiorNodes.childNodes;


    for (
      var ni = 0;
      ni < nodeList.length;
      ni++
    ) {

      var na =
        hash(
          ni *
          19 +
          2
        ) *
        TAU;


      var nr =
        radius *
        Math.sqrt(
          .05 +
          hash(
            ni *
            29 +
            6
          ) *
          .78
        );


      var drift =
        reduce
          ?
            0
          :
            Math.sin(
              now *
              .00035 +
              ni *
              .78
            ) *
            radius *
            .006;


      var np =
        polar(
          cx,
          cy,
          nr + drift,
          na +
          Math.sin(
            now *
            .00012 +
            ni
          ) *
          .015
        );


      nodeList[ni]
        .setAttribute(
          "cx",
          np.x.toFixed(1)
        );


      nodeList[ni]
        .setAttribute(
          "cy",
          np.y.toFixed(1)
        );


      nodeList[ni]
        .style.opacity =
        (
          .08 +
          current *
          (
            .14 +
            hash(
              ni *
              7
            ) *
            .38
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Labels

       They behave like faint orientation points rather than explanatory UI.
       ---------------------------------------------------------------------- */

    surroundingsLabel.setAttribute(
      "x",
      clamp(
        cx +
        radius +
        72,
        82,
        625
      ).toFixed(1)
    );


    surroundingsLabel.setAttribute(
      "y",
      clamp(
        cy +
        118,
        100,
        610
      ).toFixed(1)
    );


    surroundingsLabel.style.opacity =
      (
        .55 *
        (
          1 -
          smoothstep(
            current /
            .55
          )
        )
      ).toFixed(3);


    exchangeLabel.setAttribute(
      "x",
      clamp(
        gate.x -
        16,
        80,
        620
      ).toFixed(1)
    );


    exchangeLabel.setAttribute(
      "y",
      clamp(
        gate.y -
        38,
        60,
        610
      ).toFixed(1)
    );


    exchangeLabel.style.opacity =
      (
        edgeProximity *
        .82
      ).toFixed(3);


    interiorLabel.setAttribute(
      "x",
      clamp(
        cx +
        radius *
        .56,
        95,
        590
      ).toFixed(1)
    );


    interiorLabel.setAttribute(
      "y",
      clamp(
        cy +
        radius *
        .25,
        90,
        610
      ).toFixed(1)
    );


    interiorLabel.style.opacity =
      (
        smoothstep(
          (
            current -
            .48
          ) /
          .52
        ) *
        .72
      ).toFixed(3);
  }


  /* ==========================================================================
     CANVAS
     ========================================================================== */

  var DPR = 1;
  var canvasW = 0;
  var canvasH = 0;


  var OUTSIDE_PARTICLES = [];
  var INSIDE_PARTICLES = [];
  var EXCHANGE_PARTICLES = [];
  var FLOW_LINES = [];


  function resizeCanvas() {

    if (!ctx) return;


    var rect =
      canvas.getBoundingClientRect();


    DPR =
      Math.min(
        2,
        window.devicePixelRatio || 1
      );


    canvasW =
      Math.max(
        1,
        rect.width
      );


    canvasH =
      Math.max(
        1,
        rect.height
      );


    canvas.width =
      Math.round(
        canvasW *
        DPR
      );


    canvas.height =
      Math.round(
        canvasH *
        DPR
      );


    ctx.setTransform(
      DPR,
      0,
      0,
      DPR,
      0,
      0
    );
  }


  function seedWorld() {

    OUTSIDE_PARTICLES.length = 0;
    INSIDE_PARTICLES.length = 0;
    EXCHANGE_PARTICLES.length = 0;
    FLOW_LINES.length = 0;


    for (
      var i = 0;
      i < 86;
      i++
    ) {

      OUTSIDE_PARTICLES.push({

        x:
          hash(
            i *
            17 +
            2
          ),

        y:
          hash(
            i *
            23 +
            8
          ),

        depth:
          .15 +
          hash(
            i *
            31 +
            4
          ) *
          .85,

        phase:
          hash(
            i *
            13 +
            7
          ) *
          TAU,

        speed:
          .10 +
          hash(
            i *
            29 +
            3
          ) *
          .30
      });
    }


    for (
      var j = 0;
      j < 74;
      j++
    ) {

      INSIDE_PARTICLES.push({

        phaseFall:
          hash(
            i * 37 + 11
          ),


        angle:
          hash(
            j *
            37 +
            2
          ) *
          TAU,

        radius:
          Math.sqrt(
            hash(
              j *
              19 +
              4
            )
          ),

        phase:
          hash(
            j *
            41 +
            9
          ) *
          TAU,

        speed:
          .08 +
          hash(
            j *
            11 +
            5
          ) *
          .24,

        warm:
          hash(
            j *
            7 +
            3
          ) >
          .82
      });
    }


    /*
     * Exchange trajectories repeatedly move through one active boundary region.
     */
    for (
      var e = 0;
      e < 46;
      e++
    ) {

      EXCHANGE_PARTICLES.push({

        phase:
          hash(
            e *
            19 +
            6
          ),

        /*
         * Speed varies widely on purpose. A uniform drift reads as wallpaper;
         * a spread gives the eye something to follow across the boundary.
         */
        speed:
          .014 +
          Math.pow(
            hash(
              e *
              23 +
              4
            ),
            2.1
          ) *
          .115,

        offset:
          (
            hash(
              e *
              31 +
              2
            ) -
            .5
          ) *
          .16,

        size:
          .7 +
          hash(
            e *
            13 +
            8
          ) *
          1.4,

        cross:
          hash(
            e *
            5 +
            11
          ) >
          .18,

        /*
         * Exchange runs both ways. Inward traffic is what the system takes in;
         * outward traffic is what it releases. Neither direction dominates —
         * a membrane that only admitted would not be regulating anything.
         */
        outward:
          hash(
            e *
            17 +
            29
          ) >
          .5,

        /*
         * Exchange is not one pore. Each trajectory crosses at its own place
         * on the boundary, so the whole edge reads as permeable.
         */
        arc:
          (
            hash(
              e *
              41 +
              13
            ) -
            .5
          ) *
          TAU *
          .92,

        /*
         * Some arrivals are destined somewhere. Once through the outer edge
         * they stop drifting and run for a particular interior system.
         */
        seeks:
          hash(
            e *
            71 +
            17
          ) > .38,

        target:
          Math.floor(
            hash(
              e *
              83 +
              29
            ) *
            13
          )
      });
    }


    for (
      var f = 0;
      f < 27;
      f++
    ) {

      FLOW_LINES.push({

        phase:
          hash(
            f *
            13 +
            6
          ) *
          TAU,

        radius:
          .18 +
          hash(
            f *
            29 +
            2
          ) *
          .70,

        speed:
          .05 +
          hash(
            f *
            17 +
            9
          ) *
          .14,

        warm:
          hash(
            f *
            31 +
            5
          ) >
          .78
      });
    }
  }


  function stageMetrics() {

    var stage =
      svg.getBoundingClientRect();


    var canvasRect =
      canvas.getBoundingClientRect();


    return {

      left:
        stage.left -
        canvasRect.left,

      top:
        stage.top -
        canvasRect.top,

      width:
        stage.width,

      height:
        stage.height,

      scale:
        stage.width /
        VIEW
    };
  }


  function logicalToCanvas(
    logical,
    stage
  ) {

    return {

      x:
        stage.left +
        logical.x *
        stage.scale,

      y:
        stage.top +
        logical.y *
        stage.scale
    };
  }


  function drawCanvas(now) {

    if (!ctx) return;


    ctx.clearRect(
      0,
      0,
      canvasW,
      canvasH
    );


    var stage =
      stageMetrics();


    var geom =
      geometry(
        current
      );


    var center =
      logicalToCanvas(
        {
          x: geom.cx,
          y: geom.cy
        },
        stage
      );


    var radius =
      geom.radius *
      stage.scale;


    var gateAngle =
      -.16;


    var gateLogical =
      polar(
        geom.cx,
        geom.cy,
        geom.radius,
        gateAngle
      );


    var gate =
      logicalToCanvas(
        gateLogical,
        stage
      );


    var time =
      now /
      1000;


    /* ======================================================================
       EXTERIOR
       ====================================================================== */

    OUTSIDE_PARTICLES.forEach(
      function (p, index) {

        var x =
          p.x *
          canvasW +
          Math.sin(
            time *
            p.speed +
            p.phase
          ) *
          17 *
          p.depth;


        var y =
          p.y *
          canvasH +
          Math.cos(
            time *
            p.speed *
            .7 +
            p.phase
          ) *
          11 *
          p.depth;


        var dx =
          x -
          center.x;


        var dy =
          y -
          center.y;


        var distance =
          Math.sqrt(
            dx *
            dx +
            dy *
            dy
          );


        /*
         * Exterior dust fades naturally as the observer moves inside.
         */
        var outside =
          smoothstep(
            (
              distance -
              radius *
              .94
            ) /
            Math.max(
              80,
              radius *
              .16
            )
          );


        var viewFade =
          1 -
          smoothstep(
            (
              current -
              .58
            ) /
            .42
          );


        var alpha =
          outside *
          viewFade *
          (
            .025 +
            p.depth *
            .075
          );


        if (
          alpha <
          .002
        ) {
          return;
        }


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          .45 +
          p.depth *
          .85,
          0,
          TAU
        );


        ctx.fillStyle =
          index %
          7 ===
          0
            ?
              "rgba(236,199,126," +
              alpha +
              ")"
            :
              "rgba(243,237,224," +
              alpha +
              ")";


        ctx.fill();
      }
    );



    /* ======================================================================
       INTERIOR WEB — tensegrity of smaller systems

       Drawn before the loose interior particles so the motes read as the
       medium the systems sit in, rather than as competing objects.
       ====================================================================== */

    var webIn = smoothstep((current - .34) / .5);

    if (webIn > .004) {

      /* an activation crosses the web every few seconds */
      if (time * 1000 > nextPulse) {
        pulseIndex = (pulseIndex + 3) % CELLS.length;
        activation[pulseIndex] = 1;
        nextPulse = time * 1000 + 2100;
      }

      var live = liveCells = CELLS.map(function (cell, i) {

        /* each system breathes on its own clock */
        var breath = Math.sin(time * 1000 * cell.rate + cell.phase);

        var drift = .012 * breath;

        /*
         * The web turns as one, and winds gently against itself: inner shells
         * lead, outer shells lag. The torsion oscillates rather than
         * accumulating, so the structure is always under a little tension
         * without ever tangling.
         */
        var cellRadius =
          Math.sqrt(
            cell.rest.x * cell.rest.x +
            cell.rest.y * cell.rest.y
          );

        var spin =
          time * .058 +
          Math.sin(time * .21) * .30 /
          Math.max(.22, cellRadius);

        var ca = Math.cos(spin), sa = Math.sin(spin);

        var rx = cell.rest.x * ca - cell.rest.y * sa;
        var ry = cell.rest.x * sa + cell.rest.y * ca;

        return {
          x: center.x + (rx + drift) * radius * .82,
          y: center.y + (ry - drift * .7) * radius * .82,
          r: cell.size * radius * (1 + breath * .10 + activation[i] * .22),
          act: activation[i],
          cell: cell
        };
      });

      /* --- the centre itself --------------------------------------------
         Spiral arms wound in toward the middle, turning faster the closer
         they get. This is what the interior is organised around.           */
      var ARMS = 5, arm, seg, sr, sa2, sp, first;

      for (arm = 0; arm < ARMS; arm++) {

        ctx.beginPath();
        first = true;

        for (seg = 0; seg <= 26; seg++) {

          sr = radius * (.055 + (seg / 26) * .40);

          /* winding increases toward the centre */
          sa2 =
            (arm / ARMS) * TAU +
            time * .30 -
            (radius * .34 / Math.max(radius * .06, sr)) * .85;

          sp = {
            x: center.x + Math.cos(sa2) * sr,
            y: center.y + Math.sin(sa2) * sr
          };

          if (first) { ctx.moveTo(sp.x, sp.y); first = false; }
          else ctx.lineTo(sp.x, sp.y);
        }

        ctx.strokeStyle =
          "rgba(102,224,237," +
          (webIn * .10).toFixed(3) +
          ")";

        ctx.lineWidth = .8;
        ctx.stroke();
      }

      /* the quiet well at the middle */
      var coreGrad =
        ctx.createRadialGradient(
          center.x, center.y, 0,
          center.x, center.y, radius * .30
        );

      coreGrad.addColorStop(0, "rgba(102,224,237," + (webIn * .13).toFixed(3) + ")");
      coreGrad.addColorStop(.55, "rgba(33,168,199," + (webIn * .05).toFixed(3) + ")");
      coreGrad.addColorStop(1, "rgba(33,168,199,0)");

      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * .30, 0, TAU);
      ctx.fillStyle = coreGrad;
      ctx.fill();


      /* --- tension lines ------------------------------------------------ */
      LINKS.forEach(function (link) {

        var A = live[link.a], B = live[link.b];

        var tension = Math.max(A.act, B.act);

        ctx.beginPath();
        ctx.moveTo(A.x, A.y);

        /* bow the line slightly toward the centre: a tensioned strut, not a stick */
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        var bow = .10 - tension * .07;

        ctx.quadraticCurveTo(
          mx + (center.x - mx) * bow,
          my + (center.y - my) * bow,
          B.x, B.y
        );

        ctx.strokeStyle =
          "rgba(102,224,237," +
          (webIn * (.06 + tension * .30)).toFixed(3) +
          ")";

        ctx.lineWidth = .7 + tension * 1.1;
        ctx.stroke();
      });

      /* --- each system, with its own membrane and its own exchange ------- */
      live.forEach(function (L, i) {

        var cell = L.cell;

        /* its interior */
        var g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
        g.addColorStop(0, "rgba(33,168,199," + (webIn * (.20 + L.act * .3)).toFixed(3) + ")");
        g.addColorStop(1, "rgba(33,168,199,0)");
        ctx.beginPath();
        ctx.arc(L.x, L.y, L.r, 0, TAU);
        ctx.fillStyle = g;
        ctx.fill();

        /* its own membrane */
        ctx.beginPath();
        ctx.arc(L.x, L.y, L.r, 0, TAU);
        ctx.strokeStyle = cell.warm
          ? "rgba(236,199,126," + (webIn * (.24 + L.act * .5)).toFixed(3) + ")"
          : "rgba(102,224,237," + (webIn * (.22 + L.act * .5)).toFixed(3) + ")";
        ctx.lineWidth = .9;
        ctx.stroke();

        /* its own gradient of exchange, across its own edge */
        var n, ea, er, ex, ey, flow;
        for (n = 0; n < 5; n++) {

          flow = ((time * (.14 + cell.rate * 90) + n / 5 + cell.phase) % 1);

          er = cell.outward
            ? L.r * (.25 + flow * 1.5)
            : L.r * (1.75 - flow * 1.5);

          ea = cell.phase + n * (TAU / 5) + time * .12;

          ex = L.x + Math.cos(ea) * er;
          ey = L.y + Math.sin(ea) * er;

          ctx.beginPath();
          ctx.arc(ex, ey, .9 + L.act * .7, 0, TAU);
          ctx.fillStyle = cell.outward
            ? "rgba(236,199,126," + (webIn * (.30 + L.act * .4) * (1 - Math.abs(flow - .5))).toFixed(3) + ")"
            : "rgba(102,224,237," + (webIn * (.30 + L.act * .4) * (1 - Math.abs(flow - .5))).toFixed(3) + ")";
          ctx.fill();
        }

        /* the nucleus brightens when the system is activated */
        ctx.beginPath();
        ctx.arc(L.x, L.y, 1.5 + L.act * 2.2, 0, TAU);
        ctx.fillStyle = "rgba(243,237,224," + (webIn * (.30 + L.act * .6)).toFixed(3) + ")";
        ctx.fill();
      });

      /* activation decays, and passes to neighbours on the way out */
      LINKS.forEach(function (link) {
        var flow = (activation[link.a] - activation[link.b]) * .012;
        activation[link.a] -= flow;
        activation[link.b] += flow;
      });

      for (var q = 0; q < activation.length; q++) {
        activation[q] *= .988;
        if (activation[q] < .001) activation[q] = 0;
      }
    }


    /* ======================================================================
       INTERIOR PARTICLES
       ====================================================================== */

    INSIDE_PARTICLES.forEach(
      function (p, index) {

        /*
         * Differential rotation. Everything turns the same way, and the closer
         * it sits to the centre the faster it goes — which is what reads as a
         * centre rather than as a crowd. Counter-rotating halves cancelled the
         * sense of one organising motion, so they now share a direction.
         */
        var spinRadius =
          Math.max(
            .10,
            p.radius
          );


        var angle =
          p.angle +
          time *
          (
            .052 +
            p.speed * .28
          ) /
          Math.pow(
            spinRadius,
            .85
          );


        /*
         * A slow inward drift that recycles outward — matter falling toward
         * the centre and being returned, rather than orbiting forever.
         */
        var fall =
          (
            time * .045 +
            p.phaseFall
          ) % 1;


        var localRadius =
          radius *
          lerp(
            p.radius,
            p.radius * .30,
            smoothstep(fall)
          ) *
          .88;


        localRadius +=
          Math.sin(
            time *
            .42 +
            p.phase
          ) *
          radius *
          .012;


        var x =
          center.x +
          Math.cos(
            angle
          ) *
          localRadius;


        var y =
          center.y +
          Math.sin(
            angle
          ) *
          localRadius;


        var dist =
          Math.sqrt(
            Math.pow(
              x -
              center.x,
              2
            ) +
            Math.pow(
              y -
              center.y,
              2
            )
          );


        var inside =
          1 -
          smoothstep(
            (
              dist -
              radius *
              .88
            ) /
            Math.max(
              40,
              radius *
              .09
            )
          );


        var reveal =
          .12 +
          current *
          .88;


        var alpha =
          inside *
          reveal *
          (
            .035 +
            hash(
              index *
              11
            ) *
            .11
          );


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          .45 +
          hash(
            index *
            17
          ) *
          1.1,
          0,
          TAU
        );


        ctx.fillStyle =
          p.warm
            ?
              "rgba(236,199,126," +
              alpha +
              ")"
            :
              "rgba(102,224,237," +
              alpha +
              ")";


        ctx.fill();
      }
    );


    /* ======================================================================
       INTERIOR FLOW

       Long coherent routes become progressively visible after crossing.
       ====================================================================== */

    FLOW_LINES.forEach(
      function (flow, index) {

        var baseRadius =
          radius *
          flow.radius;


        var steps =
          38;


        ctx.beginPath();


        for (
          var s = 0;
          s <= steps;
          s++
        ) {

          var u =
            s /
            steps;


          var angle =
            flow.phase +
            u *
            (
              1.3 +
              index %
              3 *
              .35
            ) +
            time *
            flow.speed;


          var radial =
            baseRadius *
            (
              .72 +
              u *
              .32
            );


          radial +=
            Math.sin(
              u *
              TAU *
              2.2 +
              time *
              .32 +
              index
            ) *
            radius *
            .013;


          var x =
            center.x +
            Math.cos(
              angle
            ) *
            radial;


          var y =
            center.y +
            Math.sin(
              angle
            ) *
            radial;


          if (
            s === 0
          ) {

            ctx.moveTo(
              x,
              y
            );

          } else {

            ctx.lineTo(
              x,
              y
            );
          }
        }


        var reveal =
          smoothstep(
            (
              current -
              .30
            ) /
            .70
          );


        ctx.strokeStyle =
          flow.warm
            ?
              "rgba(236,199,126," +
              (
                .012 +
                reveal *
                .026
              ) +
              ")"
            :
              "rgba(102,224,237," +
              (
                .012 +
                reveal *
                .030
              ) +
              ")";


        ctx.lineWidth =
          .55;


        ctx.stroke();
      }
    );


    /* ======================================================================
       EXCHANGE

       Some trajectories cross the boundary.
       Some remain outside and peel away.

       The visual communicates regulated exchange without literalizing a
       biochemical transport mechanism.
       ====================================================================== */

    var edgeProximity =
      clamp(
        1 -
        Math.abs(
          current -
          .5
        ) /
        .5,
        0,
        1
      );


    EXCHANGE_PARTICLES.forEach(
      function (particle, index) {

        var cycle =
          (
            time *
            particle.speed +
            particle.phase
          ) %
          1;


        /*
         * Crossing particles travel from outside to inside.

         * Non-crossing particles approach, arc along the boundary, then
         * recede again.
         */
        var t =
          particle.cross
            ?
              cycle
            :
              cycle < .5
                ?
                  cycle *
                  2
                :
                  (
                    1 -
                    cycle
                  ) *
                  2;


        var particleAngle =
          gateAngle +
          particle.arc;


        var particleGate =
          logicalToCanvas(
            polar(
              geom.cx,
              geom.cy,
              geom.radius,
              particleAngle
            ),
            stage
          );


        var normalX =
          Math.cos(
            particleAngle
          );


        var normalY =
          Math.sin(
            particleAngle
          );


        var tangentX =
          -normalY;


        var tangentY =
          normalX;


        var outsideDistance =
          110 +
          index %
          4 *
          17;


        var insideDistance =
          particle.cross
            ?
              155 +
              index %
              5 *
              19
            :
              15;


        var along =
          particle.outward
            ?
              lerp(
                -insideDistance,
                outsideDistance,
                smoothstep(t)
              )
            :
              lerp(
                outsideDistance,
                -insideDistance,
                smoothstep(t)
              );


        var tangent =
          Math.sin(
            t *
            Math.PI
          ) *
          (
            particle.offset *
            160
          );


        /*
         * Non-crossing trajectories peel away instead of entering.
         */
        if (
          !particle.cross
        ) {

          tangent +=
            smoothstep(t) *
            52 *
            (
              index % 2
                ?
                  1
                :
                  -1
            );
        }


        var x =
          particleGate.x +
          normalX *
          along +
          tangentX *
          tangent;


        var y =
          particleGate.y +
          normalY *
          along +
          tangentY *
          tangent;


        /*
         * Once inside, a seeking particle abandons the straight path and runs
         * for its domain — accelerating as it closes, so the eye is pulled
         * along with it. Arriving, it lights that system, and the web carries
         * the activation onward to whatever that system is tied to.
         */
        var seeking =
          particle.cross &&
          particle.seeks &&
          !particle.outward &&
          liveCells &&
          along < 0;

        var homing = 0;

        if (seeking) {

          var dest =
            liveCells[
              particle.target %
              liveCells.length
            ];

          /* nothing at t=0.5 (the crossing), everything by t=1 */
          homing =
            smoothstep(
              (t - .5) / .46
            );

          x = lerp(x, dest.x, homing);
          y = lerp(y, dest.y, homing);

          if (homing > .93) {
            activation[particle.target % activation.length] = 1;
          }
        }


        var boundaryDistance =
          Math.abs(
            along
          );


        var glow =
          Math.exp(
            -boundaryDistance /
            34
          );


        var alpha =
          (
            .44 +
            edgeProximity *
            .40 +
            current *
            .10
          ) *
          (
            .62 +
            glow *
            .95
          );


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          particle.size *
          1.5 +
          glow *
          2.0,
          0,
          TAU
        );


        /*
         * Aqua enters, gold leaves. The two colours already carry that meaning
         * everywhere else on the site, so the direction reads without a legend.
         */
        ctx.fillStyle =
          !particle.cross
            ?
              "rgba(236,199,126," +
              alpha * .5 +
              ")"
            :
              particle.outward
                ?
                  "rgba(236,199,126," +
                  alpha +
                  ")"
                :
                  "rgba(102,224,237," +
                  alpha +
                  ")";


        ctx.fill();


        /*
         * A short wake behind each crossing particle, so the motion has
         * direction even in a still frame.
         */
        if (
          particle.cross &&
          glow > .08
        ) {

          /* faster particles draw longer trails; homing ones longer still */
          var wake =
            (
              6 +
              particle.speed * 190 +
              homing * 26
            ) *
            (
              particle.outward
                ? -1
                : 1
            );

          ctx.beginPath();

          ctx.moveTo(x, y);

          if (homing > .02) {

            var back =
              lerp(1, .82, homing);

            ctx.lineTo(
              lerp(x, particleGate.x + normalX * along * back, .55),
              lerp(y, particleGate.y + normalY * along * back, .55)
            );

          } else {

            ctx.lineTo(
              x - normalX * wake,
              y - normalY * wake
            );
          }

          ctx.strokeStyle =
            particle.outward
              ?
                "rgba(236,199,126," +
                alpha * .42 +
                ")"
              :
                "rgba(102,224,237," +
                alpha * .42 +
                ")";

          ctx.lineWidth = 1 + homing * 1.2;

          ctx.stroke();
        }


        /*
         * Tiny wake near the exchange zone.
         */
        if (
          glow >
          .12
        ) {

          ctx.beginPath();


          ctx.moveTo(
            x -
            normalX *
            12,
            y -
            normalY *
            12
          );


          ctx.lineTo(
            x,
            y
          );


          ctx.strokeStyle =
            particle.cross
              ?
                "rgba(102,224,237," +
                glow *
                edgeProximity *
                .18 +
                ")"
              :
                "rgba(236,199,126," +
                glow *
                edgeProximity *
                .14 +
                ")";


          ctx.lineWidth =
            .7;


          ctx.stroke();
        }
      }
    );


    /* ======================================================================
       GATE BLOOM
       ====================================================================== */

    var bloomRadius =
      30 +
      edgeProximity *
      82;


    var gradient =
      ctx.createRadialGradient(
        gate.x,
        gate.y,
        0,
        gate.x,
        gate.y,
        bloomRadius
      );


    gradient.addColorStop(
      0,
      "rgba(236,199,126," +
      (
        edgeProximity *
        .075
      ) +
      ")"
    );


    gradient.addColorStop(
      .38,
      "rgba(102,224,237," +
      (
        edgeProximity *
        .026
      ) +
      ")"
    );


    gradient.addColorStop(
      1,
      "rgba(102,224,237,0)"
    );


    ctx.fillStyle =
      gradient;


    ctx.beginPath();


    ctx.arc(
      gate.x,
      gate.y,
      bloomRadius,
      0,
      TAU
    );


    ctx.fill();
  }


  /* ==========================================================================
     MOMENT LABEL
     ========================================================================== */

  function updateMoment() {

    if (
      target <
      .33
    ) {

      moment.textContent =
        "The surroundings";

    } else if (
      target <
      .67
    ) {

      moment.textContent =
        "The edge";

    } else {

      moment.textContent =
        "The interior";
    }
  }


  /* ==========================================================================
     ANIMATION
     ========================================================================== */

  var visible =
    true;


  var raf =
    0;


  var last =
    0;


  function frame(now) {

    if (
      !visible
    ) {

      raf =
        0;

      return;
    }


    var dt =
      last
        ?
          Math.min(
            40,
            now -
            last
          )
        :
          16;


    last =
      now;


    var k =
      1 -
      Math.exp(
        -dt /
        360
      );


    current =
      lerp(
        current,
        target,
        k
      );


    drawSVG(now);


    if (
      ctx &&
      !reduce
    ) {

      drawCanvas(now);
    }


    raf =
      requestAnimationFrame(
        frame
      );
  }


  function ensureAnimation() {

    if (
      reduce ||
      !visible ||
      raf
    ) {
      return;
    }


    last =
      0;


    raf =
      requestAnimationFrame(
        frame
      );
  }


  /* ==========================================================================
     SCRUB
     ========================================================================== */

  slider.addEventListener(
    "input",
    function () {

      stopReplay();


      target =
        Number(
          slider.value
        ) /
        100;


      updateMoment();


      if (
        reduce
      ) {

        current =
          target;


        drawSVG(0);

      } else {

        ensureAnimation();
      }
    }
  );


  /* ==========================================================================
     REPLAY
     ========================================================================== */

  var replayRAF =
    0;


  var replaying =
    false;


  function stopReplay() {

    replaying =
      false;


    if (
      replayRAF
    ) {

      cancelAnimationFrame(
        replayRAF
      );


      replayRAF =
        0;
    }


    replay.textContent =
      "Cross the edge →";
  }


  function crossEdge() {

    if (
      reduce
    ) {

      target =
        1;


      current =
        1;


      slider.value =
        "100";


      updateMoment();


      drawSVG(0);

      return;
    }


    stopReplay();


    replaying =
      true;


    replay.textContent =
      "Crossing…";


    target =
      0;


    slider.value =
      "0";


    updateMoment();


    var start =
      0;


    var duration =
      7200;


    function step(now) {

      if (
        !replaying
      ) {
        return;
      }


      if (
        !start
      ) {

        start =
          now;
      }


      var t =
        clamp(
          (
            now -
            start
          ) /
          duration,
          0,
          1
        );


      /*
       * The crossing slows at the membrane itself.
       * The edge is an event, not a frame we race through.
       */
      var eased;


      if (
        t <
        .42
      ) {

        eased =
          .46 *
          easeInOutCubic(
            t /
            .42
          );

      } else if (
        t <
        .66
      ) {

        eased =
          lerp(
            .46,
            .58,
            smoothstep(
              (
                t -
                .42
              ) /
              .24
            )
          );

      } else {

        eased =
          lerp(
            .58,
            1,
            easeInOutCubic(
              (
                t -
                .66
              ) /
              .34
            )
          );
      }


      target =
        eased;


      slider.value =
        String(
          Math.round(
            eased *
            100
          )
        );


      updateMoment();


      if (
        t <
        1
      ) {

        replayRAF =
          requestAnimationFrame(
            step
          );

      } else {

        replaying =
          false;


        replayRAF =
          0;


        replay.textContent =
          "Cross the edge →";
      }
    }


    replayRAF =
      requestAnimationFrame(
        step
      );
  }


  replay.addEventListener(
    "click",
    crossEdge
  );


  /* ==========================================================================
     CANVAS INIT
     ========================================================================== */

  if (
    ctx &&
    !reduce
  ) {

    seedWorld();

    resizeCanvas();


    window.addEventListener(
      "resize",
      resizeCanvas,
      {
        passive: true
      }
    );
  }


  /* ==========================================================================
     VISIBILITY
     ========================================================================== */

  if (
    host &&
    "IntersectionObserver" in
    window
  ) {

    new IntersectionObserver(
      function (entries) {

        entries.forEach(
          function (entry) {

            visible =
              entry.isIntersecting;


            if (
              visible
            ) {

              ensureAnimation();

            } else if (
              raf
            ) {

              cancelAnimationFrame(
                raf
              );


              raf =
                0;


              last =
                0;
            }
          }
        );

      },
      {
        rootMargin:
          "180px 0px 180px 0px"
      }
    )
    .observe(host);
  }


  /* ==========================================================================
     INITIAL EXPERIENCE
     ========================================================================== */

  if (
    reduce
  ) {

    /*
     * The edge is the most semantically complete static reduced-motion state:
     * exterior, interior, boundary, and exchange can all be seen simultaneously.
     */
    target =
      .5;


    current =
      .5;


    slider.value =
      "50";


    updateMoment();


    replay.hidden =
      true;


    drawSVG(0);

  } else {

    target =
      0;


    current =
      0;


    slider.value =
      "0";


    updateMoment();


    ensureAnimation();


    /*
     * One quiet first crossing.
     * Direct interaction with the slider cancels it immediately.
     */
    window.setTimeout(
      function () {

        if (
          Number(
            slider.value
          ) ===
          0
        ) {

          crossEdge();
        }
      },
      900
    );
  }

})();
