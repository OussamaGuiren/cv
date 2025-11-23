/**
 * Module d'animation Fluent Design
 * Gère les transitions d'entrée des sections au scroll
 * Uniquement actif sur Tablette et Desktop
 */

export function initScrollAnimations() {
  // Vérification stricte de la taille d'écran (min-width: 769px)
  const isDesktopOrTablet = window.matchMedia('(min-width: 769px)').matches;

  if (!isDesktopOrTablet) {
    // Si on est sur mobile, on s'assure que tout est visible par défaut
    // au cas où des classes resteraient
    document.querySelectorAll('.fluent-section-hidden').forEach(el => {
      el.classList.remove('fluent-section-hidden');
      el.classList.add('fluent-section-visible');
    });
    return;
  }

  // Sélection des sections à animer
  const selectors = [
    '#tab-experience',
    '#tab-projects',
    '#tab-power',
    '#tab-contact',
    '.about-intro-section',
    '.about-photo-section'
  ];
  
  const sections = document.querySelectorAll(selectors.join(', '));

  if (sections.length === 0) return;

  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px 0px -100px 0px', // Déclencher un peu avant que le bas n'arrive, ou quand le haut entre bien
    threshold: 0.1 // 10% de visibilité suffit
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Petit délai pour l'effet "cascade" si plusieurs éléments arrivent en même temps
        requestAnimationFrame(() => {
          entry.target.classList.add('fluent-section-visible');
          entry.target.classList.remove('fluent-section-hidden');
        });
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    // Force l'état initial caché
    section.classList.add('fluent-section-hidden');
    observer.observe(section);
  });
}
