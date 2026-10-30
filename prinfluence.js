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

  function sendWelcomeEmail(email) {
    return fetch("/.netlify/functions/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    }).catch(function (err) {
      // Don't block the signup UX if the welcome email fails to send —
      // the person is still subscribed; just log it for follow-up.
      console.error("Welcome email failed:", err);
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
        var emailVal = input.value.trim();

        saveSubscriber(emailVal)
          .then(function () {
            sendWelcomeEmail(emailVal);
            if (form.querySelector(".email-row")) form.querySelector(".email-row").style.display = "none";
            if (done) done.style.display = "flex";
          })
          .catch(function (err) {
            console.error("Subscriber save failed:", err);
            // Still show success to the visitor — don't block UX on a backend hiccup,
            // but log it so Prin can investigate if signups aren't showing up in Supabase.
            sendWelcomeEmail(emailVal);
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

  function escapeHtml(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatPostDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function estimateReadMins(content) {
    var words = (content || "").trim().split(/\s+/).length;
    return Math.max(2, Math.round(words / 200)) + " min read";
  }

  function renderComingSoonBlog() {
    var featuredSlot = document.getElementById("blog-featured-slot");
    var gridSlot = document.getElementById("blog-grid-slot");
    if (!featuredSlot || !gridSlot) return;
    featuredSlot.innerHTML =
      '<div class="blog-featured reveal" style="cursor:default;">' +
        '<div class="bf-img"><span class="coming-soon"><span class="cs-pill"><span class="spk">✦</span> Coming soon</span>' +
        '<span class="cs-sub">New posts dropping soon</span></span></div>' +
        '<div class="bf-body"><div class="bf-meta"><span>AI &amp; Content</span></div>' +
        '<h3>The first post is on its way</h3>' +
        '<p>Check back soon — new posts go up here every week.</p></div></div>';
    gridSlot.innerHTML = "";
  }

  function renderBlogPosts(posts) {
    var featuredSlot = document.getElementById("blog-featured-slot");
    var gridSlot = document.getElementById("blog-grid-slot");
    if (!featuredSlot || !gridSlot) return;

    if (!posts || posts.length === 0) {
      renderComingSoonBlog();
      return;
    }

    var featured = posts[0];
    var rest = posts.slice(1, 4);

    featuredSlot.innerHTML =
      '<a class="blog-featured reveal" href="blog-post.html?slug=' + encodeURIComponent(featured.slug) + '">' +
        '<div class="bf-img">' +
          (featured.cover_image ? '<img src="' + escapeHtml(featured.cover_image) + '" alt="" style="width:100%;height:100%;object-fit:cover;" />' : "") +
        '</div>' +
        '<div class="bf-body">' +
          '<div class="bf-meta"><span>' + escapeHtml(featured.category || "Blog") + '</span><span>' + estimateReadMins(featured.content) + '</span><span>' + formatPostDate(featured.published_at) + '</span></div>' +
          '<h3>' + escapeHtml(featured.title) + '</h3>' +
          '<p>' + escapeHtml(featured.excerpt || "") + '</p>' +
          '<span class="bf-link">Read the post <span class="arr">→</span></span>' +
        '</div>' +
      '</a>';

    gridSlot.innerHTML = rest.map(function (post, i) {
      var dClass = i === 0 ? "" : (i === 1 ? " d1" : " d2");
      return '<a class="blog-card reveal' + dClass + '" href="blog-post.html?slug=' + encodeURIComponent(post.slug) + '">' +
        '<div class="blog-thumb"><span class="blog-cat">' + escapeHtml(post.category || "Blog") + '</span>' +
        (post.cover_image ? '<img src="' + escapeHtml(post.cover_image) + '" alt="" style="width:100%;height:100%;object-fit:cover;" />' : "") +
        '</div>' +
        '<h4>' + escapeHtml(post.title) + '</h4>' +
        '<p>' + escapeHtml(post.excerpt || "") + '</p>' +
        '<div class="bc-meta">' + estimateReadMins(post.content) + '</div>' +
      '</a>';
    }).join("");
  }

  function initBlog() {
    var featuredSlot = document.getElementById("blog-featured-slot");
    if (!featuredSlot) return;

    fetch(SUPABASE_URL + "/rest/v1/blog_posts?status=eq.published&order=published_at.desc&limit=4", {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY
      }
    })
      .then(function (res) { return res.json(); })
      .then(function (posts) { renderBlogPosts(posts); })
      .catch(function (err) {
        console.error("Failed to load blog posts:", err);
        renderComingSoonBlog();
      });
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
    initBlog();
  });
})();
