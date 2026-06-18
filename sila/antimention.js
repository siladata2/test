// ============================================
// SILA ANTI-MENTION - Block excessive mentions
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

const antiMentionSettings = new Map();

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antimention.json');
}

export async function getAntiMentionSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', limit: 5 };
        }
    } catch (error) {}
    return antiMentionSettings.get(groupId) || { enabled: false, action: 'delete', limit: 5 };
}

export async function saveAntiMentionSettings(groupId, settings) {
    antiMentionSettings.set(groupId, settings);
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

export async function handleAntiMention(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiMentionSettings(chatId);
    if (!settings.enabled) return false;
    
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length < settings.limit) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') return true;
    
    if (action === 'warn') {
        await sock.sendMessage(chatId, {
            text: `╭┈┈┄⊰ ${styledName} - ANTI MENTION ⊱┄┄┄◈\n┋\n┋ •> 📢 @${senderJid.split('@')[0]} Too many mentions!\n┋\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}`,
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

export async function handleAntiMentionCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const settings = await getAntiMentionSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `╭┈┈┄⊰ ${styledName} - ANTI MENTION ⊱┄┄┄◈\n┋\n┋ •> Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n┋ •> Action: ${settings.action || 'delete'}\n┋ •> Limit: ${settings.limit} mentions\n┋\n┋ •> Commands:\n┋ •> ${prefix}antimention on/off\n┋ •> ${prefix}antimention action silent/delete/warn/kick\n┋ •> ${prefix}antimention limit 5\n╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiMentionSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ Anti-Mention ENABLED` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiMentionSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ Anti-Mention DISABLED` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiMentionSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ Action set to: ${newAction}` }, { quoted: msg });
        }
    } else if (action === 'limit') {
        const limit = parseInt(args[1]);
        if (limit > 0 && limit < 30) {
            settings.limit = limit;
            await saveAntiMentionSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `📊 Mention limit set to: ${limit}` }, { quoted: msg });
        }
    }
}

export default { handleAntiMention, handleAntiMentionCommand };