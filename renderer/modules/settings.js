import { elements } from './dom.js';
import { loadRecipes } from './recipes.js';

export function initSettings() {
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
        loadSettingsConfig();
    });

    elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.add('hidden');
        }
    });

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme);

    elements.themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
        });
    });

    // Data Folder Logic
    elements.changeFolderBtn.addEventListener('click', async () => {
        const newPath = await window.electronAPI.selectDataFolder();
        if (newPath) {
            elements.currentDataPath.textContent = newPath;
            loadRecipes();
            alert('Data folder changed successfully! Recipes loaded from new location.');
        }
    });

    loadSettingsConfig();
}

function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    
    elements.themeBtns.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (theme === 'system') {
        localStorage.removeItem('theme');
    } else {
        document.body.classList.add(`${theme}-theme`);
        localStorage.setItem('theme', theme);
    }
}

async function loadSettingsConfig() {
    const config = await window.electronAPI.getAppConfig();
    if (config && config.storagePath) {
        elements.currentDataPath.textContent = config.storagePath;
    }
}
