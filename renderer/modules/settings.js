import { elements } from './dom.js';
import { loadRecipes } from './recipes.js';
import { currentLang, recipeLang, setAppLanguage, setRecipeLanguage } from './i18n.js';

export function initSettings() {
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
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

    const actualThemeBtns = document.querySelectorAll('.theme-btn[data-theme]');
    actualThemeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
        });
    });

    // App Language Logic
    const appLangBtns = document.querySelectorAll('.app-lang-btn');
    appLangBtns.forEach(btn => {
        if (btn.dataset.lang === currentLang) btn.classList.add('active');
        btn.addEventListener('click', () => {
            appLangBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setAppLanguage(btn.dataset.lang);
        });
    });

    // Recipe Language Logic
    const recipeLangBtns = document.querySelectorAll('.recipe-lang-btn');
    recipeLangBtns.forEach(btn => btn.classList.remove('active'));
    recipeLangBtns.forEach(btn => {
        if (btn.dataset.lang === recipeLang) btn.classList.add('active');
        btn.addEventListener('click', () => {
            recipeLangBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setRecipeLanguage(btn.dataset.lang);
        });
    });

}

function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    
    const actualThemeBtns = document.querySelectorAll('.theme-btn[data-theme]');
    actualThemeBtns.forEach(btn => {
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


