"""
Génère les décors pixel art du bandeau de bas de page, dans assets/img/scene/.

Chacun tient en deux tuiles répétées horizontalement : un plan lointain
(200x36) et un plan proche (260x30).

Deux décors seulement sont servis aujourd'hui — `ville` sous l'accueil et
`nuit` sous Contact : le monde pixel encadre la page au lieu de la ponctuer à
chaque section. Les quatre autres restent générés ici, et leurs fichiers ont
été retirés d'assets. Pour en remettre un : relancer ce script, remettre la
bande dans index.html et sa paire de règles `[data-scene="…"]` dans
css/sections.css.

    ville-*       accueil        immeubles, voitures, arbres
    collines-*    services       collines douces, sapins, barrière
    montagnes-*   références     sommets enneigés, conifères
    mer-*         réalisations   horizon marin, phare, barques
    parc-*        à propos       arbres feuillus, bancs, lampadaires
    nuit-*        contact        ville de nuit, étoiles, lune

Les largeurs des deux plans diffèrent : une fois répétés, leurs motifs ne se
resynchronisent pas, donc la répétition ne saute pas aux yeux.

Usage, depuis la racine du site :
    python tools/decor.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path('assets/img/scene')
LOIN = (200, 36)   # plan lointain
PRES = (260, 30)   # plan proche

# Le bleu de marque (#0F6CBD) est réservé au personnage : aucun décor ne le
# reprend, sinon il disparaîtrait dedans en passant devant.
C = {
    'mur':        (143, 169, 196), 'mur2':      (124, 150, 178),
    'vitre':      (200, 215, 230), 'vitre_on':  (255, 214, 138),
    'tronc':      (107, 90, 74),   'feuille':   (123, 163, 127),
    'feuille2':   (105, 145, 110), 'sapin':     (86, 128, 100),
    'sapin2':     (70, 108, 84),   'colline':   (150, 183, 152),
    'colline2':   (128, 165, 132), 'roche':     (146, 156, 172),
    'roche2':     (124, 134, 152), 'neige':     (238, 243, 249),
    'mer':        (138, 180, 200), 'mer2':      (116, 160, 184),
    'sable':      (216, 200, 170), 'phare':     (222, 226, 232),
    'phare2':     (186, 96, 78),   'bois':      (150, 124, 96),
    'ambre':      (214, 163, 74),  'terre':     (176, 92, 74),
    'roue':       (44, 48, 54),    'poteau':    (120, 128, 138),
    'nuit_mur':   (52, 62, 84),    'nuit_mur2': (40, 49, 68),
    'etoile':     (226, 234, 246), 'lune':      (245, 240, 220),
}


def toile(taille):
    im = Image.new('RGBA', taille, (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def bloc(d, x1, y1, x2, y2, couleur):
    d.rectangle([x1, y1, x2, y2], fill=(*C[couleur], 255))


# ---------------------------------------------------------------- éléments

def immeuble(d, x, sol, w, h, mur, vitre, allumees=()):
    bloc(d, x, sol - h, x + w - 1, sol - 1, mur)
    i = 0
    for fy in range(sol - h + 3, sol - 3, 5):
        for fx in range(x + 2, x + w - 3, 4):
            bloc(d, fx, fy, fx + 1, fy + 1, 'vitre_on' if i in allumees else vitre)
            i += 1


def arbre(d, x, sol, h=22):
    bloc(d, x + 5, sol - h // 3, x + 7, sol - 1, 'tronc')
    cime = sol - h
    bloc(d, x + 3, cime + 4, x + 9, cime + 10, 'feuille')
    bloc(d, x + 1, cime + 6, x + 11, cime + 12, 'feuille')
    bloc(d, x + 4, cime, x + 8, cime + 5, 'feuille2')
    bloc(d, x + 2, cime + 11, x + 10, cime + 13, 'feuille2')


def sapin(d, x, sol, h=20, teinte='sapin'):
    bloc(d, x + 4, sol - 4, x + 5, sol - 1, 'tronc')
    etage = max(3, (h - 4) // 3)
    for i in range(3):
        larg = 1 + i * 2
        haut = sol - 4 - (3 - i) * etage
        bloc(d, x + 4 - larg, haut, x + 5 + larg, haut + etage,
             teinte if i % 2 == 0 else 'sapin2')


def buisson(d, x, sol, w=9):
    bloc(d, x, sol - 4, x + w, sol - 1, 'feuille2')
    bloc(d, x + 2, sol - 6, x + w - 2, sol - 3, 'feuille')


def voiture(d, x, sol, couleur):
    """13 px de haut pour 16 px au personnage : le rapport réel."""
    bloc(d, x, sol - 7, x + 27, sol - 3, couleur)
    bloc(d, x + 6, sol - 13, x + 19, sol - 8, couleur)
    bloc(d, x + 7, sol - 12, x + 11, sol - 10, 'vitre')
    bloc(d, x + 13, sol - 12, x + 18, sol - 10, 'vitre')
    bloc(d, x + 3, sol - 3, x + 6, sol - 1, 'roue')
    bloc(d, x + 21, sol - 3, x + 24, sol - 1, 'roue')


def lampadaire(d, x, sol, h=20):
    bloc(d, x, sol - h, x + 1, sol - 1, 'poteau')
    bloc(d, x, sol - h, x + 4, sol - h + 1, 'poteau')
    bloc(d, x + 3, sol - h + 2, x + 5, sol - h + 3, 'vitre_on')


def cloture(d, x1, x2, sol):
    bloc(d, x1, sol - 5, x2, sol - 4, 'bois')
    bloc(d, x1, sol - 8, x2, sol - 7, 'bois')
    for px in range(x1, x2, 9):
        bloc(d, px, sol - 10, px + 1, sol - 1, 'bois')


def banc(d, x, sol):
    bloc(d, x, sol - 5, x + 15, sol - 4, 'bois')
    bloc(d, x, sol - 9, x + 15, sol - 8, 'bois')
    bloc(d, x + 1, sol - 4, x + 2, sol - 1, 'poteau')
    bloc(d, x + 13, sol - 4, x + 14, sol - 1, 'poteau')


def colline(d, cx, sol, w, h, teinte):
    """Demi-ellipse en escalier : la courbe reste faite de pixels francs."""
    for i in range(h):
        demi = max(1, int(w * (1 - (i / h) ** 2) ** 0.5))
        bloc(d, cx - demi, sol - i - 1, cx + demi, sol - i - 1, teinte)


def montagne(d, cx, sol, w, h, neige=True):
    for i in range(h):
        demi = max(0, int(w * (1 - i / h)))
        bloc(d, cx - demi, sol - i - 1, cx + demi, sol - i - 1,
             'roche' if i % 3 else 'roche2')
    if neige:
        for i in range(int(h * 0.72), h):
            demi = max(0, int(w * (1 - i / h)))
            bloc(d, cx - demi, sol - i - 1, cx + demi, sol - i - 1, 'neige')


def phare(d, x, sol, h=16):
    """Phare posé sur un récif : sans base il semblerait flotter sur l'eau."""
    bloc(d, x - 3, sol - 4, x + 9, sol - 1, 'roche2')      # récif
    bloc(d, x - 1, sol - 6, x + 7, sol - 3, 'roche')
    bloc(d, x, sol - 5 - h, x + 6, sol - 5, 'phare')       # tour
    for i in range(sol - 4 - h, sol - 7, 5):
        bloc(d, x, i, x + 6, i + 1, 'phare2')              # bandes rouges
    bloc(d, x - 1, sol - 8 - h, x + 7, sol - 6 - h, 'phare2')
    bloc(d, x + 2, sol - 7 - h, x + 4, sol - 7 - h, 'vitre_on')


