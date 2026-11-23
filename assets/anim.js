document.documentElement.classList.add('js');
// Появление при прокрутке + лента арок тянется мышью/колесом. Уважает prefers-reduced-motion.
(function () {
  var els = document.querySelectorAll('.rv, .landing');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e, i) { if (!e.style.getPropertyValue('--i')) e.style.setProperty('--i', i % 6); io.observe(e); });
  document.querySelectorAll('.arches').forEach(function (s) {
    s.addEventListener('wheel', function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && s.scrollWidth > s.clientWidth) {
      var max = s.scrollWidth - s.clientWidth; if ((e.deltaY > 0 && s.scrollLeft < max - 2) || (e.deltaY < 0 && s.scrollLeft > 2)) { s.scrollLeft += e.deltaY; e.preventDefault(); } } }, { passive: false });
  });
})();

// иллюминатор: прогресс прокрутки секции → переменная --p (0..1)
(function () {
  var s = document.getElementById('takeoff'); if (!s) return;
  function f() { var r = s.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); s.style.setProperty('--p', p.toFixed(3)); }
  addEventListener('scroll', f, { passive: true }); f();
})();
(function () { function f() { document.body.classList.toggle('scrolled', scrollY > innerHeight * .55); } addEventListener('scroll', f, { passive: true }); f(); })();
