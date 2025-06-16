// Background service worker for handling API calls to OpenAI

let apiKey = '';

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateText') {
    generateText(request.instruction, request.originalText)
      .then(result => {
        sendResponse({ text: result });
      })
      .catch(error => {
        console.error('Error generating text:', error);
        sendResponse({ error: error.message || 'Failed to generate text' });
      });
    return true; // Indicates we will call sendResponse asynchronously
  }
  
  if (request.action === 'saveApiKey') {
    chrome.storage.local.set({ apiKey: request.apiKey }, () => {
      apiKey = request.apiKey;
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getApiKey') {
    chrome.storage.local.get('apiKey', (result) => {
      sendResponse({ apiKey: result.apiKey || '' });
    });
    return true;
  }
});

// Load API key when background script initializes
chrome.storage.local.get('apiKey', (result) => {
  if (result.apiKey) {
    apiKey = result.apiKey;
  }
});

// Generate text using OpenAI API
async function generateText(instruction, originalText = '') {
  if (!apiKey) {
    throw new Error('OpenAI API key not set. Please configure it in the extension settings.');
  }
  
  let prompt = '';
  
  // Determine if this is write, refine, or restyle based on instruction and original text
  if (!originalText) {
    // Write mode
    prompt = `Write the following: ${instruction}`;
  } else if (instruction.toLowerCase().includes('restyle') || 
             instruction.toLowerCase().includes('tone') || 
             instruction.toLowerCase().includes('style')) {
    // Restyle mode
    prompt = `Restyle the following text based on this instruction: ${instruction}\n\nOriginal text: ${originalText}`;
  } else {
    // Refine mode
    prompt = `Refine the following text based on this instruction: ${instruction}\n\nOriginal text: ${originalText}`;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant that improves text based on user instructions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'OpenAI API error');
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to communicate with OpenAI API: ' + error.message);
  }
}
