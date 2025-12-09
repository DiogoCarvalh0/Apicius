import { elements } from './dom.js';
import { state } from './state.js';
import { loadRecipes } from './recipes.js';
import { showGrid } from './navigation.js';

export function initActions() {
    elements.backBtn.addEventListener('click', showGrid);

    elements.deleteBtn.addEventListener('click', () => {
        elements.deleteModal.classList.remove('hidden');
    });

    elements.cancelDeleteBtn.addEventListener('click', () => {
        elements.deleteModal.classList.add('hidden');
    });

    elements.confirmDeleteBtn.addEventListener('click', async () => {
        if (state.currentRecipeId) {
            await window.electronAPI.deleteRecipe(state.currentRecipeId);
            elements.deleteModal.classList.add('hidden');
            showGrid();
            loadRecipes();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            elements.deleteModal.classList.add('hidden');
        }
    });
}
