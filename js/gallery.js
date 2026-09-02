/* =============================================================================
   GALLERY — мрежа, филтер чипови и lightbox
   -----------------------------------------------------------------------------
   Сè се црта од content/site-data.js. Празна низа не е дупка во дизајнот —
   се цртаат брендирани placeholder плочки во точниот однос на страни.
   ============================================================================= */
(function () {
  'use strict';

  // Различни односи на страни за masonry ефект во празна состојба —
  // за да не изгледа како мрежа од идентични кутии.
  var PH_RATIOS = ['4 / 5', '1 / 1', '3 / 4', '4 / 5', '1 / 1', '3 / 4',
                   '4 / 5', '3 / 4', '1 / 1'];

  function init() {
    var grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    var S = window.SITE || {};
    var all = S.gallery || [];
    var active = 'site';

    buildChips();
    render();
    setupLightbox();

    /* -------------------------------------------------------------------- */
    function visible() {
      if (active === 'site') return all;
      return all.filter(function (g) { return g.category === active; });
    }

    function render() {
      var items = visible();

      if (!items.length) {
        // Празно = брендирани плочки, не празен екран.
        var count = parseInt(grid.getAttribute('data-placeholder-count'), 10) || 9;
        var html = '';
        for (var i = 0; i < count; i++) {
          html += '<div class="gallery__item" data-reveal>' +
                    window.PB.placeholder({
                      index: i,
                      ratio: PH_RATIOS[i % PH_RATIOS.length],
                      label: 'Слика доаѓа наскоро'
                    }) +
                  '</div>';
        }
        grid.innerHTML = html;
        if (window.PBReveal) window.PBReveal.scan();
        announce(active === 'site'
          ? 'Галеријата сè уште нема фотографии.'
          : 'Нема фотографии во оваа категорија.');
        return;
      }

      grid.innerHTML = items.map(function (g, i) {
        return '<div class="gallery__item" data-reveal>' +
                 '<button class="gallery__btn" type="button" data-index="' + i + '" ' +
                   'aria-label="Отвори ја сликата: ' + window.PB.esc(g.alt || 'фотографија') + '">' +
                   '<span class="frame">' +
                     '<img src="' + window.PB.esc(g.src) + '" ' +
                       'alt="' + window.PB.esc(g.alt || '') + '" ' +
                       'loading="lazy" decoding="async">' +
                   '</span>' +
                   '<span class="gallery__veil" aria-hidden="true"></span>' +
                 '</button>' +
               '</div>';
      }).join('');

      announce(items.length + " фотографии.");
      if (window.PBReveal) window.PBReveal.scan();
    }

    function buildChips() {
      var bar = document.querySelector('[data-gallery-filter]');
      if (!bar) return;

      var cats = S.galleryCategories || [{ key: 'site', label: 'Сите' }];

      // Прикажи ја категоријата само ако во неа навистина има слики —
      // празен филтер што не враќа ништо е фрустрирачки.
      var usable = cats.filter(function (c) {
        if (c.key === 'site') return true;
        return all.some(function (g) { return g.category === c.key; });
      });

      // Ако сè уште нема ниту една слика, филтерот нема што да филтрира.
      if (all.length === 0) { bar.remove(); return; }

      bar.innerHTML = usable.map(function (c) {
        return '<button class="chip" type="button" data-cat="' + window.PB.esc(c.key) + '" ' +
               'aria-pressed="' + (c.key === active) + '">' + window.PB.esc(c.label) + '</button>';
      }).join('');

      bar.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        active = chip.getAttribute('data-cat');
        Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
        render();
      });
    }

    function announce(msg) {
      var live = document.querySelector('[data-gallery-status]');
      if (live) live.textContent = msg;
    }

    /* ----------------------------------------------------------------------
       LIGHTBOX — Esc затвора, ←/→ навигираат, фокусот е заробен и се враќа
       на плочката од која е отворен.
       ------------------------------------------------------------------- */
    function setupLightbox() {
      var box = document.getElementById('lightbox');
      if (!box) return;

      var imgEl = box.querySelector('.lightbox__img');
      var capEl = box.querySelector('.lightbox__caption');
      var cntEl = box.querySelector('.lightbox__count');
      var btnPrev = box.querySelector('[data-lb="prev"]');
      var btnNext = box.querySelector('[data-lb="next"]');
      var btnClose = box.querySelector('[data-lb="close"]');

      var idx = 0;
      var list = [];
      var lastFocused = null;

      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('.gallery__btn');
        if (!btn) return;
        list = visible();
        idx = parseInt(btn.getAttribute('data-index'), 10) || 0;
        lastFocused = btn;
        open();
      });

      function open() {
        show();
        box.classList.add('is-open');
        box.removeAttribute('inert');
        document.body.classList.add('is-locked');
        btnClose.focus();
      }

      function close() {
        box.classList.remove('is-open');
        box.setAttribute('inert', '');
        document.body.classList.remove('is-locked');
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      }

      function show() {
        var item = list[idx];
        if (!item) return;
        imgEl.src = item.src;
        imgEl.alt = item.alt || '';
        capEl.textContent = item.alt || '';
        cntEl.textContent = (idx + 1) + ' / ' + list.length;
        var many = list.length > 1;
        btnPrev.hidden = !many;
        btnNext.hidden = !many;
      }

      function step(delta) {
        if (list.length < 2) return;
        idx = (idx + delta + list.length) % list.length;
        show();
      }

      btnClose.addEventListener('click', close);
      btnPrev.addEventListener('click', function () { step(-1); });
      btnNext.addEventListener('click', function () { step(1); });

      // Клик врз позадината (не врз самата слика) затвора
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.classList.contains('lightbox__stage')) close();
      });

      document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('is-open')) return;
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); return; }

        if (e.key === 'Tab') {
          var f = box.querySelectorAll('button:not([hidden])');
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });

      box.setAttribute('inert', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
