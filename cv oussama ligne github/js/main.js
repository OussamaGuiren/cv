import { initNav } from './modules/nav.js?v=7acb12c2';
import { initMotion } from './modules/motion.js?v=a74d2358';
import { initGalleryNav } from './modules/gallery-nav.js?v=cde42612';
import { initHeroAccent } from './modules/hero-accent.js?v=56e00700';
import { initAmbient } from './modules/ambient.js?v=96390cda';
import { initNpc } from './modules/npc.js?v=ae405782';
import { initModals } from './modules/modals.js?v=9ef4a1b4';
import { initContactForm } from './modules/contact-form.js?v=b8528ca5';

function init() {
  initNav();
  initHeroAccent();   // le trait de pixels du nom, l'allumage des references
  initGalleryNav();   // les reperes des galeries quand elles se font glisser
  initMotion();       // l'epinglage des galeries ; sans GSAP, elles se font glisser nativement
  initAmbient();
  initNpc();
  initModals();
  initContactForm();

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
