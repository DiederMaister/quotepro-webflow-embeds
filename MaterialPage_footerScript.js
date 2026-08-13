<script>
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'compareMaterials';

  function getSelected() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveSelected(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 3)));
  }

  // Webflow CMS slug injection — wrap in quotes to make it a string
  const currentSlug = '{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}'.trim();
  console.log("🔎 currentMaterial slug:", currentSlug || "(none)");

  const buttons = document.querySelectorAll('a.comparematerialbutton[data-slug]');
  if (!buttons.length) {
    console.warn('No .comparematerialbutton elements found on page');
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const altSlug = btn.dataset.slug ? btn.dataset.slug.trim() : "";
      console.log("👉 compare click | current:", currentSlug, "| comparison:", altSlug);

      if (!currentSlug || !altSlug) {
        console.warn("Missing slug(s) — aborting save.");
        return;
      }

      let items = getSelected().filter(s => s !== currentSlug && s !== altSlug);
      items.unshift(currentSlug, altSlug);
      saveSelected(items);

      console.log("💾 compareMaterials (saved):", getSelected());

      // Redirect to target page
      const href = btn.getAttribute('href') || '/compare';
      setTimeout(() => { window.location.href = href; }, 0);
    });
  });
});
</script>
