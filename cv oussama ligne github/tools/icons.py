"""
Construit le sprite SVG des icônes du site, à partir des polices Font Awesome.

Pourquoi
--------
Font Awesome coûtait 270 Ko : 18 Ko de feuille de style, 147 Ko de police
« solid », 105 Ko de police « brands » — pour 28 icônes réellement affichées.
Ce script extrait ces glyphes et rien d'autre, et les injecte en un sprite SVG
directement dans index.html, entre les repères ICONES:DEBUT et ICONES:FIN.
Plus de CDN externe, plus de police d'icônes, une requête de moins.

Comment
-------
Les glyphes viennent des fichiers officiels, donc le tracé est celui d'origine :
rien n'est redessiné à la main. La seule transformation est le retournement
vertical, les polices ayant l'axe Y vers le haut et le SVG vers le bas.

Prérequis :
    pip install fonttools brotli

Usage, depuis la racine du site :
    python tools/icons.py

Les deux fichiers .woff2 doivent se trouver à côté du script, ou être
téléchargés depuis le CDN Font Awesome (voir SOURCES ci-dessous).
"""
import re
import sys
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

BASE = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0'
SOURCES = {
    'solid': f'{BASE}/webfonts/fa-solid-900.woff2',
    'brands': f'{BASE}/webfonts/fa-brands-400.woff2',
    'css': f'{BASE}/css/all.min.css',
}

CIBLE = Path('index.html')
DEBUT, FIN = '<!-- ICONES:DEBUT -->', '<!-- ICONES:FIN -->'

# Les icônes réellement présentes dans index.html, par famille.
SOLID = [
    'arrow-right', 'arrow-trend-up', 'arrow-up-right-from-square', 'bolt',
    'chalkboard-user', 'chart-simple', 'circle-check', 'circle-exclamation',
    'circle-info', 'code', 'database',
    'envelope', 'layer-group', 'magnifying-glass', 'paperclip', 'phone',
    'robot', 'screwdriver-wrench', 'table-cells-large', 'wand-magic-sparkles',
    'xmark',
]
BRANDS = [
    'docker', 'gitlab', 'html5', 'linkedin', 'linkedin-in', 'linux',
    'microsoft', 'python', 'vuejs',
]


def codepoints(css: str) -> dict:
    """Nom d'icône -> point de code, lu dans la feuille officielle."""
    table = {}
    # Un bloc peut lister plusieurs alias avant une seule règle `content`.
    for bloc, code in re.findall(r'((?:\.fa-[a-z0-9-]+:before\s*,?\s*)+)\{\s*content:\s*"\\([0-9a-f]+)"', css):
        for nom in re.findall(r'\.fa-([a-z0-9-]+):before', bloc):
            table[nom] = int(code, 16)
    return table


def tracer(police: TTFont, point: int):
    """Renvoie (chemin SVG, largeur, hauteur) pour un point de code."""
    cmap = police.getBestCmap()
    if point not in cmap:
        return None
    nom = cmap[point]

    upm = police['head'].unitsPerEm
    ascent = police['hhea'].ascent
    jeu = police.getGlyphSet()
    largeur = police['hmtx'][nom][0] or upm

    plume = SVGPathPen(jeu)
    # Les polices ont l'axe Y vers le haut, le SVG vers le bas : on retourne.
    # Le pivot est la ligne d'ascendante, pas l'em : les glyphes descendent
    # sous la ligne de base (jusqu'a -64 chez Font Awesome) et, pivotes sur
    # l'em, ils debordaient du viewBox par le bas — d'ou des icones tronquees.
    jeu[nom].draw(TransformPen(plume, Transform(1, 0, 0, -1, 0, ascent)))
    return plume.getCommands(), largeur, upm


def main():
    ici = Path(__file__).parent
    manquants = [n for n in ('fa-solid-900.woff2', 'fa-brands-400.woff2', 'fa.css')
                 if not (ici / n).exists()]
    if manquants:
        print('Fichiers sources absents : ' + ', '.join(manquants))
        print('À récupérer depuis :')
        for cle, url in SOURCES.items():
            print(f'  {cle:7} {url}')
        sys.exit(1)

    table = codepoints((ici / 'fa.css').read_text(encoding='utf-8'))
    polices = {
        'solid': TTFont(ici / 'fa-solid-900.woff2'),
        'brands': TTFont(ici / 'fa-brands-400.woff2'),
    }

    symboles = []
    absents = []
    for famille, noms in (('solid', SOLID), ('brands', BRANDS)):
        for nom in noms:
            point = table.get(nom)
            trace = tracer(polices[famille], point) if point else None
            if not trace:
                absents.append(nom)
                continue
            chemin, largeur, hauteur = trace
            symboles.append(
                f'<symbol id="i-{nom}" viewBox="0 0 {largeur} {hauteur}">'
                f'<path d="{chemin}"/></symbol>'
            )

    if absents:
        print('Glyphes introuvables : ' + ', '.join(absents))
        sys.exit(1)

    sprite = ('<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'
              + ''.join(symboles) + '</svg>')

    html = CIBLE.read_text(encoding='utf-8')
    if DEBUT not in html or FIN not in html:
        sys.exit(f"Repères {DEBUT} / {FIN} absents d'index.html.")

    avant, reste = html.split(DEBUT, 1)
    _, apres = reste.split(FIN, 1)
    CIBLE.write_text(avant + DEBUT + sprite + FIN + apres, encoding='utf-8')

    print(f'{len(symboles)} icônes injectées dans {CIBLE} — {len(sprite) / 1024:.1f} Ko')


if __name__ == '__main__':
    main()
