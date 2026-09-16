// Contact form handler with API integration and toast notifications
const API_BASE_CONTACT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `http://${window.location.hostname}:8080` : '';

document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const mobileNo = document.getElementById('mobileNo') ? document.getElementById('mobileNo').value.trim() : '';
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            // Validate inputs
            if (!name || !email || !subject || !message) {
                showToast('❌ Please fill in all fields', 'error');
                return;
            }

            // Validate email format
            if (!isValidEmail(email)) {
                showToast('❌ Please enter a valid email address', 'error');
                return;
            }

            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Submitting...';

            try {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('email', email);
                if (mobileNo) formData.append('mobileNo', mobileNo);
                formData.append('subject', subject);
                formData.append('message', message);

                // Submit to backend API
                const response = await fetch(`${API_BASE_CONTACT}/api/contact/submit-enquiry`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Success - show toast and reset form
                    showToast('✅ ' + data.message, 'success');
                    contactForm.reset();
                    submitBtn.textContent = 'Message Sent!';
                    submitBtn.style.display = 'none';
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        submitBtn.style.display = 'block';
                        submitBtn.textContent = originalBtnText;
                        submitBtn.disabled = false;
                    }, 3000);
                } else {
                    // Error response from backend
                    showToast('❌ ' + (data.message || 'Failed to submit ticket'), 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                console.error('Error submitting contact form:', error);
                showToast('❌ Network error. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
});

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Global toast notification function
 * @param {string} message - Toast message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
    if (window.showToast && window.showToast !== showToast) {
        window.showToast(message, type);
        return;
    }

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

    var container = document.getElementById('_irasa_toast_container');
    if (!container) {
        container = document.createElement('div');
        container.id = '_irasa_toast_container';
        document.body.appendChild(container);
    }

    var iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle',
        wishlist: 'fas fa-heart'
    };

    var cleanMsg = (message || '').toString().replace(/^[✓✔✕✗×⚠️❌✅♥❤💵👁📥⏳]+\s*/u, '').replace(/<[^>]*>/g, '').trim();

    var toast = document.createElement('div');
    toast.className = '_irasa_toast _irasa_toast--' + type;
    toast.innerHTML = '<div class="_irasa_toast__icon"><i class="' + (iconMap[type] || 'fas fa-info-circle') + '"></i></div>'
        + '<span class="_irasa_toast__msg">' + cleanMsg + '</span>'
        + '<button class="_irasa_toast__close" aria-label="Close">&times;</button>';

    container.appendChild(toast);

    requestAnimationFrame(function () {
        requestAnimationFrame(function () { toast.classList.add('show'); });
    });

    var dismissed = false;
    var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    };

    var timer = setTimeout(dismiss, 3200);
    toast.addEventListener('click', function () {
        clearTimeout(timer);
        dismiss();
    });
}
