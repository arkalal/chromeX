// Content script - Runs on each page

// Selected input element reference
let lastFocusedElement = null;
let selectedInputElement = null;
let selectedInputType = null; // Track the input type
let lastSelectedInputElementPath = null; // For re-finding the element if needed
let floatingButton = null;
let aiAssistantPanel = null;
let isPanelOpen = false;
let currentMode = 'write'; // Default mode

// Initialize the content script
function initialize() {
  // Check for specific websites and add page attribute
  detectSpecialWebsites();
  createFloatingButton();
  setupEventListeners();
}

// Detect special websites that need specific handling
function detectSpecialWebsites() {
  // Detect Gmail
  if (window.location.hostname === 'mail.google.com') {
    document.body.setAttribute('data-page', 'gmail');
    console.log('Gmail detected - applying special handling');
  }
  
  // Detect Google Docs
  if (window.location.hostname === 'docs.google.com') {
    document.body.setAttribute('data-page', 'gdocs');
  }
}

// Create the floating AI button
function createFloatingButton() {
  // Create floating button element
  floatingButton = document.createElement('div');
  floatingButton.id = 'ai-text-assistant-button';
  floatingButton.innerHTML = `
    <div class="ai-button-icon">AI</div>
  `;
  
  // Hide the button initially
  floatingButton.style.display = 'none';
  
  // Append to body
  document.body.appendChild(floatingButton);
  
  // Add click event to the button
  floatingButton.addEventListener('click', toggleAssistantPanel);
}

// Create the AI assistant panel
function createAssistantPanel() {
  // Create panel container
  aiAssistantPanel = document.createElement('div');
  aiAssistantPanel.id = 'ai-text-assistant-panel';
  aiAssistantPanel.innerHTML = `
    <div class="panel-header">
      <h3>AI Text Assistant</h3>
      <button id="close-ai-panel">×</button>
    </div>
    <div class="panel-body">
      <div class="action-buttons">
        <button id="ai-write" class="action-btn">Write</button>
        <button id="ai-refine" class="action-btn">Refine</button>
        <button id="ai-restyle" class="action-btn">Restyle</button>
      </div>
      <div id="ai-instruction-container">
        <textarea id="ai-instruction" placeholder="Enter instructions for AI (e.g., 'Write a professional email to schedule a meeting')"></textarea>
        <button id="ai-submit" class="submit-btn">Generate</button>
      </div>
      <div id="ai-result-container" style="display: none;">
        <div class="result-header">AI Suggestion</div>
        <div id="ai-result-content"></div>
        <div class="result-actions">
          <button id="ai-apply" class="action-btn">Apply</button>
          <button id="ai-edit" class="action-btn">Edit</button>
          <button id="ai-cancel" class="action-btn">Cancel</button>
        </div>
      </div>
      <div id="ai-loading" style="display: none;">
        <div class="loader"></div>
        <p>Generating content...</p>
      </div>
      <div class="panel-footer">
        <small>Powered by GPT-4o</small>
      </div>
    </div>
  `;
  
  document.body.appendChild(aiAssistantPanel);
  
  // Set up event listeners for the panel
  setupPanelEventListeners();
}

// Setup event listeners for the panel
function setupPanelEventListeners() {
  // Close button
  document.getElementById('close-ai-panel').addEventListener('click', toggleAssistantPanel);
  
  // Action buttons
  document.getElementById('ai-write').addEventListener('click', () => setMode('write'));
  document.getElementById('ai-refine').addEventListener('click', () => setMode('refine'));
  document.getElementById('ai-restyle').addEventListener('click', () => setMode('restyle'));
  
  // Submit button
  document.getElementById('ai-submit').addEventListener('click', handleAiSubmit);
  
  // Result action buttons
  document.getElementById('ai-apply').addEventListener('click', applyAiContent);
  document.getElementById('ai-edit').addEventListener('click', editAiContent);
  document.getElementById('ai-cancel').addEventListener('click', cancelAiContent);
}

// Set the mode for AI operation
function setMode(mode) {
  const instructionElem = document.getElementById('ai-instruction');
  const resultContainer = document.getElementById('ai-result-container');
  resultContainer.style.display = 'none';
  
  switch (mode) {
    case 'write':
      instructionElem.value = '';
      instructionElem.placeholder = 'Describe what you want to write...';
      break;
    case 'refine':
      if (selectedInputElement) {
        instructionElem.value = selectedInputElement.value || selectedInputElement.textContent || '';
        instructionElem.placeholder = 'How would you like to refine this text?';
      }
      break;
    case 'restyle':
      if (selectedInputElement) {
        instructionElem.value = selectedInputElement.value || selectedInputElement.textContent || '';
        instructionElem.placeholder = 'How would you like to restyle this text? (e.g., "Make it more professional")';
      }
      break;
  }
  
  // Show the instruction container
  document.getElementById('ai-instruction-container').style.display = 'block';
}

