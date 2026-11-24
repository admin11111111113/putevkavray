var IATA_FROM = {'Moscow-RU':'MOW','Saint_Petersburg-RU':'LED','Kazan-RU':'KZN','Yekaterinburg-RU':'SVX','Novosibirsk-RU':'OVB','Krasnodar-RU':'KRR','Samara-RU':'KUF','Ufa-RU':'UFA'};
var IATA_TO = {DO:'PUJ',MX:'CUN',SC:'SEZ',MU:'MRU',JO:'AQJ',MY:'LGK',GE:'BUS',AM:'EVN',AB:'AER',RU:'AER',IL:'TLV',ME:'TIV',RS:'BEG',CY:'LCA',GR:'HER',UZ:'SKD',QA:'DOH',TR:'AYT',EG:'HRG',AE:'DXB',TH:'HKT',VN:'CXR',MV:'MLE',LK:'CMB',CU:'VRA',CN:'SYX',ID:'DPS',IN:'GOI',TN:'NBE',TZ:'ZNZ'};
document.addEventListener('click', function (e) {
  var b = e.target.closest('.tabs button'); if (!b) return;
  var f = b.parentNode.nextElementSibling; f.dataset.mode = b.dataset.mode;
  [].forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); });
  f.querySelector('.pass-stub .btn').textContent = b.dataset.mode === 'avia' ? 'Найти билеты' : 'Найти туры';
});
// Поиск туров: собираем ссылку поиска Level.Travel и (если есть маркер) оборачиваем в партнёрскую ссылку Travelpayouts.
function cityOf(f) {
  var C = window.CITIES || {}, v = (f.from.value || '').trim().toLowerCase();
  for (var k in C) if (k.toLowerCase() === v) return C[k];
  for (var k2 in C) if (k2.toLowerCase().indexOf(v) === 0 && v) return C[k2];
  return null;
}
function putSearch(f) {
  var city = cityOf(f);
  if (!city) { f.from.setCustomValidity('Выбери город из списка'); f.from.reportValidity(); setTimeout(function () { f.from.setCustomValidity(''); }, 2000); return false; }
  var d = f.date.value.split('-'); // yyyy-mm-dd
  if (f.dataset.mode === 'avia') {
    var to = IATA_TO[f.to.value] || 'AYT';
    window.open('https://www.aviasales.ru/search/' + city[1] + d[2] + d[1] + to + f.adults.value, '_blank', 'noopener');
    return false;
  }
  var date = d[2] + '.' + d[1] + '.' + d[0];
  var url = 'https://level.travel/search/' + city[0] + '-to-Any-' + f.to.value + '-departure-' + date +
    '-for-' + f.nights.value + '-nights-' + f.adults.value + '-adults-0-kids-1..5-stars';
  var P = window.PUT || {};
  if (P.marker && P.p) url = 'https://tp.media/r?marker=' + P.marker + '&trs=605578&p=' + P.p + '&u=' + encodeURIComponent(url);
  window.open(url, '_blank', 'noopener');
  return false;
}

