// =========== IIFE n°1 : Splash, toasts, téléphone, upload, formulaire, modal projet ===========
(function () {
  const body = document.body;
  // Add CSS class when fonts are loaded to reduce layout shift (avoid large-to-small flash for h1)
  try {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => document.documentElement.classList.add('fonts-ready'));
    } else {
      document.documentElement.classList.add('fonts-ready');
    }
  } catch (e) { document.documentElement.classList.add('fonts-ready'); }

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
          
          // Variable speed pour un effet plus réaliste :
          // - Plus rapide pour les espaces
          // - Plus lent pour la ponctuation (comme si on réfléchissait)
          // - Légèrement variable pour simuler la frappe humaine
          let delay = speed;
          if (char === ' ') {
            delay = speed * 0.3;
          } else if (char.match(/[.,;:!?]/)) {
            delay = speed * 2;
          } else if (char.match(/[A-Z]/)) {
            delay = speed * 1.1; // Légèrement plus lent pour les majuscules
          }
          
          // Ajouter une petite variation aléatoire pour simuler la frappe humaine (±20%)
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

  function startTypewriterSequence() {
    // Désactiver le typewriter en mobile
    if (window.innerWidth <= 767) {
      const kicker = document.querySelector('.hero-kicker[data-typewriter]');
      const title = document.querySelector('.et-hero-tabs h1[data-typewriter]');
      
      // Ne pas remplir le texte via JavaScript en mobile car il est affiché via ::before
      // Juste ajouter les classes nécessaires
      if (kicker) {
        // Assurer l'affichage en mobile : n'injecte le texte qu'après la police chargée
        const setKicker = () => {
          const text = kicker.dataset.typewriter;
          if (text && !kicker.textContent.trim()) kicker.textContent = text;
          kicker.classList.add('typed');
          kicker.classList.add('has-content');
        };
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(setKicker).catch(() => setKicker());
        } else setKicker();
      }
      
      if (title) {
        // For mobile, do not inject the h1 DOM text: rely on ::before fallback
        // Only add the classes to trigger visual state and avoid duplication
        const setTitleClasses = () => {
          title.classList.add('typed');
          document.body.classList.add('hero-title-typed');
        };
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(setTitleClasses).catch(() => setTitleClasses());
        } else setTitleClasses();
      }
      
      document.body.classList.add('hero-typed');
      return;
    }
    
    const kicker = document.querySelector('.hero-kicker[data-typewriter]');
    const title = document.querySelector('.et-hero-tabs h1[data-typewriter]');
    const subtitle = document.querySelector('.hero-subtitle[data-typewriter]');
    
    if (!kicker && !title && !subtitle) return;
    
    const sequence = async () => {
      if (kicker) {
        await typewriter(kicker, kicker.dataset.typewriter, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (title) {
        await typewriter(title, title.dataset.typewriter, 60);
        // Déclencher l'animation de la citation une fois le h1 terminé
        document.body.classList.add('hero-title-typed');
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      if (subtitle) {
        await typewriter(subtitle, subtitle.dataset.typewriter, 35);
      }
      
      // Mark as fully typed after a short delay
      setTimeout(() => {
        document.body.classList.add('hero-typed');
      }, 300);
    };
    
    sequence();
  }

  // Ensure we add a class when the hero becomes visible so typewriter starts
  window.addEventListener('hero-visible', () => {
    try { 
      document.body.classList.add('hero-visible');
      // Start typewriter effect after a short delay
      setTimeout(startTypewriterSequence, 200);
    } catch (e) { /* ignore */ }
  });
  // ============ SPLASH ============
  const splash = document.querySelector('.splash');
  const splashMoreBtn = document.querySelector('.text .splash-more-btn');

  const textElement = document.querySelector('.text');
  
  if (splash && splashMoreBtn) {
    body.classList.add('splash-active');

    splashMoreBtn.addEventListener('click', () => {
      // Ajouter les classes pour l'animation de disparition
      splash.classList.add('splash-hidden');
      if (textElement) {
        textElement.classList.add('text-hidden');
      }

      setTimeout(() => {
        splash.style.display = 'none';
        if (textElement) {
          textElement.style.display = 'none';
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
    // Typewriter will handle marking as typed when complete
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

  function showToast(message, type = 'info', opts = {}) {
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

  // ============ TÉLÉPHONE OBFUSQUÉ ============

  const phoneBtn = document.getElementById('phoneBtn');
  if (phoneBtn) {
    const codes = [43, 51, 51, 54, 56, 51, 48, 50, 51, 52, 52, 52]; // +33683023444
    const e164 = String.fromCharCode.apply(null, codes);
    const national = '0' + e164.slice(3);
    const display = national.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

    phoneBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!phoneBtn.dataset.revealed) {
        phoneBtn.dataset.revealed = '1';
        phoneBtn.textContent = display;
        phoneBtn.setAttribute('href', 'tel:' + e164);
        phoneBtn.setAttribute('aria-label', 'Appeler ' + display);
        phoneBtn.setAttribute('title', 'Cliquer à nouveau pour appeler');
        return;
      }

      window.location.href = 'tel:' + e164;
    });
  }

  // ============ UPLOAD FICHIER ============

  const fileInput = document.getElementById('jobDescriptionFile');
  const fileNameDisplay = document.getElementById('fileName');
  const fileWrapper = document.querySelector('.file-upload-wrapper');
  const fileErrorEl = document.getElementById('file-error');

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md'];
  const ALLOWED_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]);

  function setFileError(msg) {
    if (!fileErrorEl) return;
    fileErrorEl.textContent = msg || '';
    if (msg) fileErrorEl.setAttribute('role', 'alert');
    else fileErrorEl.removeAttribute('role');
  }

  const formatBytes = (bytes) => {
    if (bytes == null) return '';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return (Math.round(v * 10) / 10) + ' ' + units[i];
  };

  function fileExt(name) {
    const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function isAllowedType(file) {
    const extOk = ALLOWED_EXT.includes(fileExt(file.name));
    const mimeOk = file.type ? ALLOWED_MIME.has(file.type) : extOk;
    return extOk || mimeOk;
  }

  function displaySelectedFile(file) {
    if (!fileNameDisplay) return;
    if (!file) {
      fileNameDisplay.textContent = 'Cliquer ou déposer un fichier (PDF, DOC/DOCX, TXT, MD)';
      return;
    }
    const icon = '📄';
    fileNameDisplay.innerHTML =
      `<span class="file-chip">${icon}<span class="file-meta">${file.name} • ${formatBytes(file.size)}</span>` +
      `<button type="button" class="remove-file" aria-label="Retirer le fichier" title="Retirer">Retirer</button></span>`;
    const removeBtn = fileNameDisplay.querySelector('.remove-file');
    removeBtn?.addEventListener('click', () => {
      if (fileInput) fileInput.value = '';
      displaySelectedFile(null);
      setFileError('');
    });
  }

  function validateSelectedFile(file) {
    if (!file) return true;
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Fichier trop volumineux (max 10 Mo).');
      return false;
    }
    if (!isAllowedType(file)) {
      setFileError('Format non autorisé. Utilisez PDF, DOC/DOCX, TXT ou MD.');
      return false;
    }
    setFileError('');
    return true;
  }

  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!validateSelectedFile(f)) {
        displaySelectedFile(null);
        return;
      }
      displaySelectedFile(f);
    });

    fileNameDisplay.addEventListener('click', () => fileInput.click());
    fileNameDisplay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    if (fileWrapper) {
      ['dragenter', 'dragover'].forEach(evt =>
        fileWrapper.addEventListener(evt, (e) => {
          e.preventDefault();
          fileWrapper.classList.add('drag-over');
        })
      );
      ['dragleave', 'drop'].forEach(evt =>
        fileWrapper.addEventListener(evt, (e) => {
          if (evt === 'drop') return;
          fileWrapper.classList.remove('drag-over');
        })
      );
      fileWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        fileWrapper.classList.remove('drag-over');
        const f = e.dataTransfer?.files?.[0];
        if (!f) return;
        if (!validateSelectedFile(f)) {
          displaySelectedFile(null);
          return;
        }
        try {
          const dt = new DataTransfer();
          dt.items.add(f);
          fileInput.files = dt.files;
        } catch { /* ignore */ }
        displaySelectedFile(f);
      });
    }
  }

  // ============ FORMULAIRE CONTACT ============

  const form = document.getElementById('contactForm');
  const els = form ? {
    company: document.getElementById('companyName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    mission: document.getElementById('missionType'),
    message: document.getElementById('message'),
    submit: document.getElementById('submitBtn'),
    status: document.getElementById('formStatus')
  } : {};
  const errs = form ? {
    company: document.getElementById('companyName-error'),
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    mission: document.getElementById('missionType-error'),
    message: document.getElementById('message-error')
  } : {};

  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  const frPhonePattern = /^(?:0[1-9]|(?:\+33|0033)[ .-]?[1-9])(?:[ .-]?\d{2}){4}$/;

  function setFieldError(key, message) {
    if (!errs[key]) return;
    errs[key].textContent = message || '';
    if (message) errs[key].setAttribute('role', 'alert');
    else errs[key].removeAttribute('role');
  }

  function validateCompany() {
    const el = els.company; if (!el) return true;
    const v = (el.value || '').trim();
    let msg = '';
    if (!v) msg = "Le nom de l’entreprise est requis.";
    else if (el.minLength && v.length < el.minLength) msg = `Au moins ${el.minLength} caractères.`;
    setFieldError('company', msg);
    el.setCustomValidity?.(msg);
    return !msg;
  }

  function validateEmail() {
    const el = els.email; if (!el) return true;
    const v = (el.value || '').trim();
    let msg = '';
    if (!v) msg = "L’email est requis.";
    else if (!emailPattern.test(v)) msg = 'E-mail invalide (ex: nom@domaine.fr).';
    setFieldError('email', msg);
    el.setCustomValidity?.(msg);
    return !msg;
  }

  function validatePhone() {
    const el = els.phone; if (!el) return true;
    const v = (el.value || '').trim();
    let msg = '';
    if (v && !frPhonePattern.test(v)) msg = 'Numéro FR invalide (ex: 06 12 34 56 78 ou +33 6 12 34 56 78).';
    setFieldError('phone', msg);
    el.setCustomValidity?.(msg);
    return !msg;
  }

  function validateMission() {
    const el = els.mission; if (!el) return true;
    const v = el.value;
    let msg = '';
    if (!v) msg = 'Veuillez sélectionner un type de collaboration.';
    setFieldError('mission', msg);
    el.setCustomValidity?.(msg);
    return !msg;
  }

  function validateMessage() {
    const el = els.message; if (!el) return true;
    const v = (el.value || '').trim();
    let msg = '';
    if (!v) msg = 'Le message est requis.';
    else if (el.minLength && v.length < el.minLength) msg = `Au moins ${el.minLength} caractères.`;
    setFieldError('message', msg);
    el.setCustomValidity?.(msg);
    return !msg;
  }

  function debounce(fn, delay = 220) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), delay);
    };
  }

  if (form) {
    const markTouched = (el) => el?.closest('.form-group')?.classList.add('touched');

    els.company?.addEventListener('input', debounce(validateCompany, 180));
    els.email?.addEventListener('input', debounce(validateEmail, 220));
    els.phone?.addEventListener('input', debounce(validatePhone, 220));
    els.mission?.addEventListener('change', validateMission);
    els.message?.addEventListener('input', debounce(validateMessage, 180));

    els.company?.addEventListener('blur', () => { markTouched(els.company); validateCompany(); });
    els.email?.addEventListener('blur', () => { markTouched(els.email); validateEmail(); });
    els.phone?.addEventListener('blur', () => { markTouched(els.phone); validatePhone(); });
    els.mission?.addEventListener('change', () => { markTouched(els.mission); validateMission(); });
    els.message?.addEventListener('blur', () => { markTouched(els.message); validateMessage(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = [
        validateCompany(),
        validateEmail(),
        validatePhone(),
        validateMission(),
        validateMessage()
      ].every(Boolean);

      if (!ok) {
        form.classList.add('was-validated');
        if (els.status) els.status.textContent = 'Merci de corriger les erreurs indiquées.';
        form.reportValidity?.();
        return;
      }

      if (els.submit) {
        els.submit.textContent = 'Envoi en cours...';
        els.submit.disabled = true;
      }
      if (els.status) els.status.textContent = '';

      const formData = new FormData(form);
      const file = formData.get('jobDescriptionFile');

      if (file && file.size > 0 && !validateSelectedFile(file)) {
        if (els.submit) {
          els.submit.textContent = 'Envoyer';
          els.submit.disabled = false;
        }
        return;
      }

      if (file && file.size > 0) {
        const reader = new FileReader();
        reader.onloadend = function () {
          const data = Object.fromEntries(formData.entries());
          data.fileBase64 = reader.result.split(',')[1];
          data.fileName = file.name;
          data.fileType = file.type;
          sendToGoogleScript(data);
        };
        reader.readAsDataURL(file);
      } else {
        sendToGoogleScript(Object.fromEntries(formData.entries()));
      }
    });
  }

  function sendToGoogleScript(data) {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkUjSMXl6hLf-hFHG-XdZvp92ciYzKJUCursVV3SjjSkYZM5oZ83OlQ4i2ejCwGrCK/exec';

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(async res => {
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = null; }

        if (!res.ok) {
          console.error('HTTP error', res.status, text);
          throw new Error('HTTP ' + res.status + ': ' + (json?.error || text || 'Erreur inconnue'));
        }

        if (!json) {
          console.error('Réponse non JSON:', text);
          throw new Error('Réponse non JSON du serveur');
        }

        if (json.ok !== true) {
          console.error('Serveur a renvoyé une erreur:', json);
          throw new Error(json.error || 'Erreur serveur');
        }

        showToast('Message envoyé avec succès !', 'success');
        if (form) {
          form.reset();
          form.classList.remove('was-validated');
          document.querySelectorAll('#contactForm .form-group')
            .forEach(g => g.classList.remove('touched'));
        }
        if (fileNameDisplay) {
          fileNameDisplay.textContent = 'Cliquer ou déposer un fichier (PDF, DOC/DOCX, TXT, MD)';
        }
      })
      .catch(error => {
        console.error('Erreur soumission formulaire:', error);
        showToast('Une erreur est survenue: ' + (error?.message || 'voir console'), 'error', { duration: 6000 });
      })
      .finally(() => {
        if (els.submit) {
          els.submit.textContent = 'Envoyer';
          els.submit.disabled = false;
        }
      });
  }

  // ============ ANTI RESTAURATION FORM ============

  (function resetFormOnLoad() {
    const f = document.getElementById('contactForm');
    if (!f) return;

    f.setAttribute('autocomplete', 'off');
    ['companyName', 'email', 'phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('autocomplete', 'off');
    });

    try { f.reset(); } catch { /* ignore */ }
    f.classList.remove('was-validated');
    document.querySelectorAll('#contactForm .form-group')
      .forEach(g => g.classList.remove('touched'));

    ['companyName-error', 'email-error', 'phone-error', 'missionType-error', 'message-error']
      .forEach(id => {
        const er = document.getElementById(id);
        if (er) er.textContent = '';
      });

    ['companyName', 'email', 'phone', 'missionType', 'message']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el && el.setCustomValidity) el.setCustomValidity('');
      });

    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        try { f.reset(); } catch { }
        f.classList.remove('was-validated');
        document.querySelectorAll('#contactForm .form-group')
          .forEach(g => g.classList.remove('touched'));
        ['companyName-error', 'email-error', 'phone-error', 'missionType-error', 'message-error']
          .forEach(id => {
            const er = document.getElementById(id);
            if (er) er.textContent = '';
          });
        ['companyName', 'email', 'phone', 'missionType', 'message']
          .forEach(id => {
            const el = document.getElementById(id);
            if (el && el.setCustomValidity) el.setCustomValidity('');
          });
      }
    });
  })();

  // ============ MODAL PROJET ============

  const projectModal = document.getElementById('projectModal');
  const modalTitleEl = document.getElementById('projectModalTitle');
  const modalDescEl = document.getElementById('projectModalDescription');
  const modalTechEl = document.getElementById('projectModalTech');
  const modalLinkEl = document.getElementById('projectModalLink');
  const modalImageEl = document.getElementById('modalImage');
  const closeProjectModalBtn = document.getElementById('closeProjectModal');
  let lastFocusedEl = null;

  function openProjectModalFromCard(card) {
    if (!card) return;
    const title = card.dataset.title || card.querySelector('h3')?.textContent || '';
    const description = card.dataset.description || '';
    const tech = card.dataset.tech || '';
    const link = card.dataset.link || '#';
    const img = card.querySelector('.card-image img')?.getAttribute('src') || '';

    modalTitleEl.textContent = title;
    modalDescEl.textContent = description;
    modalTechEl.textContent = tech;
    modalLinkEl.href = link;
    modalLinkEl.tabIndex = link && link !== '#' ? 0 : -1;

    if (link === '#') {
      modalLinkEl.setAttribute('aria-disabled', 'true');
      modalLinkEl.removeAttribute('target');
    } else {
      modalLinkEl.removeAttribute('aria-disabled');
      modalLinkEl.setAttribute('target', '_blank');
    }

    if (img) {
      modalImageEl.src = img;
      modalImageEl.alt = title;
      modalImageEl.style.display = 'block';
    } else {
      modalImageEl.style.display = 'none';
    }

    projectModal?.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    lastFocusedEl = document.activeElement;
    setTimeout(() => closeProjectModalBtn?.focus(), 120);
  }

  function closeProjectModal() {
    projectModal?.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }

  document.querySelectorAll('.card-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.project-card');
      openProjectModalFromCard(card);
    });
  });

  closeProjectModalBtn?.addEventListener('click', closeProjectModal);

  projectModal?.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProjectModal();
  });

  modalLinkEl?.addEventListener('click', (e) => {
    if (modalLinkEl.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.getAttribute('aria-hidden') === 'false') {
      closeProjectModal();
    }
  });

  // ============ MODAL CONTACT (NOUVEAU - STYLE ABOUT-POPUP) ============
  const contactPopup = document.getElementById('contactPopup');
  const btnContactMail = document.getElementById('btnContactMail');
  const closeContactPopupBtn = document.getElementById('closeContactPopup');
  
  // Keep original parent so we can restore after close (to avoid stacking context issues)
  let contactPopupOriginalParent = null;
  let contactPopupNextSibling = null;
  function ensureContactPopupInBody() {
    if (!contactPopup) return;
    if (contactPopup.parentNode !== document.body) {
      contactPopupOriginalParent = contactPopup.parentNode;
      contactPopupNextSibling = contactPopup.nextSibling;
      document.body.appendChild(contactPopup);
    }
  }

  function restoreContactPopupOriginalPosition() {
    if (!contactPopup || !contactPopupOriginalParent) return;
    if (contactPopupNextSibling) {
      contactPopupOriginalParent.insertBefore(contactPopup, contactPopupNextSibling);
    } else {
      contactPopupOriginalParent.appendChild(contactPopup);
    }
    contactPopupOriginalParent = null;
    contactPopupNextSibling = null;
  }

  function openContactPopup() {
    if (contactPopup) {
      ensureContactPopupInBody();
      contactPopup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        const firstInput = contactPopup.querySelector('input');
        if (firstInput) firstInput.focus();
        else closeContactPopupBtn?.focus();
      }, 100);
    }
  }

  function closeContactPopup() {
    if (contactPopup) {
      contactPopup.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      
      setTimeout(() => {
        restoreContactPopupOriginalPosition();
        btnContactMail?.focus();
      }, 300);
    }
  }

  btnContactMail?.addEventListener('click', openContactPopup);
  closeContactPopupBtn?.addEventListener('click', closeContactPopup);

  contactPopup?.addEventListener('click', (e) => {
    if (e.target === contactPopup || e.target.classList.contains('about-popup-overlay')) {
      closeContactPopup();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactPopup && contactPopup.getAttribute('aria-hidden') === 'false') {
      closeContactPopup();
    }
  });

  // Logic pour le bouton "Appeler" (si on veut l'obfuscation aussi)
  const btnContactPhone = document.getElementById('btnContactPhone');
  if (btnContactPhone) {
    const codes = [43, 51, 51, 54, 56, 51, 48, 50, 51, 52, 52, 52];
    const e164 = String.fromCharCode.apply(null, codes);
    btnContactPhone.addEventListener('click', (e) => {
      // On laisse le comportement par défaut (href="tel:...") ou on le met à jour dynamiquement
      // Si le href est "#", on le met à jour
      if (btnContactPhone.getAttribute('href') === '#') {
        e.preventDefault();
        window.location.href = 'tel:' + e164;
      }
    });
  }

  // ============ BOUTONS DU HERO -> SECTIONS ============
  const heroContactBtn = document.getElementById('heroContactBtn');
  const heroAboutBtn = document.getElementById('heroAboutBtn');

  function scrollToTab(id) {
    const tab = document.querySelector(`.et-hero-tab[href="${id}"]`);
    if (tab) {
      tab.click();
      return;
    }
    const section = document.querySelector(id);
    if (!section) return;

    const tabContainer = document.querySelector('.et-hero-tabs-container');
    if (!tabContainer) return;
    const tabH = tabContainer.offsetHeight || 72;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    
    // Calcul correct de la position
    const sectionRect = section.getBoundingClientRect();
    const absoluteTop = sectionRect.top + window.scrollY;
    const offset = isSticky ? tabH + 12 : tabH + 12;
    const top = absoluteTop - offset;
    
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  heroContactBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTab('#tab-contact');
  });

  heroAboutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTab('#tab-quisuisje');
  });
})();

