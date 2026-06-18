// ============================================
// AUTO REPLY MODULE
// Automatically reply to messages
// Powered by SILA TECH
// ============================================

import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let autoReplyConfig = {
    enabled: false,
    defaultText: 'Bot is currently busy. Please try again later.',
    keywords: {}
};

const CONFIG_FILE = './silamd/database/auto_reply_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoReplyConfig = { ...autoReplyConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(autoReplyConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export async function handleAutoReply(sock, message, chatId, text, prefix) {
    if (!autoReplyConfig.enabled) return false;
    
    const lowerText = text.toLowerCase();
    const keywords = autoReplyConfig.keywords || {};
    
    for (const [keyword, reply] of Object.entries(keywords)) {
        if (lowerText.includes(keyword.toLowerCase())) {
            await sock.sendMessage(chatId, { text: reply }, { quoted: message });
            return true;
        }
    }
    
    if (!text.startsWith(prefix) && !text.startsWith('.') && !text.startsWith('!') && !text.startsWith('/')) {
        await sock.sendMessage(chatId, { text: autoReplyConfig.defaultText }, { quoted: message });
        return true;
    }
    
    return false;
}

export async function handleAutoReplyCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = autoReplyConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 AUTO REPLY 〕━━┈⊷
┃
┃ Status: ${status}
┃ Default Text: ${autoReplyConfig.defaultText}
┃
┃ Usage:
┃ ${prefix}autoreply on - Enable
┃ ${prefix}autoreply off - Disable
┃ ${prefix}autoreply text <message> - Set default reply
┃ ${prefix}autoreply add <keyword>|<reply> - Add keyword reply
┃ ${prefix}autoreply remove <keyword> - Remove keyword
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        autoReplyConfig.enabled = true;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto reply has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        autoReplyConfig.enabled = false;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto reply has been disabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'text' && args.length > 1) {
        const text = args.slice(1).join(' ');
        autoReplyConfig.defaultText = text;
        saveConfig();
        await sock.sendMessage(chatId, { text: `Default reply text updated: ${text}` }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'add' && args.length > 1) {
        const parts = args.slice(1).join(' ').split('|');
        if (parts.length === 2) {
            autoReplyConfig.keywords[parts[0].toLowerCase()] = parts[1];
            saveConfig();
            await sock.sendMessage(chatId, { text: `Added keyword reply: "${parts[0]}" -> "${parts[1]}"` }, { quoted: msg });
        }
    } else if (args[0].toLowerCase() === 'remove' && args.length > 1) {
        const keyword = args[1].toLowerCase();
        if (autoReplyConfig.keywords[keyword]) {
            delete autoReplyConfig.keywords[keyword];
            saveConfig();
            await sock.sendMessage(chatId, { text: `Removed keyword: "${keyword}"` }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on, off, text, add, or remove' }, { quoted: msg });
    }
}

export default { 
    name: 'autoreply',
    description: 'toggle auto reply',
    category: 'automation',
    alias: ['replyauto', 'autoreplymsg'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAutoReplyCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
