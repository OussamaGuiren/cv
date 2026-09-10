# OGTech — site de présentation des services

Site vitrine d'Oussama Guiren, formateur IT et développeur freelance.
Objectif : présenter les prestations (formation, développement, automatisation)
et générer des prises de contact.

## Stack

Site statique — pas de bundler, pas de dépendances à installer.

- HTML5 sémantique
- CSS3 : variables natives, Grid, Flexbox, typographie fluide (`clamp()`)
- JavaScript : modules ES natifs, aucune bibliothèque
- Polices : Inter (Google Fonts)
- Icônes : sprite SVG en ligne, généré depuis Font Awesome (aucun CDN)

## Lancer en local

Les modules ES imposent un serveur HTTP (l'ouverture directe du fichier échoue).

```bash
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000>.

## Structure

```
index.html              la page du site
mentions-legales.html   mentions légales, données personnelles, cookies
css/
  tokens.css            variables : couleurs, typo, espacements, formes
  base.css              reset, typographie, accessibilité, mise en page
  components.css        boutons, cartes, tags, formulaire, modales, toasts
  sections.css          en-tête, hero, bandes de décor, logos, à propos, pied
js/
  main.js               point d'entrée
  modules/
    nav.js              en-tête collant, lien actif, menu mobile, retour en haut
    motion.js           l'épinglage des deux galeries horizontales (GSAP)
    gallery-nav.js      les repères de glissé des galeries (petit écran)
    hero-accent.js      le trait de pixels du nom, l'allumage des références
    ambient.js          le grain et les reliefs de fond
    npc.js              les personnages des bandes : marche, dialogue, contact
    modals.js           modales accessibles + la porte du numéro de téléphone
    contact-form.js     validation et envoi du formulaire
    backend.js          l'adresse du serveur et l'envoi, partagés
    toast.js            notifications
assets/
  img/                  images servies (AVIF + repli WebP)
  img/logo/             logos clients ; École des Douanes en SVG
  img/scene/            tuiles pixel des six décors (PNG)
  img/logo/             logos clients recadrés sur une boîte optique 2:1
  ../sources/           masters de régénération, hors du dossier servi
  favicon.svg
tools/
  walker.py             régénère le sprite du personnage
  decor.py              régénère les six décors (assets/img/scene/)
  icons.py              régénère le sprite d'icônes injecté dans index.html
  images.py             régénère toutes les images servies depuis ../sources/
  logos.py              normalise un logo client isolé
  stamp.py              repose les empreintes de cache
  pre-commit            copie du crochet git (voir « Mise en ligne »)
```

### Animations

Cinq effets seulement, tous neutralisés sous `prefers-reduced-motion` :

| Effet | Où | Mise en œuvre |
|---|---|---|
| Aurore + trame | hero | CSS pur, `transform` / `opacity` (GPU) |
| Titre ligne par ligne | hero | `overflow: hidden` + `translateY` |
| Personnage (PNJ) | bas de section | sprites + `steps(4)`, marche / parle / réagit au survol |
| Révélation au défilement | sections | IntersectionObserver, une fois par élément |
| Halo au curseur | cartes | `--mx` / `--my` écrits par `spotlight.js` |

#### Le personnage (PNJ)

En bas du hero vit un petit personnage pixel art, façon PNJ de jeu rétro. Il
n'est pas qu'un décor : **c'est un appel au contact déguisé**.

- Sprite original de 12×16 px, 4 images de marche (`assets/img/walker.png`,
  324 octets), animé en `steps(4)` — aucune interpolation, comme sur les
  consoles d'époque ; `image-rendering: pixelated` garde les pixels francs.
- **Deux boucles indépendantes** dans `npc.js` : il marche sans discontinuer, et
  le texte de la boîte change pendant qu'il avance. Les lier obligeait l'un à
  attendre l'autre — il passait la moitié du temps à l'arrêt. Il ne s'immobilise
  plus qu'au demi-tour, et au survol pour vous répondre.
- **La boîte de dialogue reste ouverte en permanence**, seul son texte change,
  frappé lettre par lettre.
- La boîte est donc **à taille fixe**, comme dans un jeu : en `max-content` elle
  grandirait et rétrécirait à chaque phrase. Elle ne se ferme qu'à la sortie de
  l'écran, et via `visibility` — avec `display: none` elle perdrait sa largeur,
  or celle-ci sert à borner le parcours.
- **Le parcours est borné par la largeur de la bulle** : elle suit le personnage
  pendant qu'il marche, donc il doit s'arrêter assez tôt pour qu'elle reste
  entièrement à l'écran. Recalculé à chaque pas (`limites()`), et sur un écran
  trop étroit il reste simplement au centre.
- Le pas fait **160 px, en absolu** (constante `PAS`) et non une fraction de la
  largeur : sinon l'attente entre deux répliques s'allongerait avec l'écran
  (elle atteignait 4,2 s en 1440 px). Silence mesuré : **1,72 s**, stable.
- Un **jeton de génération** empêche deux boucles de tourner en parallèle si
  `vivre()` est relancé (redimensionnement, sortie de survol) — sans lui les
  répliques se désynchronisaient.
- **Au survol il s'arrête**, propose « On en parle ? Cliquez ! » et un clic ouvre
  le formulaire de contact — c'est un `<button data-open-contact>`, donc câblé
  par `modals.js` comme les autres CTA.
- Le déplacement est une transition CSS sur `transform` ; le JS n'enchaîne que
  les étapes, avec des `setTimeout` (pas de `requestAnimationFrame`, qui se
  bloquerait si une frame était perdue).

Deux points de mise en page qui ont demandé du soin :

- **La bulle est recadrée** pour ne jamais sortir de l'écran, et sa pointe est
  décalée d'autant en sens inverse (`--tail`) afin de continuer à désigner le
  personnage. Le recadrage est calculé sur la largeur finale du texte, chevron
  compris, sinon la bulle débordait une fois la frappe terminée.
- **La réserve basse du hero** vaut exactement décalage + sprite + espace +
  bulle. Sous 640 px elle passe à 128 px et le rythme du hero se resserre, sinon
  le personnage tombait sous la ligne de flottaison.

Accessibilité : le sprite est `aria-hidden`, le bouton porte `aria-label="Me
contacter"`, et le clavier déclenche la même invitation que la souris. Sous
`prefers-reduced-motion` il ne déambule pas et ne frappe pas le texte : il
attend simplement qu'on vienne lui parler.

Pour le redessiner : modifier les grilles de `tools/walker.py` (une lettre =
un pixel, palette en tête de fichier) puis `python tools/walker.py`.

#### Les décors

Chaque section se termine par une **bande de décor** avec son propre paysage et
son personnage. En défilant, la bande s'en va avec sa section et on retrouve le
personnage plus bas, sur un autre terrain, qui pose les mêmes questions.

| Section | Décor | Contenu |
|---|---|---|
| Accueil | `ville` | immeubles, voitures, arbres |
| Services | `collines` | collines douces, sapins, barrières |
| Références | `montagnes` | sommets enneigés, conifères |
| Réalisations | `mer` | horizon marin, phare, barques |
| À propos | `parc` | arbres feuillus, bancs, lampadaires |
| Contact | `nuit` | ville de nuit, étoiles, lune |

Chaque décor tient en deux tuiles (`tools/decor.py`) : un plan lointain 200×36
et un plan proche 260×30, plus un dégradé de ciel en CSS. **Les treize images
pixel de tout le site pèsent 5,6 Ko**, personnage compris.

- Les tuiles se répètent en `repeat-x`, agrandies ×3 et ×4. Leurs largeurs
  affichées diffèrent (600 et 1040 px), donc les motifs ne se resynchronisent
  pas d'un plan à l'autre et la répétition ne saute pas aux yeux.
- **Chaque bande a ses propres répliques et son propre point de départ.** Les
  dialogues sont dans `PHRASES` (`npc.js`), une entrée par décor, et collent à
  la section qu'on est en train de lire — rien n'y est affirmé qui ne soit déjà
  écrit ailleurs sur le site. Les départs sont dispersés (6, 54, 24, 70, 14 et
  44 % du parcours) avec un sens de marche alterné : sans cela les six seraient
  alignés au même endroit et on verrait qu'il s'agit du même bloc répété.
- **Un seul personnage s'anime** : un `IntersectionObserver` réveille celui dont
  la bande est à l'écran et met les autres en pause. Sans cela six boucles
  tourneraient en permanence. Un filet de sécurité réveille à la main ceux qui
  sont visibles si l'observateur ne répond pas.
- **Un seul est atteignable au clavier.** Les cinq autres sont des répétitions
  décoratives (`tabindex="-1"`, `aria-hidden`) : sinon un lecteur d'écran
  annoncerait six fois le même bouton « Me contacter ».
- **Le bleu de marque est réservé au personnage.** Aucun décor ne le reprend —
  une première version donnait une voiture exactement de la couleur de sa
  chemise, dans laquelle il disparaissait en passant devant. Une ombre de
  contact, sans flou pour rester dans le langage pixel, le détache du fond.
- Les hauteurs sont des variables CSS (`--scene-h`, `--far-h`, `--near-h`,
  `--npc-h`…) et **chaque section réserve la place de sa bande** par un
  `padding-bottom` calculé à partir d'elles.

Pour redessiner un décor : modifier la fonction correspondante dans
`tools/decor.py` (une fonction par élément : `arbre`, `voiture`, `phare`…) puis
`python tools/decor.py`. Pour le personnage : `tools/walker.py`.

Le JS ne fait qu'écrire des variables CSS : aucun effet ne déclenche de calcul
de mise en page. Le halo est ignoré hors pointeur fin (`hover: hover`).

**`.reveal` masque le contenu**, donc la règle est portée par `html.js`, classe
posée par un script en tête de page : sans JavaScript, rien n'est caché.
`reveal.js` garde en plus un filet de sécurité si l'observateur défaille.

### Formats d'images

Le format est choisi par famille, pas uniformément — mesuré sur ce site :

| Famille | Format | Pourquoi |
|---|---|---|
| Captures de projets | **AVIF q60** + repli WebP | 33 % de moins que le WebP, sans différence visible sur le texte |
| Logos clients | **AVIF q70** + repli WebP | 8 à 37 % de moins ; le sans-perte serait 3 à 4× plus lourd |
| Logo des Douanes | **SVG** | vectoriel fourni : net à toute taille, 6,5 Ko |
| Pixel art | **PNG** | l'AVIF est 2 à 3× plus **lourd** — l'en-tête du conteneur dépasse le contenu sur 300 octets |
| Partage social | **JPEG** | les robots des réseaux gèrent mal AVIF et WebP |

AVIF et WebP couvrent ensemble ~99,5 % des navigateurs : un troisième niveau
JPEG/PNG serait du poids de dépôt pour personne. Régénération complète :
`python tools/images.py`, depuis les masters de `../sources/`.

### Règle de style

Toute valeur de couleur, taille, espacement ou rayon vient de `css/tokens.css`.
Ne pas écrire de valeur brute ailleurs : ajouter un token.

Un seul point de rupture (`900px`, bascule de la navigation). Le reste de la mise
en page s'adapte tout seul via `clamp()` et `repeat(auto-fit, minmax(...))`.

## Mise en ligne

`git push` suffit : Coolify sert le contenu de ce dossier tel quel, sans étape
de build. Deux mécanismes s'appuient là-dessus.

### Empreintes de cache

Les fichiers n'ont pas d'en-tête de cache particulier : sans empreinte, un
navigateur peut resservir un ancien CSS pendant des jours. `tools/stamp.py`
ajoute `?v=<empreinte>` aux liens **et aux imports de modules** — versionner
seulement le HTML ne suffirait pas, car modifier `npc.js` sans toucher
`main.js` ne changerait pas l'empreinte de ce dernier et le navigateur
resservirait les deux depuis son cache.

Le crochet `pre-commit` le lance automatiquement, donc rien à retenir. Après un
clone sur une autre machine, le réinstaller :

```bash
cp "cv oussama ligne github/tools/pre-commit" .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Vérification manuelle : `python tools/stamp.py --check` (sort en erreur si obsolète).

**Reste à faire côté hébergeur** : `index.html` lui-même n'est pas versionné —
c'est le document d'entrée. Si Coolify le sert avec un `Cache-Control` long,
les nouvelles empreintes n'arriveront pas. Un `max-age` court ou `no-cache`
sur le HTML seul suffit ; le reste peut être mis en cache très longtemps.

### Icônes

`tools/icons.py` extrait les glyphes réellement utilisés des polices Font
Awesome et les injecte dans `index.html` entre `<!-- ICONES:DEBUT -->` et
`<!-- ICONES:FIN -->`. À relancer après avoir ajouté une icône au site :
compléter les listes `SOLID` / `BRANDS` en tête du script, puis l'exécuter.
Il demande `fonttools`, `brotli` et les deux `.woff2` officiels — il indique
les URL s'ils manquent.

## Le serveur

Un seul Web App Google Apps Script reçoit les deux formulaires du site. Son
code est versionné dans `apps-script/Code.gs`, à la racine du dépôt — hors du
dossier servi, donc jamais publié. Son adresse est dans `js/modules/backend.js`,
partagée par les deux appelants.

Ce qu'il fait, pour chaque demande : il refuse ce qui n'est pas humain, revalide
chaque champ, range la pièce jointe dans Drive, écrit une ligne dans la feuille
Google, puis prévient par mail. **La ligne est écrite avant les mails** : si
l'envoi échoue — quota Google, panne — la demande est déjà enregistrée.

Deux formulaires, distingués par le champ `type` :

| `type` | Envoyé par | Champs | Onglet |
|---|---|---|---|
| `contact` | le formulaire complet | société, e-mail, téléphone (optionnel), type de besoin, message, pièce jointe | `Contact` |
| `numero` | la porte du numéro de téléphone | société, rôle, téléphone | `Numero` |

Les onglets sont créés automatiquement s'ils manquent, avec leurs entêtes. Les
lignes suivent l'ordre des entêtes **présentes dans la feuille**, pas celui du
code : déplacer une colonne dans le classeur ne casse rien.

### Ce qui filtre les robots

- champ piège `website`, présent dans les deux formulaires et revérifié côté
  serveur : le site l'écarte déjà, mais un robot qui ignore le JavaScript ne
  passe pas par là ;
- délai de remplissage (`elapsed`) : 3 s pour le formulaire de contact, 1 s
  pour la demande de numéro, qui n'a que trois champs ;
- quota horaire tous expéditeurs confondus, et pause d'une minute par
  expéditeur.

La validation du navigateur est contournable en postant directement sur l'URL :
c'est le vrai trou, et c'est le serveur qui le bouche. Les deux jeux de règles
sont identiques des deux côtés, numéro de téléphone compris — huit à quinze
chiffres, tous pays, puisque les missions ne s'arrêtent pas à la France.

### Le numéro de téléphone

Il n'est jamais en clair dans le HTML : il se recompose à partir de codes de
caractères (`js/modules/modals.js`), et ne s'affiche qu'après trois
informations. L'envoi au serveur ne conditionne rien — le numéro s'affiche
d'abord, et une panne de réseau ne prive personne de ce qu'il a demandé.

### Conservation des données

La page des mentions légales annonce trois ans de conservation, la durée
recommandée par la CNIL pour un prospect. Une promesse pareille ne vaut rien
si personne ne l'applique : `purgerAnciennesDemandes()` efface les lignes plus
anciennes, et met leur pièce jointe à la corbeille.

Elle ne s'exécute pas toute seule. Dans Apps Script :
Déclencheurs → Ajouter un déclencheur → fonction `purgerAnciennesDemandes`,
source « Horaire », minuteur mensuel.

### Mettre à jour le serveur

1. coller `apps-script/Code.gs` dans le projet Apps Script, à la place du code ;
2. Déployer → Gérer les déploiements → crayon → Version : Nouvelle version →
   Déployer.

L'URL `/exec` ne change pas : rien à toucher côté site ni côté Coolify. Vérifier
ensuite que `doGet` répond en ouvrant l'URL dans un navigateur.

## Mentions légales et données personnelles

`mentions-legales.html` réunit les mentions légales (LCEN) et l'information sur
le traitement des données (RGPD, article 13). Elle est liée depuis le pied de
page et depuis les deux formulaires, qui portent chacun une phrase courte
renvoyant vers elle.

Le site ne dépose **aucun cookie** : ni mesure d'audience, ni traceur, ni
stockage local. C'est pourquoi il n'y a pas de bandeau de consentement — il n'y
a rien à consentir. Deux ressources restent chargées depuis d'autres serveurs
(Google Fonts, cdnjs pour GSAP), ce qui leur transmet l'adresse IP du visiteur :
la page le dit.

Quatre informations sont à compléter avant la mise en ligne, surlignées en
jaune dans la page : statut juridique et SIREN, adresse professionnelle, TVA,
et l'hébergeur. Elles ne s'inventent pas.

## Accessibilité

- Contrastes vérifiés WCAG AA (`--brand` : 5,02:1 sur le fond clair)
- Navigation clavier complète, piège de focus dans les modales, lien d'évitement
- Cibles tactiles ≥ 44 px (WCAG 2.5.5)
- `prefers-reduced-motion` respecté (révélations et bandeau désactivés)

## Déploiement

Le site est le contenu de ce dossier, à servir tel quel.
La racine du dépôt contient ce dossier ; adapter le répertoire de publication
de l'hébergeur en conséquence.
