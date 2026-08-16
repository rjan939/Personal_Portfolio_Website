(function () {
  "use strict";

  var canvas = document.getElementById("control-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var slider = document.getElementById("setpoint-slider");

  var LOGICAL_W = 600;
  var LOGICAL_H = 320;
  var WINDOW_SECONDS = 6;

  // second-order plant driven by a PD-style controller, tuned for a
  // visibly underdamped response -- a couple of real decaying bounces
  // rather than a single clipped overshoot -- plus a hint of process
  // noise so it reads as a live signal, not a textbook curve.
  var Kp = 9;
  var Kd = 1.9;

  var pos = 0;
  var vel = 0;
  var setpoint = 0;
  var history = []; // { t, pos, setpoint }
  var elapsed = 0;
  var lastFrame = null;

  // ambient disturbance: even when nobody is touching the slider, the
  // controller occasionally gets a small nudge and visibly corrects for
  // it on its own -- real disturbance rejection, not just decoration.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastSliderValue = null;
  var nextDisturbanceAt = 4 + Math.random() * 2;

  function scheduleNextDisturbance() {
    nextDisturbanceAt = elapsed + 4.5 + Math.random() * 2.5;
  }

  function readSetpoint() {
    var v = parseFloat(slider.value); // -100..100
    if (lastSliderValue !== null && v !== lastSliderValue) {
      scheduleNextDisturbance(); // user is driving it manually -- don't fight them
    }
    lastSliderValue = v;
    setpoint = v / 100; // -1..1
  }

  function maybeDisturb() {
    if (reduceMotion) return;
    if (elapsed >= nextDisturbanceAt) {
      vel += (Math.random() * 2 - 1) * 0.75;
      scheduleNextDisturbance();
    }
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function step(dt) {
    var substeps = 4;
    var h = dt / substeps;
    for (var i = 0; i < substeps; i++) {
      var accel = Kp * (setpoint - pos) - Kd * vel;
      accel += (Math.random() * 2 - 1) * 0.12; // tiny process noise -- a live signal, not a perfect curve
      vel += accel * h;
      pos += vel * h;
    }
  }

  function pushSample() {
    history.push({ t: elapsed, pos: pos, setpoint: setpoint });
    var cutoff = elapsed - WINDOW_SECONDS;
    while (history.length && history[0].t < cutoff) history.shift();
  }

  function valueToY(v) {
    // value range -1.6..1.6 mapped to plot height, center line at mid --
    // wide enough to hold the worst-case overshoot from a full-range jump
    var padding = 28;
    var usable = LOGICAL_H - padding * 2;
    var clamped = Math.max(-1.6, Math.min(1.6, v));
    return padding + usable * (1 - (clamped + 1.6) / 3.2);
  }

  function timeToX(t) {
    var frac = (elapsed - t) / WINDOW_SECONDS; // 0 = now, 1 = oldest
    return LOGICAL_W - frac * LOGICAL_W;
  }

  function draw() {
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= LOGICAL_W; gx += LOGICAL_W / 8) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, LOGICAL_H);
      ctx.stroke();
    }
    for (var gy = 0; gy <= LOGICAL_H; gy += LOGICAL_H / 6) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(LOGICAL_W, gy);
      ctx.stroke();
    }

    // center line
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(0, valueToY(0));
    ctx.lineTo(LOGICAL_W, valueToY(0));
    ctx.stroke();

    if (history.length < 2) return;

    // setpoint trace (dashed)
    ctx.strokeStyle = "#6fb3c9";
    ctx.lineWidth = 1.75;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (var i = 0; i < history.length; i++) {
      var sx = timeToX(history[i].t);
      var sy = valueToY(history[i].setpoint);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // response trace (solid)
    ctx.strokeStyle = "#e0a458";
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    for (var j = 0; j < history.length; j++) {
      var rx = timeToX(history[j].t);
      var ry = valueToY(history[j].pos);
      if (j === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // leading marker
    var last = history[history.length - 1];
    ctx.fillStyle = "#e0a458";
    ctx.beginPath();
    ctx.arc(timeToX(last.t), valueToY(last.pos), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(ts) {
    if (!running) return;
    if (lastFrame === null) lastFrame = ts;
    var dt = Math.min((ts - lastFrame) / 1000, 0.05);
    lastFrame = ts;
    elapsed += dt;

    readSetpoint();
    maybeDisturb();
    step(dt);
    pushSample();
    draw();

    requestAnimationFrame(frame);
  }

  // pause the render loop entirely when the widget is scrolled off-screen
  // or the tab is backgrounded -- no reason to burn CPU/battery animating
  // something nobody can see, which is exactly what makes a page feel
  // laggy on lower-end machines.
  var running = false;
  var inViewport = false;

  function updateRunning() {
    var shouldRun = inViewport && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      lastFrame = null;
      requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
    }
  }

  resize();
  window.addEventListener("resize", resize);
  readSetpoint();
  pos = setpoint;

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      inViewport = entries[entries.length - 1].isIntersecting;
      updateRunning();
    }, { threshold: 0.01 });
    io.observe(canvas);
  } else {
    inViewport = true;
    updateRunning();
  }
  document.addEventListener("visibilitychange", updateRunning);
})();
