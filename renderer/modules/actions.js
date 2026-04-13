import { elements } from './dom.js';
import { state } from './state.js';
import { loadRecipes } from './recipes.js';
import { showGrid, showDetail } from './navigation.js';

export function initActions() {
    elements.backBtn.addEventListener('click', () => history.back());
    if (elements.logo) {
        elements.logo.addEventListener('click', showGrid);
    }

    elements.deleteBtn.addEventListener('click', () => {
        elements.deleteModal.classList.remove('hidden');
    });

    elements.cancelDeleteBtn.addEventListener('click', () => {
        elements.deleteModal.classList.add('hidden');
    });

    elements.confirmDeleteBtn.addEventListener('click', async () => {
        if (state.currentRecipeId) {
            try {
                await window.electronAPI.deleteRecipe(state.currentRecipeId);
                elements.deleteModal.classList.add('hidden');
                showGrid();
                loadRecipes();
            } catch (err) {
                console.error('Failed to delete recipe:', err);
                elements.deleteModal.classList.add('hidden');
            }
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            elements.deleteModal.classList.add('hidden');
        }
    });

    // Handle map recipe click
    document.addEventListener('open-recipe-detail', (e) => {
        const recipeId = e.detail;
        const recipe = state.recipes.find(r => r.id === recipeId);
        if (recipe) {
            showDetail(recipe);
        }
    });
}
