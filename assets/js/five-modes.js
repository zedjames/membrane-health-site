/* The five modes — extracted from the standalone reference. */
(function () {
  "use strict";


  /* ==========================================================================
     CONSTANTS
     ========================================================================== */

  var NS =
    "http://www.w3.org/2000/svg";


  var TAU =
    Math.PI * 2;


  var W =
    1100;


  var H =
    650;


  var CX =
    550;


  var CY =
    300;


  var R =
    192;


  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* ==========================================================================
     DOM
     ========================================================================== */

  var host =
    document.querySelector(
      ".fm"
    );


  var svg =
    document.getElementById(
      "fm-field"
    );


  var scene =
    document.getElementById(
      "fm-scene"
    );


  var phenomena =
    document.getElementById(
      "fm-phenomena"
    );


  var world =
    document.getElementById(
      "fm-world"
    );


  var ctx =
    phenomena.getContext("2d");


  var worldCtx =
    world.getContext("2d");


  var buttons =
    Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-mode]"
      )
    );


  if (
    !svg ||
    !scene
  ) {
    return;
  }


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  function el(name, attrs) {

    var node =
      document.createElementNS(
        NS,
        name
      );


    Object.keys(
      attrs || {}
    )
    .forEach(
      function (key) {

        node.setAttribute(
          key,
          attrs[key]
        );
      }
    );


    return node;
  }


  function clamp(v, lo, hi) {

    return Math.max(
      lo,
      Math.min(
        hi,
        v
      )
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


  function polar(
    cx,
    cy,
    radius,
    angle
  ) {

    return {
      x:
        cx +
        Math.cos(
          angle
        ) *
        radius,

      y:
        cy +
        Math.sin(
          angle
        ) *
        radius
    };
  }


  function dimensionAngle(index) {

    return (
      index /
      9 *
      TAU -
      Math.PI /
      2
    );
  }


  function visualFactor(value) {

    /*
       Compress real conditioning into an elegant but meaningful visual range.

       .85 remains visibly guarded.
       1.35 becomes clearly expansive.
    */

    return (
      .79 +
      (
        value -
        .70
      ) *
      .64
    );
  }


  /* ==========================================================================
     MODES

     factors:
       0 heart
       1 sleep
       2 activity
       3 recovery
       4 stability
       5 thermal
       6 metabolic
       7 stress
       8 overall
     ========================================================================== */

  var MODES = {


    sleep: {

      name:
        "Sleep",

      description:
        "Deep overnight restoration.",

      duration:
        7800,

      factors: [
        1.10,
        .85,
        1.40,
        1.10,
        1.10,
        1.10,
        1.10,
        1.20,
        1.10
      ],

      position: {
        x:
          -.13,

        y:
          .11
      },

      energy:
        .28,

      coherence:
        .78,

      camera: {
        scale:
          1.16,

        x:
          0,

        y:
          14,

        rotation:
          0
      }
    },


    stress: {

      name:
        "Stress",

      description:
        "Elevated demand and active adaptation.",

      duration:
        7200,

      factors: [
        1.15,
        .90,
        1.00,
        .90,
        1.00,
        1.00,
        1.00,
        1.25,
        1.00
      ],

      position: {
        x:
          .54,

        y:
          -.19
      },

      energy:
        .93,

      coherence:
        .45,

      camera: {
        scale:
          1.06,

        x:
          18,

        y:
          -6,

        rotation:
          -1.6
      }
    },


    recovery: {

      name:
        "Recovery",

      description:
        "Reserves rebuilding as capacity returns.",

      duration:
        9000,

      factors: [
        1.00,
        1.00,
        1.30,
        .85,
        1.00,
        1.00,
        1.00,
        1.00,
        1.00
      ],

      position: {
        x:
          .16,

        y:
          .13
      },

      energy:
        .49,

      coherence:
        .70,

      camera: {
        scale:
          .96,

        x:
          0,

        y:
          3,

        rotation:
          0
      }
    },


    flow: {

      name:
        "Flow",

      description:
        "Organization coordinated and sustainable.",

      duration:
        8200,

      factors: [
        1.05,
        1.05,
        1.05,
        1.05,
        1.05,
        1.05,
        1.05,
        1.05,
        1.05
      ],

      position: {
        x:
          .26,

        y:
          -.01
      },

      energy:
        .70,

      coherence:
        .96,

      camera: {
        scale:
          1.03,

        x:
          -10,

        y:
          0,

        rotation:
          0
      }
    },


    nova: {

      name:
        "Nova",

      description:
        "Deep reserve, clean relationships, surplus capacity.",

      duration:
        10500,

      factors: [
        1.22,
        1.22,
        1.22,
        1.22,
        1.22,
        1.22,
        1.22,
        1.22,
        1.22
      ],

      position: {
        x:
          .18,

        y:
          -.07
      },

      energy:
        1.00,

      coherence:
        1.00,

      camera: {
        scale:
          1.06,

        x:
          0,

        y:
          -3,

        rotation:
          0
      }
    }

  };


  /* ==========================================================================
     PERSISTENT SYSTEM STATE
     ========================================================================== */

  var system = {

    factors:
      MODES.recovery.factors.slice(),

    position: {
      x:
        MODES.recovery.position.x,

      y:
        MODES.recovery.position.y
    },

    energy:
      MODES.recovery.energy,

    coherence:
      MODES.recovery.coherence,

    camera: {
      scale:
        MODES.recovery.camera.scale,

      x:
        MODES.recovery.camera.x,

      y:
        MODES.recovery.camera.y,

      rotation:
        MODES.recovery.camera.rotation
    },

    history: [
      {
        x:
          .54,

        y:
          -.19
      },

      {
        x:
          .41,

        y:
          -.11
      },

      {
        x:
          .29,

        y:
          .02
      },

      {
        x:
          .16,

        y:
          .13
      }
    ]
  };


  var activeMode =
    "recovery";


  var targetMode =
    MODES.recovery;


  var previousMode =
    "stress";


  var modeStart =
    0;


  var clock =
    0;


  /*
     Snapshot captured whenever a new mode begins.

     Recovery can therefore remember the ACTUAL world that existed before it.
  */

  var eventOrigin = {
    factors:
      system.factors.slice(),

    position: {
      x:
        system.position.x,

      y:
        system.position.y
    },

    energy:
      system.energy
  };


  /* ==========================================================================
     MODE CROSSFADE WEIGHTS
     ========================================================================== */

  var weights = {
    sleep:
      0,

    stress:
      0,

    recovery:
      1,

    flow:
      0,

    nova:
      0
  };


  var weightTargets = {
    sleep:
      0,

    stress:
      0,

    recovery:
      1,

    flow:
      0,

    nova:
      0
  };


  /* ==========================================================================
     EVENT PROGRESS
     ========================================================================== */

  function eventProgress() {

    var mode =
      MODES[
        activeMode
      ];


    return smoothstep(
      clamp(
        (
          clock -
          modeStart
        ) /
        mode.duration,
        0,
        1
      )
    );
  }


  function eventWindow(
    p,
    start,
    end
  ) {

    return smoothstep(
      (
        p -
        start
      ) /
      (
        end -
        start
      )
    );
  }


  function pulseWindow(
    p,
    start,
    peak,
    end
  ) {

    if (
      p <=
      start ||
      p >=
      end
    ) {
      return 0;
    }


    if (
      p <
      peak
    ) {

      return smoothstep(
        (
          p -
          start
        ) /
        (
          peak -
          start
        )
      );
    }


    return (
      1 -
      smoothstep(
        (
          p -
          peak
        ) /
        (
          end -
          peak
        )
      )
    );
  }


  /* ==========================================================================
     SVG DEFS
     ========================================================================== */

  var defs =
    el("defs");


  var edgeGradient =
    el(
      "linearGradient",
      {
        id:
          "fm-edge-gradient",

        x1:
          "7%",

        y1:
          "92%",

        x2:
          "92%",

        y2:
          "8%"
      }
    );


  [
    [
      "0%",
      "var(--glow)"
    ],

    [
      "45%",
      "var(--glow-soft)"
    ],

    [
      "73%",
      "var(--aqua)"
    ],

    [
      "100%",
      "var(--aqua)"
    ]
  ]
  .forEach(
    function (stop) {

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
    }
  );


  var fieldGradient =
    el(
      "radialGradient",
      {
        id:
          "fm-field-gradient",

        cx:
          "50%",

        cy:
          "46%",

        r:
          "71%"
      }
    );


  [
    [
      "0%",
      "var(--aqua-deep)",
      ".22"
    ],

    [
      "60%",
      "var(--aqua-deep)",
      ".072"
    ],

    [
      "83%",
      "var(--glow)",
      ".026"
    ],

    [
      "100%",
      "var(--glow)",
      ".004"
    ]
  ]
  .forEach(
    function (stop) {

      fieldGradient.appendChild(
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
    }
  );


  defs.appendChild(
    edgeGradient
  );


  defs.appendChild(
    fieldGradient
  );


  svg.insertBefore(
    defs,
    scene
  );


  /* ==========================================================================
     ENVELOPE PATH
     ========================================================================== */

  function envelopePath(
    factors,
    scale
  ) {

    var count =
      108;


    var points =
      [];


    for (
      var i = 0;
      i <
      count;
      i++
    ) {

      var coordinate =
        i /
        count *
        9;


      var a =
        Math.floor(
          coordinate
        ) %
        9;


      var b =
        (
          a +
          1
        ) %
        9;


      var blend =
        smoothstep(
          coordinate -
          Math.floor(
            coordinate
          )
        );


      var factor =
        factors[a] *
        (
          1 -
          blend
        ) +
        factors[b] *
        blend;


      factor =
        visualFactor(
          factor
        );


      var angle =
        i /
        count *
        TAU -
        Math.PI /
        2;


      points.push(
        polar(
          CX,
          CY,
          R *
          scale *
          factor,
          angle
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
      j <
      count;
      j++
    ) {

      var p0 =
        points[
          (
            j -
            1 +
            count
          ) %
          count
        ];


      var p1 =
        points[j];


      var p2 =
        points[
          (
            j +
            1
          ) %
          count
        ];


      var p3 =
        points[
          (
            j +
            2
          ) %
          count
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


    return (
      d +
      "Z"
    );
  }


  /* ==========================================================================
     BASE SVG
     ========================================================================== */

  var identity =
    scene.appendChild(
      el(
        "circle",
        {
          class:
            "fm-identity",

          cx:
            CX,

          cy:
            CY,

          r:
            R *
            1.18
        }
      )
    );


  var identityInner =
    scene.appendChild(
      el(
        "circle",
        {
          class:
            "fm-identity-inner",

          cx:
            CX,

          cy:
            CY,

          r:
            R *
            .70
        }
      )
    );


  var fill =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-fill",

          fill:
            "url(#fm-field-gradient)"
        }
      )
    );


  var sectorGroup =
    scene.appendChild(
      el("g")
    );


  var historyPath =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-history"
        }
      )
    );


  var historyDots =
    scene.appendChild(
      el("g")
    );


  var contourGroup =
    scene.appendChild(
      el("g")
    );


  var threadGroup =
    scene.appendChild(
      el("g")
    );


  var nodeGroup =
    scene.appendChild(
      el("g")
    );


  var modeLayer =
    scene.appendChild(
      el("g")
    );


  var guardLayer =
    scene.appendChild(
      el("g")
    );


  var bloom =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-boundary-bloom",

          stroke:
            "url(#fm-edge-gradient)"
        }
      )
    );


  var deepBoundary =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-boundary-deep",

          stroke:
            "url(#fm-edge-gradient)"
        }
      )
    );


  var boundary =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-boundary",

          stroke:
            "url(#fm-edge-gradient)"
        }
      )
    );


  var boundaryBeads =
    scene.appendChild(
      el(
        "path",
        {
          class:
            "fm-boundary-beads",

          stroke:
            "url(#fm-edge-gradient)"
        }
      )
    );


  var positionHalo =
    scene.appendChild(
      el(
        "circle",
        {
          class:
            "fm-position-halo",

          fill:
            "var(--aqua)"
        }
      )
    );


  var positionRing =
    scene.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm-position-ring"
        }
      )
    );


  var position =
    scene.appendChild(
      el(
        "circle",
        {
          class:
            "fm-position",

          r:
            "6.2"
        }
      )
    );


  var positionCore =
    scene.appendChild(
      el(
        "circle",
        {
          class:
            "fm-position-core",

          r:
            "2.2"
        }
      )
    );


  var modeName =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "fm-mode-name",

          x:
            "550",

          y:
            "580",

          "text-anchor":
            "middle"
        }
      )
    );


  var modeDescription =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "fm-mode-desc",

          x:
            "550",

          y:
            "609",

          "text-anchor":
            "middle"
        }
      )
    );


  /* ==========================================================================
     REPEATED BASE OBJECTS
     ========================================================================== */

  var sectors =
    [];


  for (
    var s = 0;
    s <
    9;
    s++
  ) {

    var line =
      sectorGroup.appendChild(
        el(
          "line",
          {
            class:
              "fm-sector"
          }
        )
      );


    var tip =
      sectorGroup.appendChild(
        el(
          "circle",
          {
            class:
              "fm-sector-tip",

            r:
              "3"
          }
        )
      );


    sectors.push({
      line:
        line,

      tip:
        tip
    });
  }


  var contours =
    [];


  for (
    var c = 0;
    c <
    24;
    c++
  ) {

    contours.push(
      contourGroup.appendChild(
        el(
          "path",
          {
            class:
              "fm-contour",

            stroke:
              c >
              17
                ?
                  "var(--glow)"
                :
                  "var(--aqua)"
          }
        )
      )
    );
  }


  var threads =
    [];


  for (
    var t = 0;
    t <
    42;
    t++
  ) {

    threads.push(
      threadGroup.appendChild(
        el(
          "path",
          {
            class:
              "fm-thread",

            stroke:
              t %
              8 ===
              0
                ?
                  "var(--glow)"
                :
                  "var(--aqua)"
          }
        )
      )
    );
  }


  var nodes =
    [];


  for (
    var n = 0;
    n <
    52;
    n++
  ) {

    nodes.push(
      nodeGroup.appendChild(
        el(
          "circle",
          {
            class:
              "fm-node",

            fill:
              n %
              10 ===
              0
                ?
                  "var(--glow)"
                :
                  "var(--aqua)",

            r:
              (
                1.2 +
                hash(
                  n *
                  17
                ) *
                1.8
              ).toFixed(2)
          }
        )
      )
    );
  }


  var hDots =
    [];


  for (
    var h = 0;
    h <
    14;
    h++
  ) {

    hDots.push(
      historyDots.appendChild(
        el(
          "circle",
          {
            class:
              "fm-history-dot",

            r:
              (
                1.1 +
                h /
                13 *
                1.5
              ).toFixed(2)
          }
        )
      )
    );
  }


  /* ==========================================================================
     GUARDED REGIONS
     ========================================================================== */

  function makeGuard(
    stroke
  ) {

    return {

      bloom:
        guardLayer.appendChild(
          el(
            "ellipse",
            {
              class:
                "fm-guard-bloom",

              stroke:
                stroke
            }
          )
        ),

      ring:
        guardLayer.appendChild(
          el(
            "ellipse",
            {
              class:
                "fm-guard",

              stroke:
                stroke
            }
          )
        )
    };
  }


  var guardA =
    makeGuard(
      "var(--glow)"
    );


  var guardB =
    makeGuard(
      "var(--aqua)"
    );


  /* ==========================================================================
     SLEEP LAYER
     ========================================================================== */

  var sleepShells =
    [];


  var sleepWaves =
    [];


  var sleepRoutes =
    [];


  for (
    var sr = 0;
    sr <
    13;
    sr++
  ) {

    sleepShells.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm-sleep-shell"
          }
        )
      )
    );
  }


  for (
    var sw = 0;
    sw <
    8;
    sw++
  ) {

    sleepWaves.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm-sleep-wave"
          }
        )
      )
    );
  }


  for (
    var sroute = 0;
    sroute <
    8;
    sroute++
  ) {

    sleepRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-sleep-route"
          }
        )
      )
    );
  }


  var sleepGate =
    modeLayer.appendChild(
      el(
        "circle",
        {
          class:
            "fm-sleep-gate",

          r:
            "3.7"
        }
      )
    );


  /* ==========================================================================
     STRESS LAYER
     ========================================================================== */

  var stressFronts =
    [];


  var stressRoutes =
    [];


  var stressNodes =
    [];


  var stressHold =
    modeLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm-stress-hold"
        }
      )
    );


  for (
    var sf = 0;
    sf <
    9;
    sf++
  ) {

    stressFronts.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm-stress-front"
          }
        )
      )
    );
  }


  for (
    var str = 0;
    str <
    10;
    str++
  ) {

    stressRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-stress-route"
          }
        )
      )
    );
  }


  for (
    var stn = 0;
    stn <
    18;
    stn++
  ) {

    stressNodes.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm-stress-node",

            r:
              (
                1.1 +
                hash(
                  stn *
                  13
                ) *
                1.7
              ).toFixed(2)
          }
        )
      )
    );
  }


  /* ==========================================================================
     RECOVERY LAYER
     ========================================================================== */

  var recoveryGhosts =
    [];


  var recoveryRelease =
    [];


  var recoveryKnots =
    [];


  for (
    var rg = 0;
    rg <
    6;
    rg++
  ) {

    recoveryGhosts.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-recovery-ghost"
          }
        )
      )
    );
  }


  for (
    var rr = 0;
    rr <
    14;
    rr++
  ) {

    recoveryRelease.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-recovery-release"
          }
        )
      )
    );
  }


  for (
    var rk = 0;
    rk <
    12;
    rk++
  ) {

    recoveryKnots.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm-recovery-knot"
          }
        )
      )
    );
  }


  var recoveryReserve =
    modeLayer.appendChild(
      el(
        "circle",
        {
          class:
            "fm-recovery-reserve"
        }
      )
    );


  var recoveryRoute =
    modeLayer.appendChild(
      el(
        "path",
        {
          class:
            "fm-recovery-route"
        }
      )
    );


  /* ==========================================================================
     FLOW LAYER
     ========================================================================== */

  var flowRoutes =
    [];


  var flowPulses =
    [];


  var flowFront =
    modeLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm-flow-front"
        }
      )
    );


  for (
    var fr = 0;
    fr <
    19;
    fr++
  ) {

    flowRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-flow-route"
          }
        )
      )
    );
  }


  for (
    var fp = 0;
    fp <
    17;
    fp++
  ) {

    flowPulses.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm-flow-pulse",

            r:
              "2.5"
          }
        )
      )
    );
  }


  /* ==========================================================================
     NOVA LAYER
     ========================================================================== */

  var novaNodes =
    [];


  var novaLinks =
    [];


  var novaRoutes =
    [];


  var novaChecks =
    [];


  for (
    var nn = 0;
    nn <
    42;
    nn++
  ) {

    novaNodes.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm-nova-node",

            r:
              (
                1.2 +
                hash(
                  nn *
                  11
                ) *
                1.7
              ).toFixed(2)
          }
        )
      )
    );
  }


  for (
    var nl = 0;
    nl <
    38;
    nl++
  ) {

    novaLinks.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-nova-link"
          }
        )
      )
    );
  }


  for (
    var nr = 0;
    nr <
    14;
    nr++
  ) {

    novaRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm-nova-route"
          }
        )
      )
    );


    novaChecks.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm-nova-check"
          }
        )
      )
    );
  }


  /* ==========================================================================
     MODE CHANGE
     ========================================================================== */

  function selectMode(
    key
  ) {

    if (
      !MODES[key]
    ) {
      return;
    }


    /*
       Same mode:
       replay its story from the current posture.
    */

    if (
      key ===
      activeMode
    ) {

      captureEventOrigin();

      modeStart =
        clock;

      return;
    }


    previousMode =
      activeMode;


    activeMode =
      key;


    targetMode =
      MODES[key];


    captureEventOrigin();


    modeStart =
      clock;


    Object.keys(
      weightTargets
    )
    .forEach(
      function (name) {

        weightTargets[name] =
          name ===
          key
            ?
              1
            :
              0;
      }
    );


    system.history.push({
      x:
        system.position.x,

      y:
        system.position.y
    });


    if (
      system.history.length >
      20
    ) {

      system.history.shift();
    }


    buttons.forEach(
      function (button) {

        button.setAttribute(
          "aria-pressed",

          String(
            button.getAttribute(
              "data-mode"
            ) ===
            key
          )
        );
      }
    );


    updateAurora(
      key
    );


    ensureAnimation();
  }


  function captureEventOrigin() {

    eventOrigin = {

      factors:
        system.factors.slice(),

      position: {
        x:
          system.position.x,

        y:
          system.position.y
      },

      energy:
        system.energy
    };
  }


  /* ==========================================================================
     PAGE ATMOSPHERE
     ========================================================================== */

  function updateAurora(
    key
  ) {

    var aurora =
      host.querySelector(
        ".fm__aurora"
      );


    if (
      key ===
      "sleep"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 47% 58%,color-mix(in srgb,var(--glow-soft) 6%,transparent),transparent 38%)";


      host.style.setProperty(
        "--fm-aurora-scale",
        ".80"
      );


      host.style.setProperty(
        "--fm-aurora-y",
        "6%"
      );


      host.style.setProperty(
        "--fm-aurora-x",
        "-1%"
      );

    } else if (
      key ===
      "stress"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 61% 42%,color-mix(in srgb,var(--status-ease) 14%,transparent),transparent 40%)";


      host.style.setProperty(
        "--fm-aurora-scale",
        "1.10"
      );


      host.style.setProperty(
        "--fm-aurora-x",
        "5%"
      );


      host.style.setProperty(
        "--fm-aurora-y",
        "-2%"
      );

    } else if (
      key ===
      "flow"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 52% 50%,color-mix(in srgb,var(--aqua) 11%,transparent),transparent 46%)";


      host.style.setProperty(
        "--fm-aurora-scale",
        "1.08"
      );


      host.style.setProperty(
        "--fm-aurora-x",
        "1%"
      );


      host.style.setProperty(
        "--fm-aurora-y",
        "0%"
      );

    } else if (
      key ===
      "nova"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 50% 47%,color-mix(in srgb,var(--glow) 14%,transparent),transparent 50%)";


      host.style.setProperty(
        "--fm-aurora-scale",
        "1.28"
      );


      host.style.setProperty(
        "--fm-aurora-x",
        "0%"
      );


      host.style.setProperty(
        "--fm-aurora-y",
        "-2%"
      );

    } else {

      aurora.style.background =
        "radial-gradient(ellipse at 50% 53%,color-mix(in srgb,var(--status-go) 8%,transparent),transparent 43%)";


      host.style.setProperty(
        "--fm-aurora-scale",
        "1"
      );


      host.style.setProperty(
        "--fm-aurora-x",
        "0%"
      );


      host.style.setProperty(
        "--fm-aurora-y",
        "1%"
      );
    }
  }


  /* ==========================================================================
     CAMERA
     ========================================================================== */

  function updateCamera() {

    scene.setAttribute(
      "transform",

      "translate(" +
      system.camera.x.toFixed(2) +
      " " +
      system.camera.y.toFixed(2) +
      ") " +

      "translate(" +
      CX +
      " " +
      CY +
      ") " +

      "rotate(" +
      system.camera.rotation.toFixed(2) +
      ") " +

      "scale(" +
      system.camera.scale.toFixed(4) +
      ") " +

      "translate(" +
      (-CX) +
      " " +
      (-CY) +
      ")"
    );
  }


  /* ==========================================================================
     CORE SYSTEM DRAW
     ========================================================================== */

  function drawCore(
    now
  ) {

    updateCamera();


    var path =
      envelopePath(
        system.factors,
        1
      );


    fill.setAttribute(
      "d",
      path
    );


    bloom.setAttribute(
      "d",
      path
    );


    deepBoundary.setAttribute(
      "d",
      path
    );


    boundary.setAttribute(
      "d",
      path
    );


    boundaryBeads.setAttribute(
      "d",
      path
    );


    bloom.style.opacity =
      (
        .07 +
        system.energy *
        .17
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       NINE CONDITIONED DIRECTIONS
       ---------------------------------------------------------------------- */

    sectors.forEach(
      function (sector, index) {

        var angle =
          dimensionAngle(
            index
          );


        var radius =
          R *
          visualFactor(
            system.factors[
              index
            ]
          );


        var inner =
          polar(
            CX,
            CY,
            R *
            .23,
            angle
          );


        var outer =
          polar(
            CX,
            CY,
            radius,
            angle
          );


        sector.line.setAttribute(
          "x1",
          inner.x
        );


        sector.line.setAttribute(
          "y1",
          inner.y
        );


        sector.line.setAttribute(
          "x2",
          outer.x
        );


        sector.line.setAttribute(
          "y2",
          outer.y
        );


        sector.tip.setAttribute(
          "cx",
          outer.x
        );


        sector.tip.setAttribute(
          "cy",
          outer.y
        );


        sector.tip.style.opacity =
          (
            .02 +
            Math.abs(
              system.factors[
                index
              ] -
              1
            ) *
            .32
          ).toFixed(3);
      }
    );


    /* ----------------------------------------------------------------------
       INTERIOR CONTOURS
       ---------------------------------------------------------------------- */

    contours.forEach(
      function (contour, index) {

        var f =
          (
            index +
            1
          ) /
          contours.length;


        var factors =
          system.factors.map(
            function (value) {

              return lerp(
                1,
                value,
                .35 +
                f *
                .65
              );
            }
          );


        /*
           During Stress, inner geometry experiences directional shear.

           During Sleep, deepest layers become more concentric.

           During Flow/Nova, topology grows more regular.
        */

        if (
          weights.stress >
          .01
        ) {

          factors =
            factors.map(
              function (value, i) {

                return (
                  value +
                  weights.stress *
                  (
                    1 -
                    f
                  ) *
                  .03 *
                  Math.sin(
                    i *
                    .9 +
                    now *
                    .001
                  )
                );
              }
            );
        }


        contour.setAttribute(
          "d",
          envelopePath(
            factors,
            .13 +
            f *
            .82
          )
        );


        contour.style.opacity =
          (
            .02 +
            (
              1 -
              f
            ) *
            (
              .09 +
              system.coherence *
              .06
            )
          ).toFixed(3);
      }
    );


    /* ----------------------------------------------------------------------
       RELATIONAL THREADS
       ---------------------------------------------------------------------- */

    threads.forEach(
      function (thread, index) {

        var a =
          hash(
            index *
            17 +
            3
          ) *
          TAU;


        var b =
          a +
          1.0 +
          hash(
            index *
            29 +
            7
          ) *
          2.1;


        var p0 =
          polar(
            CX,
            CY,
            R *
            (
              .18 +
              hash(
                index *
                11
              ) *
              .50
            ),
            a
          );


        var p1 =
          polar(
            CX,
            CY,
            R *
            (
              .40 +
              hash(
                index *
                31
              ) *
              .40
            ),
            b
          );


        var disorder =
          (
            1 -
            system.coherence
          ) *
          .52;


        var control =
          polar(
            CX,
            CY,
            R *
            (
              .16 +
              hash(
                index *
                7
              ) *
              .33
            ),
            (
              a +
              b
            ) /
            2 +
            Math.sin(
              now *
              .00045 +
              index
            ) *
            disorder
          );


        thread.setAttribute(
          "d",
          "M" +
          p0.x.toFixed(1) +
          " " +
          p0.y.toFixed(1) +
          "Q" +
          control.x.toFixed(1) +
          " " +
          control.y.toFixed(1) +
          "," +
          p1.x.toFixed(1) +
          " " +
          p1.y.toFixed(1)
        );


        thread.style.opacity =
          (
            .025 +
            system.coherence *
            (
              .05 +
              hash(
                index *
                13
              ) *
              .14
            )
          ).toFixed(3);
      }
    );


    /* ----------------------------------------------------------------------
       NODES
       ---------------------------------------------------------------------- */

    nodes.forEach(
      function (node, index) {

        var angle =
          hash(
            index *
            37 +
            4
          ) *
          TAU;


        var radius =
          R *
          Math.sqrt(
            .04 +
            hash(
              index *
              19
            ) *
            .76
          );


        var freedom =
          (
            1 -
            system.coherence
          );


        var point =
          polar(
            CX,
            CY,
            radius +
            Math.cos(
              now *
              .00042 +
              index
            ) *
            freedom *
            10,
            angle +
            Math.sin(
              now *
              .00031 +
              index
            ) *
            freedom *
            .13
          );


        node.setAttribute(
          "cx",
          point.x
        );


        node.setAttribute(
          "cy",
          point.y
        );


        node.style.opacity =
          (
            .08 +
            system.coherence *
            .30
          ).toFixed(3);
      }
    );


    drawPosition();

    drawHistory();

    drawGuards();


    modeName.textContent =
      targetMode.name;


    modeDescription.textContent =
      targetMode.description;
  }


  /* ==========================================================================
     POSITION
     ========================================================================== */

  function drawPosition() {

    var x =
      CX +
      system.position.x *
      R;


    var y =
      CY +
      system.position.y *
      R;


    positionHalo.setAttribute(
      "cx",
      x
    );


    positionHalo.setAttribute(
      "cy",
      y
    );


    positionHalo.setAttribute(
      "r",
      (
        19 +
        system.energy *
        30
      ).toFixed(1)
    );


    positionHalo.style.opacity =
      (
        .07 +
        system.energy *
        .21
      ).toFixed(3);


    positionRing.setAttribute(
      "cx",
      x
    );


    positionRing.setAttribute(
      "cy",
      y
    );


    positionRing.setAttribute(
      "rx",
      (
        10 +
        weights.stress *
        14 +
        weights.nova *
        4
      ).toFixed(1)
    );


    positionRing.setAttribute(
      "ry",
      (
        9 +
        system.energy *
        4
      ).toFixed(1)
    );


    positionRing.setAttribute(
      "transform",
      "rotate(" +
      (
        weights.stress *
        28
      ).toFixed(1) +
      " " +
      x +
      " " +
      y +
      ")"
    );


    position.setAttribute(
      "cx",
      x
    );


    position.setAttribute(
      "cy",
      y
    );


    positionCore.setAttribute(
      "cx",
      x
    );


    positionCore.setAttribute(
      "cy",
      y
    );
  }


  /* ==========================================================================
     HISTORY
     ========================================================================== */

  function drawHistory() {

    var points =
      system.history.concat([
        {
          x:
            system.position.x,

          y:
            system.position.y
        }
      ]);


    var d =
      "";


    points.forEach(
      function (point, index) {

        d +=
          (
            index
              ?
                "L"
              :
                "M"
          ) +
          (
            CX +
            point.x *
            R
          ).toFixed(1) +
          " " +
          (
            CY +
            point.y *
            R
          ).toFixed(1);
      }
    );


    historyPath.setAttribute(
      "d",
      d
    );


    historyPath.style.opacity =
      (
        .09 +
        weights.recovery *
        .50
      ).toFixed(3);


    hDots.forEach(
      function (dot, index) {

        var pointIndex =
          Math.round(
            index *
            (
              points.length -
              1
            ) /
            Math.max(
              1,
              hDots.length -
              1
            )
          );


        var point =
          points[
            Math.min(
              points.length -
              1,
              pointIndex
            )
          ];


        dot.setAttribute(
          "cx",
          CX +
          point.x *
          R
        );


        dot.setAttribute(
          "cy",
          CY +
          point.y *
          R
        );


        dot.style.opacity =
          (
            .02 +
            weights.recovery *
            index /
            hDots.length *
            .32
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     GUARDED REGIONS
     ========================================================================== */

  function positionGuard(
    guard,
    dimension,
    strength,
    scale,
    rotation
  ) {

    var angle =
      dimensionAngle(
        dimension
      );


    var point =
      polar(
        CX,
        CY,
        R *
        .53,
        angle
      );


    [
      guard.ring,
      guard.bloom
    ]
    .forEach(
      function (node) {

        node.setAttribute(
          "cx",
          point.x
        );


        node.setAttribute(
          "cy",
          point.y
        );


        node.setAttribute(
          "rx",
          24 *
          scale
        );


        node.setAttribute(
          "ry",
          11 *
          scale
        );


        node.setAttribute(
          "transform",
          "rotate(" +
          rotation +
          " " +
          point.x +
          " " +
          point.y +
          ")"
        );
      }
    );


    guard.ring.style.opacity =
      (
        strength *
        .66
      ).toFixed(3);


    guard.bloom.style.opacity =
      (
        strength *
        .15
      ).toFixed(3);
  }


  function drawGuards() {

    /*
       Recovery dimension = 3
       Stability = 4
       Sleep = 1
    */

    if (
      weights.stress >
      weights.nova
    ) {

      positionGuard(
        guardA,
        3,
        weights.stress *
        .88 +
        weights.recovery *
        .52,
        1,
        -20
      );


      positionGuard(
        guardB,
        1,
        weights.stress *
        .78 +
        weights.sleep *
        .62,
        1,
        18
      );

    } else {

      positionGuard(
        guardA,
        3,
        weights.nova *
        .95 +
        weights.recovery *
        .70,
        1,
        -20
      );


      positionGuard(
        guardB,
        4,
        weights.nova *
        .88,
        1,
        17
      );
    }
  }


  /* ==========================================================================
     SLEEP STORY

     0-.20    exterior still active
     .15-.45  exterior begins bypassing
     .22-.65  field folds inward
     .35-.82  internal circulation organizes
     .62-1    restoration pulse reaches the core
     ========================================================================== */

  function drawSleep(
    now,
    p
  ) {

    var w =
      weights.sleep;


    var fold =
      eventWindow(
        p,
        .18,
        .67
      );


    sleepShells.forEach(
      function (shell, index) {

        var f =
          (
            index +
            1
          ) /
          sleepShells.length;


        var radius =
          R *
          (
            .10 +
            f *
            .70
          );


        shell.setAttribute(
          "cx",
          CX -
          fold *
          17
        );


        shell.setAttribute(
          "cy",
          CY +
          fold *
          13
        );


        shell.setAttribute(
          "rx",
          radius *
          lerp(
            1.05,
            .89,
            fold
          )
        );


        shell.setAttribute(
          "ry",
          radius *
          (
            .91 -
            f *
            .035
          ) *
          lerp(
            1.04,
            .90,
            fold
          )
        );


        shell.style.opacity =
          (
            w *
            (
              .025 +
              fold *
              .10
            ) *
            (
              1 -
              f *
              .34
            )
          ).toFixed(3);
      }
    );


    /*
       Slow pulse moves OUTSIDE → INNER → CORE.
    */

    sleepWaves.forEach(
      function (wave, index) {

        var local =
          clamp(
            (
              p -
              .52 -
              index *
              .035
            ) /
            .38,
            0,
            1
          );


        var radius =
          lerp(
            R *
            .86,
            18,
            smoothstep(
              local
            )
          );


        wave.setAttribute(
          "cx",
          CX -
          fold *
          17
        );


        wave.setAttribute(
          "cy",
          CY +
          fold *
          13
        );


        wave.setAttribute(
          "rx",
          radius
        );


        wave.setAttribute(
          "ry",
          radius *
          .87
        );


        wave.style.opacity =
          (
            w *
            pulseWindow(
              local,
              0,
              .45,
              1
            ) *
            .20
          ).toFixed(3);
      }
    );


    /*
       Internal restoration routes.
    */

    var routeReveal =
      eventWindow(
        p,
        .30,
        .80
      );


    sleepRoutes.forEach(
      function (route, index) {

        var angle =
          index /
          sleepRoutes.length *
          TAU;


        var outside =
          polar(
            CX,
            CY,
            R *
            .65,
            angle
          );


        var inside =
          polar(
            CX -
            17,
            CY +
            13,
            R *
            .15,
            angle +
            1.45
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .27,
            angle +
            .72
          );


        route.setAttribute(
          "d",
          "M" +
          outside.x +
          " " +
          outside.y +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          inside.x +
          " " +
          inside.y
        );


        route.style.opacity =
          (
            w *
            routeReveal *
            .23
          ).toFixed(3);
      }
    );


    /*
       Sleep-sensitive gate remains visually precise.
    */

    var gatePoint =
      polar(
        CX,
        CY,
        R *
        .62,
        dimensionAngle(
          1
        )
      );


    sleepGate.setAttribute(
      "cx",
      gatePoint.x
    );


    sleepGate.setAttribute(
      "cy",
      gatePoint.y
    );


    sleepGate.style.opacity =
      (
        w *
        (
          .20 +
          fold *
          .80
        )
      ).toFixed(3);
  }


  /* ==========================================================================
     STRESS STORY

     0-.18    incoming pressure appears
     .10-.32  demand side opens
     .18-.40  position accelerates
     .24-.56  routes recruit
     .28-.60  reserves tighten
     .40-.73  pressure crosses
     .72-1    system HOLDS
     ========================================================================== */

  function drawStress(
    now,
    p
  ) {

    var w =
      weights.stress;


    var pressure =
      eventWindow(
        p,
        .02,
        .62
      );


    var hold =
      eventWindow(
        p,
        .70,
        .94
      );


    stressFronts.forEach(
      function (front, index) {

        var local =
          clamp(
            (
              p -
              index *
              .015
            ) /
            .68,
            0,
            1
          );


        var cx =
          lerp(
            180,
            650,
            local
          );


        var size =
          lerp(
            50,
            340,
            local
          );


        front.setAttribute(
          "cx",
          cx
        );


        front.setAttribute(
          "cy",
          CY
        );


        front.setAttribute(
          "rx",
          size *
          .42
        );


        front.setAttribute(
          "ry",
          size
        );


        front.style.opacity =
          (
            w *
            (
              1 -
              local
            ) *
            .34
          ).toFixed(3);
      }
    );


    /*
       Recruitment routes converge toward demand-facing quadrant.
    */

    stressRoutes.forEach(
      function (route, index) {

        var source =
          polar(
            CX,
            CY,
            R *
            (
              .30 +
              hash(
                index *
                19
              ) *
              .40
            ),
            1.3 +
            index *
            .44
          );


        var demand =
          polar(
            CX,
            CY,
            R *
            .82,
            -.45 +
            index *
            .018
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .30,
            -.10 +
            index *
            .08
          );


        route.setAttribute(
          "d",
          "M" +
          source.x +
          " " +
          source.y +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          demand.x +
          " " +
          demand.y
        );


        route.style.opacity =
          (
            w *
            eventWindow(
              p,
              .22,
              .58
            ) *
            (
              .07 +
              .13 *
              Math.abs(
                Math.sin(
                  now *
                  .0012 +
                  index
                )
              )
            )
          ).toFixed(3);
      }
    );


    stressNodes.forEach(
      function (node, index) {

        var angle =
          -.52 +
          (
            index /
            stressNodes.length -
            .5
          ) *
          .95;


        var point =
          polar(
            CX,
            CY,
            R *
            (
              .73 +
              hash(
                index *
                13
              ) *
              .25
            ),
            angle
          );


        node.setAttribute(
          "cx",
          point.x
        );


        node.setAttribute(
          "cy",
          point.y
        );


        node.style.opacity =
          (
            w *
            eventWindow(
              p,
              .20,
              .52
            ) *
            (
              .20 +
              .60 *
              Math.abs(
                Math.sin(
                  now *
                  .004 +
                  index
                )
              )
            )
          ).toFixed(3);
      }
    );


    /*
       HOLD ring.

       Stress is not allowed to end visually as "chaos."

       The final frame must communicate:
         the system has organized itself around demand.
    */

    var holdPoint =
      polar(
        CX,
        CY,
        R *
        .58,
        -.47
      );


    stressHold.setAttribute(
      "cx",
      holdPoint.x
    );


    stressHold.setAttribute(
      "cy",
      holdPoint.y
    );


    stressHold.setAttribute(
      "rx",
      72
    );


    stressHold.setAttribute(
      "ry",
      34
    );


    stressHold.setAttribute(
      "transform",
      "rotate(-27 " +
      holdPoint.x +
      " " +
      holdPoint.y +
      ")"
    );


    stressHold.style.opacity =
      (
        w *
        hold *
        .46
      ).toFixed(3);
  }


  /* ==========================================================================
     RECOVERY STORY

     Begins from the ACTUAL prior envelope captured at transition.

     .05-.28  position moves first
     .12-.45  load exits
     .20-.60  knots loosen
     .35-.72  reserve pools reconnect
     .48-.82  route continuity returns
     .65-1    boundary finishes settling
     ========================================================================== */

  function drawRecovery(
    now,
    p
  ) {

    var w =
      weights.recovery;


    var boundaryReturn =
      eventWindow(
        p,
        .62,
        1
      );


    /*
       Prior envelope remains as ghost.
    */

    recoveryGhosts.forEach(
      function (ghost, index) {

        var ghostFactors =
          eventOrigin.factors.map(
            function (value, i) {

              return lerp(
                value,
                system.factors[i],
                boundaryReturn
              );
            }
          );


        ghost.setAttribute(
          "d",
          envelopePath(
            ghostFactors,
            1 +
            index *
            .014
          )
        );


        ghost.style.opacity =
          (
            w *
            (
              1 -
              boundaryReturn
            ) *
            (
              .035 +
              index *
              .011
            )
          ).toFixed(3);
      }
    );


    /*
       Load exits.
    */

    var release =
      eventWindow(
        p,
        .10,
        .53
      );


    recoveryRelease.forEach(
      function (route, index) {

        var angle =
          index /
          recoveryRelease.length *
          TAU +
          .36;


        var source =
          polar(
            CX,
            CY,
            R *
            (
              .18 +
              hash(
                index *
                19
              ) *
              .31
            ),
            angle
          );


        var destination =
          polar(
            CX,
            CY,
            R *
            lerp(
              .74,
              1.42,
              release
            ),
            angle +
            Math.sin(
              index
            ) *
            .10
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .57,
            angle +
            .16 *
            Math.sin(
              index *
              .72
            )
          );


        route.setAttribute(
          "d",
          "M" +
          source.x +
          " " +
          source.y +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          destination.x +
          " " +
          destination.y
        );


        route.style.opacity =
          (
            w *
            pulseWindow(
              p,
              .10,
              .34,
              .72
            ) *
            .26
          ).toFixed(3);
      }
    );


    /*
       Knots visibly loosen.
    */

    var loosen =
      eventWindow(
        p,
        .18,
        .64
      );


    recoveryKnots.forEach(
      function (knot, index) {

        var angle =
          index /
          recoveryKnots.length *
          TAU;


        var point =
          polar(
            CX,
            CY,
            R *
            (
              .27 +
              hash(
                index *
                17
              ) *
              .46
            ),
            angle
          );


        knot.setAttribute(
          "cx",
          point.x
        );


        knot.setAttribute(
          "cy",
          point.y
        );


        knot.setAttribute(
          "rx",
          lerp(
            8,
            27,
            loosen
          )
        );


        knot.setAttribute(
          "ry",
          lerp(
            19,
            9,
            loosen
          )
        );


        knot.setAttribute(
          "transform",
          "rotate(" +
          (
            index *
            31 -
            loosen *
            index *
            7
          ) +
          " " +
          point.x +
          " " +
          point.y +
          ")"
        );


        knot.style.opacity =
          (
            w *
            (
              .18 -
              loosen *
              .08
            )
          ).toFixed(3);
      }
    );


    /*
       Reserve returns.
    */

    var reserve =
      eventWindow(
        p,
        .32,
        .74
      );


    var reservePoint =
      polar(
        CX,
        CY,
        R *
        .47,
        dimensionAngle(
          3
        )
      );


    recoveryReserve.setAttribute(
      "cx",
      reservePoint.x
    );


    recoveryReserve.setAttribute(
      "cy",
      reservePoint.y
    );


    recoveryReserve.setAttribute(
      "r",
      lerp(
        22,
        104,
        reserve
      )
    );


    recoveryReserve.style.opacity =
      (
        w *
        reserve *
        .09
      ).toFixed(3);


    /*
       Main recovery trajectory.
    */

    var startX =
      CX +
      eventOrigin.position.x *
      R;


    var startY =
      CY +
      eventOrigin.position.y *
      R;


    var endX =
      CX +
      system.position.x *
      R;


    var endY =
      CY +
      system.position.y *
      R;


    recoveryRoute.setAttribute(
      "d",
      "M" +
      startX +
      " " +
      startY +
      "Q" +
      lerp(
        startX,
        endX,
        .47
      ) +
      " " +
      (
        Math.max(
          startY,
          endY
        ) +
        70
      ) +
      "," +
      endX +
      " " +
      endY
    );


    recoveryRoute.style.opacity =
      (
        w *
        eventWindow(
          p,
          .05,
          .56
        ) *
        .72
      ).toFixed(3);
  }


  /* ==========================================================================
     FLOW STORY

     .00-.22  independent motion
     .18-.50  coordination front
     .32-.66  paths become channels
     .50-.80  pulses synchronize
     .65-1    position joins current
     ========================================================================== */

  function drawFlow(
    now,
    p
  ) {

    var w =
      weights.flow;


    var lock =
      eventWindow(
        p,
        .18,
        .70
      );


    /*
       Visible phase-lock front.
    */

    flowFront.setAttribute(
      "cx",
      lerp(
        245,
        830,
        eventWindow(
          p,
          .16,
          .58
        )
      )
    );


    flowFront.setAttribute(
      "cy",
      CY
    );


    flowFront.setAttribute(
      "rx",
      54
    );


    flowFront.setAttribute(
      "ry",
      250
    );


    flowFront.style.opacity =
      (
        w *
        pulseWindow(
          p,
          .14,
          .38,
          .63
        ) *
        .22
      ).toFixed(3);


    flowRoutes.forEach(
      function (route, index) {

        var lane =
          (
            index -
            (
              flowRoutes.length -
              1
            ) /
            2
          ) *
          14;


        var disorder =
          (
            1 -
            lock
          ) *
          Math.sin(
            now *
            .0015 +
            index *
            .71
          ) *
          31;


        route.setAttribute(
          "d",
          "M225 " +
          (
            CY +
            lane +
            disorder
          ) +
          "C370 " +
          (
            CY +
            lane *
            .64
          ) +
          ",580 " +
          (
            CY +
            lane *
            .12
          ) +
          ",880 " +
          (
            CY +
            lane *
            .50
          )
        );


        route.style.opacity =
          (
            w *
            (
              .035 +
              lock *
              .25
            )
          ).toFixed(3);
      }
    );


    /*
       Synchronized moving packets.
    */

    flowPulses.forEach(
      function (pulse, index) {

        var phase =
          reduce
            ?
              .64
            :
              (
                now /
                (
                  2450 +
                  index *
                  31
                ) +
                index /
                flowPulses.length
              ) %
              1;


        var x =
          lerp(
            245,
            875,
            phase
          );


        var lane =
          (
            index -
            (
              flowPulses.length -
              1
            ) /
            2
          ) *
          18;


        var y =
          CY +
          lane *
          .44 +
          Math.sin(
            phase *
            Math.PI
          ) *
          lane *
          -.10;


        pulse.setAttribute(
          "cx",
          x
        );


        pulse.setAttribute(
          "cy",
          y
        );


        pulse.style.opacity =
          (
            w *
            eventWindow(
              p,
              .44,
              .76
            ) *
            Math.sin(
              phase *
              Math.PI
            ) *
            .74
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     NOVA STORY

     Begins from coherent substrate.

     Additional relationships are recruited sequentially.

     Each new region is followed by a global coherence check.

     Existing routes brighten together before next degree of freedom opens.

     Recovery + stability remain guarded throughout.
     ========================================================================== */

  function drawNova(
    now,
    p
  ) {

    var w =
      weights.nova;


    var points =
      [];


    novaNodes.forEach(
      function (node, index) {

        var recruitment =
          index /
          novaNodes.length *
          .76;


        var reveal =
          eventWindow(
            p,
            recruitment,
            recruitment +
            .16
          );


        var angle =
          hash(
            index *
            29 +
            3
          ) *
          TAU;


        var radius =
          R *
          (
            .45 +
            hash(
              index *
              17 +
              7
            ) *
            1.07
          );


        var point =
          polar(
            CX,
            CY,
            radius,
            angle
          );


        points.push({
          x:
            point.x,

          y:
            point.y,

          reveal:
            reveal
        });


        node.setAttribute(
          "cx",
          point.x
        );


        node.setAttribute(
          "cy",
          point.y
        );


        node.style.opacity =
          (
            w *
            reveal *
            (
              .14 +
              hash(
                index *
                7
              ) *
              .72
            )
          ).toFixed(3);
      }
    );


    /*
       Sparse long-distance relationships.
    */

    novaLinks.forEach(
      function (link, index) {

        var A =
          points[
            index %
            points.length
          ];


        var B =
          points[
            (
              index *
              7 +
              11
            ) %
            points.length
          ];


        var reveal =
          Math.min(
            A.reveal,
            B.reveal
          );


        var mx =
          lerp(
            (
              A.x +
              B.x
            ) /
            2,
            CX,
            .20
          );


        var my =
          lerp(
            (
              A.y +
              B.y
            ) /
            2,
            CY,
            .20
          );


        link.setAttribute(
          "d",
          "M" +
          A.x +
          " " +
          A.y +
          "Q" +
          mx +
          " " +
          my +
          "," +
          B.x +
          " " +
          B.y
        );


        link.style.opacity =
          (
            w *
            reveal *
            (
              .025 +
              hash(
                index *
                13
              ) *
              .11
            )
          ).toFixed(3);
      }
    );


    /*
       Out-and-return traffic.
    */

    novaRoutes.forEach(
      function (route, index) {

        var angle =
          index /
          novaRoutes.length *
          TAU +
          Math.sin(
            index *
            .8
          ) *
          .07;


        var outer =
          polar(
            CX,
            CY,
            R *
            1.52,
            angle
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .82,
            angle +
            .32
          );


        route.setAttribute(
          "d",
          "M" +
          CX +
          " " +
          CY +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          outer.x +
          " " +
          outer.y
        );


        route.style.opacity =
          (
            w *
            eventWindow(
              p,
              .46,
              .86
            ) *
            (
              .03 +
              .09 *
              Math.abs(
                Math.sin(
                  now *
                  .001 +
                  index
                )
              )
            )
          ).toFixed(3);


        /*
           Coherence check.

           Every recruited degree of freedom briefly sends a ring back inward.
        */

        var cycle =
          (
            now /
            (
              3600 +
              index *
              50
            ) +
            index /
            novaRoutes.length
          ) %
          1;


        var checkRadius =
          lerp(
            R *
            1.45,
            R *
            .28,
            cycle
          );


        var point =
          polar(
            CX,
            CY,
            checkRadius,
            angle
          );


        novaChecks[index]
          .setAttribute(
            "cx",
            point.x
          );


        novaChecks[index]
          .setAttribute(
            "cy",
            point.y
          );


        novaChecks[index]
          .setAttribute(
            "r",
            5 +
            (
              1 -
              cycle
            ) *
            7
          );


        novaChecks[index]
          .style.opacity =
          (
            w *
            eventWindow(
              p,
              .48,
              .88
            ) *
            (
              1 -
              cycle
            ) *
            .18
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     SVG MASTER
     ========================================================================== */

  function drawSVG(
    now
  ) {

    var p =
      eventProgress();


    drawCore(
      now
    );


    drawSleep(
      now,
      p
    );


    drawStress(
      now,
      p
    );


    drawRecovery(
      now,
      p
    );


    drawFlow(
      now,
      p
    );


    drawNova(
      now,
      p
    );
  }


  /* ==========================================================================
     CANVAS SIZE
     ========================================================================== */

  var DPR =
    1;


  var CW =
    0;


  var CH =
    0;


  var WW =
    0;


  var WH =
    0;


  function resizeCanvases() {

    DPR =
      Math.min(
        2,
        window.devicePixelRatio ||
        1
      );


    var stageRect =
      phenomena.getBoundingClientRect();


    CW =
      stageRect.width;


    CH =
      stageRect.height;


    phenomena.width =
      Math.round(
        CW *
        DPR
      );


    phenomena.height =
      Math.round(
        CH *
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


    var worldRect =
      world.getBoundingClientRect();


    WW =
      worldRect.width;


    WH =
      worldRect.height;


    world.width =
      Math.round(
        WW *
        DPR
      );


    world.height =
      Math.round(
        WH *
        DPR
      );


    worldCtx.setTransform(
      DPR,
      0,
      0,
      DPR,
      0,
      0
    );
  }


  /* ==========================================================================
     CANVAS DATA
     ========================================================================== */

  var particles =
    [];


  var streams =
    [];


  for (
    var i = 0;
    i <
    160;
    i++
  ) {

    particles.push({

      x:
        hash(
          i *
          17 +
          3
        ),

      y:
        hash(
          i *
          29 +
          7
        ),

      depth:
        .12 +
        hash(
          i *
          37 +
          4
        ) *
        .88,

      phase:
        hash(
          i *
          13 +
          8
        ) *
        TAU,

      warm:
        hash(
          i *
          11 +
          5
        ) >
        .84
    });
  }


  for (
    var st = 0;
    st <
    48;
    st++
  ) {

    streams.push({

      y:
        hash(
          st *
          31 +
          3
        ),

      phase:
        hash(
          st *
          19 +
          6
        ) *
        TAU,

      warm:
        hash(
          st *
          23 +
          5
        ) >
        .78
    });
  }


  /* ==========================================================================
     SLEEP CANVAS

     Outside traffic DIVERTS around the system.

     Inside remains active.
     ========================================================================== */

  function canvasSleep(
    now,
    p
  ) {

    var w =
      weights.sleep;


    if (
      w <
      .002
    ) {
      return;
    }


    var bypass =
      eventWindow(
        p,
        .12,
        .50
      );


    var internal =
      eventWindow(
        p,
        .28,
        .76
      );


    var cx =
      CW *
      .50;


    var cy =
      CH *
      .47;


    var radius =
      Math.min(
        CW,
        CH
      ) *
      .29;


    /*
       Exterior streams continue moving.

       Near the membrane they bend around rather than enter.
    */

    streams.forEach(
      function (stream, index) {

        ctx.beginPath();


        for (
          var s = 0;
          s <=
          64;
          s++
        ) {

          var u =
            s /
            64;


          var x =
            u *
            CW;


          var y =
            stream.y *
            CH;


          var dx =
            x -
            cx;


          var dy =
            y -
            cy;


          var dist =
            Math.sqrt(
              dx *
              dx +
              dy *
              dy
            );


          var approach =
            clamp(
              1 -
              dist /
              (
                radius *
                1.52
              ),
              0,
              1
            );


          var side =
            dy >=
            0
              ?
                1
              :
                -1;


          y +=
            side *
            approach *
            radius *
            .50 *
            bypass;


          y +=
            Math.sin(
              u *
              TAU *
              1.15 +
              stream.phase +
              now *
              .00013
            ) *
            5;


          if (
            s ===
            0
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


        ctx.strokeStyle =
          stream.warm
            ?
              "rgba(242,220,171," +
              (
                w *
                .012
              ) +
              ")"
            :
              "rgba(102,224,237," +
              (
                w *
                .010
              ) +
              ")";


        ctx.lineWidth =
          .55;


        ctx.stroke();
      }
    );


    /*
       Interior circulation grows quieter but more organized.
    */

    particles.forEach(
      function (particle, index) {

        var angle =
          particle.phase +
          now *
          .00005 *
          (
            .55 +
            particle.depth
          );


        var r =
          radius *
          (
            .15 +
            particle.depth *
            .79
          );


        r *=
          lerp(
            1,
            .86,
            internal
          );


        var x =
          cx +
          Math.cos(
            angle
          ) *
          r;


        var y =
          cy +
          Math.sin(
            angle
          ) *
          r *
          .76;


        var alpha =
          w *
          (
            .02 +
            particle.depth *
            .09
          ) *
          (
            .45 +
            internal *
            .55
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
          particle.warm
            ?
              "rgba(242,220,171," +
              alpha +
              ")"
            :
              "rgba(102,224,237," +
              alpha *
              .72 +
              ")";


        ctx.fill();
      }
    );
  }


  /* ==========================================================================
     STRESS CANVAS

     Demand arrives from outside.

     Routes bend toward load.

     Final phase stabilizes instead of becoming increasingly chaotic.
     ========================================================================== */

  function canvasStress(
    now,
    p
  ) {

    var w =
      weights.stress;


    if (
      w <
      .002
    ) {
      return;
    }


    var cx =
      CW *
      .50;


    var cy =
      CH *
      .47;


    var radius =
      Math.min(
        CW,
        CH
      ) *
      .30;


    var frontProgress =
      eventWindow(
        p,
        .02,
        .66
      );


    /*
       Screen-wide pressure front.
    */

    var frontX =
      lerp(
        -CW *
        .12,
        CW *
        1.06,
        frontProgress
      );


    var pressure =
      ctx.createLinearGradient(
        frontX -
        150,
        0,
        frontX +
        180,
        0
      );


    pressure.addColorStop(
      0,
      "rgba(227,166,63,0)"
    );


    pressure.addColorStop(
      .50,
      "rgba(227,166,63," +
      (
        w *
        pulseWindow(
          p,
          .02,
          .42,
          .75
        ) *
        .055
      ) +
      ")"
    );


    pressure.addColorStop(
      1,
      "rgba(227,166,63,0)"
    );


    ctx.fillStyle =
      pressure;


    ctx.fillRect(
      frontX -
      150,
      0,
      330,
      CH
    );


    /*
       Fast demand packets.
    */

    particles.forEach(
      function (particle, index) {

        var speed =
          85 +
          particle.depth *
          220;


        var x =
          (
            particle.x *
            CW +
            now /
            1000 *
            speed
          ) %
          (
            CW +
            120
          ) -
          60;


        var y =
          particle.y *
          CH +
          Math.sin(
            now *
            .002 +
            particle.phase
          ) *
          12;


        var dx =
          x -
          cx;


        var dy =
          y -
          cy;


        var dist =
          Math.sqrt(
            dx *
            dx +
            dy *
            dy
          );


        var recruit =
          Math.exp(
            -dist /
            (
              radius *
              1.35
            )
          );


        /*
           Recruitment toward upper-right demand side.
        */

        y =
          lerp(
            y,
            cy -
            radius *
            .20,
            recruit *
            eventWindow(
              p,
              .18,
              .54
            ) *
            .27
          );


        var alpha =
          w *
          (
            .025 +
            particle.depth *
            .12
          ) *
          (
            .45 +
            pulseWindow(
              p,
              .08,
              .50,
              .80
            ) *
            .55
          );


        ctx.beginPath();


        ctx.moveTo(
          x -
          10 -
          particle.depth *
          13,
          y
        );


        ctx.lineTo(
          x,
          y
        );


        ctx.strokeStyle =
          particle.warm
            ?
              "rgba(227,166,63," +
              alpha +
              ")"
            :
              "rgba(102,224,237," +
              alpha *
              .62 +
              ")";


        ctx.lineWidth =
          .7;


        ctx.stroke();
      }
    );


    /*
       HOLD phase.

       Motion becomes more parallel as the system stabilizes under the demand.
    */

    var hold =
      eventWindow(
        p,
        .72,
        .96
      );


    if (
      hold >
      .01
    ) {

      streams.forEach(
        function (stream, index) {

          ctx.beginPath();


          for (
            var s = 0;
            s <=
            46;
            s++
          ) {

            var u =
              s /
              46;


            var x =
              CW *
              (
                .28 +
                u *
                .56
              );


            var lane =
              (
                stream.y -
                .5
              ) *
              radius *
              1.6;


            var y =
              cy +
              lane *
              .62 +
              Math.sin(
                u *
                TAU *
                1.2 +
                index
              ) *
              4;


            if (
              s ===
              0
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


          ctx.strokeStyle =
            "rgba(227,166,63," +
            (
              w *
              hold *
              .018
            ) +
            ")";


          ctx.lineWidth =
            .55;


          ctx.stroke();
        }
      );
    }
  }


  /* ==========================================================================
     RECOVERY CANVAS

     Strain leaves.

     Routes progressively straighten.

     Space grows around current position.
     ========================================================================== */

  function canvasRecovery(
    now,
    p
  ) {

    var w =
      weights.recovery;


    if (
      w <
      .002
    ) {
      return;
    }


    var cx =
      CW *
      .50;


    var cy =
      CH *
      .47;


    var radius =
      Math.min(
        CW,
        CH
      ) *
      .29;


    /*
       Load leaves the field.
    */

    for (
      var i = 0;
      i <
      78;
      i++
    ) {

      var phase =
        (
          now /
          (
            4300 +
            i *
            37
          ) +
          hash(
            i *
            13
          )
        ) %
        1;


      var angle =
        hash(
          i *
          29
        ) *
        TAU;


      var radial =
        lerp(
          radius *
          .16,
          radius *
          1.58,
          phase
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        radial;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        radial *
        .82;


      var alpha =
        w *
        pulseWindow(
          p,
          .10,
          .34,
          .70
        ) *
        (
          1 -
          phase
        ) *
        (
          .025 +
          (
            1 -
            p
          ) *
          .10
        );


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        1 +
        hash(
          i *
          17
        ),
        0,
        TAU
      );


      ctx.fillStyle =
        i %
        5 ===
        0
          ?
            "rgba(227,166,63," +
            alpha +
            ")"
          :
            "rgba(102,224,237," +
            alpha +
            ")";


      ctx.fill();
    }


    /*
       Distorted routes become long clean ones.
    */

    var clean =
      eventWindow(
        p,
        .36,
        .84
      );


    streams.forEach(
      function (stream, index) {

        ctx.beginPath();


        for (
          var s = 0;
          s <=
          60;
          s++
        ) {

          var u =
            s /
            60;


          var x =
            u *
            CW;


          var baseline =
            stream.y *
            CH;


          var strain =
            (
              1 -
              clean
            ) *
            Math.sin(
              u *
              TAU *
              4.4 +
              index *
              .65
            ) *
            22;


          var y =
            baseline +
            strain;


          var dx =
            x -
            cx;


          var influence =
            Math.exp(
              -Math.abs(
                dx
              ) /
              (
                radius *
                1.25
              )
            );


          y =
            lerp(
              y,
              cy +
              (
                baseline -
                cy
              ) *
              .78,
              clean *
              influence *
              .24
            );


          if (
            s ===
            0
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


        ctx.strokeStyle =
          "rgba(102,224,237," +
          (
            w *
            (
              .008 +
              clean *
              .022
            )
          ) +
          ")";


        ctx.lineWidth =
          .55;


        ctx.stroke();
      }
    );


    /*
       Increasing room.
    */

    var room =
      eventWindow(
        p,
        .42,
        .90
      );


    var gradient =
      ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        radius *
        (
          .46 +
          room *
          .92
        )
      );


    gradient.addColorStop(
      0,
      "rgba(102,224,237," +
      (
        w *
        room *
        .036
      ) +
      ")"
    );


    gradient.addColorStop(
      .48,
      "rgba(102,224,237," +
      (
        w *
        room *
        .010
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
      cx,
      cy,
      radius *
      (
        .46 +
        room *
        .92
      ),
      0,
      TAU
    );


    ctx.fill();
  }


  /* ==========================================================================
     FLOW CANVAS

     Independent trajectories synchronize into transport.

     Current position later enters a stream.
     ========================================================================== */

  function canvasFlow(
    now,
    p
  ) {

    var w =
      weights.flow;


    if (
      w <
      .002
    ) {
      return;
    }


    var lock =
      eventWindow(
        p,
        .18,
        .68
      );


    var cy =
      CH *
      .47;


    streams.forEach(
      function (stream, index) {

        ctx.beginPath();


        for (
          var s = 0;
          s <=
          72;
          s++
        ) {

          var u =
            s /
            72;


          var x =
            u *
            CW;


          var lane =
            (
              stream.y -
              .5
            ) *
            CH;


          var chaos =
            (
              1 -
              lock
            ) *
            Math.sin(
              u *
              TAU *
              (
                3.7 +
                index %
                4
              ) +
              now *
              .0014 +
              index
            ) *
            27;


          var commonWave =
            Math.sin(
              u *
              TAU *
              1.24 +
              now *
              .00047
            ) *
            10;


          var y =
            cy +
            lane *
            lerp(
              .82,
              .58,
              lock
            ) +
            chaos +
            commonWave;


          if (
            s ===
            0
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


        ctx.strokeStyle =
          stream.warm
            ?
              "rgba(236,199,126," +
              (
                w *
                (
                  .007 +
                  lock *
                  .018
                )
              ) +
              ")"
            :
              "rgba(102,224,237," +
              (
                w *
                (
                  .011 +
                  lock *
                  .033
                )
              ) +
              ")";


        ctx.lineWidth =
          .55 +
          lock *
          .18;


        ctx.stroke();
      }
    );


    /*
       Synchronized packet spacing.
    */

    var packets =
      eventWindow(
        p,
        .46,
        .78
      );


    for (
      var i = 0;
      i <
      18;
      i++
    ) {

      var phase =
        (
          now /
          (
            2600 +
            i *
            29
          ) +
          i /
          18
        ) %
        1;


      var x =
        phase *
        CW;


      var lane =
        (
          i -
          8.5
        ) *
        18;


      var y =
        cy +
        lane *
        .55 +
        Math.sin(
          phase *
          TAU +
          now *
          .00045
        ) *
        7;


      var alpha =
        w *
        packets *
        Math.sin(
          phase *
          Math.PI
        ) *
        .50;


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        1.8 +
        (
          i %
          3
        ) *
        .45,
        0,
        TAU
      );


      ctx.fillStyle =
        "rgba(102,224,237," +
        alpha +
        ")";


      ctx.fill();
    }
  }


  /* ==========================================================================
     NOVA CANVAS

     More coherent territory becomes sustainable.

     New regions are recruited sequentially.

     Existing routes remain active.

     Packets travel out AND back.
     ========================================================================== */

  function canvasNova(
    now,
    p
  ) {

    var w =
      weights.nova;


    if (
      w <
      .002
    ) {
      return;
    }


    var cx =
      CW *
      .50;


    var cy =
      CH *
      .47;


    var radius =
      Math.min(
        CW,
        CH
      ) *
      .30;


    var points =
      [];


    for (
      var i = 0;
      i <
      58;
      i++
    ) {

      var recruitment =
        i /
        58 *
        .78;


      var reveal =
        eventWindow(
          p,
          recruitment,
          recruitment +
          .15
        );


      var angle =
        hash(
          i *
          31
        ) *
        TAU;


      var radial =
        radius *
        (
          .64 +
          hash(
            i *
            17
          ) *
          1.42
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        radial;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        radial *
        .78;


      points.push({
        x:
          x,

        y:
          y,

        reveal:
          reveal
      });


      var alpha =
        w *
        reveal *
        (
          .10 +
          hash(
            i *
            7
          ) *
          .38
        );


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        1 +
        hash(
          i *
          13
        ) *
        1.6,
        0,
        TAU
      );


      ctx.fillStyle =
        i %
        5 ===
        0
          ?
            "rgba(236,199,126," +
            alpha +
            ")"
          :
            "rgba(102,224,237," +
            alpha *
            .72 +
            ")";


      ctx.fill();
    }


    /*
       Long-range relationships.
    */

    for (
      var line = 0;
      line <
      44;
      line++
    ) {

      var A =
        points[
          line %
          points.length
        ];


      var B =
        points[
          (
            line *
            7 +
            11
          ) %
          points.length
        ];


      var reveal =
        Math.min(
          A.reveal,
          B.reveal
        );


      if (
        reveal <
        .01
      ) {
        continue;
      }


      ctx.beginPath();


      ctx.moveTo(
        A.x,
        A.y
      );


      ctx.quadraticCurveTo(
        lerp(
          (
            A.x +
            B.x
          ) /
          2,
          cx,
          .20
        ),
        lerp(
          (
            A.y +
            B.y
          ) /
          2,
          cy,
          .20
        ),
        B.x,
        B.y
      );


      ctx.strokeStyle =
        "rgba(236,199,126," +
        (
          w *
          reveal *
          .038
        ) +
        ")";


      ctx.lineWidth =
        .6;


      ctx.stroke();
    }


    /*
       OUT-AND-RETURN throughput.

       This explicitly prevents Nova from looking like expenditure.
    */

    var traffic =
      eventWindow(
        p,
        .45,
        .88
      );


    for (
      var pulse = 0;
      pulse <
      16;
      pulse++
    ) {

      var angle =
        pulse /
        16 *
        TAU +
        Math.sin(
          pulse *
          .8
        ) *
        .07;


      var cycle =
        (
          now /
          4700 +
          pulse /
          16
        ) %
        1;


      var thereAndBack =
        cycle <
        .5
          ?
            cycle *
            2
          :
            (
              1 -
              cycle
            ) *
            2;


      var radial =
        lerp(
          radius *
          .70,
          radius *
          1.76,
          smoothstep(
            thereAndBack
          )
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        radial;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        radial *
        .78;


      var alpha =
        w *
        traffic *
        Math.sin(
          thereAndBack *
          Math.PI
        ) *
        .54;


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        2.2,
        0,
        TAU
      );


      ctx.fillStyle =
        "rgba(236,199,126," +
        alpha +
        ")";


      ctx.fill();
    }


    /*
       Global coherence pulse after each new territory band joins.

       Existing structure brightens together before further recruitment.
    */

    var bandCount =
      6;


    var band =
      Math.floor(
        clamp(
          p,
          0,
          .96
        ) *
        bandCount
      );


    var local =
      (
        p *
        bandCount
      ) %
      1;


    if (
      local <
      .24
    ) {

      var check =
        1 -
        local /
        .24;


      var checkRadius =
        radius *
        (
          .65 +
          (
            band /
            bandCount
          ) *
          1.0
        );


      ctx.beginPath();


      ctx.arc(
        cx,
        cy,
        checkRadius,
        0,
        TAU
      );


      ctx.strokeStyle =
        "rgba(102,224,237," +
        (
          w *
          check *
          .10
        ) +
        ")";


      ctx.lineWidth =
        .8;


      ctx.stroke();
    }
  }


  /* ==========================================================================
     CANVAS MASTER
     ========================================================================== */

  function drawPhenomena(
    now
  ) {

    ctx.clearRect(
      0,
      0,
      CW,
      CH
    );


    var p =
      eventProgress();


    canvasSleep(
      now,
      p
    );


    canvasStress(
      now,
      p
    );


    canvasRecovery(
      now,
      p
    );


    canvasFlow(
      now,
      p
    );


    canvasNova(
      now,
      p
    );
  }


  /* ==========================================================================
     PAGE-SCALE WORLD RESPONSE
     ========================================================================== */

  function drawWorld(
    now
  ) {

    worldCtx.clearRect(
      0,
      0,
      WW,
      WH
    );


    /*
       SLEEP:
       peripheral environment becomes darker and quieter.
    */

    if (
      weights.sleep >
      .01
    ) {

      var dark =
        worldCtx.createRadialGradient(
          WW *
          .5,
          WH *
          .52,
          0,
          WW *
          .5,
          WH *
          .52,
          Math.max(
            WW,
            WH
          ) *
          .70
        );


      dark.addColorStop(
        0,
        "rgba(10,10,15,0)"
      );


      dark.addColorStop(
        1,
        "rgba(10,10,15," +
        (
          weights.sleep *
          .22
        ) +
        ")"
      );


      worldCtx.fillStyle =
        dark;


      worldCtx.fillRect(
        0,
        0,
        WW,
        WH
      );
    }


    /*
       STRESS:
       direction enters PAGE itself.
    */

    if (
      weights.stress >
      .01
    ) {

      var p =
        eventProgress();


      var x =
        lerp(
          -WW *
          .15,
          WW *
          1.05,
          eventWindow(
            p,
            .02,
            .72
          )
        );


      var stressGradient =
        worldCtx.createLinearGradient(
          x -
          220,
          0,
          x +
          260,
          0
        );


      stressGradient.addColorStop(
        0,
        "rgba(227,166,63,0)"
      );


      stressGradient.addColorStop(
        .52,
        "rgba(227,166,63," +
        (
          weights.stress *
          .018
        ) +
        ")"
      );


      stressGradient.addColorStop(
        1,
        "rgba(227,166,63,0)"
      );


      worldCtx.fillStyle =
        stressGradient;


      worldCtx.fillRect(
        x -
        220,
        0,
        480,
        WH
      );
    }


    /*
       NOVA:
       some organized territory exists outside the stage itself.
    */

    if (
      weights.nova >
      .01
    ) {

      var novaP =
        eventProgress();


      for (
        var i = 0;
        i <
        50;
        i++
      ) {

        var threshold =
          i /
          50 *
          .78;


        var reveal =
          eventWindow(
            novaP,
            threshold,
            threshold +
            .18
          );


        var x =
          hash(
            i *
            23
          ) *
          WW;


        var y =
          hash(
            i *
            31
          ) *
          WH;


        var alpha =
          weights.nova *
          reveal *
          (
            .015 +
            .035 *
            Math.abs(
              Math.sin(
                now *
                .0003 +
                i
              )
            )
          );


        worldCtx.beginPath();


        worldCtx.arc(
          x,
          y,
          .6 +
          hash(
            i *
            11
          ),
          0,
          TAU
        );


        worldCtx.fillStyle =
          "rgba(236,199,126," +
          alpha +
          ")";


        worldCtx.fill();
      }
    }
  }


  /* ==========================================================================
     MODE CHOREOGRAPHY → PERSISTENT STATE

     This is the crucial architectural change.

     The event itself changes the persistent system state.

     Switching modes interrupts here and the next event takes over from the
     current values rather than resetting the scene.
     ========================================================================== */

  function updatePersistentState(
    dt
  ) {

    var p =
      eventProgress();


    var positionTarget = {
      x:
        targetMode.position.x,

      y:
        targetMode.position.y
    };


    var factorTargets =
      targetMode.factors.slice();


    var coherenceTarget =
      targetMode.coherence;


    var cameraTarget = {
      scale:
        targetMode.camera.scale,

      x:
        targetMode.camera.x,

      y:
        targetMode.camera.y,

      rotation:
        targetMode.camera.rotation
    };


    /* ======================================================================
       SLEEP CHOREOGRAPHY
       ====================================================================== */

    if (
      activeMode ===
      "sleep"
    ) {

      /*
         Position descends inward late rather than immediately.
      */

      var descend =
        eventWindow(
          p,
          .18,
          .62
        );


      positionTarget.x =
        lerp(
          eventOrigin.position.x,
          targetMode.position.x,
          descend
        );


      positionTarget.y =
        lerp(
          eventOrigin.position.y,
          targetMode.position.y,
          descend
        );


      /*
         Envelope establishes before deep restoration finishes.
      */

      var shape =
        eventWindow(
          p,
          .12,
          .58
        );


      factorTargets =
        eventOrigin.factors.map(
          function (value, index) {

            return lerp(
              value,
              targetMode.factors[index],
              shape
            );
          }
        );


      coherenceTarget =
        lerp(
          eventOrigin.energy >
          .70
            ?
              .48
            :
              system.coherence,
          targetMode.coherence,
          eventWindow(
            p,
            .30,
            .84
          )
        );


      cameraTarget.scale =
        lerp(
          eventOrigin.energy >
          .8
            ?
              1.02
            :
              system.camera.scale,
          targetMode.camera.scale,
          eventWindow(
            p,
            .18,
            .70
          )
        );
    }


    /* ======================================================================
       STRESS CHOREOGRAPHY
       ====================================================================== */

    if (
      activeMode ===
      "stress"
    ) {

      /*
         Envelope anticipates incoming demand BEFORE position arrives.
      */

      var recruitGeometry =
        eventWindow(
          p,
          .08,
          .34
        );


      factorTargets =
        eventOrigin.factors.map(
          function (value, index) {

            return lerp(
              value,
              targetMode.factors[index],
              recruitGeometry
            );
          }
        );


      /*
         Position accelerates after geometry recruits.
      */

      var positionRecruit =
        eventWindow(
          p,
          .17,
          .43
        );


      positionTarget.x =
        lerp(
          eventOrigin.position.x,
          targetMode.position.x,
          positionRecruit
        );


      positionTarget.y =
        lerp(
          eventOrigin.position.y,
          targetMode.position.y,
          positionRecruit
        );


      /*
         Coherence falls under active recruitment,
         then partially RE-STABILIZES in hold phase.
      */

      var destabilize =
        pulseWindow(
          p,
          .18,
          .47,
          .72
        );


      var hold =
        eventWindow(
          p,
          .70,
          .96
        );


      coherenceTarget =
        lerp(
          targetMode.coherence,
          .36,
          destabilize
        );


      coherenceTarget =
        lerp(
          coherenceTarget,
          .63,
          hold
        );


      /*
         Camera acquires direction.
      */

      cameraTarget.x =
        lerp(
          system.camera.x,
          targetMode.camera.x,
          eventWindow(
            p,
            .05,
            .40
          )
        );


      cameraTarget.rotation =
        lerp(
          system.camera.rotation,
          targetMode.camera.rotation,
          eventWindow(
            p,
            .12,
            .44
          )
        );
    }


    /* ======================================================================
       RECOVERY CHOREOGRAPHY
       ====================================================================== */

    if (
      activeMode ===
      "recovery"
    ) {

      /*
         Position moves FIRST.
      */

      var positionReturn =
        eventWindow(
          p,
          .04,
          .30
        );


      positionTarget.x =
        lerp(
          eventOrigin.position.x,
          targetMode.position.x,
          positionReturn
        );


      positionTarget.y =
        lerp(
          eventOrigin.position.y,
          targetMode.position.y,
          positionReturn
        );


      /*
         Coherence returns second.
      */

      coherenceTarget =
        lerp(
          Math.min(
            system.coherence,
            .50
          ),
          targetMode.coherence,
          eventWindow(
            p,
            .22,
            .78
          )
        );


      /*
         Boundary changes last.
      */

      var boundaryReturn =
        eventWindow(
          p,
          .58,
          1
        );


      factorTargets =
        eventOrigin.factors.map(
          function (value, index) {

            return lerp(
              value,
              targetMode.factors[index],
              boundaryReturn
            );
          }
        );


      /*
         Camera backs away as room becomes perceivable.
      */

      cameraTarget.scale =
        lerp(
          system.camera.scale,
          targetMode.camera.scale,
          eventWindow(
            p,
            .46,
            .90
          )
        );
    }


    /* ======================================================================
       FLOW CHOREOGRAPHY
       ====================================================================== */

    if (
      activeMode ===
      "flow"
    ) {

      var lock =
        eventWindow(
          p,
          .18,
          .70
        );


      coherenceTarget =
        lerp(
          Math.min(
            system.coherence,
            .58
          ),
          targetMode.coherence,
          lock
        );


      factorTargets =
        eventOrigin.factors.map(
          function (value, index) {

            return lerp(
              value,
              targetMode.factors[index],
              eventWindow(
                p,
                .24,
                .72
              )
            );
          }
        );


      /*
         Position does not teleport into Flow.

         It gets carried into the stream during the late phase.
      */

      var carry =
        eventWindow(
          p,
          .62,
          .92
        );


      var wave =
        Math.sin(
          p *
          Math.PI *
          2
        ) *
        .035 *
        carry;


      positionTarget.x =
        lerp(
          eventOrigin.position.x,
          targetMode.position.x +
          wave,
          carry
        );


      positionTarget.y =
        lerp(
          eventOrigin.position.y,
          targetMode.position.y -
          wave *
          .35,
          carry
        );


      /*
         Camera drifts laterally with current.
      */

      cameraTarget.x =
        lerp(
          0,
          targetMode.camera.x,
          eventWindow(
            p,
            .50,
            .88
          )
        );
    }


    /* ======================================================================
       NOVA CHOREOGRAPHY
       ====================================================================== */

    if (
      activeMode ===
      "nova"
    ) {

      /*
         If Nova was entered from disorder,
         coherence establishes BEFORE territory expands.
      */

      var coherence =
        eventWindow(
          p,
          .03,
          .30
        );


      coherenceTarget =
        lerp(
          system.coherence,
          targetMode.coherence,
          coherence
        );


      /*
         Envelope expands in six earned increments.

         It therefore appears to OPEN as new relationships are successfully
         held rather than inflating continuously.
      */

      var stages =
        6;


      var completed =
        Math.floor(
          clamp(
            p,
            0,
            .999
          ) *
          stages
        );


      var stageLocal =
        (
          p *
          stages
        ) %
        1;


      var earned =
        (
          completed +
          smoothstep(
            clamp(
              (
                stageLocal -
                .28
              ) /
              .36,
              0,
              1
            )
          )
        ) /
        stages;


      factorTargets =
        eventOrigin.factors.map(
          function (value, index) {

            return lerp(
              value,
              targetMode.factors[index],
              earned
            );
          }
        );


      /*
         Position remains relatively controlled.

         Nova is not "state flying to edge."
      */

      positionTarget.x =
        lerp(
          eventOrigin.position.x,
          targetMode.position.x,
          eventWindow(
            p,
            .18,
            .55
          )
        );


      positionTarget.y =
        lerp(
          eventOrigin.position.y,
          targetMode.position.y,
          eventWindow(
            p,
            .18,
            .55
          )
        );


      /*
         Camera pulls BACK so expanded relational territory becomes visible.
      */

      cameraTarget.scale =
        lerp(
          system.camera.scale,
          targetMode.camera.scale,
          eventWindow(
            p,
            .22,
            .92
          )
        );
    }


    /* =========================================================================
       APPLY WITH DIFFERENT TIME CONSTANTS
       ========================================================================= */

    var positionK =
      1 -
      Math.exp(
        -dt /
        300
      );


    var factorK =
      1 -
      Math.exp(
        -dt /
        760
      );


    var coherenceK =
      1 -
      Math.exp(
        -dt /
        560
      );


    var energyK =
      1 -
      Math.exp(
        -dt /
        640
      );


    var cameraK =
      1 -
      Math.exp(
        -dt /
        820
      );


    system.position.x =
      lerp(
        system.position.x,
        positionTarget.x,
        positionK
      );


    system.position.y =
      lerp(
        system.position.y,
        positionTarget.y,
        positionK
      );


    system.factors =
      system.factors.map(
        function (value, index) {

          return lerp(
            value,
            factorTargets[index],
            factorK
          );
        }
      );


    system.coherence =
      lerp(
        system.coherence,
        coherenceTarget,
        coherenceK
      );


    system.energy =
      lerp(
        system.energy,
        targetMode.energy,
        energyK
      );


    system.camera.scale =
      lerp(
        system.camera.scale,
        cameraTarget.scale,
        cameraK
      );


    system.camera.x =
      lerp(
        system.camera.x,
        cameraTarget.x,
        cameraK
      );


    system.camera.y =
      lerp(
        system.camera.y,
        cameraTarget.y,
        cameraK
      );


    system.camera.rotation =
      lerp(
        system.camera.rotation,
        cameraTarget.rotation,
        cameraK
      );
  }


  /* ==========================================================================
     MODE WEIGHTS
     ========================================================================== */

  function updateModeWeights(
    dt
  ) {

    var k =
      1 -
      Math.exp(
        -dt /
        620
      );


    Object.keys(
      weights
    )
    .forEach(
      function (key) {

        weights[key] =
          lerp(
            weights[key],
            weightTargets[key],
            k
          );
      }
    );
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


  function frame(
    now
  ) {

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


    clock +=
      dt;


    updateModeWeights(
      dt
    );


    updatePersistentState(
      dt
    );


    drawSVG(
      now
    );


    if (
      !reduce
    ) {

      drawPhenomena(
        now
      );


      drawWorld(
        now
      );
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

          selectMode(
            button.getAttribute(
              "data-mode"
            )
          );
        }
      );
    }
  );


  /* ==========================================================================
     CANVAS RESIZE
     ========================================================================== */

  function resizeCanvases() {

    DPR =
      Math.min(
        2,
        window.devicePixelRatio ||
        1
      );


    var stageRect =
      phenomena.getBoundingClientRect();


    CW =
      Math.max(
        1,
        stageRect.width
      );


    CH =
      Math.max(
        1,
        stageRect.height
      );


    phenomena.width =
      Math.round(
        CW *
        DPR
      );


    phenomena.height =
      Math.round(
        CH *
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


    var worldRect =
      world.getBoundingClientRect();


    WW =
      Math.max(
        1,
        worldRect.width
      );


    WH =
      Math.max(
        1,
        worldRect.height
      );


    world.width =
      Math.round(
        WW *
        DPR
      );


    world.height =
      Math.round(
        WH *
        DPR
      );


    worldCtx.setTransform(
      DPR,
      0,
      0,
      DPR,
      0,
      0
    );
  }


  if (
    !reduce
  ) {

    resizeCanvases();


    window.addEventListener(
      "resize",
      resizeCanvases,
      {
        passive: true
      }
    );
  }


  /* ==========================================================================
     VISIBILITY
     ========================================================================== */

  if (
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
     REDUCED MOTION
     ========================================================================== */

  function snapToMode(
    key
  ) {

    activeMode =
      key;


    targetMode =
      MODES[
        key
      ];


    system.factors =
      targetMode.factors.slice();


    system.position.x =
      targetMode.position.x;


    system.position.y =
      targetMode.position.y;


    system.energy =
      targetMode.energy;


    system.coherence =
      targetMode.coherence;


    system.camera.scale =
      targetMode.camera.scale;


    system.camera.x =
      targetMode.camera.x;


    system.camera.y =
      targetMode.camera.y;


    system.camera.rotation =
      targetMode.camera.rotation;


    Object.keys(
      weights
    )
    .forEach(
      function (name) {

        weights[name] =
          name ===
          key
            ?
              1
            :
              0;


        weightTargets[name] =
          weights[name];
      }
    );


    buttons.forEach(
      function (button) {

        button.setAttribute(
          "aria-pressed",

          String(
            button.getAttribute(
              "data-mode"
            ) ===
            key
          )
        );
      }
    );


    drawSVG(
      0
    );
  }


  if (
    reduce
  ) {

    buttons.forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            snapToMode(
              button.getAttribute(
                "data-mode"
              )
            );
          }
        );
      }
    );
  }


  /* ==========================================================================
     INITIAL
     ========================================================================== */

  updateAurora(
    "recovery"
  );


  buttons.forEach(
    function (button) {

      button.setAttribute(
        "aria-pressed",

        String(
          button.getAttribute(
            "data-mode"
          ) ===
          "recovery"
        )
      );
    }
  );


  captureEventOrigin();


  modeStart =
    0;


  if (
    reduce
  ) {

    snapToMode(
      "recovery"
    );

  } else {

    ensureAnimation();
  }

})();
