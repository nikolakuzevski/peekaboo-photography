/* =============================================================================
   ПРЕКИНУВАЧ ЗА ВЕРЗИИ  (привремено, само за споредба)
   =============================================================================

   ⚠️  ЦЕЛИОТ ОВОЈ ФАЈЛ СЕ БРИШЕ ПРЕД ОБЈАВУВАЊЕ.
   Види README, делот „Две верзии".

   ШТО ПРАВИ
   Држи две верзии на истиот сајт во ист код:
     • верзија 1 = сегашниот сајт, недопрен
     • верзија 2 = сајтот без работите што клиентот ги забрани
                   (капсулести копчиња, виолетови преливања, лажни рецензии,
                   измислен hero текст, долги црти, разиграни анимации)

   КАКО СЕ ПАЛИ
     • копчето долу десно на секоја страница
     • или ?v=2 во адресата (?v=1 враќа назад)
   Изборот се памети во localStorage, па важи и кога ќе одиш на друга страница.

   ЗОШТО ВО <head> БЕЗ defer
   Атрибутот data-version мора да е поставен пред првото исцртување. Ако се
   постави подоцна, страницата за момент светнува во старата верзија и потоа
   скока во новата.

   ЗОШТО ВЧИТУВАЊЕТО НА DOMContentLoaded Е БЕЗБЕДНО
   Скриптите на дното на <body> (site-data.js, sections.js, reviews.js...)
   исто така чекаат DOMContentLoaded. Слушателите се повикуваат по редот по кој
   се регистрирани, а овој фајл е во <head>, значи прв. Затоа податоците се
   веќе преправени пред кој било рендерер да ги прочита.

   КАКО СЕ ВРАЌА СЀ НА СТАРО ЗАСЕКОГАШ
   Избриши ги од сите страници двата реда што го вчитуваат овој фајл и
   css/theme-v2.css, потоа избриши ги js/version.js, css/theme-v2.css,
   content/site-data-v2.js и сите data-v2* атрибути. Верзија 1 е недопрена
   во HTML-от, па ништо друго не треба да се враќа.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'pb-version';
  var root = document.documentElement;

  /* --- localStorage знае да фрли исклучок (приватен прозорец, блокирани
         колачиња). Верзијата не смее да ја собори страницата. ------------- */
  function readStored() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(v) {
    try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* нема каде да се запише, во ред е */ }
  }

  function resolveVersion() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get('v');
    } catch (e) { /* многу стар прелистувач, се потпираме на складот */ }

    if (fromUrl === '1' || fromUrl === '2') {
      writeStored(fromUrl);
      return fromUrl;
    }
    return readStored() === '2' ? '2' : '1';
  }

  var version = resolveVersion();
  var isV2 = version === '2';

  root.setAttribute('data-version', version);

  /* --- Насловот на јазичето. Секоја страница го носи својот v2 наслов во
         <meta name="v2:title">. Се менува веднаш, не на DOMContentLoaded,
         за да не трепне стариот наслов во јазичето. ----------------------- */
  if (isV2) {
    var titleMeta = document.querySelector('meta[name="v2:title"]');
    if (titleMeta && titleMeta.content) document.title = titleMeta.content;
  }

  /* ===========================================================================
     ЗАМЕНА НА СОДРЖИНАТА
     ======================================================================== */

  /** Ги применува паровите од SITE_V2.textReplacements врз секој стринг во
   *  објектот, длабински. Ако некој пар не се совпадне со ништо, тоа значи
   *  дека текстот во site-data.js е изменет, а овде е заборавен. Тивко
   *  прескокнување би оставило долга црта на живиот сајт, па се пишува
   *  предупредување. */
  function applyTextReplacements(site, pairs) {
    var used = pairs.map(function () { return false; });

    function walk(node) {
      if (typeof node === 'string') {
        var out = node;
        pairs.forEach(function (pair, i) {
          if (out.indexOf(pair[0]) !== -1) {
            out = out.split(pair[0]).join(pair[1]);
            used[i] = true;
          }
        });
        return out;
      }
      if (Array.isArray(node)) return node.map(walk);
      if (node && typeof node === 'object') {
        var copy = {};
        Object.keys(node).forEach(function (k) { copy[k] = walk(node[k]); });
        return copy;
      }
      return node;
    }

    var result = walk(site);

    used.forEach(function (hit, i) {
      if (!hit && window.console && console.warn) {
        console.warn(
          '[verzija 2] Оваа замена не најде совпаѓање во site-data.js:\n  "' +
          pairs[i][0] + '"\nВеројатно текстот е изменет во site-data.js. ' +
          'Ажурирај го content/site-data-v2.js.'
        );
      }
    });

    return result;
  }

  /** Длабинско спојување на обични објекти. Низите се ЗАМЕНУВААТ цели, не се
   *  спојуваат член по член: кога се менува список (совети, ставки на услуга),
   *  секогаш се мисли на целиот нов список, никогаш на делумно преклопување. */
  function deepMerge(base, patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
    var out = {};
    Object.keys(base || {}).forEach(function (k) { out[k] = base[k]; });
    Object.keys(patch).forEach(function (k) {
      var b = out[k], p = patch[k];
      out[k] = (b && p && typeof b === 'object' && typeof p === 'object' &&
                !Array.isArray(b) && !Array.isArray(p)) ? deepMerge(b, p) : p;
    });
    return out;
  }

  function patchSiteData() {
    var v2 = window.SITE_V2;
    if (!window.SITE || !v2) return;

    if (Array.isArray(v2.textReplacements) && v2.textReplacements.length) {
      window.SITE = applyTextReplacements(window.SITE, v2.textReplacements);
    }

    if (Object.prototype.hasOwnProperty.call(v2, 'reviews')) {
      window.SITE.reviews = v2.reviews;
    }

    // Делумни измени по клуч: contact, about, tips...
    if (v2.overrides) {
      Object.keys(v2.overrides).forEach(function (k) {
        window.SITE[k] = deepMerge(window.SITE[k], v2.overrides[k]);
      });
    }

    /* Услугите се низа, а измените се однесуваат на една услуга. Клучот е
       `slug`, не редниот број: така преместување на некоја услуга во
       site-data.js не ја пренасочува тивко измената кон погрешна услуга. */
    if (v2.servicesBySlug && Array.isArray(window.SITE.services)) {
      var seen = {};
      window.SITE.services = window.SITE.services.map(function (s) {
        var patch = v2.servicesBySlug[s.slug];
        if (!patch) return s;
        seen[s.slug] = true;
        return deepMerge(s, patch);
      });
      Object.keys(v2.servicesBySlug).forEach(function (slug) {
        if (!seen[slug] && window.console && console.warn) {
          console.warn('[verzija 2] Нема услуга со slug "' + slug +
                       '" во site-data.js. Измената е прескокната.');
        }
      });
    }
  }

  /** Текстот за верзија 2 стои до текстот за верзија 1, во ист HTML:
   *    data-v2="..."       ја менува само содржината (обичен текст)
   *    data-v2-html="..."  кога содржината има ознаки внатре (<em>, <br>)
   *    data-v2-hide        елементот го нема во верзија 2
   *  Верзија 1 не ги ни гледа овие атрибути, па останува иста. */
  function swapMarkup() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-v2-hide]'), function (el) {
      el.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-v2]'), function (el) {
      el.textContent = el.getAttribute('data-v2');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-v2-html]'), function (el) {
      el.innerHTML = el.getAttribute('data-v2-html');
    });

    /* data-v2-attr="име=вредност; друго=вредност"
       Со ова се менуваат атрибути што ги чита некој рендерер, на пример колку
       placeholder плочки да исцрта. Мора да се случи ПРЕД рендерерите да
       тргнат, што и се случува: овој фајл е во <head>, тие се на дното.

       Празна вредност значи БРИШЕЊЕ на атрибутот: "data-link=" го тргнува
       `data-link`. Тоа е потребно кога копчето треба да води на друго место
       од она што js/nav.js му го дава од контакт податоците. Без бришење,
       nav.js подоцна би го пребришал href-от назад. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-v2-attr]'), function (el) {
      el.getAttribute('data-v2-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf('=');
        if (i < 1) return;
        var name = pair.slice(0, i).trim();
        var value = pair.slice(i + 1).trim();
        if (value === '') el.removeAttribute(name);
        else el.setAttribute(name, value);
      });
    });

    // data-v2-class="класа друга-класа" — само додава, не брише постојни.
    Array.prototype.forEach.call(document.querySelectorAll('[data-v2-class]'), function (el) {
      el.getAttribute('data-v2-class').split(/\s+/).forEach(function (c) {
        if (c) el.classList.add(c);
      });
    });
  }

  /* ===========================================================================
     РЕЦЕНЗИИ ВО ВЕРЗИЈА 2
     ---------------------------------------------------------------------------
     Верзија 2 го презема целиот дел: `data-reviews` се тргнува за js/reviews.js
     воопшто да не се вклучи, па нема трепкање на еден изглед пред другиот.

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
     клуч ставен во JavaScript на страницата е јавен за секого. Затоа тука
     стојат рецензии внесени рачно во content/site-data.js, со вистинско име и
     вистински текст, плус линк до профилот каде што се сите.
     ======================================================================== */

  var ROTATE_MS = 8000;

  /* СКРАТУВАЊЕ НА ДОЛГИТЕ РЕЦЕНЗИИ
     Вистинските рецензии се различно долги: една е од две реченици, друга од
     три параграфи. Ако сите се прикажат цели, картичките излегуваат неуредно
     високи и делот се растегнува надолу без потреба.

     WORD_LIMIT   до колку зборови се прикажува во собрана состојба.
                  На картичка од околу 356px влегуваат некои три збора во ред,
                  па 18 зборови се приближно шест реда. Мерено, не погодено.
     MIN_HIDDEN   под колку скриени зборови воопшто не вреди да се скратува;
                  копче „прочитај повеќе" што открива три збора е потсмев */
  var WORD_LIMIT = 18;
  var MIN_HIDDEN = 6;

  function quoteCard(r) {
    var full = String(r.text == null ? '' : r.text);
    var w = full.trim().split(/\s+/);
    var clamp = w.length > WORD_LIMIT + MIN_HIDDEN;

    /* Кратката верзија намерно се спојува со обични празни места: цепењето по
       /\s+/ ги голта преломите на редови, па собраната картичка е компактен
       блок. Целиот текст ги задржува параграфите (види white-space: pre-line
       во components.css). */
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
   *  сите на Google. Носи поинаква боја (data-color="cream") намерно — на
   *  брз поглед не смее да се помеша со вистинска рецензија. Ако нема линк
   *  (реrviewsLink е празен), полето воопшто не се прикажува — копче што
   *  никаде не води е полошо од копче што го нема. */
  function moreCard(link) {
    if (!link) return '';
    return '<div class="reviews-more" data-color="cream">' +
             '<p class="reviews-more__text">Ова се само неколку. Прочитајте ги сите рецензии на Google.</p>' +
             '<a class="btn btn--outline" href="' + link + '" target="_blank" rel="noopener">' +
               'Види повеќе <span class="btn__arrow" aria-hidden="true">&rarr;</span>' +
             '</a>' +
           '</div>';
  }

  /** Отвора и затвора една скратена рецензија.
   *  Слушателот стои на контејнерот, не на копчето: картичките се
   *  прецртуваат при ротација, па слушател на самото копче би исчезнал
   *  заедно со него. */
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

  function renderReviews() {
    var wrap = document.querySelector('[data-reviews]');
    if (!wrap || !window.PB) return;

    wrap.removeAttribute('data-reviews');
    wrap.removeAttribute('data-limit');

    var list = (window.SITE && window.SITE.reviews) || [];
    var link = (window.SITE_V2 && window.SITE_V2.reviewsLink) || '';

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

  /* ===========================================================================
     КОПЧЕТО ЗА СМЕНА
     ======================================================================== */
  function buildSwitch() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vswitch';
    btn.setAttribute('aria-pressed', isV2 ? 'true' : 'false');
    btn.title = isV2
      ? 'Сега гледаш верзија 2. Клик за верзија 1.'
      : 'Сега гледаш верзија 1. Клик за верзија 2.';

    btn.innerHTML =
      '<span class="vswitch__dot" aria-hidden="true"></span>' +
      '<span>' + (isV2 ? 'Верзија 2 (нова)' : 'Верзија 1 (стара)') + '</span>';

    btn.addEventListener('click', function () {
      writeStored(isV2 ? '1' : '2');
      // Адресата се чисти од ?v= за да не се степаат складот и линкот.
      window.location.href = window.location.pathname + window.location.hash;
    });

    document.body.appendChild(btn);
  }

  function start() {
    if (isV2) {
      patchSiteData();
      swapMarkup();
      renderReviews();
    }
    buildSwitch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
