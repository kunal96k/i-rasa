$(function () {
  "use strict";

  //------- Parallax -------//
  var s = skrollr.init({
    forceHeight: false
  });
  if (s.isMobile()) {
    s.destroy();
  }

  //------- Active Nice Select --------//
  $('select').niceSelect();

  //------- hero carousel -------//
  $(".hero-carousel").owlCarousel({
    items: 3,
    margin: 10,
    autoplay: true,
    autoplayTimeout: 4000,
    autoplayHoverPause: true,
    loop: true,
    nav: true,
    navText: ["<i class='ti-angle-left'></i>", "<i class='ti-angle-right'></i>"],
    dots: false,
    responsive: {
      0: {
        items: 1
      },
      600: {
        items: 2
      },
      810: {
        items: 3
      }
    }
  });

  //------- Best Seller Carousel -------//
  if ($('.owl-carousel').length > 0) {
    $('#bestSellerCarousel').owlCarousel({
      loop: true,
      margin: 30,
      nav: true,
      autoplay: true,
      autoplayTimeout: 4500,
      autoplayHoverPause: true,
      navText: ["<i class='ti-arrow-left'></i>", "<i class='ti-arrow-right'></i>"],
      dots: false,
      responsive: {
        0: {
          items: 1
        },
        600: {
          items: 2
        },
        900: {
          items: 3
        },
        1130: {
          items: 4
        }
      }
    })
  }

  //------- single product area carousel -------//
  $(".s_Product_carousel").owlCarousel({
    items: 1,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    loop: true,
    nav: false,
    dots: false
  });

  //------- mailchimp --------//  
  function mailChimp() {
    $('#mc_embed_signup').find('form').ajaxChimp();
  }
  mailChimp();

  //------- fixed navbar --------//  
  $(window).scroll(function () {
    var sticky = $('.header_area'),
      scroll = $(window).scrollTop();

    if (scroll >= 100) sticky.addClass('navbar_fixed');
    else sticky.removeClass('navbar_fixed');

    // Show/hide scroll-top button after hero section
    if (scroll > window.innerHeight) {
      $('#scroll-top').addClass('visible');
    } else {
      $('#scroll-top').removeClass('visible');
    }
  });

  $('#scroll-top').on('click', function () {
    $('html, body').animate({
      scrollTop: 0
    }, 600);
    return false;
  });

  //------- Price Range slider -------//
  if (document.getElementById("price-range")) {

    var nonLinearSlider = document.getElementById('price-range');

    noUiSlider.create(nonLinearSlider, {
      connect: true,
      behaviour: 'tap',
      start: [500, 4000],
      range: {
        // Starting at 500, step the value by 500,
        // until 4000 is reached. From there, step by 1000.
        'min': [0],
        '10%': [500, 500],
        '50%': [4000, 1000],
        'max': [10000]
      }
    });


    var nodes = [
      document.getElementById('lower-value'), // 0
      document.getElementById('upper-value')  // 1
    ];

    // Display the slider value and how far the handle moved
    // from the left edge of the slider.
    nonLinearSlider.noUiSlider.on('update', function (values, handle, unencoded, isTap, positions) {
      nodes[handle].innerHTML = values[handle];
    });

  }

});

// I Rasa Custom JS Enhancements
$(document).ready(function () {
  // Add modal click events to all product buttons
  $('.card-product__imgOverlay button').on('click', function (e) {
    e.preventDefault();
    var iconClass = $(this).find('i').attr('class');
    var card = $(this).closest('.card-product');
    var title = card.find('.card-product__title').text().trim();
    var price = card.find('.card-product__price').text().trim();
    var imgSrc = card.find('.card-img').attr('src');

    if (iconClass.includes('ti-search') || iconClass.includes('ti-shopping-cart') || iconClass.includes('ti-heart')) {
      // Check if modal exists
      if ($('#product_modal').length) {
        $('#product_modal #modal_title').text(title);
        $('#product_modal .price').text(price);
        $('#product_modal #modal_img').attr('src', imgSrc);

        if (iconClass.includes('ti-shopping-cart')) {
          $('#product_modal .button--active').text('Add to Cart');
        } else if (iconClass.includes('ti-heart')) {
          $('#product_modal .button--active').text('Add to Wishlist');
        } else {
          $('#product_modal .button--active').text('View Details');
        }

        $('#product_modal').modal('show');
      } else {
        alert('Action triggered for ' + title);
      }
    }
  });

  $('.navbar-collapse .nav-link:not(.dropdown-toggle)').on('click', function () {
    if ($('.navbar-toggler').is(':visible')) {
      $('.navbar-collapse').collapse('hide');
    }
  });

  if (!$('.irasa-offcanvas-backdrop').length) {
    $('body').append('<div class="irasa-offcanvas-backdrop"></div>');
  }

  if (!$('.navbar-collapse .dropdown-toggle .irasa-submenu-indicator').length) {
    $('.navbar-collapse .dropdown-toggle').append('<span class="irasa-submenu-indicator" aria-hidden="true"></span>');
  }

  $(document).on('click', '.navbar-collapse .dropdown-toggle', function (e) {
    if ($('.navbar-toggler').is(':visible')) {
      e.preventDefault();
      e.stopPropagation();
      $(this).dropdown('toggle');
    }
  });

  $(document)
    .on('show.bs.dropdown', '.navbar-collapse .nav-item.submenu', function () {
      $(this).addClass('irasa-submenu-open');
    })
    .on('hide.bs.dropdown', '.navbar-collapse .nav-item.submenu', function () {
      $(this).removeClass('irasa-submenu-open');
    });

  $(document).on('show.bs.modal', function () {
    if ($('.navbar-toggler').is(':visible')) {
      $('.navbar-collapse').collapse('hide');
    }
  });

  $('.navbar-collapse')
    .on('show.bs.collapse', function () {
      $('body').addClass('irasa-offcanvas-open');
    })
    .on('hidden.bs.collapse', function () {
      $('body').removeClass('irasa-offcanvas-open');
    });

  $(document).on('click', '.irasa-offcanvas-backdrop', function () {
    if ($('.navbar-toggler').is(':visible')) {
      $('.navbar-collapse').collapse('hide');
    }
  });
});
