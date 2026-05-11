/**
 * I Rasa Auth Guard & Session Manager
 * Handles real-time authentication checks and UI updates across all pages.
 */

const AUTH_API_BASE = 'http://localhost:8080/api/auth';
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
                    this.updateNav(true);
                } else {
                    this.handleUnauthenticated(page);
                }
            } else {
                this.handleUnauthenticated(page);
            }
        } catch (error) {
            console.error('Auth Check Failed:', error);
            // Fallback to session storage if API is down (optional)
            const cached = sessionStorage.getItem(STORAGE_KEY_USER);
            if (cached) {
                this.currentUser = JSON.parse(cached);
                this.updateNav(true);
            } else {
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
        sessionStorage.removeItem(STORAGE_KEY_USER);
        window.location.href = 'index.html';
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => AuthGuard.init());
