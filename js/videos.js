/* =============================================================================
   VIDEOS — YouTube / MP4 / Instagram
   -----------------------------------------------------------------------------
   Изворот на видеата сѐ уште не е одлучен, па трите патеки се напишани и
   подготвени. Кога ќе се одлучи, се менува само content/site-data.js.

   YouTube се вчитува како „facade": прво само постер и копче. Вистинскиот
   iframe (и целата YouTube скрипта со него) се вчитува дури кога посетителот
   ќе кликне. Страницата останува брза дури и со десет видеа.
   ============================================================================= */
(function () {
  'use strict';

  function init() {
    var wrap = document.querySelector('[data-videos]');
    if (!wrap) return;

    var list = (window.SITE && window.SITE.videos) || [];

    /* data-limit="N" — тизерот на почетната прикажува само првите N видеа, а
       под нив стои „Види ги сите видеа". Страницата „Видеа" нема data-limit,
       па ги прикажува сите. Не важи за placeholder состојбата (таа си има
       data-placeholder-count). */
    var limit = parseInt(wrap.getAttribute('data-limit'), 10);
    if (limit > 0) list = list.slice(0, limit);

    /* Односот на страни доаѓа од HTML-от: хоризонтално 16/9 е default, а
       вертикално 9/16 е за Reels-формат. Плочката и вистинскиот плеер го
       делат истиот однос, па ништо не се поместува кога видеото ќе слета. */
    var ratio = wrap.getAttribute("data-ratio") || "16 / 9";

    if (!list.length) {
      var count = parseInt(wrap.getAttribute('data-placeholder-count'), 10) || 3;
      var html = '';
      for (var i = 0; i < count; i++) {
        html += '<div class="video-card" data-reveal>' +
                  window.PB.placeholder({
                    tone: "cream",
                    ratio: ratio,
                    label: "Видео доаѓа наскоро"
                  }) +
                '</div>';
      }
      wrap.innerHTML = html;
      if (window.PBReveal) window.PBReveal.scan();
      return;
    }

    wrap.innerHTML = list.map(function (v, i) {
      return '<div class="video-card" data-reveal data-video-index="' + i + '">' +
               card(v, ratio) +
             '</div>';
    }).join("");

    if (window.PBReveal) window.PBReveal.scan();

    setupInlineVideos(wrap);

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-play]');
      if (!btn) return;
      var host = btn.closest('.video-card');
      var v = list[parseInt(host.getAttribute('data-video-index'), 10)];
      host.innerHTML = embed(v);
      // Фокусот се преместува на новововчитаниот плеер, не се губи
      var frame = host.querySelector('iframe, video');
      if (frame) frame.focus();
    });
  }

  /* MP4 = се врти само по себе, тивко, во круг. YouTube/Instagram = facade
     (постер + копче за пуштање, ништо од трети страни не се вчитува уште). */
  function card(v, ratio) {
    var title = window.PB.esc(v.title || 'Видео');

    if (v.type === 'mp4') {
      /* autoplay+muted+loop+playsinline: се пушта без клик и се повторува.
         `controls` дава копче за цел екран; звукот се пали на цел екран
         (setupInlineVideos) или преку самите контроли. `background:#000`
         спречува блесок додека се вчитува првиот кадар. */
      return '<video class="video-card__video" autoplay muted loop playsinline ' +
               'controls preload="metadata" ' +
               (v.poster ? 'poster="' + window.PB.esc(v.poster) + '" ' : '') +
               'aria-label="' + title + '">' +
               '<source src="' + window.PB.esc(v.src) + '" type="video/mp4">' +
               'Вашиот прелистувач не поддржува видео.' +
             '</video>' +
             '<p class="video-card__title">' + title + '</p>';
    }

    var poster = v.poster ||
      (v.type === 'youtube' && v.id ? 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg' : '');

    var media = poster
      ? '<img src="' + window.PB.esc(poster) + '" alt="" loading="lazy" decoding="async">'
      : window.PB.placeholder({ tone: "cream", ratio: ratio, label: v.title || "Видео" });

    return '<button class="video-card__btn" type="button" data-play ' +
             'aria-label="Пушти го видеото: ' + title + '">' +
             media +
             '<span class="video-card__play" aria-hidden="true">' +
               '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>' +
             '</span>' +
           '</button>' +
           '<p class="video-card__title">' + title + '</p>';
  }

  /* Инлајн MP4 видеата: тивки додека се вртат во мрежата, добиваат звук само
     кога се на цел екран, и мируваат кога не се на екран за да не трошат
     интернет и батерија. */
  function setupInlineVideos(wrap) {
    var vids = wrap.querySelectorAll('.video-card__video');
    if (!vids.length) return;

    function fsNode() {
      return document.fullscreenElement || document.webkitFullscreenElement || null;
    }
    function syncSound() {
      var fs = fsNode();
      Array.prototype.forEach.call(vids, function (v) {
        // Со звук само она видео што е точно на цел екран; сите други тивки.
        v.muted = !(fs && (fs === v || (fs.contains && fs.contains(v))));
      });
    }
    document.addEventListener('fullscreenchange', syncSound);
    document.addEventListener('webkitfullscreenchange', syncSound);

    // iOS Safari: видеото оди во сопствен плеер, овие настани се на елементот.
    Array.prototype.forEach.call(vids, function (v) {
      v.addEventListener('webkitbeginfullscreen', function () { v.muted = false; });
      v.addEventListener('webkitendfullscreen', function () { v.muted = true; });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else if (!fsNode()) {
            v.pause();
          }
        });
      }, { threshold: 0.2 });
      Array.prototype.forEach.call(vids, function (v) { io.observe(v); });
    }
  }

  /* Вистинскиот плеер — се создава дури на клик. */
  function embed(v) {
    var title = window.PB.esc(v.title || 'Видео');

    if (v.type === 'youtube') {
      return '<iframe src="https://www.youtube-nocookie.com/embed/' + window.PB.esc(v.id) +
             '?autoplay=1&rel=0" title="' + title + '" ' +
             'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" ' +
             'allowfullscreen></iframe>' +
             '<p class="video-card__title">' + title + '</p>';
    }

    if (v.type === 'mp4') {
      return '<video controls autoplay playsinline preload="metadata" ' +
             (v.poster ? 'poster="' + window.PB.esc(v.poster) + '" ' : '') +
             'title="' + title + '">' +
               '<source src="' + window.PB.esc(v.src) + '" type="video/mp4">' +
               'Вашиот прелистувач не поддржува видео.' +
             '</video>' +
             '<p class="video-card__title">' + title + '</p>';
    }

    if (v.type === 'instagram') {
      return '<iframe src="' + window.PB.esc(v.url.replace(/\/?$/, '/')) + 'embed" ' +
             'title="' + title + '" allowtransparency="true" allowfullscreen></iframe>' +
             '<p class="video-card__title">' + title + '</p>';
    }

    return '<p class="video-card__title">' + title + '</p>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
