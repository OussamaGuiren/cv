"""
Régénère toutes les images servies, dans le format le mieux adapté à chacune.

Le choix des formats n'est pas uniforme, parce que le meilleur format dépend du
contenu. Mesures faites sur ce site :

  Captures de projets (photo + texte)
      AVIF q60 pèse 33 % de moins que le WebP q82, sans différence visible à
      l'œil sur le texte. q50 gagnerait encore 25 % mais ramollit le petit texte,
      or ces captures sont des échantillons de travail.

  Logos clients (aplats, transparence)
      AVIF q70 gagne 8 à 37 % sur le WebP. Le WebP sans perte serait 3 à 4 fois
      plus lourd : à cette taille, la compression avec perte est invisible.

  Pixel art (tuiles de décor, personnage)
      Laissé en PNG. L'AVIF est deux à trois fois PLUS lourd — l'en-tête du
      conteneur dépasse le contenu sur des images de 300 octets. Le WebP sans
      perte gagnerait 2,6 Ko au total, ce qui ne justifie pas de compliquer les
      `url()` du CSS, qui n'ont pas de mécanisme de repli.

  Image de partage (og-cover)
      Laissée en JPEG. Les robots des réseaux sociaux et messageries gèrent mal
      l'AVIF et le WebP ; une vignette qui ne s'affiche pas coûte plus qu'elle
      ne pèse.

Chaîne servie : AVIF en premier, WebP en repli. Les deux couvrent ~99,5 % des
navigateurs, ce qui rend un troisième niveau JPEG/PNG inutile.

Prérequis : pip install pillow
Usage, depuis la racine du site :
    python tools/images.py
"""
from pathlib import Path

from PIL import Image, ImageChops

SOURCES = Path('../sources')          # hors du dossier servi
SORTIE = Path('assets/img')

PROJETS = {
    'ecran_accueil': 'proj-ilseco',
    'ecran_accueil_sohcook': 'proj-sohcook',
    'ecran_france3d': 'proj-dataviz',
    'vision7event': 'proj-7event',
}
TAILLE_PROJET = (720, 405)            # 16:9
BOITE_LOGO = (320, 160)               # boîte optique commune aux logos

Q_PROJET_AVIF = 60
Q_PROJET_WEBP = 82
Q_LOGO_AVIF = 70
Q_LOGO_WEBP = 90


def recadrer(im, ratio):
    """Recadre au ratio demandé, en gardant le haut de l'image."""
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        return im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    return im.crop((0, 0, w, int(w / ratio)))


def detourer(im):
    """Retire les marges uniformes, transparentes ou unies."""
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        alpha = im.split()[-1]
        if alpha.getextrema()[0] < 250:
            boite = alpha.getbbox()
            return im.crop(boite) if boite else im

    rgb = im.convert('RGB')
    fond = Image.new('RGB', rgb.size, rgb.getpixel((0, 0)))
    boite = ImageChops.difference(rgb, fond).getbbox()
    return im.crop(boite) if boite else im


def ecrire(im, chemin_sans_ext, q_avif, q_webp):
    avif = chemin_sans_ext.with_suffix('.avif')
    webp = chemin_sans_ext.with_suffix('.webp')
    im.save(avif, 'AVIF', quality=q_avif)
    im.save(webp, 'WEBP', quality=q_webp, method=6)
    return avif.stat().st_size, webp.stat().st_size


def projets():
    print('Captures de projets (AVIF q60 + WebP q82)')
    total = 0
    for source, nom in PROJETS.items():
        src = SOURCES / f'{source}.jpg'
        if not src.exists():
            print(f'  {nom:16} source absente : {src}')
            continue
        im = recadrer(Image.open(src).convert('RGB'), 16 / 9)
        im = im.resize(TAILLE_PROJET, Image.LANCZOS)
        a, w = ecrire(im, SORTIE / nom, Q_PROJET_AVIF, Q_PROJET_WEBP)
        total += a
        print(f'  {nom:16} avif {a/1024:5.1f} Ko   webp {w/1024:5.1f} Ko')
    print(f'  -> {total/1024:.1f} Ko servis si AVIF accepté\n')


def logos():
    print('Logos clients (AVIF q70 + WebP q90)')
    dossier = SOURCES / 'logos'
    if not dossier.exists():
        print(f'  dossier absent : {dossier}\n')
        return
    total = 0
    for src in sorted(dossier.glob('*.png')):
        logo = detourer(Image.open(src).convert('RGBA'))
        logo.thumbnail(BOITE_LOGO, Image.LANCZOS)
        cadre = Image.new('RGBA', BOITE_LOGO, (0, 0, 0, 0))
        cadre.paste(logo, ((BOITE_LOGO[0] - logo.width) // 2,
                           (BOITE_LOGO[1] - logo.height) // 2), logo)
        a, w = ecrire(cadre, SORTIE / 'logo' / src.stem, Q_LOGO_AVIF, Q_LOGO_WEBP)
        total += a
        print(f'  {src.stem:16} avif {a/1024:5.1f} Ko   webp {w/1024:5.1f} Ko')
    print(f'  -> {total/1024:.1f} Ko servis si AVIF accepté\n')


def main():
    if not Path('index.html').exists():
        raise SystemExit('À lancer depuis la racine du site.')
    (SORTIE / 'logo').mkdir(parents=True, exist_ok=True)
    projets()
    logos()
    print('Laissés tels quels : pixel art en PNG, og-cover en JPEG, favicon et')
    print('École des Douanes en SVG. Voir l\'en-tête du script pour le pourquoi.')


if __name__ == '__main__':
    main()
