// ============================================
// SILA ANTI-FORWARD - Delete forwarded messages
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

// Store anti-forward settings for each group
const antiForwardSettings = new Map();
const antiForwardWarnings = new Map();

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
    return path.join(ROOT_DIR, 'silamd', 'database', 'antiforward.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antiforward_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiForwardSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', warnLimit: 3 };
        }
    } catch (error) {}
    return antiForwardSettings.get(groupId) || { enabled: false, action: 'delete', warnLimit: 3 };
}

export async function saveAntiForwardSettings(groupId, settings) {
    antiForwardSettings.set(groupId, settings);
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
export async function addAntiForwardWarn(groupId, userId) {
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

export async function resetAntiForwardWarns(groupId, userId) {
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

// ============ CHECK IF MESSAGE IS FORWARDED ============
function isForwardedMessage(msg) {
    if (!msg?.message) return false;
    
    const message = msg.message;
    
    // Check for forwarded flag in different message types
    const isForwarded = 
        message.extendedTextMessage?.contextInfo?.isForwarded ||
        message.imageMessage?.contextInfo?.isForwarded ||
        message.videoMessage?.contextInfo?.isForwarded ||
        message.audioMessage?.contextInfo?.isForwarded ||
        message.documentMessage?.contextInfo?.isForwarded ||
        message.stickerMessage?.contextInfo?.isForwarded ||
        message.conversation?.includes('forwarded') ||
        false;
    
    return isForwarded;
}

// ============ MAIN HANDLER ============
export async function handleAntiForward(sock, msg, chatId, senderJid, botName, botFont) {
    try {
        // Only work in groups
        if (!chatId.endsWith('@g.us')) return false;
        
        // Get settings
        const settings = await getAntiForwardSettings(chatId);
        if (!settings.enabled) return false;
        
        // Check if message is forwarded
        const isForwarded = isForwardedMessage(msg);
        if (!isForwarded) return false;
        
        // Check if sender is admin or owner (they can bypass)
        const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (isSenderAdmin.isSenderAdmin || isOwner) return false;
        
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        const senderNumber = senderJid.split('@')[0];
        
        console.log(`↪️ AntiForward: Forwarded message detected from ${senderNumber} in ${chatId}`);
        
        // Delete the forwarded message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {
            console.error('Failed to delete forwarded message:', e);
        }
        
        let responseText = `*╭┈┈┄⊰ ${styledName} - ANTI FORWARD ⊱┄┄┄◈*\n\n`;
        responseText += `*┋ •> 👻 @${senderNumber} forwarded a message!*\n`;
        responseText += `*┋ •> 📝 Forwarded messages are NOT allowed here!*\n`;
        responseText += `*┋ •> 🔒 Message has been deleted!*\n`;
        
        // Handle different actions
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                responseText += `*┋*\n*┋ •> 🚫 @${senderNumber} has been REMOVED for forwarding messages!*\n`;
                
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
            const warnCount = await addAntiForwardWarn(chatId, senderJid);
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
                await resetAntiForwardWarns(chatId, senderJid);
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                    await sock.sendMessage(chatId, {
                        text: `*╭┈┈┄⊰ ${styledName} - ANTI FORWARD ⊱┄┄┄◈*\n\n*┋ •> 🚨 @${senderNumber} has been KICKED for ${maxWarns} forwarding warnings!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
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
        console.error('AntiForward error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiForwardCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const currentSettings = await getAntiForwardSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        const statusText = currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED';
        const actionText = currentSettings.action === 'kick' ? '🚫 Kick' : 
                          (currentSettings.action === 'warn' ? '⚠️ Warn' : '📵 Delete');
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-FORWARD ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${statusText}\n*┋ •> ⚡ Action:* ${actionText}\n*┋ •> 📛 Warn Limit:* ${currentSettings.warnLimit || 3}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antiforward on/off\n*┋ •> ${prefix}antiforward action delete/warn/kick\n*┋ •> ${prefix}antiforward warnlimit <number>\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiForwardSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-FORWARD ⊱┄┄┄◈*\n\n*┋ •> 👻 Anti-forward has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } 
    else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiForwardSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-FORWARD ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-forward has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antiforward action delete/warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiForwardSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-FORWARD ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
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
        await saveAntiForwardSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-FORWARD ⊱┄┄┄◈*\n\n*┋ •> 📛 Warn limit set to:* *${newLimit}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antiforward <on/off/action/warnlimit>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiForwardSettings,
    saveAntiForwardSettings,
    addAntiForwardWarn,
    resetAntiForwardWarns,
    isForwardedMessage,
    handleAntiForward,
    handleAntiForwardCommand
};
