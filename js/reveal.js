/* =============================================================================
   REVEAL — влез на секција при скрол
   -----------------------------------------------------------------------------
   Суптилно: 12px патување, 400ms, се пали ЕДНАШ. Ништо не се реанимира
   при враќање нагоре.

   ВАЖНО 1: класата `js-reveal` се додава веднаш, на самиот почеток (затоа овој
   фајл се вчитува во <head> без defer). Таа класа е таа што ги крие
   елементите — види base.css. Ако фајлот не се вчита или JS е исклучен,
   содржината останува целосно видлива.

   ВАЖНО 2: делови од сајтот се цртаат од content/site-data.js ПОСЛЕ првото
   скенирање. Затоа `scan()` е изложена како window.PBReveal.scan() — секој
   рендерер ја повикува откако ќе вметне нова содржина. Без тоа, новововметнатите
   елементи би останале засекогаш невидливи.
   ============================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    // Без анимации — но `scan` мора да постои за да не пукаат повиците од другите фајлови.
    window.PBReveal = { scan: function () {} };
    return;
  }

  document.documentElement.classList.add('js-reveal');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target); // еднаш, и готово
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

  function staggerDelay(el) {
    // Stagger внатре во група, ограничен на првите 6 — мрежа од 20 плочки
    // не смее да чека цела секунда за последната.
    var group = el.closest('[data-reveal-group]');
    if (!group) return 0;
    var siblings = Array.prototype.filter.call(
      group.querySelectorAll('[data-reveal]'),
      function (n) { return n.closest('[data-reveal-group]') === group; }
    );
    return Math.min(Math.max(siblings.indexOf(el), 0), 5) * 50;
  }

  /**
   * Скенира за нови [data-reveal] елементи. Безбедно е да се повика повеќе пати —
   * веќе обработените се прескокнуваат преку data-reveal-bound.
   */
  function scan() {
    var items = document.querySelectorAll('[data-reveal]:not([data-reveal-bound])');
    if (!items.length) return;

    var onscreen = [];

    Array.prototype.forEach.call(items, function (el) {
      el.setAttribute('data-reveal-bound', '');

      var delay = staggerDelay(el);
      if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');

      var box = el.getBoundingClientRect();
      var inView = box.top < window.innerHeight * 0.92 && box.bottom > 0;

      if (inView) onscreen.push(el);
      else io.observe(el);
    });

    if (onscreen.length) flush(onscreen);
  }

  /**
   * Ги открива елементите по двоен rAF — првиот кадар ја исцртува почетната
   * состојба (opacity 0), вториот ја активира транзицијата. Без тоа содржината
   * само би трепнала на место наместо да се појави меко.
   *
   * МРЕЖА ЗА БЕЗБЕДНОСТ: во скриено јазиче прелистувачот воопшто не пали rAF.
   * Без овој setTimeout содржината би останала невидлива. Подобро е да се
   * појави без анимација отколку да не се појави.
   */
  function flush(list) {
    var done = false;
    function run() {
      if (done) return;
      done = true;
      list.forEach(function (el) { el.classList.add('is-visible'); });
    }
    function arm() {
      requestAnimationFrame(function () { requestAnimationFrame(run); });
      setTimeout(run, 600);
    }

    if (!document.hidden) { arm(); return; }

    // Страницата е отворена во позадинско јазиче. Тука rAF воопшто не се пали,
    // па чекаме јазичето да стане видливо — така анимацијата не се троши
    // додека никој не гледа, а содржината сепак не останува заглавена невидлива.
    document.addEventListener('visibilitychange', function onShow() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onShow);
      arm();
    });
  }

  window.PBReveal = { scan: scan };

  function start() {
    scan();
    // Втор премин по вчитување на фонтовите и сликите: распоредот се поместува,
    // па нешто што било под преломот може веќе да е во видното поле.
    window.addEventListener('load', scan, { once: true });

    // Ако страницата се отвори во скриено јазиче, IntersectionObserver и rAF
    // мируваат. Кога јазичето ќе стане видливо, скенирај повторно.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) scan();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
