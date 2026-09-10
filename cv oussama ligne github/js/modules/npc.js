/**
 * Les personnages des bandes de décor, façon PNJ de jeu rétro.
 *
 * Chaque section se termine par une bande avec son paysage et son personnage.
 * Ils sont identiques et disent les mêmes choses : en défilant, on quitte l'un
 * avec sa section et on retrouve l'autre plus bas, sur un autre terrain.
 *
 * Boucle : il dit une phrase dans une boîte de dialogue, puis marche jusqu'au
 * prochain arrêt, et recommence. Au survol il s'arrête et propose d'engager la
 * conversation ; un clic ouvre le formulaire de contact (l'attribut
 * `data-open-contact` est câblé par modals.js).
 *
 * Seul le personnage visible s'anime : les autres sont mis en pause, sinon six
 * boucles tourneraient en permanence pour rien.
 */

/* Longueur d'un pas, en pixels. Fixe, et non une fraction de la largeur :
   sinon l'attente entre deux répliques s'allongerait avec la taille de l'écran. */
const PAS = 160;

/* Marge conservée aux deux extrémités du parcours. */
const BORD = 12;

/* Un jeu de répliques par décor. Deux décors seulement portent le personnage
   — la ville sous le hero, la nuit sous Contact : il se présente en arrivant,
   il attend à la sortie. Les quatre autres jeux sont là si un décor du milieu
   devait le reprendre un jour ; ils ne coûtent rien et évitent de réécrire ce
   qui a été pesé. Rien n'y est affirmé qui ne soit déjà écrit ailleurs. */
const PHRASES = {
  ville: [
    'Bonjour !Je suis Oussama. Formateur et Développeur.',
    'Un projet en tête ?',
    'Faites comme chez vous.'
  ],
  collines: [
    'Formation, dev ou automatisation ?',
    'Trois façons d’intervenir.',
    'Par où commence-t-on ?',
    'Seules ou combinées.'
  ],
  montagnes: [
    'Damart, OVH, Sogeti…',
    'Ils m’ont fait confiance.',
    'Surtout de la formation IT.',
    'Et votre équipe ?'
  ],
  mer: [
    'Quelques projets livrés.',
    'Un cas proche du vôtre ?',
    'Jetez un œil !',
    'D’autres ne sont pas publics.'
  ],
  parc: [
    'Enchanté !',
    'Un interlocuteur unique.',
    'Comprendre avant d’agir.',
    'Du cadrage à la livraison.'
  ],
  nuit: [
    'C’est le moment !',
    'Écrivez-moi.',
    'Un mail, et on en parle.',
    'À très vite ?'
  ]
};

const PHRASES_DEFAUT = PHRASES.ville;

const INVITE = 'On en parle ? Cliquez !';

/* Points de départ et sens initial, en fraction du parcours. Dispersés : deux
   personnages qui entreraient au même endroit et dans le même sens se
   verraient comme le même bloc répété. La liste garde six entrées, une par
   décor possible ; l'index est celui du personnage trouvé dans la page. */
const DEPARTS = [0.06, 0.54, 0.24, 0.70, 0.14, 0.44];
const SENS_INITIAL = [1, -1, 1, -1, 1, -1];

const VITESSE = 110;     // px/s — un cycle de sprite avance ≈ sa propre largeur
const FRAPPE_MS = 26;    // vitesse de frappe du texte
const LECTURE_MS = 2200; // temps de lecture avant la phrase suivante
const PAUSE_MS = 250;    // souffle avant de reprendre après un survol
const ARRET_MS = 700;    // temps d'arrêt en bout de course, avant demi-tour
const DEBUT_MS = 700;    // délai avant la première réplique

