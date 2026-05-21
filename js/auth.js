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

  /** Update profile icon in navbar */
  _updateProfileIcon(loggedIn) {
    const icon = document.getElementById('profileNavIcon');
    const img  = document.getElementById('profileNavImg');
    const link = document.getElementById('profileNavLink');

    if (!link) return;

    if (loggedIn && this.user) {
      // Show profile avatar with initials
      if (icon) icon.style.display = 'none';
      if (img) {
        // Use initials avatar via DiceBear or just show icon change
        img.style.display = 'none';
      }
      // Change icon to person-check (filled user)
      if (icon) {
        icon.className = 'ti-user';
        icon.style.display = 'inline-block';
        icon.style.color = '#d4af37';
      }
      // Add gold ring + tooltip
      link.style.background = 'rgba(212,175,55,0.15)';
      link.title = `Logged in as ${this.user.fullName}`;
      link.href = '/profile.html';

      // Show name badge if it exists
      const badge = document.getElementById('profileNavBadge');
      if (badge) {
        badge.textContent = this.user.fullName.split(' ')[0];
        badge.style.display = 'inline-block';
      }

      // Add logout to dropdown if exists
      this._buildProfileDropdown(link);
    } else {
      if (icon) {
        icon.className = 'ti-user';
        icon.style.display = 'inline-block';
        icon.style.color = '#d4af37';
      }
      if (img) img.style.display = 'none';
      link.style.background = 'transparent';
      link.title = 'Login';
      link.href = '/login.html';
    }
  },

  _buildProfileDropdown(parentLink) {
    // Prevent duplicates
    if (document.getElementById('rasaProfileDropdown')) return;

    const wrapper = parentLink.closest('li');
    if (!wrapper) return;
    wrapper.style.position = 'relative';

    const dropdown = document.createElement('div');
    dropdown.id = 'rasaProfileDropdown';
    dropdown.style.cssText = `
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #1a1a1a; border: 1px solid #2a2a2a;
      border-radius: 12px; padding: 10px 0; min-width: 180px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      display: none; z-index: 9999; animation: fadeInDown 0.2s ease;
    `;
    dropdown.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid #2a2a2a;">
        <div style="font-size:13px;font-weight:600;color:#e8dfc8;">${this.user.fullName}</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">${this.user.email}</div>
      </div>
      <a href="/profile.html" style="display:block;padding:10px 16px;color:#ccc;text-decoration:none;font-size:13px;transition:0.2s;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='#ccc'">
        <i class="ti-user" style="margin-right:8px;"></i>My Profile
      </a>
      <a href="#" id="rasaLogoutBtn" style="display:block;padding:10px 16px;color:#ccc;text-decoration:none;font-size:13px;transition:0.2s;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='#ccc'">
        <i class="ti-power-off" style="margin-right:8px;"></i>Logout
      </a>
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
