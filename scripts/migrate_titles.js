const fs = require('fs');
const path = require('path');

const recipesFile = path.join(__dirname, '..', 'database', 'recipes.json');

function migrate() {
    if (!fs.existsSync(recipesFile)) {
        console.error('Recipes file not found at:', recipesFile);
        return;
    }

    try {
        const data = fs.readFileSync(recipesFile, 'utf-8');
        const recipes = JSON.parse(data);

        let modifiedCount = 0;
        recipes.forEach(recipe => {
            if (recipe.translations) {
                Object.keys(recipe.translations).forEach(lang => {
                    if (recipe.translations[lang].title !== undefined) {
                        delete recipe.translations[lang].title;
                        modifiedCount++;
                    }
                });
            }
        });

        if (modifiedCount > 0) {
            fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));
            console.log(`Migration complete. Removed titles from ${modifiedCount} translations.`);
        } else {
            console.log('No translated titles found to remove.');
        }
    } catch (err) {
        console.error('Error during migration:', err);
    }
}

migrate();
