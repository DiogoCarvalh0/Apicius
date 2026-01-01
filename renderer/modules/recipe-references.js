import { state } from './state.js';
import { elements } from './dom.js';
import { showDetail } from './navigation.js';

/**
 * Detects recipe references in the format @RecipeName
 * @param {string} text 
 * @returns {Array<{name: string, index: number, length: number}>}
 */
export function detectRecipeReferences(text) {
    const regex = /@([\p{L}\p{N}\s\-_]+)/gu;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            name: match[1],
            fullMatch: match[0],
            index: match.index,
            length: match[0].length
        });
    }
    return matches;
}

/**
 * Renders text with recipe references replaced by clickable links
 * @param {string} text 
 * @returns {string} HTML string with links
 */
export function renderRecipeReferences(text) {
    if (!text) return '';
    
    // Regex matches @ followed by letters, numbers, spaces, hyphens, underscores
    // \p{L} matches any unicode letter (including accents)
    // We modify it to NOT match if it's already part of a tag (simple heuristic)
    // Actually, simpler is to just ensure we don't double wrap.
    // But since we are replacing @Name, if it's inside >@Name< it's fine.
    // If it's inside data-msg-id="@Name", that's bad.
    
    // Safest approach: Only replace if NOT preceded by '>' or quotes? 
    // Or assume text passed here is content, not raw HTML attributes?
    // For now, let's just fix the character support.
    
    return text.replace(/@([\p{L}\p{N}\s\-_]+)/gu, (match, name) => {
        // If the match is part of an existing span's attribute or content we just created, we might have issues if we run this recursively or on HTML.
        // A simple check: does the name correspond to a recipe?
        const recipe = findRecipeByName(name.trim());
        if (recipe) {
            // Check if we are already inside a link? Hard with regex replace.
            return `<span class="recipe-reference" data-msg-id="${recipe.id}">@${name}</span>`;
        }
        return match;
    });
}

/**
 * Fuzzy find a recipe by name
 * @param {string} name 
 * @returns {Object|null} Recipe object or null
 */
export function findRecipeByName(name) {
    if (!name) return null;
    const searchName = name.toLowerCase();
    return state.recipes.find(r => r.title.toLowerCase() === searchName);
}

// Autocomplete State
let currentInput = null;
let currentFocus = -1;

/**
 * Initialize autocomplete for a text input
 * @param {HTMLElement} inputElement 
 */
export function initRecipeReferenceAutocomplete(inputElement) {
    if (!inputElement) return;

    inputElement.addEventListener('input', (e) => {
        handleInput(e.target);
    });

    inputElement.addEventListener('keydown', (e) => {
        handleKeydown(e, e.target);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (currentInput && e.target !== currentInput && !elements.recipeReferenceDropdown.contains(e.target)) {
            closeAutocomplete();
        }
    });
}

function handleInput(input) {
    currentInput = input;
    
    // Handle ContentEditable (Rich Text)
    if (input.isContentEditable) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        let cursorPosition = range.startOffset;

        // If we are in an element node, try to find the relevant text node
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.childNodes.length > 0) {
              if (cursorPosition > 0) {
                 const prevNode = node.childNodes[cursorPosition - 1];
                 if (prevNode.nodeType === Node.TEXT_NODE) {
                     node = prevNode;
                     cursorPosition = prevNode.textContent.length;
                 } else if (cursorPosition < node.childNodes.length && node.childNodes[cursorPosition].nodeType === Node.TEXT_NODE) {
                     node = node.childNodes[cursorPosition];
                     cursorPosition = 0;
                 }
              } else if (node.childNodes[0].nodeType === Node.TEXT_NODE) {
                  node = node.childNodes[0];
                  cursorPosition = 0;
              }
            }
        }
        
        // Final check: we really need a text node to detect @ cleanly
        if (node.nodeType !== Node.TEXT_NODE) return;
        
        const textContent = node.textContent;
        const textBeforeCursor = textContent.substring(0, cursorPosition);
        
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtSymbol === -1) {
            closeAutocomplete();
            return;
        }

        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        
        // Avoid triggering on emails or middle of words if desired
        if (lastAtSymbol > 0) {
            const charBeforeAt = textBeforeCursor[lastAtSymbol - 1];
            if (!/\s/.test(charBeforeAt) && charBeforeAt.charCodeAt(0) !== 160) {
                closeAutocomplete();
                return;
            }
        }

        // Context for replacement
        const context = {
            isContentEditable: true,
            node: node,
            startIndex: lastAtSymbol,
            endIndex: cursorPosition
        };

        // For contenteditable, we need to pass absolute coordinates for positioning
        const rectRange = document.createRange();
        rectRange.setStart(node, lastAtSymbol);
        rectRange.setEnd(node, cursorPosition);
        const rect = rectRange.getBoundingClientRect();

        showSuggestions(query, input, lastAtSymbol, rect, context);
        return;
    }

    // Handle Standard Input
    const cursorPosition = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPosition);
    
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol === -1) {
        closeAutocomplete();
        return;
    }

    const query = textBeforeCursor.substring(lastAtSymbol + 1);
    
    if (lastAtSymbol > 0 && !/\s/.test(textBeforeCursor[lastAtSymbol - 1])) {
         closeAutocomplete();
         return;
    }

    showSuggestions(query, input, lastAtSymbol);
}

