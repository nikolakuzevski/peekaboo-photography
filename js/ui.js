/* =============================================================================
   UI — заеднички помошници
   -----------------------------------------------------------------------------
   Најважниот дел тука е `placeholder()`. Тој е причината зошто сајтот изгледа
   завршен и намерен иако сѐ уште нема ниту една фотографија: секој празен слот
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
    /* Видео во слот: истиот `.frame` и истиот однос на страни како кај слика,
       па распоредот не се поместува. Се врти тивко во круг. `o.videoControls`
       додава контроли (за цел екран/звук) — не се вклучува кога слотот седи
       во кликлива картичка, инаку линкот ги прекрива копчињата. */
    if (img && img.video) {
      // Без `autoplay` атрибут — пуштањето го стартува js/sections.js со
      // .play().catch(), за да не остане неуловена AbortError кога прегледот
      // паузира тивко видео (пр. кога табот е во позадина).
      return '<div class="frame" style="aspect-ratio:' + (o.ratio || '4 / 5') + ';' +
             (o.radius ? 'border-radius:' + o.radius + ';' : '') + '">' +
               '<video src="' + esc(img.video) + '" muted loop playsinline ' +
               (o.videoControls ? 'controls ' : '') + 'preload="metadata" ' +
               'aria-label="' + esc(img.alt || 'Видео') + '"></video>' +
             '</div>';
    }
    if (img && img.src) {
      // `objectPosition` е својство на сликата (не на слотот) — некои извори
      // не се добро центрирани по вертикала во својот однос на страни.
      return '<div class="frame" style="aspect-ratio:' + (o.ratio || '4 / 5') + ';' +
             (o.radius ? 'border-radius:' + o.radius + ';' : '') + '">' +
               '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" ' +
               (img.objectPosition ? 'style="object-position:' + esc(img.objectPosition) + '" ' : '') +
               'loading="lazy" decoding="async">' +
             '</div>';
    }
    return placeholder(o);
  }

  /* Заштита на фотографиите: без десен клик и без влечење врз сликите.
     Не е непробојно (screenshot секогаш работи), но го запира случајното
     „Зачувај слика". Логото и постерите на видеата не се опфатени. ui.js се
     вчитува на сите 10 страници. Истиот список е и во components.css. */
  var PHOTO = '.frame img, .hero-slider img, .lightbox__img, .about-hero__portrait img';
  function blockPhoto(e) {
    var t = e.target;
    if (t && t.closest && t.closest(PHOTO)) e.preventDefault();
  }
  document.addEventListener('contextmenu', blockPhoto);
  document.addEventListener('dragstart', blockPhoto);

  /* Тон на водениот жиг: бел по правило, црн (истите 30%) кога делот од
     фотографијата под него е светол, инаку белото лого се губи. Се мери
     токму делот од сликата под жигот (со кропот од object-fit: cover и
     object-position), по вчитување и по промена на прозорецот. Резултатот е
     атрибутот data-wm-dark на <img>; изгледот го бираат components.css и
     pages.css. Lightbox-от ова го повикува од js/gallery.js откако ќе го
     постави жигот. */
  var WM_LIGHT = 0.6;   // просечна осветленост (0–1) над која жигот станува темен
  var wmCanvas = null;

  // Каде седи жигот, во пиксели од горниот лев агол на <img>.
  function markRect(img) {
    var item = img.closest('.photo-grid__item');
    if (item) {
      var cap = item.querySelector('.photo-grid__caption');
      var cb = cap && getComputedStyle(cap, '::before');
      if (!cb || cb.content === 'none') return null;
      var ir = img.getBoundingClientRect(), cr = cap.getBoundingClientRect();
      var ch = parseFloat(cb.height);
      return { x: cr.left + parseFloat(cb.left) - ir.left, y: cr.top - ch - ir.top,
               w: parseFloat(cb.width), h: ch };
    }
    var stage = img.closest('.lightbox__stage');
    if (stage) {
      var m = stage.querySelector('.lightbox__mark');
      if (!m || !m.offsetWidth) return null;
      return { x: m.offsetLeft - img.offsetLeft, y: m.offsetTop - img.offsetTop,
               w: m.offsetWidth, h: m.offsetHeight };
    }
    // .frame и .hero-slider: сликата ја пополнува целата рамка, па се мери
    // по висината на сликата (во галеријата .frame е <span> со clientHeight 0).
    var box = img.closest('.frame, .hero-slider');
    var ca = box && getComputedStyle(box, '::after');
    if (!ca || ca.content === 'none') return null;
    var h = parseFloat(ca.height);
    return { x: parseFloat(ca.left), y: img.clientHeight - parseFloat(ca.bottom) - h,
             w: parseFloat(ca.width), h: h };
  }

  function posOffset(v, free) {
    return /%$/.test(v) ? free * parseFloat(v) / 100 : (parseFloat(v) || 0);
  }

  function markTone(img) {
    if (!img || !img.complete || !img.naturalWidth || !img.clientWidth) return;
    var r = markRect(img);
    if (!r || !r.w || !r.h) return;
    var nw = img.naturalWidth, nh = img.naturalHeight;
    var ew = img.clientWidth, eh = img.clientHeight;
    var cs = getComputedStyle(img);
    var sx = ew / nw, sy = eh / nh, ox = 0, oy = 0;
    if (cs.objectFit === 'cover') {
      sx = sy = Math.max(ew / nw, eh / nh);
      var pos = cs.objectPosition.split(' ');
      ox = posOffset(pos[0], ew - nw * sx);
      oy = posOffset(pos[1] || '50%', eh - nh * sy);
    }
    var x = Math.max(0, (r.x - ox) / sx), y = Math.max(0, (r.y - oy) / sy);
    var w = Math.min(nw, (r.x + r.w - ox) / sx) - x;
    var h = Math.min(nh, (r.y + r.h - oy) / sy) - y;
    if (w <= 0 || h <= 0) return;
    try {
      wmCanvas = wmCanvas || document.createElement('canvas');
      wmCanvas.width = 24; wmCanvas.height = 16;
      var ctx = wmCanvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, x, y, w, h, 0, 0, 24, 16);
      var d = ctx.getImageData(0, 0, 24, 16).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) {
        sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      }
      img.toggleAttribute('data-wm-dark', sum / (d.length / 4) / 255 > WM_LIGHT);
    } catch (e) { /* без canvas жигот едноставно останува бел */ }
  }

  function markAll() {
    Array.prototype.forEach.call(document.querySelectorAll(PHOTO), function (img) {
      if (!img.classList.contains('lightbox__img')) markTone(img);
    });
  }

  // `load` не се шири нагоре, но се фаќа во capture фазата — важи и за
  // сликите што sections.js и gallery.js ги вметнуваат подоцна.
  document.addEventListener('load', function (e) {
    var t = e.target;
    if (t.tagName === 'IMG' && t.matches(PHOTO) && !t.classList.contains('lightbox__img')) markTone(t);
  }, true);
  window.addEventListener('load', markAll);
  var wmTimer;
  window.addEventListener('resize', function () {
    clearTimeout(wmTimer);
    wmTimer = setTimeout(markAll, 150);
  });

  window.PB = { esc: esc, placeholder: placeholder, slot: slot, PALETTE: PALETTE, markTone: markTone };
})();
