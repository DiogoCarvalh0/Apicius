import { elements } from './dom.js';
import { state, setCurrentMinRating } from './state.js';
import { parseIngredient, parseDuration } from './utils.js';
import { renderRecipes } from './view.js';

export function initFilters() {
    elements.searchInput.addEventListener('input', filterRecipes);
    elements.filterTimeCategory.addEventListener('change', filterRecipes);

    // Toggle Dropdown
    elements.filterTagsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.filterTagsDropdown.classList.toggle('active');
        elements.filterIngredientsDropdown.classList.remove('active');
    });

    elements.filterIngredientsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.filterIngredientsDropdown.classList.toggle('active');
        elements.filterTagsDropdown.classList.remove('active');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!elements.filterTagsDropdown.contains(e.target) && e.target !== elements.filterTagsBtn) {
            elements.filterTagsDropdown.classList.remove('active');
        }
        if (!elements.filterIngredientsDropdown.contains(e.target) && e.target !== elements.filterIngredientsBtn) {
            elements.filterIngredientsDropdown.classList.remove('active');
        }
    });
}

export function populateTagsFilter() {
    const allLabels = new Set();
    state.recipes.forEach(r => {
        if (r.labels && Array.isArray(r.labels)) {
            r.labels.forEach(l => allLabels.add(l));
        }
    });

    elements.filterTagsList.innerHTML = '';
    if (allLabels.size === 0) {
        elements.filterTagsList.innerHTML = '<div style="padding:5px; opacity:0.5;">No tags found</div>';
        return;
    }

    const sortedLabels = Array.from(allLabels).sort();

    sortedLabels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'tag-option';
        div.innerHTML = `
            <label style="cursor:pointer; width:100%; display:flex; align-items:center;">
                <input type="checkbox" value="${label}" class="tag-checkbox">
                ${label}
            </label>
        `;
        div.querySelector('input').addEventListener('change', () => {
             updateFilterButtonText(elements.filterTagsBtn, 'Tags', '.tag-checkbox');
             filterRecipes();
        });
        elements.filterTagsList.appendChild(div);
    });
}

export function populateIngredientsFilter() {
    const allIngredients = new Set();
    state.recipes.forEach(r => {
        if (r.ingredients && Array.isArray(r.ingredients)) {
            r.ingredients.forEach(section => {
                if (section.items && Array.isArray(section.items)) {
                    section.items.forEach(item => {
                        let name = '';
                        if (typeof item === 'object' && item !== null) {
                            name = item.name;
                        } else {
                            name = parseIngredient(item);
                        }
                        if (name) allIngredients.add(name.toLowerCase());
                    });
                }
            });
        }
    });

    elements.filterIngredientsList.innerHTML = '';
    if (allIngredients.size === 0) {
        elements.filterIngredientsList.innerHTML = '<div style="padding:5px; opacity:0.5;">No ingredients found</div>';
        return;
    }

    const sortedIngredients = Array.from(allIngredients).sort();

    sortedIngredients.forEach(ing => {
        const displayIng = ing.charAt(0).toUpperCase() + ing.slice(1);
        
        const div = document.createElement('div');
        div.className = 'tag-option'; 
        div.innerHTML = `
            <label style="cursor:pointer; width:100%; display:flex; align-items:center;">
                <input type="checkbox" value="${ing}" class="ingredient-checkbox">
                ${displayIng}
            </label>
        `;
        div.querySelector('input').addEventListener('change', () => {
            updateFilterButtonText(elements.filterIngredientsBtn, 'Ingredients', '.ingredient-checkbox');
            filterRecipes();
        });
        elements.filterIngredientsList.appendChild(div);
    });
}

