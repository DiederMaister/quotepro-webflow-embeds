// Last updated: 2026-08-08
console.log('[portal-url] Script loading...');

// Portal URL: preview / production based on current Webflow environment
// Webflow preview + "test" domains -> staging portal
// Production domain -> production portal
function getBackendUrl() {
  var hostname = window.location.hostname;

  var isPreview = hostname.indexOf('webflow.io') !== -1
    || hostname === 'localhost'
    || hostname.indexOf('test') !== -1;

  return isPreview
    ? 'https://quotepro-six.vercel.app'  // portal preview URL
    : 'https://quotepro-six.vercel.app'; // TODO: set production portal URL
}

console.log('[portal-url] Script loaded. Backend URL for this host:', getBackendUrl());
