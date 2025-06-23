/**
 * Gmail Refine UI Module
 * Handles the UI elements for refining and rewriting emails in Gmail
 */

// Available tone options
const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'casual', label: 'Casual' },
  { id: 'persuasive', label: 'Persuasive' }
];

/**
 * Parse Gmail content to preserve paragraph structure with special handling for signatures
 * @param {string} content - The raw content from Gmail compose
 * @returns {string} Properly formatted content
 */
function parseGmailContent(content) {
  if (!content) return '';
  
  // Common signature components
  const signatureMarkers = ['[Your Name]', '[Your Position]', '[Your Contact Information]'];
  const signatureLineDetectors = ['Best regards', 'Regards', 'Sincerely', 'Thank you', 'Thanks', 'Take care']; 
  
  // Remove any subject line that might have been added to the body
  let parsedContent = content;
  const subjectMatch = parsedContent.match(/^Subject:\s+.*$/m);
  if (subjectMatch) {
    parsedContent = parsedContent.replace(subjectMatch[0], '').trim();
  }
  
  // Create a temporary div to parse HTML content
  const tempDiv = document.createElement('div');
  
  // Check if content is HTML or plain text 
  const isHTML = content.includes('<div>') || content.includes('<br>') || content.includes('<p>');
  
  if (isHTML) {
    tempDiv.innerHTML = parsedContent;
    
    // This will process HTML content more intelligently
    return processHTMLContentForPopup(tempDiv, signatureMarkers, signatureLineDetectors);
  } else {
    // Content is plain text, needs special handling too
    return processPlainTextForPopup(parsedContent, signatureMarkers, signatureLineDetectors);
  }
}

/**
 * Process HTML content for proper display in the refine popup
 * @param {HTMLElement} container - Container with Gmail content
 * @param {Array} signatureMarkers - Array of signature marker strings
 * @param {Array} signatureLineDetectors - Array of signature line detector strings
 * @returns {string} Formatted content for textarea display
 */
function processHTMLContentForPopup(container, signatureMarkers, signatureLineDetectors) {
  // Extract all content into blocks with proper formatting
  let textBlocks = [];
  let currentBlock = '';
  let inSignature = false;
  
  // Helper function to detect if text contains any signature markers
  function isSignatureLine(text) {
    return signatureMarkers.some(marker => text.includes(marker)) || 
           signatureLineDetectors.some(detector => text.includes(detector));
  }
  
  // More aggressive signature detection
  function detectSignatureLine(text) {
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
  
  // Process text nodes and handle special DIV structures that Gmail uses
  function processNodeAndChildren(node, depth = 0) {
    if (!node) return;
    
    // Extract text content from this node
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      currentBlock += node.textContent;
      return;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Handle BR elements - explicit line breaks
      if (node.nodeName === 'BR') {
        // Always treat BR as a line break
        currentBlock += '\n';
        return;
      }
      
      // Create a new line for DIV and P elements if they contain content
      if ((node.nodeName === 'DIV' || node.nodeName === 'P') && depth > 0) {
        // Check if this is an empty div - Gmail uses these for spacing
        const isEmpty = !node.textContent.trim();
        
        if (!isEmpty) {
          // Detect if this is a signature line
          const nodeText = node.textContent.trim();
          const isSignature = detectSignatureLine(nodeText);
          
          if (isSignature && !inSignature) {
            // First signature line - add spacing before signature section
            inSignature = true;
            // Complete current block if any
            if (currentBlock.trim()) {
              textBlocks.push(currentBlock.trim());
              currentBlock = '';
            }
            // Add an empty line before signature if needed
            if (textBlocks.length > 0 && textBlocks[textBlocks.length-1] !== '') {
              textBlocks.push('');
            }
          }
          
          // Start a new block for significant block elements 
          // but not if we're in a signature section
          if (currentBlock.trim() && !inSignature) {
            textBlocks.push(currentBlock.trim());
            currentBlock = '';
          }
        }
      }
      
      // Process child nodes
      for (const child of node.childNodes) {
        processNodeAndChildren(child, depth + 1);
      }
      
      // For block elements that create line breaks
      if ((node.nodeName === 'DIV' || node.nodeName === 'P') && depth > 0) {
        // If we're in the main body (not signature), add proper spacing
        if (!inSignature) {
          // Add current block if it has content
          if (currentBlock.trim() && textBlocks.length > 0) {
            textBlocks.push(currentBlock.trim());
            currentBlock = '';
          }
        } else {
          // In signature section - ensure each line is on its own line
          if (currentBlock.trim()) {
            textBlocks.push(currentBlock.trim());
            currentBlock = '';
          }
        }
      }
    }
  }
  
  // Start processing from the container
  processNodeAndChildren(container);
  
  // Add any remaining content
  if (currentBlock.trim()) {
    textBlocks.push(currentBlock.trim());
  }
  
  // Filter out empty blocks and ensure proper spacing
  textBlocks = textBlocks.filter(block => block !== null);
  
  // Join blocks with appropriate spacing
  let result = '';
  let prevWasSignature = false;
  
  for (let i = 0; i < textBlocks.length; i++) {
    const block = textBlocks[i];
    const isCurrentSignature = isSignatureLine(block);
    
    // Add appropriate spacing
    if (i > 0) {
      // Between body paragraphs: double newline
      // Between signature lines: single newline
      // Between body and signature: double newline
      if (prevWasSignature && isCurrentSignature) {
        // Signature to signature: single newline
        result += '\n';
      } else if (!prevWasSignature && !isCurrentSignature) {
        // Body to body: double newline
        result += '\n\n';
      } else {
        // Transition between body and signature: double newline
        result += '\n\n';
      }
    }
    
    // Add the block
    result += block;
    prevWasSignature = isCurrentSignature;
  }
  
  return result;
}

