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
  window.showToast = function (msg, type) {
    // Delegate to CartEngine's rich toast if available
    if (typeof CartEngine !== 'undefined' && CartEngine._showToast) {
      CartEngine._showToast(msg, type);
      return;
    }
    // Fallback: standalone version (same logic, same styles)
    if (!type) {
      if (/success|✅|✓/i.test(msg)) type = 'success';
      else if (/error|fail|❌|✕/i.test(msg)) type = 'error';
      else type = 'info';
    }
    var container = document.getElementById('_irasa_toast_container');
    if (!container) {
      container = document.createElement('div');
      container.id = '_irasa_toast_container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none;';
      document.body.appendChild(container);
    }
    var colors = { success:'#0d1f0f', error:'#1f0d0d', info:'#0a1220', warning:'#1f1700' };
    var borders = { success:'#4caf50', error:'#ef4444', info:'#d4af37', warning:'#f59e0b' };
    var textCols = { success:'#6ee88a', error:'#f87171', info:'#d4af37', warning:'#fbbf24' };
    var iconMap = { success:'fas fa-check-circle', error:'fas fa-times-circle', info:'fas fa-shopping-bag', warning:'fas fa-exclamation-triangle' };
    var cleanMsg = msg.replace(/^[✓✔✕✗×⚠️❌✅♥❤💵👁📥⏳]+\s*/u, '').trim();
    var t = document.createElement('div');
    t.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:280px;max-width:360px;padding:14px 18px 14px 16px;border-radius:14px;font-family:Outfit,Inter,sans-serif;font-size:13.5px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.55);border-left:4px solid ' + (borders[type]||'#d4af37') + ';background:' + (colors[type]||'#0a1220') + ';color:' + (textCols[type]||'#d4af37') + ';opacity:0;transform:translateX(60px);transition:opacity .35s,transform .35s;pointer-events:auto;cursor:pointer;position:relative;overflow:hidden;';
    t.innerHTML = '<i class="' + (iconMap[type]||'fas fa-info-circle') + '" style="font-size:16px;flex-shrink:0;"></i><span style="flex:1;line-height:1.4;">' + cleanMsg + '</span>';
    container.appendChild(t);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translateX(0)'; }); });
    var timer = setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(60px)'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 400); }, 3000);
    t.addEventListener('click', function(){ clearTimeout(timer); t.style.opacity='0'; t.style.transform='translateX(60px)'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 400); });
  };

  //------- fixed navbar with throttling --------//  
  var isScrolling = false;
  var isIndexPage = document.querySelector('.hero-banner') !== null;
  if (!isIndexPage) {
    $('.header_area').css({
      'position': 'relative',
      'top': 'auto'
    });
  }

  $(window).scroll(function () {
    if (!isScrolling) {
      window.requestAnimationFrame(function () {
        var sticky = $('.header_area'),
          scroll = $(window).scrollTop();

        if (isIndexPage && window.innerWidth > 991) {
          if (scroll >= 100) sticky.addClass('navbar_fixed');
          else sticky.removeClass('navbar_fixed');
        } else {
          sticky.removeClass('navbar_fixed');
        }

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

  $(document).on('click', '#scroll-top', function () {
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
    var priceText = card.find('.card-product__price').text().trim() || "Rs. 499";
    var imgSrc = card.find('.card-img').attr('src');
    
    // Fallback price logic from sibling button if needed
    var siblingSearch = card.find('button[data-target="#product_modal"]');
    if (siblingSearch.length && siblingSearch.data('price')) {
      priceText = siblingSearch.data('price');
    }

    if (iconClass && iconClass.includes('ti-shopping-cart')) {
      var card = $(this).closest('.card-product');
      var modalTrigger = card.find('button[data-target="#product_modal"]');

      if (modalTrigger.length && $('#product_modal').length) {
        modalTrigger.click();
        return;
      }

      // Fallback if modal is unavailable: add default 60ml product to cart.
      var parsedPrice = parseInt(String(priceText).replace(/[^\d]/g, '')) || 499;
      if (typeof CartEngine !== 'undefined') {
        CartEngine.add({
          id: title,
          name: title,
          img: imgSrc,
          price: parsedPrice,
          size: '60ml',
          reuseBottle: false,
          bottlePrice: 0,
          bottlePriceDiscount: 0
        }, 1);
      }
      return;
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

  $('.navbar-collapse .nav-link:not(.dropdown-toggle):not(.irasa-drop-trigger)').on('click', function () {
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
      var priceText = siblingSearch.data('price') || "Rs. 499";
      var img = siblingSearch.data('img') || "img/product/product1.png";
      var price = parseInt(priceText.replace(/[^\d]/g, '')) || 499;
      
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
    var priceText = modalPriceEl ? modalPriceEl.textContent : '499';
    var price = parseInt(priceText.replace(/[^\d]/g, '')) || 499;

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

// Fix missing footer FontAwesome icons by replacing with Themify icons
$(document).ready(function() {
  $('.sm-head .fa-map-marker-alt').removeClass('fas fa-map-marker-alt').addClass('ti-location-pin');
  $('.sm-head .fa-phone-alt').removeClass('fas fa-phone-alt').addClass('ti-headphone-alt');
  $('.sm-head .fa-envelope').removeClass('fas fa-envelope').addClass('ti-email');

  // Dynamic injection of premium page-specific floating togglers
  var path = window.location.pathname.toLowerCase();
  var isIndex = path.indexOf('index') !== -1 || path.endsWith('/') || path.split('/').pop() === '';
  var isContact = path.indexOf('contact') !== -1;

  if (isIndex) {
    if ($('#scroll-top').length === 0) {
      $('body').append('<button id="scroll-top" class="floating-toggler" title="Go to top"><i class="fas fa-arrow-up"></i></button>');
    }
  } else if (isContact) {
    if ($('#whatsapp-float').length === 0) {
      $('body').append('<a href="https://wa.me/919823833303?text=Hello%20I%27m%20interested%20in%20ordering%20from%20I%20Rasa%20Perfumes." id="whatsapp-float" class="floating-toggler whatsapp-float" target="_blank" rel="noopener" title="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>');
    }
  } else {
    if ($('#shop-now-float').length === 0) {
      $('body').append('<a href="category.html" id="shop-now-float" class="floating-toggler shop-now-float" title="Shop Now"><i class="fas fa-shopping-bag"></i></a>');
    }
  }
});

// Global Product Modal Pricing State & Handlers
window.modalPricingState = window.modalPricingState || {
  basePrice: 499,
  selectedSize: 60,
  bottlePrice: 99,
  reuseBottle: false
};

window.selectModalSize = function (size, bPrice, el) {
  window.modalPricingState.selectedSize = size;
  window.modalPricingState.bottlePrice = bPrice;

  document.querySelectorAll('.modal-size-btn').forEach(function (btn) {
    btn.classList.remove('active');
    btn.style.color = '#aaa';
    btn.style.border = '1px solid #333';
    btn.style.boxShadow = 'none';
  });
  if (el) {
    el.classList.add('active');
    el.style.color = '#fff';
    el.style.border = '1px solid #d4af37';
    el.style.boxShadow = '0 0 8px rgba(212,175,55,0.2)';
  }

  var savingsEl = document.getElementById('modalBottleSavingsAmount');
  if (savingsEl) {
    savingsEl.textContent = bPrice;
  }

  window.updateModalPriceDisplay();
};

window.toggleReuseModalBottle = function () {
  var check = document.getElementById('modalReuseBottleCheck');
  if (check) {
    window.modalPricingState.reuseBottle = check.checked;
  }
  window.updateModalPriceDisplay();
};

window.updateModalPriceDisplay = function () {
  var state = window.modalPricingState || { basePrice: 499, selectedSize: 0, bottlePrice: 0, reuseBottle: false };
  var bottleAddon = state.selectedSize > 0 ? state.bottlePrice : 0;
  var finalPrice = state.basePrice + bottleAddon - (state.reuseBottle ? bottleAddon : 0);
  var modalPriceEl = document.getElementById('modal_price');
  if (modalPriceEl) {
    modalPriceEl.textContent = 'Rs. ' + finalPrice.toFixed(2);
  }
};

window.changeQty = function (amount) {
  var input = document.getElementById('modal_qty');
  if (input) {
    var val = parseInt(input.value) + amount;
    if (val < 1) val = 1;
    input.value = val;
  }
};

window.addToCartModal = async function () {
  if (typeof AuthGuard !== 'undefined' && !AuthGuard.currentUser) {
    await AuthGuard.init();
  }

  if (typeof AuthGuard !== 'undefined' && !AuthGuard.currentUser) {
    if (typeof CartEngine !== 'undefined' && CartEngine._showToast) {
      CartEngine._showToast('✕ Please login first to add items to cart!');
    }
    setTimeout(function () {
      window.location.href = 'login.html?redirect=' + window.location.pathname.split("/").pop();
    }, 1500);
    return;
  }

  var titleEl = document.getElementById('modal_title');
  var qtyEl = document.getElementById('modal_qty');
  var imgEl = document.getElementById('modal_img');

  var name = titleEl ? titleEl.innerText.trim() : '';
  var qty = qtyEl ? (parseInt(qtyEl.value) || 1) : 1;
  var img = imgEl ? (imgEl.getAttribute('src') || 'img/i_rasa_bottles/p3.png') : 'img/i_rasa_bottles/p3.png';

  var state = window.modalPricingState || { basePrice: 499, selectedSize: 0, bottlePrice: 0, reuseBottle: false };

  if (state.selectedSize === 0) {
    if (typeof CartEngine !== 'undefined' && CartEngine._showToast) {
      CartEngine._showToast('✕ Please select a bottle size before adding to cart!');
    } else {
      alert('Please select a bottle size before adding to cart!');
    }
    return;
  }

  var bottleAddon = state.selectedSize > 0 ? state.bottlePrice : 0;
  var finalPrice = state.basePrice + bottleAddon - (state.reuseBottle ? bottleAddon : 0);
  var size = state.selectedSize > 0 ? (state.selectedSize + 'ml') : 'No Bottle';
  var reuseBottle = state.reuseBottle;
  var bottlePrice = state.bottlePrice;
  var bottlePriceDiscount = state.reuseBottle ? bottleAddon : 0;

  if (typeof CartEngine !== 'undefined') {
    CartEngine.add({
      id: name,
      name: name,
      img: img,
      price: finalPrice,
      size: size,
      reuseBottle: reuseBottle,
      bottlePrice: bottlePrice,
      bottlePriceDiscount: bottlePriceDiscount
    }, qty);
  }

  if (typeof $ !== 'undefined' && $('#product_modal').length) {
    $('#product_modal').modal('hide');
  }
};



