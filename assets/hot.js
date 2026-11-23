// «Горящие»: ссылки на живые подборки горящих туров Level.Travel из выбранного города + погода сейчас.
(function () {
  var list = document.getElementById('hot'); if (!list) return;
  var HC = window.HOT_CITIES || {}, C = window.CITIES || {};
  var cityName = 'Москва';
  function d2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d2(d.getDate()) + '.' + d2(d.getMonth() + 1) + '.' + d.getFullYear(); }
  var MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var a = new Date(Date.now() + 2 * 864e5), b = new Date(Date.now() + 12 * 864e5);
  var win = document.querySelector('.hot-win'); if (win) win.textContent = 'вылет ' + a.getDate() + ' ' + MON[a.getMonth()] + ' – ' + b.getDate() + ' ' + MON[b.getMonth()];
  function wrapAff(url) { var P = window.PUT || {}; return P.marker && P.p ? 'https://tp.media/r?marker=' + P.marker + '&trs=605578&p=' + P.p + '&u=' + encodeURIComponent(url) : url; }
  function links() {
    var c = C[cityName] || C['Москва'], slug = HC[cityName];
    [].forEach.call(list.querySelectorAll('.tkt'), function (el) {
      var cc = el.dataset.cc, ex = el.dataset.ex, url;
      if (slug && ex) url = 'https://level.travel/explore/' + slug + '-Russia/' + ex + '/hot';
      else url = 'https://level.travel/search/' + c[0] + '-to-Any-' + cc + '-departure-' + fmt(new Date(Date.now() + 3 * 864e5)) + '-for-7-nights-2-adults-0-kids-1..5-stars';
      el.querySelector('.tkt-go').href = wrapAff(url);
      el.querySelector('.tkt-from').textContent = cityName;
    });
    [].forEach.call(document.querySelectorAll('.hot-city'), function (s) { s.textContent = cityName; });
  }
  document.addEventListener('put:city', function (e) { cityName = e.detail; links(); });
  links();
  var els = [].slice.call(list.querySelectorAll('.tkt'));
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + els.map(function (e) { return e.dataset.lat; }).join(',') + '&longitude=' + els.map(function (e) { return e.dataset.lon; }).join(',') + '&current=temperature_2m,weather_code&daily=temperature_2m_max&forecast_days=1&timezone=auto')
    .then(function (r) { return r.json(); }).then(function (arr) {
      if (!Array.isArray(arr)) arr = [arr];
      arr.forEach(function (w, i) {
        if (!w || !w.current) return; var t = Math.round(w.current.temperature_2m), mx = w.daily ? Math.round(w.daily.temperature_2m_max[0]) : t;
        var el = els[i].querySelector('.tkt-wx'); el.textContent = (mx >= 24 ? '🌴 ' : mx <= 5 ? '❄️ ' : '⛅ ') + 'днём ' + (mx > 0 ? '+' : '') + mx + '°';
        els[i].dataset.t = mx;
      });
      // самые тёплые — наверх
      els.sort(function (x, y) { return (+y.dataset.t || -99) - (+x.dataset.t || -99); }).forEach(function (e) { list.appendChild(e); });
    }).catch(function () {});
})();
