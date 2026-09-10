"""
Génère la feuille de sprites du marcheur : assets/img/walker.png (4 images de 12x16).

Usage, depuis la racine du site :
    python tools/walker.py

Pour redessiner le personnage, modifier les grilles ci-dessous — une lettre par
pixel, selon la palette PAL. Les assertions vérifient que chaque ligne fait bien
la bonne largeur.
"""
from pathlib import Path

from PIL import Image

W, H, FRAMES = 12, 16, 4

PAL = {
    '.': None,                   # transparent
    'k': (26, 26, 24, 255),      # contour, yeux, bouche
    's': (233, 190, 150, 255),   # peau
    'h': (58, 42, 26, 255),      # cheveux
    'b': (15, 108, 189, 255),    # chemise — couleur de marque (--brand)
    'd': (31, 58, 95, 255),      # pantalon
    'o': (38, 38, 36, 255),      # chaussures
}

# Buste, commun aux 4 images (lignes 0 à 12)
BUSTE = [
    "....hhhh....",
    "...hhhhhh...",
    "..hhhhhhhh..",
    "..hssssssh..",
    "..hkkskkkh..",
    "..hhskkshh..",
    "...hhhhhh...",
    ".....ss.....",
    "..bbbbbbbb..",
    ".sbbbbbbbbs.",
    ".sbbbbbbbbs.",
    "..bbbbbbbb..",
    "..dddddddd..",
]

# Jambes, propres à chaque image (lignes 13 à 15)
APPUI_G = ["..dd..dd....", ".dd....dd...", ".oo....oo..."]
PASSAGE = ["...dddd.....", "...dd.dd....", "..oo..oo...."]
APPUI_D = ["....dd..dd..", "...dd....dd.", "...oo....oo."]

# Cycle de marche classique : appui, passage, appui opposé, passage
CYCLE = [APPUI_G, PASSAGE, APPUI_D, PASSAGE]


def verifier(nom, lignes):
    for i, ligne in enumerate(lignes):
        assert len(ligne) == W, f'{nom}, ligne {i} : {len(ligne)} colonnes au lieu de {W}'


def main():
    verifier('buste', BUSTE)
    for nom, jambes in [('appui G', APPUI_G), ('passage', PASSAGE), ('appui D', APPUI_D)]:
        verifier(nom, jambes)

    sheet = Image.new('RGBA', (W * FRAMES, H), (0, 0, 0, 0))

    for f, jambes in enumerate(CYCLE):
        grille = BUSTE + jambes
        assert len(grille) == H, f'image {f} : {len(grille)} lignes au lieu de {H}'
        for y, ligne in enumerate(grille):
            for x, c in enumerate(ligne):
                couleur = PAL[c]
                if couleur:
                    sheet.putpixel((f * W + x, y), couleur)

    out = Path('assets/img/walker.png')
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, 'PNG', optimize=True)
    print(f'{out} — {sheet.width}x{sheet.height} px, {out.stat().st_size} octets')


if __name__ == '__main__':
    main()
