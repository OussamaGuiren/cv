/** Notifications éphémères, empilées en bas à droite. */

const ICONS = { success: 'circle-check', error: 'circle-exclamation', info: 'circle-info' };

/** Une icône du sprite en ligne (voir tools/icons.py). */
function icone(nom, classe = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', ['ico', classe].filter(Boolean).join(' '));
  svg.setAttribute('aria-hidden', 'true');

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${nom}`);
  svg.append(use);
  return svg;
}

function root() {
  let el = document.getElementById('toastRoot');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastRoot';
    el.className = 'toast-root';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.append(el);
  }
  return el;
}

export function showToast(message, type = 'info', { duration = 5000 } = {}) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = icone(ICONS[type] ?? ICONS.info, 'toast-icon');

  const text = document.createElement('p');
  text.className = 'toast-message';
  text.textContent = message;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Fermer la notification');
  close.append(icone('xmark'));

  toast.append(icon, text, close);
  root().append(toast);

  let timer = setTimeout(dismiss, duration);

  function dismiss() {
    clearTimeout(timer);
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  close.addEventListener('click', dismiss);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 2000); });

  return dismiss;
}
