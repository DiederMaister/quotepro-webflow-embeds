  
// site-wide function for the shopping basket for configurator-items
    
(function () {
  let basketCounterEl = null;

  // --- storage helpers (directly use 'basketItems') ---
  function getBasket() {
    try {
      const raw = localStorage.getItem('basketItems');
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      // normalize to { configurationId: string, count: number }
      return arr
        .map(it => ({
          configurationId: it && it.configurationId != null ? String(it.configurationId) : '',
          count: Number(it && it.count != null ? it.count : 0)
        }))
        .filter(it => it.configurationId && it.count >= 0);
    } catch {
      return [];
    }
  }

  function setBasket(arr) {
    try { localStorage.setItem('basketItems', JSON.stringify(arr || [])); } catch {}
  }

  function ensureBasket() {
    // Initialize/normalize once per page
    setBasket(getBasket());
  }

  // --- counter ---
  function sumCounts(items) {
    return items.reduce((sum, it) => sum + (Number(it.count) || 0), 0);
  }

  function updateBasketCounter() {
    const total = sumCounts(getBasket());
    if (!basketCounterEl) basketCounterEl = document.getElementById('basketCounter');
    if (basketCounterEl) basketCounterEl.textContent = String(total);
  }

  // --- boot ---
  function boot() {
    basketCounterEl = document.getElementById('basketCounter');
    ensureBasket();
    updateBasketCounter();
    // expose for later steps
    window.updateBasketCounter = updateBasketCounter;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-run after Webflow re-inits (e.g., interactions)
  if (window.Webflow && Array.isArray(window.Webflow)) {
    window.Webflow.push(() => { updateBasketCounter(); });
  }

  // Optional: keep in sync across multiple tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'basketItems') updateBasketCounter();
  });
})();



