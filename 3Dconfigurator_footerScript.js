console.log('3D app integration script loaded in webflow');


 /*
Listen to request to pass productpage URl, to validate domain in the app
Add this script to the Webflow page where the iframe is embedded, 
typically in the "Before </body> tag" section under custom code:
*/

console.log('Webflow Integration scripts sais hello!');
   
console.log('PageURL request listener is loaded on Prodct page');

window.addEventListener('message', function(event) {
    // Check if the iframe is requesting the parent URL
    if (event.data === 'requestParentUrl') {
        // Log before passing the URL back to the iframe
        console.log('Passing Parent URL to App:', window.location.href);
        // Send back the parent page's URL
        event.source.postMessage(window.location.href, event.origin);
    }
});
    
    
// Helper function to get current Page URL without parameters       
function getPageUrl() {
    const url = new URL(window.location.href);
    return url.origin + url.pathname; // Combine origin and pathname
}

    
// Get current Page URL
const pageUrl = getPageUrl();
    

/*
Listens to 3D app checkout buttons and triggers a popup in the product page
Add this script to the Webflow Product page
*/
    
const RfqForm = 'https://forms.fillout.com/t/4nDqVcCaH5us';
const BACKEND_URL = getBackendUrl(); // customer portal preview or production URL
const CART_PAGE = BACKEND_URL + '/cart';


console.log('Checkout Popup Listener initiated');
    
//Checkout Button Behaviour
    
// holds the most recent design to add
let _pendingCart = { id: null, qty: 1 };

// call this from your checkout success
function setCartDesign(savedDesignId, quantity = 1) {
  _pendingCart.id = String(savedDesignId || '');
  _pendingCart.qty = Number(quantity) || 1;
  const btn = document.getElementById('openCartButton');
  if (btn) btn.disabled = !_pendingCart.id;
}

function buildCartUrl() {
  const url = new URL(CART_PAGE, window.location.origin);
  url.searchParams.set('addToCart', _pendingCart.id);
  url.searchParams.set('quantity', String(_pendingCart.qty));
  const ta = document.getElementById('cartComment');
  if (ta && ta.value.trim()) url.searchParams.set('clienComment', ta.value.trim());
  return url.toString();
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('openCartButton');
  if (!btn) return;

  // Force button behavior (prevents form submit)
  btn.setAttribute('type', 'button');

  // If it's an <a>, neutralize href so it won't navigate the current tab
  if (btn.tagName.toLowerCase() === 'a') {
    btn.setAttribute('href', '');
  }

  // Use capture + stopImmediatePropagation to beat other listeners (IX, etc.)
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    e.stopPropagation();

    if (!_pendingCart.id) return;

    const finalUrl = buildCartUrl();
    const w = window.open(finalUrl, '_blank', 'noopener,noreferrer');
    if (w) { try { w.focus(); } catch (_) {} }
    // Note: no same-tab fallback by design
  }, { capture: true });
    
    // Close the checkout popup
    checkoutPopup.style.display = 'none'; 
    
});

    

//Listen to checkout Event message from configurator
    
