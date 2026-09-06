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

  function patchSiteData() {
    var v2 = window.SITE_V2;
    if (!window.SITE || !v2) return;

    if (Array.isArray(v2.textReplacements) && v2.textReplacements.length) {
      window.SITE = applyTextReplacements(window.SITE, v2.textReplacements);
    }

    if (Object.prototype.hasOwnProperty.call(v2, 'reviews')) {
      window.SITE.reviews = v2.reviews;
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
  }

  /** Рецензии: во верзија 2 нема ниту една пример-картичка.
   *  Празното место се пополнува тука, а `data-reviews` се тргнува за
   *  js/reviews.js воопшто да не се вклучи. Така нема ни трепкање на
   *  краткиот стандарден текст пред да се замени. */
  function renderReviewsEmptyState() {
    var wrap = document.querySelector('[data-reviews]');
    if (!wrap) return;

    var link = (window.SITE_V2 && window.SITE_V2.reviewsLink) || '';

    var html =
      '<div class="reviews-empty">' +
        '<p>Рецензиите од родителите допрва се собираат на Google. ' +
        'Тука ќе стојат само вистински, онакви какви што се напишани.</p>' +
        (link
          ? '<p><a class="btn btn--outline" href="' + link + '" target="_blank" rel="noopener">' +
            'Види на Google</a></p>'
          : '') +
      '</div>';

    wrap.innerHTML = html;
    wrap.removeAttribute('data-reviews');
    wrap.removeAttribute('data-limit');
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
      renderReviewsEmptyState();
    }
    buildSwitch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