// =========== IIFE n°2 : STICKY TABS (slider nav) ===========
(function () {
  const tabContainer = document.querySelector('.et-hero-tabs-container');
  if (!tabContainer) return;

  const tabs = Array.from(tabContainer.querySelectorAll('.et-hero-tab'));
  const slider = tabContainer.querySelector('.et-hero-tab-slider');
  const hero = document.querySelector('.et-hero-tabs');
  const tabContainerHeight = tabContainer.offsetHeight || 72;
  
  // Gestionnaire pour le logo OG - scroll vers hero (tout en haut)
  const heroLogo = document.querySelector('.et-hero-logo');
  if (heroLogo) {
    heroLogo.style.cursor = 'pointer';
    heroLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    });
  }

  function onTabClick(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;

    // Calcul correct de la position en tenant compte de la navbar sticky
    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + window.scrollY;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    const offset = isSticky ? tabContainerHeight + 12 : tabContainerHeight + 12;
    const top = Math.max(0, absoluteTop - offset);
    
    // Utiliser Locomotive Scroll si disponible, sinon window.scrollTo
    if (window.locomotiveScroller) {
      window.locomotiveScroller.scrollTo(target, {
        offset: -offset,
        duration: 1200,
        easing: [0.25, 0.0, 0.35, 1.0]
      });
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  tabs.forEach(tab => tab.addEventListener('click', onTabClick));

  function setSliderCss(tab) {
    if (!slider) return;
    if (!tab) {
      slider.style.width = '0';
      return;
    }
    const rect = tab.getBoundingClientRect();
    const containerRect = tabContainer.getBoundingClientRect();
    const width = rect.width;
    const left = rect.left - containerRect.left;
    slider.style.width = width + 'px';
    slider.style.left = left + 'px';
  }

  let currentId = null;
  let currentTab = null;

  function findCurrentTab() {
    const scrollY = window.scrollY;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    const offset = isSticky ? tabContainerHeight + 12 : tabContainerHeight + 12;
    let newCurrentId = null;
    let newCurrentTab = null;

    tabs.forEach(tab => {
      const href = tab.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const section = document.querySelector(href);
      if (!section) return;
      
      // Calcul correct de la position - support pour les conteneurs
      const sectionRect = section.getBoundingClientRect();
      const absoluteTop = sectionRect.top + scrollY;
      const top = absoluteTop - offset;
      const bottom = top + section.offsetHeight;
      
      // Vérifier si on est dans la section (y compris les conteneurs comme .container-quisuisje)
      if (scrollY >= top && scrollY < bottom) {
        newCurrentId = href;
        newCurrentTab = tab;
      }
    });

    // Gestion spéciale pour #tab-quisuisje (conteneur avec sous-sections)
    // Si aucune section normale n'est active, vérifier le conteneur #tab-quisuisje
    if (!newCurrentId) {
      const quisuisjeContainer = document.querySelector('#tab-quisuisje');
      if (quisuisjeContainer) {
        const containerRect = quisuisjeContainer.getBoundingClientRect();
        const containerAbsoluteTop = containerRect.top + scrollY;
        const containerTop = containerAbsoluteTop - offset;
        const containerBottom = containerTop + quisuisjeContainer.offsetHeight;
        
        if (scrollY >= containerTop && scrollY < containerBottom) {
          const quisuisjeTab = tabs.find(tab => tab.getAttribute('href') === '#tab-quisuisje');
          if (quisuisjeTab) {
            newCurrentId = '#tab-quisuisje';
            newCurrentTab = quisuisjeTab;
          }
        }
      }
    }

    if (newCurrentId !== currentId) {
      currentId = newCurrentId;
      currentTab = newCurrentTab;
      setSliderCss(currentTab);
    }
  }

  function checkTabContainerPosition() {
    if (!hero) return;
    const heroOffsetBottom = hero.offsetTop + hero.offsetHeight - tabContainerHeight;
    if (scrollY > heroOffsetBottom) {
      tabContainer.classList.add('et-hero-tabs-container--top');
    } else {
      tabContainer.classList.remove('et-hero-tabs-container--top');
    }
  }

  function onScroll() {
    checkTabContainerPosition();
    findCurrentTab();
  }

  function onResize() {
    setSliderCss(currentTab);
    checkTabContainerPosition();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', () => {
    checkTabContainerPosition();
    findCurrentTab();
  });

  // Init
  checkTabContainerPosition();
  findCurrentTab();
})();

