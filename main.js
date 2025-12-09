const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// Config Setup
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// Default to 'Database' folder in app directory
const defaultStoragePath = path.join(__dirname, 'Database');
let storagePath = defaultStoragePath;

let recipesFile = path.join(storagePath, 'recipes.json');
let imagesDir = path.join(storagePath, 'images');

// Load Config
function loadConfig() {
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.storagePath && fs.existsSync(config.storagePath)) {
        storagePath = config.storagePath;
        // Update derived paths
        recipesFile = path.join(storagePath, 'recipes.json');
        imagesDir = path.join(storagePath, 'images');
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }
}
loadConfig();

// Default Migration Logic: If we are using the default path, ensure it exists and migrate root files if present
if (storagePath === defaultStoragePath) {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  // Migrate recipes.json from root if it exists
  const rootRecipes = path.join(__dirname, 'recipes.json');
  if (fs.existsSync(rootRecipes) && !fs.existsSync(recipesFile)) {
    try {
      fs.renameSync(rootRecipes, recipesFile);
      console.log('Migrated recipes.json to Database folder');
    } catch (err) {
      console.error('Failed to migrate recipes.json:', err);
    }
  }

  // Migrate images folder from root if it exists
  const rootImages = path.join(__dirname, 'images');
  if (fs.existsSync(rootImages) && !fs.existsSync(imagesDir)) {
    try {
      fs.renameSync(rootImages, imagesDir);
      console.log('Migrated images folder to Database folder');
    } catch (err) {
      console.error('Failed to migrate images folder:', err);
    }
  }
}

// Ensure images dir exists (in whatever storage path we ended up with)
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true // Keep security enabled
    },
    titleBarStyle: 'hiddenInset', // Mac-like feel
    icon: path.join(__dirname, 'assets/logo - v2.png')
  });

  win.loadFile('index.html');
}

// Set App Name for Mac
app.setName('Apicius');

app.whenReady().then(() => {
  // Set Dock Icon for Mac
  // Set Dock Icon for Mac
  // On macOS, the dock icon is handled by the app bundle (.icns)
  // We should NOT manually set it here as it overrides the bundle icon with the raw PNG
  /*
  if (process.platform === 'darwin') {
    const macIcon = path.join(__dirname, 'assets/icon_mac.png');
    const defaultIcon = path.join(__dirname, 'assets/logo - v2.png');
    if (fs.existsSync(macIcon)) {
        app.dock.setIcon(macIcon);
    } else {
        app.dock.setIcon(defaultIcon);
    }
  }
  */

  // Register 'recipe' protocol to serve files from storagePath
  protocol.registerFileProtocol('recipe', (request, callback) => {
    const url = request.url.replace('recipe://', '');
    // Decode URL to handle spaces/special chars
    const decodedUrl = decodeURIComponent(url);
    try {
      // The request will be like recipe://images/foo.jpg
      // We want to serve storagePath/images/foo.jpg
      // But wait, the stored path is "images/foo.jpg".
      // So we just join storagePath with the url path.
      return callback(path.join(storagePath, decodedUrl));
    } catch (error) {
      console.error('Failed to register protocol', error);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper Functions
function readRecipes() {
  if (!fs.existsSync(recipesFile)) {
    return [];
  }
  const data = fs.readFileSync(recipesFile, 'utf-8');
  return JSON.parse(data);
}

function writeRecipes(recipes) {
  fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));
}

// IPC Handlers
ipcMain.handle('get-recipes', async () => {
  return readRecipes();
});

ipcMain.handle('save-recipe', async (event, recipe) => {
  const recipes = readRecipes();
  const index = recipes.findIndex(r => r.id === recipe.id);
  
  if (index !== -1) {
    // Update existing
    const oldRecipe = recipes[index];
    // If image changed and old image exists, delete old image
    if (oldRecipe.image && recipe.image && oldRecipe.image !== recipe.image) {
      const oldImagePath = path.join(storagePath, oldRecipe.image); // Use storagePath
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error('Failed to delete old image:', err);
        }
      }
    }
    recipes[index] = recipe;
  } else {
    recipes.push(recipe);
  }
  writeRecipes(recipes);
  return true;
});

ipcMain.handle('delete-recipe', async (event, recipeId) => {
  const recipes = readRecipes();
  const recipeToDelete = recipes.find(r => r.id === recipeId);
  
  if (recipeToDelete && recipeToDelete.image) {
    const imagePath = path.join(storagePath, recipeToDelete.image); // Use storagePath
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error('Failed to delete image:', err);
      }
    }
  }

  const filtered = recipes.filter(r => r.id !== recipeId);
  writeRecipes(filtered);
  return true;
});

ipcMain.handle('save-image', async (event, fileName, buffer) => {
  if (!buffer) return null;
  // Ensure images dir exists (in case storage path changed)
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  const newFileName = `${Date.now()}_${fileName}`;
  const destPath = path.join(imagesDir, newFileName);
  fs.writeFileSync(destPath, Buffer.from(buffer));
  return `images/${newFileName}`; // Return relative path
});

ipcMain.handle('save-icon', async (event, buffer) => {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }
  const destPath = path.join(assetsDir, 'icon_mac.png');
  fs.writeFileSync(destPath, Buffer.from(buffer));
  // Update Dock Icon Immediately
  if (process.platform === 'darwin') {
    app.dock.setIcon(destPath);
  }
  return destPath;
});

// Settings Handlers
ipcMain.handle('get-app-config', async () => {
  return { storagePath };
});

ipcMain.handle('select-data-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const newPath = result.filePaths[0];
  const newRecipesFile = path.join(newPath, 'recipes.json');
  const newImagesDir = path.join(newPath, 'images');

  // Migration Logic: If new folder has no recipes.json, copy current data
  if (!fs.existsSync(newRecipesFile)) {
    try {
      let migrationSuccess = true;

      // Copy recipes.json
      if (fs.existsSync(recipesFile)) {
        fs.copyFileSync(recipesFile, newRecipesFile);
      } else {
        fs.writeFileSync(newRecipesFile, '[]');
      }

      // Copy images folder
      if (fs.existsSync(imagesDir)) {
        if (!fs.existsSync(newImagesDir)) {
          fs.mkdirSync(newImagesDir);
        }
        const files = fs.readdirSync(imagesDir);
        for (const file of files) {
          fs.copyFileSync(path.join(imagesDir, file), path.join(newImagesDir, file));
        }
      }
      
      // DELETE OLD DATA (Move operation)
      // Only delete if we are changing paths and migration seemed to work
      if (storagePath !== newPath) {
        try {
            if (fs.existsSync(recipesFile)) {
                fs.unlinkSync(recipesFile);
            }
            if (fs.existsSync(imagesDir)) {
                fs.rmSync(imagesDir, { recursive: true, force: true });
            }
            console.log('Old data deleted from:', storagePath);
        } catch (cleanupErr) {
            console.error('Failed to delete old data:', cleanupErr);
            // Non-critical, just log it
        }
      }

    } catch (err) {
      console.error('Migration failed:', err);
      // If migration fails, maybe we shouldn't switch? 
      // For now, let's assume partial success is better than nothing or just proceed.
    }
  }

  // Update Config
  storagePath = newPath;
  recipesFile = newRecipesFile;
  imagesDir = newImagesDir;

  fs.writeFileSync(configPath, JSON.stringify({ storagePath }, null, 2));

  return storagePath;
});