// Handle AI submit
function handleAiSubmit() {
  const instruction = document.getElementById('ai-instruction').value;
  const originalText = selectedInputElement ? (selectedInputElement.value || selectedInputElement.textContent || '') : '';
  
  if (!instruction) {
    alert('Please provide instructions for the AI.');
    return;
  }
  
  // Show loading state
  document.getElementById('ai-loading').style.display = 'flex';
  document.getElementById('ai-instruction-container').style.display = 'none';
  
  // Send message to background script to make the API call
  chrome.runtime.sendMessage({
    action: 'generateText',
    instruction,
    originalText
  }, response => {
    // Hide loading and show results
    document.getElementById('ai-loading').style.display = 'none';
    
    if (response.error) {
      alert(`Error: ${response.error}`);
      document.getElementById('ai-instruction-container').style.display = 'block';
      return;
    }
    
    // Show result
    document.getElementById('ai-result-content').textContent = response.text;
    document.getElementById('ai-result-container').style.display = 'block';
  });
}

// Apply AI generated content to the selected input
function applyAiContent() {
  // Get the content from the AI result
  const aiContent = document.getElementById('ai-result-content').textContent;
  
  console.log('Attempting to apply AI content');
  console.log('Selected input type:', selectedInputType);
  
  // Check if we have content and a target element
  if (!selectedInputElement || !aiContent) {
    console.error('No input element selected or no AI content generated');
    alert('Error: Could not find the input element. Please try again.');
    return;
  }
  
  try {
    console.log('Applying content to element:', selectedInputElement);
    
    // Check if element is still in DOM, and try to recover if not
    if (!document.contains(selectedInputElement)) {
      console.warn('Element is no longer in DOM, attempting to recover...');
      
      if (lastSelectedInputElementPath) {
        // Try to find the element again using the stored path
        const recoveredElement = findElementByPath(lastSelectedInputElementPath);
        if (recoveredElement) {
          console.log('Successfully recovered element:', recoveredElement);
          selectedInputElement = recoveredElement;
        } else {
          console.error('Could not recover element');
          
          // Special case for Gmail - try to find by exact HTML structure
          if (window.location.hostname === 'mail.google.com') {
            const gmailComposeBox = findGmailComposeBox();
            if (gmailComposeBox) {
              console.log('Found Gmail compose box by structure');
              selectedInputElement = gmailComposeBox;
              selectedInputType = 'gmail-compose';
            } else {
              alert('The input field is no longer available. Please select it again.');
              toggleAssistantPanel();
              return;
            }
          } else {
            alert('The input field is no longer available. Please select it again.');
            toggleAssistantPanel();
            return;
          }
        }
      } else {
        // Special case for Gmail - try to find by exact HTML structure
        if (window.location.hostname === 'mail.google.com') {
          const gmailComposeBox = findGmailComposeBox();
          if (gmailComposeBox) {
            console.log('Found Gmail compose box by structure');
            selectedInputElement = gmailComposeBox;
            selectedInputType = 'gmail-compose';
          } else {
            alert('The input field is no longer available. Please select it again.');
            toggleAssistantPanel();
            return;
          }
        } else {
          console.error('No path information to recover element');
          alert('The input field is no longer available. Please select it again.');
          toggleAssistantPanel();
          return;
        }
      }
    }
    
    // GMAIL SPECIFIC HANDLING
    if (window.location.hostname === 'mail.google.com' || selectedInputType === 'gmail-compose') {
      console.log('Using Gmail-specific insertion method');
      
      // Check once more if we need to find a Gmail compose box
      if (!selectedInputElement.hasAttribute('role') || selectedInputElement.getAttribute('role') !== 'textbox') {
        const gmailComposeBox = findGmailComposeBox();
        if (gmailComposeBox) {
          console.log('Updated selected element to Gmail compose box');
          selectedInputElement = gmailComposeBox;
          selectedInputType = 'gmail-compose';
        }
      }
      
      const success = insertIntoGmail(selectedInputElement, aiContent);
      if (success) {
        console.log('Gmail insertion successful');
        toggleAssistantPanel();
        return;
      }
    }
    
    // STANDARD INPUT/TEXTAREA HANDLING
    if (selectedInputElement.tagName === 'INPUT' || selectedInputElement.tagName === 'TEXTAREA') {
      console.log('Inserting into standard input/textarea element');
      insertIntoInputOrTextarea(selectedInputElement, aiContent);
      toggleAssistantPanel();
      return;
    }
    
    // CONTENTEDITABLE HANDLING
    if (selectedInputElement.isContentEditable) {
      console.log('Inserting into contentEditable element');
      insertIntoContentEditable(selectedInputElement, aiContent);
      toggleAssistantPanel();
      return;
    }
    
    // FALLBACK METHODS
    console.log('Using fallback insertion methods');
    const success = tryAllInsertionMethods(selectedInputElement, aiContent);
    
    if (!success) {
      // Last resort - try the clipboard API
      console.log('Using clipboard API as last resort');
      navigator.clipboard.writeText(aiContent)
        .then(() => {
          alert('Content copied to clipboard. Please paste it into the input field manually with Ctrl+V or Cmd+V.');
        })
        .catch(err => {
          console.error('Clipboard API failed:', err);
          alert('Could not insert text. Please try selecting the field again.');
        });
    }
    
  } catch (error) {
    console.error('Error applying AI content:', error);
    alert('Error inserting text. Please try again.');
  }
  
  // Close the panel
  toggleAssistantPanel();
}

