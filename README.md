# QuotePro Webflow Embeds

Source of truth for the JavaScript embedded on the TreeSpoke storefront
(Webflow): the session bridge / login modal widget, and the portal deep-link
buttons.

**This is not loaded via `<script src>` from GitHub or a CDN.** jsDelivr's
GitHub mirror proved unreliable for this repo — it repeatedly served stale
content well after a successful cache purge, with no reliable way to force
a refresh. Instead, this repo is a versioned copy you paste directly into
Webflow's custom code whenever you deploy a change.

## Files

- `portal-url.js` — `getBackendUrl()`, decides staging vs. production portal
  URL based on the current storefront hostname. Both files below depend on
  it, so it must be pasted in first wherever either of them is pasted.
- `session-bridge-widget.js` — the login widget: hidden bridge iframe, login
  modal, sign-out, relayed toast notifications, and its own "Open portal"
  link. Builds and injects all of its own HTML at runtime — no markup needs
  to live in Webflow. If a `#qp-widget-mount` element is present on the
  page, the "Log in" / signed-in user UI is injected there; otherwise it's
  appended to `<body>`. Usually pasted once, e.g. in the nav (or site-wide
  if you want it on every page).
- `portal-deeplinks.js` — powers `data-qp-portal-link` buttons (see below).
  Independent of `session-bridge-widget.js` (has its own hidden bridge
  iframe) so it works on pages that don't have the login widget at all.
  Meant to be pasted **site-wide**, so any page can have a working "open the
  portal, signed in" button without needing the full widget too.

## Deploying a change

1. Edit the file(s) here, commit, push (keeps history/review in git).
2. Copy `portal-url.js`'s contents into Webflow's site-level custom code
   (Project Settings → Custom Code → Footer Code), as its own
   `<script>...</script>` block, first.
3. Copy `portal-deeplinks.js`'s contents into the same site-level footer
   code box, as a second `<script>...</script>` block, right after
   `portal-url.js`. This gives every page working deep-link buttons.
4. Copy `session-bridge-widget.js`'s contents wherever you want the login
   widget itself to appear (a page-level embed, or also site-wide), as its
   own `<script>...</script>` block. It also depends on `portal-url.js`
   already being loaded on that page.
5. Publish the Webflow site.

Optionally, place `<div id="qp-widget-mount"></div>` wherever on the page you
want the "Log in" / signed-in user UI to appear (e.g. in the nav bar). If
omitted, it's appended to the end of `<body>` instead.

## Linking any button to the portal, already signed in

Add `data-qp-portal-link` to any button or link anywhere on the site (via a
Custom Attribute in the Webflow Designer - no code needed) and it opens the
portal in a new tab, already signed in. Works on any page with
`portal-deeplinks.js` loaded, regardless of whether the login widget is also
on that page. If the visitor isn't signed in yet, it opens the portal's own
sign-in page instead.

Add `data-qp-path="/some/portal/path"` to land on a specific page instead of
the dashboard, e.g. for a "My saved designs" button:

```html
<a data-qp-portal-link data-qp-path="/client/my-designs/configurations">My saved designs</a>
```

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
