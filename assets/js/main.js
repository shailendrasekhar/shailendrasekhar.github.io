/**
* Template Name: Personal - v2.1.0
* Template URL: https://bootstrapmade.com/personal-free-resume-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
!(function($) {
  "use strict";

  // Global variables for navigation state
  var activeSection = '';
  var navTimeout;

  // Throttle function to limit execution frequency
  function throttle(func, delay) {
    var lastCall = 0;
    return function() {
      var now = new Date().getTime();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, arguments);
      }
    };
  }

  // Update the navigation state
  function updateNavigation(targetHash, skipAnimation) {
    if (!targetHash) return;
    
    var $target = $(targetHash);
    if (!$target.length) return;
    
    // Update active navigation item
    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
    $('.nav-menu a[href="' + targetHash + '"], .mobile-nav a[href="' + targetHash + '"]').closest('li').addClass('active');
    
    // Update header styling
    if (targetHash !== '#header') {
      $('#header').removeClass('header').addClass('header-top');
      $('body').addClass('header-top-active'); // Add class to body to adjust section padding
      
      // Ensure all sections are completely hidden first
      $('section').removeClass('section-show').css({
        'opacity': 0,
        'pointer-events': 'none',
        'visibility': 'hidden',
        'display': 'none' // Completely hide sections
      });
      
      // Show the target section immediately
      $target.addClass('section-show').css({
        'opacity': 1,
        'pointer-events': 'auto',
        'visibility': 'visible',
        'display': 'block' // Explicitly make visible
      });
      
      // Force browser reflow to ensure changes take effect
      void $target[0].offsetWidth;
      
      // Reset scroll position of the section to top when navigating to it
      requestAnimationFrame(function() {
        $target.scrollTop(0);
        
        // Special handling for education and experience sections
        if (targetHash === '#education' || targetHash === '#experience') {
          // Make sure these sections have proper height to enable scrolling
          var headerHeight = $('#header').outerHeight();
          var windowHeight = $(window).height();
          var sectionHeight = windowHeight - headerHeight;
          
          $target.css({
            'height': sectionHeight + 'px',
            'overflow-y': 'auto',
            'z-index': 10, // Ensure it's above other sections
            'padding-top': headerHeight + 'px' // Add padding to prevent content from being hidden by header
          });
        }
      });
    } else {
      $('#header').removeClass('header-top').addClass('header');
      $('body').removeClass('header-top-active'); // Remove class from body
      $('section').removeClass('section-show').css({
        'opacity': 0,
        'pointer-events': 'none',
        'visibility': 'hidden',
        'display': 'none' // Completely hide all sections
      });
    }
    
    // Update URL without scrolling
    if (targetHash !== '#header') {
      if (history.pushState) {
        history.pushState(null, null, targetHash);
      } else {
        // Prevent default hash behavior that would cause scrolling
        window.location.hash = targetHash;
        // Immediately scroll back to current position to prevent jumping
        window.scrollTo(0, 0);
      }
    } else if (history.pushState) {
      history.pushState('', document.title, window.location.pathname);
    }
  }
  
  // We'll no longer need the scroll handler for section highlighting
  // This function will handle header state based on scroll position
  function handleScroll() {
    var scrollPosition = $(window).scrollTop();
    var windowHeight = $(window).height();
    
    // Check if any non-header section is currently active
    var nonHeaderSectionActive = $('section:not(#header).section-show').length > 0;
    
    // Only toggle header state when no other section is active
    // Or when we need to collapse the header (scrolling down in any context)
    if (scrollPosition > windowHeight - 100) {
      $('#header').removeClass('header').addClass('header-top');
      $('body').addClass('header-top-active'); // Add class to body
    } else if (!nonHeaderSectionActive) {
      // Only expand the header if no other section is active
      $('#header').removeClass('header-top').addClass('header');
      $('body').removeClass('header-top-active'); // Remove class from body
    }
  }

  // Handle click events on navigation links
  $(document).on('click', '.nav-menu a, .mobile-nav a', function(e) {
    e.preventDefault(); // Prevent default anchor behavior
    var hash = this.hash;
    
    if (hash && $(hash).length) {
      updateNavigation(hash, true);
      
      // Close mobile nav if open
      if ($('body').hasClass('mobile-nav-active')) {
        $('body').removeClass('mobile-nav-active');
        $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      }
    }
  });

  // Initialize navigation on page load
  function initNavigation() {
    // We'll no longer need to calculate section positions for scroll-based navigation
    // updateSectionPositions();
    
    // Check for hash in URL
    if (window.location.hash && $(window.location.hash).length) {
      updateNavigation(window.location.hash, true);
    } else {
      // Show the header/home section by default
      updateNavigation('#header', true);
    }
  }

  // Initialize mobile navigation
  function initMobileNav() {
    if ($('.nav-menu').length) {
      var $mobile_nav = $('.nav-menu').clone().prop({
        class: 'mobile-nav d-lg-none'
      });
      
      $('body').append($mobile_nav);
      $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
      
      // Toggle mobile nav
      $(document).on('click', '.mobile-nav-toggle', function(e) {
        $('body').toggleClass('mobile-nav-active');
        $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      });

      // Close mobile nav when clicking outside
      $(document).on('click', function(e) {
        var container = $(".mobile-nav, .mobile-nav-toggle");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          if ($('body').hasClass('mobile-nav-active')) {
            $('body').removeClass('mobile-nav-active');
            $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          }
        }
      });
    } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
      $(".mobile-nav, .mobile-nav-toggle").hide();
    }
  }

  // Handle window resize
  $(window).on('resize', throttle(function() {
    // Update header state
    handleScroll();
    
    // Update section heights if they're visible
    var currentSection = $('.section-show');
    if (currentSection.length && (currentSection.attr('id') === 'education' || currentSection.attr('id') === 'experience')) {
      var headerHeight = $('#header').outerHeight();
      var windowHeight = $(window).height();
      var sectionHeight = windowHeight - headerHeight;
      
      currentSection.css({
        'height': sectionHeight + 'px',
        'overflow-y': 'auto'
      });
    }
  }, 250));

  // Initialize everything on page load
  $(window).on('load', function() {
    // Initialize navigation components
    initNavigation();
    initMobileNav();
    
    // Set up minimal scroll handler for header state only
    $(window).on('scroll', throttle(handleScroll, 100));
    
    // Initialize typing animation if Typed.js exists
    if ($('.typing').length && typeof Typed !== 'undefined') {
      new Typed('.typing', {
        strings: ["a Robotic Software Engineer", "an AI Researcher and Educator"],
        loop: true,
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 1000
      });
    }
  });

  // jQuery counterUp
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 1000
  });

  // Skills section
  $('.skills-content').waypoint(function() {
    $('.progress .progress-bar').each(function() {
      $(this).css("width", $(this).attr("aria-valuenow") + '%');
    });
  }, {
    offset: '80%'
  });

  // Testimonials carousel (uses the Owl Carousel library)
  $(".testimonials-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      900: {
        items: 3
      }
    }
  });

  // Porfolio isotope and filter
  $(window).on('load', function() {
    var portfolioIsotope = $('.portfolio-container').isotope({
      itemSelector: '.portfolio-item',
      layoutMode: 'fitRows'
    });

    $('#portfolio-flters li').on('click', function() {
      $("#portfolio-flters li").removeClass('filter-active');
      $(this).addClass('filter-active');

      portfolioIsotope.isotope({
        filter: $(this).data('filter')
      });
    });

  });

  // Initiate venobox (lightbox feature used in portofilo)
  $(document).ready(function() {
    $('.venobox').venobox();
  });

  // Initialize AOS animations
  $(document).ready(function() {
    // Initialize AOS with custom settings
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  });

  // Helper function to check if element is in viewport
  $.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  // Emergency Navigation Management
  $(document).ready(function() {
    var $emergencyNav = $('#emergency-nav');
    var $header = $('#header');
    
    // Function to check if header is visible and working
    function isHeaderWorking() {
      return (
        $header.is(':visible') && 
        $header.css('opacity') > 0 && 
        $header.css('visibility') !== 'hidden' &&
        $('.nav-menu').is(':visible')
      );
    }
    
    // Check if we need the emergency nav
    function checkEmergencyNav() {
      if (isHeaderWorking()) {
        // Header appears to be working, hide the emergency nav
        $emergencyNav.fadeOut('slow');
        console.log('Header working, hiding emergency nav');
      } else {
        // Header not working, show the emergency nav
        $emergencyNav.fadeIn('fast');
        console.log('Header not working, showing emergency nav');
      }
    }
    
    // Initial check after a delay to let the page load
    setTimeout(checkEmergencyNav, 1000);
    
    // Also recheck every 3 seconds
    setInterval(checkEmergencyNav, 3000);
    
    // Handle clicks on emergency nav links
    $emergencyNav.find('a').on('click', function(e) {
      e.preventDefault();
      var target = $(this).attr('href');
      
      // Manually trigger navigation
      updateNavigation(target, true);
      
      // After navigation, check if header is now working
      setTimeout(checkEmergencyNav, 500);
    });
  });

})(jQuery);