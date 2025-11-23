/**
 * Module d'animation Fluent Design (Version Robuste)
 */

export function initScrollAnimations() {
  // 1. Vérification Mobile (Désactive sur petits écrans)
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.fluent-section-hidden').forEach(el => {
      el.classList.remove('fluent-section-hidden');
      el.classList.add('fluent-section-visible');
    });
    return;
  }

  // 2. Sélection Large des Sections
  // On cible toutes les sections importantes
  const selectors = [
    'main > section',
    '.about-intro-section',
    '.about-photo-section',
    '#tab-contact',
    '#tab-projects',
    '#tab-power',
    '#tab-experience'
  ];
  
  const sections = document.querySelectorAll(selectors.join(', '));

  if (sections.length === 0) return;

  // 3. Configuration de l'Observer
  const observerOptions = {
    root: null, 
    threshold: 0.1, // 10% de visibilité suffit
    rootMargin: "0px 0px -50px 0px" 
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Ajout de la classe visible
        entry.target.classList.add('fluent-section-visible');
        entry.target.classList.remove('fluent-section-hidden');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 4. Application initiale
  sections.forEach(section => {
    // Si pas déjà visible, on cache et on observe
    if (!section.classList.contains('fluent-section-visible')) {
      section.classList.add('fluent-section-hidden');
      observer.observe(section);
    }
  });
}
