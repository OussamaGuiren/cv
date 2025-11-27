import { startTypewriterSequence } from './modules/utils.js';
import { initSplash } from './modules/splash.js';
import { initNavigation } from './modules/navigation.js';
import { initTimeline } from './modules/timeline.js';
import { initModals } from './modules/modals.js';
import { initForm } from './modules/contact-form.js';
import { initAboutPhotoReveal } from './modules/about-photo-reveal.js';
// import { initScrollAnimations } from './modules/animation.js'; // Désactivé pour thème Microsoft épuré

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
