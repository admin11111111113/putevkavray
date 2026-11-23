// Поиск туров: собираем ссылку поиска Level.Travel и (если есть маркер) оборачиваем в партнёрскую ссылку Travelpayouts.
function putSearch(f) {
  var d = f.date.value.split('-'); // yyyy-mm-dd
  var date = d[2] + '.' + d[1] + '.' + d[0];
  var url = 'https://level.travel/search/' + f.from.value + '-to-Any-' + f.to.value + '-departure-' + date +
    '-for-' + f.nights.value + '-nights-' + f.adults.value + '-adults-0-kids-1..5-stars';
  var P = window.PUT || {};
  if (P.marker && P.p) url = 'https://tp.media/r?marker=' + P.marker + '&p=' + P.p + '&u=' + encodeURIComponent(url);
  window.open(url, '_blank', 'noopener');
  return false;
}
