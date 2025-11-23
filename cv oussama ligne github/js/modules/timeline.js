export function initTimeline() {
  const timelineData = [
    {
      year: 2018,
      duree: "Novembre 2018 - Février 2019",
      company: "DEVELOPPEUR WEB STAGIAIRE",
      description: "Mes premières expériences dans le développement, découverte des technologies web et des bases du développement logiciel.",
      techs: "PHP, HTML5, CSS3, CodeIgniter, VS Code, PhpMyAdmin",
      icon: "fa-code",
      era: "era-early-web"
    },
    {
      year: 2019,
      duree: "Août 2019 - Décembre 2019",
      company: "ANALYSTE PROGRAMMEUR .NET chez MyRsi à Meudon",
      description: "Spécialisation dans le développement .NET. Assurer la maintenance évolutive et corrective d’une application métier en corrigeant les anomalies et exceptions imprévues, en estimant les charges des nouvelles fonctionnalités, en concevant/optimisant les fonctionnalités existantes et en supervisant les livraisons en environnement de recette.",
      techs: "C#, ASP.NET, WPF (MVVM), LINQ, Angular, HTML/CSS, SQL Server, Git, Jenkins, XLDeploy, Visual Studio, VS Code",
      icon: "fa-server",
      era: "era-dot-com"
    },
    {
      year: "2021 (stage)",
      duree: "Avril 2021 - Juillet 2021",
      company: "CONCEPTEUR DEVELOPPEUR .NET STAGIAIRE chez Partner talent à Lille",
      description: "Intégration d'OAuth2 via Gmail pour sécuriser les connexions utilisateur dans l'ERP, accompagnée d'une TMA incluant la modification des champs \"From\" et \"Sender\" des emails, l'amélioration de la page de configuration des paramètres de messagerie et l'ajustement de la base de données et des procédures stockées pour la journalisation des emails.",
      techs: "C#, ASP.NET MVC, T-SQL, Visual Studio, SSMS, jQuery, AJAX",
      icon: "fa-laptop-code",
      era: "era-social-media"
    },
    {
      year: 2021,
      duree: "Septembre 2021 - Mars 2024",
      company: "DEVELOPPEUR .NET chez IBM à Lille",
      description: "Migration de scripts VBScript vers Devbooster 4 (.NET Framework), création de pages intranet dynamiques avec formulaires complexes, conception de batches automatisés pour le traitement de fichiers CSV, optimisation des opérations CRUD en SQL (T-SQL et parfois EF Core) et maintenance applicative incluant correction de bugs et évolution des fonctionnalités.",
      techs: "C#, LINQ, XAML, T-SQL, Visual Studio, EF Core, Devbooster 4",
      icon: "fa-laptop-code",
      era: "era-social-media"
    }
  ];

  const slider = document.getElementById("timelineSlider");
  const eventIcon = document.getElementById("eventIcon");
  const eventYear = document.getElementById("eventYear");
  const eventCompany = document.getElementById("eventCompany");
  const eventDescription = document.getElementById("eventDescription");
  const progressFill = document.getElementById("progressFill");
  const timelineContainer = document.getElementById("timelineContainer");
  const content = document.getElementById("timelineContent");
  const sliderTrack = document.getElementById("sliderTrack");
  const yearLabelsContainer = document.getElementById("yearLabels");

  if (!slider || !eventIcon || !eventYear || !eventCompany || !eventDescription) {
    return;
  }

  slider.max = timelineData.length - 1;

  let currentIndex = 0;
  let targetIndex = 0;
  let isAnimating = false;
  let autoPlayInterval;
  let ticks = [];
  let yearLabels = [];

  function createTicks() {
    timelineData.forEach((event, index) => {
      const tick = document.createElement("div");
      tick.classList.add("tick");
      const percent = (index / (timelineData.length - 1)) * 100;
      tick.style.left = `calc(${percent}%)`;
      sliderTrack.appendChild(tick);
      ticks.push(tick);
    });
  }

  function createYearLabels() {
    yearLabelsContainer.style.position = "relative";

    timelineData.forEach((event, index) => {
      const span = document.createElement("span");
      span.classList.add("year-label");
      // Affiche seulement l'année, pas le (stage) pour les labels du bas pour rester propre
      // ou affiche tout, selon la préférence. Ici on affiche tout mais on peut filtrer.
      span.textContent = String(event.year).replace(' (stage)', ''); 
      const percent = (index / (timelineData.length - 1)) * 100;
      span.style.position = "absolute";
      span.style.left = `${percent}%`;
      span.style.transform = "translateX(-50%)";

      yearLabelsContainer.appendChild(span);
      yearLabels.push(span);
    });
  }

  function updateTimeline(index) {
    const progress = (index / (timelineData.length - 1)) * 100;
    progressFill.style.width = `${progress}%`;

    ticks.forEach((tick, i) => {
      tick.classList.toggle("active", i === index);
    });

    yearLabels.forEach((label, i) => {
      label.classList.toggle("active", i === index);
    });

    targetIndex = index;

    // Sécurité anti-spam clic
    if (isAnimating) return;
    isAnimating = true;

    // 1. Masquer le contenu
    content.style.opacity = "0";
    content.style.transform = "translateY(10px) scale(0.95)";

    // 2. Attendre que la transition CSS de masquage se termine (500ms)
    setTimeout(() => {
      try {
        const event = timelineData[targetIndex];

        if (event) {
          // Mise à jour des icônes et textes
          eventIcon.innerHTML = `<i class="fa-solid ${event.icon}"></i>`;
          
          eventYear.innerHTML = `
            <span style="display:block; line-height:1;">${event.year}</span>
            <span class="event-duration" style="display:block; font-size:0.4em; opacity:0.7; margin-top:8px; font-weight:400; letter-spacing:1px; text-transform:uppercase;">
              ${event.duree}
            </span>
          `;
          
          eventCompany.textContent = event.company;
          
          eventDescription.innerHTML = `
            <p style="margin-bottom:15px;">${event.description}</p>
            <div class="event-techs" style="font-size:0.9em; color:rgba(255,255,255,0.9); border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
              <strong style="color:var(--accent-2); text-transform:uppercase; font-size:0.8em; letter-spacing:1px;">Stack technique :</strong><br>
              ${event.techs}
            </div>
          `;

          // Mise à jour du thème (era)
          // On retire toutes les classes era possibles pour être sûr
          timelineContainer.classList.remove("era-early-web", "era-dot-com", "era-social-media", "era-mobile");
          timelineContainer.classList.add(event.era);
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la timeline :", error);
      } finally {
        // 3. Réafficher le contenu quoi qu'il arrive
        // Petit délai pour s'assurer que le DOM est prêt
        requestAnimationFrame(() => {
          content.style.opacity = "1";
          content.style.transform = "translateY(0) scale(1)";
          
          // On libère le verrou d'animation après la fin de la transition d'apparition
          setTimeout(() => {
            isAnimating = false;
            currentIndex = targetIndex;
          }, 500);
        });
      }
    }, 500); 
  }

  slider.addEventListener("input", function () {
    const index = parseInt(this.value);
    const progress = (index / (timelineData.length - 1)) * 100;
    progressFill.style.width = `${progress}%`;
    updateTimeline(index);
  });

  function startAutoPlay() {
    autoPlayInterval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= timelineData.length) {
        nextIndex = 0;
      }
      slider.value = nextIndex;
      updateTimeline(nextIndex);
    }, 6000); // Augmenté à 6s pour laisser le temps de lire
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  createTicks();
  createYearLabels();
  // Initial call
  const initialEvent = timelineData[0];
  eventIcon.innerHTML = `<i class="fa-solid ${initialEvent.icon}"></i>`;
  eventYear.innerHTML = `
    <span style="display:block; line-height:1;">${initialEvent.year}</span>
    <span class="event-duration" style="display:block; font-size:0.4em; opacity:0.7; margin-top:8px; font-weight:400; letter-spacing:1px; text-transform:uppercase;">
      ${initialEvent.duree}
    </span>
  `;
  eventCompany.textContent = initialEvent.company;
  eventDescription.innerHTML = `
    <p style="margin-bottom:15px;">${initialEvent.description}</p>
    <div class="event-techs" style="font-size:0.9em; color:rgba(255,255,255,0.9); border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
      <strong style="color:var(--accent-2); text-transform:uppercase; font-size:0.8em; letter-spacing:1px;">Stack technique :</strong><br>
      ${initialEvent.techs}
    </div>
  `;

  setTimeout(startAutoPlay, 3000);

  slider.addEventListener("mousedown", stopAutoPlay);
  slider.addEventListener("touchstart", stopAutoPlay);

  let userInteractionTimeout;
  slider.addEventListener("mouseup", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 8000);
  });

  slider.addEventListener("touchend", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 8000);
  });
}
