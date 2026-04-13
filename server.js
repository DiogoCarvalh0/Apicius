const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Config Setup
const storagePath = path.join(__dirname, 'database');
const recipesFile = path.join(storagePath, 'recipes.json');
const imagesDir = path.join(storagePath, 'images');

const thumbsDir = path.join(imagesDir, 'thumb');

// Ensure database and images directories exist
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

// Ensure recipes.json exists
if (!fs.existsSync(recipesFile)) {
  fs.writeFileSync(recipesFile, '[]');
}

// In-memory recipe cache
let recipesCache = null;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Set up Multer for image uploads with file size limit and type filter
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max image
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    // Fallback: check file extension (some clients send application/octet-stream)
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_IMAGE_EXTS.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
  }
});

// Helper Functions (async with cache)
async function readRecipes() {
  if (recipesCache) return recipesCache;
  try {
    const data = await fsPromises.readFile(recipesFile, 'utf-8');
    recipesCache = JSON.parse(data);
    return recipesCache;
  } catch {
    return [];
  }
}

async function writeRecipes(recipes) {
  recipesCache = recipes;
  await fsPromises.writeFile(recipesFile, JSON.stringify(recipes, null, 2));
}

// ---- API Endpoints ---- //

// Allowed translation target languages
const ALLOWED_LANGUAGES = ['en', 'pt', 'pt-PT', 'es', 'fr', 'de', 'it'];

// Server-side Translation Helper
async function translateRecipe(recipe, targetLang) {
    if (!ALLOWED_LANGUAGES.includes(targetLang)) {
        console.error(`Invalid target language: ${targetLang}`);
        return null;
    }

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

    // Title is no longer translated as per user request
    // addText('title', recipe.title);
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

// Get all recipes (supports optional pagination via ?page=N&limit=N)
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await readRecipes();
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    if (page > 0 && limit > 0) {
      const start = (page - 1) * limit;
      const paginated = recipes.slice(start, start + limit);
      return res.json({
        recipes: paginated,
        total: recipes.length,
        page,
        limit,
        totalPages: Math.ceil(recipes.length / limit)
      });
    }

    res.json(recipes);
  } catch (err) {
    console.error('Error reading recipes:', err);
    res.status(500).json({ error: 'Failed to read recipes' });
  }
});

// Save or Update a recipe
app.post('/api/recipes', async (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe || !recipe.id || !recipe.title) {
      return res.status(400).json({ error: 'Recipe must have an id and title' });
    }
    const recipes = await readRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    
    if (!recipe.translations) recipe.translations = {};
    
    // Always translate to both languages if translations were cleared/empty
    if (Object.keys(recipe.translations).length === 0) {
        console.log('Translating recipe automatically on save...');
        const [enTrans, ptTrans] = await Promise.all([
            translateRecipe(recipe, 'en'),
            translateRecipe(recipe, 'pt-PT')
        ]);
        if (enTrans) recipe.translations.en = enTrans;
        if (ptTrans) recipe.translations.pt = ptTrans;
    }
    
    if (index !== -1) {
      // Update existing
      const oldRecipe = recipes[index];
      
      // If image changed or was removed, and old image exists, check if it's still needed
      if (oldRecipe.image && oldRecipe.image !== recipe.image) {
        const isImageUsedElsewhere = recipes.some((r, idx) => idx !== index && r.image === oldRecipe.image);
        
        if (!isImageUsedElsewhere) {
          // extract filename safely
          const oldImageName = oldRecipe.image.includes('/') ? oldRecipe.image.split('/').pop() : oldRecipe.image;
          const oldImagePath = path.join(imagesDir, oldImageName);
          
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log(`Deleted unused image: ${oldImageName}`);
            } catch (err) {
              console.error('Failed to delete old image:', err);
            }
          }
          
          // Also delete old thumbnail
          const oldThumbName = `${path.parse(oldImageName).name}.webp`;
          const oldThumbPath = path.join(thumbsDir, oldThumbName);
          if (fs.existsSync(oldThumbPath)) {
            try {
              fs.unlinkSync(oldThumbPath);
              console.log(`Deleted unused thumbnail: ${oldThumbName}`);
            } catch (err) {
              console.error('Failed to delete old thumbnail:', err);
            }
          }
        }
      }
      recipes[index] = recipe;
    } else {
      // Create new
      recipes.push(recipe);
    }
    
    await writeRecipes(recipes);
    res.json({ success: true, recipe });
  } catch (err) {
    console.error('Error saving recipe:', err);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

// Delete a recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipes = await readRecipes();
    const recipeToDelete = recipes.find(r => r.id === recipeId);
    
    if (recipeToDelete && recipeToDelete.image) {
      const imageName = recipeToDelete.image.replace('images/', '');
      const imagePath = path.join(imagesDir, imageName);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Failed to delete image:', err);
        }
      }
      // Also delete thumbnail
      const thumbName = `${path.parse(imageName).name}.webp`;
      const thumbPath = path.join(thumbsDir, thumbName);
      if (fs.existsSync(thumbPath)) {
        try {
          fs.unlinkSync(thumbPath);
        } catch (err) {
          console.error('Failed to delete thumbnail:', err);
        }
      }
    }

    const filtered = recipes.filter(r => r.id !== recipeId);
    await writeRecipes(filtered);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Save Image
