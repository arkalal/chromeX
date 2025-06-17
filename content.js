// Content script - Specialized for Gmail AI compose integration

// Global variables
let aiGenerationInProgress = false; // Flag to prevent multiple generations
let currentAbortController = null; // To cancel streaming requests
let selectedInputElement = null; // Track the currently selected input element
let lastFocusedElement = null; // Keep track of the last focused input element
let lastSelectedInputElementPath = null; // Path to restore an element if it disappears from DOM

// Initialize the content script - specialized for Gmail integration
function initialize() {
  // Only run on Gmail
  if (window.location.hostname === 'mail.google.com') {
    // Mark document as Gmail
    document.body.setAttribute('data-page', 'gmail');
    
    // Initialize Gmail integration
    setupEventListeners();
    setupGmailComposeObserver();
  }
}

// Initialize when the content script loads
initialize();

// Setup MutationObserver to detect Gmail compose boxes and add the AI button
function setupGmailComposeObserver() {
  if (window.location.hostname !== 'mail.google.com') return;
  
  console.log('Setting up Gmail compose observer');
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        // Look for Gmail compose boxes using multiple detection methods
        
        // Method 1: Standard detection - look for the send button with specific attributes
        const sendButtons = document.querySelectorAll('div[role="button"]:has(g-bubble.JAPqpe), [role="button"][data-tooltip^="Send"]');
        
        sendButtons.forEach(sendButton => {
          // Skip if this button already has our AI button
          if (sendButton.hasAttribute('data-ai-button-added')) {
            return;
          }
          
          // Mark this send button as processed to avoid duplication
          sendButton.setAttribute('data-ai-button-added', 'true');
          
          // Find the compose box associated with this send button
          const dialog = sendButton.closest('[role="dialog"]');
          if (!dialog) return;
          
          const composeBox = dialog.querySelector('div[role="textbox"]:not([aria-label="Subject"]), div.editable[contenteditable="true"]');
          
          if (composeBox) {
            console.log('Gmail compose observer found a match');
            // Add our AI button
            addWriteWithAIButton(sendButton, composeBox);
          }
        });
        
        // Method 2: Alternative detection - look for compose boxes directly
        const composeBoxes = document.querySelectorAll('[role="dialog"] [contenteditable="true"], [role="dialog"] [role="textbox"]');
        
        for (const composeBox of composeBoxes) {
          // Skip if already processed
          const dialog = composeBox.closest('[role="dialog"]');
          if (!dialog || dialog.hasAttribute('data-ai-processed')) continue;
          
          // Find the send button to position our AI button relative to it
          const sendButton = dialog.querySelector('[role="button"][data-tooltip^="Send"], [role="button"]:has(g-bubble.JAPqpe)');
          if (sendButton && !sendButton.hasAttribute('data-ai-button-added')) {
            // Mark as processed
            dialog.setAttribute('data-ai-processed', 'true');
            sendButton.setAttribute('data-ai-button-added', 'true');
            
            // Gmail send button detected
            console.log('Gmail compose observer found a match (method 2)');
            addWriteWithAIButton(sendButton, composeBox);
          }
        }
      }
    }
  });
  
  // Start observing document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Special function to find Gmail compose box by exact structure
function findGmailComposeBox() {
  try {
    // First try to locate the div with classes matching the user provided example
    const exactMatch = document.querySelector('div.Am.aiL.Al.editable.LW-avf[role="textbox"][contenteditable="true"][g_editable="true"]');
    if (exactMatch) {
      return exactMatch;
    }
    
    // Try broader but still specific class combinations
    const classMatches = document.querySelectorAll('div.Am.Al.editable.LW-avf[role="textbox"], div.editable.LW-avf[contenteditable="true"]');
    if (classMatches.length > 0) {
      return classMatches[0];
    }
    
    // Try by attributes
    const attrMatches = document.querySelectorAll('div[role="textbox"][aria-label="Message Body"], div[contenteditable="true"][g_editable="true"]');
    if (attrMatches.length > 0) {
      return attrMatches[0];
    }
    
    // Broader search for any contenteditable in compose window
    if (window.location.pathname.includes('/compose')) {
      const editables = document.querySelectorAll('[contenteditable="true"]');
      if (editables.length > 0) {
        // Try to find the most likely one (the compose box)
        for (const editable of editables) {
          if (editable.classList.contains('editable') || 
              editable.getAttribute('role') === 'textbox' ||
              editable.getAttribute('aria-label') === 'Message Body') {
            return editable;
          }
        }
        // If no good match, return the first one
        return editables[0];
      }
    }
    
    // Generic role textbox search as last resort
    const roleTextboxes = document.querySelectorAll('div[role="textbox"]');
    if (roleTextboxes.length > 0) {
      return roleTextboxes[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Insert text into Gmail compose box specifically
function insertIntoGmail(element, content) {
  let composeBox = element;
  
  if (!element.getAttribute('role') || element.getAttribute('role') !== 'textbox') {
    composeBox = element.closest('div[role="textbox"]');
    
    if (!composeBox) {
      const possibleComposeBoxes = document.querySelectorAll('div.editable[contenteditable="true"][role="textbox"]');
      if (possibleComposeBoxes.length > 0) {
        composeBox = possibleComposeBoxes[0];
      }
    }
    
    if (!composeBox) {
      const gmailSpecificBoxes = document.querySelectorAll('div.Am.Al.editable.LW-avf');
      if (gmailSpecificBoxes.length > 0) {
        composeBox = gmailSpecificBoxes[0];
      }
    }
  }
  
  if (!composeBox) {
    return false;
  }
  
  try {
    composeBox.focus();
    
    if (composeBox.innerHTML.trim() === '<br>' || composeBox.innerHTML.trim() === '') {
      const div = document.createElement('div');
      div.textContent = content;
      
      composeBox.innerHTML = '';
      composeBox.appendChild(div);
      
      const br = document.createElement('br');
      composeBox.appendChild(br);
      
      ['input', 'change', 'compositionend', 'textInput'].forEach(eventType => {
        composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
      });
      
      const customEvent = new CustomEvent('gmail-content-change', { bubbles: true, composed: true });
      composeBox.dispatchEvent(customEvent);
      
      return true;
    }
  } catch (e) {
    return false;
  }
  
  try {
    let html = '';
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        html += '<div><br></div>';
      } else {
        html += `<div>${line}</div>`;
      }
    });
    
    if (!html.endsWith('<br></div>') && !html.endsWith('<div><br></div>')) {
      html += '<br>';
    }
    
    composeBox.innerHTML = html;
    
    ['input', 'change', 'compositionend'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    return true;
  } catch (e) {
    return false;
  }
  
  try {
    composeBox.focus();
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    const range = document.createRange();
    range.selectNodeContents(composeBox);
    selection.addRange(range);
    
    const textNode = document.createTextNode(content);
    range.insertNode(textNode);
    
    ['input', 'change', 'compositionend'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    return true;
  } catch (e) {
    return false;
  }
  
  try {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', content);
    
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: clipboardData,
      bubbles: true,
      cancelable: true
    });
    
    composeBox.focus();
    if (composeBox.dispatchEvent(pasteEvent)) {
      return true;
    }
  } catch (e) {
    return false;
  }
  
  try {
    composeBox.textContent = content;
    composeBox.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    composeBox.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    
    if (!composeBox.querySelector('br:last-child')) {
      const br = document.createElement('br');
      composeBox.appendChild(br);
    }
    
    return true;
  } catch (e) {
    return false;
  }
  
  try {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Content copied to clipboard. Please press Ctrl+V or Cmd+V in the compose box to paste it.');
      })
      .catch(err => {
        alert('Could not insert text automatically. Please type or paste your content manually.');
      });
    return true;
  } catch (finalError) {
    return false;
  }
}

