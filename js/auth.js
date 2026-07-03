/**
 * I Rasa Auth Module
 * Handles session-based auth state across all pages
 * API Base: http://localhost:8080
 */
const AUTH_API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? `http://${window.location.hostname}:8080/api/auth` 
      : '/api/auth';

const RasaAuth = {
  user: null,

  /** Check if user is logged in (call on every page load) */
  async checkSession() {
    if (localStorage.getItem('irasa_logged_in') !== 'true') {
      this._updateProfileIcon(false);
      return false;
    }
    try {
      const res = await fetch(`${AUTH_API}/me`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.user = data.data;
          localStorage.setItem('irasa_logged_in', 'true');
          this._updateProfileIcon(true);
          return true;
        }
      }
    } catch (e) {
      // silently fail — user is not logged in
    }
    localStorage.setItem('irasa_logged_in', 'false');
    this._updateProfileIcon(false);
    return false;
  },

  /** Login with email and password */
  async login(email, password) {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      this.user = data.data;
      localStorage.setItem('irasa_logged_in', 'true');
      this._updateProfileIcon(true);
      // Save basic info to sessionStorage for quick access
      sessionStorage.setItem('rasa_user', JSON.stringify(this.user));
      // Scope the cart to this specific user
      if (typeof CartEngine !== 'undefined') {
        CartEngine.setUser(this.user.id || this.user.email);
      }
    }
    return data;
  },

  /** Register new user */
  async register(payload) {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  /** Logout */
  async logout() {
    await fetch(`${AUTH_API}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    this.user = null;
    // Reset cart to guest scope before clearing session
    if (typeof CartEngine !== 'undefined') CartEngine.setUser(null);
    sessionStorage.removeItem('rasa_user');
    localStorage.setItem('irasa_logged_in', 'false');
    this._updateProfileIcon(false);
    window.location.href = '/login.html';
  },

  /** Get initials from full name (e.g., "Kunal Patil" → "KP") */
  _getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  },

  /** Update profile icon in navbar */
  _updateProfileIcon(loggedIn) {
    const icon    = document.getElementById('profileNavIcon');
    const img     = document.getElementById('profileNavImg');
    const link    = document.getElementById('profileNavLink');
    const wrapper = document.getElementById('profileNavWrapper');

    if (!link) return;

    // Remove any existing initials avatar
    const existingAvatar = link.querySelector('.irasa-initials-avatar');
    if (existingAvatar) existingAvatar.remove();

    if (loggedIn && this.user) {
      // 1. Hide default icon
      if (icon) icon.style.display = 'none';
      if (img)  img.style.display  = 'none';

      // 2. Show profile image if available, otherwise initials bubble
      const profilePic = this.user.profilePicture || this.user.profilePic;
      if (profilePic) {
        if (img) {
          img.src = profilePic;
          img.style.display = 'block';
          img.style.width   = '100%';
          img.style.height  = '100%';
          img.style.borderRadius = '50%';
          img.style.objectFit = 'cover';
        }
      } else {
        // Initials avatar bubble
        const initials = this._getInitials(this.user.fullName);
        const avatarEl = document.createElement('div');
        avatarEl.className = 'irasa-initials-avatar';
        avatarEl.textContent = initials;
        link.appendChild(avatarEl);
      }

      // 3. Gold ring on wrapper
      if (wrapper) wrapper.classList.add('is-logged-in');

      // 4. Update link tooltip and destination
      link.title = `Hello, ${this.user.fullName.split(' ')[0]}!`;
      link.href  = '/profile.html';

      // 5. Build enhanced profile dropdown
      this._buildProfileDropdown(link);

    } else {
      // Logged out state — show login icon
      if (icon) {
        icon.className = 'ti-user';
        icon.style.display = 'inline-block';
        icon.removeAttribute('style');
      }
      if (img) img.style.display = 'none';
      if (wrapper) wrapper.classList.remove('is-logged-in');
      link.title = 'Sign In';
      link.href  = '/login.html';

      // Remove profile dropdown if exists
      const existingDrop = document.getElementById('rasaProfileDropdown');
      if (existingDrop) existingDrop.remove();
    }
  },

  _buildProfileDropdown(parentLink) {
    // Prevent duplicates
    if (document.getElementById('rasaProfileDropdown')) return;

    const wrapper = parentLink.closest('li');
    if (!wrapper) return;
    wrapper.style.position = 'relative';

    const initials = this._getInitials(this.user.fullName);
    const profilePic = this.user.profilePicture || this.user.profilePic;
    const avatarHtml = profilePic
      ? `<img src="${profilePic}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid rgba(212,175,55,0.4);" alt="Avatar">`
      : `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a46a00,#ffc559);display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;font-weight:700;font-size:16px;color:#000;border:2px solid rgba(212,175,55,0.4);flex-shrink:0;">${initials}</div>`;

    const dropdown = document.createElement('div');
    dropdown.id = 'rasaProfileDropdown';
    dropdown.style.cssText = `
      position: absolute; top: calc(100% + 10px); right: 0;
      background: rgba(10,10,10,0.98);
      border: 1px solid rgba(212,175,55,0.2);
      border-radius: 14px;
      padding: 0;
      overflow: hidden;
      min-width: 230px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 0 1px rgba(212,175,55,0.05) inset;
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      display: none;
      z-index: 9999;
      animation: irasaFadeDown 0.22s ease;
    `;
    dropdown.innerHTML = `
      <style>
        @keyframes irasaFadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .irasa-drop-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 18px; color: #c2c2c2; text-decoration: none;
          font-size: 13.5px; font-family: 'Inter', sans-serif;
          font-weight: 400; transition: all 0.18s ease;
          border-left: 3px solid transparent;
        }
        .irasa-drop-link:hover {
          background: rgba(212,175,55,0.06);
          color: #ffc458;
          border-left-color: #ffc458;
        }
        .irasa-drop-link i { font-size: 15px; width: 18px; text-align: center; }
      </style>

      <!-- User info header -->
      <div style="display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(212,175,55,0.1);background:rgba(212,175,55,0.03);">
        ${avatarHtml}
        <div style="overflow:hidden;">
          <div style="font-family:'Inter',sans-serif;font-size:14px;font-weight:600;color:#ede4cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${this.user.fullName}</div>
          <div style="font-family:'Inter',sans-serif;font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${this.user.email}</div>
        </div>
      </div>

      <!-- Links -->
      <div style="padding: 6px 0;">
        <a href="/profile.html" class="irasa-drop-link">
          <i class="ti-user"></i> My Profile
        </a>
        <a href="/cart.html" class="irasa-drop-link">
          <i class="ti-shopping-cart"></i> My Cart
        </a>
        <div style="height:1px;background:rgba(212,175,55,0.08);margin:4px 0;"></div>
        <a href="#" id="rasaLogoutBtn" class="irasa-drop-link" style="color:#ff7b7b;">
          <i class="ti-power-off"></i> Sign Out
        </a>
      </div>
    `;

    wrapper.appendChild(dropdown);

    // Toggle on profile icon click
    parentLink.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Logout button
    dropdown.querySelector('#rasaLogoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      RasaAuth.logout();
    });
  }
};

// Auto-run on every page
document.addEventListener('DOMContentLoaded', () => {
  RasaAuth.checkSession();
});

