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
        description: "Spécialisation dans le développement .NET. Assurer la maintenance évolutive et corrective d'une application métier en corrigeant les anomalies et exceptions imprévues, en estimant les charges des nouvelles fonctionnalités, en concevant/optimisant les fonctionnalités existantes et en supervisant les livraisons en environnement de recette.",
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

    const timelineList = document.getElementById("timelineList");
    const popup = document.getElementById("experiencePopup");
    const popupTitle = document.getElementById("experiencePopupTitle");
    const popupSubtitle = document.getElementById("experiencePopupSubtitle");
    const popupDescription = document.getElementById("experiencePopupDescription");
    const popupTechs = document.getElementById("experiencePopupTechs");
    const closePopupBtn = document.getElementById("closeExperiencePopup");
    const popupOverlay = popup?.querySelector(".experience-popup-overlay");

    if (!timelineList) {
      return;
    }

    // Générer les items de timeline
    timelineData.forEach((event, index) => {
      const li = document.createElement("li");
      li.className = "timeline-item";
      li.setAttribute("data-index", index);

      li.innerHTML = `
        <div class="timeline-item-icon">
          <i class="fa-solid ${event.icon}"></i>
        </div>
        <div class="timeline-item-content">
          <div class="timeline-item-year">
            ${event.year}
            <span class="timeline-item-duration">${event.duree}</span>
          </div>
          <div class="timeline-item-company">${event.company}</div>
          <button type="button" class="timeline-item-btn" data-index="${index}">
            En savoir plus
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;

      timelineList.appendChild(li);
    });

    // Fonction pour ouvrir la popup
    function openPopup(index) {
      const event = timelineData[index];
      if (!event || !popup) return;

      popupTitle.textContent = event.company;
      popupSubtitle.textContent = `${event.year} • ${event.duree}`;
      popupDescription.textContent = event.description;
      popupTechs.innerHTML = `
        <strong>Stack technique :</strong>
        <span>${event.techs}</span>
      `;

      popup.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    // Fonction pour fermer la popup
    function closePopup() {
      if (!popup) return;
      popup.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Event listeners pour les boutons "En savoir plus"
    timelineList.addEventListener("click", (e) => {
      const btn = e.target.closest(".timeline-item-btn");
      if (btn) {
        const index = parseInt(btn.getAttribute("data-index"));
        openPopup(index);
      }
    });

    // Event listeners pour fermer la popup
    if (closePopupBtn) {
      closePopupBtn.addEventListener("click", closePopup);
    }

    if (popupOverlay) {
      popupOverlay.addEventListener("click", closePopup);
    }

    // Fermer avec Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup?.getAttribute("aria-hidden") === "false") {
        closePopup();
      }
    });
  }
