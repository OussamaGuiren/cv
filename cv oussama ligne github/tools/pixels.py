"""
Dessine la nuée de pixels de la couverture (coin haut droit du hero).

Une grille de carrés qui se dissout : dense dans le coin, de plus en plus
clairsemée en s'en éloignant. Deux tons de blanc translucide, posés sur le
bleu de la couverture par le CSS (.hero-cover::before). Le motif prolonge le
langage pixel du personnage et de ses décors, sans rien dessiner de figuratif.

Le tirage est déterministe (générateur congruentiel à graine fixe) : relancer
le script redonne exactement le même fichier, donc aucun bruit dans git.

Usage, depuis la racine du site :
    python tools/pixels.py
Produit assets/img/pixels.svg
"""
from pathlib import Path

SORTIE = Path('assets/img/pixels.svg')

LARGEUR, HAUTEUR = 600, 400     # boîte du motif, ratio 3:2
CELLULE = 20                    # taille d'un pixel
GRAINE = 20240909


def tirage(graine):
    """Pseudo-aléatoire minimal, reproductible : suffisant pour un motif."""
    etat = graine
    while True:
        etat = (etat * 1103515245 + 12345) % (2 ** 31)
        yield etat / (2 ** 31)


def main():
    if not Path('index.html').exists():
        raise SystemExit('À lancer depuis la racine du site.')
    alea = tirage(GRAINE)
    carres = []
    for j in range(HAUTEUR // CELLULE):
        for i in range(LARGEUR // CELLULE):
            cx = i * CELLULE + CELLULE / 2
            cy = j * CELLULE + CELLULE / 2
            # Distance au coin haut droit, ramenée entre 0 (le coin) et 1.
            u = (LARGEUR - cx) / LARGEUR
            v = cy / HAUTEUR
            d = min(1.0, (u * u + v * v) ** 0.5 / 2 ** 0.5)
            # Probabilité de remplir : presque pleine au coin, nulle au loin.
            p = (1 - d) ** 2.2 * 0.96
            if next(alea) < p:
                opacite = 0.16 if next(alea) < 0.6 else 0.09
                carres.append(f'<rect x="{i * CELLULE}" y="{j * CELLULE}" width="{CELLULE}" '
                              f'height="{CELLULE}" fill="#FFFFFF" fill-opacity="{opacite}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LARGEUR} {HAUTEUR}" '
           f'shape-rendering="crispEdges">\n' + '\n'.join(carres) + '\n</svg>\n')
    SORTIE.write_text(svg, encoding='utf-8')
    print(f'{SORTIE} — {len(carres)} pixels, {SORTIE.stat().st_size / 1024:.1f} Ko')


if __name__ == '__main__':
    main()
