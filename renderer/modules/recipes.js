import { state, setRecipes } from './state.js';
import { populateTagsFilter, populateIngredientsFilter, initRatingFilter } from './filters.js';
import { renderRecipes } from './view.js';

export async function loadRecipes() {
    const recipes = await window.electronAPI.getRecipes();
    setRecipes(recipes);
    populateTagsFilter();
    populateIngredientsFilter();
    initRatingFilter();
    renderRecipes(recipes);
}
