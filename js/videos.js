/* =============================================================================
   VIDEOS — YouTube / MP4 / Instagram
   -----------------------------------------------------------------------------
   Изворот на видеата сè уште не е одлучен, па трите патеки се напишани и
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

  /* Постер + копче за пуштање. Ништо од трети страни не се вчитува уште. */
  function card(v, ratio) {
    var title = window.PB.esc(v.title || 'Видео');
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
