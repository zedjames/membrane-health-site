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

  // ---- Wire up -------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initLightbox();
    var t = document.querySelector("[data-theme-toggle]");
    if (t) t.addEventListener("click", toggleTheme);
  });
})();