// Special function to find Gmail compose box by exact structure
function findGmailComposeBox() {
  console.log('Attempting to find Gmail compose box by exact structure');
  
  try {
    // First try to locate the div with classes matching the user provided example
    // <div id=":r8" class="Am aiL Al editable LW-avf tS-tW" hidefocus="true" aria-label="Message Body" writingsuggestions="false" g_editable="true" role="textbox" aria-multiline="true" contenteditable="true" tabindex="1">
    const exactMatch = document.querySelector('div.Am.aiL.Al.editable.LW-avf[role="textbox"][contenteditable="true"][g_editable="true"]');
    if (exactMatch) {
      console.log('Found exact match for Gmail compose box');
      return exactMatch;
    }
    
    // Try broader but still specific class combinations
    const classMatches = document.querySelectorAll('div.Am.Al.editable.LW-avf[role="textbox"], div.editable.LW-avf[contenteditable="true"]');
    if (classMatches.length > 0) {
      console.log('Found Gmail compose box by class combination');
      return classMatches[0];
    }
    
    // Try by attributes
    const attrMatches = document.querySelectorAll('div[role="textbox"][aria-label="Message Body"], div[contenteditable="true"][g_editable="true"]');
    if (attrMatches.length > 0) {
      console.log('Found Gmail compose box by attributes');
      return attrMatches[0];
    }
    
    // Broader search for any contenteditable in compose window
    if (window.location.pathname.includes('/compose')) {
      const editables = document.querySelectorAll('[contenteditable="true"]');
      if (editables.length > 0) {
        console.log('Found contenteditable in Gmail compose window');
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
      console.log('Found generic role="textbox" element');
      return roleTextboxes[0];
    }
    
    return null;
  } catch (e) {
    console.error('Error finding Gmail compose box:', e);
    return null;
  }
}

// Find an element using the previously stored path
function findElementByPath(path) {
  if (!path) return null;
  
  try {
    // For elements with ID
    if (path.type === 'id' && path.value) {
      return document.getElementById(path.value);
    }
    
    // For Gmail compose box
    if (path.type === 'gmail-compose') {
      const composeDivs = document.querySelectorAll('div[role="textbox"]');
      if (composeDivs.length > 0) {
        // Get the most recently focused one or the first one
        return document.activeElement.closest('div[role="textbox"]') || composeDivs[0];
      }
    }
    
    // For elements with a CSS selector path
    if (path.type === 'selector' && path.value) {
      const elements = document.querySelectorAll(path.value);
      if (elements.length > 0) return elements[0];
    }
    
    return null;
  } catch (e) {
    console.error('Error finding element by path:', e);
    return null;
  }
}

// Insert text into Gmail compose box specifically
function insertIntoGmail(element, content) {
  console.log('Gmail insertion method started with element:', element);
  
  // Find the actual compose box using multiple selectors for maximum reliability
  // This targets the exact structure shared by the user
  let composeBox = element;
  
  if (!element.getAttribute('role') || element.getAttribute('role') !== 'textbox') {
    // Try to find by role
    composeBox = element.closest('div[role="textbox"]');
    
    // If not found, try to find by Gmail's specific classes
    if (!composeBox) {
      const possibleComposeBoxes = document.querySelectorAll('div.editable[contenteditable="true"][role="textbox"]');
      if (possibleComposeBoxes.length > 0) {
        composeBox = possibleComposeBoxes[0];
      }
    }
    
    // Try by the specific class combination that Gmail uses
    if (!composeBox) {
      const gmailSpecificBoxes = document.querySelectorAll('div.Am.Al.editable.LW-avf');
      if (gmailSpecificBoxes.length > 0) {
        composeBox = gmailSpecificBoxes[0];
      }
    }
  }
  
  // If we couldn't find the compose box, abort
  if (!composeBox) {
    console.error('Could not find Gmail compose box');
    return false;
  }
  
  console.log('Found Gmail compose box:', composeBox);
  
  // GMAIL-SPECIFIC METHOD: Using the exact structure we know works
  try {
    // Make sure we're focused
    composeBox.focus();
    
    // First check if the box is empty (only contains a BR)
    if (composeBox.innerHTML.trim() === '<br>' || composeBox.innerHTML.trim() === '') {
      // Create the exact structure Gmail expects
      const div = document.createElement('div');
      div.textContent = content;
      
      // Clear and insert our content
      composeBox.innerHTML = '';
      composeBox.appendChild(div);
      
      // Add the trailing <br> that Gmail's editor expects
      const br = document.createElement('br');
      composeBox.appendChild(br);
      
      // Dispatch a comprehensive set of events that Gmail listens for
      ['input', 'change', 'compositionend', 'textInput'].forEach(eventType => {
        composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
      });
      
      // Also create a custom event that might trigger Gmail's listeners
      const customEvent = new CustomEvent('gmail-content-change', { bubbles: true, composed: true });
      composeBox.dispatchEvent(customEvent);
      
      console.log('Gmail empty box content insertion successful');
      return true;
    }
  } catch (e) {
    console.error('Gmail specific structure method failed:', e);
  }
  
  // Method 1: Direct innerHTML manipulation with Gmail's expected structure
  try {
    // Create a div structure like Gmail uses
    let html = '';
    const lines = content.split('\n');
    
    // For each line, create a Gmail-style div wrapper
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        html += '<div><br></div>';
      } else {
        html += `<div>${line}</div>`;
      }
    });
    
    // Add final <br> if not already ending with one
    if (!html.endsWith('<br></div>') && !html.endsWith('<div><br></div>')) {
      html += '<br>';
    }
    
    // Apply the HTML
    composeBox.innerHTML = html;
    
    // Dispatch events
    ['input', 'change', 'compositionend'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    console.log('Gmail innerHTML with structure successful');
    return true;
  } catch (e) {
    console.error('Gmail innerHTML with structure failed:', e);
  }
  
  // Method 2: Using execCommand with specific approach for Gmail
  try {
    composeBox.focus();
    
    // Clear any existing selection
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    // Create a range for the entire content
    const range = document.createRange();
    range.selectNodeContents(composeBox);
    selection.addRange(range);
    
    // Replace selection with our text
    if (document.execCommand('insertText', false, content)) {
      // Dispatch events Gmail might be listening for
      ['input', 'change', 'compositionend'].forEach(eventType => {
        composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
      });
      
      console.log('Gmail execCommand method successful');
      return true;
    }
  } catch (e) {
    console.error('Gmail execCommand method failed:', e);
  }
  
  // Method 3: SetData + execCommand approach
  try {
    // This uses an alternative way to set clipboard data
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', content);
    
    // Create a clipboard event with this data
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: clipboardData,
      bubbles: true,
      cancelable: true
    });
    
    // Focus and dispatch the paste event
    composeBox.focus();
    if (composeBox.dispatchEvent(pasteEvent)) {
      console.log('Gmail custom paste event successful');
      return true;
    }
  } catch (e) {
    console.error('Gmail custom paste event failed:', e);
  }
  
  // Method 4: Backup - Try direct textContent/innerHTML as last resort
  try {
    composeBox.textContent = content;
    composeBox.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    composeBox.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    
    // Make sure there's a trailing <br>
    if (!composeBox.querySelector('br:last-child')) {
      const br = document.createElement('br');
      composeBox.appendChild(br);
    }
    
    console.log('Gmail direct textContent method successful');
    return true;
  } catch (e) {
    console.error('Gmail direct textContent method failed:', e);
  }
  
  // Last resort - try to alert the user to manually paste
  try {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Content copied to clipboard. Please press Ctrl+V or Cmd+V in the compose box to paste it.');
      })
      .catch(err => {
        console.error('Clipboard API failed:', err);
        alert('Could not insert text automatically. Please type or paste your content manually.');
      });
    return true;
  } catch (finalError) {
    console.error('All Gmail insertion methods failed:', finalError);
    return false;
  }
}

