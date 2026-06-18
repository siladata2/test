// ============================================
// SILA ANTI-BUN - Block everything (ultimate protection)
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

const antiBunSettings = new Map();
const antiBunWarnings = new Map();

const BUN_PATTERNS = [
    /ٱ/g, /۞/g, /۩/g, /ۜ/g, /۝/g, /۞/g, /۟/g, /۠/g, /ۡ/g,
    /[\\'"]/g, /\\u[0-9a-fA-F]{4}/g, /%[0-9a-fA-F]{2}/g,
    /[\u200b-\u200f\u2028-\u202f\u2060-\u206f]/g,
    /[<>\\/`~!@#$%^&*()_+=\[\]{};:'",.?]/g
];

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antibun.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antibun_warns.json');
}

export async function getAntiBunSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete' };
        }
    } catch (error) {}
    return antiBunSettings.get(groupId) || { enabled: false, action: 'delete' };
}

export async function saveAntiBunSettings(groupId, settings) {
    antiBunSettings.set(groupId, settings);
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

async function addWarn(groupId, userId) {
    const key = `${groupId}|${userId}`;
    let warns = {};
    try {
        if (fs.existsSync(getWarningsFile())) {
            warns = JSON.parse(fs.readFileSync(getWarningsFile(), 'utf8'));
        }
    } catch (error) {}
    warns[key] = (warns[key] || 0) + 1;
    fs.writeFileSync(getWarningsFile(), JSON.stringify(warns, null, 2));
    return warns[key];
}

async function resetWarn(groupId, userId) {
    const key = `${groupId}|${userId}`;
    let warns = {};
    try {
        if (fs.existsSync(getWarningsFile())) {
            warns = JSON.parse(fs.readFileSync(getWarningsFile(), 'utf8'));
        }
    } catch (error) {}
    delete warns[key];
    fs.writeFileSync(getWarningsFile(), JSON.stringify(warns, null, 2));
}

function isBun(text) {
    if (!text) return false;
    let dangerous = 0;
    for (const pattern of BUN_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) dangerous += matches.length;
    }
    return dangerous > 5;
}

export async function handleAntiBun(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiBunSettings(chatId);
    if (!settings.enabled) return false;
    
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!isBun(text)) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') return true;
    
    if (action === 'warn') {
        const warnCount = await addWarn(chatId, senderJid);
        await sock.sendMessage(chatId, {
            text: `╭┈┈┄⊰ ${styledName} - ANTI BUN ⊱┄┄┄◈\n┋\n┋ •> 🔫 @${senderJid.split('@')[0]} Warning #${warnCount}/3\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        });
        if (warnCount >= 3) {
            await resetWarn(chatId, senderJid);
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                await sock.sendMessage(chatId, {
                    text: `╭┈┈┄⊰ ${styledName} - ANTI BUN ⊱┄┄┄◈\n┋\n┋ •> 🔫 @${senderJid.split('@')[0]} Kicked!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
                    contextInfo: { mentionedJid: [senderJid] }
                });
            }
        }
    }
    
    if (action === 'kick') {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isBotAdmin) {
            await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
            await sock.sendMessage(chatId, {
                text: `╭┈┈┄⊰ ${styledName} - ANTI BUN ⊱┄┄┄◈\n┋\n┋ •> 🔫 @${senderJid.split('@')[0]} Kicked!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
                contextInfo: { mentionedJid: [senderJid] }
            });
        }
    }
    return true;
}

export async function handleAntiBunCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const settings = await getAntiBunSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI BUN ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋\n┋ •> Commands:\n┋ •> ${prefix}antibun on/off\n┋ •> ${prefix}antibun action silent/delete/warn/kick\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiBunSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Bun ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiBunSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Bun DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiBunSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        }
    }
}

export default { handleAntiBun, handleAntiBunCommand };