// =========== IIFE n°3 : MENU HAMBURGER MOBILE ===========
(function () {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  const body = document.body;

  if (!menuToggle || !mobileMenu || !mobileMenuOverlay) return;

  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenuOverlay.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  }

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenuOverlay.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }

  function scrollToSection(href) {
    const target = document.querySelector(href);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + window.scrollY;
    const mobileNavbar = document.querySelector('.mobile-navbar');
    const navbarHeight = mobileNavbar ? mobileNavbar.offsetHeight : 60;
    const offset = navbarHeight; // Arriver exactement en haut de la section (sous la navbar)
    const top = Math.max(0, absoluteTop - offset);

    // Utiliser Locomotive Scroll si disponible, sinon window.scrollTo
    if (window.locomotiveScroller) {
      window.locomotiveScroller.scrollTo(target, {
        offset: -offset,
        duration: 1200,
        easing: [0.25, 0.0, 0.35, 1.0]
      });
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    closeMenu();
  }

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobileMenuClose?.addEventListener('click', closeMenu);

  mobileMenuOverlay.addEventListener('click', closeMenu);

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        scrollToSection(href);
      }
    });
  });

  // Fermer le menu avec Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      closeMenu();
    }
  });

  // Fermer le menu si on resize vers desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 767) {
      closeMenu();
    }
  });
})();

