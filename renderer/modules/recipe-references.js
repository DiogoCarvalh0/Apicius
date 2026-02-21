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
    
    // We search for '@' and then try to find the longest recipe title that matches from that point.
    // This prevents the greedy regex from capturing trailing text that isn't part of the title.
    
    // Sort recipes by title length descending to match longest titles first
    const sortedRecipes = [...state.recipes].sort((a, b) => b.title.length - a.title.length);
    
    let result = text;
    let offset = 0;
    const atRegex = /@/g;
    let match;
    
    // We use a temporary string to avoid double-processing or interfering with existing HTML
    // However, since we are returning HTML, we need to be careful.
    // The simplest way that handles the "nested" problem is to iterate through the string.
    
    const parts = [];
    let lastIndex = 0;
    
    // Find all '@' symbols
    while ((match = atRegex.exec(text)) !== null) {
        const atIndex = match.index;
        parts.push(text.substring(lastIndex, atIndex));
        
        const remainingText = text.substring(atIndex + 1);
        let foundRecipe = null;
        
        for (const recipe of sortedRecipes) {
            const title = recipe.title;
            if (remainingText.toLowerCase().startsWith(title.toLowerCase())) {
                // Found a match!
                foundRecipe = recipe;
                // Check if it's followed by a word character? 
                // Usually recipe references are followed by space or punctuation.
                // If the next char is a letter/number, it might be a partial match of a longer word.
                // But since we sorted by length, if we match "Farofa" and the text is "Farofas", 
                // we should probably ensure the word ends there.
                
                const nextCharIndex = title.length;
                if (nextCharIndex < remainingText.length) {
                    const nextChar = remainingText[nextCharIndex];
                    if (/[\p{L}\p{N}]/u.test(nextChar)) {
                        // It's part of a longer word that isn't a recipe
                        continue;
                    }
                }
                
                break;
            }
        }
        
        if (foundRecipe) {
            const actualTitleMatch = remainingText.substring(0, foundRecipe.title.length);
            parts.push(`<span class="recipe-reference" data-msg-id="${foundRecipe.id}">@${actualTitleMatch}</span>`);
            lastIndex = atIndex + 1 + foundRecipe.title.length;
            atRegex.lastIndex = lastIndex; // Skip ahead
        } else {
            parts.push('@');
            lastIndex = atIndex + 1;
        }
    }
    
    parts.push(text.substring(lastIndex));
    return parts.join('');
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

/**
 * Replaces references to an old title with a new title in a string
 * @param {string} text 
 * @param {string} oldTitle 
 * @param {string} newTitle 
 * @returns {string} Updated text
 */
export function renameRecipeInText(text, oldTitle, newTitle) {
    if (!text || !oldTitle || !newTitle) return text;
    
    const atRegex = /@/g;
    let match;
    const parts = [];
    let lastIndex = 0;
    
    while ((match = atRegex.exec(text)) !== null) {
        const atIndex = match.index;
        parts.push(text.substring(lastIndex, atIndex));
        
        const remainingText = text.substring(atIndex + 1);
        if (remainingText.toLowerCase().startsWith(oldTitle.toLowerCase())) {
            // Check if it's a full word match (not followed by letter/number)
            const nextCharIndex = oldTitle.length;
            let isFullMatch = true;
            if (nextCharIndex < remainingText.length) {
                const nextChar = remainingText[nextCharIndex];
                if (/[\p{L}\p{N}]/u.test(nextChar)) {
                    isFullMatch = false;
                }
            }
            
            if (isFullMatch) {
                parts.push('@' + newTitle);
                lastIndex = atIndex + 1 + oldTitle.length;
                atRegex.lastIndex = lastIndex;
                continue;
            }
        }
        
        parts.push('@');
        lastIndex = atIndex + 1;
    }
    
    parts.push(text.substring(lastIndex));
    return parts.join('');
}

/**
 * Propagates a rename to all other recipes
 * @param {Object} oldRecipe The recipe being renamed (containing the old title)
 * @param {string} newTitle The new title
 * @returns {Array<Object>} List of recipes that were modified
 */
export function propagateRename(oldRecipe, newTitle) {
    const oldTitle = oldRecipe.title;
    const modifiedRecipes = [];
    
    state.recipes.forEach(recipe => {
        if (recipe.id === oldRecipe.id) return; // Skip the recipe itself
        
        let modified = false;
        
        // Update Instructions
        if (Array.isArray(recipe.instructions)) {
            recipe.instructions.forEach(section => {
                // Section Title
                if (section.title) {
                    const newSectionTitle = renameRecipeInText(section.title, oldTitle, newTitle);
                    if (newSectionTitle !== section.title) {
                        section.title = newSectionTitle;
                        modified = true;
                    }
                }
                // Steps
                if (Array.isArray(section.steps)) {
                    section.steps = section.steps.map(step => {
                        const newStep = renameRecipeInText(step, oldTitle, newTitle);
                        if (newStep !== step) {
                            modified = true;
                            return newStep;
                        }
                        return step;
                    });
                }
            });
        }
        
        // Update Ingredients (Section Title)
        if (Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(section => {
                if (section.title) {
                    const newSectionTitle = renameRecipeInText(section.title, oldTitle, newTitle);
                    if (newSectionTitle !== section.title) {
                        section.title = newSectionTitle;
                        modified = true;
                    }
                }
            });
        }
        
        // Update Notes
        if (recipe.notes) {
            const newNotes = renameRecipeInText(recipe.notes, oldTitle, newTitle);
            if (newNotes !== recipe.notes) {
                recipe.notes = newNotes;
                modified = true;
            }
        }
        
        if (modified) {
            modifiedRecipes.push(recipe);
        }
    });
    
    return modifiedRecipes;
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
