/* What it measures — extracted from the standalone reference. */
(function () {
  "use strict";


  /* ==========================================================================
     ONE FIELD. FOUR PHENOMENA.
     ========================================================================== */

  var NS  = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;

  var VIEW = 680;

  var CX = VIEW / 2;
  var CY = VIEW / 2;

  var R = 220;

  var PROFILE_COUNT = 24;
  var SAMPLE_COUNT  = 96;

  var PHASE_COUNT = 28;

  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  var host =
    document.querySelector(".wm");

  var svg =
    document.getElementById(
      "wm-field"
    );

  var note =
    document.getElementById(
      "wm-note"
    );

  var buttons =
    Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-aspect]"
      )
    );

  var canvas =
    document.getElementById(
      "wm-canvas"
    );

  var ctx =
    canvas &&
    canvas.getContext
      ? canvas.getContext("2d")
      : null;

  if (!svg) return;


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
      (b - a) *
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


  function angleAt(i, count) {

    return (
      i /
      count
    ) *
    TAU -
    Math.PI / 2;
  }


  function polar(radius, angle) {

    return {
      x:
        CX +
        Math.cos(angle) *
        radius,

      y:
        CY +
        Math.sin(angle) *
        radius
    };
  }


  function shortestAngle(a, b) {

    return Math.atan2(
      Math.sin(a - b),
      Math.cos(a - b)
    );
  }


  function hash(n) {

    var x =
      Math.sin(
        n * 127.1
      ) *
      43758.5453123;

    return x -
      Math.floor(x);
  }


  /* ==========================================================================
     SHARED FIELD
     ========================================================================== */

  var FIXED_PROFILE =
    Array(PROFILE_COUNT)
      .fill(1);


  var BASE_PROFILE =
    Array(PROFILE_COUNT)
      .fill(0)
      .map(function (_, i) {

        var a =
          angleAt(
            i,
            PROFILE_COUNT
          );

        return (
          1 +
          .014 *
          Math.cos(
            a * 2 + .4
          ) +
          .009 *
          Math.cos(
            a * 5 - .7
          )
        );
      });


  var BASE_POSITION = {
    x: .28,
    y: -.15
  };


  var BASE_SCALE =
    .83;


  /* ==========================================================================
     PROFILE → PATH
     ========================================================================== */

  function smoothProfile(profile) {

    var raw = [];
    var out = [];


    for (
      var i = 0;
      i < SAMPLE_COUNT;
      i++
    ) {

      var t =
        i /
        SAMPLE_COUNT *
        profile.length;


      var a =
        Math.floor(t) %
        profile.length;


      var b =
        (
          a + 1
        ) %
        profile.length;


      var f =
        smoothstep(
          t -
          Math.floor(t)
        );


      raw.push(
        profile[a] *
        (
          1 -
          f
        ) +
        profile[b] *
        f
      );
    }


    for (
      var j = 0;
      j < SAMPLE_COUNT;
      j++
    ) {

      out.push(
        (
          raw[
            (
              j -
              1 +
              SAMPLE_COUNT
            ) %
            SAMPLE_COUNT
          ] +
          raw[j] *
          2 +
          raw[
            (
              j +
              1
            ) %
            SAMPLE_COUNT
          ]
        ) /
        4
      );
    }


    return out;
  }


  function ringFromSamples(
    samples,
    scale
  ) {

    var points = [];


    for (
      var i = 0;
      i < SAMPLE_COUNT;
      i++
    ) {

      points.push(
        polar(
          R *
          scale *
          samples[i],

          angleAt(
            i,
            SAMPLE_COUNT
          )
        )
      );
    }


    var d =
      "M" +
      points[0].x.toFixed(1) +
      " " +
      points[0].y.toFixed(1);


    for (
      var j = 0;
      j < SAMPLE_COUNT;
      j++
    ) {

      var p0 =
        points[
          (
            j -
            1 +
            SAMPLE_COUNT
          ) %
          SAMPLE_COUNT
        ];


      var p1 =
        points[j];


      var p2 =
        points[
          (
            j +
            1
          ) %
          SAMPLE_COUNT
        ];


      var p3 =
        points[
          (
            j +
            2
          ) %
          SAMPLE_COUNT
        ];


      d +=
        "C" +
        (
          p1.x +
          (
            p2.x -
            p0.x
          ) /
          6
        ).toFixed(1) +
        " " +
        (
          p1.y +
          (
            p2.y -
            p0.y
          ) /
          6
        ).toFixed(1) +
        "," +
        (
          p2.x -
          (
            p3.x -
            p1.x
          ) /
          6
        ).toFixed(1) +
        " " +
        (
          p2.y -
          (
            p3.y -
            p1.y
          ) /
          6
        ).toFixed(1) +
        "," +
        p2.x.toFixed(1) +
        " " +
        p2.y.toFixed(1);
    }


    return d + "Z";
  }


  function edgeRadiusAt(
    samples,
    scale,
    angle
  ) {

    var normalized =
      (
        (
          angle +
          Math.PI / 2
        ) /
        TAU +
        1
      ) %
      1;


    var index =
      Math.round(
        normalized *
        SAMPLE_COUNT
      ) %
      SAMPLE_COUNT;


    return (
      R *
      scale *
      samples[index]
    );
  }


  /* ==========================================================================
     COPY — UNCHANGED
     ========================================================================== */

  var ASPECTS = {

    boundary: {
      note:
        "The edge is the measurement. What matters is not where you are, but how much room is left between you and it."
    },

    stability: {
      note:
        "A disturbance arrives. Stability is whether the organization holds its shape — and how quickly it settles again."
    },

    coherence: {
      note:
        "Separate processes, moving together. Coherence is the relationship between them, not the level of any one."
    },

    recovery: {
      note:
        "Load becoming capacity again. Recovery is a direction through time, with the edge reopening behind it."
    }

  };


  /* ==========================================================================
     SVG DEFS
     ========================================================================== */

  var defs =
    el("defs");


  var edgeGradient =
    el(
      "linearGradient",
      {
        id: "wm-edge-gradient",
        x1: "8%",
        y1: "88%",
        x2: "90%",
        y2: "10%"
      }
    );


  [
    ["0%",   "var(--glow)"],
    ["44%",  "var(--glow-soft)"],
    ["72%",  "var(--aqua)"],
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


  var fillGradient =
    el(
      "radialGradient",
      {
        id: "wm-fill-gradient",
        cx: "50%",
        cy: "44%",
        r: "70%"
      }
    );


  [
    ["0%",   "var(--aqua-deep)", ".20"],
    ["48%",  "var(--aqua-deep)", ".075"],
    ["78%",  "var(--glow)",      ".028"],
    ["100%", "var(--glow)",      ".004"]
  ]
  .forEach(function (stop) {

    fillGradient.appendChild(
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


  defs.appendChild(
    edgeGradient
  );

  defs.appendChild(
    fillGradient
  );

  svg.appendChild(
    defs
  );


  /* ==========================================================================
     SVG LAYERS
     ========================================================================== */

  var refBloom =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-ref-bloom"
        }
      )
    );


  var refOuter =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-ref wm-ref--outer"
        }
      )
    );


  var refInner =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-ref wm-ref--inner"
        }
      )
    );


  var recoveryGhosts =
    svg.appendChild(
      el("g")
    );


  var fill =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-fill",

          fill:
            "url(#wm-fill-gradient)"
        }
      )
    );


  var recoverySpace =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-recovery-space"
        }
      )
    );


  var room =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-room"
        }
      )
    );


  var contours =
    svg.appendChild(
      el("g")
    );


  var phaseEchoes =
    svg.appendChild(
      el("g")
    );


  var phasePaths =
    svg.appendChild(
      el("g")
    );


  var impactWaves =
    svg.appendChild(
      el("g")
    );


  var bloom =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-field-bloom",

          stroke:
            "url(#wm-edge-gradient)"
        }
      )
    );


  var edge =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-edge",

          stroke:
            "url(#wm-edge-gradient)"
        }
      )
    );


  var beads =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-beads",

          stroke:
            "url(#wm-edge-gradient)"
        }
      )
    );


  var capacityRays =
    svg.appendChild(
      el("g")
    );


  var reach =
    svg.appendChild(
      el(
        "line",
        {
          class:
            "wm-reach"
        }
      )
    );


  var impactPath =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-impact-path"
        }
      )
    );


  var anchor =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-anchor",
          r:
            "10"
        }
      )
    );


  var recoveryTrail =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "wm-recovery-trail"
        }
      )
    );


  var recoveryDots =
    svg.appendChild(
      el("g")
    );


  var phaseNodes =
    svg.appendChild(
      el("g")
    );


  var positionHalo =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-position-halo",
          r:
            "24"
        }
      )
    );


  var positionRing =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-position-ring",
          r:
            "11"
        }
      )
    );


  var position =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-position",
          r:
            "5.5"
        }
      )
    );


  var positionCore =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "wm-position-core",
          r:
            "2.2"
        }
      )
    );


  /* ==========================================================================
     STATIC OBJECTS
     ========================================================================== */

  var fixedSamples =
    smoothProfile(
      FIXED_PROFILE
    );


  var fixedPath =
    ringFromSamples(
      fixedSamples,
      1
    );


  refBloom.setAttribute(
    "d",
    fixedPath
  );


  refOuter.setAttribute(
    "d",
    fixedPath
  );


  refInner.setAttribute(
    "d",
    ringFromSamples(
      fixedSamples,
      .72
    )
  );


  for (
    var c = 0;
    c < 24;
    c++
  ) {

    contours.appendChild(
      el(
        "path",
        {
          class:
            "wm-contour",

          stroke:
            c > 17
              ?
                "var(--glow)"
              :
                "var(--aqua)"
        }
      )
    );
  }


  for (
    var pr = 0;
    pr < 26;
    pr++
  ) {

    capacityRays.appendChild(
      el(
        "line",
        {
          class:
            "wm-capacity-ray"
        }
      )
    );
  }


  for (
    var iw = 0;
    iw < 7;
    iw++
  ) {

    impactWaves.appendChild(
      el(
        "ellipse",
        {
          class:
            "wm-wave" +
            (
              iw % 3 === 2
                ?
                  " wm-wave--aqua"
                :
                  ""
            )
        }
      )
    );
  }


  for (
    var pp = 0;
    pp < PHASE_COUNT;
    pp++
  ) {

    phaseNodes.appendChild(
      el(
        "circle",
        {
          class:
            "wm-phase-node",
          r:
            "2.5"
        }
      )
    );
  }


  for (
    var ep = 0;
    ep < 10;
    ep++
  ) {

    phaseEchoes.appendChild(
      el(
        "ellipse",
        {
          class:
            "wm-phase-echo"
        }
      )
    );
  }


  for (
    var fp = 0;
    fp < 8;
    fp++
  ) {

    phasePaths.appendChild(
      el(
        "path",
        {
          class:
            "wm-phase-path"
        }
      )
    );
  }


  for (
    var rd = 0;
    rd < 12;
    rd++
  ) {

    recoveryDots.appendChild(
      el(
        "circle",
        {
          class:
            "wm-recovery-dot",
          r:
            "2"
        }
      )
    );
  }


  for (
    var rg = 0;
    rg < 5;
    rg++
  ) {

    recoveryGhosts.appendChild(
      el(
        "path",
        {
          class:
            "wm-recovery-ghost"
        }
      )
    );
  }


  /* ==========================================================================
     RECOVERY PATH
     ========================================================================== */

  var RECOVERY_POINTS =
    (function () {

      var pts = [];


      var start = {
        x: .62,
        y: -.18
      };


      for (
        var i = 0;
        i < 28;
        i++
      ) {

        var t =
          smoothstep(
            i /
            27
          );


        var bend =
          Math.sin(
            t *
            Math.PI
          ) *
          .10;


        pts.push({
          x:
            lerp(
              start.x,
              BASE_POSITION.x,
              t
            ),

          y:
            lerp(
              start.y,
              BASE_POSITION.y,
              t
            ) +
            bend
        });
      }


      return pts;
    })();


  /* ==========================================================================
     STATE
     ========================================================================== */

  var activeAspect =
    "boundary";


  var weights = {
    boundary: 1,
    stability: 0,
    coherence: 0,
    recovery: 0
  };


  var targets = {
    boundary: 1,
    stability: 0,
    coherence: 0,
    recovery: 0
  };


  var clock = 0;


  var stabilityStart =
    -100000;


  var nextStability =
    0;


  var coherenceStart =
    0;


  var recoveryStart =
    0;


  /* ==========================================================================
     SELECT ASPECT
     ========================================================================== */

  function setAspect(key) {

    if (!ASPECTS[key]) return;


    activeAspect =
      key;


    Object.keys(
      targets
    )
    .forEach(
      function (name) {

        targets[name] =
          name === key
            ?
              1
            :
              0;
      }
    );


    buttons.forEach(
      function (button) {

        button.setAttribute(
          "aria-pressed",
          String(
            button.getAttribute(
              "data-aspect"
            ) === key
          )
        );
      }
    );


    if (note) {

      note.textContent =
        ASPECTS[key].note;
    }


    if (
      key ===
      "stability"
    ) {

      stabilityStart =
        clock +
        220;


      nextStability =
        stabilityStart +
        4800;
    }


    if (
      key ===
      "coherence"
    ) {

      coherenceStart =
        clock;
    }


    if (
      key ===
      "recovery"
    ) {

      recoveryStart =
        clock;
    }


    if (reduce) {

      Object.keys(weights)
        .forEach(
          function (name) {

            weights[name] =
              targets[name];
          }
        );


      drawSVG(0);
    }
  }


  /* ==========================================================================
     DRAW SVG
     ========================================================================== */

  function drawSVG(now) {

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
          .005;


    /* ----------------------------------------------------------------------
       STABILITY EVENT
       ---------------------------------------------------------------------- */

    var stabilityAge =
      clock -
      stabilityStart;


    var event =
      stabilityAge >= 0
        ?
          Math.exp(
            -stabilityAge /
            920
          )
        :
          0;


    var membraneEvent =
      stabilityAge > 170
        ?
          Math.exp(
            -(
              stabilityAge -
              170
            ) /
            1450
          )
        :
          0;


    var impactAngle =
      -.64;


    /* ----------------------------------------------------------------------
       RECOVERY
       ---------------------------------------------------------------------- */

    var recoveryAge =
      Math.max(
        0,
        clock -
        recoveryStart
      );


    var recoveryProgress =
      reduce
        ?
          1
        :
          smoothstep(
            clamp(
              recoveryAge /
              4500,
              0,
              1
            )
          );


    var membraneRecovery =
      reduce
        ?
          1
        :
          smoothstep(
            clamp(
              (
                recoveryProgress -
                .16
              ) /
              .84,
              0,
              1
            )
          );


    var recoveryIndex =
      Math.round(
        recoveryProgress *
        (
          RECOVERY_POINTS.length -
          1
        )
      );


    var recoveryPos =
      RECOVERY_POINTS[
        recoveryIndex
      ];


    /* ----------------------------------------------------------------------
       POSITION
       ---------------------------------------------------------------------- */

    var stabilityPos = {
      x:
        BASE_POSITION.x +
        Math.cos(
          impactAngle
        ) *
        event *
        .17,

      y:
        BASE_POSITION.y +
        Math.sin(
          impactAngle
        ) *
        event *
        .17
    };


    var displayPos = {
      x: BASE_POSITION.x,
      y: BASE_POSITION.y
    };


    displayPos.x =
      lerp(
        displayPos.x,
        stabilityPos.x,
        weights.stability
      );


    displayPos.y =
      lerp(
        displayPos.y,
        stabilityPos.y,
        weights.stability
      );


    displayPos.x =
      lerp(
        displayPos.x,
        recoveryPos.x,
        weights.recovery
      );


    displayPos.y =
      lerp(
        displayPos.y,
        recoveryPos.y,
        weights.recovery
      );


    /* ----------------------------------------------------------------------
       ACTIVE MEMBRANE
       ---------------------------------------------------------------------- */

    var scale =
      BASE_SCALE;


    scale +=
      membraneEvent *
      weights.stability *
      .027;


    scale =
      lerp(
        scale,
        lerp(
          .915,
          BASE_SCALE,
          membraneRecovery
        ),
        weights.recovery
      );


    scale *=
      breath;


    var profile =
      BASE_PROFILE.map(
        function (base, index) {

          var angle =
            angleAt(
              index,
              PROFILE_COUNT
            );


          var delta =
            shortestAngle(
              angle,
              impactAngle
            );


          var localEvent =
            membraneEvent *
            .030 *
            Math.exp(
              -(
                delta *
                delta
              ) /
              .50
            ) *
            weights.stability;


          /*
           * Recovery begins from a more irregular field and regains its simpler
           * organization over time.
           */
          var recoveryIrregularity =
            weights.recovery *
            (
              1 -
              membraneRecovery
            ) *
            (
              .035 *
              Math.sin(
                angle *
                3 +
                .9
              ) +
              .021 *
              Math.cos(
                angle *
                5 -
                .4
              )
            );


          return (
            base +
            localEvent +
            recoveryIrregularity
          );
        }
      );


    var samples =
      smoothProfile(
        profile
      );


    var fieldPath =
      ringFromSamples(
        samples,
        scale
      );


    fill.setAttribute(
      "d",
      fieldPath
    );


    bloom.setAttribute(
      "d",
      fieldPath
    );


    edge.setAttribute(
      "d",
      fieldPath
    );


    beads.setAttribute(
      "d",
      fieldPath
    );


    bloom.style.opacity =
      (
        .09 +
        weights.stability *
        membraneEvent *
        .10 +
        weights.recovery *
        (
          1 -
          membraneRecovery
        ) *
        .055
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       CONTOURS
       ---------------------------------------------------------------------- */

    var contourNodes =
      contours.childNodes;


    for (
      var c = 0;
      c < contourNodes.length;
      c++
    ) {

      var u =
        (
          c + 1
        ) /
        contourNodes.length;


      var contourScale =
        scale *
        (
          .12 +
          Math.pow(
            u,
            .82
          ) *
          .84
        );


      contourNodes[c]
        .setAttribute(
          "d",
          ringFromSamples(
            samples,
            contourScale
          )
        );


      contourNodes[c]
        .style.opacity =
        (
          .025 +
          (
            1 -
            u
          ) *
          .14 +
          weights.coherence *
          .035 *
          (
            1 -
            u
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       POSITION
       ---------------------------------------------------------------------- */

    var px =
      CX +
      displayPos.x *
      R;


    var py =
      CY +
      displayPos.y *
      R;


    [
      positionHalo,
      positionRing,
      position,
      positionCore
    ]
    .forEach(
      function (node) {

        node.setAttribute(
          "cx",
          px.toFixed(1)
        );


        node.setAttribute(
          "cy",
          py.toFixed(1)
        );
      }
    );


    positionHalo.setAttribute(
      "r",
      (
        22 +
        event *
        weights.stability *
        20 +
        weights.coherence *
        5
      ).toFixed(1)
    );


    positionHalo.style.opacity =
      (
        .10 +
        weights.coherence *
        .09 +
        weights.recovery *
        .05
      ).toFixed(3);


    /* ======================================================================
       BOUNDARY
       ====================================================================== */

    var direction =
      Math.atan2(
        displayPos.y,
        displayPos.x
      );


    var edgeRadius =
      edgeRadiusAt(
        samples,
        scale,
        direction
      );


    var edgePoint =
      polar(
        edgeRadius,
        direction
      );


    var roomWidth =
      .44;


    var roomSteps =
      22;


    var roomPath =
      "M" +
      px.toFixed(1) +
      " " +
      py.toFixed(1);


    for (
      var rs = 0;
      rs <= roomSteps;
      rs++
    ) {

      var roomAngle =
        direction -
        roomWidth /
        2 +
        roomWidth *
        rs /
        roomSteps;


      var roomRadius =
        edgeRadiusAt(
          samples,
          scale,
          roomAngle
        );


      var roomPoint =
        polar(
          roomRadius,
          roomAngle
        );


      roomPath +=
        "L" +
        roomPoint.x.toFixed(1) +
        " " +
        roomPoint.y.toFixed(1);
    }


    room.setAttribute(
      "d",
      roomPath +
      "Z"
    );


    room.style.opacity =
      (
        weights.boundary *
        .12
      ).toFixed(3);


    reach.setAttribute(
      "x1",
      px.toFixed(1)
    );


    reach.setAttribute(
      "y1",
      py.toFixed(1)
    );


    reach.setAttribute(
      "x2",
      edgePoint.x.toFixed(1)
    );


    reach.setAttribute(
      "y2",
      edgePoint.y.toFixed(1)
    );


    reach.style.opacity =
      (
        weights.boundary *
        .5
      ).toFixed(3);


    /*
     * Many quiet radial possibilities make capacity feel spatial rather than
     * like a single ruler.
     */
    var rayNodes =
      capacityRays.childNodes;


    for (
      var cr = 0;
      cr < rayNodes.length;
      cr++
    ) {

      var ra =
        direction -
        .95 +
        cr /
        (
          rayNodes.length -
          1
        ) *
        1.9;


      var r0 =
        edgeRadiusAt(
          samples,
          scale,
          ra
        ) *
        .72;


      var r1 =
        edgeRadiusAt(
          samples,
          scale,
          ra
        ) *
        .985;


      var p0 =
        polar(
          r0,
          ra
        );


      var p1 =
        polar(
          r1,
          ra
        );


      rayNodes[cr]
        .setAttribute(
          "x1",
          p0.x.toFixed(1)
        );


      rayNodes[cr]
        .setAttribute(
          "y1",
          p0.y.toFixed(1)
        );


      rayNodes[cr]
        .setAttribute(
          "x2",
          p1.x.toFixed(1)
        );


      rayNodes[cr]
        .setAttribute(
          "y2",
          p1.y.toFixed(1)
        );


      var closeness =
        1 -
        Math.abs(
          cr /
          (
            rayNodes.length -
            1
          ) -
          .5
        ) *
        2;


      rayNodes[cr]
        .style.opacity =
        (
          weights.boundary *
          (
            .04 +
            closeness *
            .18
          )
        ).toFixed(3);
    }


    /* ======================================================================
       STABILITY

       Not a dent animation.

       A wave enters the system, displaces the state, passes through internal
       structure, then leaves recognizable organization behind.
       ====================================================================== */

    var baseX =
      CX +
      BASE_POSITION.x *
      R;


    var baseY =
      CY +
      BASE_POSITION.y *
      R;


    anchor.setAttribute(
      "cx",
      baseX.toFixed(1)
    );


    anchor.setAttribute(
      "cy",
      baseY.toFixed(1)
    );


    anchor.style.opacity =
      (
        weights.stability *
        event *
        .35
      ).toFixed(3);


    impactPath.setAttribute(
      "d",
      "M" +
      baseX.toFixed(1) +
      " " +
      baseY.toFixed(1) +
      "L" +
      px.toFixed(1) +
      " " +
      py.toFixed(1)
    );


    impactPath.style.opacity =
      (
        weights.stability *
        event *
        .58
      ).toFixed(3);


    var waveNodes =
      impactWaves.childNodes;


    for (
      var waveIndex = 0;
      waveIndex < waveNodes.length;
      waveIndex++
    ) {

      var waveDelay =
        waveIndex *
        105;


      var waveAge =
        Math.max(
          0,
          stabilityAge -
          waveDelay
        );


      var waveProgress =
        clamp(
          waveAge /
          1350,
          0,
          1
        );


      var waveRadius =
        18 +
        waveProgress *
        235;


      var centerOffset =
        35 *
        (
          1 -
          waveProgress
        );


      var wc =
        polar(
          centerOffset,
          impactAngle +
          Math.PI
        );


      waveNodes[waveIndex]
        .setAttribute(
          "cx",
          wc.x.toFixed(1)
        );


      waveNodes[waveIndex]
        .setAttribute(
          "cy",
          wc.y.toFixed(1)
        );


      waveNodes[waveIndex]
        .setAttribute(
          "rx",
          (
            waveRadius *
            1.15
          ).toFixed(1)
        );


      waveNodes[waveIndex]
        .setAttribute(
          "ry",
          (
            waveRadius *
            .58
          ).toFixed(1)
        );


      waveNodes[waveIndex]
        .setAttribute(
          "transform",
          "rotate(" +
          (
            impactAngle *
            180 /
            Math.PI +
            90
          ).toFixed(1) +
          " " +
          wc.x.toFixed(1) +
          " " +
          wc.y.toFixed(1) +
          ")"
        );


      waveNodes[waveIndex]
        .style.opacity =
        (
          weights.stability *
          (
            1 -
            waveProgress
          ) *
          .32
        ).toFixed(3);
    }


    /* ======================================================================
       COHERENCE

       Many independent phases gradually begin belonging to a larger rhythm.

       They never become one object.
       Their relation becomes legible.
       ====================================================================== */

    var coherenceAge =
      Math.max(
        0,
        clock -
        coherenceStart
      );


    var coherenceProgress =
      reduce
        ?
          1
        :
          smoothstep(
            clamp(
              coherenceAge /
              3900,
              0,
              1
            )
          );


    var phaseNodeList =
      phaseNodes.childNodes;


    var phasePoints =
      [];


    for (
      var pn = 0;
      pn < PHASE_COUNT;
      pn++
    ) {

      var lane =
        pn %
        4;


      var around =
        pn /
        PHASE_COUNT *
        TAU;


      var personalPhase =
        pn *
        .73 *
        (
          1 -
          coherenceProgress
        );


      var collectivePhase =
        clock *
        .00155;


      var phase =
        collectivePhase +
        personalPhase;


      var baseRadius =
        R *
        scale *
        (
          .37 +
          lane *
          .105
        );


      var radialMotion =
        Math.sin(
          phase +
          around *
          1.6
        ) *
        (
          15 -
          coherenceProgress *
          8
        );


      var angularMotion =
        Math.sin(
          phase *
          .73 +
          lane
        ) *
        (
          .11 -
          coherenceProgress *
          .055
        );


      var point =
        polar(
          baseRadius +
          radialMotion,
          around +
          angularMotion
        );


      phasePoints.push(
        point
      );


      phaseNodeList[pn]
        .setAttribute(
          "cx",
          point.x.toFixed(1)
        );


      phaseNodeList[pn]
        .setAttribute(
          "cy",
          point.y.toFixed(1)
        );


      phaseNodeList[pn]
        .style.opacity =
        (
          weights.coherence *
          (
            .22 +
            coherenceProgress *
            .58
          )
        ).toFixed(3);
    }


    /*
     * Eight longer filaments connect alternating points as coherence emerges.
     * They resemble a standing relational weave rather than a network graph.
     */
    var phasePathNodes =
      phasePaths.childNodes;


    for (
      var f = 0;
      f < phasePathNodes.length;
      f++
    ) {

      var filament =
        "";


      for (
        var fp = f;
        fp < PHASE_COUNT;
        fp += 8
      ) {

        var filamentPoint =
          phasePoints[fp];


        filament +=
          (
            filament
              ?
                "L"
              :
                "M"
          ) +
          filamentPoint.x.toFixed(1) +
          " " +
          filamentPoint.y.toFixed(1);
      }


      phasePathNodes[f]
        .setAttribute(
          "d",
          filament
        );


      phasePathNodes[f]
        .style.opacity =
        (
          weights.coherence *
          (
            .04 +
            coherenceProgress *
            .31
          )
        ).toFixed(3);
    }


    /*
     * Coherent echoes: rings which become progressively cleaner and more
     * regular as the independent motions phase-lock.
     */
    var echoNodes =
      phaseEchoes.childNodes;


    for (
      var ec = 0;
      ec < echoNodes.length;
      ec++
    ) {

      var ef =
        (
          ec + 1
        ) /
        echoNodes.length;


      var noise =
        (
          1 -
          coherenceProgress
        ) *
        Math.sin(
          clock *
          .001 +
          ec *
          1.17
        ) *
        11;


      var er =
        R *
        scale *
        (
          .24 +
          ef *
          .62
        ) +
        noise;


      echoNodes[ec]
        .setAttribute(
          "cx",
          CX.toFixed(1)
        );


      echoNodes[ec]
        .setAttribute(
          "cy",
          CY.toFixed(1)
        );


      echoNodes[ec]
        .setAttribute(
          "rx",
          (
            er *
            (
              1 +
              (
                1 -
                coherenceProgress
              ) *
              .07 *
              Math.sin(
                ec
              )
            )
          ).toFixed(1)
        );


      echoNodes[ec]
        .setAttribute(
          "ry",
          (
            er *
            (
              1 -
              (
                1 -
                coherenceProgress
              ) *
              .06 *
              Math.cos(
                ec *
                .8
              )
            )
          ).toFixed(1)
        );


      echoNodes[ec]
        .style.opacity =
        (
          weights.coherence *
          (
            .025 +
            coherenceProgress *
            .08
          )
        ).toFixed(3);
    }


    /* ======================================================================
       RECOVERY

       Begin with a strained field.

       Position returns before the whole membrane has finished settling.
       Ghost boundaries make the delayed restoration visible.
       ====================================================================== */

    var visibleRecovery =
      Math.max(
        2,
        recoveryIndex +
        1
      );


    var recoveryPath =
      "";


    for (
      var rp = 0;
      rp < visibleRecovery;
      rp++
    ) {

      var rPoint =
        RECOVERY_POINTS[rp];


      recoveryPath +=
        (
          rp
            ?
              "L"
            :
              "M"
        ) +
        (
          CX +
          rPoint.x *
          R
        ).toFixed(1) +
        " " +
        (
          CY +
          rPoint.y *
          R
        ).toFixed(1);
    }


    recoveryTrail.setAttribute(
      "d",
      recoveryPath
    );


    recoveryTrail.style.opacity =
      (
        weights.recovery *
        .82
      ).toFixed(3);


    var recoveryDotNodes =
      recoveryDots.childNodes;


    for (
      var di = 0;
      di < recoveryDotNodes.length;
      di++
    ) {

      var pathIndex =
        Math.round(
          di *
          (
            RECOVERY_POINTS.length -
            1
          ) /
          (
            recoveryDotNodes.length -
            1
          )
        );


      var dotPoint =
        RECOVERY_POINTS[
          pathIndex
        ];


      recoveryDotNodes[di]
        .setAttribute(
          "cx",
          (
            CX +
            dotPoint.x *
            R
          ).toFixed(1)
        );


      recoveryDotNodes[di]
        .setAttribute(
          "cy",
          (
            CY +
            dotPoint.y *
            R
          ).toFixed(1)
        );


      recoveryDotNodes[di]
        .style.opacity =
        (
          weights.recovery *
          (
            pathIndex <
            visibleRecovery
              ?
                .08 +
                di /
                (
                  recoveryDotNodes.length -
                  1
                ) *
                .46
              :
                0
          )
        ).toFixed(3);
    }


    var ghostNodes =
      recoveryGhosts.childNodes;


    for (
      var gg = 0;
      gg < ghostNodes.length;
      gg++
    ) {

      var ghostProgress =
        clamp(
          membraneRecovery -
          gg *
          .08,
          0,
          1
        );


      var ghostScale =
        lerp(
          .915 +
          gg *
          .012,
          BASE_SCALE +
          gg *
          .004,
          ghostProgress
        );


      var ghostProfile =
        BASE_PROFILE.map(
          function (base, index) {

            var angle =
              angleAt(
                index,
                PROFILE_COUNT
              );


            return (
              base +
              (
                1 -
                ghostProgress
              ) *
              (
                .026 *
                Math.sin(
                  angle *
                  3 +
                  gg *
                  .62
                )
              )
            );
          }
        );


      ghostNodes[gg]
        .setAttribute(
          "d",
          ringFromSamples(
            smoothProfile(
              ghostProfile
            ),
            ghostScale
          )
        );


      ghostNodes[gg]
        .style.opacity =
        (
          weights.recovery *
          (
            .03 +
            gg *
            .013
          ) *
          (
            1 -
            recoveryProgress *
            .58
          )
        ).toFixed(3);
    }


    /*
     * The recovered room becomes visible as atmosphere, not another gauge.
     */
    recoverySpace.setAttribute(
      "cx",
      px.toFixed(1)
    );


    recoverySpace.setAttribute(
      "cy",
      py.toFixed(1)
    );


    recoverySpace.setAttribute(
      "r",
      (
        40 +
        recoveryProgress *
        78
      ).toFixed(1)
    );


    recoverySpace.style.opacity =
      (
        weights.recovery *
        recoveryProgress *
        .07
      ).toFixed(3);
  }


  /* ==========================================================================
     CANVAS WORLD
     ========================================================================== */

  var DPR = 1;
  var canvasW = 0;
  var canvasH = 0;

  var PARTICLES = [];
  var STREAMS = [];


  function resizeCanvas() {

    if (!ctx) return;


    var rect =
      canvas.getBoundingClientRect();


    DPR =
      Math.min(
        2,
        window.devicePixelRatio ||
        1
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


  function seedCanvas() {

    PARTICLES.length = 0;
    STREAMS.length = 0;


    for (
      var i = 0;
      i < 96;
      i++
    ) {

      PARTICLES.push({

        x:
          hash(
            i *
            13 +
            2
          ),

        y:
          hash(
            i *
            19 +
            7
          ),

        depth:
          .15 +
          hash(
            i *
            23 +
            4
          ) *
          .85,

        phase:
          hash(
            i *
            31 +
            8
          ) *
          TAU,

        speed:
          .08 +
          hash(
            i *
            17 +
            5
          ) *
          .32
      });
    }


    for (
      var s = 0;
      s < 34;
      s++
    ) {

      STREAMS.push({

        y:
          hash(
            s *
            41 +
            3
          ),

        phase:
          hash(
            s *
            37 +
            9
          ) *
          TAU,

        amp:
          .012 +
          hash(
            s *
            17 +
            2
          ) *
          .042,

        speed:
          .08 +
          hash(
            s *
            29 +
            5
          ) *
          .18,

        warm:
          hash(
            s *
            11 +
            8
          ) >
          .72
      });
    }
  }


  function stageGeometry() {

    var stage =
      svg.getBoundingClientRect();


    var canvasRect =
      canvas.getBoundingClientRect();


    return {

      x:
        stage.left -
        canvasRect.left +
        stage.width /
        2,

      y:
        stage.top -
        canvasRect.top +
        stage.height /
        2,

      scale:
        stage.width /
        VIEW
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
      stageGeometry();


    var time =
      now /
      1000;


    /* ======================================================================
       DISTRIBUTED FLOW
       ====================================================================== */

    STREAMS.forEach(
      function (stream, index) {

        ctx.beginPath();


        var steps =
          68;


        for (
          var st = 0;
          st <= steps;
          st++
        ) {

          var u =
            st /
            steps;


          var x =
            u *
            canvasW;


          var y =
            (
              stream.y *
              canvasH
            ) +
            Math.sin(
              u *
              TAU *
              (
                1.1 +
                index %
                4 *
                .19
              ) +
              stream.phase +
              time *
              stream.speed
            ) *
            stream.amp *
            canvasH;


          var dx =
            x -
            stage.x;


          var dy =
            y -
            stage.y;


          var dist =
            Math.sqrt(
              dx *
              dx +
              dy *
              dy
            );


          var fieldInfluence =
            Math.exp(
              -dist /
              Math.max(
                180,
                stage.scale *
                270
              )
            );


          /* --------------------------------------------------------------
             BOUNDARY
             -------------------------------------------------------------- */

          if (
            weights.boundary >
            .01
          ) {

            y +=
              Math.sin(
                time *
                .4 +
                index *
                .8
              ) *
              fieldInfluence *
              stage.scale *
              7 *
              weights.boundary;
          }


          /* --------------------------------------------------------------
             STABILITY

             A directional wave crosses the whole atmosphere.
             -------------------------------------------------------------- */

          if (
            weights.stability >
            .01
          ) {

            var stabilityAge =
              Math.max(
                0,
                clock -
                stabilityStart
              );


            var front =
              clamp(
                stabilityAge /
                1250,
                0,
                1
              );


            var waveX =
              canvasW *
              (
                .18 +
                front *
                .68
              );


            var waveDistance =
              Math.abs(
                x -
                waveX
              );


            var waveInfluence =
              Math.exp(
                -waveDistance /
                90
              ) *
              weights.stability *
              (
                1 -
                front *
                .45
              );


            y +=
              Math.sin(
                y *
                .022 +
                time *
                4.1
              ) *
              waveInfluence *
              19;
          }


          /* --------------------------------------------------------------
             COHERENCE

             Independent streams increasingly share a collective wave.
             -------------------------------------------------------------- */

          if (
            weights.coherence >
            .01
          ) {

            var coherenceAge =
              Math.max(
                0,
                clock -
                coherenceStart
              );


            var coherent =
              smoothstep(
                clamp(
                  coherenceAge /
                  3900,
                  0,
                  1
                )
              );


            var collective =
              Math.sin(
                u *
                TAU *
                1.55 +
                time *
                .72
              ) *
              17;


            y =
              lerp(
                y,
                stage.y +
                (
                  y -
                  stage.y
                ) *
                .88 +
                collective,
                coherent *
                fieldInfluence *
                .36 *
                weights.coherence
              );
          }


          /* --------------------------------------------------------------
             RECOVERY

             Early recovery appears kinked and compressed.
             The field gradually regains long continuous paths.
             -------------------------------------------------------------- */

          if (
            weights.recovery >
            .01
          ) {

            var recoveryAge =
              Math.max(
                0,
                clock -
                recoveryStart
              );


            var recovery =
              smoothstep(
                clamp(
                  recoveryAge /
                  4500,
                  0,
                  1
                )
              );


            var strain =
              (
                1 -
                recovery
              ) *
              fieldInfluence *
              weights.recovery;


            y +=
              Math.sin(
                u *
                TAU *
                5.5 +
                index *
                .61
              ) *
              strain *
              22;


            /*
             * As recovery progresses, stream lines become longer and smoother
             * around the central field.
             */
            y =
              lerp(
                y,
                stage.y +
                (
                  y -
                  stage.y
                ) *
                .94,
                recovery *
                fieldInfluence *
                .15 *
                weights.recovery
              );
          }


          if (
            st === 0
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


        var alpha =
          .012 +
          weights.coherence *
          .012 +
          weights.recovery *
          .006;


        ctx.strokeStyle =
          stream.warm
            ?
              "rgba(236,199,126," +
              alpha +
              ")"
            :
              "rgba(102,224,237," +
              alpha +
              ")";


        ctx.lineWidth =
          .55;


        ctx.stroke();
      }
    );


    /* ======================================================================
       PARTICLES
       ====================================================================== */

    PARTICLES.forEach(
      function (particle, index) {

        var x =
          particle.x *
          canvasW +
          Math.sin(
            time *
            particle.speed +
            particle.phase
          ) *
          16 *
          particle.depth;


        var y =
          particle.y *
          canvasH +
          Math.cos(
            time *
            particle.speed *
            .72 +
            particle.phase
          ) *
          10 *
          particle.depth;


        /*
         * Under coherence, particles begin sharing a very subtle collective
         * orbit without becoming identical.
         */
        if (
          weights.coherence >
          .01
        ) {

          var ca =
            Math.max(
              0,
              clock -
              coherenceStart
            );


          var cp =
            smoothstep(
              clamp(
                ca /
                3900,
                0,
                1
              )
            );


          var dx =
            x -
            stage.x;


          var dy =
            y -
            stage.y;


          var dist =
            Math.sqrt(
              dx *
              dx +
              dy *
              dy
            );


          var influence =
            Math.exp(
              -dist /
              Math.max(
                180,
                stage.scale *
                320
              )
            );


          var orbit =
            time *
            .12 +
            index *
            .17;


          x +=
            Math.cos(
              orbit
            ) *
            cp *
            influence *
            5 *
            weights.coherence;


          y +=
            Math.sin(
              orbit
            ) *
            cp *
            influence *
            5 *
            weights.coherence;
        }


        var alpha =
          (
            .025 +
            particle.depth *
            .075
          ) *
          (
            .72 +
            weights.coherence *
            .25
          );


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          .4 +
          particle.depth *
          .9,
          0,
          TAU
        );


        ctx.fillStyle =
          index %
          6 ===
          0
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
       STABILITY — SCREEN-SCALE EVENT

       A soft luminous pressure front makes the entire section participate.
       ====================================================================== */

    if (
      weights.stability >
      .01
    ) {

      var age =
        Math.max(
          0,
          clock -
          stabilityStart
        );


      var progress =
        clamp(
          age /
          1500,
          0,
          1
        );


      if (
        progress <
        1
      ) {

        var waveX =
          canvasW *
          (
            .12 +
            progress *
            .76
          );


        var gradient =
          ctx.createLinearGradient(
            waveX -
            90,
            0,
            waveX +
            90,
            0
          );


        gradient.addColorStop(
          0,
          "rgba(236,199,126,0)"
        );


        gradient.addColorStop(
          .5,
          "rgba(236,199,126," +
          (
            .025 *
            weights.stability *
            (
              1 -
              progress *
              .4
            )
          ) +
          ")"
        );


        gradient.addColorStop(
          1,
          "rgba(102,224,237,0)"
        );


        ctx.fillStyle =
          gradient;


        ctx.fillRect(
          waveX -
          90,
          0,
          180,
          canvasH
        );
      }
    }
  }


  /* ==========================================================================
     ANIMATION
     ========================================================================== */

  var raf =
    0;


  var last =
    0;


  var visible =
    true;


  function frame(now) {

    if (!visible) {

      raf = 0;
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


    clock +=
      dt;


    var k =
      1 -
      Math.exp(
        -dt /
        280
      );


    Object.keys(weights)
      .forEach(
        function (key) {

          weights[key] =
            lerp(
              weights[key],
              targets[key],
              k
            );
        }
      );


    /*
     * Stability repeats only while selected.
     */
    if (
      activeAspect ===
      "stability" &&
      clock >
      nextStability
    ) {

      stabilityStart =
        clock;


      nextStability =
        clock +
        5000;
    }


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
     BUTTONS
     ========================================================================== */

  buttons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          var key =
            button.getAttribute(
              "data-aspect"
            );


          /*
           * Clicking an already active temporal phenomenon replays it.
           */
          if (
            key ===
            activeAspect
          ) {

            if (
              key ===
              "stability"
            ) {

              stabilityStart =
                clock;


              nextStability =
                clock +
                5000;
            }


            if (
              key ===
              "coherence"
            ) {

              coherenceStart =
                clock;
            }


            if (
              key ===
              "recovery"
            ) {

              recoveryStart =
                clock;
            }

          } else {

            setAspect(
              key
            );
          }


          ensureAnimation();
        }
      );
    }
  );


  /* ==========================================================================
     CANVAS
     ========================================================================== */

  if (
    ctx &&
    !reduce
  ) {

    seedCanvas();
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
     OBSERVER
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
     INITIAL STATE
     ========================================================================== */

  setAspect(
    "boundary"
  );


  if (
    reduce
  ) {

    Object.keys(weights)
      .forEach(
        function (key) {

          weights[key] =
            targets[key];
        }
      );


    drawSVG(0);

  } else {

    ensureAnimation();
  }

})();
