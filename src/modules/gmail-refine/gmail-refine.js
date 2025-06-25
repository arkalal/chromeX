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
  
  // Get all the block-level elements directly
  const blockElements = composeBox.querySelectorAll('div, p, br');
  
  if (blockElements.length === 0) {
    // If no block elements, just return the text content
    return composeBox.textContent.trim();
  }
  
  // Extract text preserving the exact block-level formatting
  return extractExactFormattingFromGmail(composeBox);
}

/**
 * Extract content from Gmail preserving exact formatting structure
 * @param {HTMLElement} container - The Gmail compose box
 * @returns {string} Formatted content with exact Gmail spacing preserved
 */
function extractExactFormattingFromGmail(container) {
  if (!container) return '';
  
  // Clone the container to avoid modifying the original
  const containerClone = container.cloneNode(true);
  
  /**
   * Clean up any artifacts that Gmail might introduce but doesn't actually display
   * This ensures what we extract matches what the user actually sees
   */
  function cleanupHiddenElements(node) {
    // Remove Gmail-specific artifacts: labels, hidden elements, images
    const elementsToRemove = Array.from(node.querySelectorAll(
      '[aria-hidden="true"], .gmail_signature, .gmail_quote, img[alt="" i][src="" i], .gmail-custom-emoji'
    ));
    
    elementsToRemove.forEach(el => el.parentNode?.removeChild(el));
    return node;
  }
  
  // ⚠️ IMPORTANT: Don't remove .gmail_signature divs as they contain the actual signature content
  // We just need to clean up invisible artifacts but leave signature structure intact
  function cleanupHiddenElements(node) {
    // Remove only truly invisible elements but preserve signature structure
    const elementsToRemove = Array.from(node.querySelectorAll(
      '[aria-hidden="true"], .gmail_quote, img[alt="" i][src="" i], .gmail-custom-emoji'
    ));
    
    elementsToRemove.forEach(el => el.parentNode?.removeChild(el));
    return node;
  }
  
  // Clean up the cloned container but preserve signature structure
  cleanupHiddenElements(containerClone);
  
  /**
   * Deeply process all nodes to extract text with precise spacing
   * Handles all edge cases in Gmail's rich text editor
   */
  function extractFormattedContent(root) {
    // Array to store each line as it would appear in Gmail
    const lines = [];
    // Current line being built
    let currentLine = '';
    
    /**
     * Process all node types including text, elements, and breaks
     * This preserves formatting while maintaining Gmail's display rules
     */
    function processNode(node) {
      if (!node) return;
      
      // Text node - extract actual visible text
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent;
        return;
      }
      
      // Element node - handle special cases
      if (node.nodeType === Node.ELEMENT_NODE) {
        const nodeName = node.nodeName.toLowerCase();
        
        // Handle explicit line breaks
        if (nodeName === 'br') {
          // Special case: if this is the last BR in a paragraph, handle differently
          // to preserve Gmail's formatting for signatures
          const nextSibling = node.nextSibling;
          if (!nextSibling || 
              (nextSibling.nodeType === Node.TEXT_NODE && !nextSibling.textContent.trim())) {
            // This is the last BR in a block - preserve as a line break at end of paragraph
            lines.push(currentLine);
            currentLine = '';
            return;
          }
          
          // Regular BR in middle of content - creates a new line
          lines.push(currentLine);
          currentLine = '';
          return;
        }
        
        // Handle block elements (DIV, P) which create new lines in Gmail
        if (nodeName === 'div' || nodeName === 'p') {
          // If we've accumulated text, finish this line first
          if (currentLine.trim()) {
            lines.push(currentLine);
            currentLine = '';
          }
          
          // Enhanced detection for signature blocks in paragraphs
          // This covers multiple signature formats in Gmail
          const isLikelySignature = (
            // Check for signature markers
            node.innerHTML.includes('[Your') || 
            node.innerHTML.toLowerCase().includes('regards,') ||
            node.innerHTML.toLowerCase().includes('sincerely,') ||
            node.innerHTML.toLowerCase().includes('thank you') ||
            node.textContent.includes('Contact Information') ||
            // Detect signature by structure (p tag at end of email with br tags)
            (node.innerHTML.includes('<br>') && 
             !node.nextElementSibling && 
             node.previousElementSibling && 
             node.previousElementSibling.textContent.trim().length > 0) ||
            // Look for common signature patterns
            /^[A-Z][a-z]+\s[A-Z][a-z]+<br>/.test(node.innerHTML) // Name pattern
          );
          
          // Special case for paragraphs that look like signatures
          if (node.innerHTML.includes('<br>') && isLikelySignature) {
            console.log('Detected signature paragraph:', node.innerHTML);
            
            // Get all HTML nodes including text and BR elements
            const childNodes = Array.from(node.childNodes);
            let signaturePart = '';
            let signatureLines = [];
            
            // Process each node to extract signature parts
            for (const childNode of childNodes) {
              if (childNode.nodeType === Node.TEXT_NODE) {
                // Add text content
                signaturePart += childNode.textContent;
              } 
              else if (childNode.nodeType === Node.ELEMENT_NODE && 
                       childNode.nodeName.toLowerCase() === 'br') {
                // When we hit a BR tag, finish the current line and start a new one
                if (signaturePart.trim()) {
                  signatureLines.push(signaturePart.trim());
                }
                signaturePart = '';
              }
            }
            
            // Add the last part if there's remaining text
            if (signaturePart.trim()) {
              signatureLines.push(signaturePart.trim());
            }
            
            // Add all signature lines to output
            signatureLines.forEach(line => lines.push(line));
            return;
          }
          
          // Special handling for signature blocks that Gmail creates
          if (node.classList?.contains('gmail_signature') || 
              node.getAttribute('data-smartmail') === 'gmail_signature') {
            // Process signature lines - each element should be on its own line
            // This ensures signature formatting matches exactly what Gmail displays
            Array.from(node.children).forEach(signatureElement => {
              // Each child of signature block is a separate line
              const signatureText = signatureElement.textContent.trim();
              if (signatureText) {
                lines.push(signatureText);
              } else if (signatureElement.innerHTML === '<br>') {
                lines.push(''); // Empty line in signature
              }
            });
            
            // If signature had no children but has text content, add it as a line
            if (node.children.length === 0 && node.textContent.trim()) {
              lines.push(node.textContent.trim());
            }
            return;
          }
          
          // Special case: empty DIV with BR represents a blank line in Gmail
          if ((node.innerHTML === '<br>' || node.innerHTML.trim() === '') &&
              (!node.textContent || !node.textContent.trim())) {
            lines.push('');
            return;
          }
          
          // Process all child nodes to extract formatting
          for (const child of node.childNodes) {
            processNode(child);
          }
          
          // End of block - push current line if not empty and reset
          if (currentLine.trim()) {
            lines.push(currentLine);
            currentLine = '';
          }
          return;
        }
        
        // Process other inline elements (spans, formatting, etc.)
        for (const child of node.childNodes) {
          processNode(child);
        }
      }
    }
    
    // Start processing from root
    for (const child of root.childNodes) {
      processNode(child);
    }
    
    // Add any remaining text
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  // Extract all content lines with precise formatting
  const extractedLines = extractFormattedContent(containerClone);
  
  /**
   * Normalize line breaks according to Gmail's visual rendering rules:
   * - Multiple consecutive empty lines are collapsed into one
   * - Preserve single empty lines for spacing
   * - Trim whitespace from beginning/end of each line while preserving internal spaces
   */
  function normalizeLineBreaks(lines) {
    const normalized = [];
    let lastLineEmpty = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - only keep if we haven't just added an empty line
        if (!lastLineEmpty) {
          normalized.push('');
          lastLineEmpty = true;
        }
      } else {
        // Non-empty line - add it and reset empty line tracker
        normalized.push(trimmedLine);
        lastLineEmpty = false;
      }
    }
    
    return normalized;
  }
  
  /**
   * Enhanced signature detection and preservation
   * This function more accurately identifies signature lines using both content and position heuristics
   */
  function detectSignatureLines(lines) {
    // Define common markers for signature content
    const signatureMarkers = [
      '[Your Name]', '[Your Full Name]', '[Your Position]', '[Your Contact Information]',
      'Kind regards', 'Warm regards', 'Best regards', 'Regards', 'Sincerely',
      'Thank you', 'Thanks', 'Best', 'Warm', 'Sincerely yours',
      'Yours sincerely', 'Respectfully', 'Cheers', 'All the best'
    ];
    
    let detectedSignatureStartLine = -1;
    
    // First pass - check for clear signature indicators
    for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for exact signature phrases
      const hasSignatureMarker = signatureMarkers.some(marker => 
        line.toLowerCase().includes(marker.toLowerCase()) ||
        line.toLowerCase().startsWith(marker.toLowerCase())
      );
      
      // Check for signature patterns
      const isSignaturePattern =
        /^\[Your\s/.test(line) || // [Your something]
        /^\[\w+\s/.test(line) || // Any [Word something]
        /^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(line) || // First Last name pattern
        (line.split(' ').length <= 4 && line.split(' ').length > 1); // Short name-like lines
      
      if (hasSignatureMarker || isSignaturePattern) {
        detectedSignatureStartLine = i;
        break;
      }
    }
    
    // Second pass - check for structural signature patterns (last 3-5 short lines)
    if (detectedSignatureStartLine === -1 && lines.length > 3) {
      const lastFewLines = lines.slice(Math.max(0, lines.length - 5));
      
      // If the last few lines are all short (likely contact info/signature)
      const allShort = lastFewLines.every(line => line.trim().length < 50);
      const hasEmptyLineInBetween = lastFewLines.some(line => line.trim() === '');
      
      if (allShort && !hasEmptyLineInBetween) {
        // Find the first non-empty line in the last few lines
        for (let i = 0; i < lastFewLines.length; i++) {
          if (lastFewLines[i].trim()) {
            detectedSignatureStartLine = lines.length - lastFewLines.length + i;
            break;
          }
        }
      }
    }
    
    // Tag lines based on our detection
    return lines.map((line, index) => {
      return {
        content: line,
        isSignatureLine: detectedSignatureStartLine !== -1 && index >= detectedSignatureStartLine
      };
    });
  }
  
  // Tag signature lines using enhanced detection
  const taggedLines = detectSignatureLines(extractedLines);
  
  /**
   * Improved normalization that intelligently preserves signature formatting
   * Handles all Gmail signature formats while maintaining exact spacing
   */
  function normalizeWithSignaturesPreserved(taggedLines) {
    const normalized = [];
    let lastLineEmpty = false;
    let inSignatureBlock = false;
    let consecutiveEmptyLines = 0;
    
    for (let i = 0; i < taggedLines.length; i++) {
      const { content, isSignatureLine } = taggedLines[i];
      const trimmedContent = content.trim();
      
      // Detect transition into signature block
      if (isSignatureLine && !inSignatureBlock) {
        inSignatureBlock = true;
        
        // Add an empty line before signature if needed for separation
        const lastLine = normalized.length > 0 ? normalized[normalized.length - 1] : '';
        if (normalized.length > 0 && lastLine !== '' && !lastLineEmpty) {
          normalized.push('');
        }
      }
      
      if (!trimmedContent) {
        // Empty line handling
        consecutiveEmptyLines++;
        
        // In general content, collapse multiple empty lines
        // But in signature blocks, preserve exact spacing
        if (inSignatureBlock || consecutiveEmptyLines <= 1) {
          normalized.push('');
          lastLineEmpty = true;
        }
      } else {
        // Non-empty line
        consecutiveEmptyLines = 0;
        normalized.push(trimmedContent);
        lastLineEmpty = false;
      }
    }
    
    return normalized;
  }
  
  // Apply enhanced normalization
  const normalizedLines = normalizeWithSignaturesPreserved(taggedLines);
  
  // Handle trailing empty lines more intelligently
  // Keep one empty line at the end if we detected a signature block
  // as Gmail often renders signatures with trailing space
  let hasSignatureBlock = taggedLines.some(line => line.isSignatureLine);
  
  if (hasSignatureBlock) {
    // For signature blocks, preserve spacing but limit to max 1 trailing empty line
    while (normalizedLines.length > 0 && 
           normalizedLines[normalizedLines.length - 1] === '' && 
           normalizedLines[normalizedLines.length - 2] === '') {
      normalizedLines.pop();
    }
  } else {
    // For regular content, remove all trailing empty lines
    while (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1] === '') {
      normalizedLines.pop();
    }
  }
  
  // Add verbose debug logging to help diagnose formatting issues
  console.log('Extracted content lines:', normalizedLines.length);
  console.log('Content with signature detection:', normalizedLines.map((line, i) => 
    `Line ${i}: ${taggedLines[i]?.isSignatureLine ? '[SIG] ' : ''}"${line}"`
  ).join('\n'));
  
  // Handle the edge case where Gmail adds an extra paragraph at the end
  if (containerClone.lastElementChild && 
      containerClone.lastElementChild.innerHTML === '<br>' &&
      normalizedLines[normalizedLines.length - 1] !== '') {
    normalizedLines.push('');
  }
  
  return normalizedLines.join('\n');
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
