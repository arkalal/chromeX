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
    const subjectInput = document.querySelector('input[name="subjectbox"]');
    if (subjectInput) {
      subjectInput.value = subject;
      subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  // Clear existing content
  composeBox.innerHTML = '';
  
  // Special signature markers for proper formatting
  const signatureMarkers = ['[Your Name]', '[Your Position]', '[Your Contact Information]'];
  const signatureLineDetectors = ['Best regards', 'Regards', 'Sincerely', 'Thank you', 'Thanks', 'Take care'];
  
  // More thorough signature detection with regex patterns
  function isSignatureLine(text) {
    // Check for exact matches
    if (signatureMarkers.includes(text.trim()) || 
        signatureLineDetectors.some(detector => text.trim().startsWith(detector))) {
      return true;
    }
    
    // Check for signature patterns like "Best, [Name]" or "Your Name" or "Contact: "
    if (/^(Best|Thanks|Regards|Sincerely|Thank you),?\s*$/.test(text.trim()) || 
        /Your\s+(Name|Position|Title)/i.test(text) ||
        /Contact:|Phone:|Email:/i.test(text)) {
      return true;
    }
    
    return false;
  }
  
  // Process content to preserve signature structure
  const lines = cleanContent.split('\n').filter(line => line !== null && line !== undefined);
  
  // First pass: identify signature sections
  let inSignature = false;
  const structuredLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines that aren't needed for structure
    if (!line.trim() && structuredLines.length === 0) continue;
    
    // Detect signature section start
    if (!inSignature && isSignatureLine(line)) {
      inSignature = true;
      
      // Add an empty line before signature if needed
      if (structuredLines.length > 0 && structuredLines[structuredLines.length - 1].text.trim() !== '') {
        structuredLines.push({ text: '', type: 'separator', isSignature: false });
      }
      
      // Add this line as the first signature line
      structuredLines.push({ text: line, type: 'line', isSignature: true });
      continue;
    }
    
    // Process signature lines differently to maintain proper spacing
    if (inSignature) {
      if (line.trim()) {
        structuredLines.push({ 
          text: line, 
          type: 'line', 
          isSignature: true 
        });
      }
      // Skip empty lines within signature section
      continue;
    }
    
    // Handle normal body content
    if (!line.trim()) {
      // Empty line in body - add as a paragraph separator
      if (structuredLines.length > 0 && 
          structuredLines[structuredLines.length - 1].type !== 'separator') {
        structuredLines.push({ text: '', type: 'separator', isSignature: false });
      }
    } else {
      // Regular content line
      structuredLines.push({ text: line, type: 'line', isSignature: false });
    }
  }
  
  // Second pass: build the HTML content with proper spacing
  let currentParagraph = null;
  let lastType = null;
  
  for (let i = 0; i < structuredLines.length; i++) {
    const item = structuredLines[i];
    
    // Skip unnecessary empty lines
    if (item.type === 'separator' && lastType === 'separator') continue;
    
    if (item.type === 'separator') {
      // Finish current paragraph if exists
      if (currentParagraph) {
        composeBox.appendChild(currentParagraph);
        currentParagraph = null;
      }
      
      // Add paragraph break
      const breakDiv = document.createElement('div');
      breakDiv.innerHTML = '<br>';
      composeBox.appendChild(breakDiv);
    } else {
      // Start a new paragraph if needed
      if (!currentParagraph) {
        currentParagraph = document.createElement('div');
      } else if (!item.isSignature) {
        // For non-signature content, group in same paragraph
        // No action needed, will append to current paragraph
      } else {
        // For signature lines, always start a new div to ensure vertical formatting
        composeBox.appendChild(currentParagraph);
        currentParagraph = document.createElement('div');
      }
      
      // Add the text content
      currentParagraph.appendChild(document.createTextNode(item.text));
      
      // Ensure proper spacing for signature lines
      if (item.isSignature) {
        composeBox.appendChild(currentParagraph);
        currentParagraph = null;
      }
    }
    
    lastType = item.type;
  }
  
  // Add any remaining paragraph
  if (currentParagraph) {
    composeBox.appendChild(currentParagraph);
  }
  
  // Fire input event to trigger Gmail's event listeners
  composeBox.dispatchEvent(new Event('input', { bubbles: true }));
  composeBox.dispatchEvent(new Event('change', { bubbles: true }));
}

export { refineEmailWithTone, rewriteEmail, updateComposeBoxContent };
