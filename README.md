# QuotePro Webflow Embeds

Source of truth for the JavaScript embedded on the TreeSpoke storefront
(Webflow): the session bridge / login modal widget.

**This is not loaded via `<script src>` from GitHub or a CDN.** jsDelivr's
GitHub mirror proved unreliable for this repo — it repeatedly served stale
content well after a successful cache purge, with no reliable way to force
a refresh. Instead, this repo is a versioned copy you paste directly into
Webflow's custom code whenever you deploy a change.

## Files

- `portal-url.js` — `getBackendUrl()`, decides staging vs. production portal
  URL based on the current storefront hostname. Paste this in first.
- `session-bridge-widget.js` — the session bridge widget: hidden bridge
  iframe, login modal, sign-out, and relayed toast notifications. Builds and
  injects all of its own HTML at runtime — no markup needs to live in
  Webflow. If a `#qp-widget-mount` element is present on the page, the
  "Log in" / signed-in user UI is injected there; otherwise it's appended to
  `<body>`. Depends on `getBackendUrl()` already being defined, so must be
  pasted in *after* `portal-url.js`.

## Deploying a change

1. Edit the file(s) here, commit, push (keeps history/review in git).
2. Copy the full contents of `portal-url.js`, paste into Webflow's custom
   code as its own `<script>...</script>` block.
3. Copy the full contents of `session-bridge-widget.js`, paste as a second
   `<script>...</script>` block, immediately after the first.
4. Publish the Webflow site.

Optionally, place `<div id="qp-widget-mount"></div>` wherever on the page you
want the "Log in" / signed-in user UI to appear (e.g. in the nav bar). If
omitted, it's appended to the end of `<body>` instead.

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
