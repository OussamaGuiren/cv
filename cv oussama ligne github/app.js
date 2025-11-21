// =========== IIFE n°1 : Splash, toasts, téléphone, upload, formulaire, modal projet ===========
(function () {
  const body = document.body;

  // Ensure we add a class when the hero becomes visible so CSS animations trigger
  window.addEventListener('hero-visible', () => {
    try { document.body.classList.add('hero-visible'); } catch (e) { /* ignore */ }
  });
  // ============ SPLASH ============
  const splash = document.querySelector('.splash');
  const splashMoreBtn = document.querySelector('.splash-more-btn');

  if (splash && splashMoreBtn) {
    body.classList.add('splash-active');

    splashMoreBtn.addEventListener('click', () => {
      splash.classList.add('splash-hidden');
      body.classList.remove('splash-active');

      setTimeout(() => {
        splash.style.display = 'none';
        window.dispatchEvent(new Event('hero-visible'));
        // After the hero visible event, mark typed after the typewriter animation finishes
        setTimeout(() => document.body.classList.add('hero-typed'), 2600);
      }, 700);
    });
  } else {
    window.dispatchEvent(new Event('hero-visible'));
    setTimeout(() => document.body.classList.add('hero-typed'), 2600);
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
    const tabH = tabContainer ? (tabContainer.offsetHeight || 64) : 64;
    const top = section.offsetTop - tabH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
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
  const tabContainerHeight = tabContainer.offsetHeight || 64;

  function onTabClick(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;

    const top = target.offsetTop - tabContainerHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
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
    let newCurrentId = null;
    let newCurrentTab = null;

    tabs.forEach(tab => {
      const href = tab.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const section = document.querySelector(href);
      if (!section) return;
      const top = section.offsetTop - tabContainerHeight - 20;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        newCurrentId = href;
        newCurrentTab = tab;
      }
    });

    if (newCurrentId !== currentId) {
      currentId = newCurrentId;
      currentTab = newCurrentTab;
      setSliderCss(currentTab);
    }
  }

  function checkTabContainerPosition() {
    if (!hero) return;
    const heroOffsetBottom = hero.offsetTop + hero.offsetHeight - tabContainerHeight;
    if (window.scrollY > heroOffsetBottom) {
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
