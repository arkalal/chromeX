// Popup script

document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyButton = document.getElementById('save-api-key');
  const apiStatusElement = document.getElementById('api-status');
  
  // Load saved API key
  chrome.runtime.sendMessage({ action: 'getApiKey' }, function(response) {
    if (response && response.apiKey) {
      apiKeyInput.value = response.apiKey;
      updateApiStatus('API key configured', 'success');
    }
  });
  
  // Save API key
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      updateApiStatus('Please enter a valid API key', 'error');
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      updateApiStatus('API key should start with "sk-"', 'error');
      return;
    }
    
    // Save API key to storage
    chrome.runtime.sendMessage({
      action: 'saveApiKey',
      apiKey: apiKey
    }, function(response) {
      if (response && response.success) {
        updateApiStatus('API key saved successfully', 'success');
      } else {
        updateApiStatus('Failed to save API key', 'error');
      }
    });
  });
  
  // Update API status message
  function updateApiStatus(message, type) {
    apiStatusElement.textContent = message;
    apiStatusElement.className = 'api-status ' + type;
    
    // Clear message after 3 seconds if it's a success message
    if (type === 'success') {
      setTimeout(() => {
        apiStatusElement.textContent = '';
        apiStatusElement.className = 'api-status';
      }, 3000);
    }
  }
});
