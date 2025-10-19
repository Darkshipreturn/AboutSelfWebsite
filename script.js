document.addEventListener('DOMContentLoaded', function () {

  const themeControlsPanel = document.getElementById('theme-controls-panel');
  const themeToggleButton = document.getElementById('theme-toggle-btn');
  const colorOptions = document.querySelector('.color-picker');

  // --- THEME INITIALIZATION ON PAGE LOAD ---
  function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'blue';
    
    // Update the active state of the color picker button
    const activeColorOption = document.querySelector(`.color-option[data-theme="${savedTheme}"]`);
    if (activeColorOption) {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
      activeColorOption.classList.add('active');
    }
    
    // Initialize particles.js with the correct theme color
    initializeParticles(getThemeColor());
  }

  function getThemeColor() {
    // Temporarily apply the class to a dummy element to read its CSS variables
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.className = document.body.className;
    document.body.appendChild(tempDiv);
    const color = getComputedStyle(tempDiv).getPropertyValue('--primary-color').trim();
    document.body.removeChild(tempDiv);
    return color || '#3b82f6';
  }

  // --- PARTICLES.JS INITIALIZATION ---
  function initializeParticles(color) {
    if (typeof particlesJS !== 'undefined') {
      particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: color },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: color, opacity: 0.4, width: 1 },
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
  }

  // --- THEME CONTROLS ---
  function toggleThemeControls() {
    const isActive = themeControlsPanel.classList.toggle('active');
    themeToggleButton.setAttribute('aria-expanded', isActive);
  }

  function changeTheme(theme, element) {
    // Apply the new theme class to the body
    document.body.className = `theme-${theme}`;

    // Save the user's choice to localStorage
    localStorage.setItem('theme', theme);

    // Update the active state in the color picker
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.remove('active');
    });
    element.classList.add('active');

    // Update particles color to match the new theme
    const primaryColor = getThemeColor();
    if (typeof particlesJS !== 'undefined' && window.pJSDom && window.pJSDom[0]) {
        window.pJSDom[0].pJS.particles.color.value = primaryColor;
        window.pJSDom[0].pJS.particles.line_linked.color = primaryColor;
        window.pJSDom[0].pJS.fn.particlesRefresh();
    }
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

  // --- RUN INITIALIZATION CODE ---
  applyInitialTheme();
});
