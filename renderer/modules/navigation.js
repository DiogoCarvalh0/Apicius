import { elements } from './dom.js';
import { state, setCurrentRecipeId } from './state.js';
import { renderStars } from './utils.js';
import { renderRecipeReferences } from './recipe-references.js';

export function showDetail(recipe) {
    setCurrentRecipeId(recipe.id);
    
    // Hide Grid, Hero & Map, Show Detail
    elements.heroSection.classList.add('hidden');
    elements.grid.classList.add('hidden');
    elements.mapView.classList.add('hidden');
    if (elements.mapToggleBtn) elements.mapToggleBtn.classList.remove('active');
    elements.addBtn.classList.add('hidden');
    elements.detailView.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Populate Hero
    let imageSrc = 'https://placehold.co/1200x600/png?text=Recipe';
    if (recipe.image) {
        imageSrc = `recipe://${recipe.image}`;
    }
    elements.detailImage.src = imageSrc;
    elements.detailTitle.textContent = recipe.title;
    
    // Labels
    elements.detailLabels.innerHTML = '';
    const allLabels = [recipe.meal, recipe.type, ...(recipe.labels || [])].filter(l => l);
    allLabels.forEach(label => {
        const span = document.createElement('span');
        span.className = 'hero-label';
        span.textContent = label;
        elements.detailLabels.appendChild(span);
    });

    // Rating
    if (recipe.rating && recipe.rating > 0) {
        elements.detailRating.innerHTML = renderStars(recipe.rating);
        elements.detailRating.classList.remove('invisible');
    } else {
        elements.detailRating.innerHTML = '<span>★</span>';
        elements.detailRating.classList.add('invisible');
    }

    // Stats
    elements.detailYield.textContent = recipe.yield || '-';
    elements.detailActiveTime.textContent = recipe.activeTime || '-';
    elements.detailTotalTime.textContent = recipe.totalTime || '-';
    elements.detailDescription.textContent = recipe.description || '';
    elements.detailNotes.innerHTML = renderRecipeReferences(recipe.notes || 'No notes.');
    
    // Source
    if (recipe.source || recipe.sourceUrl) {
        elements.detailSourceContainer.classList.remove('hidden');
        const text = recipe.source || 'View Source';
        
        if (recipe.sourceUrl) {
            elements.detailSourceWrapper.innerHTML = `<a href="${recipe.sourceUrl}" target="_blank" class="source-link">${text}</a>`;
        } else {
            elements.detailSourceWrapper.innerHTML = text;
        }
    } else {
        elements.detailSourceContainer.classList.add('hidden');
    }

    // Ingredients
    elements.detailIngredientsList.innerHTML = '';
    if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'ingredient-section';
            if (section.title) {
                sectionDiv.innerHTML += `<div class="section-title">${section.title}</div>`;
            }
            const ul = document.createElement('ul');
            section.items.forEach(item => {
                let text = '';
                if (typeof item === 'object' && item !== null) {
                    text = `${item.quantity ? item.quantity + ' ' : ''}${item.name}`;
                } else {
                    text = item;
                }
                const li = document.createElement('li');
                li.innerHTML = renderRecipeReferences(text);
                li.onclick = (e) => {
                    // Prevent toggling if clicking a reference link
                    if (e.target.classList.contains('recipe-reference')) return;
                    li.classList.toggle('completed');
                    checkSectionCompletion(sectionDiv, ul);
                };
                ul.appendChild(li);
            });
            sectionDiv.appendChild(ul);
            elements.detailIngredientsList.appendChild(sectionDiv);
        });
    }

    // Instructions
    elements.detailInstructionsList.innerHTML = '';
    if (Array.isArray(recipe.instructions)) {
        recipe.instructions.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'instruction-section';
            if (section.title) {
                sectionDiv.innerHTML += `<div class="section-title">${renderRecipeReferences(section.title)}</div>`;
            }
            const ol = document.createElement('ol');
            section.steps.forEach(step => {
                const li = document.createElement('li');
                li.innerHTML = renderRecipeReferences(step);
                li.onclick = (e) => {
                    // Prevent toggling if clicking a reference link
                    if (e.target.classList.contains('recipe-reference')) return;
                    li.classList.toggle('completed');
                    checkSectionCompletion(sectionDiv, ol);
                };
                ol.appendChild(li);
            });
            sectionDiv.appendChild(ol);
            elements.detailInstructionsList.appendChild(sectionDiv);
        });
    }
}

function checkSectionCompletion(sectionDiv, listElement) {
    const allItems = listElement.children;
    const completedItems = listElement.querySelectorAll('.completed');
    
    if (allItems.length > 0 && allItems.length === completedItems.length) {
        sectionDiv.classList.add('completed');
    } else {
        sectionDiv.classList.remove('completed');
    }
}

import { filterRecipes } from './filters.js';

// ... existing imports ...

export function showGrid() {
    setCurrentRecipeId(null);
    elements.heroSection.classList.remove('hidden');
    elements.grid.classList.remove('hidden');
    elements.searchContainer.classList.remove('hidden');
    if (elements.searchBar) elements.searchBar.classList.remove('hidden');
    elements.mapView.classList.add('hidden');
    if (elements.mapToggleBtn) elements.mapToggleBtn.classList.remove('active');
    elements.addBtn.classList.remove('hidden');
    elements.detailView.classList.add('hidden');
    
    // Reset Hero Title
    if (elements.heroTitle) elements.heroTitle.textContent = 'Recipes';
    
    window.scrollTo(0, 0);

    // Re-apply filters to ensure grid matches UI state
    filterRecipes();
}

export function setupRecipeReferenceListeners() {
    elements.detailView.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-reference')) {
            e.preventDefault();
            e.stopPropagation();
            const id = e.target.dataset.msgId;
            const recipe = state.recipes.find(r => r.id === id);
            if (recipe) {
                showDetail(recipe);
            }
        }
    });
}
