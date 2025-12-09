import { elements } from './dom.js';
import { state } from './state.js';
import { loadRecipes } from './recipes.js';
import { showDetail } from './navigation.js';
import { parseIngredient } from './utils.js';
import { initRecipeReferenceAutocomplete } from './recipe-references.js';

export function initForms() {
    // Add Button
    elements.addBtn.addEventListener('click', () => {
        delete elements.addForm.dataset.editId;
        delete elements.addForm.dataset.existingImage;
        document.querySelector('#add-modal h2').textContent = 'Add New Recipe';
        elements.addForm.reset();
        updateFormStars(0);
        elements.recipeNotesEditor.innerHTML = '';
        
        elements.ingredientsBuilder.innerHTML = '';
        elements.instructionsBuilder.innerHTML = '';
        
        // Add default sections
        addIngredientSectionBtnHandler();
        addInstructionSectionBtnHandler();
        
        elements.addModal.classList.remove('hidden');
    });

    elements.closeBtn.addEventListener('click', () => {
        elements.addModal.classList.add('hidden');
    });

    // Edit Button
    elements.editBtn.addEventListener('click', () => {
        const recipe = state.recipes.find(r => r.id === state.currentRecipeId);
        if (!recipe) return;

        elements.recipeTitle.value = recipe.title;
        elements.recipeDescription.value = recipe.description;
        elements.recipeYield.value = recipe.yield;
        elements.recipeActiveTime.value = recipe.activeTime;
        elements.recipeTotalTime.value = recipe.totalTime;
        elements.recipeSourceName.value = recipe.source;
        elements.recipeSourceUrl.value = recipe.sourceUrl;
        elements.recipeRating.value = recipe.rating;
        updateFormStars(recipe.rating || 0);
        elements.recipeNotesEditor.innerHTML = recipe.notes || '';
        elements.recipeLabels.value = (recipe.labels || []).join(', ');
        
        // Populate Builders
        elements.ingredientsBuilder.innerHTML = '';
        if (Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(section => {
                const sectionEl = createSection('ingredient');
                elements.ingredientsBuilder.appendChild(sectionEl);
                sectionEl.querySelector('.section-title-input').value = section.title;
                const itemsContainer = sectionEl.querySelector('.builder-items');
                itemsContainer.innerHTML = '';
                section.items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'builder-item-row';
                    
                    let quantity = '';
                    let name = '';

                    if (typeof item === 'object' && item !== null) {
                        quantity = item.quantity || '';
                        name = item.name || '';
                    } else {
                        // Legacy string parsing
                        const match = item.match(/^([\d\s/.\u00BC-\u00BE\u2150-\u215E\u2189]+(?:cups?|tsp|tbsp|teaspoons?|tablespoons?|grams?|g|kg|oz|ounces?|lbs?|pounds?|ml|l|liters?|pinch|dash|cloves?|slices?|pieces?|cans?|jars?|packages?|bags?|box|boxes|sticks?)?)(.*)$/i);
                        if (match) {
                            quantity = match[1].trim();
                            name = match[2].trim();
                            if (!name && quantity) {
                                 name = parseIngredient(item);
                                 const nameIndex = item.toLowerCase().indexOf(name.toLowerCase());
                                 if (nameIndex > 0) {
                                     quantity = item.substring(0, nameIndex).trim();
                                 }
                            }
                        } else {
                            name = item;
                        }
                    }

                    row.innerHTML = `
                        <div class="ingredient-row">
                            <input type="text" class="clean-input quantity-input" placeholder="Qty" value="${quantity}">
                            <input type="text" class="clean-input name-input" placeholder="Ingredient" value="${name}">
                        </div>
                        <button type="button" class="remove-btn remove-item-btn">&times;</button>
                    `;
                    row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
                    itemsContainer.appendChild(row);
                });
            });
        }

        elements.instructionsBuilder.innerHTML = '';
        if (Array.isArray(recipe.instructions)) {
            recipe.instructions.forEach(section => {
                const sectionEl = createSection('instruction');
                elements.instructionsBuilder.appendChild(sectionEl);
                const titleInput = sectionEl.querySelector('.section-title-input');
                titleInput.value = section.title;
                initRecipeReferenceAutocomplete(titleInput); // Init autocomplete for title
                const itemsContainer = sectionEl.querySelector('.builder-items');
                itemsContainer.innerHTML = '';
                section.steps.forEach(step => {
                    const row = document.createElement('div');
                    row.className = 'builder-item-row';
                    row.innerHTML = `
                        <input type="text" class="clean-input item-input" value="${step}">
                        <button type="button" class="remove-item-btn" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
                    `;
                    row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
                    itemsContainer.appendChild(row);
                });
            });
        }

        elements.addForm.dataset.editId = recipe.id;
        elements.addForm.dataset.existingImage = recipe.image;
        
        document.querySelector('#add-modal h2').textContent = 'Edit Recipe';
        elements.addModal.classList.remove('hidden');
    });

    elements.recipeTitle.addEventListener('input', (e) => {
        if (e.target.value.includes('@')) {
            e.target.value = e.target.value.replace(/@/g, '');
        }
    });

    // Form Submit
    elements.addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Extra safety check
        if (elements.recipeTitle.value.includes('@')) {
            alert('Recipe titles cannot contain the "@" character.');
            return;
        }
        
        const fileInput = elements.recipeImageFile;
        let imagePath = elements.addForm.dataset.existingImage || '';
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const buffer = await file.arrayBuffer();
            imagePath = await window.electronAPI.saveImage(file.name, buffer);
        }

        const ingredients = [];
        elements.ingredientsBuilder.querySelectorAll('.builder-section').forEach(section => {
            const title = section.querySelector('.section-title-input').value;
            const items = [];
            section.querySelectorAll('.builder-item-row').forEach(row => {
                const qtyInput = row.querySelector('.quantity-input');
                const nameInput = row.querySelector('.name-input');
                
                if (qtyInput && nameInput) {
                    const qty = qtyInput.value.trim();
                    const name = nameInput.value.trim();
                    if (name || qty) {
                        items.push({ quantity: qty, name: name });
                    }
                } else {
                    const val = row.querySelector('.item-input')?.value.trim();
                    if (val) items.push(val);
                }
            });
            if (items.length > 0 || title) {
                ingredients.push({ title, items });
            }
        });

        const instructions = [];
        elements.instructionsBuilder.querySelectorAll('.builder-section').forEach(section => {
            const title = section.querySelector('.section-title-input').value;
            const steps = [];
            section.querySelectorAll('.item-input').forEach(input => {
                if (input.value.trim()) steps.push(input.value.trim());
            });
            if (steps.length > 0 || title) {
                instructions.push({ title, steps });
            }
        });

        const newRecipe = {
            id: elements.addForm.dataset.editId || Date.now().toString(),
            title: elements.recipeTitle.value,
            description: elements.recipeDescription.value,
            yield: elements.recipeYield.value,
            activeTime: elements.recipeActiveTime.value,
            totalTime: elements.recipeTotalTime.value,
            source: elements.recipeSourceName.value,
            sourceUrl: elements.recipeSourceUrl.value,
            rating: parseFloat(elements.recipeRating.value) || 0,
            ingredients: ingredients,
            instructions: instructions,
            notes: elements.recipeNotesEditor.innerHTML,
            labels: elements.recipeLabels.value.split(',').map(s => s.trim()).filter(s => s),
            image: imagePath,
            meal: elements.recipeMeal.value,
            type: elements.recipeType.value
        };

        await window.electronAPI.saveRecipe(newRecipe);
        
        elements.addForm.reset();
        updateFormStars(0);
        delete elements.addForm.dataset.editId;
        delete elements.addForm.dataset.existingImage;
        elements.addModal.classList.add('hidden');
        
        await loadRecipes();
        showDetail(newRecipe);
    });

    elements.addIngredientSectionBtn.addEventListener('click', addIngredientSectionBtnHandler);
    elements.addInstructionSectionBtn.addEventListener('click', addInstructionSectionBtnHandler);

    initRatingInput();
    initRichTextEditor();
    initTagAutocomplete();
    
    // Notes Editor Autocomplete
    initRecipeReferenceAutocomplete(elements.recipeNotesEditor); // This works because contenteditable emits input events too
}

