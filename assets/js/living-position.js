/* A living position — extracted from the standalone reference. */
(function () {
  "use strict";

  /* ==========================================================================
     A LIVING POSITION
     --------------------------------------------------------------------------

     This scene is illustrative rather than diagnostic.

     We are not drawing a dashboard.

     We are constructing a small visual world with three independent truths:

       fixed structure
       responsive membrane
       moving state

     History remains present as both:

       a trajectory of prior positions
       ghosted prior membrane states

     The atmosphere responds to the same underlying state, so the image feels
     inhabited rather than diagrammed.
     ========================================================================== */


  /* ==========================================================================
     CONSTANTS
     ========================================================================== */

  var NS = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;

  var VIEW = 620;

  var CX = VIEW / 2;
  var CY = VIEW / 2;

  var R = 205;

  var PROFILE_COUNT = 24;
  var SAMPLE_COUNT = 96;

  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* ==========================================================================
     ELEMENTS
     ========================================================================== */

  var host =
    document.querySelector(
      ".lp-world"
    );

  var svg =
    document.getElementById(
      "lp-field"
    );

  var range =
    document.getElementById(
      "lp-range"
    );

  var moment =
    document.getElementById(
      "lp-moment"
    );

  var replay =
    document.getElementById(
      "lp-replay"
    );

  var canvas =
    document.getElementById(
      "lp-atmosphere"
    );

  var ctx =
    canvas &&
    canvas.getContext
      ? canvas.getContext("2d")
      : null;

  if (!svg || !range) return;


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
      (b - a) * t;
  }


  function smoothstep(t) {

    t =
      clamp(
        t,
        0,
        1
      );

    return (
      t * t *
      (3 - 2 * t)
    );
  }


  function easeInOutCubic(t) {

    return t < .5
      ? 4 * t * t * t
      : 1 -
        Math.pow(
          -2 * t + 2,
          3
        ) / 2;
  }


  function angleAt(i, count) {

    return (
      i / count
    ) * TAU -
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


  function lerpPoint(a, b, t) {

    return {
      x:
        lerp(a.x, b.x, t),

      y:
        lerp(a.y, b.y, t)
    };
  }


  /* ==========================================================================
     DETERMINISTIC NOISE

     No reload-randomized storytelling.
     The same illustrative month always produces the same visual history.
     ========================================================================== */

  function hash(n) {

    var x =
      Math.sin(
        n * 127.1
      ) * 43758.5453123;

    return x -
      Math.floor(x);
  }


  function signedHash(n) {

    return hash(n) * 2 - 1;
  }


  /* ==========================================================================
     FIXED STRUCTURE

     The definition itself remains regular and quiet.
     ========================================================================== */

  var FIXED =
    Array(PROFILE_COUNT)
      .fill(1);


  /* ==========================================================================
     ACTIVE PROFILE

     This remains close to a norm-ball.

     It is alive enough to feel physiological, but never becomes an arbitrary
     amoeba merely for visual drama.
     ========================================================================== */

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
            a * 5 - .8
          )
        );
      });


  function makeProfile(
    load,
    direction,
    dayIndex
  ) {

    return BASE_PROFILE.map(
      function (base, i) {

        var a =
          angleAt(
            i,
            PROFILE_COUNT
          );


        var delta =
          Math.atan2(
            Math.sin(
              a -
              direction
            ),
            Math.cos(
              a -
              direction
            )
          );


        /*
         * Directional response.
         * The active membrane changes with state while keeping a stable identity.
         */
        var directional =
          .045 *
          load *
          Math.exp(
            -(
              delta *
              delta
            ) /
            .72
          );


        var livingVariation =
          signedHash(
            dayIndex * 31 +
            i * 7
          ) *
          .006;


        return clamp(
          base +
          directional +
          livingVariation,
          .94,
          1.08
        );
      }
    );
  }


  /* ==========================================================================
     PROFILE → SVG
     ========================================================================== */

  function smoothProfile(profile) {

    var raw = [];
    var output = [];


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
        (a + 1) %
        profile.length;


      var f =
        smoothstep(
          t -
          Math.floor(t)
        );


      raw.push(
        profile[a] *
        (1 - f) +
        profile[b] *
        f
      );
    }


    for (
      var j = 0;
      j < SAMPLE_COUNT;
      j++
    ) {

      output.push(
        (
          raw[
            (
              j - 1 +
              SAMPLE_COUNT
            ) %
            SAMPLE_COUNT
          ] +
          raw[j] * 2 +
          raw[
            (
              j + 1
            ) %
            SAMPLE_COUNT
          ]
        ) / 4
      );
    }


    return output;
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
            j - 1 +
            SAMPLE_COUNT
          ) %
          SAMPLE_COUNT
        ];


      var p1 =
        points[j];


      var p2 =
        points[
          (
            j + 1
          ) %
          SAMPLE_COUNT
        ];


      var p3 =
        points[
          (
            j + 2
          ) %
          SAMPLE_COUNT
        ];


      var c1x =
        p1.x +
        (
          p2.x -
          p0.x
        ) / 6;


      var c1y =
        p1.y +
        (
          p2.y -
          p0.y
        ) / 6;


      var c2x =
        p2.x -
        (
          p3.x -
          p1.x
        ) / 6;


      var c2y =
        p2.y -
        (
          p3.y -
          p1.y
        ) / 6;


      d +=
        "C" +
        c1x.toFixed(1) +
        " " +
        c1y.toFixed(1) +
        "," +
        c2x.toFixed(1) +
        " " +
        c2y.toFixed(1) +
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
      ) % 1;


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
     THE MONTH

     The sequence describes:

       opening
       rising load
       a period close to the edge
       reorganization
       recovery
       a more spacious present

     Position and membrane evolve independently.
     ========================================================================== */

  var DAYS = [];

  (function buildMonth() {

    var membraneScale = .80;


    for (
      var i = 0;
      i < 28;
      i++
    ) {

      var p =
        i / 27;


      /*
       * A broad load wave with enough asymmetry to feel lived rather than
       * synthetic.
       */
      var loadRise =
        smoothstep(
          (
            p - .08
          ) /
          .42
        );


      var loadFall =
        smoothstep(
          (
            p - .54
          ) /
          .37
        );


      var load =
        clamp(
          loadRise *
          (
            1 -
            .83 *
            loadFall
          ),
          0,
          1
        );


      load +=
        .06 *
        Math.sin(
          p *
          Math.PI *
          5.4
        ) *
        (
          .3 +
          load
        );


      load =
        clamp(
          load,
          0,
          1
        );


      /*
       * Policy-like boundary response:
       * quicker to open/thicken under demand, slower to settle afterward.
       */
      var targetScale =
        .80 +
        .13 *
        load;


      var rate =
        targetScale >
        membraneScale
          ? .032
          : .009;


      membraneScale +=
        clamp(
          targetScale -
          membraneScale,
          -rate,
          rate
        );


      /*
       * Position has its own trajectory.
       */
      var radial =
        .18 +
        .49 *
        load;


      radial +=
        .035 *
        Math.sin(
          p *
          TAU *
          2.1
        );


      var theta =
        -2.52 +
        p *
        1.92 +
        .18 *
        Math.sin(
          p *
          Math.PI *
          2.8
        );


      /*
       * During late recovery, movement bends toward a new region rather than
       * simply reversing the original path.
       */
      if (
        p > .62
      ) {

        theta +=
          smoothstep(
            (
              p -
              .62
            ) /
            .38
          ) *
          .42;
      }


      var position = {
        x:
          Math.cos(theta) *
          radial,

        y:
          Math.sin(theta) *
          radial
      };


      DAYS.push({

        load:
          load,

        scale:
          membraneScale,

        direction:
          theta,

        energy:
          .30 +
          load *
          .55,

        position:
          position,

        profile:
          makeProfile(
            load,
            theta,
            i
          )
      });
    }

  })();


  /* ==========================================================================
     SVG DEFS
     ========================================================================== */

  var defs =
    el("defs");


  var edgeGradient =
    el(
      "linearGradient",
      {
        id: "lp-edge-gradient",
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
        id: "lp-fill-gradient",
        cx: "52%",
        cy: "44%",
        r: "72%"
      }
    );


  [
    ["0%",   "var(--aqua-deep)", ".20"],
    ["48%",  "var(--aqua-deep)", ".075"],
    ["78%",  "var(--glow)",      ".035"],
    ["100%", "var(--glow)",      ".006"]
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
     SVG LAYERS
     ========================================================================== */

  var fixedGlow =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-fixed-glow"
        }
      )
    );


  var fixedOuter =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-fixed lp-fixed--outer"
        }
      )
    );


  var fixedInner =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-fixed lp-fixed--inner"
        }
      )
    );


  var ghosts =
    svg.appendChild(
      el("g")
    );


  var activeFill =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-active-fill",

          fill:
            "url(#lp-fill-gradient)"
        }
      )
    );


  var room =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-room"
        }
      )
    );


  var contours =
    svg.appendChild(
      el("g")
    );


  var activeBloom =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-active-bloom",

          stroke:
            "url(#lp-edge-gradient)"
        }
      )
    );


  var activeEdge =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-active-edge",

          stroke:
            "url(#lp-edge-gradient)"
        }
      )
    );


  var activeBeads =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-active-beads",

          stroke:
            "url(#lp-edge-gradient)"
        }
      )
    );


  var historyThread =
    svg.appendChild(
      el(
        "path",
        {
          class:
            "lp-history-thread"
        }
      )
    );


  var historyDots =
    svg.appendChild(
      el("g")
    );


  var reach =
    svg.appendChild(
      el(
        "line",
        {
          class:
            "lp-reach"
        }
      )
    );


  var wakeGroup =
    svg.appendChild(
      el("g")
    );


  var positionHalo =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "lp-position-halo",
          r: "30"
        }
      )
    );


  var positionRing =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "lp-position-ring",
          r: "13"
        }
      )
    );


  var position =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "lp-position",
          r: "6"
        }
      )
    );


  var positionCore =
    svg.appendChild(
      el(
        "circle",
        {
          class:
            "lp-position-core",
          r: "2.2"
        }
      )
    );


  var historyLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "lp-mark lp-mark--aqua"
        }
      )
    );

  historyLabel.textContent =
    "history";


  var currentLine =
    svg.appendChild(
      el(
        "line",
        {
          class:
            "lp-mark-line"
        }
      )
    );


  var currentLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "lp-mark lp-mark--aqua"
        }
      )
    );

  currentLabel.textContent =
    "current position";


  var structureLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "lp-mark",
          x:
            CX,
          y:
            52,
          "text-anchor":
            "middle"
        }
      )
    );

  structureLabel.textContent =
    "fixed structure";


  /* ==========================================================================
     STATIC SVG OBJECTS
     ========================================================================== */

  var fixedSamples =
    smoothProfile(
      FIXED
    );


  var fixedPath =
    ringFromSamples(
      fixedSamples,
      1
    );


  fixedGlow.setAttribute(
    "d",
    fixedPath
  );


  fixedOuter.setAttribute(
    "d",
    fixedPath
  );


  fixedInner.setAttribute(
    "d",
    ringFromSamples(
      fixedSamples,
      .73
    )
  );


  for (
    var c = 0;
    c < 22;
    c++
  ) {

    contours.appendChild(
      el(
        "path",
        {
          class:
            "lp-contour",

          stroke:
            c > 14
              ? "var(--glow)"
              : "var(--aqua)"
        }
      )
    );
  }


  for (
    var h = 0;
    h < 14;
    h++
  ) {

    historyDots.appendChild(
      el(
        "circle",
        {
          class:
            "lp-history-dot",
          r:
            "2"
        }
      )
    );
  }


  for (
    var w = 0;
    w < 4;
    w++
  ) {

    wakeGroup.appendChild(
      el(
        "ellipse",
        {
          class:
            "lp-position-wake"
        }
      )
    );
  }


  /*
   * Seven ghost membranes are enough to suggest accumulated history without
   * producing visual fog.
   */
  for (
    var g = 0;
    g < 7;
    g++
  ) {

    ghosts.appendChild(
      el(
        "path",
        {
          class:
            "lp-ghost" +
            (
              g < 2
                ? " lp-ghost--warm"
                : ""
            )
        }
      )
    );
  }


  /* ==========================================================================
     CURRENT / TARGET STATE
     ========================================================================== */

  var cur = {
    profile:
      DAYS[27].profile.slice(),

    scale:
      DAYS[27].scale,

    position: {
      x:
        DAYS[27].position.x,

      y:
        DAYS[27].position.y
    },

    energy:
      DAYS[27].energy,

    day:
      28
  };


  var target = {
    profile:
      cur.profile.slice(),

    scale:
      cur.scale,

    position: {
      x:
        cur.position.x,

      y:
        cur.position.y
    },

    energy:
      cur.energy,

    day:
      cur.day
  };


  /* ==========================================================================
     SELECT DAY
     ========================================================================== */

  function setDay(
    index,
    immediate
  ) {

    index =
      clamp(
        index,
        0,
        27
      );


    var day =
      DAYS[index];


    target = {
      profile:
        day.profile.slice(),

      scale:
        day.scale,

      position: {
        x:
          day.position.x,

        y:
          day.position.y
      },

      energy:
        day.energy,

      day:
        index + 1
    };


    if (
      index === 27
    ) {

      moment.textContent =
        "Today";

    } else {

      var ago =
        27 -
        index;


      moment.textContent =
        ago +
        (
          ago === 1
            ? " day ago"
            : " days ago"
        );
    }


    if (
      immediate ||
      reduce
    ) {

      cur.profile =
        target.profile.slice();


      cur.scale =
        target.scale;


      cur.position.x =
        target.position.x;


      cur.position.y =
        target.position.y;


      cur.energy =
        target.energy;


      cur.day =
        target.day;


      drawSVG(0);
    }
  }


  /* ==========================================================================
     SVG DRAW
     ========================================================================== */

  function drawSVG(now) {

    var breath =
      reduce
        ? 1
        :
          1 +
          Math.sin(
            now /
            11000 *
            TAU
          ) *
          .0055;


    var samples =
      smoothProfile(
        cur.profile
      );


    var scale =
      cur.scale *
      breath;


    var activePath =
      ringFromSamples(
        samples,
        scale
      );


    activeFill.setAttribute(
      "d",
      activePath
    );


    activeBloom.setAttribute(
      "d",
      activePath
    );


    activeEdge.setAttribute(
      "d",
      activePath
    );


    activeBeads.setAttribute(
      "d",
      activePath
    );


    activeBloom.style.opacity =
      (
        .075 +
        cur.energy *
        .125
      ).toFixed(3);


    /* ----------------------------------------------------------------------
       Interior topology
       ---------------------------------------------------------------------- */

    var contourNodes =
      contours.childNodes;


    for (
      var i = 0;
      i <
      contourNodes.length;
      i++
    ) {

      var t =
        (
          i + 1
        ) /
        contourNodes.length;


      /*
       * Nonlinear packing gives the interior a sense of depth.
       */
      var contourScale =
        scale *
        (
          .12 +
          Math.pow(
            t,
            .82
          ) *
          .84
        );


      contourNodes[i]
        .setAttribute(
          "d",
          ringFromSamples(
            samples,
            contourScale
          )
        );


      contourNodes[i]
        .style.opacity =
        (
          .025 +
          (
            1 - t
          ) *
          .15
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Ghost membranes

       Past boundary states are selected across the visible history.
       Their spacing changes as more history accumulates.
       ---------------------------------------------------------------------- */

    var ghostNodes =
      ghosts.childNodes;


    var visibleDay =
      clamp(
        Math.round(
          cur.day
        ),
        1,
        28
      );


    for (
      var gh = 0;
      gh <
      ghostNodes.length;
      gh++
    ) {

      var fraction =
        (
          gh + 1
        ) /
        (
          ghostNodes.length +
          1
        );


      var historicalIndex =
        Math.max(
          0,
          Math.round(
            (
              visibleDay - 1
            ) *
            (
              1 -
              fraction
            )
          )
        );


      var historical =
        DAYS[
          historicalIndex
        ];


      ghostNodes[gh]
        .setAttribute(
          "d",
          ringFromSamples(
            smoothProfile(
              historical.profile
            ),
            historical.scale
          )
        );


      ghostNodes[gh]
        .style.opacity =
        (
          .018 +
          gh *
          .007
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Current position
       ---------------------------------------------------------------------- */

    var px =
      CX +
      cur.position.x *
      R;


    var py =
      CY +
      cur.position.y *
      R;


    var direction =
      Math.atan2(
        cur.position.y,
        cur.position.x
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


    /* ----------------------------------------------------------------------
       Available room

       A narrow luminous volume rather than a measurement ruler.
       ---------------------------------------------------------------------- */

    var roomWidth =
      .34;


    var roomSteps =
      20;


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

      var angle =
        direction -
        roomWidth / 2 +
        roomWidth *
        rs /
        roomSteps;


      var radius =
        edgeRadiusAt(
          samples,
          scale,
          angle
        );


      var endpoint =
        polar(
          radius,
          angle
        );


      roomPath +=
        "L" +
        endpoint.x.toFixed(1) +
        " " +
        endpoint.y.toFixed(1);
    }


    room.setAttribute(
      "d",
      roomPath + "Z"
    );


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


    /* ----------------------------------------------------------------------
       Historical trajectory
       ---------------------------------------------------------------------- */

    var count =
      Math.max(
        1,
        Math.round(
          cur.day
        )
      );


    var path =
      "";


    for (
      var d = 0;
      d < count;
      d++
    ) {

      var hp =
        DAYS[d].position;


      var hx =
        CX +
        hp.x *
        R;


      var hy =
        CY +
        hp.y *
        R;


      path +=
        (
          d === 0
            ? "M"
            : "L"
        ) +
        hx.toFixed(1) +
        " " +
        hy.toFixed(1);
    }


    historyThread.setAttribute(
      "d",
      path
    );


    var historyNodes =
      historyDots.childNodes;


    for (
      var hd = 0;
      hd <
      historyNodes.length;
      hd++
    ) {

      var index =
        Math.round(
          hd *
          (
            count - 1
          ) /
          Math.max(
            1,
            historyNodes.length -
            1
          )
        );


      var point =
        DAYS[index].position;


      historyNodes[hd]
        .setAttribute(
          "cx",
          (
            CX +
            point.x *
            R
          ).toFixed(1)
        );


      historyNodes[hd]
        .setAttribute(
          "cy",
          (
            CY +
            point.y *
            R
          ).toFixed(1)
        );


      var progress =
        hd /
        Math.max(
          1,
          historyNodes.length -
          1
        );


      historyNodes[hd]
        .setAttribute(
          "r",
          (
            1 +
            progress *
            1.8
          ).toFixed(2)
        );


      historyNodes[hd]
        .style.opacity =
        (
          count < 2
            ? 0
            :
              .05 +
              progress *
              .47
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Position presence
       ---------------------------------------------------------------------- */

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
        21 +
        cur.energy *
        25
      ).toFixed(1)
    );


    positionHalo.style.opacity =
      (
        .08 +
        cur.energy *
        .18
      ).toFixed(3);


    positionRing.setAttribute(
      "r",
      (
        10 +
        cur.energy *
        3
      ).toFixed(1)
    );


    /*
     * Wake ellipses give the current position a local influence on the field.
     */
    var wakes =
      wakeGroup.childNodes;


    for (
      var wk = 0;
      wk <
      wakes.length;
      wk++
    ) {

      var wf =
        (
          wk + 1
        ) /
        wakes.length;


      var elongation =
        15 +
        wf *
        (
          30 +
          cur.energy *
          24
        );


      wakes[wk]
        .setAttribute(
          "cx",
          px.toFixed(1)
        );


      wakes[wk]
        .setAttribute(
          "cy",
          py.toFixed(1)
        );


      wakes[wk]
        .setAttribute(
          "rx",
          elongation.toFixed(1)
        );


      wakes[wk]
        .setAttribute(
          "ry",
          (
            elongation *
            .38
          ).toFixed(1)
        );


      wakes[wk]
        .setAttribute(
          "transform",
          "rotate(" +
          (
            direction *
            180 /
            Math.PI
          ).toFixed(1) +
          " " +
          px.toFixed(1) +
          " " +
          py.toFixed(1) +
          ")"
        );


      wakes[wk]
        .style.opacity =
        (
          .22 *
          (
            1 -
            wf *
            .72
          )
        ).toFixed(3);
    }


    /* ----------------------------------------------------------------------
       Minimal labels
       ---------------------------------------------------------------------- */

    var labelRight =
      cur.position.x <
      .22;


    var lx =
      px +
      (
        labelRight
          ? 22
          : -22
      );


    var ly =
      py -
      18;


    currentLine.setAttribute(
      "x1",
      (
        px +
        (
          labelRight
            ? 7
            : -7
        )
      ).toFixed(1)
    );


    currentLine.setAttribute(
      "y1",
      (
        py - 5
      ).toFixed(1)
    );


    currentLine.setAttribute(
      "x2",
      lx.toFixed(1)
    );


    currentLine.setAttribute(
      "y2",
      (
        ly + 3
      ).toFixed(1)
    );


    currentLabel.setAttribute(
      "x",
      lx.toFixed(1)
    );


    currentLabel.setAttribute(
      "y",
      ly.toFixed(1)
    );


    currentLabel.setAttribute(
      "text-anchor",
      labelRight
        ? "start"
        : "end"
    );


    if (
      count > 4
    ) {

      var historyIndex =
        Math.floor(
          (
            count - 1
          ) *
          .34
        );


      var historyPoint =
        DAYS[
          historyIndex
        ].position;


      historyLabel.setAttribute(
        "x",
        (
          CX +
          historyPoint.x *
          R -
          12
        ).toFixed(1)
      );


      historyLabel.setAttribute(
        "y",
        (
          CY +
          historyPoint.y *
          R +
          24
        ).toFixed(1)
      );


      historyLabel.style.opacity =
        ".63";

    } else {

      historyLabel.style.opacity =
        "0";
    }
  }


  /* ==========================================================================
     CANVAS ATMOSPHERE

     The SVG tells us what things mean.

     Canvas supplies:
       flow
       depth
       particles
       wakes
       the sense that the field is inhabited

     Nothing semantically important exists only here.
     ========================================================================== */

  var DPR = 1;
  var canvasW = 0;
  var canvasH = 0;

  var PARTICLES = [];
  var FLOWERS = [];


  function resizeCanvas() {

    if (!ctx || !canvas) return;


    DPR =
      Math.min(
        2,
        window.devicePixelRatio || 1
      );


    var rect =
      canvas.getBoundingClientRect();


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


  function seedAtmosphere() {

    PARTICLES.length = 0;
    FLOWERS.length = 0;


    for (
      var i = 0;
      i < 76;
      i++
    ) {

      PARTICLES.push({

        x:
          hash(
            i * 11 + 3
          ),

        y:
          hash(
            i * 17 + 9
          ),

        depth:
          .18 +
          hash(
            i * 23 + 4
          ) *
          .82,

        phase:
          hash(
            i * 29 + 7
          ) *
          TAU,

        drift:
          .15 +
          hash(
            i * 19 + 2
          ) *
          .85
      });
    }


    /*
     * Flow lines are long-lived pathways rather than particle noise.
     */
    for (
      var j = 0;
      j < 22;
      j++
    ) {

      FLOWERS.push({

        y:
          hash(
            j * 41 + 3
          ),

        phase:
          hash(
            j * 37 + 7
          ) *
          TAU,

        amp:
          .015 +
          hash(
            j * 13 + 2
          ) *
          .045,

        speed:
          .08 +
          hash(
            j * 31 + 6
          ) *
          .18,

        warm:
          hash(
            j * 17 + 5
          ) >
          .68
      });
    }
  }


  function getStageCenterInCanvas() {

    var stage =
      document.querySelector(
        ".lp-field-wrap"
      );


    if (!stage) {

      return {
        x:
          canvasW *
          .72,

        y:
          canvasH *
          .50,

        scale:
          Math.min(
            canvasW,
            canvasH
          ) /
          VIEW
      };
    }


    var canvasRect =
      canvas.getBoundingClientRect();


    var stageRect =
      stage.getBoundingClientRect();


    return {

      x:
        stageRect.left -
        canvasRect.left +
        stageRect.width /
        2,

      y:
        stageRect.top -
        canvasRect.top +
        stageRect.height /
        2,

      scale:
        stageRect.width /
        VIEW
    };
  }


  function drawAtmosphere(now) {

    if (!ctx) return;


    ctx.clearRect(
      0,
      0,
      canvasW,
      canvasH
    );


    var stage =
      getStageCenterInCanvas();


    var stagePosX =
      stage.x +
      cur.position.x *
      R *
      stage.scale;


    var stagePosY =
      stage.y +
      cur.position.y *
      R *
      stage.scale;


    var time =
      now /
      1000;


    /* ----------------------------------------------------------------------
       Flow lines
       ---------------------------------------------------------------------- */

    FLOWERS.forEach(
      function (f, index) {

        ctx.beginPath();


        var steps =
          54;


        for (
          var s = 0;
          s <= steps;
          s++
        ) {

          var u =
            s /
            steps;


          var x =
            canvasW *
            u;


          var distanceToField =
            (
              x -
              stage.x
            ) /
            Math.max(
              canvasW,
              1
            );


          var attraction =
            Math.exp(
              -(
                distanceToField *
                distanceToField
              ) /
              .065
            );


          var y =
            canvasH *
            (
              f.y +
              Math.sin(
                u *
                TAU *
                (
                  1.3 +
                  index %
                  3 *
                  .23
                ) +
                f.phase +
                time *
                f.speed
              ) *
              f.amp
            );


          /*
           * As the line crosses the field, the current position subtly bends
           * the stream.
           */
          var localDX =
            x -
            stagePosX;


          var localDY =
            y -
            stagePosY;


          var dist =
            Math.sqrt(
              localDX *
              localDX +
              localDY *
              localDY
            );


          var influence =
            Math.exp(
              -dist /
              Math.max(
                80,
                stage.scale *
                150
              )
            );


          y +=
            Math.sin(
              time *
              .45 +
              index
            ) *
            influence *
            stage.scale *
            16;


          y =
            lerp(
              y,
              stage.y +
              (
                y -
                stage.y
              ) *
              .92,
              attraction *
              .1
            );


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


        ctx.strokeStyle =
          f.warm
            ?
              "rgba(236,199,126," +
              (
                .018 +
                cur.energy *
                .016
              ) +
              ")"
            :
              "rgba(102,224,237," +
              (
                .014 +
                cur.energy *
                .014
              ) +
              ")";


        ctx.lineWidth =
          .6;


        ctx.stroke();
      }
    );


    /* ----------------------------------------------------------------------
       Dust / points
       ---------------------------------------------------------------------- */

    PARTICLES.forEach(
      function (p, index) {

        var driftX =
          Math.sin(
            time *
            .06 *
            p.drift +
            p.phase
          ) *
          18 *
          p.depth;


        var driftY =
          Math.cos(
            time *
            .05 *
            p.drift +
            p.phase
          ) *
          10 *
          p.depth;


        var x =
          p.x *
          canvasW +
          driftX;


        var y =
          p.y *
          canvasH +
          driftY;


        var dx =
          x -
          stagePosX;


        var dy =
          y -
          stagePosY;


        var dist =
          Math.sqrt(
            dx *
            dx +
            dy *
            dy
          );


        var proximity =
          Math.exp(
            -dist /
            Math.max(
              180,
              stage.scale *
              280
            )
          );


        var alpha =
          (
            .025 +
            p.depth *
            .08
          ) *
          (
            .65 +
            proximity *
            .85
          );


        var radius =
          .45 +
          p.depth *
          .95;


        ctx.beginPath();

        ctx.arc(
          x,
          y,
          radius,
          0,
          TAU
        );


        ctx.fillStyle =
          index % 5 === 0
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


    /* ----------------------------------------------------------------------
       Position bloom in atmosphere
       ---------------------------------------------------------------------- */

    var gradient =
      ctx.createRadialGradient(
        stagePosX,
        stagePosY,
        0,
        stagePosX,
        stagePosY,
        stage.scale *
        (
          90 +
          cur.energy *
          50
        )
      );


    gradient.addColorStop(
      0,
      "rgba(102,224,237,.055)"
    );


    gradient.addColorStop(
      .35,
      "rgba(102,224,237,.018)"
    );


    gradient.addColorStop(
      1,
      "rgba(102,224,237,0)"
    );


    ctx.fillStyle =
      gradient;


    ctx.beginPath();


    ctx.arc(
      stagePosX,
      stagePosY,
      stage.scale *
      (
        90 +
        cur.energy *
        50
      ),
      0,
      TAU
    );


    ctx.fill();
  }


  /* ==========================================================================
     ANIMATION LOOP
     ========================================================================== */

  var visible = true;
  var raf = 0;
  var last = 0;


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


    /*
     * Position responds faster than membrane.
     */
    var positionK =
      1 -
      Math.exp(
        -dt /
        230
      );


    var membraneK =
      1 -
      Math.exp(
        -dt /
        520
      );


    var energyK =
      1 -
      Math.exp(
        -dt /
        340
      );


    cur.position.x =
      lerp(
        cur.position.x,
        target.position.x,
        positionK
      );


    cur.position.y =
      lerp(
        cur.position.y,
        target.position.y,
        positionK
      );


    cur.scale =
      lerp(
        cur.scale,
        target.scale,
        membraneK
      );


    cur.profile =
      cur.profile.map(
        function (value, i) {

          return lerp(
            value,
            target.profile[i],
            membraneK
          );
        }
      );


    cur.energy =
      lerp(
        cur.energy,
        target.energy,
        energyK
      );


    cur.day =
      lerp(
        cur.day,
        target.day,
        positionK
      );


    drawSVG(now);


    if (!reduce) {

      drawAtmosphere(now);
    }


    raf =
      requestAnimationFrame(
        frame
      );
  }


  function ensureAnimation() {

    if (
      !visible ||
      reduce ||
      raf
    ) {
      return;
    }


    last = 0;


    raf =
      requestAnimationFrame(
        frame
      );
  }


  /* ==========================================================================
     REPLAY
     ========================================================================== */

  var replayRAF = 0;
  var replaying = false;


  function stopReplay() {

    replaying = false;


    if (
      replayRAF
    ) {

      cancelAnimationFrame(
        replayRAF
      );


      replayRAF = 0;
    }


    replay.textContent =
      "Replay the month →";
  }


  function playMonth() {

    if (
      reduce
    ) {

      range.value =
        "28";


      setDay(
        27,
        true
      );


      return;
    }


    stopReplay();


    replaying =
      true;


    replay.textContent =
      "Watching the month…";


    range.value =
      "1";


    setDay(
      0
    );


    var start =
      0;


    var duration =
      7600;


    function playFrame(now) {

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


      var p =
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
       * Spend longer around the middle of the month where the field is most
       * transformed, so the visitor can actually perceive the difference.
       */
      var eased =
        easeInOutCubic(
          p
        );


      var day =
        Math.round(
          eased *
          27
        );


      range.value =
        String(
          day + 1
        );


      setDay(
        day
      );


      if (
        p <
        1
      ) {

        replayRAF =
          requestAnimationFrame(
            playFrame
          );

      } else {

        replaying =
          false;


        replayRAF =
          0;


        replay.textContent =
          "Replay the month →";
      }
    }


    replayRAF =
      requestAnimationFrame(
        playFrame
      );
  }


  /* ==========================================================================
     INTERACTION
     ========================================================================== */

  range.addEventListener(
    "input",
    function () {

      stopReplay();


      setDay(
        Number(
          range.value
        ) - 1
      );


      ensureAnimation();
    }
  );


  replay.addEventListener(
    "click",
    playMonth
  );


  /*
   * Tiny pointer parallax.

   The visual world acknowledges the observer without changing the underlying
   semantic state.
   */
  if (
    host &&
    !reduce
  ) {

    host.addEventListener(
      "pointermove",
      function (event) {

        var rect =
          host.getBoundingClientRect();


        var nx =
          (
            event.clientX -
            rect.left
          ) /
          Math.max(
            1,
            rect.width
          ) -
          .5;


        var ny =
          (
            event.clientY -
            rect.top
          ) /
          Math.max(
            1,
            rect.height
          ) -
          .5;


        host.style.setProperty(
          "--lp-parallax-x",
          (
            nx *
            7
          ).toFixed(2) +
          "px"
        );


        host.style.setProperty(
          "--lp-parallax-y",
          (
            ny *
            5
          ).toFixed(2) +
          "px"
        );
      },
      {
        passive: true
      }
    );
  }


  /* ==========================================================================
     VISIBILITY / PERFORMANCE
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

            } else {

              if (
                raf
              ) {

                cancelAnimationFrame(
                  raf
                );


                raf = 0;
                last = 0;
              }
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
     CANVAS RESIZE
     ========================================================================== */

  if (
    ctx &&
    !reduce
  ) {

    seedAtmosphere();
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
     INITIAL EXPERIENCE

     First arrival:
       begin near the opening of the history
       let the month unfold once
       then leave the visitor with direct control
     ========================================================================== */

  if (
    reduce
  ) {

    range.value =
      "28";


    setDay(
      27,
      true
    );


    replay.hidden =
      true;

  } else {

    range.value =
      "1";


    setDay(
      0,
      true
    );


    ensureAnimation();


    window.setTimeout(
      function () {

        if (
          Number(
            range.value
          ) === 1
        ) {

          playMonth();
        }
      },
      900
    );
  }

})();
