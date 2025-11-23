/**
 * Module d'animation Fluent Design
 * Gère les transitions d'entrée des sections au scroll
 * Uniquement actif sur Tablette et Desktop
 */

export function initScrollAnimations() {
  // Vérification de la taille d'écran (min-width: 769px)
  const isDesktopOrTablet = window.matchMedia('(min-width: 769px)').matches;

  if (!isDesktopOrTablet) return;

  // Sélection des sections à animer
  // On cible les sections principales définies par leur ID ou classe
  const sections = document.querySelectorAll(
    '#tab-experience, #tab-projects, #tab-power, #tab-contact, .about-intro-section, .about-photo-section'
  );

  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px',
    threshold: 0.15 // Déclencher quand 15% de la section est visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Ajouter la classe visible pour lancer l'animation
        entry.target.classList.add('fluent-section-visible');
        
        // On arrête d'observer une fois animé (animation one-shot)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    // Ajouter la classe initiale cachée
    section.classList.add('fluent-section-hidden');
    // Démarrer l'observation
    observer.observe(section);
  });
}
