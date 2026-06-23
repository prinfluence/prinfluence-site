/* PRINFLUENCE — shared interactions: nav scroll state, mobile drawer,
   reveal-on-scroll, and small per-page helpers. Vanilla, no deps. */
(function () {
  "use strict";

  // --- Nav scroll state ---
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // --- Mobile drawer ---
  function initDrawer() {
    var btn = document.querySelector(".menu-btn");
    var drawer = document.querySelector(".drawer");
    if (!btn || !drawer) return;
    var close = drawer.querySelector(".close");
    var open = function () { drawer.classList.add("open"); document.body.style.overflow = "hidden"; };
    var shut = function () { drawer.classList.remove("open"); document.body.style.overflow = ""; };
    btn.addEventListener("click", open);
    if (close) close.addEventListener("click", shut);
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", shut); });
  }

  // --- Reveal on scroll ---
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  // --- FAQ accordion ---
  function initFaq() {
    document.querySelectorAll("[data-faq]").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      if (!q) return;
      q.addEventListener("click", function () {
        var open = item.classList.contains("open");
        item.classList.toggle("open", !open);
      });
    });
  }

  // --- Email capture (saves to Supabase so Prin can see every signup) ---
  var SUPABASE_URL = "https://xavhjbcmqgoznuggzpep.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_oKv6t4MSb9mG8ggGedTwyQ_ZO3WeNEr";

  function saveSubscriber(email) {
    return fetch(SUPABASE_URL + "/rest/v1/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        email: email,
        source: "resources_page",
        page_url: window.location.href
      })
    });
  }

  function initEmailForms() {
    document.querySelectorAll("[data-email-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input[type=email]");
        var done = form.querySelector("[data-email-done]");
        var btn = form.querySelector("button[type=submit]");
        if (!input || !input.value) return;

        if (btn) { btn.disabled = true; btn.textContent = "Submitting..."; }

        saveSubscriber(input.value.trim())
          .then(function () {
            if (form.querySelector(".email-row")) form.querySelector(".email-row").style.display = "none";
            if (done) done.style.display = "flex";
          })
          .catch(function (err) {
            console.error("Subscriber save failed:", err);
            // Still show success to the visitor — don't block UX on a backend hiccup,
            // but log it so Prin can investigate if signups aren't showing up in Supabase.
            if (form.querySelector(".email-row")) form.querySelector(".email-row").style.display = "none";
            if (done) done.style.display = "flex";
          })
          .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = "Subscribe"; }
          });
      });
    });
  }

  // --- Spinning word rotator ---
  function initRotators() {
    document.querySelectorAll("[data-rotator]").forEach(function (el) {
      var words = (el.getAttribute("data-words") || "").split("|")
        .map(function (s) { return s.trim(); }).filter(Boolean);
      if (words.length < 2) return;
      var i = 0;
      el.innerHTML = '<span class="rot-word rot-in">' + words[0] + "</span>";
      setInterval(function () {
        var cur = el.querySelector(".rot-word:not(.rot-out)");
        i = (i + 1) % words.length;
        var next = document.createElement("span");
        next.className = "rot-word rot-in";
        next.textContent = words[i];
        if (cur) { cur.classList.remove("rot-in"); cur.classList.add("rot-out"); }
        el.appendChild(next);
        setTimeout(function () { if (cur && cur.parentNode) cur.parentNode.removeChild(cur); }, 620);
      }, 2300);
    });
  }

  // --- Animated counters ---
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var dur = 1500, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(animateCount); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    initNav();
    initDrawer();
    initReveal();
    initFaq();
    initEmailForms();
    initRotators();
    initCounters();
  });
})();