// Setup global event listeners for Gmail compose boxes
function setupEventListeners() {
  document.addEventListener('focusin', event => {
    const elem = event.target;
    
    if (isGmailComposeBox(elem)) {
      lastFocusedElement = elem;
      selectedInputElement = elem;
      
      try {
        lastSelectedInputElementPath = getElementPath(elem);
      } catch (e) {
        // Failed to generate element path
      }
    }
  });
}

// Generate a path to a Gmail compose box for re-finding it later
function getElementPath(element) {
  if (!element) return null;
  
  // For Gmail compose box
  if (window.location.hostname === 'mail.google.com' && element.getAttribute('role') === 'textbox') {
    return {
      type: 'gmail-compose',
      value: 'div[role="textbox"]'
    };
  }
  
  // If we can't generate a specific path
  return null;
}

// Check if the element is in Gmail and is a compose box
function isGmailComposeBox(element) {
  if (!element) return false;
  
  // Specific Gmail compose box detection
  if (
    window.location.hostname === 'mail.google.com' &&
    element.getAttribute('role') === 'textbox' &&
    element.closest('[role="dialog"]')
  ) {
    console.log('Detected Gmail compose box by role and dialog');
    selectedInputElement = element;
    return true;
  }
  
  // Match by Gmail-specific attributes
  if (element.getAttribute('g_editable') === 'true' || 
      element.getAttribute('aria-label') === 'Message Body' ||
      element.getAttribute('aria-multiline') === 'true') {
    console.log('Detected Gmail compose box by attributes');
    selectedInputElement = element;
    return true;
  }
  
  // Also detect if we're inside the compose area
  const textbox = element.closest('div[role="textbox"], div.editable.LW-avf');
  if (textbox) {
    // Save the actual textbox as the target, not the child element
    console.log('Detected element inside Gmail compose box');
    selectedInputElement = textbox;
    return true;
  }
  
  // Final attempt - check for any contenteditables within Gmail
  if (window.location.pathname.includes('/compose')) {
    const editables = document.querySelectorAll('[contenteditable="true"]');
    for (const editable of editables) {
      if (editable.isContentEditable) {
        console.log('Found contenteditable in Gmail compose window');
        selectedInputElement = editable;
        return true;
      }
    }
  }
  
  return false;
}

// Add AI button next to Gmail Send button
function addWriteWithAIButton(sendButton, composeBox) {
  // Get the parent container of the send button for proper positioning
  const sendButtonContainer = sendButton.parentElement;
  if (!sendButtonContainer) return;
  
  // Create the AI button following Gmail's UI style but with our theme colors
  const writeWithAIButton = document.createElement('div');
  writeWithAIButton.className = 'T-I J-J5-Ji T-I-atl ai-write-button';
  writeWithAIButton.style.cssText = `
    margin-left: 8px;
    background-color: #4F46E5;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 42px;
    padding: 0 16px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  `;
  
  // Add hover effect
  writeWithAIButton.addEventListener('mouseover', () => {
    writeWithAIButton.style.backgroundColor = '#4338ca'; // Slightly darker on hover
    writeWithAIButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
  });
  
  writeWithAIButton.addEventListener('mouseout', () => {
    writeWithAIButton.style.backgroundColor = '#4F46E5';
    writeWithAIButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  });
  
  // Button text - Just use "AI" instead of "Write with AI"
  const buttonText = document.createElement('span');
  buttonText.className = 'T-I-ax7 ai-button-text';
  buttonText.textContent = 'AI';
  buttonText.style.fontSize = '14px';
  buttonText.style.fontWeight = '600';
  writeWithAIButton.appendChild(buttonText);
  
  // Find where the buttons should be placed
  const buttonContainer = sendButtonContainer.closest('tr');
  if (buttonContainer) {
    // Look for the down arrow button (the dropdown menu)
    const sendRow = buttonContainer.querySelector('td');
    if (sendRow) {
      // Get all buttons to identify the correct position
      const allButtons = Array.from(sendRow.querySelectorAll('.T-I'));
      
      // Find the dropdown arrow button by its characteristics
      const dropdownButton = allButtons.find(btn => 
        (btn.getAttribute('aria-haspopup') === 'true' || 
         btn.getAttribute('data-tooltip') === 'More send options') && 
        btn !== sendButton
      );
      
      // Place after the dropdown if found, ensuring it's a separate button
      if (dropdownButton) {
        // Find the parent cell that contains the send button
        const buttonCell = dropdownButton.closest('td');
        if (buttonCell) {
          // Insert after the dropdown button's parent cell
          buttonCell.parentNode.insertBefore(writeWithAIButton, buttonCell.nextSibling);
        } else {
          // Fallback: insert after dropdown directly
          dropdownButton.parentNode.insertBefore(writeWithAIButton, dropdownButton.nextSibling);
        }
      } else {
        // If dropdown not found, insert after the send button
        sendButton.parentNode.insertBefore(writeWithAIButton, sendButton.nextSibling);
      }
    } else {
      // Fallback if structure is different
      sendButtonContainer.insertBefore(writeWithAIButton, sendButton.nextSibling);
    }
  } else {
    // Fallback to original behavior
    sendButtonContainer.insertBefore(writeWithAIButton, sendButton.nextSibling);
  }
  
  // Add click handler to show AI popup
  writeWithAIButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showGmailAIPopup(composeBox);
  });
  
  return writeWithAIButton;
}

