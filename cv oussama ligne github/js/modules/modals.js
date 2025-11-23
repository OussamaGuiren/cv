import { showToast } from './utils.js';

export function initModals() {
  initAboutPopup();
  initProjectModal();
  initContactPopup();
  initPhoneButton();
}

function initAboutPopup() {
  const aboutPopup = document.getElementById('aboutPopup');
  const aboutPopupBtn = document.getElementById('aboutLearnMoreBtn');
  const aboutPopupClose = document.getElementById('aboutPopupClose');
  const body = document.body;

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
}

function initProjectModal() {
  const projectModal = document.getElementById('projectModal');
  const closeProjectModalBtn = document.getElementById('closeProjectModal');
  const modalTitleEl = document.getElementById('projectModalTitle');
  const modalDescEl = document.getElementById('projectModalDescription');
  const modalTechEl = document.getElementById('projectModalTech');
  const modalLinkEl = document.getElementById('projectModalLink');
  const modalImageEl = document.getElementById('modalImage');
  const body = document.body;

  let projectModalOriginalParent = null;
  let projectModalNextSibling = null;

  function ensureProjectModalInBody() {
    if (!projectModal) return;
    if (projectModal.parentNode !== document.body) {
      projectModalOriginalParent = projectModal.parentNode;
      projectModalNextSibling = projectModal.nextSibling;
      document.body.appendChild(projectModal);
    }
  }

  function restoreProjectModalOriginalPosition() {
    if (!projectModal || !projectModalOriginalParent) return;
    if (projectModalNextSibling) {
      projectModalOriginalParent.insertBefore(projectModal, projectModalNextSibling);
    } else {
      projectModalOriginalParent.appendChild(projectModal);
    }
    projectModalOriginalParent = null;
    projectModalNextSibling = null;
  }

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
    
    if (link === '#') {
      modalLinkEl.classList.add('disabled');
      modalLinkEl.removeAttribute('target');
    } else {
      modalLinkEl.classList.remove('disabled');
      modalLinkEl.setAttribute('target', '_blank');
    }

    if (img) {
      modalImageEl.src = img;
      modalImageEl.alt = title;
      modalImageEl.style.display = 'block';
    } else {
      modalImageEl.style.display = 'none';
    }

    ensureProjectModalInBody();
    projectModal?.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    body.style.overflow = 'hidden';
    
    setTimeout(() => closeProjectModalBtn?.focus(), 100);
  }

  function closeProjectModal() {
    if (projectModal) {
      projectModal.setAttribute('aria-hidden', 'true');
      body.classList.remove('modal-open');
      body.style.overflow = '';
      setTimeout(() => {
        restoreProjectModalOriginalPosition();
      }, 300);
    }
  }

  document.querySelectorAll('.card-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = e.currentTarget.closest('.project-card');
      openProjectModalFromCard(card);
    });
  });

  closeProjectModalBtn?.addEventListener('click', closeProjectModal);

  projectModal?.addEventListener('click', (e) => {
    if (e.target === projectModal || e.target.classList.contains('about-popup-overlay')) {
      closeProjectModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.getAttribute('aria-hidden') === 'false') {
      closeProjectModal();
    }
  });
}

function initContactPopup() {
  const contactPopup = document.getElementById('contactPopup');
  const btnContactMail = document.getElementById('btnContactMail');
  const closeContactPopupBtn = document.getElementById('closeContactPopup');
  
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
}

function initPhoneButton() {
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
}
