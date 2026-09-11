import { initDefi } from './defi.js?v=9647ce21';
import { poster } from './backend.js?v=1cacc4b2';

/**
 * Modales accessibles : piège de focus, fermeture Escape / clic sur le voile,
 * restitution du focus à l'élément déclencheur.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openModal = null;
let lastTrigger = null;

export function initModals() {
  initProjectModal();
  initContactModal();
  initPhoneGate();

  document.addEventListener('keydown', (e) => {
    if (!openModal) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trapFocus(e);
  });

  document.querySelectorAll('[data-close-modal]').forEach((el) =>
    el.addEventListener('click', close)
  );
}

function open(modal, trigger) {
  if (openModal) close();

  lastTrigger = trigger ?? document.activeElement;
  openModal = modal;

  modal.hidden = false;
  document.body.classList.add('modal-open');

  // Le premier champ utile, sinon le bouton de fermeture.
  // Focus synchrone : requestAnimationFrame ne se déclenche pas si l'onglet
  // est en arrière-plan, le focus ne serait alors jamais posé.
  const first = modal.querySelector('input:not([type="file"]), textarea, select') ??
                modal.querySelector('.modal-close');
  first?.focus();
}

/** Ferme la fenetre ouverte, depuis l'exterieur du module. Le formulaire s'en
    sert quand l'envoi a reussi : rester devant un formulaire vide ne dit pas
    que c'est parti, ca ressemble a une remise a zero. */
export function closeModal() {
  close();
}

function close() {
  if (!openModal) return;

  openModal.hidden = true;
  openModal = null;
  document.body.classList.remove('modal-open');

  lastTrigger?.focus();
  lastTrigger = null;
}

function trapFocus(e) {
  const items = [...openModal.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null
  );
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---------------- Modale projet ---------------- */
function initProjectModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const els = {
    title: modal.querySelector('#projectModalTitle'),
    description: modal.querySelector('#projectModalDescription'),
    tech: modal.querySelector('#projectModalTech'),
    link: modal.querySelector('#projectModalLink'),
    linkLabel: modal.querySelector('#projectModalLinkLabel'),
    image: modal.querySelector('#projectModalImage')
  };

  document.querySelectorAll('.project-card .card-open').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.project-card');
      if (!card) return;

      const { title = '', description = '', tech = '', link = '',
              linkLabel = 'Voir le site' } = card.dataset;
      const img = card.querySelector('.card-media img');

      els.title.textContent = title;
      els.description.textContent = description;
      els.tech.textContent = tech;

      if (img) {
        els.image.src = img.currentSrc || img.src;
        els.image.alt = img.alt;
        els.image.hidden = false;
        els.image.parentElement.hidden = false;
      } else {
        els.image.hidden = true;
        els.image.parentElement.hidden = true;
      }

      els.link.href = link || '#';
      els.link.hidden = !link;
      // « Voir la demo » quand la version en ligne n'est pas le produit livre
      // mais une demonstration ; « Voir le site » pour les autres.
      if (els.linkLabel) els.linkLabel.textContent = linkLabel;

      open(modal, btn);
    });
  });
}

/* ---------------- Modale contact ---------------- */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  if (!modal) return;

  document.querySelectorAll('[data-open-contact]').forEach((btn) =>
    btn.addEventListener('click', () => open(modal, btn))
  );
}

/* ---------------- Le numéro, sur présentation ----------------
   Le numéro n'est pas en clair dans le HTML : il se recompose à partir de
   codes de caractères, et ne s'affiche qu'après trois informations. Les
   robots qui moissonnent les pages ne remplissent pas de formulaire, les
   démarcheurs automatisés non plus.

   Les trois informations partent au serveur AVANT que le numéro s'affiche
   (apps-script/Code.gs, type « numero ») : la porte n'a de sens que si elle
   tient. Un numéro affiché sans que la demande soit enregistrée, ce serait une
   porte peinte sur un mur.

   Le prix à payer est l'attente : Apps Script répond en une seconde et demie
   en général, mais monte à dix ou trente secondes sans prévenir. D'où le
   bouton qui annonce ce qu'il fait pendant ce temps, le plafond par tentative
   posé dans backend.js, et un message d'échec qui laisse réessayer plutôt que
   de laisser quelqu'un devant un bouton mort. */
