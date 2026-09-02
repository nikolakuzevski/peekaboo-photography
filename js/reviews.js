/* =============================================================================
   REVIEWS — цитат картички
   -----------------------------------------------------------------------------
   Без автоматска ротација. Grid на десктоп, scroll-snap ред на мобилен.
   Тоа значи дека нема потреба од pause/play контроли, ништо не бега пред
   да го прочиташ, и читачите на екран ја добиваат целата содржина одеднаш.

   Рецензиите со `placeholder: true` добиваат видлива ознака за да не заврши
   пример-текст на живиот сајт по невнимание.
   ============================================================================= */
(function () {
  'use strict';

  function init() {
    var wrap = document.querySelector('[data-reviews]');
    if (!wrap) return;

    var list = (window.SITE && window.SITE.reviews) || [];
    var limit = parseInt(wrap.getAttribute('data-limit'), 10);
    if (limit > 0) list = list.slice(0, limit);

    if (!list.length) {
      wrap.innerHTML = '<p class="empty-note">Рецензиите наскоро ќе бидат додадени.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (r) {
      return '<figure class="quote" data-reveal>' +
               (r.placeholder
                 ? '<span class="quote__flag">Пример — замени со вистинска рецензија</span>'
                 : '') +
               '<span class="quote__mark" aria-hidden="true">&ldquo;</span>' +
               '<blockquote class="quote__text">' + window.PB.esc(r.text) + '</blockquote>' +
               '<figcaption class="quote__foot">' +
                 '<span class="quote__name">' + window.PB.esc(r.name) + '</span>' +
                 (r.source ? '<span class="quote__source">преку ' + window.PB.esc(r.source) + '</span>' : '') +
               '</figcaption>' +
             '</figure>';
    }).join("");

    if (window.PBReveal) window.PBReveal.scan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
