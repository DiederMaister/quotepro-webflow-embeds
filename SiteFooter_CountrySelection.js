//Set & Remember Country Selection
// belongs in site footer

  document.addEventListener("DOMContentLoaded", function () {
    const countrySelect = document.getElementById("countrySelector");
    const regionSelect = document.getElementById("regionSelector");

    if (!regionSelect) {
      console.log("🚫 Region selector not found on page");
      return;
    }

    // Cache all region options
    const allRegionOptions = Array.from(regionSelect.options);

    // Load saved selections
    const savedCountry = localStorage.getItem("userCountry");
    const savedRegion = localStorage.getItem("userRegion");

    if (savedCountry && countrySelect) {
      countrySelect.value = savedCountry;
      console.log("🌍 Loaded saved country from localStorage:", savedCountry);
    }

    if (countrySelect) {
      filterRegionsByCountry(savedCountry || countrySelect.value);
    }

    if (savedRegion && regionSelect.querySelector(`option[value="${savedRegion}"]`)) {
      regionSelect.value = savedRegion;
      regionSelect.classList.remove("error");
      console.log("✅ Loaded saved region from localStorage:", savedRegion);
    } else {
      regionSelect.value = "noSelection";
      regionSelect.classList.add("error");
      console.log("⚠️ No valid saved region found – defaulting to noSelection");
    }

    // Handle region changes
    regionSelect.addEventListener("change", function () {
      const selectedRegion = regionSelect.value;

      if (selectedRegion && selectedRegion !== "noSelection") {
        localStorage.setItem("userRegion", selectedRegion);
        regionSelect.classList.remove("error");
        console.log("📝 Region selected and saved:", selectedRegion);
      } else {
        localStorage.removeItem("userRegion");
        regionSelect.classList.add("error");
        console.log("❌ Region selection cleared");
      }
    });

    // Handle country changes
    if (countrySelect) {
      countrySelect.addEventListener("change", function () {
        const selectedCountry = countrySelect.value;
        localStorage.setItem("userCountry", selectedCountry);
        console.log("🌍 Country selected and saved:", selectedCountry);

        filterRegionsByCountry(selectedCountry);

        // Reset region to 'Set your region' placeholder
        regionSelect.value = "noSelection";
        regionSelect.classList.add("error");
        localStorage.removeItem("userRegion");
        regionSelect.dispatchEvent(new Event("change")); // Trigger logic
      });
    }

    // Filter region options based on country and always keep the "noSelection" option
    function filterRegionsByCountry(selectedCountry) {
      // Save the first static "Set your region" option
      const placeholderOption = allRegionOptions.find(opt => opt.value === "noSelection");

      // Clear current options
      regionSelect.innerHTML = "";

      // Add placeholder first
      if (placeholderOption) {
        regionSelect.appendChild(placeholderOption);
      }

      // Add matching regions
      allRegionOptions.forEach(option => {
        const countryAttr = option.getAttribute("data-country");
        const isValidRegion = option.value !== "noSelection";

        if (isValidRegion && (!selectedCountry || countryAttr === selectedCountry)) {
          regionSelect.appendChild(option);
        }
      });
    }
  });




