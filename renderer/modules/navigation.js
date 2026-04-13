import { elements } from './dom.js';
import { state, setCurrentRecipeId } from './state.js';
import { renderStars } from './utils.js';
import { renderRecipeReferences, renderRecipeReferencesHtml } from './recipe-references.js';
import { recipeLang, currentLang, t, tFor } from './i18n.js';
import { filterRecipes } from './filters.js';

export function showDetail(recipe, forceOriginal = false, preserveScroll = false, _pushState = true) {
    if (_pushState) {
        history.pushState({ view: 'detail', recipeId: recipe.id }, '');
    }
    setCurrentRecipeId(recipe.id);
    
    // Hide Grid, Hero & Map, Show Detail
    elements.heroSection.classList.add('hidden');
    elements.grid.classList.add('hidden');
    elements.mapView.classList.add('hidden');
    if (elements.mapToggleBtn) elements.mapToggleBtn.classList.remove('active');
    elements.addBtn.classList.add('hidden');
    elements.detailView.classList.remove('hidden');
    
    if (!preserveScroll) {
        window.scrollTo(0, 0);
    }

    const badge = document.getElementById('ai-translation-badge');
    const translationText = document.getElementById('ai-translation-text');
    
    let renderRecipe = recipe;
    let isTranslated = false;

    if (recipeLang !== 'source' && !forceOriginal) {
        if (recipe.translations && recipe.translations[recipeLang]) {
            const trans = recipe.translations[recipeLang];
            // Only count as "translated" if content genuinely differs from original.
            const origFirstStep = recipe.instructions?.[0]?.steps?.[0] || '';
            const transFirstStep = trans.instructions?.[0]?.steps?.[0] || '';
            const actuallyTranslated = origFirstStep !== transFirstStep;
            
            // Preserve original title - do not translate recipe names
            renderRecipe = { ...recipe, ...trans, title: recipe.title };
            isTranslated = actuallyTranslated;
        }
    }

    // Badge is now the single clickable pill — it toggles between translated & original
    if (isTranslated) {
        badge.classList.remove('hidden');
        badge.style.display = 'inline-flex';
        translationText.setAttribute('data-i18n', 'translatedWithAi');
        translationText.textContent = t('translatedWithAi');
        badge.onclick = (e) => { e.preventDefault(); showDetail(recipe, true, true, false); };
    } else if (forceOriginal && recipeLang !== 'source' && recipe.translations?.[recipeLang]) {
        badge.classList.remove('hidden');
        badge.style.display = 'inline-flex';
        badge.style.opacity = '0.65';
        translationText.setAttribute('data-i18n', 'showingOriginal');
        translationText.textContent = t('showingOriginal');
        badge.onclick = (e) => { e.preventDefault(); showDetail(recipe, false, true, false); };
    } else {
        badge.classList.add('hidden');
        badge.style.display = 'none';
        badge.style.opacity = '1';
    }


    const currentRecipe = renderRecipe;

    // Populate Hero
    let imageSrc = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23d6d6d6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='100' font-weight='500' fill='%23888888'%3ERecipe%3C/text%3E%3C/svg%3E";
    if (currentRecipe.image) {
        imageSrc = `/${currentRecipe.image}`;
    }

    const wrapper = elements.detailImage.closest('.hero-image-wrapper');
    if (currentRecipe.image) {
        elements.detailImage.classList.add('loading');
        wrapper.classList.add('shimmer');
        elements.detailImage.onload = () => {
            elements.detailImage.classList.remove('loading');
            wrapper.classList.remove('shimmer');
        };
    } else {
        elements.detailImage.classList.remove('loading');
        wrapper.classList.remove('shimmer');
        elements.detailImage.onload = null;
    }
    elements.detailImage.src = imageSrc;
    elements.detailTitle.textContent = currentRecipe.title;
    
    // Labels
    elements.detailLabels.innerHTML = '';
    const allLabels = [currentRecipe.meal, currentRecipe.type, ...(currentRecipe.goals || []), ...(currentRecipe.labels || [])].filter(l => l);
    allLabels.forEach(label => {
        const span = document.createElement('span');
        span.className = 'hero-label';
        span.textContent = label;
        elements.detailLabels.appendChild(span);
    });

    // Rating
    if (currentRecipe.rating && currentRecipe.rating > 0) {
        elements.detailRating.innerHTML = renderStars(currentRecipe.rating);
        elements.detailRating.classList.remove('invisible');
    } else {
        elements.detailRating.innerHTML = '<span>★</span>';
        elements.detailRating.classList.add('invisible');
    }

    // Stats
    elements.detailYield.textContent = currentRecipe.yield || '-';
    elements.detailActiveTime.textContent = currentRecipe.activeTime || '-';
    elements.detailTotalTime.textContent = currentRecipe.totalTime || '-';
    elements.detailDescription.textContent = currentRecipe.description || '';
    elements.detailNotes.innerHTML = renderRecipeReferencesHtml(currentRecipe.notes || 'No notes.');
    
    // Source
    if (currentRecipe.source || currentRecipe.sourceUrl) {
        elements.detailSourceContainer.classList.remove('hidden');
        const text = currentRecipe.source || 'View Source';
        elements.detailSourceWrapper.innerHTML = '';
        
        if (currentRecipe.sourceUrl) {
            const a = document.createElement('a');
            a.href = currentRecipe.sourceUrl;
            a.target = '_blank';
            a.className = 'source-link';
            a.textContent = text;
            // Only allow http/https URLs
            if (!/^https?:\/\//i.test(a.href)) {
                a.removeAttribute('href');
            }
            elements.detailSourceWrapper.appendChild(a);
        } else {
            elements.detailSourceWrapper.textContent = text;
        }
    } else {
        elements.detailSourceContainer.classList.add('hidden');
    }

    // Ingredients
    elements.detailIngredientsList.innerHTML = '';
    if (Array.isArray(currentRecipe.ingredients)) {
        currentRecipe.ingredients.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'ingredient-section';
            if (section.title) {
                const titleDiv = document.createElement('div');
                titleDiv.className = 'section-title';
                titleDiv.textContent = section.title;
                sectionDiv.appendChild(titleDiv);
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
                    if (e.target.closest('.recipe-reference')) return;
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
    if (Array.isArray(currentRecipe.instructions)) {
        currentRecipe.instructions.forEach(section => {
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
                    if (e.target.closest('.recipe-reference')) return;
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

export function showGrid(_pushState = true) {
    if (_pushState) {
        history.pushState({ view: 'grid' }, '');
    }
    setCurrentRecipeId(null);
    elements.heroSection.classList.remove('hidden');
    elements.grid.classList.remove('hidden');
    elements.searchContainer.classList.remove('hidden');
    if (elements.searchBar) elements.searchBar.classList.remove('hidden');
    elements.mapView.classList.add('hidden');
    if (elements.mapToggleBtn) elements.mapToggleBtn.classList.remove('active');
    elements.addBtn.classList.remove('hidden');
    elements.detailView.classList.add('hidden');
    
    if (elements.heroTitle) {
        elements.heroTitle.setAttribute('data-i18n', 'recipesTitle');
        elements.heroTitle.textContent = t('recipesTitle');
    }
    
    window.scrollTo(0, 0);
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

    document.addEventListener('recipe-language-changed', () => {
        if (!elements.detailView.classList.contains('hidden') && state.currentRecipeId) {
            const recipe = state.recipes.find(r => r.id === state.currentRecipeId);
            if (recipe) showDetail(recipe, false, false, false);
        }
    });

    document.addEventListener('app-language-changed', () => {
    });
}
