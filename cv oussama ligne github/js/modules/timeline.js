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

    const timeline = document.getElementById("timeline");
    const popup = document.getElementById("experiencePopup");
    const popupTitle = document.getElementById("experiencePopupTitle");
    const popupSubtitle = document.getElementById("experiencePopupSubtitle");
    const popupDescription = document.getElementById("experiencePopupDescription");
    const popupTechs = document.getElementById("experiencePopupTechs");
    const closePopupBtn = document.getElementById("closeExperiencePopup");
    const popupOverlay = popup?.querySelector(".experience-popup-overlay");

    if (!timeline) {
      return;
    }

    // Grouper les expériences par année
    const groupedByYear = {};
    timelineData.forEach((event, index) => {
      const year = typeof event.year === 'string' ? event.year.split(' ')[0] : event.year;
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push({ ...event, originalIndex: index });
    });

    // Trier les années par ordre décroissant
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));

    // Générer la timeline
    sortedYears.forEach((year, yearIndex) => {
      const events = groupedByYear[year];

      // Badge d'année
      const yearBadge = document.createElement("div");
      yearBadge.className = "row timeline-movement timeline-movement-top";
      yearBadge.innerHTML = `
        <div class="timeline-badge timeline-future-movement">
          <p>${year}</p>
        </div>
      `;
      timeline.appendChild(yearBadge);

      // Générer les événements de cette année
      events.forEach((event, eventIndex) => {
        const isLeft = (yearIndex + eventIndex) % 2 === 0;
        const panelClass = isLeft ? "credits" : "debits";
        const animationClass = isLeft ? "fadeInLeft" : "fadeInRight";
        const colClass = isLeft ? "col-sm-6" : "offset-sm-6 col-sm-6";
        const colInnerClass = isLeft ? "col-sm-11" : "offset-sm-1 col-sm-11";

        const movement = document.createElement("div");
        movement.className = "row timeline-movement";
        movement.innerHTML = `
          <div class="timeline-badge ${isLeft ? 'center-left' : 'center-right'}"></div>
          <div class="${colClass} timeline-item">
            <div class="row">
              <div class="${colInnerClass}">
                <div class="timeline-panel ${panelClass} anim ${animationClass}" data-index="${event.originalIndex}">
                  <ul class="timeline-panel-ul">
                    <div class="lefting-wrap">
                      <li class="img-wraping">
                        <i class="fa-solid ${event.icon}"></i>
                      </li>
                    </div>
                    <div class="righting-wrap">
                      <li><a href="#" class="importo">${event.company}</a></li>
                      <li><span class="causale" style="color:#000; font-weight: 600;">${event.company.split(' ')[0]} ${event.company.split(' ')[1] || ''}</span></li>
                      <li><span class="causale">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</span></li>
                      <li>
                        <p class="timeline-date">
                          <i class="fa-solid fa-calendar"></i>
                          <small>${event.duree}</small>
                        </p>
                      </li>
                      <li>
                        <button type="button" class="timeline-btn-more" data-index="${event.originalIndex}">
                          En savoir plus
                          <i class="fa-solid fa-arrow-right"></i>
                        </button>
                      </li>
                    </div>
                    <div class="clear"></div>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `;
        timeline.appendChild(movement);
      });
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
    timeline.addEventListener("click", (e) => {
      const btn = e.target.closest(".timeline-btn-more");
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

    // Animation au scroll - Fonction pour initialiser l'observer
    function initScrollAnimations() {
      const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Ajouter la classe animated pour déclencher l'animation
            entry.target.classList.add('animated');
            // Ne plus observer cet élément une fois animé
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      // Observer tous les panels de timeline
      const panels = document.querySelectorAll('.timeline-panel.anim');
      if (panels.length === 0) {
        console.warn('Aucun panel de timeline trouvé pour les animations');
        return;
      }

      panels.forEach((panel, index) => {
        // Observer chaque panel
        observer.observe(panel);
        
        // Vérifier si le panel est déjà visible au chargement
        const rect = panel.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          // Petit délai pour un effet séquentiel
          setTimeout(() => {
            panel.classList.add('animated');
            observer.unobserve(panel);
          }, index * 100);
        }
      });
    }

    // Initialiser les animations après un court délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      initScrollAnimations();
      
      // Fallback : si après 1 seconde les animations ne se sont pas déclenchées, forcer l'animation des éléments visibles
      setTimeout(() => {
        const panels = document.querySelectorAll('.timeline-panel.anim:not(.animated)');
        panels.forEach((panel, index) => {
          const rect = panel.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight + 200 && rect.bottom > -200;
          if (isVisible) {
            setTimeout(() => {
              panel.classList.add('animated');
            }, index * 150);
          }
        });
      }, 1000);
    }, 300);

    // Réinitialiser si la section devient visible (pour les cas de navigation)
    const experienceSection = document.getElementById('tab-experience');
    if (experienceSection) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Réinitialiser les animations si la section devient visible
            setTimeout(initScrollAnimations, 100);
          }
        });
      }, { threshold: 0.1 });
      
      sectionObserver.observe(experienceSection);
    }

    // Écouter le scroll pour déclencher les animations manuellement si nécessaire
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const panels = document.querySelectorAll('.timeline-panel.anim:not(.animated)');
        panels.forEach(panel => {
          const rect = panel.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible) {
            panel.classList.add('animated');
          }
        });
      }, 100);
    }, { passive: true });

    // Hover effect sur les badges centraux
    document.querySelectorAll('.timeline-panel.credits').forEach(panel => {
      panel.addEventListener('mouseenter', () => {
        const badge = panel.closest('.timeline-movement')?.querySelector('.center-left');
        if (badge) badge.style.backgroundColor = '#0078D4';
      });
      panel.addEventListener('mouseleave', () => {
        const badge = panel.closest('.timeline-movement')?.querySelector('.center-left');
        if (badge) badge.style.backgroundColor = '#FFFFFF';
      });
    });

    document.querySelectorAll('.timeline-panel.debits').forEach(panel => {
      panel.addEventListener('mouseenter', () => {
        const badge = panel.closest('.timeline-movement')?.querySelector('.center-right');
        if (badge) badge.style.backgroundColor = '#0078D4';
      });
      panel.addEventListener('mouseleave', () => {
        const badge = panel.closest('.timeline-movement')?.querySelector('.center-right');
        if (badge) badge.style.backgroundColor = '#FFFFFF';
      });
    });
  }
