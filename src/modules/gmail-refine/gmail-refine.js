/**
 * Gmail Refine Integration Module
 * Handles integration between Gmail compose boxes and the refine/rewrite functionality
 */

import { createRefineButton, createRefineModal } from './refine-ui.js';
import { refineEmailWithTone, rewriteEmail, updateComposeBoxContent } from './refine-handler.js';
import { loadRefineStyles } from './css-loader.js';

// Variable to track if refine functionality is active
let isRefineActive = false;
// Track current refine instances
let currentRefineInstances = new Map();

/**
 * Adds a refine button to Gmail compose boxes
 * @param {HTMLElement} composeBox - The Gmail compose box to add the button to
 */
function addRefineButtonToGmail(composeBox) {
  // Check if we've already added a refine button to this compose box or its parent
  if (composeBox.querySelector('.chromex-refine-button') || 
      composeBox.parentElement.querySelector('.chromex-refine-button') || 
      document.querySelector(`.chromex-refine-button[data-compose-id="${composeBox.getAttribute('data-chromex-id')}"]`)) {
    return;
  }
  
  // Give this compose box a unique identifier if it doesn't have one
  if (!composeBox.getAttribute('data-chromex-id')) {
    composeBox.setAttribute('data-chromex-id', `compose-${Date.now()}`);
  }
  
  // Create refine button
  const refineButton = createRefineButton();
  // Link this button to this specific compose box
  refineButton.setAttribute('data-compose-id', composeBox.getAttribute('data-chromex-id'));
  
  // Add click event to show refine modal
  refineButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the email content from the compose box with proper formatting
    const emailContent = getFormattedEmailContent(composeBox);
    
    // Create refine modal with current email content
    const refineModal = createRefineModal(emailContent);
    document.body.appendChild(refineModal.modal);
    
    // Handle action button click (refine or rewrite)
    refineModal.onAction(async () => {
      const activeTab = refineModal.getActiveTab();
      
      if (activeTab === 'refine') {
        // Get selected tone
        const selectedTone = refineModal.getSelectedTone();
        
        // Show loading state
        const actionBtn = refineModal.modal.querySelector('.chromex-action-button');
        const originalBtnText = actionBtn.textContent;
        actionBtn.textContent = 'Processing...';
        actionBtn.disabled = true;
        
        try {
          // Call API to refine email with selected tone
          await refineEmailWithTone(
            refineModal.getEmailContent(), 
            selectedTone,
            (updatedContent) => {
              // Update the content in the modal in real-time as it streams
              refineModal.updateEmailContent(updatedContent);
            }
          );
          
          // Show apply button when done
          refineModal.showApplyButton();
          
        } catch (error) {
          console.error('Error refining email:', error);
          alert(`Error refining email: ${error.message}`);
          
          // Reset button
          actionBtn.textContent = originalBtnText;
          actionBtn.disabled = false;
        }
      } else { // rewrite mode
        // Get user instructions
        const instructions = refineModal.getPrompt();
        if (!instructions) {
          alert('Please provide instructions for rewriting the email');
          return;
        }
        
        // Show loading state
        const actionBtn = refineModal.modal.querySelector('.chromex-action-button');
        const originalBtnText = actionBtn.textContent;
        actionBtn.textContent = 'Processing...';
        actionBtn.disabled = true;
        
        try {
          // Call API to rewrite email based on instructions
          await rewriteEmail(
            refineModal.getEmailContent(), 
            instructions,
            (updatedContent) => {
              // Update the content in the modal in real-time as it streams
              refineModal.updateEmailContent(updatedContent);
            }
          );
          
          // Show apply button when done
          refineModal.showApplyButton();
          
        } catch (error) {
          console.error('Error rewriting email:', error);
          alert(`Error rewriting email: ${error.message}`);
          
          // Reset button
          actionBtn.textContent = originalBtnText;
          actionBtn.disabled = false;
        }
      }
    });
    
    // Handle apply button click
    refineModal.onApply(() => {
      // Get the updated email content from the modal
      const updatedContent = refineModal.getEmailContent();
      
      // Update the Gmail compose box with the new content
      updateComposeBoxContent(composeBox, updatedContent);
      
      // Close the modal
      document.body.removeChild(refineModal.modal);
    });
  });
  
  // Append the refine button to the bottom left of the compose box
  composeBox.parentElement.appendChild(refineButton);
  
  // Keep track of this instance
  const instanceId = `refine-${Date.now()}`;
  currentRefineInstances.set(instanceId, { composeBox, refineButton });
  
/**
 * Get formatted email content from Gmail compose box
 * @param {HTMLElement} composeBox - The Gmail compose box
 * @returns {string} Formatted email content
 */
