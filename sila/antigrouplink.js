// ============================================
// SILA ANTI-GROUP-LINK - Delete external group links
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

// Store anti-group-link settings for each group
const antiGroupLinkSettings = new Map();
const antiGroupLinkWarnings = new Map();

// Newsletter Configuration
const NEWSLETTER_CONFIG = {
    jid: '120363402325089913@newsletter',
    name: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
    serverMessageId: 143,
    imageUrl: 'https://i.ibb.co/XftY01RL/sila-smd.png',
    watermark: '> ® Powered by Sila Tech'
};

// ============ NEWSLETTER CONTEXT ============
const getNewsletterContext = () => ({
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_CONFIG.jid,
        newsletterName: NEWSLETTER_CONFIG.name,
        serverMessageId: NEWSLETTER_CONFIG.serverMessageId
    }
});

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antigrouplink.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antigrouplink_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiGroupLinkSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', warnLimit: 3 };
        }
    } catch (error) {}
    return antiGroupLinkSettings.get(groupId) || { enabled: false, action: 'delete', warnLimit: 3 };
}

export async function saveAntiGroupLinkSettings(groupId, settings) {
    antiGroupLinkSettings.set(groupId, settings);
    const settingsFile = getSettingsFile();
    try {
        let data = {};
        if (fs.existsSync(settingsFile)) {
            data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        }
        data[groupId] = settings;
        fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) { return false; }
}

// ============ WARNINGS MANAGEMENT ============
export async function addAntiGroupLinkWarn(groupId, userId) {
    const key = `${groupId}|${userId}`;
    const warnFile = getWarningsFile();
    let warns = {};
    try {
        if (fs.existsSync(warnFile)) {
            warns = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
        }
    } catch (error) {}
    const currentWarn = (warns[key] || 0) + 1;
    warns[key] = currentWarn;
    fs.writeFileSync(warnFile, JSON.stringify(warns, null, 2));
    return currentWarn;
}

export async function resetAntiGroupLinkWarns(groupId, userId) {
    const key = `${groupId}|${userId}`;
    const warnFile = getWarningsFile();
    let warns = {};
    try {
        if (fs.existsSync(warnFile)) {
            warns = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
        }
    } catch (error) {}
    delete warns[key];
    fs.writeFileSync(warnFile, JSON.stringify(warns, null, 2));
    return true;
}

