/* =============================================================================
   SECTIONS — услуги, за мене, тизер за портфолио, контакт
   -----------------------------------------------------------------------------
   Сите овие делови се цртаат од content/site-data.js за да нема иста реченица
   запишана во два фајла.
   ============================================================================= */
(function () {
  'use strict';

  var CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 6.5 9.5 17 4 11.5"/></svg>';

  function init() {
    var S = window.SITE;
    if (!S) return;

    renderServiceCards(S);
    renderServiceBlocks(S);
    renderPortfolioTeaser(S);
    renderAbout(S);
    renderContact(S);

    // Новововметнатата содржина мора да се пријави за влезна анимација,
    // инаку останува засекогаш на opacity 0.
    if (window.PBReveal) window.PBReveal.scan();
  }

  /* ---------------------------------------------------------------------------
     Тизер картички за услуги (почетна страница)
     ------------------------------------------------------------------------ */
  function renderServiceCards(S) {
    var wrap = document.querySelector('[data-service-cards]');
    if (!wrap) return;

    // Целата картичка е кликлива, но насловот останува вистински <h3>:
    // линкот се растегнува преку картичката преку ::after (види .card__more a
    // во components.css). Така тап-целта е цела картичка, а структурата на
    // насловите останува исправна за Google и за читачите на екран.
    wrap.innerHTML = (S.services || []).map(function (s) {
      return '<article class="card" data-color="' + window.PB.esc(s.color) + '" data-reveal>' +
               '<div class="card__media">' +
                 window.PB.slot(
                   s.image ? { src: s.image, alt: s.imageAlt } : null,
                   { ratio: "4 / 3", tone: s.color }
                 ) +
               '</div>' +
               '<div class="card__body">' +
                 '<h3 class="card__title">' + window.PB.esc(s.title) + '</h3>' +
                 '<p class="card__text">' + window.PB.esc(s.lead) + '</p>' +
                 '<p class="card__more">' +
                   '<a href="uslugi.html#' + window.PB.esc(s.slug) + '">Дознај повеќе' +
                   '<span class="btn__arrow" aria-hidden="true">&rarr;</span></a>' +
                 '</p>' +
               '</div>' +
             '</article>';
    }).join('');
  }

  /* ---------------------------------------------------------------------------
     Целосни блокови за услуги (страница „Услуги")
     Секој втор блок ја менува страната — ритам наместо монотонија.
     ------------------------------------------------------------------------ */
  function renderServiceBlocks(S) {
    var wrap = document.querySelector('[data-service-blocks]');
    if (!wrap) return;

    wrap.innerHTML = (S.services || []).map(function (s, i) {
      var band = i % 2 === 1;
      return '<section class="service-block' + (band ? ' band' : '') + '" ' +
               'id="' + window.PB.esc(s.slug) + '" ' +
               'data-color="' + window.PB.esc(s.color) + '">' +
               '<div class="container">' +
                 '<div class="service-block__grid">' +
                   '<div class="service-block__media" data-reveal>' +
                     window.PB.slot(
                       s.image ? { src: s.image, alt: s.imageAlt } : null,
                       { ratio: "4 / 5", tone: s.color, radius: "999px 999px 24px 24px" }
                     ) +
                   '</div>' +
                   '<div data-reveal>' +
                     '<p class="eyebrow">Услуга</p>' +
                     '<h2>' + window.PB.esc(s.title) + '</h2>' +
                     '<p class="lead">' + window.PB.esc(s.lead) + '</p>' +
                     '<p>' + window.PB.esc(s.body) + '</p>' +
                     '<ul class="checklist">' +
                       (s.points || []).map(function (p) {
                         return '<li>' + CHECK + '<span>' + window.PB.esc(p) + '</span></li>';
                       }).join('') +
                     '</ul>' +
                     '<p style="margin-top:var(--space-6)">' +
                       '<a class="btn ' + (band ? 'btn--onband' : 'btn--primary') + '" href="kontakt.html">' +
                         'Прашај за термин <span class="btn__arrow" aria-hidden="true">&rarr;</span>' +
                       '</a>' +
                     '</p>' +
                   '</div>' +
                 '</div>' +
               '</div>' +
             '</section>';
    }).join('');
  }

  /* ---------------------------------------------------------------------------
     Тизер за портфолио (почетна страница)
     ------------------------------------------------------------------------ */
  function renderPortfolioTeaser(S) {
    var wrap = document.querySelector('[data-portfolio-teaser]');
    if (!wrap) return;

    // Три слики, не шест: една голема лево преку двата реда, две помали десно.
    // Мрежа од шест еднакви плочки се читаше како каталог наместо портфолио.
    var items = (S.gallery || []).slice(0, 3);
    var ratios = ['4 / 5', '4 / 3', '4 / 3'];
    var html = '';

    for (var i = 0; i < 3; i++) {
      html += '<div data-reveal>' +
                window.PB.slot(items[i] || null, {
                  ratio: ratios[i],
                  index: i,
                  radius: '24px'
                }) +
              '</div>';
    }
    wrap.innerHTML = html;
  }

  /* ---------------------------------------------------------------------------
     „За мене"
     ------------------------------------------------------------------------ */
  function renderAbout(S) {
    var a = S.about || {};

    // Огромното име на врвот
    var nameEl = document.querySelector('[data-about-name]');
    if (nameEl && a.name) {
      nameEl.textContent = a.name;
      fitName(nameEl);
      // Имињата се со непозната должина, па по секоја промена на ширината
      // мора да се премери повторно.
      var t;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () { fitName(nameEl); }, 150);
      });
    }

    /* Портретот што го преклопува името.
       Исечена слика со проѕирна позадина стои слободно; обична правоаголна
       слика (и placeholder-от додека сликата ја нема) добива лак-маска за да
       седи намерно наместо да изгледа залепена. */
    var portrait = document.querySelector('[data-about-portrait]');
    if (portrait) {
      var hasCutout = !!(a.portrait && a.portraitCutout);
      portrait.classList.add(hasCutout
        ? 'about-hero__portrait--cutout'
        : 'about-hero__portrait--framed');

      if (hasCutout) {
        portrait.innerHTML = '<img src="' + window.PB.esc(a.portrait) + '" ' +
          'alt="' + window.PB.esc(a.portraitAlt || 'Портрет на фотографот') + '" ' +
          'decoding="async">';
      } else {
        portrait.innerHTML = window.PB.slot(
          a.portrait ? { src: a.portrait, alt: a.portraitAlt || 'Портрет на фотографот' } : null,
          { ratio: '4 / 5', tone: 'cream', label: 'Портрет на фотографот' }
        );
      }
    }

    var intro = document.querySelector('[data-about-intro]');
    if (intro && a.intro) intro.textContent = a.intro;

    var body = document.querySelector('[data-about-text]');
    if (body) {
      body.innerHTML = (a.paragraphs || []).map(function (p) {
        return '<p>' + window.PB.esc(p) + '</p>';
      }).join('');
    }

    // Нумерирани обоени блокови
    var blocks = document.querySelector('[data-about-blocks]');
    if (blocks) {
      blocks.innerHTML = (a.blocks || []).map(function (b, i) {
        var num = ('0' + (i + 1)).slice(-2);
        return '<div class="about-block" data-color="' + window.PB.esc(b.color) + '" data-reveal>' +
                 '<span class="about-block__num">' + num + '</span>' +
                 '<h3 class="about-block__title">' + window.PB.esc(b.title) + '</h3>' +
                 '<p class="about-block__text">' + window.PB.esc(b.text) + '</p>' +
               '</div>';
      }).join('');

      /* Ротираниот збор оди ВНАТРЕ во првиот блок за да ја наследи неговата
         боја на текст. Ако стоеше надвор, ќе беше темен текст без разлика
         каква боја е блокот под него. */
      var firstBlock = blocks.firstElementChild;
      if (firstBlock) {
        firstBlock.insertAdjacentHTML('afterbegin',
          '<span class="about-rail" aria-hidden="true">ПРИКАЗНА</span>');
      }
    }

    // Мрежа 2×2 со натписи врз сликите
    var photos = document.querySelector('[data-about-photos]');
    if (photos) {
      photos.innerHTML = (a.photos || []).map(function (p, i) {
        return '<figure class="photo-grid__item" data-reveal>' +
                 window.PB.slot(
                   p.src ? { src: p.src, alt: p.alt } : null,
                   { ratio: '4 / 3', index: i, label: p.title || 'Слика доаѓа наскоро' }
                 ) +
                 '<figcaption class="photo-grid__caption">' +
                   window.PB.esc(p.title || '') +
                   (p.subtitle ? '<span>' + window.PB.esc(p.subtitle) + '</span>' : '') +
                 '</figcaption>' +
               '</figure>';
      }).join('');
    }

    var facts = document.querySelector('[data-about-facts]');
    if (facts) {
      facts.innerHTML = (a.facts || []).map(function (f) {
        return '<div class="fact">' +
                 '<p class="fact__label">' + window.PB.esc(f.label) + '</p>' +
                 '<p class="fact__value">' + window.PB.esc(f.value) + '</p>' +
               '</div>';
      }).join('');
    }
  }

  /**
   * Го смалува огромното име додека не собере во еден ред.
   *
   * Името го внесува клиентот и може да биде „Ана" или „Александра" — CSS не
   * може да измери текст, па која било фиксна clamp() вредност или ќе биде
   * премала за кратко име или ќе прелева со долго. Затоа мериме вистински.
   */
  function fitName(el) {
    if (!el || !el.textContent.trim()) return;

    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = '';                       // врати ја вредноста од CSS

    // clientWidth го вклучува padding-от на контејнерот — ако мериме по него,
    // името допира до самиот раб на екранот. Ни треба внатрешната ширина.
    var host = el.parentElement;
    var cs = getComputedStyle(host);
    var avail = host.clientWidth
      - parseFloat(cs.paddingLeft)
      - parseFloat(cs.paddingRight);
    if (!avail || avail <= 0) return;

    var size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = size + 'px';

    // Чувар од бесконечен циклус ако мерењето врати нула
    var guard = 0;
    while (el.scrollWidth > avail && size > 28 && guard++ < 80) {
      size -= Math.max(1, size * 0.04);
      el.style.fontSize = size + 'px';
    }
  }

  /* ---------------------------------------------------------------------------
     Контакт — работно време и картата
     ------------------------------------------------------------------------ */
  function renderContact(S) {
    var c = S.contact || {};

    var hours = document.querySelector('[data-hours]');
    if (hours) {
      hours.innerHTML = (c.hours || []).map(function (h) {
        return '<li><span>' + window.PB.esc(h.days) + '</span><span>' + window.PB.esc(h.time) + '</span></li>';
      }).join('');
    }

    var map = document.querySelector('[data-map]');
    if (map) {
      if (c.mapsEmbed) {
        map.innerHTML = '<iframe class="map" src="' + window.PB.esc(c.mapsEmbed) + '" ' +
                        'title="Локација на студиото на карта" loading="lazy" ' +
                        'referrerpolicy="no-referrer-when-downgrade"></iframe>';
      } else {
        // Уште нема embed линк — покажи корисен placeholder, не скршена карта
        map.innerHTML = window.PB.placeholder({
          index: 2,
          ratio: '4 / 3',
          radius: '24px',
          label: 'Картата ќе се појави тука'
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