/**
 * Process plain text content for proper display in the refine popup
 * @param {string} content - Plain text content
 * @param {Array} signatureMarkers - Array of signature marker strings
 * @param {Array} signatureLineDetectors - Array of signature line detector strings
 * @returns {string} Formatted content for textarea display
 */
function processPlainTextForPopup(content, signatureMarkers, signatureLineDetectors) {
  // Split content into lines
  const lines = content.split('\n');
  const formattedLines = [];
  let inSignature = false;
  
  // Helper function to detect signature lines more aggressively
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
  
  // First pass: identify signature blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the start
    if (line === '' && formattedLines.length === 0) continue;
    
    // Detect signature section
    if (!inSignature && isSignatureLine(line)) {
      inSignature = true;
      
      // Add empty line before signature if needed
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      
      formattedLines.push(line);
      continue;
    } else if (inSignature) {
      // Already in signature section
      if (line !== '') {
        // For signature lines, we want them on separate lines with no extra space
        formattedLines.push(line);
      }
      continue;
    }
    
    // Normal paragraph handling
    if (line !== '') {
      // If this is a new paragraph after a non-empty line, add an empty line
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      formattedLines.push(line);
    }
  }
  
  // Second pass: format with appropriate spacing
  let result = '';
  let prevWasSignature = false;
  
  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    const isCurrentSignature = inSignature && i >= formattedLines.indexOf('') && isSignatureLine(line);
    
    // Add appropriate spacing
    if (i > 0) {
      if (line === '') {
        // Skip empty lines in output
        continue;
      } else if (prevWasSignature && isCurrentSignature) {
        // Signature to signature: single newline
        result += '\n';
      } else if (!prevWasSignature && !isCurrentSignature) {
        // Body to body: double newline
        result += '\n\n';
      } else {
        // Transition between body and signature: double newline
        result += '\n\n';
      }
    }
    
    // Add the line
    if (line !== '') {
      result += line;
      prevWasSignature = isCurrentSignature;
    }
  }
  
  return result;
}

/**
 * Helper function to extract formatted content from Gmail's compose box structure
 * @param {HTMLElement} container - Container with Gmail content
 * @returns {string} Formatted content for textarea display
 */
function extractGmailStructure(container) {
  // We don't need this function anymore as it's replaced by processHTMLContentForPopup
  // But we'll keep a simplified version as a fallback
  
  // Gmail uses a structure where paragraphs are divs and line breaks are <br> elements
  const signatureMarkers = ['[Your Name]', '[Your Position]', '[Your Contact Information]'];
  const signatureLineDetectors = ['Best regards', 'Regards', 'Sincerely', 'Thank you', 'Thanks', 'Take care'];
  
  // Use our new processing function
  return processHTMLContentForPopup(container, signatureMarkers, signatureLineDetectors);
}

/**
 * Create the refine button that appears in Gmail compose
 * @returns {HTMLElement} The refine button
 */
