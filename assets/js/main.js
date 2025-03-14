/**
* Template Name: Personal - v2.1.0
* Template URL: https://bootstrapmade.com/personal-free-resume-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
!(function($) {
  "use strict";

  // Nav Menu
  $(document).on('click', '.nav-menu a, .mobile-nav a', function(e) {
    if (location.pathname.replace(/^\/|\/$/g, '') == this.pathname.replace(/^\/|\/$/g, '') && location.hostname == this.hostname) {
      var hash = this.hash;
      var target = $(hash);
      
      if (target.length) {
        e.preventDefault();
        
        // Update navigation - ensure we're targeting the correct nav item
        var $navItem = $(this).closest('li');
        $('.nav-menu .active, .mobile-nav .active').removeClass('active');
        $navItem.addClass('active');
        
        // Store the current navigation target for better detection
        window.lastNavigationTarget = hash;
        
        // Transform header
        if (hash !== '#header') {
          $('#header').addClass('header-top');
          
          // Hide all sections first
          $('section:not(#header)').removeClass('section-show');
          
          // Show target section
          $(hash).addClass('section-show');
        } else {
          $('#header').removeClass('header-top');
        }
        
        // Calculate scroll position and animate
        var offset = hash === '#header' ? 0 : 100;
        $('html, body').animate({
          scrollTop: target.offset().top - offset
        }, 1000, 'easeInOutExpo', function() {
          // Update URL after animation
          if (hash !== '#header') {
            window.location.hash = hash;
          } else {
            history.replaceState('', document.title, window.location.pathname);
          }
          
          // Extra check to ensure navigation is correct after scroll completes
          setTimeout(function() {
            $('.nav-menu .active, .mobile-nav .active').removeClass('active');
            $('.nav-menu, .mobile-nav').find('a[href="' + hash + '"]').closest('li').addClass('active');
          }, 100);
        });
        
        // Handle mobile nav
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
        
        return false;
      }
    }
  });

  // Show/hide sections on scroll
  $(window).scroll(function() {
    var scrollDistance = $(window).scrollTop();
    var windowHeight = $(window).height();
    
    // Update header state based on scroll position
    if (scrollDistance > windowHeight - 100) {
      $('#header').addClass('header-top');
    } else {
      $('#header').removeClass('header-top');
    }
    
    // Don't update navigation during programmatic scrolls
    if (window.isScrolling) return;
    
    // Update navigation based on scroll position
    var activeSection = null;
    var minDistance = Infinity;
    
    // First pass: find the section closest to the current scroll position
    $('section').each(function() {
      var $section = $(this);
      var sectionId = $section.attr('id');
      var sectionTop = $section.offset().top - 100;
      var distance = Math.abs(scrollDistance - sectionTop);
      
      // If this is the manually clicked section, prioritize it
      if (window.lastNavigationTarget === '#' + sectionId) {
        activeSection = $section;
        return false; // Break the loop
      }
      
      // Otherwise find closest section
      if (distance < minDistance) {
        minDistance = distance;
        activeSection = $section;
      }
    });
    
    // Now update based on the found section
    if (activeSection) {
      var sectionId = activeSection.attr('id');
      
      // Remove active class from all nav items
      $('.nav-menu .active, .mobile-nav .active').removeClass('active');
      
      // Add active class to current section's nav item
      var $navItem = $('.nav-menu, .mobile-nav').find('a[href="#' + sectionId + '"]').closest('li');
      if ($navItem.length) {
        $navItem.addClass('active');
      }
      
      // Show current section
      if (sectionId !== 'header') {
        $('section:not(#header)').removeClass('section-show');
        activeSection.addClass('section-show');
      }
    }
  });

  // Activate/show sections on load with hash links
  if (window.location.hash) {
    var initial_nav = window.location.hash;
    if ($(initial_nav).length) {
      $('#header').addClass('header-top');
      $('.nav-menu .active, .mobile-nav .active').removeClass('active');
      $('.nav-menu, .mobile-nav').find('a[href="' + initial_nav + '"]').closest('li').addClass('active');
      
      // Show initial section
      $('section').removeClass('section-show');
      $(initial_nav).addClass('section-show');
      
      setTimeout(function() {
        $('html, body').animate({
          scrollTop: $(initial_nav).offset().top - 100
        }, 1000, 'easeInOutExpo');
      }, 100);
    }
  } else {
    $('#header').removeClass('header-top');
    // Initialize active menu item
    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
    $('.nav-menu, .mobile-nav').find('a[href="#header"]').closest('li').addClass('active');
    
    // Show initial section
    $('section').removeClass('section-show');
    $('#header').addClass('section-show');
  }

  // Trigger scroll function on load to ensure navigation is correct
  $(window).trigger('scroll');

  // Mobile Navigation
  if ($('.nav-menu').length) {
    var $mobile_nav = $('.nav-menu').clone().prop({
      class: 'mobile-nav d-lg-none'
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
    $('body').append('<div class="mobile-nav-overly"></div>');

    $(document).on('click', '.mobile-nav-toggle', function(e) {
      $('body').toggleClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      $('.mobile-nav-overly').toggle();
    });

    $(document).click(function(e) {
      var container = $(".mobile-nav, .mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
      }
    });
  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
    $(".mobile-nav, .mobile-nav-toggle").hide();
  }

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
      once: true,
      offset: 100,
      delay: 100
    });
    
    // Trigger initial animations for visible sections
    $('section').each(function() {
      if ($(this).isInViewport()) {
        $(this).find('[data-aos]').each(function() {
          $(this).addClass('aos-animate');
        });
      }
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