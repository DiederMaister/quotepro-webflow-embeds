# QuotePro Webflow Embeds

JavaScript served to the TreeSpoke storefront (Webflow) via jsDelivr, so the
session bridge / login modal widget can be updated by pushing here instead of
editing inline custom code in the Webflow Designer and republishing.

## Files

- `portal-url.js` — `getBackendUrl()`, decides staging vs. production portal URL
  based on the current storefront hostname. Load this first.
- `session-bridge-widget.js` — the session bridge widget logic: hidden bridge
  iframe, login modal, sign-out, and relayed toast notifications. Depends on
  `getBackendUrl()` already being defined, and on the HTML markup below
  already being present in the page.

## Usage in Webflow

In the page/site custom code where the widget currently lives, keep the HTML
markup (the `#qp-widget`, `#qp-bridge` iframe, login modal, and
`#qp-toast-container` elements) inline, and replace the two `<script>...</script>`
blocks with:

```html
<script src="https://cdn.jsdelivr.net/gh/DiederMaister/quotepro-webflow-embeds@main/portal-url.js"></script>
<script src="https://cdn.jsdelivr.net/gh/DiederMaister/quotepro-webflow-embeds@main/session-bridge-widget.js"></script>
```

Order matters — `portal-url.js` must load before `session-bridge-widget.js`.

## Cache purging

jsDelivr caches `@main`-referenced files for up to ~12h. A GitHub Action
(`.github/workflows/purge-jsdelivr.yml`) automatically purges the CDN cache
for both files on every push to `main`, so changes are live within seconds
instead of waiting on the cache TTL.

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
