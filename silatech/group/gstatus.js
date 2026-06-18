// ============================================
// POSTSTATUS COMMAND - Upload status to group
// Group Admin Only
// Powered by SILA TECH
// ============================================

import { isAdmin } from '../../sila/isAdmin.js';
import { isOwnerOrSudo } from '../../sila/isOwner.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../../temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export default {
    name: 'poststatus',
    description: 'Post/upload status update to group',
    category: 'group',
    alias: ['statuspost', 'uploadstatus', 'sendstatus', 'groupstatus'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        // Check if in group
        if (!chatId.endsWith('@g.us')) {
            const errorMsg = `❌ *This command can only be used in groups!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Check if sender is admin or owner
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (!adminStatus.isSenderAdmin && !isOwner) {
            const errorMsg = `❌ *Only group admins can post status!*`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
            return;
        }
        
        // Get status to post
        let imageBuffer = null;
        let videoBuffer = null;
        let textMessage = args.join(' ') || '';
        let isTextOnly = false;
        
        // Check if replying to a status message
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            
            if (quotedMsg.imageMessage) {
                const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                imageBuffer = buffer;
                textMessage = quotedMsg.imageMessage.caption || textMessage;
            }
            else if (quotedMsg.videoMessage) {
                const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                videoBuffer = buffer;
                textMessage = quotedMsg.videoMessage.caption || textMessage;
            }
            else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
                textMessage = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || textMessage;
                isTextOnly = true;
            }
        }
        // Check if current message has image/video
        else if (msg.message?.imageMessage) {
            const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            imageBuffer = buffer;
            textMessage = msg.message.imageMessage.caption || textMessage;
        }
        else if (msg.message?.videoMessage) {
            const stream = await downloadContentFromMessage(msg.message.videoMessage, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            videoBuffer = buffer;
            textMessage = msg.message.videoMessage.caption || textMessage;
        }
        else if (!textMessage) {
            // No media and no text
            const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
            const message = `*╭┈┈┄⊰ ${styledName} - POST STATUS ⊱┄┄┄◈*
┋
┋ •> 📋 *Usage:*
┋ •> Send image/video with caption: ${prefix}poststatus
┋ •> Reply to status with: ${prefix}poststatus
┋ •> ${prefix}poststatus <text message>
┋
┋ •> 📌 *Examples:*
┋ •> Send image then ${prefix}poststatus
┋ •> ${prefix}poststatus Hello everyone!
┋
╰┄┄┄┄┄┈┈┈┈┄┄┄◈
> ® ${config.POWERED_BY}`;
            
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, message, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: message }, { quoted: msg });
            }
            return;
        }
        
        const styledName = config.applyFont(config.BOT_NAME, config.BOT_FONT);
        const footer = config.getFooter();
        
        try {
            let statusMessage = '';
            
            if (imageBuffer) {
                // Save temp file
                const tempFile = path.join(TEMP_DIR, `status_${Date.now()}.jpg`);
                fs.writeFileSync(tempFile, imageBuffer);
                
                statusMessage = `*╭┈┈┄⊰ ${styledName} - GROUP STATUS ⊱┄┄┄◈*\n\n`;
                if (textMessage) statusMessage += `*┋ •> 📝 ${textMessage}*\n\n`;
                statusMessage += `*┋ •> 👤 Posted by: @${senderJid.split('@')[0]}*\n`;
                statusMessage += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${footer}`;
                
                await sock.sendMessage(chatId, {
                    image: { url: tempFile },
                    caption: statusMessage,
                    contextInfo: {
                        ...config.getContextInfo(msg),
                        mentionedJid: [senderJid]
                    }
                });
                
                fs.unlinkSync(tempFile);
            }
            else if (videoBuffer) {
                const tempFile = path.join(TEMP_DIR, `status_${Date.now()}.mp4`);
                fs.writeFileSync(tempFile, videoBuffer);
                
                statusMessage = `*╭┈┈┄⊰ ${styledName} - GROUP STATUS ⊱┄┄┄◈*\n\n`;
                if (textMessage) statusMessage += `*┋ •> 📝 ${textMessage}*\n\n`;
                statusMessage += `*┋ •> 👤 Posted by: @${senderJid.split('@')[0]}*\n`;
                statusMessage += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${footer}`;
                
                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    caption: statusMessage,
                    contextInfo: {
                        ...config.getContextInfo(msg),
                        mentionedJid: [senderJid]
                    }
                });
                
                fs.unlinkSync(tempFile);
            }
            else {
                // Text only status
                statusMessage = `*╭┈┈┄⊰ ${styledName} - GROUP STATUS ⊱┄┄┄◈*\n\n`;
                statusMessage += `*┋ •> 📝 ${textMessage}*\n\n`;
                statusMessage += `*┋ •> 👤 Posted by: @${senderJid.split('@')[0]}*\n`;
                statusMessage += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${footer}`;
                
                await sock.sendMessage(chatId, {
                    text: statusMessage,
                    contextInfo: {
                        ...config.getContextInfo(msg),
                        mentionedJid: [senderJid]
                    }
                });
            }
            
        } catch (error) {
            const errorMsg = `❌ *Failed to post status!*\nError: ${error.message}`;
            if (config.sendStyledMessage) {
                await config.sendStyledMessage(sock, chatId, errorMsg, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
            }
        }
    }
};
