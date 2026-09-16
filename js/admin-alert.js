/**
 * I Rasa Perfumes - Custom Premium Alert & Confirmation Modal
 * Replaces default browser alerts/confirms with luxury dark-gold styled components.
 */

// Global Toast Alert function
window.showAlert = function(type, msg) {
  if (!msg) return;
  if (!type) {
    if (/success|verify|created|saved|updated|deleted|confirmed|sent|successfully/i.test(msg)) type = 'success';
    else if (/error|fail|invalid|cannot|wrong|expired|rejected|failed/i.test(msg)) type = 'error';
    else if (/warning|attention|warn/i.test(msg)) type = 'warning';
    else type = 'info';
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
  
  var cleanMsg = msg.toString().replace(/^[✓✔✕✗×⚠️❌✅♥❤💵👁📥⏳]+\s*/u, '').replace(/<[^>]*>/g, '').trim();
  
  var t = document.createElement('div');
  t.className = '_irasa_toast _irasa_toast--' + type;
  t.innerHTML = '<div class="_irasa_toast__icon"><i class="' + (iconMap[type] || 'fas fa-info-circle') + '"></i></div>'
    + '<span class="_irasa_toast__msg">' + cleanMsg + '</span>'
    + '<button class="_irasa_toast__close" aria-label="Close">&times;</button>';
  
  container.appendChild(t);
  
  requestAnimationFrame(function(){ 
    requestAnimationFrame(function(){ 
      t.classList.add('show'); 
    }); 
  });
  
  var dismissed = false;
  var dismiss = function () {
    if (dismissed) return;
    dismissed = true;
    t.classList.remove('show');
    t.classList.add('hide');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
  };
  
  var timer = setTimeout(dismiss, 3200);
  
  t.addEventListener('click', function(){ 
    clearTimeout(timer); 
    dismiss();
  });
};

// Override standard window.alert
window.alert = function(msg) {
  window.showAlert(null, msg);
};

// Async Custom Confirm Modal Dialog
window.showConfirm = function(msg, title = 'Are you sure?') {
  return new Promise((resolve) => {
    // Create the modal element
    const modalId = '_irasa_confirm_modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) {
      modalEl.parentNode.removeChild(modalEl);
    }
    
    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.style.zIndex = '999999';
    
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="background:#0a0a0a; border:2px solid #d4af37; border-radius:12px; box-shadow: 0 15px 50px rgba(0,0,0,0.85);">
          <div class="modal-header" style="border-bottom: 1px solid #222; background: linear-gradient(135deg, #111 0%, #1a1500 100%);">
            <h5 style="color:#d4af37; font-family:'Cinzel', serif; font-weight:700; margin-bottom:0; letter-spacing:1px; font-size: 16px;">
              <i class="fas fa-exclamation-circle" style="margin-right:10px; color:#d4af37;"></i>${title}
            </h5>
            <button type="button" class="close" data-dismiss="modal" style="color:#fff; font-size:1.5rem; opacity:0.8; outline:none; border:none; background:none; margin-right: 15px;" id="${modalId}_close">&times;</button>
          </div>
          <div class="modal-body p-4" style="color:#e8dfc8; font-family:'Inter', sans-serif; font-size:14.5px; line-height:1.6; text-align:center;">
            ${msg}
          </div>
          <div class="modal-footer" style="border-top:1px solid #222; background:#111; justify-content:center; gap:15px; padding: 15px;">
            <button type="button" class="admin-btn admin-btn-outline" style="min-width:100px; margin:0;" id="${modalId}_cancel" data-dismiss="modal">Cancel</button>
            <button type="button" class="admin-btn" style="min-width:100px; margin:0;" id="${modalId}_confirm">Confirm</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modalEl);
    
    // Initialize bootstrap modal
    const $modal = $(modalEl);
    $modal.modal({
      backdrop: 'static',
      keyboard: false,
      show: true
    });
    
    let resolved = false;
    
    const cleanup = (result) => {
      if (resolved) return;
      resolved = true;
      $modal.modal('hide');
      setTimeout(() => {
        $modal.remove();
        $('.modal-backdrop').remove(); // backup backdrop cleanup
        $('body').removeClass('modal-open').css('padding-right', '');
      }, 400);
      resolve(result);
    };
    
    document.getElementById(`${modalId}_confirm`).addEventListener('click', () => cleanup(true));
    document.getElementById(`${modalId}_cancel`).addEventListener('click', () => cleanup(false));
    document.getElementById(`${modalId}_close`).addEventListener('click', () => cleanup(false));
    
    // Fallback if modal is closed via other bootstrap handlers
    $modal.on('hidden.bs.modal', () => cleanup(false));
  });
};

// Sidebar Toggle & Collapse Handler for Admin Dashboard (applies to all admin pages)
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.admin-header');
  if (header) {
    // 1. Create and insert Toggle Button in Header
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'admin-sidebar-toggle';
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.title = 'Toggle Navigation';
    
    header.insertBefore(toggleBtn, header.firstChild);

    // 2. Create Mobile Sidebar Backdrop Overlay
    let backdrop = document.querySelector('.admin-sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'admin-sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    const sidebar = document.querySelector('.admin-sidebar');

    if (sidebar) {
      // 3. Toggle Sidebar on Click
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.innerWidth <= 768) {
          // Mobile: slide in/out drawer
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('show');
        } else {
          // Desktop: collapse to icons
          sidebar.classList.toggle('collapsed');
          // Save state in localStorage so it persists across page navigations
          if (sidebar.classList.contains('collapsed')) {
            localStorage.setItem('admin_sidebar_collapsed', 'true');
          } else {
            localStorage.setItem('admin_sidebar_collapsed', 'false');
          }
        }
      });

      // Close mobile sidebar on backdrop click
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      });

      // Close mobile sidebar when clicking a link inside it
      sidebar.querySelectorAll('.admin-nav-item').forEach(link => {
        link.addEventListener('click', function () {
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
          }
        });
      });

      // Restore desktop collapsed state from localStorage
      if (window.innerWidth > 768) {
        const isCollapsed = localStorage.getItem('admin_sidebar_collapsed') === 'true';
        if (isCollapsed) {
          sidebar.classList.add('collapsed');
        }
      }
    }
  }
});
