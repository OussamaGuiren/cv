/**
 * Navigation : ombre de l'en-tête au défilement, lien actif, menu mobile.
 * Le défilement doux est géré en CSS (scroll-behavior + scroll-padding-top),
 * donc aucun calcul de position n'est nécessaire ici.
 */

const NAV_BREAKPOINT = 900;

export function initNav() {
  initStuckHeader();
  initScrollSpy();
  initMobileNav();
  initToTop();
}

/* L'en-tête gagne une bordure et une ombre dès qu'on quitte le haut de page. */
function initStuckHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-stuck', !entry.isIntersecting),
    { rootMargin: '0px' }
  ).observe(sentinel);
}

/* La flèche de retour en haut : elle apparaît une fois la première hauteur
   d'écran passée. Un repère invisible, haut d'un écran, sert de déclencheur —
   inutile d'écouter le défilement à chaque image. */
function initToTop() {
  const bouton = document.getElementById('toTop');
  if (!bouton) return;

  const repere = document.createElement('div');
  repere.className = 'to-top-sentinel';
  repere.setAttribute('aria-hidden', 'true');
  document.body.prepend(repere);

  new IntersectionObserver(
    ([entree]) => bouton.classList.toggle('is-visible', !entree.isIntersecting),
    { rootMargin: '0px' }
  ).observe(repere);
}

/* Met en évidence le lien de la section visible. Le bouton Contact de
   l'en-tête en fait partie : il mène lui aussi à une section. */
function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav-link, .header-cta')];
  if (!links.length) return;

  const byId = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href')?.slice(1);
    const section = id && document.getElementById(id);
    if (section) byId.set(section, link);
  });
  if (!byId.size) return;

  const visible = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });

      // La section la plus haute parmi celles visibles fait foi.
      const current = [...visible].sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
      )[0];

      links.forEach((link) => link.classList.remove('is-active'));
      if (current) byId.get(current)?.classList.add('is-active');
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  byId.forEach((_link, section) => observer.observe(section));
}

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mobileNav');
  const scrim = document.getElementById('navScrim');
  if (!toggle || !nav || !scrim) return;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fermer le menu');
    nav.hidden = false;
    scrim.hidden = false;
    document.body.classList.add('nav-open');
  }

  function close({ refocus = false } = {}) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    nav.hidden = true;
    scrim.hidden = true;
    document.body.classList.remove('nav-open');
    if (refocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  scrim.addEventListener('click', () => close());

  // Un clic sur un lien referme le menu ; la navigation reste native.
  nav.querySelectorAll('a, .btn').forEach((el) =>
    el.addEventListener('click', () => close())
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close({ refocus: true });
  });

  // Repasser en desktop pendant que le menu est ouvert doit le refermer.
  window.addEventListener('resize', () => {
    if (window.innerWidth > NAV_BREAKPOINT && isOpen()) close();
  });
}
