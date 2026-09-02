/* =============================================================================
   UI — заеднички помошници
   -----------------------------------------------------------------------------
   Најважниот дел тука е `placeholder()`. Тој е причината зошто сајтот изгледа
   завршен и намерен иако сè уште нема ниту една фотографија: секој празен слот
   се црта како брендирана плочка во ТОЧНИОТ однос на страни што ќе го има
   вистинската слика. Кога сликите ќе дојдат, ништо не се поместува.
   ============================================================================= */
(function () {
  'use strict';

  var PALETTE = ['coral', 'yellow', 'teal', 'green', 'orange', 'purple', 'blue'];

  var CAMERA_ICON =
    '<svg class="ph__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h1.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/>' +
    '<circle cx="12" cy="12.2" r="3.4"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Брендирана placeholder плочка.
   * @param {Object} o
   * @param {string} o.ratio  CSS aspect-ratio, пр. '4 / 5'
   * @param {number} o.index  за да не се повторува истата боја едно до друго
   * @param {string} o.label  текст во плочката
   * @param {string} o.radius CSS border-radius (по избор)
   * @param {string} o.tone   изречна боја од палетата (по избор)
   */
  function placeholder(o) {
    o = o || {};
    // Изречно зададен тон има предност: картичка со своја боја мора нејзиниот
    // placeholder да го носи ИСТИОТ тон, инаку картичката се чита како две
    // судрени бои. Кога нема тон, се врти низ палетата (мрежа, галерија).
    var tone = o.tone || PALETTE[(o.index || 0) % PALETTE.length];
    var label = o.label || 'Слика доаѓа наскоро';
    var style = 'aspect-ratio:' + (o.ratio || '4 / 5') + ';' +
                (o.radius ? 'border-radius:' + o.radius + ';' : '');

    return '<div class="ph ph--' + tone + '" style="' + style + '" role="img" ' +
           'aria-label="' + esc(label) + '">' +
             '<span class="ph__inner">' + CAMERA_ICON +
               '<span class="ph__label">' + esc(label) + '</span>' +
             '</span>' +
           '</div>';
  }

  /**
   * Слот за слика: вистинска слика ако е зададена, инаку placeholder.
   * Двете имаат ист однос на страни, па нема поместување на распоредот
   * кога фотографиите ќе бидат додадени.
   */
  function slot(img, o) {
    o = o || {};
    if (img && img.src) {
      return '<div class="frame" style="aspect-ratio:' + (o.ratio || '4 / 5') + ';' +
             (o.radius ? 'border-radius:' + o.radius + ';' : '') + '">' +
               '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" ' +
               'loading="lazy" decoding="async">' +
             '</div>';
    }
    return placeholder(o);
  }

  window.PB = { esc: esc, placeholder: placeholder, slot: slot, PALETTE: PALETTE };
})();
