/**
 * I Rasa Auth Guard & Session Manager
 * Handles real-time authentication checks and UI updates across all pages.
 */

const AUTH_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:8080/api/auth`
    : '/api/auth';
const PROFILE_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:8080/api/profile`
    : '/api/profile';
const STORAGE_KEY_USER = 'rasa_user';

const AuthGuard = {
    currentUser: null,

    /**
     * Initializes the auth state and updates the UI.
     */
    async init() {
        // Handle backend-driven access denied redirects
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('accessDenied') === 'true') {
            if (typeof showAlert === 'function') {
                showAlert('error', 'Access Denied: You do not have permission to access that module.');
            } else {
                alert('Access Denied: You do not have permission to access that module.');
            }
            // clean up the URL search parameter without reloading
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }

        const path = window.location.pathname;
        const page = path.split("/").pop() || "index.html";
        const isAdminPage = page.startsWith('admin') || page === 'admin.html';

        try {
            const res = await fetch(`${AUTH_API_BASE}/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.currentUser = data.data;
                    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.currentUser));
                    localStorage.setItem('irasa_logged_in', 'true');

                    // Enforce role authorization for admin pages
                    if (isAdminPage) {
                        const role = this.currentUser.role;
                        if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'EMPLOYEE') {
                            alert('Access Denied: Admin privileges required.');
                            window.location.href = 'index.html';
                            return;
                        }

                        // Prevent non-superadmins/admins from accessing employee management, subscribers, reports, and coupons
                        const restrictedPages = [
                            'admin-employees',
                            'admin-subscribers',
                            'admin-reports',
                            'admin-coupons'
                        ];
                        const isRestricted = restrictedPages.some(p => page.startsWith(p));
                        if (isRestricted && role !== 'ADMIN' && role !== 'SUPERADMIN') {
                            alert('Access Denied: Admin or Superadmin role required.');
                            window.location.href = 'admin.html';
                            return;
                        }
                    }

                    if (typeof CartEngine !== 'undefined') {
                        await CartEngine.setUser(this.currentUser.id || this.currentUser.email);
                    }
                    if (typeof WishlistEngine !== 'undefined') {
                        await WishlistEngine.syncGuestWishlist();
                        await WishlistEngine.loadFromDatabase();
                    }
                    this.updateNav(true);
                    this.updateAdminHeader();
                } else {
                    localStorage.setItem('irasa_logged_in', 'false');
                    if (typeof CartEngine !== 'undefined') await CartEngine.setUser(null);
                    this.handleUnauthenticated(page);
                }
            } else {
                localStorage.setItem('irasa_logged_in', 'false');
                if (typeof CartEngine !== 'undefined') await CartEngine.setUser(null);
                this.handleUnauthenticated(page);
            }
        } catch (error) {
            // Network error — fall back to sessionStorage cache
            const cached = sessionStorage.getItem(STORAGE_KEY_USER);
            if (cached) {
                this.currentUser = JSON.parse(cached);

                // Offline role verification
                if (isAdminPage) {
                    const role = this.currentUser.role;
                    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'EMPLOYEE') {
                        alert('Access Denied: Admin privileges required.');
                        window.location.href = 'index.html';
                        return;
                    }
                    const restrictedPages = [
                        'admin-employees',
                        'admin-subscribers',
                        'admin-reports',
                        'admin-coupons'
                    ];
                    const isRestricted = restrictedPages.some(p => page.startsWith(p));
                    if (isRestricted && role !== 'ADMIN' && role !== 'SUPERADMIN') {
                        alert('Access Denied: Admin or Superadmin role required.');
                        window.location.href = 'admin.html';
                        return;
                    }
                }

                if (typeof CartEngine !== 'undefined') {
                    await CartEngine.setUser(this.currentUser.id || this.currentUser.email);
                }
                if (typeof WishlistEngine !== 'undefined') {
                    await WishlistEngine.syncGuestWishlist();
                    await WishlistEngine.loadFromDatabase();
                }
                this.updateNav(true);
                this.updateAdminHeader();
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

        const isAdminPage = page.startsWith('admin') || page === 'admin.html';
        const protectedPages = ['profile.html', 'checkout.html'];
        if (isAdminPage || protectedPages.includes(page)) {
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
     * Updates Admin Header and sidebar logout action with luxury profile dropdown.
     */
    updateAdminHeader() {
        if (!this.currentUser) return;
        this.injectDropdownStyles();

        // Populate Admin Header user info
        const adminUserInfo = document.querySelector('.admin-user-info');
        if (adminUserInfo) {
            const firstLetter = this.currentUser.fullName ? this.currentUser.fullName.charAt(0).toUpperCase() : 'A';

            adminUserInfo.innerHTML = `
                <div class="admin-profile-container" id="adminProfileTrigger">
                    <div class="admin-profile-details d-none d-md-block">
                        <div class="admin-profile-name">${this.currentUser.fullName}</div>
                        <div class="admin-profile-role">${this.currentUser.role}</div>
                    </div>
                    <div class="admin-profile-avatar">
                        ${this.currentUser.profileImageUrl ?
                    `<img src="${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:8080` : '') + this.currentUser.profileImageUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` :
                    `<span>${firstLetter}</span>`
                }
                    </div>
                    <i class="ti-angle-down" style="font-size: 0.8rem; color: #888; margin-left: 2px;"></i>
                    
                    <!-- Dropdown Menu -->
                    <div class="admin-profile-dropdown" id="adminProfileDropdown">
                        <div class="dropdown-header-info">
                            <div class="dropdown-header-name">${this.currentUser.fullName}</div>
                            <div class="dropdown-header-email">${this.currentUser.email}</div>
                            <div class="dropdown-header-role-badge">${this.currentUser.role}</div>
                        </div>
                        <div class="dropdown-links-list">
                            <a href="#" class="dropdown-link-item" id="adminViewProfileLink">
                                <i class="ti-user"></i>
                                <span>View / Edit Profile</span>
                            </a>
                            <a href="#" class="dropdown-link-item" id="adminResetPasswordLink">
                                <i class="ti-key"></i>
                                <span>Change Password</span>
                            </a>
                            <a href="#" class="dropdown-link-item" id="adminHelpLink">
                                <i class="ti-help-alt"></i>
                                <span>Help Support</span>
                            </a>
                        </div>
                        <div class="dropdown-footer">
                            <a href="#" class="dropdown-link-item" id="adminLogoutLink" style="color: #ff4d4d;">
                                <i class="ti-power-off" style="color: #ff4d4d;"></i>
                                <span style="font-weight: 600;">Logout</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Toggle Dropdown when clicking trigger
            const trigger = document.getElementById('adminProfileTrigger');
            const dropdown = document.getElementById('adminProfileDropdown');

            if (trigger && dropdown) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });

                // Hide dropdown when clicking elsewhere
                document.addEventListener('click', (e) => {
                    if (!trigger.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });
            }

            // Bind links
            const viewProfileLink = document.getElementById('adminViewProfileLink');
            if (viewProfileLink) {
                viewProfileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    this.showAdminProfileModal();
                });
            }

            const changePasswordLink = document.getElementById('adminResetPasswordLink');
            if (changePasswordLink) {
                changePasswordLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    this.showChangePasswordModal();
                });
            }

            const helpLink = document.getElementById('adminHelpLink');
            if (helpLink) {
                helpLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.remove('show');
                    this.showHelpModal();
                });
            }

            const logoutLink = document.getElementById('adminLogoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (await showConfirm('Are you sure you want to log out?', 'Confirm Logout')) {
                        this.logout();
                    }
                });
            }
        }

        const sidebarLogoutBtn = document.querySelector('.admin-sidebar button');
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.removeAttribute('onclick');
            // Remove previous listeners if any, then add
            const newBtn = sidebarLogoutBtn.cloneNode(true);
            sidebarLogoutBtn.parentNode.replaceChild(newBtn, sidebarLogoutBtn);
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (await showConfirm('Are you sure you want to log out?', 'Confirm Logout')) {
                    this.logout();
                }
            });
        }

        // Hide restricted sidebar links for EMPLOYEE role
        if (this.currentUser.role === 'EMPLOYEE') {
            const restrictedLinks = [
                'admin-employees.html',
                'admin-subscribers.html',
                'admin-reports.html',
                'admin-coupons.html'
            ];
            restrictedLinks.forEach(link => {
                const el = document.querySelector(`.admin-sidebar a[href="${link}"]`);
                if (el) {
                    el.style.display = 'none';
                }
            });
            // Also hide the "Management" and "Analytics" section headers if all their items are hidden
            const labels = document.querySelectorAll('.nav-section-label');
            labels.forEach(label => {
                if (label.textContent.trim() === 'Management' || label.textContent.trim() === 'Analytics') {
                    label.style.display = 'none';
                }
            });
        }
        this.updateSidebarBadges();
    },

    async updateSidebarBadges() {
        const hasPendingOrdersBadge = document.getElementById('sidebarPendingOrders');
        const hasPendingPayBadge = document.getElementById('sidebarPendingPay');
        const hasTicketsBadge = document.getElementById('sidebarTickets');

        if (!hasPendingOrdersBadge && !hasPendingPayBadge && !hasTicketsBadge) return;

        try {
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:8080/api/admin` : '/api/admin';

            // 1. Pending tickets & other overview items
            const overviewRes = await fetch(`${apiBase}/dashboard/overview`, { credentials: 'include' });
            if (overviewRes.ok) {
                const overviewData = await overviewRes.json();
                if (overviewData.success && overviewData.data) {
                    const pt = Number(overviewData.data.pendingTickets || 0);
                    if (hasTicketsBadge) {
                        hasTicketsBadge.textContent = pt;
                        hasTicketsBadge.style.display = pt > 0 ? '' : 'none';
                    }
                }
            }

            // 2. Pending orders
            if (hasPendingOrdersBadge) {
                const orderRes = await fetch(`${apiBase}/orders?page=0&size=1&status=PENDING`, { credentials: 'include' });
                if (orderRes.ok) {
                    const orderData = await orderRes.json();
                    if (orderData.success && orderData.data) {
                        const count = orderData.data.totalItems || 0;
                        hasPendingOrdersBadge.textContent = count;
                        hasPendingOrdersBadge.style.display = count > 0 ? '' : 'none';
                    }
                }
            }

            // 3. Pending payments
            if (hasPendingPayBadge) {
                const payRes = await fetch(`${apiBase}/payments?page=0&size=1&status=PENDING`, { credentials: 'include' });
                if (payRes.ok) {
                    const payData = await payRes.json();
                    if (payData.success && payData.data) {
                        const count = payData.data.totalItems || 0;
                        hasPendingPayBadge.textContent = count;
                        hasPendingPayBadge.style.display = count > 0 ? '' : 'none';
                    }
                }
            }
        } catch (e) {
            console.error('Failed to update sidebar badges:', e);
        }
    },

    async showAdminProfileModal() {
        this.ensureAdminProfileModal();

        let fullProfile = null;
        try {
            const res = await fetch(`${PROFILE_API_BASE}/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    fullProfile = data.data;
                }
            }
        } catch (e) {
            console.warn("Could not fetch full profile details.");
        }

        // Populate current data
        if (this.currentUser) {
            let fName = this.currentUser.fullName || '';
            let lName = '';
            const spaceIdx = fName.indexOf(' ');
            if (spaceIdx > 0) {
                lName = fName.substring(spaceIdx + 1);
                fName = fName.substring(0, spaceIdx);
            }
            document.getElementById('adminProfileFirstName').value = fName;
            document.getElementById('adminProfileLastName').value = lName;
            document.getElementById('adminProfileEmail').value = this.currentUser.email || '';
            document.getElementById('adminProfilePhone').value = this.currentUser.phone || '';
            
            const roleEl = document.getElementById('adminProfileRoleTxt');
            if (roleEl) {
                roleEl.innerText = this.currentUser.role || '-';
            }
        }

        if (fullProfile) {
            document.getElementById('adminProfileBirthDate').value = fullProfile.birthDate || '';
            if (fullProfile.employeeDetails) {
                const emp = fullProfile.employeeDetails;
                document.getElementById('adminProfileEmpIdTxt').innerText = emp.employeeId || '-';
                document.getElementById('adminProfileDeptTxt').innerText = emp.department || '-';
                document.getElementById('adminProfileDesgTxt').innerText = emp.designation || '-';
                document.getElementById('adminProfileDojTxt').innerText = emp.dateOfJoining || '-';
            }
        } else {
            document.getElementById('adminProfileBirthDate').value = '';
        }

        $('#adminProfileModal').modal('show');
    },

    ensureAdminProfileModal() {
        if (document.getElementById('adminProfileModal')) return;

        const modalHtml = `
        <div class="modal fade" id="adminProfileModal" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 1060;">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content" style="background:#0a0a0a; border:2px solid #d4af37; color:#fff; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div class="modal-header" style="border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
                <h5 class="modal-title" style="color: #d4af37; font-family: 'Cinzel', serif; margin: 0;">Admin Profile</h5>
                <button type="button" class="close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close" style="color:#fff; background:transparent; border:none; font-size:1.5rem; cursor: pointer; padding: 0; margin-right: 15px; line-height: 1;">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body" style="padding:25px;">
                <form id="adminProfileForm">
                  <div class="row">
                      <div class="col-md-6 mb-3">
                        <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">First Name *</label>
                        <input type="text" id="adminProfileFirstName" required style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                      </div>
                      <div class="col-md-6 mb-3">
                        <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Last Name</label>
                        <input type="text" id="adminProfileLastName" style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                      </div>
                  </div>
                  <div class="row">
                      <div class="col-md-6 mb-3">
                        <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Email Address (Read Only)</label>
                        <input type="email" id="adminProfileEmail" readonly style="background: #111; border: 1px solid #222; color: #888; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px; cursor: not-allowed;">
                      </div>
                      <div class="col-md-6 mb-3">
                        <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Phone Number *</label>
                        <input type="text" id="adminProfilePhone" required style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                      </div>
                  </div>
                  <div class="form-group mb-4">
                    <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Date of Birth</label>
                    <input type="date" id="adminProfileBirthDate" style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                  </div>
                  <div class="form-group mb-4" style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px;">
                      <label style="font-size:12px; color:#d4af37; margin-bottom:10px; display:block; text-transform:uppercase; letter-spacing:1px;">Professional Details (Read Only)</label>
                      <div class="row">
                          <div class="col-md-6 mb-2">
                              <label style="font-size:11px; color:#888; margin-bottom: 2px; display:block;">Role</label>
                              <div id="adminProfileRoleTxt" style="font-size:13px; color:#fff;"></div>
                          </div>
                          <div class="col-md-6 mb-2">
                              <label style="font-size:11px; color:#888; margin-bottom: 2px; display:block;">Employee ID</label>
                              <div id="adminProfileEmpIdTxt" style="font-size:13px; color:#fff;">-</div>
                          </div>
                          <div class="col-md-6 mb-2">
                              <label style="font-size:11px; color:#888; margin-bottom: 2px; display:block;">Department</label>
                              <div id="adminProfileDeptTxt" style="font-size:13px; color:#fff;">-</div>
                          </div>
                          <div class="col-md-6 mb-2">
                              <label style="font-size:11px; color:#888; margin-bottom: 2px; display:block;">Designation</label>
                              <div id="adminProfileDesgTxt" style="font-size:13px; color:#fff;">-</div>
                          </div>
                          <div class="col-md-6 mb-2">
                              <label style="font-size:11px; color:#888; margin-bottom: 2px; display:block;">Date of Joining</label>
                              <div id="adminProfileDojTxt" style="font-size:13px; color:#fff;">-</div>
                          </div>
                      </div>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="admin-btn admin-btn-outline" data-dismiss="modal" data-bs-dismiss="modal" style="background:transparent; color:#d4af37; border:1px solid #d4af37; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">Cancel</button>
                    <button type="submit" class="admin-btn" style="background:#d4af37; color:#000; border:none; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>`;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);

        // Bind form submit
        const form = document.getElementById('adminProfileForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const firstName = document.getElementById('adminProfileFirstName').value.trim();
                const lastName = document.getElementById('adminProfileLastName').value.trim();
                const phoneNumber = document.getElementById('adminProfilePhone').value.trim();
                const birthDate = document.getElementById('adminProfileBirthDate').value || null;

                try {
                    const res = await fetch(`${PROFILE_API_BASE}/me`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            firstName,
                            lastName,
                            phoneNumber,
                            birthDate
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (typeof showAlert === 'function') showAlert('success', 'Profile updated successfully.');
                        else alert('Profile updated successfully.');

                        // Update currentUser object locally
                        this.currentUser.fullName = firstName + (lastName ? ' ' + lastName : '');
                        this.currentUser.phone = phoneNumber;
                        sessionStorage.setItem('rasa_user', JSON.stringify(this.currentUser));
                        this.updateAdminHeader(); // Refresh header

                        $('#adminProfileModal').modal('hide');
                    } else {
                        if (typeof showAlert === 'function') showAlert('error', data.message || 'Failed to update profile.');
                        else alert(data.message || 'Failed to update profile.');
                    }
                } catch (err) {
                    console.error(err);
                    if (typeof showAlert === 'function') showAlert('error', 'Failed to update profile due to network error.');
                    else alert('Failed to update profile due to network error.');
                }
            });
        }
    },

    showChangePasswordModal() {
        this.ensureChangePasswordModal();
        $('#adminChangePasswordModal').modal('show');
    },

    ensureChangePasswordModal() {
        if (document.getElementById('adminChangePasswordModal')) return;

        const modalHtml = `
        <div class="modal fade" id="adminChangePasswordModal" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 1060;">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content" style="background:#0a0a0a; border:2px solid #d4af37; color:#fff; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div class="modal-header" style="border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; padding: 15px 25px;">
                <h5 class="modal-title" style="color: #d4af37; font-family: 'Cinzel', serif; margin: 0;">Change Password</h5>
                <button type="button" class="close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close" style="color:#fff; background:transparent; border:none; font-size:1.5rem; cursor: pointer; padding: 0; line-height: 1; margin-right: 10px;">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body" style="padding:25px;">
                <form id="adminChangePasswordForm">
                  <div class="form-group mb-3">
                    <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Current Password *</label>
                    <input type="password" id="adminCurrentPwd" required style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                  </div>
                  <div class="form-group mb-3">
                    <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">New Password *</label>
                    <input type="password" id="adminNewPwd" placeholder="Minimum 8 characters" required style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                  </div>
                  <div class="form-group mb-4">
                    <label style="font-size:12px; color:#aaa; margin-bottom:6px; display:block;">Confirm New Password *</label>
                    <input type="password" id="adminConfirmNewPwd" placeholder="Confirm new password" required style="background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; height: 45px; padding: 0 15px; width: 100%; outline: none; font-size: 14px;">
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="admin-btn admin-btn-outline" data-dismiss="modal" data-bs-dismiss="modal" style="background:transparent; color:#d4af37; border:1px solid #d4af37; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">Cancel</button>
                    <button type="submit" class="admin-btn" style="background:#d4af37; color:#000; border:none; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">Update Password</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>`;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);

        // Bind form submit
        const form = document.getElementById('adminChangePasswordForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('adminCurrentPwd').value;
                const newPassword = document.getElementById('adminNewPwd').value;
                const confirmNewPassword = document.getElementById('adminConfirmNewPwd').value;

                if (newPassword !== confirmNewPassword) {
                    if (typeof showAlert === 'function') showAlert('error', 'New passwords do not match.');
                    else alert('New passwords do not match.');
                    return;
                }
                if (newPassword.length < 8) {
                    if (typeof showAlert === 'function') showAlert('error', 'New password must be at least 8 characters long.');
                    else alert('New password must be at least 8 characters long.');
                    return;
                }

                try {
                    const res = await fetch(`${PROFILE_API_BASE}/me/change-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ currentPassword, newPassword })
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (typeof showAlert === 'function') showAlert('success', 'Password changed successfully.');
                        else alert('Password changed successfully.');
                        form.reset();
                        $('#adminChangePasswordModal').modal('hide');
                    } else {
                        if (typeof showAlert === 'function') showAlert('error', data.message || 'Failed to change password.');
                        else alert(data.message || 'Failed to change password.');
                    }
                } catch (err) {
                    console.error(err);
                    if (typeof showAlert === 'function') showAlert('error', 'Failed to change password due to network error.');
                    else alert('Failed to change password due to network error.');
                }
            });
        }
    },

    showHelpModal() {
        this.ensureHelpModal();
        $('#adminHelpModal').modal('show');
    },

    ensureHelpModal() {
        if (document.getElementById('adminHelpModal')) return;

        const modalHtml = `
        <div class="modal fade" id="adminHelpModal" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 1060;">
          <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content" style="background:#0a0a0a; border:2px solid #d4af37; color:#fff; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div class="modal-header" style="border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center;">
                <h5 class="modal-title" style="color: #d4af37; font-family: 'Cinzel', serif; margin: 0;"><i class="ti-help-alt" style="margin-right: 8px;"></i>System Help & Support</h5>
                <button type="button" class="close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close" style="color:#fff; background:transparent; border:none; font-size:1.5rem; cursor: pointer; padding: 0; line-height: 1; margin-right: 15px;">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body" style="padding:25px; line-height: 1.6; font-size: 14px;">
                <p style="color: #d4af37; font-weight: 600; margin-bottom: 15px;">Welcome to I Rasa Administrative Dashboard.</p>
                <p>For system inquiries or administrative support, you can contact the technical support team:</p>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin: 15px 0;">
                  <div style="margin-bottom: 8px;"><i class="ti-email" style="color: #d4af37; margin-right: 10px;"></i><strong>Email:</strong> irasaperfumes@gmail.com</div>
                  <div><i class="ti-headphone-alt" style="color: #d4af37; margin-right: 10px;"></i><strong>Hotline:</strong> +91 98238 33303 / +91 93718 33303 (Mon-Sat, 9AM - 6PM)</div>
                </div>
                <p style="font-size: 12px; color: #888; margin-top: 15px;">Version 1.0.0 (Stable) &bull; Built with Spring Boot</p>
                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                  <button type="button" class="admin-btn" data-dismiss="modal" data-bs-dismiss="modal" style="background:#d4af37; color:#000; border:none; padding:8px 20px; border-radius:4px; font-weight:600; cursor:pointer;">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);
    },

    injectDropdownStyles() {
        if (document.getElementById('admin-profile-dropdown-styles')) return;
        const styles = `
            .admin-profile-container {
                position: relative;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                padding: 6px 14px;
                border-radius: 30px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(212, 175, 55, 0.15);
                transition: all 0.3s ease;
                user-select: none;
            }
            .admin-profile-container:hover {
                background: rgba(255, 255, 255, 0.07);
                border-color: rgba(212, 175, 55, 0.5);
                box-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
            }
            .admin-profile-details {
                text-align: right;
            }
            .admin-profile-name {
                font-size: 0.85rem;
                font-weight: 600;
                color: #fff;
                line-height: 1.2;
            }
            .admin-profile-role {
                font-size: 0.7rem;
                color: #d4af37;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
            }
            .admin-profile-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #222, #111);
                border: 2px solid #d4af37;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #d4af37;
                font-weight: bold;
                font-size: 1rem;
                transition: transform 0.3s ease;
                overflow: hidden;
            }
            .admin-profile-container:hover .admin-profile-avatar {
                transform: scale(1.05);
            }
            .admin-profile-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                width: 260px;
                background: #0d0d0d;
                border: 1px solid #333333;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.1);
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                z-index: 1050;
                overflow: hidden;
            }
            .admin-profile-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            .dropdown-header-info {
                padding: 16px 20px;
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), transparent);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                text-align: left;
            }
            .dropdown-header-name {
                font-size: 0.9rem;
                font-weight: 700;
                color: #fff;
                font-family: 'Cinzel', serif;
            }
            .dropdown-header-email {
                font-size: 0.75rem;
                color: #888;
                margin-top: 2px;
                word-break: break-all;
            }
            .dropdown-header-role-badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 20px;
                background: rgba(212, 175, 55, 0.1);
                color: #d4af37;
                font-size: 0.65rem;
                font-weight: 700;
                margin-top: 8px;
                border: 1px solid rgba(212, 175, 55, 0.2);
                text-transform: uppercase;
            }
            .dropdown-links-list {
                padding: 8px 0;
            }
            .dropdown-link-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 20px;
                color: #ccc;
                font-size: 0.85rem;
                text-decoration: none;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                text-align: left;
            }
            .dropdown-link-item:hover {
                background: rgba(212, 175, 55, 0.05);
                color: #d4af37;
                border-left-color: #d4af37;
                text-decoration: none;
            }
            .dropdown-link-item i {
                font-size: 0.95rem;
                width: 16px;
                text-align: center;
                color: #888;
                transition: color 0.2s ease;
            }
            .dropdown-link-item:hover i {
                color: #d4af37;
            }
            .dropdown-footer {
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                padding: 4px 0;
            }
        `;
        const styleEl = document.createElement('style');
        styleEl.id = 'admin-profile-dropdown-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
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
        } catch (e) { }
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
