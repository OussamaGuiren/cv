import { startTypewriterSequence } from './modules/utils.js';
import { initSplash } from './modules/splash.js';
import { initNavigation } from './modules/navigation.js';
import { initTimeline } from './modules/timeline.js';
import { initModals } from './modules/modals.js';
import { initForm } from './modules/contact-form.js';
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
  
  // Typewriter starts when hero is visible (event dispatched by splash)
  window.addEventListener('hero-visible', () => {
    try { 
      document.body.classList.add('hero-visible');
      setTimeout(startTypewriterSequence, 200);
    } catch (e) { /* ignore */ }
  });
});
