/* The five modes — extracted from the standalone reference. */
(function () {
  "use strict";


  /* ==========================================================================
     GEOMETRY
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
    190;


  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  var svg =
    document.getElementById(
      "fm5-field"
    );


  var host =
    document.querySelector(
      ".fm5"
    );


  var buttons =
    Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-mode]"
      )
    );


  var phenomena =
    document.getElementById(
      "fm5-phenomena"
    );


  var world =
    document.getElementById(
      "fm5-world"
    );


  var ctx =
    phenomena.getContext("2d");


  var worldCtx =
    world.getContext("2d");


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  function el(name, attrs) {

    var n =
      document.createElementNS(
        NS,
        name
      );


    Object.keys(
      attrs || {}
    )
    .forEach(
      function (key) {

        n.setAttribute(
          key,
          attrs[key]
        );
      }
    );


    return n;
  }


  function clamp(v, a, b) {

    return Math.max(
      a,
      Math.min(
        b,
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
    r,
    a
  ) {

    return {
      x:
        cx +
        Math.cos(a) *
        r,

      y:
        cy +
        Math.sin(a) *
        r
    };
  }


  /* ==========================================================================
     NINE DIMENSIONS

     These are not rendered as labels.

     They simply govern envelope geometry.

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

  var NEUTRAL = [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ];


  var MODES = {


    /*
       SLEEP
       sleep strict
       activity very open
       stress open
       others slightly open
    */
    sleep: {

      name:
        "Sleep",

      desc:
        "Deep overnight restoration.",

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

      pos: {
        x:
          -.12,

        y:
          .10
      },

      energy:
        .27
    },


    /*
       STRESS
       heart expected elevated
       stress expected elevated
       recovery + sleep watched closely
    */
    stress: {

      name:
        "Stress",

      desc:
        "Elevated demand and active adaptation.",

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

      pos: {
        x:
          .53,

        y:
          -.20
      },

      energy:
        .92
    },


    /*
       RECOVERY
       activity headroom open
       recovery itself watched closely
    */
    recovery: {

      name:
        "Recovery",

      desc:
        "Reserves rebuilding as capacity returns.",

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

      pos: {
        x:
          .16,

        y:
          .12
      },

      energy:
        .49
    },


    /*
       FLOW
       balanced slight opening everywhere
    */
    flow: {

      name:
        "Flow",

      desc:
        "Organization coordinated and sustainable.",

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

      pos: {
        x:
          .25,

        y:
          -.01
      },

      energy:
        .70
    },


    /*
       NOVA
       the same organisation as Flow, opened further

       Nova deliberately does NOT warp. Stress and Recovery distort because
       something is being defended or rebuilt; Nova is the whole system open
       at once, so it keeps Flow's shape and simply has more of it. A warped
       Nova would read as strain rather than as surplus.
    */
    nova: {

      name:
        "Nova",

      desc:
        "Deep reserve, clean relationships, surplus capacity.",

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

      pos: {
        x:
          .18,

        y:
          -.07
      },

      energy:
        .99
    }

  };


  /* ==========================================================================
     ENVELOPE PATH
     ========================================================================== */

  function envelopePath(
    factors,
    scale
  ) {

    var count =
      108;


    var samples =
      [];


    for (
      var i = 0;
      i < count;
      i++
    ) {

      var t =
        i /
        count *
        9;


      var a =
        Math.floor(t) %
        9;


      var b =
        (
          a +
          1
        ) %
        9;


      var f =
        smoothstep(
          t -
          Math.floor(t)
        );


      samples.push(
        factors[a] *
        (
          1 -
          f
        ) +
        factors[b] *
        f
      );
    }


    /*
       Normalize visual range.

       We want meaningful anisotropy without a 1.4× threshold becoming a
       grotesquely literal 40% radius change.
    */
    samples =
      samples.map(
        function (v) {

          return (
            .78 +
            (
              v -
              .70
            ) *
            .63
          );
        }
      );


    var points =
      [];


    for (
      var j = 0;
      j < count;
      j++
    ) {

      var angle =
        j /
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
          samples[j],
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
      var k = 0;
      k < count;
      k++
    ) {

      var p0 =
        points[
          (
            k -
            1 +
            count
          ) %
          count
        ];


      var p1 =
        points[k];


      var p2 =
        points[
          (
            k +
            1
          ) %
          count
        ];


      var p3 =
        points[
          (
            k +
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
     SVG DEFS
     ========================================================================== */

  var defs =
    el("defs");


  var edgeGradient =
    el(
      "linearGradient",
      {
        id:
          "fm5-edge-gradient",

        x1:
          "8%",

        y1:
          "90%",

        x2:
          "92%",

        y2:
          "10%"
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


  var fillGradient =
    el(
      "radialGradient",
      {
        id:
          "fm5-fill-gradient",

        cx:
          "50%",

        cy:
          "46%",

        r:
          "70%"
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
      ".07"
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
    }
  );


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
     SVG BUILD
     ========================================================================== */

  var identity =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-identity",

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
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-identity-inner",

          cx:
            CX,

          cy:
            CY,

            r:
              R *
            .69
          }
    )
  );


  var fill =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-fill",

          fill:
            "url(#fm5-fill-gradient)"
          }
    )
  );


  var sectors =
    svg.appendChild(
      el("g")
    );


  var sectorCaps =
    svg.appendChild(
      el("g")
    );


  var history =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-history"
          }
    )
  );


  var historyDots =
    svg.appendChild(
      el("g")
    );


  var contours =
    svg.appendChild(
      el("g")
    );


  var threads =
    svg.appendChild(
      el("g")
    );


  var nodes =
    svg.appendChild(
      el("g")
    );


  var modeLayer =
    svg.appendChild(
      el("g")
    );


  var guardLayer =
    svg.appendChild(
      el("g")
    );


  var bloom =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-boundary-bloom",

          stroke:
            "url(#fm5-edge-gradient)"
          }
    )
  );


  var boundaryDeep =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-boundary-deep",

          stroke:
            "url(#fm5-edge-gradient)"
          }
    )
  );


  var boundary =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-boundary",

          stroke:
            "url(#fm5-edge-gradient)"
          }
    )
  );


  var beads =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "fm5-boundary-beads",

          stroke:
            "url(#fm5-edge-gradient)"
          }
    )
  );


  var positionHalo =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-position-halo",

          fill:
            "var(--aqua)"
          }
    )
  );


  var positionRing =
    svg.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm5-position-ring",

          stroke:
            "var(--aqua)"
          }
    )
  );


  var position =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-position",

          fill:
            "var(--aqua)",

            r:
              "6.2"
          }
    )
  );


  var core =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-position-core",

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
            "fm5-mode-name",

          x:
            "550",

          y:
            "577",

          "text-anchor":
            "middle"
          }
    )
  );


  var modeDesc =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "fm5-mode-desc",

          x:
            "550",

          y:
            "606",

          "text-anchor":
            "middle"
          }
    )
  );


  /* base geometry */

  for (
    var s = 0;
    s < 9;
    s++
  ) {

    sectors.appendChild(
      el(
        "line",
        {
          class:
            "fm5-sector"
          }
    )
  );


    sectorCaps.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-sector-cap",

            r:
              "3"
          }
    )
  );
  }


  for (
    var c = 0;
    c < 23;
    c++
  ) {

    contours.appendChild(
      el(
        "path",
        {
          class:
            "fm5-contour",

          stroke:
            c >
            16
              ?
                "var(--glow)"
              :
                "var(--aqua)"
          }
    )
  );
  }


  for (
    var t = 0;
    t < 38;
    t++
  ) {

    threads.appendChild(
      el(
        "path",
        {
          class:
            "fm5-thread",

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
  );
  }


  for (
    var n = 0;
    n < 48;
    n++
  ) {

    nodes.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-node",

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
  );
  }


  for (
    var hd = 0;
    hd < 12;
    hd++
  ) {

    historyDots.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-history-dot",

            r:
              (
              1.1 +
              hd /
              11 *
              1.4
            ).toFixed(2)
          }
    )
  );
  }


  /*
     Two guarded regions.

     Their meaning changes by mode through placement and visibility.

     They are especially important in Nova:
       recovery
       stability
  */

  var guardA =
    guardLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm5-guard",

          stroke:
            "var(--glow)"
          }
    )
  );


  var guardABloom =
    guardLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm5-guard-bloom",

          stroke:
            "var(--glow)"
          }
    )
  );


  var guardB =
    guardLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm5-guard",

          stroke:
            "var(--aqua)"
          }
    )
  );


  var guardBBloom =
    guardLayer.appendChild(
      el(
        "ellipse",
        {
          class:
            "fm5-guard-bloom",

          stroke:
            "var(--aqua)"
          }
    )
  );


  /* ==========================================================================
     CURRENT MODE STATE
     ========================================================================== */

  var activeMode =
    "recovery";


  var target =
    MODES.recovery;


  var factors =
    target.factors.slice();


  var pos = {
    x:
      target.pos.x,

    y:
      target.pos.y
  };


  var energy =
    target.energy;


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


  var historyPoints = [
    {
      x:
        .53,

      y:
        -.20
    },

    {
      x:
        .36,

      y:
        -.10
    },

    {
      x:
        .24,

      y:
        .03
    },

    {
      x:
        .16,

      y:
        .12
    }
  ];


  var clock =
    0;


  var modeStart =
    0;


  function modeProgress(seconds) {

    return smoothstep(
      clamp(
        (
          clock -
          modeStart
        ) /
        (
          seconds *
          1000
        ),
        0,
        1
      )
    );
  }


  /* ==========================================================================
     MODE-SPECIFIC SVG LAYERS
     ========================================================================== */

  var sleepRings =
    [];


  var sleepRoutes =
    [];


  for (
    var sr = 0;
    sr < 12;
    sr++
  ) {

    sleepRings.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm5-sleep-ring"
          }
      )
    )
  );
  }


  for (
    var sl = 0;
    sl < 7;
    sl++
  ) {

    sleepRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-sleep-route"
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
            "fm5-sleep-gate",

            r:
              "3.5"
          }
    )
  );


  var pressureWaves =
    [];


  var demandRoutes =
    [];


  var hotNodes =
    [];


  for (
    var pw = 0;
    pw < 8;
    pw++
  ) {

    pressureWaves.push(
      modeLayer.appendChild(
        el(
          "ellipse",
          {
            class:
              "fm5-pressure"
          }
      )
    )
  );
  }


  for (
    var dr = 0;
    dr < 8;
    dr++
  ) {

    demandRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-demand"
          }
      )
    )
  );
  }


  for (
    var hn = 0;
    hn < 14;
    hn++
  ) {

    hotNodes.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm5-hot",

            r:
              (
                1.1 +
                hash(
                  hn *
                  13
                ) *
                1.5
              ).toFixed(2)
          }
      )
    )
  );
  }


  var strainGhosts =
    [];


  var releaseRoutes =
    [];


  for (
    var sg = 0;
    sg < 6;
    sg++
  ) {

    strainGhosts.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-strain-ghost"
          }
      )
    )
  );
  }


  for (
    var rel = 0;
    rel < 12;
    rel++
  ) {

    releaseRoutes.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-release"
          }
      )
    )
  );
  }


  var reserveGlow =
    modeLayer.appendChild(
      el(
        "circle",
        {
          class:
            "fm5-reserve"
          }
    )
  );


  var flowPaths =
    [];


  var flowPulses =
    [];


  for (
    var fl = 0;
    fl < 17;
    fl++
  ) {

    flowPaths.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-flow-path"
          }
      )
    )
  );
  }


  for (
    var fpn = 0;
    fpn < 15;
    fpn++
  ) {

    flowPulses.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm5-flow-pulse",

            r:
              "2.4"
          }
      )
    )
  );
  }


  var novaLinks =
    [];


  var novaNodes =
    [];


  var novaReturns =
    [];


  for (
    var nl = 0;
    nl < 32;
    nl++
  ) {

    novaLinks.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-nova-link"
          }
      )
    )
  );
  }


  for (
    var nn = 0;
    nn < 36;
    nn++
  ) {

    novaNodes.push(
      modeLayer.appendChild(
        el(
          "circle",
          {
            class:
              "fm5-nova-node",

            r:
              (
              1.2 +
              hash(
                nn *
                11
              ) *
              1.6
            ).toFixed(2)
          }
      )
    )
  );
  }


  for (
    var ret = 0;
    ret < 12;
    ret++
  ) {

    novaReturns.push(
      modeLayer.appendChild(
        el(
          "path",
          {
            class:
              "fm5-nova-return"
          }
      )
    )
  );
  }


  /* ==========================================================================
     SET MODE
     ========================================================================== */

  function setMode(key) {

    if (
      !MODES[key]
    ) {
      return;
    }


    activeMode =
      key;


    target =
      MODES[key];


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


    historyPoints.push({
      x:
        pos.x,

      y:
        pos.y
    });


    if (
      historyPoints.length >
      16
    ) {

      historyPoints.shift();
    }


    setAurora(
      key
    );


    ensure();
  }


  function setAurora(key) {

    var aurora =
      host.querySelector(
        ".fm5__aurora"
      );


    if (
      key ===
      "sleep"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 47% 58%,color-mix(in srgb,var(--glow-soft) 6%,transparent),transparent 38%)";


      host.style.setProperty(
        "--fm5-scale",
        ".82"
      );


      host.style.setProperty(
        "--fm5-y",
        "5%"
      );

    } else if (
      key ===
      "stress"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 61% 43%,color-mix(in srgb,var(--status-ease) 13%,transparent),transparent 40%)";


      host.style.setProperty(
        "--fm5-scale",
        "1.08"
      );


      host.style.setProperty(
        "--fm5-x",
        "5%"
      );

    } else if (
      key ===
      "flow"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 52% 50%,color-mix(in srgb,var(--aqua) 11%,transparent),transparent 46%)";


      host.style.setProperty(
        "--fm5-scale",
        "1.08"
      );


      host.style.setProperty(
        "--fm5-x",
        "0%"
      );

    } else if (
      key ===
      "nova"
    ) {

      aurora.style.background =
        "radial-gradient(ellipse at 50% 47%,color-mix(in srgb,var(--glow) 14%,transparent),transparent 49%)";


      host.style.setProperty(
        "--fm5-scale",
        "1.25"
      );


      host.style.setProperty(
        "--fm5-x",
        "0%"
      );

    } else {

      aurora.style.background =
        "radial-gradient(ellipse at 50% 53%,color-mix(in srgb,var(--status-go) 8%,transparent),transparent 43%)";


      host.style.setProperty(
        "--fm5-scale",
        "1"
      );


      host.style.setProperty(
        "--fm5-x",
        "0%"
      );
    }
  }


  /* ==========================================================================
     CORE DRAW
     ========================================================================== */

  function drawCore(now) {

    var scale =
      1;


    var p =
      envelopePath(
        factors,
        scale
      );


    fill.setAttribute(
      "d",
      p
    );


    bloom.setAttribute(
      "d",
      p
    );


    boundaryDeep.setAttribute(
      "d",
      p
    );


    boundary.setAttribute(
      "d",
      p
    );


    beads.setAttribute(
      "d",
      p
    );


    bloom.style.opacity =
      (
        .07 +
        energy *
        .16
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       NINE SECTORS
       ---------------------------------------------------------------------- */

    var sectorLines =
      sectors.childNodes;


    var caps =
      sectorCaps.childNodes;


    for (
      var i = 0;
      i < 9;
      i++
    ) {

      var angle =
        angleAt9(
          i
        );


      var normalized =
        visualFactor(
          factors[i]
        );


      var p0 =
        polar(
          CX,
          CY,
          R *
          .24,
          angle
        );


      var p1 =
        polar(
          CX,
          CY,
          R *
          normalized,
          angle
        );


      sectorLines[i]
        .setAttribute(
          "x1",
          p0.x
        );


      sectorLines[i]
        .setAttribute(
          "y1",
          p0.y
        );


      sectorLines[i]
        .setAttribute(
          "x2",
          p1.x
        );


      sectorLines[i]
        .setAttribute(
          "y2",
          p1.y
        );


      caps[i]
        .setAttribute(
          "cx",
          p1.x
        );


      caps[i]
        .setAttribute(
          "cy",
          p1.y
        );


      caps[i]
        .style.opacity =
        (
          .025 +
          Math.abs(
            factors[i] -
            1
          ) *
          .28
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       TOPOLOGY
       ---------------------------------------------------------------------- */

    var contourNodes =
      contours.childNodes;


    for (
      var c = 0;
      c < contourNodes.length;
      c++
    ) {

      var f =
        (
          c +
          1
        ) /
        contourNodes.length;


      var innerFactors =
        factors.map(
          function (factor) {

            return lerp(
              1,
              factor,
              .45 +
              f *
              .55
            );
          }
        );


      contourNodes[c]
        .setAttribute(
          "d",
          envelopePath(
            innerFactors,
            .14 +
            f *
            .81
          )
        );


      contourNodes[c]
        .style.opacity =
        (
          .022 +
          (
            1 -
            f
          ) *
          .13
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       THREADS
       ---------------------------------------------------------------------- */

    var threadNodes =
      threads.childNodes;


    for (
      var ti = 0;
      ti < threadNodes.length;
      ti++
    ) {

      var a =
        hash(
          ti *
          17
        ) *
        TAU;


      var b =
        a +
        1 +
        hash(
          ti *
          29
        ) *
        2.2;


      var pA =
        polar(
          CX,
          CY,
          R *
          (
            .18 +
            hash(
              ti *
              11
            ) *
            .50
          ),
          a
        );


      var pB =
        polar(
          CX,
          CY,
          R *
          (
            .42 +
            hash(
              ti *
              31
            ) *
            .39
          ),
          b
        );


      var bend =
        weights.stress *
        .48 +
        (
          1 -
          weights.flow
        ) *
        .10;


      var control =
        polar(
          CX,
          CY,
          R *
          (
            .16 +
            hash(
              ti *
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
            .0005 +
            ti
          ) *
          bend
        );


      threadNodes[ti]
        .setAttribute(
          "d",
          "M" +
          pA.x.toFixed(1) +
          " " +
          pA.y.toFixed(1) +
          "Q" +
          control.x.toFixed(1) +
          " " +
          control.y.toFixed(1) +
          "," +
          pB.x.toFixed(1) +
          " " +
          pB.y.toFixed(1)
        );


      threadNodes[ti]
        .style.opacity =
        (
          .025 +
          (
            .06 +
            hash(
              ti *
              13
            ) *
            .13
          ) *
          (
            .72 +
            weights.flow *
            .28 +
            weights.nova *
            .34
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       NODES
       ---------------------------------------------------------------------- */

    var nodeList =
      nodes.childNodes;


    for (
      var ni = 0;
      ni < nodeList.length;
      ni++
    ) {

      var angle =
        hash(
          ni *
          37
        ) *
        TAU;


      var rr =
        R *
        Math.sqrt(
          .04 +
          hash(
            ni *
            19
          ) *
          .76
        );


      var freedom =
        weights.stress *
        .72 +
        weights.recovery *
        (
          1 -
          modeProgress(
            5.5
          )
        ) *
        .22;


      var pNode =
        polar(
          CX,
          CY,
          rr +
          Math.cos(
            now *
            .0004 +
            ni
          ) *
          freedom *
          10,
          angle +
          Math.sin(
            now *
            .0003 +
            ni
          ) *
          freedom *
          .12
        );


      nodeList[ni]
        .setAttribute(
          "cx",
          pNode.x
        );


      nodeList[ni]
        .setAttribute(
          "cy",
          pNode.y
        );


      nodeList[ni]
        .style.opacity =
        (
          .08 +
          (
            weights.flow *
            .22 +
            weights.nova *
            .35 +
            weights.sleep *
            .10
          )
        ).toFixed(3);
    }


    drawPosition();
    drawGuards();
    drawHistory();
  }


  function angleAt9(i) {

    return (
      i /
      9 *
      TAU -
      Math.PI /
      2
    );
  }


  function visualFactor(v) {

    return (
      .78 +
      (
        v -
        .70
      ) *
      .63
    );
  }


  function drawPosition() {

    var x =
      CX +
      pos.x *
      R;


    var y =
      CY +
      pos.y *
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
      19 +
      energy *
      30
    );


    positionHalo.style.opacity =
      .07 +
      energy *
      .21;


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
      11 +
      weights.stress *
      13
    );


    positionRing.setAttribute(
      "ry",
      9 +
      energy *
      3
    );


    position.setAttribute(
      "cx",
      x
    );


    position.setAttribute(
      "cy",
      y
    );


    core.setAttribute(
      "cx",
      x
    );


    core.setAttribute(
      "cy",
      y
    );


    modeName.textContent =
      target.name;


    modeDesc.textContent =
      target.desc;
  }


  /* ==========================================================================
     GUARDED REGIONS
     ========================================================================== */

  function drawGuards() {

    /*
       approximate dimension angles:
       recovery = 3
       stability = 4
       sleep = 1
    */

    var guardStrengthA =
      weights.nova *
      .92 +
      weights.stress *
      .62 +
      weights.recovery *
      .78;


    var guardStrengthB =
      weights.nova *
      .78 +
      weights.stress *
      .54;


    var aAngle =
      activeMode ===
      "stress"
        ?
          angleAt9(1)
        :
          angleAt9(3);


    var bAngle =
      angleAt9(4);


    var A =
      polar(
        CX,
        CY,
        R *
        .53,
        aAngle
      );


    var B =
      polar(
        CX,
        CY,
        R *
        .53,
        bAngle
      );


    setGuard(
      guardA,
      guardABloom,
      A,
      guardStrengthA,
      -22
    );


    setGuard(
      guardB,
      guardBBloom,
      B,
      guardStrengthB,
      18
    );
  }


  function setGuard(
    ring,
    bloomRing,
    point,
    strength,
    rotation
  ) {

    [
      ring,
      bloomRing
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
          23
        );


        node.setAttribute(
          "ry",
          11
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


    ring.style.opacity =
      strength *
      .62;


    bloomRing.style.opacity =
      strength *
      .14;
  }


  /* ==========================================================================
     HISTORY
     ========================================================================== */

  function drawHistory() {

    var points =
      historyPoints.concat([
        {
          x:
            pos.x,

          y:
            pos.y
        }
      ]);


    var d =
      "";


    points.forEach(
      function (p, i) {

        d +=
          (
            i
              ?
                "L"
              :
                "M"
          ) +
          (
            CX +
            p.x *
            R
          ).toFixed(1) +
          " " +
          (
            CY +
            p.y *
            R
          ).toFixed(1);
      }
    );


    history.setAttribute(
      "d",
      d
    );


    history.style.opacity =
      .10 +
      weights.recovery *
      .48;


    var dots =
      historyDots.childNodes;


    for (
      var i = 0;
      i < dots.length;
      i++
    ) {

      var idx =
        Math.round(
          i *
          (
            points.length -
            1
          ) /
          Math.max(
            1,
            dots.length -
            1
          )
        );


      var p =
        points[
          Math.min(
            points.length -
            1,
            idx
          )
        ];


      dots[i]
        .setAttribute(
          "cx",
          CX +
          p.x *
          R
        );


      dots[i]
        .setAttribute(
          "cy",
          CY +
          p.y *
          R
        );


      dots[i]
        .style.opacity =
        .03 +
        weights.recovery *
        i /
        12 *
        .30;
    }
  }


  /* ==========================================================================
     SLEEP SVG

     The reader should immediately see:
       outside ignored
       inside active
       a deep governing rhythm
     ========================================================================== */

  function drawSleep(now) {

    var w =
      weights.sleep;


    var p =
      modeProgress(
        5
      );


    sleepRings.forEach(
      function (ring, i) {

        var f =
          (
            i +
            1
          ) /
          sleepRings.length;


        var rr =
          R *
          (
            .11 +
            f *
            .69
          ) *
          lerp(
            1.10,
            .91,
            p
          );


        ring.setAttribute(
          "cx",
          CX -
          16 *
          p
        );


        ring.setAttribute(
          "cy",
          CY +
          13 *
          p
        );


        ring.setAttribute(
          "rx",
          rr
        );


        ring.setAttribute(
          "ry",
          rr *
          (
            .90 -
            f *
            .04
          )
        );


        ring.style.opacity =
          w *
          (
            .025 +
            p *
            .11
          ) *
          (
            1 -
            f *
            .35
          );
      }
    );


    /*
       Deep circulating routes.
    */

    sleepRoutes.forEach(
      function (route, i) {

        var a =
          i /
          sleepRoutes.length *
          TAU;


        var start =
          polar(
            CX,
            CY,
            R *
            .65,
            a
          );


        var end =
          polar(
            CX -
            18,
            CY +
            12,
            R *
            .16,
            a +
            1.5
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .27,
            a +
            .7
          );


        route.setAttribute(
          "d",
          "M" +
          start.x +
          " " +
          start.y +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          end.x +
          " " +
          end.y
        );


        route.style.opacity =
          w *
          p *
          .23;
      }
    );


    /*
       Circadian / sleep-quality gate:
       one specific internal relationship remains sharply visible.
    */

    var gate =
      polar(
        CX,
        CY,
        R *
        .60,
        angleAt9(1)
      );


    sleepGate.setAttribute(
      "cx",
      gate.x
    );


    sleepGate.setAttribute(
      "cy",
      gate.y
    );


    sleepGate.style.opacity =
      w *
      (
        .20 +
        p *
        .80
      );
  }


  /* ==========================================================================
     STRESS SVG

     Immediately visible:
       system recruits toward load
       high-demand side opens
       protected reserves become evident
     ========================================================================== */

  function drawStress(now) {

    var w =
      weights.stress;


    var age =
      Math.max(
        0,
        clock -
        modeStart
      );


    pressureWaves.forEach(
      function (wave, i) {

        var local =
          Math.max(
            0,
            age -
            i *
            100
          );


        var p =
          clamp(
            local /
            1700,
            0,
            1
          );


        wave.setAttribute(
          "cx",
          225 +
          p *
          430
        );


        wave.setAttribute(
          "cy",
          CY
        );


        wave.setAttribute(
          "rx",
          30 +
          p *
          150
        );


        wave.setAttribute(
          "ry",
          75 +
          p *
          260
        );


        wave.style.opacity =
          w *
          (
            1 -
            p
          ) *
          .32;
      }
    );


    /*
       Demand routes converge on the high-tolerance stress/heart side.
    */

    demandRoutes.forEach(
      function (route, i) {

        var y =
          155 +
          i *
          42;


        var targetPoint =
          polar(
            CX,
            CY,
            R *
            .83,
            -.38 +
            i *
            .025
          );


        route.setAttribute(
          "d",
          "M120 " +
          y +
          "C300 " +
          (
            y +
            Math.sin(
              now *
              .002 +
              i
            ) *
            24
          ) +
          ",410 " +
          targetPoint.y +
          "," +
          targetPoint.x +
          " " +
          targetPoint.y
        );


        route.style.opacity =
          w *
          (
            .05 +
            .15 *
            Math.abs(
              Math.sin(
                now *
                .001 +
                i
              )
            )
          );
      }
    );


    hotNodes.forEach(
      function (node, i) {

        var angle =
          -.52 +
          (
            i /
            hotNodes.length -
            .5
          ) *
          .90;


        var point =
          polar(
            CX,
            CY,
            R *
            (
              .72 +
              hash(
                i *
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
          w *
          (
            .18 +
            .58 *
            Math.abs(
              Math.sin(
                now *
                .004 +
                i
              )
            )
          );
      }
    );
  }


  /* ==========================================================================
     RECOVERY SVG

     Immediately visible:
       strain ghost
       outward release
       reserve filling
       room reopening
     ========================================================================== */

  function drawRecovery(now) {

    var w =
      weights.recovery;


    var p =
      modeProgress(
        6
      );


    /*
       Stress envelope remains as memory.
    */

    strainGhosts.forEach(
      function (ghost, i) {

        var ghostFactors =
          MODES.stress.factors.map(
            function (value, j) {

              return lerp(
                value,
                factors[j],
                p
              );
            }
          );


        ghost.setAttribute(
          "d",
          envelopePath(
            ghostFactors,
            1 +
            i *
            .015
          )
        );


        ghost.style.opacity =
          w *
          (
            1 -
            p
          ) *
          (
            .03 +
            i *
            .011
          );
      }
    );


    /*
       Load visibly exits the system.

       These begin deep and extend outward as recovery matures.
    */

    releaseRoutes.forEach(
      function (route, i) {

        var angle =
          i /
          releaseRoutes.length *
          TAU +
          .4;


        var start =
          polar(
            CX,
            CY,
            R *
            (
              .18 +
              hash(
                i *
                19
              ) *
              .30
            ),
            angle
          );


        var end =
          polar(
            CX,
            CY,
            R *
            (
              .75 +
              p *
              .54
            ),
            angle +
            Math.sin(
              i
            ) *
            .13
          );


        var control =
          polar(
            CX,
            CY,
            R *
            .55,
            angle +
            .18 *
            Math.sin(
              i *
              .7
            )
          );


        route.setAttribute(
          "d",
          "M" +
          start.x +
          " " +
          start.y +
          "Q" +
          control.x +
          " " +
          control.y +
          "," +
          end.x +
          " " +
          end.y
        );


        route.style.opacity =
          w *
          (
            .04 +
            p *
            .22
          );
      }
    );


    /*
       Reserve visibly fills near the current position.
    */

    var reservePoint =
      polar(
        CX,
        CY,
        R *
        .48,
        angleAt9(3)
      );


    reserveGlow.setAttribute(
      "cx",
      reservePoint.x
    );


    reserveGlow.setAttribute(
      "cy",
      reservePoint.y
    );


    reserveGlow.setAttribute(
      "r",
      25 +
      p *
      80
    );


    reserveGlow.style.opacity =
      w *
      p *
      .09;
  }


  /* ==========================================================================
     FLOW SVG

     Immediately visible:
       parallel transport
       pulses share direction
       position is in motion
     ========================================================================== */

  function drawFlow(now) {

    var w =
      weights.flow;


    var p =
      modeProgress(
        4.5
      );


    flowPaths.forEach(
      function (path, i) {

        var lane =
          (
            i -
            8
          ) *
          14;


        var disorder =
          (
            1 -
            p
          ) *
          Math.sin(
            now *
            .0015 +
            i *
            .70
          ) *
          30;


        path.setAttribute(
          "d",
          "M240 " +
          (
            CY +
            lane +
            disorder
          ) +
          "C365 " +
          (
            CY +
            lane *
            .64
          ) +
          ",570 " +
          (
            CY +
            lane *
            .12
          ) +
          ",860 " +
          (
            CY +
            lane *
            .50
          )
        );


        path.style.opacity =
          w *
          (
            .03 +
            p *
            .24
          );
      }
    );


    flowPulses.forEach(
      function (pulse, i) {

        var phase =
          reduce
            ?
              .62
            :
              (
                now /
                (
                  2500 +
                  i *
                  31
                ) +
                i /
                flowPulses.length
              ) %
              1;


        var x =
          lerp(
            260,
            850,
            phase
          );


        var lane =
          (
            i -
            7
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
          w *
          p *
          Math.sin(
            phase *
            Math.PI
          ) *
          .68;
      }
    );
  }


  /* ==========================================================================
     NOVA SVG

     Immediately visible:
       many simultaneously active regions
       long-range connections
       out-and-return traffic
       guarded reserve/stability still present
     ========================================================================== */

  function drawNova(now) {

    var w =
      weights.nova;


    var p =
      modeProgress(
        6.4
      );


    var pts =
      [];


    novaNodes.forEach(
      function (node, i) {

        var threshold =
          i /
          novaNodes.length *
          .82;


        var reveal =
          smoothstep(
            (
              p -
              threshold
            ) /
            .16
          );


        var angle =
          hash(
            i *
            29
          ) *
          TAU;


        var rr =
          R *
          (
            .44 +
            hash(
              i *
              17
            ) *
            1.05
          );


        var point =
          polar(
            CX,
            CY,
            rr,
            angle
          );


        pts.push(
          point
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
          w *
          reveal *
          (
            .14 +
            hash(
              i *
              7
            ) *
            .70
          );
      }
    );


    novaLinks.forEach(
      function (link, i) {

        var A =
          pts[
            i %
            pts.length
          ];


        var B =
          pts[
            (
              i *
              7 +
              9
            ) %
            pts.length
          ];


        var threshold =
          i /
          novaLinks.length *
          .72;


        var reveal =
          smoothstep(
            (
              p -
              threshold
            ) /
            .22
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
          w *
          reveal *
          (
            .025 +
            hash(
              i *
              13
            ) *
            .10
          );
      }
    );


    /*
       Energy explicitly travels out and returns.

       This is crucial:
       expansion without fragmentation.
    */

    novaReturns.forEach(
      function (route, i) {

        var angle =
          i /
          novaReturns.length *
          TAU +
          Math.sin(
            i *
            .8
          ) *
          .06;


        var outer =
          polar(
            CX,
            CY,
            R *
            1.48,
            angle
          );


        route.setAttribute(
          "d",
          "M" +
          CX +
          " " +
          CY +
          "Q" +
          (
            CX +
            Math.cos(
              angle +
              .30
            ) *
            R *
            .86
          ) +
          " " +
          (
            CY +
            Math.sin(
              angle +
              .30
            ) *
            R *
            .86
          ) +
          "," +
          outer.x +
          " " +
          outer.y
        );


        route.style.opacity =
          w *
          p *
          (
            .03 +
            .08 *
            Math.abs(
              Math.sin(
                now *
                .001 +
                i
              )
            )
          );
      }
    );
  }


  /* ==========================================================================
     SVG MASTER
     ========================================================================== */

  function drawSVG(now) {

    drawCore(
      now
    );


    drawSleep(
      now
    );


    drawStress(
      now
    );


    drawRecovery(
      now
    );


    drawFlow(
      now
    );


    drawNova(
      now
    );
  }


  /* ==========================================================================
     CANVAS SIZING
     ========================================================================== */

  var DPR =
    1;


  var cw =
    0;


  var ch =
    0;


  function resizePhenomena() {

    var rect =
      phenomena.getBoundingClientRect();


    DPR =
      Math.min(
        2,
        window.devicePixelRatio ||
        1
      );


    cw =
      rect.width;


    ch =
      rect.height;


    phenomena.width =
      cw *
      DPR;


    phenomena.height =
      ch *
      DPR;


    ctx.setTransform(
      DPR,
      0,
      0,
      DPR,
      0,
      0
    );
  }


  var worldW =
    0;


  var worldH =
    0;


  function resizeWorld() {

    var rect =
      world.getBoundingClientRect();


    worldW =
      rect.width;


    worldH =
      rect.height;


    world.width =
      worldW *
      DPR;


    world.height =
      worldH *
      DPR;


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
     CANVAS PARTICLES
     ========================================================================== */

  var particles =
    [];


  var streams =
    [];


  for (
    var i = 0;
    i < 145;
    i++
  ) {

    particles.push({

      x:
        hash(
          i *
          17
        ),

      y:
        hash(
          i *
          29 +
          3
        ),

      depth:
        .12 +
        hash(
          i *
          37
        ) *
        .88,

      phase:
        hash(
          i *
          13
        ) *
        TAU,

      warm:
        hash(
          i *
          11
        ) >
        .84
    });
  }


  for (
    var st = 0;
    st < 46;
    st++
  ) {

    streams.push({

      y:
        hash(
          st *
          31
        ),

      phase:
        hash(
          st *
          19
        ) *
        TAU,

      warm:
        hash(
          st *
          23
        ) >
        .78
    });
  }


  /* ==========================================================================
     SLEEP CANVAS

     Exterior traffic approaches but bends around.

     Interior particles continue circulating.

     This alone should tell the story.
     ========================================================================== */

  function canvasSleep(now) {

    var w =
      weights.sleep;


    if (
      w <
      .002
    ) {
      return;
    }


    var p =
      modeProgress(
        5
      );


    var cx =
      cw *
      .5;


    var cy =
      ch *
      .47;


    var radius =
      Math.min(
        cw,
        ch
      ) *
      .29;


    /*
       Exterior traffic bypass.
    */

    streams.forEach(
      function (stream, i) {

        ctx.beginPath();


        var steps =
          60;


        for (
          var s = 0;
          s <= steps;
          s++
        ) {

          var u =
            s /
            steps;


          var x =
            u *
            cw;


          var y =
            stream.y *
            ch;


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


          if (
            dist <
            radius *
            1.48
          ) {

            var sign =
              dy >=
              0
                ?
                  1
                :
                  -1;


            var avoidance =
              (
                1 -
                dist /
                (
                  radius *
                  1.48
                )
              );


            y +=
              sign *
              avoidance *
              radius *
              .48 *
              p;
          }


          y +=
            Math.sin(
              u *
              TAU *
              1.2 +
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
       Interior restoration circulation.
    */

    particles.forEach(
      function (particle, i) {

        var angle =
          particle.phase +
          now *
          .00005 *
          (
            .55 +
            particle.depth
          );


        var rr =
          radius *
          (
            .18 +
            particle.depth *
            .78
          );


        var x =
          cx +
          Math.cos(
            angle
          ) *
          rr;


        var y =
          cy +
          Math.sin(
            angle
          ) *
          rr *
          .77;


        var alpha =
          w *
          (
            .02 +
            particle.depth *
            .09
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

     Load moves INTO the field.
     Recruitment and deformation are obvious.
     ========================================================================== */

  function canvasStress(now) {

    var w =
      weights.stress;


    if (
      w <
      .002
    ) {
      return;
    }


    var age =
      clock -
      modeStart;


    var cx =
      cw *
      .50;


    var cy =
      ch *
      .47;


    var radius =
      Math.min(
        cw,
        ch
      ) *
      .30;


    /*
       Repeating pressure wave.
    */

    var cycle =
      (
        age /
        2400
      ) %
      1;


    var frontX =
      lerp(
        -cw *
        .12,
        cw *
        1.08,
        cycle
      );


    var gradient =
      ctx.createLinearGradient(
        frontX -
        130,
        0,
        frontX +
        160,
        0
      );


    gradient.addColorStop(
      0,
      "rgba(227,166,63,0)"
    );


    gradient.addColorStop(
      .52,
      "rgba(227,166,63," +
      (
        w *
        .050
      ) +
      ")"
    );


    gradient.addColorStop(
      1,
      "rgba(227,166,63,0)"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      frontX -
      130,
      0,
      290,
      ch
    );


    /*
       Demand packets rush toward system.
    */

    particles.forEach(
      function (particle, i) {

        var speed =
          85 +
          particle.depth *
          220;


        var x =
          (
            particle.x *
            cw +
            now /
            1000 *
            speed
          ) %
          (
            cw +
            120
          ) -
          60;


        var y =
          particle.y *
          ch +
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
           Near the field, trajectories bend toward the demand-facing quadrant.
        */

        y =
          lerp(
            y,
            cy -
            radius *
            .20,
            recruit *
            .20
          );


        var alpha =
          w *
          (
            .025 +
            particle.depth *
            .12
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
              .65 +
              ")";


        ctx.lineWidth =
          .7;


        ctx.stroke();
      }
    );
  }


  /* ==========================================================================
     RECOVERY CANVAS

     Load leaves.
     New clean routes open behind it.
     ========================================================================== */

  function canvasRecovery(now) {

    var w =
      weights.recovery;


    if (
      w <
      .002
    ) {
      return;
    }


    var p =
      modeProgress(
        6
      );


    var cx =
      cw *
      .50;


    var cy =
      ch *
      .47;


    var radius =
      Math.min(
        cw,
        ch
      ) *
      .29;


    /*
       Load particles travel from inside to outside.
    */

    for (
      var i = 0;
      i < 70;
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


      var rr =
        lerp(
          radius *
          .16,
          radius *
          1.55,
          phase
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        rr;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        rr *
        .82;


      var alpha =
        w *
        (
          1 -
          phase
        ) *
        (
          .03 +
          (
            1 -
            p
          ) *
          .09
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
       Clean routes gradually appear.
    */

    streams.forEach(
      function (stream, i) {

        ctx.beginPath();


        for (
          var s = 0;
          s <= 56;
          s++
        ) {

          var u =
            s /
            56;


          var x =
            u *
            cw;


          var baseline =
            stream.y *
            ch;


          var strain =
            (
              1 -
              p
            ) *
            Math.sin(
              u *
              TAU *
              4.4 +
              i *
              .65
            ) *
            20;


          var y =
            baseline +
            strain;


          var dx =
            x -
            cx;


          var influence =
            Math.exp(
              -Math.abs(dx) /
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
              p *
              influence *
              .22
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
              p *
              .020
            )
          ) +
          ")";


        ctx.lineWidth =
          .55;


        ctx.stroke();
      }
    );
  }


  /* ==========================================================================
     FLOW CANVAS

     Disorder visibly self-organizes into transport.
     ========================================================================== */

  function canvasFlow(now) {

    var w =
      weights.flow;


    if (
      w <
      .002
    ) {
      return;
    }


    var p =
      modeProgress(
        4.8
      );


    var cy =
      ch *
      .47;


    streams.forEach(
      function (stream, i) {

        ctx.beginPath();


        for (
          var s = 0;
          s <= 70;
          s++
        ) {

          var u =
            s /
            70;


          var x =
            u *
            cw;


          var lane =
            (
              stream.y -
              .5
            ) *
            ch;


          var chaos =
            (
              1 -
              p
            ) *
            Math.sin(
              u *
              TAU *
              (
                3.7 +
                i %
                4
              ) +
              now *
              .0014 +
              i
            ) *
            26;


          var commonWave =
            Math.sin(
              u *
              TAU *
              1.25 +
              now *
              .00048
            ) *
            10;


          var y =
            cy +
            lane *
            lerp(
              .82,
              .58,
              p
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
                  .008 +
                  p *
                  .018
                )
              ) +
              ")"
            :
              "rgba(102,224,237," +
              (
                w *
                (
                  .012 +
                  p *
                  .031
                )
              ) +
              ")";


        ctx.lineWidth =
          .55 +
          p *
          .17;


        ctx.stroke();
      }
    );
  }


  /* ==========================================================================
     NOVA CANVAS

     The key visual:
       high throughput
       long-range simultaneous relation
       pulses travel outward AND return
       no breakup
     ========================================================================== */

  function canvasNova(now) {

    var w =
      weights.nova;


    if (
      w <
      .002
    ) {
      return;
    }


    var p =
      modeProgress(
        6.5
      );


    var cx =
      cw *
      .50;


    var cy =
      ch *
      .47;


    var radius =
      Math.min(
        cw,
        ch
      ) *
      .30;


    /*
       Large remote constellation.
    */

    var points =
      [];


    for (
      var i = 0;
      i < 52;
      i++
    ) {

      var threshold =
        i /
        52 *
        .82;


      var reveal =
        smoothstep(
          (
            p -
            threshold
          ) /
          .16
        );


      var angle =
        hash(
          i *
          31
        ) *
        TAU;


      var rr =
        radius *
        (
          .65 +
          hash(
            i *
            17
          ) *
          1.34
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        rr;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        rr *
        .78;


      points.push({
        x:
          x,

        y:
          y,

        reveal:
          reveal
      });


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        1 +
        hash(
          i *
          13
        ) *
        1.5,
        0,
        TAU
      );


      ctx.fillStyle =
        i %
        5 ===
        0
          ?
            "rgba(236,199,126," +
            (
              w *
              reveal *
              .45
            ) +
            ")"
          :
            "rgba(102,224,237," +
            (
              w *
              reveal *
              .26
            ) +
            ")";


      ctx.fill();
    }


    /*
       Sparse long-range coupling.
    */

    for (
      var line = 0;
      line < 38;
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
          .037
        ) +
        ")";


      ctx.lineWidth =
        .6;


      ctx.stroke();
    }


    /*
       Throughput pulses:
       center → outer field → center.

       If they only went outward, Nova would imply depletion.
    */

    for (
      var pulse = 0;
      pulse < 14;
      pulse++
    ) {

      var angle =
        pulse /
        14 *
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
          14
        ) %
        1;


      var returnCycle =
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


      var rr =
        lerp(
          radius *
          .72,
          radius *
          1.65,
          smoothstep(
            returnCycle
          )
        );


      var x =
        cx +
        Math.cos(
          angle
        ) *
        rr;


      var y =
        cy +
        Math.sin(
          angle
        ) *
        rr *
        .78;


      var alpha =
        w *
        p *
        Math.sin(
          returnCycle *
          Math.PI
        ) *
        .50;


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
  }


  /* ==========================================================================
     CANVAS MASTER
     ========================================================================== */

  function drawPhenomena(now) {

    ctx.clearRect(
      0,
      0,
      cw,
      ch
    );


    canvasSleep(
      now
    );


    canvasStress(
      now
    );


    canvasRecovery(
      now
    );


    canvasFlow(
      now
    );


    canvasNova(
      now
    );
  }


  /* ==========================================================================
     WORLD CANVAS
     ========================================================================== */

  function drawWorld(now) {

    worldCtx.clearRect(
      0,
      0,
      worldW,
      worldH
    );


    /*
       Sleep darkens periphery.
    */

    if (
      weights.sleep >
      .01
    ) {

      var dark =
        worldCtx.createRadialGradient(
          worldW *
          .5,
          worldH *
          .52,
          0,
          worldW *
          .5,
          worldH *
          .52,
          Math.max(
            worldW,
            worldH
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
        worldW,
        worldH
      );
    }


    /*
       Nova extends beyond the stage itself.
    */

    if (
      weights.nova >
      .01
    ) {

      for (
        var i = 0;
        i < 42;
        i++
      ) {

        var x =
          hash(
            i *
            23
          ) *
          worldW;


        var y =
          hash(
            i *
            31
          ) *
          worldH;


        var alpha =
          weights.nova *
          (
            .018 +
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


    clock +=
      dt;


    var modeK =
      1 -
      Math.exp(
        -dt /
        700
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
            modeK
          );
      }
    );


    /*
       Position moves first.
    */

    var positionK =
      1 -
      Math.exp(
        -dt /
        400
      );


    pos.x =
      lerp(
        pos.x,
        target.pos.x,
        positionK
      );


    pos.y =
      lerp(
        pos.y,
        target.pos.y,
        positionK
      );


    /*
       The mode-conditioned envelope reorganizes more slowly.
    */

    var boundaryK =
      1 -
      Math.exp(
        -dt /
        1050
      );


    factors =
      factors.map(
        function (value, i) {

          return lerp(
            value,
            target.factors[i],
            boundaryK
          );
        }
      );


    energy =
      lerp(
        energy,
        target.energy,
        1 -
        Math.exp(
          -dt /
          850
        )
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


  function ensure() {

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
     CONTROLS
     ========================================================================== */

  buttons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          var key =
            button.getAttribute(
              "data-mode"
            );


          /*
             Clicking active mode replays its full physical event.
          */

          if (
            key ===
            activeMode
          ) {

            modeStart =
              clock;


            ensure();

            return;
          }


          setMode(
            key
          );
        }
      );
    }
  );


  /* ==========================================================================
     SIZE
     ========================================================================== */

  function resize() {

    resizePhenomena();

    resizeWorld();
  }


  if (
    !reduce
  ) {

    resize();


    window.addEventListener(
      "resize",
      resize,
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

              ensure();

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
     INITIAL
     ========================================================================== */

  setAurora(
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


  if (
    reduce
  ) {

    drawSVG(
      0
    );

  } else {

    ensure();
  }

})();