function addIngredientSectionBtnHandler() {
    const section = createSection('ingredient');
    if (section.querySelector('.builder-items').children.length === 0) {
        section.querySelector('.add-item-btn').click();
    }
    elements.ingredientsBuilder.appendChild(section);
}

function addInstructionSectionBtnHandler() {
    const section = createSection('instruction');
    if (section.querySelector('.builder-items').children.length === 0) {
        section.querySelector('.add-item-btn').click();
    }
    elements.instructionsBuilder.appendChild(section);
}

function createSection(type) {
    const div = document.createElement('div');
    div.className = 'builder-section';
    div.innerHTML = `
        <input type="text" class="clean-input section-title-input" placeholder="Section Title (Optional)">
        <button type="button" class="remove-btn remove-section-btn">&times;</button>
        <div class="builder-items"></div>
        <button type="button" class="btn-secondary btn-small add-item-btn">+ Add ${type === 'ingredient' ? 'Ingredient' : 'Step'}</button>
    `;

    div.querySelector('.remove-section-btn').addEventListener('click', () => div.remove());

    const itemsContainer = div.querySelector('.builder-items');
    const addItemBtn = div.querySelector('.add-item-btn');
    
    const addItem = () => {
        const row = document.createElement('div');
        row.className = 'builder-item-row';
        
        if (type === 'ingredient') {
            row.innerHTML = `
                <div class="ingredient-row">
                    <input type="text" class="clean-input quantity-input" placeholder="Qty">
                    <input type="text" class="clean-input name-input" placeholder="Ingredient">
                </div>
                <button type="button" class="remove-btn remove-item-btn">&times;</button>
            `;
            initRecipeReferenceAutocomplete(row.querySelector('.name-input'));
        } else {
            row.innerHTML = `
                <input type="text" class="clean-input item-input" placeholder="Step description">
                <button type="button" class="remove-btn remove-item-btn">&times;</button>
            `;
            initRecipeReferenceAutocomplete(row.querySelector('.item-input'));
        }

        row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
        itemsContainer.appendChild(row);
    };

    addItemBtn.addEventListener('click', addItem);
    if (!elements.addForm.dataset.editId) {
        addItem(); 
    }

    // Init autocomplete for section title if it's an instruction section
    // (User asked for instruction title specifically, but we could do both if desired)
    if (type === 'instruction') {
        initRecipeReferenceAutocomplete(div.querySelector('.section-title-input'));
    }

    return div;
}

