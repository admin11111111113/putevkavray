// Реклама: 9 штук в 3 группах. На широком экране справа, группа меняется по мере прокрутки;
// на телефоне — 4 штуки вставляются между блоками страницы (а не в самом низу).
// Пул: в каждом месте случайный вариант, без повторов на странице.
(function () {
  var tpl = document.getElementById('adpool'); if (!tpl) return;
  var pool = [].slice.call(tpl.content.children);
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  var by = { calc: [], wa: [], vr: [], op: [], en: [] };
  shuffle(pool).forEach(function (n) { by[n.dataset.b].push(n); });
  function take(b) { return by[b].length ? by[b].shift() : null; }
  var g = [].slice.call(document.querySelectorAll('.rail .ad-g'));
  var plan = [['wa', 'calc', 'en'], ['vr', 'wa', 'op'], ['en', 'wa', 'vr', 'op', 'wa']];
  g.forEach(function (box, k) { (plan[k] || []).forEach(function (b) { var n = take(b); if (n) box.appendChild(n.cloneNode(true)); }); });
  // широкая полоса: один вариант из оставшихся
  // на компьютере вся реклама — только в колонке справа, полосы посреди страницы убираем
  [].forEach.call(document.querySelectorAll('.ad-wide[data-auto]'), function (w) {
    var m = document.querySelector('main'), pw = m && m.querySelector('.pass-wrap');
    if (pw) pw.parentNode.insertBefore(w, pw.nextSibling); else if (m) m.insertBefore(w, m.firstChild);
  });
  [].forEach.call(document.querySelectorAll('.ad-wide'), function (w, k) {
    var n = take(k % 2 ? 'op' : 'vr') || take('wa'); if (!n) return;
    n = n.cloneNode(true); n.classList.add('wide'); w.appendChild(n);
  });
})();
(function () {
  var rail = document.querySelector('.rail'); if (!rail) return;
  var groups = [].slice.call(rail.querySelectorAll('.ad-g'));
  inline(); {
    // колонка справа на всю длину страницы: все объявления подряд, листаются вместе с сайтом
    var inn = rail.querySelector('.rail-in'), cards = [].slice.call(rail.querySelectorAll('.ad-g > *'));
    cards.forEach(function (c) { inn.appendChild(c); }); groups.forEach(function (g) { g.remove(); });
    rail.classList.add('col');
    var home = rail.classList.contains('home-rail'), mainEl = document.querySelector('main'), foot = document.querySelector('footer');
    // как на «Опоре»: колонка 200px закреплена справа (position:fixed), сайт сужен, объявления медленно листаются; наведение — пауза
    rail.classList.add('fix'); document.body.classList.add('with-col'); document.body.appendChild(rail);
    var y = 0, dir = 1, hold = 0, over = false, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.addEventListener('mouseenter', function () { over = true; }); rail.addEventListener('mouseleave', function () { over = false; y = rail.scrollTop; });
    function tick() {
      var max = rail.scrollHeight - rail.clientHeight;
      if (!still && !over && max > 4 && !document.hidden && getComputedStyle(rail).position === 'fixed') {
        if (hold > 0) hold--; else { y += dir * 0.35; if (y >= max) { y = max; dir = -1; hold = 180; } else if (y <= 0) { y = 0; dir = 1; hold = 180; } rail.scrollTop = y; }
      }
      requestAnimationFrame(tick);
    }
    setTimeout(function () { hold = 120; requestAnimationFrame(tick); }, 1500);
    return;
  }
  function inline() {
  var main = document.querySelector('main'); if (!main) return;
  var ads = [].slice.call(rail.querySelectorAll('.ad-g .sad')).slice(0, 5).map(function (a) { return a.cloneNode(true); });
  var kids = [].slice.call(main.children).filter(function (x) { return x.matches('section.story, section.sec:not(.ai-sec), section.sunband'); });
  if (kids.length >= 3) {
    ads.forEach(function (a, k) { var box = document.createElement('div'); box.className = 'ad-in'; box.appendChild(a);
      var at = kids[Math.min(kids.length - 1, k)]; if (at.classList.contains('sunband') && at.nextElementSibling) at = at.nextElementSibling;
      at.parentNode.insertBefore(box, at.nextSibling); });
    return;
  }
  var hs = [].slice.call(main.querySelectorAll('h2')).filter(function (h) { return !h.closest('.story,.sunband,.pass,.picker,.ai-sec,.hero,.photo-hero,.band,.ad-in'); });
  var n = hs.length;
  ads.forEach(function (a, k) {
    var box = document.createElement('div'); box.className = 'ad-in'; box.appendChild(a);
    var h = n ? hs[Math.min(n - 1, Math.floor((k + 1) * n / (ads.length + 1)))] : null;
    if (h && !h.previousElementSibling?.classList?.contains('ad-in')) h.parentNode.insertBefore(box, h); else main.appendChild(box);
  });
  }
})();
// Калькулятор дохода Workadult в рекламе: формула как на workadult.pro (часы × 5 дней × 4.3 нед × $9 × опыт).
(function () {
  [].forEach.call(document.querySelectorAll('.wa-calc'), function (c) {
    var r = c.querySelector('.wc-r'), h = c.querySelector('.wc-h'), sum = c.querySelector('.wc-sum'), bar = c.querySelector('.wc-bar span'), exp = 1, shown = 0, touched = false;
    function target() { return Math.round(+r.value * 5 * 4.3 * 9 * exp / 50) * 50; }
    function tick() {
      var t = target(); shown += (t - shown) * .18; if (Math.abs(t - shown) < 5) shown = t;
      sum.textContent = '$' + Math.round(shown).toLocaleString('ru-RU'); h.textContent = r.value;
      bar.style.width = Math.min(100, shown / 4300 * 100) + '%';
      if (shown !== t) requestAnimationFrame(tick);
    }
    function go() { requestAnimationFrame(tick); }
    r.addEventListener('input', function () { touched = true; go(); });
    [].forEach.call(c.querySelectorAll('.wc-exp button'), function (b) {
      b.addEventListener('click', function () { touched = true; exp = +b.dataset.e; [].forEach.call(c.querySelectorAll('.wc-exp button'), function (x) { x.classList.toggle('on', x === b); }); go(); });
    });
    // демо: пока не трогали — ползунок сам ходит 3→9 часов, сумма считается вживую
    var dir = 1;
    setInterval(function () { if (touched || document.hidden) return; var v = +r.value + dir; if (v > 9 || v < 3) { dir = -dir; v = +r.value + dir; } r.value = v; go(); }, 1100);
    go();
  });
})();
