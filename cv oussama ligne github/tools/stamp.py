"""
Inscrit une empreinte de contenu dans les liens CSS et JS des pages HTML,
et redate le sitemap quand le site a changé.

Pourquoi
--------
Les fichiers sont servis tels quels, sans en-tête de cache particulier : un
navigateur qui a déjà vu `sections.css` peut resservir l'ancienne version
pendant des jours après une mise en ligne. Ajouter `?v=<empreinte>` aux liens
force le rechargement dès que le contenu change, et seulement à ce moment-là.

La cascade
----------
Versionner seulement les liens du HTML ne suffit pas : `main.js` importe les
modules par leur chemin. Si l'on modifie `npc.js` sans toucher `main.js`,
l'empreinte de `main.js` ne bouge pas et le navigateur ressert les deux depuis
son cache — la modification ne part jamais. Le script versionne donc aussi les
spécificateurs d'import, en remontant le graphe de dépendances : modifier une
feuille change l'empreinte de tout ce qui en dépend.

Le script est idempotent : il retire les empreintes existantes avant d'en poser
de nouvelles, donc on peut le relancer autant de fois que voulu.

Usage, depuis la racine du site :
    python tools/stamp.py           # écrit les empreintes
    python tools/stamp.py --check   # ne modifie rien, sort en erreur si obsolète
"""
import hashlib
import re
import sys
from datetime import date
from pathlib import Path

HTML = Path('index.html')
JS_RACINE = Path('js/main.js')
SITEMAP = Path('sitemap.xml')

# `from './x.js'` ou `from "../y.js"`, avec ou sans empreinte déjà posée
IMPORT = re.compile(r"""(from\s+['"])(\.[^'"?]+\.js)(\?v=[0-9a-f]+)?(['"])""")
# href="css/x.css" ou src="js/main.js", avec ou sans empreinte
LIEN = re.compile(r"""((?:href|src)=")((?:css|js)/[^"?]+\.(?:css|js))(\?v=[0-9a-f]+)?(")""")


def empreinte(contenu: bytes) -> str:
    return hashlib.sha256(contenu).hexdigest()[:8]


def imports_de(chemin: Path, texte: str):
    """Chemins des modules importés, résolus depuis le fichier importateur."""
    return [(m.group(2), (chemin.parent / m.group(2)).resolve())
            for m in IMPORT.finditer(texte)]


def collecter(depuis: Path, vus: dict):
    """Parcours en profondeur : les dépendances avant ceux qui en dépendent."""
    cle = depuis.resolve()
    if cle in vus:
        return
    vus[cle] = None                                   # marque en cours
    texte = IMPORT.sub(r'\1\2\4', depuis.read_text(encoding='utf-8'))  # dé-versionné
    for _, cible in imports_de(depuis, texte):
        if cible.exists():
            collecter(cible, vus)
    vus[cle] = texte


def main():
    verifier = '--check' in sys.argv

    if not HTML.exists() or not JS_RACINE.exists():
        sys.exit('À lancer depuis la racine du site (là où se trouve index.html).')

    # --- 1. JS : empreintes en remontant le graphe ---
    sources = {}
    collecter(JS_RACINE, sources)

    empreintes = {}
    ecrits = {}

    def resoudre(chemin: Path) -> str:
        cle = chemin.resolve()
        if cle in empreintes:
            return empreintes[cle]

        texte = sources[cle]

        def remplacer(m):
            cible = (chemin.parent / m.group(2)).resolve()
            if cible not in sources:
                return m.group(0)
            return f'{m.group(1)}{m.group(2)}?v={resoudre(cible)}{m.group(4)}'

        final = IMPORT.sub(remplacer, texte)
        ecrits[cle] = final
        empreintes[cle] = empreinte(final.encode('utf-8'))
        return empreintes[cle]

    for cle in list(sources):
        resoudre(Path(cle))

    # --- 2. CSS : empreinte directe (aucun @import dans le projet) ---
    for css in sorted(Path('css').glob('*.css')):
        empreintes[css.resolve()] = empreinte(css.read_bytes())

    # --- 3. Réécriture des liens de chaque page HTML ---
    # Toutes les pages de la racine, pas seulement index.html : la page des
    # mentions légales charge les mêmes feuilles de style et doit être
    # rechargée quand elles changent.
    def lien(m):
        cible = Path(m.group(2)).resolve()
        h = empreintes.get(cible)
        return m.group(0) if h is None else f'{m.group(1)}{m.group(2)}?v={h}{m.group(4)}'

    pages = {}
    for page in sorted(Path('.').glob('*.html')):
        texte = page.read_text(encoding='utf-8')
        pages[page] = (texte, LIEN.sub(lien, texte))

    # --- 4. Écriture ou vérification ---
    changements = []
    for cle, texte in ecrits.items():
        p = Path(cle)
        if p.read_text(encoding='utf-8') != texte:
            changements.append(p.relative_to(Path.cwd()).as_posix())
            if not verifier:
                p.write_text(texte, encoding='utf-8')
    for page, (avant, apres) in pages.items():
        if avant != apres:
            changements.append(page.name)
            if not verifier:
                page.write_text(apres, encoding='utf-8')

    # Le sitemap n'est daté que si le site a réellement bougé : sinon `--check`
    # échouerait chaque jour sans qu'une seule ligne ait changé.
    if changements and SITEMAP.exists():
        xml = SITEMAP.read_text(encoding='utf-8')
        neuf = re.sub(r'<lastmod>[^<]*</lastmod>',
                      f'<lastmod>{date.today().isoformat()}</lastmod>', xml)
        if neuf != xml:
            changements.append('sitemap.xml')
            if not verifier:
                SITEMAP.write_text(neuf, encoding='utf-8')

    if verifier:
        if changements:
            print('Empreintes obsolètes : ' + ', '.join(changements))
            print('Lancez : python tools/stamp.py')
            sys.exit(1)
        print('Empreintes à jour.')
        return

    if changements:
        print('Mis à jour : ' + ', '.join(changements))
    else:
        print('Rien à faire, les empreintes sont déjà à jour.')

    print()
    for cle, h in sorted(empreintes.items(), key=lambda kv: str(kv[0])):
        try:
            nom = Path(cle).relative_to(Path.cwd()).as_posix()
        except ValueError:
            continue
        print(f'  {h}  {nom}')


if __name__ == '__main__':
    main()
