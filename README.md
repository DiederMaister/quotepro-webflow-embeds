# QuotePro Webflow Embeds

Source of truth for JavaScript pasted into the TreeSpoke storefront's
(Webflow) custom code. Several unrelated snippets live in this repo — this
file is just an index; each has its own docs where noted below.

**None of these are loaded via `<script src>` from GitHub or a CDN** -
jsDelivr's GitHub mirror proved unreliable for this repo (repeatedly served
stale content well after a successful cache purge, with no reliable way to
force a refresh). Instead, this repo is a versioned copy: edit here, commit,
then paste the updated file's contents directly into Webflow's custom code.

This repo is intentionally public — none of this code contains secrets, and
it's already fully visible via view-source on the live storefront anyway.

## Scripts

- **`portal-url.js` + `session-bridge-widget.js`** — the session bridge /
  login modal widget: portal auth state, sign-out, chat toasts, deep-link
  buttons, cart/message counters, and more, for the whole storefront.
  See [session-bridge-widget.md](session-bridge-widget.md) for full docs.

- **`SiteFooter_CountrySelection.js`** — remembers the visitor's selected
  country/region (`#countrySelector` / `#regionSelector`) via localStorage.
  Site-wide footer code.

- **`SiteFooter_MaterialComparison.js`** — tracks up to 3 materials selected
  for the material comparison page, via localStorage (`compareMaterials`).
  Site-wide footer code.

- **`SiteFooter_ShoppingBasket_legacy.js`** — legacy shopping basket for
  configurator items, via localStorage (`basketItems`). Site-wide footer
  code. Named `_legacy` - check whether this is still the active basket
  implementation before editing.
