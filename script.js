document.addEventListener('DOMContentLoaded', function () {

  // --- ENHANCED INTRO ANIMATION ---
  const introOverlay = document.querySelector('.intro-overlay');
  if (introOverlay) {
    window.addEventListener('load', function() {
      setTimeout(() => {
        introOverlay.style.opacity = '0';
        setTimeout(() => {
          introOverlay.style.display = 'none';
          document.body.style.overflow = 'auto';
        }, 1000);
      }, 2500); // Shortened for better UX
    });
  }

  // --- PARTICLES.JS INITIALIZATION ---
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#3b82f6" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#3b82f6", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 3, direction: "none", random: false, straight: false, out_mode: "out" }
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
      },
      retina_detect: true
    });
  }

  // --- THEME CONTROLS ---
  const themeControlsPanel = document.getElementById('theme-controls-panel');
  const themeToggleButton = document.getElementById('theme-toggle-btn');
  const colorOptions = document.querySelector('.color-picker');

  function toggleThemeControls() {
    const isActive = themeControlsPanel.classList.toggle('active');
    themeToggleButton.setAttribute('aria-expanded', isActive);
  }

  function changeTheme(theme, element) {
    document.body.className = `theme-${theme}`;

    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.remove('active');
    });
    element.classList.add('active');

    // Update particles color to match the new theme
    const rootStyle = getComputedStyle(document.body);
    const primaryColor = rootStyle.getPropertyValue('--primary-color').trim();
    
    if (typeof particlesJS !== 'undefined') {
        window.pJSDom[0].pJS.particles.color.value = primaryColor;
        window.pJSDom[0].pJS.particles.line_linked.color = primaryColor;
        window.pJSDom[0].pJS.fn.particlesRefresh();
    }

    // Close theme panel after selection
    setTimeout(() => {
      if (themeControlsPanel.classList.contains('active')) {
        toggleThemeControls();
      }
    }, 300);
  }

  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleThemeControls);
  }

  if (colorOptions) {
    colorOptions.addEventListener('click', (e) => {
      const target = e.target.closest('.color-option');
      if (target) {
        const theme = target.dataset.theme;
        changeTheme(theme, target);
      }
    });
  }
  
  // --- SMOOTH SCROLLING FOR ANCHOR LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80; // Adjusted for fixed nav
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // --- EVENT DELEGATION FOR CARD HOVER EFFECT ---
  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.card-hover');
      if (card) {
        card.style.transform = 'perspective(1000px) rotateX(5deg) translateY(-5px)';
        card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2)';
      }
    });

    mainElement.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.card-hover');
      if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) translateY(0)';
        card.style.boxShadow = '';
      }
    });
  }
});
