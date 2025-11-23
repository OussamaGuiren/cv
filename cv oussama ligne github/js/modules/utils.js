// ============ TYPEWRITER EFFECT ============
function typewriter(element, text, speed = 50, callback) {
    if (!element || !text) return Promise.resolve();
    
    element.innerHTML = '';
    element.classList.add('typing');
    let index = 0;
    
    return new Promise((resolve) => {
      function type() {
        if (index < text.length) {
          const char = text[index];
          
          // Gérer les retours à la ligne pour les citations
          if (char === '\n' || (char === ' ' && element.textContent.length > 0 && element.textContent.length % 70 === 0)) {
            // Insertion d'un <br> pour les retours à la ligne dans les citations
            if (element.closest('.hero-quote')) {
              element.innerHTML += '<br>';
            } else {
              element.textContent += ' ';
            }
          } else {
            element.textContent += char;
          }
          
          index++;
          
          // Variable speed pour un effet plus réaliste
          let delay = speed;
          if (char === ' ') {
            delay = speed * 0.3;
          } else if (char.match(/[.,;:!?]/)) {
            delay = speed * 2;
          } else if (char.match(/[A-Z]/)) {
            delay = speed * 1.1;
          }
          
          const variation = 1 + (Math.random() - 0.5) * 0.4;
          delay = delay * variation;
          
          setTimeout(type, Math.max(10, delay));
        } else {
          element.classList.remove('typing');
          element.classList.add('typed');
          if (callback) callback();
          resolve();
        }
      }
      type();
    });
  }
  
  export function startTypewriterSequence() {
    // Adaptation mobile : on garde l'animation mais on peut ajuster la vitesse si nécessaire
    const isMobile = window.innerWidth <= 767;
    
    const kicker = document.querySelector('.hero-kicker[data-typewriter]');
    const title = document.querySelector('.et-hero-tabs h1[data-typewriter]');
    const subtitle = document.querySelector('.hero-subtitle[data-typewriter]');
    
    if (!kicker && !title && !subtitle) return;
    
    const sequence = async () => {
      if (kicker) {
        await typewriter(kicker, kicker.dataset.typewriter, isMobile ? 30 : 40); // Un peu plus rapide en mobile
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (title) {
        await typewriter(title, title.dataset.typewriter, isMobile ? 40 : 60);
        document.body.classList.add('hero-title-typed');
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      if (subtitle) {
        await typewriter(subtitle, subtitle.dataset.typewriter, isMobile ? 25 : 35);
      }
      
      setTimeout(() => {
        document.body.classList.add('hero-typed');
      }, 300);
    };
    
    sequence();
  }
  
  // ============ TOASTS ============
  function ensureToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className = 'toast-container';
      root.setAttribute('aria-live', 'polite');
      root.setAttribute('aria-atomic', 'true');
      document.body.appendChild(root);
    }
    return root;
  }
  
  export function showToast(message, type = 'info', opts = {}) {
    const { duration = 4000 } = opts;
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✔' : (type === 'error' ? '⚠' : 'ℹ');
  
    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = message;
  
    const close = document.createElement('button');
    close.className = 'toast-close';
    close.type = 'button';
    close.textContent = 'Fermer';
  
    close.addEventListener('click', () => removeToast());
  
    toast.append(icon, msg, close);
    root.appendChild(toast);
  
    let hideTimer = setTimeout(removeToast, duration);
  
    function removeToast() {
      clearTimeout(hideTimer);
      toast.style.animation = 'toast-out 220ms var(--ease-push) forwards';
      setTimeout(() => toast.remove(), 220);
    }
  
    return removeToast;
  }
  
  export function formatBytes(bytes) {
    if (bytes == null) return '';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return (Math.round(v * 10) / 10) + ' ' + units[i];
  }
  