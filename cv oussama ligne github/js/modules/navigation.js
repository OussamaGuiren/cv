// =========== NAVIGATION (Tabs & Mobile Menu) ===========

export function initNavigation() {
  initStickyTabs();
  initMobileMenu();
  initHeroButtons();
}

function initStickyTabs() {
  const tabContainer = document.querySelector('.et-hero-tabs-container');
  if (!tabContainer) return;

  const tabs = Array.from(tabContainer.querySelectorAll('.et-hero-tab'));
  const slider = tabContainer.querySelector('.et-hero-tab-slider');
  const hero = document.querySelector('.et-hero-tabs');
  const tabContainerHeight = tabContainer.offsetHeight || 72;
  
  // Gestionnaire pour le logo OG
  const heroLogo = document.querySelector('.et-hero-logo');
  if (heroLogo) {
    heroLogo.style.cursor = 'pointer';
    heroLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function onTabClick(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + window.scrollY;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    const offset = isSticky ? tabContainerHeight + 12 : tabContainerHeight + 12;
    const top = Math.max(0, absoluteTop - offset);
    
    if (window.locomotiveScroller) {
      window.locomotiveScroller.scrollTo(target, {
        offset: -offset,
        duration: 1200,
        easing: [0.25, 0.0, 0.35, 1.0]
      });
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  tabs.forEach(tab => tab.addEventListener('click', onTabClick));

  function setSliderCss(tab) {
    if (!slider) return;
    if (!tab) {
      slider.style.width = '0';
      return;
    }
    const rect = tab.getBoundingClientRect();
    const containerRect = tabContainer.getBoundingClientRect();
    const width = rect.width;
    const left = rect.left - containerRect.left;
    slider.style.width = width + 'px';
    slider.style.left = left + 'px';
  }

  let currentId = null;
  let currentTab = null;

  function findCurrentTab() {
    const scrollY = window.scrollY;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    const offset = isSticky ? tabContainerHeight + 12 : tabContainerHeight + 12;
    let newCurrentId = null;
    let newCurrentTab = null;

    tabs.forEach(tab => {
      const href = tab.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const section = document.querySelector(href);
      if (!section) return;
      
      const sectionRect = section.getBoundingClientRect();
      const absoluteTop = sectionRect.top + scrollY;
      const top = absoluteTop - offset;
      const bottom = top + section.offsetHeight;
      
      if (scrollY >= top && scrollY < bottom) {
        newCurrentId = href;
        newCurrentTab = tab;
      }
    });

    if (!newCurrentId) {
      const quisuisjeContainer = document.querySelector('#tab-quisuisje');
      if (quisuisjeContainer) {
        const containerRect = quisuisjeContainer.getBoundingClientRect();
        const containerAbsoluteTop = containerRect.top + scrollY;
        const containerTop = containerAbsoluteTop - offset;
        const containerBottom = containerTop + quisuisjeContainer.offsetHeight;
        
        if (scrollY >= containerTop && scrollY < containerBottom) {
          const quisuisjeTab = tabs.find(tab => tab.getAttribute('href') === '#tab-quisuisje');
          if (quisuisjeTab) {
            newCurrentId = '#tab-quisuisje';
            newCurrentTab = quisuisjeTab;
          }
        }
      }
    }

    if (newCurrentId !== currentId) {
      currentId = newCurrentId;
      currentTab = newCurrentTab;
      setSliderCss(currentTab);
    }
  }

  function checkTabContainerPosition() {
    if (!hero) return;
    const heroOffsetBottom = hero.offsetTop + hero.offsetHeight - tabContainerHeight;
    if (window.scrollY > heroOffsetBottom) {
      tabContainer.classList.add('et-hero-tabs-container--top');
    } else {
      tabContainer.classList.remove('et-hero-tabs-container--top');
    }
  }

  function onScroll() {
    checkTabContainerPosition();
    findCurrentTab();
  }

  function onResize() {
    setSliderCss(currentTab);
    checkTabContainerPosition();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', () => {
    checkTabContainerPosition();
    findCurrentTab();
  });

  checkTabContainerPosition();
  findCurrentTab();
}

function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  const body = document.body;

  if (!menuToggle || !mobileMenu || !mobileMenuOverlay) return;

  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenuOverlay.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  }

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenuOverlay.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }

  function scrollToSection(href) {
    const target = document.querySelector(href);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + window.scrollY;
    const mobileNavbar = document.querySelector('.mobile-navbar');
    const navbarHeight = mobileNavbar ? mobileNavbar.offsetHeight : 60;
    const offset = navbarHeight;
    const top = Math.max(0, absoluteTop - offset);

    if (window.locomotiveScroller) {
      window.locomotiveScroller.scrollTo(target, {
        offset: -offset,
        duration: 1200,
        easing: [0.25, 0.0, 0.35, 1.0]
      });
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    closeMenu();
  }

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) closeMenu(); else openMenu();
  });

  mobileMenuClose?.addEventListener('click', closeMenu);
  mobileMenuOverlay.addEventListener('click', closeMenu);

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        scrollToSection(href);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 767) closeMenu();
  });
}

function initHeroButtons() {
  const heroContactBtn = document.getElementById('heroContactBtn');
  const heroAboutBtn = document.getElementById('heroAboutBtn');
  const btnMeContacter = document.querySelector('.btnMeContacter');

  function scrollToTab(id) {
    const tab = document.querySelector(`.et-hero-tab[href="${id}"]`);
    if (tab) {
      tab.click();
      return;
    }
    const section = document.querySelector(id);
    if (!section) return;

    const tabContainer = document.querySelector('.et-hero-tabs-container');
    if (!tabContainer) return;
    const tabH = tabContainer.offsetHeight || 72;
    const isSticky = tabContainer.classList.contains('et-hero-tabs-container--top');
    const sectionRect = section.getBoundingClientRect();
    const absoluteTop = sectionRect.top + window.scrollY;
    const offset = isSticky ? tabH + 12 : tabH + 12;
    const top = absoluteTop - offset;
    
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  heroContactBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTab('#tab-contact');
  });

  heroAboutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTab('#tab-quisuisje');
  });

  if (btnMeContacter) {
    btnMeContacter.addEventListener('click', (e) => {
      e.preventDefault();
      const contactSection = document.querySelector('#tab-contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
