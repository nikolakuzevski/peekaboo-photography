/* =============================================================================
   TIPS — страницата „Совети"
   -----------------------------------------------------------------------------
   Списокот е изграден врз <details>/<summary>. Тоа е свесен избор:
   нативниот елемент е достапен со тастатура, ја објавува состојбата
   отворено/затворено на читачите на екран, и работи БЕЗ ниту една линија
   JavaScript за отворање. Ништо од тоа не доаѓа бесплатно со сопствен
   accordion направен со клик-слушачи.

   Насловите се видливи секогаш, целиот текст се отвора на клик — така
   страницата останува прегледна и кога ќе има триесет совети.
   ============================================================================= */
(function () {
  'use strict';

  var MONTHS = [
    'јануари', 'февруари', 'март', 'април', 'мај', 'јуни',
    'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'
  ];

  /* Форматирање без toLocaleDateString: поддршката за македонски локал
     се разликува меѓу прелистувачи, а овде сакаме ист резултат насекаде. */
  function formatDate(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    var m = parseInt(p[1], 10) - 1;
    if (m < 0 || m > 11) return iso;
    return parseInt(p[2], 10) + ' ' + MONTHS[m] + ' ' + p[0];
  }

  var CHEVRON =
    '<svg class="tip__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m6 9 6 6 6-6"/></svg>';

  function init() {
    var wrap = document.querySelector('[data-tips]');
    if (!wrap) return;

    var list = (window.SITE && window.SITE.tips) || [];

    if (!list.length) {
      wrap.innerHTML =
        '<p class="empty-note">Првите совети наскоро ќе бидат објавени тука.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (t) {
      var body = (t.body || []).map(function (p) {
        return '<p>' + window.PB.esc(p) + '</p>';
      }).join('');

      return '<article class="tip" data-color="' + window.PB.esc(t.color || 'purple') + '" data-reveal>' +
               '<details class="tip__details">' +
                 '<summary class="tip__summary">' +
                   '<span class="tip__meta">' + window.PB.esc(formatDate(t.date)) + '</span>' +
                   '<h2 class="tip__title">' + window.PB.esc(t.title) + '</h2>' +
                   (t.intro ? '<span class="tip__intro">' + window.PB.esc(t.intro) + '</span>' : '') +
                   '<span class="tip__toggle">' +
                     '<span class="tip__label tip__label--closed">Прочитај го советот</span>' +
                     '<span class="tip__label tip__label--open">Затвори го советот</span>' +
                     CHEVRON +
                   '</span>' +
                 '</summary>' +
                 '<div class="tip__body">' + body + '</div>' +
               '</details>' +
             '</article>';
    }).join('');

    if (window.PBReveal) window.PBReveal.scan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
