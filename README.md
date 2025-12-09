# 🍳 Apicius

A modern desktop recipe manager built with Electron. Save, organize, and cook your favorite recipes inspired by the ancient Roman cookbook.

## Features

- 📚 **Add & Edit Recipes** - Comprehensive form with ingredients, instructions, images, and ratings
- 🔍 **Smart Search & Filters** - Search by name, tags, ingredients, time, and star ratings
- ⭐ **Half-Star Ratings** - Precise 0.5 increment ratings
- ✅ **Interactive Cooking** - Check off ingredients and steps while cooking
- 🎨 **Dark/Light Theme** - Modern UI with theme support
- 💾 **Flexible Storage** - Choose where to save your recipes

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start

# Build for distribution
npm run build
```

## Usage

### Add a Recipe
1. Click **+ Add Recipe**
2. Fill in title, description, yield, times, and rating
3. Add ingredients with quantities
4. Add step-by-step instructions
5. Upload an image (optional)
6. Save

### Filter Recipes
- **Search**: Type recipe name
- **Tags**: Select tags to filter
- **Ingredients**: Filter by ingredients
- **Time**: Quick (<30m), Medium (30m-1.5h), Long (1.5h-24h), Multi-day (>24h)
- **Rating**: Click stars for minimum rating

### Cook with a Recipe
- Click any recipe to view details
- Click ingredients/steps to mark as complete
- Sections turn green when fully checked

## Project Structure

```
├── main.js              # Electron main process
├── preload.js          # IPC bridge
├── index.html          # App UI
├── styles.css          # Styling
└── renderer/           # Frontend modules
    ├── main.js         # Entry point
    └── modules/        # Feature modules
```

## Tech Stack

- **Electron** - Desktop framework
- **Node.js** - Backend
- **ES6 Modules** - Modern JavaScript
- **Vanilla CSS** - No framework styling

## Data Format

Recipes stored as JSON in `Database/recipes.json`:

```json
{
  "id": "1234567890",
  "title": "Recipe Name",
  "rating": 4.5,
  "ingredients": [{"title": "Section", "items": [{"quantity": "2 cups", "name": "flour"}]}],
  "instructions": [{"title": "Section", "steps": ["Step 1"]}],
  "image": "images/photo.jpg"
}
```

## License

MIT

---

**Made with ❤️ for home cooks**
