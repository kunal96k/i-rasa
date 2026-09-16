/**
 * I Rasa Perfumes -- Global Cart & Wishlist Engine
 * Storage: localStorage (USER-SCOPED) + backend DB sync via /api/cart
 *   irasa_cart_<userId>     -> [ { id, name, img, price, qty, size, _key } ]
 *   irasa_cart_guest        -> cart for non-logged-in visitors (localStorage only)
 *   irasa_wishlist_<userId> -> [ { id, name, img, price } ]
 *   irasa_wishlist_guest    -> wishlist for guests
 *
 *  IMPORTANT: Call CartEngine.setUser(userId) right after login
 *             and CartEngine.setUser(null) right after logout.
 */

const WISHLIST_KEY_PREFIX = 'irasa_wishlist_';
const CART_KEY_PREFIX     = 'irasa_cart_';

const WISHLIST_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:8080/api/profile/wishlist`
      : '/api/profile/wishlist';

const CART_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:8080/api/cart`
      : '/api/cart';

/* -----------------------------------------
   CART ENGINE
----------------------------------------- */
const CartEngine = {
  _userId: null,

  /** Call this immediately after auth resolves */
  async setUser(userId) {
    var prevUserId = this._userId;
    this._userId = userId || null;

    if (this._userId) {
      // Clear any stale data from previous user before loading from DB
      if (prevUserId && prevUserId !== this._userId) {
        localStorage.removeItem(CART_KEY_PREFIX + prevUserId);
      }
      // DB is the ONLY source of truth — load and overwrite local
      // Spinner shown above — actual render happens via cart:updated event
      // which fires from CartEngine.setUser() → loadFromDatabase() after auth resolves.
      // Do NOT call renderCartDesktop() here; it would hide tfoot and show "empty" prematurely.
      await this.loadFromDatabase();
    } else {
      // Logged out — clear ALL user-scoped cart keys from localStorage
      // so stale data never shows as guest or next user's cart
      Object.keys(localStorage).forEach(function(k) {
        if (k.startsWith(CART_KEY_PREFIX) && k !== CART_KEY_PREFIX + 'guest') {
          localStorage.removeItem(k);
        }
      });
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
    }
  },

  _cartKey() {
    return CART_KEY_PREFIX + (this._userId || 'guest');
  },

  _wishlistKey() {
    return WISHLIST_KEY_PREFIX + (this._userId || 'guest');
  },

  _read() {
    try { return JSON.parse(localStorage.getItem(this._cartKey())) || []; }
    catch (e) { return []; }
  },

  _write(items) {
    localStorage.setItem(this._cartKey(), JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  },

  getItems()  { return this._read(); },
  getCount()  { return this._read().length; },
  getTotal()  { return this._read().reduce(function(s, i) { return s + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 1); }, 0); },

  /**
   * Load cart items from DB -- DB is the ABSOLUTE source of truth.
   * Always overwrites localStorage with DB data. Never merges stale local data back.
   */
  async loadFromDatabase() {
    if (!this._userId) return;
    try {
      var res = await fetch(CART_API_BASE, { credentials: 'include' });
      if (res.ok) {
        var data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          var items = data.data.map(function(item) {
            return {
              _key:                item._key || item.cartKey || (String(item.productId || item.id) + (item.size ? '_' + item.size : '')),
              id:                  String(item.productId || item.id || ''),
              name:                item.name || 'Unknown Product',
              img:                 item.img || 'img/product/product1.png',
              price:               parseFloat(item.price) || 0,
              qty:                 parseInt(item.qty) || 1,
              size:                item.size || '',
              bottlePrice:         parseFloat(item.bottlePrice) || 0,
              bottlePriceDiscount: parseFloat(item.bottlePriceDiscount) || 0,
              reuseBottle:         !!item.reuseBottle
            };
          });

          // DB data overwrites local completely — no merge of stale local data
          // This prevents old localStorage items from re-appearing after logout/session clear
          this._write(items);
          return;
        }
      } else {
        // 401/403 — not authenticated, clear local user data
        Object.keys(localStorage).forEach(function(k) {
          if (k.startsWith(CART_KEY_PREFIX) && k !== CART_KEY_PREFIX + 'guest') {
            localStorage.removeItem(k);
          }
        });
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
        return;
      }
    } catch (err) {
      console.warn('CartEngine: Could not load from DB', err);
    }
    // Network error fallback — fire update with empty (don't trust stale local data)
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
  },

  /**
   * Add a product to cart.
   * @param {{ id, name, img, price, size? }} product
   * @param {number} qty
   */
  add(product, qty) {
    if (!this._userId) {
      this._showToast('First login to your account');
      setTimeout(function() {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }
    if (qty === undefined) qty = 1;
    var items = this._read();
    var currentTotalQty = items.reduce(function(s, i) { return s + (parseInt(i.qty) || 1); }, 0);
    if (currentTotalQty + qty > 15) {
      CartEngine._showToast('⚠️ Cannot add item. Cart limit is 15 products maximum.');
      return;
    }
    var key   = String(product.id) + (product.size ? '_' + product.size : '');
    var idx   = -1;
    for (var k = 0; k < items.length; k++) {
      if (items[k]._key === key) { idx = k; break; }
    }
    if (idx > -1) {
      items[idx].qty += qty;
      this._write(items);
      if (this._userId) {
        this._updateQtyInDb(key, items[idx].qty).catch(function() {});
      }
    } else {
      var newItem = {
        _key: key,
        id:   String(product.id),
        name: product.name,
        img:  product.img,
        price: product.price,
        qty:  qty,
        size: product.size || ''
      };
      // Copy optional fields
      if (product.bottlePrice)         newItem.bottlePrice         = product.bottlePrice;
      if (product.bottlePriceDiscount) newItem.bottlePriceDiscount = product.bottlePriceDiscount;
      if (product.reuseBottle)         newItem.reuseBottle         = product.reuseBottle;

      items.push(newItem);
      this._write(items);
      if (this._userId) {
        this._pushToDb(newItem).catch(function() {});
      }
    }
    CartEngine._showToast('\u2713 "' + product.name + '" added to cart');
  },

  remove(key) {
    this._write(this._read().filter(function(i) { return i._key !== key; }));
    if (this._userId) {
      fetch(CART_API_BASE + '/' + encodeURIComponent(key), {
        method: 'DELETE', credentials: 'include'
      }).catch(function() {});
    }
  },

  updateQty(key, qty) {
    if (qty < 1) return this.remove(key);
    var items = this._read();
    var item = items.find(function(i) { return i._key === key; });
    if (!item) return;
    var currentTotalQty = items.reduce(function(s, i) { return s + (parseInt(i.qty) || 1); }, 0);
    var projectedTotal = currentTotalQty - (parseInt(item.qty) || 1) + qty;
    if (projectedTotal > 15) {
      CartEngine._showToast('⚠️ Cannot update quantity. Cart limit is 15 products maximum.');
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
      return;
    }
    var updatedItems = items.map(function(i) {
      return i._key === key ? Object.assign({}, i, { qty: qty }) : i;
    });
    this._write(updatedItems);
    if (this._userId) {
      this._updateQtyInDb(key, qty).catch(function() {});
    }
  },

  clear() {
    this._write([]);
    if (this._userId) {
      return fetch(CART_API_BASE, { method: 'DELETE', credentials: 'include' }).catch(function() {});
    }
    return Promise.resolve();
  },

  async _pushToDb(item) {
    return fetch(CART_API_BASE, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  async _updateQtyInDb(cartKey, qty) {
    return fetch(CART_API_BASE + '/' + encodeURIComponent(cartKey), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: qty })
    });
  },

  _showToast(msg, type) {
    // Determine type from message content if not provided
    if (!type) {
      if (/✓|✔|added|saved|success|downloaded|copied/i.test(msg)) type = 'success';
      else if (/✕|✗|×|error|fail|cannot|invalid|network/i.test(msg)) type = 'error';
      else if (/⚠|warn|limit/i.test(msg)) type = 'warning';
      else if (/♥|❤|wishlist/i.test(msg)) type = 'wishlist';
      else type = 'info';
    }

    // Inject styles once
    if (!document.getElementById('_irasa_toast_styles')) {
      var style = document.createElement('style');
      style.id = '_irasa_toast_styles';
      style.textContent = `
        #_irasa_toast_container {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 9999999;
          display: flex; flex-direction: column; gap: 10px; align-items: center;
          pointer-events: none; width: auto; max-width: 92vw;
        }
        ._irasa_toast {
          display: flex; align-items: center; gap: 12px;
          min-width: 280px; max-width: 480px;
          padding: 10px 16px 10px 14px;
          border-radius: 50px;
          background: rgba(18, 18, 18, 0.94);
          color: #f3f4f6;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          font-size: 13.5px; font-weight: 500;
          box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
          opacity: 0; transform: translateY(-24px) scale(0.92);
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: auto; cursor: pointer; user-select: none;
        }
        ._irasa_toast.show { opacity: 1; transform: translateY(0) scale(1); }
        ._irasa_toast.hide { opacity: 0; transform: translateY(-20px) scale(0.94); transition: opacity 0.28s ease, transform 0.28s ease; }
        ._irasa_toast--success { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(16, 185, 129, 0.15); }
        ._irasa_toast--error   { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(239, 68, 68, 0.15); }
        ._irasa_toast--warning { border-color: rgba(245, 158, 11, 0.4); box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.15); }
        ._irasa_toast--wishlist{ border-color: rgba(236, 72, 153, 0.4); box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(236, 72, 153, 0.15); }
        ._irasa_toast--info    { border-color: rgba(212, 175, 55, 0.4); box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(212, 175, 55, 0.15); }
        ._irasa_toast__icon {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        ._irasa_toast--success ._irasa_toast__icon { background: rgba(16, 185, 129, 0.16); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        ._irasa_toast--error ._irasa_toast__icon   { background: rgba(239, 68, 68, 0.16); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        ._irasa_toast--warning ._irasa_toast__icon { background: rgba(245, 158, 11, 0.16); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        ._irasa_toast--wishlist ._irasa_toast__icon{ background: rgba(236, 72, 153, 0.16); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
        ._irasa_toast--info ._irasa_toast__icon    { background: rgba(212, 175, 55, 0.16); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); }
        ._irasa_toast__msg { flex: 1; line-height: 1.4; font-size: 13.5px; color: #f9fafb; }
        ._irasa_toast__close {
          background: transparent; border: none; color: #888; font-size: 18px;
          line-height: 1; padding: 0 4px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s, color 0.2s; flex-shrink: 0;
        }
        ._irasa_toast__close:hover { opacity: 1; color: #fff; }
        @media (max-width: 600px) {
          #_irasa_toast_container { top: 14px; width: calc(100% - 24px); max-width: 440px; }
          ._irasa_toast { min-width: 0 !important; width: 100% !important; padding: 9px 14px 9px 12px !important; font-size: 12.5px !important; border-radius: 40px !important; }
          ._irasa_toast__icon { width: 28px !important; height: 28px !important; font-size: 12px !important; }
        }
      `;
      document.head.appendChild(style);
    }

    // Container
    var container = document.getElementById('_irasa_toast_container');
    if (!container) {
      container = document.createElement('div');
      container.id = '_irasa_toast_container';
      document.body.appendChild(container);
    }

    // Icon map
    var icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error:   '<i class="fas fa-times-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      wishlist:'<i class="fas fa-heart"></i>',
      info:    '<i class="fas fa-shopping-bag"></i>'
    };

    // Clean the message of leading emoji/icons
    var cleanMsg = msg.replace(/^[✓✔✕✗×⚠️❌✅♥❤💵👁📥⏳]+\s*/u, '').trim();

    var toast = document.createElement('div');
    toast.className = '_irasa_toast _irasa_toast--' + type;
    toast.innerHTML = '<div class="_irasa_toast__icon">' + (icons[type] || icons.info) + '</div>'
      + '<span class="_irasa_toast__msg">' + cleanMsg + '</span>'
      + '<button class="_irasa_toast__close" aria-label="Close">&times;</button>';

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('show'); });
    });

    var dismissed = false;
    var dismiss = function() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    };

    // Dismiss after 3.2s
    var timer = setTimeout(dismiss, 3200);

    // Click to dismiss early
    toast.addEventListener('click', function() {
      clearTimeout(timer);
      dismiss();
    });
  }
};

