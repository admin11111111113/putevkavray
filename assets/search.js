var IATA_FROM = {'Moscow-RU':'MOW','Saint_Petersburg-RU':'LED','Kazan-RU':'KZN','Yekaterinburg-RU':'SVX','Novosibirsk-RU':'OVB','Krasnodar-RU':'KRR','Samara-RU':'KUF','Ufa-RU':'UFA'};
var IATA_TO = {TR:'AYT',EG:'HRG',AE:'DXB',TH:'HKT',VN:'CXR',MV:'MLE',LK:'CMB',CU:'VRA',CN:'SYX',ID:'DPS',IN:'GOI',TN:'NBE',TZ:'ZNZ'};
document.addEventListener('click', function (e) {
  var b = e.target.closest('.tabs button'); if (!b) return;
  var f = b.parentNode.nextElementSibling; f.dataset.mode = b.dataset.mode;
  [].forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); });
  f.querySelector('.pass-stub .btn').textContent = b.dataset.mode === 'avia' ? 'Найти билеты' : 'Найти туры';
});
// Поиск туров: собираем ссылку поиска Level.Travel и (если есть маркер) оборачиваем в партнёрскую ссылку Travelpayouts.
function putSearch(f) {
  var d = f.date.value.split('-'); // yyyy-mm-dd
  if (f.dataset.mode === 'avia') {
    var to = IATA_TO[f.to.value] || 'AYT';
    window.open('https://www.aviasales.ru/search/' + IATA_FROM[f.from.value] + d[2] + d[1] + to + f.adults.value, '_blank', 'noopener');
    return false;
  }
  var date = d[2] + '.' + d[1] + '.' + d[0];
  var url = 'https://level.travel/search/' + f.from.value + '-to-Any-' + f.to.value + '-departure-' + date +
    '-for-' + f.nights.value + '-nights-' + f.adults.value + '-adults-0-kids-1..5-stars';
  var P = window.PUT || {};
  if (P.marker && P.p) url = 'https://tp.media/r?marker=' + P.marker + '&p=' + P.p + '&u=' + encodeURIComponent(url);
  window.open(url, '_blank', 'noopener');
  return false;
}
