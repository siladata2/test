// ============================================
// SILA TRANSLATE - Auto Translation System
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LANG_FILE = path.join(ROOT_DIR, 'silamd', 'database', 'language.json');

// ============ SUPPORTED LANGUAGES ============
export const SUPPORTED_LANGUAGES = {
    en: { name: 'English', flag: '🇬🇧', code: 'en' },
    sw: { name: 'Kiswahili', flag: '🇹🇿', code: 'sw' },
    es: { name: 'Español', flag: '🇪🇸', code: 'es' },
    fr: { name: 'Français', flag: '🇫🇷', code: 'fr' },
    ar: { name: 'العربية', flag: '🇸🇦', code: 'ar' },
    pt: { name: 'Português', flag: '🇵🇹', code: 'pt' },
    de: { name: 'Deutsch', flag: '🇩🇪', code: 'de' },
    it: { name: 'Italiano', flag: '🇮🇹', code: 'it' },
    ru: { name: 'Русский', flag: '🇷🇺', code: 'ru' },
    zh: { name: '中文', flag: '🇨🇳', code: 'zh' },
    hi: { name: 'हिन्दी', flag: '🇮🇳', code: 'hi' },
    ja: { name: '日本語', flag: '🇯🇵', code: 'ja' },
    ko: { name: '한국어', flag: '🇰🇷', code: 'ko' }
};

let currentLanguage = 'en';

// Load saved language
export function loadLanguage() {
    try {
        if (fs.existsSync(LANG_FILE)) {
            const data = JSON.parse(fs.readFileSync(LANG_FILE, 'utf8'));
            currentLanguage = data.language || 'en';
        }
    } catch (e) {}
    return currentLanguage;
}

// Save language
export function saveLanguage(lang) {
    try {
        const dir = path.dirname(LANG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LANG_FILE, JSON.stringify({ language: lang, updatedAt: new Date().toISOString() }, null, 2));
        currentLanguage = lang;
        return true;
    } catch (e) { return false; }
}

// Translate text using Google Translate API
export async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    
    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        return text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

// Translate message automatically based on bot language
export async function autoTranslate(text, forceLang = null) {
    const targetLang = forceLang || currentLanguage;
    if (targetLang === 'en') return text;
    return await translateText(text, targetLang);
}

// Get supported languages list
export function getLanguages() {
    return SUPPORTED_LANGUAGES;
}

// Get current language info
export function getCurrentLanguage() {
    return {
        code: currentLanguage,
        name: SUPPORTED_LANGUAGES[currentLanguage]?.name || 'English',
        flag: SUPPORTED_LANGUAGES[currentLanguage]?.flag || '🇬🇧'
    };
}

// Set language
export async function setLanguage(langCode) {
    if (!SUPPORTED_LANGUAGES[langCode]) {
        return false;
    }
    
    saveLanguage(langCode);
    return true;
}

// Translate a whole message
export async function translateMessage(message) {
    const targetLang = currentLanguage;
    if (targetLang === 'en') return message;
    return await translateText(message, targetLang);
}

// Load language on module load
loadLanguage();

export default {
    SUPPORTED_LANGUAGES,
    loadLanguage,
    saveLanguage,
    translateText,
    autoTranslate,
    getLanguages,
    getCurrentLanguage,
    setLanguage,
    translateMessage,
    currentLanguage
};
