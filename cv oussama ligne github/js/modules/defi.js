/**
 * L'épreuve des formulaires : le personnage du site, posé de travers, à
 * remettre sur ses pieds. Un quart de tour par clic ; l'envoi n'est accepté
 * que quand il est d'aplomb.
 *
 * Ce que ça vaut, dit franchement : une friction devant un robot qui
 * remplirait les champs. Ce n'est pas un verrou — la vérification vit dans le
 * navigateur, donc contournable par qui lit ce fichier. Les vrais garde-fous
 * sont côté serveur : le jeton calculé par la page (backend.js), le champ
 * piège, le délai de remplissage et le quota.
 *
 * L'accessibilité n'est pas une option ici : une épreuve visuelle sans autre
 * chemin ferme le site à ceux qui ne voient pas. D'où le bouton de rotation,
 * qui est un vrai bouton atteignable au clavier, et la sortie vers LinkedIn
 * placée sous l'image dans le HTML.
 */

const SENS = [90, 180, 270];   // jamais 0 : il y a toujours quelque chose à faire

export function initDefi(form) {
  const bloc = form?.querySelector('.defi');
  const sujet = bloc?.querySelector('[data-defi-sujet]');
  const tourner = bloc?.querySelector('[data-defi-tourner]');
  const erreur = bloc?.querySelector('.field-error');
  if (!bloc || !sujet || !tourner) return null;

  let angle = 0;

  const poser = (valeur) => {
    angle = ((valeur % 360) + 360) % 360;
    sujet.style.rotate = `${angle}deg`;
  };

  const effacer = () => {
    bloc.classList.remove('is-invalid');
    if (erreur) erreur.textContent = '';
  };

  tourner.addEventListener('click', () => {
    poser(angle + 90);
    effacer();
  });

  const melanger = () => {
    poser(SENS[Math.floor(Math.random() * SENS.length)]);
    effacer();
  };

  melanger();

  return {
    melanger,

    /** Vrai si le personnage est d'aplomb ; sinon le signale et prend le focus. */
    verifier() {
      if (angle === 0) return true;
      bloc.classList.add('is-invalid');
      if (erreur) erreur.textContent = "Le personnage n'est pas encore sur ses pieds.";
      tourner.focus();
      return false;
    },
  };
}
