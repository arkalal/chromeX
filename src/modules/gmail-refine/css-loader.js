/**
 * Helper function to load the refine CSS styles
 */

function loadRefineStyles() {
  // Check if CSS is already loaded
  if (document.querySelector('link[href*="gmail-refine.css"]')) {
    return;
  }
  
  // Create a link element for the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('styles/gmail-refine.css');
  
  // Append to document head
  document.head.appendChild(link);
  console.log('BrowzPot: Loaded Gmail refine styles');
}

export { loadRefineStyles };
