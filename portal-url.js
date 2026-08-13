// Last updated: 2026-08-13
console.log('[portal-url] Script loading...');

// Portal URL: preview / production based on current Webflow environment
// Webflow preview + "test" domains -> staging portal
// Production domain -> production portal
//
// Both are CNAME records pointing at Vercel deployments, which auto-deploy
// on every GitHub push: test-portal.treespoke.com tracks the `working`
// branch, portal.treespoke.com tracks `main`. They currently share the
// same Supabase project - no data isolation between test and production.
function getBackendUrl() {
  var hostname = window.location.hostname;

  var isPreview = hostname.indexOf('webflow.io') !== -1
    || hostname === 'localhost'
    || hostname.indexOf('test') !== -1;

  return isPreview
    ? 'https://test-portal.treespoke.com'
    : 'https://portal.treespoke.com';
}

console.log('[portal-url] Script loaded. Backend URL for this host:', getBackendUrl());
