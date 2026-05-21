/**
 * I Rasa Perfumes — Global Cart & Wishlist Engine
 * Storage: localStorage (USER-SCOPED)
 *   irasa_cart_<userId>     → [ { id, name, img, price, qty, size } ]
 *   irasa_cart_guest        → cart for non-logged-in visitors
 *   irasa_wishlist_<userId> → [ { id, name, img, price } ]
 *   irasa_wishlist_guest    → wishlist for guests
 *
 *  IMPORTANT: Call CartEngine.setUser(userId) right after login
 *             and CartEngine.setUser(null) right after logout.
 */

const WISHLIST_KEY_PREFIX = 'irasa_wishlist_';
const CART_KEY_PREFIX     = 'irasa_cart_';
const WISHLIST_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:8080/api/profile/wishlist`
      : '/api/profile/wishlist';

/* ─────────────────────────────────────────
   CART ENGINE
───────────────────────────────────────── */
const CartEngine = {
  _userId: null,   // Set via setUser()

  /** Call this immediately after auth resolves */
  setUser(userId) {
    this._userId = userId || null;

    // Notify listeners that cart/wishlist may have changed
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: this._read() }));
    if (typeof WishlistEngine !== 'undefined') {
      document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: WishlistEngine.getItems() }));
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
    catch { return []; }
  },
  _write(items) {
    localStorage.setItem(this._cartKey(), JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  },

  getItems()  { return this._read(); },
  getCount()  { return this._read().reduce((s, i) => s + i.qty, 0); },
  getTotal()  { return this._read().reduce((s, i) => s + i.price * i.qty, 0); },

  /**
   * Add a product to cart.
   * @param {{ id, name, img, price, size? }} product
   * @param {number} qty
   */
  add(product, qty = 1) {
    const items = this._read();
    const key   = product.id + (product.size ? '_' + product.size : '');
    const idx   = items.findIndex(i => i._key === key);
    if (idx > -1) {
      items[idx].qty += qty;
    } else {
      items.push({ ...product, _key: key, qty });
    }
    this._write(items);
    CartEngine._showToast(`✓ "${product.name}" added to cart`);
  },

  remove(key) {
    this._write(this._read().filter(i => i._key !== key));
  },

  updateQty(key, qty) {
    if (qty < 1) return this.remove(key);
    const items = this._read().map(i => i._key === key ? { ...i, qty } : i);
    this._write(items);
  },

  clear() { this._write([]); },

  _showToast(msg) {
    let t = document.getElementById('_cart_toast');
    if (!t) {
      t = document.createElement('div');
      t.id = '_cart_toast';
      t.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
        background:#1a1200; border:1px solid #d4af37; color:#d4af37;
        padding:12px 24px; border-radius:30px; font-weight:600;
        font-size:13px; z-index:99999; box-shadow:0 4px 20px rgba(0,0,0,0.6);
        transition:opacity .3s; pointer-events:none;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2800);
  }
};

/* ─────────────────────────────────────────
   WISHLIST ENGINE
───────────────────────────────────────── */
const WishlistEngine = {
  _read() {
    try { return JSON.parse(localStorage.getItem(CartEngine._wishlistKey())) || []; }
    catch { return []; }
  },
  _write(items) {
    localStorage.setItem(CartEngine._wishlistKey(), JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: items }));
  },

  getItems()  { return this._read(); },
  getCount()  { return this._read().length; },
  has(id)     { return this._read().some(i => i.id === id); },

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
          data.data.forEach(item => {
            dbProductIds.add(item.productId);
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch DB wishlist during sync:', error);
    }

    const itemsToSync = guestItems.filter(item => !dbProductIds.has(item.id));
    let syncedCount = 0;
    let limitExceeded = false;

    for (const item of itemsToSync) {
      if (dbCount + syncedCount >= 50) {
        limitExceeded = true;
        break;
      }
      try {
        const res = await fetch(WISHLIST_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: item.id,
            name: item.name,
            img: item.img,
            price: item.price
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          syncedCount++;
        } else if (data.message && data.message.includes('limit')) {
          limitExceeded = true;
          break;
        }
      } catch (error) {
        console.error(`Failed to sync item ${item.name}:`, error);
      }
    }

    if (limitExceeded) {
      CartEngine._showToast(`✕ Cannot save in wishlist, more than our limit`);
    }
    localStorage.removeItem('irasa_wishlist_guest');
  },

  async add(product) {
    const items = this._read();
    if (items.length >= 50) {
      CartEngine._showToast(`✕ Cannot save in wishlist, more than our limit`);
      return;
    }

    // Optimistically update UI
    const exists = items.some(i => i.id === product.id);
    if (!exists) {
      items.push({
        id: product.id,
        name: product.name,
        img: product.img,
        price: product.price,
        inStock: true,
        removed: false
      });
      this._write(items);
    }
    CartEngine._showToast(`♥ "${product.name}" saved to wishlist`);

    if (CartEngine._userId) {
      try {
        const res = await fetch(WISHLIST_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            name: product.name,
            img: product.img,
            price: product.price
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          // Rollback local storage addition
          const rollbackItems = this._read().filter(i => i.id !== product.id);
          this._write(rollbackItems);
          if (data.message && data.message.includes('limit')) {
            CartEngine._showToast(`✕ Cannot save in wishlist, more than our limit`);
          } else {
            CartEngine._showToast(`✕ ${data.message || 'Failed to save to wishlist'}`);
          }
        } else {
          // Update the local item state (stock/removed edge cases) from DB response if available
          if (data.data) {
            const currentItems = this._read();
            const idx = currentItems.findIndex(i => i.id === product.id);
            if (idx > -1) {
              currentItems[idx] = {
                id: data.data.productId,
                name: data.data.name,
                img: data.data.img,
                price: data.data.price,
                inStock: data.data.inStock !== false,
                removed: data.data.removed === true
              };
              this._write(currentItems);
            }
          }
        }
      } catch (error) {
        console.error('Failed to add to database wishlist:', error);
        // Rollback
        const rollbackItems = this._read().filter(i => i.id !== product.id);
        this._write(rollbackItems);
        CartEngine._showToast(`✕ Network error saving to wishlist`);
      }
    }
  },

  async remove(id) {
    const items = this._read();
    const product = items.find(i => i.id === id);
    if (!product) return;

    const prodName = product.name;
    const updatedItems = items.filter(i => i.id !== id);
    this._write(updatedItems);
    CartEngine._showToast(`✕ "${prodName}" removed from wishlist`);

    if (CartEngine._userId) {
      try {
        const res = await fetch(`${WISHLIST_API_BASE}/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) {
          // Rollback local storage deletion
          const rollbackItems = this._read();
          if (!rollbackItems.some(i => i.id === id)) {
            rollbackItems.push(product);
            this._write(rollbackItems);
          }
          CartEngine._showToast(`✕ Failed to remove from wishlist`);
        }
      } catch (error) {
        console.error('Failed to remove from database wishlist:', error);
        // Rollback
        const rollbackItems = this._read();
        if (!rollbackItems.some(i => i.id === id)) {
          rollbackItems.push(product);
          this._write(rollbackItems);
        }
        CartEngine._showToast(`✕ Network error removing from wishlist`);
      }
    }
  },

  async toggle(product) {
    if (this.has(product.id)) {
      await this.remove(product.id);
    } else {
      await this.add(product);
    }
  }
};

/* ─────────────────────────────────────────
   NAV BADGE AUTO-UPDATE
───────────────────────────────────────── */
function _syncNavBadge() {
  const badge = document.querySelector('.nav-shop__circle');
  if (badge) badge.textContent = CartEngine.getCount();
}

document.addEventListener('cart:updated', _syncNavBadge);
document.addEventListener('DOMContentLoaded', _syncNavBadge);