function initPhoneGate() {
  const modal = document.getElementById('phoneModal');
  const form = document.getElementById('phoneForm');
  const reveal = document.getElementById('phoneReveal');
  if (!modal || !form || !reveal) return;

  // L'épreuve visuelle, commune aux deux formulaires (js/modules/defi.js).
  const defi = initDefi(form);

  // L'heure d'ouverture sert de garde-fou : le serveur refuse un envoi trop
  // rapide pour être humain.
  let ouvertureMs = Date.now();
  document.querySelectorAll('[data-open-phone]').forEach((btn) =>
    btn.addEventListener('click', () => {
      ouvertureMs = Date.now();
      defi?.melanger();
      open(modal, btn);
    })
  );

  const e164 = String.fromCharCode(43, 51, 51, 54, 56, 51, 48, 50, 51, 52, 52, 52);
  const lisible = ('0' + e164.slice(3)).replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  // Un numéro de n'importe quel pays : huit chiffres au moins, et les signes
  // qu'on écrit autour. La France n'est pas le seul terrain.
  const REGLES = {
    company: (v) => (v.trim().length >= 2 ? '' : 'Indiquez le nom de votre société.'),
    role: (v) => (v.trim().length >= 2 ? '' : 'Indiquez votre rôle.'),
    phone: (v) =>
      (v.match(/\d/g) || []).length >= 8 && /^[\d\s+.()-]+$/.test(v.trim())
        ? ''
        : 'Indiquez un numéro où vous joindre.',
  };

  const marquer = (champ, message) => {
    const bloc = champ.closest('.field');
    bloc?.classList.toggle('is-invalid', Boolean(message));
    const cible = bloc?.querySelector('.field-error');
    if (cible) cible.textContent = message;
  };

  // On ne corrige qu'un champ déjà signalé : personne n'aime être repris
  // pendant qu'il tape.
  form.addEventListener('input', (e) => {
    const champ = e.target;
    if (REGLES[champ.name] && champ.closest('.field')?.classList.contains('is-invalid')) {
      marquer(champ, REGLES[champ.name](champ.value));
    }
  });

  const bouton = form.querySelector('button[type="submit"]');
  const libelle = bouton.textContent;
  const statut = form.querySelector('.form-status');

  const afficher = () => {
    const lien = document.createElement('a');
    lien.className = 'btn btn-primary btn-block btn-lg';
    lien.href = `tel:${e164}`;
    lien.textContent = lisible;
    lien.setAttribute('aria-label', `Appeler le ${lisible}`);

    const note = document.createElement('p');
    note.className = 'phone-note';
    note.textContent = "Si je ne décroche pas, laissez un message ou écrivez-moi.";

    reveal.replaceChildren(lien, note);
    form.hidden = true;
    reveal.hidden = false;
    lien.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let premier = null;
    for (const [nom, regle] of Object.entries(REGLES)) {
      const champ = form.elements[nom];
      const message = regle(champ.value);
      marquer(champ, message);
      if (message && !premier) premier = champ;
    }
    if (premier) {
      premier.focus();
      return;
    }

    if (defi && !defi.verifier()) return;

    // Le champ piège rempli : on n'envoie rien, et on n'affiche rien non plus.
    if (form.elements.website?.value) return;

    bouton.disabled = true;
    bouton.textContent = 'Vérification…';
    statut.textContent = '';

    try {
      await poster({
        type: 'numero',
        company: form.elements.company.value.trim(),
        role: form.elements.role.value.trim(),
        phone: form.elements.phone.value.trim(),
        elapsed: Date.now() - ouvertureMs,
      });
      afficher();
    } catch (err) {
      statut.textContent = `Impossible d'enregistrer votre demande : ${String(err.message || '').replace(/\.*$/, '')}. Réessayez, ou passez par le formulaire de contact.`;
    } finally {
      bouton.disabled = false;
      bouton.textContent = libelle;
    }
  });
}
