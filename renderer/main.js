// Import modules
import { initFilters } from './modules/filters.js';
import { initForms } from './modules/forms.js';
import { initSettings } from './modules/settings.js';
import { initActions } from './modules/actions.js';
import { loadRecipes } from './modules/recipes.js';
import { generateMacIcon } from './modules/icon.js';
import { setupRecipeReferenceListeners } from './modules/navigation.js';
import { MapController } from './mapController.js';

// Initialize all modules
function init() {
    initFilters();
    initForms();
    initSettings();
    initActions();
    loadRecipes();
    setupRecipeReferenceListeners();
    MapController.init();
    
    // Auto-run icon generation
    generateMacIcon();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