function createRefineButton() {
  const refineButton = document.createElement('button');
  refineButton.textContent = 'Refine';
  refineButton.className = 'chromex-refine-button';
  
  // Apply styling as per requirements - transparent bg, blue border with radius
  refineButton.style.cssText = `
    background-color: transparent;
    color: #4F46E5;
    border: 1px solid #4F46E5;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    margin: 8px 0;
    transition: all 0.2s ease;
  `;
  
  refineButton.addEventListener('mouseover', () => {
    refineButton.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
  });
  
  refineButton.addEventListener('mouseout', () => {
    refineButton.style.backgroundColor = 'transparent';
  });
  
  return refineButton;
}

/**
 * Create the modal for refining/rewriting emails
 * @param {string} emailContent - The current email content
 * @returns {Object} Object containing the modal element and methods
 */
function createRefineModal(emailContent) {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'chromex-refine-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'chromex-refine-modal-content';
  modalContent.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 600px;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  
  // Create header with logo and options
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #E5E7EB;
    padding-bottom: 10px;
  `;
  
  // Logo
  const logo = document.createElement('div');
  logo.textContent = 'ChromeX';
  logo.style.cssText = `
    font-size: 20px;
    font-weight: bold;
    color: #4F46E5;
  `;
  
  // Options tabs
  const options = document.createElement('div');
  options.style.cssText = `
    display: flex;
    gap: 10px;
  `;
  
  const refineTab = document.createElement('button');
  refineTab.textContent = 'Refine';
  refineTab.className = 'chromex-tab active';
  refineTab.dataset.tab = 'refine';
  
  const rewriteTab = document.createElement('button');
  rewriteTab.textContent = 'Rewrite';
  rewriteTab.className = 'chromex-tab';
  rewriteTab.dataset.tab = 'rewrite';
  
  // Style tabs
  [refineTab, rewriteTab].forEach(tab => {
    tab.style.cssText = `
      padding: 8px 20px;
      border: none;
      background-color: ${tab.dataset.tab === 'refine' ? '#4F46E5' : 'white'};
      color: ${tab.dataset.tab === 'refine' ? 'white' : '#6B7280'};
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
    `;
  });
  
  options.appendChild(refineTab);
  options.appendChild(rewriteTab);
  
  header.appendChild(logo);
  header.appendChild(options);
  
  // Create body content that will change based on active tab
  const body = document.createElement('div');
  body.className = 'chromex-refine-body';
  body.style.cssText = `
    flex-grow: 1;
    overflow-y: auto;
    margin-bottom: 15px;
  `;
  
  // Create refine content (shown by default)
  const refineContent = document.createElement('div');
  refineContent.className = 'chromex-refine-content';
  refineContent.style.display = 'block';
  
  // Create rewrite content (hidden by default)
  const rewriteContent = document.createElement('div');
  rewriteContent.className = 'chromex-rewrite-content';
  rewriteContent.style.display = 'none';
  
  // Add email content textarea (readonly for refine, editable for rewrite)
  // Parse the emailContent to maintain proper formatting with special handling for signatures
  const parsedEmailContent = parseGmailContent(emailContent);
  
  const emailTextarea = document.createElement('textarea');
  emailTextarea.className = 'chromex-email-content';
  emailTextarea.value = parsedEmailContent;
  emailTextarea.readOnly = true; // Initially readonly for refine mode
  emailTextarea.style.cssText = `
    width: 100%;
    height: 200px;
    padding: 10px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    margin-bottom: 15px;
    resize: vertical;
  `;
  
  refineContent.appendChild(emailTextarea.cloneNode(true));
  
  // Create editable version for rewrite
  const editableEmailTextarea = emailTextarea.cloneNode(true);
  editableEmailTextarea.readOnly = false;
  rewriteContent.appendChild(editableEmailTextarea);
  
  // Add tone options for refine
  const toneOptionsContainer = document.createElement('div');
  toneOptionsContainer.className = 'chromex-tone-options';
  toneOptionsContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
  `;
  
  TONE_OPTIONS.forEach(tone => {
    const toneButton = document.createElement('button');
    toneButton.textContent = tone.label;
    toneButton.dataset.tone = tone.id;
    toneButton.className = 'chromex-tone-option';
    toneButton.style.cssText = `
      padding: 8px 16px;
      background-color: white;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    toneButton.addEventListener('click', () => {
      // Remove active class from all
      document.querySelectorAll('.chromex-tone-option').forEach(btn => {
        btn.style.backgroundColor = 'white';
        btn.style.borderColor = '#E5E7EB';
        btn.style.color = '#6B7280';
      });
      
      // Add active class
      toneButton.style.backgroundColor = '#4F46E5';
      toneButton.style.borderColor = '#4F46E5';
      toneButton.style.color = 'white';
    });
    
    toneOptionsContainer.appendChild(toneButton);
  });
  
  refineContent.appendChild(toneOptionsContainer);
  
  // Create prompt input for rewrite
  const promptContainer = document.createElement('div');
  promptContainer.className = 'chromex-prompt-container';
  promptContainer.style.cssText = `
    margin-top: 15px;
    margin-bottom: 15px;
  `;
  
  const promptLabel = document.createElement('label');
  promptLabel.textContent = 'Instructions for rewriting:';
  promptLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  `;
  
  const promptInput = document.createElement('textarea');
  promptInput.className = 'chromex-prompt-input';
  promptInput.placeholder = 'e.g., Make this email more persuasive and include a call to action';
  promptInput.style.cssText = `
    width: 100%;
    height: 80px;
    padding: 10px;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    resize: vertical;
  `;
  
  promptContainer.appendChild(promptLabel);
  promptContainer.appendChild(promptInput);
  
  rewriteContent.appendChild(promptContainer);
  
  // Add action buttons
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'chromex-actions';
  actionsContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: auto;
  `;
  
  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'chromex-cancel-button';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    background-color: white;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  // Action button (changes based on tab)
  const actionButton = document.createElement('button');
  actionButton.textContent = 'Update Email';
  actionButton.className = 'chromex-action-button';
  actionButton.style.cssText = `
    padding: 8px 16px;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  // Apply button (shows after email is updated)
  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply';
  applyButton.className = 'chromex-apply-button';
  applyButton.style.cssText = `
    padding: 8px 16px;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: none;
  `;
  
  actionsContainer.appendChild(cancelButton);
  actionsContainer.appendChild(actionButton);
  actionsContainer.appendChild(applyButton);
  
  // Initial setup with refine content
  body.appendChild(refineContent);
  body.appendChild(rewriteContent);
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(actionsContainer);
  modal.appendChild(modalContent);
  
  // Tab switching functionality
  refineTab.addEventListener('click', () => {
    refineTab.style.backgroundColor = '#4F46E5';
    refineTab.style.color = 'white';
    rewriteTab.style.backgroundColor = 'white';
    rewriteTab.style.color = '#6B7280';
    refineContent.style.display = 'block';
    rewriteContent.style.display = 'none';
    actionButton.textContent = 'Update Email';
  });
  
  rewriteTab.addEventListener('click', () => {
    rewriteTab.style.backgroundColor = '#4F46E5';
    rewriteTab.style.color = 'white';
    refineTab.style.backgroundColor = 'white';
    refineTab.style.color = '#6B7280';
    refineContent.style.display = 'none';
    rewriteContent.style.display = 'block';
    actionButton.textContent = 'Rewrite Email';
  });
  
  // Close modal on cancel
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  return {
    modal,
    getActiveTab: () => {
      return refineContent.style.display === 'block' ? 'refine' : 'rewrite';
    },
    getSelectedTone: () => {
      const activeButton = document.querySelector('.chromex-tone-option[style*="background-color: rgb(79, 70, 229)"]');
      return activeButton ? activeButton.dataset.tone : 'professional';
    },
    getEmailContent: () => {
      return rewriteContent.style.display === 'block' 
        ? editableEmailTextarea.value 
        : refineContent.querySelector('.chromex-email-content').value;
    },
    getPrompt: () => {
      return promptInput.value;
    },
    updateEmailContent: (content) => {
      if (refineContent.style.display === 'block') {
        refineContent.querySelector('.chromex-email-content').value = content;
      } else {
        editableEmailTextarea.value = content;
      }
    },
    showApplyButton: () => {
      actionButton.style.display = 'none';
      applyButton.style.display = 'block';
    },
    onAction: (callback) => {
      actionButton.addEventListener('click', callback);
    },
    onApply: (callback) => {
      applyButton.addEventListener('click', callback);
    }
  };
}

export { createRefineButton, createRefineModal };
