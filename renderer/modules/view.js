import { elements } from './dom.js';
import { showDetail } from './navigation.js';

const PLACEHOLDER_SRC = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23d6d6d6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='80' font-weight='500' fill='%23888888'%3ERecipe%3C/text%3E%3C/svg%3E";
const PAGE_SIZE = 24;

let currentData = [];
let renderedCount = 0;
let scrollObserver = null;
let sentinelEl = null;

/**
 * Derives a thumbnail URL from an image path.
 * e.g. "images/abc123_photo.jpg" → "/images/thumb/abc123_photo.webp"
 */
function thumbnailUrl(imagePath) {
    if (!imagePath) return PLACEHOLDER_SRC;
    const name = imagePath.replace('images/', '');
    const baseName = name.replace(/\.[^.]+$/, '');
    return `/images/thumb/${baseName}.webp`;
}

function createCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.onclick = () => showDetail(recipe);

    const img = document.createElement('img');
    img.alt = recipe.title;
    img.className = 'card-image';
    img.loading = 'lazy';

    if (recipe.image) {
        img.src = thumbnailUrl(recipe.image);
        // Fall back to the original image if the thumbnail doesn't exist
        img.onerror = function () {
            if (this.src !== `/${recipe.image}`) {
                this.onerror = null;
                this.src = `/${recipe.image}`;
            }
        };
    } else {
        img.src = PLACEHOLDER_SRC;
    }

    const titleDiv = document.createElement('div');
    titleDiv.className = 'card-title';
    titleDiv.textContent = recipe.title;

    card.appendChild(img);
    card.appendChild(titleDiv);
    return card;
}

function renderBatch() {
    if (renderedCount >= currentData.length) {
        // All rendered, remove sentinel
        if (sentinelEl) sentinelEl.remove();
        return;
    }

    const fragment = document.createDocumentFragment();
    const end = Math.min(renderedCount + PAGE_SIZE, currentData.length);
    for (let i = renderedCount; i < end; i++) {
        fragment.appendChild(createCard(currentData[i]));
    }
    // Insert before sentinel if it exists, otherwise just append
    if (sentinelEl && sentinelEl.parentNode) {
        elements.grid.insertBefore(fragment, sentinelEl);
    } else {
        elements.grid.appendChild(fragment);
    }
    renderedCount = end;

    // If there are more, ensure sentinel is present
    if (renderedCount < currentData.length && !sentinelEl?.parentNode) {
        sentinelEl = document.createElement('div');
        sentinelEl.className = 'scroll-sentinel';
        sentinelEl.style.cssText = 'height:1px; grid-column: 1/-1;';
        elements.grid.appendChild(sentinelEl);
        observeSentinel();
    } else if (renderedCount >= currentData.length && sentinelEl) {
        sentinelEl.remove();
    }
}

function observeSentinel() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            renderBatch();
        }
    }, { rootMargin: '200px' });
    if (sentinelEl) scrollObserver.observe(sentinelEl);
}

export function renderRecipes(data) {
    // Clean up previous observer
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    sentinelEl = null;

    elements.grid.innerHTML = '';
    if (data.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'text-align:center; grid-column: 1/-1; opacity: 0.5;';
        p.textContent = 'No recipes found. Add one!';
        elements.grid.appendChild(p);
        currentData = [];
        renderedCount = 0;
        return;
    }

    currentData = data;
    renderedCount = 0;

    // Create sentinel for infinite scroll
    sentinelEl = document.createElement('div');
    sentinelEl.className = 'scroll-sentinel';
    sentinelEl.style.cssText = 'height:1px; grid-column: 1/-1;';
    elements.grid.appendChild(sentinelEl);

    renderBatch();
    if (renderedCount < currentData.length) {
        observeSentinel();
    }
}
