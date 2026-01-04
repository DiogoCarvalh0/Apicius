import { getCountryIdFromTag, getAdjectiveFromId } from './countryData.js';
import { elements } from './modules/dom.js';

export const MapController = {
    mapContainer: null,
    svgElement: null,
    mapWrapper: null,
    currentRecipes: [],
    
    init() {
        this.mapContainer = document.getElementById('map-view');
        this.loadMap();
        this.setupNavigation();
        
        document.addEventListener('recipes-updated', (e) => {
            this.updateMapData(e.detail);
        });
        
        // Also listen for request-map-update (from toggle)
        document.addEventListener('request-map-update', () => {
             // We can re-render if needed, or just rely on cached data.
             // If we have currentRecipes, just ensure view is correct.
             if (this.currentRecipes.length > 0) {
                 this.updateMapData(this.currentRecipes);
             }
        });
    },

    async loadMap() {
        try {
            const response = await fetch('assets/world.svg');
            const svgText = await response.text();
            
            const mapWrapper = document.createElement('div');
            mapWrapper.className = 'map-wrapper';
            mapWrapper.innerHTML = svgText;
            this.mapWrapper = mapWrapper;
            
            // Clean up SVG if needed
            const svg = mapWrapper.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                // Preserve aspect ratio to ensure full map is visible
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            } else {
                console.error("No SVG found in loaded file");
                this.mapContainer.innerHTML = '<p class="error-msg">Failed to load map assets.</p>';
                return;
            }

            // Create "No Country" Indicator
            const noCountryBtn = document.createElement('div');
            noCountryBtn.id = 'no-country-indicator';
            noCountryBtn.className = 'no-country-indicator';
            noCountryBtn.title = 'Recipes without a specific country';
            noCountryBtn.innerHTML = `
                <div class="indicator-circle">
                    <span>Other</span>
                </div>
            `;
            noCountryBtn.addEventListener('click', () => {
            if (noCountryBtn.classList.contains('has-recipes')) {
                this.showCountryRecipes('other');
            }
        });

            this.mapContainer.innerHTML = '';
            this.mapContainer.appendChild(mapWrapper);
            mapWrapper.appendChild(noCountryBtn);

            this.svgElement = this.mapContainer.querySelector('svg');
            this.setupInteractions();
            
            // If we already have recipes (e.g. from early event), update now
            if (this.currentRecipes.length > 0) {
                this.updateMapData(this.currentRecipes);
            }
            
        } catch (error) {
            console.error('Failed to load map:', error);
            this.mapContainer.innerHTML = '<p class="error-msg">Could not load World Map.</p>';
        }
    },

    setupInteractions() {
        if (!this.svgElement) return;

        // Zoom/Pan State
        let scale = 1; // Start at 1 because SVG 'meet' will fit it.
        // If we want it smaller initially we can set < 1 but 1 should be 'fit to screen' with 'meet'
        let pPanning = false;
        let pointX = 0;
        let pointY = 0;
        let start = { x: 0, y: 0 };
        
        // Store resetTransform function for external access
        this.resetTransform = () => {
            scale = 1;
            pointX = 0;
            pointY = 0;
            setTransform();
        };
        
        // Wrap SVG in a group for transform if not already
        // But better: Apply transform to the SVG content or the wrapper
        // The loadMap function creates a map-wrapper div. We can transform the wrapper itself.
        if (this.mapWrapper) {
            this.mapWrapper.style.transformOrigin = '0 0';
            this.mapWrapper.style.transition = 'transform 0.1s ease-out';
        }
        
        const setTransform = () => {
             if (this.mapWrapper) {
                 this.mapWrapper.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
             }
        }

        // Mouse Wheel Zoom
        this.mapContainer.addEventListener('wheel', (e) => {
             e.preventDefault();
             const xs = (e.clientX - pointX) / scale;
             const ys = (e.clientY - pointY) / scale;
             const delta = -e.deltaY;
             
             (delta > 0) ? (scale *= 1.1) : (scale /= 1.1);
             scale = Math.min(Math.max(1, scale), 8); // Limit zoom: 1x (full map) to 8x
             
             pointX = e.clientX - xs * scale;
             pointY = e.clientY - ys * scale;

             // Re-clamp bounds after zoom
             const mapRect = this.mapContainer.getBoundingClientRect();
             // Get intrinsic SVG size or current scaled size
             // We can approximate scaled dimensions:
             const currentSvgWidth = mapRect.width * scale; // Assuming fit-width initially
             const currentSvgHeight = mapRect.height * scale;

             // More accurate: use getBoundingClientRect of a known full-size element if available,
             // or rely on the assumption that at scale=1, it fits efficiently.
             // If we use the same logic as mousemove:
             const minX = Math.min(0, mapRect.width - currentSvgWidth);
             const maxX = 0;
             const minY = Math.min(0, mapRect.height - currentSvgHeight);
             const maxY = 0;
             
             pointX = Math.max(minX, Math.min(maxX, pointX));
             pointY = Math.max(minY, Math.min(maxY, pointY));

             setTransform();
        });

        // Pan
        this.mapContainer.addEventListener('mousedown', (e) => {
             e.preventDefault();
             start = { x: e.clientX - pointX, y: e.clientY - pointY };
             pPanning = true;
             this.mapContainer.style.cursor = 'grabbing';
        });

        this.mapContainer.addEventListener('mousemove', (e) => {
             if (!pPanning) return;
             e.preventDefault();
             
             // Calculate new position
             const newPointX = e.clientX - start.x;
             const newPointY = e.clientY - start.y;
             
             // Get viewport and SVG dimensions
             const mapRect = this.mapContainer.getBoundingClientRect();
             const svgRect = this.svgElement.getBoundingClientRect();
             const svgWidth = svgRect.width;
             const svgHeight = svgRect.height;
             
             // Calculate bounds for panning
             // When zoomed in (scale > 1), the SVG is larger than viewport, allow panning
             // When at default zoom (scale = 1), SVG fits perfectly, so bounds are tight
             const minX = Math.min(0, mapRect.width - svgWidth);
             const maxX = 0;
             const minY = Math.min(0, mapRect.height - svgHeight);
             const maxY = 0;
             
             // Constrain to bounds
             pointX = Math.max(minX, Math.min(maxX, newPointX));
             pointY = Math.max(minY, Math.min(maxY, newPointY));
             
             setTransform();
        });

        this.mapContainer.addEventListener('mouseup', () => {
             pPanning = false;
             this.mapContainer.style.cursor = '';
        });
        
        this.mapContainer.addEventListener('mouseleave', () => {
             pPanning = false;
             this.mapContainer.style.cursor = '';
        });

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip hidden';
        document.body.appendChild(tooltip);

        this.svgElement.addEventListener('click', (e) => {
            const target = e.target.closest('path');
            if (target && target.id) {
                // If it's a country with recipes, show them
                if (target.classList.contains('has-recipes')) {
                    this.showCountryRecipes(target.id);
                }
            }
        });

        this.svgElement.addEventListener('mouseover', (e) => {
            const target = e.target.closest('path');
            if (target && target.id && target.classList.contains('has-recipes')) {
                // Show tooltip
                const count = target.getAttribute('data-recipe-count');
                const name = target.getAttribute('title') || target.id; // Use full title (e.g., "United Kingdom") or fallback to ID
                tooltip.textContent = `${name}: ${count} recipe${count > 1 ? 's' : ''}`;
                tooltip.classList.remove('hidden');
                
                // Highlight
                target.style.opacity = '0.8';
            }
        });

        this.svgElement.addEventListener('mousemove', (e) => {
             tooltip.style.left = e.pageX + 10 + 'px';
             tooltip.style.top = e.pageY + 10 + 'px';
        });

        this.svgElement.addEventListener('mouseout', (e) => {
            const target = e.target.closest('path');
            if (target) {
                target.style.opacity = '';
                tooltip.classList.add('hidden');
            }
        });
    },

    updateMapData(recipes) {
        this.currentRecipes = recipes;
        if (!this.svgElement) return;

        // Reset map
        const paths = this.svgElement.querySelectorAll('path');
        paths.forEach(p => {
            p.classList.remove('has-recipes');
            p.removeAttribute('data-recipe-count');
            p.style.fill = ''; // Reset fill
        });

        const countryCounts = {};
        let otherCount = 0;

        recipes.forEach(recipe => {
            let placed = false;
            // Check labels for country match
            if (recipe.labels && recipe.labels.length > 0) {
                // labels is an array, not a string
                const tags = Array.isArray(recipe.labels) ? recipe.labels : recipe.labels.split(',').map(t => t.trim());
                tags.forEach(tag => {
                    const countryId = getCountryIdFromTag(tag);
                    if (countryId) {
                        // Check if ID exists in map (or try to find it)
                        const element = this.svgElement.getElementById(countryId);
                        if (element) {
                            countryCounts[countryId] = (countryCounts[countryId] || 0) + 1;
                            placed = true;
                            console.log(`✓ Recipe "${recipe.title}" matched to ${countryId}`);
                        } else {
                            console.warn(`✗ Country ID "${countryId}" from tag "${tag}" not found in SVG for recipe "${recipe.title}"`);
                        }
                    } else {
                        console.log(`→ Tag "${tag}" from recipe "${recipe.title}" did not map to any country`);
                    }
                });
            }

            if (!placed) {
                otherCount++;
            }
        });
        
        console.log(`Map Update Summary: ${Object.keys(countryCounts).length} countries highlighted, ${otherCount} recipes without country`);
        console.log('Country counts:', countryCounts);

        // Update SVG
        Object.keys(countryCounts).forEach(id => {
            const count = countryCounts[id];
            const element = this.svgElement.getElementById(id);
            if (element) {
                element.classList.add('has-recipes');
                element.setAttribute('data-recipe-count', count);
            }
        });

        // Update "Other" indicator
        const noCountryIndicator = document.getElementById('no-country-indicator');
        if (noCountryIndicator) {
             if (otherCount > 0) {
                 noCountryIndicator.classList.add('has-recipes');
             } else {
                 noCountryIndicator.classList.remove('has-recipes');
             }
        }
    },

    showCountryRecipes(countryId) {
        // Collect recipes
        const recipesToShow = [];
        
        if (countryId === 'other') {
             this.currentRecipes.forEach(recipe => {
                let placed = false;
                if (recipe.labels && recipe.labels.length > 0) {
                    const tags = Array.isArray(recipe.labels) ? recipe.labels : recipe.labels.split(',').map(t => t.trim());
                    tags.forEach(tag => {
                         const cid = getCountryIdFromTag(tag);
                         if (cid && this.svgElement.getElementById(cid)) {
                             placed = true;
                         }
                    });
                }
                if (!placed) recipesToShow.push(recipe);
             });
        } else {
            this.currentRecipes.forEach(recipe => {
                if (recipe.labels && recipe.labels.length > 0) {
                    const tags = Array.isArray(recipe.labels) ? recipe.labels : recipe.labels.split(',').map(t => t.trim());
                    if (tags.some(tag => getCountryIdFromTag(tag) === countryId)) {
                        recipesToShow.push(recipe);
                    }
                }
            });
        }

        // Show Modal or Filtered View
        // For premium feel, let's trigger a custom modal
        this.openRecipeListModal(countryId, recipesToShow);
    },

    setupNavigation() {
        const toggleBtn = elements.mapToggleBtn;
        const gridView = elements.grid;
        const mapView = elements.mapView;
        const detailView = elements.detailView;
        const heroSection = elements.heroSection;
        const addBtn = elements.addBtn;
        const mapBackBtn = elements.mapBackBtn;
        
        const returnToList = () => {
            if (this.resetTransform) {
                this.resetTransform();
            }
            mapView.classList.add('hidden');
            detailView.classList.add('hidden');
            gridView.classList.remove('hidden');
            heroSection.classList.remove('hidden');
            addBtn.classList.remove('hidden');
            if (elements.searchBar) elements.searchBar.classList.remove('hidden');
            if (elements.searchContainer) elements.searchContainer.classList.remove('hidden');
            toggleBtn.classList.remove('active');
            if (elements.heroTitle) elements.heroTitle.textContent = 'Recipes';
            window.scrollTo(0, 0);
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isMapVisible = !mapView.classList.contains('hidden');
                
                if (isMapVisible) {
                    returnToList();
                } else {
                    // Switch to Map
                    mapView.classList.remove('hidden');
                    gridView.classList.add('hidden');
                    detailView.classList.add('hidden');
                    heroSection.classList.remove('hidden'); // Ensure hero is visible for title
                    addBtn.classList.remove('hidden'); // Explicitly show add button
                    if (elements.searchBar) elements.searchBar.classList.add('hidden');
                    // Ensure the container is visible but search bar is hidden
                    if (elements.searchContainer) elements.searchContainer.classList.remove('hidden');
                    
                    toggleBtn.classList.add('active');
                    if (elements.heroTitle) elements.heroTitle.textContent = 'World Recipes';
                    
                    window.scrollTo(0, 0);

                    // Trigger map update
                    const event = new CustomEvent('request-map-update');
                    document.dispatchEvent(event);
                }
            });
        }

        if (mapBackBtn) {
            mapBackBtn.addEventListener('click', returnToList);
        }
    },

    openRecipeListModal(countryId, recipes) {
        // Create modal content dynamically
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'map-list-modal';
        
        const adjective = getAdjectiveFromId(countryId);
        const title = adjective ? `${adjective} Recipes` : 'Recipes';

        let recipesHtml = '';
        recipes.forEach(r => {
             // Use placeholder for recipes without images
             const imageSrc = r.image ? `recipe://${r.image}` : 'https://placehold.co/400x300/png?text=No+Image';
             recipesHtml += `
                <div class="map-list-item" data-id="${r.id}">
                    <img src="${imageSrc}" class="map-list-img">
                    <div class="map-list-info">
                         <h4>${r.title}</h4>
                         <div class="rating-stars">${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}</div>
                    </div>
                </div>
             `;
        });

        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <div class="close-modal" id="close-map-list">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="map-recipe-list">
                        ${recipes.length > 0 ? recipesHtml : '<p>No recipes found.</p>'}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animation
        requestAnimationFrame(() => modal.classList.remove('hidden')); // It's not hidden by default unless we add class
        // Wait, standard modal logic in this app uses .hidden class to start. 
        // Let's just append it visible or transition opacity.
        
        // Close logic
        const closeBtn = modal.querySelector('#close-map-list');
        const close = () => {
            modal.remove();
        };
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        // Click interaction
        const items = modal.querySelectorAll('.map-list-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                // Dispatch event to open detail
                const event = new CustomEvent('open-recipe-detail', { detail: id });
                document.dispatchEvent(event);
                close(); // Open detail and close this list
            });
        });
    }
};
