// Import modules
import { initFilters } from './modules/filters.js';
import { initForms } from './modules/forms.js';
import { initSettings } from './modules/settings.js';
import { initActions } from './modules/actions.js';
import { loadRecipes } from './modules/recipes.js';
import { generateMacIcon } from './modules/icon.js';
import { setupRecipeReferenceListeners, showGrid, showDetail } from './modules/navigation.js';
import { MapController } from './mapController.js';
import { initI18n } from './modules/i18n.js';
import { state } from './modules/state.js';

// Initialize all modules
function init() {
    initI18n();
    initFilters();
    initForms();
    initSettings();
    initActions();
    loadRecipes();
    setupRecipeReferenceListeners();
    MapController.init();
    
    // Auto-run icon generation
    generateMacIcon();

    // --- Browser history (back/forward) support ---
    // Mark the initial grid view in history so back from here doesn't exit the app
    history.replaceState({ view: 'grid' }, '');

    window.addEventListener('popstate', (e) => {
        const st = e.state;
        if (!st) return;

        if (st.view === 'grid') {
            showGrid(false);
        } else if (st.view === 'map') {
            // Show map view without pushing another history entry
            MapController.showMapView(false);
        } else if (st.view === 'detail') {
            const recipe = state.recipes.find(r => r.id === st.recipeId);
            if (recipe) {
                showDetail(recipe, false, false, false);
            } else {
                // Recipe not found (e.g. was deleted), fall back to grid
                showGrid(false);
            }
        }
    });
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
