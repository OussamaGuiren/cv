/**
 * Les galeries quand elles se font glisser (petit écran, ou sans épinglage).
 *
 * Deux choses ici, la même raison : sur un écran tactile, rien ne dit qu'un
 * rail déborde.
 *
 *   - le titre de section sort du rail et se pose au-dessus. En diapositive,
 *     il laissait une grande zone vide : le rail est aussi haut que la plus
 *     haute carte, et un titre suivi de deux lignes ne remplit pas ça. Posé
 *     au-dessus, il se lit d'emblée, et le rail commence par une carte —
 *     avec la suivante qui dépasse du bord, ce qui montre qu'il y en a
 *     d'autres. Sur grand écran, le titre retourne en première diapositive,
 *     là où la section s'épingle et où il tient toute la hauteur ;
 *   - la mention « Faites glisser » et un point par carte, sous le rail.
 *     Le point courant suit le glissé, et toucher un point amène sa carte.
 *
 * Ce module ne dépend pas de GSAP ; c'est le CSS qui masque les repères
 * quand la section est épinglée (le défilement vertical suffit alors).
 */

const PETIT = '(max-width: 900px)';

export function initGalleryNav() {
  document.querySelectorAll('.section-gallery').forEach(equiper);
}

function equiper(section) {
  const galerie = section.querySelector('.gallery');
  const rail = section.querySelector('.gallery-track');
  if (!galerie || !rail) return;

  // L'endroit où le titre se pose sur petit écran : au-dessus du rail, dans
  // la même colonne que le reste de la page.
  const intro = rail.querySelector('.gallery-intro');
  const socle = document.createElement('div');
  socle.className = 'container gallery-head';
  if (intro) galerie.before(socle);

  const nav = document.createElement('div');
  nav.className = 'container gallery-nav';
  nav.innerHTML = `
    <p class="gallery-hint">Faites glisser <svg class="ico" aria-hidden="true"><use href="#i-arrow-right"/></svg></p>
    <div class="gallery-dots"></div>`;
  const points = nav.querySelector('.gallery-dots');
  galerie.after(nav);

  const marge = () => parseFloat(getComputedStyle(rail).paddingLeft) || 0;
  let diapos = [];

  // La diapositive courante : celle dont le bord gauche est le plus proche
  // du bord gauche visible du rail.
  const marquer = () => {
    if (!diapos.length) return;
    const x = galerie.scrollLeft + marge();
    let courante = 0;
    diapos.forEach((diapo, i) => {
      if (Math.abs(diapo.offsetLeft - x) < Math.abs(diapos[courante].offsetLeft - x)) courante = i;
    });
    [...points.children].forEach((point, i) => point.toggleAttribute('aria-current', i === courante));
  };

  const compter = () => {
    diapos = [...rail.children];
    points.replaceChildren();
    diapos.forEach((diapo, i) => {
      const point = document.createElement('button');
      point.type = 'button';
      point.className = 'gallery-dot';
      point.setAttribute('aria-label', `Diapositive ${i + 1} sur ${diapos.length}`);
      point.addEventListener('click', () => {
        galerie.scrollTo({ left: diapo.offsetLeft - marge(), behavior: 'smooth' });
      });
      points.append(point);
    });
    nav.hidden = diapos.length < 2;
    marquer();
  };

  const petit = window.matchMedia(PETIT);
  const ranger = () => {
    if (!intro) return;
    if (petit.matches) socle.append(intro);
    else rail.prepend(intro);
    socle.hidden = !petit.matches;
  };

  // Au changement de palier : le titre change de place, le nombre de
  // diapositives avec lui. Ce module est appelé avant motion.js, donc avant
  // que GSAP ne pose son propre écouteur : le rail est déjà rangé quand
  // ScrollTrigger prend ses mesures.
  const ajuster = () => { ranger(); compter(); };
  petit.addEventListener('change', ajuster);
  ajuster();

  // Un léger différé : on ne recalcule pas à chaque pixel de glissé.
  let minuteur = null;
  galerie.addEventListener('scroll', () => {
    clearTimeout(minuteur);
    minuteur = setTimeout(marquer, 60);
  }, { passive: true });
}