// Город вылета: сохранённый выбор → определение по IP (Worker /geo, ближайший город из списка) → Москва.
(function () {
  var C = window.CITIES || {};
  function near(lat, lon) { var best = 'Москва', bd = 1e9; for (var k in C) { var d = Math.pow(C[k][2] - lat, 2) + Math.pow((C[k][3] - lon) * Math.cos(lat * Math.PI / 180), 2); if (d < bd) { bd = d; best = k; } } return bd < 30 ? best : 'Москва'; }
  function setCity(name, save) {
    if (!C[name]) return;
    [].forEach.call(document.querySelectorAll('input[name="from"], .st-from input'), function (i) { if (i.value !== name) i.value = name; });
    if (save) try { localStorage.setItem('put_city', name); } catch (e) {}
    document.dispatchEvent(new CustomEvent('put:city', { detail: name }));
  }
  window.putSetCity = setCity;
  document.addEventListener('change', function (e) { var i = e.target; if (i.matches && i.matches('input[name="from"], .st-from input')) { var v = i.value.trim().toLowerCase(); for (var k in C) if (k.toLowerCase() === v) return setCity(k, true); } });
  var saved = null; try { saved = localStorage.getItem('put_city'); } catch (e) {}
  function start() {
    if (saved && C[saved]) return setCity(saved);
    if (!window.GEO_API) return;
    fetch(window.GEO_API).then(function (r) { return r.json(); }).then(function (g) {
      if (g && g.country === 'RU' && g.lat) setCity(near(+g.lat, +g.lon));
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // «Выбрать тур» на карте → страна в форме + прокрутка к поиску
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (!b) return;
    var f = document.getElementById('poisk'); if (!f) return;
    // сразу открываем поиск туров в эту страну (без прокрутки к форме и второго нажатия)
    f.to.value = b.dataset.pick; putSearch(f);
  });
})();

// Выпадающий список городов (как на турсайтах): клик — открылись все города, ввод — фильтр, стрелки/Enter.
(function () {
  var POP = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск', 'Краснодар', 'Самара', 'Уфа', 'Нижний Новгород', 'Ростов-на-Дону', 'Иркутск', 'Красноярск'];
  function init() {
    var C = window.CITIES || {}, all = POP.filter(function (c) { return C[c]; }).concat(Object.keys(C).filter(function (c) { return POP.indexOf(c) < 0; }).sort());
    [].forEach.call(document.querySelectorAll('input[list="cities"]'), function (inp) {
      inp.removeAttribute('list'); inp.removeAttribute('onfocus'); inp.setAttribute('autocomplete', 'off'); inp.setAttribute('role', 'combobox');
      var host = inp.parentNode; host.classList.add('cbx');
      var box = document.createElement('div'); box.className = 'cbx-list'; box.hidden = true; host.appendChild(box);
      var act = -1, typed = false;
      function render() {
        var q = typed ? inp.value.trim().toLowerCase() : '';
        var list = all.filter(function (c) { return !q || c.toLowerCase().indexOf(q) === 0; }).concat(q ? all.filter(function (c) { var l = c.toLowerCase(); return l.indexOf(q) > 0; }) : []);
        box.innerHTML = list.length ? '' : '<div class="cbx-none">Нет такого города вылета</div>';
        if (!q) { var h = document.createElement('div'); h.className = 'cbx-h'; h.textContent = 'Популярные'; box.appendChild(h); }
        list.forEach(function (c, i) {
          if (!q && i === POP.length) { var h2 = document.createElement('div'); h2.className = 'cbx-h'; h2.textContent = 'Все города'; box.appendChild(h2); }
          var o = document.createElement('button'); o.type = 'button'; o.className = 'cbx-o' + (i === act ? ' on' : '') + (C[c] && c === inp.dataset.cur ? ' cur' : '');
          o.textContent = c; o.addEventListener('mousedown', function (e) { e.preventDefault(); pick(c); }); box.appendChild(o);
        });
        box.hidden = false;
      }
      function pick(c) { inp.value = c; inp.dataset.cur = c; box.hidden = true; typed = false; act = -1; inp.blur(); if (window.putSetCity) putSetCity(c, true); }
      inp.addEventListener('focus', function () { typed = false; act = -1; inp.dataset.cur = inp.value; setTimeout(function () { inp.select(); }, 0); render(); });
      inp.addEventListener('click', function () { if (box.hidden) render(); });
      inp.addEventListener('input', function () { typed = true; act = 0; render(); });
      inp.addEventListener('keydown', function (e) {
        var os = box.querySelectorAll('.cbx-o');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, Math.min(os.length - 1, act + (e.key === 'ArrowDown' ? 1 : -1))); [].forEach.call(os, function (o, i) { o.classList.toggle('on', i === act); }); if (os[act]) os[act].scrollIntoView({ block: 'nearest' }); }
        else if (e.key === 'Enter') { e.preventDefault(); if (os[act < 0 ? 0 : act]) pick(os[act < 0 ? 0 : act].textContent); }
        else if (e.key === 'Escape') { box.hidden = true; inp.value = inp.dataset.cur || 'Москва'; inp.blur(); }
      });
      inp.addEventListener('blur', function () { setTimeout(function () { box.hidden = true; if (!C[inp.value]) inp.value = inp.dataset.cur || 'Москва'; }, 150); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
