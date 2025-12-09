const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getRecipes: () => ipcRenderer.invoke('get-recipes'),
  saveRecipe: (recipe) => ipcRenderer.invoke('save-recipe', recipe),
  deleteRecipe: (id) => ipcRenderer.invoke('delete-recipe', id),
  saveImage: (fileName, buffer) => ipcRenderer.invoke('save-image', fileName, buffer),
  saveIcon: (buffer) => ipcRenderer.invoke('save-icon', buffer),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  selectDataFolder: () => ipcRenderer.invoke('select-data-folder')
});