function showSuggestions(query, input, atIndex, customRect = null, context = null) {
    const matchedRecipes = state.recipes.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (matchedRecipes.length === 0) {
        closeAutocomplete();
        return;
    }

    const dropdown = elements.recipeReferenceDropdown;
    dropdown.innerHTML = '';
    
    matchedRecipes.forEach((recipe, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = recipe.title;
        // Use mousedown to prevent focus loss issues if possible, though handling in click with context works too
        item.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            selectSuggestion(recipe.title, input, atIndex, context);
        });
        dropdown.appendChild(item);
    });

    let rect;
    if (customRect) {
        rect = customRect;
    } else {
        rect = input.getBoundingClientRect();
    }
    
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${Math.max(rect.width, 200)}px`;
    
    dropdown.classList.remove('hidden');
    currentFocus = -1;
}

function selectSuggestion(recipeName, input, atIndex, context = null) {
    if (context && context.isContentEditable) {
        const { node, startIndex, endIndex } = context;
        
        // Verify node is still valid
        if (node.parentNode) {
            const textContent = node.textContent;
            
            // The text before the @
            const beforeAt = textContent.substring(0, startIndex);
            // The text after the cursor (we replace query part)
            const afterCursor = textContent.substring(endIndex);
            
            // Create the reference span
            const span = document.createElement('span');
            span.className = 'recipe-reference';
            span.textContent = '@' + recipeName;
            span.dataset.msgId = findRecipeByName(recipeName)?.id;
            
            const parent = node.parentNode;
            
            // Text before @
            if (beforeAt) {
                parent.insertBefore(document.createTextNode(beforeAt), node);
            }
            
            // The Badge
            parent.insertBefore(span, node);
            const space = document.createTextNode('\u00A0'); // nbsp
            parent.insertBefore(space, node);
            
            // Text after
            if (afterCursor) {
                parent.insertBefore(document.createTextNode(afterCursor), node);
            }
            
            // Remove old node
            parent.removeChild(node);
            
            // Restore focus and move cursor
            const selection = window.getSelection();
            const newRange = document.createRange();
            newRange.setStartAfter(space);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            // Ensure focus is back on the editable
            input.focus();
        }
        
    } else {
        const text = input.value;
        const beforeStats = text.substring(0, atIndex);
        const cursor = input.selectionStart;
        // If we don't have explicit endIndex, assume cursor is end of query
        // But clicking might have moved cursor if we aren't careful? 
        // Standard input retains selection better on mousedown preventDefault usually.
        const afterCursor = text.substring(cursor);
        
        const newValue = `${beforeStats}@${recipeName} ${afterCursor}`;
        input.value = newValue;
        
        // Restore focus and cursor
        input.focus();
        const newCursorPos = beforeStats.length + recipeName.length + 2;
        input.setSelectionRange(newCursorPos, newCursorPos);
    }
    
    closeAutocomplete();
}

function handleKeydown(e, input) {
    const dropdown = elements.recipeReferenceDropdown;
    if (dropdown.classList.contains('hidden')) return;

    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentFocus++;
        if (currentFocus >= items.length) currentFocus = 0;
        setActiveItem(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentFocus--;
        if (currentFocus < 0) currentFocus = items.length - 1;
        setActiveItem(items);
    } else if (e.key === 'Enter') {
        if (currentFocus > -1) {
            e.preventDefault();
            items[currentFocus].click();
        }
    } else if (e.key === 'Escape') {
        closeAutocomplete();
    }
}

function setActiveItem(items) {
    items.forEach(item => item.classList.remove('active'));
    if (currentFocus >= 0 && currentFocus < items.length) {
        items[currentFocus].classList.add('active');
    }
}

function closeAutocomplete() {
    elements.recipeReferenceDropdown.classList.add('hidden');
    currentFocus = -1;
    currentInput = null;
}
