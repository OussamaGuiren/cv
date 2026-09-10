/**
 * OGTech — réception du formulaire de contact et des demandes de numéro.
 *
 * À coller dans le projet Apps Script, à la place du code actuel, puis
 * redéployer : Déployer → Gérer les déploiements → crayon → Version : Nouvelle
 * version → Déployer. L'URL /exec ne change pas, donc rien à toucher côté site.
 *
 * Ce que fait ce script, dans l'ordre :
 *   1. il refuse ce qui n'est pas humain — champ piège rempli, envoi instantané,
 *      débit anormal. La validation du site est côté navigateur, donc
 *      contournable : il suffit de poster directement sur cette URL. C'est le
 *      vrai trou, et c'est ici qu'il se bouche ;
 *   2. il revalide chaque champ, avec les mêmes règles que le site ;
 *   3. il enregistre la pièce jointe dans Drive, puis la ligne dans la feuille ;
 *   4. il prévient par mail, et accuse réception au visiteur.
 *
 * L'ordre compte : la ligne est écrite AVANT les mails. Si l'envoi de mail
 * échoue — quota Google atteint, panne — la demande est déjà dans la feuille et
 * le visiteur reçoit quand même sa confirmation d'envoi. Rien ne se perd.
 *
 * Deux formulaires arrivent ici, distingués par `type` :
 *   - "contact" : le formulaire complet (société, e-mail, besoin, message,
 *     pièce jointe optionnelle) ;
 *   - "numero" : les trois informations demandées avant d'afficher le numéro
 *     de téléphone (société, rôle, téléphone).
 *
 * Les onglets de la feuille sont créés automatiquement s'ils manquent, avec
 * leurs entêtes : rien à préparer à la main.
 */

/* ------------------------------------------------------------------ réglages */

var CONFIG = {
  SPREADSHEET_ID: '1W02AGmprTeE885ffIcrH71S0ZkqqgQnto9ydJjZ2G60',

  /** Onglet du formulaire complet. */
  SHEET_NAME: 'Contact',

  /** Onglet des demandes de numéro. */
  SHEET_PHONE: 'Numero',

  /** Dossier Drive des pièces jointes ; vide = racine du Drive. */
  DRIVE_FOLDER_ID: '1H7w0L_YRl2e269Ore-YQkJ9vlfvGyIK2',

  /** Destinataire des notifications. Plusieurs adresses : séparées par une virgule. */
  NOTIFY_EMAIL: 'oguiren@yahoo.com',

  /** Nom affiché comme expéditeur des mails. */
  SENDER_NAME: 'Site OGTech',

  TIMEZONE: 'Europe/Paris',

  /** Taille maximale du corps de la requête, pièce jointe encodée comprise. */
  MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024,

  /** Envois acceptés par heure, tous expéditeurs confondus. */
  QUOTA_HORAIRE: 30,

  /** Un humain ne remplit pas le formulaire de contact en moins de trois secondes. */
  DELAI_MIN_MS: 3000,

  /**
   * Trois champs vont plus vite, surtout si le navigateur les remplit tout
   * seul. Le seuil est bas exprès : ici le champ piège fait le travail, et un
   * refus injustifié ne coûterait pas un numéro au visiteur — il l'a déjà —
   * mais me priverait de savoir qui l'a demandé.
   */
  DELAI_MIN_NUMERO_MS: 1000,

  /** Pause imposée entre deux envois d'un même expéditeur. */
  PAUSE_EXPEDITEUR_S: 60,

  /**
   * Durée de conservation, en jours. Trois ans, la durée recommandée par la
   * CNIL pour un prospect, annoncée sur la page des mentions légales. Au-delà,
   * `purgerAnciennesDemandes()` efface la ligne et sa pièce jointe.
   */
  CONSERVATION_JOURS: 3 * 365
};

var BESOINS = {
  formation: 'Formation IT',
  developpement: 'Développement',
  automatisation: 'Automatisation',
  other: 'Autre / à préciser'
};

var EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'];

/* Doit rester identique au SEL de js/modules/backend.js : les deux côtés font
   le même calcul et comparent le résultat. */
var SEL = 'ogtech-porte-2026';