function getFormattedEmailContent(composeBox) {
  if (!composeBox) return '';
  
  // Extract the HTML content directly to preserve styling and proper paragraph structure
  const htmlContent = composeBox.innerHTML;
  
  // Create a DOM parser to work with the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const parsedContent = doc.body.firstChild;
  
  // Extract properly formatted paragraphs
  const formattedParagraphs = [];
  let currentBlock = '';
  
  function processNode(node) {
    // Skip empty nodes
    if (!node) return;
    
    // Handle different node types to preserve structure
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Gmail uses <p> tags with styles for proper paragraphs
      if (node.nodeName === 'P') {
        // Complete the current block if any
        if (currentBlock.trim()) {
          formattedParagraphs.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Get text from this paragraph
        let paraText = node.textContent.trim();
        if (paraText) {
          formattedParagraphs.push(paraText);
        }
      } 
      // Special handling for <br> tags - preserves line breaks in signatures
      else if (node.nodeName === 'BR') {
        currentBlock += '\n';
      }
      // Process other elements recursively
      else {
        // First check if this is a block element that should create a paragraph break
        const isBlockElement = ['DIV', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName);
        
        // Handle block element transition
        if (isBlockElement && currentBlock.trim()) {
          formattedParagraphs.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Process all child nodes
        Array.from(node.childNodes).forEach(processNode);
        
        // Add paragraph break after block elements if they had content
        if (isBlockElement && node.textContent.trim()) {
          if (currentBlock.trim()) {
            formattedParagraphs.push(currentBlock.trim());
            currentBlock = '';
          }
        }
      }
    }
    // Handle text nodes
    else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text.trim()) {
        currentBlock += text;
      }
    }
  }
  
  // Process the entire content
  Array.from(parsedContent.childNodes).forEach(processNode);
  
  // Add any remaining content
  if (currentBlock.trim()) {
    formattedParagraphs.push(currentBlock.trim());
  }
  
  // Combine paragraphs with proper spacing
  const result = formattedParagraphs.join('\n\n');
  return result;
}

  // Cleanup function to remove button when compose box is closed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.removedNodes.length > 0) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          const removedNode = mutation.removedNodes[i];
          if (removedNode.contains(composeBox)) {
            // Compose box was removed, clean up
            observer.disconnect();
            if (refineButton.parentNode) {
              refineButton.parentNode.removeChild(refineButton);
            }
            currentRefineInstances.delete(instanceId);
            break;
          }
        }
      }
    });
  });
  
  // Start observing
  observer.observe(composeBox.parentElement.parentElement, { childList: true, subtree: true });
}

/**
 * Check if a compose box has content
 * @param {HTMLElement} composeBox - The Gmail compose box to check
 * @returns {boolean} - True if the compose box has content
 */
function composeBoxHasContent(composeBox) {
  if (!composeBox) return false;
  
  // Check if there's any non-whitespace text content
  const content = composeBox.textContent || '';
  return content.trim().length > 0;
}

/**
 * Initialize Gmail refine functionality
 * Sets up MutationObserver to detect new Gmail compose boxes
 */
function initGmailRefine() {
  if (isRefineActive) return;
  isRefineActive = true;
  
  // Load refine styles
  loadRefineStyles();
  
  console.log('ChromeX: Initializing Gmail refine functionality');
  
  // Check for existing compose boxes on page load
  const existingComposeBoxes = document.querySelectorAll('div[role="textbox"][aria-label="Message Body"]');
  existingComposeBoxes.forEach(composeBox => {
    // Only add refine button if there's content
    if (composeBoxHasContent(composeBox)) {
      addRefineButtonToGmail(composeBox);
    }
  });
  
  // Watch for new compose boxes and content changes using MutationObserver
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle added nodes (new compose boxes)
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is a compose box
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.getAttribute('role') === 'textbox' && 
                node.getAttribute('aria-label') === 'Message Body') {
              console.log('ChromeX: Detected new Gmail compose box');
              // Only add the button if there's content
              if (composeBoxHasContent(node)) {
                addRefineButtonToGmail(node);
              }
            }
            
            // Check if children contain compose boxes
            const composeBoxes = node.querySelectorAll('div[role="textbox"][aria-label="Message Body"]');
            composeBoxes.forEach(composeBox => {
              console.log('ChromeX: Detected new Gmail compose box (child)');
              // Only add the button if there's content
              if (composeBoxHasContent(composeBox)) {
                addRefineButtonToGmail(composeBox);
              }
            });
          }
        });
      }
      
      // Handle character data changes (user typing in compose box)
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        const targetNode = mutation.target.closest ? mutation.target.closest('div[role="textbox"][aria-label="Message Body"]') : null;
        if (targetNode || (mutation.target.parentElement && mutation.target.parentElement.getAttribute && 
                          mutation.target.parentElement.getAttribute('role') === 'textbox' && 
                          mutation.target.parentElement.getAttribute('aria-label') === 'Message Body')) {
          const composeBox = targetNode || mutation.target.parentElement;
          
          // Check if it has content now
          const hasContent = composeBoxHasContent(composeBox);
          const hasButton = composeBox.querySelector('.chromex-refine-button') || 
                           composeBox.parentElement.querySelector('.chromex-refine-button') || 
                           document.querySelector(`.chromex-refine-button[data-compose-id="${composeBox.getAttribute('data-chromex-id')}"]`);
          
          // Add button if there's content and no button yet
          if (hasContent && !hasButton) {
            addRefineButtonToGmail(composeBox);
          }
          // Remove button if there's no content but there is a button
          else if (!hasContent && hasButton && hasButton.parentNode) {
            hasButton.parentNode.removeChild(hasButton);
          }
        }
      }
    }
  });
  
  // Start observing document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('ChromeX: Gmail refine functionality initialized');
}

export { initGmailRefine };
