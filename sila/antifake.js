// ============================================
// SILA ANTI-FAKE - Block fake/suspicious accounts
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

const antiFakeSettings = new Map();
const antiFakeWarnings = new Map();

// Suspicious patterns for fake accounts
const SUSPICIOUS_PATTERNS = [
    /^[0-9]{5,}$/, // Numbers only
    /^[A-Za-z0-9]{15,}$/, // Long random string
    /^(bot|fake|spam|scam|hack)/i,
    /[_\-~`!@#$%^&*()]{3,}/ // Many special chars
];

function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antifake.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antifake_warns.json');
}

export async function getAntiFakeSettings(groupId) {
    try {
        if (fs.existsSync(getSettingsFile())) {
            const data = JSON.parse(fs.readFileSync(getSettingsFile(), 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', warnLimit: 3 };
        }
    } catch (error) {}
    return antiFakeSettings.get(groupId) || { enabled: false, action: 'delete', warnLimit: 3 };
}

export async function saveAntiFakeSettings(groupId, settings) {
    antiFakeSettings.set(groupId, settings);
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

function isSuspiciousName(name) {
    if (!name) return false;
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(name)) return true;
    }
    return false;
}

export async function handleAntiFake(sock, msg, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) return false;
    
    const settings = await getAntiFakeSettings(chatId);
    if (!settings.enabled) return false;
    
    // Get sender name
    let senderName = '';
    try {
        const contact = await sock.onWhatsApp(senderJid);
        if (contact && contact[0]?.name) {
            senderName = contact[0].name;
        } else {
            senderName = senderJid.split('@')[0];
        }
    } catch {
        senderName = senderJid.split('@')[0];
    }
    
    if (!isSuspiciousName(senderName)) return false;
    
    const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isSenderAdmin.isSenderAdmin || isOwner) return false;
    
    const action = settings.action || 'delete';
    const styledName = applyFont(botName, botFont);
    
    await sock.sendMessage(chatId, { delete: msg.key });
    
    if (action === 'silent') return true;
    
    if (action === 'warn') {
        const warnCount = await addWarn(chatId, senderJid);
        const maxWarns = settings.warnLimit || 3;
        
        await sock.sendMessage(chatId, {
            text: `*╭┈┈┄⊰ ${styledName} - ANTI FAKE ⊱┄┄┄◈*
*┋*
*┋ •> 🤥 suspicious account detected!*
*┋ •> 👤 @${senderJid.split('@')[0]}*
*┋ •> 📛 warning #${warnCount}/${maxWarns}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        });
        
        if (warnCount >= maxWarns) {
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
                text: `*╭┈┈┄⊰ ${styledName} - ANTI FAKE ⊱┄┄┄◈*
*┋*
*┋ •> 🚫 @${senderJid.split('@')[0]} kicked for suspicious account*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`,
                contextInfo: { mentionedJid: [senderJid] }
            });
        }
    }
    return true;
}

export async function handleAntiFakeCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ groups only!' }, { quoted: msg });
        return;
    }
    
    const adminStatus = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    if (!adminStatus.isSenderAdmin && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ admins only!' }, { quoted: msg });
        return;
    }
    
    const settings = await getAntiFakeSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { text: `*╭┈┈┄⊰ ${styledName} - ANTI FAKE ⊱┄┄┄◈*
*┋*
*┋ •> status: ${settings.enabled ? '✅ ON' : '❌ OFF'}*
*┋ •> action: ${settings.action || 'delete'}*
*┋ •> warn limit: ${settings.warnLimit || 3}*
*┋*
*┋ •> commands:*
*┋ •> ${prefix}antifake on/off*
*┋ •> ${prefix}antifake action silent/delete/warn/kick*
*┋ •> ${prefix}antifake warnlimit <number>*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}` }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        settings.enabled = true;
        await saveAntiFakeSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `✅ anti-fake enabled` }, { quoted: msg });
    } else if (action === 'off') {
        settings.enabled = false;
        await saveAntiFakeSettings(chatId, settings);
        await sock.sendMessage(chatId, { text: `❌ anti-fake disabled` }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (['silent', 'delete', 'warn', 'kick'].includes(newAction)) {
            settings.action = newAction;
            await saveAntiFakeSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `⚡ action set to: ${newAction}` }, { quoted: msg });
        }
    } else if (action === 'warnlimit') {
        const limit = parseInt(args[1]);
        if (limit > 0 && limit < 11) {
            settings.warnLimit = limit;
            await saveAntiFakeSettings(chatId, settings);
            await sock.sendMessage(chatId, { text: `📊 warn limit set to: ${limit}` }, { quoted: msg });
        }
    }
}

export default { handleAntiFake, handleAntiFakeCommand };
