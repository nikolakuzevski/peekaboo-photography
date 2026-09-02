/* =============================================================================
   NAV — мобилно мени + означување на активната страница
   ============================================================================= */
(function () {
  'use strict';

  function init() {
    markCurrentPage();
    setupDrawer();
    fillContactLinks();
    setYear();
  }

  /* ---------------------------------------------------------------------------
     Активна страница. Хедерот е вистински HTML во секој фајл (заради SEO),
     па активниот линк го одредуваме тука наместо рачно во седум фајла.
     ------------------------------------------------------------------------ */
  function markCurrentPage() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav__link, .drawer__link');

    Array.prototype.forEach.call(links, function (a) {
      var target = a.getAttribute('href');
      if (!target || target.charAt(0) === '#' || /^https?:/.test(target)) return;
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------------------------------------------------------------------------
     Drawer: отвора, затвора со Esc или клик надвор, го заробува фокусот,
     и го враќа фокусот на копчето што го отворило.
     ------------------------------------------------------------------------ */
  function setupDrawer() {
    var toggle = document.querySelector('[data-drawer-toggle]');
    var drawer = document.getElementById('mobile-drawer');
    if (!toggle || !drawer) return;

    var closeBtn = drawer.querySelector('[data-drawer-close]');
    var lastFocused = null;

    function focusables() {
      return drawer.querySelectorAll('a[href], button:not([disabled])');
    }

    function open() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      drawer.removeAttribute('inert');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      var first = focusables()[0];
      if (first) first.focus();
    }

    function close() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) close(); else open();
    });

    if (closeBtn) closeBtn.addEventListener('click', close);

    // Линк во drawer-от води на нова страница — затвори за да не остане
    // заклучен скрол ако навигацијата се откаже.
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a[href]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;

      if (e.key === 'Escape') { close(); return; }

      if (e.key === 'Tab') {
        var list = focusables();
        if (!list.length) return;
        var first = list[0];
        var last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // Ако прозорецот се рашири до десктоп додека drawer-от е отворен,
    // затвори го — инаку скролот останува заклучен.
    window.matchMedia('(min-width: 980px)').addEventListener('change', function (e) {
      if (e.matches && drawer.classList.contains('is-open')) close();
    });

    drawer.setAttribute('inert', '');
  }

  /* ---------------------------------------------------------------------------
     Контакт податоците живеат само во content/site-data.js. Тука ги пополнуваме
     сите линкови и текстови на сајтот, за да нема број запишан во седум фајла.
     ------------------------------------------------------------------------ */
  function fillContactLinks() {
    var S = window.SITE;
    if (!S || !S.contact) return;
    var c = S.contact;

    var map = {
      'phone-link': { href: 'tel:' + c.phoneRaw, text: c.phoneDisplay },
      'viber-link': { href: 'viber://chat?number=' + encodeURIComponent(c.viber) },
      'email-link': { href: 'mailto:' + c.email, text: c.email },
      'instagram-link': { href: c.instagram },
      'facebook-link': { href: c.facebook },
      'maps-link': { href: c.mapsLink }
    };

    Object.keys(map).forEach(function (key) {
      var cfg = map[key];
      var nodes = document.querySelectorAll('[data-link="' + key + '"]');
      Array.prototype.forEach.call(nodes, function (el) {
        // Празна вредност во site-data.js значи „немам ова" — тргни го копчето
        if (!cfg.href || /XXX/.test(cfg.href)) {
          if (key === 'facebook-link') { el.remove(); return; }
        }
        el.setAttribute('href', cfg.href || '#');
        if (cfg.text) {
          var slot = el.querySelector('[data-slot="value"]');
          if (slot) slot.textContent = cfg.text;
        }
      });
    });

    // Текстуални места
    setText('[data-field="phoneDisplay"]', c.phoneDisplay);
    setText('[data-field="email"]', c.email);
    setText('[data-field="address"]', c.address);
    setText('[data-field="city"]', c.city);
    setText('[data-field="instagramHandle"]', c.instagramHandle);
    setText('[data-field="photographer"]', c.photographer);
  }

  function setText(selector, value) {
    if (!value) return;
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      el.textContent = value;
    });
  }

  function setYear() {
    setText('[data-field="year"]', String(new Date().getFullYear()));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
