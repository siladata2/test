// ============================================
// SILA ANTI-SPAM - Prevent message spam
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

const antiSpamSettings = new Map();
const userMessages = new Map();

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antispam.json');
}

export async function getAntiSpamSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', limit: 5, interval: 5000 };
        }
    } catch (error) {}
    return antiSpamSettings.get(groupId) || { enabled: false, action: 'delete', limit: 5, interval: 5000 };
}

export async function saveAntiSpamSettings(groupId, settings) {
    antiSpamSettings.set(groupId, settings);
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

function isSpamming(userId, limit = 5, interval = 5000) {
    const now = Date.now();
    const userData = userMessages.get(userId) || { messages: [], lastWarn: 0 };
    userData.messages = userData.messages.filter(t => now - t < interval);
    userData.messages.push(now);
    userMessages.set(userId, userData);
    return userData.messages.length > limit;
}

export async function handleAntiSpam(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiSpamSettings(chatId);
    if (!settings.enabled) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    if (isSpamming(senderJid, settings.limit, settings.interval)) {
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        
        await sock.sendMessage(chatId, { delete: msg.key });
        
        if (action === 'silent') return true;
        
        if (action === 'warn') {
            await sock.sendMessage(chatId, {
                text: `╭┈┈┄⊰ ${styledName} - ANTI SPAM ⊱┄┄┄◈\n┋\n┋ •> 🛑 @${senderJid.split('@')[0]} Don't spam!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
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
    return false;
}

export async function handleAntiSpamCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const settings = await getAntiSpamSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI SPAM ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋ •> Limit: ${settings.limit} msgs/${settings.interval/1000}s\n┋\n┋ •> Commands:\n┋ •> ${prefix}antispam on/off\n┋ •> ${prefix}antispam action silent/delete/warn/kick\n┋ •> ${prefix}antispam limit 5\n┋ •> ${prefix}antispam interval 5\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiSpamSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Spam ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiSpamSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Spam DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiSpamSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        }
    } else if (action === 'limit') {
        const limit = parseInt(args[1]);
        if (limit > 0 && limit < 20) {
            settings.limit = limit;
            await saveAntiSpamSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `📊 Spam limit set to: ${limit} messages` }, { quoted: msg });
        }
    } else if (action === 'interval') {
        const interval = parseInt(args[1]);
        if (interval > 0 && interval < 60) {
            settings.interval = interval * 1000;
            await saveAntiSpamSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⏱️ Interval set to: ${interval} seconds` }, { quoted: msg });
        }
    }
}

export default { handleAntiSpam, handleAntiSpamCommand };