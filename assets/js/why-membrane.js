(function () {
  "use strict";

  if (window.__whyMembraneDepthWrapper) return;
  window.__whyMembraneDepthWrapper = true;

  var BASE_SRC = "assets/js/why-membrane-base.js?v=1";
  var TAU = Math.PI * 2;
  var VIEW = 700;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function smootherstep(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453123; return x - Math.floor(x); }

  function buildCells() {
    var out = [], ring, idx, count, r, a;
    var shells = [
      { r: .00, n: 1 },
      { r: .34, n: 5 },
      { r: .62, n: 7 }
    ];

    for (ring = 0; ring < shells.length; ring++) {
      count = shells[ring].n;
      for (idx = 0; idx < count; idx++) {
        r = shells[ring].r + (hash(ring * 31 + idx * 7) - .5) * .07;
        a = (idx / count) * TAU + ring * .7 + hash(ring * 13 + idx) * .3;
        out.push({
          rest: { x: Math.cos(a) * r, y: Math.sin(a) * r },
          size: .052 + hash(ring * 17 + idx * 3) * .034,
          rate: .00042 + hash(ring * 23 + idx * 5) * .00058,
          phase: hash(ring * 41 + idx * 11) * TAU,
          outward: hash(ring * 53 + idx * 19) > .5,
          warm: hash(ring * 61 + idx * 13) > .58
        });
      }
    }
    return out;
  }

  function geometry(progress) {
    var p = smootherstep(progress);
    return {
      cx: lerp(350, -245, p),
      cy: lerp(350, 370, p),
      radius: lerp(220, 940, p)
    };
  }

  function rgba(hex, alpha) {
    var h = String(hex || "").trim();
    if (/^#[0-9a-f]{3}$/i.test(h)) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    if (/^#[0-9a-f]{6}$/i.test(h)) {
      var n = parseInt(h.slice(1), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
    }
    return h;
  }

  function setupDepth() {
    var section = document.getElementById("idea");
    var svg = document.getElementById("we-field");
    var range = document.getElementById("we-range");
    var stage = section && section.querySelector(".idea-exp__stage");
    if (!section || !svg || !range || !stage || stage.querySelector(".we-depth-overlay")) return;

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.documentElement;
    var canvas = document.createElement("canvas");
    canvas.className = "we-depth-overlay";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "4";
    canvas.style.mixBlendMode = "screen";
    stage.appendChild(canvas);

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var CELLS = buildCells();
    var W = 1, H = 1, D = 1, visible = true, last = performance.now();
    var current = clamp((+range.value || 0) / 100, 0, 1);
    var target = current;
    var pal = {};

    function palette() {
      var cs = getComputedStyle(root);
      pal.glow = cs.getPropertyValue("--glow").trim() || "#ECC77E";
      pal.soft = cs.getPropertyValue("--glow-soft").trim() || "#F2DCAB";
      pal.aqua = cs.getPropertyValue("--aqua").trim() || "#66E0ED";
      pal.aquaDeep = cs.getPropertyValue("--aqua-deep").trim() || "#21A8C7";
    }

    function resize() {
      var r = stage.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      D = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * D);
      canvas.height = Math.round(H * D);
      ctx.setTransform(D, 0, 0, D, 0, 0);
    }

    function stageMetrics() {
      var sr = svg.getBoundingClientRect();
      var cr = canvas.getBoundingClientRect();
      return {
        left: sr.left - cr.left,
        top: sr.top - cr.top,
        scale: sr.width / VIEW
      };
    }

    function logicalToCanvas(p, s) {
      return { x: s.left + p.x * s.scale, y: s.top + p.y * s.scale };
    }

    function liveCells(time, center, radius) {
      return CELLS.map(function (cell) {
        var breath = Math.sin(time * 1000 * cell.rate + cell.phase);
        var drift = .012 * breath;
        var cellRadius = Math.sqrt(cell.rest.x * cell.rest.x + cell.rest.y * cell.rest.y);
        var spin = time * .058 + Math.sin(time * .21) * .30 / Math.max(.22, cellRadius);
        var ca = Math.cos(spin), sa = Math.sin(spin);
        var rx = cell.rest.x * ca - cell.rest.y * sa;
        var ry = cell.rest.x * sa + cell.rest.y * ca;
        return {
          x: center.x + (rx + drift) * radius * .82,
          y: center.y + (ry - drift * .7) * radius * .82,
          r: cell.size * radius * (1 + breath * .10),
          cell: cell
        };
      });
    }

    function glow(x, y, r, c, a) {
      if (r <= 0) return;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(c, a));
      g.addColorStop(.35, rgba(c, a * .28));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    function drawWell(L, index, center, reveal, time) {
      if (L.r < 5 || reveal <= .002) return;

      var cell = L.cell;
      var base = cell.warm ? pal.glow : pal.aqua;
      var dx = center.x - L.x, dy = center.y - L.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      var vx, vy;
      if (len < .001) {
        vx = Math.cos(cell.phase);
        vy = Math.sin(cell.phase);
      } else {
        vx = dx / len;
        vy = dy / len;
      }
      var px = -vy, py = vx;
      var twist = Math.sin(time * .31 + cell.phase) * .05;
      var rotation = Math.atan2(vy, vx) + Math.PI / 2 + twist;
      var depthShift = L.r * (.26 + .035 * Math.sin(time * .44 + cell.phase));

      glow(L.x, L.y, L.r * 1.25, base, reveal * .032);

      var rings = 9;
      for (var q = 0; q < rings; q++) {
        var d = q / (rings - 1);
        var eased = smoothstep(d);
        var rr = L.r * lerp(.94, .16, eased);
        var ox = vx * depthShift * eased + px * Math.sin(time * .42 + cell.phase + d * 5.2) * L.r * .018 * eased;
        var oy = vy * depthShift * eased + py * Math.sin(time * .42 + cell.phase + d * 5.2) * L.r * .018 * eased;
        var flatten = lerp(.96, .57, eased);
        var alpha = reveal * lerp(.23, .10, eased) * (1 + .16 * Math.sin(time * .55 + q * .8 + cell.phase));

        ctx.beginPath();
        ctx.ellipse(L.x + ox, L.y + oy, rr, rr * flatten, rotation, 0, TAU);
        ctx.strokeStyle = rgba(q % 3 === 0 ? pal.soft : base, alpha);
        ctx.lineWidth = q === 0 ? 1.05 : .62;
        ctx.stroke();
      }

      var deepX = L.x + vx * depthShift;
      var deepY = L.y + vy * depthShift;
      glow(deepX, deepY, L.r * .38, base, reveal * .075);
      ctx.beginPath();
      ctx.arc(deepX, deepY, Math.max(.9, L.r * .035), 0, TAU);
      ctx.fillStyle = rgba(pal.soft, reveal * .65);
      ctx.fill();

      for (var arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (var s = 0; s <= 24; s++) {
          var u = s / 24;
          var e = smoothstep(u);
          var rad = L.r * lerp(.82, .12, e);
          var ang = cell.phase + arm * TAU / 3 + u * TAU * 1.25 + time * (cell.outward ? .22 : -.22);
          var cx = L.x + vx * depthShift * e;
          var cy = L.y + vy * depthShift * e;
          var x = cx + Math.cos(ang) * rad * .72;
          var y = cy + Math.sin(ang) * rad * .52;
          if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = rgba(arm === 0 ? pal.glow : pal.aqua, reveal * .055);
        ctx.lineWidth = .55;
        ctx.stroke();
      }

      for (var n = 0; n < 5; n++) {
        var flow = (time * (.11 + cell.rate * 76) + n / 5 + cell.phase / TAU) % 1;
        if (!cell.outward) flow = 1 - flow;
        var e2 = smoothstep(flow);
        var rad2 = L.r * lerp(.82, .16, e2);
        var ang2 = cell.phase + n * TAU / 5 + flow * TAU * .72 + time * .13;
        var fx = L.x + vx * depthShift * e2 + Math.cos(ang2) * rad2 * .72;
        var fy = L.y + vy * depthShift * e2 + Math.sin(ang2) * rad2 * .52;
        glow(fx, fy, 5 + L.r * .035, cell.outward ? pal.glow : pal.aqua, reveal * .035);
        ctx.beginPath();
        ctx.arc(fx, fy, .75 + reveal * .45, 0, TAU);
        ctx.fillStyle = rgba(cell.outward ? pal.glow : pal.aqua, reveal * .46);
        ctx.fill();
      }
    }

    function frame(now) {
      var dt = Math.min(40, now - last || 16);
      last = now;
      var k = reduce ? 1 : 1 - Math.exp(-dt / 360);
      current = lerp(current, target, k);

      ctx.clearRect(0, 0, W, H);
      if (visible) {
        var reveal = smoothstep((current - .50) / .38);
        if (reveal > .002) {
          var s = stageMetrics();
          var geom = geometry(current);
          var center = logicalToCanvas({ x: geom.cx, y: geom.cy }, s);
          var radius = geom.radius * s.scale;
          var time = now / 1000;
          var live = liveCells(time, center, radius);
          live.forEach(function (L, i) { drawWell(L, i, center, reveal, time); });
        }
      }
      requestAnimationFrame(frame);
    }

    range.addEventListener("input", function () {
      target = clamp((+range.value || 0) / 100, 0, 1);
    }, { passive: true });

    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible = entry.isIntersecting; });
    }, { rootMargin: "25% 0px 25% 0px", threshold: .01 }).observe(section);
    new MutationObserver(palette).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    palette();
    resize();
    requestAnimationFrame(frame);
  }

  function loadBase() {
    var existing = document.querySelector('script[data-why-membrane-base]');
    if (existing) {
      if (document.getElementById("we-field")) setupDepth();
      else existing.addEventListener("load", setupDepth, { once: true });
      return;
    }

    var base = document.createElement("script");
    base.src = BASE_SRC;
    base.async = false;
    base.dataset.whyMembraneBase = "true";
    base.addEventListener("load", setupDepth, { once: true });
    document.head.appendChild(base);
  }

  loadBase();
})();