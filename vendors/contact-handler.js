// Contact form handler with API integration and toast notifications
document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
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
                // Submit to backend API
                const response = await fetch('/api/contact/submit-ticket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
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
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set colors based on type
    let bgColor = '#333';
    let borderColor = '#d4af37';
    let textColor = '#fff';
    
    switch (type) {
        case 'success':
            bgColor = '#1a3a1a';
            borderColor = '#4caf50';
            textColor = '#4caf50';
            break;
        case 'error':
            bgColor = '#3a1a1a';
            borderColor = '#f44336';
            textColor = '#f44336';
            break;
        case 'warning':
            bgColor = '#3a2a1a';
            borderColor = '#ff9800';
            textColor = '#ff9800';
            break;
        case 'info':
            bgColor = '#1a2a3a';
            borderColor = '#2196f3';
            textColor = '#2196f3';
            break;
    }

    toast.style.cssText = `
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 12px;
        color: ${textColor};
        font-size: 14px;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        letter-spacing: 0.5px;
    `;
    
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