// Special handling for Gmail compose box
function handleGmailInsertion(element, content) {
  console.log('Gmail specific insertion');
  
  // Find the actual compose box if we're in a child element
  const composeBox = element.closest('div[role="textbox"]') || element;
  
  // GMAIL METHOD 1: DIRECT DOM MANIPULATION - Most reliable for Gmail
  try {
    // First focus the element to ensure proper selection
    composeBox.focus();
    
    // Gmail's editor uses divs with styling
    // Replace or insert content based on whether the box is empty
    if (composeBox.innerHTML.trim() === '' || composeBox.textContent.trim() === '') {
      // Empty compose box - just set the content directly
      // Create a proper structure with a div
      const div = document.createElement('div');
      div.textContent = content;
      
      // Clear any existing content
      composeBox.innerHTML = '';
      
      // Append our new content
      composeBox.appendChild(div);
      
      // Add an empty line at the end for proper cursor position
      const br = document.createElement('br');
      composeBox.appendChild(br);
    } else {
      // Box already has some content
      // We'll use the selection API to insert at cursor position if possible
      const selection = window.getSelection();
      let range;
      
      // Check if there's an active selection inside the compose box
      if (selection.rangeCount > 0 && composeBox.contains(selection.anchorNode)) {
        range = selection.getRangeAt(0);
        
        // Delete any selected content
        range.deleteContents();
        
        // Insert our new content at the cursor position
        const textNode = document.createTextNode(content);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // No valid selection, we'll append to the end
        composeBox.focus();
        
        // Use execCommand as a fallback
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, content);
      }
    }
    
    // Trigger multiple events to ensure Gmail recognizes the changes
    ['input', 'change', 'focus'].forEach(eventType => {
      composeBox.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    return;
  } catch (e) {
    console.error('Gmail direct DOM manipulation failed:', e);
  }
  
  // GMAIL METHOD 2: CLIPBOARD API FALLBACK
  try {
    navigator.clipboard.writeText(content).then(() => {
      composeBox.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('paste');
      
      // Dispatch input event
      composeBox.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }).catch(err => {
      console.error('Clipboard API failed in Gmail:', err);
      
      // Final fallback - just set text content
      composeBox.textContent = content;
      composeBox.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    return;
  } catch (e) {
    console.error('All Gmail insertion methods failed:', e);
  }
}

// Legacy insertIntoContentEditable function removed to prevent duplication
// A more comprehensive implementation is provided later in this file

// Try multiple methods of text insertion when type is unknown
function tryMultipleInsertionMethods(element, content) {
  console.log('Trying multiple insertion methods');
  
  // If it's a standard input or textarea, use the dedicated function
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return insertIntoInputOrTextarea(element, content);
  }
  
  // If it's contentEditable, use the dedicated function
  if (element.isContentEditable) {
    return insertIntoContentEditable(element, content);
  }
  
  // For other elements, try various approaches
  
  // Method 1: Try execCommand
  try {
    element.focus();
    if (document.execCommand('insertText', false, content)) {
      console.log('execCommand method succeeded');
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      return true;
    }
  } catch (e) {
    console.error('execCommand method failed:', e);
  }
  
  // Method 2: Try setting value or textContent directly
  try {
    if ('value' in element) {
      element.value = content;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      console.log('Direct value assignment succeeded');
      return true;
    } else {
      element.textContent = content;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      console.log('textContent assignment succeeded');
      return true;
    }
  } catch (error) {
    console.error('Direct property setting failed:', error);
  }
  
  // Method 3: Last resort - try clipboard API
  try {
    console.log('Trying clipboard API method');
    return navigator.clipboard.writeText(content)
      .then(() => {
        element.focus();
        return document.execCommand('paste');
      })
      .catch(() => false);
  } catch (e) {
    console.error('Clipboard API method failed:', e);
    return false;
  }
}

// Insert text into standard input or textarea elements
function insertIntoInputOrTextarea(element, content) {
  try {
    // Set the value directly
    element.value = content;
    
    // Dispatch all relevant events to ensure the browser recognizes the change
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    
    // Focus the element and set cursor position at the end
    element.focus();
    if ('selectionStart' in element) {
      element.selectionStart = content.length;
      element.selectionEnd = content.length;
    }
    
    console.log('Standard input insertion successful');
    return true;
  } catch (e) {
    console.error('Standard input insertion failed:', e);
    return false;
  }
}

// Insert text into generic contentEditable elements
function insertIntoContentEditable(element, content) {
  // Method 1: Using execCommand
  try {
    element.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, content);
    
    // Trigger necessary events
    ['input', 'change'].forEach(eventType => {
      element.dispatchEvent(new Event(eventType, { bubbles: true, composed: true }));
    });
    
    console.log('ContentEditable insertion successful using execCommand');
    return true;
  } catch (e) {
    console.error('ContentEditable execCommand insertion failed:', e);
  }
  
  // Method 2: Using Selection API
  try {
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    
    selection.removeAllRanges();
    range.selectNodeContents(element);
    selection.addRange(range);
    
    selection.deleteFromDocument();
    const textNode = document.createTextNode(content);
    range.insertNode(textNode);
    
    // Trigger events
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    
    console.log('ContentEditable insertion successful using Selection API');
    return true;
  } catch (e) {
    console.error('ContentEditable Selection API insertion failed:', e);
  }
  
  // Method 3: Direct textContent/innerHTML manipulation
  try {
    // First try with textContent to preserve formatting
    element.textContent = content;
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    
    console.log('ContentEditable insertion successful using textContent');
    return true;
  } catch (e) {
    console.error('ContentEditable textContent insertion failed:', e);
    
    // Last resort: try innerHTML
    try {
      element.innerHTML = content;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      console.log('ContentEditable insertion successful using innerHTML');
      return true;
    } catch (innerError) {
      console.error('All ContentEditable insertion methods failed:', innerError);
      return false;
    }
  }
}

// Try all possible insertion methods as a last resort
function tryAllInsertionMethods(element, content) {
  console.log('Trying all insertion methods as fallback');
  
  // Method 1: Try clipboard API first
  try {
    element.focus();
    
    return navigator.clipboard.writeText(content)
      .then(() => {
        return document.execCommand('paste');
      })
      .catch(() => {
        // Method 2: Try direct value/property assignments
        if ('value' in element) {
          element.value = content;
          element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          return true;
        } else if (element.isContentEditable) {
          return insertIntoContentEditable(element, content);
        } else {
          // Method 3: Try textContent as last resort
          element.textContent = content;
          return true;
        }
      });
  } catch (e) {
    console.error('All insertion methods failed:', e);
    return false;
  }
}

// Helper function to simulate typing - legacy, kept for compatibility
function simulateTyping(element, text) {
  console.log('Using legacy simulateTyping method');
  
  // Focus the element
  element.focus();
  
  // For input/textarea elements
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    return true;
  } 
  // For contenteditable elements
  else if (element.isContentEditable) {
    // Use the Selection and Range APIs to insert text
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Clear any existing selection
    selection.removeAllRanges();
    
    // Select the element content
    range.selectNodeContents(element);
    selection.addRange(range);
    
    // Replace selection with our text
    return document.execCommand('insertText', false, text);
  }
  
  return false;
}