export function initRatingFilter() {
    elements.filterRatingStars.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.style.position = 'relative';
        star.style.display = 'inline-block';
        star.style.width = '20px';
        star.style.cursor = 'pointer';
        star.style.color = '#ccc';
        star.style.fontSize = '1.2rem';
        
        star.addEventListener('mousemove', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = e.clientX - rect.left < rect.width / 2;
            const value = i - (isLeft ? 0.5 : 0);
            updateFilterStars(value, true);
        });

        star.addEventListener('click', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = e.clientX - rect.left < rect.width / 2;
            const rating = i - (isLeft ? 0.5 : 0);
            setCurrentMinRating(rating);
            updateFilterStars(rating);
            elements.filterRatingValueDisplay.textContent = rating + '+';
            elements.clearRatingFilterBtn.classList.remove('hidden');
            filterRecipes();
        });
        
        elements.filterRatingStars.appendChild(star);
    }

    elements.filterRatingStars.addEventListener('mouseleave', () => {
        updateFilterStars(state.currentMinRating);
    });

    elements.clearRatingFilterBtn.addEventListener('click', () => {
        setCurrentMinRating(0);
        updateFilterStars(0);
        elements.filterRatingValueDisplay.textContent = 'Any';
        elements.clearRatingFilterBtn.classList.add('hidden');
        filterRecipes();
    });
}

function updateFilterStars(value, isPreview = false) {
    const stars = elements.filterRatingStars.children;
    for (let i = 0; i < 5; i++) {
        const star = stars[i];
        const starValue = i + 1;
        
        star.style.background = 'none';
        star.style.webkitBackgroundClip = 'initial';
        star.style.webkitTextFillColor = 'initial';
        star.style.color = '#ccc';

        if (value >= starValue) {
            star.style.color = 'gold';
        } else if (value >= starValue - 0.5) {
            star.style.background = 'linear-gradient(90deg, gold 50%, #ccc 50%)';
            star.style.webkitBackgroundClip = 'text';
            star.style.webkitTextFillColor = 'transparent';
        }
    }
}

function updateFilterButtonText(btn, defaultText, checkboxClass) {
    const count = document.querySelectorAll(`${checkboxClass}:checked`).length;
    btn.textContent = count > 0 ? `${defaultText} (${count})` : `Filter by ${defaultText}`;
}

export function filterRecipes() {
    const query = elements.searchInput.value.toLowerCase();
    const timeCategory = elements.filterTimeCategory.value;
    const minRating = state.currentMinRating;
    
    const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
    const selectedIngredients = Array.from(document.querySelectorAll('.ingredient-checkbox:checked')).map(cb => cb.value);

    const filtered = state.recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(query);

        const recipeLabels = recipe.labels || [];
        const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => recipeLabels.includes(tag));

        let recipeIngredientItems = [];
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(s => {
                if (s.items) {
                    s.items.forEach(i => {
                        if (typeof i === 'object' && i !== null) {
                            if (i.name) recipeIngredientItems.push(i.name.toLowerCase());
                        } else {
                            recipeIngredientItems.push(parseIngredient(i));
                        }
                    });
                }
            });
        }
        const matchesIngredients = selectedIngredients.length === 0 || selectedIngredients.every(ing => recipeIngredientItems.includes(ing));

        let matchesTime = true;
        if (timeCategory) {
            const minutes = parseDuration(recipe.totalTime);
            if (minutes === 0) matchesTime = false; 
            else if (timeCategory === 'quick') matchesTime = minutes < 30;
            else if (timeCategory === 'medium') matchesTime = minutes >= 30 && minutes <= 90;
            else if (timeCategory === 'long') matchesTime = minutes > 90 && minutes <= 1440;
            else if (timeCategory === 'multiday') matchesTime = minutes > 1440;
        }

        const matchesRating = (recipe.rating || 0) >= minRating;

        return matchesRating && matchesSearch && matchesTags && matchesIngredients && matchesTime;
    });

    renderRecipes(filtered);
    
    if (selectedTags.length > 0) {
        elements.filterTagsBtn.textContent = `Tags (${selectedTags.length})`;
    } else {
        elements.filterTagsBtn.textContent = 'Filter by Tags';
    }
    
    if (selectedIngredients.length > 0) {
        elements.filterIngredientsBtn.textContent = `Ingredients (${selectedIngredients.length})`;
    } else {
        elements.filterIngredientsBtn.textContent = 'Filter by Ingredients';
    }
}