/** Les entêtes des deux onglets. L'ordre fait foi à la création. */
var ENTETES_CONTACT = ['Id', 'date creation', 'Nom entreprise', 'email', 'téléphone',
  'Type mission', 'message', 'hasPieceJointe', 'Nom Piece Jointe', 'fileType',
  'driveFileId', 'driveFileUrl'];

var ENTETES_NUMERO = ['Id', 'date creation', 'Nom entreprise', 'rôle', 'téléphone'];

/* -------------------------------------------------------------------- entrée */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return refus_('Requête vide.');
    if (e.postData.contents.length > CONFIG.MAX_FILE_SIZE_BYTES) {
      return refus_('Demande trop volumineuse.');
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return refus_('Format de requête invalide.');
    }

    /* Même envoi que tout à l'heure ? Apps Script répond par une redirection
       vers une adresse à usage unique, et celle-ci échoue de temps en temps :
       le script a tourné, mais le navigateur n'a rien pu lire et recommence.
       La clé permet de lui rendre la réponse du premier passage au lieu
       d'enregistrer une deuxième fois et d'envoyer un doublon. */
    var cle = texte_(data.cle);
    var connue = cle ? CacheService.getScriptCache().get('cle:' + cle) : null;
    if (connue) {
      return ContentService.createTextOutput(connue)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Champ piège : un humain ne le voit pas, il est hors écran.
    if (texte_(data.website)) return refus_('Requête refusée.');

    /* Le jeton calculé par la page (js/modules/backend.js). Un robot qui poste
       directement sur cette adresse sans exécuter la page ne sait pas le
       produire. Contrôlé ici et pas seulement dans le navigateur : c'est tout
       l'intérêt, sinon il suffirait de ne pas exécuter le navigateur. */
    if (texte_(data.preuve) !== empreinte_(SEL + texte_(data.cle))) {
      return refus_('Requête refusée.');
    }

    // Envoi instantané : personne ne remplit un formulaire aussi vite.
    var minimum = texte_(data.type) === 'numero'
      ? CONFIG.DELAI_MIN_NUMERO_MS
      : CONFIG.DELAI_MIN_MS;
    var delai = Number(data.elapsed);
    if (isFinite(delai) && delai >= 0 && delai < minimum) {
      return refus_('Requête refusée.');
    }

    if (!consommerQuota_()) {
      return refus_('Trop de demandes reçues en ce moment. Réessayez dans une heure, '
                  + 'ou joignez-moi sur LinkedIn.');
    }

    var reponse = texte_(data.type) === 'numero' ? traiterNumero_(data) : traiterContact_(data);
    if (cle) memoriser_(cle, reponse);
    return reponse;

  } catch (err) {
    console.error(err);
    return refus_("La demande n'a pas pu être enregistrée.");
  }
}

/**
 * Un GET sert à vérifier que le déploiement répond, et rien d'autre. Sa réponse
 * ne porte volontairement PAS de `ok: true` : la redirection d'Apps Script
 * ramène parfois un POST jusqu'ici, et un `ok: true` serait alors pris par le
 * site pour un accusé de réception d'un enregistrement qui n'a pas eu lieu.
 */
function doGet() {
  return reponse_({ service: 'OGTech', statut: 'actif' });
}

/* ------------------------------------------------------- formulaire complet */

