console.log('[qp-widget] Script loading...');

(function () {
  // -- Minimal toast renderer for messages relayed from the portal --
  var TOAST_COLORS = {
    success: '#16a34a',
    error:   '#dc2626',
    warning: '#d97706',
    info:    '#2563eb',
    message: '#374151'
  };

  function showToast(elToasts, kind, message) {
    var color = TOAST_COLORS[kind] || TOAST_COLORS.message;

    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText =
      'pointer-events:auto; background:#fff; color:#111827;' +
      'border-left:4px solid ' + color + ';' +
      'padding:10px 14px; border-radius:8px; font-size:14px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.15); max-width:320px;' +
      'opacity:0; transform:translateY(8px); transition:opacity .2s, transform .2s;';

    elToasts.appendChild(el);

    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { el.remove(); }, 200);
    }, 4000);
  }

  function initWidget() {
    var bridge      = document.getElementById('qp-bridge');
    var elLoading   = document.getElementById('qp-loading');
    var elAuthed    = document.getElementById('qp-authed');
    var elUnauthed  = document.getElementById('qp-unauthed');
    var elName      = document.getElementById('qp-name');
    var elLink      = document.getElementById('qp-portal-link');
    var elLogoutBtn = document.getElementById('qp-logout-btn');
    var elModal     = document.getElementById('qp-modal-bg');
    var elSignin    = document.getElementById('qp-signin-frame');
    var elToasts    = document.getElementById('qp-toast-container');
    var elLoginBtn  = document.getElementById('qp-login-btn');
    var elModalClose = document.getElementById('qp-modal-close');

    var STORE_ORIGIN = window.location.origin;
    // PORTAL_URL comes from getBackendUrl(), loaded separately (see portal-url.js).
    // Update the preview/production URLs there, not here.
    var PORTAL_URL = getBackendUrl();

    bridge.src = PORTAL_URL + '/session-bridge?widget_origin=' + encodeURIComponent(STORE_ORIGIN);
    elLink.href = PORTAL_URL;

    // -- Request current session state from bridge --
    function pingBridge() {
      try {
        bridge.contentWindow.postMessage({ type: 'REQUEST_SESSION_STATE' }, PORTAL_URL);
      } catch (e) {}
    }

    // -- Request sign-out from bridge --
    function requestSignOut() {
      try {
        bridge.contentWindow.postMessage({ type: 'REQUEST_SIGN_OUT' }, PORTAL_URL);
      } catch (e) {}
    }

    // -- Update widget UI --
    function applySession(data) {
      elLoading.style.display  = 'none';
      if (data.status === 'authenticated') {
        elAuthed.style.display   = 'flex';
        elUnauthed.style.display = 'none';
        elName.textContent = data.user.display_name || data.user.email || 'User';
        closeModal();
      } else {
        elAuthed.style.display   = 'none';
        elUnauthed.style.display = 'block';
      }
    }

    // -- Login modal --
    function openModal() {
      // widget_origin lets the embedded signin page relay toasts back to us
      elSignin.src = PORTAL_URL + '/signin?embed=1&widget_origin=' + encodeURIComponent(STORE_ORIGIN);
      elModal.style.display = 'flex';
    }
    function closeModal() {
      elModal.style.display = 'none';
      elSignin.src = '';
    }

    elLoginBtn.addEventListener('click', openModal);
    elModalClose.addEventListener('click', closeModal);
    elLogoutBtn.addEventListener('click', requestSignOut);
    elModal.addEventListener('click', function (e) {
      if (e.target === elModal) closeModal();
    });

    // -- Listen for messages from the portal (bridge iframe or signin iframe) --
    window.addEventListener('message', function (event) {
      if (event.origin !== PORTAL_URL) return;
      var data = event.data;
      if (!data) return;
      if (data.type === 'PORTAL_SESSION_STATE') {
        applySession(data);
      } else if (data.type === 'PORTAL_TOAST') {
        showToast(elToasts, data.toastType, data.message);
      }
    });

    // -- Ping on iframe load --
    bridge.addEventListener('load', function () {
      setTimeout(pingBridge, 500);
    });

    // -- Ping again on full page load (catches race conditions) --
    window.addEventListener('load', function () {
      setTimeout(pingBridge, 800);
    });

    console.log('[qp-widget] Initialized.');
  }

  // -- Wait for both the widget's HTML markup and getBackendUrl() (from
  // portal-url.js) to be present before doing anything. Handles the script
  // tag loading/running before either dependency exists on the page yet. --
  function isReady() {
    return !!document.getElementById('qp-bridge') && typeof getBackendUrl === 'function';
  }

  function waitUntilReady(attemptsLeft) {
    if (isReady()) {
      initWidget();
      return;
    }
    if (attemptsLeft <= 0) {
      console.error(
        '[qp-widget] Widget never became ready. Missing: ' +
        (document.getElementById('qp-bridge') ? '' : '#qp-bridge element on page; ') +
        (typeof getBackendUrl === 'function' ? '' : 'getBackendUrl() (portal-url.js not loaded yet or failed).')
      );
      return;
    }
    setTimeout(function () { waitUntilReady(attemptsLeft - 1); }, 50);
  }

  waitUntilReady(60); // retries for up to ~3s

})();

console.log('[qp-widget] Script loaded.');
