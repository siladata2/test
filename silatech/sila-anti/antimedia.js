// ============================================
// ANTI-MEDIA COMMANDS - Block all media types
// These are wrapper commands - actual logic is in sila/antimedia.js
// Powered by SILA TECH
// ============================================

import { handleAntiMediaCommand } from '../../sila/antimedia.js';

function getIds(msg) {
    return {
        chatId: msg.key.remoteJid,
        senderJid: msg.key.participant || msg.key.remoteJid
    };
}

// ==================== MAIN ANTIMEDIA COMMAND ====================
export const antimedia = {
    name: 'antimedia',
    description: 'block all media types (image, video, audio, document, sticker, text, emoji)',
    category: 'sila-anti',
    alias: ['antimedia', 'mediafilter', 'blockmedia'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        await handleAntiMediaCommand(sock, msg, args, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-IMAGE COMMAND ====================
export const antiimage = {
    name: 'antiimage',
    description: 'block images only',
    category: 'sila-anti',
    alias: ['antiimage', 'imgblock', 'noimage'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['image', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-VIDEO COMMAND ====================
export const antivideo = {
    name: 'antivideo',
    description: 'block videos only',
    category: 'sila-anti',
    alias: ['antivideo', 'videoblock', 'novideo'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['video', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-AUDIO COMMAND ====================
export const antiaudio = {
    name: 'antiaudio',
    description: 'block audio files only',
    category: 'sila-anti',
    alias: ['antiaudio', 'audioblock', 'noaudio'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['audio', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-DOCUMENT COMMAND ====================
export const antidocument = {
    name: 'antidocument',
    description: 'block documents only',
    category: 'sila-anti',
    alias: ['antidoc', 'documentblock', 'nodoc'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['document', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-STICKER COMMAND ====================
export const antisticker = {
    name: 'antisticker',
    description: 'block stickers only',
    category: 'sila-anti',
    alias: ['antisticker', 'stickerblock', 'nosticker'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['sticker', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-TEXT COMMAND ====================
export const antitext = {
    name: 'antitext',
    description: 'block text messages only',
    category: 'sila-anti',
    alias: ['antitext', 'textblock', 'notext'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['text', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== ANTI-EMOJI COMMAND ====================
export const antiemoji = {
    name: 'antiemoji',
    description: 'block emoji messages only',
    category: 'sila-anti',
    alias: ['antiemoji', 'emojiblock', 'noemoji'],
    
    async execute(sock, msg, args, prefix, config) {
        const { chatId, senderJid } = getIds(msg);
        const fakeArgs = ['emoji', ...args];
        await handleAntiMediaCommand(sock, msg, fakeArgs, prefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
    }
};

// ==================== EXPORT ALL ====================
export default [
    antimedia,
    antiimage,
    antivideo,
    antiaudio,
    antidocument,
    antisticker,
    antitext,
    antiemoji
];