// Show Gmail AI Popup for entering prompts and generating content
function showGmailAIPopup(composeBox) {
  // Remove any existing popup
  const existingPopup = document.getElementById('gmail-ai-popup');
  if (existingPopup) existingPopup.remove();
  
  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'gmail-ai-popup';
  popup.className = 'gmail-ai-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;
  
  // Add header
  const header = document.createElement('div');
  header.className = 'popup-header';
  header.style.cssText = `
    padding: 16px;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #4F46E5;
    color: white;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Write with AI';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
  `;
  closeButton.onclick = () => popup.remove();
  
  header.appendChild(title);
  header.appendChild(closeButton);
  popup.appendChild(header);
  
  // Add content area
  const content = document.createElement('div');
  content.className = 'popup-content';
  content.style.cssText = `
    padding: 16px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  `;
  
  // Prompt input section
  const promptSection = document.createElement('div');
  promptSection.className = 'prompt-section';
  promptSection.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  
  const promptLabel = document.createElement('label');
  promptLabel.textContent = 'What do you want to write?';
  promptLabel.style.cssText = `
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  `;
  
  const promptInput = document.createElement('textarea');
  promptInput.className = 'prompt-input';
  promptInput.placeholder = 'Example: Write a professional email to schedule a meeting with the marketing team...';
  promptInput.style.cssText = `
    padding: 12px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    min-height: 100px;
    font-size: 14px;
    resize: vertical;
  `;
  
  promptSection.appendChild(promptLabel);
  promptSection.appendChild(promptInput);
  
  // Result section
  const resultSection = document.createElement('div');
  resultSection.className = 'result-section';
  resultSection.style.display = 'none';
  resultSection.style.cssText = `
    display: none;
    flex-direction: column;
    gap: 8px;
  `;
  
  const resultLabel = document.createElement('div');
  resultLabel.className = 'result-header';
  resultLabel.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const resultTitle = document.createElement('label');
  resultTitle.textContent = 'Generated Email';
  resultTitle.style.cssText = `
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  `;
  
  resultLabel.appendChild(resultTitle);
  
  const resultContent = document.createElement('div');
  resultContent.className = 'result-content';
  resultContent.style.cssText = `
    padding: 12px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    min-height: 200px;
    font-size: 14px;
    background: #F9FAFB;
    white-space: pre-wrap;
    overflow-y: auto;
  `;
  
  // Subject section
  const subjectSection = document.createElement('div');
  subjectSection.className = 'subject-section';
  subjectSection.style.cssText = `
    display: none;
    flex-direction: column;
    gap: 8px;
  `;
  
  const subjectLabel = document.createElement('label');
  subjectLabel.textContent = 'Email Subject';
  subjectLabel.style.cssText = `
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  `;
  
  const subjectInput = document.createElement('input');
  subjectInput.className = 'subject-input';
  subjectInput.type = 'text';
  subjectInput.style.cssText = `
    padding: 12px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    font-size: 14px;
  `;
  
  subjectSection.appendChild(subjectLabel);
  subjectSection.appendChild(subjectInput);
  
  resultSection.appendChild(resultLabel);
  resultSection.appendChild(resultContent);
  
  content.appendChild(promptSection);
  content.appendChild(subjectSection);
  content.appendChild(resultSection);
  
  // Add footer with buttons
  const footer = document.createElement('div');
  footer.className = 'popup-footer';
  footer.style.cssText = `
    padding: 16px;
    border-top: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  // Left side - tone selector
  const toneSelector = document.createElement('select');
  toneSelector.className = 'tone-selector';
  toneSelector.style.cssText = `
    padding: 8px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    font-size: 14px;
  `;
  
  // Add tone options
  const tones = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive'];
  tones.forEach(tone => {
    const option = document.createElement('option');
    option.value = tone.toLowerCase();
    option.textContent = tone;
    toneSelector.appendChild(option);
  });
  
  // Right side - action buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'action-buttons';
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 8px;
  `;
  
  // Generate button
  const generateButton = document.createElement('button');
  generateButton.className = 'generate-button';
  generateButton.textContent = 'Write Email';
  generateButton.style.cssText = `
    padding: 8px 16px;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  `;
  
  // Apply button (initially hidden)
  const applyButton = document.createElement('button');
  applyButton.className = 'apply-button';
  applyButton.textContent = 'Apply';
  applyButton.style.cssText = `
    padding: 8px 16px;
    background-color: #F97316;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: none;
  `;
  
  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'cancel-button';
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    background-color: transparent;
    color: #6B7280;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  `;
  cancelButton.onclick = () => popup.remove();
  
  footer.appendChild(toneSelector);
  
  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(generateButton);
  buttonsContainer.appendChild(applyButton);
  
  footer.appendChild(buttonsContainer);
  popup.appendChild(content);
  popup.appendChild(footer);
  
  // Add click listener for generate button
  generateButton.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter a prompt first');
      return;
    }
    
    generateGmailContent(prompt, toneSelector.value, resultContent, subjectInput, composeBox, applyButton, subjectSection, resultSection);
  });
  
  // Add click listener for apply button
  applyButton.addEventListener('click', () => {
    // Store the formatted paragraphs to preserve formatting
    const formattedParagraphs = [];
    const paragraphElements = resultContent.querySelectorAll('p');
    
    // Collect formatted paragraphs with proper line breaks
    paragraphElements.forEach(p => {
      // Get the text with line breaks preserved
      let paragraphText = '';
      
      // Process all child nodes to preserve line breaks
      for (const node of p.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          paragraphText += node.textContent;
        } else if (node.nodeName === 'BR') {
          paragraphText += '\n';
        }
      }
      
      formattedParagraphs.push(paragraphText);
    });
    
    // Join paragraphs with double newlines to preserve paragraph separation
    const formattedContent = formattedParagraphs.join('\n\n');
    
    // Apply the formatted content
    applyGeneratedContent(composeBox, formattedContent, subjectInput.value);
    popup.remove();
  });
  
  // Append popup to body
  document.body.appendChild(popup);
  
  // Focus the prompt input
  setTimeout(() => promptInput.focus(), 10);
}