window.addEventListener('message', function(event) {
    // Check if the message type is 'triggerPopup'
    if (event.data.type === 'triggerPopup') {
         console.log('Checkout Message Received');    
        
        // Set Message Parameters
        const message = event.data;
        const reloadTag = message.reloadId;
        const configurationId = message.recordId;
        
        // Define the checkout & Save Popups to toggle their visibility
        const checkoutPopup = document.getElementById('popupWrapper-addToBasket');
        const RFQPopup = document.getElementById('popupWrapper-rfq');
        const savePopup = document.getElementById('popupWrapper-save');

        // extit theaterMode if theaterMode is enabled
        console.log('checking istheaterMode Variable: ', istheaterMode);
        if(istheaterMode){toggletheaterMode()};
        
        // toggle visibility of the add-to-basket OR save-for-later popup
        // If Message is a Checkout Event --> RFQpopup
        
        if (checkoutPopup && event.data.isCheckout) {
            
            //Identify CheckoutPopup Fields
            const checkoutPriceField = document.getElementById('checkoutPricePlaceholder');
            const checkoutImageField = document.getElementById('checkoutPopupImage');
            const checkoutDimensionsField = document.getElementById('checkoutDimensionsPlaceholder');
            const checkoutProductNameField = document.getElementById('checkoutProductNamePlaceholder');
            
            // Populate fields in Checkout Popup
            if (checkoutPriceField) { checkoutPriceField.textContent = message.price;}
            if (checkoutImageField) { checkoutImageField.src = message.imageUrl; }
            if (checkoutDimensionsField) { checkoutDimensionsField.textContent = message.dimensions;}
            if (checkoutProductNameField) { checkoutProductNameField.textContent = message.productName;}
            
            // Show the checkout-popup
            checkoutPopup.style.display = 'flex'; 
            
            // send to cart page with savedDesignId, quantity, delay
            //addToCartAndOpen(configurationId, 1, 2000);
            setCartDesign(configurationId, 1);
        } 
        
        
        // Fallback: If Message is a NOT a Checkout Event --> Show Save Popup
        else if (savePopup && !event.data.isCheckout){
        
            //Get the Save Form
            const saveFormWrapper = document.getElementById("SaveDesignFormWrapper");
            const saveForm = document.getElementById("wf-form-SaveDesign");
            const successMessage = saveFormWrapper.querySelector('.w-form-done');
            
            //Reset the Save Form 
            //saveFormWrapper.reset();
                saveForm.reset();
                console.log('Save Form reset');
                // Hide the success message
        		successMessage.style.display = 'none';
        		// Show the form
        		saveForm.style.display = 'block';
            
            
            // Identify the fields in SaveDeign  Form
            const saveImageField = document.getElementById('savePopupImage');
            const save_Input_DesignID = document.getElementById('DesignID');
            const Save_MessageContent = document.getElementById('MessageContent_Save');
            
            
            // Populate fields in SaveDesign Popup
            if (saveImageField) { saveImageField.src = message.imageUrl; }
            if (save_Input_DesignID) { save_Input_DesignID.value = message.recordId;}
            if (Save_MessageContent) { Save_MessageContent.value = JSON.stringify(message);}
            
            
            // make save-popup visible
            savePopup.style.display = 'flex'; 
        } 
    }
});



//Enable theaterMode toggle for the confiigurator window
//console.log('defining function to toggle theaterMode');
//declare theaterMode variable in global space
let istheaterMode = false;
const configuratorSection = document.getElementById('configuratorSection'); // Select the configurator section
const configuratorFrame = document.getElementById('configuratorFrame'); // Select the configurator custom code block
//const toggleButton = document.getElementById('toggletheaterMode'); // The button to trigger theaterMode
const theaterModeBrandlogo = document.getElementById('theaterModeBrandlogo'); // The button to trigger theaterMode

//eventlistener to call Theatermode from 3d app
window.addEventListener('message', function(event) {
    // Check if the message type is 'toggleTheaterMode'
    console.log('Theatermode message listener triggered');
    
    if (event.data && event.data.type === 'toggleTheaterMode') {
        console.log('Webflow received Theatermode request', event.data);
        toggletheaterMode();
    }
});



// Function to toggle theaterMode
function toggletheaterMode() {
    if (!istheaterMode) {
        // Expand to theaterMode
        configuratorSection.classList.add('theatermode');
        //configuratorFrame.classList.add('theatermode');
        theaterModeBrandlogo.style.display = 'flex';
        istheaterMode = true;
    } else {
        // Exit theaterMode
        configuratorSection.classList.remove('theatermode');
        //configuratorFrame.classList.remove('theatermode');
        //toggleButton.textContent = 'Go theaterMode';
        theaterModeBrandlogo.style.display = 'none';

        istheaterMode = false;
    }
}

//exit theathermode by clicking brandlogo
const theatermodeBrandButton = document.getElementById ('theaterModeBrandlogo');

theatermodeBrandButton.addEventListener ('click', toggletheaterMode);




// Move loginWrapper from navigation block to body to set its Z-index in front of checkout window
document.addEventListener("DOMContentLoaded", function() {
    // Find the loginWrapper
    const loginWrapper = document.getElementById('loginWrapper');

    // If the loginWrapper exists, append it to the body
    if (loginWrapper) {
        document.body.appendChild(loginWrapper);
        console.log('loginWrapper moved to body.');
    } else {
        console.log('loginWrapper not found.');
    }
});


