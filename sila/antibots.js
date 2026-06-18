// ============================================
// SILA ANTI-BOT - Block bot accounts
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

const antiBotSettings = new Map();
const antiBotWarnings = new Map();

const BOT_PATTERNS = [
    /bot/i, /whatsapp.*bot/i, /auto.*reply/i, /self.*bot/i,
    /md/i, /multi.*device/i, /whatsapp.*api/i
];

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antibots.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antibots_warns.json');
}

export async function getAntiBotSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete' };
        }
    } catch (error) {}
    return antiBotSettings.get(groupId) || { enabled: false, action: 'delete' };
}

export async function saveAntiBotSettings(groupId, settings) {
    antiBotSettings.set(groupId, settings);
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

function isBot(text) {
    if (!text) return false;
    for (const pattern of BOT_PATTERNS) {
        if (pattern.test(text)) return true;
    }
    return false;
}

export async function handleAntiBot(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiBotSettings(chatId);
    if (!settings.enabled) return false;
    
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!isBot(text)) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') {
        return true;
    }
    
    if (action === 'warn') {
        const warnCount = await addWarn(chatId, senderJid);
        await sock.sendMessage(chatId, {
            text: `╭┈┈┄⊰ ${styledName} - ANTI BOT ⊱┄┄┄◈\n┋\n┋ •> 🤖 Bot detected! Warning #${warnCount}/3\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        });
        if (warnCount >= 3) {
            await resetWarn(chatId, senderJid);
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
            }
        }
    }
    
    if (action === 'kick') {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isBotAdmin) {
            await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
            await sock.sendMessage(chatId, {
                text: `╭┈┈┄⊰ ${styledName} - ANTI BOT ⊱┄┄┄◈\n┋\n┋ •> 🤖 Bot kicked! @${senderJid.split('@')[0]}\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
                contextInfo: { mentionedJid: [senderJid] }
            });
        }
    }
    return true;
}

export async function handleAntiBotCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const settings = await getAntiBotSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI BOT ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋\n┋ •> Commands:\n┋ •> ${prefix}antibots on/off\n┋ •> ${prefix}antibots action silent/delete/warn/kick\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiBotSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Bot ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiBotSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Bot DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiBotSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: `❌ Invalid action! Use: silent/delete/warn/kick` }, { quoted: msg });
        }
    }
}

export default { handleAntiBot, handleAntiBotCommand };