// Edit AI content
function editAiContent() {
  const aiContent = document.getElementById('ai-result-content').textContent;
  
  // Show instruction area again with the AI content
  document.getElementById('ai-result-container').style.display = 'none';
  document.getElementById('ai-instruction-container').style.display = 'block';
  document.getElementById('ai-instruction').value = aiContent;
}

// Cancel AI operation
function cancelAiContent() {
  document.getElementById('ai-result-container').style.display = 'none';
  document.getElementById('ai-instruction-container').style.display = 'block';
}

// Toggle the assistant panel
function toggleAssistantPanel() {
  if (!aiAssistantPanel) {
    createAssistantPanel();
  }
  
  isPanelOpen = !isPanelOpen;
  
  if (isPanelOpen) {
    aiAssistantPanel.style.display = 'block';
    
    // Position the panel near the floating button
    const buttonRect = floatingButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 320; // Width defined in CSS
    const panelHeight = 350; // Approximate height of panel
    
    // Calculate position to ensure panel stays within viewport
    let topPos = buttonRect.bottom + window.scrollY + 10;
    let leftPos = buttonRect.left + window.scrollX;
    
    // Ensure panel doesn't go off the right edge
    if (leftPos + panelWidth > viewportWidth) {
      leftPos = Math.max(10, viewportWidth - panelWidth - 10);
    }
    
    // Ensure panel doesn't go off the bottom edge
    if (topPos + panelHeight > window.scrollY + viewportHeight) {
      // Place above the button if not enough space below
      topPos = Math.max(10, buttonRect.top + window.scrollY - panelHeight - 10);
    }
    
    aiAssistantPanel.style.top = `${topPos}px`;
    aiAssistantPanel.style.left = `${leftPos}px`;
    
    // Make panel draggable
    makePanelDraggable(aiAssistantPanel);
    
    // If input is selected, prefill with its content for refine/restyle
    if (selectedInputElement) {
      setMode('refine');
    } else {
      setMode('write');
    }
  } else {
    aiAssistantPanel.style.display = 'none';
  }
}

