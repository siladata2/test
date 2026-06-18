// ============================================
// SILA ANTI-MEDIA - Media Blocking System
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAdmin } from './isAdmin.js';
import { isOwnerOrSudo } from './isOwner.js';
import { applyFont } from './fonts/index.js';
import { getFooter, getAntiMediaMessage } from '../silaconfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Store anti-media settings for each group
const antiMediaSettings = new Map();

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antimedia.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antimedia_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiMediaSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { 
                enabled: false, 
                actions: { 
                    image: false, 
                    video: false, 
                    audio: false, 
                    document: false, 
                    sticker: false, 
                    text: false, 
                    emoji: false 
                }, 
                action: 'delete' 
            };
        }
    } catch (error) {}
    return antiMediaSettings.get(groupId) || { 
        enabled: false, 
        actions: { 
            image: false, 
            video: false, 
            audio: false, 
            document: false, 
            sticker: false, 
            text: false, 
            emoji: false 
        }, 
        action: 'delete' 
    };
}

export async function saveAntiMediaSettings(groupId, settings) {
    antiMediaSettings.set(groupId, settings);
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
export async function addAntiMediaWarn(groupId, userId) {
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

export async function resetAntiMediaWarns(groupId, userId) {
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

// ============ MEDIA DETECTION ============
export function detectMessageType(msg) {
    if (msg.message?.imageMessage) return 'image';
    if (msg.message?.videoMessage) return 'video';
    if (msg.message?.audioMessage) return 'audio';
    if (msg.message?.documentMessage) return 'document';
    if (msg.message?.stickerMessage) return 'sticker';
    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) return 'text';
    return null;
}

export function containsOnlyEmojis(text) {
    if (!text) return false;
    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    return emojiRegex.test(text);
}

// ============ MAIN HANDLER ============
export async function handleAntiMedia(sock, msg, chatId, senderJid, messageType, textContent, botName, botFont) {
    try {
        const settings = await getAntiMediaSettings(chatId);
        if (!settings.enabled) return false;
        
        const isEnabled = settings.actions[messageType];
        if (!isEnabled) return false;
        
        const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (isSenderAdmin.isSenderAdmin || isOwner) return false;
        
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {}
        
        let mediaTypeName = messageType;
        if (messageType === 'text' && textContent && containsOnlyEmojis(textContent)) {
            mediaTypeName = 'emoji';
        }
        
        const warningText = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 📵 @${senderJid.split('@')[0]} sent ${mediaTypeName}*
*┋ •> 📋 ${getAntiMediaMessage(mediaTypeName)}*
*┋ •> 🔒 message deleted*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        
        await sock.sendMessage(chatId, { 
            text: warningText, 
            contextInfo: { mentionedJid: [senderJid] } 
        });
        
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                const kickText = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 🚫 @${senderJid.split('@')[0]} kicked for sending ${mediaTypeName}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
                await sock.sendMessage(chatId, { 
                    text: kickText, 
                    mentions: [senderJid] 
                });
            }
        } else if (action === 'warn') {
            const warnCount = await addAntiMediaWarn(chatId, senderJid);
            
            if (warnCount >= 3) {
                await resetAntiMediaWarns(chatId, senderJid);
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                    const kickText = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 🚨 @${senderJid.split('@')[0]} kicked for 3 media warnings*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
                    await sock.sendMessage(chatId, { 
                        text: kickText, 
                        mentions: [senderJid] 
                    });
                }
            } else {
                const warnText = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> ⚠️ @${senderJid.split('@')[0]} warning #${warnCount}/3*
*┋ •> 📋 ${getAntiMediaMessage(mediaTypeName)}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
                await sock.sendMessage(chatId, { 
                    text: warnText, 
                    mentions: [senderJid] 
                });
            }
        }
        
        return true;
    } catch (error) {
        console.error('Anti-media error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiMediaCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        const errorMsg = `❌ this command can only be used in groups!`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
        }
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
        const errorMsg = `❌ only group admins and bot owner can use this command!`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
        }
        return;
    }
    
    const currentSettings = await getAntiMediaSettings(chatId);
    const styledName = applyFont(botName, botFont);
    
    // Check if first arg is a media type
    const mediaTypes = ['image', 'video', 'audio', 'document', 'sticker', 'text', 'emoji'];
    let targetMediaType = null;
    let action = args[0]?.toLowerCase();
    
    if (mediaTypes.includes(action)) {
        targetMediaType = action;
        action = args[1]?.toLowerCase();
    }
    
    // Show status
    if (!action) {
        if (targetMediaType) {
            // Show status for specific media type
            const isEnabled = currentSettings.actions[targetMediaType] || false;
            const statusText = isEnabled ? '✅ BLOCKED' : '❌ ALLOWED';
            const message = `*╭┈┈┄⊰ ${styledName} - ANTI ${targetMediaType.toUpperCase()} ⊱┄┄┄◈*
*┋*
*┋ •> 🔒 status: ${statusText}*
*┋*
*┋ •> 📋 usage:*
*┋ •> ${prefix}anti${targetMediaType} on - block ${targetMediaType}*
*┋ •> ${prefix}anti${targetMediaType} off - allow ${targetMediaType}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
            if (sock.sendStyledMessage) {
                await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        } else {
            // Show full status
            const statusText = currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED';
            const actionText = currentSettings.action === 'kick' ? '🚫 kick' : (currentSettings.action === 'warn' ? '⚠️ warn' : '📵 delete');
            
            const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 🔒 overall status: ${statusText}*
*┋ •> ⚡ action: ${actionText}*
*┋*
*┋ •> 📷 image: ${currentSettings.actions.image ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 🎥 video: ${currentSettings.actions.video ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 🎵 audio: ${currentSettings.actions.audio ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 📄 document: ${currentSettings.actions.document ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 🏷️ sticker: ${currentSettings.actions.sticker ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 📝 text: ${currentSettings.actions.text ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋ •> 😀 emoji: ${currentSettings.actions.emoji ? '✅ BLOCKED' : '❌ ALLOWED'}*
*┋*
*┋ •> 📋 commands:*
*┋ •> ${prefix}antimedia on/off*
*┋ •> ${prefix}antimedia action delete/warn/kick*
*┋ •> ${prefix}antiimage on/off*
*┋ •> ${prefix}antivideo on/off*
*┋ •> ${prefix}antiaudio on/off*
*┋ •> ${prefix}antidocument on/off*
*┋ •> ${prefix}antisticker on/off*
*┋ •> ${prefix}antitext on/off*
*┋ •> ${prefix}antiemoji on/off*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
            if (sock.sendStyledMessage) {
                await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
    }
    
    // Handle enable/disable for specific media type
    if (targetMediaType && (action === 'on' || action === 'enable')) {
        currentSettings.actions[targetMediaType] = true;
        currentSettings.enabled = true;
        await saveAntiMediaSettings(chatId, currentSettings);
        
        const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 📵 ${targetMediaType} is now BLOCKED!*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        return;
    }
    
    if (targetMediaType && (action === 'off' || action === 'disable')) {
        currentSettings.actions[targetMediaType] = false;
        // Check if any media type is still enabled
        const anyEnabled = Object.values(currentSettings.actions).some(v => v === true);
        currentSettings.enabled = anyEnabled;
        await saveAntiMediaSettings(chatId, currentSettings);
        
        const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> ✅ ${targetMediaType} is now ALLOWED!*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
        return;
    }
    
    // Handle main anti-media commands
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiMediaSettings(chatId, currentSettings);
        const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 📵 anti-media has been ENABLED*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    } 
    else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiMediaSettings(chatId, currentSettings);
        const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> 🔓 anti-media has been DISABLED*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    }
    else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(newAction)) {
            const errorMsg = `❌ invalid action! use: ${prefix}antimedia action delete/warn/kick`;
            if (sock.sendStyledMessage) {
                await sock.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        currentSettings.action = newAction;
        await saveAntiMediaSettings(chatId, currentSettings);
        const message = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*
*┋*
*┋ •> ⚡ action set to: ${newAction.toUpperCase()}*
*┋*
*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*
${getFooter()}`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, message, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        }
    }
    else {
        const errorMsg = `❌ invalid option! use: ${prefix}antimedia <on/off/action> or ${prefix}anti<type> <on/off>`;
        if (sock.sendStyledMessage) {
            await sock.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
        }
    }
}

export default {
    getAntiMediaSettings,
    saveAntiMediaSettings,
    addAntiMediaWarn,
    resetAntiMediaWarns,
    detectMessageType,
    containsOnlyEmojis,
    handleAntiMedia,
    handleAntiMediaCommand
};
