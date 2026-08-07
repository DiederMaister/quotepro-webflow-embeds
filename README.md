# QuotePro Webflow Embeds

JavaScript served to the TreeSpoke storefront (Webflow) via jsDelivr, so the
session bridge / login modal widget can be updated by pushing here instead of
editing inline custom code in the Webflow Designer and republishing.

## Files

- `portal-url.js` — `getBackendUrl()`, decides staging vs. production portal URL
  based on the current storefront hostname. Load this first.
- `session-bridge-widget.js` — the session bridge widget: hidden bridge iframe,
  login modal, sign-out, and relayed toast notifications. Builds and injects
  all of its own HTML at runtime — no markup needs to live in Webflow. If a
  `#qp-widget-mount` element is present on the page, the "Log in" / signed-in
  user UI is injected there; otherwise it's appended to `<body>`. The hidden
  bridge iframe, login modal, and toast container are always appended to
  `<body>` since they're fixed-position/hidden and don't need page-layout
  placement. Depends on `getBackendUrl()` already being defined.

## Usage in Webflow

Custom code needed is just two script tags:

```html
<script src="https://cdn.jsdelivr.net/gh/DiederMaister/quotepro-webflow-embeds@main/portal-url.js"></script>
<script src="https://cdn.jsdelivr.net/gh/DiederMaister/quotepro-webflow-embeds@main/session-bridge-widget.js"></script>
```

Order matters — `portal-url.js` must load before `session-bridge-widget.js`.

Optionally, place `<div id="qp-widget-mount"></div>` wherever on the page you
want the "Log in" / signed-in user UI to appear (e.g. in the nav bar). If
omitted, it's appended to the end of `<body>` instead.

## Cache purging

jsDelivr caches `@main`-referenced files for up to ~12h. A GitHub Action
(`.github/workflows/purge-jsdelivr.yml`) automatically purges the CDN cache
for both files on every push to `main`, so changes are live within seconds
instead of waiting on the cache TTL.

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