def barque(d, x, sol, couleur='bois'):
    """Coque franche et voile triangulaire : lisible à cette taille."""
    bloc(d, x, sol - 4, x + 15, sol - 1, couleur)          # coque
    bloc(d, x + 1, sol - 5, x + 14, sol - 5, 'phare')      # liston clair
    bloc(d, x + 7, sol - 14, x + 7, sol - 5, 'poteau')     # mât
    for i in range(8):                                      # voile en escalier
        bloc(d, x + 8, sol - 13 + i, x + 8 + i, sol - 13 + i, 'phare')


def voilier(d, x, sol):
    """Petite silhouette pour l'horizon."""
    bloc(d, x, sol - 2, x + 8, sol - 1, 'roche2')
    bloc(d, x + 4, sol - 8, x + 4, sol - 3, 'roche2')
    for i in range(5):
        bloc(d, x + 5, sol - 7 + i, x + 5 + i, sol - 7 + i, 'phare')


def vagues(d, y, largeur, teinte):
    for x in range(0, largeur, 8):
        bloc(d, x, y, x + 3, y, teinte)


def lune(d, x, y, r=5):
    bloc(d, x - r, y - r + 2, x + r, y + r - 2, 'lune')
    bloc(d, x - r + 2, y - r, x + r - 2, y + r, 'lune')


# ---------------------------------------------------------------- décors

def ville():
    im, d = toile(LOIN); sol = LOIN[1]
    for x, w, h, mur, on in [(0, 22, 26, 'mur2', (1, 6)), (24, 16, 18, 'mur', ()),
                             (42, 28, 33, 'mur', (0, 4, 9)), (72, 18, 22, 'mur2', (2,)),
                             (92, 24, 28, 'mur', (3, 7)), (118, 14, 16, 'mur2', ()),
                             (134, 26, 31, 'mur', (1, 5, 10)), (162, 18, 20, 'mur2', (0,)),
                             (182, 18, 25, 'mur', (2, 6))]:
        immeuble(d, x, sol, w, h, mur, 'vitre', on)
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    arbre(d, 6, sol, 26); voiture(d, 32, sol, 'ambre'); arbre(d, 70, sol, 21)
    lampadaire(d, 96, sol, 24); arbre(d, 114, sol, 28); voiture(d, 148, sol, 'terre')
    arbre(d, 190, sol, 23); lampadaire(d, 218, sol, 20); arbre(d, 236, sol, 25)
    return loin, im