function traiterContact_(data) {
  var societe = texte_(data.companyName);
  var email = texte_(data.email);
  var tel = texte_(data.phone);
  var besoin = texte_(data.missionType);
  var message = texte_(data.message);

  var erreur = validerContact_(societe, email, tel, besoin, message, data);
  if (erreur) return refus_(erreur);

  // Un même expéditeur ne peut pas enchaîner les envois.
  if (rateLimite_('contact:' + email.toLowerCase())) {
    return refus_('Demande déjà reçue. Merci de patienter une minute.');
  }

  var maintenant = new Date();
  var id = genererId_();
  var fichier = { id: '', url: '' };

  if (data.fileBase64 && texte_(data.fileName)) {
    fichier = enregistrerDansDrive_(data.fileBase64, texte_(data.fileName), texte_(data.fileType));
  }

  ecrireLigne_(CONFIG.SHEET_NAME, ENTETES_CONTACT, {
    'Id': id,
    'date creation': isoDate_(maintenant),
    'Nom entreprise': societe,
    'email': email,
    'téléphone': tel,
    'Type mission': BESOINS[besoin],
    'message': message,
    'hasPieceJointe': Boolean(fichier.id),
    'Nom Piece Jointe': texte_(data.fileName),
    'fileType': texte_(data.fileType),
    'driveFileId': fichier.id,
    'driveFileUrl': fichier.url
  });

  // La ligne est écrite : à partir d'ici, plus rien ne peut faire échouer la
  // demande du point de vue du visiteur.
  var info = {
    id: id,
    date: dateFr_(maintenant),
    societe: societe,
    email: email,
    tel: tel,
    besoin: BESOINS[besoin],
    message: message,
    fichierUrl: fichier.url,
    fichierNom: texte_(data.fileName)
  };

  essayer_(function () { mailAdminContact_(info); });
  essayer_(function () { mailVisiteur_(info); });

  return reponse_({ ok: true, id: id, driveFileId: fichier.id, driveFileUrl: fichier.url });
}

function validerContact_(societe, email, tel, besoin, message, data) {
  if (societe.length < 2 || societe.length > 120) return 'Nom de société invalide.';
  if (!emailValide_(email) || email.length > 160) return 'Adresse e-mail invalide.';
  if (message.length < 10 || message.length > 5000) return 'Message invalide.';
  if (!BESOINS.hasOwnProperty(besoin)) return 'Type de besoin invalide.';
  if (tel && !telValide_(tel)) return 'Numéro de téléphone invalide.';

  if (data.fileBase64) {
    var ext = String(texte_(data.fileName)).toLowerCase().split('.').pop();
    if (EXTENSIONS.indexOf(ext) === -1) return 'Format de pièce jointe non autorisé.';
    if (String(data.fileBase64).length > CONFIG.MAX_FILE_SIZE_BYTES) {
      return 'Pièce jointe trop volumineuse.';
    }
  }
  return null;
}

/* ------------------------------------------------------- demande de numéro */

function traiterNumero_(data) {
  var societe = texte_(data.company);
  var role = texte_(data.role);
  var tel = texte_(data.phone);

  if (societe.length < 2 || societe.length > 120) return refus_('Nom de société invalide.');
  if (role.length < 2 || role.length > 120) return refus_('Rôle invalide.');
  if (!telValide_(tel)) return refus_('Numéro de téléphone invalide.');

  if (rateLimite_('numero:' + tel.replace(/\D/g, ''))) {
    return refus_('Demande déjà reçue.');
  }

  var maintenant = new Date();
  var id = genererId_();

  ecrireLigne_(CONFIG.SHEET_PHONE, ENTETES_NUMERO, {
    'Id': id,
    'date creation': isoDate_(maintenant),
    'Nom entreprise': societe,
    'rôle': role,
    'téléphone': tel
  });

  essayer_(function () {
    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: '[Site] Demande de numéro — ' + societe,
      body: [
        "Quelqu'un vient d'afficher votre numéro de téléphone.",
        '',
        'Société  : ' + societe,
        'Rôle     : ' + role,
        'Téléphone: ' + tel,
        'Date     : ' + dateFr_(maintenant),
        '',
        "Rien à faire de votre côté : cette personne a le numéro et vous",
        'appellera peut-être.'
      ].join('\n'),
      name: CONFIG.SENDER_NAME
    });
  });

  return reponse_({ ok: true, id: id });
}

/* --------------------------------------------------------------------- mails */

function mailAdminContact_(info) {
  var lignes = [
    'Société  : ' + info.societe,
    'E-mail   : ' + info.email,
    'Téléphone: ' + (info.tel || '—'),
    'Besoin   : ' + info.besoin,
    'Date     : ' + info.date,
    '',
    '--- Message ---',
    info.message
  ];
  if (info.fichierUrl) lignes.push('', 'Pièce jointe : ' + info.fichierNom, info.fichierUrl);
  lignes.push('', 'Feuille : ' + urlFeuille_());

  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: '[Site] ' + info.besoin + ' — ' + info.societe,
    body: lignes.join('\n'),
    replyTo: info.email,
    name: CONFIG.SENDER_NAME
  });
}

