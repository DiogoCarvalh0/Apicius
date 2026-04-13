import { state, setRecipes } from './state.js';
import { populateTagsFilter, populateIngredientsFilter, populatePurposeFilter, initRatingFilter } from './filters.js';
import { renderRecipes } from './view.js';

export async function loadRecipes() {
    try {
        const recipes = await window.electronAPI.getRecipes();
        recipes.sort((a, b) => a.title.localeCompare(b.title));
        setRecipes(recipes);
        populateTagsFilter();
        populateIngredientsFilter();
        populatePurposeFilter();
        initRatingFilter();
        renderRecipes(recipes);
        document.dispatchEvent(new CustomEvent('recipes-updated', { detail: recipes }));
    } catch (err) {
        console.error('Failed to load recipes:', err);
        renderRecipes([]);
    }
}
