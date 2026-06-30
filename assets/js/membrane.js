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

  // ---- Wire up -------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    var t = document.querySelector("[data-theme-toggle]");
    if (t) t.addEventListener("click", toggleTheme);
  });
})();
