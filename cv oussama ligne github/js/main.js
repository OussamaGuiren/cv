import { startTypewriterSequence } from './modules/utils.js';
import { initSplash } from './modules/splash.js';
import { initNavigation } from './modules/navigation.js';
import { initTimeline } from './modules/timeline.js';
import { initModals } from './modules/modals.js';
import { initForm } from './modules/contact-form.js';
// import { initScrollAnimations } from './modules/animation.js'; // Désactivé pour thème Microsoft épuré

/**
 * Animation de révélation progressive de la photo dans la section "Qui suis-je"
 * La photo glisse depuis la droite vers sa position au scroll
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
  const photo = document.querySelector('.about-photo-full');
  
  if (!photoContainer || !photo) {
    return;
  }

  // Animation de glissement depuis la droite
  // La photo commence hors de la div (à droite) et glisse doucement vers sa position
  gsap.fromTo(photo, 
    {
      x: '100%', // Commence complètement à droite (hors de la div)
      opacity: 0, // Commence invisible pour un effet plus doux
    },
    {
      scrollTrigger: {
        trigger: '.about-photo-section', // Utilise la section complète comme trigger
        start: 'top 85%', // Démarre quand la section arrive à 85% de la hauteur de fenêtre
        end: 'top 30%', // Se termine quand la section arrive à 30% de la hauteur de fenêtre
        scrub: 1.5, // Animation liée au scroll (1.5 = fluide et doux)
        markers: false, // Mettre à true pour debug
        invalidateOnRefresh: true, // Recalcule les positions si la page change
      },
      x: '0%', // Finit à sa position normale (centrée dans la div)
      opacity: 1, // Finit complètement visible
      ease: 'power2.out', // Courbe d'animation douce et naturelle
    }
  );

  // Rafraîchir ScrollTrigger après le chargement des images
  if (photo.complete) {
    ScrollTrigger.refresh();
  } else {
    photo.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }
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
