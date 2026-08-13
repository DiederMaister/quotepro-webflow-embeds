  document.addEventListener("DOMContentLoaded", function () {
    const regionSelector = document.getElementById("regionSelector");
    const regionMessage = document.getElementById("setRegionReminder");

    function checkAndHideMessage() {
      const userRegion = localStorage.getItem("userRegion");

      if (userRegion && regionMessage) {
        regionMessage.style.display = "none";
        console.log("🫥 Hiding element because userRegion is set:", userRegion);
      } else if (regionMessage) {
        regionMessage.style.display = "block";
        console.log("👀 Showing element — userRegion not set.");
      }
    }

    // Run on initial load
    checkAndHideMessage();

    // Run whenever regionSelector changes
    if (regionSelector) {
      regionSelector.addEventListener("change", () => {
        // Wait a tick in case another script is setting localStorage
        setTimeout(() => {
          checkAndHideMessage();
        }, 0);
      });
    }
  });