export function initNpc() {
  const personnages = [...document.querySelectorAll('[data-npc]')]
    .map((npc, i) => creer(npc, i))
    .filter(Boolean);
  if (!personnages.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  // Un seul s'anime : celui qu'on a sous les yeux. On observe la bande entière
  // et non le personnage : il ne fait que 48 px de haut, au ras du bas de sa
  // section, et ne franchirait un seuil qu'une fois très avancé dans l'écran.
  const parElement = new Map(personnages.map((p) => [p.element, p]));
  let observateurRepondu = false;

  const observateur = new IntersectionObserver(
    (entrees) => {
      observateurRepondu = true;
      entrees.forEach((e) => {
        const perso = parElement.get(e.target);
        if (e.isIntersecting) perso?.reveiller();
        else perso?.endormir();
      });
    },
    { threshold: 0 }
  );

  personnages.forEach((p) => observateur.observe(p.element));

  // Filet de sécurité : si l'observateur ne répond pas, tous les personnages
  // resteraient figés. On réveille alors, à la main, ceux qui sont à l'écran.
  setTimeout(() => {
    if (observateurRepondu) return;

    observateur.disconnect();
    const verifier = () =>
      personnages.forEach((perso) => {
        const r = perso.element.getBoundingClientRect();
        const visible = r.top < window.innerHeight && r.bottom > 0;
        if (visible) perso.reveiller();
        else perso.endormir();
      });

    verifier();
    window.addEventListener('scroll', verifier, { passive: true });
  }, 2000);
}

function creer(npc, index = 0) {
  const sprite = npc.querySelector('[data-npc-sprite]');
  const bubble = npc.querySelector('[data-npc-bubble]');
  const texte = npc.querySelector('[data-npc-text]');
  const stage = npc.parentElement;
  if (!sprite || !bubble || !texte || !stage) return null;

  const repliques = PHRASES[stage.dataset.scene] ?? PHRASES_DEFAUT;

  // L'attribut `hidden` du HTML protege le cas sans JS ; des que le script
  // tourne, la bulle garde sa boite et n'est que rendue invisible.
  bubble.hidden = false;
  bubble.classList.add('is-mute');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let minuteurs = [];
  /* Jeton de génération : `stop()` l'incrémente, et toute boucle dont le jeton
     n'est plus le courant s'arrête. Sans cela, une reprise pourrait laisser
     deux boucles tourner en parallèle et désynchroniser les répliques. */
  let generation = 0;
  let sens = SENS_INITIAL[index % SENS_INITIAL.length];
  let phrase = 0;
  let survol = false;
  let endormi = true;

  const attendre = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        minuteurs = minuteurs.filter((t) => t !== id);
        resolve();
      }, ms);
      minuteurs.push(id);
    });

  function stop() {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
    generation += 1;
  }

  const course = () =>
    Math.max(0, stage.clientWidth - sprite.offsetWidth - BORD * 2);

  const position = () => Number(npc.dataset.x) || 0;

  function placer(x, duree = 0) {
    npc.dataset.x = String(x);
    npc.style.transition = duree ? `transform ${duree}ms linear` : 'none';
    npc.style.transform = `translateX(${(BORD + x).toFixed(1)}px)`;
  }

  /* La bulle est centrée sur le personnage, mais elle ne doit jamais sortir de
     l'écran. On la décale si besoin, et on déplace sa pointe d'autant en sens
     inverse pour qu'elle continue de le désigner. */
  function recadrerBulle() {
    bubble.style.translate = '-50% 0';
    bubble.style.removeProperty('--tail');

    const marge = 12;
    const r = bubble.getBoundingClientRect();
    let dx = 0;
    if (r.left < marge) dx = marge - r.left;
    else if (r.right > window.innerWidth - marge) dx = window.innerWidth - marge - r.right;
    if (!dx) return;

    bubble.style.translate = `calc(-50% + ${dx.toFixed(0)}px) 0`;
    bubble.style.setProperty('--tail', `calc(50% - ${dx.toFixed(0)}px)`);
  }

  function dire(message, { typed = true } = {}) {
    bubble.classList.remove('is-mute', 'is-typing');

    if (!typed) {
      texte.textContent = message;
      recadrerBulle();
      return Promise.resolve();
    }

    // On réserve la largeur finale — chevron compris — avant de frapper, sinon
    // la bulle s'élargirait en fin de phrase et sortirait du recadrage.
    texte.textContent = message;
    recadrerBulle();
    texte.textContent = '';
    bubble.classList.add('is-typing');

    return new Promise((resolve) => {
      let i = 0;
      const frapper = () => {
        texte.textContent = message.slice(0, ++i);
        if (i < message.length) {
          minuteurs.push(setTimeout(frapper, FRAPPE_MS));
        } else {
          bubble.classList.remove('is-typing');
          resolve();
        }
      };
      frapper();
    });
  }

  function taire() {
    bubble.classList.add('is-mute');
    bubble.classList.remove('is-typing');
    texte.textContent = '';
  }

  /* ---- Deux boucles indépendantes ----
     Il marche sans discontinuer et le texte change pendant qu'il avance. Les
     lier obligerait l'un à attendre l'autre : c'était le cas tant que la bulle
     s'ouvrait et se refermait, ça n'a plus lieu d'être maintenant qu'elle reste
     affichée. */
  async function boucleParole(jeton) {
    while (courante(jeton)) {
      await dire(repliques[phrase % repliques.length]);
      phrase += 1;
      if (!courante(jeton)) return;
      await attendre(LECTURE_MS);
    }
  }

  async function boucleMarche(jeton) {
    while (courante(jeton)) {
      const auBout = await marcher();
      if (!courante(jeton)) return;
      // Un temps d'arrêt au demi-tour, sinon il fait la navette sans répit sur
      // les écrans étroits où le parcours est court.
      await attendre(auBout ? ARRET_MS : 0);
    }
  }

  /* La bulle est centrée sur lui et le suit pendant qu'il marche : son parcours
     doit donc s'arrêter assez tôt pour qu'elle reste entièrement à l'écran.
     Recalculé à chaque pas, la largeur pouvant changer (polices, rotation). */
  function limites() {
    const marge = 12;
    const demiBulle = bubble.offsetWidth / 2;
    const demiPerso = sprite.offsetWidth / 2;
    const min = marge - BORD - demiPerso + demiBulle;
    const max = stage.clientWidth - marge - BORD - demiPerso - demiBulle;

    // Écran trop étroit pour que la bulle tienne : il reste au centre.
    if (min > max) {
      const centre = course() / 2;
      return [centre, centre];
    }
    return [Math.max(0, min), Math.min(course(), max)];
  }

  /* Renvoie vrai s'il vient d'atteindre une extrémité du parcours. */
  async function marcher() {
    const [min, max] = limites();

    // Demi-tour quand il atteint une extrémité.
    if (sens > 0 && position() >= max - 1) sens = -1;
    else if (sens < 0 && position() <= min + 1) sens = 1;

    const depart = position();
    const cible = Math.min(max, Math.max(min, depart + sens * PAS));
    const distance = Math.abs(cible - depart);

    // Nulle part où aller : on temporise, sinon la boucle tournerait à vide.
    if (distance < 1) {
      await attendre(ARRET_MS);
      return false;
    }

    const duree = (distance / VITESSE) * 1000;
    sprite.classList.toggle('is-facing-left', cible < depart);
    sprite.classList.add('is-walking');
    placer(cible, duree);
    await attendre(duree);
    sprite.classList.remove('is-walking');

    return cible <= min + 1 || cible >= max - 1;
  }

  const courante = (jeton) => jeton === generation && !survol && !endormi;

  function vivre(jeton = generation) {
    if (!courante(jeton)) return;
    boucleParole(jeton);
    boucleMarche(jeton);
  }

  /* ---- Interaction ---- */
  function accueillir({ typed }) {
    survol = true;
    stop();
    sprite.classList.remove('is-walking', 'is-facing-left');
    // Il fige sa position courante plutôt que de finir sa transition.
    const rect = npc.getBoundingClientRect();
    const base = stage.getBoundingClientRect();
    placer(rect.left - base.left - BORD);
    dire(INVITE, { typed });
  }

  function reprendre() {
    survol = false;
    stop();
    // Pas de `taire()` : la bulle reste ouverte, la prochaine phrase remplacera
    // simplement l'invitation.
    if (!reduced && !endormi) minuteurs.push(setTimeout(() => vivre(), PAUSE_MS));
  }

  npc.addEventListener('pointerenter', () => accueillir({ typed: !reduced }));
  npc.addEventListener('pointerleave', reprendre);

  // Le clavier obtient le même égard que la souris.
  npc.addEventListener('focus', () => accueillir({ typed: false }));
  npc.addEventListener('blur', reprendre);

  // Un changement de largeur invalide les distances : on le ramène dans le cadre.
  window.addEventListener('resize', () => {
    if (survol || endormi) return;
    stop();
    placer(Math.min(position(), course()));
    minuteurs.push(setTimeout(() => vivre(), 400));
  }, { passive: true });

  {
    const [min, max] = limites();
    placer(min + DEPARTS[index % DEPARTS.length] * (max - min));
  }

  return {
    /* C'est la bande qu'on observe, pas le bouton : voir initNpc(). */
    element: stage,

    reveiller() {
      if (!endormi) return;
      endormi = false;
      stop();
      minuteurs.push(setTimeout(() => vivre(), DEBUT_MS));
    },

    endormir() {
      if (endormi) return;
      endormi = true;
      stop();
      taire();
      sprite.classList.remove('is-walking');
    }
  };
}
