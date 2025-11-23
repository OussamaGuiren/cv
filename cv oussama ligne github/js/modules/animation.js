/**
 * Module d'animation GSAP
 * Remplace l'ancienne implémentation IntersectionObserver par GSAP ScrollTrigger
 */

export function initScrollAnimations() {
  // Enregistrement du plugin ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Configuration globale
  const animConfig = {
    duration: 1,
    ease: "power3.out",
    yOffset: 50,
    stagger: 0.1
  };

  // Sélecteurs des sections principales à animer
  const sectionSelectors = [
    'main > section',
    '.about-intro-section',
    '.about-photo-section',
    '#tab-contact',
    '#tab-projects',
    '#tab-power',
    '#tab-experience'
  ];

  const sections = document.querySelectorAll(sectionSelectors.join(', '));

  sections.forEach(section => {
    // On cherche les enfants directs ou importants à animer à l'intérieur de la section
    // Cela permet un effet de "cascade" (stagger)
    const elements = section.querySelectorAll('h1, h2, h3, p, .btn-primary, .card, .project-card, .tech-ticker-wrapper, .timeline-container, .contact-card, .check-list, .about-image-container, .about-text-container, button');
    
    // Si la section n'a pas d'enfants spécifiques identifiés, on anime la section elle-même
    const targets = elements.length > 0 ? elements : section;

    gsap.fromTo(targets, 
      { 
        y: animConfig.yOffset, 
        opacity: 0,
        autoAlpha: 0 // Combine opacity et visibility pour éviter les flashs
      },
      {
        scrollTrigger: {
          trigger: section,
          start: "top 85%", // Démarre quand le haut de la section arrive à 85% de la hauteur de fenêtre
          toggleActions: "play none none reverse" // Joue l'anim à l'entrée, reverse à la sortie vers le haut
        },
        y: 0,
        opacity: 1,
        autoAlpha: 1,
        duration: animConfig.duration,
        stagger: elements.length > 0 ? animConfig.stagger : 0,
        ease: animConfig.ease,
        overwrite: "auto" // Évite les conflits si on scroll vite
      }
    );
  });

  // Animation spécifique pour les éléments qui pourraient être ajoutés dynamiquement ou qui nécessitent une attention particulière
  refreshScrollTrigger();
}

// Fonction utilitaire pour rafraîchir ScrollTrigger si le DOM change (ex: chargement images)
export function refreshScrollTrigger() {
  ScrollTrigger.refresh();
}
