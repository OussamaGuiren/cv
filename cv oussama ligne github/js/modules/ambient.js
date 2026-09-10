/**
 * Animation d'ambiance : suspendue dès que sa section quitte l'écran.
 *
 * Le bandeau technos tourne en boucle infinie. Sans ce module il continue de
 * s'animer même à l'autre bout de la page — coût inutile, et batterie
 * consommée pour rien sur mobile.
 *
 * La mise en pause est faite en CSS (`animation-play-state`) : le JS ne fait que
 * poser une classe. Si l'observateur ne répond pas, les animations continuent
 * simplement de tourner — c'est le comportement d'avant, jamais une régression.
 */

/* Conteneur observé -> l'animation qu'il abrite est suspendue avec lui. */
const AMBIANCES = ['.marquee'];

export function initAmbient() {
  if (!('IntersectionObserver' in window)) return;

  const cibles = AMBIANCES
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);
  if (!cibles.length) return;

  const observateur = new IntersectionObserver(
    (entrees) =>
      entrees.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)),
    { threshold: 0 }
  );

  cibles.forEach((el) => observateur.observe(el));
}
