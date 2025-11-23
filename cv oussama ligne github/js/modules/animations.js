/**
 * Module d'animation Fluent Design (Version Robuste)
 */

export function initScrollAnimations() {
  console.log("Initialisation des animations Fluent Design...");

  // 1. Vérification Mobile
  if (window.innerWidth <= 768) {
    console.log("Mode Mobile détecté : Animations désactivées.");
    document.querySelectorAll('.fluent-section-hidden').forEach(el => {
      el.classList.remove('fluent-section-hidden');
      el.classList.add('fluent-section-visible');
    });
    return;
  }

  // 2. Sélection Large des Sections
  // On cible toutes les sections directes du main et les div spécifiques
  const sections = document.querySelectorAll('main > section, .about-intro-section, .about-photo-section, #tab-contact, #tab-projects, #tab-power, #tab-experience');
  
  console.log(`${sections.length} sections trouvées pour l'animation.`);

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
        // console.log("Section visible : ", entry.target.id || entry.target.className);
        entry.target.classList.add('fluent-section-visible');
        entry.target.classList.remove('fluent-section-hidden');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 4. Application
  sections.forEach(section => {
    // Si pas déjà visible, on cache et on observe
    if (!section.classList.contains('fluent-section-visible')) {
      section.classList.add('fluent-section-hidden');
      observer.observe(section);
    }
  });
}
