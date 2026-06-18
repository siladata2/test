// ============================================
// SILA ANTI-DELETE - Message Delete Detection
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

// Store anti-delete settings for each group
const antiDeleteSettings = new Map();
export const deletedMessagesCache = new Map();

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
    return path.join(ROOT_DIR, 'silamd', 'database', 'antidelete.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'silamd', 'database', 'antidelete_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiDeleteSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'warn', logChannel: null };
        }
    } catch (error) {}
    return antiDeleteSettings.get(groupId) || { enabled: false, action: 'warn', logChannel: null };
}

export async function saveAntiDeleteSettings(groupId, settings) {
    antiDeleteSettings.set(groupId, settings);
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
export async function addAntiDeleteWarn(groupId, userId) {
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

export async function resetAntiDeleteWarns(groupId, userId) {
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

// ============ CACHE MANAGEMENT ============
export function cacheMessage(chatId, messageId, messageData) {
    const key = `${chatId}|${messageId}`;
    deletedMessagesCache.set(key, { ...messageData, timestamp: Date.now() });
    setTimeout(() => deletedMessagesCache.delete(key), 5 * 60 * 1000);
}

// ============ GET MESSAGE TYPE ============
function getMessageType(message) {
    if (!message) return 'Unknown';
    
    const type = Object.keys(message)[0];
    const typeMap = {
        conversation: 'Text',
        imageMessage: 'Image',
        videoMessage: 'Video',
        audioMessage: 'Audio',
        documentMessage: 'Document',
        stickerMessage: 'Sticker',
        extendedTextMessage: 'Text with Link',
        contactMessage: 'Contact',
        locationMessage: 'Location',
        groupStatusMentionMessage: 'Status Mention'
    };
    
    return typeMap[type] || type.replace('Message', '') || 'Unknown';
}

// ============ DELETED TEXT HANDLER ============
async function DeletedText(sock, mek, jid, deleteInfo, isGroup, update, botName, botFont) {
    try {
        const messageContent = mek.message?.conversation 
            || mek.message?.extendedTextMessage?.text
            || mek.message?.imageMessage?.caption
            || mek.message?.videoMessage?.caption
            || mek.message?.documentMessage?.caption
            || '🚫 Content unavailable (may be media without caption)';
        
        const styledName = applyFont(botName, botFont);
        
        const fullMessage = `
╭╴╴╴╴╴╴╴╴╴╴╴╴╴╴╮
│ 🗑️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🛡️
╰╴╴╴╴╴╴╴╴╴╴╴╴╴╴╯
${deleteInfo}
┃✉️ CONTENT :
${messageContent}
┃└─────────────┈⊷
╰──────────────────┈⊷
${NEWSLETTER_CONFIG.watermark}`;

        const mentionedJids = isGroup 
            ? [update.key.participant, mek.key.participant].filter(Boolean) 
            : [update.key.remoteJid].filter(Boolean);

        await sock.sendMessage(
            jid,
            {
                image: { url: NEWSLETTER_CONFIG.imageUrl },
                caption: fullMessage,
                contextInfo: {
                    ...getNewsletterContext(),
                    mentionedJid: mentionedJids,
                },
            },
            { quoted: mek }
        );
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
}

// ============ DELETED MEDIA HANDLER ============
async function DeletedMedia(sock, mek, jid, deleteInfo, botName, botFont) {
    try {
        const antideletedmek = structuredClone(mek.message);
        const messageType = Object.keys(antideletedmek)[0];

        const mediaTypes = {
            imageMessage: { type: 'image', key: 'imageMessage' },
            videoMessage: { type: 'video', key: 'videoMessage' },
            audioMessage: { type: 'audio', key: 'audioMessage' },
            documentMessage: { type: 'document', key: 'documentMessage' },
            stickerMessage: { type: 'sticker', key: 'stickerMessage' }
        };

        const currentType = mediaTypes[messageType];
        const styledName = applyFont(botName, botFont);

        if (currentType) {
            const caption = `
╭╴╴╴╴╴╴╴╴╴╴╴╴╴╴╮
│ 🗑️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄 🛡️
╰╴╴╴╴╴╴╴╴╴╴╴╴╴╴╯
${deleteInfo}
┃└─────────────┈⊷
╰──────────────────┈⊷
${NEWSLETTER_CONFIG.watermark}`;

            if (['image', 'video'].includes(currentType.type)) {
                const mediaUrl = antideletedmek[currentType.key]?.url || NEWSLETTER_CONFIG.imageUrl;
                await sock.sendMessage(jid, { 
                    [currentType.type]: { url: mediaUrl },
                    caption: caption,
                    contextInfo: {
                        ...getNewsletterContext(),
                        mentionedJid: [mek.sender],
                    }
                }, { quoted: mek });
            } else {
                await sock.sendMessage(jid, { 
                    image: { url: NEWSLETTER_CONFIG.imageUrl },
                    caption: `*⚠️ Deleted ${currentType.type.toUpperCase()} Alert 🚨*`,
                    contextInfo: getNewsletterContext()
                });
                
                await sock.sendMessage(jid, { 
                    text: caption,
                    contextInfo: getNewsletterContext()
                }, { quoted: mek });

                if (antideletedmek[currentType.key]?.url) {
                    await sock.sendMessage(jid, {
                        [currentType.type]: { url: antideletedmek[currentType.key].url },
                        contextInfo: getNewsletterContext()
                    }, { quoted: mek });
                }
            }
        } else {
            antideletedmek[messageType].contextInfo = {
                ...getNewsletterContext(),
                stanzaId: mek.key.id,
                participant: mek.sender,
                quotedMessage: mek.message,
            };
            await sock.relayMessage(jid, antideletedmek, {});
        }
    } catch (error) {
        console.error('Error in DeletedMedia:', error);
    }
}

// ============ MAIN HANDLER ============
export async function handleMessageDelete(sock, chatId, messageId, senderId, deletedMsg, botName, botFont) {
    try {
        if (!chatId.endsWith('@g.us')) return false;
        
        const settings = await getAntiDeleteSettings(chatId);
        if (!settings.enabled) return false;
        
        const isDeleterAdmin = await isAdmin(sock, chatId, senderId);
        const isDeleterOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (isDeleterAdmin.isSenderAdmin || isDeleterOwner) return false;
        
        const action = settings.action || 'warn';
        const deleteTime = new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        const deleteDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Get group name
        let groupName = chatId;
        try {
            const metadata = await sock.groupMetadata(chatId);
            groupName = metadata.subject || chatId;
        } catch (e) {}
        
        const sender = deletedMsg.sender?.split('@')[0] || 'Unknown';
        const deleter = senderId?.split('@')[0] || 'Unknown';
        const messageType = getMessageType(deletedMsg.message || {});
        
        let deleteInfo, jid;
        
        if (chatId.endsWith('@g.us')) {
            deleteInfo = `
┃📅 DATE      : ${deleteDate}
┃⏰ TIME      : ${deleteTime}
┃👤 SENDER    : @${sender}
┃👥 GROUP     : ${groupName}
┃🗑️ DELETED BY: @${deleter}
┃📌 TYPE      : ${messageType}
┃⚠️ ACTION    : Message Deletion Detected`;
            jid = settings.logChannel || chatId;
        } else {
            deleteInfo = `
┃📅 DATE   : ${deleteDate}
┃⏰ TIME   : ${deleteTime}
┃📱 SENDER : @${sender}
┃📌 TYPE   : ${messageType}
┃⚠️ ACTION : Message Deletion Detected`;
            jid = settings.logChannel || chatId;
        }
        
        // Check if it's text or media
        if (deletedMsg.message?.conversation || deletedMsg.message?.extendedTextMessage || 
            deletedMsg.message?.imageMessage?.caption || deletedMsg.message?.videoMessage?.caption) {
            await DeletedText(sock, deletedMsg, jid, deleteInfo, chatId.endsWith('@g.us'), 
                { key: { participant: senderId, remoteJid: chatId } }, botName, botFont);
        } else {
            await DeletedMedia(sock, deletedMsg, jid, deleteInfo, botName, botFont);
        }
        
        // Handle action (warn or kick)
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            if (!adminStatus.isSenderAdmin && adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, { 
                    text: `🚫 @${deleter} KICKED for deleting messages!`, 
                    mentions: [senderId] 
                });
            }
        } else if (action === 'warn') {
            const warnCount = await addAntiDeleteWarn(chatId, senderId);
            
            if (warnCount >= 3) {
                await resetAntiDeleteWarns(chatId, senderId);
                const adminStatus = await isAdmin(sock, chatId, senderId);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, { 
                        text: `🚨 @${deleter} KICKED for 3 delete warnings!`, 
                        mentions: [senderId] 
                    });
                }
            } else {
                await sock.sendMessage(chatId, { 
                    text: `⚠️ @${deleter} WARNING #${warnCount}/3 for deleting messages!`, 
                    mentions: [senderId] 
                });
            }
        }
        
        return true;
    } catch (error) { 
        console.error('Anti-delete error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiDeleteCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const currentSettings = await getAntiDeleteSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n*┋ •> ⚡ Action:* ${currentSettings.action}\n*┋ •> 📝 Log Channel:* ${currentSettings.logChannel || 'Same group'}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antidelete on/off\n*┋ •> ${prefix}antidelete action warn/kick\n*┋ •> ${prefix}antidelete log <group_jid>\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🗑️ Anti-delete has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-delete has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antidelete action warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'log') {
        const logJid = args[1];
        if (!logJid || !logJid.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid group JID! Use a valid group JID.`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.logChannel = logJid;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 📝 Log channel set to:* *${logJid}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antidelete <on/off/action/log>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiDeleteSettings,
    saveAntiDeleteSettings,
    addAntiDeleteWarn,
    resetAntiDeleteWarns,
    cacheMessage,
    deletedMessagesCache,
    handleMessageDelete,
    handleAntiDeleteCommand
};
