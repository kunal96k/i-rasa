$(function () {
  "use strict";

  //------- Parallax -------//
  if (typeof skrollr !== 'undefined') {
    var s = skrollr.init({
      forceHeight: false
    });
    if (s.isMobile()) {
      s.destroy();
    }
  }

  //------- Active Nice Select --------//
  $('select:not(.ignore-nice-select)').niceSelect();

  //------- hero carousel -------//
  if (typeof $.fn.owlCarousel === 'function') {
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
  }

  //------- Best Seller Carousel -------//
  if (typeof $.fn.owlCarousel === 'function' && $('.owl-carousel').length > 0) {
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
    });
  }

  //------- single product area carousel -------//
  if (typeof $.fn.owlCarousel === 'function') {
    $(".s_Product_carousel").owlCarousel({
      items: 1,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      loop: true,
      nav: false,
      dots: false
    });
  }

  //------- mailchimp --------//  
  function mailChimp() {
    if ($.fn.ajaxChimp) {
      $('#mc_embed_signup').find('form').ajaxChimp();
    }
  }
  mailChimp();

  //------- show toast --------//
  window.showToast = function (msg) {
    var toast = $('#cart-toast');
    if (!toast.length) {
      $('body').append('<div id="cart-toast" style="position:fixed; bottom:90px; right:28px; z-index:9999; background:#1a1200; color:#d4af37; border:1px solid #d4af37; padding:12px 24px; border-radius:50px; font-size:14px; font-weight:700; opacity:0; transform:translateY(15px); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events:none; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:flex; align-items:center; gap:10px;"></div>');
      toast = $('#cart-toast');
    }
    toast.html("<i class='fas fa-shopping-bag'></i> " + msg);
    toast.css({ 'opacity': '1', 'transform': 'translateY(0)' });

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(function () {
      toast.css({ 'opacity': '0', 'transform': 'translateY(15px)' });
    }, 3000);
  };

  //------- fixed navbar with throttling --------//  
  var isScrolling = false;
  $(window).scroll(function () {
    if (!isScrolling) {
      window.requestAnimationFrame(function () {
        var sticky = $('.header_area'),
          scroll = $(window).scrollTop();

        if (scroll >= 100) sticky.addClass('navbar_fixed');
        else sticky.removeClass('navbar_fixed');

        if (scroll > window.innerHeight) {
          $('#scroll-top').addClass('visible');
        } else {
          $('#scroll-top').removeClass('visible');
        }
        isScrolling = false;
      });
      isScrolling = true;
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
    var iconClass = $(this).find('i').attr('class');
    if (iconClass && iconClass.includes('ti-heart')) {
      // Let the global wishlist handler take care of it
      return;
    }
    
    e.preventDefault();
    var card = $(this).closest('.card-product');
    var title = card.find('.card-product__title').text().trim();
    var priceText = card.find('.card-product__price').text().trim() || "Rs. 399";
    var imgSrc = card.find('.card-img').attr('src');
    
    // Fallback price logic from sibling button if needed
    var siblingSearch = card.find('button[data-target="#product_modal"]');
    if (siblingSearch.length && siblingSearch.data('price')) {
      priceText = siblingSearch.data('price');
    }

    if (iconClass && iconClass.includes('ti-shopping-cart')) {
      if (typeof AuthGuard !== 'undefined' && !AuthGuard.currentUser) {
        if (typeof CartEngine !== 'undefined') CartEngine._showToast('✕ Please login first to add items to cart!');
        setTimeout(() => {
          window.location.href = 'login.html?redirect=' + window.location.pathname.split("/").pop();
        }, 1500);
        return;
      }
      var parsedPrice = parseInt(String(priceText).replace(/[^\d]/g, '')) || 399;
      if (typeof CartEngine !== 'undefined') {
        CartEngine.add({
          id: title,
          name: title,
          img: imgSrc,
          price: parsedPrice,
          size: '50ml', // default
          reuseBottle: false,
          bottlePrice: 0,
          bottlePriceDiscount: 0
        }, 1);
      }
    } else if (iconClass && iconClass.includes('ti-search')) {
      if ($('#product_modal').length) {
        $('#product_modal #modal_title').text(title);
        $('#product_modal .price').text(priceText);
        $('#product_modal #modal_img').attr('src', imgSrc);
        $('#product_modal .button--active').html('<i class="fas fa-shopping-cart"></i> Add to Cart');
        $('#product_modal').modal('show');
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

  // Inject Mobile Close Button
  if ($('.navbar-toggler').is(':visible') && !$('.mobile-menu-close').length) {
    $('.navbar-collapse').prepend('<button class="mobile-menu-close" aria-label="Close menu"><i class="ti-close"></i></button>');
  }

  if (!$('.navbar-collapse .dropdown-toggle .irasa-submenu-indicator').length) {
    $('.navbar-collapse .dropdown-toggle').append('<span class="irasa-submenu-indicator" aria-hidden="true"></span>');
  }

  $(document).on('click', '.mobile-menu-close', function () {
    $('.navbar-collapse').collapse('hide');
  });

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

  // Global Wishlist Event Delegation for Grid Cards (Matches buttons with heart icons)
  $(document).on('click', '.mens-product-card button, .card-product button', async function(e) {
    if (this.hasAttribute('onclick')) {
      return; // Skip delegation if the button has an inline handler (e.g. attar.html)
    }
    var btn = $(this);
    if (!btn.find('.ti-heart, .fa-heart, .far.fa-heart, .fas.fa-heart').length && btn.attr('title') !== 'Wishlist') {
      return; // Not a wishlist button
    }
    
    e.preventDefault();
    e.stopPropagation();
    if (typeof WishlistEngine === 'undefined') return;

    var container = btn.closest('.overlay-actions, .card-product__imgOverlay, .card-product__img, .card-img-area, .mens-product-card, .card-product');
    var siblingSearch = container.find('button[data-target="#product_modal"], button[data-toggle="modal"]');
    
    if (siblingSearch.length) {
      var name = siblingSearch.data('title');
      var priceText = siblingSearch.data('price') || "Rs. 399";
      var img = siblingSearch.data('img') || "img/product/product1.png";
      var price = parseInt(priceText.replace(/[^\d]/g, '')) || 399;
      
      await WishlistEngine.toggle({
        id: name,
        name: name,
        img: img,
        price: price
      });
      
      // Sync immediately after toggle completes to keep styles consistent
      syncWishlistButtons();
    }
  });

  // Global definition of toggleWishlistFromModal to manage quick views globally
  window.toggleWishlistFromModal = function() {
    if (typeof WishlistEngine === 'undefined') return;
    var modalTitleEl = document.getElementById('modal_title');
    var modalImgEl = document.getElementById('modal_img');
    var modalPriceEl = document.getElementById('modal_price');
    if (!modalTitleEl) return;

    var name = modalTitleEl.textContent.trim();
    var img = modalImgEl ? modalImgEl.getAttribute('src') : 'img/product/product1.png';
    var priceText = modalPriceEl ? modalPriceEl.textContent : '399';
    var price = parseInt(priceText.replace(/[^\d]/g, '')) || 399;

    WishlistEngine.toggle({
      id: name,
      name: name,
      img: img,
      price: price
    });
  };

  // Color code initialized hearts and synchronize across the page dynamically
  function syncWishlistButtons() {
    if (typeof WishlistEngine === 'undefined') return;
    
    // Update grid card buttons
    $('.mens-product-card button, .card-product button, .product_sidebar_area button, .single-search-product-wrapper button').each(function() {
      var btn = $(this);
      if (this.hasAttribute('onclick')) {
        return; // Skip sync if button has an inline handler (keeps attar.html specific styling untouched!)
      }
      if (!btn.find('.ti-heart, .fa-heart, .far.fa-heart, .fas.fa-heart').length && btn.attr('title') !== 'Wishlist') {
        return;
      }
      var container = btn.closest('.overlay-actions, .card-product__imgOverlay, .card-product__img, .card-img-area, .mens-product-card, .card-product, .single-search-product-wrapper');
      var siblingSearch = container.find('button[data-target="#product_modal"], button[data-toggle="modal"], a[data-target="#product_modal"]');
      
      if (siblingSearch.length) {
        var name = siblingSearch.data('title');
        var icon = btn.find('i');
        if (WishlistEngine.has(name)) {
          btn.attr('style', 'background: rgba(255, 77, 77, 0.15) !important; color: #ff4d4d !important; border: 1px solid rgba(255, 77, 77, 0.3) !important;');
          icon.removeClass('ti-heart far').addClass('fas fa-heart');
        } else {
          btn.removeAttr('style');
          icon.removeClass('fas fa-heart').addClass('ti-heart');
        }
      }
    });

    // Also update detail/quick view modal wishlist button if present on page
    var modalTitleEl = document.getElementById('modal_title');
    var modalBtn = document.getElementById('modal_wishlist_btn');
    if (modalTitleEl && modalBtn) {
      var modalName = modalTitleEl.textContent.trim();
      if (WishlistEngine.has(modalName)) {
        modalBtn.style.background = 'rgba(255, 77, 77, 0.15)';
        modalBtn.style.color = '#ff4d4d';
        modalBtn.style.border = '1px solid rgba(255, 77, 77, 0.3)';
        modalBtn.innerHTML = '<i class="fas fa-heart"></i>';
      } else {
        modalBtn.style.background = '#111';
        modalBtn.style.color = '#d4af37';
        modalBtn.style.border = '1px solid #333';
        modalBtn.innerHTML = '<i class="far fa-heart"></i>';
      }
    }
    
    // For single product detail page wishlist buttons
    var detailHeartBtn = document.querySelector('.s_product_text .card_area .icon_btn[onclick*="WishlistEngine"]');
    if (detailHeartBtn) {
      var productNameEl = document.querySelector('.s_product_text h3');
      if (productNameEl) {
        var prodName = productNameEl.textContent.trim();
        var icon = detailHeartBtn.querySelector('i');
        if (WishlistEngine.has(prodName)) {
          detailHeartBtn.style.background = 'rgba(255, 77, 77, 0.15)';
          detailHeartBtn.style.color = '#ff4d4d';
          detailHeartBtn.style.border = '1px solid rgba(255, 77, 77, 0.3)';
          if (icon) icon.className = 'fas fa-heart';
        } else {
          detailHeartBtn.removeAttribute('style');
          if (icon) icon.className = 'ti-heart';
        }
      }
    }
  }

  // Bind to wishlist update event and modal open events
  document.addEventListener('wishlist:updated', syncWishlistButtons);
  $(document).on('shown.bs.modal', '#product_modal', syncWishlistButtons);
  
  // Call initially
  setTimeout(syncWishlistButtons, 400);

  // Dynamic CSS Injection for forcing high-contrast visibility on bottle size select buttons in all modals
  $('<style>')
    .prop('type', 'text/css')
    .html('\
      .modal-size-btn {\
        background: #111 !important;\
        color: #aaa !important;\
        border: 1px solid #333 !important;\
        border-radius: 20px !important;\
        padding: 6px 15px !important;\
        font-size: 12px !important;\
        font-weight: bold !important;\
        transition: all 0.3s !important;\
        outline: none !important;\
      }\
      .modal-size-btn.active {\
        color: #fff !important;\
        border: 1px solid #d4af37 !important;\
        box-shadow: 0 0 8px rgba(212,175,55,0.2) !important;\
      }\
      .modal-size-btn:hover {\
        color: #fff !important;\
        border-color: #d4af37 !important;\
      }\
    ')
    .appendTo('head');
});
