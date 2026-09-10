/**
 * Le serveur : une Web App Google Apps Script (apps-script/Code.gs) qui
 * enregistre la demande dans une feuille Google, range la pièce jointe dans
 * Drive et prévient par mail. Deux formulaires y arrivent, distingués par
 * `type` : le formulaire de contact, et les trois informations demandées avant
 * d'afficher le numéro.
 *
 * `text/plain` et non `application/json` : ce type ne déclenche pas de requête
 * de contrôle CORS, qu'Apps Script ne sait pas traiter. Le serveur lit le corps
 * comme du JSON de toute façon.
 *
 * La reprise
 * ----------
 * Apps Script ne répond pas directement : il redirige vers une adresse
 * `script.googleusercontent.com` à usage unique, et c'est elle qui porte la
 * réponse. Cette redirection échoue de temps en temps, avec un 404 — le script
 * a tourné, la demande est enregistrée, mais le navigateur ne reçoit rien de
 * lisible. Traité comme un échec, cela affiche « envoi échoué » à quelqu'un
 * dont le message est pourtant bien arrivé, et le pousse à recommencer.
 *
 * D'où deux règles ici :
 *   - une réponse JSON du script est définitive, dans un sens comme dans
 *     l'autre : on ne réessaie jamais après une erreur de validation ;
 *   - une réponse qui ne porte pas d'identifiant n'en est pas une. Cette même
 *     redirection renvoie parfois vers l'adresse du déploiement, qui répond
 *     alors comme à une simple visite : `{ ok: true, … }` sans identifiant.
 *     Prise pour un accusé de réception, elle ferait annoncer « message
 *     envoyé » pour un message jamais parti, et afficher le numéro sans que
 *     la demande soit enregistrée. Chaque enregistrement réussi porte un `id` ;
 *     sans lui, on reprend ;
 *   - une réponse illisible ou une coupure réseau donne droit à une reprise,
 *     avec la même clé. Le serveur reconnaît cette clé et renvoie le résultat
 *     du premier passage au lieu d'enregistrer deux fois.
 */

export const ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzkUjSMXl6hLf-hFHG-XdZvp92ciYzKJUCursVV3SjjSkYZM5oZ83OlQ4i2ejCwGrCK/exec';

const ESSAIS = 2;        // un envoi, puis une reprise
const PAUSE_MS = 900;

/* Plafond par tentative. Apps Script repond en 1,5 s en general, mais monte a
   dix ou trente secondes sans prevenir. Sans plafond, un visiteur reste devant
   un bouton qui tourne sans savoir si quelque chose se passe. Une tentative
   coupee est reprise avec la meme cle : si le script avait fini malgre tout,
   il rend sa reponse au lieu d'enregistrer deux fois. */
const DELAI_MAX_MS = 10000;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* Le jeton d'authenticité. La page le calcule à partir de la clé de l'envoi,
   donc il change à chaque fois, et le serveur refait le calcul pour vérifier.
   Ce qu'il arrête : tout ce qui poste directement sur l'adresse du serveur
   sans exécuter cette page, c'est-à-dire l'essentiel des robots à formulaires,
   qui balaient le web et postent au hasard.

   Ce qu'il n'arrête pas : quelqu'un qui lit ce fichier et refait le calcul.
   Aucun contrôle posé dans le navigateur ne le peut, une question arithmétique
   pas davantage — elle coûterait en plus un champ à remplir à chaque visiteur.
   Le sel n'est pas un secret, il oblige seulement à venir le chercher ici.

   Le calcul reste volontairement élémentaire : il doit donner exactement le
   même résultat ici et dans Apps Script, sans dépendre d'une fonction que l'un
   des deux n'aurait pas. */
const SEL = 'ogtech-porte-2026';

export function preuve(cle) {
  const texte = SEL + cle;
  let h = 0;
  for (let i = 0; i < texte.length; i++) {
    h = (h * 31 + texte.charCodeAt(i)) % 2147483647;
  }
  return h.toString(36);
}

/** De quoi reconnaître deux envois du même message. */
function cleUnique() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export async function poster(data) {
  const cle = cleUnique();
  const corps = JSON.stringify({ ...data, cle, preuve: preuve(cle) });
  let dernierEchec = null;

  for (let tentative = 1; tentative <= ESSAIS; tentative++) {
    if (tentative > 1) await pause(PAUSE_MS);

    const arret = new AbortController();
    const minuteur = setTimeout(() => arret.abort(), DELAI_MAX_MS);

    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: corps,
        signal: arret.signal,
      });
    } catch {
      dernierEchec = new Error('le serveur ne répond pas');
      continue;
    } finally {
      clearTimeout(minuteur);
    }

    const texte = await res.text();
    let json = null;
    try {
      json = JSON.parse(texte);
    } catch {
      /* pas du JSON : la redirection a échoué en route */
    }

    // Un refus est définitif : la demande est arrivée, elle a été examinée.
    if (json && json.ok === false) {
      throw new Error(json.error || 'erreur du serveur');
    }
    // Un accusé de réception porte l'identifiant de la ligne enregistrée.
    if (json && json.ok === true && json.id) {
      return json;
    }

    dernierEchec = new Error(
      json ? "le serveur n'a pas confirmé l'enregistrement" : `réponse illisible (${res.status})`
    );
    console.warn('[OGTech] réponse inattendue du serveur', res.status, res.url, json);
  }

  throw dernierEchec;
}
