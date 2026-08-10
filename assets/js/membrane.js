/* Membrane Health — site interactions. Minimal, dependency-free.
   1) Reveal-on-scroll (honors prefers-reduced-motion).
   2) Light/dark toggle (the night ⇄ cream mirror), persisted. */
(function () {
  "use strict";

  // ---- Theme: night (default) ⇄ cream mirror ------------------------------
  var root = document.documentElement;
  var KEY = "membrane-theme";
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light") root.setAttribute("data-theme", "light");
  } catch (e) {}

  function toggleTheme() {
    var isLight = root.getAttribute("data-theme") === "light";
    if (isLight) { root.removeAttribute("data-theme"); persist("dark"); }
    else { root.setAttribute("data-theme", "light"); persist("light"); }
  }
  function persist(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // ---- Reveal-on-scroll ----------------------------------------------------
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---- Lightbox: click any screenshot to view it full-size -----------------
  function initLightbox() {
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var lbImg = lb.querySelector("img");
    var lastFocus = null;

    function visibleImg(frame) {
      var imgs = frame.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].offsetParent !== null) return imgs[i]; // the variant actually displayed
      }
      return imgs[0] || null;
    }
    function open(img) {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lastFocus = document.activeElement;
      var btn = lb.querySelector(".lightbox__close");
      if (btn) btn.focus();
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      if (!e.target || !e.target.closest) return;
      var frame = e.target.closest(".device__frame");
      if (frame && !lb.contains(frame)) {
        var img = visibleImg(frame);
        if (img) { e.preventDefault(); open(img); }
        return;
      }
      if (e.target.closest(".lightbox")) close(); // background, image, or × button
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) close();
    });
  }

  // ---- Waitlist: subscribe via our Cloudflare Worker (no CAPTCHA) ----------
  // The Worker calls the Buttondown API server-side (skipping Turnstile) and
  // returns JSON we can read, so we can show a real success or a real error.
  function initWaitlist() {
    var form = document.getElementById("waitlist");
    if (!form) return;
    var done = document.getElementById("waitlist-done");
    var hint = form.querySelector(".waitlist__hint");
    var sent = false;
    if (done) done.hidden = true; // never reveal the success box until we actually succeed

    function showDone() {
      if (hint) hint.hidden = true;
      form.hidden = true;
      if (done) {
        done.hidden = false;
        if (done.focus) done.focus();
      }
    }
    function showHint(msg) {
      if (done) done.hidden = true;
      if (!hint) return;
      hint.textContent = msg;
      hint.hidden = false;
    }

    // The submit event only fires once the browser's own email validation passes.
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: a bot fills this; pretend success and send nothing.
      var hp = form.querySelector(".waitlist__hp");
      if (hp && hp.value) { showDone(); return; }
      if (sent) return;
      sent = true;
      if (hint) hint.hidden = true;

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Adding you…"; }
      function reset() {
        sent = false;
        if (btn) { btn.disabled = false; btn.textContent = "Notify me at launch"; }
      }

      var email = (form.querySelector("#wl-email") || {}).value || "";
      // form-encoded keeps this a "simple" request — no CORS preflight.
      var body = new URLSearchParams({ email: email });

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.ok) { showDone(); }
          else {
            if (data && (data.detail || data.status)) {
              console.warn("waitlist: upstream", data.status || "", data.detail || "");
            }
            reset();
            showHint("Hmm — that didn't go through. Try again, or a different email.");
          }
        })
        .catch(function () {
          reset();
          showHint("Couldn't reach the server — check your connection and try again.");
        });
    });
  }

  // ---- Auto-update cited corpus stats from the published attestation --------
  // Same-origin /attestation.json (published by the verification workflow) → keeps
  // the cited line/theorem counts current as the corpus grows. Static values in the
  // HTML remain if the file isn't there yet.
  function initAttest() {
    var nodes = document.querySelectorAll("[data-attest]");
    if (!nodes.length) return;
    fetch("attestation.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (a) {
        if (!a || !a.corpus || !a.invariants) return;
        var c = a.corpus, inv = a.invariants;
        function fmt(k) {
          if (k === "lines") return Math.floor(c.lines / 10000) * 10 + "K+";
          if (k === "theorems") return (Math.floor(c.theorems_plus_lemmas / 1000) * 1000).toLocaleString("en-US") + "+";
          if (k === "theorems-plain") return (Math.floor(c.theorems_plus_lemmas / 1000) * 1000).toLocaleString("en-US");
          if (k === "files") return c.files.toLocaleString("en-US");
          if (k === "axioms") return String(inv.project_axioms);
          if (k === "digest") return (a.digest && a.digest.root) || "";
          return null;
        }
        nodes.forEach(function (el) {
          var v = fmt(el.getAttribute("data-attest"));
          if (v != null) el.textContent = v;
        });
      })
      .catch(function () { /* no attestation yet — keep the static values */ });
  }

  // ---- Homepage living world -----------------------------------------------
  function initHomeWorld() {
    // The homepage owns both markers; inner pages do not. Load the connective
    // world only there so the rest of the site keeps the shared runtime lean.
    if (!document.getElementById("top") || !document.getElementById("wedge")) return;
    if (document.querySelector('script[data-home-world]')) return;
    var s = document.createElement("script");
    s.src = "assets/js/home-world.js?v=1";
    s.defer = true;
    s.dataset.homeWorld = "true";
    document.head.appendChild(s);
  }

  // ---- Wire up -------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initLightbox();
    initWaitlist();
    initAttest();
    initHomeWorld();
    var t = document.querySelector("[data-theme-toggle]");
    if (t) t.addEventListener("click", toggleTheme);
  });
})();
