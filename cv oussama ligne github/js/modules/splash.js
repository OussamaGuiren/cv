export function initSplash() {
  const splash = document.querySelector('.splash');
  const splashMoreBtn = document.querySelector('.text .splash-more-btn');
  const textElement = document.querySelector('.text');
  const watermark = document.querySelector('.splash-watermark');
  const portrait = document.querySelector('.splash-portrait-container');
  const body = document.body;
  
  if (splash && splashMoreBtn) {
    body.classList.add('splash-active');

    splashMoreBtn.addEventListener('click', () => {
      // Ajouter les classes pour l'animation de disparition
      splash.classList.add('splash-hidden');
      if (textElement) {
        textElement.classList.add('text-hidden');
      }
      if (watermark) {
        watermark.classList.add('watermark-hidden');
      }
      if (portrait) {
        portrait.classList.add('portrait-hidden');
      }

      setTimeout(() => {
        splash.style.display = 'none';
        if (textElement) {
          textElement.style.display = 'none';
        }
        if (watermark) {
          watermark.style.display = 'none';
        }
        if (portrait) {
          portrait.style.display = 'none';
        }
        
        // Désactiver le scroll bloqué APRÈS la disparition du splash
        body.classList.remove('splash-active');
        body.style.overflow = '';
        
        // Déclencher l'événement pour le typewriter
        window.dispatchEvent(new Event('hero-visible'));
        
        // Rafraîchir ScrollTrigger si nécessaire
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 700);
    });
  } else {
    window.dispatchEvent(new Event('hero-visible'));
  }
}
