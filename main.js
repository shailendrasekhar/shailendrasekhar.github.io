// Typed.js initialization for hero section
var typed = new Typed('.typing', {
  strings: ["a Robotic Software Engineer", "an AI Researcher"],
  loop: true,
  typeSpeed: 85,
  backSpeed: 85
});

// Handle About Me navigation and Dark Mode
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing scripts...');
  
  const homeSection = document.getElementById('home');
  const aboutSection = document.getElementById('about');
  const homeLink = document.querySelector('a[href="#home"]');
  const aboutLink = document.querySelector('a[href="#about"]');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const header = document.getElementById('header');

  console.log('Dark mode toggle element:', darkModeToggle);

  // Show Home section by default
  if (homeSection && aboutSection) {
    homeSection.style.display = 'flex';
    aboutSection.style.display = 'none';
  }

  // Enhanced page transitions
  function transitionToSection(showSection, hideSection, isAbout = false) {
    // Add fade out effect
    hideSection.classList.add('fade-out');
    
    setTimeout(() => {
      hideSection.style.display = 'none';
      hideSection.classList.remove('fade-out');
      
      showSection.style.display = isAbout ? 'block' : 'flex';
      
      // Add fade in effect
      setTimeout(() => {
        showSection.classList.add('fade-in');
      }, 50);
    }, 300);
  }

  // Handle navigation clicks with smooth transitions
  if (homeLink) {
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Smooth transition to home
      transitionToSection(homeSection, aboutSection, false);
      
      // Remove about-active class from body
      document.body.classList.remove('about-active');
      
      // Update active nav
      document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
      homeLink.parentElement.classList.add('active');
    });
  }

  if (aboutLink) {
    aboutLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Smooth transition to about
      transitionToSection(aboutSection, homeSection, true);
      
      // Add about-active class to body
      document.body.classList.add('about-active');
      
      // Update active nav
      document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
      aboutLink.parentElement.classList.add('active');
    });
  }

  // Header scroll effect
  let lastScrollTop = 0;
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
  });

  // Add interactive tooltips to skill icons
  const skillIcons = document.querySelectorAll('.skills-icons figure');
  skillIcons.forEach(icon => {
    const img = icon.querySelector('img');
    const alt = img ? img.alt : '';
    
    if (alt) {
      icon.setAttribute('title', alt);
      
      // Add click effect
      icon.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 150);
      });
    }
  });

  // Intersection Observer for timeline animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);

  // Observe timeline items
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach(item => {
    observer.observe(item);
  });

  // Add loading animation
  function showLoadingScreen() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(loadingOverlay);
    
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
      loadingOverlay.classList.add('hide');
      setTimeout(() => {
        document.body.removeChild(loadingOverlay);
      }, 500);
    }, 1500);
  }

  // Show loading screen on first visit
  if (!sessionStorage.getItem('visited')) {
    showLoadingScreen();
    sessionStorage.setItem('visited', 'true');
  }

  // Dark Mode Functionality
  if (darkModeToggle) {
    console.log('Setting up dark mode functionality...');
    
    // Apply saved theme on load
    const savedTheme = localStorage.getItem("theme");
    console.log('Saved theme:', savedTheme);
    
    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
      darkModeToggle.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-theme");
      darkModeToggle.textContent = "🌙";
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener("click", function() {
      console.log('Dark mode toggle clicked');
      const isDark = document.body.classList.toggle("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      darkModeToggle.textContent = isDark ? "☀️" : "🌙";
      console.log('Theme changed to:', isDark ? 'dark' : 'light');
      
      // Add a little animation to the toggle
      this.style.transform = 'rotate(360deg) scale(1.2)';
      setTimeout(() => {
        this.style.transform = '';
      }, 300);
    });
  } else {
    console.error('Dark mode toggle button not found!');
  }

  // Add keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      homeLink.click();
    } else if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      aboutLink.click();
    }
  });
});
