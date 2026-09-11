/** Formulaire de contact : validation côté client puis envoi au Web App Apps Script. */

import { showToast } from './toast.js?v=c089a5e8';
import { initDefi } from './defi.js?v=9647ce21';
import { closeModal } from './modals.js?v=9ef4a1b4';
import { poster } from './backend.js?v=1cacc4b2';

/* 5 Mo : l'encodage Base64 ajoute ~33 %, ce qui reste sous les limites d'Apps Script. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'txt', 'md'];

const EMAIL_RE = /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
/* Un numéro de n'importe quel pays : les signes qu'on écrit autour, et entre
   huit et quinze chiffres. Les missions ne s'arrêtent pas à la France, un
   numéro belge, suisse ou luxembourgeois doit passer. Même règle côté serveur. */
const PHONE_RE = /^[\d\s+.()-]{8,24}$/;
const telOk = (v) => {
  const chiffres = (v.match(/\d/g) || []).length;
  return PHONE_RE.test(v.trim()) && chiffres >= 8 && chiffres <= 15;
};

const DEFAULT_FILE_LABEL =
  '<svg class="ico" aria-hidden="true"><use href="#i-paperclip"/></svg> Cliquer ou déposer un fichier';

/* Une règle par champ : évite cinq fonctions de validation quasi identiques. */
const RULES = {
  companyName: (v) =>
    !v ? 'Le nom de la société est requis.'
      : v.length < 2 ? 'Au moins 2 caractères.'
      : '',
  email: (v) =>
    !v ? "L'e-mail est requis."
      : !EMAIL_RE.test(v) ? 'E-mail invalide (ex : nom@domaine.fr).'
      : '',
  phone: (v) =>
    v && !telOk(v) ? 'Numéro invalide (ex : 06 12 34 56 78, +32 470 12 34 56).' : '',
  missionType: (v) => (!v ? 'Veuillez sélectionner un type de besoin.' : ''),
  message: (v) =>
    !v ? 'Merci de décrire votre besoin.'
      : v.length < 10 ? 'Au moins 10 caractères.'
      : ''
};

