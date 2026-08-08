// SOURCE OF TRUTH for "open the portal, already signed in" buttons that can
// live ANYWHERE on the storefront - not just next to the session bridge
// login widget (session-bridge-widget.js). Paste this as its own <script>
// block in Webflow's SITE-LEVEL custom code (Project Settings -> Custom
// Code -> Footer Code), so every page gets it regardless of whether the
// login widget itself is present there. Depends on getBackendUrl()
// (portal-url.js), which must load first.
//
// Deliberately has its own hidden bridge iframe rather than reusing
// session-bridge-widget.js's - this script has to work standalone on pages
// that don't have the widget at all, and coupling the two would make load
// order across separate custom-code boxes matter. The minor cost is a
// second hidden iframe (and session fetch) on pages that do have both.
//
// Usage: add a `data-qp-portal-link` attribute to any button or link (a
// Webflow Custom Attribute, no code needed) and it opens the portal in a
// new tab, already signed in. Add `data-qp-path="/some/portal/path"` to
// land somewhere other than the dashboard, e.g.:
//   <a data-qp-portal-link data-qp-path="/client/my-designs/configurations">My saved designs</a>
// If the visitor isn't signed in, it opens the portal's own sign-in page
// instead, with a return path back to where it meant to go.

console.log('[qp-deeplinks] Script loading...');

(function () {
  var STORE_ORIGIN = window.location.origin;
  // PORTAL_URL comes from getBackendUrl(), loaded separately (see portal-url.js).
  // Update the preview/production URLs there, not here.
  var PORTAL_URL = getBackendUrl();
  var currentSessionData = null;

  var bridge = document.createElement('iframe');
  bridge.id = 'qp-deeplinks-bridge';
  bridge.src = PORTAL_URL + '/session-bridge?widget_origin=' + encodeURIComponent(STORE_ORIGIN);
  bridge.setAttribute('allow', 'storage-access');
  bridge.style.cssText = 'display:none; width:0; height:0; border:none;';
  document.body.appendChild(bridge);

  function pingBridge() {
    try {
      bridge.contentWindow.postMessage({ type: 'REQUEST_SESSION_STATE' }, PORTAL_URL);
    } catch (e) {}
  }

  // Builds a deep link into the portal that arrives already signed in (via
  // /auth/bridge-login), landing on `path`. Returns null with no active session.
  function buildPortalUrl(path) {
    if (!currentSessionData || currentSessionData.status !== 'authenticated' || !currentSessionData.session_tokens) {
      return null;
    }
    return PORTAL_URL + '/auth/bridge-login#access_token=' +
      encodeURIComponent(currentSessionData.session_tokens.access_token) +
      '&refresh_token=' + encodeURIComponent(currentSessionData.session_tokens.refresh_token) +
      '&next=' + encodeURIComponent(path);
  }

  function bindPortalLinkButtons() {
    var els = document.querySelectorAll('[data-qp-portal-link]');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        if (el.getAttribute('data-qp-bound')) return;
        el.setAttribute('data-qp-bound', '1');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          var path = el.getAttribute('data-qp-path') || '/dashboard';
          var url = buildPortalUrl(path);
          if (url) {
            window.open(url, '_blank');
          } else {
            // No login modal on this page - send them to the portal's own
            // sign-in page, with a return path back to where they meant to go.
            window.open(PORTAL_URL + '/signin?returnUrl=' + encodeURIComponent(path), '_blank');
          }
        });
      })(els[i]);
    }
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== PORTAL_URL) return;
    var data = event.data;
    if (data && data.type === 'PORTAL_SESSION_STATE') {
      currentSessionData = data;
      bindPortalLinkButtons();
    }
  });

  bridge.addEventListener('load', function () {
    setTimeout(pingBridge, 500);
  });
  window.addEventListener('load', function () {
    bindPortalLinkButtons(); // bind immediately so early clicks still open sign-in
    setTimeout(pingBridge, 800);
  });

  console.log('[qp-deeplinks] Script loaded.');
})();
