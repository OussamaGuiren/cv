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
  // Ensure galleries with 1/2 cards keep consistent column counts even if :has() is not supported
  function normalizeGalleryColumns() {
    document.querySelectorAll('.gallery').forEach(gallery => {
      const projectCards = Array.from(gallery.children).filter(c => c.classList && c.classList.contains('project-card'));
      const count = projectCards.length;
      gallery.classList.remove('gallery-one','gallery-two','gallery-three');
      if (count === 1) gallery.classList.add('gallery-one');
      else if (count === 2) gallery.classList.add('gallery-two');
      else gallery.classList.add('gallery-three');
    });
  }
  normalizeGalleryColumns();
  // Recompute on window load or if gallery content changes
  window.addEventListener('load', normalizeGalleryColumns);
  window.addEventListener('pageshow', normalizeGalleryColumns);
  
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