def collines():
    im, d = toile(LOIN); sol = LOIN[1]
    colline(d, 30, sol, 48, 22, 'colline2')
    colline(d, 108, sol, 60, 30, 'colline')
    colline(d, 178, sol, 44, 20, 'colline2')
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    sapin(d, 8, sol, 24); sapin(d, 26, sol, 19); cloture(d, 48, 104, sol)
    sapin(d, 116, sol, 26); buisson(d, 138, sol); sapin(d, 158, sol, 21)
    cloture(d, 178, 226, sol); sapin(d, 238, sol, 23)
    return loin, im


def montagnes():
    im, d = toile(LOIN); sol = LOIN[1]
    montagne(d, 34, sol, 34, 30); montagne(d, 100, sol, 44, 36)
    montagne(d, 168, sol, 32, 26)
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    for x, h in [(6, 26), (30, 21), (52, 28), (96, 23), (120, 27),
                 (166, 22), (190, 26), (232, 24)]:
        sapin(d, x, sol, h, 'sapin2' if x % 3 else 'sapin')
    buisson(d, 74, sol); buisson(d, 146, sol, 11); buisson(d, 212, sol)
    return loin, im


def mer():
    im, d = toile(LOIN); sol = LOIN[1]
    horizon = sol - 15
    bloc(d, 0, horizon, LOIN[0] - 1, sol - 1, 'mer')
    for y in range(horizon + 3, sol - 1, 4):
        vagues(d, y, LOIN[0], 'mer2')
    phare(d, 152, horizon + 4, 15)      # posé sur son récif
    voilier(d, 44, horizon + 6)
    voilier(d, 104, horizon + 4)
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    bloc(d, 0, sol - 5, PRES[0] - 1, sol - 1, 'sable')
    barque(d, 26, sol - 4); barque(d, 138, sol - 4, 'terre')
    for x in (86, 200, 248):
        bloc(d, x, sol - 8, x + 5, sol - 5, 'phare2')   # bouées
        bloc(d, x + 1, sol - 10, x + 3, sol - 9, 'poteau')
    return loin, im


def parc():
    im, d = toile(LOIN); sol = LOIN[1]
    colline(d, 54, sol, 62, 16, 'colline')
    colline(d, 154, sol, 56, 13, 'colline2')
    for x, h in [(18, 24), (86, 28), (122, 22), (186, 26)]:
        arbre(d, x, sol, h)
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    arbre(d, 8, sol, 27); banc(d, 34, sol); arbre(d, 62, sol, 23)
    lampadaire(d, 90, sol, 22); buisson(d, 106, sol, 11); arbre(d, 130, sol, 28)
    banc(d, 162, sol); arbre(d, 190, sol, 24); buisson(d, 216, sol)
    arbre(d, 236, sol, 26)
    return loin, im


def nuit():
    im, d = toile(LOIN); sol = LOIN[1]
    lune(d, 170, 9)
    for x, y in [(12, 5), (30, 13), (54, 4), (76, 10), (96, 3),
                 (118, 9), (140, 6), (8, 19), (62, 17), (192, 20)]:
        bloc(d, x, y, x, y, 'etoile')
    for x, w, h, on in [(0, 20, 22, (0, 3, 7)), (22, 26, 30, (1, 5, 9, 12)),
                        (50, 16, 18, (2,)), (68, 24, 26, (0, 4, 8)),
                        (94, 18, 20, (1, 5)), (114, 28, 32, (2, 6, 10)),
                        (144, 16, 17, (0,)), (162, 22, 27, (3, 7)),
                        (186, 14, 21, (1,))]:
        immeuble(d, x, sol, w, h, 'nuit_mur' if x % 2 else 'nuit_mur2', 'nuit_mur2', on)
    loin = im

    im, d = toile(PRES); sol = PRES[1]
    sapin(d, 10, sol, 24, 'sapin2'); sapin(d, 196, sol, 22, 'sapin2')
    lampadaire(d, 46, sol, 24); voiture(d, 70, sol, 'nuit_mur')
    lampadaire(d, 132, sol, 21); voiture(d, 154, sol, 'nuit_mur2')
    lampadaire(d, 228, sol, 23)
    return loin, im


DECORS = {
    'ville': ville, 'collines': collines, 'montagnes': montagnes,
    'mer': mer, 'parc': parc, 'nuit': nuit,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for nom, fabrique in DECORS.items():
        loin, pres = fabrique()
        for suffixe, im in (('loin', loin), ('pres', pres)):
            p = OUT / f'{nom}-{suffixe}.png'
            im.save(p, 'PNG', optimize=True)
            total += p.stat().st_size
        print(f'  {nom:10} loin {LOIN[0]}x{LOIN[1]}   pres {PRES[0]}x{PRES[1]}')
    print(f'\n  {len(DECORS) * 2} tuiles, {total} octets au total')


if __name__ == '__main__':
    main()
