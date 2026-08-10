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

If the visitor signed out from a separate portal tab since the storefront
last checked, the widget catches up automatically the next time the
storefront tab regains focus (the portal itself pushes the correction) - no
manual reload needed.

Add `data-qp-path="/some/portal/path"` to land on a specific page instead of
the dashboard, e.g. for a "My saved designs" button:

```html
<a data-qp-portal-link data-qp-path="/client/my-designs/configurations">My saved designs</a>
```

Add `data-qp-message="Sign in to see your designs"` to give the login modal
a reason tied to what was actually clicked, instead of a generic prompt -
shown as the signin page's header text if the visitor isn't signed in yet
(see below):

```html
<a data-qp-portal-link data-qp-path="/client/my-designs/configurations" data-qp-message="Sign in to see your designs">My saved designs</a>
```

## A plain "Sign in" / "Sign out" button (no portal redirect)

These work on any element - a `<button>`, `<a>`, `<div>`, whatever's
convenient in the Designer - since it's just an attribute with a click
listener, not tied to a specific tag.

Add `data-qp-signin` and it opens the login modal - unlike
`data-qp-portal-link`, it doesn't navigate anywhere after a successful
sign-in. The modal closes and your own `userWidget_signedIn` UI (or the
built-in one) takes over from there. Also supports `data-qp-message`, same
as `data-qp-portal-link` above.

Add `data-qp-signout` and it signs out directly - the same thing the
built-in widget's own sign-out button does.

```html
<button data-qp-signin>Sign in</button>
<button data-qp-signout>Sign out</button>
```

## Profile picture and cart count

If elements with id `userImage` (an `<img>`) and/or `cartCounter` (any text
element) exist anywhere on the page, the widget keeps them in sync with the
signed-in customer automatically - no attributes needed, just those IDs.
`userImage`'s `src` gets set to the customer's profile picture; `cartCounter`'s
text gets set to their portal cart's item count (0 while signed out). Updates
whenever session state does, including the same tab-focus check that catches
a portal-side sign-out - so switching back to the storefront after changing
your cart on the portal picks up the new count too.

## Building your own custom widget UI

Instead of relying on this script's own built-in "Log in" / signed-in UI
(the one anchored at `#qp-widget-mount`), you can build a fully custom one
in the Designer: add a wrapper div with id `userWidget`, and inside it two
divs with id `userWidget_signedIn` and `userWidget_signedOut`. Only the one
matching the current auth state is ever shown (visibility is reset to your
own CSS, not forced to a specific display value, so flex/grid/whatever
you've set up still applies). Nest whatever you want inside each - e.g.
`data-qp-portal-link` buttons inside `userWidget_signedIn` - and style it
however you like; this script never touches their contents, only whether
each div is shown.

**As soon as `#userWidget` is present anywhere on the page, the built-in
"Log in" UI is skipped entirely** - nothing gets built or injected for it,
so there's no separate floating widget competing with your own. The hidden
bridge iframe, login modal, and toast container are still created either
way; only the visible "Log in" / signed-in UI is affected.

## Why the UI updates instantly on repeat page loads

Every storefront page load re-authenticates from scratch (a fresh hidden
iframe boots the portal, which re-checks the session and re-fetches
profile/cart data) - naturally visible as a brief delay before the login
UI, `#userImage`, `#cartCounter`, etc. settle into their real state.

To avoid that being visible on every single page, the widget caches the
last known *display-only* state (signed in or not, name, profile picture,
cart count - never session tokens) in the storefront's own localStorage,
and paints it immediately on load, before the bridge iframe has even
started booting. The real bridge response, once it arrives moments later,
corrects it if anything's actually changed. Deep-link buttons and the
"Open portal" link always wait for that real response before doing
anything - the cache only ever affects what's shown, never what a button
click is allowed to do.

## Note

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.
