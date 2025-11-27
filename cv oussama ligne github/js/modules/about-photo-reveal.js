/**
 * Animation de révélation progressive de la photo dans la section "Qui suis-je"
 * Effet de "couvercle qui se soulève" au scroll
 */

export function initAboutPhotoReveal() {
  // Vérifier que GSAP et ScrollTrigger sont disponibles
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP ou ScrollTrigger non disponible');
    return;
  }

  // Enregistrer le plugin ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const photoContainer = document.querySelector('.about-image-container');
  const photo = document.querySelector('.about-photo-full');
  
  if (!photoContainer || !photo) {
    return;
  }

  // Animation de révélation progressive
  // La photo monte progressivement au scroll comme si un couvercle se soulevait
  // Utilise à la fois le déplacement vertical et le clip-path pour un effet naturel
  gsap.fromTo(photo, 
    {
      y: '80%', // Commence décalée vers le bas (80% de sa hauteur)
      clipPath: 'inset(100% 0 0 0)', // Commence complètement masquée par le bas
    },
    {
      scrollTrigger: {
        trigger: '.about-photo-section', // Utilise la section complète comme trigger
        start: 'top 85%', // Démarre quand la section arrive à 85% de la hauteur de fenêtre
        end: 'top 25%', // Se termine quand la section arrive à 25% de la hauteur de fenêtre
        scrub: 1.2, // Animation liée au scroll (1.2 = fluide et doux, comme un couvercle qui se soulève)
        markers: false, // Mettre à true pour debug
        invalidateOnRefresh: true, // Recalcule les positions si la page change
      },
      y: '0%', // Finit à sa position normale
      clipPath: 'inset(0% 0 0 0)', // Finit complètement visible
      ease: 'power1.out', // Courbe d'animation douce et naturelle
    }
  );

  // Rafraîchir ScrollTrigger après le chargement des images
  if (photo.complete) {
    ScrollTrigger.refresh();
  } else {
    photo.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }
}