// Make the panel draggable
function makePanelDraggable(panel) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  
  // Add a drag handle to the panel header
  const header = panel.querySelector('.panel-header');
  header.style.cursor = 'move';
  
  header.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);
  
  function startDragging(e) {
    // Only initiate drag if we're clicking on the header but not on the close button
    if (e.target.id === 'close-ai-panel') {
      return;
    }
    
    isDragging = true;
    
    // Get the current panel position
    const panelRect = panel.getBoundingClientRect();
    
    // Calculate the offset between mouse position and panel top-left corner
    offsetX = e.clientX - panelRect.left;
    offsetY = e.clientY - panelRect.top;
    
    // Prevent text selection during drag
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    // Calculate new position
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    // Apply new position
    panel.style.left = `${Math.max(0, newLeft)}px`;
    panel.style.top = `${Math.max(0, newTop)}px`;
  }
  
  function stopDragging() {
    isDragging = false;
  }
}

// Setup global event listeners
function setupEventListeners() {
  // Listen for focus events on input elements
  document.addEventListener('focusin', event => {
    const elem = event.target;
    
    // Check if the target is a text input element
    if (isInputElement(elem)) {
      lastFocusedElement = elem;
      selectedInputElement = elem;
      
      // Store a path to the element for possible re-finding later
      try {
        lastSelectedInputElementPath = getElementPath(elem);
        console.log('Element path stored:', lastSelectedInputElementPath);
      } catch (e) {
        console.error('Could not generate element path:', e);
      }
      
      showFloatingButtonNearElement(elem);
    }
  });
  
  // Listen for click events on the document to handle complex editors
  document.addEventListener('click', event => {
    const elem = event.target;
    
    // Special handling for Gmail editor which might not trigger focusin properly
    if (window.location.hostname === 'mail.google.com') {
      // Check if clicked inside a compose box
      const composeBox = elem.closest('div[role="textbox"]');
      if (composeBox) {
        lastFocusedElement = composeBox;
        selectedInputElement = composeBox;
        selectedInputType = 'gmail-compose';
        showFloatingButtonNearElement(composeBox);
      }
    }
  });
  
  // Listen for blur events
  document.addEventListener('focusout', event => {
    // Only hide if we're not focusing another input and not clicking our own UI
    setTimeout(() => {
      const newActiveElement = document.activeElement;
      if (!isInputElement(newActiveElement) && 
          newActiveElement !== floatingButton && 
          !aiAssistantPanel?.contains(newActiveElement) &&
          !isPanelOpen) {
        hideFloatingButton();
        // Don't clear selectedInputElement so we can still apply content later
        // Just keep the last selection available
      }
    }, 100);
  });
}

