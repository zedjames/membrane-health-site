(function () {
  "use strict";

  if (window.__whyMembraneDepthWrapper) return;
  window.__whyMembraneDepthWrapper = true;

  var BASE_SRC = "assets/js/why-membrane-base.js?v=1";
  var TAU = Math.PI * 2;
  var VIEW = 700;
  var VISUAL_LIFT = 1.25;

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
    return { cx: lerp(350, -245, p), cy: lerp(350, 370, p), radius: lerp(220, 940, p) };
  }

  function rgba(hex, alpha) {
    var h = String(hex || "").trim();
    alpha = clamp((Number(alpha) || 0) * VISUAL_LIFT, 0, 1);
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

    var style = document.createElement("style");
    style.textContent = "#idea .mh-signature-canvas--membrane-v2,#idea .mh-vitality-canvas--membrane{display:none!important}";
    document.head.appendChild(style);

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
    var current = clamp((+range.value || 0) / 100, 0, 1), target = current, pal = {};

    function palette() {
      var cs = getComputedStyle(root);
      pal.glow = cs.getPropertyValue("--glow").trim() || "#ECC77E";
      pal.soft = cs.getPropertyValue("--glow-soft").trim() || "#F2DCAB";
      pal.aqua = cs.getPropertyValue("--aqua").trim() || "#66E0ED";
      pal.aquaDeep = cs.getPropertyValue("--aqua-deep").trim() || "#21A8C7";
    }

    function resize() {
      var r = stage.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height); D = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
      ctx.setTransform(D, 0, 0, D, 0, 0);
    }

    function stageMetrics() {
      var sr = svg.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      return { left: sr.left - cr.left, top: sr.top - cr.top, scale: sr.width / VIEW };
    }
    function logicalToCanvas(p, s) { return { x: s.left + p.x * s.scale, y: s.top + p.y * s.scale }; }

    function liveCells(time, center, radius) {
      return CELLS.map(function (cell) {
        var breath = Math.sin(time * 1000 * cell.rate + cell.phase), drift = .012 * breath;
        var cellRadius = Math.sqrt(cell.rest.x * cell.rest.x + cell.rest.y * cell.rest.y);
        var spin = time * .058 + Math.sin(time * .21) * .30 / Math.max(.22, cellRadius);
        var ca = Math.cos(spin), sa = Math.sin(spin);
        var rx = cell.rest.x * ca - cell.rest.y * sa, ry = cell.rest.x * sa + cell.rest.y * ca;
        return { x: center.x + (rx + drift) * radius * .82, y: center.y + (ry - drift * .7) * radius * .82, r: cell.size * radius * (1 + breath * .10), cell: cell };
      });
    }

    function glow(x, y, r, c, a) {
      if (r <= 0) return;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(c, a)); g.addColorStop(.35, rgba(c, a * .22)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }

    function drawWell(L, center, reveal, time) {
      if (L.r < 5 || reveal <= .002) return;
      var cell = L.cell, base = cell.warm ? pal.glow : pal.aqua;
      var dx = center.x - L.x, dy = center.y - L.y, len = Math.sqrt(dx * dx + dy * dy);
      var vx = len < .001 ? Math.cos(cell.phase) : dx / len;
      var vy = len < .001 ? Math.sin(cell.phase) : dy / len;
      var px = -vy, py = vx;
      var rotation = Math.atan2(vy, vx) + Math.PI / 2 + Math.sin(time * .23 + cell.phase) * .035;
      var depthShift = L.r * (1.02 + .07 * Math.sin(time * .31 + cell.phase));
      glow(L.x, L.y, L.r * 1.15, base, reveal * .022);

      var rings = 22;
      for (var q = 0; q < rings; q++) {
        var d = q / (rings - 1), e = smootherstep(d);
        var rr = L.r * lerp(.98, .035, e);
        var lateral = Math.sin(time * .26 + cell.phase + d * 7.5) * L.r * .012 * e;
        var ox = vx * depthShift * e + px * lateral;
        var oy = vy * depthShift * e + py * lateral;
        var flatten = lerp(.98, .26, e);
        var alpha = reveal * lerp(.22, .055, e) * (1 + .12 * Math.sin(time * .44 + q * .55 + cell.phase));
        ctx.beginPath();
        ctx.ellipse(L.x + ox, L.y + oy, rr, rr * flatten, rotation, 0, TAU);
        ctx.strokeStyle = rgba(q % 5 === 0 ? pal.soft : base, alpha);
        ctx.lineWidth = q === 0 ? 1.05 : .56;
        ctx.stroke();
      }

      for (var arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        for (var s = 0; s <= 42; s++) {
          var u = s / 42, e2 = smootherstep(u);
          var rad = L.r * lerp(.88, .025, e2);
          var ang = cell.phase + arm * TAU / 4 + u * TAU * 2.15 + time * (cell.outward ? .16 : -.16);
          var cx = L.x + vx * depthShift * e2 + px * Math.sin(u * Math.PI) * L.r * .015;
          var cy = L.y + vy * depthShift * e2 + py * Math.sin(u * Math.PI) * L.r * .015;
          var x = cx + Math.cos(ang) * rad * .70, y = cy + Math.sin(ang) * rad * .46;
          if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = rgba(arm % 2 ? pal.aqua : pal.glow, reveal * .050);
        ctx.lineWidth = .52;
        ctx.stroke();
      }

      for (var n = 0; n < 3; n++) {
        var flow = (time * (.075 + cell.rate * 48) + n / 3 + cell.phase / TAU) % 1;
        if (!cell.outward) flow = 1 - flow;
        var e3 = smootherstep(flow), rad2 = L.r * lerp(.74, .03, e3), ang2 = cell.phase + n * TAU / 3 + flow * TAU * 1.2;
        var ax = L.x + vx * depthShift * e3, ay = L.y + vy * depthShift * e3;
        var fx = ax + Math.cos(ang2) * rad2 * .68, fy = ay + Math.sin(ang2) * rad2 * .44;
        var prev = clamp(flow - .08, 0, 1), ep = smootherstep(prev), prad = L.r * lerp(.74, .03, ep);
        var pang = cell.phase + n * TAU / 3 + prev * TAU * 1.2;
        var pax = L.x + vx * depthShift * ep, pay = L.y + vy * depthShift * ep;
        var px2 = pax + Math.cos(pang) * prad * .68, py2 = pay + Math.sin(pang) * prad * .44;
        ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(fx, fy);
        ctx.strokeStyle = rgba(cell.outward ? pal.glow : pal.aqua, reveal * .34); ctx.lineWidth = 1.0; ctx.stroke();
      }

      var deepX = L.x + vx * depthShift, deepY = L.y + vy * depthShift;
      glow(deepX, deepY, L.r * .18, base, reveal * .045);
    }

    function frame(now) {
      var dt = Math.min(40, now - last || 16); last = now;
      var k = reduce ? 1 : 1 - Math.exp(-dt / 360); current = lerp(current, target, k);
      ctx.clearRect(0, 0, W, H);
      if (visible) {
        var reveal = smoothstep((current - .50) / .38);
        if (reveal > .002) {
          var s = stageMetrics(), geom = geometry(current), center = logicalToCanvas({ x: geom.cx, y: geom.cy }, s);
          var radius = geom.radius * s.scale, time = now / 1000, live = liveCells(time, center, radius);
          live.forEach(function (L) { drawWell(L, center, reveal, time); });
        }
      }
      requestAnimationFrame(frame);
    }

    range.addEventListener("input", function () { target = clamp((+range.value || 0) / 100, 0, 1); }, { passive: true });
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(function (entries) { entries.forEach(function (entry) { visible = entry.isIntersecting; }); }, { rootMargin: "25% 0px 25% 0px", threshold: .01 }).observe(section);
    new MutationObserver(palette).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    palette(); resize(); requestAnimationFrame(frame);
  }

  function loadBase() {
    var existing = document.querySelector('script[data-why-membrane-base]');
    if (existing) {
      if (document.getElementById("we-field")) setupDepth();
      else existing.addEventListener("load", setupDepth, { once: true });
      return;
    }
    var base = document.createElement("script");
    base.src = BASE_SRC; base.async = false; base.dataset.whyMembraneBase = "true";
    base.addEventListener("load", setupDepth, { once: true }); document.head.appendChild(base);
  }

  loadBase();
})();
