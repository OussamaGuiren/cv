/**
 * Module d'animation Fluent Design
 * Gère les transitions d'entrée des sections au scroll
 * Uniquement actif sur Tablette et Desktop
 */

export function initScrollAnimations() {
  // Vérification : Uniquement si > 768px
  if (window.innerWidth <= 768) {
    // Mobile : On rend tout visible immédiatement
    document.querySelectorAll('.fluent-section-hidden').forEach(el => {
      el.classList.remove('fluent-section-hidden');
      el.classList.add('fluent-section-visible');
    });
    return;
  }

  // Sélecteurs des éléments à animer
  // On ajoute des sélecteurs génériques pour être sûr de tout attraper
  const targets = document.querySelectorAll(
    '#tab-experience, #tab-projects, #tab-power, #tab-contact, .about-intro-section, .about-photo-section, section.et-slide'
  );

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px', // Déclenche un peu avant le bas
    threshold: 0.1 // 10% visible suffit
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animation
        entry.target.classList.add('fluent-section-visible');
        entry.target.classList.remove('fluent-section-hidden');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  targets.forEach(section => {
    // Ne pas ré-appliquer si déjà visible
    if (!section.classList.contains('fluent-section-visible')) {
      section.classList.add('fluent-section-hidden');
      observer.observe(section);
    }
  });
}
