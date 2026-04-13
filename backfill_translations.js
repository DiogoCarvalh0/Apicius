const fs = require('fs');
const path = require('path');

const recipesFile = path.join(__dirname, 'database', 'recipes.json');

// Reusing the exact logic from server.js translation blocks
async function translateRecipe(recipe, targetLang) {
    const textsToTranslate = [];
    const mapping = {};
    let index = 0;
    
    function addText(path, text) {
        if (text && typeof text === 'string') {
            mapping[index] = path;
            textsToTranslate.push(text);
            index++;
        }
    }

    addText('title', recipe.title);
    addText('description', recipe.description);
    addText('yield', recipe.yield);
    addText('activeTime', recipe.activeTime);
    addText('totalTime', recipe.totalTime);
    addText('notes', recipe.notes);

    if (recipe.ingredients) {
        recipe.ingredients.forEach((sec, i) => {
            addText(`ingredients.${i}.title`, sec.title);
            sec.items.forEach((item, j) => {
                let t = typeof item === 'object' && item !== null ? `${item.quantity ? item.quantity + ' ' : ''}${item.name}` : item;
                addText(`ingredients.${i}.items.${j}`, t);
            });
        });
    }
    
    if (recipe.instructions) {
        recipe.instructions.forEach((sec, i) => {
            addText(`instructions.${i}.title`, sec.title);
            sec.steps.forEach((step, j) => {
                addText(`instructions.${i}.steps.${j}`, step);
            });
        });
    }

    if (textsToTranslate.length === 0) return null;

    try {
        const combinedText = textsToTranslate.join('\n\n|~|\n\n');
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(combinedText)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const fullTranslation = data[0].map(item => item[0]).join('');
        const translatedTexts = fullTranslation.split(/\n\n\|\~\|\n\n|\n\|\~\|\n|\|\~\|/g).map(s => s.trim());
        
        let finalTexts = translatedTexts;
        if (translatedTexts.length !== textsToTranslate.length) {
            finalTexts = await Promise.all(textsToTranslate.map(async (t) => {
                if (!t.trim()) return t;
                const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(t)}`);
                const d = await r.json();
                return d[0].map(item => item[0]).join('');
            }));
        }

        const res = {};
        res.ingredients = recipe.ingredients ? JSON.parse(JSON.stringify(recipe.ingredients)) : [];
        res.instructions = recipe.instructions ? JSON.parse(JSON.stringify(recipe.instructions)) : [];

        finalTexts.forEach((translatedText, idx) => {
            const path = mapping[idx];
            const parts = path.split('.');
            let current = res;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = isNaN(parts[i+1]) ? {} : [];
                }
                current = current[parts[i]];
            }
            
            const lastPart = parts[parts.length - 1];
            current[lastPart] = translatedText;
        });
        
        return res;
    } catch (error) {
        console.error(`Translation to ${targetLang} error:`, error);
        return null;
    }
}

// ----------------

async function run() {
    console.log('Reading recipes from', recipesFile);
    if (!fs.existsSync(recipesFile)) {
        console.log('No recipes file found.');
        return;
    }

    const data = fs.readFileSync(recipesFile, 'utf-8');
    const recipes = JSON.parse(data);
    let changed = false;

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        if (!recipe.translations) recipe.translations = {};

        console.log(`Translating recipe [${i+1}/${recipes.length}]: ${recipe.title}...`);
        const [enTrans, ptTrans] = await Promise.all([
            translateRecipe(recipe, 'en'),
            translateRecipe(recipe, 'pt-PT')
        ]);
        
        if (enTrans) recipe.translations.en = enTrans;
        if (ptTrans) recipe.translations.pt = ptTrans;
        
        changed = true;
        // Short delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    if (changed) {
        console.log('Saving updated recipes.json...');
        fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));
        console.log('Done!');
    } else {
        console.log('No new recipes required translation.');
    }
}

run();
