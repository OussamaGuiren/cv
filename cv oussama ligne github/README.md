# Guide d'installation et d'utilisation

Vous avez rencontré une erreur CORS (Cross-Origin Request) ? C'est normal !

## 🚨 Pourquoi ça ne marche pas en double-cliquant sur index.html ?

Vous utilisez une architecture moderne avec des **Modules JavaScript (ES Modules)** (les fichiers dans le dossier `js/modules/`). 
Pour des raisons de sécurité, les navigateurs interdisent aux modules JavaScript d'accéder aux fichiers locaux via le protocole `file://` (c'est-à-dire quand vous ouvrez simplement le fichier depuis votre dossier).

Pour que ce site fonctionne avec cette nouvelle architecture, il **doit** être ouvert via un **serveur web local** (protocole `http://` ou `https://`).

## ✅ Solution 1 : Utiliser Visual Studio Code (Recommandé)

C'est la méthode la plus simple si vous développez le site.

1. Ouvrez le dossier du projet dans **VS Code**.
2. Installez l'extension gratuite **Live Server** (par Ritwick Dey).
3. Faites un clic droit sur le fichier `index.html`.
4. Cliquez sur **"Open with Live Server"**.
5. Le site s'ouvrira automatiquement à une adresse comme `http://127.0.0.1:5500/index.html` et tout fonctionnera parfaitement.

## ✅ Solution 2 : Python (Sans installation)

Si vous avez Python installé sur votre ordinateur :

1. Ouvrez un terminal (cmd ou PowerShell).
2. Placez-vous dans le dossier du projet :
   ```cmd
   cd "chemin/vers/votre/dossier/cv oussama ligne github"
   ```
3. Lancez un serveur temporaire :
   ```cmd
   python -m http.server 8000
   ```
4. Ouvrez votre navigateur et allez sur : `http://localhost:8000`

## ✅ Solution 3 : Node.js

Si vous avez Node.js installé :

1. Ouvrez un terminal dans le dossier du projet.
2. Lancez la commande :
   ```cmd
   npx serve
   ```
3. Ouvrez l'adresse indiquée dans le terminal.

## Structure du projet

L'architecture a été refondue pour être plus professionnelle :

*   **`/css/`** : Contient tous les styles découpés.
    *   `main.css` : Le chef d'orchestre qui importe tous les autres.
    *   `sections/` : Le style spécifique à chaque partie (hero, contact, etc.).
*   **`/js/`** : Contient la logique JavaScript.
    *   `main.js` : Le point d'entrée qui charge les modules.
    *   `modules/` : La logique découpée par fonctionnalité (forms.js, splash.js, etc.).
