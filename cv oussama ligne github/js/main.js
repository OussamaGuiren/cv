import { startTypewriterSequence } from './modules/utils.js';
import { initSplash } from './modules/splash.js';
import { initNavigation } from './modules/navigation.js';
import { initTimeline } from './modules/timeline.js';
import { initModals } from './modules/modals.js';
import { initForm } from './modules/contact-form.js';
// import { initScrollAnimations } from './modules/animation.js'; // Désactivé pour thème Microsoft épuré

/**
 * Animation de révélation progressive de la photo dans la section "Qui suis-je"
 * Effet de masque circulaire qui se révèle progressivement au scroll
 * Inspiré de : https://tympanus.net/codrops/2023/07/05/on-scroll-svg-filter-effect/
 */
function initAboutPhotoReveal() {
  // Vérifier que GSAP et ScrollTrigger sont disponibles
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP ou ScrollTrigger non disponible');
    return;
  }

  // Enregistrer le plugin ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const photoContainer = document.querySelector('.about-image-container');
  const circleMask = document.querySelector('.circle-reveal');
  
  if (!photoContainer || !circleMask) {
    return;
  }

  // Fonction pour calculer le rayon maximum
  const calculateMaxRadius = () => {
    const containerRect = photoContainer.getBoundingClientRect();
    // Utilise la diagonale du container pour s'assurer que le cercle couvre tout
    return Math.sqrt(
      Math.pow(containerRect.width, 2) + Math.pow(containerRect.height, 2)
    ) / 2;
  };

  // Initialiser le rayon à 0
  const maxRadius = calculateMaxRadius();
  gsap.set(circleMask, { attr: { r: 0 } });

  // Animation du masque circulaire qui se révèle progressivement
  // Le rayon du cercle passe de 0 à maxRadius au scroll
  gsap.to(circleMask, {
    scrollTrigger: {
      trigger: '.about-photo-section',
      start: 'top 85%', // Démarre quand la section arrive à 85% de la hauteur de fenêtre
      end: 'top 30%', // Se termine quand la section arrive à 30% de la hauteur de fenêtre
      scrub: 2, // Animation liée au scroll (2 = fluide et doux)
      markers: false, // Mettre à true pour debug
      invalidateOnRefresh: true, // Recalcule les positions si la page change
      toggleActions: 'play none reverse none'
    },
    attr: {
      r: maxRadius // Le rayon grandit progressivement pour révéler l'image
    },
    ease: 'power1.out'
  });

  // Rafraîchir ScrollTrigger après le chargement des images et au redimensionnement
  const svgImage = document.querySelector('.about-photo-svg image');
  if (svgImage) {
    if (svgImage.complete) {
      ScrollTrigger.refresh();
    } else {
      svgImage.addEventListener('load', () => {
        ScrollTrigger.refresh();
      });
    }
  }

  // Rafraîchir aussi au redimensionnement de la fenêtre
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newMaxRadius = calculateMaxRadius();
      // Mettre à jour l'animation avec le nouveau rayon
      gsap.to(circleMask, {
        attr: { r: newMaxRadius },
        duration: 0,
        overwrite: true
      });
      ScrollTrigger.refresh();
    }, 100);
  });
}

// Add CSS class when fonts are loaded
try {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => document.documentElement.classList.add('fonts-ready'));
  } else {
    document.documentElement.classList.add('fonts-ready');
  }
} catch (e) { document.documentElement.classList.add('fonts-ready'); }

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initNavigation();
  initTimeline();
  initModals();
  initForm();
  
  // Animations de scroll désactivées pour un thème Microsoft épuré
  // setTimeout(() => {
  //   initScrollAnimations();
  // }, 100);
  
  // Fonction pour initialiser les animations après le splash
  const initAfterSplash = () => {
    try { 
      document.body.classList.add('hero-visible');
      setTimeout(startTypewriterSequence, 200);
      
      // Animation de révélation de la photo au scroll - initialisée après la fermeture du splash
      setTimeout(() => {
        initAboutPhotoReveal();
      }, 500);
    } catch (e) { 
      console.error('Erreur lors de l\'initialisation après splash:', e);
    }
  };
  
  // Typewriter starts when hero is visible (event dispatched by splash)
  window.addEventListener('hero-visible', initAfterSplash);
  
  // Si le splash n'existe pas ou n'est pas utilisé, initialiser directement
  const splash = document.querySelector('.splash');
  if (!splash || !document.querySelector('.splash-more-btn')) {
    // Pas de splash screen, initialiser directement
    setTimeout(initAfterSplash, 100);
  }
});
