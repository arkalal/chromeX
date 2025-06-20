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
 * Parse Gmail content to preserve paragraph structure
 * @param {string} content - The raw content from Gmail compose
 * @returns {string} Properly formatted content
 */
function parseGmailContent(content) {
  if (!content) return '';
  
  // Remove any subject line that might have been added to the body
  let parsedContent = content;
  const subjectMatch = parsedContent.match(/^Subject:\s+.*$/m);
  if (subjectMatch) {
    parsedContent = parsedContent.replace(subjectMatch[0], '').trim();
  }
  
  // Create a temporary container to process the HTML content
  const tempDiv = document.createElement('div');
  
  // Handle case where content might be raw text or HTML
  if (content.includes('<div>') || content.includes('<br>')) {
    tempDiv.innerHTML = parsedContent;
  } else {
    // Content is likely plain text, convert newlines to proper structure
    tempDiv.textContent = parsedContent;
    return parsedContent; // Return as-is for plain text
  }
  
  // Extract the content directly from the compose box structure
  // This better preserves Gmail's original formatting
  let extractedContent = extractGmailStructure(tempDiv);
  return extractedContent;
}

/**
 * Helper function to extract formatted content from Gmail's compose box structure
 * @param {HTMLElement} container - Container with Gmail content
 * @returns {string} Formatted content for textarea display
 */
function extractGmailStructure(container) {
  // Gmail uses a structure where paragraphs are divs and line breaks are <br> elements
  // We need to reconstruct this in a way that preserves formatting in a textarea
  
  const paragraphs = [];
  let currentParagraph = '';
  let previousWasBr = false;
  let emptyDivCount = 0;
  
  // Helper function to process text content from nodes
  function processTextContent(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // For elements, we need to preserve important formatting
      if (node.nodeName === 'BR') {
        return '\n';
      } else if (node.nodeName === 'DIV' && (!node.textContent.trim() || node.innerHTML === '<br>')) {
        // Empty div or div with just <br> indicates paragraph break in Gmail
        emptyDivCount++;
        return emptyDivCount > 1 ? '\n' : '';  // Only add extra break if multiple empty divs
      } else {
        // For other elements, collect their text content recursively
        let text = '';
        for (const child of node.childNodes) {
          text += processTextContent(child);
        }
        return text;
      }
    }
    return '';
  }
  
  // Process each direct child of the container (typically div elements in Gmail)
  for (let i = 0; i < container.childNodes.length; i++) {
    const node = container.childNodes[i];
    
    // Check if this is a block-level element that should create a paragraph break
    const isBlockElement = node.nodeType === Node.ELEMENT_NODE && 
                         ['DIV', 'P', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName);
    
    // If this is a block element and we already have content, start a new paragraph
    if (isBlockElement && currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = '';
      previousWasBr = false;
      emptyDivCount = 0;
    }
    
    // Process the content of this node
    const nodeContent = processTextContent(node);
    
    // Add the content to the current paragraph
    currentParagraph += nodeContent;
    
    // If this was a block element, prepare for potential paragraph break
    if (isBlockElement && i < container.childNodes.length - 1) {
      // Only add paragraph break if there's content
      if (nodeContent.trim()) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
        previousWasBr = false;
        emptyDivCount = 0;
      }
    }
  }
  
  // Add the last paragraph if there's content
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }
  
  // Join all paragraphs with double newlines
  return paragraphs.join('\n\n');
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
  // Parse the emailContent to maintain proper formatting
  // The content from Gmail is already formatted as HTML with proper <p> tags
  const parsedEmailContent = emailContent;
  
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
