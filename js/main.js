(function () {
  "use strict";

  // mobile nav toggle
  var toggle = document.getElementById("nav-toggle");
  var panel = document.getElementById("mobile-panel");

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // drop the will-change hint the moment each one-shot entrance animation
  // finishes -- it's only useful *during* the animation (promotes the
  // element to its own GPU layer so the blur doesn't cost main-thread
  // repaints), and leaving it on afterward just reserves GPU memory
  // for no reason.
  document.querySelectorAll(".entrance").forEach(function (el) {
    el.addEventListener("animationend", function () {
      el.style.willChange = "auto";
    }, { once: true });
  });

  // scroll-reveal (elements are marked with class="reveal" directly in HTML)
  var revealTargets = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // count-up stat numbers (e.g. "3,000+ Lines of Java")
  var countTargets = document.querySelectorAll(".count");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatCount(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    if (reduceMotion) {
      el.textContent = formatCount(target);
      return;
    }
    var duration = 3200;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // ease-in-out cubic -- spreads the visible counting across the whole
      // duration instead of front-loading it (which made small targets like
      // "2" look like they'd already finished almost immediately)
      var eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      el.textContent = formatCount(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (countTargets.length) {
    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      countTargets.forEach(function (el) { countObserver.observe(el); });
    } else {
      countTargets.forEach(function (el) { animateCount(el); });
    }
  }
})();