/* -----------------------------------------
   WISHLIST ENGINE
----------------------------------------- */
const WishlistEngine = {
  _read() {
    try { return JSON.parse(localStorage.getItem(CartEngine._wishlistKey())) || []; }
    catch (e) { return []; }
  },
  _write(items) {
    localStorage.setItem(CartEngine._wishlistKey(), JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: items }));
  },

  getItems()  { return this._read(); },
  getCount()  { return this._read().length; },
  has(id)     { return this._read().some(function(i) { return i.id === id; }); },

  async loadFromDatabase() {
    if (!CartEngine._userId) return;
    try {
      const res = await fetch(WISHLIST_API_BASE, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const items = data.data.map(item => ({
            id: item.productId,
            name: item.name,
            img: item.img,
            price: item.price,
            inStock: item.inStock !== false,
            removed: item.removed === true
          }));
          this._write(items);
        }
      }
    } catch (error) {
      console.error('Failed to load wishlist from database:', error);
    }
  },

  async syncGuestWishlist() {
    if (!CartEngine._userId) return;
    let guestItems = [];
    try {
      guestItems = JSON.parse(localStorage.getItem('irasa_wishlist_guest')) || [];
    } catch (e) {
      guestItems = [];
    }
    if (guestItems.length === 0) return;

    let dbProductIds = new Set();
    let dbCount = 0;
    try {
      const res = await fetch(WISHLIST_API_BASE, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          dbCount = data.data.length;
          data.data.forEach(item => { dbProductIds.add(item.productId); });
        }
      }
    } catch (error) {
      console.error('Failed to fetch DB wishlist during sync:', error);
    }

    const itemsToSync = guestItems.filter(item => !dbProductIds.has(item.id));
    let syncedCount = 0;
    let limitExceeded = false;

    for (const item of itemsToSync) {
      if (dbCount + syncedCount >= 50) { limitExceeded = true; break; }
      try {
        const res = await fetch(WISHLIST_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: item.id, name: item.name, img: item.img, price: item.price })
        });
        const data = await res.json();
        if (res.ok && data.success) { syncedCount++; }
        else if (data.message && data.message.includes('limit')) { limitExceeded = true; break; }
      } catch (error) {
        console.error('Failed to sync item ' + item.name + ':', error);
      }
    }

    if (limitExceeded) CartEngine._showToast('\u2715 Cannot save in wishlist, more than our limit');
    localStorage.removeItem('irasa_wishlist_guest');
  },

  async add(product) {
    if (!CartEngine._userId) {
      CartEngine._showToast('First login to your account');
      setTimeout(function() {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }
    const items = this._read();
    if (items.length >= 50) {
      CartEngine._showToast('\u2715 Cannot save in wishlist, more than our limit');
      return;
    }
    const exists = items.some(i => i.id === product.id);
    if (!exists) {
      items.push({ id: product.id, name: product.name, img: product.img, price: product.price, inStock: true, removed: false });
      this._write(items);
    }
    CartEngine._showToast('\u2665 "' + product.name + '" saved to wishlist');

    if (CartEngine._userId) {
      try {
        const res = await fetch(WISHLIST_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id, name: product.name, img: product.img, price: product.price })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const rollbackItems = this._read().filter(i => i.id !== product.id);
          this._write(rollbackItems);
          if (data.message && data.message.includes('limit')) {
            CartEngine._showToast('\u2715 Cannot save in wishlist, more than our limit');
          } else {
            CartEngine._showToast('\u2715 ' + (data.message || 'Failed to save to wishlist'));
          }
        } else if (data.data) {
          const currentItems = this._read();
          const idx = currentItems.findIndex(i => i.id === product.id);
          if (idx > -1) {
            currentItems[idx] = { id: data.data.productId, name: data.data.name, img: data.data.img, price: data.data.price, inStock: data.data.inStock !== false, removed: data.data.removed === true };
            this._write(currentItems);
          }
        }
      } catch (error) {
        console.error('Failed to add to database wishlist:', error);
        const rollbackItems = this._read().filter(i => i.id !== product.id);
        this._write(rollbackItems);
        CartEngine._showToast('\u2715 Network error saving to wishlist');
      }
    }
  },

  async remove(id) {
    const items = this._read();
    const product = items.find(i => i.id === id);
    if (!product) return;
    const prodName = product.name;
    this._write(items.filter(i => i.id !== id));
    CartEngine._showToast('\u2715 "' + prodName + '" removed from wishlist');

    if (CartEngine._userId) {
      try {
        const res = await fetch(WISHLIST_API_BASE + '/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'include' });
        if (!res.ok) {
          const rollbackItems = this._read();
          if (!rollbackItems.some(i => i.id === id)) { rollbackItems.push(product); this._write(rollbackItems); }
          CartEngine._showToast('\u2715 Failed to remove from wishlist');
        }
      } catch (error) {
        console.error('Failed to remove from database wishlist:', error);
        const rollbackItems = this._read();
        if (!rollbackItems.some(i => i.id === id)) { rollbackItems.push(product); this._write(rollbackItems); }
        CartEngine._showToast('\u2715 Network error removing from wishlist');
      }
    }
  },

  async toggle(product) {
    if (!CartEngine._userId) {
      CartEngine._showToast('First login to your account');
      setTimeout(function() {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }
    if (this.has(product.id)) { await this.remove(product.id); }
    else { await this.add(product); }
  }
};

/* -----------------------------------------
   NAV BADGE AUTO-UPDATE
   - Hides badge when count is 0
   - Cart icon goes to shop page when cart empty
----------------------------------------- */
function _syncNavBadge() {
  var count = CartEngine.getCount();
  var badge = document.querySelector('.nav-shop__circle');

  // Find the cart anchor by scanning nav-shop for the shopping-cart icon
  var cartAnchor = null;
  var navItems = document.querySelectorAll('.nav-shop li a, ul.nav-shop a');
  for (var i = 0; i < navItems.length; i++) {
    var a = navItems[i];
    if (a.querySelector('.ti-shopping-cart') ||
        (a.href && a.href.indexOf('cart.html') > -1) ||
        (a.href && a.href.indexOf('category.html') > -1 && a.querySelector('.ti-shopping-cart'))) {
      cartAnchor = a;
      break;
    }
  }

  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  if (cartAnchor) {
    cartAnchor.href = count > 0 ? 'cart.html' : 'category.html';
  }
}

document.addEventListener('cart:updated', _syncNavBadge);
document.addEventListener('DOMContentLoaded', _syncNavBadge);
