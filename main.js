// Handle About Me navigation and Dark Mode
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing scripts...');

  // Typed.js initialization for hero section
  if (document.querySelector('.typing')) {
    var typed = new Typed('.typing', {
      strings: ["an AI Researcher", "a Robotic Enthusiast"],
      loop: true,
      typeSpeed: 85,
      backSpeed: 85
    });
  }

  const homeSection = document.getElementById('home');
  const aboutSection = document.getElementById('about');
  const projectsSection = document.getElementById('projects');
  const homeLink = document.querySelector('a[href="#home"]');
  const aboutLink = document.querySelector('a[href="#about"]');
  const blogSection = document.getElementById('blog');
  const blogLink = document.querySelector('a[href="#blog"]');
  const projectsLink = document.querySelector('a[href="#projects"]');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const header = document.getElementById('header');

  console.log('Dark mode toggle element:', darkModeToggle);

  // Show Home section by default
  if (homeSection) {
    homeSection.style.display = 'flex';
    if (aboutSection) aboutSection.style.display = 'none';
    if (blogSection) blogSection.style.display = 'none';
    if (projectsSection) projectsSection.style.display = 'none';
  }

  // Enhanced page transitions
  function transitionToSection(showSection, displayType = 'flex') {
    const allSections = [homeSection, aboutSection, projectsSection, blogSection];

    // Immediately hide other sections to prevent overlap
    allSections.forEach(section => {
      if (section && section !== showSection) {
        section.style.display = 'none';
        section.classList.remove('fade-in', 'fade-out');
      }
    });

    // Show target section
    if (showSection) {
      showSection.style.display = displayType;
      // Add fade in effect
      setTimeout(() => {
        showSection.classList.add('fade-in');
      }, 10);
    }
  }

  // Helper to update active nav item
  function updateActiveNav(activeLink) {
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    if (activeLink && activeLink.parentElement) {
      activeLink.parentElement.classList.add('active');
    }
  }

  // Handle navigation clicks with smooth transitions
  if (homeLink) {
    homeLink.addEventListener('click', function (e) {
      e.preventDefault();
      transitionToSection(homeSection, 'flex');
      document.body.classList.remove('about-active', 'projects-active', 'blog-active');
      updateActiveNav(homeLink);
    });
  }

  if (aboutLink) {
    aboutLink.addEventListener('click', function (e) {
      e.preventDefault();
      transitionToSection(aboutSection, 'block');
      document.body.classList.remove('projects-active', 'blog-active');
      document.body.classList.add('about-active');
      updateActiveNav(aboutLink);
    });
  }

  if (blogLink) {
    blogLink.addEventListener('click', function (e) {
      e.preventDefault();
      transitionToSection(blogSection, 'block');
      document.body.classList.remove('about-active', 'projects-active');
      document.body.classList.add('blog-active');
      updateActiveNav(blogLink);
    });
  }

  if (projectsLink && projectsSection) {
    projectsLink.addEventListener('click', function (e) {
      e.preventDefault();
      transitionToSection(projectsSection, 'block');
      document.body.classList.remove('about-active', 'blog-active');
      document.body.classList.add('projects-active');
      updateActiveNav(projectsLink);
    });
  }

  // Header shows on mouse movement near top of screen
  let headerTimeout;
  window.addEventListener('mousemove', function (e) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add scrolled class for background
    if (scrollTop > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Show header when mouse is near top of screen
    if (e.clientY < 100) {
      header.classList.add('show');

      // Auto-hide after 3 seconds of no mouse movement
      clearTimeout(headerTimeout);
      headerTimeout = setTimeout(() => {
        if (e.clientY >= 100) {
          header.classList.remove('show');
        }
      }, 3000);
    } else {
      header.classList.remove('show');
    }
  });

  // Add interactive tooltips to skill icons
  const skillIcons = document.querySelectorAll('.skills-icons figure');
  skillIcons.forEach(icon => {
    const img = icon.querySelector('img');
    const alt = img ? img.alt : '';

    if (alt) {
      icon.setAttribute('title', alt);

      // Add click effect
      icon.addEventListener('click', function () {
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
    darkModeToggle.addEventListener("click", function () {
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
  document.addEventListener('keydown', function (e) {
    if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      homeLink.click();
    } else if (e.key === '2' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      aboutLink.click();
    } else if (e.key === '3' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      projectsLink.click();
    }
  });

  // Projects filtering functionality
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  function filterProjects(activeFilter) {
    let visibleCount = 0;

    projectCards.forEach((card, index) => {
      const category = card.getAttribute('data-category');

      if (activeFilter === 'all' || category === activeFilter) {
        card.classList.remove('hidden');
        // Add staggered animation for visible cards
        setTimeout(() => {
          card.style.animation = 'fadeInUp 0.6s ease forwards';
          card.style.animationDelay = `${visibleCount * 0.1}s`;
        }, 10);
        visibleCount++;
      } else {
        card.classList.add('hidden');
        card.style.animation = 'none';
      }
    });

    // Show message if no projects found
    const projectsGrid = document.querySelector('.projects-grid');
    let noResultsMsg = document.querySelector('.no-results-message');

    if (visibleCount === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = '<p>No projects found in this category.</p>';
        projectsGrid.appendChild(noResultsMsg);
      }
      noResultsMsg.style.display = 'block';
    } else {
      if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
      }
    }
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      const filter = this.getAttribute('data-filter');

      // Update active filter button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Filter project cards
      filterProjects(filter);
    });
  });

  // Initialize project animations when projects section is viewed
  const projectsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 100);
        });
      }
    });
  }, { threshold: 0.1 });

  if (projectsSection) {
    projectsObserver.observe(projectsSection);
  }

  // Video modal functionality
  window.openVideoModal = function (mediaUrl, mediaType = 'video') {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const gif = document.getElementById('modalGif');

    // Hide both elements first
    video.style.display = 'none';
    gif.style.display = 'none';

    if (mediaType === 'gif') {
      // Show GIF
      gif.src = mediaUrl;
      gif.style.display = 'block';
    } else {
      // Show video
      const sources = video.querySelectorAll('source');
      sources[0].src = mediaUrl.replace('.mov', '.mp4'); // Try mp4 first
      sources[1].src = mediaUrl; // Original file

      video.load();
      video.style.display = 'block';
    }

    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  window.closeVideoModal = function () {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const gif = document.getElementById('modalGif');

    // Hide modal with animation
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      video.pause();
      video.currentTime = 0;
      gif.src = ''; // Clear GIF source
    }, 300);

    // Restore body scroll
    document.body.style.overflow = '';
  };

  // Close modal when clicking outside the content
  document.getElementById('videoModal').addEventListener('click', function (e) {
    if (e.target === this) {
      closeVideoModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('videoModal');
      if (modal.style.display === 'flex') {
        closeVideoModal();
      }
    }
  });
});
