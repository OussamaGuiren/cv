"""
Normalise un logo client pour la grille de références.

Les logos fournis par les clients ont des marges, des formats et des tailles
très différents. Posés tels quels dans la grille, certains paraissent deux fois
plus gros que d'autres. Ce script les ramène tous à la même boîte optique :
marges retirées, puis centrage dans un cadre 320 × 160 transparent.

Usage, depuis la racine du site :
    python tools/logos.py chemin/vers/capgemini.png capgemini

Produit assets/img/logo/capgemini.webp et .png, puis rappelle la ligne HTML à
ajouter dans la grille.

Les logos sont affichés en niveaux de gris au repos et en couleur au survol
(voir .logo-grid dans css/sections.css) : un logo sur fond transparent rend
mieux qu'un logo sur fond blanc, qui laisse un rectangle visible.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

BOITE = (320, 160)
SORTIE = Path('assets/img/logo')


def detourer(im: Image.Image) -> Image.Image:
    """Retire les marges uniformes, transparentes ou unies."""
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        alpha = im.split()[-1]
        if alpha.getextrema()[0] < 250:          # vraie transparence
            boite = alpha.getbbox()
            return im.crop(boite) if boite else im

    rgb = im.convert('RGB')
    fond = Image.new('RGB', rgb.size, rgb.getpixel((0, 0)))   # couleur du coin
    boite = ImageChops.difference(rgb, fond).getbbox()
    return im.crop(boite) if boite else im


def main():
    if len(sys.argv) != 3:
        sys.exit('Usage : python tools/logos.py <fichier source> <nom>\n'
                 'Exemple : python tools/logos.py ~/capgemini.png capgemini')

    source, nom = Path(sys.argv[1]), sys.argv[2]
    if not source.exists():
        sys.exit(f'Fichier introuvable : {source}')

    logo = detourer(Image.open(source))
    logo.thumbnail(BOITE, Image.LANCZOS)

    cadre = Image.new('RGBA', BOITE, (0, 0, 0, 0))
    cadre.paste(logo,
                ((BOITE[0] - logo.width) // 2, (BOITE[1] - logo.height) // 2),
                logo if logo.mode == 'RGBA' else None)

    SORTIE.mkdir(parents=True, exist_ok=True)
    webp = SORTIE / f'{nom}.webp'
    cadre.save(webp, 'WEBP', quality=90, method=6)
    cadre.save(SORTIE / f'{nom}.png', 'PNG', optimize=True)

    print(f'{webp} — recadré {logo.width}x{logo.height} dans {BOITE[0]}x{BOITE[1]}, '
          f'{webp.stat().st_size / 1024:.1f} Ko')
    print('\nÀ placer dans la grille de références (index.html), en remplacement')
    print('de la cellule typographique correspondante :\n')
    print(f'  <li><img src="assets/img/logo/{nom}.webp" alt="{nom.capitalize()}"'
          f' loading="lazy" decoding="async" width="320" height="160"></li>')


if __name__ == '__main__':
    main()
