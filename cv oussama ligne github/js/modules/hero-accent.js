/**
 * L'accent du hero : ce qui distingue le nom et les références du reste.
 *
 * Le vocabulaire est celui du site — le pixel, déjà présent dans la nuée du
 * hero, le décor, le personnage et le « 1 » de l'affiche. Deux gestes :
 *
 *   - sous « Oussama Guiren », un trait fait de carrés ambre se dessine
 *     carré par carré. L'`ease` en paliers est ce qui compte : la largeur
 *     n'augmente pas de façon continue mais par bonds d'un carré, donc le
 *     trait se construit au lieu de grandir. Une fois posé, il reste : la
 *     marque tient toute seule pour qui arrive après le chargement ;
 *   - les sept références s'allument une par une, chacune avec son pixel.
 *     Le regard suit la liste au lieu de la survoler.
 *
 * Rien ici n'est nécessaire à la lecture : sans GSAP, ou si l'utilisateur
 * préfère moins de mouvement, le trait et les pixels sont simplement déjà
 * en place — c'est l'état que décrit le CSS.
 */

const TRAIT = 0.95;   // s : une fois le titre pose
const REFS = 1.5;     // s : une fois le bloc de references monte

export function initHeroAccent() {
  const { gsap } = window;
  if (!gsap) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  trait(gsap);
  references(gsap);
  return true;
}

function trait(gsap) {
  const regle = document.querySelector('.px-rule');
  const nom = regle?.parentElement;
  if (!regle || !nom) return;

  // La largeur est mesuree au demarrage du mouvement, pas maintenant : la
  // police d'affichage peut arriver entre les deux et changer la mesure.
  const largeur = () => nom.getBoundingClientRect().width;

  // Un palier par carre : le trait se pose carre apres carre. Le nombre de
  // paliers est fixe ici, a la creation — `ease` n'accepte pas de fonction,
  // une fonction y serait prise pour une courbe sur mesure.
  const carres = Math.max(4, Math.round(largeur() / 6));

  gsap.set(regle, { width: 0 });
  gsap.to(regle, {
    width: largeur,
    duration: 0.7,
    delay: TRAIT,
    ease: `steps(${carres})`,
    // Ensuite le CSS reprend la main, et le trait suit la largeur du nom.
    onComplete: () => gsap.set(regle, { clearProps: 'width' }),
  });
}

function references(gsap) {
  const lignes = gsap.utils.toArray('.hero-proof-list li');
  if (!lignes.length) return;
  const pixels = lignes.map((ligne) => ligne.querySelector('.px')).filter(Boolean);

  gsap.from(lignes, {
    color: 'rgba(255, 255, 255, 0.2)',
    duration: 0.45,
    delay: REFS,
    stagger: 0.08,
    ease: 'none',
  });
  gsap.from(pixels, {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.35,
    delay: REFS,
    stagger: 0.08,
    ease: 'back.out(2.5)',
  });
}
