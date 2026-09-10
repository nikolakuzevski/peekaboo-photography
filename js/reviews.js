/* =============================================================================
   REVIEWS — цитат картички
   -----------------------------------------------------------------------------
   Три состојби:
     нема ниту една рецензија → чесна порака и копче до Google
     до три                   → сите се прикажани, мирно, без ротација
     повеќе од три            → по три, и се менуваат на секои осум секунди

   ⚠️  ЗОШТО ИМА КОПЧЕ „ПАУЗА"
   Содржина што сама се менува мора да може да се сопре (WCAG 2.2.2). Без тоа
   некој што чита побавно го губи текстот на средина. Ротацијата исто така
   воопшто не се пали ако прелистувачот бара помалку движење, и запира додека
   покажувачот или тастатурата се врз делот.

   ⚠️  ЗОШТО РЕЦЕНЗИИТЕ НЕ СЕ ВЛЕЧАТ ЖИВО ОД GOOGLE
   Статичен сајт без сервер не може да ги прочита. Google бара API клуч, а
   клуч ставен во JavaScript на страницата е јавен за секого. Затоа рецензиите
   стојат внесени рачно во content/site-data.js, со вистинско име и вистински
   текст, плус линк до профилот каде што се сите (`SITE.reviewsLink`).
   ============================================================================= */
(function () {
  'use strict';

  var ROTATE_MS = 8000;

  /* СКРАТУВАЊЕ НА ДОЛГИТЕ РЕЦЕНЗИИ
     Вистинските рецензии се различно долги: една е од две реченици, друга од
     три параграфи. Ако сите се прикажат цели, картичките излегуваат неуредно
     високи и делот се растегнува надолу без потреба.

     WORD_LIMIT   до колку зборови се прикажува во собрана состојба.
     MIN_HIDDEN   под колку скриени зборови воопшто не вреди да се скратува. */
  var WORD_LIMIT = 18;
  var MIN_HIDDEN = 6;

  function quoteCard(r) {
    var full = String(r.text == null ? '' : r.text);
    var w = full.trim().split(/\s+/);
    var clamp = w.length > WORD_LIMIT + MIN_HIDDEN;

    var body = clamp
      ? '<blockquote class="quote__text">' +
          '<span class="quote__short">' +
            window.PB.esc(w.slice(0, WORD_LIMIT).join(' ')) + '…' +
          '</span>' +
          '<span class="quote__full" hidden>' + window.PB.esc(full) + '</span>' +
        '</blockquote>' +
        '<button class="quote__more" type="button" aria-expanded="false">' +
          'Прочитај ја целата' +
        '</button>'
      : '<blockquote class="quote__text">' + window.PB.esc(full) + '</blockquote>';

    return '<figure class="quote' + (clamp ? ' quote--clamped' : '') + '">' +
             '<span class="quote__mark" aria-hidden="true">&ldquo;</span>' +
             body +
             '<figcaption class="quote__foot">' +
               '<span class="quote__name">' + window.PB.esc(r.name) + '</span>' +
               (r.source ? '<span class="quote__source">преку ' + window.PB.esc(r.source) + '</span>' : '') +
             '</figcaption>' +
           '</figure>';
  }

  /** Четвртото поле во мрежата: не е рецензија, туку покана да се прочитаат
   *  сите на Google. Истата класа `.quote` (иста боја, големина), само со свој
   *  текст и копче наместо цитат. Ако нема линк, полето не се прикажува. */
  function moreCard(link) {
    if (!link) return '';
    return '<div class="quote reviews-more">' +
             '<p class="reviews-more__text">Ова се само неколку. Прочитајте ги сите рецензии на Google.</p>' +
             '<a class="btn btn--outline" href="' + link + '" target="_blank" rel="noopener">' +
               'Види повеќе <span class="btn__arrow" aria-hidden="true">&rarr;</span>' +
             '</a>' +
           '</div>';
  }

  /** Отвора и затвора една скратена рецензија. Слушателот стои на контејнерот,
   *  не на копчето: картичките се прецртуваат при ротација. */
  function bindExpand(wrap) {
    wrap.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.quote__more') : null;
      if (!btn || !wrap.contains(btn)) return;

      var fig = btn.closest('.quote');
      var short = fig.querySelector('.quote__short');
      var full = fig.querySelector('.quote__full');
      if (!short || !full) return;

      var open = btn.getAttribute('aria-expanded') === 'true';
      short.hidden = !open;
      full.hidden = open;
      fig.classList.toggle('is-open', !open);
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.textContent = open ? 'Прочитај ја целата' : 'Собери ја';
    });
  }

  function init() {
    var wrap = document.querySelector('[data-reviews]');
    if (!wrap || !window.PB) return;

    wrap.removeAttribute('data-reviews');
    wrap.removeAttribute('data-limit');

    var list = (window.SITE && window.SITE.reviews) || [];
    var link = (window.SITE && window.SITE.reviewsLink) || '';

    if (!list.length) {
      wrap.innerHTML =
        '<div class="reviews-empty">' +
          '<p>Рецензиите од родителите допрва се собираат на Google. ' +
          'Тука ќе стојат само вистински, онакви какви што се напишани.</p>' +
          (link
            ? '<p><a class="btn btn--outline" href="' + link + '" target="_blank" rel="noopener">' +
              'Види на Google</a></p>'
            : '') +
        '</div>';
      return;
    }

    var PER = 3;
    var page = 0;
    var pages = Math.ceil(list.length / PER);

    function slice(i) {
      var out = [], start = i * PER;
      for (var k = start; k < start + PER && k < list.length; k++) out.push(list[k]);
      return out;
    }

    function paint() {
      wrap.innerHTML = slice(page).map(quoteCard).join('') + moreCard(link);
    }

    paint();
    bindExpand(wrap);

    if (pages < 2) return;

    /* Читачите на екран ја објавуваат промената сами по себе, но само ако
       делот е означен како жива област. „polite" значи: кажи го кога
       корисникот ќе застане, не прекинувај го на средина од реченица. */
    wrap.setAttribute('aria-live', 'polite');

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var bar = document.createElement('div');
    bar.className = 'reviews-rotate';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--outline btn--sm';
    bar.appendChild(btn);
    var status = document.createElement('span');
    status.className = 'reviews-rotate__count';
    bar.appendChild(status);
    wrap.parentNode.insertBefore(bar, wrap.nextSibling);

    var timer = null;
    var playing = false;
    var hovered = false;

    function updateStatus() {
      status.textContent = (page + 1) + ' од ' + pages;
    }

    function step() {
      page = (page + 1) % pages;
      paint();
      updateStatus();
    }

    function tick() {
      if (hovered) return;      // мирува додека некој чита
      step();
    }

    function play() {
      playing = true;
      btn.textContent = 'Пауза на рецензиите';
      btn.setAttribute('aria-pressed', 'false');
      clearInterval(timer);
      timer = setInterval(tick, ROTATE_MS);
    }

    function pause() {
      playing = false;
      btn.textContent = 'Пушти ги рецензиите';
      btn.setAttribute('aria-pressed', 'true');
      clearInterval(timer);
      timer = null;
    }

    btn.addEventListener('click', function () { playing ? pause() : play(); });

    ['mouseenter', 'focusin'].forEach(function (e) {
      wrap.addEventListener(e, function () { hovered = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (e) {
      wrap.addEventListener(e, function () { hovered = false; });
    });

    updateStatus();

    // Кој бара помалку движење, добива копче за рачно менување, не автоматско.
    if (reduced) pause(); else play();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
