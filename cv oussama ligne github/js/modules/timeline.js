export function initTimeline() {
  const timelineData = [
    {
      year: 2020,
      company: "Début de carrière",
      description: "Mes premières expériences dans le développement, découverte des technologies web et des bases du développement logiciel.",
      icon: "fa-code",
      era: "era-early-web"
    },
    {
      year: 2021,
      company: "Développeur .NET",
      description: "Spécialisation dans le développement .NET, création d'applications backend robustes et scalables.",
      icon: "fa-server",
      era: "era-dot-com"
    },
    {
      year: 2022,
      company: "Développeur Fullstack",
      description: "Évolution vers le développement fullstack, maîtrise du frontend avec Vue.js et approfondissement des compétences backend.",
      icon: "fa-laptop-code",
      era: "era-social-media"
    },
    {
      year: 2023,
      company: "Développeur .NET & Power Platform",
      description: "Expertise dans le développement .NET et la Power Platform, création de solutions d'automatisation et de modernisation pour les entreprises.",
      icon: "fa-rocket",
      era: "era-mobile"
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
      span.textContent = event.year;
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

    if (targetIndex === currentIndex) return;
    if (isAnimating) return;

    isAnimating = true;

    content.classList.remove("fade-in");
    content.classList.add("fade-transition");

    eventIcon.classList.add("fade-out");
    eventYear.classList.add("fade-out");
    eventCompany.classList.add("fade-out");
    eventDescription.classList.add("fade-out");

    function onFadeOutEnd(e) {
      if (e.target !== content) return;
      
      content.removeEventListener("animationend", onFadeOutEnd);

      const event = timelineData[targetIndex];

      eventIcon.innerHTML = `<i class="fa-solid ${event.icon}"></i>`;
      eventYear.textContent = event.year;
      eventCompany.textContent = event.company;
      eventDescription.textContent = event.description;

      timelineContainer.className = `timeline-container ${event.era}`;

      content.classList.remove("fade-transition");
      eventIcon.classList.remove("fade-out");
      eventYear.classList.remove("fade-out");
      eventCompany.classList.remove("fade-out");
      eventDescription.classList.remove("fade-out");

      content.classList.add("fade-in");

      currentIndex = targetIndex;
      isAnimating = false;
    }

    content.addEventListener("animationend", onFadeOutEnd);
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
    }, 4000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  createTicks();
  createYearLabels();
  updateTimeline(0);

  setTimeout(startAutoPlay, 2000);

  slider.addEventListener("mousedown", stopAutoPlay);
  slider.addEventListener("touchstart", stopAutoPlay);

  let userInteractionTimeout;
  slider.addEventListener("mouseup", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 5000);
  });

  slider.addEventListener("touchend", () => {
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(startAutoPlay, 5000);
  });
}
