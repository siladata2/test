// ============================================
// AUTO SAVE STATUS MODULE
// Save status updates when requested
// Powered by SILA TECH
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { applyFont } from '../../sila/fonts/index.js';
import { getContextInfo, getFooter } from '../../silaconfig.js';
import fs from 'fs';

let autoSaveConfig = {
    enabled: true,
    saveKeywords: ['save', 'save it', 'send', 'send it', 'okoa', 'tuma', 'status', 'hifadhi', 'toa', 'nisaidie']
};

const CONFIG_FILE = './silamd/database/auto_save_config.json';

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            autoSaveConfig = { ...autoSaveConfig, ...saved };
        }
    } catch (e) {}
}

function saveConfig() {
    try {
        const dir = './silamd/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(autoSaveConfig, null, 2));
    } catch (e) {}
}

loadConfig();

export async function handleStatusSaver(sock, message) {
    if (!autoSaveConfig.enabled) return false;
    
    try {
        if (message.message?.extendedTextMessage?.contextInfo) {
            const replyText = message.message.extendedTextMessage.text?.trim().toLowerCase();
            const quotedInfo = message.message.extendedTextMessage.contextInfo;

            if (
                autoSaveConfig.saveKeywords.includes(replyText) &&
                quotedInfo?.participant?.endsWith('@s.whatsapp.net') &&
                quotedInfo?.remoteJid === "status@broadcast"
            ) {
                const senderJid = message.key?.remoteJid;
                if (!senderJid || !senderJid.includes('@')) return false;

                const quotedMsg = quotedInfo.quotedMessage;
                if (!quotedMsg) return false;

                const mediaType = Object.keys(quotedMsg || {})[0];
                if (!mediaType || !quotedMsg[mediaType]) return false;

                let statusCaption = "";
                if (quotedMsg[mediaType]?.caption) {
                    statusCaption = quotedMsg[mediaType].caption;
                } else if (quotedMsg?.conversation) {
                    statusCaption = quotedMsg.conversation;
                }

                const stream = await downloadContentFromMessage(
                    quotedMsg[mediaType],
                    mediaType.replace("Message", "")
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                const poweredBy = 'SILA TECH';
                const savetex = `╭━━〔 STATUS SAVER 〕━━┈⊷
┃ SILA SMD STATUS SAVER
╰━━━━━━━━━━━━━━┈⊷

> ${poweredBy}`;

                if (mediaType === "imageMessage") {
                    await sock.sendMessage(senderJid, { 
                        image: buffer, 
                        caption: `${savetex}\n\n${statusCaption || ""}` 
                    });
                } else if (mediaType === "videoMessage") {
                    await sock.sendMessage(senderJid, { 
                        video: buffer, 
                        caption: `${savetex}\n\n${statusCaption || ""}` 
                    });
                } else if (mediaType === "audioMessage") {
                    await sock.sendMessage(senderJid, { 
                        audio: buffer, 
                        mimetype: 'audio/mp4' 
                    });
                } else {
                    await sock.sendMessage(senderJid, { 
                        text: `${savetex}\n\n${statusCaption || "Status saved!"}` 
                    });
                }

                console.log(`Status saved for ${senderJid.split('@')[0]}`);
                return true;
            }
        }
    } catch (error) {
        console.error('Status save error:', error.message);
        return false;
    }
}

export async function handleAutoSaveCommand(sock, msg, args, prefix, chatId, senderJid, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
        return;
    }
    
    if (!args[0]) {
        const status = autoSaveConfig.enabled ? 'ENABLED' : 'DISABLED';
        const poweredBy = 'SILA TECH';
        
        const message = `╭━━〔 AUTO SAVE STATUS 〕━━┈⊷
┃
┃ Status: ${status}
┃ Keywords: ${autoSaveConfig.saveKeywords.join(', ')}
┃
┃ Usage:
┃ ${prefix}autosave on - Enable
┃ ${prefix}autosave off - Disable
┃
╰━━━━━━━━━━━━━━┈⊷
> ${poweredBy}`;
        
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });
        return;
    }
    
    if (args[0].toLowerCase() === 'on') {
        autoSaveConfig.enabled = true;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto save status has been enabled.' }, { quoted: msg });
    } else if (args[0].toLowerCase() === 'off') {
        autoSaveConfig.enabled = false;
        saveConfig();
        await sock.sendMessage(chatId, { text: 'Auto save status has been disabled.' }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid option. Use on or off' }, { quoted: msg });
    }
}

export default { 
    name: 'autosave',
    description: 'toggle auto save status',
    category: 'automation',
    alias: ['saveauto', 'autosavestatus'],
    ownerOnly: true,
    execute: async (sock, msg, args, prefix, config) => {
        const chatId = msg.key.remoteJid;
        const isOwner = await config.isOwnerAsync(msg);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Only the bot owner can use this command.' }, { quoted: msg });
            return;
        }
        
        await handleAutoSaveCommand(sock, msg, args, prefix, chatId, msg.key.participant || chatId, isOwner);
    }
};
