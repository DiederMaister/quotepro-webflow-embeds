# QuotePro Webflow Embeds

Source of truth for the JavaScript embedded on the TreeSpoke storefront
(Webflow): the session bridge / login modal widget, which is also the single
source of portal auth state for the whole storefront (login UI, sign-out,
chat toasts, and any deep-link button).

**This is not loaded via `<script src>` from GitHub or a CDN.** jsDelivr's
GitHub mirror proved unreliable for this repo — it repeatedly served stale
content well after a successful cache purge, with no reliable way to force
a refresh. Instead, this repo is a versioned copy you paste directly into
Webflow's custom code whenever you deploy a change.

## Files

- `portal-url.js` — `getBackendUrl()`, decides staging vs. production portal
  URL based on the current storefront hostname. Paste this in first.
- `session-bridge-widget.js` — hidden bridge iframe, login modal, sign-out,
  relayed toast notifications, its own "Open portal" link, and
  `data-qp-portal-link` deep-link buttons anywhere on the page (see below).
  Builds and injects all of its own HTML at runtime — no markup needs to
  live in Webflow. If a `#qp-widget-mount` element is present on the page,
  the "Log in" / signed-in user UI is injected there; otherwise it's
  appended to `<body>`.

  **Paste this site-wide** (Project Settings → Custom Code → Footer Code),
  not just on one page — it's the only thing that fetches session state, so
  a page without it has no working login UI and no working deep-link
  buttons, even if one is present on the page markup.

## Deploying a change

1. Edit the file(s) here, commit, push (keeps history/review in git).
2. Copy `portal-url.js`'s contents into Webflow's site-level custom code
   (Project Settings → Custom Code → Footer Code), as its own
   `<script>...</script>` block, first.
3. Copy `session-bridge-widget.js`'s contents into the same footer code box,
   as a second `<script>...</script>` block, right after `portal-url.js`.
4. Publish the Webflow site.

Optionally, place `<div id="qp-widget-mount"></div>` wherever on the page you
want the "Log in" / signed-in user UI to appear (e.g. in the nav bar). If
omitted, it's appended to the end of `<body>` instead.

## Linking any button to the portal, already signed in

Add `data-qp-portal-link` to any button or link anywhere on the site (via a
Custom Attribute in the Webflow Designer - no code needed) and it opens the
portal in a new tab, already signed in.

If the visitor isn't signed in yet, clicking it opens the same login modal
the widget itself uses, waits for a successful sign-in, then opens the
deep link — the visitor never ends up authenticated in the portal without
also being "authenticated" on the storefront (that's the whole reason this
lives in one site-wide script instead of talking to the portal directly).

If the visitor *looks* signed in locally but actually signed out from a
separate portal tab since the storefront last checked, clicking re-validates
with the portal first rather than trusting the stale local state - if that
comes back signed-out, it prompts sign-in again instead of carrying over a
dead session.

Add `data-qp-path="/some/portal/path"` to land on a specific page instead of
the dashboard, e.g. for a "My saved designs" button:

```html
<a data-qp-portal-link data-qp-path="/client/my-designs/configurations">My saved designs</a>
```

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