app.post('/api/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Sanitize filename: strip path components and use a random prefix
    const rawName = req.body.fileName || req.file.originalname;
    const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const newFileName = `${crypto.randomBytes(8).toString('hex')}_${safeName}`;
    const destPath = path.join(imagesDir, newFileName);
    
    // Verify the resolved path is within imagesDir
    if (!destPath.startsWith(imagesDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Save original image
    await fsPromises.writeFile(destPath, req.file.buffer);
    
    // Generate thumbnail (400px wide, WebP format)
    const thumbName = `${path.parse(newFileName).name}.webp`;
    const thumbPath = path.join(thumbsDir, thumbName);
    try {
      await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
    } catch (thumbErr) {
      console.error('Thumbnail generation failed (using original):', thumbErr);
    }
    
    res.json({ imagePath: `images/${newFileName}` });
  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Settings & Config
app.get('/api/config', (req, res) => {
  res.json({ storagePath });
});

// Generate thumbnails for existing images that don't have one
app.post('/api/generate-thumbnails', async (req, res) => {
  try {
    const recipes = await readRecipes();
    let generated = 0;
    for (const recipe of recipes) {
      if (!recipe.image) continue;
      const imageName = recipe.image.replace('images/', '');
      const thumbName = `${path.parse(imageName).name}.webp`;
      const thumbPath = path.join(thumbsDir, thumbName);
      const originalPath = path.join(imagesDir, imageName);
      if (!fs.existsSync(thumbPath) && fs.existsSync(originalPath)) {
        try {
          await sharp(originalPath)
            .resize(400, 400, { fit: 'cover', position: 'center' })
            .webp({ quality: 80 })
            .toFile(thumbPath);
          generated++;
        } catch (err) {
          console.error(`Thumbnail failed for ${imageName}:`, err.message);
        }
      }
    }
    res.json({ success: true, generated });
  } catch (err) {
    console.error('Error generating thumbnails:', err);
    res.status(500).json({ error: 'Failed to generate thumbnails' });
  }
});

// ---- Static File Serving ---- //
// Serve images from database folder directly
app.use('/images', express.static(imagesDir, { maxAge: '7d' }));

// Serve other static assets
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '7d' }));
app.use('/renderer', express.static(path.join(__dirname, 'renderer')));
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Also serve everything in root to handle any missed static files like favicon etc
app.use(express.static(__dirname));

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler (catches multer errors, etc.)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 10MB)' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Apicius NAS Server running on http://localhost:${PORT}`);
  console.log(`Access this from another device on your network using your NAS IP address.`);
});
