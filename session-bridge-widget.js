// SOURCE OF TRUTH for the Webflow storefront's session bridge / login widget.
// Not loaded via <script src> - jsDelivr's GitHub mirror proved unreliable
// (repeatedly served stale content well after a successful cache purge, with
// no reliable way to force a refresh). Paste this file's contents directly
// into Webflow's custom code (inline <script> tag) whenever you deploy a
// change here. Keep portal-url.js's contents pasted in as its own <script>
// tag immediately before this one - load order matters.
//
// Paste this SITE-WIDE (Project Settings -> Custom Code -> Footer Code),
// not just on one page. It's the single source of session state for the
// whole storefront: the visible login UI, sign-out, chat toasts, and any
// data-qp-portal-link deep-link button anywhere on the site all depend on
// the one hidden bridge iframe this script creates. A page-level embed
// would mean deep-link buttons only work on pages that happen to also have
// the embed - see "Linking any button to the portal" in the README.
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

  // -- Toast renderer matching the portal's actual sonner styling --
  // Portal always shows toasts with the same accent-blue bg / white text
  // (bg-accent/text-accent-foreground override, no per-type colors) and
  // Tailwind shadow-2xl - see src/components/ui/sonner.tsx. Icon SVGs and
  // base layout (padding, radius, font-size, gap) copied from sonner's own
  // default styles.css / icon defs so this matches pixel-for-pixel.
  var TOAST_ICONS = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"/></svg>',
    // lucide MessageCircle, matching the icon the portal's own chat toast uses
    message: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>'
  };

  // `chat`, when present, is { sender, subject, preview, conversationUrl } -
  // renders the same rich card the portal's own chat notifications use
  // (see src/hooks/useMessageNotifications.tsx) instead of a plain one-liner.
  function showToast(elToasts, kind, message, chat) {
    var el = document.createElement('div');
    el.style.cssText =
      'pointer-events:auto; display:flex; gap:8px;' +
      'padding:16px; background:hsl(210,100%,50%); color:#fff;' +
      'border:1px solid hsl(210,100%,50%); border-radius:8px;' +
      'box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);' +
      'font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;' +
      'font-size:13px; line-height:1.5;' +
      'opacity:0; transform:translateY(16px); transition:transform 400ms, opacity 400ms;' +
      (chat ? 'flex-direction:column; align-items:flex-start;' : 'align-items:center;');

    var icon = TOAST_ICONS[kind];

    if (chat) {
      var header = document.createElement('div');
      header.style.cssText = 'display:flex; align-items:center; gap:8px;';
      if (icon) {
        var headerIconWrap = document.createElement('span');
        headerIconWrap.style.cssText = 'display:flex; flex-shrink:0;';
        headerIconWrap.innerHTML = icon;
        header.appendChild(headerIconWrap);
      }
      var senderEl = document.createElement('span');
      senderEl.style.cssText = 'font-weight:600; font-size:14px;';
      senderEl.textContent = chat.sender;
      header.appendChild(senderEl);
      el.appendChild(header);

      if (chat.subject) {
        var subjectEl = document.createElement('div');
        subjectEl.style.cssText = 'font-size:12px; opacity:0.8;';
        subjectEl.textContent = 'RE: ' + chat.subject;
        el.appendChild(subjectEl);
      }

      var previewEl = document.createElement('div');
      previewEl.style.cssText = 'font-size:14px; opacity:0.9;';
      previewEl.textContent = chat.preview;
      el.appendChild(previewEl);

      if (chat.conversationUrl) {
        var link = document.createElement('a');
        link.href = chat.conversationUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'View conversation →';
        link.style.cssText = 'font-size:12px; opacity:0.8; color:#fff; text-decoration:underline; margin-top:4px;';
        el.appendChild(link);
      }
    } else {
      if (icon) {
        var iconWrap = document.createElement('span');
        iconWrap.style.cssText = 'display:flex; flex-shrink:0;';
        iconWrap.innerHTML = icon;
        el.appendChild(iconWrap);
      }
      var text = document.createElement('span');
      text.textContent = message;
      el.appendChild(text);
    }

    elToasts.appendChild(el);

    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      setTimeout(function () { el.remove(); }, 400);
    }, chat ? 10000 : 4000); // chat toasts carry more to read, matches the portal's own duration
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
    // Matches sonner's default bottom-right toaster: 32px offset, 14px gap
    // between stacked toasts, 356px width, very high z-index.
    elToasts.style.cssText = 'position:fixed; bottom:32px; right:32px; z-index:999999999; display:flex; flex-direction:column; gap:14px; width:356px; max-width:calc(100vw - 64px); pointer-events:none;';
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
    var currentSessionData = null;
    // Path the visitor was trying to reach when openPortal() was called
    // while unauthenticated (or while a revalidation was in flight) - once
    // applySession sees an authenticated state, this gets opened and cleared.
    var pendingPortalPath = null;

    bridge.src = PORTAL_URL + '/session-bridge?widget_origin=' + encodeURIComponent(STORE_ORIGIN);
    elLink.href = PORTAL_URL; // fallback for right-click/middle-click before JS/session loads

    // Builds a deep link into the portal that arrives already signed in
    // (via /auth/bridge-login, see applySession below), landing on `path`.
    // Returns null if there's no active session to carry over.
    function buildPortalUrl(path) {
      if (!currentSessionData || currentSessionData.status !== 'authenticated' || !currentSessionData.session_tokens) {
        return null;
      }
      return PORTAL_URL + '/auth/bridge-login#access_token=' +
        encodeURIComponent(currentSessionData.session_tokens.access_token) +
        '&refresh_token=' + encodeURIComponent(currentSessionData.session_tokens.refresh_token) +
        '&next=' + encodeURIComponent(path);
    }

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

    // Entry point for "open the portal at `path`, signed in" - used by both
    // this widget's own "Open portal" link and any data-qp-portal-link
    // button elsewhere on the page (see bindPortalLinkButtons below).
    //
    // Locally-cached session state alone isn't trustworthy here: the
    // customer may have explicitly signed out in a separate portal tab
    // since we last heard from the bridge, and we don't want to hand a
    // now-invalid session over to a new tab. So an authenticated-looking
    // click still round-trips through the bridge for a server-checked
    // REQUEST_SESSION_STATE_VALIDATED before actually opening anything;
    // applySession() below is what acts on the (possibly revised) answer.
    function openPortal(path) {
      pendingPortalPath = path;
      if (currentSessionData && currentSessionData.status === 'authenticated') {
        try {
          bridge.contentWindow.postMessage({ type: 'REQUEST_SESSION_STATE_VALIDATED' }, PORTAL_URL);
        } catch (e) {}
      } else {
        openModal();
      }
    }

    // Wires up any button/link elsewhere on the page carrying
    // data-qp-portal-link, so it opens the portal already signed in -
    // e.g. <a data-qp-portal-link data-qp-path="/client/my-designs/configurations">
    // for a "My saved designs" button. No page-specific code needed per
    // button; just add the attribute in the Webflow Designer.
    function bindPortalLinkButtons() {
      var els = document.querySelectorAll('[data-qp-portal-link]');
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          if (el.getAttribute('data-qp-bound')) return;
          el.setAttribute('data-qp-bound', '1');
          el.addEventListener('click', function (e) {
            e.preventDefault();
            openPortal(el.getAttribute('data-qp-path') || '/dashboard');
          });
        })(els[i]);
      }
    }

    // -- Update widget UI --
    function applySession(data) {
      currentSessionData = data;
      elLoading.style.display  = 'none';
      if (data.status === 'authenticated') {
        elAuthed.style.display   = 'flex';
        elUnauthed.style.display = 'none';
        elName.textContent = data.user.display_name || data.user.email || 'User';
        closeModal();
        if (pendingPortalPath) {
          var path = pendingPortalPath;
          pendingPortalPath = null;
          var url = buildPortalUrl(path);
          if (url) window.open(url, '_blank');
        }
      } else {
        elAuthed.style.display   = 'none';
        elUnauthed.style.display = 'block';
        // Revalidation found the session no longer valid (e.g. signed out
        // on the portal) while a deep-link click was pending - prompt for
        // sign-in instead of silently dropping what the customer wanted.
        if (pendingPortalPath) {
          openModal();
        }
      }
      bindPortalLinkButtons();
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
    elLink.addEventListener('click', function (e) {
      e.preventDefault();
      openPortal('/dashboard');
    });
    bindPortalLinkButtons();

    // -- Listen for messages from the portal (bridge iframe or signin iframe) --
    window.addEventListener('message', function (event) {
      if (event.origin !== PORTAL_URL) {
        console.log('[qp-widget] Ignoring message from unexpected origin', event.origin, 'expected', PORTAL_URL);
        return;
      }
      var data = event.data;
      if (!data) return;
      if (data.type === 'PORTAL_SESSION_STATE') {
        applySession(data);
      } else if (data.type === 'PORTAL_TOAST') {
        console.log('[qp-widget] Received PORTAL_TOAST, rendering:', data.toastType, data.message);
        showToast(elToasts, data.toastType, data.message, data.chat);
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
