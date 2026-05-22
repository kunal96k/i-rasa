/**
 * I Rasa Auth Guard & Session Manager
 * Handles real-time authentication checks and UI updates across all pages.
 */

const AUTH_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? `http://${window.location.hostname}:8080/api/auth` 
      : '/api/auth';
const STORAGE_KEY_USER = 'rasa_user';

const AuthGuard = {
    currentUser: null,

    /**
     * Initializes the auth state and updates the UI.
     */
    async init() {
        const path = window.location.pathname;
        const page = path.split("/").pop();

        try {
            const res = await fetch(`${AUTH_API_BASE}/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.currentUser = data.data;
                    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.currentUser));
                    localStorage.setItem('irasa_logged_in', 'true');
                    if (typeof CartEngine !== 'undefined') {
                        await CartEngine.setUser(this.currentUser.id || this.currentUser.email);
                    }
                    if (typeof WishlistEngine !== 'undefined') {
                        await WishlistEngine.syncGuestWishlist();
                        await WishlistEngine.loadFromDatabase();
                    }
                    this.updateNav(true);
                } else {
                    localStorage.setItem('irasa_logged_in', 'false');
                    if (typeof CartEngine !== 'undefined') await CartEngine.setUser(null);
                    this.handleUnauthenticated(page);
                }
            } else {
                // 401 / 403 — not logged in
                localStorage.setItem('irasa_logged_in', 'false');
                if (typeof CartEngine !== 'undefined') await CartEngine.setUser(null);
                this.handleUnauthenticated(page);
            }
        } catch (error) {
            // Network error — fall back to sessionStorage cache
            const cached = sessionStorage.getItem(STORAGE_KEY_USER);
            if (cached) {
                this.currentUser = JSON.parse(cached);
                if (typeof CartEngine !== 'undefined') {
                    await CartEngine.setUser(this.currentUser.id || this.currentUser.email);
                }
                if (typeof WishlistEngine !== 'undefined') {
                    await WishlistEngine.syncGuestWishlist();
                    await WishlistEngine.loadFromDatabase();
                }
                this.updateNav(true);
            } else {
                localStorage.setItem('irasa_logged_in', 'false');
                if (typeof CartEngine !== 'undefined') await CartEngine.setUser(null);
                this.handleUnauthenticated(page);
            }
        }
    },

    /**
     * Handles redirection for protected pages.
     */
    handleUnauthenticated(page) {
        this.currentUser = null;
        sessionStorage.removeItem(STORAGE_KEY_USER);
        localStorage.setItem('irasa_logged_in', 'false');
        // Clear cart immediately so badge goes to 0 and no stale data shows
        if (typeof CartEngine !== 'undefined') {
            CartEngine._userId = null;
            document.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
        }
        this.updateNav(false);

        const protectedPages = ['profile.html', 'checkout.html', 'confirmation.html', 'cart.html'];
        if (protectedPages.includes(page)) {
            window.location.href = `login.html?redirect=${page}`;
        }
    },


    /**
     * Updates the Navigation Bar based on auth state.
     */
    updateNav(isAuthenticated) {
        const navImg = document.getElementById('profileNavImg');
        const navIcon = document.getElementById('profileNavIcon');
        const navLink = document.getElementById('profileNavLink');

        // Hide/Show restricted nav items in dropdowns
        const restrictedItems = document.querySelectorAll('a[href="checkout.html"], a[href="confirmation.html"]');
        restrictedItems.forEach(item => {
            // If it's in a dropdown (nav-item submenu), hide the parent li
            const parentLi = item.closest('li.nav-item');
            if (parentLi && !item.classList.contains('button-header')) {
                parentLi.style.display = isAuthenticated ? 'block' : 'none';
            }
        });

        if (!navLink) return;

        if (isAuthenticated && this.currentUser) {
            // User is logged in
            if (navImg && navIcon) {
                // Check if currentUser has the profile image from API
                if (this.currentUser.profileImageUrl) {
                    navImg.src = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:8080` : '') + this.currentUser.profileImageUrl;
                    navImg.style.display = 'block';
                    navIcon.style.display = 'none';
                } else {
                    // Try fallback to irasa_profile if not in session yet
                    const profileData = JSON.parse(localStorage.getItem('irasa_profile') || '{}');
                    if (profileData.img) {
                        navImg.src = profileData.img;
                        navImg.style.display = 'block';
                        navIcon.style.display = 'none';
                    } else {
                        navImg.style.display = 'none';
                        navIcon.style.display = 'block';
                        navIcon.className = 'ti-user';
                        navIcon.style.color = '#d4af37';
                    }
                }
            }
            navLink.href = 'profile.html';
        } else {
            // Guest mode
            if (navImg && navIcon) {
                navImg.style.display = 'none';
                navIcon.style.display = 'block';
                navIcon.className = 'ti-shift-right'; 
                navIcon.style.color = '#888';
            }
            navLink.href = 'login.html';
        }
    },

    /**
     * Helper to protect actions (like Buy Now)
     */
    async requireAuth(callback) {
        if (this.currentUser) {
            callback();
        } else {
            // Try one last check
            await this.init();
            if (this.currentUser) {
                callback();
            } else {
                window.location.href = 'login.html?redirect=' + window.location.pathname.split("/").pop();
            }
        }
    },

    /**
     * Logout utility
     */
    async logout() {
        try {
            await fetch(`${AUTH_API_BASE}/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
        // Reset cart to guest scope before clearing session
        if (typeof CartEngine !== 'undefined') {
            CartEngine._userId = null;
            document.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
        }
        sessionStorage.removeItem(STORAGE_KEY_USER);
        localStorage.setItem('irasa_logged_in', 'false');
        window.location.href = 'login.html?logout=true';
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => AuthGuard.init());