/**
 * L'accusé de réception. Écrit à la première personne, comme tout le site, et
 * sans promesse de délai : mieux vaut ne rien annoncer que d'afficher un délai
 * qu'on ne tiendra pas. Le message est renvoyé tronqué — cette adresse vient du
 * formulaire, donc de n'importe qui : autant limiter ce qu'on peut faire écrire
 * à ma place.
 */
function mailVisiteur_(info) {
  if (!emailValide_(info.email)) return;

  var extrait = info.message.length > 600 ? info.message.slice(0, 600) + '…' : info.message;

  MailApp.sendEmail({
    to: info.email,
    subject: 'Votre demande a bien été reçue — OGTech',
    body: [
      'Bonjour,',
      '',
      "J'ai bien reçu votre demande. Je la lis et je reviens vers vous.",
      '',
      "--- Ce que vous m'avez envoyé ---",
      'Société : ' + info.societe,
      'Besoin  : ' + info.besoin,
      '',
      extrait,
      '',
      '--',
      'Oussama Guiren, OGTech',
      'Formation IT, développement et automatisation',
      'https://ogtech.fr/'
    ].join('\n'),
    replyTo: CONFIG.NOTIFY_EMAIL,
    name: 'Oussama Guiren, OGTech'
  });
}

/* ----------------------------------------------------------- feuille & Drive */

/**
 * Écrit une ligne dans l'onglet demandé, en suivant l'ordre des entêtes
 * présentes dans la feuille — pas celui du code. Déplacer une colonne dans le
 * classeur ne casse donc rien. L'onglet est créé s'il manque, et le verrou
 * évite que deux requêtes simultanées écrivent sur la même ligne.
 */
function ecrireLigne_(onglet, entetesParDefaut, valeurs) {
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var feuille = ongletOuCree_(onglet, entetesParDefaut);
    var entetes = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h || '').trim(); });
    feuille.appendRow(entetes.map(function (h) {
      return valeurs.hasOwnProperty(h) ? valeurs[h] : '';
    }));
  } finally {
    verrou.releaseLock();
  }
}

function ongletOuCree_(nom, entetes) {
  var classeur = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var feuille = classeur.getSheetByName(nom);
  if (!feuille) {
    feuille = classeur.insertSheet(nom);
    feuille.appendRow(entetes);
    feuille.setFrozenRows(1);
  } else if (feuille.getLastRow() === 0) {
    feuille.appendRow(entetes);
    feuille.setFrozenRows(1);
  }
  return feuille;
}

function enregistrerDansDrive_(base64, nom, type) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64),
    type || 'application/octet-stream',
    nom || ('piece-jointe-' + Date.now())
  );
  var dossier = CONFIG.DRIVE_FOLDER_ID
    ? DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID)
    : DriveApp.getRootFolder();
  var fichier = dossier.createFile(blob);
  return { id: fichier.getId(), url: fichier.getUrl() };
}

function urlFeuille_() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getUrl();
  } catch (err) {
    return '';
  }
}

/* --------------------------------------------------------------- garde-fous */

/**
 * Quota glissant sur une heure, tous expéditeurs confondus. Le verrou évite que
 * deux requêtes simultanées lisent le même compteur et le dépassent toutes les
 * deux.
 */