// Helper function to generate a path to an element for re-finding it later
function getElementPath(element) {
  if (!element) return null;
  
  // For inputs and textareas with IDs, we can use the ID
  if (element.id && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
    return {
      type: 'id',
      value: element.id,
      tagName: element.tagName.toLowerCase()
    };
  }
  
  // For Gmail compose box
  if (window.location.hostname === 'mail.google.com' && 
      (element.getAttribute('role') === 'textbox' || element.closest('div[role="textbox"]'))) {
    return {
      type: 'gmail-compose',
      value: 'div[role="textbox"]'
    };
  }
  
  // For generic elements, try to create a unique selector
  try {
    let path = '';
    let currentElement = element;
    
    while (currentElement && currentElement !== document.body) {
      let selector = currentElement.tagName.toLowerCase();
      
      if (currentElement.id) {
        selector += '#' + currentElement.id;
        path = selector + (path ? ' > ' + path : '');
        break;
      } else if (currentElement.className) {
        selector += '.' + Array.from(currentElement.classList).join('.');
      }
      
      // Add position among siblings
      let sibling = currentElement;
      let siblingPosition = 1;
      
      while (sibling = sibling.previousElementSibling) {
        siblingPosition++;
      }
      
      selector += ':nth-child(' + siblingPosition + ')';
      path = selector + (path ? ' > ' + path : '');
      
      currentElement = currentElement.parentElement;
    }
    
    return {
      type: 'selector',
      value: path
    };
  } catch (e) {
    console.error('Error generating element path:', e);
    return null;
  }
}

