/**
 * Les galeries horizontales, avec GSAP + ScrollTrigger.
 *
 * Deux sections — Services et Réalisations — sont des rails de diapositives.
 * Sur grand écran, la section s'épingle à l'écran et le rail glisse vers la
 * gauche d'autant que la page a défilé : le défilement vertical devient
 * horizontal. C'est le seul mouvement lié au défilement de la page.
 *
 * Deux garde-fous pour la lecture :
 *   - une fois le rail arrivé au bout, la section reste épinglée le temps
 *     d'une demi-hauteur d'écran de défilement. Sans cette pause, le rail —
 *     qui suit la main avec un peu d'inertie — était encore en train de
 *     rattraper quand la page repartait : un saut désagréable, et pas le
 *     temps de lire la dernière carte ;
 *   - quand on s'arrête, le rail se cale sur la diapositive la plus proche.
 *
 * Les deux bibliothèques sont chargées depuis le CDN dans index.html, avant
 * ce module. Si elles manquent (CDN bloqué, hors ligne), si l'utilisateur
 * préfère moins de mouvement, ou en dessous de 901px, rien n'est épinglé :
 * le CSS laisse le rail se faire glisser nativement, au doigt ou à la
 * molette. Même chose si l'écran est si large que le rail y tient presque
 * en entier : épingler pour trois cents pixels n'aurait aucun sens.
 */

const LISSAGE = 0.6;   // s : le rail suit la main, avec un peu d'inertie
const PAUSE = 0.5;     // part de la hauteur d'écran gardée épinglée une fois le rail arrivé
const SEUIL = 0.3;     // part de la largeur d'écran à parcourir en dessous de laquelle on n'épingle pas

export function initMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  gsap.registerPlugin(ScrollTrigger);

  // Signale au CSS que GSAP pilote les galeries : sur grand écran, elles
  // prennent l'écran et cachent leur débordement (voir .gsap .gallery).
  document.documentElement.classList.add('gsap');

  galeries(gsap);
  filet(gsap, ScrollTrigger);

  // Les polices et les images changent la hauteur de la page après coup :
  // on recale les déclencheurs une fois qu'elles sont là.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  return true;
}

function galeries(gsap) {
  gsap.matchMedia().add('(min-width: 901px)', () => {
    gsap.utils.toArray('.section-gallery').forEach((section) => {
      const galerie = section.querySelector('.gallery');
      const rail = section.querySelector('.gallery-track');
      if (!galerie || !rail) return;

      // La distance à parcourir : la largeur du rail moins celle de l'écran.
      // Recalculée à chaque changement de taille (invalidateOnRefresh).
      const distance = () => Math.max(0, rail.scrollWidth - galerie.clientWidth);
      const pause = () => window.innerHeight * PAUSE;

      // Rail presque entier à l'écran : une rangée simple, rien d'épinglé.
      if (distance() < window.innerWidth * SEUIL) {
        section.classList.add('is-flat');
        return;
      }

      // Les crans d'accrochage : le bord gauche de chaque diapositive, aligné
      // sur la marge, puis la fin de la pause. Exprimés en part de la course
      // totale (rail + pause), qui est ce que ScrollTrigger mesure.
      const diapos = [...rail.children];
      const marge = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      const crans = () => {
        const d = distance();
        const total = d + pause();
        const pts = diapos.map((s) => gsap.utils.clamp(0, 1, (s.offsetLeft - marge) / d) * (d / total));
        pts.push(1);
        return pts;
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + (distance() + pause()),
          pin: true,
          scrub: LISSAGE,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (p) => gsap.utils.snap(crans(), p),
            duration: { min: 0.2, max: 0.6 },
            delay: 0.1,
            ease: 'power1.inOut',
          },
        },
      });
      tl.to(rail, { x: () => -distance(), ease: 'none', duration: 1 })
        .to({}, { duration: pause() / distance() });   // la pause : rien ne bouge, la section reste
    });
  });
}

/* Le filet de sécurité : tout ici dépend de l'horloge de GSAP
   (requestAnimationFrame). Si elle n'avance pas — onglet en arrière-plan,
   environnement qui la bloque — les galeries épinglées seraient
   inaccessibles. Dans ce cas, et seulement dans ce cas, on rend la main au
   CSS, qui les laisse glisser nativement. */
function filet(gsap, ScrollTrigger) {
  const image = gsap.ticker.frame;
  setTimeout(() => {
    if (gsap.ticker.frame > image) return;   // l'horloge tourne : on la laisse faire
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    gsap.set('.gallery-track', { clearProps: 'all' });
    document.documentElement.classList.remove('gsap');
  }, 2500);
}
