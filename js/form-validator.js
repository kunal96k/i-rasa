/**
 * I Rasa — Real-Time Form Validator
 * Provides inline validation with live feedback icons and hint messages
 * on all forms: login, register, contact, checkout, profile, etc.
 */

(function () {
  'use strict';

  /* ─── Inject shared styles once ─────────────────────────────────── */
  if (!document.getElementById('_irasa_fv_styles')) {
    var s = document.createElement('style');
    s.id = '_irasa_fv_styles';
    s.textContent = `
      /* Field wrapper */
      .fv-group { position: relative; }

      /* Input wrapper to bound absolute elements to input height */
      .fv-input-wrapper {
        position: relative;
        width: 100%;
        display: block;
      }

      /* Action Wrapper on the right of input containing inner button (eye / OTP) and validation status icon */
      .fv-action-wrap {
        position: absolute;
        right: 12px;
        top: 0;
        bottom: 0;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        pointer-events: none;
        z-index: 15;
      }
      
      /* Reset positioning for items inside the action wrap to let flexbox position them */
      .fv-action-wrap > * {
        position: static !important;
        transform: none !important;
        pointer-events: auto !important;
        margin: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* Keep OTP button styling correct inside flex wrap */
      .fv-action-wrap .otp-btn {
        height: 32px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }

      /* Eye/password toggles inside flex wrap */
      .fv-action-wrap [onclick*="togglePass"] {
        cursor: pointer;
        color: #888;
        font-size: 14px;
        padding: 5px;
        transition: color 0.2s;
      }
      .fv-action-wrap [onclick*="togglePass"]:hover {
        color: #d4af37;
      }

      /* Status icon (✓ / ✗) */
      .fv-icon {
        font-size: 16px;
        transition: all 0.25s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* Hint text */
      .fv-hint {
        font-size: 11px;
        margin-top: 5px;
        padding-left: 4px;
        min-height: 15px;
        transition: all 0.2s;
        display: block;
        line-height: 1.4;
      }

      /* Input states */
      .fv-valid .form-control   { border-color: #4caf50 !important; box-shadow: 0 0 8px rgba(76,175,80,0.18) !important; }
      .fv-invalid .form-control { border-color: #ef4444 !important; box-shadow: 0 0 8px rgba(239,68,68,0.18) !important; }
      .fv-valid   .fv-icon { color: #4caf50; }
      .fv-invalid .fv-icon { color: #ef4444; }
      .fv-valid   .fv-hint { color: #4caf50; }
      .fv-invalid .fv-hint { color: #ef4444; }

      /* Password strength bar */
      .fv-strength-wrap {
        margin-top: 6px;
        height: 4px;
        border-radius: 4px;
        background: #333;
        overflow: hidden;
      }
      .fv-strength-bar {
        height: 100%;
        width: 0%;
        border-radius: 4px;
        transition: width 0.3s, background 0.3s;
      }
    `;
    document.head.appendChild(s);
  }

  /* ─── XSS & Script Injection Prevention Helper ───────────────────── */
  function isSafeInput(v) {
    if (!v) return true;
    var val = v.toString().trim();
    // Reject HTML tags
    if (/<[^>]*>/g.test(val)) return false;
    // Reject javascript: protocol or similar scripts
    if (/javascript\s*:/i.test(val)) return false;
    // Reject inline event handlers (e.g. onclick=, onerror=, onload=)
    if (/on\w+\s*=/i.test(val)) return false;
    // Reject script tags explicitly
    if (/<script/i.test(val) || /&lt;script/i.test(val) || /&#x3C;script/i.test(val)) return false;
    // Reject SQL injection basics (OR 1=1, DROP TABLE, etc)
    if (/(\b(OR|AND)\b\s+\d+=\d+)|(DROP\s+TABLE)|(SELECT\s+.*FROM)/i.test(val)) return false;
    return true;
  }

  /* ─── Rules ─────────────────────────────────────────────────────── */
  var RULES = {
    email: {
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && isSafeInput(v); },
      hint: {
        valid: 'Looks good!',
        invalid: 'Enter a valid email (e.g. name@domain.com) without scripting tags'
      }
    },
    phone: {
      test: function (v) { return /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')) && isSafeInput(v); },
      hint: {
        valid: 'Valid Indian mobile number',
        invalid: 'Must be a 10-digit Indian number starting with 6–9'
      }
    },
    fullname: {
      test: function (v) { return v.trim().length >= 3 && v.trim().length <= 50 && /^[a-zA-Z\s.'-]+$/.test(v.trim()) && isSafeInput(v); },
      hint: {
        valid: 'Name looks good!',
        invalid: 'At least 3 letters, maximum 50 characters, only alphabets allowed (no scripting tags)'
      }
    },
    password: {
      test: function (v) { return v.length >= 8 && isSafeInput(v); },
      hint: {
        valid: 'Strong enough!',
        invalid: 'Minimum 8 characters required (no scripting tags)'
      }
    },
    confirmPassword: {
      test: function (v, ctx) {
        var pw = ctx && ctx.querySelector('[data-fv-role="password"]');
        return (pw ? v === pw.value : v.length >= 8) && isSafeInput(v);
      },
      hint: {
        valid: 'Passwords match!',
        invalid: 'Passwords do not match or contain unsafe scripts'
      }
    },
    otp: {
      test: function (v) { return /^\d{6}$/.test(v.trim()) && isSafeInput(v); },
      hint: {
        valid: 'OTP looks correct',
        invalid: 'Enter the 6-digit code sent to your email'
      }
    },
    subject: {
      test: function (v) {
        var val = v.trim();
        return val.length >= 2 && val.length <= 100 && isSafeInput(val);
      },
      hint: {
        valid: 'Subject looks safe and valid!',
        invalid: 'Subject must be between 2 and 100 characters and contain no scripting or HTML tags'
      }
    },
    message: {
      test: function (v) {
        var val = v.trim();
        return val.length >= 10 && val.length <= 1000 && isSafeInput(val);
      },
      hint: {
        valid: 'Message looks safe and valid!',
        invalid: 'Message must be between 10 and 1000 characters and contain no scripting or HTML tags'
      }
    },
    text: {
      test: function (v) { return v.trim().length >= 2 && isSafeInput(v); },
      hint: {
        valid: 'Looks good!',
        invalid: 'This field is required (min 2 characters, no scripting/HTML tags)'
      }
    },
    textarea: {
      test: function (v) { return v.trim().length >= 10 && isSafeInput(v); },
      hint: {
        valid: 'Thanks for the detail!',
        invalid: 'Please write at least 10 characters (no scripting/HTML tags)'
      }
    }
  };

  /* ─── Password strength helper ───────────────────────────────────── */
  function getStrength(pw) {
    var score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
  }

  var STRENGTH_LABEL = ['', 'Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  var STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#fbbf24', '#22c55e', '#4caf50'];

  /* ─── Core: attach validation to a single input ──────────────────── */
  function attachField(input, ruleKey, form) {
    var group = input.closest('.form-group, .fv-group') || input.parentElement;
    group.classList.add('fv-group');

    // Dynamically apply length limits based on rules
    if (!input.hasAttribute('maxlength')) {
      if (ruleKey === 'phone') input.setAttribute('maxlength', '10');
      else if (ruleKey === 'fullname') input.setAttribute('maxlength', '50');
      else if (ruleKey === 'subject') input.setAttribute('maxlength', '100');
      else if (ruleKey === 'message' || ruleKey === 'textarea') input.setAttribute('maxlength', '1000');
      else if (ruleKey === 'otp') input.setAttribute('maxlength', '6');
      else if (ruleKey === 'email') input.setAttribute('maxlength', '100');
    }

    // Create or locate input wrapper
    var wrapper = input.parentElement;
    if (!wrapper.classList.contains('fv-input-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'fv-input-wrapper';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }

    // Create action wrapper if not exists
    var actionWrap = wrapper.querySelector('.fv-action-wrap');
    if (!actionWrap) {
      actionWrap = document.createElement('div');
      actionWrap.className = 'fv-action-wrap';
      wrapper.appendChild(actionWrap);
    }

    // Check if there is already a toggle-password icon inside the group
    var eyeIcon = group.querySelector('[onclick*="togglePass"], .fa-eye, .fa-eye-slash');
    // Check if there is an OTP button
    var otpBtn = group.querySelector('.otp-btn');

    // Move eyeIcon and otpBtn inside action wrapper if not already
    if (otpBtn && !actionWrap.contains(otpBtn)) {
      actionWrap.appendChild(otpBtn);
    }
    if (eyeIcon && !actionWrap.contains(eyeIcon)) {
      var eyeWrap = eyeIcon.closest('span') || eyeIcon;
      actionWrap.appendChild(eyeWrap);
    }

    // Create or locate status icon span (Always right-most in action wrapper)
    var icon = actionWrap.querySelector('.fv-icon');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'fv-icon';
      icon.setAttribute('aria-hidden', 'true');
    }
    actionWrap.appendChild(icon);

    // Dynamically adjust padding-right on input
    function adjustPadding() {
      var w = actionWrap.offsetWidth;
      if (w > 0) {
        input.style.paddingRight = (w + 14) + 'px';
      } else {
        // Fallback calculations if elements not fully rendered or layouted
        var est = 22;
        if (otpBtn) est += 90;
        if (eyeIcon) est += 35;
        input.style.paddingRight = est + 'px';
      }
    }

    adjustPadding();
    setTimeout(adjustPadding, 50);
    setTimeout(adjustPadding, 300); // extra delay to catch visual transitions
    input.addEventListener('focus', adjustPadding);
    input.addEventListener('input', adjustPadding);

    // Create or locate hint span
    var hint = group.querySelector('.fv-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'fv-hint';
      group.appendChild(hint);
    }

    // Password strength bar
    var strengthBar = null;
    if (ruleKey === 'password') {
      var strengthWrap = group.querySelector('.fv-strength-wrap');
      if (!strengthWrap) {
        strengthWrap = document.createElement('div');
        strengthWrap.className = 'fv-strength-wrap';
        strengthBar = document.createElement('div');
        strengthBar.className = 'fv-strength-bar';
        strengthWrap.appendChild(strengthBar);
        group.appendChild(strengthWrap);
      } else {
        strengthBar = strengthWrap.querySelector('.fv-strength-bar');
      }
    }

    function validate(showIfEmpty) {
      var val = input.value;
      if (!showIfEmpty && val === '') {
        // Clear state when empty on first blur
        group.classList.remove('fv-valid', 'fv-invalid');
        icon.textContent = '';
        hint.textContent = '';
        if (strengthBar) { strengthBar.style.width = '0%'; }
        return;
      }

      var rule = RULES[ruleKey] || RULES.text;
      var ok = rule.test(val, form);

      group.classList.toggle('fv-valid', ok);
      group.classList.toggle('fv-invalid', !ok);
      icon.innerHTML = ok
        ? '<i class="fas fa-check-circle"></i>'
        : '<i class="fas fa-times-circle"></i>';
      hint.textContent = ok ? rule.hint.valid : rule.hint.invalid;

      // Strength bar for password
      if (ruleKey === 'password' && strengthBar) {
        var score = getStrength(val);
        strengthBar.style.width = (score * 20) + '%';
        strengthBar.style.background = STRENGTH_COLOR[score] || '#ef4444';
        hint.textContent = score > 0 ? (STRENGTH_LABEL[score] + ' password') : rule.hint.invalid;
        hint.style.color = STRENGTH_COLOR[score] || '#ef4444';
      }
      
      // Always re-adjust padding when validation icon is updated / added
      adjustPadding();
    }

    // Validate as user types
    input.addEventListener('input', function () { validate(true); });
    // Validate on blur (shows error even if user left field empty)
    input.addEventListener('blur', function () { validate(!!input.value); });
  }

  /* ─── Auto-detect rule from input attributes ─────────────────────── */
  function detectRule(input) {
    var type  = (input.type  || '').toLowerCase();
    var name  = (input.name  || '').toLowerCase();
    var ph    = (input.placeholder || '').toLowerCase();
    var id    = (input.id    || '').toLowerCase();
    var role  = (input.dataset.fvRole || '').toLowerCase();
    var tag   = input.tagName.toLowerCase();

    if (role === 'password' || role === 'confirmpassword') return role;
    if (name.includes('subject') || id.includes('subject') || ph.includes('subject')) return 'subject';
    if (name.includes('message') || id.includes('message') || ph.includes('message') || tag === 'textarea') return 'message';
    if (tag === 'textarea') return 'textarea';
    if (type === 'email'  || name.includes('email') || id.includes('email')) return 'email';
    if (type === 'tel'    || name.includes('phone') || id.includes('phone') || ph.includes('phone') || ph.includes('mobile')) return 'phone';
    if (type === 'password') {
      // Distinguish confirm from password
      if (id.includes('confirm') || name.includes('confirm') || ph.includes('confirm')) return 'confirmPassword';
      return 'password';
    }
    if (name.includes('name') || id.includes('name') || ph.includes('name')) return 'fullname';
    if (id.includes('otp') || name.includes('otp') || ph.includes('otp')) return 'otp';
    return 'text';
  }

  /* ─── Init: scan all forms or a specific container ──────────────── */
  function initForms(root) {
    root = root || document;
    var forms = root.querySelectorAll('form');
    forms.forEach(function (form) {
      // Skip forms explicitly opting out
      if (form.dataset.fvSkip) return;

      var fields = form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea');
      fields.forEach(function (input) {
        // Skip if already attached
        if (input.dataset.fvAttached) return;
        input.dataset.fvAttached = 'true';

        // Mark password fields for confirm-password linking
        if (input.type === 'password' && !input.id.toLowerCase().includes('confirm')) {
          input.dataset.fvRole = 'password';
        }

        var rule = detectRule(input);
        attachField(input, rule, form);
      });
    });
  }

  /* ─── Public API ─────────────────────────────────────────────────── */
  window.IrasaValidator = {
    init: initForms,
    attachField: attachField,
    RULES: RULES
  };

  /* ─── Auto-init on DOM ready ─────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initForms(); });
  } else {
    initForms();
  }

  /* ─── Re-init on dynamic content (e.g. modals opening) ──────────── */
  document.addEventListener('shown.bs.modal', function (e) {
    if (e.target) initForms(e.target);
  });

})();
