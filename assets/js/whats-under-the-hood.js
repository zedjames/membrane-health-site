/* What's under the hood — extracted from the standalone reference. */
(function () {
  "use strict";


  /* ==========================================================================
     WHAT'S UNDER THE HOOD

     Depth coordinate:

       0.00  measured signals
       0.34  relationships
       0.67  structure
       1.00  resolved position

     Unlike a slide deck, all depths remain partially present.

     Moving deeper does not delete earlier stages.
     They are progressively compressed into the resolved reading.

     Moving backward opens the reading again.
     ========================================================================== */


  /* ==========================================================================
     CONSTANTS
     ========================================================================== */

  var NS = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;

  var W = 1000;
  var H = 625;

  var CX = 590;
  var CY = 312;

  var FIELD_R = 170;

  /* ==========================================================================
     INTERIOR ROTATION

     The inside of the membrane turns. Everything shares one direction, and the
     closer a thing is held to the position, the faster it travels — which is
     what makes the centre read as a centre rather than as an arrangement.

     Gated on depth: the surroundings are still, and the world spins up as the
     structure closes.
     ========================================================================== */

  var uhClock = 0;

  function interiorSpin(radius) {

    if (reduce) return 0;

    return (
      uhClock *
      .00021 *
      (
        150 /
        Math.max(52, radius || 150)
      )
    );
  }



  var reduce =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* ==========================================================================
     DOM
     ========================================================================== */

  var host =
    document.querySelector(".uh");


  var svg =
    document.getElementById(
      "uh-field"
    );


  var slider =
    document.getElementById(
      "uh-range"
    );


  var stateLabel =
    document.getElementById(
      "uh-trace-state"
    );


  var play =
    document.getElementById(
      "uh-play"
    );


  var canvas =
    document.getElementById(
      "uh-canvas"
    );


  var ctx =
    canvas &&
    canvas.getContext
      ? canvas.getContext("2d")
      : null;


  var cards =
    Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-depth-card]"
      )
    );


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


  function polar(cx, cy, radius, angle) {

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


  function gaussian(
    value,
    center,
    width
  ) {

    var d =
      (
        value -
        center
      ) /
      width;


    return Math.exp(
      -d *
      d *
      2
    );
  }


  /* ==========================================================================
     DEPTH WEIGHTS
     ========================================================================== */

  function depthWeights(p) {

    return {

      signals:
        1 -
        smoothstep(
          (
            p -
            .18
          ) /
          .52
        ) *
        .73,


      families:
        gaussian(
          p,
          .30,
          .27
        ),


      relations:
        gaussian(
          p,
          .48,
          .29
        ),


      structure:
        smoothstep(
          (
            p -
            .36
          ) /
          .40
        ),


      field:
        smoothstep(
          (
            p -
            .58
          ) /
          .31
        ),


      position:
        smoothstep(
          (
            p -
            .74
          ) /
          .26
        ),


      proof:
        .25 +
        gaussian(
          p,
          .62,
          .40
        ) *
        .40
    };
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
        id: "uh-edge-gradient",
        x1: "10%",
        y1: "90%",
        x2: "90%",
        y2: "10%"
      }
    );


  [
    ["0%",   "var(--glow)"],
    ["46%",  "var(--glow-soft)"],
    ["74%",  "var(--aqua)"],
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


  var fieldGradient =
    el(
      "radialGradient",
      {
        id: "uh-field-gradient",
        cx: "50%",
        cy: "46%",
        r: "68%"
      }
    );


  [
    ["0%",   "var(--aqua-deep)", ".20"],
    ["62%",  "var(--aqua-deep)", ".07"],
    ["84%",  "var(--glow)",      ".025"],
    ["100%", "var(--glow)",      ".004"]
  ]
  .forEach(function (stop) {

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
  });


  defs.appendChild(
    edgeGradient
  );


  defs.appendChild(
    fieldGradient
  );


  svg.appendChild(
    defs
  );


  /* ==========================================================================
     PROOF SCAFFOLD
     ========================================================================== */

  var proof =
    svg.appendChild(
      el("g")
    );


  var PROOF_ORBITS = 9;
  var PROOF_RAYS   = 28;
  var PROOF_NODES  = 42;


  for (
    var po = 0;
    po < PROOF_ORBITS;
    po++
  ) {

    proof.appendChild(
      el(
        "ellipse",
        {
          class:
            "uh-proof-orbit"
        }
      )
    );
  }


  for (
    var pr = 0;
    pr < PROOF_RAYS;
    pr++
  ) {

    proof.appendChild(
      el(
        "line",
        {
          class:
            "uh-proof-ray"
        }
      )
    );
  }


  for (
    var pn = 0;
    pn < PROOF_NODES;
    pn++
  ) {

    proof.appendChild(
      el(
        "circle",
        {
          class:
            "uh-proof-node",

          r:
            (
              1 +
              hash(
                pn *
                13 +
                2
              ) *
              1.5
            ).toFixed(2)
        }
      )
    );
  }


  var proofSeal =
    proof.appendChild(
      el(
        "circle",
        {
          class:
            "uh-proof-seal"
        }
      )
    );


  var proofPulses =
    proof.appendChild(
      el("g")
    );


  for (
    var pps = 0;
    pps < 5;
    pps++
  ) {

    proofPulses.appendChild(
      el(
        "circle",
        {
          class:
            "uh-proof-pulse"
        }
      )
    );
  }


  /* ==========================================================================
     SIGNALS
     ========================================================================== */

  var signalGroup =
    svg.appendChild(
      el("g")
    );


  var SIGNAL_COUNT =
    20;


  var signalPaths = [];
  var signalNodes = [];


  for (
    var s = 0;
    s < SIGNAL_COUNT;
    s++
  ) {

    var sp =
      signalGroup.appendChild(
        el(
          "path",
          {
            class:
              "uh-signal-path " +
              (
                s % 5 === 0
                  ?
                    "uh-signal-path--b"
                  :
                    "uh-signal-path--a"
              )
          }
        )
      );


    var sn =
      signalGroup.appendChild(
        el(
          "circle",
          {
            class:
              "uh-signal-node " +
              (
                s % 5 === 0
                  ?
                    "uh-signal-node--warm"
                  :
                    ""
              ),

            r:
              (
                1.5 +
                hash(
                  s *
                  17
                ) *
                1.8
              ).toFixed(2)
          }
        )
      );


    signalPaths.push(sp);
    signalNodes.push(sn);
  }


  /*
   * These are the only visible metric labels in the visual.
   * They are all measurements already named in the existing site copy.
   */
  var SIGNAL_LABELS = [
    "HRV",
    "resting HR",
    "sleep",
    "breathing",
    "temperature",
    "blood oxygen",
    "VO₂ max",
    "movement"
  ];


  var signalLabels =
    [];


  SIGNAL_LABELS.forEach(
    function (name) {

      var label =
        signalGroup.appendChild(
          el(
            "text",
            {
              class:
                "uh-signal-label"
            }
          )
        );


      label.textContent =
        name;


      signalLabels.push(
        label
      );
    }
  );


  /* ==========================================================================
     PHYSIOLOGICAL FAMILIES
     ========================================================================== */

  var familyGroup =
    svg.appendChild(
      el("g")
    );


  var FAMILY_DATA = [
    {
      name:
        "Autonomic",

      className:
        "uh-family--autonomic",

      angle:
        -2.20
    },
    {
      name:
        "Circadian",

      className:
        "uh-family--circadian",

      angle:
        -1.08
    },
    {
      name:
        "Metabolic",

      className:
        "uh-family--metabolic",

      angle:
        .42
    },
    {
      name:
        "Mechanical",

      className:
        "uh-family--mechanical",

      angle:
        1.72
    }
  ];


  var families =
    [];


  FAMILY_DATA.forEach(
    function (family) {

      var path =
        familyGroup.appendChild(
          el(
            "path",
            {
              class:
                "uh-family " +
                family.className
            }
          )
        );


      var node =
        familyGroup.appendChild(
          el(
            "circle",
            {
              class:
                "uh-family-node",

              r:
                "4"
            }
          )
        );


      var label =
        familyGroup.appendChild(
          el(
            "text",
            {
              class:
                "uh-family-label"
            }
          )
        );


      label.textContent =
        family.name;


      families.push({
        data:
          family,

        path:
          path,

        node:
          node,

        label:
          label
      });
    }
  );


  /* ==========================================================================
     RELATIONS
     ========================================================================== */

  var relationGroup =
    svg.appendChild(
      el("g")
    );


  var RELATION_COUNT =
    26;


  var relations =
    [];


  for (
    var r = 0;
    r < RELATION_COUNT;
    r++
  ) {

    relations.push(
      relationGroup.appendChild(
        el(
          "path",
          {
            class:
              "uh-relation" +
              (
                r % 6 === 0
                  ?
                    " uh-relation--warm"
                  :
                    ""
              )
          }
        )
      )
    );
  }


  var relationNodes =
    [];


  for (
    var rn = 0;
    rn < 16;
    rn++
  ) {

    relationNodes.push(
      relationGroup.appendChild(
        el(
          "circle",
          {
            class:
              "uh-relation-node",

            r:
              (
                1.4 +
                hash(
                  rn *
                  19
                ) *
                1.6
              ).toFixed(2)
          }
        )
      )
    );
  }


  var relationHalos =
    [];


  for (
    var rh = 0;
    rh < 9;
    rh++
  ) {

    relationHalos.push(
      relationGroup.appendChild(
        el(
          "ellipse",
          {
            class:
              "uh-relation-halo"
          }
        )
      )
    );
  }


  /* ==========================================================================
     STRUCTURE
     ========================================================================== */

  var structureGroup =
    svg.appendChild(
      el("g")
    );


  var structureRings =
    [];


  for (
    var sr = 0;
    sr < 14;
    sr++
  ) {

    structureRings.push(
      structureGroup.appendChild(
        el(
          "ellipse",
          {
            class:
              "uh-structure-ring",

            stroke:
              sr > 9
                ?
                  "var(--glow)"
                :
                  "var(--aqua)"
          }
        )
      )
    );
  }


  var structureAxes =
    [];


  for (
    var sa = 0;
    sa < 16;
    sa++
  ) {

    structureAxes.push(
      structureGroup.appendChild(
        el(
          "line",
          {
            class:
              "uh-structure-axis"
          }
        )
      )
    );
  }


  var structureThreads =
    [];


  for (
    var st = 0;
    st < 24;
    st++
  ) {

    structureThreads.push(
      structureGroup.appendChild(
        el(
          "path",
          {
            class:
              "uh-structure-thread" +
              (
                st % 7 === 0
                  ?
                    " uh-structure-thread--warm"
                  :
                    ""
              )
          }
        )
      )
    );
  }


  /* ==========================================================================
     FINAL FIELD
     ========================================================================== */

  var stateGroup =
    svg.appendChild(
      el("g")
    );


  var fieldFill =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-field-fill",

          fill:
            "url(#uh-field-gradient)"
        }
      )
    );


  var fieldContours =
    [];


  for (
    var fc = 0;
    fc < 19;
    fc++
  ) {

    fieldContours.push(
      stateGroup.appendChild(
        el(
          "ellipse",
          {
            class:
              "uh-field-contour",

            stroke:
              fc > 13
                ?
                  "var(--glow)"
                :
                  "var(--aqua)"
          }
        )
      )
    );
  }


  var fieldBloom =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-field-bloom"
        }
      )
    );


  var fieldEdge =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-field-edge"
        }
      )
    );


  var fieldBeads =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-field-beads"
        }
      )
    );


  var positionHalo =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-position-halo"
        }
      )
    );


  var positionRing =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-position-ring"
        }
      )
    );


  var position =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-position",

          r:
            "6"
        }
      )
    );


  var positionCore =
    stateGroup.appendChild(
      el(
        "circle",
        {
          class:
            "uh-position-core",

          r:
            "2.2"
        }
      )
    );


  /* ==========================================================================
     DEPTH TITLES
     ========================================================================== */

  var depthSub =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "uh-depth-sub",

          x:
            "500",

          y:
            "562",

          "text-anchor":
            "middle"
        }
      )
    );


  var depthLabel =
    svg.appendChild(
      el(
        "text",
        {
          class:
            "uh-depth-label",

          x:
            "500",

          y:
            "590",

          "text-anchor":
            "middle"
        }
      )
    );


  /* ==========================================================================
     STATE
     ========================================================================== */

  var current =
    1;


  var target =
    1;


  /* ==========================================================================
     DEPTH LABEL
     ========================================================================== */

  function updateLabel() {

    if (
      target <
      .22
    ) {

      stateLabel.textContent =
        "Measured directly";


      depthSub.textContent =
        "REAL SIGNALS";


      depthLabel.textContent =
        "Measured directly";

    } else if (
      target <
      .55
    ) {

      stateLabel.textContent =
        "A reading you can trace";


      depthSub.textContent =
        "EXPLICIT MATH";


      depthLabel.textContent =
        "Relations become structure";

    } else if (
      target <
      .82
    ) {

      stateLabel.textContent =
        "Machine-checked in Lean";


      depthSub.textContent =
        "FORMAL STRUCTURE";


      depthLabel.textContent =
        "Structure holds";

    } else {

      stateLabel.textContent =
        "A living position";


      depthSub.textContent =
        "PHYSIOLOGICAL STATE";


      depthLabel.textContent =
        "A living position";
    }


    cards.forEach(
      function (card) {

        var key =
          card.getAttribute(
            "data-depth-card"
          );


        var active =
          (
            key === "signals" &&
            target < .28
          ) ||
          (
            key === "math" &&
            target >= .28 &&
            target < .68
          ) ||
          (
            key === "proof" &&
            target >= .68 &&
            target < .88
          );


        card.setAttribute(
          "data-active",
          String(active)
        );
      }
    );
  }


  /* ==========================================================================
     DRAW PROOF SCAFFOLD
     ========================================================================== */

  function drawProof(
    now,
    weights
  ) {

    var orbitNodes =
      proof.querySelectorAll(
        ".uh-proof-orbit"
      );


    orbitNodes.forEach(
      function (node, index) {

        var f =
          (
            index +
            1
          ) /
          orbitNodes.length;


        var rx =
          62 +
          f *
          220;


        var ry =
          rx *
          (
            .54 +
            Math.sin(
              index *
              .73
            ) *
            .055
          );


        node.setAttribute(
          "cx",
          CX
        );


        node.setAttribute(
          "cy",
          CY
        );


        node.setAttribute(
          "rx",
          rx.toFixed(1)
        );


        node.setAttribute(
          "ry",
          ry.toFixed(1)
        );


        node.setAttribute(
          "transform",
          "rotate(" +
          (
            index *
            17 +
            Math.sin(
              now *
              .00008 +
              index
            ) *
            2.5
          ).toFixed(1) +
          " " +
          CX +
          " " +
          CY +
          ")"
        );


        node.style.opacity =
          (
            .035 +
            weights.proof *
            .14 *
            (
              1 -
              f *
              .42
            )
          ).toFixed(3);
      }
    );


    var rayNodes =
      proof.querySelectorAll(
        ".uh-proof-ray"
      );


    rayNodes.forEach(
      function (node, index) {

        var a =
          index /
          rayNodes.length *
          TAU;


        var p0 =
          polar(
            CX,
            CY,
            48,
            a
          );


        var p1 =
          polar(
            CX,
            CY,
            286,
            a
          );


        node.setAttribute(
          "x1",
          p0.x.toFixed(1)
        );


        node.setAttribute(
          "y1",
          p0.y.toFixed(1)
        );


        node.setAttribute(
          "x2",
          p1.x.toFixed(1)
        );


        node.setAttribute(
          "y2",
          p1.y.toFixed(1)
        );


        node.style.opacity =
          (
            .018 +
            weights.proof *
            .09
          ).toFixed(3);
      }
    );


    var proofNodes =
      proof.querySelectorAll(
        ".uh-proof-node"
      );


    proofNodes.forEach(
      function (node, index) {

        var a =
          hash(
            index *
            17 +
            2
          ) *
          TAU;


        var r =
          65 +
          hash(
            index *
            29 +
            4
          ) *
          215;


        var drift =
          reduce
            ?
              0
            :
              Math.sin(
                now *
                .00025 +
                index
              ) *
              2.4;


        var p =
          polar(
            CX,
            CY,
            r + drift,
            a
          );


        node.setAttribute(
          "cx",
          p.x.toFixed(1)
        );


        node.setAttribute(
          "cy",
          p.y.toFixed(1)
        );


        node.style.opacity =
          (
            .025 +
            weights.proof *
            (
              .09 +
              hash(
                index *
                5
              ) *
              .15
            )
          ).toFixed(3);
      }
    );


    proofSeal.setAttribute(
      "cx",
      CX
    );


    proofSeal.setAttribute(
      "cy",
      CY
    );


    proofSeal.setAttribute(
      "r",
      (
        39 +
        weights.proof *
        8
      ).toFixed(1)
    );


    proofSeal.style.opacity =
      (
        .08 +
        weights.proof *
        .28
      ).toFixed(3);


    var pulseNodes =
      proofPulses.childNodes;


    for (
      var i = 0;
      i < pulseNodes.length;
      i++
    ) {

      var phase =
        reduce
          ?
            .5
          :
            (
              now /
              3300 +
              i /
              pulseNodes.length
            ) %
            1;


      pulseNodes[i]
        .setAttribute(
          "cx",
          CX
        );


      pulseNodes[i]
        .setAttribute(
          "cy",
          CY
        );


      pulseNodes[i]
        .setAttribute(
          "r",
          (
            40 +
            phase *
            74
          ).toFixed(1)
        );


      pulseNodes[i]
        .style.opacity =
        (
          weights.proof *
          (
            1 -
            phase
          ) *
          .10
        ).toFixed(3);
    }
  }


  /* ==========================================================================
     DRAW SIGNALS
     ========================================================================== */

  function drawSignals(
    now,
    weights
  ) {

    /*
     * Signals originate around the perimeter and arc toward four family
     * collection regions.

     * As depth increases they compress rather than disappear.
     */

    for (
      var i = 0;
      i < SIGNAL_COUNT;
      i++
    ) {

      var familyIndex =
        i %
        4;


      var family =
        FAMILY_DATA[
          familyIndex
        ];


      var startSide =
        i %
        2;


      var sx =
        startSide
          ?
            905 +
            hash(
              i *
              11
            ) *
            45
          :
            48 +
            hash(
              i *
              13
            ) *
            60;


      var sy =
        72 +
        hash(
          i *
          19 +
          4
        ) *
        440;


      var familyPoint =
        polar(
          CX,
          CY,
          235,
          family.angle
        );


      /*
       * Signal endpoint migrates from family collection point toward the center
       * as the reading becomes more resolved.
       */
      var compression =
        smoothstep(
          (
            current -
            .10
          ) /
          .64
        );


      var ex =
        lerp(
          familyPoint.x,
          CX,
          compression *
          .67
        );


      var ey =
        lerp(
          familyPoint.y,
          CY,
          compression *
          .67
        );


      var cx1 =
        lerp(
          sx,
          ex,
          .38
        );


      var cy1 =
        sy +
        Math.sin(
          i *
          .77 +
          now *
          .0003
        ) *
        34;


      var cx2 =
        lerp(
          sx,
          ex,
          .72
        );


      var cy2 =
        lerp(
          sy,
          ey,
          .70
        ) +
        Math.cos(
          i *
          .51
        ) *
        28;


      signalPaths[i]
        .setAttribute(
          "d",
          "M" +
          sx.toFixed(1) +
          " " +
          sy.toFixed(1) +
          "C" +
          cx1.toFixed(1) +
          " " +
          cy1.toFixed(1) +
          "," +
          cx2.toFixed(1) +
          " " +
          cy2.toFixed(1) +
          "," +
          ex.toFixed(1) +
          " " +
          ey.toFixed(1)
        );


      signalPaths[i]
        .style.opacity =
        (
          weights.signals *
          (
            .13 +
            hash(
              i *
              7
            ) *
            .34
          )
        ).toFixed(3);


      /*
       * A small packet moves along the incoming relation.
       * Approximate cubic motion is enough for atmosphere; it isn't a data trace.
       */
      var packetT =
        reduce
          ?
            .72
          :
            (
              now /
              (
                3900 +
                i *
                63
              ) +
              hash(
                i *
                31
              )
            ) %
            1;


      var q0 =
        Math.pow(
          1 -
          packetT,
          3
        );


      var q1 =
        3 *
        Math.pow(
          1 -
          packetT,
          2
        ) *
        packetT;


      var q2 =
        3 *
        (
          1 -
          packetT
        ) *
        packetT *
        packetT;


      var q3 =
        packetT *
        packetT *
        packetT;


      var px =
        q0 *
        sx +
        q1 *
        cx1 +
        q2 *
        cx2 +
        q3 *
        ex;


      var py =
        q0 *
        sy +
        q1 *
        cy1 +
        q2 *
        cy2 +
        q3 *
        ey;


      signalNodes[i]
        .setAttribute(
          "cx",
          px.toFixed(1)
        );


      signalNodes[i]
        .setAttribute(
          "cy",
          py.toFixed(1)
        );


      signalNodes[i]
        .style.opacity =
        (
          weights.signals *
          .64
        ).toFixed(3);
    }


    /* metric labels */
    signalLabels.forEach(
      function (label, index) {

        var side =
          index %
          2;


        var row =
          Math.floor(
            index /
            2
          );


        label.setAttribute(
          "x",
          side
            ?
              922
            :
              64
        );


        label.setAttribute(
          "y",
          (
            132 +
            row *
            84
          ).toFixed(1)
        );


        label.setAttribute(
          "text-anchor",
          side
            ?
              "end"
            :
              "start"
        );


        label.style.opacity =
          (
            weights.signals *
            (
              1 -
              smoothstep(
                (
                  current -
                  .20
                ) /
                .32
              )
            ) *
            .66
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     DRAW FAMILIES
     ========================================================================== */

  function drawFamilies(
    now,
    weights
  ) {

    families.forEach(
      function (family, index) {

        var anchor =
          polar(
            CX,
            CY,
            220,
            family.data.angle +
            interiorSpin(120) +
            interiorSpin(220)
          );


        var inner =
          polar(
            CX,
            CY,
            lerp(
              130,
              34,
              smoothstep(
                (
                  current -
                  .28
                ) /
                .40
              )
            ),
            family.data.angle +
            interiorSpin(120) +
            Math.sin(
              now *
              .00025 +
              index
            ) *
            .045
          );


        var control =
          polar(
            CX,
            CY,
            164,
            family.data.angle +
            interiorSpin(120) +
            (
              index %
              2
                ?
                  .24
                :
                  -.24
            )
          );


        family.path
          .setAttribute(
            "d",
            "M" +
            anchor.x.toFixed(1) +
            " " +
            anchor.y.toFixed(1) +
            "Q" +
            control.x.toFixed(1) +
            " " +
            control.y.toFixed(1) +
            "," +
            inner.x.toFixed(1) +
            " " +
            inner.y.toFixed(1)
          );


        family.path.style.opacity =
          (
            weights.families *
            .78
          ).toFixed(3);


        family.node.setAttribute(
          "cx",
          anchor.x.toFixed(1)
        );


        family.node.setAttribute(
          "cy",
          anchor.y.toFixed(1)
        );


        family.node.style.opacity =
          (
            weights.families *
            .75
          ).toFixed(3);


        var labelPoint =
          polar(
            CX,
            CY,
            255,
            family.data.angle +
            interiorSpin(120)
          );


        family.label.setAttribute(
          "x",
          labelPoint.x.toFixed(1)
        );


        family.label.setAttribute(
          "y",
          labelPoint.y.toFixed(1)
        );


        family.label.setAttribute(
          "text-anchor",
          Math.cos(
            family.data.angle
          ) >
          .2
            ?
              "start"
            :
              Math.cos(
                family.data.angle
              ) <
              -.2
                ?
                  "end"
                :
                  "middle"
        );


        family.label.style.opacity =
          (
            weights.families *
            .72
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     DRAW RELATIONS
     ========================================================================== */

  function drawRelations(
    now,
    weights
  ) {

    var anchors = [];


    for (
      var i = 0;
      i < 16;
      i++
    ) {

      var angle =
        i /
        16 *
        TAU +
        .2;


      var radius =
        75 +
        (
          i %
          4
        ) *
        31;


      radius +=
        Math.sin(
          now *
          .0005 +
          i *
          .63
        ) *
        5 *
        (
          1 -
          smoothstep(
            (
              current -
              .54
            ) /
            .30
          )
        );


      anchors.push(
        polar(
          CX,
          CY,
          radius,
          angle
        )
      );


      relationNodes[i]
        .setAttribute(
          "cx",
          anchors[i].x.toFixed(1)
        );


      relationNodes[i]
        .setAttribute(
          "cy",
          anchors[i].y.toFixed(1)
        );


      relationNodes[i]
        .style.opacity =
        (
          weights.relations *
          (
            .28 +
            .45 *
            smoothstep(
              (
                current -
                .25
              ) /
              .30
            )
          )
        ).toFixed(3);
    }


    relations.forEach(
      function (path, index) {

        var a =
          anchors[
            index %
            anchors.length
          ];


        var jump =
          3 +
          index %
          7;


        var b =
          anchors[
            (
              index +
              jump
            ) %
            anchors.length
          ];


        var inward =
          .18 +
          hash(
            index *
            17
          ) *
          .24;


        var mx =
          lerp(
            (
              a.x +
              b.x
            ) /
            2,
            CX,
            inward
          );


        var my =
          lerp(
            (
              a.y +
              b.y
            ) /
            2,
            CY,
            inward
          );


        path.setAttribute(
          "d",
          "M" +
          a.x.toFixed(1) +
          " " +
          a.y.toFixed(1) +
          "Q" +
          mx.toFixed(1) +
          " " +
          my.toFixed(1) +
          "," +
          b.x.toFixed(1) +
          " " +
          b.y.toFixed(1)
        );


        path.style.opacity =
          (
            weights.relations *
            (
              .08 +
              hash(
                index *
                11
              ) *
              .30
            )
          ).toFixed(3);
      }
    );


    relationHalos.forEach(
      function (halo, index) {

        var f =
          (
            index +
            1
          ) /
          relationHalos.length;


        var rx =
          50 +
          f *
          132;


        var ry =
          rx *
          (
            .58 +
            Math.sin(
              index *
              .92
            ) *
            .08
          );


        halo.setAttribute(
          "cx",
          CX
        );


        halo.setAttribute(
          "cy",
          CY
        );


        halo.setAttribute(
          "rx",
          rx.toFixed(1)
        );


        halo.setAttribute(
          "ry",
          ry.toFixed(1)
        );


        halo.setAttribute(
          "transform",
          "rotate(" +
          (
            index *
            21 +
            Math.sin(
              now *
              .00016 +
              index
            ) *
            2
          ).toFixed(1) +
          " " +
          CX +
          " " +
          CY +
          ")"
        );


        halo.style.opacity =
          (
            weights.relations *
            (
              .025 +
              f *
              .06
            )
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     DRAW STRUCTURE
     ========================================================================== */

  function drawStructure(
    now,
    weights
  ) {

    structureRings.forEach(
      function (ring, index) {

        var f =
          (
            index +
            1
          ) /
          structureRings.length;


        var rx =
          38 +
          f *
          152;


        var irregularity =
          (
            1 -
            weights.structure
          ) *
          10;


        var ry =
          rx *
          (
            .72 +
            Math.sin(
              index *
              .66
            ) *
            .025
          ) +
          Math.sin(
            now *
            .0005 +
            index
          ) *
          irregularity;


        ring.setAttribute(
          "cx",
          CX
        );


        ring.setAttribute(
          "cy",
          CY
        );


        ring.setAttribute(
          "rx",
          rx.toFixed(1)
        );


        ring.setAttribute(
          "ry",
          ry.toFixed(1)
        );


        ring.setAttribute(
          "transform",
          "rotate(" +
          (
            index *
            13
          ).toFixed(1) +
          " " +
          CX +
          " " +
          CY +
          ")"
        );


        ring.style.opacity =
          (
            weights.structure *
            (
              .035 +
              (
                1 -
                f
              ) *
              .14
            )
          ).toFixed(3);
      }
    );


    structureAxes.forEach(
      function (axis, index) {

        var angle =
          index /
          structureAxes.length *
          TAU;


        var p0 =
          polar(
            CX,
            CY,
            24,
            angle
          );


        var p1 =
          polar(
            CX,
            CY,
            188,
            angle
          );


        axis.setAttribute(
          "x1",
          p0.x.toFixed(1)
        );


        axis.setAttribute(
          "y1",
          p0.y.toFixed(1)
        );


        axis.setAttribute(
          "x2",
          p1.x.toFixed(1)
        );


        axis.setAttribute(
          "y2",
          p1.y.toFixed(1)
        );


        axis.style.opacity =
          (
            weights.structure *
            .20
          ).toFixed(3);
      }
    );


    structureThreads.forEach(
      function (thread, index) {

        var a1 =
          index /
          structureThreads.length *
          TAU;


        var a2 =
          a1 +
          1.4 +
          hash(
            index *
            19
          ) *
          1.3;


        var p0 =
          polar(
            CX,
            CY,
            52 +
            hash(
              index *
              7
            ) *
            45,
            a1
          );


        var p1 =
          polar(
            CX,
            CY,
            118 +
            hash(
              index *
              11
            ) *
            58,
            a2
          );


        var control =
          polar(
            CX,
            CY,
            48 +
            hash(
              index *
              23
            ) *
            44,
            (
              a1 +
              a2
            ) /
            2
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
            weights.structure *
            (
              .04 +
              hash(
                index *
                29
              ) *
              .20
            )
          ).toFixed(3);
      }
    );
  }


  /* ==========================================================================
     DRAW FIELD / POSITION
     ========================================================================== */

  function drawField(
    now,
    weights
  ) {

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


    var radius =
      FIELD_R *
      breath;


    fieldFill.setAttribute(
      "cx",
      CX
    );


    fieldFill.setAttribute(
      "cy",
      CY
    );


    fieldFill.setAttribute(
      "r",
      radius.toFixed(1)
    );


    fieldFill.style.opacity =
      (
        weights.field *
        .92
      ).toFixed(3);


    fieldBloom.setAttribute(
      "cx",
      CX
    );


    fieldBloom.setAttribute(
      "cy",
      CY
    );


    fieldBloom.setAttribute(
      "r",
      radius.toFixed(1)
    );


    fieldBloom.style.opacity =
      (
        weights.field *
        .13
      ).toFixed(3);


    fieldEdge.setAttribute(
      "cx",
      CX
    );


    fieldEdge.setAttribute(
      "cy",
      CY
    );


    fieldEdge.setAttribute(
      "r",
      radius.toFixed(1)
    );


    fieldEdge.style.opacity =
      (
        weights.field *
        .95
      ).toFixed(3);


    fieldBeads.setAttribute(
      "cx",
      CX
    );


    fieldBeads.setAttribute(
      "cy",
      CY
    );


    fieldBeads.setAttribute(
      "r",
      (
        radius +
        4
      ).toFixed(1)
    );


    fieldBeads.style.opacity =
      (
        weights.field *
        .55
      ).toFixed(3);


    fieldContours.forEach(
      function (contour, index) {

        var f =
          (
            index +
            1
          ) /
          fieldContours.length;


        var rr =
          radius *
          (
            .12 +
            f *
            .80
          );


        contour.setAttribute(
          "cx",
          (
            CX +
            Math.sin(
              now *
              .00018 +
              index
            ) *
            2.5
          ).toFixed(1)
        );


        contour.setAttribute(
          "cy",
          (
            CY +
            Math.cos(
              now *
              .00015 +
              index
            ) *
            2
          ).toFixed(1)
        );


        contour.setAttribute(
          "rx",
          rr.toFixed(1)
        );


        contour.setAttribute(
          "ry",
          (
            rr *
            (
              .86 +
              Math.sin(
                index *
                .61
              ) *
              .025
            )
          ).toFixed(1)
        );


        contour.setAttribute(
          "transform",
          "rotate(" +
          (
            index *
            8
          ) +
          " " +
          CX +
          " " +
          CY +
          ")"
        );


        contour.style.opacity =
          (
            weights.field *
            (
              .025 +
              (
                1 -
                f
              ) *
              .13
            )
          ).toFixed(3);
      }
    );


    /*
     * Position is intentionally offset.
     * The state is bounded; it is not synonymous with its center.
     */
    var px =
      CX +
      54;


    var py =
      CY -
      34;


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
          px
        );


        node.setAttribute(
          "cy",
          py
        );
      }
    );


    positionHalo.setAttribute(
      "r",
      (
        20 +
        weights.position *
        20
      ).toFixed(1)
    );


    positionHalo.style.opacity =
      (
        weights.position *
        .22
      ).toFixed(3);


    positionRing.setAttribute(
      "r",
      (
        9 +
        weights.position *
        4
      ).toFixed(1)
    );


    positionRing.style.opacity =
      (
        weights.position *
        .88
      ).toFixed(3);


    position.style.opacity =
      weights.position.toFixed(3);


    positionCore.style.opacity =
      weights.position.toFixed(3);
  }


  /* ==========================================================================
     MASTER SVG DRAW
     ========================================================================== */

  function drawSVG(now) {

    var weights =
      depthWeights(
        current
      );


    drawProof(
      now,
      weights
    );


    drawSignals(
      now,
      weights
    );


    drawFamilies(
      now,
      weights
    );


    drawRelations(
      now,
      weights
    );


    drawStructure(
      now,
      weights
    );


    drawField(
      now,
      weights
    );


    depthSub.style.opacity =
      ".55";


    depthLabel.style.opacity =
      ".88";
  }


  /* ==========================================================================
     CANVAS
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
      i < 92;
      i++
    ) {

      PARTICLES.push({

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

        warm:
          hash(
            i *
            19 +
            5
          ) >
          .82
      });
    }


    for (
      var s = 0;
      s < 28;
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
          .040,

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


  function visualMetrics() {

    var rect =
      svg.getBoundingClientRect();


    var canvasRect =
      canvas.getBoundingClientRect();


    return {

      left:
        rect.left -
        canvasRect.left,

      top:
        rect.top -
        canvasRect.top,

      width:
        rect.width,

      height:
        rect.height,

      scale:
        rect.width /
        W
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


    var metric =
      visualMetrics();


    var centerX =
      metric.left +
      CX *
      metric.scale;


    var centerY =
      metric.top +
      CY *
      metric.scale;


    var time =
      now /
      1000;


    uhClock = now;


    var weights =
      depthWeights(
        current
      );


    /* ----------------------------------------------------------------------
       STREAMS

       At signal depth they behave independently.

       At relation depth their paths bend toward the same relational volume.

       At structure depth they become laminar.

       At position depth they almost disappear into the resolved object.
       ---------------------------------------------------------------------- */

    STREAMS.forEach(
      function (stream, index) {

        ctx.beginPath();


        var steps =
          54;


        for (
          var j = 0;
          j <= steps;
          j++
        ) {

          var u =
            j /
            steps;


          var x =
            u *
            canvasW;


          var independent =
            Math.sin(
              u *
              TAU *
              (
                1.15 +
                index %
                4 *
                .20
              ) +
              stream.phase +
              time *
              (
                .10 +
                index %
                3 *
                .025
              )
            ) *
            stream.amp *
            canvasH;


          var y =
            stream.y *
            canvasH +
            independent;


          var dx =
            x -
            centerX;


          var dy =
            y -
            centerY;


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
                metric.scale *
                310
              )
            );


          /*
           * Relation: bring streams into interaction without collapsing them.
           */
          y =
            lerp(
              y,
              centerY +
              (
                y -
                centerY
              ) *
              .74 +
              Math.sin(
                u *
                TAU *
                1.6 +
                time *
                .55
              ) *
              16,
              weights.relations *
              influence *
              .26
            );


          /*
           * Structure: movement becomes cleaner / more ordered.
           */
          y =
            lerp(
              y,
              centerY +
              (
                y -
                centerY
              ) *
              .88,
              weights.structure *
              influence *
              .18
            );


          if (
            j === 0
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
          .008 +
          weights.signals *
          .018 +
          weights.relations *
          .014 +
          weights.structure *
          .008;


        alpha *=
          (
            1 -
            weights.position *
            .55
          );


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


    /* ----------------------------------------------------------------------
       PARTICLES
       ---------------------------------------------------------------------- */

    PARTICLES.forEach(
      function (particle, index) {

        var x =
          particle.x *
          canvasW +
          Math.sin(
            time *
            .08 +
            particle.phase
          ) *
          15 *
          particle.depth;


        var y =
          particle.y *
          canvasH +
          Math.cos(
            time *
            .06 +
            particle.phase
          ) *
          10 *
          particle.depth;


        var dx =
          x -
          centerX;


        var dy =
          y -
          centerY;


        var dist =
          Math.sqrt(
            dx *
            dx +
            dy *
            dy
          );


        var attraction =
          Math.exp(
            -dist /
            Math.max(
              180,
              metric.scale *
              300
            )
          );


        /*
         * As depth resolves, particles become progressively ordered around
         * the relational center.
         */
        var angle =
          Math.atan2(
            dy,
            dx
          );


        /*
         * CAPTURE AND SWIRL
         *
         * As depth resolves the measurements are not merely sorted into rings.
         * They are drawn inward — the radius they are held at contracts as the
         * structure closes — and then carried around the position in a single
         * coherent rotation.
         *
         * The rotation is differential: the closer a measurement is held, the
         * faster it travels. That is what makes a centre read as a centre.
         *
         * Each measurement keeps its own inclination, so the swirl has volume
         * rather than lying flat on the page. Nothing is discarded; everything
         * that came in is still in there, moving.
         */
        var pull =
          (
            weights.relations * .30 +
            weights.structure * .78 +
            weights.position * 1.0
          ) *
          attraction;


        /* the suction: what was loose at 190 is held at ~62 once resolved */
        var desiredRadius =
          metric.scale *
          lerp(
            190,
            48,
            clamp(pull, 0, 1)
          ) *
          (
            .52 +
            particle.depth *
            .78
          );


        /* one direction for everything, faster the closer it is held */
        var swirlAngle =
          angle +
          time *
          (
            .19 +
            weights.structure * .30 +
            weights.position * .46
          ) *
          (
            140 /
            Math.max(
              46,
              desiredRadius
            )
          );


        /*
         * Its own inclination. The orbit is an ellipse tilted by the particle's
         * depth, so the swirl occupies a volume instead of a disc.
         */
        var tilt =
          .34 +
          Math.abs(
            Math.sin(
              particle.phase +
              particle.depth * 2.1
            )
          ) *
          .66;


        var spin =
          particle.phase * .7;


        var ox =
          Math.cos(swirlAngle) *
          desiredRadius;


        var oy =
          Math.sin(swirlAngle) *
          desiredRadius *
          tilt;


        var desiredX =
          centerX +
          ox * Math.cos(spin) -
          oy * Math.sin(spin);


        var desiredY =
          centerY +
          ox * Math.sin(spin) +
          oy * Math.cos(spin);


        var organization =
          clamp(
            weights.relations * .16 +
            weights.structure * .46 +
            weights.position * .60,
            0,
            .92
          ) *
          attraction;


        x =
          lerp(
            x,
            desiredX,
            organization
          );


        y =
          lerp(
            y,
            desiredY,
            organization
          );


        var alpha =
          (
            .018 +
            particle.depth *
            .07
          ) *
          (
            1 +
            weights.position *
            .55
          );


        ctx.beginPath();


        ctx.arc(
          x,
          y,
          .45 +
          particle.depth *
          .85,
          0,
          TAU
        );


        ctx.fillStyle =
          particle.warm
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
       CENTRAL DEPTH BLOOM
       ---------------------------------------------------------------------- */

    var bloomRadius =
      metric.scale *
      (
        80 +
        current *
        175
      );


    var gradient =
      ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        bloomRadius
      );


    gradient.addColorStop(
      0,
      "rgba(102,224,237," +
      (
        .018 +
        weights.position *
        .040
      ) +
      ")"
    );


    gradient.addColorStop(
      .38,
      "rgba(236,199,126," +
      (
        weights.structure *
        .014
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
      centerX,
      centerY,
      bloomRadius,
      0,
      TAU
    );


    ctx.fill();
  }


  /* ==========================================================================
     INTERACTION
     ========================================================================== */

  function setTarget(value) {

    target =
      clamp(
        value,
        0,
        1
      );


    slider.value =
      String(
        Math.round(
          target *
          100
        )
      );


    updateLabel();


    if (
      reduce
    ) {

      current =
        target;


      drawSVG(0);
    }
  }


  slider.addEventListener(
    "input",
    function () {

      stopPlayback();


      setTarget(
        Number(
          slider.value
        ) /
        100
      );


      ensureAnimation();
    }
  );


  cards.forEach(
    function (card) {

      function activate() {

        stopPlayback();


        var key =
          card.getAttribute(
            "data-depth-card"
          );


        if (
          key === "signals"
        ) {

          setTarget(
            .08
          );

        } else if (
          key === "math"
        ) {

          setTarget(
            .48
          );

        } else {

          setTarget(
            .70
          );
        }


        ensureAnimation();


        document.querySelector(
          ".uh__experience"
        )
        .scrollIntoView({
          behavior:
            reduce
              ?
                "auto"
              :
                "smooth",

          block:
            "center"
        });
      }


      card.addEventListener(
        "click",
        activate
      );


      card.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Enter" ||
            event.key ===
            " "
          ) {

            event.preventDefault();

            activate();
          }
        }
      );
    }
  );


  /* ==========================================================================
     PLAYBACK
     ========================================================================== */

  var playbackRAF =
    0;


  var playing =
    false;


  function stopPlayback() {

    playing =
      false;


    if (
      playbackRAF
    ) {

      cancelAnimationFrame(
        playbackRAF
      );


      playbackRAF =
        0;
    }


    play.textContent =
      "Trace from the signals →";
  }


  function playReading() {

    if (
      reduce
    ) {

      setTarget(
        1
      );

      return;
    }


    stopPlayback();


    playing =
      true;


    play.textContent =
      "Following the reading…";


    setTarget(
      0
    );


    var start =
      0;


    var duration =
      8200;


    function step(now) {

      if (
        !playing
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
       * Linger in relations and structure so these transformations are actually
       * perceived rather than passed through as animation filler.
       */
      var mapped;


      if (
        p <
        .24
      ) {

        mapped =
          lerp(
            0,
            .27,
            easeInOutCubic(
              p /
              .24
            )
          );

      } else if (
        p <
        .54
      ) {

        mapped =
          lerp(
            .27,
            .57,
            smoothstep(
              (
                p -
                .24
              ) /
              .30
            )
          );

      } else if (
        p <
        .78
      ) {

        mapped =
          lerp(
            .57,
            .78,
            smoothstep(
              (
                p -
                .54
              ) /
              .24
            )
          );

      } else {

        mapped =
          lerp(
            .78,
            1,
            easeInOutCubic(
              (
                p -
                .78
              ) /
              .22
            )
          );
      }


      target =
        mapped;


      slider.value =
        String(
          Math.round(
            mapped *
            100
          )
        );


      updateLabel();


      if (
        p <
        1
      ) {

        playbackRAF =
          requestAnimationFrame(
            step
          );

      } else {

        playing =
          false;


        playbackRAF =
          0;


        play.textContent =
          "Trace from the signals →";
      }
    }


    playbackRAF =
      requestAnimationFrame(
        step
      );
  }


  play.addEventListener(
    "click",
    playReading
  );


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

    /* one clock drives the interior rotation everywhere */
    uhClock = now;

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
        380
      );


    current =
      lerp(
        current,
        target,
        k
      );


    drawSVG(
      now
    );


    if (
      ctx &&
      !reduce
    ) {

      drawCanvas(
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
     CANVAS INIT
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

     Unlike the earlier sections, begin with the resolved reading.

     The visitor has already learned what a living position looks like.

     Here that familiar object opens and shows what it contains.
     ========================================================================== */

  target =
    1;


  current =
    1;


  slider.value =
    "100";


  updateLabel();


  if (
    reduce
  ) {

    play.hidden =
      true;


    drawSVG(
      0
    );

  } else {

    ensureAnimation();


    /*
     * On first arrival, let the resolved position exist for a moment,
     * then quietly open it all the way back to its measurements and rebuild it.
     */
    window.setTimeout(
      function () {

        if (
          Number(
            slider.value
          ) ===
          100
        ) {

          playReading();
        }
      },
      1100
    );
  }

})();
