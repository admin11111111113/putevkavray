// Плоская карта мира «как на эмблеме ООН»: вид сверху на Северный полюс (азимутальная проекция).
// Твой город снизу, линия показывает, куда лететь; страны по очереди, «Откуда → Куда» над картой.
(function () {
  var wrap = document.getElementById('story'); if (!wrap) return;
  wrap.classList.add('live');
  var canvas = wrap.querySelector('canvas'), ctx = canvas.getContext('2d');
  var steps = [].slice.call(wrap.querySelectorAll('.st-step')), chips = [].slice.call(wrap.querySelectorAll('.st-chips button'));
  var sel = wrap.querySelector('.st-to'), go = wrap.querySelector('.st-go');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, t0 = performance.now(), DUR = 5200, paused = false, pauseT;
  var HOME = [55.75, 37.62], HOME_NAME = 'Москва', temps = [];
  var D = steps.map(function (s) { return { lat: +s.dataset.lat, lon: +s.dataset.lon, name: s.dataset.name }; });

  function show(i, user) {
    idx = (i + steps.length) % steps.length; t0 = performance.now();
    steps.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
    chips.forEach(function (c, k) { c.classList.toggle('on', k === idx); });
    if (sel) sel.value = idx;
    if (go) { go.dataset.pick = steps[idx].dataset.cc; }
    var c = chips[idx]; if (c) { var p = c.parentNode; p.scrollTo({ left: c.offsetLeft - p.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' }); }
    if (user) { paused = true; clearTimeout(pauseT); pauseT = setTimeout(function () { paused = false; }, 20000); }
  }
  chips.forEach(function (c, k) { c.addEventListener('click', function () { show(k, true); }); });
  if (sel) sel.addEventListener('change', function () { show(+sel.value, true); });
  canvas.addEventListener('mouseenter', function () { paused = true; }); canvas.addEventListener('mouseleave', function () { paused = false; });
  show(0);

  // погода сейчас
  function icon(code) { if (code === 0) return '☀️'; if (code <= 2) return '🌤'; if (code === 3) return '☁️'; if (code <= 48) return '🌫'; if (code <= 67 || (code >= 80 && code <= 82)) return '🌧'; if (code <= 77 || code === 85 || code === 86) return '❄️'; return '⛈'; }
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + D.map(function (d) { return d.lat; }).join(',') + '&longitude=' + D.map(function (d) { return d.lon; }).join(',') + '&current=temperature_2m,weather_code&timezone=auto')
    .then(function (r) { return r.json(); }).then(function (arr) {
      if (!Array.isArray(arr)) arr = [arr];
      arr.forEach(function (w, i) {
        if (!w || !w.current) return; var t = Math.round(w.current.temperature_2m), s = (t > 0 ? '+' : '') + t + '°'; temps[i] = s;
        var e = steps[i].querySelector('.st-wx'); if (e) { e.textContent = (t >= 24 ? '🌴' : icon(w.current.weather_code)) + ' сейчас ' + s; e.hidden = false; }
        if (chips[i]) { var em = document.createElement('em'); em.textContent = ' ' + s; chips[i].appendChild(em); }
      });
      dirty = true;
    }).catch(function () {});

  // проекция: полюс в центре, долгота твоего города смотрит вниз
  var W, H, cx, cy, R, dpr, rot = HOME[1], rotTo = HOME[1], land = [], base = document.createElement('canvas'), dirty = true;
  function P(lat, lon) { var r = (90 - lat) / 150 * R, a = (lon - rot) * Math.PI / 180; return [cx + r * Math.sin(a), cy + r * Math.cos(a)]; }
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return;
    canvas.width = base.width = W * dpr; canvas.height = base.height = H * dpr;
    cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 6; dirty = true;
  }
  addEventListener('resize', size); size();
  fetch(wrap.dataset.land).then(function (r) { return r.json(); }).then(function (pts) { land = pts.filter(function (p) { return p[0] > -60; }); dirty = true; });

  function drawBase() {
    var b = base.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0); b.clearRect(0, 0, W, H);
    var g = b.createRadialGradient(cx, cy, R * .1, cx, cy, R); g.addColorStop(0, '#1d4a86'); g.addColorStop(1, '#10284d');
    b.fillStyle = g; b.beginPath(); b.arc(cx, cy, R, 0, 7); b.fill();
    b.strokeStyle = 'rgba(160,200,255,.16)'; b.lineWidth = 1;
    [60, 30, 0, -30].forEach(function (lat) { b.beginPath(); b.arc(cx, cy, (90 - lat) / 150 * R, 0, 7); b.stroke(); });
    for (var lon = 0; lon < 360; lon += 30) { var e = P(-60, lon); b.beginPath(); b.moveTo(cx, cy); b.lineTo(e[0], e[1]); b.stroke(); }
    b.strokeStyle = 'rgba(160,200,255,.5)'; b.lineWidth = 2; b.beginPath(); b.arc(cx, cy, R, 0, 7); b.stroke();
    b.fillStyle = 'rgba(205,235,255,.82)'; var rr = Math.max(1.3, R / 230);
    land.forEach(function (p) { var q = P(p[0], p[1]); b.beginPath(); b.arc(q[0], q[1], rr, 0, 7); b.fill(); });
    b.fillStyle = '#00C2B8';
    D.forEach(function (d) { var q = P(d.lat, d.lon); b.beginPath(); b.arc(q[0], q[1], 3.5, 0, 7); b.fill(); });
    dirty = false;
  }
  function curve() {
    var a = P(HOME[0], HOME[1]), b = P(D[idx].lat, D[idx].lon), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, k = Math.min(.35 * L, 120);
    return [a, [mx - dy / L * k, my + dx / L * k], b];
  }
  function at(c, t) { var u = 1 - t; return [u * u * c[0][0] + 2 * u * t * c[1][0] + t * t * c[2][0], u * u * c[0][1] + 2 * u * t * c[1][1] + t * t * c[2][1]]; }
  function pill(x, y, text, bg, fg, up) {
    ctx.font = '600 13px Onest, sans-serif'; var w = ctx.measureText(text).width + 16, h = 24, X = Math.min(Math.max(x - w / 2, 4), W - w - 4), Y = up ? y - h - 10 : y + 10;
    ctx.fillStyle = bg; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(X, Y, w, h, 12); else ctx.rect(X, Y, w, h); ctx.fill();
    ctx.fillStyle = fg; ctx.fillText(text, X + 8, Y + 16);
  }

  document.addEventListener('put:city', function (e) {
    var c = (window.CITIES || {})[e.detail]; if (!c) return;
    HOME = [c[2], c[3]]; HOME_NAME = e.detail; rotTo = HOME[1]; t0 = performance.now();
    steps.forEach(function (s) { var sm = s.querySelector('small'); if (sm) sm.textContent = sm.textContent.replace(/^.*?→/, HOME_NAME + ' →'); });
  });
  canvas.addEventListener('click', function (e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 18;
    D.forEach(function (d, k) { var q = P(d.lat, d.lon), dd = Math.hypot(q[0] - x, q[1] - y); if (dd < bd) { bd = dd; best = k; } });
    if (best >= 0) show(best, true);
  });

  var visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(wrap);
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || !W) return;
    var k = (now - t0) / DUR;
    if (k >= 1 && !paused) { show(idx + 1); k = 0; }
    var dr = rotTo - rot; dr = ((dr + 540) % 360) - 180;
    if (Math.abs(dr) > .05) { rot += reduce ? dr : dr * .08; dirty = true; } else rot = rotTo;
    if (dirty) drawBase();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(base, 0, 0, W, H);
    var c = curve(), t = reduce ? 1 : Math.min(1, Math.max(0, (Math.min(k, 1) - .05) * 1.8));
    // маршрут
    ctx.strokeStyle = 'rgba(255,201,60,.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); ctx.quadraticCurveTo(c[1][0], c[1][1], c[2][0], c[2][1]); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#FFC93C'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]);
    for (var s = 1; s <= 40; s++) { var q = at(c, t * s / 40); ctx.lineTo(q[0], q[1]); } ctx.stroke();
    // город вылета
    ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.arc(c[0][0], c[0][1], 6, 0, 7); ctx.fill();
    // страна: пульс
    var pr = 6 + 10 * ((now / 1400) % 1);
    ctx.strokeStyle = 'rgba(0,194,184,' + (1 - (now / 1400) % 1) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c[2][0], c[2][1], pr, 0, 7); ctx.stroke();
    ctx.fillStyle = '#00E0D3'; ctx.beginPath(); ctx.arc(c[2][0], c[2][1], 6, 0, 7); ctx.fill();
    // самолёт
    if (t > 0 && t < 1) {
      var p1 = at(c, t), p2 = at(c, Math.min(1, t + .02));
      ctx.save(); ctx.translate(p1[0], p1[1]); ctx.rotate(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -6); ctx.lineTo(-4, 0); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    var up = c[2][1] < c[0][1];
    pill(c[0][0], c[0][1], HOME_NAME, '#FFC93C', '#0F2340', !up);
    pill(c[2][0], c[2][1], D[idx].name + (temps[idx] ? ' ' + temps[idx] : ''), '#fff', '#0F2340', up);
  })(performance.now());
})();
