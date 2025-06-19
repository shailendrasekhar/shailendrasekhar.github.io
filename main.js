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
  const projectsSection = document.getElementById('projects');
  const homeLink = document.querySelector('a[href="#home"]');
  const aboutLink = document.querySelector('a[href="#about"]');
  const projectsLink = document.querySelector('a[href="#projects"]');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const header = document.getElementById('header');

  console.log('Dark mode toggle element:', darkModeToggle);

  // Show Home section by default
  if (homeSection && aboutSection && projectsSection) {
    homeSection.style.display = 'flex';
    aboutSection.style.display = 'none';
    projectsSection.style.display = 'none';
  }

  // Enhanced page transitions
  function transitionToSection(showSection, hideSection1, hideSection2, displayType = 'flex') {
    // Add fade out effect to current sections
    if (hideSection1.style.display !== 'none') {
      hideSection1.classList.add('fade-out');
    }
    if (hideSection2.style.display !== 'none') {
      hideSection2.classList.add('fade-out');
    }
    
    setTimeout(() => {
      hideSection1.style.display = 'none';
      hideSection2.style.display = 'none';
      hideSection1.classList.remove('fade-out');
      hideSection2.classList.remove('fade-out');
      
      showSection.style.display = displayType;
      
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
      transitionToSection(homeSection, aboutSection, projectsSection, 'flex');
      
      // Remove active classes from body
      document.body.classList.remove('about-active', 'projects-active');
      
      // Update active nav
      document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
      homeLink.parentElement.classList.add('active');
    });
  }

  if (aboutLink) {
    aboutLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Smooth transition to about
      transitionToSection(aboutSection, homeSection, projectsSection, 'block');
      
      // Add about-active class to body
      document.body.classList.remove('projects-active');
      document.body.classList.add('about-active');
      
      // Update active nav
      document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
      aboutLink.parentElement.classList.add('active');
    });
  }

  if (projectsLink) {
    projectsLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Smooth transition to projects
      transitionToSection(projectsSection, homeSection, aboutSection, 'block');
      
      // Add projects-active class to body
      document.body.classList.remove('about-active');
      document.body.classList.add('projects-active');
      
      // Update active nav
      document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
      projectsLink.parentElement.classList.add('active');
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
    button.addEventListener('click', function() {
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
  window.openVideoModal = function(mediaUrl, mediaType = 'video') {
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

  window.closeVideoModal = function() {
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
  document.getElementById('videoModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeVideoModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('videoModal');
      if (modal.style.display === 'flex') {
        closeVideoModal();
      }
    }
  });
});
