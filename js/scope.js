(function () {
  "use strict";

  var canvas = document.getElementById("scope-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var LOGICAL_W = 850;
  var LOGICAL_H = 460;
  var TRAIL_SECONDS = 3.2;
  var SAMPLE_INTERVAL = 0.02;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var points = []; // { x, y, t }
  var elapsed = 0;
  var lastFrame = null;
  var lastSampleAt = 0;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid() {
    var cols = 10, rows = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= cols; i++) {
      var x = (LOGICAL_W / cols) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H); ctx.stroke();
    }
    for (var j = 0; j <= rows; j++) {
      var y = (LOGICAL_H / rows) * j;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath(); ctx.moveTo(LOGICAL_W / 2, 0); ctx.lineTo(LOGICAL_W / 2, LOGICAL_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, LOGICAL_H / 2); ctx.lineTo(LOGICAL_W, LOGICAL_H / 2); ctx.stroke();
  }

  // slowly-drifting frequency ratio so the figure never quite repeats
  function sample(t) {
    var cx = LOGICAL_W / 2;
    var cy = LOGICAL_H / 2;
    var ampX = LOGICAL_W * 0.36;
    var ampY = LOGICAL_H * 0.36;
    var fx = 3 + 0.7 * Math.sin(t * 0.05);
    var fy = 2 + 0.5 * Math.cos(t * 0.033);
    var phase = t * 0.09;
    return {
      x: cx + ampX * Math.sin(fx * t + phase),
      y: cy + ampY * Math.sin(fy * t),
      t: t
    };
  }

  function draw() {
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawGrid();
    if (points.length < 2) return;

    for (var i = 1; i < points.length; i++) {
      var age = elapsed - points[i].t;
      var alpha = Math.max(0, 1 - age / TRAIL_SECONDS);
      alpha = Math.pow(alpha, 1.4);
      if (alpha <= 0.01) continue;

      var freshness = Math.max(0, 1 - age / (TRAIL_SECONDS * 0.22));
      var r = Math.round(224 + (255 - 224) * freshness);
      var g = Math.round(164 + (235 - 164) * freshness);
      var b = Math.round(88 + (205 - 88) * freshness);

      ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + (alpha * 0.9).toFixed(3) + ")";
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }

    var last = points[points.length - 1];
    ctx.save();
    ctx.shadowColor = "#e0a458";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#f6d9a8";
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(ts) {
    if (lastFrame === null) lastFrame = ts;
    var dt = Math.min((ts - lastFrame) / 1000, 0.05);
    lastFrame = ts;
    elapsed += dt;

    if (elapsed - lastSampleAt >= SAMPLE_INTERVAL) {
      points.push(sample(elapsed));
      lastSampleAt = elapsed;
      var cutoff = elapsed - TRAIL_SECONDS;
      while (points.length && points[0].t < cutoff) points.shift();
    }

    draw();
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);

  if (reduceMotion) {
    for (var t = 0; t < TRAIL_SECONDS; t += SAMPLE_INTERVAL) points.push(sample(t));
    elapsed = TRAIL_SECONDS;
    draw();
  } else {
    requestAnimationFrame(frame);
  }
})();