// Generate content for Gmail using OpenAI streaming API
async function generateGmailContent(prompt, tone, resultContainer, subjectInput, composeBox, applyButton, subjectSection, resultSection) {
  if (aiGenerationInProgress) return;
  
  // Validate input
  if (!prompt || prompt.trim() === '') {
    resultContainer.innerHTML = '<div class="error">Error: Please enter a prompt first</div>';
    return;
  }
  
  // Create loading indication
  resultContainer.innerHTML = '<div class="loading">Generating your email...</div>';
  resultContainer.style.opacity = '0.7';
  
  // Show the result sections
  resultSection.style.display = 'flex';
  
  try {
    aiGenerationInProgress = true;
    
    // Get API key from background script which securely stores it
    // This prevents exposing the API key directly in content scripts
    let apiKey;
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getOpenAIKey' });
      apiKey = response.apiKey;
      
      if (!apiKey) {
        resultContainer.innerHTML = '<div class="error">OpenAI API key not configured. Please contact the administrator.</div>';
        aiGenerationInProgress = false;
        return;
      }
    } catch (error) {
      console.error('Error getting API key:', error);
      resultContainer.innerHTML = '<div class="error">Could not access API key. Please try again.</div>';
      aiGenerationInProgress = false;
      return;
    }
    
    // Create abort controller for cancellation
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    
    // Build a clearer prompt to ensure clean subject/body separation
    const systemContent = `You are an expert email writer. Always format your response exactly as follows:

SUBJECT: Your subject line here

Your email body starts here with no "SUBJECT:" references in the body.

The subject line must be on its own line starting with SUBJECT: followed by a blank line separating it from the email body text.`;
    
    // Create the user prompt with tone specification
    const toneText = tone && tone !== 'professional' ? `in a ${tone} tone` : '';
    const userPrompt = `Write a professional email ${toneText} based on this instruction: ${prompt}. Make sure to include a relevant subject line as shown in the format instructions.`;
    
    console.log('Sending request to OpenAI:', { tone, promptLength: prompt.length });
    
    // Request data for the OpenAI API
    const requestData = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI writing assistant helping with email composition.`
        },
        {
          role: 'user',
          content: `${tone ? `Write in a ${tone} tone: ` : ''}${prompt}`
        }
      ],
      stream: true,
      temperature: 0.7
    };

    // Make the API call through the background script for security
    // The background script handles the API key from environment variables
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
      signal
    });
    
    // Handle API errors
    if (!response.ok) {
      let errorMessage = 'Error calling OpenAI API';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let generatedText = '';
    let subject = '';
    
    // Clear the result container
    resultContainer.innerHTML = '';
    
    // A flag to indicate we're collecting subject content
    let collectingSubject = false;
    let partialSubject = '';
    let emailBodyStarted = false;
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            const content = data.choices[0]?.delta?.content || '';
            
            if (content) {
              // Check for SUBJECT: pattern in ongoing text generation
              if (!subject && !emailBodyStarted) {
                // If we see "SUBJECT:" start collecting subject content
                if (content.includes('SUBJECT:')) {
                  collectingSubject = true;
                  partialSubject = content.split('SUBJECT:')[1] || '';
                  continue;
                }
                
                // Still collecting subject content until we hit a newline
                if (collectingSubject) {
                  if (content.includes('\n')) {
                    // Found end of subject line
                    const parts = content.split('\n');
                    partialSubject += parts[0];
                    subject = partialSubject.trim();
                    
                    // Set the subject in the input field
                    subjectInput.value = subject;
                    subjectSection.style.display = 'flex';
                    
                    // Start collecting email body from content after newline
                    const bodyStart = parts.slice(1).join('\n');
                    if (bodyStart.trim()) {
                      generatedText = bodyStart;
                    }
                    
                    // Mark that we're now collecting email body
                    collectingSubject = false;
                    emailBodyStarted = true;
                  } else {
                    // Still collecting subject
                    partialSubject += content;
                    continue;
                  }
                }
              }
              
              // Normal content handling for email body
              if (!collectingSubject) {
                if (emailBodyStarted) {
                  generatedText += content;
                } else if (content.trim() && !content.trim().startsWith('SUBJECT:')) {
                  // If we see content before SUBJECT: pattern, assume it's email body
                  emailBodyStarted = true;
                  generatedText += content;
                }
              }
              
              // Format and update the result container with the generated text
              // First clean up any excessive newlines
              const displayText = generatedText.replace(/\n{3,}/g, '\n\n');
              
              // Clear the container first
              resultContainer.innerHTML = '';
              
              // Process paragraphs for better display
              const paragraphs = displayText.split(/\n\n/);
              paragraphs.forEach(para => {
                if (!para.trim()) return; // Skip empty paragraphs
                
                const p = document.createElement('p');
                
                // Apply Gmail-like styling to match what will be inserted
                p.style.cssText = 'color: rgb(32, 33, 36); font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0px 0px 12px;';
                
                // Handle line breaks within paragraphs
                if (para.includes('\n')) {
                  const lines = para.split('\n').filter(line => line !== '');
                  if (lines.length > 0) {
                    p.textContent = lines[0]; // First line
                    
                    // Add remaining lines with <br> tags
                    for (let i = 1; i < lines.length; i++) {
                      p.appendChild(document.createElement('br'));
                      p.appendChild(document.createTextNode(lines[i]));
                    }
                  }
                } else {
                  p.textContent = para;
                }
                
                resultContainer.appendChild(p);
              });
              
              // Add a final paragraph with an empty line for spacing
              if (paragraphs.length > 0) {
                const finalP = document.createElement('p');
                finalP.style.cssText = 'color: rgb(32, 33, 36); font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0;';
                finalP.innerHTML = '<br>';
                resultContainer.appendChild(finalP);
              }
            }
          } catch (err) {
            console.error('Error parsing JSON from stream:', err);
          }
        }
      }
    }
    
    // Show apply button after generation is complete
    applyButton.style.display = 'block';
    resultContainer.style.opacity = '1';
    
  } catch (error) {
    if (error.name === 'AbortError') {
      resultContainer.innerHTML = '<div class="cancelled">Generation cancelled.</div>';
    } else {
      console.error('Error generating content:', error);
      resultContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  } finally {
    aiGenerationInProgress = false;
    currentAbortController = null;
  }
}

// Apply generated content to Gmail compose box and subject field
async function applyGeneratedContent(composeBox, content, subject) {
  if (!composeBox || !content) return;

  try {
    // Check if we have a subject, either passed directly or extract it from content
    let extractedSubject = subject ? subject.trim() : '';
    let processedContent = content;
    
    // If no subject was provided but the content appears to have a subject line at the top,
    // extract it automatically (heuristic: first paragraph followed by blank line)
    if (!extractedSubject && content) {
      // Split content into paragraphs
      const paragraphs = content.split(/\n\s*\n/);
      
      if (paragraphs.length >= 2) {
        // First paragraph might be the subject if it's short and followed by a blank line
        const firstPara = paragraphs[0].trim();
        
        // It's likely a subject if it's short (less than 100 chars) and doesn't contain newlines
        if (firstPara.length <= 100 && !firstPara.includes('\n') && paragraphs.length > 1) {
          extractedSubject = firstPara;
          // Remove the subject from the content to avoid duplication
          processedContent = paragraphs.slice(1).join('\n\n');
          // Extracted subject from content
        }
      }
    }
    
    // Try to find and populate the subject field if we have a subject
    if (extractedSubject) {
      // More comprehensive search for Gmail subject field using multiple selectors
      const subjectField = document.querySelector('input[name="subjectbox"]') || 
                         document.querySelector('input.aoT') || 
                         document.querySelector('input[aria-label="Subject"]') ||
                         document.querySelector('form.bAs input[placeholder="Subject"]') ||
                         Array.from(document.querySelectorAll('input[type="text"]')).find(el => 
                           (el.placeholder === 'Subject' || 
                            el.getAttribute('aria-label') === 'Subject' || 
                            el.classList.contains('aoT'))
                         );
      
      if (subjectField) {
        // Set the subject value
        subjectField.value = extractedSubject;
        subjectField.focus();
        
        // Dispatch necessary events to ensure Gmail recognizes the subject change
        subjectField.dispatchEvent(new Event('input', { bubbles: true }));
        subjectField.dispatchEvent(new Event('change', { bubbles: true }));
        subjectField.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log('Successfully inserted subject into Gmail subject field:', extractedSubject);
      } else {
        console.warn('Gmail subject field not found, will include subject in body');
        // If subject field wasn't found, prepend the subject to the content
        if (extractedSubject !== subject) { // Only if we extracted it
          processedContent = extractedSubject + '\n\n' + processedContent;
        }
      }
    }
    
    // Clean up content and prepare for insertion
    let cleanContent = processedContent.trim();
    
    // Insert content into the compose box using Gmail's native formatter
    insertIntoGmailComposeBox(composeBox, cleanContent);
    
    // Dispatch events to ensure Gmail updates
    composeBox.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    composeBox.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    composeBox.dispatchEvent(new CustomEvent('gmail-compose-updated', { bubbles: true }));
    
  } catch (error) {
    console.error('Error applying content to Gmail:', error);
    
    // Fallback to execCommand
    try {
      document.execCommand('insertText', false, content);
    } catch (cmdError) {
      console.error('ExecCommand fallback failed:', cmdError);
    }
  }
}

// Helper function to properly format and insert the final email content
function updateComposeBoxContentFinal(composeBox, content) {
  if (!composeBox) return;
  
  try {
    // Focus the compose box first
    composeBox.focus();
    
    // Clear the compose box
    composeBox.innerHTML = '';
    
    // Normalize line breaks
    const normalizedContent = content.replace(/\r\n|\r/g, '\n');
    
    // Split content into paragraphs
    const paragraphs = normalizedContent.split(/\n\n+/);
    
    // Add each paragraph as a separate div, handling line breaks within paragraphs
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return; // Skip empty paragraphs
      
      // Create paragraph div
      const div = document.createElement('div');
      
      // Process single line breaks within paragraphs
      if (paragraph.includes('\n')) {
        const lines = paragraph.split('\n');
        
        // First line
        div.appendChild(document.createTextNode(lines[0]));
        
        // Add remaining lines with <br> tags
        for (let i = 1; i < lines.length; i++) {
          div.appendChild(document.createElement('br'));
          div.appendChild(document.createTextNode(lines[i]));
        }
      } else {
        div.textContent = paragraph;
      }
      
      // Add the paragraph to compose box
      composeBox.appendChild(div);
      
      // Add spacing between paragraphs
      if (index < paragraphs.length - 1) {
        const spacer = document.createElement('div');
        spacer.innerHTML = '<br>';
        composeBox.appendChild(spacer);
      }
    });
    
    // Always end with an empty div with BR per Gmail's convention
    if (paragraphs.length && paragraphs[paragraphs.length - 1].trim()) {
      const finalBreak = document.createElement('div');
      finalBreak.innerHTML = '<br>';
      composeBox.appendChild(finalBreak);
    }
    
    // Dispatch all relevant events to ensure Gmail recognizes the changes
    const events = ['input', 'change', 'blur', 'focus', 'keyup'];
    events.forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Make sure cursor is positioned at the end
    // This helps Gmail recognize the content is complete
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composeBox);
    range.collapse(false); // false means collapse to end
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.error('Error applying final content to compose box:', error);
  }
}

// Specialized function specifically for Gmail compose boxes
function insertIntoGmailComposeBox(composeBox, content) {
  // Focus the compose box first
  composeBox.focus();
  
  try {
    // Clear the compose box if it's empty or just has placeholder content
    const isEmpty = composeBox.innerHTML.trim() === '' || 
                   composeBox.innerHTML.trim() === '<br>' || 
                   composeBox.innerHTML.trim() === '<div><br></div>';
                   
    if (isEmpty) {
      composeBox.innerHTML = '';
    } else {
      // If replacing existing content, ensure we clean it properly
      composeBox.innerHTML = '';
    }
    
    // Normalize all line breaks to \n
    const normalized = content.replace(/\r\n|\r/g, '\n');
    
    // Split into paragraphs (double line breaks)
    const paragraphs = normalized.split(/\n\n+/);
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Process each paragraph using Gmail's expected style format
    paragraphs.forEach((para, index) => {
      if (!para.trim()) return; // Skip empty paragraphs
      
      // Create a paragraph element with Gmail's styling
      const p = document.createElement('p');
      
      // Apply Gmail's specific styling to match their formatting
      p.style.cssText = 'color: rgb(32, 33, 36); font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0px 0px 12px;';
      
      // Process single line breaks within paragraphs
      if (para.includes('\n')) {
        // For lines within a paragraph, use <br> tags
        const lines = para.split('\n').filter(line => line !== '');
        
        if (lines.length > 0) {
          p.textContent = lines[0]; // First line
          
          // Add remaining lines with <br> tags
          for (let i = 1; i < lines.length; i++) {
            p.appendChild(document.createElement('br'));
            p.appendChild(document.createTextNode(lines[i]));
          }
          
          fragment.appendChild(p);
        }
      } else if (para.trim()) {
        p.textContent = para;
        fragment.appendChild(p);
      }
    });
    
    // Add all paragraphs to the compose box at once
    composeBox.appendChild(fragment);
    
    // Add an empty paragraph at the end for cursor position
    const finalP = document.createElement('p');
    finalP.style.cssText = 'color: rgb(32, 33, 36); font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0px 0px 0px;';
    finalP.innerHTML = '<br>';
    composeBox.appendChild(finalP);
    
    // Dispatch events in a more reliable order to ensure Gmail recognizes the changes
    // First dispatch input and change events
    ['input', 'change'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    // Then dispatch focus-related events
    ['focus', 'blur'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Finally dispatch the remaining events
    ['keyup', 'compositionend', 'textInput'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    // Gmail-specific events
    composeBox.dispatchEvent(new CustomEvent('gmail-content-updated', { bubbles: true }));
    composeBox.dispatchEvent(new CustomEvent('input-change', { bubbles: true }));
    
    // Position cursor at the end for a better user experience
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composeBox);
    range.collapse(false); // Collapse to end
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.error('Error inserting into Gmail compose box:', error);
    
    // Fallback method 1: Try an alternate insertion approach
    try {
      // First try setting innerHTML directly
      const formattedHtml = paragraphsToHtml(content);
      composeBox.innerHTML = formattedHtml;
      composeBox.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (innerError) {
      console.error('First fallback failed:', innerError);
      
      // Fallback method 2: Try using execCommand
      try {
        document.execCommand('insertText', false, content);
      } catch (cmdError) {
        console.error('All insertion methods failed:', cmdError);
      }
    }
  }
}

// Helper function to convert paragraphs to properly formatted HTML
function paragraphsToHtml(content) {
  // Normalize line breaks
  const normalized = content.replace(/\r\n|\r/g, '\n');
  
  // Split into paragraphs
  const paragraphs = normalized.split(/\n\n+/);
  
  // Generate HTML with proper Gmail styling
  return paragraphs.map(para => {
    if (!para.trim()) return '';
    
    // Process line breaks within paragraphs
    const processedPara = para.includes('\n') 
      ? para.split('\n').join('<br>') 
      : para;
      
    return `<p style="color: rgb(32, 33, 36); font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0px 0px 12px;">${processedPara}</p>`;
  }).join('') + '<p style="color: rgb(32, 33, 36); font-family: \'Google Sans\', Roboto, RobotoDraft, Helvetica, Arial, sans-serif; font-size: 14px; white-space-collapse: preserve; margin: 0px;"><br></p>';
}


// Observe email content to show/hide the tone button
function observeEmailContent(composeBox, toneButton) {
  // Check initial content
  checkEmailContent();
  
  // Create mutation observer to watch for changes in the compose box
  const contentObserver = new MutationObserver(checkEmailContent);
  
  // Start observing
  contentObserver.observe(composeBox, {
    childList: true,
    characterData: true,
    subtree: true
  });
  
  function checkEmailContent() {
    // Show tone button only if content exists and isn't just a placeholder <br>
    const content = composeBox.textContent.trim();
    const hasOnlyBr = composeBox.innerHTML.trim() === '<br>' || composeBox.innerHTML.trim() === '';
    
    if (content && !hasOnlyBr) {
      toneButton.style.display = 'flex';
    } else {
      toneButton.style.display = 'none';
    }
  }
}

// Handle generation of email content using OpenAI
async function handleGenerateEmail(composeBox) {
  // Do nothing if we're already generating content
  if (aiGenerationInProgress) return;
  
  // Get the user's prompt from the compose box
  const userPrompt = composeBox.textContent.trim();
  
  // Create overlay to show generation status
  const overlay = createGenerationOverlay(composeBox);
  
  try {
    aiGenerationInProgress = true;
    
    // Get the API key from chrome.storage
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      alert('OpenAI API key not found. Please set it in the extension options.');
      overlay.remove();
      aiGenerationInProgress = false;
      return;
    }
    
    // Create an AbortController for the fetch request
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    
    // Clear the compose box
    composeBox.innerHTML = '<br>';
    
    // Find the subject field
    const subjectField = document.querySelector('input[name="subjectbox"], input.aoT[aria-label="Subject"]');
    
    // Setup the system message to enforce strict format
    const systemMessage = `You are an expert email writer. ALWAYS format your response exactly as follows:

SUBJECT: Your subject line here

Your email body starts here with no "SUBJECT:" references in the body.

The SUBJECT line MUST be on its own line starting with SUBJECT: followed by a blank line separating it from the email body text.`;
    
    // Setup the user prompt
    let prompt;
    if (userPrompt) {
      prompt = `Write a professional email based on this instruction: ${userPrompt}`;
      overlay.querySelector('.generating-text').textContent = 'Generating email...';
    } else {
      prompt = 'Write a professional email template that I can customize. Include a greeting, 2-3 body paragraphs, and a closing.';
      overlay.querySelector('.generating-text').textContent = 'Generating email template...';
    }
    
    // Prepare request data for the OpenAI API
    const requestData = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    };
    
    // Call the OpenAI API with streaming enabled
    // The API key is securely fetched from the background script which gets it from environment variables
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
      signal: signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }
    
    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let fullText = '';
    let subjectLine = '';
    let inSubjectLine = false;
    let bodyContent = '';
    
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
            fullText += content;
            
            // Check for changes in subject/body state
            if (content.includes('SUBJECT:')) {
              inSubjectLine = true;
              // Extract subject part
              const parts = content.split('SUBJECT:');
              if (parts.length > 1) {
                subjectLine += parts[1];
              }
            } else if (inSubjectLine && content.includes('\n\n')) {
              // We've found the end of subject line and start of body
              inSubjectLine = false;
              
              // Extract subject from the current line
              const parts = content.split('\n\n');
              if (parts.length > 0) {
                subjectLine += parts[0];
                
                // Finalize subject and set it
                subjectLine = subjectLine.trim();
                if (subjectField && subjectLine) {
                  subjectField.value = subjectLine;
                  // Dispatch events to ensure Gmail recognizes the change
                  subjectField.dispatchEvent(new Event('input', { bubbles: true }));
                  subjectField.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Add body content after the blank line
                if (parts.length > 1) {
                  bodyContent += parts.slice(1).join('\n\n');
                }
              }
            } else if (inSubjectLine) {
              // Still collecting subject
              subjectLine += content;
            } else {
              // Already in body content
              bodyContent += content;
            }
            
            // Show updated content in compose box
            if (bodyContent) {
              updateComposeBoxContent(composeBox, bodyContent);
            } else {
              // If we haven't separated subject/body yet, show full text but will clean up later
              updateComposeBoxContent(composeBox, fullText); 
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    }
    
    // If we never properly separated subject/body, do it now
    if (!bodyContent) {
      // Clean up the content - extract subject and keep only the body
      const subjectMatch = fullText.match(/SUBJECT:\s*([^\n]+)/);
      if (subjectMatch && subjectMatch[1] && !subjectLine) {
        subjectLine = subjectMatch[1].trim();
        if (subjectField) {
          subjectField.value = subjectLine;
          subjectField.dispatchEvent(new Event('input', { bubbles: true }));
          subjectField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Remove SUBJECT line and empty lines at the start
      bodyContent = fullText.replace(/SUBJECT:.*?\n+/s, '').replace(/^\s*\n+/, '').trim();
    }
    
    // Final update with clean body content
    updateComposeBoxContentFinal(composeBox, bodyContent);
    
  } catch (error) {
    console.error('Error generating email:', error);
    if (error.name !== 'AbortError') {
      alert(`Error generating email: ${error.message}`);
    }
  } finally {
    // Clean up
    overlay.remove();
    aiGenerationInProgress = false;
    currentAbortController = null;
  }
}

// Create an overlay to show generation status
function createGenerationOverlay(composeBox) {
  const overlay = document.createElement('div');
  overlay.className = 'ai-generation-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
  `;
  
  // Create loading animation
  const spinner = document.createElement('div');
  spinner.className = 'ai-spinner';
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 3px solid rgba(79, 70, 229, 0.3);
    border-radius: 50%;
    border-top-color: #4F46E5;
    animation: ai-spin 1s linear infinite;
    margin-bottom: 16px;
  `;
  
  // Add spinning animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ai-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Text
  const text = document.createElement('div');
  text.className = 'generating-text';
  text.textContent = 'Generating email...';
  text.style.cssText = `
    color: #111827;
    font-size: 16px;
    margin-bottom: 16px;
  `;
  
  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    background-color: white;
    color: #4F46E5;
    border: 1px solid #4F46E5;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: all 300ms ease-in-out;
  `;
  
  cancelButton.addEventListener('click', () => {
    if (currentAbortController) {
      currentAbortController.abort();
    }
  });
  
  overlay.appendChild(spinner);
  overlay.appendChild(text);
  overlay.appendChild(cancelButton);
  
  // Attach to compose container
  const composeContainer = composeBox.closest('div[role="dialog"]') || composeBox.parentElement;
  composeContainer.style.position = 'relative';
  composeContainer.appendChild(overlay);
  
  return overlay;
}

