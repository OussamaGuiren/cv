export function initSplash() {
    const splash = document.querySelector('.splash');
    const splashMoreBtn = document.querySelector('.splash-more-btn');
    const body = document.body;
    
    if (splash && splashMoreBtn) {
      body.classList.add('splash-active');
  
      splashMoreBtn.addEventListener('click', () => {
        splash.classList.add('splash-hidden');
        
        setTimeout(() => {
          splash.style.display = 'none';
          body.classList.remove('splash-active');
          body.style.overflow = '';
          window.dispatchEvent(new Event('hero-visible'));
          
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }, 700);
      });
    } else {
      window.dispatchEvent(new Event('hero-visible'));
    }
  }
