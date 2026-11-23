// Плоская карта направлений: точки стран, линия перелёта из Москвы, погода сейчас (Open-Meteo, без ключа).
(function () {
  var wrap = document.getElementById('story'); if (!wrap) return;
  var box = wrap.querySelector('.map'), steps = [].slice.call(wrap.querySelectorAll('.st-step')), chips = [].slice.call(wrap.querySelectorAll('.st-chips button'));
  var NS = 'http://www.w3.org/2000/svg', L0 = -95, L1 = 128, T = 64, B = -30, K = 10, W = (L1 - L0) * K, H = (T - B) * K;
  var MOW = [55.75, 37.62], HOME = 'Москва';
  wrap.classList.add('live');
  function xy(lat, lon) { return [(lon - L0) * K, (T - lat) * K]; }
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Карта направлений с погодой' }, box);
  var gLand = el('g', { fill: '#2b4e86' }, svg), gRoute = el('g', {}, svg), gPts = el('g', {}, svg);
  fetch(wrap.dataset.land).then(function (r) { return r.json(); }).then(function (pts) {
    pts.forEach(function (p) { if (p[1] < L0 || p[1] > L1 || p[0] > T || p[0] < B) return; var c = xy(p[0], p[1]); el('circle', { cx: c[0], cy: c[1], r: 7 }, gLand); });
  });
  var m = xy(MOW[0], MOW[1]);
  var hc = el('circle', { cx: m[0], cy: m[1], r: 14, fill: '#FFC93C' }, gPts);
  var mt = el('text', { x: m[0] + 22, y: m[1] + 12, 'class': 'm-home' }, gPts); mt.textContent = HOME;
  function from(gen) { return 'из ' + gen; }
  document.addEventListener('put:city', function (e) {
    var c = (window.CITIES || {})[e.detail]; if (!c) return;
    HOME = e.detail; m = xy(c[2], c[3]); hc.setAttribute('cx', m[0]); hc.setAttribute('cy', m[1]);
    mt.setAttribute('x', m[0] + 22); mt.setAttribute('y', m[1] + 12); mt.textContent = HOME;
    steps.forEach(function (s) { var sm = s.querySelector('small'); if (sm) sm.textContent = sm.textContent.replace(/^.*?→/, HOME + ' →'); });
    pick(idx);
  });
  var route = el('path', { 'class': 'm-route', fill: 'none' }, gRoute);
  var pts = steps.map(function (s, i) {
    var c = xy(+s.dataset.lat, +s.dataset.lon);
    var g = el('g', { 'class': 'm-pt', transform: 'translate(' + c[0] + ',' + c[1] + ')', tabindex: 0 }, gPts);
    el('circle', { r: 26, 'class': 'm-pulse' }, g); el('circle', { r: 11, 'class': 'm-dot' }, g);
    var lb = el('text', { y: -30, 'class': 'm-lbl' }, g); lb.textContent = s.dataset.name;
    var ic = el('text', { x: 0, y: 60, 'class': 'm-ic' }, g);
    g.addEventListener('click', function () { if (idx === i) { var b = s.querySelector('[data-pick]'); if (b) b.click(); } else pick(i, true); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter') pick(i, true); });
    return { g: g, c: c, lb: lb, ic: ic, name: s.dataset.name };
  });
  var idx = -1, paused = false, timer;
  function pick(i, user) {
    idx = (i + steps.length) % steps.length;
    steps.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
    chips.forEach(function (c, k) { c.classList.toggle('on', k === idx); });
    pts.forEach(function (p, k) { p.g.classList.toggle('on', k === idx); });
    var p = pts[idx], mx = (m[0] + p.c[0]) / 2, my = Math.min(m[1], p.c[1]) - Math.abs(p.c[0] - m[0]) * .25 - 40;
    route.setAttribute('d', 'M' + m[0] + ',' + m[1] + ' Q' + mx + ',' + my + ' ' + p.c[0] + ',' + p.c[1]);
    route.style.animation = 'none'; route.getBoundingClientRect(); route.style.animation = '';
    var c = chips[idx]; if (c) { var q = c.parentNode; q.scrollTo({ left: c.offsetLeft - q.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' }); }
    if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: p.c[0] / W * box.scrollWidth - box.clientWidth / 2, behavior: 'smooth' });
    if (user) { paused = true; clearTimeout(timer); timer = setTimeout(function () { paused = false; }, 20000); }
  }
  chips.forEach(function (c, k) { c.addEventListener('click', function () { pick(k, true); }); });
  wrap.addEventListener('mouseenter', function () { paused = true; }); wrap.addEventListener('mouseleave', function () { paused = false; });
  var visible = false;
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(wrap);
  pick(0);
  setInterval(function () { if (visible && !paused && !document.hidden) pick(idx + 1); }, 4500);

  // Погода сейчас — одним запросом на все точки
  function icon(code, day) {
    if (code === 0) return day ? '☀️' : '🌙'; if (code <= 2) return day ? '🌤' : '🌙'; if (code === 3) return '☁️';
    if (code <= 48) return '🌫'; if (code <= 67 || (code >= 80 && code <= 82)) return '🌧'; if (code <= 77 || code === 85 || code === 86) return '❄️'; return '⛈';
  }
  var lat = steps.map(function (s) { return s.dataset.lat; }).join(','), lon = steps.map(function (s) { return s.dataset.lon; }).join(',');
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code,is_day&timezone=auto')
    .then(function (r) { return r.json(); }).then(function (arr) {
      if (!Array.isArray(arr)) arr = [arr];
      arr.forEach(function (w, i) {
        if (!w || !w.current) return;
        var t = Math.round(w.current.temperature_2m), s = (t > 0 ? '+' : '') + t + '°', ic = icon(w.current.weather_code, w.current.is_day);
        var hot = t >= 27 ? 'hot' : t >= 20 ? 'warm' : t >= 12 ? 'mild' : 'cold';
        pts[i].g.classList.add(hot); pts[i].lb.textContent = pts[i].name + ' ' + s;
        pts[i].ic.textContent = t >= 24 ? '🌴' : t <= 2 ? '❄️' : ic;
        var wEl = steps[i].querySelector('.st-wx'); if (wEl) { wEl.textContent = ic + ' сейчас ' + s; wEl.hidden = false; }
        var ch = chips[i]; if (ch) { var sp = document.createElement('em'); sp.textContent = ' ' + s; ch.appendChild(sp); }
      });
      wrap.classList.add('wx');
    }).catch(function () {});
})();

