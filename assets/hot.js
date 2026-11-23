// Горящие туры: официальный блок Level.Travel (Travelpayouts) — реальные туры с датами и ценами
// из выбранного города вылета. Блоки грузятся, когда доходишь до них; где туров нет — блок прячется.
(function () {
  var slots = [].slice.call(document.querySelectorAll('.hw')); if (!slots.length) return;
  var C = window.CITIES || {};
  var W = 'https://tpembd.com/content?currency=rub&trs=605578&shmarker=810540&locale=ru&powered_by=false&min_lines=5&responsive=true&erid=2Vtzqx6JctP&promo_id=4098&campaign_id=26';
  function city() {
    var v; try { v = localStorage.getItem('put_city'); } catch (e) {}
    var i = document.querySelector('.st-from input, input[name="from"]'); if (i && C[i.value]) v = i.value;
    return C[v] ? v : 'Москва';
  }
  var cur = city(), gen = 0;
  function fill(s) {
    var c = C[cur] || C['Москва'], my = gen;
    s.hidden = false; s.dataset.state = 'load';
    s.innerHTML = '<div class="hw-load">Ищем туры из ' + cur + ' — ' + s.dataset.name + '…</div>';
    var sc = document.createElement('script'); sc.async = true; sc.charset = 'utf-8';
    sc.src = W + '&origin_iata=' + c[1] + '&destination_iata=' + s.dataset.cc; s.appendChild(sc);
    var n = 0, t = setInterval(function () {
      if (my !== gen) return clearInterval(t);
      var host = s.querySelector('tp-cascoon'), txt = host && host.shadowRoot ? host.shadowRoot.textContent : '';
      if (/проверенного оператора/.test(txt) || ++n > 50) { clearInterval(t); s.dataset.state = 'none'; s.hidden = true; done(); }
      else if (/Показать тур/.test(txt)) { clearInterval(t); s.dataset.state = 'ok'; var l = s.querySelector('.hw-load'); if (l) l.remove(); done(); }
    }, 400);
  }
  function done() {
    var empty = document.querySelector('.hw-empty'); if (!empty) return;
    var all = slots.every(function (s) { return s.dataset.state === 'none'; });
    empty.hidden = !all; empty.querySelectorAll('.hot-city').forEach(function (e) { e.textContent = cur; });
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && !e.target.dataset.state) { io.unobserve(e.target); fill(e.target); } });
  }, { rootMargin: '600px 0px' }) : null;
  function start() {
    gen++; cur = city();
    [].forEach.call(document.querySelectorAll('.hot-city'), function (e) { e.textContent = cur; });
    slots.forEach(function (s) { delete s.dataset.state; s.innerHTML = ''; s.hidden = false; if (io) io.observe(s); else fill(s); });
  }
  document.addEventListener('put:city', function () { setTimeout(start, 50); });
  start();
})();
