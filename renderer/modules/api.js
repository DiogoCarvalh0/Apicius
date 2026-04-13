// API Client for the Express Backend

const API_BASE_URL = '/api';

export const api = {
    async getRecipes() {
        const response = await fetch(`${API_BASE_URL}/recipes`);
        if (!response.ok) throw new Error('Failed to fetch recipes');
        return await response.json();
    },

    async saveRecipe(recipe) {
        const response = await fetch(`${API_BASE_URL}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipe),
        });
        if (!response.ok) throw new Error('Failed to save recipe');
        const data = await response.json();
        return data.success;
    },

    async deleteRecipe(id) {
        const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete recipe');
        const data = await response.json();
        return data.success;
    },

    async saveImage(fileName, buffer) {
        // Determine MIME type from file extension
        const ext = fileName.split('.').pop().toLowerCase();
        const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('image', blob, fileName);

        const response = await fetch(`${API_BASE_URL}/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        return data.imagePath;
    },

    // Mocking out desktop-specific features since they don't apply to a web app
    async getAppConfig() {
        const response = await fetch(`${API_BASE_URL}/config`);
        if (!response.ok) return { storagePath: './database' };
        return await response.json();
    },

    async selectDataFolder() {
        console.warn('selectDataFolder is not supported in the web version.');
        return null;
    },

    async saveIcon(buffer) {
        console.warn('saveIcon is not supported in the web version.');
        return null; // Ignore custom dock icons
    }
};

// Polyfill to replace window.electronAPI
window.electronAPI = api;