// Get the OpenAI API key from the background script (sourced from .env)
async function getOpenAIKey() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getOpenAIKey' }, (response) => {
      if (response && response.apiKey) {
        resolve(response.apiKey);
      } else {
        console.error('Failed to get API key from background script');
        resolve('');
      }
    });
  });
}

// Update compose box content with generated text
function updateComposeBoxContent(composeBox, content) {
  // Gmail expects content in a specific format with <div> and <br> elements
  const formattedContent = content
    .split('\n')
    .map(line => `<div>${line || '<br>'}</div>`)
    .join('');
  
  // Update the compose box  
  composeBox.innerHTML = formattedContent || '<br>';
  
  // Dispatch events so Gmail recognizes the content change
  const events = ['input', 'change', 'blur', 'compositionend'];
  events.forEach(eventType => {
    composeBox.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
  
  // Custom event that might trigger Gmail's handlers
  composeBox.dispatchEvent(new CustomEvent('gmail-content-change', { bubbles: true }));
}

// Handle tone adjustment of existing email content
async function handleAdjustTone(composeBox) {
  // Don't do anything if generation is already in progress
  if (aiGenerationInProgress) return;
  
  // Get the current email content
  const currentContent = composeBox.textContent.trim();
  if (!currentContent) {
    alert('Please write some content first before adjusting the tone.');
    return;
  }
  
  // Create a tone selection modal
  const modal = createToneSelectionModal(composeBox);
  document.body.appendChild(modal);
  
  // Position the modal near the compose box
  positionModal(modal, composeBox);
}

// Create a modal for tone selection
function createToneSelectionModal(composeBox) {
  const modal = document.createElement('div');
  modal.className = 'ai-tone-modal';
  modal.style.cssText = `
    position: fixed;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 16px;
    z-index: 10000;
    width: 350px;
    font-family: 'Inter', sans-serif;
  `;
  
  // Modal header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid #E5E7EB;
    padding-bottom: 8px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Adjust Tone';
  title.style.cssText = `
    margin: 0;
    font-size: 16px;
    color: #111827;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6B7280;
  `;
  closeButton.addEventListener('click', () => modal.remove());
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Custom tone input
  const customToneSection = document.createElement('div');
  customToneSection.style.cssText = `
    margin-bottom: 16px;
  `;
  
  const label = document.createElement('label');
  label.textContent = 'Enter custom tone instruction:';
  label.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #6B7280;
  `;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'e.g., Make it more professional';
  input.style.cssText = `
    width: calc(100% - 16px);
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    font-size: 14px;
    margin-bottom: 8px;
  `;
  
  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply Custom Tone';
  applyButton.style.cssText = `
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
  `;
  
  applyButton.addEventListener('click', () => {
    const toneInstruction = input.value.trim();
    if (toneInstruction) {
      applyToneAdjustment(composeBox, toneInstruction);
      modal.remove();
    } else {
      input.style.borderColor = '#EF4444';
      setTimeout(() => input.style.borderColor = '#E5E7EB', 1000);
    }
  });
  
  // Quick tone buttons
  const quickToneSection = document.createElement('div');
  quickToneSection.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  `;
  
  const tones = [
    'Professional', 
    'Friendly', 
    'Concise', 
    'Detailed',
    'Persuasive', 
    'Formal', 
    'Casual', 
    'Appreciative'
  ];
  
  tones.forEach(tone => {
    const toneButton = document.createElement('button');
    toneButton.textContent = tone;
    toneButton.style.cssText = `
      background-color: white;
      color: #4F46E5;
      border: 1px solid #4F46E5;
      border-radius: 8px;
      padding: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 300ms ease-in-out;
    `;
    
    toneButton.addEventListener('mouseenter', () => {
      toneButton.style.backgroundColor = '#F5F5FF';
    });
    
    toneButton.addEventListener('mouseleave', () => {
      toneButton.style.backgroundColor = 'white';
    });
    
    toneButton.addEventListener('click', () => {
      applyToneAdjustment(composeBox, `Make this email more ${tone.toLowerCase()}`);
      modal.remove();
    });
    
    quickToneSection.appendChild(toneButton);
  });
  
  // Assemble the modal
  customToneSection.appendChild(label);
  customToneSection.appendChild(input);
  customToneSection.appendChild(applyButton);
  
  modal.appendChild(header);
  modal.appendChild(customToneSection);
  
  const quickTonesLabel = document.createElement('div');
  quickTonesLabel.textContent = 'Quick Tone Selection:';
  quickTonesLabel.style.cssText = `
    margin: 16px 0 8px;
    font-size: 14px;
    color: #6B7280;
  `;
  
  modal.appendChild(quickTonesLabel);
  modal.appendChild(quickToneSection);
  
  return modal;
}

// Position the modal near the compose box
function positionModal(modal, composeBox) {
  const rect = composeBox.getBoundingClientRect();
  
  // Position near the compose box but ensure it's visible
  modal.style.top = `${Math.max(rect.top, 10)}px`;
  modal.style.left = `${Math.min(rect.right + 20, window.innerWidth - 370)}px`;
}

// Apply the tone adjustment to the email
async function applyToneAdjustment(composeBox, toneInstruction) {
  // Don't do anything if generation is already in progress
  if (aiGenerationInProgress) return;
  
  // Get the current email content
  const currentContent = composeBox.textContent.trim();
  if (!currentContent) {
    alert('Please write some content first before adjusting the tone.');
    return;
  }
  
  // Create overlay to show generation status
  const overlay = createGenerationOverlay(composeBox);
  overlay.querySelector('.generating-text').textContent = 'Adjusting tone...';
  
  try {
    aiGenerationInProgress = true;
    
    // Get the API key from chrome.storage
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      alert('OpenAI API key not found. Please set it in the extension options.');
      overlay.remove();
      aiGenerationInProgress = false;
      return;
    }
    
    // Store original content
    const originalContent = composeBox.innerHTML;
    
    // Create an AbortController for the fetch request
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    
    // Setup the prompt
    const prompt = `I have an email that I want you to rewrite with a different tone. ${toneInstruction}. Keep the same information and message intent. Here's the email:\n\n${currentContent}`;
    
    // Prepare request data for the OpenAI API
    const requestData = {
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are an expert email editor who specializes in tone adjustment. Keep the same information and core message but adjust the style and tone as requested.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      stream: true
    };
    
    // Call the OpenAI API with streaming enabled
    // The API key is securely fetched from the background script which gets it from environment variables
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
      signal: signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }
    
    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let adjustedText = '';
    composeBox.innerHTML = '<br>'; // Clear for streaming display
    
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
            adjustedText += content;
            updateComposeBoxContent(composeBox, adjustedText);
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    }
    
    // Final update
    updateComposeBoxContent(composeBox, adjustedText);
    
  } catch (error) {
    console.error('Error adjusting tone:', error);
    if (error.name !== 'AbortError') {
      alert(`Error adjusting tone: ${error.message}`);
    }
  } finally {
    // Clean up
    overlay.remove();
    aiGenerationInProgress = false;
    currentAbortController = null;
  }
}
