console.log('[qp-widget] Script loading...');

(function () {
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

  var STORE_ORIGIN = window.location.origin;
  var PORTAL_URL;   // set once getBackendUrl() is confirmed available, see initWidget()

  // -- Minimal toast renderer for messages relayed from the portal --
  var TOAST_COLORS = {
    success: '#16a34a',
    error:   '#dc2626',
    warning: '#d97706',
    info:    '#2563eb',
    message: '#374151'
  };

  function showToast(kind, message) {
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
    // PORTAL_URL comes from getBackendUrl(), loaded separately (see portal-url.js).
    // Update the preview/production URLs there, not here.
    PORTAL_URL = getBackendUrl();

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

    document.getElementById('qp-login-btn').addEventListener('click', openModal);
    document.getElementById('qp-modal-close').addEventListener('click', closeModal);
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
        showToast(data.toastType, data.message);
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
  }

  // -- Wait for getBackendUrl() (loaded from portal-url.js) to exist before starting --
  function waitForBackendUrl(attemptsLeft) {
    if (typeof getBackendUrl === 'function') {
      initWidget();
      return;
    }
    if (attemptsLeft <= 0) {
      console.error('[qp-widget] getBackendUrl() never became available. Check that portal-url.js loads before this script.');
      return;
    }
    setTimeout(function () { waitForBackendUrl(attemptsLeft - 1); }, 50);
  }

  waitForBackendUrl(40); // retries for up to ~2s

})();

console.log('[qp-widget] Script loaded.');
