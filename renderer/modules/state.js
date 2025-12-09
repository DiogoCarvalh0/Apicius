export const state = {
    recipes: [],
    currentRecipeId: null,
    currentMinRating: 0
};

export function setRecipes(newRecipes) {
    state.recipes = newRecipes;
}

export function setCurrentRecipeId(id) {
    state.currentRecipeId = id;
}

export function setCurrentMinRating(rating) {
    state.currentMinRating = rating;
}
