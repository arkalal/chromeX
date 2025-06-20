/**
 * Gmail Refine Handler Module
 * Handles the functionality for refining and rewriting emails in Gmail
 */

/**
 * Refine email with a different tone using the OpenAI API
 * @param {string} emailContent - The current email content
 * @param {string} tone - The tone to apply
 * @param {function} onProgress - Callback for streaming updates
 * @returns {Promise<string>} - The refined email content
 */
async function refineEmailWithTone(emailContent, tone, onProgress) {
  if (!emailContent || !tone) {
    throw new Error('Email content and tone are required');
  }

  // Get API key from background script which securely stores it
  let apiKey;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getOpenAIKey' });
    apiKey = response.apiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    throw new Error('Could not access API key');
  }
  
  // Create abort controller for cancellation
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  // Prepare the system message and prompt
  const systemMessage = `You are an expert email editor who specializes in tone adjustment. 
Keep the same information and core message but adjust the style and tone as requested.`;
  
  const userPrompt = `I have an email that I want you to rewrite with a ${tone} tone. 
Keep the same information and message intent. Here's the email:

${emailContent}`;

  // Prepare request data
  const requestData = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    stream: true,
    temperature: 0.7
  };

  try {
    // Call the OpenAI API with streaming enabled
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }
    
    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let refinedEmail = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode the chunk
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      // Process each line
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
        
        try {
          // Remove 'data: ' prefix and parse JSON
          const jsonString = trimmedLine.replace(/^data: /, '');
          if (!jsonString) continue;
          
          const parsedData = JSON.parse(jsonString);
          const content = parsedData.choices?.[0]?.delta?.content;
          
          if (content) {
            refinedEmail += content;
            // Call the progress callback with current content
            if (onProgress) onProgress(refinedEmail);
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    }
    
    return refinedEmail;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    console.error('Error refining email:', error);
    throw error;
  }
}

/**
 * Rewrite email based on user instructions using the OpenAI API
 * @param {string} emailContent - The current email content 
 * @param {string} instructions - User instructions for rewriting
 * @param {function} onProgress - Callback for streaming updates
 * @returns {Promise<string>} - The rewritten email content
 */
async function rewriteEmail(emailContent, instructions, onProgress) {
  if (!instructions) {
    throw new Error('Rewrite instructions are required');
  }

  // Get API key from background script which securely stores it
  let apiKey;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getOpenAIKey' });
    apiKey = response.apiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    throw new Error('Could not access API key');
  }
  
  // Create abort controller for cancellation
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  // Prepare the system message and prompt
  const systemMessage = `You are an expert email writer. Rewrite the email according to the user's instructions.`;
  
  const userPrompt = `I have an email that I want you to rewrite based on the following instructions:
${instructions}

Here's the current email:
${emailContent}`;

  // Prepare request data
  const requestData = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    stream: true,
    temperature: 0.7
  };

  try {
    // Call the OpenAI API with streaming enabled
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }
    
    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let rewrittenEmail = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode the chunk
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      // Process each line
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
        
        try {
          // Remove 'data: ' prefix and parse JSON
          const jsonString = trimmedLine.replace(/^data: /, '');
          if (!jsonString) continue;
          
          const parsedData = JSON.parse(jsonString);
          const content = parsedData.choices?.[0]?.delta?.content;
          
          if (content) {
            rewrittenEmail += content;
            // Call the progress callback with current content
            if (onProgress) onProgress(rewrittenEmail);
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    }
    
    return rewrittenEmail;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    console.error('Error rewriting email:', error);
    throw error;
  }
}

/**
 * Extract subject line from content if present
 * @param {string} content - Content that may contain a subject line
 * @returns {Object} Object with subject and cleanContent properties
 */
function extractSubject(content) {
  const result = {
    subject: null,
    cleanContent: content
  };
  
  // Check for subject line at the beginning
  const subjectMatch = content.match(/^Subject:\s+([^\n]+)/i);
  if (subjectMatch) {
    result.subject = subjectMatch[1].trim();
    // Remove the subject line from the content
    result.cleanContent = content.replace(subjectMatch[0], '').trim();
  }
  
  return result;
}

/**
 * Updates Gmail compose box with new content
 * @param {HTMLElement} composeBox - The Gmail compose box element
 * @param {string} newContent - The new content to insert
 */
function updateComposeBoxContent(composeBox, newContent) {
  if (!composeBox) return;
  
  // Extract subject if present and update subject field
  const { subject, cleanContent } = extractSubject(newContent);
  
  // Update subject field if a subject was found
  if (subject) {
    // Find the subject input field in Gmail
    const subjectField = document.querySelector('input[name="subjectbox"]');
    if (subjectField) {
      subjectField.value = subject;
      subjectField.dispatchEvent(new Event('input', { bubbles: true }));
      subjectField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Use clean content without the subject line
    newContent = cleanContent;
  }
  
  // Clear the compose box
  composeBox.innerHTML = '';
  
  // Parse content into paragraphs for proper formatting
  const paragraphs = newContent.split(/\n{2,}/);
  
  // Process each paragraph
  paragraphs.forEach((paragraph, pIndex) => {
    // Handle paragraph with potential line breaks
    const lines = paragraph.split(/\n/);
    
    lines.forEach((line, lIndex) => {
      const div = document.createElement('div');
      
      // If line is empty, add a <br> element
      if (!line.trim()) {
        div.innerHTML = '<br>';
      } else {
        div.textContent = line;
      }
      
      composeBox.appendChild(div);
      
      // Add line break only between lines within the same paragraph
      if (lIndex < lines.length - 1) {
        const br = document.createElement('br');
        composeBox.appendChild(br);
      }
    });
    
    // Add paragraph separation only if not the last paragraph
    if (pIndex < paragraphs.length - 1) {
      // Single line break between paragraphs - this creates proper spacing
      const paraBreak = document.createElement('div');
      paraBreak.innerHTML = '<br>';
      composeBox.appendChild(paraBreak);
    }
  });
  
  // Fire input event to trigger Gmail's event listeners
  composeBox.dispatchEvent(new Event('input', { bubbles: true }));
  composeBox.dispatchEvent(new Event('change', { bubbles: true }));
}

export { refineEmailWithTone, rewriteEmail, updateComposeBoxContent };