function initRatingInput() {
    elements.ratingContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.style.position = 'relative';
        star.style.display = 'inline-block';
        star.style.width = '24px';
        star.style.cursor = 'pointer';
        
        star.addEventListener('mousemove', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = e.clientX - rect.left < rect.width / 2;
            const value = i - (isLeft ? 0.5 : 0);
            updateFormStars(value, true);
        });

        star.addEventListener('click', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = e.clientX - rect.left < rect.width / 2;
            const value = i - (isLeft ? 0.5 : 0);
            elements.recipeRating.value = value;
            updateFormStars(value);
        });
        
        elements.ratingContainer.appendChild(star);
    }

    elements.ratingContainer.addEventListener('mouseleave', () => {
        updateFormStars(elements.recipeRating.value || 0);
    });
}

function updateFormStars(value, isPreview = false) {
    const stars = elements.ratingContainer.children;
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

function initRichTextEditor() {
    document.querySelectorAll('.editor-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
            elements.recipeNotesEditor.focus();
            updateEditorButtonStates();
        });
    });

    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (selection.anchorNode && elements.recipeNotesEditor.contains(selection.anchorNode)) {
            updateEditorButtonStates();
        }
    });
}

function updateEditorButtonStates() {
    document.querySelectorAll('.editor-btn').forEach(btn => {
        const cmd = btn.dataset.cmd;
        try {
            const isActive = document.queryCommandState(cmd);
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } catch (e) {
            btn.classList.remove('active');
        }
    });
}

