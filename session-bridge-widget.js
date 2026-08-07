// SOURCE OF TRUTH for the Webflow storefront's session bridge / login widget.
// Not loaded via <script src> - jsDelivr's GitHub mirror proved unreliable
// (repeatedly served stale content well after a successful cache purge, with
// no reliable way to force a refresh). Paste this file's contents directly
// into Webflow's custom code (inline <script> tag) whenever you deploy a
// change here. Keep portal-url.js's contents pasted in as its own <script>
// tag immediately before this one - load order matters.
//
// This script builds and injects all of its own HTML (bridge iframe, login
// modal, toast container, widget UI) - no markup needs to exist in Webflow.
// If a #qp-widget-mount element is present on the page, the "Log in" /
// signed-in user UI is injected there; otherwise it's appended to <body>.
// Everything else (hidden bridge iframe, modal, toast container) is always
// appended to <body> since they're fixed-position/hidden and don't need a
// specific spot in the page layout.

console.log('[qp-widget] Script loading...');

(function () {
  var WIDGET_HTML =
    '<div id="qp-loading" style="color:#888; font-size:14px;">Checking session…</div>' +
    '<div id="qp-authed" style="display:none; align-items:center; gap:12px;">' +
      '<span style="font-size:14px;">👤 <strong id="qp-name"></strong></span>' +
      '<a id="qp-portal-link" href="" target="_blank" style="font-size:13px; color:#2563eb; text-decoration:none;">Open portal →</a>' +
      '<button id="qp-logout-btn" style="padding:4px 10px; background:none; color:#6b7280; border:1px solid #d1d5db; border-radius:6px; cursor:pointer; font-size:13px;">Sign out</button>' +
    '</div>' +
    '<div id="qp-unauthed" style="display:none;">' +
      '<button id="qp-login-btn" style="padding:8px 16px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px;">Log in to portal</button>' +
    '</div>';

  var MODAL_HTML =
    '<div style="background:#fff; border-radius:12px; overflow:hidden; width:min(480px, 95vw); height:min(640px, 90vh); display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #e5e7eb;">' +
        '<span style="font-weight:600; font-size:15px;">Log in to portal</span>' +
        '<button id="qp-modal-close" style="background:none; border:none; cursor:pointer; font-size:20px; color:#6b7280; line-height:1;">✕</button>' +
      '</div>' +
      '<iframe id="qp-signin-frame" src="" style="flex:1; border:none; width:100%;" allow="storage-access"></iframe>' +
    '</div>';

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

  // -- Build and inject all widget markup, return references to what we need --
  function buildDOM() {
    var mount = document.getElementById('qp-widget-mount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'qp-widget-mount';
      document.body.appendChild(mount);
    }
    mount.style.fontFamily = 'sans-serif';
    mount.innerHTML = WIDGET_HTML;

    var bridge = document.createElement('iframe');
    bridge.id = 'qp-bridge';
    bridge.src = '';
    bridge.setAttribute('allow', 'storage-access');
    bridge.style.cssText = 'display:none; width:0; height:0; border:none;';
    document.body.appendChild(bridge);

    var elModal = document.createElement('div');
    elModal.id = 'qp-modal-bg';
    elModal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;';
    elModal.innerHTML = MODAL_HTML;
    document.body.appendChild(elModal);

    var elToasts = document.createElement('div');
    elToasts.id = 'qp-toast-container';
    elToasts.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:8px; font-family:sans-serif; pointer-events:none;';
    document.body.appendChild(elToasts);

    return {
      bridge:        bridge,
      elLoading:     document.getElementById('qp-loading'),
      elAuthed:      document.getElementById('qp-authed'),
      elUnauthed:    document.getElementById('qp-unauthed'),
      elName:        document.getElementById('qp-name'),
      elLink:        document.getElementById('qp-portal-link'),
      elLogoutBtn:   document.getElementById('qp-logout-btn'),
      elModal:       elModal,
      elSignin:      document.getElementById('qp-signin-frame'),
      elToasts:      elToasts,
      elLoginBtn:    document.getElementById('qp-login-btn'),
      elModalClose:  document.getElementById('qp-modal-close')
    };
  }

  function initWidget() {
    var els = buildDOM();
    var bridge      = els.bridge;
    var elLoading   = els.elLoading;
    var elAuthed    = els.elAuthed;
    var elUnauthed  = els.elUnauthed;
    var elName      = els.elName;
    var elLink      = els.elLink;
    var elLogoutBtn = els.elLogoutBtn;
    var elModal     = els.elModal;
    var elSignin    = els.elSignin;
    var elToasts    = els.elToasts;
    var elLoginBtn  = els.elLoginBtn;
    var elModalClose = els.elModalClose;

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

  // -- Wait for getBackendUrl() (from portal-url.js) and document.body to be
  // ready before building/injecting anything. --
  function isReady() {
    return !!document.body && typeof getBackendUrl === 'function';
  }

  function waitUntilReady(attemptsLeft) {
    if (isReady()) {
      initWidget();
      return;
    }
    if (attemptsLeft <= 0) {
      console.error(
        '[qp-widget] Widget never became ready. Missing: ' +
        (document.body ? '' : 'document.body; ') +
        (typeof getBackendUrl === 'function' ? '' : 'getBackendUrl() (portal-url.js not loaded yet or failed).')
      );
      return;
    }
    setTimeout(function () { waitUntilReady(attemptsLeft - 1); }, 50);
  }

  waitUntilReady(60); // retries for up to ~3s

})();

console.log('[qp-widget] Script loaded.');
