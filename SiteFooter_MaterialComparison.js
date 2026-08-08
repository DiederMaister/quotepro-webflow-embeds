// Storage for Material Comparison Page
// belongs in site-wide footer code
    
    const STORAGE_KEY = 'compareMaterials';

    function getSelected() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
      catch { return []; }
    }

    function saveSelected(arr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 3)));
    }

    function addToCompare(id) {
      let items = getSelected().filter(x => x !== id);
      items.unshift(id);          // newest first
      saveSelected(items);        // trims to 3
    }

    function removeFromCompare(id) {
      saveSelected(getSelected().filter(x => x !== id));
    }

    function clearCompare() {
      localStorage.removeItem(STORAGE_KEY);
    }

