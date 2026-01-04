export const elements = {
    grid: document.getElementById('recipe-grid'),
    detailView: document.getElementById('recipe-detail'),
    backBtn: document.getElementById('back-btn'),
    searchInput: document.getElementById('search-input'),
    addModal: document.getElementById('add-modal'),
    addBtn: document.getElementById('add-recipe-btn'),
    closeBtn: document.getElementById('close-add-modal'),
    addForm: document.getElementById('add-recipe-form'),
    
    // Detail Actions
    editBtn: document.getElementById('edit-btn'),
    deleteBtn: document.getElementById('delete-btn'),
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    
    // Dynamic Builders
    ingredientsBuilder: document.getElementById('ingredients-builder'),
    instructionsBuilder: document.getElementById('instructions-builder'),
    addIngredientSectionBtn: document.getElementById('add-ingredient-section-btn'),
    addInstructionSectionBtn: document.getElementById('add-instruction-section-btn'),

    // Detail View Elements
    detailImage: document.getElementById('detail-image'),
    detailTitle: document.getElementById('detail-title'),
    detailLabels: document.getElementById('detail-labels'),
    detailRating: document.getElementById('detail-rating'),
    detailYield: document.getElementById('detail-yield'),
    detailActiveTime: document.getElementById('detail-active-time'),
    detailTotalTime: document.getElementById('detail-total-time'),
    detailDescription: document.getElementById('detail-description'),
    detailNotes: document.getElementById('detail-notes'),
    detailSourceWrapper: document.getElementById('detail-source-wrapper'),
    detailSourceContainer: document.getElementById('detail-source-container'),
    detailIngredientsList: document.getElementById('detail-ingredients-list'),
    detailInstructionsList: document.getElementById('detail-instructions-list'),

    // Form Elements
    recipeTitle: document.getElementById('recipe-title'),
    recipeDescription: document.getElementById('recipe-description'),
    recipeYield: document.getElementById('recipe-yield'),
    recipeActiveTime: document.getElementById('recipe-active-time'),
    recipeTotalTime: document.getElementById('recipe-total-time'),
    recipeSourceName: document.getElementById('recipe-source-name'),
    recipeSourceUrl: document.getElementById('recipe-source-url'),
    recipeRating: document.getElementById('recipe-rating'),
    recipeNotesEditor: document.getElementById('recipe-notes-editor'),
    recipeLabels: document.getElementById('recipe-labels'),
    recipeImageFile: document.getElementById('recipe-image-file'),
    recipeMeal: document.getElementById('recipe-meal'),
    recipeType: document.getElementById('recipe-type'),
    ratingContainer: document.querySelector('.rating-input'),
    tagAutocompleteDropdown: document.getElementById('tag-autocomplete-dropdown'),
    recipeReferenceDropdown: document.getElementById('recipe-reference-dropdown'),


    // Filter Elements
    filterTagsBtn: document.getElementById('filter-tags-btn'),
    filterTagsDropdown: document.getElementById('filter-tags-dropdown'),
    filterTagsList: document.getElementById('filter-tags-list'),
    filterIngredientsBtn: document.getElementById('filter-ingredients-btn'),
    filterIngredientsDropdown: document.getElementById('filter-ingredients-dropdown'),
    filterIngredientsList: document.getElementById('filter-ingredients-list'),
    filterTimeCategory: document.getElementById('filter-time-category'),
    filterRatingStars: document.getElementById('filter-rating-stars'),
    filterRatingValueDisplay: document.getElementById('filter-rating-value'),
    filterRatingValueDisplay: document.getElementById('filter-rating-value'),
    clearRatingFilterBtn: document.getElementById('clear-rating-filter'),
    clearAllFiltersBtn: document.getElementById('clear-all-filters-btn'),

    // Settings Elements
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsBtn: document.getElementById('close-settings'),
    themeBtns: document.querySelectorAll('.theme-btn'),
    currentDataPath: document.getElementById('current-data-path'),
    changeFolderBtn: document.getElementById('change-folder-btn'),
    
    // Hero Section
    heroSection: document.querySelector('.hero-section'),
    heroTitle: document.querySelector('.hero-section h1'),
    searchContainer: document.querySelector('.search-container'),
    searchBar: document.querySelector('.search-bar'),
    mapView: document.getElementById('map-view'),
    mapBackBtn: document.getElementById('map-back-btn'),
    mapToggleBtn: document.getElementById('map-toggle-btn'),
};
