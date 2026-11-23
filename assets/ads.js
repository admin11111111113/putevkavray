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