function consommerQuota_() {
  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(5000);
  } catch (err) {
    return false;
  }
  try {
    var cache = CacheService.getScriptCache();
    var compteur = Number(cache.get('envois') || 0);
    if (compteur >= CONFIG.QUOTA_HORAIRE) return false;
    cache.put('envois', String(compteur + 1), 3600);
    return true;
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Garde la réponse d'un envoi pendant dix minutes, le temps qu'une reprise
 * arrive. Au-delà, il ne s'agit plus d'une reprise mais d'un nouvel envoi.
 */
function memoriser_(cle, reponse) {
  try {
    CacheService.getScriptCache().put('cle:' + cle, reponse.getContent(), 600);
  } catch (err) {
    console.error(err);   // le cache n'est pas critique : au pire, pas de reprise
  }
}

/** Vrai si cette clé a déjà été vue depuis moins d'une minute. */
function rateLimite_(cle) {
  var cache = CacheService.getScriptCache();
  if (cache.get(cle)) return true;
  cache.put(cle, '1', CONFIG.PAUSE_EXPEDITEUR_S);
  return false;
}

/* ------------------------------------------------------------------ purge */

/**
 * Efface les demandes plus anciennes que la durée annoncée, ligne et pièce
 * jointe comprises. Annoncer une durée de conservation sans l'appliquer ne vaut
 * rien : cette fonction est ce qui rend la promesse vraie.
 *
 * À déclencher une fois par mois, sans quoi elle ne s'exécute jamais :
 *   Apps Script → Déclencheurs → Ajouter un déclencheur
 *   Fonction : purgerAnciennesDemandes
 *   Source de l'événement : Horaire → Minuteur mensuel
 *
 * La suppression part du bas de la feuille : effacer une ligne décale toutes
 * celles du dessous, et parcourir vers le haut évite d'en sauter.
 */
function purgerAnciennesDemandes() {
  var limite = new Date();
  limite.setDate(limite.getDate() - CONFIG.CONSERVATION_JOURS);

  var total = 0;
  [CONFIG.SHEET_NAME, CONFIG.SHEET_PHONE].forEach(function (nom) {
    total += purgerOnglet_(nom, limite);
  });
  console.log('Purge terminée : ' + total + ' demande(s) effacée(s) avant le '
            + dateFr_(limite) + '.');
  return total;
}

function purgerOnglet_(nom, limite) {
  var classeur = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var feuille = classeur.getSheetByName(nom);
  if (!feuille || feuille.getLastRow() < 2) return 0;

  var valeurs = feuille.getDataRange().getValues();
  var entetes = valeurs[0].map(function (h) { return String(h || '').trim(); });
  var colDate = entetes.indexOf('date creation');
  var colFichier = entetes.indexOf('driveFileId');
  if (colDate === -1) return 0;

  var effacees = 0;
  for (var i = valeurs.length - 1; i >= 1; i--) {
    var brut = valeurs[i][colDate];
    if (!brut) continue;
    var date = brut instanceof Date ? brut : new Date(brut);
    if (isNaN(date.getTime()) || date >= limite) continue;

    if (colFichier !== -1 && valeurs[i][colFichier]) {
      essayer_(function () {
        DriveApp.getFileById(String(valeurs[i][colFichier])).setTrashed(true);
      });
    }
    feuille.deleteRow(i + 1);
    effacees++;
  }
  return effacees;
}

/* ------------------------------------------------------------- utilitaires */

function emailValide_(email) {
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(String(email || '').trim());
}

/**
 * Un numéro de n'importe quel pays : huit chiffres au moins, quinze au plus, et
 * seulement les signes qu'on écrit autour. Les missions ne s'arrêtent pas à la
 * France — un numéro belge, suisse ou luxembourgeois doit passer.
 */
function telValide_(tel) {
  var t = String(tel || '').trim();
  if (!/^[\d\s+.()-]{8,24}$/.test(t)) return false;
  var chiffres = t.replace(/\D/g, '').length;
  return chiffres >= 8 && chiffres <= 15;
}

function texte_(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/* Le même calcul que dans le navigateur, écrit de la même façon : multiplier
   par 31 et replier sur un entier de 31 bits reste exact des deux côtés, là où
   une fonction de hachage plus savante risquerait de diverger. */
function empreinte_(texte) {
  var h = 0;
  for (var i = 0; i < texte.length; i++) {
    h = (h * 31 + texte.charCodeAt(i)) % 2147483647;
  }
  return h.toString(36);
}

function isoDate_(d) {
  return Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function dateFr_(d) {
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
}

function genererId_() {
  return 'C-' + Math.floor(Date.now() / 1000).toString(36) + '-'
       + Math.random().toString(36).slice(2, 6);
}

/** Exécute sans laisser une panne d'envoi faire échouer une demande déjà enregistrée. */
function essayer_(fn) {
  try {
    fn();
  } catch (err) {
    console.error(err);
  }
}

function reponse_(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

function refus_(message) {
  return reponse_({ ok: false, error: message });
}
