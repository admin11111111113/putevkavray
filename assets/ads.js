// Реклама: 9 штук в 3 группах. На широком экране справа, группа меняется по мере прокрутки;
// на телефоне — 4 штуки вставляются между блоками страницы (а не в самом низу).
(function () {
  var rail = document.querySelector('.rail'); if (!rail) return;
  var groups = [].slice.call(rail.querySelectorAll('.ad-g'));
  if (matchMedia('(min-width:1180px)').matches) {
    var cur = 0;
    function upd() {
      var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
      var g = Math.min(groups.length - 1, Math.floor(p * groups.length * .999));
      if (g !== cur) { cur = g; groups.forEach(function (x, k) { x.classList.toggle('on', k === g); }); }
    }
    addEventListener('scroll', upd, { passive: true }); upd();
    return;
  }
  var main = document.querySelector('main'); if (!main) return;
  var ads = [].slice.call(rail.querySelectorAll('[data-m]')).sort(function (a, b) { return a.dataset.m - b.dataset.m; });
  var kids = [].slice.call(main.children).filter(function (x) { return x.matches('section.story, section.sec:not(.ai-sec), section.sunband'); });
  if (kids.length >= 3) {
    ads.forEach(function (a, k) { var box = document.createElement('div'); box.className = 'ad-in'; box.appendChild(a);
      var at = kids[Math.min(kids.length - 1, k)]; if (at.classList.contains('sunband') && at.nextElementSibling) at = at.nextElementSibling;
      at.parentNode.insertBefore(box, at.nextSibling); });
    rail.remove(); return;
  }
  var hs = [].slice.call(main.querySelectorAll('h2')).filter(function (h) { return !h.closest('.story,.sunband,.pass,.picker,.ai-sec,.hero,.photo-hero,.band,.ad-in'); });
  var n = hs.length;
  ads.forEach(function (a, k) {
    var box = document.createElement('div'); box.className = 'ad-in'; box.appendChild(a);
    var h = n ? hs[Math.min(n - 1, Math.floor((k + 1) * n / (ads.length + 1)))] : null;
    if (h && !h.previousElementSibling?.classList?.contains('ad-in')) h.parentNode.insertBefore(box, h); else main.appendChild(box);
  });
  rail.remove();
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
