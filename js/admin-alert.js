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
    else if (/warning|attention/i.test(msg)) type = 'warning';
    else type = 'info';
  }
  
  var container = document.getElementById('_irasa_toast_container');
  if (!container) {
    container = document.createElement('div');
    container.id = '_irasa_toast_container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none;';
    document.body.appendChild(container);
  }
  
  var colors = { success:'#0d1f0f', error:'#1f0d0d', info:'#0a1220', warning:'#1f1700' };
  var borders = { success:'#4caf50', error:'#ef4444', info:'#d4af37', warning:'#f59e0b' };
  var textCols = { success:'#6ee88a', error:'#f87171', info:'#d4af37', warning:'#fbbf24' };
  var iconMap = { success:'fas fa-check-circle', error:'fas fa-times-circle', info:'fas fa-info-circle', warning:'fas fa-exclamation-triangle' };
  
  var cleanMsg = msg.toString().replace(/^[✓✔✕✗×⚠️❌✅♥❤💵👁📥⏳]+\s*/u, '').replace(/<[^>]*>/g, '').trim();
  
  var t = document.createElement('div');
  t.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:280px;max-width:360px;padding:14px 18px 14px 16px;border-radius:14px;font-family:\'Inter\',sans-serif;font-size:13.5px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.55);border-left:4px solid ' + (borders[type]||'#d4af37') + ';background:' + (colors[type]||'#0a1220') + ';color:' + (textCols[type]||'#d4af37') + ';opacity:0;transform:translateX(60px);transition:opacity .35s,transform .35s;pointer-events:auto;cursor:pointer;position:relative;overflow:hidden;';
  
  t.innerHTML = '<i class="' + (iconMap[type]||'fas fa-info-circle') + '" style="font-size:16px;flex-shrink:0;"></i><span style="flex:1;line-height:1.4;">' + cleanMsg + '</span>';
  container.appendChild(t);
  
  requestAnimationFrame(function(){ 
    requestAnimationFrame(function(){ 
      t.style.opacity='1'; 
      t.style.transform='translateX(0)'; 
    }); 
  });
  
  var timer = setTimeout(function(){ 
    t.style.opacity='0'; 
    t.style.transform='translateX(60px)'; 
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 400); 
  }, 3500);
  
  t.addEventListener('click', function(){ 
    clearTimeout(timer); 
    t.style.opacity='0'; 
    t.style.transform='translateX(60px)'; 
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 400); 
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