function initTagAutocomplete() {
    let currentFocus = -1;

    // Get all unique tags from existing recipes
    function getAllTags() {
        const allTags = new Set();
        state.recipes.forEach(recipe => {
            if (recipe.labels && Array.isArray(recipe.labels)) {
                recipe.labels.forEach(label => allTags.add(label));
            }
        });
        return Array.from(allTags).sort();
    }

    // Get tags already entered in the input (comma-separated)
    function getEnteredTags() {
        const value = elements.recipeLabels.value;
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        return tags;
    }

    // Get the current tag being typed (after the last comma)
    function getCurrentTag() {
        const value = elements.recipeLabels.value;
        const lastCommaIndex = value.lastIndexOf(',');
        return value.substring(lastCommaIndex + 1).trim();
    }

    // Show autocomplete suggestions
    function showSuggestions() {
        const currentTag = getCurrentTag().toLowerCase();
        const enteredTags = getEnteredTags();
        const allTags = getAllTags();

        // Filter: match current input and exclude already entered tags
        const suggestions = allTags.filter(tag => 
            tag.toLowerCase().includes(currentTag) && 
            currentTag.length > 0 &&
            !enteredTags.includes(tag)
        );

        // Clear dropdown
        elements.tagAutocompleteDropdown.innerHTML = '';
        currentFocus = -1;

        if (suggestions.length === 0) {
            elements.tagAutocompleteDropdown.classList.add('hidden');
            return;
        }

        // Populate dropdown
        suggestions.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = tag;
            item.dataset.index = index;

            // Click handler
            item.addEventListener('click', () => {
                selectTag(tag);
            });

            elements.tagAutocompleteDropdown.appendChild(item);
        });

        elements.tagAutocompleteDropdown.classList.remove('hidden');
    }

    // Select a tag and insert it into the input
    function selectTag(tag) {
        const value = elements.recipeLabels.value;
        const lastCommaIndex = value.lastIndexOf(',');
        
        let newValue;
        if (lastCommaIndex === -1) {
            // No comma yet, replace entire value
            newValue = tag + ', ';
        } else {
            // Replace text after last comma
            newValue = value.substring(0, lastCommaIndex + 1) + ' ' + tag + ', ';
        }

        elements.recipeLabels.value = newValue;
        elements.tagAutocompleteDropdown.classList.add('hidden');
        elements.recipeLabels.focus();
    }

    // Update active item for keyboard navigation
    function setActiveItem(index) {
        const items = elements.tagAutocompleteDropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        currentFocus = index;
    }

    // Input event listener
    elements.recipeLabels.addEventListener('input', () => {
        showSuggestions();
    });

    // Keyboard navigation
    elements.recipeLabels.addEventListener('keydown', (e) => {
        const items = elements.tagAutocompleteDropdown.querySelectorAll('.autocomplete-item');
        
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0;
            setActiveItem(currentFocus);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = items.length - 1;
            setActiveItem(currentFocus);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            elements.tagAutocompleteDropdown.classList.add('hidden');
            currentFocus = -1;
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.recipeLabels.contains(e.target) && 
            !elements.tagAutocompleteDropdown.contains(e.target)) {
            elements.tagAutocompleteDropdown.classList.add('hidden');
            currentFocus = -1;
        }
    });
}
