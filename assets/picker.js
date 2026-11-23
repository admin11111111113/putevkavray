// Бот-подборщик: человек пишет, что хочет, — получает 2–3 готовых варианта со ссылками на живой поиск.
(function () {
  var API = 'https://putevka-chat.videorils.workers.dev/chat';
  var boxes = document.querySelectorAll('[data-picker]');
  if (!boxes.length) return;
  boxes.forEach(function (box) {
    var log = box.querySelector('.pk-log'), ta = box.querySelector('textarea'), btn = box.querySelector('.pk-send'), chips = box.querySelector('.pk-chips');
    var hist = [], busy = false;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
    function scroll() { log.scrollTop = log.scrollHeight; }
    function card(o) {
      var a = el('div', 'pk-card');
      a.appendChild(el('b', '', o.title));
      a.appendChild(el('p', '', o.why));
      var row = el('div', 'pk-links');
      var l1 = el('a', 'btn sun', 'Смотреть туры'); l1.href = o.url; l1.target = '_blank'; l1.rel = 'noopener sponsored';
      var l2 = el('a', 'pk-alt', 'Сравнить на Travelata'); l2.href = o.alt; l2.target = '_blank'; l2.rel = 'noopener sponsored';
      row.appendChild(l1); row.appendChild(l2); a.appendChild(row); return a;
    }
    function ask(text) {
      text = (text || '').trim(); if (!text || busy) return;
      busy = true; btn.disabled = true; if (chips) chips.style.display = 'none';
      hist.push({ role: 'user', content: text }); log.appendChild(el('div', 'pk-m u', text)); ta.value = '';
      var t = el('div', 'pk-typing', 'Подбираю варианты…'); log.appendChild(t); scroll();
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var m = el('div', 'pk-m a', j.reply || 'Вот что нашлось.'); log.appendChild(m);
          (j.options || []).forEach(function (o) { log.appendChild(card(o)); });
          hist.push({ role: 'assistant', content: (j.reply || '') + ' Варианты: ' + (j.options || []).map(function (o) { return o.title; }).join('; ') });
        })
        .catch(function () { log.appendChild(el('div', 'pk-m a', 'Связь пропала. Попробуй ещё раз.')); })
        .finally(function () { t.remove(); busy = false; btn.disabled = false; scroll(); });
    }
    btn.onclick = function () { ask(ta.value); };
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(ta.value); } });
    if (chips) chips.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); });
  });
})();