// Check if the element is a text input element
function isInputElement(element) {
  // Store the input type for later use
  let inputType = null;
  
  // Basic input types
  if (element.tagName === 'INPUT' && 
      (element.type === 'text' || 
       element.type === 'email' || 
       element.type === 'search' || 
       element.type === 'url' || 
       element.type === '' || 
       !element.type)) {
    inputType = 'input';
    selectedInputType = 'input';
    console.log('Detected standard INPUT element');
    return true;
  }
  
  // Textareas
  if (element.tagName === 'TEXTAREA') {
    inputType = 'textarea';
    selectedInputType = 'textarea';
    console.log('Detected TEXTAREA element');
    return true;
  }
  
  // Generic contenteditable elements
  if (element.isContentEditable) {
    inputType = 'contentEditable';
    selectedInputType = 'contentEditable';
    console.log('Detected generic contentEditable element');
    return true;
  }
  
  // Gmail specific detection
  if (window.location.hostname === 'mail.google.com') {
    // Gmail compose area has role="textbox"
    if (element.getAttribute('role') === 'textbox') {
      inputType = 'gmail-compose';
      selectedInputType = 'gmail-compose';
      console.log('Detected Gmail compose box directly');
      return true;
    }
    
    // Direct match for Gmail's specific compose box classes as shared by the user
    // Example: <div id=":r8" class="Am aiL Al editable LW-avf tS-tW" hidefocus="true" aria-label="Message Body" role="textbox" contenteditable="true">
    if (element.classList && (
        (element.classList.contains('editable') && element.classList.contains('LW-avf')) ||
        (element.classList.contains('Am') && element.classList.contains('Al'))
      )) {
      inputType = 'gmail-compose';
      selectedInputType = 'gmail-compose';
      console.log('Detected Gmail compose box by class names');
      return true;
    }
    
    // Match by Gmail-specific attributes
    if (element.getAttribute('g_editable') === 'true' || 
        element.getAttribute('aria-label') === 'Message Body' ||
        element.getAttribute('aria-multiline') === 'true') {
      inputType = 'gmail-compose';
      selectedInputType = 'gmail-compose';
      console.log('Detected Gmail compose box by attributes');
      return true;
    }
    
    // Also detect if we're inside the compose area
    const textbox = element.closest('div[role="textbox"], div.editable.LW-avf');
    if (textbox) {
      // Save the actual textbox as the target, not the child element
      selectedInputElement = textbox;
      inputType = 'gmail-compose';
      selectedInputType = 'gmail-compose';
      console.log('Detected element inside Gmail compose box');
      return true;
    }
    
    // Final attempt - check for any contenteditables within Gmail
    if (window.location.pathname.includes('/compose')) {
      const editables = document.querySelectorAll('[contenteditable="true"]');
      for (const editable of editables) {
        if (editable.isContentEditable) {
          selectedInputElement = editable;
          inputType = 'gmail-compose';
          selectedInputType = 'gmail-compose';
          console.log('Found contenteditable in Gmail compose window');
          return true;
        }
      }
    }
  }
  
  // Google Docs detection
  if (window.location.hostname === 'docs.google.com') {
    // The main editable area in Google Docs
    const kixPage = element.closest('.kix-page');
    if (kixPage) {
      inputType = 'google-docs';
      selectedInputType = 'google-docs';
      console.log('Detected Google Docs editor');
      return true;
    }
  }
  
  console.log('Element is not a recognized input type:', element);
  return false;
}

// Show floating button near the input element
function showFloatingButtonNearElement(element) {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  // Position the button at the right edge of the input
  let topPos = rect.top + window.scrollY;
  let leftPos = rect.right + window.scrollX + 5;
  
  // Make sure the button doesn't go off-screen
  if (leftPos + 36 > viewportWidth) { // 36px is button width
    leftPos = rect.left + window.scrollX - 40; // Position on left side instead
  }
  
  floatingButton.style.top = `${topPos}px`;
  floatingButton.style.left = `${leftPos}px`;
  floatingButton.style.display = 'block';
  
  // Special handling for Gmail to bring the floating button to front
  if (window.location.hostname === 'mail.google.com') {
    floatingButton.style.zIndex = '2147483646';
  }
}

// Hide the floating button
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.display = 'none';
  }
}

// Initialize when the content script loads
initialize();
