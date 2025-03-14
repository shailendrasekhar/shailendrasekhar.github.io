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
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var hash = this.hash;
      var target = $(hash);
      
      if (target.length) {
        e.preventDefault();
        
        // Update navigation
        $('.nav-menu .active, .mobile-nav .active').removeClass('active');
        $(this).closest('li').addClass('active');
        
        // Transform header
        if (hash !== '#header') {
          $('#header').addClass('header-top');
        } else {
          $('#header').removeClass('header-top');
          $("section").removeClass('section-show');
        }
        
        // Show target section
        target.addClass('section-show');
        
        // Smooth scroll
        $('html, body').animate({
          scrollTop: target.offset().top - (hash === '#header' ? 0 : 70)
        }, 1000, 'easeInOutExpo', function() {
          // Update URL after animation
          if (hash !== '#header') {
            window.location.hash = hash;
          } else {
            history.replaceState('', document.title, window.location.pathname);
          }
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
    
    // Transform header based on scroll position
    if (scrollDistance > 50) {
      $('#header').addClass('header-top');
    } else {
      $('#header').removeClass('header-top');
    }
    
    // Show sections and update navigation based on scroll position
    var currentSection = '';
    
    $('section').each(function() {
      var sectionTop = $(this).offset().top - 90; // Account for header height
      var sectionBottom = sectionTop + $(this).outerHeight();
      
      if (scrollDistance >= sectionTop && scrollDistance < sectionBottom) {
        currentSection = $(this).attr('id');
        $(this).addClass('section-show');
        
        // Update navigation
        $('.nav-menu .active, .mobile-nav .active').removeClass('active');
        $('.nav-menu, .mobile-nav').find('a[href="#' + currentSection + '"]').parent('li').addClass('active');
        
        // Update URL without triggering scroll
        if (currentSection !== 'header') {
          history.replaceState(null, null, '#' + currentSection);
        } else {
          history.replaceState(null, null, window.location.pathname);
        }
      }
    });
  }).scroll();

  // Activate/show sections on load with hash links
  if (window.location.hash) {
    var initial_nav = window.location.hash;
    if ($(initial_nav).length) {
      $('#header').addClass('header-top');
      $('.nav-menu .active, .mobile-nav .active').removeClass('active');
      $('.nav-menu, .mobile-nav').find('a[href="' + initial_nav + '"]').parent('li').addClass('active');
      setTimeout(function() {
        $("section").removeClass('section-show');
        $(initial_nav).addClass('section-show');
        $('html, body').animate({
          scrollTop: $(initial_nav).offset().top
        }, 1000, 'easeInOutExpo');
      }, 350);
    }
  } else {
    $('#header').removeClass('header-top');
    $('#header').addClass('section-show');
  }

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

})(jQuery);