export function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  /* Horodatage d'ouverture : le serveur refuse les envois instantanés, qu'aucun
     humain ne produit. Mesuré au chargement, donc il ne peut que surestimer le
     temps de remplissage — jamais rejeter quelqu'un à tort. */
  const ouvertureMs = Date.now();

  /* L'épreuve visuelle, la même que sur la demande de numéro. Elle est
     retirée au sort à chaque ouverture de la fenêtre : sans cela, quelqu'un
     qui l'a résolue une fois la retrouverait déjà faite. */
  const defi = initDefi(form);
  document.querySelectorAll('[data-open-contact]').forEach((btn) =>
    btn.addEventListener('click', () => defi?.melanger())
  );

  const submitBtn = form.querySelector('#submitBtn');
  const status = form.querySelector('#formStatus');
  const fields = Object.keys(RULES)
    .map((name) => [name, form.elements[name]])
    .filter(([, el]) => el);

  /* ---------- Validation ---------- */
  function validateField(name, el, { silent = false } = {}) {
    const message = RULES[name]((el.value || '').trim());
    if (!silent) setFieldError(el, message);
    return !message;
  }

  function validateAll() {
    return fields.map(([name, el]) => validateField(name, el)).every(Boolean);
  }

  fields.forEach(([name, el]) => {
    const event = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(event, () => validateField(name, el));

    // Une fois le champ signalé en erreur, on corrige en direct.
    el.addEventListener('input', () => {
      if (el.closest('.field')?.classList.contains('is-invalid')) validateField(name, el);
    });
  });

  /* ---------- Fichier joint ---------- */
  const fileInput = form.querySelector('#jobDescriptionFile');
  const dropzone = form.querySelector('#dropzone');
  const fileLabel = form.querySelector('#fileName');
  const fileError = form.querySelector('#file-error');

  function setFileError(message) {
    if (fileError) fileError.textContent = message || '';
  }

  function validateFile(file) {
    if (!file || !file.size) return true;

    const ext = (file.name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
    if (!ALLOWED_EXT.includes(ext)) {
      setFileError('Format non autorisé. Utilisez PDF, DOC, DOCX, TXT ou MD.');
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`Fichier trop volumineux (${formatBytes(file.size)}). Maximum 5 Mo.`);
      return false;
    }
    setFileError('');
    return true;
  }

  function renderFile(file) {
    if (!fileLabel) return;

    if (!file) {
      fileLabel.innerHTML = DEFAULT_FILE_LABEL;
      return;
    }

    // textContent pour le nom du fichier : jamais d'injection via innerHTML.
    fileLabel.replaceChildren();
    const chip = document.createElement('span');
    chip.className = 'file-chip';

    const name = document.createElement('span');
    name.textContent = `${file.name} · ${formatBytes(file.size)}`;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'file-remove';
    remove.textContent = 'Retirer';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fileInput) fileInput.value = '';
      renderFile(null);
      setFileError('');
    });

    chip.append(name, remove);
    fileLabel.append(chip);
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!validateFile(file)) {
        fileInput.value = '';
        renderFile(null);
        return;
      }
      renderFile(file);
    });
  }

  if (fileLabel && fileInput) {
    fileLabel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }

  if (dropzone && fileInput) {
    ['dragenter', 'dragover'].forEach((type) =>
      dropzone.addEventListener(type, (e) => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
      })
    );

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');

      const file = e.dataTransfer?.files?.[0];
      if (!file || !validateFile(file)) return;

      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        renderFile(file);
      } catch {
        setFileError("Dépôt non pris en charge par ce navigateur, utilisez le sélecteur de fichier.");
      }
    });
  }

  /* ---------- Envoi ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Piège à robots : rempli = on simule un succès sans rien envoyer.
    if (form.elements.website?.value) return;

    if (defi && !defi.verifier()) {
      status.textContent = "Le personnage n'est pas encore sur ses pieds.";
      return;
    }

    const file = fileInput?.files?.[0];
    if (!validateAll() || !validateFile(file)) {
      status.textContent = 'Merci de corriger les erreurs indiquées.';
      form.querySelector('.field.is-invalid input, .field.is-invalid select, .field.is-invalid textarea')?.focus();
      return;
    }

    setBusy(true);
    status.textContent = '';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.jobDescriptionFile;   // objet File, non sérialisable

      // `website` (le champ piège) part volontairement : le serveur le
      // revérifie, car un robot qui ignore ce script n'est jamais passé par
      // le test ci-dessus.
      data.type = 'contact';               // l'autre type est la demande de numéro
      data.elapsed = Date.now() - ouvertureMs;

      if (file?.size) {
        data.fileName = file.name;
        data.fileType = file.type;
        data.fileBase64 = await toBase64(file);
      }

      await poster(data);

      form.reset();
      renderFile(null);
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
      form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });

      // La fenetre se retire, puis la confirmation s'affiche sur la page.
      closeModal();
      showToast('Message envoyé, merci. Je reviens vers vous dès que possible.',
                'success', { duration: 8000 });
    } catch (error) {
      // Le serveur ponctue ses messages, pas les nôtres : on égalise pour
      // éviter le « invalide.. » de deux points cote a cote.
      const raison = String(error.message || '').replace(/\.*$/, '');
      showToast(
        `L'envoi a échoué : ${raison}. Vous pouvez réessayer ou me joindre sur LinkedIn.`,
        'error',
        { duration: 8000 }
      );
    } finally {
      setBusy(false);
    }
  });

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Envoi en cours…' : 'Envoyer ma demande';
  }

  // Empêche la restauration des valeurs au retour arrière (bfcache).
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    form.reset();
    renderFile(null);
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  });
}

/* ---------------- Utilitaires ---------------- */

function setFieldError(el, message) {
  const field = el.closest('.field');
  const target = field?.querySelector('.field-error');

  field?.classList.toggle('is-invalid', Boolean(message));
  el.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (target) target.textContent = message;
}

function formatBytes(bytes) {
  const units = ['o', 'Ko', 'Mo'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${Math.round(value * 10) / 10} ${units[i]}`;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}