// Le code de scroll horizontal a été supprimé car la section des cartes n'existe plus

// =========== POPUP "EN SAVOIR PLUS" - QUI SUIS-JE ===========
(function () {
  const aboutPopup = document.getElementById('aboutPopup');
  const aboutPopupBtn = document.getElementById('aboutLearnMoreBtn');
  const aboutPopupClose = document.getElementById('aboutPopupClose');
  const body = document.body;

  // Keep original parent so we can restore after close (to avoid stacking context issues)
  let aboutPopupOriginalParent = null;
  let aboutPopupNextSibling = null;
  function ensureAboutPopupInBody() {
    if (!aboutPopup) return;
    if (aboutPopup.parentNode !== document.body) {
      aboutPopupOriginalParent = aboutPopup.parentNode;
      aboutPopupNextSibling = aboutPopup.nextSibling;
      document.body.appendChild(aboutPopup);
    }
  }

  function restoreAboutPopupOriginalPosition() {
    if (!aboutPopup || !aboutPopupOriginalParent) return;
    if (aboutPopupNextSibling) {
      aboutPopupOriginalParent.insertBefore(aboutPopup, aboutPopupNextSibling);
    } else {
      aboutPopupOriginalParent.appendChild(aboutPopup);
    }
    aboutPopupOriginalParent = null;
    aboutPopupNextSibling = null;
  }

  function openAboutPopup() {
    if (aboutPopup) {
      ensureAboutPopupInBody();
      aboutPopup.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
      setTimeout(() => {
        aboutPopupClose?.focus();
      }, 100);
    }
  }

  function closeAboutPopup() {
    if (aboutPopup) {
      aboutPopup.setAttribute('aria-hidden', 'true');
      body.style.overflow = '';
      // restore original DOM position after hiding, to keep the DOM structure predictable
      setTimeout(() => {
        restoreAboutPopupOriginalPosition();
        aboutPopupBtn?.focus();
      }, 300);
    }
  }

  aboutPopupBtn?.addEventListener('click', openAboutPopup);
  aboutPopupClose?.addEventListener('click', closeAboutPopup);

  aboutPopup?.addEventListener('click', (e) => {
    if (e.target === aboutPopup || e.target.classList.contains('about-popup-overlay')) {
      closeAboutPopup();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutPopup && aboutPopup.getAttribute('aria-hidden') === 'false') {
      closeAboutPopup();
    }
  });
})();

