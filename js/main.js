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
    var duration = 1200;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
