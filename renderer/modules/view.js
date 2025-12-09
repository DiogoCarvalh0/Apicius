import { elements } from './dom.js';
import { showDetail } from './navigation.js';

export function renderRecipes(data) {
    elements.grid.innerHTML = '';
    if (data.length === 0) {
        elements.grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; opacity: 0.5;">No recipes found. Add one!</p>';
        return;
    }

    data.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = () => showDetail(recipe);
        
        let imageSrc = 'https://placehold.co/600x400/png?text=Recipe';
        if (recipe.image) {
            imageSrc = `recipe://${recipe.image}`;
        }

        card.innerHTML = `
            <img src="${imageSrc}" alt="${recipe.title}" class="card-image">
            <div class="card-title">${recipe.title}</div>
        `;
        elements.grid.appendChild(card);
    });
}
