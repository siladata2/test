// ============================================
// SILA CONFIG - Bot Configuration
// Powered by SILA TECH
// ============================================

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'silamd', 'database', 'config.json');

// ============ DEFAULT CONFIGURATION ============
const defaultConfig = {
    // Bot Identity
    BOT_NAME: 'CIPHER MD',
    BOT_VERSION: '2.0.0',
    BOT_PREFIX: '.',

    // Font Style (normal, bold, italic, monospace, cursive, doubleStruck)
    BOT_FONT: 'italic',

    // Footer Text
    FOOTER_TEXT: '© 𝚂𝙸𝙻𝙰',
    POWERED_BY: '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',

    // Newsletter
    NEWSLETTER_JID: '120363426725658598@newsletter',
    NEWSLETTER_NAME: '© 𝙲𝙸𝙿𝙷𝙴𝚁',

    // Media
    BOT_AVATAR_URL: 'https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg',
    BOT_THUMBNAIL_URL: 'https://i.ibb.co/BKZGzcbr/Sila-cipher.jpg',

    // Groups
    GROUP_LINK: 'https://chat.whatsapp.com/IS276Wg9zcuCnJRiMDI64g',
    GROUP_NAME: '𝚂𝙸𝙻𝙰',
    GROUP_INVITE_CODE: 'IS276Wg9zcuCnJRiMDI64g',

    // Owner - Only phone number (no JID)
    OWNER_NUMBER: '255639201896',     // Replace with your actual phone number

    // Features
    AUTO_JOIN_ENABLED: true,
    AUTO_VIEW_STATUS: true,
    AUTO_REACT_STATUS: true,
    RATE_LIMIT_ENABLED: true,
    AUTO_CONNECT_ON_LINK: true,
    AUTO_CONNECT_ON_START: true,
    SEND_WELCOME_MESSAGE: true,

    // Timeout Settings
    MIN_COMMAND_DELAY: 1000,
    STICKER_DELAY: 2000,
    CONNECTION_TIMEOUT: 40000,
    KEEP_ALIVE_INTERVAL: 15000,

    // Max retry attempts
    MAX_RETRY_ATTEMPTS: 10,

    // Directories
    SESSION_DIR: './silamd/sessions',
    DATABASE_DIR: './silamd/database',
    CACHE_DIR: './silamd/cache',
    COMMANDS_DIR: './silatech',
    FONTS_DIR: './sila/fonts',

    // Deployment
    DEPLOY_MODE: process.env.DEPLOY_MODE || '2',
    SESSION_ID: process.env.SESSION_ID || '',
};

// ============ CONFIG INSTANCE ============
let config = { ...defaultConfig };

// ============ LOAD CONFIG FROM DATABASE ============
function loadConfigFromDatabase() {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(CONFIG_FILE)) {
            const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            config = { ...defaultConfig, ...savedConfig };
            console.log('✅ Config loaded from database');
        } else {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            config = { ...defaultConfig };
            console.log('✅ Default config created');
        }
    } catch (error) {
        console.error('Error loading config:', error.message);
        config = { ...defaultConfig };
    }
    return config;
}

// ============ SAVE CONFIG TO DATABASE ============
function saveConfigToDatabase() {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error.message);
        return false;
    }
}

// Load config on module load
loadConfigFromDatabase();

// ============ CONFIG UPDATE FUNCTION ============
export function updateConfig(key, value) {
    if (config.hasOwnProperty(key)) {
        const oldValue = config[key];
        config[key] = value;

        if (process.env[key] !== undefined) {
            process.env[key] = value;
        }

        saveConfigToDatabase();

        return { success: true, key, oldValue, newValue: value };
    }
    return { success: false, error: `Config key '${key}' not found` };
}

export function getConfig() {
    return { ...config };
}

export function getConfigValue(key) {
    return config[key] !== undefined ? config[key] : null;
}

export function reloadConfig() {
    return loadConfigFromDatabase();
}

// ============ MESSAGE FUNCTIONS ============
export const getOwnerOnlyMessage = () => {
    const messages = [
        'only the bot owner can use this command.',
        'this command is reserved for the owner.',
        'you don\'t have permission to execute this command.',
        'only the one who created me can use this.',
        'access denied. owner only command.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

export const getAdminOnlyMessage = () => {
    const messages = [
        'only group admins can use this command.',
        'this action requires admin privileges.',
        'you need to be a group admin to execute this.',
        'admin status required for this operation.',
        'only group moderators can use this command.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

export const getBotAdminRequiredMessage = () => {
    const messages = [
        'i need to be an admin to do that.',
        'please make me an admin first.',
        'i don\'t have admin privileges here.',
        'cannot perform this action without admin rights.',
        'make me admin and try again.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

export const getAntiMediaMessage = (type) => {
    const messages = {
        image: 'images are not allowed here.',
        video: 'videos are not allowed here.',
        audio: 'audio files are not allowed here.',
        document: 'documents are not allowed here.',
        sticker: 'stickers are not allowed here.',
        text: 'text messages are not allowed here.',
        emoji: 'emojis are not allowed here.'
    };
    return messages[type] || 'this type of media is not allowed here.';
};

export const getSuccessMessage = () => {
    const messages = [
        'command executed successfully.',
        'operation completed successfully.',
        'done! your request has been processed.',
        'success! operation completed without errors.',
        'task completed successfully.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

export const getErrorMessage = () => {
    const messages = [
        'an error occurred while processing your request.',
        'command execution failed. please try again later.',
        'something went wrong. technical team notified.',
        'unable to complete the operation at this time.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

// ============ CONTACT KEY FOR MESSAGES ============
export const fkontak = {
    "key": {
        "participant": '0@s.whatsapp.net',
        "remoteJid": '0@s.whatsapp.net',
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "conversation": "SILA"
    }
};

// ============ GET CONTEXT INFO ============
export const getContextInfo = (m, botName = config.BOT_NAME) => {
    return {
        mentionedJid: m && m.sender ? [m.sender] : [],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID,
            newsletterName: config.NEWSLETTER_NAME,
            serverMessageId: 143,
        },
    };
};

// ============ GET FOOTER ============
export const getFooter = () => {
    return `> ® ${config.POWERED_BY}`;
};

// ============ CHECK IF OWNER (USING PHONE NUMBER ONLY) ============
export function isOwnerNumber(number) {
    const cleanNumber = number.toString().replace(/[^0-9]/g, '');
    const ownerClean = config.OWNER_NUMBER.toString().replace(/[^0-9]/g, '');
    return cleanNumber === ownerClean;
}

// ============ STYLED MESSAGE SENDER (PLACEHOLDER, WILL BE OVERRIDDEN) ============
export async function sendStyledMessage(sock, chatId, text, options = {}) {
    // This will be replaced by the main bot's implementation
    return await sock.sendMessage(chatId, { text }, options);
}

export default config;