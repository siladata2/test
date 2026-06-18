// ============================================
// SILA ANTI-BUG - Block bug/crash messages
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAdmin } from './isAdmin.js';
import { isOwnerOrSudo } from './isOwner.js';
import { applyFont } from './fonts/index.js';
import { getFooter } from '../silaconfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const antiBugSettings = new Map();

const BUG_PATTERNS = [
    /<|>|\/|\\|\*|%|\$|#|@|!|\^|&|\(|\)/g,
    /[\u200b-\u200f\u2028-\u202f]/g,
    /[\\'"]/g, /\\u[0-9a-fA-F]{4}/g, /%[0-9a-fA-F]{2}/g
];

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antibug.json');
}

export async function getAntiBugSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete' };
        }
    } catch (error) {}
    return antiBugSettings.get(groupId) || { enabled: false, action: 'delete' };
}

export async function saveAntiBugSettings(groupId, settings) {
    antiBugSettings.set(groupId, settings);
    try {
        let data = {};
        if (fs.existsSync(getSettingsFile())) {
            data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
        }
        data[groupId] = settings;
        fs.writeFileSync(getSettingsFile(), JSON.stringify(data, null, 2));
        return true;
    } catch (error) { return false; }
}

function isBug(text) {
    if (!text) return false;
    let dangerous = 0;
    for (const pattern of BUG_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) dangerous += matches.length;
    }
    return dangerous > 10;
}

export async function handleAntiBug(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiBugSettings(chatId);
    if (!settings.enabled) return false;
    
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!isBug(text)) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') return true;
    
    if (action === 'warn') {
        await sock.sendMessage(chatId, {
            text: `╭┈┈┄⊰ ${styledName} - ANTI BUG ⊱┄┄┄◈\n┋\n┋ •> 🐛 @${senderJid.split('@')[0]} Bug detected!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        });
    }
    
    if (action === 'kick') {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isBotAdmin) {
            await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
        }
    }
    return true;
}

export async function handleAntiBugCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ Groups only!' }, { quoted: msg });
        return;
    }
    
    const adminStatus = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (!adminStatus.isSenderAdmin && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ Admins only!' }, { quoted: msg });
        return;
    }
    
    const settings = await getAntiBugSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI BUG ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋\n┋ •> Commands:\n┋ •> ${prefix}antibug on/off\n┋ •> ${prefix}antibug action silent/delete/warn/kick\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiBugSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Bug ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiBugSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Bug DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiBugSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        }
    }
}

export default { handleAntiBug, handleAntiBugCommand };