// =========== SECTION EXPÉRIENCE - TIMELINE SLIDER ===========
(function () {
  const timelineData = [
    {
      year: 2020,
      company: "Début de carrière",
      description: "Mes premières expériences dans le développement, découverte des technologies web et des bases du développement logiciel.",
      icon: "fa-code",
      era: "era-early-web"
    },
    {
      year: 2021,
      company: "Développeur .NET",
      description: "Spécialisation dans le développement .NET, création d'applications backend robustes et scalables.",
      icon: "fa-server",
      era: "era-dot-com"
    },
    {
      year: 2022,
      company: "Développeur Fullstack",
      description: "Évolution vers le développement fullstack, maîtrise du frontend avec Vue.js et approfondissement des compétences backend.",
      icon: "fa-laptop-code",
      era: "era-social-media"
    },
    {
      year: 2023,
      company: "Développeur .NET & Power Platform",
      description: "Expertise dans le développement .NET et la Power Platform, création de solutions d'automatisation et de modernisation pour les entreprises.",
      icon: "fa-rocket",
      era: "era-mobile"
    }
  ];

  const slider = document.getElementById("timelineSlider");
  const eventIcon = document.getElementById("eventIcon");
  const eventYear = document.getElementById("eventYear");
  const eventCompany = document.getElementById("eventCompany");
  const eventDescription = document.getElementById("eventDescription");
  const progressFill = document.getElementById("progressFill");
  const timelineContainer = document.getElementById("timelineContainer");
  const content = document.getElementById("timelineContent");
  const sliderTrack = document.getElementById("sliderTrack");
  const yearLabelsContainer = document.getElementById("yearLabels");

  if (!slider || !eventIcon || !eventYear || !eventCompany || !eventDescription) {
    return;
  }

  // Mettre à jour le max du slider
  slider.max = timelineData.length - 1;

  let currentIndex = 0;
  let autoPlayInterval;
  let ticks = [];
  let yearLabels = [];

  // Create tick marks along slider track
  function createTicks() {
    timelineData.forEach((event, index) => {
      const tick = document.createElement("div");
      tick.classList.add("tick");
      const percent = (index / (timelineData.length - 1)) * 100;
      tick.style.left = `calc(${percent}%)`;
      sliderTrack.appendChild(tick);
      ticks.push(tick);
    });
  }

  // Create year labels under slider with precise positioning
  function createYearLabels() {
    yearLabelsContainer.style.position = "relative";

    timelineData.forEach((event, index) => {
      const span = document.createElement("span");
      span.classList.add("year-label");
      span.textContent = event.year;

      // Calculate exact position to align with ticks and slider positions
      const percent = (index / (timelineData.length - 1)) * 100;
      span.style.position = "absolute";
      span.style.left = `${percent}%`;
      span.style.transform = "translateX(-50%)";

      yearLabelsContainer.appendChild(span);
      yearLabels.push(span);
    });
  }

  function updateTimeline(index) {
    if (index === currentIndex) return;

    // Add fade out animation to current content
    content.classList.remove("fade-in");
    content.classList.add("fade-transition");

    eventIcon.classList.add("fade-out");
    eventYear.classList.add("fade-out");
    eventCompany.classList.add("fade-out");
    eventDescription.classList.add("fade-out");

    ticks.forEach((tick, i) => {
      tick.classList.toggle("active", i === index);
    });

    yearLabels.forEach((label, i) => {
      label.classList.toggle("active", i === index);
    });

    // Wait for fade-out animation to finish before updating content
    content.addEventListener("animationend", function onFadeOutEnd() {
      content.removeEventListener("animationend", onFadeOutEnd);

      const event = timelineData[index];

      // Update content
      eventIcon.innerHTML = `<i class="fa-solid ${event.icon}"></i>`;
      eventYear.textContent = event.year;
      eventCompany.textContent = event.company;
      eventDescription.textContent = event.description;

      timelineContainer.className = `timeline-container ${event.era}`;

      const progress = (index / (timelineData.length - 1)) * 100;
      progressFill.style.width = `${progress}%`;

      // Reset and animate in
      content.classList.remove("fade-transition");
      eventIcon.classList.remove("fade-out");
      eventYear.classList.remove("fade-out");
      eventCompany.classList.remove("fade-out");
      eventDescription.classList.remove("fade-out");

      content.classList.add("fade-in");

      currentIndex = index;
    }, { once: true });
  }

  slider.addEventListener("input", function () {
    const index = parseInt(this.value);
    updateTimeline(index);
  });

  // Auto-play functionality
  function startAutoPlay() {
    autoPlayInterval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= timelineData.length) {
        nextIndex = 0;
      }
      slider.value = nextIndex;
      updateTimeline(nextIndex);
    }, 4000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Initialize
  createTicks();
  createYearLabels();
  updateTimeline(0);

  // Start auto-play after initial load
  setTimeout(startAutoPlay, 2000);

  // Stop auto-play on user interaction
  slider.addEventListener("mousedown", stopAutoPlay);
  slider.addEventListener("touchstart", stopAutoPlay);

  // Optional: restart auto-play after user stops interacting
  let userInteractionTimeout;
  slider.addEventListener("mouseup", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 5000);
  });

  slider.addEventListener("touchend", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 5000);
  });
})();
