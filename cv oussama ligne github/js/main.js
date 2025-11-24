import { startTypewriterSequence } from './modules/utils.js';
import { initSplash } from './modules/splash.js';
import { initNavigation } from './modules/navigation.js';
import { initTimeline } from './modules/timeline.js';
import { initModals } from './modules/modals.js';
import { initForm } from './modules/contact-form.js';
import { initScrollAnimations, refreshScrollTrigger } from './modules/animation.js';

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
  
  // Lancer les animations de scroll avec un léger délai pour garantir le rendu initial
  setTimeout(() => {
    initScrollAnimations();
  }, 100);
  
  // Typewriter starts when hero is visible (event dispatched by splash)
  window.addEventListener('hero-visible', () => {
    try { 
      document.body.classList.add('hero-visible');
      setTimeout(startTypewriterSequence, 200);
    } catch (e) { /* ignore */ }
  });
});

// Handle bfcache restore
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    try {
      refreshScrollTrigger();
      // Ensure typewriter text is visible if needed (fallback)
      const title = document.querySelector('.et-hero-tabs h1[data-typewriter]');
      if (title && !title.textContent && title.dataset.typewriter) {
          title.textContent = title.dataset.typewriter;
          title.classList.add('typed');
      }
    } catch(e) { /* ignore */ }
  }
});
