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
      $('#header').addClass('header-top');
      
      // Ensure all sections are hidden first
      $('section').removeClass('section-show').css('opacity', 0);
      
      // Show the target section immediately
      $target.addClass('section-show').css('opacity', 1);
      
      // Reset scroll position of the section to top when navigating to it
      $target.scrollTop(0);
    } else {
      $('#header').removeClass('header-top');
      $('section').removeClass('section-show').css('opacity', 0);
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
  // This function will be replaced with a simpler version
  function handleScroll() {
    var scrollPosition = $(window).scrollTop();
    var windowHeight = $(window).height();
    
    // Only handle the header collapse/expand based on scroll position
    if (scrollPosition > windowHeight - 100) {
      $('#header').addClass('header-top');
    } else {
      $('#header').removeClass('header-top');
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

  // Handle window resize (update section positions)
  $(window).on('resize', throttle(function() {
    // No longer need to update section positions
    // Just ensure header is sized properly
    handleScroll();
  }, 250));

  // Initialize everything on page load
  $(window).on('load', function() {
    // Initialize typing animation if Typed.js exists
    if ($('.typing').length && typeof Typed !== 'undefined') {
      new Typed('.typing', {
        strings: ["Software Engineer", "ML Engineer", "Full Stack Developer"],
        loop: true,
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 2000
      });
    }
    
    // Initialize navigation components
    initNavigation();
    initMobileNav();
    
    // Set up minimal scroll handler for header state only
    $(window).on('scroll', throttle(handleScroll, 100));
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

})(jQuery);