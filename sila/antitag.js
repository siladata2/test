// ============================================
// SILA ANTI-TAG - Block excessive tagging
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

const antiTagSettings = new Map();

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antitag.json');
}

export async function getAntiTagSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', limit: 10 };
        }
    } catch (error) {}
    return antiTagSettings.get(groupId) || { enabled: false, action: 'delete', limit: 10 };
}

export async function saveAntiTagSettings(groupId, settings) {
    antiTagSettings.set(groupId, settings);
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

function getTagCount(text, mentions) {
    let count = 0;
    if (mentions) count += mentions.length;
    if (text) {
        const tagMatches = text.match(/@[0-9]+/g);
        if (tagMatches) count += tagMatches.length;
    }
    return count;
}

export async function handleAntiTag(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiTagSettings(chatId);
    if (!settings.enabled) return false;
    
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const tagCount = getTagCount(text, mentions);
    
    if (tagCount < settings.limit) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') return true;
    
    if (action === 'warn') {
        await sock.sendMessage(chatId, {
            text: `╭┈┈┄⊰ ${styledName} - ANTI TAG ⊱┄┄┄◈\n┋\n┋ •> 🏷️ @${senderJid.split('@')[0]} Too many tags!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
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

export async function handleAntiTagCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const settings = await getAntiTagSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI TAG ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋ •> Limit: ${settings.limit} tags\n┋\n┋ •> Commands:\n┋ •> ${prefix}antitag on/off\n┋ •> ${prefix}antitag action silent/delete/warn/kick\n┋ •> ${prefix}antitag limit 10\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiTagSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Tag ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiTagSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Tag DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiTagSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        }
    } else if (action === 'limit') {
        const limit = parseInt(args[1]);
        if (limit > 0 && limit < 50) {
            settings.limit = limit;
            await saveAntiTagSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `📊 Tag limit set to: ${limit}` }, { quoted: msg });
        }
    }
}

export default { handleAntiTag, handleAntiTagCommand };