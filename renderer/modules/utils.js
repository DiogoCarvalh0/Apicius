export function parseDuration(timeStr) {
    if (!timeStr) return 0;
    timeStr = timeStr.toLowerCase();
    
    let minutes = 0;
    
    // Extract hours
    const hoursMatch = timeStr.match(/(\d+)\s*(?:h|hr|hour)/);
    if (hoursMatch) {
        minutes += parseInt(hoursMatch[1]) * 60;
    }
    
    // Extract minutes
    const minMatch = timeStr.match(/(\d+)\s*(?:m|min)/);
    if (minMatch) {
        minutes += parseInt(minMatch[1]);
    }
    
    // Fallback: if just a number "45", treat as minutes
    if (minutes === 0 && /^\d+$/.test(timeStr.trim())) {
        minutes = parseInt(timeStr.trim());
    }

    return minutes;
}

export function parseIngredient(text) {
    if (!text) return '';
    // Regex to remove leading numbers, fractions, and common units
    const cleanText = text.replace(/^[\d\s/.\u00BC-\u00BE\u2150-\u215E\u2189]+(?:(cups?|tsp|tbsp|teaspoons?|tablespoons?|grams?|g|kg|oz|ounces?|lbs?|pounds?|ml|l|liters?|pinch|dash|cloves?|slices?|pieces?|cans?|jars?|packages?|bags?|box|boxes|sticks?)\b)?\s*(?:of\b)?\s*/i, '');
    return cleanText.trim().toLowerCase();
}

export function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            // Full Star
            html += '<span style="color: #ffd700;">★</span>';
        } else if (rating >= i - 0.5) {
            // Half Star
            html += '<span style="background: linear-gradient(90deg, #ffd700 50%, #ccc 50%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">★</span>';
        } else {
            // Empty Star
            html += '<span style="color: #ccc;">★</span>';
        }
    }
    return html;
}