// ============ GROUP LINK PATTERNS ============
const GROUP_LINK_PATTERNS = [
    /https?:\/\/(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+/gi,
    /https?:\/\/(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/gi,
    /https?:\/\/(www\.)?wa\.me\/[0-9]+/gi,
    /https?:\/\/(www\.)?api\.whatsapp\.com\/send\?phone=[0-9]+/gi,
    /https?:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+/gi
];

// Check if message contains group link
function containsGroupLink(text) {
    if (!text) return false;
    
    for (const pattern of GROUP_LINK_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            return { found: true, link: match[0] };
        }
    }
    return { found: false, link: null };
}

// ============ MAIN HANDLER ============
export async function handleAntiGroupLink(sock, msg, chatId, senderJid, botName, botFont) {
    try {
        // Only work in groups
        if (!chatId.endsWith('@g.us')) return false;
        
        // Get settings
        const settings = await getAntiGroupLinkSettings(chatId);
        if (!settings.enabled) return false;
        
        // Extract message text
        const textMsg = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       msg.message?.imageMessage?.caption || 
                       msg.message?.videoMessage?.caption || 
                       "";
        
        if (!textMsg) return false;
        
        // Check for group links
        const linkCheck = containsGroupLink(textMsg);
        if (!linkCheck.found) return false;
        
        // Check if sender is admin or owner (they can bypass)
        const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (isSenderAdmin.isSenderAdmin || isOwner) return false;
        
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        const senderNumber = senderJid.split('@')[0];
        
        console.log(`🔗 AntiGroupLink: Group link detected from ${senderNumber} in ${chatId}`);
        console.log(`   Link: ${linkCheck.link}`);
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {
            console.error('Failed to delete group link message:', e);
        }
        
        let responseText = `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n`;
        responseText += `*┋ •> 🔗 @${senderNumber} shared a group link!*\n`;
        responseText += `*┋ •> 📝 External group links are NOT allowed here!*\n`;
        responseText += `*┋ •> 🔒 Message has been deleted!*\n`;
        
        // Handle different actions
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                responseText += `*┋*\n*┋ •> 🚫 @${senderNumber} has been REMOVED for sharing group links!*\n`;
                
                await sock.sendMessage(chatId, {
                    text: responseText,
                    contextInfo: {
                        ...getNewsletterContext(),
                        mentionedJid: [senderJid]
                    }
                });
                return true;
            } else {
                responseText += `*┋*\n*┋ •> ⚠️ Make me admin to kick offenders!*\n`;
            }
        } 
        else if (action === 'warn') {
            const warnCount = await addAntiGroupLinkWarn(chatId, senderJid);
            const maxWarns = settings.warnLimit || 3;
            const remaining = maxWarns - warnCount;
            
            responseText += `*┋*\n*┋ •> 📛 Warning #${warnCount}/${maxWarns}*\n`;
            responseText += `*┋ •> ⚠️ ${remaining} more and you'll be removed!*\n`;
            
            await sock.sendMessage(chatId, {
                text: responseText,
                contextInfo: {
                    ...getNewsletterContext(),
                    mentionedJid: [senderJid]
                }
            });
            
            if (warnCount >= maxWarns) {
                await resetAntiGroupLinkWarns(chatId, senderJid);
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> 🚨 @${senderNumber} has been KICKED for ${maxWarns} group link warnings!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
                        contextInfo: {
                            ...getNewsletterContext(),
                            mentionedJid: [senderJid]
                        }
                    });
                }
            }
            return true;
        }
        else { // action === 'delete'
            await sock.sendMessage(chatId, {
                text: responseText,
                contextInfo: {
                    ...getNewsletterContext(),
                    mentionedJid: [senderJid]
                }
            });
        }
        
        return true;
    } catch (error) {
        console.error('AntiGroupLink error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiGroupLinkCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ *This command can only be used in groups!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    let isAuthorized = false;
    const isOwnerSudo = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isOwnerSudo) isAuthorized = true;
    if (!isAuthorized) {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isSenderAdmin) isAuthorized = true;
    }
    if (!isAuthorized) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only group admins and bot owner can use this command!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    const currentSettings = await getAntiGroupLinkSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        const statusText = currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED';
        const actionText = currentSettings.action === 'kick' ? '🚫 Kick' : 
                          (currentSettings.action === 'warn' ? '⚠️ Warn' : '📵 Delete');
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${statusText}\n*┋ •> ⚡ Action:* ${actionText}\n*┋ •> 📛 Warn Limit:* ${currentSettings.warnLimit || 3}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antigrouplink on/off\n*┋ •> ${prefix}antigrouplink action delete/warn/kick\n*┋ •> ${prefix}antigrouplink warnlimit <number>\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiGroupLinkSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> 🔗 Anti-group-link has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } 
    else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiGroupLinkSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-group-link has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antigrouplink action delete/warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiGroupLinkSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else if (action === 'warnlimit') {
        const newLimit = parseInt(args[1]);
        if (isNaN(newLimit) || newLimit < 1 || newLimit > 10) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid limit! Use 1-10`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.warnLimit = newLimit;
        await saveAntiGroupLinkSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI GROUP LINK ⊱┄┄┄◈*\n\n*┋ •> 📛 Warn limit set to:* *${newLimit}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antigrouplink <on/off/action/warnlimit>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiGroupLinkSettings,
    saveAntiGroupLinkSettings,
    addAntiGroupLinkWarn,
    resetAntiGroupLinkWarns,
    containsGroupLink,
    GROUP_LINK_PATTERNS,
    handleAntiGroupLink,
    handleAntiGroupLinkCommand
};
