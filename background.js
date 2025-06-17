// Background service worker for handling API calls to OpenAI

// Get API key from environment variables during build process
// IMPORTANT: The actual value will be injected during build time from .env
const apiKey = process.env.OPENAI_API_KEY || '';

// Function to make secure API calls to OpenAI
async function callOpenAI(requestData) {
  try {
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

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
  
  if (request.action === 'callOpenAI') {
    // Handle OpenAI API calls securely from the background script
    callOpenAI(request.requestData)
      .then(async response => {
        // If it's a streaming request, we need to send the readable stream back differently
        if (request.streaming) {
          // For streaming, we return just successful response status
          // The content script will handle its own fetch with the API key
          sendResponse({ success: true });
        } else {
          // For regular requests, return the full response data
          const data = await response.json();
          sendResponse({ data });
        }
      })
      .catch(error => {
        console.error('Error in callOpenAI:', error);
        sendResponse({ error: error.message || 'API call failed' });
      });
    return true;
  }
  
  if (request.action === 'getApiKey' || request.action === 'getOpenAIKey') {
    // Return the built-in API key immediately
    sendResponse({ apiKey });
    return true;
  }
});

// Using built-in project API key - no need to load from storage

// Generate text using OpenAI API
async function generateText(instruction, originalText = '') {
  // API key is now always available
  
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
