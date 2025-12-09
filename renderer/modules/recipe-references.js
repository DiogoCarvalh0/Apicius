import { state } from './state.js';
import { elements } from './dom.js';
import { showDetail } from './navigation.js';

/**
 * Detects recipe references in the format @RecipeName
 * @param {string} text 
 * @returns {Array<{name: string, index: number, length: number}>}
 */
export function detectRecipeReferences(text) {
    const regex = /@([a-zA-Z0-9\s\-_]+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        // Only consider it a match if it corresponds to an actual recipe or looks like one
        // For now we just return the syntax matches, validation happens during rendering or autocomplete
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
    
    // We use a replacement function to check if the recipe exists
    return text.replace(/@([a-zA-Z0-9\s\-_]+)/g, (match, name) => {
        const recipe = findRecipeByName(name.trim());
        if (recipe) {
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
    const cursorPosition = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPosition);
    
    // Check if we are typing a reference: look for @ followed by text until the cursor
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol === -1) {
        closeAutocomplete();
        return;
    }

    // Check if there are spaces or other delimiters that suggest we aren't in a tag anymore
    // Actually, recipes can have spaces, so we allow spaces. 
    // We stop if there's a newline or we are too far, but simplest is just everything after @
    const query = textBeforeCursor.substring(lastAtSymbol + 1);
    
    // Optionally trigger only if there is no preceeding non-whitespace character (to avoid email addresses)
    // But for recipe inputs, assuming @ is always a reference start is likely fine or we check for start of line or space
    if (lastAtSymbol > 0 && !/\s/.test(textBeforeCursor[lastAtSymbol - 1])) {
        // It's likely part of a word like email@address.com, so ignore unless user explicitly wants this
        // but let's allow it for now for flexibility, or maybe enforce space before @
         closeAutocomplete();
         return;
    }

    showSuggestions(query, input, lastAtSymbol);
}

function showSuggestions(query, input, atIndex) {
    const matchedRecipes = state.recipes.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions

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
        item.addEventListener('click', () => {
            selectSuggestion(recipe.title, input, atIndex);
        });
        dropdown.appendChild(item);
    });

    // Position the dropdown using fixed positioning to avoid scroll issues
    const rect = input.getBoundingClientRect();
    
    // We append to body to ensure z-index works and position is absolute relative to page
    // or use fixed position relative to viewport
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${Math.max(rect.width, 200)}px`; // At least 200px or input width
    
    dropdown.classList.remove('hidden');
    currentFocus = -1;
}

function selectSuggestion(recipeName, input, atIndex) {
    const text = input.value;
    const beforeStats = text.substring(0, atIndex);
    // Find where the current reference ends (next newline or end of string? or just cursor?)
    // Actually we just replace the query part. 
    // But since spaces are allowed, we replace until the cursor?
    // Let's assume we replace what was typed after @ until the cursor
    const cursor = input.selectionStart;
    const afterCursor = text.substring(cursor);
    
    const newValue = `${beforeStats}@${recipeName} ${afterCursor}`;
    input.value = newValue;
    
    closeAutocomplete();
    
    // Restore focus and cursor
    input.focus();
    const newCursorPos = beforeStats.length + recipeName.length + 2; // +1 for @, +1 for space
    input.setSelectionRange(newCursorPos, newCursorPos);
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
